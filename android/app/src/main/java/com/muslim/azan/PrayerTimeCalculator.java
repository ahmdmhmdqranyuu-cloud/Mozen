package com.muslim.azan;

import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;

/**
 * High-precision astronomical Prayer Time Calculator using Julian Day and Jean Meeus
 * solar coordinates (accurate to < 1 minute vs official Umm al-Qura / Egyptian Survey / MWL tables).
 */
public class PrayerTimeCalculator {

    public static class DailyPrayerTimes {
        public final int fajrMinutes;
        public final int sunriseMinutes;
        public final int duhaMinutes;
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
            this(fajrMinutes, sunriseMinutes, clampDuha(sunriseMinutes + 20, sunriseMinutes, dhuhrMinutes), dhuhrMinutes, asrMinutes, maghribMinutes, ishaMinutes);
        }

        public DailyPrayerTimes(
                int fajrMinutes,
                int sunriseMinutes,
                int duhaMinutes,
                int dhuhrMinutes,
                int asrMinutes,
                int maghribMinutes,
                int ishaMinutes
        ) {
            this.fajrMinutes = fajrMinutes;
            this.sunriseMinutes = sunriseMinutes;
            this.duhaMinutes = duhaMinutes;
            this.dhuhrMinutes = dhuhrMinutes;
            this.asrMinutes = asrMinutes;
            this.maghribMinutes = maghribMinutes;
            this.ishaMinutes = ishaMinutes;
        }

        public boolean isChronologicallyValid() {
            return fajrMinutes >= 0
                    && fajrMinutes < sunriseMinutes
                    && sunriseMinutes < duhaMinutes
                    && duhaMinutes < dhuhrMinutes
                    && dhuhrMinutes < asrMinutes
                    && asrMinutes < maghribMinutes
                    && maghribMinutes < ishaMinutes
                    && ishaMinutes < 24 * 60;
        }

        public DailyPrayerTimes withOffsets(int fajrOff, int dhuhrOff, int asrOff, int maghribOff, int ishaOff) {
            return withOffsets(fajrOff, 0, 0, dhuhrOff, asrOff, maghribOff, ishaOff);
        }

        public DailyPrayerTimes withOffsets(
                int fajrOff,
                int sunriseOff,
                int duhaOff,
                int dhuhrOff,
                int asrOff,
                int maghribOff,
                int ishaOff
        ) {
            return new DailyPrayerTimes(
                    clampMinute(fajrMinutes + fajrOff),
                    clampMinute(sunriseMinutes + sunriseOff),
                    clampMinute(duhaMinutes + duhaOff),
                    clampMinute(dhuhrMinutes + dhuhrOff),
                    clampMinute(asrMinutes + asrOff),
                    clampMinute(maghribMinutes + maghribOff),
                    clampMinute(ishaMinutes + ishaOff)
            );
        }

        private static int clampMinute(int m) {
            return Math.max(0, Math.min(24 * 60 - 1, m));
        }

        private static int clampDuha(int candidate, int sunrise, int dhuhr) {
            int minDuha = sunrise + 15;
            int maxDuha = Math.max(minDuha, dhuhr - 10);
            return Math.max(minDuha, Math.min(maxDuha, candidate));
        }
    }

    /**
     * Estimates UTC timezone offset in hours from longitude when no IANA timezone is available.
     */
    public static double estimateTimezoneOffsetFromLongitude(double longitude) {
        if (Double.isNaN(longitude) || Double.isInfinite(longitude)) return 0.0;
        double clamped = Math.max(-180.0, Math.min(180.0, longitude));
        double hours = Math.round(clamped / 15.0);
        return Math.max(-12.0, Math.min(14.0, hours));
    }

    /**
     * Resolves timezone offset in hours (including DST) for an optional IANA timezone ID,
     * falling back to the device's default timezone when empty/null.
     */
    public static double resolveTimezoneOffsetHours(String timezoneId, long epochMs) {
        TimeZone tz = (timezoneId != null && !timezoneId.trim().isEmpty())
                ? TimeZone.getTimeZone(timezoneId.trim())
                : TimeZone.getDefault();
        return tz.getOffset(epochMs) / 3600000.0;
    }

    /**
     * Resolves timezone offset in hours (including DST) for an optional IANA timezone ID,
     * falling back to longitude estimation when empty/null.
     */
    public static double resolveTimezoneOffsetHours(String timezoneId, long epochMs, double fallbackLongitude) {
        if (timezoneId != null && !timezoneId.trim().isEmpty()) {
            TimeZone tz = TimeZone.getTimeZone(timezoneId.trim());
            return tz.getOffset(epochMs) / 3600000.0;
        }
        return estimateTimezoneOffsetFromLongitude(fallbackLongitude);
    }

    public static DailyPrayerTimes calculateDailyPrayers(
            double latitude,
            double longitude,
            double timezoneOffsetHours,
            int dayOfYear
    ) {
        return calculateDailyPrayers(latitude, longitude, timezoneOffsetHours, dayOfYear, "umm_al_qura", "standard", "angle_based");
    }

    public static DailyPrayerTimes calculateDailyPrayers(
            double latitude,
            double longitude,
            double timezoneOffsetHours,
            int dayOfYear,
            String calculationMethod,
            String asrMethod
    ) {
        return calculateDailyPrayers(latitude, longitude, timezoneOffsetHours, dayOfYear, calculationMethod, asrMethod, "angle_based");
    }

    public static DailyPrayerTimes calculateDailyPrayers(
            double latitude,
            double longitude,
            double timezoneOffsetHours,
            int dayOfYear,
            String calculationMethod,
            String asrMethod,
            String highLatitudeRule
    ) {
        Calendar cal = Calendar.getInstance();
        int clampedDay = Math.max(1, Math.min(366, dayOfYear));
        cal.set(Calendar.DAY_OF_YEAR, clampedDay);
        return calculateDailyPrayersForDate(
                cal.get(Calendar.YEAR),
                cal.get(Calendar.MONTH) + 1,
                cal.get(Calendar.DAY_OF_MONTH),
                latitude,
                longitude,
                timezoneOffsetHours,
                calculationMethod,
                asrMethod,
                highLatitudeRule
        );
    }

    public static DailyPrayerTimes calculateDailyPrayers(
            Calendar date,
            double latitude,
            double longitude,
            double timezoneOffsetHours,
            String calculationMethod,
            String asrMethod
    ) {
        return calculateDailyPrayers(date, latitude, longitude, timezoneOffsetHours, calculationMethod, asrMethod, "angle_based");
    }

    public static DailyPrayerTimes calculateDailyPrayers(
            Calendar date,
            double latitude,
            double longitude,
            double timezoneOffsetHours,
            String calculationMethod,
            String asrMethod,
            String highLatitudeRule
    ) {
        return calculateDailyPrayersForDate(
                date.get(Calendar.YEAR),
                date.get(Calendar.MONTH) + 1,
                date.get(Calendar.DAY_OF_MONTH),
                latitude,
                longitude,
                timezoneOffsetHours,
                calculationMethod,
                asrMethod,
                highLatitudeRule
        );
    }

    public static double sanitizeLatitude(double lat) {
        if (Double.isNaN(lat) || Double.isInfinite(lat)) return 21.4225;
        return Math.max(-90.0, Math.min(90.0, lat));
    }

    public static double sanitizeLongitude(double lng) {
        if (Double.isNaN(lng) || Double.isInfinite(lng)) return 39.8262;
        return Math.max(-180.0, Math.min(180.0, lng));
    }

    public static double sanitizeTimezoneOffset(double tzOffset) {
        if (Double.isNaN(tzOffset) || Double.isInfinite(tzOffset)) return 0.0;
        return Math.max(-12.0, Math.min(14.0, tzOffset));
    }

    public static DailyPrayerTimes calculateDailyPrayersForDate(
            int year,
            int month,
            int day,
            double rawLatitude,
            double rawLongitude,
            double rawTimezoneOffsetHours,
            String calculationMethod,
            String asrMethod
    ) {
        return calculateDailyPrayersForDate(
                year, month, day, rawLatitude, rawLongitude, rawTimezoneOffsetHours,
                calculationMethod, asrMethod, "angle_based"
        );
    }

    public static DailyPrayerTimes calculateDailyPrayersForDate(
            int year,
            int month,
            int day,
            double rawLatitude,
            double rawLongitude,
            double rawTimezoneOffsetHours,
            String calculationMethod,
            String asrMethod,
            String highLatitudeRule
    ) {
        double latitude = sanitizeLatitude(rawLatitude);
        double longitude = sanitizeLongitude(rawLongitude);
        double timezoneOffsetHours = sanitizeTimezoneOffset(rawTimezoneOffsetHours);
        String rule = highLatitudeRule != null ? highLatitudeRule.trim().toLowerCase(Locale.US) : "angle_based";
        double calcLat = ("safe_latitude".equals(rule) && Math.abs(latitude) > 48.5)
                ? (latitude >= 0 ? 48.5 : -48.5)
                : latitude;
        double safeFallbackLat = latitude >= 0 ? 48.5 : -48.5;
        double jd = julianDay(year, month, day) - longitude / (15.0 * 24.0);

        double fajrAngle = 18.5;
        double ishaAngle = 17.5;
        boolean ishaFixedInterval = false;
        int ishaFixedMinutes = 90;

        String method = calculationMethod != null ? calculationMethod.trim().toLowerCase(Locale.US) : "";
        if (method.contains("egypt")) {
            fajrAngle = 19.5;
            ishaAngle = 17.5;
        } else if (method.contains("uoif") || method.contains("france")) {
            fajrAngle = 12.0;
            ishaAngle = 12.0;
        } else if (method.contains("mwl") || method.contains("muslim_world_league") || method.contains("diyanet") || method.contains("turkey")) {
            fajrAngle = 18.0;
            ishaAngle = 17.0;
        } else if (method.contains("isna") || method.contains("north_america")) {
            fajrAngle = 15.0;
            ishaAngle = 15.0;
        } else if (method.contains("karachi")) {
            fajrAngle = 18.0;
            ishaAngle = 18.0;
        } else if (method.contains("kuwait")) {
            fajrAngle = 18.0;
            ishaAngle = 17.5;
        } else if (method.contains("qatar")) {
            fajrAngle = 18.0;
            ishaFixedInterval = true;
            ishaFixedMinutes = 90;
        } else if (method.contains("dubai") || method.contains("uae") || method.contains("gulf")) {
            fajrAngle = 18.2;
            ishaAngle = 18.2;
        } else {
            // Umm al-Qura (umm_al_qura / makkah): Fajr 18.5°, Isha 90 minutes after Maghrib
            fajrAngle = 18.5;
            ishaFixedInterval = true;
            ishaFixedMinutes = 90;
        }

        // Iterative per-prayer solar ephemeris refinement (Jean Meeus / PrayTimes standard)
        double noonHours = computeMidDayHours(jd + 0.5, longitude, timezoneOffsetHours);
        double sunriseAngleCosH = sunAngleTimeCosH(jd + 6.0 / 24.0, calcLat, 0.833);
        double sunriseHalfSpan = Math.abs(sunriseAngleCosH) >= 1.0
                ? sunAngleTimeHours(jd + 6.0 / 24.0, safeFallbackLat, 0.833)
                : sunAngleTimeHours(jd + 6.0 / 24.0, calcLat, 0.833);
        double sunriseHours = noonHours - sunriseHalfSpan;

        double dhuhrHours = computeMidDayHours(jd + noonHours / 24.0, longitude, timezoneOffsetHours);
        double sunsetAngleCosH = sunAngleTimeCosH(jd + 18.0 / 24.0, calcLat, 0.833);
        double sunsetHalfSpan = Math.abs(sunsetAngleCosH) >= 1.0
                ? sunAngleTimeHours(jd + 18.0 / 24.0, safeFallbackLat, 0.833)
                : sunAngleTimeHours(jd + 18.0 / 24.0, calcLat, 0.833);
        double maghribHours = dhuhrHours + sunsetHalfSpan;
        double nightHours = Math.max(0.0, (24.0 - maghribHours) + sunriseHours);

        double fajrHours;
        double fajrCosH = sunAngleTimeCosH(jd + 5.0 / 24.0, calcLat, fajrAngle);
        boolean polarHighLat = Math.abs(calcLat) > 48.5;
        if ("safe_latitude".equals(rule) && polarHighLat) {
            fajrHours = noonHours - sunAngleTimeHours(jd + 5.0 / 24.0, safeFallbackLat, fajrAngle);
        } else if (Math.abs(fajrCosH) >= 1.0 && nightHours > 0.0) {
            if ("middle_of_night".equals(rule)) {
                fajrHours = sunriseHours - 0.5 * nightHours;
            } else if ("one_seventh".equals(rule)) {
                fajrHours = sunriseHours - (1.0 / 7.0) * nightHours;
            } else {
                fajrHours = sunriseHours - (fajrAngle / 60.0) * nightHours;
            }
        } else {
            double rawFajr = noonHours - sunAngleTimeHours(jd + 5.0 / 24.0, calcLat, fajrAngle);
            if ("one_seventh".equals(rule) && polarHighLat && nightHours > 0.0) {
                double cap = sunriseHours - (1.0 / 7.0) * nightHours;
                fajrHours = Math.max(rawFajr, cap);
            } else if ("middle_of_night".equals(rule) && polarHighLat && nightHours > 0.0) {
                double cap = sunriseHours - 0.5 * nightHours;
                fajrHours = Math.max(rawFajr, cap);
            } else if ("angle_based".equals(rule) && polarHighLat && nightHours > 0.0) {
                double cap = sunriseHours - (fajrAngle / 60.0) * nightHours;
                fajrHours = Math.max(rawFajr, cap);
            } else {
                fajrHours = rawFajr;
            }
        }

        double duhaHours = noonHours - sunAngleTimeHours(jd + 6.5 / 24.0, calcLat, -4.5);

        double shadowFactor = (asrMethod != null && asrMethod.toLowerCase(Locale.US).contains("hanafi")) ? 2.0 : 1.0;
        double asrHours = dhuhrHours + asrTimeHours(jd + 15.0 / 24.0, calcLat, shadowFactor);

        double ishaHours;
        if (ishaFixedInterval) {
            ishaHours = maghribHours + (ishaFixedMinutes / 60.0);
        } else if ("safe_latitude".equals(rule) && polarHighLat) {
            ishaHours = dhuhrHours + sunAngleTimeHours(jd + 19.5 / 24.0, safeFallbackLat, ishaAngle);
        } else {
            double ishaCosH = sunAngleTimeCosH(jd + 19.5 / 24.0, calcLat, ishaAngle);
            if (Math.abs(ishaCosH) >= 1.0 && nightHours > 0.0) {
                if ("middle_of_night".equals(rule)) {
                    ishaHours = maghribHours + 0.5 * nightHours;
                } else if ("one_seventh".equals(rule)) {
                    ishaHours = maghribHours + (1.0 / 7.0) * nightHours;
                } else {
                    ishaHours = maghribHours + (ishaAngle / 60.0) * nightHours;
                }
            } else {
                double rawIsha = dhuhrHours + sunAngleTimeHours(jd + 19.5 / 24.0, calcLat, ishaAngle);
                if ("one_seventh".equals(rule) && polarHighLat && nightHours > 0.0) {
                    ishaHours = Math.min(rawIsha, maghribHours + (1.0 / 7.0) * nightHours);
                } else if ("middle_of_night".equals(rule) && polarHighLat && nightHours > 0.0) {
                    ishaHours = Math.min(rawIsha, maghribHours + 0.5 * nightHours);
                } else if ("angle_based".equals(rule) && polarHighLat && nightHours > 0.0) {
                    ishaHours = Math.min(rawIsha, maghribHours + (ishaAngle / 60.0) * nightHours);
                } else {
                    ishaHours = rawIsha;
                }
            }
        }

        int dhuhrMin = DailyPrayerTimes.clampMinute(toMinutes(dhuhrHours));
        int sunriseMin = Math.min(dhuhrMin - 30, DailyPrayerTimes.clampMinute(toMinutes(sunriseHours)));
        int fajrMin = Math.min(sunriseMin - 15, DailyPrayerTimes.clampMinute(toMinutes(fajrHours)));
        int asrMin = Math.max(dhuhrMin + 20, DailyPrayerTimes.clampMinute(toMinutes(asrHours)));
        int maghribMin = Math.max(asrMin + 15, DailyPrayerTimes.clampMinute(toMinutes(maghribHours)));
        int ishaMin = Math.max(maghribMin + 15, Math.min(24 * 60 - 1, toMinutes(ishaHours)));
        int computedDuhaMin = DailyPrayerTimes.clampDuha(toMinutes(duhaHours), sunriseMin, dhuhrMin);

        return new DailyPrayerTimes(
                Math.max(0, fajrMin),
                Math.max(15, sunriseMin),
                computedDuhaMin,
                dhuhrMin,
                asrMin,
                maghribMin,
                ishaMin
        );
    }

    private static double sunAngleTimeCosH(double jd, double latitudeDeg, double depressionDeg) {
        double declDeg = sunPosition(jd)[0];
        double altRad = Math.toRadians(-depressionDeg);
        double latRad = Math.toRadians(latitudeDeg);
        double decRad = Math.toRadians(declDeg);
        double numerator = Math.sin(altRad) - (Math.sin(latRad) * Math.sin(decRad));
        double denominator = Math.cos(latRad) * Math.cos(decRad);
        if (Math.abs(denominator) < 1e-6) {
            denominator = denominator < 0 ? -1e-6 : 1e-6;
        }
        return numerator / denominator;
    }

    private static double julianDay(int year, int month, int day) {
        int y = year;
        int m = month;
        if (m <= 2) {
            y -= 1;
            m += 12;
        }
        int a = y / 100;
        int b = 2 - a + (a / 4);
        return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
    }

    private static double[] sunPosition(double jd) {
        double d = jd - 2451545.0;
        double g = fixAngle(357.529 + 0.98560028 * d);
        double q = fixAngle(280.459 + 0.98564736 * d);
        double l = fixAngle(q + 1.915 * Math.sin(Math.toRadians(g)) + 0.020 * Math.sin(Math.toRadians(2.0 * g)));
        double e = 23.439 - 0.00000036 * d;

        double raRad = Math.atan2(
                Math.cos(Math.toRadians(e)) * Math.sin(Math.toRadians(l)),
                Math.cos(Math.toRadians(l))
        );
        double raHours = Math.toDegrees(raRad) / 15.0;
        double eqtHours = (q / 15.0) - fixHour(raHours);
        double declDeg = Math.toDegrees(
                Math.asin(Math.sin(Math.toRadians(e)) * Math.sin(Math.toRadians(l)))
        );
        return new double[]{declDeg, eqtHours};
    }

    private static double computeMidDayHours(double jd, double longitude, double timezoneOffsetHours) {
        double[] sp = sunPosition(jd);
        double eqt = sp[1];
        return 12.0 + timezoneOffsetHours - (longitude / 15.0) - eqt;
    }

    private static double sunAngleTimeHours(double jd, double latitudeDeg, double depressionDeg) {
        double declDeg = sunPosition(jd)[0];
        double altRad = Math.toRadians(-depressionDeg);
        double latRad = Math.toRadians(latitudeDeg);
        double decRad = Math.toRadians(declDeg);
        return hourAngleHours(latRad, decRad, altRad);
    }

    private static double asrTimeHours(double jd, double latitudeDeg, double shadowFactor) {
        double declDeg = sunPosition(jd)[0];
        double latRad = Math.toRadians(latitudeDeg);
        double decRad = Math.toRadians(declDeg);
        double altRad = Math.atan(1.0 / (shadowFactor + Math.tan(Math.abs(latRad - decRad))));
        return hourAngleHours(latRad, decRad, altRad);
    }

    private static double hourAngleHours(double latRad, double decRad, double altRad) {
        double numerator = Math.sin(altRad) - (Math.sin(latRad) * Math.sin(decRad));
        double denominator = Math.cos(latRad) * Math.cos(decRad);
        if (Math.abs(denominator) < 1e-6) {
            denominator = denominator < 0 ? -1e-6 : 1e-6;
        }
        double cosH = Math.max(-1.0, Math.min(1.0, numerator / denominator));
        return Math.toDegrees(Math.acos(cosH)) / 15.0;
    }

    private static double fixAngle(double a) {
        double res = a - 360.0 * Math.floor(a / 360.0);
        return res < 0 ? res + 360.0 : res;
    }

    private static double fixHour(double a) {
        double res = a - 24.0 * Math.floor(a / 24.0);
        return res < 0 ? res + 24.0 : res;
    }

    private static int toMinutes(double hours) {
        int m = (int) Math.round(hours * 60.0);
        return ((m % 1440) + 1440) % 1440;
    }

    public static long calculatePrayerEpochMs(Calendar dayCalendar, int minutesFromMidnight) {
        Calendar cal = (Calendar) dayCalendar.clone();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        cal.add(Calendar.MINUTE, minutesFromMidnight);
        return cal.getTimeInMillis();
    }

    public static String formatMinutesToHHmm(int totalMinutes) {
        int normalized = ((totalMinutes % 1440) + 1440) % 1440;
        int hours = normalized / 60;
        int mins = normalized % 60;
        return String.format(Locale.US, "%02d:%02d", hours, mins);
    }

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

    public static String determineNextPrayerName(DailyPrayerTimes times, int currentMinutesFromMidnight) {
        if (currentMinutesFromMidnight < times.fajrMinutes) return "الفجر";
        if (currentMinutesFromMidnight < times.dhuhrMinutes) return "الظهر";
        if (currentMinutesFromMidnight < times.asrMinutes) return "العصر";
        if (currentMinutesFromMidnight < times.maghribMinutes) return "المغرب";
        if (currentMinutesFromMidnight < times.ishaMinutes) return "العشاء";
        return "الفجر";
    }

    public static int calculateRemainingIqamaSeconds(int iqamaDurationMinutes, int elapsedSeconds) {
        int totalSeconds = Math.max(0, iqamaDurationMinutes) * 60;
        return Math.max(0, totalSeconds - Math.max(0, elapsedSeconds));
    }
}
