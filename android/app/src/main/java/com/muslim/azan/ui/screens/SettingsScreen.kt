package com.muslim.azan.ui.screens

import android.Manifest
import android.content.Intent
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.muslim.azan.AlarmScheduler
import com.muslim.azan.AzkarAudioService
import com.muslim.azan.BootReceiver
import com.muslim.azan.data.MediaFileManager
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()

    var expandedSection by remember { mutableStateOf<Int?>(null) }
    var permissionRefreshTick by remember { mutableIntStateOf(0) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                permissionRefreshTick++
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    // Reactive preference states
    var selectedCityName by remember { mutableStateOf(prefs.cityName) }
    var citySearchQuery by remember { mutableStateOf("") }
    var isDetectingGps by remember { mutableStateOf(false) }

    var azanSoundEnabled by remember { mutableStateOf(prefs.azanSoundEnabled) }
    var prePrayerAlertEnabled by remember { mutableStateOf(prefs.prePrayerAlertEnabled) }
    var selectedAzanVoice by remember { mutableStateOf(prefs.azanVoice) }
    var backgroundTestScheduledNote by remember { mutableStateOf<String?>(null) }

    var salawatEnabled by remember { mutableStateOf(prefs.salawatEnabled) }
    var morningAzkarEnabled by remember { mutableStateOf(prefs.morningAzkarEnabled) }
    var eveningAzkarEnabled by remember { mutableStateOf(prefs.eveningAzkarEnabled) }
    var musaharatiEnabled by remember { mutableStateOf(prefs.musaharatiEnabled) }

    val permStatus = remember(expandedSection, permissionRefreshTick) {
        SystemPermissionHelper.checkPermissions(context)
    }

    fun runGpsDetection() {
        isDetectingGps = true
        coroutineScope.launch {
            val result = SystemPermissionHelper.detectAndSaveGpsLocation(context, prefs)
            isDetectingGps = false
            result.onSuccess { detectedCity ->
                selectedCityName = prefs.cityName
                coroutineScope.launch(Dispatchers.IO) {
                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                }
                Toast.makeText(
                    context,
                    "تم تحديد موقعك ($detectedCity) وإعادة جدولة الأذان",
                    Toast.LENGTH_SHORT
                ).show()
            }.onFailure { err ->
                Toast.makeText(
                    context,
                    err.message ?: "تعذر التقاط الموقع عبر GPS",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    val locationPermLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            runGpsDetection()
        } else {
            Toast.makeText(context, "يرجى منح صلاحية الموقع لتشغيل التحديد التلقائي", Toast.LENGTH_SHORT).show()
        }
    }

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
        // Header (preserved centered title in green rectangle)
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

        // Section 1: Profile & Stats
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

        // Section 2: Permissions & Overlay
        item {
            SettingsCollapsibleCard(
                title = "2. الأذونات وصلاحيات النظام",
                icon = Icons.Default.Security,
                isExpanded = expandedSection == 2,
                onToggle = { toggleSection(2) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "لضمان تشغيل الأذان والأذكار والنافذة العائمة في الخلفية وعلى الشاشة المقفلة (Android 14-16):",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )

                    PermissionStatusLine("إذن الإشعارات:", permStatus.notificationsGranted)
                    PermissionStatusLine("إذن المنبهات الدقيقة:", permStatus.exactAlarmsGranted)
                    PermissionStatusLine("الظهور فوق التطبيقات:", permStatus.overlayGranted)
                    PermissionStatusLine(
                        "استثناء توفير البطارية:",
                        permStatus.batteryUnrestricted,
                        falseText = "مقيد (يُنصح بالاستثناء)",
                        falseColor = GoldAccent
                    )
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        PermissionStatusLine("الظهور على شاشة القفل:", permStatus.fullScreenIntentGranted)
                    }

                    Button(
                        onClick = { SystemPermissionHelper.openNotificationSettings(context) },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("إعدادات إشعارات التطبيق", color = TextPrimary)
                    }

                    Button(
                        onClick = { SystemPermissionHelper.openExactAlarmSettings(context) },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("إذن التنبيهات الدقيقة (Exact Alarms)", color = TextPrimary)
                    }

                    Button(
                        onClick = { SystemPermissionHelper.openOverlaySettings(context) },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("إذن الظهور فوق التطبيقات الأخرى (Overlay)", color = TextPrimary)
                    }

                    Button(
                        onClick = { SystemPermissionHelper.openBatteryOptimizationSettings(context) },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("تحسين استهلاك البطارية (عدم إيقاف التطبيق)", color = TextPrimary)
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        Button(
                            onClick = { SystemPermissionHelper.openFullScreenIntentSettings(context) },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("إذن الظهور على شاشة القفل (Full Screen Intent)", color = TextPrimary)
                        }
                    }

                    Button(
                        onClick = {
                            if (!SystemPermissionHelper.checkPermissions(context).overlayGranted) {
                                Toast.makeText(
                                    context,
                                    "يرجى تفعيل إذن «الظهور فوق التطبيقات الأخرى» أولًا",
                                    Toast.LENGTH_LONG
                                ).show()
                                SystemPermissionHelper.openOverlaySettings(context)
                            } else {
                                val overlayIntent = Intent(context, AzkarAudioService::class.java).apply {
                                    action = AzkarAudioService.ACTION_SHOW_OVERLAY_TEST
                                    putExtra("title", "تجربة نافذة الأذان العائمة")
                                    putExtra("body", "تظهر هذه النافذة فوق أي تطبيق مفتوح عند دخول وقت الأذان في $selectedCityName")
                                }
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                    context.startForegroundService(overlayIntent)
                                } else {
                                    context.startService(overlayIntent)
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Layers, contentDescription = null, tint = EmeraldDeep, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("تجربة النافذة العائمة فوق التطبيقات", color = EmeraldDeep, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Section 3: Location & Time (All 22 Cities + GPS)
        item {
            SettingsCollapsibleCard(
                title = "3. تحديد الموقع والوقت",
                icon = Icons.Default.LocationOn,
                isExpanded = expandedSection == 3,
                onToggle = { toggleSection(3) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "المدينة الحالية: $selectedCityName",
                        color = GoldAccent,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Button(
                        onClick = {
                            if (SystemPermissionHelper.checkPermissions(context).locationGranted) {
                                runGpsDetection()
                            } else {
                                locationPermLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        },
                        enabled = !isDetectingGps,
                        colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.MyLocation, contentDescription = null, tint = EmeraldDeep, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isDetectingGps) "جاري التقاط موقعك عبر GPS..." else "تحديد موقعي التلقائي عبر GPS",
                            color = EmeraldDeep,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    OutlinedTextField(
                        value = citySearchQuery,
                        onValueChange = { citySearchQuery = it },
                        placeholder = { Text("ابحث عن مدينة أو دولة...", color = TextSecondary, fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = GoldAccent) },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = GoldAccent,
                            unfocusedBorderColor = CardBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    val filteredCities = NativeDataManager.defaultCities.filter { city ->
                        citySearchQuery.isBlank() ||
                            city.nameAr.contains(citySearchQuery.trim(), ignoreCase = true) ||
                            city.country.contains(citySearchQuery.trim(), ignoreCase = true)
                    }

                    Text(
                        text = "أو اختر مدينتك من القائمة المدمجة (${filteredCities.size} مدينة):",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )

                    filteredCities.forEach { city ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (selectedCityName == city.nameAr) GoldDark else EmeraldSurfaceLight)
                                .clickable {
                                    prefs.setCity(city)
                                    selectedCityName = city.nameAr
                                    coroutineScope.launch(Dispatchers.IO) {
                                        BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                    }
                                    Toast.makeText(
                                        context,
                                        "تم تحديد ${city.nameAr} وضبط الحساب والتوقيت التلقائي",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "${city.nameAr} - ${city.country}", color = Color.White, fontSize = 13.sp)
                            Text(
                                text = when (city.recommendedCalcMethod) {
                                    "egypt" -> "المصرية"
                                    "mwl" -> "الرابطة"
                                    "isna" -> "أمريكا ش"
                                    "karachi" -> "كراتشي"
                                    else -> "أم القرى"
                                },
                                color = GoldLight,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }

        // Section 4: Language
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

        // Section 5: Azan Settings & Genuine Background Test
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
                            checked = azanSoundEnabled,
                            onCheckedChange = {
                                azanSoundEnabled = it
                                prefs.azanSoundEnabled = it
                                coroutineScope.launch(Dispatchers.IO) {
                                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                }
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
                            checked = prePrayerAlertEnabled,
                            onCheckedChange = {
                                prePrayerAlertEnabled = it
                                prefs.prePrayerAlertEnabled = it
                                coroutineScope.launch(Dispatchers.IO) {
                                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                }
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent, checkedTrackColor = GoldDark)
                        )
                    }

                    Text("صوت المؤذن المختار:", color = GoldAccent, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    val azanVoices = listOf(
                        "makkah" to "أذان المسجد الحرام (مكة)",
                        "madinah" to "أذان المسجد النبوي (المدينة)",
                        "alaqsa" to "أذان المسجد الأقصى",
                        "cairo" to "أذان القاهرة (الشيخ محمد رفعت/الشعشاعي)",
                        "alafasy" to "الشيخ مشاري العفاسي"
                    )
                    azanVoices.forEach { (voiceKey, voiceLabel) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (selectedAzanVoice == voiceKey) GoldDark else EmeraldSurfaceLight)
                                .clickable {
                                    selectedAzanVoice = voiceKey
                                    prefs.azanVoice = voiceKey
                                    coroutineScope.launch(Dispatchers.IO) {
                                        BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                    }
                                    Toast.makeText(context, "تم اختيار: $voiceLabel", Toast.LENGTH_SHORT).show()
                                }
                                .padding(10.dp)
                        ) {
                            Text(text = voiceLabel, color = Color.White, fontSize = 12.sp)
                        }
                    }

                    // Genuine 5-second AlarmManager background test
                    Button(
                        onClick = {
                            val scheduledAt = AlarmScheduler.scheduleBackgroundTestAlarm(
                                context,
                                selectedAzanVoice,
                                selectedCityName,
                                5
                            )
                            if (scheduledAt > 0L) {
                                backgroundTestScheduledNote = "تمت الجدولة! صغّر التطبيق أو اقفل الشاشة الآن — سيعمل الأذان والنافذة العائمة تلقائيًا بعد 5 ثوانٍ."
                                Toast.makeText(
                                    context,
                                    "صغّر التطبيق الآن.. سيعمل الأذان بعد 5 ثوانٍ من الخلفية",
                                    Toast.LENGTH_LONG
                                ).show()
                            } else {
                                Toast.makeText(context, "تعذر جدولة الاختبار، تأكد من إذن المنبهات الدقيقة", Toast.LENGTH_LONG).show()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Schedule, contentDescription = null, tint = EmeraldDeep, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "اختبار حقيقي في الخلفية (بعد 5 ثوانٍ)",
                            color = EmeraldDeep,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    if (backgroundTestScheduledNote != null) {
                        Text(
                            text = backgroundTestScheduledNote ?: "",
                            color = SuccessGreen,
                            fontSize = 12.sp,
                            lineHeight = 18.sp
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                val testIntent = Intent(context, AzkarAudioService::class.java).apply {
                                    putExtra("section", "prayer_azan")
                                    putExtra("prayerName", "الاختبار الفوري")
                                    putExtra("cityName", selectedCityName)
                                    putExtra("audioTrackId", selectedAzanVoice)
                                    putExtra("autoPlay", true)
                                }
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                    context.startForegroundService(testIntent)
                                } else {
                                    context.startService(testIntent)
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("تشغيل فوري", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                        Button(
                            onClick = {
                                val stopIntent = Intent(context, AzkarAudioService::class.java).apply {
                                    action = AzkarAudioService.ACTION_STOP_AUDIO
                                }
                                context.startService(stopIntent)
                                backgroundTestScheduledNote = null
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Stop, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("إيقاف الصوت", color = TextPrimary, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // Section 6: Azkar Reminders
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
                            checked = salawatEnabled,
                            onCheckedChange = {
                                salawatEnabled = it
                                prefs.salawatEnabled = it
                                coroutineScope.launch(Dispatchers.IO) {
                                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                }
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
                            checked = morningAzkarEnabled,
                            onCheckedChange = {
                                morningAzkarEnabled = it
                                prefs.morningAzkarEnabled = it
                                coroutineScope.launch(Dispatchers.IO) {
                                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                }
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
                            checked = eveningAzkarEnabled,
                            onCheckedChange = {
                                eveningAzkarEnabled = it
                                prefs.eveningAzkarEnabled = it
                                coroutineScope.launch(Dispatchers.IO) {
                                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                }
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent, checkedTrackColor = GoldDark)
                        )
                    }
                }
            }
        }

        // Section 7: Ramadan Settings
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
                            checked = musaharatiEnabled,
                            onCheckedChange = {
                                musaharatiEnabled = it
                                prefs.musaharatiEnabled = it
                                coroutineScope.launch(Dispatchers.IO) {
                                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                }
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent, checkedTrackColor = GoldDark)
                        )
                    }
                }
            }
        }

        // Section 8: Privacy Policy
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

        // Section 9: About
        item {
            SettingsCollapsibleCard(
                title = "9. حول تطبيق المؤذن",
                icon = Icons.Default.Info,
                isExpanded = expandedSection == 9,
                onToggle = { toggleSection(9) }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(text = "تطبيق المؤذن - الإصدار 2.2.0 Native", color = GoldAccent, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(text = "تطبيق إسلامي شامل صدقة جارية خالصة لوجه الله تعالى.", color = TextSecondary, fontSize = 12.sp)
                }
            }
        }

        // Section 10: Storage
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
private fun PermissionStatusLine(
    label: String,
    granted: Boolean,
    falseText: String = "مطلوب التفعيل",
    falseColor: Color = ErrorRed
) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = TextPrimary, fontSize = 12.sp)
        Text(
            if (granted) "مفعّل ✓" else falseText,
            color = if (granted) SuccessGreen else falseColor,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
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
                    HorizontalDivider(color = CardBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(14.dp))
                    content()
                }
            }
        }
    }
}
