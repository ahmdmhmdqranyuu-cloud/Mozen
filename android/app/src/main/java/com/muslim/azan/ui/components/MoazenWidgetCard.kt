package com.muslim.azan.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.muslim.azan.R
import com.muslim.azan.theme.MoazenCardBorder
import com.muslim.azan.theme.MoazenCardEnd
import com.muslim.azan.theme.MoazenCardStart
import com.muslim.azan.theme.MoazenSubCardBg
import com.muslim.azan.theme.RafeeqGoldBevelBrush

/**
 * Draws a subtle repeating 8-pointed Islamic geometric star lattice overlay in soft gold.
 */
fun DrawScope.drawIslamicGeometricOrnament(
    lineColor: Color = Color(0xFFB9974A),
    alpha: Float = 0.08f
) {
    val tilePx = 38.dp.toPx()
    if (tilePx <= 1f) return
    val strokeColor = lineColor.copy(alpha = alpha)
    val stroke = Stroke(width = 0.75.dp.toPx())

    var y = 0f
    while (y < size.height + tilePx) {
        var x = 0f
        while (x < size.width + tilePx) {
            val cx = x + tilePx * 0.5f
            val cy = y + tilePx * 0.5f
            val r = tilePx * 0.34f
            val rDiag = r * 0.7071f

            val sq1 = Path().apply {
                moveTo(cx - r, cy - r)
                lineTo(cx + r, cy - r)
                lineTo(cx + r, cy + r)
                lineTo(cx - r, cy + r)
                close()
            }
            drawPath(sq1, strokeColor, style = stroke)

            val sq2 = Path().apply {
                moveTo(cx, cy - r * 1.414f * 0.72f)
                lineTo(cx + r * 1.414f * 0.72f, cy)
                lineTo(cx, cy + r * 1.414f * 0.72f)
                lineTo(cx - r * 1.414f * 0.72f, cy)
                close()
            }
            drawPath(sq2, strokeColor, style = stroke)

            drawCircle(
                color = strokeColor,
                radius = rDiag * 0.25f,
                center = Offset(cx, cy),
                style = stroke
            )
            x += tilePx
        }
        y += tilePx
    }
}

/**
 * Unified Cream-Ivory 3D Beveled Gold Widget Container (Rafeeq Al-Muslim):
 * - Warm creamy gradient surface (#FFFBF1 -> #F4E8CE)
 * - Raised 3D metallic gold gradient border + subtle specular inner top rim & shadow
 */
@Composable
fun MoazenWidgetCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 18.dp,
    shapeOverride: Shape? = null,
    borderColor: Color = MoazenCardBorder,
    borderWidth: Dp = 1.8.dp,
    elevation: Dp = 5.dp,
    watermarkAlpha: Float = 0.04f,
    containerColor: Color = Color.Transparent,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit
) {
    val shape: Shape = shapeOverride ?: RoundedCornerShape(cornerRadius)
    val baseModifier = if (onClick != null) {
        modifier
            .clip(shape)
            .clickable(onClick = onClick)
    } else {
        modifier.clip(shape)
    }

    val effectiveBevelBrush = if (borderColor == MoazenCardBorder) {
        RafeeqGoldBevelBrush
    } else {
        Brush.linearGradient(
            colors = listOf(
                Color(0xFFFFF3BF),
                borderColor,
                Color(0xFF9A7324),
                borderColor
            )
        )
    }

    Surface(
        modifier = baseModifier,
        shape = shape,
        color = containerColor,
        shadowElevation = elevation,
        border = BorderStroke(borderWidth, effectiveBevelBrush)
    ) {
        val isDark = LocalAlMoazenIsDark.current
        val innerRimColor = if (isDark) Color(0x33D4AF37) else Color.White.copy(alpha = 0.75f)
        Box(
            modifier = Modifier
                .background(
                    Brush.linearGradient(
                        colors = listOf(MoazenCardStart, MoazenCardEnd)
                    )
                )
                .border(
                    width = 0.9.dp,
                    color = innerRimColor,
                    shape = shape
                )
        ) {
            if (watermarkAlpha > 0f) {
                Image(
                    painter = painterResource(id = R.drawable.img_hadith_mosque),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    alpha = if (isDark) watermarkAlpha * 1.4f else watermarkAlpha,
                    modifier = Modifier.matchParentSize()
                )
            }
            Canvas(modifier = Modifier.matchParentSize()) {
                drawIslamicGeometricOrnament(alpha = if (isDark) 0.11f else 0.08f)
            }
            content()
        }
    }
}

/**
 * Lightweight sub-card surface for inner tiles inside a MoazenWidgetCard.
 */
@Composable
fun MoazenSubWidgetBox(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 12.dp,
    borderColor: Color = MoazenCardBorder,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit
) {
    val shape = RoundedCornerShape(cornerRadius)
    val mod = modifier
        .clip(shape)
        .background(MoazenSubCardBg)
        .border(1.2.dp, borderColor, shape)
        .let { m -> if (onClick != null) m.clickable(onClick = onClick) else m }
    Box(modifier = mod, content = content)
}
