package com.muslim.azan.service

/**
 * Pure JVM-testable policy determining whether hardware Volume Down presses
 * should silence active Azan / prayer alerts without interrupting Quran recitations.
 */
object VolumeKeyStopPolicy {
    private val azanAlertSections = setOf(
        "prayer_azan",
        "iqama",
        "prePrayerAlert",
        "iftar",
        "musaharati"
    )

    @JvmStatic
    fun isAzanOrPrayerAlertSection(section: String?): Boolean {
        return section != null && azanAlertSections.contains(section)
    }

    @JvmStatic
    fun shouldStopAzanOnVolumeDown(
        settingEnabled: Boolean,
        servicePlayingNow: Boolean,
        activeSection: String?
    ): Boolean {
        if (!settingEnabled || !servicePlayingNow) return false
        return isAzanOrPrayerAlertSection(activeSection)
    }
}
