package com.muslim.azan.service

import android.content.Context
import android.content.res.AssetFileDescriptor
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.muslim.azan.AzkarAudioService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.File

/**
 * Unified Foreground Audio Manager for all in-app audio playback:
 * - Asset previews (Azkar / Musaharati / Azan previews)
 * - Remote Quran recitations (Reciters / Ayah & Page playlists with repeat & speed)
 * - Recorded user clips & Sheikh TTS playback
 *
 * Guarantees single active MediaPlayer ownership, zero track overlap, automatic cleanup on stop/error,
 * coordination with background AzkarAudioService, and proper AudioFocus transient pause/resume.
 */
object NativeAudioPlayerManager : MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener {
    private const val TAG = "NativeAudioPlayer"

    private var mediaPlayer: MediaPlayer? = null
    private var audioManager: AudioManager? = null
    private var focusRequest: AudioFocusRequest? = null
    private val handler = Handler(Looper.getMainLooper())
    private val focusMachine = AudioFocusStateMachine()

    private var currentSpeed: Float = 1.0f
    private var onFileOrQueueComplete: (() -> Unit)? = null
    private var onQueueError: ((String) -> Unit)? = null
    private var playlistUrls: List<String> = emptyList()
    private var playlistIndex: Int = 0
    private var playlistTargetRepeats: Int = 1
    private var playlistCurrentRepeat: Int = 0
    private var playlistTitle: String = ""
    private var playlistSubtitle: String = ""
    private var activeContext: Context? = null

    private val focusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
        val playing = runCatching { mediaPlayer?.isPlaying == true }.getOrDefault(false)
        when (focusMachine.onFocusChange(focusChange, playing, isPriorityAzanBlocked())) {
            AudioFocusStateMachine.FocusAction.STOP_PERMANENT -> {
                stop()
            }
            AudioFocusStateMachine.FocusAction.PAUSE_TRANSIENT -> {
                runCatching {
                    mediaPlayer?.let { p ->
                        if (p.isPlaying) {
                            p.pause()
                            _isPlaying.value = false
                            _isPaused.value = true
                            handler.removeCallbacks(progressRunnable)
                        }
                    }
                }
            }
            AudioFocusStateMachine.FocusAction.DUCK_VOLUME -> {
                runCatching { mediaPlayer?.setVolume(0.25f, 0.25f) }
            }
            AudioFocusStateMachine.FocusAction.RESUME_AFTER_TRANSIENT -> {
                runCatching {
                    mediaPlayer?.let { p ->
                        p.setVolume(1.0f, 1.0f)
                        if (!p.isPlaying && !isPriorityAzanBlocked()) {
                            p.start()
                            _isPlaying.value = true
                            _isPaused.value = false
                            handler.post(progressRunnable)
                        }
                    }
                }
            }
            AudioFocusStateMachine.FocusAction.RESTORE_VOLUME_ONLY -> {
                runCatching { mediaPlayer?.setVolume(1.0f, 1.0f) }
            }
            AudioFocusStateMachine.FocusAction.NONE -> Unit
        }
    }

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _isPaused = MutableStateFlow(false)
    val isPaused: StateFlow<Boolean> = _isPaused.asStateFlow()

    private val _currentTrackTag = MutableStateFlow("")
    val currentTrackTag: StateFlow<String> = _currentTrackTag.asStateFlow()

    private val _currentTitle = MutableStateFlow("")
    val currentTitle: StateFlow<String> = _currentTitle.asStateFlow()

    private val _currentSubtitle = MutableStateFlow("")
    val currentSubtitle: StateFlow<String> = _currentSubtitle.asStateFlow()

    private val _currentProgress = MutableStateFlow(0f)
    val currentProgress: StateFlow<Float> = _currentProgress.asStateFlow()

    private val _currentPositionMs = MutableStateFlow(0L)
    val currentPositionMs: StateFlow<Long> = _currentPositionMs.asStateFlow()

    private val _currentDurationMs = MutableStateFlow(0L)
    val currentDurationMs: StateFlow<Long> = _currentDurationMs.asStateFlow()

    private val progressRunnable = object : Runnable {
        override fun run() {
            mediaPlayer?.let { player ->
                runCatching {
                    if (player.isPlaying) {
                        val pos = player.currentPosition.toLong()
                        val dur = player.duration.toLong()
                        _currentPositionMs.value = pos
                        _currentDurationMs.value = dur
                        if (dur > 0) {
                            _currentProgress.value = (pos.toFloat() / dur.toFloat()).coerceIn(0f, 1f)
                        }
                        handler.postDelayed(this, 500)
                    }
                }
            }
        }
    }

    private fun requestFocus(context: Context, speechContent: Boolean = false): Boolean {
        val am = (context.applicationContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager) ?: return false
        audioManager = am
        focusMachine.reset()
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(if (speechContent) AudioAttributes.CONTENT_TYPE_SPEECH else AudioAttributes.CONTENT_TYPE_MUSIC)
            .build()
        val res = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attrs)
                .setAcceptsDelayedFocusGain(false)
                .setOnAudioFocusChangeListener(focusChangeListener)
                .build()
            focusRequest = req
            am.requestAudioFocus(req)
        } else {
            @Suppress("DEPRECATION")
            am.requestAudioFocus(focusChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
        }
        return res == AudioManager.AUDIOFOCUS_REQUEST_GRANTED || res == AudioManager.AUDIOFOCUS_REQUEST_DELAYED
    }

    private fun abandonFocus() {
        val am = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest?.let { runCatching { am.abandonAudioFocusRequest(it) } }
            focusRequest = null
        } else {
            @Suppress("DEPRECATION")
            runCatching { am.abandonAudioFocus(focusChangeListener) }
        }
        focusMachine.reset()
    }

    fun isPriorityAzanBlocked(): Boolean {
        return AzkarAudioService.isPlayingNow &&
            AzkarAudioService.getSectionPriority(AzkarAudioService.currentSection) >= 4
    }

    fun playAssetAudio(
        context: Context,
        assetPath: String,
        title: String,
        subtitle: String,
        trackTag: String = assetPath
    ) {
        if (isPriorityAzanBlocked()) {
            Log.d(TAG, "Azan/Iqama active; deferring media playback: $title")
            return
        }
        stop()
        activeContext = context.applicationContext
        requestFocus(context, speechContent = false)
        try {
            val player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
            }

            var loaded = false
            try {
                val cleanPath = if (assetPath.startsWith("public/")) assetPath.removePrefix("public/") else assetPath
                val afd: AssetFileDescriptor = context.assets.openFd(cleanPath)
                player.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                afd.close()
                loaded = true
            } catch (_: Exception) {
                val fallbackPath = "audio/" + File(assetPath).name
                try {
                    val afd = context.assets.openFd(fallbackPath)
                    player.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                    afd.close()
                    loaded = true
                } catch (_: Exception) {
                    try {
                        val tempFile = File(context.cacheDir, "player_" + File(assetPath).name)
                        context.assets.open(fallbackPath).use { input ->
                            tempFile.outputStream().use { output -> input.copyTo(output) }
                        }
                        if (tempFile.exists() && tempFile.length() > 0) {
                            player.setDataSource(tempFile.absolutePath)
                            loaded = true
                        }
                    } catch (_: Exception) {}
                }
            }

            if (loaded) {
                player.setOnCompletionListener(this)
                player.setOnErrorListener(this)
                player.prepare()
                player.start()
                mediaPlayer = player

                _currentTrackTag.value = trackTag
                _currentTitle.value = title
                _currentSubtitle.value = subtitle
                _isPlaying.value = true
                _isPaused.value = false
                _currentDurationMs.value = player.duration.toLong()
                handler.post(progressRunnable)
            } else {
                player.release()
                abandonFocus()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error playing asset audio: $assetPath", e)
            stop()
        }
    }

    fun playFileAudio(
        context: Context,
        filePath: String,
        title: String,
        subtitle: String,
        trackTag: String = filePath,
        onComplete: (() -> Unit)? = null,
        onError: ((String) -> Unit)? = null
    ) {
        if (isPriorityAzanBlocked()) {
            Log.d(TAG, "Azan/Iqama active; cannot start clip playback: $title")
            onError?.invoke("يُمنع التشغيل أثناء الأذان أو الإقامة")
            return
        }
        stop()
        activeContext = context.applicationContext
        onFileOrQueueComplete = onComplete
        onQueueError = onError
        requestFocus(context, speechContent = true)
        try {
            val player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                setDataSource(filePath)
                setOnCompletionListener(this@NativeAudioPlayerManager)
                setOnErrorListener(this@NativeAudioPlayerManager)
                prepare()
                start()
            }
            mediaPlayer = player
            _currentTrackTag.value = trackTag
            _currentTitle.value = title
            _currentSubtitle.value = subtitle
            _isPlaying.value = true
            _isPaused.value = false
            _currentDurationMs.value = player.duration.toLong()
            handler.post(progressRunnable)
        } catch (e: Exception) {
            Log.e(TAG, "Error playing file audio: $filePath", e)
            val errCallback = onQueueError
            stop()
            errCallback?.invoke(e.message ?: "تعذر تشغيل الملف الصوتي")
        }
    }

    fun playUrlAudio(
        context: Context,
        url: String,
        title: String,
        subtitle: String,
        trackTag: String = url
    ) {
        playUrlQueue(
            context = context,
            urls = listOf(url),
            title = title,
            subtitle = subtitle,
            speed = 1.0f,
            targetRepeats = 1,
            trackTag = trackTag
        )
    }

    fun playUrlQueue(
        context: Context,
        urls: List<String>,
        title: String,
        subtitle: String,
        speed: Float = 1.0f,
        targetRepeats: Int = 1,
        trackTag: String = "url_queue",
        onComplete: (() -> Unit)? = null,
        onError: ((String) -> Unit)? = null
    ) {
        if (urls.isEmpty()) return
        if (isPriorityAzanBlocked()) {
            Log.d(TAG, "Azan/Iqama active; deferring streamed playback: $title")
            onError?.invoke("يُمنع التشغيل أثناء الأذان أو الإقامة")
            return
        }
        stop()
        activeContext = context.applicationContext
        playlistUrls = urls
        playlistIndex = 0
        playlistCurrentRepeat = 0
        playlistTargetRepeats = targetRepeats
        playlistTitle = title
        playlistSubtitle = subtitle
        currentSpeed = speed.coerceIn(0.5f, 2.0f)
        onFileOrQueueComplete = onComplete
        onQueueError = onError

        requestFocus(context, speechContent = true)
        _currentTrackTag.value = trackTag
        _currentTitle.value = title
        _currentSubtitle.value = "$subtitle (جاري التحميل...)"
        startPlaylistItem(0)
    }

    private fun startPlaylistItem(index: Int) {
        val url = playlistUrls.getOrNull(index) ?: run {
            val doneCb = onFileOrQueueComplete
            stop()
            doneCb?.invoke()
            return
        }
        releaseMediaPlayerOnly()
        try {
            val player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                setDataSource(url)
                setOnCompletionListener(this@NativeAudioPlayerManager)
                setOnErrorListener(this@NativeAudioPlayerManager)
                setOnPreparedListener { mp ->
                    if (isPriorityAzanBlocked()) {
                        stop()
                        return@setOnPreparedListener
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        runCatching {
                            mp.playbackParams = mp.playbackParams.setSpeed(currentSpeed)
                        }
                    }
                    mp.start()
                    _currentTitle.value = playlistTitle
                    _currentSubtitle.value = playlistSubtitle
                    _isPlaying.value = true
                    _isPaused.value = false
                    _currentDurationMs.value = mp.duration.toLong()
                    handler.post(progressRunnable)
                }
            }
            mediaPlayer = player
            player.prepareAsync()
        } catch (e: Exception) {
            Log.e(TAG, "Error streaming queued audio: $url", e)
            val errCb = onQueueError
            stop()
            errCb?.invoke("تعذر تشغيل التلاوة من الشبكة")
        }
    }

    fun setPlaybackSpeed(speed: Float) {
        currentSpeed = speed.coerceIn(0.5f, 2.0f)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            mediaPlayer?.let { mp ->
                runCatching {
                    if (mp.isPlaying) {
                        mp.playbackParams = mp.playbackParams.setSpeed(currentSpeed)
                    }
                }
            }
        }
    }

    fun pause() {
        mediaPlayer?.let { player ->
            runCatching {
                if (player.isPlaying) {
                    player.pause()
                    _isPlaying.value = false
                    _isPaused.value = true
                    handler.removeCallbacks(progressRunnable)
                }
            }
        }
    }

    fun resume() {
        if (isPriorityAzanBlocked()) return
        mediaPlayer?.let { player ->
            runCatching {
                if (!player.isPlaying) {
                    activeContext?.let { requestFocus(it, speechContent = true) }
                    player.start()
                    _isPlaying.value = true
                    _isPaused.value = false
                    handler.post(progressRunnable)
                }
            }
        }
    }

    fun togglePlayPause() {
        mediaPlayer?.let { player ->
            if (player.isPlaying) {
                pause()
            } else {
                resume()
            }
        }
    }

    fun seekTo(progress: Float) {
        mediaPlayer?.let { player ->
            runCatching {
                val dur = player.duration
                if (dur > 0) {
                    val targetMs = (progress.coerceIn(0f, 1f) * dur).toInt()
                    player.seekTo(targetMs)
                    _currentProgress.value = progress.coerceIn(0f, 1f)
                }
            }
        }
    }

    private fun releaseMediaPlayerOnly() {
        handler.removeCallbacks(progressRunnable)
        mediaPlayer?.let {
            runCatching {
                if (it.isPlaying) {
                    it.stop()
                }
            }
            runCatching { it.reset() }
            runCatching { it.release() }
        }
        mediaPlayer = null
    }

    fun stop() {
        releaseMediaPlayerOnly()
        abandonFocus()
        playlistUrls = emptyList()
        playlistIndex = 0
        playlistCurrentRepeat = 0
        onFileOrQueueComplete = null
        onQueueError = null
        _isPlaying.value = false
        _isPaused.value = false
        _currentTrackTag.value = ""
        _currentProgress.value = 0f
        _currentPositionMs.value = 0L
    }

    override fun onCompletion(mp: MediaPlayer?) {
        handler.removeCallbacks(progressRunnable)
        if (playlistUrls.isNotEmpty()) {
            if (playlistIndex + 1 < playlistUrls.size) {
                playlistIndex++
                startPlaylistItem(playlistIndex)
                return
            }
            playlistCurrentRepeat++
            if (playlistTargetRepeats == 0 || playlistCurrentRepeat < playlistTargetRepeats) {
                playlistIndex = 0
                handler.postDelayed({
                    if (playlistUrls.isNotEmpty() && !isPriorityAzanBlocked()) {
                        startPlaylistItem(0)
                    }
                }, 700L)
                return
            }
        }
        val doneCb = onFileOrQueueComplete
        releaseMediaPlayerOnly()
        abandonFocus()
        playlistUrls = emptyList()
        onFileOrQueueComplete = null
        onQueueError = null
        _isPlaying.value = false
        _isPaused.value = false
        _currentProgress.value = 1f
        doneCb?.invoke()
    }

    override fun onError(mp: MediaPlayer?, what: Int, extra: Int): Boolean {
        Log.e(TAG, "MediaPlayer error: $what, extra: $extra")
        val errCb = onQueueError
        stop()
        errCb?.invoke("خطأ في تشغيل الصوت ($what)")
        return true
    }
}
