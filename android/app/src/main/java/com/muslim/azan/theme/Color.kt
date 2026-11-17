package com.muslim.azan.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Legacy aliases remapped softly so any unedited screen harmonizes with the new palette
val EmeraldDeep = Color(0xFFDCE5CC)
val EmeraldSurface = Color(0xE8F7F4E8)
val EmeraldSurfaceLight = Color(0xEEFBF9EF)
val EmeraldPrimary = Color(0xFF104B40)
val EmeraldPrimaryDark = Color(0xFF0D5C3E)

val GoldAccent = Color(0xFFC5A059)
val GoldDark = Color(0xFF9A7732)
val GoldLight = Color(0xFFF3E5B5)

val TextPrimary = Color(0xFF104B40)
val TextSecondary = Color(0xFF4B5B58)
val TextTertiary = Color(0xFF1E6B52)

val CardBackground = Color(0xFFF6EEDC)
val CardBorder = Color(0xFFD6C18D)

val ErrorRed = Color(0xFFDC2626)
val SuccessGreen = Color(0xFF0D7A52)

// Unified Muslim Plus Olive-Ivory Canvas Gradient (Home & Settings)
val MuslimPlusCanvasTop = Color(0xFFC7D7B1)
val MuslimPlusCanvasMid = Color(0xFFE0E8CE)
val MuslimPlusCanvasBottom = Color(0xFFF2EFE1)

val MuslimPlusCanvasBrush: Brush
    get() = Brush.verticalGradient(
        colors = listOf(
            MuslimPlusCanvasTop,
            MuslimPlusCanvasMid,
            MuslimPlusCanvasBottom
        )
    )

// Unified Translucent Creamy-Ivory Glassmorphic Widget Palette
val MoazenCardStart = Color(0xFFF6EEDC)
val MoazenCardEnd = Color(0xFFEDE2C8)
val MoazenSubCardBg = Color(0xFFF4EAD4)
val MoazenCardBorder = Color(0xFFD6C18D)
val MoazenInkPrimary = Color(0xFF172A28)
val MoazenInkEmerald = Color(0xFF104B40)
val MoazenInkMuted = Color(0xFF4B5B58)
val MoazenGold = Color(0xFFC5A059)
val MoazenGoldDark = Color(0xFF9A7732)
val MuslimPlusBadgeGreen = Color(0x336AA06E)
val MuslimPlusPillEmerald = Color(0xFF0D5C3E)


