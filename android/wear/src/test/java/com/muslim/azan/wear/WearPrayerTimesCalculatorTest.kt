package com.muslim.azan.wear

import com.muslim.azan.wear.calc.AsrMethod
import com.muslim.azan.wear.calc.DstMode
import com.muslim.azan.wear.calc.HighLatitudeRule
import com.muslim.azan.wear.calc.PrayerKey
import com.muslim.azan.wear.calc.WearCityLocation
import com.muslim.azan.wear.calc.WearPrayerTimesCalculator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs

class WearPrayerTimesCalculatorTest {

    private val makkah = WearCityLocation("makkah", "مكة المكرمة", "السعودية", 21.4225, 39.8262, "Asia/Riyadh")
    private val cairo = WearCityLocation("cairo", "القاهرة", "مصر", 30.0444, 31.2357, "Africa/Cairo")
    private val oslo = WearCityLocation("oslo", "أوسلو", "النرويج", 59.9139, 10.7522, "Europe/Oslo")

    @Test
    fun makkahAndCairo_produceChronologicallyValidSevenPrayersMatchingWebFormula() {
        val makkahTimes = WearPrayerTimesCalculator.calculatePrayerTimes(
            city = makkah,
            year = 2026,
            month1to12 = 5,
            day = 15,
            methodId = "makkah"
        )
        assertEquals(7, makkahTimes.size)
        assertTrue("Makkah chronology must be strictly increasing", WearPrayerTimesCalculator.validatePrayerChronology(makkahTimes))

        val isha = makkahTimes.first { it.key == PrayerKey.ISHA }
        val maghrib = makkahTimes.first { it.key == PrayerKey.MAGHRIB }
        assertEquals(90.0, isha.minutesFromMidnight - maghrib.minutesFromMidnight, 0.01)

        val cairoTimes = WearPrayerTimesCalculator.calculatePrayerTimes(
            city = cairo,
            year = 2026,
            month1to12 = 5,
            day = 15,
            methodId = "egypt"
        )
        assertEquals(7, cairoTimes.size)
        assertTrue("Cairo chronology must be strictly increasing", WearPrayerTimesCalculator.validatePrayerChronology(cairoTimes))
    }

    @Test
    fun asrHanafi_isLaterThanAsrStandard() {
        val standard = WearPrayerTimesCalculator.calculatePrayerTimes(
            city = cairo,
            year = 2026,
            month1to12 = 5,
            day = 15,
            methodId = "egypt",
            asrMethod = AsrMethod.STANDARD
        ).first { it.key == PrayerKey.ASR }

        val hanafi = WearPrayerTimesCalculator.calculatePrayerTimes(
            city = cairo,
            year = 2026,
            month1to12 = 5,
            day = 15,
            methodId = "egypt",
            asrMethod = AsrMethod.HANAFI
        ).first { it.key == PrayerKey.ASR }

        assertTrue("Hanafi Asr must be significantly later than Standard Asr", hanafi.minutesFromMidnight > standard.minutesFromMidnight + 25.0)
    }

    @Test
    fun osloSummerSolstice_preservesChronologyAcrossAllFourHighLatitudeRules() {
        HighLatitudeRule.entries.forEach { rule ->
            val times = WearPrayerTimesCalculator.calculatePrayerTimes(
                city = oslo,
                year = 2026,
                month1to12 = 6,
                day = 21,
                methodId = "mwl",
                highLatitudeRule = rule
            )
            assertEquals(7, times.size)
            assertTrue("Oslo chronology failed for rule=$rule", WearPrayerTimesCalculator.validatePrayerChronology(times))
        }
    }

    @Test
    fun dstMode_summerShiftsTimesByOneHourComparedToWinter() {
        val winter = WearPrayerTimesCalculator.calculatePrayerTimes(
            city = cairo,
            year = 2026,
            month1to12 = 1,
            day = 15,
            methodId = "egypt",
            dstModeOverride = DstMode.WINTER
        ).first { it.key == PrayerKey.DHUHR }

        val summer = WearPrayerTimesCalculator.calculatePrayerTimes(
            city = cairo,
            year = 2026,
            month1to12 = 1,
            day = 15,
            methodId = "egypt",
            dstModeOverride = DstMode.SUMMER
        ).first { it.key == PrayerKey.DHUHR }

        assertEquals(60.0, summer.minutesFromMidnight - winter.minutesFromMidnight, 0.01)
    }

    @Test
    fun qiblaAndNightThirds_matchExpectedGeodeticAndNightDurations() {
        val qiblaCairo = WearPrayerTimesCalculator.calculateQiblaDirection(cairo.latitude, cairo.longitude)
        assertTrue("Cairo Qibla angle should be around 136° SE (was ${qiblaCairo.angle})", qiblaCairo.angle in 132..140)
        assertTrue("Cairo distance to Makkah ~1285 km (was ${qiblaCairo.distanceKm})", abs(qiblaCairo.distanceKm - 1285) < 40)

        val night = WearPrayerTimesCalculator.calculateNightThirds(
            city = makkah,
            year = 2026,
            month1to12 = 5,
            day = 15,
            methodId = "makkah"
        )
        assertTrue(night.durationMs > 8L * 3600L * 1000L)
        assertTrue(night.firstThirdEndMs < night.midnightMs)
        assertTrue(night.midnightMs < night.lastThirdStartMs)
    }

    @Test
    fun nextPrayerInfo_handlesMidnightRolloverToTomorrowsFajr() {
        val times = WearPrayerTimesCalculator.calculatePrayerTimes(
            city = makkah,
            year = 2026,
            month1to12 = 5,
            day = 15,
            methodId = "makkah"
        )
        val afterIshaMs = times.last().timestampMs + 30L * 60L * 1000L
        val info = WearPrayerTimesCalculator.getNextPrayerInfo(times, afterIshaMs)
        assertNotNull(info)
        assertEquals(PrayerKey.FAJR, info!!.nextPrayer.key)
        assertTrue(info.isNextDay)
    }
}
