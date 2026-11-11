package com.muslim.azan.service

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationManager
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.*

class NativeLocationAndCompassManager(private val context: Context) : SensorEventListener {
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

    private val _azimuthDegrees = MutableStateFlow(0f)
    val azimuthDegrees: StateFlow<Float> = _azimuthDegrees.asStateFlow()

    private val _qiblaBearingDegrees = MutableStateFlow(0f)
    val qiblaBearingDegrees: StateFlow<Float> = _qiblaBearingDegrees.asStateFlow()

    private var gravityValues = FloatArray(3)
    private var geomagneticValues = FloatArray(3)
    private var hasGravity = false
    private var hasGeomagnetic = false

    fun startCompass() {
        sensorManager?.let { sm ->
            val accel = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            val mag = sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
            if (accel != null && mag != null) {
                sm.registerListener(this, accel, SensorManager.SENSOR_DELAY_UI)
                sm.registerListener(this, mag, SensorManager.SENSOR_DELAY_UI)
            }
        }
    }

    fun stopCompass() {
        sensorManager?.unregisterListener(this)
        hasGravity = false
        hasGeomagnetic = false
    }

    fun updateKaabaBearing(userLat: Double, userLng: Double) {
        val kaabaLat = Math.toRadians(21.4225)
        val kaabaLng = Math.toRadians(39.8262)
        val userLatRad = Math.toRadians(userLat)
        val deltaLng = kaabaLng - Math.toRadians(userLng)

        val y = sin(deltaLng) * cos(kaabaLat)
        val x = cos(userLatRad) * sin(kaabaLat) - sin(userLatRad) * cos(kaabaLat) * cos(deltaLng)
        var bearing = Math.toDegrees(atan2(y, x)).toFloat()
        bearing = (bearing + 360f) % 360f

        _qiblaBearingDegrees.value = bearing
    }

    @SuppressLint("MissingPermission")
    fun fetchLastKnownLocation(): Pair<Double, Double>? {
        try {
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
            val providers = lm.getProviders(true)
            var bestLocation: Location? = null
            for (provider in providers) {
                val l = lm.getLastKnownLocation(provider) ?: continue
                if (bestLocation == null || l.accuracy < bestLocation.accuracy) {
                    bestLocation = l
                }
            }
            if (bestLocation != null) {
                return Pair(bestLocation.latitude, bestLocation.longitude)
            }
        } catch (e: Exception) {
            Log.w("LocationManager", "Could not get last known GPS location", e)
        }
        return null
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            System.arraycopy(event.values, 0, gravityValues, 0, 3)
            hasGravity = true
        } else if (event.sensor.type == Sensor.TYPE_MAGNETIC_FIELD) {
            System.arraycopy(event.values, 0, geomagneticValues, 0, 3)
            hasGeomagnetic = true
        }

        if (hasGravity && hasGeomagnetic) {
            val r = FloatArray(9)
            val i = FloatArray(9)
            if (SensorManager.getRotationMatrix(r, i, gravityValues, geomagneticValues)) {
                val orientation = FloatArray(3)
                SensorManager.getOrientation(r, orientation)
                var azimuth = Math.toDegrees(orientation[0].toDouble()).toFloat()
                azimuth = (azimuth + 360f) % 360f
                _azimuthDegrees.value = azimuth
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
