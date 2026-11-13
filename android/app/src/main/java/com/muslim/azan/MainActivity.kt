package com.muslim.azan

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.lifecycleScope
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.SpecialPermissionsStatus
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.BottomNavBar
import com.muslim.azan.ui.components.FloatingAudioBar
import com.muslim.azan.ui.navigation.Screen
import com.muslim.azan.ui.screens.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var prefs: NativePreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )
        super.onCreate(savedInstanceState)
        prefs = NativePreferences(this)

        // Request standard runtime permissions (location & notifications on Android 13+)
        requestInitialPermissions()

        // Autonomously ensure the schedule is fresh on IO thread without blocking UI startup
        lifecycleScope.launch(Dispatchers.IO) {
            BootReceiver.recalculateAndScheduleAll(applicationContext)
        }

        setContent {
            AlMoazenTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Home.route

                var permissionTick by remember { mutableIntStateOf(0) }
                var sessionDismissed by remember { mutableStateOf(false) }

                val lifecycleOwner = androidx.compose.ui.platform.LocalLifecycleOwner.current
                DisposableEffect(lifecycleOwner) {
                    val observer = LifecycleEventObserver { _, event ->
                        if (event == Lifecycle.Event.ON_RESUME) {
                            permissionTick++
                        }
                    }
                    lifecycleOwner.lifecycle.addObserver(observer)
                    onDispose {
                        lifecycleOwner.lifecycle.removeObserver(observer)
                    }
                }

                val permStatus = remember(permissionTick) {
                    SystemPermissionHelper.checkPermissions(this@MainActivity)
                }

                val showSpecialPermDialog = !sessionDismissed &&
                    !prefs.suppressSpecialPermissionsPrompt &&
                    permStatus.missingBackgroundCount > 0

                Scaffold(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(EmeraldDeep),
                    containerColor = EmeraldDeep,
                    contentWindowInsets = WindowInsets.safeDrawing,
                    bottomBar = {
                        Column(
                            modifier = Modifier
                                .background(EmeraldDeep)
                                .navigationBarsPadding()
                        ) {
                            FloatingAudioBar()

                            BottomNavBar(
                                currentRoute = currentRoute,
                                onNavigate = { screen ->
                                    navController.navigate(screen.route) {
                                        popUpTo(Screen.Home.route) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            )
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                            .background(EmeraldDeep)
                    ) {
                        NavHost(
                            navController = navController,
                            startDestination = Screen.Home.route
                        ) {
                            composable(Screen.Home.route) {
                                HomeScreen(
                                    prefs = prefs,
                                    onNavigate = { screen ->
                                        navController.navigate(screen.route)
                                    }
                                )
                            }
                            composable(Screen.PrayerTimes.route) {
                                PrayerTimesScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Quran.route) {
                                QuranScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Azkar.route) {
                                AzkarScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Tasbih.route) {
                                TasbihScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Qibla.route) {
                                QiblaScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Hadith.route) {
                                HadithScreen(
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Duas.route) {
                                DuasScreen(
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Ramadan.route) {
                                RamadanScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Seerah.route) {
                                SeerahScreen(
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Prophets.route) {
                                ProphetsScreen(
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Zakat.route) {
                                ZakatScreen(
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Quiz.route) {
                                QuizScreen(
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Hajj.route) {
                                HajjScreen(
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Wallpapers.route) {
                                WallpapersScreen(
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Profile.route) {
                                ProfileScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Settings.route) {
                                SettingsScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                        }

                        if (showSpecialPermDialog) {
                            SpecialPermissionsPromptDialog(
                                status = permStatus,
                                onDismissForSession = { sessionDismissed = true },
                                onNeverAskAgain = {
                                    prefs.suppressSpecialPermissionsPrompt = true
                                    sessionDismissed = true
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun SpecialPermissionsPromptDialog(
        status: SpecialPermissionsStatus,
        onDismissForSession: () -> Unit,
        onNeverAskAgain: () -> Unit
    ) {
        AlertDialog(
            onDismissRequest = onDismissForSession,
            containerColor = EmeraldDeep,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = null,
                        tint = GoldAccent,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "أذونات الأذان في الخلفية",
                        color = GoldAccent,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "لتعمل مواعيد الأذان والأذكار والنافذة العائمة بدقة حتى عند إغلاق التطبيق أو قفل الشاشة، يُنصح بتفعيل الأذونات التالية:",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        lineHeight = 18.sp
                    )

                    SpecialPermActionRow(
                        icon = Icons.Default.NotificationsActive,
                        title = "إذن الإشعارات",
                        subtitle = "عرض إشعار الأذان وصوت التنبيه",
                        granted = status.notificationsGranted,
                        onGrant = { SystemPermissionHelper.openNotificationSettings(this@MainActivity) }
                    )

                    SpecialPermActionRow(
                        icon = Icons.Default.Alarm,
                        title = "المنبهات الدقيقة",
                        subtitle = "إطلاق الأذان في الدقيقة المحددة تمامًا",
                        granted = status.exactAlarmsGranted,
                        onGrant = { SystemPermissionHelper.openExactAlarmSettings(this@MainActivity) }
                    )

                    SpecialPermActionRow(
                        icon = Icons.Default.Layers,
                        title = "الظهور فوق التطبيقات",
                        subtitle = "إظهار نافذة الأذان العائمة فوق أي تطبيق",
                        granted = status.overlayGranted,
                        onGrant = { SystemPermissionHelper.openOverlaySettings(this@MainActivity) }
                    )

                    SpecialPermActionRow(
                        icon = Icons.Default.BatteryChargingFull,
                        title = "استثناء توفير البطارية",
                        subtitle = "منع النظام من إيقاف الأذان في الخلفية",
                        granted = status.batteryUnrestricted,
                        onGrant = { SystemPermissionHelper.openBatteryOptimizationSettings(this@MainActivity) }
                    )

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        SpecialPermActionRow(
                            icon = Icons.Default.LockOpen,
                            title = "الظهور على شاشة القفل",
                            subtitle = "تنبيه الأذان بملء الشاشة عند القفل",
                            granted = status.fullScreenIntentGranted,
                            onGrant = { SystemPermissionHelper.openFullScreenIntentSettings(this@MainActivity) }
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = onDismissForSession) {
                    Text("لاحقًا", color = GoldAccent, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = onNeverAskAgain) {
                    Text("عدم الإظهار مجددًا", color = TextSecondary, fontSize = 12.sp)
                }
            }
        )
    }

    @Composable
    private fun SpecialPermActionRow(
        icon: ImageVector,
        title: String,
        subtitle: String,
        granted: Boolean,
        onGrant: () -> Unit
    ) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = EmeraldSurface,
            border = BorderStroke(1.dp, if (granted) SuccessGreen.copy(alpha = 0.5f) else CardBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = if (granted) SuccessGreen else GoldAccent,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = title,
                            color = TextPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = subtitle,
                            color = TextSecondary,
                            fontSize = 11.sp,
                            lineHeight = 14.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                if (granted) {
                    Text(
                        text = "مفعّل ✓",
                        color = SuccessGreen,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                } else {
                    Button(
                        onClick = onGrant,
                        colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Text(
                            text = "تفعيل",
                            color = EmeraldDeep,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }

    private fun requestInitialPermissions() {
        val permissions = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
            permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), 100)
        }
    }

    override fun onResume() {
        super.onResume()
        val status = SystemPermissionHelper.checkPermissions(this)
        prefs.canScheduleExactAlarms = status.exactAlarmsGranted
        prefs.isIgnoringBatteryOptimizations = status.batteryUnrestricted

        lifecycleScope.launch(Dispatchers.IO) {
            BootReceiver.recalculateAndScheduleAll(applicationContext)
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            val stopIntent = Intent(this, AzkarAudioService::class.java).apply {
                action = AzkarAudioService.ACTION_MUTE_AUDIO_ONLY
            }
            startService(stopIntent)
            NativeAudioPlayerManager.stop()
        }
        return super.onKeyDown(keyCode, event)
    }
}
