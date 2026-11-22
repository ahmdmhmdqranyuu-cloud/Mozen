package com.muslim.azan.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

private val MuslimPlusColorScheme = lightColorScheme(
    primary = MoazenInkEmerald,
    onPrimary = Color.White,
    primaryContainer = MoazenCardEnd,
    onPrimaryContainer = MoazenInkPrimary,
    secondary = MoazenGold,
    onSecondary = MoazenInkPrimary,
    secondaryContainer = GoldLight,
    onSecondaryContainer = MoazenGoldDark,
    background = MuslimPlusCanvasMid,
    onBackground = MoazenInkPrimary,
    surface = MoazenCardStart,
    onSurface = MoazenInkPrimary,
    surfaceVariant = MoazenCardEnd,
    onSurfaceVariant = MoazenInkMuted,
    outline = MoazenCardBorder
)

@Composable
fun AlMoazenTheme(
    layoutDirection: LayoutDirection = LayoutDirection.Rtl,
    content: @Composable () -> Unit
) {
    CompositionLocalProvider(LocalLayoutDirection provides layoutDirection) {
        MaterialTheme(
            colorScheme = MuslimPlusColorScheme,
            content = content
        )
    }
}

