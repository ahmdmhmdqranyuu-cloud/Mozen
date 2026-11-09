import React, { useState } from 'react';
import {
  ArrowRight,
  X,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  Menu,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  CheckCircle2,
  Play,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { RUQYAH_LIST, RuqyahItem } from '../../data/suggestionsData';
import { soundService } from '../../utils/audioPlayer';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';
import { userStatsTracker } from '../../utils/userStatsTracker';
import { diskAudioPlayerService, DiskPlayerState } from '../../utils/diskAudioPlayerService';

interface RuqyahModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuqyahModal: React.FC<RuqyahModalProps> = ({ isOpen, onClose }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [diskState, setDiskState] = useState<DiskPlayerState>(() =>
    diskAudioPlayerService.getState()
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<RuqyahItem | null>(null);
  const [repeatCounts, setRepeatCounts] = useState<Record<string, number>>({});

  React.useEffect(() => {
    return diskAudioPlayerService.subscribe(setDiskState);
  }, []);

  const isPlayingFullRuqyah = diskState.isPlaying && diskState.track?.type === 'ruqyah';

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'جميع أبواب الرقية', count: RUQYAH_LIST.length },
    { id: 'الرقية العامة والتحصين', label: 'الرقية العامة والتحصين', count: RUQYAH_LIST.filter((i) => i.category === 'الرقية العامة والتحصين').length },
    { id: 'رقية العين والحسد', label: 'رقية العين والحسد', count: RUQYAH_LIST.filter((i) => i.category === 'رقية العين والحسد').length },
    { id: 'رقية إبطال السحر والمس', label: 'رقية إبطال السحر والمس', count: RUQYAH_LIST.filter((i) => i.category === 'رقية إبطال السحر والمس').length },
    { id: 'رقية الشفاء والأوجاع', label: 'رقية الشفاء والأوجاع', count: RUQYAH_LIST.filter((i) => i.category === 'رقية الشفاء والأوجاع').length },
    { id: 'رقية السكينة والأبناء', label: 'السكينة وتحصين الأبناء', count: RUQYAH_LIST.filter((i) => i.category === 'رقية السكينة والأبناء').length },
  ];

  const displayedList = RUQYAH_LIST.filter((item) => {
    if (selectedCategory !== 'all') return item.category === selectedCategory;
    return true;
  });

  const handlePlayRuqyah = (id: string, text: string) => {
    if (playingId === id) {
      soundService.stopAudio();
      setPlayingId(null);
    } else {
      setPlayingId(id);
      soundService.playAyahAudio(1, text, () => setPlayingId(null));
    }
  };

  const handleCopy = (id: string, text: string, title: string) => {
    navigator.clipboard?.writeText(`🛡️ ${title}\n\n${text}\n\n— تطبيق المؤذن`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (item: RuqyahItem) => {
    await shareIslamicText({
      title: item.title,
      body: item.arabic,
      source: item.category || 'الرقية الشرعية من الكتاب والسنة',
      extraFooter: `الفضل والأثر: ${item.fadl}`,
    });
  };

  const handleShareCard = async (item: RuqyahItem) => {
    await shareOrDownloadAsImageCard({
      categoryBadge: item.category || 'الرقية الشرعية',
      title: item.title,
      mainText: item.arabic,
      referenceText: item.fadl,
    });
  };

  const handleIncrementRepeat = (item: RuqyahItem) => {
    soundService.playTasbihClick();
    const max = item.repeatCount || 3;
    const nextVal = Math.min(max, (repeatCounts[item.id] || 0) + 1);
    if (nextVal === max) {
      userStatsTracker.recordSunnahCompleted(item.id);
    }
    setRepeatCounts((prev) => ({
      ...prev,
      [item.id]: nextVal,
    }));
  };

  const currentItemIndex = selectedItem
    ? displayedList.findIndex((i) => i.id === selectedItem.id)
    : -1;

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F6F2] flex flex-col overflow-x-hidden select-none animate-fadeIn" dir="rtl">
      {/* Clean White Header (No Green) */}
      <div className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-sm border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                soundService.stopAudio();
                setPlayingId(null);
                if (selectedItem) {
                  setSelectedItem(null);
                } else {
                  onClose();
                }
              }}
              className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors shrink-0 cursor-pointer"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28] truncate">
                {selectedItem ? selectedItem.title : `فهرس الرقية الشرعية الشاملة (${RUQYAH_LIST.length} ورداً)`}
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
                {selectedItem
                  ? `${selectedItem.category || 'الرقية الشرعية'} • اضغط للعودة إلى الفهرس الرأسي`
                  : 'فهرس رأسي منظم • اضغط على أي ورد لفتح صفحته المستقلة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedItem && (
              <button
                onClick={() => {
                  soundService.stopAudio();
                  setPlayingId(null);
                  setSelectedItem(null);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#104B40] text-white text-xs font-bold cursor-pointer"
              >
                <span>الفهرس</span>
              </button>
            )}
            <button
              onClick={() => setIsIndexOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 transition-colors cursor-pointer"
              aria-label="فهرس الرقية الشرعية"
            >
              <Menu className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold">الأبواب</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills in Vertical Index View */}
        {!selectedItem && (
          <div className="max-w-2xl mx-auto w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-xs'
                      : 'bg-[#F7F6F2] text-[#172A28] border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Collapsible ☰ Index Drawer */}
      {isIndexOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-bold text-base text-[#172A28]">فهرس الرقية الشرعية الكاملة ({RUQYAH_LIST.length})</h3>
              </div>
              <button
                onClick={() => setIsIndexOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {RUQYAH_LIST.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setIsIndexOpen(false);
                  }}
                  className={`w-full text-right p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                    selectedItem?.id === item.id
                      ? 'bg-[#C5A059]/10 border-[#C5A059] text-[#172A28]'
                      : 'bg-white border-gray-100 hover:bg-gray-50 text-[#172A28]'
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg bg-[#F7F6F2] text-gray-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#C5A059] block">{item.category}</span>
                    <span className="text-xs font-bold block truncate">{item.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: ORGANIZED VERTICAL INDEX OF RUQYAH ITEMS */}
      {!selectedItem ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 pb-24 max-w-2xl mx-auto w-full">
          {/* Compact Ruqyah Shariah Audio Player Widget (Compact design with full offline functionality) */}
          <div className="bg-gradient-to-r from-[#104B40] via-[#145548] to-[#104B40] text-white p-2.5 sm:p-3 rounded-2xl shadow-xs border border-[#C5A059]/30 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center shrink-0 border border-[#C5A059]/40">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold font-cairo text-white truncate">
                    تشغيل الرقية الشرعية بدون إنترنت
                  </h3>
                  <span className="text-[9px] font-bold bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded-md border border-amber-300/30">
                    كاملة
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-white/80 font-sans truncate">
                  تسجيل خاشع كامل من الكتاب والسنة لعلاج الحسد والعين والمس
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => diskAudioPlayerService.playRuqyah()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs ${
                isPlayingFullRuqyah
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-gradient-to-r from-[#FAD277] to-[#E5A835] hover:from-[#FBE095] hover:to-[#E5A835] text-[#0A382E]'
              }`}
            >
              {isPlayingFullRuqyah ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>إيقاف الرقية</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>تشغيل الرقية</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs text-xs text-gray-700 leading-relaxed flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-[#9A7732] block mb-0.5">فهرس آيات وأدعية الرقية الشرعية ({displayedList.length}):</span>
              اضغط على أي آية أو دعاء من الفهرس الرأسي لفتح صفحته المستقلة مع الاستماع والتكرار والمشاركة.
            </div>
            {Object.keys(repeatCounts).length > 0 && (
              <button
                onClick={() => setRepeatCounts({})}
                className="px-2.5 py-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-gray-600 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير</span>
              </button>
            )}
          </div>

          {displayedList.map((item, idx) => {
            const target = item.repeatCount || 3;
            const current = repeatCounts[item.id] || 0;
            const isDone = current >= target;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-right bg-white hover:bg-[#FAF9F5] p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer shadow-xs group ${
                  isDone ? 'border-emerald-400' : 'border-gray-100 hover:border-[#C5A059]/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-emerald-600 text-white' : 'bg-[#104B40] text-[#C5A059]'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-[#172A28] group-hover:text-[#104B40] transition-colors">
                        {item.title}
                      </h4>
                      {item.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-[#9A7732]">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-amiri line-clamp-1 mt-0.5">
                      {item.arabic}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#F7F6F2] text-gray-600">
                      {current}/{target}
                    </span>
                  )}
                  <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: INDEPENDENT DETAIL PAGE FOR SELECTED RUQYAH ITEM */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-24 max-w-2xl mx-auto w-full animate-fadeIn">
          {/* Top Back Bar */}
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center justify-between">
            <button
              onClick={() => {
                soundService.stopAudio();
                setPlayingId(null);
                setSelectedItem(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] text-xs font-bold cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة إلى فهرس الرقية الشرعية ({displayedList.length})</span>
            </button>
            <span className="text-xs font-bold text-[#9A7732] bg-[#C5A059]/15 px-3 py-1 rounded-full">
              {selectedItem.category || 'الرقية الشرعية'}
            </span>
          </div>

          {(() => {
            const isPlaying = playingId === selectedItem.id;
            const target = selectedItem.repeatCount || 3;
            const current = repeatCounts[selectedItem.id] || 0;
            const isDone = current >= target;

            return (
              <div
                className={`p-5 sm:p-6 rounded-3xl bg-white border shadow-sm transition-all text-right space-y-4 ${
                  isDone ? 'border-emerald-400' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[11px] text-gray-400 font-bold block">
                      الورد رقم {currentItemIndex + 1} من {displayedList.length}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#172A28] font-cairo mt-0.5">
                      {selectedItem.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handlePlayRuqyah(selectedItem.id, selectedItem.arabic)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      isPlaying
                        ? 'bg-red-500 text-white'
                        : 'bg-[#104B40] text-white hover:bg-[#0B3D35]'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>إيقاف الصوت</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-[#C5A059]" />
                        <span>استماع صوتي</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="font-amiri text-xl sm:text-2xl leading-[2.2] text-[#172A28] bg-[#FAF9F5] p-5 rounded-2xl border border-[#C5A059]/30 font-bold select-text break-words whitespace-pre-line">
                  {selectedItem.arabic}
                </p>

                <div className="text-xs text-gray-700 bg-[#F7F6F2] p-3.5 rounded-xl border border-gray-100 leading-relaxed">
                  <span className="font-bold text-[#9A7732]">الفضل والأثر: </span>
                  {selectedItem.fadl}
                </div>

                {/* Repeat Counter Button */}
                <button
                  onClick={() => handleIncrementRepeat(selectedItem)}
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#C5A059] hover:bg-[#B08D46] text-white active:scale-95'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isDone
                      ? `اكتملت القراءة المباركة (${target}/${target})`
                      : `اضغط عند إتمام القراءة (${current} من ${target} مرات)`}
                  </span>
                </button>

                {/* Share & Copy Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    onClick={() => handleShareCard(selectedItem)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#9A7732] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>بطاقة (5 خلفيات)</span>
                  </button>

                  <button
                    onClick={() => handleShare(selectedItem)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>مشاركة النص</span>
                  </button>

                  <button
                    onClick={() => handleCopy(selectedItem.id, selectedItem.arabic, selectedItem.title)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedId === selectedItem.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ الورد</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Prev / Next Navigation */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={currentItemIndex <= 0}
              onClick={() => {
                if (currentItemIndex > 0) {
                  soundService.stopAudio();
                  setPlayingId(null);
                  setSelectedItem(displayedList[currentItemIndex - 1]);
                }
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-[#172A28] disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4 text-[#C5A059]" />
              <span>الورد السابق</span>
            </button>

            <button
              disabled={currentItemIndex < 0 || currentItemIndex >= displayedList.length - 1}
              onClick={() => {
                if (currentItemIndex >= 0 && currentItemIndex < displayedList.length - 1) {
                  soundService.stopAudio();
                  setPlayingId(null);
                  setSelectedItem(displayedList[currentItemIndex + 1]);
                }
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-[#172A28] disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-all"
            >
              <span>الورد التالي</span>
              <ChevronLeft className="w-4 h-4 text-[#C5A059]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


