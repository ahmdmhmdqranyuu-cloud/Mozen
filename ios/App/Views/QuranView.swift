import SwiftUI

public struct QuranView: View {
    @State private var searchQuery: String = ""
    @ObservedObject var player = AudioPlayerManager.shared

    let surahs: [Surah] = [
        Surah(number: 1, nameArabic: "الفاتحة", englishName: "Al-Fatihah", englishTranslation: "The Opening", numberOfAyahs: 7, revelationType: "Meccan"),
        Surah(number: 2, nameArabic: "البقرة", englishName: "Al-Baqarah", englishTranslation: "The Cow", numberOfAyahs: 286, revelationType: "Medinan"),
        Surah(number: 3, nameArabic: "آل عمران", englishName: "Ali 'Imran", englishTranslation: "Family of Imran", numberOfAyahs: 200, revelationType: "Medinan"),
        Surah(number: 4, nameArabic: "النساء", englishName: "An-Nisa", englishTranslation: "The Women", numberOfAyahs: 176, revelationType: "Medinan"),
        Surah(number: 18, nameArabic: "الكهف", englishName: "Al-Kahf", englishTranslation: "The Cave", numberOfAyahs: 110, revelationType: "Meccan"),
        Surah(number: 36, nameArabic: "يس", englishName: "Ya-Sin", englishTranslation: "Ya-Sin", numberOfAyahs: 83, revelationType: "Meccan"),
        Surah(number: 55, nameArabic: "الرحمن", englishName: "Ar-Rahman", englishTranslation: "The Beneficent", numberOfAyahs: 78, revelationType: "Medinan"),
        Surah(number: 67, nameArabic: "الملك", englishName: "Al-Mulk", englishTranslation: "The Sovereignty", numberOfAyahs: 30, revelationType: "Meccan"),
        Surah(number: 112, nameArabic: "الإخلاص", englishName: "Al-Ikhlas", englishTranslation: "The Sincerity", numberOfAyahs: 4, revelationType: "Meccan"),
        Surah(number: 113, nameArabic: "الفلق", englishName: "Al-Falaq", englishTranslation: "The Daybreak", numberOfAyahs: 5, revelationType: "Meccan"),
        Surah(number: 114, nameArabic: "الناس", englishName: "An-Nas", englishTranslation: "Mankind", numberOfAyahs: 6, revelationType: "Meccan")
    ]

    public init() {}

    public var body: some View {
        VStack(spacing: 12) {
            Text("المصحف الشريف")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                .padding(.top, 10)

            ScrollView {
                LazyVStack(spacing: 10) {
                    ForEach(surahs) { surah in
                        HStack {
                            Button(action: {
                                let formatted = String(format: "%03d", surah.number)
                                if let url = URL(string: "https://server8.mp3quran.net/afs/\(formatted).mp3") {
                                    player.playAudio(url: url, title: "سورة \(surah.nameArabic)", subtitle: "الشيخ مشاري راشد العفاسي")
                                }
                            }) {
                                Image(systemName: "play.circle.fill")
                                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                                    .font(.system(size: 28))
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 4) {
                                Text("سورة \(surah.nameArabic)")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                                Text("\(surah.revelationType == "Meccan" ? "مكية" : "مدنية") • \(surah.numberOfAyahs) آيات")
                                    .font(.system(size: 12))
                                    .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                            }

                            Circle()
                                .fill(Color(red: 29/255, green: 77/255, blue: 62/255))
                                .frame(width: 32, height: 32)
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
                .padding(.horizontal, 16)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}
