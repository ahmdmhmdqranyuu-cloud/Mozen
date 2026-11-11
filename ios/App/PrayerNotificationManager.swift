import Foundation
import UserNotifications

public class PrayerNotificationManager {
    public static let shared = PrayerNotificationManager()

    private init() {}

    /// Schedules exact calendar notifications for each of the 5 prayers for the next 7 days,
    /// dynamically calculating the precise astronomical minutes for each individual date.
    public func scheduleUpcomingWeekPrayers(
        latitude: Double,
        longitude: Double,
        timezoneOffsetHours: Double,
        calculationMethod: String = "umm_al_qura",
        asrMethod: String = "standard",
        soundName: String = "makkah.mp3"
    ) {
        cancelAllPrayerAlarms()

        let calendar = Calendar.current
        let today = Date()

        for dayOffset in 0..<7 {
            guard let targetDate = calendar.date(byAdding: .day, value: dayOffset, to: today) else { continue }
            let dayOfYear = calendar.ordinality(of: .day, in: .year, for: targetDate) ?? 1

            let times = PrayerTimeCalculator.calculateDailyPrayers(
                latitude: latitude,
                longitude: longitude,
                timezoneOffsetHours: timezoneOffsetHours,
                dayOfYear: dayOfYear,
                calculationMethod: calculationMethod,
                asrMethod: asrMethod
            )

            let prayers: [(name: String, key: String, minutes: Int)] = [
                ("الفجر", "fajr", times.fajrMinutes),
                ("الظهر", "dhuhr", times.dhuhrMinutes),
                ("العصر", "asr", times.asrMinutes),
                ("المغرب", "maghrib", times.maghribMinutes),
                ("العشاء", "isha", times.ishaMinutes)
            ]

            let year = calendar.component(.year, from: targetDate)
            let month = calendar.component(.month, from: targetDate)
            let day = calendar.component(.day, from: targetDate)

            for prayer in prayers {
                var components = DateComponents()
                components.year = year
                components.month = month
                components.day = day
                components.hour = prayer.minutes / 60
                components.minute = prayer.minutes % 60
                components.second = 0

                guard let scheduledDate = calendar.date(from: components), scheduledDate > Date() else {
                    continue
                }

                let content = UNMutableNotificationContent()
                content.title = "حان الآن موعد أذان \(prayer.name)"
                content.body = "«حَيَّ عَلَى الصَّلَاةِ، حَيَّ عَلَى الْفَلَاحِ» • تطبيق المؤذن"
                content.sound = UNNotificationSound(named: UNNotificationSoundName(soundName))
                content.categoryIdentifier = "PRAYER_ALARM_CATEGORY"

                let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
                let requestId = "prayer_\(prayer.key)_\(year)_\(month)_\(day)"

                let request = UNNotificationRequest(identifier: requestId, content: content, trigger: trigger)
                UNUserNotificationCenter.current().add(request) { error in
                    if let error = error {
                        print("Failed scheduling notification for \(requestId): \(error)")
                    }
                }
            }
        }
    }

    public func cancelAllPrayerAlarms() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}
