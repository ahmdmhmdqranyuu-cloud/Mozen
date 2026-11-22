package com.muslim.azan.service

import android.media.AudioManager
import com.muslim.azan.AzkarAudioService
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AzanAudioPolicyAndAssetsTest {

    private val packagedAudioAssets = setOf(
        "makkah.mp3",
        "madinah.mp3",
        "ibrahim_madani.mp3",
        "abdulbasit_fajr.mp3",
        "iqama_1.mp3",
        "iqama_2.mp3",
        "iqama_3.mp3",
        "pre_prayer_15m.mp3",
        "azkar_sabah.mp3",
        "azkar_massa.mp3",
        "salawat_1.mp3",
        "salawat_2.mp3",
        "salawat_3.mp3",
        "musaharati_1.mp3",
        "iftar_cannon.mp3",
        "qiyam_first_third.mp3",
        "asmaa_allah_al_husna.mp3",
        "ruqyah_shariah.mp3"
    )

    @Test
    fun resolveAudioCandidate_mapsAzkarSalawatPrePrayerIqamaAndAzanTracksCleanly() {
        assertEquals("azkar_sabah.mp3", AzanAudioPolicy.resolveAudioCandidate("azkar_morning", "morningAzkar", packagedAudioAssets).resolvedFileName)
        assertEquals("azkar_sabah.mp3", AzanAudioPolicy.resolveAudioCandidate(null, "morningAzkar", packagedAudioAssets).resolvedFileName)
        assertEquals("azkar_massa.mp3", AzanAudioPolicy.resolveAudioCandidate("azkar_evening", "eveningAzkar", packagedAudioAssets).resolvedFileName)
        assertEquals("azkar_massa.mp3", AzanAudioPolicy.resolveAudioCandidate(null, "eveningAzkar", packagedAudioAssets).resolvedFileName)
        assertEquals("salawat_1.mp3", AzanAudioPolicy.resolveAudioCandidate("salawat_1", "salawat", packagedAudioAssets).resolvedFileName)
        assertEquals("salawat_2.mp3", AzanAudioPolicy.resolveAudioCandidate("salawat_2", "salawat", packagedAudioAssets).resolvedFileName)
        assertEquals("salawat_3.mp3", AzanAudioPolicy.resolveAudioCandidate("salawat_3", "salawat", packagedAudioAssets).resolvedFileName)
        assertEquals("pre_prayer_15m.mp3", AzanAudioPolicy.resolveAudioCandidate(null, "prePrayerAlert", packagedAudioAssets).resolvedFileName)
        assertEquals("iqama_1.mp3", AzanAudioPolicy.resolveAudioCandidate(null, "iqama", packagedAudioAssets).resolvedFileName)
        assertEquals("iqama_2.mp3", AzanAudioPolicy.resolveAudioCandidate("iqama_2", "iqama", packagedAudioAssets).resolvedFileName)
        assertEquals("makkah.mp3", AzanAudioPolicy.resolveAudioCandidate(null, "prayer_azan", packagedAudioAssets).resolvedFileName)
        assertEquals("ibrahim_madani.mp3", AzanAudioPolicy.resolveAudioCandidate("ibrahim_madani", "prayer_azan", packagedAudioAssets).resolvedFileName)
    }

    @Test
    fun resolveAudioCandidate_fallsBackToGuaranteedSectionTrackWhenRequestedTrackMissing() {
        val azanRes = AzanAudioPolicy.resolveAudioCandidate("missing_custom_azan", "prayer_azan", packagedAudioAssets)
        assertEquals("makkah.mp3", azanRes.resolvedFileName)
        assertTrue(azanRes.usedFallback)
        assertNotNull(azanRes.diagnosticNote)

        val iqamaRes = AzanAudioPolicy.resolveAudioCandidate("missing_iqama", "iqama", packagedAudioAssets)
        assertEquals("iqama_1.mp3", iqamaRes.resolvedFileName)
        assertTrue(iqamaRes.usedFallback)

        val sabahRes = AzanAudioPolicy.resolveAudioCandidate("missing_sabah", "morningAzkar", packagedAudioAssets)
        assertEquals("azkar_sabah.mp3", sabahRes.resolvedFileName)
        assertTrue(sabahRes.usedFallback)

        val massaRes = AzanAudioPolicy.resolveAudioCandidate("missing_massa", "eveningAzkar", packagedAudioAssets)
        assertEquals("azkar_massa.mp3", massaRes.resolvedFileName)
        assertTrue(massaRes.usedFallback)

        val salawatRes = AzanAudioPolicy.resolveAudioCandidate("missing_salawat", "salawat", packagedAudioAssets)
        assertEquals("salawat_1.mp3", salawatRes.resolvedFileName)
        assertTrue(salawatRes.usedFallback)

        val preRes = AzanAudioPolicy.resolveAudioCandidate("missing_pre", "prePrayerAlert", packagedAudioAssets)
        assertEquals("pre_prayer_15m.mp3", preRes.resolvedFileName)
        assertTrue(preRes.usedFallback)
    }

    @Test
    fun criticalAlarmsAndRemindersNeverAbortWhenAudioFocusIsDenied() {
        val sections = listOf(
            "prayer_azan",
            "iqama",
            "prePrayerAlert",
            "morningAzkar",
            "eveningAzkar",
            "salawat",
            "musaharati",
            "iftar"
        )
        sections.forEach { sec ->
            assertFalse(
                "Section $sec must never abort on AUDIOFOCUS_REQUEST_FAILED",
                AzanAudioPolicy.shouldAbortOnFocusDenied(sec, AudioManager.AUDIOFOCUS_REQUEST_FAILED)
            )
            assertFalse(
                "Section $sec must proceed when AUDIOFOCUS_REQUEST_DELAYED",
                AzanAudioPolicy.shouldAbortOnFocusDenied(sec, AudioManager.AUDIOFOCUS_REQUEST_DELAYED)
            )
        }
    }

    @Test
    fun volumeScaling_clampsCorrectlyWithoutSilencingLowNonZeroPercent() {
        assertEquals(0.0f, AzanAudioPolicy.computeScalarVolume(0), 0.001f)
        assertEquals(0.05f, AzanAudioPolicy.computeScalarVolume(1), 0.001f)
        assertEquals(0.85f, AzanAudioPolicy.computeScalarVolume(85), 0.001f)
        assertEquals(1.0f, AzanAudioPolicy.computeScalarVolume(100), 0.001f)
        assertEquals(1.0f, AzanAudioPolicy.computeScalarVolume(140), 0.001f)
    }

    @Test
    fun sectionPriorityAndQueuePolicy_protectsAzanAndDefersAzkarAndSalawat() {
        assertTrue(
            AzkarAudioService.getSectionPriority("prayer_azan") >
                AzkarAudioService.getSectionPriority("iqama")
        )
        assertTrue(
            AzkarAudioService.getSectionPriority("iqama") >
                AzkarAudioService.getSectionPriority("prePrayerAlert")
        )
        assertTrue(
            AzkarAudioService.getSectionPriority("morningAzkar") >
                AzkarAudioService.getSectionPriority("salawat")
        )
        assertTrue(AzkarAudioService.shouldQueueWhenBlocked("morningAzkar"))
        assertTrue(AzkarAudioService.shouldQueueWhenBlocked("eveningAzkar"))
        assertTrue(AzkarAudioService.shouldQueueWhenBlocked("salawat"))
        assertTrue(AzkarAudioService.shouldQueueWhenBlocked("prePrayerAlert"))
    }
}
