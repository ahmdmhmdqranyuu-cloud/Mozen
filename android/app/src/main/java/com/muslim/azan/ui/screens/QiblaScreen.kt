package com.muslim.azan.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.R
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.service.NativeLocationAndCompassManager
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlin.math.abs

@Composable
fun QiblaScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    BackHandler { onBack() }
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
            .background(MuslimPlusCanvasBrush)
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
                    Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = MoazenInkEmerald)
                }
                Text(
                    text = "بوصلة القبلة الشريفة",
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
                text = if (isAligned) "أنت تواجه الكعبة المشرفة الآن مباشرةً ✓" else "قم بتدوير الهاتف حتى يتطابق المؤشر الذهبي مع الأعلى",
                color = if (isAligned) MoazenInkEmerald else MoazenInkPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
            )
        }

        Spacer(modifier = Modifier.height(28.dp))

        // Compass Visualizer (Unified Mint + Mosque Watermark Dial)
        Box(
            modifier = Modifier
                .size(280.dp)
                .clip(CircleShape)
                .background(Brush.linearGradient(colors = listOf(MoazenCardStart, MoazenCardEnd)))
                .border(2.dp, MoazenGold.copy(alpha = 0.55f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.bg_quran_widget_mosque),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                alpha = 0.08f,
                modifier = Modifier.matchParentSize()
            )
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val radius = size.minDimension / 2f - 20f

                // Draw dial marks
                for (angle in 0 until 360 step 30) {
                    rotate(angle.toFloat(), center) {
                        drawLine(
                            color = MoazenInkEmerald.copy(alpha = 0.35f),
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
                        color = MoazenGoldDark,
                        start = center,
                        end = Offset(center.x, center.y - radius + 25f),
                        strokeWidth = 8f
                    )
                    // Needle tip
                    drawCircle(
                        color = MoazenGold,
                        radius = 12f,
                        center = Offset(center.x, center.y - radius + 25f)
                    )
                }

                // Center hub
                drawCircle(
                    color = Color.White.copy(alpha = 0.85f),
                    radius = 22f,
                    center = center
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
                    text = "اتجاه القبلة",
                    color = MoazenInkMuted,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        MoazenWidgetCard(cornerRadius = 14.dp) {
            Text(
                text = "المدينة الحالية: ${prefs.cityName}",
                color = MoazenInkPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp)
            )
        }
    }
}
