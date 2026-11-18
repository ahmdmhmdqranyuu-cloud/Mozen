package com.muslim.azan

import com.muslim.azan.service.VolumeKeyStopPolicy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class VolumeKeyAndBootTimezoneTest {

    @Test
    fun volumeKeyStopPolicy_onlyStopsActiveAzanOrPrayerAlertsWhenEnabled() {
        assertTrue(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, true, "prayer_azan"))
        assertTrue(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, true, "iqama"))
        assertTrue(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, true, "prePrayerAlert"))
        assertTrue(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, true, "iftar"))
        assertTrue(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, true, "musaharati"))

        // Disabled preference -> never stop
        assertFalse(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(false, true, "prayer_azan"))

        // Service idle -> never consume key (allow normal volume adjustment)
        assertFalse(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, false, "prayer_azan"))

        // Non-prayer sections or empty -> should not silence via Azan policy
        assertFalse(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, true, ""))
        assertFalse(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, true, null))
        assertFalse(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, true, "morningAzkar"))
        assertFalse(VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(true, true, "salawat"))
    }

    @Test
    fun bootReceiver_salawatAutoWindowAlignsStartAndEndAcrossTimezoneMismatch() {
        val cityCal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Riyadh")).apply {
            set(2026, Calendar.MAY, 15, 0, 5, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val deviceCal = Calendar.getInstance(TimeZone.getTimeZone("America/Los_Angeles")).apply {
            timeInMillis = cityCal.timeInMillis
        }

        val window = BootReceiver.computeSalawatWindowForDay(
            cityCal,
            deviceCal,
            230, // 03:50 AM Fajr in city TZ
            15,
            true,
            "06:00",
            "23:59",
            "repeat"
        )
        assertEquals(2, window.size)
        assertTrue(
            "Salawat end (${window[1]}) must be well after start (${window[0]}) across timezone differences",
            window[1] > window[0] && (window[1] - window[0]) > 12L * 3600L * 1000L
        )
    }

    @Test
    fun highLatitudeCalculation_preservesChronologyAcrossRules() {
        val osloCal = Calendar.getInstance(TimeZone.getTimeZone("Europe/Oslo")).apply {
            set(2026, Calendar.JUNE, 21, 12, 0, 0)
        }
        val tzHours = PrayerTimeCalculator.resolveTimezoneOffsetHours("Europe/Oslo", osloCal.timeInMillis, 10.7522)
        listOf("angle_based", "one_seventh", "middle_of_night", "safe_latitude").forEach { rule ->
            val times = PrayerTimeCalculator.calculateDailyPrayers(
                osloCal,
                59.9139,
                10.7522,
                tzHours,
                "mwl",
                "standard",
                rule
            )
            assertTrue("Chronology invalid for rule=$rule", times.isChronologicallyValid())
        }
    }
}
