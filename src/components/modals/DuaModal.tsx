import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  X,
  Search,
  Heart,
  Share2,
  Copy,
  Check,
  Sparkles,
  Menu,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DUAS_LIST } from '../../data/duasData';
import { DuaItem } from '../../types';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';

interface DuaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAV_DUAS_STORAGE_KEY = 'moazen_fav_duas_v1';

export const DuaModal: React.FC<DuaModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDua, setSelectedDua] = useState<DuaItem | null>(null);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAV_DUAS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharingCardId, setSharingCardId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(FAV_DUAS_STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  if (!isOpen) return null;

  const modernComprehensiveCategories = [
    'أدعية مبتكرة وجامعة',
    'أدعية تفريج الكرب',
    'أدعية الرزق والبركة',
    'أدعية الشفاء والعافية',
    'أدعية للأهل والذرية',
  ];

  const categories = [
    { id: 'all', label: 'جميع الأدعية', count: DUAS_LIST.length },
    { id: 'favorites', label: 'المفضلة ❤️', count: favorites.length },
    { id: 'أدعية قرآنية', label: 'أدعية قرآنية', count: DUAS_LIST.filter((d) => d.category === 'أدعية قرآنية').length },
    { id: 'أدعية نبوية', label: 'أدعية نبوية', count: DUAS_LIST.filter((d) => d.category === 'أدعية نبوية').length },
    {
      id: 'modern_all',
      label: 'أدعية حديثة وشاملة',
      count: DUAS_LIST.filter((d) => modernComprehensiveCategories.includes(d.category)).length,
    },
    { id: 'أدعية مبتكرة وجامعة', label: 'مناجاة وأدعية جامعة', count: DUAS_LIST.filter((d) => d.category === 'أدعية مبتكرة وجامعة').length },
    { id: 'أدعية تفريج الكرب', label: 'تفريج الكرب والهم', count: DUAS_LIST.filter((d) => d.category === 'أدعية تفريج الكرب').length },
    { id: 'أدعية الرزق والبركة', label: 'الرزق والبركة', count: DUAS_LIST.filter((d) => d.category === 'أدعية الرزق والبركة').length },
    { id: 'أدعية الشفاء والعافية', label: 'الشفاء والعافية', count: DUAS_LIST.filter((d) => d.category === 'أدعية الشفاء والعافية').length },
    { id: 'أدعية للأهل والذرية', label: 'الوالدين والأهل والذرية', count: DUAS_LIST.filter((d) => d.category === 'أدعية للأهل والذرية').length },
  ];

  const filteredDuas = DUAS_LIST.filter((d) => {
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'favorites'
        ? favorites.includes(d.id)
        : selectedCategory === 'modern_all'
        ? modernComprehensiveCategories.includes(d.category)
        : d.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      d.title.includes(searchQuery.trim()) ||
      d.arabic.includes(searchQuery.trim()) ||
      d.category.includes(searchQuery.trim());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyDua = (dua: DuaItem) => {
    const text = `🤲 ${dua.title}\n\n${dua.arabic}\n\n📚 [${dua.source}]\n— تطبيق المؤذن`;
    navigator.clipboard?.writeText(text);
    setCopiedId(dua.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareDua = async (dua: DuaItem) => {
    await shareIslamicText({
      title: dua.title,
      body: dua.arabic,
      source: dua.source,
      extraFooter: `القسم: ${dua.category} — اللهم تقبل منا ومنكم صالح الدعاء`,
    });
  };

  const handleShareDuaImage = async (dua: DuaItem) => {
    setSharingCardId(dua.id);
    try {
      await shareOrDownloadAsImageCard({
        categoryBadge: dua.category,
        title: dua.title,
        mainText: dua.arabic,
        referenceText: dua.source,
        accentColor: '#C5A059',
      });
    } finally {
      setSharingCardId(null);
    }
  };

  const currentDuaIndex = selectedDua
    ? filteredDuas.findIndex((d) => d.id === selectedDua.id)
    : -1;

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F6F2] flex flex-col overflow-x-hidden select-none animate-fadeIn" dir="rtl">
      {/* Clean White Header (No Green) + ☰ Index Button */}
      <div className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-sm border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (selectedDua) {
                  setSelectedDua(null);
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
                {selectedDua ? selectedDua.title : `فهرس الأدعية الشاملة (${DUAS_LIST.length} دعاء)`}
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
                {selectedDua
                  ? `${selectedDua.category} • اضغط للعودة إلى فهرس الأدعية`
                  : 'فهرس رأسي منظم • اضغط على أي دعاء لفتح صفحته المستقلة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedDua && (
              <button
                onClick={() => setSelectedDua(null)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#104B40] text-white text-xs font-bold cursor-pointer"
              >
                <span>الفهرس</span>
              </button>
            )}
            <button
              onClick={() => setIsIndexOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 transition-colors cursor-pointer"
              aria-label="أبواب الأدعية"
            >
              <Menu className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold">الأبواب</span>
            </button>
          </div>
        </div>

        {/* Search & Category Pills only in Vertical Index View */}
        {!selectedDua && (
          <>
            <div className="max-w-2xl mx-auto w-full relative mb-2">
              <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث في فهرس الأدعية (160+ دعاء قرآني ونبوي وشامل)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-8 py-2 text-xs bg-[#F7F6F2] border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059] text-[#172A28]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

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
                <h3 className="font-bold text-base text-[#172A28]">فهرس أبواب الأدعية ({DUAS_LIST.length})</h3>
              </div>
              <button
                onClick={() => setIsIndexOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {categories.map((cat, idx) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedDua(null);
                      setIsIndexOpen(false);
                    }}
                    className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#C5A059]/10 border-[#C5A059] text-[#172A28]'
                        : 'bg-white border-gray-100 hover:bg-gray-50 text-[#172A28]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-[#C5A059] text-white' : 'bg-[#F7F6F2] text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs">{cat.label}</span>
                    </div>
                    <span className="text-xs font-bold text-[#C5A059] bg-[#F7F6F2] px-2.5 py-1 rounded-full">
                      {cat.count} دعاء
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: ORGANIZED VERTICAL INDEX OF DUAS */}
      {!selectedDua ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2.5 pb-24 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold text-[#172A28]">
                الفهرس الرأسي: {categories.find((c) => c.id === selectedCategory)?.label || 'جميع الأدعية'} ({filteredDuas.length})
              </span>
            </div>
            <span className="text-[11px] text-gray-500">اضغط على أي دعاء لفتحه</span>
          </div>

          {filteredDuas.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-xs border border-gray-100">
              لا توجد أدعية مطابقة للبحث في هذا القسم
            </div>
          ) : (
            filteredDuas.map((dua, idx) => {
              const isFav = favorites.includes(dua.id);
              return (
                <div
                  key={dua.id}
                  onClick={() => setSelectedDua(dua)}
                  className="w-full text-right bg-white hover:bg-[#FAF9F5] p-3.5 rounded-2xl border border-gray-100 hover:border-[#C5A059]/60 shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#104B40] text-[#C5A059] font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-[#172A28] group-hover:text-[#104B40] transition-colors">
                          {dua.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-[#9A7732]">
                          {dua.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-amiri line-clamp-1 mt-0.5">
                        {dua.arabic}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(dua.id);
                      }}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isFav
                          ? 'bg-red-50 text-red-500'
                          : 'bg-[#F7F6F2] text-gray-400 hover:text-red-500'
                      }`}
                      title="المفضلة"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                    </button>
                    <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VIEW 2: INDEPENDENT DEDICATED DETAIL PAGE FOR SELECTED DUA */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-24 max-w-2xl mx-auto w-full animate-fadeIn">
          {/* Top Back Bar */}
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center justify-between">
            <button
              onClick={() => setSelectedDua(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] text-xs font-bold cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة إلى فهرس الأدعية ({filteredDuas.length})</span>
            </button>
            <span className="text-xs font-bold text-[#9A7732] bg-[#C5A059]/15 px-3 py-1 rounded-full">
              {selectedDua.category}
            </span>
          </div>

          {/* Main Dua Card */}
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] text-gray-400 font-bold block">
                  الدعاء رقم {currentDuaIndex + 1} من {filteredDuas.length}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#172A28] font-cairo mt-0.5">
                  {selectedDua.title}
                </h3>
              </div>

              <button
                onClick={() => toggleFavorite(selectedDua.id)}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                  favorites.includes(selectedDua.id)
                    ? 'bg-red-50 text-red-500'
                    : 'bg-[#F7F6F2] text-gray-400 hover:text-red-500'
                }`}
                title="إضافة للمفضلة"
              >
                <Heart className={`w-5 h-5 ${favorites.includes(selectedDua.id) ? 'fill-red-500' : ''}`} />
              </button>
            </div>

            <div className="bg-[#FAF9F5] p-5 sm:p-6 rounded-2xl border border-[#C5A059]/30 shadow-inner">
              <p className="text-xl sm:text-2xl font-bold font-amiri text-[#172A28] leading-[2.2] text-center break-words">
                « {selectedDua.arabic} »
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 bg-[#F7F6F2] px-4 py-2.5 rounded-xl">
              <span>
                <strong className="text-[#104B40]">المصدر:</strong> {selectedDua.source}
              </span>
              <span className="text-[#C5A059] font-bold">اللهم آمين</span>
            </div>

            {/* Action Buttons: 5-Offline-Background Image Share, Text Share, Copy */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={() => handleShareDuaImage(selectedDua)}
                disabled={sharingCardId === selectedDua.id}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#C5A059] hover:bg-[#B08D46] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <ImageIcon className="w-4 h-4" />
                <span>مشاركة كبطاقة (5 خلفيات)</span>
              </button>

              <button
                onClick={() => handleShareDua(selectedDua)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة النص</span>
              </button>

              <button
                onClick={() => handleCopyDua(selectedDua)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 text-xs font-bold transition-all cursor-pointer"
              >
                {copiedId === selectedDua.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ الدعاء</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Previous / Next Navigation between Duas */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={currentDuaIndex <= 0}
              onClick={() => {
                if (currentDuaIndex > 0) {
                  setSelectedDua(filteredDuas[currentDuaIndex - 1]);
                }
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-[#172A28] disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4 text-[#C5A059]" />
              <span>الدعاء السابق</span>
            </button>

            <button
              disabled={currentDuaIndex < 0 || currentDuaIndex >= filteredDuas.length - 1}
              onClick={() => {
                if (currentDuaIndex >= 0 && currentDuaIndex < filteredDuas.length - 1) {
                  setSelectedDua(filteredDuas[currentDuaIndex + 1]);
                }
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-[#172A28] disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-all"
            >
              <span>الدعاء التالي</span>
              <ChevronLeft className="w-4 h-4 text-[#C5A059]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


