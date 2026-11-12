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

import java.util.HashSet;
import java.util.Set;

/**
 * Handles scheduling of Exact Alarms for Prayer Azan & Reminders with full Android 8-14+ compatibility.
 * Prevents old alarm accumulation by canceling previous app alarms not present in the new schedule,
 * safely saves active schedule in SharedPreferences for reboot recovery,
 * and maintains full compatibility with AzkarAlarmReceiver, BootReceiver, and MainActivity.
 */
public class AlarmScheduler {
    private static final String TAG = "AlarmScheduler";
    private static final String ACTION =
            "com.muslim.azan.ACTION_TRIGGER_REMINDER";
    private static final String PREFS = "azan_reminders_prefs";
    private static final String SCHEDULE_KEY = "active_schedule_json";

    public static synchronized void rescheduleFromJson(
            Context context, String jsonArrayString) {

        AlarmManager alarmManager =
                (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        if (alarmManager == null || jsonArrayString == null) return;

        try {
            // Validate the new schedule before changing existing alarms.
            JSONArray newArray = new JSONArray(jsonArrayString);
            SharedPreferences prefs =
                    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

            String oldJson = prefs.getString(SCHEDULE_KEY, null);
            long now = System.currentTimeMillis();

            boolean canExact = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                canExact = alarmManager.canScheduleExactAlarms();
            }
            prefs.edit().putBoolean("can_schedule_exact_alarms", canExact).apply();

            Set<String> newAlarmIds = new HashSet<>();

            // Schedule all future alarms in the new list first.
            for (int i = 0; i < newArray.length(); i++) {
                JSONObject obj = newArray.getJSONObject(i);

                String section = obj.optString("section", "");
                long triggerEpochMs = obj.optLong("triggerEpochMs", 0);

                if (section.isEmpty() || triggerEpochMs <= now) {
                    continue;
                }

                int requestCode =
                        (section + "_" + triggerEpochMs).hashCode();

                newAlarmIds.add(section + "_" + triggerEpochMs);

                Intent intent = new Intent(context, AzkarAlarmReceiver.class);
                intent.setAction(ACTION);

                intent.putExtra("section", section);
                intent.putExtra("title", obj.optString("title", ""));
                intent.putExtra("body", obj.optString("body", ""));
                intent.putExtra("audioTrackId",
                        obj.optString("audioTrackId", ""));
                intent.putExtra("prayerName",
                        obj.optString("prayerName", "الصلاة"));
                intent.putExtra("cityName",
                        obj.optString("cityName", "مدينتك"));
                intent.putExtra("iqamaDurationMinutes",
                        obj.optInt("iqamaDurationMinutes", 15));
                intent.putExtra("autoPlay",
                        obj.optBoolean("autoPlay", true));
                intent.putExtra("floatingWindowEnabled", false);
                intent.putExtra("lockScreenEnabled", false);
                intent.putExtra("wakeScreenEnabled", false);
                intent.putExtra("repeatIntervalMs",
                        obj.optLong("repeatIntervalMs", 0));

                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context,
                        requestCode,
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT
                                | PendingIntent.FLAG_IMMUTABLE
                );

                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        if (canExact) {
                            try {
                                alarmManager.setExactAndAllowWhileIdle(
                                        AlarmManager.RTC_WAKEUP,
                                        triggerEpochMs,
                                        pendingIntent
                                );
                            } catch (SecurityException se) {
                                Log.w(TAG, "Exact alarm permission revoked, falling back to inexact while idle", se);
                                alarmManager.setAndAllowWhileIdle(
                                        AlarmManager.RTC_WAKEUP,
                                        triggerEpochMs,
                                        pendingIntent
                                );
                            }
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
                    Log.d(TAG, "Scheduled: " + section + " at " + triggerEpochMs);
                } catch (Exception ex) {
                    Log.e(TAG, "Failed scheduling alarm for " + section + " at " + triggerEpochMs, ex);
                }
            }

            // Cancel only alarms from the previous app schedule
            // that are not present in the new schedule.
            if (oldJson != null) {
                try {
                    JSONArray oldArray = new JSONArray(oldJson);

                    for (int i = 0; i < oldArray.length(); i++) {
                        JSONObject oldObj = oldArray.getJSONObject(i);

                        String oldSection =
                                oldObj.optString("section", "");
                        long oldTrigger =
                                oldObj.optLong("triggerEpochMs", 0);

                        if (oldSection.isEmpty() || oldTrigger <= 0) {
                            continue;
                        }

                        String oldId = oldSection + "_" + oldTrigger;

                        if (!newAlarmIds.contains(oldId)) {
                            cancelAlarm(
                                    context,
                                    alarmManager,
                                    oldSection,
                                    oldTrigger
                            );
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Could not clean old schedule", e);
                }
            }

            // Save only after processing the new schedule.
            prefs.edit()
                    .putString(SCHEDULE_KEY, jsonArrayString)
                    .apply();

            Log.d(TAG, "Schedule updated successfully. Alarms: "
                    + newAlarmIds.size());

        } catch (Exception e) {
            Log.e(TAG, "Failed to update alarm schedule", e);
        }
    }

    private static void cancelAlarm(
            Context context,
            AlarmManager alarmManager,
            String section,
            long triggerEpochMs) {

        int requestCode =
                (section + "_" + triggerEpochMs).hashCode();

        Intent intent = new Intent(context, AzkarAlarmReceiver.class);
        intent.setAction(ACTION);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE
                        | PendingIntent.FLAG_IMMUTABLE
        );

        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();

            Log.d(TAG, "Cancelled old alarm: "
                    + section + " at " + triggerEpochMs);
        }
    }
}
