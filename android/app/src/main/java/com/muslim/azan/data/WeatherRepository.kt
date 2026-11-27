package com.muslim.azan.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import kotlin.math.roundToInt

data class CityWeatherCondition(
    val latitude: Double,
    val longitude: Double,
    val temperatureCelsius: Int,
    val apparentCelsius: Int,
    val humidityPercent: Int,
    val windSpeedKmh: Int,
    val weatherCode: Int,
    val isDay: Boolean,
    val conditionAr: String,
    val conditionEn: String,
    val fetchedAtMs: Long = System.currentTimeMillis()
)

object WeatherRepository {

    private const val CACHE_TTL_MS = 10 * 60 * 1000L
    private val cacheLock = Any()
    private val cache = HashMap<String, CityWeatherCondition>()

    fun getCached(latitude: Double, longitude: Double): CityWeatherCondition? {
        val key = cacheKey(latitude, longitude)
        synchronized(cacheLock) {
            val entry = cache[key] ?: return null
            if (System.currentTimeMillis() - entry.fetchedAtMs > CACHE_TTL_MS) {
                cache.remove(key)
                return null
            }
            return entry
        }
    }

    suspend fun fetchCurrentWeather(
        latitude: Double,
        longitude: Double,
        forceRefresh: Boolean = false
    ): Result<CityWeatherCondition> = withContext(Dispatchers.IO) {
        val key = cacheKey(latitude, longitude)
        if (!forceRefresh) {
            getCached(latitude, longitude)?.let { return@withContext Result.success(it) }
        }

        var conn: HttpURLConnection? = null
        try {
            val urlStr = String.format(
                Locale.US,
                "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto",
                latitude,
                longitude
            )
            conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
                connectTimeout = 6_000
                readTimeout = 6_000
                requestMethod = "GET"
                setRequestProperty("Accept", "application/json")
            }
            val status = conn.responseCode
            if (status !in 200..299) {
                return@withContext Result.failure(IllegalStateException("Weather HTTP $status"))
            }
            val rawJson = conn.inputStream.bufferedReader().use { it.readText() }
            val root = JSONObject(rawJson)
            val current = root.getJSONObject("current")
            val tempC = current.optDouble("temperature_2m", 0.0).roundToInt()
            val feelsC = current.optDouble("apparent_temperature", tempC.toDouble()).roundToInt()
            val humidity = current.optInt("relative_humidity_2m", 0)
            val wind = current.optDouble("wind_speed_10m", 0.0).roundToInt()
            val code = current.optInt("weather_code", 0)
            val isDay = current.optInt("is_day", 1) == 1
            val (condAr, condEn) = describeWmoCode(code, isDay)

            val parsed = CityWeatherCondition(
                latitude = latitude,
                longitude = longitude,
                temperatureCelsius = tempC,
                apparentCelsius = feelsC,
                humidityPercent = humidity,
                windSpeedKmh = wind,
                weatherCode = code,
                isDay = isDay,
                conditionAr = condAr,
                conditionEn = condEn,
                fetchedAtMs = System.currentTimeMillis()
            )
            synchronized(cacheLock) {
                cache[key] = parsed
            }
            Result.success(parsed)
        } catch (ex: Exception) {
            Result.failure(ex)
        } finally {
            runCatching { conn?.disconnect() }
        }
    }

    internal fun describeWmoCode(code: Int, isDay: Boolean): Pair<String, String> = when (code) {
        0 -> if (isDay) "سماء صافية" to "Clear Sky" else "ليلة صافية" to "Clear Night"
        1 -> "صافي غالباً" to "Mainly Clear"
        2 -> "غائم جزئياً" to "Partly Cloudy"
        3 -> "غائم كلياً" to "Overcast"
        45, 48 -> "ضباب" to "Foggy"
        51, 53, 55, 56, 57 -> "رذاذ خفيف" to "Drizzle"
        61, 63, 65, 66, 67 -> "أمطار" to "Rain"
        71, 73, 75, 77 -> "ثلوج" to "Snow"
        80, 81, 82 -> "زخات مطر" to "Rain Showers"
        85, 86 -> "زخات ثلجية" to "Snow Showers"
        95, 96, 99 -> "عواصف رعدية" to "Thunderstorm"
        else -> "معتدل" to "Fair"
    }

    private fun cacheKey(lat: Double, lng: Double): String =
        String.format(Locale.US, "%.2f,%.2f", lat, lng)
}
