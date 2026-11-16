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
  ChevronRight,
  ChevronLeft,
  Layers,
  Award,
  Flame,
  Calendar,
  RefreshCw,
  FileBarChart2,
  Eye,
  EyeOff,
  Lightbulb,
  Repeat,
  SkipBack,
  WifiOff,
  Scissors,
  ShieldAlert,
  Check,
  X,
  BarChart3,
  Sliders,
  Grid,
  Upload,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileAudio,
} from 'lucide-react';
import { SURAH_LIST, fetchSurah } from '../../data/quranData';
import { getPageMetadata, JUZ_LIST, QURAN_SURAHS } from '../../data/quranPagesData';
import { getPageAyahs, loadFullQuran, QuranPageGroup } from '../../utils/quranFullService';
import { AppLanguage, getTranslation } from '../../utils/i18n';
import { soundService } from '../../utils/audioPlayer';
import { userStatsTracker } from '../../utils/userStatsTracker';
import {
  AnalysisSpeedMode,
  NoiseGateLevel,
  QuranMicRecorder,
  RecordedAudioClip,
  RecitationEvaluationResult,
  SheikhPersistentState,
  SheikhSessionReport,
  UploadLifecycleStatus,
  WordEvaluationItem,
  computeDashboardMetrics,
  loadSheikhPersistentState,
  prepareUploadedAudioFile,
  saveSheikhPersistentState,
  splitAyahIntoChunks,
  submitRecitationForAnalysis,
  fetchSheikhVoiceAudio,
  triggerMistakeVibration,
} from '../../utils/quranRecitationEngine';
import {
  QuickCorrectionFeedbackModal,
  SheikhAdvancedSettingsPanel,
  SheikhMemorizationDashboard,
} from './SheikhDashboardAndSettings';

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

export interface DetectedTajweedRule {
  ruleName: string;
  category: 'qalqalah' | 'ghunnah' | 'madd' | 'noon_sakinah' | 'tafkheem';
  exampleWords: string[];
  explanation: string;
  tip: string;
}

function analyzeAyahTajweedRules(text: string): DetectedTajweedRule[] {
  const rules: DetectedTajweedRule[] = [];
  if (!text) return rules;
  const words = text.split(/\s+/).filter(Boolean);

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

const UPLOAD_STATUS_LABELS: Record<UploadLifecycleStatus, string> = {
  idle: 'جاهز للتسميع أو رفع ملف صوتي',
  requesting_permission: 'جاري طلب إذن الميكروفون...',
  recording: 'جاري التسجيل... رتّل بوضوح',
  preparing: 'جاري فحص وتجهيز الملف الصوتي...',
  uploading: 'جاري الإرسال إلى محرك التحليل...',
  analyzing: 'جاري تحليل التلاوة ومطابقة الكلمات...',
  completed: 'اكتمل التحليل ✓',
  failed: 'تعذر التحليل — يمكنك إعادة المحاولة',
};

type TutorTab =
  | 'talqeen'
  | 'recitation'
  | 'quiz'
  | 'dashboard'
  | 'settings';

export const SmartSheikhTutor: React.FC<SmartSheikhTutorProps> = ({
  initialSurah,
  initialAyah,
  language = 'ar',
  onClose,
}) => {
  const t = getTranslation(language);
  const isRtl = language === 'ar';

  // Persistent state initialization (restores last Surah, Ayah, settings, mastered log & weak log)
  const [persisted, setPersisted] = useState<SheikhPersistentState>(() => loadSheikhPersistentState());

  const [selectedSurah, setSelectedSurah] = useState<number>(
    () => initialSurah || persisted.lastSurah || 1
  );
  const [selectedAyah, setSelectedAyah] = useState<number>(
    () => initialAyah || persisted.lastAyah || 1
  );

  const [currentSurahData, setCurrentSurahData] = useState<{
    number: number;
    name: string;
    numberOfAyahs: number;
    ayahs: Array<{ number: number; numberInSurah: number; text: string }>;
  } | null>(null);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(true);

  // Tutor configuration synced cleanly to persistence
  const [selectedReciter, setSelectedReciter] = useState<string>(persisted.selectedReciter);
  const [dialect, setDialect] = useState<SheikhDialect>(persisted.dialect);
  const [targetRepeats, setTargetRepeats] = useState<number>(persisted.targetRepeats);
  const [currentRepeat, setCurrentRepeat] = useState<number>(0);
  const [rangeStart, setRangeStart] = useState<number>(persisted.rangeStart || 1);
  const [rangeEnd, setRangeEnd] = useState<number>(persisted.rangeEnd || 7);
  const [playbackUnit, setPlaybackUnit] = useState<'full' | 'chunked'>(persisted.playbackUnit || 'full');
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);
  const [correctionMode, setCorrectionMode] = useState<'instant' | 'training'>(
    persisted.correctionMode || 'instant'
  );
  const [autoAdvanceOnMastery, setAutoAdvanceOnMastery] = useState<boolean>(
    persisted.autoAdvanceOnMastery
  );
  const [autoRepeatFailedAyah, setAutoRepeatFailedAyah] = useState<boolean>(
    persisted.autoRepeatFailedAyah
  );
  const [micSensitivity, setMicSensitivity] = useState<number>(persisted.micSensitivity ?? 1.0);
  const [noiseGateLevel, setNoiseGateLevel] = useState<NoiseGateLevel>(
    persisted.noiseGateLevel || 'medium'
  );
  const [analysisSpeed, setAnalysisSpeed] = useState<AnalysisSpeedMode>(
    persisted.analysisSpeed || 'balanced'
  );
  const [hapticFeedbackEnabled, setHapticFeedbackEnabled] = useState<boolean>(
    persisted.hapticFeedbackEnabled ?? true
  );
  const [quickCorrectionPopupEnabled, setQuickCorrectionPopupEnabled] = useState<boolean>(
    persisted.quickCorrectionPopupEnabled ?? true
  );

  // Mode Tabs, Unit Mode (Ayah vs Full Mushaf Page 1..604) & Pickers
  const [unitType, setUnitType] = useState<'ayah' | 'page'>(() => persisted.unitType || 'ayah');
  const [selectedPage, setSelectedPage] = useState<number>(() => persisted.lastPage || 1);
  const [pageGroups, setPageGroups] = useState<QuranPageGroup[]>([]);
  const [loadingPage, setLoadingPage] = useState<boolean>(false);
  const [showPagePickerModal, setShowPagePickerModal] = useState<boolean>(false);
  const [showSessionControls, setShowSessionControls] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [activePagePlayingIndex, setActivePagePlayingIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<TutorTab>('talqeen');
  const [showAyahGridPicker, setShowAyahGridPicker] = useState<boolean>(false);

  // Audio playback state (Talqeen)
  const [isPlayingReciter, setIsPlayingReciter] = useState<boolean>(false);
  const [isTalqeenPaused, setIsTalqeenPaused] = useState<boolean>(false);
  const [reciterSpeed, setReciterSpeed] = useState<0.75 | 1.0 | 1.25>(1.0);
  const [hideAyahInRecitation, setHideAyahInRecitation] = useState<boolean>(false);
  const [sheikhSpeaking, setSheikhSpeaking] = useState<boolean>(false);
  const [sheikhSpeechText, setSheikhSpeechText] = useState<string>('');

  // Mic & Upload Lifecycle state
  const [uploadStatus, setUploadStatus] = useState<UploadLifecycleStatus>('idle');
  const [lastUserRecitationUrl, setLastUserRecitationUrl] = useState<string | null>(null);
  const [isPlayingUserClip, setIsPlayingUserClip] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [lastClipForRetry, setLastClipForRetry] = useState<{
    clip: RecordedAudioClip;
    ayahNumber: number;
    pageNumber?: number;
    expectedText: string;
  } | null>(null);

  // Recitation Evaluation Result State (never faked before server responds!)
  const [evaluationResult, setEvaluationResult] = useState<RecitationEvaluationResult | null>(null);
  const [selectedWordDetail, setSelectedWordDetail] = useState<WordEvaluationItem | null>(null);
  const [quickCorrectionWords, setQuickCorrectionWords] = useState<WordEvaluationItem[] | null>(null);

  // Quiz / Memorization Test state
  const [quizType, setQuizType] = useState<'hide' | 'complete' | 'random'>('hide');
  const [quizRevealed, setQuizRevealed] = useState<boolean>(false);
  const [revealedHintCount, setRevealedHintCount] = useState<number>(0);

  // Live Session Tracking for Report Modal
  const [sessionStartMs] = useState<number>(() => Date.now());
  const [sessionAyahsReviewed, setSessionAyahsReviewed] = useState<number[]>([]);
  const [sessionCorrectWords, setSessionCorrectWords] = useState<number>(0);
  const [sessionErrorWords, setSessionErrorWords] = useState<number>(0);
  const [sessionForgottenWords, setSessionForgottenWords] = useState<string[]>([]);
  const [sessionFailedAyahs, setSessionFailedAyahs] = useState<number[]>([]);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Refs for cleanup and preventing stale closures
  const reciterAudioRef = useRef<HTMLAudioElement | null>(null);
  const userRecitationAudioRef = useRef<HTMLAudioElement | null>(null);
  const sheikhTtsAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const micRecorderRef = useRef<QuranMicRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const uploadStatusRef = useRef<UploadLifecycleStatus>('idle');

  useEffect(() => {
    uploadStatusRef.current = uploadStatus;
  }, [uploadStatus]);

  useEffect(() => {
    if (reciterAudioRef.current) {
      reciterAudioRef.current.playbackRate = reciterSpeed;
    }
  }, [reciterSpeed]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Persist user configuration + position automatically
  useEffect(() => {
    setPersisted((prev) => {
      const next: SheikhPersistentState = {
        ...prev,
        lastSurah: selectedSurah,
        lastAyah: selectedAyah,
        lastPage: selectedPage,
        unitType,
        selectedReciter,
        dialect,
        targetRepeats,
        rangeStart,
        rangeEnd,
        playbackUnit,
        correctionMode,
        autoAdvanceOnMastery,
        autoRepeatFailedAyah,
        micSensitivity,
        noiseGateLevel,
        analysisSpeed,
        hapticFeedbackEnabled,
        quickCorrectionPopupEnabled,
      };
      saveSheikhPersistentState(next);
      return next;
    });
  }, [
    selectedSurah,
    selectedAyah,
    selectedPage,
    unitType,
    selectedReciter,
    dialect,
    targetRepeats,
    rangeStart,
    rangeEnd,
    playbackUnit,
    correctionMode,
    autoAdvanceOnMastery,
    autoRepeatFailedAyah,
    micSensitivity,
    noiseGateLevel,
    analysisSpeed,
    hapticFeedbackEnabled,
    quickCorrectionPopupEnabled,
  ]);

  // Load Full Offline Uthmani Quran Data for selected Surah
  useEffect(() => {
    let active = true;
    setLoadingSurah(true);

    loadFullQuran()
      .then((allSurahs) => {
        if (!active) return;
        const found = allSurahs.find((s) => s.number === selectedSurah);
        if (found && found.ayahs.length > 0) {
          setCurrentSurahData({
            number: found.number,
            name: found.name,
            numberOfAyahs: found.numberOfAyahs,
            ayahs: found.ayahs,
          });
          setRangeStart((r) => Math.max(1, Math.min(r, found.numberOfAyahs)));
          setRangeEnd((r) => Math.max(1, Math.min(r, found.numberOfAyahs)));
          setSelectedAyah((a) => Math.max(1, Math.min(a, found.numberOfAyahs)));
          setLoadingSurah(false);
          return;
        }
        return fetchSurah(selectedSurah).then((fallback) => {
          if (!active) return;
          setCurrentSurahData(fallback);
          setLoadingSurah(false);
        });
      })
      .catch(() => {
        if (!active) return;
        fetchSurah(selectedSurah).then((fallback) => {
          if (!active) return;
          setCurrentSurahData(fallback);
          setLoadingSurah(false);
        });
      });

    return () => {
      active = false;
    };
  }, [selectedSurah]);

  // Load Full Mushaf Page (1..604) when Page mode is active
  useEffect(() => {
    if (unitType !== 'page') return;
    let active = true;
    setLoadingPage(true);
    getPageAyahs(selectedPage)
      .then((groups) => {
        if (!active) return;
        setPageGroups(groups);
        setLoadingPage(false);
      })
      .catch(() => {
        if (active) setLoadingPage(false);
      });
    return () => {
      active = false;
    };
  }, [unitType, selectedPage]);

  const pageMeta = useMemo(() => getPageMetadata(selectedPage), [selectedPage]);
  const pageAyahsFlat = useMemo(() => {
    const flat: Array<{
      surahNumber: number;
      surahName: string;
      numberInSurah: number;
      text: string;
      wordOffset: number;
    }> = [];
    let offset = 0;
    for (const g of pageGroups) {
      for (const a of g.ayahs) {
        const words = a.text.trim().split(/\s+/).filter(Boolean);
        flat.push({
          surahNumber: g.surahNumber,
          surahName: g.surahName,
          numberInSurah: a.numberInSurah,
          text: a.text,
          wordOffset: offset,
        });
        offset += words.length;
      }
    }
    return flat;
  }, [pageGroups]);

  const currentAyahObj = currentSurahData?.ayahs?.find((a) => a.numberInSurah === selectedAyah);
  const rawAyahText: string = currentAyahObj?.text || '';
  const activeExpectedText: string =
    unitType === 'page'
      ? pageAyahsFlat.map((a) => a.text).join(' ').trim()
      : rawAyahText;
  const ayahWords = useMemo(
    () => (activeExpectedText ? activeExpectedText.split(/\s+/).filter(Boolean) : []),
    [activeExpectedText]
  );
  const ayahChunks = useMemo(() => splitAyahIntoChunks(rawAyahText, 5), [rawAyahText]);
  const detectedTajweed = useMemo(() => analyzeAyahTajweedRules(rawAyahText), [rawAyahText]);

  // Helper: Stop all outgoing Sheikh/Reciter audio cleanly (critical before mic recording!)
  const stopAllPlaybackAudio = useCallback(() => {
    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    soundService.stopAudio();
    if (reciterAudioRef.current) {
      try {
        reciterAudioRef.current.pause();
        reciterAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      reciterAudioRef.current = null;
    }
    if (sheikhTtsAudioRef.current) {
      try {
        sheikhTtsAudioRef.current.pause();
      } catch {
        // ignore
      }
      sheikhTtsAudioRef.current = null;
    }
    if (userRecitationAudioRef.current) {
      try {
        userRecitationAudioRef.current.pause();
        userRecitationAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      userRecitationAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingReciter(false);
    setIsPlayingUserClip(false);
    setSheikhSpeaking(false);
    setActivePagePlayingIndex(-1);
  }, []);

  // Cleanup everything on unmount
  useEffect(() => {
    return () => {
      stopAllPlaybackAudio();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (micRecorderRef.current) {
        micRecorderRef.current.abort();
        micRecorderRef.current = null;
      }
    };
  }, [stopAllPlaybackAudio]);

  // Speak Sheikh Guidance (Server natural TTS -> fallback to SpeechSynthesis)
  const speakSheikhMessage = useCallback(
    async (message: string, skipAudioIfRecording = true) => {
      setSheikhSpeechText(message);
      if (skipAudioIfRecording && uploadStatus === 'recording') return;

      setSheikhSpeaking(true);
      const ttsDataUrl = await fetchSheikhVoiceAudio(message, dialect);
      if (!isMountedRef.current) return;

      if (ttsDataUrl) {
        try {
          if (sheikhTtsAudioRef.current) {
            sheikhTtsAudioRef.current.pause();
          }
          const audio = new Audio(ttsDataUrl);
          sheikhTtsAudioRef.current = audio;
          audio.onended = () => {
            if (isMountedRef.current) setSheikhSpeaking(false);
          };
          audio.onerror = () => {
            if (isMountedRef.current) setSheikhSpeaking(false);
          };
          await audio.play();
          return;
        } catch {
          // fallback to speechSynthesis
        }
      }

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setTimeout(() => {
          if (isMountedRef.current) setSheikhSpeaking(false);
        }, 2000);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = dialect === 'egyptian' ? 'ar-EG' : 'ar-SA';
      utterance.rate = 0.94;
      utterance.pitch = 0.9;
      utterance.onend = () => {
        if (isMountedRef.current) setSheikhSpeaking(false);
      };
      utterance.onerror = () => {
        if (isMountedRef.current) setSheikhSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    },
    [dialect, uploadStatus]
  );

  // Sequential Reciter Playback for Full Mushaf Page (auto-advances through pageAyahsFlat)
  const playReciterPageSequence = useCallback(
    (startIndex = 0) => {
      if (uploadStatus === 'recording' || pageAyahsFlat.length === 0) return;
      if (startIndex >= pageAyahsFlat.length) {
        stopAllPlaybackAudio();
        setSheikhSpeechText('اكتملت تلاوة الصفحة الكاملة. يمكنك الآن التسميع بالمايك أو رفع ملف تلاوتك.');
        return;
      }

      const item = pageAyahsFlat[startIndex];
      const reciter = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
      const surahPad = String(item.surahNumber).padStart(3, '0');
      const ayahPad = String(item.numberInSurah).padStart(3, '0');
      const audioUrl = `https://everyayah.com/data/${reciter.folder}/${surahPad}${ayahPad}.mp3`;

      if (reciterAudioRef.current) {
        try {
          reciterAudioRef.current.pause();
        } catch {
          // ignore
        }
      }

      const audio = new Audio(audioUrl);
      audio.playbackRate = reciterSpeed;
      reciterAudioRef.current = audio;
      setIsPlayingReciter(true);
      setIsTalqeenPaused(false);
      setActivePagePlayingIndex(startIndex);

      audio.play().catch(() => {
        if (isMountedRef.current) {
          setIsPlayingReciter(false);
          setActivePagePlayingIndex(-1);
          setErrorBanner('تعذر تشغيل تلاوة الصفحة؛ تحقق من اتصال الإنترنت أو أعد المحاولة.');
        }
      });

      audio.onended = () => {
        if (!isMountedRef.current) return;
        playReciterPageSequence(startIndex + 1);
      };
    },
    [uploadStatus, pageAyahsFlat, selectedReciter, reciterSpeed, stopAllPlaybackAudio]
  );

  // Reciter Ayah Playback with Pause/Resume & Chunking + Page sequence routing
  const playReciterAyah = useCallback(
    (resumeFromPause = false, targetAyahOverride?: number) => {
      if (uploadStatus === 'recording') return;

      if (resumeFromPause && reciterAudioRef.current && isTalqeenPaused) {
        setIsTalqeenPaused(false);
        setIsPlayingReciter(true);
        reciterAudioRef.current.play().catch(() => {
          setIsPlayingReciter(false);
        });
        return;
      }

      if (unitType === 'page' && targetAyahOverride === undefined) {
        stopAllPlaybackAudio();
        playReciterPageSequence(0);
        return;
      }

      const targetAyah = targetAyahOverride ?? selectedAyah;
      soundService.stopAudio();

      stopAllPlaybackAudio();
      setIsTalqeenPaused(false);

      const reciter = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
      const surahPad = String(selectedSurah).padStart(3, '0');
      const ayahPad = String(targetAyah).padStart(3, '0');
      const audioUrl = `https://everyayah.com/data/${reciter.folder}/${surahPad}${ayahPad}.mp3`;

      const audio = new Audio(audioUrl);
      audio.playbackRate = reciterSpeed;
      reciterAudioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (playbackUnit === 'chunked' && ayahChunks.length > 1 && audio.duration > 0) {
          const totalChunks = ayahChunks.length;
          const chunkDuration = audio.duration / totalChunks;
          const startAt = Math.max(0, activeChunkIndex * chunkDuration - 0.15);
          const endAt = Math.min(audio.duration, (activeChunkIndex + 1) * chunkDuration + 0.15);
          audio.currentTime = startAt;
          audio.ontimeupdate = () => {
            if (audio.currentTime >= endAt) {
              audio.pause();
              audio.onended?.(new Event('ended'));
            }
          };
        }
      };

      setIsPlayingReciter(true);
      audio.play().catch(() => {
        if (isMountedRef.current) {
          setIsPlayingReciter(false);
          setErrorBanner('تعذر تشغيل تلاوة القارئ حالياً؛ تحقق من اتصال الإنترنت أو أعد المحاولة.');
        }
      });

      audio.onended = () => {
        if (!isMountedRef.current) return;
        setIsPlayingReciter(false);

        if (playbackUnit === 'chunked' && activeChunkIndex < ayahChunks.length - 1) {
          setActiveChunkIndex((idx) => idx + 1);
          repeatTimeoutRef.current = setTimeout(() => {
            playReciterAyah(false, targetAyah);
          }, 700);
          return;
        }

        setActiveChunkIndex(0);
        setCurrentRepeat((prev) => {
          const next = prev + 1;
          if (targetRepeats === 0 || next < targetRepeats) {
            repeatTimeoutRef.current = setTimeout(() => {
              playReciterAyah(false, targetAyah);
            }, 850);
            return next;
          }
          const prompt =
            dialect === 'egyptian'
              ? 'ما شاء الله، سمعت الآية جيداً.. اضغط الميكروفون الآن وسمّع بصوتك.'
              : 'أحسنت الاستماع، اضغط على زر الميكروفون الآن ورتّل الآية الكريمة.';
          setSheikhSpeechText(prompt);
          return next;
        });
      };
    },
    [
      uploadStatus,
      unitType,
      playReciterPageSequence,
      selectedAyah,
      isTalqeenPaused,
      stopAllPlaybackAudio,
      selectedReciter,
      selectedSurah,
      playbackUnit,
      ayahChunks.length,
      activeChunkIndex,
      targetRepeats,
      dialect,
      reciterSpeed,
    ]
  );

  const pauseReciterAyah = useCallback(() => {
    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    if (reciterAudioRef.current && !reciterAudioRef.current.paused) {
      reciterAudioRef.current.pause();
      setIsPlayingReciter(false);
      setIsTalqeenPaused(true);
    } else {
      stopAllPlaybackAudio();
      setIsTalqeenPaused(false);
    }
  }, [stopAllPlaybackAudio]);

  // Navigation helpers (Ayah & Full Page)
  const resetAyahTransientState = useCallback(() => {
    setCurrentRepeat(0);
    setActiveChunkIndex(0);
    setEvaluationResult(null);
    setSelectedWordDetail(null);
    setErrorBanner(null);
    setUploadStatus('idle');
    setLastUserRecitationUrl(null);
    setUploadedFileName(null);
    setIsPlayingUserClip(false);
    setQuizRevealed(false);
    setRevealedHintCount(0);
    setIsTalqeenPaused(false);
    setActivePagePlayingIndex(-1);
  }, []);

  const handleGoToPage = useCallback(
    (pageNum: number) => {
      const bounded = Math.max(1, Math.min(604, pageNum));
      stopAllPlaybackAudio();
      resetAyahTransientState();
      setSelectedPage(bounded);
      const meta = getPageMetadata(bounded);
      setSelectedSurah(meta.surahNumber);
    },
    [stopAllPlaybackAudio, resetAyahTransientState]
  );

  const handleGoToAyah = useCallback(
    (ayahNum: number) => {
      const max = currentSurahData?.numberOfAyahs || 1;
      const bounded = Math.max(1, Math.min(max, ayahNum));
      stopAllPlaybackAudio();
      resetAyahTransientState();
      setSelectedAyah(bounded);
    },
    [currentSurahData, stopAllPlaybackAudio, resetAyahTransientState]
  );

  const handlePrevAyah = useCallback(() => {
    if (unitType === 'page') {
      if (selectedPage > 1) handleGoToPage(selectedPage - 1);
      return;
    }
    const minBound = Math.max(1, Math.min(rangeStart, rangeEnd));
    if (selectedAyah > minBound) {
      handleGoToAyah(selectedAyah - 1);
    } else if (selectedAyah > 1) {
      handleGoToAyah(selectedAyah - 1);
    }
  }, [unitType, selectedPage, handleGoToPage, selectedAyah, rangeStart, rangeEnd, handleGoToAyah]);

  const handleNextAyah = useCallback(() => {
    if (unitType === 'page') {
      if (selectedPage < 604) handleGoToPage(selectedPage + 1);
      return;
    }
    const maxSurah = currentSurahData?.numberOfAyahs || 1;
    const maxBound = Math.min(maxSurah, Math.max(rangeStart, rangeEnd));
    if (selectedAyah < maxBound) {
      handleGoToAyah(selectedAyah + 1);
    } else if (selectedAyah < maxSurah) {
      handleGoToAyah(selectedAyah + 1);
    }
  }, [unitType, selectedPage, handleGoToPage, selectedAyah, rangeStart, rangeEnd, currentSurahData, handleGoToAyah]);

  // Core analysis execution + stats + feedback + auto-repeat / auto-advance
  const executeAudioEvaluation = useCallback(
    async (
      clip: RecordedAudioClip,
      ayahNum: number,
      expectedTextForClip: string,
      pageNumOverride?: number
    ) => {
      const activeUnit: 'ayah' | 'page' = pageNumOverride ? 'page' : 'ayah';
      const modeParam: 'talqeen' | 'recitation' | 'memorization_test' =
        activeTab === 'quiz' ? 'memorization_test' : activeTab === 'talqeen' ? 'talqeen' : 'recitation';

      setUploadStatus('uploading');
      setErrorBanner(null);
      setLastUserRecitationUrl(clip.playbackDataUrl || null);

      try {
        setUploadStatus('analyzing');
        const evalRes = await submitRecitationForAnalysis({
          clip,
          expectedText: expectedTextForClip,
          surahName:
            activeUnit === 'page'
              ? `صفحة ${pageNumOverride} (${pageMeta.surahName})`
              : currentSurahData?.name || `سورة ${selectedSurah}`,
          surahNumber: activeUnit === 'page' ? pageMeta.surahNumber : selectedSurah,
          ayahNumber: ayahNum,
          pageNumber: pageNumOverride,
          unitType: activeUnit,
          dialect,
          mode: modeParam,
          trainingMode: correctionMode === 'training',
          analysisSpeed,
          adjacentAyahs: activeUnit === 'page' ? [] : currentSurahData?.ayahs || [],
        });

        if (!isMountedRef.current) return;

        setUploadStatus('completed');
        setLastClipForRetry(null);
        setEvaluationResult(evalRes);

        const wrongWords = evalRes.wordResults.filter(
          (w) => w.status === 'error' || w.status === 'missing'
        );
        const correctWords = evalRes.wordResults.filter((w) => w.status === 'correct');
        const isSuccess = evalRes.status === 'perfect' || (evalRes.score >= 80 && wrongWords.length === 0);

        // Update session metrics
        setSessionAyahsReviewed((prev) => (prev.includes(ayahNum) ? prev : [...prev, ayahNum]));
        setSessionCorrectWords((prev) => prev + correctWords.length);
        setSessionErrorWords((prev) => prev + wrongWords.length);
        if (wrongWords.length > 0) {
          setSessionForgottenWords((prev) =>
            Array.from(new Set([...prev, ...wrongWords.map((w) => w.expectedWord)])).slice(0, 30)
          );
          setSessionFailedAyahs((prev) => (prev.includes(ayahNum) ? prev : [...prev, ayahNum]));
        }

        // Update Profile stats tracker
        userStatsTracker.recordSheikhRecitation(
          selectedSurah,
          ayahNum,
          correctWords.length,
          isSuccess
        );

        const ayahKey = `${selectedSurah}:${ayahNum}`;
        const surahNameLabel = currentSurahData?.name || `سورة ${selectedSurah}`;
        const now = new Date();
        const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(now.getDate()).padStart(2, '0')}`;

        if (isSuccess) {
          soundService.playSuccessCelebration();
          if (activeTab === 'quiz') {
            setQuizRevealed(true);
          }

          const reviewDate = new Date();
          reviewDate.setDate(reviewDate.getDate() + 3);

          setPersisted((prev) => {
            const wasMasteredAlready = Boolean(prev.masteredAyahs[ayahKey]);
            const existingStage = prev.masteredAyahs[ayahKey]?.reviewStage || 0;
            const oldDay = prev.dailyMemorizedHistory[todayIso] || {
              date: todayIso,
              masteredCount: 0,
              attemptsCount: 0,
              correctWords: 0,
              avgScore: 0,
            };
            const nextAttempts = oldDay.attemptsCount + 1;
            const nextAvg = Math.round(
              (oldDay.avgScore * oldDay.attemptsCount + evalRes.score) / nextAttempts
            );
            const nextState: SheikhPersistentState = {
              ...prev,
              dailyMemorizedHistory: {
                ...prev.dailyMemorizedHistory,
                [todayIso]: {
                  date: todayIso,
                  masteredCount: oldDay.masteredCount + (wasMasteredAlready ? 0 : 1),
                  attemptsCount: nextAttempts,
                  correctWords: oldDay.correctWords + correctWords.length,
                  avgScore: nextAvg,
                },
              },
              masteredAyahs: {
                ...prev.masteredAyahs,
                [ayahKey]: {
                  surahNumber: selectedSurah,
                  ayahNumber: ayahNum,
                  surahName: surahNameLabel,
                  masteredDate: prev.masteredAyahs[ayahKey]?.masteredDate || todayIso,
                  nextReviewDate: reviewDate.toISOString().split('T')[0],
                  reviewStage: existingStage + 1,
                  bestScore: Math.max(prev.masteredAyahs[ayahKey]?.bestScore || 0, evalRes.score),
                },
              },
              pendingRetries: prev.pendingRetries.filter(
                (p) => !(p.surahNumber === selectedSurah && p.ayahNumber === ayahNum)
              ),
              repetitionCount: prev.repetitionCount + 1,
              testsPassed: prev.testsPassed + (activeTab === 'quiz' ? 1 : 0),
            };
            saveSheikhPersistentState(nextState);
            return nextState;
          });

          const praise =
            evalRes.sheikhScript ||
            (dialect === 'egyptian'
              ? `ما شاء الله تبارك الله! تلاوة متقنة بنسبة ${evalRes.score}%.`
              : `أحسنت القراءة يا بني، إتقان بنسبة ${evalRes.score}%.`);
          speakSheikhMessage(praise, false);

          const maxRange = Math.min(
            currentSurahData?.numberOfAyahs || 1,
            Math.max(rangeStart, rangeEnd)
          );
          if (autoAdvanceOnMastery && ayahNum < maxRange) {
            repeatTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                handleGoToAyah(ayahNum + 1);
              }
            }, 2600);
          }
        } else {
          // INTERACTIVE FEEDBACK: Vibration + subtle tick + Quick Correction Popup
          if (hapticFeedbackEnabled) {
            triggerMistakeVibration();
          }
          if (correctionMode === 'instant' && wrongWords.length > 0) {
            soundService.playRecitationTick();
          }
          if (quickCorrectionPopupEnabled && wrongWords.length > 0) {
            setQuickCorrectionWords(wrongWords);
          }

          // Persist recurring weak-Ayah errors + daily attempt telemetry
          setPersisted((prev) => {
            const oldRec = prev.weakAyahErrors[ayahKey];
            const oldDay = prev.dailyMemorizedHistory[todayIso] || {
              date: todayIso,
              masteredCount: 0,
              attemptsCount: 0,
              correctWords: 0,
              avgScore: 0,
            };
            const nextAttempts = oldDay.attemptsCount + 1;
            const nextAvg = Math.round(
              (oldDay.avgScore * oldDay.attemptsCount + evalRes.score) / nextAttempts
            );
            const mergedWeakWords = Array.from(
              new Set([
                ...(oldRec?.weakWords || []),
                ...wrongWords.map((w) => w.expectedWord),
              ])
            ).slice(0, 10);

            const nextState: SheikhPersistentState = {
              ...prev,
              dailyMemorizedHistory: {
                ...prev.dailyMemorizedHistory,
                [todayIso]: {
                  date: todayIso,
                  masteredCount: oldDay.masteredCount,
                  attemptsCount: nextAttempts,
                  correctWords: oldDay.correctWords + correctWords.length,
                  avgScore: nextAvg,
                },
              },
              weakAyahErrors: {
                ...prev.weakAyahErrors,
                [ayahKey]: {
                  key: ayahKey,
                  surahNumber: selectedSurah,
                  ayahNumber: ayahNum,
                  surahName: surahNameLabel,
                  errorCount: (oldRec?.errorCount || 0) + Math.max(1, wrongWords.length),
                  lastErrorIso: new Date().toISOString(),
                  weakWords: mergedWeakWords,
                },
              },
              pendingRetries: prev.pendingRetries.filter(
                (p) => !(p.surahNumber === selectedSurah && p.ayahNumber === ayahNum)
              ),
              repetitionCount: prev.repetitionCount + 1,
            };
            saveSheikhPersistentState(nextState);
            return nextState;
          });

          const guidance =
            evalRes.sheikhScript ||
            (dialect === 'egyptian'
              ? 'محاولة طيبة يا بني، انتبه للكلمات المحددة بالأحمر وأعد التلاوة.'
              : 'جهد مبارك يا بني، راجع الكلمات المحددة بالأحمر ثم أعد التلاوة.');
          speakSheikhMessage(guidance, false);

          // Auto-repeat Ayah from Sheikh only if popup is not waiting for immediate user action
          if (autoRepeatFailedAyah && correctionMode === 'instant' && !quickCorrectionPopupEnabled) {
            repeatTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current && uploadStatusRef.current !== 'recording') {
                playReciterAyah(false, ayahNum);
              }
            }, 2400);
          }
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        const msg = err?.message || 'تعذر إرسال التلاوة للتحليل. تحقق من الإنترنت وحاول مجدداً.';
        setUploadStatus('failed');
        setErrorBanner(msg);
        setLastClipForRetry({
          clip,
          ayahNumber: ayahNum,
          pageNumber: pageNumOverride,
          expectedText: expectedTextForClip,
        });

        // Record pending retry metadata offline
        setPersisted((prev) => {
          const filtered = prev.pendingRetries.filter(
            (p) => !(p.surahNumber === selectedSurah && p.ayahNumber === ayahNum)
          );
          const nextState: SheikhPersistentState = {
            ...prev,
            pendingRetries: [
              {
                surahNumber: selectedSurah,
                ayahNumber: ayahNum,
                pageNumber: pageNumOverride,
                unitType: (pageNumOverride ? 'page' : 'ayah') as 'ayah' | 'page',
                expectedText: expectedTextForClip,
                mode: modeParam,
                createdAtIso: new Date().toISOString(),
                lastError: msg,
              },
              ...filtered,
            ].slice(0, 10),
          };
          saveSheikhPersistentState(nextState);
          return nextState;
        });
      }
    },
    [
      activeTab,
      currentSurahData,
      pageMeta,
      selectedSurah,
      dialect,
      correctionMode,
      analysisSpeed,
      hapticFeedbackEnabled,
      quickCorrectionPopupEnabled,
      rangeStart,
      rangeEnd,
      autoAdvanceOnMastery,
      autoRepeatFailedAyah,
      handleGoToAyah,
      speakSheikhMessage,
      playReciterAyah,
    ]
  );

  const togglePlayUserRecitation = useCallback(() => {
    if (!lastUserRecitationUrl) return;
    if (isPlayingUserClip && userRecitationAudioRef.current) {
      userRecitationAudioRef.current.pause();
      setIsPlayingUserClip(false);
      return;
    }
    stopAllPlaybackAudio();
    try {
      const audio = new Audio(lastUserRecitationUrl);
      userRecitationAudioRef.current = audio;
      audio.onended = () => {
        if (isMountedRef.current) setIsPlayingUserClip(false);
      };
      audio.onerror = () => {
        if (isMountedRef.current) setIsPlayingUserClip(false);
      };
      setIsPlayingUserClip(true);
      audio.play().catch(() => {
        if (isMountedRef.current) setIsPlayingUserClip(false);
      });
    } catch {
      setIsPlayingUserClip(false);
    }
  }, [lastUserRecitationUrl, isPlayingUserClip, stopAllPlaybackAudio]);

  // Upload Audio File Handler (MP3, WAV, M4A, WebM, OGG, AAC, FLAC, 3GP, AMR)
  const handleAudioFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      if (!activeExpectedText.trim()) {
        setErrorBanner('انتظر تحميل النص القرآني قبل تحليل الملف الصوتي.');
        return;
      }

      stopAllPlaybackAudio();
      setErrorBanner(null);
      setEvaluationResult(null);
      setSelectedWordDetail(null);
      setQuickCorrectionWords(null);
      setLastClipForRetry(null);
      setUploadedFileName(file.name);
      setUploadStatus('preparing');

      try {
        const clip = await prepareUploadedAudioFile(file, { noiseGateLevel });
        if (!isMountedRef.current) return;

        if (!clip.hasSpeechEnergy) {
          setUploadStatus('failed');
          setErrorBanner('الملف الصوتي صامت أو لا يحتوي على صوت واضح للتحليل.');
          return;
        }

        await executeAudioEvaluation(
          clip,
          selectedAyah,
          activeExpectedText,
          unitType === 'page' ? selectedPage : undefined
        );
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setUploadStatus('failed');
        setErrorBanner(err?.message || 'تعذر قراءة أو رفع الملف الصوتي المختار.');
      }
    },
    [
      activeExpectedText,
      stopAllPlaybackAudio,
      noiseGateLevel,
      executeAudioEvaluation,
      selectedAyah,
      unitType,
      selectedPage,
    ]
  );

  // Start Real Audio Recording (strictly stops reciter/TTS audio first!)
  const startRecording = useCallback(async () => {
    if (!activeExpectedText.trim()) {
      setErrorBanner('انتظر تحميل النص القرآني أولاً.');
      return;
    }

    // Isolate mic: guarantee no reciter or Sheikh voice bleeds into recording
    stopAllPlaybackAudio();
    setErrorBanner(null);
    setEvaluationResult(null);
    setSelectedWordDetail(null);
    setQuickCorrectionWords(null);
    setLastClipForRetry(null);
    setLastUserRecitationUrl(null);
    setUploadedFileName(null);
    setRecordingSeconds(0);
    setMicLevel(0);
    setUploadStatus('requesting_permission');

    const recorder = new QuranMicRecorder();
    micRecorderRef.current = recorder;

    try {
      await recorder.start(
        (level) => {
          if (isMountedRef.current) setMicLevel(level);
        },
        { sensitivity: micSensitivity, noiseGateLevel }
      );
      if (!isMountedRef.current) {
        recorder.abort();
        return;
      }

      setUploadStatus('recording');
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const startedAt = Date.now();
      recordingTimerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
        }
      }, 250);
    } catch (err: any) {
      micRecorderRef.current = null;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setUploadStatus('failed');
      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setErrorBanner('تم رفض إذن الميكروفون. يرجى تفعيل صلاحية الميكروفون من إعدادات المتصفح أو التطبيق.');
      } else if (errName === 'NotFoundError') {
        setErrorBanner('لم يتم العثور على ميكروفون متصل بهذا الجهاز.');
      } else {
        setErrorBanner(err?.message || 'تعذر بدء التسجيل الصوتي عبر الميكروفون.');
      }
    }
  }, [activeExpectedText, stopAllPlaybackAudio, micSensitivity, noiseGateLevel]);

  // Stop Recording, Validate Audio Bytes & Send to /api/sheikh/evaluate
  const stopRecordingAndAnalyze = useCallback(async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setMicLevel(0);

    const recorder = micRecorderRef.current;
    micRecorderRef.current = null;
    if (!recorder) {
      setUploadStatus('idle');
      return;
    }

    setUploadStatus('preparing');
    try {
      const clip = await recorder.stopAndFinalize();
      if (!isMountedRef.current) return;

      if (!clip.audioBase64 || clip.byteLength < 800) {
        setUploadStatus('failed');
        setErrorBanner('التسجيل الصوتي قصير جداً أو فارغ. اضغط على «ابدأ التسميع» ورتّل بوضوح.');
        return;
      }

      if (!clip.hasSpeechEnergy) {
        setUploadStatus('failed');
        setErrorBanner('لم يُلتقط صوت مسموع في التسجيل. تأكد من فتح الميكروفون والقرب منه ثم أعد المحاولة.');
        return;
      }

      await executeAudioEvaluation(
        clip,
        selectedAyah,
        activeExpectedText,
        unitType === 'page' ? selectedPage : undefined
      );
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setUploadStatus('failed');
      setErrorBanner(err?.message || 'حدث خطأ أثناء تجهيز الملف الصوتي للتحليل.');
    }
  }, [executeAudioEvaluation, selectedAyah, activeExpectedText, unitType, selectedPage]);

  const retryLastUpload = useCallback(() => {
    if (!lastClipForRetry) return;
    executeAudioEvaluation(
      lastClipForRetry.clip,
      lastClipForRetry.ayahNumber,
      lastClipForRetry.expectedText,
      lastClipForRetry.pageNumber
    );
  }, [lastClipForRetry, executeAudioEvaluation]);

  // Save Session Report snapshot
  const buildCurrentSessionReport = useCallback((): SheikhSessionReport => {
    const totalWords = sessionCorrectWords + sessionErrorWords;
    const masteryPercent =
      totalWords > 0
        ? Math.round((sessionCorrectWords / totalWords) * 100)
        : evaluationResult?.score || 0;
    return {
      id: `sess_${Date.now()}`,
      dateIso: new Date().toISOString(),
      surahNumber: selectedSurah,
      surahName: currentSurahData?.name || `سورة ${selectedSurah}`,
      ayahsReviewed: sessionAyahsReviewed,
      correctWordsCount: sessionCorrectWords,
      errorWordsCount: sessionErrorWords,
      forgottenWords: sessionForgottenWords,
      ayahsNeedingPractice: sessionFailedAyahs,
      masteryPercent,
      durationSeconds: Math.max(1, Math.round((Date.now() - sessionStartMs) / 1000)),
    };
  }, [
    sessionCorrectWords,
    sessionErrorWords,
    evaluationResult,
    selectedSurah,
    currentSurahData,
    sessionAyahsReviewed,
    sessionForgottenWords,
    sessionFailedAyahs,
    sessionStartMs,
  ]);

  const handleOpenReportModal = () => {
    const report = buildCurrentSessionReport();
    if (report.ayahsReviewed.length > 0) {
      setPersisted((prev) => {
        const next: SheikhPersistentState = {
          ...prev,
          sessionHistory: [report, ...prev.sessionHistory.filter((s) => s.id !== report.id)].slice(0, 15),
        };
        saveSheikhPersistentState(next);
        return next;
      });
    }
    setShowReportModal(true);
  };

  // Word Match Lookup for Rendering Ayah Card
  const getWordEvaluation = (index: number, wordText: string): WordEvaluationItem => {
    if (evaluationResult?.wordResults?.length) {
      const match = evaluationResult.wordResults.find((w) => w.positionIndex === index);
      if (match) return match;
    }
    return {
      positionIndex: index,
      expectedWord: wordText,
      status: 'pending',
    };
  };

  const isRecording = uploadStatus === 'recording';
  const isBusyUploading =
    uploadStatus === 'requesting_permission' ||
    uploadStatus === 'preparing' ||
    uploadStatus === 'uploading' ||
    uploadStatus === 'analyzing';

  const masteredKeys = Object.keys(persisted.masteredAyahs);
  const weakErrorList = Object.values(persisted.weakAyahErrors).sort(
    (a, b) => b.errorCount - a.errorCount
  );
  const masteredInCurrentSurah = masteredKeys.filter((k) =>
    k.startsWith(`${selectedSurah}:`)
  ).length;
  const totalInCurrentSurah = currentSurahData?.numberOfAyahs || 1;
  const currentSurahPercent = Math.min(
    100,
    Math.round((masteredInCurrentSurah / totalInCurrentSurah) * 100)
  );
  const totalSessionsWords = sessionCorrectWords + sessionErrorWords;
  const liveSessionMastery =
    totalSessionsWords > 0
      ? Math.round((sessionCorrectWords / totalSessionsWords) * 100)
      : evaluationResult?.score || 0;

  const dashboardMetrics = useMemo(
    () => computeDashboardMetrics(persisted, SURAH_LIST),
    [persisted]
  );

  const activeScopeSubtitle =
    unitType === 'page'
      ? `صفحة ${selectedPage} من 604 · ${pageMeta.surahName} · الجزء ${pageMeta.juzNumber}`
      : currentSurahData?.name
      ? `سورة ${currentSurahData.name} · الآية ${selectedAyah}`
      : t.sheikhSubtitle;

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#172A28]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hidden File Input for Direct Audio Upload (.mp3, .wav, .m4a, .ogg, .webm, .aac, .flac, .3gp, .amr) */}
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac,.flac,.3gp,.amr"
        className="hidden"
        onChange={handleAudioFileSelected}
      />

      {/* COMPACT CLEAN HEADER */}
      <div className="bg-gradient-to-r from-[#0E3E34] via-[#145548] to-[#0E3E34] text-white px-4 pt-3.5 pb-3 shrink-0 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/45 flex items-center justify-center text-[#E6CA85] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black font-cairo truncate">{t.sheikhTitle}</h2>
              <p className="text-[11px] text-white/85 truncate">{activeScopeSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenReportModal}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#C5A059] text-[#104B40] hover:bg-[#d8b673] text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="عرض تقرير الجلسة ومؤشر الإتقان"
            >
              <FileBarChart2 className="w-3.5 h-3.5" />
              <span>التقرير</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={() => {
                  stopAllPlaybackAudio();
                  if (micRecorderRef.current) micRecorderRef.current.abort();
                  onClose();
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.closeBtn}
              </button>
            )}
          </div>
        </div>

        {/* STREAMLINED 5-TAB NAVIGATION BAR */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-3 pt-2.5 border-t border-white/10 text-xs font-bold">
          {[
            { id: 'talqeen' as const, label: 'التلقين', Icon: BookOpen },
            { id: 'recitation' as const, label: 'التسميع والرفع', Icon: Mic },
            { id: 'quiz' as const, label: 'اختبار الحفظ', Icon: Award },
            { id: 'dashboard' as const, label: 'لوحة الحفظ', Icon: BarChart3 },
            { id: 'settings' as const, label: 'الإعدادات والتجويد', Icon: Sliders },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (!isRecording) setActiveTab(id);
              }}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === id
                  ? 'bg-[#C5A059] text-[#104B40] shadow-xs font-black'
                  : 'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SPACIOUS SCROLL BODY */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
        {/* UNIFIED SCOPE CONTROLLER: AYAH MODE VS FULL MUSHAF PAGE (1-604) */}
        {activeTab !== 'dashboard' && activeTab !== 'settings' && (
          <div className="moazen-widget rounded-2xl p-3.5 border shadow-xs space-y-2.5">
            {/* Unit Mode Toggle + Collapsible Options Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center p-1 rounded-xl bg-white/75 border border-emerald-950/10 text-xs font-bold">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => {
                    stopAllPlaybackAudio();
                    resetAyahTransientState();
                    setUnitType('ayah');
                  }}
                  className={`min-h-[34px] px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    unitType === 'ayah' ? 'bg-[#104B40] text-white font-black' : 'text-[#4B5B58] hover:text-[#104B40]'
                  }`}
                >
                  تسميع بالآية
                </button>
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => {
                    stopAllPlaybackAudio();
                    resetAyahTransientState();
                    setUnitType('page');
                  }}
                  className={`min-h-[34px] px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    unitType === 'page' ? 'bg-[#104B40] text-white font-black' : 'text-[#4B5B58] hover:text-[#104B40]'
                  }`}
                >
                  صفحة مصحف كاملة (1–604)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSessionControls((v) => !v)}
                className="min-h-[34px] px-3 py-1 rounded-xl bg-white/75 border border-emerald-950/12 text-[#104B40] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:border-[#C5A059]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#B38632]" />
                <span>خيارات القارئ والسرعة</span>
                {showSessionControls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Active Selector Row (Surah/Ayah OR Full Mushaf Page) */}
            {unitType === 'ayah' ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="اختر السورة"
                    value={selectedSurah}
                    disabled={isRecording}
                    onChange={(e) => {
                      const newNum = Number(e.target.value);
                      const meta = SURAH_LIST.find((s) => s.number === newNum);
                      stopAllPlaybackAudio();
                      resetAyahTransientState();
                      setSelectedSurah(newNum);
                      setSelectedAyah(1);
                      setRangeStart(1);
                      setRangeEnd(meta?.numberOfAyahs || 7);
                    }}
                    className="min-h-[40px] text-xs font-bold bg-white/80 border border-emerald-950/15 rounded-xl px-2.5 py-1.5 text-[#104B40] focus:outline-none cursor-pointer"
                  >
                    {SURAH_LIST.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.number}. سورة {s.name} ({s.numberOfAyahs})
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="اختر الآية"
                    value={selectedAyah}
                    disabled={isRecording}
                    onChange={(e) => handleGoToAyah(Number(e.target.value))}
                    className="min-h-[40px] text-xs font-bold bg-white/80 border border-emerald-950/15 rounded-xl px-2.5 py-1.5 text-[#104B40] focus:outline-none cursor-pointer tabular-nums"
                  >
                    {Array.from(
                      { length: currentSurahData?.numberOfAyahs || 1 },
                      (_, i) => i + 1
                    ).map((num) => {
                      const isDone = Boolean(persisted.masteredAyahs[`${selectedSurah}:${num}`]);
                      return (
                        <option key={num} value={num}>
                          الآية {num} {isDone ? '✓' : ''}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowAyahGridPicker((v) => !v)}
                    disabled={isRecording}
                    className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      showAyahGridPicker
                        ? 'bg-[#104B40] text-white border-[#104B40]'
                        : 'bg-white/80 text-[#104B40] border-emerald-950/15 hover:border-[#C5A059]'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>فهرس الآيات</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevAyah}
                    disabled={selectedAyah <= 1 || isRecording}
                    className="min-h-[40px] px-2.5 rounded-xl bg-white/80 border border-emerald-950/15 hover:bg-white disabled:opacity-35 cursor-pointer text-xs font-bold text-[#104B40] flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابقة</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextAyah}
                    disabled={
                      !currentSurahData ||
                      selectedAyah >= (currentSurahData.numberOfAyahs || 1) ||
                      isRecording
                    }
                    className="min-h-[40px] px-2.5 rounded-xl bg-[#104B40] hover:bg-[#0c3a31] disabled:opacity-35 cursor-pointer text-xs font-bold text-white flex items-center gap-1"
                  >
                    <span>التالية</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* FULL MUSHAF PAGE PICKER ROW (PAGES 1 - 604) */
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="الانتقال إلى سورة في المصحف"
                    value={pageMeta.surahNumber}
                    disabled={isRecording}
                    onChange={(e) => {
                      const foundSurahNum = Number(e.target.value);
                      const surahObj = QURAN_SURAHS.find((item) => item.number === foundSurahNum);
                      if (surahObj) {
                        handleGoToPage(surahObj.startPage);
                      }
                    }}
                    className="min-h-[40px] text-xs font-bold bg-white/80 border border-emerald-950/15 rounded-xl px-2.5 py-1.5 text-[#104B40] focus:outline-none cursor-pointer"
                  >
                    {SURAH_LIST.map((s) => (
                      <option key={s.number} value={s.number}>
                        سورة {s.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 bg-white/80 border border-emerald-950/15 rounded-xl px-2 py-1">
                    <span className="text-[11px] font-bold text-[#4B5B58]">صفحة</span>
                    <input
                      aria-label="رقم الصفحة من 1 إلى 604"
                      type="number"
                      min={1}
                      max={604}
                      disabled={isRecording}
                      value={selectedPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!Number.isNaN(val)) handleGoToPage(val);
                      }}
                      className="w-14 text-center font-black text-xs text-[#104B40] bg-transparent focus:outline-none tabular-nums"
                    />
                    <span className="text-[11px] font-bold text-[#5C6D6A] tabular-nums">/ 604</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPagePickerModal((v) => !v)}
                    disabled={isRecording}
                    className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      showPagePickerModal
                        ? 'bg-[#104B40] text-white border-[#104B40]'
                        : 'bg-white/80 text-[#104B40] border-emerald-950/15 hover:border-[#C5A059]'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>فهرس الأجزاء والصفحات</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevAyah}
                    disabled={selectedPage <= 1 || isRecording}
                    className="min-h-[40px] px-2.5 rounded-xl bg-white/80 border border-emerald-950/15 hover:bg-white disabled:opacity-35 cursor-pointer text-xs font-bold text-[#104B40] flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>الصفحة السابقة</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextAyah}
                    disabled={selectedPage >= 604 || isRecording}
                    className="min-h-[40px] px-2.5 rounded-xl bg-[#104B40] hover:bg-[#0c3a31] disabled:opacity-35 cursor-pointer text-xs font-bold text-white flex items-center gap-1"
                  >
                    <span>الصفحة التالية</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Expandable Visual Ayah Picker Grid */}
            {unitType === 'ayah' && showAyahGridPicker && currentSurahData && (
              <div className="p-2.5 rounded-xl bg-white/75 border border-emerald-950/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#4B5B58]">
                  <span>اختر آية من سورة {currentSurahData.name}:</span>
                  <span className="tabular-nums">{currentSurahData.numberOfAyahs} آية</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {currentSurahData.ayahs.map((a) => {
                    const key = `${selectedSurah}:${a.numberInSurah}`;
                    const isMastered = Boolean(persisted.masteredAyahs[key]);
                    const isWeak = Boolean(persisted.weakAyahErrors[key]);
                    const isCurrent = a.numberInSurah === selectedAyah;
                    return (
                      <button
                        key={a.numberInSurah}
                        type="button"
                        onClick={() => {
                          handleGoToAyah(a.numberInSurah);
                          setShowAyahGridPicker(false);
                        }}
                        className={`min-w-[40px] h-9 px-2 rounded-lg text-xs font-black tabular-nums cursor-pointer border transition-colors ${
                          isCurrent
                            ? 'bg-[#C5A059] text-[#104B40] border-[#104B40]'
                            : isMastered
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : isWeak
                            ? 'bg-rose-50 text-rose-900 border-rose-300'
                            : 'bg-white text-[#172A28] border-emerald-950/15 hover:border-[#C5A059]'
                        }`}
                      >
                        {a.numberInSurah}
                        {isMastered ? ' ✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expandable Visual Juz & Page Picker (Pages 1-604) */}
            {unitType === 'page' && showPagePickerModal && (
              <div className="p-2.5 rounded-xl bg-white/75 border border-emerald-950/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#4B5B58]">
                  <span>الانتقال السريع إلى بدايات الأجزاء الثلاثين:</span>
                  <span className="tabular-nums">صفحة {selectedPage} / 604</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-40 overflow-y-auto">
                  {JUZ_LIST.map((juz) => {
                    const isCurrentJuz = pageMeta.juzNumber === juz.number;
                    return (
                      <button
                        key={juz.number}
                        type="button"
                        onClick={() => {
                          handleGoToPage(juz.startPage);
                          setShowPagePickerModal(false);
                        }}
                        className={`p-2 rounded-lg text-[11px] font-bold border text-right cursor-pointer transition-colors ${
                          isCurrentJuz
                            ? 'bg-[#104B40] text-white border-[#104B40]'
                            : 'bg-white text-[#172A28] border-emerald-950/12 hover:border-[#C5A059]'
                        }`}
                      >
                        <span className="block font-black">الجزء {juz.number}</span>
                        <span className={`text-[10px] tabular-nums ${isCurrentJuz ? 'text-white/80' : 'text-[#5C6D6A]'}`}>
                          ص {juz.startPage}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COLLAPSIBLE SESSION OPTIONS (Decluttered by default!) */}
            {showSessionControls && (
              <div className="pt-2.5 border-t border-emerald-950/10 space-y-2.5 text-xs animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Reciter Selector */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#4B5B58]">القارئ:</span>
                    <select
                      value={selectedReciter}
                      onChange={(e) => {
                        stopAllPlaybackAudio();
                        setSelectedReciter(e.target.value);
                      }}
                      className="text-xs font-bold bg-white/85 border border-emerald-950/15 rounded-xl px-2.5 py-1.5 text-[#104B40] focus:outline-none cursor-pointer"
                    >
                      {RECITERS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sheikh Dialect */}
                  <div className="flex items-center gap-1 bg-white/75 p-1 rounded-xl border border-emerald-950/12">
                    <button
                      type="button"
                      onClick={() => {
                        setDialect('egyptian');
                        speakSheikhMessage('أهلاً بك يا بني، رتّل بتؤدة وسأتابع معك كلمة بكلمة.');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                        dialect === 'egyptian' ? 'bg-[#C5A059] text-[#104B40]' : 'text-[#4B5B58]'
                      }`}
                    >
                      لهجة مصرية
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDialect('fusha');
                        speakSheikhMessage('مرحباً بك يا بني، رتّل كلام الله بخشوع وسأصحح لك بدقة.');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                        dialect === 'fusha' ? 'bg-[#C5A059] text-[#104B40]' : 'text-[#4B5B58]'
                      }`}
                    >
                      فصحى وقورة
                    </button>
                  </div>

                  {/* Playback Speed */}
                  <div className="flex items-center gap-0.5 bg-white/75 p-1 rounded-xl border border-emerald-950/12">
                    {([0.75, 1.0, 1.25] as const).map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setReciterSpeed(spd)}
                        className={`px-2 py-1 rounded-lg font-bold text-[11px] cursor-pointer tabular-nums ${
                          reciterSpeed === spd ? 'bg-[#C5A059] text-[#104B40]' : 'text-[#4B5B58]'
                        }`}
                      >
                        {spd === 1 ? '1x' : `${spd}x`}
                      </button>
                    ))}
                  </div>
                </div>

                {unitType === 'ayah' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#4B5B58]">نطاق التسميع:</span>
                      <input
                        aria-label="بداية النطاق"
                        type="number"
                        min={1}
                        max={currentSurahData?.numberOfAyahs || 1}
                        value={rangeStart}
                        onChange={(e) => {
                          const v = Math.max(
                            1,
                            Math.min(currentSurahData?.numberOfAyahs || 1, Number(e.target.value) || 1)
                          );
                          setRangeStart(v);
                          if (selectedAyah < v) handleGoToAyah(v);
                        }}
                        className="w-14 text-center font-bold bg-white/85 border border-emerald-950/15 rounded-lg py-1 text-[#104B40]"
                      />
                      <span className="text-gray-400">←</span>
                      <input
                        aria-label="نهاية النطاق"
                        type="number"
                        min={1}
                        max={currentSurahData?.numberOfAyahs || 1}
                        value={rangeEnd}
                        onChange={(e) => {
                          const v = Math.max(
                            rangeStart,
                            Math.min(currentSurahData?.numberOfAyahs || 1, Number(e.target.value) || 1)
                          );
                          setRangeEnd(v);
                        }}
                        className="w-14 text-center font-bold bg-white/85 border border-emerald-950/15 rounded-lg py-1 text-[#104B40]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setPlaybackUnit((p) => (p === 'full' ? 'chunked' : 'full'));
                          setActiveChunkIndex(0);
                        }}
                        className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                          playbackUnit === 'chunked'
                            ? 'bg-[#104B40] text-white border-[#104B40]'
                            : 'bg-white/80 text-[#104B40] border-emerald-950/15'
                        }`}
                      >
                        {playbackUnit === 'chunked' ? 'تقطيع للمقاطع ✓' : 'آية كاملة'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setCorrectionMode((m) => (m === 'instant' ? 'training' : 'instant'))}
                        className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                          correctionMode === 'training'
                            ? 'bg-[#104B40] text-white border-[#104B40]'
                            : 'bg-white/80 text-[#104B40] border-emerald-950/15'
                        }`}
                      >
                        {correctionMode === 'training' ? 'تدريب بلا مقاطعة ✓' : 'تصحيح فوري'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAutoAdvanceOnMastery((v) => !v)}
                        className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                          !autoAdvanceOnMastery
                            ? 'bg-[#104B40] text-white border-[#104B40]'
                            : 'bg-white/80 text-[#104B40] border-emerald-950/15'
                        }`}
                      >
                        {autoAdvanceOnMastery ? 'تقدم تلقائي' : 'تقدم يدوي ✓'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="font-bold text-[#4B5B58]">تكرار الآية:</span>
                  {[1, 2, 3, 5, 0].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTargetRepeats(num)}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                        targetRepeats === num
                          ? 'bg-[#C5A059] text-[#104B40]'
                          : 'bg-white/80 text-[#4B5B58] border border-emerald-950/12'
                      }`}
                    >
                      {num === 0 ? 'مستمر' : `${num}×`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPACT STATUS PILL (Only prominent when recording, uploading, failed, or uploaded filename active) */}
        {activeTab !== 'dashboard' &&
          activeTab !== 'settings' &&
          (uploadStatus !== 'idle' || uploadedFileName) && (
            <div
              className={`rounded-2xl px-3.5 py-2.5 border flex items-center justify-between gap-2 text-xs font-bold ${
                uploadStatus === 'recording'
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : uploadStatus === 'failed'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : uploadStatus === 'completed'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : isBusyUploading
                  ? 'bg-sky-50 border-sky-300 text-sky-900'
                  : 'moazen-widget text-[#172A28]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {uploadStatus === 'recording' ? (
                  <Mic className="w-4 h-4 text-rose-600 shrink-0" />
                ) : uploadStatus === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : uploadStatus === 'failed' ? (
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                ) : isBusyUploading ? (
                  <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                ) : (
                  <FileAudio className="w-4 h-4 text-[#104B40] shrink-0" />
                )}
                <span className="truncate">
                  {uploadedFileName
                    ? `${UPLOAD_STATUS_LABELS[uploadStatus]} (${uploadedFileName})`
                    : UPLOAD_STATUS_LABELS[uploadStatus]}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isRecording && (
                  <>
                    <div className="flex items-end gap-0.5 h-4">
                      {[0.2, 0.45, 0.7, 0.9].map((threshold, i) => (
                        <span
                          key={i}
                          className={`w-1 rounded-full transition-all ${
                            micLevel >= threshold ? 'bg-rose-600 h-4' : 'bg-rose-200 h-1.5'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[11px] tabular-nums">{recordingSeconds}ث</span>
                  </>
                )}

                {lastClipForRetry && uploadStatus === 'failed' && (
                  <button
                    type="button"
                    onClick={retryLastUpload}
                    className="px-2.5 py-1 rounded-lg bg-[#104B40] text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>إعادة المحاولة</span>
                  </button>
                )}
              </div>
            </div>
          )}

        {/* ERROR BANNER */}
        {errorBanner && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3 flex items-start justify-between gap-2 text-xs text-rose-900 animate-fadeIn">
            <div className="flex items-start gap-2">
              <WifiOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold leading-relaxed">{errorBanner}</p>
                {lastClipForRetry && (
                  <button
                    type="button"
                    onClick={retryLastUpload}
                    className="mt-1.5 px-3 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>إعادة إرسال التسجيل المحفوظ</span>
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-rose-600 hover:text-rose-900 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SHEIKH COACHING SPEECH BUBBLE */}
        {(sheikhSpeechText || sheikhSpeaking) && (
          <div className="moazen-widget border border-[#104B40]/20 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-[#104B40] text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#104B40]">توجيه شيخي المعلم:</span>
                <span className="text-[10px] text-[#5C6D6A] font-bold">
                  {dialect === 'egyptian' ? 'مصري محبب' : 'فصحى متقنة'}
                </span>
              </div>
              <p className="text-xs text-[#172A28] mt-1 font-medium leading-relaxed">
                {sheikhSpeechText}
              </p>
            </div>
          </div>
        )}

        {/* ============================================================
            CORE WORKSPACE: TALQEEN & RECITATION / FILE UPLOAD
           ============================================================ */}
        {(activeTab === 'talqeen' || activeTab === 'recitation') && (
          <div className="space-y-4">
            {/* MAIN READING & RECITATION FOCUS WIDGET */}
            <div className="moazen-widget rounded-3xl p-4 sm:p-6 border shadow-sm relative overflow-hidden">
              {/* Top Card Metadata & Hide/Show Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-950/10 text-xs">
                <div className="flex items-center gap-2 text-[#104B40] font-bold flex-wrap">
                  {unitType === 'page' ? (
                    <>
                      <span className="font-black">صفحة {selectedPage}</span>
                      <span aria-hidden="true" className="text-emerald-950/25">·</span>
                      <span>سورة {pageMeta.surahName}</span>
                      <span aria-hidden="true" className="text-emerald-950/25">·</span>
                      <span className="text-[#4B5B58]">الجزء {pageMeta.juzNumber}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-black">سورة {currentSurahData?.name}</span>
                      <span aria-hidden="true" className="text-emerald-950/25">·</span>
                      <span className="tabular-nums">الآية {selectedAyah}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHideAyahInRecitation((v) => !v)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      hideAyahInRecitation
                        ? 'bg-[#C5A059] text-[#104B40] border-[#104B40]'
                        : 'bg-white/75 text-[#104B40] border-emerald-950/15 hover:border-[#C5A059]'
                    }`}
                  >
                    {hideAyahInRecitation ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>
                      {hideAyahInRecitation
                        ? unitType === 'page'
                          ? 'إظهار الصفحة'
                          : 'إظهار الآية'
                        : 'إخفاء غيباً'}
                    </span>
                  </button>
                  <span className="text-[11px] text-[#104B40] font-black tabular-nums">
                    {evaluationResult
                      ? `الدقة: ${evaluationResult.score}%`
                      : `الإتقان: ${currentSurahPercent}%`}
                  </span>
                </div>
              </div>

              {/* SPACIOUS MUSHAF READING SURFACE (Single Ayah OR Full 15-Line Mushaf Page) */}
              <div className="my-5">
                {(unitType === 'ayah' && loadingSurah) || (unitType === 'page' && loadingPage) ? (
                  <div className="py-10 text-center text-[#5C6D6A] text-xs font-bold animate-pulse">
                    {unitType === 'page'
                      ? `جاري تحميل صفحة ${selectedPage} من المصحف العثماني...`
                      : 'جاري تحميل الآية الكريمة من المصحف العثماني...'}
                  </div>
                ) : hideAyahInRecitation ? (
                  <div className="py-8 px-4 rounded-2xl bg-white/70 border border-dashed border-[#C5A059] text-center space-y-2.5">
                    <p className="text-xs font-black text-[#104B40]">
                      وضع التسميع غيباً — النص مخفي مؤقتاً لاختبار الحفظ
                    </p>
                    <p className="text-[11px] text-[#5C6D6A]">
                      {unitType === 'page'
                        ? `رتّل الصفحة رقم ${selectedPage} كاملة أو ارفع تسجيلك الصوتي للتحليل`
                        : `رتّل الآية ${selectedAyah} من سورة ${currentSurahData?.name} ثم أوقف التسجيل للتحليل`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setHideAyahInRecitation(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#104B40] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>كشف النص للمراجعة</span>
                    </button>
                  </div>
                ) : unitType === 'page' ? (
                  /* FULL MUSHAF PAGE RENDERING (GROUPED BY SURAH WITH CLICKABLE WORDS) */
                  <div className="space-y-4 text-right max-h-[380px] overflow-y-auto px-1 sm:px-2">
                    {pageGroups.map((group) => (
                      <div key={`${selectedPage}-${group.surahNumber}`} className="space-y-2.5">
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#104B40]/10 border border-[#104B40]/15 text-xs font-black text-[#104B40]">
                          <span>سورة {group.surahName}</span>
                          <span className="text-[10px] text-[#4B5B58] tabular-nums">
                            {group.ayahs.length} آيات في هذه الصفحة
                          </span>
                        </div>
                        <div className="font-quran text-xl sm:text-2xl leading-[2.3] flex flex-wrap gap-x-1.5 gap-y-2 items-baseline">
                          {group.ayahs.map((ayah) => {
                            const flatEntry = pageAyahsFlat.find(
                              (f) => f.surahNumber === group.surahNumber && f.numberInSurah === ayah.numberInSurah
                            );
                            const baseOffset = flatEntry?.wordOffset || 0;
                            const isPlayingThisAyah =
                              activePagePlayingIndex >= 0 &&
                              pageAyahsFlat[activePagePlayingIndex]?.surahNumber === group.surahNumber &&
                              pageAyahsFlat[activePagePlayingIndex]?.numberInSurah === ayah.numberInSurah;
                            const words = ayah.text.trim().split(/\s+/).filter(Boolean);

                            return (
                              <React.Fragment key={`${group.surahNumber}:${ayah.numberInSurah}`}>
                                {words.map((word, localIdx) => {
                                  const globalIdx = baseOffset + localIdx;
                                  const wordEval = getWordEvaluation(globalIdx, word);
                                  const statusClass =
                                    wordEval.status === 'correct'
                                      ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300'
                                      : wordEval.status === 'error' || wordEval.status === 'missing'
                                      ? 'bg-rose-100 text-rose-950 font-bold border border-rose-400 underline decoration-rose-500 decoration-wavy'
                                      : wordEval.status === 'uncertain'
                                      ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                                      : isPlayingThisAyah
                                      ? 'bg-[#C5A059]/25 text-[#104B40]'
                                      : 'text-[#172A28] hover:bg-white/70 border border-transparent';

                                  return (
                                    <span
                                      key={globalIdx}
                                      onClick={() => setSelectedWordDetail(wordEval)}
                                      className={`px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer ${statusClass}`}
                                    >
                                      {word}
                                    </span>
                                  );
                                })}
                                <span
                                  onClick={() => {
                                    const flatIdx = pageAyahsFlat.findIndex(
                                      (f) => f.surahNumber === group.surahNumber && f.numberInSurah === ayah.numberInSurah
                                    );
                                    if (flatIdx >= 0 && !isRecording) playReciterPageSequence(flatIdx);
                                  }}
                                  title="استماع بدءاً من هذه الآية"
                                  className="inline-flex items-center justify-center px-1.5 text-sm font-sans font-black text-[#B38632] cursor-pointer hover:text-[#104B40]"
                                >
                                  ﴿{ayah.numberInSurah}﴾
                                </span>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* SINGLE AYAH WORD-BY-WORD DISPLAY */
                  <div className="flex flex-wrap justify-center gap-x-2 gap-y-3 font-quran text-2xl sm:text-3xl leading-loose text-center py-2">
                    {ayahWords.map((word, idx) => {
                      const wordEval = getWordEvaluation(idx, word);
                      const statusClass =
                        wordEval.status === 'correct'
                          ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300'
                          : wordEval.status === 'error' || wordEval.status === 'missing'
                          ? 'bg-rose-100 text-rose-950 font-bold border border-rose-400 underline decoration-rose-500 decoration-wavy'
                          : wordEval.status === 'uncertain'
                          ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                          : 'text-[#172A28] hover:bg-white/70 border border-transparent';

                      const isSelected = selectedWordDetail?.positionIndex === idx;

                      return (
                        <span
                          key={idx}
                          onClick={() => setSelectedWordDetail(wordEval)}
                          className={`px-2 py-0.5 rounded-xl transition-all cursor-pointer relative ${statusClass} ${
                            isSelected ? 'ring-2 ring-[#C5A059]' : ''
                          }`}
                          title="اضغط لعرض حالة الكلمة أو نطقها"
                        >
                          {word}
                          {(wordEval.status === 'error' || wordEval.status === 'missing') && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-600 mr-1 align-super" />
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CHUNKED VIEW WHEN SEGMENTED LEARNING ENABLED */}
              {unitType === 'ayah' && playbackUnit === 'chunked' && ayahChunks.length > 1 && (
                <div className="mb-4 p-2.5 bg-white/75 rounded-2xl border border-emerald-950/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#104B40]">
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>مقاطع الآية ({ayahChunks.length}):</span>
                    </span>
                    <span className="text-[#5C6D6A]">المقطع {activeChunkIndex + 1}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ayahChunks.map((chunk, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActiveChunkIndex(idx);
                          if (!isRecording) playReciterAyah(false);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-quran transition-all cursor-pointer ${
                          activeChunkIndex === idx
                            ? 'bg-[#104B40] text-white font-bold shadow-2xs'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {chunk}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SELECTED WORD DETAILS PANEL */}
              {selectedWordDetail && (
                <div className="mb-4 p-3 rounded-2xl bg-white/80 border border-[#C5A059]/40 text-xs space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#104B40]">
                      تفاصيل الكلمة: <span className="font-quran text-base">{selectedWordDetail.expectedWord}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedWordDetail(null)}
                      className="text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedWordDetail.spokenWord && (
                    <p className="text-gray-700">
                      ما نُطِق: <strong className="text-rose-800">{selectedWordDetail.spokenWord}</strong>
                    </p>
                  )}
                  {selectedWordDetail.correctionNote && (
                    <p className="text-gray-600">{selectedWordDetail.correctionNote}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => speakSheikhMessage(selectedWordDetail.expectedWord, false)}
                      className="px-3 py-1.5 rounded-xl bg-[#104B40] text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>سماع النطق الصحيح</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => playReciterAyah(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#C5A059] text-[#104B40] font-black text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>تشغيل تلاوة الشيخ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* EVALUATION RESULT SUMMARY */}
              {evaluationResult && (
                <div
                  className={`mb-4 p-3.5 rounded-2xl border text-xs space-y-2 animate-fadeIn ${
                    evaluationResult.status === 'perfect'
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : evaluationResult.status === 'not_recited'
                      ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                      : 'bg-amber-50/90 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-black">
                      {evaluationResult.status === 'perfect' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span>
                        {evaluationResult.status === 'perfect'
                          ? `ما شاء الله! تلاوة متقنة (${evaluationResult.score}%)`
                          : evaluationResult.status === 'not_recited'
                          ? 'لم يتم رصد تلاوة مطابقة للنص القرآني'
                          : `نسبة الضبط: ${evaluationResult.score}% — راجع الملاحظات`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#104B40]">
                      {evaluationResult.acceptedQiraatVariant && <span>وجه قراءة مقبول ·</span>}
                      {evaluationResult.paceStyle && (
                        <span>
                          السرعة:{' '}
                          {evaluationResult.paceStyle === 'tahqiq'
                            ? 'تحقيق'
                            : evaluationResult.paceStyle === 'tadwir'
                            ? 'تدوير'
                            : evaluationResult.paceStyle === 'hadr'
                            ? 'حدر'
                            : 'متأنٍ'}
                        </span>
                      )}
                    </div>
                  </div>

                  {evaluationResult.transcribedText && (
                    <p className="text-[11px] text-gray-800 bg-white/85 rounded-xl px-2.5 py-1.5 border border-black/5">
                      <strong className="text-[#104B40]">ما سُمِع منك:</strong>{' '}
                      <span className="font-quran text-sm">{evaluationResult.transcribedText}</span>
                    </p>
                  )}

                  {evaluationResult.jumpedToOtherAyah && evaluationResult.jumpedAyahNote && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-100/80 rounded-xl px-2.5 py-1.5">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{evaluationResult.jumpedAyahNote}</span>
                    </div>
                  )}

                  {evaluationResult.mistakeSummary && (
                    <p className="text-xs leading-relaxed font-medium">{evaluationResult.mistakeSummary}</p>
                  )}

                  {evaluationResult.correctionHint && (
                    <p className="text-[11px] text-[#104B40] font-bold">
                      التوجيه: {evaluationResult.correctionHint}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {lastUserRecitationUrl && (
                      <button
                        type="button"
                        onClick={togglePlayUserRecitation}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer border ${
                          isPlayingUserClip
                            ? 'bg-rose-600 text-white border-rose-700'
                            : 'bg-white text-[#104B40] border-[#104B40]/30 hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {isPlayingUserClip ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPlayingUserClip ? 'إيقاف الصوت' : 'سماع تلاوتك'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-3 py-1.5 rounded-xl bg-[#C5A059] text-[#104B40] text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إعادة التسميع</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CLEAN 3-BUTTON ACTION DOCK: LISTEN · LIVE MIC · UPLOAD AUDIO FILE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-emerald-950/10">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() =>
                    isPlayingReciter ? pauseReciterAyah() : playReciterAyah(isTalqeenPaused)
                  }
                  className={`min-h-[48px] py-3 px-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-sm transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-40 ${
                    isPlayingReciter
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#104B40] hover:bg-[#0c3a31] text-white'
                  }`}
                >
                  {isPlayingReciter ? (
                    <>
                      <Pause className="w-4 h-4 shrink-0" />
                      <span>إيقاف التلقين مؤقتاً</span>
                    </>
                  ) : isTalqeenPaused ? (
                    <>
                      <Play className="w-4 h-4 shrink-0" />
                      <span>استئناف التلقين</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span>{unitType === 'page' ? 'استماع للصفحة' : 'استمع للتلقين'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isBusyUploading}
                  onClick={isRecording ? stopRecordingAndAnalyze : startRecording}
                  className={`min-h-[48px] py-3 px-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-sm transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-60 ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-[#C5A059] hover:bg-[#b08e4d] text-[#104B40]'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 shrink-0" />
                      <span>إيقاف وفحص ({recordingSeconds}ث)</span>
                    </>
                  ) : isBusyUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>{uploadStatus === 'analyzing' ? 'جاري التحليل...' : 'جاري الرفع...'}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 shrink-0" />
                      <span>تسميع بالمايك</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isRecording || isBusyUploading}
                  onClick={() => audioFileInputRef.current?.click()}
                  className="min-h-[48px] py-3 px-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs bg-white/85 hover:bg-white text-[#104B40] border border-[#104B40]/25 shadow-xs transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-45"
                  title="رفع ملف صوتي (MP3, WAV, M4A, OGG, AAC, WebM) لفحص التلاوة"
                >
                  <Upload className="w-4 h-4 shrink-0 text-[#104B40]" />
                  <span>رفع ملف صوتي</span>
                </button>
              </div>
            </div>

            {/* CONTEXTUAL TAJWEED HINTS FOR CURRENT VERSE (Subtle unified widget) */}
            {unitType === 'ayah' && detectedTajweed.length > 0 && (
              <div className="moazen-widget rounded-2xl p-4 border shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-[#104B40]">
                  <Layers className="w-4 h-4 text-[#C5A059]" />
                  <span>ملاحظات تجويدية للآية الحالية</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detectedTajweed.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/70 border border-emerald-950/10 text-xs space-y-1"
                    >
                      <div className="font-bold text-[#104B40] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                        <span>{rule.ruleName}</span>
                      </div>
                      <p className="text-[11px] text-[#4B5B58] leading-relaxed">{rule.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            MODE 3: MEMORIZATION TEST (SUPPORTS SINGLE AYAH & FULL PAGE)
           ============================================================ */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="moazen-widget rounded-3xl p-5 sm:p-6 border shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10">
                <h3 className="text-sm font-black text-[#104B40] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C5A059]" />
                  <span>اختبار الحفظ من الذاكرة</span>
                </h3>
                <span className="text-xs font-bold text-[#4B5B58]">
                  {unitType === 'page' ? `صفحة ${selectedPage}` : `سورة ${currentSurahData?.name} · الآية ${selectedAyah}`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {[
                  { id: 'hide' as const, label: unitType === 'page' ? 'إخفاء الصفحة كاملة' : 'إخفاء الآية كاملة' },
                  { id: 'complete' as const, label: 'إكمال البداية' },
                  { id: 'random' as const, label: unitType === 'page' ? 'صفحة عشوائية' : 'آية عشوائية' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setQuizType(opt.id);
                      setQuizRevealed(false);
                      setRevealedHintCount(0);
                      setEvaluationResult(null);
                      if (opt.id === 'random') {
                        if (unitType === 'page') {
                          handleGoToPage(1 + Math.floor(Math.random() * 604));
                        } else if (currentSurahData) {
                          const lo = Math.max(1, Math.min(rangeStart, rangeEnd));
                          const hi = Math.min(
                            currentSurahData.numberOfAyahs,
                            Math.max(rangeStart, rangeEnd)
                          );
                          const rand = lo + Math.floor(Math.random() * Math.max(1, hi - lo + 1));
                          setSelectedAyah(rand);
                        }
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      quizType === opt.id
                        ? 'border-[#104B40] bg-[#104B40] text-white shadow-xs'
                        : 'border-emerald-950/15 bg-white/75 text-[#4B5B58]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* MEMORY CANVAS */}
              <div className="p-6 bg-white/75 rounded-2xl border border-emerald-950/12 text-center min-h-[150px] flex flex-col items-center justify-center space-y-3">
                {quizRevealed ? (
                  <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 font-quran text-2xl leading-loose">
                    {ayahWords.map((word, idx) => {
                      const ev = getWordEvaluation(idx, word);
                      return (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-xl ${
                            ev.status === 'correct'
                              ? 'bg-emerald-100 text-emerald-950 font-bold'
                              : ev.status === 'error' || ev.status === 'missing'
                              ? 'bg-rose-100 text-rose-950 font-bold'
                              : 'text-[#104B40]'
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                ) : quizType === 'complete' ? (
                  <div className="font-quran text-2xl text-[#104B40] leading-loose">
                    {ayahWords
                      .slice(0, Math.min(ayahWords.length, Math.max(2, Math.floor(ayahWords.length * 0.4) + revealedHintCount)))
                      .join(' ')}{' '}
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-base border border-dashed border-amber-400">
                      (أكمل التلاوة غيباً...)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-[#4B5B58] font-bold">
                      {unitType === 'page'
                        ? `النص مخفي: سمّع الصفحة (${selectedPage}) غيباً أو ارفع ملف التلاوة`
                        : `النص مخفي: سمّع الآية رقم (${selectedAyah}) من سورة ${currentSurahData?.name} غيباً`}
                    </p>
                    {revealedHintCount > 0 && (
                      <p className="font-quran text-2xl text-[#104B40]">
                        {ayahWords.slice(0, revealedHintCount).join(' ')}{' '}
                        <span className="text-amber-700 text-base">...</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* QUIZ ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRevealedHintCount((c) => Math.min(ayahWords.length, c + 2))}
                    disabled={quizRevealed || revealedHintCount >= ayahWords.length}
                    className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>تلميح ({revealedHintCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuizRevealed((prev) => !prev)}
                    className="px-3 py-2.5 rounded-xl bg-white/80 hover:bg-white border border-emerald-950/15 text-xs font-bold text-[#172A28] flex items-center gap-1 cursor-pointer"
                  >
                    {quizRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{quizRevealed ? 'إخفاء' : 'كشف النص'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusyUploading}
                    onClick={isRecording ? stopRecordingAndAnalyze : startRecording}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-[#104B40] text-white hover:bg-[#0c3a31]'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {isRecording
                        ? `إيقاف وفحص (${recordingSeconds}ث)`
                        : isBusyUploading
                        ? 'جاري الفحص...'
                        : 'سمّع بالمايك'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isRecording || isBusyUploading}
                    onClick={() => audioFileInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-white/85 border border-[#104B40]/25 text-[#104B40] text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع ملف</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextAyah}
                    className="px-3.5 py-2.5 rounded-xl bg-[#C5A059] text-[#104B40] hover:bg-[#b08e4d] text-xs font-black cursor-pointer"
                  >
                    التالي ➔
                  </button>
                </div>
              </div>

              {evaluationResult && (
                <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-950/12 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-black text-[#104B40]">
                    <span>نتيجة اختبار الحفظ: {evaluationResult.score}%</span>
                    <span>
                      {evaluationResult.status === 'perfect' ? '✓ إتقان ممتاز' : 'راجع المواضع ثم أعد الفحص'}
                    </span>
                  </div>
                  <p className="text-[#4B5B58]">{evaluationResult.mistakeSummary}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MEMORIZATION DASHBOARD WITH CHARTS */}
        {activeTab === 'dashboard' && (
          <SheikhMemorizationDashboard
            metrics={dashboardMetrics}
            totalRepetitions={persisted.repetitionCount}
            selectedSurahNumber={selectedSurah}
            onSelectSurahToPractice={(sNum) => {
              const meta = SURAH_LIST.find((s) => s.number === sNum);
              stopAllPlaybackAudio();
              resetAyahTransientState();
              setUnitType('ayah');
              setSelectedSurah(sNum);
              setSelectedAyah(1);
              setRangeStart(1);
              setRangeEnd(meta?.numberOfAyahs || 7);
              setActiveTab('talqeen');
            }}
          />
        )}

        {/* TAB 5: ADVANCED SETTINGS + TAJWEED GUIDE + SPACED REVIEW QUEUE */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <SheikhAdvancedSettingsPanel
              micSensitivity={micSensitivity}
              noiseGateLevel={noiseGateLevel}
              analysisSpeed={analysisSpeed}
              hapticFeedbackEnabled={hapticFeedbackEnabled}
              quickCorrectionPopupEnabled={quickCorrectionPopupEnabled}
              autoAdvanceOnMastery={autoAdvanceOnMastery}
              autoRepeatFailedAyah={autoRepeatFailedAyah}
              onChangeSensitivity={setMicSensitivity}
              onChangeNoiseGate={setNoiseGateLevel}
              onChangeAnalysisSpeed={setAnalysisSpeed}
              onToggleHaptic={() => setHapticFeedbackEnabled((v) => !v)}
              onToggleQuickPopup={() => setQuickCorrectionPopupEnabled((v) => !v)}
              onToggleAutoAdvance={() => setAutoAdvanceOnMastery((v) => !v)}
              onToggleAutoRepeatFailed={() => setAutoRepeatFailedAyah((v) => !v)}
              onStopBackgroundAudio={stopAllPlaybackAudio}
            />

            {/* WEAK AYAHS & SPACED REPETITION SCHEDULE */}
            {(weakErrorList.length > 0 || masteredKeys.length > 0) && (
              <div className="moazen-widget rounded-2xl p-4 border shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#104B40]" />
                    <h3 className="text-xs sm:text-sm font-black text-[#104B40]">
                      المراجعة المتباعدة وسجل الأخطاء المتكررة ({masteredKeys.length} آية متقنة)
                    </h3>
                  </div>
                </div>

                {weakErrorList.length > 0 && (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {weakErrorList.slice(0, 6).map((rec) => (
                      <div
                        key={rec.key}
                        onClick={() => {
                          setUnitType('ayah');
                          setSelectedSurah(rec.surahNumber);
                          setSelectedAyah(rec.ayahNumber);
                          setActiveTab('recitation');
                        }}
                        className="p-2.5 bg-rose-50/85 hover:bg-rose-100/80 rounded-xl border border-rose-200 flex items-center justify-between cursor-pointer text-xs"
                      >
                        <div>
                          <span className="font-black text-[#172A28] block">
                            {rec.surahName} · الآية {rec.ayahNumber}
                          </span>
                          <span className="text-[11px] text-rose-800 block">
                            تثبيت: {rec.weakWords.join(' ، ')}
                          </span>
                        </div>
                        <span className="text-[10px] bg-rose-600 text-white px-2.5 py-1 rounded-lg font-black">
                          مراجعة الآن
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {masteredKeys.length > 0 && (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {Object.entries(persisted.masteredAyahs)
                      .slice(0, 8)
                      .map(([key, record]) => (
                        <div
                          key={key}
                          onClick={() => {
                            setUnitType('ayah');
                            setSelectedSurah(record.surahNumber);
                            setSelectedAyah(record.ayahNumber);
                            setActiveTab('recitation');
                          }}
                          className="p-2.5 bg-white/75 hover:bg-white rounded-xl border border-emerald-950/10 flex items-center justify-between cursor-pointer text-xs"
                        >
                          <span className="font-bold text-[#172A28]">
                            {record.surahName} · الآية {record.ayahNumber}
                          </span>
                          <span className="text-[10px] text-[#104B40] font-bold">
                            مراجعة: {record.nextReviewDate}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* CONCISE TAJWEED RULES GUIDE */}
            <div className="moazen-widget rounded-2xl p-4 border shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-emerald-950/10">
                <Layers className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-xs sm:text-sm font-black text-[#104B40]">
                  دليل أحكام التجويد ومخارج الحروف المبسّط
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-white/75 border border-emerald-950/10 rounded-xl space-y-1">
                  <span className="font-black text-[#104B40] block">النون الساكنة والتنوين</span>
                  <p className="text-[11px] text-[#4B5B58] leading-relaxed">
                    الإظهار (حروف الحلق)، الإدغام (يرملون)، الإقلاب (الباء)، والإخفاء بغنة حركتين.
                  </p>
                </div>
                <div className="p-3 bg-white/75 border border-emerald-950/10 rounded-xl space-y-1">
                  <span className="font-black text-[#104B40] block">حروف القلقلة (قطب جد)</span>
                  <p className="text-[11px] text-[#4B5B58] leading-relaxed">
                    اهتزاز الحرف الساكن أو الموقوف عليه: كبرى للمشدد، وسطى للساكن الموقوف، وصغرى وسط الكلمة.
                  </p>
                </div>
                <div className="p-3 bg-white/75 border border-emerald-950/10 rounded-xl space-y-1">
                  <span className="font-black text-[#104B40] block">أحكام المدود</span>
                  <p className="text-[11px] text-[#4B5B58] leading-relaxed">
                    الطبيعي حركتان، والفرعي بسبب الهمز أو السكون من 4 إلى 6 حركات.
                  </p>
                </div>
                <div className="p-3 bg-white/75 border border-emerald-950/10 rounded-xl space-y-1">
                  <span className="font-black text-[#104B40] block">مخارج الحروف الخمسة</span>
                  <p className="text-[11px] text-[#4B5B58] leading-relaxed">
                    الجوف، الحلق، اللسان، الشفتان، والخيشوم للغنة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPACT PROGRESS STRIP */}
        <div className="moazen-widget rounded-2xl p-3 border shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#4B5B58]">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#C5A059]" />
            <span>المتقنة:</span>
            <span className="text-[#104B40] font-black">{masteredKeys.length} آية</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>المحاولات:</span>
            <span className="text-[#104B40] font-black">{persisted.repetitionCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>إتقان الجلسة:</span>
            <span className="text-[#104B40] font-black">{liveSessionMastery}%</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          MEMORIZATION SESSION REPORT MODAL
         ============================================================ */}
      {showReportModal && (
        <div className="fixed inset-0 z-70 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="moazen-widget w-full max-w-md rounded-3xl p-5 shadow-2xl border border-[#C5A059]/40 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div className="flex items-center gap-2">
                <FileBarChart2 className="w-5 h-5 text-[#104B40]" />
                <h3 className="text-base font-black text-[#104B40]">تقرير جلسة الحفظ والتسميع</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const rep = buildCurrentSessionReport();
              return (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2.5 text-center">
                    <div className="p-3 rounded-2xl bg-white/75 border border-emerald-950/12">
                      <span className="text-[#5C6D6A] block">نسبة الإتقان</span>
                      <strong className="text-xl font-black text-[#104B40]">
                        {rep.masteryPercent}%
                      </strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/75 border border-emerald-950/12">
                      <span className="text-[#5C6D6A] block">الوقت المستغرق</span>
                      <strong className="text-xl font-black text-[#104B40]">
                        {rep.durationSeconds} ثانية
                      </strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-800 block">الكلمات الصحيحة</span>
                      <strong className="text-xl font-black text-emerald-700">
                        {rep.correctWordsCount}
                      </strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                      <span className="text-rose-800 block">الأخطاء المرصودة</span>
                      <strong className="text-xl font-black text-rose-700">
                        {rep.errorWordsCount}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/75 border border-emerald-950/12 space-y-1">
                    <span className="font-black text-[#104B40] block">
                      المواضع المُسمَّعة في الجلسة ({rep.ayahsReviewed.length}):
                    </span>
                    <p className="text-[#4B5B58]">
                      {rep.ayahsReviewed.length > 0
                        ? rep.ayahsReviewed.map((n) => `موضع ${n}`).join(' ، ')
                        : 'لم تُسمّع مواضع بعد في هذه الجلسة.'}
                    </p>
                  </div>

                  {rep.forgottenWords.length > 0 && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                      <span className="font-black text-rose-900 block">
                        كلمات تحتاج مراجعة وتكرار:
                      </span>
                      <p className="font-quran text-base text-rose-950">
                        {rep.forgottenWords.join(' ، ')}
                      </p>
                    </div>
                  )}

                  {rep.ayahsNeedingPractice.length > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                      <span className="font-black text-amber-900 block">
                        مواضع يُنصح بإعادة حفظها:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rep.ayahsNeedingPractice.map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              handleGoToAyah(num);
                              setActiveTab('recitation');
                              setShowReportModal(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] cursor-pointer"
                          >
                            مراجعة الآية {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="w-full py-3 rounded-2xl bg-[#104B40] text-white font-black text-xs cursor-pointer"
            >
              إغلاق التقرير ومواصلة الحفظ
            </button>
          </div>
        </div>
      )}

      {/* QUICK INTERACTIVE CORRECTION POPUP */}
      {quickCorrectionWords && quickCorrectionWords.length > 0 && (
        <QuickCorrectionFeedbackModal
          wrongWords={quickCorrectionWords}
          surahName={
            unitType === 'page'
              ? `صفحة ${selectedPage} (${pageMeta.surahName})`
              : currentSurahData?.name || `سورة ${selectedSurah}`
          }
          ayahNumber={unitType === 'page' ? selectedPage : selectedAyah}
          score={evaluationResult?.score || 0}
          onSpeakWord={(w) => speakSheikhMessage(w, false)}
          onReRecordDirectly={() => {
            setQuickCorrectionWords(null);
            startRecording();
          }}
          onClose={() => setQuickCorrectionWords(null)}
        />
      )}
    </div>
  );
};
