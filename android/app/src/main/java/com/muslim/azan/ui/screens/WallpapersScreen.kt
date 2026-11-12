package com.muslim.azan.ui.screens

import android.content.Context
import android.graphics.*
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.MediaFileManager
import com.muslim.azan.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

data class WallpaperItem(
    val id: Int,
    val titleAr: String,
    val category: String,
    val subtitleAr: String,
    val primaryColorHex: Long,
    val secondaryColorHex: Long,
    val calligraphyText: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WallpapersScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val wallpapers = remember {
        listOf(
            WallpaperItem(1, "الكعبة المشرفة", "مكة", "المسجد الحرام بمكة المكرمة", 0xFF0D1B2A, 0xFFD4AF37, "إِنَّ أَوَّلَ بَيْتٍ وُضِعَ لِلنَّاسِ لَلَّذِي بِبَكَّةَ مُبَارَكًا"),
            WallpaperItem(2, "المسجد النبوي", "المدينة", "الروضة الشريفة وقبة النبي ﷺ", 0xFF003822, 0xFFD4AF37, "مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ"),
            WallpaperItem(3, "المسجد الأقصى", "القدس", "قبة الصخرة المشرفة", 0xFF14213D, 0xFFE5A93C, "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى"),
            WallpaperItem(4, "لفظ الجلالة", "خط عربي", "الله جل جلاله ونور السماوات", 0xFF09241C, 0xFFF59E0B, "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ"),
            WallpaperItem(5, "الصلاة والسلام على النبي", "خط عربي", "محمد رسول الله ﷺ", 0xFF1B4332, 0xFFD4AF37, "إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ"),
            WallpaperItem(6, "آية الكرسي", "خط عربي", "أعظم آية في كتاب الله", 0xFF1A1A2E, 0xFFE9C46A, "وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ"),
            WallpaperItem(7, "ساعة السحر والتهجد", "طبيعة", "سكون الليل والاستغفار بالأسحار", 0xFF0B132B, 0xFF6FFFE9, "وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ"),
            WallpaperItem(8, "فجر جديد وأمل", "طبيعة", "نور الصباح وتسبيح الكون", 0xFF1D3557, 0xFFF1FAEE, "وَالصُّبْحِ إِذَا تَنَفَّسَ")
        )
    }

    var selectedCategory by remember { mutableStateOf("الكل") }
    var previewingWallpaper by remember { mutableStateOf<WallpaperItem?>(null) }
    var isSaving by remember { mutableStateOf(false) }

    val categories = listOf("الكل", "مكة", "المدينة", "القدس", "خط عربي", "طبيعة")
    val filteredList = if (selectedCategory == "الكل") wallpapers else wallpapers.filter { it.category == selectedCategory }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("الخلفيات الإسلامية", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = GoldAccent)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = EmeraldDeep)
            )
        },
        containerColor = EmeraldDeep
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Category Chips Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { cat ->
                    val isSelected = selectedCategory == cat
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) GoldAccent else EmeraldSurface)
                            .clickable { selectedCategory = cat }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = cat,
                            color = if (isSelected) EmeraldDeep else TextSecondary,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 12.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Wallpapers Grid
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredList) { wp ->
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(240.dp)
                            .clickable { previewingWallpaper = wp }
                    ) {
                        Box(modifier = Modifier.fillMaxSize()) {
                            // Artistic Background
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color(wp.primaryColorHex))
                                    .padding(14.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Mosque,
                                        contentDescription = null,
                                        tint = Color(wp.secondaryColorHex).copy(alpha = 0.8f),
                                        modifier = Modifier.size(36.dp)
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = wp.calligraphyText,
                                        color = Color.White,
                                        fontSize = 12.sp,
                                        lineHeight = 18.sp,
                                        fontWeight = FontWeight.Bold,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }

                            // Bottom Gradient Caption
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .align(Alignment.BottomCenter)
                                    .background(EmeraldSurface.copy(alpha = 0.9f))
                                    .padding(vertical = 8.dp, horizontal = 10.dp)
                            ) {
                                Column {
                                    Text(
                                        text = wp.titleAr,
                                        color = GoldAccent,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = wp.category,
                                        color = TextSecondary,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal Sheet Preview & Save to Gallery
    previewingWallpaper?.let { wp ->
        AlertDialog(
            onDismissRequest = { if (!isSaving) previewingWallpaper = null },
            confirmButton = {
                Button(
                    onClick = {
                        isSaving = true
                        scope.launch {
                            val bytes = generateWallpaperBitmap(context, wp)
                            val result = MediaFileManager.saveImageToGallery(context, bytes, wp.titleAr)
                            isSaving = false
                            if (result.isSuccess) {
                                Toast.makeText(context, "تم حفظ الخلفية بنجاح في ألبوم الصور!", Toast.LENGTH_LONG).show()
                                previewingWallpaper = null
                            } else {
                                Toast.makeText(context, "تعذر الحفظ: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                    shape = RoundedCornerShape(10.dp),
                    enabled = !isSaving
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(color = EmeraldDeep, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Download, contentDescription = null, tint = EmeraldDeep, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("حفظ في ألبوم الصور", color = EmeraldDeep, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { previewingWallpaper = null },
                    enabled = !isSaving
                ) {
                    Text("إلغاء", color = TextSecondary)
                }
            },
            title = {
                Text(wp.titleAr, color = GoldAccent, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(wp.primaryColorHex))
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.Mosque,
                                contentDescription = null,
                                tint = Color(wp.secondaryColorHex),
                                modifier = Modifier.size(40.dp)
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = wp.calligraphyText,
                                color = Color.White,
                                fontSize = 13.sp,
                                lineHeight = 20.sp,
                                textAlign = TextAlign.Center,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = wp.subtitleAr,
                        color = TextSecondary,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    )
                }
            },
            containerColor = EmeraldSurface,
            shape = RoundedCornerShape(20.dp)
        )
    }
}

/**
 * Generates a high resolution (1080x1920) crisp wallpaper bitmap with gradient and Islamic typography
 */
private suspend fun generateWallpaperBitmap(context: Context, wp: WallpaperItem): ByteArray = withContext(Dispatchers.Default) {
    val width = 1080
    val height = 1920
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    // Gradient background
    val gradient = LinearGradient(
        0f, 0f, 0f, height.toFloat(),
        wp.primaryColorHex.toInt(),
        0xFF061510.toInt(),
        Shader.TileMode.CLAMP
    )
    val bgPaint = Paint().apply {
        shader = gradient
        isAntiAlias = true
    }
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

    // Decorative Islamic border
    val borderPaint = Paint().apply {
        color = wp.secondaryColorHex.toInt()
        alpha = 80
        style = Paint.Style.STROKE
        strokeWidth = 6f
        isAntiAlias = true
    }
    canvas.drawRoundRect(60f, 60f, (width - 60).toFloat(), (height - 60).toFloat(), 40f, 40f, borderPaint)

    // Calligraphy / Verse Text
    val textPaint = Paint().apply {
        color = android.graphics.Color.WHITE
        textSize = 54f
        isAntiAlias = true
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }

    // Split text into lines
    val words = wp.calligraphyText.split(" ")
    val lines = mutableListOf<String>()
    var currentLine = ""
    for (word in words) {
        val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
        if (textPaint.measureText(testLine) < 800) {
            currentLine = testLine
        } else {
            lines.add(currentLine)
            currentLine = word
        }
    }
    if (currentLine.isNotEmpty()) lines.add(currentLine)

    val startY = height / 2f - (lines.size * 70f) / 2f
    lines.forEachIndexed { i, line ->
        canvas.drawText(line, width / 2f, startY + (i * 70f), textPaint)
    }

    // App Branding at bottom
    val brandPaint = Paint().apply {
        color = wp.secondaryColorHex.toInt()
        textSize = 34f
        isAntiAlias = true
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }
    canvas.drawText("تطبيق المؤذن", width / 2f, (height - 120).toFloat(), brandPaint)

    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
    bitmap.recycle()
    stream.toByteArray()
}
