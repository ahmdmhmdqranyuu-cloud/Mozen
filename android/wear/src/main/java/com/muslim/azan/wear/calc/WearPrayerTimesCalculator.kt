package com.muslim.azan.wear.calc

import java.util.Calendar
import java.util.Locale
import java.util.SimpleTimeZone
import java.util.TimeZone
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.asin
import kotlin.math.atan
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.round
import kotlin.math.roundToInt
import kotlin.math.roundToLong
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

enum class PrayerKey(val id: String, val arabicName: String) {
    FAJR("fajr", "الفجر"),
    SUNRISE("sunrise", "الشروق"),
    DUHA("duha", "الضحى"),
    DHUHR("dhuhr", "الظهر"),
    ASR("asr", "العصر"),
    MAGHRIB("maghrib", "المغرب"),
    ISHA("isha", "العشاء");

    companion object {
        fun fromId(id: String): PrayerKey? = entries.firstOrNull { it.id == id }
    }
}

enum class AsrMethod(val id: String, val labelAr: String) {
    STANDARD("standard", "الجمهور (مثل)"),
    HANAFI("hanafi", "الحنفي (مثلان)");

    companion object {
        fun fromId(id: String?): AsrMethod =
            if (id.equals("hanafi", ignoreCase = true)) HANAFI else STANDARD
    }
}

enum class HighLatitudeRule(val id: String, val labelAr: String) {
    ANGLE_BASED("angle_based", "الزاوية ÷ 60"),
    ONE_SEVENTH("one_seventh", "سُبع الليل"),
    MIDDLE_OF_NIGHT("middle_of_night", "منتصف الليل"),
    SAFE_LATITUDE("safe_latitude", "الحد الآمن ±48°");

    companion object {
        fun fromId(id: String?): HighLatitudeRule =
            entries.firstOrNull { it.id.equals(id, ignoreCase = true) } ?: ANGLE_BASED
    }
}

enum class DstMode(val id: String, val labelAr: String) {
    AUTO("auto", "تلقائي"),
    SUMMER("summer", "صيفي (+1)"),
    WINTER("winter", "شتوي");

    companion object {
        fun fromId(id: String?): DstMode =
            entries.firstOrNull { it.id.equals(id, ignoreCase = true) } ?: AUTO
    }
}

data class WearCityLocation(
    val id: String,
    val nameAr: String,
    val countryAr: String,
    val latitude: Double,
    val longitude: Double,
    val timezone: String
)

data class CalculationMethodSpec(
    val id: String,
    val nameAr: String,
    val shortNameAr: String,
    val fajrAngle: Double,
    val ishaAngle: Double,
    val ishaInterval: Int
)

data class WearPrayerTime(
    val key: PrayerKey,
    val name: String,
    val time12: String,
    val time24: String,
    val minutesFromMidnight: Double,
    val isPassed: Boolean,
    val timestampMs: Long
)

data class DaylightSavingStatus(
    val isSystemSummerTime: Boolean,
    val standardWinterOffsetHours: Double,
    val currentSystemOffsetHours: Double,
    val effectiveOffsetHours: Double,
    val activeMode: DstMode,
    val timeZoneName: String
)

data class NextPrayerInfo(
    val nextPrayer: WearPrayerTime,
    val countdownStr: String,
    val secondsStr: String,
    val isNextDay: Boolean
)

data class QiblaDirection(
    val angle: Int,
    val distanceKm: Int
)

data class ActiveIqamaCountdown(
    val prayerKey: PrayerKey,
    val prayerName: String,
    val azanTimeStr: String,
    val iqamaTimeStr: String,
    val remainingSeconds: Int,
    val countdownStr: String,
    val progressPercent: Double
)

data class NightThirds(
    val maghribTimestampMs: Long,
    val fajrTimestampMs: Long,
    val firstThirdEndMs: Long,
    val midnightMs: Long,
    val lastThirdStartMs: Long,
    val durationMs: Long,
    val firstThirdEndFormatted: String,
    val midnightFormatted: String,
    val lastThirdStartFormatted: String
)

data class SolarEphemeris(
    val declinationDeg: Double,
    val eqOfTimeMin: Double
)

/**
 * Exact Kotlin port of `src/utils/prayerTimes.ts` so Wear OS watch faces and tiles
 * produce 1:1 matching astronomical prayer times, Qibla, Night Thirds, and Iqama countdowns.
 */
object WearPrayerTimesCalculator {

    val CALCULATION_METHODS: List<CalculationMethodSpec> = listOf(
        CalculationMethodSpec(
            id = "egypt",
            nameAr = "الهيئة المصرية العامة للمساحة",
            shortNameAr = "المصرية",
            fajrAngle = 19.5,
            ishaAngle = 17.5,
            ishaInterval = 0
        ),
        CalculationMethodSpec(
            id = "makkah",
            nameAr = "جامعة أم القرى - مكة المكرمة",
            shortNameAr = "أم القرى",
            fajrAngle = 18.5,
            ishaAngle = 0.0,
            ishaInterval = 90
        ),
        CalculationMethodSpec(
            id = "mwl",
            nameAr = "رابطة العالم الإسلامي",
            shortNameAr = "الرابطة",
            fajrAngle = 18.0,
            ishaAngle = 17.0,
            ishaInterval = 0
        ),
        CalculationMethodSpec(
            id = "karachi",
            nameAr = "جامعة العلوم الإسلامية بكراتشي",
            shortNameAr = "كراتشي",
            fajrAngle = 18.0,
            ishaAngle = 18.0,
            ishaInterval = 0
        ),
        CalculationMethodSpec(
            id = "isna",
            nameAr = "الجمعية الإسلامية بأمريكا الشمالية - ISNA",
            shortNameAr = "ISNA",
            fajrAngle = 15.0,
            ishaAngle = 15.0,
            ishaInterval = 0
        ),
        CalculationMethodSpec(
            id = "kuwait",
            nameAr = "وزارة الأوقاف بالكويت",
            shortNameAr = "الكويت",
            fajrAngle = 18.0,
            ishaAngle = 17.5,
            ishaInterval = 0
        ),
        CalculationMethodSpec(
            id = "diyanet",
            nameAr = "رئاسة الشؤون الدينية التركية - Diyanet",
            shortNameAr = "تركيا",
            fajrAngle = 18.0,
            ishaAngle = 17.0,
            ishaInterval = 0
        )
    )

    val DEFAULT_IQAMA_MINUTES: Map<PrayerKey, Int> = mapOf(
        PrayerKey.FAJR to 15,
        PrayerKey.SUNRISE to 0,
        PrayerKey.DUHA to 0,
        PrayerKey.DHUHR to 15,
        PrayerKey.ASR to 15,
        PrayerKey.MAGHRIB to 7,
        PrayerKey.ISHA to 15
    )

    private val KNOWN_TIMEZONE_IDS: Set<String> by lazy { TimeZone.getAvailableIDs().toHashSet() }

    fun resolveMethod(methodId: String?): CalculationMethodSpec =
        CALCULATION_METHODS.firstOrNull { it.id.equals(methodId, ignoreCase = true) }
            ?: CALCULATION_METHODS.first()

    /**
     * Matches `estimateTimezoneOffsetFromLongitude` in `src/utils/prayerTimes.ts`.
     */
    fun estimateTimezoneOffsetFromLongitude(longitude: Double): Double {
        if (!longitude.isFinite()) return 0.0
        val clamped = longitude.coerceIn(-180.0, 180.0)
        val hours = round(clamped / 15.0)
        return hours.coerceIn(-12.0, 14.0)
    }

    private fun resolveValidTimeZone(timeZone: String?): TimeZone? {
        val trimmed = timeZone?.trim().orEmpty()
        if (trimmed.isEmpty()) return null
        if (trimmed.equals("UTC", ignoreCase = true) || trimmed.equals("GMT", ignoreCase = true)) {
            return TimeZone.getTimeZone("UTC")
        }
        return if (KNOWN_TIMEZONE_IDS.contains(trimmed)) TimeZone.getTimeZone(trimmed) else null
    }

    /**
     * Matches `getTimeZoneOffsetHours` in `src/utils/prayerTimes.ts`.
     */
    fun getTimeZoneOffsetHours(
        epochMs: Long,
        timeZone: String? = null,
        fallbackLongitude: Double? = null
    ): Double {
        val explicitTz = resolveValidTimeZone(timeZone)
        if (explicitTz != null) {
            return explicitTz.getOffset(epochMs) / 3600000.0
        }
        if (fallbackLongitude != null && fallbackLongitude.isFinite()) {
            return estimateTimezoneOffsetFromLongitude(fallbackLongitude)
        }
        return TimeZone.getDefault().getOffset(epochMs) / 3600000.0
    }

    /**
     * Matches `detectDaylightSavingStatus` in `src/utils/prayerTimes.ts`.
     */
    fun detectDaylightSavingStatus(
        year: Int,
        month1to12: Int,
        day: Int,
        referenceEpochMs: Long = System.currentTimeMillis(),
        timeZone: String? = null,
        fallbackLongitude: Double? = null,
        activeMode: DstMode = DstMode.AUTO
    ): DaylightSavingStatus {
        val explicitTz = resolveValidTimeZone(timeZone)
        val hasExplicitTz = explicitTz != null
        val resolvedTzName = when {
            hasExplicitTz -> timeZone!!.trim()
            fallbackLongitude != null && fallbackLongitude.isFinite() -> {
                val est = estimateTimezoneOffsetFromLongitude(fallbackLongitude).roundToInt()
                "UTC${if (est >= 0) "+" else ""}$est"
            }
            else -> TimeZone.getDefault().id.ifBlank { "Africa/Cairo" }
        }

        val probeTz = explicitTz ?: TimeZone.getDefault()
        val janCal = Calendar.getInstance(probeTz).apply {
            set(year, Calendar.JANUARY, 15, 12, 0, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val julCal = Calendar.getInstance(probeTz).apply {
            set(year, Calendar.JULY, 15, 12, 0, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val curCal = Calendar.getInstance(probeTz).apply {
            set(year, month1to12 - 1, day, 12, 0, 0)
            set(Calendar.MILLISECOND, 0)
        }

        val janOffset = getTimeZoneOffsetHours(janCal.timeInMillis, if (hasExplicitTz) resolvedTzName else null, fallbackLongitude)
        val julOffset = getTimeZoneOffsetHours(julCal.timeInMillis, if (hasExplicitTz) resolvedTzName else null, fallbackLongitude)
        val currentOffset = getTimeZoneOffsetHours(
            if (curCal.timeInMillis > 0L) curCal.timeInMillis else referenceEpochMs,
            if (hasExplicitTz) resolvedTzName else null,
            fallbackLongitude
        )

        val standardWinterOffsetHours = min(janOffset, julOffset)
        val hasNaturalDst = abs(julOffset - janOffset) >= 0.5
        val isSystemSummerTime = hasNaturalDst && currentOffset > standardWinterOffsetHours + 0.25

        val effectiveOffsetHours = when (activeMode) {
            DstMode.SUMMER -> standardWinterOffsetHours + 1.0
            DstMode.WINTER -> standardWinterOffsetHours
            DstMode.AUTO -> currentOffset
        }

        return DaylightSavingStatus(
            isSystemSummerTime = isSystemSummerTime,
            standardWinterOffsetHours = standardWinterOffsetHours,
            currentSystemOffsetHours = currentOffset,
            effectiveOffsetHours = effectiveOffsetHours,
            activeMode = activeMode,
            timeZoneName = resolvedTzName
        )
    }

    /**
     * Matches `validateCityCoordinates` in `src/utils/prayerTimes.ts`.
     */
    fun validateCityCoordinates(latitude: Double, longitude: Double): Pair<Double, Double> {
        val lat = if (!latitude.isFinite()) 21.4225 else latitude.coerceIn(-90.0, 90.0)
        val lng = if (!longitude.isFinite()) 39.8262 else longitude.coerceIn(-180.0, 180.0)
        return lat to lng
    }

    /**
     * Matches `sanitizePrayerAdjustments` in `src/utils/prayerTimes.ts`.
     */
    fun sanitizePrayerAdjustments(adjustments: Map<PrayerKey, Int>?): Map<PrayerKey, Int> {
        if (adjustments.isNullOrEmpty()) return emptyMap()
        val sanitized = HashMap<PrayerKey, Int>(PrayerKey.entries.size)
        for (key in PrayerKey.entries) {
            val raw = adjustments[key] ?: 0
            if (raw != 0) {
                sanitized[key] = raw.coerceIn(-60, 60)
            }
        }
        return sanitized
    }

    /**
     * Matches `validatePrayerChronology` in `src/utils/prayerTimes.ts`.
     */
    fun validatePrayerChronology(prayers: List<WearPrayerTime>): Boolean {
        val byKey = prayers.associate { it.key to it.timestampMs }
        val fajr = byKey[PrayerKey.FAJR] ?: return false
        val sunrise = byKey[PrayerKey.SUNRISE] ?: return false
        val duha = byKey[PrayerKey.DUHA] ?: return false
        val dhuhr = byKey[PrayerKey.DHUHR] ?: return false
        val asr = byKey[PrayerKey.ASR] ?: return false
        val maghrib = byKey[PrayerKey.MAGHRIB] ?: return false
        val isha = byKey[PrayerKey.ISHA] ?: return false
        return fajr < sunrise &&
            sunrise <= duha &&
            duha < dhuhr &&
            dhuhr < asr &&
            asr < maghrib &&
            maghrib < isha
    }

    /**
     * Jean Meeus Julian Day & Solar Ephemeris — exact 1:1 port of `computeSolarEphemeris` in `prayerTimes.ts`.
     */
    fun computeSolarEphemeris(year: Int, month1to12: Int, day: Int): SolarEphemeris {
        var y = year
        var m = month1to12
        if (m <= 2) {
            y -= 1
            m += 12
        }
        val a = floor(y / 100.0)
        val b = 2.0 - a + floor(a / 4.0)
        val jd = floor(365.25 * (y + 4716)) + floor(30.6001 * (m + 1)) + day + b - 1524.5

        val d = jd - 2451545.0
        fun toRad(deg: Double) = (deg * PI) / 180.0
        fun toDeg(rad: Double) = (rad * 180.0) / PI
        fun normDeg(deg: Double): Double {
            val r = deg % 360.0
            return if (r < 0.0) r + 360.0 else r
        }

        val g = normDeg(357.529 + 0.98560028 * d)
        val q = normDeg(280.459 + 0.98564736 * d)
        val l = normDeg(q + 1.915 * sin(toRad(g)) + 0.02 * sin(toRad(2.0 * g)))
        val e = 23.439 - 0.00000036 * d

        val raRad = atan2(cos(toRad(e)) * sin(toRad(l)), cos(toRad(l)))
        val raDeg = normDeg(toDeg(raRad))
        val raHours = raDeg / 15.0

        val declinationDeg = toDeg(asin(sin(toRad(e)) * sin(toRad(l))))

        var eqOfTimeHours = q / 15.0 - raHours
        if (eqOfTimeHours > 12.0) eqOfTimeHours -= 24.0
        if (eqOfTimeHours < -12.0) eqOfTimeHours += 24.0

        return SolarEphemeris(
            declinationDeg = declinationDeg,
            eqOfTimeMin = eqOfTimeHours * 60.0
        )
    }

    private data class HourAngleResult(
        val deg: Double,
        val clampedLow: Boolean,
        val clampedHigh: Boolean
    )

    /**
     * Exact 1:1 port of `calculatePrayerTimes` from `src/utils/prayerTimes.ts`.
     */
    fun calculatePrayerTimes(
        city: WearCityLocation,
        year: Int,
        month1to12: Int,
        day: Int,
        methodId: String = "egypt",
        asrMethod: AsrMethod = AsrMethod.STANDARD,
        adjustments: Map<PrayerKey, Int> = emptyMap(),
        dstModeOverride: DstMode = DstMode.AUTO,
        highLatitudeRule: HighLatitudeRule = HighLatitudeRule.ANGLE_BASED,
        nowMs: Long = System.currentTimeMillis()
    ): List<WearPrayerTime> {
        val method = resolveMethod(methodId)
        val (rawLat, lng) = validateCityCoordinates(city.latitude, city.longitude)

        val dstStatus = detectDaylightSavingStatus(
            year = year,
            month1to12 = month1to12,
            day = day,
            referenceEpochMs = nowMs,
            timeZone = city.timezone,
            fallbackLongitude = lng,
            activeMode = dstModeOverride
        )

        val tzOffsetHours = dstStatus.effectiveOffsetHours
        val ephemeris = computeSolarEphemeris(year, month1to12, day)
        val declinationDeg = ephemeris.declinationDeg
        val eqOfTimeMin = ephemeris.eqOfTimeMin

        val useSafeLat = highLatitudeRule == HighLatitudeRule.SAFE_LATITUDE && abs(rawLat) > 48.5
        val effectiveLat = if (useSafeLat) {
            if (rawLat >= 0.0) 48.5 else -48.5
        } else {
            rawLat.coerceIn(-89.9, 89.9)
        }

        fun toRad(deg: Double) = (deg * PI) / 180.0
        fun toDeg(rad: Double) = (rad * 180.0) / PI

        val latRad = toRad(effectiveLat)
        val decRad = toRad(declinationDeg)

        val solarNoonMin = 720.0 - 4.0 * lng - eqOfTimeMin + tzOffsetHours * 60.0

        fun hourAngle(angleDeg: Double): HourAngleResult {
            val denom = cos(latRad) * cos(decRad)
            if (abs(denom) < 1e-9) {
                return HourAngleResult(90.0, clampedLow = true, clampedHigh = false)
            }
            val cosHA = (sin(toRad(-angleDeg)) - sin(latRad) * sin(decRad)) / denom
            if (cosHA > 1.0) return HourAngleResult(0.0, clampedLow = false, clampedHigh = true)
            if (cosHA < -1.0) return HourAngleResult(180.0, clampedLow = true, clampedHigh = false)
            return HourAngleResult(toDeg(acos(cosHA)), clampedLow = false, clampedHigh = false)
        }

        val sunHA = hourAngle(0.833)
        val sunriseMin: Double
        val sunsetMin: Double
        if (sunHA.clampedLow || sunHA.clampedHigh) {
            val fallbackLatRad = toRad(if (rawLat >= 0.0) 48.5 else -48.5)
            val fbDenom = cos(fallbackLatRad) * cos(decRad)
            val fbCos = ((sin(toRad(-0.833)) - sin(fallbackLatRad) * sin(decRad)) / fbDenom).coerceIn(-0.99, 0.99)
            val fbDeg = toDeg(acos(fbCos))
            sunriseMin = solarNoonMin - (fbDeg / 15.0) * 60.0
            sunsetMin = solarNoonMin + (fbDeg / 15.0) * 60.0
        } else {
            sunriseMin = solarNoonMin - (sunHA.deg / 15.0) * 60.0
            sunsetMin = solarNoonMin + (sunHA.deg / 15.0) * 60.0
        }
        val nightDurationMin = max(120.0, sunriseMin + 1440.0 - sunsetMin)

        val dhuhrMin = solarNoonMin + 2.0

        val duhaRawHA = hourAngle(-4.5).deg
        val duhaRawMin = solarNoonMin - (duhaRawHA / 15.0) * 60.0
        val duhaClampedMin = max(sunriseMin + 15.0, min(dhuhrMin - 10.0, duhaRawMin))

        fun computeNightPortion(angleDeg: Double, rule: HighLatitudeRule): Double =
            when (rule) {
                HighLatitudeRule.MIDDLE_OF_NIGHT -> nightDurationMin * 0.5
                HighLatitudeRule.ONE_SEVENTH -> nightDurationMin / 7.0
                HighLatitudeRule.ANGLE_BASED,
                HighLatitudeRule.SAFE_LATITUDE -> (angleDeg / 60.0) * nightDurationMin
            }

        // Fajr
        val fajrRes = hourAngle(method.fajrAngle)
        var fajrMin = solarNoonMin - (fajrRes.deg / 15.0) * 60.0
        if (fajrRes.clampedLow || fajrRes.clampedHigh || sunriseMin - fajrMin > computeNightPortion(method.fajrAngle, HighLatitudeRule.ANGLE_BASED) + 240.0) {
            if (fajrRes.clampedLow || fajrRes.clampedHigh) {
                fajrMin = sunriseMin - computeNightPortion(method.fajrAngle, highLatitudeRule)
            }
        }
        if (fajrMin >= sunriseMin - 10.0) {
            fajrMin = sunriseMin - computeNightPortion(method.fajrAngle, highLatitudeRule)
        }

        // Asr
        val shadowMultiplier = if (asrMethod == AsrMethod.HANAFI) 2.0 else 1.0
        val asrAlt = toDeg(atan(1.0 / (shadowMultiplier + tan(abs(latRad - decRad)))))
        val asrDenom = cos(latRad) * cos(decRad)
        val rawCosAsrHA = if (abs(asrDenom) < 1e-9) {
            0.5
        } else {
            (sin(toRad(asrAlt)) - sin(latRad) * sin(decRad)) / asrDenom
        }
        val asrHA = toDeg(acos(rawCosAsrHA.coerceIn(-0.999, 0.999)))
        var asrMin = solarNoonMin + (asrHA / 15.0) * 60.0
        if (asrMin <= dhuhrMin + 15.0) asrMin = dhuhrMin + 30.0
        if (asrMin >= sunsetMin - 10.0) asrMin = max(dhuhrMin + 20.0, sunsetMin - 20.0)

        // Isha
        var ishaMin: Double
        if (method.ishaInterval > 0) {
            ishaMin = sunsetMin + method.ishaInterval
        } else {
            val ishaRes = hourAngle(method.ishaAngle)
            ishaMin = if (ishaRes.clampedLow || ishaRes.clampedHigh) {
                sunsetMin + computeNightPortion(method.ishaAngle, highLatitudeRule)
            } else {
                solarNoonMin + (ishaRes.deg / 15.0) * 60.0
            }
        }
        if (ishaMin <= sunsetMin + 10.0) {
            val fallbackAngle = if (method.ishaAngle > 0.0) method.ishaAngle else 17.0
            ishaMin = sunsetMin + computeNightPortion(fallbackAngle, highLatitudeRule)
        }

        val adj = sanitizePrayerAdjustments(adjustments)
        val sunriseFinalMin = sunriseMin + (adj[PrayerKey.SUNRISE] ?: 0)
        val fajrFinalMin = min(sunriseFinalMin - 1.0, fajrMin + (adj[PrayerKey.FAJR] ?: 0))
        val dhuhrFinalMin = max(sunriseFinalMin + 20.0, dhuhrMin + (adj[PrayerKey.DHUHR] ?: 0))
        val duhaFinalMin = max(
            sunriseFinalMin + 1.0,
            min(dhuhrFinalMin - 1.0, duhaClampedMin + (adj[PrayerKey.DUHA] ?: 0))
        )
        val asrFinalMin = max(dhuhrFinalMin + 1.0, asrMin + (adj[PrayerKey.ASR] ?: 0))
        val maghribFinalMin = max(asrFinalMin + 1.0, sunsetMin + (adj[PrayerKey.MAGHRIB] ?: 0))
        val ishaFinalMin = max(maghribFinalMin + 1.0, ishaMin + (adj[PrayerKey.ISHA] ?: 0))

        val effectiveOffsetMs = (tzOffsetHours * 3600000.0).roundToInt()
        val fixedZone = SimpleTimeZone(effectiveOffsetMs, dstStatus.timeZoneName)
        val midnightCal = Calendar.getInstance(fixedZone).apply {
            set(year, month1to12 - 1, day, 0, 0, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val midnightMs = midnightCal.timeInMillis

        val rawItems = listOf(
            PrayerKey.FAJR to fajrFinalMin,
            PrayerKey.SUNRISE to sunriseFinalMin,
            PrayerKey.DUHA to duhaFinalMin,
            PrayerKey.DHUHR to dhuhrFinalMin,
            PrayerKey.ASR to asrFinalMin,
            PrayerKey.MAGHRIB to maghribFinalMin,
            PrayerKey.ISHA to ishaFinalMin
        )

        return rawItems.map { (key, mins) ->
            val tsMs = midnightMs + mins.roundToLong() * 60000L
            WearPrayerTime(
                key = key,
                name = key.arabicName,
                time12 = formatMinutes(mins, is12hr = true),
                time24 = formatMinutes(mins, is12hr = false),
                minutesFromMidnight = mins,
                isPassed = nowMs > tsMs,
                timestampMs = tsMs
            )
        }
    }

    fun calculatePrayerTimesForInstant(
        city: WearCityLocation,
        instantMs: Long = System.currentTimeMillis(),
        methodId: String = "egypt",
        asrMethod: AsrMethod = AsrMethod.STANDARD,
        adjustments: Map<PrayerKey, Int> = emptyMap(),
        dstModeOverride: DstMode = DstMode.AUTO,
        highLatitudeRule: HighLatitudeRule = HighLatitudeRule.ANGLE_BASED
    ): List<WearPrayerTime> {
        val cal = calendarForCity(city, instantMs, dstModeOverride)
        return calculatePrayerTimes(
            city = city,
            year = cal.get(Calendar.YEAR),
            month1to12 = cal.get(Calendar.MONTH) + 1,
            day = cal.get(Calendar.DAY_OF_MONTH),
            methodId = methodId,
            asrMethod = asrMethod,
            adjustments = adjustments,
            dstModeOverride = dstModeOverride,
            highLatitudeRule = highLatitudeRule,
            nowMs = instantMs
        )
    }

    fun calendarForCity(
        city: WearCityLocation,
        instantMs: Long,
        dstModeOverride: DstMode = DstMode.AUTO
    ): Calendar {
        val explicitTz = resolveValidTimeZone(city.timezone)
        val probeCal = Calendar.getInstance(explicitTz ?: TimeZone.getDefault()).apply {
            timeInMillis = instantMs
        }
        val status = detectDaylightSavingStatus(
            year = probeCal.get(Calendar.YEAR),
            month1to12 = probeCal.get(Calendar.MONTH) + 1,
            day = probeCal.get(Calendar.DAY_OF_MONTH),
            referenceEpochMs = instantMs,
            timeZone = city.timezone,
            fallbackLongitude = city.longitude,
            activeMode = dstModeOverride
        )
        val fixedZone = SimpleTimeZone((status.effectiveOffsetHours * 3600000.0).roundToInt(), status.timeZoneName)
        return Calendar.getInstance(fixedZone).apply {
            timeInMillis = instantMs
        }
    }

    fun formatMinutes(minutes: Double, is12hr: Boolean = true): String {
        var m = minutes.roundToInt()
        while (m < 0) m += 1440
        while (m >= 1440) m -= 1440
        val h = m / 60
        val min = m % 60
        return if (is12hr) {
            val h12 = if (h % 12 == 0) 12 else h % 12
            String.format(Locale.US, "%d:%02d", h12, min)
        } else {
            String.format(Locale.US, "%02d:%02d", h, min)
        }
    }

    /**
     * Exact 1:1 port of `getNextPrayerInfo` from `src/utils/prayerTimes.ts`.
     */
    fun getNextPrayerInfo(
        prayers: List<WearPrayerTime>,
        nowMs: Long = System.currentTimeMillis()
    ): NextPrayerInfo? {
        if (prayers.isEmpty()) return null
        val upcoming = prayers.firstOrNull { it.timestampMs > nowMs }
        if (upcoming == null) {
            val fajrToday = prayers.first()
            val fajrTomorrowMs = fajrToday.timestampMs + 24L * 3600L * 1000L
            val diffMs = max(0L, fajrTomorrowMs - nowMs)
            val hours = diffMs / 3600000L
            val minutes = (diffMs % 3600000L) / 60000L
            val seconds = (diffMs % 60000L) / 1000L
            return NextPrayerInfo(
                nextPrayer = fajrToday,
                countdownStr = String.format(Locale.US, "%02d:%02d", hours, minutes),
                secondsStr = String.format(Locale.US, "%02d", seconds),
                isNextDay = true
            )
        }
        val diffMs = max(0L, upcoming.timestampMs - nowMs)
        val hours = diffMs / 3600000L
        val minutes = (diffMs % 3600000L) / 60000L
        val seconds = (diffMs % 60000L) / 1000L
        return NextPrayerInfo(
            nextPrayer = upcoming,
            countdownStr = String.format(Locale.US, "%02d:%02d", hours, minutes),
            secondsStr = String.format(Locale.US, "%02d", seconds),
            isNextDay = false
        )
    }

    /**
     * Exact 1:1 port of `calculateQiblaDirection` from `src/utils/prayerTimes.ts`.
     */
    fun calculateQiblaDirection(latitude: Double, longitude: Double): QiblaDirection {
        val kaabaLat = 21.4225 * (PI / 180.0)
        val kaabaLng = 39.8262 * (PI / 180.0)
        val userLat = latitude * (PI / 180.0)
        val userLng = longitude * (PI / 180.0)

        val deltaLng = kaabaLng - userLng
        val y = sin(deltaLng)
        val x = cos(userLat) * tan(kaabaLat) - sin(userLat) * cos(deltaLng)
        val qiblaRad = atan2(y, x)
        var qiblaDeg = (qiblaRad * 180.0) / PI
        qiblaDeg = ((qiblaDeg % 360.0) + 360.0) % 360.0

        val earthRadiusKm = 6371.0
        val dLat = kaabaLat - userLat
        val dLng = kaabaLng - userLng
        val a = sin(dLat / 2.0) * sin(dLat / 2.0) +
            cos(userLat) * cos(kaabaLat) * sin(dLng / 2.0) * sin(dLng / 2.0)
        val c = 2.0 * atan2(sqrt(a), sqrt(max(0.0, 1.0 - a)))
        val distanceKm = round(earthRadiusKm * c).toInt()

        return QiblaDirection(
            angle = round(qiblaDeg).toInt(),
            distanceKm = distanceKm
        )
    }

    fun getActiveIqamaCountdown(
        prayers: List<WearPrayerTime>,
        intervals: Map<PrayerKey, Int> = DEFAULT_IQAMA_MINUTES,
        nowMs: Long = System.currentTimeMillis()
    ): ActiveIqamaCountdown? {
        for (prayer in prayers) {
            if (prayer.key == PrayerKey.SUNRISE || prayer.key == PrayerKey.DUHA) continue
            val intervalMinutes = intervals[prayer.key] ?: DEFAULT_IQAMA_MINUTES[prayer.key] ?: 15
            if (intervalMinutes <= 0) continue

            val azanMs = prayer.timestampMs
            val iqamaMs = azanMs + intervalMinutes * 60_000L
            if (nowMs in azanMs until iqamaMs) {
                val remainingMs = iqamaMs - nowMs
                val remainingSeconds = max(0, (remainingMs / 1000L).toInt())
                val m = remainingSeconds / 60
                val s = remainingSeconds % 60
                val totalSeconds = intervalMinutes * 60.0
                val progress = (((totalSeconds - remainingSeconds) / totalSeconds) * 100.0).coerceIn(0.0, 100.0)
                val iqamaTimeStr = formatMinutes(prayer.minutesFromMidnight + intervalMinutes, is12hr = true)

                return ActiveIqamaCountdown(
                    prayerKey = prayer.key,
                    prayerName = prayer.name,
                    azanTimeStr = prayer.time12,
                    iqamaTimeStr = iqamaTimeStr,
                    remainingSeconds = remainingSeconds,
                    countdownStr = String.format(Locale.US, "%02d:%02d", m, s),
                    progressPercent = progress
                )
            }
        }
        return null
    }

    /**
     * Exact 1:1 port of `calculateNightThirds` from `src/utils/prayerTimes.ts`.
     */
    fun calculateNightThirds(
        city: WearCityLocation,
        year: Int,
        month1to12: Int,
        day: Int,
        methodId: String = "egypt",
        asrMethod: AsrMethod = AsrMethod.STANDARD,
        adjustments: Map<PrayerKey, Int> = emptyMap(),
        dstModeOverride: DstMode = DstMode.AUTO,
        highLatitudeRule: HighLatitudeRule = HighLatitudeRule.ANGLE_BASED
    ): NightThirds {
        val todayPrayers = calculatePrayerTimes(
            city, year, month1to12, day, methodId, asrMethod, adjustments, dstModeOverride, highLatitudeRule
        )
        val maghrib = todayPrayers.firstOrNull { it.key == PrayerKey.MAGHRIB } ?: todayPrayers[todayPrayers.lastIndex - 1]

        val cal = Calendar.getInstance().apply {
            set(year, month1to12 - 1, day, 12, 0, 0)
            add(Calendar.DAY_OF_MONTH, 1)
        }
        val tomorrowPrayers = calculatePrayerTimes(
            city = city,
            year = cal.get(Calendar.YEAR),
            month1to12 = cal.get(Calendar.MONTH) + 1,
            day = cal.get(Calendar.DAY_OF_MONTH),
            methodId = methodId,
            asrMethod = asrMethod,
            adjustments = adjustments,
            dstModeOverride = dstModeOverride,
            highLatitudeRule = highLatitudeRule
        )
        val nextFajr = tomorrowPrayers.firstOrNull { it.key == PrayerKey.FAJR } ?: tomorrowPrayers.first()

        val nightDurationMs = nextFajr.timestampMs - maghrib.timestampMs
        val oneThirdMs = nightDurationMs / 3L
        val firstThirdEndMs = maghrib.timestampMs + oneThirdMs
        val midnightMs = maghrib.timestampMs + nightDurationMs / 2L
        val lastThirdStartMs = nextFajr.timestampMs - oneThirdMs

        val status = detectDaylightSavingStatus(
            year, month1to12, day, maghrib.timestampMs, city.timezone, city.longitude, dstModeOverride
        )
        val fixedZone = SimpleTimeZone((status.effectiveOffsetHours * 3600000.0).roundToInt(), status.timeZoneName)

        fun formatEpoch12(epochMs: Long): String {
            val c = Calendar.getInstance(fixedZone).apply { timeInMillis = epochMs }
            val h = c.get(Calendar.HOUR_OF_DAY)
            val m = c.get(Calendar.MINUTE)
            val h12 = if (h % 12 == 0) 12 else h % 12
            val ampm = if (h >= 12) "م" else "ص"
            return String.format(Locale.US, "%d:%02d %s", h12, m, ampm)
        }

        return NightThirds(
            maghribTimestampMs = maghrib.timestampMs,
            fajrTimestampMs = nextFajr.timestampMs,
            firstThirdEndMs = firstThirdEndMs,
            midnightMs = midnightMs,
            lastThirdStartMs = lastThirdStartMs,
            durationMs = nightDurationMs,
            firstThirdEndFormatted = formatEpoch12(firstThirdEndMs),
            midnightFormatted = formatEpoch12(midnightMs),
            lastThirdStartFormatted = formatEpoch12(lastThirdStartMs)
        )
    }
}
