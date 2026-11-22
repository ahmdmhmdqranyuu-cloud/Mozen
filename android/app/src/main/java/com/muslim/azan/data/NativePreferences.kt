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

    init {
        val defaultsVer = prefs.getInt("reminders_defaults_version", 1)
        if (defaultsVer < 2) {
            val editor = prefs.edit()
            val prevMorning = prefs.getString("morning_azkar_time", null)
            if (prevMorning == null || prevMorning == "06:30") {
                editor.putString("morning_azkar_time", "08:00")
            }
            val prevEvening = prefs.getString("evening_azkar_time", null)
            if (prevEvening == null || prevEvening == "17:00") {
                editor.putString("evening_azkar_time", "21:00")
            }
            val prevSalawatStart = prefs.getString("salawat_time", null)
            if (prevSalawatStart == null || prevSalawatStart == "08:00") {
                editor.putString("salawat_time", "06:00")
            }
            val prevSalawatEnd = prefs.getString("salawat_end_time", null)
            if (prevSalawatEnd == null || prevSalawatEnd == "22:00") {
                editor.putString("salawat_end_time", "23:59")
            }
            if (!prefs.contains("salawat_auto_after_fajr_iqama")) {
                editor.putBoolean("salawat_auto_after_fajr_iqama", true)
            }
            editor.putInt("reminders_defaults_version", 2).apply()
        }
    }

    var calculationMethod: String
        get() = prefs.getString("calc_method", "umm_al_qura") ?: "umm_al_qura"
        set(value) = prefs.edit().putString("calc_method", value).apply()

    var asrMethod: String
        get() = prefs.getString("asr_method", "standard") ?: "standard"
        set(value) = prefs.edit().putString("asr_method", value).apply()

    var highLatitudeRule: String
        get() = prefs.getString("high_latitude_rule", "angle_based") ?: "angle_based"
        set(value) = prefs.edit().putString("high_latitude_rule", value).apply()

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

    var volumeKeyStopsAzan: Boolean
        get() = prefs.getBoolean("volume_key_stops_azan", true)
        set(value) = prefs.edit().putBoolean("volume_key_stops_azan", value).apply()

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

    var onboardingCompleted: Boolean
        get() = prefs.getBoolean("onboarding_completed", false)
        set(value) = prefs.edit().putBoolean("onboarding_completed", value).apply()

    // Reminders
    var salawatEnabled: Boolean
        get() = prefs.getBoolean("salawat_enabled", true)
        set(value) = prefs.edit().putBoolean("salawat_enabled", value).apply()

    var salawatAutoAfterFajrIqama: Boolean
        get() = prefs.getBoolean("salawat_auto_after_fajr_iqama", true)
        set(value) = prefs.edit().putBoolean("salawat_auto_after_fajr_iqama", value).apply()

    var salawatTime: String
        get() = prefs.getString("salawat_time", "06:00") ?: "06:00"
        set(value) = prefs.edit().putString("salawat_time", value).apply()

    var salawatEndTime: String
        get() = prefs.getString("salawat_end_time", "23:59") ?: "23:59"
        set(value) = prefs.edit().putString("salawat_end_time", value).apply()

    var salawatRepeatType: String
        get() = prefs.getString("salawat_repeat_type", "repeat") ?: "repeat"
        set(value) = prefs.edit().putString("salawat_repeat_type", value).apply()

    var salawatRepeatInterval: Int
        get() = prefs.getInt("salawat_repeat_interval", 15).coerceIn(1, 240)
        set(value) = prefs.edit().putInt("salawat_repeat_interval", value.coerceIn(1, 240)).apply()

    var salawatRepeatUnit: String
        get() = prefs.getString("salawat_repeat_unit", "minutes") ?: "minutes"
        set(value) = prefs.edit().putString("salawat_repeat_unit", value).apply()

    var salawatVolumePercent: Int
        get() = prefs.getInt("salawat_volume_percent", 85).coerceIn(0, 100)
        set(value) = prefs.edit().putInt("salawat_volume_percent", value.coerceIn(0, 100)).apply()

    var morningAzkarEnabled: Boolean
        get() = prefs.getBoolean("morning_azkar_enabled", true)
        set(value) = prefs.edit().putBoolean("morning_azkar_enabled", value).apply()

    var morningAzkarTime: String
        get() = prefs.getString("morning_azkar_time", "08:00") ?: "08:00"
        set(value) = prefs.edit().putString("morning_azkar_time", value).apply()

    var eveningAzkarEnabled: Boolean
        get() = prefs.getBoolean("evening_azkar_enabled", true)
        set(value) = prefs.edit().putBoolean("evening_azkar_enabled", value).apply()

    var eveningAzkarTime: String
        get() = prefs.getString("evening_azkar_time", "21:00") ?: "21:00"
        set(value) = prefs.edit().putString("evening_azkar_time", value).apply()

    var azkarVolumePercent: Int
        get() = prefs.getInt("azkar_volume_percent", 100).coerceIn(0, 100)
        set(value) = prefs.edit().putInt("azkar_volume_percent", value.coerceIn(0, 100)).apply()

    var musaharatiEnabled: Boolean
        get() = prefs.getBoolean("musaharati_enabled", false)
        set(value) = prefs.edit().putBoolean("musaharati_enabled", value).apply()

    var musaharatiTime: String
        get() = prefs.getString("musaharati_time", "03:30") ?: "03:30"
        set(value) = prefs.edit().putString("musaharati_time", value).apply()

    var musaharatiAudio: String
        get() = prefs.getString("musaharati_audio", "musaharati_1") ?: "musaharati_1"
        set(value) = prefs.edit().putString("musaharati_audio", value).apply()

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
        set(value) = prefs.edit().putInt("offset_fajr", value.coerceIn(-60, 60)).apply()

    var sunriseOffsetMinutes: Int
        get() = prefs.getInt("offset_sunrise", 0)
        set(value) = prefs.edit().putInt("offset_sunrise", value.coerceIn(-60, 60)).apply()

    var duhaOffsetMinutes: Int
        get() = prefs.getInt("offset_duha", 0)
        set(value) = prefs.edit().putInt("offset_duha", value.coerceIn(-60, 60)).apply()

    var dhuhrOffsetMinutes: Int
        get() = prefs.getInt("offset_dhuhr", 0)
        set(value) = prefs.edit().putInt("offset_dhuhr", value.coerceIn(-60, 60)).apply()

    var asrOffsetMinutes: Int
        get() = prefs.getInt("offset_asr", 0)
        set(value) = prefs.edit().putInt("offset_asr", value.coerceIn(-60, 60)).apply()

    var maghribOffsetMinutes: Int
        get() = prefs.getInt("offset_maghrib", 0)
        set(value) = prefs.edit().putInt("offset_maghrib", value.coerceIn(-60, 60)).apply()

    var ishaOffsetMinutes: Int
        get() = prefs.getInt("offset_isha", 0)
        set(value) = prefs.edit().putInt("offset_isha", value.coerceIn(-60, 60)).apply()

    fun getOffsetForPrayer(key: String): Int = when (key) {
        "fajr" -> fajrOffsetMinutes
        "sunrise" -> sunriseOffsetMinutes
        "duha" -> duhaOffsetMinutes
        "dhuhr" -> dhuhrOffsetMinutes
        "asr" -> asrOffsetMinutes
        "maghrib" -> maghribOffsetMinutes
        "isha" -> ishaOffsetMinutes
        else -> 0
    }

    fun setOffsetForPrayer(key: String, minutes: Int) {
        val clamped = minutes.coerceIn(-60, 60)
        when (key) {
            "fajr" -> fajrOffsetMinutes = clamped
            "sunrise" -> sunriseOffsetMinutes = clamped
            "duha" -> duhaOffsetMinutes = clamped
            "dhuhr" -> dhuhrOffsetMinutes = clamped
            "asr" -> asrOffsetMinutes = clamped
            "maghrib" -> maghribOffsetMinutes = clamped
            "isha" -> ishaOffsetMinutes = clamped
        }
    }

    fun getPrayerConfig(prayerKey: String): com.muslim.azan.model.PrayerSettingConfig {
        val defaultName = prayerArabicName(prayerKey)
        val defaultVoice = if (prayerKey == "fajr") fajrVoice else azanVoice
        val isObligatory = prayerKey in listOf("fajr", "dhuhr", "asr", "maghrib", "isha")
        val isDuha = prayerKey == "duha"
        val raw = prefs.getString("prayer_config_$prayerKey", null)
        if (raw.isNullOrBlank()) {
            return com.muslim.azan.model.PrayerSettingConfig(
                prayerKey = prayerKey,
                arabicName = defaultName,
                offsetMinutes = getOffsetForPrayer(prayerKey),
                soundEnabled = if (isObligatory || isDuha) (if (isObligatory) azanSoundEnabled else true) else false,
                volumePercent = 100,
                preAlertEnabled = if (isObligatory) prePrayerAlertEnabled else false,
                preAlertMinutes = 15,
                preAlertVoice = "pre_prayer_15m",
                silentDuringPrayer = false,
                azanVoice = if (isObligatory) defaultVoice else if (isDuha) "duha_surah" else "salawat_1",
                alertMode = if (isObligatory || isDuha) "full_azan" else "short_tone",
                iqamaVoice = if (isObligatory) "iqama_1" else "none",
                duaAfterPrayerEnabled = isObligatory,
                didYouPrayEnabled = true
            )
        }
        return try {
            val o = JSONObject(raw)
            com.muslim.azan.model.PrayerSettingConfig(
                prayerKey = prayerKey,
                arabicName = defaultName,
                offsetMinutes = o.optInt("offsetMinutes", getOffsetForPrayer(prayerKey)).coerceIn(-60, 60),
                soundEnabled = o.optBoolean("soundEnabled", if (isObligatory) azanSoundEnabled else false),
                volumePercent = o.optInt("volumePercent", 100).coerceIn(0, 100),
                preAlertEnabled = o.optBoolean("preAlertEnabled", if (isObligatory) prePrayerAlertEnabled else false),
                preAlertMinutes = o.optInt("preAlertMinutes", 15).coerceIn(1, 60),
                preAlertVoice = o.optString("preAlertVoice", "pre_prayer_15m"),
                silentDuringPrayer = o.optBoolean("silentDuringPrayer", false),
                azanVoice = o.optString("azanVoice", if (isObligatory) defaultVoice else "salawat_1"),
                alertMode = o.optString("alertMode", if (isObligatory) "full_azan" else "short_tone"),
                iqamaVoice = o.optString("iqamaVoice", if (isObligatory) "iqama_1" else "none"),
                duaAfterPrayerEnabled = o.optBoolean("duaAfterPrayerEnabled", isObligatory),
                didYouPrayEnabled = o.optBoolean("didYouPrayEnabled", true)
            )
        } catch (_: Exception) {
            com.muslim.azan.model.PrayerSettingConfig(
                prayerKey = prayerKey,
                arabicName = defaultName,
                offsetMinutes = getOffsetForPrayer(prayerKey)
            )
        }
    }

    fun savePrayerConfig(config: com.muslim.azan.model.PrayerSettingConfig) {
        setOffsetForPrayer(config.prayerKey, config.offsetMinutes)
        val o = JSONObject().apply {
            put("prayerKey", config.prayerKey)
            put("offsetMinutes", config.offsetMinutes.coerceIn(-60, 60))
            put("soundEnabled", config.soundEnabled)
            put("volumePercent", config.volumePercent.coerceIn(0, 100))
            put("preAlertEnabled", config.preAlertEnabled)
            put("preAlertMinutes", config.preAlertMinutes.coerceIn(1, 60))
            put("preAlertVoice", config.preAlertVoice)
            put("silentDuringPrayer", config.silentDuringPrayer)
            put("azanVoice", config.azanVoice)
            put("alertMode", config.alertMode)
            put("iqamaVoice", config.iqamaVoice)
            put("duaAfterPrayerEnabled", config.duaAfterPrayerEnabled)
            put("didYouPrayEnabled", config.didYouPrayEnabled)
        }
        prefs.edit().putString("prayer_config_${config.prayerKey}", o.toString()).apply()
    }

    fun applyConfigToAllPrayers(source: com.muslim.azan.model.PrayerSettingConfig) {
        for (key in ALL_PRAYER_KEYS) {
            val existing = getPrayerConfig(key)
            val resolvedVoice = if (key == "fajr" && source.prayerKey != "fajr" && source.azanVoice in listOf("makkah", "madinah", "alaqsa", "cairo", "alafasy", "abdulbasit", "hussary", "mohamed_rifaat", "mustafa_ismail", "nasser_alqatami")) {
                existing.azanVoice
            } else {
                source.azanVoice
            }
            savePrayerConfig(
                existing.copy(
                    soundEnabled = source.soundEnabled,
                    volumePercent = source.volumePercent,
                    preAlertEnabled = source.preAlertEnabled,
                    preAlertMinutes = source.preAlertMinutes,
                    preAlertVoice = source.preAlertVoice,
                    silentDuringPrayer = source.silentDuringPrayer,
                    azanVoice = resolvedVoice,
                    alertMode = source.alertMode,
                    iqamaVoice = source.iqamaVoice,
                    duaAfterPrayerEnabled = source.duaAfterPrayerEnabled,
                    didYouPrayEnabled = source.didYouPrayEnabled
                )
            )
        }
    }

    fun getSavedWallpapers(): List<com.muslim.azan.model.SavedWallpaperRecord> {
        val raw = prefs.getString("saved_wallpapers_list", null) ?: return emptyList()
        val list = mutableListOf<com.muslim.azan.model.SavedWallpaperRecord>()
        try {
            val arr = JSONArray(raw)
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                list.add(
                    com.muslim.azan.model.SavedWallpaperRecord(
                        id = o.optString("id"),
                        titleAr = o.optString("titleAr"),
                        category = o.optString("category"),
                        imageUrl = o.optString("imageUrl"),
                        localUriString = o.optString("localUriString"),
                        savedAtMs = o.optLong("savedAtMs", System.currentTimeMillis())
                    )
                )
            }
        } catch (_: Exception) {}
        return list
    }

    fun addSavedWallpaper(record: com.muslim.azan.model.SavedWallpaperRecord) {
        val list = getSavedWallpapers().filter { it.id != record.id }.toMutableList()
        list.add(0, record)
        val arr = JSONArray()
        list.forEach { item ->
            val o = JSONObject().apply {
                put("id", item.id)
                put("titleAr", item.titleAr)
                put("category", item.category)
                put("imageUrl", item.imageUrl)
                put("localUriString", item.localUriString)
                put("savedAtMs", item.savedAtMs)
            }
            arr.put(o)
        }
        prefs.edit().putString("saved_wallpapers_list", arr.toString()).apply()
    }

    fun removeSavedWallpaper(id: String) {
        val list = getSavedWallpapers().filter { it.id != id }
        val arr = JSONArray()
        list.forEach { item ->
            val o = JSONObject().apply {
                put("id", item.id)
                put("titleAr", item.titleAr)
                put("category", item.category)
                put("imageUrl", item.imageUrl)
                put("localUriString", item.localUriString)
                put("savedAtMs", item.savedAtMs)
            }
            arr.put(o)
        }
        prefs.edit().putString("saved_wallpapers_list", arr.toString()).apply()
    }

    companion object {
        val ALL_PRAYER_KEYS = listOf("fajr", "sunrise", "duha", "dhuhr", "asr", "maghrib", "isha")

        fun prayerArabicName(key: String): String = when (key) {
            "fajr" -> "الفجر"
            "sunrise" -> "الشروق"
            "duha" -> "صلاة الضحى"
            "dhuhr" -> "الظهر"
            "asr" -> "العصر"
            "maghrib" -> "المغرب"
            "isha" -> "العشاء"
            else -> "الصلاة"
        }
    }

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
        activeLocationSource = if (city.isCachedOnline) "online" else "manual"
        activeLocationPrecision = LocationPrecision.MANUAL.code
        activeLocationAccuracyMeters = 0
        activeLocationUpdatedAtMs = System.currentTimeMillis()
        val parts = listOfNotNull(
            city.country.takeIf { it.isNotBlank() },
            city.stateAr.takeIf { it.isNotBlank() },
            city.district.takeIf { it.isNotBlank() }
        )
        activeLocationHierarchy = parts.joinToString(" • ")
    }

    fun setGpsLocation(
        nameAr: String,
        lat: Double,
        lng: Double,
        timezoneId: String,
        sourceTag: String = "gps",
        hierarchyText: String = "",
        precisionTag: String = LocationPrecision.PRECISE.code,
        accuracyMeters: Int = 0,
        updatedAtMs: Long = System.currentTimeMillis()
    ) {
        cityName = nameAr
        latitude = lat
        longitude = lng
        cityTimezoneId = timezoneId
        activeLocationSource = sourceTag
        activeLocationHierarchy = hierarchyText
        activeLocationPrecision = precisionTag
        activeLocationAccuracyMeters = accuracyMeters
        activeLocationUpdatedAtMs = updatedAtMs
    }

    var activeLocationSource: String
        get() = prefs.getString("active_location_source", "manual") ?: "manual"
        set(value) = prefs.edit().putString("active_location_source", value).apply()

    var activeLocationHierarchy: String
        get() = prefs.getString("active_location_hierarchy", "") ?: ""
        set(value) = prefs.edit().putString("active_location_hierarchy", value).apply()

    var activeLocationPrecision: String
        get() = prefs.getString("active_location_precision", LocationPrecision.MANUAL.code)
            ?: LocationPrecision.MANUAL.code
        set(value) = prefs.edit().putString("active_location_precision", value).apply()

    var activeLocationAccuracyMeters: Int
        get() = prefs.getInt("active_location_accuracy_meters", 0)
        set(value) = prefs.edit().putInt("active_location_accuracy_meters", value.coerceAtLeast(0)).apply()

    var activeLocationUpdatedAtMs: Long
        get() = prefs.getLong("active_location_updated_at_ms", 0L)
        set(value) = prefs.edit().putLong("active_location_updated_at_ms", value.coerceAtLeast(0L)).apply()

    fun saveLastGpsResult(result: GpsLocationResult) {
        val o = JSONObject().apply {
            put("cityName", result.cityName)
            put("latitude", result.latitude)
            put("longitude", result.longitude)
            put("accuracyMeters", result.accuracyMeters)
            put("timezoneId", result.timezoneId)
            put("calcMethod", result.calcMethod)
            put("country", result.country)
            put("countryCode", result.countryCode)
            put("governorate", result.governorate)
            put("city", result.city)
            put("district", result.district)
            put("neighborhood", result.neighborhood)
            put("street", result.street)
            put("detectedAtMs", result.detectedAtMs)
            put("isPreciseLocation", result.isPreciseLocation)
            put("provider", result.provider)
            put("fixAgeMs", result.fixAgeMs)
        }
        prefs.edit().putString("last_saved_gps_backup_json", o.toString()).apply()
    }

    fun getLastGpsResult(): GpsLocationResult? {
        val raw = prefs.getString("last_saved_gps_backup_json", null) ?: return null
        return try {
            val o = JSONObject(raw)
            val lat = o.optDouble("latitude", Double.NaN)
            val lng = o.optDouble("longitude", Double.NaN)
            if (!LocationFixValidator.areCoordinatesValid(lat, lng)) return null
            GpsLocationResult(
                cityName = o.optString("cityName", "موقع محفوظ"),
                latitude = lat,
                longitude = lng,
                accuracyMeters = o.optInt("accuracyMeters", 0),
                timezoneId = o.optString("timezoneId", "Asia/Riyadh"),
                calcMethod = o.optString("calcMethod", "umm_al_qura"),
                country = o.optString("country", ""),
                countryCode = o.optString("countryCode", ""),
                governorate = o.optString("governorate", ""),
                city = o.optString("city", ""),
                district = o.optString("district", ""),
                neighborhood = o.optString("neighborhood", ""),
                street = o.optString("street", ""),
                isSavedFallback = true,
                detectedAtMs = o.optLong("detectedAtMs", System.currentTimeMillis()),
                isPreciseLocation = o.optBoolean("isPreciseLocation", true),
                provider = o.optString("provider", "gps"),
                fixAgeMs = o.optLong("fixAgeMs", 0L)
            )
        } catch (_: Exception) {
            null
        }
    }

    fun appendCachedOsmCities(cities: List<CityLocation>) {
        if (cities.isEmpty()) return
        val existing = getCachedOsmCities().toMutableList()
        for (item in cities) {
            existing.removeAll {
                it.id == item.id ||
                    (kotlin.math.abs(it.latitude - item.latitude) < 0.005 &&
                        kotlin.math.abs(it.longitude - item.longitude) < 0.005 &&
                        it.nameAr == item.nameAr)
            }
            existing.add(0, item.copy(isCachedOnline = true))
        }
        val capped = existing.take(250)
        val arr = JSONArray()
        capped.forEach { c ->
            arr.put(
                JSONObject().apply {
                    put("id", c.id)
                    put("nameAr", c.nameAr)
                    put("nameEn", c.nameEn)
                    put("country", c.country)
                    put("countryEn", c.countryEn)
                    put("countryCode", c.countryCode)
                    put("stateAr", c.stateAr)
                    put("stateEn", c.stateEn)
                    put("district", c.district)
                    put("lat", c.latitude)
                    put("lng", c.longitude)
                    put("tz", c.timezoneId)
                    put("m", c.recommendedCalcMethod)
                }
            )
        }
        prefs.edit().putString("cached_osm_cities_json", arr.toString()).apply()
    }

    fun getCachedOsmCities(): List<CityLocation> {
        val raw = prefs.getString("cached_osm_cities_json", null) ?: return emptyList()
        val list = mutableListOf<CityLocation>()
        try {
            val arr = JSONArray(raw)
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                list.add(
                    CityLocation(
                        id = o.optString("id", "osm_$i"),
                        nameAr = o.optString("nameAr", ""),
                        nameEn = o.optString("nameEn", ""),
                        country = o.optString("country", ""),
                        latitude = o.optDouble("lat", 0.0),
                        longitude = o.optDouble("lng", 0.0),
                        timezoneHours = 0.0,
                        timezoneId = o.optString("tz", ""),
                        recommendedCalcMethod = o.optString("m", "mwl"),
                        countryEn = o.optString("countryEn", ""),
                        countryCode = o.optString("countryCode", ""),
                        stateAr = o.optString("stateAr", ""),
                        stateEn = o.optString("stateEn", ""),
                        district = o.optString("district", ""),
                        isCachedOnline = true
                    )
                )
            }
        } catch (_: Exception) {}
        return list
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

    // =========================================================================
    // Smart Sheikh («شيخي») Persistent Progress, Weak-Ayah Log & Stats
    // =========================================================================
    var sheikhLastSurah: Int
        get() = prefs.getInt("sheikh_last_surah", 1).coerceIn(1, 114)
        set(value) = prefs.edit().putInt("sheikh_last_surah", value.coerceIn(1, 114)).apply()

    var sheikhLastAyah: Int
        get() = prefs.getInt("sheikh_last_ayah", 1).coerceAtLeast(1)
        set(value) = prefs.edit().putInt("sheikh_last_ayah", value.coerceAtLeast(1)).apply()

    var sheikhUnitType: String
        get() = prefs.getString("sheikh_unit_type", "ayah") ?: "ayah"
        set(value) = prefs.edit().putString("sheikh_unit_type", if (value == "page") "page" else "ayah").apply()

    var sheikhLastPage: Int
        get() = prefs.getInt("sheikh_last_page", 1).coerceIn(1, 604)
        set(value) = prefs.edit().putInt("sheikh_last_page", value.coerceIn(1, 604)).apply()

    var sheikhTargetRepeats: Int
        get() = prefs.getInt("sheikh_target_repeats", 3)
        set(value) = prefs.edit().putInt("sheikh_target_repeats", value).apply()

    var sheikhRangeStart: Int
        get() = prefs.getInt("sheikh_range_start", 1).coerceAtLeast(1)
        set(value) = prefs.edit().putInt("sheikh_range_start", value.coerceAtLeast(1)).apply()

    var sheikhRangeEnd: Int
        get() = prefs.getInt("sheikh_range_end", 7).coerceAtLeast(1)
        set(value) = prefs.edit().putInt("sheikh_range_end", value.coerceAtLeast(1)).apply()

    var sheikhDialect: String
        get() = prefs.getString("sheikh_dialect", "egyptian") ?: "egyptian"
        set(value) = prefs.edit().putString("sheikh_dialect", value).apply()

    var sheikhCorrectionMode: String
        get() = prefs.getString("sheikh_correction_mode", "instant") ?: "instant"
        set(value) = prefs.edit().putString("sheikh_correction_mode", value).apply()

    var sheikhServerBaseUrl: String
        get() = prefs.getString(
            "sheikh_server_base_url",
            "https://ais-pre-aogd7h5zvrwkdpwfi6su4v-613282291771.europe-west3.run.app"
        ) ?: "https://ais-pre-aogd7h5zvrwkdpwfi6su4v-613282291771.europe-west3.run.app"
        set(value) = prefs.edit().putString("sheikh_server_base_url", value.trim()).apply()

    var sheikhSessionsCount: Int
        get() = prefs.getInt("sheikh_sessions_count", 0)
        set(value) = prefs.edit().putInt("sheikh_sessions_count", value.coerceAtLeast(0)).apply()

    var sheikhCorrectWordsCount: Int
        get() = prefs.getInt("sheikh_correct_words_count", 0)
        set(value) = prefs.edit().putInt("sheikh_correct_words_count", value.coerceAtLeast(0)).apply()

    fun getSheikhMasteredMap(): MutableMap<String, Int> {
        val raw = prefs.getString("sheikh_mastered_map", null) ?: return mutableMapOf()
        val map = mutableMapOf<String, Int>()
        try {
            val o = JSONObject(raw)
            val keys = o.keys()
            while (keys.hasNext()) {
                val k = keys.next()
                map[k] = o.optInt(k, 100)
            }
        } catch (_: Exception) {}
        return map
    }

    fun recordSheikhAyahMastered(surahNumber: Int, ayahNumber: Int, score: Int) {
        val map = getSheikhMasteredMap()
        val key = "${surahNumber}:${ayahNumber}"
        map[key] = maxOf(map[key] ?: 0, score)
        val o = JSONObject()
        map.forEach { (k, v) -> o.put(k, v) }
        prefs.edit().putString("sheikh_mastered_map", o.toString()).apply()
    }

    fun getSheikhWeakAyahs(): MutableList<Triple<String, Int, String>> {
        val raw = prefs.getString("sheikh_weak_ayahs", null) ?: return mutableListOf()
        val list = mutableListOf<Triple<String, Int, String>>()
        try {
            val arr = JSONArray(raw)
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                list.add(
                    Triple(
                        o.optString("key"),
                        o.optInt("errorCount", 1),
                        o.optString("weakWords", "")
                    )
                )
            }
        } catch (_: Exception) {}
        return list
    }

    fun recordSheikhWeakAyahError(surahNumber: Int, ayahNumber: Int, surahName: String, weakWords: List<String>) {
        val current = getSheikhWeakAyahs()
        val key = "${surahNumber}:${ayahNumber}"
        val existingIdx = current.indexOfFirst { it.first == key }
        val newWords = weakWords.joinToString(" ، ")
        if (existingIdx >= 0) {
            val prev = current[existingIdx]
            val mergedWords = if (prev.third.isBlank()) newWords else if (newWords.isBlank()) prev.third else "${prev.third} ، $newWords"
            current[existingIdx] = Triple(key, prev.second + weakWords.size.coerceAtLeast(1), mergedWords.take(120))
        } else {
            current.add(0, Triple(key, weakWords.size.coerceAtLeast(1), newWords.take(120)))
        }
        val arr = JSONArray()
        current.take(30).forEach { (k, count, words) ->
            val o = JSONObject().apply {
                put("key", k)
                put("surahName", surahName)
                put("errorCount", count)
                put("weakWords", words)
            }
            arr.put(o)
        }
        prefs.edit().putString("sheikh_weak_ayahs", arr.toString()).apply()
    }

    var sheikhMicSensitivity: Float
        get() = prefs.getFloat("sheikh_mic_sensitivity", 1.0f).coerceIn(0.5f, 2.5f)
        set(value) = prefs.edit().putFloat("sheikh_mic_sensitivity", value.coerceIn(0.5f, 2.5f)).apply()

    var sheikhNoiseGate: String
        get() = prefs.getString("sheikh_noise_gate", "medium") ?: "medium"
        set(value) = prefs.edit().putString("sheikh_noise_gate", value).apply()

    var sheikhAnalysisSpeed: String
        get() = prefs.getString("sheikh_analysis_speed", "balanced") ?: "balanced"
        set(value) = prefs.edit().putString("sheikh_analysis_speed", value).apply()

    var sheikhVibrateOnError: Boolean
        get() = prefs.getBoolean("sheikh_vibrate_on_error", true)
        set(value) = prefs.edit().putBoolean("sheikh_vibrate_on_error", value).apply()

    var sheikhQuickPopupEnabled: Boolean
        get() = prefs.getBoolean("sheikh_quick_popup_enabled", true)
        set(value) = prefs.edit().putBoolean("sheikh_quick_popup_enabled", value).apply()

    var sheikhAutoAdvance: Boolean
        get() = prefs.getBoolean("sheikh_auto_advance", true)
        set(value) = prefs.edit().putBoolean("sheikh_auto_advance", value).apply()

    fun getSheikhDailyHistory(): Map<String, Pair<Int, Int>> {
        val raw = prefs.getString("sheikh_daily_history", null) ?: return emptyMap()
        val result = linkedMapOf<String, Pair<Int, Int>>()
        try {
            val o = JSONObject(raw)
            val keys = o.keys()
            while (keys.hasNext()) {
                val dateKey = keys.next()
                val item = o.optJSONObject(dateKey) ?: continue
                result[dateKey] = Pair(
                    item.optInt("masteredCount", 0),
                    item.optInt("attemptsCount", 0)
                )
            }
        } catch (_: Exception) {}
        return result
    }

    fun recordSheikhDailyProgress(
        dateIso: String,
        newlyMasteredDelta: Int,
        correctWordsDelta: Int,
        score: Int
    ) {
        val raw = prefs.getString("sheikh_daily_history", null)
        val root = try {
            if (raw != null) JSONObject(raw) else JSONObject()
        } catch (_: Exception) {
            JSONObject()
        }
        val prev = root.optJSONObject(dateIso) ?: JSONObject()
        val prevMastered = prev.optInt("masteredCount", 0)
        val prevAttempts = prev.optInt("attemptsCount", 0)
        val prevWords = prev.optInt("correctWordsCount", 0)
        val prevAvg = prev.optInt("avgScore", 0)
        val newAttempts = prevAttempts + 1
        val newAvg = ((prevAvg * prevAttempts) + score) / newAttempts

        val updated = JSONObject().apply {
            put("masteredCount", prevMastered + newlyMasteredDelta.coerceAtLeast(0))
            put("attemptsCount", newAttempts)
            put("correctWordsCount", prevWords + correctWordsDelta.coerceAtLeast(0))
            put("avgScore", newAvg)
        }
        root.put(dateIso, updated)

        // Retain recent 90 days cleanly
        val sortedKeys = mutableListOf<String>()
        val iter = root.keys()
        while (iter.hasNext()) sortedKeys.add(iter.next())
        sortedKeys.sort()
        while (sortedKeys.size > 90) {
            val oldest = sortedKeys.removeAt(0)
            root.remove(oldest)
        }
        prefs.edit().putString("sheikh_daily_history", root.toString()).apply()
    }

    // =========================================================================
    // Ramadan 30-Day Fasting Tracker Persistence
    // =========================================================================
    fun getRamadanFastingDays(): MutableMap<Int, String> {
        val raw = prefs.getString("ramadan_fasting_tracker_v1", null) ?: return mutableMapOf()
        val result = mutableMapOf<Int, String>()
        try {
            val o = JSONObject(raw)
            for (day in 1..30) {
                val status = o.optString(day.toString(), "")
                if (status == "fasted" || status == "missed" || status == "pending") {
                    result[day] = status
                }
            }
        } catch (_: Exception) {}
        return result
    }

    fun setRamadanDayStatus(day: Int, status: String) {
        if (day !in 1..30) return
        val normalized = when (status) {
            "fasted", "missed", "pending" -> status
            else -> "pending"
        }
        val map = getRamadanFastingDays()
        map[day] = normalized
        val o = JSONObject()
        map.forEach { (d, s) -> o.put(d.toString(), s) }
        prefs.edit().putString("ramadan_fasting_tracker_v1", o.toString()).apply()
    }

    // =========================================================================
    // Persistent User Preferences Across Feature Screens
    // =========================================================================
    var quranReciterIndex: Int
        get() = prefs.getInt("quran_reciter_index", 0).coerceAtLeast(0)
        set(value) = prefs.edit().putInt("quran_reciter_index", value.coerceAtLeast(0)).apply()

    var sheikhReciterIndex: Int
        get() = prefs.getInt("sheikh_reciter_index", 0).coerceAtLeast(0)
        set(value) = prefs.edit().putInt("sheikh_reciter_index", value.coerceAtLeast(0)).apply()

    fun getFavoriteDuaIds(): Set<String> {
        val raw = prefs.getString("favorite_dua_ids_v1", null) ?: return emptySet()
        return runCatching {
            val arr = JSONArray(raw)
            buildSet {
                for (i in 0 until arr.length()) {
                    val id = arr.optString(i, "")
                    if (id.isNotBlank()) add(id)
                }
            }
        }.getOrDefault(emptySet())
    }

    fun toggleFavoriteDuaId(duaId: String): Set<String> {
        val next = getFavoriteDuaIds().toMutableSet()
        if (!next.add(duaId)) {
            next.remove(duaId)
        }
        val arr = JSONArray()
        next.sorted().forEach { arr.put(it) }
        prefs.edit().putString("favorite_dua_ids_v1", arr.toString()).apply()
        return next
    }

    fun getRamadanDailyHabits(dateKey: String): Map<String, Boolean> {
        val defaults = mapOf(
            "fasted" to true,
            "taraweeh" to false,
            "quran" to false,
            "charity" to false
        )
        val raw = prefs.getString("ramadan_daily_habits_$dateKey", null) ?: return defaults
        return runCatching {
            val o = JSONObject(raw)
            mapOf(
                "fasted" to o.optBoolean("fasted", true),
                "taraweeh" to o.optBoolean("taraweeh", false),
                "quran" to o.optBoolean("quran", false),
                "charity" to o.optBoolean("charity", false)
            )
        }.getOrDefault(defaults)
    }

    fun setRamadanDailyHabit(dateKey: String, habitKey: String, done: Boolean) {
        val current = getRamadanDailyHabits(dateKey).toMutableMap()
        current[habitKey] = done
        val o = JSONObject()
        current.forEach { (k, v) -> o.put(k, v) }
        prefs.edit().putString("ramadan_daily_habits_$dateKey", o.toString()).apply()
    }

    var zakatCurrencyIdx: Int
        get() = prefs.getInt("zakat_currency_idx", 0).coerceAtLeast(0)
        set(value) = prefs.edit().putInt("zakat_currency_idx", value.coerceAtLeast(0)).apply()

    var zakatNisabStandard: String
        get() = prefs.getString("zakat_nisab_standard", "gold") ?: "gold"
        set(value) = prefs.edit().putString("zakat_nisab_standard", if (value == "silver") "silver" else "gold").apply()

    var zakatGoldPrice: String
        get() = prefs.getString("zakat_gold_price", "") ?: ""
        set(value) = prefs.edit().putString("zakat_gold_price", value).apply()

    var zakatSilverPrice: String
        get() = prefs.getString("zakat_silver_price", "") ?: ""
        set(value) = prefs.edit().putString("zakat_silver_price", value).apply()

    var zakatFitrPerPerson: String
        get() = prefs.getString("zakat_fitr_per_person", "") ?: ""
        set(value) = prefs.edit().putString("zakat_fitr_per_person", value).apply()

    // =========================================================================
    // Worship Tracker (متتبع العبادات) Persistence — Daily + 7-Day Weekly History
    // =========================================================================
    fun getWorshipTargets(): Map<String, Int> {
        val defaults = linkedMapOf(
            "five_prayers" to 5,
            "azkar_sabah_massa" to 2,
            "quran_reading" to 10,
            "after_prayer_azkar" to 5,
            "duha_prayer" to 1,
            "qiyam_witr" to 1,
            "charity" to 1,
            "salawat_prophet" to 100
        )
        val raw = prefs.getString("worship_tracker_targets_v1", null) ?: return defaults
        return runCatching {
            val o = JSONObject(raw)
            defaults.mapValues { (k, defVal) -> o.optInt(k, defVal).coerceAtLeast(1) }
        }.getOrDefault(defaults)
    }

    fun setWorshipTarget(key: String, target: Int) {
        val current = getWorshipTargets().toMutableMap()
        current[key] = target.coerceAtLeast(1)
        val o = JSONObject()
        current.forEach { (k, v) -> o.put(k, v) }
        prefs.edit().putString("worship_tracker_targets_v1", o.toString()).apply()
    }

    fun getWorshipDayCounts(dateKey: String): Map<String, Int> {
        val keys = listOf(
            "five_prayers", "azkar_sabah_massa", "quran_reading", "after_prayer_azkar",
            "duha_prayer", "qiyam_witr", "charity", "salawat_prophet"
        )
        val defaults = keys.associateWith { 0 }
        val raw = prefs.getString("worship_tracker_days_v1", null) ?: return defaults
        return runCatching {
            val root = JSONObject(raw)
            val dayObj = root.optJSONObject(dateKey) ?: return defaults
            keys.associateWith { k -> dayObj.optInt(k, 0).coerceAtLeast(0) }
        }.getOrDefault(defaults)
    }

    fun setWorshipItemCount(dateKey: String, key: String, count: Int) {
        val raw = prefs.getString("worship_tracker_days_v1", null)
        val root = runCatching { if (raw != null) JSONObject(raw) else JSONObject() }.getOrDefault(JSONObject())
        val dayObj = root.optJSONObject(dateKey) ?: JSONObject()
        dayObj.put(key, count.coerceAtLeast(0))
        root.put(dateKey, dayObj)

        // Prune older entries beyond 45 days
        val dateKeys = mutableListOf<String>()
        val iter = root.keys()
        while (iter.hasNext()) dateKeys.add(iter.next())
        dateKeys.sort()
        while (dateKeys.size > 45) {
            root.remove(dateKeys.removeAt(0))
        }
        prefs.edit().putString("worship_tracker_days_v1", root.toString()).apply()
    }

    var worshipReminderEnabled: Boolean
        get() = prefs.getBoolean("worship_tracker_reminder_enabled", false)
        set(value) = prefs.edit().putBoolean("worship_tracker_reminder_enabled", value).apply()

    var worshipReminderTime: String
        get() = prefs.getString("worship_tracker_reminder_time", "20:30") ?: "20:30"
        set(value) = prefs.edit().putString("worship_tracker_reminder_time", value).apply()

    // =========================================================================
    // Hajj Rituals Interactive Checklist Persistence (12 Rituals + Reminders)
    // =========================================================================
    fun getHajjCompletedRitualIds(): Set<String> {
        val raw = prefs.getString("hajj_checklist_completed_v1", null) ?: return emptySet()
        return runCatching {
            val arr = JSONArray(raw)
            buildSet {
                for (i in 0 until arr.length()) {
                    val v = arr.optString(i, "")
                    if (v.isNotBlank()) add(v)
                }
            }
        }.getOrDefault(emptySet())
    }

    fun setHajjCompletedRitualIds(ids: Set<String>) {
        val arr = JSONArray()
        ids.sorted().forEach { arr.put(it) }
        prefs.edit().putString("hajj_checklist_completed_v1", arr.toString()).apply()
    }

    fun getHajjRitualReminders(): Map<String, Long> {
        val raw = prefs.getString("hajj_checklist_reminders_v1", null) ?: return emptyMap()
        return runCatching {
            val o = JSONObject(raw)
            buildMap {
                val iter = o.keys()
                while (iter.hasNext()) {
                    val k = iter.next()
                    val v = o.optLong(k, 0L)
                    if (v > 0L) put(k, v)
                }
            }
        }.getOrDefault(emptyMap())
    }

    fun setHajjRitualReminder(ritualId: String, epochMs: Long?) {
        val map = getHajjRitualReminders().toMutableMap()
        if (epochMs != null && epochMs > 0L) {
            map[ritualId] = epochMs
        } else {
            map.remove(ritualId)
        }
        val o = JSONObject()
        map.forEach { (k, v) -> o.put(k, v) }
        prefs.edit().putString("hajj_checklist_reminders_v1", o.toString()).apply()
    }

    fun resetHajjChecklistAll() {
        prefs.edit()
            .remove("hajj_checklist_completed_v1")
            .remove("hajj_checklist_reminders_v1")
            .apply()
    }
}
