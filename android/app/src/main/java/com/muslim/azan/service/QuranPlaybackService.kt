package com.muslim.azan.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.muslim.azan.MainActivity
import com.muslim.azan.R

/**
 * Lightweight Foreground Service that keeps streamed/offline Quran recitations
 * alive with a partial WakeLock and media notification when the screen turns off,
 * while yielding immediately to priority Azan/Iqama playback.
 */
class QuranPlaybackService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null
    private var lastTitle: String = "القرآن الكريم"
    private var lastSubtitle: String = "تلاوة متواصلة"
    private var lastIsPlaying: Boolean = true

    override fun onCreate() {
        super.onCreate()
        createChannel()
        val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
        wakeLock = pm?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AlMoazen::QuranPlaybackWakeLock")?.apply {
            setReferenceCounted(false)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_TOGGLE_PAUSE -> {
                NativeAudioPlayerManager.togglePlayPause()
                val playingNow = NativeAudioPlayerManager.isPlaying.value
                lastIsPlaying = playingNow
                updateForegroundNotification(lastTitle, lastSubtitle, playingNow)
                return START_NOT_STICKY
            }
            ACTION_STOP -> {
                NativeAudioPlayerManager.stop()
                stopSelfCleanly()
                return START_NOT_STICKY
            }
            ACTION_START_OR_UPDATE -> {
                lastTitle = intent.getStringExtra(EXTRA_TITLE)?.takeIf { it.isNotBlank() } ?: lastTitle
                lastSubtitle = intent.getStringExtra(EXTRA_SUBTITLE)?.takeIf { it.isNotBlank() } ?: lastSubtitle
                lastIsPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, true)
                if (lastIsPlaying) {
                    acquireWakeLock()
                } else {
                    releaseWakeLock()
                }
                updateForegroundNotification(lastTitle, lastSubtitle, lastIsPlaying)
                return START_NOT_STICKY
            }
            else -> {
                updateForegroundNotification(lastTitle, lastSubtitle, lastIsPlaying)
                return START_NOT_STICKY
            }
        }
    }

    private fun acquireWakeLock() {
        runCatching {
            wakeLock?.let { wl ->
                if (!wl.isHeld) {
                    wl.acquire(3 * 60 * 60 * 1000L)
                }
            }
        }
    }

    private fun releaseWakeLock() {
        runCatching {
            wakeLock?.let { wl ->
                if (wl.isHeld) wl.release()
            }
        }
    }

    private fun stopSelfCleanly() {
        releaseWakeLock()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun updateForegroundNotification(title: String, subtitle: String, isPlaying: Boolean) {
        val notification = buildNotification(title, subtitle, isPlaying)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(title: String, subtitle: String, isPlaying: Boolean): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openPi = PendingIntent.getActivity(
            this,
            5100,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val toggleIntent = Intent(this, QuranPlaybackService::class.java).apply {
            action = ACTION_TOGGLE_PAUSE
        }
        val togglePi = PendingIntent.getService(
            this,
            5101,
            toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, QuranPlaybackService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPi = PendingIntent.getService(
            this,
            5102,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val toggleLabel = if (isPlaying) "إيقاف مؤقت" else "استئناف"
        val toggleIcon = if (isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_muslim_plus)
            .setContentTitle(title)
            .setContentText(subtitle)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(isPlaying)
            .setSilent(true)
            .setContentIntent(openPi)
            .addAction(toggleIcon, toggleLabel, togglePi)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "إيقاف", stopPi)
            .build()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
            val channel = NotificationChannel(
                CHANNEL_ID,
                "تشغيل التلاوات القرآنية",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "إبقاء التلاوات القرآنية قيد التشغيل عند قفل الشاشة"
                setSound(null, null)
            }
            nm.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        releaseWakeLock()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "QuranPlaybackService"
        private const val CHANNEL_ID = "muslim_plus_quran_playback_v1"
        private const val NOTIFICATION_ID = 2001

        const val ACTION_START_OR_UPDATE = "com.muslim.azan.QURAN_START_OR_UPDATE"
        const val ACTION_TOGGLE_PAUSE = "com.muslim.azan.QURAN_TOGGLE_PAUSE"
        const val ACTION_STOP = "com.muslim.azan.QURAN_STOP"

        private const val EXTRA_TITLE = "extra_title"
        private const val EXTRA_SUBTITLE = "extra_subtitle"
        private const val EXTRA_IS_PLAYING = "extra_is_playing"

        fun syncPlayback(context: Context, title: String, subtitle: String, isPlaying: Boolean) {
            runCatching {
                val appCtx = context.applicationContext
                val intent = Intent(appCtx, QuranPlaybackService::class.java).apply {
                    action = ACTION_START_OR_UPDATE
                    putExtra(EXTRA_TITLE, title)
                    putExtra(EXTRA_SUBTITLE, subtitle)
                    putExtra(EXTRA_IS_PLAYING, isPlaying)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isPlaying) {
                    appCtx.startForegroundService(intent)
                } else {
                    appCtx.startService(intent)
                }
            }.onFailure { err ->
                Log.w(TAG, "Unable to sync QuranPlaybackService: ${err.message}")
            }
        }

        fun stopService(context: Context?) {
            if (context == null) return
            runCatching {
                val appCtx = context.applicationContext
                appCtx.stopService(Intent(appCtx, QuranPlaybackService::class.java))
            }
        }
    }
}
