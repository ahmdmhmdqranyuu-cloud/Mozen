package com.muslim.azan

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.data.PermissionMonitorNotifier
import com.muslim.azan.data.SystemPermissionHelper
import com.muslim.azan.service.VolumeKeyStopPolicy
import com.muslim.azan.theme.*
import com.muslim.azan.ui.components.BottomNavBar
import com.muslim.azan.ui.components.FloatingAudioBar
import com.muslim.azan.ui.navigation.Screen
import com.muslim.azan.ui.screens.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var prefs: NativePreferences
    private val pendingRouteState = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )
        super.onCreate(savedInstanceState)
        prefs = NativePreferences(this)
        pendingRouteState.value = intent?.getStringExtra("open_route")

        // Autonomously reconcile any active silent-prayer window, alarm schedules, and permission monitor notifications
        lifecycleScope.launch(Dispatchers.IO) {
            RingerRestoreCoordinator.reconcileOrRescheduleOnWake(applicationContext)
            BootReceiver.recalculateAndScheduleAll(applicationContext)
            if (prefs.onboardingCompleted) {
                PermissionMonitorNotifier.evaluateAndSyncNotifications(applicationContext, prefs.language)
            }
        }

        setContent {
            var appLanguage by remember { mutableStateOf(prefs.language) }
            val layoutDirection = if (appLanguage == "en") LayoutDirection.Ltr else LayoutDirection.Rtl
            AlMoazenTheme(layoutDirection = layoutDirection) {
                var showOnboarding by remember { mutableStateOf(!prefs.onboardingCompleted) }

                if (showOnboarding) {
                    OnboardingSetupScreen(
                        prefs = prefs,
                        onCompleted = {
                            prefs.onboardingCompleted = true
                            showOnboarding = false
                            lifecycleScope.launch(Dispatchers.IO) {
                                BootReceiver.recalculateAndScheduleAll(applicationContext)
                            }
                        }
                    )
                } else {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Home.route

                val pendingRoute = pendingRouteState.value
                LaunchedEffect(pendingRoute) {
                    if (pendingRoute == "prayer_times") {
                        navController.navigate(Screen.PrayerTimes.route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                        pendingRouteState.value = null
                    }
                }

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
                                language = appLanguage,
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
                    val reduceMotion = remember {
                        try {
                            Settings.Global.getFloat(
                                contentResolver,
                                Settings.Global.ANIMATOR_DURATION_SCALE,
                                1f
                            ) <= 0f
                        } catch (_: Exception) {
                            false
                        }
                    }
                    val dirFactor = if (layoutDirection == LayoutDirection.Rtl) -1 else 1
                    NavHost(
                        navController = navController,
                        startDestination = Screen.Home.route,
                        enterTransition = {
                            if (reduceMotion) EnterTransition.None else
                                fadeIn(animationSpec = tween(220, easing = FastOutSlowInEasing)) +
                                    slideInHorizontally(
                                        initialOffsetX = { (it * 0.08f * dirFactor).toInt() },
                                        animationSpec = tween(240, easing = FastOutSlowInEasing)
                                    )
                        },
                        exitTransition = {
                            if (reduceMotion) ExitTransition.None else
                                fadeOut(animationSpec = tween(170, easing = FastOutSlowInEasing)) +
                                    scaleOut(
                                        targetScale = 0.985f,
                                        animationSpec = tween(190, easing = FastOutSlowInEasing)
                                    )
                        },
                        popEnterTransition = {
                            if (reduceMotion) EnterTransition.None else
                                fadeIn(animationSpec = tween(210, easing = FastOutSlowInEasing)) +
                                    scaleIn(
                                        initialScale = 0.985f,
                                        animationSpec = tween(220, easing = FastOutSlowInEasing)
                                    )
                        },
                        popExitTransition = {
                            if (reduceMotion) ExitTransition.None else
                                fadeOut(animationSpec = tween(180, easing = FastOutSlowInEasing)) +
                                    slideOutHorizontally(
                                        targetOffsetX = { (it * 0.08f * dirFactor).toInt() },
                                        animationSpec = tween(210, easing = FastOutSlowInEasing)
                                    )
                        }
                    ) {
                            composable(Screen.Home.route) {
                                HomeScreen(
                                    prefs = prefs,
                                    language = appLanguage,
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
                                    language = appLanguage,
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
                                    prefs = prefs,
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
                                    prefs = prefs,
                                    language = appLanguage,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Wallpapers.route) {
                                WallpapersScreen(
                                    prefs = prefs,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.NamesOfAllah.route) {
                                NamesOfAllahScreen(
                                    language = appLanguage,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Ruqyah.route) {
                                RuqyahScreen(
                                    onBack = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.Masajid.route) {
                                MasajidScreen(
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
                                    onBack = { navController.popBackStack() },
                                    onReopenOnboarding = { showOnboarding = true },
                                    onLanguageChanged = { newLang -> appLanguage = newLang }
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
                                        text = if (appLanguage == "en") "Exit Muslim Plus" else "الخروج من تطبيق مسلم بلس",
                                        color = MoazenInkEmerald,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                },
                                text = {
                                    Text(
                                        text = if (appLanguage == "en")
                                            "Exit Muslim Plus? Scheduled Azan and background reminders will continue working as configured."
                                        else
                                            "هل تريد الخروج من تطبيق مسلم بلس؟ سيستمر أي صوت أو أذان مجدول في العمل وفق إعداداتك.",
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
                                        Text(
                                            if (appLanguage == "en") "Yes, Exit" else "نعم، خروج",
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                },
                                dismissButton = {
                                    TextButton(onClick = { showExitConfirmDialog = false }) {
                                        Text(
                                            if (appLanguage == "en") "Stay in App" else "البقاء في التطبيق",
                                            color = MoazenInkEmerald,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            )
                        }
                    }
                }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val targetRoute = intent.getStringExtra("open_route")
        if (!targetRoute.isNullOrBlank()) {
            pendingRouteState.value = targetRoute
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
            if (prefs.onboardingCompleted) {
                PermissionMonitorNotifier.evaluateAndSyncNotifications(applicationContext, prefs.language)
            }
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN &&
            VolumeKeyStopPolicy.shouldStopAzanOnVolumeDown(
                settingEnabled = prefs.volumeKeyStopsAzan,
                servicePlayingNow = AzkarAudioService.isPlayingNow,
                activeSection = AzkarAudioService.currentSection
            )
        ) {
            val stopIntent = Intent(this, AzkarAudioService::class.java).apply {
                action = AzkarAudioService.ACTION_MUTE_AUDIO_ONLY
            }
            startService(stopIntent)
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
