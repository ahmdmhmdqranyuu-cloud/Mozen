import SwiftUI
import UIKit

struct HadithItem: Identifiable {
    let id: Int
    let title: String
    let text: String
    let narrator: String
    let explanation: String
}

public struct HadithView: View {
    @Environment(\.presentationMode) var presentationMode

    private let hadiths: [HadithItem] = [
        HadithItem(
            id: 1,
            title = "الأعمال بالنيات",
            text: "«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوْ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ».",
            narrator: "رواه البخاري ومسلم عن أمير المؤمنين عمر بن الخطاب رضي الله عنه",
            explanation: "هذا الحديث أصل عظيم من أصول الإسلام وقاعدة تدور عليها جميع الأعمال الظاهرة والباطنة."
        ),
        HadithItem(
            id: 2,
            title = "مراتب الدين: الإسلام والإيمان والإحسان",
            text: "حديث جبريل عليه السلام حين سأل النبي ﷺ عن الإسلام، فقال: «أَنْ تَشْهَدَ أَنْ لا إِلَهَ إِلا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَتُقِيمَ الصَّلاةَ، وَتُؤْتِيَ الزَّكَاةَ، وَتَصُومَ رَمَضَانَ، وَتَحُجَّ الْبَيْتَ إِنِ اسْتَطَعْتَ إِلَيْهِ سَبِيلاً»... ثم سأله عن الإيمان وعن الإحسان وعن الساعة وأماراتها.",
            narrator: "رواه مسلم عن عمر بن الخطاب رضي الله عنه",
            explanation: "يعرف هذا الحديث بـ «أم السنة» لأنه جمع قواعد الدين وأركانه الثلاثة: الإسلام والإيمان والإحسان."
        ),
        HadithItem(
            id: 3,
            title = "أركان الإسلام ودعائمه",
            text: "«بُنِيَ الإِسْلامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لا إِلَهَ إِلا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ».",
            narrator: "رواه البخاري ومسلم عن عبدالله بن عمر رضي الله عنهما",
            explanation: "شبه النبي ﷺ الإسلام بالبناء القائم على خمسة أعمدة متينة لا يقوم إلا بها."
        ),
        HadithItem(
            id: 4,
            title = "الحلال بين والحرام بين",
            text: "«إِنَّ الْحَلالَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ، وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ لا يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ، فَمَنِ اتَّقَى الشُّبُهَاتِ اسْتَبْرَأَ لِدِينِهِ وَعِرْضِهِ... أَلا وَإِنَّ فِي الْجَسَدِ مُضْغَةً إِذَا صَلَحَتْ صَلَحَ الْجَسَدُ كُلُّهُ وَإِذَا فَسَدَتْ فَسَدَ الْجَسَدُ كُلُّهُ أَلا وَهِيَ الْقَلْبُ».",
            narrator: "رواه البخاري ومسلم عن النعمان بن بشير رضي الله عنهما",
            explanation: "بيان لقواعد الورع والابتعاد عن مواطن الشبهات وأهمية طهارة وسلامة القلب."
        ),
        HadithItem(
            id: 5,
            title = "الدين النصيحة",
            text: "«الدِّينُ النَّصِيحَةُ»، قُلْنَا: لِمَنْ؟ قَالَ: «لِلَّهِ، وَلِكِتَابِهِ، وَلِرَسُولِهِ، وَلأَئِمَّةِ الْمُسْلِمِينَ، وَعَامَّتِهِمْ».",
            narrator: "رواه مسلم عن تميم بن أوس الداري رضي الله عنه",
            explanation: "النصيحة هي إرادة الخير للمنصوح له وإخلاص القصد في المعاملة والدعوة."
        ),
        HadithItem(
            id: 6,
            title = "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه",
            text: "«لا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ».",
            narrator: "رواه البخاري ومسلم عن أنس بن مالك رضي الله عنه",
            explanation: "كمال الإيمان وسلامة الصدر تتجلى في محبة الخير والبر لكل مسلم ومسلمة."
        )
    ]

    @State private var searchText: String = ""

    public init() {}

    private var filteredHadiths: [HadithItem] {
        if searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return hadiths
        }
        return hadiths.filter { $0.title.contains(searchText) || $0.text.contains(searchText) }
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
                Text("الأحاديث النبوية الشريفة")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "quote.bubble.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            // Search Box
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                TextField("ابحث في الأحاديث...", text: $searchText)
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                    .multilineTextAlignment(.trailing)
            }
            .padding(12)
            .background(Color(red: 19/255, green: 56/255, blue: 45/255))
            .cornerRadius(14)
            .padding(.horizontal, 20)

            // Hadith List
            ScrollView {
                VStack(spacing: 14) {
                    ForEach(filteredHadiths) { item in
                        HadithCardView(hadith: item)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}

struct HadithCardView: View {
    let hadith: HadithItem
    @State private var isExpanded: Bool = false

    var body: some View {
        VStack(alignment: .trailing, spacing: 10) {
            HStack {
                Button(action: {
                    shareHadith(hadith: hadith)
                }) {
                    Image(systemName: "square.and.arrow.up")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 15))
                }

                Spacer()

                Text("الحديث \(hadith.id): \(hadith.title)")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }

            Text(hadith.text)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                .lineSpacing(6)
                .multilineTextAlignment(.trailing)

            Text(hadith.narrator)
                .font(.system(size: 11))
                .foregroundColor(Color(red: 110/255, green: 231/255, blue: 183/255))
                .multilineTextAlignment(.trailing)

            if isExpanded {
                VStack(alignment: .trailing, spacing: 4) {
                    Text("الشرح والفائدة:")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                    Text(hadith.explanation)
                        .font(.system(size: 13))
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                        .lineSpacing(4)
                        .multilineTextAlignment(.trailing)
                }
                .padding(10)
                .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                .cornerRadius(10)
                .padding(.top, 4)
            }

            Button(action: { isExpanded.toggle() }) {
                Text(isExpanded ? "إخفاء الشرح" : "عرض الشرح والفائدة")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.top, 2)
        }
        .padding(16)
        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
        .cornerRadius(16)
    }

    private func shareHadith(hadith: HadithItem) {
        let text = "\(hadith.title)\n\n\(hadith.text)\n\n\(hadith.narrator)\n\nتطبيق المؤذن"
        let av = UIActivityViewController(activityItems: [text], applicationActivities: nil)
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            rootVC.present(av, animated: true, completion: nil)
        }
    }
}
