import React, { useState } from 'react';
import { X, Calculator, Heart, Calendar, Video, BookOpen, Search, Sparkles, ChevronRight, Bookmark } from 'lucide-react';
import { NAMES_OF_ALLAH } from '../../data/namesOfAllahData';
import { ISLAMIC_EVENTS } from '../../data/mosquesData';
import {
  QURAN_TAFSEER_AND_ASBAB,
  RIGHTEOUS_STORIES,
  RAMADAN_FIQH_ENCYCLOPEDIA,
  getSavedFavorites,
  toggleSavedFavorite
} from '../../data/islamicEncyclopediaData';
import { PROPHETS_STORIES } from '../../data/prophetsData';

interface MoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubTab?: 'menu' | 'zakat' | 'names' | 'khatma' | 'events' | 'live' | 'encyclopedia';
  onOpenHajj?: () => void;
}

export const MoreModal: React.FC<MoreModalProps> = ({
  isOpen,
  onClose,
  defaultSubTab = 'menu',
  onOpenHajj,
}) => {
  const [subTab, setSubTab] = useState<'menu' | 'zakat' | 'names' | 'khatma' | 'events' | 'live' | 'sunan' | 'encyclopedia'>(defaultSubTab as any);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalCategory, setGlobalCategory] = useState<'all' | 'tafseer' | 'prophets' | 'righteous' | 'ramadan' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>(() => getSavedFavorites());

  // Zakat Calculator Comprehensive State
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [gold24Grams, setGold24Grams] = useState<number>(0);
  const [gold21Grams, setGold21Grams] = useState<number>(0);
  const [gold18Grams, setGold18Grams] = useState<number>(0);
  const [goldGramPrice, setGoldGramPrice] = useState<number>(3800);
  const [silverGrams, setSilverGrams] = useState<number>(0);
  const [silverGramPrice, setSilverGramPrice] = useState<number>(45);
  const [tradeMerchandise, setTradeMerchandise] = useState<number>(0);
  const [debtsOwed, setDebtsOwed] = useState<number>(0);
  const [nisabStandard, setNisabStandard] = useState<'gold' | 'silver'>('gold');
  
  // Zakat al-Fitr State
  const [fitrMembers, setFitrMembers] = useState<number>(1);
  const [fitrAmountPerPerson, setFitrAmountPerPerson] = useState<number>(35);

  // 99 Names Search
  const [namesSearch, setNamesSearch] = useState('');

  // Khatma Planner State
  const [khatmaDays, setKhatmaDays] = useState<number>(30);

  if (!isOpen) return null;

  // Comprehensive Zakat Calculations (Fiqh Compliant)
  const equivalentGold24Grams = gold24Grams + gold21Grams * (21 / 24) + gold18Grams * (18 / 24);
  const totalGoldValue = equivalentGold24Grams * goldGramPrice;
  const totalSilverValue = silverGrams * silverGramPrice;
  const grossZakatableWealth = cashAmount + totalGoldValue + totalSilverValue + tradeMerchandise;
  const netZakatableWealth = Math.max(0, grossZakatableWealth - debtsOwed);
  
  const nisabThreshold = nisabStandard === 'gold' ? 85 * goldGramPrice : 595 * silverGramPrice;
  const isNisabReached = netZakatableWealth >= nisabThreshold;
  const zakatDue = isNisabReached ? netZakatableWealth * 0.025 : 0;
  const fitrTotalDue = Math.max(0, fitrMembers) * Math.max(0, fitrAmountPerPerson);

  // Khatma Math (Quran has 604 pages, 30 Juz)
  const pagesPerDay = Math.ceil(604 / khatmaDays);
  const pagesPerPrayer = Math.ceil(pagesPerDay / 5);

  const unifiedEncyclopediaItems = [
    ...QURAN_TAFSEER_AND_ASBAB.map((t) => ({
      id: `tafseer:${t.surahNumber}`,
      category: 'tafseer' as const,
      categoryLabel: 'تفسير وأسباب نزول وتدبر',
      title: `تفسير وتدبر ${t.surahName}`,
      subtitle: t.ayahRange,
      body: `${t.asbabAlNuzul}\n\nالتفسير: ${t.tafseer}`,
      source: t.source,
      relatedTopics: ['القرآن الكريم', 'أسباب النزول', 'التدبر'],
    })),
    ...PROPHETS_STORIES.map((p) => ({
      id: `prophet:${p.id}`,
      category: 'prophets' as const,
      categoryLabel: 'قصص الأنبياء والمرسلين',
      title: `${p.name} (${p.title})`,
      subtitle: `${p.location} • ${p.era}`,
      body: p.summary,
      source: `القرآن الكريم [${p.quranSurah}] • قصص الأنبياء لابن كثير`,
      relatedTopics: ['الأنبياء', p.location, 'العقيدة والتوحيد'],
    })),
    ...RIGHTEOUS_STORIES.map((r) => ({
      id: `righteous:${r.id}`,
      category: 'righteous' as const,
      categoryLabel: 'قصص الصالحين والتابعين',
      title: `${r.name} (${r.title})`,
      subtitle: r.era,
      body: r.summary,
      source: r.source,
      relatedTopics: r.relatedTopics,
    })),
    ...RAMADAN_FIQH_ENCYCLOPEDIA.map((f) => ({
      id: `ramadan:${f.id}`,
      category: 'ramadan' as const,
      categoryLabel: 'فقه الصيام ورمضان وليلة القدر',
      title: f.title,
      subtitle: f.summary,
      body: f.details.join(' • '),
      source: f.source,
      relatedTopics: f.relatedTopics,
    })),
  ];

  const filteredEncyclopedia = unifiedEncyclopediaItems.filter((item) => {
    if (globalCategory === 'favorites' && !favorites.includes(item.id)) return false;
    if (globalCategory !== 'all' && globalCategory !== 'favorites' && item.category !== globalCategory) {
      return false;
    }
    if (!globalSearch.trim()) return true;
    const q = globalSearch.trim();
    return (
      item.title.includes(q) ||
      item.subtitle.includes(q) ||
      item.body.includes(q) ||
      item.relatedTopics.some((t) => t.includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#fcfbf7] flex flex-col overflow-hidden select-none animate-fadeIn">
      <div className="w-full h-full max-w-md mx-auto flex flex-col overflow-hidden bg-[#fcfbf7] relative">
        {/* Clean White Header (No Green) */}
        <div className="bg-white text-[#172A28] px-4 pt-5 pb-3.5 flex items-center justify-between shadow-sm border-b border-gray-100 shrink-0" dir="rtl">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
              aria-label="رجوع"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold font-cairo text-[#172A28]">
              {subTab === 'menu' && 'خدمات ومميزات إسلامية'}
              {subTab === 'encyclopedia' && 'البحث الشامل والمفضلة والمصادر'}
              {subTab === 'zakat' && 'حاسبة الزكاة الشرعية'}
              {subTab === 'names' && 'أسماء الله الحسنى (99)'}
              {subTab === 'khatma' && 'مخطط ختم القرآن الكريم'}
              {subTab === 'events' && 'التقويم والمناسبات الإسلامية'}
              {subTab === 'live' && 'بث مباشر من الحرمين الشريفين'}
              {subTab === 'sunan' && 'السنن النبوية اليومية'}
            </h2>
          </div>

          {subTab !== 'menu' ? (
            <button
              onClick={() => setSubTab('menu')}
              className="text-xs font-bold bg-[#F7F6F2] text-[#172A28] px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              العودة للخدمات
            </button>
          ) : (
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {subTab === 'menu' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'encyclopedia' as const,
                  title: 'البحث الشامل والمفضلة',
                  desc: 'تفسير، قصص الصالحين، الفقه والمفضلة',
                  icon: Bookmark,
                  color: 'from-[#104B40] to-[#0B382F]',
                },
                {
                  id: 'zakat' as const,
                  title: 'حاسبة الزكاة',
                  desc: 'حساب زكاة المال والذهب بدقة',
                  icon: Calculator,
                  color: 'from-amber-600 to-amber-700',
                },
                {
                  id: 'names' as const,
                  title: 'أسماء الله الحسنى',
                  desc: '99 اسماً مع المعاني العظيمة',
                  icon: Heart,
                  color: 'from-emerald-700 to-emerald-800',
                },
                {
                  id: 'khatma' as const,
                  title: 'مخطط ختمة القرآن',
                  desc: 'جدول القراءة لختم المصحف',
                  icon: BookOpen,
                  color: 'from-teal-700 to-teal-800',
                },
                {
                  id: 'events' as const,
                  title: 'المناسبات الإسلامية',
                  desc: 'التقويم الهجري والذكريات العطرة',
                  icon: Calendar,
                  color: 'from-cyan-800 to-blue-900',
                },
                {
                  id: 'live' as const,
                  title: 'بث الحرمين الشريفين',
                  desc: 'نقل مباشر من مكة والمدينة',
                  icon: Video,
                  color: 'from-rose-700 to-red-800',
                },
                {
                  id: 'hajj' as const,
                  title: 'مناسك الحج والعمرة',
                  desc: 'دليل شامل للمعتمر والحاج والأدعية',
                  icon: Sparkles,
                  color: 'from-amber-600 to-yellow-600',
                  action: () => {
                    onClose();
                    if (onOpenHajj) onOpenHajj();
                  },
                },
                {
                  id: 'sunan' as const,
                  title: 'السنن النبوية اليومية',
                  desc: 'سنن الاستيقاظ والوضوء واللباس',
                  icon: Heart,
                  color: 'from-emerald-800 to-teal-900',
                },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if ('action' in item && typeof item.action === 'function') {
                        item.action();
                      } else {
                        setSubTab(item.id as any);
                      }
                    }}
                    className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition-all text-right flex flex-col justify-between min-h-[110px] cursor-pointer group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* SubTab 0: Global Search, Categories, Favorites & Linked Topics */}
          {subTab === 'encyclopedia' && (
            <div className="space-y-3" dir="rtl">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث في التفسير، قصص الأنبياء والصالحين، فقه الصيام..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pr-9 pl-4 py-2.5 text-xs bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#104B40]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'favorites', label: `المفضلة (${favorites.length})` },
                  { id: 'tafseer', label: 'التفسير والتدبر' },
                  { id: 'prophets', label: 'قصص الأنبياء' },
                  { id: 'righteous', label: 'قصص الصالحين' },
                  { id: 'ramadan', label: 'فقه الصيام' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setGlobalCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      globalCategory === cat.id
                        ? 'bg-[#104B40] text-white'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {filteredEncyclopedia.map((item) => {
                  const isFav = favorites.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-xs text-right space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold bg-[#C5A059]/15 text-[#9A7732] px-2.5 py-0.5 rounded-full">
                          {item.categoryLabel}
                        </span>
                        <button
                          onClick={() => setFavorites(toggleSavedFavorite(item.id))}
                          className="p-1.5 rounded-lg bg-[#F7F6F2] hover:bg-gray-200 transition-colors cursor-pointer"
                          title="إضافة للمفضلة"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav ? 'text-rose-600 fill-rose-600' : 'text-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                      <h4 className="text-sm font-black text-[#172A28] font-cairo">{item.title}</h4>
                      <p className="text-[11px] font-bold text-[#104B40]">{item.subtitle}</p>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{item.body}</p>
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {item.relatedTopics.map((topic, idx) => (
                          <button
                            key={idx}
                            onClick={() => setGlobalSearch(topic)}
                            className="text-[10px] bg-[#F7F6F2] hover:bg-emerald-50 text-[#104B40] px-2 py-0.5 rounded-full font-bold border border-gray-200 cursor-pointer"
                          >
                            #{topic}
                          </button>
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-1.5">
                        <strong className="text-gray-600">المصدر:</strong> {item.source}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SubTab 1: Zakat Calculator */}
          {subTab === 'zakat' && (
            <div className="space-y-4 text-[#172A28]">
              {/* Sharia Banner */}
              <div className="bg-[#faeee1]/80 p-3.5 rounded-2xl border border-amber-900/15 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span>حكم وشروط زكاة المال وعروض التجارة</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  ركن من أركان الإسلام، تجب بنسبة <strong>2.5% (ربع العشر)</strong> إذا بلغ صافي المال بعد خصم الديون النصاب الشرعي وحال عليه الحول الهجري (عام كامل).
                </p>
              </div>

              {/* Standard Selection */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
                <span className="text-xs font-bold text-gray-700 block">معيار النصاب الشرعي المعتمد:</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    onClick={() => setNisabStandard('gold')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      nisabStandard === 'gold'
                        ? 'border-[#104B40] bg-[#104B40] text-white shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    نصاب الذهب (85 جم عيار 24)
                  </button>
                  <button
                    onClick={() => setNisabStandard('silver')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      nisabStandard === 'silver'
                        ? 'border-[#104B40] bg-[#104B40] text-white shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    نصاب الفضة (595 جم فضة)
                  </button>
                </div>
              </div>

              {/* INPUTS: Cash, Gold, Silver, Trade, Debts */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-[#104B40] pb-2 border-b border-gray-100">
                  1. الأموال النقدية والذهب والفضة وعروض التجارة
                </h4>

                {/* Cash */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    الأموال النقدية والودائع البنكية والسيولة (بالعملة المحلية):
                  </label>
                  <input
                    type="number"
                    value={cashAmount || ''}
                    placeholder="0"
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                  />
                </div>

                {/* Gold: 24, 21, 18 */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      ذهب عيار 24 (جم):
                    </label>
                    <input
                      type="number"
                      value={gold24Grams || ''}
                      placeholder="0"
                      onChange={(e) => setGold24Grams(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      ذهب عيار 21 (جم):
                    </label>
                    <input
                      type="number"
                      value={gold21Grams || ''}
                      placeholder="0"
                      onChange={(e) => setGold21Grams(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      ذهب عيار 18 (جم):
                    </label>
                    <input
                      type="number"
                      value={gold18Grams || ''}
                      placeholder="0"
                      onChange={(e) => setGold18Grams(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                </div>

                {/* Silver & Trade Goods */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      الفضة الخالصة (جرام):
                    </label>
                    <input
                      type="number"
                      value={silverGrams || ''}
                      placeholder="0"
                      onChange={(e) => setSilverGrams(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      قيمة عروض التجارة المعدة للبيع:
                    </label>
                    <input
                      type="number"
                      value={tradeMerchandise || ''}
                      placeholder="0"
                      onChange={(e) => setTradeMerchandise(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                </div>

                {/* Debts Owed */}
                <div>
                  <label className="text-xs font-bold text-rose-800 block mb-1">
                    الديون المستحقة عليك للآخرين (تُخصم من الوعاء الزكوي):
                  </label>
                  <input
                    type="number"
                    value={debtsOwed || ''}
                    placeholder="0"
                    onChange={(e) => setDebtsOwed(Number(e.target.value))}
                    className="w-full p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-sm font-sans focus:outline-none focus:border-rose-500 text-rose-900"
                  />
                </div>

                {/* Prices Config */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      سعر جرام الذهب عيار 24:
                    </label>
                    <input
                      type="number"
                      value={goldGramPrice}
                      onChange={(e) => setGoldGramPrice(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      سعر جرام الفضة:
                    </label>
                    <input
                      type="number"
                      value={silverGramPrice}
                      onChange={(e) => setSilverGramPrice(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* ZAKAT RESULT CARD */}
              <div className="bg-gradient-to-br from-[#104B40] via-[#0E443A] to-[#0A2F24] text-white p-5 rounded-3xl shadow-lg space-y-3 text-right">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                  <span className="text-emerald-200">إجمالي الوعاء الزكوي الخاضع للزكاة:</span>
                  <strong className="font-sans text-base text-amber-200">
                    {Math.round(netZakatableWealth).toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-200">
                    حد النصاب الشرعي ({nisabStandard === 'gold' ? '85 جم ذهب 24' : '595 جم فضة'}):
                  </span>
                  <strong className="font-sans text-sm">
                    {Math.round(nisabThreshold).toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-200">حالة بلوغ النصاب:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      isNisabReached ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-gray-200'
                    }`}
                  >
                    {isNisabReached ? 'بلغ النصاب الشرعي ✓' : 'لم يبلغ النصاب بعد'}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-amber-300 font-bold">
                      مقدار زكاة المال المستحقة (2.5%):
                    </div>
                    <div className="text-[10px] text-emerald-200">
                      {isNisabReached ? 'تُخرج بعد تمام حولان الحول الهجري' : 'لا تجب الزكاة لعدم بلوغ النصاب'}
                    </div>
                  </div>
                  <span className="text-2xl font-black font-sans text-amber-300">
                    {zakatDue > 0 ? `${Math.round(zakatDue).toLocaleString()}` : '0'}
                  </span>
                </div>
              </div>

              {/* ZAKAT AL-FITR SECTION */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="text-xs font-black text-[#104B40]">
                    2. حاسبة زكاة الفطر المباركة (تُخرج قبل صلاة العيد)
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      عدد أفراد الأسرة المستحق عنهم:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={fitrMembers}
                      onChange={(e) => setFitrMembers(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      قيمة الفرد المقدرة نقدياً:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={fitrAmountPerPerson}
                      onChange={(e) => setFitrAmountPerPerson(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">
                    إجمالي زكاة الفطر الواجب إخراجها:
                  </span>
                  <span className="text-base font-black text-[#104B40] font-sans">
                    {fitrTotalDue.toLocaleString()} (عن {fitrMembers} أفراد)
                  </span>
                </div>
              </div>
            </div>
          )}
          {subTab === 'names' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث في أسماء الله الحسنى..."
                  value={namesSearch}
                  onChange={(e) => setNamesSearch(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 text-xs bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {NAMES_OF_ALLAH.filter((n) => n.name.includes(namesSearch) || n.meaning.includes(namesSearch)).map((n) => (
                  <div
                    key={n.number}
                    className="p-3 rounded-2xl bg-white border border-gray-100 shadow-xs text-right"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-sans text-gray-400">#{n.number}</span>
                      <h4 className="text-base font-extrabold text-emerald-950 font-quran">
                        {n.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">{n.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab 3: Khatma Planner */}
          {subTab === 'khatma' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-right space-y-3">
                <label className="text-xs font-bold text-gray-700 block">
                  في كم يوماً ترغب في إتمام ختمة القرآن الكريم؟
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 15, 30, 60].map((days) => (
                    <button
                      key={days}
                      onClick={() => setKhatmaDays(days)}
                      className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        khatmaDays === days
                          ? 'bg-[#104b3a] text-white shadow'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {days} يوم
                    </button>
                  ))}
                </div>
              </div>

              {/* Khatma Plan Result */}
              <div className="bg-gradient-to-br from-[#104b3a] to-[#0a2f24] text-white p-4 rounded-2xl shadow-lg space-y-3 text-right">
                <h4 className="text-sm font-bold text-amber-300">جدول القراءة اليومي المقترح:</h4>
                <div className="flex justify-between items-center text-xs">
                  <span>المطلوب قراءته يومياً:</span>
                  <strong className="text-base font-sans font-bold text-white">
                    {pagesPerDay} صفحة (حوالي {(pagesPerDay / 20).toFixed(1)} جزء)
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>المطلوب بعد كل صلاة مكتوبة:</span>
                  <strong className="text-base font-sans font-bold text-amber-200">
                    {pagesPerPrayer} صفحات فقط دبر كل فريضة
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 4: Islamic Events */}
          {subTab === 'events' && (
            <div className="space-y-3">
              {ISLAMIC_EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs text-right space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                      {ev.hijriDate}
                    </span>
                    <h4 className="text-sm font-black text-emerald-950 font-quran">
                      {ev.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-gray-400 block font-sans">
                    الموافق تقريباً: {ev.gregorianDate}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{ev.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* SubTab 5: Live Streaming */}
          {subTab === 'live' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs text-right space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    بث حي
                  </span>
                  <h4 className="text-sm font-bold text-gray-900">قناة القرآن الكريم - مكة المكرمة</h4>
                </div>
                <p className="text-xs text-gray-500">
                  نقل مباشر على مدار 24 ساعة من المسجد الحرام وتلاوات خاشعة لصلوات الحرم المكي.
                </p>
                <a
                  href="https://www.youtube.com/@MakkahLive"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow transition-colors"
                >
                  فتح البث المباشر لمكة المكرمة
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs text-right space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    بث حي
                  </span>
                  <h4 className="text-sm font-bold text-gray-900">قناة السنة النبوية - المدينة المنورة</h4>
                </div>
                <p className="text-xs text-gray-500">
                  نقل حي ومباشر من المسجد النبوي الشريف والروضة الشريفة.
                </p>
                <a
                  href="https://www.youtube.com/@MadinahLive"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors"
                >
                  فتح البث المباشر للمدينة المنورة
                </a>
              </div>
            </div>
          )}

          {/* SubTab 6: Daily Sunan */}
          {subTab === 'sunan' && (
            <div className="space-y-3">
              {[
                {
                  title: 'سنة السواك عند الوضوء والصلاة',
                  desc: 'قال ﷺ: «لَوْلا أَنْ أَشُقَّ عَلَى أُمَّتِي لأَمَرْتُهُمْ بِالسِّوَاكِ عِنْدَ كُلِّ صَلاةٍ».',
                  fadl: 'مطهرة للفم مرضاة للرب ومضاعفة لأجر الصلاة.'
                },
                {
                  title: 'التيامن في اللباس والتنعل',
                  desc: 'كان النبي ﷺ يعجبه التيمن في تنعله وترجله وطهوره وفي شأنه كله.',
                  fadl: 'مخالفة الشيطان وتأسٍ بسيد الأنام ﷺ.'
                },
                {
                  title: 'سنة صلاة ركعتين بعد الوضوء',
                  desc: 'قال ﷺ لبلال: «حَدِّثْنِي بِأَرْجَى عَمَلٍ عَمِلْتَهُ فِي الإِسْلامِ... قَالَ: مَا تَطَهَّرْتُ طُهُورًا... إِلا صَلَّيْتُ بِذَلِكَ الطُّهُورِ مَا كُتِبَ لِي».',
                  fadl: 'سبب لسماع دف النعلين في الجنة ومغفرة الذنوب.'
                },
                {
                  title: 'سنة الترديد خلف المؤذن والدعاء بعده',
                  desc: 'قال ﷺ: «إِذَا سَمِعْتُمُ الْمُؤَذِّنَ فَقُولُوا مِثْلَ مَا يَقُولُ، ثُمَّ صَلُّوا عَلَيَّ، ثُمَّ سَلُوا اللَّهَ لِيَ الْوَسِيلَةَ».',
                  fadl: 'حلت له شفاعة النبي ﷺ يوم القيامة.'
                },
                {
                  title: 'سنة لعق الأصابع وحمد الله بعد الطعام',
                  desc: 'قال ﷺ: «إِنَّ اللَّهَ لَيَرْضَى عَنِ الْعَبْدِ أَنْ يَأْكُلَ الأَكْلَةَ فَيَحْمَدَهُ عَلَيْهَا».',
                  fadl: 'نيل رضا الله التام والبركة في الرزق.'
                }
              ].map((s, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs text-right space-y-1.5">
                  <h4 className="text-sm font-bold text-[#104B40]">{s.title}</h4>
                  <p className="text-xs text-gray-700 leading-relaxed font-sans">{s.desc}</p>
                  <div className="text-[11px] text-amber-900 bg-[#F3E5C9]/50 p-2 rounded-xl">
                    <span className="font-bold">الفضل: </span>{s.fadl}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
