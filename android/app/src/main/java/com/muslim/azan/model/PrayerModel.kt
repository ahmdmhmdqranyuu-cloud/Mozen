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
    val recommendedCalcMethod: String = "umm_al_qura"
)
