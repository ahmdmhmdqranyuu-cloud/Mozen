package com.muslim.azan.data

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.util.Locale
import java.util.TimeZone
import kotlin.coroutines.resume

data class SpecialPermissionsStatus(
    val notificationsGranted: Boolean,
    val exactAlarmsGranted: Boolean,
    val overlayGranted: Boolean,
    val batteryUnrestricted: Boolean,
    val fullScreenIntentGranted: Boolean,
    val locationGranted: Boolean
) {
    val missingBackgroundCount: Int
        get() = listOf(
            notificationsGranted,
            exactAlarmsGranted,
            overlayGranted,
            batteryUnrestricted,
            fullScreenIntentGranted
        ).count { !it }
}

object SystemPermissionHelper {

    fun checkPermissions(context: Context): SpecialPermissionsStatus {
        val notificationsGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }

        val exactAlarmsGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            context.getSystemService(AlarmManager::class.java)?.canScheduleExactAlarms() ?: true
        } else {
            true
        }

        val overlayGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }

        val batteryUnrestricted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            context.getSystemService(PowerManager::class.java)
                ?.isIgnoringBatteryOptimizations(context.packageName) ?: true
        } else {
            true
        }

        val fullScreenIntentGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            context.getSystemService(NotificationManager::class.java)?.canUseFullScreenIntent() ?: true
        } else {
            true
        }

        val locationGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

        return SpecialPermissionsStatus(
            notificationsGranted = notificationsGranted,
            exactAlarmsGranted = exactAlarmsGranted,
            overlayGranted = overlayGranted,
            batteryUnrestricted = batteryUnrestricted,
            fullScreenIntentGranted = fullScreenIntentGranted,
            locationGranted = locationGranted
        )
    }

    fun openNotificationSettings(context: Context) {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                }
            } else {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:" + context.packageName)
                }
            }
            context.startActivity(intent)
        } catch (_: Exception) {
            openAppDetailsSettings(context)
        }
    }

    fun openExactAlarmSettings(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    data = Uri.parse("package:" + context.packageName)
                }
                context.startActivity(intent)
                return
            } catch (_: Exception) {}
        }
        openAppDetailsSettings(context)
    }

    fun openOverlaySettings(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.packageName)
                )
                context.startActivity(intent)
                return
            } catch (_: Exception) {}
        }
        openAppDetailsSettings(context)
    }

    fun openBatteryOptimizationSettings(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:" + context.packageName)
                }
                context.startActivity(intent)
                return
            } catch (_: Exception) {
                try {
                    context.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
                    return
                } catch (_: Exception) {}
            }
        }
        openAppDetailsSettings(context)
    }

    fun openFullScreenIntentSettings(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            try {
                val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
                    data = Uri.parse("package:" + context.packageName)
                }
                context.startActivity(intent)
                return
            } catch (_: Exception) {}
        }
        openNotificationSettings(context)
    }

    fun openAppDetailsSettings(context: Context) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:" + context.packageName)
            }
            context.startActivity(intent)
        } catch (_: Exception) {}
    }

    /**
     * Resolves device GPS coordinates using FusedLocationProviderClient with fallback to Android LocationManager,
     * determines city name via Geocoder when available, updates NativePreferences, and returns the resolved name.
     */
    @SuppressLint("MissingPermission")
    suspend fun detectAndSaveGpsLocation(
        context: Context,
        prefs: NativePreferences
    ): Result<String> {
        val status = checkPermissions(context)
        if (!status.locationGranted) {
            return Result.failure(IllegalStateException("يرجى منح صلاحية الموقع (GPS) أولًا"))
        }

        val location = fetchBestLocation(context)
            ?: return Result.failure(IllegalStateException("تعذر التقاط إشارة GPS حاليًا، تأكد من تفعيل الموقع"))

        val resolvedCity = withContext(Dispatchers.IO) {
            resolveCityName(context, location.latitude, location.longitude)
        } ?: "موقعي الحالي (GPS)"

        val tzId = TimeZone.getDefault().id
        prefs.setGpsLocation(resolvedCity, location.latitude, location.longitude, tzId)

        return Result.success(resolvedCity)
    }

    @SuppressLint("MissingPermission")
    private suspend fun fetchBestLocation(context: Context): Location? {
        // 1. Try Play Services FusedLocationProviderClient (getCurrentLocation)
        val fused = runCatching {
            val client = LocationServices.getFusedLocationProviderClient(context)
            suspendCancellableCoroutine<Location?> { cont ->
                val cts = CancellationTokenSource()
                cont.invokeOnCancellation { cts.cancel() }
                client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cts.token)
                    .addOnSuccessListener { loc ->
                        if (cont.isActive) cont.resume(loc)
                    }
                    .addOnFailureListener {
                        if (cont.isActive) cont.resume(null)
                    }
            }
        }.getOrNull()

        if (fused != null) return fused

        // 2. Fallback to Android LocationManager last known location (works without Google Play Services)
        return runCatching {
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            val gps = lm?.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            val net = lm?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            when {
                gps != null && net != null -> if (gps.time >= net.time) gps else net
                gps != null -> gps
                else -> net
            }
        }.getOrNull()
    }

    @Suppress("DEPRECATION")
    private fun resolveCityName(context: Context, lat: Double, lng: Double): String? {
        return try {
            val geocoder = Geocoder(context, Locale("ar"))
            val addresses = geocoder.getFromLocation(lat, lng, 1)
            val addr = addresses?.firstOrNull()
            addr?.locality ?: addr?.subAdminArea ?: addr?.adminArea ?: addr?.countryName
        } catch (_: Exception) {
            null
        }
    }
}
