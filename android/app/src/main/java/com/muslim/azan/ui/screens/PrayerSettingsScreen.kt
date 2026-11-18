package com.muslim.azan.ui.screens

import android.content.Intent
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.muslim.azan.AzkarAudioService
import com.muslim.azan.BootReceiver
import com.muslim.azan.PrayerTimeCalculator
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.model.PrayerSettingConfig
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenSubWidgetBox
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.TimeZone
import kotlin.math.roundToInt

private data class SoundOption(val id: String, val label: String)

private val AZAN_VOICE_OPTIONS = listOf(
    SoundOption("makkah", "أذان المسجد الحرام (مكة المكرمة)"),
    SoundOption("madinah", "أذان المسجد النبوي (المدينة)"),
    SoundOption("alaqsa", "أذان المسجد الأقصى"),
    SoundOption("cairo", "أذان القاهرة"),
    SoundOption("alafasy", "الشيخ مشاري راشد العفاسي"),
    SoundOption("abdulbasit", "الشيخ عبد الباسط عبد الصمد"),
    SoundOption("hussary", "الشيخ محمود خليل الحصري"),
    SoundOption("mohamed_rifaat", "الشيخ محمد رفعت"),
    SoundOption("mustafa_ismail", "الشيخ مصطفى إسماعيل"),
    SoundOption("nasser_alqatami", "الشيخ ناصر القطامي"),
    SoundOption("abdulbasit_fajr", "أذان الفجر — عبد الباسط"),
    SoundOption("toubar_fajr", "أذان الفجر — نصر الدين طوبار"),
    SoundOption("duha_surah", "سورة الضحى المباركة (لصلاة الضحى)"),
    SoundOption("salawat_1", "تنبيه الصلاة على النبي ﷺ")
)

private val PRE_ALERT_VOICE_OPTIONS = listOf(
    SoundOption("pre_prayer_15m", "تنبيه قبل الصلاة المخصص"),
    SoundOption("salawat_1", "الصلاة على النبي ﷺ (١)"),
    SoundOption("salawat_2", "الصلاة على النبي ﷺ (٢)"),
    SoundOption("salawat_3", "الصلاة على النبي ﷺ (٣)"),
    SoundOption("asmaa_allah_al_husna", "أسماء الله الحسنى")
)

private val ALERT_MODE_OPTIONS = listOf(
    SoundOption("full_azan", "الأذان الكامل"),
    SoundOption("short_tone", "تنبيه صوتي مختصر"),
    SoundOption("vibrate_only", "اهتزاز وإشعار فقط"),
    SoundOption("silent", "إشعار صامت بدون صوت")
)

private val IQAMA_VOICE_OPTIONS = listOf(
    SoundOption("iqama_1", "صوت الإقامة (١)"),
    SoundOption("iqama_2", "صوت الإقامة (٢)"),
    SoundOption("iqama_3", "صوت الإقامة (٣)"),
    SoundOption("iqama", "صوت الإقامة التقليدي"),
    SoundOption("none", "بدون إقامة")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrayerSettingsScreen(
    prefs: NativePreferences,
    initialPrayerKey: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()

    var selectedPrayerKey by remember(initialPrayerKey) {
        mutableStateOf(
            if (initialPrayerKey in NativePreferences.ALL_PRAYER_KEYS) initialPrayerKey else "fajr"
        )
    }

    // Editable draft for the currently selected prayer tab
    var draft by remember(selectedPrayerKey) {
        mutableStateOf(prefs.getPrayerConfig(selectedPrayerKey))
    }

    var hasNotificationPolicyAccess by remember {
        mutableStateOf(SystemPermissionHelper.isNotificationPolicyAccessGranted(context))
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                hasNotificationPolicyAccess = SystemPermissionHelper.isNotificationPolicyAccessGranted(context)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // Dialog states
    var helpDialogTitle by remember { mutableStateOf<String?>(null) }
    var helpDialogBody by remember { mutableStateOf<String?>(null) }
    var showApplyAllDialog by remember { mutableStateOf(false) }

    BackHandler {
        when {
            helpDialogTitle != null -> {
                helpDialogTitle = null
                helpDialogBody = null
            }
            showApplyAllDialog -> showApplyAllDialog = false
            else -> onBack()
        }
    }

    fun openHelp(title: String, body: String) {
        helpDialogTitle = title
        helpDialogBody = body
    }

    fun previewSound(trackId: String, label: String, section: String = "prayer_azan") {
        if (trackId == "none") {
            Toast.makeText(context, "لا يوجد صوت محدد لهذا الخيار", Toast.LENGTH_SHORT).show()
            return
        }
        val intent = Intent(context, AzkarAudioService::class.java).apply {
            putExtra("section", section)
            putExtra("title", "معاينة: $label")
            putExtra("body", "معاينة إعدادات ${draft.arabicName}")
            putExtra("audioTrackId", trackId)
            putExtra("prayerName", draft.arabicName)
            putExtra("cityName", prefs.cityName)
            putExtra("volumePercent", draft.volumePercent)
            putExtra("alertMode", "full_azan")
            putExtra("autoPlay", true)
            putExtra("isTestAlarm", true)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    fun stopPreviewSound() {
        val stopIntent = Intent(context, AzkarAudioService::class.java).apply {
            action = AzkarAudioService.ACTION_STOP_AUDIO
        }
        context.startService(stopIntent)
    }

    // Compute live astronomical + adjusted time for the active prayer tab
    val cityTz = remember(prefs.cityTimezoneId) {
        if (prefs.cityTimezoneId.isNotEmpty()) TimeZone.getTimeZone(prefs.cityTimezoneId) else TimeZone.getDefault()
    }
    val cal = remember(cityTz) { Calendar.getInstance(cityTz) }
    val tzOffset = remember(prefs.cityTimezoneId, prefs.longitude, cal.timeInMillis) {
        PrayerTimeCalculator.resolveTimezoneOffsetHours(prefs.cityTimezoneId, cal.timeInMillis, prefs.longitude)
    }
    val baseTimes = remember(prefs.latitude, prefs.longitude, prefs.cityTimezoneId, prefs.calculationMethod, prefs.asrMethod, prefs.highLatitudeRule, tzOffset) {
        PrayerTimeCalculator.calculateDailyPrayers(
            cal,
            prefs.latitude,
            prefs.longitude,
            tzOffset,
            prefs.calculationMethod,
            prefs.asrMethod,
            prefs.highLatitudeRule
        )
    }
    val baseMinuteForPrayer = when (selectedPrayerKey) {
        "fajr" -> baseTimes.fajrMinutes
        "sunrise" -> baseTimes.sunriseMinutes
        "duha" -> baseTimes.duhaMinutes
        "dhuhr" -> baseTimes.dhuhrMinutes
        "asr" -> baseTimes.asrMinutes
        "maghrib" -> baseTimes.maghribMinutes
        "isha" -> baseTimes.ishaMinutes
        else -> baseTimes.fajrMinutes
    }
    val adjustedMinute = (baseMinuteForPrayer + draft.offsetMinutes).coerceIn(0, 24 * 60 - 1)

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MoazenCardEnd)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = {
                                stopPreviewSound()
                                onBack()
                            },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = MoazenInkEmerald, modifier = Modifier.size(20.dp))
                        }
                        Column {
                            Text(
                                text = "إعدادات الصلاة المتقدمة",
                                color = MoazenInkPrimary,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${draft.arabicName} • ${prefs.cityName}",
                                color = MoazenGoldDark,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    IconButton(
                        onClick = { stopPreviewSound() },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(Icons.Default.VolumeOff, contentDescription = "إيقاف المعاينة", tint = MoazenInkMuted, modifier = Modifier.size(20.dp))
                    }
                }

                // 7 Independent Prayer Tabs
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 12.dp, vertical = 5.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    NativePreferences.ALL_PRAYER_KEYS.forEach { key ->
                        val isActive = selectedPrayerKey == key
                        val tabTitle = NativePreferences.prayerArabicName(key)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isActive) MoazenInkEmerald else MoazenInkEmerald.copy(alpha = 0.08f))
                                .clickable {
                                    selectedPrayerKey = key
                                    draft = prefs.getPrayerConfig(key)
                                }
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = tabTitle,
                                color = if (isActive) Color.White else MoazenInkPrimary,
                                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 13.sp,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }
                }
                HorizontalDivider(color = MoazenCardBorder, thickness = 1.dp)
            }
        },
        bottomBar = {
            Surface(
                color = MoazenCardEnd,
                shadowElevation = 8.dp,
                border = BorderStroke(1.dp, MoazenCardBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = {
                            stopPreviewSound()
                            prefs.savePrayerConfig(draft)
                            coroutineScope.launch(Dispatchers.IO) {
                                BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                            }
                            showApplyAllDialog = true
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("موافق", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            stopPreviewSound()
                            onBack()
                        },
                        border = BorderStroke(1.dp, MoazenCardBorder),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                    ) {
                        Text("رجوع", color = MoazenInkPrimary, fontWeight = FontWeight.Medium, fontSize = 15.sp)
                    }
                }
            }
        },
        containerColor = EmeraldDeep
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Live Calculated Time Card
            item {
                MoazenWidgetCard(
                    cornerRadius = 16.dp,
                    borderColor = MoazenGold.copy(alpha = 0.65f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "وقت ${draft.arabicName} الفلكي: ${PrayerTimeCalculator.formatMinutesToHHmm(baseMinuteForPrayer)}",
                                color = MoazenInkMuted,
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "الوقت الفعلي المعتمد للأذان والعداد:",
                                color = MoazenInkPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Text(
                            text = PrayerTimeCalculator.formatMinutesToHHmm(adjustedMinute),
                            color = MoazenInkEmerald,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // 1. Manual Time Offset Adjustment
            item {
                PrayerSettingCard(
                    title = "تصحيح وقت الصلاة يدويًا (بالدقائق)",
                    subtitle = when {
                        draft.offsetMinutes > 0 -> "تقديم +${draft.offsetMinutes} دقيقة"
                        draft.offsetMinutes < 0 -> "تأخير ${draft.offsetMinutes} دقيقة"
                        else -> "بدون تعديل (0 دقيقة)"
                    },
                    onHelpClick = {
                        openHelp(
                            "تصحيح وقت الصلاة يدويًا",
                            "يتيح لك تقديم أو تأخير وقت ${draft.arabicName} بالدقائق (-60 إلى +60 دقيقة) ليطابق توقيت المسجد القريب منك بدقة، ويُحدّث العداد والمنبهات تلقائيًا."
                        )
                    }
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Slider(
                            value = draft.offsetMinutes.toFloat(),
                            onValueChange = { draft = draft.copy(offsetMinutes = it.roundToInt()) },
                            valueRange = -60f..60f,
                            colors = SliderDefaults.colors(
                                thumbColor = MoazenInkEmerald,
                                activeTrackColor = MoazenInkEmerald,
                                inactiveTrackColor = MoazenInkEmerald.copy(alpha = 0.2f)
                            )
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            FilledTonalButton(
                                onClick = { draft = draft.copy(offsetMinutes = (draft.offsetMinutes - 1).coerceIn(-60, 60)) },
                                colors = ButtonDefaults.filledTonalButtonColors(containerColor = MoazenInkEmerald.copy(alpha = 0.1f))
                            ) {
                                Text("-1 دقيقة", color = MoazenInkPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                            TextButton(onClick = { draft = draft.copy(offsetMinutes = 0) }) {
                                Text("إعادة للـ 0", color = MoazenGoldDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            FilledTonalButton(
                                onClick = { draft = draft.copy(offsetMinutes = (draft.offsetMinutes + 1).coerceIn(-60, 60)) },
                                colors = ButtonDefaults.filledTonalButtonColors(containerColor = MoazenInkEmerald.copy(alpha = 0.1f))
                            ) {
                                Text("+1 دقيقة", color = MoazenInkPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            // 2. Enable/Disable Azan at Prayer Time
            item {
                PrayerSettingSwitchCard(
                    title = "تفعيل الأذان / التنبيه وقت ${draft.arabicName}",
                    subtitle = if (draft.soundEnabled) "مفعّل — سيعمل التنبيه في وقت الصلاة" else "موقوف لهذه الصلاة",
                    checked = draft.soundEnabled,
                    onCheckedChange = { draft = draft.copy(soundEnabled = it) },
                    onHelpClick = {
                        openHelp(
                            "تفعيل الأذان وقت الصلاة",
                            "عند التفعيل، يتم تشغيل الأذان أو التنبيه الصوتي تلقائيًا في الخلفية عند دخول وقت ${draft.arabicName}."
                        )
                    }
                )
            }

            // 3. Azan Volume Control
            item {
                PrayerSettingCard(
                    title = "مستوى صوت الأذان (${draft.volumePercent}%)",
                    subtitle = "تحكم بمستوى صوت المؤذن والتنبيهات الخاصة بـ ${draft.arabicName}",
                    onHelpClick = {
                        openHelp(
                            "مستوى صوت الأذان",
                            "يضبط قوة الصوت المخصصة لأذان ${draft.arabicName} عند تشغيله عبر قناة المنبهات (من 0% إلى 100%)."
                        )
                    }
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Slider(
                            value = draft.volumePercent.toFloat(),
                            onValueChange = { draft = draft.copy(volumePercent = it.roundToInt().coerceIn(0, 100)) },
                            valueRange = 0f..100f,
                            colors = SliderDefaults.colors(
                                thumbColor = MoazenInkEmerald,
                                activeTrackColor = MoazenInkEmerald,
                                inactiveTrackColor = MoazenInkEmerald.copy(alpha = 0.2f)
                            )
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            OutlinedButton(
                                onClick = {
                                    previewSound(
                                        draft.azanVoice,
                                        "تجربة مستوى صوت ${draft.arabicName}",
                                        "prayer_azan"
                                    )
                                },
                                border = BorderStroke(1.dp, MoazenGoldDark)
                            ) {
                                Icon(Icons.Default.VolumeUp, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("معاينة الصوت بهذا المستوى", color = MoazenInkEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // 4. Pre-Prayer Audio Reminder & Minutes Slider
            item {
                PrayerSettingCard(
                    title = "التذكير الصوتي قبل الصلاة",
                    subtitle = if (draft.preAlertEnabled) "تذكير قبل ${draft.arabicName} بـ ${draft.preAlertMinutes} دقيقة" else "التذكير المسبق متوقف",
                    trailingHeader = {
                        Switch(
                            checked = draft.preAlertEnabled,
                            onCheckedChange = { draft = draft.copy(preAlertEnabled = it) },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
                        )
                    },
                    onHelpClick = {
                        openHelp(
                            "التذكير الصوتي قبل الصلاة",
                            "ينبهك بالصوت والإشعار قبل دخول وقت ${draft.arabicName} بعدد الدقائق الذي تحدده (من 1 إلى 60 دقيقة) للاستعداد للوضوء والصلاة."
                        )
                    }
                ) {
                    if (draft.preAlertEnabled) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "التنبيه قبل الصلاة بـ: ${draft.preAlertMinutes} دقيقة",
                                color = MoazenInkEmerald,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Slider(
                                value = draft.preAlertMinutes.toFloat(),
                                onValueChange = {
                                    draft = draft.copy(preAlertMinutes = it.roundToInt().coerceIn(1, 60))
                                },
                                valueRange = 1f..60f,
                                colors = SliderDefaults.colors(
                                    thumbColor = MoazenInkEmerald,
                                    activeTrackColor = MoazenInkEmerald,
                                    inactiveTrackColor = MoazenInkEmerald.copy(alpha = 0.2f)
                                )
                            )
                        }
                    }
                }
            }

            // 5. Pre-Azan Alert Sound Dropdown
            item {
                PrayerDropdownCard(
                    title = "صوت التنبيه قبل الأذان",
                    selectedId = draft.preAlertVoice,
                    options = PRE_ALERT_VOICE_OPTIONS,
                    onSelect = { draft = draft.copy(preAlertVoice = it) },
                    onPreview = { id, label -> previewSound(id, label, "prePrayerAlert") },
                    onHelpClick = {
                        openHelp(
                            "صوت التنبيه قبل الأذان",
                            "اختر النغمة أو الذكر الذي يُشغَّل عند حلول موعد التنبيه المسبق قبل ${draft.arabicName}."
                        )
                    }
                )
            }

            // 6. Silent Mode During Prayer
            item {
                PrayerSettingCard(
                    title = "وضع الصامت أثناء وقت الصلاة",
                    subtitle = if (draft.silentDuringPrayer) "يكتم رنين الهاتف لمدة 15 دقيقة تلقائيًا" else "متوقف",
                    trailingHeader = {
                        Switch(
                            checked = draft.silentDuringPrayer,
                            onCheckedChange = { draft = draft.copy(silentDuringPrayer = it) },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
                        )
                    },
                    onHelpClick = {
                        openHelp(
                            "وضع الصامت أثناء وقت الصلاة",
                            "يحوّل الهاتف تلقائيًا إلى وضع الصامت عند دخول وقت ${draft.arabicName} ثم يعيد الوضع السابق بعد 15 دقيقة. يتطلب إذن عدم الإزعاج على Android."
                        )
                    }
                ) {
                    if (draft.silentDuringPrayer && !hasNotificationPolicyAccess) {
                        Button(
                            onClick = { SystemPermissionHelper.openNotificationPolicySettings(context) },
                            colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.DoNotDisturbOn, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("منح إذن التحكم بوضع الصامت (عدم الإزعاج)", color = Color.White, fontSize = 12.sp)
                        }
                    }
                }
            }

            // 7. Azan Muadhin Voice Dropdown
            item {
                PrayerDropdownCard(
                    title = "صوت الأذان (قائمة المؤذنين)",
                    selectedId = draft.azanVoice,
                    options = AZAN_VOICE_OPTIONS,
                    onSelect = { draft = draft.copy(azanVoice = it) },
                    onPreview = { id, label -> previewSound(id, label, "prayer_azan") },
                    onHelpClick = {
                        openHelp(
                            "اختيار صوت المؤذن",
                            "اختر صوت المؤذن المفضل لهذه الصلاة؛ يمكنك تخصيص صوت مستقل للفجر وصوت مختلف لكل صلاة أخرى."
                        )
                    }
                )
            }

            // 8. Alert Method Dropdown
            item {
                PrayerDropdownCard(
                    title = "طريقة التنبيه وقت الأذان",
                    selectedId = draft.alertMode,
                    options = ALERT_MODE_OPTIONS,
                    onSelect = { draft = draft.copy(alertMode = it) },
                    onPreview = null,
                    onHelpClick = {
                        openHelp(
                            "طريقة التنبيه وقت الأذان",
                            "حدّد كيف ينبّهك التطبيق عند دخول الوقت: تشغيل الأذان كاملًا، أو تنبيه صوتي مختصر، أو اهتزاز فقط، أو إشعار صامت."
                        )
                    }
                )
            }

            // 9. Iqama Voice Dropdown
            item {
                PrayerDropdownCard(
                    title = "صوت الإقامة",
                    selectedId = draft.iqamaVoice,
                    options = IQAMA_VOICE_OPTIONS,
                    onSelect = { draft = draft.copy(iqamaVoice = it) },
                    onPreview = { id, label ->
                        if (id != "none") previewSound(id, label, "iqama")
                    },
                    onHelpClick = {
                        openHelp(
                            "صوت الإقامة",
                            "يحدد صوت إقامة الصلاة بعد دخول وقت ${draft.arabicName} (أو إيقافها باختيار بدون إقامة)."
                        )
                    }
                )
            }

            // 10. Dua After Prayer Switch & Audio Preview
            item {
                PrayerSettingCard(
                    title = "دعاء بعد الأذان والصلاة",
                    subtitle = if (draft.duaAfterPrayerEnabled) "مفعّل: تشغيل الدعاء القصير بعد الأذان" else "متوقف",
                    trailingHeader = {
                        Switch(
                            checked = draft.duaAfterPrayerEnabled,
                            onCheckedChange = { draft = draft.copy(duaAfterPrayerEnabled = it) },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
                        )
                    },
                    onHelpClick = {
                        openHelp(
                            "دعاء بعد الصلاة",
                            "يعرض تذكيرًا ويشغّل الدعاء القصير المأثور بعد الأذان والصلاة فور انتهاء تنبيه ${draft.arabicName}."
                        )
                    }
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        OutlinedButton(
                            onClick = { previewSound("dua_after_azan", "الدعاء القصير بعد الأذان", "dua_after") },
                            border = BorderStroke(1.dp, MoazenGoldDark)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("استماع لصوت الدعاء", color = MoazenInkEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(8.dp)) }
        }
    }

    // Help Explanation Dialog
    if (helpDialogTitle != null && helpDialogBody != null) {
        AlertDialog(
            onDismissRequest = {
                helpDialogTitle = null
                helpDialogBody = null
            },
            containerColor = MoazenCardEnd,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Help, contentDescription = null, tint = MoazenInkEmerald)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(helpDialogTitle ?: "", color = MoazenInkEmerald, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Text(
                    text = helpDialogBody ?: "",
                    color = MoazenInkPrimary,
                    fontSize = 14.sp,
                    lineHeight = 22.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        helpDialogTitle = null
                        helpDialogBody = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald)
                ) {
                    Text("حسنًا", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    // Apply Same Settings to All Prayers Prompt after tapping "موافق"
    if (showApplyAllDialog) {
        AlertDialog(
            onDismissRequest = { showApplyAllDialog = false },
            containerColor = MoazenCardEnd,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = EmeraldPrimaryDark)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "تم حفظ إعدادات ${draft.arabicName}",
                        color = MoazenInkEmerald,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            text = {
                Text(
                    text = "هل تريد تطبيق نفس إعدادات التنبيه والصوت والمؤذن على جميع مواقيت الصلاة الأخرى أيضًا؟ (سيحتفظ كل وقت بتصحيح الدقائق الخاص به).",
                    color = MoazenInkPrimary,
                    fontSize = 14.sp,
                    lineHeight = 21.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        prefs.applyConfigToAllPrayers(draft)
                        coroutineScope.launch(Dispatchers.IO) {
                            BootReceiver.recalculateAndScheduleAll(context.applicationContext)
                        }
                        showApplyAllDialog = false
                        Toast.makeText(context, "تم تطبيق الإعدادات على جميع الصلوات بنجاح", Toast.LENGTH_SHORT).show()
                        onBack()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald)
                ) {
                    Text("تطبيق على جميع الصلوات", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showApplyAllDialog = false
                        Toast.makeText(context, "تم حفظ إعدادات ${draft.arabicName} فقط", Toast.LENGTH_SHORT).show()
                        onBack()
                    }
                ) {
                    Text("لهذه الصلاة فقط", color = MoazenInkMuted)
                }
            }
        )
    }
}

@Composable
private fun PrayerSettingCard(
    title: String,
    subtitle: String,
    onHelpClick: () -> Unit,
    trailingHeader: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit = {}
) {
    MoazenWidgetCard(
        cornerRadius = 16.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    IconButton(
                        onClick = onHelpClick,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.HelpOutline,
                            contentDescription = "شرح الإعداد",
                            tint = MoazenGoldDark,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = title,
                            color = MoazenInkPrimary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = subtitle,
                            color = MoazenInkMuted,
                            fontSize = 12.sp
                        )
                    }
                }
                if (trailingHeader != null) {
                    Spacer(modifier = Modifier.width(8.dp))
                    trailingHeader()
                }
            }
            content()
        }
    }
}

@Composable
private fun PrayerSettingSwitchCard(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    onHelpClick: () -> Unit
) {
    PrayerSettingCard(
        title = title,
        subtitle = subtitle,
        onHelpClick = onHelpClick,
        trailingHeader = {
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = MoazenInkEmerald)
            )
        }
    )
}

@Composable
private fun PrayerDropdownCard(
    title: String,
    selectedId: String,
    options: List<SoundOption>,
    onSelect: (String) -> Unit,
    onPreview: ((String, String) -> Unit)?,
    onHelpClick: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val currentOption = options.find { it.id == selectedId } ?: options.first()

    PrayerSettingCard(
        title = title,
        subtitle = currentOption.label,
        onHelpClick = onHelpClick
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(modifier = Modifier.weight(1f)) {
                MoazenSubWidgetBox(
                    cornerRadius = 10.dp,
                    onClick = { expanded = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 11.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = currentOption.label,
                            color = MoazenInkPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                        Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = MoazenInkEmerald)
                    }
                }

                DropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false },
                    modifier = Modifier.background(MoazenCardEnd)
                ) {
                    options.forEach { option ->
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = option.label,
                                    color = if (option.id == selectedId) MoazenInkEmerald else MoazenInkPrimary,
                                    fontWeight = if (option.id == selectedId) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 13.sp
                                )
                            },
                            onClick = {
                                onSelect(option.id)
                                expanded = false
                            }
                        )
                    }
                }
            }

            if (onPreview != null && currentOption.id != "none") {
                IconButton(
                    onClick = { onPreview(currentOption.id, currentOption.label) },
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(MoazenInkEmerald)
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "معاينة الصوت",
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }
    }
}
