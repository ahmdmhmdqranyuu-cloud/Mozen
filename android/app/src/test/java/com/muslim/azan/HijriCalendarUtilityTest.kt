package com.muslim.azan

import com.muslim.azan.data.HijriCalendarUtility
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class HijriCalendarUtilityTest {

    @Test
    fun calculateFromEpochMs_producesValidHijriAndGregorianStrings() {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Riyadh")).apply {
            set(2025, Calendar.MARCH, 1, 12, 0, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val snapshot = HijriCalendarUtility.calculateFromEpochMs(cal.timeInMillis, "Asia/Riyadh")
        assertTrue("Expected valid Hijri year >= 1446", snapshot.hijriYear >= 1446)
        assertTrue("Expected Hijri day in 1..30", snapshot.hijriDay in 1..30)
        assertTrue("Expected Hijri month index in 0..11", snapshot.hijriMonthIndex in 0..11)
        assertTrue(snapshot.hijriFormattedAr.contains("هـ"))
        assertTrue(snapshot.hijriFormattedEn.contains("AH"))
        assertTrue(snapshot.gregorianFormattedEn.contains("2025"))
    }

    @Test
    fun gregorianToHijriTabular_handlesOffsetDaysCleanly() {
        val base = HijriCalendarUtility.gregorianToHijriTabular(2025, 3, 15, 0)
        val plusOne = HijriCalendarUtility.gregorianToHijriTabular(2025, 3, 15, 1)
        val minusOne = HijriCalendarUtility.gregorianToHijriTabular(2025, 3, 15, -1)

        assertEquals(base.first, plusOne.first)
        assertEquals(base.first, minusOne.first)
        assertTrue(plusOne.third != base.third || plusOne.second != base.second)
        assertTrue(minusOne.third != base.third || minusOne.second != base.second)
    }
}
