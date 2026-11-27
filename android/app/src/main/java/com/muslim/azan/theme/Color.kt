package com.muslim.azan.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Light Mode: Calm Warm Cream & Emerald Identity (Rafeeq Al-Muslim)
val LightEmeraldDeep = Color(0xFFFBF6E8)
val LightEmeraldSurface = Color(0xFFF8F1DF)
val LightEmeraldSurfaceLight = Color(0xFFFEFBF2)
val LightEmeraldPrimary = Color(0xFF104B40)
val LightEmeraldPrimaryDark = Color(0xFF0D5C3E)

val LightCanvasTop = Color(0xFFFBF6E8)
val LightCanvasMid = Color(0xFFF7EFE0)
val LightCanvasBottom = Color(0xFFF3E8D0)

val LightCardStart = Color(0xFFFFFBF1)
val LightCardEnd = Color(0xFFF4E8CE)
val LightSubCardBg = Color(0xFFFAF2DF)
val LightInkPrimary = Color(0xFF172A28)
val LightInkEmerald = Color(0xFF104B40)
val LightInkMuted = Color(0xFF4B5B58)
val LightGoldDark = Color(0xFF9A7324)
val LightBadgeGreen = Color(0x336AA06E)
val LightPillEmerald = Color(0xFF0D5C3E)
val LightChipUnselectedBg = Color(0xCCFFFFFF)

// Dark Mode: Deep Obsidian Emerald & Warm Antique Gold Identity
val DarkEmeraldDeep = Color(0xFF071612)
val DarkEmeraldSurface = Color(0xFF0E251F)
val DarkEmeraldSurfaceLight = Color(0xFF14332B)
val DarkEmeraldPrimary = Color(0xFF6CE6BA)
val DarkEmeraldPrimaryDark = Color(0xFF34D399)

val DarkCanvasTop = Color(0xFF061410)
val DarkCanvasMid = Color(0xFF0A1D18)
val DarkCanvasBottom = Color(0xFF0E2720)

val DarkCardStart = Color(0xFF123027)
val DarkCardEnd = Color(0xFF0C211B)
val DarkSubCardBg = Color(0xFF173A30)
val DarkInkPrimary = Color(0xFFF4EFE2)
val DarkInkEmerald = Color(0xFF6CE6BA)
val DarkInkMuted = Color(0xFFB3C7BF)
val DarkGoldDark = Color(0xFFE7C768)
val DarkBadgeGreen = Color(0x336CE6BA)
val DarkPillEmerald = Color(0xFF136B50)
val DarkChipUnselectedBg = Color(0xFF173A30)

// Shared Brand Accents
val GoldAccent = Color(0xFFC5A059)
val GoldDark = Color(0xFF9A7732)
val GoldLight = Color(0xFFF6DF9E)
val MoazenCardBorder = Color(0xFFCAA34E)
val CardBorder = Color(0xFFCAA34E)
val MoazenGold = Color(0xFFC59B3F)
val MoazenGoldHighlight = Color(0xFFFFF3BF)
val ErrorRed = Color(0xFFDC2626)
val SuccessGreen = Color(0xFF0D7A52)

@Immutable
data class AlMoazenColorPalette(
    val isDark: Boolean,
    val emeraldDeep: Color,
    val emeraldSurface: Color,
    val emeraldSurfaceLight: Color,
    val emeraldPrimary: Color,
    val emeraldPrimaryDark: Color,
    val canvasTop: Color,
    val canvasMid: Color,
    val canvasBottom: Color,
    val cardStart: Color,
    val cardEnd: Color,
    val subCardBg: Color,
    val inkPrimary: Color,
    val inkEmerald: Color,
    val inkMuted: Color,
    val goldDark: Color,
    val badgeGreen: Color,
    val pillEmerald: Color,
    val chipUnselectedBg: Color
)

val LightAlMoazenPalette = AlMoazenColorPalette(
    isDark = false,
    emeraldDeep = LightEmeraldDeep,
    emeraldSurface = LightEmeraldSurface,
    emeraldSurfaceLight = LightEmeraldSurfaceLight,
    emeraldPrimary = LightEmeraldPrimary,
    emeraldPrimaryDark = LightEmeraldPrimaryDark,
    canvasTop = LightCanvasTop,
    canvasMid = LightCanvasMid,
    canvasBottom = LightCanvasBottom,
    cardStart = LightCardStart,
    cardEnd = LightCardEnd,
    subCardBg = LightSubCardBg,
    inkPrimary = LightInkPrimary,
    inkEmerald = LightInkEmerald,
    inkMuted = LightInkMuted,
    goldDark = LightGoldDark,
    badgeGreen = LightBadgeGreen,
    pillEmerald = LightPillEmerald,
    chipUnselectedBg = LightChipUnselectedBg
)

val DarkAlMoazenPalette = AlMoazenColorPalette(
    isDark = true,
    emeraldDeep = DarkEmeraldDeep,
    emeraldSurface = DarkEmeraldSurface,
    emeraldSurfaceLight = DarkEmeraldSurfaceLight,
    emeraldPrimary = DarkEmeraldPrimary,
    emeraldPrimaryDark = DarkEmeraldPrimaryDark,
    canvasTop = DarkCanvasTop,
    canvasMid = DarkCanvasMid,
    canvasBottom = DarkCanvasBottom,
    cardStart = DarkCardStart,
    cardEnd = DarkCardEnd,
    subCardBg = DarkSubCardBg,
    inkPrimary = DarkInkPrimary,
    inkEmerald = DarkInkEmerald,
    inkMuted = DarkInkMuted,
    goldDark = DarkGoldDark,
    badgeGreen = DarkBadgeGreen,
    pillEmerald = DarkPillEmerald,
    chipUnselectedBg = DarkChipUnselectedBg
)

val LocalAlMoazenColors = staticCompositionLocalOf { LightAlMoazenPalette }
val LocalAlMoazenIsDark = staticCompositionLocalOf { false }

// Theme-Aware Tokens (resolve dynamically to Light or Dark palette)
val EmeraldDeep: Color @Composable get() = LocalAlMoazenColors.current.emeraldDeep
val EmeraldSurface: Color @Composable get() = LocalAlMoazenColors.current.emeraldSurface
val EmeraldSurfaceLight: Color @Composable get() = LocalAlMoazenColors.current.emeraldSurfaceLight
val EmeraldPrimary: Color @Composable get() = LocalAlMoazenColors.current.emeraldPrimary
val EmeraldPrimaryDark: Color @Composable get() = LocalAlMoazenColors.current.emeraldPrimaryDark

val TextPrimary: Color @Composable get() = LocalAlMoazenColors.current.inkPrimary
val TextSecondary: Color @Composable get() = LocalAlMoazenColors.current.inkMuted
val TextTertiary: Color @Composable get() = LocalAlMoazenColors.current.inkEmerald

val CardBackground: Color @Composable get() = LocalAlMoazenColors.current.cardStart

val MuslimPlusCanvasTop: Color @Composable get() = LocalAlMoazenColors.current.canvasTop
val MuslimPlusCanvasMid: Color @Composable get() = LocalAlMoazenColors.current.canvasMid
val MuslimPlusCanvasBottom: Color @Composable get() = LocalAlMoazenColors.current.canvasBottom

val MuslimPlusCanvasBrush: Brush
    @Composable
    get() {
        val c = LocalAlMoazenColors.current
        return Brush.verticalGradient(colors = listOf(c.canvasTop, c.canvasMid, c.canvasBottom))
    }

val MoazenCardStart: Color @Composable get() = LocalAlMoazenColors.current.cardStart
val MoazenCardEnd: Color @Composable get() = LocalAlMoazenColors.current.cardEnd
val MoazenSubCardBg: Color @Composable get() = LocalAlMoazenColors.current.subCardBg
val MoazenInkPrimary: Color @Composable get() = LocalAlMoazenColors.current.inkPrimary
val MoazenInkEmerald: Color @Composable get() = LocalAlMoazenColors.current.inkEmerald
val MoazenInkMuted: Color @Composable get() = LocalAlMoazenColors.current.inkMuted
val MoazenGoldDark: Color @Composable get() = LocalAlMoazenColors.current.goldDark
val MuslimPlusBadgeGreen: Color @Composable get() = LocalAlMoazenColors.current.badgeGreen
val MuslimPlusPillEmerald: Color @Composable get() = LocalAlMoazenColors.current.pillEmerald
val MoazenChipUnselectedBg: Color @Composable get() = LocalAlMoazenColors.current.chipUnselectedBg

val RafeeqGoldBevelBrush: Brush
    get() = Brush.linearGradient(
        colors = listOf(
            Color(0xFFFFF3BF),
            Color(0xFFD9B14A),
            Color(0xFF9B711C),
            Color(0xFFF1D57B),
            Color(0xFFC59B3F)
        )
    )
