import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Menu,
  Share2,
  Copy,
  Check,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AZKAR_LIST, TASBIH_PHRASES } from '../../data/azkarData';
import { AzkarItem, AzkarCategoryKey } from '../../types';
import { soundService } from '../../utils/audioPlayer';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';
import { userStatsTracker } from '../../utils/userStatsTracker';

interface AzkarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncrementTotalTasbih: (amount: number) => void;
}

const AZKAR_PROGRESS_KEY = 'moazen_azkar_progress_v3';

export const AzkarModal: React.FC<AzkarModalProps> = ({
  isOpen,
  onClose,
  onIncrementTotalTasbih,
}) => {
  const [viewMode, setViewMode] = useState<'index' | 'detail'>('index');
  const [activeTab, setActiveTab] = useState<'azkar' | 'tasbih'>('azkar');
  const [azkarCategory, setAzkarCategory] = useState<AzkarCategoryKey>('sabah');
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [azkarItems, setAzkarItems] = useState<AzkarItem[]>(() => {
    try {
      const saved = localStorage.getItem(AZKAR_PROGRESS_KEY);
      if (saved) {
        const countsMap: Record<string, number> = JSON.parse(saved);
        return AZKAR_LIST.map((item) => ({
          ...item,
          currentCount: countsMap[item.id] ?? 0,
        }));
      }
    } catch {}
    return AZKAR_LIST;
  });

  const [playingAudioTrack, setPlayingAudioTrack] = useState<string | null>(null);

  // Digital Tasbih state
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState(0);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [targetCount, setTargetCount] = useState<number>(33);
  const [beadRotation, setBeadRotation] = useState(0);

  useEffect(() => {
    try {
      const countsMap: Record<string, number> = {};
      azkarItems.forEach((i) => {
        if (i.currentCount > 0) countsMap[i.id] = i.currentCount;
      });
      localStorage.setItem(AZKAR_PROGRESS_KEY, JSON.stringify(countsMap));
    } catch {}
  }, [azkarItems]);

  if (!isOpen) return null;

  const currentPhrase = TASBIH_PHRASES[selectedPhraseIndex];

  const handleToggleAzkarAudio = () => {
    const file =
      azkarCategory === 'masaa' ? '/audio/azkar_massa.mp3' : '/audio/azkar_sabah.mp3';
    if (playingAudioTrack === file) {
      soundService.stopAudio();
      setPlayingAudioTrack(null);
    } else {
      setPlayingAudioTrack(file);
      soundService.playTrack(file, file, 'azkar', () => setPlayingAudioTrack(null));
    }
  };

  const handleIncrementAzkar = (id: string, maxCount: number) => {
    soundService.playTasbihClick();
    onIncrementTotalTasbih(1);
    setAzkarItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextCount = item.currentCount + 1;
          if (nextCount === maxCount) {
            userStatsTracker.recordAzkarCompleted(id);
            soundService.playSuccessCelebration();
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
            });
          }
          return {
            ...item,
            currentCount: Math.min(maxCount, nextCount),
          };
        }
        return item;
      })
    );
  };

  const handleResetCategory = () => {
    setAzkarItems((prev) =>
      prev.map((item) =>
        item.category === azkarCategory ? { ...item, currentCount: 0 } : item
      )
    );
  };

  const handleTapTasbih = () => {
    soundService.playTasbihClick();
    const next = tasbihCount + 1;
    setTasbihCount(next);
    setBeadRotation((r) => r + 15);
    onIncrementTotalTasbih(1);

    if (targetCount > 0 && next % targetCount === 0) {
      soundService.playSuccessCelebration();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleResetTasbih = () => {
    setTasbihCount(0);
  };

  const filteredAzkar = azkarItems.filter((i) => i.category === azkarCategory);

  const categoryTabs: { id: AzkarCategoryKey; label: string; desc: string }[] = [
    { id: 'sabah', label: 'أذكار الصباح', desc: 'تقال من بعد صلاة الفجر حتى شروق الشمس وارتفاعها' },
    { id: 'masaa', label: 'أذكار المساء', desc: 'تقال من بعد صلاة العصر حتى غروب الشمس' },
    { id: 'salah', label: 'أذكار بعد الصلاة', desc: 'الأذكار والتسابيح المأثورة عقب الصلوات المفروضة' },
    { id: 'sleep', label: 'أذكار النوم', desc: 'أذكار التحصين والسكينة عنداوي إلى الفراش' },
    { id: 'wake', label: 'أذكار الاستيقاظ', desc: 'أذكار الحمد والتوحيد عند الاستيقاظ من النوم' },
    { id: 'mosque', label: 'الوضوء والأذان والمسجد', desc: 'أذكار الطهارة، ترديد الأذان، ودخول المسجد والخروج منه' },
    { id: 'home', label: 'المنزل والخلاء واللباس', desc: 'أذكار دخول المنزل والخروج منه ولبس الثياب' },
    { id: 'food', label: 'الطعام والشراب والضيافة', desc: 'أذكار التسمية والحمد عند الطعام والدعاء للمضيف' },
    { id: 'travel', label: 'السفر والركوب والسوق', desc: 'دعاء السفر وركوب الدابة ودخول السوق' },
    { id: 'distress', label: 'الكرب والهم والمرض', desc: 'أدعية وأذكار تفريج الكرب والهم وزيارة المريض' },
    { id: 'nature', label: 'المطر والريح والهلال', desc: 'ما يقال عند نزول المطر وهبوب الريح ورؤية الهلال' },
    { id: 'general', label: 'المجالس والتسابيح الجامعة', desc: 'كفارة المجلس والأذكار المضاعفة الأجر والثواب' },
  ];

  const handleCopyDhikr = (item: AzkarItem) => {
    const catLabel = categoryTabs.find((c) => c.id === item.category)?.label || 'الأذكار';
    const text = `📿 ${catLabel}\n\n${item.text}\n\n${item.fadl ? `✨ الفضل: ${item.fadl}\n` : ''}📚 المصدر: ${item.source || 'حصن المسلم'}\n— تطبيق المؤذن`;
    navigator.clipboard?.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareDhikr = async (item: AzkarItem) => {
    const catLabel = categoryTabs.find((c) => c.id === item.category)?.label || 'الأذكار';
    await shareIslamicText({
      title: catLabel,
      body: item.text,
      source: item.source || 'حصن المسلم',
      extraFooter: item.fadl ? `الفضل: ${item.fadl} (التكرار: ${item.count})` : undefined,
    });
  };

  const handleShareDhikrImage = async (item: AzkarItem) => {
    const catLabel = categoryTabs.find((c) => c.id === item.category)?.label || 'الأذكار';
    await shareOrDownloadAsImageCard({
      categoryBadge: catLabel,
      title: `${catLabel} • التكرار: ${item.count} مرة`,
      mainText: item.text,
      referenceText: `${item.source || 'حصن المسلم'}${item.fadl ? ` — ${item.fadl}` : ''}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F6F2] flex flex-col overflow-x-hidden select-none animate-fadeIn" dir="rtl">
      {/* Clean White Header (No Green) */}
      <div className="bg-white text-[#172A28] px-4 pt-5 pb-3.5 shadow-sm border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                soundService.stopAudio();
                setPlayingAudioTrack(null);
                if (viewMode === 'detail') {
                  setViewMode('index');
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
                {viewMode === 'index'
                  ? `فهرس الأذكار الكاملة والسبحة (${AZKAR_LIST.length} ذكر)`
                  : activeTab === 'tasbih'
                  ? 'السبحة الإلكترونية التفاعلية'
                  : categoryTabs.find((c) => c.id === azkarCategory)?.label || 'الأذكار'}
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
                {viewMode === 'index'
                  ? 'فهرس رأسي منظم لجميع أبواب حصن المسلم والسبحة الإلكترونية'
                  : 'صفحة مستقلة للتفاصيل • اضغط للعودة إلى فهرس الأذكار'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {viewMode === 'detail' && (
              <button
                onClick={() => {
                  soundService.stopAudio();
                  setPlayingAudioTrack(null);
                  setViewMode('index');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#104B40] text-white text-xs font-bold cursor-pointer"
              >
                <span>عودة للفهرس</span>
              </button>
            )}
            <button
              onClick={() => setIsIndexOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 transition-colors cursor-pointer"
              aria-label="فهرس الأذكار"
            >
              <Menu className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold">الأقسام</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible ☰ Index Drawer */}
      {isIndexOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-bold text-base text-[#172A28]">فهرس أقسام الأذكار (حصن المسلم)</h3>
              </div>
              <button
                onClick={() => setIsIndexOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {categoryTabs.map((cat, idx) => {
                const count = azkarItems.filter((i) => i.category === cat.id).length;
                const isSelected = azkarCategory === cat.id && activeTab === 'azkar' && viewMode === 'detail';
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveTab('azkar');
                      setAzkarCategory(cat.id);
                      setViewMode('detail');
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
                      {count} ذكر
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setActiveTab('tasbih');
                  setViewMode('detail');
                  setIsIndexOpen(false);
                }}
                className="w-full text-right p-3.5 rounded-2xl border border-[#C5A059] bg-amber-50/60 hover:bg-amber-100/60 text-[#172A28] transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#104B40] text-[#C5A059] flex items-center justify-center text-xs font-bold">
                    13
                  </span>
                  <span className="font-bold text-xs">السبحة الإلكترونية التفاعلية</span>
                </div>
                <span className="text-xs font-bold text-[#104B40] bg-white px-2.5 py-1 rounded-full">
                  تسبيح
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW: ORGANIZED VERTICAL INDEX */}
      {viewMode === 'index' ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2.5 pb-24 max-w-2xl mx-auto w-full">
          {/* Quick Top Card */}
          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#172A28] font-cairo">فهرس أبواب الأذكار والسبحة</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                اختر أي باب من الفهرس الرأسي لفتح صفحته المستقلة بكامل الأذكار والعداد التفاعلي
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab('tasbih');
                setViewMode('detail');
              }}
              className="px-3 py-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>السبحة</span>
            </button>
          </div>

          {categoryTabs.map((cat, idx) => {
            const catItems = azkarItems.filter((i) => i.category === cat.id);
            const completedCount = catItems.filter((i) => i.currentCount >= i.count).length;
            const isAllDone = catItems.length > 0 && completedCount === catItems.length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab('azkar');
                  setAzkarCategory(cat.id);
                  setViewMode('detail');
                }}
                className={`w-full text-right bg-white hover:bg-[#FAF9F5] p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer shadow-xs group ${
                  isAllDone ? 'border-emerald-400' : 'border-gray-100 hover:border-[#C5A059]/60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 shadow-xs ${
                      isAllDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#104B40] text-[#C5A059]'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#172A28] group-hover:text-[#104B40] transition-colors">
                        {cat.label}
                      </h4>
                      {completedCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          أنجزت {completedCount}/{catItems.length}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{cat.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C5A059]/15 text-[#9A7732]">
                    {catItems.length} ذكر
                  </span>
                  <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                </div>
              </button>
            );
          })}

          {/* Item 13: Digital Tasbih in Vertical Index */}
          <button
            onClick={() => {
              setActiveTab('tasbih');
              setViewMode('detail');
            }}
            className="w-full text-right bg-white hover:bg-[#FAF9F5] p-4 rounded-2xl border border-[#C5A059]/60 shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                13
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#172A28] group-hover:text-[#104B40] transition-colors">
                  السبحة الإلكترونية التفاعلية
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                  عداد تسبيح ذكي مع اختيار صيغة الذكر والهدف اليومي والاحتفال عند الإنجاز
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#104B40] text-[#C5A059]">
                تسبيح حر
              </span>
              <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#104B40] transition-colors" />
            </div>
          </button>
        </div>
      ) : activeTab === 'azkar' ? (
        /* INDEPENDENT DETAIL PAGE FOR SELECTED AZKAR CATEGORY */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 pb-24 max-w-2xl mx-auto w-full">
          {/* Top Status & Back to Vertical Index Card */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundService.stopAudio();
                  setPlayingAudioTrack(null);
                  setViewMode('index');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] font-bold cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>فهرس الأذكار</span>
              </button>
              <span className="font-bold text-[#172A28]">
                {categoryTabs.find((c) => c.id === azkarCategory)?.label}:
              </span>
              <span className="text-gray-500">
                أتممت{' '}
                <strong className="text-emerald-700">
                  {filteredAzkar.filter((i) => i.currentCount >= i.count).length}
                </strong>{' '}
                من {filteredAzkar.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {(azkarCategory === 'sabah' || azkarCategory === 'masaa') && (
                <button
                  onClick={handleToggleAzkarAudio}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                    playingAudioTrack
                      ? 'bg-red-500 text-white'
                      : 'bg-[#F7F6F2] text-[#172A28] border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {playingAudioTrack ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>إيقاف الصوت</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>استماع صوتي</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleResetCategory}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F7F6F2] text-gray-600 hover:text-red-600 cursor-pointer font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير</span>
              </button>
            </div>
          </div>

          {filteredAzkar.map((item) => {
            const isComplete = item.currentCount >= item.count;
            const progressPct = Math.round((item.currentCount / item.count) * 100);

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-white border transition-all shadow-xs ${
                  isComplete ? 'border-emerald-400' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C5A059]/15 text-[#9A7732]">
                    {categoryTabs.find((c) => c.id === item.category)?.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleShareDhikrImage(item)}
                      className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#9A7732] text-[10px] font-bold transition-colors cursor-pointer"
                      title="مشاركة كبطاقة مصورة (5 خلفيات بدون إنترنت)"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>بطاقة</span>
                    </button>
                    <button
                      onClick={() => handleCopyDhikr(item)}
                      className="p-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                      title="نسخ الذكر"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleShareDhikr(item)}
                      className="p-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                      title="مشاركة الذكر"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-lg font-amiri leading-loose text-[#172A28] text-right font-bold break-words">
                  {item.text}
                </p>

                {item.fadl && (
                  <div className="mt-3 text-xs text-gray-700 bg-[#F7F6F2] p-3 rounded-xl leading-relaxed text-right border border-gray-100">
                    <span className="font-bold text-[#9A7732]">الفضل والثواب:</span> {item.fadl}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-500 font-bold">{item.source}</span>

                  <button
                    onClick={() => handleIncrementAzkar(item.id, item.count)}
                    disabled={isComplete}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                      isComplete
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-[#C5A059] hover:bg-[#B08D46] text-white active:scale-95'
                    }`}
                  >
                    {isComplete ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>اكتمل الذكر</span>
                      </>
                    ) : (
                      <>
                        <span>كرر {item.count - item.currentCount} مرة</span>
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-sans text-xs">
                          {item.currentCount}/{item.count}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#C5A059] h-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* INDEPENDENT DETAIL PAGE: السبحة الإلكترونية التفاعلية */
        <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto max-w-2xl mx-auto w-full space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172A28] block text-right">
                اختر الذكر والتسبيح:
              </label>
              <button
                onClick={() => setViewMode('index')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] text-xs font-bold cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة إلى فهرس الأذكار</span>
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {TASBIH_PHRASES.map((phrase, idx) => (
                <button
                  key={phrase.phrase}
                  onClick={() => {
                    setSelectedPhraseIndex(idx);
                    setTasbihCount(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedPhraseIndex === idx
                      ? 'bg-[#C5A059] text-white border-[#C5A059]'
                      : 'bg-[#F7F6F2] border-gray-200 text-[#172A28] hover:bg-gray-200'
                  }`}
                >
                  {phrase.phrase}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1 text-xs">
              <span className="text-gray-500 font-medium">الهدف:</span>
              {[33, 100, 0].map((t) => (
                <button
                  key={t}
                  onClick={() => setTargetCount(t)}
                  className={`px-3 py-1 rounded-full font-bold cursor-pointer transition-all ${
                    targetCount === t
                      ? 'bg-[#172A28] text-white'
                      : 'bg-[#F7F6F2] text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 0 ? 'مفتوح' : `${t} مرة`}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col items-center justify-center my-auto">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <div
                className="absolute inset-0 transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${beadRotation}deg)` }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const angle = (i * 360) / 24;
                    const rad = (angle * Math.PI) / 180;
                    const cx = 100 + 82 * Math.cos(rad);
                    const cy = 100 + 82 * Math.sin(rad);
                    return (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={i === 0 ? '7.5' : '6'}
                        fill={i === 0 ? '#C5A059' : '#172A28'}
                      />
                    );
                  })}
                </svg>
              </div>

              <button
                onClick={handleTapTasbih}
                className="relative z-10 w-44 h-44 rounded-full bg-white text-[#172A28] shadow-xl flex flex-col items-center justify-center p-3 active:scale-95 transition-transform border-4 border-[#C5A059] cursor-pointer select-none"
              >
                <span className="text-xs text-[#9A7732] font-bold mb-1 font-amiri">
                  {currentPhrase.phrase}
                </span>
                <span className="text-4xl font-black font-sans tracking-tight text-[#172A28]">
                  {tasbihCount}
                </span>
                {targetCount > 0 && (
                  <span className="text-[10px] text-gray-400 mt-1 font-sans">
                    الهدف: {targetCount}
                  </span>
                )}
                <span className="text-[10px] text-[#C5A059] mt-2 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  اضغط للتسبيح
                </span>
              </button>
            </div>

            <p className="text-xs text-gray-500 font-medium text-center mt-3 max-w-xs leading-relaxed">
              {currentPhrase.meaning}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex items-center justify-between">
            <button
              onClick={handleResetTasbih}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 transition-colors cursor-pointer font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تصفير العداد</span>
            </button>

            <span className="text-xs font-bold text-[#C5A059]">
              تسبيحات الجلسة: {tasbihCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

