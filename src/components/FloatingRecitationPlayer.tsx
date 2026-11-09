import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  ChevronDown,
  Disc3,
  Loader2,
} from 'lucide-react';
import {
  recitationPlayerService,
  RecitationPlayerState,
} from '../utils/recitationPlayerService';

export const FloatingRecitationPlayer: React.FC = () => {
  const [playerState, setPlayerState] = useState<RecitationPlayerState>(() =>
    recitationPlayerService.getState()
  );

  useEffect(() => {
    const unsubscribe = recitationPlayerService.subscribe((newState) => {
      setPlayerState(newState);
    });
    return unsubscribe;
  }, []);

  const {
    currentSurah,
    currentReciter,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    playbackSpeed,
    isExpanded,
    errorMessage,
  } = playerState;

  if (!currentSurah) return null;

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      className="fixed bottom-20 left-3 right-3 z-[75] max-w-xl mx-auto pointer-events-none select-none"
      dir="rtl"
    >
      {/* ==================== COLLAPSED STATE: FLOATING TURNTABLE / VINYL DISC BUTTON ==================== */}
      {!isExpanded && (
        <div className="flex justify-end">
          <div className="relative pointer-events-auto group flex items-center gap-2">
            {/* Subtle Floating Pill Label beside the Vinyl Button */}
            <button
              type="button"
              onClick={() => recitationPlayerService.setExpanded(true)}
              className="bg-[#0d3b31]/95 hover:bg-[#104B40] text-white backdrop-blur-md px-3 py-1.5 rounded-full border border-[#C5A059]/60 shadow-xl flex items-center gap-2 transition-all cursor-pointer"
              title="اضغط لفتح شريط التحكم في التلاوة"
            >
              <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
              <div className="text-right">
                <span className="text-[11px] font-black font-quran text-amber-200 block leading-tight">
                  سورة {currentSurah.name}
                </span>
                <span className="text-[9px] text-emerald-200 block leading-tight max-w-[110px] truncate">
                  {currentReciter.name}
                </span>
              </div>
            </button>

            {/* Circular Vinyl Record / Turntable Button */}
            <button
              type="button"
              onClick={() => recitationPlayerService.setExpanded(true)}
              aria-label="فتح مشغل التلاوات"
              title="مشغل الأسطوانات العائم - اضغط لفتح شريط التحكم"
              className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:scale-105 focus:outline-none"
            >
              {/* Outer Golden-Emerald Turntable Platter Ring with Progress SVG */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 64 64"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="rgba(197, 160, 89, 0.25)"
                  strokeWidth="2.5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="#C5A059"
                  strokeWidth="2.5"
                  strokeDasharray={2 * Math.PI * 30}
                  strokeDashoffset={
                    2 * Math.PI * 30 * (1 - progressPercent / 100)
                  }
                  strokeLinecap="round"
                />
              </svg>

              {/* Rotating Vinyl Record Disc */}
              <div
                className={`w-14 h-14 rounded-full bg-[radial-gradient(circle,#172A28_0%,#091412_45%,#1d3531_48%,#08110f_68%,#1f3834_71%,#050b0a_100%)] border-2 border-[#C5A059]/80 shadow-inner flex items-center justify-center relative overflow-hidden ${
                  isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
                }`}
              >
                {/* Vinyl Grooves Sheen */}
                <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute inset-2.5 rounded-full border border-amber-300/15 pointer-events-none" />

                {/* Center Record Label with Reciter Avatar */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C5A059] to-[#8C6B2B] p-0.5 flex items-center justify-center shadow-md relative">
                  <img
                    src={currentReciter.photoUrl}
                    alt={currentReciter.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                  {/* Center Spindle Hole */}
                  <div className="w-1.5 h-1.5 rounded-full bg-[#091412] border border-[#C5A059] absolute" />
                </div>
              </div>

              {/* Miniature Turntable Tonearm Needle Accent */}
              <div
                className={`absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-[#C5A059] to-[#9A7732] border border-white/60 shadow-md flex items-center justify-center transition-transform ${
                  isPlaying ? 'rotate-12 scale-105' : 'rotate-0'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 text-[#091412] animate-spin" />
                ) : (
                  <Disc3 className="w-3 h-3 text-[#091412]" />
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ==================== EXPANDED STATE: FULL FLOATING CONTROL BAR ==================== */}
      {isExpanded && (
        <div className="pointer-events-auto bg-gradient-to-r from-[#092922] via-[#104B40] to-[#0c3830] text-white rounded-3xl p-3.5 shadow-2xl border border-[#C5A059]/60 backdrop-blur-xl animate-fadeIn space-y-2.5">
          {/* Top Row: Spinning Vinyl Disc + Surah & Reciter Info + Collapse & Close Buttons */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              {/* Spinning Vinyl Disc inside Control Bar (Click to Fold/Collapse) */}
              <button
                type="button"
                onClick={() => recitationPlayerService.setExpanded(false)}
                title="طي المشغل إلى زر الأسطوانة العائم"
                className="relative w-12 h-12 rounded-full shrink-0 flex items-center justify-center cursor-pointer group"
              >
                <div
                  className={`w-12 h-12 rounded-full bg-[radial-gradient(circle,#172A28_0%,#091412_45%,#1d3531_48%,#08110f_68%,#1f3834_71%,#050b0a_100%)] border-2 border-[#C5A059] flex items-center justify-center shadow-lg ${
                    isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
                  }`}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-[#C5A059] relative flex items-center justify-center">
                    <img
                      src={currentReciter.photoUrl}
                      alt={currentReciter.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#091412] absolute" />
                  </div>
                </div>
              </button>

              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black font-quran text-amber-200 truncate">
                    سورة {currentSurah.name}
                  </h4>
                  <span className="text-[10px] bg-white/10 text-amber-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                    {currentSurah.revelationType} • {currentSurah.versesCount} آية
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 truncate mt-0.5">
                  القارئ: {currentReciter.name}
                </p>
                {errorMessage && (
                  <p className="text-[10px] text-rose-300 font-bold mt-0.5">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Fold/Collapse & Stop/Close Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => recitationPlayerService.setExpanded(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-[11px] font-bold transition-colors cursor-pointer"
                title="طي المشغل"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>طي</span>
              </button>
              <button
                type="button"
                onClick={() => recitationPlayerService.stopAndClose()}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="إيقاف وإغلاق المشغل"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Middle Row: Interactive Progress Bar & Timestamps */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              step={0.5}
              value={currentTime}
              onChange={(e) =>
                recitationPlayerService.seekTo(parseFloat(e.target.value))
              }
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
              dir="ltr"
            />
            <div
              className="flex items-center justify-between text-[10px] font-mono text-emerald-200 px-0.5"
              dir="ltr"
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Bottom Row: Playback Controls (Previous, Play/Pause, Next Recitation, Speed) */}
          <div className="flex items-center justify-between pt-0.5">
            {/* Speed Control */}
            <button
              type="button"
              onClick={() => recitationPlayerService.cycleSpeed()}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-[11px] font-black font-mono transition-colors cursor-pointer"
              title="سرعة التلاوة"
            >
              {playbackSpeed}x
            </button>

            {/* Main Transport Buttons */}
            <div className="flex items-center gap-3" dir="ltr">
              {/* Previous Surah */}
              <button
                type="button"
                onClick={() => recitationPlayerService.playPreviousSurah()}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="السورة السابقة"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={() => recitationPlayerService.togglePlayPause()}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C5A059] to-[#A6823C] hover:brightness-110 text-[#091412] flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#091412]" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next Surah Button */}
              <button
                type="button"
                onClick={() => recitationPlayerService.playNextSurah()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
                title="الانتقال للتلاوة التالية"
              >
                <span>التلاوة التالية</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Surah Number Badge */}
            <span className="text-[11px] font-bold text-emerald-200 bg-white/10 px-2.5 py-1 rounded-xl">
              {currentSurah.number} / 114
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
