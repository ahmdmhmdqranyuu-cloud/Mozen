package com.muslim.azan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*

@Composable
fun RamadanScreen(
    prefs: NativePreferences,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var fastedToday by remember { mutableStateOf(true) }
    var taraweehDone by remember { mutableStateOf(false) }
    var quranDone by remember { mutableStateOf(false) }
    var charityDone by remember { mutableStateOf(false) }

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
                text = "شهر رمضان المبارك",
                color = TextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Hero Iftar & Suhoor Card
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
                    text = "رمضان كريم مبارك",
                    color = GoldAccent,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "«شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ»",
                    color = TextPrimary,
                    fontSize = 13.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        NativeAudioPlayerManager.playAssetAudio(context, "audio/iftar_cannon.mp3", "مدفع الإفطار", "تكبيرات ومدفع الإفطار")
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GoldAccent)
                ) {
                    Text(text = "سماع صوت مدفع الإفطار", color = EmeraldDeep, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "جدول متابعة الطاعات والعبادات اليومية:",
            color = TextPrimary,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(10.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item {
                ChecklistCard("صيام اليوم بنية خالصة", fastedToday) { fastedToday = !fastedToday }
            }
            item {
                ChecklistCard("صلاة التراويح وقيام الليل", taraweehDone) { taraweehDone = !taraweehDone }
            }
            item {
                ChecklistCard("قراءة الورد اليومي من القرآن الكريم", quranDone) { quranDone = !quranDone }
            }
            item {
                ChecklistCard("الصدقة وإفطار صائم", charityDone) { charityDone = !charityDone }
            }
        }
    }
}

@Composable
fun ChecklistCard(title: String, isChecked: Boolean, onToggle: () -> Unit) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = EmeraldSurface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = title, color = TextPrimary, fontSize = 14.sp)
            IconButton(onClick = onToggle) {
                Icon(
                    imageVector = if (isChecked) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                    contentDescription = null,
                    tint = if (isChecked) EmeraldPrimary else TextSecondary
                )
            }
        }
    }
}
