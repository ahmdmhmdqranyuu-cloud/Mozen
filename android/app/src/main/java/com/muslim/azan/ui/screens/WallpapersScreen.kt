package com.muslim.azan.ui.screens

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.LruCache
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BrokenImage
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.muslim.azan.data.MediaFileManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.model.OnlineWallpaperItem
import com.muslim.azan.model.SavedWallpaperRecord
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private object WallpaperMemoryCache {
    private val cache: LruCache<String, Bitmap> by lazy {
        val maxKb = (Runtime.getRuntime().maxMemory() / 1024L).toInt()
        val cacheSizeKb = (maxKb / 8).coerceIn(4096, 24576)
        object : LruCache<String, Bitmap>(cacheSizeKb) {
            override fun sizeOf(key: String, value: Bitmap): Int {
                return (value.allocationByteCount / 1024).coerceAtLeast(1)
            }
        }
    }

    fun get(key: String): Bitmap? = cache.get(key)

    fun put(key: String, bitmap: Bitmap) {
        if (!bitmap.isRecycled) {
            cache.put(key, bitmap)
        }
    }
}

private fun pexelsWallpaper(
    id: String,
    pexelsId: String,
    phraseAr: String,
    subtextAr: String,
    category: String
): OnlineWallpaperItem {
    return OnlineWallpaperItem(
        id = id,
        titleAr = phraseAr,
        subtitleAr = subtextAr,
        category = category,
        imageUrl = "https://images.pexels.com/photos/$pexelsId/pexels-photo-$pexelsId.jpeg?auto=compress&cs=tinysrgb&w=1080",
        thumbUrl = "https://images.pexels.com/photos/$pexelsId/pexels-photo-$pexelsId.jpeg?auto=compress&cs=tinysrgb&w=600"
    )
}

private fun wikimediaWallpaper(
    id: String,
    imageUrl: String,
    phraseAr: String,
    subtextAr: String,
    category: String
): OnlineWallpaperItem {
    return OnlineWallpaperItem(
        id = id,
        titleAr = phraseAr,
        subtitleAr = subtextAr,
        category = category,
        imageUrl = imageUrl,
        thumbUrl = imageUrl
    )
}

private fun buildOnlineWallpapersCatalog(): List<OnlineWallpaperItem> = listOf(
    // الحرمين والأقصى
    pexelsWallpaper("wp_makkah_1", "2291004", "﴿ إِنَّ أَوَّلَ بَيْتٍ وُضِعَ لِلنَّاسِ لَلَّذِي بِبَكَّةَ مُبَارَكًا وَهُدًى لِلْعَالَمِينَ ﴾", "سورة آل عمران • الآية ٩٦", "الحرمين والأقصى"),
    pexelsWallpaper("wp_madinah_1", "18274181", "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ ﷺ", "طيبة الطيبة • المدينة المنورة", "الحرمين والأقصى"),
    pexelsWallpaper("wp_quba_1", "2087391", "﴿ لَمَسْجِدٌ أُسِّسَ عَلَى التَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ أَحَقُّ أَنْ تَقُومَ فِيهِ ﴾", "سورة التوبة • الآية ١٠٨", "الحرمين والأقصى"),
    pexelsWallpaper("wp_madinah_2", "4346403", "«مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ»", "حديث شريف متفق عليه", "الحرمين والأقصى"),
    pexelsWallpaper("wp_makkah_2", "4346404", "﴿ إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ ﴾", "سورة البقرة • الآية ١٥٨", "الحرمين والأقصى"),

    // مساجد وعمارة إسلامية
    pexelsWallpaper("wp_mosque_1", "3727255", "﴿ وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا ﴾", "سورة الجن • الآية ١٨", "مساجد"),
    pexelsWallpaper("wp_mosque_2", "1537086", "﴿ يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنْكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ ﴾", "سورة المجادلة • الآية ١١", "مساجد"),
    pexelsWallpaper("wp_mosque_3", "2404046", "﴿ وَهُوَ الَّذِي سَخَّرَ الْبَحْرَ لِتَأْكُلُوا مِنْهُ لَحْمًا طَرِيًّا ﴾", "سورة النحل • الآية ١٤", "مساجد"),
    pexelsWallpaper("wp_mosque_4", "3214958", "﴿ ادْخُلُوا مِصْرَ إِنْ شَاءَ اللَّهُ آمِنِينَ ﴾", "سورة يوسف • الآية ٩٩", "مساجد"),
    wikimediaWallpaper("wp_mosque_5", "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Jerusalem-2013-Temple_Mount-Dome_of_the_Rock-Detail_01.jpg/960px-Jerusalem-2013-Temple_Mount-Dome_of_the_Rock-Detail_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى ﴾", "سورة الإسراء • الآية ١", "الحرمين والأقصى"),
    pexelsWallpaper("wp_mosque_6", "460680", "﴿ إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ ﴾", "سورة التوبة • الآية ١٨", "مساجد"),
    pexelsWallpaper("wp_mosque_7", "1619569", "﴿ فَنَادَتْهُ الْمَلَائِكَةُ وَهُوَ قَائِمٌ يُصَلِّي فِي الْمِحْرَابِ ﴾", "سورة آل عمران • الآية ٣٩", "مساجد"),
    pexelsWallpaper("wp_mosque_8", "3689859", "﴿ وَاقْصِدْ فِي مَشْيِكَ وَاغْضُضْ مِنْ صَوْتِكَ ﴾", "سورة لقمان • الآية ١٩", "مساجد"),
    pexelsWallpaper("wp_mosque_9", "2832077", "﴿ رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ ﴾", "سورة البقرة • الآية ١٢٧", "مساجد"),
    pexelsWallpaper("wp_mosque_10", "2233416", "﴿ نُورٌ عَلَىٰ نُورٍ يَهْدِي اللَّهُ لِنُورِهِ مَنْ يَشَاءُ ﴾", "سورة النور • الآية ٣٥", "مساجد"),
    pexelsWallpaper("wp_mosque_11", "1549326", "﴿ وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ غُرُوبِهَا ﴾", "سورة طه • الآية ١٣٠", "مساجد"),
    pexelsWallpaper("wp_mosque_12", "3290068", "﴿ حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ ﴾", "سورة البقرة • الآية ٢٣٨", "مساجد"),
    pexelsWallpaper("wp_mosque_13", "2048865", "﴿ وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِنَ اللَّيْلِ ﴾", "سورة هود • الآية ١١٤", "مساجد"),
    pexelsWallpaper("wp_mosque_14", "2104882", "﴿ رَبَّنَا افْتَحْ بَيْنَنَا وَبَيْنَ قَوْمِنَا بِالْحَقِّ وَأَنْتَ خَيْرُ الْفَاتِحِينَ ﴾", "سورة الأعراف • الآية ٨٩", "مساجد"),

    // الطبيعة والتأمل
    pexelsWallpaper("wp_nature_1", "1287145", "﴿ وَالصُّبْحِ إِذَا تَنَفَّسَ ﴾", "سورة التكوير • الآية ١٨", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_2", "1252890", "﴿ رَبَّنَا مَا خَلَقْتَ هَٰذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ ﴾", "سورة آل عمران • الآية ١٩١", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_3", "417074", "﴿ وَإِلَى الْجِبَالِ كَيْفَ نُصِبَتْ ﴾", "سورة الغاشية • الآية ١٩", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_4", "1032650", "﴿ قُلْ لَوْ كَانَ الْبَحْرُ مِدَادًا لِكَلِمَاتِ رَبِّي لَنَفِدَ الْبَحْرُ ﴾", "سورة الكهف • الآية ١٠٩", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_5", "15286", "﴿ وَهُوَ الَّذِي يُنَزِّلُ الْغَيْثَ مِنْ بَعْدِ مَا قَنَطُوا وَيَنْشُرُ رَحْمَتَهُ ﴾", "سورة الشورى • الآية ٢٨", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_6", "273935", "﴿ وَالنَّخْلَ بَاسِقَاتٍ لَهَا طَلْعٌ نَضِيدٌ • رِزْقًا لِلْعِبَادِ ﴾", "سورة ق • الآيتان ١٠-١١", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_7", "813269", "﴿ يَسْأَلُونَكَ عَنِ الْأَهِلَّةِ قُلْ هِيَ مَوَاقِيتُ لِلنَّاسِ وَالْحَجِّ ﴾", "سورة البقرة • الآية ١٨٩", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_8", "3225517", "﴿ وَإِنْ مِنْ شَيْءٍ إِلَّا يُسَبِّحُ بِحَمْدِهِ ﴾", "سورة الإسراء • الآية ٤٤", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_9", "1001435", "﴿ أَفَلَا يَنْظُرُونَ إِلَى الْإِبِلِ كَيْفَ خُلِقَتْ ﴾", "سورة الغاشية • الآية ١٧", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_10", "189349", "﴿ وَالشَّمْسِ وَضُحَاهَا • وَالْقَمَرِ إِذَا تَلَاهَا ﴾", "سورة الشمس • الآيتان ١-٢", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_11", "210186", "﴿ وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ أَفَلَا يُؤْمِنُونَ ﴾", "سورة الأنبياء • الآية ٣٠", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_12", "1072179", "﴿ صُنْعَ اللَّهِ الَّذِي أَتْقَنَ كُلَّ شَيْءٍ ﴾", "سورة النمل • الآية ٨٨", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_13", "147411", "﴿ وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ ﴾", "سورة الذاريات • الآية ١٨", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_14", "462118", "﴿ فَانْظُرْ إِلَىٰ آثَارِ رَحْمَتِ اللَّهِ كَيْفَ يُحْيِي الْأَرْضَ بَعْدَ مَوْتِهَا ﴾", "سورة الروم • الآية ٥٠", "الطبيعة والتأمل"),
    pexelsWallpaper("wp_nature_15", "38136", "﴿ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴾", "سورة الفاتحة • الآية ٦", "الطبيعة والتأمل"),

    // خلفيات إسلامية إضافية موثقة عبر الإنترنت
    wikimediaWallpaper("wp_wm_1", "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Supplicating_Pilgrim_at_Masjid_Al_Haram._Mecca%2C_Saudi_Arabia.jpg/960px-Supplicating_Pilgrim_at_Masjid_Al_Haram._Mecca%2C_Saudi_Arabia.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ ﴾", "سورة البقرة • الآية ١٨٦", "الحرمين والأقصى"),
    wikimediaWallpaper("wp_wm_2", "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Al-Aqsa_Mosque_Summer_Pulpit_%28Minbar_al-Sayf%29_on_the_Temple_Mount_%28Jerusalem%2C_2008%29.jpg/960px-Al-Aqsa_Mosque_Summer_Pulpit_%28Minbar_al-Sayf%29_on_the_Temple_Mount_%28Jerusalem%2C_2008%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا ﴾", "سورة البقرة • الآية ٢٥٠", "الحرمين والأقصى"),
    wikimediaWallpaper("wp_wm_3", "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Sheikh_Zayed_Grand_Mosque_in_Abu_Dhabi_-_panoramio.jpg/960px-Sheikh_Zayed_Grand_Mosque_in_Abu_Dhabi_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ فِي بُيُوتٍ أَذِنَ اللَّهُ أَنْ تُرْفَعَ وَيُذْكَرَ فِيهَا اسْمُهُ ﴾", "سورة النور • الآية ٣٦", "مساجد"),
    wikimediaWallpaper("wp_wm_4", "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Sultan_Qaboos_Grand_Mosque_Muscat_06.JPG/960px-Sultan_Qaboos_Grand_Mosque_Muscat_06.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾", "سورة الرعد • الآية ٢٨", "مساجد"),
    wikimediaWallpaper("wp_wm_5", "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Sunshine_on_mosque_Hassan_II_in_Casablanca%2C_Morocco_-_Flickr_-_Milamber%27s_portfolio.jpg/960px-Sunshine_on_mosque_Hassan_II_in_Casablanca%2C_Morocco_-_Flickr_-_Milamber%27s_portfolio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ﴾", "سورة النور • الآية ٣٥", "مساجد"),
    wikimediaWallpaper("wp_wm_6", "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Abdullah_fr%C3%A8res_-_Sultan_Ahmet_camii%2C_Istanbul.jpg/960px-Abdullah_fr%C3%A8res_-_Sultan_Ahmet_camii%2C_Istanbul.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ وَسَبِّحْ بِحَمْدِهِ ﴾", "سورة الفرقان • الآية ٥٨", "مساجد"),
    wikimediaWallpaper("wp_wm_7", "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Badshahi_Mosque_%28Lahore%29.jpg/960px-Badshahi_Mosque_%28Lahore%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ قَدْ أَفْلَحَ الْمُؤْمِنُونَ • الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ ﴾", "سورة المؤمنون • الآيتان ١-٢", "مساجد"),
    wikimediaWallpaper("wp_wm_8", "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Putrajaya_Malaysia_Putra-Mosque-06.jpg/960px-Putrajaya_Malaysia_Putra-Mosque-06.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ ﴾", "سورة البقرة • الآية ١٥٢", "مساجد"),
    wikimediaWallpaper("wp_wm_9", "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Cairo_-_Islamic_district_-_Al_Azhar_Mosque_and_University.JPG/960px-Cairo_-_Islamic_district_-_Al_Azhar_Mosque_and_University.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ وَقُلْ رَبِّ زِدْنِي عِلْمًا ﴾", "سورة طه • الآية ١١٤", "مساجد"),
    wikimediaWallpaper("wp_wm_10", "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Fols_362b-363a_of_the_Single-Volume_Qur%27an_attributed_to_Ahmed_Karahisari._The_Nasser_D._Khalili_Collection_of_Islamic_Art%2C_QUR_420.jpg/960px-Fols_362b-363a_of_the_Single-Volume_Qur%27an_attributed_to_Ahmed_Karahisari._The_Nasser_D._Khalili_Collection_of_Islamic_Art%2C_QUR_420.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾", "سورة الإسراء • الآية ٩", "مساجد"),
    wikimediaWallpaper("wp_wm_11", "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Ali_Mujtaba_WLM2015_FAISAL_MOSQUE_m_10.jpg/960px-Ali_Mujtaba_WLM2015_FAISAL_MOSQUE_m_10.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ وَسَبِّحْ بِحَمْدِ رَبِّكَ حِينَ تَقُومُ • وَمِنَ اللَّيْلِ فَسَبِّحْهُ ﴾", "سورة الطور • الآيتان ٤٨-٤٩", "مساجد"),
    wikimediaWallpaper("wp_wm_12", "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Umayyad_Mosque%2C_Damascus.jpg/960px-Umayyad_Mosque%2C_Damascus.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ وَلَذِكْرُ اللَّهِ أَكْبَرُ وَاللَّهُ يَعْلَمُ مَا تَصْنَعُونَ ﴾", "سورة العنكبوت • الآية ٤٥", "مساجد"),
    wikimediaWallpaper("wp_wm_13", "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Cordoba_Cathedral_2024_-_Arches.jpg/960px-Cordoba_Cathedral_2024_-_Arches.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ ﴾", "سورة يس • الآية ٥٨", "مساجد"),
    wikimediaWallpaper("wp_wm_14", "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Kazan_Kremlin_Qolsharif_Mosque_08-2016_img2.jpg/960px-Kazan_Kremlin_Qolsharif_Mosque_08-2016_img2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ﴾", "سورة الأحزاب • الآية ٥٦", "مساجد"),
    wikimediaWallpaper("wp_wm_15", "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Meuseujid_Raya_Bayturrahman.JPG/960px-Meuseujid_Raya_Bayturrahman.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ وَارْكَعُوا مَعَ الرَّاكِعِينَ ﴾", "سورة البقرة • الآية ٤٣", "مساجد"),
    wikimediaWallpaper("wp_wm_16", "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7e/Decorated_walls_of_Registan_Square_in_Samarkand%2C_Uzbekistan_-_07.jpg/960px-Decorated_walls_of_Registan_Square_in_Samarkand%2C_Uzbekistan_-_07.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ تَبَارَكَ اسْمُ رَبِّكَ ذِي الْجَلَالِ وَالْإِكْرَامِ ﴾", "سورة الرحمن • الآية ٧٨", "مساجد"),
    wikimediaWallpaper("wp_wm_17", "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Mosque-Madrassa_of_Sultan_Hassan.jpg/960px-Mosque-Madrassa_of_Sultan_Hassan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَأَطِيعُوا الرَّسُولَ لَعَلَّكُمْ تُرْحَمُونَ ﴾", "سورة النور • الآية ٥٦", "مساجد"),
    wikimediaWallpaper("wp_wm_18", "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Karoleen_Eckerbert_-_Al-Hakim_Mosque_Cairo_Egypt_2012_04.JPG/960px-Karoleen_Eckerbert_-_Al-Hakim_Mosque_Cairo_Egypt_2012_04.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي ﴾", "سورة إبراهيم • الآية ٤٠", "مساجد"),
    wikimediaWallpaper("wp_wm_19", "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Kutubiyya_Mosque%2C_Marrakesh%2C_Morocco%2C_20250124_1834_7027.jpg/960px-Kutubiyya_Mosque%2C_Marrakesh%2C_Morocco%2C_20250124_1834_7027.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ ﴾", "سورة الأنعام • الآية ١٦٢", "مساجد"),
    wikimediaWallpaper("wp_wm_20", "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Illuminated_Quran_manuscript_Cifte_Minareli_Medrese_Erzurum_2025.jpeg/960px-Illuminated_Quran_manuscript_Cifte_Minareli_Medrese_Erzurum_2025.jpeg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail", "﴿ وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِلْمُؤْمِنِينَ ﴾", "سورة الإسراء • الآية ٨٢", "مساجد")
)

private suspend fun decodeScaledBitmap(bytes: ByteArray, maxDimension: Int): Bitmap? = withContext(Dispatchers.Default) {
    try {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return@withContext null

        var sampleSize = 1
        while (bounds.outWidth / sampleSize > maxDimension || bounds.outHeight / sampleSize > maxDimension) {
            sampleSize *= 2
        }
        val opts = BitmapFactory.Options().apply {
            inSampleSize = sampleSize
            inPreferredConfig = Bitmap.Config.RGB_565
        }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, opts)
    } catch (_: Exception) {
        null
    }
}

private sealed class ThumbLoadState {
    object Loading : ThumbLoadState()
    data class Loaded(val bitmap: Bitmap) : ThumbLoadState()
    data class Error(val message: String) : ThumbLoadState()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WallpapersScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val catalog = remember { buildOnlineWallpapersCatalog() }
    var savedRecords by remember { mutableStateOf(prefs.getSavedWallpapers()) }
    var showingSavedTab by remember { mutableStateOf(false) }
    var isOnline by remember { mutableStateOf(MediaFileManager.isNetworkAvailable(context)) }
    var globalReloadCounter by remember { mutableIntStateOf(0) }

    // Keyed by wallpaper ID to retry individual cards
    val retryMap = remember { mutableStateMapOf<String, Int>() }

    // Preview Modal State
    var previewingWallpaper by remember { mutableStateOf<OnlineWallpaperItem?>(null) }
    var previewingSavedRecord by remember { mutableStateOf<SavedWallpaperRecord?>(null) }
    var fullResBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var fullResBytes by remember { mutableStateOf<ByteArray?>(null) }
    var isFullLoading by remember { mutableStateOf(false) }
    var fullLoadError by remember { mutableStateOf<String?>(null) }
    var fullReloadTick by remember { mutableIntStateOf(0) }
    var isSavingGallery by remember { mutableStateOf(false) }
    var isPreparingShare by remember { mutableStateOf(false) }

    val filteredOnline = catalog

    BackHandler(enabled = previewingWallpaper != null || previewingSavedRecord != null || showingSavedTab) {
        when {
            previewingWallpaper != null || previewingSavedRecord != null -> {
                previewingWallpaper = null
                previewingSavedRecord = null
            }
            showingSavedTab -> showingSavedTab = false
        }
    }

    // Load full-resolution image into memory ONLY when dialog opens
    LaunchedEffect(previewingWallpaper?.id, fullReloadTick) {
        val wp = previewingWallpaper ?: return@LaunchedEffect
        fullResBytes = null
        fullLoadError = null
        val cachedFull = WallpaperMemoryCache.get("full:${wp.id}")
        if (cachedFull != null && !cachedFull.isRecycled) {
            fullResBitmap = cachedFull
            isFullLoading = false
            return@LaunchedEffect
        }
        // Keep thumb visible while loading full resolution if already cached
        fullResBitmap = WallpaperMemoryCache.get("thumb:${wp.id}")
        isFullLoading = true

        if (!MediaFileManager.isNetworkAvailable(context)) {
            isFullLoading = false
            if (fullResBitmap == null) {
                fullLoadError = "لا يوجد اتصال بالإنترنت لعرض الصورة بدقة عالية."
            } else {
                fullLoadError = "أنت غير متصل — تم عرض المعاينة المؤقتة فقط."
            }
            return@LaunchedEffect
        }

        val res = MediaFileManager.fetchImageBytesFromUrl(wp.imageUrl)
        if (res.isSuccess) {
            val bytes = res.getOrThrow()
            val bmp = decodeScaledBitmap(bytes, 1440)
            if (bmp != null) {
                WallpaperMemoryCache.put("full:${wp.id}", bmp)
                fullResBitmap = bmp
                fullResBytes = bytes
                fullLoadError = null
            } else {
                fullLoadError = "تعذر معالجة بيانات الصورة."
            }
        } else {
            fullLoadError = res.exceptionOrNull()?.message ?: "تعذر تحميل الصورة من الشبكة."
        }
        isFullLoading = false
    }

    // Load saved record preview (reads user's saved gallery URI first, or fetches URL if connected)
    LaunchedEffect(previewingSavedRecord?.id, fullReloadTick) {
        val rec = previewingSavedRecord ?: return@LaunchedEffect
        fullResBytes = null
        fullLoadError = null
        isFullLoading = true
        val localBmp = withContext(Dispatchers.IO) {
            try {
                if (rec.localUriString.isNotBlank()) {
                    context.contentResolver.openInputStream(Uri.parse(rec.localUriString))?.use { stream ->
                        val bytes = stream.readBytes()
                        fullResBytes = bytes
                        decodeScaledBitmap(bytes, 1440)
                    }
                } else null
            } catch (_: Exception) {
                null
            }
        }
        if (localBmp != null) {
            fullResBitmap = localBmp
            isFullLoading = false
            return@LaunchedEffect
        }

        val cachedFull = WallpaperMemoryCache.get("full:${rec.id}")
        if (cachedFull != null && !cachedFull.isRecycled) {
            fullResBitmap = cachedFull
            isFullLoading = false
            return@LaunchedEffect
        }

        if (!MediaFileManager.isNetworkAvailable(context)) {
            fullLoadError = "تعذر قراءة الصورة من الهاتف ولا يوجد اتصال بالإنترنت."
            isFullLoading = false
            return@LaunchedEffect
        }

        val res = MediaFileManager.fetchImageBytesFromUrl(rec.imageUrl)
        if (res.isSuccess) {
            val bytes = res.getOrThrow()
            val bmp = decodeScaledBitmap(bytes, 1440)
            if (bmp != null) {
                WallpaperMemoryCache.put("full:${rec.id}", bmp)
                fullResBitmap = bmp
                fullResBytes = bytes
            } else {
                fullLoadError = "تعذر معالجة الصورة."
            }
        } else {
            fullLoadError = res.exceptionOrNull()?.message ?: "تعذر تحميل الخلفية."
        }
        isFullLoading = false
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "الخلفيات الإسلامية",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            "تحميل فوري من الإنترنت • بدون زيادة حجم التطبيق",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = GoldAccent)
                    }
                },
                actions = {
                    IconButton(onClick = { showingSavedTab = !showingSavedTab }) {
                        Icon(
                            Icons.Default.Bookmark,
                            contentDescription = "المحفوظة",
                            tint = if (showingSavedTab) Color.White else GoldAccent
                        )
                    }
                    IconButton(
                        onClick = {
                            isOnline = MediaFileManager.isNetworkAvailable(context)
                            globalReloadCounter++
                        }
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "تحديث", tint = GoldAccent)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = EmeraldDeep)
            )
        },
        containerColor = EmeraldDeep
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {

            // Network offline banner (when viewing online wallpapers while disconnected)
            if (!isOnline && !showingSavedTab) {
                Spacer(modifier = Modifier.height(10.dp))
                MoazenWidgetCard(
                    cornerRadius = 12.dp,
                    borderColor = ErrorRed.copy(alpha = 0.55f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.WifiOff,
                                contentDescription = null,
                                tint = ErrorRed,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "لا يوجد اتصال بالإنترنت — تحقق من الشبكة لعرض وتحميل الخلفيات.",
                                color = MoazenInkPrimary,
                                fontSize = 11.sp,
                                lineHeight = 16.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        TextButton(
                            onClick = {
                                isOnline = MediaFileManager.isNetworkAvailable(context)
                                globalReloadCounter++
                            },
                            colors = ButtonDefaults.textButtonColors(contentColor = MoazenInkEmerald)
                        ) {
                            Text("إعادة المحاولة", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (showingSavedTab) {
                if (savedRecords.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        MoazenWidgetCard(cornerRadius = 20.dp, modifier = Modifier.fillMaxWidth()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    Icons.Default.Bookmark,
                                    contentDescription = null,
                                    tint = MoazenInkEmerald,
                                    modifier = Modifier.size(48.dp)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "لا توجد خلفيات محفوظة بعد",
                                    color = MoazenInkPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "اضغط على أي خلفية من الأقسام ثم اختر «حفظ الخلفية» ليتم حفظها في ألبوم هاتفك وظهورها هنا.",
                                    color = MoazenInkMuted,
                                    fontSize = 12.sp,
                                    textAlign = TextAlign.Center,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(savedRecords, key = { "saved_${it.id}" }) { record ->
                            SavedWallpaperCard(
                                record = record,
                                reloadTrigger = globalReloadCounter + (retryMap[record.id] ?: 0),
                                onClick = {
                                    previewingWallpaper = null
                                    previewingSavedRecord = record
                                },
                                onRetry = {
                                    retryMap[record.id] = (retryMap[record.id] ?: 0) + 1
                                },
                                onRemoveFromSaved = {
                                    prefs.removeSavedWallpaper(record.id)
                                    savedRecords = prefs.getSavedWallpapers()
                                    Toast.makeText(context, "تمت إزالة الخلفية من قائمة المحفوظات.", Toast.LENGTH_SHORT).show()
                                }
                            )
                        }
                    }
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredOnline, key = { it.id }) { wp ->
                        val isSaved = savedRecords.any { it.id == wp.id }
                        OnlineWallpaperCard(
                            wallpaper = wp,
                            isSaved = isSaved,
                            reloadTrigger = globalReloadCounter + (retryMap[wp.id] ?: 0),
                            onClick = {
                                isOnline = MediaFileManager.isNetworkAvailable(context)
                                previewingSavedRecord = null
                                previewingWallpaper = wp
                            },
                            onRetry = {
                                isOnline = MediaFileManager.isNetworkAvailable(context)
                                retryMap[wp.id] = (retryMap[wp.id] ?: 0) + 1
                            }
                        )
                    }
                }
            }
        }
    }

    // Preview / Download / Share Modal (Online Item or Saved Record)
    val activeTitle = previewingWallpaper?.titleAr ?: previewingSavedRecord?.titleAr
    val activeSubtitle = previewingWallpaper?.subtitleAr ?: previewingSavedRecord?.category
    val activeCategory = previewingWallpaper?.category ?: previewingSavedRecord?.category ?: "عام"
    val activeId = previewingWallpaper?.id ?: previewingSavedRecord?.id
    val activeUrl = previewingWallpaper?.imageUrl ?: previewingSavedRecord?.imageUrl

    if (activeId != null && activeTitle != null && activeUrl != null) {
        val alreadySaved = savedRecords.any { it.id == activeId }

        Dialog(
            onDismissRequest = {
                if (!isSavingGallery && !isPreparingShare) {
                    previewingWallpaper = null
                    previewingSavedRecord = null
                    fullResBitmap = null
                    fullResBytes = null
                    fullLoadError = null
                }
            },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            MoazenWidgetCard(
                cornerRadius = 22.dp,
                modifier = Modifier.fillMaxWidth(0.92f)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = activeTitle,
                                color = MoazenInkEmerald,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (!activeSubtitle.isNullOrBlank()) {
                                Text(
                                    text = activeSubtitle,
                                    color = MoazenInkMuted,
                                    fontSize = 12.sp,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                        IconButton(
                            onClick = {
                                if (!isSavingGallery && !isPreparingShare) {
                                    previewingWallpaper = null
                                    previewingSavedRecord = null
                                    fullResBitmap = null
                                    fullResBytes = null
                                    fullLoadError = null
                                }
                            }
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = MoazenInkMuted)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Image Preview Box
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(340.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(EmeraldDeep)
                            .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        val bmp = fullResBitmap
                        if (bmp != null && !bmp.isRecycled) {
                            Image(
                                bitmap = bmp.asImageBitmap(),
                                contentDescription = activeTitle,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }

                        if (isFullLoading) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(EmeraldDeep.copy(alpha = if (bmp != null) 0.35f else 1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    CircularProgressIndicator(color = GoldAccent, strokeWidth = 3.dp)
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text("جاري تحميل الخلفية بدقة عالية...", color = TextPrimary, fontSize = 12.sp)
                                }
                            }
                        } else if (fullLoadError != null && bmp == null) {
                            Column(
                                modifier = Modifier.padding(18.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    Icons.Default.BrokenImage,
                                    contentDescription = null,
                                    tint = ErrorRed,
                                    modifier = Modifier.size(40.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = fullLoadError ?: "تعذر تحميل الصورة.",
                                    color = TextPrimary,
                                    fontSize = 12.sp,
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                Button(
                                    onClick = { fullReloadTick++ },
                                    colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Icon(Icons.Default.Refresh, contentDescription = null, tint = EmeraldDeep, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("إعادة المحاولة", color = EmeraldDeep, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }

                        if (alreadySaved) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = EmeraldPrimary.copy(alpha = 0.9f),
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("محفوظة", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Action Buttons Row: Save Wallpaper + Share
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Save to Gallery
                        Button(
                            onClick = {
                                scope.launch {
                                    isSavingGallery = true
                                    val bytes = fullResBytes ?: run {
                                        if (!MediaFileManager.isNetworkAvailable(context)) {
                                            isSavingGallery = false
                                            Toast.makeText(context, "لا يوجد اتصال بالإنترنت لتحميل الخلفية.", Toast.LENGTH_LONG).show()
                                            return@launch
                                        }
                                        val downloaded = MediaFileManager.fetchImageBytesFromUrl(activeUrl)
                                        if (downloaded.isFailure) {
                                            isSavingGallery = false
                                            Toast.makeText(
                                                context,
                                                "تعذر التحميل: ${downloaded.exceptionOrNull()?.message ?: "خطأ بالشبكة"}",
                                                Toast.LENGTH_LONG
                                            ).show()
                                            return@launch
                                        }
                                        downloaded.getOrThrow().also { fullResBytes = it }
                                    }

                                    val saveRes = MediaFileManager.saveImageToGallery(context, bytes, activeTitle)
                                    isSavingGallery = false
                                    if (saveRes.isSuccess) {
                                        val uriStr = saveRes.getOrNull()?.toString() ?: ""
                                        prefs.addSavedWallpaper(
                                            SavedWallpaperRecord(
                                                id = activeId,
                                                titleAr = activeTitle,
                                                category = activeCategory,
                                                imageUrl = activeUrl,
                                                localUriString = uriStr,
                                                savedAtMs = System.currentTimeMillis()
                                            )
                                        )
                                        savedRecords = prefs.getSavedWallpapers()
                                        Toast.makeText(context, "تم حفظ الخلفية في ألبوم الصور بنجاح!", Toast.LENGTH_LONG).show()
                                    } else {
                                        Toast.makeText(
                                            context,
                                            "تعذر الحفظ: ${saveRes.exceptionOrNull()?.message ?: "خطأ"}",
                                            Toast.LENGTH_LONG
                                        ).show()
                                    }
                                }
                            },
                            enabled = !isSavingGallery && !isPreparingShare,
                            colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1.3f)
                        ) {
                            if (isSavingGallery) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.Download, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("حفظ الخلفية", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }

                        // Share Wallpaper via FileProvider
                        OutlinedButton(
                            onClick = {
                                scope.launch {
                                    isPreparingShare = true
                                    val bytes = fullResBytes ?: run {
                                        if (!MediaFileManager.isNetworkAvailable(context)) {
                                            isPreparingShare = false
                                            Toast.makeText(context, "يلزم اتصال بالإنترنت لتجهيز الصورة للمشاركة.", Toast.LENGTH_LONG).show()
                                            return@launch
                                        }
                                        val downloaded = MediaFileManager.fetchImageBytesFromUrl(activeUrl)
                                        if (downloaded.isFailure) {
                                            isPreparingShare = false
                                            Toast.makeText(
                                                context,
                                                "تعذر تحميل الصورة للمشاركة.",
                                                Toast.LENGTH_LONG
                                            ).show()
                                            return@launch
                                        }
                                        downloaded.getOrThrow().also { fullResBytes = it }
                                    }

                                    val uriResult = MediaFileManager.createShareableImageUri(context, bytes, activeId)
                                    isPreparingShare = false
                                    if (uriResult.isSuccess) {
                                        val shareUri = uriResult.getOrThrow()
                                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                            type = "image/*"
                                            putExtra(Intent.EXTRA_STREAM, shareUri)
                                            putExtra(Intent.EXTRA_TEXT, "$activeTitle — من تطبيق رفيق المسلم")
                                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                        }
                                        runCatching {
                                            context.startActivity(Intent.createChooser(shareIntent, "مشاركة الخلفية"))
                                        }.onFailure {
                                            Toast.makeText(context, "تعذر العثور على تطبيق للمشاركة.", Toast.LENGTH_SHORT).show()
                                        }
                                    } else {
                                        Toast.makeText(context, "تعذر تجهيز ملف المشاركة.", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            enabled = !isSavingGallery && !isPreparingShare,
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, MoazenInkEmerald),
                            modifier = Modifier.weight(1f)
                        ) {
                            if (isPreparingShare) {
                                CircularProgressIndicator(color = MoazenInkEmerald, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.Share, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("مشاركة", color = MoazenInkEmerald, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OnlineWallpaperCard(
    wallpaper: OnlineWallpaperItem,
    isSaved: Boolean,
    reloadTrigger: Int,
    onClick: () -> Unit,
    onRetry: () -> Unit
) {
    val context = LocalContext.current
    var state by remember(wallpaper.id) {
        val cached = WallpaperMemoryCache.get("thumb:${wallpaper.id}")
        mutableStateOf<ThumbLoadState>(
            if (cached != null && !cached.isRecycled) ThumbLoadState.Loaded(cached) else ThumbLoadState.Loading
        )
    }

    LaunchedEffect(wallpaper.id, reloadTrigger) {
        val cached = WallpaperMemoryCache.get("thumb:${wallpaper.id}")
        if (cached != null && !cached.isRecycled) {
            state = ThumbLoadState.Loaded(cached)
            return@LaunchedEffect
        }
        if (!MediaFileManager.isNetworkAvailable(context)) {
            state = ThumbLoadState.Error("لا يوجد اتصال")
            return@LaunchedEffect
        }
        state = ThumbLoadState.Loading
        val result = MediaFileManager.fetchImageBytesFromUrl(wallpaper.thumbUrl)
        if (result.isSuccess) {
            val bmp = decodeScaledBitmap(result.getOrThrow(), 720)
            if (bmp != null) {
                WallpaperMemoryCache.put("thumb:${wallpaper.id}", bmp)
                state = ThumbLoadState.Loaded(bmp)
            } else {
                state = ThumbLoadState.Error("فشل فك الصورة")
            }
        } else {
            state = ThumbLoadState.Error("تعذر التحميل")
        }
    }

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
        modifier = Modifier
            .fillMaxWidth()
            .height(236.dp)
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
            .clickable { onClick() }
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            when (val current = state) {
                is ThumbLoadState.Loading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(EmeraldDeep.copy(alpha = 0.7f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(
                                color = GoldAccent,
                                strokeWidth = 2.5.dp,
                                modifier = Modifier.size(28.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("جاري التحميل...", color = TextSecondary, fontSize = 11.sp)
                        }
                    }
                }
                is ThumbLoadState.Loaded -> {
                    Image(
                        bitmap = current.bitmap.asImageBitmap(),
                        contentDescription = wallpaper.titleAr,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is ThumbLoadState.Error -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(EmeraldDeep)
                            .padding(12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.WifiOff,
                                contentDescription = null,
                                tint = ErrorRed.copy(alpha = 0.85f),
                                modifier = Modifier.size(28.dp)
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = current.message,
                                color = TextSecondary,
                                fontSize = 11.sp,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = GoldAccent.copy(alpha = 0.2f),
                                modifier = Modifier.clickable { onRetry() }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.Refresh, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("إعادة", color = GoldAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            if (isSaved) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = EmeraldPrimary.copy(alpha = 0.9f),
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                ) {
                    Text(
                        text = "محفوظة ✓",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                    )
                }
            }

            // Bottom gradient Quranic / Islamic phrase overlay (without photo descriptions)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, EmeraldDeep.copy(alpha = 0.95f))
                        )
                    )
                    .padding(horizontal = 10.dp, vertical = 10.dp)
            ) {
                Column {
                    Text(
                        text = wallpaper.titleAr,
                        color = GoldLight,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        lineHeight = 16.sp,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (wallpaper.subtitleAr.isNotBlank()) {
                        Text(
                            text = wallpaper.subtitleAr,
                            color = TextSecondary,
                            fontSize = 9.5.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SavedWallpaperCard(
    record: SavedWallpaperRecord,
    reloadTrigger: Int,
    onClick: () -> Unit,
    onRetry: () -> Unit,
    onRemoveFromSaved: () -> Unit
) {
    val context = LocalContext.current
    var state by remember(record.id) { mutableStateOf<ThumbLoadState>(ThumbLoadState.Loading) }

    LaunchedEffect(record.id, reloadTrigger) {
        state = ThumbLoadState.Loading
        val localBmp = withContext(Dispatchers.IO) {
            try {
                if (record.localUriString.isNotBlank()) {
                    context.contentResolver.openInputStream(Uri.parse(record.localUriString))?.use { stream ->
                        decodeScaledBitmap(stream.readBytes(), 720)
                    }
                } else null
            } catch (_: Exception) {
                null
            }
        }
        if (localBmp != null) {
            state = ThumbLoadState.Loaded(localBmp)
            return@LaunchedEffect
        }

        val cached = WallpaperMemoryCache.get("thumb:${record.id}")
        if (cached != null && !cached.isRecycled) {
            state = ThumbLoadState.Loaded(cached)
            return@LaunchedEffect
        }

        if (!MediaFileManager.isNetworkAvailable(context)) {
            state = ThumbLoadState.Error("تعذر العرض بدون إنترنت")
            return@LaunchedEffect
        }

        val res = MediaFileManager.fetchImageBytesFromUrl(record.imageUrl)
        if (res.isSuccess) {
            val bmp = decodeScaledBitmap(res.getOrThrow(), 720)
            if (bmp != null) {
                WallpaperMemoryCache.put("thumb:${record.id}", bmp)
                state = ThumbLoadState.Loaded(bmp)
            } else {
                state = ThumbLoadState.Error("تعذر فك الصورة")
            }
        } else {
            state = ThumbLoadState.Error("تعذر التحميل")
        }
    }

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
        modifier = Modifier
            .fillMaxWidth()
            .height(236.dp)
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
            .clickable { onClick() }
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            when (val current = state) {
                is ThumbLoadState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = GoldAccent, modifier = Modifier.size(28.dp), strokeWidth = 2.dp)
                    }
                }
                is ThumbLoadState.Loaded -> {
                    Image(
                        bitmap = current.bitmap.asImageBitmap(),
                        contentDescription = record.titleAr,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is ThumbLoadState.Error -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(EmeraldDeep)
                            .padding(10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.BrokenImage, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(28.dp))
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(current.message, color = TextSecondary, fontSize = 11.sp, textAlign = TextAlign.Center)
                            Spacer(modifier = Modifier.height(6.dp))
                            TextButton(onClick = onRetry) {
                                Text("إعادة", color = GoldAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            IconButton(
                onClick = onRemoveFromSaved,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(6.dp)
                    .size(30.dp)
                    .clip(CircleShape)
                    .background(EmeraldDeep.copy(alpha = 0.78f))
            ) {
                Icon(
                    Icons.Default.DeleteOutline,
                    contentDescription = "إزالة",
                    tint = ErrorRed,
                    modifier = Modifier.size(16.dp)
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, EmeraldDeep.copy(alpha = 0.95f))
                        )
                    )
                    .padding(horizontal = 10.dp, vertical = 10.dp)
            ) {
                Column {
                    Text(
                        text = record.titleAr,
                        color = GoldLight,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "محفوظة على الهاتف",
                        color = EmeraldPrimary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
