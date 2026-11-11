import SwiftUI

struct SeerahMilestone: Identifiable {
    let id: Int
    let year: String
    let title: String
    let description: String
    let lesson: String
}

public struct SeerahView: View {
    @Environment(\.presentationMode) var presentationMode

    private let milestones: [SeerahMilestone] = [
        SeerahMilestone(
            id: 1,
            year: "عام الفيل (571 م)",
            title: "المولد النبوي الشريف ونشأته المباركة",
            description: "ولد النبي محمد ﷺ في مكة المكرمة يتيم الأب، وتوفيت أمه آمنة وعمره 6 سنوات، فكفله جده عبدالمطلب ثم عمه أبو طالب. عُرف منذ شبابه بالصادق الأمين وحسن الخلق.",
            lesson: "الاصطفاء الإلهي والتربية على مكارم الأخلاق وعفة النفس قبل البعثة."
        ),
        SeerahMilestone(
            id: 2,
            year: "العام 40 من عمره الشريف",
            title: "نزول الوحي في غار حراء والبعثة",
            description: "بينما كان يتعبد في غار حراء، نزل عليه الروح الأمين جبريل عليه السلام بأول آيات القرآن الكريم: ﴿اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ﴾، فبدأت رسالة الإسلام الخاتمة.",
            lesson: "أهمية العلم والقراءة والخلوة للتأمل والتفكر في عظمة الخالق."
        ),
        SeerahMilestone(
            id: 3,
            year: "العام العاشر للبعثة",
            title: "عام الحزن ورحلة الإسراء والمعراج",
            description: "توفي عمه أبو طالب وزوجته خديجة رضي الله عنها، فواسى الله نبيه برحلة الإسراء من المسجد الحرام للمسجد الأقصى والمعراج إلى السماوات العلى وفُرضت فيها الصلوات الخمس.",
            lesson: "الصبر عند الشدائد، وعظمة مكانة الصلاة في الإسلام كصلة مباشرة بالله تعالى."
        ),
        SeerahMilestone(
            id: 4,
            year: "العام الأول للهجرة (622 م)",
            title: "الهجرة النبوية وتأسيس دولة المدينة",
            description: "هاجر النبي ﷺ وصاحبه أبو بكر الصديق إلى يثرب (المدينة المنورة)، وبنى المسجد النبوي، وآخى بين المهاجرين والأنصار، وكتب وثيقة المدينة للتعايش والعدل.",
            lesson: "الأخذ بالأسباب مع كمال التوكل على الله، وأثر الأخوة والتكافل في بناء المجتمع."
        ),
        SeerahMilestone(
            id: 5,
            year: "8 هـ (630 م)",
            title: "فتح مكة المكرمة ودخول الناس في دين الله أفواجاً",
            description: "دخل النبي ﷺ مكة فاتحاً متواضعاً مطأطئ الرأس شاكراً لله، وعفا عن أهل مكة قائلاً: «اذهبوا فأنتم الطلقاء»، وطهر الكعبة المشرفة من الأصنام.",
            lesson: "العفو عند المقدرة، والتواضع عند النصر، وسمو الأخلاق النبوية الشريفة."
        ),
        SeerahMilestone(
            id: 6,
            year: "10 هـ - 11 هـ",
            title: "حجة الوداع وانتقال النبي ﷺ إلى الرفيق الأعلى",
            description: "خطب خطبة الوداع الجامعة لحقوق الإنسان وحرمة الدماء والأموال، ونزل قوله تعالى: ﴿الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ﴾، وتوفي ﷺ في ربيع الأول بالمدينة المنورة.",
            lesson: "تمام البلاغ وأداء الأمانة والوصية بالتمسك بكتاب الله وسنة نبيه ﷺ."
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
                Text("السيرة النبوية العطرة")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "text.book.closed.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            ScrollView {
                VStack(spacing: 14) {
                    ForEach(milestones) { m in
                        SeerahCardView(milestone: m)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}

struct SeerahCardView: View {
    let milestone: SeerahMilestone
    @State private var isExpanded: Bool = false

    var body: some View {
        VStack(alignment: .trailing, spacing: 10) {
            HStack {
                Text(milestone.year)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(red: 9/255, green: 36/255, blue: 28/255))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(red: 245/255, green: 158/255, blue: 11/255))
                    .cornerRadius(8)

                Spacer()

                Text(milestone.title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }

            Text(milestone.description)
                .font(.system(size: 14))
                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                .lineSpacing(5)
                .multilineTextAlignment(.trailing)

            if isExpanded {
                HStack(alignment: .top) {
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("💡 الدروس والعبر المستفادة:")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        Text(milestone.lesson)
                            .font(.system(size: 13))
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                            .multilineTextAlignment(.trailing)
                    }
                }
                .padding(10)
                .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                .cornerRadius(10)
            }

            Button(action: { isExpanded.toggle() }) {
                Text(isExpanded ? "أقل" : "المزيد من الدروس والعبر")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
        }
        .padding(16)
        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
        .cornerRadius(16)
    }
}
