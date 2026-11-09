package com.muslim.azan;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

/**
 * Unit test suite verifying core prayer time calculations, chronological ordering,
 * next prayer resolution, and Iqama countdown logic during automated CI builds.
 */
public class PrayerTimeCalculatorTest {

    @Test
    public void makkahPrayerTimes_areChronologicallyValid() {
        // Makkah coordinates: 21.4225° N, 39.8262° E, UTC+3
        PrayerTimeCalculator.DailyPrayerTimes makkahTimes =
                PrayerTimeCalculator.calculateDailyPrayers(21.4225, 39.8262, 3.0, 100);

        assertTrue("Makkah prayer times must be chronologically ordered", makkahTimes.isChronologicallyValid());
        assertTrue("Fajr should be between 03:30 and 05:30", makkahTimes.fajrMinutes >= 210 && makkahTimes.fajrMinutes <= 330);
        assertTrue("Dhuhr should be around solar noon (11:30 - 12:45)", makkahTimes.dhuhrMinutes >= 690 && makkahTimes.dhuhrMinutes <= 765);
        assertTrue("Maghrib should be after Asr", makkahTimes.maghribMinutes > makkahTimes.asrMinutes);
        assertTrue("Isha should be after Maghrib", makkahTimes.ishaMinutes > makkahTimes.maghribMinutes);
    }

    @Test
    public void cairoPrayerTimes_areChronologicallyValidAcrossSeasons() {
        // Cairo coordinates: 30.0444° N, 31.2357° E, UTC+2
        PrayerTimeCalculator.DailyPrayerTimes winterTimes =
                PrayerTimeCalculator.calculateDailyPrayers(30.0444, 31.2357, 2.0, 15);
        PrayerTimeCalculator.DailyPrayerTimes summerTimes =
                PrayerTimeCalculator.calculateDailyPrayers(30.0444, 31.2357, 2.0, 172);

        assertTrue("Winter prayer times in Cairo must be valid", winterTimes.isChronologicallyValid());
        assertTrue("Summer prayer times in Cairo must be valid", summerTimes.isChronologicallyValid());
        assertTrue("Summer Maghrib is later than Winter Maghrib", summerTimes.maghribMinutes > winterTimes.maghribMinutes);
    }

    @Test
    public void formatAndParseHHmm_roundTripsAccurately() {
        assertEquals("04:45", PrayerTimeCalculator.formatMinutesToHHmm(285));
        assertEquals(285, PrayerTimeCalculator.parseHHmmToMinutes("04:45"));
        assertEquals("18:30", PrayerTimeCalculator.formatMinutesToHHmm(1110));
        assertEquals(1110, PrayerTimeCalculator.parseHHmmToMinutes("18:30"));
    }

    @Test
    public void determineNextPrayerName_returnsCorrectPrayerThroughoutDay() {
        PrayerTimeCalculator.DailyPrayerTimes sample = new PrayerTimeCalculator.DailyPrayerTimes(
                280, // Fajr 04:40
                360, // Sunrise 06:00
                730, // Dhuhr 12:10
                940, // Asr 15:40
                1100, // Maghrib 18:20
                1190  // Isha 19:50
        );

        assertEquals("الفجر", PrayerTimeCalculator.determineNextPrayerName(sample, 200));
        assertEquals("الظهر", PrayerTimeCalculator.determineNextPrayerName(sample, 300));
        assertEquals("العصر", PrayerTimeCalculator.determineNextPrayerName(sample, 800));
        assertEquals("المغرب", PrayerTimeCalculator.determineNextPrayerName(sample, 1000));
        assertEquals("العشاء", PrayerTimeCalculator.determineNextPrayerName(sample, 1150));
        assertEquals("الفجر", PrayerTimeCalculator.determineNextPrayerName(sample, 1250));
    }

    @Test
    public void calculateRemainingIqamaSeconds_handlesCountdownCorrectly() {
        assertEquals(900, PrayerTimeCalculator.calculateRemainingIqamaSeconds(15, 0));
        assertEquals(600, PrayerTimeCalculator.calculateRemainingIqamaSeconds(15, 300));
        assertEquals(0, PrayerTimeCalculator.calculateRemainingIqamaSeconds(15, 950));
    }
}
