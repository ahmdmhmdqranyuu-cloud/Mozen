import SwiftUI

public struct AzkarView: View {
    @State private var selectedTab: Int = 0
    @State private var count1: Int = 1
    @State private var count2: Int = 3
    @State private var count3: Int = 3

    let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)

    public init() {}

    public var body: some View {
        VStack(spacing: 14) {
            Text("الأذكار وحصن المسلم")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                .padding(.top, 10)

            HStack(spacing: 12) {
                Button(action: { selectedTab = 0 }) {
                    Text("أذكار الصباح")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(selectedTab == 0 ? .white : Color(red: 156/255, green: 163/255, blue: 175/255))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(selectedTab == 0 ? Color(red: 217/255, green: 119/255, blue: 6/255) : Color(red: 19/255, green: 56/255, blue: 45/255))
                        .cornerRadius(12)
                }

                Button(action: { selectedTab = 1 }) {
                    Text("أذكار المساء")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(selectedTab == 1 ? .white : Color(red: 156/255, green: 163/255, blue: 175/255))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(selectedTab == 1 ? Color(red: 217/255, green: 119/255, blue: 6/255) : Color(red: 19/255, green: 56/255, blue: 45/255))
                        .cornerRadius(12)
                }
            }
            .padding(.horizontal, 16)

            ScrollView {
                VStack(spacing: 12) {
                    AzkarCard(
                        text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.",
                        count: count1,
                        target: 1,
                        onTap: {
                            if count1 > 0 {
                                count1 -= 1
                                feedbackGenerator.impactOccurred()
                            }
                        }
                    )

                    AzkarCard(
                        text: "بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.",
                        count: count2,
                        target: 3,
                        onTap: {
                            if count2 > 0 {
                                count2 -= 1
                                feedbackGenerator.impactOccurred()
                            }
                        }
                    )

                    AzkarCard(
                        text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.",
                        count: count3,
                        target: 3,
                        onTap: {
                            if count3 > 0 {
                                count3 -= 1
                                feedbackGenerator.impactOccurred()
                            }
                        }
                    )
                }
                .padding(.horizontal, 16)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}

struct AzkarCard: View {
    let text: String
    let count: Int
    let target: Int
    let onTap: () -> Void

    var body: some View {
        VStack(alignment: .trailing, spacing: 10) {
            Text(text)
                .font(.system(size: 16))
                .foregroundColor(count == 0 ? Color(red: 156/255, green: 163/255, blue: 175/255) : Color(red: 236/255, green: 253/255, blue: 245/255))
                .multilineTextAlignment(.trailing)

            HStack {
                Button(action: onTap) {
                    Text(count == 0 ? "تم بحمد الله ✓" : "المس للذكر (\(count))")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(count == 0 ? .white : Color(red: 9/255, green: 36/255, blue: 28/255))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(count == 0 ? Color(red: 5/255, green: 150/255, blue: 105/255) : Color(red: 245/255, green: 158/255, blue: 11/255))
                        .cornerRadius(14)
                }
                Spacer()
            }
        }
        .padding(16)
        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
        .cornerRadius(16)
    }
}
