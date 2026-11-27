package com.muslim.azan.ui.screens

import android.Manifest
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.muslim.azan.BootReceiver
import com.muslim.azan.PrayerTimeCalculator
import com.muslim.azan.data.HijriCalendarUtility
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.CityWeatherWidget
import com.muslim.azan.ui.components.MoazenSubWidgetBox
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrayerTimesScreen(
    prefs: NativePreferences,
    language: String = prefs.language,
    onBack: () -> Unit,
    onOpenPrayerSettings: (String) -> Unit = {},
    onOpenMasajid: () -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val isEnglish = language == "en"

    var cityName by remember { mutableStateOf(prefs.cityName) }
    var lat by remember { mutableDoubleStateOf(prefs.latitude) }
    var lng by remember { mutableDoubleStateOf(prefs.longitude) }
    var cityTimezoneId by remember { mutableStateOf(prefs.cityTimezoneId) }
    var calcMethod by remember { mutableStateOf(prefs.calculationMethod) }
    var asrMethod by remember { mutableStateOf(prefs.asrMethod) }

    var fajrOff by remember { mutableIntStateOf(prefs.fajrOffsetMinutes) }
    var sunriseOff by remember { mutableIntStateOf(prefs.sunriseOffsetMinutes) }
    var duhaOff by remember { mutableIntStateOf(prefs.duhaOffsetMinutes) }
    var dhuhrOff by remember { mutableIntStateOf(prefs.dhuhrOffsetMinutes) }
    var asrOff by remember { mutableIntStateOf(prefs.asrOffsetMinutes) }
    var maghribOff by remember { mutableIntStateOf(prefs.maghribOffsetMinutes) }
    var ishaOff by remember { mutableIntStateOf(prefs.ishaOffsetMinutes) }
    var highLatRule by remember { mutableStateOf(prefs.highLatitudeRule) }
    var isDetectingGps by remember { mutableStateOf(false) }
    var gpsDetail by remember { mutableStateOf<String?>(null) }

    var refreshTick by remember { mutableIntStateOf(0) }
    var nowEpochMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var hasLocationPermission by remember {
        mutableStateOf(SystemPermissionHelper.checkPermissions(context).locationGranted)
    }

    LaunchedEffect(Unit) {
        while (true) {
            delay(30_000L)
            nowEpochMs = System.currentTimeMillis()
        }
    }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                refreshTick++
                nowEpochMs = System.currentTimeMillis()
                hasLocationPermission = SystemPermissionHelper.checkPermissions(context).locationGranted
                cityName = prefs.cityName
                lat = prefs.latitude
                lng = prefs.longitude
                cityTimezoneId = prefs.cityTimezoneId
                calcMethod = prefs.calculationMethod
                asrMethod = prefs.asrMethod
                highLatRule = prefs.highLatitudeRule
                fajrOff = prefs.fajrOffsetMinutes
                sunriseOff = prefs.sunriseOffsetMinutes
                duhaOff = prefs.duhaOffsetMinutes
                dhuhrOff = prefs.dhuhrOffsetMinutes
                asrOff = prefs.asrOffsetMinutes
                maghribOff = prefs.maghribOffsetMinutes
                ishaOff = prefs.ishaOffsetMinutes
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val cal = remember(cityTimezoneId, nowEpochMs / 30_000L, refreshTick) {
        val tz = if (cityTimezoneId.isNotEmpty()) TimeZone.getTimeZone(cityTimezoneId) else TimeZone.getDefault()
        Calendar.getInstance(tz).apply { timeInMillis = nowEpochMs }
    }
    val dateSnapshot = remember(cal.get(Calendar.YEAR), cal.get(Calendar.DAY_OF_YEAR), cityTimezoneId, refreshTick) {
        HijriCalendarUtility.calculateFromEpochMs(cal.timeInMillis, cityTimezoneId)
    }
    val tzOffsetHours = remember(cityTimezoneId, lng, cal.get(Calendar.DAY_OF_YEAR), refreshTick) {
        PrayerTimeCalculator.resolveTimezoneOffsetHours(cityTimezoneId, cal.timeInMillis, lng)
    }

    val times = remember(lat, lng, cityTimezoneId, calcMethod, asrMethod, highLatRule, tzOffsetHours, fajrOff, sunriseOff, duhaOff, dhuhrOff, asrOff, maghribOff, ishaOff, cal.get(Calendar.DAY_OF_YEAR)) {
        PrayerTimeCalculator.calculateDailyPrayers(
            cal,
            lat,
            lng,
            tzOffsetHours,
            calcMethod,
            asrMethod,
            highLatRule
        ).withOffsets(fajrOff, sunriseOff, duhaOff, dhuhrOff, asrOff, maghribOff, ishaOff)
    }

    val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val nextPrayerName = remember(times, currentMinutes) {
        PrayerTimeCalculator.determineNextPrayerName(times, currentMinutes)
    }

    var showCalcMethodDialog by remember { mutableStateOf(false) }

    BackHandler(enabled = showCalcMethodDialog) {
        showCalcMethodDialog = false
    }

    fun triggerGpsDetection() {
        if (!SystemPermissionHelper.isDeviceLocationEnabled(context)) {
            Toast.makeText(context, "يرجى تشغيل خدمة الموقع (GPS) في الهاتف أولًا", Toast.LENGTH_LONG).show()
            SystemPermissionHelper.openLocationSourceSettings(context)
            return
        }
        isDetectingGps = true
        gpsDetail = null
        scope.launch {
            val result = SystemPermissionHelper.detectAndSaveGpsLocation(context, prefs)
            isDetectingGps = false
            result.onSuccess { gps ->
                cityName = gps.cityName
                lat = gps.latitude
                lng = gps.longitude
                cityTimezoneId = gps.timezoneId
                calcMethod = prefs.calculationMethod
                val accText = if (gps.accuracyMeters > 0) " • دقة ±${gps.accuracyMeters}م" else ""
                gpsDetail = String.format(Locale.US, "%.4f°, %.4f°%s", gps.latitude, gps.longitude, accText)
                scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                Toast.makeText(context, "تم تحديد الموقع: ${gps.cityName}", Toast.LENGTH_SHORT).show()
            }.onFailure { err ->
                Toast.makeText(context, err.message ?: "تعذر تحديد الموقع عبر GPS", Toast.LENGTH_LONG).show()
            }
        }
    }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        hasLocationPermission = granted
        if (granted) {
            triggerGpsDetection()
        } else {
            Toast.makeText(context, "يرجى السماح بصلاحية الموقع لتحديد الإحداثيات تلقائيًا", Toast.LENGTH_SHORT).show()
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MuslimPlusCanvasBrush)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header
        item {
            MoazenWidgetCard(
                cornerRadius = 18.dp,
                borderColor = MoazenCardBorder,
                elevation = 4.dp,
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
                            Icon(
                                imageVector = if (isEnglish) Icons.Default.ArrowBack else Icons.Default.ArrowForward,
                                contentDescription = if (isEnglish) "Back" else "رجوع",
                                tint = MoazenInkEmerald
                            )
                        }
                        Text(
                            text = if (isEnglish) "Accurate Prayer Times" else "مواقيت الصلاة الدقيقة",
                            color = MoazenInkEmerald,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    TextButton(onClick = onOpenMasajid) {
                        Icon(Icons.Default.Mosque, contentDescription = null, tint = MoazenGoldDark, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (isEnglish) "Mosques" else "المساجد", color = MoazenInkEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Hijri & Gregorian Calendar Card
        item {
            MoazenWidgetCard(
                cornerRadius = 18.dp,
                borderColor = MoazenCardBorder,
                elevation = 4.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("hijri_gregorian_date_card")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CalendarMonth,
                        contentDescription = null,
                        tint = MoazenGoldDark,
                        modifier = Modifier.size(24.dp)
                    )
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Text(
                            text = if (isEnglish) dateSnapshot.hijriFormattedEn else dateSnapshot.hijriFormattedAr,
                            color = MoazenInkEmerald,
                            fontSize = 14.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (isEnglish) dateSnapshot.gregorianFormattedEn else dateSnapshot.gregorianFormattedAr,
                            color = MoazenInkMuted,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }

        // Current City & Local Weather Widget
        item {
            CityWeatherWidget(
                cityName = cityName,
                latitude = lat,
                longitude = lng,
                hasLocationPermission = hasLocationPermission,
                language = language,
                isDetectingGps = isDetectingGps,
                onRequestLocationOrRefresh = {
                    if (SystemPermissionHelper.checkPermissions(context).locationGranted) {
                        triggerGpsDetection()
                    } else {
                        locationPermissionLauncher.launch(
                            arrayOf(
                                Manifest.permission.ACCESS_FINE_LOCATION,
                                Manifest.permission.ACCESS_COARSE_LOCATION
                            )
                        )
                    }
                }
            )
        }

        // Location & Next prayer highlight
        item {
            MoazenWidgetCard(
                cornerRadius = 20.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = cityName,
                        color = MoazenInkEmerald,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (isEnglish) "Next Prayer: $nextPrayerName" else "الصلاة القادمة: صلاة $nextPrayerName",
                        color = MoazenInkPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    if (gpsDetail != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = gpsDetail ?: "",
                            color = MoazenInkEmerald,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = {
                            if (SystemPermissionHelper.checkPermissions(context).locationGranted) {
                                triggerGpsDetection()
                            } else {
                                locationPermissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        },
                        enabled = !isDetectingGps,
                        colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.MyLocation,
                            contentDescription = null,
                            tint = GoldLight,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isDetectingGps) {
                                if (isEnglish) "Detecting GPS..." else "جاري التقاط موقعك الدقيق..."
                            } else {
                                if (isEnglish) "Update Location via GPS" else "تحديث موقعي الدقيق بالـ GPS"
                            },
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Daily Prayers List (including صلاة الضحى + tap any row to open Advanced Prayer Settings)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                PrayerRowItem("الفجر", PrayerTimeCalculator.formatMinutesToHHmm(times.fajrMinutes), nextPrayerName == "الفجر") {
                    onOpenPrayerSettings("fajr")
                }
                PrayerRowItem("الشروق", PrayerTimeCalculator.formatMinutesToHHmm(times.sunriseMinutes), false) {
                    onOpenPrayerSettings("sunrise")
                }
                PrayerRowItem("صلاة الضحى", PrayerTimeCalculator.formatMinutesToHHmm(times.duhaMinutes), false) {
                    onOpenPrayerSettings("duha")
                }
                PrayerRowItem("الظهر", PrayerTimeCalculator.formatMinutesToHHmm(times.dhuhrMinutes), nextPrayerName == "الظهر") {
                    onOpenPrayerSettings("dhuhr")
                }
                PrayerRowItem("العصر", PrayerTimeCalculator.formatMinutesToHHmm(times.asrMinutes), nextPrayerName == "العصر") {
                    onOpenPrayerSettings("asr")
                }
                PrayerRowItem("المغرب", PrayerTimeCalculator.formatMinutesToHHmm(times.maghribMinutes), nextPrayerName == "المغرب") {
                    onOpenPrayerSettings("maghrib")
                }
                PrayerRowItem("العشاء", PrayerTimeCalculator.formatMinutesToHHmm(times.ishaMinutes), nextPrayerName == "العشاء") {
                    onOpenPrayerSettings("isha")
                }
            }
        }

        // Calculation Settings
        item {
            MoazenWidgetCard(
                cornerRadius = 16.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "طريقة الحساب الفلكي والمذهب",
                        color = MoazenInkEmerald,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    MoazenSubWidgetBox(
                        cornerRadius = 10.dp,
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { showCalcMethodDialog = true }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = when (calcMethod) {
                                    "umm_al_qura" -> "توقيت أم القرى (مكة المكرمة)"
                                    "egypt" -> "الهيئة المصرية العامة للمساحة"
                                    "mwl" -> "رابطة العالم الإسلامي"
                                    "dubai" -> "دبي والإمارات والخليج"
                                    "uoif" -> "اتحاد المنظمات الإسلامية بفرنسا (UOIF 12°)"
                                    "karachi" -> "جامعة العلوم الإسلامية بكراتشي"
                                    "isna" -> "الجمعية الإسلامية لأمريكا الشمالية (ISNA)"
                                    "kuwait" -> "وزارة الأوقاف الكويتية"
                                    "qatar" -> "وزارة الأوقاف والشؤون الإسلامية بقطر"
                                    "diyanet" -> "رئاسة الشؤون الدينية التركية (Diyanet)"
                                    else -> "أم القرى (مكة المكرمة)"
                                },
                                color = MoazenInkPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Icon(Icons.Default.ExpandMore, contentDescription = null, tint = MoazenInkEmerald)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(text = "مذهب حساب صلاة العصر:", color = MoazenInkMuted, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = asrMethod == "standard",
                            onClick = {
                                asrMethod = "standard"
                                prefs.asrMethod = "standard"
                                scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                            },
                            label = { Text("الجمهور (شافعي/مالكي/حنبلي)", fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                containerColor = MoazenChipUnselectedBg,
                                labelColor = MoazenInkPrimary,
                                selectedContainerColor = MuslimPlusPillEmerald,
                                selectedLabelColor = Color.White
                            )
                        )
                        FilterChip(
                            selected = asrMethod == "hanafi",
                            onClick = {
                                asrMethod = "hanafi"
                                prefs.asrMethod = "hanafi"
                                scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                            },
                            label = { Text("حنفي", fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                containerColor = MoazenChipUnselectedBg,
                                labelColor = MoazenInkPrimary,
                                selectedContainerColor = MuslimPlusPillEmerald,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }
        }

        // Manual Minute Offsets Card
        item {
            MoazenWidgetCard(
                cornerRadius = 16.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Tune, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "تعديل الدقائق يدويًا (حسب مسجدك)",
                                color = MoazenInkEmerald,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        if (fajrOff != 0 || dhuhrOff != 0 || asrOff != 0 || maghribOff != 0 || ishaOff != 0) {
                            TextButton(
                                onClick = {
                                    fajrOff = 0; prefs.fajrOffsetMinutes = 0
                                    dhuhrOff = 0; prefs.dhuhrOffsetMinutes = 0
                                    asrOff = 0; prefs.asrOffsetMinutes = 0
                                    maghribOff = 0; prefs.maghribOffsetMinutes = 0
                                    ishaOff = 0; prefs.ishaOffsetMinutes = 0
                                    scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                                }
                            ) {
                                Text("إعادة ضبط", color = MoazenGoldDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    PrayerOffsetControl("الفجر", fajrOff) { newVal ->
                        fajrOff = newVal
                        prefs.fajrOffsetMinutes = newVal
                        scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                    }
                    PrayerOffsetControl("الظهر", dhuhrOff) { newVal ->
                        dhuhrOff = newVal
                        prefs.dhuhrOffsetMinutes = newVal
                        scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                    }
                    PrayerOffsetControl("العصر", asrOff) { newVal ->
                        asrOff = newVal
                        prefs.asrOffsetMinutes = newVal
                        scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                    }
                    PrayerOffsetControl("المغرب", maghribOff) { newVal ->
                        maghribOff = newVal
                        prefs.maghribOffsetMinutes = newVal
                        scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                    }
                    PrayerOffsetControl("العشاء", ishaOff) { newVal ->
                        ishaOff = newVal
                        prefs.ishaOffsetMinutes = newVal
                        scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                    }
                }
            }
        }
    }

    if (showCalcMethodDialog) {
        AlertDialog(
            onDismissRequest = { showCalcMethodDialog = false },
            title = { Text("اختر طريقة الحساب", color = MoazenInkPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val methods = listOf(
                        "egypt" to "الهيئة العامة المصرية للمساحة",
                        "umm_al_qura" to "توقيت أم القرى (مكة المكرمة)",
                        "mwl" to "رابطة العالم الإسلامي",
                        "dubai" to "دبي والإمارات والخليج",
                        "uoif" to "اتحاد المنظمات الإسلامية بفرنسا (UOIF 12°)",
                        "karachi" to "جامعة العلوم الإسلامية بكراتشي",
                        "isna" to "الجمعية الإسلامية لأمريكا الشمالية (ISNA)",
                        "kuwait" to "وزارة الأوقاف الكويتية",
                        "qatar" to "أوقاف قطر",
                        "diyanet" to "رئاسة الشؤون الدينية التركية (Diyanet)"
                    )
                    methods.forEach { (key, name) ->
                        val isSelected = calcMethod == key
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSelected) MuslimPlusPillEmerald else MoazenChipUnselectedBg)
                                .clickable {
                                    calcMethod = key
                                    prefs.setCalculationMethodManually(key)
                                    showCalcMethodDialog = false
                                    scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                                }
                                .padding(12.dp)
                        ) {
                            Text(
                                text = name,
                                color = if (isSelected) Color.White else MoazenInkPrimary,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            },
            confirmButton = {},
            containerColor = MoazenCardEnd
        )
    }
}

@Composable
private fun PrayerOffsetControl(
    label: String,
    offsetMinutes: Int,
    onChange: (Int) -> Unit
) {
    MoazenSubWidgetBox(
        cornerRadius = 10.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = label, color = MoazenInkPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = { if (offsetMinutes > -30) onChange(offsetMinutes - 1) },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(Icons.Default.Remove, contentDescription = "إنقاص دقيقة", tint = MoazenInkEmerald, modifier = Modifier.size(18.dp))
                }
                Text(
                    text = when {
                        offsetMinutes > 0 -> "+$offsetMinutes د"
                        offsetMinutes < 0 -> "$offsetMinutes د"
                        else -> "0 د"
                    },
                    color = if (offsetMinutes == 0) MoazenInkMuted else MoazenGoldDark,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
                IconButton(
                    onClick = { if (offsetMinutes < 30) onChange(offsetMinutes + 1) },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "زيادة دقيقة", tint = MoazenInkEmerald, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

@Composable
fun PrayerRowItem(name: String, time: String, isNext: Boolean, onClick: () -> Unit = {}) {
    MoazenWidgetCard(
        cornerRadius = 14.dp,
        borderColor = if (isNext) MoazenGoldDark else MoazenCardBorder,
        borderWidth = if (isNext) 1.5.dp else 1.dp,
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.AccessTime,
                    contentDescription = null,
                    tint = if (isNext) MoazenInkEmerald else MoazenInkMuted,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = name,
                    color = if (isNext) MoazenInkEmerald else MoazenInkPrimary,
                    fontSize = 15.sp,
                    fontWeight = if (isNext) FontWeight.Bold else FontWeight.SemiBold
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = time,
                    color = if (isNext) MoazenInkEmerald else MoazenInkPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    imageVector = Icons.Default.Tune,
                    contentDescription = "إعدادات $name",
                    tint = MoazenGoldDark,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
