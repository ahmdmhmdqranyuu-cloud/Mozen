import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Clock,
  HelpCircle,
  Play,
  Square,
  Volume2,
  BellRing,
  MoonStar,
  Check,
  X,
} from 'lucide-react';
import { PrayerAlertMode, PrayerKey, PrayerSettingConfig, UserProfile } from '../../types';
import {
  ALL_PRAYER_KEYS,
  PRAYER_ARABIC_NAMES,
  getPrayerConfig,
  isObligatoryPrayer,
} from '../../utils/prayerSettings';
import { calculatePrayerTimes } from '../../utils/prayerTimes';
import { soundService } from '../../utils/audioPlayer';

interface PrayerSettingsModalProps {
  isOpen: boolean;
  initialPrayerKey: PrayerKey;
  user: UserProfile;
  onClose: () => void;
  onSaveConfig: (config: PrayerSettingConfig) => void;
  onApplyToAllPrayers: (config: PrayerSettingConfig) => void;
}

const AZAN_VOICE_OPTIONS = [
  { id: 'makkah', label: 'أذان المسجد الحرام (مكة المكرمة)' },
  { id: 'madinah', label: 'أذان المسجد النبوي (المدينة)' },
  { id: 'alaqsa', label: 'أذان المسجد الأقصى' },
  { id: 'cairo', label: 'أذان القاهرة' },
  { id: 'alafasy', label: 'الشيخ مشاري راشد العفاسي' },
  { id: 'abdulbasit', label: 'الشيخ عبد الباسط عبد الصمد' },
  { id: 'hussary', label: 'الشيخ محمود خليل الحصري' },
  { id: 'mohamed_rifaat', label: 'الشيخ محمد رفعت' },
  { id: 'mustafa_ismail', label: 'الشيخ مصطفى إسماعيل' },
  { id: 'nasser_alqatami', label: 'الشيخ ناصر القطامي' },
  { id: 'abdulbasit_fajr', label: 'أذان الفجر — عبد الباسط' },
  { id: 'toubar_fajr', label: 'أذان الفجر — نصر الدين طوبار' },
  { id: 'duha_surah', label: 'سورة الضحى المباركة (لصلاة الضحى)' },
  { id: 'salawat_1', label: 'تنبيه الصلاة على النبي ﷺ' },
];

const PRE_ALERT_VOICE_OPTIONS = [
  { id: 'pre_prayer_15m', label: 'تنبيه قبل الصلاة المخصص' },
  { id: 'salawat_1', label: 'الصلاة على النبي ﷺ (١)' },
  { id: 'salawat_2', label: 'الصلاة على النبي ﷺ (٢)' },
  { id: 'salawat_3', label: 'الصلاة على النبي ﷺ (٣)' },
  { id: 'asmaa_allah_al_husna', label: 'أسماء الله الحسنى' },
];

const ALERT_MODE_OPTIONS: { id: PrayerAlertMode; label: string }[] = [
  { id: 'full_azan', label: 'الأذان الكامل' },
  { id: 'short_tone', label: 'تنبيه صوتي مختصر' },
  { id: 'vibrate_only', label: 'اهتزاز وإشعار فقط' },
  { id: 'silent', label: 'إشعار صامت بدون صوت' },
];

const IQAMA_VOICE_OPTIONS = [
  { id: 'iqama_1', label: 'صوت الإقامة (١) — مشاري العفاسي' },
  { id: 'iqama_2', label: 'صوت الإقامة (٢) — الحصري' },
  { id: 'iqama_3', label: 'صوت الإقامة (٣) — ياسر الدوسري' },
  { id: 'default_iqama', label: 'صوت الإقامة التقليدي' },
  { id: 'none', label: 'بدون إقامة' },
];

export const PrayerSettingsModal: React.FC<PrayerSettingsModalProps> = ({
  isOpen,
  initialPrayerKey,
  user,
  onClose,
  onSaveConfig,
  onApplyToAllPrayers,
}) => {
  const [selectedKey, setSelectedKey] = useState<PrayerKey>(initialPrayerKey || 'fajr');
  const [draft, setDraft] = useState<PrayerSettingConfig>(() =>
    getPrayerConfig(user, initialPrayerKey || 'fajr')
  );
  const [previewPlayingTag, setPreviewPlayingTag] = useState<string | null>(null);
  const [helpDialog, setHelpDialog] = useState<{ title: string; body: string } | null>(null);
  const [showApplyAllConfirm, setShowApplyAllConfirm] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const target = ALL_PRAYER_KEYS.includes(initialPrayerKey) ? initialPrayerKey : 'fajr';
      setSelectedKey(target);
      setDraft(getPrayerConfig(user, target));
      setShowApplyAllConfirm(false);
    }
    return () => {
      soundService.stopAudio();
      setPreviewPlayingTag(null);
    };
  }, [isOpen, initialPrayerKey]);

  const switchPrayerTab = (key: PrayerKey) => {
    soundService.stopAudio();
    setPreviewPlayingTag(null);
    setSelectedKey(key);
    setDraft(getPrayerConfig(user, key));
  };

  // Compute astronomical (0-offset) and adjusted time for this prayer
  const { astroTimeStr, adjustedTimeStr } = useMemo(() => {
    const now = new Date();
    const zeroMap = { ...(user.manualPrayerAdjustments || {}), [selectedKey]: 0 };
    const astroList = calculatePrayerTimes(
      user.city,
      now,
      user.calculationMethod,
      user.asrJuristicMethod || 'standard',
      zeroMap,
      user.dstMode
    );
    const adjMap = { ...(user.manualPrayerAdjustments || {}), [selectedKey]: draft.offsetMinutes };
    const adjList = calculatePrayerTimes(
      user.city,
      now,
      user.calculationMethod,
      user.asrJuristicMethod || 'standard',
      adjMap,
      user.dstMode
    );
    const aTime = astroList.find((p) => p.key === selectedKey)?.time || '--:--';
    const bTime = adjList.find((p) => p.key === selectedKey)?.time || '--:--';
    return { astroTimeStr: aTime, adjustedTimeStr: bTime };
  }, [user, selectedKey, draft.offsetMinutes]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const playSoundPreview = (
    tag: string,
    kind: 'azan' | 'pre' | 'iqama' | 'dua_after',
    trackId: string
  ) => {
    if (previewPlayingTag === tag) {
      soundService.stopAudio();
      setPreviewPlayingTag(null);
      return;
    }
    if (trackId === 'none') {
      showToast('تم إيقاف صوت الإقامة لهذه الصلاة');
      return;
    }
    setPreviewPlayingTag(tag);
    const onDone = () => setPreviewPlayingTag(null);
    if (kind === 'azan') {
      if (trackId === 'duha_surah') {
        soundService.playDuha(onDone, onDone, draft.volumePercent);
        return;
      }
      const durationMs = draft.alertMode === 'short_tone' ? 12000 : undefined;
      soundService.playAzan(
        trackId,
        selectedKey === 'fajr',
        onDone,
        onDone,
        draft.volumePercent,
        durationMs
      );
    } else if (kind === 'pre') {
      soundService.playPrePrayerAlert(onDone, onDone, trackId, draft.volumePercent);
    } else if (kind === 'dua_after') {
      soundService.playDuaAfterAzan(onDone, onDone, draft.volumePercent);
    } else {
      soundService.playIqama(trackId, onDone, onDone, draft.volumePercent);
    }
  };

  const obligatory = isObligatoryPrayer(selectedKey);
  const offsetSign = draft.offsetMinutes > 0 ? `+${draft.offsetMinutes}` : `${draft.offsetMinutes}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-hidden select-none animate-fadeIn"
      dir="rtl"
    >
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col bg-[#FAF9F5] relative">
        {/* Compact Top Header (White/Ivory theme, no green backgrounds) */}
        <div className="bg-white text-[#172A28] px-4 pt-2.5 pb-2 border-b border-gray-200 shadow-2xs shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundService.stopAudio();
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
                aria-label="رجوع"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <h2 className="text-sm sm:text-base font-bold font-cairo text-[#172A28]">
                الإعدادات المتقدمة • {PRAYER_ARABIC_NAMES[selectedKey]}
              </h2>
            </div>
            <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
          </div>

          {/* 7 Prayer Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 pb-0.5">
            {ALL_PRAYER_KEYS.map((key) => {
              const isSelected = key === selectedKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchPrayerTab(key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-xs'
                      : 'bg-[#F7F6F2] text-[#172A28] border-gray-200 hover:bg-amber-50'
                  }`}
                >
                  {PRAYER_ARABIC_NAMES[key]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Toast */}
        {toastMsg && (
          <div className="bg-[#172A28] text-amber-200 text-xs font-bold py-2 px-4 text-center shadow-sm shrink-0">
            {toastMsg}
          </div>
        )}

        {/* Scrollable Controls Body */}
        <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-3.5">
          {/* Summary Card: Astro vs Adjusted Time */}
          <div className="moazen-widget text-[#172A28] rounded-2xl p-3.5 border border-[#C5A059]/35 shadow-xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-gray-500 block">الوقت الفلكي المحسوب</span>
              <strong className="text-lg font-extrabold font-sans text-[#172A28]">{astroTimeStr}</strong>
            </div>

            <div className="moazen-widget px-3 py-1 rounded-xl border border-[#C5A059]/40 text-center">
              <span className="text-[10px] text-gray-500 block">التصحيح</span>
              <strong className="text-xs font-black text-[#9E7B34] font-sans">
                {offsetSign} د
              </strong>
            </div>

            <div className="text-left">
              <span className="text-[11px] text-gray-500 block">الوقت بعد التعديل</span>
              <strong className="text-lg font-extrabold font-sans text-[#9E7B34]">
                {adjustedTimeStr}
              </strong>
            </div>
          </div>

          {/* 1. Manual Minute Adjustment (-60..+60) */}
          <div className="moazen-widget rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#172A28]">
                  تصحيح وقت {PRAYER_ARABIC_NAMES[selectedKey]} يدويًا بالدقائق
                </h4>
                <p className="text-[11px] text-gray-500">
                  تقديم (+) أو تأخير (-) الوقت من -60 إلى +60 دقيقة
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHelpDialog({
                    title: 'تصحيح وقت الصلاة يدويًا',
                    body: 'يمكنك تقديم أو تأخير موعد هذه الصلاة بالدقائق ليتطابق تمامًا مع أذان المسجد القريب منك، ويتحدث العداد التنازلي والتنبيهات فورًا.',
                  })
                }
                className="p-1.5 rounded-full bg-[#F7F6F2] text-[#9E7B34] hover:bg-amber-50 cursor-pointer"
                title="مساعدة"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({ ...d, offsetMinutes: Math.max(-60, d.offsetMinutes - 1) }))
                }
                className="w-9 h-9 rounded-xl bg-[#F7F6F2] hover:bg-amber-50 text-[#172A28] border border-gray-200 font-black text-base cursor-pointer shrink-0"
              >
                -
              </button>

              <input
                type="range"
                min={-60}
                max={60}
                step={1}
                value={draft.offsetMinutes}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, offsetMinutes: Number(e.target.value) }))
                }
                className="flex-1 accent-[#C5A059] cursor-pointer"
              />

              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({ ...d, offsetMinutes: Math.min(60, d.offsetMinutes + 1) }))
                }
                className="w-9 h-9 rounded-xl bg-[#F7F6F2] hover:bg-amber-50 text-[#172A28] border border-gray-200 font-black text-base cursor-pointer shrink-0"
              >
                +
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#172A28]">
                القيمة المختارة: {offsetSign} دقيقة
              </span>
              {draft.offsetMinutes !== 0 && (
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, offsetMinutes: 0 }))}
                  className="text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  إعادة للصفـر
                </button>
              )}
            </div>
          </div>

          {/* 2. Enable Azan at Prayer Time + Volume Slider */}
          <div className="moazen-widget rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#172A28]">
                    تفعيل الأذان / التنبيه عند دخول الوقت
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {obligatory
                      ? 'تشغيل صوت الأذان والإشعار عند دخول وقت هذه الصلاة'
                      : 'تفعيل تنبيه صوتي لطيف عند دخول هذا الوقت'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setHelpDialog({
                      title: 'تفعيل الأذان وقت الصلاة',
                      body: 'عند إيقاف هذا الخيار لن ينطلق الأذان التلقائي لهذه الصلاة فقط، بينما تستمر باقي الصلوات حسب إعداداتها الخاصة.',
                    })
                  }
                  className="p-1.5 rounded-full bg-[#F7F6F2] text-[#9E7B34] hover:bg-amber-50 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, soundEnabled: !d.soundEnabled }))}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    draft.soundEnabled ? 'bg-[#C5A059]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      draft.soundEnabled ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Volume Control */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#172A28]">
                  مستوى صوت الأذان: <strong className="text-[#9E7B34] font-sans">{draft.volumePercent}%</strong>
                </span>
                <button
                  type="button"
                  onClick={() => playSoundPreview('azan_preview', 'azan', draft.azanVoice)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    previewPlayingTag === 'azan_preview'
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#F7F6F2] text-[#172A28] border border-gray-200 hover:bg-amber-50'
                  }`}
                >
                  {previewPlayingTag === 'azan_preview' ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>معاينة الصوت</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={draft.volumePercent}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, volumePercent: Number(e.target.value) }))
                }
                className="w-full accent-[#C5A059] cursor-pointer"
              />
            </div>

            {/* Azan Voice & Alert Mode Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-gray-700">
                    صوت المؤذن لهذه الصلاة
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setHelpDialog({
                        title: 'اختيار صوت الأذان',
                        body: 'اختر صوت المؤذن الخاص بهذه الصلاة تحديدًا دون التأثير على بقية الصلوات إلا إذا اخترت تعميم الإعدادات.',
                      })
                    }
                    className="text-[#9E7B34] cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <select
                  value={draft.azanVoice}
                  onChange={(e) => setDraft((d) => ({ ...d, azanVoice: e.target.value }))}
                  className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#172A28] focus:outline-none focus:border-[#C5A059]"
                >
                  {AZAN_VOICE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-gray-700">
                    طريقة التنبيه عند الأذان
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setHelpDialog({
                        title: 'طريقة التنبيه',
                        body: 'اختر بين تشغيل الأذان كاملًا، أو تنبيه صوتي مختصر، أو اهتزاز وإشعار فقط، أو إشعار صامت.',
                      })
                    }
                    className="text-[#9E7B34] cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <select
                  value={draft.alertMode}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, alertMode: e.target.value as PrayerAlertMode }))
                  }
                  className="moazen-widget w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#172A28] focus:outline-none focus:border-[#C5A059]"
                >
                  {ALERT_MODE_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Pre-Prayer Reminder + Minutes + Voice */}
          <div className="moazen-widget rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#C5A059] shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#172A28]">
                    التذكير الصوتي قبل الصلاة
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    تنبيه للاستعداد والوضوء قبل دخول الوقت بدقائق محددة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setHelpDialog({
                      title: 'التذكير الصوتي قبل الصلاة',
                      body: 'يُصدر صوتًا تذكيريًا لطيفًا قبل دخول وقت الصلاة بعدد الدقائق الذي تحدده للاستعداد والوضوء.',
                    })
                  }
                  className="p-1.5 rounded-full bg-[#F7F6F2] text-[#9E7B34] hover:bg-amber-50 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, preAlertEnabled: !d.preAlertEnabled }))}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    draft.preAlertEnabled ? 'bg-[#C5A059]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      draft.preAlertEnabled ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {draft.preAlertEnabled && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#172A28]">عدد الدقائق قبل الأذان:</span>
                    <strong className="text-[#9E7B34]">{draft.preAlertMinutes} دقيقة</strong>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    step={1}
                    value={draft.preAlertMinutes}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, preAlertMinutes: Number(e.target.value) }))
                    }
                    className="w-full accent-[#C5A059] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      صوت التنبيه قبل الأذان
                    </label>
                    <button
                      type="button"
                      onClick={() => playSoundPreview('pre_preview', 'pre', draft.preAlertVoice)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                        previewPlayingTag === 'pre_preview'
                          ? 'bg-rose-600 text-white'
                          : 'bg-[#F7F6F2] text-[#172A28] border border-gray-200 hover:bg-amber-50'
                      }`}
                    >
                      {previewPlayingTag === 'pre_preview' ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>إيقاف</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>معاينة</span>
                        </>
                      )}
                    </button>
                  </div>
                  <select
                    value={draft.preAlertVoice}
                    onChange={(e) => setDraft((d) => ({ ...d, preAlertVoice: e.target.value }))}
                    className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#172A28] focus:outline-none focus:border-[#C5A059]"
                  >
                    {PRE_ALERT_VOICE_OPTIONS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. Silent During Prayer + Iqama Voice + Dua After Prayer */}
          <div className="moazen-widget rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3.5">
            {/* Silent during prayer */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MoonStar className="w-4 h-4 text-[#C5A059] shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#172A28]">
                    وضع الصامت أثناء وقت الصلاة
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    تهدئة التنبيهات أثناء أداء الصلاة ثم إعادة الصوت تلقائيًا
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setHelpDialog({
                      title: 'وضع الصامت أثناء الصلاة',
                      body: 'يقوم تلقائيًا بكتم رنين الهاتف لمدة 15 دقيقة بعد دخول وقت الصلاة حفاظًا على الخشوع في المسجد ثم يعيده لوضعه السابق (يعمل بصلاحية عدم الإزعاج على أندرويد).',
                    })
                  }
                  className="p-1.5 rounded-full bg-[#F7F6F2] text-[#9E7B34] hover:bg-amber-50 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, silentDuringPrayer: !d.silentDuringPrayer }))
                  }
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    draft.silentDuringPrayer ? 'bg-[#C5A059]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      draft.silentDuringPrayer ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Iqama Voice */}
            <div className="pt-2.5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-[#172A28]">صوت الإقامة</label>
                  <button
                    type="button"
                    onClick={() =>
                      setHelpDialog({
                        title: 'صوت الإقامة',
                        body: 'تشغيل صوت إقامة الصلاة بعد الأذان بالمدة المحددة (15 دقيقة للصلوات و7 دقائق للمغرب)، أو اختيار «بدون إقامة» لإيقافها.',
                      })
                    }
                    className="text-[#9E7B34] cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => playSoundPreview('iqama_preview', 'iqama', draft.iqamaVoice)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                    previewPlayingTag === 'iqama_preview'
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#F7F6F2] text-[#172A28] border border-gray-200 hover:bg-amber-50'
                  }`}
                >
                  {previewPlayingTag === 'iqama_preview' ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>معاينة</span>
                    </>
                  )}
                </button>
              </div>
              <select
                value={draft.iqamaVoice}
                onChange={(e) => setDraft((d) => ({ ...d, iqamaVoice: e.target.value }))}
                className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#172A28] focus:outline-none focus:border-[#C5A059]"
              >
                {IQAMA_VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dua After Prayer */}
            <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#172A28]">
                  دعاء ما بعد الأذان والصلاة (الدعاء القصير)
                </h4>
                <p className="text-[11px] text-gray-500">
                  تشغيل الدعاء القصير المدمج وإشعار الذكر بعد انتهاء الأذان والصلوات
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    playSoundPreview('dua_after_preview', 'dua_after', 'dua_after_azan')
                  }
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                    previewPlayingTag === 'dua_after_preview'
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#F7F6F2] text-[#172A28] border border-gray-200 hover:bg-amber-50'
                  }`}
                >
                  {previewPlayingTag === 'dua_after_preview' ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>معاينة</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHelpDialog({
                      title: 'دعاء ما بعد الأذان والصلاة',
                      body: 'يُشغّل الدعاء القصير المدمج ويُظهر إشعارًا يذكّرك بدعاء الوسيلة بعد انتهاء الأذان.',
                    })
                  }
                  className="p-1.5 rounded-full bg-[#F7F6F2] text-[#9E7B34] hover:bg-amber-50 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      duaAfterPrayerEnabled: !d.duaAfterPrayerEnabled,
                    }))
                  }
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    draft.duaAfterPrayerEnabled ? 'bg-[#C5A059]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      draft.duaAfterPrayerEnabled ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 5. «هل صليت؟» Post-Prayer Check-in Reminder (5 min after Iqama / time) */}
          <div className="moazen-widget rounded-2xl p-4 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#104B40] shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#172A28]">
                    {user.language === 'en'
                      ? 'Prayer Follow-up Reminder ("Have you prayed?")'
                      : 'تذكير متابعة الصلاة «هل صليت؟»'}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {user.language === 'en'
                      ? 'Gentle notification 5 min after Iqama (or 5 min after prayer time if Iqama is off)'
                      : 'إشعار تذكيري لطيف بعد 5 دقائق من الإقامة (أو بعد 5 دقائق من الوقت إذا لم توجد إقامة)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setHelpDialog({
                      title: user.language === 'en' ? 'Have you prayed? Reminder' : 'تذكير «هل صليت؟»',
                      body:
                        user.language === 'en'
                          ? 'Sends one daily notification per enabled prayer 5 minutes after Iqama (or 5 minutes after the prayer time if no Iqama is set). Tapping it opens the Prayer Times page.'
                          : 'يرسل إشعارًا لطيفًا مرة واحدة يوميًا بعد 5 دقائق من وقت الإقامة (أو بعد 5 دقائق من وقت الصلاة/الضحى/الشروق إذا لم تكن هناك إقامة)، ولا يؤثر على الأذان.',
                    })
                  }
                  className="p-1.5 rounded-full bg-[#F7F6F2] text-[#9E7B34] hover:bg-amber-50 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      didYouPrayEnabled: d.didYouPrayEnabled === false,
                    }))
                  }
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    draft.didYouPrayEnabled !== false ? 'bg-[#104B40]' : 'bg-gray-300'
                  }`}
                  aria-label="تفعيل تذكير هل صليت"
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      draft.didYouPrayEnabled !== false ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Save («موافق») / Back («رجوع») Bar */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2.5 shadow-lg shrink-0">
          <button
            type="button"
            onClick={() => {
              soundService.stopAudio();
              onSaveConfig(draft);
              setShowApplyAllConfirm(true);
            }}
            className="flex-1 bg-[#172A28] hover:bg-[#233d3a] text-white font-black text-sm py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4 text-amber-300" />
            <span>موافق</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.stopAudio();
              onClose();
            }}
            className="moazen-widget px-5 py-2.5 text-[#172A28] font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            رجوع
          </button>
        </div>

        {/* Help Explanation Dialog */}
        {helpDialog && (
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="moazen-widget rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 space-y-3 text-right">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black font-cairo text-[#172A28]">
                  {helpDialog.title}
                </h4>
                <button
                  onClick={() => setHelpDialog(null)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{helpDialog.body}</p>
              <button
                onClick={() => setHelpDialog(null)}
                className="w-full py-2 bg-[#172A28] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                فهمت
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Dialog: Apply settings to ALL prayers? */}
        {showApplyAllConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="moazen-widget rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#C5A059]/40 space-y-4 text-right">
              <div className="space-y-1.5">
                <h4 className="text-sm font-black font-cairo text-[#172A28]">
                  تم حفظ إعدادات {PRAYER_ARABIC_NAMES[selectedKey]} ✓
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  هل تريد تعميم نفس إعدادات الصوت والتنبيه والصامت والإقامة على{' '}
                  <strong>جميع الصلوات</strong>؟ (سيظل تصحيح الدقائق اليدوي مستقلاً لكل صلاة).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onApplyToAllPrayers(draft);
                    setShowApplyAllConfirm(false);
                    showToast('✓ تم تعميم الإعدادات على جميع الصلوات السبع بنجاح');
                    onClose();
                  }}
                  className="flex-1 bg-[#172A28] hover:bg-[#233d3a] text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  نعم، تطبيق على الكل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyAllConfirm(false);
                    onClose();
                  }}
                  className="moazen-widget flex-1 text-[#172A28] font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  لهذه الصلاة فقط
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
