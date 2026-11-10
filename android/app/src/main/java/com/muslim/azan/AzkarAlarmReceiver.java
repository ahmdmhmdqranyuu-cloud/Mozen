package com.muslim.azan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
