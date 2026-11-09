import Foundation
import UserNotifications

public class PrayerNotificationManager {
    public static let shared = PrayerNotificationManager()

    private init() {}

    public func schedulePrayerAlarm(
        prayerName: String,
        arabicName: String,
        hour: Int,
        minute: Int,
        soundName: String = "azan.caf"
    ) {
        let content = UNMutableNotificationContent()
        content.title = "حان الآن موعد أذان \(arabicName)"
        content.body = "«حَيَّ عَلَى الصَّلَاةِ، حَيَّ عَلَى الْفَلَاحِ» - تطبيق المؤذن"
        content.sound = UNNotificationSound(named: UNNotificationSoundName(soundName))
        content.categoryIdentifier = "PRAYER_ALARM_CATEGORY"

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(
            identifier: "prayer_\(prayerName.lowercased())",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling prayer notification for \(prayerName): \(error)")
            }
        }
    }

    public func cancelAllPrayerAlarms() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}
