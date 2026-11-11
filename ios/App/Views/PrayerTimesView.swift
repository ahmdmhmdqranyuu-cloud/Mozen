import SwiftUI

public struct PrayerTimesView: View {
    @State private var cityName: String = "مكة المكرمة"
    @State private var calcMethod: String = "أم القرى (مكة المكرمة)"

    public init() {}

    public var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("مواقيت الصلاة الدقيقة")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                    .padding(.top, 10)

                VStack(spacing: 12) {
                    PrayerRow(name: "الفجر", time: "04:50", isNext: false)
                    PrayerRow(name: "الشروق", time: "06:12", isNext: false)
                    PrayerRow(name: "الظهر", time: "12:15", isNext: true)
                    PrayerRow(name: "العصر", time: "15:35", isNext: false)
                    PrayerRow(name: "المغرب", time: "18:10", isNext: false)
                    PrayerRow(name: "العشاء", time: "19:40", isNext: false)
                }

                VStack(alignment: .trailing, spacing: 8) {
                    Text("طريقة الحساب الفلكي:")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                    Text(calcMethod)
                        .font(.system(size: 13))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                }
                .padding()
                .frame(maxWidth: .infinity)
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
