package com.muslim.azan.service

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

data class RecitationMetadata(
    val expectedText: String,
    val surahName: String,
    val surahNumber: Int,
    val ayahNumber: Int,
    val dialect: String,
    val mode: String,
    val trainingMode: Boolean,
    val adjacentAyahsText: String,
    val analysisSpeed: String = "balanced",
    val unitType: String = "ayah",
    val pageNumber: Int = 1
)

data class StoredRecitationRecord(
    val id: String,
    val fileName: String,
    val mimeType: String,
    val sizeBytes: Long,
    val durationMs: Long,
    val createdAtMs: Long,
    val expectedText: String,
    val surahName: String,
    val surahNumber: Int,
    val ayahNumber: Int,
    val dialect: String,
    val mode: String,
    val trainingMode: Boolean,
    val adjacentAyahsText: String,
    val analysisSpeed: String,
    val unitType: String,
    val pageNumber: Int,
    val status: String, // pending_upload | uploading | completed | failed
    val retryCount: Int = 0,
    val lastError: String = "",
    val evaluationJson: String = ""
)

/**
 * Persistent local storage, size/duration caps, and offline upload queue manager
 * for user recitation recordings in filesDir/sheikh_recordings/.
 */
object RecitationStorageManager {
    const val MAX_RECORDING_SECONDS: Int = 90
    const val MAX_PCM_BYTES: Int = 16000 * 2 * MAX_RECORDING_SECONDS // 2,880,000 bytes (~2.75 MB)
    const val MAX_IMPORT_FILE_BYTES: Int = 12 * 1024 * 1024 // 12 MB
    const val MAX_TOTAL_STORAGE_BYTES: Long = 40L * 1024L * 1024L // 40 MB
    const val MAX_STORED_CLIPS: Int = 20

    const val FOLDER_NAME = "sheikh_recordings"
    private const val QUEUE_INDEX_FILE = "recitation_queue_index.json"

    const val STATUS_PENDING_UPLOAD = "pending_upload"
    const val STATUS_UPLOADING = "uploading"
    const val STATUS_COMPLETED = "completed"
    const val STATUS_FAILED = "failed"

    private val lock = Any()

    // Pure JVM-testable buffer capacity helper
    fun computeRemainingPcmCapacity(currentPcmBytes: Int, maxPcmBytes: Int = MAX_PCM_BYTES): Int {
        return (maxPcmBytes - currentPcmBytes).coerceAtLeast(0)
    }

    // Pure JVM-testable chunk cap helper to eliminate OOM during long recordings
    fun capPcmChunkToWrite(incomingLength: Int, currentPcmBytes: Int, maxPcmBytes: Int = MAX_PCM_BYTES): Int {
        if (incomingLength <= 0) return 0
        return minOf(incomingLength, computeRemainingPcmCapacity(currentPcmBytes, maxPcmBytes))
    }

    // Pure JVM-testable quota eviction policy (preserves pending items when possible)
    fun pruneRecordsForQuota(
        records: List<StoredRecitationRecord>,
        maxCount: Int = MAX_STORED_CLIPS,
        maxTotalBytes: Long = MAX_TOTAL_STORAGE_BYTES
    ): Pair<List<StoredRecitationRecord>, List<StoredRecitationRecord>> {
        val kept = records.toMutableList()
        val evicted = mutableListOf<StoredRecitationRecord>()

        while (kept.size > maxCount || kept.sumOf { it.sizeBytes } > maxTotalBytes) {
            if (kept.isEmpty()) break
            // Evict oldest completed/failed item first before touching pending uploads
            val candidateIdx = kept.indexOfLast { it.status == STATUS_COMPLETED }
                .takeIf { it >= 0 }
                ?: kept.indexOfLast { it.status == STATUS_FAILED }.takeIf { it >= 0 }
                ?: kept.lastIndex
            evicted.add(kept.removeAt(candidateIdx))
        }
        return kept to evicted
    }

    fun serializeRecordsJson(records: List<StoredRecitationRecord>): String {
        val arr = JSONArray()
        records.forEach { rec ->
            arr.put(
                JSONObject().apply {
                    put("id", rec.id)
                    put("fileName", rec.fileName)
                    put("mimeType", rec.mimeType)
                    put("sizeBytes", rec.sizeBytes)
                    put("durationMs", rec.durationMs)
                    put("createdAtMs", rec.createdAtMs)
                    put("expectedText", rec.expectedText)
                    put("surahName", rec.surahName)
                    put("surahNumber", rec.surahNumber)
                    put("ayahNumber", rec.ayahNumber)
                    put("dialect", rec.dialect)
                    put("mode", rec.mode)
                    put("trainingMode", rec.trainingMode)
                    put("adjacentAyahsText", rec.adjacentAyahsText)
                    put("analysisSpeed", rec.analysisSpeed)
                    put("unitType", rec.unitType)
                    put("pageNumber", rec.pageNumber)
                    put("status", rec.status)
                    put("retryCount", rec.retryCount)
                    put("lastError", rec.lastError)
                    put("evaluationJson", rec.evaluationJson)
                }
            )
        }
        return arr.toString()
    }

    fun parseRecordsJson(raw: String?): List<StoredRecitationRecord> {
        if (raw.isNullOrBlank()) return emptyList()
        val list = mutableListOf<StoredRecitationRecord>()
        try {
            val arr = JSONArray(raw)
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                val id = o.optString("id", "")
                val fileName = o.optString("fileName", "")
                if (id.isBlank() || fileName.isBlank()) continue
                list.add(
                    StoredRecitationRecord(
                        id = id,
                        fileName = fileName,
                        mimeType = o.optString("mimeType", "audio/wav"),
                        sizeBytes = o.optLong("sizeBytes", 0L),
                        durationMs = o.optLong("durationMs", 0L),
                        createdAtMs = o.optLong("createdAtMs", 0L),
                        expectedText = o.optString("expectedText", ""),
                        surahName = o.optString("surahName", ""),
                        surahNumber = o.optInt("surahNumber", 1),
                        ayahNumber = o.optInt("ayahNumber", 1),
                        dialect = o.optString("dialect", "egyptian"),
                        mode = o.optString("mode", "recitation"),
                        trainingMode = o.optBoolean("trainingMode", false),
                        adjacentAyahsText = o.optString("adjacentAyahsText", ""),
                        analysisSpeed = o.optString("analysisSpeed", "balanced"),
                        unitType = o.optString("unitType", "ayah"),
                        pageNumber = o.optInt("pageNumber", 1),
                        status = o.optString("status", STATUS_PENDING_UPLOAD),
                        retryCount = o.optInt("retryCount", 0),
                        lastError = o.optString("lastError", ""),
                        evaluationJson = o.optString("evaluationJson", "")
                    )
                )
            }
        } catch (_: Exception) {}
        return list
    }

    private fun ensureDir(context: Context): File {
        val dir = File(context.filesDir, FOLDER_NAME)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun indexFile(context: Context): File = File(ensureDir(context), QUEUE_INDEX_FILE)

    fun saveNewRecording(
        context: Context,
        clip: PreparedWavClip,
        meta: RecitationMetadata,
        initialStatus: String = STATUS_PENDING_UPLOAD,
        initialError: String = ""
    ): StoredRecitationRecord = synchronized(lock) {
        val dir = ensureDir(context)
        val id = UUID.randomUUID().toString().take(12)
        val ext = when {
            clip.mimeType.contains("mpeg") || clip.mimeType.contains("mp3") -> "mp3"
            clip.mimeType.contains("mp4") || clip.mimeType.contains("m4a") -> "m4a"
            clip.mimeType.contains("ogg") -> "ogg"
            clip.mimeType.contains("webm") -> "webm"
            clip.mimeType.contains("flac") -> "flac"
            clip.mimeType.contains("3gp") -> "3gp"
            clip.mimeType.contains("amr") -> "amr"
            else -> "wav"
        }
        val safeFileName = "rec_${meta.surahNumber}_${meta.ayahNumber}_${id}.$ext"
        val audioFile = File(dir, safeFileName)
        audioFile.writeBytes(clip.wavBytes)

        val record = StoredRecitationRecord(
            id = id,
            fileName = safeFileName,
            mimeType = clip.mimeType,
            sizeBytes = clip.wavBytes.size.toLong(),
            durationMs = clip.durationMs,
            createdAtMs = System.currentTimeMillis(),
            expectedText = meta.expectedText,
            surahName = meta.surahName,
            surahNumber = meta.surahNumber,
            ayahNumber = meta.ayahNumber,
            dialect = meta.dialect,
            mode = meta.mode,
            trainingMode = meta.trainingMode,
            adjacentAyahsText = meta.adjacentAyahsText,
            analysisSpeed = meta.analysisSpeed,
            unitType = meta.unitType,
            pageNumber = meta.pageNumber,
            status = initialStatus,
            retryCount = 0,
            lastError = initialError,
            evaluationJson = ""
        )

        val existing = parseRecordsJson(readIndexRaw(context)).toMutableList()
        existing.add(0, record)
        val (kept, evicted) = pruneRecordsForQuota(existing)
        evicted.forEach { ev ->
            runCatching { File(dir, ev.fileName).delete() }
        }
        writeIndexRaw(context, serializeRecordsJson(kept))
        record
    }

    fun getRecordings(context: Context): List<StoredRecitationRecord> = synchronized(lock) {
        parseRecordsJson(readIndexRaw(context))
    }

    fun getPendingUploadRecordings(context: Context): List<StoredRecitationRecord> = synchronized(lock) {
        parseRecordsJson(readIndexRaw(context)).filter {
            it.status == STATUS_PENDING_UPLOAD || it.status == STATUS_UPLOADING
        }
    }

    fun updateRecordingStatus(
        context: Context,
        id: String,
        status: String,
        errorMsg: String = "",
        evaluationJson: String = "",
        incrementRetry: Boolean = false
    ): StoredRecitationRecord? = synchronized(lock) {
        val current = parseRecordsJson(readIndexRaw(context)).toMutableList()
        val idx = current.indexOfFirst { it.id == id }
        if (idx < 0) return@synchronized null
        val prev = current[idx]
        val updated = prev.copy(
            status = status,
            lastError = errorMsg,
            evaluationJson = evaluationJson.ifBlank { prev.evaluationJson },
            retryCount = if (incrementRetry) prev.retryCount + 1 else prev.retryCount
        )
        current[idx] = updated
        writeIndexRaw(context, serializeRecordsJson(current))
        updated
    }

    fun readRecordingClip(context: Context, record: StoredRecitationRecord): PreparedWavClip? {
        val f = File(ensureDir(context), record.fileName)
        if (!f.exists() || f.length() <= 0L) return null
        val bytes = f.readBytes()
        return PreparedWavClip(
            wavBytes = bytes,
            durationMs = record.durationMs,
            peakRms = 0.25,
            hasSpeechEnergy = true,
            mimeType = record.mimeType,
            fileName = record.fileName
        )
    }

    fun getRecordingFile(context: Context, record: StoredRecitationRecord): File {
        return File(ensureDir(context), record.fileName)
    }

    fun deleteRecording(context: Context, id: String): Boolean = synchronized(lock) {
        val dir = ensureDir(context)
        val current = parseRecordsJson(readIndexRaw(context)).toMutableList()
        val target = current.firstOrNull { it.id == id } ?: return@synchronized false
        runCatching { File(dir, target.fileName).delete() }
        current.removeAll { it.id == id }
        writeIndexRaw(context, serializeRecordsJson(current))
        true
    }

    fun deleteAllRecordings(context: Context): Int = synchronized(lock) {
        val dir = ensureDir(context)
        val current = parseRecordsJson(readIndexRaw(context))
        var removed = 0
        current.forEach { rec ->
            if (runCatching { File(dir, rec.fileName).delete() }.getOrDefault(false)) {
                removed++
            }
        }
        writeIndexRaw(context, "[]")
        removed
    }

    private fun readIndexRaw(context: Context): String? {
        val f = indexFile(context)
        return if (f.exists()) runCatching { f.readText(Charsets.UTF_8) }.getOrNull() else null
    }

    private fun writeIndexRaw(context: Context, json: String) {
        runCatching { indexFile(context).writeText(json, Charsets.UTF_8) }
    }
}
