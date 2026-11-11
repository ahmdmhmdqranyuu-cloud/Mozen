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

data class SeerahItem(
    val title: String,
    val period: String,
    val summary: String,
    val lessons: String
)

@Composable
fun SeerahScreen(
    onBack: () -> Unit
) {
    val items = listOf(
        SeerahItem(
            "المولد الشريف والنشأة المباركة",
            "قبل البعثة النبوية",
            "ولد النبي ﷺ في عام الفيل بمكة المكرمة يتيماً، ونشأ في رعاية جده عبد المطلب ثم عمه أبي طالب، واشتهر بالصادق الأمين.",
            "حفظ الله لنبيه منذ صغره، وأهمية الصدق والأمانة في بناء الشخصية المؤمنة."
        ),
        SeerahItem(
            "نزول الوحي في غار حراء",
            "بداية البعثة النبوية",
            "نزل جبريل عليه السلام بـ «اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ» في غار حراء، إيذاناً ببدء رسالة الإسلام الخاتمة للبشرية جمعاء.",
            "فضل العلم والتعلم، واليقين بنصرة الله للحق."
        ),
        SeerahItem(
            "الهجرة النبوية المباركة",
            "1 هـ - المدينة المنورة",
            "هاجر النبي ﷺ وصاحبه أبو بكر الصديق إلى المدينة المنورة، وبنى المسجد النبوي الشريف وآخى بين المهاجرين والأنصار.",
            "التخطيط والأخذ بالأسباب مع تمام التوكل على الله، وأثر الأخوة الإيمانية."
        ),
        SeerahItem(
            "غزوة بدر الكبرى",
            "2 هـ - يوم الفرقان",
            "أول معركة فاصلة في تاريخ الإسلام، نصر الله فيها جنده المؤمنين رغم قلة عددهم وعتادهم أمام قريش.",
            "النصر من عند الله وحده، والإخلاص سبب التأييد الإلهي."
        ),
        SeerahItem(
            "فتح مكة الأعظم",
            "8 هـ - مكة المكرمة",
            "دخل النبي ﷺ مكة فاتحاً متواضعاً لله تعالى، وطهر الكعبة من الأصنام، وعفا عن أهل مكة قائلاً: «اذهبوا فأنتم الطلقاء».",
            "العفو عند المقدرة، والتواضع عند النصر والتمكين."
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
                text = "السيرة النبوية العطرة",
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
            items(items, key = { it.title }) { item ->
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
                                text = item.title,
                                color = GoldAccent,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = item.period,
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = item.summary,
                            color = TextPrimary,
                            fontSize = 14.sp,
                            lineHeight = 22.sp,
                            textAlign = TextAlign.Right,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "الدروس والعبر: ${item.lessons}",
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
