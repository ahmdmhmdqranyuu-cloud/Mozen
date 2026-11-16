import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Sliders,
  Mic,
  MicOff,
  Play,
  Square,
  Volume2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Vibrate,
  BookOpen,
  X,
} from 'lucide-react';
import {
  AnalysisSpeedMode,
  NoiseGateLevel,
  QuranMicRecorder,
  RecordedAudioClip,
  SheikhDashboardMetrics,
  WordEvaluationItem,
} from '../../utils/quranRecitationEngine';

interface DashboardProps {
  metrics: SheikhDashboardMetrics;
  totalRepetitions: number;
  selectedSurahNumber: number;
  onSelectSurahToPractice: (surahNumber: number) => void;
}

export const SheikhMemorizationDashboard: React.FC<DashboardProps> = ({
  metrics,
  totalRepetitions,
  selectedSurahNumber,
  onSelectSurahToPractice,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(metrics.last7Days.length - 1);

  const maxDaily = Math.max(
    1,
    ...metrics.last7Days.map((d) => Math.max(d.masteredCount, d.attemptsCount))
  );
  const maxWeekly = Math.max(
    1,
    ...metrics.last4Weeks.map((w) => Math.max(w.masteredCount, w.attemptsCount))
  );
  const activeDay = metrics.last7Days[selectedDayIdx] || metrics.last7Days[metrics.last7Days.length - 1];

  return (
    <div className="space-y-4">
      {/* KPI SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="moazen-widget rounded-2xl p-3.5 border border-[#E5E0D5] space-y-1">
          <span className="text-[11px] font-bold text-[#5C6D6A] block">الآيات المحفوظة</span>
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <strong className="text-2xl font-black text-[#104B40]">{metrics.totalMastered}</strong>
            <span className="text-[11px] font-bold text-[#5C6D6A]">آية متقنة</span>
          </div>
        </div>

        <div className="moazen-widget rounded-2xl p-3.5 border border-[#E5E0D5] space-y-1">
          <span className="text-[11px] font-bold text-[#5C6D6A] block">متوسط الإتقان</span>
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <strong className="text-2xl font-black text-[#104B40]">{metrics.overallAvgScore}%</strong>
            <span className="text-[11px] font-bold text-[#5C6D6A]">دقة التلاوة</span>
          </div>
        </div>

        <div className="moazen-widget rounded-2xl p-3.5 border border-[#E5E0D5] space-y-1">
          <span className="text-[11px] font-bold text-[#5C6D6A] block">أيام المداومة</span>
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <strong className="text-2xl font-black text-[#B38632]">{metrics.activeDaysCount}</strong>
            <span className="text-[11px] font-bold text-[#5C6D6A]">يوم نشط</span>
          </div>
        </div>

        <div className="moazen-widget rounded-2xl p-3.5 border border-[#E5E0D5] space-y-1">
          <span className="text-[11px] font-bold text-[#5C6D6A] block">جلسات التسميع</span>
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <strong className="text-2xl font-black text-[#172A28]">{totalRepetitions}</strong>
            <span className="text-[11px] font-bold text-[#5C6D6A]">محاولة</span>
          </div>
        </div>
      </div>

      {/* DAILY & WEEKLY CHARTS SIDE BY SIDE ON DESKTOP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* DAILY 7-DAY BAR CHART */}
        <div className="moazen-widget rounded-2xl p-4 border border-[#E5E0D5] space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#104B40]" />
              <h3 className="text-xs sm:text-sm font-black text-[#104B40]">
                الآيات المحفوظة يومياً (آخر 7 أيام)
              </h3>
            </div>
            {activeDay && (
              <span className="text-[11px] font-bold text-[#5C6D6A] tabular-nums">
                {activeDay.fullLabel}: {activeDay.masteredCount} آية
              </span>
            )}
          </div>

          <div className="pt-1">
            <svg
              viewBox="0 0 350 148"
              className="w-full h-40 overflow-visible"
              role="img"
              aria-label="رسم بياني لعدد الآيات المحفوظة يومياً خلال آخر سبعة أيام"
            >
              {/* Horizontal reference guidelines */}
              {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = 112 - ratio * 88;
                return (
                  <line
                    key={idx}
                    x1="10"
                    y1={y}
                    x2="340"
                    y2={y}
                    stroke="#ECE7DC"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                );
              })}
              <line x1="10" y1="112" x2="340" y2="112" stroke="#D5CEBF" strokeWidth="1.2" />

              {metrics.last7Days.map((day, idx) => {
                const slotWidth = 330 / 7;
                const centerX = 10 + idx * slotWidth + slotWidth / 2;
                const masteredH = Math.max(day.masteredCount > 0 ? 8 : 3, (day.masteredCount / maxDaily) * 86);
                const attemptsH = Math.max(day.attemptsCount > 0 ? 6 : 0, (day.attemptsCount / maxDaily) * 86);
                const isSelected = selectedDayIdx === idx;

                return (
                  <g
                    key={day.date}
                    className="cursor-pointer"
                    onClick={() => setSelectedDayIdx(idx)}
                  >
                    {/* Attempts background bar */}
                    {attemptsH > 0 && (
                      <rect
                        x={centerX - 13}
                        y={112 - attemptsH}
                        width={26}
                        height={attemptsH}
                        rx="5"
                        fill="#E8DFC8"
                      />
                    )}
                    {/* Mastered foreground bar */}
                    <rect
                      x={centerX - 9}
                      y={112 - masteredH}
                      width={18}
                      height={masteredH}
                      rx="5"
                      fill={isSelected ? '#C5A059' : '#104B40'}
                    />
                    {/* Numeric value above bar */}
                    <text
                      x={centerX}
                      y={112 - Math.max(masteredH, attemptsH) - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#172A28"
                    >
                      {day.masteredCount}
                    </text>
                    {/* Day label */}
                    <text
                      x={centerX}
                      y={130}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight={isSelected ? '800' : '600'}
                      fill={isSelected ? '#104B40' : '#647471'}
                    >
                      {day.shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="flex items-center justify-between text-[11px] text-[#5C6D6A] pt-1 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#104B40] inline-block" />
                  <span>آيات متقنة</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#E8DFC8] inline-block" />
                  <span>إجمالي المحاولات</span>
                </span>
              </div>
              {activeDay && activeDay.avgScore > 0 && (
                <span className="font-bold text-[#104B40] tabular-nums">
                  متوسط اليوم: {activeDay.avgScore}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* WEEKLY 4-WEEK TREND CHART */}
        <div className="moazen-widget rounded-2xl p-4 border border-[#E5E0D5] space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#B38632]" />
              <h3 className="text-xs sm:text-sm font-black text-[#104B40]">
                الحصيلة الأسبوعية للحفظ (آخر 4 أسابيع)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#5C6D6A] tabular-nums">
              الإجمالي: {metrics.last4Weeks.reduce((acc, w) => acc + w.masteredCount, 0)} آية
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {metrics.last4Weeks.map((week, idx) => {
              const pct = Math.round((week.masteredCount / maxWeekly) * 100);
              const isCurrent = idx === metrics.last4Weeks.length - 1;
              return (
                <div key={week.weekLabel} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isCurrent ? 'text-[#104B40]' : 'text-[#4B5B58]'}`}>
                      {week.weekLabel}
                    </span>
                    <span className="text-[11px] font-bold text-[#172A28] tabular-nums">
                      {week.masteredCount} آية متقنة · {week.attemptsCount} محاولة
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-lg bg-[#F3EFE6] overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all duration-300 ${
                        isCurrent ? 'bg-[#C5A059]' : 'bg-[#104B40]'
                      }`}
                      style={{ width: `${Math.max(week.masteredCount > 0 ? 6 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PER-SURAH MASTERY PROGRESS */}
      <div className="moazen-widget rounded-2xl p-4 border border-[#E5E0D5] space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#104B40]" />
            <h3 className="text-xs sm:text-sm font-black text-[#104B40]">
              مؤشر نسبة الإتقان في كل سورة
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#5C6D6A] tabular-nums">
            {metrics.surahProgress.length} سورة
          </span>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto pl-1">
          {metrics.surahProgress.map((surah) => {
            const isActive = surah.surahNumber === selectedSurahNumber;
            return (
              <div
                key={surah.surahNumber}
                className={`p-3 rounded-xl border transition-colors ${
                  isActive
                    ? 'bg-[#FAF6EC] border-[#C5A059]'
                    : 'bg-[#FAF8F5] border-[#EAE4D8] hover:border-[#C5A059]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-black text-[#104B40] truncate">
                      {surah.surahNumber}. سورة {surah.surahName}
                    </span>
                    <span className="text-[11px] text-[#5C6D6A] tabular-nums whitespace-nowrap">
                      {surah.masteredCount} / {surah.totalAyahs} آية
                      {surah.avgBestScore > 0 ? ` · دقة ${surah.avgBestScore}%` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-[#104B40] tabular-nums">
                      {surah.percent}%
                    </span>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSelectSurahToPractice(surah.surahNumber)}
                        className="px-2.5 py-1 rounded-lg bg-[#104B40] text-white text-[11px] font-bold hover:bg-[#0c3a31] cursor-pointer whitespace-nowrap"
                      >
                        متابعة
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full bg-white border border-[#E5E0D5] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      surah.percent >= 80
                        ? 'bg-emerald-600'
                        : surah.percent >= 40
                        ? 'bg-[#C5A059]'
                        : 'bg-[#104B40]'
                    }`}
                    style={{ width: `${surah.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface AdvancedSettingsProps {
  micSensitivity: number;
  noiseGateLevel: NoiseGateLevel;
  analysisSpeed: AnalysisSpeedMode;
  hapticFeedbackEnabled: boolean;
  quickCorrectionPopupEnabled: boolean;
  autoAdvanceOnMastery: boolean;
  autoRepeatFailedAyah: boolean;
  onChangeSensitivity: (val: number) => void;
  onChangeNoiseGate: (level: NoiseGateLevel) => void;
  onChangeAnalysisSpeed: (speed: AnalysisSpeedMode) => void;
  onToggleHaptic: () => void;
  onToggleQuickPopup: () => void;
  onToggleAutoAdvance: () => void;
  onToggleAutoRepeatFailed: () => void;
  onStopBackgroundAudio: () => void;
}

export const SheikhAdvancedSettingsPanel: React.FC<AdvancedSettingsProps> = ({
  micSensitivity,
  noiseGateLevel,
  analysisSpeed,
  hapticFeedbackEnabled,
  quickCorrectionPopupEnabled,
  autoAdvanceOnMastery,
  autoRepeatFailedAyah,
  onChangeSensitivity,
  onChangeNoiseGate,
  onChangeAnalysisSpeed,
  onToggleHaptic,
  onToggleQuickPopup,
  onToggleAutoAdvance,
  onToggleAutoRepeatFailed,
  onStopBackgroundAudio,
}) => {
  const [testingMic, setTestingMic] = useState(false);
  const [liveTestLevel, setLiveTestLevel] = useState(0);
  const [testSecondsLeft, setTestSecondsLeft] = useState(3);
  const [testError, setTestError] = useState<string | null>(null);
  const [testClipResult, setTestClipResult] = useState<RecordedAudioClip | null>(null);
  const [isPlayingTestClip, setIsPlayingTestClip] = useState(false);

  const testRecorderRef = useRef<QuranMicRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (testRecorderRef.current) {
        testRecorderRef.current.abort();
        testRecorderRef.current = null;
      }
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
        playbackAudioRef.current = null;
      }
    };
  }, []);

  const finishMicTest = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    const rec = testRecorderRef.current;
    testRecorderRef.current = null;
    setTestingMic(false);
    setLiveTestLevel(0);

    if (!rec) return;
    try {
      const clip = await rec.stopAndFinalize();
      setTestClipResult(clip);
    } catch (err: any) {
      setTestError(err?.message || 'تعذر إتمام اختبار الميكروفون.');
    }
  };

  const startMicTest = async () => {
    onStopBackgroundAudio();
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      setIsPlayingTestClip(false);
    }
    setTestError(null);
    setTestClipResult(null);
    setTestSecondsLeft(3);

    const recorder = new QuranMicRecorder();
    testRecorderRef.current = recorder;

    try {
      await recorder.start((lvl) => setLiveTestLevel(lvl), {
        sensitivity: micSensitivity,
        noiseGateLevel,
      });
      setTestingMic(true);

      let sec = 3;
      timerRef.current = setInterval(() => {
        sec -= 1;
        setTestSecondsLeft(Math.max(0, sec));
      }, 1000);

      autoStopRef.current = setTimeout(() => {
        finishMicTest();
      }, 3100);
    } catch (err: any) {
      testRecorderRef.current = null;
      setTestingMic(false);
      setTestError(
        err?.name === 'NotAllowedError'
          ? 'تم رفض إذن الميكروفون. فعّل الإذن من إعدادات المتصفح ثم أعد الاختبار.'
          : err?.message || 'تعذر تشغيل الميكروفون للاختبار.'
      );
    }
  };

  const togglePlayTestSample = () => {
    if (!testClipResult?.playbackDataUrl) return;
    if (isPlayingTestClip && playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      setIsPlayingTestClip(false);
      return;
    }
    const audio = new Audio(testClipResult.playbackDataUrl);
    playbackAudioRef.current = audio;
    audio.onended = () => setIsPlayingTestClip(false);
    audio.onerror = () => setIsPlayingTestClip(false);
    setIsPlayingTestClip(true);
    audio.play().catch(() => setIsPlayingTestClip(false));
  };

  const signalQuality = testClipResult
    ? testClipResult.peakRms >= 0.04 && testClipResult.hasSpeechEnergy
      ? { label: 'إشارة ممتازة وواضحة', color: 'text-emerald-800 bg-emerald-50 border-emerald-300', ok: true }
      : testClipResult.hasSpeechEnergy
      ? { label: 'إشارة مقبولة — يمكنك رفع الحساسية قليلاً', color: 'text-amber-900 bg-amber-50 border-amber-300', ok: true }
      : { label: 'صوت خافت جداً — ارفع حساسية الميكروفون أو اقترب منه', color: 'text-rose-900 bg-rose-50 border-rose-300', ok: false }
    : null;

  return (
    <div className="space-y-4">
      {/* MICROPHONE SENSITIVITY & TEST STUDIO */}
      <div className="moazen-widget rounded-2xl p-4 sm:p-5 border border-[#E5E0D5] space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#104B40]" />
            <h3 className="text-sm font-black text-[#104B40]">حساسية الميكروفون واختبار الإشارة</h3>
          </div>
          <span className="text-xs font-black text-[#B38632] tabular-nums">
            {micSensitivity.toFixed(1)}x
          </span>
        </div>

        {/* Sensitivity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="mic-sensitivity-slider" className="font-bold text-[#172A28]">
              مستوى تضخيم التقاط الصوت (الحساسية)
            </label>
            <span className="text-[11px] font-bold text-[#5C6D6A] tabular-nums">
              {micSensitivity < 0.9 ? 'محيط صاخب' : micSensitivity > 1.4 ? 'التقاط عالٍ للصوت الهادئ' : 'متوازن قياسي'}
            </span>
          </div>
          <input
            id="mic-sensitivity-slider"
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={micSensitivity}
            onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
            className="w-full accent-[#104B40] cursor-pointer h-2 bg-[#ECE7DC] rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-bold text-[#647471] tabular-nums">
            <span>0.5x (تقليل الضوضاء)</span>
            <span>1.0x (قياسي)</span>
            <span>2.5x (أقصى حساسية)</span>
          </div>
        </div>

        {/* Noise Gate Floor */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-[#172A28] block">عتبة عزل الصمت والضوضاء</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low' as const, label: 'حساس جداً (غرفة هادئة)' },
              { id: 'medium' as const, label: 'متوسط (مستحسن)' },
              { id: 'high' as const, label: 'عزل عالٍ (محيط نشط)' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeNoiseGate(opt.id)}
                className={`min-h-[42px] px-2.5 py-2 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${
                  noiseGateLevel === opt.id
                    ? 'bg-[#104B40] text-white border-[#104B40]'
                    : 'bg-[#FAF8F5] text-[#4B5B58] border-[#E5E0D5] hover:border-[#C5A059]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* LIVE MIC TESTER BUTTON + METER */}
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D5] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-[#104B40]">اختبار الميكروفون الفوري</p>
              <p className="text-[11px] text-[#5C6D6A]">
                اقرأ «بسم الله الرحمن الرحيم» لمدة 3 ثوانٍ لفحص وضوح الصوت قبل التسميع
              </p>
            </div>
            <button
              type="button"
              onClick={testingMic ? finishMicTest : startMicTest}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                testingMic
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-[#C5A059] hover:bg-[#b58e47] text-[#104B40]'
              }`}
            >
              {testingMic ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span className="tabular-nums">إيقاف الفحص ({testSecondsLeft}ث)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>اختبار الميكروفون الآن</span>
                </>
              )}
            </button>
          </div>

          {/* Live Signal Bars */}
          {testingMic && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#104B40]">
                <span>مؤشر التقاط الإشارة الحي</span>
                <span className="tabular-nums">{Math.round(liveTestLevel * 100)}%</span>
              </div>
              <div className="grid grid-cols-12 gap-1 h-5 items-end">
                {Array.from({ length: 12 }, (_, idx) => {
                  const threshold = (idx + 1) / 12;
                  const active = liveTestLevel >= threshold * 0.85;
                  return (
                    <div
                      key={idx}
                      className={`rounded-sm transition-all duration-75 ${
                        active
                          ? idx >= 9
                            ? 'bg-amber-500 h-5'
                            : 'bg-[#104B40] h-4'
                          : 'bg-[#E5E0D5] h-1.5'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {testError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-900 flex items-center gap-2">
              <MicOff className="w-4 h-4 shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          {signalQuality && testClipResult && (
            <div className={`p-3 rounded-xl border text-xs space-y-2 ${signalQuality.color}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-black flex items-center gap-1.5">
                  {signalQuality.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{signalQuality.label}</span>
                </span>
                <span className="text-[11px] font-bold tabular-nums">
                  الذروة: {Math.round(testClipResult.peakRms * 100)}% · الحجم:{' '}
                  {(testClipResult.byteLength / 1024).toFixed(1)} KB
                </span>
              </div>

              {testClipResult.playbackDataUrl && (
                <button
                  type="button"
                  onClick={togglePlayTestSample}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-black/15 text-[#104B40] text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isPlayingTestClip ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>إيقاف الاستماع</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>سماع صوتك المسجّل للتحقق</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ANALYSIS PROCESSING SPEED */}
      <div className="moazen-widget rounded-2xl p-4 sm:p-5 border border-[#E5E0D5] space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Zap className="w-4 h-4 text-[#B38632]" />
          <h3 className="text-sm font-black text-[#104B40]">سرعة معالجة التحليل الصوتي</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            {
              id: 'fast' as const,
              title: 'سريع (استجابة فورية)',
              desc: 'تركيز مباشر على صحة الكلمات بأقل زمن انتظار',
            },
            {
              id: 'balanced' as const,
              title: 'متوازن (مستحسن)',
              desc: 'توازن مثالي بين سرعة النتيجة ودقة التصحيح',
            },
            {
              id: 'accurate' as const,
              title: 'فائق الدقة (تجويد معمّق)',
              desc: 'فحص تفصيلي لمخارج الحروف والمدود والغنة',
            },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChangeAnalysisSpeed(mode.id)}
              className={`p-3 rounded-xl border text-right space-y-1 transition-colors cursor-pointer ${
                analysisSpeed === mode.id
                  ? 'bg-[#104B40] text-white border-[#104B40]'
                  : 'bg-[#FAF8F5] text-[#172A28] border-[#E5E0D5] hover:border-[#C5A059]'
              }`}
            >
              <span className="text-xs font-black block">{mode.title}</span>
              <span
                className={`text-[11px] block leading-relaxed ${
                  analysisSpeed === mode.id ? 'text-white/80' : 'text-[#5C6D6A]'
                }`}
              >
                {mode.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* INTERACTIVE FEEDBACK & PROGRESSION PREFERENCES */}
      <div className="moazen-widget rounded-2xl p-4 sm:p-5 border border-[#E5E0D5] space-y-2.5">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Vibrate className="w-4 h-4 text-[#104B40]" />
          <h3 className="text-sm font-black text-[#104B40]">رد الفعل التفاعلي وطريقة التقدم</h3>
        </div>

        {[
          {
            label: 'اهتزاز الهاتف فوراً عند اكتشاف خطأ في التلاوة',
            sub: 'إشعار لمسي فوري مع نغمة تنبيه عند نطق كلمة غير صحيحة',
            checked: hapticFeedbackEnabled,
            onToggle: onToggleHaptic,
          },
          {
            label: 'إظهار نافذة التصحيح السريعة وإعادة التسجيل الفوري',
            sub: 'تعرض الكلمة الصحيحة منبثقة مع زر لإعادة تسميعها مباشرة',
            checked: quickCorrectionPopupEnabled,
            onToggle: onToggleQuickPopup,
          },
          {
            label: 'الانتقال التلقائي للآية التالية عند الإتقان',
            sub: 'عند إيقافه يتم التقدم يدوياً عبر أزرار «التالية / السابقة» واختيار الآيات',
            checked: autoAdvanceOnMastery,
            onToggle: onToggleAutoAdvance,
          },
          {
            label: 'إعادة تلاوة القارئ تلقائياً عند وجود أخطاء',
            sub: 'تشغيل الآية بصوت الشيخ لتثبيت النطق الصحيح',
            checked: autoRepeatFailedAyah,
            onToggle: onToggleAutoRepeatFailed,
          },
        ].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={item.onToggle}
            className="w-full min-h-[52px] p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D5] flex items-center justify-between gap-3 text-right hover:border-[#C5A059] transition-colors cursor-pointer"
          >
            <div>
              <span className="text-xs font-bold text-[#172A28] block">{item.label}</span>
              <span className="text-[11px] text-[#5C6D6A] block">{item.sub}</span>
            </div>
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                item.checked ? 'bg-[#104B40]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  item.checked ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

interface QuickCorrectionPopupProps {
  wrongWords: WordEvaluationItem[];
  surahName: string;
  ayahNumber: number;
  score: number;
  onSpeakWord: (wordText: string) => void;
  onReRecordDirectly: () => void;
  onClose: () => void;
}

export const QuickCorrectionFeedbackModal: React.FC<QuickCorrectionPopupProps> = ({
  wrongWords,
  surahName,
  ayahNumber,
  score,
  onSpeakWord,
  onReRecordDirectly,
  onClose,
}) => {
  const [idx, setIdx] = useState(0);
  const current = wrongWords[idx] || wrongWords[0];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-70 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="نافذة التصحيح السريعة"
    >
      <div className="moazen-widget w-full max-w-md rounded-3xl p-5 border border-[#C5A059] shadow-2xl space-y-4 text-right">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h3 className="text-sm font-black">تنبيه تصحيح فوري</h3>
              <p className="text-[11px] text-[#5C6D6A]">
                سورة {surahName} · الآية {ayahNumber} · نسبة الضبط {score}%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-500 cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlighted Correct Word vs Spoken */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D5] text-center space-y-2">
          <span className="text-[11px] font-bold text-[#5C6D6A] block">الكلمة الصحيحة في المصحف</span>
          <p className="font-quran text-3xl text-[#104B40] font-bold leading-relaxed">
            {current.expectedWord}
          </p>
          {current.spokenWord && (
            <p className="text-xs text-rose-800 font-bold">
              ما سُمِع منك: «{current.spokenWord}»
            </p>
          )}
          {current.correctionNote && (
            <p className="text-xs text-[#4B5B58] leading-relaxed">{current.correctionNote}</p>
          )}
        </div>

        {wrongWords.length > 1 && (
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#5C6D6A] tabular-nums">
              موضع الخطأ {idx + 1} من {wrongWords.length}
            </span>
            <div className="flex items-center gap-1.5">
              {wrongWords.map((w, wIdx) => (
                <button
                  key={`${w.positionIndex}-${wIdx}`}
                  type="button"
                  onClick={() => setIdx(wIdx)}
                  className={`px-2.5 py-1 rounded-lg font-quran text-sm cursor-pointer border ${
                    wIdx === idx
                      ? 'bg-[#104B40] text-white border-[#104B40]'
                      : 'bg-gray-50 text-[#172A28] border-gray-200'
                  }`}
                >
                  {w.expectedWord}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onSpeakWord(current.expectedWord)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EFE9DC] border border-[#C5A059] text-[#104B40] text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>سماع النطق الصحيح</span>
          </button>

          <button
            type="button"
            onClick={onReRecordDirectly}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#104B40] hover:bg-[#0c3a31] text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة تسجيلها مباشرة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
