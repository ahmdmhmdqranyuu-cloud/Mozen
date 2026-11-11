import SwiftUI

public struct HomeView: View {
    @State private var cityName: String = "مكة المكرمة"
    @State private var nextPrayerName: String = "الظهر"
    @State private var nextPrayerTime: String = "12:15"

    public init() {}

    public var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Hero Next Prayer Card
                VStack(spacing: 14) {
                    HStack {
                        Text("اليوم")
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
                        Text("صلاة \(nextPrayerName)")
                            .font(.system(size: 30, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        Text(nextPrayerTime)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                    }

                    HStack(spacing: 8) {
                        DailyPrayerPill(name: "الفجر", time: "04:50", isNext: nextPrayerName == "الفجر")
                        DailyPrayerPill(name: "الظهر", time: "12:15", isNext: nextPrayerName == "الظهر")
                        DailyPrayerPill(name: "العصر", time: "15:35", isNext: nextPrayerName == "العصر")
                        DailyPrayerPill(name: "المغرب", time: "18:10", isNext: nextPrayerName == "المغرب")
                        DailyPrayerPill(name: "العشاء", time: "19:40", isNext: nextPrayerName == "العشاء")
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

                // Features Grid
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    FeatureGridCard(title: "المواقيت", iconName: "clock.fill")
                    FeatureGridCard(title: "المصحف", iconName: "book.fill")
                    FeatureGridCard(title: "الأذكار", iconName: "heart.text.square.fill")
                    FeatureGridCard(title: "المسبحة", iconName: "circle.grid.cross.fill")
                    FeatureGridCard(title: "القبلة", iconName: "safari.fill")
                    FeatureGridCard(title: "الأحاديث", iconName: "quote.bubble.fill")
                    FeatureGridCard(title: "الأدعية", iconName: "hands.sparkles.fill")
                    FeatureGridCard(title: "رمضان", iconName: "moon.stars.fill")
                    FeatureGridCard(title: "السيرة", iconName: "text.book.closed.fill")
                }
            }
            .padding(16)
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
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
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(isNext ? Color(red: 217/255, green: 119/255, blue: 6/255) : Color(red: 29/255, green: 77/255, blue: 62/255))
        .cornerRadius(10)
    }
}

struct FeatureGridCard: View {
    let title: String
    let iconName: String

    var body: some View {
        VStack(spacing: 8) {
            Circle()
                .fill(Color(red: 29/255, green: 77/255, blue: 62/255))
                .frame(width: 44, height: 44)
                .overlay(
                    Image(systemName: iconName)
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 20))
                )
            Text(title)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
        }
        .padding(.vertical, 16)
        .frame(maxWidth: .infinity)
        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
        .cornerRadius(16)
    }
}
