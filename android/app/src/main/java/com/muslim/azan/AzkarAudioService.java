package com.muslim.azan;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

/**
 * Standard Android Foreground Service:
 * - Plays Azan, Iqama, and Azkar audio safely in the background upon AlarmManager triggers.
 * - Uses a silent playback notification channel so system notification pings do not overlap the Azan.
 * - Supports Android 14, 15, and 16 (API 34-36) with FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK.
 * - Manages audio focus, releases CPU WakeLock cleanly upon completion/error, and prevents overlapping audio.
 */
public class AzkarAudioService extends Service implements MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener {
    private static final String TAG = "AzkarAudioService";
    private static final String CHANNEL_ID = "islamic_azan_playback_v2";
    private static final String ALERT_CHANNEL_ID = "islamic_azan_alert_v2";
    private static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_STOP_AUDIO = "com.muslim.azan.ACTION_STOP_AUDIO";
    public static final String ACTION_MUTE_AUDIO_ONLY = "com.muslim.azan.ACTION_MUTE_AUDIO_ONLY";

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();

        // Immediately enter foreground on creation to comply with Android 12-16 FGS timing rules
        Notification initialNotification = buildNotification("تطبيق المؤذن", "جاري تشغيل تنبيه الأذان والأذكار...");
        startForegroundCompat(initialNotification);

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AlMoazen::AudioPlaybackWakeLock");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(5 * 60 * 1000L); // 5 minutes max safety timeout
        }

        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
    }

    private void startForegroundCompat(Notification notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void ensureWakeLockHeld() {
        if (wakeLock != null && !wakeLock.isHeld()) {
            try {
                wakeLock.acquire(5 * 60 * 1000L);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopAudioAndCleanUp();
            releaseWakeLock();
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP_AUDIO.equals(action) || ACTION_MUTE_AUDIO_ONLY.equals(action)) {
            stopAudioAndCleanUp();
            releaseWakeLock();
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }

        ensureWakeLockHeld();

        String section = intent.getStringExtra("section");
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String audioTrackId = intent.getStringExtra("audioTrackId");
        String prayerName = intent.getStringExtra("prayerName");
        String cityName = intent.getStringExtra("cityName");
        boolean autoPlay = intent.getBooleanExtra("autoPlay", true);

        if (title == null || title.isEmpty()) {
            if ("prayer_azan".equals(section) && prayerName != null) {
                title = "حان الآن موعد أذان " + prayerName;
            } else if ("prePrayerAlert".equals(section) && prayerName != null) {
                title = "اقتربت صلاة " + prayerName;
            } else if ("morningAzkar".equals(section)) {
                title = "أذكار الصباح المباركة";
            } else if ("eveningAzkar".equals(section)) {
                title = "أذكار المساء المباركة";
            } else if ("salawat".equals(section)) {
                title = "الصلاة والسلام على رسول الله ﷺ";
            } else if ("musaharati".equals(section)) {
                title = "نداء المسحراتي المبارك";
            } else if ("iftar".equals(section)) {
                title = "موعد أذان المغرب والإفطار";
            } else {
                title = "تطبيق المؤذن";
            }
        }

        if (body == null || body.isEmpty()) {
            if (cityName != null && !cityName.isEmpty()) {
                body = "حسب التوقيت المحلي لمدينة " + cityName;
            } else {
                body = "«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»";
            }
        }

        // Only prayer_azan is gated by azanSoundEnabled; Azkar/Salawat/Pre-prayer use their own autoPlay flag
        SharedPreferences prefs = getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
        boolean azanSoundEnabled = prefs.getBoolean("azanSoundEnabled", true);
        boolean shouldPlayAudio = autoPlay && (!"prayer_azan".equals(section) || azanSoundEnabled);

        if (shouldPlayAudio) {
            Notification notification = buildNotification(title, body);
            startForegroundCompat(notification);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, notification);
            }
            playAudioSafely(audioTrackId, section, title, body);
        } else {
            // Sound muted by user: post standard silent/visual alert notification and finish service cleanly
            postVisualOnlyNotification(title, body, section);
            stopAudioAndCleanUp();
            releaseWakeLock();
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
            stopSelf();
        }

        return START_NOT_STICKY;
    }

    private void playAudioSafely(String audioTrackId, String section, String title, String body) {
        stopAudioAndCleanUp();

        String resolvedFileName = resolveAudioFileName(audioTrackId, section);
        if (resolvedFileName == null) {
            Log.w(TAG, "No audio file resolved for track: " + audioTrackId);
            finishWithVisualFallback(title, body, section);
            return;
        }

        requestAudioFocus();

        try {
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build()
            );
            mediaPlayer.setVolume(1.0f, 1.0f);

            // 1. Try to open from Assets (audio/...)
            boolean assetLoaded = false;
            try {
                AssetFileDescriptor afd = getAssets().openFd("audio/" + resolvedFileName);
                mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                afd.close();
                assetLoaded = true;
            } catch (Exception ex) {
                try {
                    AssetFileDescriptor afd = getAssets().openFd(resolvedFileName);
                    mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                    afd.close();
                    assetLoaded = true;
                } catch (Exception ignored) {}
            }

            // 2. Fallback: Copy from assets input stream to cache if openFd failed due to APK compression
            if (!assetLoaded) {
                InputStream is = null;
                FileOutputStream fos = null;
                try {
                    try {
                        is = getAssets().open("audio/" + resolvedFileName);
                    } catch (Exception e1) {
                        try {
                            is = getAssets().open(resolvedFileName);
                        } catch (Exception ignored) {}
                    }

                    if (is != null) {
                        File tempFile = new File(getCacheDir(), "azan_" + resolvedFileName);
                        fos = new FileOutputStream(tempFile);
                        byte[] buffer = new byte[8192];
                        int bytesRead;
                        while ((bytesRead = is.read(buffer)) != -1) {
                            fos.write(buffer, 0, bytesRead);
                        }
                        fos.flush();

                        if (tempFile.exists() && tempFile.length() > 0) {
                            mediaPlayer.setDataSource(tempFile.getAbsolutePath());
                            assetLoaded = true;
                        }
                    }
                } catch (Exception streamEx) {
                    Log.w(TAG, "Asset stream extraction failed for " + resolvedFileName, streamEx);
                } finally {
                    try { if (fos != null) fos.close(); } catch (Exception ignored) {}
                    try { if (is != null) is.close(); } catch (Exception ignored) {}
                }
            }

            // 3. Check permanent local app files directory (for downloaded voices)
            if (!assetLoaded) {
                File localFile = new File(getFilesDir(), "media/audio/" + resolvedFileName);
                if (!localFile.exists()) {
                    localFile = new File(getFilesDir(), "audio/" + resolvedFileName);
                }
                if (localFile.exists()) {
                    mediaPlayer.setDataSource(localFile.getAbsolutePath());
                    assetLoaded = true;
                }
            }

            if (assetLoaded) {
                mediaPlayer.setOnCompletionListener(this);
                mediaPlayer.setOnErrorListener(this);
                mediaPlayer.prepare();
                mediaPlayer.start();
                Log.d(TAG, "Audio started playing successfully: " + resolvedFileName);
            } else {
                Log.e(TAG, "Audio file not found: " + resolvedFileName);
                finishWithVisualFallback(title, body, section);
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed playing audio file: " + resolvedFileName, e);
            finishWithVisualFallback(title, body, section);
        }
    }

    private void finishWithVisualFallback(String title, String body, String section) {
        stopAudioAndCleanUp();
        postVisualOnlyNotification(title, body, section);
        releaseWakeLock();
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private String resolveAudioFileName(String audioTrackId, String section) {
        if (audioTrackId != null && !audioTrackId.isEmpty()) {
            if (audioTrackId.endsWith(".mp3") || audioTrackId.endsWith(".wav")) {
                return audioTrackId;
            }
            return audioTrackId + ".mp3";
        }

        if ("prayer_azan".equals(section)) {
            return "makkah.mp3";
        } else if ("prePrayerAlert".equals(section)) {
            return "pre_prayer_15m.mp3";
        } else if ("morningAzkar".equals(section)) {
            return "azkar_sabah.mp3";
        } else if ("eveningAzkar".equals(section)) {
            return "azkar_massa.mp3";
        } else if ("salawat".equals(section)) {
            return "salawat_1.mp3";
        } else if ("musaharati".equals(section)) {
            return "musaharati_1.mp3";
        } else if ("iftar".equals(section)) {
            return "iftar_cannon.mp3";
        }

        return "makkah.mp3";
    }

    private Notification buildNotification(String title, String body) {
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingOpenIntent = PendingIntent.getActivity(
                this,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(this, AzkarAudioService.class);
        stopIntent.setAction(ACTION_STOP_AUDIO);
        PendingIntent pendingStopIntent = PendingIntent.getService(
                this,
                1,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setOngoing(true)
                .setSilent(true)
                .setContentIntent(pendingOpenIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "إيقاف الصوت", pendingStopIntent)
                .build();
    }

    private void postVisualOnlyNotification(String title, String body, String section) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingOpenIntent = PendingIntent.getActivity(
                this,
                2,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        int notifId = 2000 + Math.abs((section != null ? section : "alert").hashCode() % 100);
        Notification notification = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(pendingOpenIntent)
                .build();

        manager.notify(notifId, notification);
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            // Silent channel for Foreground Service so default ding does not overlap MediaPlayer Azan
            NotificationChannel playbackChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "تشغيل الأذان والأذكار",
                    NotificationManager.IMPORTANCE_HIGH
            );
            playbackChannel.setDescription("عرض إشعار الأذان والتنبيهات الإسلامية أثناء التشغيل الصوتي");
            playbackChannel.setSound(null, null);
            playbackChannel.enableVibration(true);
            manager.createNotificationChannel(playbackChannel);

            // Standard alert channel when audio is muted or fallback is used
            NotificationChannel alertChannel = new NotificationChannel(
                    ALERT_CHANNEL_ID,
                    "تنبيهات مواقيت الصلاة",
                    NotificationManager.IMPORTANCE_HIGH
            );
            alertChannel.setDescription("تنبيهات مرئية عند كتم صوت الأذان");
            alertChannel.enableVibration(true);
            manager.createNotificationChannel(alertChannel);
        }
    }

    private void requestAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(
                            new AudioAttributes.Builder()
                                    .setUsage(AudioAttributes.USAGE_ALARM)
                                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                    .build()
                    )
                    .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            @SuppressWarnings("deprecation")
            int ignored = audioManager.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
        }
    }

    private void abandonAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioFocusRequest = null;
        } else {
            @SuppressWarnings("deprecation")
            int ignored = audioManager.abandonAudioFocus(null);
        }
    }

    private void stopAudioAndCleanUp() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception e) {
                Log.e(TAG, "Error releasing MediaPlayer", e);
            }
            mediaPlayer = null;
        }
        abandonAudioFocus();
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onCompletion(MediaPlayer mp) {
        Log.d(TAG, "Audio playback completed successfully");
        stopAudioAndCleanUp();
        releaseWakeLock();
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        Log.e(TAG, "MediaPlayer error: what=" + what + ", extra=" + extra);
        stopAudioAndCleanUp();
        releaseWakeLock();
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
        return true;
    }

    @Override
    public void onDestroy() {
        stopAudioAndCleanUp();
        releaseWakeLock();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
