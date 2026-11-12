package com.muslim.azan;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

/**
 * Handles scheduling of Exact Alarms for Prayer Azan & Reminders with full Android 8-16 compatibility.
 * - Uses AlarmManager.setAlarmClock() for Prayer Azan (when exact alarm is allowed) so Android 12-16
 *   wakes the device accurately in Deep Doze and grants full Foreground Service exemption.
 * - Uses setExactAndAllowWhileIdle() for pre-prayer alerts, Azkar, Salawat, and Musaharati,
 *   with graceful fallback to setAndAllowWhileIdle() if exact alarm permission is denied.
 * - Enforces a safe cap below Android's 500-alarm per-UID limit.
 */
public class AlarmScheduler {
    private static final String TAG = "AlarmScheduler";
    private static final String ACTION = "com.muslim.azan.ACTION_TRIGGER_REMINDER";
    private static final String PREFS = "azan_reminders_prefs";
    private static final String SCHEDULE_KEY = "active_schedule_json";
    private static final int MAX_CONCURRENT_ALARMS = 250;

    public static synchronized void rescheduleFromJson(Context context, String jsonArrayString) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null || jsonArrayString == null) return;

        try {
            JSONArray newArray = new JSONArray(jsonArrayString);
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

            String oldJson = prefs.getString(SCHEDULE_KEY, null);
            long now = System.currentTimeMillis();

            boolean canExact = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                canExact = alarmManager.canScheduleExactAlarms();
            }
            prefs.edit().putBoolean("can_schedule_exact_alarms", canExact).apply();

            Set<String> newAlarmIds = new HashSet<>();
            JSONArray persistedArray = new JSONArray();
            int scheduledCount = 0;

            Intent showAppIntent = new Intent(context, MainActivity.class);
            showAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent showPendingIntent = PendingIntent.getActivity(
                    context,
                    9001,
                    showAppIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            for (int i = 0; i < newArray.length() && scheduledCount < MAX_CONCURRENT_ALARMS; i++) {
                JSONObject obj = newArray.getJSONObject(i);

                String section = obj.optString("section", "");
                long triggerEpochMs = obj.optLong("triggerEpochMs", 0L);

                if (section.isEmpty() || triggerEpochMs <= now) {
                    continue;
                }

                String alarmId = section + "_" + triggerEpochMs;
                if (newAlarmIds.contains(alarmId)) {
                    continue;
                }
                newAlarmIds.add(alarmId);
                persistedArray.put(obj);

                int requestCode = alarmId.hashCode();

                Intent intent = new Intent(context, AzkarAlarmReceiver.class);
                intent.setAction(ACTION);
                intent.setData(Uri.parse("almoazen://alarm/" + section + "/" + triggerEpochMs));

                intent.putExtra("section", section);
                intent.putExtra("title", obj.optString("title", ""));
                intent.putExtra("body", obj.optString("body", ""));
                intent.putExtra("audioTrackId", obj.optString("audioTrackId", ""));
                intent.putExtra("prayerName", obj.optString("prayerName", "الصلاة"));
                intent.putExtra("cityName", obj.optString("cityName", "مدينتك"));
                intent.putExtra("iqamaDurationMinutes", obj.optInt("iqamaDurationMinutes", 15));
                intent.putExtra("autoPlay", obj.optBoolean("autoPlay", true));

                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context,
                        requestCode,
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                try {
                    if ("prayer_azan".equals(section) && canExact) {
                        try {
                            AlarmManager.AlarmClockInfo clockInfo =
                                    new AlarmManager.AlarmClockInfo(triggerEpochMs, showPendingIntent);
                            alarmManager.setAlarmClock(clockInfo, pendingIntent);
                        } catch (SecurityException se) {
                            Log.w(TAG, "setAlarmClock denied, falling back to setAndAllowWhileIdle", se);
                            scheduleInexactWhileIdle(alarmManager, triggerEpochMs, pendingIntent);
                        }
                    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        if (canExact) {
                            try {
                                alarmManager.setExactAndAllowWhileIdle(
                                        AlarmManager.RTC_WAKEUP,
                                        triggerEpochMs,
                                        pendingIntent
                                );
                            } catch (SecurityException se) {
                                Log.w(TAG, "Exact alarm permission revoked, falling back to inexact while idle", se);
                                scheduleInexactWhileIdle(alarmManager, triggerEpochMs, pendingIntent);
                            }
                        } else {
                            scheduleInexactWhileIdle(alarmManager, triggerEpochMs, pendingIntent);
                        }
                    } else {
                        alarmManager.setExact(
                                AlarmManager.RTC_WAKEUP,
                                triggerEpochMs,
                                pendingIntent
                        );
                    }
                    scheduledCount++;
                } catch (Exception ex) {
                    Log.e(TAG, "Failed scheduling alarm for " + section + " at " + triggerEpochMs, ex);
                }
            }

            // Cancel previous alarms no longer present in the new schedule
            if (oldJson != null) {
                try {
                    JSONArray oldArray = new JSONArray(oldJson);
                    for (int i = 0; i < oldArray.length(); i++) {
                        JSONObject oldObj = oldArray.getJSONObject(i);
                        String oldSection = oldObj.optString("section", "");
                        long oldTrigger = oldObj.optLong("triggerEpochMs", 0L);

                        if (oldSection.isEmpty() || oldTrigger <= 0L) {
                            continue;
                        }

                        String oldId = oldSection + "_" + oldTrigger;
                        if (!newAlarmIds.contains(oldId)) {
                            cancelAlarm(context, alarmManager, oldSection, oldTrigger);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Could not clean old schedule", e);
                }
            }

            prefs.edit()
                    .putString(SCHEDULE_KEY, persistedArray.toString())
                    .apply();

            Log.d(TAG, "Schedule updated successfully. Scheduled alarms: " + scheduledCount);

        } catch (Exception e) {
            Log.e(TAG, "Failed to update alarm schedule", e);
        }
    }

    private static void scheduleInexactWhileIdle(
            AlarmManager alarmManager,
            long triggerEpochMs,
            PendingIntent pendingIntent
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerEpochMs, pendingIntent);
        } else {
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerEpochMs, pendingIntent);
        }
    }

    private static void cancelAlarm(
            Context context,
            AlarmManager alarmManager,
            String section,
            long triggerEpochMs
    ) {
        int requestCode = (section + "_" + triggerEpochMs).hashCode();

        Intent intent = new Intent(context, AzkarAlarmReceiver.class);
        intent.setAction(ACTION);
        intent.setData(Uri.parse("almoazen://alarm/" + section + "/" + triggerEpochMs));

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );

        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
            Log.d(TAG, "Cancelled old alarm: " + section + " at " + triggerEpochMs);
        }
    }
}
