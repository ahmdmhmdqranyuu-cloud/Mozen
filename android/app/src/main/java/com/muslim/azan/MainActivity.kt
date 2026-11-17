package com.muslim.azan

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.muslim.azan.data.NativePreferences
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

        // Autonomously reconcile any active silent-prayer window and refresh alarm schedules without blocking UI startup
        lifecycleScope.launch(Dispatchers.IO) {
            RingerRestoreCoordinator.reconcileOrRescheduleOnWake(applicationContext)
            BootReceiver.recalculateAndScheduleAll(applicationContext)
        }

        setContent {
            AlMoazenTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Home.route

                var showExitConfirmDialog by remember { mutableStateOf(false) }

                BackHandler(enabled = currentRoute == Screen.Home.route && !showExitConfirmDialog) {
                    showExitConfirmDialog = true
                }

                Scaffold(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MuslimPlusCanvasBrush),
                    containerColor = Color.Transparent,
                    contentWindowInsets = WindowInsets(0, 0, 0, 0),
                    bottomBar = {
                        Column(
                            modifier = Modifier
                                .background(Color.Transparent)
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
                    val isFullBleedTopRoute =
                        currentRoute == Screen.Home.route || currentRoute == Screen.Settings.route
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(bottom = innerPadding.calculateBottomPadding())
                            .then(if (isFullBleedTopRoute) Modifier else Modifier.statusBarsPadding())
                            .background(MuslimPlusCanvasBrush)
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
                                    },
                                    onOpenPrayerSettings = { prayerKey ->
                                        navController.navigate(Screen.PrayerSettings.routeFor(prayerKey))
                                    }
                                )
                            }
                            composable(Screen.PrayerTimes.route) {
                                PrayerTimesScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() },
                                    onOpenPrayerSettings = { prayerKey ->
                                        navController.navigate(Screen.PrayerSettings.routeFor(prayerKey))
                                    }
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
                                    prefs = prefs,
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
                            composable(
                                route = Screen.PrayerSettings.route,
                                arguments = listOf(navArgument("prayerKey") { type = NavType.StringType; defaultValue = "fajr" })
                            ) { backStackEntry ->
                                val prayerKey = backStackEntry.arguments?.getString("prayerKey") ?: "fajr"
                                PrayerSettingsScreen(
                                    prefs = prefs,
                                    initialPrayerKey = prayerKey,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                        }

                        if (showExitConfirmDialog) {
                            BackHandler(enabled = true) {
                                showExitConfirmDialog = false
                            }
                            AlertDialog(
                                onDismissRequest = { showExitConfirmDialog = false },
                                containerColor = MoazenCardEnd,
                                title = {
                                    Text(
                                        text = "الخروج من تطبيق مسلم بلس",
                                        color = MoazenInkEmerald,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                },
                                text = {
                                    Text(
                                        text = "هل تريد الخروج من تطبيق مسلم بلس؟ سيستمر أي صوت أو أذان مجدول في العمل وفق إعداداتك.",
                                        color = MoazenInkMuted,
                                        fontSize = 13.sp,
                                        lineHeight = 20.sp
                                    )
                                },
                                confirmButton = {
                                    Button(
                                        onClick = {
                                            showExitConfirmDialog = false
                                            finish()
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = MuslimPlusPillEmerald)
                                    ) {
                                        Text("نعم، خروج", color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                },
                                dismissButton = {
                                    TextButton(onClick = { showExitConfirmDialog = false }) {
                                        Text("البقاء في التطبيق", color = MoazenInkEmerald, fontWeight = FontWeight.Bold)
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        val status = SystemPermissionHelper.checkPermissions(this)
        prefs.canScheduleExactAlarms = status.exactAlarmsGranted
        prefs.isIgnoringBatteryOptimizations = status.batteryUnrestricted

        lifecycleScope.launch(Dispatchers.IO) {
            RingerRestoreCoordinator.reconcileOrRescheduleOnWake(applicationContext)
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
