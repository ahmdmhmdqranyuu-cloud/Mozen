package com.muslim.azan;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.AssetFileDescriptor;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.CountDownTimer;
import android.os.IBinder;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;

import java.io.IOException;
import java.util.Locale;

/**
 * Foreground service executing:
 * 1. Azan & Islamic reminder audio playback in the background
 * 2. Screen Wake-Up (PowerManager ACQUIRE_CAUSES_WAKEUP) when wakeScreenOnAzanEnabled is enabled
 * 3. Lock-Screen Full Screen Intent notification when lockScreenAzanEnabled is enabled
 * 4. Draggable SYSTEM_ALERT_WINDOW Floating Azan Window over other apps with Prayer Name,
 *    Iqama Countdown, Prayer Azkar button, Quran button, Qibla button, Minimize & Close controls.
 */
public class AzkarAudioService extends Service {
    private static final String TAG = "AzkarAudioService";
    private static final String CHANNEL_ID = "islamic_azan_lockscreen_channel";
    private static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_SHOW_OVERLAY_ONLY = "com.muslim.azan.ACTION_SHOW_OVERLAY_ONLY";
    public static final String ACTION_DISMISS_OVERLAY = "com.muslim.azan.ACTION_DISMISS_OVERLAY";
    public static final String ACTION_MUTE_AUDIO_ONLY = "com.muslim.azan.ACTION_MUTE_AUDIO_ONLY";

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock cpuWakeLock;
    private PowerManager.WakeLock screenWakeLock;
    private WindowManager windowManager;
    private View floatingView;
    private CountDownTimer iqamaCountDownTimer;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            cpuWakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AzkarApp::AudioWakeLock");
            cpuWakeLock.acquire(5 * 60 * 1000L); // 5 minutes max
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        String action = intent.getAction();
        if (ACTION_DISMISS_OVERLAY.equals(action)) {
            removeFloatingOverlay();
            stopCurrentAudio();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_MUTE_AUDIO_ONLY.equals(action)) {
            stopCurrentAudio();
            return START_NOT_STICKY;
        }

        SharedPreferences prefs = getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
        boolean prefFloating = prefs.getBoolean("floatingAzanWindowEnabled", true);
        boolean prefLockScreen = prefs.getBoolean("lockScreenAzanEnabled", true);
        boolean prefWakeScreen = prefs.getBoolean("wakeScreenOnAzanEnabled", true);
        boolean prefSound = prefs.getBoolean("azanSoundEnabled", true);

        if (ACTION_SHOW_OVERLAY_ONLY.equals(action)) {
            String prayerName = intent.getStringExtra("prayerName");
            String cityName = intent.getStringExtra("cityName");
            int iqamaMins = intent.getIntExtra("iqamaDurationMinutes", 15);
            Notification notif = buildNotification(
                    "الله أكبر • صلاة " + (prayerName != null ? prayerName : ""),
                    "النافذة العائمة للأذان والإقامة نشطة الآن",
                    prefLockScreen
            );
            startForeground(NOTIFICATION_ID, notif);
            if (prefFloating) {
                showDraggableFloatingWindow(
                        prayerName != null ? prayerName : "الصلاة",
                        cityName != null ? cityName : "",
                        iqamaMins
                );
            }
            return START_NOT_STICKY;
        }

        String section = intent.getStringExtra("section");
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String audioTrackId = intent.getStringExtra("audioTrackId");
        boolean autoPlay = intent.getBooleanExtra("autoPlay", true) && prefSound;

        if (title == null || title.isEmpty()) title = "حان الآن موعد الأذان";
        if (body == null || body.isEmpty()) body = "الله أكبر • حي على الصلاة";

        // Display standard high-priority notification (strictly in notification shade, NO full screen intent)
        Notification notification = buildNotification(title, body);
        startForeground(NOTIFICATION_ID, notification);

        // Play Azan or Reminder Audio in background until completion
        if (autoPlay && audioTrackId != null && !audioTrackId.isEmpty()) {
            playAudioTrack(audioTrackId);
        } else {
            stopForeground(true);
            stopSelf();
        }

        return START_NOT_STICKY;
    }

    @SuppressWarnings("deprecation")
    private void wakeUpDeviceScreen() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                if (screenWakeLock != null && screenWakeLock.isHeld()) {
                    screenWakeLock.release();
                }
                screenWakeLock = pm.newWakeLock(
                        PowerManager.SCREEN_BRIGHT_WAKE_LOCK
                                | PowerManager.ACQUIRE_CAUSES_WAKEUP
                                | PowerManager.ON_AFTER_RELEASE,
                        "AzkarApp::ScreenWakeLock"
                );
                screenWakeLock.acquire(45 * 1000L);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not wake screen", e);
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    private void showDraggableFloatingWindow(String prayerName, String cityName, int iqamaMinutes) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            return;
        }

        removeFloatingOverlay();

        try {
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
            if (windowManager == null) return;

            int layoutFlag;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
            } else {
                //noinspection deprecation
                layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
            }

            final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    dpToPx(330),
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    layoutFlag,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                            | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                    PixelFormat.TRANSLUCENT
            );
            params.gravity = Gravity.CENTER;

            // Root container styled in Deep Islamic Emerald (#071F1B) with Gold border (#C5A059)
            LinearLayout root = new LinearLayout(this);
            root.setOrientation(LinearLayout.VERTICAL);
            root.setPadding(dpToPx(16), dpToPx(14), dpToPx(16), dpToPx(16));
            root.setGravity(Gravity.CENTER_HORIZONTAL);

            GradientDrawable bg = new GradientDrawable(
                    GradientDrawable.Orientation.TOP_BOTTOM,
                    new int[]{Color.parseColor("#0B3D35"), Color.parseColor("#071F1B")}
            );
            bg.setCornerRadius(dpToPx(24));
            bg.setStroke(dpToPx(2), Color.parseColor("#C5A059"));
            root.setBackground(bg);

            // Header row: Close button + Title + Minimize button
            LinearLayout headerRow = new LinearLayout(this);
            headerRow.setOrientation(LinearLayout.HORIZONTAL);
            headerRow.setGravity(Gravity.CENTER_VERTICAL);

            Button btnClose = createStyledButton("✕ إغلاق", "#33FFFFFF", "#FFFFFF", 11);
            btnClose.setOnClickListener(v -> {
                stopCurrentAudio();
                removeFloatingOverlay();
                stopForeground(true);
                stopSelf();
            });

            TextView dragHint = new TextView(this);
            dragHint.setText("نافذة الأذان العائمة • اسحب للتحريك");
            dragHint.setTextColor(Color.parseColor("#FDE68A"));
            dragHint.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            dragHint.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams hintLp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            dragHint.setLayoutParams(hintLp);

            Button btnMinimize = createStyledButton("تصغير", "#33C5A059", "#FDE68A", 11);
            btnMinimize.setOnClickListener(v -> removeFloatingOverlay());

            headerRow.addView(btnClose);
            headerRow.addView(dragHint);
            headerRow.addView(btnMinimize);
            root.addView(headerRow);

            // Prayer Name Title
            TextView tvPrayerTitle = new TextView(this);
            tvPrayerTitle.setText("اللهُ أَكْبَرُ • صلاة " + prayerName);
            tvPrayerTitle.setTextColor(Color.parseColor("#FDE68A"));
            tvPrayerTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 21);
            tvPrayerTitle.setTypeface(Typeface.DEFAULT_BOLD);
            tvPrayerTitle.setGravity(Gravity.CENTER);
            tvPrayerTitle.setPadding(0, dpToPx(10), 0, dpToPx(2));
            root.addView(tvPrayerTitle);

            if (cityName != null && !cityName.isEmpty()) {
                TextView tvCity = new TextView(this);
                tvCity.setText("حسب التوقيت المحلي لمدينة " + cityName);
                tvCity.setTextColor(Color.parseColor("#D1FAE5"));
                tvCity.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
                tvCity.setGravity(Gravity.CENTER);
                root.addView(tvCity);
            }

            // Circular Countdown Display
            final TextView tvCountdown = new TextView(this);
            tvCountdown.setText(String.format(Locale.US, "%02d:00", iqamaMinutes));
            tvCountdown.setTextColor(Color.WHITE);
            tvCountdown.setTextSize(TypedValue.COMPLEX_UNIT_SP, 26);
            tvCountdown.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            tvCountdown.setGravity(Gravity.CENTER);
            tvCountdown.setPadding(dpToPx(22), dpToPx(14), dpToPx(22), dpToPx(14));

            GradientDrawable circleBg = new GradientDrawable();
            circleBg.setColor(Color.parseColor("#104B40"));
            circleBg.setCornerRadius(dpToPx(999));
            circleBg.setStroke(dpToPx(3), Color.parseColor("#C5A059"));
            tvCountdown.setBackground(circleBg);

            LinearLayout.LayoutParams circleLp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            circleLp.topMargin = dpToPx(10);
            circleLp.bottomMargin = dpToPx(10);
            tvCountdown.setLayoutParams(circleLp);
            root.addView(tvCountdown);

            // Mute Azan sound button
            Button btnMuteAzan = createStyledButton("كتم صوت الأذان فقط", "#B91C1C", "#FFFFFF", 12);
            LinearLayout.LayoutParams fullWidthLp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            fullWidthLp.topMargin = dpToPx(6);
            btnMuteAzan.setLayoutParams(fullWidthLp);
            btnMuteAzan.setOnClickListener(v -> {
                stopCurrentAudio();
                btnMuteAzan.setText("تم كتم صوت الأذان ✓");
            });
            root.addView(btnMuteAzan);

            // Button: زر أذكار الصلاة (Requirement 1)
            Button btnPrayerAzkar = createStyledButton("أذكار الصلاة وما بعد السلام", "#C5A059", "#071F1B", 13);
            btnPrayerAzkar.setLayoutParams(fullWidthLp);
            btnPrayerAzkar.setOnClickListener(v -> openAppSectionFromOverlay("azkar"));
            root.addView(btnPrayerAzkar);

            // Row: زرا القرآن والقبلة (Requirement 1)
            LinearLayout bottomRow = new LinearLayout(this);
            bottomRow.setOrientation(LinearLayout.HORIZONTAL);
            LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            rowLp.topMargin = dpToPx(6);
            bottomRow.setLayoutParams(rowLp);

            Button btnQuran = createStyledButton("القرآن الكريم", "#104B40", "#FDE68A", 12);
            LinearLayout.LayoutParams halfLp1 = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            halfLp1.rightMargin = dpToPx(4);
            btnQuran.setLayoutParams(halfLp1);
            btnQuran.setOnClickListener(v -> openAppSectionFromOverlay("quran"));

            Button btnQibla = createStyledButton("اتجاه القبلة", "#104B40", "#FDE68A", 12);
            LinearLayout.LayoutParams halfLp2 = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            halfLp2.leftMargin = dpToPx(4);
            btnQibla.setLayoutParams(halfLp2);
            btnQibla.setOnClickListener(v -> openAppSectionFromOverlay("qibla"));

            bottomRow.addView(btnQuran);
            bottomRow.addView(btnQibla);
            root.addView(bottomRow);

            // Drag listener to move the Floating Azan Window anywhere on screen
            root.setOnTouchListener(new View.OnTouchListener() {
                private int initialX;
                private int initialY;
                private float initialTouchX;
                private float initialTouchY;

                @Override
                public boolean onTouch(View v, MotionEvent event) {
                    switch (event.getAction()) {
                        case MotionEvent.ACTION_DOWN:
                            initialX = params.x;
                            initialY = params.y;
                            initialTouchX = event.getRawX();
                            initialTouchY = event.getRawY();
                            return true;
                        case MotionEvent.ACTION_MOVE:
                            params.x = initialX + (int) (event.getRawX() - initialTouchX);
                            params.y = initialY + (int) (event.getRawY() - initialTouchY);
                            if (windowManager != null && floatingView != null) {
                                windowManager.updateViewLayout(floatingView, params);
                            }
                            return true;
                    }
                    return false;
                }
            });

            floatingView = root;
            windowManager.addView(floatingView, params);

            // Start live countdown timer for Iqama
            long totalMs = Math.max(1, iqamaMinutes) * 60 * 1000L;
            iqamaCountDownTimer = new CountDownTimer(totalMs, 1000L) {
                @Override
                public void onTick(long millisUntilFinished) {
                    long totalSec = millisUntilFinished / 1000L;
                    long m = totalSec / 60L;
                    long s = totalSec % 60L;
                    tvCountdown.setText(String.format(Locale.US, "%02d:%02d", m, s));
                }

                @Override
                public void onFinish() {
                    tvCountdown.setText("قد قامت الصلاة");
                }
            }.start();

        } catch (Exception e) {
            Log.e(TAG, "Failed to display floating Azan window", e);
        }
    }

    private void openAppSectionFromOverlay(String sectionName) {
        removeFloatingOverlay();
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openIntent.putExtra("open_section", sectionName);
        startActivity(openIntent);
    }

    private Button createStyledButton(String text, String bgColorHex, String textColorHex, int spSize) {
        Button btn = new Button(this);
        btn.setText(text);
        btn.setTextColor(Color.parseColor(textColorHex));
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, spSize);
        btn.setAllCaps(false);
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(Color.parseColor(bgColorHex));
        drawable.setCornerRadius(dpToPx(12));
        drawable.setStroke(dpToPx(1), Color.parseColor("#66C5A059"));
        btn.setBackground(drawable);
        btn.setPadding(dpToPx(10), dpToPx(8), dpToPx(10), dpToPx(8));
        return btn;
    }

    private int dpToPx(int dp) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                dp,
                getResources().getDisplayMetrics()
        );
    }

    private void removeFloatingOverlay() {
        if (iqamaCountDownTimer != null) {
            iqamaCountDownTimer.cancel();
            iqamaCountDownTimer = null;
        }
        if (windowManager != null && floatingView != null) {
            try {
                windowManager.removeView(floatingView);
            } catch (Exception ignored) {}
            floatingView = null;
        }
    }

    private void playAudioTrack(String trackId) {
        stopCurrentAudio();

        String assetPath = mapTrackIdToAssetPath(trackId);
        try {
            // Request audio focus to ensure clean audio priority
            android.media.AudioManager audioManager = (android.media.AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    android.media.AudioFocusRequest focusRequest = new android.media.AudioFocusRequest.Builder(android.media.AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                            .setAudioAttributes(new AudioAttributes.Builder()
                                    .setUsage(AudioAttributes.USAGE_ALARM)
                                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                    .build())
                            .build();
                    audioManager.requestAudioFocus(focusRequest);
                } else {
                    audioManager.requestAudioFocus(null, android.media.AudioManager.STREAM_ALARM, android.media.AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
                }
            }

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());

            // Acquire CPU wake lock to ensure uninterrupted playback when device screen is turned off
            if (cpuWakeLock != null && !cpuWakeLock.isHeld()) {
                cpuWakeLock.acquire(5 * 60 * 1000L);
            }

            try {
                AssetFileDescriptor afd = getAssets().openFd(assetPath);
                mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                afd.close();
            } catch (Exception ex) {
                Log.w(TAG, "openFd failed for " + assetPath + ", using resilient stream cache fallback: " + ex.getMessage());
                try (java.io.InputStream is = getAssets().open(assetPath)) {
                    java.io.File cacheAudio = new java.io.File(getCacheDir(), "alert_playback.mp3");
                    try (java.io.FileOutputStream fos = new java.io.FileOutputStream(cacheAudio)) {
                        byte[] buffer = new byte[8192];
                        int read;
                        while ((read = is.read(buffer)) != -1) {
                            fos.write(buffer, 0, read);
                        }
                    }
                    mediaPlayer.setDataSource(cacheAudio.getAbsolutePath());
                }
            }

            mediaPlayer.setOnCompletionListener(mp -> {
                Log.d(TAG, "Audio playback completed gracefully.");
                stopCurrentAudio();
                stopForeground(true);
                stopSelf();
            });

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error: " + what + ", " + extra);
                stopCurrentAudio();
                stopForeground(true);
                stopSelf();
                return true;
            });

            mediaPlayer.prepare();
            mediaPlayer.start();
            Log.d(TAG, "Started audio playback successfully for: " + assetPath);
        } catch (Exception e) {
            Log.e(TAG, "Failed to load audio asset: " + assetPath, e);
            stopCurrentAudio();
            stopForeground(true);
            stopSelf();
        }
    }

    private String mapTrackIdToAssetPath(String trackId) {
        if (trackId == null || trackId.isEmpty()) return "dist/audio/makkah.mp3";
        String clean = trackId.startsWith("azan_") ? trackId.substring(5) : trackId;
        if (clean.startsWith("/audio/")) clean = clean.substring(7);
        if (clean.endsWith(".mp3")) clean = clean.substring(0, clean.length() - 4);

        if ("makkah".equals(clean)) return "dist/audio/makkah.mp3";
        if ("fajr".equals(clean)) return "dist/audio/fajr.mp3";
        if ("cairo".equals(clean)) return "dist/audio/cairo.mp3";
        if ("madinah".equals(clean)) return "dist/audio/madinah.mp3";
        if ("alaqsa".equals(clean)) return "dist/audio/alaqsa.mp3";
        if ("alafasy".equals(clean)) return "dist/audio/alafasy.mp3";
        if ("abdulbasit".equals(clean)) return "dist/audio/abdulbasit.mp3";
        if ("abdulbasit_fajr".equals(clean)) return "dist/audio/abdulbasit_fajr.mp3";
        if ("hussary".equals(clean)) return "dist/audio/hussary.mp3";
        if ("ibrahim_madani".equals(clean)) return "dist/audio/ibrahim_madani.mp3";
        if ("mohamed_rifaat".equals(clean)) return "dist/audio/mohamed_rifaat.mp3";
        if ("mustafa_ismail".equals(clean)) return "dist/audio/mustafa_ismail.mp3";
        if ("nasser_alqatami".equals(clean)) return "dist/audio/nasser_alqatami.mp3";
        if ("toubar_fajr".equals(clean)) return "dist/audio/toubar_fajr.mp3";
        if ("salawat_1".equals(clean)) return "dist/audio/salawat_1.mp3";
        if ("salawat_2".equals(clean)) return "dist/audio/salawat_2.mp3";
        if ("salawat_3".equals(clean)) return "dist/audio/salawat_3.mp3";
        if ("azkar_sabah_1".equals(clean) || "azkar_sabah".equals(clean)) return "dist/audio/azkar_sabah.mp3";
        if ("azkar_massa_1".equals(clean) || "azkar_massa".equals(clean)) return "dist/audio/azkar_massa.mp3";
        if ("musaharati_1".equals(clean)) return "dist/audio/musaharati_1.mp3";
        if ("musaharati_2".equals(clean)) return "dist/audio/musaharati_2.mp3";
        if ("iftar_cannon_1".equals(clean) || "iftar_cannon".equals(clean)) return "dist/audio/iftar_cannon.mp3";
        if ("pre_prayer_15m".equals(clean)) return "dist/audio/pre_prayer_15m.mp3";
        if ("qiyam_first_third".equals(clean)) return "dist/audio/qiyam_first_third.mp3";
        if ("qiyam_last_third".equals(clean)) return "dist/audio/qiyam_last_third.mp3";
        if ("ruqyah_shariah".equals(clean)) return "dist/audio/ruqyah_shariah.mp3";
        if ("madinah_fajr".equals(clean)) return "dist/audio/madinah.mp3";
        if ("asmaa_allah".equals(clean) || "asmaa_allah_al_husna".equals(clean) || "asmaa_allah_al_husna_full".equals(clean)) {
            return "dist/audio/asmaa_allah_al_husna.mp3";
        }
        return "dist/audio/" + clean + ".mp3";
    }

    private void stopCurrentAudio() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    private Notification buildNotification(String title, String body) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, openIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent muteIntent = new Intent(this, AzkarAudioService.class);
        muteIntent.setAction(ACTION_MUTE_AUDIO_ONLY);
        PendingIntent mutePendingIntent = PendingIntent.getService(
                this, 1, muteIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentIntent(pendingIntent)
                .addAction(android.R.drawable.ic_media_pause, "كتم الصوت", mutePendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true);

        return builder.build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "الأذان وشاشة القفل والنافذة العائمة",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("تشغيل الأذان وإظهار نافذة الأذان على شاشة القفل وفوق التطبيقات");
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        removeFloatingOverlay();
        stopCurrentAudio();
        if (cpuWakeLock != null && cpuWakeLock.isHeld()) {
            cpuWakeLock.release();
        }
        if (screenWakeLock != null && screenWakeLock.isHeld()) {
            screenWakeLock.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
