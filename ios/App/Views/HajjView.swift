import SwiftUI

struct iOSRitualStep: Identifiable {
    let id: Int
    let title: String
    let stage: String
    let description: String
    let dua: String?
}

public struct HajjView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var selectedTab: Int = 0 // 0 = Umrah, 1 = Hajj

    private let umrahSteps: [iOSRitualStep] = [
        iOSRitualStep(
            id: 1,
            title: "الإحرام والتلبية من الميقات",
            stage: "الخطوة الأولى",
            description: "الاغتسال والتطيب والتجرد من المخيط للرجال، ثم عقد نية العمرة وقول: «لَبَّيْكَ عُمْرَةً».",
            dua: "«لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لا شَرِيكَ لَكَ»."
        ),
        iOSRitualStep(
            id: 2,
            title: "طواف العمرة (7 أشواط)",
            stage: "الخطوة الثانية",
            description: "بدء الطواف من الحجر الأسود جاعلاً الكعبة عن يسارك، ويسن الرمل والاضطباع للرجال في الأشواط الثلاثة الأولى.",
            dua: "بين الركن اليماني والحجر الأسود: «رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ»."
        ),
        iOSRitualStep(
            id: 3,
            title: "صلاة ركعتي الطواف وماء زمزم",
            stage: "الخطوة الثالثة",
            description: "صلاة ركعتين خلف مقام إبراهيم إن تيسر، يقرأ فيهما الكافرون والإخلاص، ثم الشرب والتضلع من زمزم المبارك.",
            dua: "«اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ»."
        ),
        iOSRitualStep(
            id: 4,
            title: "السعي بين الصفا والمروة (7 أشواط)",
            stage: "الخطوة الرابعة",
            description: "البدء بالصفا واستقبال الكعبة والتكبير، ثم التوجه للمروة (شوط)، والعودة للصفا (شوط ثانٍ) حتى تمام 7 أشواط تنتهي بالمروة.",
            dua: "«إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ... لا إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ»."
        ),
        iOSRitualStep(
            id: 5,
            title: "الحلق أو التقصير والتحلل",
            stage: "الخطوة الخامسة",
            description: "حلق شعر الرأس أو تقصيره للرجال (والحلق أفضل)، وقص أطراف الشعر قيد أنملة للمرأة، وبهذا تنتهي العمرة بالكامل.",
            dua: "تقبل الله طاعتكم وعمرتكم!"
        )
    ]

    private let hajjSteps: [iOSRitualStep] = [
        iOSRitualStep(
            id: 1,
            title: "يوم التروية والإحرام بالحج",
            stage: "8 ذو الحجة",
            description: "الإحرام من مكة بالنية والتلبية: «لَبَّيْكَ حَجًّا»، والتوجه إلى منى للمبيت بها وأداء الصلوات قصراً دون جمع.",
            dua: "«لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ...»."
        ),
        iOSRitualStep(
            id: 2,
            title: "الوقوف بعرفة (ركن الحج الأعظم)",
            stage: "9 ذو الحجة",
            description: "التوجه لصعيد عرفات، والجمع والقصر للظهر والعصر تقديماً، والتفرغ التام للذكر والدعاء والتضرع حتى الغروب.",
            dua: "«خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ: لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ»."
        ),
        iOSRitualStep(
            id: 3,
            title: "المبيت بمزدلفة وجمع الجمار",
            stage: "ليلة 10 ذو الحجة",
            description: "الانطلاق لمزدلفة بعد الغروب، وصلاة المغرب والعشاء جمع تأخير، والمبيت بها وجمع حصيات الجمار.",
            dua: "الإكثار من ذكر الله عند المشعر الحرام."
        ),
        iOSRitualStep(
            id: 4,
            title: "يوم النحر (يوم الحج الأكبر)",
            stage: "10 ذو الحجة",
            description: "رمي جمرة العقبة الكبرى بـ 7 حصيات، ثم ذبح الهدي، ثم الحلق أو التقصير (التحلل الأول)، ثم طواف الإفاضة والسعي (التحلل الكامل).",
            dua: "الله أكبر الله أكبر ولله الحمد."
        ),
        iOSRitualStep(
            id: 5,
            title: "أيام التشريق وطواف الوداع",
            stage: "11 و 12 و 13 ذو الحجة",
            description: "المبيت بمنى ورمي الجمرات الثلاث بعد الزوال كل يوم بـ 7 حصيات، ثم طواف الوداع قبل مغادرة مكة المكرمة.",
            dua: "اللهم اجعله حجاً مبروراً وسعياً مشكوراً وذنباً مغفوراً."
        )
    ]

    public init() {}

    private var activeSteps: [iOSRitualStep] {
        selectedTab == 0 ? umrahSteps : hajjSteps
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
                Text("مناسك الحج والعمرة")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "building.columns.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            // Tab Selector
            HStack(spacing: 0) {
                Button(action: { selectedTab = 0 }) {
                    Text("مناسك العمرة")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(selectedTab == 0 ? Color(red: 9/255, green: 36/255, blue: 28/255) : Color(red: 156/255, green: 163/255, blue: 175/255))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(selectedTab == 0 ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color.clear)
                }

                Button(action: { selectedTab = 1 }) {
                    Text("مناسك الحج")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(selectedTab == 1 ? Color(red: 9/255, green: 36/255, blue: 28/255) : Color(red: 156/255, green: 163/255, blue: 175/255))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(selectedTab == 1 ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color.clear)
                }
            }
            .background(Color(red: 19/255, green: 56/255, blue: 45/255))
            .cornerRadius(12)
            .padding(.horizontal, 20)

            ScrollView {
                VStack(spacing: 14) {
                    ForEach(activeSteps) { step in
                        VStack(alignment: .trailing, spacing: 8) {
                            HStack {
                                Text(step.stage)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(Color(red: 110/255, green: 231/255, blue: 183/255))
                                Spacer()
                                Text("\(step.id). \(step.title)")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                            }

                            Text(step.description)
                                .font(.system(size: 14))
                                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                                .lineSpacing(5)
                                .multilineTextAlignment(.trailing)

                            if let dua = step.dua {
                                Text(dua)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(Color(red: 253/255, green: 230/255, blue: 138/255))
                                    .padding(10)
                                    .frame(maxWidth: .infinity, alignment: .trailing)
                                    .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                                    .cornerRadius(10)
                                    .padding(.top, 4)
                            }
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
