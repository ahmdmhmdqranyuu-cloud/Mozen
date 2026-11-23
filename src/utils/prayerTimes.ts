import { CityLocation, DstMode, HighLatitudeRule, PrayerKey, PrayerTime, RamadanDayImsakiya } from '../types';
import { WORLD_CITIES } from '../data/worldCitiesData';

export const CITIES_LIST: CityLocation[] = WORLD_CITIES;

const DST_STORAGE_KEY = 'moazen_dst_mode_v1';

export const HIGH_LATITUDE_RULES: { id: HighLatitudeRule; name: string; description: string }[] = [
  {
    id: 'angle_based',
    name: 'القاعدة الزاوية (Angle Based - الموصى بها)',
    description: 'تقدير الفجر والعشاء بنسبة الزاوية ÷ 60 من طول الليل عند خطوط العرض العليا',
  },
  {
    id: 'one_seventh',
    name: 'سبُع الليل (One-Seventh of Night)',
    description: 'حساب الفجر قبل الشروق بسبع الليل والعشاء بعد المغرب بسبع الليل',
  },
  {
    id: 'middle_of_night',
    name: 'منتصف الليل (Middle of Night)',
    description: 'تقسيم الليل إلى نصفين متساويين في المناطق القطبية',
  },
  {
    id: 'safe_latitude',
    name: 'الحد الآمن ±48° (Safe Latitude Fallback)',
    description: 'اعتماد خط عرض آمن (±48.5°) عند انعدام الشفق أو شمس منتصف الليل',
  },
];

export function getSavedDstMode(): DstMode {
  try {
    const saved = localStorage.getItem(DST_STORAGE_KEY) as DstMode | null;
    if (saved === 'auto' || saved === 'summer' || saved === 'winter') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'auto';
}

export function setSavedDstMode(mode: DstMode): void {
  try {
    localStorage.setItem(DST_STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent('dstModeChanged', { detail: mode }));
  } catch {
    // ignore
  }
}

/**
 * Estimates UTC timezone offset from longitude when an explicit IANA timezone is absent (e.g. manual coordinates).
 */
export function estimateTimezoneOffsetFromLongitude(longitude: number): number {
  if (!Number.isFinite(longitude)) return 0;
  const clamped = Math.max(-180, Math.min(180, longitude));
  const hours = Math.round(clamped / 15);
  return Math.max(-12, Math.min(14, hours));
}

/**
 * Computes the UTC offset in hours for a given date and IANA timeZone (with optional coordinate fallback)
 */
function getTimeZoneOffsetHours(date: Date, timeZone?: string, fallbackLongitude?: number): number {
  if (timeZone && timeZone.trim().length > 0) {
    try {
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
      const diffHours = (tzDate.getTime() - utcDate.getTime()) / 3600000;
      if (Number.isFinite(diffHours)) return diffHours;
    } catch {
      // Fallback below
    }
  }
  if (typeof fallbackLongitude === 'number' && Number.isFinite(fallbackLongitude)) {
    return estimateTimezoneOffsetFromLongitude(fallbackLongitude);
  }
  return -date.getTimezoneOffset() / 60;
}

/**
 * Detects whether Daylight Saving Time (Summer Time) is active for the phone/city timezone,
 * and returns both standard (winter) offset and current offset in hours.
 */
export function detectDaylightSavingStatus(
  date: Date = new Date(),
  timeZone?: string,
  fallbackLongitude?: number
): {
  isSystemSummerTime: boolean;
  standardWinterOffsetHours: number;
  currentSystemOffsetHours: number;
  effectiveOffsetHours: number;
  activeMode: DstMode;
  timeZoneName: string;
} {
  const hasExplicitTz = Boolean(timeZone && timeZone.trim().length > 0);
  const resolvedTz = hasExplicitTz
    ? timeZone!.trim()
    : typeof fallbackLongitude === 'number' && Number.isFinite(fallbackLongitude)
    ? `UTC${estimateTimezoneOffsetFromLongitude(fallbackLongitude) >= 0 ? '+' : ''}${estimateTimezoneOffsetFromLongitude(fallbackLongitude)}`
    : (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') ||
      'Africa/Cairo';

  const jan = new Date(date.getFullYear(), 0, 15, 12, 0, 0);
  const jul = new Date(date.getFullYear(), 6, 15, 12, 0, 0);
  const janOffset = getTimeZoneOffsetHours(jan, hasExplicitTz ? resolvedTz : undefined, fallbackLongitude);
  const julOffset = getTimeZoneOffsetHours(jul, hasExplicitTz ? resolvedTz : undefined, fallbackLongitude);
  const currentOffset = getTimeZoneOffsetHours(date, hasExplicitTz ? resolvedTz : undefined, fallbackLongitude);

  // Standard winter time is the smaller offset (e.g. UTC+2 in Cairo winter vs UTC+3 in Cairo summer)
  const standardWinterOffsetHours = Math.min(janOffset, julOffset);
  const hasNaturalDst = Math.abs(julOffset - janOffset) >= 0.5;
  const isSystemSummerTime =
    hasNaturalDst && currentOffset > standardWinterOffsetHours + 0.25;

  const activeMode = getSavedDstMode();
  let effectiveOffsetHours = currentOffset;
  if (activeMode === 'summer') {
    effectiveOffsetHours = standardWinterOffsetHours + 1;
  } else if (activeMode === 'winter') {
    effectiveOffsetHours = standardWinterOffsetHours;
  }

  return {
    isSystemSummerTime,
    standardWinterOffsetHours,
    currentSystemOffsetHours: currentOffset,
    effectiveOffsetHours,
    activeMode,
    timeZoneName: resolvedTz,
  };
}

export const CALCULATION_METHODS = [
  { id: 'egypt', name: 'الهيئة العامة المصرية للمساحة (الفجر 19.5°، العشاء 17.5°)', fajrAngle: 19.5, ishaAngle: 17.5, ishaInterval: 0 },
  { id: 'makkah', name: 'جامعة أم القرى - مكة المكرمة (الفجر 18.5°، العشاء 90 دقيقة)', fajrAngle: 18.5, ishaAngle: 0, ishaInterval: 90 },
  { id: 'mwl', name: 'رابطة العالم الإسلامي (الفجر 18°، العشاء 17°)', fajrAngle: 18.0, ishaAngle: 17.0, ishaInterval: 0 },
  { id: 'dubai', name: 'الشؤون الإسلامية بدبي والإمارات والخليج (الفجر 18.2°، العشاء 18.2°)', fajrAngle: 18.2, ishaAngle: 18.2, ishaInterval: 0 },
  { id: 'uoif', name: 'اتحاد المنظمات الإسلامية في فرنسا - UOIF (الفجر 12°، العشاء 12°)', fajrAngle: 12.0, ishaAngle: 12.0, ishaInterval: 0 },
  { id: 'karachi', name: 'جامعة العلوم الإسلامية بكراتشي (الفجر 18°، العشاء 18°)', fajrAngle: 18.0, ishaAngle: 18.0, ishaInterval: 0 },
  { id: 'isna', name: 'الجمعية الإسلامية لأمريكا الشمالية - ISNA (الفجر 15°، العشاء 15°)', fajrAngle: 15.0, ishaAngle: 15.0, ishaInterval: 0 },
  { id: 'kuwait', name: 'وزارة الأوقاف والشؤون الإسلامية بالكويت (الفجر 18°، العشاء 17.5°)', fajrAngle: 18.0, ishaAngle: 17.5, ishaInterval: 0 },
  { id: 'qatar', name: 'وزارة الأوقاف والشؤون الإسلامية بقطر (الفجر 18°، العشاء 90 دقيقة)', fajrAngle: 18.0, ishaAngle: 0, ishaInterval: 90 },
  { id: 'diyanet', name: 'رئاسة الشؤون الدينية التركية - Diyanet (الفجر 18°، العشاء 17°)', fajrAngle: 18.0, ishaAngle: 17.0, ishaInterval: 0 },
];

export function normalizeCalculationMethodId(methodId?: string): string {
  const raw = (methodId || 'egypt').trim().toLowerCase();
  if (raw === 'umm_al_qura' || raw === 'makkah' || raw.includes('qura')) return 'makkah';
  if (raw === 'uae' || raw === 'gulf' || raw === 'dubai') return 'dubai';
  if (raw === 'france' || raw === 'uoif') return 'uoif';
  if (raw === 'muslim_world_league' || raw === 'mwl') return 'mwl';
  if (raw === 'north_america' || raw === 'isna') return 'isna';
  if (CALCULATION_METHODS.some((m) => m.id === raw)) return raw;
  return 'egypt';
}

export const ASR_METHODS = [
  { id: 'standard' as const, name: 'جمهور الفقهاء (الشافعي، المالكي، الحنبلي) - ظل الشيء مثله' },
  { id: 'hanafi' as const, name: 'المذهب الحنفي - ظل الشيء مثليه' },
];

export interface PrayerCalculationLogEntry {
  timestamp: string;
  cityName: string;
  latitude: number;
  longitude: number;
  methodId: string;
  asrMethod: 'standard' | 'hanafi';
  highLatitudeRule: HighLatitudeRule;
  dstMode: DstMode;
  adjustments: Partial<Record<PrayerKey, number>>;
  chronologyValid: boolean;
  warnings: string[];
}

const MAX_CALC_LOG_ENTRIES = 40;
const calcLogBuffer: PrayerCalculationLogEntry[] = [];
let lastCalcLogDedupKey = '';

export function getPrayerCalculationLogs(): PrayerCalculationLogEntry[] {
  return [...calcLogBuffer];
}

export function clearPrayerCalculationLogs(): void {
  calcLogBuffer.length = 0;
  lastCalcLogDedupKey = '';
}

function recordPrayerCalculationLog(entry: PrayerCalculationLogEntry): void {
  const dedupKey = `${entry.timestamp.slice(0, 10)}|${entry.cityName}|${entry.latitude.toFixed(3)},${entry.longitude.toFixed(3)}|${entry.methodId}|${entry.asrMethod}|${entry.highLatitudeRule}|${entry.dstMode}|${JSON.stringify(entry.adjustments)}`;
  if (dedupKey === lastCalcLogDedupKey && entry.warnings.length === 0) {
    return;
  }
  lastCalcLogDedupKey = dedupKey;
  calcLogBuffer.push(entry);
  if (calcLogBuffer.length > MAX_CALC_LOG_ENTRIES) {
    calcLogBuffer.splice(0, calcLogBuffer.length - MAX_CALC_LOG_ENTRIES);
  }
}

export function validateCityCoordinates(city: CityLocation): {
  latitude: number;
  longitude: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let lat = Number(city?.latitude);
  let lng = Number(city?.longitude);

  if (!Number.isFinite(lat)) {
    warnings.push(`Invalid latitude "${String(city?.latitude)}", fallback to Makkah 21.4225`);
    lat = 21.4225;
  } else if (lat < -90 || lat > 90) {
    warnings.push(`Out-of-range latitude ${lat}, clamped to [-90, 90]`);
    lat = Math.max(-90, Math.min(90, lat));
  }

  if (!Number.isFinite(lng)) {
    warnings.push(`Invalid longitude "${String(city?.longitude)}", fallback to Makkah 39.8262`);
    lng = 39.8262;
  } else if (lng < -180 || lng > 180) {
    warnings.push(`Out-of-range longitude ${lng}, clamped to [-180, 180]`);
    lng = Math.max(-180, Math.min(180, lng));
  }

  return { latitude: lat, longitude: lng, warnings };
}

export function sanitizePrayerAdjustments(
  adjustments?: Partial<Record<PrayerKey, number>>
): Partial<Record<PrayerKey, number>> {
  if (!adjustments) return {};
  const keys: PrayerKey[] = ['fajr', 'sunrise', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const sanitized: Partial<Record<PrayerKey, number>> = {};
  for (const k of keys) {
    const raw = adjustments[k];
    if (typeof raw === 'number' && Number.isFinite(raw) && raw !== 0) {
      sanitized[k] = Math.max(-60, Math.min(60, Math.round(raw)));
    }
  }
  return sanitized;
}

export function validatePrayerChronology(prayers: PrayerTime[]): boolean {
  const byKey = new Map<PrayerKey, number>();
  for (const p of prayers) {
    const ts = p.timestamp.getTime();
    if (!Number.isFinite(ts)) return false;
    byKey.set(p.key, ts);
  }
  const fajr = byKey.get('fajr') ?? 0;
  const sunrise = byKey.get('sunrise') ?? 0;
  const duha = byKey.get('duha') ?? 0;
  const dhuhr = byKey.get('dhuhr') ?? 0;
  const asr = byKey.get('asr') ?? 0;
  const maghrib = byKey.get('maghrib') ?? 0;
  const isha = byKey.get('isha') ?? 0;
  return (
    fajr < sunrise &&
    sunrise <= duha &&
    duha < dhuhr &&
    dhuhr < asr &&
    asr < maghrib &&
    maghrib < isha
  );
}

/**
 * Jean Meeus Julian Day & Solar Ephemeris calculation (matches Android PrayerTimeCalculator.java)
 */
function computeSolarEphemeris(year: number, month1to12: number, day: number): {
  declinationDeg: number;
  eqOfTimeMin: number;
} {
  let y = year;
  let m = month1to12;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;

  const D = jd - 2451545.0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const normDeg = (deg: number) => {
    const r = deg % 360;
    return r < 0 ? r + 360 : r;
  };

  const g = normDeg(357.529 + 0.98560028 * D);
  const q = normDeg(280.459 + 0.98564736 * D);
  const L = normDeg(q + 1.915 * Math.sin(toRad(g)) + 0.02 * Math.sin(toRad(2 * g)));
  const e = 23.439 - 0.00000036 * D;

  const raRad = Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)));
  const raDeg = normDeg(toDeg(raRad));
  const raHours = raDeg / 15;

  const declinationDeg = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));

  let eqOfTimeHours = q / 15 - raHours;
  if (eqOfTimeHours > 12) eqOfTimeHours -= 24;
  if (eqOfTimeHours < -12) eqOfTimeHours += 24;

  return {
    declinationDeg,
    eqOfTimeMin: eqOfTimeHours * 60,
  };
}

/**
 * Astronomical prayer calculation with Jean Meeus solar ephemeris, method, juristic school,
 * manual adjustments, DST mode, and selectable high-latitude rule for global coverage (-90°..+90°).
 */
export function calculatePrayerTimes(
  city: CityLocation,
  date: Date = new Date(),
  methodId: string = 'egypt',
  asrMethod: 'standard' | 'hanafi' = 'standard',
  adjustments: Partial<Record<PrayerKey, number>> = {},
  dstModeOverride?: DstMode,
  highLatitudeRule: HighLatitudeRule = 'angle_based'
): PrayerTime[] {
  const normalizedMethodId = normalizeCalculationMethodId(methodId);
  const method = CALCULATION_METHODS.find((m) => m.id === normalizedMethodId) || CALCULATION_METHODS[0];
  const { latitude: rawLat, longitude: lng, warnings } = validateCityCoordinates(city);

  const dstStatus = detectDaylightSavingStatus(date, city?.timezone, lng);
  const effectiveDstMode = dstModeOverride || dstStatus.activeMode;

  let tzOffsetHours = dstStatus.currentSystemOffsetHours;
  if (effectiveDstMode === 'summer') {
    tzOffsetHours = dstStatus.standardWinterOffsetHours + 1;
  } else if (effectiveDstMode === 'winter') {
    tzOffsetHours = dstStatus.standardWinterOffsetHours;
  }

  const { declinationDeg, eqOfTimeMin } = computeSolarEphemeris(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  // If safe_latitude rule is active or latitude is at polar pole, compute effective lat
  const useSafeLat =
    highLatitudeRule === 'safe_latitude' && Math.abs(rawLat) > 48.5;
  const effectiveLat = useSafeLat
    ? rawLat >= 0
      ? 48.5
      : -48.5
    : Math.max(-89.9, Math.min(89.9, rawLat));
  if (Math.abs(rawLat) > 48.5) {
    warnings.push(`High latitude detected (${rawLat.toFixed(2)}°); applying rule: ${highLatitudeRule}`);
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const latRad = toRad(effectiveLat);
  const decRad = toRad(declinationDeg);

  // Solar noon
  const solarNoonMin = 720 - 4 * lng - eqOfTimeMin + tzOffsetHours * 60;

  const hourAngle = (angleDeg: number): { deg: number; clampedLow: boolean; clampedHigh: boolean } => {
    const denom = Math.cos(latRad) * Math.cos(decRad);
    if (Math.abs(denom) < 1e-9) {
      return { deg: 90, clampedLow: true, clampedHigh: false };
    }
    const cosHA = (Math.sin(toRad(-angleDeg)) - Math.sin(latRad) * Math.sin(decRad)) / denom;
    if (cosHA > 1) return { deg: 0, clampedLow: false, clampedHigh: true };
    if (cosHA < -1) return { deg: 180, clampedLow: true, clampedHigh: false };
    return { deg: toDeg(Math.acos(cosHA)), clampedLow: false, clampedHigh: false };
  };

  // Sunrise / Sunset — handle polar midnight sun / polar night safely without collapsing chronology
  const sunHA = hourAngle(0.833);
  let sunriseMin: number;
  let sunsetMin: number;
  if (sunHA.clampedLow || sunHA.clampedHigh) {
    // Fallback sunrise/sunset via safe 48.5° latitude estimate so day/night partitions remain non-zero & chronological
    const fallbackLatRad = toRad(rawLat >= 0 ? 48.5 : -48.5);
    const fbDenom = Math.cos(fallbackLatRad) * Math.cos(decRad);
    const fbCos = Math.max(-0.99, Math.min(0.99, (Math.sin(toRad(-0.833)) - Math.sin(fallbackLatRad) * Math.sin(decRad)) / fbDenom));
    const fbDeg = toDeg(Math.acos(fbCos));
    sunriseMin = solarNoonMin - (fbDeg / 15) * 60;
    sunsetMin = solarNoonMin + (fbDeg / 15) * 60;
  } else {
    sunriseMin = solarNoonMin - (sunHA.deg / 15) * 60;
    sunsetMin = solarNoonMin + (sunHA.deg / 15) * 60;
  }
  const nightDurationMin = Math.max(120, sunriseMin + 1440 - sunsetMin);

  // Dhuhr: solar noon + 2 min
  const dhuhrMin = solarNoonMin + 2;

  // Duha (4.5° above horizon, strictly bounded between sunrise+15m and dhuhr-10m)
  const duhaRawHA = hourAngle(-4.5).deg;
  const duhaRawMin = solarNoonMin - (duhaRawHA / 15) * 60;
  const duhaClampedMin = Math.max(sunriseMin + 15, Math.min(dhuhrMin - 10, duhaRawMin));

  // Helper to compute portion for high-latitude rules
  const computeNightPortion = (angleDeg: number, rule: HighLatitudeRule): number => {
    switch (rule) {
      case 'middle_of_night':
        return nightDurationMin * 0.5;
      case 'one_seventh':
        return nightDurationMin / 7.0;
      case 'angle_based':
      case 'safe_latitude':
      default:
        return (angleDeg / 60.0) * nightDurationMin;
    }
  };

  // Fajr
  const fajrRes = hourAngle(method.fajrAngle);
  let fajrMin = solarNoonMin - (fajrRes.deg / 15) * 60;
  if (fajrRes.clampedLow || fajrRes.clampedHigh || sunriseMin - fajrMin > computeNightPortion(method.fajrAngle, 'angle_based') + 240) {
    if (fajrRes.clampedLow || fajrRes.clampedHigh) {
      fajrMin = sunriseMin - computeNightPortion(method.fajrAngle, highLatitudeRule);
    }
  }
  if (fajrMin >= sunriseMin - 10) {
    fajrMin = sunriseMin - computeNightPortion(method.fajrAngle, highLatitudeRule);
  }

  // Asr: shadow multiplier (1 for standard, 2 for hanafi)
  const shadowMultiplier = asrMethod === 'hanafi' ? 2 : 1;
  const asrAlt = toDeg(Math.atan(1 / (shadowMultiplier + Math.tan(Math.abs(latRad - decRad)))));
  const asrDenom = Math.cos(latRad) * Math.cos(decRad);
  const rawCosAsrHA = Math.abs(asrDenom) < 1e-9
    ? 0.5
    : (Math.sin(toRad(asrAlt)) - Math.sin(latRad) * Math.sin(decRad)) / asrDenom;
  const asrHA = toDeg(Math.acos(Math.max(-0.999, Math.min(0.999, rawCosAsrHA))));
  let asrMin = solarNoonMin + (asrHA / 15) * 60;
  if (asrMin <= dhuhrMin + 15) asrMin = dhuhrMin + 30;
  if (asrMin >= sunsetMin - 10) asrMin = Math.max(dhuhrMin + 20, sunsetMin - 20);

  // Isha
  let ishaMin: number;
  if (method.ishaInterval > 0) {
    ishaMin = sunsetMin + method.ishaInterval;
  } else {
    const ishaRes = hourAngle(method.ishaAngle);
    if (ishaRes.clampedLow || ishaRes.clampedHigh) {
      ishaMin = sunsetMin + computeNightPortion(method.ishaAngle, highLatitudeRule);
    } else {
      ishaMin = solarNoonMin + (ishaRes.deg / 15) * 60;
    }
  }
  if (ishaMin <= sunsetMin + 10) {
    ishaMin = sunsetMin + computeNightPortion(method.ishaAngle || 17, highLatitudeRule);
  }

  // Apply sanitized manual adjustments (clamped -60..+60) and guarantee valid chronology
  const adj = sanitizePrayerAdjustments(adjustments);
  const sunriseFinalMin = sunriseMin + (adj.sunrise || 0);
  const fajrFinalMin = Math.min(sunriseFinalMin - 1, fajrMin + (adj.fajr || 0));
  const dhuhrFinalMin = Math.max(sunriseFinalMin + 20, dhuhrMin + (adj.dhuhr || 0));
  const duhaFinalMin = Math.max(
    sunriseFinalMin + 1,
    Math.min(dhuhrFinalMin - 1, duhaClampedMin + (adj.duha || 0))
  );
  const asrFinalMin = Math.max(dhuhrFinalMin + 1, asrMin + (adj.asr || 0));
  const maghribFinalMin = Math.max(asrFinalMin + 1, sunsetMin + (adj.maghrib || 0));
  const ishaFinalMin = Math.max(maghribFinalMin + 1, ishaMin + (adj.isha || 0));

  const formatTime = (minutes: number, is12hr = false): string => {
    let m = Math.round(minutes);
    while (m < 0) m += 1440;
    while (m >= 1440) m -= 1440;
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (is12hr) {
      const h12 = h % 12 || 12;
      return `${h12}:${min.toString().padStart(2, '0')}`;
    }
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  const createDateFromMinutes = (minutes: number): Date => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    return new Date(d.getTime() + Math.round(minutes) * 60000);
  };

  const now = new Date();

  const prayers: { key: PrayerKey; name: string; min: number; icon: string }[] = [
    { key: 'fajr', name: 'الفجر', min: fajrFinalMin, icon: 'fajr' },
    { key: 'sunrise', name: 'الشروق', min: sunriseFinalMin, icon: 'sunrise' },
    { key: 'duha', name: 'الضحى', min: duhaFinalMin, icon: 'duha' },
    { key: 'dhuhr', name: 'الظهر', min: dhuhrFinalMin, icon: 'dhuhr' },
    { key: 'asr', name: 'العصر', min: asrFinalMin, icon: 'asr' },
    { key: 'maghrib', name: 'المغرب', min: maghribFinalMin, icon: 'maghrib' },
    { key: 'isha', name: 'العشاء', min: ishaFinalMin, icon: 'isha' },
  ];

  const computed: PrayerTime[] = prayers.map((p) => {
    const prayerDate = createDateFromMinutes(p.min);
    return {
      key: p.key,
      name: p.name,
      time: formatTime(p.min, true),
      icon: p.icon,
      isPassed: now.getTime() > prayerDate.getTime(),
      isActive: false,
      timestamp: prayerDate,
    };
  });

  const chronologyValid = validatePrayerChronology(computed);
  if (!chronologyValid) {
    warnings.push(`Prayer chronology anomaly detected for ${city?.name || 'unknown'} (${method.id})`);
  }

  recordPrayerCalculationLog({
    timestamp: new Date().toISOString(),
    cityName: city?.name || 'مكة المكرمة',
    latitude: rawLat,
    longitude: lng,
    methodId: method.id,
    asrMethod,
    highLatitudeRule,
    dstMode: effectiveDstMode,
    adjustments: adj,
    chronologyValid,
    warnings,
  });

  return computed;
}

/**
 * Generate full 30-day Ramadan Imsakiya for user's city & selected calculation method
 */
export function calculateRamadanCalendar(
  city: CityLocation,
  methodId: string = 'egypt',
  asrMethod: 'standard' | 'hanafi' = 'standard',
  adjustments: Partial<Record<PrayerKey, number>> = {},
  ramadanStartDate: Date = new Date(2026, 1, 18), // Approx mid-Feb 2026 for Ramadan 1447
  dstModeOverride?: DstMode,
  highLatitudeRule: HighLatitudeRule = 'angle_based'
): RamadanDayImsakiya[] {
  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const now = new Date();
  const calendar: RamadanDayImsakiya[] = [];

  for (let day = 1; day <= 30; day++) {
    const d = new Date(ramadanStartDate);
    d.setDate(ramadanStartDate.getDate() + (day - 1));

    const dayName = arabicDays[d.getDay()];
    const gregorianStr = `${dayName} ${d.getDate()} ${arabicMonths[d.getMonth()]}`;

    const prayerTimes = calculatePrayerTimes(
      city,
      d,
      methodId,
      asrMethod,
      adjustments,
      dstModeOverride,
      highLatitudeRule
    );
    const fajrPrayer = prayerTimes.find((p) => p.key === 'fajr')!;
    const sunrisePrayer = prayerTimes.find((p) => p.key === 'sunrise')!;
    const dhuhrPrayer = prayerTimes.find((p) => p.key === 'dhuhr')!;
    const asrPrayer = prayerTimes.find((p) => p.key === 'asr')!;
    const maghribPrayer = prayerTimes.find((p) => p.key === 'maghrib')!;
    const ishaPrayer = prayerTimes.find((p) => p.key === 'isha')!;

    // Imsak is 10 minutes before Fajr
    const imsakDate = new Date(fajrPrayer.timestamp.getTime() - 10 * 60 * 1000);
    const imsakH = imsakDate.getHours();
    const imsakM = imsakDate.getMinutes();
    const imsakStr = `${imsakH % 12 || 12}:${imsakM.toString().padStart(2, '0')}`;

    // Fasting duration: Fajr to Maghrib
    const diffMs = maghribPrayer.timestamp.getTime() - fajrPrayer.timestamp.getTime();
    const fastingH = Math.floor(diffMs / 3600000);
    const fastingM = Math.floor((diffMs % 3600000) / 60000);
    const fastingDurationStr = `${fastingH} ساعة و ${fastingM} دقيقة`;

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    calendar.push({
      dayNumber: day,
      hijriDate: `${day} رمضان 1447 هـ`,
      gregorianDateStr: gregorianStr,
      imsak: imsakStr,
      fajr: fajrPrayer.time,
      sunrise: sunrisePrayer.time,
      dhuhr: dhuhrPrayer.time,
      asr: asrPrayer.time,
      maghrib: maghribPrayer.time,
      isha: ishaPrayer.time,
      fastingDurationStr,
      isToday,
      date: d,
    });
  }

  return calendar;
}

/**
 * Calculates countdown to Ramadan or days remaining
 */
export function getRamadanCountdown(targetDate: Date = new Date(2026, 1, 18)) {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    // Ramadan has started or ended
    return {
      hasArrived: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      message: 'شهر رمضان المبارك يظللنا بنفحاته العطرة',
    };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    hasArrived: false,
    days,
    hours,
    minutes,
    seconds,
    message: `متبقي على قدوم شهر الخير والبركات`,
  };
}


/**
 * Finds next upcoming prayer and countdown
 */
export function getNextPrayerInfo(prayers: PrayerTime[]) {
  const now = new Date();
  
  // Find the first prayer that hasn't passed today (excluding sunrise as a non-obligatory prayer or including it)
  // The screenshot highlights "المغرب" as upcoming with countdown "بعد 02:18"
  let upcoming = prayers.find((p) => p.timestamp.getTime() > now.getTime());

  if (!upcoming) {
    // If all prayers passed today, next is Fajr tomorrow
    const fajrTomorrow = new Date(prayers[0].timestamp);
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
    const diffMs = fajrTomorrow.getTime() - now.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    return {
      nextPrayer: prayers[0],
      countdownStr: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      secondsStr: seconds.toString().padStart(2, '0'),
      isNextDay: true,
    };
  }

  const diffMs = upcoming.timestamp.getTime() - now.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  return {
    nextPrayer: upcoming,
    countdownStr: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    secondsStr: seconds.toString().padStart(2, '0'),
    isNextDay: false,
  };
}

/**
 * Calculates Qibla direction angle from true north
 * Kaaba coordinates: 21.4225° N, 39.8262° E
 */
export function calculateQiblaDirection(latitude: number, longitude: number): { angle: number; distanceKm: number } {
  const kaabaLat = 21.4225 * (Math.PI / 180);
  const kaabaLng = 39.8262 * (Math.PI / 180);
  const userLat = latitude * (Math.PI / 180);
  const userLng = longitude * (Math.PI / 180);

  const deltaLng = kaabaLng - userLng;

  const y = Math.sin(deltaLng);
  const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(deltaLng);
  let qiblaRad = Math.atan2(y, x);
  let qiblaDeg = (qiblaRad * 180) / Math.PI;
  qiblaDeg = (qiblaDeg + 360) % 360;

  // Haversine distance to Makkah
  const R = 6371; // Earth radius in KM
  const dLat = kaabaLat - userLat;
  const dLng = kaabaLng - userLng;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat) * Math.cos(kaabaLat) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);

  return {
    angle: Math.round(qiblaDeg),
    distanceKm,
  };
}

/**
 * Standard Iqama Delays in minutes after Azan:
 * - Fajr: 15 minutes
 * - Dhuhr: 15 minutes
 * - Asr: 15 minutes
 * - Maghrib: 7 minutes
 * - Isha: 15 minutes
 */
export const DEFAULT_IQAMA_MINUTES: Record<PrayerKey, number> = {
  fajr: 15,
  sunrise: 0,
  duha: 0,
  dhuhr: 15,
  asr: 15,
  maghrib: 7,
  isha: 15,
};

export interface ActiveIqamaCountdown {
  prayerKey: PrayerKey;
  prayerName: string;
  azanTimeStr: string;
  iqamaTimeStr: string;
  iqamaTimestamp: Date;
  remainingSeconds: number;
  minutes: number;
  seconds: number;
  countdownStr: string; // e.g. "14:35"
  progressPercent: number; // 0 to 100
}

/**
 * Checks whether an Iqama countdown is currently active after any recent Azan.
 * If current time is between Azan and Iqama (e.g. 15 mins for Dhuhr, 7 mins for Maghrib),
 * returns details for the active countdown.
 */
export function getActiveIqamaCountdown(
  prayers: PrayerTime[],
  intervals: Partial<Record<PrayerKey, number>> = DEFAULT_IQAMA_MINUTES,
  now: Date = new Date()
): ActiveIqamaCountdown | null {
  for (const prayer of prayers) {
    if (prayer.key === 'sunrise' || prayer.key === 'duha') continue;
    const intervalMinutes = intervals[prayer.key] ?? DEFAULT_IQAMA_MINUTES[prayer.key] ?? 15;
    if (intervalMinutes <= 0) continue;

    const azanTime = prayer.timestamp;
    const iqamaTimestamp = new Date(azanTime.getTime() + intervalMinutes * 60 * 1000);

    // If current time is between the Azan time and Iqama time
    if (now.getTime() >= azanTime.getTime() && now.getTime() < iqamaTimestamp.getTime()) {
      const remainingMs = iqamaTimestamp.getTime() - now.getTime();
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      const m = Math.floor(remainingSeconds / 60);
      const s = remainingSeconds % 60;
      const totalIntervalSeconds = intervalMinutes * 60;
      const progressPercent = Math.min(
        100,
        Math.max(0, ((totalIntervalSeconds - remainingSeconds) / totalIntervalSeconds) * 100)
      );

      const iqamaH = iqamaTimestamp.getHours();
      const iqamaM = iqamaTimestamp.getMinutes();
      const iqama12H = iqamaH % 12 || 12;
      const iqamaTimeStr = `${iqama12H}:${iqamaM.toString().padStart(2, '0')}`;

      return {
        prayerKey: prayer.key,
        prayerName: prayer.name,
        azanTimeStr: prayer.time,
        iqamaTimeStr,
        iqamaTimestamp,
        remainingSeconds,
        minutes: m,
        seconds: s,
        countdownStr: `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
        progressPercent,
      };
    }
  }

  return null;
}

/**
 * Calculates formatted Iqama time string for any prayer
 */
export function formatIqamaTime(
  prayerTimestamp: Date,
  intervalMinutes: number
): string {
  const iqamaDate = new Date(prayerTimestamp.getTime() + intervalMinutes * 60 * 1000);
  const h = iqamaDate.getHours();
  const m = iqamaDate.getMinutes();
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')}`;
}


export interface NightThirds {
  maghribTime: Date;
  fajrTime: Date;
  firstThirdEnd: Date;
  midnight: Date;
  lastThirdStart: Date;
  durationMs: number;
  firstThirdEndFormatted: string;
  midnightFormatted: string;
  lastThirdStartFormatted: string;
}

/**
 * Calculates Islamic night divisions (first third, midnight, and last third/suhoor)
 * from Sunset (Maghrib) to True Dawn (Fajr).
 */
export function calculateNightThirds(
  city: CityLocation,
  date: Date = new Date(),
  methodId: string = 'egypt',
  asrMethod: 'standard' | 'hanafi' = 'standard',
  adjustments: Partial<Record<PrayerKey, number>> = {},
  dstModeOverride?: DstMode,
  highLatitudeRule: HighLatitudeRule = 'angle_based'
): NightThirds {
  const todayPrayers = calculatePrayerTimes(
    city,
    date,
    methodId,
    asrMethod,
    adjustments,
    dstModeOverride,
    highLatitudeRule
  );
  const maghrib = todayPrayers.find((p) => p.key === 'maghrib') || todayPrayers[5] || todayPrayers[4];

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowPrayers = calculatePrayerTimes(
    city,
    tomorrow,
    methodId,
    asrMethod,
    adjustments,
    dstModeOverride,
    highLatitudeRule
  );
  const nextFajr = tomorrowPrayers.find((p) => p.key === 'fajr') || tomorrowPrayers[0];

  const nightDurationMs = nextFajr.timestamp.getTime() - maghrib.timestamp.getTime();
  const oneThirdMs = nightDurationMs / 3;

  const firstThirdEnd = new Date(maghrib.timestamp.getTime() + oneThirdMs);
  const midnight = new Date(maghrib.timestamp.getTime() + nightDurationMs / 2);
  const lastThirdStart = new Date(nextFajr.timestamp.getTime() - oneThirdMs);

  const formatTime = (d: Date) => {
    const hours = d.getHours();
    const mins = d.getMinutes();
    const h12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'م' : 'ص';
    return `${h12}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  return {
    maghribTime: maghrib.timestamp,
    fajrTime: nextFajr.timestamp,
    firstThirdEnd,
    midnight,
    lastThirdStart,
    durationMs: nightDurationMs,
    firstThirdEndFormatted: formatTime(firstThirdEnd),
    midnightFormatted: formatTime(midnight),
    lastThirdStartFormatted: formatTime(lastThirdStart),
  };
}


