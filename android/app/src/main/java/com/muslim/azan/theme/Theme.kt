package com.muslim.azan.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

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
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = MuslimPlusColorScheme,
        content = content
    )
}

