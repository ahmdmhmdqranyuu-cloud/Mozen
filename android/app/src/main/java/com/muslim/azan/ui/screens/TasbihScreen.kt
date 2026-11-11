package com.muslim.azan.ui.screens

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*

@Composable
fun TasbihScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val vibrator = remember { context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator }

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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createOneShot(35, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(35)
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
        Text(
            text = dhikrList[selectedDhikrIndex],
            color = GoldAccent,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(EmeraldSurface)
                .clickable {
                    selectedDhikrIndex = (selectedDhikrIndex + 1) % dhikrList.size
                    currentCount = 0
                }
                .padding(horizontal = 24.dp, vertical = 14.dp)
        )

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
                        selectedContainerColor = GoldDark,
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
                .background(EmeraldSurfaceLight)
                .clickable {
                    triggerVibration()
                    currentCount++
                    lifetimeCount++
                    prefs.totalTasbihCount = lifetimeCount
                },
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = currentCount.toString(),
                    color = GoldAccent,
                    fontSize = 52.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "من $targetCount",
                    color = TextSecondary,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "المس للتسبيح",
                    color = TextTertiary,
                    fontSize = 12.sp
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
            Button(
                onClick = { currentCount = 0 },
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurface)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null, tint = TextSecondary)
                Spacer(modifier = Modifier.width(6.dp))
                Text(text = "تصفير الدورة", color = TextSecondary)
            }

            // Total Lifetime Tasbihs
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "إجمالي التسبيحات", color = TextSecondary, fontSize = 12.sp)
                Text(text = lifetimeCount.toString(), color = GoldAccent, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
