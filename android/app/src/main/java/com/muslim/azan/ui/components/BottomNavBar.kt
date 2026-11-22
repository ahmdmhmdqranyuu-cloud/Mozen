package com.muslim.azan.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.theme.*
import com.muslim.azan.ui.navigation.Screen

data class NavItem(
    val screen: Screen,
    val icon: ImageVector,
    val labelAr: String,
    val labelEn: String
)

@Composable
fun BottomNavBar(
    currentRoute: String,
    language: String = "ar",
    onNavigate: (Screen) -> Unit
) {
    val isEnglish = language == "en"
    val items = listOf(
        NavItem(Screen.Home, Icons.Default.Home, "الرئيسية", "Home"),
        NavItem(Screen.PrayerTimes, Icons.Default.AccessTime, "الأوقات", "Prayers"),
        NavItem(Screen.Quran, Icons.Default.MenuBook, "القرآن", "Quran"),
        NavItem(Screen.Azkar, Icons.Default.AutoStories, "الأذكار", "Azkar"),
        NavItem(Screen.Settings, Icons.Default.Settings, "الإعدادات", "Settings")
    )

    val navShape = RoundedCornerShape(
        topStart = 24.dp,
        topEnd = 24.dp,
        bottomStart = 0.dp,
        bottomEnd = 0.dp
    )

    // Anchored flush to bottom edge with rounded top-left & top-right corners,
    // Ivory Cream gradient (#F6EEDC -> #EDE2C8), subtle gold border (#D6C18D), and soft shadow
    Surface(
        shape = navShape,
        color = Color.Transparent,
        shadowElevation = 8.dp,
        border = BorderStroke(1.2.dp, MoazenCardBorder),
        modifier = Modifier
            .fillMaxWidth()
            .height(66.dp)
            .clip(navShape)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(MoazenCardStart, MoazenCardEnd)
                    )
                )
        ) {
            Canvas(modifier = Modifier.matchParentSize()) {
                drawIslamicGeometricOrnament(alpha = 0.075f)
            }
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 6.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                items.forEach { item ->
                    val isSelected = currentRoute == item.screen.route
                    val itemColor = if (isSelected) MoazenInkEmerald else MoazenInkMuted
                    val label = if (isEnglish) item.labelEn else item.labelAr

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier
                            .clip(RoundedCornerShape(14.dp))
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) {
                                onNavigate(item.screen)
                            }
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(31.dp)
                                .clip(CircleShape)
                                .background(
                                    if (isSelected) MoazenGold.copy(alpha = 0.25f)
                                    else MoazenSubCardBg
                                )
                                .border(
                                    width = if (isSelected) 1.5.dp else 1.dp,
                                    color = if (isSelected) MoazenGold else MoazenCardBorder,
                                    shape = CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = label,
                                tint = if (isSelected) MoazenInkEmerald else MoazenGoldDark,
                                modifier = Modifier.size(17.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = label,
                            color = itemColor,
                            fontSize = 10.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}
