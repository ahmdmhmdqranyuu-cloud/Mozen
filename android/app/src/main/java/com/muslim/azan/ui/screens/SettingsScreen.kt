package com.muslim.azan.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.BootReceiver
import com.muslim.azan.data.MediaFileManager
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*

@Composable
fun SettingsScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current

    // Expanded states for the 10 sections
    var expandedSection by remember { mutableStateOf<Int?>(null) }

    fun toggleSection(index: Int) {
        expandedSection = if (expandedSection == index) null else index
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Header
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .background(EmeraldSurfaceLight),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = GoldAccent)
                        }
                        Box(
                            modifier = Modifier.weight(1f),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "الإعدادات",
                                color = TextPrimary,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )
                        }
                        Spacer(modifier = Modifier.size(48.dp))
                    }
                }
            }
        }

        // Section 1: Profile & Stats (الملف الشخصي)
        item {
            SettingsCollapsibleCard(
                title = "1. الملف الشخصي والإحصائيات",
                icon = Icons.Default.Person,
                isExpanded = expandedSection == 1,
                onToggle = { toggleSection(1) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "إجمالي التسبيحات المسجلة:", color = TextSecondary, fontSize = 13.sp)
                        Text(text = "${prefs.totalTasbihCount} تسبيحة", color = GoldAccent, fontWeight = FontWeight.Bold)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "آخر سورة تمت قراءتها:", color = TextSecondary, fontSize = 13.sp)
                        val s = NativeDataManager.surahs.find { it.number == prefs.lastReadSurah }
                        Text(text = "سورة ${s?.nameArabic ?: "الفاتحة"}", color = TextPrimary, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }

        // Section 2: Permissions (الأذونات والتنبيهات)
        item {
            SettingsCollapsibleCard(
                title = "2. الأذونات وصلاحيات النظام",
                icon = Icons.Default.Security,
                isExpanded = expandedSection == 2,
                onToggle = { toggleSection(2) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "لضمان تشغيل الأذان والأذكار بدقة متناهية في موعدها دون تأخير:",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )

                    Button(
                        onClick = {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                try {
                                    val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                                        data = Uri.parse("package:" + context.packageName)
                                    }
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    openAppSettings(context)
                                }
                            } else {
                                openAppSettings(context)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("إذن التنبيهات الدقيقة (Exact Alarms)", color = TextPrimary)
                    }

                    Button(
                        onClick = {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                try {
                                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                                        data = Uri.parse("package:" + context.packageName)
                                    }
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    openAppSettings(context)
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("تحسين استهلاك البطارية (عدم إيقاف التطبيق)", color = TextPrimary)
                    }
                }
            }
        }

        // Section 3: Location & Time (تحديد الموقع والوقت)
        item {
            SettingsCollapsibleCard(
                title = "3. تحديد الموقع والوقت",
                icon = Icons.Default.LocationOn,
                isExpanded = expandedSection == 3,
                onToggle = { toggleSection(3) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "المدينة الحالية: ${prefs.cityName}",
                        color = GoldAccent,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = "اختر مدينتك من القائمة المدمجة (بدون إنترنت):",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )

                    NativeDataManager.defaultCities.take(6).forEach { city ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (prefs.cityName == city.nameAr) GoldDark else EmeraldSurfaceLight)
                                .clickable {
                                    prefs.setCity(city)
                                    BootReceiver.recalculateAndScheduleAll(context)
                                    Toast.makeText(context, "تم تحديد ${city.nameAr} وإعادة جدولة الأذان", Toast.LENGTH_SHORT).show()
                                }
                                .padding(10.dp)
                        ) {
                            Text(text = "${city.nameAr} - ${city.country}", color = Color.White, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        // Section 4: Language (اللغة)
        item {
            SettingsCollapsibleCard(
                title = "4. لغة التطبيق والواجهة",
                icon = Icons.Default.Language,
                isExpanded = expandedSection == 4,
                onToggle = { toggleSection(4) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(GoldDark)
                            .padding(10.dp)
                    ) {
                        Text("العربية (اللغة الافتراضية)", color = Color.White, fontSize = 13.sp)
                    }
                }
            }
        }

        // Section 5: Azan Settings (إعدادات الأذان)
        item {
            SettingsCollapsibleCard(
                title = "5. إعدادات الأذان والأصوات",
                icon = Icons.Default.VolumeUp,
                isExpanded = expandedSection == 5,
                onToggle = { toggleSection(5) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("تشغيل صوت الأذان تلقائيًا:", color = TextPrimary, fontSize = 13.sp)
                        Switch(
                            checked = prefs.azanSoundEnabled,
                            onCheckedChange = {
                                prefs.azanSoundEnabled = it
                                BootReceiver.recalculateAndScheduleAll(context)
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent, checkedTrackColor = GoldDark)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("تنبيه قبل الصلاة بـ 15 دقيقة:", color = TextPrimary, fontSize = 13.sp)
                        Switch(
                            checked = prefs.prePrayerAlertEnabled,
                            onCheckedChange = {
                                prefs.prePrayerAlertEnabled = it
                                BootReceiver.recalculateAndScheduleAll(context)
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent, checkedTrackColor = GoldDark)
                        )
                    }
                }
            }
        }

        // Section 6: Azkar Reminders (إعداد الأذكار والصلوات)
        item {
            SettingsCollapsibleCard(
                title = "6. تنبيهات الأذكار والصلوات على النبي",
                icon = Icons.Default.Alarm,
                isExpanded = expandedSection == 6,
                onToggle = { toggleSection(6) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("تذكير الصلاة على النبي ﷺ الدوري:", color = TextPrimary, fontSize = 13.sp)
                        Switch(
                            checked = prefs.salawatEnabled,
                            onCheckedChange = {
                                prefs.salawatEnabled = it
                                BootReceiver.recalculateAndScheduleAll(context)
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent, checkedTrackColor = GoldDark)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("أذكار الصباح (الساعة ${prefs.morningAzkarTime}):", color = TextPrimary, fontSize = 13.sp)
                        Switch(
                            checked = prefs.morningAzkarEnabled,
                            onCheckedChange = {
                                prefs.morningAzkarEnabled = it
                                BootReceiver.recalculateAndScheduleAll(context)
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent, checkedTrackColor = GoldDark)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("أذكار المساء (الساعة ${prefs.eveningAzkarTime}):", color = TextPrimary, fontSize = 13.sp)
                        Switch(
                            checked = prefs.eveningAzkarEnabled,
                            onCheckedChange = {
                                prefs.eveningAzkarEnabled = it
                                BootReceiver.recalculateAndScheduleAll(context)
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent, checkedTrackColor = GoldDark)
                        )
                    }
                }
            }
        }

        // Section 7: Ramadan Settings (رمضان)
        item {
            SettingsCollapsibleCard(
                title = "7. إعدادات شهر رمضان المبارك",
                icon = Icons.Default.NightsStay,
                isExpanded = expandedSection == 7,
                onToggle = { toggleSection(7) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("تنبيه نداء المسحراتي قبل الفجر:", color = TextPrimary, fontSize = 13.sp)
                        Switch(
                            checked = prefs.musaharatiEnabled,
                            onCheckedChange = {
                                prefs.musaharatiEnabled = it
                                BootReceiver.recalculateAndScheduleAll(context)
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent, checkedTrackColor = GoldDark)
                        )
                    }
                }
            }
        }

        // Section 8: Privacy Policy (سياسة الخصوصية)
        item {
            SettingsCollapsibleCard(
                title = "8. سياسة الخصوصية وأمان البيانات",
                icon = Icons.Default.PrivacyTip,
                isExpanded = expandedSection == 8,
                onToggle = { toggleSection(8) }
            ) {
                Text(
                    text = "تطبيق المؤذن يحترم خصوصيتك بنسبة 100%. جميع مواقيت الصلاة والأذكار والتسبيحات تعمل محليًا دون جمع أي بيانات شخصية أو إرسالها إلى أي خوادم خارجية.",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )
            }
        }

        // Section 9: About (حول التطبيق)
        item {
            SettingsCollapsibleCard(
                title = "9. حول تطبيق المؤذن",
                icon = Icons.Default.Info,
                isExpanded = expandedSection == 9,
                onToggle = { toggleSection(9) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(text = "تطبيق المؤذن - الإصدار 2.1.0 Native", color = GoldAccent, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(text = "تطبيق إسلامي شامل صدقة جارية خالصة لوجه الله تعالى.", color = TextSecondary, fontSize = 12.sp)
                }
            }
        }

        // Section 10: Reset & Storage (تسجيل الخروج وإدارة التخزين)
        item {
            SettingsCollapsibleCard(
                title = "10. إدارة التخزين المؤقت",
                icon = Icons.Default.CleaningServices,
                isExpanded = expandedSection == 10,
                onToggle = { toggleSection(10) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "تنظيف الملفات المؤقتة فقط دون المساس بالمفضلات أو المحفوظات:",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )
                    Button(
                        onClick = {
                            val freed = MediaFileManager.cleanTemporaryCache(context)
                            Toast.makeText(context, "تم تنظيف $freed بايت من الملفات المؤقتة بنجاح", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("تنظيف الذاكرة المؤقتة (Cache Cleanup)", color = TextPrimary)
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsCollapsibleCard(
    title: String,
    icon: ImageVector,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    content: @Composable () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onToggle() },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(EmeraldSurfaceLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(icon, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(24.dp))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = title,
                        color = TextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Icon(
                    imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = TextSecondary
                )
            }

            AnimatedVisibility(visible = isExpanded) {
                Column(modifier = Modifier.padding(top = 14.dp)) {
                    Divider(color = CardBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(14.dp))
                    content()
                }
            }
        }
    }
}

private fun openAppSettings(context: Context) {
    try {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:" + context.packageName)
        }
        context.startActivity(intent)
    } catch (ignored: Exception) {}
}
