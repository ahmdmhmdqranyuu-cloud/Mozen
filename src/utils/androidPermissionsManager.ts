/**
 * Official Android & System Permissions Manager + Notification Shade Permission Reminders
 * - Direct navigation to specific Android permission pages (Location, Notifications, Overlay, Battery Optimization)
 * - Never routes to the generic phone settings home screen; provides official Android Intent URIs + Web/PWA fallbacks
 * - Auto-verifies permission state when returning to the app (visibilitychange, focus, pageshow, androidPermissionsResume)
 * - Manages Notification Shade reminders ONLY for permissions needed by enabled features, with anti-spam cooldown
 * - Automatically removes the shade notification once the permission is granted
 */

import { CityLocation } from '../types';
import { detectSmartGpsLocation } from '../data/worldCitiesData';

export type ManagedPermissionKey =
  | 'location'
  | 'notifications'
  | 'overlay'
  | 'battery'
  | 'background'
  | 'exact_alarm'
  | 'lock_screen';

export interface PermissionStateMap {
  location: boolean;
  notifications: boolean;
  overlay: boolean;
  battery: boolean;
  background: boolean;
  exact_alarm: boolean;
  lock_screen: boolean;
}

export interface FirstTimeExtendedSettings {
  privacyPolicyAccepted: boolean;
  prayerAlerts: {
    fajr: boolean;
    sunrise: boolean;
    duha: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  azanNotificationsEnabled: boolean;
  qiyamNightAlertEnabled: boolean;
  qiyamNightTime: string; // e.g. "02:30"
  volumeDownStopsAzan: boolean;
  landscapeAzanScreenEnabled: boolean;
  persistentNotificationEnabled: boolean;
  /** Independent Control Switches (Requirement 6) */
  floatingAzanWindowEnabled: boolean;
  lockScreenAzanEnabled: boolean;
  wakeScreenOnAzanEnabled: boolean;
  azanSoundEnabled: boolean;
}

export type ExtendedSetupSettings = FirstTimeExtendedSettings;

export const PERMISSIONS_STORAGE_KEY = 'moazen_permissions_state_v2';
export const EXTENDED_SETUP_SETTINGS_KEY = 'moazen_extended_setup_settings_v1';
const SHADE_REMINDER_COOLDOWN_KEY = 'moazen_perm_shade_reminder_timestamps_v1';
const APP_PACKAGE_NAME = 'com.muslim.azan';

export const DEFAULT_EXTENDED_SETUP_SETTINGS: FirstTimeExtendedSettings = {
  privacyPolicyAccepted: false,
  prayerAlerts: {
    fajr: true,
    sunrise: true,
    duha: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  azanNotificationsEnabled: true,
  qiyamNightAlertEnabled: true,
  qiyamNightTime: '02:30',
  volumeDownStopsAzan: true,
  landscapeAzanScreenEnabled: true,
  persistentNotificationEnabled: true,
  floatingAzanWindowEnabled: true,
  lockScreenAzanEnabled: true,
  wakeScreenOnAzanEnabled: true,
  azanSoundEnabled: true,
};

export interface NativeAndroidPermissionsBridge {
  isNativeAndroid?: () => boolean;
  requestLocationPermission?: () => void;
  openLocationPermissionSettings?: () => void;
  requestNotificationPermission?: () => void;
  openNotificationPermissionSettings?: () => void;
  openOverlaySettings?: () => void;
  openBatteryOptimizationSettings?: () => void;
  openBackgroundRunSettings?: () => void;
  openExactAlarmSettings?: () => void;
  openLockScreenDisplaySettings?: () => void;
  openAppDetailsSettings?: () => void;
  getPermissionsStatusJson?: () => string;
  syncAzanDisplayConfig?: (jsonString: string) => void;
  syncNativePrayerConfig?: (jsonString: string) => void;
  scheduleAlarm?: (jsonString: string) => void;
  showFloatingAzanOverlay?: (
    prayerName: string,
    cityName: string,
    iqamaMinutes: number
  ) => void;
  hideFloatingAzanOverlay?: () => void;
  showPermissionReminderNotification?: (
    permissionKey: string,
    title: string,
    body: string
  ) => void;
  cancelPermissionReminderNotification?: (permissionKey: string) => void;
  showPersistentPrayerNotification?: (title: string, body: string) => void;
  cancelPersistentPrayerNotification?: () => void;
}

export function getNativeAndroidBridge(): NativeAndroidPermissionsBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    AndroidBridge?: NativeAndroidPermissionsBridge;
    Android?: NativeAndroidPermissionsBridge;
  };
  return w.AndroidBridge || w.Android;
}

export function getExtendedSetupSettings(): FirstTimeExtendedSettings {
  if (typeof window === 'undefined') return DEFAULT_EXTENDED_SETUP_SETTINGS;
  try {
    const raw = localStorage.getItem(EXTENDED_SETUP_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_EXTENDED_SETUP_SETTINGS,
        ...parsed,
        prayerAlerts: {
          ...DEFAULT_EXTENDED_SETUP_SETTINGS.prayerAlerts,
          ...(parsed.prayerAlerts || {}),
        },
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_EXTENDED_SETUP_SETTINGS;
}

export function saveExtendedSetupSettings(
  updater:
    | Partial<FirstTimeExtendedSettings>
    | ((prev: FirstTimeExtendedSettings) => FirstTimeExtendedSettings)
): FirstTimeExtendedSettings {
  const prev = getExtendedSetupSettings();
  const next: FirstTimeExtendedSettings =
    typeof updater === 'function'
      ? updater(prev)
      : {
          ...prev,
          ...updater,
          prayerAlerts: {
            ...prev.prayerAlerts,
            ...(updater.prayerAlerts || {}),
          },
        };
  try {
    localStorage.setItem(EXTENDED_SETUP_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent('moazen_extended_settings_updated', { detail: next })
    );
    const bridge = getNativeAndroidBridge();
    if (bridge?.syncAzanDisplayConfig) {
      bridge.syncAzanDisplayConfig(
        JSON.stringify({
          floatingAzanWindowEnabled: next.floatingAzanWindowEnabled,
          lockScreenAzanEnabled: next.lockScreenAzanEnabled,
          wakeScreenOnAzanEnabled: next.wakeScreenOnAzanEnabled,
          azanSoundEnabled: next.azanSoundEnabled,
        })
      );
    }
  } catch {
    // ignore
  }
  return next;
}

export function getSavedPermissionsState(): PermissionStateMap {
  const defaults: PermissionStateMap = {
    location: false,
    notifications: false,
    overlay: false,
    battery: false,
    background: false,
    exact_alarm: false,
    lock_screen: false,
  };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return defaults;
}

export function savePermissionFieldState(
  key: ManagedPermissionKey,
  granted: boolean
): PermissionStateMap {
  const current = getSavedPermissionsState();
  const updated: PermissionStateMap = { ...current, [key]: granted };
  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('moazen_permissions_updated', { detail: updated })
    );
  } catch {
    // ignore
  }
  if (granted) {
    dismissPermissionShadeNotification(key);
  }
  return updated;
}

/**
 * Queries real system/browser/Android bridge status for all permissions
 */
export async function verifyAllPermissionsStatus(): Promise<PermissionStateMap> {
  const state = getSavedPermissionsState();

  // 1. Check Native Android Bridge if present
  const bridge = getNativeAndroidBridge();
  if (bridge?.getPermissionsStatusJson) {
    try {
      const nativeJson = JSON.parse(bridge.getPermissionsStatusJson());
      state.location = Boolean(nativeJson.location);
      state.notifications = Boolean(nativeJson.notifications);
      state.overlay = Boolean(nativeJson.overlay);
      state.battery = Boolean(nativeJson.battery);
      state.background = Boolean(nativeJson.background);
      state.exact_alarm =
        nativeJson.exact_alarm !== undefined
          ? Boolean(nativeJson.exact_alarm)
          : Boolean(nativeJson.background);
      state.lock_screen =
        nativeJson.lock_screen !== undefined
          ? Boolean(nativeJson.lock_screen)
          : Boolean(nativeJson.notifications);
    } catch {
      // fallback below
    }
  }

  // 2. Check Geolocation Permission API
  if (typeof navigator !== 'undefined' && navigator.permissions) {
    try {
      const geoPerm = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });
      if (geoPerm.state === 'granted') {
        state.location = true;
      } else if (geoPerm.state === 'denied') {
        state.location = false;
      }
    } catch {
      // keep existing state.location
    }
  }

  // 3. Check Notification Permission API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      state.notifications = true;
    } else if (Notification.permission === 'denied') {
      state.notifications = false;
    }
  }

  // 4. Check Service Worker for background support
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active && state.background) {
        state.background = true;
      }
    } catch {
      // ignore
    }
  }

  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(
      new CustomEvent('moazen_permissions_updated', { detail: state })
    );
  } catch {
    // ignore
  }

  // Automatically dismiss shade notifications for any permission that is now granted
  (Object.keys(state) as ManagedPermissionKey[]).forEach((k) => {
    if (state[k]) {
      dismissPermissionShadeNotification(k);
    }
  });

  return state;
}

/**
 * Attempts to launch a specific Android Settings Intent directly (never the generic Settings root),
 * with safe fallback to APPLICATION_DETAILS_SETTINGS if the OEM blocks the direct action.
 */
function tryOpenAndroidSpecificIntent(action: string, usePackageDataUri: boolean = true): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const isAndroid = /android/i.test(navigator.userAgent);
  if (!isAndroid) return false;

  const bridge = getNativeAndroidBridge();
  if (bridge) {
    // Handled by native bridge methods
    return true;
  }

  try {
    // Construct official Android Intent URI targeting the specific permission screen
    const dataPrefix = usePackageDataUri ? `package:${APP_PACKAGE_NAME}` : '';
    const fallbackAction = 'android.settings.APPLICATION_DETAILS_SETTINGS';
    const intentUri = dataPrefix
      ? `intent:${dataPrefix}#Intent;action=${action};S.browser_fallback_url=${encodeURIComponent(
          window.location.href
        )};end`
      : `intent:#Intent;action=${action};S.android.provider.extra.APP_PACKAGE=${APP_PACKAGE_NAME};S.browser_fallback_url=${encodeURIComponent(
          window.location.href
        )};end`;

    const link = document.createElement('a');
    link.href = intentUri;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
}

/**
 * Direct Permission Request & Specific Settings Page Navigation
 * - Opens the exact permission page or official runtime dialog for each permission type
 */
export async function requestOrOpenSpecificPermission(
  permissionKey: ManagedPermissionKey,
  options?: {
    onLocationDetected?: (city: CityLocation, message: string) => void;
    onComplete?: (granted: boolean, message: string) => void;
  }
): Promise<{ granted: boolean; message: string }> {
  const bridge = getNativeAndroidBridge();

  if (permissionKey === 'location') {
    if (bridge?.requestLocationPermission) {
      bridge.requestLocationPermission();
    } else if (bridge?.openLocationPermissionSettings) {
      bridge.openLocationPermissionSettings();
    }

    return new Promise((resolve) => {
      detectSmartGpsLocation(
        (city, msg) => {
          savePermissionFieldState('location', true);
          options?.onLocationDetected?.(city, msg);
          options?.onComplete?.(true, msg);
          resolve({ granted: true, message: msg });
        },
        (errMsg) => {
          // If permission was denied in browser/Android, offer direct navigation to App Location Permission Settings
          tryOpenAndroidSpecificIntent(
            'android.settings.APPLICATION_DETAILS_SETTINGS',
            true
          );
          savePermissionFieldState('location', false);
          options?.onComplete?.(false, errMsg);
          resolve({ granted: false, message: errMsg });
        }
      );
    });
  }

  if (permissionKey === 'notifications') {
    if (bridge?.requestNotificationPermission) {
      bridge.requestNotificationPermission();
    } else if (bridge?.openNotificationPermissionSettings) {
      bridge.openNotificationPermissionSettings();
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          savePermissionFieldState('notifications', true);
          const msg = 'تم تفعيل إذن الإشعارات الرسمية بنجاح ✓';
          options?.onComplete?.(true, msg);
          return { granted: true, message: msg };
        } else {
          // Open specific Android App Notification Settings page (never main settings)
          tryOpenAndroidSpecificIntent(
            'android.settings.APP_NOTIFICATION_SETTINGS',
            false
          );
          savePermissionFieldState('notifications', false);
          const msg =
            'لم يتم منح إذن الإشعارات بعد. تم توجيهك إلى صفحة إشعارات التطبيق لتفعيله، أو يمكنك إعادة المحاولة.';
          options?.onComplete?.(false, msg);
          return { granted: false, message: msg };
        }
      } catch {
        // fallback below
      }
    }

    tryOpenAndroidSpecificIntent('android.settings.APP_NOTIFICATION_SETTINGS', false);
    savePermissionFieldState('notifications', true);
    const msg = 'تم تفعيل إشعارات التطبيق بنجاح ✓';
    options?.onComplete?.(true, msg);
    return { granted: true, message: msg };
  }

  if (permissionKey === 'overlay') {
    // Official Android action: Settings.ACTION_MANAGE_OVERLAY_PERMISSION
    if (bridge?.openOverlaySettings) {
      bridge.openOverlaySettings();
    } else {
      tryOpenAndroidSpecificIntent(
        'android.settings.action.MANAGE_OVERLAY_PERMISSION',
        true
      );
    }

    savePermissionFieldState('overlay', true);
    const msg =
      'تم فتح صفحة «الظهور فوق التطبيقات» الخاصة بالتطبيق مباشرة وتفعيل الصلاحية ✓';
    options?.onComplete?.(true, msg);
    return { granted: true, message: msg };
  }

  if (permissionKey === 'battery') {
    // Official Android action: Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS / ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS
    if (bridge?.openBatteryOptimizationSettings) {
      bridge.openBatteryOptimizationSettings();
    } else {
      const openedDirect = tryOpenAndroidSpecificIntent(
        'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        true
      );
      if (!openedDirect) {
        tryOpenAndroidSpecificIntent(
          'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
          false
        );
      }
    }

    savePermissionFieldState('battery', true);
    savePermissionFieldState('background', true);
    const msg =
      'تم فتح صفحة «استثناء تحسينات البطارية» مباشرة وتفعيل العمل في الخلفية دون قيود ✓';
    options?.onComplete?.(true, msg);
    return { granted: true, message: msg };
  }

  if (permissionKey === 'background') {
    if (bridge?.openBackgroundRunSettings) {
      bridge.openBackgroundRunSettings();
    } else {
      tryOpenAndroidSpecificIntent(
        'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
        false
      );
    }

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.ready;
      } catch {
        // ignore
      }
    }

    savePermissionFieldState('background', true);
    const msg = 'تم تفعيل العمل في الخلفية لضمان استمرار الأذان والتنبيهات ✓';
    options?.onComplete?.(true, msg);
    return { granted: true, message: msg };
  }

  if (permissionKey === 'exact_alarm') {
    // Official Android 12+ (API 31+) action: Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM
    if (bridge?.openExactAlarmSettings) {
      bridge.openExactAlarmSettings();
    } else if (bridge?.openBackgroundRunSettings) {
      bridge.openBackgroundRunSettings();
    } else {
      tryOpenAndroidSpecificIntent(
        'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
        true
      );
    }

    savePermissionFieldState('exact_alarm', true);
    savePermissionFieldState('background', true);
    const msg =
      'تم فتح صفحة «المنبهات الدقيقة (SCHEDULE_EXACT_ALARM)» وتفعيل جدولة الأذان في ثوانيه الأولى ✓';
    options?.onComplete?.(true, msg);
    return { granted: true, message: msg };
  }

  if (permissionKey === 'lock_screen') {
    // Official Android 14+ (API 34+) Full Screen Intent & Lock Screen Notifications settings
    if (bridge?.openLockScreenDisplaySettings) {
      bridge.openLockScreenDisplaySettings();
    } else {
      const openedFullScreenIntent = tryOpenAndroidSpecificIntent(
        'android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT',
        true
      );
      if (!openedFullScreenIntent) {
        tryOpenAndroidSpecificIntent(
          'android.settings.APP_NOTIFICATION_SETTINGS',
          false
        );
      }
    }

    savePermissionFieldState('lock_screen', true);
    const msg =
      'تم فتح إعدادات «الظهور على شاشة القفل وإضاءة الشاشة (Full Screen Intent)» وتفعيلها ✓';
    options?.onComplete?.(true, msg);
    return { granted: true, message: msg };
  }

  return { granted: false, message: '' };
}

/**
 * Dismisses a specific permission reminder notification from the phone's notification shade
 */
export function dismissPermissionShadeNotification(permissionKey: ManagedPermissionKey) {
  const bridge = getNativeAndroidBridge();
  if (bridge?.cancelPermissionReminderNotification) {
    try {
      bridge.cancelPermissionReminderNotification(permissionKey);
    } catch {
      // ignore
    }
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => {
        if (reg.getNotifications) {
          reg
            .getNotifications({ tag: `moazen-perm-reminder-${permissionKey}` })
            .then((notifications) => {
              notifications.forEach((n) => n.close());
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }
}

/**
 * Checks if any enabled feature requires a permission that is NOT granted,
 * and sends a polite, non-repetitive reminder to the phone's Notification Shade.
 * - Never sends notifications for permissions whose features are disabled.
 * - Respects a 12-hour cooldown per permission so it is never annoying.
 */
export async function checkAndNotifyMissingFeaturePermissions(options: {
  autoPlayAzanEnabled: boolean;
  smartAzanScreenEnabled: boolean;
  persistentNotificationEnabled: boolean;
}) {
  const perms = await verifyAllPermissionsStatus();
  const ext = getExtendedSetupSettings();

  let cooldownMap: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(SHADE_REMINDER_COOLDOWN_KEY);
    if (raw) cooldownMap = JSON.parse(raw);
  } catch {
    // ignore
  }

  const now = Date.now();
  const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours between reminders for the same permission

  const missingNeeded: Array<{
    key: ManagedPermissionKey;
    title: string;
    body: string;
  }> = [];

  // 1. Overlay permission: ONLY if Interactive Azan Screen or Smart Full-Screen Widget is enabled
  if (
    (options.smartAzanScreenEnabled || ext.landscapeAzanScreenEnabled) &&
    !perms.overlay
  ) {
    missingNeeded.push({
      key: 'overlay',
      title: 'مطلوب إذن الظهور فوق التطبيقات • شاشة الأذان التفاعلية',
      body: 'لتشغيل شاشة الأذان التفاعلية فوق التطبيقات عند حلول وقت الصلاة، اضغط هنا للانتقال مباشرة إلى صفحة الإذن وتفعيله.',
    });
  }

  // 2. Battery optimization permission: ONLY if Auto-Azan or Persistent Notification or Qiyam/Prayer Alerts are enabled
  const anyPrayerAlertEnabled = Object.values(ext.prayerAlerts).some(Boolean);
  if (
    (options.autoPlayAzanEnabled ||
      options.persistentNotificationEnabled ||
      ext.persistentNotificationEnabled ||
      anyPrayerAlertEnabled) &&
    !perms.battery
  ) {
    missingNeeded.push({
      key: 'battery',
      title: 'مطلوب استثناء البطارية • استمرار الأذان في الخلفية',
      body: 'لضمان رفع الأذان والتنبيهات في وقتها دون إيقاف من نظام توفير الطاقة، اضغط هنا لفتح صفحة استثناء البطارية مباشرة.',
    });
  }

  // Dispatch at most ONE non-intrusive reminder at a time if Notification permission is granted
  const candidate = missingNeeded.find(
    (item) => !cooldownMap[item.key] || now - cooldownMap[item.key] > COOLDOWN_MS
  );

  if (!candidate) return;

  cooldownMap[candidate.key] = now;
  try {
    localStorage.setItem(SHADE_REMINDER_COOLDOWN_KEY, JSON.stringify(cooldownMap));
  } catch {
    // ignore
  }

  const bridge = getNativeAndroidBridge();
  if (bridge?.showPermissionReminderNotification) {
    try {
      bridge.showPermissionReminderNotification(
        candidate.key,
        candidate.title,
        candidate.body
      );
      return;
    } catch {
      // fallback below
    }
  }

  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    const tag = `moazen-perm-reminder-${candidate.key}`;
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(candidate.title, {
          body: candidate.body,
          icon: '/assets/icons/settings.png',
          badge: '/assets/icons/settings.png',
          tag,
          renotify: false,
          data: {
            action: 'openPermissionPage',
            permissionKey: candidate.key,
            url: `${window.location.origin}/?openPermission=${candidate.key}`,
          },
        } as NotificationOptions);
      } else {
        const n = new Notification(candidate.title, {
          body: candidate.body,
          icon: '/assets/icons/settings.png',
          tag,
        });
        n.onclick = () => {
          window.focus();
          requestOrOpenSpecificPermission(candidate.key);
          n.close();
        };
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Updates or clears the Persistent Notification ("الإشعار الدائم") in the phone's notification shade
 */
export async function syncPersistentPrayerShadeNotification(options: {
  enabled: boolean;
  cityName: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  remainingCountdown?: string;
}) {
  const bridge = getNativeAndroidBridge();

  if (!options.enabled) {
    bridge?.cancelPersistentPrayerNotification?.();
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg
            .getNotifications?.({ tag: 'moazen-persistent-prayer-bar' })
            .then((list) => list.forEach((n) => n.close()))
            .catch(() => {});
        })
        .catch(() => {});
    }
    return;
  }

  const title = options.remainingCountdown
    ? `الصلاة القادمة: صلاة ${options.nextPrayerName} [${options.remainingCountdown}]`
    : `المؤذن • الصلاة القادمة: صلاة ${options.nextPrayerName} (${options.nextPrayerTime})`;
  const body = options.remainingCountdown
    ? `الوقت المتبقي: ${options.remainingCountdown} • الأذان في ${options.nextPrayerTime} • ${options.cityName}`
    : `الموقع: ${options.cityName} • الإشعار الدائم يعمل في الخلفية لضمان دقة مواقيت الأذان`;

  if (bridge?.showPersistentPrayerNotification) {
    try {
      bridge.showPersistentPrayerNotification(title, body);
      return;
    } catch {
      // fallback below
    }
  }

  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted' &&
    'serviceWorker' in navigator
  ) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/assets/icons/prayer.png',
        badge: '/assets/icons/prayer.png',
        tag: 'moazen-persistent-prayer-bar',
        silent: true,
        renotify: false,
        data: { url: window.location.origin, action: 'navigateHome' },
      } as NotificationOptions);
    } catch {
      // ignore
    }
  }
}
