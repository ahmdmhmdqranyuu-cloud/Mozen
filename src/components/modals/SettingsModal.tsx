import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  MapPin,
  Compass,
  Volume2,
  Play,
  Pause,
  Square,
  Sparkles,
  Sun,
  Moon,
  Clock,
  Info,
  ShieldCheck,
  Globe,
  CheckCircle2,
  Languages,
  Check,
  Sliders,
  X,
  ArrowRight,
  SlidersHorizontal,
  FolderOpen,
  Save,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  BookOpen,
} from 'lucide-react';
import { TimeSliderPicker } from '../common/TimeSliderPicker';
import {
  CALCULATION_METHODS,
  ASR_METHODS,
  HIGH_LATITUDE_RULES,
  calculatePrayerTimes,
  calculateNightThirds,
  detectDaylightSavingStatus,
  getSavedDstMode,
  setSavedDstMode,
} from '../../utils/prayerTimes';
import {
  searchWorldCities,
  getWorldCountries,
  getWorldRegionsForCountry,
  searchGlobalLocationsOnline,
  detectSmartGpsLocation,
  savePersistentLocation,
  getLastSuccessfulGpsLocation,
  resetAllFirstTimeOnboardingFlags,
  WorldCity,
} from '../../data/worldCitiesData';
import { EGYPT_GOVERNORATES_DATA } from '../../data/egyptLocationsData';
import { PermissionsModal, resetFirstRunPermissionsState } from './PermissionsModal';
import {
  isSmartAzanWidgetEnabled,
  setSmartAzanWidgetEnabled,
} from './SmartAzanIqamaWidget';
import { CityLocation, DstMode, HighLatitudeRule, PrayerKey, UserProfile } from '../../types';
import {
  AZAN_VOICES,
  FAJR_AZAN_VOICES,
  IQAMA_VOICES,
  DUHA_AUDIO_FILE,
  DUA_AFTER_AZAN_AUDIO_FILE,
  soundService,
  SALAWAT_AUDIO_OPTIONS,
  MUSAHARATI_AUDIO_OPTIONS,
} from '../../utils/audioPlayer';
import { AZKAR_LIST } from '../../data/azkarData';

import { reminderScheduler, computeSalawatWindowForDate } from '../../utils/reminderScheduler';
import { ComprehensiveRemindersSettings, RepeatUnit } from '../../types/reminders';
import {
  AppLanguage,
  SUPPORTED_LANGUAGES,
  detectDeviceLanguage,
  getSavedLanguage,
  setSavedLanguage,
  getTranslation,
} from '../../utils/i18n';
import {
  getExtendedSetupSettings,
  saveExtendedSetupSettings,
  ExtendedSetupSettings,
} from '../../utils/androidPermissionsManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateCity: (city: CityLocation) => void;
  onUpdateCalculationMethod: (methodId: string) => void;
  onUpdateAzanVoice: (voice: string) => void;
  onUpdateFajrAzanVoice?: (voice: string) => void;
  onUpdateIqamaVoice?: (voice: string) => void;
  onToggleAutoPlayAzan?: (enabled: boolean) => void;
  onToggleSoundEnabled?: (enabled: boolean) => void;
  onUpdateUser?: (updater: (prev: UserProfile) => UserProfile) => void;
  onOpenFirstTimeSetup?: () => void;
  onLogoutReset?: () => void;
  onTriggerTestSmartAzanWidget?: () => void;
  onOpenPrayerSettings?: (prayerKey: PrayerKey) => void;
}

const AutoFitBannerTitle: React.FC<{ text: string; isRootTitle?: boolean }> = ({
  text,
  isRootTitle = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number>(isRootTitle ? 28 : 20);

  const fitText = useCallback(() => {
    const box = containerRef.current;
    const span = textRef.current;
    if (!box || !span) return;

    const maxWidth = Math.max(40, box.clientWidth - 10);
    const maxHeight = Math.max(18, box.clientHeight - 4);
    const maxPx = isRootTitle ? Math.min(34, Math.floor(maxHeight * 0.85)) : Math.min(26, Math.floor(maxHeight * 0.78));
    const minPx = 10;

    let size = Math.max(minPx, maxPx);
    span.style.fontSize = `${size}px`;
    span.style.whiteSpace = text.length <= 16 ? 'nowrap' : 'normal';

    while (size > minPx && (span.scrollWidth > maxWidth || span.scrollHeight > maxHeight)) {
      size -= 1;
      span.style.fontSize = `${size}px`;
    }
    setFontSize(size);
  }, [text, isRootTitle]);

  useEffect(() => {
    fitText();
    const box = containerRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => fitText());
    ro.observe(box);
    return () => ro.disconnect();
  }, [fitText]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center text-center px-1.5 overflow-hidden"
    >
      <span
        ref={textRef}
        style={{ fontSize: `${fontSize}px` }}
        className="font-cairo font-black text-[#104B40] leading-[1.12] text-center block max-w-full break-words"
      >
        {text}
      </span>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateCity,
  onUpdateCalculationMethod,
  onUpdateAzanVoice,
  onUpdateFajrAzanVoice,
  onUpdateIqamaVoice,
  onToggleAutoPlayAzan,
  onToggleSoundEnabled,
  onUpdateUser,
  onOpenFirstTimeSetup,
  onLogoutReset,
  onTriggerTestSmartAzanWidget,
  onOpenPrayerSettings,
}) => {
  // Navigation: null = Main Settings Overview, string = Dedicated Subpage of that widget
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  // Inside dedicated subpage: collapsed by default, expandable on click
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const [smartWidgetEnabled, setSmartWidgetEnabled] = useState<boolean>(() =>
    isSmartAzanWidgetEnabled()
  );
  const [extSetup, setExtSetup] = useState<ExtendedSetupSettings>(() =>
    getExtendedSetupSettings()
  );

  // Language & DST states
  const [currentLang, setCurrentLang] = useState<AppLanguage>(
    () => user.language || getSavedLanguage()
  );
  useEffect(() => {
    const resolved = user.language || getSavedLanguage();
    if (resolved !== currentLang) {
      setCurrentLang(resolved);
    }
  }, [user.language, isOpen]);
  const [dstMode, setDstMode] = useState<DstMode>(
    () => user.dstMode || getSavedDstMode()
  );

  // Reminders Settings
  const [reminderSettings, setReminderSettings] = useState<ComprehensiveRemindersSettings>(() =>
    reminderScheduler.getSettings()
  );
  const [playingReminderTrack, setPlayingReminderTrack] = useState<string | null>(null);
  const [azkarSaveToast, setAzkarSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>(
    '✓ تم حفظ التعديلات وتحديث الإعدادات تلقائياً'
  );

  // Audition voices
  const [auditioningVoice, setAuditioningVoice] = useState<string | null>(null);
  const [auditioningFajrVoice, setAuditioningFajrVoice] = useState<string | null>(null);
  const [auditioningIqama, setAuditioningIqama] = useState<string | null>(null);
  const [liveCountdownInfo, setLiveCountdownInfo] = useState<{
    prayerName: string;
    countdownStr: string;
    remainingSeconds: number;
  } | null>(null);

  React.useEffect(() => {
    const handleCountdown = (e: Event) => {
      const custom = e as CustomEvent<{
        countdownStr: string;
        prayerName: string;
        remainingSeconds: number;
      }>;
      if (custom.detail?.countdownStr) {
        setLiveCountdownInfo({
          prayerName: custom.detail.prayerName,
          countdownStr: custom.detail.countdownStr,
          remainingSeconds: custom.detail.remainingSeconds,
        });
      }
    };
    window.addEventListener('pre_prayer_countdown', handleCountdown);
    return () => window.removeEventListener('pre_prayer_countdown', handleCountdown);
  }, []);

  // City & Country & Offline Egypt Governorate search
  const [selectedEgyptGovId, setSelectedEgyptGovId] = useState<string>('gov_cairo');
  const [egyptSearchQuery, setEgyptSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>(user.city?.country || '');
  const [selectedState, setSelectedState] = useState<string>('');
  const [citySearch, setCitySearch] = useState('');
  const [onlineSearchResults, setOnlineSearchResults] = useState<WorldCity[]>([]);
  const [onlineSearching, setOnlineSearching] = useState(false);
  const [onlineSearchNotice, setOnlineSearchNotice] = useState<string | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pendingGpsCity, setPendingGpsCity] = useState<CityLocation | null>(null);
  const [lastSavedGps, setLastSavedGps] = useState<CityLocation | null>(() =>
    getLastSuccessfulGpsLocation()
  );
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState(user.name || 'أحمد محمد');
  const [saveStatusBanner, setSaveStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [salawatIntervalInput, setSalawatIntervalInput] = useState<string>(() =>
    String(reminderScheduler.getSettings().salawat.repeatInterval || 15)
  );
  const [manualLatInput, setManualLatInput] = useState<string>(() =>
    String(user.city?.latitude ?? 30.0444)
  );
  const [manualLngInput, setManualLngInput] = useState<string>(() =>
    String(user.city?.longitude ?? 31.2357)
  );
  const [manualCityNameInput, setManualCityNameInput] = useState<string>(() =>
    user.city?.name || ''
  );
  const [manualCoordError, setManualCoordError] = useState<string | null>(null);

  useEffect(() => {
    setSalawatIntervalInput(String(reminderSettings.salawat.repeatInterval || 15));
  }, [reminderSettings.salawat.repeatInterval]);

  useEffect(() => {
    if (user.city) {
      setManualLatInput(String(user.city.latitude));
      setManualLngInput(String(user.city.longitude));
      setManualCityNameInput(user.city.name || '');
    }
  }, [user.city?.latitude, user.city?.longitude, user.city?.name]);

  // Azkar Read-Only Preview & Musaharati Audio Preview State
  const [azkarPreviewCategory, setAzkarPreviewCategory] = useState<'sabah' | 'masaa' | null>(null);
  const previewAzkarItems = useMemo(() => {
    if (!azkarPreviewCategory) return [];
    return AZKAR_LIST.filter((item) => item.category === azkarPreviewCategory);
  }, [azkarPreviewCategory]);

  const savedMusaharatiAudio = reminderSettings.musaharati?.audioFile || 'musaharati_1';
  const [pendingMusaharatiAudio, setPendingMusaharatiAudio] = useState<string>(
    () => reminderScheduler.getSettings().musaharati?.audioFile || 'musaharati_1'
  );
  const [musaharatiPreviewId, setMusaharatiPreviewId] = useState<string | null>(null);
  const [musaharatiPreviewState, setMusaharatiPreviewState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [musaharatiDurations, setMusaharatiDurations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || activeWidgetId !== 'ramadan_fasting') {
      if (musaharatiPreviewId) {
        soundService.stopAudio();
        setMusaharatiPreviewId(null);
        setMusaharatiPreviewState('idle');
      }
      return;
    }
    setPendingMusaharatiAudio(reminderSettings.musaharati?.audioFile || 'musaharati_1');
    let cancelled = false;
    MUSAHARATI_AUDIO_OPTIONS.forEach((opt) => {
      if (!musaharatiDurations[opt.id]) {
        soundService.getAudioDurationFormatted(opt.filePath).then((dur) => {
          if (!cancelled) {
            setMusaharatiDurations((prev) => ({ ...prev, [opt.id]: dur }));
          }
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeWidgetId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleBack = (e: Event) => {
      e.preventDefault();
      if (azkarPreviewCategory) {
        setAzkarPreviewCategory(null);
        return;
      }
      if (permissionsModalOpen) {
        setPermissionsModalOpen(false);
        return;
      }
      soundService.stopAudio();
      setMusaharatiPreviewId(null);
      setMusaharatiPreviewState('idle');
      if (activeWidgetId !== null) {
        setActiveWidgetId(null);
        setExpandedGroup(null);
      } else {
        onClose();
      }
    };
    window.addEventListener('moazenBackRequested', handleBack);
    return () => window.removeEventListener('moazenBackRequested', handleBack);
  }, [isOpen, azkarPreviewCategory, permissionsModalOpen, activeWidgetId, onClose]);

  const worldCountries = useMemo(() => getWorldCountries(), [onlineSearchResults]);
  const worldRegions = useMemo(
    () => (selectedCountry ? getWorldRegionsForCountry(selectedCountry) : []),
    [selectedCountry, onlineSearchResults]
  );
  const filteredCities = useMemo(
    () => searchWorldCities(citySearch, selectedCountry || undefined, selectedState || undefined),
    [citySearch, selectedCountry, selectedState, onlineSearchResults]
  );

  const selectedEgyptGov = useMemo(
    () =>
      EGYPT_GOVERNORATES_DATA.find((g) => g.id === selectedEgyptGovId) ||
      EGYPT_GOVERNORATES_DATA[0],
    [selectedEgyptGovId]
  );

  const filteredEgyptLocations = useMemo(() => {
    const q = egyptSearchQuery.trim().toLowerCase();
    if (!q) return selectedEgyptGov.locations;
    return EGYPT_GOVERNORATES_DATA.flatMap((g) => g.locations).filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.nameEn.toLowerCase().includes(q) ||
        loc.governorate.toLowerCase().includes(q) ||
        loc.type.toLowerCase().includes(q)
    );
  }, [egyptSearchQuery, selectedEgyptGov]);

  if (!isOpen) return null;

  const t = getTranslation(currentLang);
  const isRtl = currentLang === 'ar' || currentLang === 'ur';
  const dstStatus = detectDaylightSavingStatus(new Date(), user.city.timezone);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setAzkarSaveToast(true);
    setTimeout(() => setAzkarSaveToast(false), 2200);
  };

  const handleSaveCurrentSection = (sectionId: string) => {
    try {
      // 1. Flush reminder settings
      reminderScheduler.updateSettings((prev) => ({ ...prev, ...reminderSettings }));
      reminderScheduler.rescheduleAll();

      // 2. Persist user preferences to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('moazen_user_settings', JSON.stringify(user));
      }

      // 3. Trigger native Android Bridge sync if available
      const winBridge = typeof window !== 'undefined'
        ? (window as unknown as { AndroidPrayerBridge?: { syncNativePrayerConfig?: (s: string) => void } }).AndroidPrayerBridge
        : null;

      if (winBridge && typeof winBridge.syncNativePrayerConfig === 'function') {
        const payload = {
          city_latitude: user.city?.latitude || 21.4225,
          city_longitude: user.city?.longitude || 39.8262,
          city_name: user.city?.name || 'مكة المكرمة',
          calc_method: user.calculationMethod || 'makkah',
          asr_method: user.asrJuristicMethod || 'standard',
          high_latitude_rule: user.highLatitudeRule || 'angle_based',
          azan_voice: user.azanVoice || 'makkah',
          fajr_voice: user.fajrAzanVoice || 'abdulbasit_fajr',
          azanSoundEnabled: user.autoPlayAzan !== false,
          pre_prayer_alert_enabled: reminderSettings.prePrayerAlert?.enabled !== false,
          salawat_enabled: reminderSettings.salawat.enabled,
          salawat_auto_after_fajr_iqama: reminderSettings.salawat.autoAfterFajrIqama !== false,
          salawat_time: reminderSettings.salawat.startTime || '06:00',
          salawat_end_time: reminderSettings.salawat.endTime || '23:59',
          salawat_repeat_type: reminderSettings.salawat.repeatType || 'repeat',
          salawat_repeat_interval: reminderSettings.salawat.repeatInterval || 15,
          salawat_repeat_unit: reminderSettings.salawat.repeatUnit || 'minutes',
          salawat_audio: reminderSettings.salawat.audioFile || 'salawat_1',
          salawat_volume_percent: reminderSettings.salawat.volumePercent ?? 85,
          morning_azkar_enabled: reminderSettings.morningAzkar.enabled,
          morning_azkar_time: reminderSettings.morningAzkar.startTime || '08:00',
          evening_azkar_enabled: reminderSettings.eveningAzkar.enabled,
          evening_azkar_time: reminderSettings.eveningAzkar.startTime || '21:00',
          azkar_volume_percent:
            reminderSettings.azkarVolumePercent ??
            reminderSettings.morningAzkar.volumePercent ??
            100,
          musaharati_audio: reminderSettings.musaharati?.audioFile || 'musaharati_1',
        };
        winBridge.syncNativePrayerConfig(JSON.stringify(payload));
      }

      const widgetTitle = widgetsList.find((w) => w.id === sectionId)?.title || 'هذا القسم';
      setSaveStatusBanner({
        type: 'success',
        message: `✓ تم حفظ جميع تعديلات «${widgetTitle}» وتطبيق الجدولة الدائمة في الخلفية بنجاح!`,
      });
      showToast(`✓ تم حفظ تعديلات ${widgetTitle} بنجاح`);
      setTimeout(() => setSaveStatusBanner(null), 4500);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveStatusBanner({
        type: 'error',
        message: '✕ حدث خطأ غير متوقع أثناء حفظ التعديلات. يرجى إعادة المحاولة.',
      });
      setTimeout(() => setSaveStatusBanner(null), 4500);
    }
  };

  const handleSelectLanguage = (lang: AppLanguage) => {
    setCurrentLang(lang);
    setSavedLanguage(lang);
    if (onUpdateUser) {
      onUpdateUser((prev) => ({ ...prev, language: lang }));
    }
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    showToast(`✓ تم تغيير لغة التطبيق إلى ${langObj?.nativeName || lang}`);
  };

  const handleAutoDetectLanguage = () => {
    const detected = detectDeviceLanguage();
    handleSelectLanguage(detected);
  };

  const handleSelectDstMode = (mode: DstMode) => {
    setDstMode(mode);
    setSavedDstMode(mode);
    if (onUpdateUser) {
      onUpdateUser((prev) => ({ ...prev, dstMode: mode }));
    }
    showToast(
      mode === 'auto'
        ? '✓ تم تفعيل الاكتشاف التلقائي للتوقيت الصيفي والشتوي حسب الهاتف'
        : mode === 'summer'
        ? '✓ تم تفعيل التوقيت الصيفي (+60 دقيقة) وتحديث مواقيت الصلاة'
        : '✓ تم تفعيل التوقيت الشتوي القياسي وتحديث مواقيت الصلاة'
    );
  };

  const handleUpdateReminder = (
    updater: (prev: ComprehensiveRemindersSettings) => ComprehensiveRemindersSettings
  ) => {
    reminderScheduler.updateSettings(updater);
    setReminderSettings(reminderScheduler.getSettings());
    showToast('✓ تم حفظ إعدادات التنبيهات وجدولتها بنجاح');
  };

  const handleSelectFajrVoice = (voiceId: string) => {
    if (onUpdateFajrAzanVoice) {
      onUpdateFajrAzanVoice(voiceId);
    } else if (onUpdateUser) {
      onUpdateUser((prev) => ({ ...prev, fajrAzanVoice: voiceId }));
    }
    const voiceObj = FAJR_AZAN_VOICES.find((v) => v.id === voiceId);
    showToast(`✓ تم اعتماد ${voiceObj?.name || 'صوت أذان الفجر'} كصوت رسمي لصلاة الفجر`);
  };

  const handleAuditionFajrVoice = (voiceId: string) => {
    if (auditioningFajrVoice === voiceId) {
      soundService.stopAudio();
      setAuditioningFajrVoice(null);
    } else {
      soundService.stopAudio();
      setAuditioningVoice(null);
      setAuditioningIqama(null);
      setPlayingReminderTrack(null);
      setAuditioningFajrVoice(voiceId);
      soundService.playAzan(voiceId, () => setAuditioningFajrVoice(null));
    }
  };

  const handleAuditionVoice = (voiceId: string) => {
    if (auditioningVoice === voiceId) {
      soundService.stopAudio();
      setAuditioningVoice(null);
    } else {
      soundService.stopAudio();
      setAuditioningFajrVoice(null);
      setAuditioningIqama(null);
      setPlayingReminderTrack(null);
      setAuditioningVoice(voiceId);
      soundService.playAzan(voiceId, () => setAuditioningVoice(null));
    }
  };

  const handleAuditionIqama = (iqamaId: string) => {
    if (auditioningIqama === iqamaId) {
      soundService.stopAudio();
      setAuditioningIqama(null);
    } else {
      soundService.stopAudio();
      setAuditioningVoice(null);
      setAuditioningFajrVoice(null);
      setPlayingReminderTrack(null);
      setAuditioningIqama(iqamaId);
      soundService.playIqama(iqamaId, () => setAuditioningIqama(null));
    }
  };

  const handleAuditionReminderAudio = (trackId: string, filePath: string, category: string) => {
    if (playingReminderTrack === trackId) {
      soundService.stopAudio();
      setPlayingReminderTrack(null);
    } else {
      soundService.stopAudio();
      setAuditioningVoice(null);
      setAuditioningFajrVoice(null);
      setAuditioningIqama(null);
      setMusaharatiPreviewId(null);
      setMusaharatiPreviewState('idle');
      setPlayingReminderTrack(trackId);
      soundService.playTrack(filePath, trackId, category, () => setPlayingReminderTrack(null));
    }
  };

  const handleMusaharatiPlayPause = (trackId: string, filePath: string) => {
    if (musaharatiPreviewId === trackId && musaharatiPreviewState === 'playing') {
      if (soundService.pauseAudio()) {
        setMusaharatiPreviewState('paused');
      }
      return;
    }
    if (musaharatiPreviewId === trackId && musaharatiPreviewState === 'paused') {
      if (soundService.resumeAudio()) {
        setMusaharatiPreviewState('playing');
        return;
      }
    }
    // Start a fresh preview (automatically stops any previously playing track)
    soundService.stopAudio();
    setAuditioningVoice(null);
    setAuditioningFajrVoice(null);
    setAuditioningIqama(null);
    setPlayingReminderTrack(null);
    setMusaharatiPreviewId(trackId);
    setMusaharatiPreviewState('playing');
    soundService.playTrack(filePath, trackId, 'musaharati', () => {
      setMusaharatiPreviewId(null);
      setMusaharatiPreviewState('idle');
    });
  };

  const handleStopMusaharatiPreview = () => {
    soundService.stopAudio();
    setMusaharatiPreviewId(null);
    setMusaharatiPreviewState('idle');
  };

  const handleSaveMusaharatiSelection = () => {
    const chosenId = pendingMusaharatiAudio || 'musaharati_1';
    handleUpdateReminder((prev) => ({
      ...prev,
      musaharati: { ...prev.musaharati, audioFile: chosenId },
    }));
    const winBridge =
      typeof window !== 'undefined'
        ? (window as unknown as { AndroidPrayerBridge?: { syncNativePrayerConfig?: (s: string) => void } }).AndroidPrayerBridge
        : null;
    if (winBridge && typeof winBridge.syncNativePrayerConfig === 'function') {
      try {
        winBridge.syncNativePrayerConfig(
          JSON.stringify({
            musaharati_audio: chosenId,
            musaharati_enabled: reminderSettings.musaharati.enabled,
            musaharati_time: reminderSettings.musaharati.time || '03:30',
          })
        );
      } catch {
        // ignore bridge fallback
      }
    }
    showToast('✓ تم حفظ واختيار نغمة المسحراتي الرسمية بنجاح');
  };

  const applyLocationToApp = (city: CityLocation, sourceLabel?: string) => {
    onUpdateCity(city);
    savePersistentLocation(city);
    if (city.recommendedMethod) {
      onUpdateCalculationMethod(city.recommendedMethod);
    }
    setSelectedCountry(city.country);
    setSelectedState(city.state || '');
    window.dispatchEvent(new CustomEvent('prayerTimesUpdated'));
    showToast(
      `✓ تم اعتماد الموقع وتحديث المواقيت والقبلة والتقويم: ${city.name}${
        sourceLabel ? ` (${sourceLabel})` : ''
      }`
    );
  };

  const handleDetectGps = () => {
    setDetectingGps(true);
    setGpsNotice(null);
    setGpsError(null);

    detectSmartGpsLocation(
      (detectedCity, message) => {
        setDetectingGps(false);
        setPendingGpsCity(detectedCity);
        setLastSavedGps(getLastSuccessfulGpsLocation());
        setGpsNotice(message);
      },
      (errorMsg) => {
        setDetectingGps(false);
        setGpsError(errorMsg);
        setLastSavedGps(getLastSuccessfulGpsLocation());
      },
      { autoSaveActiveLocation: false }
    );
  };

  const handleOnlineWorldSearch = async () => {
    const q = citySearch.trim();
    if (q.length < 2) {
      setOnlineSearchNotice('اكتب حرفين على الأقل للبحث العالمي عبر OpenStreetMap.');
      return;
    }
    setOnlineSearching(true);
    setOnlineSearchNotice(null);
    const countryCode = worldCountries.find((c) => c.country === selectedCountry)?.countryCode;
    const results = await searchGlobalLocationsOnline(q, countryCode);
    setOnlineSearching(false);
    setOnlineSearchResults(results);
    if (results.length === 0) {
      setOnlineSearchNotice('لم يتم العثور على نتائج إضافية أونلاين أو الاتصال غير متاح حاليًا.');
    } else {
      setOnlineSearchNotice(`✓ تم العثور على ${results.length} موقع إضافي وحفظها محليًا للاستخدام دون إنترنت.`);
    }
  };

  const toggleGroup = (groupId: string) => {
    soundService.stopAudio();
    setAuditioningVoice(null);
    setAuditioningFajrVoice(null);
    setAuditioningIqama(null);
    setPlayingReminderTrack(null);
    setExpandedGroup((prev) => (prev === groupId ? null : groupId));
  };

  const ramadanPrayers = calculatePrayerTimes(
    user.city,
    new Date(),
    user.calculationMethod,
    user.asrJuristicMethod || 'standard',
    user.manualPrayerAdjustments || {},
    user.dstMode,
    user.highLatitudeRule || 'angle_based'
  );
  const nightThirds = calculateNightThirds(
    user.city,
    new Date(),
    user.calculationMethod,
    user.asrJuristicMethod || 'standard',
    user.manualPrayerAdjustments || {},
    user.dstMode,
    user.highLatitudeRule || 'angle_based'
  );
  const todayFajrPrayer = ramadanPrayers.find((p) => p.key === 'fajr');
  const todayMaghribPrayer = ramadanPrayers.find((p) => p.key === 'maghrib');
  const imsakLeadMins = reminderSettings.imsakReminder?.minutesBeforeFajr ?? 10;
  const imsakTimeFormatted = todayFajrPrayer
    ? new Date(todayFajrPrayer.timestamp.getTime() - imsakLeadMins * 60000).toLocaleTimeString(
        currentLang === 'ar' ? 'ar-EG' : 'en-US',
        { hour: '2-digit', minute: '2-digit' }
      )
    : '--:--';
  const iftarTimeFormatted = todayMaghribPrayer?.time || '--:--';

  // All 10 Widgets (including dedicated About App section)
  const widgetsList = [
    {
      id: 'profile',
      order: 1,
      title: t.settingsProfile,
      subtitle: user.name || 'أحمد محمد',
      iconImg: '/assets/aistudio/1794629378091_86ac864e.jpg',
      badge: isRtl ? 'الحساب' : 'Profile',
      color: 'from-emerald-700 to-teal-800',
    },
    {
      id: 'permissions',
      order: 2,
      title: t.settingsPermissions,
      subtitle: isRtl
        ? 'الأذونات الدقيقة • تحسين البطارية • الإشعارات'
        : 'Exact Alarms • Battery Whitelist • Notifications',
      iconImg: '/assets/settings_icons/icon_permissions.jpg',
      badge: isRtl ? 'أمان وخلفية' : 'Background',
      color: 'from-amber-700 to-amber-900',
    },
    {
      id: 'location_time',
      order: 3,
      title: t.settingsLocationTime,
      subtitle: `${user.city.name} (${user.city.country}) • ${
        dstMode === 'summer'
          ? (isRtl ? 'صيفي' : 'Summer')
          : dstMode === 'winter'
          ? (isRtl ? 'شتوي' : 'Standard')
          : (isRtl ? 'تلقائي' : 'Auto')
      }`,
      iconImg: '/assets/settings_icons/icon_location.jpg',
      badge: isRtl ? 'فلكي دقيق' : 'Location',
      color: 'from-emerald-800 to-emerald-950',
    },
    {
      id: 'language_appearance',
      order: 4,
      title: t.settingsLanguage,
      subtitle: `${SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.nativeName || 'العربية'} (${SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.name})`,
      iconImg: '/assets/settings_icons/icon_language.jpg',
      badge: isRtl ? 'اللغة' : 'Language',
      color: 'from-blue-700 to-indigo-900',
    },
    {
      id: 'azan_iqama',
      order: 5,
      title: t.settingsAzan,
      subtitle: `${user.autoPlayAzan !== false ? (isRtl ? 'الأذان التلقائي: مفعّل' : 'Auto Azan: On') : (isRtl ? 'الأذان صامت' : 'Silent')} • ${
        (user.fajrAzanVoice && FAJR_AZAN_VOICES.find((v) => v.id === user.fajrAzanVoice)?.name) ||
        AZAN_VOICES.find((v) => v.id === user.azanVoice)?.name ||
        'عبد الباسط عبد الصمد'
      }`,
      iconImg: '/assets/aistudio/1794629551290_c4ed90c5.jpg',
      badge: isRtl ? 'أصوات ومواقيت' : 'Azan Audio',
      color: 'from-teal-800 to-emerald-900',
    },
    {
      id: 'azkar_reminders',
      order: 6,
      title: t.settingsAzkar,
      subtitle: isRtl
        ? `الصباح ${reminderSettings.morningAzkar.startTime} • المساء ${reminderSettings.eveningAzkar.startTime} • قيام الليل والرقية الشرعية`
        : `Morning ${reminderSettings.morningAzkar.startTime} • Evening ${reminderSettings.eveningAzkar.startTime} • Qiyam & Ruqyah`,
      iconImg: '/assets/settings_icons/icon_azkar.jpg',
      badge: isRtl ? 'تنبيهات وأذكار' : 'Azkar & Qiyam',
      color: 'from-emerald-700 to-green-900',
    },
    {
      id: 'ramadan_fasting',
      order: 7,
      title: t.settingsRamadan,
      subtitle: isRtl
        ? `الإفطار: ${iftarTimeFormatted} • الإمساك: ${imsakTimeFormatted} • مدفع الإفطار والمسحراتي`
        : `Iftar: ${iftarTimeFormatted} • Imsak: ${imsakTimeFormatted}`,
      iconImg: '/assets/settings_icons/icon_ramadan.jpg',
      badge: isRtl ? 'صيام ومدفع' : 'Ramadan',
      color: 'from-amber-800 to-yellow-950',
    },
    {
      id: 'privacy_policy',
      order: 8,
      title: t.settingsPrivacy,
      subtitle: isRtl
        ? 'المصادر المعتمدة • حماية بياناتك وأمانها دون إنترنت'
        : 'Verified Sources • 100% Offline',
      iconImg: '/assets/aistudio/1794629233882_237cc7a3.jpg',
      badge: isRtl ? 'أمان تام' : 'Privacy',
      color: 'from-emerald-900 to-teal-950',
    },
    {
      id: 'about_app',
      order: 9,
      title: t.settingsAbout,
      subtitle: t.settingsAboutSub,
      iconImg: '/assets/aistudio/1794629416999_a48d32bb.jpg',
      badge: isRtl ? 'معلومات التطبيق' : 'About',
      color: 'from-emerald-800 to-teal-950',
    },
    {
      id: 'about_reset',
      order: 10,
      title: t.settingsLogout,
      subtitle: t.settingsLogoutSub,
      iconImg: '/assets/settings_icons/icon_logout.jpg',
      badge: isRtl ? 'إعادة ضبط' : 'Reset',
      color: 'from-rose-700 to-red-900',
    },
  ];

  const currentActiveWidget = widgetsList.find((w) => w.id === activeWidgetId);

  return (
    <>
      <div className="fixed inset-0 z-50 w-screen h-[100dvh] bg-[#D9E4C8] flex flex-col overflow-hidden animate-fadeIn">
        {/* SINGLE SCROLL CONTAINER with Integrated Synchronized Settings Background */}
        <div
          className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden smooth-scroll-container scrollbar-none"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="relative min-h-full w-full flex flex-col justify-between pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            <img
              src="/assets/aistudio/_______________________c271e9db.png"
              alt="خلفية الإعدادات"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none z-0"
            />
            <div className="relative z-10 flex-1 flex flex-col">
            {/* TRANSPARENT TOP CONTROLS + UNIFIED IVORY-GOLD PILL «الإعدادات / Settings» */}
            <div className="relative w-full shrink-0 px-3 pt-2 pb-1 flex flex-col items-center">
              {/* Top corner controls leaving central mosque clear */}
              <div className="w-full flex items-center justify-between">
                {/* Right side in RTL: Subpage Back Button */}
                <div>
                  {activeWidgetId && (
                    <button
                      type="button"
                      onClick={() => {
                        soundService.stopAudio();
                        setMusaharatiPreviewId(null);
                        setMusaharatiPreviewState('idle');
                        setActiveWidgetId(null);
                        setExpandedGroup(null);
                      }}
                      className="moazen-widget px-3 py-1 rounded-full text-[#104B40] text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm border border-[#D6C18D] hover:border-[#C5A059]"
                    >
                      {isRtl ? (
                        <ChevronRight className="w-4 h-4 text-[#104B40]" />
                      ) : (
                        <ChevronLeft className="w-4 h-4 text-[#104B40]" />
                      )}
                      <span>{isRtl ? 'الرجوع' : t.setupBack}</span>
                    </button>
                  )}
                </div>

                {/* Left side in RTL: Language Switch & Close */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setActiveWidgetId('language_appearance');
                      setExpandedGroup('lang_group_1');
                    }}
                    className="moazen-widget px-2.5 py-1 rounded-full text-[#104B40] text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm border border-[#D6C18D] hover:border-[#C5A059]"
                    title={t.settingsChangeLangTitle}
                  >
                    <Languages className="w-3.5 h-3.5 text-[#104B40]" />
                    <span>{SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.flag || '🌐'}</span>
                  </button>

                  <button
                    onClick={() => {
                      soundService.stopAudio();
                      setMusaharatiPreviewId(null);
                      setMusaharatiPreviewState('idle');
                      setAzkarPreviewCategory(null);
                      onClose();
                    }}
                    className="moazen-widget w-8 h-8 rounded-full text-[#104B40] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm border border-[#D6C18D] hover:border-[#C5A059]"
                    title={t.closeBtn}
                  >
                    <X className="w-4 h-4 text-[#104B40]" />
                  </button>
                </div>
              </div>

              {/* Clearance beneath top illuminated mosque silhouette so Title Pill aligns directly on the golden curved line while keeping all 10 stacked widgets fit cleanly */}
              <div className={`${!activeWidgetId ? 'h-[clamp(58px,9dvh,88px)]' : 'h-4 sm:h-6'} w-full pointer-events-none`} />

              {/* Centered Unified Ivory-Cream Pill with Light Gold Border & Subtle Islamic Ornament */}
              <div className="moazen-widget w-[54%] max-w-[230px] h-8.5 sm:h-9.5 rounded-full border-[1.5px] border-[#D6C18D] shadow-md flex items-center justify-center px-3 pointer-events-none select-none">
                <AutoFitBannerTitle
                  text={activeWidgetId && currentActiveWidget ? currentActiveWidget.title : t.settingsTitle}
                  isRootTitle={!(activeWidgetId && currentActiveWidget)}
                />
              </div>
            </div>

            {/* SAVE NOTIFICATION TOAST */}
            {azkarSaveToast && (
              <div className="bg-[#104B40] text-white text-xs font-bold py-2 px-4 text-center shrink-0 shadow-md animate-fadeIn sticky top-0 z-30">
                {toastMessage}
              </div>
            )}

            {/* CONTENT AREA */}
            <div
              className={`max-w-5xl mx-auto w-full px-3 sm:px-5 flex-1 flex flex-col ${
                !activeWidgetId ? 'justify-between py-0.5 sm:py-1.5' : 'justify-start py-2.5 sm:py-4'
              }`}
            >
              {/* VIEW MODE 1: MAIN SETTINGS OVERVIEW (All 10 creamy-ivory glass widgets with slightly taller rows + bottom clearance showing the green mosque art) */}
              {!activeWidgetId ? (
                <div className="animate-fadeIn max-w-2xl mx-auto w-full mt-1.5 mb-auto pb-[clamp(64px,11dvh,104px)]">
                  <div className="flex flex-col gap-[4.5px] sm:gap-[5px]">
                    {widgetsList.map((sec) => (
                      <div
                        key={sec.id}
                        onClick={() => {
                          setActiveWidgetId(sec.id);
                          setExpandedGroup(null);
                        }}
                        className="moazen-widget rounded-xl px-2.5 py-[5.5px] sm:px-3 sm:py-[6.5px] min-h-[38px] sm:min-h-[41px] border border-[#D6C18D] flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group hover:border-[#C5A059]"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                          {/* Framed Square Icon filled 100% edge-to-edge */}
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0B1412] border border-[#D6C18D] shadow-sm p-0 shrink-0 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                            <img
                              src={sec.iconImg}
                              alt={sec.title}
                              className="w-full h-full object-cover object-center block"
                            />
                          </div>

                          <span className="text-[10px] sm:text-xs font-black w-5 h-5 rounded-full bg-[#6AA06E]/25 border border-[#6AA06E]/45 text-[#104B40] flex items-center justify-center shrink-0">
                            {sec.order}
                          </span>

                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <h4 className="text-[11.5px] sm:text-[12.5px] font-black text-[#104B40] leading-tight truncate">
                              {sec.title}
                            </h4>
                            <span className="hidden sm:inline text-[11px] text-[#4B5B58] truncate font-sans">
                              — {sec.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="w-5.5 h-5.5 rounded-full bg-[#EDE2C8]/90 border border-[#D6C18D] flex items-center justify-center shrink-0 mx-0.5 group-hover:bg-[#104B40] group-hover:text-white transition-colors">
                          {isRtl ? (
                            <ChevronLeft className="w-3 h-3 text-[#104B40] group-hover:text-white" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-[#104B40] group-hover:text-white" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* VIEW MODE 2: DEDICATED WIDGET SUBPAGE */
                <div className="space-y-3 pb-6 animate-fadeIn">
                  {/* Subpage Breadcrumb Header Card */}
                  {currentActiveWidget && (
                    <div className="moazen-widget rounded-2xl p-3 border border-[#D6C18D] shadow-2xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0B1412] border-2 border-[#D6C18D] p-0 shrink-0 overflow-hidden flex items-center justify-center">
                          <img
                            src={currentActiveWidget.iconImg}
                            alt={currentActiveWidget.title}
                            className="w-full h-full object-cover scale-[1.16] object-center block"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-[#104B40] bg-[#EDE2C8] px-2 py-0.5 rounded-full border border-[#D6C18D]">
                              {currentActiveWidget.badge}
                            </span>
                            <h3 className="text-sm font-black text-[#104B40] truncate">
                              {currentActiveWidget.title}
                            </h3>
                          </div>
                          <p className="text-[11px] text-[#4B5B58] mt-0.5 font-sans truncate">
                            {currentActiveWidget.subtitle}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveWidgetId(null)}
                        className="moazen-widget shrink-0 px-3 py-1.5 rounded-xl border border-[#D6C18D] text-[#104B40] text-xs font-black transition-all cursor-pointer shadow-xs hover:border-[#C5A059] active:scale-95"
                      >
                        {t.allSettingsLabel}
                      </button>
                    </div>
                  )}


                {/* 1. Profile Widget Subpage */}
                {activeWidgetId === 'profile' && (
                  <div className="space-y-2.5">
                    {/* Group 1: Username & Profile Name */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('profile_name')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          تعديل اسم المستخدم وبيانات الحساب
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'profile_name' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'profile_name' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <label className="text-xs font-bold text-gray-700 block">
                            اسم المستخدم:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={profileNameInput}
                              onChange={(e) => setProfileNameInput(e.target.value)}
                              className="flex-1 p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-bold text-right"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateUser) {
                                  onUpdateUser((prev) => ({ ...prev, name: profileNameInput }));
                                }
                                showToast('✓ تم حفظ اسم المستخدم بنجاح');
                              }}
                              className="bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs"
                            >
                              حفظ
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 2: First-Time Onboarding Wizard */}
                    {onOpenFirstTimeSetup && (
                      <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => toggleGroup('profile_setup')}
                          className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                        >
                          <span className="text-xs font-black text-gray-900">
                            معالج إعداد التطبيق لأول مرة (الموقع، التوقيت، الأذان)
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              expandedGroup === 'profile_setup' ? 'rotate-180 text-[#104B40]' : ''
                            }`}
                          />
                        </button>
                        {expandedGroup === 'profile_setup' && (
                          <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              إعادة تشغيل معالج البدء لضبط المدينة وصوت المؤذن.
                            </span>
                            <button
                              onClick={onOpenFirstTimeSetup}
                              className="bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer shadow-xs"
                            >
                              تشغيل المعالج الآن
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Permissions Widget Subpage */}
                {activeWidgetId === 'permissions' && (
                  <div className="space-y-2.5">
                    {/* Group 1: Battery Whitelist */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('perm_battery')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          استثناء التطبيق من قيود توفير طاقة البطارية
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'perm_battery' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'perm_battery' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                            ضروري لضمان انطلاق صوت الأذان في موعده الدقيق عند إغلاق التطبيق وقفل
                            الهاتف دون أن يوقفه نظام الأندرويد لتوفير الطاقة.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                typeof window !== 'undefined' &&
                                (window as any).AndroidBridge?.requestIgnoreBatteryOptimizations
                              ) {
                                (window as any).AndroidBridge.requestIgnoreBatteryOptimizations();
                              } else {
                                showToast(
                                  'تطبيق الأندرويد: يرجى فتح الإعدادات > البطارية > استثناء التطبيق'
                                );
                              }
                            }}
                            className="moazen-widget w-full p-2.5 border border-[#104B40]/30 rounded-xl text-xs font-bold text-[#104B40] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#104B40]" />
                            <span>فتح إعدادات تحسين البطارية على هاتفك</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Group 2: Exact Alarms */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('perm_alarms')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          إذن التنبيهات الدقيقة (Exact Alarms - AlarmManager)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'perm_alarms' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'perm_alarms' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                            يستخدم نظام AlarmManager في نظام أندرويد لجدولة الأذان بالثانية.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                typeof window !== 'undefined' &&
                                (window as any).AndroidBridge?.openExactAlarmSettings
                              ) {
                                (window as any).AndroidBridge.openExactAlarmSettings();
                              } else {
                                showToast('التنبيهات الدقيقة: مفعّلة عبر AlarmManager');
                              }
                            }}
                            className="moazen-widget w-full p-2.5 border border-[#104B40]/30 rounded-xl text-xs font-bold text-[#104B40] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <Clock className="w-4 h-4 text-[#104B40]" />
                            <span>تأكيد تفعيل إذن التنبيهات الدقيقة</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Group 3: Comprehensive Wizard */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPermissionsModalOpen(true)}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100/70 hover:to-teal-100/70"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#104B40]" />
                          <span className="text-xs font-black text-[#104B40]">
                            فتح المعالج الشامل لفحص وتفعيل كافة الأذونات
                          </span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-[#104B40]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Location & Time Subpage */}
                {activeWidgetId === 'location_time' && (
                  <div className="space-y-2.5">
                    {/* Current Active Location Summary Strip */}
                    <div className="moazen-widget rounded-2xl p-3.5 border border-[#104B40]/20 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#104B40] flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-gray-500">الموقع النشط حاليًا:</span>
                            {user.city.isSavedLocation && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                موقع محفوظ
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-black text-[#172A28] truncate">
                            {user.city.name} — {user.city.country}
                            {user.city.state && !user.city.name.includes(user.city.state) ? ` (${user.city.state})` : ''}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            {user.city.latitude.toFixed(4)}°, {user.city.longitude.toFixed(4)}°
                            {user.city.district ? ` • ${user.city.district}` : ''}
                            {user.city.neighborhood ? ` • ${user.city.neighborhood}` : ''}
                            {user.city.street ? ` • ${user.city.street}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Group 1: GPS Auto Detection (Detailed Hierarchy + Safe Fallback + Explicit Confirm) */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('loc_gps')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          الكشف التلقائي عن الموقع الدقيق عبر GPS (هجين مع الشبكة)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'loc_gps' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'loc_gps' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2.5">
                          <button
                            type="button"
                            onClick={handleDetectGps}
                            disabled={detectingGps}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Compass
                              className={`w-4 h-4 text-amber-300 ${detectingGps ? 'animate-spin' : ''}`}
                            />
                            <span>
                              {detectingGps
                                ? 'جاري تحديد موقعك الجغرافي الدقيق عبر GPS...'
                                : 'تحديد الموقع الجغرافي الدقيق الآن عبر GPS'}
                            </span>
                          </button>

                          {/* Detected GPS Details & Explicit Confirmation Card */}
                          {pendingGpsCity && (
                            <div className="moazen-widget p-3 border-2 border-[#104B40]/30 rounded-xl space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-black text-[#104B40] flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  {pendingGpsCity.isSavedLocation
                                    ? 'استرجاع آخر موقع محفوظ (موقع محفوظ)'
                                    : 'تم رصد موقعك الجغرافي عبر GPS'}
                                </span>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                    pendingGpsCity.isSavedLocation
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  }`}
                                >
                                  {pendingGpsCity.isSavedLocation ? 'موقع محفوظ' : 'GPS مباشر'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-[#FAF8F5] p-2.5 rounded-lg border border-gray-200/80">
                                <div>
                                  <span className="text-gray-500">الدولة: </span>
                                  <strong className="text-gray-900">{pendingGpsCity.country}</strong>
                                </div>
                                <div>
                                  <span className="text-gray-500">المحافظة/المنطقة: </span>
                                  <strong className="text-gray-900">{pendingGpsCity.state || '—'}</strong>
                                </div>
                                <div>
                                  <span className="text-gray-500">المدينة/المركز: </span>
                                  <strong className="text-gray-900">{pendingGpsCity.name}</strong>
                                </div>
                                <div>
                                  <span className="text-gray-500">المنطقة/الحي: </span>
                                  <strong className="text-gray-900">
                                    {[pendingGpsCity.district, pendingGpsCity.neighborhood]
                                      .filter(Boolean)
                                      .join(' • ') || '—'}
                                  </strong>
                                </div>
                                {pendingGpsCity.street && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">الشارع: </span>
                                    <strong className="text-gray-900">{pendingGpsCity.street}</strong>
                                  </div>
                                )}
                                <div className="col-span-2 font-mono text-[10.5px] text-[#104B40]">
                                  الإحداثيات: {pendingGpsCity.latitude.toFixed(5)}°, {pendingGpsCity.longitude.toFixed(5)}°
                                  {pendingGpsCity.accuracyMeters ? ` (±${pendingGpsCity.accuracyMeters}م)` : ''}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    applyLocationToApp(
                                      pendingGpsCity,
                                      pendingGpsCity.isSavedLocation ? 'موقع محفوظ' : 'GPS مباشر'
                                    );
                                    setPendingGpsCity(null);
                                  }}
                                  className="flex-1 py-2 px-3 rounded-lg bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-4 h-4 text-amber-300" />
                                  <span>اعتماد وتحديث المواقيت والقبلة والتقويم</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingGpsCity(null)}
                                  className="py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          )}

                          {gpsNotice && !pendingGpsCity && (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl text-xs font-bold flex items-center justify-between">
                              <span>{gpsNotice}</span>
                              <button
                                type="button"
                                onClick={() => setGpsNotice(null)}
                                className="font-bold text-gray-500 px-1"
                              >
                                ×
                              </button>
                            </div>
                          )}

                          {/* Error Card with Retry, Last Saved GPS ("موقع محفوظ"), and Manual Selection */}
                          {gpsError && (
                            <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-xl space-y-2">
                              <p className="text-xs font-bold text-rose-900 flex items-start gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <span>{gpsError}</span>
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleDetectGps}
                                  className="px-3 py-1.5 rounded-lg bg-[#104B40] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>إعادة المحاولة</span>
                                </button>
                                {lastSavedGps && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPendingGpsCity(lastSavedGps);
                                      setGpsError(null);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[11px] font-bold cursor-pointer"
                                  >
                                    استخدام آخر موقع محفوظ (موقع محفوظ)
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setExpandedGroup('loc_world')}
                                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 text-[11px] font-bold cursor-pointer"
                                >
                                  الاختيار اليدوي من الخريطة العالمية
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Group 2: Prayer Calculation Method & Asr Juristic */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('loc_method')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          طريقة حساب المواقيت الفلكية والمذهب الفقهي
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'loc_method' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'loc_method' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-3">
                          <div className="space-y-1">
                            <label className="text-xs text-gray-700 font-bold block">
                              الهيئة الفلكية المعتمدة:
                            </label>
                            <select
                              value={user.calculationMethod}
                              onChange={(e) => onUpdateCalculationMethod(e.target.value)}
                              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                            >
                              {CALCULATION_METHODS.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs text-gray-700 font-bold block">
                              مذهب حساب صلاة العصر:
                            </label>
                            <select
                              value={user.asrJuristicMethod || 'standard'}
                              onChange={(e) => {
                                if (onUpdateUser) {
                                  onUpdateUser((prev) => ({
                                    ...prev,
                                    asrJuristicMethod: e.target.value as 'standard' | 'hanafi',
                                  }));
                                }
                              }}
                              className="moazen-widget w-full p-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                            >
                              {ASR_METHODS.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs text-gray-700 font-bold block">
                              حساب خطوط العرض العليا والمناطق القطبية:
                            </label>
                            <select
                              value={user.highLatitudeRule || 'angle_based'}
                              onChange={(e) => {
                                const rule = e.target.value as HighLatitudeRule;
                                if (onUpdateUser) {
                                  onUpdateUser((prev) => ({
                                    ...prev,
                                    highLatitudeRule: rule,
                                  }));
                                }
                                window.dispatchEvent(new CustomEvent('prayerTimesUpdated'));
                                showToast('✓ تم تحديث قاعدة خطوط العرض العليا وحساب المواقيت');
                              }}
                              className="moazen-widget w-full p-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                            >
                              {HIGH_LATITUDE_RULES.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-[#4B5B58] font-medium">
                              {HIGH_LATITUDE_RULES.find(
                                (r) => r.id === (user.highLatitudeRule || 'angle_based')
                              )?.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 2.5: Manual Latitude & Longitude Entry */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('loc_coords')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          إدخال الإحداثيات الجغرافية يدويًا (خط العرض والطول لأي مكان بالعالم)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'loc_coords' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'loc_coords' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                خط العرض (Latitude: -90 إلى +90)
                              </label>
                              <input
                                type="number"
                                step="any"
                                min={-90}
                                max={90}
                                value={manualLatInput}
                                onChange={(e) => {
                                  setManualLatInput(e.target.value);
                                  setManualCoordError(null);
                                }}
                                placeholder="مثال: 59.9139"
                                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                خط الطول (Longitude: -180 إلى +180)
                              </label>
                              <input
                                type="number"
                                step="any"
                                min={-180}
                                max={180}
                                value={manualLngInput}
                                onChange={(e) => {
                                  setManualLngInput(e.target.value);
                                  setManualCoordError(null);
                                }}
                                placeholder="مثال: 10.7522"
                                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-900"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-700 block mb-1">
                              اسم الموقع (اختياري)
                            </label>
                            <input
                              type="text"
                              value={manualCityNameInput}
                              onChange={(e) => setManualCityNameInput(e.target.value)}
                              placeholder="مثال: موقع مخصص / أوسلو"
                              className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                            />
                          </div>
                          {manualCoordError && (
                            <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                              {manualCoordError}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const latNum = parseFloat(manualLatInput);
                              const lngNum = parseFloat(manualLngInput);
                              if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
                                setManualCoordError('خط العرض غير صالح — يجب أن يكون بين -90 و +90.');
                                return;
                              }
                              if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
                                setManualCoordError('خط الطول غير صالح — يجب أن يكون بين -180 و +180.');
                                return;
                              }
                              const absLat = Math.abs(latNum);
                              const recommendedMethod =
                                absLat >= 48
                                  ? 'mwl'
                                  : Math.abs(latNum - 26.8) <= 6 && Math.abs(lngNum - 30.8) <= 6
                                  ? 'egypt'
                                  : Math.abs(latNum - 24.0) <= 9 && Math.abs(lngNum - 45.0) <= 10
                                  ? 'makkah'
                                  : 'mwl';
                              const customCity: CityLocation = {
                                id: `custom_${latNum.toFixed(4)}_${lngNum.toFixed(4)}`,
                                name:
                                  manualCityNameInput.trim() ||
                                  `إحداثيات (${latNum.toFixed(2)}°, ${lngNum.toFixed(2)}°)`,
                                country: 'موقع يدوي',
                                latitude: latNum,
                                longitude: lngNum,
                                timezone: '',
                                recommendedMethod,
                                source: 'manual',
                                isSavedLocation: true,
                              };
                              setManualCoordError(null);
                              applyLocationToApp(customCity, 'إحداثيات يدوية');
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                          >
                            <Check className="w-4 h-4 text-amber-300" />
                            <span>اعتماد الإحداثيات وتحديث المواقيت والقبلة</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Group 3: Daylight Saving Time (DST) */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('loc_dst')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          ضبط التوقيت الصيفي والشتوي (DST)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'loc_dst' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'loc_dst' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <div className="moazen-widget grid grid-cols-3 gap-1.5 p-1 rounded-xl border border-gray-200">
                            {[
                              { id: 'auto', label: 'تلقائي (الهاتف)' },
                              { id: 'summer', label: 'صيفي (+60د)' },
                              { id: 'winter', label: 'شتوي قياسي' },
                            ].map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelectDstMode(m.id as DstMode)}
                                className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  dstMode === m.id
                                    ? 'bg-[#104B40] text-white shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 4: الإعدادات المتقدمة (Replaces manual adjustments accordion) */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenPrayerSettings) {
                            onOpenPrayerSettings('fajr');
                          }
                        }}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#C5A059]/30 text-[#9E7B34] flex items-center justify-center shrink-0">
                            <SlidersHorizontal className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-gray-900 block">
                              الإعدادات المتقدمة
                            </span>
                            <span className="text-[10.5px] text-gray-500 block">
                              تعديل وقت كل صلاة، صوت الأذان، التذكير، الإقامة، والوضع الصامت
                            </span>
                          </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-gray-400 shrink-0" />
                      </button>
                    </div>

                    {/* Group 5: Global Countries, Regions & Cities Hierarchical Picker + Online Search */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('loc_world')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#104B40]" />
                          <span className="text-xs font-black text-gray-900">
                            قاعدة بيانات دول ومدن ومناطق العالم ({worldCountries.length} دولة وإقليم)
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'loc_world' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'loc_world' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2.5">
                          {/* Step 1 & 2: Country -> Governorate / State */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={selectedCountry}
                              onChange={(e) => {
                                setSelectedCountry(e.target.value);
                                setSelectedState('');
                              }}
                              className="moazen-widget p-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                            >
                              <option value="">🌍 كافة دول العالم ({worldCountries.length} دولة)</option>
                              {worldCountries.map((c) => (
                                <option key={`${c.countryCode}_${c.country}`} value={c.country}>
                                  [{c.countryCode}] {c.country} — {c.countryEn} ({c.cityCount})
                                </option>
                              ))}
                            </select>

                            <select
                              value={selectedState}
                              onChange={(e) => setSelectedState(e.target.value)}
                              disabled={!selectedCountry || worldRegions.length === 0}
                              className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none disabled:opacity-50"
                            >
                              <option value="">
                                {selectedCountry
                                  ? `📍 كافة المناطق/المحافظات (${worldRegions.length})`
                                  : 'اختر الدولة أولاً لعرض المناطق'}
                              </option>
                              {worldRegions.map((reg) => (
                                <option key={reg.state} value={reg.state}>
                                  {reg.state} ({reg.cityCount})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Step 3: Arabic/English Instant Search + Online OpenStreetMap Search */}
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="ابحث بالعربية أو الإنجليزية: مكة، الرياض، القاهرة، حي، قرية..."
                                value={citySearch}
                                onChange={(e) => setCitySearch(e.target.value)}
                                className="moazen-widget w-full pr-8 pl-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#104B40]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleOnlineWorldSearch}
                              disabled={onlineSearching || citySearch.trim().length < 2}
                              className="px-3 py-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${onlineSearching ? 'animate-spin' : ''}`} />
                              <span>بحث عالمي أونلاين</span>
                            </button>
                          </div>

                          {onlineSearchNotice && (
                            <p className="text-[11px] font-bold text-[#104B40] bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                              {onlineSearchNotice}
                            </p>
                          )}

                          {/* Combined Ranked Cities + Discovered Online Results */}
                          <div className="space-y-1 pt-1 max-h-56 overflow-y-auto pr-1">
                            {(onlineSearchResults.length > 0 && citySearch.trim()
                              ? [
                                  ...onlineSearchResults,
                                  ...filteredCities.filter(
                                    (fc) => !onlineSearchResults.some((or) => or.id === fc.id)
                                  ),
                                ]
                              : filteredCities
                            )
                              .slice(0, 120)
                              .map((city) => {
                                const isActive = user.city?.id === city.id;
                                return (
                                  <button
                                    key={city.id}
                                    type="button"
                                    onClick={() => {
                                      const chosenCity: CityLocation = {
                                        id: city.id,
                                        name: city.name,
                                        nameEn: city.nameEn,
                                        country: city.country,
                                        countryEn: city.countryEn,
                                        countryCode: city.countryCode,
                                        state: city.state,
                                        stateEn: city.stateEn,
                                        district: city.district,
                                        neighborhood: city.neighborhood,
                                        street: city.street,
                                        latitude: city.latitude,
                                        longitude: city.longitude,
                                        timezone: city.timezone,
                                        recommendedMethod: city.recommendedMethod,
                                        source: city.source || 'offline',
                                        isSavedLocation: false,
                                      };
                                      applyLocationToApp(
                                        chosenCity,
                                        city.source === 'osm' ? 'بحث عالمي محفوظ' : 'قاعدة بيانات العالم'
                                      );
                                    }}
                                    className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer text-right transition-colors ${
                                      isActive
                                        ? 'bg-[#ebf5f1] border-[#104B40] font-black'
                                        : 'bg-white hover:bg-emerald-50/70 border-gray-100'
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-gray-900">{city.name}</span>
                                        {city.nameEn && (
                                          <span className="text-[10px] text-gray-500 font-sans">
                                            ({city.nameEn})
                                          </span>
                                        )}
                                        {city.source === 'osm' && (
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                            OSM
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-gray-500 block">
                                        {city.country}
                                        {city.state ? ` • ${city.state}` : ''}
                                        {city.district ? ` • ${city.district}` : ''}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono shrink-0 mr-2">
                                      {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 6: Egypt Governorates Selector (Offline) */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('loc_egypt')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          محافظات ومدن ومراكز جمهورية مصر العربية (شامل بدون إنترنت)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'loc_egypt' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'loc_egypt' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={selectedEgyptGovId}
                              onChange={(e) => setSelectedEgyptGovId(e.target.value)}
                              className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                            >
                              {EGYPT_GOVERNORATES_DATA.map((gov) => (
                                <option key={gov.id} value={gov.id}>
                                  {gov.name} ({gov.locations.length} مركز/مدينة)
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              placeholder="ابحث بالاسم: دكرنس، بلقاس، طامية..."
                              value={egyptSearchQuery}
                              onChange={(e) => setEgyptSearchQuery(e.target.value)}
                              className="moazen-widget p-2.5 border border-gray-200 rounded-xl text-xs text-gray-800"
                            />
                          </div>

                          <div className="space-y-1 pt-1 max-h-44 overflow-y-auto pr-1">
                            {filteredEgyptLocations.map((loc) => (
                              <div
                                key={loc.id}
                                onClick={() => {
                                  const newCity: CityLocation = {
                                    id: loc.id,
                                    name: loc.name,
                                    nameEn: loc.nameEn,
                                    country: 'مصر',
                                    countryEn: 'Egypt',
                                    countryCode: 'EG',
                                    state: loc.governorate,
                                    stateEn: loc.governorateEn,
                                    district: loc.type,
                                    latitude: loc.latitude,
                                    longitude: loc.longitude,
                                    timezone: 'Africa/Cairo',
                                    recommendedMethod: 'egypt',
                                    source: 'offline',
                                    isSavedLocation: false,
                                  };
                                  applyLocationToApp(newCity, 'مصر - أوفلاين');
                                }}
                                className="moazen-widget p-2 rounded-xl border border-gray-100 text-xs flex items-center justify-between cursor-pointer"
                              >
                                <div>
                                  <span className="font-bold text-gray-800">{loc.name}</span>
                                  <span className="text-[10px] text-gray-500 mr-2">
                                    ({loc.governorate} • {loc.type})
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Language & Appearance Subpage */}
                {activeWidgetId === 'language_appearance' && (
                  <div className="space-y-2.5">
                    {/* Group 1: Language selection */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('lang_group_1')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          اختر لغة الواجهة من اللغات المعتمدة
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'lang_group_1' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'lang_group_1' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2.5">
                          <button
                            type="button"
                            onClick={handleAutoDetectLanguage}
                            className="w-full bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold py-2 rounded-xl cursor-pointer"
                          >
                            اعتماد لغة الهاتف تلقائياً
                          </button>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {SUPPORTED_LANGUAGES.map((lang) => {
                              const isSelected = currentLang === lang.code;
                              return (
                                <button
                                  key={lang.code}
                                  type="button"
                                  onClick={() => handleSelectLanguage(lang.code)}
                                  className={`p-3 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-50 border-[#104B40] shadow-2xs'
                                      : 'bg-white border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-xl">{lang.flag}</span>
                                    <div>
                                      <span className="text-xs font-black text-gray-900 block">
                                        {lang.nativeName}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-sans">
                                        {lang.name}
                                      </span>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-[#104B40]" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Azan & Iqama Subpage */}
                {activeWidgetId === 'azan_iqama' && (
                  <div className="space-y-2.5">
                    {/* Group 1: General Azan and Sound Switches */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('azan_master')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          تفعيل الأذان التلقائي والأصوات العامة
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'azan_master' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'azan_master' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          {onToggleAutoPlayAzan && (
                            <div className="moazen-widget flex items-center justify-between p-2.5 rounded-xl border border-gray-200">
                              <div>
                                <h4 className="text-xs font-bold text-gray-900">
                                  رفع الأذان كاملاً تلقائياً عند حلول وقت الصلاة
                                </h4>
                                <p className="text-[10px] text-gray-500">
                                  تشغيل صوت الأذان كاملاً في موعده
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={user.autoPlayAzan !== false}
                                onChange={(e) => onToggleAutoPlayAzan(e.target.checked)}
                                className="w-5 h-5 accent-[#104B40] rounded cursor-pointer"
                              />
                            </div>
                          )}

                          {onToggleSoundEnabled && (
                            <div className="moazen-widget flex items-center justify-between p-2.5 rounded-xl border border-gray-200">
                              <div>
                                <h4 className="text-xs font-bold text-gray-900">
                                  تفعيل الأصوات العامة
                                </h4>
                                <p className="text-[10px] text-gray-500">
                                  تفعيل كافة التنبيهات الصوتية
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={user.soundEnabled}
                                onChange={(e) => onToggleSoundEnabled(e.target.checked)}
                                className="w-5 h-5 accent-[#104B40] rounded cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Group 2: Standalone Fajr Azan Voice Selection (3 voices) */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('azan_fajr')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer bg-amber-50/40 hover:bg-amber-50/70"
                      >
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-black text-amber-950">
                            صوت أذان الفجر (قسم مستقل - 3 أصوات مدمجة)
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-amber-700 transition-transform ${
                            expandedGroup === 'azan_fajr' ? 'rotate-180 text-amber-800' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'azan_fajr' && (
                        <div className="p-3.5 bg-white border-t border-amber-200/60 space-y-2">
                          <p className="text-[11px] text-gray-600 mb-2 font-sans">
                            اختر صوت أذان الفجر المخصص؛ يشتمل على نداء «الصلاة خير من النوم» ولا
                            يؤثر على أصوات باقي الصلوات.
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {FAJR_AZAN_VOICES.map((fv) => {
                              const isSelected =
                                (user.fajrAzanVoice || 'abdulbasit_fajr') === fv.id;
                              return (
                                <div
                                  key={fv.id}
                                  onClick={() => handleSelectFajrVoice(fv.id)}
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-amber-50/60 border-amber-500 ring-1 ring-amber-400 font-bold text-[#172A28] shadow-2xs'
                                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? 'border-amber-600 bg-amber-600'
                                          : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="block font-black text-gray-900">
                                        {fv.name}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-normal">
                                        {fv.muezzin} • {fv.location}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAuditionFajrVoice(fv.id);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                                      auditioningFajrVoice === fv.id
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                    }`}
                                  >
                                    {auditioningFajrVoice === fv.id ? (
                                      <>
                                        <Square className="w-3.5 h-3.5 fill-current text-rose-600" />
                                        <span className="text-[10px]">إيقاف</span>
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3.5 h-3.5 fill-current text-[#104B40]" />
                                        <span className="text-[10px]">استماع</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 3: Azan Voices for Remaining Prayers */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('azan_others')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          صوت المؤذن لباقي الصلوات (الظهر، العصر، المغرب، العشاء)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'azan_others' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'azan_others' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                            {AZAN_VOICES.filter((v) => !v.isFajrOnly).map((v) => (
                              <div
                                key={v.id}
                                onClick={() => onUpdateAzanVoice(v.id)}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                  user.azanVoice === v.id
                                    ? 'bg-emerald-50 border-[#104B40] font-bold text-[#172A28]'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                                }`}
                              >
                                <div>
                                  <span className="block font-bold">{v.name}</span>
                                  <span className="text-[10px] text-gray-500 font-normal">
                                    {v.muezzin}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAuditionVoice(v.id);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#172A28] cursor-pointer flex items-center gap-1 font-bold"
                                >
                                  {auditioningVoice === v.id ? (
                                    <>
                                      <Square className="w-3.5 h-3.5 fill-current text-rose-600" />
                                      <span className="text-[10px]">إيقاف</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3.5 h-3.5 fill-current text-[#104B40]" />
                                      <span className="text-[10px]">استماع</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 4: 15-Minute Pre-Prayer Alert */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('azan_preprayer')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#104B40]" />
                          <span className="text-xs font-black text-gray-900">
                            التنبيه الصوتي قبل الصلاة بـ 15 دقيقة
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'azan_preprayer' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'azan_preprayer' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-800">
                              تفعيل التنبيه الصوتي قبل الأذان بـ 15 دقيقة:
                            </span>
                            <input
                              type="checkbox"
                              checked={reminderSettings.prePrayerAlert?.enabled !== false}
                              onChange={(e) => {
                                const val = e.target.checked;
                                handleUpdateReminder((prev) => ({
                                  ...prev,
                                  prePrayerAlert: {
                                    ...prev.prePrayerAlert,
                                    enabled: val,
                                  },
                                }));
                              }}
                              className="w-5 h-5 accent-[#104B40] cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (playingReminderTrack === 'pre_prayer_15m') {
                                  soundService.stopAudio();
                                  setPlayingReminderTrack(null);
                                } else {
                                  setPlayingReminderTrack('pre_prayer_15m');
                                  soundService.playPrePrayerAlert(() =>
                                    setPlayingReminderTrack(null)
                                  );
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                                playingReminderTrack === 'pre_prayer_15m'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-[#104B40] hover:bg-[#0B3D35] text-white'
                              }`}
                            >
                              {playingReminderTrack === 'pre_prayer_15m' ? (
                                <>
                                  <Square className="w-3.5 h-3.5 fill-current" />
                                  <span>إيقاف المقطع</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>استماع للمقطع الصوتي</span>
                                </>
                              )}
                            </button>

                            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-1 rounded-lg">
                              يعمل بدون إنترنت
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 5: Iqama Voices */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('azan_iqama_group')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          أصوات إقامة الصلاة المدمجة
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'azan_iqama_group'
                              ? 'rotate-180 text-[#104B40]'
                              : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'azan_iqama_group' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-1.5">
                          {IQAMA_VOICES.map((iq) => {
                            const isSelected = (user.iqamaVoice || 'iqama_1') === iq.id;
                            return (
                              <div
                                key={iq.id}
                                onClick={() => {
                                  if (onUpdateIqamaVoice) onUpdateIqamaVoice(iq.id);
                                  else if (onUpdateUser)
                                    onUpdateUser((prev) => ({ ...prev, iqamaVoice: iq.id }));
                                }}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-emerald-50 border-[#104B40] font-bold text-[#172A28]'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                                }`}
                              >
                                <div>
                                  <span className="block font-bold">{iq.name}</span>
                                  <span className="text-[10px] text-gray-500 block font-normal">
                                    {iq.muezzin}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAuditionIqama(iq.id);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#172A28] text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  {auditioningIqama === iq.id ? (
                                    <>
                                      <Square className="w-3.5 h-3.5 fill-current text-rose-600" />
                                      <span className="text-[10px]">إيقاف</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3.5 h-3.5 fill-current text-[#104B40]" />
                                      <span className="text-[10px]">استماع</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Group 6: Duha Prayer & Short Dua Audio Files (Integrated Directly) */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs p-3.5 space-y-2.5">
                      <span className="text-xs font-black text-gray-900 block">
                        ملفات صلاة الضحى والدعاء القصير المدمجة
                      </span>

                      <div className="moazen-widget p-2.5 rounded-xl border border-gray-200 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-gray-900 block">
                            ملف صلاة الضحى (سورة الضحى)
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            يعمل تلقائيًا عند دخول وقت صلاة الضحى
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAuditionReminderAudio('duha_surah', DUHA_AUDIO_FILE, 'duha')
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-amber-50 text-[#172A28] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {playingReminderTrack === 'duha_surah' ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-current text-rose-600" />
                              <span className="text-[10px]">إيقاف</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current text-[#C5A059]" />
                              <span className="text-[10px]">استماع</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="moazen-widget p-2.5 rounded-xl border border-gray-200 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-gray-900 block">
                            الدعاء القصير بعد الأذان والصلاة
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            يعمل تلقائيًا بعد انتهاء الأذان عند تفعيله
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAuditionReminderAudio(
                              'dua_after_azan',
                              DUA_AFTER_AZAN_AUDIO_FILE,
                              'dua_after'
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-amber-50 text-[#172A28] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {playingReminderTrack === 'dua_after_azan' ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-current text-rose-600" />
                              <span className="text-[10px]">إيقاف</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current text-[#C5A059]" />
                              <span className="text-[10px]">استماع</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Azkar & Reminders Subpage */}
                {activeWidgetId === 'azkar_reminders' && (
                  <div className="space-y-2.5">
                    {/* Group 1: Morning & Evening Azkar */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('azkar_sabah_massa')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          أذكار الصباح وأذكار المساء (تصل مرة واحدة في موعدها)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'azkar_sabah_massa'
                              ? 'rotate-180 text-[#104B40]'
                              : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'azkar_sabah_massa' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2.5">
                          {/* Morning Azkar */}
                          <div className="moazen-widget rounded-2xl p-3 border border-[#D6C18D] shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4 text-amber-500" />
                                <div>
                                  <h5 className="text-xs font-black text-gray-900">أذكار الصباح المباركة</h5>
                                  <span className="text-[10px] text-gray-500 font-sans">
                                    تصل مرة واحدة يومياً في موعدها المحدد
                                  </span>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={reminderSettings.morningAzkar.enabled}
                                onChange={(e) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    morningAzkar: {
                                      ...prev.morningAzkar,
                                      enabled: e.target.checked,
                                    },
                                  }))
                                }
                                className="w-5 h-5 accent-[#104B40] rounded cursor-pointer"
                              />
                            </div>
                            {reminderSettings.morningAzkar.enabled && (
                              <TimeSliderPicker
                                label="موعد أذكار الصباح"
                                sublabel="حرك المنزلق لضبط الساعة والدقيقة بدقة (الافتراضي 08:00)"
                                value={reminderSettings.morningAzkar.startTime || '08:00'}
                                onChange={(newTime) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    morningAzkar: {
                                      ...prev.morningAzkar,
                                      startTime: newTime,
                                    },
                                  }))
                                }
                              />
                            )}
                          </div>

                          {/* Evening Azkar */}
                          <div className="moazen-widget rounded-2xl p-3 border border-[#D6C18D] shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4 text-[#104B40]" />
                                <div>
                                  <h5 className="text-xs font-black text-gray-900">أذكار المساء المباركة</h5>
                                  <span className="text-[10px] text-gray-500 font-sans">
                                    تصل مرة واحدة يومياً في موعدها المحدد
                                  </span>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={reminderSettings.eveningAzkar.enabled}
                                onChange={(e) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    eveningAzkar: {
                                      ...prev.eveningAzkar,
                                      enabled: e.target.checked,
                                    },
                                  }))
                                }
                                className="w-5 h-5 accent-[#104B40] rounded cursor-pointer"
                              />
                            </div>
                            {reminderSettings.eveningAzkar.enabled && (
                              <TimeSliderPicker
                                label="موعد أذكار المساء"
                                sublabel="حرك المنزلق لضبط الساعة والدقيقة بدقة (الافتراضي 21:00)"
                                value={reminderSettings.eveningAzkar.startTime || '21:00'}
                                onChange={(newTime) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    eveningAzkar: {
                                      ...prev.eveningAzkar,
                                      startTime: newTime,
                                    },
                                  }))
                                }
                              />
                            )}
                          </div>

                          {/* Independent Azkar Volume Control */}
                          <div className="moazen-widget rounded-2xl p-3 border border-[#D6C18D] shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-[#104B40]" />
                                <div>
                                  <h5 className="text-xs font-black text-gray-900">
                                    مستوى صوت أذكار الصباح والمساء (مستقل)
                                  </h5>
                                  <span className="text-[10px] text-gray-500 block">
                                    لا يؤثر على مستوى صوت الأذان أو الصلاة على النبي ﷺ
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-black font-mono text-[#104B40] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                {reminderSettings.azkarVolumePercent ??
                                  reminderSettings.morningAzkar.volumePercent ??
                                  100}
                                %
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={
                                reminderSettings.azkarVolumePercent ??
                                reminderSettings.morningAzkar.volumePercent ??
                                100
                              }
                              onChange={(e) => {
                                const vol = Number(e.target.value);
                                handleUpdateReminder((prev) => ({
                                  ...prev,
                                  azkarVolumePercent: vol,
                                  morningAzkar: { ...prev.morningAzkar, volumePercent: vol },
                                  eveningAzkar: { ...prev.eveningAzkar, volumePercent: vol },
                                }));
                              }}
                              className="w-full accent-[#104B40] cursor-pointer"
                            />
                          </div>

                          {/* Read-Only Morning & Evening Azkar Preview Card */}
                          <div className="moazen-widget rounded-2xl p-3 border border-[#C5A059]/45 shadow-2xs space-y-2.5">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#104B40]" />
                              <div>
                                <h5 className="text-xs font-black text-[#104B40]">
                                  معاينة نصوص الأذكار داخل الإعدادات
                                </h5>
                                <span className="text-[10px] text-[#4B5B58] block font-sans">
                                  تصفح أذكار الصباح والمساء كاملة مع عدد التكرارات والفضل (للقراءة فقط دون تغيير العداد)
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setAzkarPreviewCategory('sabah')}
                                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#104B40] to-[#175F50] hover:from-[#0C3E34] hover:to-[#135144] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer border border-[#C5A059]/50"
                              >
                                <Sun className="w-3.5 h-3.5 text-amber-300" />
                                <span>معاينة أذكار الصباح</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAzkarPreviewCategory('masaa')}
                                className="w-full py-2.5 px-3 rounded-xl bg-[#FAF6EA] hover:bg-[#F3ECD6] text-[#104B40] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer border border-[#C5A059]/65"
                              >
                                <Moon className="w-3.5 h-3.5 text-[#9A7732]" />
                                <span>معاينة أذكار المساء</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 2: Salawat on the Prophet ﷺ (Fixed and Comprehensive) */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('azkar_salawat')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-black text-gray-900 truncate">
                            تذكير الصلاة على النبي ﷺ (تكرار دوري أو موعد يومي)
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              reminderSettings.salawat.enabled
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {reminderSettings.salawat.enabled
                              ? reminderSettings.salawat.repeatType === 'once'
                                ? `يومياً ${reminderSettings.salawat.startTime || '08:00'}`
                                : `كل ${reminderSettings.salawat.repeatInterval} ${
                                    reminderSettings.salawat.repeatUnit === 'hours'
                                      ? 'ساعة'
                                      : 'دقيقة'
                                  }`
                              : 'معطّل'}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'azkar_salawat' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'azkar_salawat' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-3.5">
                          {/* 1. Master Toggle */}
                          <div className="moazen-widget flex items-center justify-between pb-2 border-b border-gray-200/80 p-2.5 rounded-xl border">
                            <div>
                              <span className="text-xs font-bold text-gray-900 block">
                                تفعيل التذكير الصوتي بالصلاة على النبي ﷺ
                              </span>
                              <span className="text-[10px] text-gray-500 font-sans block">
                                يعمل في الخلفية بصوت هادئ وإشعار قياسي دون إيقاظ شاشة الهاتف
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={reminderSettings.salawat.enabled}
                              onChange={(e) =>
                                handleUpdateReminder((prev) => ({
                                  ...prev,
                                  salawat: { ...prev.salawat, enabled: e.target.checked },
                                }))
                              }
                              className="w-5 h-5 accent-[#104B40] rounded cursor-pointer"
                            />
                          </div>

                          {/* 2. Mode Selector: Once Daily vs Periodic Repeating */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-700 block">
                              نمط التذكير:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    salawat: { ...prev.salawat, repeatType: 'repeat' },
                                  }))
                                }
                                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                  reminderSettings.salawat.repeatType !== 'once'
                                    ? 'bg-emerald-50/80 border-[#104B40] text-[#104B40] ring-1 ring-[#104B40]'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <span>تكرار دوري مستمر</span>
                                <span className="text-[10px] font-normal opacity-80">
                                  كل فترة زمنية (دقيقة / ساعة)
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    salawat: { ...prev.salawat, repeatType: 'once' },
                                  }))
                                }
                                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                  reminderSettings.salawat.repeatType === 'once'
                                    ? 'bg-emerald-50/80 border-[#104B40] text-[#104B40] ring-1 ring-[#104B40]'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <span>موعد يومي محدد</span>
                                <span className="text-[10px] font-normal opacity-80">
                                  مرة واحدة يومياً في ساعة ثابتة
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* 3. Time Pickers based on chosen mode */}
                          {reminderSettings.salawat.repeatType === 'once' ? (
                            /* Mode: Once Daily Fixed Time */
                            <TimeSliderPicker
                              label="موعد التنبيه اليومي الثابت بالصلاة على النبي ﷺ"
                              sublabel="حرك المنزلق لاختيار الساعة والدقيقة (تنبيه هادئ بالخلفية)"
                              value={reminderSettings.salawat.startTime || '08:00'}
                              onChange={(newTime) =>
                                handleUpdateReminder((prev) => ({
                                  ...prev,
                                  salawat: {
                                    ...prev.salawat,
                                    startTime: newTime,
                                  },
                                }))
                              }
                            />
                          ) : (
                            /* Mode: Periodic Repeating */
                            <div className="space-y-3">
                              {/* Interval config */}
                              <div className="moazen-widget p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-gray-900 block">
                                    تكرار التذكير كل:
                                  </span>
                                  <span className="text-[10px] text-gray-500 block">
                                    حدد الفارق الزمني بين كل تذكير
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={salawatIntervalInput}
                                    onChange={(e) => {
                                      const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                                      setSalawatIntervalInput(digits);
                                      if (digits !== '') {
                                        const parsed = parseInt(digits, 10);
                                        if (parsed >= 1) {
                                          const clamped = Math.min(240, parsed);
                                          handleUpdateReminder((prev) => ({
                                            ...prev,
                                            salawat: {
                                              ...prev.salawat,
                                              repeatInterval: clamped,
                                            },
                                          }));
                                        }
                                      }
                                    }}
                                    onBlur={() => {
                                      const parsed = parseInt(salawatIntervalInput, 10);
                                      const clamped = isNaN(parsed) || parsed < 1 ? 15 : Math.min(240, parsed);
                                      setSalawatIntervalInput(String(clamped));
                                      handleUpdateReminder((prev) => ({
                                        ...prev,
                                        salawat: {
                                          ...prev.salawat,
                                          repeatInterval: clamped,
                                        },
                                      }));
                                    }}
                                    className="w-16 bg-white/85 border border-[#C5A059]/45 rounded-lg px-2 py-1.5 text-xs font-bold text-center font-mono text-[#104B40]"
                                  />
                                  <select
                                    value={reminderSettings.salawat.repeatUnit || 'minutes'}
                                    onChange={(e) =>
                                      handleUpdateReminder((prev) => ({
                                        ...prev,
                                        salawat: {
                                          ...prev.salawat,
                                          repeatUnit: e.target.value as RepeatUnit,
                                        },
                                      }))
                                    }
                                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                                  >
                                    <option value="minutes">دقيقة</option>
                                    <option value="hours">ساعة</option>
                                  </select>
                                </div>
                              </div>

                              {/* Auto Start After Fajr Iqama -> 00:00 Midnight Toggle */}
                              {(() => {
                                const autoMode = reminderSettings.salawat.autoAfterFajrIqama !== false;
                                const previewWin = computeSalawatWindowForDate(
                                  new Date(),
                                  reminderSettings.salawat,
                                  user.city,
                                  user
                                );
                                return (
                                  <div className="space-y-3">
                                    <div className="moazen-widget p-3 rounded-xl border border-[#D6C18D] space-y-1.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <div>
                                          <span className="text-xs font-bold text-[#104B40] block">
                                            بدء تلقائي بعد إقامة الفجر وحتى منتصف الليل (00:00)
                                          </span>
                                          <span className="text-[10px] text-gray-600 block">
                                            يبدأ تلقائياً بعد انتهاء إقامة صلاة الفجر مباشرة ويستمر حتى 00:00
                                          </span>
                                        </div>
                                        <input
                                          type="checkbox"
                                          checked={autoMode}
                                          onChange={(e) =>
                                            handleUpdateReminder((prev) => ({
                                              ...prev,
                                              salawat: {
                                                ...prev.salawat,
                                                autoAfterFajrIqama: e.target.checked,
                                                endTime: '23:59',
                                              },
                                            }))
                                          }
                                          className="w-5 h-5 accent-[#104B40] rounded cursor-pointer shrink-0"
                                        />
                                      </div>
                                      <p className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                                        {autoMode
                                          ? `النافذة النشطة اليوم تلقائياً: من ${previewWin.startTimeStr} (بعد إقامة الفجر) حتى 00:00 منتصف الليل`
                                          : `النافذة اليدوية اليوم: من ${previewWin.startTimeStr} حتى ${previewWin.endTimeStr}`}
                                      </p>
                                    </div>

                                    {!autoMode && (
                                      <>
                                        <TimeSliderPicker
                                          label="يبدأ التذكير الدوري من الساعة (يدوي)"
                                          sublabel="بداية نافذة التذكيرات اليومية"
                                          value={reminderSettings.salawat.startTime || '06:00'}
                                          onChange={(newTime) =>
                                            handleUpdateReminder((prev) => ({
                                              ...prev,
                                              salawat: {
                                                ...prev.salawat,
                                                startTime: newTime,
                                              },
                                            }))
                                          }
                                        />

                                        <TimeSliderPicker
                                          label="ينتهي التذكير الدوري عند الساعة (يدوي)"
                                          sublabel="نهاية نافذة التذكيرات اليومية (الافتراضي 23:59 قبل منتصف الليل)"
                                          value={reminderSettings.salawat.endTime || '23:59'}
                                          onChange={(newTime) =>
                                            handleUpdateReminder((prev) => ({
                                              ...prev,
                                              salawat: {
                                                ...prev.salawat,
                                                endTime: newTime,
                                              },
                                            }))
                                          }
                                        />
                                      </>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Independent Salawat Volume Slider */}
                          <div className="moazen-widget rounded-2xl p-3 border border-[#D6C18D] shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-[#104B40]" />
                                <div>
                                  <h5 className="text-xs font-black text-gray-900">
                                    مستوى صوت الصلاة على النبي ﷺ (مستقل)
                                  </h5>
                                  <span className="text-[10px] text-gray-500 block">
                                    مستقل تماماً عن صوت الأذان والأذكار
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-black font-mono text-[#104B40] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                {reminderSettings.salawat.volumePercent ?? 85}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={reminderSettings.salawat.volumePercent ?? 85}
                              onChange={(e) => {
                                const vol = Number(e.target.value);
                                handleUpdateReminder((prev) => ({
                                  ...prev,
                                  salawat: { ...prev.salawat, volumePercent: vol },
                                }));
                              }}
                              className="w-full accent-[#104B40] cursor-pointer"
                            />
                          </div>

                          {/* 4. Audio Selection (Fixed ID/Path match & Clean cards) */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[11px] font-bold text-gray-700 block">
                              صيغة التسجيل الصوتي للصلاة على النبي ﷺ:
                            </label>
                            {SALAWAT_AUDIO_OPTIONS.map((opt) => {
                              const isSelected =
                                reminderSettings.salawat.audioFile === opt.id ||
                                reminderSettings.salawat.audioFile === opt.filePath;
                              return (
                                <div
                                  key={opt.id}
                                  onClick={() =>
                                    handleUpdateReminder((prev) => ({
                                      ...prev,
                                      salawat: { ...prev.salawat, audioFile: opt.id },
                                    }))
                                  }
                                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-emerald-50/80 border-[#104B40] font-bold text-[#104B40] ring-1 ring-[#104B40]'
                                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? 'border-[#104B40] bg-[#104B40]'
                                          : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block font-black text-gray-900 truncate">
                                        {opt.title}
                                      </span>
                                      <span className="text-[10px] text-gray-500 block truncate font-sans">
                                        {opt.description}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAuditionReminderAudio(opt.id, opt.filePath, 'salawat');
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                      playingReminderTrack === opt.id
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                    }`}
                                  >
                                    {playingReminderTrack === opt.id ? (
                                      <>
                                        <Square className="w-3.5 h-3.5 text-rose-600 fill-current" />
                                        <span className="text-[10px]">إيقاف</span>
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3.5 h-3.5 text-[#104B40] fill-current" />
                                        <span className="text-[10px]">استماع</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 3: Qiyam al-Layl */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('azkar_qiyam')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          قيام الليل وحساب أثلاث الليل الشرعية
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'azkar_qiyam' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'azkar_qiyam' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2.5">
                          {/* Grid */}
                          <div className="moazen-widget grid grid-cols-3 gap-1.5 text-center p-2 rounded-xl border border-gray-200">
                            <div>
                              <span className="text-[9px] font-bold text-gray-500 block">
                                الثلث الأول
                              </span>
                              <span className="text-xs font-black text-indigo-800 font-sans block mt-0.5">
                                {nightThirds.firstThirdEndFormatted}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-gray-500 block">
                                منتصف الليل
                              </span>
                              <span className="text-xs font-black text-[#104B40] font-sans block mt-0.5">
                                {nightThirds.midnightFormatted}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-amber-800 block">
                                الثلث الأخير
                              </span>
                              <span className="text-xs font-black text-amber-700 font-sans block mt-0.5">
                                {nightThirds.lastThirdStartFormatted}
                              </span>
                            </div>
                          </div>

                          {/* First Third */}
                          <div className="moazen-widget p-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">
                              تنبيه الثلث الأول (سورة المزمل)
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (playingReminderTrack === 'qiyam_first_third') {
                                    soundService.stopAudio();
                                    setPlayingReminderTrack(null);
                                  } else {
                                    setPlayingReminderTrack('qiyam_first_third');
                                    soundService.playQiyamFirstThird(() =>
                                      setPlayingReminderTrack(null)
                                    );
                                  }
                                }}
                                className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold"
                              >
                                {playingReminderTrack === 'qiyam_first_third' ? 'إيقاف' : 'معاينة'}
                              </button>
                              <input
                                type="checkbox"
                                checked={reminderSettings.qiyam?.firstThirdEnabled !== false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    qiyam: { ...prev.qiyam, firstThirdEnabled: checked },
                                  }));
                                }}
                                className="w-4 h-4 accent-[#104B40]"
                              />
                            </div>
                          </div>

                          {/* Last Third */}
                          <div className="moazen-widget p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-950">
                              تنبيه الثلث الأخير والأسحار
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (playingReminderTrack === 'qiyam_last_third') {
                                    soundService.stopAudio();
                                    setPlayingReminderTrack(null);
                                  } else {
                                    setPlayingReminderTrack('qiyam_last_third');
                                    soundService.playQiyamLastThird(() =>
                                      setPlayingReminderTrack(null)
                                    );
                                  }
                                }}
                                className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-xs font-bold text-amber-900"
                              >
                                {playingReminderTrack === 'qiyam_last_third' ? 'إيقاف' : 'معاينة'}
                              </button>
                              <input
                                type="checkbox"
                                checked={reminderSettings.qiyam?.lastThirdEnabled !== false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    qiyam: { ...prev.qiyam, lastThirdEnabled: checked },
                                  }));
                                }}
                                className="w-4 h-4 accent-amber-700"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ruqyah moved to RuqyahModal */}
                  </div>
                )}

                {/* 7. Ramadan & Fasting Subpage */}
                {activeWidgetId === 'ramadan_fasting' && (
                  <div className="space-y-2.5">
                    {/* Group 1: Iftar & Cannon */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('ramadan_iftar')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          موعد الإفطار وتنبيه مدفع الإفطار
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'ramadan_iftar' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'ramadan_iftar' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <div className="moazen-widget rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                            <div>
                              <h5 className="text-xs font-bold text-gray-900">
                                تنبيه الإفطار (المغرب: {iftarTimeFormatted})
                              </h5>
                            </div>
                            <input
                              type="checkbox"
                              checked={reminderSettings.iftarReminder?.enabled ?? true}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                handleUpdateReminder((prev) => ({
                                  ...prev,
                                  iftarReminder: {
                                    ...(prev.iftarReminder || { enabled: true }),
                                    enabled: checked,
                                  },
                                }));
                              }}
                              className="w-4 h-4 accent-[#104B40]"
                            />
                          </div>

                          <div className="moazen-widget rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                            <div>
                              <h5 className="text-xs font-bold text-gray-900">
                                صوت مدفع الإفطار (قبل المغرب بـ 16 ثانية)
                              </h5>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAuditionReminderAudio(
                                    'iftar_cannon_1',
                                    '/audio/iftar_cannon.mp3',
                                    'cannon'
                                  )
                                }
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#104B40]"
                              >
                                {playingReminderTrack === 'iftar_cannon_1'
                                  ? 'إيقاف'
                                  : 'تجربة الصوت'}
                              </button>
                              <input
                                type="checkbox"
                                checked={reminderSettings.iftarCannon.enabled}
                                onChange={(e) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    iftarCannon: { ...prev.iftarCannon, enabled: e.target.checked },
                                  }))
                                }
                                className="w-4 h-4 accent-[#104B40]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 2: Suhur & Musaharati */}
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('ramadan_suhur')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          موعد الإمساك وصوت المسحراتي
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'ramadan_suhur' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'ramadan_suhur' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <div className="moazen-widget rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                            <div>
                              <h5 className="text-xs font-bold text-gray-900">
                                تنبيه الإمساك قبل الفجر ({imsakTimeFormatted})
                              </h5>
                            </div>
                            <select
                              value={imsakLeadMins}
                              onChange={(e) =>
                                handleUpdateReminder((prev) => ({
                                  ...prev,
                                  imsakReminder: {
                                    ...(prev.imsakReminder || {
                                      enabled: true,
                                      minutesBeforeFajr: 10,
                                    }),
                                    minutesBeforeFajr: Number(e.target.value) || 10,
                                  },
                                }))
                              }
                              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold"
                            >
                              <option value={5}>5 دقائق</option>
                              <option value={10}>10 دقائق</option>
                              <option value={15}>15 دقيقة</option>
                              <option value={20}>20 دقيقة</option>
                            </select>
                          </div>

                          <div className="moazen-widget rounded-2xl p-3.5 border border-[#D6C18D] shadow-2xs space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                              <div>
                                <h5 className="text-xs font-black text-gray-900">صوت ونداء المسحراتي</h5>
                                <span className="text-[10px] text-gray-500 font-sans block">
                                  إيقاظ رمضاني عذب بالدف والتسبيح قبل الإمساك
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={reminderSettings.musaharati.enabled}
                                onChange={(e) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    musaharati: { ...prev.musaharati, enabled: e.target.checked },
                                  }))
                                }
                                className="w-5 h-5 accent-[#104B40] rounded cursor-pointer"
                              />
                            </div>
                            {reminderSettings.musaharati.enabled && (
                              <TimeSliderPicker
                                label="موعد نداء المسحراتي"
                                sublabel="حرك المنزلق لضبط وقت إيقاظ السحور"
                                value={reminderSettings.musaharati.time || '03:30'}
                                onChange={(newTime) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    musaharati: { ...prev.musaharati, time: newTime },
                                  }))
                                }
                              />
                            )}

                            {/* Musaharati Audio Preview & Explicit Save Selection */}
                            <div className="pt-2 border-t border-gray-100 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-[#104B40]">
                                  معاينة واختيار نغمة المسحراتي:
                                </span>
                                <span className="text-[10px] text-[#4B5B58] font-sans">
                                  استمع قبل الاعتماد
                                </span>
                              </div>

                              <div className="space-y-2">
                                {MUSAHARATI_AUDIO_OPTIONS.map((opt) => {
                                  const isPendingSelected = pendingMusaharatiAudio === opt.id;
                                  const isCommitted = savedMusaharatiAudio === opt.id;
                                  const isThisPlaying =
                                    musaharatiPreviewId === opt.id && musaharatiPreviewState === 'playing';
                                  const isThisPaused =
                                    musaharatiPreviewId === opt.id && musaharatiPreviewState === 'paused';
                                  const durLabel = musaharatiDurations[opt.id];

                                  return (
                                    <div
                                      key={opt.id}
                                      onClick={() => setPendingMusaharatiAudio(opt.id)}
                                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                                        isPendingSelected
                                          ? 'bg-emerald-50/85 border-[#104B40] ring-1 ring-[#104B40]'
                                          : 'bg-white/90 border-gray-200 hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                          <div
                                            className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                                              isPendingSelected
                                                ? 'border-[#104B40] bg-[#104B40]'
                                                : 'border-gray-300 bg-white'
                                            }`}
                                          >
                                            {isPendingSelected && (
                                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-black text-[#172A28]">
                                                {opt.title}
                                              </span>
                                              {isCommitted && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#104B40]">
                                                  المعتمد حالياً
                                                </span>
                                              )}
                                              {durLabel && durLabel !== '--:--' && (
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#FAF6EA] border border-[#C5A059]/45 text-[#9A7732]">
                                                  {durLabel}
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[10px] text-[#4B5B58] block mt-0.5 font-sans">
                                              {opt.description}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Play / Pause / Stop Controls */}
                                      <div
                                        className="flex items-center justify-end gap-1.5 pt-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleMusaharatiPlayPause(opt.id, opt.filePath)}
                                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                            isThisPlaying
                                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                              : isThisPaused
                                              ? 'bg-emerald-100 text-[#104B40] border border-emerald-300'
                                              : 'bg-gray-100 hover:bg-gray-200 text-[#104B40]'
                                          }`}
                                        >
                                          {isThisPlaying ? (
                                            <>
                                              <Pause className="w-3.5 h-3.5 fill-current" />
                                              <span>إيقاف مؤقت</span>
                                            </>
                                          ) : isThisPaused ? (
                                            <>
                                              <Play className="w-3.5 h-3.5 fill-current" />
                                              <span>متابعة</span>
                                            </>
                                          ) : (
                                            <>
                                              <Play className="w-3.5 h-3.5 fill-current" />
                                              <span>تشغيل</span>
                                            </>
                                          )}
                                        </button>

                                        {(isThisPlaying || isThisPaused) && (
                                          <button
                                            type="button"
                                            onClick={handleStopMusaharatiPreview}
                                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer transition-colors"
                                          >
                                            <Square className="w-3 h-3 fill-current" />
                                            <span>إيقاف</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <button
                                type="button"
                                onClick={handleSaveMusaharatiSelection}
                                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                  pendingMusaharatiAudio !== savedMusaharatiAudio
                                    ? 'bg-[#104B40] hover:bg-[#0D3D34] text-white shadow-sm'
                                    : 'bg-[#FAF6EA] hover:bg-[#F3ECD6] text-[#104B40] border border-[#C5A059]/60'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>
                                  {pendingMusaharatiAudio !== savedMusaharatiAudio
                                    ? 'حفظ واعتماد الصوت المختار للمسحراتي'
                                    : 'تم اعتماد هذا الصوت للمسحراتي ✓'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 8. Privacy Policy Subpage */}
                {activeWidgetId === 'privacy_policy' && (
                  <div className="space-y-2.5">
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('privacy_terms')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          سياسة الخصوصية وحماية بياناتك (100% Offline)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'privacy_terms' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'privacy_terms' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                            يعمل تطبيق مسلم بلس بمنهجية العمل المحلي أولاً (Offline-First) بدون حسابات
                            تسجيل أو إعلانات أو شبكات تتبع أو بيع للبيانات:
                          </p>
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            • تُحسب مواقيت الصلاة واتجاه القبلة والأذكار والتسبيحات وتُحفظ محلياً داخل جهازك.
                            <br />• الموقع الجغرافي (GPS أو البحث عن مدينة): يُرسل فقط عند طلبك عبر HTTPS إلى OpenStreetMap Nominatim لتحويل الإحداثيات إلى اسم مدينة.
                            <br />• معلم القرآن «شيخي» والميكروفون: لا يُسجّل ولا يُرفع الصوت إلا عند ضغطك على زر التسميع للمراجعة القرآنية.
                            <br />• البث والخلفيات: التلاوات (mp3quran.net / everyayah.com) والخلفيات (Wikimedia / Pexels) تُحمّل عبر HTTPS عند استخدامها أونلاين فقط.
                          </p>
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-[#104B40] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#104B40]" />
                            <span>خالٍ تماماً من الإعلانات وأدوات التتبع</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 9. About App Subpage (حول التطبيق) */}
                {activeWidgetId === 'about_app' && (
                  <div className="space-y-2.5">
                    <div className="moazen-widget rounded-2xl p-4 border border-[#C5A059]/40 shadow-2xs space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-[#0B1412] border-2 border-[#C5A059]/65 overflow-hidden shrink-0">
                          <img
                            src="/assets/aistudio/1794629416999_a48d32bb.jpg"
                            alt="حول التطبيق"
                            className="w-full h-full object-cover object-center block"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#104B40]">
                            تطبيق مسلم بلس
                          </h4>
                          <p className="text-xs font-bold text-[#9A7732] mt-0.5">
                            الإصدار 2.2.0 • صدقة جارية خالصة لوجه الله تعالى
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        رفيق المسلم اليومي الشامل في كل مكان بالعالم؛ يجمع بين دقة مواقيت الصلاة الفلكية،
                        الأذان التلقائي، القرآن الكريم بالتفسير الميسر، معلم القرآن الذكي «شيخي» للتسميع
                        والحفظ، حصن المسلم، البوصلة، ومكتبة الخلفيات والأذكار الإسلامية بدون إعلانات.
                      </p>
                    </div>

                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('about_sources')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          المصادر العلمية والشرعية المعتمدة
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'about_sources' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'about_sources' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-1.5 text-xs text-gray-700">
                          <p>
                            • القرآن الكريم برواية حفص عن عاصم (مجمع الملك فهد لطباعة المصحف الشريف)
                          </p>
                          <p>• التفسير الميسر كاملاً (مجمع الملك فهد لطباعة المصحف الشريف)</p>
                          <p>• صحيح البخاري، صحيح مسلم، والأربعون النووية للإمام النووي</p>
                          <p>
                            • حصن المسلم من أذكار الكتاب والسنة للشيخ سعيد بن علي بن وهف القحطاني
                          </p>
                          <p>• الحسابات الفلكية لمواقيت الصلاة (أم القرى، الهيئة المصرية، رابطة العالم الإسلامي، ISNA)</p>
                        </div>
                      )}
                    </div>

                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('about_features')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          أبرز قدرات ومزايا التطبيق
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'about_features' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'about_features' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-1.5 text-xs text-gray-700">
                          <p>• قاعدة بيانات شاملة تضم أكثر من 205 دول ومئات المحافظات والمدن حول العالم</p>
                          <p>• تحديد موقع هجين (GPS + شبكة + عنوان تفصيلي) وحفظ آخر موقع موثوق</p>
                          <p>• إعدادات مستقلة لكل صلاة (تعديل الوقت بالدقائق، صوت المؤذن، التذكير قبل الأذان، والإقامة)</p>
                          <p>• نظام التسميع والحفظ الذكي «شيخي» مع لوحة إحصائيات متقدمة</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 10. Logout & Reset Subpage */}
                {activeWidgetId === 'about_reset' && (
                  <div className="space-y-2.5">
                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('reset_sources')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          المصادر العلمية والشرعية المعتمدة
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'reset_sources' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'reset_sources' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-1.5 text-xs text-gray-700">
                          <p>
                            • القرآن الكريم برواية حفص عن عاصم (مجمع الملك فهد لطباعة المصحف
                            الشريف)
                          </p>
                          <p>• التفسير الميسر كاملاً (مجمع الملك فهد لطباعة المصحف الشريف)</p>
                          <p>• صحيح البخاري، صحيح مسلم، والأربعون النووية للإمام النووي</p>
                          <p>
                            • حصن المسلم من أذكار الكتاب والسنة للشيخ سعيد بن علي بن وهف القحطاني
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="moazen-widget rounded-2xl border border-[#D6C18D] overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('reset_action')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-rose-700">
                          تسجيل الخروج وإعادة ضبط التطبيق إلى حالته الأولى
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-rose-700 transition-transform ${
                            expandedGroup === 'reset_action' ? 'rotate-180 text-rose-700' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'reset_action' && (
                        <div className="p-3.5 bg-[#FAF4E4]/75 border-t border-[#D6C18D]/50 space-y-2">
                          <p className="text-xs text-gray-600">
                            سيؤدي هذا الإجراء إلى مسح التخصيصات والعودة إلى شاشة الإعداد الأولية
                            للتطبيق.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              soundService.stopAudio();
                              resetFirstRunPermissionsState();
                              resetAllFirstTimeOnboardingFlags();
                              reminderScheduler.setCompletedFirstTimeSetup(false);
                              if (onLogoutReset) onLogoutReset();
                              else onClose();
                            }}
                            className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>تأكيد إعادة الضبط والخروج</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Save Feedback Banner if triggered */}
                {saveStatusBanner && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm border ${
                      saveStatusBanner.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-rose-50 text-rose-900 border-rose-300'
                    }`}
                  >
                    {saveStatusBanner.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                    )}
                    <span>{saveStatusBanner.message}</span>
                  </div>
                )}

                {/* Explicit "حفظ التعديلات" (Save Changes) Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveCurrentSection(activeWidgetId)}
                    className="moazen-widget w-full py-3.5 px-4 rounded-2xl text-[#104B40] font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-[#D6C18D] hover:border-[#C5A059]"
                  >
                    <Save className="w-4 h-4 text-[#9A7732]" />
                    <span>{t.saveChangesInSectionLabel(currentActiveWidget?.title || t.settingsTitle)}</span>
                  </button>
                </div>

                {/* Back to Overview button at bottom of subpage */}
                <button
                  type="button"
                  onClick={() => {
                    soundService.stopAudio();
                    setMusaharatiPreviewId(null);
                    setMusaharatiPreviewState('idle');
                    setActiveWidgetId(null);
                    setExpandedGroup(null);
                  }}
                  className="moazen-widget w-full py-3 text-[#104B40] rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all border border-[#D6C18D] hover:border-[#C5A059] active:scale-[0.98]"
                >
                  {isRtl ? (
                    <ChevronRight className="w-4 h-4 text-[#104B40]" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-[#104B40]" />
                  )}
                  <span>{t.backToAllSettingsLabel}</span>
                </button>
              </div>
            )}
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Read-Only Morning / Evening Azkar Preview Modal (zero counter/reminder side-effects) */}
      {azkarPreviewCategory && (
        <div
          className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          dir="rtl"
          onClick={() => setAzkarPreviewCategory(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[86dvh] bg-[#FAF6EA] rounded-3xl border-2 border-[#C5A059]/75 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#0B4D36] via-[#104B40] to-[#0B4D36] text-white flex items-center justify-between shrink-0 border-b border-[#C5A059]/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/15 border border-[#C5A059]/60 flex items-center justify-center shrink-0">
                  {azkarPreviewCategory === 'sabah' ? (
                    <Sun className="w-4 h-4 text-amber-300" />
                  ) : (
                    <Moon className="w-4 h-4 text-amber-200" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black truncate">
                    {azkarPreviewCategory === 'sabah'
                      ? 'معاينة أذكار الصباح المباركة'
                      : 'معاينة أذكار المساء المباركة'}
                  </h3>
                  <span className="text-[10px] text-amber-100/90 block font-sans">
                    وضع القراءة والمعاينة فقط • {previewAzkarItems.length} ذكراً
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAzkarPreviewCategory(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="إغلاق المعاينة"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Read-Only Notice */}
            <div className="px-4 py-2 bg-[#F3ECD6] border-b border-[#C5A059]/35 text-[11px] font-bold text-[#104B40] flex items-center gap-1.5 shrink-0">
              <Eye className="w-3.5 h-3.5 text-[#9A7732] shrink-0" />
              <span>هذه المعاينة للعرض والقراءة فقط ولا تؤثر على عدّاد الأذكار أو أوقات التذكير.</span>
            </div>

            {/* Azkar Cards List */}
            <div className="flex-1 overflow-y-auto smooth-scroll-container p-3 sm:p-4 space-y-3 bg-gradient-to-b from-[#FAF6EA] to-[#EFE8CE]/70">
              {previewAzkarItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="moazen-widget rounded-2xl p-4 border border-[#C5A059]/45 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#C5A059]/25">
                    <span className="text-[11px] font-black text-[#104B40]">
                      ذكر رقم {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#104B40] text-amber-100 border border-[#C5A059]/40">
                      التكرار: {item.count} {item.count === 1 ? 'مرة' : item.count <= 10 ? 'مرات' : 'مرة'}
                    </span>
                  </div>

                  <p className="text-lg sm:text-xl font-quran leading-loose font-bold text-[#172A28] select-text">
                    {item.text}
                  </p>

                  {item.fadl && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-[11px] sm:text-xs text-[#104B40] leading-relaxed font-semibold">
                      <span className="font-black text-[#0B4D36]">الفضل: </span>
                      {item.fadl}
                    </div>
                  )}

                  {item.source && (
                    <div className="text-[10px] text-[#4B5B58] font-sans">
                      المصدر: {item.source}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Close */}
            <div className="p-3 bg-[#FAF6EA] border-t border-[#C5A059]/35 shrink-0">
              <button
                type="button"
                onClick={() => setAzkarPreviewCategory(null)}
                className="w-full py-2.5 rounded-xl bg-[#104B40] hover:bg-[#0D3D34] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Full Permissions Management Page */}
      <PermissionsModal
        isOpen={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
        onUpdateCity={onUpdateCity}
      />
    </>
  );
};
