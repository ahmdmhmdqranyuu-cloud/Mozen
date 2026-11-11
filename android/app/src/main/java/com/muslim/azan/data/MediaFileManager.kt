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
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

object MediaFileManager {
    private const val TAG = "MediaFileManager"
    private const val GALLERY_FOLDER = "AlMuadhin"

    fun getPermanentDir(context: Context, subFolder: String = "audio"): File {
        val dir = File(context.filesDir, "media/$subFolder")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun getCacheDir(context: Context, subFolder: String = "temp"): File {
        val dir = File(context.cacheDir, subFolder)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    suspend fun saveImageToGallery(
        context: Context,
        bytes: ByteArray,
        title: String
    ): Result<Uri> = withContext(Dispatchers.IO) {
        try {
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
                    ?: return@withContext Result.failure(Exception("Failed to create MediaStore entry"))

                resolver.openOutputStream(uri)?.use { out ->
                    out.write(bytes)
                    out.flush()
                }

                values.clear()
                values.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(uri, values, null, null)

                Result.success(uri)
            } else {
                val picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                val appDir = File(picturesDir, GALLERY_FOLDER)
                if (!appDir.exists()) appDir.mkdirs()
                val file = File(appDir, safeName)
                FileOutputStream(file).use { out ->
                    out.write(bytes)
                    out.flush()
                }
                val uri = Uri.fromFile(file)
                val scanIntent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE).apply {
                    data = uri
                }
                context.sendBroadcast(scanIntent)
                Result.success(uri)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save image to gallery", e)
            Result.failure(e)
        }
    }

    suspend fun downloadAudioWithResume(
        context: Context,
        audioUrl: String,
        fileName: String
    ): Result<File> = withContext(Dispatchers.IO) {
        val targetFile = File(getPermanentDir(context, "audio"), fileName)
        if (targetFile.exists() && targetFile.length() > 1024) {
            // Already downloaded and intact, prevent redundant network download
            return@withContext Result.success(targetFile)
        }

        val tempFile = File(getCacheDir(context, "downloads"), "$fileName.part")
        try {
            val url = URL(audioUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 15000
            connection.readTimeout = 20000

            val responseCode = connection.responseCode
            if (responseCode !in 200..299) {
                return@withContext Result.failure(Exception("HTTP Error: $responseCode"))
            }

            val inputStream: InputStream = connection.inputStream
            FileOutputStream(tempFile).use { output ->
                val buffer = ByteArray(8192)
                var bytesRead: Int
                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    output.write(buffer, 0, bytesRead)
                }
                output.flush()
            }

            if (tempFile.length() > 512) {
                if (targetFile.exists()) targetFile.delete()
                val renamed = tempFile.renameTo(targetFile)
                if (renamed) {
                    Result.success(targetFile)
                } else {
                    Result.failure(Exception("Failed to finalize downloaded file"))
                }
            } else {
                tempFile.delete()
                Result.failure(Exception("Downloaded file incomplete"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error downloading audio: $audioUrl", e)
            if (tempFile.exists()) tempFile.delete()
            Result.failure(e)
        }
    }

    fun cleanTemporaryCache(context: Context): Long {
        var freedBytes = 0L
        try {
            val cacheDir = context.cacheDir
            if (cacheDir.exists()) {
                cacheDir.walkBottomUp().forEach { file ->
                    if (file.isFile) {
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
