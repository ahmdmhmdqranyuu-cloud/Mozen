import { PrayerAlertMode, PrayerKey, PrayerSettingConfig, UserProfile } from '../types';

export const ALL_PRAYER_KEYS: PrayerKey[] = [
  'fajr',
  'sunrise',
  'duha',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export const PRAYER_ARABIC_NAMES: Record<PrayerKey, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  duha: 'صلاة الضحى',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

const PRAYER_CONFIGS_STORAGE_KEY = 'moazen_prayer_configs_v1';

export function isObligatoryPrayer(key: PrayerKey): boolean {
  return key !== 'sunrise' && key !== 'duha';
}

export function loadStoredPrayerConfigs(): Partial<Record<PrayerKey, PrayerSettingConfig>> {
  try {
    const raw = localStorage.getItem(PRAYER_CONFIGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistPrayerConfigs(configs: Partial<Record<PrayerKey, PrayerSettingConfig>>): void {
  try {
    localStorage.setItem(PRAYER_CONFIGS_STORAGE_KEY, JSON.stringify(configs));
  } catch {
    // ignore
  }
}

export function saveStoredPrayerConfigs(configs: Partial<Record<PrayerKey, PrayerSettingConfig>>): void {
  persistPrayerConfigs(configs);
}

export function getPrayerConfig(user: UserProfile, prayerKey: PrayerKey): PrayerSettingConfig {
  const obligatory = isObligatoryPrayer(prayerKey);
  const storedMap = loadStoredPrayerConfigs();
  const saved = user.prayerConfigs?.[prayerKey] || storedMap[prayerKey];
  const fallbackVoice =
    prayerKey === 'fajr'
      ? user.fajrAzanVoice || 'abdulbasit_fajr'
      : prayerKey === 'duha'
      ? 'duha_surah'
      : obligatory
      ? user.azanVoice || 'makkah'
      : 'salawat_1';

  const rawManualOffset = user.manualPrayerAdjustments?.[prayerKey] ?? saved?.offsetMinutes ?? 0;
  const manualOffset = Math.max(-60, Math.min(60, Math.round(Number(rawManualOffset) || 0)));
  const legacySound = user.prayerAzanEnabled?.[prayerKey];

  if (!saved) {
    return {
      prayerKey,
      arabicName: PRAYER_ARABIC_NAMES[prayerKey],
      offsetMinutes: manualOffset,
      soundEnabled:
        typeof legacySound === 'boolean'
          ? legacySound
          : obligatory || prayerKey === 'duha'
          ? user.soundEnabled !== false
          : false,
      volumePercent: 100,
      preAlertEnabled: obligatory ? user.prePrayerReminderEnabled !== false : false,
      preAlertMinutes: user.prePrayerReminderMinutes || 15,
      preAlertVoice: 'pre_prayer_15m',
      silentDuringPrayer: false,
      azanVoice: user.prayerAzanVoices?.[prayerKey] || fallbackVoice,
      alertMode: obligatory || prayerKey === 'duha' ? 'full_azan' : 'short_tone',
      iqamaVoice: obligatory ? user.iqamaVoice || 'iqama_1' : 'none',
      duaAfterPrayerEnabled: obligatory,
      didYouPrayEnabled: true,
    };
  }

  return {
    prayerKey,
    arabicName: PRAYER_ARABIC_NAMES[prayerKey],
    offsetMinutes: Math.max(-60, Math.min(60, manualOffset)),
    soundEnabled: saved.soundEnabled,
    volumePercent: Math.max(0, Math.min(100, saved.volumePercent ?? 100)),
    preAlertEnabled: saved.preAlertEnabled ?? obligatory,
    preAlertMinutes: Math.max(1, Math.min(60, saved.preAlertMinutes ?? 15)),
    preAlertVoice: saved.preAlertVoice || 'pre_prayer_15m',
    silentDuringPrayer: Boolean(saved.silentDuringPrayer),
    azanVoice: saved.azanVoice || user.prayerAzanVoices?.[prayerKey] || fallbackVoice,
    alertMode: (saved.alertMode as PrayerAlertMode) || (obligatory ? 'full_azan' : 'short_tone'),
    iqamaVoice: saved.iqamaVoice || (obligatory ? 'iqama_1' : 'none'),
    duaAfterPrayerEnabled: saved.duaAfterPrayerEnabled ?? obligatory,
    didYouPrayEnabled: saved.didYouPrayEnabled !== false,
  };
}

export function savePrayerConfigToUser(
  prev: UserProfile,
  config: PrayerSettingConfig
): UserProfile {
  const clampedOffset = Math.max(-60, Math.min(60, Math.round(Number(config.offsetMinutes) || 0)));
  const sanitized: PrayerSettingConfig = {
    ...config,
    arabicName: PRAYER_ARABIC_NAMES[config.prayerKey],
    offsetMinutes: clampedOffset,
    volumePercent: Math.max(0, Math.min(100, config.volumePercent)),
    preAlertMinutes: Math.max(1, Math.min(60, config.preAlertMinutes)),
  };

  const nextConfigs = {
    ...loadStoredPrayerConfigs(),
    ...(prev.prayerConfigs || {}),
    [config.prayerKey]: sanitized,
  };
  persistPrayerConfigs(nextConfigs);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('prayerSettingsUpdated', {
        detail: { prayerKey: config.prayerKey, offsetMinutes: clampedOffset },
      })
    );
  }

  return {
    ...prev,
    prayerConfigs: nextConfigs,
    manualPrayerAdjustments: {
      ...(prev.manualPrayerAdjustments || {}),
      [config.prayerKey]: clampedOffset,
    },
    prayerAzanEnabled: {
      ...(prev.prayerAzanEnabled || {}),
      [config.prayerKey]: sanitized.soundEnabled,
    },
    prayerAzanVoices: {
      ...(prev.prayerAzanVoices || {}),
      [config.prayerKey]: sanitized.azanVoice,
    },
  };
}

export function applyPrayerConfigToAllUser(
  prev: UserProfile,
  source: PrayerSettingConfig
): UserProfile {
  const nextConfigs = {
    ...loadStoredPrayerConfigs(),
    ...(prev.prayerConfigs || {}),
  };
  const nextAdj = { ...(prev.manualPrayerAdjustments || {}) };
  const nextEnabled = { ...(prev.prayerAzanEnabled || {}) };
  const nextVoices = { ...(prev.prayerAzanVoices || {}) };

  const standardAzanIds = new Set([
    'makkah',
    'madinah',
    'alaqsa',
    'cairo',
    'alafasy',
    'abdulbasit',
    'hussary',
    'mohamed_rifaat',
    'mustafa_ismail',
    'nasser_alqatami',
  ]);

  ALL_PRAYER_KEYS.forEach((key) => {
    const existing = getPrayerConfig(prev, key);
    const resolvedVoice =
      key === 'fajr' &&
      source.prayerKey !== 'fajr' &&
      standardAzanIds.has(source.azanVoice)
        ? existing.azanVoice
        : source.azanVoice;

    const updated: PrayerSettingConfig = {
      ...existing,
      soundEnabled: source.soundEnabled,
      volumePercent: Math.max(0, Math.min(100, source.volumePercent)),
      preAlertEnabled: source.preAlertEnabled,
      preAlertMinutes: Math.max(1, Math.min(60, source.preAlertMinutes)),
      preAlertVoice: source.preAlertVoice,
      silentDuringPrayer: source.silentDuringPrayer,
      azanVoice: resolvedVoice,
      alertMode: source.alertMode,
      iqamaVoice: source.iqamaVoice,
      duaAfterPrayerEnabled: source.duaAfterPrayerEnabled,
      didYouPrayEnabled: source.didYouPrayEnabled !== false,
    };
    nextConfigs[key] = updated;
    nextAdj[key] = updated.offsetMinutes;
    nextEnabled[key] = updated.soundEnabled;
    nextVoices[key] = updated.azanVoice;
  });

  persistPrayerConfigs(nextConfigs);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('prayerSettingsUpdated', {
        detail: { appliedAll: true },
      })
    );
  }

  return {
    ...prev,
    prayerConfigs: nextConfigs,
    manualPrayerAdjustments: nextAdj,
    prayerAzanEnabled: nextEnabled,
    prayerAzanVoices: nextVoices,
  };
}

/**
 * Computes the trigger timestamp (ms) for the "Have you prayed?" («هل صليت؟») reminder:
 * - 5 minutes after Iqama if Iqama is active for that prayer
 * - 5 minutes after the prayer/slot time if Iqama is disabled or not applicable (Sunrise, Duha, silent/vibrate/none)
 */
export function computeDidYouPrayTriggerMs(
  prayerTimestampMs: number,
  iqamaMinutes: number,
  hasIqama: boolean
): number {
  const safeIqamaMins = hasIqama && Number.isFinite(iqamaMinutes) && iqamaMinutes > 0 ? iqamaMinutes : 0;
  return prayerTimestampMs + (safeIqamaMins + 5) * 60_000;
}

const PRAYER_QUESTION_LABELS_AR: Record<PrayerKey, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  duha: 'الضحى',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

const PRAYER_QUESTION_LABELS_EN: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  duha: 'Duha',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export function formatDidYouPrayMessage(
  prayerKey: PrayerKey,
  language?: string
): { title: string; body: string } {
  if (language === 'en') {
    const label = PRAYER_QUESTION_LABELS_EN[prayerKey] || 'this prayer';
    return {
      title: 'Have you prayed?',
      body: `Have you prayed ${label}?`,
    };
  }
  const label = PRAYER_QUESTION_LABELS_AR[prayerKey] || 'الصلاة';
  return {
    title: 'هل صليت؟',
    body: `هل صليت ${label}؟`,
  };
}

export function didYouPrayDedupKey(date: Date, prayerKey: PrayerKey): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}_${prayerKey}`;
}
