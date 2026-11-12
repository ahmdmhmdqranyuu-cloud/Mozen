package com.muslim.azan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.TimeZone;

/**
 * Autonomously recalculates prayer times and reschedules all exact alarms
 * whenever the device:
 * 1. Reboots (BOOT_COMPLETED, QUICKBOOT_POWERON)
 * 2. App is updated (MY_PACKAGE_REPLACED)
 * 3. Clock time / timezone / date / locale changes
 * 4. Exact alarm permission state changes (Android 12+)
 * 5. User updates city location or calculation settings.
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
     * Autonomously recalculates 7 days of upcoming prayer times, pre-prayer alerts,
     * Morning/Evening Azkar, and Ramadan alerts, plus next 48 hours of Salawat slots
     * (keeping total concurrent alarms safely below Android's 500-alarm per-UID limit).
     */
    public static synchronized void recalculateAndScheduleAll(Context context) {
        if (context == null) return;

        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

            double lat = 21.4225;
            double lng = 39.8262;
            try {
                String latStr = prefs.getString("city_latitude", "21.4225");
                String lngStr = prefs.getString("city_longitude", "39.8262");
                lat = Double.parseDouble(latStr);
                lng = Double.parseDouble(lngStr);
            } catch (Exception ignored) {}

            String cityName = prefs.getString("city_name", "مكة المكرمة");
            String calcMethod = prefs.getString("calc_method", "umm_al_qura");
            String asrMethod = prefs.getString("asr_method", "standard");
            String azanVoice = prefs.getString("azan_voice", "makkah");
            String fajrVoice = prefs.getString("fajr_voice", "abdulbasit_fajr");
            boolean azanSoundEnabled = prefs.getBoolean("azanSoundEnabled", true);
            boolean prePrayerAlertEnabled = prefs.getBoolean("pre_prayer_alert_enabled", true);

            boolean salawatEnabled = prefs.getBoolean("salawat_enabled", true);
            String salawatTime = prefs.getString("salawat_time", "08:00");
            String salawatRepeatType = prefs.getString("salawat_repeat_type", "repeat");
            int salawatInterval = prefs.getInt("salawat_repeat_interval", 15);
            String salawatUnit = prefs.getString("salawat_repeat_unit", "minutes");
            String salawatAudio = prefs.getString("salawat_audio", "salawat_1");

            boolean morningAzkarEnabled = prefs.getBoolean("morning_azkar_enabled", true);
            String morningAzkarTime = prefs.getString("morning_azkar_time", "06:30");
            String morningAzkarAudio = prefs.getString("morning_azkar_audio", "azkar_sabah");

            boolean eveningAzkarEnabled = prefs.getBoolean("evening_azkar_enabled", true);
            String eveningAzkarTime = prefs.getString("evening_azkar_time", "17:00");
            String eveningAzkarAudio = prefs.getString("evening_azkar_audio", "azkar_massa");

            boolean musaharatiEnabled = prefs.getBoolean("musaharati_enabled", false);
            String musaharatiTime = prefs.getString("musaharati_time", "03:30");
            String musaharatiAudio = prefs.getString("musaharati_audio", "musaharati_1");

            long nowMs = System.currentTimeMillis();
            Calendar nowCal = Calendar.getInstance();
            TimeZone tz = nowCal.getTimeZone();

            JSONArray priorityArray = new JSONArray();
            JSONArray salawatArray = new JSONArray();

            // 1. Schedule full 7 days for high-priority daily prayers, pre-prayer alerts, Azkar, and Musaharati
            for (int dayOffset = 0; dayOffset < 7; dayOffset++) {
                Calendar dayCal = (Calendar) nowCal.clone();
                dayCal.add(Calendar.DAY_OF_YEAR, dayOffset);
                int dayOfYear = dayCal.get(Calendar.DAY_OF_YEAR);
                double tzOffsetHours = tz.getOffset(dayCal.getTimeInMillis()) / 3600000.0;

                PrayerTimeCalculator.DailyPrayerTimes times = PrayerTimeCalculator.calculateDailyPrayers(
                        lat, lng, tzOffsetHours, dayOfYear, calcMethod, asrMethod
                );

                String[] prayerKeys = {"fajr", "dhuhr", "asr", "maghrib", "isha"};
                String[] prayerNames = {"الفجر", "الظهر", "العصر", "المغرب", "العشاء"};
                int[] prayerMinutes = {
                        times.fajrMinutes,
                        times.dhuhrMinutes,
                        times.asrMinutes,
                        times.maghribMinutes,
                        times.ishaMinutes
                };

                for (int pIdx = 0; pIdx < prayerKeys.length; pIdx++) {
                    String pKey = prayerKeys[pIdx];
                    String pName = prayerNames[pIdx];
                    int minutesFromMidnight = prayerMinutes[pIdx];

                    long prayerEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(dayCal, minutesFromMidnight);
                    String prayerVoice = "fajr".equals(pKey) ? fajrVoice : azanVoice;

                    if (prePrayerAlertEnabled) {
                        long prePrayerEpochMs = prayerEpochMs - 15 * 60 * 1000L;
                        if (prePrayerEpochMs > nowMs) {
                            JSONObject preObj = new JSONObject();
                            preObj.put("section", "prePrayerAlert");
                            preObj.put("prayerKey", pKey);
                            preObj.put("prayerName", pName);
                            preObj.put("cityName", cityName);
                            preObj.put("title", "اقتربت صلاة " + pName);
                            preObj.put("body", "«إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا» • متبقي 15 دقيقة على أذان " + pName);
                            preObj.put("triggerEpochMs", prePrayerEpochMs);
                            preObj.put("audioTrackId", "pre_prayer_15m");
                            preObj.put("autoPlay", true);
                            priorityArray.put(preObj);
                        }
                    }

                    if (prayerEpochMs > nowMs) {
                        JSONObject azanObj = new JSONObject();
                        azanObj.put("section", "prayer_azan");
                        azanObj.put("prayerKey", pKey);
                        azanObj.put("prayerName", pName);
                        azanObj.put("cityName", cityName);
                        azanObj.put("title", "حان الآن موعد أذان " + pName);
                        azanObj.put("body", "الله أكبر • حان وقت صلاة " + pName + " حسب توقيت " + cityName);
                        azanObj.put("triggerEpochMs", prayerEpochMs);
                        azanObj.put("audioTrackId", prayerVoice);
                        azanObj.put("autoPlay", azanSoundEnabled);
                        priorityArray.put(azanObj);
                    }
                }

                if (morningAzkarEnabled) {
                    int morningMins = parseHHmm(morningAzkarTime, 6, 30);
                    long morningEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(dayCal, morningMins);
                    if (morningEpochMs > nowMs) {
                        JSONObject mObj = new JSONObject();
                        mObj.put("section", "morningAzkar");
                        mObj.put("title", "أذكار الصباح المباركة");
                        mObj.put("body", "أصبحنا وأصبح الملك لله والحمد لله.. حان وقت أذكار الصباح لحفظك ويومك المبارك.");
                        mObj.put("triggerEpochMs", morningEpochMs);
                        mObj.put("audioTrackId", morningAzkarAudio);
                        mObj.put("autoPlay", true);
                        priorityArray.put(mObj);
                    }
                }

                if (eveningAzkarEnabled) {
                    int eveningMins = parseHHmm(eveningAzkarTime, 17, 0);
                    long eveningEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(dayCal, eveningMins);
                    if (eveningEpochMs > nowMs) {
                        JSONObject eObj = new JSONObject();
                        eObj.put("section", "eveningAzkar");
                        eObj.put("title", "أذكار المساء المباركة");
                        eObj.put("body", "أمسينا وأمسى الملك لله والحمد لله.. حان وقت أذكار المساء لطمأنينة القلب وحفظ الأهل.");
                        eObj.put("triggerEpochMs", eveningEpochMs);
                        eObj.put("audioTrackId", eveningAzkarAudio);
                        eObj.put("autoPlay", true);
                        priorityArray.put(eObj);
                    }
                }

                if (musaharatiEnabled) {
                    int musaharatiMins = parseHHmm(musaharatiTime, 3, 30);
                    long musaharatiEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(dayCal, musaharatiMins);
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

                // 2. Schedule periodic Salawat only for today and tomorrow (max 60 slots) to stay well below 500 UID alarm limit
                if (salawatEnabled && dayOffset < 2 && salawatArray.length() < 60) {
                    int salawatStartMins = parseHHmm(salawatTime, 8, 0);
                    long salawatStartEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(dayCal, salawatStartMins);

                    if ("once".equalsIgnoreCase(salawatRepeatType)) {
                        if (salawatStartEpochMs > nowMs) {
                            JSONObject sObj = new JSONObject();
                            sObj.put("section", "salawat");
                            sObj.put("title", "الصلاة على النبي ﷺ");
                            sObj.put("body", "«إن الله وملائكته يصلون على النبي يا أيها الذين آمنوا صلوا عليه وسلموا تسليما».");
                            sObj.put("triggerEpochMs", salawatStartEpochMs);
                            sObj.put("audioTrackId", salawatAudio);
                            sObj.put("autoPlay", true);
                            salawatArray.put(sObj);
                        }
                    } else {
                        long stepMs = salawatInterval * ("hours".equalsIgnoreCase(salawatUnit) ? 3600000L : 60000L);
                        if (stepMs < 60000L) stepMs = 60000L;

                        long salawatEndEpochMs = PrayerTimeCalculator.calculatePrayerEpochMs(dayCal, 22 * 60);
                        long currentSlotMs = salawatStartEpochMs;

                        while (currentSlotMs <= salawatEndEpochMs && salawatArray.length() < 60) {
                            if (currentSlotMs > nowMs) {
                                JSONObject sObj = new JSONObject();
                                sObj.put("section", "salawat");
                                sObj.put("title", "الصلاة على النبي ﷺ");
                                sObj.put("body", "«إن الله وملائكته يصلون على النبي يا أيها الذين آمنوا صلوا عليه وسلموا تسليما».");
                                sObj.put("triggerEpochMs", currentSlotMs);
                                sObj.put("audioTrackId", salawatAudio);
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

            Log.d(TAG, "Recalculation complete. Priority slots: " + priorityArray.length() + ", Salawat slots: " + salawatArray.length());

            AlarmScheduler.rescheduleFromJson(context, mergedSchedule.toString());

            prefs.edit()
                    .putLong("last_recalculated_epoch_ms", nowMs)
                    .apply();

        } catch (Exception e) {
            Log.e(TAG, "Failed autonomous recalculation of schedule", e);
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
