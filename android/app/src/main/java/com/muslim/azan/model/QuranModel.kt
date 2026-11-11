package com.muslim.azan.model

data class Surah(
    val number: Int,
    val nameArabic: String,
    val englishName: String,
    val englishTranslation: String,
    val numberOfAyahs: Int,
    val revelationType: String // Meccan or Medinan
)

data class Ayah(
    val number: Int,
    val numberInSurah: Int,
    val textArabic: String,
    val translation: String = "",
    val tafseer: String = "",
    val audioUrl: String = ""
)

data class QuranBookmark(
    val id: String,
    val surahNumber: Int,
    val surahName: String,
    val ayahNumber: Int,
    val timestamp: Long
)

data class Reciter(
    val id: String,
    val nameArabic: String,
    val subtext: String,
    val serverUrl: String
)
