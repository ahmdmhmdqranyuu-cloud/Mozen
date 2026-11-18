package com.muslim.azan.service

import android.media.AudioManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AudioQueueAndFocusTest {

    @Test
    fun fifoQueue_preservesInsertionOrder_andDeduplicatesByKey() {
        val queue = FifoAudioQueue<String>(maxCapacity = 3)
        assertTrue(queue.enqueue("first", "track_1"))
        assertFalse(queue.enqueue("first", "track_1_dup"))
        assertTrue(queue.enqueue("second", "track_2"))
        assertTrue(queue.enqueue("third", "track_3"))

        assertEquals(3, queue.size())
        assertEquals("track_1", queue.pollNext())
        assertEquals("track_2", queue.pollNext())
        assertEquals("track_3", queue.pollNext())
        assertNull(queue.pollNext())
    }

    @Test
    fun fifoQueue_evictsOldestWhenOverCapacity() {
        val queue = FifoAudioQueue<String>(maxCapacity = 2)
        queue.enqueue("k1", "v1")
        queue.enqueue("k2", "v2")
        queue.enqueue("k3", "v3")

        assertEquals(listOf("v2", "v3"), queue.peekAll())
    }

    @Test
    fun audioFocusMachine_handlesTransientPauseAndResume_ducking_andPermanentLoss() {
        val machine = AudioFocusStateMachine()

        // Transient loss while playing pauses and marks resume flag
        assertEquals(
            AudioFocusStateMachine.FocusAction.PAUSE_TRANSIENT,
            machine.onFocusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT, currentlyPlaying = true)
        )
        assertTrue(machine.wasPausedByTransientFocus)

        // Gain restores playback when not blocked by higher priority Azan
        assertEquals(
            AudioFocusStateMachine.FocusAction.RESUME_AFTER_TRANSIENT,
            machine.onFocusChange(AudioManager.AUDIOFOCUS_GAIN, currentlyPlaying = false, blockedByHigherPriority = false)
        )
        assertFalse(machine.wasPausedByTransientFocus)

        // Transient loss while higher priority Azan active later does not auto-resume over Azan
        machine.onFocusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT, currentlyPlaying = true)
        assertEquals(
            AudioFocusStateMachine.FocusAction.RESTORE_VOLUME_ONLY,
            machine.onFocusChange(AudioManager.AUDIOFOCUS_GAIN, currentlyPlaying = false, blockedByHigherPriority = true)
        )

        // Ducking & restore
        assertEquals(
            AudioFocusStateMachine.FocusAction.DUCK_VOLUME,
            machine.onFocusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK, currentlyPlaying = true)
        )
        assertTrue(machine.isDucked)
        assertEquals(
            AudioFocusStateMachine.FocusAction.RESTORE_VOLUME_ONLY,
            machine.onFocusChange(AudioManager.AUDIOFOCUS_GAIN, currentlyPlaying = true)
        )
        assertFalse(machine.isDucked)

        // Permanent loss demands full stop
        assertEquals(
            AudioFocusStateMachine.FocusAction.STOP_PERMANENT,
            machine.onFocusChange(AudioManager.AUDIOFOCUS_LOSS, currentlyPlaying = true)
        )
    }
}
