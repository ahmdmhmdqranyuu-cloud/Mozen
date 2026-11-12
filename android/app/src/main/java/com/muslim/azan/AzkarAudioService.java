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

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Standard Android Foreground Service:
 * - Plays Azan, Iqama, and Azkar audio safely in the background upon AlarmManager triggers.
 * - Displays a clear, standard notification in the status bar notification shade.
 * - Supports Android 14, 15, and 16 with FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK.
 * - Manages audio focus, releases CPU WakeLock cleanly upon completion, and prevents overlapping audio.
 */
public class AzkarAudioService extends Service implements MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener {
    private static final String TAG = "AzkarAudioService";
    private static final String CHANNEL_ID = "islamic_azan_playback_channel";
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
        createNotificationChannel();

        // Immediately start foreground on creation to comply with Android 12-16 requirements
        Notification initialNotification = buildNotification("تطبيق المؤذن", "جاري تشغيل تنبيه الأذان والأذكار...");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, initialNotification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, initialNotification);
        }

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AlMoazen::AudioPlaybackWakeLock");
            wakeLock.acquire(5 * 60 * 1000L); // 5 minutes max safety timeout
        }

        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP_AUDIO.equals(action) || ACTION_MUTE_AUDIO_ONLY.equals(action)) {
            stopAudioAndCleanUp();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

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
            } else if ("morningAzkar".equals(section)) {
                title = "موعد أذكار الصباح";
            } else if ("eveningAzkar".equals(section)) {
                title = "موعد أذكار المساء";
            } else if ("salawat".equals(section)) {
                title = "الصلاة والسلام على رسول الله ﷺ";
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

        // Check user preferences for Azan sound
        SharedPreferences prefs = getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
        boolean soundEnabled = prefs.getBoolean("azanSoundEnabled", true);

        // Update Foreground with normal notification in notification shade
        Notification notification = buildNotification(title, body);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, notification);
        }

        if (autoPlay && soundEnabled) {
            playAudioSafely(audioTrackId, section);
        } else {
            // No sound requested; schedule release
            releaseWakeLock();
        }

        return START_NOT_STICKY;
    }

    private void playAudioSafely(String audioTrackId, String section) {
        stopAudioAndCleanUp();

        String resolvedFileName = resolveAudioFileName(audioTrackId, section);
        if (resolvedFileName == null) {
            Log.w(TAG, "No audio file resolved for track: " + audioTrackId);
            return;
        }

        requestAudioFocus();

        try {
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
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
                // Try direct asset path
                try {
                    AssetFileDescriptor afd = getAssets().openFd(resolvedFileName);
                    mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                    afd.close();
                    assetLoaded = true;
                } catch (Exception ignored) {}
            }

            // 2. Fallback: Copy from assets input stream to cache if openFd failed due to compression
            if (!assetLoaded) {
                try {
                    InputStream is = null;
                    try {
                        is = getAssets().open("audio/" + resolvedFileName);
                    } catch (Exception e1) {
                        try {
                            is = getAssets().open(resolvedFileName);
                        } catch (Exception ignored) {}
                    }

                    if (is != null) {
                        File tempFile = new File(getCacheDir(), "azan_" + resolvedFileName);
                        FileOutputStream fos = new FileOutputStream(tempFile);
                        byte[] buffer = new byte[8192];
                        int bytesRead;
                        while ((bytesRead = is.read(buffer)) != -1) {
                            fos.write(buffer, 0, bytesRead);
                        }
                        fos.flush();
                        fos.close();
                        is.close();

                        if (tempFile.exists() && tempFile.length() > 0) {
                            mediaPlayer.setDataSource(tempFile.getAbsolutePath());
                            assetLoaded = true;
                        }
                    }
                } catch (Exception streamEx) {
                    Log.w(TAG, "Asset stream extraction failed for " + resolvedFileName, streamEx);
                }
            }

            // 3. If not in assets, check permanent local app files directory
            if (!assetLoaded) {
                File localFile = new File(getFilesDir(), "audio/" + resolvedFileName);
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
                abandonAudioFocus();
                releaseWakeLock();
            }

        } catch (IOException e) {
            Log.e(TAG, "Failed playing audio file: " + resolvedFileName, e);
            stopAudioAndCleanUp();
        }
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
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent stopIntent = new Intent(this, AzkarAudioService.class);
        stopIntent.setAction(ACTION_STOP_AUDIO);
        PendingIntent pendingStopIntent = PendingIntent.getService(
                this,
                1,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(pendingOpenIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "إيقاف الصوت", pendingStopIntent)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "تنبيهات الأذان والأذكار",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("تشغيل صوت الأذان والتنبيهات الإسلامية في شريط الإشعارات");
            channel.enableVibration(true);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void requestAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setAudioAttributes(
                            new AudioAttributes.Builder()
                                    .setUsage(AudioAttributes.USAGE_ALARM)
                                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                    .build()
                    )
                    .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        }
    }

    private void abandonAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioFocusRequest = null;
        } else {
            audioManager.abandonAudioFocus(null);
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
        stopForeground(true);
        stopSelf();
    }

    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        Log.e(TAG, "MediaPlayer error: what=" + what + ", extra=" + extra);
        stopAudioAndCleanUp();
        releaseWakeLock();
        stopForeground(true);
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
