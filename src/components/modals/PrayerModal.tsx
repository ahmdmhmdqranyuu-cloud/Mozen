import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  CheckCircle,
  VolumeX,
  Moon,
  Sun,
  Clock,
  ChevronRight,
  BellRing,
  Play,
  Square
} from 'lucide-react';
import { CityLocation, PrayerKey, UserProfile } from '../../types';
import {
  calculatePrayerTimes,
  getNextPrayerInfo,
  getActiveIqamaCountdown,
  DEFAULT_IQAMA_MINUTES,
  formatIqamaTime,
  ActiveIqamaCountdown,
  CALCULATION_METHODS,
  ASR_METHODS,
} from '../../utils/prayerTimes';
import { hasUserConfirmedLocation } from '../../data/worldCitiesData';
import { soundService, AZAN_VOICES, IQAMA_VOICES } from '../../utils/audioPlayer';

interface PrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: CityLocation;
  user: UserProfile;
  onTogglePrayerToday: (prayer: PrayerKey) => void;
  onUpdateIqamaVoice?: (voice: string) => void;
  onOpenLocationSettings?: () => void;
}

const QADA_STORAGE_KEY = 'moazen_qada_counts_v1';

export const PrayerModal: React.FC<PrayerModalProps> = ({
  isOpen,
  onClose,
  city,
  user,
  onTogglePrayerToday,
  onUpdateIqamaVoice,
  onOpenLocationSettings,
}) => {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [playingIqamaVoice, setPlayingIqamaVoice] = useState<string | null>(null);
  const [activeIqama, setActiveIqama] = useState<ActiveIqamaCountdown | null>(null);
  const [qadaCounts, setQadaCounts] = useState<Record<PrayerKey, number>>(() => {
    try {
      const saved = localStorage.getItem(QADA_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fajr: 0,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    };
  });

  const iqamaIntervals = user.iqamaIntervals || DEFAULT_IQAMA_MINUTES;

  useEffect(() => {
    if (!isOpen) return;
    const updateCountdown = () => {
      const now = new Date();
      const calculated = calculatePrayerTimes(
        city,
        now,
        user.calculationMethod || 'egypt',
        user.asrJuristicMethod || 'standard',
        user.manualPrayerAdjustments || {},
        user.dstMode
      );
      const countdown = getActiveIqamaCountdown(calculated, iqamaIntervals, now);
      setActiveIqama(countdown);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isOpen, city, iqamaIntervals, user.calculationMethod, user.asrJuristicMethod, user.manualPrayerAdjustments, user.dstMode]);

  if (!isOpen) return null;

  const prayers = calculatePrayerTimes(
    city,
    new Date(),
    user.calculationMethod || 'egypt',
    user.asrJuristicMethod || 'standard',
    user.manualPrayerAdjustments || {},
    user.dstMode
  );
  const nextInfo = getNextPrayerInfo(prayers);
  const activeMethodObj =
    CALCULATION_METHODS.find((m) => m.id === (user.calculationMethod || 'egypt')) ||
    CALCULATION_METHODS[0];
  const activeAsrObj =
    ASR_METHODS.find((a) => a.id === (user.asrJuristicMethod || 'standard')) ||
    ASR_METHODS[0];
  const isConfirmedLocation = hasUserConfirmedLocation();

  const handlePlayVoice = (voiceId: string) => {
    setPlayingIqamaVoice(null);
    if (playingVoice === voiceId) {
      soundService.stopAudio();
      setPlayingVoice(null);
    } else {
      setPlayingVoice(voiceId);
      soundService.playAzan(voiceId, false, () => setPlayingVoice(null));
    }
  };

  const handlePlayIqamaOption = (iqamaId: string) => {
    setPlayingVoice(null);
    if (playingIqamaVoice === iqamaId) {
      soundService.stopAudio();
      setPlayingIqamaVoice(null);
    } else {
      setPlayingIqamaVoice(iqamaId);
      soundService.playIqama(iqamaId, () => setPlayingIqamaVoice(null));
    }
  };

  const handleUpdateQada = (key: PrayerKey, delta: number) => {
    setQadaCounts((prev) => {
      const updated = {
        ...prev,
        [key]: Math.max(0, (prev[key] || 0) + delta),
      };
      try {
        localStorage.setItem(QADA_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const midnightTimeStr = '11:45 م';
  const lastThirdStr = '02:30 ص';

  return (
    <div className="fixed inset-0 z-50 bg-[#fcfbf7] flex flex-col overflow-hidden select-none animate-fadeIn">
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#fcfbf7] relative">
        {/* Clean White Header (No Green) */}
        <div className="bg-white text-[#172A28] px-4 pt-5 pb-3.5 flex items-center justify-between shadow-sm border-b border-gray-100 shrink-0" dir="rtl">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                soundService.stopAudio();
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
              aria-label="رجوع"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">مواقيت الصلاة والأذان والإقامة</h2>
              <p className="text-[11px] text-gray-500">
                {city.name} - {city.country} • {activeMethodObj.name.split('(')[0].trim()}
              </p>
            </div>
          </div>
          <Clock className="w-5 h-5 text-[#C5A059]" />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
          {/* Default Location Transparency Alert if user hasn't confirmed or detected location yet */}
          {!isConfirmedLocation && (
            <div
              onClick={onOpenLocationSettings}
              className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-right flex items-center justify-between gap-2 cursor-pointer"
              dir="rtl"
            >
              <div>
                <span className="text-xs font-black text-amber-900 block">
                  تنبيه شفافية الموقع: يتم عرض مواقيت الموقع الافتراضي ({city.name})
                </span>
                <span className="text-[11px] text-amber-800 block mt-0.5">
                  اضغط هنا لتحديد موقعك الفعلي عبر GPS أو اختيار محافظتك ومدينتك أو قريتك يدويًا دون إنترنت.
                </span>
              </div>
              <span className="text-[11px] font-black bg-amber-600 text-white px-3 py-1.5 rounded-xl shrink-0">
                تحديد الموقع
              </span>
            </div>
          )}

          {/* Top City & Countdown Summary Card with Unified Background */}
          <div className="relative bg-gradient-to-br from-[#ebf5f1] to-[#f4f8f6] rounded-2xl p-5 text-[#172A28] shadow-xs border border-emerald-950/10 text-center overflow-hidden">
            <img
              src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none"
            />
            <div className="relative z-10">
              <span className="inline-block text-xs bg-white/80 text-[#9A7732] font-bold px-3 py-1 rounded-full mb-2 border border-[#C5A059]/25">
                {city.name} - {city.country} ({city.latitude.toFixed(2)}°N, {city.longitude.toFixed(2)}°E)
              </span>
              <h3 className="text-2xl font-bold font-cairo text-[#172A28] my-1">
                صلاة {nextInfo.nextPrayer.name}
              </h3>
              <p className="text-3xl font-extrabold font-sans tracking-tight text-[#104B40]">
                بعد {nextInfo.countdownStr}
              </p>
              <span className="text-xs text-gray-600 font-bold block mt-1.5">
                موعد الأذان: {nextInfo.nextPrayer.time}
              </span>
              <span className="text-[10.5px] text-[#104B40] font-bold block mt-1">
                طريقة الحساب: {activeMethodObj.name} • {activeAsrObj.id === 'hanafi' ? 'المذهب الحنفي' : 'المذهب الشافعي (الجمهور)'}
              </span>
            </div>
          </div>

          {/* Active Live Iqama Countdown Card */}
          {activeIqama && (
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-2xl p-4 text-white shadow-xl border border-amber-300/40 text-center animate-pulse">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-200">
                <BellRing className="w-4 h-4 text-amber-200" />
                <span>حان وقت الأذان • جارٍ العد التنازلي لإقامة صلاة {activeIqama.prayerName}</span>
              </div>
              <div className="my-2 text-3xl font-black font-sans tracking-tight">
                {activeIqama.countdownStr}
              </div>
              <p className="text-[11px] text-amber-100">
                أذان: {activeIqama.azanTimeStr} • موعد الإقامة: {activeIqama.iqamaTimeStr}
              </p>
              <button
                onClick={() => handlePlayIqamaOption(user.iqamaVoice || 'iqama_1')}
                className="mt-2.5 inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                {playingIqamaVoice ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{playingIqamaVoice ? 'إيقاف صوت الإقامة' : 'تشغيل صوت الإقامة الآن'}</span>
              </button>
            </div>
          )}

          {/* Daily Schedule List */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h4 className="text-xs font-bold text-gray-700">جدول صلوات اليوم ومواعيد الإقامة</h4>
                <p className="text-[10px] text-gray-400">
                  إقامة الفجر والظهر والعصر والعشاء بعد 15 دقيقة • المغرب بعد 7 دقائق
                </p>
              </div>
              <span className="text-[10px] text-[#9A7732] font-bold">
                حدّد الصلوات المكتملة
              </span>
            </div>

            {prayers.map((prayer) => {
              const isChecked = user.prayersToday?.[prayer.key] || false;
              const isUpcoming = prayer.key === nextInfo.nextPrayer.key;
              const isIqamaActive = activeIqama?.prayerKey === prayer.key;
              const intervalMins = prayer.key === 'maghrib' ? 7 : prayer.key === 'sunrise' ? 0 : 15;
              const iqamaStr =
                intervalMins > 0 ? formatIqamaTime(prayer.timestamp, intervalMins) : null;

              return (
                <div
                  key={prayer.key}
                  className={`relative overflow-hidden flex items-center justify-between p-3 rounded-xl border transition-all bg-gradient-to-br from-[#ebf5f1] to-[#f4f8f6] ${
                    isIqamaActive
                      ? 'border-2 border-amber-400 ring-1 ring-amber-300'
                      : isUpcoming
                      ? 'border-2 border-[#C5A059] shadow-xs'
                      : 'border-emerald-950/10'
                  }`}
                >
                  <img
                    src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none"
                  />
                  <div className="relative z-10 flex items-center gap-3">
                    <button
                      onClick={() => onTogglePrayerToday(prayer.key)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#C5A059] text-white'
                          : 'border border-gray-300 bg-white hover:border-[#C5A059]'
                      }`}
                    >
                      {isChecked && <CheckCircle className="w-4 h-4 fill-current text-white" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-800 block">
                          صلاة {prayer.name}
                        </span>
                        {isIqamaActive && (
                          <span className="text-[9px] font-black bg-amber-600 text-white px-1.5 py-0.2 rounded-md animate-pulse">
                            عد تنازلي للإقامة
                          </span>
                        )}
                        {isUpcoming && !isIqamaActive && (
                          <span className="text-[10px] text-emerald-700 font-bold">
                            الصلاة القادمة
                          </span>
                        )}
                      </div>
                      {iqamaStr && (
                        <span className="text-[10px] text-gray-500 block mt-0.5 font-medium">
                          الإقامة: <strong className="text-emerald-800 font-sans">{iqamaStr}</strong> (بعد {intervalMins} دقيقة)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-sm font-extrabold font-sans text-gray-900 block">
                      {prayer.time}
                    </span>
                    <span className="text-[9px] text-gray-400 block font-medium">الأذان</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Iqama Audio & Files Integration Section */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-gray-800">
                  اختيار ومعاينة صوت الإقامة المفضل:
                </h4>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                مفعّل تلقائياً
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {IQAMA_VOICES.map((iq) => {
                const isSelected = (user.iqamaVoice || 'iqama_1') === iq.id;
                const isPlaying = playingIqamaVoice === iq.id;
                return (
                  <div
                    key={iq.id}
                    onClick={() => onUpdateIqamaVoice && onUpdateIqamaVoice(iq.id)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 font-bold text-amber-950'
                        : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-amber-50/40'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">{iq.name}</span>
                      <span className="text-[10px] text-gray-500 block">{iq.muezzin}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayIqamaOption(iq.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span className="text-[10px]">إيقاف</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="text-[10px]">معاينة</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Qiyam & Tahajjud Timings */}
          <div className="bg-[#faeee1]/70 rounded-2xl p-3 border border-amber-900/10 flex items-center justify-around text-center text-xs">
            <div>
              <Moon className="w-4 h-4 mx-auto text-amber-800 mb-1" />
              <span className="text-gray-600 font-medium block">منتصف الليل الشرعي</span>
              <strong className="text-amber-950 font-sans text-sm">{midnightTimeStr}</strong>
            </div>
            <div className="h-8 w-px bg-amber-900/20" />
            <div>
              <Sun className="w-4 h-4 mx-auto text-amber-800 mb-1" />
              <span className="text-gray-600 font-medium block">الثلث الأخير (قيام الليل)</span>
              <strong className="text-amber-950 font-sans text-sm">{lastThirdStr}</strong>
            </div>
          </div>

          {/* Adhan Voices Preview */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <h4 className="text-xs font-bold text-gray-800 mb-2">
              الاستماع إلى الأذان بأصوات مختلفة:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {AZAN_VOICES.map((v) => {
                const isPlaying = playingVoice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => handlePlayVoice(v.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="text-right flex-1 min-w-0 mr-2">
                      <span className="truncate block font-bold">{v.name}</span>
                      <span
                        className={`text-[10px] block truncate ${
                          isPlaying ? 'text-emerald-100' : 'text-gray-400'
                        }`}
                      >
                        {v.muezzin}
                      </span>
                    </div>
                    {isPlaying ? (
                      <VolumeX className="w-4 h-4 text-white shrink-0" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-800 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Qada' Tracker */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <h4 className="text-xs font-bold text-gray-800 mb-2">
              سجل قضاء الصلوات الفائتة (محفوظ محليًا):
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerKey[]).map((key) => {
                const name = prayers.find((p) => p.key === key)?.name || key;
                const count = qadaCounts[key] || 0;
                return (
                  <div key={key} className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <span className="font-bold text-gray-700 block mb-1">{name}</span>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleUpdateQada(key, -1)}
                        className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-bold font-sans text-sm text-emerald-800">{count}</span>
                      <button
                        onClick={() => handleUpdateQada(key, 1)}
                        className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
