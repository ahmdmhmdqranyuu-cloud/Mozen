package com.muslim.azan;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

/**
 * Pure domain policy & telemetry tracker for AlarmManager scheduling and genuine background test diagnostics.
 * Guarantees that only alarms confirmed as accepted by AlarmManager are persisted as scheduled.
 */
public final class AlarmScheduleTracker {

    public static final String RUNTIME_STATE_PREFS = "azan_runtime_state_prefs";
    public static final String LEGACY_PREFS = "azan_reminders_prefs";
    public static final String KEY_SCHEDULE_SUMMARY = "last_schedule_summary_json";
    public static final String KEY_BG_TEST_STATUS = "background_test_status_json";
    public static final String ACTION_BG_TEST_STATE_CHANGED = "com.muslim.azan.BG_TEST_STATE_CHANGED";

    public enum ScheduleMode {
        ALARM_CLOCK("ALARM_CLOCK", "منبه نظام دقيق (AlarmClock)"),
        EXACT_WHILE_IDLE("EXACT_WHILE_IDLE", "جدولة دقيقة (ExactWhileIdle)"),
        EXACT("EXACT", "جدولة دقيقة (Exact)"),
        INEXACT_WHILE_IDLE("INEXACT_WHILE_IDLE", "جدولة بديلة مرنة (InexactWhileIdle)"),
        FAILED("FAILED", "فشلت الجدولة");

        public final String code;
        public final String arabicLabel;

        ScheduleMode(String code, String arabicLabel) {
            this.code = code;
            this.arabicLabel = arabicLabel;
        }

        public static ScheduleMode fromCode(String code) {
            if (code == null) return FAILED;
            for (ScheduleMode m : values()) {
                if (m.code.equals(code)) return m;
            }
            return FAILED;
        }
    }

    public static final class ScheduleOutcome {
        public final int totalCandidates;
        public final int scheduledCount;
        public final int alarmClockCount;
        public final int exactCount;
        public final int inexactCount;
        public final int failedCount;
        public final boolean exactPermissionGranted;
        public final String lastFailureReason;
        public final long updatedAtMs;

        public ScheduleOutcome(
                int totalCandidates,
                int scheduledCount,
                int alarmClockCount,
                int exactCount,
                int inexactCount,
                int failedCount,
                boolean exactPermissionGranted,
                String lastFailureReason,
                long updatedAtMs
        ) {
            this.totalCandidates = totalCandidates;
            this.scheduledCount = scheduledCount;
            this.alarmClockCount = alarmClockCount;
            this.exactCount = exactCount;
            this.inexactCount = inexactCount;
            this.failedCount = failedCount;
            this.exactPermissionGranted = exactPermissionGranted;
            this.lastFailureReason = lastFailureReason != null ? lastFailureReason : "";
            this.updatedAtMs = updatedAtMs;
        }

        public ScheduleMode getPrimaryMode() {
            if (scheduledCount == 0 && failedCount > 0) return ScheduleMode.FAILED;
            if (alarmClockCount > 0) return ScheduleMode.ALARM_CLOCK;
            if (exactCount > 0) return ScheduleMode.EXACT_WHILE_IDLE;
            if (inexactCount > 0) return ScheduleMode.INEXACT_WHILE_IDLE;
            return ScheduleMode.INEXACT_WHILE_IDLE;
        }

        public JSONObject toJson() {
            JSONObject obj = new JSONObject();
            try {
                obj.put("totalCandidates", totalCandidates);
                obj.put("scheduledCount", scheduledCount);
                obj.put("alarmClockCount", alarmClockCount);
                obj.put("exactCount", exactCount);
                obj.put("inexactCount", inexactCount);
                obj.put("failedCount", failedCount);
                obj.put("exactPermissionGranted", exactPermissionGranted);
                obj.put("primaryMode", getPrimaryMode().code);
                obj.put("lastFailureReason", lastFailureReason);
                obj.put("updatedAtMs", updatedAtMs);
            } catch (Exception ignored) {}
            return obj;
        }

        public static ScheduleOutcome fromJson(String raw) {
            if (raw == null || raw.trim().isEmpty()) return null;
            try {
                JSONObject obj = new JSONObject(raw);
                return new ScheduleOutcome(
                        obj.optInt("totalCandidates", 0),
                        obj.optInt("scheduledCount", 0),
                        obj.optInt("alarmClockCount", 0),
                        obj.optInt("exactCount", 0),
                        obj.optInt("inexactCount", 0),
                        obj.optInt("failedCount", 0),
                        obj.optBoolean("exactPermissionGranted", true),
                        obj.optString("lastFailureReason", ""),
                        obj.optLong("updatedAtMs", 0L)
                );
            } catch (Exception e) {
                return null;
            }
        }
    }

    public static final class BackgroundTestStatus {
        public final String state; // idle | scheduled | receiver_fired | playing | completed | failed
        public final ScheduleMode scheduleMode;
        public final boolean exactPermissionGranted;
        public final long scheduledAtMs;
        public final long triggerAtMs;
        public final long firedAtMs;
        public final String audioTrackId;
        public final String playbackDetail;
        public final String failureReason;

        public BackgroundTestStatus(
                String state,
                ScheduleMode scheduleMode,
                boolean exactPermissionGranted,
                long scheduledAtMs,
                long triggerAtMs,
                long firedAtMs,
                String audioTrackId,
                String playbackDetail,
                String failureReason
        ) {
            this.state = state != null ? state : "idle";
            this.scheduleMode = scheduleMode != null ? scheduleMode : ScheduleMode.FAILED;
            this.exactPermissionGranted = exactPermissionGranted;
            this.scheduledAtMs = scheduledAtMs;
            this.triggerAtMs = triggerAtMs;
            this.firedAtMs = firedAtMs;
            this.audioTrackId = audioTrackId != null ? audioTrackId : "";
            this.playbackDetail = playbackDetail != null ? playbackDetail : "";
            this.failureReason = failureReason != null ? failureReason : "";
        }

        public JSONObject toJson() {
            JSONObject obj = new JSONObject();
            try {
                obj.put("state", state);
                obj.put("scheduleMode", scheduleMode.code);
                obj.put("scheduleModeArabic", scheduleMode.arabicLabel);
                obj.put("exactPermissionGranted", exactPermissionGranted);
                obj.put("scheduledAtMs", scheduledAtMs);
                obj.put("triggerAtMs", triggerAtMs);
                obj.put("firedAtMs", firedAtMs);
                obj.put("audioTrackId", audioTrackId);
                obj.put("playbackDetail", playbackDetail);
                obj.put("failureReason", failureReason);
            } catch (Exception ignored) {}
            return obj;
        }

        public static BackgroundTestStatus fromJson(String raw) {
            if (raw == null || raw.trim().isEmpty()) return null;
            try {
                JSONObject obj = new JSONObject(raw);
                return new BackgroundTestStatus(
                        obj.optString("state", "idle"),
                        ScheduleMode.fromCode(obj.optString("scheduleMode", "FAILED")),
                        obj.optBoolean("exactPermissionGranted", false),
                        obj.optLong("scheduledAtMs", 0L),
                        obj.optLong("triggerAtMs", 0L),
                        obj.optLong("firedAtMs", 0L),
                        obj.optString("audioTrackId", ""),
                        obj.optString("playbackDetail", ""),
                        obj.optString("failureReason", "")
                );
            } catch (Exception e) {
                return null;
            }
        }
    }

    public interface AlarmBackend {
        void scheduleAlarmClock(JSONObject item, int requestCode, long triggerEpochMs) throws Exception;
        void scheduleExactWhileIdle(JSONObject item, int requestCode, long triggerEpochMs) throws Exception;
        void scheduleExactLegacy(JSONObject item, int requestCode, long triggerEpochMs) throws Exception;
        void scheduleInexactWhileIdle(JSONObject item, int requestCode, long triggerEpochMs) throws Exception;
    }

    public static final class ExecutionResult {
        public final JSONArray confirmedScheduledArray;
        public final Set<String> confirmedAlarmIds;
        public final ScheduleOutcome outcome;

        public ExecutionResult(JSONArray confirmedScheduledArray, Set<String> confirmedAlarmIds, ScheduleOutcome outcome) {
            this.confirmedScheduledArray = confirmedScheduledArray;
            this.confirmedAlarmIds = confirmedAlarmIds;
            this.outcome = outcome;
        }
    }

    /**
     * Pure testable scheduling state machine.
     * Ensures NO alarm is marked as persisted/scheduled unless [backend] completes without throwing.
     */
    public static ExecutionResult executeScheduleBatch(
            JSONArray candidates,
            long nowMs,
            int maxConcurrentAlarms,
            boolean canExact,
            int sdkInt,
            AlarmBackend backend
    ) {
        JSONArray confirmed = new JSONArray();
        Set<String> seenIds = new HashSet<>();
        Set<String> confirmedIds = new HashSet<>();

        int totalCandidates = 0;
        int scheduledCount = 0;
        int alarmClockCount = 0;
        int exactCount = 0;
        int inexactCount = 0;
        int failedCount = 0;
        String lastFailureReason = "";

        if (candidates == null) {
            return new ExecutionResult(
                    confirmed,
                    confirmedIds,
                    new ScheduleOutcome(0, 0, 0, 0, 0, 0, canExact, "", nowMs)
            );
        }

        for (int i = 0; i < candidates.length() && scheduledCount < maxConcurrentAlarms; i++) {
            JSONObject obj = candidates.optJSONObject(i);
            if (obj == null) continue;

            String section = obj.optString("section", "");
            long triggerEpochMs = obj.optLong("triggerEpochMs", 0L);
            if (section.isEmpty() || triggerEpochMs <= nowMs) {
                continue;
            }

            String alarmId = section + "_" + triggerEpochMs;
            if (!seenIds.add(alarmId)) {
                continue;
            }
            totalCandidates++;
            int requestCode = alarmId.hashCode();

            ScheduleMode usedMode = null;
            try {
                if ("prayer_azan".equals(section) && canExact) {
                    try {
                        backend.scheduleAlarmClock(obj, requestCode, triggerEpochMs);
                        usedMode = ScheduleMode.ALARM_CLOCK;
                    } catch (SecurityException se) {
                        backend.scheduleInexactWhileIdle(obj, requestCode, triggerEpochMs);
                        usedMode = ScheduleMode.INEXACT_WHILE_IDLE;
                        lastFailureReason = "تم التحويل للجدولة البديلة بعد تعذر AlarmClock: " + safeMsg(se);
                    }
                } else if (sdkInt >= Build.VERSION_CODES.M) {
                    if (canExact) {
                        try {
                            backend.scheduleExactWhileIdle(obj, requestCode, triggerEpochMs);
                            usedMode = ScheduleMode.EXACT_WHILE_IDLE;
                        } catch (SecurityException se) {
                            backend.scheduleInexactWhileIdle(obj, requestCode, triggerEpochMs);
                            usedMode = ScheduleMode.INEXACT_WHILE_IDLE;
                            lastFailureReason = "تم التحويل للجدولة البديلة بعد رفض ExactAlarm: " + safeMsg(se);
                        }
                    } else {
                        backend.scheduleInexactWhileIdle(obj, requestCode, triggerEpochMs);
                        usedMode = ScheduleMode.INEXACT_WHILE_IDLE;
                    }
                } else {
                    backend.scheduleExactLegacy(obj, requestCode, triggerEpochMs);
                    usedMode = ScheduleMode.EXACT;
                }
            } catch (Exception ex) {
                usedMode = ScheduleMode.FAILED;
                failedCount++;
                lastFailureReason = safeMsg(ex);
            }

            // CRITICAL FIX: Persist alarm ONLY if OS scheduling succeeded
            if (usedMode != null && usedMode != ScheduleMode.FAILED) {
                try {
                    JSONObject savedCopy = new JSONObject(obj.toString());
                    savedCopy.put("scheduledMode", usedMode.code);
                    savedCopy.put("scheduledAtMs", nowMs);
                    confirmed.put(savedCopy);
                } catch (Exception ignored) {
                    confirmed.put(obj);
                }
                confirmedIds.add(alarmId);
                scheduledCount++;
                switch (usedMode) {
                    case ALARM_CLOCK:
                        alarmClockCount++;
                        break;
                    case EXACT_WHILE_IDLE:
                    case EXACT:
                        exactCount++;
                        break;
                    case INEXACT_WHILE_IDLE:
                        inexactCount++;
                        break;
                    default:
                        break;
                }
            }
        }

        ScheduleOutcome outcome = new ScheduleOutcome(
                totalCandidates,
                scheduledCount,
                alarmClockCount,
                exactCount,
                inexactCount,
                failedCount,
                canExact,
                lastFailureReason,
                nowMs
        );
        return new ExecutionResult(confirmed, confirmedIds, outcome);
    }

    public static void saveOutcome(Context context, ScheduleOutcome outcome) {
        if (context == null || outcome == null) return;
        SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
        rt.edit().putString(KEY_SCHEDULE_SUMMARY, outcome.toJson().toString()).apply();
    }

    public static ScheduleOutcome loadOutcome(Context context) {
        if (context == null) return null;
        SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
        return ScheduleOutcome.fromJson(rt.getString(KEY_SCHEDULE_SUMMARY, null));
    }

    public static void saveBackgroundTestStatus(Context context, BackgroundTestStatus status) {
        if (context == null || status == null) return;
        SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
        rt.edit().putString(KEY_BG_TEST_STATUS, status.toJson().toString()).apply();
        try {
            android.content.Intent b = new android.content.Intent(ACTION_BG_TEST_STATE_CHANGED);
            b.setPackage(context.getPackageName());
            b.putExtra("statusJson", status.toJson().toString());
            context.sendBroadcast(b);
        } catch (Exception ignored) {}
    }

    public static BackgroundTestStatus loadBackgroundTestStatus(Context context) {
        if (context == null) return null;
        SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
        return BackgroundTestStatus.fromJson(rt.getString(KEY_BG_TEST_STATUS, null));
    }

    private static String safeMsg(Throwable t) {
        if (t == null) return "خطأ غير معروف";
        String m = t.getMessage();
        return (m != null && !m.trim().isEmpty()) ? m : t.getClass().getSimpleName();
    }
}
