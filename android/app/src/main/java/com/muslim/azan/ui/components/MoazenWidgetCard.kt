package com.muslim.azan.ui.components

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.muslim.azan.R
import com.muslim.azan.theme.MoazenCardBorder
import com.muslim.azan.theme.MoazenCardEnd
import com.muslim.azan.theme.MoazenCardStart

/**
 * Unified Home Quran Banner style widget container:
 * - Soft mint diagonal gradient (#EBF5F1 -> #F4F8F6)
 * - Subtle mosque watermark (R.drawable.bg_quran_widget_mosque) at 0.08f alpha
 * - Soft emerald border (1.dp)
 */
@Composable
fun MoazenWidgetCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 18.dp,
    borderColor: Color = MoazenCardBorder,
    borderWidth: Dp = 1.dp,
    elevation: Dp = 2.dp,
    watermarkAlpha: Float = 0.08f,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit
) {
    val shape: Shape = RoundedCornerShape(cornerRadius)
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
        color = MoazenCardStart,
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
            Image(
                painter = painterResource(id = R.drawable.bg_quran_widget_mosque),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                alpha = watermarkAlpha,
                modifier = Modifier.matchParentSize()
            )
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
        .background(Color.White.copy(alpha = 0.72f))
        .border(1.dp, borderColor, shape)
        .let { m -> if (onClick != null) m.clickable(onClick = onClick) else m }
    Box(modifier = mod, content = content)
}
