package com.muslim.azan.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.muslim.azan.R
import com.muslim.azan.theme.MoazenInkEmerald
import com.muslim.azan.theme.RafeeqGoldBevelBrush

/**
 * Prominent 3D Gold-Framed "Rafeeq Al-Muslim" Banner Widget placed directly above PrayerCard.
 * Features exact attached artwork plus real clickable Settings & Notifications circular buttons (44dp+ targets).
 */
@Composable
fun RafeeqBannerWidget(
    isEnglish: Boolean,
    hasNotificationBadge: Boolean = true,
    onOpenSettings: () -> Unit,
    onOpenNotifications: () -> Unit,
    modifier: Modifier = Modifier
) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        val outerShape = RoundedCornerShape(22.dp)
        val innerShape = RoundedCornerShape(19.dp)

        Surface(
            modifier = modifier.fillMaxWidth(),
            shape = outerShape,
            shadowElevation = 8.dp,
            color = Color.Transparent
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(RafeeqGoldBevelBrush, outerShape)
                    .padding(3.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(720f / 300f)
                        .clip(innerShape)
                        .background(Color(0xFFFBF4DF))
                        .border(1.dp, Color.White.copy(alpha = 0.72f), innerShape)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.bg_rafeeq_banner_widget),
                        contentDescription = if (isEnglish) "Rafeeq Al-Muslim" else "رفيق المسلم",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )

                    Row(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(top = 6.dp, end = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            shadowElevation = 4.dp,
                            color = Color.Transparent,
                            border = BorderStroke(1.6.dp, Color(0xFFC89F3F)),
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .clickable(onClick = onOpenSettings)
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.verticalGradient(
                                            listOf(Color(0xFFFFFDF2), Color(0xFFF3E1B2))
                                        )
                                    )
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Settings,
                                    contentDescription = if (isEnglish) "Settings" else "الإعدادات",
                                    tint = MoazenInkEmerald,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        Box(modifier = Modifier.size(44.dp)) {
                            Surface(
                                shape = CircleShape,
                                shadowElevation = 4.dp,
                                color = Color.Transparent,
                                border = BorderStroke(1.6.dp, Color(0xFFC89F3F)),
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(CircleShape)
                                    .clickable(onClick = onOpenNotifications)
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(
                                            Brush.verticalGradient(
                                                listOf(Color(0xFFFFFDF2), Color(0xFFF3E1B2))
                                            )
                                        )
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Notifications,
                                        contentDescription = if (isEnglish) "Notifications" else "التنبيهات والمواقيت",
                                        tint = MoazenInkEmerald,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            if (hasNotificationBadge) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .offset(x = (-3).dp, y = 3.dp)
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFDC2626))
                                        .border(1.5.dp, Color(0xFFFFFDF2), CircleShape)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
