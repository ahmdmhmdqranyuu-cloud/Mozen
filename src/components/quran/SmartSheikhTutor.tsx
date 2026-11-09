import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Layers,
  Award,
  Flame,
  Calendar,
  Settings,
  RefreshCw,
  Info,
  Check,
  VolumeX,
} from 'lucide-react';
import { SURAH_LIST, fetchSurah } from '../../data/quranData';
import { AppLanguage, getTranslation } from '../../utils/i18n';
import { soundService } from '../../utils/audioPlayer';

interface SmartSheikhTutorProps {
  initialSurah?: number;
  initialAyah?: number;
  language?: AppLanguage;
  onClose?: () => void;
}

export type SheikhDialect = 'egyptian' | 'fusha';

export interface ReciterOption {
  id: string;
  name: string;
  sub: string;
  folder: string;
}

export const RECITERS: ReciterOption[] = [
  {
    id: 'husary',
    name: 'الشيخ محمود خليل الحصري',
    sub: 'المعلم المتقن لأحكام التجويد ومخارج الحروف',
    folder: 'Husary_128kbps',
  },
  {
    id: 'minshawi',
    name: 'الشيخ محمد صديق المنشاوي',
    sub: 'تلاوة خاشعة مرتل برواية حفص عن عاصم',
    folder: 'Minshawy_Murattal_128kbps',
  },
  {
    id: 'abdulbasit',
    name: 'الشيخ عبد الباسط عبد الصمد',
    sub: 'صوت مكة والمسجد الحرام المرتل',
    folder: 'Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'alafasy',
    name: 'الشيخ مشاري راشد العفاسي',
    sub: 'نبرات عذبة وواضحة وسهلة الترديد',
    folder: 'Alafasy_128kbps',
  },
  {
    id: 'shuraym',
    name: 'الشيخ سعود الشريم',
    sub: 'إمام الحرم المكي الشريف',
    folder: 'Saood_ash-Shuraym_128kbps',
  },
  {
    id: 'sudais',
    name: 'الشيخ عبد الرحمن السديس',
    sub: 'إمام وخطيب المسجد الحرام',
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
  },
  {
    id: 'alijaber',
    name: 'الشيخ علي عبد الله جابر',
    sub: 'تلاوة هادئة ومؤثرة من المسجد الحرام',
    folder: 'Ali_Jaber_64kbps',
  },
];

interface MasteredAyahRecord {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  masteredDate: string; // ISO date
  nextReviewDate: string; // ISO date for spaced repetition
  reviewStage: number; // 1 = 1 day, 2 = 3 days, 3 = 7 days, 4 = 14 days
}

interface SheikhProgress {
  masteredAyahs: Record<string, MasteredAyahRecord>; // key: "surah:ayah"
  repetitionCount: number;
  testsPassed: number;
}

const PROGRESS_KEY = 'moazen_sheikh_progress_v2';

function getSavedProgress(): SheikhProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return { masteredAyahs: {}, repetitionCount: 0, testsPassed: 0 };
}

function saveProgress(prog: SheikhProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(prog));
  } catch {
    // fallback
  }
}

// Arabic text normalizer for accurate, fair phonetics comparison
function normalizeArabicText(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Remove tashkeel/diacritics
    .replace(/[أإآء]/g, 'ا') // Normalize alefs
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0621-\u064A\s]/g, '') // Keep Arabic letters only
    .replace(/\s+/g, ' ')
    .trim();
}

export interface DetectedTajweedRule {
  ruleName: string;
  category: 'qalqalah' | 'ghunnah' | 'madd' | 'noon_sakinah' | 'tafkheem';
  exampleWords: string[];
  explanation: string;
  tip: string;
}

/**
 * Detects Tajweed rules present in the current Uthmani Ayah text
 */
function analyzeAyahTajweedRules(text: string): DetectedTajweedRule[] {
  const rules: DetectedTajweedRule[] = [];
  if (!text) return rules;

  const words = text.split(/\s+/).filter(Boolean);

  // 1. Qalqalah: letters ق, ط, ب, ج, د (قطب جد)
  const qalqalahWords = words.filter((w) => /[قطبجدْ]/.test(w) || /[قطبجد]$/.test(w));
  if (qalqalahWords.length > 0) {
    rules.push({
      ruleName: 'حروف القلقلة (ق - ط - ب - ج - د)',
      category: 'qalqalah',
      exampleWords: qalqalahWords.slice(0, 3),
      explanation: 'اضطراب ونبرة اهتزاز قوية عند نطق الحرف الساكن أو الوقف عليه.',
      tip: 'احرص على إظهار نبرة الحرف دون خلطه بحركة فتح أو كسر.',
    });
  }

  // 2. Ghunnah: Noon or Meem Mushaddadah (نّ / مّ)
  const ghunnahWords = words.filter((w) => /نّ|مّ/.test(w) || /[نم]ّ/.test(w));
  if (ghunnahWords.length > 0) {
    rules.push({
      ruleName: 'الغنة المشددة (النون والميم المشددتان)',
      category: 'ghunnah',
      exampleWords: ghunnahWords.slice(0, 3),
      explanation: 'صوت رخيم يخرج من الخيشوم يُمَد بمقدار حركتين عند النطق بالنون أو الميم المشددة.',
      tip: 'أعطِ الغنة زمنها التام (حركتان كالعد على الأصابع).',
    });
  }

  // 3. Madd: Alif, Waw, Yaa followed by Hamzah or Madd mark (آ / ـآ / ء)
  const maddWords = words.filter((w) => /ٓ|آ|وء|يء|اء|يئ/.test(w));
  if (maddWords.length > 0) {
    rules.push({
      ruleName: 'أحكام المد المتصل والمنفصل',
      category: 'madd',
      exampleWords: maddWords.slice(0, 3),
      explanation: 'إطالة الصوت بحرف المد لوجود الهمز أو علامة المد.',
      tip: 'مد الصوت بمقدار 4 إلى 5 حركات بتوسط وسلاسة.',
    });
  }

  // 4. Tafkheem: Letters of Isti'laa (خص ضغط قظ) + Tafkheem of Ra and Lam
  const tafkheemWords = words.filter((w) => /[خصضغطقظ]/.test(w) || /الله/.test(w));
  if (tafkheemWords.length > 0) {
    rules.push({
      ruleName: 'حروف التفخيم والاستعلاء (خ - ص - ض - غ - ط - ق - ظ)',
      category: 'tafkheem',
      exampleWords: tafkheemWords.slice(0, 3),
      explanation: 'تسمين الحرف وامتلائه في الفم عند النطق به.',
      tip: 'ارفع أقصى اللسان إلى الحنك الأعلى ليمتلئ الفم بصداه.',
    });
  }

  return rules;
}

export const SmartSheikhTutor: React.FC<SmartSheikhTutorProps> = ({
  initialSurah = 1,
  initialAyah = 1,
  language = 'ar',
  onClose,
}) => {
  const t = getTranslation(language);
  const isRtl = language === 'ar';

  // Selection state
  const [selectedSurah, setSelectedSurah] = useState<number>(initialSurah);
  const [selectedAyah, setSelectedAyah] = useState<number>(initialAyah);
  const [currentSurahData, setCurrentSurahData] = useState<any>(null);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(true);

  // Settings state
  const [selectedReciter, setSelectedReciter] = useState<string>('husary');
  const [dialect, setDialect] = useState<SheikhDialect>('egyptian');
  const [targetRepeats, setTargetRepeats] = useState<number>(3); // 1, 2, 3, 5, 0 (continuous)
  const [currentRepeat, setCurrentRepeat] = useState<number>(0);
  const [autoAdvanceOnMastery, setAutoAdvanceOnMastery] = useState<boolean>(true);

  // Playback & Recitation State
  const [isPlayingReciter, setIsPlayingReciter] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognizedWords, setRecognizedWords] = useState<string[]>([]);
  const [sheikhSpeaking, setSheikhSpeaking] = useState<boolean>(false);
  const [sheikhSpeechText, setSheikhSpeechText] = useState<string>('');
  const [activeWordHelp, setActiveWordHelp] = useState<string | null>(null);

  // Mode tabs: 'talqeen' | 'quiz' | 'tajweed' | 'spaced_reviews'
  const [activeTab, setActiveTab] = useState<'talqeen' | 'quiz' | 'tajweed' | 'spaced_reviews'>('talqeen');

  // Quiz Mode State
  const [quizType, setQuizType] = useState<'hide' | 'complete' | 'random'>('hide');
  const [quizRevealed, setQuizRevealed] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<'idle' | 'success' | 'retry'>('idle');

  // Progress state
  const [progress, setProgress] = useState<SheikhProgress>(() => getSavedProgress());

  // Audio elements
  const reciterAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Load Surah
  useEffect(() => {
    let isMounted = true;
    setLoadingSurah(true);
    fetchSurah(selectedSurah).then((data) => {
      if (isMounted) {
        setCurrentSurahData(data);
        setLoadingSurah(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedSurah]);

  // Current Ayah Text
  const currentAyahObj = currentSurahData?.ayahs?.find(
    (a: any) => a.numberInSurah === selectedAyah
  );
  const rawAyahText: string = currentAyahObj?.text || '';
  const ayahWords = useMemo(() => rawAyahText.split(/\s+/).filter(Boolean), [rawAyahText]);

  // Detected Tajweed Rules for current Ayah
  const detectedTajweed = useMemo(() => analyzeAyahTajweedRules(rawAyahText), [rawAyahText]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (reciterAudioRef.current) {
        reciterAudioRef.current.pause();
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Voice feedback using SpeechSynthesis (Arabic Male Voice)
  const speakSheikhMessage = useCallback(
    (message: string) => {
      setSheikhSpeechText(message);
      setSheikhSpeaking(true);

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setTimeout(() => setSheikhSpeaking(false), 2500);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = dialect === 'egyptian' ? 'ar-EG' : 'ar-SA';
      utterance.rate = 0.95; // Dignified sheikh cadence
      utterance.pitch = 0.9; // Deeper male resonance

      const voices = window.speechSynthesis.getVoices();
      const arabicMaleVoice = voices.find(
        (v) =>
          v.lang.startsWith('ar') &&
          (v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('maged') ||
            v.name.toLowerCase().includes('tarik') ||
            v.name.toLowerCase().includes('naayf'))
      );
      if (arabicMaleVoice) {
        utterance.voice = arabicMaleVoice;
      }

      utterance.onend = () => setSheikhSpeaking(false);
      utterance.onerror = () => setSheikhSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [dialect]
  );

  // Play Reciter Audio
  const playReciterAyah = useCallback(() => {
    soundService.stopAudio();
    if (reciterAudioRef.current) {
      reciterAudioRef.current.pause();
    }

    const reciter = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
    const surahPad = String(selectedSurah).padStart(3, '0');
    const ayahPad = String(selectedAyah).padStart(3, '0');
    const audioUrl = `https://everyayah.com/data/${reciter.folder}/${surahPad}${ayahPad}.mp3`;

    const audio = new Audio(audioUrl);
    reciterAudioRef.current = audio;

    setIsPlayingReciter(true);
    audio.play().catch(() => {
      setIsPlayingReciter(false);
    });

    audio.onended = () => {
      setIsPlayingReciter(false);
      setCurrentRepeat((prev) => {
        const next = prev + 1;
        if (targetRepeats === 0 || next < targetRepeats) {
          setTimeout(() => {
            playReciterAyah();
          }, 850);
          return next;
        } else {
          const coachingText =
            dialect === 'egyptian'
              ? 'ما شاء الله يا بني.. استمعت للآية، دورك دلوقتي اضغط على المايك وسمّعها بصوتك المبارك'
              : 'أحسنت الاستماع يا بني، حان دورك الآن؛ اضغط على زر الميكروفون ورتّل الآية الكريمة بخشوع';
          speakSheikhMessage(coachingText);
          return next;
        }
      });
    };
  }, [selectedReciter, selectedSurah, selectedAyah, targetRepeats, dialect, speakSheikhMessage]);

  const stopReciterAyah = useCallback(() => {
    if (reciterAudioRef.current) {
      reciterAudioRef.current.pause();
      reciterAudioRef.current = null;
    }
    setIsPlayingReciter(false);
  }, []);

  // Navigate Ayahs
  const handlePrevAyah = useCallback(() => {
    stopReciterAyah();
    setCurrentRepeat(0);
    setRecognizedWords([]);
    setQuizResult('idle');
    setQuizRevealed(false);
    if (selectedAyah > 1) {
      setSelectedAyah((prev) => prev - 1);
    }
  }, [selectedAyah, stopReciterAyah]);

  const handleNextAyah = useCallback(() => {
    stopReciterAyah();
    setCurrentRepeat(0);
    setRecognizedWords([]);
    setQuizResult('idle');
    setQuizRevealed(false);
    if (currentSurahData && selectedAyah < currentSurahData.numberOfAyahs) {
      setSelectedAyah((prev) => prev + 1);
    }
  }, [currentSurahData, selectedAyah, stopReciterAyah]);

  // Evaluate recitation against Uthmani text with word-by-word diff
  const evaluateRecitation = useCallback(() => {
    if (recognizedWords.length === 0) return;

    const normTarget = normalizeArabicText(rawAyahText);
    const targetWords = normTarget.split(/\s+/).filter(Boolean);
    const spokenWords = recognizedWords.map((w) => normalizeArabicText(w)).filter(Boolean);

    let matchedCount = 0;
    targetWords.forEach((tw) => {
      if (spokenWords.some((sw) => sw === tw || sw.includes(tw) || tw.includes(sw))) {
        matchedCount++;
      }
    });

    const accuracy = targetWords.length > 0 ? Math.round((matchedCount / targetWords.length) * 100) : 0;

    if (accuracy >= 70) {
      // Success!
      setQuizResult('success');
      soundService.playSuccessCelebration();
      const praise =
        dialect === 'egyptian'
          ? `ما شاء الله تبارك الله يا بني! قراءتك ممتازة ومتقنة بنسبة ${accuracy}%، ربنا يفتح عليك.`
          : `أحسنت القراءة يا بني، بارك الله فيك ونفع بك القرآن الكريم؛ إتقان بنسبة ${accuracy}%.`;
      speakSheikhMessage(praise);

      // Save Spaced Repetition progress
      const now = new Date();
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + 3); // Review in 3 days

      const record: MasteredAyahRecord = {
        surahNumber: selectedSurah,
        ayahNumber: selectedAyah,
        surahName: currentSurahData?.name || `سورة ${selectedSurah}`,
        masteredDate: now.toISOString().split('T')[0],
        nextReviewDate: reviewDate.toISOString().split('T')[0],
        reviewStage: 1,
      };

      setProgress((prev) => {
        const next = {
          ...prev,
          masteredAyahs: {
            ...prev.masteredAyahs,
            [`${selectedSurah}:${selectedAyah}`]: record,
          },
          repetitionCount: prev.repetitionCount + 1,
          testsPassed: prev.testsPassed + 1,
        };
        saveProgress(next);
        return next;
      });

      // Automatic advance to next ayah if enabled
      if (autoAdvanceOnMastery && currentSurahData && selectedAyah < currentSurahData.numberOfAyahs) {
        setTimeout(() => {
          handleNextAyah();
        }, 2600);
      }
    } else {
      // Need practice
      setQuizResult('retry');
      const advice =
        dialect === 'egyptian'
          ? 'محاولة طيبة يا بني! اسمع الآية تاني من الشيخ وركز في الكلمات المحددة بالأحمر وكررها معايا.'
          : 'جهد مبارك يا بني؛ استمع إلى القارئ مرة أخرى وانتبه إلى مواضع الحروف لتثبيتها جيداً.';
      speakSheikhMessage(advice);
    }
  }, [
    recognizedWords,
    rawAyahText,
    dialect,
    selectedSurah,
    selectedAyah,
    currentSurahData,
    autoAdvanceOnMastery,
    handleNextAyah,
    speakSheikhMessage,
  ]);

  // Real-time Speech Recognition
  const startListening = useCallback(() => {
    stopReciterAyah();
    setRecognizedWords([]);
    setQuizResult('idle');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('متصفحك لا يدعم التعرف الصوتي المباشر، يرجى استخدام متصفح حديث يدعم إذن الميكروفون.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = dialect === 'egyptian' ? 'ar-EG' : 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        const words = transcript.trim().split(/\s+/).filter(Boolean);
        setRecognizedWords(words);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch {
      setIsListening(false);
    }
  }, [dialect, stopReciterAyah]);

  const stopListening = useCallback(() => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    setIsListening(false);
    evaluateRecitation();
  }, [evaluateRecitation]);

  // Check word accuracy status
  const getWordMatchStatus = (word: string, index: number): 'matched' | 'pending' | 'mismatch' => {
    if (recognizedWords.length === 0) return 'pending';
    const norm = normalizeArabicText(word);
    const spoken = recognizedWords.map((w) => normalizeArabicText(w));
    if (spoken.includes(norm) || spoken.some((s) => s.includes(norm) || norm.includes(s))) {
      return 'matched';
    }
    return index < recognizedWords.length ? 'mismatch' : 'pending';
  };

  const masteredKeys = Object.keys(progress.masteredAyahs);
  const masteredInCurrentSurah = masteredKeys.filter((k) => k.startsWith(`${selectedSurah}:`)).length;
  const totalInCurrentSurah = currentSurahData?.numberOfAyahs || 1;
  const currentSurahPercent = Math.min(100, Math.round((masteredInCurrentSurah / totalInCurrentSurah) * 100));

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#172A28]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#0E3E34] via-[#145548] to-[#0E3E34] text-white p-4 shrink-0 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#E6CA85] shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-cairo">
                  {t.sheikhTitle}
                </h2>
                <span className="text-[9.5px] bg-[#C5A059] text-[#104B40] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  محفظ تفاعلي ذكي
                </span>
              </div>
              <p className="text-xs text-white/80 line-clamp-1">{t.sheikhSubtitle}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
            >
              {t.closeBtn}
            </button>
          )}
        </div>

        {/* 4 MODE TABS */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('talqeen')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'talqeen'
                ? 'bg-[#C5A059] text-[#104B40] shadow-sm font-black'
                : 'bg-white/10 text-white/90 hover:bg-white/15'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="truncate">التلقين والترديد</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-[#C5A059] text-[#104B40] shadow-sm font-black'
                : 'bg-white/10 text-white/90 hover:bg-white/15'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="truncate">اختبار الحفظ</span>
          </button>
          <button
            onClick={() => setActiveTab('tajweed')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'tajweed'
                ? 'bg-[#C5A059] text-[#104B40] shadow-sm font-black'
                : 'bg-white/10 text-white/90 hover:bg-white/15'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="truncate">أحكام التجويد</span>
          </button>
          <button
            onClick={() => setActiveTab('spaced_reviews')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'spaced_reviews'
                ? 'bg-[#C5A059] text-[#104B40] shadow-sm font-black'
                : 'bg-white/10 text-white/90 hover:bg-white/15'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="truncate">جدول المراجعة</span>
          </button>
        </div>
      </div>

      {/* BODY SCROLL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* SURAH & AYAH CONTROLLER BAR */}
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-2">
          {/* Surah Dropdown */}
          <div className="flex items-center gap-2 min-w-[170px]">
            <span className="text-xs font-bold text-gray-500">السورة:</span>
            <select
              value={selectedSurah}
              onChange={(e) => {
                setSelectedSurah(Number(e.target.value));
                setSelectedAyah(1);
                setCurrentRepeat(0);
                setRecognizedWords([]);
                setQuizResult('idle');
              }}
              className="text-xs font-bold bg-[#FAF8F5] border border-gray-200 rounded-xl px-2.5 py-1.5 text-[#104B40] focus:outline-none cursor-pointer"
            >
              {SURAH_LIST.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.numberOfAyahs} آية)
                </option>
              ))}
            </select>
          </div>

          {/* Ayah Navigator */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevAyah}
              disabled={selectedAyah <= 1}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="الآية السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-black px-2.5 py-1 bg-[#104B40]/10 text-[#104B40] rounded-lg">
              الآية {selectedAyah} من {currentSurahData?.numberOfAyahs || '...'}
            </span>
            <button
              onClick={handleNextAyah}
              disabled={!currentSurahData || selectedAyah >= (currentSurahData.numberOfAyahs || 1)}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="الآية التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Sheikh Persona & Dialect */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-bold">اللهجة:</span>
            <button
              onClick={() => {
                setDialect('egyptian');
                speakSheikhMessage('أهلاً بيك يا بني، رتّل ورايا وركز في مخارج الحروف.');
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                dialect === 'egyptian'
                  ? 'bg-[#104B40] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              مصرية
            </button>
            <button
              onClick={() => {
                setDialect('fusha');
                speakSheikhMessage('مرحباً بك يا بني، أنصت إلى كلام الله العظيم ورتّل بتؤدة.');
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                dialect === 'fusha'
                  ? 'bg-[#104B40] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              فصحى
            </button>
          </div>
        </div>

        {/* SHEIKH COACHING SPEECH BUBBLE */}
        {(sheikhSpeechText || sheikhSpeaking) && (
          <div className="bg-[#E6F4EA] border border-[#104B40]/25 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs animate-fadeIn">
            <div className="w-9 h-9 rounded-full bg-[#104B40] text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#104B40]">توجيه شيخي المعلم:</span>
                <span className="text-[10px] text-gray-500 font-bold">
                  {dialect === 'egyptian' ? 'مصري محبب' : 'فصحى متقنة'}
                </span>
              </div>
              <p className="text-xs text-[#172A28] mt-1 font-medium leading-relaxed">
                {sheikhSpeechText || 'أنصت للشيخ ثم رتّل الآية المباركة...'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: TALQEEN & REPETITION */}
        {activeTab === 'talqeen' && (
          <div className="space-y-4">
            {/* AYAH DISPLAY CARD WITH WORD-BY-WORD HIGHLIGHTING */}
            <div className="bg-white rounded-3xl p-6 border border-[#C5A059]/35 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-bl-full pointer-events-none" />

              {/* Surah Header & Progress */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-bold">
                  سورة {currentSurahData?.name} • الآية {selectedAyah}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-bold">
                    إتقان السورة: {currentSurahPercent}%
                  </span>
                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${currentSurahPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ayah Words with Word-by-Word Feedback */}
              <div className="my-6 text-center">
                {loadingSurah ? (
                  <div className="py-8 text-gray-400 text-xs font-bold animate-pulse">
                    جاري تحميل الآية الكريمة من المصحف...
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-x-2 gap-y-3 font-quran text-2xl sm:text-3xl leading-loose text-[#104B40]">
                    {ayahWords.map((word, idx) => {
                      const status = getWordMatchStatus(word, idx);
                      return (
                        <span
                          key={idx}
                          onClick={() => setActiveWordHelp(word)}
                          className={`px-2 py-0.5 rounded-xl transition-all cursor-pointer ${
                            status === 'matched'
                              ? 'bg-emerald-100 text-emerald-900 font-bold shadow-2xs border border-emerald-300/50'
                              : status === 'mismatch'
                              ? 'bg-rose-100 text-rose-950 font-bold border border-rose-300'
                              : 'text-[#172A28] hover:bg-gray-100'
                          }`}
                          title="اضغط لمعرفة حكم الكلمة ومخرجها"
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Repetition Visual Counter */}
              {targetRepeats > 0 && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: targetRepeats }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all ${
                          i < currentRepeat ? 'bg-[#104B40] scale-110 shadow-2xs' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-gray-500">
                    التكرار: {currentRepeat} من {targetRepeats}
                  </span>
                </div>
              )}

              {/* Reciter Selector & Repetition Options */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
                {/* Select Reciter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">القارئ:</span>
                  <select
                    value={selectedReciter}
                    onChange={(e) => {
                      stopReciterAyah();
                      setSelectedReciter(e.target.value);
                    }}
                    className="text-xs font-bold bg-[#FAF8F5] border border-gray-200 rounded-xl px-2 py-1 text-[#104B40] focus:outline-none cursor-pointer"
                  >
                    {RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Repeats */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500 font-bold">مرات التكرار:</span>
                  {[1, 2, 3, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setTargetRepeats(num)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        targetRepeats === num
                          ? 'bg-[#C5A059] text-[#104B40] shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setTargetRepeats(0)}
                    className={`px-2 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      targetRepeats === 0
                        ? 'bg-[#C5A059] text-[#104B40] shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    مستمر
                  </button>
                </div>
              </div>

              {/* Auto-Advance Toggle */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs">
                <span className="text-gray-700 font-bold">
                  الانتقال التلقائي للآية التالية بعد إتقان الحفظ:
                </span>
                <button
                  onClick={() => setAutoAdvanceOnMastery(!autoAdvanceOnMastery)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    autoAdvanceOnMastery ? 'bg-[#104B40]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      autoAdvanceOnMastery ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* MAIN ACTION BUTTONS: TALQEEN & MIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {/* Play Reciter Button */}
                <button
                  onClick={isPlayingReciter ? stopReciterAyah : playReciterAyah}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm shadow-sm transition-transform active:scale-[0.98] cursor-pointer ${
                    isPlayingReciter
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#104B40] hover:bg-[#0c3a31] text-white'
                  }`}
                >
                  {isPlayingReciter ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>إيقاف التلقين</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>استمع للتلقين مع الشيخ</span>
                    </>
                  )}
                </button>

                {/* Mic Listen Button */}
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm shadow-sm transition-transform active:scale-[0.98] cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-[#C5A059] hover:bg-[#b08e4d] text-[#104B40]'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>إيقاف التسميع والتحليل</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>تسميع عبر الميكروفون</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Listening Transcript */}
              {isListening && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-center animate-fadeIn">
                  <div className="flex items-center justify-center gap-2 text-rose-700 font-bold text-xs mb-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    <span>جاري الاستماع لتلاوتك... تكلّم بوضوح وتؤدة</span>
                  </div>
                  <p className="text-xs text-rose-900 font-quran min-h-[22px]">
                    {recognizedWords.join(' ') || '...'}
                  </p>
                </div>
              )}

              {/* Result Status Message */}
              {quizResult === 'success' && (
                <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block font-black">ما شاء الله تبارك الله! قراءة متقنة ومباركة</span>
                    <span className="text-[11px] text-emerald-700">
                      تم حفظ إتقان هذه الآية في سجلك وجدول المراجعة التلقائي ✓
                    </span>
                  </div>
                </div>
              )}
              {quizResult === 'retry' && (
                <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2.5 text-amber-900 text-xs font-bold animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="block font-black">محاولة طيبة! هناك كلمات تحتاج إلى ضبط</span>
                    <span className="text-[11px] text-amber-800">
                      استمع إلى تلاوة الشيخ مرة أخرى ثم كرر التسميع لتثبيتها جيداً.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* DYNAMIC TAJWEED HINTS FOR THIS VERSE */}
            {detectedTajweed.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-[#104B40]">
                  <Layers className="w-4 h-4 text-[#C5A059]" />
                  <span>أحكام التجويد المكتشفة في هذه الآية:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detectedTajweed.map((rule, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                      <div className="font-bold text-[#104B40] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                        <span>{rule.ruleName}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">{rule.explanation}</p>
                      <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                        💡 {rule.tip}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEMORIZATION QUIZZES (WITHOUT HELP) */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-black text-[#104B40] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C5A059]" />
                  <span>اختبار حفظ الآيات دون مساعدة</span>
                </h3>
                <span className="text-xs font-bold text-gray-500">
                  سورة {currentSurahData?.name}
                </span>
              </div>

              {/* Quiz Mode Selector */}
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  onClick={() => {
                    setQuizType('hide');
                    setQuizRevealed(false);
                    setQuizResult('idle');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    quizType === 'hide'
                      ? 'border-[#104B40] bg-[#104B40] text-white shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  إخفاء الآية كاملة
                </button>
                <button
                  onClick={() => {
                    setQuizType('complete');
                    setQuizRevealed(false);
                    setQuizResult('idle');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    quizType === 'complete'
                      ? 'border-[#104B40] bg-[#104B40] text-white shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  إكمال نهاية الآية
                </button>
                <button
                  onClick={() => {
                    setQuizType('random');
                    setQuizRevealed(false);
                    setQuizResult('idle');
                    if (currentSurahData?.numberOfAyahs) {
                      const rand = Math.floor(Math.random() * currentSurahData.numberOfAyahs) + 1;
                      setSelectedAyah(rand);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    quizType === 'random'
                      ? 'border-[#104B40] bg-[#104B40] text-white shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  آية عشوائية
                </button>
              </div>

              {/* QUIZ INTERACTIVE DISPLAY */}
              <div className="p-6 bg-[#FAF8F5] rounded-2xl border border-gray-200 text-center min-h-[140px] flex flex-col items-center justify-center">
                {quizType === 'hide' && (
                  <>
                    {quizRevealed ? (
                      <p className="font-quran text-2xl text-[#104B40] leading-loose">
                        {rawAyahText}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-bold">
                          تم إخفاء الآية رقم ({selectedAyah})؛ رتّلها من حفظك عبر الميكروفون ثم اكشفها للتحقق:
                        </p>
                        <div className="h-10 flex items-center justify-center gap-2">
                          <span className="w-16 h-2 bg-gray-300 rounded-full animate-pulse" />
                          <span className="w-24 h-2 bg-gray-300 rounded-full animate-pulse" />
                          <span className="w-16 h-2 bg-gray-300 rounded-full animate-pulse" />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {quizType === 'complete' && (
                  <div className="font-quran text-2xl text-[#104B40] leading-loose">
                    {ayahWords.slice(0, Math.max(1, ayahWords.length - 3)).join(' ')}{' '}
                    {quizRevealed ? (
                      <span className="text-emerald-700 font-black">
                        {ayahWords.slice(Math.max(1, ayahWords.length - 3)).join(' ')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-lg border border-dashed border-amber-400">
                        (أكمل باقي الآية الكريمة...)
                      </span>
                    )}
                  </div>
                )}

                {quizType === 'random' && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#C5A059]">
                      اختبار حفظ عشوائي في سورة {currentSurahData?.name} • الآية {selectedAyah}
                    </span>
                    {quizRevealed ? (
                      <p className="font-quran text-2xl text-[#104B40] leading-loose">
                        {rawAyahText}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 font-bold">
                        اذكر الآية الكريمة من حفظك، ثم سمّعها بالمايك أو اعرض النص للتأكد
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* QUIZ ACTIONS */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setQuizRevealed((prev) => !prev)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#172A28] transition-colors cursor-pointer"
                >
                  {quizRevealed ? 'إخفاء الآية' : 'كشف الآية الكريمة'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-[#104B40] text-white hover:bg-[#0c3a31]'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isListening ? 'إيقاف التسميع' : 'تسميع بالمايك'}</span>
                  </button>

                  <button
                    onClick={handleNextAyah}
                    className="px-4 py-2.5 rounded-xl bg-[#C5A059] text-[#104B40] hover:bg-[#b08e4d] text-xs font-bold cursor-pointer"
                  >
                    الآية التالية ➔
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TAJWEED & ARTICULATION ENCYCLOPEDIA */}
        {activeTab === 'tajweed' && (
          <div className="space-y-3">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm font-black text-[#104B40] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C5A059]" />
                  <span>دليل أحكام التجويد ومخارج الحروف المبسّط</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Ghunnah & Noon Sakinah */}
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>أحكام النون الساكنة والتنوين</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    أربعة أحكام أساسية: <strong>الإظهار</strong> (حروف الحلق)، <strong>الإدغام</strong> (يرملون)،{' '}
                    <strong>الإقلاب</strong> (عند الباء)، و<strong>الإخفاء</strong> (باقي الحروف مع الغنة بمقدار حركتين).
                  </p>
                </div>

                {/* Qalqalah */}
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <span>حروف القلقلة (قطب جد)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    اضطراب مخرج الحرف عند النطق به ساكناً ليسمع بنبرة قوية. درجاتها: كبرى عند الوقف على المشدد، وسطى عند
                    الوقف على الساكن، وصغرى في وسط الكلمة.
                  </p>
                </div>

                {/* Madd Rules */}
                <div className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-900 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>أحكام المدود (الطبيعي والفرعي)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    المد الطبيعي حركتان (الألف، الواو، الياء). المد الفرعي سببه الهمز أو السكون، ويمتد من 4 إلى 6 حركات
                    كالمد المتصل والمنفصل واللازم.
                  </p>
                </div>

                {/* Makharij */}
                <div className="p-3.5 bg-purple-50/60 border border-purple-200/60 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-900 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span>مخارج الحروف الخمسة العامة</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    1. الجوف (حروف المد)، 2. الحلق (همز هاء، عين حاء، غين خاء)، 3. اللسان (18 حرفاً)، 4. الشفتان (ف، و،
                    ب، م)، 5. الخيشوم (مخرج الغنة).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SPACED REPETITION REVIEW SCHEDULE */}
        {activeTab === 'spaced_reviews' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#104B40]" />
                  <h3 className="text-sm font-black text-[#104B40]">
                    جدول المراجعة التلقائي للمحفوظات (Spaced Repetition)
                  </h3>
                </div>
                <span className="text-xs font-bold text-gray-500">
                  {masteredKeys.length} آية متقنة
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                يقوم النظام الذكي بجدولة مراجعة الآيات المتقنة تلقائياً على فترات متباعدة (بعد يوم، 3 أيام، أسبوع،
                وأسبوعين) لضمان ثبات الحفظ في الذاكرة طويلة المدى وعدم تفلته.
              </p>

              {masteredKeys.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500 font-bold">
                  لم يتم تسجيل آيات متقنة بعد. ابدأ التلقين والتسميع لحفظ أولى آياتك المباركة!
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {Object.entries(progress.masteredAyahs).map(([key, record]) => (
                    <div
                      key={key}
                      onClick={() => {
                        setSelectedSurah(record.surahNumber);
                        setSelectedAyah(record.ayahNumber);
                        setActiveTab('talqeen');
                      }}
                      className="p-3 bg-gray-50 hover:bg-emerald-50/60 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="text-xs font-black text-[#172A28]">
                            {record.surahName} • الآية {record.ayahNumber}
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            تاريخ الإتقان: {record.masteredDate}
                          </span>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-bold block">
                          موعد المراجعة: {record.nextReviewDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROGRESS MINI DASHBOARD */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between text-xs font-bold text-gray-600">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C5A059]" />
            <span>الآيات المتقنة:</span>
            <span className="text-[#104B40] font-black">{masteredKeys.length} آية</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>مرات التكرار:</span>
            <span className="text-[#104B40] font-black">{progress.repetitionCount} مرة</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>الاختبارات الناجحة:</span>
            <span className="text-[#104B40] font-black">{progress.testsPassed}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
