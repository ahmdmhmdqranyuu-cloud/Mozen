package com.muslim.azan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

/**
 * Reschedules all reminders after the Android device reboots, app is updated,
 * or user changes time/timezone settings.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action) ||
            Intent.ACTION_TIME_CHANGED.equals(action) ||
            Intent.ACTION_TIMEZONE_CHANGED.equals(action) ||
            Intent.ACTION_DATE_CHANGED.equals(action)) {

            Log.d(TAG, "Triggered by action: " + action + ". Rescheduling all active Islamic reminders...");

            SharedPreferences prefs = context.getSharedPreferences("azan_reminders_prefs", Context.MODE_PRIVATE);
            String savedScheduleJson = prefs.getString("active_schedule_json", null);

            if (savedScheduleJson != null) {
                AlarmScheduler.rescheduleFromJson(context, savedScheduleJson);
            }
        }
    }
}
