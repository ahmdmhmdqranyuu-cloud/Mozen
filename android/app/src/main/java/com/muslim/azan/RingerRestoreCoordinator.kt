package com.muslim.azan

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.media.AudioManager
import android.os.Build
import android.util.Log

/**
 * Coordinates temporary Silent-During-Prayer mode and guaranteed restoration of the user's
 * original ringer mode across normal expiration, device reboots, and app crashes — while strictly
 * respecting manual ringer changes made by the user.
 */
object RingerRestoreCoordinator {
    private const val TAG = "RingerRestoreCoord"
    private const val RUNTIME_PREFS = "azan_runtime_state_prefs"
    private const val LEGACY_PREFS = "azan_reminders_prefs"
    private const val RESTORE_REQUEST_CODE = 99115
    const val ACTION_RESTORE_RINGER = "com.muslim.azan.ACTION_RESTORE_RINGER"

    private const val KEY_SAVED_PREV_MODE = "saved_prev_ringer_mode"
    private const val KEY_APPLIED_MODE = "ringer_applied_mode"
    private const val KEY_STARTED_AT_MS = "ringer_silent_started_at_ms"
    private const val KEY_RESTORE_AT_MS = "ringer_restore_at_ms"

    enum class RestoreDecision {
        NO_ACTIVE_SESSION,
        RESTORE_TO_PREVIOUS,
        STILL_WITHIN_WINDOW,
        USER_OVERRIDDEN_CLEAR,
        PERMISSION_REVOKED_RETAINED
    }

    data class SilentSessionSnapshot(
        val prevMode: Int,
        val appliedMode: Int,
        val startedAtMs: Long,
        val restoreAtMs: Long
    )

    /**
     * Pure testable decision function for ringer restoration.
     * Guarantees we never overwrite a user's manual change out of silent mode, preserves the
     * snapshot when DND policy permission is revoked, and cleanly restores once the prayer window
     * expires if the app-applied silent mode is still active.
     */
    @JvmStatic
    @JvmOverloads
    fun evaluateRestoreDecision(
        savedPrevMode: Int,
        appliedMode: Int,
        currentDeviceMode: Int,
        restoreAtMs: Long,
        nowMs: Long,
        hasDndPermission: Boolean = true
    ): RestoreDecision {
        if (savedPrevMode < 0 || appliedMode < 0 || restoreAtMs <= 0L) {
            return RestoreDecision.NO_ACTIVE_SESSION
        }
        if (currentDeviceMode != appliedMode) {
            // User manually changed phone ringer mode (e.g. switched back to Normal or Vibrate).
            return RestoreDecision.USER_OVERRIDDEN_CLEAR
        }
        if (nowMs >= restoreAtMs) {
            return if (hasDndPermission) {
                RestoreDecision.RESTORE_TO_PREVIOUS
            } else {
                RestoreDecision.PERMISSION_REVOKED_RETAINED
            }
        }
        return RestoreDecision.STILL_WITHIN_WINDOW
    }

    @JvmStatic
    fun canModifyRingerMode(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            return nm?.isNotificationPolicyAccessGranted == true
        }
        return true
    }

    @JvmStatic
    @JvmOverloads
    fun beginSilentDuringPrayer(
        context: Context,
        durationMinutes: Int = 15,
        nowMs: Long = System.currentTimeMillis()
    ): Boolean {
        try {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return false
            if (!canModifyRingerMode(context)) {
                Log.w(TAG, "DND Policy access not granted; cannot activate silent mode")
                return false
            }

            val rtPrefs = runtimePrefs(context)
            val existingPrev = rtPrefs.getInt(KEY_SAVED_PREV_MODE, -1)
            val currentMode = am.ringerMode

            val prevModeToSave: Int
            if (existingPrev >= 0 && currentMode == AudioManager.RINGER_MODE_SILENT) {
                // Already in an app-managed silent window; extend deadline without losing original prevMode
                prevModeToSave = existingPrev
            } else if (currentMode != AudioManager.RINGER_MODE_SILENT) {
                prevModeToSave = currentMode
            } else {
                // User already had device in Silent mode before prayer -> do not touch or override!
                Log.d(TAG, "Device is already in Silent mode; preserving user setting without auto-restore")
                return false
            }

            val clampedDurationMin = durationMinutes.coerceIn(2, 60)
            val restoreAtMs = nowMs + clampedDurationMin * 60_000L

            rtPrefs.edit()
                .putInt(KEY_SAVED_PREV_MODE, prevModeToSave)
                .putInt(KEY_APPLIED_MODE, AudioManager.RINGER_MODE_SILENT)
                .putLong(KEY_STARTED_AT_MS, nowMs)
                .putLong(KEY_RESTORE_AT_MS, restoreAtMs)
                .apply()

            if (currentMode != AudioManager.RINGER_MODE_SILENT) {
                am.ringerMode = AudioManager.RINGER_MODE_SILENT
            }

            scheduleRestoreAlarm(context, restoreAtMs)
            Log.d(TAG, "Silent mode activated cleanly; restore scheduled for $restoreAtMs (prev=$prevModeToSave)")
            return true
        } catch (e: Exception) {
            Log.w(TAG, "Unable to activate silent mode during prayer", e)
            return false
        }
    }

    @JvmStatic
    @JvmOverloads
    fun handleRestoreTrigger(context: Context, nowMs: Long = System.currentTimeMillis()): RestoreDecision {
        return reconcileOrRescheduleOnWake(context, nowMs, allowEarlyForce = false)
    }

    /**
     * Called on BootReceiver, MainActivity.onResume, or ACTION_RESTORE_RINGER alarm firing.
     * - If past deadline and phone is still Silent (and user hasn't manually changed it), restores ringerMode.
     * - If DND permission was revoked, retains the snapshot until permission is re-granted or user manually overrides ringer mode.
     * - If phone is no longer Silent, clears persisted session without overriding user's manual change.
     * - If still within silent window (e.g. device rebooted mid-prayer), reschedules the restore alarm!
     */
    @JvmStatic
    @JvmOverloads
    fun reconcileOrRescheduleOnWake(
        context: Context,
        nowMs: Long = System.currentTimeMillis(),
        allowEarlyForce: Boolean = false
    ): RestoreDecision {
        try {
            val rtPrefs = runtimePrefs(context)
            migrateLegacyIfNeeded(context, rtPrefs, nowMs)

            val savedPrev = rtPrefs.getInt(KEY_SAVED_PREV_MODE, -1)
            val appliedMode = rtPrefs.getInt(KEY_APPLIED_MODE, -1)
            val restoreAtMs = rtPrefs.getLong(KEY_RESTORE_AT_MS, 0L)

            if (savedPrev < 0 || appliedMode < 0 || restoreAtMs <= 0L) {
                return RestoreDecision.NO_ACTIVE_SESSION
            }

            val am = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return RestoreDecision.NO_ACTIVE_SESSION
            val currentMode = am.ringerMode
            val effectiveNow = if (allowEarlyForce) maxOf(nowMs, restoreAtMs) else nowMs
            val hasDndPermission = canModifyRingerMode(context)
            val decision = evaluateRestoreDecision(
                savedPrevMode = savedPrev,
                appliedMode = appliedMode,
                currentDeviceMode = currentMode,
                restoreAtMs = restoreAtMs,
                nowMs = effectiveNow,
                hasDndPermission = hasDndPermission
            )

            when (decision) {
                RestoreDecision.USER_OVERRIDDEN_CLEAR -> {
                    clearSession(context)
                    Log.d(TAG, "User manually changed ringer mode to $currentMode; clearing silent restore session cleanly")
                }
                RestoreDecision.RESTORE_TO_PREVIOUS -> {
                    am.ringerMode = savedPrev
                    Log.d(TAG, "Restored ringer mode to previous value ($savedPrev)")
                    clearSession(context)
                }
                RestoreDecision.PERMISSION_REVOKED_RETAINED -> {
                    // Retain snapshot intact so ringer mode can be restored automatically once DND permission is granted again.
                    Log.w(TAG, "Cannot restore ringer mode yet because DND policy permission was revoked; retaining snapshot (prev=$savedPrev)")
                }
                RestoreDecision.STILL_WITHIN_WINDOW -> {
                    // Reschedule alarm cleanly (crucial after reboot or package replacement)
                    scheduleRestoreAlarm(context, restoreAtMs)
                }
                RestoreDecision.NO_ACTIVE_SESSION -> Unit
            }
            return decision
        } catch (e: Exception) {
            Log.w(TAG, "Failed reconciling ringer mode state", e)
            return RestoreDecision.NO_ACTIVE_SESSION
        }
    }

    @JvmStatic
    fun getActiveSnapshot(context: Context): SilentSessionSnapshot? {
        val rt = runtimePrefs(context)
        val prev = rt.getInt(KEY_SAVED_PREV_MODE, -1)
        val applied = rt.getInt(KEY_APPLIED_MODE, -1)
        val started = rt.getLong(KEY_STARTED_AT_MS, 0L)
        val restoreAt = rt.getLong(KEY_RESTORE_AT_MS, 0L)
        if (prev < 0 || applied < 0 || restoreAt <= 0L) return null
        return SilentSessionSnapshot(prev, applied, started, restoreAt)
    }

    @JvmStatic
    fun clearSession(context: Context) {
        runtimePrefs(context).edit()
            .remove(KEY_SAVED_PREV_MODE)
            .remove(KEY_APPLIED_MODE)
            .remove(KEY_STARTED_AT_MS)
            .remove(KEY_RESTORE_AT_MS)
            .apply()
        context.getSharedPreferences(LEGACY_PREFS, Context.MODE_PRIVATE).edit()
            .remove("saved_prev_ringer_mode")
            .apply()
    }

    private fun migrateLegacyIfNeeded(context: Context, rtPrefs: SharedPreferences, nowMs: Long) {
        if (rtPrefs.contains(KEY_SAVED_PREV_MODE)) return
        val legacy = context.getSharedPreferences(LEGACY_PREFS, Context.MODE_PRIVATE)
        val legacyPrev = legacy.getInt("saved_prev_ringer_mode", -1)
        if (legacyPrev >= 0) {
            rtPrefs.edit()
                .putInt(KEY_SAVED_PREV_MODE, legacyPrev)
                .putInt(KEY_APPLIED_MODE, AudioManager.RINGER_MODE_SILENT)
                .putLong(KEY_STARTED_AT_MS, nowMs)
                .putLong(KEY_RESTORE_AT_MS, nowMs)
                .apply()
            legacy.edit().remove("saved_prev_ringer_mode").apply()
        }
    }

    private fun scheduleRestoreAlarm(context: Context, restoreAtMs: Long) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val restoreIntent = Intent(context, AzkarAlarmReceiver::class.java).apply {
            action = ACTION_RESTORE_RINGER
        }
        val pi = PendingIntent.getBroadcast(
            context,
            RESTORE_REQUEST_CODE,
            restoreIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val canExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) am.canScheduleExactAlarms() else true
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && canExact) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restoreAtMs, pi)
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restoreAtMs, pi)
            } else {
                am.set(AlarmManager.RTC_WAKEUP, restoreAtMs, pi)
            }
        } catch (se: SecurityException) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restoreAtMs, pi)
            } else {
                am.set(AlarmManager.RTC_WAKEUP, restoreAtMs, pi)
            }
        }
    }

    private fun runtimePrefs(context: Context): SharedPreferences =
        context.getSharedPreferences(RUNTIME_PREFS, Context.MODE_PRIVATE)
}
