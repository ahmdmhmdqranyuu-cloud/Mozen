import React, { useState } from 'react';
import {
  ArrowRight,
  X,
  Search,
  Sparkles,
  Volume2,
  Share2,
  Copy,
  Check,
  Menu,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Play,
  Square,
  Music,
} from 'lucide-react';
import { NAMES_OF_ALLAH, NameOfAllah } from '../../data/namesOfAllahData';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';
import { soundService } from '../../utils/audioPlayer';
import { diskAudioPlayerService, DiskPlayerState } from '../../utils/diskAudioPlayerService';

interface NamesOfAllahModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NamesOfAllahModal: React.FC<NamesOfAllahModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mercy' | 'power' | 'wisdom'>('all');
  const [selectedName, setSelectedName] = useState<NameOfAllah | null>(null);
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'grid'>('vertical');
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [diskState, setDiskState] = useState<DiskPlayerState>(() =>
    diskAudioPlayerService.getState()
  );

  React.useEffect(() => {
    return diskAudioPlayerService.subscribe(setDiskState);
  }, []);

  const isPlayingAsmaaAudio = diskState.isPlaying && diskState.track?.type === 'asmaa_allah';

  if (!isOpen) return null;

  const filteredNames = NAMES_OF_ALLAH.filter((item) => {
    const matchesSearch =
      item.name.includes(search.trim()) ||
      item.meaning.includes(search.trim()) ||
      (item.quranReference && item.quranReference.includes(search.trim()));

    if (selectedCategory === 'mercy') {
      return matchesSearch && (item.meaning.includes('رحم') || item.meaning.includes('غفر') || item.meaning.includes('كرم') || item.meaning.includes('حب') || item.meaning.includes('توب'));
    }
    if (selectedCategory === 'power') {
      return matchesSearch && (item.meaning.includes('قدر') || item.meaning.includes('ملك') || item.meaning.includes('قو') || item.meaning.includes('عز') || item.meaning.includes('قهر'));
    }
    if (selectedCategory === 'wisdom') {
      return matchesSearch && (item.meaning.includes('علم') || item.meaning.includes('حكم') || item.meaning.includes('عدل') || item.meaning.includes('حق') || item.meaning.includes('نور'));
    }
    return matchesSearch;
  });

  const handleSpeakName = (name: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`يَا ${name}`);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = (item: NameOfAllah) => {
    navigator.clipboard.writeText(
      `من أسماء الله الحسنى:\n【${item.name}】\nالمعنى: ${item.meaning}\n${item.quranReference ? `الشاهد القرآني: ${item.quranReference}\n` : ''}— تطبيق المؤذن`
    );
    setCopiedId(item.number);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareText = async (item: NameOfAllah) => {
    await shareIslamicText({
      title: `من أسماء الله الحسنى: 【${item.name}】`,
      body: item.meaning,
      source: item.quranReference || 'ولله الأسماء الحسنى فادعوه بها',
    });
  };

  const handleShareCard = async (item: NameOfAllah) => {
    await shareOrDownloadAsImageCard({
      categoryBadge: `أسماء الله الحسنى (${item.number}/99)`,
      title: `【 ${item.name} 】 جل جلاله`,
      mainText: item.meaning,
      referenceText: item.quranReference || '﴿وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا﴾',
    });
  };

  const categories = [
    { id: 'all' as const, label: `جميع الأسماء (${NAMES_OF_ALLAH.length})` },
    { id: 'mercy' as const, label: 'أسماء الرحمة والمغفرة' },
    { id: 'power' as const, label: 'أسماء العزة والقدرة' },
    { id: 'wisdom' as const, label: 'أسماء العلم والحكمة' },
  ];

  const currentIdx = selectedName
    ? filteredNames.findIndex((n) => n.number === selectedName.number)
    : -1;

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F6F2] flex flex-col overflow-x-hidden select-none animate-fadeIn" dir="rtl">
      {/* Clean White Header (No Green) */}
      <div className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-sm border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (selectedName) {
                  setSelectedName(null);
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
                {selectedName ? `اسم الله: 【${selectedName.name}】` : 'فهرس أسماء الله الحسنى (99)'}
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
                {selectedName
                  ? `الاسم رقم ${selectedName.number} من 99 • اضغط للعودة للفهرس`
                  : 'فهرس رأسي منظم • اضغط على أي اسم لفتح صفحته المستقلة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedName ? (
              <button
                onClick={() => setSelectedName(null)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#104B40] text-white text-xs font-bold cursor-pointer"
              >
                <span>الفهرس</span>
              </button>
            ) : (
              <button
                onClick={() => setLayoutMode((m) => (m === 'vertical' ? 'grid' : 'vertical'))}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 text-xs font-bold cursor-pointer"
                title="تغيير طريقة العرض"
              >
                {layoutMode === 'vertical' ? (
                  <>
                    <LayoutGrid className="w-4 h-4 text-[#C5A059]" />
                    <span>شبكة</span>
                  </>
                ) : (
                  <>
                    <List className="w-4 h-4 text-[#C5A059]" />
                    <span>فهرس رأسي</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setIsIndexOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 transition-colors cursor-pointer"
              aria-label="فهرس أسماء الله الحسنى"
            >
              <Menu className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold">الأبواب</span>
            </button>
          </div>
        </div>

        {/* Search & Category Pills in Index Mode */}
        {!selectedName && (
          <>
            {/* Full Asmaa Allah Audio Player Banner */}
            <div className="max-w-2xl mx-auto w-full mb-2 bg-gradient-to-r from-[#104B40] via-[#145548] to-[#0D3E35] text-white p-3 rounded-2xl shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-black font-cairo text-white truncate">
                      استمع لنشيد وتلاوة أسماء الله الحسنى الـ 99
                    </h4>
                    <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full">
                      صوت نقي
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 font-sans truncate">
                    «نسألك يا من هو الله الذي لا إله إلا هو الرحمن الرحيم...»
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => diskAudioPlayerService.playAsmaaAllah()}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
                  isPlayingAsmaaAudio
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black'
                }`}
              >
                {isPlayingAsmaaAudio ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف النشيد</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تشغيل النشيد</span>
                  </>
                )}
              </button>
            </div>

            <div className="max-w-2xl mx-auto w-full relative mb-2">
              <input
                type="text"
                placeholder="ابحث في فهرس أسماء الله الحسنى أو معانيها..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-[#F7F6F2] border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C5A059] text-right"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="max-w-2xl mx-auto w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border cursor-pointer transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#C5A059] text-white border-[#C5A059]'
                      : 'bg-[#F7F6F2] text-[#172A28] border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Collapsible ☰ Index Drawer */}
      {isIndexOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-bold text-base text-[#172A28]">فهرس أسماء الله الحسنى</h3>
              </div>
              <button
                onClick={() => setIsIndexOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-100 space-y-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedName(null);
                    setIsIndexOpen(false);
                  }}
                  className={`w-full text-right p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#C5A059]/10 border-[#C5A059] text-[#172A28]'
                      : 'bg-white border-gray-100 text-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2">
              {NAMES_OF_ALLAH.map((item) => (
                <button
                  key={item.number}
                  onClick={() => {
                    setSelectedName(item);
                    setIsIndexOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-right flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-lg bg-white text-[10px] font-bold text-[#C5A059] flex items-center justify-center shrink-0">
                    {item.number}
                  </span>
                  <span className="text-xs font-bold font-amiri text-[#172A28] truncate">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: ORGANIZED VERTICAL INDEX (or optional grid) */}
      {!selectedName ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 max-w-2xl mx-auto w-full space-y-2.5">
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 text-center">
            <p className="text-xs font-bold font-amiri text-[#172A28]">
              قال رسول الله ﷺ: «إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إِلَّا وَاحِدًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ»
            </p>
          </div>

          {layoutMode === 'vertical' ? (
            <div className="space-y-2">
              {filteredNames.map((item) => (
                <button
                  key={item.number}
                  onClick={() => setSelectedName(item)}
                  className="w-full text-right bg-white hover:bg-[#FAF9F5] p-3.5 rounded-2xl border border-gray-100 hover:border-[#C5A059]/60 shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#104B40] text-[#C5A059] font-bold text-xs flex items-center justify-center shrink-0">
                      {item.number}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold font-amiri text-[#172A28] group-hover:text-[#104B40] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {item.meaning}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeakName(item.name);
                      }}
                      className="p-2 rounded-xl bg-[#F7F6F2] text-gray-500 hover:text-[#C5A059] hover:bg-gray-200 transition-colors"
                      title="استمع للاسم"
                    >
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredNames.map((item) => (
                <button
                  key={item.number}
                  onClick={() => setSelectedName(item)}
                  className="p-3 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-[#C5A059] transition-all text-right flex flex-col justify-between cursor-pointer group min-h-[104px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-[#9A7732] bg-[#C5A059]/15 px-2 py-0.5 rounded-md font-sans">
                      {item.number}
                    </span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeakName(item.name);
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:text-[#C5A059] hover:bg-[#F7F6F2] transition-colors"
                      title="استمع للاسم"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="my-1.5 text-center">
                    <h3 className="text-lg font-bold font-amiri text-[#172A28] group-hover:text-[#C5A059] transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                    {item.meaning}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: INDEPENDENT DEDICATED DETAIL PAGE FOR SELECTED NAME */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 max-w-2xl mx-auto w-full space-y-4 animate-fadeIn">
          {/* Top Back Bar */}
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center justify-between">
            <button
              onClick={() => setSelectedName(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] text-xs font-bold cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة إلى فهرس الأسماء الحسنى (99)</span>
            </button>
            <span className="text-xs font-bold text-[#9A7732] bg-[#C5A059]/15 px-3 py-1 rounded-full">
              الاسم {selectedName.number} من 99
            </span>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
            <div className="text-center py-6 bg-[#FAF9F5] rounded-2xl border border-[#C5A059]/30 relative">
              <button
                onClick={() => handleSpeakName(selectedName.name)}
                className="absolute left-4 top-4 p-2.5 rounded-xl bg-[#104B40] text-[#C5A059] hover:bg-[#0B3D35] transition-colors cursor-pointer"
                title="نطق الاسم"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <h2 className="text-4xl sm:text-5xl font-bold font-amiri text-[#172A28] mb-2">
                {selectedName.name}
              </h2>
              <span className="text-xs text-[#C5A059] font-bold">جل جلاله وتقدست أسماؤه</span>
            </div>

            <div className="space-y-3 text-right">
              <div className="bg-[#F7F6F2] p-4 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-[#9A7732] block mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  المعنى والتدبر الإيماني:
                </span>
                <p className="text-sm text-[#172A28] leading-loose font-medium">
                  {selectedName.meaning}
                </p>
              </div>

              {selectedName.quranReference && (
                <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#C5A059]/30">
                  <span className="text-xs font-bold text-[#9A7732] block mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#C5A059]" />
                    الشاهد من القرآن الكريم:
                  </span>
                  <p className="text-base font-bold font-amiri text-[#172A28] leading-loose">
                    {selectedName.quranReference}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={() => handleShareCard(selectedName)}
                className="py-3 px-3 rounded-2xl bg-[#C5A059] hover:bg-[#B08D46] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>بطاقة (5 خلفيات)</span>
              </button>

              <button
                onClick={() => handleShareText(selectedName)}
                className="py-3 px-3 rounded-2xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة النص</span>
              </button>

              <button
                onClick={() => handleCopy(selectedName)}
                className="py-3 px-3 rounded-2xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedId === selectedName.number ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prev / Next Navigation */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={currentIdx <= 0}
              onClick={() => {
                if (currentIdx > 0) setSelectedName(filteredNames[currentIdx - 1]);
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-[#172A28] disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-[#C5A059]" />
              <span>الاسم السابق</span>
            </button>
            <button
              disabled={currentIdx < 0 || currentIdx >= filteredNames.length - 1}
              onClick={() => {
                if (currentIdx >= 0 && currentIdx < filteredNames.length - 1) {
                  setSelectedName(filteredNames[currentIdx + 1]);
                }
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-[#172A28] disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              <span>الاسم التالي</span>
              <ChevronLeft className="w-4 h-4 text-[#C5A059]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

