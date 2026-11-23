package com.muslim.azan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;
import java.util.TimeZone;

/**
 * Autonomously recalculates prayer times and reschedules all exact alarms
 * whenever the device:
 * 1. Reboots (BOOT_COMPLETED, QUICKBOOT_POWERON)
 * 2. App is updated (MY_PACKAGE_REPLACED)
 * 3. Clock time / timezone / date / locale changes
 * 4. Exact alarm permission state changes (Android 12+)
 * 5. User updates city location, timezone, offsets, or calculation settings.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    private static final String PREFS = "azan_reminders_prefs";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Log.d(TAG, "Broadcast received: " + action + ". Recalculating schedule on background thread...");

        final PendingResult pendingResult = goAsync();
        final Context appContext = context.getApplicationContext();
        new Thread(() -> {
            try {
                recalculateAndScheduleAll(appContext);
                if ("android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED".equals(action)) {
                    SharedPreferences sp = appContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
                    if (sp.getBoolean("onboarding_completed", false)) {
                        String lang = sp.getString("app_language", "ar");
                        com.muslim.azan.data.PermissionMonitorNotifier.INSTANCE
                                .evaluateAndSyncNotifications(appContext, lang != null ? lang : "ar");
                    }
                }
            } finally {
                if (pendingResult != null) {
                    try {
                        pendingResult.finish();
                    } catch (Exception ignored) {}
                }
            }
        }).start();
    }

    /**
     * Autonomously recalculates 7 days of upcoming prayer times (using the selected city's
     * DST-aware IANA timezone + manual per-prayer offsets), pre-prayer alerts,
     * Morning/Evening Azkar, and Ramadan alerts, plus next 48 hours of Salawat slots.
     */
    public static synchronized void recalculateAndScheduleAll(Context context) {
        if (context == null) return;

        try {
            RingerRestoreCoordinator.reconcileOrRescheduleOnWake(context);
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

            double lat = 21.4225;
            double lng = 39.8262;
            try {
                String latStr = prefs.getString("city_latitude", "21.4225");
                String lngStr = prefs.getString("city_longitude", "39.8262");
                lat = PrayerTimeCalculator.sanitizeLatitude(Double.parseDouble(latStr));
                lng = PrayerTimeCalculator.sanitizeLongitude(Double.parseDouble(lngStr));
            } catch (Exception parseEx) {
                Log.w(TAG, "Invalid stored coordinates, falling back to Makkah defaults", parseEx);
            }

            String cityName = prefs.getString("city_name", "مكة المكرمة");
            String cityTimezoneId = prefs.getString("city_timezone_id", "Asia/Riyadh");
            String calcMethod = prefs.getString("calc_method", "umm_al_qura");
            String asrMethod = prefs.getString("asr_method", "standard");
            String highLatRule = prefs.getString("high_latitude_rule", "angle_based");
            String azanVoice = prefs.getString("azan_voice", "makkah");
            String fajrVoice = prefs.getString("fajr_voice", "abdulbasit_fajr");
            boolean azanSoundEnabled = prefs.getBoolean("azanSoundEnabled", true);
            boolean fajrSoundEnabled = prefs.getBoolean("fajr_sound_enabled", azanSoundEnabled);
            int fajrVolumePercent = Math.max(0, Math.min(100, prefs.getInt("fajr_volume_percent", 100)));
            int regularAzanVolumePercent = Math.max(0, Math.min(100, prefs.getInt("regular_azan_volume_percent", 100)));
            boolean prePrayerAlertEnabled = prefs.getBoolean("pre_prayer_alert_enabled", true);
            String prePrayerVoice = prefs.getString("pre_prayer_voice", "pre_prayer_15m");
            int prePrayerMinutes = Math.max(1, Math.min(60, prefs.getInt("pre_prayer_minutes", 15)));
            int prePrayerVolumePercent = Math.max(0, Math.min(100, prefs.getInt("pre_prayer_volume_percent", 90)));
            boolean azkarSoundEnabled = prefs.getBoolean("azkar_sound_enabled", true);
            boolean iqamaEnabled = prefs.getBoolean("iqama_enabled", true);
            String iqamaVoice = prefs.getString("iqama_voice", "iqama_1");
            int otherAlertsVolumePercent = Math.max(0, Math.min(100, prefs.getInt("other_alerts_volume_percent", 85)));

            int fajrOff = prefs.getInt("offset_fajr", 0);
            int dhuhrOff = prefs.getInt("offset_dhuhr", 0);
            int asrOff = prefs.getInt("offset_asr", 0);
            int maghribOff = prefs.getInt("offset_maghrib", 0);
            int ishaOff = prefs.getInt("offset_isha", 0);

            boolean salawatEnabled = prefs.getBoolean("salawat_enabled", true);
            boolean salawatAutoAfterFajrIqama = prefs.getBoolean("salawat_auto_after_fajr_iqama", true);
            String salawatTime = prefs.getString("salawat_time", "06:00");
            String salawatEndTime = prefs.getString("salawat_end_time", "23:59");
            String salawatRepeatType = prefs.getString("salawat_repeat_type", "repeat");
            int salawatInterval = prefs.getInt("salawat_repeat_interval", 15);
            String salawatUnit = prefs.getString("salawat_repeat_unit", "minutes");
            String salawatAudio = prefs.getString("salawat_audio", "salawat_1");
            int salawatVolumePercent = Math.max(0, Math.min(100, prefs.getInt("salawat_volume_percent", otherAlertsVolumePercent)));

            boolean morningAzkarEnabled = prefs.getBoolean("morning_azkar_enabled", true);
            String morningAzkarTime = prefs.getString("morning_azkar_time", "08:00");
            String morningAzkarAudio = prefs.getString("morning_azkar_audio", "azkar_sabah");

            boolean eveningAzkarEnabled = prefs.getBoolean("evening_azkar_enabled", true);
            String eveningAzkarTime = prefs.getString("evening_azkar_time", "21:00");
            String eveningAzkarAudio = prefs.getString("evening_azkar_audio", "azkar_massa");
            int azkarVolumePercent = Math.max(0, Math.min(100, prefs.getInt("azkar_volume_percent", 100)));

            boolean musaharatiEnabled = prefs.getBoolean("musaharati_enabled", false);
            String musaharatiTime = prefs.getString("musaharati_time", "03:30");
            String musaharatiAudio = prefs.getString("musaharati_audio", "musaharati_1");

            // Load per-prayer independent configurations (with fallback to global defaults)
            String[] prayerKeys = {"fajr", "sunrise", "duha", "dhuhr", "asr", "maghrib", "isha"};
            String[] prayerNames = {"الفجر", "الشروق", "صلاة الضحى", "الظهر", "العصر", "المغرب", "العشاء"};

            int[] offsets = new int[prayerKeys.length];
            boolean[] soundEnabledArr = new boolean[prayerKeys.length];
            int[] volumePercentArr = new int[prayerKeys.length];
            boolean[] preAlertEnabledArr = new boolean[prayerKeys.length];
            int[] preAlertMinutesArr = new int[prayerKeys.length];
            String[] preAlertVoiceArr = new String[prayerKeys.length];
            boolean[] silentDuringArr = new boolean[prayerKeys.length];
            String[] azanVoiceArr = new String[prayerKeys.length];
            String[] alertModeArr = new String[prayerKeys.length];
            String[] iqamaVoiceArr = new String[prayerKeys.length];
            boolean[] duaAfterArr = new boolean[prayerKeys.length];
            boolean[] didYouPrayEnabledArr = new boolean[prayerKeys.length];

            for (int i = 0; i < prayerKeys.length; i++) {
                String k = prayerKeys[i];
                boolean isObligatory = !("sunrise".equals(k) || "duha".equals(k));
                boolean isDuha = "duha".equals(k);
                int legacyOffset = Math.max(-60, Math.min(60, prefs.getInt("offset_" + k, 0)));
                String defaultVoice = "fajr".equals(k) ? fajrVoice : (isObligatory ? azanVoice : (isDuha ? "duha_surah" : "salawat_1"));
                int defaultVol = "fajr".equals(k) ? fajrVolumePercent : regularAzanVolumePercent;
                boolean defaultSound = "fajr".equals(k) ? fajrSoundEnabled : (isObligatory ? azanSoundEnabled : isDuha);
                offsets[i] = legacyOffset;
                soundEnabledArr[i] = defaultSound;
                volumePercentArr[i] = defaultVol;
                preAlertEnabledArr[i] = isObligatory && prePrayerAlertEnabled;
                preAlertMinutesArr[i] = prePrayerMinutes;
                preAlertVoiceArr[i] = prePrayerVoice;
                silentDuringArr[i] = false;
                azanVoiceArr[i] = defaultVoice;
                alertModeArr[i] = (isObligatory || isDuha) ? "full_azan" : "short_tone";
                iqamaVoiceArr[i] = (isObligatory && iqamaEnabled) ? iqamaVoice : "none";
                duaAfterArr[i] = isObligatory;
                didYouPrayEnabledArr[i] = true;

                String cfgRaw = prefs.getString("prayer_config_" + k, null);
                if (cfgRaw != null && !cfgRaw.isEmpty()) {
                    try {
                        JSONObject cfg = new JSONObject(cfgRaw);
                        offsets[i] = Math.max(-60, Math.min(60, cfg.optInt("offsetMinutes", legacyOffset)));
                        soundEnabledArr[i] = cfg.optBoolean("soundEnabled", soundEnabledArr[i]);
                        volumePercentArr[i] = Math.max(0, Math.min(100, cfg.optInt("volumePercent", defaultVol)));
                        preAlertEnabledArr[i] = cfg.optBoolean("preAlertEnabled", preAlertEnabledArr[i]);
                        preAlertMinutesArr[i] = Math.max(1, Math.min(60, cfg.optInt("preAlertMinutes", prePrayerMinutes)));
                        preAlertVoiceArr[i] = cfg.optString("preAlertVoice", prePrayerVoice);
                        silentDuringArr[i] = cfg.optBoolean("silentDuringPrayer", false);
                        azanVoiceArr[i] = cfg.optString("azanVoice", defaultVoice);
                        alertModeArr[i] = cfg.optString("alertMode", alertModeArr[i]);
                        iqamaVoiceArr[i] = iqamaEnabled ? cfg.optString("iqamaVoice", iqamaVoiceArr[i]) : "none";
                        duaAfterArr[i] = cfg.optBoolean("duaAfterPrayerEnabled", duaAfterArr[i]);
                        didYouPrayEnabledArr[i] = cfg.optBoolean("didYouPrayEnabled", true);
                    } catch (Exception cfgEx) {
                        Log.w(TAG, "Failed parsing prayer_config_" + k + ", using defaults", cfgEx);
                    }
                }
            }

            long nowMs = System.currentTimeMillis();
            TimeZone cityTz = (cityTimezoneId != null && !cityTimezoneId.trim().isEmpty())
                    ? TimeZone.getTimeZone(cityTimezoneId.trim())
                    : TimeZone.getDefault();
            Calendar cityNowCal = Calendar.getInstance(cityTz);
            Calendar deviceNowCal = Calendar.getInstance();

            JSONArray priorityArray = new JSONArray();
            JSONArray salawatArray = new JSONArray();
            Set<Long> seenDidPrayEpochs = new HashSet<>();

            // 1. Schedule full 7 days for daily prayers (including Duha/Sunrise if enabled), pre-prayer alerts, Iqama, Azkar, and Musaharati
            for (int dayOffset = 0; dayOffset < 7; dayOffset++) {
                Calendar cityDayCal = (Calendar) cityNowCal.clone();
                cityDayCal.add(Calendar.DAY_OF_YEAR, dayOffset);

                Calendar deviceDayCal = (Calendar) deviceNowCal.clone();
                deviceDayCal.add(Calendar.DAY_OF_YEAR, dayOffset);

                double tzOffsetHours = PrayerTimeCalculator.resolveTimezoneOffsetHours(
                        cityTimezoneId,
                        cityDayCal.getTimeInMillis(),
                        lng
                );

                PrayerTimeCalculator.DailyPrayerTimes times = PrayerTimeCalculator.calculateDailyPrayers(
                        cityDayCal, lat, lng, tzOffsetHours, calcMethod, asrMethod, highLatRule
                ).withOffsets(
                        offsets[0], offsets[1], offsets[2], offsets[3], offsets[4], offsets[5], offsets[6]
                );
                if (dayOffset == 0) {
                    Log.d(TAG, "Day0 inputs -> city=" + cityName + ", lat=" + lat + ", lng=" + lng
                            + ", tz=" + tzOffsetHours + ", method=" + calcMethod + ", asr=" + asrMethod
                            + ", highLat=" + highLatRule + ", validOrder=" + times.isChronologicallyValid());
                }

                int[] prayerMinutes = {
                        times.fajrMinutes,
                        times.sunriseMinutes,
                        times.duhaMinutes,
                        times.dhuhrMinutes,
                        times.asrMinutes,
                        times.maghribMinutes,
                        times.ishaMinutes
                };

                for (int pIdx = 0; pIdx < prayerKeys.length; pIdx++) {
                    String pKey = prayerKeys[pIdx];
                    String pName = prayerNames[pIdx];
                    int minutesFromMidnight = prayerMinutes[pIdx];
                    boolean isObligatory = !("sunrise".equals(pKey) || "duha".equals(pKey));

                    long prayerEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(cityDayCal, minutesFromMidnight);

                    if (preAlertEnabledArr[pIdx]) {
                        int preMins = preAlertMinutesArr[pIdx];
                        long prePrayerEpochMs = prayerEpochMs - preMins * 60 * 1000L;
                        if (prePrayerEpochMs > nowMs) {
                            JSONObject preObj = new JSONObject();
                            preObj.put("section", "prePrayerAlert");
                            preObj.put("prayerKey", pKey);
                            preObj.put("prayerName", pName);
                            preObj.put("cityName", cityName);
                            preObj.put("title", "اقترب موعد " + pName);
                            preObj.put("body", "«إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا» • متبقي " + preMins + " دقيقة على " + pName);
                            preObj.put("triggerEpochMs", prePrayerEpochMs);
                            preObj.put("audioTrackId", preAlertVoiceArr[pIdx]);
                            preObj.put("volumePercent", prePrayerVolumePercent);
                            preObj.put("alertMode", "full_azan");
                            preObj.put("autoPlay", true);
                            priorityArray.put(preObj);
                        }
                    }

                    boolean shouldScheduleMain = isObligatory || soundEnabledArr[pIdx] || silentDuringArr[pIdx];
                    if (shouldScheduleMain && prayerEpochMs > nowMs) {
                        JSONObject azanObj = new JSONObject();
                        azanObj.put("section", isObligatory ? "prayer_azan" : "prePrayerAlert");
                        azanObj.put("prayerKey", pKey);
                        azanObj.put("prayerName", pName);
                        azanObj.put("cityName", cityName);
                        azanObj.put("title", isObligatory ? ("حان الآن موعد أذان " + pName) : ("حان الآن وقت " + pName));
                        azanObj.put("body", isObligatory
                                ? ("الله أكبر • حان وقت صلاة " + pName + " حسب توقيت " + cityName)
                                : ("حان الآن وقت " + pName + " حسب توقيت " + cityName));
                        azanObj.put("triggerEpochMs", prayerEpochMs);
                        azanObj.put("audioTrackId", azanVoiceArr[pIdx]);
                        azanObj.put("volumePercent", volumePercentArr[pIdx]);
                        azanObj.put("alertMode", alertModeArr[pIdx]);
                        azanObj.put("silentDuringPrayer", silentDuringArr[pIdx]);
                        azanObj.put("duaAfterPrayerEnabled", duaAfterArr[pIdx]);
                        azanObj.put("autoPlay", soundEnabledArr[pIdx]);
                        priorityArray.put(azanObj);
                    }

                    // Schedule Iqama alert 7-15 min after Azan when enabled for obligatory prayers
                    boolean hasIqamaSlot = isObligatory && iqamaEnabled && soundEnabledArr[pIdx] && iqamaVoiceArr[pIdx] != null
                            && !iqamaVoiceArr[pIdx].isEmpty() && !"none".equals(iqamaVoiceArr[pIdx])
                            && !"silent".equals(alertModeArr[pIdx]) && !"vibrate_only".equals(alertModeArr[pIdx]);
                    int iqamaDelayMins = "maghrib".equals(pKey) ? 7 : 15;
                    if (hasIqamaSlot) {
                        long iqamaEpochMs = prayerEpochMs + iqamaDelayMins * 60 * 1000L;
                        if (iqamaEpochMs > nowMs) {
                            JSONObject iqamaObj = new JSONObject();
                            iqamaObj.put("section", "iqama");
                            iqamaObj.put("prayerKey", pKey);
                            iqamaObj.put("prayerName", pName);
                            iqamaObj.put("cityName", cityName);
                            iqamaObj.put("title", "حان وقت إقامة صلاة " + pName);
                            iqamaObj.put("body", "قد قامت الصلاة • حي على الصلاة في " + cityName);
                            iqamaObj.put("triggerEpochMs", iqamaEpochMs);
                            iqamaObj.put("audioTrackId", iqamaVoiceArr[pIdx]);
                            iqamaObj.put("volumePercent", otherAlertsVolumePercent);
                            iqamaObj.put("alertMode", "full_azan");
                            iqamaObj.put("autoPlay", true);
                            priorityArray.put(iqamaObj);
                        }
                    }

                    // Schedule «هل صليت؟» check-in notification (+5m after Iqama if active, else +5m after prayer time)
                    if (didYouPrayEnabledArr[pIdx]) {
                        long didPrayEpochMs = prayerEpochMs + (hasIqamaSlot ? (iqamaDelayMins + 5L) : 5L) * 60_000L;
                        while (seenDidPrayEpochs.contains(didPrayEpochMs)) {
                            didPrayEpochMs += 1000L;
                        }
                        if (didPrayEpochMs > nowMs) {
                            seenDidPrayEpochs.add(didPrayEpochMs);
                            JSONObject didPrayObj = new JSONObject();
                            didPrayObj.put("section", "did_you_pray");
                            didPrayObj.put("prayerKey", pKey);
                            didPrayObj.put("prayerName", pName);
                            didPrayObj.put("cityName", cityName);
                            didPrayObj.put("autoPlay", false);
                            didPrayObj.put("triggerEpochMs", didPrayEpochMs);
                            priorityArray.put(didPrayObj);
                        }
                    }
                }

                if (morningAzkarEnabled) {
                    int morningMins = parseHHmm(morningAzkarTime, 8, 0);
                    long morningEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(deviceDayCal, morningMins);
                    if (morningEpochMs > nowMs) {
                        JSONObject mObj = new JSONObject();
                        mObj.put("section", "morningAzkar");
                        mObj.put("title", "أذكار الصباح المباركة");
                        mObj.put("body", "أصبحنا وأصبح الملك لله والحمد لله.. حان وقت أذكار الصباح لحفظك ويومك المبارك.");
                        mObj.put("triggerEpochMs", morningEpochMs);
                        mObj.put("audioTrackId", morningAzkarAudio);
                        mObj.put("volumePercent", azkarVolumePercent);
                        mObj.put("autoPlay", azkarSoundEnabled);
                        priorityArray.put(mObj);
                    }
                }

                if (eveningAzkarEnabled) {
                    int eveningMins = parseHHmm(eveningAzkarTime, 21, 0);
                    long eveningEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(deviceDayCal, eveningMins);
                    if (eveningEpochMs > nowMs) {
                        JSONObject eObj = new JSONObject();
                        eObj.put("section", "eveningAzkar");
                        eObj.put("title", "أذكار المساء المباركة");
                        eObj.put("body", "أمسينا وأمسى الملك لله والحمد لله.. حان وقت أذكار المساء لطمأنينة القلب وحفظ الأهل.");
                        eObj.put("triggerEpochMs", eveningEpochMs);
                        eObj.put("audioTrackId", eveningAzkarAudio);
                        eObj.put("volumePercent", azkarVolumePercent);
                        eObj.put("autoPlay", azkarSoundEnabled);
                        priorityArray.put(eObj);
                    }
                }

                if (musaharatiEnabled) {
                    int musaharatiMins = parseHHmm(musaharatiTime, 3, 30);
                    long musaharatiEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(deviceDayCal, musaharatiMins);
                    if (musaharatiEpochMs > nowMs) {
                        JSONObject muObj = new JSONObject();
                        muObj.put("section", "musaharati");
                        muObj.put("title", "نداء المسحراتي المبارك");
                        muObj.put("body", "اصحى يا نايم وحد الدايم.. تسحروا فإن في السحور بركة.");
                        muObj.put("triggerEpochMs", musaharatiEpochMs);
                        muObj.put("audioTrackId", musaharatiAudio);
                        muObj.put("autoPlay", true);
                        priorityArray.put(muObj);
                    }
                }

                // 2. Schedule periodic Salawat only for today and tomorrow (max 60 slots)
                if (salawatEnabled && dayOffset < 2 && salawatArray.length() < 60) {
                    long[] salawatWindow = computeSalawatWindowForDay(
                            cityDayCal,
                            deviceDayCal,
                            times.fajrMinutes,
                            15,
                            salawatAutoAfterFajrIqama,
                            salawatTime,
                            salawatEndTime,
                            salawatRepeatType
                    );
                    long salawatStartEpochMs = salawatWindow[0];
                    long salawatEndEpochMs = salawatWindow[1];

                    if ("once".equalsIgnoreCase(salawatRepeatType)) {
                        if (salawatStartEpochMs > nowMs) {
                            JSONObject sObj = new JSONObject();
                            sObj.put("section", "salawat");
                            sObj.put("title", "الصلاة على النبي ﷺ");
                            sObj.put("body", "«إن الله وملائكته يصلون على النبي يا أيها الذين آمنوا صلوا عليه وسلموا تسليما».");
                            sObj.put("triggerEpochMs", salawatStartEpochMs);
                            sObj.put("audioTrackId", salawatAudio);
                            sObj.put("volumePercent", salawatVolumePercent);
                            sObj.put("autoPlay", true);
                            salawatArray.put(sObj);
                        }
                    } else {
                        long stepMs = salawatInterval * ("hours".equalsIgnoreCase(salawatUnit) ? 3600000L : 60000L);
                        if (stepMs < 60000L) stepMs = 60000L;

                        long currentSlotMs = salawatStartEpochMs;

                        while (currentSlotMs <= salawatEndEpochMs && salawatArray.length() < 60) {
                            if (currentSlotMs > nowMs) {
                                JSONObject sObj = new JSONObject();
                                sObj.put("section", "salawat");
                                sObj.put("title", "الصلاة على النبي ﷺ");
                                sObj.put("body", "«إن الله وملائكته يصلون على النبي يا أيها الذين آمنوا صلوا عليه وسلموا تسليما».");
                                sObj.put("triggerEpochMs", currentSlotMs);
                                sObj.put("audioTrackId", salawatAudio);
                                sObj.put("volumePercent", salawatVolumePercent);
                                sObj.put("autoPlay", true);
                                salawatArray.put(sObj);
                            }
                            currentSlotMs += stepMs;
                        }
                    }
                }
            }

            // Merge priority alarms first, then Salawat slots
            JSONArray mergedSchedule = new JSONArray();
            for (int i = 0; i < priorityArray.length(); i++) {
                mergedSchedule.put(priorityArray.get(i));
            }
            for (int i = 0; i < salawatArray.length(); i++) {
                mergedSchedule.put(salawatArray.get(i));
            }

            Log.d(TAG, "Recalculation complete for " + cityName + " (" + cityTimezoneId + "). Priority slots: "
                    + priorityArray.length() + ", Salawat slots: " + salawatArray.length());

            AlarmScheduler.rescheduleFromJson(context, mergedSchedule.toString());

            prefs.edit()
                    .putLong("last_recalculated_epoch_ms", nowMs)
                    .remove("last_recalc_error")
                    .apply();

        } catch (Exception e) {
            Log.e(TAG, "Failed autonomous recalculation of schedule", e);
            try {
                context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                        .edit()
                        .putString("last_recalc_error", e.getMessage() != null ? e.getMessage() : "unknown")
                        .apply();
            } catch (Exception ignored) {}
        }
    }

    /**
     * Pure JVM-testable helper ensuring Salawat window start and end use the same timezone calendar
     * (cityDayCal when auto-starting after Fajr Iqama; deviceDayCal when manually configured).
     */
    public static long[] computeSalawatWindowForDay(
            Calendar cityDayCal,
            Calendar deviceDayCal,
            int fajrMinutes,
            int iqamaDelayMins,
            boolean autoAfterFajrIqama,
            String salawatTime,
            String salawatEndTime,
            String repeatType
    ) {
        boolean isOnce = "once".equalsIgnoreCase(repeatType);
        if (autoAfterFajrIqama && !isOnce) {
            long fajrEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(cityDayCal, fajrMinutes);
            long startMs = fajrEpochMs + (Math.max(0, iqamaDelayMins) + 1) * 60_000L;
            long endMs = PrayerTimeCalculator.calculatePrayerEpochMs(cityDayCal, 23 * 60 + 59) + 59_999L;
            return new long[]{startMs, Math.max(startMs, endMs)};
        } else {
            int startMins = parseHHmm(salawatTime, 6, 0);
            long startMs = PrayerTimeCalculator.calculatePrayerEpochMs(deviceDayCal, startMins);
            long endMs;
            if ("00:00".equals(salawatEndTime) || "23:59".equals(salawatEndTime)) {
                endMs = PrayerTimeCalculator.calculatePrayerEpochMs(deviceDayCal, 23 * 60 + 59) + 59_999L;
            } else {
                int endMins = parseHHmm(salawatEndTime, 23, 59);
                endMs = PrayerTimeCalculator.calculatePrayerEpochMs(deviceDayCal, endMins);
            }
            return new long[]{startMs, endMs};
        }
    }

    private static int parseHHmm(String hhmm, int defaultH, int defaultM) {
        if (hhmm == null || !hhmm.contains(":")) {
            return defaultH * 60 + defaultM;
        }
        try {
            String[] parts = hhmm.trim().split(":");
            int h = Integer.parseInt(parts[0]);
            int m = Integer.parseInt(parts[1]);
            return h * 60 + m;
        } catch (Exception e) {
            return defaultH * 60 + defaultM;
        }
    }
}
