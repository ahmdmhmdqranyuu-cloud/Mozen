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

/**
 * Draws a subtle repeating 8-pointed Islamic geometric star lattice overlay in soft gold.
 */
fun DrawScope.drawIslamicGeometricOrnament(
    lineColor: Color = Color(0xFFB9974A),
    alpha: Float = 0.095f
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

            // Axis-aligned square
            val sq1 = Path().apply {
                moveTo(cx - r, cy - r)
                lineTo(cx + r, cy - r)
                lineTo(cx + r, cy + r)
                lineTo(cx - r, cy + r)
                close()
            }
            drawPath(sq1, strokeColor, style = stroke)

            // 45-degree rotated diamond (8-pointed star formation)
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
 * Unified Ivory Cream Widget Container (#F6EEDC -> #EDE2C8):
 * - Warm creamy-ivory gradient surface with subtle Islamic geometric ornaments
 * - Soft mosque texture hint + light gold border (#D6C18D) & soft elevation shadow
 */
@Composable
fun MoazenWidgetCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 18.dp,
    shapeOverride: Shape? = null,
    borderColor: Color = MoazenCardBorder,
    borderWidth: Dp = 1.dp,
    elevation: Dp = 3.dp,
    watermarkAlpha: Float = 0.045f,
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

    Surface(
        modifier = baseModifier,
        shape = shape,
        color = containerColor,
        shadowElevation = elevation,
        border = BorderStroke(borderWidth, borderColor)
    ) {
        Box(
            modifier = Modifier.background(
                Brush.linearGradient(
                    colors = listOf(MoazenCardStart, MoazenCardEnd)
                )
            )
        ) {
            if (watermarkAlpha > 0f) {
                Image(
                    painter = painterResource(id = R.drawable.bg_quran_widget_mosque),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    alpha = watermarkAlpha,
                    modifier = Modifier.matchParentSize()
                )
            }
            Canvas(modifier = Modifier.matchParentSize()) {
                drawIslamicGeometricOrnament()
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
        .border(1.dp, borderColor, shape)
        .let { m -> if (onClick != null) m.clickable(onClick = onClick) else m }
    Box(modifier = mod, content = content)
}
