package com.muslim.azan.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.MoazenSubWidgetBox
import com.muslim.azan.ui.components.MoazenWidgetCard

data class NameOfAllahItem(
    val number: Int,
    val name: String,
    val transliteration: String,
    val meaning: String
)

private val NAMES_OF_ALLAH_LIST = listOf(
    NameOfAllahItem(1, "الله", "Allah", "المألوه المعبود بحق، الذي لا إله إلا هو"),
    NameOfAllahItem(2, "الرَّحْمَٰنُ", "Ar-Rahman", "ذو الرحمة الشاملة لجميع الخلائق في الدنيا"),
    NameOfAllahItem(3, "الرَّحِيمُ", "Ar-Raheem", "ذو الرحمة الخاصة بالمؤمنين في الآخرة"),
    NameOfAllahItem(4, "المَلِكُ", "Al-Malik", "المتصرف في ملكه كيف يشاء بلا منازع"),
    NameOfAllahItem(5, "القُدُّوسُ", "Al-Quddus", "المنزه عن كل عيب ونقص الطاهر من كل سوء"),
    NameOfAllahItem(6, "السَّلَامُ", "As-Salam", "السالم من النقائص والعيوب وواهب السلام لعباده"),
    NameOfAllahItem(7, "المُؤْمِنُ", "Al-Mu'min", "المصدق لرسله بالآيات والمؤمّن لعباده من الخوف"),
    NameOfAllahItem(8, "المُهَيْمِنُ", "Al-Muhaymin", "الرقيب الحافظ على كل شيء الشاهد على خلقه"),
    NameOfAllahItem(9, "العَزِيزُ", "Al-Aziz", "القوي القاهر الذي لا يُغلب ولا يُضام"),
    NameOfAllahItem(10, "الجَبَّارُ", "Al-Jabbar", "الذي يجبر قلوب المنكسرين ويقهر المتكبرين"),
    NameOfAllahItem(11, "المُتَكَبِّرُ", "Al-Mutakabbir", "المتعالي عن صفات الخلق المتفرد بالعظمة والكبرياء"),
    NameOfAllahItem(12, "الخَالِقُ", "Al-Khaliq", "الموجد للأشياء من العدم على غير مثال سابق"),
    NameOfAllahItem(13, "البَارِئُ", "Al-Bari", "المبرز لما قدره وخلقه بريئاً من التفاوت والخلل"),
    NameOfAllahItem(14, "المُصَوِّرُ", "Al-Musawwir", "المعطي لكل مخلوق صورته وهيئته المميزة"),
    NameOfAllahItem(15, "الغَفَّارُ", "Al-Ghaffar", "الكثير الستر والمغفرة لذنوب عباده التائبين"),
    NameOfAllahItem(16, "القَهَّارُ", "Al-Qahhar", "الذي خضعت له الرقاب وذلت لعظمته الخلائق"),
    NameOfAllahItem(17, "الوَهَّابُ", "Al-Wahhab", "الجواد المعطي للنعم الجزيلة بلا عوض ولا مقابل"),
    NameOfAllahItem(18, "الرَّزَّاقُ", "Ar-Razzaq", "المتكفل بأقوات العباد وأرزاقهم أجمعين"),
    NameOfAllahItem(19, "الفَتَّاحُ", "Al-Fattah", "الحاكم بين عباده بالعدل، وفاتح أبواب الرحمة والرزق"),
    NameOfAllahItem(20, "العَلِيمُ", "Al-Aleem", "المحيط بكل شيء ظاهراً وباطناً سراً وعلانية"),
    NameOfAllahItem(21, "القَابِضُ", "Al-Qabid", "المضيّق للأرزاق والنفوس بحكمته وعدله"),
    NameOfAllahItem(22, "البَاسِطُ", "Al-Basit", "الموسّع للرزق والرحمة على من يشاء بفضله"),
    NameOfAllahItem(23, "الخَافِضُ", "Al-Khafid", "المذل لأهل الكفر والعصيان والظلم"),
    NameOfAllahItem(24, "الرَّافِعُ", "Ar-Rafi", "المعلي لشأن أهل الإيمان والتقوى والعلم"),
    NameOfAllahItem(25, "المُعِزُّ", "Al-Mu'izz", "الواهب للعزة والتمكين لمن والاه وأطاعه"),
    NameOfAllahItem(26, "المُذِلُّ", "Al-Mudhill", "الذي يسلب العزة عمن عصاه وخالف أمره"),
    NameOfAllahItem(27, "السَّمِيعُ", "As-Sami", "الذي لا يغيب عن سمعه صوت، يسمع السر وأخفى"),
    NameOfAllahItem(28, "البَصِيرُ", "Al-Baseer", "الذي يرى كل شيء لا تخفى عليه خافية"),
    NameOfAllahItem(29, "الحَكَمُ", "Al-Hakam", "صاحب الحكم والفصل العادل بين الخلائق"),
    NameOfAllahItem(30, "العَدْلُ", "Al-Adl", "المنزه عن الجور والظلم في قضائه وحكمه"),
    NameOfAllahItem(31, "اللَّطِيفُ", "Al-Lateef", "العليم بدقائق الأمور الذي يوصل الخير لعباده برفق"),
    NameOfAllahItem(32, "الخَبِيرُ", "Al-Khabeer", "العالم بحقائق الأشياء وخفايا الصدور"),
    NameOfAllahItem(33, "الحَلِيمُ", "Al-Haleem", "الذي لا يعاجل العصاة بالعقوبة بل يمهلهم"),
    NameOfAllahItem(34, "العَظِيمُ", "Al-Azeem", "ذو المجد والكبرياء الذي لا يحيط بعظمته عقل"),
    NameOfAllahItem(35, "الغَفُورُ", "Al-Ghafoor", "الواسع المغفرة والساتر للزلات"),
    NameOfAllahItem(36, "الشَّكُورُ", "Ash-Shakoor", "الذي يثيب على العمل القليل بالثواب الجزيل"),
    NameOfAllahItem(37, "العَلِيُّ", "Al-Ali", "المتعالي في ذاته وصفاته عن كل نقص"),
    NameOfAllahItem(38, "الكَبِيرُ", "Al-Kabeer", "الجليل الذي كل شيء دونه حقير وصغير"),
    NameOfAllahItem(39, "الحَفِيظُ", "Al-Hafeez", "الحارس للكون وحافظ أعمال العباد"),
    NameOfAllahItem(40, "المُقِيتُ", "Al-Muqeet", "المتكفل بإيصال الأقوات لأبدان وأرواح خلقه"),
    NameOfAllahItem(41, "الحَسِيبُ", "Al-Haseeb", "الكافي لعباده والمحاسب لهم على أعمالهم"),
    NameOfAllahItem(42, "الجَلِيلُ", "Al-Jaleel", "المتصف بصفات الجلال والكمال والعظمة"),
    NameOfAllahItem(43, "الكَرِيمُ", "Al-Kareem", "الكثير الخير العظيم النفع الذي يعطي بلا حساب"),
    NameOfAllahItem(44, "الرَّقِيبُ", "Ar-Raqeeb", "الملاحظ لما خلق، الشاهد على الضمائر"),
    NameOfAllahItem(45, "المُجِيبُ", "Al-Mujeeb", "السامع لدعاء الداعين الملبّي لحاجات السائلين"),
    NameOfAllahItem(46, "الوَاسِعُ", "Al-Wasi", "الذي وسعت رحمته وعلمه وقدرته كل شيء"),
    NameOfAllahItem(47, "الحَكِيمُ", "Al-Hakeem", "المتقن لأفعاله، الواضع للأشياء في مواضعها"),
    NameOfAllahItem(48, "الوَدُودُ", "Al-Wadood", "المحب لعباده الصالحين، المتودد إليهم بنعمه"),
    NameOfAllahItem(49, "المَجِيدُ", "Al-Majeed", "البالغ المنتهى في الشرف والكرم والمجد"),
    NameOfAllahItem(50, "البَاعِثُ", "Al-Ba'ith", "المحيي للموتى يوم الحساب للجزاء"),
    NameOfAllahItem(51, "الشَّهِيدُ", "Ash-Shaheed", "الحاضر الذي لا يعزب عنه شيء في الوجود"),
    NameOfAllahItem(52, "الحَقُّ", "Al-Haqq", "الثابت الوجود الذي لا شك فيه ولا ريب"),
    NameOfAllahItem(53, "الوَكِيلُ", "Al-Wakeel", "المفوّض إليه أمر العباد والكافي لمن توكل عليه"),
    NameOfAllahItem(54, "القَوِيُّ", "Al-Qawiyy", "التام القدرة الذي لا يعتريه وهن ولا عجز"),
    NameOfAllahItem(55, "المَتِينُ", "Al-Mateen", "الشديد القوة الذي لا تنقطع قوته"),
    NameOfAllahItem(56, "الوَلِيُّ", "Al-Waliyy", "الناصر والمعين لعباده المؤمنين"),
    NameOfAllahItem(57, "الحَمِيدُ", "Al-Hameed", "المستحق للحمد والثناء في السراء والضراء"),
    NameOfAllahItem(58, "المُحْصِي", "Al-Muhsee", "العالم بعدد الأشياء وحسابها لا يفوته شيء"),
    NameOfAllahItem(59, "المُبْدِئُ", "Al-Mubdi", "الذي أنشأ الخلق وابتدأه من غير سابقة"),
    NameOfAllahItem(60, "المُعِيدُ", "Al-Mu'eed", "الذي يرجع الخلق بعد فنائه إلى الحياة"),
    NameOfAllahItem(61, "المُحْيِي", "Al-Muhyi", "الواهب للحياة لمن يشاء من الخلائق"),
    NameOfAllahItem(62, "المُمِيتُ", "Al-Mumeet", "المقدر للموت على الأحياء بحكمته"),
    NameOfAllahItem(63, "الحَيُّ", "Al-Hayy", "الدائم الباقي بحياة ذاتية أزلية وأبدية"),
    NameOfAllahItem(64, "القَيُّومُ", "Al-Qayyum", "القائم بنفسه المقيم لكل ما في الكون"),
    NameOfAllahItem(65, "الوَاجِدُ", "Al-Wajid", "الذي لا يعوزه شيء ولا يفوته مراد"),
    NameOfAllahItem(66, "المَاجِدُ", "Al-Majid", "الكثير الجود والفضل الواسع العطاء"),
    NameOfAllahItem(67, "الوَاحِدُ", "Al-Wahid", "الفرد المتفرد بالألوهية والربوبية"),
    NameOfAllahItem(68, "الصَّمَدُ", "As-Samad", "المقصود في الحوائج الذي يحتاج إليه الجميع"),
    NameOfAllahItem(69, "القَادِرُ", "Al-Qadir", "الذي إن شاء فعل وإن شاء ترك بلا مانع"),
    NameOfAllahItem(70, "المُقْتَدِرُ", "Al-Muqtadir", "التام الاقتدار الذي لا يمتنع عليه أمر"),
    NameOfAllahItem(71, "المُقَدِّمُ", "Al-Muqaddim", "المنزل للأشياء في مراتبها يقدّم ما يشاء"),
    NameOfAllahItem(72, "المُؤَخِّرُ", "Al-Mu'akhkhir", "المؤخر لما يشاء بحكمته ومشيئته"),
    NameOfAllahItem(73, "الأَوَّلُ", "Al-Awwal", "السابق للأشياء كلها بلا بداية"),
    NameOfAllahItem(74, "الآخِرُ", "Al-Akhir", "الباقي بعد فناء الخلائق بلا نهاية"),
    NameOfAllahItem(75, "الظَّاهِرُ", "Az-Zahir", "العالي فوق كل شيء بآياته وبراهين قدرته"),
    NameOfAllahItem(76, "البَاطِنُ", "Al-Batin", "المحتجب عن الأبصار العالم بخفايا الأسرار"),
    NameOfAllahItem(77, "الوَالِي", "Al-Wali", "المالك المتولي لتدبير شؤون مملكته"),
    NameOfAllahItem(78, "المُتَعَالِي", "Al-Muta'ali", "المتنزه عن نقائص الخلق وإدراك العقول"),
    NameOfAllahItem(79, "البَرُّ", "Al-Barr", "العطوف المحسن إلى عباده ببره وإحسانه"),
    NameOfAllahItem(80, "التَّوَّابُ", "At-Tawwab", "القابل لتوبة عباده الميسر لأسبابها"),
    NameOfAllahItem(81, "المُنْتَقِمُ", "Al-Muntaqim", "المجازي للظالمين والمعتدين بعدل وقوة"),
    NameOfAllahItem(82, "العَفُوُّ", "Al-Afuww", "الماحي للذنوب والمتجاوز عن الخطايا"),
    NameOfAllahItem(83, "الرَّءُوفُ", "Ar-Ra'oof", "الشديد الرحمة والرأفة بعباده المستضعفين"),
    NameOfAllahItem(84, "مَالِكُ المُلْكِ", "Malik-ul-Mulk", "المتصرف في الكون يؤتي الملك من يشاء"),
    NameOfAllahItem(85, "ذُو الجَلَالِ وَالإِكْرَامِ", "Dhul-Jalali wal-Ikram", "المستحق للتعظيم والإجلال والإنعام"),
    NameOfAllahItem(86, "المُقْسِطُ", "Al-Muqsit", "العادل في حكمه المنصف للمظلومين"),
    NameOfAllahItem(87, "الجَامِعُ", "Al-Jami", "الجامع للمتفرقات والجامع للناس ليوم لا ريب فيه"),
    NameOfAllahItem(88, "الغَنِيُّ", "Al-Ghaniyy", "المستغني عن خلقه والكل مفتقر إليه"),
    NameOfAllahItem(89, "المُغْنِي", "Al-Mughni", "المفيض بالغنى والكفاية على من يشاء"),
    NameOfAllahItem(90, "المَانِعُ", "Al-Mani", "الدافع للشرور والمانع للعطاء بحكمته"),
    NameOfAllahItem(91, "الضَّارُّ", "Ad-Darr", "المقدّر للضر ابتلاءً ومصلحة لمن يشاء"),
    NameOfAllahItem(92, "النَّافِعُ", "An-Nafi", "المقدّر للنفع والخير والبركة لعباده"),
    NameOfAllahItem(93, "النُّورُ", "An-Noor", "الظاهر في ذاته المظهر لغيره المنور للكون"),
    NameOfAllahItem(94, "الهَادِي", "Al-Hadi", "المرشد لخلقه إلى طريق الحق والهدى"),
    NameOfAllahItem(95, "البَدِيعُ", "Al-Badi", "الخالق للأشياء على إتقان وجمال بلا نظير"),
    NameOfAllahItem(96, "البَاقِي", "Al-Baqi", "الدائم الوجود الذي لا يلحقه فناء ولا زوال"),
    NameOfAllahItem(97, "الوَارِثُ", "Al-Warith", "الباقي بعد فناء الخلائق ومالك كل شيء"),
    NameOfAllahItem(98, "الرَّشِيدُ", "Ar-Rasheed", "الحكيم الذي تسير أفعاله وتدبيراته نحو الرشاد"),
    NameOfAllahItem(99, "الصَّبُورُ", "As-Saboor", "الذي لا يعاجل بالعقوبة بل يمهل العباد")
)

@Composable
fun NamesOfAllahScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    var selectedName by remember { mutableStateOf<NameOfAllahItem?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("all") }
    var isGridView by remember { mutableStateOf(false) }

    val isPlaying by NativeAudioPlayerManager.isPlaying.collectAsState()
    val currentTag by NativeAudioPlayerManager.currentTrackTag.collectAsState()
    val isAsmaaPlaying = isPlaying && currentTag == "asmaa_allah_al_husna"

    BackHandler {
        if (selectedName != null) {
            selectedName = null
        } else {
            onBack()
        }
    }

    val filtered = remember(searchQuery, category) {
        NAMES_OF_ALLAH_LIST.filter { item ->
            val q = searchQuery.trim()
            val matchQuery = q.isEmpty() || item.name.contains(q) || item.meaning.contains(q) || item.transliteration.contains(q, ignoreCase = true)
            if (!matchQuery) return@filter false
            when (category) {
                "mercy" -> item.meaning.contains("رحم") || item.meaning.contains("غفر") || item.meaning.contains("كرم") || item.meaning.contains("حب") || item.meaning.contains("توب")
                "power" -> item.meaning.contains("قدر") || item.meaning.contains("ملك") || item.meaning.contains("قو") || item.meaning.contains("عز") || item.meaning.contains("قهر")
                "wisdom" -> item.meaning.contains("علم") || item.meaning.contains("حكم") || item.meaning.contains("عدل") || item.meaning.contains("حق") || item.meaning.contains("نور")
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
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = {
                        if (selectedName != null) selectedName = null else onBack()
                    }
                ) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = MoazenInkEmerald)
                }
                Column {
                    Text(
                        text = selectedName?.let { "اسم الله: ${it.name}" } ?: "أسماء الله الحسنى (99)",
                        color = MoazenInkEmerald,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "﴿وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا﴾",
                        color = MoazenGoldDark,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            if (selectedName == null) {
                IconButton(onClick = { isGridView = !isGridView }) {
                    Icon(
                        imageVector = if (isGridView) Icons.Default.ViewList else Icons.Default.GridView,
                        contentDescription = "تبديل العرض",
                        tint = MoazenInkEmerald
                    )
                }
            }
        }

        // Offline Asmaa Allah Al-Husna Audio Card
        MoazenWidgetCard(
            cornerRadius = 16.dp,
            borderColor = MoazenGold,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(MoazenInkEmerald.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.MusicNote, contentDescription = null, tint = MoazenInkEmerald)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "تشغيل أسماء الله الحسنى (بدون إنترنت)",
                            color = MoazenInkEmerald,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (isAsmaaPlaying) "جارٍ الاستماع للتسجيل الصوتي الكامل..." else "أنشودة وتلاوة خاشعة للأسماء التسعة والتسعين",
                            color = MoazenInkMuted,
                            fontSize = 10.5.sp
                        )
                    }
                }
                Button(
                    onClick = {
                        if (isAsmaaPlaying) {
                            NativeAudioPlayerManager.stop()
                        } else {
                            NativeAudioPlayerManager.playAssetAudio(
                                context = context,
                                assetPath = "audio/asmaa_allah_al_husna.mp3",
                                title = "أسماء الله الحسنى (99)",
                                subtitle = "تشغيل محلي بدون إنترنت",
                                trackTag = "asmaa_allah_al_husna"
                            )
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isAsmaaPlaying) ErrorRed else MuslimPlusPillEmerald
                    ),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        imageVector = if (isAsmaaPlaying) Icons.Default.Stop else Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (isAsmaaPlaying) "إيقاف" else "تشغيل",
                        color = Color.White,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        if (selectedName != null) {
            val item = selectedName!!
            val idx = filtered.indexOfFirst { it.number == item.number }
            MoazenWidgetCard(
                cornerRadius = 20.dp,
                borderColor = MoazenGold,
                borderWidth = 1.5.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "الاسم رقم ${item.number} من 99",
                        color = MoazenGoldDark,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = item.name,
                        color = MoazenInkEmerald,
                        fontSize = 36.sp,
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = item.transliteration,
                        color = MoazenInkMuted,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    MoazenSubWidgetBox(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = item.meaning,
                            color = MoazenInkPrimary,
                            fontSize = 15.sp,
                            lineHeight = 24.sp,
                            fontWeight = FontWeight.SemiBold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(14.dp)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                                cm?.setPrimaryClip(ClipData.newPlainText("NameOfAllah", "【${item.name}】\n${item.meaning}"))
                                Toast.makeText(context, "تم نسخ الاسم والمعنى", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MoazenGold),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.ContentCopy, contentDescription = null, tint = MoazenInkPrimary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("نسخ", color = MoazenInkPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                        Button(
                            onClick = {
                                val text = "✦ من أسماء الله الحسنى (${item.number}/99) ✦\n\n【${item.name}】\n${item.meaning}\n\n🕌 عبر تطبيق مسلم بلس"
                                val share = Intent(Intent.ACTION_SEND).apply {
                                    putExtra(Intent.EXTRA_TEXT, text)
                                    type = "text/plain"
                                }
                                runCatching { context.startActivity(Intent.createChooser(share, "مشاركة الاسم")) }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Share, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("مشاركة", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    enabled = idx > 0,
                    onClick = { if (idx > 0) selectedName = filtered[idx - 1] },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("الاسم السابق", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    enabled = idx >= 0 && idx < filtered.size - 1,
                    onClick = { if (idx >= 0 && idx < filtered.size - 1) selectedName = filtered[idx + 1] },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("الاسم التالي", fontWeight = FontWeight.Bold)
                }
            }
        } else {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("ابحث في الأسماء أو المعاني...", fontSize = 12.sp) },
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
                val cats = listOf("all" to "الكل (99)", "mercy" to "الرحمة والمغفرة", "power" to "العظمة والقدرة", "wisdom" to "العلم والحكمة")
                cats.forEach { (id, label) ->
                    val active = category == id
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (active) MuslimPlusPillEmerald else MoazenCardStart,
                        border = BorderStroke(1.dp, if (active) MuslimPlusPillEmerald else MoazenCardBorder),
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { category = id }
                    ) {
                        Text(
                            text = label,
                            color = if (active) Color.White else MoazenInkPrimary,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 7.dp)
                        )
                    }
                }
            }

            if (isGridView) {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filtered, key = { it.number }) { item ->
                        MoazenWidgetCard(
                            cornerRadius = 14.dp,
                            onClick = { selectedName = item }
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "${item.number}",
                                    color = MoazenGoldDark,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = item.name,
                                    color = MoazenInkEmerald,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = item.meaning,
                                    color = MoazenInkMuted,
                                    fontSize = 9.sp,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filtered, key = { it.number }) { item ->
                        MoazenWidgetCard(
                            cornerRadius = 14.dp,
                            onClick = { selectedName = item },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(MuslimPlusPillEmerald),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "${item.number}",
                                        color = Color.White,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = item.name,
                                        color = MoazenInkEmerald,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                    Text(
                                        text = item.meaning,
                                        color = MoazenInkPrimary,
                                        fontSize = 11.5.sp,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                Icon(Icons.Default.ChevronLeft, contentDescription = null, tint = MoazenGoldDark)
                            }
                        }
                    }
                }
            }
        }
    }
}
