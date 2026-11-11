import Foundation

public struct DailyPrayerTimes {
    public let fajrMinutes: Int
    public let sunriseMinutes: Int
    public let dhuhrMinutes: Int
    public let asrMinutes: Int
    public let maghribMinutes: Int
    public let ishaMinutes: Int

    public init(fajrMinutes: Int, sunriseMinutes: Int, dhuhrMinutes: Int, asrMinutes: Int, maghribMinutes: Int, ishaMinutes: Int) {
        self.fajrMinutes = fajrMinutes
        self.sunriseMinutes = sunriseMinutes
        self.dhuhrMinutes = dhuhrMinutes
        self.asrMinutes = asrMinutes
        self.maghribMinutes = maghribMinutes
        self.ishaMinutes = ishaMinutes
    }

    public var isChronologicallyValid: Bool {
        return fajrMinutes >= 0
            && fajrMinutes < sunriseMinutes
            && sunriseMinutes < dhuhrMinutes
            && dhuhrMinutes < asrMinutes
            && asrMinutes < maghribMinutes
            && maghribMinutes < ishaMinutes
            && ishaMinutes < 1440
    }
}

public class PrayerTimeCalculator {

    public static func calculateDailyPrayers(
        latitude: Double,
        longitude: Double,
        timezoneOffsetHours: Double,
        dayOfYear: Int,
        calculationMethod: String = "umm_al_qura",
        asrMethod: String = "standard"
    ) -> DailyPrayerTimes {
        let clampedDay = max(1, min(366, dayOfYear))

        let gamma = 2.0 * Double.pi * Double(clampedDay - 81) / 365.0
        let declinationDeg = 23.45 * sin(gamma)
        let declinationRad = declinationDeg * Double.pi / 180.0
        let latRad = latitude * Double.pi / 180.0

        let eqTimeMinutes = 9.87 * sin(2.0 * gamma) - 7.53 * cos(gamma) - 1.5 * sin(gamma)
        let solarNoonMinutes = 720.0 - (4.0 * longitude) - eqTimeMinutes + (timezoneOffsetHours * 60.0)
        let dhuhr = Int(round(solarNoonMinutes + 2.0))

        var fajrAngle = -18.5
        var ishaAngle = -17.5
        var ishaFixedInterval = false
        var ishaFixedMinutes = 90

        let method = calculationMethod.lowercased()
        if method.contains("egypt") {
            fajrAngle = -19.5
            ishaAngle = -17.5
        } else if method.contains("mwl") || method.contains("muslim_world_league") {
            fajrAngle = -18.0
            ishaAngle = -17.0
        } else if method.contains("isna") {
            fajrAngle = -15.0
            ishaAngle = -15.0
        } else if method.contains("karachi") {
            fajrAngle = -18.0
            ishaAngle = -18.0
        } else { // Umm al-Qura default
            fajrAngle = -18.5
            ishaFixedInterval = true
            ishaFixedMinutes = 90
        }

        // Sunrise & Sunset Angle
        let sunRiseSetAngle = -0.8333 * Double.pi / 180.0
        let cosH0 = (sin(sunRiseSetAngle) - sin(latRad) * sin(declinationRad)) / (cos(latRad) * cos(declinationRad))
        let clampedCosH0 = max(-1.0, min(1.0, cosH0))
        let h0Deg = acos(clampedCosH0) * 180.0 / Double.pi
        let halfDayMinutes = h0Deg * 4.0

        let sunrise = Int(round(solarNoonMinutes - halfDayMinutes))
        let maghrib = Int(round(solarNoonMinutes + halfDayMinutes + 2.0))

        // Fajr
        let fajrRad = fajrAngle * Double.pi / 180.0
        let cosHFajr = (sin(fajrRad) - sin(latRad) * sin(declinationRad)) / (cos(latRad) * cos(declinationRad))
        let hFajrDeg = acos(max(-1.0, min(1.0, cosHFajr))) * 180.0 / Double.pi
        let fajr = Int(round(solarNoonMinutes - (hFajrDeg * 4.0)))

        // Asr (Standard shadow = 1, Hanafi shadow = 2)
        let shadowRatio: Double = asrMethod.lowercased().contains("hanafi") ? 2.0 : 1.0
        let deltaLatDec = abs(latRad - declinationRad)
        let asrAltRad = atan(1.0 / (shadowRatio + tan(deltaLatDec)))
        let cosHAsr = (sin(asrAltRad) - sin(latRad) * sin(declinationRad)) / (cos(latRad) * cos(declinationRad))
        let hAsrDeg = acos(max(-1.0, min(1.0, cosHAsr))) * 180.0 / Double.pi
        let asr = Int(round(solarNoonMinutes + (hAsrDeg * 4.0)))

        // Isha
        let isha: Int
        if ishaFixedInterval {
            isha = maghrib + ishaFixedMinutes
        } else {
            let ishaRad = ishaAngle * Double.pi / 180.0
            let cosHIsha = (sin(ishaRad) - sin(latRad) * sin(declinationRad)) / (cos(latRad) * cos(declinationRad))
            let hIshaDeg = acos(max(-1.0, min(1.0, cosHIsha))) * 180.0 / Double.pi
            isha = Int(round(solarNoonMinutes + (hIshaDeg * 4.0)))
        }

        return DailyPrayerTimes(
            fajrMinutes: max(0, min(1439, fajr)),
            sunriseMinutes: max(0, min(1439, sunrise)),
            dhuhrMinutes: max(0, min(1439, dhuhr)),
            asrMinutes: max(0, min(1439, asr)),
            maghribMinutes: max(0, min(1439, maghrib)),
            ishaMinutes: max(0, min(1439, isha))
        )
    }

    public static func formatMinutesToHHmm(_ minutes: Int) -> String {
        let normalized = ((minutes % 1440) + 1440) % 1440
        let h = normalized / 60
        let m = normalized % 60
        return String(format: "%02d:%02d", h, m)
    }

    public static func determineNextPrayer(times: DailyPrayerTimes, currentMinutes: Int) -> (name: String, timeMinutes: Int, remainingMinutes: Int) {
        if currentMinutes < times.fajrMinutes {
            return ("الفجر", times.fajrMinutes, times.fajrMinutes - currentMinutes)
        } else if currentMinutes < times.dhuhrMinutes {
            return ("الظهر", times.dhuhrMinutes, times.dhuhrMinutes - currentMinutes)
        } else if currentMinutes < times.asrMinutes {
            return ("العصر", times.asrMinutes, times.asrMinutes - currentMinutes)
        } else if currentMinutes < times.maghribMinutes {
            return ("المغرب", times.maghribMinutes, times.maghribMinutes - currentMinutes)
        } else if currentMinutes < times.ishaMinutes {
            return ("العشاء", times.ishaMinutes, times.ishaMinutes - currentMinutes)
        } else {
            // Next is tomorrow's Fajr
            let rem = (1440 - currentMinutes) + times.fajrMinutes
            return ("الفجر", times.fajrMinutes, rem)
        }
    }
}
