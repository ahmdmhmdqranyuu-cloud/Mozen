package com.muslim.azan.ui.screens

import android.Manifest
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.model.Ayah
import com.muslim.azan.service.NativeEvaluationResult
import com.muslim.azan.service.NativeUploadState
import com.muslim.azan.service.NativeWordResult
import com.muslim.azan.service.PreparedWavClip
import com.muslim.azan.service.QuranRecitationManager
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenSubWidgetBox
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private data class EveryAyahReciterMap(
    val id: String,
    val nameArabic: String,
    val folder: String
)

private val SHEIKH_RECITERS = listOf(
    EveryAyahReciterMap("hussary", "الشيخ محمود خليل الحصري", "Husary_128kbps"),
    EveryAyahReciterMap("minshawi", "الشيخ محمد صديق المنشاوي", "Minshawy_Murattal_128kbps"),
    EveryAyahReciterMap("abdulbasit", "الشيخ عبد الباسط عبد الصمد", "Abdul_Basit_Murattal_192kbps"),
    EveryAyahReciterMap("alafasy", "الشيخ مشاري راشد العفاسي", "Alafasy_128kbps"),
    EveryAyahReciterMap("shuraym", "الشيخ سعود الشريم", "Saood_ash-Shuraym_128kbps")
)

private data class IndexedAyahWord(
    val globalIndex: Int,
    val word: String,
    val ayahNumberInSurah: Int,
    val isEndOfAyah: Boolean
)

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun SheikhTutorSection(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var unitType by remember { mutableStateOf(prefs.sheikhUnitType) } // "ayah" | "page"
    var selectedSurahNum by remember { mutableIntStateOf(prefs.sheikhLastSurah) }
    var selectedAyahNum by remember { mutableIntStateOf(prefs.sheikhLastAyah) }
    var selectedPageNum by remember { mutableIntStateOf(prefs.sheikhLastPage) }
    var rangeStart by remember { mutableIntStateOf(prefs.sheikhRangeStart) }
    var rangeEnd by remember { mutableIntStateOf(prefs.sheikhRangeEnd) }
    var ayahsList by remember { mutableStateOf<List<Ayah>>(emptyList()) }
    var pageAyahs by remember { mutableStateOf<List<Ayah>>(emptyList()) }

    // 5 decluttered single-line tabs: 0=Studio(Talqeen+Recitation), 1=Quiz, 2=Dashboard, 3=Report, 4=Settings
    var activeTab by remember { mutableIntStateOf(0) }
    var showSessionControls by remember { mutableStateOf(false) }

    var selectedReciterIdx by remember { mutableIntStateOf(0) }
    var targetRepeats by remember { mutableIntStateOf(prefs.sheikhTargetRepeats) }
    var currentRepeat by remember { mutableIntStateOf(0) }
    var dialect by remember { mutableStateOf(prefs.sheikhDialect) }
    var correctionMode by remember { mutableStateOf(prefs.sheikhCorrectionMode) }
    var autoAdvance by remember { mutableStateOf(prefs.sheikhAutoAdvance) }
    var autoRepeatFailed by remember { mutableStateOf(true) }

    // Advanced Settings
    var micSensitivity by remember { mutableFloatStateOf(prefs.sheikhMicSensitivity) }
    var noiseGateLevel by remember { mutableStateOf(prefs.sheikhNoiseGate) }
    var analysisSpeed by remember { mutableStateOf(prefs.sheikhAnalysisSpeed) }
    var vibrateOnError by remember { mutableStateOf(prefs.sheikhVibrateOnError) }
    var quickPopupEnabled by remember { mutableStateOf(prefs.sheikhQuickPopupEnabled) }

    // Mic test & diagnostics
    var micTestRunning by remember { mutableStateOf(false) }
    var micTestPeakLevel by remember { mutableFloatStateOf(0f) }
    var micTestClip by remember { mutableStateOf<PreparedWavClip?>(null) }
    var micTestStatusMsg by remember { mutableStateOf<String?>(null) }
    var isPlayingTestClip by remember { mutableStateOf(false) }
    var preferStandardMic by remember { mutableStateOf(false) }
    var serverHealthStatus by remember { mutableStateOf<String?>(null) }
    var checkingServerHealth by remember { mutableStateOf(false) }

    // Quick correction & playback
    var quickPopupErrors by remember { mutableStateOf<List<NativeWordResult>>(emptyList()) }
    var quickPopupErrorIdx by remember { mutableIntStateOf(0) }
    var statsRefreshKey by remember { mutableIntStateOf(0) }
    var isSpeakingWord by remember { mutableStateOf(false) }

    var isPlayingAyah by remember { mutableStateOf(false) }
    var isPausedAyah by remember { mutableStateOf(false) }
    var activePlaybackIdx by remember { mutableIntStateOf(-1) }
    var reciterSpeed by remember { mutableFloatStateOf(1.0f) }
    var hideAyahText by remember { mutableStateOf(false) }
    var isPlayingUserClip by remember { mutableStateOf(false) }
    var ayahMediaPlayer by remember { mutableStateOf<MediaPlayer?>(null) }

    // Quiz Mode
    var quizType by remember { mutableStateOf("hide") }
    var quizRevealed by remember { mutableStateOf(false) }
    var hintWordCount by remember { mutableIntStateOf(0) }

    // Evaluation & Pickers
    val uploadState by QuranRecitationManager.uploadState.collectAsState()
    val micLevel by QuranRecitationManager.micLevel.collectAsState()
    val recordingSec by QuranRecitationManager.recordingSeconds.collectAsState()
    var evaluationResult by remember { mutableStateOf<NativeEvaluationResult?>(null) }
    var selectedWordDetail by remember { mutableStateOf<NativeWordResult?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var uploadedFileLabel by remember { mutableStateOf<String?>(null) }
    var hasMicPerm by remember { mutableStateOf(QuranRecitationManager.hasMicrophonePermission(context)) }
    var showSurahPicker by remember { mutableStateOf(false) }
    var showAyahPicker by remember { mutableStateOf(false) }
    var showPagePicker by remember { mutableStateOf(false) }
    var pageInputStr by remember { mutableStateOf(selectedPageNum.toString()) }
    var showReciterPicker by remember { mutableStateOf(false) }

    // Session metrics
    val sessionStartMs = remember { System.currentTimeMillis() }
    val sessionReviewedAyahs = remember { mutableStateListOf<Int>() }
    val sessionForgottenWords = remember { mutableStateListOf<String>() }
    val sessionFailedAyahs = remember { mutableStateListOf<Int>() }
    var sessionCorrectWords by remember { mutableIntStateOf(0) }
    var sessionErrorWords by remember { mutableIntStateOf(0) }

    val activeSurahMeta = remember(selectedSurahNum) {
        NativeDataManager.surahs.find { it.number == selectedSurahNum } ?: NativeDataManager.surahs.first()
    }

    val currentAyahObj = remember(ayahsList, selectedAyahNum) {
        ayahsList.find { it.numberInSurah == selectedAyahNum }
    }

    // Active Ayahs list depends on Ayah vs Full Mushaf Page mode
    val activeTargetAyahs = remember(unitType, currentAyahObj, pageAyahs) {
        if (unitType == "page") pageAyahs else listOfNotNull(currentAyahObj)
    }

    val rawExpectedText = remember(activeTargetAyahs) {
        activeTargetAyahs.joinToString(" ") { it.textArabic.trim() }.trim()
    }

    val indexedWords = remember(activeTargetAyahs) {
        val list = mutableListOf<IndexedAyahWord>()
        var g = 0
        for (a in activeTargetAyahs) {
            val tokens = a.textArabic.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
            tokens.forEachIndexed { tIdx, w ->
                list.add(
                    IndexedAyahWord(
                        globalIndex = g++,
                        word = w,
                        ayahNumberInSurah = a.numberInSurah,
                        isEndOfAyah = (tIdx == tokens.lastIndex)
                    )
                )
            }
        }
        list
    }

    // Load Surah Ayahs
    LaunchedEffect(selectedSurahNum) {
        ayahsList = withContext(Dispatchers.IO) {
            NativeDataManager.loadAyahsForSurah(context, selectedSurahNum)
        }
        val max = activeSurahMeta.numberOfAyahs.coerceAtLeast(1)
        if (selectedAyahNum > max) selectedAyahNum = 1
        rangeStart = rangeStart.coerceIn(1, max)
        rangeEnd = rangeEnd.coerceIn(rangeStart, max)
    }

    // Load Page Ayahs
    LaunchedEffect(selectedPageNum) {
        pageAyahs = withContext(Dispatchers.IO) {
            NativeDataManager.loadAyahsForPage(context, selectedPageNum)
        }
    }

    // Persist preferences
    LaunchedEffect(
        unitType,
        selectedSurahNum,
        selectedAyahNum,
        selectedPageNum,
        targetRepeats,
        rangeStart,
        rangeEnd,
        dialect,
        correctionMode,
        micSensitivity,
        noiseGateLevel,
        analysisSpeed,
        vibrateOnError,
        quickPopupEnabled,
        autoAdvance
    ) {
        prefs.sheikhUnitType = unitType
        prefs.sheikhLastSurah = selectedSurahNum
        prefs.sheikhLastAyah = selectedAyahNum
        prefs.sheikhLastPage = selectedPageNum
        prefs.sheikhTargetRepeats = targetRepeats
        prefs.sheikhRangeStart = rangeStart
        prefs.sheikhRangeEnd = rangeEnd
        prefs.sheikhDialect = dialect
        prefs.sheikhCorrectionMode = correctionMode
        prefs.sheikhMicSensitivity = micSensitivity
        prefs.sheikhNoiseGate = noiseGateLevel
        prefs.sheikhAnalysisSpeed = analysisSpeed
        prefs.sheikhVibrateOnError = vibrateOnError
        prefs.sheikhQuickPopupEnabled = quickPopupEnabled
        prefs.sheikhAutoAdvance = autoAdvance
    }

    fun stopAyahPlayback() {
        runCatching {
            ayahMediaPlayer?.stop()
            ayahMediaPlayer?.release()
        }
        ayahMediaPlayer = null
        isPlayingAyah = false
        isPausedAyah = false
        activePlaybackIdx = -1
    }

    fun playEveryAyahQueue(queue: List<Pair<Int, Int>>, index: Int = 0) {
        if (index !in queue.indices || uploadState == NativeUploadState.RECORDING) {
            stopAyahPlayback()
            return
        }
        val (sNum, aNum) = queue[index]
        val reciter = SHEIKH_RECITERS[selectedReciterIdx]
        val sPad = String.format(Locale.US, "%03d", sNum)
        val aPad = String.format(Locale.US, "%03d", aNum)
        val url = "https://everyayah.com/data/${reciter.folder}/$sPad$aPad.mp3"

        runCatching {
            ayahMediaPlayer?.stop()
            ayahMediaPlayer?.release()
        }
        ayahMediaPlayer = null

        try {
            activePlaybackIdx = index
            val mp = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                setDataSource(url)
                setOnPreparedListener { player ->
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        runCatching {
                            player.playbackParams = player.playbackParams.setSpeed(reciterSpeed)
                        }
                    }
                    player.start()
                    isPlayingAyah = true
                    isPausedAyah = false
                }
                setOnCompletionListener {
                    if (index + 1 < queue.size) {
                        playEveryAyahQueue(queue, index + 1)
                    } else {
                        isPlayingAyah = false
                        activePlaybackIdx = -1
                        currentRepeat++
                        if (targetRepeats == 0 || currentRepeat < targetRepeats) {
                            scope.launch {
                                delay(750)
                                if (uploadState != NativeUploadState.RECORDING) {
                                    playEveryAyahQueue(queue, 0)
                                }
                            }
                        }
                    }
                }
                setOnErrorListener { _, _, _ ->
                    isPlayingAyah = false
                    activePlaybackIdx = -1
                    errorMessage = "تعذر تشغيل تلاوة الآية، تحقق من الإنترنت"
                    true
                }
                prepareAsync()
            }
            ayahMediaPlayer = mp
        } catch (_: Exception) {
            stopAyahPlayback()
            errorMessage = "تعذر تشغيل صوت القارئ"
        }
    }

    fun startOrResumePlayback(resume: Boolean = false, targetAyahOverride: Int? = null) {
        if (uploadState == NativeUploadState.RECORDING) return
        if (resume && isPausedAyah && ayahMediaPlayer != null) {
            runCatching {
                ayahMediaPlayer?.start()
                isPausedAyah = false
                isPlayingAyah = true
            }
            return
        }
        stopAyahPlayback()
        val queue = if (unitType == "page" && targetAyahOverride == null) {
            pageAyahs.map { it.surahNumber to it.numberInSurah }
        } else {
            listOf(selectedSurahNum to (targetAyahOverride ?: selectedAyahNum))
        }
        playEveryAyahQueue(queue, 0)
    }

    fun pauseAyahPlayback() {
        ayahMediaPlayer?.let { mp ->
            if (mp.isPlaying) {
                mp.pause()
                isPlayingAyah = false
                isPausedAyah = true
            } else {
                stopAyahPlayback()
            }
        }
    }

    fun resetActiveState() {
        stopAyahPlayback()
        QuranRecitationManager.stopPreparedClipPlayback()
        QuranRecitationManager.resetStatus()
        currentRepeat = 0
        evaluationResult = null
        selectedWordDetail = null
        isPlayingUserClip = false
        errorMessage = null
        uploadedFileLabel = null
        quizRevealed = false
        hintWordCount = 0
    }

    fun navigateToAyah(newAyah: Int) {
        resetActiveState()
        selectedAyahNum = newAyah.coerceIn(1, activeSurahMeta.numberOfAyahs.coerceAtLeast(1))
    }

    fun navigateToPage(newPage: Int) {
        resetActiveState()
        selectedPageNum = newPage.coerceIn(1, 604)
        pageInputStr = selectedPageNum.toString()
    }

    suspend fun evaluateClip(clipToSend: PreparedWavClip, ayahForClip: Int, expected: String) {
        errorMessage = null
        val adjacent = if (unitType == "page") {
            "صفحة المصحف الشريف رقم $selectedPageNum"
        } else {
            ayahsList
                .filter { kotlin.math.abs(it.numberInSurah - ayahForClip) <= 2 && it.numberInSurah != ayahForClip }
                .joinToString("\n") { "الآية ${it.numberInSurah}: ${it.textArabic}" }
        }

        val pageSurahName = if (unitType == "page") {
            pageAyahs.firstOrNull()?.surahName?.ifBlank { activeSurahMeta.nameArabic } ?: activeSurahMeta.nameArabic
        } else {
            activeSurahMeta.nameArabic
        }

        val effectiveSurahNum = if (unitType == "page") {
            pageAyahs.firstOrNull()?.surahNumber ?: selectedSurahNum
        } else {
            selectedSurahNum
        }

        val modeParam = when (activeTab) {
            1 -> "memorization_test"
            else -> "recitation"
        }

        val res = QuranRecitationManager.evaluateClipWithServer(
            context = context,
            serverBaseUrl = prefs.sheikhServerBaseUrl,
            clip = clipToSend,
            expectedText = expected,
            surahName = pageSurahName,
            surahNumber = effectiveSurahNum,
            ayahNumber = if (unitType == "page") (pageAyahs.firstOrNull()?.numberInSurah ?: 1) else ayahForClip,
            dialect = dialect,
            mode = modeParam,
            trainingMode = (correctionMode == "training"),
            adjacentAyahsText = adjacent,
            analysisSpeed = analysisSpeed,
            unitType = unitType,
            pageNumber = selectedPageNum
        )

        res.onSuccess { eval ->
            evaluationResult = eval
            val wrong = eval.wordResults.filter { it.status == "error" || it.status == "missing" }
            val correct = eval.wordResults.filter { it.status == "correct" }
            val passed = eval.status == "perfect" || (eval.score >= 80 && wrong.isEmpty())

            if (unitType == "page") {
                pageAyahs.forEach { a ->
                    if (!sessionReviewedAyahs.contains(a.numberInSurah)) sessionReviewedAyahs.add(a.numberInSurah)
                }
            } else if (!sessionReviewedAyahs.contains(ayahForClip)) {
                sessionReviewedAyahs.add(ayahForClip)
            }
            sessionCorrectWords += correct.size
            sessionErrorWords += wrong.size
            prefs.sheikhSessionsCount += 1
            prefs.sheikhCorrectWordsCount += correct.size

            val todayIso = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            val prevMasteredMap = prefs.getSheikhMasteredMap()
            val newlyMasteredDelta = if (passed && unitType == "ayah" && !prevMasteredMap.containsKey("$effectiveSurahNum:$ayahForClip")) 1 else if (passed && unitType == "page") pageAyahs.size else 0
            prefs.recordSheikhDailyProgress(todayIso, newlyMasteredDelta, correct.size, eval.score)
            statsRefreshKey += 1

            if (passed) {
                if (unitType == "page") {
                    pageAyahs.forEach { a -> prefs.recordSheikhAyahMastered(a.surahNumber, a.numberInSurah, eval.score) }
                } else {
                    prefs.recordSheikhAyahMastered(effectiveSurahNum, ayahForClip, eval.score)
                }
                if (activeTab == 1) quizRevealed = true
                if (autoAdvance) {
                    if (unitType == "page" && selectedPageNum < 604) {
                        delay(2400)
                        navigateToPage(selectedPageNum + 1)
                    } else if (unitType == "ayah" && ayahForClip < rangeEnd) {
                        delay(2400)
                        navigateToAyah(ayahForClip + 1)
                    }
                }
            } else {
                if (wrong.isNotEmpty()) {
                    if (vibrateOnError) QuranRecitationManager.vibrateOnMistake(context)
                    if (correctionMode == "instant") QuranRecitationManager.playErrorTickSound()
                    if (quickPopupEnabled) {
                        quickPopupErrors = wrong
                        quickPopupErrorIdx = 0
                    }
                }
                if (!sessionFailedAyahs.contains(ayahForClip)) sessionFailedAyahs.add(ayahForClip)
                wrong.forEach { w ->
                    if (!sessionForgottenWords.contains(w.expectedWord)) sessionForgottenWords.add(w.expectedWord)
                }
                prefs.recordSheikhWeakAyahError(effectiveSurahNum, ayahForClip, pageSurahName, wrong.map { it.expectedWord })
                if (autoRepeatFailed && correctionMode == "instant" && !quickPopupEnabled) {
                    delay(1800)
                    startOrResumePlayback(false, if (unitType == "page") null else ayahForClip)
                }
            }
        }.onFailure { err ->
            errorMessage = err.message ?: "تعذر إرسال التلاوة للتحليل"
        }
    }

    fun startMicRecording() {
        stopAyahPlayback()
        QuranRecitationManager.stopPreparedClipPlayback()
        isPlayingUserClip = false
        evaluationResult = null
        selectedWordDetail = null
        quickPopupErrors = emptyList()
        errorMessage = null
        uploadedFileLabel = null
        val startRes = QuranRecitationManager.startRecording(
            context = context,
            sensitivityMultiplier = micSensitivity,
            noiseGateLevel = noiseGateLevel,
            preferStandardMic = preferStandardMic
        )
        startRes.onFailure { err ->
            errorMessage = err.message ?: "تعذر بدء التسجيل عبر الميكروفون"
        }
    }

    val micPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasMicPerm = granted
        if (granted) {
            startMicRecording()
        } else {
            errorMessage = "تم رفض إذن الميكروفون. يمكنك تفعيله أو رفع ملف صوتي جاهز."
        }
    }

    val audioFilePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            stopAyahPlayback()
            QuranRecitationManager.stopPreparedClipPlayback()
            evaluationResult = null
            selectedWordDetail = null
            quickPopupErrors = emptyList()
            errorMessage = null
            val prep = QuranRecitationManager.prepareAudioFromUri(context, uri)
            prep.onSuccess { clip ->
                val kb = (clip.wavBytes.size / 1024).coerceAtLeast(1)
                uploadedFileLabel = "${clip.fileName} ($kb KB)"
                evaluateClip(clip, selectedAyahNum, rawExpectedText)
            }.onFailure { err ->
                errorMessage = err.message ?: "تعذر قراءة الملف الصوتي"
            }
        }
    }

    fun onMicButtonClick() {
        if (uploadState == NativeUploadState.RECORDING) {
            scope.launch {
                val stopRes = QuranRecitationManager.stopAndFinalizeRecording()
                stopRes.onSuccess { clip ->
                    evaluateClip(clip, selectedAyahNum, rawExpectedText)
                }.onFailure { err ->
                    errorMessage = err.message ?: "التسجيل فارغ أو غير واضح"
                }
            }
        } else {
            if (!QuranRecitationManager.hasMicrophonePermission(context)) {
                micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            } else {
                startMicRecording()
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            stopAyahPlayback()
            QuranRecitationManager.stopPreparedClipPlayback()
            QuranRecitationManager.abortRecording()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(14.dp)
    ) {
        // CLEAN HEADER
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = {
                    stopAyahPlayback()
                    QuranRecitationManager.abortRecording()
                    onBack()
                }) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = GoldAccent)
                }
                Column {
                    Text(
                        text = "معلم القرآن الذكي «شيخي»",
                        color = TextPrimary,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (unitType == "page") "وضع المصحف • صفحة $selectedPageNum" else "سورة ${activeSurahMeta.nameArabic} • الآية $selectedAyahNum",
                        color = GoldLight,
                        fontSize = 11.sp
                    )
                }
            }

            IconButton(onClick = { showReciterPicker = true }) {
                Icon(Icons.Default.RecordVoiceOver, contentDescription = "القارئ", tint = GoldAccent)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 5 CLEAN UNCLUTTERED SINGLE-LINE TABS
        val tabTitles = listOf("التسميع والتلقين", "اختبار الحفظ", "لوحة الحفظ", "التقرير", "الإعدادات")
        MoazenWidgetCard(
            cornerRadius = 14.dp,
            elevation = 1.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                tabTitles.forEachIndexed { idx, label ->
                    val isSelectedTab = activeTab == idx
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelectedTab) MoazenInkEmerald else Color.Transparent)
                            .clickable {
                                if (uploadState != NativeUploadState.RECORDING && !micTestRunning) activeTab = idx
                            }
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            color = if (isSelectedTab) Color.White else MoazenInkPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // CLEAN UNIT NAVIGATOR BAR (AYAH OR FULL 604-PAGE MUSHAF)
            MoazenWidgetCard(cornerRadius = 18.dp, modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Unit Type Switcher
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("ayah" to "آية محددة", "page" to "صفحة مصحف كاملة (1–604)").forEach { (key, title) ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (unitType == key) MoazenInkEmerald else Color.White.copy(alpha = 0.72f))
                                    .clickable {
                                        if (uploadState != NativeUploadState.RECORDING) {
                                            resetActiveState()
                                            unitType = key
                                        }
                                    }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = title,
                                    color = if (unitType == key) Color.White else MoazenInkPrimary,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    if (unitType == "ayah") {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Button(
                                onClick = { showSurahPicker = true },
                                colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("سورة ${activeSurahMeta.nameArabic}", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }

                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                IconButton(
                                    onClick = { navigateToAyah(selectedAyahNum - 1) },
                                    enabled = selectedAyahNum > 1 && uploadState != NativeUploadState.RECORDING,
                                    modifier = Modifier.size(30.dp)
                                ) {
                                    Icon(Icons.Default.ChevronRight, contentDescription = "السابقة", tint = MoazenInkEmerald)
                                }
                                MoazenSubWidgetBox(
                                    cornerRadius = 8.dp,
                                    onClick = { if (uploadState != NativeUploadState.RECORDING) showAyahPicker = true }
                                ) {
                                    Text(
                                        text = "آية $selectedAyahNum / ${activeSurahMeta.numberOfAyahs} ▾",
                                        color = MoazenInkEmerald,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                    )
                                }
                                IconButton(
                                    onClick = { navigateToAyah(selectedAyahNum + 1) },
                                    enabled = selectedAyahNum < activeSurahMeta.numberOfAyahs && uploadState != NativeUploadState.RECORDING,
                                    modifier = Modifier.size(30.dp)
                                ) {
                                    Icon(Icons.Default.ChevronLeft, contentDescription = "التالية", tint = MoazenInkEmerald)
                                }
                            }
                        }
                    } else {
                        val pageSurahLabel = pageAyahs.firstOrNull()?.surahName?.let { "سورة $it" } ?: "مصحف"
                        val pageJuzLabel = pageAyahs.firstOrNull()?.juz?.let { "الجزء $it" } ?: ""
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "$pageSurahLabel • $pageJuzLabel",
                                    color = MoazenInkEmerald,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${pageAyahs.size} آية في هذه الصفحة",
                                    color = MoazenInkMuted,
                                    fontSize = 10.sp
                                )
                            }

                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                IconButton(
                                    onClick = { navigateToPage(selectedPageNum - 1) },
                                    enabled = selectedPageNum > 1 && uploadState != NativeUploadState.RECORDING,
                                    modifier = Modifier.size(30.dp)
                                ) {
                                    Icon(Icons.Default.ChevronRight, contentDescription = "الصفحة السابقة", tint = MoazenInkEmerald)
                                }
                                MoazenSubWidgetBox(
                                    cornerRadius = 8.dp,
                                    onClick = {
                                        if (uploadState != NativeUploadState.RECORDING) {
                                            pageInputStr = selectedPageNum.toString()
                                            showPagePicker = true
                                        }
                                    }
                                ) {
                                    Text(
                                        text = "صفحة $selectedPageNum / 604 ▾",
                                        color = MoazenInkEmerald,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                    )
                                }
                                IconButton(
                                    onClick = { navigateToPage(selectedPageNum + 1) },
                                    enabled = selectedPageNum < 604 && uploadState != NativeUploadState.RECORDING,
                                    modifier = Modifier.size(30.dp)
                                ) {
                                    Icon(Icons.Default.ChevronLeft, contentDescription = "الصفحة التالية", tint = MoazenInkEmerald)
                                }
                            }
                        }
                    }

                    // Collapsible Session Options Button (Decluttered UI!)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(
                            onClick = { showSessionControls = !showSessionControls },
                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp)
                        ) {
                            Icon(
                                imageVector = if (showSessionControls) Icons.Default.ExpandLess else Icons.Default.Tune,
                                contentDescription = null,
                                tint = MoazenGoldDark,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (showSessionControls) "إخفاء خيارات التكرار والسرعة" else "خيارات الجلسة (تكرار ${if (targetRepeats == 0) "∞" else targetRepeats} • ${reciterSpeed}x)",
                                color = MoazenGoldDark,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        if (uploadedFileLabel != null) {
                            Text(
                                text = "ملف: $uploadedFileLabel",
                                color = MoazenInkEmerald,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    if (showSessionControls) {
                        MoazenSubWidgetBox(cornerRadius = 12.dp, modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (unitType == "ayah") {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("نطاق الحفظ: $rangeStart – $rangeEnd", color = MoazenInkPrimary, fontSize = 11.sp)
                                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                            TextButton(
                                                onClick = { rangeStart = selectedAyahNum; if (rangeEnd < rangeStart) rangeEnd = rangeStart },
                                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                            ) { Text("البداية", color = MoazenInkEmerald, fontSize = 11.sp) }
                                            TextButton(
                                                onClick = { rangeEnd = maxOf(rangeStart, selectedAyahNum) },
                                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                            ) { Text("النهاية", color = MoazenInkEmerald, fontSize = 11.sp) }
                                        }
                                    }
                                }
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        listOf(1, 2, 3, 5, 0).forEach { rep ->
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(7.dp))
                                                    .background(if (targetRepeats == rep) MoazenInkEmerald else Color.White)
                                                    .clickable { targetRepeats = rep }
                                                    .padding(horizontal = 7.dp, vertical = 4.dp)
                                            ) {
                                                Text(
                                                    text = if (rep == 0) "مستمر" else "$rep",
                                                    color = if (targetRepeats == rep) Color.White else MoazenInkPrimary,
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        listOf(0.75f to "0.75x", 1.0f to "1x", 1.25f to "1.25x").forEach { (spd, lbl) ->
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(7.dp))
                                                    .background(if (reciterSpeed == spd) MoazenGoldDark else Color.White)
                                                    .clickable {
                                                        reciterSpeed = spd
                                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && ayahMediaPlayer?.isPlaying == true) {
                                                            runCatching {
                                                                ayahMediaPlayer?.let { mp -> mp.playbackParams = mp.playbackParams.setSpeed(spd) }
                                                            }
                                                        }
                                                    }
                                                    .padding(horizontal = 6.dp, vertical = 4.dp)
                                            ) {
                                                Text(lbl, color = if (reciterSpeed == spd) Color.White else MoazenInkPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    TextButton(
                                        onClick = { correctionMode = if (correctionMode == "instant") "training" else "instant" },
                                        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                    ) {
                                        Text(
                                            text = if (correctionMode == "instant") "الوضع: تصحيح فوري" else "الوضع: تدريب وتلقين",
                                            color = MoazenInkEmerald,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    TextButton(
                                        onClick = { autoAdvance = !autoAdvance },
                                        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                    ) {
                                        Text(
                                            text = if (autoAdvance) "الانتقال: تلقائي ✓" else "الانتقال: يدوي",
                                            color = MoazenGoldDark,
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

            // STATUS BANNER (ONLY COMPACT & CLEAR WHEN RELEVANT OR ACTIVE)
            MoazenWidgetCard(
                cornerRadius = 14.dp,
                borderColor = when (uploadState) {
                    NativeUploadState.RECORDING -> Color(0xFFD32F2F)
                    NativeUploadState.FAILED -> Color(0xFFF57C00)
                    NativeUploadState.COMPLETED -> SuccessGreen
                    else -> MoazenCardBorder
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (uploadState == NativeUploadState.RECORDING) {
                            "${uploadState.arabicLabel} (${recordingSec}ث)"
                        } else {
                            uploadState.arabicLabel
                        },
                        color = when (uploadState) {
                            NativeUploadState.RECORDING -> Color(0xFFB71C1C)
                            NativeUploadState.FAILED -> Color(0xFFE65100)
                            NativeUploadState.COMPLETED -> Color(0xFF0B5E42)
                            else -> MoazenInkEmerald
                        },
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f)
                    )

                    if (uploadState == NativeUploadState.RECORDING) {
                        LinearProgressIndicator(
                            progress = { micLevel },
                            modifier = Modifier
                                .width(64.dp)
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = Color(0xFFD32F2F),
                            trackColor = MoazenCardBorder
                        )
                    } else if (uploadState == NativeUploadState.FAILED && QuranRecitationManager.lastPreparedClip != null) {
                        Button(
                            onClick = {
                                val clip = QuranRecitationManager.lastPreparedClip ?: return@Button
                                scope.launch { evaluateClip(clip, selectedAyahNum, rawExpectedText) }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.height(30.dp)
                        ) {
                            Text("إعادة الإرسال", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            if (errorMessage != null) {
                MoazenWidgetCard(
                    cornerRadius = 14.dp,
                    borderColor = Color(0xFFD32F2F),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(text = errorMessage!!, color = Color(0xFFB71C1C), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        if (!hasMicPerm) {
                            TextButton(onClick = { SystemPermissionHelper.openAppDetailsSettings(context) }) {
                                Text("فتح إعدادات التطبيق لمنح إذن الميكروفون", color = MoazenInkEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            if (activeTab == 0) {
                // TAB 0: DECLUTTERED RECITATION & TALQEEN STUDIO (AYAH OR FULL PAGE)
                MoazenWidgetCard(
                    cornerRadius = 20.dp,
                    borderColor = MoazenGold.copy(alpha = 0.55f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = evaluationResult?.let { "دقة التلاوة: ${it.score}%" }
                                    ?: if (unitType == "page") "صفحة $selectedPageNum • ${indexedWords.size} كلمة" else "آيات متقنة: ${prefs.getSheikhMasteredMap().size}",
                                color = MoazenInkEmerald,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            MoazenSubWidgetBox(
                                cornerRadius = 8.dp,
                                onClick = { hideAyahText = !hideAyahText }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = if (hideAyahText) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = null,
                                        tint = MoazenInkEmerald,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Text(
                                        text = if (hideAyahText) "إظهار النص" else "إخفاء غيباً",
                                        color = MoazenInkEmerald,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        if (hideAyahText) {
                            MoazenSubWidgetBox(cornerRadius = 14.dp, modifier = Modifier.fillMaxWidth()) {
                                Column(
                                    modifier = Modifier.padding(20.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = if (unitType == "page") "وضع تسميع الصفحة غيباً — صفحة $selectedPageNum مخفية" else "وضع التسميع غيباً — النص مخفي مؤقتاً",
                                        color = MoazenInkEmerald,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        textAlign = TextAlign.Center
                                    )
                                    Text(
                                        text = "رتّل من حفظك أو ارفع ملف تلاوتك ثم اضغط إيقاف للتحليل",
                                        color = MoazenInkMuted,
                                        fontSize = 11.sp,
                                        textAlign = TextAlign.Center
                                    )
                                    TextButton(onClick = { hideAyahText = false }) {
                                        Text("كشف النص للمراجعة", color = MoazenGoldDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        } else {
                            FlowRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(5.dp, Alignment.CenterHorizontally),
                                verticalArrangement = Arrangement.spacedBy(7.dp)
                            ) {
                                indexedWords.forEach { item ->
                                    val wEval = evaluationResult?.wordResults?.find { it.positionIndex == item.globalIndex }
                                    val chipBg = when (wEval?.status) {
                                        "correct" -> Color(0xFFD1FAE5)
                                        "error", "missing" -> Color(0xFFFEE2E2)
                                        "uncertain" -> Color(0xFFFEF3C7)
                                        else -> Color.White.copy(alpha = 0.72f)
                                    }
                                    val chipText = when (wEval?.status) {
                                        "correct" -> Color(0xFF065F46)
                                        "error", "missing" -> Color(0xFF991B1B)
                                        "uncertain" -> Color(0xFF92400E)
                                        else -> MoazenInkPrimary
                                    }
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(9.dp))
                                            .background(chipBg)
                                            .clickable {
                                                selectedWordDetail = wEval ?: NativeWordResult(item.globalIndex, item.word)
                                            }
                                            .padding(horizontal = 7.dp, vertical = 3.dp)
                                    ) {
                                        Text(
                                            text = item.word,
                                            color = chipText,
                                            fontSize = if (unitType == "page") 17.sp else 20.sp,
                                            fontWeight = if (wEval != null) FontWeight.Bold else FontWeight.Medium,
                                            textDecoration = if (wEval?.status == "error" || wEval?.status == "missing") TextDecoration.Underline else TextDecoration.None
                                        )
                                    }

                                    if (item.isEndOfAyah && unitType == "page") {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(9.dp))
                                                .background(MoazenGold.copy(alpha = 0.22f))
                                                .padding(horizontal = 6.dp, vertical = 3.dp)
                                        ) {
                                            Text(
                                                text = "﴿${item.ayahNumberInSurah}﴾",
                                                color = MoazenGoldDark,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        selectedWordDetail?.let { detail ->
                            MoazenSubWidgetBox(cornerRadius = 12.dp, modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("الكلمة: ${detail.expectedWord}", color = MoazenInkEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                        TextButton(
                                            enabled = !isSpeakingWord,
                                            onClick = {
                                                scope.launch {
                                                    isSpeakingWord = true
                                                    stopAyahPlayback()
                                                    QuranRecitationManager.speakSheikhFromServer(
                                                        context = context,
                                                        serverBaseUrl = prefs.sheikhServerBaseUrl,
                                                        text = detail.expectedWord,
                                                        dialect = dialect
                                                    ) { isSpeakingWord = false }
                                                }
                                            },
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Icon(Icons.Default.VolumeUp, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(15.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(if (isSpeakingWord) "جاري النطق..." else "سماع النطق", color = MoazenInkEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    if (detail.spokenWord.isNotBlank()) {
                                        Text("ما سُمع: ${detail.spokenWord}", color = Color(0xFF991B1B), fontSize = 12.sp)
                                    }
                                    if (detail.correctionNote.isNotBlank()) {
                                        Text(detail.correctionNote, color = MoazenInkMuted, fontSize = 11.sp)
                                    }
                                }
                            }
                        }

                        // CLEAN 3-BUTTON ACTION DOCK: LISTEN · MIC RECORD · UPLOAD AUDIO FILE
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    if (isPlayingAyah) pauseAyahPlayback()
                                    else startOrResumePlayback(isPausedAyah)
                                },
                                enabled = uploadState != NativeUploadState.RECORDING,
                                colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                                border = BorderStroke(1.dp, MoazenCardBorder),
                                shape = RoundedCornerShape(12.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = if (isPlayingAyah) Icons.Default.Pause else Icons.Default.VolumeUp,
                                    contentDescription = null,
                                    tint = MoazenInkEmerald,
                                    modifier = Modifier.size(17.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = if (isPlayingAyah) "إيقاف" else if (isPausedAyah) "استئناف" else "استمع",
                                    color = MoazenInkEmerald,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Button(
                                onClick = { onMicButtonClick() },
                                enabled = uploadState != NativeUploadState.UPLOADING &&
                                    uploadState != NativeUploadState.ANALYZING &&
                                    uploadState != NativeUploadState.PREPARING,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (uploadState == NativeUploadState.RECORDING) Color(0xFFD32F2F) else MoazenInkEmerald
                                ),
                                shape = RoundedCornerShape(12.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 10.dp),
                                modifier = Modifier.weight(1.25f)
                            ) {
                                Icon(
                                    imageVector = if (uploadState == NativeUploadState.RECORDING) Icons.Default.Stop else Icons.Default.Mic,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(17.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = if (uploadState == NativeUploadState.RECORDING) "إيقاف وإرسال" else "تسميع بالمايك",
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Button(
                                onClick = { audioFilePickerLauncher.launch(arrayOf("audio/*")) },
                                enabled = uploadState != NativeUploadState.RECORDING &&
                                    uploadState != NativeUploadState.UPLOADING &&
                                    uploadState != NativeUploadState.ANALYZING,
                                colors = ButtonDefaults.buttonColors(containerColor = MoazenGold),
                                shape = RoundedCornerShape(12.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.UploadFile,
                                    contentDescription = null,
                                    tint = MoazenInkPrimary,
                                    modifier = Modifier.size(17.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "رفع ملف",
                                    color = MoazenInkPrimary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // EVALUATION RESULT CARD
                evaluationResult?.let { ev ->
                    MoazenWidgetCard(
                        cornerRadius = 18.dp,
                        borderColor = if (ev.status == "perfect") SuccessGreen else MoazenGold,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = if (ev.status == "perfect") "ما شاء الله! تلاوة متقنة (${ev.score}%)" else "نسبة الضبط: ${ev.score}%",
                                color = MoazenInkEmerald,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            if (ev.transcribedText.isNotBlank()) {
                                Text("ما سُمع منك: ${ev.transcribedText}", color = MoazenInkPrimary, fontSize = 12.sp)
                            }
                            if (ev.jumpedToOtherAyah && ev.jumpedAyahNote.isNotBlank()) {
                                Text("⚠️ ${ev.jumpedAyahNote}", color = Color(0xFFB71C1C), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            if (ev.mistakeSummary.isNotBlank()) {
                                Text(ev.mistakeSummary, color = MoazenInkMuted, fontSize = 12.sp)
                            }
                            if (ev.correctionHint.isNotBlank()) {
                                Text("💡 ${ev.correctionHint}", color = MoazenGoldDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = { startOrResumePlayback(false, if (unitType == "page") null else selectedAyahNum) },
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.VolumeUp, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(15.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("تلاوة الشيخ", color = MoazenInkEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                                val userClip = QuranRecitationManager.lastPreparedClip
                                if (userClip != null) {
                                    OutlinedButton(
                                        onClick = {
                                            if (isPlayingUserClip) {
                                                QuranRecitationManager.stopPreparedClipPlayback()
                                                isPlayingUserClip = false
                                            } else {
                                                stopAyahPlayback()
                                                isPlayingUserClip = true
                                                QuranRecitationManager.playPreparedClip(context, userClip) {
                                                    isPlayingUserClip = false
                                                }
                                            }
                                        },
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(
                                            imageVector = if (isPlayingUserClip) Icons.Default.Stop else Icons.Default.PlayArrow,
                                            contentDescription = null,
                                            tint = MoazenGoldDark,
                                            modifier = Modifier.size(15.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = if (isPlayingUserClip) "إيقاف تلاوتك" else "سماع تلاوتك",
                                            color = MoazenGoldDark,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (activeTab == 1) {
                // TAB 1: MEMORIZATION TEST (SUPPORTS AYAH OR PAGE)
                MoazenWidgetCard(cornerRadius = 18.dp, modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = if (unitType == "page") "اختبار حفظ صفحة $selectedPageNum" else "اختبار الحفظ (الآية $selectedAyahNum)",
                            color = MoazenInkEmerald,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("hide" to "إخفاء كامل", "complete" to "إكمال البداية", "random" to "عشوائي").forEach { (key, title) ->
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (quizType == key) MoazenInkEmerald else Color.White.copy(alpha = 0.72f))
                                        .clickable {
                                            quizType = key
                                            quizRevealed = false
                                            hintWordCount = 0
                                            if (key == "random") {
                                                if (unitType == "page") {
                                                    navigateToPage((1..604).random())
                                                } else {
                                                    val lo = minOf(rangeStart, rangeEnd)
                                                    val hi = maxOf(rangeStart, rangeEnd)
                                                    navigateToAyah((lo..hi).random())
                                                }
                                            }
                                        }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = title,
                                        color = if (quizType == key) Color.White else MoazenInkPrimary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        MoazenSubWidgetBox(cornerRadius = 14.dp, modifier = Modifier.fillMaxWidth()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                when {
                                    quizRevealed -> {
                                        Text(
                                            text = rawExpectedText,
                                            color = MoazenInkPrimary,
                                            fontSize = 18.sp,
                                            textAlign = TextAlign.Center,
                                            lineHeight = 32.sp
                                        )
                                    }
                                    quizType == "complete" -> {
                                        val tokens = indexedWords.map { it.word }
                                        val showCount = (tokens.size / 3 + hintWordCount).coerceIn(1, tokens.size.coerceAtLeast(1))
                                        Text(
                                            text = "${tokens.take(showCount).joinToString(" ")} ... (أكمل من حفظك)",
                                            color = MoazenInkEmerald,
                                            fontSize = 17.sp,
                                            textAlign = TextAlign.Center
                                        )
                                    }
                                    else -> {
                                        val tokens = indexedWords.map { it.word }
                                        val hintPart = if (hintWordCount > 0) {
                                            "\n${tokens.take(hintWordCount).joinToString(" ")} ..."
                                        } else ""
                                        Text(
                                            text = "النص مخفي — رتّل من حفظك ثم ابدأ التسجيل أو ارفع ملفك$hintPart",
                                            color = MoazenInkMuted,
                                            fontSize = 13.sp,
                                            textAlign = TextAlign.Center
                                        )
                                    }
                                }
                            }
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { if (hintWordCount < indexedWords.size) hintWordCount++ },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("تلميح ($hintWordCount)", color = MoazenInkEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = { quizRevealed = !quizRevealed },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(if (quizRevealed) "إخفاء" else "كشف النص", color = MoazenInkPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { onMicButtonClick() },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (uploadState == NativeUploadState.RECORDING) Color(0xFFD32F2F) else MoazenInkEmerald
                                ),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(if (uploadState == NativeUploadState.RECORDING) Icons.Default.Stop else Icons.Default.Mic, contentDescription = null, tint = Color.White, modifier = Modifier.size(17.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (uploadState == NativeUploadState.RECORDING) "إيقاف وتصحيح" else "تسميع بالمايك",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            }
                            Button(
                                onClick = { audioFilePickerLauncher.launch(arrayOf("audio/*")) },
                                colors = ButtonDefaults.buttonColors(containerColor = MoazenGold),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.UploadFile, contentDescription = null, tint = MoazenInkPrimary, modifier = Modifier.size(17.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("رفع ملف", color = MoazenInkPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            } else if (activeTab == 2) {
                // TAB 2: MEMORIZATION DASHBOARD
                val masteredMap = remember(statsRefreshKey) { prefs.getSheikhMasteredMap() }
                val historyMap = remember(statsRefreshKey) { prefs.getSheikhDailyHistory() }
                val todayCal = Calendar.getInstance()
                val isoFmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                val dayFmt = SimpleDateFormat("EE", Locale("ar"))

                val last7Days = remember(historyMap) {
                    (6 downTo 0).map { offset ->
                        val cal = (todayCal.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, -offset) }
                        val iso = isoFmt.format(cal.time)
                        val pair = historyMap[iso] ?: Pair(0, 0)
                        Triple(dayFmt.format(cal.time), pair.first, pair.second)
                    }
                }

                val last4Weeks = remember(historyMap) {
                    (3 downTo 0).map { weekIdx ->
                        var total = 0
                        for (d in 0..6) {
                            val daysBack = weekIdx * 7 + d
                            val cal = (todayCal.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, -daysBack) }
                            val iso = isoFmt.format(cal.time)
                            total += (historyMap[iso]?.first ?: 0)
                        }
                        Pair(if (weekIdx == 0) "هذا الأسبوع" else "منذ $weekIdx أسابيع", total)
                    }
                }

                val surahStats = remember(masteredMap, selectedSurahNum) {
                    val grouped = mutableMapOf<Int, MutableList<Int>>()
                    masteredMap.forEach { (key, score) ->
                        val sNum = key.split(":").firstOrNull()?.toIntOrNull() ?: return@forEach
                        grouped.getOrPut(sNum) { mutableListOf() }.add(score)
                    }
                    val allIds = (grouped.keys + selectedSurahNum).toSet().sorted()
                    allIds.mapNotNull { sId ->
                        val surah = NativeDataManager.surahs.find { it.number == sId } ?: return@mapNotNull null
                        val scores = grouped[sId] ?: emptyList()
                        val pct = ((scores.size.toFloat() / surah.numberOfAyahs.coerceAtLeast(1)) * 100f).toInt().coerceIn(0, 100)
                        val avg = if (scores.isNotEmpty()) scores.average().toInt() else 0
                        Triple(surah, scores.size, Pair(pct, avg))
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        Pair("آيات متقنة", "${masteredMap.size}"),
                        Pair("جلسات التسميع", "${prefs.sheikhSessionsCount}"),
                        Pair("كلمات صحيحة", "${prefs.sheikhCorrectWordsCount}")
                    ).forEach { (title, valStr) ->
                        MoazenWidgetCard(cornerRadius = 14.dp, modifier = Modifier.weight(1f)) {
                            Column(
                                modifier = Modifier.fillMaxWidth().padding(10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(valStr, color = MoazenInkEmerald, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                Text(title, color = MoazenInkMuted, fontSize = 10.sp)
                            }
                        }
                    }
                }

                MoazenWidgetCard(cornerRadius = 16.dp, modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("الإنجاز اليومي (آخر 7 أيام)", color = MoazenInkEmerald, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        val maxDaily = (last7Days.maxOfOrNull { maxOf(it.second, it.third) } ?: 1).coerceAtLeast(1)

                        Canvas(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .padding(horizontal = 6.dp, vertical = 4.dp)
                        ) {
                            val barCount = last7Days.size
                            val slotWidth = size.width / barCount.coerceAtLeast(1)
                            val barWidth = (slotWidth * 0.52f).coerceAtLeast(16f)
                            val chartH = size.height - 10f

                            last7Days.forEachIndexed { idx, (_, masteredCnt, attemptsCnt) ->
                                val xLeft = idx * slotWidth + (slotWidth - barWidth) / 2f
                                if (attemptsCnt > 0) {
                                    val hAttempt = (attemptsCnt.toFloat() / maxDaily) * chartH
                                    drawRoundRect(
                                        color = MoazenGold.copy(alpha = 0.3f),
                                        topLeft = Offset(xLeft, size.height - hAttempt),
                                        size = Size(barWidth, hAttempt),
                                        cornerRadius = CornerRadius(8f, 8f)
                                    )
                                }
                                val hMastered = if (masteredCnt > 0) (masteredCnt.toFloat() / maxDaily) * chartH else 6f
                                drawRoundRect(
                                    color = if (masteredCnt > 0) MoazenInkEmerald else MoazenCardBorder,
                                    topLeft = Offset(xLeft, size.height - hMastered),
                                    size = Size(barWidth, hMastered),
                                    cornerRadius = CornerRadius(8f, 8f)
                                )
                            }
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            last7Days.forEach { (label, masteredCnt, _) ->
                                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                    Text("$masteredCnt", color = MoazenInkEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    Text(label, color = MoazenInkMuted, fontSize = 9.sp)
                                }
                            }
                        }
                    }
                }

                MoazenWidgetCard(cornerRadius = 16.dp, modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("التقدم الأسبوعي (آخر 4 أسابيع)", color = MoazenInkEmerald, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        val maxWeek = (last4Weeks.maxOfOrNull { it.second } ?: 1).coerceAtLeast(1)
                        last4Weeks.forEach { (label, cnt) ->
                            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(label, color = MoazenInkPrimary, fontSize = 11.sp)
                                    Text("$cnt آية متقنة", color = MoazenGoldDark, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                                LinearProgressIndicator(
                                    progress = { (cnt.toFloat() / maxWeek).coerceIn(0f, 1f) },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(7.dp)
                                        .clip(RoundedCornerShape(4.dp)),
                                    color = MoazenInkEmerald,
                                    trackColor = MoazenCardBorder
                                )
                            }
                        }
                    }
                }

                MoazenWidgetCard(cornerRadius = 16.dp, modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("نسبة الإتقان في كل سورة", color = MoazenInkEmerald, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        surahStats.forEach { (surah, count, statsPair) ->
                            val pct = statsPair.first
                            val avg = statsPair.second
                            MoazenSubWidgetBox(cornerRadius = 10.dp, modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "سورة ${surah.nameArabic} ($count/${surah.numberOfAyahs})",
                                            color = MoazenInkPrimary,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            Text("$pct%${if (avg > 0) " • $avg%" else ""}", color = MoazenGoldDark, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            TextButton(
                                                onClick = {
                                                    selectedSurahNum = surah.number
                                                    unitType = "ayah"
                                                    navigateToAyah(1)
                                                    activeTab = 0
                                                },
                                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                            ) { Text("متابعة", color = MoazenInkEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                                        }
                                    }
                                    LinearProgressIndicator(
                                        progress = { pct / 100f },
                                        modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                                        color = MoazenInkEmerald,
                                        trackColor = MoazenCardBorder
                                    )
                                }
                            }
                        }
                    }
                }
            } else if (activeTab == 3) {
                // TAB 3: SESSION EVALUATION REPORT
                val elapsedSec = ((System.currentTimeMillis() - sessionStartMs) / 1000L).coerceAtLeast(1L)
                val totalWords = sessionCorrectWords + sessionErrorWords
                val masteryPct = if (totalWords > 0) (sessionCorrectWords * 100 / totalWords) else 0
                val weakLog = remember(evaluationResult) { prefs.getSheikhWeakAyahs() }

                MoazenWidgetCard(cornerRadius = 18.dp, modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("تقرير جلسة الحفظ الحالية", color = MoazenInkEmerald, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text("الآيات التي تم تسميعها: ${sessionReviewedAyahs.size}", color = MoazenInkPrimary, fontSize = 13.sp)
                        Text("الكلمات الصحيحة: $sessionCorrectWords • الأخطاء: $sessionErrorWords", color = MoazenInkMuted, fontSize = 13.sp)
                        Text("نسبة الإتقان: $masteryPct% • المدة: $elapsedSec ثانية", color = MoazenInkEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        if (sessionForgottenWords.isNotEmpty()) {
                            Text("كلمات تحتاج تكراراً: ${sessionForgottenWords.joinToString(" ، ")}", color = Color(0xFFB71C1C), fontSize = 12.sp)
                        }
                    }
                }

                if (weakLog.isNotEmpty()) {
                    MoazenWidgetCard(cornerRadius = 18.dp, borderColor = Color(0xFFE57373), modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("آيات يُنصح بمراجعتها (سجل الأخطاء المتكررة)", color = Color(0xFFB71C1C), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            weakLog.forEach { (key, count, words) ->
                                val parts = key.split(":")
                                val sNum = parts.getOrNull(0)?.toIntOrNull() ?: 1
                                val aNum = parts.getOrNull(1)?.toIntOrNull() ?: 1
                                val sName = NativeDataManager.surahs.find { it.number == sNum }?.nameArabic ?: "سورة $sNum"
                                MoazenSubWidgetBox(
                                    cornerRadius = 10.dp,
                                    onClick = {
                                        selectedSurahNum = sNum
                                        unitType = "ayah"
                                        navigateToAyah(aNum)
                                        activeTab = 0
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text("$sName • الآية $aNum", color = MoazenInkPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                            if (words.isNotBlank()) {
                                                Text("كلمات: $words", color = MoazenInkMuted, fontSize = 11.sp)
                                            }
                                        }
                                        Text("$count أخطاء", color = Color(0xFFB71C1C), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // TAB 4: ADVANCED SETTINGS
                MoazenWidgetCard(cornerRadius = 16.dp, modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.Mic, contentDescription = null, tint = MoazenInkEmerald)
                            Text("حساسية الميكروفون واختبار الإشارة", color = MoazenInkEmerald, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("كسب الميكروفون", color = MoazenInkPrimary, fontSize = 12.sp)
                            Text("${String.format(Locale.US, "%.1f", micSensitivity)}x", color = MoazenGoldDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        Slider(
                            value = micSensitivity,
                            onValueChange = { micSensitivity = it },
                            valueRange = 0.5f..2.5f,
                            colors = SliderDefaults.colors(thumbColor = MoazenInkEmerald, activeTrackColor = MoazenInkEmerald, inactiveTrackColor = MoazenCardBorder)
                        )

                        Text("عتبة عزل الضوضاء", color = MoazenInkMuted, fontSize = 11.sp)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("low" to "حساسة (هادئ)", "medium" to "متوازنة", "high" to "عالية (عزل ضجيج)").forEach { (k, label) ->
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (noiseGateLevel == k) MoazenInkEmerald else Color.White.copy(alpha = 0.72f))
                                        .clickable { noiseGateLevel = k }
                                        .padding(vertical = 8.dp, horizontal = 4.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = label,
                                        color = if (noiseGateLevel == k) Color.White else MoazenInkPrimary,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }

                        MoazenSubWidgetBox(cornerRadius = 12.dp, modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        if (micTestRunning) return@Button
                                        if (!QuranRecitationManager.hasMicrophonePermission(context)) {
                                            micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                            return@Button
                                        }
                                        micTestClip = null
                                        micTestPeakLevel = 0f
                                        micTestStatusMsg = "تحدث أو اقرأ البسملة الآن لمدة 3 ثوانٍ..."
                                        val res = QuranRecitationManager.startRecording(context, micSensitivity, noiseGateLevel, preferStandardMic)
                                        res.onSuccess {
                                            micTestRunning = true
                                            scope.launch {
                                                var peak = 0f
                                                repeat(30) {
                                                    delay(100)
                                                    val lvl = QuranRecitationManager.micLevel.value
                                                    if (lvl > peak) peak = lvl
                                                    micTestPeakLevel = peak
                                                }
                                                val clipRes = QuranRecitationManager.stopAndFinalizeRecording()
                                                micTestRunning = false
                                                clipRes.onSuccess { clip ->
                                                    micTestClip = clip
                                                    micTestStatusMsg = "✓ الميكروفون ممتاز (${clip.wavBytes.size / 1024} KB • ذروة ${(peak * 100).toInt()}%)"
                                                    QuranRecitationManager.resetStatus()
                                                }.onFailure { err ->
                                                    micTestStatusMsg = "⚠ ${err.message ?: "الصوت ضعيف"}"
                                                    QuranRecitationManager.resetStatus()
                                                }
                                            }
                                        }.onFailure { err ->
                                            micTestStatusMsg = err.message ?: "تعذر تشغيل الميكروفون"
                                        }
                                    },
                                    enabled = !micTestRunning && uploadState != NativeUploadState.RECORDING,
                                    colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Icon(Icons.Default.Mic, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(if (micTestRunning) "جاري فحص الإشارة (3ث)..." else "اختبار الميكروفون الآن", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }

                                LinearProgressIndicator(
                                    progress = { if (micTestRunning) micLevel else micTestPeakLevel },
                                    modifier = Modifier.fillMaxWidth().height(7.dp).clip(RoundedCornerShape(4.dp)),
                                    color = SuccessGreen,
                                    trackColor = MoazenCardBorder
                                )

                                micTestStatusMsg?.let { Text(it, color = MoazenInkPrimary, fontSize = 11.sp) }

                                micTestClip?.let { clip ->
                                    OutlinedButton(
                                        onClick = {
                                            if (isPlayingTestClip) {
                                                QuranRecitationManager.stopPreparedClipPlayback()
                                                isPlayingTestClip = false
                                            } else {
                                                isPlayingTestClip = true
                                                QuranRecitationManager.playPreparedClip(context, clip) { isPlayingTestClip = false }
                                            }
                                        },
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(if (isPlayingTestClip) Icons.Default.Stop else Icons.Default.VolumeUp, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(if (isPlayingTestClip) "إيقاف التشغيل" else "سماع صوتك المسجّل للتحقق", color = MoazenInkEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }

                MoazenWidgetCard(cornerRadius = 16.dp, modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("سرعة معالجة التحليل الصوتي ورد الفعل", color = MoazenInkEmerald, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("fast" to "سريع", "balanced" to "متوازن", "accurate" to "تدقيق عميق").forEach { (k, label) ->
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (analysisSpeed == k) MoazenInkEmerald else Color.White.copy(alpha = 0.72f))
                                        .clickable { analysisSpeed = k }
                                        .padding(vertical = 9.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(label, color = if (analysisSpeed == k) Color.White else MoazenInkPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("اهتزاز فوري عند الخطأ", color = MoazenInkPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("يهتز الهاتف لحظياً عند اكتشاف كلمة خاطئة", color = MoazenInkMuted, fontSize = 10.sp)
                            }
                            Switch(checked = vibrateOnError, onCheckedChange = { vibrateOnError = it })
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("نافذة التصحيح السريعة", color = MoazenInkPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("تعرض الكلمة الصحيحة مع زر إعادة التسجيل", color = MoazenInkMuted, fontSize = 10.sp)
                            }
                            Switch(checked = quickPopupEnabled, onCheckedChange = { quickPopupEnabled = it })
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("مصدر الميكروفون القياسي (MIC)", color = MoazenInkPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("فعّله إذا كان التسجيل منخفضاً", color = MoazenInkMuted, fontSize = 10.sp)
                            }
                            Switch(checked = preferStandardMic, onCheckedChange = { preferStandardMic = it })
                        }

                        OutlinedButton(
                            onClick = {
                                if (checkingServerHealth) return@OutlinedButton
                                checkingServerHealth = true
                                serverHealthStatus = "جاري فحص الاتصال بخادم التحليل..."
                                scope.launch {
                                    val r = QuranRecitationManager.checkServerHealth(prefs.sheikhServerBaseUrl)
                                    checkingServerHealth = false
                                    r.onSuccess { configured ->
                                        serverHealthStatus = if (configured) "✓ الخادم متصل ومحرك تحليل التلاوة جاهز" else "⚠️ الخادم متاح لكن المفتاح غير مهيأ"
                                    }.onFailure { err ->
                                        serverHealthStatus = "✗ ${err.message ?: "تعذر الاتصال بالخادم"}"
                                    }
                                }
                            },
                            enabled = !checkingServerHealth,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (checkingServerHealth) "جاري الفحص..." else "فحص الاتصال بخادم «شيخي»", color = MoazenInkEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        serverHealthStatus?.let { Text(it, color = MoazenGoldDark, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    }
                }
            }
        }
    }

    if (showSurahPicker) {
        AlertDialog(
            onDismissRequest = { showSurahPicker = false },
            containerColor = MoazenCardStart,
            title = { Text("اختر السورة للتحفيظ والتسميع", color = MoazenInkEmerald, fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(modifier = Modifier.height(340.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    items(NativeDataManager.surahs) { surah ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (surah.number == selectedSurahNum) MoazenInkEmerald else Color.White.copy(alpha = 0.72f))
                                .clickable {
                                    selectedSurahNum = surah.number
                                    navigateToAyah(1)
                                    rangeStart = 1
                                    rangeEnd = surah.numberOfAyahs
                                    showSurahPicker = false
                                }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("${surah.number}. سورة ${surah.nameArabic}", color = if (surah.number == selectedSurahNum) Color.White else MoazenInkPrimary, fontSize = 13.sp)
                            Text("${surah.numberOfAyahs} آية", color = if (surah.number == selectedSurahNum) MoazenGold else MoazenInkMuted, fontSize = 11.sp)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showSurahPicker = false }) { Text("إغلاق", color = MoazenInkEmerald, fontWeight = FontWeight.Bold) }
            }
        )
    }

    if (showPagePicker) {
        AlertDialog(
            onDismissRequest = { showPagePicker = false },
            containerColor = MoazenCardStart,
            title = { Text("اختر رقم صفحة المصحف (1–604)", color = MoazenInkEmerald, fontWeight = FontWeight.Bold, fontSize = 15.sp) },
            text = {
                OutlinedTextField(
                    value = pageInputStr,
                    onValueChange = { s -> pageInputStr = s.filter { it.isDigit() }.take(3) },
                    label = { Text("رقم الصفحة (1 - 604)", color = MoazenInkMuted) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val p = pageInputStr.toIntOrNull()?.coerceIn(1, 604) ?: selectedPageNum
                        showPagePicker = false
                        navigateToPage(p)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald)
                ) { Text("فتح الصفحة", color = Color.White, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { showPagePicker = false }) { Text("إلغاء", color = MoazenInkMuted) }
            }
        )
    }

    if (showAyahPicker) {
        val masteredMap = remember(statsRefreshKey) { prefs.getSheikhMasteredMap() }
        val weakSet = remember(statsRefreshKey) { prefs.getSheikhWeakAyahs().map { it.first }.toSet() }
        AlertDialog(
            onDismissRequest = { showAyahPicker = false },
            containerColor = MoazenCardStart,
            title = { Text("اختر الآية — سورة ${activeSurahMeta.nameArabic}", color = MoazenInkEmerald, fontWeight = FontWeight.Bold, fontSize = 15.sp) },
            text = {
                Column(modifier = Modifier.heightIn(max = 320.dp).verticalScroll(rememberScrollState())) {
                    FlowRow(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        for (a in 1..activeSurahMeta.numberOfAyahs) {
                            val key = "$selectedSurahNum:$a"
                            val isCurrent = a == selectedAyahNum
                            val isMastered = masteredMap.containsKey(key)
                            val isWeak = weakSet.contains(key)
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        when {
                                            isCurrent -> MoazenInkEmerald
                                            isMastered -> Color(0xFFD1FAE5)
                                            isWeak -> Color(0xFFFEE2E2)
                                            else -> Color.White.copy(alpha = 0.72f)
                                        }
                                    )
                                    .clickable {
                                        navigateToAyah(a)
                                        showAyahPicker = false
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (isMastered && !isCurrent) "$a ✓" else "$a",
                                    color = if (isCurrent) Color.White else MoazenInkPrimary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showAyahPicker = false }) { Text("إغلاق", color = MoazenInkEmerald, fontWeight = FontWeight.Bold) }
            }
        )
    }

    if (quickPopupErrors.isNotEmpty()) {
        val safeIdx = quickPopupErrorIdx.coerceIn(0, quickPopupErrors.lastIndex)
        val errWord = quickPopupErrors[safeIdx]
        AlertDialog(
            onDismissRequest = { quickPopupErrors = emptyList() },
            containerColor = MoazenCardStart,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFD32F2F))
                    Text("تصحيح فوري (${safeIdx + 1}/${quickPopupErrors.size})", color = MoazenInkEmerald, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    MoazenSubWidgetBox(cornerRadius = 12.dp, modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text("الكلمة الصحيحة في المصحف:", color = MoazenInkMuted, fontSize = 11.sp)
                            Text(errWord.expectedWord, color = MoazenInkEmerald, fontSize = 26.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                            if (errWord.spokenWord.isNotBlank()) {
                                Text("ما سُمع منك: ${errWord.spokenWord}", color = Color(0xFFB71C1C), fontSize = 12.sp)
                            }
                            if (errWord.correctionNote.isNotBlank()) {
                                Text(errWord.correctionNote, color = MoazenGoldDark, fontSize = 11.sp, textAlign = TextAlign.Center)
                            }
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            enabled = !isSpeakingWord,
                            onClick = {
                                scope.launch {
                                    isSpeakingWord = true
                                    stopAyahPlayback()
                                    QuranRecitationManager.speakSheikhFromServer(context, prefs.sheikhServerBaseUrl, errWord.expectedWord, dialect) {
                                        isSpeakingWord = false
                                    }
                                }
                            },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.VolumeUp, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (isSpeakingWord) "جاري..." else "نطق الكلمة", color = MoazenInkEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        OutlinedButton(
                            onClick = { startOrResumePlayback(false, if (unitType == "page") null else selectedAyahNum) },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = MoazenGoldDark, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("سماع التلاوة", color = MoazenGoldDark, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        quickPopupErrors = emptyList()
                        if (QuranRecitationManager.hasMicrophonePermission(context)) startMicRecording()
                        else micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Mic, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("إعادة التسجيل", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            },
            dismissButton = {
                TextButton(onClick = { quickPopupErrors = emptyList() }) { Text("تخطي", color = MoazenInkMuted) }
            }
        )
    }

    if (showReciterPicker) {
        AlertDialog(
            onDismissRequest = { showReciterPicker = false },
            containerColor = MoazenCardStart,
            title = { Text("اختر القارئ للتلقين", color = MoazenInkEmerald, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SHEIKH_RECITERS.forEachIndexed { idx, reciter ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (selectedReciterIdx == idx) MoazenInkEmerald else Color.White.copy(alpha = 0.72f))
                                .clickable {
                                    selectedReciterIdx = idx
                                    showReciterPicker = false
                                }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(reciter.nameArabic, color = if (selectedReciterIdx == idx) Color.White else MoazenInkPrimary, fontSize = 13.sp)
                            if (selectedReciterIdx == idx) {
                                Icon(Icons.Default.Check, contentDescription = null, tint = MoazenGold, modifier = Modifier.size(18.dp))
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showReciterPicker = false }) { Text("إغلاق", color = MoazenInkEmerald, fontWeight = FontWeight.Bold) }
            }
        )
    }
}
