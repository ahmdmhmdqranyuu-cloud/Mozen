package com.muslim.azan.ui.screens

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.model.AzkarItem
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*

@Composable
fun AzkarScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val vibrator = remember { context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator }
    var selectedCategoryIndex by remember { mutableStateOf(0) }

    val categories = listOf("أذكار الصباح", "أذكار المساء")
    val items = if (selectedCategoryIndex == 0) NativeDataManager.sampleMorningAzkar else NativeDataManager.sampleEveningAzkar

    // Map to hold current countdown for each zikr
    val countsMap = remember(selectedCategoryIndex) {
        mutableStateMapOf<String, Int>().apply {
            items.forEach { this[it.id] = it.count }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = TextPrimary)
                }
                Text(
                    text = "الأذكار وحصن المسلم",
                    color = TextPrimary,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            // Play Audio for category
            IconButton(
                onClick = {
                    val trackName = if (selectedCategoryIndex == 0) "azkar_sabah.mp3" else "azkar_massa.mp3"
                    val title = if (selectedCategoryIndex == 0) "أذكار الصباح المباركة" else "أذكار المساء المباركة"
                    NativeAudioPlayerManager.playAssetAudio(context, "audio/$trackName", title, "بصوت خاشع")
                }
            ) {
                Icon(
                    imageVector = Icons.Default.VolumeUp,
                    contentDescription = "استماع صوتي",
                    tint = GoldAccent,
                    modifier = Modifier.size(26.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Tabs Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            categories.forEachIndexed { index, cat ->
                val isSelected = selectedCategoryIndex == index
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isSelected) GoldDark else EmeraldSurface)
                        .clickable { selectedCategoryIndex = index }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = cat,
                        color = if (isSelected) Color.White else TextSecondary,
                        fontSize = 13.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items, key = { it.id }) { item ->
                val remaining = countsMap[item.id] ?: item.count
                val isCompleted = remaining == 0

                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = if (isCompleted) EmeraldSurfaceLight else EmeraldSurface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = item.textArabic,
                            color = if (isCompleted) TextSecondary else TextPrimary,
                            fontSize = 16.sp,
                            lineHeight = 28.sp,
                            textAlign = TextAlign.Right,
                            modifier = Modifier.fillMaxWidth()
                        )

                        if (item.fadl.isNotBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "الفضل: ${item.fadl}",
                                color = GoldLight,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Right,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = item.source,
                                color = TextSecondary,
                                fontSize = 11.sp
                            )

                            // Tap Counter Button
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(if (isCompleted) EmeraldPrimaryDark else GoldAccent)
                                    .clickable {
                                        if (remaining > 0) {
                                            countsMap[item.id] = remaining - 1
                                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                                vibrator?.vibrate(VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE))
                                            } else {
                                                @Suppress("DEPRECATION")
                                                vibrator?.vibrate(40)
                                            }
                                        } else {
                                            // Reset
                                            countsMap[item.id] = item.count
                                        }
                                    }
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (isCompleted) "تم بحمد الله ✓" else "متبقي $remaining من ${item.count}",
                                    color = if (isCompleted) Color.White else EmeraldDeep,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
