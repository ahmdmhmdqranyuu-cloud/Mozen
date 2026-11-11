package com.muslim.azan.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.theme.*

data class RitualStep(
    val id: Int,
    val title: String,
    val dayOrStage: String,
    val description: String,
    val duaOrDhikr: String? = null,
    val notes: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HajjScreen(onBack: () -> Unit) {
    var selectedTab by remember { mutableStateOf(0) } // 0 = Umrah, 1 = Hajj

    val umrahSteps = remember {
        listOf(
            RitualStep(
                id = 1,
                title = "الإحرام من الميقات والتلبية",
                dayOrStage = "الخطوة الأولى",
                description = "الاغتسال ولبس ملابس الإحرام (للرجال رداء وإزار أبيضين، وللنساء لباس ساتر من غير نقاب أو قفازين)، ثم عقد النية وقول: «لَبَّيْكَ عُمْرَةً».",
                duaOrDhikr = "«لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لا شَرِيكَ لَكَ».",
                notes = "يستمر في التلبية حتى يبدأ في طواف الكعبة المشرفة."
            ),
            RitualStep(
                id = 2,
                title = "طواف العمرة (سبعة أشواط)",
                dayOrStage = "الخطوة الثانية",
                description = "البدء من محاذاة الحجر الأسود واستقباله والتكبير، وجعل الكعبة على يسارك والطواف 7 أشواط كاملة. يسن للرجل الاضطباع (كشف الكتف الأيمن) والرمل (الإسراع في المشي) في الأشواط الثلاثة الأولى.",
                duaOrDhikr = "بين الركن اليماني والحجر الأسود: «رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ». ويدعو بما يشاء من خيري الدنيا والآخرة.",
                notes = "يشترط للطواف الطهارة والوضوء وستر العورة."
            ),
            RitualStep(
                id = 3,
                title = "صلاة ركعتي الطواف والشرب من زمزم",
                dayOrStage = "الخطوة الثالثة",
                description = "صلاة ركعتين خلف مقام إبراهيم عليه السلام إن تيسر وإلا ففي أي موضع بالمسجد الحرام، يقرأ في الأولى سورة الكافرون وفي الثانية سورة الإخلاص. ثم الشرب من ماء زمزم والتضلع منه.",
                duaOrDhikr = "«اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ».",
                notes = "ماء زمزم لما شُرب له."
            ),
            RitualStep(
                id = 4,
                title = "السعي بين الصفا والمروة (سبعة أشواط)",
                dayOrStage = "الخطوة الرابعة",
                description = "البدء من جبل الصفا واستقبال الكعبة والدعاء، ثم التوجه نحو المروة (شوط أول)، ثم العودة للصفا (شوط ثانٍ)، وهكذا حتى يكتمل سبعة أشواط منتهية بالمروة.",
                duaOrDhikr = "عند رقي الصفا والمروة: «إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ... لا إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ».",
                notes = "يسن للرجال الهرولة بين الميلين الأخضرين."
            ),
            RitualStep(
                id = 5,
                title = "الحلق أو التقصير (التحلل الكامل)",
                dayOrStage = "الخطوة الخامسة",
                description = "حلق جميع شعر الرأس أو تقصيره من كافة جوانبه للرجل (والحلق أفضل)، وتقصير قيد أنملة (نحو 2 سم) من أطراف شعر المرأة. وبذلك تتم العمرة ويتحلل المحرم تحللاً كاملاً.",
                notes = "تقبل الله طاعتكم وعمرتكم!"
            )
        )
    }

    val hajjSteps = remember {
        listOf(
            RitualStep(
                id = 1,
                title = "يوم التروية والإحرام بالحج",
                dayOrStage = "اليوم الثامن من ذي الحجة",
                description = "يحرم الحاج من مكانه بمكة، يغتسل ويتطيب ويلبس إحرامه وينوي: «لَبَّيْكَ حَجًّا»، ثم يتوجه إلى منى للمبيت بها وصلاة الظهر والعصر والمغرب والعشاء وفجر التاسع قصراً من غير جمع.",
                duaOrDhikr = "الإكثار من التلبية: «لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لا شَرِيكَ لَكَ لَبَّيْكَ»."
            ),
            RitualStep(
                id = 2,
                title = "الوقوف بعرفة (ركن الحج الأعظم)",
                dayOrStage = "اليوم التاسع من ذي الحجة",
                description = "الانطلاق بعد شروق شمس اليوم التاسع إلى صعيد عرفات، والجمع والقصر لصلاتي الظهر والعصر جمع تقديم بأذان وإقامتين، والتفرغ التام للذكر والدعاء والتضرع حتى غروب الشمس.",
                duaOrDhikr = "«خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ، وَخَيْرُ مَا قُلْتُ أَنَا وَالنَّبِيُّونَ مِنْ قَبْلِي: لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ».",
                notes = "قال رسول الله ﷺ: «الْحَجُّ عَرَفَةُ». لا يجوز مغادرة عرفة قبل غروب الشمس."
            ),
            RitualStep(
                id = 3,
                title = "الإفاضة والمبيت بمزدلفة",
                dayOrStage = "ليلة العاشر من ذي الحجة",
                description = "التوجه بسكينة ووقار بعد الغروب إلى مزدلفة، وصلاة المغرب والعشاء جمع تأخير وقصراً للعشاء، والمبيت بها حتى صلاة الفجر، وجمع حصيات الجمار (7 حصيات لجمرة العقبة).",
                duaOrDhikr = "الوقوف عند المشعر الحرام وذكر الله والدعاء بعد صلاة الفجر حتى يسفر الصباح جداً."
            ),
            RitualStep(
                id = 4,
                title = "يوم النحر وأعمال يوم العيد",
                dayOrStage = "اليوم العاشر من ذي الحجة",
                description = "يوم الحج الأكبر وفيه 4 أعمال: 1) رمي جمرة العقبة الكبرى بـ 7 حصيات متعاقبات مع التكبير، 2) ذبح الهدي للمتمتع والقارن، 3) الحلق أو التقصير (وهنا يحصل التحلل الأول)، 4) التوجه لمكة لأداء طواف الإفاضة والسعي (وهنا يحصل التحلل الثاني الكامل).",
                notes = "إذا فعل الحاج اثنين من هذه الثلاثة: (الرمي، الحلق، الطواف مع السعي) تحلل التحلل الأول."
            ),
            RitualStep(
                id = 5,
                title = "أيام التشريق ورمي الجمرات الثلاث",
                dayOrStage = "أيام 11 و 12 و 13 ذي الحجة",
                description = "المبيت بمنى ليالي التشريق، ورمي الجمرات الثلاث (الصغرى فالوسطى فالكبرى) كل جمرة بـ 7 حصيات بعد زوال الشمس (دخول وقت الظهر)، والوقوف للدعاء بعد الجمرة الصغرى والوسطى.",
                notes = "يجوز للمتعجل الخروج من منى في اليوم الثاني عشر قبل غروب الشمس."
            ),
            RitualStep(
                id = 6,
                title = "طواف الوداع",
                dayOrStage = "خاتمة أعمال الحج",
                description = "الطواف حول الكعبة المشرفة سبعة أشواط قبل مغادرة مكة المكرمة ليكون آخر عهد الحاج بالبيت الحرام.",
                notes = "خُفف عن الحائض والنفساء فلم يُلزمْنَ بطواف الوداع."
            )
        )
    }

    val currentList = if (selectedTab == 0) umrahSteps else hajjSteps

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("مناسك الحج والعمرة", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
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
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Segmented Picker
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(EmeraldSurface)
                        .padding(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (selectedTab == 0) GoldAccent else Color.Transparent)
                            .clickable { selectedTab = 0 }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "مناسك العمرة",
                            color = if (selectedTab == 0) EmeraldDeep else TextSecondary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (selectedTab == 1) GoldAccent else Color.Transparent)
                            .clickable { selectedTab = 1 }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "مناسك الحج",
                            color = if (selectedTab == 1) EmeraldDeep else TextSecondary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // Introduction Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(GoldAccent.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Mosque, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(26.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = if (selectedTab == 0) "دليل المعتمر خطوة بخطوة" else "أعمال الحج خطوة بخطوة",
                                color = GoldAccent,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "دليل مبسط وموثوق وفق سنة النبي المصطفى ﷺ",
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            // Step items
            items(currentList) { step ->
                var expanded by remember { mutableStateOf(false) }

                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { expanded = !expanded }
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(GoldAccent),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${step.id}",
                                    color = EmeraldDeep,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = step.title,
                                    color = TextPrimary,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = step.dayOrStage,
                                    color = GoldLight,
                                    fontSize = 12.sp
                                )
                            }

                            Icon(
                                imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null,
                                tint = TextSecondary
                            )
                        }

                        AnimatedVisibility(visible = expanded) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 14.dp)
                            ) {
                                Text(
                                    text = step.description,
                                    color = TextPrimary,
                                    fontSize = 14.sp,
                                    lineHeight = 22.sp,
                                    textAlign = TextAlign.Right
                                )

                                step.duaOrDhikr?.let { dua ->
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Card(
                                        shape = RoundedCornerShape(12.dp),
                                        colors = CardDefaults.cardColors(containerColor = EmeraldSurfaceLight),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Default.RecordVoiceOver, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text("الدعاء أو الذكر المستحب", color = GoldAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = dua,
                                                color = GoldLight,
                                                fontSize = 13.sp,
                                                lineHeight = 22.sp,
                                                fontWeight = FontWeight.Medium,
                                                textAlign = TextAlign.Right
                                            )
                                        }
                                    }
                                }

                                step.notes?.let { note ->
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "💡 $note",
                                        color = TextSecondary,
                                        fontSize = 12.sp,
                                        lineHeight = 18.sp,
                                        textAlign = TextAlign.Right
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
