import SwiftUI

public struct QiblaView: View {
    @ObservedObject var locationManager = LocationAndCompassManager.shared
    @Environment(\.presentationMode) var presentationMode

    public init() {}

    public var body: some View {
        VStack(spacing: 24) {
            // Header
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 18, weight: .bold))
                }
                Spacer()
                Text("اتجاه القبلة المشرفة")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "safari.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            Spacer()

            // Info Card
            VStack(spacing: 8) {
                Text("درجة القبلة من الشمال الحقيقي")
                    .font(.system(size: 13))
                    .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                Text("\(Int(locationManager.qiblaBearing))°")
                    .font(.system(size: 38, weight: .bold))
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                Text("وجه هاتفك حتى تتطابق إبرة القبلة مع علامة الكعبة")
                    .font(.system(size: 12))
                    .foregroundColor(Color(red: 110/255, green: 231/255, blue: 183/255))
            }
            .padding(.horizontal, 20)

            // Compass Dial
            ZStack {
                // Outer ring
                Circle()
                    .stroke(Color(red: 29/255, green: 77/255, blue: 62/255), lineWidth: 8)
                    .frame(width: 280, height: 280)

                // Dial Background
                Circle()
                    .fill(Color(red: 19/255, green: 56/255, blue: 45/255))
                    .frame(width: 264, height: 264)

                // Cardinal marks
                VStack {
                    Text("ش")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(red: 239/255, green: 68/255, blue: 68/255))
                    Spacer()
                    Text("ج")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                }
                .frame(height: 230)

                HStack {
                    Text("غ")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                    Spacer()
                    Text("شـ")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                }
                .frame(width: 230)

                // Qibla Indicator Needle (Rotates according to compass heading and qibla bearing)
                VStack {
                    Image(systemName: "location.north.fill")
                        .font(.system(size: 40))
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .shadow(color: Color(red: 245/255, green: 158/255, blue: 11/255).opacity(0.6), radius: 6)
                    Spacer()
                }
                .frame(height: 200)
                .rotationEffect(.degrees(locationManager.qiblaBearing - locationManager.compassHeading))
                .animation(.easeInOut(duration: 0.2), value: locationManager.compassHeading)

                // Kaaba Center Icon
                Circle()
                    .fill(Color(red: 9/255, green: 36/255, blue: 28/255))
                    .frame(width: 60, height: 60)
                    .overlay(
                        Image(systemName: "cube.fill")
                            .font(.system(size: 24))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                    )
            }

            Spacer()

            // Status Footer
            HStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))
                Text("الموقع: \(String(format: "%.2f", locationManager.userLatitude)), \(String(format: "%.2f", locationManager.userLongitude))")
                    .font(.system(size: 12))
                    .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
            }
            .padding(.bottom, 24)
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}
