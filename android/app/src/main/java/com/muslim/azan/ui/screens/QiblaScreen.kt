package com.muslim.azan.ui.screens

import android.Manifest
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.BootReceiver
import com.muslim.azan.R
import com.muslim.azan.data.LocationPrecision
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.service.NativeLocationAndCompassManager
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Locale
import kotlin.math.abs

@Composable
fun QiblaScreen(
    prefs: NativePreferences,
    language: String = prefs.language,
    onBack: () -> Unit
) {
    val isEnglish = language == "en"
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var currentCityName by remember { mutableStateOf(prefs.cityName) }
    var currentSource by remember { mutableStateOf(prefs.activeLocationSource) }
    var currentPrecision by remember { mutableStateOf(prefs.activeLocationPrecision) }
    var currentAccuracyMeters by remember { mutableIntStateOf(prefs.activeLocationAccuracyMeters) }
    var isRefreshingGps by remember { mutableStateOf(false) }

    val compassManager = remember {
        NativeLocationAndCompassManager(context).apply {
            updateKaabaBearing(prefs.latitude, prefs.longitude)
        }
    }

    fun performGpsRefresh() {
        if (isRefreshingGps) return
        isRefreshingGps = true
        scope.launch {
            val result = SystemPermissionHelper.detectAndSaveGpsLocation(context, prefs, autoSave = true)
            isRefreshingGps = false
            result.onSuccess { gps ->
                currentCityName = gps.cityName
                currentSource = "gps"
                currentPrecision = if (gps.isPreciseLocation) LocationPrecision.PRECISE.code else LocationPrecision.APPROXIMATE.code
                currentAccuracyMeters = gps.accuracyMeters
                compassManager.updateKaabaBearing(gps.latitude, gps.longitude)
                launch(Dispatchers.IO) {
                    BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                }
                Toast.makeText(context, "تم تحديث اتجاه القبلة لموقعك (${gps.cityName})", Toast.LENGTH_SHORT).show()
            }.onFailure { err ->
                Toast.makeText(
                    context,
                    err.message ?: "تعذر تحديث GPS — تم الإبقاء على ${currentCityName}",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    val gpsPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            performGpsRefresh()
        } else {
            Toast.makeText(
                context,
                "تم رفض إذن الموقع — تم الإبقاء على ${currentCityName} لحساب القبلة",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    DisposableEffect(Unit) {
        compassManager.startCompass()
        onDispose {
            compassManager.stopCompass()
        }
    }

    val azimuth by compassManager.azimuthDegrees.collectAsState()
    val qiblaBearing by compassManager.qiblaBearingDegrees.collectAsState()

    // Difference between device azimuth and Qibla angle
    val diff = (qiblaBearing - azimuth + 360f) % 360f
    val isAligned = abs(diff) < 5f || abs(diff - 360f) < 5f

    val animatedRotation by animateFloatAsState(targetValue = -azimuth, label = "compassRotation")

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MuslimPlusCanvasBrush)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            MoazenWidgetCard(
                cornerRadius = 18.dp,
                borderColor = MoazenCardBorder,
                elevation = 3.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.Default.ArrowForward,
                            contentDescription = if (isEnglish) "Back" else "رجوع",
                            tint = MoazenInkEmerald
                        )
                    }
                    Text(
                        text = if (isEnglish) "Qibla Compass" else "بوصلة القبلة الشريفة",
                        color = MoazenInkEmerald,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

        Spacer(modifier = Modifier.height(16.dp))

        MoazenWidgetCard(
            cornerRadius = 14.dp,
            borderColor = if (isAligned) MoazenGold else MoazenCardBorder,
            elevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = if (isAligned) {
                    if (isEnglish) "You are facing the Holy Kaaba directly ✓" else "أنت تواجه الكعبة المشرفة الآن مباشرةً ✓"
                } else {
                    if (isEnglish) "Rotate your phone until the gold pointer aligns with the top" else "قم بتدوير الهاتف حتى يتطابق المؤشر الذهبي مع الأعلى"
                },
                color = if (isAligned) MoazenInkEmerald else MoazenInkPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Compass Visualizer (Warm Cream Dial + 3D Metallic Gold Ring)
        Box(
            modifier = Modifier
                .size(274.dp)
                .shadow(10.dp, CircleShape, clip = false)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0xFFFFFDF7), Color(0xFFFBF4E0), Color(0xFFEDE0BE))
                    )
                )
                .border(3.dp, RafeeqGoldBevelBrush, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val radius = size.minDimension / 2f - 18f

                // Inner fine emerald ring
                drawCircle(
                    color = MoazenInkEmerald.copy(alpha = 0.22f),
                    radius = radius - 6f,
                    center = center,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f)
                )

                // Draw dial marks
                for (angle in 0 until 360 step 15) {
                    val isMajor = angle % 30 == 0
                    rotate(angle.toFloat(), center) {
                        drawLine(
                            color = if (isMajor) MoazenGoldDark.copy(alpha = 0.85f) else MoazenInkEmerald.copy(alpha = 0.35f),
                            start = Offset(center.x, center.y - radius),
                            end = Offset(center.x, center.y - radius + if (isMajor) 16f else 9f),
                            strokeWidth = if (isMajor) 3.2f else 1.8f
                        )
                    }
                }

                // Draw Compass Needle pointing towards Qibla
                rotate(animatedRotation + qiblaBearing, center) {
                    drawLine(
                        color = MoazenInkEmerald,
                        start = center,
                        end = Offset(center.x, center.y - radius + 24f),
                        strokeWidth = 7f
                    )
                    drawCircle(
                        color = MoazenGoldDark,
                        radius = 13f,
                        center = Offset(center.x, center.y - radius + 24f)
                    )
                    drawCircle(
                        color = MoazenGold,
                        radius = 7f,
                        center = Offset(center.x, center.y - radius + 24f)
                    )
                }

                // Center hub
                drawCircle(
                    color = Color(0xFFFFFDF7),
                    radius = 24f,
                    center = center
                )
                drawCircle(
                    color = MoazenGoldDark.copy(alpha = 0.65f),
                    radius = 24f,
                    center = center,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f)
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "${qiblaBearing.toInt()}°",
                    color = MoazenInkEmerald,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = if (isEnglish) "Qibla Direction" else "اتجاه القبلة",
                    color = MoazenInkMuted,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        val precisionBadgeText = when {
            currentPrecision == LocationPrecision.PRECISE.code -> {
                val acc = if (currentAccuracyMeters > 0) " (±${currentAccuracyMeters}م)" else ""
                "موقع دقيق GPS$acc"
            }
            currentPrecision == LocationPrecision.APPROXIMATE.code -> "موقع تقريبي"
            currentSource == "saved_gps" -> "موقع محفوظ"
            else -> "موقع يدوي / من القائمة"
        }

        MoazenWidgetCard(cornerRadius = 14.dp, modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = currentCityName,
                        color = MoazenInkPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f)
                    )
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MoazenInkEmerald.copy(alpha = 0.1f)
                    ) {
                        Text(
                            text = precisionBadgeText,
                            color = MoazenInkEmerald,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }

                OutlinedButton(
                    onClick = {
                        val st = SystemPermissionHelper.checkPermissions(context)
                        if (st.locationGranted) {
                            performGpsRefresh()
                        } else {
                            gpsPermissionLauncher.launch(
                                arrayOf(
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION
                                )
                            )
                        }
                    },
                    enabled = !isRefreshingGps,
                    border = BorderStroke(1.dp, MoazenInkEmerald),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isRefreshingGps) {
                        CircularProgressIndicator(
                            color = MoazenInkEmerald,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(16.dp)
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.MyLocation,
                            contentDescription = null,
                            tint = MoazenInkEmerald,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isRefreshingGps) {
                            if (isEnglish) "Updating precise GPS location..." else "جاري تحديث الموقع الدقيق..."
                        } else {
                            if (isEnglish) "Update My Location via GPS" else "تحديث موقعي عبر GPS"
                        },
                        color = MoazenInkEmerald,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
    }
}
