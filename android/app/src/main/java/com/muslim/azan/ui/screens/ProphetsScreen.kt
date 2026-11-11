package com.muslim.azan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.theme.*

data class ProphetStory(
    val name: String,
    val title: String,
    val summary: String,
    val quranAyah: String,
    val lessons: String
)

@Composable
fun ProphetsScreen(
    onBack: () -> Unit
) {
    val stories = listOf(
        ProphetStory(
            "آدم عليه السلام",
            "أبو البشر وأول الأنبياء",
            "خلقه الله تعالى بيده ونفخ فيه من روحه وأسجد له ملائكته وعلمه الأسماء كلها، وأهبط إلى الأرض لعمارتها بالتوحيد.",
            "«إِنِّي جَاعِلٌ فِي الأَرْضِ خَلِيفَةً» - سورة البقرة",
            "فضل العلم والتوبة السريعة عند الوقوع في الخطأ والاستغفار الدائم."
        ),
        ProphetStory(
            "نوح عليه السلام",
            "شيخ المرسلين وصاحب الفلك",
            "لبث في قومه يدعوهم إلى عبادة الله وحده تسعمائة وخمسين عاماً بالليل والنهار، وأمره الله بصنع الفلك لنجاة المؤمنين.",
            "«وَاصْنَعِ الْفُلْكَ بِأَعْيُنِنَا وَوَحْيِنَا» - سورة هود",
            "الصبر اللامحدود في الدعوة إلى الحق، واليقين بأن النجاة للمؤمنين فقط."
        ),
        ProphetStory(
            "إبراهيم عليه السلام",
            "خليل الرحمن وأبو الأنبياء",
            "حطم الأصنام بيده وألقي في النار فكانت برداً وسلاماً عليه، وبنى الكعبة المشرفة مع ولده إسماعيل ودعا للأمة المحمدية.",
            "«وَإِذْ يَرْفَعُ إِبْرَاهِيمُ الْقَوَاعِدَ مِنَ الْبَيْتِ وَإِسْمَاعِيلُ» - سورة البقرة",
            "كمال التوحيد والاستسلام التام لأمر الله في أصعب الابتلاءات."
        ),
        ProphetStory(
            "يوسف عليه السلام",
            "الصديق الكريم ابن الكريم",
            "تعرض لكيد إخوته وإلقائه في الجب ثم الفتنة والسجن، ثم مكن الله له في الأرض وصار عزيز مصر وعفا عن إخوته.",
            "«إِنَّهُ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ» - سورة يوسف",
            "العفة والإخلاص، وبشارة الفرج بعد الصبر على البلاء."
        ),
        ProphetStory(
            "موسى عليه السلام",
            "كليم الله المنصور على فرعون",
            "أرسله الله بالمعجزات الباهرة واليد البيضاء وفلق البحر لإنجاء بني إسرائيل وهلاك فرعون وجنوده.",
            "«قَالَ كَلَّا إِنَّ مَعِيَ رَبِّي سَيَهْدِينِ» - سورة الشعراء",
            "الثقة المطلقة في نصرة الله للحق على أعتى الظالمين."
        ),
        ProphetStory(
            "يونس عليه السلام",
            "ذا النون صاحب الحوت",
            "التقمه الحوت وهو مليم، فنادى في الظلمات بالدعاء العظيم، فاستجاب الله له ونجاه من الغم.",
            "«فَنَادَىٰ فِي الظُّلُمَاتِ أَن لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ» - سورة الأنبياء",
            "عظمة التنزيه والاعتراف بالذنب في تفريج أشد الكربات."
        ),
        ProphetStory(
            "عيسى عليه السلام",
            "كلمة الله وروحه المؤيد بالمعجزات",
            "ولد بمعجزة إلهية من غير أب لمريم العذراء، وأبرأ الأكمه والأبرص وأحيى الموتى بإذن الله وبشر بالنبي الخاتم.",
            "«قَالَ إِنِّي عَبْدُ اللَّهِ آتَانِيَ الْكِتَابَ وَجَعَلَنِي نَبِيًّا» - سورة مريم",
            "التأكيد على عبودية الأنبياء لله وتنزيه الخالق عن الشريك والولد."
        ),
        ProphetStory(
            "محمد ﷺ",
            "خاتم النبيين ورحمة الله للعالمين",
            "المبعوث بأكمل رسالة وأعظم كتاب للبشرية كافة، صاحب الخلق العظيم والشفاعة الكبرى والحوض المورود.",
            "«وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ» - سورة الأنبياء",
            "اتباع سنته والتمسك بهديه هو مفتاح النجاة والسعادة الأبدية."
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
                text = "قصص الأنبياء والمرسلين",
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
            items(stories, key = { it.name }) { story ->
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
                                text = story.name,
                                color = GoldAccent,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = story.title,
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = story.summary,
                            color = TextPrimary,
                            fontSize = 14.sp,
                            lineHeight = 22.sp,
                            textAlign = TextAlign.Right,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = story.quranAyah,
                            color = GoldLight,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            textAlign = TextAlign.Right,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "العبر والفوائد: ${story.lessons}",
                            color = TextTertiary,
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
