package com.muslim.azan.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Calm Warm Cream Palette (Rafeeq Al-Muslim Unified Identity)
val EmeraldDeep = Color(0xFFFBF6E8)
val EmeraldSurface = Color(0xFFF8F1DF)
val EmeraldSurfaceLight = Color(0xFFFEFBF2)
val EmeraldPrimary = Color(0xFF104B40)
val EmeraldPrimaryDark = Color(0xFF0D5C3E)

val GoldAccent = Color(0xFFC5A059)
val GoldDark = Color(0xFF9A7732)
val GoldLight = Color(0xFFF6DF9E)

val TextPrimary = Color(0xFF104B40)
val TextSecondary = Color(0xFF4B5B58)
val TextTertiary = Color(0xFF1E6B52)

val CardBackground = Color(0xFFFBF5E6)
val CardBorder = Color(0xFFCAA34E)

val ErrorRed = Color(0xFFDC2626)
val SuccessGreen = Color(0xFF0D7A52)

// Calm Creamy Canvas Gradient (Home & All Screens)
val MuslimPlusCanvasTop = Color(0xFFFBF6E8)
val MuslimPlusCanvasMid = Color(0xFFF7EFE0)
val MuslimPlusCanvasBottom = Color(0xFFF3E8D0)

val MuslimPlusCanvasBrush: Brush
    get() = Brush.verticalGradient(
        colors = listOf(
            MuslimPlusCanvasTop,
            MuslimPlusCanvasMid,
            MuslimPlusCanvasBottom
        )
    )

// 3D Beveled Gold Metallic Rim & Cream Surface Palette
val MoazenCardStart = Color(0xFFFFFBF1)
val MoazenCardEnd = Color(0xFFF4E8CE)
val MoazenSubCardBg = Color(0xFFFAF2DF)
val MoazenCardBorder = Color(0xFFCAA34E)
val MoazenInkPrimary = Color(0xFF172A28)
val MoazenInkEmerald = Color(0xFF104B40)
val MoazenInkMuted = Color(0xFF4B5B58)
val MoazenGold = Color(0xFFC59B3F)
val MoazenGoldDark = Color(0xFF9A7324)
val MoazenGoldHighlight = Color(0xFFFFF3BF)
val MuslimPlusBadgeGreen = Color(0x336AA06E)
val MuslimPlusPillEmerald = Color(0xFF0D5C3E)

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
