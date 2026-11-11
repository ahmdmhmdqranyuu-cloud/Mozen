import SwiftUI

public struct ProfileView: View {
    @Environment(\.presentationMode) var presentationMode

    @State private var fajrDone: Bool = UserDefaults.standard.bool(forKey: "prayer_fajr_today")
    @State private var dhuhrDone: Bool = UserDefaults.standard.bool(forKey: "prayer_dhuhr_today")
    @State private var asrDone: Bool = UserDefaults.standard.bool(forKey: "prayer_asr_today")
    @State private var maghribDone: Bool = UserDefaults.standard.bool(forKey: "prayer_maghrib_today")
    @State private var ishaDone: Bool = UserDefaults.standard.bool(forKey: "prayer_isha_today")

    @State private var totalTasbih: Int = UserDefaults.standard.integer(forKey: "total_tasbih_ios")

    public init() {}

    private var completedPrayersCount: Int {
        [fajrDone, dhuhrDone, asrDone, maghribDone, ishaDone].filter { $0 }.count
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
                Text("الملف الشخصي والإحصائيات")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "person.crop.circle.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            ScrollView {
                VStack(spacing: 16) {
                    // Profile Header Card
                    VStack(spacing: 10) {
                        Circle()
                            .fill(Color(red: 245/255, green: 158/255, blue: 11/255).opacity(0.2))
                            .frame(width: 72, height: 72)
                            .overlay(
                                Image(systemName: "person.fill")
                                    .font(.system(size: 34))
                                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                            )

                        Text("مسلم يرجو رحمة ربه")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))

                        Text("نسأل الله القبول والثبات")
                            .font(.system(size: 12))
                            .foregroundColor(Color(red: 110/255, green: 231/255, blue: 183/255))
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity)
                    .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                    .cornerRadius(20)

                    // Daily Prayer Tracker Card
                    VStack(alignment: .trailing, spacing: 14) {
                        HStack {
                            Text("\(completedPrayersCount) من 5")
                                .font(.system(size: 13))
                                .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                            Spacer()
                            Text("متابعة صلوات اليوم المكتوبة")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        }

                        // Progress bar
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color(red: 29/255, green: 77/255, blue: 62/255))
                                    .frame(height: 6)

                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color(red: 245/255, green: 158/255, blue: 11/255))
                                    .frame(width: geo.size.width * CGFloat(completedPrayersCount) / 5.0, height: 6)
                            }
                        }
                        .frame(height: 6)

                        // 5 Prayer Buttons
                        HStack(spacing: 8) {
                            PrayerCheckPill(name: "الفجر", isDone: $fajrDone, key: "prayer_fajr_today")
                            PrayerCheckPill(name: "الظهر", isDone: $dhuhrDone, key: "prayer_dhuhr_today")
                            PrayerCheckPill(name: "العصر", isDone: $asrDone, key: "prayer_asr_today")
                            PrayerCheckPill(name: "المغرب", isDone: $maghribDone, key: "prayer_maghrib_today")
                            PrayerCheckPill(name: "العشاء", isDone: $ishaDone, key: "prayer_isha_today")
                        }
                    }
                    .padding(18)
                    .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                    .cornerRadius(20)

                    // Stats Cards Row
                    HStack(spacing: 12) {
                        VStack(spacing: 6) {
                            Image(systemName: "book.fill")
                                .font(.system(size: 24))
                                .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                            Text("آخر سورة")
                                .font(.system(size: 11))
                                .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                            Text("سورة الفاتحة")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity)
                        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                        .cornerRadius(16)

                        VStack(spacing: 6) {
                            Image(systemName: "circle.grid.cross.fill")
                                .font(.system(size: 24))
                                .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                            Text("مجموع التسبيحات")
                                .font(.system(size: 11))
                                .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                            Text("\(totalTasbih)")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity)
                        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                        .cornerRadius(16)
                    }

                    // Spiritual Badges Card
                    VStack(alignment: .trailing, spacing: 12) {
                        Text("الأوسمة والإنجازات الإيمانية")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                        BadgeRow(title: "المحافظ على الصلوات الخمس", desc: "أداء جميع صلوات اليوم المفروضة", isUnlocked: completedPrayersCount >= 5)
                        BadgeRow(title: "المسبح الذاكر", desc: "أتم أكثر من 100 تسبيحة بالمسبحة", isUnlocked: totalTasbih >= 100)
                        BadgeRow(title: "المقبل على القرآن", desc: "تلاوة ومتابعة ورد القرآن الكريم", isUnlocked: true)
                    }
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                    .cornerRadius(20)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}

struct PrayerCheckPill: View {
    let name: String
    @Binding var isDone: Bool
    let key: String

    var body: some View {
        Button(action: {
            isDone.toggle()
            UserDefaults.standard.set(isDone, forKey: key)
        }) {
            VStack(spacing: 6) {
                Circle()
                    .fill(isDone ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color(red: 29/255, green: 77/255, blue: 62/255))
                    .frame(width: 36, height: 36)
                    .overlay(
                        Image(systemName: isDone ? "checkmark" : "clock")
                            .foregroundColor(isDone ? Color(red: 9/255, green: 36/255, blue: 28/255) : Color(red: 156/255, green: 163/255, blue: 175/255))
                            .font(.system(size: 14, weight: .bold))
                    )
                Text(name)
                    .font(.system(size: 11, weight: isDone ? .bold : .normal))
                    .foregroundColor(isDone ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color(red: 156/255, green: 163/255, blue: 175/255))
            }
            .frame(maxWidth: .infinity)
        }
    }
}

struct BadgeRow: View {
    let title: String
    let desc: String
    let isUnlocked: Bool

    var body: some View {
        HStack(spacing: 12) {
            if isUnlocked {
                Text("مكتمل")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(title)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(isUnlocked ? Color(red: 236/255, green: 253/255, blue: 245/255) : Color(red: 156/255, green: 163/255, blue: 175/255))
                Text(desc)
                    .font(.system(size: 11))
                    .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255).opacity(0.8))
            }

            Circle()
                .fill(isUnlocked ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color(red: 29/255, green: 77/255, blue: 62/255))
                .frame(width: 32, height: 32)
                .overlay(
                    Image(systemName: "rosette")
                        .foregroundColor(isUnlocked ? Color(red: 9/255, green: 36/255, blue: 28/255) : Color(red: 156/255, green: 163/255, blue: 175/255))
                        .font(.system(size: 15))
                )
        }
        .padding(.vertical, 4)
    }
}
