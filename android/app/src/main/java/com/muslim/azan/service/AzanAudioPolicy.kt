package com.muslim.azan.service

import android.media.AudioManager

/**
 * Pure JVM-testable audio policy covering:
 * - Audio track alias normalization and guaranteed section fallback resolution
 * - Non-abort policy for critical alarm/Azan audio when AudioFocus is denied
 * - Safe scalar volume normalization
 */
object AzanAudioPolicy {

    data class AudioResolution(
        val resolvedFileName: String,
        val usedFallback: Boolean,
        val diagnosticNote: String? = null
    )

    @JvmStatic
    fun defaultFallbackForSection(section: String?): String {
        return when (section) {
            "prayer_azan" -> "makkah.mp3"
            "iqama" -> "iqama_1.mp3"
            "prePrayerAlert" -> "pre_prayer_15m.mp3"
            "morningAzkar" -> "azkar_sabah.mp3"
            "eveningAzkar" -> "azkar_massa.mp3"
            "salawat" -> "salawat_1.mp3"
            "musaharati" -> "musaharati_1.mp3"
            "iftar" -> "iftar_cannon.mp3"
            "duha_prayer" -> "qiyam_first_third.mp3"
            "dua_after" -> "salawat_1.mp3"
            else -> "makkah.mp3"
        }
    }

    @JvmStatic
    fun normalizeRequestedTrackName(audioTrackId: String?): String? {
        val clean = audioTrackId?.trim().orEmpty()
        if (clean.isEmpty() || clean == "none") return null
        return when (clean) {
            "azkar_morning", "azkar_morning.mp3" -> "azkar_sabah.mp3"
            "azkar_evening", "azkar_evening.mp3" -> "azkar_massa.mp3"
            else -> if (clean.endsWith(".mp3") || clean.endsWith(".wav")) clean else "$clean.mp3"
        }
    }

    @JvmStatic
    fun resolveAudioCandidate(
        audioTrackId: String?,
        section: String?,
        availableAssets: Set<String>
    ): AudioResolution {
        val sectionFallback = defaultFallbackForSection(section)
        val normalized = normalizeRequestedTrackName(audioTrackId)

        if (normalized != null) {
            if (normalized in availableAssets) {
                return AudioResolution(normalized, usedFallback = false, diagnosticNote = null)
            }
            if (normalized == "ibrahim_madani.mp3" && "madinah.mp3" in availableAssets) {
                return AudioResolution(
                    resolvedFileName = "madinah.mp3",
                    usedFallback = true,
                    diagnosticNote = "تم التحويل للصوت البديل (madinah.mp3) لعدم توفر $normalized"
                )
            }
            if (normalized == "duha_surah.mp3" && "qiyam_first_third.mp3" in availableAssets) {
                return AudioResolution(
                    resolvedFileName = "qiyam_first_third.mp3",
                    usedFallback = true,
                    diagnosticNote = "تم التحويل للصوت البديل لصلاة الضحى (qiyam_first_third.mp3)"
                )
            }
            if (normalized == "dua_after_azan.mp3" && "salawat_1.mp3" in availableAssets) {
                return AudioResolution(
                    resolvedFileName = "salawat_1.mp3",
                    usedFallback = true,
                    diagnosticNote = "تم التحويل لصوت الذكر الافتراضي (salawat_1.mp3)"
                )
            }
            val effectiveFallback = if (sectionFallback in availableAssets) sectionFallback else "makkah.mp3"
            return AudioResolution(
                resolvedFileName = effectiveFallback,
                usedFallback = true,
                diagnosticNote = "تعذر العثور على ($normalized) — تم استخدام البديل ($effectiveFallback)"
            )
        }

        val resolvedDefault = if (sectionFallback in availableAssets) sectionFallback else "makkah.mp3"
        return AudioResolution(
            resolvedFileName = resolvedDefault,
            usedFallback = resolvedDefault != sectionFallback,
            diagnosticNote = if (resolvedDefault != sectionFallback) {
                "تم التحويل للافتراضي العام ($resolvedDefault)"
            } else {
                null
            }
        )
    }

    /**
     * Critical alarm/Azan/Iqama/Azkar/Salawat/Ramadan alerts played with AudioAttributes.USAGE_ALARM
     * must NEVER be aborted silently when requestAudioFocus returns AUDIOFOCUS_REQUEST_FAILED.
     */
    @JvmStatic
    fun shouldAbortOnFocusDenied(section: String?, focusResult: Int): Boolean {
        if (focusResult == AudioManager.AUDIOFOCUS_REQUEST_GRANTED ||
            focusResult == AudioManager.AUDIOFOCUS_REQUEST_DELAYED
        ) {
            return false
        }
        return when (section) {
            "prayer_azan",
            "iqama",
            "prePrayerAlert",
            "morningAzkar",
            "eveningAzkar",
            "salawat",
            "musaharati",
            "iftar",
            "duha_prayer",
            "dua_after" -> false
            else -> false
        }
    }

    @JvmStatic
    fun computeScalarVolume(volumePercent: Int): Float {
        return if (volumePercent <= 0) 0.0f
        else (volumePercent / 100.0f).coerceIn(0.05f, 1.0f)
    }
}
