import React, { useEffect, useState } from 'react';
import { MapPin, Volume2, VolumeX, Clock } from 'lucide-react';
import { CityLocation, DstMode, PrayerKey, PrayerTime } from '../types';
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
  azanVoice?: string;
  iqamaVoice?: string;
  calculationMethod?: string;
  asrJuristicMethod?: 'standard' | 'hanafi';
  manualAdjustments?: Partial<Record<PrayerKey, number>>;
  iqamaIntervals?: Record<PrayerKey, number>;
  onOpenPrayerModal: () => void;
  onOpenCitySelector: () => void;
}

const SHORT_METHOD_NAMES: Record<string, string> = {
  egypt: 'الهيئة المصرية للمساحة',
  makkah: 'أم القرى',
  mwl: 'رابطة العالم الإسلامي',
  karachi: 'كراتشي',
  isna: 'ISNA',
  kuwait: 'الكويت',
  diyanet: 'تركيا',
};

export const PrayerCard: React.FC<PrayerCardProps> = ({
  city,
  language,
  dstMode,
  azanVoice = 'makkah',
  iqamaVoice = 'iqama_1',
  calculationMethod = 'egypt',
  asrJuristicMethod = 'standard',
  manualAdjustments = {},
  iqamaIntervals = DEFAULT_IQAMA_MINUTES,
  onOpenPrayerModal,
  onOpenCitySelector,
}) => {
  const t = getTranslation(language);
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [countdown, setCountdown] = useState<{
    prayerKey: PrayerKey;
    prayerName: string;
    countdownStr: string;
    secondsStr: string;
  }>({ prayerKey: 'maghrib', prayerName: t.maghrib, countdownStr: '02:18', secondsStr: '00' });
  const [activeIqama, setActiveIqama] = useState<ActiveIqamaCountdown | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState<boolean>(() =>
    hasUserConfirmedLocation()
  );

  const getLocalizedPrayerName = (key: PrayerKey, fallback: string): string => {
    switch (key) {
      case 'fajr':
        return t.fajr;
      case 'sunrise':
        return t.sunrise;
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
  };

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const calculated = calculatePrayerTimes(
        city,
        now,
        calculationMethod,
        asrJuristicMethod,
        manualAdjustments,
        dstMode
      );
      setPrayers(calculated);

      // Check for active Iqama countdown first
      const iqamaCountdown = getActiveIqamaCountdown(calculated, iqamaIntervals, now);
      setActiveIqama(iqamaCountdown);

      const info = getNextPrayerInfo(calculated);
      setCountdown({
        prayerKey: info.nextPrayer.key,
        prayerName: info.nextPrayer.name,
        countdownStr: info.countdownStr,
        secondsStr: info.secondsStr,
      });
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    const handleDstUpdate = () => updateTimes();
    const handleLocUpdate = () => {
      setIsLocationConfirmed(hasUserConfirmedLocation());
      updateTimes();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updateTimes();
    };
    window.addEventListener('dstModeChanged', handleDstUpdate);
    window.addEventListener('locationUpdated', handleLocUpdate);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener('dstModeChanged', handleDstUpdate);
      window.removeEventListener('locationUpdated', handleLocUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [city, calculationMethod, asrJuristicMethod, manualAdjustments, iqamaIntervals, dstMode]);

  const handleToggleSound = (e: React.MouseEvent) => {
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

  const dstStatus = detectDaylightSavingStatus(new Date(), city.timezone);
  const isSummerActive =
    (dstMode || dstStatus.activeMode) === 'summer' ||
    ((dstMode || dstStatus.activeMode) === 'auto' && dstStatus.isSystemSummerTime);
  const methodLabel = SHORT_METHOD_NAMES[calculationMethod] || SHORT_METHOD_NAMES.egypt;

  return (
    <div className="relative mx-2.5 sm:mx-3.5 -mt-2.5 bg-white rounded-2xl px-2 py-1.5 sm:px-2.5 sm:py-2 shadow-lg border border-gray-100/80 transition-all select-none shrink-0">
      {/* Top row: City Location, Calculation Method & DST badge */}
      <div className="flex items-center justify-between mb-1 px-1 gap-1">
        {activeIqama ? (
          <div className="flex items-center gap-1 text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full animate-pulse">
            <Clock className="w-2.5 h-2.5 text-amber-600" />
            <span>
              {t.iqamaLabel} {getLocalizedPrayerName(activeIqama.prayerKey, activeIqama.prayerName)}: {activeIqama.countdownStr}
            </span>
          </div>
        ) : (
          <span className="text-[9px] font-bold text-[#104B40]/85 truncate">
            {methodLabel} • {isSummerActive ? '☀️ صيفي' : '🕒 شتوي'}
          </span>
        )}

        <button
          onClick={onOpenCitySelector}
          className="flex items-center gap-1 text-[9.5px] font-bold text-[#172A28] hover:text-[#104B40] transition-colors cursor-pointer shrink-0"
          title="اضغط لتحديد الموقع الجغرافي أو تغيير المدينة"
        >
          <span>
            {city.name} - {city.country}
            {!isLocationConfirmed && (
              <span className="text-[8px] text-amber-700 font-bold mr-1">
                (افتراضي • حدّد موقعك)
              </span>
            )}
          </span>
          <MapPin className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
        </button>
      </div>

      {/* Main Prayer Times Display */}
      <div className="flex items-stretch gap-1">
        {/* 6 Prayer Columns — Compact height with crystal clear prayer names */}
        <div
          onClick={onOpenPrayerModal}
          className="flex-1 min-w-0 grid grid-cols-6 gap-1 items-stretch justify-items-center py-0 cursor-pointer"
        >
          {prayers.map((prayer) => {
            const isIqamaActiveForThis = activeIqama?.prayerKey === prayer.key;
            const isNextPrayer = !activeIqama && prayer.key === countdown.prayerKey;
            const isHighlight = isIqamaActiveForThis || isNextPrayer;
            const localizedName = getLocalizedPrayerName(prayer.key, prayer.name);

            return (
              <div
                key={prayer.key}
                className={`relative w-full min-h-[44px] sm:min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl bg-gradient-to-br from-[#ebf5f1] to-[#f4f8f6] overflow-hidden transition-all active:scale-95 ${
                  isIqamaActiveForThis
                    ? 'border-2 border-amber-500 shadow-xs ring-1 ring-amber-400/50'
                    : isHighlight
                    ? 'border-2 border-[#C5A059] shadow-xs ring-1 ring-[#C5A059]/40'
                    : 'border border-emerald-950/10 hover:border-emerald-950/20'
                }`}
              >
                {/* Unified subtle mosque background watermark matching Quran, Hadith, and Dua widgets */}
                <img
                  src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none"
                />

                <div className="relative z-10">
                  {getPrayerIcon(prayer.key, isHighlight)}
                </div>
                <span
                  className={`relative z-10 text-[9.5px] sm:text-[10px] leading-none truncate max-w-full ${
                    isHighlight ? 'font-black text-[#104B40]' : 'font-extrabold text-[#172A28]'
                  }`}
                >
                  {localizedName}
                </span>
                <span
                  className={`relative z-10 text-[9.5px] sm:text-[10px] leading-none font-sans tabular-nums mt-0.5 ${
                    isHighlight ? 'font-black text-[#104B40]' : 'font-extrabold text-[#172A28]'
                  }`}
                >
                  {prayer.time}
                </span>
                {isIqamaActiveForThis && (
                  <span className="relative z-10 text-[6.5px] text-amber-800 font-black leading-none">
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
          className={`relative w-20 sm:w-22 rounded-xl bg-gradient-to-br from-[#ebf5f1] to-[#f4f8f6] text-[#172A28] py-1 px-1 flex flex-col justify-between items-center shadow-xs cursor-pointer overflow-hidden group shrink-0 ${
            activeIqama
              ? 'border-2 border-amber-500'
              : 'border-2 border-[#C5A059]/70'
          }`}
        >
          {/* Unified subtle mosque background watermark matching Quran, Hadith, and Dua widgets */}
          <img
            src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-[0.10] pointer-events-none"
          />

          {/* Top icon and label */}
          <div className="relative z-10 flex flex-col items-center">
            <h3 className="text-[9px] font-black text-[#104B40] tracking-wide leading-tight text-center">
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
            <span className="text-[10.5px] sm:text-[11px] font-black tracking-tight font-mono text-[#172A28] tabular-nums leading-none">
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
};
