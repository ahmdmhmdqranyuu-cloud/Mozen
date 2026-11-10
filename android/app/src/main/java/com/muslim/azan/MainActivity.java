package com.muslim.azan;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.KeyguardManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.io.InputStream;
import java.net.URLConnection;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private static final int REQ_LOCATION = 201;
    private static final int REQ_NOTIFICATIONS = 202;
    private static final String IQAMA_ONGOING_CHANNEL_ID = "smart_iqama_ongoing_channel";
    private static final int IQAMA_ONGOING_NOTIF_ID = 9901;
    private static final String PERSISTENT_PRAYER_CHANNEL_ID = "persistent_prayer_shade_channel";
    private static final int PERSISTENT_PRAYER_NOTIF_ID = 9905;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        applyLockScreenAndWakeFlags();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setDatabaseEnabled(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && "appassets.androidplatform.net".equals(uri.getHost())) {
                    String path = uri.getPath();
                    if (path == null || path.isEmpty() || "/".equals(path)) {
                        path = "/index.html";
                    }
                    String assetPath = "dist" + path;
                    try {
                        InputStream is = getAssets().open(assetPath);
                        String mimeType = getMimeTypeForAsset(assetPath);
                        WebResourceResponse response = new WebResourceResponse(mimeType, "UTF-8", is);
                        Map<String, String> headers = new HashMap<>();
                        headers.put("Access-Control-Allow-Origin", "*");
                        response.setResponseHeaders(headers);
                        return response;
                    } catch (Exception ignored) {
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                handleIncomingOverlayIntent(getIntent());
            }
        });

        // JavaScript interface exposed to the React App
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

        webView.loadUrl("https://appassets.androidplatform.net/index.html");
    }

    private String getMimeTypeForAsset(String assetPath) {
        String lower = assetPath.toLowerCase();
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ttf")) return "font/ttf";
        String guessed = URLConnection.guessContentTypeFromName(assetPath);
        return guessed != null ? guessed : "application/octet-stream";
    }

    private void applyLockScreenAndWakeFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(false);
            setTurnScreenOn(false);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingOverlayIntent(intent);
    }

    private void handleIncomingOverlayIntent(Intent intent) {
        if (intent == null || webView == null) return;
        String targetSection = intent.getStringExtra("open_section");
        if (targetSection != null && !targetSection.isEmpty()) {
            intent.removeExtra("open_section");
            final String safeTarget = targetSection.replace("'", "");
            webView.post(() -> webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('nativeFloatingAzanAction', { detail: { target: '" + safeTarget + "' } }));",
                    null
            ));
        } else {
            webView.post(() -> webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('MOAZEN_NAVIGATE_HOME'));",
                    null
            ));
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            Intent stopIntent = new Intent(this, AzkarAudioService.class);
            stopIntent.setAction(AzkarAudioService.ACTION_MUTE_AUDIO_ONLY);
            startService(stopIntent);
            if (webView != null) {
                webView.post(() -> webView.evaluateJavascript(
                        "window.dispatchEvent(new Event('volumeDownPressed'));",
                        null
                ));
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.post(() -> webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('androidPermissionsResume'));",
                    null
            ));
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (webView != null) {
            webView.post(() -> webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('androidPermissionsResume'));",
                    null
            ));
        }
    }

    public class WebAppInterface {
        private final AppCompatActivity activity;

        public WebAppInterface(AppCompatActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void scheduleAlarm(String jsonString) {
            AlarmScheduler.rescheduleFromJson(activity, jsonString);
        }

        @JavascriptInterface
        public void syncAzanDisplayConfig(String jsonString) {
            try {
                JSONObject obj = new JSONObject(jsonString);
                SharedPreferences prefs = activity.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
                prefs.edit()
                        .putBoolean("floatingAzanWindowEnabled", obj.optBoolean("floatingAzanWindowEnabled", false))
                        .putBoolean("lockScreenAzanEnabled", obj.optBoolean("lockScreenAzanEnabled", false))
                        .putBoolean("wakeScreenOnAzanEnabled", obj.optBoolean("wakeScreenOnAzanEnabled", false))
                        .putBoolean("azanSoundEnabled", obj.optBoolean("azanSoundEnabled", true))
                        .apply();
                activity.runOnUiThread(MainActivity.this::applyLockScreenAndWakeFlags);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void syncNativePrayerConfig(String jsonString) {
            try {
                JSONObject obj = new JSONObject(jsonString);
                SharedPreferences prefs = activity.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
                SharedPreferences.Editor editor = prefs.edit();

                if (obj.has("city_latitude")) editor.putString("city_latitude", String.valueOf(obj.optDouble("city_latitude", 21.4225)));
                if (obj.has("city_longitude")) editor.putString("city_longitude", String.valueOf(obj.optDouble("city_longitude", 39.8262)));
                if (obj.has("city_name")) editor.putString("city_name", obj.optString("city_name", "مكة المكرمة"));
                if (obj.has("calc_method")) editor.putString("calc_method", obj.optString("calc_method", "umm_al_qura"));
                if (obj.has("asr_method")) editor.putString("asr_method", obj.optString("asr_method", "standard"));
                if (obj.has("azan_voice")) editor.putString("azan_voice", obj.optString("azan_voice", "makkah"));
                if (obj.has("fajr_voice")) editor.putString("fajr_voice", obj.optString("fajr_voice", "abdulbasit_fajr"));
                if (obj.has("azanSoundEnabled")) editor.putBoolean("azanSoundEnabled", obj.optBoolean("azanSoundEnabled", true));
                if (obj.has("pre_prayer_alert_enabled")) editor.putBoolean("pre_prayer_alert_enabled", obj.optBoolean("pre_prayer_alert_enabled", true));

                // Salawat parameters
                if (obj.has("salawat_enabled")) editor.putBoolean("salawat_enabled", obj.optBoolean("salawat_enabled", true));
                if (obj.has("salawat_time")) editor.putString("salawat_time", obj.optString("salawat_time", "08:00"));
                if (obj.has("salawat_repeat_type")) editor.putString("salawat_repeat_type", obj.optString("salawat_repeat_type", "repeat"));
                if (obj.has("salawat_repeat_interval")) editor.putInt("salawat_repeat_interval", obj.optInt("salawat_repeat_interval", 15));
                if (obj.has("salawat_repeat_unit")) editor.putString("salawat_repeat_unit", obj.optString("salawat_repeat_unit", "minutes"));
                if (obj.has("salawat_audio")) editor.putString("salawat_audio", obj.optString("salawat_audio", "salawat_1"));

                // Morning / Evening Azkar parameters
                if (obj.has("morning_azkar_enabled")) editor.putBoolean("morning_azkar_enabled", obj.optBoolean("morning_azkar_enabled", true));
                if (obj.has("morning_azkar_time")) editor.putString("morning_azkar_time", obj.optString("morning_azkar_time", "06:30"));
                if (obj.has("morning_azkar_audio")) editor.putString("morning_azkar_audio", obj.optString("morning_azkar_audio", "azkar_sabah"));
                if (obj.has("evening_azkar_enabled")) editor.putBoolean("evening_azkar_enabled", obj.optBoolean("evening_azkar_enabled", true));
                if (obj.has("evening_azkar_time")) editor.putString("evening_azkar_time", obj.optString("evening_azkar_time", "17:00"));
                if (obj.has("evening_azkar_audio")) editor.putString("evening_azkar_audio", obj.optString("evening_azkar_audio", "azkar_massa"));

                // Ramadan / Musaharati
                if (obj.has("musaharati_enabled")) editor.putBoolean("musaharati_enabled", obj.optBoolean("musaharati_enabled", false));
                if (obj.has("musaharati_time")) editor.putString("musaharati_time", obj.optString("musaharati_time", "03:30"));
                if (obj.has("musaharati_audio")) editor.putString("musaharati_audio", obj.optString("musaharati_audio", "musaharati_1"));

                editor.apply();

                // Autonomously recalculate full 7-day schedule with newly applied settings
                BootReceiver.recalculateAndScheduleAll(activity);
            } catch (Exception e) {
                Log.e("MainActivity", "Failed syncing native prayer config", e);
            }
        }

        @JavascriptInterface
        public void showFloatingAzanOverlay(String prayerName, String cityName, int iqamaMinutes) {
            SharedPreferences prefs = activity.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
            if (!prefs.getBoolean("floatingAzanWindowEnabled", true)) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(activity)) return;

            Intent serviceIntent = new Intent(activity, AzkarAudioService.class);
            serviceIntent.setAction(AzkarAudioService.ACTION_SHOW_OVERLAY_ONLY);
            serviceIntent.putExtra("prayerName", prayerName);
            serviceIntent.putExtra("cityName", cityName);
            serviceIntent.putExtra("iqamaDurationMinutes", iqamaMinutes);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                activity.startForegroundService(serviceIntent);
            } else {
                activity.startService(serviceIntent);
            }
        }

        @JavascriptInterface
        public void hideFloatingAzanOverlay() {
            Intent serviceIntent = new Intent(activity, AzkarAudioService.class);
            serviceIntent.setAction(AzkarAudioService.ACTION_DISMISS_OVERLAY);
            activity.startService(serviceIntent);
        }

        @JavascriptInterface
        public void showToast(String message) {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show();
        }

        @JavascriptInterface
        public boolean isNativeAndroid() {
            return true;
        }

        @JavascriptInterface
        public void requestLocationPermission() {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        activity,
                        new String[]{
                                Manifest.permission.ACCESS_FINE_LOCATION,
                                Manifest.permission.ACCESS_COARSE_LOCATION
                        },
                        REQ_LOCATION
                );
            } else {
                openAppDetailsSettings();
            }
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(
                            activity,
                            new String[]{Manifest.permission.POST_NOTIFICATIONS},
                            REQ_NOTIFICATIONS
                    );
                    return;
                }
            }
            openNotificationPermissionSettings();
        }

        @JavascriptInterface
        public void openNotificationPermissionSettings() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    intent.putExtra(Settings.EXTRA_APP_PACKAGE, activity.getPackageName());
                    activity.startActivity(intent);
                } else {
                    openAppDetailsSettings();
                }
            } catch (Exception e) {
                openAppDetailsSettings();
            }
        }

        @JavascriptInterface
        public void openOverlaySettings() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Intent intent = new Intent(
                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:" + activity.getPackageName())
                    );
                    activity.startActivity(intent);
                } else {
                    openAppDetailsSettings();
                }
            } catch (Exception e) {
                openAppDetailsSettings();
            }
        }

        @SuppressLint("BatteryLife")
        @JavascriptInterface
        public void openBatteryOptimizationSettings() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + activity.getPackageName()));
                    activity.startActivity(intent);
                } else {
                    openAppDetailsSettings();
                }
            } catch (Exception e) {
                try {
                    Intent fallback = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    activity.startActivity(fallback);
                } catch (Exception ex) {
                    openAppDetailsSettings();
                }
            }
        }

        @JavascriptInterface
        public void openExactAlarmSettings() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                    intent.setData(Uri.parse("package:" + activity.getPackageName()));
                    activity.startActivity(intent);
                } else {
                    openAppDetailsSettings();
                }
            } catch (Exception e) {
                openAppDetailsSettings();
            }
        }

        @JavascriptInterface
        public void openLockScreenDisplaySettings() {
            try {
                if (Build.VERSION.SDK_INT >= 34) {
                    Intent intent = new Intent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT");
                    intent.setData(Uri.parse("package:" + activity.getPackageName()));
                    activity.startActivity(intent);
                    return;
                }
                openNotificationPermissionSettings();
            } catch (Exception e) {
                openNotificationPermissionSettings();
            }
        }

        @JavascriptInterface
        public void openBackgroundRunSettings() {
            openExactAlarmSettings();
        }

        @JavascriptInterface
        public void openAppDetailsSettings() {
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + activity.getPackageName()));
                activity.startActivity(intent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public String getPermissionsStatusJson() {
            boolean locationGranted = ContextCompat.checkSelfPermission(
                    activity, Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED;

            boolean overlayGranted = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                overlayGranted = Settings.canDrawOverlays(activity);
            }

            boolean batteryIgnored = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) activity.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    batteryIgnored = pm.isIgnoringBatteryOptimizations(activity.getPackageName());
                }
            }

            boolean exactAlarmGranted = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AlarmManager am = (AlarmManager) activity.getSystemService(Context.ALARM_SERVICE);
                if (am != null) {
                    exactAlarmGranted = am.canScheduleExactAlarms();
                }
            }

            boolean notificationsGranted = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                notificationsGranted = ContextCompat.checkSelfPermission(
                        activity, Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED;
            }

            boolean lockScreenFullIntentGranted = notificationsGranted;
            if (Build.VERSION.SDK_INT >= 34) {
                NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    lockScreenFullIntentGranted = nm.canUseFullScreenIntent();
                }
            }

            return "{"
                    + "\"location\":" + locationGranted + ","
                    + "\"overlay\":" + overlayGranted + ","
                    + "\"battery\":" + batteryIgnored + ","
                    + "\"background\":" + exactAlarmGranted + ","
                    + "\"exact_alarm\":" + exactAlarmGranted + ","
                    + "\"lock_screen\":" + lockScreenFullIntentGranted + ","
                    + "\"notifications\":" + notificationsGranted
                    + "}";
        }

        @JavascriptInterface
        public void showOngoingIqamaNotification(String title, String body, int remainingSeconds) {
            try {
                NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm == null) return;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    NotificationChannel ch = new NotificationChannel(
                            IQAMA_ONGOING_CHANNEL_ID,
                            "العداد التنازلي لإقامة الصلاة",
                            NotificationManager.IMPORTANCE_LOW
                    );
                    ch.setDescription("إشعار مستمر يعرض الوقت المتبقي لإقامة الصلاة عند تصغير نافذة الأذان");
                    ch.setShowBadge(false);
                    nm.createNotificationChannel(ch);
                }

                Intent openIntent = new Intent(activity, MainActivity.class);
                openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pendingIntent = PendingIntent.getActivity(activity, 9902, openIntent, flags);

                NotificationCompat.Builder builder = new NotificationCompat.Builder(activity, IQAMA_ONGOING_CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setOngoing(remainingSeconds > 0)
                        .setOnlyAlertOnce(true)
                        .setPriority(NotificationCompat.PRIORITY_LOW)
                        .setContentIntent(pendingIntent);

                nm.notify(IQAMA_ONGOING_NOTIF_ID, builder.build());
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void cancelOngoingIqamaNotification() {
            try {
                NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.cancel(IQAMA_ONGOING_NOTIF_ID);
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void showPersistentPrayerNotification(String title, String body) {
            try {
                NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm == null) return;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    NotificationChannel ch = new NotificationChannel(
                            PERSISTENT_PRAYER_CHANNEL_ID,
                            "الإشعار الدائم لمواقيت الصلاة",
                            NotificationManager.IMPORTANCE_LOW
                    );
                    ch.setDescription("يعرض الصلاة القادمة والوقت المتبقي بشكل دائم في ستارة الإشعارات");
                    ch.setShowBadge(false);
                    nm.createNotificationChannel(ch);
                }

                Intent openIntent = new Intent(activity, MainActivity.class);
                openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pendingIntent = PendingIntent.getActivity(activity, 9906, openIntent, flags);

                NotificationCompat.Builder builder = new NotificationCompat.Builder(activity, PERSISTENT_PRAYER_CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setOngoing(true)
                        .setOnlyAlertOnce(true)
                        .setPriority(NotificationCompat.PRIORITY_LOW)
                        .setContentIntent(pendingIntent);

                nm.notify(PERSISTENT_PRAYER_NOTIF_ID, builder.build());
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void showPermissionReminderNotification(String permissionKey, String title, String body) {
            try {
                NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm == null) return;

                String channelId = "permission_reminders_channel";
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    NotificationChannel ch = new NotificationChannel(
                            channelId,
                            "تنبيهات تفعيل أذونات الأذان والخلفية",
                            NotificationManager.IMPORTANCE_HIGH
                    );
                    ch.setDescription("تنبيهات مباشرة لتفعيل الصلاحيات الضرورية لاستمرار الأذان");
                    nm.createNotificationChannel(ch);
                }

                Intent directIntent;
                if ("exact_alarm".equals(permissionKey) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    directIntent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + activity.getPackageName()));
                } else if ("overlay".equals(permissionKey) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    directIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + activity.getPackageName()));
                } else if ("battery".equals(permissionKey) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    directIntent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + activity.getPackageName()));
                } else if ("notifications".equals(permissionKey) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    directIntent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    directIntent.putExtra(Settings.EXTRA_APP_PACKAGE, activity.getPackageName());
                } else if ("lock_screen".equals(permissionKey) && Build.VERSION.SDK_INT >= 34) {
                    directIntent = new Intent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT", Uri.parse("package:" + activity.getPackageName()));
                } else {
                    directIntent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + activity.getPackageName()));
                }

                int reqCode = ("perm_" + permissionKey).hashCode();
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pi = PendingIntent.getActivity(activity, reqCode, directIntent, flags);

                NotificationCompat.Builder builder = new NotificationCompat.Builder(activity, channelId)
                        .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)
                        .setContentIntent(pi);

                nm.notify(reqCode, builder.build());
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void cancelPermissionReminderNotification(String permissionKey) {
            try {
                NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    int reqCode = ("perm_" + permissionKey).hashCode();
                    nm.cancel(reqCode);
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public boolean saveImageToGallery(String base64DataUrl, String fileName) {
            try {
                if (base64DataUrl == null || !base64DataUrl.contains(",")) return false;
                String base64 = base64DataUrl.substring(base64DataUrl.indexOf(",") + 1);
                byte[] decodedBytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);

                String safeName = fileName != null && !fileName.isEmpty() ? fileName : "moazen_image_" + System.currentTimeMillis() + ".png";
                if (!safeName.endsWith(".png")) safeName += ".png";

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    android.content.ContentValues values = new android.content.ContentValues();
                    values.put(android.provider.MediaStore.Images.Media.DISPLAY_NAME, safeName);
                    values.put(android.provider.MediaStore.Images.Media.MIME_TYPE, "image/png");
                    values.put(android.provider.MediaStore.Images.Media.RELATIVE_PATH, android.os.Environment.DIRECTORY_PICTURES + "/AlMuadhin");
                    values.put(android.provider.MediaStore.Images.Media.IS_PENDING, 1);

                    android.net.Uri uri = activity.getContentResolver().insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                    if (uri != null) {
                        try (java.io.OutputStream out = activity.getContentResolver().openOutputStream(uri)) {
                            if (out != null) {
                                out.write(decodedBytes);
                                out.flush();
                            }
                        }
                        values.clear();
                        values.put(android.provider.MediaStore.Images.Media.IS_PENDING, 0);
                        activity.getContentResolver().update(uri, values, null, null);
                        activity.runOnUiThread(() -> Toast.makeText(activity, "✓ تم حفظ الصورة في معرض الصور بنجاح!", Toast.LENGTH_SHORT).show());
                        return true;
                    }
                } else {
                    java.io.File dir = new java.io.File(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_PICTURES), "AlMuadhin");
                    if (!dir.exists()) dir.mkdirs();
                    java.io.File file = new java.io.File(dir, safeName);
                    try (java.io.FileOutputStream fos = new java.io.FileOutputStream(file)) {
                        fos.write(decodedBytes);
                        fos.flush();
                    }
                    android.media.MediaScannerConnection.scanFile(activity, new String[]{file.getAbsolutePath()}, new String[]{"image/png"}, null);
                    activity.runOnUiThread(() -> Toast.makeText(activity, "✓ تم حفظ الصورة في معرض الصور بنجاح!", Toast.LENGTH_SHORT).show());
                    return true;
                }
            } catch (Exception e) {
                android.util.Log.e("MainActivity", "Failed to save image to gallery", e);
            }
            return false;
        }
    }
}
