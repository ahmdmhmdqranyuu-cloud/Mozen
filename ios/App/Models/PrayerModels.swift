import Foundation

public struct PrayerItem: Identifiable {
    public let id: String
    public let key: String
    public let arabicName: String
    public let timeHHmm: String
    public let isNext: BooleanLiteralType
    public let isPassed: BooleanLiteralType
    public var soundEnabled: Bool

    public init(id: String, key: String, arabicName: String, timeHHmm: String, isNext: Bool = false, isPassed: Bool = false, soundEnabled: Bool = true) {
        self.id = id
        self.key = key
        self.arabicName = arabicName
        self.timeHHmm = timeHHmm
        self.isNext = isNext
        self.isPassed = isPassed
        self.soundEnabled = soundEnabled
    }
}

public struct CityLocation: Identifiable, Codable {
    public let id: String
    public let nameAr: String
    public let nameEn: String
    public let country: String
    public let latitude: Double
    public let longitude: Double
    public let timezoneHours: Double

    public init(id: String, nameAr: String, nameEn: String, country: String, latitude: Double, longitude: Double, timezoneHours: Double) {
        self.id = id
        self.nameAr = nameAr
        self.nameEn = nameEn
        self.country = country
        self.latitude = latitude
        self.longitude = longitude
        self.timezoneHours = timezoneHours
    }
}
