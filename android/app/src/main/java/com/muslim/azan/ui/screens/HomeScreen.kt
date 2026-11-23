package com.muslim.azan.ui.screens

import android.content.Intent
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.muslim.azan.PrayerTimeCalculator
import com.muslim.azan.R
import com.muslim.azan.data.DailyIslamicContent
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import androidx.compose.ui.draw.shadow
import com.muslim.azan.ui.components.MoazenWidgetCard
import com.muslim.azan.ui.components.RafeeqBannerWidget
import androidx.compose.ui.BiasAlignment
import com.muslim.azan.ui.navigation.Screen
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

data class GridItem(
    val titleAr: String,
    val subtitleAr: String,
    val icon: ImageVector,
    val screen: Screen?,
    val iconResId: Int? = null,
    val titleEn: String = titleAr,
    val subtitleEn: String = subtitleAr
)

@Composable
fun HomeScreen(
    prefs: NativePreferences,
    language: String = prefs.language,
    onNavigate: (Screen) -> Unit,
    onOpenPrayerSettings: (String) -> Unit = {}
) {
    val isEnglish = language == "en"
    val context = LocalContext.current
    val haptic = LocalHapticFeedback.current
    var refreshTick by remember { mutableIntStateOf(0) }
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) refreshTick++
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    var nowEpochMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(1_000L)
            nowEpochMs = System.currentTimeMillis()
        }
    }

    val cityTimezoneId = prefs.cityTimezoneId
    val cal = remember(cityTimezoneId, refreshTick, nowEpochMs / 60_000L) {
        val tz = if (cityTimezoneId.isNotEmpty()) TimeZone.getTimeZone(cityTimezoneId) else TimeZone.getDefault()
        Calendar.getInstance(tz).apply { timeInMillis = nowEpochMs }
    }
    val tzOffsetHours = remember(cityTimezoneId, prefs.longitude, refreshTick, cal.get(Calendar.DAY_OF_YEAR)) {
        PrayerTimeCalculator.resolveTimezoneOffsetHours(cityTimezoneId, cal.timeInMillis, prefs.longitude)
    }

    val dailySnapshot = remember(cal.get(Calendar.YEAR), cal.get(Calendar.DAY_OF_YEAR)) {
        DailyIslamicContent.getTodaySnapshot(cal)
    }

    val liveDatesLabel = remember(cal.get(Calendar.YEAR), cal.get(Calendar.DAY_OF_YEAR)) {
        val greg = runCatching {
            SimpleDateFormat("d MMMM yyyy", Locale("ar")).format(cal.time)
        }.getOrDefault("")
        val hijri = runCatching {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                val hijriCal = android.icu.util.IslamicCalendar()
                hijriCal.timeInMillis = cal.timeInMillis
                val months = arrayOf(
                    "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
                    "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
                    "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
                )
                val hDay = hijriCal.get(android.icu.util.IslamicCalendar.DAY_OF_MONTH)
                val hMonthIdx = hijriCal.get(android.icu.util.IslamicCalendar.MONTH).coerceIn(0, 11)
                val hYear = hijriCal.get(android.icu.util.IslamicCalendar.YEAR)
                "$hDay ${months[hMonthIdx]} $hYear هـ"
            } else {
                ""
            }
        }.getOrDefault("")
        if (hijri.isNotBlank() && greg.isNotBlank()) "$hijri • $greg" else greg.ifBlank { "التقويم الهجري والميلادي" }
    }

    val prayers = remember(
        prefs.latitude,
        prefs.longitude,
        cityTimezoneId,
        prefs.calculationMethod,
        prefs.asrMethod,
        prefs.highLatitudeRule,
        prefs.fajrOffsetMinutes,
        prefs.sunriseOffsetMinutes,
        prefs.duhaOffsetMinutes,
        prefs.dhuhrOffsetMinutes,
        prefs.asrOffsetMinutes,
        prefs.maghribOffsetMinutes,
        prefs.ishaOffsetMinutes,
        cal.get(Calendar.DAY_OF_YEAR),
        refreshTick
    ) {
        PrayerTimeCalculator.calculateDailyPrayers(
            cal,
            prefs.latitude,
            prefs.longitude,
            tzOffsetHours,
            prefs.calculationMethod,
            prefs.asrMethod,
            prefs.highLatitudeRule
        ).withOffsets(
            prefs.fajrOffsetMinutes,
            prefs.sunriseOffsetMinutes,
            prefs.duhaOffsetMinutes,
            prefs.dhuhrOffsetMinutes,
            prefs.asrOffsetMinutes,
            prefs.maghribOffsetMinutes,
            prefs.ishaOffsetMinutes
        )
    }

    val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val currentSeconds = cal.get(Calendar.SECOND)
    val nextPrayerName = remember(prayers, currentMinutes) {
        PrayerTimeCalculator.determineNextPrayerName(prayers, currentMinutes)
    }

    val nextPrayerTargetMinutes = remember(prayers, nextPrayerName, currentMinutes) {
        val m = when (nextPrayerName) {
            "الفجر" -> prayers.fajrMinutes
            "الظهر" -> prayers.dhuhrMinutes
            "العصر" -> prayers.asrMinutes
            "المغرب" -> prayers.maghribMinutes
            "العشاء" -> prayers.ishaMinutes
            else -> prayers.fajrMinutes
        }
        if (m <= currentMinutes) m + 24 * 60 else m
    }
    val remainingTotalSeconds = ((nextPrayerTargetMinutes - currentMinutes) * 60 - currentSeconds).coerceAtLeast(0)
    val remH = remainingTotalSeconds / 3600
    val remM = (remainingTotalSeconds % 3600) / 60
    val remS = remainingTotalSeconds % 60
    val countdownText = String.format(Locale.US, "%02d : %02d : %02d", remS, remM, remH)

    val calcMethodLabel = remember(prefs.calculationMethod, isEnglish) {
        if (isEnglish) {
            when (prefs.calculationMethod) {
                "egypt" -> "Egyptian Survey Authority"
                "mwl" -> "Muslim World League"
                "isna" -> "ISNA (North America)"
                "karachi" -> "Univ. of Islamic Sciences, Karachi"
                "dubai" -> "Gulf / Dubai Standard"
                "uoif" -> "UOIF (France)"
                "kuwait" -> "Kuwait Awqaf"
                "qatar" -> "Qatar Awqaf"
                "diyanet" -> "Diyanet (Turkey)"
                else -> "Umm Al-Qura, Makkah"
            }
        } else {
            when (prefs.calculationMethod) {
                "egypt" -> "الهيئة المصرية للمساحة"
                "mwl" -> "رابطة العالم الإسلامي"
                "isna" -> "الجمعية الإسلامية بأمريكا"
                "karachi" -> "جامعة كراتشي"
                "dubai" -> "دبي والإمارات والخليج"
                "uoif" -> "اتحاد المنظمات بفرنسا UOIF"
                "kuwait" -> "وزارة الأوقاف الكويتية"
                "qatar" -> "أوقاف قطر"
                "diyanet" -> "ديانت تركيا"
                else -> "توقيت أم القرى"
            }
        }
    }

    val lastSurahObj = remember(prefs.lastReadSurah, refreshTick) {
        NativeDataManager.surahs.find { it.number == prefs.lastReadSurah }
    }

    val gridItems = listOf(
        GridItem("القرآن الكريم", "قراءة وتفسير", Icons.Default.MenuBook, Screen.Quran, R.drawable.ic_feat_quran, "Holy Quran", "Read & Tafseer"),
        GridItem("مواقيت الصلاة", "تنبيه وأذكار", Icons.Default.AccessTime, Screen.PrayerTimes, R.drawable.ic_feat_prayer, "Prayer Times", "Alerts & Azan"),
        GridItem("الأذكار اليومية", "الصباح والمساء", Icons.Default.AutoStories, Screen.Azkar, R.drawable.ic_feat_azkar, "Daily Azkar", "Morning & Evening"),
        GridItem("القبلة", "تحديد الاتجاه", Icons.Default.Explore, Screen.Qibla, R.drawable.ic_feat_qibla, "Qibla", "Compass Direction"),
        GridItem("الأحاديث النبوية", "الجامع الصحيح", Icons.Default.FormatQuote, Screen.Hadith, R.drawable.ic_feat_hadith, "Hadith", "Sahih Collections"),
        GridItem("الأدعية", "أدعية قرآنية ونبوية", Icons.Default.VolunteerActivism, Screen.Duas, R.drawable.ic_feat_dua, "Duas", "Quran & Sunnah"),
        GridItem("السيرة النبوية", "حياة النبي ﷺ", Icons.Default.HistoryEdu, Screen.Seerah, R.drawable.ic_feat_seerah, "Seerah", "Prophetic Biography"),
        GridItem("الحج والعمرة", "المناسك والأدعية", Icons.Default.Mosque, Screen.Hajj, R.drawable.ic_feat_hajj, "Hajj & Umrah", "Rituals & Duas"),
        GridItem("السبحة الإلكترونية", "سبح بحمد ربك", Icons.Default.TouchApp, Screen.Tasbih, R.drawable.ic_feat_tasbih, "Tasbih", "Digital Counter"),
        GridItem("أسماء الله", "الأسماء الحسنى (99)", Icons.Default.AutoAwesome, Screen.NamesOfAllah, R.drawable.ic_feat_names, "99 Names", "Asma ul-Husna"),
        GridItem("الرقية والسنن", "التحصين والشفاء", Icons.Default.Shield, Screen.Ruqyah, R.drawable.ic_feat_ruqyah, "Ruqyah", "Healing & Sunnah"),
        GridItem("المساجد والعيدين", "المساجد والمناسبات", Icons.Default.LocationCity, Screen.Masajid, R.drawable.ic_feat_recitations, "Masajid", "Mosques & Events"),
        GridItem("الزكاة", "حاسبة الزكاة", Icons.Default.Calculate, Screen.Zakat, null, "Zakat", "Calculator"),
        GridItem("قصص الأنبياء", "دروس وعبر", Icons.Default.AutoStories, Screen.Prophets, R.drawable.ic_feat_prophets, "Prophets", "Stories & Lessons"),
        GridItem("خلفيات إسلامية", "خلفيات عالية الجودة", Icons.Default.Wallpaper, Screen.Wallpapers, R.drawable.ic_feat_wallpapers, "Wallpapers", "HD Backgrounds"),
        GridItem("مسابقة إسلامي", "اختبر معلوماتك", Icons.Default.Quiz, Screen.Quiz, R.drawable.ic_feat_quiz, "Islamic Quiz", "Test Knowledge"),
        GridItem("رمضان مبارك", "المسابقة والفوازير", Icons.Default.NightsStay, Screen.Ramadan, R.drawable.ic_feat_ramadan, "Ramadan", "Fasting & Qiyam"),
        GridItem("ملفي الشخصي", "الإحصائيات والختمة", Icons.Default.Person, Screen.Profile, null, "My Profile", "Stats & Khatma"),
        GridItem("الإعدادات", "تخصيص التطبيق", Icons.Default.Settings, Screen.Settings, R.drawable.ic_feat_settings, "Settings", "Customize App")
    )

    var isGridExpanded by remember { mutableStateOf(false) }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val viewportMinHeight = maxHeight
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = viewportMinHeight)
                    .background(MuslimPlusCanvasBrush)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                            .padding(start = 12.dp, end = 12.dp, top = 4.dp, bottom = 0.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        RafeeqBannerWidget(
                            isEnglish = isEnglish,
                            hasNotificationBadge = true,
                            onOpenSettings = { onNavigate(Screen.Settings) },
                            onOpenNotifications = { onNavigate(Screen.PrayerTimes) },
                            modifier = Modifier.padding(bottom = 6.dp)
                        )

                    // Unified Ivory-Cream Prayer Times Card (#F6EEDC -> #EDE2C8, #D6C18D border)
                    MoazenWidgetCard(
                        cornerRadius = 18.dp,
                        borderColor = MoazenCardBorder,
                        elevation = 4.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            // Calc Method + City Location header
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocationOn,
                                        contentDescription = null,
                                        tint = ErrorRed,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = prefs.cityName,
                                        color = MoazenInkEmerald,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                Text(
                                    text = calcMethodLabel,
                                    color = MoazenInkMuted,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            // 7 Daily Prayers Row + Countdown Card side by side cleanly (compact responsive fit)
                            BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                                val isCompactWidth = maxWidth < 340.dp
                                val labelFontSize = if (isCompactWidth) 8.5.sp else 9.5.sp
                                val timeFontSize = if (isCompactWidth) 9.sp else 10.sp

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Prominent Gold-Bordered Next Prayer Countdown Card
                                    Surface(
                                        shape = RoundedCornerShape(14.dp),
                                        color = MoazenSubCardBg,
                                        border = BorderStroke(1.2.dp, MoazenGold),
                                        modifier = Modifier
                                            .width(if (isCompactWidth) 96.dp else 108.dp)
                                            .clickable { onNavigate(Screen.PrayerTimes) }
                                    ) {
                                        Column(
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.spacedBy(1.5.dp),
                                            modifier = Modifier.padding(horizontal = 5.dp, vertical = 4.dp)
                                        ) {
                                            val nextPrayerDisplay = if (isEnglish) {
                                                when (nextPrayerName) {
                                                    "الفجر" -> "Fajr"
                                                    "الظهر" -> "Dhuhr"
                                                    "العصر" -> "Asr"
                                                    "المغرب" -> "Maghrib"
                                                    "العشاء" -> "Isha"
                                                    else -> nextPrayerName
                                                }
                                            } else nextPrayerName
                                            Text(
                                                text = nextPrayerDisplay,
                                                color = MoazenInkEmerald,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                maxLines = 1
                                            )
                                            Text(
                                                text = if (isEnglish) "Remaining Time" else "متبقي للصلاة",
                                                color = MoazenGoldDark,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                maxLines = 1
                                            )
                                            Text(
                                                text = countdownText,
                                                color = MoazenInkPrimary,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                maxLines = 1
                                            )
                                            Icon(
                                                imageVector = Icons.Default.VolumeUp,
                                                contentDescription = null,
                                                tint = MoazenInkEmerald,
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                    }

                                    // 7 Prayer Columns (Fajr, Sunrise, Duha, Dhuhr, Asr, Maghrib, Isha)
                                    val miniWidgets = listOf(
                                        Triple("fajr", if (isEnglish) "Fajr" else "الفجر", prayers.fajrMinutes),
                                        Triple("sunrise", if (isEnglish) "Sunrise" else "الشروق", prayers.sunriseMinutes),
                                        Triple("duha", if (isEnglish) "Duha" else "الضحى", prayers.duhaMinutes),
                                        Triple("dhuhr", if (isEnglish) "Dhuhr" else "الظهر", prayers.dhuhrMinutes),
                                        Triple("asr", if (isEnglish) "Asr" else "العصر", prayers.asrMinutes),
                                        Triple("maghrib", if (isEnglish) "Maghrib" else "المغرب", prayers.maghribMinutes),
                                        Triple("isha", if (isEnglish) "Isha" else "العشاء", prayers.ishaMinutes)
                                    )

                                    Row(
                                        modifier = Modifier.weight(1f),
                                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                                    ) {
                                        miniWidgets.forEach { (key, label, mins) ->
                                            val arMatch = when (key) {
                                                "fajr" -> "الفجر"
                                                "dhuhr" -> "الظهر"
                                                "asr" -> "العصر"
                                                "maghrib" -> "المغرب"
                                                "isha" -> "العشاء"
                                                else -> ""
                                            }
                                            DailyPrayerMiniChip(
                                                name = label,
                                                time = PrayerTimeCalculator.formatMinutesToHHmm(mins),
                                                isNext = nextPrayerName == arMatch,
                                                isDuha = key == "duha",
                                                labelFontSize = labelFontSize,
                                                timeFontSize = timeFontSize,
                                                modifier = Modifier.weight(1f),
                                                onClick = { onOpenPrayerSettings(key) }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                    // Unified Ivory-Cream Feature Cards Grid: tighter spacing + bare far-right expand arrow
                    val primaryGridItems = remember(gridItems) { gridItems.take(8) }
                    val extraGridItems = remember(gridItems) { gridItems.drop(8) }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(3.5.dp)
                    ) {
                        primaryGridItems.chunked(4).forEach { rowItems ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                rowItems.forEach { item ->
                                    MoazenWidgetCard(
                                        cornerRadius = 12.dp,
                                        modifier = Modifier.weight(1f),
                                        onClick = {
                                            item.screen?.let { onNavigate(it) }
                                        }
                                    ) {
                                        Column(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 3.5.dp, horizontal = 2.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.Center
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(28.dp)
                                                    .shadow(2.5.dp, CircleShape, clip = false)
                                                    .clip(CircleShape)
                                                    .background(
                                                        Brush.verticalGradient(
                                                            colors = listOf(Color(0xFFFFFDF8), MoazenSubCardBg)
                                                        )
                                                    )
                                                    .border(1.1.dp, MoazenGold.copy(alpha = 0.72f), CircleShape)
                                                    .padding(2.5.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                if (item.iconResId != null) {
                                                    Image(
                                                        painter = painterResource(id = item.iconResId),
                                                        contentDescription = item.titleAr,
                                                        contentScale = ContentScale.Fit,
                                                        modifier = Modifier.fillMaxSize()
                                                    )
                                                } else {
                                                    Icon(
                                                        imageVector = item.icon,
                                                        contentDescription = item.titleAr,
                                                        tint = MoazenInkEmerald,
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                }
                                            }
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Text(
                                                text = if (isEnglish) item.titleEn else item.titleAr,
                                                color = MoazenInkEmerald,
                                                fontSize = 9.5.sp,
                                                fontWeight = FontWeight.Bold,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis,
                                                textAlign = TextAlign.Center
                                            )
                                            Text(
                                                text = if (isEnglish) item.subtitleEn else item.subtitleAr,
                                                color = MoazenInkMuted,
                                                fontSize = 7.5.sp,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis,
                                                textAlign = TextAlign.Center
                                            )
                                        }
                                    }
                                }
                                for (i in 0 until (4 - rowItems.size)) {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }

                        AnimatedVisibility(
                            visible = isGridExpanded,
                            enter = expandVertically() + fadeIn(),
                            exit = shrinkVertically() + fadeOut()
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(3.5.dp)) {
                                extraGridItems.chunked(4).forEach { rowItems ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                                    ) {
                                        rowItems.forEach { item ->
                                            MoazenWidgetCard(
                                                cornerRadius = 12.dp,
                                                modifier = Modifier.weight(1f),
                                                onClick = {
                                                    item.screen?.let { onNavigate(it) }
                                                }
                                            ) {
                                                Column(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .padding(vertical = 3.5.dp, horizontal = 2.dp),
                                                    horizontalAlignment = Alignment.CenterHorizontally,
                                                    verticalArrangement = Arrangement.Center
                                                ) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(28.dp)
                                                            .shadow(2.5.dp, CircleShape, clip = false)
                                                            .clip(CircleShape)
                                                            .background(
                                                                Brush.verticalGradient(
                                                                    colors = listOf(Color(0xFFFFFDF8), MoazenSubCardBg)
                                                                )
                                                            )
                                                            .border(1.1.dp, MoazenGold.copy(alpha = 0.72f), CircleShape)
                                                            .padding(2.5.dp),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        if (item.iconResId != null) {
                                                            Image(
                                                                painter = painterResource(id = item.iconResId),
                                                                contentDescription = item.titleAr,
                                                                contentScale = ContentScale.Fit,
                                                                modifier = Modifier.fillMaxSize()
                                                            )
                                                        } else {
                                                            Icon(
                                                                imageVector = item.icon,
                                                                contentDescription = item.titleAr,
                                                                tint = MoazenInkEmerald,
                                                                modifier = Modifier.size(14.dp)
                                                            )
                                                        }
                                                    }
                                                    Spacer(modifier = Modifier.height(2.dp))
                                                    Text(
                                                        text = if (isEnglish) item.titleEn else item.titleAr,
                                                        color = MoazenInkEmerald,
                                                        fontSize = 9.5.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis,
                                                        textAlign = TextAlign.Center
                                                    )
                                                    Text(
                                                        text = if (isEnglish) item.subtitleEn else item.subtitleAr,
                                                        color = MoazenInkMuted,
                                                        fontSize = 7.5.sp,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis,
                                                        textAlign = TextAlign.Center
                                                    )
                                                }
                                            }
                                        }
                                        for (i in 0 until (4 - rowItems.size)) {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                }
                            }
                        }

                        // Simple bare arrow toggle aligned to the physical far right edge (no background/circle/border)
                        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 2.dp),
                                horizontalArrangement = Arrangement.End
                            ) {
                                Box(
                                    modifier = Modifier
                                        .clickable { isGridExpanded = !isGridExpanded }
                                        .padding(horizontal = 6.dp, vertical = 0.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (isGridExpanded) {
                                            Icons.Default.KeyboardArrowUp
                                        } else {
                                            Icons.Default.KeyboardArrowDown
                                        },
                                        contentDescription = null,
                                        tint = Color.Black,
                                        modifier = Modifier.size(19.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Prominent Featured Quran Banner Widget (Slightly more compact, daily-rotating Ayah + Dynamic Share)
                    val activeSurahName = dailySnapshot.ayah.surahName
                    val activeAyahSnippet = dailySnapshot.ayah.arabicText
                    MoazenWidgetCard(
                        cornerRadius = 18.dp,
                        borderColor = MoazenGold,
                        borderWidth = 1.5.dp,
                        elevation = 6.dp,
                        watermarkAlpha = 0f,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp),
                        onClick = {
                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                            onNavigate(Screen.Quran)
                        }
                    ) {
                        Box(modifier = Modifier.fillMaxWidth()) {
                            // Large borderless Open Mushaf integrated smoothly into creamy-ivory surface
                            Image(
                                painter = painterResource(id = R.drawable.img_quran_mushaf),
                                contentDescription = "المصحف الشريف المفتوح",
                                contentScale = ContentScale.Crop,
                                alpha = 0.86f,
                                modifier = Modifier
                                    .matchParentSize()
                                    .align(Alignment.CenterEnd)
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .background(
                                        Brush.horizontalGradient(
                                            0.0f to Color(0x30EDE2C8),
                                            0.48f to Color(0xE8F6EEDC),
                                            1.0f to Color(0xFFF6EEDC)
                                        )
                                    )
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .background(
                                        Brush.verticalGradient(
                                            0.0f to Color(0x88F6EEDC),
                                            0.5f to Color.Transparent,
                                            1.0f to Color(0x88EDE2C8)
                                        )
                                    )
                            )

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(
                                    modifier = Modifier.weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(1.5.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.MenuBook,
                                            contentDescription = null,
                                            tint = MoazenInkEmerald,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(5.dp))
                                        Text(
                                            text = if (isEnglish) "Verse of the Day • Holy Quran" else "آية اليوم • القرآن الكريم",
                                            color = MoazenInkEmerald,
                                            fontSize = 12.5.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Spacer(modifier = Modifier.width(5.dp))
                                        Text(
                                            text = if (isEnglish) "• Page ${dailySnapshot.ayah.pageNumber} / 604" else "• صفحة ${dailySnapshot.ayah.pageNumber} من 604",
                                            color = MoazenInkMuted,
                                            fontSize = 9.5.sp
                                        )
                                    }

                                    Text(
                                        text = "سورة $activeSurahName • الآية ${dailySnapshot.ayah.ayahNumber}",
                                        color = MoazenInkPrimary,
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )

                                    Text(
                                        text = activeAyahSnippet,
                                        color = MoazenInkEmerald,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )

                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Surface(
                                            shape = RoundedCornerShape(10.dp),
                                            color = MuslimPlusPillEmerald,
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(10.dp))
                                                .clickable {
                                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                                    onNavigate(Screen.Quran)
                                                }
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                            ) {
                                                Text(
                                                    text = if (isEnglish) "Continue Reading" else "متابعة القراءة",
                                                    color = Color.White,
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                Spacer(modifier = Modifier.width(3.dp))
                                                Icon(
                                                    imageVector = if (isEnglish) Icons.Default.ChevronRight else Icons.Default.ChevronLeft,
                                                    contentDescription = null,
                                                    tint = Color.White,
                                                    modifier = Modifier.size(12.dp)
                                                )
                                            }
                                        }

                                        Surface(
                                            shape = RoundedCornerShape(10.dp),
                                            color = Color(0xFFE7C768),
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(10.dp))
                                                .clickable {
                                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                                    onNavigate(Screen.Quran)
                                                }
                                        ) {
                                            Text(
                                                text = if (isEnglish) "Quran Tutor" else "معلم القرآن AI",
                                                color = MoazenInkEmerald,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                            )
                                        }
                                    }
                                }

                                // Share Button over soft cream pill
                                Surface(
                                    shape = CircleShape,
                                    color = MoazenCardStart.copy(alpha = 0.92f),
                                    border = BorderStroke(1.dp, MoazenCardBorder),
                                    shadowElevation = 2.dp,
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(CircleShape)
                                        .clickable {
                                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                            val shareText = "✦ آية اليوم • سورة $activeSurahName (${dailySnapshot.ayah.ayahNumber}) ✦\n\n$activeAyahSnippet\n\n📚 المصدر: صفحة ${dailySnapshot.ayah.pageNumber} من المصحف الشريف\n🕌 عبر تطبيق رفيق المسلم"
                                            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                                putExtra(Intent.EXTRA_TEXT, shareText)
                                                type = "text/plain"
                                            }
                                            runCatching {
                                                context.startActivity(Intent.createChooser(sendIntent, "مشاركة آية اليوم"))
                                            }.onFailure {
                                                Toast.makeText(context, "تعذر العثور على تطبيق للمشاركة.", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.Share,
                                            contentDescription = "مشاركة الآية",
                                            tint = MoazenInkEmerald,
                                            modifier = Modifier.size(15.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Prominent Daily Cards Row: Azkar & Hadith with Seamless Blended Tasbih & Mosque Images + Share + Haptics
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        MoazenWidgetCard(
                            cornerRadius = 16.dp,
                            borderColor = MoazenGold,
                            borderWidth = 1.5.dp,
                            elevation = 6.dp,
                            watermarkAlpha = 0f,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                onNavigate(Screen.Azkar)
                            }
                        ) {
                            Box(modifier = Modifier.fillMaxWidth()) {
                                Image(
                                    painter = painterResource(id = R.drawable.img_azkar_tasbih),
                                    contentDescription = "سبحة وأذكار",
                                    contentScale = ContentScale.Crop,
                                    alpha = 0.80f,
                                    modifier = Modifier.matchParentSize()
                                )
                                Box(
                                    modifier = Modifier
                                        .matchParentSize()
                                        .background(
                                            Brush.verticalGradient(
                                                0.0f to Color(0xF5F6EEDC),
                                                0.55f to Color(0xB8F6EEDC),
                                                1.0f to Color(0x6CEEE2C8)
                                            )
                                        )
                                )
                                Column(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalArrangement = Arrangement.spacedBy(2.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.AutoStories,
                                                contentDescription = null,
                                                tint = MoazenInkEmerald,
                                                modifier = Modifier.size(13.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "دعاء اليوم",
                                                color = MoazenInkEmerald,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                        Surface(
                                            shape = CircleShape,
                                            color = MoazenCardStart.copy(alpha = 0.90f),
                                            border = BorderStroke(0.8.dp, MoazenCardBorder),
                                            modifier = Modifier
                                                .size(21.dp)
                                                .clip(CircleShape)
                                                .clickable {
                                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                                    val shareText = "✦ دعاء اليوم ✦\n\n«${dailySnapshot.dua.text}»\n\n📚 المصدر: ${dailySnapshot.dua.source}\n🕌 عبر تطبيق رفيق المسلم"
                                                    val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                                        putExtra(Intent.EXTRA_TEXT, shareText)
                                                        type = "text/plain"
                                                    }
                                                    runCatching {
                                                        context.startActivity(Intent.createChooser(sendIntent, "مشاركة دعاء اليوم"))
                                                    }.onFailure {
                                                        Toast.makeText(context, "تعذر العثور على تطبيق للمشاركة.", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Icon(
                                                    imageVector = Icons.Default.Share,
                                                    contentDescription = "مشاركة الدعاء",
                                                    tint = MoazenInkEmerald,
                                                    modifier = Modifier.size(11.dp)
                                                )
                                            }
                                        }
                                    }
                                    Text(
                                        text = dailySnapshot.dua.text,
                                        color = MoazenInkPrimary,
                                        fontSize = 9.5.sp,
                                        lineHeight = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }

                        MoazenWidgetCard(
                            cornerRadius = 16.dp,
                            borderColor = MoazenGold,
                            borderWidth = 1.5.dp,
                            elevation = 6.dp,
                            watermarkAlpha = 0f,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                onNavigate(Screen.Hadith)
                            }
                        ) {
                            Box(modifier = Modifier.fillMaxWidth()) {
                                Image(
                                    painter = painterResource(id = R.drawable.img_hadith_mosque),
                                    contentDescription = "المسجد النبوي الشريف",
                                    contentScale = ContentScale.Crop,
                                    alpha = 0.80f,
                                    modifier = Modifier.matchParentSize()
                                )
                                Box(
                                    modifier = Modifier
                                        .matchParentSize()
                                        .background(
                                            Brush.verticalGradient(
                                                0.0f to Color(0xF5F6EEDC),
                                                0.55f to Color(0xB8F6EEDC),
                                                1.0f to Color(0x6CEEE2C8)
                                            )
                                        )
                                )
                                Column(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalArrangement = Arrangement.spacedBy(2.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.MenuBook,
                                                contentDescription = null,
                                                tint = MoazenInkEmerald,
                                                modifier = Modifier.size(13.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "حديث اليوم",
                                                color = MoazenInkEmerald,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                        Surface(
                                            shape = CircleShape,
                                            color = MoazenCardStart.copy(alpha = 0.90f),
                                            border = BorderStroke(0.8.dp, MoazenCardBorder),
                                            modifier = Modifier
                                                .size(21.dp)
                                                .clip(CircleShape)
                                                .clickable {
                                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                                    val shareText = "✦ حديث اليوم ✦\n\n${dailySnapshot.hadith.fullText}\n\n📚 المصدر: ${dailySnapshot.hadith.source}\n🕌 عبر تطبيق رفيق المسلم"
                                                    val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                                        putExtra(Intent.EXTRA_TEXT, shareText)
                                                        type = "text/plain"
                                                    }
                                                    runCatching {
                                                        context.startActivity(Intent.createChooser(sendIntent, "مشاركة حديث اليوم"))
                                                    }.onFailure {
                                                        Toast.makeText(context, "تعذر العثور على تطبيق للمشاركة.", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Icon(
                                                    imageVector = Icons.Default.Share,
                                                    contentDescription = "مشاركة الحديث",
                                                    tint = MoazenInkEmerald,
                                                    modifier = Modifier.size(11.dp)
                                                )
                                            }
                                        }
                                    }
                                    Text(
                                        text = dailySnapshot.hadith.snippet,
                                        color = MoazenInkPrimary,
                                        fontSize = 9.5.sp,
                                        lineHeight = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }

                    // Enlarged Live Hijri & Gregorian Dates Bar
                    MoazenWidgetCard(
                        cornerRadius = 14.dp,
                        borderColor = MoazenCardBorder,
                        elevation = 3.dp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp),
                        onClick = { onNavigate(Screen.Ramadan) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 10.dp, vertical = 5.5.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CalendarMonth,
                                    contentDescription = null,
                                    tint = MoazenInkEmerald,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = liveDatesLabel,
                                    color = MoazenInkPrimary,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Text(
                                text = "رمضان والمناسبات ←",
                                color = MoazenGoldDark,
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
            }
        }
    }
}
}

@Suppress("DEPRECATION")
@Composable
fun DailyPrayerMiniChip(
    name: String,
    time: String,
    isNext: Boolean,
    isDuha: Boolean = false,
    labelFontSize: TextUnit = 9.5.sp,
    timeFontSize: TextUnit = 10.sp,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = if (isNext) MuslimPlusPillEmerald else MoazenSubCardBg,
        border = when {
            isNext -> BorderStroke(1.dp, MoazenGold)
            isDuha -> BorderStroke(1.dp, MoazenGoldDark.copy(alpha = 0.65f))
            else -> BorderStroke(0.75.dp, MoazenCardBorder)
        },
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(1.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 2.dp, vertical = 3.dp)
        ) {
            Text(
                text = name,
                color = if (isNext) Color.White else if (isDuha) MoazenGoldDark else MoazenInkMuted,
                fontSize = labelFontSize,
                fontWeight = if (isNext || isDuha) FontWeight.Bold else FontWeight.SemiBold,
                maxLines = 1,
                softWrap = false,
                textAlign = TextAlign.Center,
                style = TextStyle(
                    platformStyle = PlatformTextStyle(includeFontPadding = false)
                )
            )
            Text(
                text = time,
                color = if (isNext) Color.White else MoazenInkPrimary,
                fontSize = timeFontSize,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                softWrap = false,
                textAlign = TextAlign.Center,
                style = TextStyle(
                    platformStyle = PlatformTextStyle(includeFontPadding = false)
                )
            )
        }
    }
}
