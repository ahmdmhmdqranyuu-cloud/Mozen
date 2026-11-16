package com.muslim.azan.service

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaMetadataRetriever
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.media.ToneGenerator
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.OpenableColumns
import android.util.Base64
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.sqrt

enum class NativeUploadState(val arabicLabel: String) {
    IDLE("جاهز للتسجيل والتسميع"),
    RECORDING("جاري التسجيل... رتّل الآية بوضوح"),
    PREPARING("جاري تجهيز الملف الصوتي والتحقق منه..."),
    UPLOADING("جاري الإرسال إلى محرك التحليل..."),
    ANALYZING("جاري تحليل التلاوة ومطابقة الكلمات..."),
    COMPLETED("اكتمل التحليل ✓"),
    FAILED("فشل الإرسال — يمكنك إعادة المحاولة")
}

data class NativeWordResult(
    val positionIndex: Int,
    val expectedWord: String,
    val spokenWord: String = "",
    val status: String = "pending", // correct | error | missing | uncertain | pending
    val correctionNote: String = ""
)

data class NativeEvaluationResult(
    val transcribedText: String,
    val status: String, // perfect | minor_issue | error | not_recited
    val score: Int,
    val paceStyle: String = "tadwir",
    val acceptedQiraatVariant: Boolean = false,
    val jumpedToOtherAyah: Boolean = false,
    val jumpedAyahNote: String = "",
    val extraOrRepeatedWords: List<String> = emptyList(),
    val unclearAudioWarning: String = "",
    val wordResults: List<NativeWordResult> = emptyList(),
    val mistakeSummary: String = "",
    val correctionHint: String = "",
    val sheikhScript: String = ""
)

data class PreparedWavClip(
    val wavBytes: ByteArray,
    val durationMs: Long,
    val peakRms: Double,
    val hasSpeechEnergy: Boolean,
    val mimeType: String = "audio/wav",
    val fileName: String = "recording.wav"
)

object QuranRecitationManager {
    private const val TAG = "QuranRecitationMgr"
    private const val SAMPLE_RATE = 16000
    private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
    private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    private const val MIN_WAV_BYTES = 1000

    private val _uploadState = MutableStateFlow(NativeUploadState.IDLE)
    val uploadState: StateFlow<NativeUploadState> = _uploadState.asStateFlow()

    private val _micLevel = MutableStateFlow(0f)
    val micLevel: StateFlow<Float> = _micLevel.asStateFlow()

    private val _recordingSeconds = MutableStateFlow(0)
    val recordingSeconds: StateFlow<Int> = _recordingSeconds.asStateFlow()

    @Volatile
    private var isRecordingFlag = false
    private var audioRecord: AudioRecord? = null
    private var recordThread: Thread? = null
    private var pcmStream: ByteArrayOutputStream? = null
    private var recordStartMs = 0L
    private var peakRms = 0.0
    private var audibleFrames = 0
    private var activeSensitivity = 1.0f
    private var activeGateThreshold = 0.008
    private var testMediaPlayer: MediaPlayer? = null

    var lastPreparedClip: PreparedWavClip? = null
        private set

    fun hasMicrophonePermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun isNetworkConnected(context: Context): Boolean {
        return try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                ?: return false
            val activeNet = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(activeNet) ?: return false
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } catch (_: Exception) {
            true
        }
    }

    fun playErrorTickSound() {
        try {
            val tg = ToneGenerator(AudioManager.STREAM_MUSIC, 65)
            tg.startTone(ToneGenerator.TONE_PROP_BEEP, 95)
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                runCatching { tg.release() }
            }, 220)
        } catch (_: Exception) {
        }
    }

    @SuppressLint("MissingPermission")
    fun vibrateOnMistake(context: Context) {
        try {
            val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }
            if (vibrator?.hasVibrator() == true) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 120, 55, 120), -1))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(longArrayOf(0, 120, 55, 120), -1)
                }
            }
        } catch (_: Exception) {
        }
    }

    fun stopPreparedClipPlayback() {
        runCatching {
            testMediaPlayer?.stop()
            testMediaPlayer?.release()
        }
        testMediaPlayer = null
    }

    private fun extensionForMime(mime: String): String = when {
        mime.contains("mpeg") || mime.contains("mp3") -> "mp3"
        mime.contains("mp4") || mime.contains("m4a") || mime.contains("aac") -> "m4a"
        mime.contains("ogg") || mime.contains("opus") -> "ogg"
        mime.contains("webm") -> "webm"
        mime.contains("flac") -> "flac"
        mime.contains("3gp") -> "3gp"
        mime.contains("amr") -> "amr"
        else -> "wav"
    }

    fun playPreparedClip(context: Context, clip: PreparedWavClip, onComplete: () -> Unit) {
        stopPreparedClipPlayback()
        try {
            val ext = extensionForMime(clip.mimeType)
            val file = File(context.cacheDir, "sheikh_mic_test.$ext")
            FileOutputStream(file).use { it.write(clip.wavBytes) }
            val mp = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                setDataSource(file.absolutePath)
                setOnCompletionListener {
                    stopPreparedClipPlayback()
                    onComplete()
                }
                setOnErrorListener { _, _, _ ->
                    stopPreparedClipPlayback()
                    onComplete()
                    true
                }
                prepare()
                start()
            }
            testMediaPlayer = mp
        } catch (_: Exception) {
            stopPreparedClipPlayback()
            onComplete()
        }
    }

    fun detectAudioMimeFromBytes(
        bytes: ByteArray,
        fallbackName: String? = null,
        contentTypeHint: String? = null
    ): String? {
        if (bytes.size >= 12 &&
            bytes[0] == 'R'.code.toByte() &&
            bytes[1] == 'I'.code.toByte() &&
            bytes[2] == 'F'.code.toByte() &&
            bytes[3] == 'F'.code.toByte() &&
            bytes[8] == 'W'.code.toByte() &&
            bytes[9] == 'A'.code.toByte() &&
            bytes[10] == 'V'.code.toByte() &&
            bytes[11] == 'E'.code.toByte()
        ) {
            return "audio/wav"
        }
        if (bytes.size >= 3 &&
            bytes[0] == 'I'.code.toByte() &&
            bytes[1] == 'D'.code.toByte() &&
            bytes[2] == '3'.code.toByte()
        ) {
            return "audio/mpeg"
        }
        if (bytes.size >= 2 && (bytes[0].toInt() and 0xFF) == 0xFF) {
            val b1 = bytes[1].toInt() and 0xFF
            if ((b1 and 0xE0) == 0xE0) {
                val layer = (b1 ushr 1) and 0x03
                if (layer == 0) return "audio/aac"
                return "audio/mpeg"
            }
        }
        if (bytes.size >= 4 &&
            bytes[0] == 'O'.code.toByte() &&
            bytes[1] == 'g'.code.toByte() &&
            bytes[2] == 'g'.code.toByte() &&
            bytes[3] == 'S'.code.toByte()
        ) {
            return "audio/ogg"
        }
        if (bytes.size >= 4 &&
            bytes[0] == 'f'.code.toByte() &&
            bytes[1] == 'L'.code.toByte() &&
            bytes[2] == 'a'.code.toByte() &&
            bytes[3] == 'C'.code.toByte()
        ) {
            return "audio/flac"
        }
        if (bytes.size >= 4 &&
            (bytes[0].toInt() and 0xFF) == 0x1A &&
            (bytes[1].toInt() and 0xFF) == 0x45 &&
            (bytes[2].toInt() and 0xFF) == 0xDF &&
            (bytes[3].toInt() and 0xFF) == 0xA3
        ) {
            return "audio/webm"
        }
        if (bytes.size >= 8 &&
            bytes[4] == 'f'.code.toByte() &&
            bytes[5] == 't'.code.toByte() &&
            bytes[6] == 'y'.code.toByte() &&
            bytes[7] == 'p'.code.toByte()
        ) {
            val brand = if (bytes.size >= 12) String(bytes, 8, 4, Charsets.US_ASCII) else ""
            if (brand.startsWith("3gp", ignoreCase = true)) return "audio/3gpp"
            return "audio/mp4"
        }
        if (bytes.size >= 5 &&
            bytes[0] == '#'.code.toByte() &&
            bytes[1] == '!'.code.toByte() &&
            bytes[2] == 'A'.code.toByte() &&
            bytes[3] == 'M'.code.toByte() &&
            bytes[4] == 'R'.code.toByte()
        ) {
            return "audio/amr"
        }

        val ext = fallbackName?.substringAfterLast('.', "")?.lowercase().orEmpty()
        when (ext) {
            "wav" -> return "audio/wav"
            "mp3" -> return "audio/mpeg"
            "m4a", "mp4" -> return "audio/mp4"
            "ogg", "opus" -> return "audio/ogg"
            "webm" -> return "audio/webm"
            "aac" -> return "audio/aac"
            "flac" -> return "audio/flac"
            "3gp" -> return "audio/3gpp"
            "amr" -> return "audio/amr"
        }

        val hint = contentTypeHint?.substringBefore(';')?.trim()?.lowercase().orEmpty()
        if (hint.startsWith("audio/") || hint == "video/webm" || hint == "video/mp4") {
            return if (hint == "audio/x-wav" || hint == "audio/wave") "audio/wav"
            else if (hint == "audio/mp3") "audio/mpeg"
            else if (hint == "audio/x-m4a" || hint == "video/mp4") "audio/mp4"
            else if (hint == "video/webm") "audio/webm"
            else hint
        }
        return null
    }

    suspend fun prepareAudioFromUri(context: Context, uri: Uri): Result<PreparedWavClip> = withContext(Dispatchers.IO) {
        _uploadState.value = NativeUploadState.PREPARING
        try {
            val cr = context.contentResolver
            var displayName = "recitation_upload"
            cr.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (idx >= 0) displayName = cursor.getString(idx) ?: displayName
                }
            }
            val mimeHint = cr.getType(uri)

            val rawBytes = cr.openInputStream(uri)?.use { input ->
                val out = ByteArrayOutputStream()
                val buf = ByteArray(16 * 1024)
                var total = 0
                while (true) {
                    val read = input.read(buf)
                    if (read <= 0) break
                    total += read
                    if (total > 15 * 1024 * 1024) {
                        throw IllegalStateException("حجم الملف الصوتي يتجاوز الحد المسموح (15 ميجابايت)")
                    }
                    out.write(buf, 0, read)
                }
                out.toByteArray()
            } ?: return@withContext Result.failure(IllegalStateException("تعذر فتح الملف الصوتي المحدد"))

            if (rawBytes.size < 1024) {
                _uploadState.value = NativeUploadState.FAILED
                return@withContext Result.failure(IllegalStateException("الملف الصوتي فارغ أو صغير جداً ولا يحتوي على تلاوة صالحة"))
            }

            val detectedMime = detectAudioMimeFromBytes(rawBytes, displayName, mimeHint)
                ?: run {
                    _uploadState.value = NativeUploadState.FAILED
                    return@withContext Result.failure(IllegalStateException("صيغة الملف غير مدعومة. الصيغ المدعومة: MP3, WAV, M4A, OGG, WebM, AAC, FLAC, 3GP, AMR"))
                }

            var durationMs = 0L
            runCatching {
                val retriever = MediaMetadataRetriever()
                retriever.setDataSource(context, uri)
                val durStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                durationMs = durStr?.toLongOrNull() ?: 0L
                retriever.release()
            }
            if (durationMs <= 0L) {
                durationMs = ((rawBytes.size.toLong() * 1000L) / 16000L).coerceIn(1200L, 600_000L)
            }

            val clip = PreparedWavClip(
                wavBytes = rawBytes,
                durationMs = durationMs,
                peakRms = 0.25,
                hasSpeechEnergy = true,
                mimeType = detectedMime,
                fileName = displayName
            )
            lastPreparedClip = clip
            Result.success(clip)
        } catch (e: Exception) {
            _uploadState.value = NativeUploadState.FAILED
            Result.failure(e)
        }
    }

    @SuppressLint("MissingPermission")
    fun startRecording(
        context: Context,
        sensitivityMultiplier: Float = 1.0f,
        noiseGateLevel: String = "medium",
        preferStandardMic: Boolean = false
    ): Result<Unit> {
        if (isRecordingFlag) {
            return Result.failure(IllegalStateException("التسجيل قيد التشغيل بالفعل"))
        }
        if (!hasMicrophonePermission(context)) {
            return Result.failure(SecurityException("يرجى منح صلاحية الميكروفون للتسجيل"))
        }

        // Isolate recording: stop any active Azan/Quran playback before opening mic
        NativeAudioPlayerManager.stop()
        stopPreparedClipPlayback()

        val minBuf = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        val bufferSize = maxOf(minBuf * 2, 4096)
        if (minBuf <= 0) {
            return Result.failure(IllegalStateException("تعذر تهيئة مواصفات الميكروفون على الجهاز"))
        }

        return try {
            val sourcesToTry = if (preferStandardMic) {
                intArrayOf(MediaRecorder.AudioSource.MIC, MediaRecorder.AudioSource.VOICE_RECOGNITION)
            } else {
                intArrayOf(MediaRecorder.AudioSource.VOICE_RECOGNITION, MediaRecorder.AudioSource.MIC)
            }
            var initializedRecorder: AudioRecord? = null
            for (src in sourcesToTry) {
                val candidate = runCatching {
                    AudioRecord(src, SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT, bufferSize)
                }.getOrNull()
                if (candidate != null && candidate.state == AudioRecord.STATE_INITIALIZED) {
                    initializedRecorder = candidate
                    break
                }
                runCatching { candidate?.release() }
            }

            val recorder = initializedRecorder
                ?: return Result.failure(IllegalStateException("تعذر فتح الميكروفون، تأكد من عدم استخدامه في تطبيق آخر"))

            audioRecord = recorder
            pcmStream = ByteArrayOutputStream()
            peakRms = 0.0
            audibleFrames = 0
            activeSensitivity = sensitivityMultiplier.coerceIn(0.5f, 2.5f)
            activeGateThreshold = when (noiseGateLevel) {
                "low" -> 0.004
                "high" -> 0.014
                else -> 0.008
            }
            recordStartMs = System.currentTimeMillis()
            _recordingSeconds.value = 0
            _micLevel.value = 0f
            isRecordingFlag = true
            _uploadState.value = NativeUploadState.RECORDING

            recorder.startRecording()

            recordThread = Thread {
                val readBuffer = ShortArray(bufferSize / 2)
                val byteBuffer = ByteArray(bufferSize)
                while (isRecordingFlag) {
                    val readShorts = recorder.read(readBuffer, 0, readBuffer.size)
                    if (readShorts > 0) {
                        var sumSquares = 0.0
                        for (i in 0 until readShorts) {
                            val s = readBuffer[i].toInt()
                            sumSquares += s.toDouble() * s.toDouble()
                            // Little-endian PCM 16-bit
                            byteBuffer[i * 2] = (s and 0xFF).toByte()
                            byteBuffer[i * 2 + 1] = ((s shr 8) and 0xFF).toByte()
                        }
                        pcmStream?.write(byteBuffer, 0, readShorts * 2)

                        val rawRms = sqrt(sumSquares / readShorts) / 32768.0
                        val scaledRms = rawRms * activeSensitivity
                        if (scaledRms > peakRms) peakRms = scaledRms
                        if (scaledRms > activeGateThreshold) audibleFrames++
                        _micLevel.value = (scaledRms.toFloat() * 6f).coerceIn(0f, 1f)
                        _recordingSeconds.value = ((System.currentTimeMillis() - recordStartMs) / 1000L).toInt()
                    }
                }
            }.apply { start() }

            Result.success(Unit)
        } catch (e: Exception) {
            abortRecording()
            Result.failure(e)
        }
    }

    suspend fun stopAndFinalizeRecording(): Result<PreparedWavClip> = withContext(Dispatchers.IO) {
        if (!isRecordingFlag) {
            return@withContext Result.failure(IllegalStateException("لا يوجد تسجيل نشط"))
        }

        _uploadState.value = NativeUploadState.PREPARING
        isRecordingFlag = false
        val durationMs = (System.currentTimeMillis() - recordStartMs).coerceAtLeast(0L)

        try {
            recordThread?.join(1200)
        } catch (_: Exception) {
        }
        recordThread = null

        try {
            audioRecord?.stop()
        } catch (_: Exception) {
        }
        try {
            audioRecord?.release()
        } catch (_: Exception) {
        }
        audioRecord = null
        _micLevel.value = 0f

        val pcmBytes = pcmStream?.toByteArray() ?: ByteArray(0)
        pcmStream = null

        if (pcmBytes.isEmpty()) {
            _uploadState.value = NativeUploadState.FAILED
            return@withContext Result.failure(IllegalStateException("التسجيل الصوتي فارغ. يرجى التلاوة بوضوح والمحاولة مجدداً"))
        }

        val wavBytes = buildWavFileBytes(pcmBytes, SAMPLE_RATE, 1, 16)
        val hasSpeech = wavBytes.size >= MIN_WAV_BYTES &&
            durationMs >= 350L &&
            (peakRms >= (activeGateThreshold * 0.5) || audibleFrames >= 2)

        val clip = PreparedWavClip(
            wavBytes = wavBytes,
            durationMs = durationMs,
            peakRms = peakRms,
            hasSpeechEnergy = hasSpeech
        )
        lastPreparedClip = clip

        if (wavBytes.size < MIN_WAV_BYTES) {
            _uploadState.value = NativeUploadState.FAILED
            return@withContext Result.failure(IllegalStateException("التسجيل الصوتي قصير جداً، اضغط على المايك ورتّل الآية كاملة"))
        }
        if (!hasSpeech) {
            _uploadState.value = NativeUploadState.FAILED
            return@withContext Result.failure(IllegalStateException("لم يُسمع صوت واضح في الميكروفون، اقترب قليلاً ثم أعد المحاولة"))
        }

        Result.success(clip)
    }

    fun abortRecording() {
        isRecordingFlag = false
        try {
            recordThread?.interrupt()
        } catch (_: Exception) {
        }
        recordThread = null
        try {
            audioRecord?.stop()
        } catch (_: Exception) {
        }
        try {
            audioRecord?.release()
        } catch (_: Exception) {
        }
        audioRecord = null
        pcmStream = null
        _micLevel.value = 0f
        _recordingSeconds.value = 0
        _uploadState.value = NativeUploadState.IDLE
    }

    fun resetStatus() {
        _uploadState.value = NativeUploadState.IDLE
    }

    suspend fun evaluateClipWithServer(
        context: Context,
        serverBaseUrl: String,
        clip: PreparedWavClip,
        expectedText: String,
        surahName: String,
        surahNumber: Int,
        ayahNumber: Int,
        dialect: String,
        mode: String,
        trainingMode: Boolean,
        adjacentAyahsText: String,
        analysisSpeed: String = "balanced",
        unitType: String = "ayah",
        pageNumber: Int = 1
    ): Result<NativeEvaluationResult> = withContext(Dispatchers.IO) {
        if (!isNetworkConnected(context)) {
            _uploadState.value = NativeUploadState.FAILED
            return@withContext Result.failure(
                IllegalStateException("لا يوجد اتصال بالإنترنت حالياً. تم حفظ تسجيلك لإعادة الإرسال عند عودة الشبكة.")
            )
        }

        val normalizedMime = detectAudioMimeFromBytes(clip.wavBytes, clip.fileName, clip.mimeType) ?: clip.mimeType
        val useRawEndpoint = clip.wavBytes.size > 2_400_000
        val base = serverBaseUrl.trimEnd('/')
        val dynamicReadTimeout = when (analysisSpeed) {
            "fast" -> if (unitType == "page") 40_000 else 24_000
            "accurate" -> if (unitType == "page") 65_000 else 48_000
            else -> if (unitType == "page") 52_000 else 36_000
        }

        var lastError: Exception? = null
        val maxAttempts = 2
        for (attempt in 1..maxAttempts) {
            var conn: HttpURLConnection? = null
            try {
                _uploadState.value = NativeUploadState.UPLOADING
                if (useRawEndpoint) {
                    val metaJson = JSONObject().apply {
                        put("mimeType", normalizedMime)
                        put("fileName", clip.fileName)
                        put("durationMs", clip.durationMs)
                        put("expectedText", expectedText)
                        put("surahName", surahName)
                        put("surahNumber", surahNumber)
                        put("ayahNumber", ayahNumber)
                        put("unitType", unitType)
                        put("pageNumber", pageNumber)
                        put("dialect", dialect)
                        put("mode", mode)
                        put("trainingMode", trainingMode)
                        put("adjacentAyahsText", adjacentAyahsText)
                        put("analysisSpeed", analysisSpeed)
                    }
                    val metaHeaderB64 = Base64.encodeToString(metaJson.toString().toByteArray(Charsets.UTF_8), Base64.NO_WRAP)

                    conn = (URL("$base/api/sheikh/evaluate-raw").openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        connectTimeout = 16_000
                        readTimeout = dynamicReadTimeout
                        doOutput = true
                        setRequestProperty("Content-Type", normalizedMime)
                        setRequestProperty("Accept", "application/json")
                        setRequestProperty("x-sheikh-meta", metaHeaderB64)
                    }
                    conn.outputStream.use { os ->
                        os.write(clip.wavBytes)
                        os.flush()
                    }
                } else {
                    val base64Audio = Base64.encodeToString(clip.wavBytes, Base64.NO_WRAP)
                    val bodyJson = JSONObject().apply {
                        put("audioBase64", base64Audio)
                        put("mimeType", normalizedMime)
                        put("fileName", clip.fileName)
                        put("durationMs", clip.durationMs)
                        put("expectedText", expectedText)
                        put("surahName", surahName)
                        put("surahNumber", surahNumber)
                        put("ayahNumber", ayahNumber)
                        put("unitType", unitType)
                        put("pageNumber", pageNumber)
                        put("dialect", dialect)
                        put("mode", mode)
                        put("trainingMode", trainingMode)
                        put("adjacentAyahsText", adjacentAyahsText)
                        put("analysisSpeed", analysisSpeed)
                    }

                    conn = (URL("$base/api/sheikh/evaluate").openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        connectTimeout = 16_000
                        readTimeout = dynamicReadTimeout
                        doOutput = true
                        setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                        setRequestProperty("Accept", "application/json")
                    }
                    OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
                        writer.write(bodyJson.toString())
                        writer.flush()
                    }
                }

                _uploadState.value = NativeUploadState.ANALYZING

                val code = conn.responseCode
                val stream: InputStream? = if (code in 200..299) conn.inputStream else conn.errorStream
                val rawResponse = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
                val trimmed = rawResponse.trim()

                if (trimmed.startsWith("<") || trimmed.startsWith("<!DOCTYPE", ignoreCase = true)) {
                    throw IllegalStateException("خادم التحليل غير متاح مؤقتاً (استجابة غير صالحة رمز $code)")
                }

                if (code !in 200..299 || trimmed.isBlank()) {
                    val errObj = runCatching { JSONObject(trimmed) }.getOrNull()
                    val errMsg = errObj?.optString("error")?.takeIf { it.isNotBlank() }
                        ?: "تعذر تحليل التلاوة من الخادم (رمز $code). اضغط إعادة الإرسال."
                    if (code >= 500 && attempt < maxAttempts) {
                        lastError = IllegalStateException(errMsg)
                        delay(700)
                        continue
                    }
                    _uploadState.value = NativeUploadState.FAILED
                    return@withContext Result.failure(IllegalStateException(errMsg))
                }

                val root = JSONObject(trimmed)
                if (!root.optBoolean("success", false) || !root.has("evaluation")) {
                    val msg = root.optString("error", "استجابة غير مكتملة من خادم التحليل")
                    _uploadState.value = NativeUploadState.FAILED
                    return@withContext Result.failure(IllegalStateException(msg))
                }

                val ev = root.getJSONObject("evaluation")
                val wordsArr = ev.optJSONArray("wordResults") ?: JSONArray()
                val expectedTokens = expectedText.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }

                val wordResults = mutableListOf<NativeWordResult>()
                for (idx in expectedTokens.indices) {
                    var matchedObj: JSONObject? = null
                    for (j in 0 until wordsArr.length()) {
                        val item = wordsArr.getJSONObject(j)
                        if (item.optInt("positionIndex", -1) == idx) {
                            matchedObj = item
                            break
                        }
                    }
                    if (matchedObj == null && idx < wordsArr.length()) {
                        matchedObj = wordsArr.getJSONObject(idx)
                    }

                    if (matchedObj != null) {
                        wordResults.add(
                            NativeWordResult(
                                positionIndex = idx,
                                expectedWord = expectedTokens[idx],
                                spokenWord = matchedObj.optString("spokenWord", ""),
                                status = matchedObj.optString("status", "error"),
                                correctionNote = matchedObj.optString("correctionNote", "")
                            )
                        )
                    } else {
                        wordResults.add(
                            NativeWordResult(
                                positionIndex = idx,
                                expectedWord = expectedTokens[idx],
                                status = "missing",
                                correctionNote = "كلمة ناقصة"
                            )
                        )
                    }
                }

                val extraArr = ev.optJSONArray("extraOrRepeatedWords") ?: JSONArray()
                val extras = mutableListOf<String>()
                for (k in 0 until extraArr.length()) {
                    val s = extraArr.optString(k)
                    if (s.isNotBlank()) extras.add(s)
                }

                val result = NativeEvaluationResult(
                    transcribedText = ev.optString("transcribedText", ""),
                    status = ev.optString("status", "error"),
                    score = ev.optInt("score", 0).coerceIn(0, 100),
                    paceStyle = ev.optString("paceStyle", "tadwir"),
                    acceptedQiraatVariant = ev.optBoolean("acceptedQiraatVariant", false),
                    jumpedToOtherAyah = ev.optBoolean("jumpedToOtherAyah", false),
                    jumpedAyahNote = ev.optString("jumpedAyahNote", ""),
                    extraOrRepeatedWords = extras,
                    unclearAudioWarning = ev.optString("unclearAudioWarning", ""),
                    wordResults = wordResults,
                    mistakeSummary = ev.optString("mistakeSummary", ""),
                    correctionHint = ev.optString("correctionHint", ""),
                    sheikhScript = ev.optString("sheikhScript", "")
                )

                _uploadState.value = NativeUploadState.COMPLETED
                return@withContext Result.success(result)
            } catch (e: Exception) {
                Log.e(TAG, "Sheikh evaluate HTTP error (attempt $attempt)", e)
                lastError = e
                if (attempt < maxAttempts) {
                    delay(700)
                    continue
                }
            } finally {
                runCatching { conn?.disconnect() }
            }
        }

        _uploadState.value = NativeUploadState.FAILED
        Result.failure(
            IllegalStateException("فشل الإرسال أو الاتصال بخدمة التحليل: ${lastError?.message ?: "خطأ شبكة"}")
        )
    }

    suspend fun checkServerHealth(serverBaseUrl: String): Result<Boolean> = withContext(Dispatchers.IO) {
        var conn: HttpURLConnection? = null
        try {
            val base = serverBaseUrl.trimEnd('/')
            conn = (URL("$base/api/sheikh/health").openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8_000
                readTimeout = 8_000
                setRequestProperty("Accept", "application/json")
            }
            val code = conn.responseCode
            if (code !in 200..299) {
                return@withContext Result.failure(IllegalStateException("استجابة الخادم غير صالحة (رمز $code)"))
            }
            val raw = conn.inputStream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
            val obj = JSONObject(raw)
            val ok = obj.optBoolean("ok", false)
            val configured = obj.optBoolean("configured", false)
            if (!ok) {
                Result.failure(IllegalStateException("خدمة المعلم الذكي غير متاحة حالياً"))
            } else {
                Result.success(configured)
            }
        } catch (e: Exception) {
            Result.failure(IllegalStateException("تعذر الوصول للخادم: ${e.message ?: "خطأ شبكة"}"))
        } finally {
            runCatching { conn?.disconnect() }
        }
    }

    suspend fun speakSheikhFromServer(
        context: Context,
        serverBaseUrl: String,
        text: String,
        dialect: String = "fusha",
        onComplete: () -> Unit = {}
    ): Result<Unit> = withContext(Dispatchers.IO) {
        if (text.isBlank()) return@withContext Result.failure(IllegalArgumentException("النص فارغ"))
        if (!isNetworkConnected(context)) {
            return@withContext Result.failure(IllegalStateException("لا يوجد اتصال بالإنترنت لسماع نطق الشيخ"))
        }
        var conn: HttpURLConnection? = null
        try {
            val base = serverBaseUrl.trimEnd('/')
            val bodyJson = JSONObject().apply {
                put("text", text.trim())
                put("dialect", dialect)
                put("voice", "Charon")
            }
            conn = (URL("$base/api/sheikh/speak").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10_000
                readTimeout = 16_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                setRequestProperty("Accept", "application/json")
            }
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(bodyJson.toString())
                writer.flush()
            }
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val raw = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
            if (code !in 200..299 || raw.isBlank()) {
                return@withContext Result.failure(IllegalStateException("تعذر نطق الكلمة (رمز $code)"))
            }
            val obj = JSONObject(raw)
            val dataUrl = obj.optString("audioBase64", "")
            val b64 = dataUrl.substringAfter("base64,", dataUrl)
            if (!obj.optBoolean("success", false) || b64.isBlank()) {
                return@withContext Result.failure(IllegalStateException("لم يُرجع الخادم صوتاً"))
            }
            val audioBytes = Base64.decode(b64, Base64.DEFAULT)
            val ttsFile = File(context.cacheDir, "sheikh_tts_speech.wav")
            FileOutputStream(ttsFile).use { it.write(audioBytes) }

            withContext(Dispatchers.Main) {
                stopPreparedClipPlayback()
                val mp = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build()
                    )
                    setDataSource(ttsFile.absolutePath)
                    setOnCompletionListener {
                        stopPreparedClipPlayback()
                        onComplete()
                    }
                    setOnErrorListener { _, _, _ ->
                        stopPreparedClipPlayback()
                        onComplete()
                        true
                    }
                    prepare()
                    start()
                }
                testMediaPlayer = mp
            }
            Result.success(Unit)
        } catch (e: Exception) {
            withContext(Dispatchers.Main) { onComplete() }
            Result.failure(e)
        } finally {
            runCatching { conn?.disconnect() }
        }
    }

    private fun buildWavFileBytes(
        pcmData: ByteArray,
        sampleRate: Int,
        channels: Int,
        bitsPerSample: Int
    ): ByteArray {
        val totalAudioLen = pcmData.size
        val totalDataLen = totalAudioLen + 36
        val byteRate = sampleRate * channels * bitsPerSample / 8
        val header = ByteArray(44)

        header[0] = 'R'.code.toByte()
        header[1] = 'I'.code.toByte()
        header[2] = 'F'.code.toByte()
        header[3] = 'F'.code.toByte()
        header[4] = (totalDataLen and 0xff).toByte()
        header[5] = ((totalDataLen shr 8) and 0xff).toByte()
        header[6] = ((totalDataLen shr 16) and 0xff).toByte()
        header[7] = ((totalDataLen shr 24) and 0xff).toByte()
        header[8] = 'W'.code.toByte()
        header[9] = 'A'.code.toByte()
        header[10] = 'V'.code.toByte()
        header[11] = 'E'.code.toByte()
        header[12] = 'f'.code.toByte()
        header[13] = 'm'.code.toByte()
        header[14] = 't'.code.toByte()
        header[15] = ' '.code.toByte()
        header[16] = 16
        header[17] = 0
        header[18] = 0
        header[19] = 0
        header[20] = 1 // PCM
        header[21] = 0
        header[22] = channels.toByte()
        header[23] = 0
        header[24] = (sampleRate and 0xff).toByte()
        header[25] = ((sampleRate shr 8) and 0xff).toByte()
        header[26] = ((sampleRate shr 16) and 0xff).toByte()
        header[27] = ((sampleRate shr 24) and 0xff).toByte()
        header[28] = (byteRate and 0xff).toByte()
        header[29] = ((byteRate shr 8) and 0xff).toByte()
        header[30] = ((byteRate shr 16) and 0xff).toByte()
        header[31] = ((byteRate shr 24) and 0xff).toByte()
        header[32] = (channels * bitsPerSample / 8).toByte()
        header[33] = 0
        header[34] = bitsPerSample.toByte()
        header[35] = 0
        header[36] = 'd'.code.toByte()
        header[37] = 'a'.code.toByte()
        header[38] = 't'.code.toByte()
        header[39] = 'a'.code.toByte()
        header[40] = (totalAudioLen and 0xff).toByte()
        header[41] = ((totalAudioLen shr 8) and 0xff).toByte()
        header[42] = ((totalAudioLen shr 16) and 0xff).toByte()
        header[43] = ((totalAudioLen shr 24) and 0xff).toByte()

        return ByteArray(44 + pcmData.size).apply {
            System.arraycopy(header, 0, this, 0, 44)
            System.arraycopy(pcmData, 0, this, 44, pcmData.size)
        }
    }
}
