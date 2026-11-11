import Foundation

public struct AzkarItem: Identifiable, Codable {
    public let id: String
    public let categoryId: String
    public let textArabic: String
    public let count: Int
    public let fadl: String
    public let source: String

    public init(id: String, categoryId: String, textArabic: String, count: Int, fadl: String = "", source: String = "") {
        self.id = id
        self.categoryId = categoryId
        self.textArabic = textArabic
        self.count = count
        self.fadl = fadl
        self.source = source
    }
}

public struct HadithItem: Identifiable {
    public let id: Int
    public let title: String
    public let hadithArabic: String
    public let narrator: String
    public let source: String
    public let sharh: String

    public init(id: Int, title: String, hadithArabic: String, narrator: String, source: String, sharh: String) {
        self.id = id
        self.title = title
        self.hadithArabic = hadithArabic
        self.narrator = narrator
        self.source = source
        self.sharh = sharh
    }
}

public struct DuaItem: Identifiable {
    public let id: String
    public let title: String
    public let arabicText: String
    public let source: String
    public let category: String
    public var isFavorite: Bool

    public init(id: String, title: String, arabicText: String, source: String, category: String, isFavorite: Bool = false) {
        self.id = id
        self.title = title
        self.arabicText = arabicText
        self.source = source
        self.category = category
        self.isFavorite = isFavorite
    }
}
