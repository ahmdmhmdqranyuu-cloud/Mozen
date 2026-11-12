package com.muslim.azan.ui.screens

import android.content.Context
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val todayKey = remember {
        SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH).format(Date())
    }

    val sharedPrefs = remember {
        context.getSharedPreferences("azan_prayer_tracker", Context.MODE_PRIVATE)
    }

    // Daily prayer status (Fajr, Dhuhr, Asr, Maghrib, Isha)
    var fajrDone by remember { mutableStateOf(sharedPrefs.getBoolean("${todayKey}_fajr", false)) }
    var dhuhrDone by remember { mutableStateOf(sharedPrefs.getBoolean("${todayKey}_dhuhr", false)) }
    var asrDone by remember { mutableStateOf(sharedPrefs.getBoolean("${todayKey}_asr", false)) }
    var maghribDone by remember { mutableStateOf(sharedPrefs.getBoolean("${todayKey}_maghrib", false)) }
    var ishaDone by remember { mutableStateOf(sharedPrefs.getBoolean("${todayKey}_isha", false)) }

    val completedCount = listOf(fajrDone, dhuhrDone, asrDone, maghribDone, ishaDone).count { it }
    val lastSurah = remember(prefs.lastReadSurah) {
        NativeDataManager.surahs.find { it.number == prefs.lastReadSurah }?.nameArabic ?: "الفاتحة"
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("الملف الشخصي والإحصائيات", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = GoldAccent)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = EmeraldDeep)
            )
        },
        containerColor = EmeraldDeep
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // User Avatar Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(GoldAccent.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(42.dp))
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "مسلم يرجو رحمة ربه",
                            color = TextPrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = "الموقع الحالي: ${prefs.cityName}",
                            color = GoldLight,
                            fontSize = 12.sp
                        )
                    }
                }
            }

            // Daily Prayer Tracker Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "متابعة صلوات اليوم",
                                color = GoldAccent,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "$completedCount من 5",
                                color = TextSecondary,
                                fontSize = 13.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        LinearProgressIndicator(
                            progress = { completedCount / 5f },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = GoldAccent,
                            trackColor = EmeraldSurfaceLight
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        val prayerItems = listOf(
                            Triple("الفجر", fajrDone) { newState: Boolean ->
                                fajrDone = newState
                                sharedPrefs.edit().putBoolean("${todayKey}_fajr", newState).apply()
                            },
                            Triple("الظهر", dhuhrDone) { newState: Boolean ->
                                dhuhrDone = newState
                                sharedPrefs.edit().putBoolean("${todayKey}_dhuhr", newState).apply()
                            },
                            Triple("العصر", asrDone) { newState: Boolean ->
                                asrDone = newState
                                sharedPrefs.edit().putBoolean("${todayKey}_asr", newState).apply()
                            },
                            Triple("المغرب", maghribDone) { newState: Boolean ->
                                maghribDone = newState
                                sharedPrefs.edit().putBoolean("${todayKey}_maghrib", newState).apply()
                            },
                            Triple("العشاء", ishaDone) { newState: Boolean ->
                                ishaDone = newState
                                sharedPrefs.edit().putBoolean("${todayKey}_isha", newState).apply()
                            }
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            prayerItems.forEach { (name, done, onToggle) ->
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.clickable { onToggle(!done) }
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(44.dp)
                                            .clip(CircleShape)
                                            .background(if (done) GoldAccent else EmeraldSurfaceLight),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = if (done) Icons.Default.Check else Icons.Default.AccessTime,
                                            contentDescription = name,
                                            tint = if (done) EmeraldDeep else TextSecondary,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = name,
                                        color = if (done) GoldLight else TextSecondary,
                                        fontSize = 11.sp,
                                        fontWeight = if (done) FontWeight.Bold else FontWeight.Normal
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Stats Quick Overview
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Quran Progress
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.MenuBook, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(28.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "آخر قراءة للقرآن", color = TextSecondary, fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = lastSurah,
                                color = TextPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = "الآية ${prefs.lastReadAyah}",
                                color = GoldLight,
                                fontSize = 10.sp
                            )
                        }
                    }

                    // Tasbih Count
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.TouchApp, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(28.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "مجموع التسبيحات", color = TextSecondary, fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "${prefs.totalTasbihCount}",
                                color = GoldAccent,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "تسبيحة مباركة",
                                color = GoldLight,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }

            // Spiritual Badges Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(
                            text = "الأوسمة والإنجازات الإيمانية",
                            color = GoldAccent,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        val badges = listOf(
                            Triple("المحافظ على الصلاة", "أتم الصلوات الخمس في وقتها", completedCount >= 5),
                            Triple("المسبّح الدائم", "أتم أكثر من 100 تسبيحة", prefs.totalTasbihCount >= 100),
                            Triple("المقبل على كتاب الله", "واظب على قراءة القرآن الكريم", prefs.lastReadSurah > 1 || prefs.getBookmarks().isNotEmpty()),
                            Triple("الذاكر لله كثيراً", "تفعيل أذكار الصباح والمساء", prefs.morningAzkarEnabled && prefs.eveningAzkarEnabled)
                        )

                        badges.forEach { (title, desc, isUnlocked) ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(if (isUnlocked) GoldAccent else EmeraldSurfaceLight),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.MilitaryTech,
                                        contentDescription = null,
                                        tint = if (isUnlocked) EmeraldDeep else TextSecondary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = title,
                                        color = if (isUnlocked) TextPrimary else TextSecondary,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = desc,
                                        color = if (isUnlocked) GoldLight else TextSecondary.copy(alpha = 0.6f),
                                        fontSize = 11.sp
                                    )
                                }
                                if (isUnlocked) {
                                    Text(
                                        text = "مكتمل",
                                        color = GoldAccent,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
