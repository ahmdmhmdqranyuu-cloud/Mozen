package com.muslim.azan.ui.screens

import android.Manifest
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.BootReceiver
import com.muslim.azan.PrayerTimeCalculator
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrayerTimesScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var cityName by remember { mutableStateOf(prefs.cityName) }
    var lat by remember { mutableDoubleStateOf(prefs.latitude) }
    var lng by remember { mutableDoubleStateOf(prefs.longitude) }
    var cityTimezoneId by remember { mutableStateOf(prefs.cityTimezoneId) }
    var calcMethod by remember { mutableStateOf(prefs.calculationMethod) }
    var asrMethod by remember { mutableStateOf(prefs.asrMethod) }

    var fajrOff by remember { mutableIntStateOf(prefs.fajrOffsetMinutes) }
    var dhuhrOff by remember { mutableIntStateOf(prefs.dhuhrOffsetMinutes) }
    var asrOff by remember { mutableIntStateOf(prefs.asrOffsetMinutes) }
    var maghribOff by remember { mutableIntStateOf(prefs.maghribOffsetMinutes) }
    var ishaOff by remember { mutableIntStateOf(prefs.ishaOffsetMinutes) }
    var isDetectingGps by remember { mutableStateOf(false) }

    val cal = remember(cityTimezoneId) {
        val tz = if (cityTimezoneId.isNotEmpty()) TimeZone.getTimeZone(cityTimezoneId) else TimeZone.getDefault()
        Calendar.getInstance(tz)
    }
    val tzOffsetHours = remember(cityTimezoneId) {
        PrayerTimeCalculator.resolveTimezoneOffsetHours(cityTimezoneId, cal.timeInMillis)
    }

    val times = remember(lat, lng, cityTimezoneId, calcMethod, asrMethod, fajrOff, dhuhrOff, asrOff, maghribOff, ishaOff) {
        PrayerTimeCalculator.calculateDailyPrayers(
            cal,
            lat,
            lng,
            tzOffsetHours,
            calcMethod,
            asrMethod
        ).withOffsets(fajrOff, dhuhrOff, asrOff, maghribOff, ishaOff)
    }

    val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val nextPrayerName = remember(times, currentMinutes) {
        PrayerTimeCalculator.determineNextPrayerName(times, currentMinutes)
    }

    var showCalcMethodDialog by remember { mutableStateOf(false) }

    fun triggerGpsDetection() {
        isDetectingGps = true
        scope.launch {
            val result = SystemPermissionHelper.detectAndSaveGpsLocation(context, prefs)
            isDetectingGps = false
            result.onSuccess { detectedName ->
                cityName = prefs.cityName
                lat = prefs.latitude
                lng = prefs.longitude
                cityTimezoneId = prefs.cityTimezoneId
                scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
                Toast.makeText(context, "تم تحديد الموقع: $detectedName", Toast.LENGTH_SHORT).show()
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
        if (granted) {
            triggerGpsDetection()
        } else {
            Toast.makeText(context, "يرجى السماح بصلاحية الموقع لتحديد الإحداثيات تلقائيًا", Toast.LENGTH_SHORT).show()
        }
    }

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
                        text = cityName,
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
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.MyLocation,
                            contentDescription = null,
                            tint = GoldAccent,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isDetectingGps) "جاري التحديد بالـ GPS..." else "تحديث موقعي التلقائي بالـ GPS",
                            color = TextPrimary,
                            fontSize = 12.sp
                        )
                    }
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

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(text = "مذهب حساب صلاة العصر:", color = TextSecondary, fontSize = 13.sp)
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
                                selectedContainerColor = GoldDark,
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
                                selectedContainerColor = GoldDark,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }
        }

        // Manual Minute Offsets Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
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
                            Icon(Icons.Default.Tune, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "تعديل الدقائق يدويًا (حسب مسجدك)",
                                color = GoldAccent,
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
                                Text("إعادة ضبط", color = GoldLight, fontSize = 12.sp)
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
                                    scope.launch(Dispatchers.IO) { BootReceiver.recalculateAndScheduleAll(context.applicationContext) }
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
private fun PrayerOffsetControl(
    label: String,
    offsetMinutes: Int,
    onChange: (Int) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(EmeraldSurfaceLight)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(
                onClick = { if (offsetMinutes > -30) onChange(offsetMinutes - 1) },
                modifier = Modifier.size(32.dp)
            ) {
                Icon(Icons.Default.Remove, contentDescription = "إنقاص دقيقة", tint = GoldAccent, modifier = Modifier.size(18.dp))
            }
            Text(
                text = when {
                    offsetMinutes > 0 -> "+$offsetMinutes د"
                    offsetMinutes < 0 -> "$offsetMinutes د"
                    else -> "0 د"
                },
                color = if (offsetMinutes == 0) TextSecondary else GoldAccent,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
            IconButton(
                onClick = { if (offsetMinutes < 30) onChange(offsetMinutes + 1) },
                modifier = Modifier.size(32.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "زيادة دقيقة", tint = GoldAccent, modifier = Modifier.size(18.dp))
            }
        }
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
