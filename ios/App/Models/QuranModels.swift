import Foundation

public struct Surah: Identifiable, Codable {
    public var id: Int { number }
    public let number: Int
    public let nameArabic: String
    public let englishName: String
    public let englishTranslation: String
    public let numberOfAyahs: Int
    public let revelationType: String

    public init(number: Int, nameArabic: String, englishName: String, englishTranslation: String, numberOfAyahs: Int, revelationType: String) {
        self.number = number
        self.nameArabic = nameArabic
        self.englishName = englishName
        self.englishTranslation = englishTranslation
        self.numberOfAyahs = numberOfAyahs
        self.revelationType = revelationType
    }
}

public struct Ayah: Identifiable, Codable {
    public var id: Int { numberInSurah }
    public let number: Int
    public let numberInSurah: Int
    public let textArabic: String
    public let translation: String
    public let tafseer: String

    public init(number: Int, numberInSurah: Int, textArabic: String, translation: String = "", tafseer: String = "") {
        self.number = number
        self.numberInSurah = numberInSurah
        self.textArabic = textArabic
        self.translation = translation
        self.tafseer = tafseer
    }
}

public struct Reciter: Identifiable {
    public let id: String
    public let nameArabic: String
    public let subtext: String
    public let serverUrl: String

    public init(id: String, nameArabic: String, subtext: String, serverUrl: String) {
        self.id = id
        self.nameArabic = nameArabic
        self.subtext = subtext
        self.serverUrl = serverUrl
    }
}
