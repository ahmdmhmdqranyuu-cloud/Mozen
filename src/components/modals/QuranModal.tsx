import { SmartSheikhTutor } from '../quran/SmartSheikhTutor';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Search,
  Bookmark,
  Play,
  Pause,
  Volume2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  BookOpen,
  List,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  ArrowRight,
  Layers,
  BookMarked,
  Home,
  Mic,
  Star,
  FastForward,
  Puzzle,
  Lightbulb,
  Cpu,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, QuranBookmark } from '../../types';
import {
  QURAN_SURAHS,
  JUZ_LIST,
  getPageMetadata,
} from '../../data/quranPagesData';
import { soundService, QURAN_RECITERS } from '../../utils/audioPlayer';
import { recitationPlayerService } from '../../utils/recitationPlayerService';
import { SURAH_LIST, RECITERS_LIST } from '../../data/recitersData';
import {
  getPageAyahs,
  searchLocalQuran,
  QuranPageGroup,
} from '../../utils/quranFullService';
import {
  getAyahTafseer,
  getPageTafseers,
  searchTafseer,
  AyahTafseerItem,
} from '../../utils/quranTafseerService';
import { userStatsTracker } from '../../utils/userStatsTracker';

interface QuranModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
  initialSurah?: number;
  initialTab?: 'surah' | 'juz' | 'tafseer' | 'search' | 'sheikh';
  user: UserProfile;
  onUpdateLastReadPage?: (pageNumber: number, surahName: string) => void;
}

type PaperTheme = 'cream' | 'night' | 'white' | 'sepia';

// Convert numbers to Eastern Arabic numerals for Quran Ayah badges
const toArabicDigits = (num: number): string => {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (d) => digits[Number(d)]);
};

// Diacritized Calligraphic Surah Names (مضبوطة بالتشكيل للرسم العثماني)
const SURAH_CALLIGRAPHY_NAMES: Record<number, string> = {
  1: 'الفَاتِحَةِ',
  2: 'البَقَرَةِ',
  3: 'آلِ عِمْرَانَ',
  4: 'النِّسَاءِ',
  5: 'المَائِدَةِ',
  6: 'الأَنْعَامِ',
  7: 'الأَعْرَافِ',
  8: 'الأَنْفَالِ',
  9: 'التَّوْبَةِ',
  10: 'يُونُسَ',
  11: 'هُودٍ',
  12: 'يُوسُفَ',
  13: 'الرَّعْدِ',
  14: 'إِبْرَاهِيمَ',
  15: 'الحِجْرِ',
  16: 'النَّحْلِ',
  17: 'الإِسْرَاءِ',
  18: 'الكَهْفِ',
  19: 'مَرْيَمَ',
  20: 'طه',
  21: 'الأَنْبِيَاءِ',
  22: 'الحَجِّ',
  23: 'المُؤْمِنُونَ',
  24: 'النُّورِ',
  25: 'الفُرْقَانِ',
  26: 'الشُّعَرَاءِ',
  27: 'النَّمْلِ',
  28: 'القَصَصِ',
  29: 'العَنْكَبُوتِ',
  30: 'الرُّومِ',
  31: 'لُقْمَانَ',
  32: 'السَّجْدَةِ',
  33: 'الأَحْزَابِ',
  34: 'سَبَأٍ',
  35: 'فَاطِرٍ',
  36: 'يس',
  37: 'الصَّافَّاتِ',
  38: 'ص',
  39: 'الزُّمَرِ',
  40: 'غَافِرٍ',
  41: 'فُصِّلَتْ',
  42: 'الشُّورَىٰ',
  43: 'الزُّخْرُفِ',
  44: 'الدُّخَانِ',
  45: 'الجَاثِيَةِ',
  46: 'الأَحْقَافِ',
  47: 'مُحَمَّدٍ',
  48: 'الفَتْحِ',
  49: 'الحُجُرَاتِ',
  50: 'ق',
  51: 'الذَّارِيَاتِ',
  52: 'الطُّورِ',
  53: 'النَّجْمِ',
  54: 'القَمَرِ',
  55: 'الرَّحْمَٰنِ',
  56: 'الوَاقِعَةِ',
  57: 'الحَدِيدِ',
  58: 'المُجَادِلَةِ',
  59: 'الحَشْرِ',
  60: 'المُمْتَحَنَةِ',
  61: 'الصَّفِّ',
  62: 'الجُمُعَةِ',
  63: 'المُنَافِقُونَ',
  64: 'التَّغَابُنِ',
  65: 'الطَّلَاقِ',
  66: 'التَّحْرِيمِ',
  67: 'المُلْكِ',
  68: 'القَلَمِ',
  69: 'الحَاقَّةِ',
  70: 'المَعَارِجِ',
  71: 'نُوحٍ',
  72: 'الجِنِّ',
  73: 'المُزَّمِّلِ',
  74: 'المُدَّثِّرِ',
  75: 'القِيَامَةِ',
  76: 'الإِنْسَانِ',
  77: 'المُرْسَلَاتِ',
  78: 'النَّبَأِ',
  79: 'النَّازِعَاتِ',
  80: 'عَبَسَ',
  81: 'التَّكْوِيرِ',
  82: 'الانفِطَارِ',
  83: 'المُطَفِّفِينَ',
  84: 'الانشِقَاقِ',
  85: 'البُرُوجِ',
  86: 'الطَّارِقِ',
  87: 'الأَعْلَىٰ',
  88: 'الغَاشِيَةِ',
  89: 'الفَجْرِ',
  90: 'البَلَدِ',
  91: 'الشَّمْسِ',
  92: 'اللَّيْلِ',
  93: 'الضُّحَىٰ',
  94: 'الشَّرْحِ',
  95: 'التِّينِ',
  96: 'العَلَقِ',
  97: 'القَدْرِ',
  98: 'البَيِّنَةِ',
  99: 'الزَّلْزَلَةِ',
  100: 'العَادِيَاتِ',
  101: 'القَارِعَةِ',
  102: 'التَّكَاثُرِ',
  103: 'العَصْرِ',
  104: 'الهُمَزَةِ',
  105: 'الفِيلِ',
  106: 'قُرَيْشٍ',
  107: 'المَاعُونِ',
  108: 'الكَوْثَرِ',
  109: 'الكَافِرُونَ',
  110: 'النَّصْرِ',
  111: 'المَسَدِ',
  112: 'الإِخْلَاصِ',
  113: 'الفَلَقِ',
  114: 'النَّاسِ',
};

// 8-Point Islamic Star Badge
const IslamicStarBadge: React.FC<{ number: number }> = ({ number }) => (
  <div className="relative w-11 h-11 flex items-center justify-center shrink-0 select-none">
    <svg viewBox="0 0 44 44" className="w-11 h-11 drop-shadow-2xs">
      <defs>
        <linearGradient id={`starGold-${number}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C5A059" />
          <stop offset="50%" stopColor="#E5C77A" />
          <stop offset="100%" stopColor="#9B7B32" />
        </linearGradient>
      </defs>
      <rect
        x="8"
        y="8"
        width="28"
        height="28"
        rx="4"
        fill="none"
        stroke={`url(#starGold-${number})`}
        strokeWidth="1.8"
      />
      <rect
        x="8"
        y="8"
        width="28"
        height="28"
        rx="4"
        transform="rotate(45 22 22)"
        fill="none"
        stroke={`url(#starGold-${number})`}
        strokeWidth="1.8"
      />
      <circle cx="22" cy="22" r="12" fill="#FAF8F2" stroke="#104B40" strokeWidth="1" />
    </svg>
    <span className="absolute z-10 font-bold font-sans text-xs text-[#104B40] pt-0.5">
      {toArabicDigits(number)}
    </span>
  </div>
);

export const QuranModal: React.FC<QuranModalProps> = ({
  isOpen,
  onClose,
  initialPage,
  initialSurah,
  initialTab,
  user,
  onUpdateLastReadPage,
}) => {
  // Determine starting page
  const getInitialPage = () => {
    if (initialPage && initialPage >= 1 && initialPage <= 604) return initialPage;
    if (initialSurah) {
      const s = QURAN_SURAHS.find((item) => item.number === initialSurah);
      if (s) return s.startPage;
    }
    if (user.lastReadPage && user.lastReadPage >= 1 && user.lastReadPage <= 604) {
      return user.lastReadPage;
    }
    return 1;
  };

  const [currentPage, setCurrentPage] = useState<number>(getInitialPage);
  const [pageDirection, setPageDirection] = useState<number>(1);
  const [pageAyahs, setPageAyahs] = useState<QuranPageGroup[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);

  // Requirement 4: Organize Quran section into clear buttons/hub instead of dumping everything at once
  // indexView: 'hub' (main menu of buttons) | 'surahs' | 'juzs' | 'tafseer' | 'sheikh' | 'search'
  const [showIndex, setShowIndex] = useState<boolean>(true);
  const [indexView, setIndexView] = useState<
    'hub' | 'surahs' | 'juzs' | 'tafseer' | 'sheikh' | 'search'
  >(() => {
    if (initialTab === 'juz') return 'juzs';
    if (initialTab === 'surah') return 'surahs';
    if (initialTab === 'tafseer') return 'tafseer';
    if (initialTab === 'sheikh') return 'sheikh';
    if (initialTab === 'search') return 'search';
    return 'hub';
  });

  const [showBookmarks, setShowBookmarks] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showAudioBar, setShowAudioBar] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [showJumpDialog, setShowJumpDialog] = useState<boolean>(false);

  // Requirement 5: In-Mushaf Offline Tafseer Drawer state
  const [activeTafseerAyah, setActiveTafseerAyah] = useState<{
    surahNumber: number;
    surahName: string;
    numberInSurah: number;
    ayahText: string;
    tafseerText: string;
    page: number;
  } | null>(null);
  const [isLoadingAyahTafseer, setIsLoadingAyahTafseer] = useState<boolean>(false);
  const [copiedTafseer, setCopiedTafseer] = useState<boolean>(false);

  // Full Tafseer Browser Tab state
  const [selectedTafseerSurah, setSelectedTafseerSurah] = useState<number>(1);
  const [selectedTafseerAyah, setSelectedTafseerAyah] = useState<number>(1);
  const [browserTafseerText, setBrowserTafseerText] = useState<string>('');
  const [browserAyahText, setBrowserAyahText] = useState<string>('');
  const [tafseerSearchQuery, setTafseerSearchQuery] = useState<string>('');
  const [tafseerSearchResults, setTafseerSearchResults] = useState<
    Array<{ surahNumber: number; numberInSurah: number; text: string }>
  >([]);

  // Search across 6,236 Ayahs
  const [searchResults, setSearchResults] = useState<
    Array<{
      surahNumber: number;
      surahName: string;
      ayahNumber: number;
      ayahNumberInSurah: number;
      text: string;
      page: number;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reading Preferences
  const [theme, setTheme] = useState<PaperTheme>('cream');
  const [fontSize, setFontSize] = useState<number>(20);

  // Audio Recitation synced with global RecitationPlayerService
  const [isPlayingRecitation, setIsPlayingRecitation] = useState<boolean>(
    () => recitationPlayerService.getState().isPlaying
  );
  const [selectedReciter, setSelectedReciter] = useState<string>('ar.alafasy');

  useEffect(() => {
    const unsub = recitationPlayerService.subscribe((st) => {
      setIsPlayingRecitation(st.isPlaying);
    });
    return unsub;
  }, []);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>(() => {
    try {
      const saved = localStorage.getItem('azan_quran_page_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const lastSavedPageRef = useRef<number | null>(null);
  const onUpdateLastReadPageRef = useRef(onUpdateLastReadPage);

  useEffect(() => {
    onUpdateLastReadPageRef.current = onUpdateLastReadPage;
  }, [onUpdateLastReadPage]);

  // When modal is opened
  useEffect(() => {
    if (isOpen) {
      if (initialPage && initialPage >= 1 && initialPage <= 604) {
        setCurrentPage(initialPage);
      }
      setShowIndex(true);
      setIndexView('hub');
    }
  }, [isOpen, initialPage]);

  // Save bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('azan_quran_page_bookmarks', JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  // Load offline Uthmani text for current page
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoadingPage(true);

    getPageAyahs(currentPage)
      .then((groups) => {
        if (isMounted) {
          setPageAyahs(groups);
          setIsLoadingPage(false);

          if (!showIndex && groups.length > 0) {
            const surahNumbers = Array.from(new Set(groups.map((g) => g.surahNumber)));
            const ayahCountOnPage = groups.reduce((acc, g) => acc + g.ayahs.length, 0);
            const lastGroup = groups[groups.length - 1];
            const lastAyahInPage =
              lastGroup?.ayahs[lastGroup.ayahs.length - 1]?.numberInSurah || 1;
            const meta = getPageMetadata(currentPage);
            userStatsTracker.recordQuranPageRead(
              currentPage,
              surahNumbers,
              ayahCountOnPage,
              meta.surahName,
              lastAyahInPage
            );
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load page ayahs:', err);
        if (isMounted) setIsLoadingPage(false);
      });

    // Save reading progress automatically when page changes
    if (lastSavedPageRef.current !== currentPage) {
      lastSavedPageRef.current = currentPage;
      const meta = getPageMetadata(currentPage);
      try {
        localStorage.setItem('azan_quran_last_read_page', String(currentPage));
      } catch {
        // ignore
      }
      onUpdateLastReadPageRef.current?.(currentPage, meta.surahName);
    }

    return () => {
      isMounted = false;
    };
  }, [currentPage, isOpen, showIndex]);

  // Instant local search across 6,236 Ayahs
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      searchLocalQuran(searchQuery).then((res) => {
        setSearchResults(res);
        setIsSearching(false);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Tafseer Browser Loader
  useEffect(() => {
    if (indexView !== 'tafseer') return;
    let active = true;
    getAyahTafseer(selectedTafseerSurah, selectedTafseerAyah).then((text) => {
      if (active) setBrowserTafseerText(text);
    });
    return () => {
      active = false;
    };
  }, [selectedTafseerSurah, selectedTafseerAyah, indexView]);

  // Tafseer Search
  useEffect(() => {
    if (!tafseerSearchQuery.trim() || tafseerSearchQuery.trim().length < 2) {
      setTafseerSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchTafseer(tafseerSearchQuery, 25).then((res) => {
        setTafseerSearchResults(res);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [tafseerSearchQuery]);

  // Open Ayah Tafseer Drawer inside Mushaf
  const handleOpenAyahTafseer = async (
    surahNumber: number,
    surahName: string,
    numberInSurah: number,
    ayahText: string,
    page: number
  ) => {
    setIsLoadingAyahTafseer(true);
    const text = await getAyahTafseer(surahNumber, numberInSurah);
    setActiveTafseerAyah({
      surahNumber,
      surahName,
      numberInSurah,
      ayahText,
      tafseerText: text,
      page,
    });
    setIsLoadingAyahTafseer(false);
  };

  // Navigate to Next Ayah in Tafseer Drawer
  const handleNextAyahTafseer = async () => {
    if (!activeTafseerAyah) return;
    const currentSurah = QURAN_SURAHS.find((s) => s.number === activeTafseerAyah.surahNumber);
    if (!currentSurah) return;
    let nextAyah = activeTafseerAyah.numberInSurah + 1;
    let nextSurah = activeTafseerAyah.surahNumber;
    let nextSurahName = activeTafseerAyah.surahName;

    if (nextAyah > currentSurah.numberOfAyahs) {
      if (nextSurah < 114) {
        nextSurah += 1;
        nextAyah = 1;
        nextSurahName = QURAN_SURAHS.find((s) => s.number === nextSurah)?.name || '';
      } else {
        return;
      }
    }

    setIsLoadingAyahTafseer(true);
    const text = await getAyahTafseer(nextSurah, nextAyah);
    setActiveTafseerAyah({
      surahNumber: nextSurah,
      surahName: nextSurahName,
      numberInSurah: nextAyah,
      ayahText: `الآية ${nextAyah} من سورة ${nextSurahName}`,
      tafseerText: text,
      page: activeTafseerAyah.page,
    });
    setIsLoadingAyahTafseer(false);
  };

  // Navigate to Prev Ayah in Tafseer Drawer
  const handlePrevAyahTafseer = async () => {
    if (!activeTafseerAyah) return;
    let prevAyah = activeTafseerAyah.numberInSurah - 1;
    let prevSurah = activeTafseerAyah.surahNumber;
    let prevSurahName = activeTafseerAyah.surahName;

    if (prevAyah < 1) {
      if (prevSurah > 1) {
        prevSurah -= 1;
        const prevSurahObj = QURAN_SURAHS.find((s) => s.number === prevSurah);
        prevAyah = prevSurahObj?.numberOfAyahs || 1;
        prevSurahName = prevSurahObj?.name || '';
      } else {
        return;
      }
    }

    setIsLoadingAyahTafseer(true);
    const text = await getAyahTafseer(prevSurah, prevAyah);
    setActiveTafseerAyah({
      surahNumber: prevSurah,
      surahName: prevSurahName,
      numberInSurah: prevAyah,
      ayahText: `الآية ${prevAyah} من سورة ${prevSurahName}`,
      tafseerText: text,
      page: activeTafseerAyah.page,
    });
    setIsLoadingAyahTafseer(false);
  };

  // Copy Tafseer text
  const handleCopyTafseer = () => {
    if (!activeTafseerAyah) return;
    const clip = `سورة ${activeTafseerAyah.surahName} [الآية ${activeTafseerAyah.numberInSurah}]\n${activeTafseerAyah.tafseerText}\n\n(التفسير الميسر - مجمع الملك فهد لطباعة المصحف الشريف)`;
    navigator.clipboard?.writeText(clip);
    setCopiedTafseer(true);
    setTimeout(() => setCopiedTafseer(false), 2000);
  };

  // Handle page navigation
  const goToPage = useCallback(
    (page: number, dir?: number) => {
      const target = Math.max(1, Math.min(604, page));
      if (target === currentPage) return;
      setPageDirection(dir !== undefined ? dir : target > currentPage ? 1 : -1);
      setCurrentPage(target);
      setJumpPageInput('');
    },
    [currentPage]
  );

  const handleNextPage = useCallback(() => {
    if (currentPage < 604) {
      goToPage(currentPage + 1, 1);
    }
  }, [currentPage, goToPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1, -1);
    }
  }, [currentPage, goToPage]);

  // Bookmark toggle
  const meta = getPageMetadata(currentPage);
  const isBookmarked = bookmarks.some((b) => b.page === currentPage);

  const handleToggleBookmark = () => {
    if (isBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.page !== currentPage));
    } else {
      const newBm: QuranBookmark = {
        id: `bm-${Date.now()}`,
        page: currentPage,
        surahName: meta.surahName,
        juzNumber: meta.juzNumber,
        date: new Date().toLocaleDateString('ar-EG', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
      setBookmarks((prev) => [newBm, ...prev]);
      soundService.playSuccessCelebration();
    }
  };

  const handleToggleRecitation = () => {
    if (isPlayingRecitation) {
      recitationPlayerService.stopAndClose();
      setIsPlayingRecitation(false);
    } else {
      const sItem = SURAH_LIST.find((s) => s.number === meta.surahNumber) || SURAH_LIST[0];
      const rItem =
        RECITERS_LIST.find(
          (r) => r.id === selectedReciter || r.islamicNetworkEdition === selectedReciter
        ) || RECITERS_LIST[0];
      recitationPlayerService.playSurah(sItem, rItem);
      setIsPlayingRecitation(true);
    }
  };

  // Filtered lists
  const filteredSurahs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return QURAN_SURAHS;
    return QURAN_SURAHS.filter(
      (s) =>
        s.name.includes(q) ||
        String(s.number) === q ||
        s.englishName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredJuz = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return JUZ_LIST;
    return JUZ_LIST.filter(
      (j) => j.name.includes(q) || String(j.number) === q
    );
  }, [searchQuery]);

  const lastReadPageNumber = user.lastReadPage || 1;
  const lastReadMeta = getPageMetadata(lastReadPageNumber);

  const getPageContainerStyle = () => {
    switch (theme) {
      case 'night':
        return 'bg-[#121A17] text-[#E0E6E4] border-[#1E2E28]';
      case 'sepia':
        return 'bg-[#F4EBD9] text-[#2C2214] border-[#D8C7A5]';
      case 'white':
        return 'bg-white text-[#172A28] border-gray-200';
      case 'cream':
      default:
        return 'bg-[#FAF8F2] text-[#172A28] border-[#E8DFC8]';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F2] flex flex-col overflow-hidden select-none animate-fadeIn text-[#172A28]">
      {/* ============================================================== */}
      {/* 1. MUSHAF READING VIEW (WHEN showIndex IS FALSE)               */}
      {/* ============================================================== */}
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Top Control Bar inside Reading View */}
        <div className="bg-[#FAF8F2] border-b border-amber-900/10 px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-2xs z-20">
          {/* Right Group: Close & Index Hub Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundService.stopAudio();
                onClose();
              }}
              className="p-2 rounded-xl bg-white border border-gray-200/80 hover:bg-gray-100 text-gray-700 transition-all cursor-pointer shadow-2xs"
              title="إغلاق المصحف"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Back to Quran Hub Button */}
            <button
              onClick={() => {
                setShowIndex(true);
                setIndexView('hub');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="فهرس القرآن الكريم"
            >
              <List className="w-4 h-4" />
              <span>فهرس القرآن</span>
            </button>
          </div>

          {/* Central Title */}
          <div className="flex items-center gap-2 text-center select-none">
            <div className="px-3 py-1 rounded-xl bg-[#104B40]/10 border border-[#104B40]/15 text-xs font-black text-[#104B40] font-quran">
              سورة {meta.surahName} • ص {currentPage}
            </div>
          </div>

          {/* Left Controls: Quick Tafseer, Audio, Settings */}
          <div className="flex items-center gap-1.5">
            {/* Quick Tafseer Button for Current Page */}
            <button
              onClick={() => {
                if (pageAyahs.length > 0 && pageAyahs[0].ayahs.length > 0) {
                  const first = pageAyahs[0].ayahs[0];
                  handleOpenAyahTafseer(
                    pageAyahs[0].surahNumber,
                    pageAyahs[0].surahName,
                    first.numberInSurah,
                    first.text,
                    currentPage
                  );
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300/80 text-amber-900 font-bold text-xs cursor-pointer shadow-2xs transition-all"
              title="قراءة التفسير الميسر لآيات هذه الصفحة"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">التفسير</span>
            </button>

            {/* Audio Recitation Toggle */}
            <button
              onClick={() => setShowAudioBar(!showAudioBar)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                showAudioBar
                  ? 'bg-[#104B40] text-white'
                  : 'bg-white border border-gray-200/80 text-[#172A28]'
              }`}
              title="التلاوة الصوتية"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Bookmarks */}
            <button
              onClick={() => setShowBookmarks(true)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                bookmarks.length > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-white border border-gray-200/80 text-[#172A28]'
              }`}
              title="العلامات المرجعية"
            >
              <Bookmark
                className={`w-4 h-4 ${bookmarks.length > 0 ? 'fill-amber-600 text-amber-600' : ''}`}
              />
            </button>

            {/* Settings (theme, font size) */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                showSettings
                  ? 'bg-[#104B40] text-white'
                  : 'bg-white border border-gray-200/80 text-[#172A28]'
              }`}
              title="إعدادات القراءة والخط"
            >
              <Sun className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Player Toolbar */}
        {showAudioBar && (
          <div className="bg-[#0B382F] text-white px-4 py-2 border-b border-emerald-800 flex items-center justify-between gap-3 text-xs z-10 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleRecitation}
                className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-xs"
              >
                {isPlayingRecitation ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-0.5" />
                )}
              </button>
              <span className="font-bold text-[11px]">
                {isPlayingRecitation ? 'جاري تلاوة' : 'استماع إلى'} سورة {meta.surahName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/70 hidden sm:inline">القارئ:</span>
              <select
                value={selectedReciter}
                onChange={(e) => {
                  setSelectedReciter(e.target.value);
                  if (isPlayingRecitation) {
                    soundService.stopAudio();
                    setIsPlayingRecitation(false);
                  }
                }}
                className="bg-emerald-950 border border-emerald-700 text-xs rounded-lg px-2 py-1 text-white focus:outline-none"
              >
                {QURAN_RECITERS.map((r) => (
                  <option key={r.id} value={r.serverKey}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Settings Bar */}
        {showSettings && (
          <div className="bg-[#104B40]/95 backdrop-blur-md text-white border-b border-emerald-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white/80 font-bold ml-1 text-[11px]">الخلفية:</span>
              {[
                { id: 'cream', name: 'ورقي مصحفي', bg: 'bg-[#FAF8F2] text-gray-900' },
                { id: 'night', name: 'ليلي داكن', bg: 'bg-[#121A17] text-white' },
                { id: 'sepia', name: 'سيبيا دافئ', bg: 'bg-[#f4ebd9] text-[#2c2214]' },
                { id: 'white', name: 'أبيض نقي', bg: 'bg-white text-gray-900' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as PaperTheme)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                    t.bg
                  } ${
                    theme === t.id
                      ? 'ring-2 ring-amber-400 border-transparent shadow'
                      : 'border-white/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/80 font-bold text-[11px]">حجم الخط:</span>
              <button
                onClick={() => setFontSize((s) => Math.max(16, s - 2))}
                className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white cursor-pointer font-bold text-xs"
              >
                A-
              </button>
              <span className="text-[11px] font-sans px-1 text-amber-200">{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(36, s + 2))}
                className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white cursor-pointer font-bold text-xs"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize(20)}
                className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white cursor-pointer mr-1"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Mushaf Canvas */}
        <div className="relative flex-1 flex items-stretch justify-center overflow-hidden p-0 select-none">
          {/* Nav: Prev in RTL */}
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className={`absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-950/35 hover:bg-emerald-950/80 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-md ${
              currentPage <= 1
                ? 'opacity-15 cursor-not-allowed pointer-events-none'
                : 'hover:scale-105 active:scale-95'
            }`}
            title="الصفحة السابقة"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Nav: Next in RTL */}
          <button
            onClick={handleNextPage}
            disabled={currentPage >= 604}
            className={`absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-950/35 hover:bg-emerald-950/80 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-md ${
              currentPage >= 604
                ? 'opacity-15 cursor-not-allowed pointer-events-none'
                : 'hover:scale-105 active:scale-95'
            }`}
            title="الصفحة التالية"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Bookmark Ribbon */}
          <button
            onClick={handleToggleBookmark}
            className={`absolute top-0 right-4 sm:right-6 z-30 p-2 rounded-b-xl shadow-md transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-rose-600 text-white scale-110 shadow-rose-900/40'
                : 'bg-black/30 hover:bg-black/50 text-white/80'
            }`}
            title={isBookmarked ? 'إزالة الفاصل' : 'وضع فاصل في هذه الصفحة'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white' : ''}`} />
          </button>

          {/* Page Animated Flip */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentPage}
              initial={{ rotateY: pageDirection > 0 ? -25 : 25, opacity: 0.3 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: pageDirection > 0 ? 25 : -25, opacity: 0.2 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full h-full flex items-stretch justify-center"
            >
              <div
                className={`relative w-full h-full flex flex-col justify-between transition-all duration-200 overflow-hidden ${getPageContainerStyle()}`}
              >
                {/* Border */}
                <div className="absolute inset-1.5 sm:inset-2.5 border border-amber-600/35 rounded-lg pointer-events-none z-10" />

                {/* Page Top Header */}
                <div className="px-5 sm:px-8 pt-3 sm:pt-4 pb-2 border-b border-amber-900/10 flex items-center justify-between text-[11px] sm:text-xs font-bold text-amber-900/80 z-10 select-none">
                  <span>الجزء {meta.juzNumber}</span>
                  <div className="px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-600/20 text-emerald-950 font-quran text-xs sm:text-sm font-bold">
                    سورة {meta.surahName}
                  </div>
                  <span>صفحة {currentPage}</span>
                </div>

                {/* Ayahs Area (Each Ayah is interactive to open Tafseer) */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-4 text-right select-text z-10">
                  {isLoadingPage ? (
                    <div className="h-full flex flex-col items-center justify-center py-16">
                      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-xs font-bold text-gray-500 font-sans">
                        جاري تحميل الصفحة {currentPage}...
                      </span>
                    </div>
                  ) : pageAyahs && pageAyahs.length > 0 ? (
                    pageAyahs.map((group) => (
                      <div key={group.surahNumber} className="mb-6">
                        {/* Surah Header */}
                        <div className="my-3 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-50 via-emerald-50 to-amber-50 border border-emerald-900/20 text-center shadow-2xs">
                          <h3 className="text-base sm:text-lg font-bold text-emerald-950 font-quran">
                            سورة {group.surahName}
                          </h3>
                          <span className="text-[10px] text-gray-600 font-sans">
                            {group.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                          </span>
                        </div>

                        {/* Basmalah */}
                        {group.ayahs.some((a) => a.numberInSurah === 1) &&
                          group.surahNumber !== 9 && (
                            <div className="my-3 text-center text-emerald-900 text-sm sm:text-base font-bold font-quran">
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </div>
                          )}

                        {/* Ayahs Text */}
                        <div
                          className="leading-[2.4] text-justify text-right font-quran font-medium tracking-wide"
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          {group.ayahs.map((ayah) => {
                            let displayText = ayah.text;
                            if (
                              ayah.numberInSurah === 1 &&
                              group.surahNumber !== 1 &&
                              displayText.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')
                            ) {
                              displayText = displayText
                                .replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '')
                                .trim();
                            }
                            return (
                              <span
                                key={ayah.number}
                                onClick={() =>
                                  handleOpenAyahTafseer(
                                    group.surahNumber,
                                    group.surahName,
                                    ayah.numberInSurah,
                                    displayText,
                                    currentPage
                                  )
                                }
                                className="inline hover:bg-amber-100/70 rounded-md transition-colors px-0.5 cursor-pointer group"
                                title={`انقر لقراءة التفسير الميسر للآية ${ayah.numberInSurah}`}
                              >
                                {displayText}{' '}
                                <span className="inline-flex items-center justify-center text-amber-700 font-bold text-[12px] sm:text-[13px] mx-1 select-none font-quran group-hover:scale-110 transition-transform">
                                  ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                                </span>{' '}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      لا توجد بيانات متاحة لهذه الصفحة
                    </div>
                  )}
                </div>

                {/* Page Number */}
                <div className="px-4 py-2 border-t border-amber-900/10 flex items-center justify-center text-xs font-sans text-gray-500 font-bold select-none z-10">
                  {currentPage}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="bg-gradient-to-r from-[#0B3D35] via-[#0E443A] to-[#104B40] text-white px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-inner z-20 shrink-0">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentPage <= 1
                ? 'opacity-25 cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 active:scale-95'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>الصفحة السابقة</span>
          </button>

          <div className="px-3 py-1 rounded-xl bg-white/10 text-xs font-bold text-amber-200">
            الجزء {meta.juzNumber} • صفحة {currentPage} من 604
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= 604}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentPage >= 604
                ? 'opacity-25 cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 active:scale-95'
            }`}
          >
            <span>الصفحة التالية</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. IN-MUSHAF OFFLINE TAFSEER DRAWER (Requirement 5)            */}
      {/* ============================================================== */}
      {activeTafseerAyah && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-fadeIn">
          <div className="bg-[#FAF8F2] w-full max-w-2xl max-h-[80vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t-2 border-[#C5A059] text-right">
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-[#0B3D35] to-[#104B40] text-white flex items-center justify-between shrink-0 shadow-sm">
              <button
                onClick={() => setActiveTafseerAyah(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer transition-colors"
                title="إغلاق التفسير"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-black font-quran text-amber-200">
                    التفسير الميسر • سورة {activeTafseerAyah.surahName} [الآية{' '}
                    {activeTafseerAyah.numberInSurah}]
                  </h3>
                  <p className="text-[10px] text-white/80 font-sans">
                    مجمع الملك فهد لطباعة المصحف الشريف (كامل بدون إنترنت)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyTafseer}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="نسخ التفسير"
                >
                  {copiedTafseer ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* Quranic Ayah Text */}
              <div className="bg-white rounded-2xl p-4 border border-amber-900/15 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 mb-2 inline-block">
                  النص القرآني الكريم:
                </span>
                <p className="font-quran text-base sm:text-lg font-bold text-emerald-950 leading-loose">
                  {activeTafseerAyah.ayahText}{' '}
                  <span className="text-amber-700 text-sm font-quran">
                    ﴿{toArabicDigits(activeTafseerAyah.numberInSurah)}﴾
                  </span>
                </p>
              </div>

              {/* Complete Tafseer Text (Zero Truncation) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-900/15 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <span className="text-xs font-black text-[#104B40]">
                    بيان التفسير ومعاني الكلمات:
                  </span>
                  <span className="text-[10px] text-gray-500 font-sans">
                    معتمد بدون أي اختصار
                  </span>
                </div>

                {isLoadingAyahTafseer ? (
                  <div className="py-6 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    {activeTafseerAyah.tafseerText}
                  </p>
                )}
              </div>
            </div>

            {/* Drawer Navigation Footer */}
            <div className="p-3 bg-white border-t border-gray-200/80 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={handlePrevAyahTafseer}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الآية السابقة</span>
              </button>

              <button
                onClick={() => setActiveTafseerAyah(null)}
                className="px-4 py-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold cursor-pointer"
              >
                متابعة القراءة في المصحف
              </button>

              <button
                onClick={handleNextAyahTafseer}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer"
              >
                <span>الآية التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. REORGANIZED QURAN INDEX & HUB (Requirement 4)               */}
      {/* ============================================================== */}
      {showIndex && (
        <div className="fixed inset-0 w-screen h-[100dvh] z-60 bg-[#FAF8F2] flex flex-col overflow-hidden select-none animate-fadeIn text-[#172A28]">
          {/* Top Header */}
          <div className="bg-[#FAF8F2] px-4 sm:px-6 pt-3.5 pb-2.5 flex items-center justify-between shrink-0 border-b border-gray-200/70">
            {/* If in Subpage: Back to Hub Button */}
            {indexView !== 'hub' ? (
              <button
                onClick={() => setIndexView('hub')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
                <span>فهرس الأقسام</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowIndex(false);
                  onClose();
                }}
                className="w-10 h-10 rounded-full bg-white shadow-2xs border border-gray-200/80 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
                title="إغلاق المصحف"
              >
                <X className="w-5 h-5 text-gray-800" />
              </button>
            )}

            {/* Title */}
            <div className="flex items-center gap-2 text-[#0B4D3F] select-none">
              <span className="text-[#C5A059] font-bold text-xs tracking-wider">―◆―</span>
              <div className="flex items-center gap-2">
                <h2 className="font-black font-quran text-lg sm:text-xl text-[#0B4D3F]">
                  {indexView === 'hub'
                    ? 'القرآن الكريم'
                    : indexView === 'surahs'
                    ? 'فهرس السور الكريمة'
                    : indexView === 'juzs'
                    ? 'فهرس الأجزاء والأحزاب'
                    : indexView === 'tafseer'
                    ? 'التفسير الميسر الشامل'
                    : indexView === 'sheikh'
                    ? 'معلم القرآن «شيخي»'
                    : 'البحث في آيات القرآن'}
                </h2>
                <div className="w-7 h-7 rounded-lg bg-[#0B4D3F]/10 flex items-center justify-center text-[#0B4D3F]">
                  <BookOpen className="w-4 h-4 text-[#0B4D3F]" />
                </div>
              </div>
              <span className="text-[#C5A059] font-bold text-xs tracking-wider">―◆―</span>
            </div>

            {/* Home / Close Button */}
            <button
              onClick={() => {
                setShowIndex(false);
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-white shadow-2xs border border-gray-200/80 flex items-center justify-center text-[#0B4D3F] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              title="الرئيسية"
            >
              <Home className="w-5 h-5 text-[#0B4D3F]" />
            </button>
          </div>

          {/* HUB VIEW (ORGANIZED BUTTONS / CARDS - Requirement 4) */}
          {indexView === 'hub' && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
              <div className="max-w-xl mx-auto space-y-3 pb-8">
                {/* Last Read Bookmark Quick Resume Card */}
                <div className="bg-gradient-to-r from-[#104B40] via-[#145548] to-[#104B40] text-white rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex-1 text-right">
                    <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-full inline-block mb-1">
                      آخر موضع قراءة محفوظ
                    </span>
                    <h3 className="font-black text-sm sm:text-base font-quran text-white">
                      سورة {lastReadMeta.surahName} (صفحة {lastReadPageNumber})
                    </h3>
                    <p className="text-xs text-white/80 font-sans mt-0.5">
                      الجزء {lastReadMeta.juzNumber} • الحزب {Math.ceil(lastReadMeta.juzNumber * 2)}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      goToPage(lastReadPageNumber);
                      setShowIndex(false);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shrink-0"
                  >
                    <span>متابعة القراءة</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* THE 6 MAIN REORGANIZED QURAN SECTION BUTTONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Button 1: فهرس السور (114 سورة) */}
                  <div
                    onClick={() => setIndexView('surahs')}
                    className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0B4D3F] text-amber-300 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-[#172A28]">
                          المصحف الشريف (السور)
                        </h4>
                        <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                          فهرس الـ 114 سورة بالرسم العثماني
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                  </div>

                  {/* Button 2: الأجزاء والأحزاب (30 جزءاً) */}
                  <div
                    onClick={() => setIndexView('juzs')}
                    className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <Puzzle className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-[#172A28]">
                          الأجزاء والأحزاب (30)
                        </h4>
                        <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                          تصفح القرآن حسب الأجزاء والأرباع
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                  </div>

                  {/* Button 3: التفسير الميسر لكامل المصحف (6236 آية بدون إنترنت) */}
                  <div
                    onClick={() => setIndexView('tafseer')}
                    className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 border border-amber-300/80 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group bg-gradient-to-r from-amber-50/40 to-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#9B7B32] text-amber-200 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-[#172A28]">
                            التفسير الميسر الشامل
                          </h4>
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                            كامل
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                          تفسير جميع آيات المصحف (6236 آية) بدون إنترنت
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-amber-600" />
                  </div>

                  {/* Button 4: معلم ومحفظ القرآن الذكي «شيخي» */}
                  <div
                    onClick={() => setIndexView('sheikh')}
                    className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 border border-emerald-300/80 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group bg-gradient-to-r from-emerald-50/40 to-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D4E41] to-[#07362C] text-amber-300 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-[#172A28]">
                            معلم القرآن الذكي «شيخي»
                          </h4>
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            AI
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                          التلقين والتحفيظ الصوتي التفاعلي
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-[#104B40]" />
                  </div>

                  {/* Button 5: البحث في آيات المصحف الشريف */}
                  <div
                    onClick={() => setIndexView('search')}
                    className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-800 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-[#172A28]">البحث في الآيات</h4>
                        <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                          بحث فوري في نصوص القرآن الـ 6236
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                  </div>

                  {/* Button 6: الفواصل والعلامات المرجعية */}
                  <div
                    onClick={() => setShowBookmarks(true)}
                    className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <Bookmark className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-[#172A28]">
                          العلامات المرجعية ({bookmarks.length})
                        </h4>
                        <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                          الصفحات والفواصل التي تم حفظها
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-[#104B40] transition-colors" />
                  </div>
                </div>

                {/* Quick Jump Action Bar */}
                <div className="bg-white rounded-2xl p-3 border border-gray-200/90 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FastForward className="w-4 h-4 text-[#104B40]" />
                    <span className="text-xs font-bold text-gray-800">
                      الانتقال السريع لرقم صفحة محددة (1 - 604):
                    </span>
                  </div>
                  <button
                    onClick={() => setShowJumpDialog(true)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer transition-all"
                  >
                    انتقال سريع...
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DEDICATED SUBPAGE 1: SURAHS LIST */}
          {indexView === 'surahs' && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
              <div className="max-w-xl mx-auto space-y-2 pb-8">
                {/* Search Bar inside Surahs */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ابحث باسم السورة أو رقمها (مثال: الكهف، 18)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B4D3F] shadow-2xs"
                  />
                </div>

                {filteredSurahs.map((surah) => (
                  <div
                    key={surah.number}
                    onClick={() => {
                      goToPage(surah.startPage);
                      setShowIndex(false);
                    }}
                    className="bg-white hover:bg-emerald-50/50 rounded-2xl p-3 border border-gray-200/80 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#E5F5EC] text-[#147A57] flex items-center justify-center shrink-0">
                      <ChevronLeft className="w-5 h-5" />
                    </div>

                    <div className="text-right flex-1 px-3">
                      <div className="font-black text-sm text-[#172A28]">سورة {surah.name}</div>
                      <div className="text-xs text-gray-500 font-sans">
                        {surah.numberOfAyahs} آية • صفحة {surah.startPage}
                      </div>
                    </div>

                    <div className="font-quran text-lg sm:text-xl font-bold text-[#172A28] px-2 select-none">
                      سُورَةُ {SURAH_CALLIGRAPHY_NAMES[surah.number] || surah.name}
                    </div>

                    <IslamicStarBadge number={surah.number} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEDICATED SUBPAGE 2: JUZS LIST */}
          {indexView === 'juzs' && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
              <div className="max-w-xl mx-auto space-y-2 pb-8">
                {filteredJuz.map((juz) => (
                  <div
                    key={juz.number}
                    onClick={() => {
                      goToPage(juz.startPage);
                      setShowIndex(false);
                    }}
                    className="flex items-center justify-between p-3.5 bg-white hover:bg-emerald-50/50 rounded-2xl border border-gray-200/80 transition-all cursor-pointer active:scale-[0.99] shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#E5F5EC] text-[#147A57] flex items-center justify-center shrink-0">
                      <ChevronLeft className="w-5 h-5" />
                    </div>

                    <div className="text-right flex-1 px-3">
                      <h4 className="font-black text-sm sm:text-base font-quran text-[#172A28]">
                        {juz.name}
                      </h4>
                      <span className="text-xs text-gray-500 font-sans">
                        يبدأ من صفحة {juz.startPage}
                      </span>
                    </div>

                    <IslamicStarBadge number={juz.number} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEDICATED SUBPAGE 3: FULL OFFLINE TAFSEER BROWSER (Requirement 5) */}
          {indexView === 'tafseer' && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
              <div className="max-w-xl mx-auto space-y-3 pb-8 text-right">
                {/* Search across Tafseer */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="ابحث في نص التفسير الميسر لكامل المصحف (6236 آية)..."
                    value={tafseerSearchQuery}
                    onChange={(e) => setTafseerSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#104B40] shadow-2xs"
                  />
                </div>

                {/* If searching tafseer */}
                {tafseerSearchQuery.trim().length >= 2 ? (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-500 block px-1">
                      نتائج البحث في التفسير الميسر ({tafseerSearchResults.length}):
                    </span>
                    {tafseerSearchResults.map((res, i) => {
                      const surahObj = QURAN_SURAHS.find((s) => s.number === res.surahNumber);
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (surahObj) {
                              goToPage(surahObj.startPage);
                              setShowIndex(false);
                            }
                          }}
                          className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs space-y-1.5 cursor-pointer hover:bg-emerald-50/40"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-[#104B40]">
                            <span>
                              سورة {surahObj?.name || res.surahNumber} • الآية {res.numberInSurah}
                            </span>
                            <span className="text-[10px] text-gray-500">فتح في المصحف ←</span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed font-sans">
                            {res.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Standard Surah & Ayah Selector Browser */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          اختر السورة:
                        </label>
                        <select
                          value={selectedTafseerSurah}
                          onChange={(e) => {
                            setSelectedTafseerSurah(Number(e.target.value));
                            setSelectedTafseerAyah(1);
                          }}
                          className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                        >
                          {QURAN_SURAHS.map((s) => (
                            <option key={s.number} value={s.number}>
                              {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          اختر رقم الآية:
                        </label>
                        <select
                          value={selectedTafseerAyah}
                          onChange={(e) => setSelectedTafseerAyah(Number(e.target.value))}
                          className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                        >
                          {Array.from(
                            {
                              length:
                                QURAN_SURAHS.find((s) => s.number === selectedTafseerSurah)
                                  ?.numberOfAyahs || 7,
                            },
                            (_, i) => i + 1
                          ).map((num) => (
                            <option key={num} value={num}>
                              الآية {num}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Display Selected Ayah Tafseer */}
                    <div className="bg-white rounded-3xl p-5 border border-amber-900/15 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-[#104B40]" />
                          <h3 className="font-bold font-quran text-base text-[#104B40]">
                            تفسير سورة{' '}
                            {
                              QURAN_SURAHS.find((s) => s.number === selectedTafseerSurah)?.name
                            }{' '}
                            [الآية {selectedTafseerAyah}]
                          </h3>
                        </div>

                        <button
                          onClick={() => {
                            const targetSurah = QURAN_SURAHS.find(
                              (s) => s.number === selectedTafseerSurah
                            );
                            if (targetSurah) {
                              goToPage(targetSurah.startPage);
                              setShowIndex(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#104B40] text-white text-xs font-bold hover:bg-[#0B3D35] cursor-pointer"
                        >
                          فتح في المصحف
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-black text-[#104B40] block">
                          • التفسير الميسر كاملاً (مجمع الملك فهد):
                        </span>
                        <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-wrap">
                          {browserTafseerText || 'جاري تحميل التفسير...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DEDICATED SUBPAGE 4: SMART SHEIKH TUTOR */}
          {indexView === 'sheikh' && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
              <div className="max-w-xl mx-auto pb-8">
                <SmartSheikhTutor
                  initialSurah={meta.surahNumber}
                  initialAyah={1}
                  language={user.language}
                  onClose={() => setIndexView('hub')}
                />
              </div>
            </div>
          )}

          {/* DEDICATED SUBPAGE 5: AYAH SEARCH */}
          {indexView === 'search' && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
              <div className="max-w-xl mx-auto space-y-2 pb-8">
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ابحث في كامل آيات القرآن الـ 6236 (مثال: نصر الله، إياك نعبد)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B4D3F] shadow-2xs"
                  />
                </div>

                {isSearching ? (
                  <div className="py-12 text-center text-xs text-gray-500 font-bold">
                    جاري البحث في المصحف الشريف...
                  </div>
                ) : searchQuery.trim().length < 2 ? (
                  <div className="py-12 text-center text-xs text-gray-400 font-sans">
                    اكتب كلمتين أو أكثر للبحث في كامل آيات القرآن الكريم (6236 آية)
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500">
                    لم يتم العثور على نتائج مطابقة لـ «{searchQuery}»
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 font-bold px-1 text-right">
                      تم العثور على {searchResults.length} نتيجة:
                    </div>
                    {searchResults.map((res, idx) => (
                      <div
                        key={`${res.ayahNumber}-${idx}`}
                        onClick={() => {
                          goToPage(res.page);
                          setShowIndex(false);
                        }}
                        className="p-3.5 bg-white hover:bg-emerald-50/60 rounded-2xl border border-gray-100 transition-all cursor-pointer text-right space-y-1 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-xs font-bold text-[#104B40] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                            صفحة {res.page}
                          </span>
                          <span className="font-bold text-emerald-950 font-quran text-sm">
                            سورة {res.surahName} • الآية {res.ayahNumberInSurah}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 font-quran leading-relaxed">
                          {res.text}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quick Jump Dialog */}
          {showJumpDialog && (
            <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-emerald-900/20 text-[#172A28] text-right space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <button
                    onClick={() => setShowJumpDialog(false)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <FastForward className="w-5 h-5 text-[#0B4D3F]" />
                    <h3 className="font-bold text-base text-[#0B4D3F]">الانتقال السريع</h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">
                    أدخل رقم الصفحة (1 - 604):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={604}
                      placeholder="مثال: 1"
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-center text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B4D3F]"
                    />
                    <button
                      onClick={() => {
                        const p = parseInt(jumpPageInput, 10);
                        if (!isNaN(p) && p >= 1 && p <= 604) {
                          goToPage(p);
                          setShowJumpDialog(false);
                          setShowIndex(false);
                        }
                      }}
                      className="bg-[#0B4D3F] hover:bg-[#083F33] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs"
                    >
                      انتقال للصفحة
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-700 block mb-2">
                    أو اختر السورة مباشرة:
                  </label>
                  <select
                    onChange={(e) => {
                      const surahNum = Number(e.target.value);
                      const target = QURAN_SURAHS.find((s) => s.number === surahNum);
                      if (target) {
                        goToPage(target.startPage);
                        setShowJumpDialog(false);
                        setShowIndex(false);
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0B4D3F]"
                  >
                    <option value="">-- اختر السورة من القائمة --</option>
                    {QURAN_SURAHS.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.number}. سورة {s.name} (ص {s.startPage})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bookmarks Modal */}
      {showBookmarks && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#FAF8F2] w-full max-w-md h-[75vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-emerald-900/30 text-[#172A28]">
            <div className="bg-[#104B40] text-white p-3.5 flex items-center justify-between shadow-md">
              <button
                onClick={() => setShowBookmarks(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-300 fill-amber-300" />
                <h3 className="font-bold font-quran text-base">العلامات المرجعية</h3>
              </div>
              <div className="w-6" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {bookmarks.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-900" />
                  <p className="text-xs">لا توجد علامات مرجعية محفوظة حتى الآن</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    اضغط على أيقونة الفاصل في أعلى زاوية الصفحة لحفظ مكان قراءتك
                  </p>
                </div>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-3 bg-white rounded-xl border border-gray-100 flex items-center justify-between shadow-2xs hover:border-emerald-300 transition-colors"
                  >
                    <div
                      onClick={() => {
                        goToPage(bm.page);
                        setShowBookmarks(false);
                        setShowIndex(false);
                      }}
                      className="flex-1 cursor-pointer"
                    >
                      <h4 className="font-extrabold text-xs font-quran text-emerald-950">
                        سورة {bm.surahName}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-sans mt-0.5">
                        <span>الجزء {bm.juzNumber}</span>
                        <span>•</span>
                        <span>صفحة {bm.page}</span>
                        {bm.date && (
                          <>
                            <span>•</span>
                            <span>{bm.date}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setBookmarks((prev) => prev.filter((b) => b.id !== bm.id))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف الفاصل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
