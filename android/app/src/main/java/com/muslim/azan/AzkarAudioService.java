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
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

/**
 * Standard Android Foreground Service:
 * - Plays Azan, Iqama, and Azkar audio safely in the background upon AlarmManager triggers.
 * - Renders a real WindowManager Floating Overlay above other apps when SYSTEM_ALERT_WINDOW is granted.
 * - Attaches a fullScreenIntent to AzanAlertActivity on prayer Azan alerts for locked screens.
 * - Supports Android 14, 15, and 16 (API 34-36) with FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK.
 */
public class AzkarAudioService extends Service implements MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener {
    private static final String TAG = "AzkarAudioService";
    private static final String CHANNEL_ID = "islamic_azan_playback_v2";
    private static final String ALERT_CHANNEL_ID = "islamic_azan_alert_v2";
    private static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_STOP_AUDIO = "com.muslim.azan.ACTION_STOP_AUDIO";
    public static final String ACTION_MUTE_AUDIO_ONLY = "com.muslim.azan.ACTION_MUTE_AUDIO_ONLY";
    public static final String ACTION_SHOW_OVERLAY_TEST = "com.muslim.azan.ACTION_SHOW_OVERLAY_TEST";
    public static final String ACTION_DISMISS_OVERLAY = "com.muslim.azan.ACTION_DISMISS_OVERLAY";

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;

    private WindowManager windowManager;
    private View overlayView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean isOverlayOnlyTest = false;
    private final Runnable autoDismissOverlayTestRunnable = () -> {
        if (isOverlayOnlyTest && (mediaPlayer == null)) {
            removeFloatingOverlaySync();
            stopServiceCleanly();
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();

        // Immediately enter foreground on creation to comply with Android 12-16 FGS timing rules
        Notification initialNotification = buildNotification("تطبيق المؤذن", "جاري تشغيل تنبيه الأذان والأذكار...", "", "");
        startForegroundCompat(initialNotification);

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AlMoazen::AudioPlaybackWakeLock");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(5 * 60 * 1000L);
        }

        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
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
            stopServiceCleanly();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP_AUDIO.equals(action) || ACTION_MUTE_AUDIO_ONLY.equals(action)) {
            stopServiceCleanly();
            return START_NOT_STICKY;
        }

        if (ACTION_DISMISS_OVERLAY.equals(action)) {
            removeFloatingOverlay();
            if (isOverlayOnlyTest && mediaPlayer == null) {
                stopServiceCleanly();
            }
            return START_NOT_STICKY;
        }

        if (ACTION_SHOW_OVERLAY_TEST.equals(action)) {
            isOverlayOnlyTest = true;
            String title = intent.getStringExtra("title");
            String body = intent.getStringExtra("body");
            if (title == null || title.isEmpty()) title = "تجربة الظهور فوق التطبيقات";
            if (body == null || body.isEmpty()) body = "النافذة العائمة للأذان تعمل بنجاح فوق التطبيقات الأخرى.";

            Notification testNotif = buildNotification(title, body, "overlay_test", "");
            startForegroundCompat(testNotif);
            showFloatingOverlay(title, body, true);
            mainHandler.removeCallbacks(autoDismissOverlayTestRunnable);
            mainHandler.postDelayed(autoDismissOverlayTestRunnable, 20_000L);
            return START_NOT_STICKY;
        }

        isOverlayOnlyTest = false;
        mainHandler.removeCallbacks(autoDismissOverlayTestRunnable);
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

        SharedPreferences prefs = getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
        boolean azanSoundEnabled = prefs.getBoolean("azanSoundEnabled", true);
        boolean shouldPlayAudio = autoPlay && (!"prayer_azan".equals(section) || azanSoundEnabled);

        if (shouldPlayAudio) {
            Notification notification = buildNotification(title, body, section, cityName);
            startForegroundCompat(notification);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, notification);
            }
            // Show real Floating Overlay above other apps if SYSTEM_ALERT_WINDOW is granted
            if ("prayer_azan".equals(section) || "prePrayerAlert".equals(section) || "iftar".equals(section)) {
                showFloatingOverlay(title, body, false);
            }
            playAudioSafely(audioTrackId, section, title, body);
        } else {
            postVisualOnlyNotification(title, body, section);
            stopServiceCleanly();
        }

        return START_NOT_STICKY;
    }

    private void showFloatingOverlay(String title, String body, boolean overlayTestMode) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Log.d(TAG, "SYSTEM_ALERT_WINDOW not granted; skipping floating overlay");
            return;
        }
        mainHandler.post(() -> showFloatingOverlayOnMain(title, body, overlayTestMode));
    }

    private void showFloatingOverlayOnMain(String title, String body, boolean overlayTestMode) {
        if (windowManager == null) return;
        removeFloatingOverlaySync();

        try {
            LinearLayout card = new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
            int padH = dp(18);
            int padV = dp(16);
            card.setPadding(padH, padV, padH, padV);

            GradientDrawable bg = new GradientDrawable();
            bg.setColor(Color.parseColor("#F509241C"));
            bg.setCornerRadius(dp(20));
            bg.setStroke(dp(2), Color.parseColor("#F59E0B"));
            card.setBackground(bg);
            card.setElevation(dp(12));

            TextView badgeView = new TextView(this);
            badgeView.setText("تطبيق المؤذن");
            badgeView.setTextColor(Color.parseColor("#F59E0B"));
            badgeView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
            badgeView.setTypeface(null, Typeface.BOLD);
            card.addView(badgeView);

            TextView titleView = new TextView(this);
            titleView.setText(title);
            titleView.setTextColor(Color.parseColor("#ECFDF5"));
            titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
            titleView.setTypeface(null, Typeface.BOLD);
            titleView.setPadding(0, dp(4), 0, dp(4));
            card.addView(titleView);

            TextView bodyView = new TextView(this);
            bodyView.setText(body);
            bodyView.setTextColor(Color.parseColor("#A7F3D0"));
            bodyView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
            bodyView.setPadding(0, 0, 0, dp(14));
            card.addView(bodyView);

            LinearLayout actionsRow = new LinearLayout(this);
            actionsRow.setOrientation(LinearLayout.HORIZONTAL);
            actionsRow.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

            TextView primaryBtn = createOverlayButton(
                    overlayTestMode ? "إغلاق التجربة" : "إيقاف الأذان",
                    "#F59E0B",
                    "#09241C",
                    v -> {
                        if (overlayTestMode) {
                            removeFloatingOverlaySync();
                            stopServiceCleanly();
                        } else {
                            stopServiceCleanly();
                        }
                    }
            );
            LinearLayout.LayoutParams primaryLp = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f
            );
            primaryLp.setMarginEnd(dp(8));
            actionsRow.addView(primaryBtn, primaryLp);

            if (!overlayTestMode) {
                TextView hideBtn = createOverlayButton(
                        "إخفاء النافذة",
                        "#1D4D3E",
                        "#ECFDF5",
                        v -> removeFloatingOverlaySync()
                );
                LinearLayout.LayoutParams hideLp = new LinearLayout.LayoutParams(
                        0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f
                );
                actionsRow.addView(hideBtn, hideLp);
            }

            card.addView(actionsRow);

            int screenWidth = getResources().getDisplayMetrics().widthPixels;
            int cardWidth = (int) (screenWidth * 0.92f);

            int overlayType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    : WindowManager.LayoutParams.TYPE_PHONE;

            @SuppressWarnings("deprecation")
            int flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON;

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    cardWidth,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    overlayType,
                    flags,
                    PixelFormat.TRANSLUCENT
            );
            params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            params.y = dp(42);

            windowManager.addView(card, params);
            overlayView = card;
            Log.d(TAG, "Floating Azan overlay displayed above apps");
        } catch (Exception e) {
            Log.e(TAG, "Failed to display floating overlay", e);
        }
    }

    private TextView createOverlayButton(String label, String bgHex, String textHex, View.OnClickListener listener) {
        TextView btn = new TextView(this);
        btn.setText(label);
        btn.setTextColor(Color.parseColor(textHex));
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        btn.setTypeface(null, Typeface.BOLD);
        btn.setGravity(Gravity.CENTER);
        btn.setPadding(dp(12), dp(10), dp(12), dp(10));

        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.parseColor(bgHex));
        btnBg.setCornerRadius(dp(10));
        btn.setBackground(btnBg);
        btn.setClickable(true);
        btn.setFocusable(true);
        btn.setOnClickListener(listener);
        return btn;
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
        ));
    }

    private void removeFloatingOverlay() {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            removeFloatingOverlaySync();
        } else {
            mainHandler.post(this::removeFloatingOverlaySync);
        }
    }

    private void removeFloatingOverlaySync() {
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayView);
            } catch (Exception ignored) {}
            overlayView = null;
        }
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
        removeFloatingOverlay();
        postVisualOnlyNotification(title, body, section);
        releaseWakeLock();
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private void stopServiceCleanly() {
        mainHandler.removeCallbacks(autoDismissOverlayTestRunnable);
        isOverlayOnlyTest = false;
        stopAudioAndCleanUp();
        removeFloatingOverlay();
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

    private Notification buildNotification(String title, String body, String section, String cityName) {
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

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setOngoing(true)
                .setSilent(true)
                .setContentIntent(pendingOpenIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "إيقاف الصوت", pendingStopIntent);

        if ("prayer_azan".equals(section)) {
            boolean canFullScreen = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                canFullScreen = nm == null || nm.canUseFullScreenIntent();
            }
            if (canFullScreen) {
                Intent alertIntent = new Intent(this, AzanAlertActivity.class);
                alertIntent.putExtra("title", title);
                alertIntent.putExtra("body", body);
                alertIntent.putExtra("cityName", cityName != null ? cityName : "");
                alertIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
                PendingIntent fullScreenPi = PendingIntent.getActivity(
                        this,
                        4001,
                        alertIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                builder.setFullScreenIntent(fullScreenPi, true);
            }
        }

        return builder.build();
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

            NotificationChannel playbackChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "تشغيل الأذان والأذكار",
                    NotificationManager.IMPORTANCE_HIGH
            );
            playbackChannel.setDescription("عرض إشعار الأذان والتنبيهات الإسلامية أثناء التشغيل الصوتي");
            playbackChannel.setSound(null, null);
            playbackChannel.enableVibration(true);
            manager.createNotificationChannel(playbackChannel);

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
        stopServiceCleanly();
    }

    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        Log.e(TAG, "MediaPlayer error: what=" + what + ", extra=" + extra);
        stopServiceCleanly();
        return true;
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacks(autoDismissOverlayTestRunnable);
        stopAudioAndCleanUp();
        removeFloatingOverlaySync();
        releaseWakeLock();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
