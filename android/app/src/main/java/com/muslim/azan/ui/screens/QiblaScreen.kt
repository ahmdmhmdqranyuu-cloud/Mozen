package com.muslim.azan.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.service.NativeLocationAndCompassManager
import com.muslim.azan.theme.*
import kotlin.math.abs

@Composable
fun QiblaScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val compassManager = remember {
        NativeLocationAndCompassManager(context).apply {
            updateKaabaBearing(prefs.latitude, prefs.longitude)
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = TextPrimary)
            }
            Text(
                text = "بوصلة القبلة الشريفة",
                color = TextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = if (isAligned) "أنت تواجه الكعبة المشرفة الآن مباشرةً ✓" else "قم بتدوير الهاتف حتى يتطابق المؤشر الذهبي مع الأعلى",
            color = if (isAligned) EmeraldPrimary else TextSecondary,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium
        )

        Spacer(modifier = Modifier.height(30.dp))

        // Compass Visualizer
        Box(
            modifier = Modifier
                .size(280.dp)
                .clip(CircleShape)
                .background(EmeraldSurface),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val radius = size.minDimension / 2f - 20f

                // Draw dial marks
                for (angle in 0 until 360 step 30) {
                    rotate(angle.toFloat(), center) {
                        drawLine(
                            color = Color(0xFF1F5141),
                            start = Offset(center.x, center.y - radius),
                            end = Offset(center.x, center.y - radius + 15f),
                            strokeWidth = 3f
                        )
                    }
                }

                // Draw Compass Needle pointing towards Qibla
                rotate(animatedRotation + qiblaBearing, center) {
                    // Needle line
                    drawLine(
                        color = GoldAccent,
                        start = center,
                        end = Offset(center.x, center.y - radius + 25f),
                        strokeWidth = 8f
                    )
                    // Needle tip
                    drawCircle(
                        color = GoldLight,
                        radius = 12f,
                        center = Offset(center.x, center.y - radius + 25f)
                    )
                }

                // Center hub
                drawCircle(
                    color = EmeraldSurfaceLight,
                    radius = 20f,
                    center = center
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "${qiblaBearing.toInt()}°",
                    color = GoldAccent,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "اتجاه القبلة",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(30.dp))

        Text(
            text = "المدينة الحالية: ${prefs.cityName}",
            color = TextPrimary,
            fontSize = 14.sp
        )
    }
}
