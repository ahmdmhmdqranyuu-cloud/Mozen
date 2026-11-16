package com.muslim.azan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.model.Ayah
import com.muslim.azan.model.QuranBookmark
import com.muslim.azan.model.Surah
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenSubWidgetBox
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private enum class QuranHubSection {
    HUB, SURAHS, JUZS, PAGE_READER, SURAH_READER, BOOKMARKS
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuranScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var section by remember { mutableStateOf(QuranHubSection.HUB) }
    var selectedSurah by remember { mutableStateOf<Surah?>(null) }
    var currentPage by remember { mutableIntStateOf(prefs.sheikhLastPage.coerceIn(1, 604)) }
    var searchQuery by remember { mutableStateOf("") }
    var currentAyahs by remember { mutableStateOf<List<Ayah>>(emptyList()) }
    var pageAyahs by remember { mutableStateOf<List<Ayah>>(emptyList()) }
    var selectedReciterIndex by remember { mutableIntStateOf(0) }
    var showReciterDialog by remember { mutableStateOf(false) }
    var showPageJumpDialog by remember { mutableStateOf(false) }
    var pageJumpInput by remember { mutableStateOf(currentPage.toString()) }
    var showSheikhTutor by remember { mutableStateOf(false) }
    var bookmarks by remember { mutableStateOf(prefs.getBookmarks()) }

    if (showSheikhTutor) {
        SheikhTutorSection(
            prefs = prefs,
            onBack = { showSheikhTutor = false }
        )
        return
    }

    val filteredSurahs = remember(searchQuery) {
        if (searchQuery.isBlank()) {
            NativeDataManager.surahs
        } else {
            NativeDataManager.surahs.filter {
                it.nameArabic.contains(searchQuery) ||
                    it.englishName.contains(searchQuery, ignoreCase = true) ||
                    it.number.toString() == searchQuery.trim()
            }
        }
    }

    LaunchedEffect(selectedSurah, section) {
        if (section == QuranHubSection.SURAH_READER) {
            selectedSurah?.let { surah ->
                currentAyahs = withContext(Dispatchers.IO) {
                    NativeDataManager.loadAyahsForSurah(context, surah.number)
                }
                prefs.lastReadSurah = surah.number
            }
        } else if (section == QuranHubSection.PAGE_READER) {
            pageAyahs = withContext(Dispatchers.IO) {
                NativeDataManager.loadAyahsForPage(context, currentPage)
            }
            prefs.sheikhLastPage = currentPage
            pageAyahs.firstOrNull()?.let { first ->
                prefs.lastReadSurah = first.surahNumber
                prefs.lastReadAyah = first.numberInSurah
            }
        }
    }

    fun openPage(pageNum: Int) {
        currentPage = pageNum.coerceIn(1, 604)
        pageJumpInput = currentPage.toString()
        section = QuranHubSection.PAGE_READER
    }

    fun openSurah(surah: Surah) {
        selectedSurah = surah
        section = QuranHubSection.SURAH_READER
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(14.dp)
    ) {
        // Unified Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = {
                    if (section == QuranHubSection.HUB) {
                        onBack()
                    } else {
                        section = QuranHubSection.HUB
                    }
                }) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = TextPrimary)
                }
                Column {
                    Text(
                        text = when (section) {
                            QuranHubSection.HUB -> "القرآن الكريم والمصحف الشريف"
                            QuranHubSection.SURAHS -> "فهرس السور الـ 114"
                            QuranHubSection.JUZS -> "أجزاء القرآن الـ 30"
                            QuranHubSection.PAGE_READER -> "المصحف • صفحة $currentPage / 604"
                            QuranHubSection.SURAH_READER -> "سورة ${selectedSurah?.nameArabic.orEmpty()}"
                            QuranHubSection.BOOKMARKS -> "العلامات المرجعية"
                        },
                        color = TextPrimary,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                    if (section == QuranHubSection.PAGE_READER && pageAyahs.isNotEmpty()) {
                        val first = pageAyahs.first()
                        Text(
                            text = "سورة ${first.surahName} • الجزء ${first.juz}",
                            color = GoldLight,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                if (section == QuranHubSection.PAGE_READER) {
                    IconButton(onClick = {
                        pageJumpInput = currentPage.toString()
                        showPageJumpDialog = true
                    }) {
                        Icon(Icons.Default.FindInPage, contentDescription = "الانتقال لصفحة", tint = GoldAccent)
                    }
                }
                TextButton(onClick = { showReciterDialog = true }) {
                    Icon(Icons.Default.RecordVoiceOver, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("القارئ", color = GoldAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        when (section) {
            QuranHubSection.HUB -> {
                val lastSurah = NativeDataManager.surahs.find { it.number == prefs.lastReadSurah }
                    ?: NativeDataManager.surahs.first()

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Continue Reading Banner (Unified MoazenWidgetCard)
                    MoazenWidgetCard(
                        cornerRadius = 20.dp,
                        onClick = { openPage(prefs.sheikhLastPage) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Text(
                                    text = "متابعة آخر تلاوة",
                                    color = MoazenGoldDark,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "سورة ${lastSurah.nameArabic} • صفحة ${prefs.sheikhLastPage}",
                                    color = MoazenInkEmerald,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "المصحف المرتب 604 صفحة مع التفسير والاستماع",
                                    color = MoazenInkMuted,
                                    fontSize = 11.sp
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MoazenInkEmerald),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.AutoStories, contentDescription = null, tint = MoazenGold, modifier = Modifier.size(22.dp))
                            }
                        }
                    }

                    // SIDE-BY-SIDE 2-COLUMN GRID SYSTEM FOR QURAN SECTIONS
                    @Composable
                    fun QuranGridTile(
                        modifier: Modifier,
                        title: String,
                        subtitle: String,
                        badge: String,
                        icon: ImageVector,
                        onClick: () -> Unit
                    ) {
                        MoazenWidgetCard(
                            cornerRadius = 18.dp,
                            onClick = onClick,
                            modifier = modifier.height(126.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(14.dp),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(MoazenInkEmerald.copy(alpha = 0.1f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(icon, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(20.dp))
                                    }
                                    MoazenSubWidgetBox(cornerRadius = 8.dp) {
                                        Text(
                                            text = badge,
                                            color = MoazenGoldDark,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                                        )
                                    }
                                }
                                Column {
                                    Text(
                                        text = title,
                                        color = MoazenInkEmerald,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = subtitle,
                                        color = MoazenInkMuted,
                                        fontSize = 11.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }

                    // Row 1: Surahs Index | 604 Pages Mushaf
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        QuranGridTile(
                            modifier = Modifier.weight(1f),
                            title = "فهرس السور",
                            subtitle = "جميع السور مرتبة",
                            badge = "114 سورة",
                            icon = Icons.Default.MenuBook,
                            onClick = { section = QuranHubSection.SURAHS }
                        )
                        QuranGridTile(
                            modifier = Modifier.weight(1f),
                            title = "صفحات المصحف",
                            subtitle = "تصفح بالصفحة الكاملة",
                            badge = "604 صفحة",
                            icon = Icons.Default.ChromeReaderMode,
                            onClick = { openPage(currentPage) }
                        )
                    }

                    // Row 2: 30 Juzs Index | Smart Sheikh Tutor
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        QuranGridTile(
                            modifier = Modifier.weight(1f),
                            title = "الأجزاء الـ 30",
                            subtitle = "تصفح حسب الأجزاء",
                            badge = "30 جزءاً",
                            icon = Icons.Default.Layers,
                            onClick = { section = QuranHubSection.JUZS }
                        )
                        QuranGridTile(
                            modifier = Modifier.weight(1f),
                            title = "الشيخ الذكي «شيخي»",
                            subtitle = "تسميع وتصحيح آية وصفحة",
                            badge = "AI ذكي",
                            icon = Icons.Default.Mic,
                            onClick = { showSheikhTutor = true }
                        )
                    }

                    // Row 3: Bookmarks | Active Reciter
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        QuranGridTile(
                            modifier = Modifier.weight(1f),
                            title = "المفضلة والعلامات",
                            subtitle = "الآيات المحفوظة للمتابعة",
                            badge = "${bookmarks.size} علامة",
                            icon = Icons.Default.Bookmark,
                            onClick = {
                                bookmarks = prefs.getBookmarks()
                                section = QuranHubSection.BOOKMARKS
                            }
                        )
                        QuranGridTile(
                            modifier = Modifier.weight(1f),
                            title = "قارئ التلاوة",
                            subtitle = NativeDataManager.reciters[selectedReciterIndex].nameArabic,
                            badge = "استماع MP3",
                            icon = Icons.Default.Headphones,
                            onClick = { showReciterDialog = true }
                        )
                    }
                }
            }

            QuranHubSection.SURAHS -> {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("ابحث عن سورة بالاسم أو الرقم...", color = MoazenInkMuted) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MoazenInkEmerald) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MoazenInkEmerald,
                        unfocusedBorderColor = MoazenCardBorder,
                        focusedTextColor = MoazenInkPrimary,
                        unfocusedTextColor = MoazenInkPrimary,
                        focusedContainerColor = MoazenCardStart,
                        unfocusedContainerColor = MoazenCardStart
                    ),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))

                // 2-Column Side-by-Side Grid of all 114 Surahs
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.fillMaxSize(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filteredSurahs, key = { it.number }) { surah ->
                        MoazenWidgetCard(
                            cornerRadius = 16.dp,
                            onClick = { openSurah(surah) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(MoazenInkEmerald),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "${surah.number}",
                                            color = Color.White,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        IconButton(
                                            onClick = {
                                                scope.launch {
                                                    val p = withContext(Dispatchers.IO) {
                                                        NativeDataManager.getFirstPageForSurah(context, surah.number)
                                                    }
                                                    openPage(p)
                                                }
                                            },
                                            modifier = Modifier.size(26.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.AutoStories,
                                                contentDescription = "فتح بالمصحف",
                                                tint = MoazenGoldDark,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                        IconButton(
                                            onClick = {
                                                val reciter = NativeDataManager.reciters[selectedReciterIndex]
                                                val formattedNum = String.format(java.util.Locale.US, "%03d", surah.number)
                                                NativeAudioPlayerManager.playUrlAudio(
                                                    context,
                                                    "${reciter.serverUrl}$formattedNum.mp3",
                                                    "سورة ${surah.nameArabic}",
                                                    reciter.nameArabic
                                                )
                                            },
                                            modifier = Modifier.size(26.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.PlayCircle,
                                                contentDescription = "استماع",
                                                tint = MoazenInkEmerald,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }
                                }

                                Text(
                                    text = "سورة ${surah.nameArabic}",
                                    color = MoazenInkEmerald,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "${if (surah.revelationType == "Meccan") "مكية" else "مدنية"} • ${surah.numberOfAyahs} آية",
                                    color = MoazenInkMuted,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }
            }

            QuranHubSection.JUZS -> {
                val juzList = remember { (1..30).toList() }
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.fillMaxSize(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(juzList) { juzNum ->
                        MoazenWidgetCard(
                            cornerRadius = 16.dp,
                            onClick = {
                                scope.launch {
                                    val p = withContext(Dispatchers.IO) {
                                        NativeDataManager.getFirstPageForJuz(context, juzNum)
                                    }
                                    openPage(p)
                                }
                            },
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
                                        text = "الجزء $juzNum",
                                        color = MoazenInkEmerald,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "فتح بداية الجزء بالمصحف",
                                        color = MoazenInkMuted,
                                        fontSize = 10.sp
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(CircleShape)
                                        .background(MoazenInkEmerald.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "$juzNum",
                                        color = MoazenInkEmerald,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }

            QuranHubSection.PAGE_READER -> {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = { if (currentPage > 1) openPage(currentPage - 1) },
                        enabled = currentPage > 1,
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = GoldAccent)
                        Text("السابقة", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = {
                            pageJumpInput = currentPage.toString()
                            showPageJumpDialog = true
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("صفحة $currentPage", color = EmeraldDeep, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = { if (currentPage < 604) openPage(currentPage + 1) },
                        enabled = currentPage < 604,
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("التالية", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Icon(Icons.Default.ChevronLeft, contentDescription = null, tint = GoldAccent)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (pageAyahs.isNotEmpty()) {
                        item {
                            val grouped = pageAyahs.groupBy { it.surahNumber }
                            MoazenWidgetCard(cornerRadius = 18.dp, modifier = Modifier.fillMaxWidth()) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    grouped.forEach { (sNum, sAyahs) ->
                                        val sTitle = sAyahs.firstOrNull()?.surahName ?: "سورة $sNum"
                                        MoazenSubWidgetBox(
                                            cornerRadius = 10.dp,
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = "سورة $sTitle",
                                                    color = MoazenInkEmerald,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                TextButton(
                                                    onClick = {
                                                        val reciter = NativeDataManager.reciters[selectedReciterIndex]
                                                        val formattedNum = String.format(java.util.Locale.US, "%03d", sNum)
                                                        NativeAudioPlayerManager.playUrlAudio(
                                                            context,
                                                            "${reciter.serverUrl}$formattedNum.mp3",
                                                            "سورة $sTitle",
                                                            reciter.nameArabic
                                                        )
                                                    },
                                                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                                ) {
                                                    Icon(Icons.Default.PlayCircle, contentDescription = null, tint = MoazenInkEmerald, modifier = Modifier.size(16.dp))
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("استماع", color = MoazenInkEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        }

                                        if (sAyahs.any { it.numberInSurah == 1 } && sNum != 1 && sNum != 9) {
                                            Text(
                                                text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                                                color = MoazenGoldDark,
                                                fontSize = 17.sp,
                                                fontWeight = FontWeight.Bold,
                                                textAlign = TextAlign.Center,
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                        }

                                        val pageCombined = sAyahs.joinToString(" ") {
                                            "${it.textArabic} ﴿${it.numberInSurah}﴾"
                                        }
                                        Text(
                                            text = pageCombined,
                                            color = MoazenInkPrimary,
                                            fontSize = 20.sp,
                                            lineHeight = 36.sp,
                                            textAlign = TextAlign.Right,
                                            modifier = Modifier.fillMaxWidth()
                                        )
                                    }
                                }
                            }
                        }

                        items(pageAyahs, key = { "${it.surahNumber}_${it.numberInSurah}" }) { ayah ->
                            if (ayah.tafseer.isNotBlank()) {
                                MoazenWidgetCard(cornerRadius = 14.dp, modifier = Modifier.fillMaxWidth()) {
                                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "تفسير ${ayah.surahName} (${ayah.numberInSurah})",
                                                color = MoazenInkEmerald,
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            IconButton(
                                                onClick = {
                                                    prefs.addBookmark(ayah.surahNumber, ayah.surahName, ayah.numberInSurah)
                                                    bookmarks = prefs.getBookmarks()
                                                },
                                                modifier = Modifier.size(28.dp)
                                            ) {
                                                Icon(Icons.Default.BookmarkBorder, contentDescription = "حفظ علامة", tint = MoazenGoldDark, modifier = Modifier.size(18.dp))
                                            }
                                        }
                                        Text(
                                            text = ayah.tafseer,
                                            color = MoazenInkMuted,
                                            fontSize = 12.sp,
                                            lineHeight = 19.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            QuranHubSection.SURAH_READER -> {
                val activeSurah = selectedSurah ?: NativeDataManager.surahs.first()

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            val reciter = NativeDataManager.reciters[selectedReciterIndex]
                            val formattedNum = String.format(java.util.Locale.US, "%03d", activeSurah.number)
                            NativeAudioPlayerManager.playUrlAudio(
                                context,
                                "${reciter.serverUrl}$formattedNum.mp3",
                                "سورة ${activeSurah.nameArabic}",
                                reciter.nameArabic
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null, tint = EmeraldDeep, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("استماع للسورة", color = EmeraldDeep, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = {
                            val firstPage = currentAyahs.firstOrNull()?.page ?: 1
                            openPage(firstPage)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldSurfaceLight),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.AutoStories, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(17.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("وضع الصفحات", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (activeSurah.number != 9 && activeSurah.number != 1) {
                    Text(
                        text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                        color = GoldLight,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                    )
                }

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(currentAyahs, key = { it.numberInSurah }) { ayah ->
                        MoazenWidgetCard(
                            cornerRadius = 16.dp,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "الآية ${ayah.numberInSurah} • ص ${ayah.page}",
                                        color = MoazenInkEmerald,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )

                                    IconButton(
                                        onClick = {
                                            prefs.addBookmark(activeSurah.number, activeSurah.nameArabic, ayah.numberInSurah)
                                            bookmarks = prefs.getBookmarks()
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.BookmarkBorder,
                                            contentDescription = "حفظ علامة",
                                            tint = MoazenGoldDark,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    text = ayah.textArabic,
                                    color = MoazenInkPrimary,
                                    fontSize = 19.sp,
                                    lineHeight = 33.sp,
                                    textAlign = TextAlign.Right,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                if (ayah.tafseer.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "التفسير الميسر: ${ayah.tafseer}",
                                        color = MoazenInkMuted,
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

            QuranHubSection.BOOKMARKS -> {
                if (bookmarks.isEmpty()) {
                    MoazenWidgetCard(cornerRadius = 18.dp, modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.BookmarkBorder, contentDescription = null, tint = MoazenGoldDark, modifier = Modifier.size(36.dp))
                            Text("لا توجد علامات مرجعية محفوظة بعد", color = MoazenInkEmerald, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("اضغط على أيقونة الحفظ بجانب أي آية لإضافتها هنا", color = MoazenInkMuted, fontSize = 12.sp)
                        }
                    }
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(bookmarks, key = { it.id }) { bm: QuranBookmark ->
                            MoazenWidgetCard(
                                cornerRadius = 16.dp,
                                onClick = {
                                    val s = NativeDataManager.surahs.find { it.number == bm.surahNumber }
                                    if (s != null) openSurah(s)
                                },
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
                                            text = "سورة ${bm.surahName} • الآية ${bm.ayahNumber}",
                                            color = MoazenInkEmerald,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text("اضغط للفتح ومتابعة القراءة", color = MoazenInkMuted, fontSize = 11.sp)
                                    }
                                    IconButton(onClick = {
                                        prefs.removeBookmark(bm.id)
                                        bookmarks = prefs.getBookmarks()
                                    }) {
                                        Icon(Icons.Default.DeleteOutline, contentDescription = "حذف", tint = ErrorRed)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showPageJumpDialog) {
        AlertDialog(
            onDismissRequest = { showPageJumpDialog = false },
            containerColor = MoazenCardStart,
            title = { Text("الانتقال السريع إلى صفحة بالمصحف", color = MoazenInkEmerald, fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                OutlinedTextField(
                    value = pageJumpInput,
                    onValueChange = { s -> pageJumpInput = s.filter { it.isDigit() }.take(3) },
                    label = { Text("رقم الصفحة (1 - 604)", color = MoazenInkMuted) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MoazenInkEmerald,
                        unfocusedBorderColor = MoazenCardBorder,
                        focusedTextColor = MoazenInkPrimary,
                        unfocusedTextColor = MoazenInkPrimary
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val target = pageJumpInput.toIntOrNull()?.coerceIn(1, 604) ?: currentPage
                        showPageJumpDialog = false
                        openPage(target)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald)
                ) {
                    Text("انتقال", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showPageJumpDialog = false }) {
                    Text("إلغاء", color = MoazenInkMuted)
                }
            }
        )
    }

    if (showReciterDialog) {
        AlertDialog(
            onDismissRequest = { showReciterDialog = false },
            containerColor = MoazenCardStart,
            title = {
                Text(
                    text = "اختر القارئ للتلاوة",
                    color = MoazenInkEmerald,
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    NativeDataManager.reciters.forEachIndexed { index, reciter ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (selectedReciterIndex == index) MoazenInkEmerald else Color.White.copy(alpha = 0.72f))
                                .clickable {
                                    selectedReciterIndex = index
                                    showReciterDialog = false
                                }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = reciter.nameArabic,
                                color = if (selectedReciterIndex == index) Color.White else MoazenInkPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                            if (selectedReciterIndex == index) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    tint = MoazenGold,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showReciterDialog = false }) {
                    Text("إغلاق", color = MoazenInkEmerald, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}
