package com.muslim.azan.ui.screens

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.AlarmScheduler
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenSubWidgetBox
import com.muslim.azan.ui.components.MoazenWidgetCard
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class RitualStep(
    val id: Int,
    val title: String,
    val dayOrStage: String,
    val description: String,
    val duaOrDhikr: String? = null,
    val notes: String? = null
)

data class HajjChecklistSpec(
    val id: String,
    val order: Int,
    val titleAr: String,
    val titleEn: String,
    val stageAr: String,
    val stageEn: String,
    val descriptionAr: String,
    val descriptionEn: String,
    val variationNoteAr: String? = null,
    val variationNoteEn: String? = null
)

private val HAJJ_12_RITUALS = listOf(
    HajjChecklistSpec(
        "ihram", 1, "الإحرام", "Ihram (Entering Sacred State)",
        "من الميقات", "At the Miqat",
        "الاغتسال والتطيب ولبس ثياب الإحرام عند الميقات أو محاذاته قبل دخول مكة.",
        "Ghusl and wearing Ihram garments before crossing the Miqat boundary.",
    ),
    HajjChecklistSpec(
        "niyyah_talbiyah", 2, "النية والتلبية", "Intention & Talbiyah",
        "عقد النسك", "Declaring Nusk",
        "عقد نية النسك (تمتع / قران / إفراد) والإكثار من التلبية المأثورة.",
        "Set intention for Tamattu, Qiran, or Ifrad Hajj and recite Talbiyah.",
    ),
    HajjChecklistSpec(
        "tawaf_qudum", 3, "طواف القدوم", "Tawaf al-Qudum",
        "عند دخول مكة", "Upon Arrival",
        "سبعة أشواط حول الكعبة تحية للبيت للقارن والمفرد (وللمتمتع طواف العمرة).",
        "Seven arrival circuits around the Kaaba for Qarin & Mufrid pilgrims.",
        "يُجزئ طواف العمرة للمتمتع، وهو سنة للقارن والمفرد.",
        "Umrah Tawaf suffices for Tamattu; Sunnah for Qarin and Mufrid."
    ),
    HajjChecklistSpec(
        "sai", 4, "السعي بين الصفا والمروة", "Sa'i (Safa & Marwah)",
        "ركن من أركان الحج", "Pillar of Hajj",
        "سبعة أشواط تبدأ بالصفا وتنتهي بالمروة مع الذكر والدعاء.",
        "Seven laps starting from Safa and ending at Marwah.",
        "يؤديه القارن والمفرد بعد طواف القدوم أو مع الإفاضة؛ والمتمتع يسعى لعمرته ثم لحجه.",
        "Timing depends on Hajj type (Tamattu, Qiran, or Ifrad)."
    ),
    HajjChecklistSpec(
        "mina_stay", 5, "المبيت بمنى", "Stay at Mina",
        "يوم التروية والتشريق", "Tarwiyah & Tashreeq",
        "التوجه إلى منى يوم 8 ذي الحجة وقصر الرباعية، والمبيت بها ليالي التشريق.",
        "Stay in Mina on 8th Dhul Hijjah and during the Tashreeq nights.",
    ),
    HajjChecklistSpec(
        "arafat", 6, "الوقوف بعرفة", "Standing at Arafat",
        "9 ذي الحجة • ركن الحج الأعظم", "9th Dhul Hijjah • Essential Pillar",
        "الوقوف بصعيد عرفة يوم التاسع مع جمع الظهر والعصر قصراً والتضرع للدعاء حتى الغروب.",
        "Stand within Arafat on 9th Dhul Hijjah with Dhuhr/Asr shortened and supplicate until sunset.",
    ),
    HajjChecklistSpec(
        "muzdalifah", 7, "المبيت بمزدلفة", "Night at Muzdalifah",
        "ليلة 10 ذي الحجة", "Night of 10th Dhul Hijjah",
        "الإفاضة بعد غروب عرفة وصلاة المغرب والعشاء جمع تأخير وقصر، والمبيت حتى الفجر.",
        "Proceed after sunset, combine Maghrib & Isha, and spend the night until Fajr.",
    ),
    HajjChecklistSpec(
        "stoning_jamarat", 8, "رمي الجمرات", "Stoning the Jamarat",
        "10 – 13 ذي الحجة", "10th – 13th Dhul Hijjah",
        "رمي جمرة العقبة يوم النحر، ثم الجمرات الثلاث أيام التشريق بعد الزوال.",
        "Stone Aqabah on Eid day, then all three Jamarat daily after Dhuhr on Tashreeq days.",
    ),
    HajjChecklistSpec(
        "hady", 9, "الهدي", "Sacrificial Animal (Hady)",
        "يوم النحر والتشريق", "Eid & Tashreeq",
        "نحر الهدي للمتمتع والقارن (أو صيام البدل لمن لم يجد)، ولا هدي على المفرد.",
        "Hady sacrifice obligatory for Tamattu & Qarin pilgrims.",
        "واجب على المتمتع والقارن ولا يجب على المفرد.",
        "Required for Tamattu & Qarin; not obligatory for Ifrad."
    ),
    HajjChecklistSpec(
        "halq_taqsir", 10, "الحلق أو التقصير", "Shaving or Trimming",
        "التحلل الأول", "First Release",
        "حلق الرأس أو تقصيره للرجل وتقصير أنملة للمرأة يوم النحر.",
        "Men shave or trim evenly; women trim a fingertip length.",
    ),
    HajjChecklistSpec(
        "tawaf_ifadah", 11, "طواف الإفاضة", "Tawaf al-Ifadah",
        "ركن الحج", "Essential Pillar",
        "طواف الزيارة سبعة أشواط حول الكعبة بعد عرفة ومزدلفة وبه يحصل التحلل الأكبر.",
        "Essential seven-circuit Tawaf completing full release from Ihram.",
    ),
    HajjChecklistSpec(
        "tawaf_wada", 12, "طواف الوداع", "Tawaf al-Wada'",
        "عند مغادرة مكة", "Departure from Makkah",
        "آخر عهد الحاج بالبيت سبعة أشواط قبل السفر (ويسقط عن الحائض والنفساء).",
        "Final seven-circuit Tawaf right before departing Makkah.",
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HajjScreen(
    prefs: NativePreferences,
    language: String = "ar",
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val isEnglish = language == "en"

    // 0 = Interactive 12-Ritual Checklist, 1 = Umrah Guide, 2 = Hajj Guide
    var selectedTab by remember { mutableStateOf(0) }
    var completedIds by remember { mutableStateOf(prefs.getHajjCompletedRitualIds()) }
    var reminderMap by remember { mutableStateOf(prefs.getHajjRitualReminders()) }
    var showResetConfirmDialog by remember { mutableStateOf(false) }

    val hasInternalOverlay = showResetConfirmDialog || selectedTab != 0
    BackHandler(enabled = hasInternalOverlay) {
        when {
            showResetConfirmDialog -> showResetConfirmDialog = false
            selectedTab != 0 -> selectedTab = 0
        }
    }

    val totalRituals = HAJJ_12_RITUALS.size
    val completedCount = completedIds.count { id -> HAJJ_12_RITUALS.any { it.id == id } }
    val remainingCount = (totalRituals - completedCount).coerceAtLeast(0)
    val percent = if (totalRituals > 0) (completedCount * 100) / totalRituals else 0
    val animatedProgress by animateFloatAsState(
        targetValue = (percent / 100f).coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 320),
        label = "hajj_checklist_progress"
    )

    val dateTimeFmt = remember(language) {
        SimpleDateFormat("yyyy/MM/dd HH:mm", if (isEnglish) Locale.US else Locale("ar"))
    }

    fun toggleRitual(id: String) {
        val next = completedIds.toMutableSet()
        if (!next.add(id)) {
            next.remove(id)
        }
        prefs.setHajjCompletedRitualIds(next)
        completedIds = next
    }

    fun scheduleCustomDateTimeReminder(spec: HajjChecklistSpec) {
        val nowCal = Calendar.getInstance()
        DatePickerDialog(
            context,
            { _, year, month, day ->
                val timeCal = Calendar.getInstance()
                TimePickerDialog(
                    context,
                    { _, hour, minute ->
                        val picked = Calendar.getInstance().apply {
                            set(year, month, day, hour, minute, 0)
                            set(Calendar.MILLISECOND, 0)
                        }
                        if (picked.timeInMillis <= System.currentTimeMillis() + 5000L) {
                            Toast.makeText(
                                context,
                                if (isEnglish) "Please choose a future time" else "يرجى اختيار وقت قادم",
                                Toast.LENGTH_SHORT
                            ).show()
                            return@TimePickerDialog
                        }
                        val ok = AlarmScheduler.scheduleSingleCustomReminder(
                            context,
                            "hajj_${spec.id}",
                            if (isEnglish) "Hajj Ritual: ${spec.titleEn}" else "تذكير منسك: ${spec.titleAr}",
                            if (isEnglish) spec.descriptionEn else spec.descriptionAr,
                            picked.timeInMillis
                        )
                        if (ok) {
                            prefs.setHajjRitualReminder(spec.id, picked.timeInMillis)
                            reminderMap = prefs.getHajjRitualReminders()
                            Toast.makeText(
                                context,
                                if (isEnglish) "Reminder scheduled" else "تمت جدولة تنبيه المنسك بنجاح",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    },
                    timeCal.get(Calendar.HOUR_OF_DAY),
                    timeCal.get(Calendar.MINUTE),
                    true
                ).show()
            },
            nowCal.get(Calendar.YEAR),
            nowCal.get(Calendar.MONTH),
            nowCal.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

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
                description = "البدء من محاذاة الحجر الأسود واستقباله والتكبير، وجعل الكعبة على يسارك والطواف 7 أشواط كاملة. يسن للرجل الاضطباع والرمل في الأشواط الثلاثة الأولى.",
                duaOrDhikr = "بين الركن اليماني والحجر الأسود: «رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ».",
                notes = "يشترط للطواف الطهارة والوضوء وستر العورة."
            ),
            RitualStep(
                id = 3,
                title = "صلاة ركعتي الطواف والشرب من زمزم",
                dayOrStage = "الخطوة الثالثة",
                description = "صلاة ركعتين خلف مقام إبراهيم عليه السلام إن تيسر وإلا ففي أي موضع بالمسجد الحرام، ثم الشرب من ماء زمزم والتضلع منه.",
                duaOrDhikr = "«اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ».",
                notes = "ماء زمزم لما شُرب له."
            ),
            RitualStep(
                id = 4,
                title = "السعي بين الصفا والمروة (سبعة أشواط)",
                dayOrStage = "الخطوة الرابعة",
                description = "البدء من جبل الصفا واستقبال الكعبة والدعاء، ثم التوجه نحو المروة حتى تكتمل سبعة أشواط منتهية بالمروة.",
                duaOrDhikr = "«إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ... لا إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ».",
                notes = "يسن للرجال الهرولة بين الميلين الأخضرين."
            ),
            RitualStep(
                id = 5,
                title = "الحلق أو التقصير (التحلل الكامل)",
                dayOrStage = "الخطوة الخامسة",
                description = "حلق جميع شعر الرأس أو تقصيره للرجل، وتقصير قيد أنملة للمرأة وبذلك تتم العمرة.",
                notes = "تقبل الله طاعتكم وعمرتكم!"
            )
        )
    }

    val hajjSteps = remember {
        listOf(
            RitualStep(1, "يوم التروية والإحرام بالحج", "اليوم الثامن من ذي الحجة", "يحرم الحاج من مكانه بمكة وينوي: «لَبَّيْكَ حَجًّا» ويتوجه إلى منى للمبيت وقصر الرباعية بدون جمع."),
            RitualStep(2, "الوقوف بعرفة (ركن الحج الأعظم)", "اليوم التاسع من ذي الحجة", "جمع الظهر والعصر قصراً جمع تقديم والتفرغ للذكر والدعاء حتى الغروب.", notes = "قال ﷺ: «الْحَجُّ عَرَفَةُ»."),
            RitualStep(3, "الإفاضة والمبيت بمزدلفة", "ليلة العاشر من ذي الحجة", "جمع المغرب والعشاء جمع تأخير وقصراً والمبيت بها حتى الفجر مع التقاط الحصيات."),
            RitualStep(4, "يوم النحر وأعمال يوم العيد", "اليوم العاشر من ذي الحجة", "رمي جمرة العقبة بـ 7 حصيات، ذبح الهدي، الحلق أو التقصير، وطواف الإفاضة والسعي."),
            RitualStep(5, "أيام التشريق ورمي الجمرات الثلاث", "أيام 11 و 12 و 13 ذي الحجة", "المبيت بمنى ورمي الجمرات الثلاث كل جمرة بـ 7 حصيات بعد الزوال."),
            RitualStep(6, "طواف الوداع", "خاتمة أعمال الحج", "الطواف حول الكعبة 7 أشواط قبل مغادرة مكة (ويسقط عن الحائض والنفساء).")
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isEnglish) "Hajj & Umrah Companion" else "مناسك الحج والعمرة",
                        color = MoazenInkEmerald,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = {
                            if (selectedTab != 0) selectedTab = 0 else onBack()
                        }
                    ) {
                        Icon(
                            imageVector = if (isEnglish) Icons.Default.ArrowBack else Icons.Default.ArrowForward,
                            contentDescription = if (isEnglish) "Back" else "رجوع",
                            tint = MoazenInkEmerald
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MoazenCardStart)
            )
        },
        containerColor = Color.Transparent,
        modifier = Modifier.background(MuslimPlusCanvasBrush)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MuslimPlusCanvasBrush)
                .padding(padding)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // 3-way Segmented Tabs: Checklist | Umrah | Hajj Guide
            MoazenWidgetCard(
                cornerRadius = 14.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    val tabs = if (isEnglish) {
                        listOf(0 to "Checklist (12)", 1 to "Umrah", 2 to "Hajj Guide")
                    } else {
                        listOf(0 to "قائمة المناسك", 1 to "العمرة", 2 to "دليل الحج")
                    }
                    tabs.forEach { (tabIdx, label) ->
                        val active = selectedTab == tabIdx
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (active) MuslimPlusPillEmerald else Color.Transparent)
                                .clickable { selectedTab = tabIdx }
                                .padding(vertical = 8.dp, horizontal = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                color = if (active) Color.White else MoazenInkMuted,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }

            if (selectedTab == 0) {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    // Progress Header Card
                    item {
                        MoazenWidgetCard(
                            cornerRadius = 16.dp,
                            borderColor = MoazenGold,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = if (isEnglish) "Hajj Rituals Progress" else "مؤشر إتمام مناسك الحج",
                                            color = MoazenInkEmerald,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.ExtraBold
                                        )
                                        Text(
                                            text = if (isEnglish) "Progress saved automatically" else "يتم حفظ تقدمك تلقائياً",
                                            color = MoazenInkMuted,
                                            fontSize = 11.sp
                                        )
                                    }

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Surface(
                                            shape = RoundedCornerShape(99.dp),
                                            color = MuslimPlusPillEmerald
                                        ) {
                                            Text(
                                                text = "$percent%",
                                                color = Color(0xFFF5D77F),
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Black,
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                            )
                                        }
                                        OutlinedButton(
                                            onClick = { showResetConfirmDialog = true },
                                            enabled = completedCount > 0 || reminderMap.isNotEmpty(),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                            modifier = Modifier.height(30.dp)
                                        ) {
                                            Icon(Icons.Default.RestartAlt, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(3.dp))
                                            Text(
                                                text = if (isEnglish) "Reset" else "إعادة",
                                                fontSize = 10.5.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }

                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(8.dp)
                                        .clip(RoundedCornerShape(99.dp))
                                        .background(MoazenCardBorder.copy(alpha = 0.35f))
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth(animatedProgress)
                                            .fillMaxHeight()
                                            .clip(RoundedCornerShape(99.dp))
                                            .background(MuslimPlusPillEmerald)
                                    )
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    listOf(
                                        Triple(if (isEnglish) "Completed" else "مكتمل", completedCount, MoazenInkEmerald),
                                        Triple(if (isEnglish) "Remaining" else "متبقي", remainingCount, MoazenGoldDark),
                                        Triple(if (isEnglish) "Total" else "الإجمالي", totalRituals, MoazenInkPrimary)
                                    ).forEach { (lbl, num, clr) ->
                                        MoazenSubWidgetBox(
                                            cornerRadius = 11.dp,
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Column(
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(vertical = 6.dp)
                                            ) {
                                                Text(lbl, color = MoazenInkMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                                Text("$num", color = clr, fontSize = 16.sp, fontWeight = FontWeight.Black)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Hajj Type Disclaimer Notice
                    item {
                        MoazenSubWidgetBox(
                            cornerRadius = 14.dp,
                            borderColor = MoazenGold,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Icon(Icons.Default.Info, contentDescription = null, tint = MoazenGoldDark, modifier = Modifier.size(16.dp))
                                Text(
                                    text = if (isEnglish) {
                                        "Note: The order, timing, and obligation of certain rituals (like Tawaf al-Qudum, Hady, and Sa'i) differ based on your Hajj type (Tamattu, Qiran, or Ifrad) and pilgrim circumstances."
                                    } else {
                                        "تنبيه فقهي مهم: قد يختلف ترتيب أو توقيت أو وجوب بعض المناسك (مثل طواف القدوم، الهدي، السعي، أو طواف الوداع لأصحاب الأعذار) باختلاف نوع النسك (تمتع / قران / إفراد) وظروف الحاج."
                                    },
                                    color = MoazenInkPrimary,
                                    fontSize = 11.sp,
                                    lineHeight = 17.sp
                                )
                            }
                        }
                    }

                    // 12 Ritual Items
                    items(HAJJ_12_RITUALS, key = { it.id }) { spec ->
                        val isDone = completedIds.contains(spec.id)
                        val scheduledMs = reminderMap[spec.id]
                        val hasFutureReminder = scheduledMs != null && scheduledMs > System.currentTimeMillis()

                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (isDone) MuslimPlusPillEmerald else MoazenCardStart,
                            border = BorderStroke(
                                1.dp,
                                if (isDone) MoazenGold else MoazenCardBorder
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .clickable { toggleRitual(spec.id) }
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.Top,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        modifier = Modifier.weight(1f),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                        verticalAlignment = Alignment.Top
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .padding(top = 2.dp)
                                                .size(22.dp)
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(if (isDone) MoazenGold else MoazenSubCardBg)
                                                .border(1.2.dp, MoazenGoldDark, RoundedCornerShape(6.dp)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            if (isDone) {
                                                Icon(
                                                    imageVector = Icons.Default.Check,
                                                    contentDescription = null,
                                                    tint = Color(0xFF1A2220),
                                                    modifier = Modifier.size(14.dp)
                                                )
                                            }
                                        }

                                        Column(modifier = Modifier.weight(1f)) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Surface(
                                                    shape = RoundedCornerShape(99.dp),
                                                    color = if (isDone) Color.White.copy(alpha = 0.16f) else MoazenInkEmerald.copy(alpha = 0.12f)
                                                ) {
                                                    Text(
                                                        text = "${spec.order}",
                                                        color = if (isDone) Color(0xFFF5D77F) else MoazenInkEmerald,
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Black,
                                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp)
                                                    )
                                                }
                                                Text(
                                                    text = if (isEnglish) spec.titleEn else spec.titleAr,
                                                    color = if (isDone) Color.White else MoazenInkEmerald,
                                                    fontSize = 14.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None
                                                )
                                            }
                                            Text(
                                                text = if (isEnglish) spec.stageEn else spec.stageAr,
                                                color = if (isDone) Color(0xFFF5D77F) else MoazenGoldDark,
                                                fontSize = 10.5.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Spacer(modifier = Modifier.height(3.dp))
                                            Text(
                                                text = if (isEnglish) spec.descriptionEn else spec.descriptionAr,
                                                color = if (isDone) Color.White.copy(alpha = 0.9f) else MoazenInkPrimary,
                                                fontSize = 12.sp,
                                                lineHeight = 18.sp
                                            )
                                            val vNote = if (isEnglish) spec.variationNoteEn else spec.variationNoteAr
                                            if (!vNote.isNullOrBlank()) {
                                                Spacer(modifier = Modifier.height(3.dp))
                                                Text(
                                                    text = vNote,
                                                    color = if (isDone) Color(0xFFF5D77F) else MoazenGoldDark,
                                                    fontSize = 10.5.sp,
                                                    fontWeight = FontWeight.SemiBold
                                                )
                                            }
                                        }
                                    }

                                    // Optional custom reminder button
                                    IconButton(
                                        onClick = {
                                            if (hasFutureReminder) {
                                                AlarmScheduler.cancelSingleCustomReminder(context, "hajj_${spec.id}")
                                                prefs.setHajjRitualReminder(spec.id, null)
                                                reminderMap = prefs.getHajjRitualReminders()
                                                Toast.makeText(
                                                    context,
                                                    if (isEnglish) "Reminder cancelled" else "تم إلغاء التنبيه",
                                                    Toast.LENGTH_SHORT
                                                ).show()
                                            } else {
                                                scheduleCustomDateTimeReminder(spec)
                                            }
                                        },
                                        modifier = Modifier.size(34.dp)
                                    ) {
                                        Icon(
                                            imageVector = if (hasFutureReminder) Icons.Default.NotificationsActive else Icons.Default.AlarmAdd,
                                            contentDescription = if (isEnglish) "Ritual Reminder" else "تحديد تنبيه",
                                            tint = if (hasFutureReminder) Color(0xFFF5D77F) else if (isDone) Color.White else MoazenInkEmerald,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }

                                if (hasFutureReminder && scheduledMs != null) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = (if (isEnglish) "Scheduled: " else "تنبيه مجدول: ") + dateTimeFmt.format(Date(scheduledMs)),
                                        color = if (isDone) Color(0xFFF5D77F) else MoazenInkEmerald,
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            } else {
                val currentList = if (selectedTab == 1) umrahSteps else hajjSteps
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    item {
                        MoazenWidgetCard(cornerRadius = 16.dp, modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(MoazenGold.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Mosque, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(24.dp))
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = if (selectedTab == 1) "دليل المعتمر خطوة بخطوة" else "أعمال الحج خطوة بخطوة",
                                        color = MoazenInkEmerald,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "دليل مبسط وموثوق وفق سنة النبي المصطفى ﷺ",
                                        color = MoazenInkMuted,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    items(currentList) { step ->
                        var expanded by remember { mutableStateOf(false) }

                        MoazenWidgetCard(
                            cornerRadius = 16.dp,
                            onClick = { expanded = !expanded },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(30.dp)
                                            .clip(CircleShape)
                                            .background(MuslimPlusPillEmerald),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("${step.id}", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(step.title, color = MoazenInkPrimary, fontSize = 14.5.sp, fontWeight = FontWeight.Bold)
                                        Text(step.dayOrStage, color = MoazenGoldDark, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                    Icon(
                                        imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                        contentDescription = null,
                                        tint = MoazenInkMuted
                                    )
                                }

                                AnimatedVisibility(visible = expanded) {
                                    Column(modifier = Modifier.fillMaxWidth().padding(top = 12.dp)) {
                                        Text(
                                            text = step.description,
                                            color = MoazenInkPrimary,
                                            fontSize = 13.5.sp,
                                            lineHeight = 22.sp
                                        )
                                        step.duaOrDhikr?.let { dua ->
                                            Spacer(modifier = Modifier.height(8.dp))
                                            MoazenSubWidgetBox(cornerRadius = 12.dp, modifier = Modifier.fillMaxWidth()) {
                                                Column(modifier = Modifier.padding(12.dp)) {
                                                    Text("الدعاء أو الذكر المستحب", color = MoazenInkEmerald, fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                                                    Spacer(modifier = Modifier.height(4.dp))
                                                    Text(dua, color = MoazenInkPrimary, fontSize = 13.sp, lineHeight = 21.sp, fontWeight = FontWeight.Medium)
                                                }
                                            }
                                        }
                                        step.notes?.let { note ->
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text("💡 $note", color = MoazenInkMuted, fontSize = 11.5.sp, lineHeight = 18.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showResetConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showResetConfirmDialog = false },
            containerColor = MoazenCardEnd,
            title = {
                Text(
                    text = if (isEnglish) "Reset Hajj Checklist?" else "تأكيد إعادة ضبط المناسك",
                    color = MoazenInkEmerald,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = if (isEnglish) {
                        "Are you sure you want to clear all completed rituals and scheduled reminders?"
                    } else {
                        "هل أنت متأكد من مسح جميع علامات إتمام المناسك والتنبيهات المجدولة لها؟"
                    },
                    color = MoazenInkMuted,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        reminderMap.keys.forEach { ritualId ->
                            AlarmScheduler.cancelSingleCustomReminder(context, "hajj_$ritualId")
                        }
                        prefs.resetHajjChecklistAll()
                        completedIds = emptySet()
                        reminderMap = emptyMap()
                        showResetConfirmDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)
                ) {
                    Text(if (isEnglish) "Reset All" else "إعادة الضبط", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetConfirmDialog = false }) {
                    Text(if (isEnglish) "Cancel" else "إلغاء", color = MoazenInkEmerald, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}
