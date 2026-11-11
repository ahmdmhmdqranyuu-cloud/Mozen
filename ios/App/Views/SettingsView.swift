import SwiftUI

public struct SettingsView: View {
    @State private var expandedSection: Int? = nil
    @State private var azanSoundEnabled: Bool = true
    @State private var prePrayerAlert: Bool = true
    @State private var salawatEnabled: Bool = true
    @State private var cityName: String = "مكة المكرمة"

    public init() {}

    public var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                Text("الإعدادات العامة")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                    .padding(.top, 10)

                // 1. Profile
                CollapsibleSettingsSection(
                    title: "1. الملف الشخصي والإحصائيات",
                    iconName: "person.fill",
                    isExpanded: expandedSection == 1,
                    onToggle: { expandedSection = (expandedSection == 1 ? nil : 1) }
                ) {
                    VStack(alignment: .trailing, spacing: 6) {
                        Text("مستخدم تطبيق المؤذن المبارك")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                        Text("البيانات والإحصائيات محفوظة محليًا بأمان تام.")
                            .font(.system(size: 12))
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                    }
                }

                // 2. Permissions
                CollapsibleSettingsSection(
                    title: "2. الأذونات وصلاحيات التنبيه",
                    iconName: "bell.badge.fill",
                    isExpanded: expandedSection == 2,
                    onToggle: { expandedSection = (expandedSection == 2 ? nil : 2) }
                ) {
                    Text("يستخدم التطبيق إشعارات iOS الرسمية لتنبيهك بدخول وقت كل صلاة مع تشغيل الصوت حتى مع إغلاق التطبيق.")
                        .font(.system(size: 12))
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                }

                // 3. Location & Time
                CollapsibleSettingsSection(
                    title: "3. تحديد الموقع والوقت",
                    iconName: "location.fill",
                    isExpanded: expandedSection == 3,
                    onToggle: { expandedSection = (expandedSection == 3 ? nil : 3) }
                ) {
                    Text("المدينة المحددة: \(cityName)")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                }

                // 4. Language
                CollapsibleSettingsSection(
                    title: "4. اللغة",
                    iconName: "globe",
                    isExpanded: expandedSection == 4,
                    onToggle: { expandedSection = (expandedSection == 4 ? nil : 4) }
                ) {
                    Text("اللغة الحالية: العربية (RTL)")
                        .font(.system(size: 13))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                }

                // 5. Azan Settings
                CollapsibleSettingsSection(
                    title: "5. إعدادات الأذان",
                    iconName: "speaker.wave.3.fill",
                    isExpanded: expandedSection == 5,
                    onToggle: { expandedSection = (expandedSection == 5 ? nil : 5) }
                ) {
                    Toggle("تشغيل صوت الأذان تلقائيًا", isOn: $azanSoundEnabled)
                        .accentColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 13))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                }

                // 6. Azkar Reminders
                CollapsibleSettingsSection(
                    title: "6. إعداد الأذكار والصلوات",
                    iconName: "alarm.fill",
                    isExpanded: expandedSection == 6,
                    onToggle: { expandedSection = (expandedSection == 6 ? nil : 6) }
                ) {
                    Toggle("تذكير الصلاة على النبي ﷺ", isOn: $salawatEnabled)
                        .accentColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 13))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                }

                // 7. Ramadan
                CollapsibleSettingsSection(
                    title: "7. رمضان",
                    iconName: "moon.fill",
                    isExpanded: expandedSection == 7,
                    onToggle: { expandedSection = (expandedSection == 7 ? nil : 7) }
                ) {
                    Text("إمساكية رمضان وتنبيهات المسحراتي ومدفع الإفطار.")
                        .font(.system(size: 12))
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                }

                // 8. Privacy Policy
                CollapsibleSettingsSection(
                    title: "8. سياسة الخصوصية",
                    iconName: "lock.shield.fill",
                    isExpanded: expandedSection == 8,
                    onToggle: { expandedSection = (expandedSection == 8 ? nil : 8) }
                ) {
                    Text("نحافظ على خصوصيتك كاملة دون أي تعقب أو إرسال بياناتك لخوادم.")
                        .font(.system(size: 12))
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                }

                // 9. About
                CollapsibleSettingsSection(
                    title: "9. حول التطبيق",
                    iconName: "info.circle.fill",
                    isExpanded: expandedSection == 9,
                    onToggle: { expandedSection = (expandedSection == 9 ? nil : 9) }
                ) {
                    Text("تطبيق المؤذن Native الإصدار 2.1.0 • صدقة جارية")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                }

                // 10. Cache Management
                CollapsibleSettingsSection(
                    title: "10. إدارة الذاكرة والتخزين",
                    iconName: "trash.fill",
                    isExpanded: expandedSection == 10,
                    onToggle: { expandedSection = (expandedSection == 10 ? nil : 10) }
                ) {
                    Button(action: {
                        _ = MediaStorageManager.shared.cleanTemporaryCacheOnly()
                    }) {
                        Text("تنظيف الملفات المؤقتة فقط (Cache)")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.vertical, 8)
                            .frame(maxWidth: .infinity)
                            .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                            .cornerRadius(10)
                    }
                }
            }
            .padding(16)
        }
        .background(Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all))
    }
}

struct CollapsibleSettingsSection<Content: View>: View {
    let title: String
    let iconName: String
    let isExpanded: Bool
    let onToggle: () -> Void
    let content: () -> Content

    var body: some View {
        VStack(alignment: .trailing, spacing: 10) {
            Button(action: onToggle) {
                HStack {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                        .font(.system(size: 14))

                    Spacer()

                    Text(title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))

                    Image(systemName: iconName)
                        .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                        .font(.system(size: 16))
                }
            }

            if isExpanded {
                Divider().background(Color(red: 31/255, green: 81/255, blue: 65/255))
                content()
                    .padding(.top, 4)
            }
        }
        .padding(16)
        .background(Color(red: 19/255, green: 56/255, blue: 45/255))
        .cornerRadius(16)
    }
}
