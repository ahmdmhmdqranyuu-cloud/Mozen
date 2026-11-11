import SwiftUI

public struct QuranView: View {
    @State private var searchQuery: String = ""
    @ObservedObject var player = AudioPlayerManager.shared
    @Environment(\.presentationMode) var presentationMode
    @State private var selectedSurahToRead: Surah? = nil

    private let allSurahs: [Surah] = [
        Surah(number: 1, nameArabic: "الفاتحة", englishName: "Al-Fatihah", englishTranslation: "The Opening", numberOfAyahs: 7, revelationType: "Meccan"),
        Surah(number: 2, nameArabic: "البقرة", englishName: "Al-Baqarah", englishTranslation: "The Cow", numberOfAyahs: 286, revelationType: "Medinan"),
        Surah(number: 3, nameArabic: "آل عمران", englishName: "Ali 'Imran", englishTranslation: "Family of Imran", numberOfAyahs: 200, revelationType: "Medinan"),
        Surah(number: 4, nameArabic: "النساء", englishName: "An-Nisa", englishTranslation: "The Women", numberOfAyahs: 176, revelationType: "Medinan"),
        Surah(number: 5, nameArabic: "المائدة", englishName: "Al-Ma'idah", englishTranslation: "The Table Spread", numberOfAyahs: 120, revelationType: "Medinan"),
        Surah(number: 6, nameArabic: "الأنعام", englishName: "Al-An'am", englishTranslation: "The Cattle", numberOfAyahs: 165, revelationType: "Meccan"),
        Surah(number: 7, nameArabic: "الأعراف", englishName: "Al-A'raf", englishTranslation: "The Heights", numberOfAyahs: 206, revelationType: "Meccan"),
        Surah(number: 8, nameArabic: "الأنفال", englishName: "Al-Anfal", englishTranslation: "The Spoils of War", numberOfAyahs: 75, revelationType: "Medinan"),
        Surah(number: 9, nameArabic: "التوبة", englishName: "At-Tawbah", englishTranslation: "The Repentance", numberOfAyahs: 129, revelationType: "Medinan"),
        Surah(number: 10, nameArabic: "يونس", englishName: "Yunus", englishTranslation: "Jonah", numberOfAyahs: 109, revelationType: "Meccan"),
        Surah(number: 11, nameArabic: "هود", englishName: "Hud", englishTranslation: "Hud", numberOfAyahs: 123, revelationType: "Meccan"),
        Surah(number: 12, nameArabic: "يوسف", englishName: "Yusuf", englishTranslation: "Joseph", numberOfAyahs: 111, revelationType: "Meccan"),
        Surah(number: 13, nameArabic: "الرعد", englishName: "Ar-Ra'd", englishTranslation: "The Thunder", numberOfAyahs: 43, revelationType: "Medinan"),
        Surah(number: 14, nameArabic: "إبراهيم", englishName: "Ibrahim", englishTranslation: "Abraham", numberOfAyahs: 52, revelationType: "Meccan"),
        Surah(number: 15, nameArabic: "الحجر", englishName: "Al-Hijr", englishTranslation: "The Rocky Tract", numberOfAyahs: 99, revelationType: "Meccan"),
        Surah(number: 16, nameArabic: "النحل", englishName: "An-Nahl", englishTranslation: "The Bee", numberOfAyahs: 128, revelationType: "Meccan"),
        Surah(number: 17, nameArabic: "الإسراء", englishName: "Al-Isra", englishTranslation: "The Night Journey", numberOfAyahs: 111, revelationType: "Meccan"),
        Surah(number: 18, nameArabic: "الكهف", englishName: "Al-Kahf", englishTranslation: "The Cave", numberOfAyahs: 110, revelationType: "Meccan"),
        Surah(number: 19, nameArabic: "مريم", englishName: "Maryam", englishTranslation: "Mary", numberOfAyahs: 98, revelationType: "Meccan"),
        Surah(number: 20, nameArabic: "طه", englishName: "Ta-Ha", englishTranslation: "Ta-Ha", numberOfAyahs: 135, revelationType: "Meccan"),
        Surah(number: 21, nameArabic: "الأنبياء", englishName: "Al-Anbiya", englishTranslation: "The Prophets", numberOfAyahs: 112, revelationType: "Meccan"),
        Surah(number: 22, nameArabic: "الحج", englishName: "Al-Hajj", englishTranslation: "The Pilgrimage", numberOfAyahs: 78, revelationType: "Medinan"),
        Surah(number: 23, nameArabic: "المؤمنون", englishName: "Al-Mu'minun", englishTranslation: "The Believers", numberOfAyahs: 118, revelationType: "Meccan"),
        Surah(number: 24, nameArabic: "النور", englishName: "An-Nur", englishTranslation: "The Light", numberOfAyahs: 64, revelationType: "Medinan"),
        Surah(number: 25, nameArabic: "الفرقان", englishName: "Al-Furqan", englishTranslation: "The Criterion", numberOfAyahs: 77, revelationType: "Meccan"),
        Surah(number: 26, nameArabic: "الشعراء", englishName: "Ash-Shu'ara", englishTranslation: "The Poets", numberOfAyahs: 227, revelationType: "Meccan"),
        Surah(number: 27, nameArabic: "النمل", englishName: "An-Naml", englishTranslation: "The Ant", numberOfAyahs: 93, revelationType: "Meccan"),
        Surah(number: 28, nameArabic: "القصص", englishName: "Al-Qasas", englishTranslation: "The Stories", numberOfAyahs: 88, revelationType: "Meccan"),
        Surah(number: 29, nameArabic: "العنكبوت", englishName: "Al-'Ankabut", englishTranslation: "The Spider", numberOfAyahs: 69, revelationType: "Meccan"),
        Surah(number: 30, nameArabic: "الروم", englishName: "Ar-Rum", englishTranslation: "The Romans", numberOfAyahs: 60, revelationType: "Meccan"),
        Surah(number: 31, nameArabic: "لقمان", englishName: "Luqman", englishTranslation: "Luqman", numberOfAyahs: 34, revelationType: "Meccan"),
        Surah(number: 32, nameArabic: "السجدة", englishName: "As-Sajdah", englishTranslation: "The Prostration", numberOfAyahs: 30, revelationType: "Meccan"),
        Surah(number: 33, nameArabic: "الأحزاب", englishName: "Al-Ahzab", englishTranslation: "The Combined Forces", numberOfAyahs: 73, revelationType: "Medinan"),
        Surah(number: 34, nameArabic: "سبأ", englishName: "Saba", englishTranslation: "Sheba", numberOfAyahs: 54, revelationType: "Meccan"),
        Surah(number: 35, nameArabic: "فاطر", englishName: "Fatir", englishTranslation: "Originator", numberOfAyahs: 45, revelationType: "Meccan"),
        Surah(number: 36, nameArabic: "يس", englishName: "Ya-Sin", englishTranslation: "Ya-Sin", numberOfAyahs: 83, revelationType: "Meccan"),
        Surah(number: 37, nameArabic: "الصافات", englishName: "As-Saffat", englishTranslation: "Those Who Set The Ranks", numberOfAyahs: 182, revelationType: "Meccan"),
        Surah(number: 38, nameArabic: "ص", englishName: "Sad", englishTranslation: "The Letter Sad", numberOfAyahs: 88, revelationType: "Meccan"),
        Surah(number: 39, nameArabic: "الزمر", englishName: "Az-Zumar", englishTranslation: "The Troops", numberOfAyahs: 75, revelationType: "Meccan"),
        Surah(number: 40, nameArabic: "غافر", englishName: "Ghafir", englishTranslation: "The Forgiver", numberOfAyahs: 85, revelationType: "Meccan"),
        Surah(number: 41, nameArabic: "فصلت", englishName: "Fussilat", englishTranslation: "Explained In Detail", numberOfAyahs: 54, revelationType: "Meccan"),
        Surah(number: 42, nameArabic: "الشورى", englishName: "Ash-Shura", englishTranslation: "The Consultation", numberOfAyahs: 53, revelationType: "Meccan"),
        Surah(number: 43, nameArabic: "الزخرف", englishName: "Az-Zukhruf", englishTranslation: "The Ornaments of Gold", numberOfAyahs: 89, revelationType: "Meccan"),
        Surah(number: 44, nameArabic: "الدخان", englishName: "Ad-Dukhan", englishTranslation: "The Smoke", numberOfAyahs: 59, revelationType: "Meccan"),
        Surah(number: 45, nameArabic: "الجاثية", englishName: "Al-Jathiyah", englishTranslation: "The Crouching", numberOfAyahs: 37, revelationType: "Meccan"),
        Surah(number: 46, nameArabic: "الأحقاف", englishName: "Al-Ahqaf", englishTranslation: "The Wind-Curved Sandhills", numberOfAyahs: 35, revelationType: "Meccan"),
        Surah(number: 47, nameArabic: "محمد", englishName: "Muhammad", englishTranslation: "Muhammad", numberOfAyahs: 38, revelationType: "Medinan"),
        Surah(number: 48, nameArabic: "الفتح", englishName: "Al-Fath", englishTranslation: "The Victory", numberOfAyahs: 29, revelationType: "Medinan"),
        Surah(number: 49, nameArabic: "الحجرات", englishName: "Al-Hujurat", englishTranslation: "The Rooms", numberOfAyahs: 18, revelationType: "Medinan"),
        Surah(number: 50, nameArabic: "ق", englishName: "Qaf", englishTranslation: "The Letter Qaf", numberOfAyahs: 45, revelationType: "Meccan"),
        Surah(number: 51, nameArabic: "الذاريات", englishName: "Adh-Dhariyat", englishTranslation: "The Winnowing Winds", numberOfAyahs: 60, revelationType: "Meccan"),
        Surah(number: 52, nameArabic: "الطور", englishName: "At-Tur", englishTranslation: "The Mount", numberOfAyahs: 49, revelationType: "Meccan"),
        Surah(number: 53, nameArabic: "النجم", englishName: "An-Najm", englishTranslation: "The Star", numberOfAyahs: 62, revelationType: "Meccan"),
        Surah(number: 54, nameArabic: "القمر", englishName: "Al-Qamar", englishTranslation: "The Moon", numberOfAyahs: 55, revelationType: "Meccan"),
        Surah(number: 55, nameArabic: "الرحمن", englishName: "Ar-Rahman", englishTranslation: "The Beneficent", numberOfAyahs: 78, revelationType: "Medinan"),
        Surah(number: 56, nameArabic: "الواقعة", englishName: "Al-Waqi'ah", englishTranslation: "The Inevitable", numberOfAyahs: 96, revelationType: "Meccan"),
        Surah(number: 57, nameArabic: "الحديد", englishName: "Al-Hadid", englishTranslation: "The Iron", numberOfAyahs: 29, revelationType: "Medinan"),
        Surah(number: 58, nameArabic: "المجادلة", englishName: "Al-Mujadila", englishTranslation: "The Pleading Woman", numberOfAyahs: 22, revelationType: "Medinan"),
        Surah(number: 59, nameArabic: "الحشر", englishName: "Al-Hashr", englishTranslation: "The Exile", numberOfAyahs: 24, revelationType: "Medinan"),
        Surah(number: 60, nameArabic: "الممتحنة", englishName: "Al-Mumtahanah", englishTranslation: "She That Is To Be Examined", numberOfAyahs: 13, revelationType: "Medinan"),
        Surah(number: 61, nameArabic: "الصف", englishName: "As-Saff", englishTranslation: "The Ranks", numberOfAyahs: 14, revelationType: "Medinan"),
        Surah(number: 62, nameArabic: "الجمعة", englishName: "Al-Jumu'ah", englishTranslation: "The Congregation", numberOfAyahs: 11, revelationType: "Medinan"),
        Surah(number: 63, nameArabic: "المنافقون", englishName: "Al-Munafiqun", englishTranslation: "The Hypocrites", numberOfAyahs: 11, revelationType: "Medinan"),
        Surah(number: 64, nameArabic: "التغابن", englishName: "At-Taghabun", englishTranslation: "The Mutual Disillusion", numberOfAyahs: 18, revelationType: "Medinan"),
        Surah(number: 65, nameArabic: "الطلاق", englishName: "At-Talaq", englishTranslation: "The Divorce", numberOfAyahs: 12, revelationType: "Medinan"),
        Surah(number: 66, nameArabic: "التحريم", englishName: "At-Tahrim", englishTranslation: "The Prohibition", numberOfAyahs: 12, revelationType: "Medinan"),
        Surah(number: 67, nameArabic: "الملك", englishName: "Al-Mulk", englishTranslation: "The Sovereignty", numberOfAyahs: 30, revelationType: "Meccan"),
        Surah(number: 68, nameArabic: "القلم", englishName: "Al-Qalam", englishTranslation: "The Pen", numberOfAyahs: 52, revelationType: "Meccan"),
        Surah(number: 69, nameArabic: "الحاقة", englishName: "Al-Haqqah", englishTranslation: "The Reality", numberOfAyahs: 52, revelationType: "Meccan"),
        Surah(number: 70, nameArabic: "المعارج", englishName: "Al-Ma'arij", englishTranslation: "The Ascending Stairways", numberOfAyahs: 44, revelationType: "Meccan"),
        Surah(number: 71, nameArabic: "نوح", englishName: "Nuh", englishTranslation: "Noah", numberOfAyahs: 28, revelationType: "Meccan"),
        Surah(number: 72, nameArabic: "الجن", englishName: "Al-Jinn", englishTranslation: "The Jinn", numberOfAyahs: 28, revelationType: "Meccan"),
        Surah(number: 73, nameArabic: "المزمل", englishName: "Al-Muzzammil", englishTranslation: "The Enshrouded One", numberOfAyahs: 20, revelationType: "Meccan"),
        Surah(number: 74, nameArabic: "المدثر", englishName: "Al-Muddaththir", englishTranslation: "The Cloaked One", numberOfAyahs: 56, revelationType: "Meccan"),
        Surah(number: 75, nameArabic: "القيامة", englishName: "Al-Qiyamah", englishTranslation: "The Resurrection", numberOfAyahs: 40, revelationType: "Meccan"),
        Surah(number: 76, nameArabic: "الإنسان", englishName: "Al-Insan", englishTranslation: "The Man", numberOfAyahs: 31, revelationType: "Medinan"),
        Surah(number: 77, nameArabic: "المرسلات", englishName: "Al-Mursalat", englishTranslation: "The Emissaries", numberOfAyahs: 50, revelationType: "Meccan"),
        Surah(number: 78, nameArabic: "النبأ", englishName: "An-Naba", englishTranslation: "The Tidings", numberOfAyahs: 40, revelationType: "Meccan"),
        Surah(number: 79, nameArabic: "النازعات", englishName: "An-Nazi'at", englishTranslation: "Those Who Drag Forth", numberOfAyahs: 46, revelationType: "Meccan"),
        Surah(number: 80, nameArabic: "عبس", englishName: "'Abasa", englishTranslation: "He Frowned", numberOfAyahs: 42, revelationType: "Meccan"),
        Surah(number: 81, nameArabic: "التكوير", englishName: "At-Takwir", englishTranslation: "The Overthrowing", numberOfAyahs: 29, revelationType: "Meccan"),
        Surah(number: 82, nameArabic: "الانفطار", englishName: "Al-Infitar", englishTranslation: "The Cleaving", numberOfAyahs: 19, revelationType: "Meccan"),
        Surah(number: 83, nameArabic: "المطففين", englishName: "Al-Mutaffifin", englishTranslation: "The Defrauding", numberOfAyahs: 36, revelationType: "Meccan"),
        Surah(number: 84, nameArabic: "الانشقاق", englishName: "Al-Inshiqaq", englishTranslation: "The Splitting Asunder", numberOfAyahs: 25, revelationType: "Meccan"),
        Surah(number: 85, nameArabic: "البروج", englishName: "Al-Buruj", englishTranslation: "The Mansions of the Stars", numberOfAyahs: 22, revelationType: "Meccan"),
        Surah(number: 86, nameArabic: "الطارق", englishName: "At-Tariq", englishTranslation: "The Morning Star", numberOfAyahs: 17, revelationType: "Meccan"),
        Surah(number: 87, nameArabic: "الأعلى", englishName: "Al-A'la", englishTranslation: "The Most High", numberOfAyahs: 19, revelationType: "Meccan"),
        Surah(number: 88, nameArabic: "الغاشية", englishName: "Al-Ghashiyah", englishTranslation: "The Overwhelming", numberOfAyahs: 26, revelationType: "Meccan"),
        Surah(number: 89, nameArabic: "الفجر", englishName: "Al-Fajr", englishTranslation: "The Dawn", numberOfAyahs: 30, revelationType: "Meccan"),
        Surah(number: 90, nameArabic: "البلد", englishName: "Al-Balad", englishTranslation: "The City", numberOfAyahs: 20, revelationType: "Meccan"),
        Surah(number: 91, nameArabic: "الشمس", englishName: "Ash-Shams", englishTranslation: "The Sun", numberOfAyahs: 15, revelationType: "Meccan"),
        Surah(number: 92, nameArabic: "الليل", englishName: "Al-Layl", englishTranslation: "The Night", numberOfAyahs: 21, revelationType: "Meccan"),
        Surah(number: 93, nameArabic: "الضحى", englishName: "Ad-Duhaa", englishTranslation: "The Morning Hours", numberOfAyahs: 11, revelationType: "Meccan"),
        Surah(number: 94, nameArabic: "الشرح", englishName: "Ash-Sharh", englishTranslation: "The Relief", numberOfAyahs: 8, revelationType: "Meccan"),
        Surah(number: 95, nameArabic: "التين", englishName: "At-Tin", englishTranslation: "The Fig", numberOfAyahs: 8, revelationType: "Meccan"),
        Surah(number: 96, nameArabic: "العلق", englishName: "Al-'Alaq", englishTranslation: "The Clot", numberOfAyahs: 19, revelationType: "Meccan"),
        Surah(number: 97, nameArabic: "القدر", englishName: "Al-Qadr", englishTranslation: "The Power", numberOfAyahs: 5, revelationType: "Meccan"),
        Surah(number: 98, nameArabic: "البينة", englishName: "Al-Bayyinah", englishTranslation: "The Clear Proof", numberOfAyahs: 8, revelationType: "Medinan"),
        Surah(number: 99, nameArabic: "الزلزلة", englishName: "Az-Zalzalah", englishTranslation: "The Earthquake", numberOfAyahs: 8, revelationType: "Medinan"),
        Surah(number: 100, nameArabic: "العاديات", englishName: "Al-'Adiyat", englishTranslation: "The Courser", numberOfAyahs: 11, revelationType: "Meccan"),
        Surah(number: 101, nameArabic: "القارعة", englishName: "Al-Qari'ah", englishTranslation: "The Calamity", numberOfAyahs: 11, revelationType: "Meccan"),
        Surah(number: 102, nameArabic: "التكاثر", englishName: "At-Takathur", englishTranslation: "The Rivalry in World Increase", numberOfAyahs: 8, revelationType: "Meccan"),
        Surah(number: 103, nameArabic: "العصر", englishName: "Al-'Asr", englishTranslation: "The Declining Day", numberOfAyahs: 3, revelationType: "Meccan"),
        Surah(number: 104, nameArabic: "الهمزة", englishName: "Al-Humazah", englishTranslation: "The Traducer", numberOfAyahs: 9, revelationType: "Meccan"),
        Surah(number: 105, nameArabic: "الفيل", englishName: "Al-Fil", englishTranslation: "The Elephant", numberOfAyahs: 5, revelationType: "Meccan"),
        Surah(number: 106, nameArabic: "قريش", englishName: "Quraysh", englishTranslation: "Quraysh", numberOfAyahs: 4, revelationType: "Meccan"),
        Surah(number: 107, nameArabic: "الماعون", englishName: "Al-Ma'un", englishTranslation: "The Small Kindness", numberOfAyahs: 7, revelationType: "Meccan"),
        Surah(number: 108, nameArabic: "الكوثر", englishName: "Al-Kawthar", englishTranslation: "The Abundance", numberOfAyahs: 3, revelationType: "Meccan"),
        Surah(number: 109, nameArabic: "الكافرون", englishName: "Al-Kafirun", englishTranslation: "The Disbelievers", numberOfAyahs: 6, revelationType: "Meccan"),
        Surah(number: 110, nameArabic: "النصر", englishName: "An-Nasr", englishTranslation: "The Divine Support", numberOfAyahs: 3, revelationType: "Medinan"),
        Surah(number: 111, nameArabic: "المسد", englishName: "Al-Masad", englishTranslation: "The Palm Fiber", numberOfAyahs: 5, revelationType: "Meccan"),
        Surah(number: 112, nameArabic: "الإخلاص", englishName: "Al-Ikhlas", englishTranslation: "The Sincerity", numberOfAyahs: 4, revelationType: "Meccan"),
        Surah(number: 113, nameArabic: "الفلق", englishName: "Al-Falaq", englishTranslation: "The Daybreak", numberOfAyahs: 5, revelationType: "Meccan"),
        Surah(number: 114, nameArabic: "الناس", englishName: "An-Nas", englishTranslation: "Mankind", numberOfAyahs: 6, revelationType: "Meccan")
    ]

    public init() {}

    private var filteredSurahs: [Surah] {
        let q = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        if q.isEmpty { return allSurahs }
        return allSurahs.filter {
            $0.nameArabic.contains(q) ||
            $0.englishName.localizedCaseInsensitiveContains(q) ||
            "\($0.number)" == q
        }
    }

    public var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 18, weight: .bold))
                }
                Spacer()
                Text("المصحف الشريف (114 سورة)")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "book.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)

            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                TextField("ابحث باسم السورة أو رقمها...", text: $searchQuery)
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                    .multilineTextAlignment(.trailing)
            }
            .padding(12)
            .background(Color(red: 19/255, green: 56/255, blue: 45/255))
            .cornerRadius(14)
            .padding(.horizontal, 20)

            // 114 Surahs List
            ScrollView {
                LazyVStack(spacing: 10) {
                    ForEach(filteredSurahs) { surah in
                        HStack {
                            Button(action: {
                                let formatted = String(format: "%03d", surah.number)
                                if let url = URL(string: "https://server8.mp3quran.net/afs/\(formatted).mp3") {
                                    player.playAudio(url: url, title: "سورة \(surah.nameArabic)", subtitle: "الشيخ مشاري راشد العفاسي")
                                }
                            }) {
                                Image(systemName: "play.circle.fill")
                                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                                    .font(.system(size: 30))
                            }

                            Spacer()

                            Button(action: {
                                selectedSurahToRead = surah
                            }) {
                                VStack(alignment: .trailing, spacing: 4) {
                                    Text("سورة \(surah.nameArabic)")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                                    Text("\(surah.revelationType == "Meccan" ? "مكية" : "مدنية") • \(surah.numberOfAyahs) آيات • \(surah.englishName)")
                                        .font(.system(size: 12))
                                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                                }
                            }

                            Circle()
                                .fill(Color(red: 29/255, green: 77/255, blue: 62/255))
                                .frame(width: 34, height: 34)
                                .overlay(
                                    Text("\(surah.number)")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                                )
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                        .cornerRadius(14)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
        .sheet(item: $selectedSurahToRead) { surah in
            SurahReaderSheet(surah: surah)
        }
    }
}

struct SurahReaderSheet: View {
    let surah: Surah
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Text("إغلاق")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                }
                Spacer()
                Text("سورة \(surah.nameArabic)")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            ScrollView {
                VStack(spacing: 16) {
                    if surah.number != 9 {
                        Text("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                            .padding(.top, 10)
                    }

                    VStack(alignment: .trailing, spacing: 8) {
                        Text("﴿ \(surah.nameArabic) ﴾")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(Color(red: 110/255, green: 231/255, blue: 183/255))

                        Text("عدد الآيات: \(surah.numberOfAyahs) • نوع السورة: \(surah.revelationType == "Meccan" ? "مكية" : "مدنية")")
                            .font(.system(size: 13))
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                    .cornerRadius(14)

                    // Text of the Surah
                    Text(getSampleSurahText(surah: surah))
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                        .lineSpacing(12)
                        .multilineTextAlignment(.trailing)
                        .padding(20)
                        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                        .cornerRadius(18)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }

    private func getSampleSurahText(surah: Surah) -> String {
        switch surah.number {
        case 1:
            return "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿١﴾ الرَّحْمَٰنِ الرَّحِيمِ ﴿٢﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٣﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٤﴾ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٥﴾ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٦﴾"
        case 112:
            return "قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾"
        case 113:
            return "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾"
        case 114:
            return "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَٰهِ النَّاسِ ﴿٣﴾ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾"
        default:
            return "«إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ وَيُبَشِّرُ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا كَبِيرًا» [الإسراء: 9]\n\nيمكنك الاستماع للتلاوة العطرة المباركة بالكامل بصوت الشيخ مشاري راشد العفاسي عبر زر التشغيل في القائمة."
        }
    }
}
