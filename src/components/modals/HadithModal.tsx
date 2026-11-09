import React, { useState } from 'react';
import {
  X,
  Search,
  BookOpen,
  Share2,
  Copy,
  Image as ImageIcon,
  Check,
  BookMarked,
  ChevronRight,
  ChevronLeft,
  Menu,
  ArrowRight,
} from 'lucide-react';
import { HADITH_LIST, HADITH_COLLECTIONS, ExpandedHadithItem } from '../../data/hadithData';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';
import { userStatsTracker } from '../../utils/userStatsTracker';

interface HadithModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHadithId?: number;
}

export const HadithModal: React.FC<HadithModalProps> = ({
  isOpen,
  onClose,
  selectedHadithId = 1,
}) => {
  const [viewMode, setViewMode] = useState<'index' | 'detail'>('index');
  const [activeHadithId, setActiveHadithId] = useState<number>(selectedHadithId);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [sharedId, setSharedId] = useState<number | null>(null);
  const [isIndexOpen, setIsIndexOpen] = useState<boolean>(false);

  const filteredHadiths = HADITH_LIST.filter((h) => {
    const matchesCol = selectedCollection === 'all' || h.collection === selectedCollection;
    const matchesQuery =
      !searchQuery.trim() ||
      h.title.includes(searchQuery) ||
      h.hadith.includes(searchQuery) ||
      h.narrator.includes(searchQuery) ||
      h.category.includes(searchQuery);
    return matchesCol && matchesQuery;
  });

  const activeHadith: ExpandedHadithItem =
    HADITH_LIST.find((h) => h.id === activeHadithId) ||
    filteredHadiths[0] ||
    HADITH_LIST[0];

  React.useEffect(() => {
    if (isOpen && viewMode === 'detail' && activeHadith?.id) {
      userStatsTracker.recordHadithRead(activeHadith.id);
    }
  }, [isOpen, viewMode, activeHadith?.id]);

  if (!isOpen) return null;

  const currentIdx = filteredHadiths.findIndex((h) => h.id === activeHadith.id);

  const getHadithGrade = (hadith: ExpandedHadithItem) => {
    if (hadith.grade) return hadith.grade;
    if (hadith.source.includes('متفق عليه')) return 'صحيح (متفق عليه)';
    if (hadith.source.includes('البخاري')) return 'صحيح (رواه البخاري)';
    if (hadith.source.includes('مسلم')) return 'صحيح (رواه مسلم)';
    return 'حديث صحيح';
  };

  const handleCopyHadith = (hadith: ExpandedHadithItem) => {
    const grade = getHadithGrade(hadith);
    const text = `${hadith.hadith}\n\n[الراوي: ${hadith.narrator} | المصدر: ${hadith.source} | الدرجة: ${grade}]\n\nمن تطبيق المؤذن الإسلامي`;
    navigator.clipboard.writeText(text);
    setCopiedId(hadith.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareHadith = async (hadith: ExpandedHadithItem) => {
    const grade = getHadithGrade(hadith);
    await shareIslamicText({
      title: `حديث نبوي: ${hadith.title}`,
      body: hadith.hadith,
      source: `الراوي: ${hadith.narrator} | المصدر: ${hadith.source} | الدرجة: ${grade}`,
      footer: 'تطبيق المؤذن — موسوعة الحديث النبوي الشريف',
    });
    setSharedId(hadith.id);
    setTimeout(() => setSharedId(null), 2000);
  };

  const handleShareHadithImage = async (hadith: ExpandedHadithItem) => {
    const grade = getHadithGrade(hadith);
    await shareOrDownloadAsImageCard({
      categoryBadge: `حديث نبوي شريف • ${hadith.collectionName}`,
      title: hadith.title,
      body: hadith.hadith,
      source: `الراوي: ${hadith.narrator} • ${hadith.source} (${grade})`,
      footer: 'تطبيق المؤذن الإسلامي',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-hidden select-none animate-fadeIn"
      dir="rtl"
    >
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#FAF9F5] relative">
        {/* Clean White Header */}
        <div className="bg-white text-[#172A28] p-3.5 sm:p-4 flex items-center justify-between border-b border-gray-100 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (viewMode === 'detail') {
                  setViewMode('index');
                } else {
                  onClose();
                }
              }}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-[#172A28] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="رجوع"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="min-w-0 text-right">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#104B40] shrink-0" />
                <h2 className="text-sm sm:text-base font-black font-quran text-[#172A28] truncate">
                  {viewMode === 'detail'
                    ? activeHadith.title
                    : `فهرس موسوعة الحديث الشريف (${HADITH_LIST.length} حديثاً)`}
                </h2>
              </div>
              <p className="text-[11px] text-gray-500 truncate">
                {viewMode === 'detail'
                  ? `${activeHadith.collectionName} • الراوي: ${activeHadith.narrator}`
                  : 'اختر أي حديث من الفهرس لفتح صفحته المستقلة مع الشرح والدرجة'}
              </p>
            </div>
          </div>

          {viewMode === 'detail' ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setViewMode('index')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#104B40] hover:bg-[#0c3830] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Menu className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>الفهرس</span>
              </button>
              <button
                onClick={() => setIsIndexOpen(!isIndexOpen)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#172A28] transition-colors cursor-pointer"
                title="قائمة سريعة"
              >
                <Menu className="w-4 h-4 text-[#104B40]" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ebf5f1] text-[#104B40] shrink-0">
              {filteredHadiths.length} حديثاً
            </span>
          )}
        </div>

        {/* Collapsible ☰ Index Drawer (Appears ONLY when clicked inside detail mode) */}
        {isIndexOpen && (
          <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn">
            <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-hidden border-r border-gray-100">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <h3 className="text-sm font-black font-quran text-[#172A28]">
                  ☰ فهرس كتب وأبواب الأحاديث ({HADITH_LIST.length} حديثاً)
                </h3>
                <button
                  onClick={() => setIsIndexOpen(false)}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {filteredHadiths.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setActiveHadithId(h.id);
                      setViewMode('detail');
                      setIsIndexOpen(false);
                    }}
                    className={`w-full text-right p-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      activeHadith.id === h.id
                        ? 'bg-emerald-50/60 border-[#104B40] text-[#172A28]'
                        : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="block font-black text-[#172A28] truncate">{h.title}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold shrink-0">
                        {getHadithGrade(h)}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-normal block mt-1">
                      {h.collectionName} • الراوي: {h.narrator}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MAIN VIEW: ORGANIZED VERTICAL INDEX ==================== */}
        {viewMode === 'index' && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 pb-16">
            {/* Search & Collection Filter Bar */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث في متن الحديث أو الراوي أو الموضوع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-8 py-2 text-xs bg-[#F7F6F2] border border-gray-200 rounded-xl focus:outline-none focus:border-[#104B40]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {HADITH_COLLECTIONS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setSelectedCollection(col.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCollection === col.id
                        ? 'bg-[#104B40] text-white shadow-xs'
                        : 'bg-[#F7F6F2] text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Organized Vertical Index of Hadiths */}
            <div className="space-y-2.5">
              {filteredHadiths.map((h, idx) => (
                <div
                  key={h.id}
                  onClick={() => {
                    setActiveHadithId(h.id);
                    setViewMode('detail');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveHadithId(h.id);
                      setViewMode('detail');
                    }
                  }}
                  className="w-full bg-white hover:bg-[#FAF9F5] rounded-2xl p-4 border border-gray-100 hover:border-[#C5A059]/60 shadow-xs transition-all text-right cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-[#ebf5f1] text-[#104B40] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#104B40]/15">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C5A059]/15 text-[#9A7732]">
                          {h.collectionName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                          {getHadithGrade(h)}
                        </span>
                        <span className="text-[10px] text-gray-400">• {h.category}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#172A28] mb-1 truncate">
                        {h.title}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2 font-amiri leading-relaxed">
                        {h.hadith}
                      </p>
                      <span className="text-[10.5px] text-[#104B40] font-bold block mt-1.5">
                        الراوي: {h.narrator} • {h.source}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareHadithImage(h);
                      }}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#9A7732] border border-[#C5A059]/30 transition-colors cursor-pointer"
                      title="مشاركة بـ 5 خلفيات إسلامية"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-[#F7F6F2] flex items-center justify-center text-[#104B40]">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== INDEPENDENT DETAIL PAGE FOR SELECTED HADITH ==================== */}
        {viewMode === 'detail' && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 pb-16">
            {/* Quick Collection Selector Card */}
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-[#172A28]">
                  {activeHadith.collectionName}
                </span>
                <span className="text-[10.5px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                  الدرجة: {getHadithGrade(activeHadith)}
                </span>
              </div>

              <button
                onClick={() => setViewMode('index')}
                className="text-xs font-bold text-[#104B40] bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للفهرس ({filteredHadiths.length})</span>
              </button>
            </div>

            {/* Hadith Main White Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-right">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs bg-gray-100 text-[#104B40] px-3 py-1 rounded-full font-bold">
                  {activeHadith.category}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleShareHadith(activeHadith)}
                    className="flex items-center gap-1 text-xs bg-[#104B40] text-white px-3 py-1.5 rounded-full hover:bg-[#0c3830] cursor-pointer font-bold shadow-xs"
                  >
                    {sharedId === activeHadith.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>تمت المشاركة</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>مشاركة الحديث</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleShareHadithImage(activeHadith)}
                    className="flex items-center gap-1 text-xs bg-amber-50 border border-[#C5A059]/40 px-2.5 py-1.5 rounded-full hover:bg-amber-100 text-[#104B40] font-bold cursor-pointer"
                    title="مشاركة أو حفظ الحديث كبطاقة مصورة بـ 5 خلفيات"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>مشاركة بـ 5 خلفيات</span>
                  </button>

                  <button
                    onClick={() => handleCopyHadith(activeHadith)}
                    className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-full hover:bg-gray-100 text-gray-700 cursor-pointer"
                  >
                    {copiedId === activeHadith.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-black text-[#172A28] font-quran">
                {activeHadith.title}
              </h3>

              <div className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-100">
                <p className="font-quran text-base sm:text-lg leading-loose text-[#172A28] text-right select-text font-bold">
                  {activeHadith.hadith}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-200/70 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-700 font-bold">
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px]">المصدر والتخريج</span>
                    <span className="text-[#104B40] font-black">{activeHadith.source}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px]">الراوي</span>
                    <span className="text-[#172A28] font-black">{activeHadith.narrator}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px]">درجة صحة الحديث</span>
                    <span className="text-emerald-700 font-black">{getHadithGrade(activeHadith)}</span>
                  </div>
                </div>
              </div>

              {/* Next / Previous Hadith Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentIdx <= 0}
                  onClick={() => {
                    const prev = filteredHadiths[currentIdx - 1];
                    if (prev) setActiveHadithId(prev.id);
                  }}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-xs font-bold text-[#172A28] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الحديث السابق</span>
                </button>

                <span className="text-xs text-gray-500 font-bold">
                  {currentIdx + 1} / {filteredHadiths.length}
                </span>

                <button
                  disabled={currentIdx >= filteredHadiths.length - 1}
                  onClick={() => {
                    const next = filteredHadiths[currentIdx + 1];
                    if (next) setActiveHadithId(next.id);
                  }}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#104B40] hover:bg-[#0c3830] disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                >
                  <span>الحديث التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sharh / Explanation White Card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-right">
              <h4 className="text-xs font-black text-[#172A28] mb-2 flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-[#104B40]" />
                <span>شرح الحديث وفوائده التربوية</span>
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                {activeHadith.sharh}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

