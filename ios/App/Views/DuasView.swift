import SwiftUI
import UIKit

struct DuaCategoryItem: Identifiable {
    let id: String
    let nameAr: String
    let iconName: String
    let duas: [DuaContentItem]
}

struct DuaContentItem: Identifiable {
    let id: Int
    let text: String
    let reference: String
}

public struct DuasView: View {
    @Environment(\.presentationMode) var presentationMode

    private let categories: [DuaCategoryItem] = [
        DuaCategoryItem(
            id: "quran",
            nameAr: "أدعية قرآنية",
            iconName: "book.fill",
            duas: [
                DuaContentItem(id: 1, text: "«رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ»", reference: "سورة البقرة: 201"),
                DuaContentItem(id: 2, text: "«رَبِّ اشْرَحْ لِي صَدْرِي * وَيَسِّرْ لِي أَمْرِي * وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي * يَفْقَهُوا قَوْلِي»", reference: "سورة طه: 25-28"),
                DuaContentItem(id: 3, text: "«رَبَّنَا لاَ تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ»", reference: "سورة آل عمران: 8"),
                DuaContentItem(id: 4, text: "«رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَى وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَدْخِلْنِي بِرَحْمَتِكَ فِي عِبَادِكَ الصَّالِحِينَ»", reference: "سورة النمل: 19")
            ]
        ),
        DuaCategoryItem(
            id: "relief",
            nameAr: "تفريج الهم والكرب",
            iconName: "heart.fill",
            duas: [
                DuaContentItem(id: 5, text: "«لا إِلَهَ إِلا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ»", reference: "دعوة ذي النون - صححه الألباني"),
                DuaContentItem(id: 6, text: "«اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ سَمَّيْتَ بِهِ نَفْسَكَ، أَوْ عَلَّمْتَهُ أَحَدًا مِنْ خَلْقِكَ، أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ، أَوْ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الْغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلاءَ حُزْنِي، وَذَهَابَ هَمِّي»", reference: "رواه أحمد وصححه الألباني"),
                DuaContentItem(id: 7, text: "«اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ لا إِلَهَ إِلا أَنْتَ»", reference: "رواه أبو داود")
            ]
        ),
        DuaCategoryItem(
            id: "rizq",
            nameAr: "الرزق وقضاء الدين",
            iconName: "dollarsign.circle.fill",
            duas: [
                DuaContentItem(id: 8, text: "«اللَّهُمَّ اكْفِنِي بِحَلالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ»", reference: "رواه الترمذي وحسنه الألباني"),
                DuaContentItem(id: 9, text: "«اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلاً مُتَقَبَّلاً»", reference: "رواه ابن ماجه")
            ]
        ),
        DuaCategoryItem(
            id: "healing",
            nameAr: "الشفاء والعافية",
            iconName: "cross.fill",
            duas: [
                DuaContentItem(id: 10, text: "«أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ، اشْفِ وَأَنْتَ الشَّافِي، لا شِفَاءَ إِلا شِفَاؤُكَ، شِفَاءً لا يُغَادِرُ سَقَمًا»", reference: "رواه البخاري ومسلم"),
                DuaContentItem(id: 11, text: "«أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ كُلِّ عَيْنٍ لامَّةٍ»", reference: "رواه البخاري")
            ]
        )
    ]

    @State private var selectedCategoryId: String = "quran"

    public init() {}

    private var currentCategory: DuaCategoryItem {
        categories.first(where: { $0.id == selectedCategoryId }) ?? categories[0]
    }

    public var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 18, weight: .bold))
                }
                Spacer()
                Text("الأدعية النبوية والمأثورة")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "hands.sparkles.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            // Category Selector Chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(categories) { cat in
                        let isSelected = cat.id == selectedCategoryId
                        Button(action: { selectedCategoryId = cat.id }) {
                            HStack(spacing: 6) {
                                Text(cat.nameAr)
                                    .font(.system(size: 13, weight: isSelected ? .bold : .medium))
                                Image(systemName: cat.iconName)
                                    .font(.system(size: 12))
                            }
                            .foregroundColor(isSelected ? Color(red: 9/255, green: 36/255, blue: 28/255) : Color(red: 156/255, green: 163/255, blue: 175/255))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(isSelected ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color(red: 19/255, green: 56/255, blue: 45/255))
                            .cornerRadius(12)
                        }
                    }
                }
                .padding(.horizontal, 20)
            }

            // Duas List
            ScrollView {
                VStack(spacing: 14) {
                    ForEach(currentCategory.duas) { dua in
                        VStack(alignment: .trailing, spacing: 10) {
                            HStack {
                                Button(action: {
                                    shareText(dua.text + "\n" + dua.reference)
                                }) {
                                    Image(systemName: "square.and.arrow.up")
                                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                                        .font(.system(size: 15))
                                }
                                Spacer()
                                Image(systemName: "heart.fill")
                                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255).opacity(0.8))
                                    .font(.system(size: 12))
                            }

                            Text(dua.text)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                                .lineSpacing(6)
                                .multilineTextAlignment(.trailing)

                            Text(dua.reference)
                                .font(.system(size: 11))
                                .foregroundColor(Color(red: 110/255, green: 231/255, blue: 183/255))
                        }
                        .padding(16)
                        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                        .cornerRadius(16)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }

    private func shareText(_ text: String) {
        let full = "\(text)\n\nتطبيق المؤذن"
        let av = UIActivityViewController(activityItems: [full], applicationActivities: nil)
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            rootVC.present(av, animated: true, completion: nil)
        }
    }
}
