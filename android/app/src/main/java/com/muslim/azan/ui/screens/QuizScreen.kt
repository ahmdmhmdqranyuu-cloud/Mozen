package com.muslim.azan.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.muslim.azan.ui.components.MoazenWidgetCard

data class QuizQuestion(
    val id: Int,
    val category: String,
    val question: String,
    val options: List<String>,
    val correctIndex: Int,
    val explanation: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizScreen(onBack: () -> Unit) {
    val questions = remember {
        listOf(
            QuizQuestion(
                id = 1,
                category = "القرآن الكريم",
                question = "ما هي أطول سورة في القرآن الكريم؟",
                options = listOf("سورة آل عمران", "سورة البقرة", "سورة النساء", "سورة المائدة"),
                correctIndex = 1,
                explanation = "سورة البقرة هي أطول سور القرآن بعدد 286 آية وفيها أطول آية وهي آية الدَّيْن."
            ),
            QuizQuestion(
                id = 2,
                category = "القرآن الكريم",
                question = "ما هي السورة التي تعدل ثلث القرآن الكريم؟",
                options = listOf("سورة الفاتحة", "سورة الإخلاص", "سورة الكوثر", "سورة الفلق"),
                correctIndex = 1,
                explanation = "صح عن النبي ﷺ أن سورة الإخلاص (قل هو الله أحد) تعدل ثلث القرآن لاشتمالها على التوحيد الخالص."
            ),
            QuizQuestion(
                id = 3,
                category = "السيرة النبوية",
                question = "في أي عام كانت غزوة بدر الكبرى؟",
                options = listOf("العام الأول للهجرة", "العام الثاني للهجرة", "العام الثالث للهجرة", "العام الخامس للهجرة"),
                correctIndex = 1,
                explanation = "وقعت غزوة بدر الكبرى في 17 رمضان من السنة الثانية للهجرة النبوية الشريفة."
            ),
            QuizQuestion(
                id = 4,
                category = "الصحابة الكرام",
                question = "من هو الصحابي الجليل الملقب بأمين هذه الأمة؟",
                options = listOf("سعد بن أبي وقاص", "أبو عبيدة عامر بن الجراح", "عثمان بن عفان", "علي بن أبي طالب"),
                correctIndex = 1,
                explanation = "قال النبي ﷺ: «لكل أمة أمين، وأمين هذه الأمة أبو عبيدة بن الجراح»."
            ),
            QuizQuestion(
                id = 5,
                category = "الفقه الإسلامي",
                question = "ما الركن الثاني من أركان الإسلام؟",
                options = listOf("إيتاء الزكاة", "إقامة الصلاة", "صوم رمضان", "حج البيت"),
                correctIndex = 1,
                explanation = "بني الإسلام على خمس: شهادة أن لا إله إلا الله، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت."
            ),
            QuizQuestion(
                id = 6,
                category = "القرآن الكريم",
                question = "ما هي السورة التي تسمى عروس القرآن؟",
                options = listOf("سورة الرحمن", "سورة يس", "سورة الواقعة", "سورة الملك"),
                correctIndex = 0,
                explanation = "ورد في الأثر تسمية سورة الرحمن بعروس القرآن لجمال نسقها وتكرار آلاء الله ونعمه فيها."
            ),
            QuizQuestion(
                id = 7,
                category = "السيرة النبوية",
                question = "كم استمرت الدعوة السرية في مكة المكرمة؟",
                options = listOf("سنة واحدة", "ثلاث سنوات", "خمس سنوات", "سبع سنوات"),
                correctIndex = 1,
                explanation = "دامت الدعوة السرية في مكة المكرمة 3 سنوات حتى نزل الأمر الإلهي: (فَاصْدَعْ بِمَا تُؤْمَرُ)."
            ),
            QuizQuestion(
                id = 8,
                category = "الحديث الشريف",
                question = "من راوي الحديث الأشهر: «إنما الأعمال بالنيات»؟",
                options = listOf("أبو هريرة رضي الله عنه", "عمر بن الخطاب رضي الله عنه", "عبدالله بن عمر رضي الله عنهما", "أنس بن مالك رضي الله عنه"),
                correctIndex = 1,
                explanation = "روى هذا الحديث أمير المؤمنين أبو حفص عمر بن الخطاب رضي الله عنه على المنبر في المدينة المنورة."
            )
        )
    }

    var currentIndex by remember { mutableStateOf(0) }
    var selectedOption by remember { mutableStateOf<Int?>(null) }
    var isAnswered by remember { mutableStateOf(false) }
    var score by remember { mutableStateOf(0) }
    var quizCompleted by remember { mutableStateOf(false) }

    val currentQ = questions.getOrNull(currentIndex)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("المسابقات الإسلامية", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
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
        if (quizCompleted) {
            // Result screen
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                MoazenWidgetCard(
                    cornerRadius = 24.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(MoazenGold.copy(alpha = 0.22f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.EmojiEvents, contentDescription = null, tint = MoazenGoldDark, modifier = Modifier.size(40.dp))
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "بارك الله فيك!",
                            color = MoazenInkEmerald,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "أتممت مسابقة المعرفة الإسلامية بنجاح",
                            color = MoazenInkMuted,
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Text(
                            text = "$score / ${questions.size}",
                            color = MoazenInkPrimary,
                            fontSize = 36.sp,
                            fontWeight = FontWeight.ExtraBold
                        )

                        Text(
                            text = if (score >= 6) "ممتاز! معرفة إسلامية متميزة ما شاء الله" else "جيد جدًا! واصل القراءة والتعلم وطلب العلم",
                            color = MoazenGoldDark,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(top = 8.dp)
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = {
                                currentIndex = 0
                                selectedOption = null
                                isAnswered = false
                                score = 0
                                quizCompleted = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("إعادة المسابقة", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }
                }
            }
        } else if (currentQ != null) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Progress & Category Bar
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "السؤال ${currentIndex + 1} من ${questions.size}",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(MoazenCardStart)
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = currentQ.category,
                                color = MoazenInkEmerald,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    LinearProgressIndicator(
                        progress = { (currentIndex + 1).toFloat() / questions.size },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = GoldAccent,
                        trackColor = EmeraldSurface
                    )
                }

                // Question Card
                item {
                    MoazenWidgetCard(
                        cornerRadius = 20.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp)
                        ) {
                            Text(
                                text = currentQ.question,
                                color = MoazenInkPrimary,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                lineHeight = 26.sp,
                                textAlign = TextAlign.Right,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }

                // Options
                items(currentQ.options.size) { optIndex ->
                    val optionText = currentQ.options[optIndex]
                    val isSelected = selectedOption == optIndex
                    val isCorrect = optIndex == currentQ.correctIndex

                    val onOptionClick: () -> Unit = {
                        if (!isAnswered) {
                            selectedOption = optIndex
                            isAnswered = true
                            if (optIndex == currentQ.correctIndex) {
                                score++
                            }
                        }
                    }

                    if (isAnswered && (isCorrect || isSelected)) {
                        val bgColor = if (isCorrect) Color(0xFFD1FAE5) else Color(0xFFFEE2E2)
                        val bdrColor = if (isCorrect) Color(0xFF059669) else Color(0xFFDC2626)
                        val txtColor = if (isCorrect) Color(0xFF065F46) else Color(0xFF991B1B)
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = bgColor,
                            border = androidx.compose.foundation.BorderStroke(1.5.dp, bdrColor),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .clip(CircleShape)
                                        .background(bdrColor),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "${optIndex + 1}",
                                        color = Color.White,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = optionText,
                                    color = txtColor,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.Right
                                )
                                Icon(
                                    imageVector = if (isCorrect) Icons.Default.CheckCircle else Icons.Default.Cancel,
                                    contentDescription = null,
                                    tint = bdrColor
                                )
                            }
                        }
                    } else {
                        MoazenWidgetCard(
                            cornerRadius = 14.dp,
                            borderColor = if (isSelected) MoazenGoldDark else MoazenCardBorder,
                            borderWidth = if (isSelected) 1.5.dp else 1.dp,
                            modifier = Modifier.fillMaxWidth(),
                            onClick = if (!isAnswered) onOptionClick else null
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .clip(CircleShape)
                                        .background(MoazenInkEmerald.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "${optIndex + 1}",
                                        color = MoazenInkEmerald,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Text(
                                    text = optionText,
                                    color = if (isAnswered) MoazenInkMuted else MoazenInkPrimary,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.Right
                                )
                            }
                        }
                    }
                }

                // Explanation & Next Button
                if (isAnswered) {
                    item {
                        MoazenWidgetCard(
                            cornerRadius = 14.dp,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Lightbulb, contentDescription = null, tint = MoazenGoldDark, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("فائدة علمية", color = MoazenInkEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = currentQ.explanation,
                                    color = MoazenInkPrimary,
                                    fontSize = 13.sp,
                                    lineHeight = 20.sp,
                                    textAlign = TextAlign.Right
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Button(
                            onClick = {
                                if (currentIndex + 1 < questions.size) {
                                    currentIndex++
                                    selectedOption = null
                                    isAnswered = false
                                } else {
                                    quizCompleted = true
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = if (currentIndex + 1 < questions.size) "السؤال التالي" else "عرض النتيجة",
                                color = EmeraldDeep,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
