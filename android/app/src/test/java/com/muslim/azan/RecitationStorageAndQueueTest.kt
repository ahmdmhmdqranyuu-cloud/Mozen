package com.muslim.azan.service

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RecitationStorageAndQueueTest {

    private fun makeRecord(id: String, sizeBytes: Long, status: String) = StoredRecitationRecord(
        id = id,
        fileName = "$id.wav",
        mimeType = "audio/wav",
        sizeBytes = sizeBytes,
        durationMs = 4_000L,
        createdAtMs = 1_700_000_000_000L,
        expectedText = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        surahName = "الفاتحة",
        surahNumber = 1,
        ayahNumber = 1,
        dialect = "egyptian",
        mode = "recitation",
        trainingMode = false,
        adjacentAyahsText = "",
        analysisSpeed = "balanced",
        unitType = "ayah",
        pageNumber = 1,
        status = status
    )

    @Test
    fun capPcmChunkToWrite_enforcesHardRecordingLimit_preventingOOM() {
        val max = 1_000
        assertEquals(256, RecitationStorageManager.capPcmChunkToWrite(256, 500, max))
        assertEquals(100, RecitationStorageManager.capPcmChunkToWrite(256, 900, max))
        assertEquals(0, RecitationStorageManager.capPcmChunkToWrite(256, 1_000, max))
        assertEquals(0, RecitationStorageManager.capPcmChunkToWrite(256, 1_500, max))
    }

    @Test
    fun pruneRecordsForQuota_evictsCompletedBeforePendingUploads() {
        val pendingNewest = makeRecord("pending_1", 500, RecitationStorageManager.STATUS_PENDING_UPLOAD)
        val completedOld = makeRecord("completed_old", 500, RecitationStorageManager.STATUS_COMPLETED)
        val failedMid = makeRecord("failed_mid", 500, RecitationStorageManager.STATUS_FAILED)

        val (kept, evicted) = RecitationStorageManager.pruneRecordsForQuota(
            records = listOf(pendingNewest, failedMid, completedOld),
            maxCount = 2,
            maxTotalBytes = 1_200
        )

        assertEquals(1, evicted.size)
        assertEquals("completed_old", evicted[0].id)
        assertEquals(2, kept.size)
        assertTrue(kept.any { it.id == "pending_1" })
    }

    @Test
    fun serializeAndParseRecordsJson_roundTripsCleanly() {
        val original = listOf(
            makeRecord("r1", 2048, RecitationStorageManager.STATUS_PENDING_UPLOAD),
            makeRecord("r2", 4096, RecitationStorageManager.STATUS_COMPLETED)
        )
        val json = RecitationStorageManager.serializeRecordsJson(original)
        val parsed = RecitationStorageManager.parseRecordsJson(json)

        assertEquals(2, parsed.size)
        assertEquals("r1", parsed[0].id)
        assertEquals(RecitationStorageManager.STATUS_PENDING_UPLOAD, parsed[0].status)
        assertEquals("r2", parsed[1].id)
        assertEquals(4096L, parsed[1].sizeBytes)
    }
}
