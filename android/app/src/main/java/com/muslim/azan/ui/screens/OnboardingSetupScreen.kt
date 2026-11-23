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
 * Native Android First-Time Setup Wizard (4 steps — Rafeeq Al-Muslim):
 * 1. Select city (GPS Auto-detect + Offline Global Database) + Explicit Astronomical Calculation Method.
 * 2. Grant critical Azan background permissions (POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM,
 *    IGNORE_BATTERY_OPTIMIZATIONS, SYSTEM_ALERT_WINDOW, USE_FULL_SCREEN_INTENT).
 * 3. Dedicated 7-Section Independent App Sounds Configurator (Mute/Enable, Voice/Track, Volume %, Play/Stop Preview).
 * 4. Quick Test & Launch, then persist & schedule exact alarms.
 */
@Composable
fun OnboardingSetupScreen(
    prefs: NativePreferences,
    onCompleted: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()
    val isEnglish = prefs.language == "en"

    var step by remember { mutableIntStateOf(0) }
    var permissionTick by remember { mutableIntStateOf(0) }

    // Step 1: Location & Calculation Method
    var selectedCityName by remember { mutableStateOf(prefs.cityName) }
    var selectedTimezoneId by remember { mutableStateOf(prefs.cityTimezoneId) }
    var selectedCalcMethod by remember { mutableStateOf(prefs.calculationMethod) }
    var calcMethodManuallyLocked by remember { mutableStateOf(prefs.calculationMethodManuallySet) }
    var searchQuery by remember { mutableStateOf("") }
    var allCities by remember { mutableStateOf(NativeDataManager.defaultCities) }
    var isDetectingGps by remember { mutableStateOf(false) }
    var gpsFeedback by remember { mutableStateOf<String?>(null) }

    // Step 3: 7 Independent Sound Sections State (backed directly by NativePreferences)
    var fajrSoundEnabled by remember { mutableStateOf(prefs.fajrSoundEnabled) }
    var selectedFajrVoice by remember { mutableStateOf(prefs.fajrVoice) }
    var fajrVolumePercent by remember { mutableIntStateOf(prefs.fajrVolumePercent) }

    var azanSoundEnabled by remember { mutableStateOf(prefs.azanSoundEnabled) }
    var selectedAzanVoice by remember { mutableStateOf(prefs.azanVoice) }
    var regularAzanVolumePercent by remember { mutableIntStateOf(prefs.regularAzanVolumePercent) }

    var preAlertEnabled by remember { mutableStateOf(prefs.prePrayerAlertEnabled) }
    var selectedPrePrayerVoice by remember { mutableStateOf(prefs.prePrayerVoice) }
    var prePrayerMinutes by remember { mutableIntStateOf(prefs.prePrayerMinutes) }
    var prePrayerVolumePercent by remember { mutableIntStateOf(prefs.prePrayerVolumePercent) }

    var azkarSoundEnabled by remember { mutableStateOf(prefs.azkarSoundEnabled) }
    var selectedAzkarVoice by remember { mutableStateOf(prefs.morningAzkarAudio) }
    var azkarVolumePercent by remember { mutableIntStateOf(prefs.azkarVolumePercent) }

    var tasbihSoundEnabled by remember { mutableStateOf(prefs.tasbihClickSoundEnabled) }
    var selectedDuaVoice by remember { mutableStateOf(prefs.duaAudioVoice) }
    var tasbihDuaVolumePercent by remember { mutableIntStateOf(prefs.tasbihDuaVolumePercent) }

    var quranAudioEnabled by remember { mutableStateOf(prefs.quranAudioEnabled) }
    var quranVolumePercent by remember { mutableIntStateOf(prefs.quranVolumePercent) }

    var iqamaEnabled by remember { mutableStateOf(prefs.iqamaEnabled) }
    var selectedIqamaVoice by remember { mutableStateOf(prefs.iqamaVoice) }
    var otherAlertsVolumePercent by remember { mutableIntStateOf(prefs.otherAlertsVolumePercent) }

    var isAudioPlaying by remember { mutableStateOf(AzkarAudioService.isPlayingNow) }
    var activePreviewSectionKey by remember { mutableStateOf<String?>(null) }
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
                if (!isAudioPlaying) activePreviewSectionKey = null
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
                    if (!isAudioPlaying) activePreviewSectionKey = null
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

    fun triggerPreview(sectionKey: String, serviceSection: String, trackId: String, label: String, vol: Int) {
        if (isAudioPlaying && activePreviewSectionKey == sectionKey) {
            val stopIntent = Intent(context, AzkarAudioService::class.java).apply {
                action = AzkarAudioService.ACTION_STOP_AUDIO
            }
            runCatching { context.startService(stopIntent) }
            activePreviewSectionKey = null
            isAudioPlaying = false
            return
        }
        activePreviewSectionKey = sectionKey
        val testIntent = Intent(context, AzkarAudioService::class.java).apply {
            putExtra("section", serviceSection)
            putExtra("prayerName", label)
            putExtra("title", label)
            putExtra("cityName", selectedCityName)
            putExtra("audioTrackId", trackId)
            putExtra("volumePercent", vol.coerceIn(10, 100))
            putExtra("autoPlay", true)
            putExtra("isTestAlarm", true)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(testIntent)
        } else {
            context.startService(testIntent)
        }
    }

    fun triggerGpsLookup() {
        if (!SystemPermissionHelper.isDeviceLocationEnabled(context)) {
            gpsFeedback = if (isEnglish) "Please enable device GPS first" else "يرجى تفعيل خدمة الموقع (GPS) في الهاتف أولًا"
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
                if (!calcMethodManuallyLocked && gps.calcMethod.isNotBlank()) {
                    prefs.suggestCalculationMethodIfNotManual(gps.calcMethod)
                    selectedCalcMethod = prefs.calculationMethod
                }
                gpsFeedback = if (isEnglish) "Detected: ${gps.cityName}" else "تم تحديد موقعك: ${gps.cityName}"
                launch(Dispatchers.IO) {
                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                }
            }.onFailure { err ->
                gpsFeedback = err.message ?: if (isEnglish) "GPS unavailable; choose a city below" else "تعذر التقاط GPS حاليًا، اختر مدينتك من القائمة"
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
            gpsFeedback = if (isEnglish) "Location permission denied; search manually below" else "تم رفض صلاحية الموقع؛ يمكنك اختيار مدينتك من البحث أدناه"
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
            NativeDataManager.defaultCities.take(10)
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

    val calcMethodsList = remember(isEnglish) {
        listOf(
            "egypt" to if (isEnglish) "Egyptian General Authority (19.5° / 17.5°)" else "الهيئة العامة المصرية للمساحة (19.5° / 17.5°)",
            "umm_al_qura" to if (isEnglish) "Umm Al-Qura — Makkah (18.5° / 90m)" else "جامعة أم القرى — مكة (18.5° / 90د)",
            "mwl" to if (isEnglish) "Muslim World League (18° / 17°)" else "رابطة العالم الإسلامي (18° / 17°)",
            "dubai" to if (isEnglish) "Dubai & Gulf Authorities (18.2° / 18.2°)" else "الشؤون الإسلامية بدبي والخليج (18.2°)",
            "uoif" to if (isEnglish) "UOIF France (12° / 12°)" else "اتحاد المنظمات الإسلامية بفرنسا — UOIF (12°)",
            "karachi" to if (isEnglish) "Univ. Islamic Sciences, Karachi (18° / 18°)" else "جامعة العلوم الإسلامية بكراتشي (18°)",
            "isna" to if (isEnglish) "ISNA North America (15° / 15°)" else "الجمعية الإسلامية لأمريكا الشمالية (15°)",
            "kuwait" to if (isEnglish) "Kuwait Ministry of Awqaf (18° / 17.5°)" else "وزارة الأوقاف بالكويت (18° / 17.5°)",
            "qatar" to if (isEnglish) "Qatar Ministry of Awqaf (18° / 90m)" else "وزارة الأوقاف بقطر (18° / 90د)",
            "diyanet" to if (isEnglish) "Diyanet Turkey (18° / 17°)" else "رئاسة الشؤون الدينية التركية — Diyanet"
        )
    }

    val stepLabels = remember(isEnglish) {
        if (isEnglish) listOf("1. City & Calc", "2. Permissions", "3. 7 Sounds", "4. Launch")
        else listOf("1. المدينة والحساب", "2. الأذونات", "3. الأصوات الـ7", "4. البدء")
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
            // Creamy 3D Gold Header
            MoazenWidgetCard(
                cornerRadius = 22.dp,
                borderColor = MoazenGold,
                borderWidth = 1.6.dp,
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
                        text = if (isEnglish) "Welcome to Rafeeq Al-Muslim" else "مرحبًا بك في رفيق المسلم",
                        color = MoazenInkEmerald,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = if (isEnglish)
                            "Quick one-time setup for accurate prayer times, country calculation method & custom sounds"
                        else
                            "إعداد سريع لأول مرة لضبط مدينتك وطريقة الحساب الفلكي والأصوات الـ 7 المستقلة",
                        color = MoazenInkMuted,
                        fontSize = 12.sp,
                        lineHeight = 18.sp,
                        textAlign = TextAlign.Center
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        stepLabels.forEachIndexed { idx, label ->
                            val isActive = idx == step
                            val isDone = idx < step
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .heightIn(min = 38.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        when {
                                            isActive -> MoazenInkEmerald
                                            isDone -> MoazenInkEmerald.copy(alpha = 0.18f)
                                            else -> MoazenSubCardBg
                                        }
                                    )
                                    .border(
                                        1.dp,
                                        if (isActive) MoazenGold else if (isDone) MoazenInkEmerald else MoazenCardBorder,
                                        RoundedCornerShape(10.dp)
                                    )
                                    .clickable { step = idx }
                                    .padding(vertical = 6.dp, horizontal = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    color = if (isActive) Color.White else MoazenInkEmerald,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }

            // Step Body
            when (step) {
                0 -> {
                    MoazenWidgetCard(
                        cornerRadius = 20.dp,
                        borderColor = MoazenCardBorder,
                        borderWidth = 1.2.dp,
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
                                text = if (isEnglish) "Select City & Calculation Authority" else "اختر مدينتك وطريقة الحساب",
                                color = MoazenInkEmerald,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (isEnglish) "Current: $selectedCityName ($selectedTimezoneId)" else "المدينة المختارة حاليًا: $selectedCityName ($selectedTimezoneId)",
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
                                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(if (isEnglish) "Detecting GPS..." else "جاري تحديد موقعك...", color = Color.White, fontWeight = FontWeight.Bold)
                                } else {
                                    Icon(Icons.Default.MyLocation, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(if (isEnglish) "Detect Automatically (GPS)" else "تحديد موقعي تلقائيًا (GPS)", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }

                            if (!gpsFeedback.isNullOrBlank()) {
                                Text(text = gpsFeedback ?: "", color = MoazenInkEmerald, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }

                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                label = { Text(if (isEnglish) "Search city or country" else "ابحث عن مدينتك أو بلدك") },
                                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MoazenInkEmerald) },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )

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
                                            if (!calcMethodManuallyLocked && city.recommendedCalcMethod.isNotBlank()) {
                                                prefs.suggestCalculationMethodIfNotManual(city.recommendedCalcMethod)
                                                selectedCalcMethod = prefs.calculationMethod
                                            }
                                            selectedCityName = city.nameAr
                                            selectedTimezoneId = city.timezoneId
                                            gpsFeedback = if (isEnglish) "Selected ${city.nameEn}" else "تم اختيار ${city.nameAr}"
                                        },
                                        label = { Text(if (isEnglish) city.nameEn.ifBlank { city.nameAr } else city.nameAr, fontSize = 12.sp) }
                                    )
                                }
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                filteredCities.take(8).forEach { city: CityLocation ->
                                    val isSelected = selectedCityName == city.nameAr
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(if (isSelected) MoazenInkEmerald.copy(alpha = 0.12f) else MoazenSubCardBg)
                                            .border(1.dp, if (isSelected) MoazenInkEmerald else MoazenCardBorder, RoundedCornerShape(12.dp))
                                            .clickable {
                                                prefs.setCity(city)
                                                if (!calcMethodManuallyLocked && city.recommendedCalcMethod.isNotBlank()) {
                                                    prefs.suggestCalculationMethodIfNotManual(city.recommendedCalcMethod)
                                                    selectedCalcMethod = prefs.calculationMethod
                                                }
                                                selectedCityName = city.nameAr
                                                selectedTimezoneId = city.timezoneId
                                                gpsFeedback = if (isEnglish) "Selected ${city.nameEn}" else "تم اعتماد ${city.nameAr}"
                                            }
                                            .padding(horizontal = 12.dp, vertical = 10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(text = if (isEnglish) city.nameEn.ifBlank { city.nameAr } else city.nameAr, color = MoazenInkPrimary, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
                                            Text(text = "${city.country} • ${city.timezoneId}", color = MoazenInkMuted, fontSize = 11.sp)
                                        }
                                        if (isSelected) {
                                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(20.dp))
                                        }
                                    }
                                }
                            }

                            HorizontalDivider(color = MoazenCardBorder, thickness = 1.dp)

                            // Explicit Calculation Method Selector (Locked upon user choice)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (isEnglish) "Prayer Calculation Method" else "طريقة الحساب الفلكي لبلدك",
                                    color = MoazenInkEmerald,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (calcMethodManuallyLocked) MoazenInkEmerald.copy(alpha = 0.12f) else MoazenGold.copy(alpha = 0.16f)
                                ) {
                                    Text(
                                        text = if (calcMethodManuallyLocked) {
                                            if (isEnglish) "Locked" else "مثبّت يدويًا"
                                        } else {
                                            if (isEnglish) "Suggested" else "مقترح"
                                        },
                                        color = if (calcMethodManuallyLocked) MoazenInkEmerald else MoazenGoldDark,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                calcMethodsList.forEach { (methodKey, methodLabel) ->
                                    val chosen = selectedCalcMethod == methodKey
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(if (chosen) MoazenInkEmerald.copy(alpha = 0.13f) else MoazenSubCardBg)
                                            .border(
                                                width = if (chosen) 1.4.dp else 1.dp,
                                                color = if (chosen) MoazenGoldDark else MoazenCardBorder,
                                                shape = RoundedCornerShape(10.dp)
                                            )
                                            .clickable {
                                                selectedCalcMethod = methodKey
                                                calcMethodManuallyLocked = true
                                                prefs.setCalculationMethodManually(methodKey)
                                            }
                                            .padding(horizontal = 10.dp, vertical = 9.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = methodLabel,
                                            color = MoazenInkPrimary,
                                            fontSize = 12.sp,
                                            fontWeight = if (chosen) FontWeight.Bold else FontWeight.Medium,
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (chosen) {
                                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(18.dp))
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
                        borderWidth = 1.2.dp,
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
                                text = if (isEnglish) "Essential Azan & Alarm Permissions" else "أذونات تشغيل الأذان في موعده",
                                color = MoazenInkEmerald,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (isEnglish)
                                    "On Android 13–16, enabling Notifications, Exact Alarms & Battery exemption guarantees timely background Azan audio."
                                else
                                    "على إصدارات Android الحديثة (13-16)، تضمن هذه الأذونات تشغيل صوت الأذان بالثانية في الخلفية وعلى شاشة القفل.",
                                color = MoazenInkMuted,
                                fontSize = 12.sp,
                                lineHeight = 18.sp
                            )

                            OnboardingPermissionRow(
                                icon = Icons.Default.Notifications,
                                title = if (isEnglish) "Notifications" else "إذن الإشعارات",
                                subtitle = if (isEnglish) "Shows prayer alert & quick stop controls" else "مطلوب لعرض تنبيه الأذان والتحكم بإيقافه",
                                granted = permStatus.notificationsGranted,
                                requiredBadge = if (isEnglish) "Core" else "أساسي",
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
                                title = if (isEnglish) "Exact Alarms" else "إذن المنبهات الدقيقة (Exact Alarm)",
                                subtitle = if (isEnglish) "Triggers Azan at the exact astronomical second" else "ضروري ليؤذن التطبيق في الثانية المحددة ويُشغّل صوت الأذان بالخلفية",
                                granted = permStatus.exactAlarmsGranted,
                                requiredBadge = if (isEnglish) "Required" else "ضروري للأذان",
                                onGrantClick = { SystemPermissionHelper.openExactAlarmSettings(context) }
                            )

                            OnboardingPermissionRow(
                                icon = Icons.Default.BatteryStd,
                                title = if (isEnglish) "Battery Optimization Exemption" else "استثناء توفير البطارية",
                                subtitle = if (isEnglish) "Prevents OS sleep from silencing background Azan" else "يمنع إغلاق منبه الأذان أثناء قفل الشاشة",
                                granted = permStatus.batteryUnrestricted,
                                requiredBadge = if (isEnglish) "Background" else "ضروري للخلفية",
                                onGrantClick = { SystemPermissionHelper.openBatteryOptimizationSettings(context) }
                            )

                            OnboardingPermissionRow(
                                icon = Icons.Default.Layers,
                                title = if (isEnglish) "Display Over Other Apps" else "الظهور فوق التطبيقات",
                                subtitle = if (isEnglish) "Shows floating Azan & Iqama quick card" else "لعرض فقاعة الأذان العائمة وزر الإيقاف السريع",
                                granted = permStatus.overlayGranted,
                                requiredBadge = if (isEnglish) "Recommended" else "مُوصى به",
                                onGrantClick = { SystemPermissionHelper.openOverlaySettings(context) }
                            )

                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                                OnboardingPermissionRow(
                                    icon = Icons.Default.NotificationsActive,
                                    title = if (isEnglish) "Lock Screen Full Intent" else "إشعار ملء الشاشة عند القفل",
                                    subtitle = if (isEnglish) "Displays Azan controls above lock screen" else "يُظهر شاشة الأذان ويساعد على تشغيل الصوت عند قفل الهاتف",
                                    granted = permStatus.fullScreenIntentGranted,
                                    requiredBadge = if (isEnglish) "Recommended" else "مُوصى به",
                                    onGrantClick = { SystemPermissionHelper.openFullScreenIntentSettings(context) }
                                )
                            }
                        }
                    }
                }

                2 -> {
                    // Step 2: Dedicated 7-Section Independent App Sounds Configurator
                    MoazenWidgetCard(
                        cornerRadius = 20.dp,
                        borderColor = MoazenCardBorder,
                        borderWidth = 1.2.dp,
                        elevation = 4.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = if (isEnglish) "Independent App Sounds (7 Sections)" else "تخصيص أصوات التطبيق المستقلة (7 أقسام)",
                                color = MoazenInkEmerald,
                                fontSize = 15.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (isEnglish)
                                    "Customize track, volume (0–100%), mute toggle & live preview independently for each section."
                                else
                                    "اختر المقطع الصوتي ومستوى الصوت (%) أو كتم الصوت مع المعاينة الفورية لكل قسم.",
                                color = MoazenInkMuted,
                                fontSize = 11.5.sp
                            )

                            // 1. Fajr Azan
                            OnboardingSoundSectionCard(
                                title = if (isEnglish) "1. Fajr Azan (Independent)" else "1. أذان الفجر المستقل",
                                subtitle = if (isEnglish) "Dedicated Fajr voice & volume" else "صوت أذان الفجر ومستواه الخاص",
                                enabled = fajrSoundEnabled,
                                onToggleEnabled = {
                                    fajrSoundEnabled = it
                                    prefs.fajrSoundEnabled = it
                                },
                                voices = listOf(
                                    "abdulbasit_fajr" to (if (isEnglish) "Abdulbasit Fajr" else "عبد الباسط (فجر)"),
                                    "madinah" to (if (isEnglish) "Madinah Fajr" else "المسجد النبوي (فجر)"),
                                    "toubar_fajr" to (if (isEnglish) "Nasr El-Din Tobar" else "نصر الدين طوبار")
                                ),
                                selectedVoice = selectedFajrVoice,
                                onSelectVoice = {
                                    selectedFajrVoice = it
                                    prefs.fajrVoice = it
                                },
                                volumePercent = fajrVolumePercent,
                                onVolumeChange = {
                                    fajrVolumePercent = it
                                    prefs.fajrVolumePercent = it
                                },
                                isPreviewingThis = isAudioPlaying && activePreviewSectionKey == "fajrAzan",
                                onPreviewClick = {
                                    triggerPreview("fajrAzan", "prayer_azan", selectedFajrVoice, "أذان الفجر", fajrVolumePercent)
                                }
                            )

                            // 2. Regular Prayers Azan
                            OnboardingSoundSectionCard(
                                title = if (isEnglish) "2. Regular Prayers Azan" else "2. أذان باقي الصلوات (الظهر، العصر، المغرب، العشاء)",
                                subtitle = if (isEnglish) "Main Muezzin voice & volume" else "صوت المؤذن للصلوات الأربع",
                                enabled = azanSoundEnabled,
                                onToggleEnabled = {
                                    azanSoundEnabled = it
                                    prefs.azanSoundEnabled = it
                                },
                                voices = listOf(
                                    "makkah" to (if (isEnglish) "Makkah Haram" else "مكة المكرمة"),
                                    "madinah" to (if (isEnglish) "Madinah Haram" else "المدينة المنورة"),
                                    "cairo" to (if (isEnglish) "Cairo" else "أذان القاهرة"),
                                    "alaqsa" to (if (isEnglish) "Al-Aqsa" else "الأقصى"),
                                    "alafasy" to (if (isEnglish) "Alafasy" else "العفاسي")
                                ),
                                selectedVoice = selectedAzanVoice,
                                onSelectVoice = {
                                    selectedAzanVoice = it
                                    prefs.azanVoice = it
                                },
                                volumePercent = regularAzanVolumePercent,
                                onVolumeChange = {
                                    regularAzanVolumePercent = it
                                    prefs.regularAzanVolumePercent = it
                                },
                                isPreviewingThis = isAudioPlaying && activePreviewSectionKey == "regularAzan",
                                onPreviewClick = {
                                    triggerPreview("regularAzan", "prayer_azan", selectedAzanVoice, "أذان الصلوات", regularAzanVolumePercent)
                                }
                            )

                            // 3. Pre-Prayer Alert
                            OnboardingSoundSectionCard(
                                title = if (isEnglish) "3. Pre-Prayer Reminder" else "3. تنبيه ما قبل الصلاة",
                                subtitle = if (isEnglish) "Played $prePrayerMinutes min before prayer" else "ينبّهك قبل دخول الوقت بـ $prePrayerMinutes دقيقة",
                                enabled = preAlertEnabled,
                                onToggleEnabled = {
                                    preAlertEnabled = it
                                    prefs.prePrayerAlertEnabled = it
                                },
                                voices = listOf(
                                    "pre_prayer_15m" to (if (isEnglish) "Pre-Prayer Tone" else "تنبيه ما قبل الصلاة"),
                                    "salawat_1" to (if (isEnglish) "Salawat Chime" else "الصلاة على النبي ﷺ"),
                                    "asmaa_allah_al_husna" to (if (isEnglish) "Asmaa Allah" else "أسماء الله الحسنى")
                                ),
                                selectedVoice = selectedPrePrayerVoice,
                                onSelectVoice = {
                                    selectedPrePrayerVoice = it
                                    prefs.prePrayerVoice = it
                                },
                                volumePercent = prePrayerVolumePercent,
                                onVolumeChange = {
                                    prePrayerVolumePercent = it
                                    prefs.prePrayerVolumePercent = it
                                },
                                isPreviewingThis = isAudioPlaying && activePreviewSectionKey == "prePrayer",
                                onPreviewClick = {
                                    triggerPreview("prePrayer", "prePrayerAlert", selectedPrePrayerVoice, "تنبيه قبل الصلاة", prePrayerVolumePercent)
                                },
                                extraRow = {
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        listOf(10, 15, 20).forEach { mins ->
                                            FilterChip(
                                                selected = prePrayerMinutes == mins,
                                                onClick = {
                                                    prePrayerMinutes = mins
                                                    prefs.prePrayerMinutes = mins
                                                },
                                                label = { Text("$mins د", fontSize = 11.sp) }
                                            )
                                        }
                                    }
                                }
                            )

                            // 4. Morning & Evening Azkar
                            OnboardingSoundSectionCard(
                                title = if (isEnglish) "4. Morning & Evening Azkar" else "4. أذكار الصباح والمساء",
                                subtitle = if (isEnglish) "Daily Azkar reminder audio" else "أصوات أذكار الصباح والمساء",
                                enabled = azkarSoundEnabled,
                                onToggleEnabled = {
                                    azkarSoundEnabled = it
                                    prefs.azkarSoundEnabled = it
                                    prefs.morningAzkarEnabled = it
                                    prefs.eveningAzkarEnabled = it
                                },
                                voices = listOf(
                                    "azkar_sabah" to (if (isEnglish) "Morning Azkar" else "أذكار الصباح"),
                                    "azkar_massa" to (if (isEnglish) "Evening Azkar" else "أذكار المساء")
                                ),
                                selectedVoice = selectedAzkarVoice,
                                onSelectVoice = { selectedAzkarVoice = it },
                                volumePercent = azkarVolumePercent,
                                onVolumeChange = {
                                    azkarVolumePercent = it
                                    prefs.azkarVolumePercent = it
                                },
                                isPreviewingThis = isAudioPlaying && activePreviewSectionKey == "azkar",
                                onPreviewClick = {
                                    val secName = if (selectedAzkarVoice == "azkar_massa") "eveningAzkar" else "morningAzkar"
                                    triggerPreview("azkar", secName, selectedAzkarVoice, "الأذكار", azkarVolumePercent)
                                }
                            )

                            // 5. Tasbih & Duas Sounds
                            OnboardingSoundSectionCard(
                                title = if (isEnglish) "5. Tasbih & Duas Sounds" else "5. أصوات السبحة والأدعية",
                                subtitle = if (isEnglish) "Tasbih bead sound & Dua playback" else "صوت نقر السبحة وتشغيل الأدعية",
                                enabled = tasbihSoundEnabled,
                                onToggleEnabled = {
                                    tasbihSoundEnabled = it
                                    prefs.tasbihClickSoundEnabled = it
                                    prefs.duaAudioEnabled = it
                                },
                                voices = listOf(
                                    "salawat_1" to (if (isEnglish) "Dhikr Tone 1" else "نغمة ذكر (١)"),
                                    "salawat_2" to (if (isEnglish) "Dhikr Tone 2" else "نغمة ذكر (٢)"),
                                    "asmaa_allah_al_husna" to (if (isEnglish) "Asmaa Allah" else "أسماء الله الحسنى")
                                ),
                                selectedVoice = selectedDuaVoice,
                                onSelectVoice = {
                                    selectedDuaVoice = it
                                    prefs.duaAudioVoice = it
                                },
                                volumePercent = tasbihDuaVolumePercent,
                                onVolumeChange = {
                                    tasbihDuaVolumePercent = it
                                    prefs.tasbihDuaVolumePercent = it
                                },
                                isPreviewingThis = isAudioPlaying && activePreviewSectionKey == "tasbihDua",
                                onPreviewClick = {
                                    triggerPreview("tasbihDua", "salawat", selectedDuaVoice, "السبحة والأدعية", tasbihDuaVolumePercent)
                                }
                            )

                            // 6. Quran & Recitations
                            OnboardingSoundSectionCard(
                                title = if (isEnglish) "6. Holy Quran & Recitations" else "6. القرآن الكريم والتلاوات",
                                subtitle = if (isEnglish) "Recitation audio volume & playback toggle" else "تفعيل ومستوى صوت التلاوات القرآنية",
                                enabled = quranAudioEnabled,
                                onToggleEnabled = {
                                    quranAudioEnabled = it
                                    prefs.quranAudioEnabled = it
                                },
                                voices = listOf(
                                    "qiyam_first_third" to (if (isEnglish) "Surah Al-Muzzammil Preview" else "معاينة تلاوة سورة المزمل")
                                ),
                                selectedVoice = "qiyam_first_third",
                                onSelectVoice = {},
                                volumePercent = quranVolumePercent,
                                onVolumeChange = {
                                    quranVolumePercent = it
                                    prefs.quranVolumePercent = it
                                },
                                isPreviewingThis = isAudioPlaying && activePreviewSectionKey == "quran",
                                onPreviewClick = {
                                    triggerPreview("quran", "morningAzkar", "qiyam_first_third", "تلاوة القرآن", quranVolumePercent)
                                }
                            )

                            // 7. Other Alerts (Iqama & Salawat)
                            OnboardingSoundSectionCard(
                                title = if (isEnglish) "7. Other Alerts (Iqama & Salawat)" else "7. باقي التنبيهات (الإقامة والصلاة على النبي ﷺ)",
                                subtitle = if (isEnglish) "Iqama & periodic Salawat alerts" else "أصوات الإقامة والصلاة على النبي ﷺ",
                                enabled = iqamaEnabled,
                                onToggleEnabled = {
                                    iqamaEnabled = it
                                    prefs.iqamaEnabled = it
                                    prefs.salawatEnabled = it
                                },
                                voices = listOf(
                                    "iqama_1" to (if (isEnglish) "Iqama Voice 1" else "صوت الإقامة (١)"),
                                    "iqama_2" to (if (isEnglish) "Iqama Voice 2" else "صوت الإقامة (٢)"),
                                    "iqama_3" to (if (isEnglish) "Iqama Voice 3" else "صوت الإقامة (٣)"),
                                    "salawat_1" to (if (isEnglish) "Salawat" else "الصلاة على النبي ﷺ")
                                ),
                                selectedVoice = selectedIqamaVoice,
                                onSelectVoice = {
                                    selectedIqamaVoice = it
                                    prefs.iqamaVoice = it
                                },
                                volumePercent = otherAlertsVolumePercent,
                                onVolumeChange = {
                                    otherAlertsVolumePercent = it
                                    prefs.otherAlertsVolumePercent = it
                                },
                                isPreviewingThis = isAudioPlaying && activePreviewSectionKey == "otherAlerts",
                                onPreviewClick = {
                                    triggerPreview("otherAlerts", "iqama", selectedIqamaVoice, "الإقامة والتنبيهات", otherAlertsVolumePercent)
                                }
                            )
                        }
                    }
                }

                else -> {
                    MoazenWidgetCard(
                        cornerRadius = 20.dp,
                        borderColor = MoazenCardBorder,
                        borderWidth = 1.2.dp,
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
                                text = if (isEnglish) "Review & Live Audio Verification" else "مراجعة الإعدادات والتجربة النهائية",
                                color = MoazenInkEmerald,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (isEnglish)
                                    "City: $selectedCityName\nCalculation: $selectedCalcMethod\nFajr Voice: $selectedFajrVoice ($fajrVolumePercent%)\nAzan Voice: $selectedAzanVoice ($regularAzanVolumePercent%)"
                                else
                                    "المدينة: $selectedCityName\nطريقة الحساب: $selectedCalcMethod\nأذان الفجر: $fajrVolumePercent% • باقي الصلوات: $regularAzanVolumePercent%\nما قبل الصلاة: $prePrayerVolumePercent% • الأذكار: $azkarVolumePercent%\nالسبحة والأدعية: $tasbihDuaVolumePercent% • القرآن: $quranVolumePercent% • الإقامة والتنبيهات: $otherAlertsVolumePercent%",
                                color = MoazenInkPrimary,
                                fontSize = 12.5.sp,
                                lineHeight = 19.sp
                            )

                            Button(
                                onClick = {
                                    triggerPreview("finalTest", "prayer_azan", selectedAzanVoice, "تجربة صوت الأذان", regularAzanVolumePercent)
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isAudioPlaying) ErrorRed else MoazenGoldDark
                                ),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Icon(
                                    imageVector = if (isAudioPlaying) Icons.Default.Stop else Icons.Default.VolumeUp,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (isAudioPlaying)
                                        (if (isEnglish) "Stop Test Audio" else "إيقاف تجربة الأذان")
                                    else
                                        (if (isEnglish) "Test Azan Sound Now" else "تجربة صوت الأذان الآن"),
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            if (!audioError.isNullOrBlank()) {
                                Text(text = audioError ?: "", color = ErrorRed, fontSize = 11.5.sp)
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
                        Text(if (isEnglish) "Back" else "السابق", color = MoazenInkEmerald, fontWeight = FontWeight.Bold)
                    }
                } else {
                    TextButton(
                        onClick = {
                            prefs.onboardingCompleted = true
                            coroutineScope.launch(Dispatchers.IO) {
                                BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                            }
                            onCompleted()
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                    ) {
                        Text(if (isEnglish) "Skip" else "تخطي الآن", color = MoazenInkMuted, fontWeight = FontWeight.SemiBold)
                    }
                }

                Button(
                    onClick = {
                        if (step < 3) {
                            step++
                        } else {
                            if (isAudioPlaying) {
                                val stopIntent = Intent(context, AzkarAudioService::class.java).apply {
                                    action = AzkarAudioService.ACTION_STOP_AUDIO
                                }
                                runCatching { context.startService(stopIntent) }
                            }
                            prefs.setCalculationMethodManually(selectedCalcMethod)
                            prefs.onboardingCompleted = true
                            coroutineScope.launch(Dispatchers.IO) {
                                BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                            }
                            Toast.makeText(
                                context,
                                if (isEnglish) "Saved & scheduled for $selectedCityName" else "تم حفظ الإعدادات وجدولة الأذان لمدينة $selectedCityName",
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
                        text = if (step < 3) {
                            if (isEnglish) "Next" else "التالي"
                        } else {
                            if (isEnglish) "Finish & Schedule" else "إنهاء الإعداد وجدولة الصلوات"
                        },
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
private fun OnboardingSoundSectionCard(
    title: String,
    subtitle: String,
    enabled: Boolean,
    onToggleEnabled: (Boolean) -> Unit,
    voices: List<Pair<String, String>>,
    selectedVoice: String,
    onSelectVoice: (String) -> Unit,
    volumePercent: Int,
    onVolumeChange: (Int) -> Unit,
    isPreviewingThis: Boolean,
    onPreviewClick: () -> Unit,
    extraRow: (@Composable () -> Unit)? = null
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(MoazenSubCardBg)
            .border(1.dp, MoazenCardBorder, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, color = MoazenInkEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text(text = subtitle, color = MoazenInkMuted, fontSize = 10.5.sp)
            }
            Switch(
                checked = enabled,
                onCheckedChange = onToggleEnabled,
                colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
            )
        }

        if (voices.size > 1) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                voices.forEach { (voiceId, voiceLabel) ->
                    FilterChip(
                        selected = selectedVoice == voiceId,
                        onClick = { onSelectVoice(voiceId) },
                        label = { Text(voiceLabel, fontSize = 11.sp) }
                    )
                }
            }
        }

        extraRow?.invoke()

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Slider(
                value = volumePercent.toFloat(),
                onValueChange = { onVolumeChange(it.toInt().coerceIn(0, 100)) },
                valueRange = 0f..100f,
                colors = SliderDefaults.colors(
                    thumbColor = MoazenInkEmerald,
                    activeTrackColor = MoazenInkEmerald,
                    inactiveTrackColor = MoazenCardBorder
                ),
                modifier = Modifier.weight(1f)
            )
            Text(
                text = "$volumePercent%",
                color = MoazenInkPrimary,
                fontSize = 11.5.sp,
                fontWeight = FontWeight.Bold
            )
            OutlinedButton(
                onClick = onPreviewClick,
                border = BorderStroke(1.dp, if (isPreviewingThis) ErrorRed else MoazenGoldDark),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.height(36.dp)
            ) {
                Icon(
                    imageVector = if (isPreviewingThis) Icons.Default.Stop else Icons.Default.PlayArrow,
                    contentDescription = null,
                    tint = if (isPreviewingThis) ErrorRed else MoazenInkEmerald,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (isPreviewingThis) "إيقاف" else "تجربة",
                    color = if (isPreviewingThis) ErrorRed else MoazenInkEmerald,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
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
