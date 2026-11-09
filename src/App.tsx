/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, BellRing, Sparkles, X, Moon } from 'lucide-react';
import { Header } from './components/Header';
import { PrayerCard } from './components/PrayerCard';
import { FeatureGrid, FeatureKey } from './components/FeatureGrid';
import { FeaturedQuranBanner } from './components/FeaturedQuranBanner';
import { DailyCards } from './components/DailyCards';
import { IslamicEventsBar } from './components/IslamicEventsBar';
import { BottomNav, TabKey } from './components/BottomNav';
import { FloatingRecitationPlayer } from './components/FloatingRecitationPlayer';
import { FloatingDiskPlayer } from './components/FloatingDiskPlayer';

// Modals
import { QuranModal } from './components/modals/QuranModal';
import { AzkarModal } from './components/modals/AzkarModal';
import { PrayerModal } from './components/modals/PrayerModal';
import { QiblaModal } from './components/modals/QiblaModal';
import { HadithModal } from './components/modals/HadithModal';
import { SeerahModal } from './components/modals/SeerahModal';
import { HajjModal } from './components/modals/HajjModal';
import { MasajidModal } from './components/modals/MasajidModal';
import { DuaModal } from './components/modals/DuaModal';
import { MoreModal } from './components/modals/MoreModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { RuqyahModal } from './components/modals/RuqyahModal';
import { QuizModal } from './components/modals/QuizModal';
import { RamadanModal } from './components/modals/RamadanModal';
import { TasbihModal } from './components/modals/TasbihModal';
import { NamesOfAllahModal } from './components/modals/NamesOfAllahModal';
import { RecitationsModal } from './components/modals/RecitationsModal';
import { WallpapersModal } from './components/modals/WallpapersModal';
import { ProphetsModal } from './components/modals/ProphetsModal';
import { FirstTimeSetupModal } from './components/modals/FirstTimeSetupModal';
import {
  PermissionsModal,
  hasSeenFirstRunPermissions,
  markFirstRunPermissionsSeen,
  resetFirstRunPermissionsState,
} from './components/modals/PermissionsModal';
import {
  SmartAzanIqamaWidget,
  SmartAzanIqamaSession,
  isSmartAzanWidgetEnabled,
} from './components/modals/SmartAzanIqamaWidget';
import { reminderScheduler, isRamadanMonth } from './utils/reminderScheduler';

import { CityLocation, PrayerKey, UserProfile, RamadanFastingDayRecord } from './types';
import { CITIES_LIST, calculatePrayerTimes, DEFAULT_IQAMA_MINUTES, getSavedDstMode } from './utils/prayerTimes';
import {
  getPersistentSavedLocation,
  savePersistentLocation,
  hasPromptedFirstGps,
  hasUserConfirmedLocation,
  detectSmartGpsLocation,
  resetAllFirstTimeOnboardingFlags,
} from './data/worldCitiesData';
import { soundService } from './utils/audioPlayer';
import { getSavedLanguage, applyDocumentDirection, getTranslation, AppLanguage } from './utils/i18n';
import { userStatsTracker } from './utils/userStatsTracker';
import {
  getExtendedSetupSettings,
  checkAndNotifyMissingFeaturePermissions,
  syncPersistentPrayerShadeNotification,
  requestOrOpenSpecificPermission,
  ManagedPermissionKey,
} from './utils/androidPermissionsManager';

const DEFAULT_PROFILE: UserProfile = {
  name: 'أحمد محمد',
  city: CITIES_LIST[0], // Cairo
  calculationMethod: 'egypt',
  asrJuristicMethod: 'standard',
  language: getSavedLanguage(),
  dstMode: getSavedDstMode(),
  manualPrayerAdjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  lastReadSurah: 1,
  lastReadAyah: 1,
  lastReadPage: 1,
  lastReadSurahName: 'سورة الفاتحة',
  lastReadAyahText: '{بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ}',
  totalTasbihCount: 0,
  bookmarks: [{ surah: 1, ayah: 1, surahName: 'سورة الفاتحة' }],
  pageBookmarks: [],
  favoriteDuas: ['dua-q-1'],
  azanVoice: 'makkah',
  fajrAzanVoice: 'fajr',
  prayerAzanVoices: {},
  prayerAzanEnabled: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  autoPlayAzan: true,
  soundEnabled: true,
  prePrayerReminderEnabled: true,
  prePrayerReminderMinutes: 10,
  prayerNotificationsEnabled: true,
  morningAzkarReminderEnabled: true,
  eveningAzkarReminderEnabled: true,
  quranReminderEnabled: true,
  ramadanSuhoorReminderEnabled: true,
  ramadanIftarReminderEnabled: true,
  iqamaEnabled: true,
  iqamaSoundEnabled: true,
  iqamaIntervals: DEFAULT_IQAMA_MINUTES,
  iqamaVoice: 'iqama_1',
  quranFontSize: 'normal',
  quranNightMode: false,
  khatmaGoalDays: 30,
  darkMode: false,
  ramadanFastingTracker: {},
  prayersToday: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: false,
    isha: false,
  },
};

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => {
    const savedCity = getPersistentSavedLocation();
    try {
      const saved = localStorage.getItem('azan_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          city: savedCity || parsed.city || DEFAULT_PROFILE.city,
        };
      }
    } catch {
      // fallback
    }
    return savedCity ? { ...DEFAULT_PROFILE, city: savedCity } : DEFAULT_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // Modal open states
  const [quranOpen, setQuranOpen] = useState(false);
  const [quranInitialPage, setQuranInitialPage] = useState<number>(1);
  const [quranInitialTab, setQuranInitialTab] = useState<'surah' | 'sheikh'>('surah');
  const [azkarOpen, setAzkarOpen] = useState(false);
  const [prayerOpen, setPrayerOpen] = useState(false);
  const [qiblaOpen, setQiblaOpen] = useState(false);
  const [hadithOpen, setHadithOpen] = useState(false);
  const [seerahOpen, setSeerahOpen] = useState(false);
  const [hajjOpen, setHajjOpen] = useState(false);
  const [masajidOpen, setMasajidOpen] = useState(false);
  const [duaOpen, setDuaOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreSubTab, setMoreSubTab] = useState<'menu' | 'zakat' | 'names' | 'khatma' | 'events' | 'live'>('menu');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ramadanOpen, setRamadanOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [ruqyahOpen, setRuqyahOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [tasbihOpen, setTasbihOpen] = useState(false);
  const [namesOpen, setNamesOpen] = useState(false);
  const [recitationsOpen, setRecitationsOpen] = useState(false);
  const [wallpapersOpen, setWallpapersOpen] = useState(false);
  const [prophetsOpen, setProphetsOpen] = useState(false);
  const [firstRunPermissionsOpen, setFirstRunPermissionsOpen] = useState<boolean>(false);
  const [focusedPermissionKey, setFocusedPermissionKey] = useState<ManagedPermissionKey | null>(null);
  const [firstTimeSetupOpen, setFirstTimeSetupOpen] = useState<boolean>(() => {
    return (
      !reminderScheduler.getSettings().hasCompletedFirstTimeSetup ||
      !hasSeenFirstRunPermissions()
    );
  });

  // Request GPS location permission on first use (never overwrites saved location if GPS fails)
  useEffect(() => {
    if (!hasPromptedFirstGps() && !hasUserConfirmedLocation()) {
      detectSmartGpsLocation(
        (detectedCity) => {
          setUser((prev) => ({
            ...prev,
            city: detectedCity,
            calculationMethod: detectedCity.recommendedMethod || prev.calculationMethod || 'egypt',
          }));
        },
        () => {
          // Do not overwrite or change saved location on failure
        }
      );
    }
  }, []);

  // Keep reminderScheduler synchronized with user's active city and sync with Android bridge
  useEffect(() => {
    reminderScheduler.setCity(user.city);
    reminderScheduler.syncWithAndroidBridge();
  }, [user.city, user.calculationMethod, user.dstMode, user.manualPrayerAdjustments]);

  // Apply document direction and language whenever user.language changes + listen to global language changes
  useEffect(() => {
    applyDocumentDirection(user.language || getSavedLanguage());

    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppLanguage>;
      if (customEvent.detail && customEvent.detail !== user.language) {
        setUser((prev) => ({ ...prev, language: customEvent.detail }));
      }
    };
    window.addEventListener('appLanguageChanged', handleLangChange);
    return () => window.removeEventListener('appLanguageChanged', handleLangChange);
  }, [user.language]);

  // Register Service Worker for offline capability & background notifications + listen for direct permission clicks
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });

      const handleSwMessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'MOAZEN_OPEN_PERMISSION_DIRECT' && data.permissionKey) {
          const permKey = data.permissionKey as ManagedPermissionKey;
          setFocusedPermissionKey(permKey);
          setFirstRunPermissionsOpen(true);
          requestOrOpenSpecificPermission(permKey).catch(() => {});
        } else if (data.type === 'MOAZEN_RESTORE_SMART_AZAN_WIDGET') {
          window.dispatchEvent(new Event('restoreSmartAzanWidget'));
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);

      // Check URL parameter ?openPermission= when launched from Notification Shade
      const params = new URLSearchParams(window.location.search);
      const urlPerm = params.get('openPermission') as ManagedPermissionKey | null;
      if (urlPerm) {
        setFocusedPermissionKey(urlPerm);
        setFirstRunPermissionsOpen(true);
        requestOrOpenSpecificPermission(urlPerm).catch(() => {});
        try {
          window.history.replaceState({}, '', window.location.pathname);
        } catch {
          // ignore
        }
      }

      const handleCustomOpenPerm = (e: Event) => {
        const customEv = e as CustomEvent<{ permissionKey?: ManagedPermissionKey }>;
        const permKey = customEv.detail?.permissionKey;
        if (permKey) {
          setFocusedPermissionKey(permKey);
          setFirstRunPermissionsOpen(true);
          requestOrOpenSpecificPermission(permKey).catch(() => {});
        }
      };
      window.addEventListener('openPermissionDirectFromNotification', handleCustomOpenPerm);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
        window.removeEventListener('openPermissionDirectFromNotification', handleCustomOpenPerm);
      };
    }

    // Touch/click sound unlocker for iOS Safari and Android WebView
    const unlockAudio = () => {
      if (!soundService.isPlaying()) {
        soundService.playTasbihClick();
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Global Volume Down listener to stop Azan audio if volumeDownStopsAzan is enabled
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ext = getExtendedSetupSettings();
      if (!ext.volumeDownStopsAzan) return;
      if (
        e.key === 'AudioVolumeDown' ||
        e.key === 'VolumeDown' ||
        e.code === 'AudioVolumeDown' ||
        e.keyCode === 174 ||
        e.keyCode === 25
      ) {
        if (soundService.isPlaying()) {
          soundService.stopAudio();
          setSmartAzanAudioPlaying(false);
          setActiveAzanBanner(null);
        }
      }
    };
    const handleNativeOverlayAction = (e: Event) => {
      const customEv = e as CustomEvent<{ target?: string }>;
      const target = customEv.detail?.target;
      if (target === 'azkar') {
        setAzkarOpen(true);
      } else if (target === 'quran') {
        setQuranInitialPage(userRef.current.lastReadPage || 1);
        setQuranOpen(true);
      } else if (target === 'qibla') {
        setQiblaOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('nativeFloatingAzanAction', handleNativeOverlayAction);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('nativeFloatingAzanAction', handleNativeOverlayAction);
    };
  }, []);

  // Active Prayer Live Azan Alert Banner State
  // 10-Minute Pre-Prayer Approaching Alert State
  const [approachingAlert, setApproachingAlert] = useState<{
    prayerKey: string;
    prayerName: string;
    targetTimestamp: number;
    cityName: string;
  } | null>(null);
  const [approachingSecondsLeft, setApproachingSecondsLeft] = useState<number>(0);

  // Synchronize document language and direction
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = user.language || 'ar';
      document.documentElement.dir = user.language === 'ar' || user.language === 'ur' ? 'rtl' : 'ltr';
    }
  }, [user.language]);

  // Listen for 10-minute upcoming prayer alert
  useEffect(() => {
    const handleApproaching = (e: Event) => {
      const customEv = e as CustomEvent<{
        prayerKey: string;
        prayerName: string;
        minutesRemaining: number;
        timestamp: Date;
        cityName?: string;
      }>;
      const detail = customEv.detail;
      if (detail && detail.timestamp) {
        setApproachingAlert({
          prayerKey: detail.prayerKey,
          prayerName: detail.prayerName,
          targetTimestamp: new Date(detail.timestamp).getTime(),
          cityName: detail.cityName || user.city.name,
        });
      }
    };
    window.addEventListener('approaching_prayer_alert', handleApproaching);
    return () => {
      window.removeEventListener('approaching_prayer_alert', handleApproaching);
    };
  }, [user.city.name]);

  // Live countdown ticker for approaching prayer
  useEffect(() => {
    if (!approachingAlert) return;
    const interval = setInterval(() => {
      const diffMs = approachingAlert.targetTimestamp - Date.now();
      if (diffMs <= 0) {
        setApproachingAlert(null);
      } else {
        setApproachingSecondsLeft(Math.floor(diffMs / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [approachingAlert]);

    const [activeAzanBanner, setActiveAzanBanner] = useState<{
    prayerKey: PrayerKey;
    prayerName: string;
    time: string;
  } | null>(null);

  // Active Iqama Alert Banner State
  const [activeIqamaBanner, setActiveIqamaBanner] = useState<{
    prayerKey: PrayerKey;
    prayerName: string;
    time: string;
  } | null>(null);

  // Smart Full-Screen Azan & Iqama Widget State (Requirement 9)
  const [smartAzanSession, setSmartAzanSession] = useState<SmartAzanIqamaSession | null>(null);
  const [smartAzanMinimized, setSmartAzanMinimized] = useState<boolean>(false);
  const [smartAzanAudioPlaying, setSmartAzanAudioPlaying] = useState<boolean>(false);

  const lastTriggeredPrayerRef = useRef<string>('');
  const lastTriggeredIqamaRef = useRef<string>('');
  const lastTriggeredCannonRef = useRef<string>('');
  const lastTriggeredDuhaQiyamRef = useRef<string>('');
  const lastPersistentSyncMinuteRef = useRef<number>(-1);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('azan_user_profile', JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Periodic Azan, Ramadan Cannon (16s before Maghrib), and Iqama schedule checker: checks every 1 second
  useEffect(() => {
    const checkPrayerTimes = () => {
      const currentUser = userRef.current;
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const currentDateKey = now.toDateString();

      const calculated = calculatePrayerTimes(
        currentUser.city,
        now,
        currentUser.calculationMethod,
        currentUser.asrJuristicMethod || 'standard',
        currentUser.manualPrayerAdjustments || {},
        currentUser.dstMode
      );

      // 0. Check Ramadan Iftar Cannon: automatically fires 16 seconds before Maghrib Azan in Ramadan
      const maghribPrayer = calculated.find((p) => p.key === 'maghrib');
      if (maghribPrayer && isRamadanMonth(now) && reminderScheduler.getSettings().iftarCannon.enabled) {
        const msUntilMaghrib = maghribPrayer.timestamp.getTime() - now.getTime();
        // Trigger when 15.0s to 16.5s remain before Maghrib
        if (msUntilMaghrib <= 16500 && msUntilMaghrib >= 14500) {
          const cannonKey = `${currentDateKey}_cannon_${maghribPrayer.time}`;
          if (lastTriggeredCannonRef.current !== cannonKey) {
            lastTriggeredCannonRef.current = cannonKey;
            if (currentUser.soundEnabled !== false) {
              soundService.playIftarCannon();
            }
          }
        }
      }

      // 1. Check Azan (plays full Azan from start to finish without early stop)
      const prayerMatch = calculated.find(
        (p) =>
          p.key !== 'sunrise' &&
          p.timestamp.getHours() === now.getHours() &&
          p.timestamp.getMinutes() === now.getMinutes()
      );

      if (prayerMatch) {
        const triggerKey = `${currentDateKey}_${prayerMatch.key}_${currentTimeStr}`;
        if (lastTriggeredPrayerRef.current !== triggerKey) {
          lastTriggeredPrayerRef.current = triggerKey;

          const iqamaDuration =
            (currentUser.iqamaIntervals || DEFAULT_IQAMA_MINUTES)[prayerMatch.key] ??
            (prayerMatch.key === 'maghrib' ? 7 : 15);
          const nowMs = Date.now();
          const extConfig = getExtendedSetupSettings();

          // Launch Floating Azan Window or Full-Screen Lock-Screen Widget if enabled
          if (
            isSmartAzanWidgetEnabled() &&
            (extConfig.floatingAzanWindowEnabled || extConfig.lockScreenAzanEnabled)
          ) {
            setSmartAzanSession({
              prayerKey: prayerMatch.key,
              prayerName: prayerMatch.name,
              azanTimeStr: prayerMatch.time,
              cityName: currentUser.city.name,
              iqamaDurationMinutes: iqamaDuration,
              startedAtMs: nowMs,
              iqamaTargetMs: nowMs + iqamaDuration * 60 * 1000,
            });
            setSmartAzanMinimized(false);
          } else {
            // Fallback banner if Floating Window & Lock Screen were disabled
            setActiveAzanBanner({
              prayerKey: prayerMatch.key,
              prayerName: prayerMatch.name,
              time: prayerMatch.time,
            });
          }

          // Play full Azan automatically if enabled (never cut off early)
          const isPrayerAzanAllowed =
            currentUser.prayerAzanEnabled?.[prayerMatch.key] !== false &&
            extConfig.prayerAlerts[prayerMatch.key] !== false;
          if (
            currentUser.autoPlayAzan !== false &&
            extConfig.azanSoundEnabled !== false &&
            currentUser.soundEnabled &&
            isPrayerAzanAllowed
          ) {
            const isFajr = prayerMatch.key === 'fajr';
            const customPrayerVoice = currentUser.prayerAzanVoices?.[prayerMatch.key];
            const voice =
              customPrayerVoice ||
              (isFajr
                ? currentUser.fajrAzanVoice || 'abdulbasit_fajr'
                : currentUser.azanVoice || 'makkah');


            setSmartAzanAudioPlaying(true);
            soundService.playAzan(voice, isFajr, () => {
              setSmartAzanAudioPlaying(false);
              setActiveAzanBanner(null);
            });
          }

          // Trigger native notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`حان الآن موعد أذان ${prayerMatch.name}`, {
                body: `الله أكبر، حان وقت صلاة ${prayerMatch.name} حسب التوقيت المحلي لمدينة ${currentUser.city.name}`,
                icon: '/assets/icons/prayer.png?v=2',
              });
            } catch {
              // ignore
            }
          }
        }
      }

      // 2. Check Iqama (Fajr, Dhuhr, Asr, Isha 15 mins after Azan; Maghrib 7 mins after Azan)
      const intervals = currentUser.iqamaIntervals || DEFAULT_IQAMA_MINUTES;
      const iqamaMatch = calculated.find((p) => {
        if (p.key === 'sunrise') return false;
        const interval = intervals[p.key] ?? (p.key === 'maghrib' ? 7 : 15);
        const iqamaDate = new Date(p.timestamp.getTime() + interval * 60 * 1000);
        const iqamaH = String(iqamaDate.getHours()).padStart(2, '0');
        const iqamaM = String(iqamaDate.getMinutes()).padStart(2, '0');
        return `${iqamaH}:${iqamaM}` === currentTimeStr;
      });

      if (iqamaMatch) {
        const iqamaTriggerKey = `${currentDateKey}_iqama_${iqamaMatch.key}_${currentTimeStr}`;
        if (lastTriggeredIqamaRef.current !== iqamaTriggerKey) {
          lastTriggeredIqamaRef.current = iqamaTriggerKey;

          // Set active Iqama banner
          setActiveIqamaBanner({
            prayerKey: iqamaMatch.key,
            prayerName: iqamaMatch.name,
            time: currentTimeStr,
          });

          // Play full Iqama audio automatically
          if (currentUser.soundEnabled && currentUser.iqamaSoundEnabled !== false) {
            soundService.playIqama(currentUser.iqamaVoice || 'iqama_1', () => {
              setActiveIqamaBanner(null);
            });
          }

          // Trigger native notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`حان الآن موعد إقامة صلاة ${iqamaMatch.name}`, {
                body: `أقيموا صفوفكم وتراصّوا، حان الآن وقت إقامة صلاة ${iqamaMatch.name}`,
                icon: '/assets/icons/prayer.png?v=2',
              });
            } catch {
              // ignore
            }
          }
        }
      }

      // 3. Check Duha (20 mins after Sunrise) and Qiyam al-Layl alerts + Persistent Prayer Shade Notification
      const extSetup = getExtendedSetupSettings();
      const sunrisePrayer = calculated.find((p) => p.key === 'sunrise');
      if (sunrisePrayer && extSetup.prayerAlerts.duha) {
        const duhaDate = new Date(sunrisePrayer.timestamp.getTime() + 20 * 60 * 1000);
        const duhaTimeStr = `${String(duhaDate.getHours()).padStart(2, '0')}:${String(
          duhaDate.getMinutes()
        ).padStart(2, '0')}`;
        if (currentTimeStr === duhaTimeStr) {
          const duhaKey = `${currentDateKey}_duha_${duhaTimeStr}`;
          if (lastTriggeredDuhaQiyamRef.current !== duhaKey) {
            lastTriggeredDuhaQiyamRef.current = duhaKey;
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('حان الآن وقت صلاة الضحى (صلاة الأوابين)', {
                  body: '«يُصْبِحُ عَلَى كُلِّ سُلَامَى مِنْ أَحَدِكُمْ صَدَقَةٌ... وَيُجْزِئُ مِنْ ذَلِكَ رَكْعَتَانِ يَرْكَعُهُمَا مِنَ الضُّحَى»',
                  icon: '/assets/icons/prayer.png?v=2',
                });
              } catch {
                // ignore
              }
            }
          }
        }
      }

      if (extSetup.qiyamNightAlertEnabled && currentTimeStr === extSetup.qiyamNightTime) {
        const qiyamKey = `${currentDateKey}_qiyam_${extSetup.qiyamNightTime}`;
        if (lastTriggeredDuhaQiyamRef.current !== qiyamKey) {
          lastTriggeredDuhaQiyamRef.current = qiyamKey;
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('تنبيه قيام الليل • الثلث الأخير من الليل', {
                body: '«عَلَيْكُمْ بِقِيَامِ اللَّيْلِ فَإِنَّهُ دَأْبُ الصَّالِحِينَ قَبْلَكُمْ، وَقُرْبَةٌ إِلَى رَبِّكُمْ»',
                icon: '/assets/icons/prayer.png?v=2',
              });
            } catch {
              // ignore
            }
          }
        }
      }

      // 4. Sync Persistent Prayer Notification & check missing feature permissions once per minute
      const nowMinute = now.getHours() * 60 + now.getMinutes();
      if (lastPersistentSyncMinuteRef.current !== nowMinute) {
        lastPersistentSyncMinuteRef.current = nowMinute;
        const nextPrayer =
          calculated.find((p) => p.timestamp.getTime() > now.getTime()) || calculated[0];
        if (nextPrayer) {
          syncPersistentPrayerShadeNotification({
            enabled: extSetup.persistentNotificationEnabled,
            cityName: currentUser.city.name,
            nextPrayerName: nextPrayer.name,
            nextPrayerTime: nextPrayer.time,
          }).catch(() => {});
        }
        if (reminderScheduler.getSettings().hasCompletedFirstTimeSetup) {
          checkAndNotifyMissingFeaturePermissions({
            autoPlayAzanEnabled: currentUser.autoPlayAzan !== false,
            smartAzanScreenEnabled: isSmartAzanWidgetEnabled(),
            persistentNotificationEnabled: extSetup.persistentNotificationEnabled,
          }).catch(() => {});
        }
      }
    };

    checkPrayerTimes();
    const interval = setInterval(checkPrayerTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Feature grid item selection
  const handleSelectFeature = (key: FeatureKey) => {
    switch (key) {
      case 'qibla':
        setQiblaOpen(true);
        break;
      case 'hadith':
        setHadithOpen(true);
        break;
      case 'prayer':
        setPrayerOpen(true);
        break;
      case 'azkar':
        setAzkarOpen(true);
        break;
      case 'quran':
        setQuranInitialPage(user.lastReadPage || 1);
        setQuranOpen(true);
        break;
      case 'dua':
        setDuaOpen(true);
        break;
      case 'masajid':
        setMasajidOpen(true);
        break;
      case 'hajj':
        setHajjOpen(true);
        break;
      case 'seerah':
        setSeerahOpen(true);
        break;
      case 'tasbih':
        setTasbihOpen(true);
        break;
      case 'names':
        setNamesOpen(true);
        break;
      case 'recitations':
        setRecitationsOpen(true);
        break;
      case 'wallpapers':
        setWallpapersOpen(true);
        break;
      case 'quiz':
        setQuizOpen(true);
        break;
      case 'ramadan':
        setRamadanOpen(true);
        break;
      case 'ruqyah':
        setRuqyahOpen(true);
        break;
      case 'prophets':
        setProphetsOpen(true);
        break;
      case 'sunan':
        setRuqyahOpen(true);
        break;
    }
  };

  // Close all section modals when switching via Floating Bottom Bar
  const closeAllSectionModals = () => {
    setQuranOpen(false);
    setAzkarOpen(false);
    setPrayerOpen(false);
    setQiblaOpen(false);
    setHadithOpen(false);
    setSeerahOpen(false);
    setHajjOpen(false);
    setMasajidOpen(false);
    setDuaOpen(false);
    setMoreOpen(false);
    setSettingsOpen(false);
    setRamadanOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
    setRuqyahOpen(false);
    setQuizOpen(false);
    setTasbihOpen(false);
    setNamesOpen(false);
    setRecitationsOpen(false);
    setWallpapersOpen(false);
    setProphetsOpen(false);
  };

  // Bottom Navigation tab changes
  const handleTabChange = (tab: TabKey) => {
    closeAllSectionModals();
    setActiveTab(tab);
    if (tab === 'quran') {
      setQuranInitialPage(user.lastReadPage || 1);
      setQuranOpen(true);
    } else if (tab === 'prayer') {
      setPrayerOpen(true);
    } else if (tab === 'qibla') {
      setQiblaOpen(true);
    } else if (tab === 'ramadan') {
      setRamadanOpen(true);
    } else if (tab === 'settings') {
      setSettingsOpen(true);
    } else if (tab === 'profile') {
      setProfileOpen(true);
    } else if (tab === 'more') {
      setMoreSubTab('menu');
      setMoreOpen(true);
    }
  };

  const handleUpdateFastingTracker = useCallback((dayNumber: number, record: Partial<RamadanFastingDayRecord>) => {
    setUser((prev) => {
      const currentTracker = prev.ramadanFastingTracker || {};
      const currentDay = currentTracker[dayNumber] || {
        fasted: false,
        prayedCongregation: false,
        taraweeh: false,
        charity: false,
        quranRead: false,
      };
      return {
        ...prev,
        ramadanFastingTracker: {
          ...currentTracker,
          [dayNumber]: {
            ...currentDay,
            ...record,
          },
        },
      };
    });
  }, []);

  const handleUpdateLastReadPage = useCallback((pageNumber: number, surahName: string) => {
    setUser((prev) => {
      if (prev.lastReadPage === pageNumber && prev.lastReadSurahName === surahName) {
        return prev;
      }
      return {
        ...prev,
        lastReadPage: pageNumber,
        lastReadSurahName: surahName,
      };
    });
  }, []);


  const handleIncrementTasbih = useCallback((amount: number) => {
    userStatsTracker.recordTasbih(amount);
    setUser((prev) => ({
      ...prev,
      totalTasbihCount: prev.totalTasbihCount + amount,
    }));
  }, []);

  const handleTogglePrayerToday = useCallback((prayerKey: PrayerKey) => {
    setUser((prev) => ({
      ...prev,
      prayersToday: {
        ...prev.prayersToday,
        [prayerKey]: !prev.prayersToday[prayerKey],
      },
    }));
  }, []);

  const handleOpenReaderAt = (_surah: number, _ayah: number, pageNumber?: number) => {
    setQuranInitialPage(pageNumber || user.lastReadPage || 1);
    setQuranOpen(true);
  };

  const handleStopAzanAlert = () => {
    soundService.stopAudio();
    setActiveAzanBanner(null);
  };

  const isFloatingBottomNavHidden =
    settingsOpen ||
    firstRunPermissionsOpen ||
    firstTimeSetupOpen ||
    activeTab === 'settings' ||
    quranOpen;

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F5] text-[#172A28] flex flex-col justify-between w-full relative overflow-x-hidden">
      {/* Real-Time Live Azan Notification Banner */}
      {activeAzanBanner && (
        <div className="fixed top-3 inset-x-3 max-w-xl mx-auto z-50 bg-gradient-to-r from-[#0c392c] to-[#124d3f] text-white p-3 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center justify-between animate-bounce">
          <button
            onClick={handleStopAzanAlert}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
            title={getTranslation(user.language).stopBtn}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 text-right mr-2">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-black text-amber-300 font-quran">
                {getTranslation(user.language).azanAlertTitle(activeAzanBanner.prayerName)}
              </span>
              <BellRing className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
            <span className="text-[10px] text-emerald-100 font-sans block mt-0.5">
              {getTranslation(user.language).azanAlertSub} • {activeAzanBanner.time}
            </span>
          </div>

          <button
            onClick={handleStopAzanAlert}
            className="bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {getTranslation(user.language).stopBtn}
          </button>
        </div>
      )}

      {/* Real-Time Live Iqama Notification Banner */}
      {activeIqamaBanner && (
        <div className="fixed top-3 inset-x-3 max-w-xl mx-auto z-50 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-3 rounded-2xl shadow-2xl border border-amber-300/50 flex items-center justify-between animate-bounce">
          <button
            onClick={() => {
              soundService.stopAudio();
              setActiveIqamaBanner(null);
            }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
            title={getTranslation(user.language).closeBtn}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 text-right mr-2">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-black text-amber-200 font-quran">
                {getTranslation(user.language).iqamaAlertTitle(activeIqamaBanner.prayerName)}
              </span>
              <BellRing className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
            <span className="text-[10px] text-amber-100 font-sans block mt-0.5">
              {getTranslation(user.language).iqamaAlertSub}
            </span>
          </div>

          <button
            onClick={() => {
              soundService.stopAudio();
              setActiveIqamaBanner(null);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {getTranslation(user.language).closeBtn}
          </button>
        </div>
      )}

      {/* Scrollable Main Application Content: DailyCards is the last visible widget above BottomNav without scrolling; IslamicEventsBar sits below and appears on scroll */}
      <div className="flex-1 overflow-y-auto pb-[56px] scrollbar-none select-none max-w-2xl mx-auto w-full px-2 sm:px-4">
        <div className="min-h-[calc(100dvh-56px)] flex flex-col justify-between pb-1">
          {/* Top Header */}
          <Header
            user={user}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenSettings={() => {
              setActiveTab('settings');
              setSettingsOpen(true);
            }}
            onOpenProfile={() => {
              setActiveTab('profile');
              setProfileOpen(true);
            }}
          />

          {/* Prayer Times Highlight Card with live countdown for every prayer */}
          <PrayerCard
            city={user.city}
            azanVoice={user.azanVoice}
            iqamaVoice={user.iqamaVoice}
            calculationMethod={user.calculationMethod}
            asrJuristicMethod={user.asrJuristicMethod}
            manualAdjustments={user.manualPrayerAdjustments}
            iqamaIntervals={user.iqamaIntervals}
            dstMode={user.dstMode}
            language={user.language}
            onOpenPrayerModal={() => {
              setActiveTab('prayer');
              setPrayerOpen(true);
            }}
            onOpenCitySelector={() => {
              setActiveTab('settings');
              setSettingsOpen(true);
            }}
          />

          {/* 16 Features Grid: 8 shown initially + 8 toggleable with down arrow */}
          <FeatureGrid onSelectFeature={handleSelectFeature} language={user.language} />

          {/* Featured Quran Card: Last Read Banner */}
          <FeaturedQuranBanner
            user={user}
            language={user.language}
            onOpenQuranReader={(surah, ayah, page) => {
              setQuranInitialTab('surah');
              handleOpenReaderAt(surah, ayah, page);
            }}
            onOpenSheikhTutor={() => {
              setQuranInitialTab('sheikh');
              setQuranOpen(true);
            }}
          />

          {/* Daily Cards: Hadith of the day & Azkar of the day (Last visible widget without scrolling) */}
          <DailyCards
            language={user.language}
            onOpenAzkar={() => setAzkarOpen(true)}
            onOpenHadith={() => setHadithOpen(true)}
          />
        </div>

        {/* Islamic Events Bar placed below DailyCards so it appears when scrolling down */}
        <div className="mt-2.5 mb-2">
          <IslamicEventsBar
            language={user.language}
            onOpenEvents={() => {
              setMoreSubTab('events');
              setMoreOpen(true);
            }}
          />
        </div>
      </div>

      {/* Single Floating Bottom Navigation Bar (Visible across sections, hidden in Settings & Fullscreen Quran) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        language={user.language}
        hidden={isFloatingBottomNavHidden}
      />

      {/* Complete 604-Page Madinah Mushaf Modal */}
      <QuranModal
        isOpen={quranOpen}
        onClose={() => {
          setQuranOpen(false);
          setQuranInitialTab('surah');
          if (activeTab === 'quran') setActiveTab('home');
        }}
        initialPage={quranInitialPage}
        initialTab={quranInitialTab}
        user={user}
        onUpdateLastReadPage={handleUpdateLastReadPage}
      />

      <AzkarModal
        isOpen={azkarOpen}
        onClose={() => setAzkarOpen(false)}
        onIncrementTotalTasbih={handleIncrementTasbih}
      />

      <PrayerModal
        isOpen={prayerOpen}
        onClose={() => {
          setPrayerOpen(false);
          if (activeTab === 'prayer') setActiveTab('home');
        }}
        city={user.city}
        user={user}
        onTogglePrayerToday={handleTogglePrayerToday}
        onOpenLocationSettings={() => {
          setPrayerOpen(false);
          setActiveTab('settings');
          setSettingsOpen(true);
        }}
      />

      <QiblaModal
        isOpen={qiblaOpen}
        onClose={() => {
          setQiblaOpen(false);
          if (activeTab === 'qibla') setActiveTab('home');
        }}
        city={user.city}
      />

      <HadithModal
        isOpen={hadithOpen}
        onClose={() => setHadithOpen(false)}
      />

      <SeerahModal
        isOpen={seerahOpen}
        onClose={() => setSeerahOpen(false)}
      />

      <HajjModal
        isOpen={hajjOpen}
        onClose={() => setHajjOpen(false)}
      />

      <MasajidModal
        isOpen={masajidOpen}
        onClose={() => setMasajidOpen(false)}
      />

      <DuaModal
        isOpen={duaOpen}
        onClose={() => setDuaOpen(false)}
      />

      <MoreModal
        isOpen={moreOpen}
        onClose={() => {
          setMoreOpen(false);
          if (activeTab === 'more') setActiveTab('home');
        }}
        defaultSubTab={moreSubTab}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          if (activeTab === 'settings') setActiveTab('home');
        }}
        user={user}
        onUpdateCity={(newCity) => {
          savePersistentLocation(newCity);
          setUser((prev) => ({ ...prev, city: newCity }));
        }}
        onUpdateCalculationMethod={(methodId) =>
          setUser((prev) => ({ ...prev, calculationMethod: methodId }))
        }
        onUpdateAzanVoice={(voice) => setUser((prev) => ({ ...prev, azanVoice: voice }))}
        onUpdateFajrAzanVoice={(voice) => setUser((prev) => ({ ...prev, fajrAzanVoice: voice }))}
        onToggleAutoPlayAzan={(en) => setUser((prev) => ({ ...prev, autoPlayAzan: en }))}
        onToggleSoundEnabled={(en) => setUser((prev) => ({ ...prev, soundEnabled: en }))}
        onUpdateUser={setUser}
        onOpenFirstTimeSetup={() => {
          setSettingsOpen(false);
          if (activeTab === 'settings') setActiveTab('home');
          setFirstTimeSetupOpen(true);
        }}
        onLogoutReset={() => {
          soundService.stopAudio();
          resetFirstRunPermissionsState();
          resetAllFirstTimeOnboardingFlags();
          reminderScheduler.setCompletedFirstTimeSetup(false);
          setSettingsOpen(false);
          setActiveTab('home');
          setFirstRunPermissionsOpen(false);
          setFirstTimeSetupOpen(true);
        }}
        onTriggerTestSmartAzanWidget={() => {
          setSettingsOpen(false);
          if (activeTab === 'settings') setActiveTab('home');
          const nowMs = Date.now();
          const iqamaDuration = (user.iqamaIntervals || DEFAULT_IQAMA_MINUTES).dhuhr || 15;
          setSmartAzanSession({
            prayerKey: 'dhuhr',
            prayerName: 'الظهر',
            azanTimeStr: new Date().toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            cityName: user.city.name,
            iqamaDurationMinutes: iqamaDuration,
            startedAtMs: nowMs,
            iqamaTargetMs: nowMs + iqamaDuration * 60 * 1000,
          });
          setSmartAzanMinimized(false);
          setSmartAzanAudioPlaying(true);
          soundService.playAzan(user.azanVoice || 'makkah', false, () => {
            setSmartAzanAudioPlaying(false);
          });
        }}
      />

      <RamadanModal
        isOpen={ramadanOpen}
        onClose={() => {
          setRamadanOpen(false);
          if (activeTab === 'ramadan') setActiveTab('home');
        }}
        user={user}
        onUpdateFastingTracker={handleUpdateFastingTracker}
        onOpenQuranReader={handleOpenReaderAt}
      />


      <ProfileModal
        isOpen={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          if (activeTab === 'profile') setActiveTab('home');
        }}
        user={user}
        onUpdateUserName={(name) => setUser((prev) => ({ ...prev, name }))}
        onOpenQuranReader={() => {
          setProfileOpen(false);
          handleOpenReaderAt(1, 1, user.lastReadPage || 1);
        }}
      />

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <RuqyahModal
        isOpen={ruqyahOpen}
        onClose={() => setRuqyahOpen(false)}
      />

      <QuizModal
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
      />

      {/* 8 Newly Added Section Modals */}
      <TasbihModal
        isOpen={tasbihOpen}
        onClose={() => setTasbihOpen(false)}
        totalTasbihCount={user.totalTasbihCount}
        onIncrementTotalTasbih={handleIncrementTasbih}
      />

      <NamesOfAllahModal
        isOpen={namesOpen}
        onClose={() => setNamesOpen(false)}
      />

      <RecitationsModal
        isOpen={recitationsOpen}
        onClose={() => setRecitationsOpen(false)}
        onOpenSurahPage={(surahNum) => {
          setRecitationsOpen(false);
          handleOpenReaderAt(surahNum, 1);
        }}
      />

      <WallpapersModal
        isOpen={wallpapersOpen}
        onClose={() => setWallpapersOpen(false)}
      />

      <ProphetsModal
        isOpen={prophetsOpen}
        onClose={() => setProphetsOpen(false)}
      />

      {/* First-Time 4-Page Full-Screen Setup Wizard */}
      <FirstTimeSetupModal
        isOpen={firstTimeSetupOpen}
        onComplete={() => {
          markFirstRunPermissionsSeen();
          reminderScheduler.setCompletedFirstTimeSetup(true);
          setFirstTimeSetupOpen(false);
        }}
        user={user}
        onUpdateCity={(newCity) => setUser((prev) => ({ ...prev, city: newCity }))}
        onUpdateAzanVoice={(voice) => setUser((prev) => ({ ...prev, azanVoice: voice }))}
        onToggleAutoPlayAzan={(en) => setUser((prev) => ({ ...prev, autoPlayAzan: en }))}
        onUpdateDstMode={(mode) => setUser((prev) => ({ ...prev, dstMode: mode }))}
        onUpdateLanguage={(lang) => setUser((prev) => ({ ...prev, language: lang }))}
        onUpdateUser={setUser}
      />

      {/* Dedicated Permissions Management Modal (Opened from Notification Shade reminders or Settings) */}
      <PermissionsModal
        isOpen={firstRunPermissionsOpen}
        isFirstRunWelcome={false}
        focusedPermissionKey={focusedPermissionKey}
        onClose={() => {
          markFirstRunPermissionsSeen();
          setFocusedPermissionKey(null);
          setFirstRunPermissionsOpen(false);
        }}
        onCompleteFirstRun={() => {
          markFirstRunPermissionsSeen();
          setFocusedPermissionKey(null);
          setFirstRunPermissionsOpen(false);
        }}
        onUpdateCity={(newCity) => setUser((prev) => ({ ...prev, city: newCity }))}
      />

      {/* 10-Minute Pre-Prayer Floating Alert Banner with Live Countdown */}
      {approachingAlert && approachingSecondsLeft > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-fadeIn">
          <div className="bg-gradient-to-r from-[#104B40] via-[#165B4C] to-[#104B40] text-white p-3.5 rounded-2xl shadow-2xl border border-amber-300/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 animate-pulse shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-300">
                    اقتربت صلاة {approachingAlert.prayerName}
                  </span>
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-md font-sans font-bold">
                    {Math.floor(approachingSecondsLeft / 60)}:
                    {String(approachingSecondsLeft % 60).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-[11px] text-white/80 line-clamp-1">
                  حان وقت الاستعداد والوضوء لصلاة {approachingAlert.prayerName} في {approachingAlert.cityName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setPrayerOpen(true);
                  setApproachingAlert(null);
                }}
                className="px-2.5 py-1.5 bg-[#C5A059] text-[#104B40] rounded-xl text-xs font-black hover:bg-[#b59048] transition-colors cursor-pointer"
              >
                عرض
              </button>
              <button
                onClick={() => setApproachingAlert(null)}
                className="p-1 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Azan Window & Lock-Screen Azan Widget */}
      <SmartAzanIqamaWidget
        session={smartAzanSession}
        isMinimized={smartAzanMinimized}
        isAzanAudioPlaying={smartAzanAudioPlaying}
        onStopAzanAudioOnly={() => {
          soundService.stopAudio();
          setSmartAzanAudioPlaying(false);
        }}
        onMinimizeToNotification={() => {
          setSmartAzanMinimized(true);
        }}
        onRestoreFullScreen={() => {
          setSmartAzanMinimized(false);
        }}
        onDismissSession={() => {
          soundService.stopAudio();
          setSmartAzanAudioPlaying(false);
          setSmartAzanSession(null);
          setSmartAzanMinimized(false);
        }}
        onOpenPrayerAzkar={() => {
          setAzkarOpen(true);
        }}
        onOpenQuran={() => {
          setQuranInitialPage(user.lastReadPage || 1);
          setQuranOpen(true);
        }}
        onOpenQibla={() => {
          setQiblaOpen(true);
        }}
      />

      {/* Floating Circular Vinyl/Turntable Recitation Player */}
      <FloatingRecitationPlayer />

      {/* Floating Circular Disk Player for Ruqyah and Asmaa Allah Al-Husna */}
      <FloatingDiskPlayer />
    </div>
  );
}
