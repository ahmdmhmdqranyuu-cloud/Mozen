import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Volume2,
  Loader2,
  Disc3,
} from 'lucide-react';
import {
  diskAudioPlayerService,
  DiskPlayerState,
} from '../utils/diskAudioPlayerService';

export const FloatingDiskPlayer: React.FC = () => {
  const [playerState, setPlayerState] = useState<DiskPlayerState>(() =>
    diskAudioPlayerService.getState()
  );

  useEffect(() => {
    const unsub = diskAudioPlayerService.subscribe((s) => setPlayerState(s));
    return unsub;
  }, []);

  const { track, isPlaying, isLoading, currentTime, duration, isExpanded, playbackRate } =
    playerState;

  if (!track) return null;

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const isRuqyah = track.type === 'ruqyah';

  return (
    <div
      className="fixed bottom-20 left-3 right-3 sm:left-6 sm:right-auto z-[85] max-w-sm pointer-events-none select-none font-cairo"
      dir="rtl"
    >
      {/* ==================== 1. COLLAPSED STATE: COMPACT ROTATING DISK / CYLINDER ==================== */}
      {!isExpanded ? (
        <div className="flex items-center gap-2 pointer-events-auto animate-fadeIn">
          {/* Circular Vinyl Disk Button */}
          <button
            type="button"
            onClick={() => diskAudioPlayerService.setExpanded(true)}
            aria-label="توسيع مشغل الصوت"
            title="اضغط للتوسيع والتحكم في الصوت"
            className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:scale-105 focus:outline-none"
          >
            {/* Outer Circular Progress Ring */}
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
                stroke="#FAD277"
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={2 * Math.PI * 30 * (1 - progressPercent / 100)}
                strokeLinecap="round"
              />
            </svg>

            {/* Rotating Vinyl Record Texture */}
            <div
              className={`w-14 h-14 rounded-full bg-[radial-gradient(circle,#172A28_0%,#091412_45%,#1d3531_48%,#08110f_68%,#1f3834_71%,#050b0a_100%)] border-2 border-[#C5A059] shadow-inner flex items-center justify-center relative overflow-hidden ${
                isPlaying ? 'animate-[spin_5s_linear_infinite]' : ''
              }`}
            >
              {/* Vinyl Grooves Sheen */}
              <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
              <div className="absolute inset-2.5 rounded-full border border-amber-300/15 pointer-events-none" />

              {/* Center Disk Icon Label */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FAD277] to-[#C5A059] p-1 flex items-center justify-center shadow-md relative">
                {isRuqyah ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0A382E]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#0A382E]" />
                )}
                {/* Center Spindle Hole */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#091412] border border-[#C5A059] absolute" />
              </div>
            </div>

            {/* Floating Mini Status / Loading Badge */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#FAD277] to-[#C5A059] border border-white/60 shadow-md flex items-center justify-center text-[#0A382E]">
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isPlaying ? (
                <Disc3 className="w-3 h-3 animate-pulse" />
              ) : (
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              )}
            </div>
          </button>

          {/* Floating Pill Label beside Disk */}
          <button
            type="button"
            onClick={() => diskAudioPlayerService.setExpanded(true)}
            className="bg-[#0C3D33]/95 hover:bg-[#104B40] text-white backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-400/40 shadow-xl flex items-center gap-2 transition-all cursor-pointer text-right group"
            title="اضغط لفتح شريط التحكم في الصوت"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <div className="min-w-0">
              <span className="text-xs font-black text-amber-200 block truncate max-w-[130px]">
                {track.title}
              </span>
              <span className="text-[10px] text-white/70 block font-sans">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </button>
        </div>
      ) : (
        /* ==================== 2. EXPANDED STATE: FULL SCRUBBER & CONTROLS ==================== */
        <div className="pointer-events-auto bg-gradient-to-br from-[#0A342C] via-[#104B40] to-[#082520] text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-amber-400/35 backdrop-blur-md animate-fadeIn">
          {/* Top Bar: Title, Minimize, and Close */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30 ${
                  isPlaying ? 'animate-[spin_5s_linear_infinite]' : ''
                }`}
              >
                {isRuqyah ? (
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
              </div>
              <div className="min-w-0 text-right">
                <h4 className="text-xs sm:text-sm font-black text-white truncate">
                  {track.title}
                </h4>
                <p className="text-[10px] text-amber-200/80 truncate font-sans">
                  {track.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Minimize to Circular Disk */}
              <button
                type="button"
                onClick={() => diskAudioPlayerService.setExpanded(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="تصغير إلى أسطوانة دائرية"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Stop & Close Player */}
              <button
                type="button"
                onClick={() => diskAudioPlayerService.stop()}
                className="w-8 h-8 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 flex items-center justify-center cursor-pointer transition-colors"
                title="إيقاف وإغلاق المشغل"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Slider (Scrubber) */}
          <div className="pt-3 pb-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={1}
              value={currentTime}
              onChange={(e) => diskAudioPlayerService.seekTo(Number(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FAD277]"
            />
            <div className="flex justify-between items-center text-[11px] font-sans text-amber-200/90 pt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Bar: Rewind 15s, Play/Pause, Forward 15s, Speed */}
          <div className="flex items-center justify-between pt-2">
            {/* Speed Toggle */}
            <button
              type="button"
              onClick={() => {
                const rates = [1.0, 1.25, 1.5];
                const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                diskAudioPlayerService.setPlaybackRate(next);
              }}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-amber-200 font-sans cursor-pointer transition-colors"
              title="تغيير سرعة الصوت"
            >
              {playbackRate}x
            </button>

            {/* Playback Controls Center */}
            <div className="flex items-center gap-3">
              {/* Rewind 15s */}
              <button
                type="button"
                onClick={() => diskAudioPlayerService.seekBy(-15)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all active:scale-90"
                title="تأخير 15 ثانية"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                type="button"
                onClick={() => diskAudioPlayerService.togglePlayPause()}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FAD277] to-[#E5A835] hover:from-[#FBE095] hover:to-[#E5A835] text-[#0A382E] flex items-center justify-center shadow-lg cursor-pointer transition-transform active:scale-90"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Forward 15s */}
              <button
                type="button"
                onClick={() => diskAudioPlayerService.seekBy(15)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all active:scale-90"
                title="تقديم 15 ثانية"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Collapse Button */}
            <button
              type="button"
              onClick={() => diskAudioPlayerService.setExpanded(false)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white cursor-pointer transition-colors"
              title="تصغير إلى أسطوانة دائرية"
            >
              تصغير
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
