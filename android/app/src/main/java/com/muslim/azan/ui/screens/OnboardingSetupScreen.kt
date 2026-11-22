package com.muslim.azan.ui.screens

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.muslim.azan.AzkarAudioService
import com.muslim.azan.BootReceiver
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.PermissionMonitorNotifier
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.model.CityLocation
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Native Android First-Time Setup Wizard (3 steps):
 * 1. Select city (GPS Auto-detect + Offline Global Database search).
 * 2. Grant critical Azan background permissions (POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM,
 *    IGNORE_BATTERY_OPTIMIZATIONS, SYSTEM_ALERT_WINDOW, USE_FULL_SCREEN_INTENT).
 * 3. Select Azan muezzin voice + live Azan audio test, then persist and schedule exact alarms.
 */
@Composable
fun OnboardingSetupScreen(
    prefs: NativePreferences,
    onCompleted: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()

    var step by remember { mutableIntStateOf(0) }
    var permissionTick by remember { mutableIntStateOf(0) }

    var selectedCityName by remember { mutableStateOf(prefs.cityName) }
    var selectedTimezoneId by remember { mutableStateOf(prefs.cityTimezoneId) }
    var searchQuery by remember { mutableStateOf("") }
    var allCities by remember { mutableStateOf(NativeDataManager.defaultCities) }
    var isDetectingGps by remember { mutableStateOf(false) }
    var gpsFeedback by remember { mutableStateOf<String?>(null) }

    var azanSoundEnabled by remember { mutableStateOf(prefs.azanSoundEnabled) }
    var preAlertEnabled by remember { mutableStateOf(prefs.prePrayerAlertEnabled) }
    var selectedAzanVoice by remember { mutableStateOf(prefs.azanVoice) }
    var isAudioPlaying by remember { mutableStateOf(AzkarAudioService.isPlayingNow) }
    var audioError by remember { mutableStateOf(AzkarAudioService.lastAudioError) }

    LaunchedEffect(Unit) {
        allCities = withContext(Dispatchers.IO) {
            NativeDataManager.getAllCitiesIncludingCached(context, prefs)
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                permissionTick++
                isAudioPlaying = AzkarAudioService.isPlayingNow
                audioError = AzkarAudioService.lastAudioError
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    DisposableEffect(context) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                if (intent?.action == AzkarAudioService.ACTION_AUDIO_STATE_CHANGED) {
                    isAudioPlaying = intent.getBooleanExtra("playing", false)
                    audioError = intent.getStringExtra("error")
                }
            }
        }
        ContextCompat.registerReceiver(
            context,
            receiver,
            IntentFilter(AzkarAudioService.ACTION_AUDIO_STATE_CHANGED),
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
        onDispose { runCatching { context.unregisterReceiver(receiver) } }
    }

    val permStatus = remember(permissionTick) {
        SystemPermissionHelper.checkPermissions(context)
    }

    fun triggerGpsLookup() {
        if (!SystemPermissionHelper.isDeviceLocationEnabled(context)) {
            gpsFeedback = "يرجى تفعيل خدمة الموقع (GPS) في الهاتف أولًا"
            SystemPermissionHelper.openLocationSourceSettings(context)
            return
        }
        isDetectingGps = true
        gpsFeedback = null
        coroutineScope.launch {
            val result = SystemPermissionHelper.detectAndSaveGpsLocation(context, prefs, autoSave = true)
            isDetectingGps = false
            result.onSuccess { gps ->
                selectedCityName = gps.cityName
                selectedTimezoneId = gps.timezoneId
                gpsFeedback = "تم تحديد موقعك: ${gps.cityName}"
                launch(Dispatchers.IO) {
                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                }
            }.onFailure { err ->
                gpsFeedback = err.message ?: "تعذر التقاط GPS حاليًا، اختر مدينتك من القائمة"
            }
        }
    }

    val locationLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        permissionTick++
        val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            triggerGpsLookup()
        } else {
            gpsFeedback = "تم رفض صلاحية الموقع؛ يمكنك اختيار مدينتك من البحث أدناه"
        }
        PermissionMonitorNotifier.evaluateAndSyncNotifications(context.applicationContext, prefs.language)
    }

    val notifLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { _ ->
        permissionTick++
        PermissionMonitorNotifier.evaluateAndSyncNotifications(context.applicationContext, prefs.language)
    }

    BackHandler(enabled = step > 0) {
        step--
    }

    val filteredCities = remember(searchQuery, allCities) {
        val q = searchQuery.trim()
        if (q.isEmpty()) {
            NativeDataManager.defaultCities.take(12)
        } else {
            val normQ = NativeDataManager.normalizeArabic(q)
            allCities.filter {
                NativeDataManager.normalizeArabic(it.nameAr).contains(normQ) ||
                    it.nameEn.contains(q, ignoreCase = true) ||
                    NativeDataManager.normalizeArabic(it.country).contains(normQ) ||
                    it.countryEn.contains(q, ignoreCase = true)
            }.take(24)
        }
    }

    val azanVoices = remember {
        listOf(
            "makkah" to "أذان الحرم المكي",
            "madinah" to "أذان المسجد النبوي",
            "cairo" to "الأذان المصري الخاشع",
            "alaqsa" to "أذان المسجد الأقصى",
            "abdulbasit" to "الشيخ عبد الباسط عبد الصمد",
            "alafasy" to "الشيخ مشاري العفاسي"
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MuslimPlusCanvasBrush)
            .safeDrawingPadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header
            MoazenWidgetCard(
                cornerRadius = 22.dp,
                borderColor = MoazenGold,
                borderWidth = 1.4.dp,
                elevation = 5.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(MoazenInkEmerald.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Mosque,
                            contentDescription = null,
                            tint = MoazenInkEmerald,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                    Text(
                        text = "مرحبًا بك في مسلم بلس",
                        color = MoazenInkEmerald,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "إعداد سريع لأول مرة لضمان دقة مواقيت الصلاة وتشغيل الأذان بالصوت في موعده",
                        color = MoazenInkMuted,
                        fontSize = 12.5.sp,
                        lineHeight = 18.sp,
                        textAlign = TextAlign.Center
                    )

                    // Step indicator bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("1. المدينة", "2. أذونات الأذان", "3. الصوت والبدء").forEachIndexed { idx, label ->
                            val isActive = idx == step
                            val isDone = idx < step
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        when {
                                            isActive -> MoazenInkEmerald
                                            isDone -> MoazenInkEmerald.copy(alpha = 0.2f)
                                            else -> MoazenSubCardBg
                                        }
                                    )
                                    .border(
                                        1.dp,
                                        if (isActive || isDone) MoazenInkEmerald else MoazenCardBorder,
                                        RoundedCornerShape(10.dp)
                                    )
                                    .clickable { step = idx }
                                    .padding(vertical = 7.dp, horizontal = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    color = if (isActive) Color.White else MoazenInkEmerald,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }

            // Step Content
            when (step) {
                0 -> {
                    MoazenWidgetCard(
                        cornerRadius = 20.dp,
                        borderColor = MoazenCardBorder,
                        borderWidth = 1.dp,
                        elevation = 4.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = "اختر مدينتك الحالية",
                                color = MoazenInkEmerald,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "المدينة المختارة حاليًا: $selectedCityName ($selectedTimezoneId)",
                                color = MoazenInkPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )

                            Button(
                                onClick = {
                                    if (permStatus.locationGranted) {
                                        triggerGpsLookup()
                                    } else {
                                        locationLauncher.launch(
                                            arrayOf(
                                                Manifest.permission.ACCESS_FINE_LOCATION,
                                                Manifest.permission.ACCESS_COARSE_LOCATION
                                            )
                                        )
                                    }
                                },
                                enabled = !isDetectingGps,
                                colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(46.dp)
                            ) {
                                if (isDetectingGps) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        strokeWidth = 2.dp,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("جاري تحديد موقعك...", color = Color.White, fontWeight = FontWeight.Bold)
                                } else {
                                    Icon(Icons.Default.MyLocation, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("تحديد موقعي تلقائيًا (GPS)", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }

                            if (!gpsFeedback.isNullOrBlank()) {
                                Text(
                                    text = gpsFeedback ?: "",
                                    color = MoazenInkEmerald,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                label = { Text("ابحث عن مدينتك أو بلدك") },
                                leadingIcon = {
                                    Icon(Icons.Default.Search, contentDescription = null, tint = MoazenInkEmerald)
                                },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )

                            // Quick city chips
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                listOf("makkah", "cairo", "riyadh", "dubai", "amman", "jerusalem", "kuwait").forEach { quickId ->
                                    val city = NativeDataManager.defaultCities.find { it.id == quickId } ?: return@forEach
                                    val isCurrent = selectedCityName == city.nameAr
                                    FilterChip(
                                        selected = isCurrent,
                                        onClick = {
                                            prefs.setCity(city)
                                            selectedCityName = city.nameAr
                                            selectedTimezoneId = city.timezoneId
                                            gpsFeedback = "تم اختيار ${city.nameAr}"
                                        },
                                        label = { Text(city.nameAr, fontSize = 12.sp) }
                                    )
                                }
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                filteredCities.forEach { city: CityLocation ->
                                    val isSelected = selectedCityName == city.nameAr
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(if (isSelected) MoazenInkEmerald.copy(alpha = 0.12f) else MoazenSubCardBg)
                                            .border(
                                                1.dp,
                                                if (isSelected) MoazenInkEmerald else MoazenCardBorder,
                                                RoundedCornerShape(12.dp)
                                            )
                                            .clickable {
                                                prefs.setCity(city)
                                                selectedCityName = city.nameAr
                                                selectedTimezoneId = city.timezoneId
                                                gpsFeedback = "تم اعتماد ${city.nameAr}"
                                            }
                                            .padding(horizontal = 12.dp, vertical = 10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = city.nameAr,
                                                color = MoazenInkPrimary,
                                                fontSize = 13.5.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(
                                                text = "${city.country} • ${city.timezoneId}",
                                                color = MoazenInkMuted,
                                                fontSize = 11.sp
                                            )
                                        }
                                        if (isSelected) {
                                            Icon(
                                                Icons.Default.CheckCircle,
                                                contentDescription = null,
                                                tint = MoazenInkEmerald,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                1 -> {
                    MoazenWidgetCard(
                        cornerRadius = 20.dp,
                        borderColor = MoazenCardBorder,
                        borderWidth = 1.dp,
                        elevation = 4.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = "أذونات تشغيل الأذان في موعده",
                                color = MoazenInkEmerald,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "على إصدارات Android الحديثة (13-16)، تمنع المنظومة تشغيل صوت الأذان في الخلفية أو تؤخره ما لم يتم تفعيل الإشعارات والمنبهات الدقيقة واستثناء البطارية.",
                                color = MoazenInkMuted,
                                fontSize = 12.sp,
                                lineHeight = 18.sp
                            )

                            OnboardingPermissionRow(
                                icon = Icons.Default.Notifications,
                                title = "إذن الإشعارات",
                                subtitle = "مطلوب لعرض تنبيه الأذان والتحكم بإيقافه",
                                granted = permStatus.notificationsGranted,
                                requiredBadge = "أساسي",
                                onGrantClick = {
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                        notifLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                    } else {
                                        SystemPermissionHelper.openNotificationSettings(context)
                                    }
                                }
                            )

                            OnboardingPermissionRow(
                                icon = Icons.Default.AccessTime,
                                title = "إذن المنبهات الدقيقة (Exact Alarm)",
                                subtitle = "ضروري ليؤذن التطبيق في الثانية المحددة ويُشغّل صوت الأذان بالخلفية بدل الاكتفاء بإشعار صامت",
                                granted = permStatus.exactAlarmsGranted,
                                requiredBadge = "ضروري للأذان",
                                onGrantClick = { SystemPermissionHelper.openExactAlarmSettings(context) }
                            )

                            OnboardingPermissionRow(
                                icon = Icons.Default.BatteryStd,
                                title = "استثناء توفير البطارية",
                                subtitle = "يمنع إغلاق منبه الأذان أثناء قفل الشاشة",
                                granted = permStatus.batteryUnrestricted,
                                requiredBadge = "ضروري للخلفية",
                                onGrantClick = { SystemPermissionHelper.openBatteryOptimizationSettings(context) }
                            )

                            OnboardingPermissionRow(
                                icon = Icons.Default.Layers,
                                title = "الظهور فوق التطبيقات",
                                subtitle = "لعرض فقاعة الأذان العائمة وزر الإيقاف السريع",
                                granted = permStatus.overlayGranted,
                                requiredBadge = "مُوصى به",
                                onGrantClick = { SystemPermissionHelper.openOverlaySettings(context) }
                            )

                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                                OnboardingPermissionRow(
                                    icon = Icons.Default.NotificationsActive,
                                    title = "إشعار ملء الشاشة عند القفل",
                                    subtitle = "يُظهر شاشة الأذان ويساعد على تشغيل الصوت عند قفل الهاتف",
                                    granted = permStatus.fullScreenIntentGranted,
                                    requiredBadge = "مُوصى به",
                                    onGrantClick = { SystemPermissionHelper.openFullScreenIntentSettings(context) }
                                )
                            }
                        }
                    }
                }

                else -> {
                    MoazenWidgetCard(
                        cornerRadius = 20.dp,
                        borderColor = MoazenCardBorder,
                        borderWidth = 1.dp,
                        elevation = 4.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = "صوت الأذان وتجربة التشغيل",
                                color = MoazenInkEmerald,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MoazenSubCardBg)
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "تفعيل صوت الأذان الكامل للصلوات",
                                    color = MoazenInkPrimary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Switch(
                                    checked = azanSoundEnabled,
                                    onCheckedChange = {
                                        azanSoundEnabled = it
                                        prefs.azanSoundEnabled = it
                                    }
                                )
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MoazenSubCardBg)
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "التذكير قبل الصلاة بـ 15 دقيقة",
                                    color = MoazenInkPrimary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Switch(
                                    checked = preAlertEnabled,
                                    onCheckedChange = {
                                        preAlertEnabled = it
                                        prefs.prePrayerAlertEnabled = it
                                    }
                                )
                            }

                            Text(
                                text = "اختر صوت المؤذن الافتراضي:",
                                color = MoazenInkPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )

                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                azanVoices.forEach { (voiceId, voiceTitle) ->
                                    val chosen = selectedAzanVoice == voiceId
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(if (chosen) MoazenInkEmerald.copy(alpha = 0.12f) else MoazenSubCardBg)
                                            .border(
                                                1.dp,
                                                if (chosen) MoazenInkEmerald else MoazenCardBorder,
                                                RoundedCornerShape(12.dp)
                                            )
                                            .clickable {
                                                selectedAzanVoice = voiceId
                                                prefs.azanVoice = voiceId
                                            }
                                            .padding(horizontal = 12.dp, vertical = 10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = voiceTitle,
                                            color = MoazenInkPrimary,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        if (chosen) {
                                            Icon(
                                                Icons.Default.CheckCircle,
                                                contentDescription = null,
                                                tint = MoazenInkEmerald,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            Button(
                                onClick = {
                                    if (isAudioPlaying) {
                                        val stopIntent = Intent(context, AzkarAudioService::class.java).apply {
                                            action = AzkarAudioService.ACTION_STOP_AUDIO
                                        }
                                        context.startService(stopIntent)
                                    } else {
                                        val testIntent = Intent(context, AzkarAudioService::class.java).apply {
                                            putExtra("section", "prayer_azan")
                                            putExtra("prayerName", "اختبار الإعداد الأولي")
                                            putExtra("title", "تجربة صوت الأذان")
                                            putExtra("cityName", selectedCityName)
                                            putExtra("audioTrackId", selectedAzanVoice)
                                            putExtra("volumePercent", 100)
                                            putExtra("autoPlay", true)
                                            putExtra("isTestAlarm", true)
                                        }
                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                            context.startForegroundService(testIntent)
                                        } else {
                                            context.startService(testIntent)
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isAudioPlaying) ErrorRed else MoazenGoldDark
                                ),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(46.dp)
                            ) {
                                Icon(
                                    imageVector = if (isAudioPlaying) Icons.Default.Stop else Icons.Default.VolumeUp,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (isAudioPlaying) "إيقاف تجربة الأذان" else "تجربة صوت الأذان الآن",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            if (!audioError.isNullOrBlank()) {
                                Text(
                                    text = audioError ?: "",
                                    color = ErrorRed,
                                    fontSize = 11.5.sp
                                )
                            }
                        }
                    }
                }
            }

            // Bottom Navigation Controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (step > 0) {
                    OutlinedButton(
                        onClick = { step-- },
                        border = BorderStroke(1.dp, MoazenCardBorder),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                    ) {
                        Text("السابق", color = MoazenInkEmerald, fontWeight = FontWeight.Bold)
                    }
                } else {
                    TextButton(
                        onClick = {
                            prefs.onboardingCompleted = true
                            onCompleted()
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                    ) {
                        Text("تخطي الآن", color = MoazenInkMuted, fontWeight = FontWeight.SemiBold)
                    }
                }

                Button(
                    onClick = {
                        if (step < 2) {
                            step++
                        } else {
                            if (isAudioPlaying) {
                                val stopIntent = Intent(context, AzkarAudioService::class.java).apply {
                                    action = AzkarAudioService.ACTION_STOP_AUDIO
                                }
                                runCatching { context.startService(stopIntent) }
                            }
                            prefs.onboardingCompleted = true
                            Toast.makeText(
                                context,
                                "تم حفظ الإعدادات وجدولة الأذان لمدينة $selectedCityName",
                                Toast.LENGTH_SHORT
                            ).show()
                            onCompleted()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .weight(1.6f)
                        .height(48.dp)
                ) {
                    Text(
                        text = if (step < 2) "التالي" else "إنهاء الإعداد وجدولة الصلوات",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun OnboardingPermissionRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    granted: Boolean,
    requiredBadge: String,
    onGrantClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(if (granted) SuccessGreen.copy(alpha = 0.08f) else MoazenSubCardBg)
            .border(
                1.dp,
                if (granted) SuccessGreen.copy(alpha = 0.45f) else MoazenCardBorder,
                RoundedCornerShape(14.dp)
            )
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(if (granted) SuccessGreen.copy(alpha = 0.16f) else MoazenInkEmerald.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (granted) Icons.Default.CheckCircle else icon,
                contentDescription = null,
                tint = if (granted) SuccessGreen else MoazenInkEmerald,
                modifier = Modifier.size(20.dp)
            )
        }

        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = title,
                    color = MoazenInkPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = requiredBadge,
                    color = if (granted) SuccessGreen else MoazenGoldDark,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(
                text = subtitle,
                color = MoazenInkMuted,
                fontSize = 11.sp,
                lineHeight = 15.sp
            )
        }

        if (granted) {
            Text(
                text = "مُفعّل",
                color = SuccessGreen,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        } else {
            Button(
                onClick = onGrantClick,
                colors = ButtonDefaults.buttonColors(containerColor = MoazenGoldDark),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.height(34.dp)
            ) {
                Text("تفعيل", color = Color.White, fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
