package com.muslim.azan.data

import android.content.Context
import com.muslim.azan.model.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.InputStream

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
        CityLocation("makkah", "مكة المكرمة", "Makkah", "المملكة العربية السعودية", 21.4225, 39.8262, 3.0, "Asia/Riyadh", "umm_al_qura"),
        CityLocation("madinah", "المدينة المنورة", "Madinah", "المملكة العربية السعودية", 24.5247, 39.5692, 3.0, "Asia/Riyadh", "umm_al_qura"),
        CityLocation("cairo", "القاهرة", "Cairo", "مصر", 30.0444, 31.2357, 2.0, "Africa/Cairo", "egypt"),
        CityLocation("alexandria", "الإسكندرية", "Alexandria", "مصر", 31.2001, 29.9187, 2.0, "Africa/Cairo", "egypt"),
        CityLocation("giza", "الجيزة", "Giza", "مصر", 30.0131, 31.2089, 2.0, "Africa/Cairo", "egypt"),
        CityLocation("jerusalem", "القدس الشريف", "Jerusalem", "فلسطين", 31.7683, 35.2137, 2.0, "Asia/Jerusalem", "mwl"),
        CityLocation("riyadh", "الرياض", "Riyadh", "المملكة العربية السعودية", 24.7136, 46.6753, 3.0, "Asia/Riyadh", "umm_al_qura"),
        CityLocation("dubai", "دبي", "Dubai", "الإمارات العربية المتحدة", 25.2048, 55.2708, 4.0, "Asia/Dubai", "dubai"),
        CityLocation("doha", "الدوحة", "Doha", "قطر", 25.2854, 51.5310, 3.0, "Asia/Qatar", "umm_al_qura"),
        CityLocation("kuwait", "مدينة الكويت", "Kuwait City", "الكويت", 29.3759, 47.9774, 3.0, "Asia/Kuwait", "umm_al_qura"),
        CityLocation("amman", "عمّان", "Amman", "الأردن", 31.9454, 35.9284, 3.0, "Asia/Amman", "mwl"),
        CityLocation("baghdad", "بغداد", "Baghdad", "العراق", 33.3152, 44.3661, 3.0, "Asia/Baghdad", "mwl"),
        CityLocation("damascus", "دمشق", "Damascus", "سوريا", 33.5138, 36.2765, 3.0, "Asia/Damascus", "mwl"),
        CityLocation("beirut", "بيروت", "Beirut", "لبنان", 33.8938, 35.5018, 2.0, "Asia/Beirut", "mwl"),
        CityLocation("tripoli", "طرابلس", "Tripoli", "ليبيا", 32.8872, 13.1913, 2.0, "Africa/Tripoli", "egypt"),
        CityLocation("tunis", "تونس", "Tunis", "تونس", 36.8065, 10.1815, 1.0, "Africa/Tunis", "mwl"),
        CityLocation("algiers", "الجزائر العاصمة", "Algiers", "الجزائر", 36.7538, 3.0588, 1.0, "Africa/Algiers", "mwl"),
        CityLocation("rabat", "الرباط", "Rabat", "المغرب", 34.0209, -6.8416, 1.0, "Africa/Casablanca", "mwl"),
        CityLocation("khartoum", "الخرطوم", "Khartoum", "السودان", 15.5007, 32.5599, 2.0, "Africa/Khartoum", "egypt"),
        CityLocation("muscat", "مسقط", "Muscat", "عمان", 23.5880, 58.3829, 4.0, "Asia/Muscat", "dubai"),
        CityLocation("manama", "المنامة", "Manama", "البحرين", 26.2285, 50.5860, 3.0, "Asia/Bahrain", "umm_al_qura"),
        CityLocation("istanbul", "إسطنبول", "Istanbul", "تركيا", 41.0082, 28.9784, 3.0, "Europe/Istanbul", "mwl")
    )

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

    fun loadAyahsForSurah(context: Context, surahNumber: Int): List<Ayah> {
        val list = mutableListOf<Ayah>()
        try {
            val surahsArray = cachedQuranArray ?: synchronized(this) {
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

            val tafseerMap = cachedTafseerByKey ?: synchronized(this) {
                cachedTafseerByKey ?: run {
                    try {
                        val tText = context.assets.open("data/quran_tafseer_muyassar.json")
                            .bufferedReader()
                            .use { it.readText() }
                        val tRoot = JSONObject(tText)
                        val byKey = tRoot.optJSONObject("byKey") ?: JSONObject()
                        cachedTafseerByKey = byKey
                        byKey
                    } catch (ignored: Exception) {
                        JSONObject()
                    }
                }
            }

            for (i in 0 until surahsArray.length()) {
                val sObj = surahsArray.getJSONObject(i)
                if (sObj.optInt("number") == surahNumber) {
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
                                tafseer = tafseerText
                            )
                        )
                    }
                    break
                }
            }
        } catch (e: Exception) {
            if (surahNumber == 1) {
                list.add(Ayah(1, 1, "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"))
                list.add(Ayah(2, 2, "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"))
                list.add(Ayah(3, 3, "الرَّحْمَٰنِ الرَّحِيمِ"))
                list.add(Ayah(4, 4, "مَالِكِ يَوْمِ الدِّينِ"))
                list.add(Ayah(5, 5, "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ"))
                list.add(Ayah(6, 6, "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ"))
                list.add(Ayah(7, 7, "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ"))
            } else {
                val sMeta = surahs.find { it.number == surahNumber }
                val count = sMeta?.numberOfAyahs ?: 5
                for (k in 1..count) {
                    list.add(Ayah(k, k, "آية كريمة مباركة رقم $k من سورة ${sMeta?.nameArabic ?: ""}"))
                }
            }
        }
        return list
    }
}
