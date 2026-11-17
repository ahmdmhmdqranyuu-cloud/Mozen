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

    @Test
    public void highLatitudeRules_produceValidChronologyInPolarAndSubPolarZones() {
        String[] rules = {"angle_based", "one_seventh", "middle_of_night", "safe_latitude"};
        // Oslo (59.9139 N, 10.7522 E) in midsummer (day 172)
        for (String rule : rules) {
            PrayerTimeCalculator.DailyPrayerTimes oslo = PrayerTimeCalculator.calculateDailyPrayers(
                    59.9139, 10.7522, 2.0, 172, "mwl", "standard", rule
            );
            assertTrue("Oslo must be chronologically valid for rule " + rule, oslo.isChronologicallyValid());
        }

        // Tromso (69.6492 N, 18.9553 E) polar summer (day 172) & polar winter (day 355)
        for (String rule : rules) {
            PrayerTimeCalculator.DailyPrayerTimes tromsoSummer = PrayerTimeCalculator.calculateDailyPrayers(
                    69.6492, 18.9553, 2.0, 172, "mwl", "standard", rule
            );
            PrayerTimeCalculator.DailyPrayerTimes tromsoWinter = PrayerTimeCalculator.calculateDailyPrayers(
                    69.6492, 18.9553, 1.0, 355, "mwl", "standard", rule
            );
            assertTrue("Tromso summer valid for " + rule, tromsoSummer.isChronologicallyValid());
            assertTrue("Tromso winter valid for " + rule, tromsoWinter.isChronologicallyValid());
        }

        // Southern hemisphere Ushuaia (-54.8019 S, -68.3030 W)
        PrayerTimeCalculator.DailyPrayerTimes ushuaia = PrayerTimeCalculator.calculateDailyPrayers(
                -54.8019, -68.3030, -3.0, 355, "mwl", "standard", "angle_based"
        );
        assertTrue("Ushuaia southern solstice valid", ushuaia.isChronologicallyValid());
    }

    @Test
    public void longitudeTimezoneFallback_andCoordinateSanitization_areBounded() {
        assertEquals(3.0, PrayerTimeCalculator.estimateTimezoneOffsetFromLongitude(39.8262), 0.01);
        assertEquals(-5.0, PrayerTimeCalculator.estimateTimezoneOffsetFromLongitude(-74.006), 0.01);
        assertEquals(9.0, PrayerTimeCalculator.estimateTimezoneOffsetFromLongitude(139.6917), 0.01);

        double resolvedCairo = PrayerTimeCalculator.resolveTimezoneOffsetHours("", 1_700_000_000_000L, 31.2357);
        assertEquals(2.0, resolvedCairo, 0.01);

        assertEquals(90.0, PrayerTimeCalculator.sanitizeLatitude(125.0), 0.001);
        assertEquals(-90.0, PrayerTimeCalculator.sanitizeLatitude(-110.0), 0.001);
        assertEquals(180.0, PrayerTimeCalculator.sanitizeLongitude(240.0), 0.001);
        assertEquals(-180.0, PrayerTimeCalculator.sanitizeLongitude(-220.0), 0.001);
    }
}
