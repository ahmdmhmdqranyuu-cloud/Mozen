package com.muslim.azan.ui.screens

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.R
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard

@Composable
fun TasbihScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val vibrator = remember {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    val dhikrList = listOf(
        "سُبْحَانَ اللَّهِ",
        "الْحَمْدُ لِلَّهِ",
        "لَا إِلَهَ إِلَّا اللَّهُ",
        "اللَّهُ أَكْبَرُ",
        "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
        "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ"
    )

    var selectedDhikrIndex by remember { mutableStateOf(0) }
    var currentCount by remember { mutableStateOf(0) }
    var targetCount by remember { mutableStateOf(33) }
    var lifetimeCount by remember { mutableStateOf(prefs.totalTasbihCount) }

    fun triggerVibration() {
        runCatching {
            if (vibrator?.hasVibrator() == true) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(35, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(35)
                }
            }
        }
    }

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
                text = "المسبحة الإلكترونية الذكية",
                color = TextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Dhikr selector chip
        MoazenWidgetCard(
            cornerRadius = 16.dp,
            onClick = {
                selectedDhikrIndex = (selectedDhikrIndex + 1) % dhikrList.size
                currentCount = 0
            }
        ) {
            Text(
                text = dhikrList[selectedDhikrIndex],
                color = MoazenInkEmerald,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 14.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Target count selector
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(33, 99, 100).forEach { target ->
                FilterChip(
                    selected = targetCount == target,
                    onClick = {
                        targetCount = target
                        currentCount = 0
                    },
                    label = { Text("$target تسبيحة") },
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = MoazenCardStart,
                        labelColor = MoazenInkPrimary,
                        selectedContainerColor = MoazenInkEmerald,
                        selectedLabelColor = Color.White
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Big Circular Tasbih Button
        Box(
            modifier = Modifier
                .size(240.dp)
                .clip(CircleShape)
                .background(Brush.linearGradient(colors = listOf(MoazenCardStart, MoazenCardEnd)))
                .border(2.dp, MoazenGold.copy(alpha = 0.55f), CircleShape)
                .clickable {
                    triggerVibration()
                    currentCount++
                    lifetimeCount++
                    prefs.totalTasbihCount = lifetimeCount
                },
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.img_hadith_mosque),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                alpha = 0.09f,
                modifier = Modifier.matchParentSize()
            )
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = currentCount.toString(),
                    color = MoazenInkEmerald,
                    fontSize = 52.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "من $targetCount",
                    color = MoazenInkMuted,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "المس للتسبيح",
                    color = MoazenGoldDark,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Reset current count
            MoazenWidgetCard(
                cornerRadius = 14.dp,
                onClick = { currentCount = 0 }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "تصفير الدورة", color = MoazenInkPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            // Total Lifetime Tasbihs
            MoazenWidgetCard(cornerRadius = 14.dp) {
                Column(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(text = "إجمالي التسبيحات", color = MoazenInkMuted, fontSize = 11.sp)
                    Text(text = lifetimeCount.toString(), color = MoazenInkEmerald, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
