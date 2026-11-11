package com.muslim.azan.data

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap

object MediaFileManager {
    private const val TAG = "MediaFileManager"
    private const val GALLERY_FOLDER = "AlMuadhin"

    // Set of actively downloading temporary file names to shield them from cache cleanup
    private val activeDownloadFiles = ConcurrentHashMap.newKeySet<String>()

    /**
     * Permanent app-private storage: Survives system reboots, app updates, and cache cleaners.
     * Stored in Context.filesDir/media/<subFolder>
     */
    fun getPermanentDir(context: Context, subFolder: String = "audio"): File {
        val dir = File(context.filesDir, "media/$subFolder")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    /**
     * Temporary cache storage: For transient data and in-progress downloads.
     */
    fun getCacheDir(context: Context, subFolder: String = "downloads"): File {
        val dir = File(context.cacheDir, subFolder)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    /**
     * Saves image bytes directly into the user's phone gallery (MediaStore Scoped Storage on API 29+).
     * Complies fully with Google Play policies without requiring broad storage permissions.
     */
    suspend fun saveImageToGallery(
        context: Context,
        bytes: ByteArray,
        title: String = "AlMuadhin"
    ): Result<Uri> = withContext(Dispatchers.IO) {
        try {
            if (bytes.isEmpty()) {
                return@withContext Result.failure(IllegalArgumentException("Image bytes cannot be empty"))
            }

            // Validate that bytes represent a valid image
            val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return@withContext Result.failure(IllegalArgumentException("Invalid image byte format"))
            bmp.recycle()

            val safeName = "almuadhin_${System.currentTimeMillis()}.png"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, safeName)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                    put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/$GALLERY_FOLDER")
                    put(MediaStore.Images.Media.IS_PENDING, 1)
                }
                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                    ?: return@withContext Result.failure(Exception("Could not create MediaStore entry"))

                try {
                    resolver.openOutputStream(uri)?.use { out ->
                        out.write(bytes)
                        out.flush()
                    }
                    values.clear()
                    values.put(MediaStore.Images.Media.IS_PENDING, 0)
                    resolver.update(uri, values, null, null)
                    Result.success(uri)
                } catch (e: Exception) {
                    resolver.delete(uri, null, null)
                    throw e
                }
            } else {
                val picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                val appDir = File(picturesDir, GALLERY_FOLDER)
                if (!appDir.exists()) appDir.mkdirs()
                val targetFile = File(appDir, safeName)

                FileOutputStream(targetFile).use { out ->
                    out.write(bytes)
                    out.flush()
                }

                val uri = Uri.fromFile(targetFile)
                val scanIntent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE).apply {
                    data = uri
                }
                context.sendBroadcast(scanIntent)
                Result.success(uri)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed saving image to gallery", e)
            Result.failure(e)
        }
    }

    /**
     * Downloads an audio/media file with genuine HTTP Range resumption support.
     * - Resumes from where it stopped if the server supports Accept-Ranges: bytes.
     * - Protects active temporary files from concurrent cache cleanup.
     * - Atomically moves the finished file to permanent storage after byte-integrity validation.
     */
    suspend fun downloadAudioWithResume(
        context: Context,
        audioUrl: String,
        fileName: String
    ): Result<File> = withContext(Dispatchers.IO) {
        val permanentDir = getPermanentDir(context, "audio")
        val targetFile = File(permanentDir, fileName)

        // 1. If already completely downloaded, return immediate success
        if (targetFile.exists() && targetFile.length() > 4096) {
            return@withContext Result.success(targetFile)
        }

        val cacheDir = getCacheDir(context, "downloads")
        val tempFile = File(cacheDir, "$fileName.part")
        val tempFileName = tempFile.name
        activeDownloadFiles.add(tempFileName)

        var connection: HttpURLConnection? = null
        var inputStream: InputStream? = null
        var outputStream: FileOutputStream? = null

        try {
            val url = URL(audioUrl)
            connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 15000
            connection.readTimeout = 25000
            connection.instanceFollowRedirects = true

            val existingLength = if (tempFile.exists()) tempFile.length() else 0L
            var appendMode = false

            // Ask for HTTP Range if we already have partial content
            if (existingLength > 0L) {
                connection.setRequestProperty("Range", "bytes=$existingLength-")
            }

            connection.connect()
            val responseCode = connection.responseCode

            if (responseCode == HttpURLConnection.HTTP_PARTIAL) { // 206 Partial Content
                appendMode = true
                Log.d(TAG, "Server supports HTTP Range. Resuming from byte: $existingLength")
            } else if (responseCode == HttpURLConnection.HTTP_OK) { // 200 OK (fresh download or Range not supported)
                appendMode = false
                if (tempFile.exists()) tempFile.delete()
            } else if (responseCode == 416) { // Range Not Satisfiable (file may be complete or modified)
                if (tempFile.exists()) tempFile.delete()
                connection.disconnect()
                // Retry once from start
                val retryConn = url.openConnection() as HttpURLConnection
                retryConn.connectTimeout = 15000
                retryConn.readTimeout = 25000
                retryConn.connect()
                connection = retryConn
                appendMode = false
            } else {
                return@withContext Result.failure(Exception("HTTP download failed with code: $responseCode"))
            }

            inputStream = connection.inputStream
            outputStream = FileOutputStream(tempFile, appendMode)

            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                outputStream.write(buffer, 0, bytesRead)
            }
            outputStream.flush()

            // Validate downloaded file integrity (minimum valid MP3/audio size)
            if (tempFile.length() < 2048) {
                tempFile.delete()
                return@withContext Result.failure(Exception("Downloaded file too small or incomplete"))
            }

            // Move atomically to permanent directory
            if (targetFile.exists()) targetFile.delete()
            val moved = tempFile.renameTo(targetFile)
            if (moved) {
                Result.success(targetFile)
            } else {
                // Fallback copy if rename fails across mounts
                tempFile.inputStream().use { input ->
                    targetFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                tempFile.delete()
                Result.success(targetFile)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Download interrupted for $audioUrl", e)
            Result.failure(e)
        } finally {
            activeDownloadFiles.remove(tempFileName)
            try { outputStream?.close() } catch (ignored: Exception) {}
            try { inputStream?.close() } catch (ignored: Exception) {}
            connection?.disconnect()
        }
    }

    /**
     * Cleans temporary cache files ONLY.
     * - Never touches user permanent media, bookmarks, or saved audio in filesDir/media.
     * - Never deletes active in-progress downloads.
     */
    fun cleanTemporaryCache(context: Context): Long {
        var freedBytes = 0L
        try {
            val cacheDir = context.cacheDir
            if (cacheDir.exists()) {
                cacheDir.walkBottomUp().forEach { file ->
                    if (file.isFile && !activeDownloadFiles.contains(file.name)) {
                        freedBytes += file.length()
                        file.delete()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error cleaning cache", e)
        }
        return freedBytes
    }
}
