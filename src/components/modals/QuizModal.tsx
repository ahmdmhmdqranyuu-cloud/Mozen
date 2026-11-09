import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  X,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  BookOpen,
  Search,
  Trophy,
  Menu,
  Share2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ISLAMIC_QUIZ, QuizQuestion } from '../../data/suggestionsData';
import { soundService } from '../../utils/audioPlayer';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';
import { userStatsTracker } from '../../utils/userStatsTracker';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUIZ_STORAGE_KEY = 'moazen_quiz_stats_v2';

export const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose }) => {
  const [screenMode, setScreenMode] = useState<'index' | 'quiz' | 'question-detail'>('index');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).bestScore || 0 : 0;
    } catch {
      return 0;
    }
  });

  const handleShareQuestion = async (q: QuizQuestion) => {
    await shareIslamicText({
      title: `سؤال وجواب في ${q.categoryLabel}`,
      body: `❓ السؤال: ${q.question}\n\n✅ الإجابة الصحيحة: ${q.options[q.correctIndex]}\n\n💡 الفائدة العلمية: ${q.explanation}`,
      source: 'موسوعة المسابقات الإسلامية - تطبيق المؤذن',
    });
  };

  const handleShareQuestionCard = async (q: QuizQuestion) => {
    await shareOrDownloadAsImageCard({
      categoryBadge: `مسابقة وموسوعة • ${q.categoryLabel}`,
      title: q.question,
      mainText: `الإجابة الصحيحة: ${q.options[q.correctIndex]}\n\n${q.explanation}`,
      referenceText: 'موسوعة المسابقات الإسلامية - تطبيق المؤذن',
    });
  };

  const categories = [
    { id: 'all', label: 'جميع الأقسام', desc: 'اختبر معلوماتك في كافة علوم القرآن والسنة والسيرة والفقه', count: ISLAMIC_QUIZ.length },
    { id: 'quran', label: 'القرآن الكريم وعلومه', desc: 'أسئلة حول سور القرآن وآياته وأسباب النزول والفضائل', count: ISLAMIC_QUIZ.filter((q) => q.category === 'quran').length },
    { id: 'hadith', label: 'الحديث النبوي الشريف', desc: 'أسئلة في جوامع الكلم وكتب السنة والرواة', count: ISLAMIC_QUIZ.filter((q) => q.category === 'hadith').length },
    { id: 'sunnah', label: 'السيرة النبوية والسنن', desc: 'محطات حياة النبي ﷺ وغزواته وسننه اليومية', count: ISLAMIC_QUIZ.filter((q) => q.category === 'sunnah').length },
    { id: 'prophets', label: 'الأنبياء والمرسلون', desc: 'قصص ومعجزات أنبياء الله ورسله عليهم السلام', count: ISLAMIC_QUIZ.filter((q) => q.category === 'prophets').length },
    { id: 'fiqh', label: 'الفقه والعبادات', desc: 'أحكام الطهارة والصلاة والصيام والزكاة والحج', count: ISLAMIC_QUIZ.filter((q) => q.category === 'fiqh').length },
    { id: 'companions', label: 'الصحابة والتاريخ الإسلامي', desc: 'مناقب الصحابة الكرام والفتوحات الإسلامية', count: ISLAMIC_QUIZ.filter((q) => q.category === 'companions').length },
  ];

  const filteredQuestions = useMemo(() => {
    return ISLAMIC_QUIZ.filter((q) => {
      const matchesCat = selectedCategory === 'all' || q.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        q.question.includes(searchQuery.trim()) ||
        q.explanation.includes(searchQuery.trim()) ||
        q.options.some((o) => o.includes(searchQuery.trim()));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const currentQ = filteredQuestions[currentQIndex] || filteredQuestions[0];

  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQ.correctIndex) {
      userStatsTracker.recordQuizAnswer(currentQ.id, true);
      soundService.playSuccessCelebration();
      const nextScore = score + 1;
      setScore(nextScore);
      if (nextScore > bestScore) {
        setBestScore(nextScore);
        try {
          localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ bestScore: nextScore }));
        } catch {}
      }
    } else {
      soundService.playTasbihClick();
    }
  };

  const handleNext = () => {
    if (currentQIndex < filteredQuestions.length - 1) {
      setCurrentQIndex((idx) => idx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsQuizComplete(true);
      soundService.playSuccessCelebration();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    userStatsTracker.recordQuizSessionStarted();
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsQuizComplete(false);
  };

  const startCategoryQuiz = (catId: string) => {
    userStatsTracker.recordQuizSessionStarted();
    setSelectedCategory(catId);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsQuizComplete(false);
    setScreenMode('quiz');
  };

  const currentDetailIdx = selectedQuestion
    ? filteredQuestions.findIndex((q) => q.id === selectedQuestion.id)
    : -1;

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F6F2] flex flex-col overflow-x-hidden select-none animate-fadeIn" dir="rtl">
      {/* Clean White Header (No Green) */}
      <div className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-sm border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (screenMode !== 'index') {
                  setScreenMode('index');
                  setSelectedQuestion(null);
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
                {screenMode === 'index'
                  ? `فهرس المسابقات والموسوعة (${ISLAMIC_QUIZ.length} سؤال)`
                  : screenMode === 'quiz'
                  ? `مسابقة: ${categories.find((c) => c.id === selectedCategory)?.label}`
                  : `تفاصيل السؤال • ${selectedQuestion?.categoryLabel}`}
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
                {screenMode === 'index'
                  ? 'فهرس رأسي منظم للأقسام والأسئلة • اضغط لفتح صفحة مستقلة'
                  : 'صفحة مستقلة • اضغط للعودة إلى فهرس المسابقات'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {screenMode !== 'index' && (
              <button
                onClick={() => {
                  setScreenMode('index');
                  setSelectedQuestion(null);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#104B40] text-white text-xs font-bold cursor-pointer"
              >
                <span>الفهرس</span>
              </button>
            )}
            <button
              onClick={() => setIsIndexOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 transition-colors cursor-pointer"
              aria-label="فهرس المسابقات"
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
                <h3 className="font-bold text-base text-[#172A28]">فهرس أقسام المسابقة</h3>
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
                      startCategoryQuiz(cat.id);
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
                      {cat.count} سؤال
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-24 max-w-2xl mx-auto w-full">
        {/* VIEW 1: ORGANIZED VERTICAL INDEX */}
        {screenMode === 'index' && (
          <div className="space-y-3">
            {/* Section 1: Vertical Index of Interactive Quiz Categories */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#172A28] font-cairo">
                  1. فهرس اختبارات المسابقة التفاعلية
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  اضغط على أي قسم لبدء الاختبار التفاعلي في صفحة مستقلة (أعلى نتيجة: {bestScore})
                </p>
              </div>
              <Trophy className="w-5 h-5 text-[#C5A059] shrink-0" />
            </div>

            {categories.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => startCategoryQuiz(cat.id)}
                className="w-full text-right bg-white hover:bg-[#FAF9F5] p-3.5 rounded-2xl border border-gray-100 hover:border-[#C5A059]/60 shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#104B40] text-[#C5A059] font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#172A28] group-hover:text-[#104B40] transition-colors">
                      اختبار: {cat.label}
                    </h4>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{cat.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C5A059]/15 text-[#9A7732]">
                    {cat.count} سؤال
                  </span>
                  <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                </div>
              </button>
            ))}

            {/* Section 2: Vertical Index of All Encyclopedia Questions */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs space-y-2.5 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#C5A059]" />
                  <h3 className="text-sm font-black text-[#172A28] font-cairo">
                    2. الفهرس الرأسي لموسوعة الأسئلة والإجابات ({filteredQuestions.length})
                  </h3>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث في فهرس الأسئلة والإجابات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-9 py-2 bg-[#F7F6F2] border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C5A059] text-right"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap border cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#C5A059] text-white border-[#C5A059]'
                        : 'bg-[#F7F6F2] text-[#172A28] border-gray-200'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>
            </div>

            {filteredQuestions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQuestion(q);
                  setScreenMode('question-detail');
                }}
                className="w-full text-right bg-white hover:bg-[#FAF9F5] p-3.5 rounded-2xl border border-gray-100 hover:border-[#C5A059]/60 shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#F7F6F2] text-[#104B40] font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#9A7732] bg-[#C5A059]/15 px-2 py-0.5 rounded-full inline-block mb-0.5">
                      {q.categoryLabel}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#172A28] group-hover:text-[#104B40] transition-colors line-clamp-1">
                      {q.question}
                    </h4>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#104B40] shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* VIEW 2: INDEPENDENT INTERACTIVE QUIZ PAGE */}
        {screenMode === 'quiz' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center justify-between">
              <button
                onClick={() => setScreenMode('index')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] text-xs font-bold cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>العودة إلى فهرس المسابقات</span>
              </button>
              <span className="text-xs font-bold text-[#172A28]">
                {categories.find((c) => c.id === selectedCategory)?.label}
              </span>
            </div>

            {!isQuizComplete && currentQ ? (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#C5A059]/15 text-[#9A7732] px-3 py-1 rounded-full">
                      السؤال {currentQIndex + 1} من {filteredQuestions.length}
                    </span>
                    <span className="bg-[#F7F6F2] text-gray-600 px-2.5 py-1 rounded-full">
                      {currentQ.categoryLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700">النقاط: {score}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[#C5A059]">أعلى نتيجة: {bestScore}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-bold font-cairo text-[#172A28] leading-relaxed flex-1">
                      {currentQ.question}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleShareQuestionCard(currentQ)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#9A7732] text-[10px] font-bold transition-colors cursor-pointer"
                        title="مشاركة كبطاقة مصورة"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>بطاقة</span>
                      </button>
                      <button
                        onClick={() => handleShareQuestion(currentQ)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#F7F6F2] hover:bg-emerald-50 text-[#104B40] text-[10px] font-bold transition-colors cursor-pointer"
                        title="مشاركة السؤال"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, idx) => {
                      let btnStyle = 'bg-[#F7F6F2] border-gray-200 text-[#172A28] hover:border-[#C5A059]';
                      if (isAnswered) {
                        if (idx === currentQ.correctIndex) {
                          btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500';
                        } else if (idx === selectedOption) {
                          btnStyle = 'bg-red-50 border-red-400 text-red-900';
                        } else {
                          btnStyle = 'bg-gray-50 border-gray-100 text-gray-400 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          disabled={isAnswered}
                          className={`w-full p-3.5 rounded-xl border text-right font-bold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-700 shrink-0">
                              {idx + 1}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {isAnswered && idx === currentQ.correctIndex && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          )}
                          {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="bg-[#F7F6F2] border border-[#C5A059]/30 rounded-xl p-3.5 space-y-3 animate-fadeIn">
                      <p className="text-xs text-[#172A28] leading-relaxed font-medium">
                        <strong className="font-bold text-[#9A7732] block mb-1">الفائدة العلمية:</strong>
                        {currentQ.explanation}
                      </p>
                      <button
                        onClick={handleNext}
                        className="w-full py-2.5 bg-[#C5A059] hover:bg-[#B08D46] text-white rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        {currentQIndex < filteredQuestions.length - 1 ? 'السؤال التالي' : 'عرض النتيجة النهائية'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 text-center space-y-4">
                <div className="w-16 h-16 bg-[#C5A059]/15 text-[#C5A059] rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-bold text-[#172A28]">أتممت المسابقة بنجاح!</h3>
                <p className="text-sm text-gray-600">
                  حصلت على{' '}
                  <span className="font-bold text-[#C5A059] text-lg">{score}</span> من أصل{' '}
                  <span className="font-bold text-[#172A28]">{filteredQuestions.length}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleRestart}
                    className="py-3 bg-[#C5A059] hover:bg-[#B08D46] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة المسابقة</span>
                  </button>
                  <button
                    onClick={() => setScreenMode('index')}
                    className="py-3 bg-[#104B40] hover:bg-[#0B3D35] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>العودة للفهرس</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: INDEPENDENT QUESTION DETAIL PAGE */}
        {screenMode === 'question-detail' && selectedQuestion && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedQuestion(null);
                  setScreenMode('index');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] text-xs font-bold cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>العودة إلى فهرس الأسئلة ({filteredQuestions.length})</span>
              </button>
              <span className="text-xs font-bold text-[#9A7732] bg-[#C5A059]/15 px-3 py-1 rounded-full">
                {selectedQuestion.categoryLabel}
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-right">
              <span className="text-[11px] text-gray-400 font-bold block">
                السؤال رقم {currentDetailIdx + 1} من {filteredQuestions.length}
              </span>

              <h3 className="text-base sm:text-lg font-black text-[#172A28] font-cairo leading-relaxed">
                {selectedQuestion.question}
              </h3>

              <div className="space-y-2">
                {selectedQuestion.options.map((opt, i) => {
                  const isCorrect = i === selectedQuestion.correctIndex;
                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                          : 'bg-[#F7F6F2] border-gray-200 text-gray-600'
                      }`}
                    >
                      <span className="text-xs sm:text-sm">{opt}</span>
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#C5A059]/30 space-y-1.5">
                <span className="text-xs font-bold text-[#9A7732] block">الشرح والفائدة العلمية:</span>
                <p className="text-xs sm:text-sm text-[#172A28] leading-relaxed">
                  {selectedQuestion.explanation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => handleShareQuestionCard(selectedQuestion)}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-[#C5A059] hover:bg-[#B08D46] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>بطاقة (5 خلفيات)</span>
                </button>
                <button
                  onClick={() => handleShareQuestion(selectedQuestion)}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة النص</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={currentDetailIdx <= 0}
                onClick={() => {
                  if (currentDetailIdx > 0) {
                    setSelectedQuestion(filteredQuestions[currentDetailIdx - 1]);
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-[#172A28] disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-[#C5A059]" />
                <span>السؤال السابق</span>
              </button>
              <button
                disabled={currentDetailIdx < 0 || currentDetailIdx >= filteredQuestions.length - 1}
                onClick={() => {
                  if (currentDetailIdx >= 0 && currentDetailIdx < filteredQuestions.length - 1) {
                    setSelectedQuestion(filteredQuestions[currentDetailIdx + 1]);
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-[#172A28] disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
              >
                <span>السؤال التالي</span>
                <ChevronLeft className="w-4 h-4 text-[#C5A059]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

