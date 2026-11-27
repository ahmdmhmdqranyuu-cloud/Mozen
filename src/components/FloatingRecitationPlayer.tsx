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
  Download,
  CheckCircle2,
  Trash2,
  WifiOff,
} from 'lucide-react';
import {
  recitationPlayerService,
  RecitationPlayerState,
} from '../utils/recitationPlayerService';
import { recitationOfflineManager } from '../utils/recitationOfflineManager';
import { getSurahAudioCandidateUrls } from '../data/recitersData';

export const FloatingRecitationPlayer: React.FC = () => {
  const [playerState, setPlayerState] = useState<RecitationPlayerState>(() =>
    recitationPlayerService.getState()
  );
  const [, setOfflineRevision] = useState<number>(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribePlayer = recitationPlayerService.subscribe((newState) => {
      setPlayerState(newState);
    });
    const unsubscribeOffline = recitationOfflineManager.subscribe(() => {
      setOfflineRevision((r) => r + 1);
    });
    return () => {
      unsubscribePlayer();
      unsubscribeOffline();
    };
  }, []);

  const {
    currentSurah,
    currentReciter,
    isPlaying,
    isLoading,
    isPlayingOffline,
    currentTime,
    duration,
    playbackSpeed,
    isExpanded,
    errorMessage,
  } = playerState;

  useEffect(() => {
    setDownloadError(null);
  }, [currentSurah?.number, currentReciter.id]);

  if (!currentSurah) return null;

  const isDownloaded = recitationOfflineManager.isDownloaded(
    currentReciter.id,
    currentSurah.number
  );
  const isDownloading = recitationOfflineManager.isDownloading(
    currentReciter.id,
    currentSurah.number
  );
  const downloadProgress = recitationOfflineManager.getDownloadProgress(
    currentReciter.id,
    currentSurah.number
  );

  const handleDownloadOffline = async () => {
    if (isDownloading || isDownloaded) return;
    setDownloadError(null);
    const candidates = getSurahAudioCandidateUrls(currentReciter, currentSurah.number);
    const ok = await recitationOfflineManager.downloadSurah(
      currentReciter.id,
      currentReciter.name,
      currentSurah.number,
      currentSurah.name,
      candidates
    );
    if (!ok) {
      setDownloadError('تعذر حفظ التلاوة أوفلاين، يرجى التأكد من الاتصال بالإنترنت');
      setTimeout(() => setDownloadError(null), 4000);
    }
  };

  const handleRemoveOffline = async () => {
    const candidates = getSurahAudioCandidateUrls(currentReciter, currentSurah.number);
    await recitationOfflineManager.deleteDownloadedSurah(
      currentReciter.id,
      currentSurah.number,
      candidates[0]
    );
  };

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
              className="moazen-widget px-3 py-1.5 rounded-full border border-[#C5A059]/60 shadow-xl flex items-center gap-2 transition-all cursor-pointer"
              title="اضغط لفتح شريط التحكم في التلاوة"
            >
              <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-black font-quran text-[#104B40] block leading-tight">
                    سورة {currentSurah.name}
                  </span>
                  {isDownloaded && (
                    <CheckCircle2
                      className="w-3 h-3 text-emerald-700 shrink-0"
                      aria-label="محفوظة للاستماع بدون إنترنت"
                    />
                  )}
                </div>
                <span className="text-[9px] text-[#4B5B58] font-bold block leading-tight max-w-[110px] truncate">
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
        <div className="moazen-widget pointer-events-auto rounded-3xl p-3.5 shadow-2xl border border-[#C5A059]/60 animate-fadeIn space-y-2.5">
          {/* Top Row: Spinning Vinyl Disc + Surah & Reciter Info + Download, Collapse & Close Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-black font-quran text-[#104B40] truncate">
                    سورة {currentSurah.name}
                  </h4>
                  <span className="text-[10px] bg-white/80 text-[#8a6214] border border-emerald-950/10 px-2 py-0.5 rounded-full font-bold shrink-0">
                    {currentSurah.revelationType} • {currentSurah.versesCount} آية
                  </span>
                  {isPlayingOffline && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full shrink-0">
                      <WifiOff className="w-2.5 h-2.5" />
                      <span>أوفلاين</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#4B5B58] font-bold truncate mt-0.5">
                  القارئ: {currentReciter.name}
                </p>
                {(errorMessage || downloadError) && (
                  <p className="text-[10px] text-rose-700 font-bold mt-0.5">
                    {downloadError || errorMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Download for Offline + Fold/Collapse + Stop/Close Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {isDownloading ? (
                <div
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold"
                  title="جاري حفظ التلاوة في IndexedDB..."
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  <span>{downloadProgress ?? 0}%</span>
                </div>
              ) : isDownloaded ? (
                <div className="flex items-center gap-1">
                  <span
                    className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                    title="تم حفظ التلاوة في الذاكرة المحلية (IndexedDB) للاستماع بدون إنترنت"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">محفوظ</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveOffline}
                    className="p-1.5 rounded-xl bg-white/80 hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-emerald-950/10 transition-colors cursor-pointer"
                    title="حذف التلاوة المحفوظة أوفلاين"
                    aria-label="حذف التلاوة المحفوظة أوفلاين"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadOffline}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#104B40] text-[11px] font-bold transition-colors cursor-pointer"
                  title="تنزيل وحفظ التلاوة للاستماع بدون إنترنت"
                  aria-label="تنزيل التلاوة للاستماع بدون إنترنت"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>أوفلاين</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => recitationPlayerService.setExpanded(false)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-emerald-950/10 text-[#104B40] text-[11px] font-bold transition-colors cursor-pointer"
                title="طي المشغل"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">طي</span>
              </button>
              <button
                type="button"
                onClick={() => recitationPlayerService.stopAndClose()}
                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                title="إيقاف وإغلاق المشغل"
                aria-label="إيقاف وإغلاق المشغل"
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
              className="w-full h-1.5 bg-emerald-950/15 rounded-lg appearance-none cursor-pointer accent-[#104B40]"
              dir="ltr"
            />
            <div
              className="flex items-center justify-between text-[10px] font-mono font-bold text-[#4B5B58] px-0.5"
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
              className="px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white border border-emerald-950/10 text-[#104B40] text-[11px] font-black font-mono transition-colors cursor-pointer"
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
                className="p-2 rounded-full bg-white/80 hover:bg-white border border-emerald-950/10 text-[#104B40] transition-colors cursor-pointer"
                title="السورة السابقة"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={() => recitationPlayerService.togglePlayPause()}
                className="w-10 h-10 rounded-full bg-[#104B40] hover:bg-[#0B3D35] text-amber-300 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-emerald-950/10 text-[#104B40] text-xs font-bold transition-colors cursor-pointer"
                title="الانتقال للتلاوة التالية"
              >
                <span>التلاوة التالية</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Surah Number Badge */}
            <span className="text-[11px] font-bold text-[#104B40] bg-white/80 border border-emerald-950/10 px-2.5 py-1 rounded-xl">
              {currentSurah.number} / 114
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
