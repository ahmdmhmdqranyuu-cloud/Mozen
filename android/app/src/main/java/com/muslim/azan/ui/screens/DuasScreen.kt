package com.muslim.azan.ui.screens

import android.content.Intent
import android.widget.Toast
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
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.model.DuaItem
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard

@Composable
fun DuasScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val initialFavs = remember { prefs.getFavoriteDuaIds() }
    val initialDuas = remember(initialFavs) {
        listOf(
            DuaItem("d1", "دعاء الفرج وكشف الكرب", "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ.", "القرآن الكريم - سورة الأنبياء", "الكرب والهم", isFavorite = "d1" in initialFavs),
            DuaItem("d2", "دعاء تيسير الأمور", "رَبِّ اشْرَحْ لِي صَدْرِي * وَيَسِّرْ لِي أَمْرِي * وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي * يَفْقَهُوا قَوْلِي.", "القرآن الكريم - سورة طه", "تيسير الأمور", isFavorite = "d2" in initialFavs),
            DuaItem("d3", "دعاء الهداية والرحمة", "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ.", "القرآن الكريم - سورة آل عمران", "الهداية والرحمة", isFavorite = "d3" in initialFavs),
            DuaItem("d4", "دعاء الوالدين", "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا.", "القرآن الكريم - سورة الإسراء", "بر الوالدين", isFavorite = "d4" in initialFavs),
            DuaItem("d5", "سؤال العفو والعافية", "اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي.", "سنن الترمذي", "العفو والمغفرة", isFavorite = "d5" in initialFavs)
        )
    }

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
                MoazenWidgetCard(
                    cornerRadius = 16.dp,
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
                                color = MoazenInkEmerald,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )

                            Row {
                                IconButton(
                                    onClick = {
                                        val favs = prefs.toggleFavoriteDuaId(dua.id)
                                        duas = duas.map { it.copy(isFavorite = it.id in favs) }
                                    }
                                ) {
                                    Icon(
                                        imageVector = if (dua.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                        contentDescription = "مفضلة",
                                        tint = if (dua.isFavorite) MoazenGoldDark else MoazenInkMuted
                                    )
                                }

                                IconButton(
                                    onClick = {
                                        val shareText = "«${dua.arabicText}»\n- ${dua.source}\nتطبيق مسلم بلس"
                                        val intent = Intent(Intent.ACTION_SEND).apply {
                                            putExtra(Intent.EXTRA_TEXT, shareText)
                                            type = "text/plain"
                                        }
                                        runCatching {
                                            context.startActivity(Intent.createChooser(intent, "مشاركة الدعاء"))
                                        }.onFailure {
                                            Toast.makeText(context, "تعذر العثور على تطبيق للمشاركة.", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = "مشاركة", tint = MoazenInkMuted)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = dua.arabicText,
                            color = MoazenInkPrimary,
                            fontSize = 17.sp,
                            lineHeight = 30.sp,
                            fontWeight = FontWeight.Medium,
                            textAlign = TextAlign.Right,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "المصدر: ${dua.source}",
                            color = MoazenInkMuted,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }
}
