package com.muslim.azan;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Triggered by Android AlarmManager even when the app is completely closed or screen is locked.
 * Uses goAsync() to safely keep execution alive until AzkarAudioService starts and rolling
 * 7-day / 48-hour schedules are maintained under Android 15 & 16 background limits.
 */
public class AzkarAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AzkarAlarmReceiver";
    private static final String FALLBACK_CHANNEL_ID = "islamic_azan_fallback_v2";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        if (RingerRestoreCoordinator.ACTION_RESTORE_RINGER.equals(intent.getAction())) {
            RingerRestoreCoordinator.handleRestoreTrigger(context, System.currentTimeMillis());
            return;
        }

        String section = intent.getStringExtra("section");
        if ("custom_reminder".equals(section)) {
            postPoliteCustomReminderNotification(
                    context,
                    intent.getStringExtra("reminderId"),
                    intent.getStringExtra("title"),
                    intent.getStringExtra("body")
            );
            return;
        }
        if ("did_you_pray".equals(section)) {
            postDidYouPrayReminderNotification(context, intent.getStringExtra("prayerKey"));
            return;
        }

        String prayerKey = intent.getStringExtra("prayerKey");
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String audioTrackId = intent.getStringExtra("audioTrackId");
        String prayerName = intent.getStringExtra("prayerName");
        String cityName = intent.getStringExtra("cityName");
        int iqamaDurationMinutes = intent.getIntExtra("iqamaDurationMinutes", 15);
        int volumePercent = intent.getIntExtra("volumePercent", 100);
        String alertMode = intent.getStringExtra("alertMode");
        boolean silentDuringPrayer = intent.getBooleanExtra("silentDuringPrayer", false);
        boolean duaAfterPrayerEnabled = intent.getBooleanExtra("duaAfterPrayerEnabled", false);
        boolean autoPlay = intent.getBooleanExtra("autoPlay", true);
        boolean isTestAlarm = intent.getBooleanExtra("isTestAlarm", false);

        long nowMs = System.currentTimeMillis();
        Log.d(TAG, "Alarm triggered for section: " + section + ", prayer: " + prayerName + ", isTest: " + isTestAlarm);

        if (isTestAlarm) {
            AlarmScheduleTracker.BackgroundTestStatus prevTest = AlarmScheduleTracker.loadBackgroundTestStatus(context);
            AlarmScheduleTracker.ScheduleMode prevMode = prevTest != null
                    ? prevTest.scheduleMode
                    : AlarmScheduleTracker.ScheduleMode.INEXACT_WHILE_IDLE;
            boolean exactAllowed = prevTest != null && prevTest.exactPermissionGranted;
            long schedAt = prevTest != null ? prevTest.scheduledAtMs : nowMs;
            long trigAt = prevTest != null ? prevTest.triggerAtMs : nowMs;
            AlarmScheduleTracker.saveBackgroundTestStatus(
                    context,
                    new AlarmScheduleTracker.BackgroundTestStatus(
                            "receiver_fired",
                            prevMode,
                            exactAllowed,
                            schedAt,
                            trigAt,
                            nowMs,
                            audioTrackId != null ? audioTrackId : "",
                            "استلم النظام إشارة المنبه في الخلفية",
                            ""
                    )
            );
        }

        SharedPreferences prefs = context.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);

        if (!isTestAlarm
                && !AzkarAudioService.canPreemptCurrentPlayback(section)
                && !AzkarAudioService.shouldQueueWhenBlocked(section)) {
            Log.d(TAG, "Skipping duplicate/lower trigger (" + section + ") while active: " + AzkarAudioService.currentSection);
            return;
        }

        // Cooldown deduplication (skip for explicit user background tests so repeated tests always fire)
        if (!isTestAlarm) {
            String dedupKey;
            long cooldownMs;
            if ("prayer_azan".equals(section) && prayerName != null) {
                dedupKey = "last_trigger_azan_" + prayerName;
                cooldownMs = 180_000L; // 3 minutes
            } else if ("morningAzkar".equals(section) || "eveningAzkar".equals(section) || "musaharati".equals(section)) {
                dedupKey = "last_trigger_" + section;
                cooldownMs = 180_000L; // 3 minutes
            } else if ("salawat".equals(section)) {
                dedupKey = "last_salawat_trigger_ms";
                cooldownMs = 45_000L; // 45 seconds
            } else {
                dedupKey = "last_trigger_" + (section != null ? section : "general") + "_" + (prayerName != null ? prayerName : "");
                cooldownMs = 60_000L;
            }

            long lastFiredMs = prefs.getLong(dedupKey, 0L);
            if (nowMs - lastFiredMs < cooldownMs) {
                Log.d(TAG, "Duplicate rapid trigger skipped for " + dedupKey);
                return;
            }
            prefs.edit().putLong(dedupKey, nowMs).apply();
        }

        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        final PowerManager.WakeLock wakeLock;
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AlMoazen::AlarmReceiverWakeLock");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(20_000L);
        } else {
            wakeLock = null;
        }

        Intent serviceIntent = new Intent(context, AzkarAudioService.class);
        serviceIntent.putExtra("section", section);
        serviceIntent.putExtra("prayerKey", prayerKey);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("body", body);
        serviceIntent.putExtra("audioTrackId", audioTrackId);
        serviceIntent.putExtra("prayerName", prayerName);
        serviceIntent.putExtra("cityName", cityName);
        serviceIntent.putExtra("iqamaDurationMinutes", iqamaDurationMinutes);
        serviceIntent.putExtra("volumePercent", volumePercent);
        serviceIntent.putExtra("alertMode", alertMode);
        serviceIntent.putExtra("silentDuringPrayer", silentDuringPrayer);
        serviceIntent.putExtra("duaAfterPrayerEnabled", duaAfterPrayerEnabled);
        serviceIntent.putExtra("autoPlay", autoPlay);
        serviceIntent.putExtra("isTestAlarm", isTestAlarm);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start foreground service from receiver, posting fallback alarm notification", e);
            if (isTestAlarm) {
                AlarmScheduleTracker.BackgroundTestStatus prevTest = AlarmScheduleTracker.loadBackgroundTestStatus(context);
                AlarmScheduleTracker.saveBackgroundTestStatus(
                        context,
                        new AlarmScheduleTracker.BackgroundTestStatus(
                                "failed",
                                prevTest != null ? prevTest.scheduleMode : AlarmScheduleTracker.ScheduleMode.INEXACT_WHILE_IDLE,
                                prevTest != null && prevTest.exactPermissionGranted,
                                prevTest != null ? prevTest.scheduledAtMs : nowMs,
                                prevTest != null ? prevTest.triggerAtMs : nowMs,
                                nowMs,
                                audioTrackId != null ? audioTrackId : "",
                                "فشل تشغيل خدمة الصوت في الخلفية",
                                "تعذر بدء ForegroundService: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName())
                        )
                );
            }
            postFallbackNotification(
                    context,
                    section,
                    prayerName,
                    cityName,
                    audioTrackId,
                    volumePercent,
                    title,
                    body
            );
        }

        // Rolling schedule maintenance protected by goAsync() so Android 12-16 does not kill the thread prematurely
        final PendingResult pendingResult = goAsync();
        final Context appContext = context.getApplicationContext();
        new Thread(() -> {
            try {
                long lastRecalc = prefs.getLong("last_recalculated_epoch_ms", 0L);
                if (nowMs - lastRecalc > 6 * 3600 * 1000L) {
                    Log.d(TAG, "Rolling schedule recalculation triggered by alarm receiver");
                    BootReceiver.recalculateAndScheduleAll(appContext);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in rolling schedule maintenance", e);
            } finally {
                if (wakeLock != null && wakeLock.isHeld()) {
                    try {
                        wakeLock.release();
                    } catch (Exception ignored) {}
                }
                if (pendingResult != null) {
                    try {
                        pendingResult.finish();
                    } catch (Exception ignored) {}
                }
            }
        }).start();
    }

    private void postFallbackNotification(
            Context context,
            String section,
            String prayerName,
            String cityName,
            String audioTrackId,
            int volumePercent,
            String title,
            String body
    ) {
        try {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        FALLBACK_CHANNEL_ID,
                        "تنبيهات الأذان الاحتياطية",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.enableVibration(true);
                channel.setSound(
                        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                        new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                );
                manager.createNotificationChannel(channel);
            }

            boolean isPrayerOrIqama = "prayer_azan".equals(section)
                    || "iqama".equals(section)
                    || "prePrayerAlert".equals(section)
                    || "iftar".equals(section);

            String resolvedTitle = title != null && !title.isEmpty() ? title : "مسلم بلس";
            String resolvedBody = body != null && !body.isEmpty() ? body : "حان موعد الصلاة والأذكار";

            Intent targetIntent;
            if (isPrayerOrIqama) {
                targetIntent = new Intent(context, AzanAlertActivity.class);
                targetIntent.putExtra("title", resolvedTitle);
                targetIntent.putExtra("body", resolvedBody);
                targetIntent.putExtra("cityName", cityName != null ? cityName : "");
                targetIntent.putExtra("section", section);
                targetIntent.putExtra("prayerName", prayerName != null ? prayerName : "");
                targetIntent.putExtra("audioTrackId", audioTrackId != null ? audioTrackId : "makkah");
                targetIntent.putExtra("volumePercent", volumePercent);
                targetIntent.putExtra("autoStartAzanAudio", true);
                targetIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
            } else {
                targetIntent = new Intent(context, MainActivity.class);
                targetIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            }

            PendingIntent pendingOpenIntent = PendingIntent.getActivity(
                    context,
                    isPrayerOrIqama ? 4011 : 0,
                    targetIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            int notifId = 3000 + Math.abs((section != null ? section : "fallback").hashCode() % 100);
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, FALLBACK_CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_notification_muslim_plus)
                    .setContentTitle(resolvedTitle)
                    .setContentText(resolvedBody)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(resolvedBody))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
                    .setAutoCancel(true)
                    .setContentIntent(pendingOpenIntent);

            if (isPrayerOrIqama) {
                boolean canFullScreen = true;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    canFullScreen = manager.canUseFullScreenIntent();
                }
                if (canFullScreen) {
                    builder.setFullScreenIntent(pendingOpenIntent, true);
                }
            }

            manager.notify(notifId, builder.build());
        } catch (Exception ex) {
            Log.e(TAG, "Failed posting fallback notification", ex);
        }
    }

    private void postPoliteCustomReminderNotification(
            Context context,
            String reminderId,
            String title,
            String body
    ) {
        if (context == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                return;
            }
        }
        try {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            String channelId = "muslim_plus_gentle_reminders";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (manager.getNotificationChannel(channelId) == null) {
                    NotificationChannel channel = new NotificationChannel(
                            channelId,
                            "تذكيرات العبادات والمناسك",
                            NotificationManager.IMPORTANCE_DEFAULT
                    );
                    channel.setDescription("تذكيرات لطيفة اختيارية لمتتبع العبادات وقائمة مناسك الحج");
                    manager.createNotificationChannel(channel);
                }
            }

            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(
                    context,
                    7500 + Math.abs((reminderId != null ? reminderId : "custom").hashCode() % 400),
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            String resolvedTitle = (title != null && !title.isEmpty()) ? title : "تذكير مسلم بلس";
            String resolvedBody = (body != null && !body.isEmpty()) ? body : "حان موعد التذكير الذي حددته";

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                    .setSmallIcon(R.drawable.ic_notification_muslim_plus)
                    .setContentTitle(resolvedTitle)
                    .setContentText(resolvedBody)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(resolvedBody))
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setAutoCancel(true)
                    .setContentIntent(pi);

            int notifId = 7600 + Math.abs((reminderId != null ? reminderId : "custom").hashCode() % 400);
            manager.notify(notifId, builder.build());
        } catch (Exception ex) {
            Log.e(TAG, "Failed posting custom reminder notification", ex);
        }
    }

    private void postDidYouPrayReminderNotification(Context context, String prayerKey) {
        if (context == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                return;
            }
        }
        String key = (prayerKey != null && !prayerKey.isEmpty()) ? prayerKey : "fajr";
        SharedPreferences prefs = context.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);

        // Respect live per-prayer toggle
        String cfgRaw = prefs.getString("prayer_config_" + key, null);
        if (cfgRaw != null && !cfgRaw.isEmpty()) {
            try {
                JSONObject cfg = new JSONObject(cfgRaw);
                if (!cfg.optBoolean("didYouPrayEnabled", true)) {
                    return;
                }
            } catch (Exception ignored) {}
        }

        // Daily once-per-day per-prayer deduplication
        String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        String dedupPrefKey = "did_pray_reminded_" + dateStr + "_" + key;
        if (prefs.getBoolean(dedupPrefKey, false)) {
            return;
        }
        prefs.edit().putBoolean(dedupPrefKey, true).apply();

        String lang = prefs.getString("app_language", "ar");
        boolean isEnglish = "en".equals(lang);

        String title;
        String body;
        if (isEnglish) {
            title = "Have you prayed?";
            String enName;
            switch (key) {
                case "fajr": enName = "Fajr"; break;
                case "sunrise": enName = "Sunrise"; break;
                case "duha": enName = "Duha"; break;
                case "dhuhr": enName = "Dhuhr"; break;
                case "asr": enName = "Asr"; break;
                case "maghrib": enName = "Maghrib"; break;
                case "isha": enName = "Isha"; break;
                default: enName = "this prayer"; break;
            }
            body = "Have you prayed " + enName + "?";
        } else {
            title = "هل صليت؟";
            String arName;
            switch (key) {
                case "fajr": arName = "الفجر"; break;
                case "sunrise": arName = "الشروق"; break;
                case "duha": arName = "الضحى"; break;
                case "dhuhr": arName = "الظهر"; break;
                case "asr": arName = "العصر"; break;
                case "maghrib": arName = "المغرب"; break;
                case "isha": arName = "العشاء"; break;
                default: arName = "الصلاة"; break;
            }
            body = "هل صليت " + arName + "؟";
        }

        try {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            String channelId = "muslim_plus_prayer_checkin";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (manager.getNotificationChannel(channelId) == null) {
                    NotificationChannel channel = new NotificationChannel(
                            channelId,
                            isEnglish ? "Prayer Check-in Reminders" : "تذكير «هل صليت؟»",
                            NotificationManager.IMPORTANCE_DEFAULT
                    );
                    channel.setDescription(
                            isEnglish
                                    ? "Gentle post-prayer check-in reminders"
                                    : "تذكير لطيف للتحقق من أداء الصلاة في وقتها"
                    );
                    manager.createNotificationChannel(channel);
                }
            }

            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.putExtra("open_route", "prayer_times");
            openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(
                    context,
                    8100 + Math.abs(key.hashCode() % 50),
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                    .setSmallIcon(R.drawable.ic_notification_muslim_plus)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setAutoCancel(true)
                    .setContentIntent(pi);

            int notifId = 8200 + Math.abs(key.hashCode() % 50);
            manager.notify(notifId, builder.build());
        } catch (Exception ex) {
            Log.e(TAG, "Failed posting did-you-pray notification", ex);
        }
    }
}
