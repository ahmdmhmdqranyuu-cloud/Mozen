/**
 * Core Reminder Scheduling Engine for:
 * - أذكار الصباح (Morning Azkar)
 * - أذكار المساء (Evening Azkar)
 * - الصلاة على النبي ﷺ (Salawat)
 * - المسحراتي (Musaharati)
 * - مدفع الإفطار (Iftar Cannon - Ramadan only, 10s before Maghrib)
 */

import {
  ComprehensiveRemindersSettings,
  DEFAULT_REMINDERS_SETTINGS,
  MorningAzkarSettings,
  EveningAzkarSettings,
  SalawatSettings,
  MusaharatiSettings,
  IftarCannonSettings,
} from '../types/reminders';
import { CityLocation, UserProfile } from '../types';
import { calculatePrayerTimes, calculateNightThirds } from './prayerTimes';
import { getPrayerConfig, loadStoredPrayerConfigs } from './prayerSettings';
import { soundService } from './audioPlayer';

const STORAGE_KEY = 'azan_comprehensive_reminders_v1';
const FIRED_STORAGE_KEY = 'moazen_fired_reminders_v2';

export interface ScheduledSlot {
  section:
    | 'morningAzkar'
    | 'eveningAzkar'
    | 'salawat'
    | 'musaharati'
    | 'iftarCannon'
    | 'prePrayerAlert'
    | 'qiyamFirstThird'
    | 'qiyamLastThird'
    | 'ruqyah';
  title: string;
  body: string;
  triggerTime: Date;
  audioTrackId: string;
  autoPlay: boolean;
  repeatIntervalMs?: number;
  prayerKey?: string;
  prayerName?: string;
  prayerTimestamp?: Date;
}


/**
 * Checks if current date falls within Ramadan using the Islamic Um-Al-Qura Calendar
 */
export function isRamadanMonth(date: Date = new Date()): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      month: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const monthPart = parts.find((p) => p.type === 'month');
    if (monthPart && parseInt(monthPart.value, 10) === 9) {
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const formatter2 = new Intl.DateTimeFormat('en-u-ca-islamic', {
      month: 'numeric',
    });
    const parts2 = formatter2.formatToParts(date);
    const monthPart2 = parts2.find((p) => p.type === 'month');
    if (monthPart2 && parseInt(monthPart2.value, 10) === 9) {
      return true;
    }
  } catch {
    // fallback
  }

  return false;
}

export function getHijriMonthName(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return formatter.format(date);
  } catch {
    return 'التقويم الهجري';
  }
}

export interface SalawatDailyWindow {
  start: Date;
  end: Date;
  startTimeStr: string;
  endTimeStr: string;
  isAutoAfterFajrIqama: boolean;
}

/**
 * Computes the effective daily active window for Salawat:
 * - When autoAfterFajrIqama is enabled and city is known:
 *   starts at (Fajr Azan + Fajr Iqama minutes + 1 minute) and runs until 23:59:59.999 (midnight 00:00).
 * - Otherwise uses manual startTime -> endTime (defaulting endTime to midnight if 00:00/23:59).
 */
export function computeSalawatWindowForDate(
  baseDate: Date,
  config: SalawatSettings,
  city: CityLocation | null,
  profile: UserProfile | null
): SalawatDailyWindow {
  const autoEnabled = config.autoAfterFajrIqama !== false;
  if (autoEnabled && city) {
    const prayers = calculatePrayerTimes(
      city,
      baseDate,
      profile?.calculationMethod || 'egypt',
      profile?.asrJuristicMethod || 'standard',
      profile?.manualPrayerAdjustments || {},
      profile?.dstMode,
      profile?.highLatitudeRule || 'angle_based'
    );
    const fajr = prayers.find((p) => p.key === 'fajr');
    if (fajr) {
      const fajrIqamaMin = profile?.iqamaIntervals?.fajr ?? 15;
      const start = new Date(fajr.timestamp.getTime() + (fajrIqamaMin + 1) * 60 * 1000);
      const end = new Date(baseDate);
      end.setHours(23, 59, 59, 999);
      const startH = start.getHours().toString().padStart(2, '0');
      const startM = start.getMinutes().toString().padStart(2, '0');
      return {
        start,
        end,
        startTimeStr: `${startH}:${startM}`,
        endTimeStr: '23:59',
        isAutoAfterFajrIqama: true,
      };
    }
  }

  const [startH, startM] = (config.startTime || '06:00').split(':').map(Number);
  const start = new Date(baseDate);
  start.setHours(Number.isFinite(startH) ? startH : 6, Number.isFinite(startM) ? startM : 0, 0, 0);

  const rawEnd = config.endTime || '23:59';
  const [endH, endM] = rawEnd.split(':').map(Number);
  const end = new Date(baseDate);
  if (rawEnd === '00:00') {
    end.setHours(23, 59, 59, 999);
  } else {
    end.setHours(Number.isFinite(endH) ? endH : 23, Number.isFinite(endM) ? endM : 59, 59, 999);
  }

  return {
    start,
    end,
    startTimeStr: config.startTime || '06:00',
    endTimeStr: rawEnd,
    isAutoAfterFajrIqama: false,
  };
}

export interface RescheduleLogEntry {
  timestamp: string;
  reason: string;
  cancelledTimers: number;
  clearedFiredKeys: number;
  scheduledSlots: number;
  cityName: string;
  methodId: string;
}

class ReminderScheduler {
  private settings: ComprehensiveRemindersSettings = DEFAULT_REMINDERS_SETTINGS;
  private currentCity: CityLocation | null = null;
  private currentUserProfile: UserProfile | null = null;
  private checkIntervalId: ReturnType<typeof setInterval> | null = null;
  private activeTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private firedKeySet: Set<string> = new Set();
  private rescheduleLog: RescheduleLogEntry[] = [];
  private listeners: Set<(settings: ComprehensiveRemindersSettings) => void> = new Set();

  constructor() {
    this.loadSettings();
    this.loadFiredHistory();
    this.initVisibilityAndFocusListeners();
    this.startPeriodicTick();
  }

  private resolveUserProfile(): UserProfile | null {
    if (this.currentUserProfile) return this.currentUserProfile;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('azan_user_profile');
        if (raw) return JSON.parse(raw) as UserProfile;
      }
    } catch {
      // ignore
    }
    return null;
  }

  public getRescheduleLogs(): RescheduleLogEntry[] {
    return [...this.rescheduleLog];
  }

  public getActiveTimerCount(): number {
    return this.activeTimeouts.size;
  }

  public getFiredKeysSnapshot(): string[] {
    return Array.from(this.firedKeySet);
  }

  public subscribe(listener: (settings: ComprehensiveRemindersSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn(this.settings));
  }

  public getSettings(): ComprehensiveRemindersSettings {
    return { ...this.settings };
  }

  public setUserProfile(profile: UserProfile) {
    this.currentUserProfile = profile;
    if (profile.city) {
      this.currentCity = profile.city;
    }
  }

  public setCity(city: CityLocation) {
    const cityChanged =
      !this.currentCity ||
      this.currentCity.id !== city.id ||
      this.currentCity.latitude !== city.latitude ||
      this.currentCity.longitude !== city.longitude;
    this.currentCity = city;
    if (cityChanged) {
      this.cancelAndRescheduleAll('city_changed');
    } else {
      this.rescheduleAll();
    }
  }

  public updateSettings(
    updater: (prev: ComprehensiveRemindersSettings) => ComprehensiveRemindersSettings
  ) {
    this.settings = updater(this.settings);
    this.saveSettings();
    this.rescheduleAll();
    this.notifyListeners();
  }

  public updateSection<
    K extends Exclude<
      keyof ComprehensiveRemindersSettings,
      'hasCompletedFirstTimeSetup' | 'azkarVolumePercent'
    >
  >(
    section: K,
    data: Partial<ComprehensiveRemindersSettings[K]>
  ) {
    this.settings = {
      ...this.settings,
      [section]: {
        ...this.settings[section],
        ...data,
      },
    };
    this.saveSettings();
    this.rescheduleAll();
    this.notifyListeners();
  }

  public setCompletedFirstTimeSetup(completed: boolean = true) {
    this.settings = {
      ...this.settings,
      hasCompletedFirstTimeSetup: completed,
    };
    this.saveSettings();
    this.notifyListeners();
  }

  private loadSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isV2 = parsed.defaultsVersion === 2;
        const rawMorning = parsed.morningAzkar || {};
        const rawEvening = parsed.eveningAzkar || {};
        const rawSalawat = parsed.salawat || {};

        const upgradedMorningStart =
          !isV2 && rawMorning.startTime === '06:30'
            ? '08:00'
            : rawMorning.startTime || DEFAULT_REMINDERS_SETTINGS.morningAzkar.startTime;
        const upgradedEveningStart =
          !isV2 && rawEvening.startTime === '17:00'
            ? '21:00'
            : rawEvening.startTime || DEFAULT_REMINDERS_SETTINGS.eveningAzkar.startTime;
        const upgradedSalawatEnd =
          !isV2 && rawSalawat.endTime === '22:00'
            ? '23:59'
            : rawSalawat.endTime || DEFAULT_REMINDERS_SETTINGS.salawat.endTime;

        this.settings = {
          ...DEFAULT_REMINDERS_SETTINGS,
          ...parsed,
          defaultsVersion: 2,
          azkarVolumePercent: parsed.azkarVolumePercent ?? 100,
          morningAzkar: {
            ...DEFAULT_REMINDERS_SETTINGS.morningAzkar,
            ...rawMorning,
            startTime: upgradedMorningStart,
            volumePercent: rawMorning.volumePercent ?? parsed.azkarVolumePercent ?? 100,
            autoPlaySound: true,
          },
          eveningAzkar: {
            ...DEFAULT_REMINDERS_SETTINGS.eveningAzkar,
            ...rawEvening,
            startTime: upgradedEveningStart,
            volumePercent: rawEvening.volumePercent ?? parsed.azkarVolumePercent ?? 100,
            autoPlaySound: true,
          },
          salawat: {
            ...DEFAULT_REMINDERS_SETTINGS.salawat,
            ...rawSalawat,
            autoAfterFajrIqama: isV2 ? (rawSalawat.autoAfterFajrIqama ?? true) : true,
            endTime: upgradedSalawatEnd,
            volumePercent: rawSalawat.volumePercent ?? 85,
            autoPlaySound: true,
          },
          musaharati: { ...DEFAULT_REMINDERS_SETTINGS.musaharati, ...parsed.musaharati },
          iftarCannon: {
            ...DEFAULT_REMINDERS_SETTINGS.iftarCannon,
            ...parsed.iftarCannon,
            leadTimeSeconds: 16,
          },
          imsakReminder: {
            ...DEFAULT_REMINDERS_SETTINGS.imsakReminder,
            ...(parsed.imsakReminder || {}),
          },
          iftarReminder: {
            ...DEFAULT_REMINDERS_SETTINGS.iftarReminder,
            ...(parsed.iftarReminder || {}),
          },
          prePrayerAlert: {
            ...DEFAULT_REMINDERS_SETTINGS.prePrayerAlert,
            ...(parsed.prePrayerAlert || {}),
          },
          qiyam: {
            ...DEFAULT_REMINDERS_SETTINGS.qiyam,
            ...(parsed.qiyam || {}),
          },
          ruqyah: {
            ...DEFAULT_REMINDERS_SETTINGS.ruqyah,
            ...(parsed.ruqyah || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to load reminders settings:', e);
      this.settings = DEFAULT_REMINDERS_SETTINGS;
    }
  }

  private saveSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...this.settings, defaultsVersion: 2 })
      );
    } catch (e) {
      console.warn('Failed to save reminders settings:', e);
    }
  }

  private loadFiredHistory() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(FIRED_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          this.firedKeySet = new Set(arr);
        }
      }
    } catch {
      // ignore
    }
  }

  private markAsFired(slotKey: string) {
    this.firedKeySet.add(slotKey);
    try {
      // Keep up to 300 items in history
      const list = Array.from(this.firedKeySet).slice(-300);
      localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  private initVisibilityAndFocusListeners() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // Immediately re-evaluate schedule when user returns
          this.checkAndTriggerDueReminders();
        }
      });
      window.addEventListener('focus', () => {
        this.checkAndTriggerDueReminders();
      });
    }
  }

  private startPeriodicTick() {
    if (this.checkIntervalId) clearInterval(this.checkIntervalId);
    // Tick every 1 second to accurately catch second-level triggers (such as 16s before Maghrib)
    this.checkIntervalId = setInterval(() => {
      this.checkAndTriggerDueReminders();
    }, 1000);
  }

  /**
   * Cancels all pending timers, clears stale prayer/pre-prayer fired keys on configuration change,
   * recalculates schedules using the latest city/method/Asr/offsets/DST, and records a bounded log.
   */
  public cancelAndRescheduleAll(
    reason: string = 'settings_changed',
    profile?: UserProfile
  ): { cancelledTimers: number; clearedFiredKeys: number; scheduledSlots: number } {
    if (profile) {
      this.setUserProfile(profile);
    }

    const cancelledTimers = this.activeTimeouts.size;
    // Compute & arm replacement schedule first; if calculation throws, prior timers & state remain intact.
    const upcomingSlots = this.rescheduleAll();

    let clearedFiredKeys = 0;
    const keysToDelete: string[] = [];
    this.firedKeySet.forEach((key) => {
      if (
        key.startsWith('preprayer_') ||
        key.startsWith('prePrayerAlert_') ||
        key.startsWith('iftarCannon_') ||
        key.startsWith('qiyamFirstThird_') ||
        key.startsWith('qiyamLastThird_')
      ) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((k) => {
      this.firedKeySet.delete(k);
      clearedFiredKeys++;
    });

    if (clearedFiredKeys > 0) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            FIRED_STORAGE_KEY,
            JSON.stringify(Array.from(this.firedKeySet).slice(-300))
          );
        }
      } catch {
        // ignore
      }
    }

    const resolved = this.resolveUserProfile();

    this.rescheduleLog.push({
      timestamp: new Date().toISOString(),
      reason,
      cancelledTimers,
      clearedFiredKeys,
      scheduledSlots: upcomingSlots.length,
      cityName: this.currentCity?.name || resolved?.city?.name || 'غير محدد',
      methodId: resolved?.calculationMethod || 'egypt',
    });
    if (this.rescheduleLog.length > 40) {
      this.rescheduleLog.splice(0, this.rescheduleLog.length - 40);
    }

    return {
      cancelledTimers,
      clearedFiredKeys,
      scheduledSlots: upcomingSlots.length,
    };
  }

  /**
   * Reschedules all active timers cleanly, only replacing existing timers after new slots succeed
   */
  public rescheduleAll(): ScheduledSlot[] {
    // 1. Compute replacement slots BEFORE tearing down valid active timers
    const upcomingSlots = this.calculateUpcomingSlots();

    // 2. Sync with native Android bridge if running in Android app
    this.syncWithAndroidBridge(upcomingSlots);

    // 3. Only now cancel old timers and arm replacement timers
    this.activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.activeTimeouts.clear();

    const now = new Date();
    upcomingSlots.forEach((slot) => {
      const diffMs = slot.triggerTime.getTime() - now.getTime();
      // If within the next 24 hours
      if (diffMs > 0 && diffMs < 24 * 3600000) {
        const key = `${slot.section}_${slot.prayerKey || 'slot'}_${slot.triggerTime.getTime()}`;
        const tId = setTimeout(() => {
          const slotKey = `${slot.section}_${slot.prayerKey || 'slot'}_${slot.triggerTime.toISOString().substring(0, 19)}`;
          if (!this.firedKeySet.has(slotKey)) {
            this.markAsFired(slotKey);
            this.triggerSlot(slot);
          }
        }, diffMs);
        this.activeTimeouts.set(key, tId);
      }
    });

    return upcomingSlots;
  }

  /**
   * Computes the scheduled triggers for the next 24-48 hours based on user configuration
   */
  public calculateUpcomingSlots(referenceDate: Date = new Date()): ScheduledSlot[] {
    const slots: ScheduledSlot[] = [];

    // 1. Morning Azkar
    if (this.settings.morningAzkar.enabled) {
      slots.push(...this.computeAzkarSlots('morningAzkar', this.settings.morningAzkar, referenceDate));
    }

    // 2. Evening Azkar
    if (this.settings.eveningAzkar.enabled) {
      slots.push(...this.computeAzkarSlots('eveningAzkar', this.settings.eveningAzkar, referenceDate));
    }

    // 3. Salawat
    if (this.settings.salawat.enabled) {
      slots.push(...this.computeAzkarSlots('salawat', this.settings.salawat, referenceDate));
    }

    // 4. Musaharati
    if (this.settings.musaharati.enabled) {
      slots.push(...this.computeMusaharatiSlots(this.settings.musaharati, referenceDate));
    }

    // 5. Iftar Cannon (Ramadan, 16s before Maghrib)
    if (this.settings.iftarCannon.enabled && this.currentCity) {
      slots.push(...this.computeIftarCannonSlots(this.settings.iftarCannon, referenceDate));
    }

    // 6. Pre-Prayer 15-Minute Warning: «إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا»
    if (this.settings.prePrayerAlert?.enabled && this.currentCity) {
      slots.push(...this.computePrePrayerAlertSlots(referenceDate));
    }

    // 7. Qiyam al-Layl (First Third & Last Third of Night)
    if (
      this.currentCity &&
      (this.settings.qiyam?.firstThirdEnabled || this.settings.qiyam?.lastThirdEnabled)
    ) {
      slots.push(...this.computeQiyamSlots(referenceDate));
    }

    // Sort chronologically
    return slots.sort((a, b) => a.triggerTime.getTime() - b.triggerTime.getTime());
  }


  private computeAzkarSlots(
    section: 'morningAzkar' | 'eveningAzkar' | 'salawat',
    config: MorningAzkarSettings | EveningAzkarSettings | SalawatSettings,
    referenceDate: Date
  ): ScheduledSlot[] {
    const results: ScheduledSlot[] = [];
    const daysToCheck = [0, 1, 2, 3, 4, 5, 6]; // Full 7 days continuously
    const prof = this.resolveUserProfile();

    daysToCheck.forEach((dayOffset) => {
      const baseDate = new Date(referenceDate);
      baseDate.setDate(baseDate.getDate() + dayOffset);

      let startDate: Date;
      let endDate: Date;

      if (section === 'salawat') {
        const win = computeSalawatWindowForDate(
          baseDate,
          config as SalawatSettings,
          this.currentCity,
          prof
        );
        startDate = win.start;
        endDate = win.end;
      } else {
        const [startH, startM] = config.startTime.split(':').map(Number);
        startDate = new Date(baseDate);
        startDate.setHours(Number.isFinite(startH) ? startH : 0, Number.isFinite(startM) ? startM : 0, 0, 0);

        const [endH, endM] = config.endTime.split(':').map(Number);
        endDate = new Date(baseDate);
        endDate.setHours(Number.isFinite(endH) ? endH : 23, Number.isFinite(endM) ? endM : 59, 59, 999);
      }

      let title = '';
      let body = '';
      if (section === 'morningAzkar') {
        title = 'أذكار الصباح المباركة';
        body = 'أصبحنا وأصبح الملك لله والحمد لله.. حان وقت أذكار الصباح لحفظك ويومك المبارك.';
      } else if (section === 'eveningAzkar') {
        title = 'أذكار المساء المباركة';
        body = 'أمسينا وأمسى الملك لله والحمد لله.. حان وقت أذكار المساء لطمأنينة القلب وحفظ الأهل.';
      } else {
        title = 'الصلاة على النبي ﷺ';
        body = '«إن الله وملائكته يصلون على النبي يا أيها الذين آمنوا صلوا عليه وسلموا تسليما».';
      }

      // Morning and Evening Azkar trigger strictly once per day at their designated start time
      if (section === 'morningAzkar' || section === 'eveningAzkar' || config.repeatType === 'once') {
        if (startDate.getTime() >= referenceDate.getTime() - 60000) {
          results.push({
            section,
            title,
            body,
            triggerTime: startDate,
            audioTrackId: config.audioFile,
            autoPlay: true,
            repeatIntervalMs: 0,
          });
        }
      } else {
        // Repeating interval (e.g. Salawat every 1 min, 5 min, 15 min, 1 hour, etc.)
        const stepMs =
          config.repeatInterval * (config.repeatUnit === 'hours' ? 3600000 : 60000);
        
        // Exact interval: minimum 1 minute (60,000 ms)
        const validStepMs = Math.max(60000, stepMs);

        // When evaluating for today, start from the upcoming interval if startDate has already passed
        let currentMs = startDate.getTime();
        if (dayOffset === 0 && referenceDate.getTime() > currentMs) {
          const diff = referenceDate.getTime() - currentMs;
          const stepsToSkip = Math.floor(diff / validStepMs) + 1;
          currentMs += stepsToSkip * validStepMs;
        }

        let current = new Date(currentMs);
        let iteration = 0;
        // Generate discrete slots ahead strictly within [startDate, endDate]
        while (current.getTime() <= endDate.getTime() && iteration < 120) {
          if (current.getTime() >= startDate.getTime() && current.getTime() > referenceDate.getTime()) {
            results.push({
              section,
              title,
              body,
              triggerTime: new Date(current),
              audioTrackId: config.audioFile,
              autoPlay: true,
              repeatIntervalMs: 0,
            });
          }
          current = new Date(current.getTime() + validStepMs);
          iteration++;
        }
      }
    });

    return results;
  }

  private computeMusaharatiSlots(
    config: MusaharatiSettings,
    referenceDate: Date
  ): ScheduledSlot[] {
    const results: ScheduledSlot[] = [];
    const daysToCheck = [0, 1, 2, 3, 4, 5, 6];

    daysToCheck.forEach((dayOffset) => {
      const baseDate = new Date(referenceDate);
      baseDate.setDate(baseDate.getDate() + dayOffset);

      if (config.onlyInRamadan && !isRamadanMonth(baseDate)) {
        return;
      }

      const [h, m] = config.time.split(':').map(Number);
      const triggerTime = new Date(baseDate);
      triggerTime.setHours(h || 3, m || 30, 0, 0);

      results.push({
        section: 'musaharati',
        title: 'نداء المسحراتي المبارك',
        body: 'اصحى يا نايم وحد الدايم.. تسحروا فإن في السحور بركة.',
        triggerTime,
        audioTrackId: config.audioFile,
        autoPlay: true,
      });
    });

    return results;
  }

  private computeIftarCannonSlots(
    config: IftarCannonSettings,
    referenceDate: Date
  ): ScheduledSlot[] {
    const results: ScheduledSlot[] = [];
    if (!this.currentCity) return results;

    const daysToCheck = [0, 1, 2, 3, 4, 5, 6];

    daysToCheck.forEach((dayOffset) => {
      const baseDate = new Date(referenceDate);
      baseDate.setDate(baseDate.getDate() + dayOffset);

      // Check Ramadan restriction
      const isRamadan = isRamadanMonth(baseDate);
      if (!isRamadan) {
        // Automatically active in the month of Ramadan
        return;
      }

      const prof = this.resolveUserProfile();
      const prayers = calculatePrayerTimes(
        this.currentCity!,
        baseDate,
        prof?.calculationMethod || 'egypt',
        prof?.asrJuristicMethod || 'standard',
        prof?.manualPrayerAdjustments || {},
        prof?.dstMode,
        prof?.highLatitudeRule || 'angle_based'
      );
      const maghribPrayer = prayers.find((p) => p.key === 'maghrib');
      if (!maghribPrayer) return;

      // Start EXACTLY 16 seconds before Maghrib Azan
      const leadSeconds = config.leadTimeSeconds || 16;
      const triggerTime = new Date(maghribPrayer.timestamp.getTime() - leadSeconds * 1000);

      results.push({
        section: 'iftarCannon',
        title: 'مدفع الإفطار .. اضرب!',
        body: 'ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله.. صوماً مقبولاً وإفطاراً شهياً.',
        triggerTime,
        audioTrackId: config.audioFile || 'iftar_cannon_1',
        autoPlay: true,
      });
    });

    return results;
  }

  private computePrePrayerAlertSlots(referenceDate: Date): ScheduledSlot[] {
    const results: ScheduledSlot[] = [];
    if (!this.currentCity) return results;

    const prof = this.resolveUserProfile();
    const storedConfigs = loadStoredPrayerConfigs();
    const defaultLeadMins = this.settings.prePrayerAlert?.minutesBeforePrayer || 15;

    [0, 1, 2, 3, 4, 5, 6].forEach((dayOffset) => {
      const baseDate = new Date(referenceDate);
      baseDate.setDate(baseDate.getDate() + dayOffset);
      const prayers = calculatePrayerTimes(
        this.currentCity!,
        baseDate,
        prof?.calculationMethod || 'egypt',
        prof?.asrJuristicMethod || 'standard',
        prof?.manualPrayerAdjustments || {},
        prof?.dstMode,
        prof?.highLatitudeRule || 'angle_based'
      );

      prayers.forEach((p) => {
        if (p.key === 'sunrise' || p.key === 'duha') return;
        const pCfg = prof ? getPrayerConfig(prof, p.key) : storedConfigs[p.key];
        const preEnabled = pCfg?.preAlertEnabled ?? (this.settings.prePrayerAlert?.enabled !== false);
        if (!preEnabled) return;

        const leadMins = pCfg?.preAlertMinutes ?? defaultLeadMins;
        const leadMs = Math.max(1, leadMins) * 60 * 1000;
        const triggerTime = new Date(p.timestamp.getTime() - leadMs);

        results.push({
          section: 'prePrayerAlert',
          title: `اقتربت صلاة ${p.name}`,
          body: `«إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا» • متبقي ${leadMins} دقيقة على أذان ${p.name}`,
          triggerTime,
          audioTrackId:
            pCfg?.preAlertVoice || this.settings.prePrayerAlert?.audioFile || 'pre_prayer_15m',
          autoPlay: this.settings.prePrayerAlert?.autoPlaySound !== false,
          prayerKey: p.key,
          prayerName: p.name,
          prayerTimestamp: p.timestamp,
        });
      });
    });

    return results;
  }

  private computeQiyamSlots(referenceDate: Date): ScheduledSlot[] {
    const results: ScheduledSlot[] = [];
    if (!this.currentCity) return results;

    const prof = this.resolveUserProfile();

    [0, 1, 2, 3, 4, 5, 6].forEach((dayOffset) => {
      const baseDate = new Date(referenceDate);
      baseDate.setDate(baseDate.getDate() + dayOffset);
      const nightThirds = calculateNightThirds(
        this.currentCity!,
        baseDate,
        prof?.calculationMethod || 'egypt',
        prof?.asrJuristicMethod || 'standard',
        prof?.manualPrayerAdjustments || {},
        prof?.dstMode,
        prof?.highLatitudeRule || 'angle_based'
      );

      if (this.settings.qiyam?.firstThirdEnabled) {
        results.push({
          section: 'qiyamFirstThird',
          title: 'قيام الليل - الثلث الأول',
          body: '«يا أيها المزمل * قم الليل إلا قليلا» • طوبى لمن قام لله في جوف الليل',
          triggerTime: nightThirds.firstThirdEnd,
          audioTrackId: this.settings.qiyam.firstThirdAudio || 'qiyam_first_third',
          autoPlay: this.settings.qiyam.autoPlaySound !== false,
        });
      }

      if (this.settings.qiyam?.lastThirdEnabled) {
        results.push({
          section: 'qiyamLastThird',
          title: 'قيام الليل والأسحار - الثلث الأخير',
          body: '«وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ» • ينزل ربنا تبارك وتعالى كل ليلة إلى سماء الدنيا',
          triggerTime: nightThirds.lastThirdStart,
          audioTrackId: this.settings.qiyam.lastThirdAudio || 'qiyam_last_third',
          autoPlay: this.settings.qiyam.autoPlaySound !== false,
        });
      }
    });

    return results;
  }

  /**
   * Periodic inspector that triggers any reminder within the current window
   */
  private checkAndTriggerDueReminders() {
    const now = new Date();
    const upcoming = this.calculateUpcomingSlots(now);
    const resolvedProf = this.resolveUserProfile();

    // Smart Per-Prayer Pre-Alert & Live Countdown Broadcast
    if (this.currentCity) {
      try {
        const savedProfile = resolvedProf;
        const storedConfigs = loadStoredPrayerConfigs();
        const prayers = calculatePrayerTimes(
          this.currentCity,
          now,
          savedProfile?.calculationMethod,
          savedProfile?.asrJuristicMethod || 'standard',
          savedProfile?.manualPrayerAdjustments || {},
          savedProfile?.dstMode,
          savedProfile?.highLatitudeRule || 'angle_based'
        );

        prayers.forEach((p) => {
          if (p.key === 'sunrise' || p.key === 'duha') return;

          const pCfg = savedProfile
            ? getPrayerConfig(savedProfile, p.key)
            : storedConfigs[p.key];
          const preEnabled =
            pCfg?.preAlertEnabled ?? (this.settings.prePrayerAlert?.enabled !== false);
          const leadMins =
            pCfg?.preAlertMinutes ?? (this.settings.prePrayerAlert?.minutesBeforePrayer || 15);
          const leadMs = Math.max(1, leadMins) * 60 * 1000;
          const diffToPrayerMs = p.timestamp.getTime() - now.getTime();

          // Continuous live countdown broadcast when within configured minutes before prayer
          if (diffToPrayerMs > 0 && diffToPrayerMs <= leadMs) {
            const totalSec = Math.floor(diffToPrayerMs / 1000);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            const countdownStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('pre_prayer_countdown', {
                  detail: {
                    prayerKey: p.key,
                    prayerName: p.name,
                    diffMs: diffToPrayerMs,
                    remainingSeconds: totalSec,
                    minutes: m,
                    seconds: s,
                    countdownStr,
                    timestamp: p.timestamp,
                    cityName: this.currentCity?.name,
                  },
                })
              );
            }

            // Audio alert once at configured lead time before prayer
            const pDateKey = `preprayer_${leadMins}_${p.key}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            if (!this.firedKeySet.has(pDateKey)) {
              this.markAsFired(pDateKey);
              if (preEnabled) {
                if (this.settings.prePrayerAlert?.autoPlaySound !== false) {
                  soundService.playPrePrayerAlert(
                    undefined,
                    undefined,
                    pCfg?.preAlertVoice || 'pre_prayer_15m',
                    pCfg?.volumePercent ?? 100
                  );
                }
                this.sendNotification(
                  `اقتربت صلاة ${p.name}`,
                  `«إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا» • متبقي حوالي ${m} دقيقة على أذان ${p.name} في ${this.currentCity?.name}`,
                  'prayer'
                );
              }
            }
          }
        });
      } catch {
        // ignore
      }
    }

    upcoming.forEach((slot) => {
      const diffMs = slot.triggerTime.getTime() - now.getTime();
      // If due within the last 15 seconds and hasn't been fired
      if (diffMs <= 500 && diffMs >= -15000) {
        const slotKey = `${slot.section}_${slot.triggerTime.toISOString().substring(0, 19)}`;
        const isDailySection =
          slot.section === 'morningAzkar' ||
          slot.section === 'eveningAzkar' ||
          slot.section === 'qiyamFirstThird' ||
          slot.section === 'qiyamLastThird';
        const dateKey = `${slot.section}_${slot.triggerTime.getFullYear()}-${String(slot.triggerTime.getMonth() + 1).padStart(2, '0')}-${String(slot.triggerTime.getDate()).padStart(2, '0')}`;

        if (isDailySection && this.firedKeySet.has(dateKey)) {
          return;
        }

        // Strict verification: ensure Salawat triggers only inside dynamic Post-Fajr-Iqama -> Midnight (or manual) window
        if (slot.section === 'salawat') {
          const win = computeSalawatWindowForDate(
            now,
            this.settings.salawat,
            this.currentCity,
            resolvedProf
          );
          if (now.getTime() < win.start.getTime() || now.getTime() > win.end.getTime()) {
            return;
          }

          const slotMinuteKey = `salawat_${slot.triggerTime.getFullYear()}-${slot.triggerTime.getMonth() + 1}-${slot.triggerTime.getDate()}_${slot.triggerTime.getHours()}:${slot.triggerTime.getMinutes()}`;
          if (this.firedKeySet.has(slotMinuteKey)) {
            return;
          }
        }

        if (!this.firedKeySet.has(slotKey)) {
          this.markAsFired(slotKey);
          if (isDailySection) {
            this.markAsFired(dateKey);
          }
          if (slot.section === 'salawat') {
            const slotMinuteKey = `salawat_${slot.triggerTime.getFullYear()}-${slot.triggerTime.getMonth() + 1}-${slot.triggerTime.getDate()}_${slot.triggerTime.getHours()}:${slot.triggerTime.getMinutes()}`;
            this.markAsFired(slotMinuteKey);
          }
          this.triggerSlot(slot);
        }
      }
    });
  }

  /**
   * Fires the full selected audio file and shows notification
   */
  public triggerSlot(slot: ScheduledSlot) {
    console.log(`[ReminderScheduler] Triggering reminder for ${slot.section}:`, slot.title);

    // 1. Play embedded audio with its independent configured volume
    this.playAudioForSection(slot.section, slot.audioTrackId);

    // 2. Dispatch system web notification
    this.sendNotification(slot.title, slot.body, slot.section);

    // 3. Dispatch in-app UI custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('azan_reminder_alert', {
          detail: {
            section: slot.section,
            title: slot.title,
            body: slot.body,
            audioTrackId: slot.audioTrackId,
            triggerTime: slot.triggerTime,
          },
        })
      );
    }
  }

  public playAudioForSection(section: string, audioTrackId: string) {
    const azkarVol =
      this.settings.azkarVolumePercent ??
      this.settings.morningAzkar.volumePercent ??
      this.settings.eveningAzkar.volumePercent ??
      100;
    const salawatVol = this.settings.salawat.volumePercent ?? 85;

    switch (section) {
      case 'salawat':
        soundService.playSalawat(audioTrackId, undefined, salawatVol);
        break;
      case 'morningAzkar':
        soundService.playAzkarSabah(
          audioTrackId,
          undefined,
          this.settings.morningAzkar.volumePercent ?? azkarVol
        );
        break;
      case 'eveningAzkar':
        soundService.playAzkarMassa(
          audioTrackId,
          undefined,
          this.settings.eveningAzkar.volumePercent ?? azkarVol
        );
        break;
      case 'musaharati':
        soundService.playMusaharati(audioTrackId);
        break;
      case 'iftarCannon':
        soundService.playIftarCannon(audioTrackId);
        break;
      case 'prePrayerAlert':
      case 'approaching_prayer':
        soundService.playPrePrayerAlert();
        break;
      case 'qiyamFirstThird':
        soundService.playQiyamFirstThird();
        break;
      case 'qiyamLastThird':
        soundService.playQiyamLastThird();
        break;
      case 'ruqyah':
        soundService.playRuqyahShariah();
        break;
      default:
        soundService.playTrack(`/audio/${audioTrackId}.mp3`, audioTrackId, section);
    }
  }


  private sendNotification(title: string, body: string, section: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              vibrate: [200, 100, 200, 100, 300],
              tag: `azan-${section}`,
              renotify: true,
              data: { section, url: window.location.href },
            } as NotificationOptions);
          });
        } else {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: `azan-${section}`,
          });
        }
      } catch (e) {
        console.warn('Failed to dispatch notification:', e);
      }
    }
  }

  /**
   * Syncs schedule (Azkar reminders + actual Prayer Azan times) with Android Native AlarmManager
   */
  public syncWithAndroidBridge(slots: ScheduledSlot[] = this.calculateUpcomingSlots()) {
    if (typeof window === 'undefined') return;
    const bridge = window as unknown as {
      AndroidBridge?: {
        scheduleAlarm?: (json: string) => void;
        syncNativePrayerConfig?: (json: string) => void;
      };
      Android?: {
        scheduleAlarm?: (json: string) => void;
        syncNativePrayerConfig?: (json: string) => void;
      };
    };
    const targetBridge = bridge.AndroidBridge || bridge.Android;
    if (targetBridge && typeof targetBridge.scheduleAlarm === 'function') {
      try {
        const payload: Array<Record<string, unknown>> = slots.slice(0, 250).map((s) => ({
          section: s.section,
          title: s.title,
          body: s.body,
          triggerEpochMs: s.triggerTime.getTime(),
          audioTrackId: s.audioTrackId,
          autoPlay: s.autoPlay,
          floatingWindowEnabled: false,
          lockScreenEnabled: false,
          wakeScreenEnabled: false,
          repeatIntervalMs: s.repeatIntervalMs || 0,
        }));

        let savedAzanVoice = 'makkah';
        let savedFajrVoice = 'abdulbasit_fajr';
        let prayerAzanVoices: Record<string, string> = {};
        let extRaw: Record<string, unknown> = {};
        let userCalcMethod = 'egypt';
        let userAsrMethod: 'standard' | 'hanafi' = 'standard';
        let resolvedProf: UserProfile | null = this.resolveUserProfile();

        try {
          const rawStr = localStorage.getItem('moazen_extended_setup_settings_v1');
          if (rawStr) extRaw = JSON.parse(rawStr);
          if (!resolvedProf) {
            const profStr = localStorage.getItem('azan_user_profile');
            if (profStr) resolvedProf = JSON.parse(profStr) as UserProfile;
          }
          if (resolvedProf) {
            if (resolvedProf.azanVoice) savedAzanVoice = resolvedProf.azanVoice;
            if (resolvedProf.fajrAzanVoice) savedFajrVoice = resolvedProf.fajrAzanVoice;
            if (resolvedProf.prayerAzanVoices) prayerAzanVoices = resolvedProf.prayerAzanVoices;
            if (resolvedProf.calculationMethod) userCalcMethod = resolvedProf.calculationMethod;
            if (resolvedProf.asrJuristicMethod) userAsrMethod = resolvedProf.asrJuristicMethod;
          }
        } catch {
          // ignore
        }

        const prayerAlerts = (extRaw.prayerAlerts as Record<string, boolean>) || {};
        const azanSoundEnabled = extRaw.azanSoundEnabled !== false;

        // Schedule actual Prayer Azan times for full 7 days continuously using user's exact method/Asr/offsets/DST
        if (this.currentCity) {
          [0, 1, 2, 3, 4, 5, 6].forEach((dayOffset) => {
            const d = new Date();
            d.setDate(d.getDate() + dayOffset);
            const prayers = calculatePrayerTimes(
              this.currentCity!,
              d,
              userCalcMethod,
              userAsrMethod,
              resolvedProf?.manualPrayerAdjustments || {},
              resolvedProf?.dstMode,
              resolvedProf?.highLatitudeRule || 'angle_based'
            );
            prayers.forEach((p) => {
              if (p.key === 'sunrise') return;
              const pCfg = resolvedProf ? getPrayerConfig(resolvedProf, p.key) : undefined;
              const isDuha = p.key === 'duha';
              if (!isDuha && prayerAlerts[p.key] === false) return;
              if (pCfg && pCfg.soundEnabled === false) return;
              if (p.timestamp.getTime() <= Date.now()) return;

              const iqamaMinutes =
                resolvedProf?.iqamaIntervals?.[p.key] ?? (p.key === 'maghrib' ? 7 : 15);
              const customVoice = pCfg?.azanVoice || prayerAzanVoices[p.key];
              const trackId =
                customVoice ||
                (p.key === 'fajr' ? savedFajrVoice : isDuha ? 'duha_surah' : savedAzanVoice);

              // Pre-Prayer Alert Slot based on per-prayer config
              if (!isDuha && (pCfg?.preAlertEnabled ?? true)) {
                const preLead = pCfg?.preAlertMinutes || 15;
                const preEpoch = p.timestamp.getTime() - preLead * 60 * 1000;
                if (preEpoch > Date.now()) {
                  payload.push({
                    section: 'prePrayerAlert',
                    prayerKey: p.key,
                    prayerName: p.name,
                    cityName: this.currentCity!.name,
                    title: `اقتربت صلاة ${p.name}`,
                    body: `«إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا» • متبقي ${preLead} دقيقة على أذان ${p.name}`,
                    triggerEpochMs: preEpoch,
                    audioTrackId: pCfg?.preAlertVoice || 'pre_prayer_15m',
                    autoPlay: true,
                    floatingWindowEnabled: false,
                    lockScreenEnabled: false,
                    wakeScreenEnabled: false,
                    repeatIntervalMs: 0,
                    volumePercent: pCfg?.volumePercent ?? 100,
                  });
                }
              }

              // Prayer Azan / Duha Slot
              payload.push({
                section: isDuha ? 'duha_prayer' : 'prayer_azan',
                prayerKey: p.key,
                prayerName: p.name,
                cityName: this.currentCity!.name,
                iqamaDurationMinutes: isDuha ? 0 : iqamaMinutes,
                title: isDuha ? 'حان الآن وقت صلاة الضحى' : `حان الآن موعد أذان ${p.name}`,
                body: isDuha
                  ? 'صلاة الأوابين: ركعتا الضحى نورٌ وبركة في يومك'
                  : `الله أكبر • حان وقت صلاة ${p.name} حسب توقيت ${this.currentCity!.name}`,
                triggerEpochMs: p.timestamp.getTime(),
                audioTrackId: trackId,
                autoPlay: isDuha ? true : azanSoundEnabled,
                floatingWindowEnabled: false,
                lockScreenEnabled: false,
                wakeScreenEnabled: false,
                repeatIntervalMs: 0,
                volumePercent: pCfg?.volumePercent ?? 100,
              });
            });
          });
        }

        // Send 7-day schedule to Android AlarmManager
        targetBridge.scheduleAlarm(JSON.stringify(payload));

        // Also permanently sync base config with Android so BootReceiver can recalculate autonomously
        if (typeof targetBridge.syncNativePrayerConfig === 'function') {
          const adj = resolvedProf?.manualPrayerAdjustments || {};
          const todayWin = computeSalawatWindowForDate(
            new Date(),
            this.settings.salawat,
            this.currentCity,
            resolvedProf
          );
          const azkarVol = this.settings.azkarVolumePercent ?? 100;
          const salawatVol = this.settings.salawat.volumePercent ?? 85;
          const configPayload = {
            city_latitude: this.currentCity?.latitude || 21.4225,
            city_longitude: this.currentCity?.longitude || 39.8262,
            city_name: this.currentCity?.name || 'مكة المكرمة',
            calc_method: userCalcMethod,
            asr_method: userAsrMethod,
            high_latitude_rule: resolvedProf?.highLatitudeRule || 'angle_based',
            azan_voice: savedAzanVoice,
            fajr_voice: savedFajrVoice,
            azanSoundEnabled,
            offset_fajr: adj.fajr ?? 0,
            offset_sunrise: adj.sunrise ?? 0,
            offset_duha: adj.duha ?? 0,
            offset_dhuhr: adj.dhuhr ?? 0,
            offset_asr: adj.asr ?? 0,
            offset_maghrib: adj.maghrib ?? 0,
            offset_isha: adj.isha ?? 0,
            pre_prayer_alert_enabled: this.settings.prePrayerAlert?.enabled !== false,
            salawat_enabled: this.settings.salawat.enabled,
            salawat_auto_after_fajr_iqama: this.settings.salawat.autoAfterFajrIqama !== false,
            salawat_time: todayWin.startTimeStr || this.settings.salawat.startTime || '06:00',
            salawat_end_time: todayWin.endTimeStr || this.settings.salawat.endTime || '23:59',
            salawat_repeat_type: this.settings.salawat.repeatType || 'repeat',
            salawat_repeat_interval: this.settings.salawat.repeatInterval || 15,
            salawat_repeat_unit: this.settings.salawat.repeatUnit || 'minutes',
            salawat_audio: this.settings.salawat.audioFile || 'salawat_1',
            salawat_volume_percent: salawatVol,
            azkar_volume_percent: azkarVol,
            morning_azkar_enabled: this.settings.morningAzkar.enabled,
            morning_azkar_time: this.settings.morningAzkar.startTime || '08:00',
            morning_azkar_audio: this.settings.morningAzkar.audioFile || 'azkar_sabah',
            evening_azkar_enabled: this.settings.eveningAzkar.enabled,
            evening_azkar_time: this.settings.eveningAzkar.startTime || '21:00',
            evening_azkar_audio: this.settings.eveningAzkar.audioFile || 'azkar_massa',
            musaharati_enabled: this.settings.musaharati.enabled,
            musaharati_time: this.settings.musaharati.time || '03:30',
          };
          targetBridge.syncNativePrayerConfig(JSON.stringify(configPayload));
        }
      } catch (err) {
        console.warn('AndroidBridge sync error:', err);
      }
    }
  }
}

export const reminderScheduler = new ReminderScheduler();
