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
 * - Supports genuine delayed background audio + overlay verification tests via scheduleBackgroundTestAlarm().
 */
public class AlarmScheduler {
    private static final String TAG = "AlarmScheduler";
    private static final String ACTION = "com.muslim.azan.ACTION_TRIGGER_REMINDER";
    private static final String PREFS = "azan_reminders_prefs";
    private static final String SCHEDULE_KEY = "active_schedule_json";
    private static final int MAX_CONCURRENT_ALARMS = 250;

    /**
     * Schedules a genuine one-shot background test alarm after [delaySeconds] seconds
     * through AlarmManager -> AzkarAlarmReceiver -> AzkarAudioService (with Floating Overlay).
     * Persists and returns real diagnostic status (schedule mode, exact alarm state, failure reason).
     */
    public static AlarmScheduleTracker.BackgroundTestStatus scheduleBackgroundTestAlarmDetailed(
            Context context,
            String audioTrackId,
            String cityName,
            int delaySeconds
    ) {
        long nowMs = System.currentTimeMillis();
        long safeDelayMs = Math.max(3, delaySeconds) * 1000L;
        long triggerEpochMs = nowMs + safeDelayMs;
        String resolvedTrack = (audioTrackId != null && !audioTrackId.isEmpty()) ? audioTrackId : "makkah";

        if (context == null) {
            return new AlarmScheduleTracker.BackgroundTestStatus(
                    "failed",
                    AlarmScheduleTracker.ScheduleMode.FAILED,
                    false,
                    nowMs,
                    triggerEpochMs,
                    0L,
                    resolvedTrack,
                    "",
                    "Context غير متاح لجدولة التنبيه"
            );
        }

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            AlarmScheduleTracker.BackgroundTestStatus failed = new AlarmScheduleTracker.BackgroundTestStatus(
                    "failed",
                    AlarmScheduleTracker.ScheduleMode.FAILED,
                    false,
                    nowMs,
                    triggerEpochMs,
                    0L,
                    resolvedTrack,
                    "",
                    "خدمة AlarmManager غير متوفرة في هذا الجهاز"
            );
            AlarmScheduleTracker.saveBackgroundTestStatus(context, failed);
            return failed;
        }

        boolean canExact = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            canExact = alarmManager.canScheduleExactAlarms();
        }

        Intent showAppIntent = new Intent(context, MainActivity.class);
        showAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent showPendingIntent = PendingIntent.getActivity(
                context,
                9002,
                showAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent intent = new Intent(context, AzkarAlarmReceiver.class);
        intent.setAction(ACTION);
        intent.setData(Uri.parse("almoazen://alarm/test/" + triggerEpochMs));
        intent.putExtra("section", "prayer_azan");
        intent.putExtra("prayerName", "الاختبار في الخلفية");
        intent.putExtra("cityName", (cityName != null && !cityName.isEmpty()) ? cityName : "مكة المكرمة");
        intent.putExtra("title", "اختبار الأذان في الخلفية");
        intent.putExtra("body", "تم تفعيل منبه الخلفية وتشغيل الصوت والنافذة العائمة بنجاح");
        intent.putExtra("audioTrackId", resolvedTrack);
        intent.putExtra("autoPlay", true);
        intent.putExtra("isTestAlarm", true);
        intent.putExtra("testTriggerAtMs", triggerEpochMs);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                99001,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmScheduleTracker.ScheduleMode usedMode = AlarmScheduleTracker.ScheduleMode.FAILED;
        String fallbackOrFailureNote = "";

        try {
            if (canExact) {
                try {
                    AlarmManager.AlarmClockInfo clockInfo =
                            new AlarmManager.AlarmClockInfo(triggerEpochMs, showPendingIntent);
                    alarmManager.setAlarmClock(clockInfo, pendingIntent);
                    usedMode = AlarmScheduleTracker.ScheduleMode.ALARM_CLOCK;
                } catch (SecurityException se) {
                    Log.w(TAG, "setAlarmClock denied for test alarm, falling back", se);
                    fallbackOrFailureNote = "رفض النظام AlarmClock: " + se.getMessage();
                }
            }

            if (usedMode == AlarmScheduleTracker.ScheduleMode.FAILED && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && canExact) {
                try {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerEpochMs, pendingIntent);
                    usedMode = AlarmScheduleTracker.ScheduleMode.EXACT_WHILE_IDLE;
                } catch (SecurityException se) {
                    fallbackOrFailureNote = "رفض النظام ExactAlarm: " + se.getMessage();
                }
            }

            if (usedMode == AlarmScheduleTracker.ScheduleMode.FAILED) {
                scheduleInexactWhileIdle(alarmManager, triggerEpochMs, pendingIntent);
                usedMode = AlarmScheduleTracker.ScheduleMode.INEXACT_WHILE_IDLE;
                if (!canExact && fallbackOrFailureNote.isEmpty()) {
                    fallbackOrFailureNote = "إذن المنبهات الدقيقة غير مفعّل — تم استخدام الجدولة البديلة المرنة";
                }
            }

            AlarmScheduleTracker.BackgroundTestStatus status = new AlarmScheduleTracker.BackgroundTestStatus(
                    "scheduled",
                    usedMode,
                    canExact,
                    nowMs,
                    triggerEpochMs,
                    0L,
                    resolvedTrack,
                    "مجدول بواسطة " + usedMode.arabicLabel,
                    fallbackOrFailureNote
            );
            AlarmScheduleTracker.saveBackgroundTestStatus(context, status);
            return status;
        } catch (Exception e) {
            Log.e(TAG, "Failed scheduling background test alarm", e);
            AlarmScheduleTracker.BackgroundTestStatus failed = new AlarmScheduleTracker.BackgroundTestStatus(
                    "failed",
                    AlarmScheduleTracker.ScheduleMode.FAILED,
                    canExact,
                    nowMs,
                    triggerEpochMs,
                    0L,
                    resolvedTrack,
                    "",
                    e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            );
            AlarmScheduleTracker.saveBackgroundTestStatus(context, failed);
            return failed;
        }
    }

    public static long scheduleBackgroundTestAlarm(
            Context context,
            String audioTrackId,
            String cityName,
            int delaySeconds
    ) {
        AlarmScheduleTracker.BackgroundTestStatus status =
                scheduleBackgroundTestAlarmDetailed(context, audioTrackId, cityName, delaySeconds);
        return "failed".equals(status.state) ? -1L : status.triggerAtMs;
    }

    public static synchronized AlarmScheduleTracker.ScheduleOutcome rescheduleFromJson(Context context, String jsonArrayString) {
        long now = System.currentTimeMillis();
        if (context == null || jsonArrayString == null) {
            return new AlarmScheduleTracker.ScheduleOutcome(0, 0, 0, 0, 0, 0, false, "مدخلات الجدولة فارغة", now);
        }
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            AlarmScheduleTracker.ScheduleOutcome failed = new AlarmScheduleTracker.ScheduleOutcome(
                    0, 0, 0, 0, 0, 1, false, "AlarmManager غير متاح", now
            );
            AlarmScheduleTracker.saveOutcome(context, failed);
            return failed;
        }

        try {
            JSONArray newArray = new JSONArray(jsonArrayString);
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String oldJson = prefs.getString(SCHEDULE_KEY, null);

            boolean canExact = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                canExact = alarmManager.canScheduleExactAlarms();
            }
            prefs.edit().putBoolean("can_schedule_exact_alarms", canExact).apply();

            Intent showAppIntent = new Intent(context, MainActivity.class);
            showAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent showPendingIntent = PendingIntent.getActivity(
                    context,
                    9001,
                    showAppIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            AlarmScheduleTracker.ExecutionResult result = AlarmScheduleTracker.executeScheduleBatch(
                    newArray,
                    now,
                    MAX_CONCURRENT_ALARMS,
                    canExact,
                    Build.VERSION.SDK_INT,
                    new AlarmScheduleTracker.AlarmBackend() {
                        private PendingIntent buildAlarmPi(JSONObject obj, int requestCode, long triggerEpochMs) {
                            String section = obj.optString("section", "");
                            Intent intent = new Intent(context, AzkarAlarmReceiver.class);
                            intent.setAction(ACTION);
                            intent.setData(Uri.parse("almoazen://alarm/" + section + "/" + triggerEpochMs));

                            intent.putExtra("section", section);
                            intent.putExtra("prayerKey", obj.optString("prayerKey", ""));
                            intent.putExtra("title", obj.optString("title", ""));
                            intent.putExtra("body", obj.optString("body", ""));
                            intent.putExtra("audioTrackId", obj.optString("audioTrackId", ""));
                            intent.putExtra("prayerName", obj.optString("prayerName", "الصلاة"));
                            intent.putExtra("cityName", obj.optString("cityName", "مدينتك"));
                            intent.putExtra("iqamaDurationMinutes", obj.optInt("iqamaDurationMinutes", 15));
                            intent.putExtra("volumePercent", obj.optInt("volumePercent", 100));
                            intent.putExtra("alertMode", obj.optString("alertMode", "full_azan"));
                            intent.putExtra("silentDuringPrayer", obj.optBoolean("silentDuringPrayer", false));
                            intent.putExtra("duaAfterPrayerEnabled", obj.optBoolean("duaAfterPrayerEnabled", false));
                            intent.putExtra("autoPlay", obj.optBoolean("autoPlay", true));

                            return PendingIntent.getBroadcast(
                                    context,
                                    requestCode,
                                    intent,
                                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                            );
                        }

                        @Override
                        public void scheduleAlarmClock(JSONObject item, int requestCode, long triggerEpochMs) {
                            PendingIntent pi = buildAlarmPi(item, requestCode, triggerEpochMs);
                            AlarmManager.AlarmClockInfo clockInfo =
                                    new AlarmManager.AlarmClockInfo(triggerEpochMs, showPendingIntent);
                            alarmManager.setAlarmClock(clockInfo, pi);
                        }

                        @Override
                        public void scheduleExactWhileIdle(JSONObject item, int requestCode, long triggerEpochMs) {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                                throw new SecurityException("Exact alarm permission is not granted");
                            }
                            PendingIntent pi = buildAlarmPi(item, requestCode, triggerEpochMs);
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerEpochMs, pi);
                            } else {
                                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerEpochMs, pi);
                            }
                        }

                        @Override
                        public void scheduleExactLegacy(JSONObject item, int requestCode, long triggerEpochMs) {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                                throw new SecurityException("Exact alarm permission is not granted");
                            }
                            PendingIntent pi = buildAlarmPi(item, requestCode, triggerEpochMs);
                            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerEpochMs, pi);
                        }

                        @Override
                        public void scheduleInexactWhileIdle(JSONObject item, int requestCode, long triggerEpochMs) {
                            PendingIntent pi = buildAlarmPi(item, requestCode, triggerEpochMs);
                            AlarmScheduler.scheduleInexactWhileIdle(alarmManager, triggerEpochMs, pi);
                        }
                    }
            );

            JSONArray oldArray = null;
            if (oldJson != null && !oldJson.trim().isEmpty()) {
                try {
                    oldArray = new JSONArray(oldJson);
                } catch (Exception e) {
                    Log.e(TAG, "Could not parse previous alarm schedule JSON", e);
                }
            }

            AlarmScheduleTracker.ReconcileResult reconcileResult =
                    AlarmScheduleTracker.reconcileScheduleReplacement(oldArray, result, now);

            for (AlarmScheduleTracker.AlarmRef oldRef : reconcileResult.alarmsToCancel) {
                cancelAlarm(context, alarmManager, oldRef.section, oldRef.triggerEpochMs);
            }

            if (reconcileResult.preservedOldCount > 0) {
                Log.w(TAG, "Preserved " + reconcileResult.preservedOldCount
                        + " valid prior alarms because new scheduling had failures (failedCount="
                        + result.outcome.failedCount + ")");
            }

            // CRITICAL: Persist ONLY alarms confirmed by AlarmManager plus preserved still-active prior alarms
            prefs.edit()
                    .putString(SCHEDULE_KEY, reconcileResult.persistedScheduleArray.toString())
                    .apply();
            AlarmScheduleTracker.saveOutcome(context, result.outcome);

            Log.d(TAG, "Schedule updated. Confirmed alarms=" + result.outcome.scheduledCount
                    + ", preservedOld=" + reconcileResult.preservedOldCount
                    + ", failed=" + result.outcome.failedCount
                    + ", mode=" + result.outcome.getPrimaryMode().code);

            return result.outcome;
        } catch (Exception e) {
            Log.e(TAG, "Failed to update alarm schedule; preserving any prior alarms intact", e);
            AlarmScheduleTracker.ScheduleOutcome err = new AlarmScheduleTracker.ScheduleOutcome(
                    0, 0, 0, 0, 0, 1, false,
                    e.getMessage() != null ? e.getMessage() : "خطأ في تحديث جدول المنبهات",
                    now
            );
            AlarmScheduleTracker.saveOutcome(context, err);
            return err;
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
