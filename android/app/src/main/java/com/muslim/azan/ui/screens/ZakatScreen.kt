package com.muslim.azan.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenWidgetCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

private data class ZakatCurrencyOption(
    val code: String,
    val symbol: String,
    val label: String,
    val defaultGold24: String,
    val defaultSilver: String,
    val defaultFitr: String
)

private val ZAKAT_CURRENCIES = listOf(
    ZakatCurrencyOption("EGP", "ج.م", "مصر (ج.م)", "4300", "52", "35"),
    ZakatCurrencyOption("SAR", "ر.س", "السعودية (ر.س)", "325", "4", "25"),
    ZakatCurrencyOption("AED", "د.إ", "الإمارات (د.إ)", "318", "3.9", "25"),
    ZakatCurrencyOption("KWD", "د.ك", "الكويت (د.ك)", "26.5", "0.32", "1.5"),
    ZakatCurrencyOption("QAR", "ر.ق", "قطر (ر.ق)", "315", "3.8", "15"),
    ZakatCurrencyOption("JOD", "د.أ", "الأردن (د.أ)", "61.5", "0.75", "2.5"),
    ZakatCurrencyOption("USD", "$", "دولار ($)", "86.5", "1.05", "15"),
    ZakatCurrencyOption("EUR", "€", "يورو (€)", "80.5", "0.98", "14")
)

@Composable
fun ZakatScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { NativePreferences(context) }
    val scope = rememberCoroutineScope()

    var selectedCurrencyIdx by remember { mutableIntStateOf(0) }
    val activeCurrency = ZAKAT_CURRENCIES[selectedCurrencyIdx]

    var nisabStandard by remember { mutableStateOf("gold") } // gold | silver
    var cashAmount by remember { mutableStateOf("") }
    var receivablesAmount by remember { mutableStateOf("") }
    var gold24Grams by remember { mutableStateOf("") }
    var gold21Grams by remember { mutableStateOf("") }
    var gold18Grams by remember { mutableStateOf("") }
    var silverGrams by remember { mutableStateOf("") }
    var tradeGoods by remember { mutableStateOf("") }
    var stocksAmount by remember { mutableStateOf("") }
    var stocksInvestmentMode by remember { mutableStateOf(false) } // false = 100%, true = 25%
    var rentalSavings by remember { mutableStateOf("") }
    var debtsToDeduct by remember { mutableStateOf("") }

    var goldGramPrice by remember { mutableStateOf(activeCurrency.defaultGold24) }
    var silverGramPrice by remember { mutableStateOf(activeCurrency.defaultSilver) }

    // Zakat al-Fitr
    var fitrMembers by remember { mutableStateOf("1") }
    var fitrPerPerson by remember { mutableStateOf(activeCurrency.defaultFitr) }

    // Crops Zakat
    var cropsKg by remember { mutableStateOf("") }
    var cropsNaturalIrrigation by remember { mutableStateOf(true) }

    // Metals fetch status
    var fetchingMetals by remember { mutableStateOf(false) }
    var metalsStatusMsg by remember { mutableStateOf<String?>(null) }

    val cash = cashAmount.toDoubleOrNull() ?: 0.0
    val receivables = receivablesAmount.toDoubleOrNull() ?: 0.0
    val g24 = gold24Grams.toDoubleOrNull() ?: 0.0
    val g21 = gold21Grams.toDoubleOrNull() ?: 0.0
    val g18 = gold18Grams.toDoubleOrNull() ?: 0.0
    val silver = silverGrams.toDoubleOrNull() ?: 0.0
    val priceGold24 = goldGramPrice.toDoubleOrNull() ?: 0.0
    val priceSilver = silverGramPrice.toDoubleOrNull() ?: 0.0
    val goods = tradeGoods.toDoubleOrNull() ?: 0.0
    val stocks = stocksAmount.toDoubleOrNull() ?: 0.0
    val rental = rentalSavings.toDoubleOrNull() ?: 0.0
    val debts = debtsToDeduct.toDoubleOrNull() ?: 0.0

    val eqGold24Grams = g24 + g21 * (21.0 / 24.0) + g18 * (18.0 / 24.0)
    val goldValue = eqGold24Grams * priceGold24
    val silverValue = silver * priceSilver
    val zakatableStocks = if (stocksInvestmentMode) stocks * 0.25 else stocks
    val grossWealth = cash + receivables + goldValue + silverValue + goods + zakatableStocks + rental
    val totalWealth = (grossWealth - debts).coerceAtLeast(0.0)

    val nisabThreshold = if (nisabStandard == "gold") 85.0 * priceGold24 else 595.0 * priceSilver
    val hasReachedNisab = nisabThreshold > 0 && totalWealth >= nisabThreshold
    val nisabProgress = if (nisabThreshold > 0) (totalWealth / nisabThreshold).toFloat().coerceIn(0f, 1f) else 0f
    val zakatAmount = if (hasReachedNisab) totalWealth * 0.025 else 0.0

    val fitrMembersInt = (fitrMembers.toIntOrNull() ?: 1).coerceAtLeast(1)
    val fitrUnit = (fitrPerPerson.toDoubleOrNull() ?: 0.0).coerceAtLeast(0.0)
    val fitrTotalDue = fitrMembersInt * fitrUnit

    val cropsWeight = cropsKg.toDoubleOrNull() ?: 0.0
    val cropsDueKg = if (cropsWeight >= 653.0) cropsWeight * (if (cropsNaturalIrrigation) 0.10 else 0.05) else 0.0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = TextPrimary)
                }
                Text(
                    text = "حاسبة الزكاة الشرعية",
                    color = TextPrimary,
                    fontSize = 19.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            TextButton(onClick = {
                cashAmount = ""
                receivablesAmount = ""
                gold24Grams = ""
                gold21Grams = ""
                gold18Grams = ""
                silverGrams = ""
                tradeGoods = ""
                stocksAmount = ""
                rentalSavings = ""
                debtsToDeduct = ""
                cropsKg = ""
                metalsStatusMsg = null
            }) {
                Icon(Icons.Default.RestartAlt, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("تصفير", color = GoldAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Currency & Live Metals Card
            item {
                MoazenWidgetCard(
                    cornerRadius = 16.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("اختر العملة وسعر المعدن:", color = MoazenInkEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Button(
                                onClick = {
                                    if (fetchingMetals) return@Button
                                    fetchingMetals = true
                                    metalsStatusMsg = null
                                    scope.launch {
                                        val res = withContext(Dispatchers.IO) {
                                            runCatching {
                                                val base = prefs.sheikhServerBaseUrl.trimEnd('/')
                                                val conn = (URL("$base/api/zakat/metals?currency=${activeCurrency.code}").openConnection() as HttpURLConnection).apply {
                                                    connectTimeout = 7000
                                                    readTimeout = 7000
                                                }
                                                val text = conn.inputStream.bufferedReader().use { it.readText() }
                                                conn.disconnect()
                                                JSONObject(text)
                                            }
                                        }
                                        fetchingMetals = false
                                        res.onSuccess { obj ->
                                            if (obj.optBoolean("success", false)) {
                                                val g24p = obj.optDouble("gold24PerGram", 0.0)
                                                val silp = obj.optDouble("silverPerGram", 0.0)
                                                if (g24p > 0) {
                                                    goldGramPrice = if (g24p % 1.0 == 0.0) g24p.toInt().toString() else String.format(Locale.US, "%.2f", g24p)
                                                }
                                                if (silp > 0) {
                                                    silverGramPrice = if (silp % 1.0 == 0.0) silp.toInt().toString() else String.format(Locale.US, "%.2f", silp)
                                                }
                                                val src = obj.optString("source", "reference")
                                                metalsStatusMsg = if (src == "live") "تم تحديث السعر الفوري بنجاح ✓" else "تم ضبط السعر الاسترشادي المعتمد"
                                            }
                                        }.onFailure {
                                            metalsStatusMsg = "استخدام السعر المحلي — يمكنك التعديل يدوياً"
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MoazenInkEmerald),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.height(30.dp)
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(if (fetchingMetals) "جاري الجلب..." else "تحديث الأسعار", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            ZAKAT_CURRENCIES.forEachIndexed { idx, cur ->
                                val selected = idx == selectedCurrencyIdx
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (selected) MoazenInkEmerald else Color.White.copy(alpha = 0.78f))
                                        .clickable {
                                            selectedCurrencyIdx = idx
                                            goldGramPrice = cur.defaultGold24
                                            silverGramPrice = cur.defaultSilver
                                            fitrPerPerson = cur.defaultFitr
                                            metalsStatusMsg = null
                                        }
                                        .padding(horizontal = 10.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = cur.label,
                                        color = if (selected) Color.White else MoazenInkPrimary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        metalsStatusMsg?.let { msg ->
                            Text(msg, color = Color(0xFF047857), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("gold" to "نصاب الذهب (85 جم)", "silver" to "نصاب الفضة (595 جم)").forEach { (key, title) ->
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (nisabStandard == key) MoazenInkEmerald else Color.White.copy(alpha = 0.78f))
                                        .clickable { nisabStandard = key }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = title,
                                        color = if (nisabStandard == key) Color.White else MoazenInkPrimary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Result Highlight Card with Progress & Breakdown
            item {
                MoazenWidgetCard(
                    cornerRadius = 20.dp,
                    borderColor = MoazenGoldDark.copy(alpha = 0.5f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (hasReachedNisab) "الزكاة الواجب إخراجها (2.5%)" else "لم يبلغ المال النصاب الشرعي بعد",
                            color = if (hasReachedNisab) MoazenInkEmerald else MoazenInkMuted,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${String.format(Locale.US, "%,.2f", zakatAmount)} ${activeCurrency.symbol}",
                            color = if (hasReachedNisab) MoazenInkEmerald else MoazenInkPrimary,
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold
                        )
                        LinearProgressIndicator(
                            progress = { nisabProgress },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(7.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = if (hasReachedNisab) Color(0xFF047857) else MoazenGoldDark,
                            trackColor = MoazenInkEmerald.copy(alpha = 0.14f)
                        )
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(
                                text = "صافي الوعاء: ${String.format(Locale.US, "%,.0f", totalWealth)} ${activeCurrency.symbol}",
                                color = MoazenInkPrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = "حد النصاب: ${String.format(Locale.US, "%,.0f", nisabThreshold)} ${activeCurrency.symbol}",
                                color = MoazenInkMuted,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }

            // Inputs Section
            item {
                Text(
                    text = "بيانات الأموال والأصول (${activeCurrency.symbol}):",
                    color = GoldAccent,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            item { ZakatInputField("السيولة النقدية والودائع البنكية:", cashAmount, "0.0") { cashAmount = it } }
            item { ZakatInputField("الديون المرجوّة لك عند الآخرين:", receivablesAmount, "0.0") { receivablesAmount = it } }

            // Multi-karat Gold & Silver
            item {
                MoazenWidgetCard(
                    cornerRadius = 14.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("أوزان الذهب المدخر (بالجرام):", color = MoazenInkPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            if (eqGold24Grams > 0) {
                                Text("يعادل ${String.format(Locale.US, "%.1f", eqGold24Grams)} جم (24)", color = MoazenGoldDark, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            ZakatCompactField("عيار 24", gold24Grams, Modifier.weight(1f)) { gold24Grams = it }
                            ZakatCompactField("عيار 21", gold21Grams, Modifier.weight(1f)) { gold21Grams = it }
                            ZakatCompactField("عيار 18", gold18Grams, Modifier.weight(1f)) { gold18Grams = it }
                        }
                        ZakatCompactField("الفضة الخالصة (جرام):", silverGrams, Modifier.fillMaxWidth()) { silverGrams = it }
                    }
                }
            }

            item { ZakatInputField("قيمة البضائع وعروض التجارة:", tradeGoods, "0.0") { tradeGoods = it } }

            // Stocks & Rental yield
            item {
                MoazenWidgetCard(
                    cornerRadius = 14.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        ZakatCompactField("الأسهم والصناديق الاستثمارية:", stocksAmount, Modifier.fillMaxWidth()) { stocksAmount = it }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf(false to "أسهم مضاربة (100%)", true to "أسهم استثمار (25% وعاء)").forEach { (isInv, label) ->
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (stocksInvestmentMode == isInv) MoazenInkEmerald else Color.White.copy(alpha = 0.78f))
                                        .clickable { stocksInvestmentMode = isInv }
                                        .padding(vertical = 7.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(label, color = if (stocksInvestmentMode == isInv) Color.White else MoazenInkPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                        ZakatCompactField("عوائد إيجار وعقار مدخرة:", rentalSavings, Modifier.fillMaxWidth()) { rentalSavings = it }
                    }
                }
            }

            item { ZakatInputField("الديون الواجبة عليك (تُخصم من الوعاء):", debtsToDeduct, "0.0") { debtsToDeduct = it } }

            item {
                MoazenWidgetCard(
                    cornerRadius = 14.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ZakatCompactField("سعر جرام الذهب 24:", goldGramPrice, Modifier.weight(1f)) { goldGramPrice = it }
                        ZakatCompactField("سعر جرام الفضة:", silverGramPrice, Modifier.weight(1f)) { silverGramPrice = it }
                    }
                }
            }

            // Zakat al-Fitr Calculator
            item {
                MoazenWidgetCard(
                    cornerRadius = 16.dp,
                    borderColor = MoazenGoldDark.copy(alpha = 0.45f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("حاسبة زكاة الفطر (قبل صلاة العيد)", color = MoazenInkEmerald, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            ZakatCompactField("عدد أفراد الأسرة:", fitrMembers, Modifier.weight(1f)) { fitrMembers = it }
                            ZakatCompactField("قيمة الفرد (${activeCurrency.symbol}):", fitrPerPerson, Modifier.weight(1f)) { fitrPerPerson = it }
                        }
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color.White.copy(alpha = 0.78f),
                            border = BorderStroke(1.dp, MoazenCardBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("إجمالي زكاة الفطر:", color = MoazenInkPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("${String.format(Locale.US, "%,.2f", fitrTotalDue)} ${activeCurrency.symbol}", color = MoazenInkEmerald, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Crops Zakat & 8 Recipients Guide
            item {
                MoazenWidgetCard(
                    cornerRadius = 16.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("زكاة الزروع والثمار (النصاب 653 كجم)", color = MoazenInkEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        ZakatCompactField("وزن المحصول الكلي (كجم):", cropsKg, Modifier.fillMaxWidth()) { cropsKg = it }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf(true to "سقي طبيعي/أمطار (10%)", false to "سقي بآلة وكلفة (5%)").forEach { (isNat, label) ->
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (cropsNaturalIrrigation == isNat) MoazenInkEmerald else Color.White.copy(alpha = 0.78f))
                                        .clickable { cropsNaturalIrrigation = isNat }
                                        .padding(vertical = 7.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(label, color = if (cropsNaturalIrrigation == isNat) Color.White else MoazenInkPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                        if (cropsWeight > 0) {
                            Text(
                                text = if (cropsDueKg > 0) "الواجب إخراجه يوم الحصاد: ${String.format(Locale.US, "%.1f", cropsDueKg)} كجم" else "أقل من النصاب (653 كجم) — لا زكاة واجبة",
                                color = if (cropsDueKg > 0) Color(0xFF047857) else MoazenInkMuted,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            item {
                MoazenWidgetCard(
                    cornerRadius = 14.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("مصارف الزكاة الشرعية الثمانية (التوبة: 60):", color = MoazenInkEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Text(
                            text = "الفقراء، المساكين، العاملون عليها، المؤلفة قلوبهم، في الرقاب، الغارمون، في سبيل الله، وابن السبيل.",
                            color = MoazenInkMuted,
                            fontSize = 12.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ZakatCompactField(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    onValueChange: (String) -> Unit
) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(text = label, color = MoazenInkMuted, fontSize = 11.sp, fontWeight = FontWeight.Medium)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text("0", color = MoazenInkMuted, fontSize = 12.sp) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MoazenInkEmerald,
                unfocusedBorderColor = MoazenCardBorder,
                focusedContainerColor = Color.White.copy(alpha = 0.78f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.65f),
                focusedTextColor = MoazenInkPrimary,
                unfocusedTextColor = MoazenInkPrimary
            ),
            shape = RoundedCornerShape(10.dp),
            singleLine = true
        )
    }
}

@Composable
fun ZakatInputField(
    label: String,
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit
) {
    MoazenWidgetCard(
        cornerRadius = 14.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = label, color = MoazenInkPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                placeholder = { Text(placeholder, color = MoazenInkMuted) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MoazenInkEmerald,
                    unfocusedBorderColor = MoazenCardBorder,
                    focusedContainerColor = Color.White.copy(alpha = 0.78f),
                    unfocusedContainerColor = Color.White.copy(alpha = 0.65f),
                    focusedTextColor = MoazenInkPrimary,
                    unfocusedTextColor = MoazenInkPrimary
                ),
                shape = RoundedCornerShape(10.dp),
                singleLine = true
            )
        }
    }
}
