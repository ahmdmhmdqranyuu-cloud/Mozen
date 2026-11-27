package com.muslim.azan

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.espresso.Espresso
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.isRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.HashSet

/**
 * Espresso + Compose instrumentation test suite verifying:
 * 1. AlarmScheduler + AlarmScheduleTracker scheduling flow on a real Android Context,
 *    strictly enforcing that exact prayer_azan alarms are registered ONLY when exact alarm
 *    permission is granted and never silently downgraded to inexact alarms.
 * 2. PendingIntent creation and reconciliation on real Android runtime.
 * 3. Espresso launch verification + Compose navigation to Settings -> About and opening
 *    the hidden 7-tap Developer Diagnostics dialog.
 */
@RunWith(AndroidJUnit4::class)
class AlarmSchedulerEspressoTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    private lateinit var targetContext: Context
    private var previousScheduleJson: String? = null
    private var previousOutcomeJson: String? = null
    private val testTriggerTimes = mutableListOf<Pair<String, Long>>()

    @Before
    fun setUp() {
        targetContext = InstrumentationRegistry.getInstrumentation().targetContext
        val prefs = targetContext.getSharedPreferences(AlarmScheduleTracker.LEGACY_PREFS, Context.MODE_PRIVATE)
        val rtPrefs = targetContext.getSharedPreferences(AlarmScheduleTracker.RUNTIME_STATE_PREFS, Context.MODE_PRIVATE)
        previousScheduleJson = prefs.getString("active_schedule_json", null)
        previousOutcomeJson = rtPrefs.getString(AlarmScheduleTracker.KEY_SCHEDULE_SUMMARY, null)
    }

    @After
    fun tearDown() {
        val alarmManager = targetContext.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        testTriggerTimes.forEach { (section, triggerMs) ->
            val intent = Intent(targetContext, AzkarAlarmReceiver::class.java).apply {
                action = "com.muslim.azan.ACTION_TRIGGER_REMINDER"
                data = Uri.parse("almoazen://alarm/$section/$triggerMs")
            }
            val requestCode = "${section}_${triggerMs}".hashCode()
            val pi = PendingIntent.getBroadcast(
                targetContext,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pi != null) {
                alarmManager?.cancel(pi)
                pi.cancel()
            }
        }
        testTriggerTimes.clear()

        val prefs = targetContext.getSharedPreferences(AlarmScheduleTracker.LEGACY_PREFS, Context.MODE_PRIVATE)
        prefs.edit().apply {
            if (previousScheduleJson != null) putString("active_schedule_json", previousScheduleJson)
            else remove("active_schedule_json")
        }.apply()

        val rtPrefs = targetContext.getSharedPreferences(AlarmScheduleTracker.RUNTIME_STATE_PREFS, Context.MODE_PRIVATE)
        rtPrefs.edit().apply {
            if (previousOutcomeJson != null) putString(AlarmScheduleTracker.KEY_SCHEDULE_SUMMARY, previousOutcomeJson)
            else remove(AlarmScheduleTracker.KEY_SCHEDULE_SUMMARY)
        }.apply()
    }

    private fun buildCandidate(section: String, triggerEpochMs: Long, prayerName: String = "الظهر"): JSONObject {
        testTriggerTimes.add(section to triggerEpochMs)
        return JSONObject().apply {
            put("section", section)
            put("prayerKey", "dhuhr")
            put("prayerName", prayerName)
            put("cityName", "مكة المكرمة")
            put("triggerEpochMs", triggerEpochMs)
            put("audioTrackId", if (section == "prayer_azan") "makkah" else "azkar_sabah")
            put("alertMode", "full_azan")
            put("autoPlay", true)
        }
    }

    private fun findRegisteredAlarmPendingIntent(section: String, triggerEpochMs: Long): PendingIntent? {
        val intent = Intent(targetContext, AzkarAlarmReceiver::class.java).apply {
            action = "com.muslim.azan.ACTION_TRIGGER_REMINDER"
            data = Uri.parse("almoazen://alarm/$section/$triggerEpochMs")
        }
        val requestCode = "${section}_${triggerEpochMs}".hashCode()
        return PendingIntent.getBroadcast(
            targetContext,
            requestCode,
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
    }

    @Test
    fun espresso_mainActivityLaunches_andHiddenDeveloperDiagnosticsOpensOnSevenTaps() {
        // Verify Android root view hierarchy via Espresso
        Espresso.onView(isRoot()).check(matches(isDisplayed()))

        // Dismiss onboarding if shown on fresh test run
        val skipNodes = composeRule.onAllNodesWithText("تخطي والمتابعة للتطبيق", substring = true)
            .fetchSemanticsNodes()
        if (skipNodes.isNotEmpty()) {
            composeRule.onNodeWithText("تخطي والمتابعة للتطبيق", substring = true).performClick()
            composeRule.waitForIdle()
        }

        // Navigate to Settings tab via BottomNavBar
        val settingsTabArabic = composeRule.onAllNodesWithText("الإعدادات").fetchSemanticsNodes()
        if (settingsTabArabic.isNotEmpty()) {
            composeRule.onAllNodesWithText("الإعدادات")[0].performClick()
        } else {
            composeRule.onAllNodesWithText("Settings")[0].performClick()
        }
        composeRule.waitForIdle()

        // Open Section 9 (About App / حول التطبيق)
        val aboutNodesAr = composeRule.onAllNodesWithText("حول التطبيق", substring = true).fetchSemanticsNodes()
        if (aboutNodesAr.isNotEmpty()) {
            composeRule.onNodeWithText("حول التطبيق", substring = true).performClick()
        } else {
            composeRule.onNodeWithText("About Rafeeq Al-Muslim", substring = true).performClick()
        }
        composeRule.waitForIdle()

        // Tap version label 7 consecutive times to unlock hidden Developer Diagnostics UI
        val versionNode = composeRule.onNodeWithText("تطبيق رفيق المسلم (الإصدار 2.2.0)")
        repeat(7) {
            versionNode.performClick()
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithTag("developer_diagnostics_dialog").assertIsDisplayed()
        composeRule.onNodeWithText("1. AudioFocus & Playback State").assertIsDisplayed()
        composeRule.onNodeWithText("2. WakeLock & System Permissions").assertIsDisplayed()
        composeRule.onNodeWithText("3. AlarmScheduleTracker & Boot Recalculation").assertIsDisplayed()
    }

    @Test
    fun espresso_themeSwitcherAndPrayerTimesHijriWeatherWidgetsRender() {
        Espresso.onView(isRoot()).check(matches(isDisplayed()))

        val skipNodes = composeRule.onAllNodesWithText("تخطي والمتابعة للتطبيق", substring = true)
            .fetchSemanticsNodes()
        if (skipNodes.isNotEmpty()) {
            composeRule.onNodeWithText("تخطي والمتابعة للتطبيق", substring = true).performClick()
            composeRule.waitForIdle()
        }

        // Open Prayer Times tab -> verify Hijri/Gregorian date card & CityWeatherWidget
        val prayersTabAr = composeRule.onAllNodesWithText("الأوقات").fetchSemanticsNodes()
        if (prayersTabAr.isNotEmpty()) {
            composeRule.onAllNodesWithText("الأوقات")[0].performClick()
        } else {
            composeRule.onAllNodesWithText("Prayers")[0].performClick()
        }
        composeRule.waitForIdle()
        composeRule.onNodeWithTag("hijri_gregorian_date_card").assertIsDisplayed()
        composeRule.onNodeWithTag("city_weather_widget").assertIsDisplayed()

        // Open Settings -> Section 4 -> toggle Dark / Light / System themes
        val settingsTabAr = composeRule.onAllNodesWithText("الإعدادات").fetchSemanticsNodes()
        if (settingsTabAr.isNotEmpty()) {
            composeRule.onAllNodesWithText("الإعدادات")[0].performClick()
        } else {
            composeRule.onAllNodesWithText("Settings")[0].performClick()
        }
        composeRule.waitForIdle()

        val langNodesAr = composeRule.onAllNodesWithText("اللغة والمظهر", substring = true).fetchSemanticsNodes()
        if (langNodesAr.isNotEmpty()) {
            composeRule.onNodeWithText("اللغة والمظهر", substring = true).performClick()
        } else {
            composeRule.onNodeWithText("Language & Theme", substring = true).performClick()
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithTag("theme_mode_dark").performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithTag("theme_mode_light").performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithTag("theme_mode_system").performClick()
        composeRule.waitForIdle()
    }

    @Test
    fun alarmScheduler_rescheduleFromJson_registersExactPrayerAzanOnlyWhenPermissionGranted() {
        val alarmManager = targetContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val canExactOnDevice = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }

        val now = System.currentTimeMillis()
        val azanTriggerMs = now + 30 * 60_000L
        val azkarTriggerMs = now + 45 * 60_000L

        val schedule = JSONArray().apply {
            put(buildCandidate("prayer_azan", azanTriggerMs))
            put(buildCandidate("morningAzkar", azkarTriggerMs, ""))
        }

        val outcome = AlarmScheduler.rescheduleFromJson(targetContext, schedule.toString())
        assertNotNull(outcome)
        assertEquals(canExactOnDevice, outcome.exactPermissionGranted)

        val azanPi = findRegisteredAlarmPendingIntent("prayer_azan", azanTriggerMs)
        val azkarPi = findRegisteredAlarmPendingIntent("morningAzkar", azkarTriggerMs)

        if (canExactOnDevice) {
            assertEquals(2, outcome.scheduledCount)
            assertEquals(0, outcome.failedCount)
            assertEquals(0, outcome.inexactCount)
            assertTrue(outcome.alarmClockCount >= 1 || outcome.exactCount >= 1)
            assertNotNull("Expected PendingIntent for permitted exact prayer_azan alarm", azanPi)
            assertNotNull("Expected PendingIntent for morningAzkar alarm", azkarPi)
        } else {
            // Exact alarm permission denied on Android 12+: prayer_azan MUST fail, NOT register inexact
            assertTrue(outcome.failedCount >= 1)
            assertNull("Unpermitted prayer_azan must NOT register any PendingIntent", azanPi)
            // Non-prayer reminder falls back cleanly to inexact while idle
            assertEquals(1, outcome.inexactCount)
            assertNotNull("Non-Azan reminder should register inexact PendingIntent fallback", azkarPi)
        }
    }

    @Test
    fun alarmScheduleTracker_executeScheduleBatch_permissionGatedExactVsDeniedMatrix() {
        val now = System.currentTimeMillis()
        val azanMs = now + 120_000L
        val azkarMs = now + 240_000L
        val candidates = JSONArray().apply {
            put(buildCandidate("prayer_azan", azanMs))
            put(buildCandidate("morningAzkar", azkarMs, ""))
        }

        // Case A: Exact permission granted -> AlarmClock + ExactWhileIdle, 0 inexact
        val grantedExactCalls = HashSet<String>()
        val grantedInexactCalls = HashSet<String>()
        val grantedResult = AlarmScheduleTracker.executeScheduleBatch(
            candidates,
            now,
            50,
            true,
            Build.VERSION_CODES.UPSIDE_DOWN_CAKE,
            object : AlarmScheduleTracker.AlarmBackend {
                override fun scheduleAlarmClock(item: JSONObject, requestCode: Int, triggerEpochMs: Long) {
                    grantedExactCalls.add("AC_${item.optString("section")}_$triggerEpochMs")
                }

                override fun scheduleExactWhileIdle(item: JSONObject, requestCode: Int, triggerEpochMs: Long) {
                    grantedExactCalls.add("EXACT_${item.optString("section")}_$triggerEpochMs")
                }

                override fun scheduleExactLegacy(item: JSONObject, requestCode: Int, triggerEpochMs: Long) {}

                override fun scheduleInexactWhileIdle(item: JSONObject, requestCode: Int, triggerEpochMs: Long) {
                    grantedInexactCalls.add(item.optString("section"))
                }
            }
        )

        assertEquals(2, grantedResult.outcome.scheduledCount)
        assertEquals(0, grantedResult.outcome.failedCount)
        assertEquals(0, grantedResult.outcome.inexactCount)
        assertEquals(2, grantedExactCalls.size)
        assertTrue(grantedInexactCalls.isEmpty())

        // Case B: Exact permission denied -> prayer_azan blocked/FAILED, morningAzkar inexact fallback
        val deniedInexactCalls = HashSet<String>()
        val deniedResult = AlarmScheduleTracker.executeScheduleBatch(
            candidates,
            now,
            50,
            false,
            Build.VERSION_CODES.UPSIDE_DOWN_CAKE,
            object : AlarmScheduleTracker.AlarmBackend {
                override fun scheduleAlarmClock(item: JSONObject, requestCode: Int, triggerEpochMs: Long) {
                    throw SecurityException("Exact alarm denied")
                }

                override fun scheduleExactWhileIdle(item: JSONObject, requestCode: Int, triggerEpochMs: Long) {
                    throw SecurityException("Exact alarm denied")
                }

                override fun scheduleExactLegacy(item: JSONObject, requestCode: Int, triggerEpochMs: Long) {
                    throw SecurityException("Exact alarm denied")
                }

                override fun scheduleInexactWhileIdle(item: JSONObject, requestCode: Int, triggerEpochMs: Long) {
                    deniedInexactCalls.add(item.optString("section"))
                }
            }
        )

        assertEquals(1, deniedResult.outcome.failedCount)
        assertTrue(deniedResult.failedSections.contains("prayer_azan"))
        assertFalse(deniedResult.confirmedAlarmIds.contains("prayer_azan_$azanMs"))
        assertEquals(1, deniedResult.outcome.inexactCount)
        assertTrue(deniedInexactCalls.contains("morningAzkar"))
        assertFalse(deniedInexactCalls.contains("prayer_azan"))
    }
}
