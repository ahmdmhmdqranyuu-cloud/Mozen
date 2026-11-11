package com.muslim.azan.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FloatingAudioBar() {
    val isPlaying by NativeAudioPlayerManager.isPlaying.collectAsState()
    val title by NativeAudioPlayerManager.currentTitle.collectAsState()
    val subtitle by NativeAudioPlayerManager.currentSubtitle.collectAsState()
    val progress by NativeAudioPlayerManager.currentProgress.collectAsState()
    val posMs by NativeAudioPlayerManager.currentPositionMs.collectAsState()
    val durMs by NativeAudioPlayerManager.currentDurationMs.collectAsState()

    var showFullSheet by remember { mutableStateOf(false) }

    AnimatedVisibility(
        visible = title.isNotEmpty(),
        enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 4.dp)
        ) {
            // Mini player bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(EmeraldSurfaceLight)
                    .clickable { showFullSheet = true }
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Circular icon
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(GoldDark),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.MusicNote,
                        contentDescription = "مشغل الصوت",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = title,
                        color = TextPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = subtitle,
                        color = TextSecondary,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Play / Pause
                IconButton(
                    onClick = { NativeAudioPlayerManager.togglePlayPause() }
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = "تشغيل أو إيقاف",
                        tint = GoldAccent,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Close button
                IconButton(
                    onClick = { NativeAudioPlayerManager.stop() }
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "إغلاق",
                        tint = TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // Linear mini-progress line
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(2.dp)
                    .padding(horizontal = 16.dp),
                color = GoldAccent,
                trackColor = CardBorder,
            )
        }
    }

    if (showFullSheet) {
        ModalBottomSheet(
            onDismissRequest = { showFullSheet = false },
            containerColor = EmeraldDeep,
            contentColor = TextPrimary
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(EmeraldSurfaceLight),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.MenuBook,
                        contentDescription = null,
                        tint = GoldAccent,
                        modifier = Modifier.size(50.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = title,
                    color = TextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = subtitle,
                    color = TextSecondary,
                    fontSize = 14.sp
                )

                Spacer(modifier = Modifier.height(20.dp))

                Slider(
                    value = progress,
                    onValueChange = { newProg ->
                        NativeAudioPlayerManager.seekTo(newProg)
                    },
                    colors = SliderDefaults.colors(
                        thumbColor = GoldAccent,
                        activeTrackColor = GoldAccent,
                        inactiveTrackColor = CardBorder
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = formatMs(posMs),
                        color = TextSecondary,
                        fontSize = 12.sp
                    )
                    Text(
                        text = formatMs(durMs),
                        color = TextSecondary,
                        fontSize = 12.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    IconButton(
                        onClick = {
                            val newPos = (posMs - 10000L).coerceAtLeast(0L)
                            if (durMs > 0) NativeAudioPlayerManager.seekTo(newPos.toFloat() / durMs)
                        }
                    ) {
                        Icon(Icons.Default.Replay10, contentDescription = "تراجع 10 ثوان", tint = TextPrimary)
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    IconButton(
                        onClick = { NativeAudioPlayerManager.togglePlayPause() },
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(GoldAccent)
                    ) {
                        Icon(
                            imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = "تشغيل أو إيقاف",
                            tint = EmeraldDeep,
                            modifier = Modifier.size(36.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    IconButton(
                        onClick = {
                            val newPos = (posMs + 10000L).coerceAtMost(durMs)
                            if (durMs > 0) NativeAudioPlayerManager.seekTo(newPos.toFloat() / durMs)
                        }
                    ) {
                        Icon(Icons.Default.Forward10, contentDescription = "تقديم 10 ثوان", tint = TextPrimary)
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

private fun formatMs(ms: Long): String {
    val totalSeconds = (ms / 1000).toInt()
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return String.format(java.util.Locale.US, "%02d:%02d", minutes, seconds)
}
