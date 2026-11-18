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
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.app.AlarmManager;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import com.muslim.azan.service.AudioFocusStateMachine;
import com.muslim.azan.service.FifoAudioQueue;
import com.muslim.azan.service.NativeAudioPlayerManager;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

/**
 * Standard Android Foreground Service:
 * - Plays Azan, Iqama, and Azkar audio safely in the background upon AlarmManager triggers or user tests.
 * - Renders a real WindowManager Floating Overlay above other apps when SYSTEM_ALERT_WINDOW is granted.
 * - Attaches a fullScreenIntent to AzanAlertActivity on prayer Azan alerts for locked screens.
 * - Broadcasts live playback/error status via ACTION_AUDIO_STATE_CHANGED for sound-test diagnostics.
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
    public static final String ACTION_AUDIO_STATE_CHANGED = "com.muslim.azan.AUDIO_STATE_CHANGED";

    public static volatile boolean isPlayingNow = false;
    public static volatile String currentSection = "";
    public static volatile String activeTrackLabel = "";
    public static volatile String lastAudioError = null;

    public static int getSectionPriority(String sec) {
        if (sec == null) return 0;
        switch (sec) {
            case "prayer_azan":
                return 5;
            case "iqama":
                return 4;
            case "prePrayerAlert":
            case "duha_prayer":
                return 3;
            case "morningAzkar":
            case "eveningAzkar":
            case "musaharati":
            case "iftar":
            case "dua_after":
                return 2;
            case "salawat":
                return 1;
            default:
                return 0;
        }
    }

    public static boolean canPreemptCurrentPlayback(String incomingSection) {
        if (!isPlayingNow) return true;
        int incoming = getSectionPriority(incomingSection);
        int current = getSectionPriority(currentSection);
        // Active Azan (5) must NEVER be interrupted by a duplicate Azan or equal/lower alert
        if (current >= 5 && incoming <= current) {
            return false;
        }
        // Only strictly higher-priority triggers preempt running playback
        return incoming > current;
    }

    public static boolean shouldQueueWhenBlocked(String incomingSection) {
        if (incomingSection == null) return false;
        switch (incomingSection) {
            case "morningAzkar":
            case "eveningAzkar":
            case "salawat":
            case "musaharati":
            case "iftar":
            case "dua_after":
            case "prePrayerAlert":
                return true;
            default:
                return false;
        }
    }

    private final FifoAudioQueue<Intent> pendingAudioQueue = new FifoAudioQueue<>(20);
    private final AudioFocusStateMachine focusStateMachine = new AudioFocusStateMachine();
    private volatile boolean currentIsTestAlarm = false;
    private volatile String currentAudioTrackId = "";
    private float currentScalarVolume = 1.0f;

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private final AudioManager.OnAudioFocusChangeListener audioFocusChangeListener = focusChange -> {
        boolean playing = false;
        try {
            playing = mediaPlayer != null && mediaPlayer.isPlaying();
        } catch (Exception ignored) {}
        AudioFocusStateMachine.FocusAction action = focusStateMachine.onFocusChange(
                focusChange,
                playing,
                getSectionPriority(currentSection) >= 5
        );
        switch (action) {
            case STOP_PERMANENT:
                stopServiceCleanly();
                break;
            case PAUSE_TRANSIENT:
                try {
                    if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                        mediaPlayer.pause();
                    }
                } catch (Exception ignored) {}
                break;
            case DUCK_VOLUME:
                try {
                    if (mediaPlayer != null) {
                        float ducked = Math.min(0.25f, currentScalarVolume);
                        mediaPlayer.setVolume(ducked, ducked);
                    }
                } catch (Exception ignored) {}
                break;
            case RESUME_AFTER_TRANSIENT:
                try {
                    if (mediaPlayer != null) {
                        mediaPlayer.setVolume(currentScalarVolume, currentScalarVolume);
                        if (!mediaPlayer.isPlaying()) {
                            mediaPlayer.start();
                        }
                    }
                } catch (Exception ignored) {}
                break;
            case RESTORE_VOLUME_ONLY:
                try {
                    if (mediaPlayer != null) {
                        mediaPlayer.setVolume(currentScalarVolume, currentScalarVolume);
                    }
                } catch (Exception ignored) {}
                break;
            case NONE:
            default:
                break;
        }
    };

    private WindowManager windowManager;
    private View overlayView;
    private WindowManager.LayoutParams overlayParams;
    private boolean overlayExpanded = false;
    private long overlayCountdownEndMs = 0L;
    private String overlayPrayerLabel = "الأذان";
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean isOverlayOnlyTest = false;
    private boolean currentDuaAfterPrayerEnabled = false;
    private String currentPrayerName = "";
    private final Runnable overlayTickerRunnable = new Runnable() {
        @Override
        public void run() {
            updateOverlayCountdownViews();
            if (overlayView != null) {
                mainHandler.postDelayed(this, 1000L);
            }
        }
    };
    private final Runnable shortToneStopRunnable = () -> {
        if (mediaPlayer != null) {
            stopServiceCleanly();
        }
    };
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

        Notification initialNotification = buildNotification("مسلم بلس", "جاري تشغيل تنبيه الأذان والأذكار...", "", "");
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

    private void publishAudioState(boolean playing, String label, String error) {
        isPlayingNow = playing;
        activeTrackLabel = label != null ? label : "";
        lastAudioError = error;
        try {
            Intent b = new Intent(ACTION_AUDIO_STATE_CHANGED);
            b.setPackage(getPackageName());
            b.putExtra("playing", playing);
            b.putExtra("label", activeTrackLabel);
            b.putExtra("error", error);
            sendBroadcast(b);
        } catch (Exception ignored) {}
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
        mainHandler.removeCallbacks(shortToneStopRunnable);
        ensureWakeLockHeld();

        String section = intent.getStringExtra("section");
        boolean isTestAlarm = intent.getBooleanExtra("isTestAlarm", false);

        if (!isTestAlarm && !canPreemptCurrentPlayback(section)) {
            if (shouldQueueWhenBlocked(section)) {
                String pKey = intent.getStringExtra("prayerKey");
                String queueKey = (section != null ? section : "unknown") + "_"
                        + (pKey != null ? pKey : "") + "_"
                        + (System.currentTimeMillis() / 1000L);
                pendingAudioQueue.enqueue(queueKey, new Intent(intent));
                Log.d(TAG, "FIFO queued deferred audio trigger (" + section + "), queueSize=" + pendingAudioQueue.size());
            } else {
                Log.d(TAG, "Ignoring lower/equal-priority audio trigger (" + section + ") while " + currentSection + " is active");
            }
            return START_NOT_STICKY;
        }

        currentIsTestAlarm = isTestAlarm;
        String incomingTrackId = intent.getStringExtra("audioTrackId");
        currentAudioTrackId = incomingTrackId != null ? incomingTrackId : "";
        currentSection = section != null ? section : "";
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String audioTrackId = incomingTrackId;
        String prayerName = intent.getStringExtra("prayerName");
        String cityName = intent.getStringExtra("cityName");
        int iqamaDurationMinutes = intent.getIntExtra("iqamaDurationMinutes", 15);
        int volumePercent = intent.getIntExtra("volumePercent", 100);
        String alertMode = intent.getStringExtra("alertMode");
        if (alertMode == null || alertMode.isEmpty()) alertMode = "full_azan";
        boolean silentDuringPrayer = intent.getBooleanExtra("silentDuringPrayer", false);
        boolean duaAfterPrayerEnabled = intent.getBooleanExtra("duaAfterPrayerEnabled", false);
        boolean autoPlay = intent.getBooleanExtra("autoPlay", true);

        currentDuaAfterPrayerEnabled = duaAfterPrayerEnabled && ("prayer_azan".equals(section) || "iqama".equals(section));
        currentPrayerName = prayerName != null ? prayerName : "";
        overlayPrayerLabel = (prayerName != null && !prayerName.isEmpty()) ? prayerName : "الصلاة";
        overlayCountdownEndMs = System.currentTimeMillis() + Math.max(1, iqamaDurationMinutes) * 60_000L;

        if (title == null || title.isEmpty()) {
            if ("prayer_azan".equals(section) && prayerName != null) {
                title = "حان الآن موعد أذان " + prayerName;
            } else if ("iqama".equals(section) && prayerName != null) {
                title = "حان وقت إقامة صلاة " + prayerName;
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
            } else if ("duha_prayer".equals(section)) {
                title = "حان الآن وقت صلاة الضحى";
            } else if ("dua_after".equals(section)) {
                title = "الدعاء القصير بعد الأذان";
            } else {
                title = "مسلم بلس";
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

        if (silentDuringPrayer && !isTestAlarm && ("prayer_azan".equals(section) || "prePrayerAlert".equals(section))) {
            int durationMin = iqamaDurationMinutes > 0 ? iqamaDurationMinutes : 15;
            RingerRestoreCoordinator.beginSilentDuringPrayer(this, durationMin, System.currentTimeMillis());
        }

        boolean modePlaysSound = !"silent".equals(alertMode) && !"vibrate_only".equals(alertMode);
        // Explicit user sound tests ALWAYS play even when the scheduled Azan mute switch is off
        boolean shouldPlayAudio = isTestAlarm || (autoPlay && modePlaysSound && (!"prayer_azan".equals(section) || azanSoundEnabled || intent.hasExtra("prayerKey")));

        if (shouldPlayAudio) {
            Notification notification = buildNotification(title, body, section, cityName);
            startForegroundCompat(notification);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, notification);
            }
            if ("prayer_azan".equals(section) || "prePrayerAlert".equals(section) || "iftar".equals(section) || "iqama".equals(section)) {
                showFloatingOverlay(title, body, false);
            }
            playAudioSafely(audioTrackId, section, title, body, volumePercent, "short_tone".equals(alertMode));
        } else {
            if ("vibrate_only".equals(alertMode)) {
                triggerShortVibration();
            }
            postVisualOnlyNotification(title, body, section);
            if (currentDuaAfterPrayerEnabled) {
                postDuaAfterPrayerNotification(currentPrayerName);
            }
            stopServiceCleanly();
        }

        return START_NOT_STICKY;
    }

    private void publishTestFailureIfNeeded(String reason) {
        if (!currentIsTestAlarm) return;
        AlarmScheduleTracker.BackgroundTestStatus prevTest = AlarmScheduleTracker.loadBackgroundTestStatus(this);
        AlarmScheduleTracker.saveBackgroundTestStatus(
                this,
                new AlarmScheduleTracker.BackgroundTestStatus(
                        "failed",
                        prevTest != null ? prevTest.scheduleMode : AlarmScheduleTracker.ScheduleMode.FAILED,
                        prevTest != null && prevTest.exactPermissionGranted,
                        prevTest != null ? prevTest.scheduledAtMs : 0L,
                        prevTest != null ? prevTest.triggerAtMs : 0L,
                        prevTest != null && prevTest.firedAtMs > 0L ? prevTest.firedAtMs : System.currentTimeMillis(),
                        currentAudioTrackId,
                        "تعذر تشغيل صوت الاختبار في الخلفية",
                        reason != null ? reason : "فشل غير معروف في المشغل"
                )
        );
    }

    private void triggerShortVibration() {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createWaveform(new long[]{0, 400, 200, 400}, -1));
            } else {
                @SuppressWarnings("deprecation")
                long[] pattern = {0, 400, 200, 400};
                v.vibrate(pattern, -1);
            }
        } catch (Exception ignored) {}
    }

    private void showFloatingOverlay(String title, String body, boolean overlayTestMode) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Log.d(TAG, "SYSTEM_ALERT_WINDOW not granted; skipping floating overlay");
            return;
        }
        mainHandler.post(() -> showFloatingOverlayOnMain(title, body, overlayTestMode));
    }

    private TextView bubbleTickerView;
    private TextView expandedTickerView;

    private String formatRemainingIqama() {
        long diffMs = Math.max(0L, overlayCountdownEndMs - System.currentTimeMillis());
        long totalSec = diffMs / 1000L;
        long mins = totalSec / 60L;
        long secs = totalSec % 60L;
        return String.format(java.util.Locale.US, "%02d:%02d", mins, secs);
    }

    private void updateOverlayCountdownViews() {
        String ticker = formatRemainingIqama();
        if (bubbleTickerView != null) {
            bubbleTickerView.setText(overlayPrayerLabel + " • " + ticker);
        }
        if (expandedTickerView != null) {
            expandedTickerView.setText("متبقي للإقامة: " + ticker);
        }
    }

    private void showFloatingOverlayOnMain(String title, String body, boolean overlayTestMode) {
        if (windowManager == null) return;
        removeFloatingOverlaySync();

        try {
            // Starts collapsed as a draggable floating bubble outside the app on the phone screen
            overlayExpanded = overlayTestMode;

            FrameLayout root = new FrameLayout(this);
            root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

            // 1. Collapsed Draggable Bubble
            LinearLayout bubble = new LinearLayout(this);
            bubble.setOrientation(LinearLayout.HORIZONTAL);
            bubble.setGravity(Gravity.CENTER_VERTICAL);
            bubble.setPadding(dp(12), dp(8), dp(12), dp(8));

            GradientDrawable bubbleBg = new GradientDrawable();
            bubbleBg.setColor(Color.parseColor("#F5F7F4E8"));
            bubbleBg.setCornerRadius(dp(99));
            bubbleBg.setStroke(dp(2), Color.parseColor("#C5A059"));
            bubble.setBackground(bubbleBg);
            bubble.setElevation(dp(10));

            TextView badgeDot = new TextView(this);
            badgeDot.setText("🕌");
            badgeDot.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            badgeDot.setGravity(Gravity.CENTER);
            GradientDrawable dotBg = new GradientDrawable();
            dotBg.setShape(GradientDrawable.OVAL);
            dotBg.setColor(Color.parseColor("#104B40"));
            badgeDot.setBackground(dotBg);
            LinearLayout.LayoutParams dotLp = new LinearLayout.LayoutParams(dp(30), dp(30));
            dotLp.setMarginEnd(dp(8));
            bubble.addView(badgeDot, dotLp);

            LinearLayout bubbleTextCol = new LinearLayout(this);
            bubbleTextCol.setOrientation(LinearLayout.VERTICAL);

            TextView bubbleBrand = new TextView(this);
            bubbleBrand.setText("مسلم بلس • اضغط للفتح");
            bubbleBrand.setTextColor(Color.parseColor("#104B40"));
            bubbleBrand.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            bubbleBrand.setTypeface(null, Typeface.BOLD);
            bubbleTextCol.addView(bubbleBrand);

            TextView bTicker = new TextView(this);
            bTicker.setTextColor(Color.parseColor("#9A7732"));
            bTicker.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            bTicker.setTypeface(null, Typeface.BOLD);
            bubbleTickerView = bTicker;
            bubbleTextCol.addView(bTicker);
            bubble.addView(bubbleTextCol);

            // 2. Expanded Creamy-Ivory & Gold Floating Azan Card
            LinearLayout card = new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
            card.setPadding(dp(16), dp(14), dp(16), dp(14));

            GradientDrawable cardBg = new GradientDrawable();
            cardBg.setColor(Color.parseColor("#F8F7F4E8"));
            cardBg.setCornerRadius(dp(20));
            cardBg.setStroke(dp(2), Color.parseColor("#C5A059"));
            card.setBackground(cardBg);
            card.setElevation(dp(12));

            LinearLayout headerRow = new LinearLayout(this);
            headerRow.setOrientation(LinearLayout.HORIZONTAL);
            headerRow.setGravity(Gravity.CENTER_VERTICAL);

            TextView badgeView = new TextView(this);
            badgeView.setText("🕌 مسلم بلس");
            badgeView.setTextColor(Color.parseColor("#9A7732"));
            badgeView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
            badgeView.setTypeface(null, Typeface.BOLD);
            LinearLayout.LayoutParams badgeLp = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f
            );
            headerRow.addView(badgeView, badgeLp);

            TextView expTicker = new TextView(this);
            expTicker.setTextColor(Color.parseColor("#104B40"));
            expTicker.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            expTicker.setTypeface(null, Typeface.BOLD);
            expandedTickerView = expTicker;
            headerRow.addView(expTicker);
            card.addView(headerRow);

            TextView titleView = new TextView(this);
            titleView.setText(title);
            titleView.setTextColor(Color.parseColor("#104B40"));
            titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
            titleView.setTypeface(null, Typeface.BOLD);
            titleView.setPadding(0, dp(4), 0, dp(3));
            card.addView(titleView);

            TextView bodyView = new TextView(this);
            bodyView.setText(body);
            bodyView.setTextColor(Color.parseColor("#4B5B58"));
            bodyView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
            bodyView.setPadding(0, 0, 0, dp(12));
            card.addView(bodyView);

            LinearLayout actionsRow = new LinearLayout(this);
            actionsRow.setOrientation(LinearLayout.HORIZONTAL);
            actionsRow.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

            TextView primaryBtn = createOverlayButton(
                    overlayTestMode ? "إغلاق التجربة" : "إيقاف الأذان",
                    "#104B40",
                    "#FFFFFF",
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
            primaryLp.setMarginEnd(dp(6));
            actionsRow.addView(primaryBtn, primaryLp);

            TextView minBtn = createOverlayButton(
                    "تصغير لفقاعة",
                    "#C5A059",
                    "#172A28",
                    v -> {
                        overlayExpanded = false;
                        bubble.setVisibility(View.VISIBLE);
                        card.setVisibility(View.GONE);
                        if (overlayParams != null && windowManager != null && overlayView != null) {
                            overlayParams.width = WindowManager.LayoutParams.WRAP_CONTENT;
                            try {
                                windowManager.updateViewLayout(overlayView, overlayParams);
                            } catch (Exception ignored) {}
                        }
                    }
            );
            LinearLayout.LayoutParams minLp = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f
            );
            minLp.setMarginEnd(dp(6));
            actionsRow.addView(minBtn, minLp);

            TextView hideBtn = createOverlayButton(
                    "إخفاء",
                    "#E6ECD6",
                    "#172A28",
                    v -> removeFloatingOverlaySync()
            );
            LinearLayout.LayoutParams hideLp = new LinearLayout.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
            );
            actionsRow.addView(hideBtn, hideLp);

            card.addView(actionsRow);

            int screenWidth = getResources().getDisplayMetrics().widthPixels;
            int cardWidth = (int) (screenWidth * 0.90f);

            card.setLayoutParams(new FrameLayout.LayoutParams(cardWidth, FrameLayout.LayoutParams.WRAP_CONTENT));
            bubble.setLayoutParams(new FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT));

            bubble.setVisibility(overlayExpanded ? View.GONE : View.VISIBLE);
            card.setVisibility(overlayExpanded ? View.VISIBLE : View.GONE);

            root.addView(bubble);
            root.addView(card);

            int overlayType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    : WindowManager.LayoutParams.TYPE_PHONE;

            @SuppressWarnings("deprecation")
            int flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON;

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    overlayExpanded ? cardWidth : WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    overlayType,
                    flags,
                    PixelFormat.TRANSLUCENT
            );
            params.gravity = Gravity.TOP | Gravity.END;
            params.x = dp(14);
            params.y = dp(90);
            overlayParams = params;

            // Draggable touch listener + tap-to-expand on the floating bubble
            final float[] touchDownRaw = new float[2];
            final int[] startParamsXY = new int[2];
            final boolean[] movedSignificantly = new boolean[1];
            View.OnTouchListener dragListener = (v, event) -> {
                if (overlayParams == null || windowManager == null) return false;
                switch (event.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        touchDownRaw[0] = event.getRawX();
                        touchDownRaw[1] = event.getRawY();
                        startParamsXY[0] = overlayParams.x;
                        startParamsXY[1] = overlayParams.y;
                        movedSignificantly[0] = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx = event.getRawX() - touchDownRaw[0];
                        float dy = event.getRawY() - touchDownRaw[1];
                        if (Math.hypot(dx, dy) > dp(8)) {
                            movedSignificantly[0] = true;
                        }
                        // Gravity.END means positive x moves leftward from right edge
                        overlayParams.x = Math.max(0, startParamsXY[0] - Math.round(dx));
                        overlayParams.y = Math.max(0, startParamsXY[1] + Math.round(dy));
                        try {
                            windowManager.updateViewLayout(root, overlayParams);
                        } catch (Exception ignored) {}
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (!movedSignificantly[0] && !overlayExpanded) {
                            overlayExpanded = true;
                            bubble.setVisibility(View.GONE);
                            card.setVisibility(View.VISIBLE);
                            overlayParams.width = cardWidth;
                            overlayParams.x = Math.max(dp(12), (screenWidth - cardWidth) / 2);
                            try {
                                windowManager.updateViewLayout(root, overlayParams);
                            } catch (Exception ignored) {}
                        }
                        return true;
                    default:
                        return false;
                }
            };
            bubble.setOnTouchListener(dragListener);
            headerRow.setOnTouchListener(dragListener);

            updateOverlayCountdownViews();
            windowManager.addView(root, params);
            overlayView = root;
            mainHandler.removeCallbacks(overlayTickerRunnable);
            mainHandler.postDelayed(overlayTickerRunnable, 1000L);
            Log.d(TAG, "Draggable Floating Azan bubble displayed above apps");
        } catch (Exception e) {
            Log.e(TAG, "Failed to display floating overlay", e);
        }
    }

    private TextView createOverlayButton(String label, String bgHex, String textHex, View.OnClickListener listener) {
        TextView btn = new TextView(this);
        btn.setText(label);
        btn.setTextColor(Color.parseColor(textHex));
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        btn.setTypeface(null, Typeface.BOLD);
        btn.setGravity(Gravity.CENTER);
        btn.setPadding(dp(10), dp(9), dp(10), dp(9));

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
        mainHandler.removeCallbacks(overlayTickerRunnable);
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayView);
            } catch (Exception ignored) {}
            overlayView = null;
        }
        overlayParams = null;
        bubbleTickerView = null;
        expandedTickerView = null;
    }

    private void playAudioSafely(String audioTrackId, String section, String title, String body, int volumePercent, boolean shortToneMode) {
        stopAudioAndCleanUp();
        try {
            NativeAudioPlayerManager.INSTANCE.stop();
        } catch (Exception ignored) {}

        String resolvedFileName = resolveAudioFileName(audioTrackId, section);
        if (resolvedFileName == null) {
            Log.w(TAG, "No audio file resolved for track: " + audioTrackId);
            String missingErr = "تعذر العثور على الملف الصوتي المحدد";
            publishAudioState(false, title, missingErr);
            publishTestFailureIfNeeded(missingErr);
            finishWithVisualFallback(title, body, section);
            return;
        }

        String volumeWarning = null;
        if (audioManager != null && audioManager.getStreamVolume(AudioManager.STREAM_ALARM) == 0) {
            volumeWarning = "تنبيه: مستوى صوت المنبه في الهاتف مضبوط على صفر، ارفع صوت المنبه لسماع الأذان";
        }

        if (!requestAudioFocus()) {
            Log.w(TAG, "Audio focus denied; aborting playback to avoid overlapping audio");
            String focusErr = "لم يتم منح التركيز الصوتي من النظام — تم إلغاء التشغيل لتجنب تداخل الأصوات";
            publishAudioState(false, title, focusErr);
            publishTestFailureIfNeeded(focusErr);
            finishWithVisualFallback(title, body, section);
            return;
        }

        try {
            float scalarVol = volumePercent <= 0 ? 0.0f : Math.max(0.05f, Math.min(1.0f, volumePercent / 100.0f));
            currentScalarVolume = scalarVol;
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build()
            );
            mediaPlayer.setVolume(scalarVol, scalarVol);

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
                if (shortToneMode) {
                    mainHandler.postDelayed(shortToneStopRunnable, 12_000L);
                }
                Log.d(TAG, "Audio started playing successfully: " + resolvedFileName);
                publishAudioState(true, title + " (" + resolvedFileName + ")", volumeWarning);
                if (currentIsTestAlarm) {
                    AlarmScheduleTracker.BackgroundTestStatus prevTest = AlarmScheduleTracker.loadBackgroundTestStatus(this);
                    AlarmScheduleTracker.saveBackgroundTestStatus(
                            this,
                            new AlarmScheduleTracker.BackgroundTestStatus(
                                    "playing",
                                    prevTest != null ? prevTest.scheduleMode : AlarmScheduleTracker.ScheduleMode.INEXACT_WHILE_IDLE,
                                    prevTest != null && prevTest.exactPermissionGranted,
                                    prevTest != null ? prevTest.scheduledAtMs : System.currentTimeMillis(),
                                    prevTest != null ? prevTest.triggerAtMs : System.currentTimeMillis(),
                                    prevTest != null ? prevTest.firedAtMs : System.currentTimeMillis(),
                                    resolvedFileName,
                                    "بدأ تشغيل صوت الاختبار (" + resolvedFileName + ") في الخلفية",
                                    volumeWarning != null ? volumeWarning : ""
                            )
                    );
                }
            } else {
                Log.e(TAG, "Audio file not found: " + resolvedFileName);
                String notFoundErr = "لم يتم العثور على الملف الصوتي: " + resolvedFileName;
                publishAudioState(false, title, notFoundErr);
                publishTestFailureIfNeeded(notFoundErr);
                finishWithVisualFallback(title, body, section);
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed playing audio file: " + resolvedFileName, e);
            String playErr = "تعذر تشغيل الصوت: " + e.getMessage();
            publishAudioState(false, title, playErr);
            publishTestFailureIfNeeded(playErr);
            finishWithVisualFallback(title, body, section);
        }
    }

    private void finishWithVisualFallback(String title, String body, String section) {
        stopAudioAndCleanUp();
        removeFloatingOverlay();
        postVisualOnlyNotification(title, body, section);
        releaseWakeLock();
        currentIsTestAlarm = false;
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private void stopServiceCleanly() {
        mainHandler.removeCallbacksAndMessages(null);
        isOverlayOnlyTest = false;
        currentSection = "";
        currentIsTestAlarm = false;
        currentAudioTrackId = "";
        pendingAudioQueue.clear();
        stopAudioAndCleanUp();
        removeFloatingOverlay();
        releaseWakeLock();
        publishAudioState(false, "", null);
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private boolean assetExistsInAudio(String fileName) {
        if (fileName == null || fileName.isEmpty()) return false;
        try {
            InputStream is = getAssets().open("audio/" + fileName);
            is.close();
            return true;
        } catch (Exception ignored) {}
        try {
            InputStream is = getAssets().open(fileName);
            is.close();
            return true;
        } catch (Exception ignored) {}
        return false;
    }

    private String resolveAudioFileName(String audioTrackId, String section) {
        if (audioTrackId != null && !audioTrackId.isEmpty()) {
            String clean = audioTrackId.trim();
            if (clean.equals("azkar_morning") || clean.equals("azkar_morning.mp3")) {
                return "azkar_sabah.mp3";
            }
            if (clean.equals("azkar_evening") || clean.equals("azkar_evening.mp3")) {
                return "azkar_massa.mp3";
            }
            if (clean.equals("ibrahim_madani") || clean.equals("ibrahim_madani.mp3")) {
                return "madinah.mp3";
            }
            if (clean.equals("duha_surah") || clean.equals("duha_surah.mp3")) {
                return assetExistsInAudio("duha_surah.mp3") ? "duha_surah.mp3" : "qiyam_first_third.mp3";
            }
            if (clean.equals("dua_after_azan") || clean.equals("dua_after_azan.mp3")) {
                return assetExistsInAudio("dua_after_azan.mp3") ? "dua_after_azan.mp3" : "salawat_1.mp3";
            }
            if (clean.endsWith(".mp3") || clean.endsWith(".wav")) {
                return clean;
            }
            return clean + ".mp3";
        }

        if ("prayer_azan".equals(section)) {
            return "makkah.mp3";
        } else if ("iqama".equals(section)) {
            return "iqama_1.mp3";
        } else if ("prePrayerAlert".equals(section)) {
            return "pre_prayer_15m.mp3";
        } else if ("morningAzkar".equals(section)) {
            return "azkar_sabah.mp3";
        } else if ("eveningAzkar".equals(section)) {
            return "azkar_massa.mp3";
        } else if ("salawat".equals(section)) {
            return "salawat_1.mp3";
        } else if ("musaharati".equals(section)) {
            SharedPreferences sp = getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
            String mTrack = sp.getString("musaharati_audio", "musaharati_1");
            if (mTrack == null || mTrack.trim().isEmpty()) {
                return "musaharati_1.mp3";
            }
            String cleanM = mTrack.trim();
            return (cleanM.endsWith(".mp3") || cleanM.endsWith(".wav")) ? cleanM : (cleanM + ".mp3");
        } else if ("iftar".equals(section)) {
            return "iftar_cannon.mp3";
        } else if ("duha_prayer".equals(section)) {
            return assetExistsInAudio("duha_surah.mp3") ? "duha_surah.mp3" : "qiyam_first_third.mp3";
        } else if ("dua_after".equals(section)) {
            return assetExistsInAudio("dua_after_azan.mp3") ? "dua_after_azan.mp3" : "salawat_1.mp3";
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
                .setSmallIcon(R.drawable.ic_notification_muslim_plus)
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
                .setSmallIcon(R.drawable.ic_notification_muslim_plus)
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

    private boolean requestAudioFocus() {
        if (audioManager == null) {
            audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        }
        if (audioManager == null) return false;
        focusStateMachine.reset();
        int focusResult;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(
                            new AudioAttributes.Builder()
                                    .setUsage(AudioAttributes.USAGE_ALARM)
                                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                    .build()
                    )
                    .setAcceptsDelayedFocusGain(false)
                    .setOnAudioFocusChangeListener(audioFocusChangeListener)
                    .build();
            focusResult = audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            @SuppressWarnings("deprecation")
            int legacyResult = audioManager.requestAudioFocus(
                    audioFocusChangeListener,
                    AudioManager.STREAM_ALARM,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            );
            focusResult = legacyResult;
        }
        return focusResult == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void abandonAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioFocusRequest = null;
        } else {
            @SuppressWarnings("deprecation")
            int ignored = audioManager.abandonAudioFocus(audioFocusChangeListener);
        }
        focusStateMachine.reset();
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

    private void postDuaAfterPrayerNotification(String prayerName) {
        String label = (prayerName != null && !prayerName.isEmpty()) ? " (" + prayerName + ")" : "";
        postVisualOnlyNotification(
                "دعاء بعد الأذان والصلاة" + label,
                "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ.",
                "duaAfterPrayer"
        );
    }

    @Override
    public void onCompletion(MediaPlayer mp) {
        Log.d(TAG, "Audio playback completed successfully");
        if (currentIsTestAlarm) {
            AlarmScheduleTracker.BackgroundTestStatus prevTest = AlarmScheduleTracker.loadBackgroundTestStatus(this);
            if (prevTest != null && !"failed".equals(prevTest.state)) {
                AlarmScheduleTracker.saveBackgroundTestStatus(
                        this,
                        new AlarmScheduleTracker.BackgroundTestStatus(
                                "completed",
                                prevTest.scheduleMode,
                                prevTest.exactPermissionGranted,
                                prevTest.scheduledAtMs,
                                prevTest.triggerAtMs,
                                prevTest.firedAtMs,
                                prevTest.audioTrackId,
                                "اكتمل تشغيل تنبيه الاختبار بنجاح",
                                prevTest.failureReason
                        )
                );
            }
            currentIsTestAlarm = false;
        }
        if (currentDuaAfterPrayerEnabled) {
            postDuaAfterPrayerNotification(currentPrayerName);
            currentDuaAfterPrayerEnabled = false;
        }
        Intent nextQueued = pendingAudioQueue.pollNext();
        if (nextQueued != null) {
            isPlayingNow = false;
            currentSection = "";
            stopAudioAndCleanUp();
            removeFloatingOverlay();
            mainHandler.post(() -> onStartCommand(nextQueued, 0, 0));
            return;
        }
        stopServiceCleanly();
    }

    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        Log.e(TAG, "MediaPlayer error: what=" + what + ", extra=" + extra);
        String errText = "خطأ في مشغل الصوت (what=" + what + ", extra=" + extra + ")";
        publishAudioState(false, "", errText);
        publishTestFailureIfNeeded(errText);
        stopServiceCleanly();
        return true;
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacksAndMessages(null);
        pendingAudioQueue.clear();
        stopAudioAndCleanUp();
        removeFloatingOverlaySync();
        releaseWakeLock();
        isPlayingNow = false;
        currentIsTestAlarm = false;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
