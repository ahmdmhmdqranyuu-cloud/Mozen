package com.muslim.azan.ui.navigation

sealed class Screen(val route: String, val titleAr: String) {
    object Home : Screen("home", "الرئيسية")
    object PrayerTimes : Screen("prayers", "مواقيت الصلاة")
    object Quran : Screen("quran", "المصحف الشريف")
    object Azkar : Screen("azkar", "الأذكار")
    object Tasbih : Screen("tasbih", "المسبحة الإلكترونية")
    object Qibla : Screen("qibla", "اتجاه القبلة")
    object Hadith : Screen("hadith", "الأحاديث النبوية")
    object Duas : Screen("duas", "الأدعية المأثورة")
    object Ramadan : Screen("ramadan", "شهر رمضان المبارك")
    object Seerah : Screen("seerah", "السيرة النبوية")
    object Prophets : Screen("prophets", "قصص الأنبياء")
    object Zakat : Screen("zakat", "حاسبة الزكاة")
    object Quiz : Screen("quiz", "المسابقات الإسلامية")
    object Hajj : Screen("hajj", "الحج والعمرة")
    object Wallpapers : Screen("wallpapers", "الخلفيات الإسلامية")
    object Profile : Screen("profile", "الملف الشخصي والإحصائيات")
    object Settings : Screen("settings", "الإعدادات")
}
