package com.muslim.azan;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Handles scheduling of Exact Alarms for Prayer Azan & Reminders with full Android 8-14+ compatibility.
 * Automatically falls back to setAndAllowWhileIdle if SCHEDULE_EXACT_ALARM is not yet granted.
 */
public class AlarmScheduler {
    private static final String TAG = "AlarmScheduler";

    public static void rescheduleFromJson(Context context, String jsonArrayString) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        try {
            // Save schedule in SharedPreferences for reboot recovery
            SharedPreferences prefs = context.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
            prefs.edit().putString("active_schedule_json", jsonArrayString).apply();

            JSONArray array = new JSONArray(jsonArrayString);
            long now = System.currentTimeMillis();

            boolean canExact = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                canExact = alarmManager.canScheduleExactAlarms();
            }

            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                String section = obj.optString("section");
                String title = obj.optString("title");
                String body = obj.optString("body");
                String audioTrackId = obj.optString("audioTrackId");
                String prayerName = obj.optString("prayerName", "الصلاة");
                String cityName = obj.optString("cityName", "مدينتك");
                int iqamaDurationMinutes = obj.optInt("iqamaDurationMinutes", 15);
                boolean autoPlay = obj.optBoolean("autoPlay", true);
                boolean floatingWindowEnabled = obj.optBoolean("floatingWindowEnabled", true);
                boolean lockScreenEnabled = obj.optBoolean("lockScreenEnabled", true);
                boolean wakeScreenEnabled = obj.optBoolean("wakeScreenEnabled", true);
                long repeatIntervalMs = obj.optLong("repeatIntervalMs", 0);
                long triggerEpochMs = obj.optLong("triggerEpochMs");

                if (triggerEpochMs <= now) {
                    continue; // Skip past triggers
                }

                Intent intent = new Intent(context, AzkarAlarmReceiver.class);
                intent.setAction("com.muslim.azan.ACTION_TRIGGER_REMINDER");
                intent.putExtra("section", section);
                intent.putExtra("title", title);
                intent.putExtra("body", body);
                intent.putExtra("audioTrackId", audioTrackId);
                intent.putExtra("prayerName", prayerName);
                intent.putExtra("cityName", cityName);
                intent.putExtra("iqamaDurationMinutes", iqamaDurationMinutes);
                intent.putExtra("autoPlay", autoPlay);
                intent.putExtra("floatingWindowEnabled", floatingWindowEnabled);
                intent.putExtra("lockScreenEnabled", lockScreenEnabled);
                intent.putExtra("wakeScreenEnabled", wakeScreenEnabled);
                intent.putExtra("repeatIntervalMs", repeatIntervalMs);

                // Robust collision-free request code for distinct pending intents
                int requestCode = (section + "_" + triggerEpochMs).hashCode();
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context,
                        requestCode,
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (canExact) {
                        alarmManager.setExactAndAllowWhileIdle(
                                AlarmManager.RTC_WAKEUP,
                                triggerEpochMs,
                                pendingIntent
                        );
                    } else {
                        alarmManager.setAndAllowWhileIdle(
                                AlarmManager.RTC_WAKEUP,
                                triggerEpochMs,
                                pendingIntent
                        );
                    }
                } else {
                    alarmManager.setExact(
                            AlarmManager.RTC_WAKEUP,
                            triggerEpochMs,
                            pendingIntent
                    );
                }

                Log.d(TAG, "Scheduled alarm for: " + section + " (" + prayerName + ") at " + triggerEpochMs);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse and schedule alarms", e);
        }
    }
}
