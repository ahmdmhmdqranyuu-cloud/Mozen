import SwiftUI

public struct PrayerTimesView: View {
    @ObservedObject var locationManager = LocationAndCompassManager.shared
    @State private var cityName: String = "مكة المكرمة"
    @State private var calculationMethod: String = "umm_al_qura"
    @State private var asrMethod: String = "standard"

    let calculationMethods = [
        ("umm_al_qura", "أم القرى (مكة المكرمة)"),
        ("egypt", "الهيئة العامة المصرية للمساحة"),
        ("mwl", "رابطة العالم الإسلامي"),
        ("isna", "الجمعية الإسلامية لأمريكا الشمالية"),
        ("karachi", "جامعة العلوم الإسلامية بكراتشي")
    ]

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
                Text("مواقيت الصلاة الدقيقة")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                    .padding(.top, 10)

                // Location Banner
                HStack {
                    Text("الصلاة القادمة: صلاة \(nextPrayerInfo.name)")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                    Spacer()
                    Text(cityName)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                }
                .padding()
                .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                .cornerRadius(16)

                // Daily Prayers List
                VStack(spacing: 10) {
                    PrayerRow(name: "الفجر", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.fajrMinutes), isNext: nextPrayerInfo.name == "الفجر")
                    PrayerRow(name: "الشروق", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.sunriseMinutes), isNext: false)
                    PrayerRow(name: "الظهر", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.dhuhrMinutes), isNext: nextPrayerInfo.name == "الظهر")
                    PrayerRow(name: "العصر", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.asrMinutes), isNext: nextPrayerInfo.name == "العصر")
                    PrayerRow(name: "المغرب", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.maghribMinutes), isNext: nextPrayerInfo.name == "المغرب")
                    PrayerRow(name: "العشاء", time: PrayerTimeCalculator.formatMinutesToHHmm(todayTimes.ishaMinutes), isNext: nextPrayerInfo.name == "العشاء")
                }

                // Calculation Method and Asr Juristic Selector
                VStack(alignment: .trailing, spacing: 12) {
                    Text("إعدادات الحساب الفلكي والمذهب")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                    Picker("طريقة الحساب", selection: $calculationMethod) {
                        ForEach(calculationMethods, id: \.0) { method in
                            Text(method.1).tag(method.0)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(8)
                    .frame(maxWidth: .infinity)
                    .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                    .cornerRadius(12)

                    HStack {
                        Spacer()
                        Picker("مذهب العصر", selection: $asrMethod) {
                            Text("الجمهور (شافعي/مالكي/حنبلي)").tag("standard")
                            Text("المذهب الحنفي").tag("hanafi")
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                }
                .padding(16)
                .background(Color(red: 19/255, green: 56/255, blue: 45/255))
                .cornerRadius(16)
            }
            .padding(16)
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}

struct PrayerRow: View {
    let name: String
    let time: String
    let isNext: Bool

    var body: some View {
        HStack {
            Text(time)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(isNext ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color(red: 236/255, green: 253/255, blue: 245/255))
            Spacer()
            HStack(spacing: 8) {
                Text(name)
                    .font(.system(size: 16, weight: isNext ? .bold : .medium))
                    .foregroundColor(isNext ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color(red: 236/255, green: 253/255, blue: 245/255))
                Image(systemName: "clock.fill")
                    .foregroundColor(isNext ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color(red: 156/255, green: 163/255, blue: 175/255))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(isNext ? Color(red: 29/255, green: 77/255, blue: 62/255) : Color(red: 19/255, green: 56/255, blue: 45/255))
        .cornerRadius(14)
    }
}
