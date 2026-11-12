package com.muslim.azan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

/**
 * Triggered by Android AlarmManager even when the app is completely closed or screen is locked.
 * Starts AzkarAudioService to play Azan/reminder audio, wake the screen, show Lock-Screen Full Screen Intent,
 * and display the Floating Azan Window over other apps.
 */
public class AzkarAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AzkarAlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String section = intent.getStringExtra("section");
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String audioTrackId = intent.getStringExtra("audioTrackId");
        String prayerName = intent.getStringExtra("prayerName");
        String cityName = intent.getStringExtra("cityName");
        int iqamaDurationMinutes = intent.getIntExtra("iqamaDurationMinutes", 15);
        boolean autoPlay = intent.getBooleanExtra("autoPlay", true);
        boolean floatingWindowEnabled = intent.getBooleanExtra("floatingWindowEnabled", true);
        boolean lockScreenEnabled = intent.getBooleanExtra("lockScreenEnabled", true);
        boolean wakeScreenEnabled = intent.getBooleanExtra("wakeScreenEnabled", true);

        long repeatIntervalMs = intent.getLongExtra("repeatIntervalMs", 0);

        Log.d(TAG, "Alarm triggered for section: " + section + ", prayer: " + prayerName + ", repeatIntervalMs: " + repeatIntervalMs);

        // Deduplication: prevent duplicate firing of Morning/Evening Azkar on the same calendar day
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US);
        String today = sdf.format(new java.util.Date());
        android.content.SharedPreferences prefs = context.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);

        if ("morningAzkar".equals(section) || "eveningAzkar".equals(section)) {
            String lastFiredKey = "last_fired_" + section;
            String lastDate = prefs.getString(lastFiredKey, null);
            if (today.equals(lastDate)) {
                Log.d(TAG, section + " has already fired today (" + today + "). Skipping duplicate trigger.");
                return;
            }
            prefs.edit().putString(lastFiredKey, today).apply();
        }

        // Deduplication: prevent duplicate firing of Prayer Azan on the same calendar day
        if ("prayer_azan".equals(section) && prayerName != null) {
            String lastFiredAzanKey = "last_fired_azan_" + prayerName + "_" + today;
            if (prefs.getBoolean(lastFiredAzanKey, false)) {
                Log.d(TAG, prayerName + " azan has already fired today (" + today + "). Skipping duplicate trigger.");
                return;
            }
            prefs.edit().putBoolean(lastFiredAzanKey, true).apply();
        }

        // Deduplication: ensure Salawat does not fire in bursts (minimum 45s cooldown)
        if ("salawat".equals(section)) {
            long lastSalawatMs = prefs.getLong("last_salawat_trigger_ms", 0);
            long nowMs = System.currentTimeMillis();
            if (nowMs - lastSalawatMs < 45000L) {
                Log.d(TAG, "Salawat triggered too rapidly. Skipping duplicate alert.");
                return;
            }
            prefs.edit().putLong("last_salawat_trigger_ms", nowMs).apply();
        }

        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AlMoazen::AlarmReceiverWakeLock");
            wakeLock.acquire(15000L); // 15s to hand off to AzkarAudioService
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
        serviceIntent.putExtra("floatingWindowEnabled", false);
        serviceIntent.putExtra("lockScreenEnabled", false);
        serviceIntent.putExtra("wakeScreenEnabled", false);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start foreground service from receiver, posting fallback notification", e);
            postFallbackNotification(context, title, body);
        } finally {
            if (wakeLock != null && wakeLock.isHeld()) {
                try {
                    wakeLock.release();
                } catch (Exception ignored) {}
            }
        }

        // Rolling schedule maintenance: Ensure 7-day schedule never runs dry
        final Context appContext = context.getApplicationContext();
        new Thread(() -> {
            try {
                long lastRecalc = prefs.getLong("last_recalculated_epoch_ms", 0);
                long now = System.currentTimeMillis();
                if (now - lastRecalc > 24 * 3600 * 1000L) {
                    Log.d(TAG, "Rolling 7-day schedule recalculation triggered by alarm receiver");
                    BootReceiver.recalculateAndScheduleAll(appContext);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in rolling schedule maintenance", e);
            }
        }).start();
    }

    private void postFallbackNotification(Context context, String title, String body) {
        try {
            android.app.NotificationManager manager = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            String channelId = "islamic_azan_playback_channel";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                android.app.NotificationChannel channel = new android.app.NotificationChannel(
                        channelId,
                        "تنبيهات الأذان والأذكار",
                        android.app.NotificationManager.IMPORTANCE_HIGH
                );
                channel.enableVibration(true);
                manager.createNotificationChannel(channel);
            }

            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            android.app.PendingIntent pendingOpenIntent = android.app.PendingIntent.getActivity(
                    context,
                    0,
                    openAppIntent,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? android.app.PendingIntent.FLAG_IMMUTABLE : 0)
            );

            androidx.core.app.NotificationCompat.Builder builder = new androidx.core.app.NotificationCompat.Builder(context, channelId)
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setContentTitle(title != null ? title : "تطبيق المؤذن")
                    .setContentText(body != null ? body : "حان موعد الصلاة والأذكار")
                    .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                    .setCategory(androidx.core.app.NotificationCompat.CATEGORY_ALARM)
                    .setAutoCancel(true)
                    .setContentIntent(pendingOpenIntent);

            manager.notify(1002, builder.build());
        } catch (Exception ex) {
            Log.e(TAG, "Failed posting fallback notification", ex);
        }
    }
}
