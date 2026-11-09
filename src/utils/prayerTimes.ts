import { CityLocation, DstMode, PrayerKey, PrayerTime, RamadanDayImsakiya } from '../types';
import { WORLD_CITIES } from '../data/worldCitiesData';

export const CITIES_LIST: CityLocation[] = WORLD_CITIES;

const DST_STORAGE_KEY = 'moazen_dst_mode_v1';

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
 * Computes the UTC offset in hours for a given date and IANA timeZone
 */
function getTimeZoneOffsetHours(date: Date, timeZone?: string): number {
  if (timeZone) {
    try {
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
      return (tzDate.getTime() - utcDate.getTime()) / 3600000;
    } catch {
      // Fallback to device timezone offset
    }
  }
  return -date.getTimezoneOffset() / 60;
}

/**
 * Detects whether Daylight Saving Time (Summer Time) is active for the phone/city timezone,
 * and returns both standard (winter) offset and current offset in hours.
 */
export function detectDaylightSavingStatus(
  date: Date = new Date(),
  timeZone?: string
): {
  isSystemSummerTime: boolean;
  standardWinterOffsetHours: number;
  currentSystemOffsetHours: number;
  effectiveOffsetHours: number;
  activeMode: DstMode;
  timeZoneName: string;
} {
  const resolvedTz =
    timeZone ||
    (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') ||
    'Africa/Cairo';
  const jan = new Date(date.getFullYear(), 0, 15, 12, 0, 0);
  const jul = new Date(date.getFullYear(), 6, 15, 12, 0, 0);
  const janOffset = getTimeZoneOffsetHours(jan, resolvedTz);
  const julOffset = getTimeZoneOffsetHours(jul, resolvedTz);
  const currentOffset = getTimeZoneOffsetHours(date, resolvedTz);

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
  { id: 'karachi', name: 'جامعة العلوم الإسلامية بكراتشي (الفجر 18°، العشاء 18°)', fajrAngle: 18.0, ishaAngle: 18.0, ishaInterval: 0 },
  { id: 'isna', name: 'الجمعية الإسلامية لأمريكا الشمالية - ISNA (الفجر 15°، العشاء 15°)', fajrAngle: 15.0, ishaAngle: 15.0, ishaInterval: 0 },
  { id: 'kuwait', name: 'وزارة الأوقاف والشؤون الإسلامية بالكويت (الفجر 18°، العشاء 17.5°)', fajrAngle: 18.0, ishaAngle: 17.5, ishaInterval: 0 },
  { id: 'diyanet', name: 'رئاسة الشؤون الدينية التركية - Diyanet (الفجر 18°، العشاء 17°)', fajrAngle: 18.0, ishaAngle: 17.0, ishaInterval: 0 },
];

export const ASR_METHODS = [
  { id: 'standard' as const, name: 'جمهور الفقهاء (الشافعي، المالكي، الحنبلي) - ظل الشيء مثله' },
  { id: 'hanafi' as const, name: 'المذهب الحنفي - ظل الشيء مثليه' },
];

/**
 * Astronomical prayer calculation with method, juristic school, manual adjustments, and DST mode
 */
export function calculatePrayerTimes(
  city: CityLocation,
  date: Date = new Date(),
  methodId: string = 'egypt',
  asrMethod: 'standard' | 'hanafi' = 'standard',
  adjustments: Partial<Record<PrayerKey, number>> = {},
  dstModeOverride?: DstMode
): PrayerTime[] {
  const method = CALCULATION_METHODS.find((m) => m.id === methodId) || CALCULATION_METHODS[0];

  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);

  const lat = city.latitude;
  const lng = city.longitude;
  const dstStatus = detectDaylightSavingStatus(date, city.timezone);
  const effectiveDstMode = dstModeOverride || dstStatus.activeMode;

  let tzOffsetHours = dstStatus.currentSystemOffsetHours;
  if (effectiveDstMode === 'summer') {
    tzOffsetHours = dstStatus.standardWinterOffsetHours + 1;
  } else if (effectiveDstMode === 'winter') {
    tzOffsetHours = dstStatus.standardWinterOffsetHours;
  }
  
  // Solar noon
  const solarNoonMin = 720 - 4 * lng - EoT + tzOffsetHours * 60;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const latRad = toRad(lat);
  const decRad = toRad(declination);

  const hourAngle = (angle: number) => {
    const cosHA = (Math.sin(toRad(-angle)) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
    if (cosHA > 1) return 0;
    if (cosHA < -1) return 180;
    return toDeg(Math.acos(cosHA));
  };

  // Sunrise / Sunset
  const sunHA = hourAngle(0.833);
  const sunriseMin = solarNoonMin - (sunHA / 15) * 60;
  const sunsetMin = solarNoonMin + (sunHA / 15) * 60;

  // Fajr
  const fajrHA = hourAngle(method.fajrAngle);
  const fajrMin = solarNoonMin - (fajrHA / 15) * 60;

  // Isha
  let ishaMin: number;
  if (method.ishaInterval > 0) {
    ishaMin = sunsetMin + method.ishaInterval;
  } else {
    const ishaHA = hourAngle(method.ishaAngle);
    ishaMin = solarNoonMin + (ishaHA / 15) * 60;
  }

  // Asr: shadow multiplier (1 for standard, 2 for hanafi)
  const shadowMultiplier = asrMethod === 'hanafi' ? 2 : 1;
  const asrAlt = toDeg(Math.atan(1 / (shadowMultiplier + Math.tan(Math.abs(latRad - decRad)))));
  const cosAsrHA = (Math.sin(toRad(asrAlt)) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
  const asrHA = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAsrHA))));
  const asrMin = solarNoonMin + (asrHA / 15) * 60;

  // Dhuhr: solar noon + 2 min
  const dhuhrMin = solarNoonMin + 2;

  // Apply manual adjustments
  const adj = adjustments || {};
  const fajrFinalMin = fajrMin + (adj.fajr || 0);
  const sunriseFinalMin = sunriseMin + (adj.sunrise || 0);
  const dhuhrFinalMin = dhuhrMin + (adj.dhuhr || 0);
  const asrFinalMin = asrMin + (adj.asr || 0);
  const maghribFinalMin = sunsetMin + (adj.maghrib || 0);
  const ishaFinalMin = ishaMin + (adj.isha || 0);

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
    const d = new Date(date);
    let m = Math.round(minutes);
    while (m < 0) m += 1440;
    while (m >= 1440) m -= 1440;
    d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    return d;
  };

  const now = new Date();

  const prayers: { key: PrayerKey; name: string; min: number; icon: string }[] = [
    { key: 'fajr', name: 'الفجر', min: fajrFinalMin, icon: 'fajr' },
    { key: 'sunrise', name: 'الشروق', min: sunriseFinalMin, icon: 'sunrise' },
    { key: 'dhuhr', name: 'الظهر', min: dhuhrFinalMin, icon: 'dhuhr' },
    { key: 'asr', name: 'العصر', min: asrFinalMin, icon: 'asr' },
    { key: 'maghrib', name: 'المغرب', min: maghribFinalMin, icon: 'maghrib' },
    { key: 'isha', name: 'العشاء', min: ishaFinalMin, icon: 'isha' },
  ];

  return prayers.map((p) => {
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
}

/**
 * Generate full 30-day Ramadan Imsakiya for user's city & selected calculation method
 */
export function calculateRamadanCalendar(
  city: CityLocation,
  methodId: string = 'egypt',
  asrMethod: 'standard' | 'hanafi' = 'standard',
  adjustments: Partial<Record<PrayerKey, number>> = {},
  ramadanStartDate: Date = new Date(2026, 1, 18) // Approx mid-Feb 2026 for Ramadan 1447
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

    const prayerTimes = calculatePrayerTimes(city, d, methodId, asrMethod, adjustments);
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
  intervals: Record<PrayerKey, number> = DEFAULT_IQAMA_MINUTES,
  now: Date = new Date()
): ActiveIqamaCountdown | null {
  for (const prayer of prayers) {
    if (prayer.key === 'sunrise') continue;
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
  dstModeOverride?: DstMode
): NightThirds {
  const todayPrayers = calculatePrayerTimes(city, date, methodId, asrMethod, adjustments, dstModeOverride);
  const maghrib = todayPrayers.find((p) => p.key === 'maghrib') || todayPrayers[4];

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowPrayers = calculatePrayerTimes(city, tomorrow, methodId, asrMethod, adjustments, dstModeOverride);
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


