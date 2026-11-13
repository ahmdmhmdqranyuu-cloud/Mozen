package com.muslim.azan.data

import android.content.Context
import android.content.SharedPreferences
import com.muslim.azan.model.CityLocation
import com.muslim.azan.model.QuranBookmark
import org.json.JSONArray
import org.json.JSONObject

class NativePreferences(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE)

    var cityName: String
        get() = prefs.getString("city_name", "مكة المكرمة") ?: "مكة المكرمة"
        set(value) = prefs.edit().putString("city_name", value).apply()

    var latitude: Double
        get() {
            val s = prefs.getString("city_latitude", "21.4225")
            return s?.toDoubleOrNull() ?: 21.4225
        }
        set(value) = prefs.edit().putString("city_latitude", value.toString()).apply()

    var longitude: Double
        get() {
            val s = prefs.getString("city_longitude", "39.8262")
            return s?.toDoubleOrNull() ?: 39.8262
        }
        set(value) = prefs.edit().putString("city_longitude", value.toString()).apply()

    var calculationMethod: String
        get() = prefs.getString("calc_method", "umm_al_qura") ?: "umm_al_qura"
        set(value) = prefs.edit().putString("calc_method", value).apply()

    var asrMethod: String
        get() = prefs.getString("asr_method", "standard") ?: "standard"
        set(value) = prefs.edit().putString("asr_method", value).apply()

    var azanVoice: String
        get() = prefs.getString("azan_voice", "makkah") ?: "makkah"
        set(value) = prefs.edit().putString("azan_voice", value).apply()

    var fajrVoice: String
        get() = prefs.getString("fajr_voice", "abdulbasit_fajr") ?: "abdulbasit_fajr"
        set(value) = prefs.edit().putString("fajr_voice", value).apply()

    var azanSoundEnabled: Boolean
        get() = prefs.getBoolean("azanSoundEnabled", true)
        set(value) = prefs.edit().putBoolean("azanSoundEnabled", value).apply()

    var prePrayerAlertEnabled: Boolean
        get() = prefs.getBoolean("pre_prayer_alert_enabled", true)
        set(value) = prefs.edit().putBoolean("pre_prayer_alert_enabled", value).apply()

    var totalTasbihCount: Int
        get() = prefs.getInt("total_tasbih_count", 0)
        set(value) = prefs.edit().putInt("total_tasbih_count", value).apply()

    var lastReadSurah: Int
        get() = prefs.getInt("last_read_surah", 1)
        set(value) = prefs.edit().putInt("last_read_surah", value).apply()

    var lastReadAyah: Int
        get() = prefs.getInt("last_read_ayah", 1)
        set(value) = prefs.edit().putInt("last_read_ayah", value).apply()

    var language: String
        get() = prefs.getString("app_language", "ar") ?: "ar"
        set(value) = prefs.edit().putString("app_language", value).apply()

    // Reminders
    var salawatEnabled: Boolean
        get() = prefs.getBoolean("salawat_enabled", true)
        set(value) = prefs.edit().putBoolean("salawat_enabled", value).apply()

    var salawatTime: String
        get() = prefs.getString("salawat_time", "08:00") ?: "08:00"
        set(value) = prefs.edit().putString("salawat_time", value).apply()

    var salawatRepeatInterval: Int
        get() = prefs.getInt("salawat_repeat_interval", 15)
        set(value) = prefs.edit().putInt("salawat_repeat_interval", value).apply()

    var morningAzkarEnabled: Boolean
        get() = prefs.getBoolean("morning_azkar_enabled", true)
        set(value) = prefs.edit().putBoolean("morning_azkar_enabled", value).apply()

    var morningAzkarTime: String
        get() = prefs.getString("morning_azkar_time", "06:30") ?: "06:30"
        set(value) = prefs.edit().putString("morning_azkar_time", value).apply()

    var eveningAzkarEnabled: Boolean
        get() = prefs.getBoolean("evening_azkar_enabled", true)
        set(value) = prefs.edit().putBoolean("evening_azkar_enabled", value).apply()

    var eveningAzkarTime: String
        get() = prefs.getString("evening_azkar_time", "17:00") ?: "17:00"
        set(value) = prefs.edit().putString("evening_azkar_time", value).apply()

    var musaharatiEnabled: Boolean
        get() = prefs.getBoolean("musaharati_enabled", false)
        set(value) = prefs.edit().putBoolean("musaharati_enabled", value).apply()

    var musaharatiTime: String
        get() = prefs.getString("musaharati_time", "03:30") ?: "03:30"
        set(value) = prefs.edit().putString("musaharati_time", value).apply()

    fun getBookmarks(): List<QuranBookmark> {
        val json = prefs.getString("quran_bookmarks_list", null) ?: return emptyList()
        val list = mutableListOf<QuranBookmark>()
        try {
            val arr = JSONArray(json)
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                list.add(
                    QuranBookmark(
                        id = o.optString("id", "${o.optInt("surahNumber")}_${o.optInt("ayahNumber")}"),
                        surahNumber = o.optInt("surahNumber"),
                        surahName = o.optString("surahName"),
                        ayahNumber = o.optInt("ayahNumber"),
                        timestamp = o.optLong("timestamp", System.currentTimeMillis())
                    )
                )
            }
        } catch (ignored: Exception) {}
        return list
    }

    fun addBookmark(surahNumber: Int, surahName: String, ayahNumber: Int) {
        val existing = getBookmarks().toMutableList()
        val id = "${surahNumber}_${ayahNumber}"
        if (existing.none { it.id == id }) {
            existing.add(
                QuranBookmark(
                    id = id,
                    surahNumber = surahNumber,
                    surahName = surahName,
                    ayahNumber = ayahNumber,
                    timestamp = System.currentTimeMillis()
                )
            )
            val arr = JSONArray()
            existing.forEach { b ->
                val o = JSONObject()
                o.put("id", b.id)
                o.put("surahNumber", b.surahNumber)
                o.put("surahName", b.surahName)
                o.put("ayahNumber", b.ayahNumber)
                o.put("timestamp", b.timestamp)
                arr.put(o)
            }
            prefs.edit().putString("quran_bookmarks_list", arr.toString()).apply()
        }
    }

    fun removeBookmark(id: String) {
        val existing = getBookmarks().filter { it.id != id }
        val arr = JSONArray()
        existing.forEach { b ->
            val o = JSONObject()
            o.put("id", b.id)
            o.put("surahNumber", b.surahNumber)
            o.put("surahName", b.surahName)
            o.put("ayahNumber", b.ayahNumber)
            o.put("timestamp", b.timestamp)
            arr.put(o)
        }
        prefs.edit().putString("quran_bookmarks_list", arr.toString()).apply()
    }

    var cityTimezoneId: String
        get() = prefs.getString("city_timezone_id", "Asia/Riyadh") ?: "Asia/Riyadh"
        set(value) = prefs.edit().putString("city_timezone_id", value).apply()

    var fajrOffsetMinutes: Int
        get() = prefs.getInt("offset_fajr", 0)
        set(value) = prefs.edit().putInt("offset_fajr", value.coerceIn(-30, 30)).apply()

    var dhuhrOffsetMinutes: Int
        get() = prefs.getInt("offset_dhuhr", 0)
        set(value) = prefs.edit().putInt("offset_dhuhr", value.coerceIn(-30, 30)).apply()

    var asrOffsetMinutes: Int
        get() = prefs.getInt("offset_asr", 0)
        set(value) = prefs.edit().putInt("offset_asr", value.coerceIn(-30, 30)).apply()

    var maghribOffsetMinutes: Int
        get() = prefs.getInt("offset_maghrib", 0)
        set(value) = prefs.edit().putInt("offset_maghrib", value.coerceIn(-30, 30)).apply()

    var ishaOffsetMinutes: Int
        get() = prefs.getInt("offset_isha", 0)
        set(value) = prefs.edit().putInt("offset_isha", value.coerceIn(-30, 30)).apply()

    fun setCity(city: CityLocation) {
        cityName = city.nameAr
        latitude = city.latitude
        longitude = city.longitude
        if (city.timezoneId.isNotEmpty()) {
            cityTimezoneId = city.timezoneId
        }
        if (city.recommendedCalcMethod.isNotEmpty()) {
            calculationMethod = city.recommendedCalcMethod
        }
    }

    fun setGpsLocation(nameAr: String, lat: Double, lng: Double, timezoneId: String) {
        cityName = nameAr
        latitude = lat
        longitude = lng
        cityTimezoneId = timezoneId
    }

    var canScheduleExactAlarms: Boolean
        get() = prefs.getBoolean("can_schedule_exact_alarms", true)
        set(value) = prefs.edit().putBoolean("can_schedule_exact_alarms", value).apply()

    var isIgnoringBatteryOptimizations: Boolean
        get() = prefs.getBoolean("is_ignoring_battery_optimizations", true)
        set(value) = prefs.edit().putBoolean("is_ignoring_battery_optimizations", value).apply()

    var suppressSpecialPermissionsPrompt: Boolean
        get() = prefs.getBoolean("suppress_special_permissions_prompt", false)
        set(value) = prefs.edit().putBoolean("suppress_special_permissions_prompt", value).apply()
}
