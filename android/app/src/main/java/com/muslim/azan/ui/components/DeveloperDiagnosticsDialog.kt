package com.muslim.azan.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.muslim.azan.AlarmScheduleTracker
import com.muslim.azan.AzkarAudioService
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.theme.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Hidden Developer Diagnostics Dialog unlocked from Settings -> About (7 rapid taps on version label).
 * Visualizes live AudioFocus state, WakeLock status, system permissions, and recent AlarmScheduleTracker logs.
 */
@Composable
fun DeveloperDiagnosticsDialog(
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var refreshTick by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1_500L)
            refreshTick++
        }
    }

    val snapshot = remember(refreshTick) {
        val prefs = context.getSharedPreferences(AlarmScheduleTracker.LEGACY_PREFS, Context.MODE_PRIVATE)
        DeveloperDiagSnapshot(
            audioPlaying = AzkarAudioService.isPlayingNow,
            activeSection = AzkarAudioService.currentSection.ifBlank { "idle" },
            activeTrack = AzkarAudioService.activeTrackLabel.ifBlank { "-" },
            audioError = AzkarAudioService.lastAudioError,
            focusLabel = AzkarAudioService.currentAudioFocusLabel,
            focusRequestCode = AzkarAudioService.lastAudioFocusResultCode,
            focusCallbackCode = AzkarAudioService.lastAudioFocusCallbackEvent,
            focusTransientPaused = AzkarAudioService.isPausedByTransientAudioFocus(),
            focusDucked = AzkarAudioService.isAudioFocusDucked(),
            pendingQueueSize = AzkarAudioService.getPendingQueueSize(),
            wakeLockHeld = AzkarAudioService.isPlaybackWakeLockHeld(),
            wakeLockAcquireMs = AzkarAudioService.lastWakeLockAcquireAtMs,
            wakeLockReleaseMs = AzkarAudioService.lastWakeLockReleaseAtMs,
            permStatus = SystemPermissionHelper.checkPermissions(context),
            scheduleOutcome = AlarmScheduleTracker.loadOutcome(context),
            bgTestStatus = AlarmScheduleTracker.loadBackgroundTestStatus(context),
            audioDiag = AlarmScheduleTracker.loadAudioDiagnostic(context),
            lastRecalcMs = prefs.getLong("last_recalculated_epoch_ms", 0L),
            lastRecalcError = prefs.getString("last_recalc_error", null),
            logHistory = AlarmScheduleTracker.loadDiagnosticLogHistory(context)
        )
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color(0xFFFAF6EA),
            border = BorderStroke(1.5.dp, MoazenGold),
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.88f)
                .testTag("developer_diagnostics_dialog")
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MuslimPlusPillEmerald)
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.BugReport,
                            contentDescription = null,
                            tint = GoldLight,
                            modifier = Modifier.size(20.dp)
                        )
                        Column {
                            Text(
                                text = "لوحة تشخيص الصوت والمنبهات (للمطور)",
                                color = Color.White,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "AudioFocus • WakeLock • AlarmScheduleTracker",
                                color = GoldLight,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                    Row {
                        IconButton(onClick = { refreshTick++ }) {
                            Icon(Icons.Default.Refresh, contentDescription = "تحديث", tint = Color.White)
                        }
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = Color.White)
                        }
                    }
                }

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // 1. Live AudioFocus Card
                    DiagSectionCard(title = "1. AudioFocus & Playback State") {
                        DiagKeyValue("Focus Label", snapshot.focusLabel)
                        DiagKeyValue(
                            "Request / Callback Code",
                            "${formatFocusCode(snapshot.focusRequestCode)} / ${formatFocusCode(snapshot.focusCallbackCode)}"
                        )
                        DiagKeyValue(
                            "Transient Pause / Ducked",
                            "${snapshot.focusTransientPaused} / ${snapshot.focusDucked}"
                        )
                        DiagKeyValue(
                            "Service Playing",
                            "${snapshot.audioPlaying} (section=${snapshot.activeSection}, queue=${snapshot.pendingQueueSize})"
                        )
                        DiagKeyValue("Active Track", snapshot.activeTrack)
                        if (!snapshot.audioError.isNullOrBlank()) {
                            DiagKeyValue("Last Audio Error", snapshot.audioError, valueColor = ErrorRed)
                        }
                    }

                    // 2. WakeLock & Permissions Card
                    DiagSectionCard(title = "2. WakeLock & System Permissions") {
                        DiagKeyValue(
                            "AudioService WakeLock Held",
                            if (snapshot.wakeLockHeld) "HELD (PARTIAL_WAKE_LOCK)" else "RELEASED / IDLE",
                            valueColor = if (snapshot.wakeLockHeld) EmeraldPrimaryDark else MoazenInkPrimary
                        )
                        DiagKeyValue(
                            "Last Acquire / Release",
                            "${formatTs(snapshot.wakeLockAcquireMs)} / ${formatTs(snapshot.wakeLockReleaseMs)}"
                        )
                        DiagKeyValue(
                            "Exact Alarms / Notifications",
                            "${snapshot.permStatus.exactAlarmsGranted} / ${snapshot.permStatus.notificationsGranted}",
                            valueColor = if (snapshot.permStatus.exactAlarmsGranted) EmeraldPrimaryDark else ErrorRed
                        )
                        DiagKeyValue(
                            "Battery Unrestricted / Overlay",
                            "${snapshot.permStatus.batteryUnrestricted} / ${snapshot.permStatus.overlayGranted}"
                        )
                    }

                    // 3. AlarmScheduleTracker Summary
                    DiagSectionCard(title = "3. AlarmScheduleTracker & Boot Recalculation") {
                        val out = snapshot.scheduleOutcome
                        if (out != null) {
                            DiagKeyValue("Primary Mode", out.primaryMode.code)
                            DiagKeyValue(
                                "Confirmed / Candidates",
                                "${out.scheduledCount}/${out.totalCandidates} (AC=${out.alarmClockCount}, Exact=${out.exactCount}, Inexact=${out.inexactCount}, Failed=${out.failedCount})",
                                valueColor = if (out.failedCount > 0) ErrorRed else EmeraldPrimaryDark
                            )
                            DiagKeyValue("Exact Permission Snapshot", "${out.exactPermissionGranted}")
                            if (out.lastFailureReason.isNotEmpty()) {
                                DiagKeyValue("Failure Reason", out.lastFailureReason, valueColor = ErrorRed)
                            }
                            DiagKeyValue("Outcome Updated", formatTs(out.updatedAtMs))
                        } else {
                            DiagKeyValue("ScheduleOutcome", "No schedule summary recorded yet")
                        }
                        DiagKeyValue("Last Boot Recalc", formatTs(snapshot.lastRecalcMs))
                        if (!snapshot.lastRecalcError.isNullOrBlank()) {
                            DiagKeyValue("Last Recalc Error", snapshot.lastRecalcError, valueColor = ErrorRed)
                        }
                        val bg = snapshot.bgTestStatus
                        if (bg != null) {
                            DiagKeyValue(
                                "Last Background Test",
                                "state=${bg.state}, mode=${bg.scheduleMode.code}, track=${bg.audioTrackId}"
                            )
                        }
                        val ad = snapshot.audioDiag
                        if (ad != null) {
                            DiagKeyValue(
                                "Last Audio Diagnostic",
                                "file=${ad.resolvedFileName}, focus=${ad.focusResultCode}, started=${ad.startedOk}"
                            )
                        }
                    }

                    // 4. Rolling Diagnostic Logs
                    DiagSectionCard(title = "4. Recent Diagnostic Logs (${snapshot.logHistory.size})") {
                        if (snapshot.logHistory.isEmpty()) {
                            Text(
                                text = "لا توجد سجلات تشخيصية محفوظة حتى الآن.",
                                color = MoazenInkMuted,
                                fontSize = 11.sp
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF10221E))
                                    .border(1.dp, MoazenGold.copy(alpha = 0.45f), RoundedCornerShape(8.dp))
                                    .padding(8.dp)
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    snapshot.logHistory.forEach { line ->
                                        Text(
                                            text = line,
                                            color = Color(0xFFE7F3ED),
                                            fontSize = 10.sp,
                                            lineHeight = 14.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Bottom actions
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            val textReport = buildString {
                                appendLine("=== AlMoazen Developer Diagnostics ===")
                                appendLine("Focus: ${snapshot.focusLabel} (req=${snapshot.focusRequestCode}, cb=${snapshot.focusCallbackCode})")
                                appendLine("WakeLockHeld: ${snapshot.wakeLockHeld} | Playing: ${snapshot.audioPlaying} (${snapshot.activeSection})")
                                appendLine("ExactAlarms: ${snapshot.permStatus.exactAlarmsGranted} | BatteryUnrestricted: ${snapshot.permStatus.batteryUnrestricted}")
                                snapshot.scheduleOutcome?.let { o ->
                                    appendLine("Schedule: mode=${o.primaryMode.code} ok=${o.scheduledCount}/${o.totalCandidates} fail=${o.failedCount} err=${o.lastFailureReason}")
                                }
                                appendLine("Logs:")
                                snapshot.logHistory.forEach { appendLine(it) }
                            }
                            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                            cm?.setPrimaryClip(ClipData.newPlainText("AlMoazenDiagnostics", textReport))
                            Toast.makeText(context, "تم نسخ تقرير التشخيص", Toast.LENGTH_SHORT).show()
                        },
                        border = BorderStroke(1.dp, MoazenInkEmerald),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("نسخ التقرير", color = MoazenInkEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = {
                            AlarmScheduleTracker.clearDiagnosticLogHistory(context)
                            refreshTick++
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = MoazenGoldDark),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.DeleteSweep, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("مسح السجل", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

private data class DeveloperDiagSnapshot(
    val audioPlaying: Boolean,
    val activeSection: String,
    val activeTrack: String,
    val audioError: String?,
    val focusLabel: String,
    val focusRequestCode: Int,
    val focusCallbackCode: Int,
    val focusTransientPaused: Boolean,
    val focusDucked: Boolean,
    val pendingQueueSize: Int,
    val wakeLockHeld: Boolean,
    val wakeLockAcquireMs: Long,
    val wakeLockReleaseMs: Long,
    val permStatus: com.muslim.azan.data.SpecialPermissionsStatus,
    val scheduleOutcome: AlarmScheduleTracker.ScheduleOutcome?,
    val bgTestStatus: AlarmScheduleTracker.BackgroundTestStatus?,
    val audioDiag: AlarmScheduleTracker.AudioPlaybackDiagnostic?,
    val lastRecalcMs: Long,
    val lastRecalcError: String?,
    val logHistory: List<String>
)

@Composable
private fun DiagSectionCard(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    MoazenWidgetCard(
        cornerRadius = 14.dp,
        borderColor = MoazenCardBorder,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            Text(
                text = title,
                color = MoazenInkEmerald,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            HorizontalDivider(color = MoazenCardBorder, thickness = 1.dp)
            content()
        }
    }
}

@Composable
private fun DiagKeyValue(
    key: String,
    value: String,
    valueColor: Color = MoazenInkPrimary
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "$key:",
            color = MoazenInkMuted,
            fontSize = 10.5.sp,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.weight(0.44f)
        )
        Text(
            text = value,
            color = valueColor,
            fontSize = 10.5.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.weight(0.56f)
        )
    }
}

private fun formatFocusCode(code: Int): String =
    if (code == Int.MIN_VALUE) "N/A" else code.toString()

private fun formatTs(epochMs: Long): String {
    if (epochMs <= 0L) return "-"
    return runCatching {
        SimpleDateFormat("HH:mm:ss", Locale.US).format(Date(epochMs))
    }.getOrDefault(epochMs.toString())
}
