package com.muslim.azan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.PrayerTimeCalculator
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrayerTimesScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val cal = remember { Calendar.getInstance() }
    val dayOfYear = cal.get(Calendar.DAY_OF_YEAR)
    val tz = cal.timeZone
    val tzOffsetHours = tz.getOffset(System.currentTimeMillis()) / 3600000.0

    var calcMethod by remember { mutableStateOf(prefs.calculationMethod) }
    var asrMethod by remember { mutableStateOf(prefs.asrMethod) }

    val times = remember(prefs.latitude, prefs.longitude, calcMethod, asrMethod) {
        PrayerTimeCalculator.calculateDailyPrayers(
            prefs.latitude,
            prefs.longitude,
            tzOffsetHours,
            dayOfYear,
            calcMethod,
            asrMethod
        )
    }

    val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val nextPrayerName = remember(times, currentMinutes) {
        PrayerTimeCalculator.determineNextPrayerName(times, currentMinutes)
    }

    var showCalcMethodDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = TextPrimary)
                }
                Text(
                    text = "مواقيت الصلاة الدقيقة",
                    color = TextPrimary,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Location & Next prayer highlight
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = prefs.cityName,
                        color = GoldAccent,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "الصلاة القادمة: صلاة $nextPrayerName",
                        color = TextPrimary,
                        fontSize = 14.sp
                    )
                }
            }
        }

        // Daily Prayers List
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                PrayerRowItem("الفجر", PrayerTimeCalculator.formatMinutesToHHmm(times.fajrMinutes), nextPrayerName == "الفجر")
                PrayerRowItem("الشروق", PrayerTimeCalculator.formatMinutesToHHmm(times.sunriseMinutes), false)
                PrayerRowItem("الظهر", PrayerTimeCalculator.formatMinutesToHHmm(times.dhuhrMinutes), nextPrayerName == "الظهر")
                PrayerRowItem("العصر", PrayerTimeCalculator.formatMinutesToHHmm(times.asrMinutes), nextPrayerName == "العصر")
                PrayerRowItem("المغرب", PrayerTimeCalculator.formatMinutesToHHmm(times.maghribMinutes), nextPrayerName == "المغرب")
                PrayerRowItem("العشاء", PrayerTimeCalculator.formatMinutesToHHmm(times.ishaMinutes), nextPrayerName == "العشاء")
            }
        }

        // Calculation Settings
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldSurfaceLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "طريقة الحساب الفلكي والمذهب",
                        color = GoldAccent,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(EmeraldSurface)
                            .clickable { showCalcMethodDialog = true }
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = when (calcMethod) {
                                "umm_al_qura" -> "أم القرى (مكة المكرمة)"
                                "egypt" -> "الهيئة المصرية العامة للمساحة"
                                "mwl" -> "رابطة العالم الإسلامي"
                                "isna" -> "الجمعية الإسلامية لأمريكا الشمالية"
                                "karachi" -> "جامعة العلوم الإسلامية بكراتشي"
                                else -> "أم القرى (افتراضي)"
                            },
                            color = TextPrimary,
                            fontSize = 13.sp
                        )
                        Icon(Icons.Default.ExpandMore, contentDescription = null, tint = GoldAccent)
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "مذهب حساب صلاة العصر:", color = TextSecondary, fontSize = 13.sp)
                        Row {
                            FilterChip(
                                selected = asrMethod == "standard",
                                onClick = {
                                    asrMethod = "standard"
                                    prefs.asrMethod = "standard"
                                },
                                label = { Text("الجمهور (شافعي/مالكي/حنبلي)") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = GoldDark,
                                    selectedLabelColor = Color.White
                                )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            FilterChip(
                                selected = asrMethod == "hanafi",
                                onClick = {
                                    asrMethod = "hanafi"
                                    prefs.asrMethod = "hanafi"
                                },
                                label = { Text("حنفي") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = GoldDark,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }
            }
        }
    }

    if (showCalcMethodDialog) {
        AlertDialog(
            onDismissRequest = { showCalcMethodDialog = false },
            title = { Text("اختر طريقة الحساب", color = TextPrimary) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    val methods = listOf(
                        "umm_al_qura" to "أم القرى (مكة المكرمة)",
                        "egypt" to "الهيئة العامة المصرية للمساحة",
                        "mwl" to "رابطة العالم الإسلامي",
                        "isna" to "الجمعية الإسلامية لأمريكا الشمالية",
                        "karachi" to "جامعة العلوم الإسلامية بكراتشي"
                    )
                    methods.forEach { (key, name) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (calcMethod == key) GoldDark else EmeraldSurfaceLight)
                                .clickable {
                                    calcMethod = key
                                    prefs.calculationMethod = key
                                    showCalcMethodDialog = false
                                }
                                .padding(12.dp)
                        ) {
                            Text(text = name, color = Color.White, fontSize = 13.sp)
                        }
                    }
                }
            },
            confirmButton = {},
            containerColor = EmeraldDeep
        )
    }
}

@Composable
fun PrayerRowItem(name: String, time: String, isNext: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(if (isNext) EmeraldSurfaceLight else EmeraldSurface)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Default.AccessTime,
                contentDescription = null,
                tint = if (isNext) GoldAccent else TextSecondary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = name,
                color = if (isNext) GoldAccent else TextPrimary,
                fontSize = 15.sp,
                fontWeight = if (isNext) FontWeight.Bold else FontWeight.Medium
            )
        }

        Text(
            text = time,
            color = if (isNext) GoldAccent else TextPrimary,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
