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
    public static final String KEY_AUDIO_DIAGNOSTIC = "last_audio_diagnostic_json";
    public static final String KEY_DIAGNOSTIC_LOG_HISTORY = "diagnostic_log_history_json";
    public static final String ACTION_BG_TEST_STATE_CHANGED = "com.muslim.azan.BG_TEST_STATE_CHANGED";
    private static final int MAX_DIAGNOSTIC_LOG_ENTRIES = 25;

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

    public static final class AlarmRef {
        public final String section;
        public final long triggerEpochMs;

        public AlarmRef(String section, long triggerEpochMs) {
            this.section = section;
            this.triggerEpochMs = triggerEpochMs;
        }
    }

    public static final class ExecutionResult {
        public final JSONArray confirmedScheduledArray;
        public final Set<String> confirmedAlarmIds;
        public final Set<String> failedSections;
        public final ScheduleOutcome outcome;

        public ExecutionResult(
                JSONArray confirmedScheduledArray,
                Set<String> confirmedAlarmIds,
                ScheduleOutcome outcome
        ) {
            this(confirmedScheduledArray, confirmedAlarmIds, new HashSet<>(), outcome);
        }

        public ExecutionResult(
                JSONArray confirmedScheduledArray,
                Set<String> confirmedAlarmIds,
                Set<String> failedSections,
                ScheduleOutcome outcome
        ) {
            this.confirmedScheduledArray = confirmedScheduledArray;
            this.confirmedAlarmIds = confirmedAlarmIds;
            this.failedSections = failedSections != null ? failedSections : new HashSet<>();
            this.outcome = outcome;
        }
    }

    public static final class ReconcileResult {
        public final java.util.List<AlarmRef> alarmsToCancel;
        public final JSONArray persistedScheduleArray;
        public final int preservedOldCount;

        public ReconcileResult(
                java.util.List<AlarmRef> alarmsToCancel,
                JSONArray persistedScheduleArray,
                int preservedOldCount
        ) {
            this.alarmsToCancel = alarmsToCancel;
            this.persistedScheduleArray = persistedScheduleArray;
            this.preservedOldCount = preservedOldCount;
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
        Set<String> failedSections = new HashSet<>();

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
                    failedSections,
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
                if ("prayer_azan".equals(section)) {

                    // الأذان الأساسي يجب أن يستخدم جدولة دقيقة فقط.
                    if (!canExact) {
                        throw new SecurityException(
                                "Exact alarm permission is not granted for prayer azan"
                        );
                    }

                    try {
                        backend.scheduleAlarmClock(
                                obj,
                                requestCode,
                                triggerEpochMs
                        );
                        usedMode = ScheduleMode.ALARM_CLOCK;

                    } catch (SecurityException alarmClockError) {

                        // محاولة بديلة دقيقة، وليس Inexact.
                        backend.scheduleExactWhileIdle(
                                obj,
                                requestCode,
                                triggerEpochMs
                        );

                        usedMode = ScheduleMode.EXACT_WHILE_IDLE;
                    }

                } else if (sdkInt >= Build.VERSION_CODES.M) {

                    if (canExact) {
                        try {
                            backend.scheduleExactWhileIdle(
                                    obj,
                                    requestCode,
                                    triggerEpochMs
                            );
                            usedMode = ScheduleMode.EXACT_WHILE_IDLE;

                        } catch (SecurityException se) {
                            backend.scheduleInexactWhileIdle(
                                    obj,
                                    requestCode,
                                    triggerEpochMs
                            );
                            usedMode = ScheduleMode.INEXACT_WHILE_IDLE;
                            lastFailureReason =
                                    "Exact scheduling denied: " + safeMsg(se);
                        }

                    } else {
                        backend.scheduleInexactWhileIdle(
                                obj,
                                requestCode,
                                triggerEpochMs
                        );
                        usedMode = ScheduleMode.INEXACT_WHILE_IDLE;
                    }

                } else {
                    backend.scheduleExactLegacy(
                            obj,
                            requestCode,
                            triggerEpochMs
                    );
                    usedMode = ScheduleMode.EXACT;
                }

            } catch (Exception ex) {

                usedMode = ScheduleMode.FAILED;
                failedCount++;
                failedSections.add(section);
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
        return new ExecutionResult(confirmed, confirmedIds, failedSections, outcome);
    }

    /**
     * Reconciles old scheduled alarms against a newly executed batch.
     * Guarantees valid future old alarms are NEVER cancelled when new scheduling fails:
     * - If the new batch produced 0 confirmed alarms while recording failures, ALL valid future old
     *   alarms are preserved untouched (both in AlarmManager and in persisted JSON).
     * - If individual sections failed while others succeeded, valid future old alarms belonging to any
     *   failed section are also preserved untouched.
     */
    public static ReconcileResult reconcileScheduleReplacement(
            JSONArray oldArray,
            ExecutionResult newResult,
            long nowMs
    ) {
        java.util.List<AlarmRef> toCancel = new java.util.ArrayList<>();
        JSONArray merged = new JSONArray();
        Set<String> seenMergedIds = new HashSet<>();
        int preservedCount = 0;

        if (newResult != null && newResult.confirmedScheduledArray != null) {
            for (int i = 0; i < newResult.confirmedScheduledArray.length(); i++) {
                JSONObject obj = newResult.confirmedScheduledArray.optJSONObject(i);
                if (obj == null) continue;
                String sec = obj.optString("section", "");
                long trig = obj.optLong("triggerEpochMs", 0L);
                if (!sec.isEmpty() && trig > 0L) {
                    seenMergedIds.add(sec + "_" + trig);
                }
                merged.put(obj);
            }
        }

        boolean totalBatchFailure = newResult == null
                || (newResult.outcome.scheduledCount == 0 && newResult.outcome.failedCount > 0);
        Set<String> failedSections = newResult != null ? newResult.failedSections : new HashSet<>();

        if (oldArray != null) {
            for (int i = 0; i < oldArray.length(); i++) {
                JSONObject oldObj = oldArray.optJSONObject(i);
                if (oldObj == null) continue;
                String oldSection = oldObj.optString("section", "");
                long oldTrigger = oldObj.optLong("triggerEpochMs", 0L);
                if (oldSection.isEmpty() || oldTrigger <= 0L) continue;

                String oldId = oldSection + "_" + oldTrigger;
                boolean alreadyConfirmed = newResult != null && newResult.confirmedAlarmIds.contains(oldId);
                if (alreadyConfirmed) {
                    continue;
                }

                boolean isValidFutureOldAlarm = oldTrigger > nowMs;
                boolean shouldPreserve = isValidFutureOldAlarm
                        && (totalBatchFailure || failedSections.contains(oldSection));

                if (shouldPreserve) {
                    if (seenMergedIds.add(oldId)) {
                        merged.put(oldObj);
                        preservedCount++;
                    }
                } else {
                    toCancel.add(new AlarmRef(oldSection, oldTrigger));
                }
            }
        }

        return new ReconcileResult(toCancel, merged, preservedCount);
    }

    public static void saveOutcome(Context context, ScheduleOutcome outcome) {
        if (context == null || outcome == null) return;
        SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
        rt.edit().putString(KEY_SCHEDULE_SUMMARY, outcome.toJson().toString()).apply();
        appendDiagnosticLog(
                context,
                "SCHEDULE",
                "mode=" + outcome.getPrimaryMode().code
                        + " scheduled=" + outcome.scheduledCount + "/" + outcome.totalCandidates
                        + " alarmClock=" + outcome.alarmClockCount
                        + " exact=" + outcome.exactCount
                        + " inexact=" + outcome.inexactCount
                        + " failed=" + outcome.failedCount
                        + " canExact=" + outcome.exactPermissionGranted
                        + (outcome.lastFailureReason.isEmpty() ? "" : " err=" + outcome.lastFailureReason)
        );
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
        appendDiagnosticLog(
                context,
                "BG_TEST",
                "state=" + status.state
                        + " mode=" + status.scheduleMode.code
                        + " track=" + status.audioTrackId
                        + " canExact=" + status.exactPermissionGranted
                        + (status.failureReason.isEmpty() ? "" : " err=" + status.failureReason)
        );
        try {
            android.content.Intent b = new android.content.Intent(ACTION_BG_TEST_STATE_CHANGED);
            b.setPackage(context.getPackageName());
            b.putExtra("statusJson", status.toJson().toString());
            context.sendBroadcast(b);
        } catch (Exception ignored) {}
    }

    public static final class AudioPlaybackDiagnostic {
        public final String requestedTrackId;
        public final String resolvedFileName;
        public final String section;
        public final int focusResultCode;
        public final String focusWarning;
        public final boolean fallbackUsed;
        public final boolean preparedOk;
        public final boolean startedOk;
        public final String errorReason;
        public final long recordedAtMs;

        public AudioPlaybackDiagnostic(
                String requestedTrackId,
                String resolvedFileName,
                String section,
                int focusResultCode,
                String focusWarning,
                boolean fallbackUsed,
                boolean preparedOk,
                boolean startedOk,
                String errorReason,
                long recordedAtMs
        ) {
            this.requestedTrackId = requestedTrackId != null ? requestedTrackId : "";
            this.resolvedFileName = resolvedFileName != null ? resolvedFileName : "";
            this.section = section != null ? section : "";
            this.focusResultCode = focusResultCode;
            this.focusWarning = focusWarning != null ? focusWarning : "";
            this.fallbackUsed = fallbackUsed;
            this.preparedOk = preparedOk;
            this.startedOk = startedOk;
            this.errorReason = errorReason != null ? errorReason : "";
            this.recordedAtMs = recordedAtMs;
        }

        public JSONObject toJson() {
            JSONObject obj = new JSONObject();
            try {
                obj.put("requestedTrackId", requestedTrackId);
                obj.put("resolvedFileName", resolvedFileName);
                obj.put("section", section);
                obj.put("focusResultCode", focusResultCode);
                obj.put("focusWarning", focusWarning);
                obj.put("fallbackUsed", fallbackUsed);
                obj.put("preparedOk", preparedOk);
                obj.put("startedOk", startedOk);
                obj.put("errorReason", errorReason);
                obj.put("recordedAtMs", recordedAtMs);
            } catch (Exception ignored) {}
            return obj;
        }

        public static AudioPlaybackDiagnostic fromJson(String raw) {
            if (raw == null || raw.trim().isEmpty()) return null;
            try {
                JSONObject obj = new JSONObject(raw);
                return new AudioPlaybackDiagnostic(
                        obj.optString("requestedTrackId", ""),
                        obj.optString("resolvedFileName", ""),
                        obj.optString("section", ""),
                        obj.optInt("focusResultCode", 0),
                        obj.optString("focusWarning", ""),
                        obj.optBoolean("fallbackUsed", false),
                        obj.optBoolean("preparedOk", false),
                        obj.optBoolean("startedOk", false),
                        obj.optString("errorReason", ""),
                        obj.optLong("recordedAtMs", 0L)
                );
            } catch (Exception e) {
                return null;
            }
        }
    }

    public static void saveAudioDiagnostic(Context context, AudioPlaybackDiagnostic diag) {
        if (context == null || diag == null) return;
        SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
        rt.edit().putString(KEY_AUDIO_DIAGNOSTIC, diag.toJson().toString()).apply();
        appendDiagnosticLog(
                context,
                "AUDIO",
                "section=" + diag.section
                        + " file=" + diag.resolvedFileName
                        + " focus=" + diag.focusResultCode
                        + " prepared=" + diag.preparedOk
                        + " started=" + diag.startedOk
                        + (diag.errorReason.isEmpty() ? "" : " err=" + diag.errorReason)
        );
    }

    public static AudioPlaybackDiagnostic loadAudioDiagnostic(Context context) {
        if (context == null) return null;
        SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
        return AudioPlaybackDiagnostic.fromJson(rt.getString(KEY_AUDIO_DIAGNOSTIC, null));
    }

    public static BackgroundTestStatus loadBackgroundTestStatus(Context context) {
        if (context == null) return null;
        SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
        return BackgroundTestStatus.fromJson(rt.getString(KEY_BG_TEST_STATUS, null));
    }

    public static synchronized void appendDiagnosticLog(Context context, String category, String message) {
        if (context == null || message == null) return;
        try {
            SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
            String raw = rt.getString(KEY_DIAGNOSTIC_LOG_HISTORY, "[]");
            JSONArray arr = new JSONArray(raw);
            JSONObject entry = new JSONObject();
            entry.put("ts", System.currentTimeMillis());
            entry.put("cat", category != null ? category : "INFO");
            entry.put("msg", message);
            arr.put(entry);

            JSONArray trimmed = new JSONArray();
            int start = Math.max(0, arr.length() - MAX_DIAGNOSTIC_LOG_ENTRIES);
            for (int i = start; i < arr.length(); i++) {
                trimmed.put(arr.get(i));
            }
            rt.edit().putString(KEY_DIAGNOSTIC_LOG_HISTORY, trimmed.toString()).apply();
        } catch (Exception ignored) {}
    }

    public static synchronized java.util.List<String> loadDiagnosticLogHistory(Context context) {
        java.util.List<String> out = new java.util.ArrayList<>();
        if (context == null) return out;
        try {
            SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
            JSONArray arr = new JSONArray(rt.getString(KEY_DIAGNOSTIC_LOG_HISTORY, "[]"));
            java.text.SimpleDateFormat fmt =
                    new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.US);
            for (int i = arr.length() - 1; i >= 0; i--) {
                JSONObject obj = arr.optJSONObject(i);
                if (obj == null) continue;
                long ts = obj.optLong("ts", 0L);
                String cat = obj.optString("cat", "INFO");
                String msg = obj.optString("msg", "");
                String timeLabel = ts > 0L ? fmt.format(new java.util.Date(ts)) : "--:--:--";
                out.add("[" + timeLabel + "] [" + cat + "] " + msg);
            }
        } catch (Exception ignored) {}
        return out;
    }

    public static synchronized void clearDiagnosticLogHistory(Context context) {
        if (context == null) return;
        try {
            SharedPreferences rt = context.getSharedPreferences(RUNTIME_STATE_PREFS, Context.MODE_PRIVATE);
            rt.edit().remove(KEY_DIAGNOSTIC_LOG_HISTORY).apply();
        } catch (Exception ignored) {}
    }

    private static String safeMsg(Throwable t) {
        if (t == null) return "خطأ غير معروف";
        String m = t.getMessage();
        return (m != null && !m.trim().isEmpty()) ? m : t.getClass().getSimpleName();
    }
}
