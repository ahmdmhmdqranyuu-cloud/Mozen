package com.muslim.azan.data

import kotlin.math.abs

enum class LocationPrecision(val code: String, val arabicLabel: String) {
    PRECISE("precise", "موقع دقيق (GPS)"),
    APPROXIMATE("approximate", "موقع تقريبي"),
    MANUAL("manual", "تحديد يدوي / قائمة المدن")
}

data class LocationCandidate(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float,
    val timestampMs: Long,
    val provider: String = "gps"
)

data class LocationValidationOutcome(
    val isValid: Boolean,
    val precision: LocationPrecision,
    val ageMs: Long,
    val rejectionReason: String = ""
)

/**
 * Pure JVM-testable validator for GPS / Network location fixes.
 * Enforces coordinate sanity, maximum fix age, acceptable horizontal accuracy,
 * and distinguishes Precise (fine GPS) vs Approximate (coarse/network) fixes.
 */
object LocationFixValidator {
    const val MAX_LIVE_AGE_MS: Long = 120_000L // 2 minutes
    const val MAX_CACHE_AGE_MS: Long = 15 * 60_000L // 15 minutes
    const val MAX_ACCEPTABLE_ACCURACY_M: Float = 2_000f
    const val PRECISE_ACCURACY_THRESHOLD_M: Float = 250f

    fun areCoordinatesValid(lat: Double, lng: Double): Boolean {
        if (lat.isNaN() || lng.isNaN() || lat.isInfinite() || lng.isInfinite()) return false
        if (lat !in -90.0..90.0 || lng !in -180.0..180.0) return false
        if (abs(lat) < 1e-4 && abs(lng) < 1e-4) return false
        return true
    }

    fun classifyPrecision(
        fineLocationGranted: Boolean,
        provider: String,
        accuracyMeters: Float
    ): LocationPrecision {
        if (!fineLocationGranted) {
            return LocationPrecision.APPROXIMATE
        }
        val normalizedProvider = provider.lowercase()
        val hasMeasuredAccuracy = accuracyMeters > 0f && !accuracyMeters.isNaN() && !accuracyMeters.isInfinite()
        if (hasMeasuredAccuracy && accuracyMeters <= PRECISE_ACCURACY_THRESHOLD_M) {
            return LocationPrecision.PRECISE
        }
        if (normalizedProvider == "gps" && (!hasMeasuredAccuracy || accuracyMeters <= 400f)) {
            return LocationPrecision.PRECISE
        }
        return LocationPrecision.APPROXIMATE
    }

    fun validateCandidate(
        candidate: LocationCandidate,
        nowMs: Long,
        fineLocationGranted: Boolean,
        maxAgeMs: Long = MAX_CACHE_AGE_MS,
        maxAccuracyMeters: Float = MAX_ACCEPTABLE_ACCURACY_M
    ): LocationValidationOutcome {
        if (!areCoordinatesValid(candidate.latitude, candidate.longitude)) {
            return LocationValidationOutcome(
                isValid = false,
                precision = LocationPrecision.APPROXIMATE,
                ageMs = Long.MAX_VALUE,
                rejectionReason = "إحداثيات الموقع غير صالحة"
            )
        }

        val ageMs = if (candidate.timestampMs <= 0L) {
            Long.MAX_VALUE
        } else {
            (nowMs - candidate.timestampMs).coerceAtLeast(0L)
        }
        if (candidate.timestampMs <= 0L || ageMs > maxAgeMs) {
            return LocationValidationOutcome(
                isValid = false,
                precision = classifyPrecision(fineLocationGranted, candidate.provider, candidate.accuracyMeters),
                ageMs = ageMs,
                rejectionReason = "إشارة الموقع قديمة جدًا، يرجى إعادة التحديث في مكان مفتوح"
            )
        }

        val acc = candidate.accuracyMeters
        if (!acc.isNaN() && !acc.isInfinite() && acc > maxAccuracyMeters) {
            return LocationValidationOutcome(
                isValid = false,
                precision = LocationPrecision.APPROXIMATE,
                ageMs = ageMs,
                rejectionReason = "دقة إشارة الموقع ضعيفة جدًا (±${acc.toInt()} متر)"
            )
        }

        val precision = classifyPrecision(fineLocationGranted, candidate.provider, acc)
        return LocationValidationOutcome(
            isValid = true,
            precision = precision,
            ageMs = ageMs,
            rejectionReason = ""
        )
    }

    fun selectBestCandidate(
        candidates: List<LocationCandidate>,
        nowMs: Long,
        fineLocationGranted: Boolean,
        maxAgeMs: Long = MAX_CACHE_AGE_MS,
        maxAccuracyMeters: Float = MAX_ACCEPTABLE_ACCURACY_M
    ): Pair<LocationCandidate, LocationValidationOutcome>? {
        val validPairs = candidates.mapNotNull { cand ->
            val outcome = validateCandidate(cand, nowMs, fineLocationGranted, maxAgeMs, maxAccuracyMeters)
            if (outcome.isValid) cand to outcome else null
        }
        if (validPairs.isEmpty()) return null

        return validPairs.minWithOrNull { a, b ->
            val precCmp = precisionRank(a.second.precision).compareTo(precisionRank(b.second.precision))
            if (precCmp != 0) return@minWithOrNull precCmp

            val ageDiff = a.second.ageMs - b.second.ageMs
            if (abs(ageDiff) > 60_000L) {
                return@minWithOrNull ageDiff.compareTo(0L)
            }

            val accA = if (a.first.accuracyMeters > 0f) a.first.accuracyMeters else Float.MAX_VALUE
            val accB = if (b.first.accuracyMeters > 0f) b.first.accuracyMeters else Float.MAX_VALUE
            accA.compareTo(accB)
        }
    }

    private fun precisionRank(precision: LocationPrecision): Int = when (precision) {
        LocationPrecision.PRECISE -> 0
        LocationPrecision.APPROXIMATE -> 1
        LocationPrecision.MANUAL -> 2
    }
}
