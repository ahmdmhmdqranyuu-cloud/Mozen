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
import { CityLocation } from '../types';
import { calculatePrayerTimes, calculateNightThirds } from './prayerTimes';
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

class ReminderScheduler {
  private settings: ComprehensiveRemindersSettings = DEFAULT_REMINDERS_SETTINGS;
  private currentCity: CityLocation | null = null;
  private checkIntervalId: ReturnType<typeof setInterval> | null = null;
  private activeTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private firedKeySet: Set<string> = new Set();
  private listeners: Set<(settings: ComprehensiveRemindersSettings) => void> = new Set();

  constructor() {
    this.loadSettings();
    this.loadFiredHistory();
    this.initVisibilityAndFocusListeners();
    this.startPeriodicTick();
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

  public setCity(city: CityLocation) {
    this.currentCity = city;
    this.rescheduleAll();
  }

  public updateSettings(
    updater: (prev: ComprehensiveRemindersSettings) => ComprehensiveRemindersSettings
  ) {
    this.settings = updater(this.settings);
    this.saveSettings();
    this.rescheduleAll();
    this.notifyListeners();
  }

  public updateSection<K extends keyof Omit<ComprehensiveRemindersSettings, 'hasCompletedFirstTimeSetup'>>(
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
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = {
          ...DEFAULT_REMINDERS_SETTINGS,
          ...parsed,
          morningAzkar: {
            ...DEFAULT_REMINDERS_SETTINGS.morningAzkar,
            ...parsed.morningAzkar,
            autoPlaySound: true,
          },
          eveningAzkar: {
            ...DEFAULT_REMINDERS_SETTINGS.eveningAzkar,
            ...parsed.eveningAzkar,
            autoPlaySound: true,
          },
          salawat: {
            ...DEFAULT_REMINDERS_SETTINGS.salawat,
            ...parsed.salawat,
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save reminders settings:', e);
    }
  }

  private loadFiredHistory() {
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
   * Reschedules all active timers cleanly, clearing old timers first
   */
  public rescheduleAll() {
    // Clear all existing timeouts to prevent duplicate triggers
    this.activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.activeTimeouts.clear();

    const upcomingSlots = this.calculateUpcomingSlots();

    // Sync with native Android bridge if running in Android app
    this.syncWithAndroidBridge(upcomingSlots);

    // Setup next immediate timer for web runtime
    const now = new Date();
    upcomingSlots.forEach((slot) => {
      const diffMs = slot.triggerTime.getTime() - now.getTime();
      // If within the next 24 hours
      if (diffMs > 0 && diffMs < 24 * 3600000) {
        const key = `${slot.section}_${slot.triggerTime.getTime()}`;
        const tId = setTimeout(() => {
          const slotKey = `${slot.section}_${slot.triggerTime.toISOString().substring(0, 19)}`;
          if (!this.firedKeySet.has(slotKey)) {
            this.markAsFired(slotKey);
            this.triggerSlot(slot);
          }
        }, diffMs);
        this.activeTimeouts.set(key, tId);
      }
    });
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
    const daysToCheck = [0, 1]; // Today and tomorrow

    daysToCheck.forEach((dayOffset) => {
      const baseDate = new Date(referenceDate);
      baseDate.setDate(baseDate.getDate() + dayOffset);

      const [startH, startM] = config.startTime.split(':').map(Number);
      const startDate = new Date(baseDate);
      startDate.setHours(startH || 0, startM || 0, 0, 0);

      const [endH, endM] = config.endTime.split(':').map(Number);
      const endDate = new Date(baseDate);
      endDate.setHours(endH || 23, endM || 59, 59, 999);

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
        results.push({
          section,
          title,
          body,
          triggerTime: startDate,
          audioTrackId: config.audioFile,
          autoPlay: true,
          repeatIntervalMs: 0,
        });
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
    const daysToCheck = [0, 1];

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

    const daysToCheck = [0, 1];

    daysToCheck.forEach((dayOffset) => {
      const baseDate = new Date(referenceDate);
      baseDate.setDate(baseDate.getDate() + dayOffset);

      // Check Ramadan restriction
      const isRamadan = isRamadanMonth(baseDate);
      if (!isRamadan) {
        // Automatically active in the month of Ramadan
        return;
      }

      const prayers = calculatePrayerTimes(this.currentCity!, baseDate);
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

    const leadMins = this.settings.prePrayerAlert?.minutesBeforePrayer || 15;
    const leadMs = leadMins * 60 * 1000;

    [0, 1].forEach((dayOffset) => {
      const baseDate = new Date(referenceDate);
      baseDate.setDate(baseDate.getDate() + dayOffset);
      const prayers = calculatePrayerTimes(this.currentCity!, baseDate);

      prayers.forEach((p) => {
        if (p.key === 'sunrise') return;
        const triggerTime = new Date(p.timestamp.getTime() - leadMs);

        results.push({
          section: 'prePrayerAlert',
          title: `اقتربت صلاة ${p.name}`,
          body: `«إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا» • متبقي ${leadMins} دقيقة على أذان ${p.name}`,
          triggerTime,
          audioTrackId: this.settings.prePrayerAlert?.audioFile || 'pre_prayer_15m',
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

    [0, 1].forEach((dayOffset) => {
      const baseDate = new Date(referenceDate);
      baseDate.setDate(baseDate.getDate() + dayOffset);
      const nightThirds = calculateNightThirds(this.currentCity!, baseDate);

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

    // Smart 15-Minute Pre-Prayer Alert & Live Countdown Broadcast
    if (this.currentCity) {
      try {
        const prayers = calculatePrayerTimes(this.currentCity, now);
        const leadMins = this.settings.prePrayerAlert?.minutesBeforePrayer || 15;
        const leadMs = leadMins * 60 * 1000;

        prayers.forEach((p) => {
          if (p.key === 'sunrise') return;
          const diffToPrayerMs = p.timestamp.getTime() - now.getTime();

          // Continuous live countdown broadcast when within 15 minutes
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

            // Audio alert exactly when reaching 15 minutes before prayer
            const pDateKey = `preprayer15_${p.key}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            if (!this.firedKeySet.has(pDateKey)) {
              this.markAsFired(pDateKey);
              if (this.settings.prePrayerAlert?.enabled) {
                if (this.settings.prePrayerAlert.autoPlaySound !== false) {
                  soundService.playPrePrayerAlert();
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

        // Strict verification: ensure Salawat triggers only inside configured startTime - endTime
        if (slot.section === 'salawat') {
          const [sH, sM] = this.settings.salawat.startTime.split(':').map(Number);
          const [eH, eM] = this.settings.salawat.endTime.split(':').map(Number);
          const currentMins = now.getHours() * 60 + now.getMinutes();
          const startMins = (sH || 0) * 60 + (sM || 0);
          const endMins = (eH || 23) * 60 + (eM || 59);
          if (currentMins < startMins || currentMins > endMins) {
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

    // 1. Play embedded audio
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
    switch (section) {
      case 'salawat':
        soundService.playSalawat(audioTrackId);
        break;
      case 'morningAzkar':
        soundService.playAzkarSabah(audioTrackId);
        break;
      case 'eveningAzkar':
        soundService.playAzkarMassa(audioTrackId);
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
      AndroidBridge?: { scheduleAlarm: (json: string) => void };
      Android?: { scheduleAlarm: (json: string) => void };
    };
    const targetBridge = bridge.AndroidBridge || bridge.Android;
    if (targetBridge && typeof targetBridge.scheduleAlarm === 'function') {
      try {
        const payload: Array<Record<string, unknown>> = slots.slice(0, 60).map((s) => ({
          section: s.section,
          title: s.title,
          body: s.body,
          triggerEpochMs: s.triggerTime.getTime(),
          audioTrackId: s.audioTrackId,
          autoPlay: s.autoPlay,
          repeatIntervalMs: s.repeatIntervalMs || 0,
        }));

        // Also schedule actual Prayer Azan times for today and tomorrow
        if (this.currentCity) {
          let extRaw: Record<string, unknown> = {};
          let savedAzanVoice = 'makkah';
          let savedFajrVoice = 'abdulbasit';
          let prayerAzanVoices: Record<string, string> = {};
          try {
            const rawStr = localStorage.getItem('moazen_extended_setup_settings_v1');
            if (rawStr) extRaw = JSON.parse(rawStr);
            const profStr = localStorage.getItem('azan_user_profile');
            if (profStr) {
              const prof = JSON.parse(profStr);
              if (prof.azanVoice) savedAzanVoice = prof.azanVoice;
              if (prof.fajrAzanVoice) savedFajrVoice = prof.fajrAzanVoice;
              if (prof.prayerAzanVoices) prayerAzanVoices = prof.prayerAzanVoices;
            }
          } catch {
            // ignore
          }
          const prayerAlerts = (extRaw.prayerAlerts as Record<string, boolean>) || {};
          const floatingWindowEnabled = extRaw.floatingAzanWindowEnabled !== false;
          const lockScreenEnabled = extRaw.lockScreenAzanEnabled !== false;
          const wakeScreenEnabled = extRaw.wakeScreenOnAzanEnabled !== false;
          const azanSoundEnabled = extRaw.azanSoundEnabled !== false;

          [0, 1].forEach((dayOffset) => {
            const d = new Date();
            d.setDate(d.getDate() + dayOffset);
            const prayers = calculatePrayerTimes(this.currentCity!, d);
            prayers.forEach((p) => {
              if (p.key === 'sunrise') return;
              if (prayerAlerts[p.key] === false) return;
              if (p.timestamp.getTime() <= Date.now()) return;

              const iqamaMinutes = p.key === 'maghrib' ? 7 : 15;
              const customVoice = prayerAzanVoices[p.key];
              const trackId = customVoice || (p.key === 'fajr' ? savedFajrVoice : savedAzanVoice);

              // 15-Minute Pre-Prayer Alert Slot with Quranic Audio: «إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا»
              const fifteenMinsBeforeEpoch = p.timestamp.getTime() - 15 * 60 * 1000;
              if (fifteenMinsBeforeEpoch > Date.now()) {
                payload.push({
                  section: 'prePrayerAlert',
                  prayerKey: p.key,
                  prayerName: p.name,
                  cityName: this.currentCity!.name,
                  title: `اقتربت صلاة ${p.name}`,
                  body: `«إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا» • متبقي 15 دقيقة على أذان ${p.name}`,
                  triggerEpochMs: fifteenMinsBeforeEpoch,
                  audioTrackId: 'pre_prayer_15m',
                  autoPlay: true,
                  floatingWindowEnabled: true,
                  lockScreenEnabled,
                  wakeScreenEnabled,
                  repeatIntervalMs: 0,
                });
              }


              // Prayer Azan Slot
              payload.push({
                section: 'prayer_azan',
                prayerKey: p.key,
                prayerName: p.name,
                cityName: this.currentCity!.name,
                iqamaDurationMinutes: iqamaMinutes,
                title: `حان الآن موعد أذان ${p.name}`,
                body: `الله أكبر • حان وقت صلاة ${p.name} حسب توقيت ${this.currentCity!.name}`,
                triggerEpochMs: p.timestamp.getTime(),
                audioTrackId: trackId,
                autoPlay: azanSoundEnabled,
                floatingWindowEnabled,
                lockScreenEnabled,
                wakeScreenEnabled,
                repeatIntervalMs: 0,
              });
            });
          });
        }

        targetBridge.scheduleAlarm(JSON.stringify(payload));
      } catch (err) {
        console.warn('AndroidBridge sync error:', err);
      }
    }
  }
}

export const reminderScheduler = new ReminderScheduler();
