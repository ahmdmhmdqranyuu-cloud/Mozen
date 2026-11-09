package com.muslim.azan;

import java.util.Locale;

/**
 * Core Prayer Time Calculation & Validation utility for Android native scheduling and JUnit verification.
 * Calculates solar coordinates, prayer times (in minutes from midnight and HH:mm format),
 * next prayer resolution, and Iqama countdown durations.
 */
public class PrayerTimeCalculator {

    public static class DailyPrayerTimes {
        public final int fajrMinutes;
        public final int sunriseMinutes;
        public final int dhuhrMinutes;
        public final int asrMinutes;
        public final int maghribMinutes;
        public final int ishaMinutes;

        public DailyPrayerTimes(
                int fajrMinutes,
                int sunriseMinutes,
                int dhuhrMinutes,
                int asrMinutes,
                int maghribMinutes,
                int ishaMinutes
        ) {
            this.fajrMinutes = fajrMinutes;
            this.sunriseMinutes = sunriseMinutes;
            this.dhuhrMinutes = dhuhrMinutes;
            this.asrMinutes = asrMinutes;
            this.maghribMinutes = maghribMinutes;
            this.ishaMinutes = ishaMinutes;
        }

        public boolean isChronologicallyValid() {
            return fajrMinutes >= 0
                    && fajrMinutes < sunriseMinutes
                    && sunriseMinutes < dhuhrMinutes
                    && dhuhrMinutes < asrMinutes
                    && asrMinutes < maghribMinutes
                    && maghribMinutes < ishaMinutes
                    && ishaMinutes < 24 * 60;
        }
    }

    /**
     * Calculates daily prayer times (in minutes from local midnight, 0..1439)
     * for a given latitude, longitude, timezone offset (in hours), and day of year (1..365).
     * Uses standard Umm al-Qura / MWL astronomical approximations.
     */
    public static DailyPrayerTimes calculateDailyPrayers(
            double latitude,
            double longitude,
            double timezoneOffsetHours,
            int dayOfYear
    ) {
        int clampedDay = Math.max(1, Math.min(366, dayOfYear));

        // Solar declination approximation in degrees
        double gamma = 2.0 * Math.PI * (clampedDay - 81) / 365.0;
        double declinationDeg = 23.45 * Math.sin(gamma);
        double declinationRad = Math.toRadians(declinationDeg);
        double latRad = Math.toRadians(latitude);

        // Equation of time in minutes
        double eqTimeMinutes = 9.87 * Math.sin(2.0 * gamma) - 7.53 * Math.cos(gamma) - 1.5 * Math.sin(gamma);

        // Solar noon (Dhuhr) in minutes from midnight
        double solarNoonMinutes = 720.0 - (4.0 * longitude) - eqTimeMinutes + (timezoneOffsetHours * 60.0);
        int dhuhr = (int) Math.round(solarNoonMinutes + 2.0); // 2 min safety margin after zenith

        // Hour angle helper in minutes for a given sun altitude angle below horizon
        int sunrise = (int) Math.round(solarNoonMinutes - computeHourAngleMinutes(latRad, declinationRad, -0.833));
        int maghrib = (int) Math.round(solarNoonMinutes + computeHourAngleMinutes(latRad, declinationRad, -0.833) + 2.0);
        int fajr = (int) Math.round(solarNoonMinutes - computeHourAngleMinutes(latRad, declinationRad, -18.5));
        int isha = (int) Math.round(solarNoonMinutes + computeHourAngleMinutes(latRad, declinationRad, -17.5));

        // Asr (Shafi'i shadow factor = 1)
        double zenithDiffRad = Math.abs(latRad - declinationRad);
        double asrAltitudeRad = Math.atan(1.0 / (1.0 + Math.tan(zenithDiffRad)));
        double asrAltitudeDeg = Math.toDegrees(asrAltitudeRad);
        int asr = (int) Math.round(solarNoonMinutes + computeHourAngleMinutes(latRad, declinationRad, asrAltitudeDeg));

        return new DailyPrayerTimes(fajr, sunrise, dhuhr, asr, maghrib, isha);
    }

    private static double computeHourAngleMinutes(double latRad, double decRad, double altitudeDeg) {
        double altRad = Math.toRadians(altitudeDeg);
        double numerator = Math.sin(altRad) - (Math.sin(latRad) * Math.sin(decRad));
        double denominator = Math.cos(latRad) * Math.cos(decRad);
        double cosH = Math.max(-1.0, Math.min(1.0, numerator / denominator));
        double hourAngleDeg = Math.toDegrees(Math.acos(cosH));
        return hourAngleDeg * 4.0; // 4 minutes per degree of rotation
    }

    /**
     * Formats minutes from midnight (e.g., 285) into 24-hour "HH:mm" format ("04:45").
     */
    public static String formatMinutesToHHmm(int totalMinutes) {
        int normalized = ((totalMinutes % 1440) + 1440) % 1440;
        int hours = normalized / 60;
        int mins = normalized % 60;
        return String.format(Locale.US, "%02d:%02d", hours, mins);
    }

    /**
     * Parses a "HH:mm" string into minutes from midnight (0..1439).
     */
    public static int parseHHmmToMinutes(String hhmm) {
        if (hhmm == null || !hhmm.contains(":")) {
            throw new IllegalArgumentException("Invalid time format: " + hhmm);
        }
        String clean = hhmm.trim().split("\\s+")[0];
        String[] parts = clean.split(":");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            throw new IllegalArgumentException("Out of range time: " + hhmm);
        }
        return hours * 60 + minutes;
    }

    /**
     * Returns the Arabic name of the next obligatory prayer given current time in minutes from midnight.
     */
    public static String determineNextPrayerName(DailyPrayerTimes times, int currentMinutesFromMidnight) {
        if (currentMinutesFromMidnight < times.fajrMinutes) return "الفجر";
        if (currentMinutesFromMidnight < times.dhuhrMinutes) return "الظهر";
        if (currentMinutesFromMidnight < times.asrMinutes) return "العصر";
        if (currentMinutesFromMidnight < times.maghribMinutes) return "المغرب";
        if (currentMinutesFromMidnight < times.ishaMinutes) return "العشاء";
        return "الفجر"; // After Isha, next obligatory prayer is tomorrow's Fajr
    }

    /**
     * Calculates remaining seconds in an Iqama countdown given elapsed seconds.
     */
    public static int calculateRemainingIqamaSeconds(int iqamaDurationMinutes, int elapsedSeconds) {
        int totalSeconds = Math.max(0, iqamaDurationMinutes) * 60;
        return Math.max(0, totalSeconds - Math.max(0, elapsedSeconds));
    }
}
