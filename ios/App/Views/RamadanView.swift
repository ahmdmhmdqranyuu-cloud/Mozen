import SwiftUI

public struct RamadanView: View {
    @ObservedObject var locationManager = LocationAndCompassManager.shared
    @Environment(\.presentationMode) var presentationMode

    @State private var checkedItems: Set<String> = []

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
            calculationMethod: "umm_al_qura",
            asrMethod: "standard"
        )
    }

    private var imsakMinutes: Int {
        return max(0, todayTimes.fajrMinutes - 15)
    }

    private var currentMinutes: Int {
        let cal = Calendar.current
        let h = cal.component(.hour, from: Date())
        let m = cal.component(.minute, from: Date())
        return h * 60 + m
    }

    private var iftarRemainingMinutes: Int {
        let diff = todayTimes.maghribMinutes - currentMinutes
        return diff > 0 ? diff : 0
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
                Text("شهر رمضان المبارك")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "moon.stars.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            ScrollView {
                VStack(spacing: 16) {
                    // Fasting & Iftar Countdown Card
                    VStack(spacing: 12) {
                        Image(systemName: "moon.fill")
                            .font(.system(size: 32))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                        Text("الوقت المتبقي حتى أذان المغرب (الإفطار)")
                            .font(.system(size: 13))
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))

                        Text(iftarRemainingMinutes > 0 ? "\(iftarRemainingMinutes / 60) ساعة و \(iftarRemainingMinutes % 60) دقيقة" : "حان الآن موعد الإفطار مباركاً هنيئاً")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                        HStack(spacing: 12) {
                            ImsakCard(title: "الإمساك", time: PrayerTimeCalculator.formatMinutesToHHmm(imsakMinutes))
                            ImsakCard(title: "الفجر", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.fajrMinutes))
                            ImsakCard(title: "المغرب (الإفطار)", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.maghribMinutes))
                        }
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity)
                    .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                    .cornerRadius(20)

                    // Iftar Dua Card
                    VStack(alignment: .trailing, spacing: 6) {
                        Text("دعاء الإفطار المأثور")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        Text("«ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ»")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                            .multilineTextAlignment(.trailing)
                        Text("رواه أبو داود والنسائي وحسنه الألباني")
                            .font(.system(size: 11))
                            .foregroundColor(Color(red: 110/255, green: 231/255, blue: 183/255))
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                    .cornerRadius(16)

                    // Spiritual Checklist
                    VStack(alignment: .trailing, spacing: 12) {
                        Text("جدول الطاعات اليومي")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))

                        let tasks = [
                            "صيام اليوم خالصاً لوجه الله تعالى",
                            "تلاوة جزء من القرآن الكريم لتختمه في الشهر",
                            "أداء صلاة التراويح والوتر جماعة أو منفرداً",
                            "المحافظة على أذكار الصباح والمساء كاملة",
                            "إطعام صائم أو التصدق بما تجود به النفس",
                            "الدعاء بإلحاح عند الإفطار وفي الثلث الأخير من الليل"
                        ]

                        ForEach(tasks, id: \.self) { task in
                            let isDone = checkedItems.contains(task)
                            HStack(spacing: 12) {
                                Spacer()
                                Text(task)
                                    .font(.system(size: 14))
                                    .foregroundColor(isDone ? Color(red: 156/255, green: 163/255, blue: 175/255) : Color(red: 236/255, green: 253/255, blue: 245/255))
                                    .strikethrough(isDone)

                                Button(action: {
                                    if isDone {
                                        checkedItems.remove(task)
                                    } else {
                                        checkedItems.insert(task)
                                    }
                                }) {
                                    Image(systemName: isDone ? "checkmark.circle.fill" : "circle")
                                        .foregroundColor(isDone ? Color(red: 16/255, green: 185/255, blue: 129/255) : Color(red: 245/255, green: 158/255, blue: 11/255))
                                        .font(.system(size: 20))
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .padding(18)
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

struct ImsakCard: View {
    let title: String
    let time: String

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.system(size: 11))
                .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
            Text(time)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
        }
        .padding(10)
        .frame(maxWidth: .infinity)
        .background(Color(red: 29/255, green: 77/255, blue: 62/255))
        .cornerRadius(12)
    }
}
