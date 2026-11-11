package com.muslim.azan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.theme.*

@Composable
fun ZakatScreen(
    onBack: () -> Unit
) {
    var cashAmount by remember { mutableStateOf("") }
    var goldGrams by remember { mutableStateOf("") }
    var goldGramPrice by remember { mutableStateOf("3000") } // Average estimated gram price in local currency
    var tradeGoods by remember { mutableStateOf("") }
    var debtsToDeduct by remember { mutableStateOf("") }

    val cash = cashAmount.toDoubleOrNull() ?: 0.0
    val gold = goldGrams.toDoubleOrNull() ?: 0.0
    val pricePerGram = goldGramPrice.toDoubleOrNull() ?: 0.0
    val goods = tradeGoods.toDoubleOrNull() ?: 0.0
    val debts = debtsToDeduct.toDoubleOrNull() ?: 0.0

    val goldValue = gold * pricePerGram
    val totalWealth = (cash + goldValue + goods - debts).coerceAtLeast(0.0)

    val nisabThreshold = 85.0 * pricePerGram // 85 grams of 24k gold
    val hasReachedNisab = totalWealth >= nisabThreshold && nisabThreshold > 0
    val zakatAmount = if (hasReachedNisab) totalWealth * 0.025 else 0.0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EmeraldDeep)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = TextPrimary)
            }
            Text(
                text = "حاسبة الزكاة الشرعية الذكية",
                color = TextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Result Highlight Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (hasReachedNisab) "الزكاة الواجب إخراجها (2.5%)" else "لم يبلغ المال النصاب الشرعي بعد",
                            color = if (hasReachedNisab) GoldAccent else TextSecondary,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = String.format(java.util.Locale.US, "%,.2f", zakatAmount),
                            color = if (hasReachedNisab) GoldAccent else TextPrimary,
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "إجمالي الوعاء الزكوي الخاضع: " + String.format(java.util.Locale.US, "%,.2f", totalWealth),
                            color = TextSecondary,
                            fontSize = 12.sp
                        )
                    }
                }
            }

            // Inputs
            item {
                Text(
                    text = "بيانات الأموال والممتلكات المدخرة:",
                    color = TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            item {
                ZakatInputField("السيولة النقدية والودائع البنكية:", cashAmount, "0.0") { cashAmount = it }
            }

            item {
                ZakatInputField("وزن الذهب المدخر للتجارة والادخار (بالجرام):", goldGrams, "0") { goldGrams = it }
            }

            item {
                ZakatInputField("سعر جرام الذهب عيار 24 حاليًا:", goldGramPrice, "3000") { goldGramPrice = it }
            }

            item {
                ZakatInputField("قيمة البضائع وعروض التجارة المعدة للبيع:", tradeGoods, "0.0") { tradeGoods = it }
            }

            item {
                ZakatInputField("الديون والالتزامات العاجلة الواجبة عليك:", debtsToDeduct, "0.0") { debtsToDeduct = it }
            }

            // Info Card about Nisab
            item {
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldSurfaceLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "نصاب الزكاة الشرعي:",
                            color = GoldAccent,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "النصاب الشرعي هو ما يعادل قيمة 85 جراماً من الذهب الخالص عيار 24، ويشترط مرور حول كامل (عام هجري) على امتلاك النصاب مع خلوه من الدين.",
                            color = TextSecondary,
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
fun ZakatInputField(
    label: String,
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(text = label, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                placeholder = { Text(placeholder, color = TextSecondary) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = GoldAccent,
                    unfocusedBorderColor = CardBorder,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                ),
                shape = RoundedCornerShape(10.dp),
                singleLine = true
            )
        }
    }
}
