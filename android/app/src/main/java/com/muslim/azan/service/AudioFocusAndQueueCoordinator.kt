package com.muslim.azan.service

import android.media.AudioManager

/**
 * Pure JVM-testable FIFO queue and AudioFocus state machine powering the unified audio system.
 */
class FifoAudioQueue<T>(private val maxCapacity: Int = 20) {
    private data class QueuedEntry<T>(val key: String, val payload: T)

    private val deque = ArrayDeque<QueuedEntry<T>>()
    private val lock = Any()

    fun enqueue(key: String, payload: T): Boolean = synchronized(lock) {
        if (deque.any { it.key == key }) {
            return@synchronized false
        }
        if (deque.size >= maxCapacity) {
            deque.removeFirst()
        }
        deque.addLast(QueuedEntry(key, payload))
        true
    }

    fun pollNext(): T? = synchronized(lock) {
        if (deque.isEmpty()) null else deque.removeFirst().payload
    }

    fun peekAll(): List<T> = synchronized(lock) {
        deque.map { it.payload }
    }

    fun size(): Int = synchronized(lock) { deque.size }

    fun clear() = synchronized(lock) {
        deque.clear()
    }
}

class AudioFocusStateMachine {
    enum class FocusAction {
        NONE,
        PAUSE_TRANSIENT,
        RESUME_AFTER_TRANSIENT,
        RESTORE_VOLUME_ONLY,
        DUCK_VOLUME,
        STOP_PERMANENT
    }

    var wasPausedByTransientFocus: Boolean = false
        private set
    var isDucked: Boolean = false
        private set

    fun onFocusChange(
        focusChange: Int,
        currentlyPlaying: Boolean,
        blockedByHigherPriority: Boolean = false
    ): FocusAction {
        return when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS -> {
                wasPausedByTransientFocus = false
                isDucked = false
                FocusAction.STOP_PERMANENT
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                isDucked = false
                if (currentlyPlaying) {
                    wasPausedByTransientFocus = true
                    FocusAction.PAUSE_TRANSIENT
                } else {
                    FocusAction.NONE
                }
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                isDucked = true
                FocusAction.DUCK_VOLUME
            }
            AudioManager.AUDIOFOCUS_GAIN -> {
                val shouldResume = wasPausedByTransientFocus && !blockedByHigherPriority
                val wasDucked = isDucked
                wasPausedByTransientFocus = false
                isDucked = false
                when {
                    shouldResume -> FocusAction.RESUME_AFTER_TRANSIENT
                    wasDucked -> FocusAction.RESTORE_VOLUME_ONLY
                    else -> FocusAction.RESTORE_VOLUME_ONLY
                }
            }
            else -> FocusAction.NONE
        }
    }

    fun reset() {
        wasPausedByTransientFocus = false
        isDucked = false
    }
}
