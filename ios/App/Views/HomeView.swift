import SwiftUI

public struct HomeView: View {
    @ObservedObject var locationManager = LocationAndCompassManager.shared

    @State private var cityName: String = "مكة المكرمة"
    @State private var calculationMethod: String = "umm_al_qura"
    @State private var asrMethod: String = "standard"
    @State private var activeSheet: ActiveHomeSheet? = nil

    public init() {}

    private var todayTimes: DailyPrayerTimes {
        let cal = Calendar.current
        let dayOfYear = cal.ordinality(of: .day, in: .year, for: Date()) ?? 1
        let tzOffsetHours = Double(TimeZone.current.secondsFromGMT()) / 3600.0

        return PrayerTimeCalculator.calculateDailyPrayers(
            latitude: locationManager.userLatitude,
            longitude: locationManager.userLongitude,
            timezoneOffsetHours: tzOffsetHours,
            dayOfYear: dayOfYear,
            calculationMethod: calculationMethod,
            asrMethod: asrMethod
        )
    }

    private var currentMinutes: Int {
        let cal = Calendar.current
        let h = cal.component(.hour, from: Date())
        let m = cal.component(.minute, from: Date())
        return h * 60 + m
    }

    private var nextPrayerInfo: (name: String, timeMinutes: Int, remainingMinutes: Int) {
        return PrayerTimeCalculator.determineNextPrayer(times: todayTimes, currentMinutes: currentMinutes)
    }

    public var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Hero Next Prayer Card (100% Dynamic Astronomical Calculation)
                VStack(spacing: 14) {
                    HStack {
                        Text("اليوم المبارك")
                            .font(.system(size: 13))
                            .foregroundColor(Color(red: 253/255, green: 230/255, blue: 138/255))
                        Spacer()
                        HStack(spacing: 4) {
                            Text(cityName)
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                            Image(systemName: "location.fill")
                                .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                                .font(.system(size: 13))
                        }
                    }

                    VStack(spacing: 4) {
                        Text("الصلاة القادمة")
                            .font(.system(size: 13))
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                        Text("صلاة \(nextPrayerInfo.name)")
                            .font(.system(size: 30, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        Text(PrayerTimeCalculator.formatMinutesToHHmm(nextPrayerInfo.timeMinutes))
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))

                        Text("متبقي: \(nextPrayerInfo.remainingMinutes / 60) س و \(nextPrayerInfo.remainingMinutes % 60) د")
                            .font(.system(size: 12))
                            .foregroundColor(Color(red: 110/255, green: 231/255, blue: 183/255))
                            .padding(.top, 2)
                    }

                    HStack(spacing: 6) {
                        DailyPrayerPill(name: "الفجر", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.fajrMinutes), isNext: nextPrayerInfo.name == "الفجر")
                        DailyPrayerPill(name: "الظهر", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.dhuhrMinutes), isNext: nextPrayerInfo.name == "الظهر")
                        DailyPrayerPill(name: "العصر", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.asrMinutes), isNext: nextPrayerInfo.name == "العصر")
                        DailyPrayerPill(name: "المغرب", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.maghribMinutes), isNext: nextPrayerInfo.name == "المغرب")
                        DailyPrayerPill(name: "العشاء", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.ishaMinutes), isNext: nextPrayerInfo.name == "العشاء")
                    }
                }
                .padding(20)
                .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                .cornerRadius(24)

                // Daily Ayah Card
                VStack(alignment: .trailing, spacing: 6) {
                    HStack {
                        Spacer()
                        Text("آية اليوم المباركة")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        Image(systemName: "sparkles")
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                    }
                    Text("«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                        .multilineTextAlignment(.trailing)
                    Text("سورة الرعد - الآية 28")
                        .font(.system(size: 11))
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                }
                .padding(16)
                .frame(maxWidth: .infinity)
                .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                .cornerRadius(18)

                // 16 Islamic Sections Grid
                Text("الأقسام والخدمات الإسلامية")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .padding(.horizontal, 4)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    FeatureGridCard(title: "المواقيت", iconName: "clock.fill") { activeSheet = .prayers }
                    FeatureGridCard(title: "المصحف", iconName: "book.fill") { activeSheet = .quran }
                    FeatureGridCard(title: "الأذكار", iconName: "heart.text.square.fill") { activeSheet = .azkar }
                    FeatureGridCard(title: "المسبحة", iconName: "circle.grid.cross.fill") { activeSheet = .tasbih }
                    FeatureGridCard(title: "القبلة", iconName: "safari.fill") { activeSheet = .qibla }
                    FeatureGridCard(title: "الأحاديث", iconName: "quote.bubble.fill") { activeSheet = .hadith }
                    FeatureGridCard(title: "الأدعية", iconName: "hands.sparkles.fill") { activeSheet = .duas }
                    FeatureGridCard(title: "رمضان", iconName: "moon.stars.fill") { activeSheet = .ramadan }
                    FeatureGridCard(title: "السيرة", iconName: "text.book.closed.fill") { activeSheet = .seerah }
                    FeatureGridCard(title: "قصص الأنبياء", iconName: "person.3.fill") { activeSheet = .prophets }
                    FeatureGridCard(title: "الزكاة", iconName: "scalemass.fill") { activeSheet = .zakat }
                    FeatureGridCard(title: "المسابقات", iconName: "checkmark.seal.fill") { activeSheet = .quiz }
                    FeatureGridCard(title: "الحج والعمرة", iconName: "building.columns.fill") { activeSheet = .hajj }
                    FeatureGridCard(title: "الخلفيات", iconName: "photo.fill") { activeSheet = .wallpapers }
                    FeatureGridCard(title: "الملف الشخصي", iconName: "person.crop.circle.fill") { activeSheet = .profile }
                    FeatureGridCard(title: "الإعدادات", iconName: "gearshape.fill") { activeSheet = .settings }
                }
            }
            .padding(16)
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
        .sheet(item: $activeSheet) { sheet in
            switch sheet {
            case .prayers: PrayerTimesView()
            case .quran: QuranView()
            case .azkar: AzkarView()
            case .tasbih: TasbihView()
            case .qibla: QiblaView()
            case .hadith: HadithView()
            case .duas: DuasView()
            case .ramadan: RamadanView()
            case .seerah: SeerahView()
            case .prophets: ProphetsView()
            case .zakat: ZakatView()
            case .quiz: QuizView()
            case .hajj: HajjView()
            case .wallpapers: WallpapersView()
            case .profile: ProfileView()
            case .settings: SettingsView()
            }
        }
    }
}

enum ActiveHomeSheet: Int, Identifiable {
    case prayers = 1
    case quran = 2
    case azkar = 3
    case tasbih = 4
    case qibla = 5
    case hadith = 6
    case duas = 7
    case ramadan = 8
    case seerah = 9
    case prophets = 10
    case zakat = 11
    case quiz = 12
    case hajj = 13
    case wallpapers = 14
    case profile = 15
    case settings = 16

    var id: Int { rawValue }
}

struct DailyPrayerPill: View {
    let name: String
    let time: String
    let isNext: Bool

    var body: some View {
        VStack(spacing: 2) {
            Text(name)
                .font(.system(size: 11))
                .foregroundColor(isNext ? .white : Color(red: 156/255, green: 163/255, blue: 175/255))
            Text(time)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(isNext ? .white : Color(red: 236/255, green: 253/255, blue: 245/255))
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 6)
        .background(isNext ? Color(red: 217/255, green: 119/255, blue: 6/255) : Color(red: 29/255, green: 77/255, blue: 62/255))
        .cornerRadius(10)
    }
}

struct FeatureGridCard: View {
    let title: String
    let iconName: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Circle()
                    .fill(Color(red: 29/255, green: 77/255, blue: 62/255))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Image(systemName: iconName)
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                            .font(.system(size: 19))
                    )
                Text(title)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                    .lineLimit(1)
            }
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity)
            .background(Color(red: 19/255, green: 56/255, blue: 45/255))
            .cornerRadius(16)
        }
    }
}
