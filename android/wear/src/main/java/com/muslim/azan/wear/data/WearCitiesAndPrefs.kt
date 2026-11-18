package com.muslim.azan.wear.data

import android.content.Context
import android.content.SharedPreferences
import com.muslim.azan.wear.calc.AsrMethod
import com.muslim.azan.wear.calc.DstMode
import com.muslim.azan.wear.calc.HighLatitudeRule
import com.muslim.azan.wear.calc.WearCityLocation

object WearCities {
    val ALL: List<WearCityLocation> = listOf(
        WearCityLocation("makkah", "مكة المكرمة", "السعودية", 21.4225, 39.8262, "Asia/Riyadh"),
        WearCityLocation("madinah", "المدينة المنورة", "السعودية", 24.4672, 39.6111, "Asia/Riyadh"),
        WearCityLocation("riyadh", "الرياض", "السعودية", 24.7136, 46.6753, "Asia/Riyadh"),
        WearCityLocation("jeddah", "جدة", "السعودية", 21.4858, 39.1925, "Asia/Riyadh"),
        WearCityLocation("cairo", "القاهرة", "مصر", 30.0444, 31.2357, "Africa/Cairo"),
        WearCityLocation("alexandria", "الإسكندرية", "مصر", 31.2001, 29.9187, "Africa/Cairo"),
        WearCityLocation("jerusalem", "القدس", "فلسطين", 31.7683, 35.2137, "Asia/Jerusalem"),
        WearCityLocation("dubai", "دبي", "الإمارات", 25.2048, 55.2708, "Asia/Dubai"),
        WearCityLocation("abudhabi", "أبو ظبي", "الإمارات", 24.4539, 54.3773, "Asia/Dubai"),
        WearCityLocation("doha", "الدوحة", "قطر", 25.2854, 51.5310, "Asia/Qatar"),
        WearCityLocation("kuwait", "الكويت", "الكويت", 29.3759, 47.9774, "Asia/Kuwait"),
        WearCityLocation("manama", "المنامة", "البحرين", 26.2285, 50.5860, "Asia/Bahrain"),
        WearCityLocation("muscat", "مسقط", "عمان", 23.5880, 58.3829, "Asia/Muscat"),
        WearCityLocation("amman", "عمّان", "الأردن", 31.9454, 35.9284, "Asia/Amman"),
        WearCityLocation("beirut", "بيروت", "لبنان", 33.8938, 35.5018, "Asia/Beirut"),
        WearCityLocation("damascus", "دمشق", "سوريا", 33.5138, 36.2765, "Asia/Damascus"),
        WearCityLocation("baghdad", "بغداد", "العراق", 33.3152, 44.3661, "Asia/Baghdad"),
        WearCityLocation("sanaa", "صنعاء", "اليمن", 15.3694, 44.1910, "Asia/Aden"),
        WearCityLocation("khartoum", "الخرطوم", "السودان", 15.5007, 32.5599, "Africa/Khartoum"),
        WearCityLocation("tunis", "تونس", "تونس", 36.8065, 10.1815, "Africa/Tunis"),
        WearCityLocation("algiers", "الجزائر", "الجزائر", 36.7538, 3.0588, "Africa/Algiers"),
        WearCityLocation("rabat", "الرباط", "المغرب", 34.0209, -6.8416, "Africa/Casablanca"),
        WearCityLocation("casablanca", "الدار البيضاء", "المغرب", 33.5731, -7.5898, "Africa/Casablanca"),
        WearCityLocation("istanbul", "إسطنبول", "تركيا", 41.0082, 28.9784, "Europe/Istanbul"),
        WearCityLocation("ankara", "أنقرة", "تركيا", 39.9334, 32.8597, "Europe/Istanbul"),
        WearCityLocation("jakarta", "جاكرتا", "إندونيسيا", -6.2088, 106.8456, "Asia/Jakarta"),
        WearCityLocation("kualalumpur", "كوالالمبور", "ماليزيا", 3.1390, 101.6869, "Asia/Kuala_Lumpur"),
        WearCityLocation("islamabad", "إسلام آباد", "باكستان", 33.6844, 73.0479, "Asia/Karachi"),
        WearCityLocation("london", "لندن", "بريطانيا", 51.5072, -0.1276, "Europe/London"),
        WearCityLocation("paris", "باريس", "فرنسا", 48.8566, 2.3522, "Europe/Paris"),
        WearCityLocation("berlin", "برلين", "ألمانيا", 52.5200, 13.4050, "Europe/Berlin"),
        WearCityLocation("oslo", "أوسلو", "النرويج", 59.9139, 10.7522, "Europe/Oslo"),
        WearCityLocation("newyork", "نيويورك", "أمريكا", 40.7128, -74.0060, "America/New_York"),
        WearCityLocation("toronto", "تورنتو", "كندا", 43.6532, -79.3832, "America/Toronto"),
        WearCityLocation("sydney", "سيدني", "أستراليا", -33.8688, 151.2093, "Australia/Sydney")
    )

    fun defaultMethodForCity(cityId: String): String =
        when (cityId) {
            "makkah", "madinah", "riyadh", "jeddah" -> "makkah"
            "cairo", "alexandria" -> "egypt"
            "kuwait" -> "kuwait"
            "istanbul", "ankara" -> "diyanet"
            "islamabad" -> "karachi"
            "newyork", "toronto" -> "isna"
            else -> "mwl"
        }

    fun findById(id: String?): WearCityLocation =
        ALL.firstOrNull { it.id == id } ?: ALL.first()
}

class WearPreferences(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("wear_prayer_prefs", Context.MODE_PRIVATE)

    var cityId: String
        get() = prefs.getString("city_id", "makkah") ?: "makkah"
        set(value) = prefs.edit().putString("city_id", value).apply()

    var calcMethodId: String
        get() = prefs.getString("calc_method_id", "makkah") ?: "makkah"
        set(value) = prefs.edit().putString("calc_method_id", value).apply()

    var asrMethod: AsrMethod
        get() = AsrMethod.fromId(prefs.getString("asr_method", "standard"))
        set(value) = prefs.edit().putString("asr_method", value.id).apply()

    var highLatitudeRule: HighLatitudeRule
        get() = HighLatitudeRule.fromId(prefs.getString("high_lat_rule", "angle_based"))
        set(value) = prefs.edit().putString("high_lat_rule", value.id).apply()

    var dstMode: DstMode
        get() = DstMode.fromId(prefs.getString("dst_mode", "auto"))
        set(value) = prefs.edit().putString("dst_mode", value.id).apply()
}
