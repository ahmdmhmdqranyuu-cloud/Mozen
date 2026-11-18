package com.muslim.azan.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccessTime
import androidx.compose.material.icons.rounded.Explore
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.NightsStay
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.AutoCenteringParams
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Card
import androidx.wear.compose.material.CardDefaults
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.Colors
import androidx.wear.compose.material.Icon
import androidx.wear.compose.material.ListHeader
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.PositionIndicator
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import androidx.wear.compose.material.Vignette
import androidx.wear.compose.material.VignettePosition
import com.muslim.azan.wear.calc.AsrMethod
import com.muslim.azan.wear.calc.DstMode
import com.muslim.azan.wear.calc.HighLatitudeRule
import com.muslim.azan.wear.calc.PrayerKey
import com.muslim.azan.wear.calc.WearCityLocation
import com.muslim.azan.wear.calc.WearPrayerTime
import com.muslim.azan.wear.calc.WearPrayerTimesCalculator
import com.muslim.azan.wear.data.WearCities
import com.muslim.azan.wear.data.WearPreferences
import kotlinx.coroutines.delay
import java.util.Calendar
import java.util.Locale

private val WearCanvasDark = Color(0xFF09241C)
private val WearEmeraldSurface = Color(0xFF0C392C)
private val WearEmeraldDeep = Color(0xFF0F4435)
private val WearGoldAccent = Color(0xFFC5A059)
private val WearCreamInk = Color(0xFFF7F4E8)
private val WearMutedMint = Color(0xFF9AC5B7)

private enum class WearScreenMode {
    PRAYERS,
    CITY_PICKER,
    SETTINGS
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = WearPreferences(this)
        setContent {
            val wearColors = Colors(
                primary = WearGoldAccent,
                primaryVariant = WearEmeraldDeep,
                secondary = WearMutedMint,
                secondaryVariant = WearEmeraldSurface,
                background = WearCanvasDark,
                surface = WearEmeraldSurface,
                error = Color(0xFFCF6679),
                onPrimary = WearCanvasDark,
                onSecondary = WearCanvasDark,
                onBackground = WearCreamInk,
                onSurface = WearCreamInk,
                onSurfaceVariant = WearMutedMint,
                onError = Color.Black
            )
            MaterialTheme(colors = wearColors) {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    WearMuslimPlusApp(prefs = prefs)
                }
            }
        }
    }
}

@Composable
private fun WearMuslimPlusApp(prefs: WearPreferences) {
    var screenMode by remember { mutableStateOf(WearScreenMode.PRAYERS) }
    var cityId by remember { mutableStateOf(prefs.cityId) }
    var calcMethodId by remember { mutableStateOf(prefs.calcMethodId) }
    var asrMethod by remember { mutableStateOf(prefs.asrMethod) }
    var highLatRule by remember { mutableStateOf(prefs.highLatitudeRule) }
    var dstMode by remember { mutableStateOf(prefs.dstMode) }
    var nowMs by remember { mutableLongStateOf(System.currentTimeMillis()) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1000L)
            nowMs = System.currentTimeMillis()
        }
    }

    val activeCity = remember(cityId) { WearCities.findById(cityId) }

    val prayers = remember(activeCity, calcMethodId, asrMethod, highLatRule, dstMode, nowMs / 30000L) {
        WearPrayerTimesCalculator.calculatePrayerTimesForInstant(
            city = activeCity,
            instantMs = nowMs,
            methodId = calcMethodId,
            asrMethod = asrMethod,
            dstModeOverride = dstMode,
            highLatitudeRule = highLatRule
        )
    }

    val nextPrayerInfo = remember(prayers, nowMs) {
        WearPrayerTimesCalculator.getNextPrayerInfo(prayers, nowMs)
    }

    val activeIqama = remember(prayers, nowMs) {
        WearPrayerTimesCalculator.getActiveIqamaCountdown(prayers, nowMs = nowMs)
    }

    val qibla = remember(activeCity) {
        WearPrayerTimesCalculator.calculateQiblaDirection(activeCity.latitude, activeCity.longitude)
    }

    val nightThirds = remember(activeCity, calcMethodId, asrMethod, highLatRule, dstMode, nowMs / 60000L) {
        val cal = WearPrayerTimesCalculator.calendarForCity(activeCity, nowMs, dstMode)
        WearPrayerTimesCalculator.calculateNightThirds(
            city = activeCity,
            year = cal.get(Calendar.YEAR),
            month1to12 = cal.get(Calendar.MONTH) + 1,
            day = cal.get(Calendar.DAY_OF_MONTH),
            methodId = calcMethodId,
            asrMethod = asrMethod,
            dstModeOverride = dstMode,
            highLatitudeRule = highLatRule
        )
    }

    when (screenMode) {
        WearScreenMode.PRAYERS -> {
            WearPrayersMainScreen(
                city = activeCity,
                prayers = prayers,
                nextPrayerName = nextPrayerInfo?.nextPrayer?.name ?: "الفجر",
                nextPrayerTime = nextPrayerInfo?.nextPrayer?.time12 ?: "--:--",
                nextPrayerKey = nextPrayerInfo?.nextPrayer?.key ?: PrayerKey.FAJR,
                countdownStr = nextPrayerInfo?.let { "${it.countdownStr}:${it.secondsStr}" } ?: "--:--:--",
                activeIqamaLabel = activeIqama?.let { "إقامة ${it.prayerName}: ${it.countdownStr}" },
                qiblaAngle = qibla.angle,
                qiblaDistanceKm = qibla.distanceKm,
                midnightFormatted = nightThirds.midnightFormatted,
                lastThirdFormatted = nightThirds.lastThirdStartFormatted,
                methodLabel = WearPrayerTimesCalculator.resolveMethod(calcMethodId).shortNameAr,
                onOpenCities = { screenMode = WearScreenMode.CITY_PICKER },
                onOpenSettings = { screenMode = WearScreenMode.SETTINGS }
            )
        }

        WearScreenMode.CITY_PICKER -> {
            WearCityPickerScreen(
                selectedCityId = activeCity.id,
                onSelectCity = { chosen ->
                    cityId = chosen.id
                    prefs.cityId = chosen.id
                    val recommended = WearCities.defaultMethodForCity(chosen.id)
                    calcMethodId = recommended
                    prefs.calcMethodId = recommended
                    screenMode = WearScreenMode.PRAYERS
                },
                onBack = { screenMode = WearScreenMode.PRAYERS }
            )
        }

        WearScreenMode.SETTINGS -> {
            WearSettingsScreen(
                calcMethodId = calcMethodId,
                asrMethod = asrMethod,
                highLatRule = highLatRule,
                dstMode = dstMode,
                onCycleMethod = {
                    val methods = WearPrayerTimesCalculator.CALCULATION_METHODS
                    val curIdx = methods.indexOfFirst { it.id == calcMethodId }.coerceAtLeast(0)
                    val next = methods[(curIdx + 1) % methods.size]
                    calcMethodId = next.id
                    prefs.calcMethodId = next.id
                },
                onToggleAsr = {
                    val next = if (asrMethod == AsrMethod.STANDARD) AsrMethod.HANAFI else AsrMethod.STANDARD
                    asrMethod = next
                    prefs.asrMethod = next
                },
                onCycleHighLat = {
                    val rules = HighLatitudeRule.entries
                    val next = rules[(rules.indexOf(highLatRule) + 1) % rules.size]
                    highLatRule = next
                    prefs.highLatitudeRule = next
                },
                onCycleDst = {
                    val modes = DstMode.entries
                    val next = modes[(modes.indexOf(dstMode) + 1) % modes.size]
                    dstMode = next
                    prefs.dstMode = next
                },
                onBack = { screenMode = WearScreenMode.PRAYERS }
            )
        }
    }
}

@Composable
private fun WearPrayersMainScreen(
    city: WearCityLocation,
    prayers: List<WearPrayerTime>,
    nextPrayerName: String,
    nextPrayerTime: String,
    nextPrayerKey: PrayerKey,
    countdownStr: String,
    activeIqamaLabel: String?,
    qiblaAngle: Int,
    qiblaDistanceKm: Int,
    midnightFormatted: String,
    lastThirdFormatted: String,
    methodLabel: String,
    onOpenCities: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val listState = rememberScalingLazyListState(initialCenterItemIndex = 1)
    Scaffold(
        timeText = { TimeText() },
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) },
        positionIndicator = { PositionIndicator(scalingLazyListState = listState) }
    ) {
        ScalingLazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(WearCanvasDark),
            state = listState,
            contentPadding = PaddingValues(top = 26.dp, bottom = 26.dp, start = 10.dp, end = 10.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
            autoCentering = AutoCenteringParams(itemIndex = 0)
        ) {
            item {
                Text(
                    text = "مسلم بلس • ${city.nameAr}",
                    color = WearGoldAccent,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            item {
                NextPrayerHeroCard(
                    prayerName = nextPrayerName,
                    prayerTime = nextPrayerTime,
                    countdown = countdownStr,
                    activeIqamaLabel = activeIqamaLabel
                )
            }

            items(prayers, key = { it.key.id }) { prayer ->
                PrayerTimeRowCard(
                    prayer = prayer,
                    isNext = prayer.key == nextPrayerKey
                )
            }

            item {
                NightAndQiblaSummaryCard(
                    qiblaAngle = qiblaAngle,
                    qiblaDistanceKm = qiblaDistanceKm,
                    midnightFormatted = midnightFormatted,
                    lastThirdFormatted = lastThirdFormatted
                )
            }

            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = onOpenCities,
                    label = {
                        Text(
                            text = "المدينة: ${city.nameAr}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    },
                    secondaryLabel = {
                        Text(
                            text = city.countryAr,
                            fontSize = 10.sp,
                            maxLines = 1
                        )
                    },
                    icon = {
                        Icon(
                            imageVector = Icons.Rounded.LocationOn,
                            contentDescription = "تغيير المدينة",
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    colors = ChipDefaults.chipColors(
                        backgroundColor = WearEmeraldSurface,
                        contentColor = WearCreamInk,
                        secondaryContentColor = WearMutedMint,
                        iconColor = WearGoldAccent
                    )
                )
            }

            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = onOpenSettings,
                    label = {
                        Text(
                            text = "إعدادات الحساب",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1
                        )
                    },
                    secondaryLabel = {
                        Text(
                            text = methodLabel,
                            fontSize = 10.sp,
                            maxLines = 1
                        )
                    },
                    icon = {
                        Icon(
                            imageVector = Icons.Rounded.Settings,
                            contentDescription = "إعدادات الحساب",
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    colors = ChipDefaults.chipColors(
                        backgroundColor = WearEmeraldSurface,
                        contentColor = WearCreamInk,
                        secondaryContentColor = WearMutedMint,
                        iconColor = WearGoldAccent
                    )
                )
            }
        }
    }
}

@Composable
private fun NextPrayerHeroCard(
    prayerName: String,
    prayerTime: String,
    countdown: String,
    activeIqamaLabel: String?
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(
                Brush.verticalGradient(
                    colors = listOf(WearEmeraldDeep, WearEmeraldSurface)
                )
            )
            .border(1.dp, WearGoldAccent.copy(alpha = 0.65f), RoundedCornerShape(18.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "الصلاة القادمة: $prayerName",
                color = WearGoldAccent,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = prayerTime,
                color = WearCreamInk,
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Rounded.AccessTime,
                    contentDescription = null,
                    tint = WearMutedMint,
                    modifier = Modifier.size(13.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "بعد $countdown",
                    color = WearMutedMint,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
            if (activeIqamaLabel != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(WearGoldAccent.copy(alpha = 0.2f))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = activeIqamaLabel,
                        color = WearGoldAccent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                }
            }
        }
    }
}

@Composable
private fun PrayerTimeRowCard(
    prayer: WearPrayerTime,
    isNext: Boolean
) {
    val bgColor = if (isNext) WearEmeraldDeep else WearEmeraldSurface
    val borderColor = if (isNext) WearGoldAccent else Color.Transparent
    val textColor = when {
        isNext -> WearGoldAccent
        prayer.isPassed -> WearMutedMint.copy(alpha = 0.72f)
        else -> WearCreamInk
    }

    Card(
        onClick = {},
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (isNext) Modifier.border(1.dp, borderColor, RoundedCornerShape(14.dp))
                else Modifier
            ),
        backgroundPainter = CardDefaults.cardBackgroundPainter(
            startBackgroundColor = bgColor,
            endBackgroundColor = bgColor
        ),
        shape = RoundedCornerShape(14.dp),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = prayer.name,
                color = textColor,
                fontSize = 13.sp,
                fontWeight = if (isNext) FontWeight.Bold else FontWeight.Medium
            )
            Text(
                text = prayer.time12,
                color = textColor,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun NightAndQiblaSummaryCard(
    qiblaAngle: Int,
    qiblaDistanceKm: Int,
    midnightFormatted: String,
    lastThirdFormatted: String
) {
    Card(
        onClick = {},
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, WearGoldAccent.copy(alpha = 0.3f), RoundedCornerShape(14.dp)),
        backgroundPainter = CardDefaults.cardBackgroundPainter(
            startBackgroundColor = WearEmeraldSurface,
            endBackgroundColor = WearCanvasDark
        ),
        shape = RoundedCornerShape(14.dp),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Rounded.Explore,
                        contentDescription = null,
                        tint = WearGoldAccent,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "القبلة",
                        color = WearGoldAccent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = String.format(Locale.US, "%d° • %d كم", qiblaAngle, qiblaDistanceKm),
                    color = WearCreamInk,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Rounded.NightsStay,
                        contentDescription = null,
                        tint = WearMutedMint,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "نصف الليل / الثلث الأخير",
                        color = WearMutedMint,
                        fontSize = 10.sp
                    )
                }
            }
            Text(
                text = "$midnightFormatted  |  $lastThirdFormatted",
                color = WearCreamInk,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun WearCityPickerScreen(
    selectedCityId: String,
    onSelectCity: (WearCityLocation) -> Unit,
    onBack: () -> Unit
) {
    val listState = rememberScalingLazyListState()
    Scaffold(
        timeText = { TimeText() },
        positionIndicator = { PositionIndicator(scalingLazyListState = listState) }
    ) {
        ScalingLazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(WearCanvasDark),
            state = listState,
            contentPadding = PaddingValues(top = 24.dp, bottom = 24.dp, start = 10.dp, end = 10.dp),
            verticalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            item {
                ListHeader {
                    Text(
                        text = "اختر المدينة",
                        color = WearGoldAccent,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = onBack,
                    label = { Text("رجوع للمواقيت", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    colors = ChipDefaults.chipColors(
                        backgroundColor = WearGoldAccent,
                        contentColor = WearCanvasDark
                    )
                )
            }

            items(WearCities.ALL, key = { it.id }) { city ->
                val selected = city.id == selectedCityId
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = { onSelectCity(city) },
                    label = {
                        Text(
                            text = city.nameAr,
                            fontSize = 12.sp,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                            maxLines = 1
                        )
                    },
                    secondaryLabel = {
                        Text(
                            text = city.countryAr,
                            fontSize = 10.sp,
                            maxLines = 1
                        )
                    },
                    colors = ChipDefaults.chipColors(
                        backgroundColor = if (selected) WearEmeraldDeep else WearEmeraldSurface,
                        contentColor = if (selected) WearGoldAccent else WearCreamInk,
                        secondaryContentColor = WearMutedMint
                    )
                )
            }
        }
    }
}

@Composable
private fun WearSettingsScreen(
    calcMethodId: String,
    asrMethod: AsrMethod,
    highLatRule: HighLatitudeRule,
    dstMode: DstMode,
    onCycleMethod: () -> Unit,
    onToggleAsr: () -> Unit,
    onCycleHighLat: () -> Unit,
    onCycleDst: () -> Unit,
    onBack: () -> Unit
) {
    val listState = rememberScalingLazyListState()
    val methodSpec = WearPrayerTimesCalculator.resolveMethod(calcMethodId)
    Scaffold(
        timeText = { TimeText() },
        positionIndicator = { PositionIndicator(scalingLazyListState = listState) }
    ) {
        ScalingLazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(WearCanvasDark),
            state = listState,
            contentPadding = PaddingValues(top = 24.dp, bottom = 24.dp, start = 10.dp, end = 10.dp),
            verticalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            item {
                ListHeader {
                    Text(
                        text = "إعدادات المواقيت",
                        color = WearGoldAccent,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = onBack,
                    label = { Text("رجوع للمواقيت", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    colors = ChipDefaults.chipColors(
                        backgroundColor = WearGoldAccent,
                        contentColor = WearCanvasDark
                    )
                )
            }

            item {
                SettingCycleChip(
                    title = "طريقة الحساب",
                    value = methodSpec.shortNameAr,
                    onClick = onCycleMethod
                )
            }

            item {
                SettingCycleChip(
                    title = "مذهب العصر",
                    value = asrMethod.labelAr,
                    onClick = onToggleAsr
                )
            }

            item {
                SettingCycleChip(
                    title = "التوقيت الصيفي",
                    value = dstMode.labelAr,
                    onClick = onCycleDst
                )
            }

            item {
                SettingCycleChip(
                    title = "خطوط العرض العليا",
                    value = highLatRule.labelAr,
                    onClick = onCycleHighLat
                )
            }
        }
    }
}

@Composable
private fun SettingCycleChip(
    title: String,
    value: String,
    onClick: () -> Unit
) {
    Chip(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        label = {
            Text(
                text = title,
                fontSize = 11.sp,
                color = WearMutedMint,
                maxLines = 1
            )
        },
        secondaryLabel = {
            Text(
                text = value,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = WearCreamInk,
                maxLines = 1
            )
        },
        icon = {
            Icon(
                imageVector = Icons.Rounded.Tune,
                contentDescription = title,
                tint = WearGoldAccent,
                modifier = Modifier.size(16.dp)
            )
        },
        colors = ChipDefaults.chipColors(
            backgroundColor = WearEmeraldSurface,
            contentColor = WearCreamInk,
            secondaryContentColor = WearCreamInk,
            iconColor = WearGoldAccent
        )
    )
}
