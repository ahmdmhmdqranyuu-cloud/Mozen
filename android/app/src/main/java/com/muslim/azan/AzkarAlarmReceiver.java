package com.muslim.azan;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

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

        String section = intent.getStringExtra("section");
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String audioTrackId = intent.getStringExtra("audioTrackId");
        String prayerName = intent.getStringExtra("prayerName");
        String cityName = intent.getStringExtra("cityName");
        int iqamaDurationMinutes = intent.getIntExtra("iqamaDurationMinutes", 15);
        boolean autoPlay = intent.getBooleanExtra("autoPlay", true);
        boolean isTestAlarm = intent.getBooleanExtra("isTestAlarm", false);

        long nowMs = System.currentTimeMillis();
        Log.d(TAG, "Alarm triggered for section: " + section + ", prayer: " + prayerName + ", isTest: " + isTestAlarm);

        SharedPreferences prefs = context.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);

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
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("body", body);
        serviceIntent.putExtra("audioTrackId", audioTrackId);
        serviceIntent.putExtra("prayerName", prayerName);
        serviceIntent.putExtra("cityName", cityName);
        serviceIntent.putExtra("iqamaDurationMinutes", iqamaDurationMinutes);
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
            postFallbackNotification(context, section, title, body);
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

    private void postFallbackNotification(Context context, String section, String title, String body) {
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

            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingOpenIntent = PendingIntent.getActivity(
                    context,
                    0,
                    openAppIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            int notifId = 3000 + Math.abs((section != null ? section : "fallback").hashCode() % 100);
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, FALLBACK_CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setContentTitle(title != null && !title.isEmpty() ? title : "تطبيق المؤذن")
                    .setContentText(body != null && !body.isEmpty() ? body : "حان موعد الصلاة والأذكار")
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setAutoCancel(true)
                    .setContentIntent(pendingOpenIntent);

            manager.notify(notifId, builder.build());
        } catch (Exception ex) {
            Log.e(TAG, "Failed posting fallback notification", ex);
        }
    }
}
