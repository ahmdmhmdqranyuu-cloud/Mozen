package com.muslim.azan

import android.media.AudioManager
import org.junit.Assert.assertEquals
import org.junit.Test

class RingerRestoreCoordinatorTest {

    @Test
    fun normalExpiry_whileDeviceStillInSilentMode_restoresToPrevious() {
        val now = 1_700_000_900_000L
        val decision = RingerRestoreCoordinator.evaluateRestoreDecision(
            savedPrevMode = AudioManager.RINGER_MODE_NORMAL,
            appliedMode = AudioManager.RINGER_MODE_SILENT,
            currentDeviceMode = AudioManager.RINGER_MODE_SILENT,
            restoreAtMs = now - 5_000L,
            nowMs = now,
            hasDndPermission = true
        )
        assertEquals(RingerRestoreCoordinator.RestoreDecision.RESTORE_TO_PREVIOUS, decision)
    }

    @Test
    fun manualUserOverride_outOfSilentMode_clearsSessionWithoutOverwriting() {
        val now = 1_700_000_500_000L
        val decision = RingerRestoreCoordinator.evaluateRestoreDecision(
            savedPrevMode = AudioManager.RINGER_MODE_NORMAL,
            appliedMode = AudioManager.RINGER_MODE_SILENT,
            currentDeviceMode = AudioManager.RINGER_MODE_VIBRATE,
            restoreAtMs = now + 300_000L,
            nowMs = now,
            hasDndPermission = true
        )
        assertEquals(RingerRestoreCoordinator.RestoreDecision.USER_OVERRIDDEN_CLEAR, decision)
    }

    @Test
    fun midPrayerWake_beforeDeadline_staysWithinWindowForReschedule() {
        val now = 1_700_000_500_000L
        val decision = RingerRestoreCoordinator.evaluateRestoreDecision(
            savedPrevMode = AudioManager.RINGER_MODE_NORMAL,
            appliedMode = AudioManager.RINGER_MODE_SILENT,
            currentDeviceMode = AudioManager.RINGER_MODE_SILENT,
            restoreAtMs = now + 450_000L,
            nowMs = now,
            hasDndPermission = true
        )
        assertEquals(RingerRestoreCoordinator.RestoreDecision.STILL_WITHIN_WINDOW, decision)
    }

    @Test
    fun dndPermissionRevoked_atExpiry_retainsSnapshotInsteadOfClearing() {
        val now = 1_700_000_900_000L
        val decision = RingerRestoreCoordinator.evaluateRestoreDecision(
            savedPrevMode = AudioManager.RINGER_MODE_NORMAL,
            appliedMode = AudioManager.RINGER_MODE_SILENT,
            currentDeviceMode = AudioManager.RINGER_MODE_SILENT,
            restoreAtMs = now - 1_000L,
            nowMs = now,
            hasDndPermission = false
        )
        assertEquals(RingerRestoreCoordinator.RestoreDecision.PERMISSION_REVOKED_RETAINED, decision)
    }

    @Test
    fun noActiveSession_whenMissingSavedPrevMode_returnsNoActiveSession() {
        val decision = RingerRestoreCoordinator.evaluateRestoreDecision(
            savedPrevMode = -1,
            appliedMode = AudioManager.RINGER_MODE_SILENT,
            currentDeviceMode = AudioManager.RINGER_MODE_SILENT,
            restoreAtMs = 1_700_000_900_000L,
            nowMs = 1_700_000_950_000L,
            hasDndPermission = true
        )
        assertEquals(RingerRestoreCoordinator.RestoreDecision.NO_ACTIVE_SESSION, decision)
    }
}
