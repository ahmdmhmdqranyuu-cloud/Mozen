package com.muslim.azan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.PrayerTimeCalculator
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import com.muslim.azan.ui.navigation.Screen
import java.util.Calendar
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
    onNavigate: (Screen) -> Unit
) {
    val cal = remember { Calendar.getInstance() }
    val dayOfYear = cal.get(Calendar.DAY_OF_YEAR)
    val tz = cal.timeZone
    val tzOffsetHours = tz.getOffset(System.currentTimeMillis()) / 3600000.0

    val prayers = remember(prefs.latitude, prefs.longitude, prefs.calculationMethod, prefs.asrMethod) {
        PrayerTimeCalculator.calculateDailyPrayers(
            prefs.latitude,
            prefs.longitude,
            tzOffsetHours,
            dayOfYear,
            prefs.calculationMethod,
            prefs.asrMethod
        )
    }

    val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val nextPrayerName = remember(prayers, currentMinutes) {
        PrayerTimeCalculator.determineNextPrayerName(prayers, currentMinutes)
    }

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
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Next Prayer Card
        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = GoldAccent,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = prefs.cityName,
                                color = TextPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        Text(
                            text = "اليوم",
                            color = GoldLight,
                            fontSize = 12.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "الصلاة القادمة",
                        color = TextSecondary,
                        fontSize = 13.sp
                    )

                    Text(
                        text = "صلاة $nextPrayerName",
                        color = GoldAccent,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // 5 Daily Prayers Horizontal Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        DailyPrayerMiniChip("الفجر", PrayerTimeCalculator.formatMinutesToHHmm(prayers.fajrMinutes), nextPrayerName == "الفجر")
                        DailyPrayerMiniChip("الظهر", PrayerTimeCalculator.formatMinutesToHHmm(prayers.dhuhrMinutes), nextPrayerName == "الظهر")
                        DailyPrayerMiniChip("العصر", PrayerTimeCalculator.formatMinutesToHHmm(prayers.asrMinutes), nextPrayerName == "العصر")
                        DailyPrayerMiniChip("المغرب", PrayerTimeCalculator.formatMinutesToHHmm(prayers.maghribMinutes), nextPrayerName == "المغرب")
                        DailyPrayerMiniChip("العشاء", PrayerTimeCalculator.formatMinutesToHHmm(prayers.ishaMinutes), nextPrayerName == "العشاء")
                    }
                }
            }
        }

        // Daily Ayah / Dhikr Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldSurfaceLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "آية اليوم المباركة", color = GoldAccent, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»",
                        color = TextPrimary,
                        fontSize = 16.sp,
                        lineHeight = 24.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Right
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "سورة الرعد - الآية 28",
                        color = TextSecondary,
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
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(EmeraldSurface)
                                    .clickable {
                                        item.screen?.let { onNavigate(it) }
                                    }
                                    .padding(vertical = 16.dp, horizontal = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(42.dp)
                                            .clip(CircleShape)
                                            .background(EmeraldSurfaceLight),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = item.icon,
                                            contentDescription = item.titleAr,
                                            tint = GoldAccent,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = item.titleAr,
                                        color = TextPrimary,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                        // Fill empty weight if last row has less items
                        for (i in 0 until (3 - rowItems.size)) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DailyPrayerMiniChip(name: String, time: String, isNext: Boolean) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (isNext) GoldDark else EmeraldSurfaceLight)
            .padding(horizontal = 8.dp, vertical = 6.dp)
    ) {
        Text(
            text = name,
            color = if (isNext) Color.White else TextSecondary,
            fontSize = 11.sp
        )
        Text(
            text = time,
            color = if (isNext) Color.White else TextPrimary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
