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

object NativeAudioPlayerManager : MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener {
    private const val TAG = "NativeAudioPlayer"

    private var mediaPlayer: MediaPlayer? = null
    private var audioManager: AudioManager? = null
    private var focusRequest: AudioFocusRequest? = null
    private val handler = Handler(Looper.getMainLooper())

    private val focusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
        when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                mediaPlayer?.let { player ->
                    try {
                        if (player.isPlaying) {
                            player.pause()
                            _isPlaying.value = false
                            handler.removeCallbacks(progressRunnable)
                        }
                    } catch (_: Exception) {}
                }
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                mediaPlayer?.setVolume(0.25f, 0.25f)
            }
            AudioManager.AUDIOFOCUS_GAIN -> {
                mediaPlayer?.setVolume(1.0f, 1.0f)
            }
        }
    }

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

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

    private fun requestFocus(context: Context) {
        val am = (context.applicationContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager) ?: return
        audioManager = am
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                .setOnAudioFocusChangeListener(focusChangeListener)
                .build()
            focusRequest = req
            am.requestAudioFocus(req)
        } else {
            @Suppress("DEPRECATION")
            am.requestAudioFocus(focusChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
        }
    }

    private fun abandonFocus() {
        val am = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest?.let { am.abandonAudioFocusRequest(it) }
            focusRequest = null
        } else {
            @Suppress("DEPRECATION")
            am.abandonAudioFocus(focusChangeListener)
        }
    }

    private fun isPriorityAzanBlocked(): Boolean {
        return AzkarAudioService.isPlayingNow &&
            AzkarAudioService.getSectionPriority(AzkarAudioService.currentSection) >= 4
    }

    fun playAssetAudio(context: Context, assetPath: String, title: String, subtitle: String) {
        if (isPriorityAzanBlocked()) {
            Log.d(TAG, "Azan/Iqama active; deferring media playback: $title")
            return
        }
        stop()
        requestFocus(context)
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
            } catch (e: Exception) {
                val fallbackPath = "audio/" + File(assetPath).name
                try {
                    val afd = context.assets.openFd(fallbackPath)
                    player.setDataSource(afd.getFileDescriptor(), afd.startOffset, afd.length)
                    afd.close()
                    loaded = true
                } catch (ignored: Exception) {
                    try {
                        val tempFile = File(context.cacheDir, "player_" + File(assetPath).name)
                        context.assets.open(fallbackPath).use { input ->
                            tempFile.outputStream().use { output -> input.copyTo(output) }
                        }
                        if (tempFile.exists() && tempFile.length() > 0) {
                            player.setDataSource(tempFile.absolutePath)
                            loaded = true
                        }
                    } catch (ignored2: Exception) {}
                }
            }

            if (loaded) {
                player.setOnCompletionListener(this)
                player.setOnErrorListener(this)
                player.prepare()
                player.start()
                mediaPlayer = player

                _currentTitle.value = title
                _currentSubtitle.value = subtitle
                _isPlaying.value = true
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

    fun playUrlAudio(context: Context, url: String, title: String, subtitle: String) {
        if (isPriorityAzanBlocked()) {
            Log.d(TAG, "Azan/Iqama active; deferring streamed playback: $title")
            return
        }
        stop()
        requestFocus(context)
        try {
            val player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                setDataSource(url)
                setOnCompletionListener(this@NativeAudioPlayerManager)
                setOnErrorListener(this@NativeAudioPlayerManager)
            }

            player.setOnPreparedListener { mp ->
                if (isPriorityAzanBlocked()) {
                    stop()
                    return@setOnPreparedListener
                }
                mp.start()
                mediaPlayer = mp
                _currentTitle.value = title
                _currentSubtitle.value = subtitle
                _isPlaying.value = true
                _currentDurationMs.value = mp.duration.toLong()
                handler.post(progressRunnable)
            }

            _currentTitle.value = title
            _currentSubtitle.value = "$subtitle (جاري التحميل...)"
            player.prepareAsync()
        } catch (e: Exception) {
            Log.e(TAG, "Error streaming audio: $url", e)
            stop()
        }
    }

    fun togglePlayPause() {
        mediaPlayer?.let { player ->
            if (player.isPlaying) {
                player.pause()
                _isPlaying.value = false
                handler.removeCallbacks(progressRunnable)
            } else {
                if (isPriorityAzanBlocked()) return
                player.start()
                _isPlaying.value = true
                handler.post(progressRunnable)
            }
        }
    }

    fun seekTo(progress: Float) {
        mediaPlayer?.let { player ->
            val targetMs = (progress * player.duration).toInt()
            player.seekTo(targetMs)
            _currentProgress.value = progress
        }
    }

    fun stop() {
        handler.removeCallbacks(progressRunnable)
        mediaPlayer?.let {
            try {
                if (it.isPlaying) {
                    it.stop()
                }
                it.reset()
                it.release()
            } catch (ignored: Exception) {}
        }
        mediaPlayer = null
        abandonFocus()
        _isPlaying.value = false
        _currentProgress.value = 0f
        _currentPositionMs.value = 0L
    }

    override fun onCompletion(mp: MediaPlayer?) {
        _isPlaying.value = false
        _currentProgress.value = 1f
        handler.removeCallbacks(progressRunnable)
    }

    override fun onError(mp: MediaPlayer?, what: Int, extra: Int): Boolean {
        Log.e(TAG, "MediaPlayer error: $what, extra: $extra")
        stop()
        return true
    }
}
