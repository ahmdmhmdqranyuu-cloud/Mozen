package com.muslim.azan.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenSubWidgetBox
import com.muslim.azan.ui.components.MoazenWidgetCard

data class RuqyahEntry(
    val id: String,
    val category: String,
    val title: String,
    val arabicText: String,
    val benefit: String,
    val repeatCount: Int
)

private val RUQYAH_ENTRIES = listOf(
    RuqyahEntry(
        id = "r-1",
        category = "الرقية العامة والتحصين",
        title = "سورة الفاتحة (الشافية الكافية)",
        arabicText = "﴿بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ * الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ * الرَّحْمَٰنِ الرَّحِيمِ * مَالِكِ يَوْمِ الدِّينِ * إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ * اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ * صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ﴾",
        benefit = "تُقرأ 7 مرات للشفاء من كل داء، رقى بها الصحابي سيد القوم فشُفي بإذن الله وقال ﷺ: «وما يدريك أنها رقية».",
        repeatCount = 7
    ),
    RuqyahEntry(
        id = "r-2",
        category = "الرقية العامة والتحصين",
        title = "آية الكرسي (أعظم آية للتحصين)",
        arabicText = "﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾",
        benefit = "من قرأها لم يزل عليه من الله حافظ ولا يقربه شيطان حتى يصبح، وهي أعظم تحصين.",
        repeatCount = 3
    ),
    RuqyahEntry(
        id = "r-3",
        category = "الرقية العامة والتحصين",
        title = "خواتيم سورة البقرة (الآيتان 285-286)",
        arabicText = "﴿آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ... لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ﴾",
        benefit = "من قرأهما في ليلة كفتاه من كل شر وآفة وعين وحسد.",
        repeatCount = 1
    ),
    RuqyahEntry(
        id = "r-4",
        category = "رقية العين والحسد",
        title = "سورتا الفلق والناس والإخلاص",
        arabicText = "﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ * مِن شَرِّ مَا خَلَقَ * وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ * وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ * وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ﴾\n﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ * مَلِكِ النَّاسِ * إِلَٰهِ النَّاسِ * مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ * الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ * مِنَ الْجِنَّةِ وَالنَّاسِ﴾",
        benefit = "ما تعوّذ متعوذ بمثل المعوذتين أبداً، وتُقرأ 3 مرات مع النفث والمسح.",
        repeatCount = 3
    ),
    RuqyahEntry(
        id = "r-5",
        category = "رقية العين والحسد",
        title = "رقية جبريل عليه السلام الشاملة",
        arabicText = "«بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ».",
        benefit = "رقى بها جبريل عليه السلام النبي ﷺ وهي ثابتة في صحيح مسلم للوقاية من العين والحسد.",
        repeatCount = 3
    ),
    RuqyahEntry(
        id = "r-6",
        category = "رقية الشفاء والأوجاع",
        title = "دعاء وضع اليد على موضع الألم",
        arabicText = "ضع يدك على الذي يألم من جسدك وقل: «بِسْمِ اللَّهِ» (ثلاثاً)، وقل سبع مرات: «أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ».",
        benefit = "وصفة نبوية مباشرة في صحيح مسلم لإزالة الوجع والألم بإذن الله.",
        repeatCount = 7
    ),
    RuqyahEntry(
        id = "r-7",
        category = "رقية الشفاء والأوجاع",
        title = "دعاء الشفاء التام",
        arabicText = "«اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَاسَ، اشْفِهِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا».",
        benefit = "كان النبي ﷺ يعوّذ به المريض من أهله وأصحابه فيُبرأ بإذن الله.",
        repeatCount = 3
    ),
    RuqyahEntry(
        id = "r-8",
        category = "السكينة وتحصين الأبناء",
        title = "تحصين الأبناء بكلمات الله التامة",
        arabicText = "«أُعِيذُكُمَا بِكَلِمَاتِ اللَّهِ التَّامَّةِ، مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ».",
        benefit = "كان النبي ﷺ يعوّذ به الحسن والحسين ويقول: إن أباكما إبراهيم كان يعوّذ بها إسماعيل وإسحاق.",
        repeatCount = 3
    ),
    RuqyahEntry(
        id = "r-9",
        category = "السنن النبوية اليومية",
        title = "صلاة الضحى وقيام الليل والرواتب",
        arabicText = "«يُصْبِحُ عَلَى كُلِّ سُلَامَى مِنْ أَحَدِكُمْ صَدَقَةٌ... وَيُجْزِئُ مِنْ ذَلِكَ رَكْعَتَانِ يَرْكَعُهُمَا مِنَ الضُّحَى» — «رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا».",
        benefit = "المداومة على السنن الرواتب وصلاة الضحى والوتر تفتح أبواب البركة والحفظ الإلهي.",
        repeatCount = 1
    )
)

@Composable
fun RuqyahScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val haptic = LocalHapticFeedback.current
    var selectedCategory by remember { mutableStateOf("الكل") }
    var selectedEntry by remember { mutableStateOf<RuqyahEntry?>(null) }
    val repeatMap = remember { mutableStateMapOf<String, Int>() }

    val isPlaying by NativeAudioPlayerManager.isPlaying.collectAsState()
    val currentTag by NativeAudioPlayerManager.currentTrackTag.collectAsState()
    val isRuqyahAudioPlaying = isPlaying && currentTag == "ruqyah_shariah"

    BackHandler(enabled = selectedEntry != null) {
        selectedEntry = null
    }

    val categories = remember {
        listOf(
            "الكل",
            "الرقية العامة والتحصين",
            "رقية العين والحسد",
            "رقية الشفاء والأوجاع",
            "السكينة وتحصين الأبناء",
            "السنن النبوية اليومية"
        )
    }

    val filtered = remember(selectedCategory) {
        if (selectedCategory == "الكل") RUQYAH_ENTRIES
        else RUQYAH_ENTRIES.filter { it.category == selectedCategory }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MuslimPlusCanvasBrush)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { if (selectedEntry != null) selectedEntry = null else onBack() }) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = MoazenInkEmerald)
                }
                Column {
                    Text(
                        text = selectedEntry?.title ?: "الرقية الشرعية والسنن النبوية",
                        color = MoazenInkEmerald,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "تحصين كامل من الكتاب والسنة • يعمل بدون إنترنت",
                        color = MoazenInkMuted,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // Offline Ruqyah Audio Player Widget
        MoazenWidgetCard(
            cornerRadius = 16.dp,
            borderColor = MoazenGold,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(MoazenInkEmerald.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Shield, contentDescription = null, tint = MoazenInkEmerald)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "تشغيل الرقية الشرعية كاملة (بدون إنترنت)",
                            color = MoazenInkEmerald,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (isRuqyahAudioPlaying) "جارٍ تشغيل الرقية الشرعية الشاملة..." else "تلاوة خاشعة من الكتاب والسنة للتحصين والشفاء",
                            color = MoazenInkMuted,
                            fontSize = 10.5.sp
                        )
                    }
                }
                Button(
                    onClick = {
                        if (isRuqyahAudioPlaying) {
                            NativeAudioPlayerManager.stop()
                        } else {
                            NativeAudioPlayerManager.playAssetAudio(
                                context = context,
                                assetPath = "audio/ruqyah_shariah.mp3",
                                title = "الرقية الشرعية الشاملة",
                                subtitle = "تحصين كامل بدون إنترنت",
                                trackTag = "ruqyah_shariah"
                            )
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isRuqyahAudioPlaying) ErrorRed else MuslimPlusPillEmerald
                    ),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        imageVector = if (isRuqyahAudioPlaying) Icons.Default.Stop else Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (isRuqyahAudioPlaying) "إيقاف" else "تشغيل",
                        color = Color.White,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        if (selectedEntry != null) {
            val item = selectedEntry!!
            val currentCount = repeatMap[item.id] ?: 0
            val done = currentCount >= item.repeatCount

            MoazenWidgetCard(
                cornerRadius = 18.dp,
                borderColor = if (done) EmeraldPrimary else MoazenGold,
                borderWidth = 1.5.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = item.category,
                        color = MoazenGoldDark,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = item.title,
                        color = MoazenInkEmerald,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    MoazenSubWidgetBox(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = item.arabicText,
                            color = MoazenInkPrimary,
                            fontSize = 16.5.sp,
                            lineHeight = 28.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(14.dp)
                        )
                    }
                    Text(
                        text = "الفضل والأثر: ${item.benefit}",
                        color = MoazenInkMuted,
                        fontSize = 12.sp,
                        lineHeight = 19.sp
                    )
                    Button(
                        onClick = {
                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                            repeatMap[item.id] = (currentCount + 1).coerceAtMost(item.repeatCount)
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (done) EmeraldPrimary else MoazenGold
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = if (done) "اكتملت القراءة (${item.repeatCount}/${item.repeatCount}) ✓" else "عدّاد التكرار ($currentCount / ${item.repeatCount})",
                            color = if (done) Color.White else MoazenInkPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                                cm?.setPrimaryClip(ClipData.newPlainText("Ruqyah", "${item.title}\n\n${item.arabicText}"))
                                Toast.makeText(context, "تم النسخ", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("نسخ", fontWeight = FontWeight.Bold)
                        }
                        Button(
                            onClick = {
                                val share = Intent(Intent.ACTION_SEND).apply {
                                    putExtra(Intent.EXTRA_TEXT, "🛡️ ${item.title}\n\n${item.arabicText}\n\n🕌 عبر تطبيق رفيق المسلم")
                                    type = "text/plain"
                                }
                                runCatching { context.startActivity(Intent.createChooser(share, "مشاركة الرقية")) }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("مشاركة", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        } else {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                categories.forEach { cat ->
                    val active = selectedCategory == cat
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (active) MuslimPlusPillEmerald else MoazenCardStart,
                        border = BorderStroke(1.dp, if (active) MuslimPlusPillEmerald else MoazenCardBorder),
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { selectedCategory = cat }
                    ) {
                        Text(
                            text = cat,
                            color = if (active) Color.White else MoazenInkPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(filtered, key = { it.id }) { item ->
                    val cur = repeatMap[item.id] ?: 0
                    val done = cur >= item.repeatCount
                    MoazenWidgetCard(
                        cornerRadius = 14.dp,
                        borderColor = if (done) EmeraldPrimary else MoazenCardBorder,
                        onClick = { selectedEntry = item },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.category,
                                    color = MoazenGoldDark,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = item.title,
                                    color = MoazenInkEmerald,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = item.arabicText,
                                    color = MoazenInkMuted,
                                    fontSize = 11.5.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (done) EmeraldPrimary else MoazenSubCardBg
                            ) {
                                Text(
                                    text = "$cur/${item.repeatCount}",
                                    color = if (done) Color.White else MoazenInkPrimary,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
