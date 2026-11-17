package com.muslim.azan.data

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.TimeZone
import kotlin.coroutines.resume
import kotlin.math.roundToInt

data class SpecialPermissionsStatus(
    val notificationsGranted: Boolean,
    val exactAlarmsGranted: Boolean,
    val overlayGranted: Boolean,
    val batteryUnrestricted: Boolean,
    val fullScreenIntentGranted: Boolean,
    val locationGranted: Boolean,
    val microphoneGranted: Boolean = false,
    val fineLocationGranted: Boolean = locationGranted,
    val coarseLocationGranted: Boolean = locationGranted
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

data class GpsLocationResult(
    val cityName: String,
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Int,
    val timezoneId: String,
    val calcMethod: String,
    val country: String = "",
    val countryCode: String = "",
    val governorate: String = "",
    val city: String = "",
    val district: String = "",
    val neighborhood: String = "",
    val street: String = "",
    val isSavedFallback: Boolean = false,
    val detectedAtMs: Long = System.currentTimeMillis(),
    val isPreciseLocation: Boolean = true,
    val provider: String = "gps",
    val fixAgeMs: Long = 0L
)

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

        val fineLocationGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val coarseLocationGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val locationGranted = fineLocationGranted || coarseLocationGranted

        val microphoneGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        return SpecialPermissionsStatus(
            notificationsGranted = notificationsGranted,
            exactAlarmsGranted = exactAlarmsGranted,
            overlayGranted = overlayGranted,
            batteryUnrestricted = batteryUnrestricted,
            fullScreenIntentGranted = fullScreenIntentGranted,
            locationGranted = locationGranted,
            microphoneGranted = microphoneGranted,
            fineLocationGranted = fineLocationGranted,
            coarseLocationGranted = coarseLocationGranted
        )
    }

    fun isDeviceLocationEnabled(context: Context): Boolean {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return false
        return LocationManagerCompat.isLocationEnabled(lm)
    }

    fun openLocationSourceSettings(context: Context) {
        try {
            context.startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
        } catch (_: Exception) {
            openAppDetailsSettings(context)
        }
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

    fun isNotificationPolicyAccessGranted(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            context.getSystemService(NotificationManager::class.java)?.isNotificationPolicyAccessGranted ?: false
        } else {
            true
        }
    }

    fun openNotificationPolicySettings(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                context.startActivity(Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS))
                return
            } catch (_: Exception) {}
        }
        openAppDetailsSettings(context)
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
     * High-accuracy multi-tier GPS detection:
     * 1. Verifies location permission and device GPS toggle.
     * 2. Requests active PRIORITY_HIGH_ACCURACY fix via FusedLocationProviderClient (8s timeout).
     * 3. Falls back to native LocationManager active GPS/Network update (8s timeout) when Play Services is absent.
     * 4. Falls back to most recent/accurate lastKnownLocation.
     * 5. Enriches full address hierarchy (Country, Governorate, City, District, Neighborhood, Street)
     *    via Android Geocoder + online OpenStreetMap Nominatim + offline Haversine nearest-city DB.
     * 6. Always stores a backup in prefs.saveLastGpsResult() without silently overwriting active city on errors.
     */
    @SuppressLint("MissingPermission")
    suspend fun detectAndSaveGpsLocation(
        context: Context,
        prefs: NativePreferences,
        autoSave: Boolean = true
    ): Result<GpsLocationResult> {
        val status = checkPermissions(context)
        if (!status.locationGranted) {
            return Result.failure(IllegalStateException("يرجى منح صلاحية الموقع (GPS) أولًا — تم الإبقاء على موقعك الحالي دون تغيير"))
        }

        if (!isDeviceLocationEnabled(context)) {
            return Result.failure(IllegalStateException("خدمات الموقع (GPS) مغلقة في الهاتف، يرجى تشغيلها أولًا — تم الإبقاء على موقعك الحالي"))
        }

        val nowMs = System.currentTimeMillis()
        val fetched = fetchHighAccuracyLocation(context, status.fineLocationGranted)
            ?: return Result.failure(IllegalStateException("تعذر التقاط إشارة GPS حاليًا أو كانت الإشارة قديمة وضعيفة، تم الإبقاء على موقعك الحالي دون تغيير"))

        val candidate = LocationCandidate(
            latitude = fetched.latitude,
            longitude = fetched.longitude,
            accuracyMeters = if (fetched.hasAccuracy()) fetched.accuracy else Float.NaN,
            timestampMs = fetched.time,
            provider = fetched.provider ?: if (status.fineLocationGranted) "gps" else "network"
        )
        val validation = LocationFixValidator.validateCandidate(
            candidate = candidate,
            nowMs = nowMs,
            fineLocationGranted = status.fineLocationGranted
        )
        if (!validation.isValid) {
            return Result.failure(IllegalStateException(validation.rejectionReason.ifBlank {
                "إشارة الموقع غير صالحة أو قديمة، تم الإبقاء على موقعك الحالي دون تغيير"
            }))
        }
        val location = fetched

        val geocode = withTimeoutOrNull(3_500L) {
            withContext(Dispatchers.IO) {
                resolveAddressCompat(context, location.latitude, location.longitude)
            }
        }

        val osmDetails = withTimeoutOrNull(3_800L) {
            withContext(Dispatchers.IO) {
                reverseGeocodeOsm(location.latitude, location.longitude)
            }
        }

        val nearestPair = withContext(Dispatchers.IO) {
            NativeDataManager.findNearestCity(context, location.latitude, location.longitude)
        }

        val country = osmDetails?.country?.takeIf { it.isNotBlank() }
            ?: geocode?.countryName?.takeIf { it.isNotBlank() }
            ?: nearestPair?.takeIf { it.second <= 300.0 }?.first?.country
            ?: ""

        val countryCode = osmDetails?.countryCode?.takeIf { it.isNotBlank() }
            ?: geocode?.countryCode?.uppercase(Locale.US)?.takeIf { it.isNotBlank() }
            ?: nearestPair?.first?.countryCode
            ?: ""

        val governorate = osmDetails?.governorate?.takeIf { it.isNotBlank() }
            ?: geocode?.adminArea?.takeIf { it.isNotBlank() }
            ?: nearestPair?.takeIf { it.second <= 120.0 }?.first?.stateAr
            ?: ""

        val city = osmDetails?.city?.takeIf { it.isNotBlank() }
            ?: geocode?.locality?.takeIf { it.isNotBlank() }
            ?: geocode?.subAdminArea?.takeIf { it.isNotBlank() }
            ?: nearestPair?.takeIf { it.second <= 120.0 }?.first?.nameAr
            ?: ""

        val district = osmDetails?.district?.takeIf { it.isNotBlank() }
            ?: geocode?.subAdminArea?.takeIf { it.isNotBlank() && it != city }
            ?: ""

        val neighborhood = osmDetails?.neighborhood?.takeIf { it.isNotBlank() }
            ?: geocode?.subLocality?.takeIf { it.isNotBlank() }
            ?: ""

        val street = osmDetails?.street?.takeIf { it.isNotBlank() }
            ?: geocode?.thoroughfare?.takeIf { it.isNotBlank() }
            ?: ""

        val finalCityName = when {
            city.isNotBlank() && country.isNotBlank() -> "$city - $country"
            city.isNotBlank() -> city
            governorate.isNotBlank() && country.isNotBlank() -> "$governorate - $country"
            nearestPair != null -> "قرب ${nearestPair.first.nameAr} - ${nearestPair.first.country}"
            else -> String.format(Locale.US, "موقعي (%.3f, %.3f)", location.latitude, location.longitude)
        }

        val tzId = TimeZone.getDefault().id.ifEmpty {
            nearestPair?.first?.timezoneId ?: "Asia/Riyadh"
        }

        val resolvedCalcMethod = mapCountryCodeToCalcMethod(
            countryCode = countryCode,
            fallbackMethod = nearestPair?.first?.recommendedCalcMethod ?: prefs.calculationMethod
        )

        val accuracyMeters = if (location.hasAccuracy()) location.accuracy.roundToInt().coerceAtLeast(1) else 0
        val isPrecise = validation.precision == LocationPrecision.PRECISE
        val providerName = location.provider ?: if (status.fineLocationGranted) "gps" else "network"
        val result = GpsLocationResult(
            cityName = finalCityName,
            latitude = location.latitude,
            longitude = location.longitude,
            accuracyMeters = accuracyMeters,
            timezoneId = tzId,
            calcMethod = resolvedCalcMethod,
            country = country,
            countryCode = countryCode,
            governorate = governorate,
            city = city,
            district = district,
            neighborhood = neighborhood,
            street = street,
            isSavedFallback = false,
            detectedAtMs = nowMs,
            isPreciseLocation = isPrecise,
            provider = providerName,
            fixAgeMs = validation.ageMs
        )

        prefs.saveLastGpsResult(result)

        if (autoSave) {
            val hierarchy = listOf(country, governorate, city, district, neighborhood, street)
                .filter { it.isNotBlank() }
                .distinct()
                .joinToString(" • ")
            prefs.setGpsLocation(
                nameAr = finalCityName,
                lat = location.latitude,
                lng = location.longitude,
                timezoneId = tzId,
                sourceTag = "gps",
                hierarchyText = hierarchy,
                precisionTag = validation.precision.code,
                accuracyMeters = accuracyMeters,
                updatedAtMs = nowMs
            )
            prefs.calculationMethod = resolvedCalcMethod
        }

        return Result.success(result)
    }

    private data class OsmReverseAddress(
        val country: String = "",
        val countryCode: String = "",
        val governorate: String = "",
        val city: String = "",
        val district: String = "",
        val neighborhood: String = "",
        val street: String = ""
    )

    private fun reverseGeocodeOsm(lat: Double, lng: Double): OsmReverseAddress? = runCatching {
        val urlStr = String.format(
            Locale.US,
            "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=%.6f&lon=%.6f&zoom=18&addressdetails=1&accept-language=ar,en",
            lat,
            lng
        )
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            connectTimeout = 3_200
            readTimeout = 3_200
            setRequestProperty("User-Agent", "AlMoazenIslamicApp/2.2 (contact@almoazen.app)")
            setRequestProperty("Accept", "application/json")
        }
        val code = conn.responseCode
        val body = if (code in 200..299) {
            conn.inputStream?.bufferedReader()?.use { it.readText() }.orEmpty()
        } else {
            ""
        }
        conn.disconnect()
        if (body.isBlank()) return@runCatching null
        val root = JSONObject(body)
        val addr = root.optJSONObject("address") ?: return@runCatching null
        OsmReverseAddress(
            country = addr.optString("country", ""),
            countryCode = addr.optString("country_code", "").uppercase(Locale.US),
            governorate = addr.optString("state", "")
                .ifBlank { addr.optString("province", "") }
                .ifBlank { addr.optString("region", "") },
            city = addr.optString("city", "")
                .ifBlank { addr.optString("town", "") }
                .ifBlank { addr.optString("village", "") }
                .ifBlank { addr.optString("municipality", "") },
            district = addr.optString("city_district", "")
                .ifBlank { addr.optString("county", "") }
                .ifBlank { addr.optString("state_district", "") },
            neighborhood = addr.optString("neighbourhood", "")
                .ifBlank { addr.optString("suburb", "") }
                .ifBlank { addr.optString("quarter", "") }
                .ifBlank { addr.optString("residential", "") },
            street = addr.optString("road", "")
                .ifBlank { addr.optString("street", "") }
                .ifBlank { addr.optString("pedestrian", "") }
        )
    }.getOrNull()

    private fun mapCountryCodeToCalcMethod(countryCode: String?, fallbackMethod: String): String {
        val cc = countryCode?.uppercase(Locale.US) ?: return fallbackMethod
        return when (cc) {
            "EG", "SD", "LY" -> "egypt"
            "SA", "KW", "QA", "BH", "YE" -> "umm_al_qura"
            "AE", "OM" -> "dubai"
            "PK", "IN", "BD", "AF" -> "karachi"
            "US", "CA", "MX" -> "isna"
            else -> fallbackMethod
        }
    }

    @SuppressLint("MissingPermission")
    private suspend fun fetchHighAccuracyLocation(context: Context, fineGranted: Boolean): Location? {
        val nowMs = System.currentTimeMillis()
        val fusedPriority = if (fineGranted) {
            Priority.PRIORITY_HIGH_ACCURACY
        } else {
            Priority.PRIORITY_BALANCED_POWER_ACCURACY
        }
        // 1. Active FusedLocationProviderClient (8s timeout)
        val fused = withTimeoutOrNull(8_000L) {
            runCatching {
                val client = LocationServices.getFusedLocationProviderClient(context)
                suspendCancellableCoroutine<Location?> { cont ->
                    val cts = CancellationTokenSource()
                    cont.invokeOnCancellation { cts.cancel() }
                    client.getCurrentLocation(fusedPriority, cts.token)
                        .addOnSuccessListener { loc -> if (cont.isActive) cont.resume(loc) }
                        .addOnFailureListener { if (cont.isActive) cont.resume(null) }
                }
            }.getOrNull()
        }
        if (fused != null) {
            val fusedCand = LocationCandidate(
                latitude = fused.latitude,
                longitude = fused.longitude,
                accuracyMeters = if (fused.hasAccuracy()) fused.accuracy else Float.NaN,
                timestampMs = fused.time,
                provider = fused.provider ?: if (fineGranted) "fused_gps" else "fused_coarse"
            )
            if (LocationFixValidator.validateCandidate(fusedCand, nowMs, fineGranted, LocationFixValidator.MAX_LIVE_AGE_MS).isValid) {
                return fused
            }
        }

        // 2. Native Android LocationManager active GPS / Network fix (8s timeout)
        val activeNative = withTimeoutOrNull(8_000L) {
            requestSingleNativeLocation(context, fineGranted)
        }
        if (activeNative != null) {
            val nativeCand = LocationCandidate(
                latitude = activeNative.latitude,
                longitude = activeNative.longitude,
                accuracyMeters = if (activeNative.hasAccuracy()) activeNative.accuracy else Float.NaN,
                timestampMs = activeNative.time,
                provider = activeNative.provider ?: "network"
            )
            if (LocationFixValidator.validateCandidate(nativeCand, System.currentTimeMillis(), fineGranted, LocationFixValidator.MAX_CACHE_AGE_MS).isValid) {
                return activeNative
            }
        }

        // 3. Fallback: Best & freshest validated lastKnownLocation across all enabled providers
        return runCatching {
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
            val rawCandidates = mutableListOf<Pair<LocationCandidate, Location>>()
            val checkNow = System.currentTimeMillis()
            for (provider in lm.getProviders(true)) {
                val candidateLoc = lm.getLastKnownLocation(provider) ?: continue
                val cand = LocationCandidate(
                    latitude = candidateLoc.latitude,
                    longitude = candidateLoc.longitude,
                    accuracyMeters = if (candidateLoc.hasAccuracy()) candidateLoc.accuracy else Float.NaN,
                    timestampMs = candidateLoc.time,
                    provider = candidateLoc.provider ?: provider
                )
                rawCandidates.add(cand to candidateLoc)
            }
            val best = LocationFixValidator.selectBestCandidate(
                candidates = rawCandidates.map { it.first },
                nowMs = checkNow,
                fineLocationGranted = fineGranted,
                maxAgeMs = LocationFixValidator.MAX_CACHE_AGE_MS
            )?.first ?: return@runCatching null
            rawCandidates.firstOrNull { it.first === best }?.second
        }.getOrNull()
    }

    @SuppressLint("MissingPermission")
    private suspend fun requestSingleNativeLocation(context: Context, fineGranted: Boolean): Location? =
        suspendCancellableCoroutine { cont ->
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            if (lm == null) {
                cont.resume(null)
                return@suspendCancellableCoroutine
            }

            val allowedProviders = if (fineGranted) {
                listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            } else {
                listOf(LocationManager.NETWORK_PROVIDER)
            }
            val providers = allowedProviders
                .filter { runCatching { lm.isProviderEnabled(it) }.getOrDefault(false) }

            if (providers.isEmpty()) {
                cont.resume(null)
                return@suspendCancellableCoroutine
            }

            val listener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    runCatching { lm.removeUpdates(this) }
                    if (cont.isActive) cont.resume(location)
                }

                @Deprecated("Deprecated in Java")
                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }

            cont.invokeOnCancellation {
                runCatching { lm.removeUpdates(listener) }
            }

            try {
                for (p in providers) {
                    lm.requestLocationUpdates(p, 0L, 0f, listener, Looper.getMainLooper())
                }
            } catch (_: Exception) {
                runCatching { lm.removeUpdates(listener) }
                if (cont.isActive) cont.resume(null)
            }
        }

    @Suppress("DEPRECATION")
    private suspend fun resolveAddressCompat(context: Context, lat: Double, lng: Double): Address? {
        if (!Geocoder.isPresent()) return null
        val geocoder = Geocoder(context, Locale("ar"))
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            suspendCancellableCoroutine { cont ->
                try {
                    geocoder.getFromLocation(lat, lng, 1, object : Geocoder.GeocodeListener {
                        override fun onGeocode(addresses: MutableList<Address>) {
                            if (cont.isActive) cont.resume(addresses.firstOrNull())
                        }

                        override fun onError(errorMessage: String?) {
                            if (cont.isActive) cont.resume(null)
                        }
                    })
                } catch (_: Exception) {
                    if (cont.isActive) cont.resume(null)
                }
            }
        } else {
            runCatching { geocoder.getFromLocation(lat, lng, 1)?.firstOrNull() }.getOrNull()
        }
    }
}
