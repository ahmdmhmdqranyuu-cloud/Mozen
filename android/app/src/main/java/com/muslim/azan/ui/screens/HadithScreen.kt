package com.muslim.azan.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.model.HadithItem
import com.muslim.azan.theme.*

@Composable
fun HadithScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val hadiths = listOf(
        HadithItem(
            1, "إنما الأعمال بالنيات",
            "عَنْ أَمِيرِ الْمُؤْمِنِينَ أَبِي حَفْصٍ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ ﷺ يَقُولُ: «إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى..»",
            "عمر بن الخطاب رضي الله عنه", "صحيح البخاري ومسلم",
            "هذا الحديث أصل عظيم من أصول الإسلام، وعليه مدار الدين كله؛ فصلاح العمل بصلاح النية، وفساده بفسادها."
        ),
        HadithItem(
            2, "مراتب الدين (حديث جبريل)",
            "عَنْ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ أَيْضاً قَالَ: بَيْنَمَا نَحْنُ عِنْدَ رَسُولِ اللَّهِ ﷺ ذَاتَ يَوْمٍ إِذْ طَلَعَ عَلَيْنَا رَجُلٌ شَدِيدُ بَيَاضِ الثِّيَابِ شَدِيدُ سَوَادِ الشَّعْرِ.. فَقَالَ: يَا مُحَمَّدُ أَخْبِرْنِي عَنِ الإِسْلاَمِ..",
            "عمر بن الخطاب رضي الله عنه", "صحيح مسلم",
            "بيان أركان الإسلام الخمسة، وأركان الإيمان الستة، ومرتبة الإحسان العظمى."
        ),
        HadithItem(
            3, "بني الإسلام على خمس",
            "عَنِ ابْنِ عُمَرَ رَضِيَ اللَّهُ عَنْهُمَا قَالَ: قَالَ رَسُولُ اللَّهِ ﷺ: «بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّداً رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَالْحَجِّ، وَصَوْمِ رَمَضَانَ».",
            "عبد الله بن عمر رضي الله عنهما", "صحيح البخاري ومسلم",
            "تشبيه الإسلام بالبنيان الذي لا يقوم إلا على هذه القواعد الخمس المتينة."
        ),
        HadithItem(
            4, "الدين النصيحة",
            "عَنْ أَبِي رُقَيَّةَ تَمِيمِ بْنِ أَوْسٍ الدَّارِيِّ رَضِيَ اللَّهُ عَنْهُ أَنَّ النَّبِيَّ ﷺ قَالَ: «الدِّينُ النَّصِيحَةُ». قُلْنَا: لِمَنْ؟ قَالَ: «لِلَّهِ، وَلِكِتَابِهِ، وَلِرَسُولِهِ، وَلأَئِمَّةِ الْمُسْلِمِينَ، وَعَامَّتِهِمْ».",
            "تميم الداري رضي الله عنه", "صحيح مسلم",
            "النصيحة كلمة جامعة تتضمن قيام الناصح بحقوق المنصوح له وإخلاص المودة له."
        )
    )

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
                text = "الأحاديث النبوية الشريفة",
                color = TextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            items(hadiths, key = { it.id }) { h ->
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
                                text = "الحديث رقم ${h.id} • ${h.title}",
                                color = GoldAccent,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )

                            IconButton(
                                onClick = {
                                    val shareText = "${h.hadithArabic}\n\nالراوي: ${h.narrator} | المصدر: ${h.source}\n- من تطبيق المؤذن"
                                    val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                        putExtra(Intent.EXTRA_TEXT, shareText)
                                        type = "text/plain"
                                    }
                                    context.startActivity(Intent.createChooser(sendIntent, "مشاركة الحديث الشريف"))
                                }
                            ) {
                                Icon(Icons.Default.Share, contentDescription = "مشاركة", tint = TextSecondary)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = h.hadithArabic,
                            color = TextPrimary,
                            fontSize = 15.sp,
                            lineHeight = 26.sp,
                            textAlign = TextAlign.Right,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "المصدر: ${h.source}",
                            color = TextSecondary,
                            fontSize = 12.sp
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "الشرح المستفاد: ${h.sharh}",
                            color = GoldLight,
                            fontSize = 12.sp,
                            lineHeight = 18.sp,
                            textAlign = TextAlign.Right,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}
