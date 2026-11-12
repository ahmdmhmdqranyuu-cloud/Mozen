package com.muslim.azan

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.muslim.azan.data.NativePreferences
import com.muslim.azan.service.NativeAudioPlayerManager
import com.muslim.azan.theme.AlMoazenTheme
import com.muslim.azan.theme.EmeraldDeep
import com.muslim.azan.ui.components.BottomNavBar
import com.muslim.azan.ui.components.FloatingAudioBar
import com.muslim.azan.ui.navigation.Screen
import com.muslim.azan.ui.screens.*

class MainActivity : ComponentActivity() {

    private lateinit var prefs: NativePreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        prefs = NativePreferences(this)

        // Request runtime permissions gracefully on start
        requestInitialPermissions()

        // Autonomously ensure the 7-day schedule is fresh and up-to-date
        BootReceiver.recalculateAndScheduleAll(this)

        setContent {
            AlMoazenTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Home.route

                Scaffold(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(EmeraldDeep),
                    contentWindowInsets = WindowInsets.safeDrawing,
                    bottomBar = {
                        Column {
                            // Persistent Floating Audio bar for Quran & Azkar
                            FloatingAudioBar()

                            // Bottom Navigation Bar
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
                    }
                }
            }
        }
    }

    private fun requestInitialPermissions() {
        val permissions = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
            permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), 100)
        }
    }

    override fun onResume() {
        super.onResume()
        // Autonomously ensure the 7-day schedule is rolling and up-to-date
        BootReceiver.recalculateAndScheduleAll(this)
        checkBackgroundCapabilities()
    }

    private fun checkBackgroundCapabilities() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = getSystemService(android.app.AlarmManager::class.java)
            val canScheduleExact = alarmManager?.canScheduleExactAlarms() ?: true
            prefs.canScheduleExactAlarms = canScheduleExact
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = getSystemService(android.os.PowerManager::class.java)
            val isIgnoringBattery = powerManager?.isIgnoringBatteryOptimizations(packageName) ?: true
            prefs.isIgnoringBatteryOptimizations = isIgnoringBattery
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
