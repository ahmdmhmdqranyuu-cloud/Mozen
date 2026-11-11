import SwiftUI
import UIKit

public struct TasbihView: View {
    @Environment(\.presentationMode) var presentationMode

    private let dhikrList = [
        "سبحان الله وبحمده",
        "الحمد لله رب العالمين",
        "لا إله إلا الله وحده لا شريك له",
        "الله أكبر كبيراً",
        "أستغفر الله وأتوب إليه",
        "لا حول ولا قوة إلا بالله",
        "اللهم صل وسلم على نبينا محمد",
        "سبحان الله العظيم"
    ]

    @State private var selectedDhikrIndex: Int = 0
    @State private var count: Int = 0
    @State private var targetCount: Int = 33
    @State private var totalCount: Int = UserDefaults.standard.integer(forKey: "total_tasbih_ios")

    private let feedback = UIImpactFeedbackGenerator(style: .medium)

    public init() {}

    public var body: some View {
        VStack(spacing: 20) {
            // Header
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 18, weight: .bold))
                }
                Spacer()
                Text("المسبحة الإلكترونية")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Button(action: {
                    count = 0
                }) {
                    Image(systemName: "arrow.counterclockwise")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 16))
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            // Dhikr Selector Carousel
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(0..<dhikrList.count, id: \.self) { idx in
                        let isSelected = idx == selectedDhikrIndex
                        Button(action: {
                            selectedDhikrIndex = idx
                            count = 0
                        }) {
                            Text(dhikrList[idx])
                                .font(.system(size: 13, weight: isSelected ? .bold : .medium))
                                .foregroundColor(isSelected ? Color(red: 9/255, green: 36/255, blue: 28/255) : Color(red: 156/255, green: 163/255, blue: 175/255))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(isSelected ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color(red: 19/255, green: 56/255, blue: 45/255))
                                .cornerRadius(12)
                        }
                    }
                }
                .padding(.horizontal, 20)
            }

            Spacer()

            // Large Touch Sebha Circle
            Button(action: {
                count += 1
                totalCount += 1
                UserDefaults.standard.set(totalCount, forKey: "total_tasbih_ios")
                feedback.impactOccurred()

                if count >= targetCount {
                    let heavy = UINotificationFeedbackGenerator()
                    heavy.notificationOccurred(.success)
                    count = 0
                }
            }) {
                ZStack {
                    // Outer glow ring
                    Circle()
                        .stroke(Color(red: 245/255, green: 158/255, blue: 11/255).opacity(0.3), lineWidth: 12)
                        .frame(width: 250, height: 250)

                    // Inner circle
                    Circle()
                        .fill(Color(red: 19/255, green: 56/255, blue: 45/255))
                        .frame(width: 230, height: 230)

                    VStack(spacing: 8) {
                        Text(dhikrList[selectedDhikrIndex])
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)

                        Text("\(count)")
                            .font(.system(size: 54, weight: .bold))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                        Text("الهدف: \(targetCount)")
                            .font(.system(size: 12))
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                    }
                }
            }
            .buttonStyle(PlainButtonStyle())

            Spacer()

            // Target Selector & Total stats
            HStack(spacing: 16) {
                // Target selector buttons
                HStack(spacing: 6) {
                    ForEach([33, 100], id: \.self) { t in
                        Button(action: { targetCount = t }) {
                            Text("\(t)")
                                .font(.system(size: 12, weight: targetCount == t ? .bold : .normal))
                                .foregroundColor(targetCount == t ? Color(red: 9/255, green: 36/255, blue: 28/255) : Color(red: 236/255, green: 253/255, blue: 245/255))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(targetCount == t ? Color(red: 245/255, green: 158/255, blue: 11/255) : Color(red: 29/255, green: 77/255, blue: 62/255))
                                .cornerRadius(8)
                        }
                    }
                }

                Spacer()

                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 13))
                    Text("المجموع الكلي: \(totalCount)")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}
