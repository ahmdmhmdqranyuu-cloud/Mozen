import SwiftUI
import UIKit

struct iOSWallpaperItem: Identifiable {
    let id: Int
    let title: String
    let category: String
    let verse: String
    let bgHex: String
}

public struct WallpapersView: View {
    @Environment(\.presentationMode) var presentationMode

    private let wallpapers: [iOSWallpaperItem] = [
        iOSWallpaperItem(id: 1, title: "الكعبة المشرفة", category: "مكة", verse: "إِنَّ أَوَّلَ بَيْتٍ وُضِعَ لِلنَّاسِ لَلَّذِي بِبَكَّةَ مُبَارَكًا", bgHex: "0D1B2A"),
        iOSWallpaperItem(id: 2, title: "المسجد النبوي", category: "المدينة", verse: "مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ", bgHex: "003822"),
        iOSWallpaperItem(id: 3, title: "المسجد الأقصى", category: "القدس", verse: "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى", bgHex: "14213D"),
        iOSWallpaperItem(id: 4, title: "لفظ الجلالة", category: "خط عربي", verse: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", bgHex: "09241C"),
        iOSWallpaperItem(id: 5, title: "الصلاة على النبي", category: "خط عربي", verse: "إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ", bgHex: "1B4332"),
        iOSWallpaperItem(id: 6, title: "آية الكرسي", category: "خط عربي", verse: "وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ", bgHex: "1A1A2E")
    ]

    @State private var selectedWp: iOSWallpaperItem? = nil
    @State private var saveSuccess: Bool = false

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
                Text("الخلفيات الإسلامية")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                Spacer()
                Image(systemName: "photo.fill")
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            // Grid
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                    ForEach(wallpapers) { wp in
                        Button(action: {
                            selectedWp = wp
                        }) {
                            VStack(spacing: 8) {
                                ZStack {
                                    Color(red: 19/255, green: 56/255, blue: 45/255)
                                        .frame(height: 180)
                                        .cornerRadius(14)

                                    VStack(spacing: 10) {
                                        Image(systemName: "moon.stars.fill")
                                            .font(.system(size: 28))
                                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                                        Text(wp.verse)
                                            .font(.system(size: 11, weight: .bold))
                                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                                            .multilineTextAlignment(.center)
                                            .padding(.horizontal, 10)
                                    }
                                }

                                Text(wp.title)
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
        .alert(isPresented: $saveSuccess) {
            Alert(
                title: Text("تم الحفظ بنجاح"),
                message: Text("تم حفظ الخلفية في ألبوم صور جهازك."),
                dismissButton: .default(Text("حسناً"))
            )
        }
        .sheet(item: $selectedWp) { wp in
            WallpaperPreviewSheet(wp: wp, onSave: {
                saveWallpaperToPhotos(wp: wp)
                saveSuccess = true
            })
        }
    }

    private func saveWallpaperToPhotos(wp: iOSWallpaperItem) {
        let size = CGSize(width: 1080, height: 1920)
        let renderer = UIGraphicsImageRenderer(size: size)
        let img = renderer.image { ctx in
            // Background
            UIColor(red: 9/255, green: 36/255, blue: 28/255, alpha: 1.0).setFill()
            ctx.fill(CGRect(origin: .zero, size: size))

            // Border
            let borderRect = CGRect(x: 40, y: 40, width: size.width - 80, height: size.height - 80)
            let borderPath = UIBezierPath(roundedRect: borderRect, cornerRadius: 30)
            UIColor(red: 245/255, green: 158/255, blue: 11/255, alpha: 0.5).setStroke()
            borderPath.lineWidth = 4
            borderPath.stroke()

            // Text
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .center
            let attrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 48),
                .foregroundColor: UIColor.white,
                .paragraphStyle: paragraphStyle
            ]
            let textRect = CGRect(x: 80, y: size.height / 2 - 100, width: size.width - 160, height: 200)
            (wp.verse as NSString).draw(in: textRect, withAttributes: attrs)
        }
        UIImageWriteToSavedPhotosAlbum(img, nil, nil, nil)
    }
}

struct WallpaperPreviewSheet: View {
    let wp: iOSWallpaperItem
    let onSave: () -> Void
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        VStack(spacing: 20) {
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Text("إغلاق")
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                }
                Spacer()
                Text(wp.title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            ZStack {
                Color(red: 19/255, green: 56/255, blue: 45/255)
                    .cornerRadius(20)

                VStack(spacing: 16) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 40))
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))

                    Text(wp.verse)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
            }
            .padding(.horizontal, 20)
            .frame(maxHeight: 380)

            Button(action: {
                onSave()
                presentationMode.wrappedValue.dismiss()
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "square.and.arrow.down.fill")
                    Text("حفظ في ألبوم الصور")
                        .font(.system(size: 15, weight: .bold))
                }
                .foregroundColor(Color(red: 9/255, green: 36/255, blue: 28/255))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color(red: 245/255, green: 158/255, blue: 11/255))
                .cornerRadius(14)
            }
            .padding(.horizontal, 20)

            Spacer()
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}
