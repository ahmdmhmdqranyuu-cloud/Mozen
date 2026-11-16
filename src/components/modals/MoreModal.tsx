import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Heart,
  Calendar,
  Video,
  BookOpen,
  Search,
  Sparkles,
  ChevronRight,
  Bookmark,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Coins,
  Sprout,
  Info,
} from 'lucide-react';
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

const ZAKAT_STORAGE_KEY = 'moazen_zakat_calc_v2';

interface ZakatCurrencyPreset {
  code: string;
  symbol: string;
  label: string;
  defaultGold24: number;
  defaultSilver: number;
  defaultFitr: number;
}

const ZAKAT_CURRENCIES: ZakatCurrencyPreset[] = [
  { code: 'EGP', symbol: 'ج.م', label: 'مصر (ج.م)', defaultGold24: 4300, defaultSilver: 52, defaultFitr: 35 },
  { code: 'SAR', symbol: 'ر.س', label: 'السعودية (ر.س)', defaultGold24: 325, defaultSilver: 4, defaultFitr: 25 },
  { code: 'AED', symbol: 'د.إ', label: 'الإمارات (د.إ)', defaultGold24: 318, defaultSilver: 3.9, defaultFitr: 25 },
  { code: 'KWD', symbol: 'د.ك', label: 'الكويت (د.ك)', defaultGold24: 26.5, defaultSilver: 0.32, defaultFitr: 1.5 },
  { code: 'QAR', symbol: 'ر.ق', label: 'قطر (ر.ق)', defaultGold24: 315, defaultSilver: 3.8, defaultFitr: 15 },
  { code: 'JOD', symbol: 'د.أ', label: 'الأردن (د.أ)', defaultGold24: 61.5, defaultSilver: 0.75, defaultFitr: 2.5 },
  { code: 'MAD', symbol: 'د.م', label: 'المغرب (د.م)', defaultGold24: 860, defaultSilver: 10.5, defaultFitr: 20 },
  { code: 'TRY', symbol: 'ل.ت', label: 'تركيا (ل.ت)', defaultGold24: 3040, defaultSilver: 37, defaultFitr: 180 },
  { code: 'USD', symbol: '$', label: 'دولار ($)', defaultGold24: 86.5, defaultSilver: 1.05, defaultFitr: 15 },
  { code: 'EUR', symbol: '€', label: 'يورو (€)', defaultGold24: 80.5, defaultSilver: 0.98, defaultFitr: 14 },
];

function loadSavedZakatState() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ZAKAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

  const savedZakat = React.useMemo(() => loadSavedZakatState(), []);

  // Zakat Calculator Comprehensive State
  const [zakatCurrency, setZakatCurrency] = useState<string>(() => savedZakat?.zakatCurrency || 'EGP');
  const [cashAmount, setCashAmount] = useState<number>(() => Number(savedZakat?.cashAmount) || 0);
  const [receivablesAmount, setReceivablesAmount] = useState<number>(() => Number(savedZakat?.receivablesAmount) || 0);
  const [gold24Grams, setGold24Grams] = useState<number>(() => Number(savedZakat?.gold24Grams) || 0);
  const [gold21Grams, setGold21Grams] = useState<number>(() => Number(savedZakat?.gold21Grams) || 0);
  const [gold18Grams, setGold18Grams] = useState<number>(() => Number(savedZakat?.gold18Grams) || 0);
  const [goldGramPrice, setGoldGramPrice] = useState<number>(() => Number(savedZakat?.goldGramPrice) || 4300);
  const [silverGrams, setSilverGrams] = useState<number>(() => Number(savedZakat?.silverGrams) || 0);
  const [silverGramPrice, setSilverGramPrice] = useState<number>(() => Number(savedZakat?.silverGramPrice) || 52);
  const [tradeMerchandise, setTradeMerchandise] = useState<number>(() => Number(savedZakat?.tradeMerchandise) || 0);
  const [stocksAmount, setStocksAmount] = useState<number>(() => Number(savedZakat?.stocksAmount) || 0);
  const [stocksMode, setStocksMode] = useState<'trading' | 'investment'>(() =>
    savedZakat?.stocksMode === 'investment' ? 'investment' : 'trading'
  );
  const [rentalSavings, setRentalSavings] = useState<number>(() => Number(savedZakat?.rentalSavings) || 0);
  const [debtsOwed, setDebtsOwed] = useState<number>(() => Number(savedZakat?.debtsOwed) || 0);
  const [nisabStandard, setNisabStandard] = useState<'gold' | 'silver'>(() =>
    savedZakat?.nisabStandard === 'silver' ? 'silver' : 'gold'
  );

  // Zakat al-Fitr & Crops Zakat
  const [fitrMembers, setFitrMembers] = useState<number>(() => Math.max(1, Number(savedZakat?.fitrMembers) || 1));
  const [fitrAmountPerPerson, setFitrAmountPerPerson] = useState<number>(() => Number(savedZakat?.fitrAmountPerPerson) || 35);
  const [cropsKg, setCropsKg] = useState<number>(0);
  const [cropsIrrigation, setCropsIrrigation] = useState<'natural' | 'irrigated'>('natural');
  const [showMasarifGuide, setShowMasarifGuide] = useState<boolean>(false);

  // Metals auto-fetch & Copy feedback
  const [loadingMetals, setLoadingMetals] = useState<boolean>(false);
  const [metalsStatusMsg, setMetalsStatusMsg] = useState<string>('');
  const [copiedZakatSummary, setCopiedZakatSummary] = useState<boolean>(false);

  // 99 Names Search
  const [namesSearch, setNamesSearch] = useState('');

  // Khatma Planner State
  const [khatmaDays, setKhatmaDays] = useState<number>(30);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        ZAKAT_STORAGE_KEY,
        JSON.stringify({
          zakatCurrency,
          cashAmount,
          receivablesAmount,
          gold24Grams,
          gold21Grams,
          gold18Grams,
          goldGramPrice,
          silverGrams,
          silverGramPrice,
          tradeMerchandise,
          stocksAmount,
          stocksMode,
          rentalSavings,
          debtsOwed,
          nisabStandard,
          fitrMembers,
          fitrAmountPerPerson,
        })
      );
    } catch {
      // ignore storage quota
    }
  }, [
    zakatCurrency,
    cashAmount,
    receivablesAmount,
    gold24Grams,
    gold21Grams,
    gold18Grams,
    goldGramPrice,
    silverGrams,
    silverGramPrice,
    tradeMerchandise,
    stocksAmount,
    stocksMode,
    rentalSavings,
    debtsOwed,
    nisabStandard,
    fitrMembers,
    fitrAmountPerPerson,
  ]);

  if (!isOpen) return null;

  const activeCurrencyObj = ZAKAT_CURRENCIES.find((c) => c.code === zakatCurrency) || ZAKAT_CURRENCIES[0];

  const handleSelectZakatCurrency = (newCode: string) => {
    setZakatCurrency(newCode);
    const preset = ZAKAT_CURRENCIES.find((c) => c.code === newCode);
    if (preset) {
      setGoldGramPrice(preset.defaultGold24);
      setSilverGramPrice(preset.defaultSilver);
      setFitrAmountPerPerson(preset.defaultFitr);
      setMetalsStatusMsg('');
    }
  };

  const handleFetchLiveMetals = async () => {
    setLoadingMetals(true);
    setMetalsStatusMsg('');
    try {
      const res = await fetch(`/api/zakat/metals?currency=${encodeURIComponent(zakatCurrency)}`);
      const data = await res.json();
      if (data?.success && data.gold24PerGram > 0) {
        setGoldGramPrice(data.gold24PerGram);
        setSilverGramPrice(data.silverPerGram || activeCurrencyObj.defaultSilver);
        setMetalsStatusMsg(
          data.source === 'live'
            ? `تم التحديث لحظياً: عيار 24 = ${data.gold24PerGram} ${data.symbol} | الفضة = ${data.silverPerGram} ${data.symbol}`
            : `تم ضبط الأسعار الاسترشادية (${data.gold24PerGram} ${data.symbol}/جم)`
        );
      } else {
        setMetalsStatusMsg('تعذر الجلب الآلي، يمكنك إدخال السعر المحلي يدوياً');
      }
    } catch {
      setMetalsStatusMsg('غير متصل — تم الاعتماد على السعر الاسترشادي أو اليدوي');
    } finally {
      setLoadingMetals(false);
    }
  };

  const handleResetZakat = () => {
    setCashAmount(0);
    setReceivablesAmount(0);
    setGold24Grams(0);
    setGold21Grams(0);
    setGold18Grams(0);
    setSilverGrams(0);
    setTradeMerchandise(0);
    setStocksAmount(0);
    setRentalSavings(0);
    setDebtsOwed(0);
    setCropsKg(0);
    setMetalsStatusMsg('');
  };

  // Comprehensive Zakat Calculations (Fiqh Compliant)
  const equivalentGold24Grams = gold24Grams + gold21Grams * (21 / 24) + gold18Grams * (18 / 24);
  const totalGoldValue = equivalentGold24Grams * goldGramPrice;
  const totalSilverValue = silverGrams * silverGramPrice;
  const zakatableStocks = stocksMode === 'trading' ? stocksAmount : stocksAmount * 0.25;
  const grossZakatableWealth =
    cashAmount + receivablesAmount + totalGoldValue + totalSilverValue + tradeMerchandise + zakatableStocks + rentalSavings;
  const netZakatableWealth = Math.max(0, grossZakatableWealth - debtsOwed);

  const nisabThreshold = nisabStandard === 'gold' ? 85 * goldGramPrice : 595 * silverGramPrice;
  const nisabRatioPercent = nisabThreshold > 0 ? Math.min(100, Math.round((netZakatableWealth / nisabThreshold) * 100)) : 0;
  const isNisabReached = nisabThreshold > 0 && netZakatableWealth >= nisabThreshold;
  const zakatDue = isNisabReached ? netZakatableWealth * 0.025 : 0;
  const fitrTotalDue = Math.max(0, fitrMembers) * Math.max(0, fitrAmountPerPerson);

  const cropsNisabKg = 653;
  const cropsRate = cropsIrrigation === 'natural' ? 0.1 : 0.05;
  const cropsZakatDueKg = cropsKg >= cropsNisabKg ? cropsKg * cropsRate : 0;

  const handleCopyZakatReport = async () => {
    const summaryText = [
      `تقرير حاسبة الزكاة الشرعية (${activeCurrencyObj.label})`,
      `• صافي الوعاء الزكوي: ${Math.round(netZakatableWealth).toLocaleString()} ${activeCurrencyObj.symbol}`,
      `• حد النصاب (${nisabStandard === 'gold' ? '85 جم ذهب' : '595 جم فضة'}): ${Math.round(nisabThreshold).toLocaleString()} ${activeCurrencyObj.symbol}`,
      `• زكاة المال المستحقة (2.5%): ${Math.round(zakatDue).toLocaleString()} ${activeCurrencyObj.symbol}`,
      `• زكاة الفطر (${fitrMembers} أفراد): ${fitrTotalDue.toLocaleString()} ${activeCurrencyObj.symbol}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedZakatSummary(true);
      setTimeout(() => setCopiedZakatSummary(false), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

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
              className="moazen-widget text-xs font-bold text-[#172A28] px-3 py-1.5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
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
                    className="moazen-widget p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition-all text-right flex flex-col justify-between min-h-[110px] cursor-pointer group"
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
                  className="moazen-widget w-full pr-9 pl-4 py-2.5 text-xs border border-gray-200 rounded-2xl focus:outline-none focus:border-[#104B40]"
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
                      className="moazen-widget p-3.5 rounded-2xl border border-gray-100 shadow-xs text-right space-y-2"
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

          {/* SubTab 1: Comprehensive Fiqh Zakat Calculator */}
          {subTab === 'zakat' && (
            <div className="space-y-3.5 text-[#172A28]" dir="rtl">
              {/* Sharia Banner & Quick Reset */}
              <div className="bg-[#faeee1]/80 p-3.5 rounded-2xl border border-amber-900/15 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span>حكم وشروط زكاة المال والأصول</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetZakat}
                    className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[11px] font-bold text-amber-900 border border-amber-900/15 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>تصفير</span>
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  تجب بنسبة <strong>2.5% (ربع العشر)</strong> على صافي الأصول الزكوية إذا بلغت النصاب وحال عليها الحول الهجري.
                </p>
              </div>

              {/* Currency & Live Metals Price Bar */}
              <div className="moazen-widget p-3.5 rounded-2xl border border-gray-100 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-[#C5A059]" />
                    <span>العملة وأسعار الذهب والفضة:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleFetchLiveMetals}
                    disabled={loadingMetals}
                    className="px-2.5 py-1 rounded-xl bg-[#104B40] hover:bg-[#0c3a31] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingMetals ? 'animate-spin' : ''}`} />
                    <span>{loadingMetals ? 'جاري التحديث...' : 'تحديث السعر تلقائياً'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {ZAKAT_CURRENCIES.map((cur) => (
                    <button
                      key={cur.code}
                      type="button"
                      onClick={() => handleSelectZakatCurrency(cur.code)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border cursor-pointer transition-colors ${
                        zakatCurrency === cur.code
                          ? 'bg-[#C5A059] text-[#104B40] border-[#104B40]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {cur.label}
                    </button>
                  ))}
                </div>

                {metalsStatusMsg && (
                  <p className="text-[11px] font-bold text-[#104B40] bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1.5">
                    {metalsStatusMsg}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                  <button
                    type="button"
                    onClick={() => setNisabStandard('gold')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      nisabStandard === 'gold'
                        ? 'border-[#104B40] bg-[#104B40] text-white shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    نصاب الذهب (85 جم 24)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNisabStandard('silver')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      nisabStandard === 'silver'
                        ? 'border-[#104B40] bg-[#104B40] text-white shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    نصاب الفضة (595 جم فضة)
                  </button>
                </div>
              </div>

              {/* INPUTS: Cash, Receivables, Gold, Silver, Stocks, Trade, Rentals, Debts */}
              <div className="moazen-widget p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-[#104B40] pb-2 border-b border-gray-100">
                  1. تفاصيل الأموال والأصول الزكوية ({activeCurrencyObj.symbol})
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      النقدية والودائع البنكية:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={cashAmount || ''}
                      placeholder="0"
                      onChange={(e) => setCashAmount(Math.max(0, Number(e.target.value)))}
                      className="moazen-widget w-full p-2.5 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      ديون مرجوّة لك عند الغير:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={receivablesAmount || ''}
                      placeholder="0"
                      onChange={(e) => setReceivablesAmount(Math.max(0, Number(e.target.value)))}
                      className="moazen-widget w-full p-2.5 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                </div>

                {/* Gold: 24, 21, 18 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-700">الذهب المدخر بالجرام (يُحوَّل تلقائياً لعيار 24):</span>
                    {equivalentGold24Grams > 0 && (
                      <span className="font-black text-[#9A7732] tabular-nums">
                        يعادل {equivalentGold24Grams.toFixed(1)} جم خالص
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10.5px] font-bold text-gray-600 block mb-1">عيار 24 (جم)</label>
                      <input
                        type="number"
                        min={0}
                        value={gold24Grams || ''}
                        placeholder="0"
                        onChange={(e) => setGold24Grams(Math.max(0, Number(e.target.value)))}
                        className="moazen-widget w-full p-2 border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-[#104B40]"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-gray-600 block mb-1">عيار 21 (جم)</label>
                      <input
                        type="number"
                        min={0}
                        value={gold21Grams || ''}
                        placeholder="0"
                        onChange={(e) => setGold21Grams(Math.max(0, Number(e.target.value)))}
                        className="moazen-widget w-full p-2 border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-[#104B40]"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-gray-600 block mb-1">عيار 18 (جم)</label>
                      <input
                        type="number"
                        min={0}
                        value={gold18Grams || ''}
                        placeholder="0"
                        onChange={(e) => setGold18Grams(Math.max(0, Number(e.target.value)))}
                        className="moazen-widget w-full p-2 border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-[#104B40]"
                      />
                    </div>
                  </div>
                </div>

                {/* Silver & Trade Goods */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      الفضة الخالصة (جرام):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={silverGrams || ''}
                      placeholder="0"
                      onChange={(e) => setSilverGrams(Math.max(0, Number(e.target.value)))}
                      className="moazen-widget w-full p-2.5 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      عروض التجارة والمخزون:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={tradeMerchandise || ''}
                      placeholder="0"
                      onChange={(e) => setTradeMerchandise(Math.max(0, Number(e.target.value)))}
                      className="moazen-widget w-full p-2.5 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                </div>

                {/* Stocks & Rental Yield */}
                <div className="moazen-widget p-2.5 rounded-xl border border-gray-200/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        الأسهم والصناديق الاستثمارية:
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={stocksAmount || ''}
                        placeholder="0"
                        onChange={(e) => setStocksAmount(Math.max(0, Number(e.target.value)))}
                        className="moazen-widget w-full p-2 border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-[#104B40]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        عوائد إيجار وعقار مدخرة:
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={rentalSavings || ''}
                        placeholder="0"
                        onChange={(e) => setRentalSavings(Math.max(0, Number(e.target.value)))}
                        className="moazen-widget w-full p-2 border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-[#104B40]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] font-bold">
                    <button
                      type="button"
                      onClick={() => setStocksMode('trading')}
                      className={`flex-1 py-1.5 rounded-lg border cursor-pointer ${
                        stocksMode === 'trading'
                          ? 'bg-[#104B40] text-white border-[#104B40]'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      أسهم مضاربة (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStocksMode('investment')}
                      className={`flex-1 py-1.5 rounded-lg border cursor-pointer ${
                        stocksMode === 'investment'
                          ? 'bg-[#104B40] text-white border-[#104B40]'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      أسهم استثمارية (25% وعاء)
                    </button>
                  </div>
                </div>

                {/* Debts Owed */}
                <div>
                  <label className="text-xs font-bold text-rose-800 block mb-1">
                    الديون المستحقة عليك للآخرين (تُخصم من الوعاء):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={debtsOwed || ''}
                    placeholder="0"
                    onChange={(e) => setDebtsOwed(Math.max(0, Number(e.target.value)))}
                    className="w-full p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-sm font-sans focus:outline-none focus:border-rose-500 text-rose-900"
                  />
                </div>

                {/* Prices Config */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      سعر جرام الذهب 24 ({activeCurrencyObj.symbol}):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={goldGramPrice}
                      onChange={(e) => setGoldGramPrice(Math.max(0, Number(e.target.value)))}
                      className="moazen-widget w-full p-2 border border-gray-200 rounded-xl text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      سعر جرام الفضة ({activeCurrencyObj.symbol}):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={silverGramPrice}
                      onChange={(e) => setSilverGramPrice(Math.max(0, Number(e.target.value)))}
                      className="moazen-widget w-full p-2 border border-gray-200 rounded-xl text-xs font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* ZAKAT RESULT CARD WITH BREAKDOWN & COPY */}
              <div className="moazen-widget p-5 rounded-3xl shadow-lg space-y-3 text-right">
                <div className="space-y-1.5 text-[11px] pb-2.5 border-b border-emerald-950/10 text-[#4B5B58]">
                  <div className="flex justify-between">
                    <span>إجمالي الأصول (نقد + ذهب + فضة + تجارة + أسهم):</span>
                    <strong className="font-sans text-[#172A28] tabular-nums">
                      {Math.round(grossZakatableWealth).toLocaleString()} {activeCurrencyObj.symbol}
                    </strong>
                  </div>
                  {debtsOwed > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>الديون المخصومة:</span>
                      <strong className="font-sans tabular-nums">
                        - {Math.round(debtsOwed).toLocaleString()} {activeCurrencyObj.symbol}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between text-xs pt-1 text-[#104B40] font-bold">
                    <span>صافي الوعاء الزكوي:</span>
                    <strong className="font-sans text-sm tabular-nums">
                      {Math.round(netZakatableWealth).toLocaleString()} {activeCurrencyObj.symbol}
                    </strong>
                  </div>
                </div>

                {/* Nisab Progress Gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#4B5B58]">
                      حد النصاب ({nisabStandard === 'gold' ? '85 جم ذهب 24' : '595 جم فضة'}):
                    </span>
                    <strong className="font-sans text-sm text-[#172A28] tabular-nums">
                      {Math.round(nisabThreshold).toLocaleString()} {activeCurrencyObj.symbol}
                    </strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-emerald-950/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isNisabReached ? 'bg-[#C5A059]' : 'bg-[#104B40]'
                      }`}
                      style={{ width: `${nisabRatioPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#4B5B58]">نسبة تحقق النصاب: {nisabRatioPercent}%</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-black ${
                        isNisabReached ? 'bg-[#104B40] text-white' : 'bg-emerald-950/10 text-[#104B40]'
                      }`}
                    >
                      {isNisabReached ? 'بلغ النصاب الشرعي ✓' : 'لم يبلغ النصاب بعد'}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-emerald-950/10 flex justify-between items-center gap-2">
                  <div>
                    <div className="text-xs text-[#9A7732] font-bold">مقدار زكاة المال الواجبة (2.5%):</div>
                    <div className="text-[10px] text-[#4B5B58]">
                      {isNisabReached ? 'تُخرج بعد تمام حولان الحول الهجري' : 'لا تجب الزكاة قبل بلوغ النصاب'}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-2xl font-black font-sans text-[#104B40] tabular-nums">
                      {zakatDue > 0 ? Math.round(zakatDue).toLocaleString() : '0'}
                    </span>
                    <span className="text-xs text-[#9A7732] mr-1 font-bold">{activeCurrencyObj.symbol}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyZakatReport}
                  className="w-full py-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedZakatSummary ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedZakatSummary ? 'تم نسخ ملخص الزكاة ✓' : 'نسخ تقرير حساب الزكاة'}</span>
                </button>
              </div>

              {/* ZAKAT AL-FITR SECTION */}
              <div className="moazen-widget p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="text-xs font-black text-[#104B40]">
                    2. حاسبة زكاة الفطر المباركة (قبل صلاة العيد)
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      عدد أفراد الأسرة:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={fitrMembers}
                      onChange={(e) => setFitrMembers(Math.max(1, Number(e.target.value)))}
                      className="moazen-widget w-full p-2.5 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      قيمة الفرد ({activeCurrencyObj.symbol}):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={fitrAmountPerPerson}
                      onChange={(e) => setFitrAmountPerPerson(Math.max(0, Number(e.target.value)))}
                      className="moazen-widget w-full p-2.5 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                </div>

                <div className="moazen-widget p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">إجمالي زكاة الفطر:</span>
                  <span className="text-base font-black text-[#104B40] font-sans tabular-nums">
                    {fitrTotalDue.toLocaleString()} {activeCurrencyObj.symbol} (عن {fitrMembers} أفراد)
                  </span>
                </div>
              </div>

              {/* ZAKAT AL-ZURU (CROPS) SECTION */}
              <div className="moazen-widget p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-black text-[#104B40]">
                    3. حاسبة زكاة الزروع والثمار (النصاب 653 كجم)
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">الوزن الكلي للمحصول (كجم):</label>
                    <input
                      type="number"
                      min={0}
                      value={cropsKg || ''}
                      placeholder="0"
                      onChange={(e) => setCropsKg(Math.max(0, Number(e.target.value)))}
                      className="moazen-widget w-full p-2 border border-gray-200 rounded-xl text-xs font-sans"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setCropsIrrigation('natural')}
                      className={`flex-1 py-2 px-1 rounded-xl text-[10.5px] font-bold border cursor-pointer ${
                        cropsIrrigation === 'natural'
                          ? 'bg-[#104B40] text-white border-[#104B40]'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      أمطار/بلا كلفة (10%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCropsIrrigation('irrigated')}
                      className={`flex-1 py-2 px-1 rounded-xl text-[10.5px] font-bold border cursor-pointer ${
                        cropsIrrigation === 'irrigated'
                          ? 'bg-[#104B40] text-white border-[#104B40]'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      سقي بآلة (5%)
                    </button>
                  </div>
                </div>
                {cropsKg > 0 && (
                  <div className="moazen-widget p-2.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">
                      {cropsKg >= cropsNisabKg ? 'المقدار الواجب إخراجه يوم الحصاد:' : 'أقل من النصاب (653 كجم):'}
                    </span>
                    <strong className="text-[#104B40] font-sans tabular-nums">
                      {cropsZakatDueKg > 0 ? `${cropsZakatDueKg.toFixed(1)} كجم` : '0 كجم'}
                    </strong>
                  </div>
                )}
              </div>

              {/* 8 RECIPIENTS GUIDE */}
              <div className="moazen-widget rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowMasarifGuide((v) => !v)}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-black text-[#104B40] cursor-pointer hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#C5A059]" />
                    <span>مصارف الزكاة الشرعية الثمانية (التوبة: 60)</span>
                  </span>
                  <span className="text-[11px] text-[#C5A059]">{showMasarifGuide ? 'إخفاء' : 'عرض'}</span>
                </button>
                {showMasarifGuide && (
                  <div className="px-3.5 pb-3.5 text-[11px] text-gray-700 leading-relaxed border-t border-gray-100 pt-2 space-y-1">
                    <p>1. الفقراء · 2. المساكين · 3. العاملون عليها · 4. المؤلفة قلوبهم</p>
                    <p>5. في الرقاب · 6. الغارمون (المدينون) · 7. في سبيل الله · 8. ابن السبيل (المسافر المنقطع)</p>
                  </div>
                )}
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
                  className="moazen-widget w-full pr-9 pl-4 py-2 text-xs border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {NAMES_OF_ALLAH.filter((n) => n.name.includes(namesSearch) || n.meaning.includes(namesSearch)).map((n) => (
                  <div
                    key={n.number}
                    className="moazen-widget p-3 rounded-2xl border border-gray-100 shadow-xs text-right"
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
              <div className="moazen-widget p-4 rounded-2xl border border-gray-100 shadow-xs text-right space-y-3">
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
              <div className="moazen-widget p-4 rounded-2xl shadow-lg space-y-3 text-right">
                <h4 className="text-sm font-bold text-[#9A7732]">جدول القراءة اليومي المقترح:</h4>
                <div className="flex justify-between items-center text-xs text-[#4B5B58]">
                  <span>المطلوب قراءته يومياً:</span>
                  <strong className="text-base font-sans font-bold text-[#104B40]">
                    {pagesPerDay} صفحة (حوالي {(pagesPerDay / 20).toFixed(1)} جزء)
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs text-[#4B5B58]">
                  <span>المطلوب بعد كل صلاة مكتوبة:</span>
                  <strong className="text-base font-sans font-bold text-[#9A7732]">
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
                  className="moazen-widget p-4 rounded-2xl border border-gray-100 shadow-xs text-right space-y-1"
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
              <div className="moazen-widget p-4 rounded-2xl border border-gray-100 shadow-xs text-right space-y-3">
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

              <div className="moazen-widget p-4 rounded-2xl border border-gray-100 shadow-xs text-right space-y-3">
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
                <div key={idx} className="moazen-widget p-4 rounded-2xl border border-gray-100 shadow-xs text-right space-y-1.5">
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
