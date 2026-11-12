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
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(GoldAccent.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.EmojiEvents, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(40.dp))
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "بارك الله فيك!",
                            color = GoldAccent,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "أتممت مسابقة المعرفة الإسلامية بنجاح",
                            color = TextSecondary,
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Text(
                            text = "$score / ${questions.size}",
                            color = TextPrimary,
                            fontSize = 36.sp,
                            fontWeight = FontWeight.ExtraBold
                        )

                        Text(
                            text = if (score >= 6) "ممتاز! معرفة إسلامية متميزة ما شاء الله" else "جيد جدًا! واصل القراءة والتعلم وطلب العلم",
                            color = GoldLight,
                            fontSize = 13.sp,
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
                            colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("إعادة المسابقة", color = EmeraldDeep, fontWeight = FontWeight.Bold, fontSize = 16.sp)
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
                                .background(EmeraldSurfaceLight)
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = currentQ.category,
                                color = GoldAccent,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
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
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = currentQ.question,
                                color = TextPrimary,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                lineHeight = 26.sp,
                                textAlign = TextAlign.Right
                            )
                        }
                    }
                }

                // Options
                items(currentQ.options.size) { optIndex ->
                    val optionText = currentQ.options[optIndex]
                    val isSelected = selectedOption == optIndex
                    val isCorrect = optIndex == currentQ.correctIndex

                    val (containerColor, borderColor, textColor) = when {
                        !isAnswered -> if (isSelected) Triple(EmeraldSurfaceLight, GoldAccent, TextPrimary) else Triple(EmeraldSurface, Color.Transparent, TextPrimary)
                        isCorrect -> Triple(Color(0xFF0F5132), Color(0xFF28A745), Color.White)
                        isSelected && !isCorrect -> Triple(Color(0xFF58151C), Color(0xFFDC3545), Color.White)
                        else -> Triple(EmeraldSurface, Color.Transparent, TextSecondary)
                    }

                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = containerColor),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = !isAnswered) {
                                selectedOption = optIndex
                                isAnswered = true
                                if (optIndex == currentQ.correctIndex) {
                                    score++
                                }
                            }
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
                                    .background(if (isAnswered && isCorrect) Color(0xFF28A745) else EmeraldSurfaceLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${optIndex + 1}",
                                    color = if (isAnswered && isCorrect) Color.White else GoldAccent,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Text(
                                text = optionText,
                                color = textColor,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Right
                            )

                            if (isAnswered) {
                                if (isCorrect) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF28A745))
                                } else if (isSelected) {
                                    Icon(Icons.Default.Cancel, contentDescription = null, tint = Color(0xFFDC3545))
                                }
                            }
                        }
                    }
                }

                // Explanation & Next Button
                if (isAnswered) {
                    item {
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = EmeraldSurfaceLight),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Lightbulb, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("فائدة علمية", color = GoldAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = currentQ.explanation,
                                    color = TextSecondary,
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
