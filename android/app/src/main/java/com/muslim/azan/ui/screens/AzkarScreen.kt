package com.muslim.azan.ui.screens

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard

@Composable
fun AzkarScreen(
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
    var selectedCategoryIndex by remember { mutableStateOf(0) }

    val isPlayingAudio by NativeAudioPlayerManager.isPlaying.collectAsState()
    val currentAudioTitle by NativeAudioPlayerManager.currentTitle.collectAsState()

    BackHandler {
        onBack()
    }

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
            .background(MuslimPlusCanvasBrush)
            .padding(horizontal = 14.dp, vertical = 12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = MoazenInkEmerald)
                }
                Text(
                    text = "الأذكار وحصن المسلم",
                    color = MoazenInkEmerald,
                    fontSize = 19.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            IconButton(
                onClick = {
                    val trackName = if (selectedCategoryIndex == 0) "azkar_sabah.mp3" else "azkar_massa.mp3"
                    val title = if (selectedCategoryIndex == 0) "أذكار الصباح المباركة" else "أذكار المساء المباركة"
                    if (isPlayingAudio && currentAudioTitle == title) {
                        NativeAudioPlayerManager.stop()
                    } else {
                        NativeAudioPlayerManager.playAssetAudio(context, "audio/$trackName", title, "بصوت خاشع")
                    }
                }
            ) {
                Icon(
                    imageVector = Icons.Default.VolumeUp,
                    contentDescription = "استماع صوتي",
                    tint = MoazenGoldDark,
                    modifier = Modifier.size(26.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Dedicated Audio Preview Panel for Morning & Evening Azkar
        MoazenWidgetCard(
            cornerRadius = 16.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Headphones,
                            contentDescription = null,
                            tint = MoazenInkEmerald,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "معاينة أصوات أذكار الصباح والمساء",
                            color = MoazenInkEmerald,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    if (isPlayingAudio && (currentAudioTitle == "أذكار الصباح المباركة" || currentAudioTitle == "أذكار المساء المباركة")) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = ErrorRed.copy(alpha = 0.14f),
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { NativeAudioPlayerManager.stop() }
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Icon(Icons.Default.Stop, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("إيقاف", color = ErrorRed, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val isSabahPlaying = isPlayingAudio && currentAudioTitle == "أذكار الصباح المباركة"
                    val isMassaPlaying = isPlayingAudio && currentAudioTitle == "أذكار المساء المباركة"

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isSabahPlaying) MuslimPlusPillEmerald else Color.White.copy(alpha = 0.72f),
                        border = BorderStroke(1.dp, if (isSabahPlaying) MoazenGold else MoazenCardBorder),
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                if (isSabahPlaying) {
                                    NativeAudioPlayerManager.stop()
                                } else {
                                    NativeAudioPlayerManager.playAssetAudio(
                                        context,
                                        "audio/azkar_sabah.mp3",
                                        "أذكار الصباح المباركة",
                                        "معاينة أذكار الصباح"
                                    )
                                }
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = if (isSabahPlaying) Icons.Default.Stop else Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = if (isSabahPlaying) Color.White else MoazenInkEmerald,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (isSabahPlaying) "إيقاف الصباح" else "معاينة الصباح",
                                color = if (isSabahPlaying) Color.White else MoazenInkPrimary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isMassaPlaying) MuslimPlusPillEmerald else Color.White.copy(alpha = 0.72f),
                        border = BorderStroke(1.dp, if (isMassaPlaying) MoazenGold else MoazenCardBorder),
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                if (isMassaPlaying) {
                                    NativeAudioPlayerManager.stop()
                                } else {
                                    NativeAudioPlayerManager.playAssetAudio(
                                        context,
                                        "audio/azkar_massa.mp3",
                                        "أذكار المساء المباركة",
                                        "معاينة أذكار المساء"
                                    )
                                }
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = if (isMassaPlaying) Icons.Default.Stop else Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = if (isMassaPlaying) Color.White else MoazenInkEmerald,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (isMassaPlaying) "إيقاف المساء" else "معاينة المساء",
                                color = if (isMassaPlaying) Color.White else MoazenInkPrimary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Tabs Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            categories.forEachIndexed { index, cat ->
                val isSelected = selectedCategoryIndex == index
                if (isSelected) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(MuslimPlusPillEmerald)
                            .clickable { selectedCategoryIndex = index }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = cat,
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                } else {
                    MoazenWidgetCard(
                        cornerRadius = 12.dp,
                        modifier = Modifier.weight(1f),
                        onClick = { selectedCategoryIndex = index }
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = cat,
                                color = MoazenInkPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items, key = { it.id }) { item ->
                val remaining = countsMap[item.id] ?: item.count
                val isCompleted = remaining == 0

                MoazenWidgetCard(
                    cornerRadius = 16.dp,
                    borderColor = if (isCompleted) MoazenInkEmerald.copy(alpha = 0.5f) else MoazenCardBorder,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = item.textArabic,
                            color = if (isCompleted) MoazenInkMuted else MoazenInkPrimary,
                            fontSize = 16.sp,
                            lineHeight = 28.sp,
                            textAlign = TextAlign.Right,
                            modifier = Modifier.fillMaxWidth()
                        )

                        if (item.fadl.isNotBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "الفضل: ${item.fadl}",
                                color = MoazenGoldDark,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
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
                                color = MoazenInkMuted,
                                fontSize = 11.sp
                            )

                            // Tap Counter Button
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(if (isCompleted) MuslimPlusPillEmerald else GoldAccent)
                                    .clickable {
                                        if (remaining > 0) {
                                            countsMap[item.id] = remaining - 1
                                            runCatching {
                                                if (vibrator?.hasVibrator() == true) {
                                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                                        vibrator.vibrate(VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE))
                                                    } else {
                                                        @Suppress("DEPRECATION")
                                                        vibrator.vibrate(40)
                                                    }
                                                }
                                            }
                                        } else {
                                            countsMap[item.id] = item.count
                                        }
                                    }
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (isCompleted) "تم بحمد الله ✓" else "متبقي $remaining من ${item.count}",
                                    color = if (isCompleted) Color.White else MoazenInkPrimary,
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
