package com.muslim.azan.model

data class PrayerItem(
    val key: String,
    val arabicName: String,
    val timeHHmm: String,
    val minutesFromMidnight: Int,
    val isNext: Boolean = false,
    val isPassed: Boolean = false,
    val soundEnabled: Boolean = true
)

data class PrayerSchedule(
    val dateHijri: String,
    val dateGregorian: String,
    val cityName: String,
    val nextPrayerName: String,
    val nextPrayerTimeHHmm: String,
    val remainingMinutes: Int,
    val prayers: List<PrayerItem>
)

data class CityLocation(
    val id: String,
    val nameAr: String,
    val nameEn: String,
    val country: String,
    val latitude: Double,
    val longitude: Double,
    val timezoneHours: Double,
    val timezoneId: String = "",
    val recommendedCalcMethod: String = "umm_al_qura",
    val countryEn: String = "",
    val countryCode: String = "",
    val stateAr: String = "",
    val stateEn: String = "",
    val district: String = "",
    val isCachedOnline: Boolean = false
)

data class PrayerSettingConfig(
    val prayerKey: String,
    val arabicName: String,
    val offsetMinutes: Int = 0,
    val soundEnabled: Boolean = true,
    val volumePercent: Int = 100,
    val preAlertEnabled: Boolean = true,
    val preAlertMinutes: Int = 15,
    val preAlertVoice: String = "pre_prayer_15m",
    val silentDuringPrayer: Boolean = false,
    val azanVoice: String = "makkah",
    val alertMode: String = "full_azan", // full_azan | short_tone | vibrate_only | silent
    val iqamaVoice: String = "iqama_1",
    val duaAfterPrayerEnabled: Boolean = true,
    val didYouPrayEnabled: Boolean = true
)

data class OnlineWallpaperItem(
    val id: String,
    val titleAr: String,
    val subtitleAr: String,
    val category: String,
    val imageUrl: String,
    val thumbUrl: String,
    val fallbackUrl: String = ""
)

data class SavedWallpaperRecord(
    val id: String,
    val titleAr: String,
    val category: String,
    val imageUrl: String,
    val localUriString: String,
    val savedAtMs: Long
)
