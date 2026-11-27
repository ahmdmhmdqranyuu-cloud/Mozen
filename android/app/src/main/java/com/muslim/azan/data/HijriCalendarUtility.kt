package com.muslim.azan.data

import android.os.Build
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlin.math.floor

data class DateDisplaySnapshot(
    val hijriDay: Int,
    val hijriMonthIndex: Int,
    val hijriMonthNameAr: String,
    val hijriMonthNameEn: String,
    val hijriYear: Int,
    val weekdayAr: String,
    val weekdayEn: String,
    val hijriFormattedAr: String,
    val hijriFormattedEn: String,
    val gregorianFormattedAr: String,
    val gregorianFormattedEn: String
)

/**
 * Pure Kotlin Calendar Utility that computes accurate Hijri (Islamic) and Gregorian dates
 * using Android's ICU IslamicCalendar on API 24+ and a deterministic tabular arithmetic
 * fallback for JVM unit tests or legacy contexts.
 */
object HijriCalendarUtility {

    private val HIJRI_MONTHS_AR = arrayOf(
        "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    )

    private val HIJRI_MONTHS_EN = arrayOf(
        "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
        "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    )

    private val WEEKDAYS_AR = arrayOf(
        "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
    )

    private val WEEKDAYS_EN = arrayOf(
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    )

    fun calculateFromEpochMs(
        epochMs: Long = System.currentTimeMillis(),
        timezoneId: String = "",
        hijriOffsetDays: Int = 0
    ): DateDisplaySnapshot {
        val tz = if (timezoneId.isNotBlank()) TimeZone.getTimeZone(timezoneId) else TimeZone.getDefault()
        val cal = Calendar.getInstance(tz).apply { timeInMillis = epochMs }

        val gYear = cal.get(Calendar.YEAR)
        val gMonth1Based = cal.get(Calendar.MONTH) + 1
        val gDay = cal.get(Calendar.DAY_OF_MONTH)
        val dayOfWeekIdx = (cal.get(Calendar.DAY_OF_WEEK) - Calendar.SUNDAY).coerceIn(0, 6)

        val weekdayAr = WEEKDAYS_AR[dayOfWeekIdx]
        val weekdayEn = WEEKDAYS_EN[dayOfWeekIdx]

        val gregArFmt = SimpleDateFormat("d MMMM yyyy", Locale("ar")).apply { timeZone = tz }
        val gregEnFmt = SimpleDateFormat("MMM d, yyyy", Locale.US).apply { timeZone = tz }
        val gregAr = "$weekdayAr ${gregArFmt.format(Date(epochMs))} م"
        val gregEn = "$weekdayEn, ${gregEnFmt.format(Date(epochMs))}"

        val offsetMs = hijriOffsetDays.coerceIn(-3, 3) * 86_400_000L
        val icuResult = tryComputeWithAndroidIcu(epochMs + offsetMs, tz)
        val (hYear, hMonthIdx, hDay) = icuResult ?: gregorianToHijriTabular(
            gYear,
            gMonth1Based,
            gDay,
            hijriOffsetDays
        )

        val safeMonthIdx = hMonthIdx.coerceIn(0, 11)
        val monthAr = HIJRI_MONTHS_AR[safeMonthIdx]
        val monthEn = HIJRI_MONTHS_EN[safeMonthIdx]

        val hijriAr = "$weekdayAr $hDay $monthAr $hYear هـ"
        val hijriEn = "$hDay $monthEn $hYear AH"

        return DateDisplaySnapshot(
            hijriDay = hDay,
            hijriMonthIndex = safeMonthIdx,
            hijriMonthNameAr = monthAr,
            hijriMonthNameEn = monthEn,
            hijriYear = hYear,
            weekdayAr = weekdayAr,
            weekdayEn = weekdayEn,
            hijriFormattedAr = hijriAr,
            hijriFormattedEn = hijriEn,
            gregorianFormattedAr = gregAr,
            gregorianFormattedEn = gregEn
        )
    }

    private fun tryComputeWithAndroidIcu(adjustedEpochMs: Long, tz: TimeZone): Triple<Int, Int, Int>? {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val icuTz = android.icu.util.TimeZone.getTimeZone(tz.id)
                val islamicCal = android.icu.util.IslamicCalendar(icuTz, Locale("ar", "SA"))
                islamicCal.calculationType = android.icu.util.IslamicCalendar.CalculationType.ISLAMIC_UMALQURA
                islamicCal.timeInMillis = adjustedEpochMs
                val y = islamicCal.get(android.icu.util.IslamicCalendar.YEAR)
                val m = islamicCal.get(android.icu.util.IslamicCalendar.MONTH).coerceIn(0, 11)
                val d = islamicCal.get(android.icu.util.IslamicCalendar.DAY_OF_MONTH).coerceIn(1, 30)
                if (y > 1300) Triple(y, m, d) else null
            } else {
                null
            }
        } catch (_: Throwable) {
            null
        }
    }

    /**
     * Kuwaiti tabular algorithm (civil Islamic calendar) used on API < 24 and pure JVM tests.
     */
    internal fun gregorianToHijriTabular(
        year: Int,
        month1Based: Int,
        day: Int,
        hijriOffsetDays: Int = 0
    ): Triple<Int, Int, Int> {
        var m = month1Based
        var y = year
        if (m < 3) {
            y -= 1
            m += 12
        }
        val a = floor(y / 100.0).toInt()
        var b = 2 - a + floor(a / 4.0).toInt()
        if (y < 1583) b = 0
        if (y == 1582) {
            if (m > 10) b = -10
            if (m == 10) {
                b = 0
                if (day > 4) b = -10
            }
        }

        val jd = floor(365.25 * (y + 4716)).toInt() +
            floor(30.6001 * (m + 1)).toInt() +
            day + b - 1524 + hijriOffsetDays

        val iEpoch = 1948084
        val epochDay = jd - iEpoch
        val cyc = floor(epochDay / 10631.0).toInt()
        var rem = epochDay - 10631 * cyc
        val shift1 = 0.1335
        val j = floor((rem - shift1) / 354.36667).toInt()
        val hijriYear = 30 * cyc + j
        rem -= floor(j * 354.36667 + shift1).toInt()
        var hijriMonth1Based = floor((rem + 28.5001) / 29.5).toInt()
        if (hijriMonth1Based >= 13) hijriMonth1Based = 12
        if (hijriMonth1Based < 1) hijriMonth1Based = 1
        val hijriDay = (rem - floor(29.5001 * hijriMonth1Based - 29.0).toInt()).coerceIn(1, 30)

        return Triple(hijriYear, hijriMonth1Based - 1, hijriDay)
    }
}
