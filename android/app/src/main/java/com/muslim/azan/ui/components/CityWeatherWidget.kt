package com.muslim.azan.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.CityWeatherCondition
import com.muslim.azan.data.WeatherRepository
import com.muslim.azan.theme.*
import kotlinx.coroutines.launch
import java.util.Locale

/**
 * Compose UI component displaying the user's current city and local weather conditions
 * resolved from existing geolocation permissions/coordinates via WeatherRepository.
 */
@Composable
fun CityWeatherWidget(
    cityName: String,
    latitude: Double,
    longitude: Double,
    hasLocationPermission: Boolean,
    language: String = "ar",
    isDetectingGps: Boolean = false,
    onRequestLocationOrRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isEnglish = language == "en"
    val scope = rememberCoroutineScope()

    var weather by remember(latitude, longitude) {
        mutableStateOf(WeatherRepository.getCached(latitude, longitude))
    }
    var isLoading by remember { mutableStateOf(false) }
    var loadError by remember { mutableStateOf(false) }

    LaunchedEffect(latitude, longitude) {
        loadError = false
        val cached = WeatherRepository.getCached(latitude, longitude)
        if (cached != null) {
            weather = cached
        } else {
            isLoading = true
            WeatherRepository.fetchCurrentWeather(latitude, longitude)
                .onSuccess {
                    weather = it
                    loadError = false
                }
                .onFailure {
                    loadError = true
                }
            isLoading = false
        }
    }

    MoazenWidgetCard(
        cornerRadius = 18.dp,
        borderColor = MoazenCardBorder,
        elevation = 4.dp,
        modifier = modifier
            .fillMaxWidth()
            .testTag("city_weather_widget")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    val icon = weatherIconFor(weather)
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MoazenGold.copy(alpha = 0.22f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = if (weather?.isDay == false) MoazenInkEmerald else MoazenGoldDark,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = ErrorRed,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = cityName,
                                color = MoazenInkEmerald,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Text(
                            text = when {
                                isLoading -> if (isEnglish) "Updating local weather..." else "جاري تحديث حالة الطقس..."
                                weather != null -> {
                                    val cond = if (isEnglish) weather!!.conditionEn else weather!!.conditionAr
                                    val feelsLabel = if (isEnglish) "Feels like" else "المحسوسة"
                                    "$cond • $feelsLabel ${weather!!.apparentCelsius}°C"
                                }
                                loadError -> if (isEnglish) "Weather offline • Tap refresh" else "تعذر تحديث الطقس • اضغط للتحديث"
                                else -> String.format(Locale.US, "%.2f°, %.2f°", latitude, longitude)
                            },
                            color = MoazenInkMuted,
                            fontSize = 11.5.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (weather != null) {
                        Text(
                            text = "${weather!!.temperatureCelsius}°C",
                            color = MoazenInkPrimary,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    } else if (isLoading) {
                        CircularProgressIndicator(
                            color = MoazenInkEmerald,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    IconButton(
                        onClick = {
                            if (isLoading) return@IconButton
                            scope.launch {
                                isLoading = true
                                loadError = false
                                WeatherRepository.fetchCurrentWeather(latitude, longitude, forceRefresh = true)
                                    .onSuccess { weather = it }
                                    .onFailure { loadError = true }
                                isLoading = false
                            }
                        },
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = if (isEnglish) "Refresh weather" else "تحديث الطقس",
                            tint = MoazenInkEmerald,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            if (weather != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    WeatherMetricChip(
                        icon = Icons.Default.WaterDrop,
                        label = if (isEnglish) "Humidity ${weather!!.humidityPercent}%" else "الرطوبة ${weather!!.humidityPercent}%",
                        modifier = Modifier.weight(1f)
                    )
                    WeatherMetricChip(
                        icon = Icons.Default.Air,
                        label = if (isEnglish) "Wind ${weather!!.windSpeedKmh} km/h" else "الرياح ${weather!!.windSpeedKmh} كم/س",
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(10.dp),
                color = if (hasLocationPermission) MuslimPlusBadgeGreen else MoazenSubCardBg,
                border = BorderStroke(1.dp, if (hasLocationPermission) MoazenGold else MoazenCardBorder),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .clickable(enabled = !isDetectingGps, onClick = onRequestLocationOrRefresh)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = if (hasLocationPermission) Icons.Default.MyLocation else Icons.Default.LocationSearching,
                            contentDescription = null,
                            tint = MoazenInkEmerald,
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            text = when {
                                isDetectingGps -> if (isEnglish) "Detecting GPS location..." else "جاري تحديد موقعك عبر GPS..."
                                hasLocationPermission -> if (isEnglish) "GPS enabled • Tap to refresh city & weather" else "صلاحية الموقع مفعّلة • اضغط لتحديث المدينة والطقس"
                                else -> if (isEnglish) "Grant location permission for local weather" else "تفعيل صلاحية الموقع لجلب طقس مدينتك تلقائيًا"
                            },
                            color = MoazenInkPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Icon(
                        imageVector = if (isEnglish) Icons.Default.ChevronRight else Icons.Default.ChevronLeft,
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
private fun WeatherMetricChip(
    icon: ImageVector,
    label: String,
    modifier: Modifier = Modifier
) {
    MoazenSubWidgetBox(
        cornerRadius = 10.dp,
        modifier = modifier
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MoazenInkEmerald,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(5.dp))
            Text(
                text = label,
                color = MoazenInkPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

private fun weatherIconFor(weather: CityWeatherCondition?): ImageVector {
    if (weather == null) return Icons.Default.WbSunny
    return when (weather.weatherCode) {
        0, 1 -> if (weather.isDay) Icons.Default.WbSunny else Icons.Default.NightsStay
        2, 3 -> Icons.Default.Cloud
        45, 48 -> Icons.Default.BlurOn
        51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82 -> Icons.Default.Grain
        71, 73, 75, 77, 85, 86 -> Icons.Default.AcUnit
        95, 96, 99 -> Icons.Default.Thunderstorm
        else -> Icons.Default.WbSunny
    }
}
