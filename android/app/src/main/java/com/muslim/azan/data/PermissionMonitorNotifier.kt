package com.muslim.azan.data

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import com.muslim.azan.R

/**
 * Monitors critical app permissions and posts clear, polite, non-spamming Android shade notifications
 * ONLY when POST_NOTIFICATIONS is granted by the user.
 * - Covers: Location, Exact Alarms (SCHEDULE_EXACT_ALARM), Battery/Background Optimization, and Notification monitoring.
 * - Includes direct Action buttons opening the exact Android system settings page for the missing permission.
 * - Auto-cancels any permission notification immediately once that permission becomes granted.
 * - Strictly never attempts to bypass system notification disablement.
 */
object PermissionMonitorNotifier {

    private const val CHANNEL_ID = "muslim_plus_permission_alerts"
    private const val PREFS_NAME = "muslim_plus_permission_monitor_prefs"
    private const val COOLDOWN_MS = 12L * 60L * 60L * 1000L // 12 hours anti-spam window

    private const val KEY_LOCATION = "location"
    private const val KEY_EXACT_ALARM = "exact_alarm"
    private const val KEY_BATTERY = "battery"

    private const val NOTIF_ID_LOCATION = 7101
    private const val NOTIF_ID_EXACT_ALARM = 7102
    private const val NOTIF_ID_BATTERY = 7103

    data class MonitoredPermissionDecision(
        val key: String,
        val notifId: Int,
        val granted: Boolean,
        val title: String,
        val body: String,
        val actionLabel: String
    )

    fun evaluateAndSyncNotifications(context: Context, language: String = "ar") {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        val status = SystemPermissionHelper.checkPermissions(context)
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isEnglish = language == "en"

        // Record previous POST_NOTIFICATIONS state safely without bypassing OS restriction
        prefs.edit().putBoolean("prev_notifications", status.notificationsGranted).apply()

        // CRITICAL: If user disabled POST_NOTIFICATIONS, never attempt to post or bypass system restrictions.
        if (!status.notificationsGranted) {
            cancelAllPermissionNotifications(nm)
            return
        }

        ensureChannel(nm, isEnglish)

        val decisions = buildDecisions(status, isEnglish)
        val nowMs = System.currentTimeMillis()
        val editor = prefs.edit()
        var postedThisPass = false

        for (decision in decisions) {
            val prevKey = "prev_granted_${decision.key}"
            val lastNotifiedKey = "last_notified_ms_${decision.key}"
            val hadPrevRecord = prefs.contains(prevKey)
            val wasPreviouslyGranted = prefs.getBoolean(prevKey, false)
            val lastNotifiedMs = prefs.getLong(lastNotifiedKey, 0L)

            editor.putBoolean(prevKey, decision.granted)

            if (decision.granted) {
                // Immediately auto-cancel once granted
                nm.cancel(decision.notifId)
                continue
            }

            // Revocation or still denied: check cooldown to avoid repeated notification spam
            val justRevoked = hadPrevRecord && wasPreviouslyGranted && !decision.granted
            val cooldownElapsed = (nowMs - lastNotifiedMs) >= COOLDOWN_MS

            if ((justRevoked || cooldownElapsed) && !postedThisPass) {
                val posted = postPermissionNotification(context, nm, decision)
                if (posted) {
                    editor.putLong(lastNotifiedKey, nowMs)
                    postedThisPass = true // At most one polite reminder per check pass
                }
            }
        }

        editor.apply()
    }

    fun cancelAllPermissionNotifications(context: Context) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        cancelAllPermissionNotifications(nm)
    }

    private fun cancelAllPermissionNotifications(nm: NotificationManager) {
        nm.cancel(NOTIF_ID_LOCATION)
        nm.cancel(NOTIF_ID_EXACT_ALARM)
        nm.cancel(NOTIF_ID_BATTERY)
    }

    private fun buildDecisions(
        status: SpecialPermissionsStatus,
        isEnglish: Boolean
    ): List<MonitoredPermissionDecision> {
        return listOf(
            MonitoredPermissionDecision(
                key = KEY_EXACT_ALARM,
                notifId = NOTIF_ID_EXACT_ALARM,
                granted = status.exactAlarmsGranted,
                title = if (isEnglish) "Exact Alarms Permission Needed" else "مطلوب إذن المنبهات الدقيقة للأذان",
                body = if (isEnglish) {
                    "Enable Exact Alarms so Rafeeq Al-Muslim can trigger Azan and scheduled reminders on the exact second."
                } else {
                    "فعّل إذن المنبهات الدقيقة ليتمكن تطبيق رفيق المسلم من إطلاق الأذان والتنبيهات في موعدها بالثانية."
                },
                actionLabel = if (isEnglish) "Open Settings" else "فتح الإعدادات"
            ),
            MonitoredPermissionDecision(
                key = KEY_BATTERY,
                notifId = NOTIF_ID_BATTERY,
                granted = status.batteryUnrestricted,
                title = if (isEnglish) "Background Running Restricted" else "تحسين البطارية قد يؤخر الأذان",
                body = if (isEnglish) {
                    "Allow unrestricted battery usage so Android does not pause prayer alerts and background Azkar."
                } else {
                    "استثنِ التطبيق من قيود البطارية لضمان عمل الأذان والتنبيهات في الخلفية دون توقف."
                },
                actionLabel = if (isEnglish) "Adjust Battery" else "ضبط البطارية"
            ),
            MonitoredPermissionDecision(
                key = KEY_LOCATION,
                notifId = NOTIF_ID_LOCATION,
                granted = status.locationGranted,
                title = if (isEnglish) "Location Permission Disabled" else "إذن الموقع معطّل حالياً",
                body = if (isEnglish) {
                    "Enable location access to calculate accurate prayer times and Qibla direction for your current area."
                } else {
                    "فعّل إذن الموقع لحساب مواقيت الصلاة واتجاه القبلة بدقة حسب منطقتك الحالية."
                },
                actionLabel = if (isEnglish) "Enable Location" else "تفعيل الموقع"
            )
        )
    }

    private fun ensureChannel(nm: NotificationManager, isEnglish: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val existing = nm.getNotificationChannel(CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    if (isEnglish) "Permissions & Reliability Alerts" else "تنبيهات الأذونات واستقرار الأذان",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = if (isEnglish) {
                        "Notifies when critical permissions needed for accurate Azan and Qibla are disabled"
                    } else {
                        "إشعارات توضيحية عند تعطّل صلاحية مطلوبة لدقة الأذان والمواقيت"
                    }
                    setShowBadge(false)
                }
                nm.createNotificationChannel(channel)
            }
        }
    }

    private fun postPermissionNotification(
        context: Context,
        nm: NotificationManager,
        decision: MonitoredPermissionDecision
    ): Boolean {
        return try {
            val targetIntent = resolveSettingsIntentForKey(context, decision.key)
            val actionPendingIntent = PendingIntent.getActivity(
                context,
                decision.notifId,
                targetIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification_muslim_plus)
                .setContentTitle(decision.title)
                .setContentText(decision.body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(decision.body))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setOnlyAlertOnce(true)
                .setAutoCancel(true)
                .setContentIntent(actionPendingIntent)
                .addAction(
                    R.drawable.ic_notification_muslim_plus,
                    decision.actionLabel,
                    actionPendingIntent
                )
                .build()

            nm.notify(decision.notifId, notification)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun resolveSettingsIntentForKey(context: Context, key: String): Intent {
        val candidate = when (key) {
            KEY_EXACT_ALARM -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                        data = Uri.parse("package:${context.packageName}")
                    }
                } else {
                    buildAppDetailsIntent(context)
                }
            }
            KEY_BATTERY -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                } else {
                    buildAppDetailsIntent(context)
                }
            }
            else -> buildAppDetailsIntent(context)
        }
        candidate.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

        val pm: PackageManager = context.packageManager
        return if (candidate.resolveActivity(pm) != null) {
            candidate
        } else {
            buildAppDetailsIntent(context).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
        }
    }

    private fun buildAppDetailsIntent(context: Context): Intent {
        return Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:${context.packageName}")
        }
    }
}
