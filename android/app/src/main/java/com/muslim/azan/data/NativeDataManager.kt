package com.muslim.azan.data

import android.content.Context
import com.muslim.azan.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.Locale
import java.util.TimeZone
import kotlin.math.*

data class CountrySummary(
    val countryAr: String,
    val countryEn: String,
    val countryCode: String,
    val citiesCount: Int,
    val statesCount: Int
)

object NativeDataManager {

    val surahs: List<Surah> = listOf(
        Surah(1, "الفاتحة", "Al-Fatihah", "The Opening", 7, "Meccan"),
        Surah(2, "البقرة", "Al-Baqarah", "The Cow", 286, "Medinan"),
        Surah(3, "آل عمران", "Ali 'Imran", "Family of Imran", 200, "Medinan"),
        Surah(4, "النساء", "An-Nisa", "The Women", 176, "Medinan"),
        Surah(5, "المائدة", "Al-Ma'idah", "The Table Spread", 120, "Medinan"),
        Surah(6, "الأنعام", "Al-An'am", "The Cattle", 165, "Meccan"),
        Surah(7, "الأعراف", "Al-A'raf", "The Heights", 206, "Meccan"),
        Surah(8, "الأنفال", "Al-Anfal", "The Spoils of War", 75, "Medinan"),
        Surah(9, "التوبة", "At-Tawbah", "The Repentance", 129, "Medinan"),
        Surah(10, "يونس", "Yunus", "Jonah", 109, "Meccan"),
        Surah(11, "هود", "Hud", "Hud", 123, "Meccan"),
        Surah(12, "يوسف", "Yusuf", "Joseph", 111, "Meccan"),
        Surah(13, "الرعد", "Ar-Ra'd", "The Thunder", 43, "Medinan"),
        Surah(14, "إبراهيم", "Ibrahim", "Abraham", 52, "Meccan"),
        Surah(15, "الحجر", "Al-Hijr", "The Rocky Tract", 99, "Meccan"),
        Surah(16, "النحل", "An-Nahl", "The Bee", 128, "Meccan"),
        Surah(17, "الإسراء", "Al-Isra", "The Night Journey", 111, "Meccan"),
        Surah(18, "الكهف", "Al-Kahf", "The Cave", 110, "Meccan"),
        Surah(19, "مريم", "Maryam", "Mary", 98, "Meccan"),
        Surah(20, "طه", "Ta-Ha", "Ta-Ha", 135, "Meccan"),
        Surah(21, "الأنبياء", "Al-Anbiya", "The Prophets", 112, "Meccan"),
        Surah(22, "الحج", "Al-Hajj", "The Pilgrimage", 78, "Medinan"),
        Surah(23, "المؤمنون", "Al-Mu'minun", "The Believers", 118, "Meccan"),
        Surah(24, "النور", "An-Nur", "The Light", 64, "Medinan"),
        Surah(25, "الفرقان", "Al-Furqan", "The Criterion", 77, "Meccan"),
        Surah(26, "الشعراء", "Ash-Shu'ara", "The Poets", 227, "Meccan"),
        Surah(27, "النمل", "An-Naml", "The Ant", 93, "Meccan"),
        Surah(28, "القصص", "Al-Qasas", "The Stories", 88, "Meccan"),
        Surah(29, "العنكبوت", "Al-'Ankabut", "The Spider", 69, "Meccan"),
        Surah(30, "الروم", "Ar-Rum", "The Romans", 60, "Meccan"),
        Surah(31, "لقمان", "Luqman", "Luqman", 34, "Meccan"),
        Surah(32, "السجدة", "As-Sajdah", "The Prostration", 30, "Meccan"),
        Surah(33, "الأحزاب", "Al-Ahzab", "The Combined Forces", 73, "Medinan"),
        Surah(34, "سبأ", "Saba", "Sheba", 54, "Meccan"),
        Surah(35, "فاطر", "Fatir", "Originator", 45, "Meccan"),
        Surah(36, "يس", "Ya-Sin", "Ya-Sin", 83, "Meccan"),
        Surah(37, "الصافات", "As-Saffat", "Those Who Set The Ranks", 182, "Meccan"),
        Surah(38, "ص", "Sad", "The Letter Sad", 88, "Meccan"),
        Surah(39, "الزمر", "Az-Zumar", "The Troops", 75, "Meccan"),
        Surah(40, "غافر", "Ghafir", "The Forgiver", 85, "Meccan"),
        Surah(41, "فصلت", "Fussilat", "Explained In Detail", 54, "Meccan"),
        Surah(42, "الشورى", "Ash-Shura", "The Consultation", 53, "Meccan"),
        Surah(43, "الزخرف", "Az-Zukhruf", "The Ornaments of Gold", 89, "Meccan"),
        Surah(44, "الدخان", "Ad-Dukhan", "The Smoke", 59, "Meccan"),
        Surah(45, "الجاثية", "Al-Jathiyah", "The Crouching", 37, "Meccan"),
        Surah(46, "الأحقاف", "Al-Ahqaf", "The Wind-Curved Sandhills", 35, "Meccan"),
        Surah(47, "محمد", "Muhammad", "Muhammad", 38, "Medinan"),
        Surah(48, "الفتح", "Al-Fath", "The Victory", 29, "Medinan"),
        Surah(49, "الحجرات", "Al-Hujurat", "The Rooms", 18, "Medinan"),
        Surah(50, "ق", "Qaf", "The Letter Qaf", 45, "Meccan"),
        Surah(51, "الذاريات", "Adh-Dhariyat", "The Winnowing Winds", 60, "Meccan"),
        Surah(52, "الطور", "At-Tur", "The Mount", 49, "Meccan"),
        Surah(53, "النجم", "An-Najm", "The Star", 62, "Meccan"),
        Surah(54, "القمر", "Al-Qamar", "The Moon", 55, "Meccan"),
        Surah(55, "الرحمن", "Ar-Rahman", "The Beneficent", 78, "Medinan"),
        Surah(56, "الواقعة", "Al-Waqi'ah", "The Inevitable", 96, "Meccan"),
        Surah(57, "الحديد", "Al-Hadid", "The Iron", 29, "Medinan"),
        Surah(58, "المجادلة", "Al-Mujadila", "The Pleading Woman", 22, "Medinan"),
        Surah(59, "الحشر", "Al-Hashr", "The Exile", 24, "Medinan"),
        Surah(60, "الممتحنة", "Al-Mumtahanah", "She That Is To Be Examined", 13, "Medinan"),
        Surah(61, "الصف", "As-Saff", "The Ranks", 14, "Medinan"),
        Surah(62, "الجمعة", "Al-Jumu'ah", "The Congregation", 11, "Medinan"),
        Surah(63, "المنافقون", "Al-Munafiqun", "The Hypocrites", 11, "Medinan"),
        Surah(64, "التغابن", "At-Taghabun", "The Mutual Disillusion", 18, "Medinan"),
        Surah(65, "الطلاق", "At-Talaq", "The Divorce", 12, "Medinan"),
        Surah(66, "التحريم", "At-Tahrim", "The Prohibition", 12, "Medinan"),
        Surah(67, "الملك", "Al-Mulk", "The Sovereignty", 30, "Meccan"),
        Surah(68, "القلم", "Al-Qalam", "The Pen", 52, "Meccan"),
        Surah(69, "الحاقة", "Al-Haqqah", "The Reality", 52, "Meccan"),
        Surah(70, "المعارج", "Al-Ma'arij", "The Ascending Stairways", 44, "Meccan"),
        Surah(71, "نوح", "Nuh", "Noah", 28, "Meccan"),
        Surah(72, "الجن", "Al-Jinn", "The Jinn", 28, "Meccan"),
        Surah(73, "المزمل", "Al-Muzzammil", "The Enshrouded One", 20, "Meccan"),
        Surah(74, "المدثر", "Al-Muddaththir", "The Cloaked One", 56, "Meccan"),
        Surah(75, "القيامة", "Al-Qiyamah", "The Resurrection", 40, "Meccan"),
        Surah(76, "الإنسان", "Al-Insan", "The Man", 31, "Medinan"),
        Surah(77, "المرسلات", "Al-Mursalat", "The Emissaries", 50, "Meccan"),
        Surah(78, "النبأ", "An-Naba", "The Tidings", 40, "Meccan"),
        Surah(79, "النازعات", "An-Nazi'at", "Those Who Drag Forth", 46, "Meccan"),
        Surah(80, "عبس", "'Abasa", "He Frowned", 42, "Meccan"),
        Surah(81, "التكوير", "At-Takwir", "The Overthrowing", 29, "Meccan"),
        Surah(82, "الانفطار", "Al-Infitar", "The Cleaving", 19, "Meccan"),
        Surah(83, "المطففين", "Al-Mutaffifin", "The Defrauding", 36, "Meccan"),
        Surah(84, "الانشقاق", "Al-Inshiqaq", "The Splitting Asunder", 25, "Meccan"),
        Surah(85, "البروج", "Al-Buruj", "The Mansions of the Stars", 22, "Meccan"),
        Surah(86, "الطارق", "At-Tariq", "The Morning Star", 17, "Meccan"),
        Surah(87, "الأعلى", "Al-A'la", "The Most High", 19, "Meccan"),
        Surah(88, "الغاشية", "Al-Ghashiyah", "The Overwhelming", 26, "Meccan"),
        Surah(89, "الفجر", "Al-Fajr", "The Dawn", 30, "Meccan"),
        Surah(90, "البلد", "Al-Balad", "The City", 20, "Meccan"),
        Surah(91, "الشمس", "Ash-Shams", "The Sun", 15, "Meccan"),
        Surah(92, "الليل", "Al-Layl", "The Night", 21, "Meccan"),
        Surah(93, "الضحى", "Ad-Duhaa", "The Morning Hours", 11, "Meccan"),
        Surah(94, "الشرح", "Ash-Sharh", "The Relief", 8, "Meccan"),
        Surah(95, "التين", "At-Tin", "The Fig", 8, "Meccan"),
        Surah(96, "العلق", "Al-'Alaq", "The Clot", 19, "Meccan"),
        Surah(97, "القدر", "Al-Qadr", "The Power", 5, "Meccan"),
        Surah(98, "البينة", "Al-Bayyinah", "The Clear Proof", 8, "Medinan"),
        Surah(99, "الزلزلة", "Az-Zalzalah", "The Earthquake", 8, "Medinan"),
        Surah(100, "العاديات", "Al-'Adiyat", "The Courser", 11, "Meccan"),
        Surah(101, "القارعة", "Al-Qari'ah", "The Calamity", 11, "Meccan"),
        Surah(102, "التكاثر", "At-Takathur", "The Rivalry in World Increase", 8, "Meccan"),
        Surah(103, "العصر", "Al-'Asr", "The Declining Day", 3, "Meccan"),
        Surah(104, "الهمزة", "Al-Humazah", "The Traducer", 9, "Meccan"),
        Surah(105, "الفيل", "Al-Fil", "The Elephant", 5, "Meccan"),
        Surah(106, "قريش", "Quraysh", "Quraysh", 4, "Meccan"),
        Surah(107, "الماعون", "Al-Ma'un", "The Small Kindness", 7, "Meccan"),
        Surah(108, "الكوثر", "Al-Kawthar", "The Abundance", 3, "Meccan"),
        Surah(109, "الكافرون", "Al-Kafirun", "The Disbelievers", 6, "Meccan"),
        Surah(110, "النصر", "An-Nasr", "The Divine Support", 3, "Medinan"),
        Surah(111, "المسد", "Al-Masad", "The Palm Fiber", 5, "Meccan"),
        Surah(112, "الإخلاص", "Al-Ikhlas", "The Sincerity", 4, "Meccan"),
        Surah(113, "الفلق", "Al-Falaq", "The Daybreak", 5, "Meccan"),
        Surah(114, "الناس", "An-Nas", "Mankind", 6, "Meccan")
    )

    val reciters: List<Reciter> = listOf(
        Reciter("abdulbasit", "الشيخ عبد الباسط عبد الصمد", "المصحف المرتل", "https://server7.mp3quran.net/basit/"),
        Reciter("alafasy", "الشيخ مشاري راشد العفاسي", "رواية حفص عن عاصم", "https://server8.mp3quran.net/afs/"),
        Reciter("hussary", "الشيخ محمود خليل الحصري", "المصحف المعلم والمرتل", "https://server13.mp3quran.net/husr/"),
        Reciter("minshawi", "الشيخ محمد صديق المنشاوي", "المصحف المرتل الخاشع", "https://server10.mp3quran.net/minsh/"),
        Reciter("ghamdi", "الشيخ سعد الغامدي", "مرتل", "https://server7.mp3quran.net/s_gmd/")
    )

    val defaultCities: List<CityLocation> = listOf(
        CityLocation("makkah", "مكة المكرمة", "Makkah", "المملكة العربية السعودية", 21.4225, 39.8262, 3.0, "Asia/Riyadh", "umm_al_qura", "Saudi Arabia"),
        CityLocation("madinah", "المدينة المنورة", "Madinah", "المملكة العربية السعودية", 24.5247, 39.5692, 3.0, "Asia/Riyadh", "umm_al_qura", "Saudi Arabia"),
        CityLocation("cairo", "القاهرة", "Cairo", "مصر", 30.0444, 31.2357, 2.0, "Africa/Cairo", "egypt", "Egypt"),
        CityLocation("alexandria", "الإسكندرية", "Alexandria", "مصر", 31.2001, 29.9187, 2.0, "Africa/Cairo", "egypt", "Egypt"),
        CityLocation("giza", "الجيزة", "Giza", "مصر", 30.0131, 31.2089, 2.0, "Africa/Cairo", "egypt", "Egypt"),
        CityLocation("jerusalem", "القدس الشريف", "Jerusalem", "فلسطين", 31.7683, 35.2137, 2.0, "Asia/Jerusalem", "mwl", "Palestine"),
        CityLocation("riyadh", "الرياض", "Riyadh", "المملكة العربية السعودية", 24.7136, 46.6753, 3.0, "Asia/Riyadh", "umm_al_qura", "Saudi Arabia"),
        CityLocation("dubai", "دبي", "Dubai", "الإمارات العربية المتحدة", 25.2048, 55.2708, 4.0, "Asia/Dubai", "dubai", "United Arab Emirates"),
        CityLocation("doha", "الدوحة", "Doha", "قطر", 25.2854, 51.5310, 3.0, "Asia/Qatar", "umm_al_qura", "Qatar"),
        CityLocation("kuwait", "مدينة الكويت", "Kuwait City", "الكويت", 29.3759, 47.9774, 3.0, "Asia/Kuwait", "umm_al_qura", "Kuwait"),
        CityLocation("amman", "عمّان", "Amman", "الأردن", 31.9454, 35.9284, 3.0, "Asia/Amman", "mwl", "Jordan"),
        CityLocation("baghdad", "بغداد", "Baghdad", "العراق", 33.3152, 44.3661, 3.0, "Asia/Baghdad", "mwl", "Iraq"),
        CityLocation("damascus", "دمشق", "Damascus", "سوريا", 33.5138, 36.2765, 3.0, "Asia/Damascus", "mwl", "Syria"),
        CityLocation("beirut", "بيروت", "Beirut", "لبنان", 33.8938, 35.5018, 2.0, "Asia/Beirut", "mwl", "Lebanon"),
        CityLocation("tripoli", "طرابلس", "Tripoli", "ليبيا", 32.8872, 13.1913, 2.0, "Africa/Tripoli", "egypt", "Libya"),
        CityLocation("tunis", "تونس", "Tunis", "تونس", 36.8065, 10.1815, 1.0, "Africa/Tunis", "mwl", "Tunisia"),
        CityLocation("algiers", "الجزائر العاصمة", "Algiers", "الجزائر", 36.7538, 3.0588, 1.0, "Africa/Algiers", "mwl", "Algeria"),
        CityLocation("rabat", "الرباط", "Rabat", "المغرب", 34.0209, -6.8416, 1.0, "Africa/Casablanca", "mwl", "Morocco"),
        CityLocation("khartoum", "الخرطوم", "Khartoum", "السودان", 15.5007, 32.5599, 2.0, "Africa/Khartoum", "egypt", "Sudan"),
        CityLocation("muscat", "مسقط", "Muscat", "عمان", 23.5880, 58.3829, 4.0, "Asia/Muscat", "dubai", "Oman"),
        CityLocation("manama", "المنامة", "Manama", "البحرين", 26.2285, 50.5860, 3.0, "Asia/Bahrain", "umm_al_qura", "Bahrain"),
        CityLocation("istanbul", "إسطنبول", "Istanbul", "تركيا", 41.0082, 28.9784, 3.0, "Europe/Istanbul", "mwl", "Turkey")
    )

    @Volatile
    private var cachedWorldCities: List<CityLocation>? = null

    /**
     * Loads 660+ global cities across 206 countries/territories from offline assets/data/world_cities.json.
     * Cached in memory for instant search and offline GPS reverse lookup.
     */
    fun loadAllWorldCities(context: Context): List<CityLocation> {
        cachedWorldCities?.let { return it }
        return synchronized(this) {
            cachedWorldCities ?: run {
                val parsed = mutableListOf<CityLocation>()
                try {
                    val jsonStr = context.assets.open("data/world_cities.json")
                        .bufferedReader()
                        .use { it.readText() }
                    val arr = JSONArray(jsonStr)
                    for (i in 0 until arr.length()) {
                        val o = arr.getJSONObject(i)
                        parsed.add(
                            CityLocation(
                                id = o.optString("id", "city_$i"),
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
                                isCachedOnline = false
                            )
                        )
                    }
                } catch (_: Exception) {
                    parsed.clear()
                    parsed.addAll(defaultCities)
                }
                val result = if (parsed.isNotEmpty()) parsed else defaultCities
                cachedWorldCities = result
                result
            }
        }
    }

    fun getAllCitiesIncludingCached(context: Context, prefs: NativePreferences): List<CityLocation> {
        val base = loadAllWorldCities(context)
        val cached = prefs.getCachedOsmCities()
        if (cached.isEmpty()) return base
        val merged = ArrayList<CityLocation>(base.size + cached.size)
        val seenIds = HashSet<String>(base.size + cached.size)
        for (c in cached) {
            if (seenIds.add(c.id)) merged.add(c)
        }
        for (c in base) {
            if (seenIds.add(c.id)) merged.add(c)
        }
        return merged
    }

    fun normalizeArabic(raw: String): String {
        if (raw.isBlank()) return ""
        val sb = StringBuilder(raw.length)
        var prevSpace = true
        for (ch in raw.trim().lowercase(Locale.US)) {
            when (ch) {
                '\u0623', '\u0625', '\u0622', '\u0671' -> {
                    sb.append('\u0627')
                    prevSpace = false
                }
                '\u0629' -> {
                    sb.append('\u0647')
                    prevSpace = false
                }
                '\u0649' -> {
                    sb.append('\u064A')
                    prevSpace = false
                }
                '\u0624' -> {
                    sb.append('\u0648')
                    prevSpace = false
                }
                '\u0626' -> {
                    sb.append('\u064A')
                    prevSpace = false
                }
                in '\u064B'..'\u065F', '\u0670', '\u0640' -> Unit
                ' ', '\t', '\n', '\r', '-', '_', ',', '،', '(', ')', '/' -> {
                    if (!prevSpace) {
                        sb.append(' ')
                        prevSpace = true
                    }
                }
                else -> {
                    sb.append(ch)
                    prevSpace = false
                }
            }
        }
        return sb.toString().trim()
    }

    private val priorityCountryOrder = listOf(
        "مصر",
        "المملكة العربية السعودية",
        "السعودية",
        "الإمارات العربية المتحدة",
        "قطر",
        "الكويت",
        "البحرين",
        "سلطنة عمان",
        "عمان",
        "الأردن",
        "فلسطين",
        "لبنان",
        "سوريا",
        "العراق",
        "اليمن",
        "ليبيا",
        "تونس",
        "الجزائر",
        "المغرب",
        "موريتانيا",
        "السودان",
        "الصومال",
        "جيبوتي",
        "جزر القمر",
        "تركيا",
        "إندونيسيا",
        "ماليزيا",
        "باكستان"
    )

    fun getCountries(context: Context, prefs: NativePreferences): List<CountrySummary> {
        val all = getAllCitiesIncludingCached(context, prefs)
        val grouped = LinkedHashMap<String, MutableList<CityLocation>>()
        for (city in all) {
            val key = city.country.ifBlank { city.countryEn }
            if (key.isNotBlank()) {
                grouped.getOrPut(key) { mutableListOf() }.add(city)
            }
        }
        val list = grouped.entries.map { (countryAr, cities) ->
            val first = cities.first()
            val distinctStates = cities.mapNotNull { it.stateAr.takeIf { s -> s.isNotBlank() } }.distinct().size
            CountrySummary(
                countryAr = countryAr,
                countryEn = first.countryEn,
                countryCode = first.countryCode,
                citiesCount = cities.size,
                statesCount = distinctStates
            )
        }
        return list.sortedWith { a, b ->
            val ia = priorityCountryOrder.indexOf(a.countryAr)
            val ib = priorityCountryOrder.indexOf(b.countryAr)
            when {
                ia >= 0 && ib >= 0 -> ia.compareTo(ib)
                ia >= 0 -> -1
                ib >= 0 -> 1
                else -> a.countryAr.compareTo(b.countryAr)
            }
        }
    }

    fun getStatesForCountry(context: Context, prefs: NativePreferences, countryAr: String): List<String> {
        if (countryAr.isBlank()) return emptyList()
        val normTarget = normalizeArabic(countryAr)
        val all = getAllCitiesIncludingCached(context, prefs)
        return all
            .filter { normalizeArabic(it.country) == normTarget || it.country == countryAr }
            .mapNotNull { it.stateAr.takeIf { s -> s.isNotBlank() } }
            .distinct()
    }

    fun searchCities(
        context: Context,
        prefs: NativePreferences,
        query: String,
        countryFilter: String? = null,
        stateFilter: String? = null,
        limit: Int = 80
    ): List<CityLocation> {
        val all = getAllCitiesIncludingCached(context, prefs)
        val normCountry = countryFilter?.takeIf { it.isNotBlank() }?.let { normalizeArabic(it) }
        val normState = stateFilter?.takeIf { it.isNotBlank() }?.let { normalizeArabic(it) }
        val normQ = normalizeArabic(query)

        val scoped = all.filter { c ->
            val matchesCountry = normCountry == null ||
                normalizeArabic(c.country) == normCountry ||
                normalizeArabic(c.countryEn) == normCountry
            val matchesState = normState == null ||
                normalizeArabic(c.stateAr) == normState ||
                normalizeArabic(c.stateEn) == normState
            matchesCountry && matchesState
        }

        if (normQ.isEmpty()) {
            return scoped.take(limit)
        }

        val scored = ArrayList<Pair<Int, CityLocation>>()
        for (city in scoped) {
            val nAr = normalizeArabic(city.nameAr)
            val nEn = normalizeArabic(city.nameEn)
            val nState = normalizeArabic(city.stateAr)
            val nDistrict = normalizeArabic(city.district)
            val nCountry = normalizeArabic(city.country)
            val nCountryEn = normalizeArabic(city.countryEn)

            val score = when {
                nAr == normQ || nEn == normQ -> 100
                nAr.startsWith(normQ) || nEn.startsWith(normQ) -> 85
                nAr.contains(" $normQ") || nEn.contains(" $normQ") -> 75
                nAr.contains(normQ) || nEn.contains(normQ) -> 65
                nState == normQ || nDistrict == normQ -> 55
                nState.contains(normQ) || nDistrict.contains(normQ) -> 45
                nCountry == normQ || nCountryEn == normQ -> 35
                nCountry.contains(normQ) || nCountryEn.contains(normQ) -> 20
                else -> 0
            }
            if (score > 0) {
                scored.add(score to city)
            }
        }
        scored.sortByDescending { it.first }
        return scored.take(limit).map { it.second }
    }

    fun mapCountryCodeToCalcMethod(countryCode: String?, fallbackMethod: String = "mwl"): String {
        val cc = countryCode?.uppercase(Locale.US) ?: return fallbackMethod
        return when (cc) {
            "EG", "SD", "LY" -> "egypt"
            "SA", "KW", "QA", "BH", "YE" -> "umm_al_qura"
            "AE", "OM" -> "dubai"
            "PK", "IN", "BD", "AF" -> "karachi"
            "US", "CA", "MX" -> "isna"
            else -> fallbackMethod
        }
    }

    suspend fun searchOnlineOsm(
        context: Context,
        prefs: NativePreferences,
        query: String,
        countryCode: String? = null
    ): Result<List<CityLocation>> = withContext(Dispatchers.IO) {
        val cleanQuery = query.trim()
        if (cleanQuery.length < 2) {
            return@withContext Result.success(emptyList())
        }
        runCatching {
            val encodedQ = URLEncoder.encode(cleanQuery, "UTF-8")
            val ccParam = if (!countryCode.isNullOrBlank()) {
                "&countrycodes=${URLEncoder.encode(countryCode.lowercase(Locale.US), "UTF-8")}"
            } else {
                ""
            }
            val urlStr =
                "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=15&accept-language=ar,en&q=$encodedQ$ccParam"
            val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
                connectTimeout = 6_000
                readTimeout = 6_000
                setRequestProperty("User-Agent", "AlMoazenIslamicApp/2.2 (contact@almoazen.app)")
                setRequestProperty("Accept", "application/json")
            }
            val code = conn.responseCode
            val body = (if (code in 200..299) conn.inputStream else conn.errorStream)
                ?.bufferedReader()
                ?.use { it.readText() }
                .orEmpty()
            conn.disconnect()
            if (code !in 200..299) {
                throw IllegalStateException("تعذر الاتصال بخدمة البحث العالمية ($code)")
            }

            val arr = JSONArray(body)
            val results = mutableListOf<CityLocation>()
            for (i in 0 until arr.length()) {
                val item = arr.optJSONObject(i) ?: continue
                val lat = item.optString("lat").toDoubleOrNull() ?: continue
                val lng = item.optString("lon").toDoubleOrNull() ?: continue
                val addr = item.optJSONObject("address")
                val cc = addr?.optString("country_code", "")?.uppercase(Locale.US).orEmpty()
                val countryName = addr?.optString("country", "").orEmpty()
                val stateName = addr?.optString("state", "").orEmpty()
                    .ifBlank { addr?.optString("province", "").orEmpty() }
                    .ifBlank { addr?.optString("region", "").orEmpty() }
                val cityTitle = addr?.optString("city", "").orEmpty()
                    .ifBlank { addr?.optString("town", "").orEmpty() }
                    .ifBlank { addr?.optString("village", "").orEmpty() }
                    .ifBlank { addr?.optString("municipality", "").orEmpty() }
                    .ifBlank { item.optString("name", "") }
                    .ifBlank { item.optString("display_name", "").substringBefore(",").trim() }
                val districtName = addr?.optString("city_district", "").orEmpty()
                    .ifBlank { addr?.optString("county", "").orEmpty() }
                    .ifBlank { addr?.optString("suburb", "").orEmpty() }
                val nearestOffline = findNearestCity(context, lat, lng)
                val tzId = if (nearestOffline != null && nearestOffline.second <= 400.0 && nearestOffline.first.timezoneId.isNotBlank()) {
                    nearestOffline.first.timezoneId
                } else {
                    TimeZone.getDefault().id.ifBlank { "UTC" }
                }
                val placeId = item.optLong("place_id", (lat * 1000).toLong() + i)
                results.add(
                    CityLocation(
                        id = "osm_$placeId",
                        nameAr = cityTitle.ifBlank { cleanQuery },
                        nameEn = item.optString("name", cityTitle),
                        country = countryName.ifBlank { "عالمي" },
                        latitude = lat,
                        longitude = lng,
                        timezoneHours = 0.0,
                        timezoneId = tzId,
                        recommendedCalcMethod = mapCountryCodeToCalcMethod(cc, nearestOffline?.first?.recommendedCalcMethod ?: "mwl"),
                        countryEn = countryName,
                        countryCode = cc,
                        stateAr = stateName,
                        stateEn = stateName,
                        district = districtName,
                        isCachedOnline = true
                    )
                )
            }
            if (results.isNotEmpty()) {
                prefs.appendCachedOsmCities(results)
            }
            results
        }
    }

    /**
     * Finds the nearest global city to (lat, lng) using the Haversine formula (returns City + distance in km).
     */
    fun findNearestCity(context: Context, lat: Double, lng: Double): Pair<CityLocation, Double>? {
        val cities = loadAllWorldCities(context)
        var best: CityLocation? = null
        var bestKm = Double.MAX_VALUE
        for (city in cities) {
            val dKm = haversineKm(lat, lng, city.latitude, city.longitude)
            if (dKm < bestKm) {
                bestKm = dKm
                best = city
            }
        }
        return best?.let { it to bestKm }
    }

    private fun haversineKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) +
            cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2).pow(2)
        return 2 * r * atan2(sqrt(a), sqrt(1.0 - a))
    }

    val sampleMorningAzkar: List<AzkarItem> = listOf(
        AzkarItem(
            "m1", "sabah",
            "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.",
            1, "من قالها حين يصبح حُفظ حتى يمسي", "رواه مسلم"
        ),
        AzkarItem(
            "m2", "sabah",
            "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ.",
            1, "سيد الاستغفار، من قاله موقناً به فمات من يومه دخل الجنة", "رواه البخاري"
        ),
        AzkarItem(
            "m3", "sabah",
            "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.",
            3, "تعدل ساعات طويلة من الذكر", "رواه مسلم"
        ),
        AzkarItem(
            "m4", "sabah",
            "بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.",
            3, "لم يضره شيء", "رواه أبو داود والترمذي"
        ),
        AzkarItem(
            "m5", "sabah",
            "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ.",
            3, "سؤال الله العافية والستر في الدنيا والآخرة", "رواه أحمد وأبو داود"
        )
    )

    val sampleEveningAzkar: List<AzkarItem> = listOf(
        AzkarItem(
            "e1", "masaa",
            "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.",
            1, "حفظ من الشرور حتى الصباح", "رواه مسلم"
        ),
        AzkarItem(
            "e2", "masaa",
            "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.",
            3, "لم تضره حمة أو لدغة تلك الليلة", "رواه مسلم"
        ),
        AzkarItem(
            "e3", "masaa",
            "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.",
            1, "تحقيق التوكل الكامل على الله", "رواه الترمذي"
        )
    )

    val namesOfAllah: List<NameOfAllah> = listOf(
        NameOfAllah(1, "الرَّحْمَنُ", "الذي وسعت رحمته كل شيء في الكون"),
        NameOfAllah(2, "الرَّحِيمُ", "الذي يرحم المؤمنين رحمة خاصة"),
        NameOfAllah(3, "الْمَلِكُ", "المتصرف في ملكه بلا منازع"),
        NameOfAllah(4, "الْقُدُّوسُ", "المنزه عن كل عيب ونقص"),
        NameOfAllah(5, "السَّلَامُ", "الذي سلم من كل عيب ونقص وسلّم عباده"),
        NameOfAllah(6, "الْمُؤْمِنُ", "المصدق لرسله وأوليائه المانح للأمان"),
        NameOfAllah(7, "الْمُهَيْمِنُ", "الرقيب الحافظ الشاهد على كل خلقه"),
        NameOfAllah(8, "الْعَزِيزُ", "القوي الغالب الذي لا يُغلب"),
        NameOfAllah(9, "الْجَبَّارُ", "الذي يجبر قلوب المنكسرين ويقهر الجبابرة"),
        NameOfAllah(10, "الْمُتَكَبِّرُ", "المتفرد بالعظمة والكبرياء المطلق")
    )

    @Volatile
    private var cachedQuranArray: JSONArray? = null

    @Volatile
    private var cachedTafseerByKey: JSONObject? = null

    private fun getCachedQuranRoot(context: Context): JSONArray {
        return cachedQuranArray ?: synchronized(this) {
            cachedQuranArray ?: run {
                val text = context.assets.open("data/quran_uthmani.json")
                    .bufferedReader()
                    .use { it.readText() }
                val trimmed = text.trim()
                val arr = if (trimmed.startsWith("[")) {
                    JSONArray(trimmed)
                } else {
                    JSONObject(trimmed).optJSONArray("surahs") ?: JSONArray()
                }
                cachedQuranArray = arr
                arr
            }
        }
    }

    private fun getCachedTafseerMap(context: Context): JSONObject {
        return cachedTafseerByKey ?: synchronized(this) {
            cachedTafseerByKey ?: run {
                try {
                    val tText = context.assets.open("data/quran_tafseer_muyassar.json")
                        .bufferedReader()
                        .use { it.readText() }
                    val tRoot = JSONObject(tText)
                    val byKey = tRoot.optJSONObject("byKey") ?: JSONObject()
                    cachedTafseerByKey = byKey
                    byKey
                } catch (_: Exception) {
                    JSONObject()
                }
            }
        }
    }

    fun loadAyahsForSurah(context: Context, surahNumber: Int): List<Ayah> {
        val list = mutableListOf<Ayah>()
        try {
            val surahsArray = getCachedQuranRoot(context)
            val tafseerMap = getCachedTafseerMap(context)
            val fallbackSurahName = surahs.find { it.number == surahNumber }?.nameArabic.orEmpty()

            for (i in 0 until surahsArray.length()) {
                val sObj = surahsArray.getJSONObject(i)
                if (sObj.optInt("number") == surahNumber) {
                    val sName = sObj.optString("name", fallbackSurahName)
                        .replace("سورة ", "")
                        .ifBlank { fallbackSurahName }
                    val ayahsArr = sObj.optJSONArray("ayahs") ?: JSONArray()
                    for (j in 0 until ayahsArr.length()) {
                        val aObj = ayahsArr.getJSONObject(j)
                        val ayahInSurah = aObj.optInt("numberInSurah", j + 1)
                        val tafseerKey = "$surahNumber:$ayahInSurah"
                        val tafseerText = aObj.optString("tafseer", "")
                            .ifEmpty { tafseerMap.optString(tafseerKey, "") }
                        list.add(
                            Ayah(
                                number = aObj.optInt("number"),
                                numberInSurah = ayahInSurah,
                                textArabic = aObj.optString("text"),
                                translation = aObj.optString("translation", ""),
                                tafseer = tafseerText,
                                page = aObj.optInt("page", 1).coerceIn(1, 604),
                                juz = aObj.optInt("juz", 1).coerceIn(1, 30),
                                surahNumber = surahNumber,
                                surahName = sName
                            )
                        )
                    }
                    break
                }
            }
        } catch (e: Exception) {
            if (surahNumber == 1) {
                list.add(Ayah(1, 1, "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", page = 1, juz = 1, surahNumber = 1, surahName = "الفاتحة"))
                list.add(Ayah(2, 2, "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", page = 1, juz = 1, surahNumber = 1, surahName = "الفاتحة"))
                list.add(Ayah(3, 3, "الرَّحْمَٰنِ الرَّحِيمِ", page = 1, juz = 1, surahNumber = 1, surahName = "الفاتحة"))
                list.add(Ayah(4, 4, "مَالِكِ يَوْمِ الدِّينِ", page = 1, juz = 1, surahNumber = 1, surahName = "الفاتحة"))
                list.add(Ayah(5, 5, "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", page = 1, juz = 1, surahNumber = 1, surahName = "الفاتحة"))
                list.add(Ayah(6, 6, "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", page = 1, juz = 1, surahNumber = 1, surahName = "الفاتحة"))
                list.add(Ayah(7, 7, "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", page = 1, juz = 1, surahNumber = 1, surahName = "الفاتحة"))
            } else {
                val sMeta = surahs.find { it.number == surahNumber }
                val count = sMeta?.numberOfAyahs ?: 5
                for (k in 1..count) {
                    list.add(Ayah(k, k, "آية كريمة مباركة رقم $k من سورة ${sMeta?.nameArabic ?: ""}", surahNumber = surahNumber, surahName = sMeta?.nameArabic.orEmpty()))
                }
            }
        }
        return list
    }

    fun loadAyahsForPage(context: Context, pageNumber: Int): List<Ayah> {
        val targetPage = pageNumber.coerceIn(1, 604)
        val result = mutableListOf<Ayah>()
        try {
            val surahsArray = getCachedQuranRoot(context)
            val tafseerMap = getCachedTafseerMap(context)
            for (i in 0 until surahsArray.length()) {
                val sObj = surahsArray.getJSONObject(i)
                val sNum = sObj.optInt("number", i + 1)
                val fallbackName = surahs.find { it.number == sNum }?.nameArabic.orEmpty()
                val sName = sObj.optString("name", fallbackName).replace("سورة ", "").ifBlank { fallbackName }
                val ayahsArr = sObj.optJSONArray("ayahs") ?: JSONArray()
                for (j in 0 until ayahsArr.length()) {
                    val aObj = ayahsArr.getJSONObject(j)
                    val p = aObj.optInt("page", -1)
                    if (p == targetPage) {
                        val ayahInSurah = aObj.optInt("numberInSurah", j + 1)
                        val tafseerKey = "$sNum:$ayahInSurah"
                        val tafseerText = aObj.optString("tafseer", "")
                            .ifEmpty { tafseerMap.optString(tafseerKey, "") }
                        result.add(
                            Ayah(
                                number = aObj.optInt("number"),
                                numberInSurah = ayahInSurah,
                                textArabic = aObj.optString("text"),
                                translation = aObj.optString("translation", ""),
                                tafseer = tafseerText,
                                page = targetPage,
                                juz = aObj.optInt("juz", 1).coerceIn(1, 30),
                                surahNumber = sNum,
                                surahName = sName
                            )
                        )
                    }
                }
            }
        } catch (_: Exception) {
        }
        return result
    }

    fun getFirstPageForSurah(context: Context, surahNumber: Int): Int {
        return try {
            val surahsArray = getCachedQuranRoot(context)
            for (i in 0 until surahsArray.length()) {
                val sObj = surahsArray.getJSONObject(i)
                if (sObj.optInt("number") == surahNumber) {
                    val ayahsArr = sObj.optJSONArray("ayahs") ?: break
                    if (ayahsArr.length() > 0) {
                        return ayahsArr.getJSONObject(0).optInt("page", 1).coerceIn(1, 604)
                    }
                    break
                }
            }
            1
        } catch (_: Exception) {
            1
        }
    }

    fun getFirstPageForJuz(context: Context, juzNumber: Int): Int {
        val targetJuz = juzNumber.coerceIn(1, 30)
        return try {
            val surahsArray = getCachedQuranRoot(context)
            for (i in 0 until surahsArray.length()) {
                val sObj = surahsArray.getJSONObject(i)
                val ayahsArr = sObj.optJSONArray("ayahs") ?: continue
                for (j in 0 until ayahsArr.length()) {
                    val aObj = ayahsArr.getJSONObject(j)
                    if (aObj.optInt("juz", -1) == targetJuz) {
                        return aObj.optInt("page", 1).coerceIn(1, 604)
                    }
                }
            }
            ((targetJuz - 1) * 20 + 2).coerceIn(1, 604)
        } catch (_: Exception) {
            ((targetJuz - 1) * 20 + 2).coerceIn(1, 604)
        }
    }
}
