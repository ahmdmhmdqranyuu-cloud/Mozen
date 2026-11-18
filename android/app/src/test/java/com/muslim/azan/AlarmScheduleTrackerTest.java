package com.muslim.azan;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 * JVM unit tests verifying:
 * 1. Only alarms confirmed accepted by AlarmManager are persisted.
 * 2. Fallback to INEXACT_WHILE_IDLE when SCHEDULE_EXACT_ALARM throws SecurityException.
 * 3. Valid prior future alarms are NEVER cancelled when new batch or section scheduling fails.
 */
public class AlarmScheduleTrackerTest {

    private JSONObject makeAlarm(String section, long triggerEpochMs) throws Exception {
        JSONObject obj = new JSONObject();
        obj.put("section", section);
        obj.put("triggerEpochMs", triggerEpochMs);
        obj.put("prayerName", "الفجر");
        return obj;
    }

    @Test
    public void executeScheduleBatch_onlyPersistsConfirmedAlarms_andRecordsFailureReason() throws Exception {
        long now = 1_700_000_000_000L;
        JSONArray candidates = new JSONArray();
        candidates.put(makeAlarm("prayer_azan", now + 60_000L));
        candidates.put(makeAlarm("morningAzkar", now + 120_000L));
        candidates.put(makeAlarm("salawat", now - 5_000L)); // past -> skipped

        AlarmScheduleTracker.AlarmBackend failingAzkarBackend = new AlarmScheduleTracker.AlarmBackend() {
            @Override
            public void scheduleAlarmClock(JSONObject item, int requestCode, long triggerEpochMs) {
                // succeeds
            }

            @Override
            public void scheduleExactWhileIdle(JSONObject item, int requestCode, long triggerEpochMs) {
                throw new IllegalStateException("OS quota exhausted");
            }

            @Override
            public void scheduleExactLegacy(JSONObject item, int requestCode, long triggerEpochMs) {
                throw new IllegalStateException("OS quota exhausted");
            }

            @Override
            public void scheduleInexactWhileIdle(JSONObject item, int requestCode, long triggerEpochMs) {
                throw new IllegalStateException("OS quota exhausted");
            }
        };

        AlarmScheduleTracker.ExecutionResult res = AlarmScheduleTracker.executeScheduleBatch(
                candidates, now, 100, true, 33, failingAzkarBackend
        );

        assertEquals(2, res.outcome.totalCandidates);
        assertEquals(1, res.outcome.scheduledCount);
        assertEquals(1, res.outcome.failedCount);
        assertEquals(1, res.confirmedScheduledArray.length());
        assertTrue(res.confirmedAlarmIds.contains("prayer_azan_" + (now + 60_000L)));
        assertFalse(res.confirmedAlarmIds.contains("morningAzkar_" + (now + 120_000L)));
        assertTrue(res.failedSections.contains("morningAzkar"));
        assertTrue(res.outcome.lastFailureReason.contains("OS quota exhausted"));
    }

    @Test
    public void executeScheduleBatch_fallsBackToInexactWhenExactPermissionDenied() throws Exception {
        long now = 1_700_000_000_000L;
        JSONArray candidates = new JSONArray();
        candidates.put(makeAlarm("prayer_azan", now + 60_000L));

        Set<String> inexactCalled = new HashSet<>();
        AlarmScheduleTracker.AlarmBackend securityExBackend = new AlarmScheduleTracker.AlarmBackend() {
            @Override
            public void scheduleAlarmClock(JSONObject item, int requestCode, long triggerEpochMs) {
                throw new SecurityException("Missing SCHEDULE_EXACT_ALARM");
            }

            @Override
            public void scheduleExactWhileIdle(JSONObject item, int requestCode, long triggerEpochMs) {
                throw new SecurityException("Missing SCHEDULE_EXACT_ALARM");
            }

            @Override
            public void scheduleExactLegacy(JSONObject item, int requestCode, long triggerEpochMs) {
                throw new SecurityException("Missing SCHEDULE_EXACT_ALARM");
            }

            @Override
            public void scheduleInexactWhileIdle(JSONObject item, int requestCode, long triggerEpochMs) {
                inexactCalled.add(item.optString("section") + "_" + triggerEpochMs);
            }
        };

        AlarmScheduleTracker.ExecutionResult res = AlarmScheduleTracker.executeScheduleBatch(
                candidates, now, 100, true, 33, securityExBackend
        );

        assertEquals(1, res.outcome.scheduledCount);
        assertEquals(1, res.outcome.inexactCount);
        assertEquals(0, res.outcome.failedCount);
        assertEquals(AlarmScheduleTracker.ScheduleMode.INEXACT_WHILE_IDLE, res.outcome.getPrimaryMode());
        assertEquals(1, inexactCalled.size());
    }

    @Test
    public void reconcileScheduleReplacement_preservesValidFutureOldAlarmsOnTotalBatchFailure() throws Exception {
        long now = 1_700_000_000_000L;
        JSONArray oldArray = new JSONArray();
        oldArray.put(makeAlarm("prayer_azan", now + 180_000L)); // valid future alarm
        oldArray.put(makeAlarm("morningAzkar", now + 240_000L)); // valid future alarm
        oldArray.put(makeAlarm("prayer_azan", now - 10_000L)); // already expired

        JSONArray failingCandidates = new JSONArray();
        failingCandidates.put(makeAlarm("prayer_azan", now + 300_000L));

        AlarmScheduleTracker.AlarmBackend totalFailBackend = new AlarmScheduleTracker.AlarmBackend() {
            @Override public void scheduleAlarmClock(JSONObject i, int r, long t) { throw new RuntimeException("Fail"); }
            @Override public void scheduleExactWhileIdle(JSONObject i, int r, long t) { throw new RuntimeException("Fail"); }
            @Override public void scheduleExactLegacy(JSONObject i, int r, long t) { throw new RuntimeException("Fail"); }
            @Override public void scheduleInexactWhileIdle(JSONObject i, int r, long t) { throw new RuntimeException("Fail"); }
        };

        AlarmScheduleTracker.ExecutionResult failedRes = AlarmScheduleTracker.executeScheduleBatch(
                failingCandidates, now, 100, true, 33, totalFailBackend
        );

        AlarmScheduleTracker.ReconcileResult reconciled =
                AlarmScheduleTracker.reconcileScheduleReplacement(oldArray, failedRes, now);

        // Both valid future old alarms must be preserved; only the expired old alarm is cancelled
        assertEquals(2, reconciled.preservedOldCount);
        assertEquals(2, reconciled.persistedScheduleArray.length());
        assertEquals(1, reconciled.alarmsToCancel.size());
        assertEquals(now - 10_000L, reconciled.alarmsToCancel.get(0).triggerEpochMs);
    }

    @Test
    public void reconcileScheduleReplacement_cancelsAllOldAlarmsWhenLegitimatelyDisabledWithoutErrors() throws Exception {
        long now = 1_700_000_000_000L;
        JSONArray oldArray = new JSONArray();
        oldArray.put(makeAlarm("prayer_azan", now + 180_000L));

        // User intentionally disabled all alerts (empty batch, 0 failures)
        AlarmScheduleTracker.ExecutionResult cleanEmpty = AlarmScheduleTracker.executeScheduleBatch(
                new JSONArray(), now, 100, true, 33,
                new AlarmScheduleTracker.AlarmBackend() {
                    @Override public void scheduleAlarmClock(JSONObject i, int r, long t) {}
                    @Override public void scheduleExactWhileIdle(JSONObject i, int r, long t) {}
                    @Override public void scheduleExactLegacy(JSONObject i, int r, long t) {}
                    @Override public void scheduleInexactWhileIdle(JSONObject i, int r, long t) {}
                }
        );

        AlarmScheduleTracker.ReconcileResult reconciled =
                AlarmScheduleTracker.reconcileScheduleReplacement(oldArray, cleanEmpty, now);

        assertEquals(0, reconciled.preservedOldCount);
        assertEquals(0, reconciled.persistedScheduleArray.length());
        assertEquals(1, reconciled.alarmsToCancel.size());
    }
}
