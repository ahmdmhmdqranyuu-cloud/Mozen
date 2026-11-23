import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Volume2, VolumeX, Clock } from 'lucide-react';
import { CityLocation, DstMode, HighLatitudeRule, PrayerKey, PrayerTime } from '../types';
import {
  calculatePrayerTimes,
  getNextPrayerInfo,
  getActiveIqamaCountdown,
  DEFAULT_IQAMA_MINUTES,
  ActiveIqamaCountdown,
  detectDaylightSavingStatus,
} from '../utils/prayerTimes';
import { hasUserConfirmedLocation } from '../data/worldCitiesData';
import { soundService } from '../utils/audioPlayer';
import { AppLanguage, getTranslation } from '../utils/i18n';

interface PrayerCardProps {
  city: CityLocation;
  language?: AppLanguage;
  dstMode?: DstMode;
  highLatitudeRule?: HighLatitudeRule;
  azanVoice?: string;
  iqamaVoice?: string;
  calculationMethod?: string;
  asrJuristicMethod?: 'standard' | 'hanafi';
  manualAdjustments?: Partial<Record<PrayerKey, number>>;
  iqamaIntervals?: Partial<Record<PrayerKey, number>>;
  onOpenPrayerModal: () => void;
  onOpenPrayerSettings?: (prayerKey: PrayerKey) => void;
  onOpenCitySelector: () => void;
}

const SHORT_METHOD_NAMES: Record<string, string> = {
  egypt: 'الهيئة المصرية للمساحة',
  makkah: 'أم القرى',
  umm_al_qura: 'أم القرى',
  mwl: 'رابطة العالم الإسلامي',
  dubai: 'دبي والإمارات',
  uoif: 'فرنسا UOIF',
  karachi: 'كراتشي',
  isna: 'ISNA',
  kuwait: 'الكويت',
  qatar: 'قطر',
  diyanet: 'تركيا',
};

const getPrayerIcon = (key: PrayerKey, isActive: boolean) => {
  const colorClass = isActive ? 'text-[#104B40]' : 'text-[#172A28]/75';
  switch (key) {
    case 'fajr':
      return (
        <svg className={`w-3 h-3 mx-auto ${colorClass} stroke-current`} fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m6.364 1.636l-2.121 2.121M21 12h-3M4 12H1m4.757-5.243L3.636 4.636M6 17h12M4 21h16" />
        </svg>
      );
    case 'sunrise':
      return (
        <svg className={`w-3 h-3 mx-auto ${colorClass} stroke-current`} fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m6.364 1.636l-2.121 2.121M21 12h-3M4 12H1m4.757-5.243L3.636 4.636M7 16a5 5 0 0 1 10 0M3 20h18" />
        </svg>
      );
    case 'duha':
      return (
        <svg className={`w-3 h-3 mx-auto ${colorClass} stroke-current`} fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <circle cx="12" cy="13" r="3.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v2.5M6.34 7.34l1.77 1.77M17.66 7.34l-1.77 1.77M3.5 14h2M18.5 14h2M4 19h16" />
        </svg>
      );
    case 'dhuhr':
      return (
        <svg className={`w-3 h-3 mx-auto ${colorClass} stroke-current`} fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case 'asr':
      return (
        <svg className={`w-3 h-3 mx-auto ${colorClass} stroke-current`} fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <circle cx="8" cy="8" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v2M2 8h2M16 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18" />
        </svg>
      );
    case 'maghrib':
      return (
        <svg className={`w-3 h-3 mx-auto ${colorClass} fill-current`} viewBox="0 0 24 24">
          <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V11H7a1 1 0 0 0-1 1v8h12v-8a1 1 0 0 0-1-1h-3V9.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4zm-1 14h2v4h-2v-4z" />
        </svg>
      );
    case 'isha':
      return (
        <svg className={`w-3 h-3 mx-auto ${colorClass} stroke-current fill-current`} viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
  }
};

export const PrayerCard: React.FC<PrayerCardProps> = React.memo(({
  city,
  language,
  dstMode,
  highLatitudeRule = 'angle_based',
  azanVoice = 'makkah',
  iqamaVoice = 'iqama_1',
  calculationMethod = 'egypt',
  asrJuristicMethod = 'standard',
  manualAdjustments = {},
  iqamaIntervals = DEFAULT_IQAMA_MINUTES,
  onOpenPrayerModal,
  onOpenPrayerSettings,
  onOpenCitySelector,
}) => {
  const t = useMemo(() => getTranslation(language), [language]);
  const [dateStamp, setDateStamp] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  });
  const [refreshRevision, setRefreshRevision] = useState(0);

  const prayers: PrayerTime[] = useMemo(() => {
    void dateStamp;
    void refreshRevision;
    return calculatePrayerTimes(
      city,
      new Date(),
      calculationMethod,
      asrJuristicMethod,
      manualAdjustments,
      dstMode,
      highLatitudeRule
    );
  }, [city, calculationMethod, asrJuristicMethod, manualAdjustments, dstMode, highLatitudeRule, dateStamp, refreshRevision]);

  const [countdown, setCountdown] = useState<{
    prayerKey: PrayerKey;
    prayerName: string;
    countdownStr: string;
    secondsStr: string;
  }>(() => {
    const info = getNextPrayerInfo(prayers);
    return {
      prayerKey: info.nextPrayer.key,
      prayerName: info.nextPrayer.name,
      countdownStr: info.countdownStr,
      secondsStr: info.secondsStr,
    };
  });
  const [activeIqama, setActiveIqama] = useState<ActiveIqamaCountdown | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState<boolean>(() =>
    hasUserConfirmedLocation()
  );

  const getLocalizedPrayerName = useCallback(
    (key: PrayerKey, fallback: string): string => {
      switch (key) {
        case 'fajr':
          return t.fajr;
        case 'sunrise':
          return t.sunrise;
        case 'duha':
          return t.duha || 'الضحى';
        case 'dhuhr':
          return t.dhuhr;
        case 'asr':
          return t.asr;
        case 'maghrib':
          return t.maghrib;
        case 'isha':
          return t.isha;
        default:
          return fallback;
      }
    },
    [t]
  );

  useEffect(() => {
    const updateTicker = () => {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      if (todayKey !== dateStamp) {
        setDateStamp(todayKey);
      }

      const iqamaCountdown = getActiveIqamaCountdown(prayers, iqamaIntervals, now);
      setActiveIqama(iqamaCountdown);

      const info = getNextPrayerInfo(prayers);
      setCountdown({
        prayerKey: info.nextPrayer.key,
        prayerName: info.nextPrayer.name,
        countdownStr: info.countdownStr,
        secondsStr: info.secondsStr,
      });
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [prayers, iqamaIntervals, dateStamp]);

  useEffect(() => {
    const handleForceUpdate = () => setRefreshRevision((r) => r + 1);
    const handleLocUpdate = () => {
      setIsLocationConfirmed(hasUserConfirmedLocation());
      setRefreshRevision((r) => r + 1);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const d = new Date();
        setDateStamp(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    };
    window.addEventListener('dstModeChanged', handleForceUpdate);
    window.addEventListener('locationUpdated', handleLocUpdate);
    window.addEventListener('prayerTimesUpdated', handleForceUpdate);
    window.addEventListener('prayerSettingsUpdated', handleForceUpdate);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('dstModeChanged', handleForceUpdate);
      window.removeEventListener('locationUpdated', handleLocUpdate);
      window.removeEventListener('prayerTimesUpdated', handleForceUpdate);
      window.removeEventListener('prayerSettingsUpdated', handleForceUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleToggleSound = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPlayingSound) {
        soundService.stopAudio();
        setIsPlayingSound(false);
      } else {
        if (activeIqama) {
          const started = soundService.playIqama(iqamaVoice, () => setIsPlayingSound(false));
          if (started) setIsPlayingSound(true);
        } else {
          const isFajr = countdown.prayerKey === 'fajr' || countdown.prayerName.includes('الفجر');
          const started = soundService.playAzan(azanVoice, isFajr, () => setIsPlayingSound(false));
          if (started) setIsPlayingSound(true);
        }
      }
    },
    [isPlayingSound, activeIqama, iqamaVoice, countdown.prayerKey, countdown.prayerName, azanVoice]
  );

  const isSummerActive = useMemo(() => {
    const dstStatus = detectDaylightSavingStatus(new Date(), city.timezone, city.longitude);
    return (
      (dstMode || dstStatus.activeMode) === 'summer' ||
      ((dstMode || dstStatus.activeMode) === 'auto' && dstStatus.isSystemSummerTime)
    );
  }, [city.timezone, city.longitude, dstMode, dateStamp]);

  const methodLabel = useMemo(
    () => SHORT_METHOD_NAMES[calculationMethod] || SHORT_METHOD_NAMES.egypt,
    [calculationMethod]
  );

  return (
    <div className="moazen-widget relative mx-3 mt-0 rounded-2xl px-2 py-0.5 sm:px-2.5 sm:py-1 border border-[#D6C18D] shadow-lg transition-all select-none shrink-0">
      {/* Top row: City Location, Calculation Method & DST badge */}
      <div className="flex items-center justify-between mb-0.5 px-1 gap-1">
        {activeIqama ? (
          <div className="flex items-center gap-1 text-[9px] font-black text-amber-900 bg-[#F6EEDC] border border-[#D6C18D] px-2 py-0.5 rounded-full animate-pulse">
            <Clock className="w-2.5 h-2.5 text-amber-700" />
            <span>
              {t.iqamaLabel} {getLocalizedPrayerName(activeIqama.prayerKey, activeIqama.prayerName)}: {activeIqama.countdownStr}
            </span>
          </div>
        ) : (
          <span className="text-[8.5px] font-bold text-[#104B40] truncate">
            {methodLabel} • {isSummerActive ? '☀️ صيفي' : '🕒 شتوي'}
          </span>
        )}

        <button
          type="button"
          onClick={onOpenCitySelector}
          className="flex items-center gap-1 text-[9px] font-bold text-[#172A28] hover:text-[#104B40] transition-colors cursor-pointer shrink-0"
          title="اضغط لتحديد الموقع الجغرافي أو تغيير المدينة"
        >
          <span>
            {city.name} - {city.country}
            {!isLocationConfirmed && (
              <span className="text-[7.5px] text-[#9A7732] font-bold mr-1">
                (افتراضي • حدّد موقعك)
              </span>
            )}
          </span>
          <MapPin className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
        </button>
      </div>

      {/* Main Prayer Times Display */}
      <div className="flex items-stretch gap-1">
        {/* 7 Prayer Columns (including Duha) — Tap any widget to open Advanced Settings for that prayer */}
        <div
          className="flex-1 min-w-0 grid grid-cols-7 gap-0.5 sm:gap-1 items-stretch justify-items-center py-0"
        >
          {prayers.map((prayer) => {
            const isIqamaActiveForThis = activeIqama?.prayerKey === prayer.key;
            const isNextPrayer = !activeIqama && prayer.key === countdown.prayerKey;
            const isHighlight = isIqamaActiveForThis || isNextPrayer;
            const localizedName = getLocalizedPrayerName(prayer.key, prayer.name);

            return (
              <div
                key={prayer.key}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenPrayerSettings) {
                    onOpenPrayerSettings(prayer.key);
                  } else {
                    onOpenPrayerModal();
                  }
                }}
                title={`إعدادات ${localizedName} المتقدمة`}
                className={`relative w-full min-h-[34px] sm:min-h-[38px] flex flex-col items-center justify-center gap-0 py-0.5 px-0.5 rounded-xl moazen-widget-sub overflow-hidden transition-all active:scale-95 cursor-pointer ${
                  isIqamaActiveForThis
                    ? 'border-2 border-amber-600 shadow-xs ring-1 ring-amber-400/50'
                    : isHighlight
                    ? 'border-2 border-[#C5A059] shadow-xs ring-1 ring-[#D6C18D]/60'
                    : 'border border-[#D6C18D] hover:border-[#C5A059]'
                }`}
              >
                <div className="relative z-10">
                  {getPrayerIcon(prayer.key, isHighlight)}
                </div>
                <span
                  className={`relative z-10 text-[8px] sm:text-[9px] leading-tight text-center whitespace-nowrap ${
                    isHighlight ? 'font-black text-[#104B40]' : 'font-extrabold text-[#172A28]'
                  }`}
                >
                  {localizedName}
                </span>
                <span
                  className={`relative z-10 text-[8px] sm:text-[9px] leading-none font-sans tabular-nums mt-0.5 whitespace-nowrap ${
                    isHighlight ? 'font-black text-[#104B40]' : 'font-extrabold text-[#172A28]'
                  }`}
                >
                  {prayer.time}
                </span>
                {isIqamaActiveForThis && (
                  <span className="relative z-10 text-[6px] text-amber-800 font-black leading-none">
                    {t.iqamaLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Prominent Countdown Box — Compact to match prayer columns */}
        <div
          onClick={onOpenPrayerModal}
          className={`relative w-19 sm:w-21 rounded-xl moazen-widget-sub text-[#172A28] py-0.5 px-1 flex flex-col justify-between items-center shadow-xs cursor-pointer overflow-hidden group shrink-0 ${
            activeIqama
              ? 'border-2 border-amber-600'
              : 'border-2 border-[#C5A059]'
          }`}
        >
          {/* Top icon and label */}
          <div className="relative z-10 flex flex-col items-center">
            <h3 className="text-[8.5px] font-black text-[#104B40] tracking-wide leading-tight text-center">
              {activeIqama
                ? `${t.iqamaLabel} ${getLocalizedPrayerName(activeIqama.prayerKey, activeIqama.prayerName)}`
                : getLocalizedPrayerName(countdown.prayerKey, countdown.prayerName)}
            </h3>
            <span className="text-[6.5px] text-[#8a6214] font-bold leading-none">
              {activeIqama ? t.remainingLabel : t.remainingForPrayer}
            </span>
          </div>

          {/* Large Live Countdown Digits (HH:MM:SS) */}
          <div className="relative z-10 my-0 text-center" dir="ltr">
            <span className="text-[10px] sm:text-[10.5px] font-black tracking-tight font-mono text-[#172A28] tabular-nums leading-none">
              {activeIqama
                ? activeIqama.countdownStr
                : `${countdown.countdownStr}:${countdown.secondsStr}`}
            </span>
          </div>

          {/* Audio Speaker toggle button */}
          <button
            onClick={handleToggleSound}
            className={`relative z-10 p-0.5 rounded-full transition-all cursor-pointer ${
              isPlayingSound
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-[#104B40] hover:bg-[#0B3D35] text-white'
            }`}
            title={isPlayingSound ? 'إيقاف الصوت' : activeIqama ? 'تشغيل صوت الإقامة' : 'تشغيل الأذان'}
          >
            {isPlayingSound ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
          </button>
        </div>
      </div>
    </div>
  );
});

