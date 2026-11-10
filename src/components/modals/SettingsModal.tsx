import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  MapPin,
  Compass,
  Volume2,
  Play,
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
} from 'lucide-react';
import {
  CALCULATION_METHODS,
  ASR_METHODS,
  calculatePrayerTimes,
  calculateNightThirds,
  detectDaylightSavingStatus,
  getSavedDstMode,
  setSavedDstMode,
} from '../../utils/prayerTimes';
import {
  searchWorldCities,
  getWorldCountries,
  detectSmartGpsLocation,
  savePersistentLocation,
  resetAllFirstTimeOnboardingFlags,
} from '../../data/worldCitiesData';
import { EGYPT_GOVERNORATES_DATA } from '../../data/egyptLocationsData';
import { PermissionsModal, resetFirstRunPermissionsState } from './PermissionsModal';
import {
  isSmartAzanWidgetEnabled,
  setSmartAzanWidgetEnabled,
} from './SmartAzanIqamaWidget';
import { CityLocation, DstMode, PrayerKey, UserProfile } from '../../types';
import {
  AZAN_VOICES,
  FAJR_AZAN_VOICES,
  IQAMA_VOICES,
  soundService,
  SALAWAT_AUDIO_OPTIONS,
} from '../../utils/audioPlayer';

import { reminderScheduler } from '../../utils/reminderScheduler';
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
}

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
  const [selectedCountry, setSelectedCountry] = useState<string>('مصر');
  const [citySearch, setCitySearch] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState(user.name || 'أحمد محمد');

  const worldCountries = useMemo(() => getWorldCountries(), []);
  const filteredCities = useMemo(
    () => searchWorldCities(citySearch, selectedCountry || undefined),
    [citySearch, selectedCountry]
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

  const handleAdjustPrayerMinutes = (prayerKey: PrayerKey, delta: number) => {
    if (!onUpdateUser) return;
    onUpdateUser((prev) => {
      const currentAdj = prev.manualPrayerAdjustments || {
        fajr: 0,
        sunrise: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
      };
      const newVal = (currentAdj[prayerKey] || 0) + delta;
      return {
        ...prev,
        manualPrayerAdjustments: {
          ...currentAdj,
          [prayerKey]: newVal,
        },
      };
    });
    showToast(`✓ تم تعديل وقت صلاة ${prayerKey} بـ ${delta > 0 ? '+1' : '-1'} دقيقة`);
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
      setPlayingReminderTrack(trackId);
      soundService.playTrack(filePath, trackId, category, () => setPlayingReminderTrack(null));
    }
  };

  const handleDetectGps = () => {
    setDetectingGps(true);
    setGpsNotice(null);

    detectSmartGpsLocation(
      (detectedCity, message) => {
        setDetectingGps(false);
        onUpdateCity(detectedCity);
        setSelectedCountry(detectedCity.country);
        setGpsNotice(message);
        showToast(`✓ تم تحديث الموقع إلى ${detectedCity.name}`);
      },
      (errorMsg) => {
        setDetectingGps(false);
        setGpsNotice(errorMsg);
      }
    );
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
    user.dstMode
  );
  const nightThirds = calculateNightThirds(
    user.city,
    new Date(),
    user.calculationMethod,
    user.asrJuristicMethod || 'standard',
    user.manualPrayerAdjustments || {},
    user.dstMode
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

  const prayerLabels: { key: PrayerKey; name: string }[] = [
    { key: 'fajr', name: 'الفجر' },
    { key: 'sunrise', name: 'الشروق' },
    { key: 'dhuhr', name: 'الظهر' },
    { key: 'asr', name: 'العصر' },
    { key: 'maghrib', name: 'المغرب' },
    { key: 'isha', name: 'العشاء' },
  ];

  // All 9 Widgets: Note that widget #1 profile icon is now the privacy policy icon as requested!
  const widgetsList = [
    {
      id: 'profile',
      order: 1,
      title: t.settingsProfile,
      subtitle: user.name || 'أحمد محمد',
      // User requirement 3: Replace profile icon with privacy policy icon
      iconImg: '/assets/settings_icons/icon_privacy.jpg',
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
      iconImg: '/assets/settings_icons/icon_azan.jpg',
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
      iconImg: '/assets/settings_icons/icon_profile.jpg',
      badge: isRtl ? 'أمان تام' : 'Privacy',
      color: 'from-emerald-900 to-teal-950',
    },
    {
      id: 'about_reset',
      order: 9,
      title: isRtl ? 'تسجيل الخروج وإعادة الضبط' : 'Logout & Reset App',
      subtitle: isRtl
        ? 'إعادة ضبط التطبيق إلى حالته الأولى والخروج'
        : 'Reset application to initial state and logout',
      iconImg: '/assets/settings_icons/icon_logout.jpg',
      badge: isRtl ? 'إعادة ضبط' : 'Reset',
      color: 'from-rose-700 to-red-900',
    },
  ];

  const currentActiveWidget = widgetsList.find((w) => w.id === activeWidgetId);

  return (
    <>
      <div className="fixed inset-0 z-50 w-screen h-[100dvh] bg-[#FAF8F5] flex flex-col overflow-hidden animate-fadeIn">
        {/* SINGLE SCROLL CONTAINER (Everything moves together on scroll) */}
        <div
          className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="flex-1 flex flex-col">
            {/* TOP DECORATIVE BANNER (With centered «الإعدادات» inside the green rectangle) */}
            <div className="relative w-full h-32 sm:h-44 md:h-52 shrink-0 overflow-hidden bg-gradient-to-r from-[#0C3D33] via-[#104B40] to-[#0A342C]">
              <img
                src="/assets/settings/settings_top_banner.jpg"
                alt="المسجد والأنوار"
                className="w-full h-full object-cover object-bottom opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/30 pointer-events-none" />

              {/* Word «الإعدادات» centered inside the green cartouche rectangle in banner center */}
              <div className="absolute bottom-2 sm:bottom-3.5 md:bottom-5 left-1/2 -translate-x-1/2 pointer-events-none select-none flex items-center justify-center w-[62%] sm:w-[50%] md:w-[44%] max-w-md text-center">
                <span className="font-cairo font-black text-xl sm:text-2xl md:text-3xl text-amber-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] tracking-wider block truncate py-0.5 leading-none">
                  {activeWidgetId && currentActiveWidget ? currentActiveWidget.title : 'الإعدادات'}
                </span>
              </div>

              {/* Quick close button in upper corner */}
              <button
                onClick={() => {
                  soundService.stopAudio();
                  onClose();
                }}
                className="absolute top-3 left-3 z-20 w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center backdrop-blur-xs transition-all active:scale-95 cursor-pointer shadow-lg border border-white/20"
                title={t.closeBtn}
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Subpage Back Button */}
              {activeWidgetId && (
                <button
                  type="button"
                  onClick={() => {
                    soundService.stopAudio();
                    setActiveWidgetId(null);
                    setExpandedGroup(null);
                  }}
                  className="absolute top-3 right-3 z-20 px-3.5 py-1.5 rounded-full bg-black/45 hover:bg-black/65 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs transition-all active:scale-95 cursor-pointer shadow-lg border border-white/20"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الرجوع</span>
                </button>
              )}

              {/* Quick Language Switch */}
              <button
                onClick={() => {
                  setActiveWidgetId('language_appearance');
                  setExpandedGroup('lang_group_1');
                }}
                className="absolute top-3 left-14 z-20 px-2.5 py-1.5 rounded-full bg-black/45 hover:bg-black/65 text-white text-xs font-bold flex items-center gap-1 backdrop-blur-xs transition-all cursor-pointer shadow-lg border border-white/20"
                title="تغيير اللغة"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.flag || '🌐'}</span>
              </button>
            </div>

            {/* SAVE NOTIFICATION TOAST */}
            {azkarSaveToast && (
              <div className="bg-[#104B40] text-white text-xs font-bold py-2.5 px-4 text-center shrink-0 shadow-md animate-fadeIn sticky top-0 z-30">
                {toastMessage}
              </div>
            )}

            {/* CONTENT AREA */}
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 flex-1">
              {/* VIEW MODE 1: MAIN SETTINGS OVERVIEW (All 9 Widgets uncollapsed and visible as cards) */}
              {!activeWidgetId ? (
                <div className="space-y-3 pb-6 animate-fadeIn">
                  {/* VISIBLE UNCOLLAPSED WIDGET CARDS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {widgetsList.map((sec) => (
                      <div
                        key={sec.id}
                        onClick={() => {
                          setActiveWidgetId(sec.id);
                          setExpandedGroup(null);
                        }}
                        className="bg-white hover:bg-emerald-50/40 rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group hover:border-[#104B40]/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Widget Icon Container */}
                          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#104B40]/15 shadow-2xs p-1 shrink-0 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                            <img
                              src={sec.iconImg}
                              alt={sec.title}
                              className="w-full h-full object-contain rounded-xl"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gray-100 text-[#104B40]">
                                #{sec.order}
                              </span>
                              <h4 className="text-xs sm:text-sm font-black text-[#172A28] truncate">
                                {sec.title}
                              </h4>
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-sans">
                              {sec.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Open Arrow Button */}
                        <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-gray-200 group-hover:bg-[#104B40] group-hover:text-white group-hover:border-[#104B40] text-gray-500 flex items-center justify-center shrink-0 transition-colors mr-2">
                          <ChevronLeft className="w-4 h-4" />
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
                    <div className="bg-white rounded-2xl p-3 border border-gray-200/90 shadow-2xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#104B40]/20 p-1 shrink-0">
                          <img
                            src={currentActiveWidget.iconImg}
                            alt={currentActiveWidget.title}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              {currentActiveWidget.badge}
                            </span>
                            <h3 className="text-sm font-black text-[#172A28]">
                              {currentActiveWidget.title}
                            </h3>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-sans">
                            {currentActiveWidget.subtitle}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveWidgetId(null)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer"
                      >
                        كافة الإعدادات
                      </button>
                    </div>
                  )}


                {/* 1. Profile Widget Subpage */}
                {activeWidgetId === 'profile' && (
                  <div className="space-y-2.5">
                    {/* Group 1: Username & Profile Name */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
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
                      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                          <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 flex items-center justify-between">
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
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
                            className="w-full p-2.5 bg-white hover:bg-emerald-50 border border-[#104B40]/30 rounded-xl text-xs font-bold text-[#104B40] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#104B40]" />
                            <span>فتح إعدادات تحسين البطارية على هاتفك</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Group 2: Exact Alarms */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
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
                            className="w-full p-2.5 bg-white hover:bg-emerald-50 border border-[#104B40]/30 rounded-xl text-xs font-bold text-[#104B40] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <Clock className="w-4 h-4 text-[#104B40]" />
                            <span>تأكيد تفعيل إذن التنبيهات الدقيقة</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Group 3: Comprehensive Wizard */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                    {/* Group 1: GPS Auto Detection */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('loc_gps')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          الكشف التلقائي عن الموقع عبر GPS (يدعم دون إنترنت)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'loc_gps' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'loc_gps' && (
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
                          <button
                            onClick={handleDetectGps}
                            disabled={detectingGps}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Compass
                              className={`w-4 h-4 text-amber-300 ${detectingGps ? 'animate-spin' : ''}`}
                            />
                            <span>
                              {detectingGps
                                ? 'جاري تحديد موقعك الجغرافي الدقيق...'
                                : 'تحديث الموقع الجغرافي الآن عبر GPS'}
                            </span>
                          </button>
                          {gpsNotice && (
                            <div className="p-2.5 bg-gray-50 border border-gray-200 text-[#172A28] rounded-xl text-xs font-bold flex items-center justify-between">
                              <span>{gpsNotice}</span>
                              <button
                                onClick={() => setGpsNotice(null)}
                                className="font-bold text-gray-500 px-1"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Group 2: Prayer Calculation Method & Asr Juristic */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-3">
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
                              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                            >
                              {ASR_METHODS.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 3: Daylight Saving Time (DST) */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
                          <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-gray-200">
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

                    {/* Group 4: Manual Minute Adjustments */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleGroup('loc_manual')}
                        className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-gray-50/70"
                      >
                        <span className="text-xs font-black text-gray-900">
                          تعديل مواقيت الصلاة يدوياً بالدقائق
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedGroup === 'loc_manual' ? 'rotate-180 text-[#104B40]' : ''
                          }`}
                        />
                      </button>
                      {expandedGroup === 'loc_manual' && (
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {prayerLabels.map((pr) => {
                              const currentDelta = (user.manualPrayerAdjustments || {})[pr.key] || 0;
                              return (
                                <div
                                  key={pr.key}
                                  className="p-2 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-xs"
                                >
                                  <span className="font-bold text-gray-800">{pr.name}</span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustPrayerMinutes(pr.key, -1)}
                                      className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-mono font-bold min-w-6 text-center text-[#104B40]">
                                      {currentDelta > 0 ? `+${currentDelta}` : currentDelta}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustPrayerMinutes(pr.key, 1)}
                                      className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 5: Egypt Governorates Selector (Offline) */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
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
                              className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800"
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
                                    country: 'مصر',
                                    latitude: loc.latitude,
                                    longitude: loc.longitude,
                                    timezone: 'Africa/Cairo',
                                  };
                                  onUpdateCity(newCity);
                                  savePersistentLocation(newCity);
                                  showToast(`✓ تم ضبط الموقع وحفظه: ${loc.name}`);
                                }}
                                className="p-2 bg-white hover:bg-emerald-50 rounded-xl border border-gray-100 text-xs flex items-center justify-between cursor-pointer"
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2.5">
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
                          {onToggleAutoPlayAzan && (
                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200">
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
                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200">
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-1.5">
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
                  </div>
                )}

                {/* 6. Azkar & Reminders Subpage */}
                {activeWidgetId === 'azkar_reminders' && (
                  <div className="space-y-2.5">
                    {/* Group 1: Morning & Evening Azkar */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2.5">
                          {/* Morning */}
                          <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sun className="w-4 h-4 text-amber-500" />
                              <div>
                                <h5 className="text-xs font-bold text-gray-900">أذكار الصباح</h5>
                                <span className="text-[10px] text-gray-500 font-sans">
                                  تصل مرة واحدة في موعدها
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={reminderSettings.morningAzkar.startTime}
                                onChange={(e) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    morningAzkar: {
                                      ...prev.morningAzkar,
                                      startTime: e.target.value,
                                    },
                                  }))
                                }
                                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                              />
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
                                className="w-4 h-4 accent-[#104B40]"
                              />
                            </div>
                          </div>

                          {/* Evening */}
                          <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Moon className="w-4 h-4 text-[#104B40]" />
                              <div>
                                <h5 className="text-xs font-bold text-gray-900">أذكار المساء</h5>
                                <span className="text-[10px] text-gray-500 font-sans">
                                  تصل مرة واحدة في موعدها
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={reminderSettings.eveningAzkar.startTime}
                                onChange={(e) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    eveningAzkar: {
                                      ...prev.eveningAzkar,
                                      startTime: e.target.value,
                                    },
                                  }))
                                }
                                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                              />
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
                                className="w-4 h-4 accent-[#104B40]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group 2: Salawat on the Prophet ﷺ (Fixed and Comprehensive) */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-3.5">
                          {/* 1. Master Toggle */}
                          <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 bg-white p-2.5 rounded-xl border">
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
                            <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-900">
                                  وقت التنبيه اليومي الثابت:
                                </span>
                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  {(() => {
                                    const timeStr = reminderSettings.salawat.startTime || '08:00';
                                    const [h, m] = timeStr.split(':').map(Number);
                                    const h12 = h % 12 === 0 ? 12 : h % 12;
                                    const period = h >= 12 ? 'مساءً (م)' : 'صباحاً (ص)';
                                    const paddedM = (m || 0) < 10 ? `0${m || 0}` : `${m || 0}`;
                                    return `${h12}:${paddedM} ${period}`;
                                  })()}
                                </span>
                              </div>

                              {/* Accurate Hour & Minute pickers */}
                              <div className="flex items-center gap-2 pt-1">
                                <div className="flex-1">
                                  <label className="text-[10px] text-gray-500 block mb-0.5">
                                    الساعة (00 - 23)
                                  </label>
                                  <select
                                    value={
                                      (reminderSettings.salawat.startTime || '08:00').split(':')[0]
                                    }
                                    onChange={(e) => {
                                      const currentM =
                                        (reminderSettings.salawat.startTime || '08:00').split(
                                          ':'
                                        )[1] || '00';
                                      const newH = e.target.value.padStart(2, '0');
                                      handleUpdateReminder((prev) => ({
                                        ...prev,
                                        salawat: {
                                          ...prev.salawat,
                                          startTime: `${newH}:${currentM}`,
                                        },
                                      }));
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                                  >
                                    {Array.from({ length: 24 }).map((_, i) => {
                                      const val = i.toString().padStart(2, '0');
                                      const h12 = i % 12 === 0 ? 12 : i % 12;
                                      const period = i >= 12 ? 'م' : 'ص';
                                      return (
                                        <option key={val} value={val}>
                                          {val}:00 ({h12} {period})
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                <div className="flex-1">
                                  <label className="text-[10px] text-gray-500 block mb-0.5">
                                    الدقيقة (00 - 59)
                                  </label>
                                  <select
                                    value={
                                      (reminderSettings.salawat.startTime || '08:00').split(':')[1] ||
                                      '00'
                                    }
                                    onChange={(e) => {
                                      const currentH =
                                        (reminderSettings.salawat.startTime || '08:00').split(
                                          ':'
                                        )[0] || '08';
                                      const newM = e.target.value.padStart(2, '0');
                                      handleUpdateReminder((prev) => ({
                                        ...prev,
                                        salawat: {
                                          ...prev.salawat,
                                          startTime: `${currentH}:${newM}`,
                                        },
                                      }));
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs font-mono font-bold text-center"
                                  >
                                    {Array.from({ length: 60 }).map((_, i) => {
                                      const val = i.toString().padStart(2, '0');
                                      return (
                                        <option key={val} value={val}>
                                          :{val} دقيقة
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                <div className="shrink-0 pt-4">
                                  <input
                                    type="time"
                                    value={reminderSettings.salawat.startTime || '08:00'}
                                    onChange={(e) =>
                                      handleUpdateReminder((prev) => ({
                                        ...prev,
                                        salawat: {
                                          ...prev.salawat,
                                          startTime: e.target.value || '08:00',
                                        },
                                      }))
                                    }
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs font-mono font-bold cursor-pointer"
                                    title="اختيار الوقت السريع"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Mode: Periodic Repeating */
                            <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-3">
                              {/* Interval config */}
                              <div className="flex items-center justify-between text-xs">
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
                                    type="number"
                                    min={1}
                                    max={240}
                                    value={reminderSettings.salawat.repeatInterval || 15}
                                    onChange={(e) =>
                                      handleUpdateReminder((prev) => ({
                                        ...prev,
                                        salawat: {
                                          ...prev.salawat,
                                          repeatInterval: Math.max(1, Number(e.target.value) || 15),
                                        },
                                      }))
                                    }
                                    className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-center font-mono"
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

                              {/* Start Time & End Time */}
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 block mb-1">
                                    يبدأ التذكير من:
                                  </label>
                                  <input
                                    type="time"
                                    value={reminderSettings.salawat.startTime || '08:00'}
                                    onChange={(e) =>
                                      handleUpdateReminder((prev) => ({
                                        ...prev,
                                        salawat: {
                                          ...prev.salawat,
                                          startTime: e.target.value || '08:00',
                                        },
                                      }))
                                    }
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 block mb-1">
                                    ينتهي التذكير عند:
                                  </label>
                                  <input
                                    type="time"
                                    value={reminderSettings.salawat.endTime || '22:00'}
                                    onChange={(e) =>
                                      handleUpdateReminder((prev) => ({
                                        ...prev,
                                        salawat: {
                                          ...prev.salawat,
                                          endTime: e.target.value || '22:00',
                                        },
                                      }))
                                    }
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-center"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2.5">
                          {/* Grid */}
                          <div className="grid grid-cols-3 gap-1.5 text-center bg-white p-2 rounded-xl border border-gray-200">
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
                          <div className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
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
                          <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between">
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
                          <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
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

                          <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
                          <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
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

                          <div className="bg-white rounded-xl p-3 border border-gray-200 space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                              <h5 className="text-xs font-bold text-gray-900">صوت المسحراتي</h5>
                              <input
                                type="checkbox"
                                checked={reminderSettings.musaharati.enabled}
                                onChange={(e) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    musaharati: { ...prev.musaharati, enabled: e.target.checked },
                                  }))
                                }
                                className="w-4 h-4 accent-[#104B40]"
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span>موعد تنبيه السحور:</span>
                              <input
                                type="time"
                                value={reminderSettings.musaharati.time}
                                onChange={(e) =>
                                  handleUpdateReminder((prev) => ({
                                    ...prev,
                                    musaharati: { ...prev.musaharati, time: e.target.value },
                                  }))
                                }
                                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                              />
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
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            خصوصيتك أمانة: يعمل تطبيق مؤذن الإسلامي محلياً بالكامل (Offline-First)
                            على جهازك، ولا يقوم بجمع أو مشاركة أو بيع أي بيانات شخصية أو إحداثيات
                            موقعك الجغرافي مع أي خوادم خارجية. جميع حسابات المواقيت واتجاه القبلة
                            والأذكار تتم داخل هاتفك دون تتبع.
                          </p>
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-[#104B40] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#104B40]" />
                            <span>100% بدون تتبع أو إعلانات مزعجة</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 9. Logout & Reset Subpage */}
                {activeWidgetId === 'about_reset' && (
                  <div className="space-y-2.5">
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-1.5 text-xs text-gray-700">
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

                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
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
                        <div className="p-3.5 bg-[#FAF8F5]/60 border-t border-gray-100 space-y-2">
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

                {/* Back to Overview button at bottom of subpage */}
                <button
                  type="button"
                  onClick={() => {
                    soundService.stopAudio();
                    setActiveWidgetId(null);
                    setExpandedGroup(null);
                  }}
                  className="w-full py-3 bg-[#104B40] hover:bg-[#0B3D35] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-98"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الرجوع لكافة ودجات الإعدادات</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM DECORATIVE BANNER (Inside single scroll container, moves with page) */}
        <div className="relative w-full h-16 sm:h-20 shrink-0 overflow-hidden bg-gradient-to-r from-[#0C3D33] via-[#104B40] to-[#0A342C] border-t border-amber-900/10 mt-auto">
          <img
            src="/assets/settings/settings_bottom_banner.jpg"
            alt="المسجد الأخضر"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5] via-transparent to-transparent pointer-events-none opacity-40" />
        </div>
      </div>
    </div>

      {/* Standalone Full Permissions Management Page */}
      <PermissionsModal
        isOpen={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
        onUpdateCity={onUpdateCity}
      />
    </>
  );
};
