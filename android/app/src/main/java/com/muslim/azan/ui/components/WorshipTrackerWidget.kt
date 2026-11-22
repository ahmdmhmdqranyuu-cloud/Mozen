package com.muslim.azan.ui.components

import android.app.TimePickerDialog
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.muslim.azan.AlarmScheduler
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class WorshipItemSpec(
    val key: String,
    val titleAr: String,
    val titleEn: String,
    val unitAr: String,
    val unitEn: String,
    val defaultTarget: Int,
    val minTarget: Int,
    val maxTarget: Int,
    val step: Int
)

val WORSHIP_ITEM_SPECS = listOf(
    WorshipItemSpec("five_prayers", "الصلوات الخمس", "Five Daily Prayers", "صلاة", "prayers", 5, 1, 5, 1),
    WorshipItemSpec("azkar_sabah_massa", "أذكار الصباح والمساء", "Morning & Evening Azkar", "ورد", "sessions", 2, 1, 2, 1),
    WorshipItemSpec("quran_reading", "قراءة القرآن", "Quran Reading", "صفحة", "pages", 10, 1, 100, 1),
    WorshipItemSpec("after_prayer_azkar", "أذكار بعد الصلاة", "Post-Prayer Azkar", "مرة", "times", 5, 1, 5, 1),
    WorshipItemSpec("duha_prayer", "صلاة الضحى", "Duha Prayer", "ركعات", "session", 1, 1, 8, 1),
    WorshipItemSpec("qiyam_witr", "قيام الليل والوتر", "Qiyam & Witr", "ورد", "session", 1, 1, 5, 1),
    WorshipItemSpec("charity", "الصدقة", "Daily Charity", "عمل", "act", 1, 1, 10, 1),
    WorshipItemSpec("salawat_prophet", "الصلاة على النبي ﷺ", "Salawat on Prophet ﷺ", "مرة", "times", 100, 10, 1000, 10)
)

@Composable
fun WorshipTrackerWidget(
    prefs: NativePreferences,
    language: String = "ar",
    onModalVisibilityChanged: (Boolean) -> Unit = {},
    closeGoalsRequestSignal: Int = 0,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val isEnglish = language == "en"
    val todayKey = remember {
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    }

    var targets by remember { mutableStateOf(prefs.getWorshipTargets()) }
    var todayCounts by remember(todayKey) { mutableStateOf(prefs.getWorshipDayCounts(todayKey)) }
    var showWeeklyHistory by remember { mutableStateOf(false) }
    var showGoalsDialog by remember { mutableStateOf(false) }

    LaunchedEffect(closeGoalsRequestSignal) {
        if (closeGoalsRequestSignal > 0 && showGoalsDialog) {
            showGoalsDialog = false
        }
    }

    LaunchedEffect(showGoalsDialog) {
        onModalVisibilityChanged(showGoalsDialog)
    }

    val completedItems = WORSHIP_ITEM_SPECS.count { spec ->
        val t = targets[spec.key] ?: spec.defaultTarget
        (todayCounts[spec.key] ?: 0) >= t
    }
    val totalItems = WORSHIP_ITEM_SPECS.size
    val percent = if (totalItems > 0) (completedItems * 100) / totalItems else 0
    val animatedProgress by animateFloatAsState(
        targetValue = (percent / 100f).coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 320),
        label = "worship_progress"
    )

    val weeklyDays = remember(todayCounts, targets) {
        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val dayFmt = SimpleDateFormat("EEE", if (isEnglish) Locale.US else Locale("ar"))
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -6)
        (0..6).map { idx ->
            val dKey = fmt.format(cal.time)
            val dLabel = dayFmt.format(cal.time)
            val counts = if (dKey == todayKey) todayCounts else prefs.getWorshipDayCounts(dKey)
            val done = WORSHIP_ITEM_SPECS.count { spec ->
                val t = targets[spec.key] ?: spec.defaultTarget
                (counts[spec.key] ?: 0) >= t
            }
            val pct = (done * 100) / totalItems
            cal.add(Calendar.DAY_OF_YEAR, 1)
            Triple(dKey, dLabel, pct)
        }
    }
    val weeklyAvg = remember(weeklyDays) {
        if (weeklyDays.isEmpty()) 0 else weeklyDays.sumOf { it.third } / weeklyDays.size
    }

    fun updateItemCount(key: String, newCount: Int) {
        val safe = newCount.coerceAtLeast(0)
        prefs.setWorshipItemCount(todayKey, key, safe)
        todayCounts = todayCounts.toMutableMap().apply { put(key, safe) }
    }

    MoazenWidgetCard(
        cornerRadius = 16.dp,
        borderColor = MoazenCardBorder,
        elevation = 3.dp,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(7.dp)
        ) {
            // Header row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(9.dp))
                            .background(MuslimPlusPillEmerald),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = Color(0xFFF5D77F),
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Text(
                                text = if (isEnglish) "Daily Worship Tracker" else "متتبع العبادات اليومي",
                                color = MoazenInkEmerald,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Surface(
                                shape = RoundedCornerShape(99.dp),
                                color = MoazenInkEmerald.copy(alpha = 0.12f),
                                border = BorderStroke(0.75.dp, MoazenGold.copy(alpha = 0.55f))
                            ) {
                                Text(
                                    text = "$completedItems/$totalItems • $percent%",
                                    color = MoazenInkEmerald,
                                    fontSize = 9.5.sp,
                                    fontWeight = FontWeight.Black,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.5.dp)
                                )
                            }
                        }
                        Text(
                            text = if (isEnglish) "7-day avg: $weeklyAvg% • Auto-saved" else "المعدل الأسبوعي: $weeklyAvg% • حفظ تلقائي",
                            color = MoazenInkMuted,
                            fontSize = 9.5.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Surface(
                        shape = RoundedCornerShape(9.dp),
                        color = MoazenSubCardBg,
                        border = BorderStroke(0.8.dp, MoazenCardBorder),
                        modifier = Modifier
                            .clip(RoundedCornerShape(9.dp))
                            .clickable { showWeeklyHistory = !showWeeklyHistory }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp),
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 5.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CalendarMonth,
                                contentDescription = null,
                                tint = MoazenGoldDark,
                                modifier = Modifier.size(13.dp)
                            )
                            Icon(
                                imageVector = if (showWeeklyHistory) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null,
                                tint = MoazenInkEmerald,
                                modifier = Modifier.size(13.dp)
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(9.dp),
                        color = MoazenSubCardBg,
                        border = BorderStroke(0.8.dp, MoazenCardBorder),
                        modifier = Modifier
                            .clip(RoundedCornerShape(9.dp))
                            .clickable { showGoalsDialog = true }
                    ) {
                        Box(
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 5.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Tune,
                                contentDescription = if (isEnglish) "Goals & Reminder" else "تعديل الأهداف",
                                tint = MoazenGoldDark,
                                modifier = Modifier.size(13.dp)
                            )
                        }
                    }
                }
            }

            // Progress bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(7.dp)
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

            // Expandable 7-day history summary
            AnimatedVisibility(visible = showWeeklyHistory) {
                MoazenSubWidgetBox(
                    cornerRadius = 12.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = if (isEnglish) "Last 7 Days History" else "سجل آخر 7 أيام",
                                color = MoazenInkEmerald,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "$weeklyAvg%",
                                color = MoazenGoldDark,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            weeklyDays.forEach { (dKey, dLabel, pct) ->
                                val isToday = dKey == todayKey
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isToday) MoazenGold.copy(alpha = 0.16f) else Color.White.copy(alpha = 0.45f))
                                        .border(
                                            0.7.dp,
                                            if (isToday) MoazenGoldDark else MoazenCardBorder.copy(alpha = 0.45f),
                                            RoundedCornerShape(8.dp)
                                        )
                                        .padding(vertical = 4.dp)
                                ) {
                                    Text(
                                        text = dLabel,
                                        color = MoazenInkMuted,
                                        fontSize = 8.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1
                                    )
                                    Box(
                                        modifier = Modifier
                                            .padding(vertical = 3.dp)
                                            .width(7.dp)
                                            .height(22.dp)
                                            .clip(RoundedCornerShape(99.dp))
                                            .background(MoazenCardBorder.copy(alpha = 0.35f)),
                                        contentAlignment = Alignment.BottomCenter
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .fillMaxHeight((pct / 100f).coerceAtLeast(0.08f))
                                                .clip(RoundedCornerShape(99.dp))
                                                .background(MuslimPlusPillEmerald)
                                        )
                                    }
                                    Text(
                                        text = "$pct%",
                                        color = MoazenInkEmerald,
                                        fontSize = 8.5.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 8 Worship Items 2-column grid
            val rows = remember { WORSHIP_ITEM_SPECS.chunked(2) }
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                rows.forEach { pair ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        pair.forEach { spec ->
                            val target = targets[spec.key] ?: spec.defaultTarget
                            val current = todayCounts[spec.key] ?: 0
                            val done = current >= target

                            Surface(
                                shape = RoundedCornerShape(11.dp),
                                color = if (done) MuslimPlusPillEmerald else MoazenSubCardBg,
                                border = BorderStroke(
                                    0.9.dp,
                                    if (done) MoazenGold else MoazenCardBorder
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(11.dp))
                                    .clickable {
                                        updateItemCount(spec.key, if (done) 0 else target)
                                    }
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 7.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(16.dp)
                                                .clip(RoundedCornerShape(5.dp))
                                                .background(if (done) MoazenGold else Color.White.copy(alpha = 0.85f))
                                                .border(
                                                    1.dp,
                                                    if (done) Color(0xFFF5D77F) else MoazenGoldDark.copy(alpha = 0.6f),
                                                    RoundedCornerShape(5.dp)
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            if (done) {
                                                Icon(
                                                    imageVector = Icons.Default.Check,
                                                    contentDescription = null,
                                                    tint = MoazenInkPrimary,
                                                    modifier = Modifier.size(11.dp)
                                                )
                                            }
                                        }
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = if (isEnglish) spec.titleEn else spec.titleAr,
                                                color = if (done) Color.White else MoazenInkPrimary,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Text(
                                                text = "$current/$target ${if (isEnglish) spec.unitEn else spec.unitAr}",
                                                color = if (done) Color(0xFFF5D77F) else MoazenInkMuted,
                                                fontSize = 8.5.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                maxLines = 1
                                            )
                                        }
                                    }

                                    if (target > 1) {
                                        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                                            Box(
                                                modifier = Modifier
                                                    .size(17.dp)
                                                    .clip(RoundedCornerShape(4.dp))
                                                    .background(if (done) Color.White.copy(alpha = 0.16f) else MoazenInkEmerald.copy(alpha = 0.1f))
                                                    .clickable {
                                                        updateItemCount(spec.key, (current - spec.step).coerceAtLeast(0))
                                                    },
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = "−",
                                                    color = if (done) Color.White else MoazenInkEmerald,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                            Box(
                                                modifier = Modifier
                                                    .size(17.dp)
                                                    .clip(RoundedCornerShape(4.dp))
                                                    .background(if (done) MoazenGold else MuslimPlusPillEmerald)
                                                    .clickable {
                                                        updateItemCount(spec.key, (current + spec.step).coerceAtMost(maxOf(target, spec.maxTarget)))
                                                    },
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = "+",
                                                    color = if (done) MoazenInkPrimary else Color.White,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold
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
        }
    }

    if (showGoalsDialog) {
        var draftTargets by remember { mutableStateOf(targets.toMutableMap()) }
        var reminderEnabled by remember { mutableStateOf(prefs.worshipReminderEnabled) }
        var reminderTime by remember { mutableStateOf(prefs.worshipReminderTime) }

        Dialog(onDismissRequest = { showGoalsDialog = false }) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = MoazenCardStart,
                border = BorderStroke(1.2.dp, MoazenGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (isEnglish) "Daily Worship Goals" else "تخصيص أهداف العبادات",
                            color = MoazenInkEmerald,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                        IconButton(onClick = { showGoalsDialog = false }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Close, contentDescription = null, tint = MoazenInkEmerald)
                        }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 310.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(7.dp)
                    ) {
                        WORSHIP_ITEM_SPECS.forEach { spec ->
                            val curTarget = draftTargets[spec.key] ?: spec.defaultTarget
                            MoazenSubWidgetBox(cornerRadius = 12.dp, modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 10.dp, vertical = 7.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = if (isEnglish) spec.titleEn else spec.titleAr,
                                            color = MoazenInkPrimary,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = if (isEnglish) spec.unitEn else spec.unitAr,
                                            color = MoazenInkMuted,
                                            fontSize = 10.sp
                                        )
                                    }
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Surface(
                                            shape = RoundedCornerShape(7.dp),
                                            color = MoazenInkEmerald.copy(alpha = 0.1f),
                                            modifier = Modifier
                                                .size(26.dp)
                                                .clickable {
                                                    val next = (curTarget - spec.step).coerceAtLeast(spec.minTarget)
                                                    draftTargets = draftTargets.toMutableMap().apply { put(spec.key, next) }
                                                }
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Text("−", color = MoazenInkEmerald, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                        Text(
                                            text = "$curTarget",
                                            color = MoazenInkEmerald,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Black,
                                            textAlign = TextAlign.Center,
                                            modifier = Modifier.widthIn(min = 28.dp)
                                        )
                                        Surface(
                                            shape = RoundedCornerShape(7.dp),
                                            color = MuslimPlusPillEmerald,
                                            modifier = Modifier
                                                .size(26.dp)
                                                .clickable {
                                                    val next = (curTarget + spec.step).coerceAtMost(spec.maxTarget)
                                                    draftTargets = draftTargets.toMutableMap().apply { put(spec.key, next) }
                                                }
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Text("+", color = Color.White, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        MoazenSubWidgetBox(cornerRadius = 12.dp, modifier = Modifier.fillMaxWidth()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(10.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = if (isEnglish) "Optional Gentle Reminder" else "تذكير لطيف اختياري",
                                            color = MoazenInkEmerald,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = if (isEnglish) "Non-intrusive check-in alert" else "تنبيه هادئ لمتابعة أورادك",
                                            color = MoazenInkMuted,
                                            fontSize = 10.sp
                                        )
                                    }
                                    Switch(
                                        checked = reminderEnabled,
                                        onCheckedChange = { reminderEnabled = it }
                                    )
                                }
                                if (reminderEnabled) {
                                    OutlinedButton(
                                        onClick = {
                                            val parts = reminderTime.split(":")
                                            val initH = parts.getOrNull(0)?.toIntOrNull() ?: 20
                                            val initM = parts.getOrNull(1)?.toIntOrNull() ?: 30
                                            TimePickerDialog(
                                                context,
                                                { _, h, m ->
                                                    reminderTime = String.format(Locale.US, "%02d:%02d", h, m)
                                                },
                                                initH,
                                                initM,
                                                true
                                            ).show()
                                        },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = if (isEnglish) "Reminder Time: $reminderTime" else "وقت التذكير: $reminderTime",
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                draftTargets.forEach { (k, v) -> prefs.setWorshipTarget(k, v) }
                                targets = prefs.getWorshipTargets()
                                prefs.worshipReminderEnabled = reminderEnabled
                                prefs.worshipReminderTime = reminderTime

                                if (reminderEnabled) {
                                    val parts = reminderTime.split(":")
                                    val hh = parts.getOrNull(0)?.toIntOrNull() ?: 20
                                    val mm = parts.getOrNull(1)?.toIntOrNull() ?: 30
                                    val cal = Calendar.getInstance().apply {
                                        set(Calendar.HOUR_OF_DAY, hh)
                                        set(Calendar.MINUTE, mm)
                                        set(Calendar.SECOND, 0)
                                        if (timeInMillis <= System.currentTimeMillis() + 5000L) {
                                            add(Calendar.DAY_OF_YEAR, 1)
                                        }
                                    }
                                    AlarmScheduler.scheduleSingleCustomReminder(
                                        context,
                                        "worship_daily_checkin",
                                        if (isEnglish) "Daily Worship Tracker" else "تذكير متتبع العبادات",
                                        if (isEnglish) "Check your daily worship acts in Muslim Plus." else "راجع أورادك اليومية في متتبع العبادات بتطبيق مسلم بلس.",
                                        cal.timeInMillis
                                    )
                                } else {
                                    AlarmScheduler.cancelSingleCustomReminder(context, "worship_daily_checkin")
                                }

                                showGoalsDialog = false
                                Toast.makeText(
                                    context,
                                    if (isEnglish) "Goals saved" else "تم حفظ أهداف العبادات بنجاح",
                                    Toast.LENGTH_SHORT
                                ).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(if (isEnglish) "Save" else "حفظ", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                        OutlinedButton(
                            onClick = { showGoalsDialog = false },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(if (isEnglish) "Cancel" else "إلغاء", color = MoazenInkEmerald, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
