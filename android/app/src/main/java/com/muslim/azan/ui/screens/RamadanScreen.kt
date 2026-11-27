package com.muslim.azan.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard

@Composable
fun RamadanScreen(
    prefs: NativePreferences,
    onBack: () -> Unit,
    onOpenZakat: () -> Unit = {}
) {
    val context = LocalContext.current
    val todayKey = remember {
        java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
    }
    val initialHabits = remember(todayKey) { prefs.getRamadanDailyHabits(todayKey) }
    var fastedToday by remember { mutableStateOf(initialHabits["fasted"] ?: true) }
    var taraweehDone by remember { mutableStateOf(initialHabits["taraweeh"] ?: false) }
    var quranDone by remember { mutableStateOf(initialHabits["quran"] ?: false) }
    var charityDone by remember { mutableStateOf(initialHabits["charity"] ?: false) }

    var fastingDays by remember {
        mutableStateOf<Map<Int, String>>(prefs.getRamadanFastingDays())
    }
    val fastedCount = remember(fastingDays) {
        fastingDays.values.count { it == "fasted" }
    }
    val missedCount = remember(fastingDays) {
        fastingDays.values.count { it == "missed" }
    }
    val remainingCount = (30 - fastedCount - missedCount).coerceAtLeast(0)
    val nextTrackDay = remember(fastingDays) {
        (1..30).firstOrNull { (fastingDays[it] ?: "pending") == "pending" } ?: 30
    }

    fun cycleDayStatus(day: Int) {
        val current = fastingDays[day] ?: "pending"
        val next = when (current) {
            "pending" -> "fasted"
            "fasted" -> "missed"
            else -> "pending"
        }
        prefs.setRamadanDayStatus(day, next)
        fastingDays = prefs.getRamadanFastingDays()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MuslimPlusCanvasBrush)
            .padding(16.dp)
    ) {
        MoazenWidgetCard(
            cornerRadius = 16.dp,
            borderColor = MoazenCardBorder,
            elevation = 3.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = MoazenInkEmerald)
                    }
                    Text(
                        text = "شهر رمضان المبارك",
                        color = MoazenInkEmerald,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                TextButton(onClick = onOpenZakat) {
                    Text("حاسبة الزكاة", color = MoazenGoldDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                MoazenWidgetCard(
                    cornerRadius = 20.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "رمضان كريم مبارك",
                            color = MoazenInkEmerald,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "«شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ»",
                            color = MoazenInkPrimary,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Medium,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = {
                                NativeAudioPlayerManager.playAssetAudio(context, "audio/iftar_cannon.mp3", "مدفع الإفطار", "تكبيرات ومدفع الإفطار")
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald)
                        ) {
                            Text(text = "سماع صوت مدفع الإفطار", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // 30-Day Interactive Persisted Ramadan Fasting Tracker
            item {
                MoazenWidgetCard(
                    cornerRadius = 20.dp,
                    borderColor = MoazenGold,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "متتبع صيام رمضان (30 يومًا)",
                                    color = MoazenInkEmerald,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "اضغط على أي يوم لتبديل حالته: صائم ✓ / مفطر ✕ / متبقي",
                                    color = MoazenInkMuted,
                                    fontSize = 10.5.sp
                                )
                            }
                        }

                        // Summary Counts & Progress Bar
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color(0xFFE6F4EC),
                                border = BorderStroke(1.dp, EmeraldPrimaryDark.copy(alpha = 0.35f)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                ) {
                                    Text("$fastedCount", color = EmeraldPrimaryDark, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                    Text("تم صيامه", color = MoazenInkPrimary, fontSize = 10.5.sp)
                                }
                            }
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color(0xFFFDF2F2),
                                border = BorderStroke(1.dp, ErrorRed.copy(alpha = 0.35f)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                ) {
                                    Text("$missedCount", color = ErrorRed, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                    Text("مفطر / عذر", color = MoazenInkPrimary, fontSize = 10.5.sp)
                                }
                            }
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MoazenSubCardBg,
                                border = BorderStroke(1.dp, MoazenCardBorder),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                ) {
                                    Text("$remainingCount", color = MoazenGoldDark, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                    Text("متبقي", color = MoazenInkPrimary, fontSize = 10.5.sp)
                                }
                            }
                        }

                        LinearProgressIndicator(
                            progress = { (fastedCount / 30f).coerceIn(0f, 1f) },
                            color = EmeraldPrimaryDark,
                            trackColor = MoazenCardBorder.copy(alpha = 0.4f),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                        )

                        Button(
                            onClick = {
                                val curr = fastingDays[nextTrackDay] ?: "pending"
                                val target = if (curr == "fasted") "missed" else "fasted"
                                prefs.setRamadanDayStatus(nextTrackDay, target)
                                fastingDays = prefs.getRamadanFastingDays()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "تسجيل صيام اليوم رقم $nextTrackDay بنية خالصة ✓",
                                color = Color.White,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // 30 Days 6x5 Grid
                        (1..30).chunked(6).forEach { weekDays ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                weekDays.forEach { day ->
                                    val st = fastingDays[day] ?: "pending"
                                    val bgColor = when (st) {
                                        "fasted" -> MuslimPlusPillEmerald
                                        "missed" -> Color(0xFFFDE8E8)
                                        else -> MoazenChipUnselectedBg
                                    }
                                    val borderColor = when (st) {
                                        "fasted" -> MoazenGold
                                        "missed" -> ErrorRed.copy(alpha = 0.6f)
                                        else -> MoazenCardBorder
                                    }
                                    val textColor = when (st) {
                                        "fasted" -> Color.White
                                        "missed" -> ErrorRed
                                        else -> MoazenInkPrimary
                                    }
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center,
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(bgColor)
                                            .border(1.dp, borderColor, RoundedCornerShape(10.dp))
                                            .clickable { cycleDayStatus(day) }
                                            .padding(vertical = 7.dp)
                                    ) {
                                        Text(
                                            text = "$day",
                                            color = textColor,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = when (st) {
                                                "fasted" -> "✓"
                                                "missed" -> "✕"
                                                else -> "•"
                                            },
                                            color = textColor,
                                            fontSize = 10.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item {
                Text(
                    text = "جدول متابعة الطاعات والعبادات اليومية:",
                    color = MoazenInkEmerald,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            item {
                ChecklistCard("صيام اليوم بنية خالصة", fastedToday) {
                    fastedToday = !fastedToday
                    prefs.setRamadanDailyHabit(todayKey, "fasted", fastedToday)
                }
            }
            item {
                ChecklistCard("صلاة التراويح وقيام الليل", taraweehDone) {
                    taraweehDone = !taraweehDone
                    prefs.setRamadanDailyHabit(todayKey, "taraweeh", taraweehDone)
                }
            }
            item {
                ChecklistCard("قراءة الورد اليومي من القرآن الكريم", quranDone) {
                    quranDone = !quranDone
                    prefs.setRamadanDailyHabit(todayKey, "quran", quranDone)
                }
            }
            item {
                ChecklistCard("الصدقة وإفطار صائم", charityDone) {
                    charityDone = !charityDone
                    prefs.setRamadanDailyHabit(todayKey, "charity", charityDone)
                }
            }
        }
    }
}

@Composable
fun ChecklistCard(title: String, isChecked: Boolean, onToggle: () -> Unit) {
    MoazenWidgetCard(
        cornerRadius = 14.dp,
        modifier = Modifier.fillMaxWidth(),
        onClick = onToggle
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = title, color = MoazenInkPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            IconButton(onClick = onToggle) {
                Icon(
                    imageVector = if (isChecked) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                    contentDescription = null,
                    tint = if (isChecked) MoazenInkEmerald else MoazenInkMuted
                )
            }
        }
    }
}

