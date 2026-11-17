package com.muslim.azan.service

import android.content.Context
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.muslim.azan.data.NativePreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * WorkManager background worker that uploads saved offline recitation clips
 * once network connectivity is restored, enforcing retry limits cleanly.
 */
class RecitationUploadWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val pending = RecitationStorageManager.getPendingUploadRecordings(applicationContext)
        if (pending.isEmpty()) {
            return Result.success()
        }

        if (!QuranRecitationManager.isNetworkConnected(applicationContext)) {
            return Result.retry()
        }

        val prefs = NativePreferences(applicationContext)
        var shouldRetryQueue = false

        for (record in pending) {
            val clip = RecitationStorageManager.readRecordingClip(applicationContext, record)
            if (clip == null) {
                RecitationStorageManager.updateRecordingStatus(
                    context = applicationContext,
                    id = record.id,
                    status = RecitationStorageManager.STATUS_FAILED,
                    errorMsg = "الملف الصوتي المحفوظ غير موجود على الجهاز"
                )
                continue
            }

            RecitationStorageManager.updateRecordingStatus(
                context = applicationContext,
                id = record.id,
                status = RecitationStorageManager.STATUS_UPLOADING,
                errorMsg = ""
            )

            val evalRes = QuranRecitationManager.evaluateClipWithServer(
                context = applicationContext,
                serverBaseUrl = prefs.sheikhServerBaseUrl,
                clip = clip,
                expectedText = record.expectedText,
                surahName = record.surahName,
                surahNumber = record.surahNumber,
                ayahNumber = record.ayahNumber,
                dialect = record.dialect,
                mode = record.mode,
                trainingMode = record.trainingMode,
                adjacentAyahsText = record.adjacentAyahsText,
                analysisSpeed = record.analysisSpeed,
                unitType = record.unitType,
                pageNumber = record.pageNumber
            )

            evalRes.onSuccess { eval ->
                val evalJson = serializeEvalResult(eval)
                RecitationStorageManager.updateRecordingStatus(
                    context = applicationContext,
                    id = record.id,
                    status = RecitationStorageManager.STATUS_COMPLETED,
                    errorMsg = "",
                    evaluationJson = evalJson
                )
                recordMasteryFromBackgroundEval(prefs, record, eval)
                Log.d(TAG, "Background queued recitation uploaded & evaluated: ${record.id}")
            }.onFailure { err ->
                val msg = err.message ?: "تعذر رفع التلاوة"
                val isPermanentPayloadErr = msg.contains("صيغة الملف") || msg.contains("فارغ")
                if (!isPermanentPayloadErr && record.retryCount < 5) {
                    RecitationStorageManager.updateRecordingStatus(
                        context = applicationContext,
                        id = record.id,
                        status = RecitationStorageManager.STATUS_PENDING_UPLOAD,
                        errorMsg = msg,
                        incrementRetry = true
                    )
                    shouldRetryQueue = true
                } else {
                    RecitationStorageManager.updateRecordingStatus(
                        context = applicationContext,
                        id = record.id,
                        status = RecitationStorageManager.STATUS_FAILED,
                        errorMsg = msg,
                        incrementRetry = true
                    )
                }
            }
        }

        return if (shouldRetryQueue) Result.retry() else Result.success()
    }

    private fun recordMasteryFromBackgroundEval(
        prefs: NativePreferences,
        record: StoredRecitationRecord,
        eval: NativeEvaluationResult
    ) {
        val wrong = eval.wordResults.filter { it.status == "error" || it.status == "missing" }
        val correct = eval.wordResults.filter { it.status == "correct" }
        val passed = eval.status == "perfect" || (eval.score >= 80 && wrong.isEmpty())
        prefs.sheikhSessionsCount += 1
        prefs.sheikhCorrectWordsCount += correct.size
        val todayIso = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val prevMap = prefs.getSheikhMasteredMap()
        val delta = if (passed && record.unitType == "ayah" && !prevMap.containsKey("${record.surahNumber}:${record.ayahNumber}")) 1 else 0
        prefs.recordSheikhDailyProgress(todayIso, delta, correct.size, eval.score)
        if (passed && record.unitType == "ayah") {
            prefs.recordSheikhAyahMastered(record.surahNumber, record.ayahNumber, eval.score)
        } else if (wrong.isNotEmpty()) {
            prefs.recordSheikhWeakAyahError(record.surahNumber, record.ayahNumber, record.surahName, wrong.map { it.expectedWord })
        }
    }

    private fun serializeEvalResult(eval: NativeEvaluationResult): String {
        val obj = JSONObject().apply {
            put("transcribedText", eval.transcribedText)
            put("status", eval.status)
            put("score", eval.score)
            put("paceStyle", eval.paceStyle)
            put("mistakeSummary", eval.mistakeSummary)
            put("correctionHint", eval.correctionHint)
            val arr = JSONArray()
            eval.wordResults.forEach { w ->
                arr.put(
                    JSONObject().apply {
                        put("positionIndex", w.positionIndex)
                        put("expectedWord", w.expectedWord)
                        put("spokenWord", w.spokenWord)
                        put("status", w.status)
                        put("correctionNote", w.correctionNote)
                    }
                )
            }
            put("wordResults", arr)
        }
        return obj.toString()
    }

    companion object {
        private const val TAG = "RecitationUploadWorker"
        private const val UNIQUE_WORK_NAME = "sheikh_recitation_upload_queue"

        fun enqueue(context: Context) {
            try {
                val constraints = Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
                val req = OneTimeWorkRequestBuilder<RecitationUploadWorker>()
                    .setConstraints(constraints)
                    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                    .build()
                WorkManager.getInstance(context.applicationContext)
                    .enqueueUniqueWork(UNIQUE_WORK_NAME, ExistingWorkPolicy.REPLACE, req)
            } catch (e: Exception) {
                Log.w(TAG, "Unable to enqueue RecitationUploadWorker", e)
            }
        }
    }
}
