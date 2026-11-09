/**
 * Real User Activity & Achievements Statistics Tracker ("إحصائياتي")
 * - Tracks ONLY genuine user actions (zero mock/fake numbers)
 * - Prevents duplicate counting of the same activity (deduplicated IDs)
 * - Maintains Daily (اليومية), Monthly (الشهرية), and All-Time Total (الإجمالية) buckets
 * - Persists in localStorage across app restarts and phone reboots
 */

import { RamadanFastingDayRecord } from '../types';

const STATS_STORAGE_KEY = 'moazen_real_user_stats_v1';

export interface PeriodMetrics {
  tasbihCount: number;
  quranPagesIds: number[];
  quranSurahsIds: number[];
  quranAyahsCount: number;
  hadithReadIds: number[];
  azkarCompletedIds: string[];
  sunanCompletedIds: string[];
  quizParticipations: number;
  quizCorrectQuestionIds: number[];
  quizPoints: number;
  recitationListeningSeconds: number;
  recitationSurahsIds: number[];
  recitationTracksKeys: string[];
}

export interface PersistedUserStats {
  lastUpdatedIso: string;
  daily: Record<string, PeriodMetrics>; // key: YYYY-MM-DD
  monthly: Record<string, PeriodMetrics>; // key: YYYY-MM
  total: PeriodMetrics;
  lastReadQuran: {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    pageNumber: number;
    updatedAt: string;
  } | null;
}

function createEmptyMetrics(): PeriodMetrics {
  return {
    tasbihCount: 0,
    quranPagesIds: [],
    quranSurahsIds: [],
    quranAyahsCount: 0,
    hadithReadIds: [],
    azkarCompletedIds: [],
    sunanCompletedIds: [],
    quizParticipations: 0,
    quizCorrectQuestionIds: [],
    quizPoints: 0,
    recitationListeningSeconds: 0,
    recitationSurahsIds: [],
    recitationTracksKeys: [],
  };
}

function createInitialStats(): PersistedUserStats {
  return {
    lastUpdatedIso: new Date().toISOString(),
    daily: {},
    monthly: {},
    total: createEmptyMetrics(),
    lastReadQuran: null,
  };
}

function getTodayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function addUnique<T>(arr: T[], item: T): { next: T[]; added: boolean } {
  if (arr.includes(item)) {
    return { next: arr, added: false };
  }
  return { next: [...arr, item], added: true };
}

class UserStatsTracker {
  private stats: PersistedUserStats = createInitialStats();
  private listeners: Set<(stats: PersistedUserStats) => void> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.stats = {
          ...createInitialStats(),
          ...parsed,
          total: {
            ...createEmptyMetrics(),
            ...(parsed.total || {}),
          },
          daily: parsed.daily || {},
          monthly: parsed.monthly || {},
        };
      }
    } catch (e) {
      console.warn('Failed to load user stats:', e);
      this.stats = createInitialStats();
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      this.stats.lastUpdatedIso = new Date().toISOString();
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this.stats));
      this.notify();
    } catch (e) {
      console.warn('Failed to save user stats:', e);
    }
  }

  private notify() {
    const snapshot = this.getStats();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  public subscribe(listener: (stats: PersistedUserStats) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStats());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStats(): PersistedUserStats {
    return JSON.parse(JSON.stringify(this.stats));
  }

  public getMetricsForPeriod(period: 'daily' | 'monthly' | 'total'): PeriodMetrics {
    const now = new Date();
    if (period === 'daily') {
      const dayKey = getTodayKey(now);
      return this.stats.daily[dayKey]
        ? { ...createEmptyMetrics(), ...this.stats.daily[dayKey] }
        : createEmptyMetrics();
    }
    if (period === 'monthly') {
      const monthKey = getMonthKey(now);
      return this.stats.monthly[monthKey]
        ? { ...createEmptyMetrics(), ...this.stats.monthly[monthKey] }
        : createEmptyMetrics();
    }
    return { ...createEmptyMetrics(), ...this.stats.total };
  }

  private ensureCurrentBuckets() {
    const now = new Date();
    const dayKey = getTodayKey(now);
    const monthKey = getMonthKey(now);

    if (!this.stats.daily[dayKey]) {
      this.stats.daily[dayKey] = createEmptyMetrics();
    }
    if (!this.stats.monthly[monthKey]) {
      this.stats.monthly[monthKey] = createEmptyMetrics();
    }
    return {
      dayBucket: this.stats.daily[dayKey],
      monthBucket: this.stats.monthly[monthKey],
      totalBucket: this.stats.total,
    };
  }

  /**
   * 1. Record Tasbih tap(s)
   */
  public recordTasbih(amount: number = 1) {
    if (amount <= 0) return;
    const { dayBucket, monthBucket, totalBucket } = this.ensureCurrentBuckets();
    dayBucket.tasbihCount += amount;
    monthBucket.tasbihCount += amount;
    totalBucket.tasbihCount += amount;
    this.save();
  }

  /**
   * 2. Record Quran Page & Ayahs Read (Deduplicated per period so re-opening the same page does not double count)
   */
  public recordQuranPageRead(
    pageNumber: number,
    surahNumbers: number[],
    ayahCountOnPage: number,
    primarySurahName: string,
    lastAyahNumber: number = 1
  ) {
    if (pageNumber < 1 || pageNumber > 604) return;
    const { dayBucket, monthBucket, totalBucket } = this.ensureCurrentBuckets();

    // Update last read position
    this.stats.lastReadQuran = {
      surahNumber: surahNumbers[0] || 1,
      surahName: primarySurahName,
      ayahNumber: lastAyahNumber,
      pageNumber,
      updatedAt: new Date().toISOString(),
    };

    // Daily bucket deduplication
    const dayPageRes = addUnique(dayBucket.quranPagesIds, pageNumber);
    if (dayPageRes.added) {
      dayBucket.quranPagesIds = dayPageRes.next;
      dayBucket.quranAyahsCount += Math.max(1, ayahCountOnPage);
    }
    surahNumbers.forEach((sId) => {
      dayBucket.quranSurahsIds = addUnique(dayBucket.quranSurahsIds, sId).next;
    });

    // Monthly bucket deduplication
    const monthPageRes = addUnique(monthBucket.quranPagesIds, pageNumber);
    if (monthPageRes.added) {
      monthBucket.quranPagesIds = monthPageRes.next;
      monthBucket.quranAyahsCount += Math.max(1, ayahCountOnPage);
    }
    surahNumbers.forEach((sId) => {
      monthBucket.quranSurahsIds = addUnique(monthBucket.quranSurahsIds, sId).next;
    });

    // Total bucket deduplication
    const totalPageRes = addUnique(totalBucket.quranPagesIds, pageNumber);
    if (totalPageRes.added) {
      totalBucket.quranPagesIds = totalPageRes.next;
      totalBucket.quranAyahsCount += Math.max(1, ayahCountOnPage);
    }
    surahNumbers.forEach((sId) => {
      totalBucket.quranSurahsIds = addUnique(totalBucket.quranSurahsIds, sId).next;
    });

    this.save();
  }

  /**
   * 3. Record Hadith Read (Deduplicated by Hadith ID)
   */
  public recordHadithRead(hadithId: number) {
    if (!hadithId) return;
    const { dayBucket, monthBucket, totalBucket } = this.ensureCurrentBuckets();

    dayBucket.hadithReadIds = addUnique(dayBucket.hadithReadIds, hadithId).next;
    monthBucket.hadithReadIds = addUnique(monthBucket.hadithReadIds, hadithId).next;
    totalBucket.hadithReadIds = addUnique(totalBucket.hadithReadIds, hadithId).next;

    this.save();
  }

  /**
   * 4. Record Azkar or Sunnah/Ruqyah Completed (Deduplicated by item ID per bucket)
   */
  public recordAzkarCompleted(azkarId: string) {
    if (!azkarId) return;
    const { dayBucket, monthBucket, totalBucket } = this.ensureCurrentBuckets();

    dayBucket.azkarCompletedIds = addUnique(dayBucket.azkarCompletedIds, azkarId).next;
    monthBucket.azkarCompletedIds = addUnique(monthBucket.azkarCompletedIds, azkarId).next;
    totalBucket.azkarCompletedIds = addUnique(totalBucket.azkarCompletedIds, azkarId).next;

    this.save();
  }

  public recordSunnahCompleted(sunnahId: string) {
    if (!sunnahId) return;
    const { dayBucket, monthBucket, totalBucket } = this.ensureCurrentBuckets();

    dayBucket.sunanCompletedIds = addUnique(dayBucket.sunanCompletedIds, sunnahId).next;
    monthBucket.sunanCompletedIds = addUnique(monthBucket.sunanCompletedIds, sunnahId).next;
    totalBucket.sunanCompletedIds = addUnique(totalBucket.sunanCompletedIds, sunnahId).next;

    this.save();
  }

  /**
   * 5. Record Quiz Participation & Correct Answer (Deduplicated by questionId per bucket so points aren't farmed on the same question)
   */
  public recordQuizSessionStarted() {
    const { dayBucket, monthBucket, totalBucket } = this.ensureCurrentBuckets();
    dayBucket.quizParticipations += 1;
    monthBucket.quizParticipations += 1;
    totalBucket.quizParticipations += 1;
    this.save();
  }

  public recordQuizAnswer(questionId: number, isCorrect: boolean) {
    if (!questionId || !isCorrect) return;
    const { dayBucket, monthBucket, totalBucket } = this.ensureCurrentBuckets();

    const dRes = addUnique(dayBucket.quizCorrectQuestionIds, questionId);
    if (dRes.added) {
      dayBucket.quizCorrectQuestionIds = dRes.next;
      dayBucket.quizPoints += 10;
    }

    const mRes = addUnique(monthBucket.quizCorrectQuestionIds, questionId);
    if (mRes.added) {
      monthBucket.quizCorrectQuestionIds = mRes.next;
      monthBucket.quizPoints += 10;
    }

    const tRes = addUnique(totalBucket.quizCorrectQuestionIds, questionId);
    if (tRes.added) {
      totalBucket.quizCorrectQuestionIds = tRes.next;
      totalBucket.quizPoints += 10;
    }

    this.save();
  }

  /**
   * 6. Record Recitation Listening Time & Unique Surahs/Tracks
   */
  public recordRecitationStarted(reciterId: string, surahNumber: number) {
    if (!surahNumber) return;
    const trackKey = `${reciterId}_${surahNumber}`;
    const { dayBucket, monthBucket, totalBucket } = this.ensureCurrentBuckets();

    dayBucket.recitationSurahsIds = addUnique(dayBucket.recitationSurahsIds, surahNumber).next;
    dayBucket.recitationTracksKeys = addUnique(dayBucket.recitationTracksKeys, trackKey).next;

    monthBucket.recitationSurahsIds = addUnique(monthBucket.recitationSurahsIds, surahNumber).next;
    monthBucket.recitationTracksKeys = addUnique(monthBucket.recitationTracksKeys, trackKey).next;

    totalBucket.recitationSurahsIds = addUnique(totalBucket.recitationSurahsIds, surahNumber).next;
    totalBucket.recitationTracksKeys = addUnique(totalBucket.recitationTracksKeys, trackKey).next;

    this.save();
  }

  public recordRecitationListeningSeconds(secondsDelta: number) {
    if (secondsDelta <= 0 || secondsDelta > 30) return;
    const { dayBucket, monthBucket, totalBucket } = this.ensureCurrentBuckets();
    dayBucket.recitationListeningSeconds += secondsDelta;
    monthBucket.recitationListeningSeconds += secondsDelta;
    totalBucket.recitationListeningSeconds += secondsDelta;
    this.save();
  }

  /**
   * 7. Compute Ramadan Worship Summary from actual user tracker records
   */
  public computeRamadanStats(tracker: Record<number, RamadanFastingDayRecord> = {}) {
    const records = Object.values(tracker);
    const fastedDays = records.filter((r) => r.fasted).length;
    const congregationDays = records.filter((r) => r.prayedCongregation).length;
    const taraweehDays = records.filter((r) => r.taraweeh).length;
    const charityDays = records.filter((r) => r.charity).length;
    const quranDays = records.filter((r) => r.quranRead).length;
    const totalDeedsCompleted =
      fastedDays + congregationDays + taraweehDays + charityDays + quranDays;

    return {
      fastedDays,
      congregationDays,
      taraweehDays,
      charityDays,
      quranDays,
      totalDeedsCompleted,
    };
  }
}

export const userStatsTracker = new UserStatsTracker();

export function formatListeningDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  if (hours > 0) {
    return `${hours} ساعة و ${minutes} د`;
  }
  if (minutes > 0) {
    return `${minutes} دقيقة و ${seconds} ث`;
  }
  return `${seconds} ثانية`;
}
