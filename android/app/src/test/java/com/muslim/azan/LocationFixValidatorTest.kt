package com.muslim.azan.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LocationFixValidatorTest {

    @Test
    fun areCoordinatesValid_rejectsZeroZeroNaNAndOutOfBounds() {
        assertFalse(LocationFixValidator.areCoordinatesValid(0.0, 0.0))
        assertFalse(LocationFixValidator.areCoordinatesValid(Double.NaN, 31.2))
        assertFalse(LocationFixValidator.areCoordinatesValid(95.0, 31.2))
        assertFalse(LocationFixValidator.areCoordinatesValid(30.0, -195.0))
        assertTrue(LocationFixValidator.areCoordinatesValid(21.4225, 39.8262))
    }

    @Test
    fun validateCandidate_rejectsStaleAndOverlyCoarseFixes() {
        val now = 1_700_000_000_000L

        val stale = LocationCandidate(21.4225, 39.8262, 20f, now - 30 * 60_000L, "gps")
        assertFalse(LocationFixValidator.validateCandidate(stale, now, fineLocationGranted = true).isValid)

        val terribleAccuracy = LocationCandidate(21.4225, 39.8262, 5_000f, now - 5_000L, "network")
        assertFalse(LocationFixValidator.validateCandidate(terribleAccuracy, now, fineLocationGranted = true).isValid)

        val goodFine = LocationCandidate(21.4225, 39.8262, 18f, now - 5_000L, "gps")
        val outcome = LocationFixValidator.validateCandidate(goodFine, now, fineLocationGranted = true)
        assertTrue(outcome.isValid)
        assertEquals(LocationPrecision.PRECISE, outcome.precision)
    }

    @Test
    fun classifyPrecision_marksCoarsePermissionAsApproximateEvenForGoodProvider() {
        val p = LocationFixValidator.classifyPrecision(
            fineLocationGranted = false,
            provider = "gps",
            accuracyMeters = 25f
        )
        assertEquals(LocationPrecision.APPROXIMATE, p)
    }

    @Test
    fun selectBestCandidate_prefersPreciseAndFreshOverStaleCoarse() {
        val now = 1_700_000_000_000L
        val coarseNetwork = LocationCandidate(30.0444, 31.2357, 600f, now - 5_000L, "network")
        val preciseGps = LocationCandidate(30.0445, 31.2358, 12f, now - 8_000L, "gps")

        val chosen = LocationFixValidator.selectBestCandidate(
            candidates = listOf(coarseNetwork, preciseGps),
            nowMs = now,
            fineLocationGranted = true
        )
        assertNotNull(chosen)
        assertEquals("gps", chosen!!.first.provider)
        assertEquals(LocationPrecision.PRECISE, chosen.second.precision)

        assertNull(
            LocationFixValidator.selectBestCandidate(
                candidates = listOf(LocationCandidate(0.0, 0.0, 5f, now, "gps")),
                nowMs = now,
                fineLocationGranted = true
            )
        )
    }
}
