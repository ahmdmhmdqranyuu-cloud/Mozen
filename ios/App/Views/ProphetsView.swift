import SwiftUI

struct ProphetStoryItem: Identifiable {
    let id: Int
    let nameAr: String
    let title: String
    let verseSnippet: String
    let summary: String
}

public struct ProphetsView: View {
    @Environment(\.presentationMode) var presentationMode

    private let prophets: [ProphetStoryItem] = [
        ProphetStoryItem(
            id: 1,
            nameAr: "آدم عليه السلام",
            title: "أبو البشر وخليفة الله في الأرض",
            verseSnippet: "﴿إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً﴾ [البقرة: 30]",
            summary: "خلقه الله تعالى بيده من طين، ونفخ فيه من روحه، وأسجد له ملائكته وعلمه الأسماء كلها، وأسكنه الجنة ثم هبط للأرض بإرادة الله لعمارتها بالتوحيد والتوبة النصوح."
        ),
        ProphetStoryItem(
            id: 2,
            nameAr: "نوح عليه السلام",
            title: "شيخ المرسلين وصاحب الفلك",
            verseSnippet: "﴿وَلَقَدْ أَرْسَلْنَا نُوحًا إِلَىٰ قَوْمِهِ فَلَبِثَ فِيهِمْ أَلْفَ سَنَةٍ إِلَّا خَمْسِينَ عَامًا﴾ [العنكبوت: 14]",
            summary: "لبث في قومه يدعوهم ليلاً ونهاراً وسراً وجهاراً 950 عاماً بالصبر الجميل، وصنع السفينة بأمر الله ونجى معه المؤمنون من الطوفان العظيم."
        ),
        ProphetStoryItem(
            id: 3,
            nameAr: "إبراهيم عليه السلام",
            title: "خليل الرحمن وإمام الحنفاء",
            verseSnippet: "﴿وَإِذِ ابْتَلَىٰ إِبْرَاهِيمَ رَبُّهُ بِكَلِمَاتٍ فَأَتَمَّهُنَّ﴾ [البقرة: 124]",
            summary: "حطم الأصنام بيده ودعا للتوحيد بالعقل والبرهان، ونجاه الله من النار، وبنى الكعبة المشرفة مع ولده إسماعيل ودعا بالبركة لمكة وأهلها."
        ),
        ProphetStoryItem(
            id: 4,
            nameAr: "يوسف عليه السلام",
            title: "الصّدّيق وصاحب الرؤيا والعفة",
            verseSnippet: "﴿قَالَ رَبِّ السِّجْنُ أَحَبُّ إِلَيَّ مِمَّا يَدْعُونَنِي إِلَيْهِ﴾ [يوسف: 33]",
            summary: "تعرض لكيد الإخوة والرمي في البئر، ثم محنة الفتنة والسجن ظلماً، فعصمه الله ورفعه بالعلم والأمانة ليصبح عزيز مصر ويجمع شمل أسرته بالصفح والغفران."
        ),
        ProphetStoryItem(
            id: 5,
            nameAr: "موسى عليه السلام",
            title: "كليم الله وقاهر فرعون",
            verseSnippet: "﴿وَكَلَّمَ اللَّهُ مُوسَىٰ تَكْلِيمًا﴾ [النساء: 164]",
            summary: "أيده الله بالمعجزات الباهرات كالعصا واليد البيضاء، وفلق الله له البحر لنجاة بني إسرائيل وغرق فرعون وجنوده، وأنزل عليه التوراة هدى ونوراً."
        ),
        ProphetStoryItem(
            id: 6,
            nameAr: "عيسى عليه السلام",
            title: "المسيح وكلمة الله إلى مريم",
            verseSnippet: "﴿إِنَّمَا الْمَسِيحُ عِيسَى ابْنُ مَرْيَمَ رَسُولُ اللَّهِ وَكَلِمَتُهُ أَلْقَاهَا إِلَىٰ مَرْيَمَ وَرُوحٌ مِّنْهُ﴾ [النساء: 171]",
            summary: "ولد بمعجزة إلهية من غير أب، وتكلم في المهد صبياً، وأبرأ الأكمه والأبرص وأحيا الموتى بإذن الله، ورفعه الله إليه وسينزل في آخر الزمان حكماً عدلاً."
        )
    ]

    public init() {}

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
                Text("قصص الأنبياء والمرسلين")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "person.3.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            ScrollView {
                VStack(spacing: 14) {
                    ForEach(prophets) { p in
                        VStack(alignment: .trailing, spacing: 10) {
                            HStack {
                                Spacer()
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text(p.nameAr)
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                                    Text(p.title)
                                        .font(.system(size: 12))
                                        .foregroundColor(Color(red: 110/255, green: 231/255, blue: 183/255))
                                }
                            }

                            Text(p.verseSnippet)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(Color(red: 253/255, green: 230/255, blue: 138/255))
                                .padding(8)
                                .frame(maxWidth: .infinity, alignment: .trailing)
                                .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                                .cornerRadius(8)

                            Text(p.summary)
                                .font(.system(size: 14))
                                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                                .lineSpacing(5)
                                .multilineTextAlignment(.trailing)
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
}
