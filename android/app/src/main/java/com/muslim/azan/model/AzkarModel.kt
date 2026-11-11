package com.muslim.azan.model

data class AzkarItem(
    val id: String,
    val categoryId: String,
    val textArabic: String,
    val count: Int,
    val fadl: String = "",
    val source: String = ""
)

data class HadithItem(
    val id: Int,
    val title: String,
    val hadithArabic: String,
    val narrator: String,
    val source: String,
    val sharh: String
)

data class DuaItem(
    val id: String,
    val title: String,
    val arabicText: String,
    val source: String,
    val category: String,
    val isFavorite: Boolean = false
)

data class NameOfAllah(
    val id: Int,
    val nameArabic: String,
    val meaning: String
)
