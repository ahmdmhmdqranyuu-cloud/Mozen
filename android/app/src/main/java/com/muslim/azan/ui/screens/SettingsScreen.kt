package com.muslim.azan.ui.screens

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.muslim.azan.AlarmScheduler
import com.muslim.azan.AzkarAudioService
import com.muslim.azan.BootReceiver
import com.muslim.azan.R
import com.muslim.azan.data.CountrySummary
import com.muslim.azan.data.GpsLocationResult
import com.muslim.azan.data.MediaFileManager
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.model.CityLocation
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenSubWidgetBox
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

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

    // Live audio test diagnostics state
    var isAudioTestingNow by remember { mutableStateOf(AzkarAudioService.isPlayingNow) }
    var activeAudioLabel by remember { mutableStateOf(AzkarAudioService.activeTrackLabel) }
    var audioTestWarning by remember { mutableStateOf(AzkarAudioService.lastAudioError) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                permissionRefreshTick++
                isAudioTestingNow = AzkarAudioService.isPlayingNow
                activeAudioLabel = AzkarAudioService.activeTrackLabel
                audioTestWarning = AzkarAudioService.lastAudioError
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    DisposableEffect(context) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                if (intent?.action == AzkarAudioService.ACTION_AUDIO_STATE_CHANGED) {
                    isAudioTestingNow = intent.getBooleanExtra("playing", false)
                    activeAudioLabel = intent.getStringExtra("label") ?: ""
                    audioTestWarning = intent.getStringExtra("error")
                }
            }
        }
        val filter = IntentFilter(AzkarAudioService.ACTION_AUDIO_STATE_CHANGED)
        ContextCompat.registerReceiver(
            context,
            receiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
        onDispose {
            runCatching { context.unregisterReceiver(receiver) }
        }
    }

    // Reactive preference states
    var selectedCityName by remember { mutableStateOf(prefs.cityName) }
    var currentLat by remember { mutableDoubleStateOf(prefs.latitude) }
    var currentLng by remember { mutableDoubleStateOf(prefs.longitude) }
    var activeLocationSource by remember { mutableStateOf(prefs.activeLocationSource) }
    var activeLocationHierarchy by remember { mutableStateOf(prefs.activeLocationHierarchy) }

    var citySearchQuery by remember { mutableStateOf("") }
    var selectedCountryFilter by remember { mutableStateOf<String?>(null) }
    var selectedStateFilter by remember { mutableStateOf<String?>(null) }
    var showCountryDropdown by remember { mutableStateOf(false) }
    var showStateDropdown by remember { mutableStateOf(false) }
    var countryFilterQuery by remember { mutableStateOf("") }

    var isDetectingGps by remember { mutableStateOf(false) }
    var gpsStatusDetail by remember { mutableStateOf<String?>(null) }
    var gpsErrorText by remember { mutableStateOf<String?>(null) }
    var gpsDeviceDisabledError by remember { mutableStateOf(false) }
    var pendingGpsResult by remember { mutableStateOf<GpsLocationResult?>(null) }
    var savedGpsBackup by remember { mutableStateOf(prefs.getLastGpsResult()) }

    var worldCities by remember { mutableStateOf(NativeDataManager.defaultCities) }
    var onlineSearchResults by remember { mutableStateOf<List<CityLocation>>(emptyList()) }
    var isSearchingOnline by remember { mutableStateOf(false) }
    var onlineSearchError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        worldCities = withContext(Dispatchers.IO) {
            NativeDataManager.getAllCitiesIncludingCached(context, prefs)
        }
    }

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

    fun launchAudioTest(trackId: String, label: String, section: String = "prayer_azan") {
        val testIntent = Intent(context, AzkarAudioService::class.java).apply {
            putExtra("section", section)
            putExtra("prayerName", label)
            putExtra("title", "تجربة: $label")
            putExtra("cityName", selectedCityName)
            putExtra("audioTrackId", trackId)
            putExtra("autoPlay", true)
            putExtra("isTestAlarm", true)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(testIntent)
        } else {
            context.startService(testIntent)
        }
    }

    fun applyGpsResult(gps: GpsLocationResult) {
        val hierarchy = listOf(
            gps.country,
            gps.governorate,
            gps.city,
            gps.district,
            gps.neighborhood,
            gps.street
        ).filter { it.isNotBlank() }.distinct().joinToString(" • ")

        val sourceTag = if (gps.isSavedFallback) "saved_gps" else "gps"
        prefs.setGpsLocation(
            nameAr = gps.cityName,
            lat = gps.latitude,
            lng = gps.longitude,
            timezoneId = gps.timezoneId,
            sourceTag = sourceTag,
            hierarchyText = hierarchy
        )
        prefs.calculationMethod = gps.calcMethod

        selectedCityName = gps.cityName
        currentLat = gps.latitude
        currentLng = gps.longitude
        activeLocationSource = sourceTag
        activeLocationHierarchy = hierarchy
        pendingGpsResult = null
        gpsErrorText = null
        gpsDeviceDisabledError = false

        val accStr = if (gps.accuracyMeters > 0) " • دقة ±${gps.accuracyMeters}م" else ""
        val prefix = if (gps.isSavedFallback) "تم اعتماد موقع محفوظ: " else "تم اعتماد الموقع الدقيق: "
        gpsStatusDetail = String.format(
            Locale.US,
            "%s%.4f, %.4f%s",
            prefix,
            gps.latitude,
            gps.longitude,
            accStr
        )
        coroutineScope.launch(Dispatchers.IO) {
            BootReceiver.recalculateAndScheduleAll(context.applicationContext)
        }
        Toast.makeText(
            context,
            "تم اعتماد (${gps.cityName}) وتحديث مواقيت الصلاة والقبلة",
            Toast.LENGTH_SHORT
        ).show()
    }

    fun runGpsDetection() {
        gpsErrorText = null
        gpsDeviceDisabledError = false
        if (!SystemPermissionHelper.isDeviceLocationEnabled(context)) {
            gpsDeviceDisabledError = true
            gpsErrorText = "خدمة الموقع (GPS) مغلقة في الهاتف. فعّل GPS ثم أعد المحاولة أو استخدم آخر موقع محفوظ."
            return
        }
        isDetectingGps = true
        gpsStatusDetail = null
        coroutineScope.launch {
            val result = SystemPermissionHelper.detectAndSaveGpsLocation(context, prefs, autoSave = false)
            isDetectingGps = false
            result.onSuccess { gps ->
                pendingGpsResult = gps
                savedGpsBackup = prefs.getLastGpsResult()
                gpsErrorText = null
                gpsDeviceDisabledError = false
            }.onFailure { err ->
                gpsErrorText = err.message ?: "تعذر التقاط إشارة GPS حاليًا"
                savedGpsBackup = prefs.getLastGpsResult()
            }
        }
    }

    val locationPermLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        permissionRefreshTick++
        val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            runGpsDetection()
        } else {
            gpsErrorText = "تم رفض إذن الموقع. يرجى السماح بصلاحية الموقع الدقيق أو اختيار مدينتك يدويًا."
            savedGpsBackup = prefs.getLastGpsResult()
        }
    }

    val micPermLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        permissionRefreshTick++
        Toast.makeText(
            context,
            if (granted) "تم تفعيل إذن الميكروفون للتسميع الذكي" else "يرجى السماح بالميكروفون من إعدادات التطبيق",
            Toast.LENGTH_SHORT
        ).show()
    }

    fun toggleSection(index: Int) {
        expandedSection = if (expandedSection == index) null else index
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // Header: Compact title box matching unified Home Quran widget with dynamically scaled centered title
        item {
            MoazenWidgetCard(
                cornerRadius = 14.dp,
                borderColor = MoazenCardBorder,
                modifier = Modifier.fillMaxWidth()
            ) {
                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .padding(horizontal = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val density = LocalDensity.current
                    val availableTextWidthDp = (maxWidth - 112.dp).coerceAtLeast(100.dp)
                    val titleText = "الإعدادات"
                    val adaptiveFontSp = remember(availableTextWidthDp, titleText, density.fontScale) {
                        val baseSize = (availableTextWidthDp.value / (titleText.length.coerceAtLeast(6) * 0.85f))
                        baseSize.coerceIn(16f, 22f).sp
                    }

                    IconButton(
                        onClick = {
                            if (expandedSection != null) {
                                expandedSection = null
                            } else {
                                onBack()
                            }
                        },
                        modifier = Modifier
                            .align(Alignment.CenterStart)
                            .size(40.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ArrowForward,
                            contentDescription = "رجوع",
                            tint = MoazenInkEmerald,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    @Suppress("DEPRECATION")
                    Text(
                        text = titleText,
                        color = MoazenInkPrimary,
                        fontSize = adaptiveFontSp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        maxLines = 1,
                        softWrap = false,
                        overflow = TextOverflow.Ellipsis,
                        style = TextStyle(
                            lineHeight = (adaptiveFontSp.value * 1.15f).sp,
                            platformStyle = PlatformTextStyle(includeFontPadding = false)
                        ),
                        modifier = Modifier
                            .align(Alignment.Center)
                            .widthIn(max = availableTextWidthDp)
                    )
                }
            }
        }

        // Single-screen 2x5 compact widgets grid when no section is expanded (no scrolling needed)
        if (expandedSection == null) {
            item {
                CompactSettingsOverviewGrid(
                    selectedCityName = selectedCityName,
                    onSelectSection = { sectionIndex -> expandedSection = sectionIndex }
                )
            }
        } else {
            item {
                OutlinedButton(
                    onClick = { expandedSection = null },
                    border = BorderStroke(1.dp, GoldAccent.copy(alpha = 0.5f)),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.GridView, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("العودة لجميع ودجات الإعدادات", color = GoldAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Section 1: Profile & Stats
        if (expandedSection == 1) {
            item {
                SettingsCollapsibleCard(
                    title = "1. الملف الشخصي والإحصائيات",
                    icon = Icons.Default.Person,
                    iconResId = R.drawable.ic_settings_profile,
                    isExpanded = true,
                    onToggle = { toggleSection(1) }
                ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "إجمالي التسبيحات المسجلة:", color = MoazenInkMuted, fontSize = 13.sp)
                        Text(text = "${prefs.totalTasbihCount} تسبيحة", color = MoazenInkEmerald, fontWeight = FontWeight.Bold)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "آخر سورة تمت قراءتها:", color = MoazenInkMuted, fontSize = 13.sp)
                        val s = NativeDataManager.surahs.find { it.number == prefs.lastReadSurah }
                        Text(text = "سورة ${s?.nameArabic ?: "الفاتحة"}", color = MoazenInkPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
        }

        // Section 2: Permissions & Overlay
        if (expandedSection == 2) {
            item {
                SettingsCollapsibleCard(
                    title = "2. الأذونات وصلاحيات النظام",
                    icon = Icons.Default.Security,
                    isExpanded = true,
                    onToggle = { toggleSection(2) }
                ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "لضمان تشغيل الأذان والأذكار والنافذة العائمة في الخلفية وعلى الشاشة المقفلة (Android 14-16):",
                        color = MoazenInkMuted,
                        fontSize = 12.sp
                    )

                    PermissionStatusLine("إذن الإشعارات:", permStatus.notificationsGranted)
                    PermissionStatusLine("إذن المنبهات الدقيقة:", permStatus.exactAlarmsGranted)
                    PermissionStatusLine("الظهور فوق التطبيقات:", permStatus.overlayGranted)
                    PermissionStatusLine(
                        "استثناء توفير البطارية:",
                        permStatus.batteryUnrestricted,
                        falseText = "مقيد (يُنصح بالاستثناء)",
                        falseColor = MoazenGoldDark
                    )
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        PermissionStatusLine("الظهور على شاشة القفل:", permStatus.fullScreenIntentGranted)
                    }
                    PermissionStatusLine("إذن الميكروفون (شيخي):", permStatus.microphoneGranted)

                    if (!permStatus.microphoneGranted) {
                        Button(
                            onClick = { micPermLauncher.launch(Manifest.permission.RECORD_AUDIO) },
                            colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald.copy(alpha = 0.1f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("تفعيل إذن الميكروفون للتسميع", color = MoazenInkEmerald, fontWeight = FontWeight.Bold)
                        }
                    }

                    Button(
                        onClick = { SystemPermissionHelper.openNotificationSettings(context) },
                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald.copy(alpha = 0.08f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("إعدادات إشعارات التطبيق", color = MoazenInkPrimary, fontWeight = FontWeight.Medium)
                    }

                    Button(
                        onClick = { SystemPermissionHelper.openExactAlarmSettings(context) },
                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald.copy(alpha = 0.08f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("إذن التنبيهات الدقيقة (Exact Alarms)", color = MoazenInkPrimary, fontWeight = FontWeight.Medium)
                    }

                    Button(
                        onClick = { SystemPermissionHelper.openOverlaySettings(context) },
                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald.copy(alpha = 0.08f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("إذن الظهور فوق التطبيقات الأخرى (Overlay)", color = MoazenInkPrimary, fontWeight = FontWeight.Medium)
                    }

                    Button(
                        onClick = { SystemPermissionHelper.openBatteryOptimizationSettings(context) },
                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald.copy(alpha = 0.08f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("تحسين استهلاك البطارية (عدم إيقاف التطبيق)", color = MoazenInkPrimary, fontWeight = FontWeight.Medium)
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        Button(
                            onClick = { SystemPermissionHelper.openFullScreenIntentSettings(context) },
                            colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald.copy(alpha = 0.08f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("إذن الظهور على شاشة القفل (Full Screen Intent)", color = MoazenInkPrimary, fontWeight = FontWeight.Medium)
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
                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Layers, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("تجربة النافذة العائمة فوق التطبيقات", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
        }

        // Section 3: Location, Smart GPS Confirmation & Global Countries/Regions/Cities DB + Online OSM
        if (expandedSection == 3) {
            item {
                SettingsCollapsibleCard(
                    title = "3. تحديد الموقع ومدن العالم",
                    icon = Icons.Default.LocationOn,
                    isExpanded = true,
                    onToggle = { toggleSection(3) }
                ) {
                val countries = remember(worldCities) {
                    NativeDataManager.getCountries(context, prefs)
                }
                val filteredCountries = remember(countries, countryFilterQuery) {
                    val nq = NativeDataManager.normalizeArabic(countryFilterQuery)
                    if (nq.isEmpty()) countries else countries.filter {
                        NativeDataManager.normalizeArabic(it.countryAr).contains(nq) ||
                            NativeDataManager.normalizeArabic(it.countryEn).contains(nq)
                    }
                }
                val statesForSelectedCountry = remember(worldCities, selectedCountryFilter) {
                    selectedCountryFilter?.let {
                        NativeDataManager.getStatesForCountry(context, prefs, it)
                    } ?: emptyList()
                }
                val filteredCities = remember(
                    worldCities,
                    citySearchQuery,
                    selectedCountryFilter,
                    selectedStateFilter
                ) {
                    NativeDataManager.searchCities(
                        context = context,
                        prefs = prefs,
                        query = citySearchQuery,
                        countryFilter = selectedCountryFilter,
                        stateFilter = selectedStateFilter,
                        limit = 80
                    )
                }
                val selectedCountrySummary = remember(countries, selectedCountryFilter) {
                    countries.find { it.countryAr == selectedCountryFilter }
                }

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Active Location Strip
                    MoazenSubWidgetBox(
                        cornerRadius = 12.dp,
                        borderColor = MoazenGold.copy(alpha = 0.55f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "الموقع النشط حاليًا",
                                    color = MoazenInkMuted,
                                    fontSize = 11.sp
                                )
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = MoazenInkEmerald.copy(alpha = 0.1f)
                                ) {
                                    Text(
                                        text = when (activeLocationSource) {
                                            "gps" -> "GPS مباشر"
                                            "saved_gps" -> "موقع محفوظ"
                                            "online" -> "بحث عالمي"
                                            else -> "اختيار يدوي"
                                        },
                                        color = MoazenInkEmerald,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Text(
                                text = selectedCityName,
                                color = MoazenInkPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            if (activeLocationHierarchy.isNotBlank()) {
                                Text(
                                    text = activeLocationHierarchy,
                                    color = MoazenInkMuted,
                                    fontSize = 11.sp
                                )
                            }
                            Text(
                                text = String.format(Locale.US, "الإحداثيات: %.4f°, %.4f°", currentLat, currentLng),
                                color = MoazenInkMuted,
                                fontSize = 11.sp
                            )
                        }
                    }

                    if (gpsStatusDetail != null) {
                        Text(
                            text = gpsStatusDetail ?: "",
                            color = EmeraldPrimaryDark,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Primary GPS Detection Button
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
                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (isDetectingGps) {
                            CircularProgressIndicator(
                                color = Color.White,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(18.dp)
                            )
                        } else {
                            Icon(Icons.Default.MyLocation, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isDetectingGps) "جاري تحديد موقعك الدقيق عبر GPS..." else "تحديد موقعي التلقائي الدقيق (GPS)",
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Pending GPS Confirmation Panel (displays Country, Governorate, City, District, Neighborhood, Street, Coords, Accuracy)
                    pendingGpsResult?.let { pending ->
                        MoazenSubWidgetBox(
                            cornerRadius = 12.dp,
                            borderColor = if (pending.isSavedFallback) MoazenGold else EmeraldPrimaryDark,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = if (pending.isSavedFallback) "استعادة آخر موقع محفوظ" else "تم التقاط موقعك الدقيق بنجاح",
                                        color = if (pending.isSavedFallback) MoazenGoldDark else EmeraldPrimaryDark,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    if (pending.isSavedFallback) {
                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = MoazenGold.copy(alpha = 0.2f)
                                        ) {
                                            Text(
                                                text = "موقع محفوظ",
                                                color = MoazenGoldDark,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }

                                if (pending.country.isNotBlank()) {
                                    LocationDetailRow("الدولة:", pending.country)
                                }
                                if (pending.governorate.isNotBlank()) {
                                    LocationDetailRow("المحافظة / الولاية:", pending.governorate)
                                }
                                if (pending.city.isNotBlank()) {
                                    LocationDetailRow("المدينة:", pending.city)
                                }
                                if (pending.district.isNotBlank()) {
                                    LocationDetailRow("المنطقة / المركز:", pending.district)
                                }
                                if (pending.neighborhood.isNotBlank()) {
                                    LocationDetailRow("الحي:", pending.neighborhood)
                                }
                                if (pending.street.isNotBlank()) {
                                    LocationDetailRow("الشارع:", pending.street)
                                }
                                LocationDetailRow(
                                    "الإحداثيات:",
                                    String.format(Locale.US, "%.5f°, %.5f°", pending.latitude, pending.longitude)
                                )
                                if (pending.accuracyMeters > 0) {
                                    LocationDetailRow("دقة التحديد:", "±${pending.accuracyMeters} متر")
                                }

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 4.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = { applyGpsResult(pending) },
                                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "اعتماد وتحديث المواقيت",
                                            color = Color.White,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    OutlinedButton(
                                        onClick = { pendingGpsResult = null },
                                        border = BorderStroke(1.dp, MoazenCardBorder)
                                    ) {
                                        Text("إلغاء", color = MoazenInkMuted, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }

                    // Non-destructive GPS Error Panel
                    if (gpsErrorText != null) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFFEE2E2),
                            border = BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.65f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = gpsErrorText ?: "",
                                    color = Color(0xFF991B1B),
                                    fontSize = 12.sp,
                                    lineHeight = 18.sp
                                )
                                Text(
                                    text = "تم الإبقاء على موقعك الحالي ($selectedCityName) دون تغيير.",
                                    color = MoazenInkMuted,
                                    fontSize = 11.sp
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = { runGpsDetection() },
                                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("إعادة المحاولة", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                    if (gpsDeviceDisabledError) {
                                        OutlinedButton(
                                            onClick = { SystemPermissionHelper.openLocationSourceSettings(context) },
                                            border = BorderStroke(1.dp, MoazenInkEmerald),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Text("تفعيل GPS", color = MoazenInkEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                                if (savedGpsBackup != null) {
                                    OutlinedButton(
                                        onClick = {
                                            pendingGpsResult = savedGpsBackup?.copy(isSavedFallback = true)
                                            gpsErrorText = null
                                        },
                                        border = BorderStroke(1.dp, MoazenInkEmerald.copy(alpha = 0.6f)),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(Icons.Default.History, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "استخدام آخر موقع محفوظ (${savedGpsBackup?.cityName ?: "موقع محفوظ"})",
                                            color = MoazenInkEmerald,
                                            fontSize = 12.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }
                    }

                    HorizontalDivider(color = MoazenCardBorder, thickness = 1.dp)

                    // Hierarchical Selectors: Country -> Governorate/State -> Cities
                    Text(
                        text = "الاختيار الهرمي العالمي (${countries.size} دولة • ${worldCities.size} مدينة ومنطقة):",
                        color = MoazenInkEmerald,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Country Dropdown Trigger
                        OutlinedButton(
                            onClick = {
                                showCountryDropdown = !showCountryDropdown
                                showStateDropdown = false
                            },
                            border = BorderStroke(1.dp, if (selectedCountryFilter != null) MoazenInkEmerald else MoazenCardBorder),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Public, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = selectedCountryFilter ?: "كل الدول (${countries.size})",
                                color = MoazenInkPrimary,
                                fontSize = 12.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                            Icon(
                                imageVector = if (showCountryDropdown) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null,
                                tint = MoazenInkMuted,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        // State/Governorate Dropdown Trigger (if country selected has states)
                        if (statesForSelectedCountry.isNotEmpty()) {
                            OutlinedButton(
                                onClick = {
                                    showStateDropdown = !showStateDropdown
                                    showCountryDropdown = false
                                },
                                border = BorderStroke(1.dp, if (selectedStateFilter != null) MoazenInkEmerald else MoazenCardBorder),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.Map, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = selectedStateFilter ?: "كل المحافظات (${statesForSelectedCountry.size})",
                                    color = MoazenInkPrimary,
                                    fontSize = 12.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Icon(
                                    imageVector = if (showStateDropdown) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                    contentDescription = null,
                                    tint = MoazenInkMuted,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }

                    // Quick Country Chips
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        val quickCountries = listOf(null to "الكل", "مصر" to "مصر", "المملكة العربية السعودية" to "السعودية", "الإمارات العربية المتحدة" to "الإمارات", "الأردن" to "الأردن", "المغرب" to "المغرب")
                        quickCountries.forEach { (cVal, cLabel) ->
                            val isAct = selectedCountryFilter == cVal
                            FilterChip(
                                selected = isAct,
                                onClick = {
                                    selectedCountryFilter = cVal
                                    selectedStateFilter = null
                                    showCountryDropdown = false
                                    showStateDropdown = false
                                },
                                label = { Text(cLabel, fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MoazenInkEmerald,
                                    selectedLabelColor = Color.White,
                                    containerColor = Color.White.copy(alpha = 0.72f),
                                    labelColor = MoazenInkPrimary
                                )
                            )
                        }
                    }

                    // Expanded Country Picker Panel
                    AnimatedVisibility(visible = showCountryDropdown) {
                        MoazenSubWidgetBox(
                            cornerRadius = 10.dp,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                OutlinedTextField(
                                    value = countryFilterQuery,
                                    onValueChange = { countryFilterQuery = it },
                                    placeholder = { Text("ابحث عن دولة...", color = MoazenInkMuted, fontSize = 12.sp) },
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = MoazenInkEmerald,
                                        unfocusedBorderColor = MoazenCardBorder,
                                        focusedTextColor = MoazenInkPrimary,
                                        unfocusedTextColor = MoazenInkPrimary
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                )
                                filteredCountries.take(30).forEach { cSummary: CountrySummary ->
                                    val isSel = selectedCountryFilter == cSummary.countryAr
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (isSel) MoazenInkEmerald else Color.White.copy(alpha = 0.85f))
                                            .clickable {
                                                selectedCountryFilter = cSummary.countryAr
                                                selectedStateFilter = null
                                                showCountryDropdown = false
                                                countryFilterQuery = ""
                                            }
                                            .padding(horizontal = 10.dp, vertical = 8.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(cSummary.countryAr, color = if (isSel) Color.White else MoazenInkPrimary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                            if (cSummary.countryEn.isNotBlank()) {
                                                Text(cSummary.countryEn, color = if (isSel) Color.White.copy(alpha = 0.8f) else MoazenInkMuted, fontSize = 10.sp)
                                            }
                                        }
                                        Text(
                                            text = if (cSummary.statesCount > 0) "${cSummary.statesCount} منطقة • ${cSummary.citiesCount} مدينة" else "${cSummary.citiesCount} مدينة",
                                            color = if (isSel) Color.White else MoazenGoldDark,
                                            fontSize = 10.sp
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Expanded State/Governorate Picker Panel
                    AnimatedVisibility(visible = showStateDropdown && statesForSelectedCountry.isNotEmpty()) {
                        MoazenSubWidgetBox(
                            cornerRadius = 10.dp,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (selectedStateFilter == null) MoazenInkEmerald else Color.White.copy(alpha = 0.85f))
                                        .clickable {
                                            selectedStateFilter = null
                                            showStateDropdown = false
                                        }
                                        .padding(horizontal = 10.dp, vertical = 8.dp)
                                ) {
                                    Text("كل المحافظات / الولايات", color = if (selectedStateFilter == null) Color.White else MoazenInkPrimary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                }
                                statesForSelectedCountry.forEach { stateName ->
                                    val isStateSel = selectedStateFilter == stateName
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (isStateSel) MoazenInkEmerald else Color.White.copy(alpha = 0.85f))
                                            .clickable {
                                                selectedStateFilter = stateName
                                                showStateDropdown = false
                                            }
                                            .padding(horizontal = 10.dp, vertical = 8.dp)
                                    ) {
                                        Text(stateName, color = if (isStateSel) Color.White else MoazenInkPrimary, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }

                    // Global Search Input + Online Search Button
                    OutlinedTextField(
                        value = citySearchQuery,
                        onValueChange = {
                            citySearchQuery = it
                            onlineSearchError = null
                        },
                        placeholder = {
                            Text(
                                "ابحث عن أي مدينة، مركز، حي أو قرية بالعالم...",
                                color = MoazenInkMuted,
                                fontSize = 12.sp
                            )
                        },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MoazenInkEmerald) },
                        trailingIcon = {
                            if (citySearchQuery.isNotEmpty()) {
                                IconButton(onClick = {
                                    citySearchQuery = ""
                                    onlineSearchResults = emptyList()
                                    onlineSearchError = null
                                }) {
                                    Icon(Icons.Default.Close, contentDescription = "مسح", tint = MoazenInkMuted)
                                }
                            }
                        },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MoazenInkEmerald,
                            unfocusedBorderColor = MoazenCardBorder,
                            focusedTextColor = MoazenInkPrimary,
                            unfocusedTextColor = MoazenInkPrimary
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (citySearchQuery.trim().length >= 2) {
                        OutlinedButton(
                            onClick = {
                                isSearchingOnline = true
                                onlineSearchError = null
                                coroutineScope.launch {
                                    val res = NativeDataManager.searchOnlineOsm(
                                        context = context,
                                        prefs = prefs,
                                        query = citySearchQuery,
                                        countryCode = selectedCountrySummary?.countryCode
                                    )
                                    isSearchingOnline = false
                                    res.onSuccess { list ->
                                        onlineSearchResults = list
                                        worldCities = withContext(Dispatchers.IO) {
                                            NativeDataManager.getAllCitiesIncludingCached(context, prefs)
                                        }
                                        if (list.isEmpty()) {
                                            onlineSearchError = "لم يتم العثور على نتائج إضافية عبر الإنترنت لـ «$citySearchQuery»"
                                        }
                                    }.onFailure { err ->
                                        onlineSearchError = err.message ?: "تعذر البحث أونلاين، تأكد من اتصال الإنترنت"
                                    }
                                }
                            },
                            enabled = !isSearchingOnline,
                            border = BorderStroke(1.dp, MoazenInkEmerald.copy(alpha = 0.7f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (isSearchingOnline) {
                                CircularProgressIndicator(color = MoazenInkEmerald, strokeWidth = 2.dp, modifier = Modifier.size(16.dp))
                            } else {
                                Icon(Icons.Default.TravelExplore, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(17.dp))
                            }
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (isSearchingOnline) "جاري البحث العالمي عبر الإنترنت..." else "بحث عالمي أونلاين عن «${citySearchQuery.trim()}»",
                                color = MoazenInkEmerald,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    if (onlineSearchError != null) {
                        Text(text = onlineSearchError ?: "", color = MoazenGoldDark, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                    }

                    val displayCities = remember(filteredCities, onlineSearchResults) {
                        if (onlineSearchResults.isEmpty()) {
                            filteredCities
                        } else {
                            val ids = onlineSearchResults.map { it.id }.toSet()
                            onlineSearchResults + filteredCities.filterNot { it.id in ids }
                        }
                    }

                    Text(
                        text = if (citySearchQuery.isBlank() && selectedCountryFilter == null)
                            "المدن العالمية والمحفوظة (${displayCities.size} من ${worldCities.size}):"
                        else
                            "النتائج المطابقة (${displayCities.size}):",
                        color = MoazenInkMuted,
                        fontSize = 12.sp
                    )

                    displayCities.forEach { city ->
                        CitySelectionRow(
                            city = city,
                            isSelected = selectedCityName == city.nameAr || selectedCityName == "${city.nameAr} - ${city.country}",
                            onSelect = {
                                val fullDisplayName = if (city.country.isNotBlank() && !city.nameAr.contains(city.country)) {
                                    "${city.nameAr} - ${city.country}"
                                } else {
                                    city.nameAr
                                }
                                prefs.setCity(city)
                                prefs.cityName = fullDisplayName
                                selectedCityName = fullDisplayName
                                currentLat = city.latitude
                                currentLng = city.longitude
                                activeLocationSource = prefs.activeLocationSource
                                activeLocationHierarchy = prefs.activeLocationHierarchy
                                gpsStatusDetail = null
                                gpsErrorText = null
                                pendingGpsResult = null
                                coroutineScope.launch(Dispatchers.IO) {
                                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                }
                                Toast.makeText(
                                    context,
                                    "تم تحديد $fullDisplayName وضبط المواقيت وطريقة الحساب",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        )
                    }
                }
            }
        }
        }

        // Section 4: Language
        if (expandedSection == 4) {
            item {
                SettingsCollapsibleCard(
                    title = "4. لغة التطبيق والواجهة",
                    icon = Icons.Default.Language,
                    isExpanded = true,
                    onToggle = { toggleSection(4) }
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(MoazenInkEmerald)
                                .padding(10.dp)
                        ) {
                            Text("العربية (اللغة الافتراضية)", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Section 5: Azan Settings & Comprehensive Sound Tester
        if (expandedSection == 5) {
            item {
                SettingsCollapsibleCard(
                    title = "5. إعدادات الأذان واختبار الأصوات",
                    icon = Icons.Default.VolumeUp,
                    iconResId = R.drawable.ic_settings_azan,
                    isExpanded = true,
                    onToggle = { toggleSection(5) }
                ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("تشغيل صوت الأذان تلقائيًا:", color = MoazenInkPrimary, fontSize = 13.sp)
                        Switch(
                            checked = azanSoundEnabled,
                            onCheckedChange = {
                                azanSoundEnabled = it
                                prefs.azanSoundEnabled = it
                                coroutineScope.launch(Dispatchers.IO) {
                                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                }
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("تنبيه قبل الصلاة بـ 15 دقيقة:", color = MoazenInkPrimary, fontSize = 13.sp)
                        Switch(
                            checked = prePrayerAlertEnabled,
                            onCheckedChange = {
                                prePrayerAlertEnabled = it
                                prefs.prePrayerAlertEnabled = it
                                coroutineScope.launch(Dispatchers.IO) {
                                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                }
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
                        )
                    }

                    // Live Sound Diagnostics Banner
                    if (isAudioTestingNow || audioTestWarning != null) {
                        MoazenSubWidgetBox(
                            cornerRadius = 10.dp,
                            borderColor = if (audioTestWarning != null) MoazenGold else EmeraldPrimaryDark.copy(alpha = 0.5f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                if (isAudioTestingNow) {
                                    Text(
                                        text = "جاري التشغيل الآن: $activeAudioLabel",
                                        color = EmeraldPrimaryDark,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                if (audioTestWarning != null) {
                                    Text(
                                        text = audioTestWarning ?: "",
                                        color = MoazenGoldDark,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    Text("صوت المؤذن المختار (اضغط لاختيار أو تجربة الصوت):", color = MoazenInkEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    val azanVoices = listOf(
                        "makkah" to "أذان المسجد الحرام (مكة)",
                        "madinah" to "أذان المسجد النبوي (المدينة)",
                        "alaqsa" to "أذان المسجد الأقصى",
                        "cairo" to "أذان القاهرة (الشيخ محمد رفعت/الشعشاعي)",
                        "alafasy" to "الشيخ مشاري العفاسي"
                    )
                    azanVoices.forEach { (voiceKey, voiceLabel) ->
                        val isVoiceSelected = selectedAzanVoice == voiceKey
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isVoiceSelected) MoazenInkEmerald else Color.White.copy(alpha = 0.72f))
                                .border(1.dp, MoazenCardBorder, RoundedCornerShape(8.dp))
                                .clickable {
                                    selectedAzanVoice = voiceKey
                                    prefs.azanVoice = voiceKey
                                    coroutineScope.launch(Dispatchers.IO) {
                                        BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                    }
                                    Toast.makeText(context, "تم اختيار: $voiceLabel", Toast.LENGTH_SHORT).show()
                                }
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = voiceLabel,
                                color = if (isVoiceSelected) Color.White else MoazenInkPrimary,
                                fontSize = 12.sp,
                                fontWeight = if (isVoiceSelected) FontWeight.Bold else FontWeight.Medium,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(
                                onClick = {
                                    selectedAzanVoice = voiceKey
                                    prefs.azanVoice = voiceKey
                                    launchAudioTest(voiceKey, voiceLabel, "prayer_azan")
                                },
                                modifier = Modifier.size(34.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PlayArrow,
                                    contentDescription = "تجربة $voiceLabel",
                                    tint = if (isVoiceSelected) Color.White else MoazenInkEmerald
                                )
                            }
                        }
                    }

                    Text("اختبار باقي أصوات التنبيهات والأذكار:", color = MoazenInkEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    val extraSounds = listOf(
                        Triple("abdulbasit_fajr", "أذان الفجر", "prayer_azan"),
                        Triple("iqama_1", "صوت الإقامة", "prePrayerAlert"),
                        Triple("pre_prayer_15m", "تنبيه قبل الصلاة", "prePrayerAlert"),
                        Triple("azkar_sabah", "أذكار الصباح", "morningAzkar"),
                        Triple("azkar_massa", "أذكار المساء", "eveningAzkar"),
                        Triple("salawat_1", "الصلاة على النبي", "salawat"),
                        Triple("musaharati_1", "المسحراتي", "musaharati"),
                        Triple("iftar_cannon", "مدفع الإفطار", "iftar")
                    )
                    extraSounds.chunked(2).forEach { pair ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            pair.forEach { (trackId, label, section) ->
                                OutlinedButton(
                                    onClick = { launchAudioTest(trackId, label, section) },
                                    border = BorderStroke(1.dp, MoazenCardBorder),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(15.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(label, color = MoazenInkPrimary, fontSize = 11.sp, maxLines = 1)
                                }
                            }
                        }
                    }

                    // Genuine 5-second AlarmManager background test
                    Button(
                        onClick = {
                            if (!permStatus.exactAlarmsGranted) {
                                Toast.makeText(
                                    context,
                                    "ملاحظة: فعّل إذن المنبهات الدقيقة ليصل الاختبار في الخلفية بدقة",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
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
                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Schedule, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "اختبار حقيقي في الخلفية (بعد 5 ثوانٍ)",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    if (backgroundTestScheduledNote != null) {
                        Text(
                            text = backgroundTestScheduledNote ?: "",
                            color = EmeraldPrimaryDark,
                            fontSize = 12.sp,
                            lineHeight = 18.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { launchAudioTest(selectedAzanVoice, "الأذان المختار", "prayer_azan") },
                            colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald.copy(alpha = 0.1f)),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("تشغيل فوري", color = MoazenInkEmerald, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                        Button(
                            onClick = {
                                val stopIntent = Intent(context, AzkarAudioService::class.java).apply {
                                    action = AzkarAudioService.ACTION_STOP_AUDIO
                                }
                                context.startService(stopIntent)
                                backgroundTestScheduledNote = null
                                isAudioTestingNow = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ErrorRed.copy(alpha = 0.12f)),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Stop, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("إيقاف الصوت", color = Color(0xFF991B1B), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
        }

        // Section 6: Azkar Reminders
        if (expandedSection == 6) {
            item {
                SettingsCollapsibleCard(
                    title = "6. تنبيهات الأذكار والصلوات على النبي",
                    icon = Icons.Default.Alarm,
                    isExpanded = true,
                    onToggle = { toggleSection(6) }
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("تذكير الصلاة على النبي ﷺ الدوري:", color = MoazenInkPrimary, fontSize = 13.sp)
                            Switch(
                                checked = salawatEnabled,
                                onCheckedChange = {
                                    salawatEnabled = it
                                    prefs.salawatEnabled = it
                                    coroutineScope.launch(Dispatchers.IO) {
                                        BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                    }
                                },
                                colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("أذكار الصباح (الساعة ${prefs.morningAzkarTime}):", color = MoazenInkPrimary, fontSize = 13.sp)
                            Switch(
                                checked = morningAzkarEnabled,
                                onCheckedChange = {
                                    morningAzkarEnabled = it
                                    prefs.morningAzkarEnabled = it
                                    coroutineScope.launch(Dispatchers.IO) {
                                        BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                    }
                                },
                                colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("أذكار المساء (الساعة ${prefs.eveningAzkarTime}):", color = MoazenInkPrimary, fontSize = 13.sp)
                            Switch(
                                checked = eveningAzkarEnabled,
                                onCheckedChange = {
                                    eveningAzkarEnabled = it
                                    prefs.eveningAzkarEnabled = it
                                    coroutineScope.launch(Dispatchers.IO) {
                                        BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                    }
                                },
                                colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
                            )
                        }
                    }
                }
            }
        }

        // Section 7: Ramadan Settings
        if (expandedSection == 7) {
            item {
                SettingsCollapsibleCard(
                    title = "7. إعدادات شهر رمضان المبارك",
                    icon = Icons.Default.NightsStay,
                    isExpanded = true,
                    onToggle = { toggleSection(7) }
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("تنبيه نداء المسحراتي قبل الفجر:", color = MoazenInkPrimary, fontSize = 13.sp)
                            Switch(
                                checked = musaharatiEnabled,
                                onCheckedChange = {
                                    musaharatiEnabled = it
                                    prefs.musaharatiEnabled = it
                                    coroutineScope.launch(Dispatchers.IO) {
                                        BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                                    }
                                },
                                colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
                            )
                        }
                    }
                }
            }
        }

        // Section 8: Privacy Policy
        if (expandedSection == 8) {
            item {
                SettingsCollapsibleCard(
                    title = "8. سياسة الخصوصية وأمان البيانات",
                    icon = Icons.Default.PrivacyTip,
                    iconResId = R.drawable.ic_settings_privacy,
                    isExpanded = true,
                    onToggle = { toggleSection(8) }
                ) {
                    Text(
                        text = "تطبيق المؤذن يحترم خصوصيتك بنسبة 100%. جميع مواقيت الصلاة والأذكار والتسبيحات تعمل محليًا دون جمع أي بيانات شخصية أو إرسالها إلى أي خوادم خارجية.",
                        color = MoazenInkMuted,
                        fontSize = 12.sp,
                        lineHeight = 18.sp
                    )
                }
            }
        }

        // Section 9: About App (حول التطبيق)
        if (expandedSection == 9) {
            item {
                SettingsCollapsibleCard(
                    title = "9. حول التطبيق",
                    icon = Icons.Default.Info,
                    iconResId = R.drawable.ic_settings_about,
                    isExpanded = true,
                    onToggle = { toggleSection(9) }
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "أنا مسلم بلس — المؤذن (الإصدار 2.2.0)",
                            color = MoazenInkEmerald,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "تطبيق إسلامي شامل صدقة جارية خالصة لوجه الله تعالى بدون أي إعلانات.",
                            color = MoazenInkPrimary,
                            fontSize = 12.sp
                        )
                        Text(
                            text = "• المصادر المعتمدة: القرآن الكريم والتفسير الميسر (مجمع الملك فهد)، صحيح البخاري ومسلم، وحصن المسلم.",
                            color = MoazenInkMuted,
                            fontSize = 11.sp,
                            lineHeight = 17.sp
                        )
                        Text(
                            text = "• المزايا: مواقيت فلكية دقيقة، أذان في الخلفية وعلى شاشة القفل، GPS هجين، 211 دولة وإقليمًا، ومُعلّم القرآن الذكي «شيخي».",
                            color = MoazenInkMuted,
                            fontSize = 11.sp,
                            lineHeight = 17.sp
                        )
                    }
                }
            }
        }

        // Section 10: Storage
        if (expandedSection == 10) {
            item {
                SettingsCollapsibleCard(
                    title = "10. إدارة التخزين المؤقت",
                    icon = Icons.Default.CleaningServices,
                    isExpanded = true,
                    onToggle = { toggleSection(10) }
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "تنظيف الملفات المؤقتة فقط دون المساس بالمفضلات أو المحفوظات:",
                            color = MoazenInkMuted,
                            fontSize = 12.sp
                        )
                        Button(
                            onClick = {
                                val freed = MediaFileManager.cleanTemporaryCache(context)
                                Toast.makeText(context, "تم تنظيف $freed بايت من الملفات المؤقتة بنجاح", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("تنظيف الذاكرة المؤقتة (Cache Cleanup)", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

private data class CompactSettingsTileItem(
    val index: Int,
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    @DrawableRes val iconResId: Int? = null
)

@Composable
private fun CompactSettingsOverviewGrid(
    selectedCityName: String,
    onSelectSection: (Int) -> Unit
) {
    val items = remember(selectedCityName) {
        listOf(
            CompactSettingsTileItem(1, "الملف الشخصي", "الإحصائيات والختمة", Icons.Default.Person, R.drawable.ic_settings_profile),
            CompactSettingsTileItem(2, "الأذونات والنظام", "البطارية والتنبيهات", Icons.Default.Security),
            CompactSettingsTileItem(3, "الموقع والمدن", selectedCityName, Icons.Default.LocationOn),
            CompactSettingsTileItem(4, "لغة التطبيق", "العربية", Icons.Default.Language),
            CompactSettingsTileItem(5, "إعدادات الأذان", "الأصوات والاختبار", Icons.Default.VolumeUp, R.drawable.ic_settings_azan),
            CompactSettingsTileItem(6, "الأذكار والصلوات", "الصباح والمساء", Icons.Default.Alarm),
            CompactSettingsTileItem(7, "شهر رمضان", "المسحراتي والإمساك", Icons.Default.NightsStay),
            CompactSettingsTileItem(8, "سياسة الخصوصية", "100% أمان محلي", Icons.Default.PrivacyTip, R.drawable.ic_settings_privacy),
            CompactSettingsTileItem(9, "حول التطبيق", "الإصدار والمصادر", Icons.Default.Info, R.drawable.ic_settings_about),
            CompactSettingsTileItem(10, "التخزين المؤقت", "تنظيف الذاكرة", Icons.Default.CleaningServices)
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        items.forEach { item ->
            MoazenWidgetCard(
                cornerRadius = 10.dp,
                elevation = 1.dp,
                onClick = { onSelectSection(item.index) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF0A1412))
                            .border(1.dp, Color(0xFF1F332E), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        if (item.iconResId != null) {
                            Image(
                                painter = painterResource(id = item.iconResId),
                                contentDescription = item.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .graphicsLayer {
                                        scaleX = 1.16f
                                        scaleY = 1.16f
                                    }
                            )
                        } else {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = null,
                                tint = GoldAccent,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }

                    Text(
                        text = "${item.index}. ${item.title}",
                        color = MoazenInkPrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )

                    Text(
                        text = item.subtitle,
                        color = MoazenInkMuted,
                        fontSize = 10.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.widthIn(max = 110.dp)
                    )

                    Icon(
                        imageVector = Icons.Default.ChevronLeft,
                        contentDescription = null,
                        tint = MoazenGoldDark,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun LocationDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, color = MoazenInkMuted, fontSize = 11.sp)
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = value,
            color = MoazenInkPrimary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.End
        )
    }
}

@Composable
private fun CitySelectionRow(
    city: CityLocation,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) MoazenInkEmerald else Color.White.copy(alpha = 0.72f))
            .border(1.dp, if (isSelected) MoazenInkEmerald else MoazenCardBorder, RoundedCornerShape(8.dp))
            .clickable(onClick = onSelect)
            .padding(10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "${city.nameAr} - ${city.country}",
                    color = if (isSelected) Color.White else MoazenInkPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                if (city.isCachedOnline) {
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = if (isSelected) Color.White.copy(alpha = 0.18f) else MoazenGold.copy(alpha = 0.22f)
                    ) {
                        Text(
                            text = "أونلاين",
                            color = if (isSelected) Color.White else MoazenGoldDark,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp)
                        )
                    }
                }
            }
            val subLine = listOfNotNull(
                city.stateAr.takeIf { it.isNotBlank() },
                city.district.takeIf { it.isNotBlank() },
                city.nameEn.takeIf { it.isNotBlank() }
            ).joinToString(" • ")
            if (subLine.isNotEmpty()) {
                Text(
                    text = subLine,
                    color = if (isSelected) Color.White.copy(alpha = 0.8f) else MoazenInkMuted,
                    fontSize = 10.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        Text(
            text = when (city.recommendedCalcMethod) {
                "egypt" -> "المصرية"
                "mwl" -> "الرابطة"
                "isna" -> "أمريكا ش"
                "karachi" -> "كراتشي"
                "dubai" -> "الخليج"
                else -> "أم القرى"
            },
            color = if (isSelected) Color.White else MoazenGoldDark,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold
        )
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
        Text(label, color = MoazenInkPrimary, fontSize = 12.sp)
        Text(
            if (granted) "مفعّل ✓" else falseText,
            color = if (granted) EmeraldPrimaryDark else falseColor,
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
    @DrawableRes iconResId: Int? = null,
    content: @Composable () -> Unit
) {
    MoazenWidgetCard(
        cornerRadius = 16.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onToggle() },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(RoundedCornerShape(13.dp))
                            .background(Color(0xFF0A1412))
                            .border(1.5.dp, Color(0xFF1F332E), RoundedCornerShape(13.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        if (iconResId != null) {
                            Image(
                                painter = painterResource(id = iconResId),
                                contentDescription = title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .graphicsLayer {
                                        scaleX = 1.16f
                                        scaleY = 1.16f
                                    }
                            )
                        } else {
                            Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = GoldAccent,
                                modifier = Modifier.size(44.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = title,
                        color = MoazenInkPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Icon(
                    imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = MoazenInkMuted
                )
            }

            AnimatedVisibility(visible = isExpanded) {
                Column(modifier = Modifier.padding(top = 14.dp)) {
                    HorizontalDivider(color = MoazenCardBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(14.dp))
                    content()
                }
            }
        }
    }
}
