package com.muslim.azan.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.model.DuaItem
import com.muslim.azan.theme.*

@Composable
fun DuasScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val initialDuas = listOf(
        DuaItem("d1", "دعاء الفرج وكشف الكرب", "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ.", "القرآن الكريم - سورة الأنبياء", "الكرب والهم"),
        DuaItem("d2", "دعاء تيسير الأمور", "رَبِّ اشْرَحْ لِي صَدْرِي * وَيَسِّرْ لِي أَمْرِي * وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي * يَفْقَهُوا قَوْلِي.", "القرآن الكريم - سورة طه", "تيسير الأمور"),
        DuaItem("d3", "دعاء الهداية والرحمة", "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ.", "القرآن الكريم - سورة آل عمران", "الهداية والرحمة"),
        DuaItem("d4", "دعاء الوالدين", "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا.", "القرآن الكريم - سورة الإسراء", "بر الوالدين"),
        DuaItem("d5", "سؤال العفو والعافية", "اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي.", "سنن الترمذي", "العفو والمغفرة")
    )

    var duas by remember { mutableStateOf(initialDuas) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = TextPrimary)
            }
            Text(
                text = "الأدعية المأثورة الجامعة",
                color = TextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(duas, key = { it.id }) { dua ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = dua.title,
                                color = GoldAccent,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )

                            Row {
                                IconButton(
                                    onClick = {
                                        duas = duas.map {
                                            if (it.id == dua.id) it.copy(isFavorite = !it.isFavorite) else it
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = if (dua.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                        contentDescription = "مفضلة",
                                        tint = if (dua.isFavorite) GoldAccent else TextSecondary
                                    )
                                }

                                IconButton(
                                    onClick = {
                                        val shareText = "«${dua.arabicText}»\n- ${dua.source}\nتطبيق المؤذن"
                                        val intent = Intent(Intent.ACTION_SEND).apply {
                                            putExtra(Intent.EXTRA_TEXT, shareText)
                                            type = "text/plain"
                                        }
                                        context.startActivity(Intent.createChooser(intent, "مشاركة الدعاء"))
                                    }
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = "مشاركة", tint = TextSecondary)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = dua.arabicText,
                            color = TextPrimary,
                            fontSize = 17.sp,
                            lineHeight = 30.sp,
                            textAlign = TextAlign.Right,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "المصدر: ${dua.source}",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }
}
