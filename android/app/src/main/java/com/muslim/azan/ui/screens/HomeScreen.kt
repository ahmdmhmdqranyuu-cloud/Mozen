package com.muslim.azan.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.muslim.azan.PrayerTimeCalculator
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard
import com.muslim.azan.ui.navigation.Screen
import kotlinx.coroutines.delay
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

data class GridItem(
    val titleAr: String,
    val icon: ImageVector,
    val screen: Screen?,
    val badge: String? = null
)

@Composable
fun HomeScreen(
    prefs: NativePreferences,
    onNavigate: (Screen) -> Unit,
    onOpenPrayerSettings: (String) -> Unit = {}
) {
    var refreshTick by remember { mutableIntStateOf(0) }
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) refreshTick++
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // Live 1-second ticker so next prayer, countdown, and Duha/day rollover stay always up to date
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
    val tzOffsetHours = remember(cityTimezoneId, refreshTick, cal.get(Calendar.DAY_OF_YEAR)) {
        PrayerTimeCalculator.resolveTimezoneOffsetHours(cityTimezoneId, cal.timeInMillis)
    }

    val prayers = remember(
        prefs.latitude,
        prefs.longitude,
        cityTimezoneId,
        prefs.calculationMethod,
        prefs.asrMethod,
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
            prefs.asrMethod
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
    val countdownText = String.format(Locale.US, "%02d:%02d:%02d", remH, remM, remS)

    val gridItems = listOf(
        GridItem("المواقيت", Icons.Default.AccessTime, Screen.PrayerTimes),
        GridItem("المصحف", Icons.Default.MenuBook, Screen.Quran),
        GridItem("الأذكار", Icons.Default.AutoStories, Screen.Azkar),
        GridItem("المسبحة", Icons.Default.TouchApp, Screen.Tasbih),
        GridItem("القبلة", Icons.Default.Explore, Screen.Qibla),
        GridItem("الأحاديث", Icons.Default.FormatQuote, Screen.Hadith),
        GridItem("الأدعية", Icons.Default.VolunteerActivism, Screen.Duas),
        GridItem("رمضان", Icons.Default.NightsStay, Screen.Ramadan, "مبارك"),
        GridItem("السيرة", Icons.Default.HistoryEdu, Screen.Seerah),
        GridItem("الأنبياء", Icons.Default.AutoStories, Screen.Prophets),
        GridItem("الزكاة", Icons.Default.Calculate, Screen.Zakat),
        GridItem("المسابقات", Icons.Default.Quiz, Screen.Quiz),
        GridItem("الحج والعمرة", Icons.Default.Mosque, Screen.Hajj),
        GridItem("الخلفيات", Icons.Default.Wallpaper, Screen.Wallpapers),
        GridItem("ملفي الشخصي", Icons.Default.Person, Screen.Profile),
        GridItem("الإعدادات", Icons.Default.Settings, Screen.Settings)
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(horizontal = 14.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Next Prayer Card (Unified Home Quran Mint Style + 7 crisp clickable mini-widgets including صلاة الضحى)
        item {
            MoazenWidgetCard(
                cornerRadius = 24.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = MoazenInkEmerald,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = prefs.cityName,
                                color = MoazenInkPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        Text(
                            text = "متبقي $countdownText",
                            color = MoazenGoldDark,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "الصلاة القادمة",
                        color = MoazenInkMuted,
                        fontSize = 13.sp
                    )

                    Text(
                        text = "صلاة $nextPrayerName",
                        color = MoazenInkEmerald,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // 7 Daily Prayers Mini-Widgets Row (الفجر، الشروق، الضحى، الظهر، العصر، المغرب، العشاء)
                    BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                        val isCompactWidth = maxWidth < 330.dp
                        val labelFontSize = if (isCompactWidth) 9.sp else 10.sp
                        val timeFontSize = if (isCompactWidth) 9.5.sp else 10.5.sp

                        val miniWidgets = listOf(
                            Triple("fajr", "الفجر", prayers.fajrMinutes),
                            Triple("sunrise", "الشروق", prayers.sunriseMinutes),
                            Triple("duha", "الضحى", prayers.duhaMinutes),
                            Triple("dhuhr", "الظهر", prayers.dhuhrMinutes),
                            Triple("asr", "العصر", prayers.asrMinutes),
                            Triple("maghrib", "المغرب", prayers.maghribMinutes),
                            Triple("isha", "العشاء", prayers.ishaMinutes)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            miniWidgets.forEach { (key, label, mins) ->
                                DailyPrayerMiniChip(
                                    name = label,
                                    time = PrayerTimeCalculator.formatMinutesToHHmm(mins),
                                    isNext = nextPrayerName == label,
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

        // Daily Ayah / Dhikr Card
        item {
            MoazenWidgetCard(
                cornerRadius = 18.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = MoazenGoldDark, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "آية اليوم المباركة", color = MoazenInkEmerald, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»",
                        color = MoazenInkPrimary,
                        fontSize = 16.sp,
                        lineHeight = 24.sp,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Right,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "سورة الرعد - الآية 28",
                        color = MoazenInkMuted,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // Quick Feature Grid Header
        item {
            Text(
                text = "الأقسام والخدمات الإسلامية",
                color = TextPrimary,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }

        // Grid of services
        item {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                val chunked = gridItems.chunked(3)
                chunked.forEach { rowItems ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        rowItems.forEach { item ->
                            MoazenWidgetCard(
                                cornerRadius = 16.dp,
                                modifier = Modifier.weight(1f),
                                onClick = {
                                    item.screen?.let { onNavigate(it) }
                                }
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 16.dp, horizontal = 8.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(42.dp)
                                            .clip(CircleShape)
                                            .background(MoazenInkEmerald.copy(alpha = 0.12f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = item.icon,
                                            contentDescription = item.titleAr,
                                            tint = MoazenInkEmerald,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = item.titleAr,
                                        color = MoazenInkPrimary,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                        for (i in 0 until (3 - rowItems.size)) {
                            Spacer(modifier = Modifier.weight(1f))
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
    labelFontSize: TextUnit = 10.sp,
    timeFontSize: TextUnit = 10.5.sp,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = if (isNext) MoazenInkEmerald else Color.White.copy(alpha = 0.78f),
        border = when {
            isNext -> null
            isDuha -> BorderStroke(1.dp, MoazenGoldDark.copy(alpha = 0.65f))
            else -> BorderStroke(0.75.dp, MoazenCardBorder)
        },
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(3.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 2.dp, vertical = 7.dp)
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
