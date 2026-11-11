package com.muslim.azan.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = EmeraldPrimary,
    onPrimary = Color.White,
    primaryContainer = EmeraldSurfaceLight,
    onPrimaryContainer = TextPrimary,
    secondary = GoldAccent,
    onSecondary = Color.Black,
    secondaryContainer = GoldDark,
    onSecondaryContainer = GoldLight,
    background = EmeraldDeep,
    onBackground = TextPrimary,
    surface = EmeraldSurface,
    onSurface = TextPrimary,
    surfaceVariant = EmeraldSurfaceLight,
    onSurfaceVariant = TextSecondary,
    outline = CardBorder
)

@Composable
fun AlMoazenTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
