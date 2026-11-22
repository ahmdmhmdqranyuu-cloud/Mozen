export type WorshipItemKey =
  | 'five_prayers'
  | 'azkar_sabah_massa'
  | 'quran_reading'
  | 'after_prayer_azkar'
  | 'duha_prayer'
  | 'qiyam_witr'
  | 'charity'
  | 'salawat_prophet';

export interface WorshipDefinition {
  key: WorshipItemKey;
  titleAr: string;
  titleEn: string;
  unitAr: string;
  unitEn: string;
  defaultTarget: number;
  minTarget: number;
  maxTarget: number;
  step: number;
}

export const WORSHIP_ITEMS: WorshipDefinition[] = [
  {
    key: 'five_prayers',
    titleAr: 'الصلوات الخمس',
    titleEn: 'Five Daily Prayers',
    unitAr: 'صلاة',
    unitEn: 'prayers',
    defaultTarget: 5,
    minTarget: 1,
    maxTarget: 5,
    step: 1,
  },
  {
    key: 'azkar_sabah_massa',
    titleAr: 'أذكار الصباح والمساء',
    titleEn: 'Morning & Evening Azkar',
    unitAr: 'ورد',
    unitEn: 'sessions',
    defaultTarget: 2,
    minTarget: 1,
    maxTarget: 2,
    step: 1,
  },
  {
    key: 'quran_reading',
    titleAr: 'قراءة القرآن',
    titleEn: 'Quran Reading',
    unitAr: 'صفحة',
    unitEn: 'pages',
    defaultTarget: 10,
    minTarget: 1,
    maxTarget: 100,
    step: 1,
  },
  {
    key: 'after_prayer_azkar',
    titleAr: 'أذكار بعد الصلاة',
    titleEn: 'Post-Prayer Azkar',
    unitAr: 'مرة',
    unitEn: 'times',
    defaultTarget: 5,
    minTarget: 1,
    maxTarget: 5,
    step: 1,
  },
  {
    key: 'duha_prayer',
    titleAr: 'صلاة الضحى',
    titleEn: 'Duha Prayer',
    unitAr: 'ركعات',
    unitEn: 'session',
    defaultTarget: 1,
    minTarget: 1,
    maxTarget: 8,
    step: 1,
  },
  {
    key: 'qiyam_witr',
    titleAr: 'قيام الليل والوتر',
    titleEn: 'Qiyam & Witr Prayer',
    unitAr: 'ورد',
    unitEn: 'session',
    defaultTarget: 1,
    minTarget: 1,
    maxTarget: 5,
    step: 1,
  },
  {
    key: 'charity',
    titleAr: 'الصدقة',
    titleEn: 'Daily Charity',
    unitAr: 'عمل',
    unitEn: 'act',
    defaultTarget: 1,
    minTarget: 1,
    maxTarget: 10,
    step: 1,
  },
  {
    key: 'salawat_prophet',
    titleAr: 'الصلاة على النبي ﷺ',
    titleEn: 'Salawat on the Prophet ﷺ',
    unitAr: 'مرة',
    unitEn: 'times',
    defaultTarget: 100,
    minTarget: 10,
    maxTarget: 1000,
    step: 10,
  },
];

export interface WorshipDayProgress {
  counts: Record<WorshipItemKey, number>;
  updatedAtMs: number;
}

export interface WorshipTrackerState {
  targets: Record<WorshipItemKey, number>;
  days: Record<string, WorshipDayProgress>;
  reminderEnabled: boolean;
  reminderTime: string; // "HH:mm"
  lastReminderDateSent?: string;
}

export interface WorshipDailySummary {
  dateKey: string;
  completedCount: number;
  totalItems: number;
  percent: number;
}

const WORSHIP_STORAGE_KEY = 'muslim_plus_worship_tracker_v1';

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDefaultTargets(): Record<WorshipItemKey, number> {
  return {
    five_prayers: 5,
    azkar_sabah_massa: 2,
    quran_reading: 10,
    after_prayer_azkar: 5,
    duha_prayer: 1,
    qiyam_witr: 1,
    charity: 1,
    salawat_prophet: 100,
  };
}

export function getEmptyDayProgress(): WorshipDayProgress {
  return {
    counts: {
      five_prayers: 0,
      azkar_sabah_massa: 0,
      quran_reading: 0,
      after_prayer_azkar: 0,
      duha_prayer: 0,
      qiyam_witr: 0,
      charity: 0,
      salawat_prophet: 0,
    },
    updatedAtMs: Date.now(),
  };
}

function clampTarget(key: WorshipItemKey, val: number): number {
  const def = WORSHIP_ITEMS.find((i) => i.key === key);
  if (!def) return Math.max(1, Math.round(val));
  return Math.max(def.minTarget, Math.min(def.maxTarget, Math.round(val)));
}

function pruneOldDays(days: Record<string, WorshipDayProgress>, keepMax: number = 45): Record<string, WorshipDayProgress> {
  const keys = Object.keys(days).sort();
  if (keys.length <= keepMax) return days;
  const trimmed: Record<string, WorshipDayProgress> = {};
  for (const k of keys.slice(-keepMax)) {
    trimmed[k] = days[k];
  }
  return trimmed;
}

export function loadWorshipTrackerState(): WorshipTrackerState {
  const defaultState: WorshipTrackerState = {
    targets: getDefaultTargets(),
    days: {},
    reminderEnabled: false,
    reminderTime: '20:30',
  };
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(WORSHIP_STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<WorshipTrackerState>;
    const targets = { ...getDefaultTargets() };
    if (parsed.targets) {
      for (const item of WORSHIP_ITEMS) {
        const v = Number(parsed.targets[item.key]);
        if (Number.isFinite(v) && v > 0) {
          targets[item.key] = clampTarget(item.key, v);
        }
      }
    }
    const days: Record<string, WorshipDayProgress> = {};
    if (parsed.days && typeof parsed.days === 'object') {
      for (const [dateKey, dayVal] of Object.entries(parsed.days)) {
        if (!dayVal || typeof dayVal !== 'object') continue;
        const counts = { ...getEmptyDayProgress().counts };
        for (const item of WORSHIP_ITEMS) {
          const c = Number((dayVal as WorshipDayProgress).counts?.[item.key] ?? 0);
          counts[item.key] = Number.isFinite(c) ? Math.max(0, Math.round(c)) : 0;
        }
        days[dateKey] = {
          counts,
          updatedAtMs: Number((dayVal as WorshipDayProgress).updatedAtMs) || Date.now(),
        };
      }
    }
    return {
      targets,
      days: pruneOldDays(days),
      reminderEnabled: Boolean(parsed.reminderEnabled),
      reminderTime:
        typeof parsed.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.reminderTime)
          ? parsed.reminderTime
          : '20:30',
      lastReminderDateSent: parsed.lastReminderDateSent,
    };
  } catch {
    return defaultState;
  }
}

export function saveWorshipTrackerState(state: WorshipTrackerState): WorshipTrackerState {
  const sanitized: WorshipTrackerState = {
    ...state,
    days: pruneOldDays(state.days),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORSHIP_STORAGE_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent('muslimPlusWorshipUpdated', { detail: sanitized }));
    } catch {
      // ignore storage quota errors
    }
  }
  return sanitized;
}

export function getDayProgress(state: WorshipTrackerState, dateKey: string = getLocalDateKey()): WorshipDayProgress {
  return state.days[dateKey] || getEmptyDayProgress();
}

export function isWorshipItemCompleted(
  state: WorshipTrackerState,
  key: WorshipItemKey,
  dateKey: string = getLocalDateKey()
): boolean {
  const target = state.targets[key] || 1;
  const count = getDayProgress(state, dateKey).counts[key] || 0;
  return count >= target;
}

export function toggleWorshipItemComplete(
  state: WorshipTrackerState,
  key: WorshipItemKey,
  dateKey: string = getLocalDateKey()
): WorshipTrackerState {
  const day = getDayProgress(state, dateKey);
  const target = state.targets[key] || 1;
  const current = day.counts[key] || 0;
  const nextCount = current >= target ? 0 : target;
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: {
        counts: { ...day.counts, [key]: nextCount },
        updatedAtMs: Date.now(),
      },
    },
  };
}

export function adjustWorshipItemCount(
  state: WorshipTrackerState,
  key: WorshipItemKey,
  delta: number,
  dateKey: string = getLocalDateKey()
): WorshipTrackerState {
  const def = WORSHIP_ITEMS.find((i) => i.key === key);
  const target = state.targets[key] || 1;
  const cap = Math.max(target, def?.maxTarget || target);
  const day = getDayProgress(state, dateKey);
  const current = day.counts[key] || 0;
  const nextCount = Math.max(0, Math.min(cap, current + delta));
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: {
        counts: { ...day.counts, [key]: nextCount },
        updatedAtMs: Date.now(),
      },
    },
  };
}

export function updateWorshipTarget(
  state: WorshipTrackerState,
  key: WorshipItemKey,
  newTarget: number
): WorshipTrackerState {
  const clamped = clampTarget(key, newTarget);
  return {
    ...state,
    targets: {
      ...state.targets,
      [key]: clamped,
    },
  };
}

export function computeDailySummary(
  state: WorshipTrackerState,
  dateKey: string = getLocalDateKey()
): WorshipDailySummary {
  const day = getDayProgress(state, dateKey);
  let completedCount = 0;
  for (const item of WORSHIP_ITEMS) {
    const target = state.targets[item.key] || item.defaultTarget;
    if ((day.counts[item.key] || 0) >= target) {
      completedCount++;
    }
  }
  const totalItems = WORSHIP_ITEMS.length;
  const percent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  return {
    dateKey,
    completedCount,
    totalItems,
    percent,
  };
}

export function getWeeklyWorshipHistory(
  state: WorshipTrackerState,
  endDate: Date = new Date()
): WorshipDailySummary[] {
  const list: WorshipDailySummary[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - offset);
    list.push(computeDailySummary(state, getLocalDateKey(d)));
  }
  return list;
}

export function computeWeeklyAveragePercent(
  state: WorshipTrackerState,
  endDate: Date = new Date()
): number {
  const history = getWeeklyWorshipHistory(state, endDate);
  if (history.length === 0) return 0;
  const sum = history.reduce((acc, d) => acc + d.percent, 0);
  return Math.round(sum / history.length);
}
