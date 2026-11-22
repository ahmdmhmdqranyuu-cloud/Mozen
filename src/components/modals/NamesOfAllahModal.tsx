import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  Share2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { NAMES_OF_ALLAH, NameOfAllah } from '../../data/namesOfAllahData';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';
import { diskAudioPlayerService, DiskPlayerState } from '../../utils/diskAudioPlayerService';
import { AppLanguage } from '../../utils/i18n';

interface NamesOfAllahModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: AppLanguage;
}

export const NamesOfAllahModal: React.FC<NamesOfAllahModalProps> = ({
  isOpen,
  onClose,
  language = 'ar',
}) => {
  const isRtl = language === 'ar' || language === 'ur';
  const isEnglish = !isRtl;

  const [search, setSearch] = useState('');
  const [selectedName, setSelectedName] = useState<NameOfAllah | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const [diskState, setDiskState] = useState<DiskPlayerState>(() =>
    diskAudioPlayerService.getState()
  );

  React.useEffect(() => {
    return diskAudioPlayerService.subscribe(setDiskState);
  }, []);

  React.useEffect(() => {
    if (!isOpen || !selectedName) return;
    const handleBack = (e: Event) => {
      e.preventDefault();
      setSelectedName(null);
    };
    window.addEventListener('moazenBackRequested', handleBack);
    return () => window.removeEventListener('moazenBackRequested', handleBack);
  }, [isOpen, selectedName]);

  const isAsmaaTrack = diskState.track?.type === 'asmaa_allah';
  const isPlayingAsmaa = isAsmaaTrack && diskState.isPlaying;
  const isPausedAsmaa = isAsmaaTrack && !diskState.isPlaying && diskState.currentTime > 0;
  const asmaaDuration = isAsmaaTrack && diskState.duration > 0 ? diskState.duration : 205.4;
  const asmaaCurrentTime = isAsmaaTrack ? diskState.currentTime : 0;

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredNames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return NAMES_OF_ALLAH;
    return NAMES_OF_ALLAH.filter(
      (item) =>
        item.name.includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.transliteration.toLowerCase().includes(q) ||
        String(item.number) === q ||
        (item.quranReference && item.quranReference.toLowerCase().includes(q))
    );
  }, [search]);

  if (!isOpen) return null;

  const handleCopy = (item: NameOfAllah) => {
    navigator.clipboard?.writeText(
      isEnglish
        ? `99 Names of Allah (${item.number}/99):\n【${item.name} — ${item.transliteration}】\n${item.meaning}\n— Muslim Plus`
        : `من أسماء الله الحسنى (${item.number}/99):\n【${item.name}】\nالمعنى: ${item.meaning}\n${
            item.quranReference ? `الشاهد القرآني: ${item.quranReference}\n` : ''
          }— تطبيق مسلم بلس`
    );
    setCopiedId(item.number);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareText = async (item: NameOfAllah) => {
    await shareIslamicText({
      title: isEnglish
        ? `Names of Allah: 【${item.name} • ${item.transliteration}】`
        : `من أسماء الله الحسنى: 【${item.name}】`,
      body: item.meaning,
      source: item.quranReference || 'ولله الأسماء الحسنى فادعوه بها',
    });
  };

  const handleShareCard = async (item: NameOfAllah) => {
    await shareOrDownloadAsImageCard({
      categoryBadge: isEnglish
        ? `99 Names of Allah (${item.number}/99)`
        : `أسماء الله الحسنى (${item.number}/99)`,
      title: `【 ${item.name} 】 ${item.transliteration}`,
      mainText: item.meaning,
      referenceText: item.quranReference || '﴿وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا﴾',
    });
  };

  const currentIdx = selectedName
    ? filteredNames.findIndex((n) => n.number === selectedName.number)
    : -1;

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const progressPercent =
    asmaaDuration > 0 ? Math.min(100, Math.round((asmaaCurrentTime / asmaaDuration) * 100)) : 0;

  return (
    <div
      className="fixed inset-0 z-50 muslim-plus-canvas flex flex-col overflow-hidden select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Clean Header matching Muslim Plus */}
      <div className="bg-[#F6EEDC]/95 backdrop-blur-xs text-[#172A28] px-4 pt-4 pb-3 shadow-xs border-b border-[#D6C18D] shrink-0">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (selectedName) {
                  setSelectedName(null);
                } else {
                  onClose();
                }
              }}
              className="w-9 h-9 rounded-full bg-white/90 border border-[#D6C18D] hover:brightness-95 flex items-center justify-center text-[#104B40] transition-colors shrink-0 cursor-pointer"
              aria-label={isEnglish ? 'Back' : 'رجوع'}
            >
              <BackIcon className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold font-cairo text-[#104B40] truncate">
                {selectedName
                  ? isEnglish
                    ? `${selectedName.transliteration} (${selectedName.name})`
                    : `اسم الله: 【${selectedName.name}】`
                  : isEnglish
                  ? '99 Names of Allah'
                  : 'أسماء الله الحسنى (99)'}
              </h2>
              <p className="text-[11px] text-[#4B5B58] truncate">
                {selectedName
                  ? isEnglish
                    ? `Name #${selectedName.number} of 99 • Tap back for grid`
                    : `الاسم رقم ${selectedName.number} من 99 • اضغط للعودة للشبكة`
                  : isEnglish
                  ? 'Direct 99 Names Grid • Tap any card for full meaning'
                  : 'شبكة الأسماء الحسنى مباشرة • اضغط على أي اسم لعرض معناه'}
              </p>
            </div>
          </div>

          {selectedName && (
            <button
              type="button"
              onClick={() => setSelectedName(null)}
              className="px-3 py-1.5 rounded-xl bg-[#104B40] text-white text-xs font-bold cursor-pointer shrink-0"
            >
              {isEnglish ? 'All 99' : 'الشبكة'}
            </button>
          )}
        </div>

        {/* Search input directly below header in grid view */}
        {!selectedName && (
          <div className="max-w-2xl mx-auto w-full mt-2.5">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isEnglish
                    ? 'Search by name, transliteration, number or meaning...'
                    : 'ابحث بالاسم أو المعنى أو الرقم...'
                }
                className={`moazen-widget w-full border border-[#D6C18D] rounded-xl py-2 ${
                  isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                } text-xs text-[#172A28] placeholder-[#4B5B58]/70 focus:outline-none focus:border-[#C5A059]`}
              />
              <Search
                className={`w-4 h-4 text-[#9A7732] absolute ${
                  isRtl ? 'right-3' : 'left-3'
                } top-1/2 -translate-y-1/2`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Scrollable Area: Direct Grid of 99 Names OR Detail Page */}
      {!selectedName ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 max-w-2xl mx-auto w-full space-y-2.5">
          <div className="moazen-widget rounded-2xl p-2.5 border border-[#D6C18D] text-center">
            <p className="text-xs font-bold font-amiri text-[#104B40]">
              قال رسول الله ﷺ: «إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إِلَّا وَاحِدًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ»
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-24">
            {filteredNames.map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => setSelectedName(item)}
                className="moazen-widget p-3 rounded-2xl border border-[#D6C18D] shadow-xs hover:border-[#C5A059] active:scale-[0.98] transition-all flex flex-col justify-between text-center cursor-pointer group min-h-[106px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-black text-[#104B40] bg-[#C5A059]/20 px-2 py-0.5 rounded-md font-sans border border-[#C5A059]/30">
                    {item.number}
                  </span>
                  <span className="text-[10px] font-semibold text-[#9A7732] truncate max-w-[68%]">
                    {item.transliteration}
                  </span>
                </div>

                <div className="my-1.5 text-center">
                  <h3 className="text-xl font-bold font-amiri text-[#104B40] group-hover:text-[#9A7732] transition-colors">
                    {item.name}
                  </h3>
                </div>

                <p className="text-[10.5px] text-[#4B5B58] line-clamp-2 leading-snug text-center">
                  {item.meaning}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 max-w-2xl mx-auto w-full space-y-3.5">
          <div className="moazen-widget rounded-2xl p-2.5 border border-[#D6C18D] shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedName(null)}
              className="moazen-widget-sub flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#104B40] text-xs font-bold border border-[#D6C18D] cursor-pointer"
            >
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isEnglish ? 'Back to 99 Names Grid' : 'العودة إلى شبكة الأسماء (99)'}</span>
            </button>
            <span className="text-xs font-bold text-[#9A7732] bg-[#C5A059]/15 px-3 py-1 rounded-full">
              {isEnglish ? `${selectedName.number} of 99` : `الاسم ${selectedName.number} من 99`}
            </span>
          </div>

          <div className="moazen-widget rounded-3xl p-5 shadow-sm border border-[#D6C18D] space-y-4">
            <div className="moazen-widget-sub text-center py-6 rounded-2xl border border-[#C5A059]/40">
              <h2 className="text-4xl sm:text-5xl font-bold font-amiri text-[#104B40] mb-1.5">
                {selectedName.name}
              </h2>
              <p className="text-xs font-bold text-[#9A7732] mb-1">{selectedName.transliteration}</p>
              <span className="text-[11px] text-[#4B5B58] font-semibold">
                {isEnglish ? 'Glory be to Allah' : 'جل جلاله وتقدست أسماؤه'}
              </span>
            </div>

            <div className="moazen-widget-sub rounded-2xl p-4 border border-[#D6C18D]">
              <h4 className="text-xs font-bold text-[#9A7732] mb-1.5">
                {isEnglish ? 'Meaning & Significance' : 'المعنى والبيان'}
              </h4>
              <p className="text-sm sm:text-base font-medium text-[#172A28] leading-relaxed">
                {selectedName.meaning}
              </p>
              {selectedName.quranReference && (
                <p className="text-xs font-semibold text-[#104B40] mt-2.5 pt-2 border-t border-[#D6C18D]/50">
                  {selectedName.quranReference}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCopy(selectedName)}
                className="moazen-widget-sub py-2.5 rounded-xl border border-[#D6C18D] text-[#104B40] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedId === selectedName.number ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === selectedName.number ? (isEnglish ? 'Copied' : 'تم النسخ') : (isEnglish ? 'Copy' : 'نسخ')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareText(selectedName)}
                className="py-2.5 rounded-xl bg-[#104B40] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isEnglish ? 'Share' : 'مشاركة'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareCard(selectedName)}
                className="py-2.5 rounded-xl bg-[#C5A059] text-[#0E2B22] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isEnglish ? 'Card' : 'بطاقة'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pb-2">
            <button
              type="button"
              disabled={currentIdx <= 0}
              onClick={() => currentIdx > 0 && setSelectedName(filteredNames[currentIdx - 1])}
              className="moazen-widget flex-1 py-2.5 px-3 rounded-xl border border-[#D6C18D] disabled:opacity-40 text-xs font-bold text-[#104B40] cursor-pointer"
            >
              {isEnglish ? 'Previous' : 'الاسم السابق'}
            </button>
            <button
              type="button"
              disabled={currentIdx < 0 || currentIdx >= filteredNames.length - 1}
              onClick={() =>
                currentIdx >= 0 &&
                currentIdx < filteredNames.length - 1 &&
                setSelectedName(filteredNames[currentIdx + 1])
              }
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#104B40] disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
            >
              {isEnglish ? 'Next' : 'الاسم التالي'}
            </button>
          </div>
        </div>
      )}

      {/* Small Floating Asmaa Allah Audio Button & Volume Pod */}
      <div
        className={`absolute bottom-4 ${
          isRtl ? 'left-4' : 'right-4'
        } z-30 flex flex-col ${isRtl ? 'items-start' : 'items-end'} gap-2 pointer-events-none`}
      >
        {showVolumePopover && (
          <div className="pointer-events-auto moazen-widget rounded-2xl border border-[#C5A059]/75 px-3 py-2 shadow-[0_8px_24px_rgba(16,75,64,0.2)] flex items-center gap-2.5 bg-[#FBF6E9]/98 backdrop-blur-sm">
            <button
              type="button"
              onClick={() =>
                diskAudioPlayerService.setVolume(diskState.volume > 0 ? 0 : 1.0)
              }
              className="w-7 h-7 rounded-full bg-[#104B40]/10 hover:bg-[#104B40]/20 text-[#104B40] flex items-center justify-center cursor-pointer"
              aria-label={isEnglish ? 'Mute or unmute' : 'كتم أو إلغاء كتم الصوت'}
            >
              {diskState.volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((diskState.volume ?? 1) * 100)}
              onChange={(e) =>
                diskAudioPlayerService.setVolume(Number(e.target.value) / 100)
              }
              aria-label={isEnglish ? 'Volume' : 'مستوى الصوت'}
              className="w-24 accent-[#104B40] cursor-pointer h-1.5"
            />
            <span className="text-[10px] font-bold text-[#9A7732] tabular-nums w-8 text-center">
              {Math.round((diskState.volume ?? 1) * 100)}%
            </span>
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#F8F1DF]/95 backdrop-blur-sm border border-[#C5A059]/85 p-1 shadow-[0_8px_24px_rgba(16,75,64,0.22)]">
          <button
            type="button"
            onClick={() => {
              if (isPlayingAsmaa) {
                diskAudioPlayerService.pause();
              } else if (isPausedAsmaa) {
                diskAudioPlayerService.resume();
              } else {
                diskAudioPlayerService.playAsmaaAllah();
              }
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#104B40] to-[#0D3D34] hover:brightness-110 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer relative"
            aria-label={
              isPlayingAsmaa
                ? isEnglish
                  ? 'Pause 99 Names audio'
                  : 'إيقاف مؤقت لأسماء الله الحسنى'
                : isEnglish
                ? 'Play 99 Names audio'
                : 'تشغيل أسماء الله الحسنى'
            }
            title={
              isEnglish
                ? `99 Names Audio (${formatAudioTime(asmaaCurrentTime)})`
                : `أسماء الله الحسنى (${formatAudioTime(asmaaCurrentTime)})`
            }
          >
            {isPlayingAsmaa ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-[0.5px]" />
            )}
            {isAsmaaTrack && (
              <span
                className="sr-only"
                data-progress={progressPercent}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowVolumePopover((v) => !v)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              showVolumePopover
                ? 'bg-[#C5A059]/30 text-[#104B40]'
                : 'bg-[#104B40]/8 text-[#104B40] hover:bg-[#104B40]/15'
            }`}
            aria-label={isEnglish ? 'Audio volume' : 'التحكم في الصوت'}
            title={isEnglish ? 'Volume control' : 'مستوى الصوت'}
          >
            {diskState.volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
