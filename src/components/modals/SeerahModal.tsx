import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Search,
  X,
  CheckCircle2,
  Sparkles,
  Share2,
  Copy,
  Check,
  Image as ImageIcon,
  ChevronLeft,
  Award,
} from 'lucide-react';
import { SEERAH_EXPANDED_DATA, SeerahSectionItem } from '../../data/seerahExpandedData';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';

interface SeerahModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryTab =
  | 'all'
  | 'seerah'
  | 'battles'
  | 'wives'
  | 'children'
  | 'relatives'
  | 'sahaba'
  | 'sahabiyat';

export function SeerahModal({ isOpen, onClose }: SeerahModalProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [selectedItem, setSelectedItem] = useState<SeerahSectionItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFullLineageOnIndex, setShowFullLineageOnIndex] = useState<boolean>(false);

  const filteredItems = useMemo(() => {
    return SEERAH_EXPANDED_DATA.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!searchQuery.trim()) return matchesCategory;
      const q = searchQuery.trim();
      return (
        matchesCategory &&
        (item.title.includes(q) ||
          item.subtitle.includes(q) ||
          item.summary.includes(q) ||
          item.details.some((d) => d.includes(q)))
      );
    });
  }, [activeCategory, searchQuery]);

  const lineageItem = useMemo(
    () => SEERAH_EXPANDED_DATA.find((i) => i.id === 'seerah-lineage') || SEERAH_EXPANDED_DATA[0],
    []
  );

  if (!isOpen) return null;

  const categories: { id: CategoryTab; label: string; count: number }[] = [
    { id: 'all', label: 'الكل', count: SEERAH_EXPANDED_DATA.length },
    {
      id: 'seerah',
      label: 'فصول السيرة ﷺ',
      count: SEERAH_EXPANDED_DATA.filter((i) => i.category === 'seerah').length,
    },
    {
      id: 'battles',
      label: 'الغزوات',
      count: SEERAH_EXPANDED_DATA.filter((i) => i.category === 'battles').length,
    },
    {
      id: 'wives',
      label: 'زوجات النبي ﷺ',
      count: SEERAH_EXPANDED_DATA.filter((i) => i.category === 'wives').length,
    },
    {
      id: 'children',
      label: 'الأبناء والبنات',
      count: SEERAH_EXPANDED_DATA.filter((i) => i.category === 'children').length,
    },
    {
      id: 'relatives',
      label: 'الأقارب والعائلة',
      count: SEERAH_EXPANDED_DATA.filter((i) => i.category === 'relatives').length,
    },
    {
      id: 'sahaba',
      label: 'الصحابة',
      count: SEERAH_EXPANDED_DATA.filter((i) => i.category === 'sahaba').length,
    },
    {
      id: 'sahabiyat',
      label: 'الصحابيات',
      count: SEERAH_EXPANDED_DATA.filter((i) => i.category === 'sahabiyat').length,
    },
  ];

  const handleCopy = (item: SeerahSectionItem) => {
    const text = `${item.title}\n${item.subtitle}\n\n${item.summary}\n\n${item.details.join('\n• ')}\n\nمن تطبيق المؤذن`;
    navigator.clipboard?.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (item: SeerahSectionItem) => {
    await shareIslamicText({
      title: item.title,
      body: `${item.summary}\n\n${item.details.join('\n• ')}`,
      source: `${item.categoryLabel} • ${item.eraOrTitle}`,
      extraFooter: item.lessons[0] ? `العبرة: ${item.lessons[0]}` : undefined,
    });
  };

  const handleShareImage = async (item: SeerahSectionItem) => {
    await shareOrDownloadAsImageCard({
      categoryBadge: item.categoryLabel,
      title: item.title,
      mainText: item.summary,
      referenceText: item.subtitle,
      accentColor: '#C5A059',
    });
  };

  // ==================== INDEPENDENT DETAIL PAGE ====================
  if (selectedItem) {
    const currentIndex = SEERAH_EXPANDED_DATA.findIndex((i) => i.id === selectedItem.id);
    const prevItem = currentIndex > 0 ? SEERAH_EXPANDED_DATA[currentIndex - 1] : null;
    const nextItem =
      currentIndex < SEERAH_EXPANDED_DATA.length - 1
        ? SEERAH_EXPANDED_DATA[currentIndex + 1]
        : null;

    return (
      <div
        className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-x-hidden animate-fadeIn"
        dir="rtl"
      >
        {/* Independent Detail Page Header */}
        <div className="bg-white text-[#172A28] px-4 pt-5 pb-3.5 shadow-xs border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للفهرس</span>
              </button>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#C5A059] block">
                  {selectedItem.categoryLabel} • {selectedItem.eraOrTitle}
                </span>
                <h2 className="text-sm sm:text-base font-bold font-cairo text-[#172A28] truncate">
                  {selectedItem.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleShareImage(selectedItem)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#ebf5f1] hover:bg-[#104B40] text-[#104B40] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                title="مشاركة بـ 5 خلفيات إسلامية دون إنترنت"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">بطاقة مصورة</span>
              </button>
              <button
                onClick={() => handleShare(selectedItem)}
                className="p-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] transition-colors cursor-pointer"
                title="مشاركة النص"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Independent Detail Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-20 max-w-2xl mx-auto w-full">
          {/* Title & Summary White Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#C5A059]/15 text-[#9A7732] text-xs font-bold">
                {selectedItem.categoryLabel} • {selectedItem.eraOrTitle}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy(selectedItem)}
                  className="p-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                  title="نسخ"
                >
                  {copiedId === selectedItem.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleShareImage(selectedItem)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#9A7732] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>مشاركة بـ 5 خلفيات</span>
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold font-amiri text-[#172A28] mb-1.5 leading-relaxed">
              {selectedItem.title}
            </h3>
            <p className="text-xs font-bold text-[#C5A059] mb-3">{selectedItem.subtitle}</p>
            <p className="text-sm text-gray-700 leading-loose bg-[#FAF9F5] p-3.5 rounded-xl border border-gray-100">
              {selectedItem.summary}
            </p>
          </div>

          {/* Detailed Narrative White Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <BookOpen className="w-4 h-4 text-[#C5A059]" />
              <h4 className="font-bold text-sm text-[#172A28]">التفاصيل والأحداث الكاملة</h4>
            </div>
            <div className="space-y-3">
              {selectedItem.details.map((paragraph, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#C5A059]/15 text-[#9A7732] text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-loose flex-1">{paragraph}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Stances White Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <h4 className="font-bold text-sm text-[#172A28]">مواقف خالدة ومآثر عظيمة</h4>
            </div>
            <div className="space-y-2.5">
              {selectedItem.keyStances.map((stance, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#FAF9F5] border border-gray-100 text-sm text-gray-800 leading-relaxed"
                >
                  • {stance}
                </div>
              ))}
            </div>
          </div>

          {/* Lessons Learned White Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <h4 className="font-bold text-sm text-[#172A28]">الدروس والعبر المستفادة</h4>
            </div>
            <div className="space-y-2">
              {selectedItem.lessons.map((lesson, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed"
                >
                  <span className="text-[#C5A059] font-bold">✦</span>
                  <span>{lesson}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next / Previous Navigation White Card */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex items-center justify-between gap-3">
            <button
              onClick={() => prevItem && setSelectedItem(prevItem)}
              disabled={!prevItem}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 disabled:opacity-40 text-xs font-bold text-[#172A28] transition-colors text-right truncate cursor-pointer"
            >
              السابق: {prevItem ? prevItem.title : 'البداية'}
            </button>
            <button
              onClick={() => nextItem && setSelectedItem(nextItem)}
              disabled={!nextItem}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] disabled:opacity-40 text-xs font-bold text-white transition-colors text-left truncate cursor-pointer"
            >
              التالي: {nextItem ? nextItem.title : 'النهاية'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN PAGE: VERTICAL INDEX + PROPHET'S FULL LINEAGE CARD ====================
  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-x-hidden animate-fadeIn"
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-xs border-b border-gray-100 shrink-0">
        <div className="max-w-2xl mx-auto w-full space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
                aria-label="رجوع"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">
                  فهرس موسوعة السيرة النبوية الشريفة
                </h2>
                <p className="text-[11px] text-gray-500">
                  النسب الشريف لآدم • الغزوات • جميع الزوجات والأبناء والأقارب • اضغط لفتح الصفحة المستقلة
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ebf5f1] text-[#104B40]">
              {filteredItems.length} موضوع
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في السيرة، الغزوات، الزوجات، الأبناء والبنات، الأقارب..."
              className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl py-2 pr-9 pl-8 text-xs text-[#172A28] placeholder-gray-400 focus:outline-none focus:border-[#C5A059]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#104B40] text-white border-[#104B40] shadow-xs'
                    : 'bg-white text-[#172A28] border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Scrollable Vertical Index */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 pb-20 max-w-2xl mx-auto w-full">
        {/* Prominent Identification Card of the Prophet's Full Name & Lineage up to Adam (AS) */}
        <div className="bg-gradient-to-br from-[#104B40] via-[#0B3D35] to-[#072923] rounded-2xl p-4 text-white shadow-md border border-[#C5A059]/40 relative overflow-hidden">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center text-[#fde68a] shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#fde68a] block">
                  بطاقة تعريفية شاملة • سيد ولد آدم ﷺ
                </span>
                <h3 className="text-sm sm:text-base font-bold font-cairo text-white">
                  اسم ونسب النبي محمد ﷺ الكامل إلى آدم عليه السلام
                </h3>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(lineageItem)}
              className="px-2.5 py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#b58f47] text-emerald-950 font-black text-[11px] transition-colors shrink-0 cursor-pointer"
            >
              صفحة النسب الكاملة
            </button>
          </div>

          <div className="bg-black/25 rounded-xl p-3 border border-white/10 text-right space-y-1.5">
            <p className="text-xs sm:text-sm font-quran text-amber-100 leading-relaxed">
              <strong className="text-[#fde68a]">من محمد ﷺ إلى عدنان:</strong> هُوَ أَبُو القَاسِمِ مُحَمَّدٌ ﷺ بنُ عَبْدِ اللهِ بنِ عَبْدِ المُطَّلِبِ بنِ هَاشِمٍ بنِ عَبْدِ مَنَافٍ بنِ قُصَيٍّ بنِ كِلَابِ بنِ مُرَّةَ بنِ كَعْبِ بنِ لُؤَيِّ بنِ غَالِبِ بنِ فِهْرٍ (قُرَيْش) بنِ مَالِكِ بنِ النَّضْرِ بنِ كِنَانَةَ بنِ خُزَيْمَةَ بنِ مُدْرِكَةَ بنِ إِلْيَاسَ بنِ مُضَرَ بنِ نِزَارِ بنِ مَعَدِّ بنِ عَدْنَانَ.
            </p>
            {showFullLineageOnIndex ? (
              <>
                <p className="text-xs sm:text-sm font-quran text-emerald-100 leading-relaxed pt-1 border-t border-white/10">
                  <strong className="text-[#fde68a]">من عدنان إلى إبراهيم الخليل:</strong> بنِ أُدَدَ بنِ الهَمَيْسَعِ بنِ سَلَامَانَ بنِ عَوْصِ بنِ بُوزِ بنِ قَمْوَالِ بنِ أُبَيِّ بنِ عَوَّامِ بنِ نَاشِدِ بنِ حَزَا بنِ بَلْدَاسِ بنِ يَدْلَافِ بنِ طَابِخِ بنِ جَاحِمِ بنِ نَاحِشِ بنِ مَاخِي بنِ عَيْفِي بنِ عَبْقَرِ بنِ عُبَيْدِ بنِ الدُّعَا بنِ حَمْدَانَ بنِ سَنْبَرِ بنِ يَثْرِبِي بنِ يَحْزُنَ بنِ يَلْحَنَ بنِ أَرْعَوَى بنِ عَيْضِ بنِ دَيْشَانَ بنِ عَيْصَرِ بنِ أَفْنَادِ بنِ أَيْهَامِ بنِ مُقْصِرِ بنِ نَاحِثِ بنِ زَارِحِ بنِ سُمَيِّ بنِ مُزِّي بنِ عَوْصَةَ بنِ عَرَامِ بنِ قَيْدَارَ بنِ إِسْمَاعِيلَ الذَّبِيحِ بنِ إِبْرَاهِيمَ خَلِيلِ الرَّحْمَنِ عليهما السلام.
                </p>
                <p className="text-xs sm:text-sm font-quran text-amber-100 leading-relaxed pt-1 border-t border-white/10">
                  <strong className="text-[#fde68a]">من إبراهيم إلى آدم عليه السلام:</strong> بنِ تَارَحَ بنِ نَاحُورَ بنِ سَارُوغَ بنِ رَعُو بنِ فَالِغَ بنِ عَابِرَ بنِ شَالِخَ بنِ أَرْفَخْشَذَ بنِ سَامِ بنِ نُوحٍ بنِ لَامَكَ بنِ مَتُّوشَلَخَ بنِ أَخْنُوخَ (إِدْرِيسَ) بنِ يَرْدَ بنِ مَهْلَائِيلَ بنِ قَيْنَانَ بنِ أَنُوشَ بنِ شِيثَ بنِ آدَمَ أَبِي البَشَرِ عَلَيْهِ السَّلَامُ.
                </p>
              </>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 mt-2.5">
            <button
              onClick={() => setShowFullLineageOnIndex(!showFullLineageOnIndex)}
              className="text-[11px] font-bold text-[#fde68a] hover:underline cursor-pointer"
            >
              {showFullLineageOnIndex
                ? 'طي سلسلة النسب إلى آدم عليه السلام ▲'
                : 'عرض سلسلة النسب الكاملة إلى آدم عليه السلام ▼'}
            </button>
            <button
              onClick={() => handleShareImage(lineageItem)}
              className="flex items-center gap-1 text-[11px] font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg text-white transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3 h-3" />
              <span>مشاركة بطاقة النسب</span>
            </button>
          </div>
        </div>

        {/* Organized Vertical Index (فهرس رأسي منظم: عنصر تحت الآخر) */}
        <div className="space-y-2">
          {filteredItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="w-full text-right bg-white hover:bg-[#FAF9F5] rounded-2xl p-3.5 border border-gray-100 hover:border-[#C5A059]/60 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="w-8 h-8 rounded-xl bg-[#ebf5f1] text-[#104B40] group-hover:bg-[#104B40] group-hover:text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C5A059]/15 text-[#9A7732]">
                      {item.categoryLabel}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400">
                      {item.eraOrTitle}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm font-cairo text-[#172A28] leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#F7F6F2] group-hover:bg-[#C5A059]/20 flex items-center justify-center text-gray-400 group-hover:text-[#104B40] shrink-0 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
