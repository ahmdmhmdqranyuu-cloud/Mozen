import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Download,
  CheckCircle2,
  Trash2,
  Search,
  Volume2,
  ChevronRight,
  WifiOff,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  RECITERS_LIST,
  SURAH_LIST,
  Reciter,
  SurahAudioItem,
  getSurahAudioUrl,
} from '../../data/recitersData';
import {
  recitationOfflineManager,
  DownloadedItem,
} from '../../utils/recitationOfflineManager';
import {
  recitationPlayerService,
  RecitationPlayerState,
} from '../../utils/recitationPlayerService';

interface RecitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSurahPage?: (surahNumber: number) => void;
}

export const RecitationsModal: React.FC<RecitationsModalProps> = ({
  isOpen,
  onClose,
  onOpenSurahPage,
}) => {
  const [playerState, setPlayerState] = useState<RecitationPlayerState>(() =>
    recitationPlayerService.getState()
  );
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(
    () => recitationPlayerService.getState().currentReciter || RECITERS_LIST[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDownloadedOnly, setFilterDownloadedOnly] = useState(false);

  const [downloadingSurahNumber, setDownloadingSurahNumber] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [, setDownloadedList] = useState<DownloadedItem[]>([]);

  // Subscribe to global recitation player state
  useEffect(() => {
    const unsubscribe = recitationPlayerService.subscribe((newState) => {
      setPlayerState(newState);
    });
    return unsubscribe;
  }, []);

  // Sync downloaded list on load
  useEffect(() => {
    if (isOpen) {
      setDownloadedList(recitationOfflineManager.getDownloadedList());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSurahs = SURAH_LIST.filter((s) => {
    const matchesSearch =
      s.name.includes(searchQuery.trim()) ||
      String(s.number).includes(searchQuery.trim()) ||
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase().trim());

    if (filterDownloadedOnly) {
      return (
        matchesSearch &&
        recitationOfflineManager.isDownloaded(selectedReciter.id, s.number)
      );
    }
    return matchesSearch;
  });

  const handlePlaySurah = (surah: SurahAudioItem) => {
    recitationPlayerService.playSurah(surah, selectedReciter);
  };

  const handleDownload = async (e: React.MouseEvent, surah: SurahAudioItem) => {
    e.stopPropagation();
    if (downloadingSurahNumber !== null) return;

    setDownloadingSurahNumber(surah.number);
    setDownloadProgress(20);

    const audioUrl = getSurahAudioUrl(selectedReciter.serverUrl, surah.number);
    const success = await recitationOfflineManager.downloadSurah(
      selectedReciter.id,
      selectedReciter.name,
      surah.number,
      surah.name,
      audioUrl,
      (prog) => setDownloadProgress(prog)
    );

    setDownloadingSurahNumber(null);
    setDownloadProgress(0);

    if (success) {
      setDownloadedList(recitationOfflineManager.getDownloadedList());
    }
  };

  const handleDeleteDownload = async (e: React.MouseEvent, surah: SurahAudioItem) => {
    e.stopPropagation();
    const audioUrl = getSurahAudioUrl(selectedReciter.serverUrl, surah.number);
    await recitationOfflineManager.deleteDownloadedSurah(
      selectedReciter.id,
      surah.number,
      audioUrl
    );
    setDownloadedList(recitationOfflineManager.getDownloadedList());
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-hidden select-none animate-fadeIn"
      dir="rtl"
    >
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#FAF9F5] relative">
        {/* Clean White Header (No Green) */}
        <div className="bg-white text-[#172A28] px-4 pt-5 pb-3.5 flex items-center justify-between shadow-sm border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
              aria-label="رجوع"
              title="رجوع (تستمر التلاوة في الخلفية عبر مشغل الأسطوانة العائم)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">
                التلاوات القرآنية الشريفة
              </h2>
              <p className="text-[11px] text-gray-500">
                تستمر التلاوة عبر مشغل الأسطوانة العائم أثناء التنقل بين جميع الأقسام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] bg-[#C5A059]/15 text-[#9A7732] px-2.5 py-1 rounded-full font-bold">
              {RECITERS_LIST.length} قراء
            </span>
          </div>
        </div>

        {/* Reciters Horizontal Selector */}
        <div className="p-3 bg-white border-b border-gray-100 shrink-0">
          <span className="text-xs font-bold text-gray-700 block mb-2">
            اختر القارئ المفضل:
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {RECITERS_LIST.map((reciter) => {
              const isSelected = reciter.id === selectedReciter.id;
              return (
                <button
                  key={reciter.id}
                  onClick={() => {
                    setSelectedReciter(reciter);
                    recitationPlayerService.setReciter(reciter);
                  }}
                  className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#104B40] text-white border-emerald-700 shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <img
                    src={reciter.photoUrl}
                    alt={reciter.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/30"
                  />
                  <div className="text-right">
                    <h4 className="text-xs font-black leading-tight">
                      {reciter.name}
                    </h4>
                    <span
                      className={`text-[9px] block ${
                        isSelected ? 'text-emerald-200' : 'text-gray-500'
                      }`}
                    >
                      {reciter.riwaya}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200/60 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ابحث برقم أو اسم السورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-right"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterDownloadedOnly(!filterDownloadedOnly)}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              filterDownloadedOnly
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <WifiOff className="w-3 h-3" />
            <span>المُحمّلة فقط</span>
          </button>
        </div>

        {/* Organized Vertical Surah Index List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 pb-28">
          {filteredSurahs.map((surah) => {
            const isDownloaded = recitationOfflineManager.isDownloaded(
              selectedReciter.id,
              surah.number
            );
            const isCurrentPlaying =
              playerState.currentSurah?.number === surah.number &&
              playerState.currentReciter.id === selectedReciter.id;
            const isActivelyPlaying = isCurrentPlaying && playerState.isPlaying;
            const isLoadingThis = isCurrentPlaying && playerState.isLoading;
            const isDownloading = downloadingSurahNumber === surah.number;

            return (
              <div
                key={surah.number}
                onClick={() => handlePlaySurah(surah)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isCurrentPlaying
                    ? 'bg-emerald-50/90 border-[#104B40] shadow-xs'
                    : 'bg-white border-gray-100 hover:border-[#C5A059]/60 hover:bg-gray-50/50'
                }`}
              >
                {/* Right side: Surah number, name, type, verses */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-sans font-black text-xs ${
                      isCurrentPlaying
                        ? 'bg-[#104B40] text-white'
                        : 'bg-[#F7F6F2] text-[#172A28]'
                    }`}
                  >
                    {isActivelyPlaying ? (
                      <Volume2 className="w-4 h-4 animate-pulse text-[#C5A059]" />
                    ) : (
                      surah.number
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black font-quran text-[#172A28]">
                        سورة {surah.name}
                      </h4>
                      {isDownloaded && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>بدون نت</span>
                        </span>
                      )}
                      {isCurrentPlaying && (
                        <span className="text-[9px] font-bold text-[#9A7732] bg-amber-100/80 px-2 py-0.5 rounded-full">
                          {isActivelyPlaying ? 'تعمل الآن' : 'متوقفة مؤقتاً'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {surah.revelationType} • {surah.versesCount} آيات • ص{' '}
                      {surah.pageStart}
                    </span>
                  </div>
                </div>

                {/* Left side: Mushaf shortcut, Download / Delete & Play button */}
                <div
                  className="flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onOpenSurahPage && (
                    <button
                      type="button"
                      onClick={() => onOpenSurahPage(surah.number)}
                      className="p-1.5 rounded-lg text-[#104B40] bg-[#ebf5f1] hover:bg-[#104B40] hover:text-white transition-colors cursor-pointer"
                      title="فتح السورة في المصحف الشريف"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isDownloading ? (
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-200">
                      <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      <span>{downloadProgress}%</span>
                    </div>
                  ) : isDownloaded ? (
                    <button
                      onClick={(e) => handleDeleteDownload(e, surah)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف التنزيل لتوفير المساحة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleDownload(e, surah)}
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      title="تحميل للاستماع أوفلاين دون إنترنت"
                    >
                      <Download className="w-3 h-3" />
                      <span>تحميل</span>
                    </button>
                  )}

                  <button
                    onClick={() => handlePlaySurah(surah)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isActivelyPlaying
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-[#104B40] text-white hover:bg-[#0c392c]'
                    }`}
                  >
                    {isLoadingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isActivelyPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current mr-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredSurahs.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-xs">
              لا توجد سور مطابقة لبحثك
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

