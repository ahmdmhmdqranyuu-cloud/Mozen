package com.muslim.azan.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.R
import com.muslim.azan.theme.*
import com.muslim.azan.ui.navigation.Screen

data class NavItem(
    val screen: Screen,
    val icon: ImageVector,
    val labelAr: String
)

@Composable
fun BottomNavBar(
    currentRoute: String,
    onNavigate: (Screen) -> Unit
) {
    val items = listOf(
        NavItem(Screen.Home, Icons.Default.Home, "الرئيسية"),
        NavItem(Screen.PrayerTimes, Icons.Default.AccessTime, "المواقيت"),
        NavItem(Screen.Quran, Icons.Default.MenuBook, "المصحف"),
        NavItem(Screen.Azkar, Icons.Default.AutoStories, "الأذكار"),
        NavItem(Screen.Settings, Icons.Default.Settings, "الإعدادات")
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(68.dp)
            .background(
                Brush.linearGradient(
                    colors = listOf(MoazenCardStart, MoazenCardEnd)
                )
            )
    ) {
        Image(
            painter = painterResource(id = R.drawable.bg_quran_widget_mosque),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            alpha = 0.06f,
            modifier = Modifier.matchParentSize()
        )
        HorizontalDivider(
            color = MoazenCardBorder,
            thickness = 1.dp,
            modifier = Modifier.align(Alignment.TopCenter)
        )
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { item ->
                val isSelected = currentRoute == item.screen.route
                val itemColor = if (isSelected) MoazenInkEmerald else MoazenInkMuted

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isSelected) MoazenInkEmerald.copy(alpha = 0.1f) else Color.Transparent)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) {
                            onNavigate(item.screen)
                        }
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.labelAr,
                        tint = itemColor,
                        modifier = Modifier.size(23.dp)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = item.labelAr,
                        color = itemColor,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                    )
                }
            }
        }
    }
}
