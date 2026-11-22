package com.muslim.azan.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard

data class MosqueGuideItem(
    val id: String,
    val name: String,
    val address: String,
    val distanceKm: Double,
    val rating: String,
    val hasJumua: Boolean,
    val hasWomenSection: Boolean
)

data class IslamicEventItem(
    val id: String,
    val title: String,
    val hijriDate: String,
    val gregorianDate: String,
    val description: String
)

private val OFFLINE_MOSQUES = listOf(
    MosqueGuideItem("m1", "المسجد الحرام", "مكة المكرمة - المملكة العربية السعودية", 0.5, "5.0", true, true),
    MosqueGuideItem("m2", "المسجد النبوي الشريف", "المدينة المنورة - المملكة العربية السعودية", 1.2, "5.0", true, true),
    MosqueGuideItem("m3", "الجامع الأزهر الشريف", "شارع الأزهر - القاهرة", 1.4, "5.0", true, true),
    MosqueGuideItem("m4", "مسجد الإمام الحسين", "حي الحسين - القاهرة", 1.8, "4.9", true, true),
    MosqueGuideItem("m5", "مسجد عمرو بن العاص", "مصر القديمة - الفسطاط", 3.4, "4.9", true, true),
    MosqueGuideItem("m6", "جامع الراجحي الكبير", "الرياض - المملكة العربية السعودية", 4.1, "4.9", true, true)
)

private val ISLAMIC_EVENTS_LIST = listOf(
    IslamicEventItem("ramadan", "أول أيام شهر رمضان المبارك", "1 رمضان", "شهر القرآن والصيام", "شهر البركات والرحمات وقيام الليل وتلاوة القرآن الكريم."),
    IslamicEventItem("qadr", "ليلة القدر المباركة", "27 رمضان", "خير من ألف شهر", "ليلة مباركة تتنزل فيها الملائكة والروح، سلام هي حتى مطلع الفجر."),
    IslamicEventItem("fitr", "عيد الفطر المبارك", "1 شوال", "يوم الجائزة", "يوم الفرحة بإتمام الصيام وإخراج زكاة الفطر وصلة الأرحام."),
    IslamicEventItem("arafah", "يوم عرفة المبارك", "9 ذو الحجة", "ركن الحج الأعظم", "صيامه لغير الحاج يكفر ذنوب سنة ماضية وسنة باقية بإذن الله."),
    IslamicEventItem("adha", "عيد الأضحى المبارك", "10 ذو الحجة", "يوم النحر", "إحياء سنة نبي الله إبراهيم عليه السلام بالأضحية والتكبير."),
    IslamicEventItem("hijri", "رأس السنة الهجرية", "1 محرم", "الهجرة النبوية", "ذكرى الهجرة المباركة من مكة إلى المدينة المنورة وبناء الدولة الإسلامية."),
    IslamicEventItem("ashura", "يوم عاشوراء", "10 محرم", "شكر النجاة", "صيامه يكفر ذنوب سنة ماضية كما ثبت في الحديث الصحيح.")
)

@Composable
fun MasajidScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    BackHandler { onBack() }
    val context = LocalContext.current
    var activeTab by remember { mutableIntStateOf(0) }
    var searchQuery by remember { mutableStateOf("") }
    var filterMode by remember { mutableStateOf("all") }

    val filteredMosques = remember(searchQuery, filterMode) {
        OFFLINE_MOSQUES.filter { m ->
            val q = searchQuery.trim()
            val matchQ = q.isEmpty() || m.name.contains(q) || m.address.contains(q)
            if (!matchQ) return@filter false
            when (filterMode) {
                "jumua" -> m.hasJumua
                "women" -> m.hasWomenSection
                else -> true
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MuslimPlusCanvasBrush)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = MoazenInkEmerald)
            }
            Column {
                Text(
                    text = "المساجد القريبة والمناسبات",
                    color = MoazenInkEmerald,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "دليل المساجد المحفوظة محلياً والتقويم الإسلامي (${prefs.cityName})",
                    color = MoazenInkMuted,
                    fontSize = 11.sp
                )
            }
        }

        // Tabs: Mosques vs Islamic Events
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf(0 to "المساجد ومصليات الجمعة", 1 to "المناسبات الإسلامية").forEach { (idx, label) ->
                val active = activeTab == idx
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (active) MuslimPlusPillEmerald else MoazenCardStart,
                    border = BorderStroke(1.dp, if (active) MuslimPlusPillEmerald else MoazenCardBorder),
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { activeTab = idx }
                ) {
                    Text(
                        text = label,
                        color = if (active) Color.White else MoazenInkPrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(vertical = 9.dp, horizontal = 6.dp)
                    )
                }
            }
        }

        if (activeTab == 0) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("ابحث عن أقرب مسجد في منطقتك...", fontSize = 12.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MoazenInkEmerald) },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MoazenInkEmerald,
                    unfocusedBorderColor = MoazenCardBorder,
                    focusedContainerColor = MoazenCardStart,
                    unfocusedContainerColor = MoazenCardStart
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                listOf("all" to "الكل", "jumua" to "صلاة الجمعة", "women" to "مصلى نساء").forEach { (id, label) ->
                    val active = filterMode == id
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (active) MoazenGold else MoazenCardStart,
                        border = BorderStroke(1.dp, if (active) MoazenGoldDark else MoazenCardBorder),
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { filterMode = id }
                    ) {
                        Text(
                            text = label,
                            color = MoazenInkPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(vertical = 6.dp)
                        )
                    }
                }
            }

            // Open local map search for nearby mosques on user's device
            Button(
                onClick = {
                    val geoUri = Uri.parse("geo:${prefs.latitude},${prefs.longitude}?q=" + Uri.encode("مسجد"))
                    val mapIntent = Intent(Intent.ACTION_VIEW, geoUri)
                    runCatching { context.startActivity(mapIntent) }.onFailure {
                        Toast.makeText(context, "تعذر فتح تطبيق الخرائط للبحث عن المساجد القريبة", Toast.LENGTH_SHORT).show()
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Map, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("البحث المباشر عن أقرب مسجد حول موقعي", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.5.sp)
            }

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(filteredMosques, key = { it.id }) { m ->
                    MoazenWidgetCard(
                        cornerRadius = 14.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = m.name,
                                    color = MoazenInkEmerald,
                                    fontSize = 14.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "★ ${m.rating}",
                                    color = MoazenGoldDark,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = m.address,
                                color = MoazenInkMuted,
                                fontSize = 11.5.sp
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "خطبة الجمعة ✓ • مصلى نساء ✓",
                                    color = MoazenInkPrimary,
                                    fontSize = 11.sp
                                )
                                OutlinedButton(
                                    onClick = {
                                        val uri = Uri.parse("geo:0,0?q=" + Uri.encode(m.name + " " + m.address))
                                        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, uri)) }.onFailure {
                                            Toast.makeText(context, "تعذر فتح المسار في الخرائط", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Text("الاتجاهات", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(ISLAMIC_EVENTS_LIST, key = { it.id }) { ev ->
                    MoazenWidgetCard(
                        cornerRadius = 14.dp,
                        borderColor = MoazenGold,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = ev.title,
                                    color = MoazenInkEmerald,
                                    fontSize = 14.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = MoazenGold.copy(alpha = 0.25f)
                                ) {
                                    Text(
                                        text = ev.hijriDate,
                                        color = MoazenGoldDark,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                            }
                            Text(
                                text = ev.description,
                                color = MoazenInkPrimary,
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
