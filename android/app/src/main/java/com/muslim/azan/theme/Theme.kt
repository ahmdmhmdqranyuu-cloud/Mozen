package com.muslim.azan.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

private val MuslimPlusLightColorScheme = lightColorScheme(
    primary = LightInkEmerald,
    onPrimary = Color.White,
    primaryContainer = LightCardEnd,
    onPrimaryContainer = LightInkPrimary,
    secondary = MoazenGold,
    onSecondary = LightInkPrimary,
    secondaryContainer = GoldLight,
    onSecondaryContainer = LightGoldDark,
    background = LightCanvasMid,
    onBackground = LightInkPrimary,
    surface = LightCardStart,
    onSurface = LightInkPrimary,
    surfaceVariant = LightCardEnd,
    onSurfaceVariant = LightInkMuted,
    outline = MoazenCardBorder
)

private val MuslimPlusDarkColorScheme = darkColorScheme(
    primary = DarkPillEmerald,
    onPrimary = Color.White,
    primaryContainer = DarkCardEnd,
    onPrimaryContainer = DarkInkPrimary,
    secondary = MoazenGold,
    onSecondary = Color(0xFF071612),
    secondaryContainer = DarkSubCardBg,
    onSecondaryContainer = DarkGoldDark,
    background = DarkCanvasMid,
    onBackground = DarkInkPrimary,
    surface = DarkCardStart,
    onSurface = DarkInkPrimary,
    surfaceVariant = DarkCardEnd,
    onSurfaceVariant = DarkInkMuted,
    outline = MoazenCardBorder
)

@Composable
fun AlMoazenTheme(
    layoutDirection: LayoutDirection = LayoutDirection.Rtl,
    themeMode: String = "system",
    darkThemeOverride: Boolean? = null,
    content: @Composable () -> Unit
) {
    val isDark = darkThemeOverride ?: when (themeMode) {
        "dark" -> true
        "light" -> false
        else -> isSystemInDarkTheme()
    }
    val palette = if (isDark) DarkAlMoazenPalette else LightAlMoazenPalette
    val colorScheme = if (isDark) MuslimPlusDarkColorScheme else MuslimPlusLightColorScheme

    CompositionLocalProvider(
        LocalLayoutDirection provides layoutDirection,
        LocalAlMoazenColors provides palette,
        LocalAlMoazenIsDark provides isDark
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            content = content
        )
    }
}
