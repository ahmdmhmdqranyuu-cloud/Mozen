import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Circle,
  Share2,
  Star,
  ChevronLeft,
  ChevronRight,
  Calculator,
  RotateCcw,
  Coins,
  Gem,
  Building2,
  Info,
} from 'lucide-react';
import { RamadanDayImsakiya, UserProfile, RamadanFastingDayRecord } from '../../types';
import {
  calculateRamadanCalendar,
  calculatePrayerTimes
} from '../../utils/prayerTimes';
import { RAMADAN_FIQH_ENCYCLOPEDIA } from '../../data/islamicEncyclopediaData';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';

interface RamadanModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateFastingTracker?: (dayNumber: number, record: Partial<RamadanFastingDayRecord>) => void;
  onOpenQuranReader?: (surah: number, ayah: number, page?: number) => void;
}

export const RamadanModal: React.FC<RamadanModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateFastingTracker,
  onOpenQuranReader,
}) => {
  const [activeTab, setActiveTab] = useState<
    'index' | 'zakat' | 'imsakiya' | 'tracker' | 'duas' | 'khatma' | 'last10' | 'fiqh'
  >('index');
  const [calendarSearchDay, setCalendarSearchDay] = useState<number | 'all'>('all');
  const [selectedDayDetail, setSelectedDayDetail] = useState<RamadanDayImsakiya | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Comprehensive Zakat Calculator State (Requirement 4)
  const [currencySymbol, setCurrencySymbol] = useState<string>('ج.م');
  const [hawlCompleted, setHawlCompleted] = useState<boolean>(true);
  const [nisabStandard, setNisabStandard] = useState<'gold' | 'silver'>('gold');

  // 1. زكاة المال (Cash, Bank Savings, Deposits, Debts owed to you, Immediate debts to deduct)
  const [cashAndBank, setCashAndBank] = useState<string>('');
  const [depositsAndBonds, setDepositsAndBonds] = useState<string>('');
  const [receivableDebts, setReceivableDebts] = useState<string>('');
  const [immediateLiabilities, setImmediateLiabilities] = useState<string>('');

  // 2. زكاة الذهب والفضة (Gold 24k, 21k, 18k & Silver + Gram Prices)
  const [gold24Grams, setGold24Grams] = useState<string>('');
  const [gold21Grams, setGold21Grams] = useState<string>('');
  const [gold18Grams, setGold18Grams] = useState<string>('');
  const [silverGrams, setSilverGrams] = useState<string>('');
  const [gold24PricePerGram, setGold24PricePerGram] = useState<string>('4100');
  const [silverPricePerGram, setSilverPricePerGram] = useState<string>('50');

  // 3. زكاة الأسهم والعقارات والأراضي (Stocks, Commercial Real Estate, Trading Land, Saved Rental Income)
  const [tradingStocksValue, setTradingStocksValue] = useState<string>('');
  const [commercialRealEstateValue, setCommercialRealEstateValue] = useState<string>('');
  const [tradingLandValue, setTradingLandValue] = useState<string>('');
  const [savedRentalIncome, setSavedRentalIncome] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
  }, [isOpen]);

  if (!isOpen) return null;

  const parseNum = (val: string): number => {
    const cleaned = val.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return Number.isFinite(num) && num > 0 ? num : 0;
  };

  // Zakat Calculations (2.5% when Nisab & Hawl are met)
  const goldPrice24 = Math.max(1, parseNum(gold24PricePerGram));
  const silverPrice = Math.max(1, parseNum(silverPricePerGram));

  // Nisab thresholds: 85g of 24k Gold OR 595g of Silver
  const goldNisabValue = 85 * goldPrice24;
  const silverNisabValue = 595 * silverPrice;
  const activeNisabThreshold = nisabStandard === 'gold' ? goldNisabValue : silverNisabValue;

  // 1. Net Cash & Money Wealth
  const totalCashWealth =
    parseNum(cashAndBank) + parseNum(depositsAndBonds) + parseNum(receivableDebts);
  const netCashWealth = Math.max(0, totalCashWealth - parseNum(immediateLiabilities));

  // 2. Gold & Silver Wealth (Convert 21k & 18k to pure 24k equivalent grams)
  const equivalentGold24Grams =
    parseNum(gold24Grams) +
    parseNum(gold21Grams) * (21 / 24) +
    parseNum(gold18Grams) * (18 / 24);
  const totalGoldValue = equivalentGold24Grams * goldPrice24;
  const totalSilverValue = parseNum(silverGrams) * silverPrice;
  const totalMetalsWealth = totalGoldValue + totalSilverValue;

  // 3. Stocks, Real Estate & Land Wealth
  const totalStocksAndRealEstateWealth =
    parseNum(tradingStocksValue) +
    parseNum(commercialRealEstateValue) +
    parseNum(tradingLandValue) +
    parseNum(savedRentalIncome);

  // Combined Zakatable Pool
  const grandTotalZakatableWealth =
    netCashWealth + totalMetalsWealth + totalStocksAndRealEstateWealth;

  const isNisabReached = grandTotalZakatableWealth >= activeNisabThreshold;
  const isZakatDue = isNisabReached && hawlCompleted && grandTotalZakatableWealth > 0;

  // 2.5% (1 / 40) Zakat Breakdown
  const cashZakatDue = isZakatDue ? netCashWealth * 0.025 : 0;
  const metalsZakatDue = isZakatDue ? totalMetalsWealth * 0.025 : 0;
  const stocksRealEstateZakatDue = isZakatDue ? totalStocksAndRealEstateWealth * 0.025 : 0;
  const totalZakatDue = isZakatDue ? grandTotalZakatableWealth * 0.025 : 0;

  const handleResetZakatCalculator = () => {
    setCashAndBank('');
    setDepositsAndBonds('');
    setReceivableDebts('');
    setImmediateLiabilities('');
    setGold24Grams('');
    setGold21Grams('');
    setGold18Grams('');
    setSilverGrams('');
    setTradingStocksValue('');
    setCommercialRealEstateValue('');
    setTradingLandValue('');
    setSavedRentalIncome('');
    setHawlCompleted(true);
  };

  // Generate Imsakiya based on user's exact city, calculation method, Asr juristic method, and manual adjustments
  const imsakiyaList = calculateRamadanCalendar(
    user.city,
    user.calculationMethod,
    user.asrJuristicMethod || 'standard',
    user.manualPrayerAdjustments || {}
  );

  // Today's prayer times for sharing
  const todayPrayers = calculatePrayerTimes(
    user.city,
    new Date(),
    user.calculationMethod,
    user.asrJuristicMethod || 'standard',
    user.manualPrayerAdjustments || {},
    user.dstMode
  );
  const todayFajr = todayPrayers.find((p) => p.key === 'fajr');
  const todayMaghrib = todayPrayers.find((p) => p.key === 'maghrib');

  // Fasting tracker state
  const trackerData = user.ramadanFastingTracker || {};
  const totalFastedDays = Object.values(trackerData).filter((d) => d.fasted).length;
  const totalTaraweehDays = Object.values(trackerData).filter((d) => d.taraweeh).length;

  const handleToggleDayDeed = (day: number, field: keyof RamadanFastingDayRecord) => {
    if (!onUpdateFastingTracker) return;
    const currentDayRecord = trackerData[day] || {
      fasted: false,
      prayedCongregation: false,
      taraweeh: false,
      charity: false,
      quranRead: false,
    };
    onUpdateFastingTracker(day, {
      [field]: !currentDayRecord[field],
    });
  };

  const handleShareImsakiya = async () => {
    const imsakStr = todayFajr
      ? new Date(todayFajr.timestamp.getTime() - 10 * 60000).toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    await shareIslamicText({
      title: `إمساكية شهر رمضان المبارك - ${user.city.name}`,
      body: `مواعيد اليوم في ${user.city.name} (${user.city.country}):\n• موعد الإمساك: ${imsakStr}\n• أذان الفجر: ${todayFajr?.time || ''}\n• أذان المغرب (الإفطار): ${todayMaghrib?.time || ''}`,
      source: 'تطبيق المؤذن',
      extraFooter: 'تقبل الله منا ومنكم الصيام والقيام وصالح الأعمال 🌙',
    });
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const ramadanDuas = [
    {
      title: 'دعاء الإفطار المأثور (عند الفطر)',
      arabic: '«ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ»',
      source: 'رواه أبو داود وحسنه الألباني',
      fadl: 'يُسن للصائم أن يقوله عقب الإفطار مباشرة، وفيه إقرار بنعمة الله وتمام الصيام.',
    },
    {
      title: 'دعاء ليلة القدر المأثور',
      arabic: '«اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي»',
      source: 'رواه الترمذي وصححه عن أم المؤمنين عائشة رضي الله عنها',
      fadl: 'أوصى به النبي ﷺ أم المؤمنين عائشة رضي الله عنها إن وافقت ليلة القدر.',
    },
    {
      title: 'دعاء صلاة الوتر والقنوت في التراويح',
      arabic: '«اللَّهُمَّ اهْدِنَا فِيمَنْ هَدَيْتَ، وَعَافِنَا فِيمَنْ عَافَيْتَ، وَتَوَلَّنَا فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لَنَا فِيمَا أَعْطَيْتَ، وَقِنَا شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلا يُقْضَى عَلَيْكَ، إِنَّهُ لا يَذِلُّ مَنْ وَالَيْتَ، وَلا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ»',
      source: 'سنن أبي داود والترمذي',
      fadl: 'دعاء القنوت في صلاة الوتر خلف الإمام أو منفردًا في ليالي رمضان.',
    },
    {
      title: 'دعاء إذا أفطر عند أهل بيت',
      arabic: '«أَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ، وَأَكَلَ طَعَامَكُمُ الأَبْرَارُ، وَصَلَّتْ عَلَيْكُمُ الْمَلائِكَةُ»',
      source: 'رواه أبو داود والنسائي',
      fadl: 'الدعاء لصاحب الطعام بالبركة والرحمة والمغفرة.',
    },
    {
      title: 'دعاء اليوم الأول من رمضان',
      arabic: 'اللَّهُمَّ اجْعَلْ صِيَامِي فِيهِ صِيَامَ الصَّائِمِينَ، وَقِيَامِي فِيهِ قِيَامَ القَائِمِينَ، وَنَبِّهْنِي فِيهِ عَنْ نَوْمَةِ الغَافِلِينَ، وَهَبْ لِي جُرْمِي فِيهِ يَا إِلَهَ العَالَمِينَ، وَاعْفُ عَنِّي يَا عَافِيًا عَنِ المُجْرِمِينَ.',
      source: 'أدعية أيام شهر رمضان المباركة',
      fadl: 'استفتاح الشهر الفضيل بطلب القبول واليقظة من الغفلة.',
    },
    {
      title: 'دعاء اليوم الثاني من رمضان',
      arabic: 'اللَّهُمَّ قَرِّبْنِي فِيهِ إِلَى مَرْضَاتِكَ، وَجَنِّبْنِي فِيهِ مِنْ سَخَطِكَ وَنَقِمَاتِكَ، وَوَفِّقْنِي فِيهِ لِقِرَاءَةِ آيَاتِكَ، بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ.',
      source: 'أدعية أيام شهر رمضان المباركة',
      fadl: 'سؤال التوفيق لتلاوة القرآن والعمل بما يرضي الله.',
    },
    {
      title: 'دعاء اليوم الثالث من رمضان',
      arabic: 'اللَّهُمَّ ارْزُقْنِي فِيهِ الذِّهْنَ وَالتَّنْبِيهَ، وَبَاعِدْنِي فِيهِ مِنَ السَّفَاهَةِ وَالتَّمْوِيهِ، وَاجْعَلْ لِي نَصِيبًا مِنْ كُلِّ خَيْرٍ تُنْزِلُ فِيهِ بِجُودِكَ يَا أَجْوَدَ الأَجْوَدِينَ.',
      source: 'أدعية أيام شهر رمضان المباركة',
      fadl: 'طلب النصيب الوافر من بركات الشهر ونفحاته.',
    },
    {
      title: 'دعاء اليوم الرابع من رمضان',
      arabic: 'اللَّهُمَّ قَوِّنِي فِيهِ عَلَى إِقَامَةِ أَمْرِكَ، وَأَذِقْنِي فِيهِ حَلَاوَةَ ذِكْرِكَ، وَأَوْزِعْنِي فِيهِ لِأَدَاءِ شُكْرِكَ بِكَرَمِكَ، وَاحْفَظْنِي فِيهِ بِحِفْظِكَ وَسِتْرِكَ يَا أَبْصَرَ النَّاظِرِينَ.',
      source: 'أدعية أيام شهر رمضان المباركة',
      fadl: 'الاستعانة بالله على الطاعة وتذوق حلاوة الذكر والشكر.',
    },
    {
      title: 'دعاء اليوم الخامس من رمضان',
      arabic: 'اللَّهُمَّ اجْعَلْنِي فِيهِ مِنَ المُسْتَغْفِرِينَ، وَاجْعَلْنِي فِيهِ مِنْ عِبَادِكَ الصَّالِحِينَ القَانِتِينَ، وَاجْعَلْنِي فِيهِ مِنْ أَوْلِيَائِكَ المُقَرَّبِينَ بِرَأْفَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ.',
      source: 'أدعية أيام شهر رمضان المباركة',
      fadl: 'الانتظام في سلك المستغفرين بالأسحار والقانتين.',
    },
    {
      title: 'دعاء العشر الأوائل (رحمة الله الواسعة)',
      arabic: 'اللَّهُمَّ يَا وَاسِعَ الرَّحْمَةِ، شَمِلْنَا فِي هَذِهِ الأَيَّامِ المُبَارَكَةِ بِرَحْمَتِكَ الَّتِي وَسِعَتْ كُلَّ شَيْءٍ، وَاشْرَحْ صُدُورَنَا لِلْإِيمَانِ، وَبَلِّغْنَا تَمَامَ الصِّيَامِ وَالقِيَامِ عَلَى الوَجْهِ الَّذِي يُرْضِيكَ عَنَّا.',
      source: 'دعاء جامع لرمضان',
      fadl: 'مناجاة جامعة لطلب الرحمة والقبول في أيام رمضان.',
    },
    {
      title: 'دعاء العشر الأوسط (مغفرة الذنوب)',
      arabic: 'اللَّهُمَّ اغْفِرْ لَنَا فِي شَهْرِ رَمَضَانَ مَا قَدَّمْنَا وَمَا أَخَّرْنَا، وَمَا أَسْرَرْنَا وَمَا أَعْلَنَّا، وَطَهِّرْ قُلُوبَنَا مِنَ النِّفَاقِ، وَأَعْمَالَنَا مِنَ الرِّيَاءِ، وَأَلْسِنَتَنَا مِنَ الكَذِبِ، وَأَعْيُنَنَا مِنَ الخِيَانَةِ.',
      source: 'دعاء جامع لرمضان',
      fadl: 'تزكية النفس وطلب المغفرة الخالصة في شهر الصيام.',
    },
    {
      title: 'دعاء العشر الأواخر والعتق من النيران',
      arabic: 'اللَّهُمَّ إِنَّكَ جَعَلْتَ فِي كُلِّ لَيْلَةٍ مِنْ لَيَالِي رَمَضَانَ عُتَقَاءَ مِنَ النَّارِ، فَاجْعَلْنَا وَوَالِدِينَا وَأَهْلِينَا وَمَنْ نُحِبُّ مِنْ عُتَقَائِكَ مِنَ النَّارِ، وَبَلِّغْنَا لَيْلَةَ القَدْرِ وَاجْعَلْنَا فِيهَا مِنَ المَقْبُولِينَ الفَائِزِينَ.',
      source: 'دعاء جامع للعشر الأواخر',
      fadl: 'أعظم ما يسأله المؤمن في ليالي العشر الأواخر من رمضان.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F6F2] flex flex-col overflow-hidden select-none animate-fadeIn">
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#F7F6F2] text-[#172A28] relative">
        {/* Clean White Header */}
        <div className="bg-white text-[#172A28] px-4 pt-5 pb-3 flex items-center justify-between shadow-sm border-b border-gray-100 relative shrink-0" dir="rtl">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (activeTab !== 'index') {
                  setActiveTab('index');
                } else {
                  onClose();
                }
              }}
              className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
              aria-label="رجوع"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">
                  {activeTab === 'index'
                    ? 'قسم شهر رمضان المبارك'
                    : activeTab === 'zakat'
                    ? 'حاسبة الزكاة الشاملة (2.5%)'
                    : activeTab === 'imsakiya'
                    ? 'إمساكية 30 يوماً'
                    : activeTab === 'tracker'
                    ? 'يوميات الصائم ومتابعة العبادات'
                    : activeTab === 'duas'
                    ? 'أدعية رمضان والعتق من النيران'
                    : activeTab === 'khatma'
                    ? 'جدول ختمة القرآن الكريم'
                    : activeTab === 'last10'
                    ? 'العشر الأواخر وليلة القدر'
                    : 'موسوعة فقه الصيام وزكاة الفطر'}
                </h2>
                <span className="text-[10px] bg-[#C5A059]/15 text-[#9A7732] px-2 py-0.5 rounded-full font-bold">
                  1447 هـ
                </span>
              </div>
              <span className="text-[11px] text-gray-500 block">
                {activeTab === 'index'
                  ? `فهرس رمضان المنظم • مدينة ${user.city.name} (${user.city.country})`
                  : 'صفحة مستقلة للتفاصيل • اضغط للعودة إلى فهرس رمضان'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeTab !== 'index' && (
              <button
                onClick={() => setActiveTab('index')}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 text-xs font-bold cursor-pointer"
              >
                <span>الفهرس</span>
              </button>
            )}
            <button
              onClick={handleShareImsakiya}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] transition-colors cursor-pointer text-white text-xs font-bold"
              title="مشاركة الإمساكية"
            >
              <Share2 className="w-4 h-4 text-[#C5A059]" />
              <span>مشاركة</span>
            </button>
          </div>
        </div>

        {/* Real-time Toast if copied */}
        {copiedMessage && (
          <div className="bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 text-center shrink-0">
            ✓ تم تجهيز ومشاركة مواعيد الإمساكية بنجاح!
          </div>
        )}

        {/* Detail Back Bar when inside an independent section */}
        {activeTab !== 'index' && (
          <div className="bg-white px-4 py-2 border-b border-gray-200 flex items-center justify-between shrink-0" dir="rtl">
            <button
              onClick={() => setActiveTab('index')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] text-xs font-bold cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة إلى فهرس رمضان الرئيسي</span>
            </button>
            <span className="text-[11px] font-bold text-[#C5A059]">صفحة مستقلة للتفاصيل</span>
          </div>
        )}

        {/* Content View Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* VERTICAL INDEX VIEW (Main Page of Ramadan Section) */}
          {activeTab === 'index' && (
            <div className="space-y-2.5" dir="rtl">
              <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#172A28] font-cairo">فهرس أقسام وعناصر شهر رمضان</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    اختر أي قسم من الفهرس الرأسي لفتح صفحته المستقلة بكامل التفاصيل
                  </p>
                </div>
                <span className="text-xs font-bold text-[#C5A059] bg-[#F7F6F2] px-3 py-1 rounded-full">
                  7 أقسام
                </span>
              </div>

              {[
                {
                  id: 'zakat' as const,
                  num: 1,
                  title: 'حاسبة الزكاة الشاملة (المال، الذهب والفضة، الأسهم والعقارات)',
                  subtitle: 'حساب دقيق للزكاة المستحقة بنسبة 2.5% عند بلوغ النصاب ومرور الحول',
                  badge: '2.5% زكاة',
                },
                {
                  id: 'imsakiya' as const,
                  num: 2,
                  title: 'إمساكية 30 يوماً ومواقيت الإفطار والسحور',
                  subtitle: `جدول الإمساكية الفلكي الكامل لمدينة ${user.city.name} مع تفاصيل كل يوم`,
                  badge: '30 يوماً',
                },
                {
                  id: 'tracker' as const,
                  num: 3,
                  title: 'يوميات الصائم ومتابعة العبادات اليومية',
                  subtitle: `سجل صيامك وصلواتك والتراويح والصدقة (${totalFastedDays}/30 يوماً مسجلاً)`,
                  badge: `${totalFastedDays}/30 يوم`,
                },
                {
                  id: 'duas' as const,
                  num: 4,
                  title: 'أدعية رمضان والإفطار والسحور والعتق',
                  subtitle: 'أدعية مأثورة لكل أيام الشهر والعشر الأواخر مع المشاركة كبطاقة مصورة',
                  badge: `${ramadanDuas.length} دعاء`,
                },
                {
                  id: 'khatma' as const,
                  num: 5,
                  title: 'جدول ختمة القرآن الكريم في رمضان',
                  subtitle: 'خطط منظمة لختم القرآن مرة أو مرتين أو ثلاث مرات مع متابعة القراءة',
                  badge: '3 خطط',
                },
                {
                  id: 'last10' as const,
                  num: 6,
                  title: 'العشر الأواخر وتحري ليلة القدر المباركة',
                  subtitle: 'الليالي الوترية، دعاء ليلة القدر، وبرنامج إحياء العشر الأواخر',
                  badge: 'ليلة القدر',
                },
                {
                  id: 'fiqh' as const,
                  num: 7,
                  title: 'موسوعة فقه الصيام وزكاة الفطر بالأدلة',
                  subtitle: 'أحكام الصيام، المفطرات، الرخص الشرعية، وأحكام زكاة الفطر بالتفصيل',
                  badge: `${RAMADAN_FIQH_ENCYCLOPEDIA.length} أبواب`,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="w-full text-right bg-white hover:bg-[#FAF9F5] p-4 rounded-2xl border border-gray-100 hover:border-[#C5A059]/60 shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#104B40] text-[#C5A059] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {item.num}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#172A28] group-hover:text-[#104B40] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C5A059]/15 text-[#9A7732]">
                      {item.badge}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB: COMPREHENSIVE ZAKAT CALCULATOR (Requirement 4) */}
          {activeTab === 'zakat' && (
            <div className="space-y-3.5 text-right" dir="rtl">
              {/* Top Result & Summary Banner */}
              <div className="bg-gradient-to-br from-[#104B40] via-[#0E3F35] to-[#082A23] text-white p-4 rounded-2xl shadow-md border border-[#C5A059]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black font-cairo text-amber-200">
                        نتيجة حساب الزكاة الشرعية (2.5%)
                      </h3>
                      <span className="text-[10px] text-emerald-100 block">
                        ربع العشر (2.5%) عند بلوغ النصاب ومرور الحول القمري (الهجري)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetZakatCalculator}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
                    title="إعادة الحساب وتصفير القيم"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة الحساب</span>
                  </button>
                </div>

                {/* Main Zakat Result Box */}
                <div className="bg-white/10 rounded-2xl p-3.5 border border-white/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-emerald-100 block font-bold">
                      إجمالي الزكاة المستحقة الواجب إخراجها:
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-[#C5A059]">
                        {totalZakatDue.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-xs font-bold text-amber-200">{currencySymbol}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 w-fit ${
                        isZakatDue
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                          : 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                      }`}
                    >
                      {isZakatDue
                        ? '✓ بلغ النصاب وحال عليه الحول — تجب فيه الزكاة'
                        : !hawlCompleted
                        ? 'لم يمر الحول الكامل بعد'
                        : grandTotalZakatableWealth === 0
                        ? 'أدخل قيم الأموال بالأسفل لبدء الحساب'
                        : 'لم يبلغ النصاب الشرعي بعد'}
                    </span>
                    <span className="text-[10px] text-emerald-200 font-mono">
                      إجمالي الوعاء الزكوي:{' '}
                      {grandTotalZakatableWealth.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                      })}{' '}
                      {currencySymbol} | النصاب:{' '}
                      {activeNisabThreshold.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      {currencySymbol}
                    </span>
                  </div>
                </div>

                {/* Category Breakdown Pills */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-black/20 rounded-xl p-2 border border-white/10">
                    <span className="text-[10px] text-emerald-200 block">زكاة المال والنقود</span>
                    <span className="text-xs font-black font-mono text-amber-300 mt-0.5 block">
                      {cashZakatDue.toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
                      {currencySymbol}
                    </span>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2 border border-white/10">
                    <span className="text-[10px] text-emerald-200 block">زكاة الذهب والفضة</span>
                    <span className="text-xs font-black font-mono text-amber-300 mt-0.5 block">
                      {metalsZakatDue.toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
                      {currencySymbol}
                    </span>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2 border border-white/10">
                    <span className="text-[10px] text-emerald-200 block">الأسهم والعقارات</span>
                    <span className="text-xs font-black font-mono text-amber-300 mt-0.5 block">
                      {stocksRealEstateZakatDue.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                      })}{' '}
                      {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nisab & Hawl Settings Card */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#104B40]" />
                    <h4 className="text-xs font-black text-[#172A28]">
                      إعدادات النصاب الشرعي ومرور الحول والعملة
                    </h4>
                  </div>
                  <select
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="bg-[#F7F6F2] border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-[#172A28]"
                  >
                    <option value="ج.م">جنيه مصري (ج.م)</option>
                    <option value="ر.س">ريال سعودي (ر.س)</option>
                    <option value="د.إ">درهم إماراتي (د.إ)</option>
                    <option value="د.ك">دينار كويتي (د.ك)</option>
                    <option value="$">دولار أمريكي ($)</option>
                    <option value="€">يورو (€)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      سعر جرام الذهب عيار 24 اليوم ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={gold24PricePerGram}
                      onChange={(e) => setGold24PricePerGram(e.target.value)}
                      placeholder="مثال: 4100"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#104B40]"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      نصاب الذهب (85 جرام عيار 24) ={' '}
                      {goldNisabValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}{' '}
                      {currencySymbol}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      سعر جرام الفضة الخام اليوم ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={silverPricePerGram}
                      onChange={(e) => setSilverPricePerGram(e.target.value)}
                      placeholder="مثال: 50"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#104B40]"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      نصاب الفضة (595 جرام) ={' '}
                      {silverNisabValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}{' '}
                      {currencySymbol}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">معيار حساب النصاب:</span>
                    <button
                      type="button"
                      onClick={() => setNisabStandard('gold')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        nisabStandard === 'gold'
                          ? 'bg-[#104B40] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      نصاب الذهب (85 جرام)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNisabStandard('silver')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        nisabStandard === 'silver'
                          ? 'bg-[#104B40] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      نصاب الفضة (595 جرام)
                    </button>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-gray-200">
                    <input
                      type="checkbox"
                      checked={hawlCompleted}
                      onChange={(e) => setHawlCompleted(e.target.checked)}
                      className="w-4 h-4 accent-[#104B40] rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#172A28]">
                      مرور الحول القمري (عام هجري كامل)
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION 1: زكاة المال (Cash, Bank Savings, Deposits) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#104B40] flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                        1. زكاة المال (النقود والمدخرات البنكية)
                      </h4>
                      <span className="text-[10px] text-gray-500">
                        النقود السائلة، الحسابات البنكية، الودائع، والديون المرجوة الأداء
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#104B40] bg-emerald-50 px-2.5 py-1 rounded-lg">
                    صافي المال: {netCashWealth.toLocaleString('en-US')} {currencySymbol}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      النقود السائلة والأرصدة البنكية ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cashAndBank}
                      onChange={(e) => setCashAndBank(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#104B40]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      الودائع والشهادات والمحافظ المالية ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={depositsAndBonds}
                      onChange={(e) => setDepositsAndBonds(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#104B40]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      أموال وديون لك عند الغير مرجوة السداد ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={receivableDebts}
                      onChange={(e) => setReceivableDebts(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#104B40]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-rose-700 block mb-1">
                      يُخصم: الديون والالتزامات الحالةّ الواجبة السداد ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={immediateLiabilities}
                      onChange={(e) => setImmediateLiabilities(e.target.value)}
                      placeholder="0"
                      className="w-full bg-rose-50/50 border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: زكاة الذهب والفضة (Gold 24k, 21k, 18k & Silver) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#9A7732] flex items-center justify-center">
                      <Gem className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                        2. زكاة الذهب والفضة (بالجرام)
                      </h4>
                      <span className="text-[10px] text-gray-500">
                        السبائك، الجنيهات الذهبية، والذهب المدخر (يُحسب تلقائياً حسب العيار)
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#9A7732] bg-amber-50 px-2.5 py-1 rounded-lg">
                    القيمة:{' '}
                    {totalMetalsWealth.toLocaleString('en-US', { maximumFractionDigits: 0 })}{' '}
                    {currencySymbol}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      ذهب عيار 24 (جرام):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={gold24Grams}
                      onChange={(e) => setGold24Grams(e.target.value)}
                      placeholder="0 جرام"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      ذهب عيار 21 (جرام):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={gold21Grams}
                      onChange={(e) => setGold21Grams(e.target.value)}
                      placeholder="0 جرام"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      ذهب عيار 18 (جرام):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={gold18Grams}
                      onChange={(e) => setGold18Grams(e.target.value)}
                      placeholder="0 جرام"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      الفضة المدخرة (جرام):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={silverGrams}
                      onChange={(e) => setSilverGrams(e.target.value)}
                      placeholder="0 جرام"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                {equivalentGold24Grams > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl px-3 py-2 text-[11px] text-amber-950 flex items-center justify-between">
                    <span>
                      إجمالي الذهب مكافئاً لعيار 24 الصافي:{' '}
                      <strong>{equivalentGold24Grams.toFixed(2)} جرام</strong>
                    </span>
                    <span className="font-bold">
                      زكاة الذهب والفضة (2.5%):{' '}
                      { (totalMetalsWealth * 0.025).toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                      }) }{' '}
                      {currencySymbol}
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 3: زكاة الأسهم والعقارات والأراضي (Stocks, Commercial Real Estate & Land) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                        3. زكاة الأسهم والعقارات والأراضي التجارية
                      </h4>
                      <span className="text-[10px] text-gray-500">
                        الأسهم الاستثمارية، العقارات والأراضي المعدة للبيع والتجارة، وصافي الإيجارات المدخرة
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                    القيمة:{' '}
                    {totalStocksAndRealEstateWealth.toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    {currencySymbol}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      القيمة السوقية للأسهم والصناديق الاستثمارية ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tradingStocksValue}
                      onChange={(e) => setTradingStocksValue(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#104B40]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      قيمة العقارات المعدة للتجارة والبيع ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={commercialRealEstateValue}
                      onChange={(e) => setCommercialRealEstateValue(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#104B40]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      قيمة الأراضي المعروضة أو المملوكة بنية التجارة ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tradingLandValue}
                      onChange={(e) => setTradingLandValue(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#104B40]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      صافي عوائد وإيجارات العقارات المدخرة ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={savedRentalIncome}
                      onChange={(e) => setSavedRentalIncome(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-[#172A28] focus:outline-none focus:border-[#104B40]"
                    />
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-xl border border-gray-200/70 text-[11px] text-gray-600 leading-relaxed">
                  <strong className="text-[#104B40]">تنبيه فقهي مهم:</strong> العقار السكني الشخصي
                  أو السيارة الخاصة لا زكاة في عينها، أما العقارات والأراضي المشتراة بنية التجارة
                  والبيع فتجب الزكاة في قيمتها السوقية الكاملة (2.5%)، والعقارات المؤجرة تجب الزكاة
                  في صافي إيرادها المدخر إذا بلغ النصاب وحال عليه الحول.
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: IMSAKIYA (30 Days Table & Day Filter) */}
          {activeTab === 'imsakiya' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-right">
                <span className="text-[11px] text-gray-500">
                  الحساب الفلكي: {user.city.name} • {user.calculationMethod}
                </span>
                <h3 className="text-xs font-black text-gray-900">جدول إمساكية شهر رمضان المبارك</h3>
              </div>

              {/* Days filter pill slider */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setCalendarSearchDay('all')}
                  className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                    calendarSearchDay === 'all'
                      ? 'bg-[#104B40] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  كامل الشهر (30 يوم)
                </button>
                {[1, 5, 10, 15, 20, 25, 27, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setCalendarSearchDay(d)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                      calendarSearchDay === d
                        ? 'bg-[#104B40] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    يوم {d}
                  </button>
                ))}
              </div>

              {/* Table of Days */}
              <div className="space-y-2">
                {imsakiyaList
                  .filter((item) => calendarSearchDay === 'all' || item.dayNumber === calendarSearchDay)
                  .map((day) => (
                    <div
                      key={day.dayNumber}
                      onClick={() => setSelectedDayDetail(selectedDayDetail?.dayNumber === day.dayNumber ? null : day)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-right ${
                        day.isToday
                          ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                          : 'bg-white border-gray-100 hover:border-gray-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md font-bold">
                            صيام {day.fastingDurationStr}
                          </span>
                          {day.isToday && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                              اليوم
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div>
                            <span className="text-xs font-black text-gray-900 block font-quran">
                              {day.hijriDate}
                            </span>
                            <span className="text-[10px] text-gray-400 font-sans block">
                              {day.gregorianDateStr}
                            </span>
                          </div>
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                            {day.dayNumber}
                          </div>
                        </div>
                      </div>

                      {/* Prayer Grid for the day */}
                      <div className="grid grid-cols-6 gap-1 mt-2.5 pt-2 border-t border-gray-100 text-center font-mono">
                        <div className="bg-amber-50/60 p-1 rounded-lg">
                          <span className="text-[9px] text-amber-800 font-sans block font-bold">الإمساك</span>
                          <span className="text-[11px] font-bold text-gray-800">{day.imsak}</span>
                        </div>
                        <div className="bg-gray-50 p-1 rounded-lg">
                          <span className="text-[9px] text-gray-500 font-sans block">الفجر</span>
                          <span className="text-[11px] font-bold text-gray-800">{day.fajr}</span>
                        </div>
                        <div className="bg-gray-50 p-1 rounded-lg">
                          <span className="text-[9px] text-gray-500 font-sans block">الشروق</span>
                          <span className="text-[11px] font-bold text-gray-800">{day.sunrise}</span>
                        </div>
                        <div className="bg-gray-50 p-1 rounded-lg">
                          <span className="text-[9px] text-gray-500 font-sans block">الظهر</span>
                          <span className="text-[11px] font-bold text-gray-800">{day.dhuhr}</span>
                        </div>
                        <div className="bg-gray-50 p-1 rounded-lg">
                          <span className="text-[9px] text-gray-500 font-sans block">العصر</span>
                          <span className="text-[11px] font-bold text-gray-800">{day.asr}</span>
                        </div>
                        <div className="bg-emerald-100/70 p-1 rounded-lg border border-emerald-300/50">
                          <span className="text-[9px] text-emerald-900 font-sans block font-black">الإفطار</span>
                          <span className="text-[11px] font-black text-emerald-950">{day.maghrib}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 2: FASTING TRACKER (DAY BY DAY CHECKLIST) */}
          {activeTab === 'tracker' && (
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="bg-gradient-to-r from-[#104B40] to-[#0c392c] text-white p-4 rounded-2xl shadow-sm text-right">
                <h4 className="text-xs font-bold text-amber-200">مفكرة إنجاز شهر رمضان المبارك</h4>
                <p className="text-[11px] text-emerald-100 mt-1 leading-relaxed">
                  تتبّع صيامك وصلاتك وتلاوتك يوماً بيوم. تُحفظ بياناتك محلياً على جهازك دون الحاجة لحساب.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-base font-black text-amber-300 block">{totalFastedDays} / 30</span>
                    <span className="text-[10px] text-emerald-100">أيام الصيام المنجزة</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-base font-black text-amber-300 block">{totalTaraweehDays} / 30</span>
                    <span className="text-[10px] text-emerald-100">ليالي التراويح والقيام</span>
                  </div>
                </div>
              </div>

              {/* Day by Day checklist */}
              <div className="space-y-2">
                {imsakiyaList.map((day) => {
                  const record = trackerData[day.dayNumber] || {
                    fasted: false,
                    prayedCongregation: false,
                    taraweeh: false,
                    charity: false,
                    quranRead: false,
                  };

                  return (
                    <div
                      key={day.dayNumber}
                      className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-right space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-sans text-gray-400">
                          {day.gregorianDateStr}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-quran text-gray-800">
                            اليوم {day.dayNumber} من رمضان
                          </span>
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                            {day.dayNumber}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Action Badges */}
                      <div className="grid grid-cols-5 gap-1 pt-1 border-t border-gray-50 text-[10px] font-bold">
                        {/* 1. الصيام */}
                        <button
                          onClick={() => handleToggleDayDeed(day.dayNumber, 'fasted')}
                          className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                            record.fasted
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {record.fasted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>صيام اليوم</span>
                        </button>

                        {/* 2. صلاة الجماعة */}
                        <button
                          onClick={() => handleToggleDayDeed(day.dayNumber, 'prayedCongregation')}
                          className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                            record.prayedCongregation
                              ? 'bg-[#104B40] text-white border-emerald-800 shadow-xs'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {record.prayedCongregation ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>الصلوات بالمسجد</span>
                        </button>

                        {/* 3. التراويح والقيام */}
                        <button
                          onClick={() => handleToggleDayDeed(day.dayNumber, 'taraweeh')}
                          className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                            record.taraweeh
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {record.taraweeh ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>التراويح والقيام</span>
                        </button>

                        {/* 4. الورد القرآني */}
                        <button
                          onClick={() => handleToggleDayDeed(day.dayNumber, 'quranRead')}
                          className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                            record.quranRead
                              ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {record.quranRead ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>ورد القرآن</span>
                        </button>

                        {/* 5. صدقة اليوم */}
                        <button
                          onClick={() => handleToggleDayDeed(day.dayNumber, 'charity')}
                          className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                            record.charity
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {record.charity ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          <span>صدقة اليوم</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: THE LAST 10 NIGHTS & LAYLAT AL-QADR */}
          {activeTab === 'last10' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-[#0a231c] via-[#104b3a] to-[#1a382c] text-white p-4 rounded-2xl shadow-md text-right space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-amber-400 text-emerald-950 font-black px-2.5 py-0.5 rounded-full">
                    خيرٌ من ألف شهر
                  </span>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black font-quran text-amber-200">
                      العشر الأواخر وليلة القدر
                    </h3>
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-100 leading-relaxed font-sans">
                  كان النبي ﷺ إذا دخلت العشر الأواخر شد مئزره، وأحيا ليله، وأيقظ أهله حرصاً على إدراك ليلة القدر التي قال الله تعالى عنها: {`{لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ}`}.
                </p>
              </div>

              {/* Supplication of Laylat al-Qadr Card */}
              <div className="bg-amber-50/90 border border-amber-300/80 p-4 rounded-2xl text-center space-y-2">
                <span className="text-xs font-bold text-amber-900 block">
                  دعاء ليلة القدر الموصى به من النبي ﷺ
                </span>
                <p className="text-lg font-black font-quran text-emerald-950 leading-relaxed py-1">
                  «اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي»
                </p>
                <p className="text-[10px] text-amber-800 font-sans">
                  عن عائشة رضي الله عنها قالت: قلت يا رسول الله، أرأيت إن علمت أي ليلة ليلة القدر ما أقول فيها؟ قال: «قولي: اللهم إنك عفو تحب العفو فاعف عني».
                </p>
              </div>

              {/* Odd Nights of the Last 10 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-800 text-right">
                  ليالي الوتر المرجوة (تحري ليلة القدر):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { night: 'ليلة 21 رمضان', desc: 'أولى الليالي الوترية من العشر الأواخر' },
                    { night: 'ليلة 23 رمضان', desc: 'الليلة الوترية الثانية، فضل عظيم واستغفار' },
                    { night: 'ليلة 25 رمضان', desc: 'انتصاف العشر الأواخر ومضاعفة الاجتهاد' },
                    { night: 'ليلة 27 رمضان', desc: 'أرجى الليالي عند جمهور من الصحابة والعلماء' },
                    { night: 'ليلة 29 رمضان', desc: 'خاتمة الليالي الوترية ووداع الشهر الفضيل' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-gray-200/80 text-right shadow-xs flex items-center justify-between"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold font-quran text-gray-900 block">
                          {item.night}
                        </span>
                        <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Worship Schedule */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs text-right space-y-2">
                <h4 className="text-xs font-black text-gray-800">برنامج إحياء العشر الأواخر:</h4>
                <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc list-inside">
                  <li>الاعتكاف أو لزوم المسجد ما تيسر بعد صلاة العشاء والتراويح.</li>
                  <li>صلاة التهجد في الثلث الأخير من الليل مع إطالة السجود والركوع.</li>
                  <li>الإكثار من الصدقة اليومية ولو بالقليل لنيل ثواب ألف شهر.</li>
                  <li>المحافظة على أذكار الصباح والمساء والاستغفار بالأسحار.</li>
                  <li>كثرة ترديد: «اللهم إنك عفو تحب العفو فاعف عني».</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: RAMADAN DUAS & REMEMBRANCES */}
          {activeTab === 'duas' && (
            <div className="space-y-3">
              <div className="text-right">
                <h3 className="text-xs font-black text-gray-900">أدعية رمضان والإفطار والسحور المأثورة</h3>
                <span className="text-[11px] text-gray-500">
                  قال النبي ﷺ: «ثلاثة لا ترد دعوتهم: الصائم حتى يفطر...»
                </span>
              </div>

              <div className="space-y-2.5">
                {ramadanDuas.map((d, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs text-right space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            shareOrDownloadAsImageCard({
                              categoryBadge: 'أدعية شهر رمضان المبارك',
                              title: d.title,
                              mainText: d.arabic,
                              referenceText: `${d.source} — ${d.fadl}`,
                            })
                          }
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-[#9A7732] hover:bg-amber-100 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>بطاقة (5 خلفيات)</span>
                        </button>
                        <button
                          onClick={() =>
                            shareIslamicText({
                              title: `رمضان • ${d.title}`,
                              body: d.arabic,
                              source: `${d.source} — ${d.fadl}`,
                            })
                          }
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#104B40] hover:bg-emerald-100 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>نص</span>
                        </button>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                          {d.source}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-[#104B40] font-quran">{d.title}</h4>
                    </div>

                    <p className="text-sm font-bold font-quran text-gray-900 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 leading-relaxed">
                      {d.arabic}
                    </p>

                    <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                      {d.fadl}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: KHATMA PLANNER IN RAMADAN */}
          {activeTab === 'khatma' && (
            <div className="space-y-3 text-right">
              <div className="bg-gradient-to-r from-[#104B40] to-[#0B3D35] text-white p-4 rounded-2xl shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-amber-200">جدول ختم القرآن الكريم في رمضان</h4>
                <p className="text-[11px] text-emerald-100 leading-relaxed font-sans">
                  القرآن الكريم 604 صفحات، مقسم إلى 30 جزءاً. يمكنك اختيار وتيرة الختمة التي تناسبك:
                </p>
              </div>

              {/* Options of Khatma */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs text-center space-y-1">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    ختمة واحدة (30 يوماً)
                  </span>
                  <p className="text-base font-black text-gray-900 mt-1">جزء واحد يومياً</p>
                  <p className="text-[10px] text-gray-500">20 صفحة في اليوم (4 صفحات بعد كل صلاة مكتوبة)</p>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs text-center space-y-1">
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    ختمتان (15 يوماً لكل ختمة)
                  </span>
                  <p className="text-base font-black text-gray-900 mt-1">جزآن يومياً</p>
                  <p className="text-[10px] text-gray-500">40 صفحة في اليوم (8 صفحات بعد كل صلاة مكتوبة)</p>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-teal-200 shadow-xs text-center space-y-1">
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                    ثلاث ختمات (10 أيام لكل ختمة)
                  </span>
                  <p className="text-base font-black text-gray-900 mt-1">3 أجزاء يومياً</p>
                  <p className="text-[10px] text-gray-500">60 صفحة في اليوم (12 صفحة بعد كل صلاة مكتوبة)</p>
                </div>
              </div>

              {/* Direct Quran Access Button */}
              {onOpenQuranReader && (
                <button
                  onClick={() => onOpenQuranReader(1, 1, user.lastReadPage || 1)}
                  className="w-full bg-[#104B40] hover:bg-[#0B3D35] text-white py-3 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>متابعة القراءة من صفحة {user.lastReadPage || 1} ({user.lastReadSurahName || 'سورة الفاتحة'})</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 6: FIQH OF FASTING, VIRTUES OF RAMADAN & LAYLAT AL-QADR */}
          {activeTab === 'fiqh' && (
            <div className="space-y-3 text-right" dir="rtl">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <h3 className="text-sm font-black text-[#104B40] font-cairo">
                  موسوعة فقه الصيام وفضائل رمضان وليلة القدر وزكاة الفطر
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  أحكام شرعية موثقة بأدلتها من القرآن الكريم والسنة النبوية الصحيحة وأقوال أهل العلم.
                </p>
              </div>

              {RAMADAN_FIQH_ENCYCLOPEDIA.map((sec) => (
                <div
                  key={sec.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2.5"
                >
                  <h4 className="text-sm font-black text-[#172A28] font-cairo border-b border-gray-100 pb-2">
                    {sec.title}
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">{sec.summary}</p>
                  <ul className="space-y-1.5 text-xs text-gray-800">
                    {sec.details.map((r, i) => (
                      <li key={i} className="bg-[#F7F6F2] p-2.5 rounded-xl leading-relaxed">
                        ✦ {r}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70">
                    <span className="text-[10px] font-bold text-[#9A7732] block mb-0.5">الدليل الشرعي:</span>
                    <p className="text-xs font-bold font-amiri text-[#172A28] leading-loose">{sec.evidence}</p>
                  </div>
                  <div className="text-[10px] text-gray-500 pt-1">
                    <strong className="text-[#104B40]">المصدر الموثق:</strong> {sec.source}
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
