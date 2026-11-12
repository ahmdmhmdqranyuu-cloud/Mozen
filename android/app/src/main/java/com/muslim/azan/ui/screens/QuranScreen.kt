package com.muslim.azan.ui.screens

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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativeDataManager
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.model.Ayah
import com.muslim.azan.model.Surah
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuranScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var selectedSurah by remember { mutableStateOf<Surah?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var currentAyahs by remember { mutableStateOf<List<Ayah>>(emptyList()) }
    var selectedReciterIndex by remember { mutableStateOf(0) }
    var showReciterDialog by remember { mutableStateOf(false) }

    val filteredSurahs = remember(searchQuery) {
        if (searchQuery.isBlank()) {
            NativeDataManager.surahs
        } else {
            NativeDataManager.surahs.filter {
                it.nameArabic.contains(searchQuery) || it.englishName.contains(searchQuery, ignoreCase = true)
            }
        }
    }

    LaunchedEffect(selectedSurah) {
        selectedSurah?.let { surah ->
            currentAyahs = withContext(Dispatchers.IO) {
                NativeDataManager.loadAyahsForSurah(context, surah.number)
            }
            prefs.lastReadSurah = surah.number
        }
    }

    if (selectedSurah == null) {
        // Surahs List Catalog
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(EmeraldDeep)
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = TextPrimary)
                    }
                    Text(
                        text = "المصحف الشريف كاملاً",
                        color = TextPrimary,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                TextButton(onClick = { showReciterDialog = true }) {
                    Icon(Icons.Default.RecordVoiceOver, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "القارئ",
                        color = GoldAccent,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("ابحث عن سورة بالاسم...", color = TextSecondary) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = GoldAccent) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = GoldAccent,
                    unfocusedBorderColor = CardBorder,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                    focusedContainerColor = EmeraldSurface,
                    unfocusedContainerColor = EmeraldSurface
                ),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredSurahs, key = { it.number }) { surah ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(EmeraldSurface)
                            .clickable { selectedSurah = surah }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(EmeraldSurfaceLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = surah.number.toString(),
                                    color = GoldAccent,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "سورة ${surah.nameArabic}",
                                    color = TextPrimary,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${if (surah.revelationType == "Meccan") "مكية" else "مدنية"} • ${surah.numberOfAyahs} آيات",
                                    color = TextSecondary,
                                    fontSize = 12.sp
                                )
                            }
                        }

                        // Play Surah Audio Recitation Button
                        IconButton(
                            onClick = {
                                val reciter = NativeDataManager.reciters[selectedReciterIndex]
                                val formattedNum = String.format(java.util.Locale.US, "%03d", surah.number)
                                val audioUrl = "${reciter.serverUrl}$formattedNum.mp3"
                                NativeAudioPlayerManager.playUrlAudio(
                                    context,
                                    audioUrl,
                                    "سورة ${surah.nameArabic}",
                                    reciter.nameArabic
                                )
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayCircle,
                                contentDescription = "استماع للتلاوة",
                                tint = GoldAccent,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }
                }
            }
        }
    } else {
        // Surah Reading View
        val activeSurah = selectedSurah!!
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(EmeraldDeep)
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { selectedSurah = null }) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "العودة للفهرس", tint = TextPrimary)
                }
                Text(
                    text = "سورة ${activeSurah.nameArabic}",
                    color = GoldAccent,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                IconButton(
                    onClick = {
                        val reciter = NativeDataManager.reciters[selectedReciterIndex]
                        val formattedNum = String.format(java.util.Locale.US, "%03d", activeSurah.number)
                        val audioUrl = "${reciter.serverUrl}$formattedNum.mp3"
                        NativeAudioPlayerManager.playUrlAudio(
                            context,
                            audioUrl,
                            "سورة ${activeSurah.nameArabic}",
                            reciter.nameArabic
                        )
                    }
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = "تشغيل السورة", tint = GoldAccent)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Basmala
            if (activeSurah.number != 9 && activeSurah.number != 1) {
                Text(
                    text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                    color = GoldLight,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 10.dp)
                )
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(currentAyahs, key = { it.numberInSurah }) { ayah ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
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
                                    text = "الآية ${ayah.numberInSurah}",
                                    color = GoldAccent,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                IconButton(
                                    onClick = {
                                        prefs.addBookmark(activeSurah.number, activeSurah.nameArabic, ayah.numberInSurah)
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.BookmarkBorder,
                                        contentDescription = "حفظ علامة",
                                        tint = TextSecondary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = ayah.textArabic,
                                color = TextPrimary,
                                fontSize = 18.sp,
                                lineHeight = 32.sp,
                                textAlign = TextAlign.Right,
                                modifier = Modifier.fillMaxWidth()
                            )

                            if (ayah.tafseer.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "التفسير الميسر: ${ayah.tafseer}",
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

    if (showReciterDialog) {
        AlertDialog(
            onDismissRequest = { showReciterDialog = false },
            containerColor = EmeraldSurface,
            title = {
                Text(
                    text = "اختر القارئ للتلاوة",
                    color = GoldAccent,
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
                                .background(if (selectedReciterIndex == index) GoldDark else EmeraldSurfaceLight)
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
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                            if (selectedReciterIndex == index) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    tint = GoldAccent,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showReciterDialog = false }) {
                    Text("إغلاق", color = GoldAccent)
                }
            }
        )
    }
}
