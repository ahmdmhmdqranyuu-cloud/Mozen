import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  MapPin,
  Volume2,
  BellRing,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Check,
  Globe,
  ShieldCheck,
  Languages,
  Layers,
  BatteryCharging,
  Smartphone,
  Moon,
  Sun,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { CityLocation, DstMode, UserProfile } from '../../types';
import {
  CITIES_LIST,
  getSavedDstMode,
  setSavedDstMode,
} from '../../utils/prayerTimes';
import {
  searchWorldCities,
  getWorldCountries,
  savePersistentLocation,
} from '../../data/worldCitiesData';
import { EGYPT_GOVERNORATES_DATA } from '../../data/egyptLocationsData';
import { soundService } from '../../utils/audioPlayer';
import { reminderScheduler } from '../../utils/reminderScheduler';
import {
  AppLanguage,
  SUPPORTED_LANGUAGES,
  getSavedLanguage,
  setSavedLanguage,
  getTranslation,
  getLanguageDirection,
} from '../../utils/i18n';
import {
  isSmartAzanWidgetEnabled,
  setSmartAzanWidgetEnabled,
} from './SmartAzanIqamaWidget';
import { markFirstRunPermissionsSeen } from './PermissionsModal';
import {
  ManagedPermissionKey,
  PermissionStateMap,
  FirstTimeExtendedSettings,
  getExtendedSetupSettings,
  saveExtendedSetupSettings,
  getSavedPermissionsState,
  verifyAllPermissionsStatus,
  requestOrOpenSpecificPermission,
} from '../../utils/androidPermissionsManager';

interface FirstTimeSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
  user?: UserProfile;
  onUpdateCity?: (city: CityLocation) => void;
  onUpdateAzanVoice?: (voice: string) => void;
  onUpdateIqamaVoice?: (voice: string) => void;
  onToggleAutoPlayAzan?: (enabled: boolean) => void;
  onUpdateDstMode?: (mode: DstMode) => void;
  onUpdateLanguage?: (lang: AppLanguage) => void;
  onUpdateUser?: (updater: (prev: UserProfile) => UserProfile) => void;
}

export const FirstTimeSetupModal: React.FC<FirstTimeSetupModalProps> = ({
  isOpen,
  onComplete,
  user,
  onUpdateCity,
  onToggleAutoPlayAzan,
  onUpdateDstMode,
  onUpdateLanguage,
  onUpdateUser,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Extended 4-Page Setup Settings (auto-saved on every change)
  const [extSettings, setExtSettings] = useState<FirstTimeExtendedSettings>(() =>
    getExtendedSetupSettings()
  );

  // Permissions state (auto-verified on mount & on return from phone settings)
  const [permState, setPermState] = useState<PermissionStateMap>(() =>
    getSavedPermissionsState()
  );
  const [attemptedPerms, setAttemptedPerms] = useState<Record<string, boolean>>({});
  const [skippedPerms, setSkippedPerms] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [privacyError, setPrivacyError] = useState<boolean>(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState<boolean>(false);

  // Page 1 UI toggles: Button to show language picker & Button to show manual location picker
  const [showLanguagePicker, setShowLanguagePicker] = useState<boolean>(false);
  const [showManualLocationPicker, setShowManualLocationPicker] = useState<boolean>(false);
  const [manualLocationTab, setManualLocationTab] = useState<'egypt' | 'world'>('egypt');
  const [selectedEgyptGovId, setSelectedEgyptGovId] = useState<string>('gov_cairo');
  const [egyptSearchQuery, setEgyptSearchQuery] = useState<string>('');

  const [selectedCity, setSelectedCity] = useState<CityLocation>(
    user?.city || CITIES_LIST[0]
  );
  const [selectedDstMode] = useState<DstMode>(
    () => user?.dstMode || getSavedDstMode()
  );
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(
    () => user?.language || getSavedLanguage()
  );
  const t = getTranslation(selectedLang);
  const dir = getLanguageDirection(selectedLang);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [citySearch, setCitySearch] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

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
        loc.governorate.toLowerCase().includes(q)
    );
  }, [egyptSearchQuery, selectedEgyptGov]);

  // Auto-verify permissions on open & when returning from Android settings
  const refreshPermissions = useCallback(async () => {
    const verified = await verifyAllPermissionsStatus();
    setPermState(verified);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshPermissions();

    const handleReturnFromSettings = () => {
      if (document.visibilityState === 'visible') {
        refreshPermissions();
        setStatusMessage('تم التحقق تلقائياً من حالة الأذونات بعد العودة إلى التطبيق ✓');
        setTimeout(() => setStatusMessage(null), 3200);
      }
    };

    window.addEventListener('focus', handleReturnFromSettings);
    window.addEventListener('pageshow', handleReturnFromSettings);
    window.addEventListener('androidPermissionsResume', handleReturnFromSettings);
    document.addEventListener('visibilitychange', handleReturnFromSettings);

    return () => {
      window.removeEventListener('focus', handleReturnFromSettings);
      window.removeEventListener('pageshow', handleReturnFromSettings);
      window.removeEventListener('androidPermissionsResume', handleReturnFromSettings);
      document.removeEventListener('visibilitychange', handleReturnFromSettings);
    };
  }, [isOpen, refreshPermissions]);

  if (!isOpen) return null;

  const updateExt = (
    updater: (prev: FirstTimeExtendedSettings) => FirstTimeExtendedSettings
  ) => {
    setExtSettings((prev) => {
      const next = saveExtendedSetupSettings(updater(prev));
      return next;
    });
  };

  // Handle granting any of the 4 official permissions (Location, Notifications, Overlay, Battery)
  const handleGrantPermission = async (permKey: ManagedPermissionKey) => {
    if (permKey === 'location') setDetectingGps(true);
    setAttemptedPerms((prev) => ({ ...prev, [permKey]: true }));
    setSkippedPerms((prev) => ({ ...prev, [permKey]: false }));

    const result = await requestOrOpenSpecificPermission(permKey, {
      onLocationDetected: (detectedCity) => {
        setSelectedCity(detectedCity);
        savePersistentLocation(detectedCity);
        onUpdateCity?.(detectedCity);
      },
    });

    if (permKey === 'location') setDetectingGps(false);

    const updated = await verifyAllPermissionsStatus();
    setPermState(updated);
    if (result.message) {
      setStatusMessage(result.message);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSelectManualCity = (city: CityLocation) => {
    setSelectedCity(city);
    savePersistentLocation(city);
    onUpdateCity?.(city);
    setStatusMessage(`تم اختيار وحفظ الموقع يدوياً: ${city.name} (${city.country}) ✓`);
    setTimeout(() => setStatusMessage(null), 2800);
  };

  const handleSelectAppLanguage = (lang: AppLanguage) => {
    setSelectedLang(lang);
    setSavedLanguage(lang);
    onUpdateLanguage?.(lang);
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    setStatusMessage(`تم حفظ لغة التطبيق: ${langObj?.nativeName || lang} ✓`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Sync settings to UserProfile & ReminderScheduler
  const persistCurrentChoices = (markCompleted: boolean) => {
    soundService.stopAudio();
    setSavedDstMode(selectedDstMode);
    setSavedLanguage(selectedLang);
    setSmartAzanWidgetEnabled(extSettings.landscapeAzanScreenEnabled);
    savePersistentLocation(selectedCity);

    onUpdateCity?.(selectedCity);
    onToggleAutoPlayAzan?.(extSettings.azanNotificationsEnabled);
    onUpdateDstMode?.(selectedDstMode);
    onUpdateLanguage?.(selectedLang);

    if (onUpdateUser) {
      onUpdateUser((prev) => ({
        ...prev,
        city: selectedCity,
        language: selectedLang,
        dstMode: selectedDstMode,
        autoPlayAzan: extSettings.azanNotificationsEnabled,
        prayerNotificationsEnabled: extSettings.azanNotificationsEnabled,
        prayerAzanEnabled: {
          fajr: extSettings.prayerAlerts.fajr,
          sunrise: extSettings.prayerAlerts.sunrise,
          dhuhr: extSettings.prayerAlerts.dhuhr,
          asr: extSettings.prayerAlerts.asr,
          maghrib: extSettings.prayerAlerts.maghrib,
          isha: extSettings.prayerAlerts.isha,
        },
        onboardingCompleted: markCompleted ? true : prev.onboardingCompleted,
      }));
    }

    if (markCompleted) {
      markFirstRunPermissionsSeen();
      reminderScheduler.setCompletedFirstTimeSetup(true);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !extSettings.privacyPolicyAccepted) {
      setPrivacyError(true);
      setStatusMessage('يرجى وضع علامة صح للموافقة على سياسة الخصوصية للمتابعة.');
      return;
    }
    setPrivacyError(false);
    persistCurrentChoices(false);
    if (currentStep < 5) {
      setCurrentStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      persistCurrentChoices(true);
      onComplete();
    }
  };

  const handleSkipStep = () => {
    if (currentStep === 1 && !extSettings.privacyPolicyAccepted) {
      setPrivacyError(true);
      setStatusMessage('الموافقة على سياسة الخصوصية مطلوبة في الصفحة الأولى قبل المتابعة.');
      return;
    }
    setPrivacyError(false);
    persistCurrentChoices(currentStep === 5);
    if (currentStep < 5) {
      setCurrentStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      onComplete();
    }
  };

  const handleFinishSetup = () => {
    if (!extSettings.privacyPolicyAccepted) {
      setCurrentStep(1);
      setPrivacyError(true);
      return;
    }
    persistCurrentChoices(true);
    onComplete();
  };

  const stepTitles: Record<1 | 2 | 3 | 4 | 5, { title: string; subtitle: string }> = {
    1: {
      title: `${t.setupStep} 1: ${t.setupStep1Title}`,
      subtitle: t.setupStep1Sub,
    },
    2: {
      title: `${t.setupStep} 2: ${t.setupStep2Title}`,
      subtitle: t.setupStep2Sub,
    },
    3: {
      title: `${t.setupStep} 3: ${t.setupStep3Title}`,
      subtitle: t.setupStep3Sub,
    },
    4: {
      title: `${t.setupStep} 4: ${t.setupStep4Title}`,
      subtitle: t.setupStep4Sub,
    },
    5: {
      title: `${t.setupStep} 5: ${t.setupStep5Title}`,
      subtitle: t.setupStep5Sub,
    },
  };

  const renderPermissionActionBox = (config: {
    permKey: ManagedPermissionKey;
    title: string;
    benefitExplanation: string;
    grantButtonText: string;
    isLoading?: boolean;
  }) => {
    const isGranted = permState[config.permKey];
    const wasAttempted = attemptedPerms[config.permKey];
    const wasSkipped = skippedPerms[config.permKey];

    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#104B40] shrink-0" />
            <h4 className="text-xs sm:text-sm font-black text-[#172A28]">{config.title}</h4>
          </div>

          {isGranted ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t.setupActivated}</span>
            </span>
          ) : wasSkipped ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
              <span>{t.setupSkipped}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.setupPending}</span>
            </span>
          )}
        </div>

        {/* Pre-explanation of permission benefit before directing to phone settings */}
        <div className="bg-[#FAF9F5] rounded-xl p-3 border border-gray-200/60 text-xs text-gray-700 leading-relaxed">
          <strong className="text-[#104B40] block mb-0.5">{t.setupBenefitWhy}</strong>
          {config.benefitExplanation}
        </div>

        {/* Grant / Retry / Skip Controls */}
        {isGranted ? (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.setupGrantedSuccess}</span>
            </span>
            <button
              type="button"
              onClick={() => handleGrantPermission(config.permKey)}
              className="text-[11px] text-[#104B40] underline cursor-pointer"
            >
              {t.setupRefresh}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={config.isLoading}
                onClick={() => handleGrantPermission(config.permKey)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {config.isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
                ) : (
                  <Check className="w-4 h-4 text-[#C5A059]" />
                )}
                <span>
                  {wasAttempted ? `${t.setupRetry} (${config.grantButtonText})` : config.grantButtonText}
                </span>
              </button>

              {wasAttempted && (
                <button
                  type="button"
                  onClick={() =>
                    setSkippedPerms((prev) => ({ ...prev, [config.permKey]: true }))
                  }
                  className="py-2.5 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer shrink-0"
                >
                  {t.setupSkip}
                </button>
              )}
            </div>

            {wasAttempted && !isGranted && (
              <p className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/70 rounded-lg px-2.5 py-1.5">
                {selectedLang === 'ar'
                  ? 'لم يتم رصد تفعيل الإذن بعد. يمكنك الضغط على «إعادة المحاولة» للانتقال مباشرة إلى صفحة الإذن، أو الضغط على «تخطي» والمتابعة.'
                  : 'Permission activation not detected yet. Tap "Retry" to open settings directly or "Skip" to proceed.'}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div
      className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-[#F7F6F2] flex flex-col select-none animate-fadeIn overflow-hidden"
      dir={dir}
    >
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col bg-[#F7F6F2] overflow-hidden">
        {/* Full-Screen Top Header */}
        <div className="bg-white text-[#172A28] px-4 pt-5 pb-3.5 shrink-0 shadow-xs border-b border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#104B40] text-[#C5A059] flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                {currentStep}/5
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black font-cairo text-[#172A28]">
                  {stepTitles[currentStep].title}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {stepTitles[currentStep].subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSkipStep}
              className="text-xs text-[#172A28] bg-[#F7F6F2] hover:bg-gray-200 px-3.5 py-2 rounded-xl border border-gray-200 transition-all cursor-pointer font-bold shrink-0"
            >
              {t.setupSkip}
            </button>
          </div>

          {/* 5-Page Progress Bar */}
          <div className="grid grid-cols-5 gap-1.5 mt-3 pt-2.5 border-t border-gray-100">
            {[1, 2, 3, 4, 5].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  if (step > 1 && !extSettings.privacyPolicyAccepted) {
                    setPrivacyError(true);
                    setStatusMessage(
                      selectedLang === 'ar'
                        ? 'يرجى الموافقة على سياسة الخصوصية في الصفحة الأولى أولاً'
                        : 'Please accept the privacy policy on the first page first'
                    );
                    return;
                  }
                  setCurrentStep(step as 1 | 2 | 3 | 4 | 5);
                }}
                className="space-y-1 text-start cursor-pointer"
              >
                <div
                  className={`h-2 rounded-full transition-all ${
                    step < currentStep
                      ? 'bg-[#104B40]'
                      : step === currentStep
                      ? 'bg-[#C5A059]'
                      : 'bg-gray-200'
                  }`}
                />
                <span
                  className={`text-[9.5px] font-bold block truncate ${
                    step === currentStep ? 'text-[#104B40]' : 'text-gray-400'
                  }`}
                >
                  {step === 1
                    ? t.setupStep1Tab
                    : step === 2
                    ? t.setupStep2Tab
                    : step === 3
                    ? t.setupStep3Tab
                    : step === 4
                    ? t.setupStep4Tab
                    : t.setupStep5Tab}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Status Toast Banner */}
        {statusMessage && (
          <div className="bg-[#104B40] text-white text-xs font-bold py-2 px-4 text-center shrink-0 animate-fadeIn">
            {statusMessage}
          </div>
        )}

        {/* Main Scrollable Full-Screen Page Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-right">
          {/* =========================================================
              PAGE 1: اللغة والموقع + سياسة الخصوصية الإجبارية
          ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-3.5">
              {/* 1. Button that opens App Language selection on click */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#9A7732] flex items-center justify-center">
                      <Languages className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-[#172A28]">
                        {t.setupAppLanguage}
                      </h3>
                      <span className="text-[11px] text-gray-500">
                        {t.setupCurrentLang}: {currentLangObj.flag} {currentLangObj.nativeName}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLanguagePicker((v) => !v)}
                    className="px-3.5 py-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>{t.setupChooseLangBtn}</span>
                    {showLanguagePicker ? (
                      <ChevronUp className="w-4 h-4 text-[#C5A059]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#C5A059]" />
                    )}
                  </button>
                </div>

                {showLanguagePicker && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 animate-fadeIn">
                    {SUPPORTED_LANGUAGES.map((l) => {
                      const isSel = selectedLang === l.code;
                      return (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => handleSelectAppLanguage(l.code)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                            isSel
                              ? 'bg-[#ebf5f1] border-[#104B40] text-[#104B40]'
                              : 'bg-[#FAF9F5] border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>
                            {l.flag} {l.nativeName}
                          </span>
                          {isSel && <Check className="w-3.5 h-3.5 text-[#104B40]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Current Location Summary + Button that opens Manual Location Picker */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#104B40] flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block">
                        {t.setupCurrentLocationSelected}:
                      </span>
                      <h3 className="text-sm font-black text-[#172A28]">
                        {selectedCity.name} — {selectedCity.country}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowManualLocationPicker((v) => !v)}
                    className="px-3.5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B08D46] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{t.setupManualLocationBtn}</span>
                    {showManualLocationPicker ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Collapsible Manual Location Selector (Countries, Cities & Offline Egypt Database) */}
                {showManualLocationPicker && (
                  <div className="pt-3 border-t border-gray-100 space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setManualLocationTab('egypt')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                          manualLocationTab === 'egypt'
                            ? 'bg-[#104B40] text-white border-[#104B40]'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {t.setupEgyptGovs}
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualLocationTab('world')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                          manualLocationTab === 'world'
                            ? 'bg-[#104B40] text-white border-[#104B40]'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {t.setupWorldCities} ({worldCountries.length})
                      </button>
                    </div>

                    {manualLocationTab === 'egypt' ? (
                      <div className="space-y-2">
                        <select
                          value={selectedEgyptGovId}
                          onChange={(e) => setSelectedEgyptGovId(e.target.value)}
                          className="w-full p-2.5 text-xs bg-[#FAF9F5] border border-gray-200 rounded-xl font-bold text-[#172A28]"
                        >
                          {EGYPT_GOVERNORATES_DATA.map((gov) => (
                            <option key={gov.id} value={gov.id}>
                              محافظة {gov.name} ({gov.locations.length} مدينة ومركز وقرية)
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={egyptSearchQuery}
                          onChange={(e) => setEgyptSearchQuery(e.target.value)}
                          placeholder="ابحث عن محافظتك أو مدينتك أو مركزك أو قريتك..."
                          className="w-full p-2.5 text-xs bg-[#FAF9F5] border border-gray-200 rounded-xl"
                        />

                        <div className="max-h-48 overflow-y-auto space-y-1 bg-[#FAF9F5] p-1.5 rounded-xl border border-gray-200">
                          {filteredEgyptLocations.map((loc) => (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() =>
                                handleSelectManualCity({
                                  id: loc.id,
                                  name: `${loc.name} (${loc.governorate})`,
                                  country: 'مصر',
                                  latitude: loc.latitude,
                                  longitude: loc.longitude,
                                  timezone: 'Africa/Cairo',
                                })
                              }
                              className={`w-full text-right p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                                selectedCity.id === loc.id
                                  ? 'bg-[#104B40] text-white font-bold'
                                  : 'hover:bg-white text-gray-800'
                              }`}
                            >
                              <span>
                                {loc.name} — <span className="opacity-75">محافظة {loc.governorate}</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-black/10">
                                {loc.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={selectedCountry}
                          onChange={(e) => setSelectedCountry(e.target.value)}
                          className="w-full p-2.5 text-xs bg-[#FAF9F5] border border-gray-200 rounded-xl font-bold text-[#172A28]"
                        >
                          <option value="">🌍 جميع دول العالم ({worldCountries.length} دولة)</option>
                          {worldCountries.map((c) => (
                            <option key={c.country} value={c.country}>
                              [{c.countryCode}] {c.country} ({c.countryEn})
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          placeholder="ابحث عن المدينة أو الدولة (مكة، الرياض، القاهرة، دبي)..."
                          className="w-full p-2.5 text-xs bg-[#FAF9F5] border border-gray-200 rounded-xl"
                        />

                        <div className="max-h-48 overflow-y-auto space-y-1 bg-[#FAF9F5] p-1.5 rounded-xl border border-gray-200">
                          {filteredCities.slice(0, 80).map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => handleSelectManualCity(city)}
                              className={`w-full text-right p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                                selectedCity.id === city.id
                                  ? 'bg-[#104B40] text-white font-bold'
                                  : 'hover:bg-white text-gray-800'
                              }`}
                            >
                              <span>{city.name}</span>
                              <span className="text-[10px] opacity-80">{city.country}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Auto Location Detection using Accurate Location Permission */}
              {renderPermissionActionBox({
                permKey: 'location',
                title: selectedLang === 'ar' ? 'تحديد الموقع تلقائيًا باستخدام إذن الموقع الدقيق (GPS)' : 'Automatic Location via GPS Permission',
                benefitExplanation: t.permLocationBenefitText,
                grantButtonText: t.setupDetectGpsBtn,
                isLoading: detectingGps,
              })}

              {/* 4. Mandatory Privacy Policy Checkbox */}
              <div
                className={`bg-white rounded-2xl p-4 border-2 shadow-xs space-y-2.5 transition-all ${
                  privacyError
                    ? 'border-rose-500 bg-rose-50/30'
                    : extSettings.privacyPolicyAccepted
                    ? 'border-[#104B40]'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={extSettings.privacyPolicyAccepted}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setPrivacyError(false);
                        updateExt((prev) => ({
                          ...prev,
                          privacyPolicyAccepted: checked,
                        }));
                      }}
                      className="w-5 h-5 mt-0.5 accent-[#104B40] rounded cursor-pointer shrink-0"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-black text-[#172A28] block">
                        {t.setupPrivacyTitle}{' '}
                        <span className="text-rose-600 text-[11px] font-bold">
                          {selectedLang === 'ar' ? '(إجباري للمتابعة)' : '(Required)'}
                        </span>
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        {t.setupPrivacyAgreementLabel}
                      </p>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPrivacyDetails((v) => !v)}
                    className="text-[11px] font-bold text-[#104B40] underline shrink-0 cursor-pointer"
                  >
                    {showPrivacyDetails ? t.setupPrivacyHideDetails : t.setupPrivacyViewDetails}
                  </button>
                </div>

                {showPrivacyDetails && (
                  <div className="bg-[#FAF9F5] p-3 rounded-xl border border-gray-200 text-[11px] text-gray-700 leading-relaxed space-y-1">
                    <p>
                      {selectedLang === 'ar'
                        ? '• يعمل التطبيق بنظام Offline-First وجميع الحسابات الفلكية تتم داخل هاتفك.'
                        : '• Offline-First design: all astronomical calculations run locally on device.'}
                    </p>
                    <p>
                      {selectedLang === 'ar'
                        ? '• يُستخدم إذن الموقع الجغرافي حصرياً لحساب مواقيت الصلاة واتجاه القبلة.'
                        : '• Geographic location is strictly used for prayer times and Qibla angle.'}
                    </p>
                    <p>
                      {selectedLang === 'ar'
                        ? '• لا يتم بيع أو إرسال بياناتك الشخصية أو إحداثيات موقعك إلى أي خوادم إعلانية.'
                        : '• Zero tracking: your personal data and coordinates are never shared.'}
                    </p>
                  </div>
                )}

                {privacyError && (
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1 pt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>يجب وضع علامة صح في مربع الموافقة على سياسة الخصوصية للانتقال للصفحة التالية.</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              PAGE 2: التنبيهات والإشعارات
          ========================================================= */}
          {currentStep === 2 && (
            <div className="space-y-3.5">
              {/* 1. Alerts for Fajr, Sunrise, Duha, Dhuhr, Asr, Maghrib, Isha */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-[#104B40]" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-[#172A28]">
                        إعداد تنبيهات الصلوات والشروق والضحى
                      </h3>
                      <span className="text-[11px] text-gray-500">
                        اختر الأوقات التي ترغب في تلقي تنبيهات لها
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'fajr' as const, label: 'تنبيه صلاة الفجر', sub: 'أذان وتنبيه الفجر الصادق' },
                    { key: 'sunrise' as const, label: 'تنبيه الشروق', sub: 'موعد شروق الشمس وانتهاء وقت الفجر' },
                    { key: 'duha' as const, label: 'تنبيه صلاة الضحى', sub: 'صلاة الأوابين بعد الشروق بـ 20 دقيقة' },
                    { key: 'dhuhr' as const, label: 'تنبيه صلاة الظهر', sub: 'أذان وتنبيه صلاة الظهر' },
                    { key: 'asr' as const, label: 'تنبيه صلاة العصر', sub: 'أذان وتنبيه صلاة العصر' },
                    { key: 'maghrib' as const, label: 'تنبيه صلاة المغرب', sub: 'أذان وتنبيه صلاة المغرب والإفطار' },
                    { key: 'isha' as const, label: 'تنبيه صلاة العشاء', sub: 'أذان وتنبيه صلاة العشاء' },
                  ].map((item) => {
                    const isChecked = extSettings.prayerAlerts[item.key];
                    return (
                      <label
                        key={item.key}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#ebf5f1]/70 border-[#104B40]/50'
                            : 'bg-[#FAF9F5] border-gray-200'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold text-[#172A28] block">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-gray-500">{item.sub}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateExt((prev) => ({
                              ...prev,
                              prayerAlerts: {
                                ...prev.prayerAlerts,
                                [item.key]: val,
                              },
                            }));
                          }}
                          className="w-5 h-5 accent-[#104B40] rounded cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. Enable / Disable Azan Notifications & Qiyam al-Layl */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <h3 className="text-xs sm:text-sm font-black text-[#172A28] border-b border-gray-100 pb-2">
                  إشعارات الأذان وتنبيه قيام الليل
                </h3>

                <label className="p-3 rounded-xl bg-[#FAF9F5] border border-gray-200 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-[#104B40]" />
                    <div>
                      <span className="text-xs font-black text-[#172A28] block">
                        تفعيل إشعارات وصوت الأذان الكامل
                      </span>
                      <span className="text-[10px] text-gray-500">
                        تشغيل الأذان وإظهار تنبيه الصلاة عند حلول الوقت
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={extSettings.azanNotificationsEnabled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateExt((prev) => ({
                        ...prev,
                        azanNotificationsEnabled: val,
                      }));
                    }}
                    className="w-5 h-5 accent-[#104B40] rounded cursor-pointer"
                  />
                </label>

                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-gray-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Moon className="w-4 h-4 text-[#9A7732]" />
                      <div>
                        <span className="text-xs font-black text-[#172A28] block">
                          تفعيل تنبيه وإشعارات قيام الليل (الثلث الأخير)
                        </span>
                        <span className="text-[10px] text-gray-500">
                          تذكير يومي بصلاة التهجد والوتر والاستغفار بالأسحار
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={extSettings.qiyamNightAlertEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        updateExt((prev) => ({
                          ...prev,
                          qiyamNightAlertEnabled: val,
                        }));
                      }}
                      className="w-5 h-5 accent-[#104B40] rounded cursor-pointer"
                    />
                  </div>

                  {extSettings.qiyamNightAlertEnabled && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/70">
                      <span className="text-xs font-bold text-gray-700">
                        موعد تنبيه قيام الليل:
                      </span>
                      <input
                        type="time"
                        value={extSettings.qiyamNightTime}
                        onChange={(e) =>
                          updateExt((prev) => ({
                            ...prev,
                            qiyamNightTime: e.target.value,
                          }))
                        }
                        className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Request Notification Permission */}
              {renderPermissionActionBox({
                permKey: 'notifications',
                title: selectedLang === 'ar' ? 'طلب إذن الإشعارات الرسمية' : 'Notification Permission',
                benefitExplanation: t.permNotificationBenefitText,
                grantButtonText: selectedLang === 'ar' ? 'منح إذن الإشعارات الآن' : 'Grant Notification Permission',
              })}
            </div>
          )}

          {/* =========================================================
              PAGE 3: التحكم وشاشة الأذان
          ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-3.5">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <h3 className="text-xs sm:text-sm font-black text-[#172A28] border-b border-gray-100 pb-2">
                  {selectedLang === 'ar' ? 'إعدادات التحكم بالأذان وشاشة الأذان التفاعلية' : 'Azan Controls & Interactive Display'}
                </h3>

                {/* 1. Stop Azan using Volume Down button */}
                <label className="p-3.5 rounded-xl bg-[#FAF9F5] border border-gray-200 flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#104B40] flex items-center justify-center shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black text-[#172A28] block">
                        {t.setupVolDownHeading}
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        {t.setupVolDownDesc}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={extSettings.volumeDownStopsAzan}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateExt((prev) => ({
                        ...prev,
                        volumeDownStopsAzan: val,
                      }));
                    }}
                    className="w-5 h-5 accent-[#104B40] rounded cursor-pointer shrink-0"
                  />
                </label>

                {/* 2. Interactive Azan Screen in Landscape / Horizontal Mode */}
                <label className="p-3.5 rounded-xl bg-[#FAF9F5] border border-gray-200 flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#9A7732] flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4 rotate-90" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black text-[#172A28] block">
                        {t.setupLandscapeHeading}
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        {t.setupLandscapeDesc}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={extSettings.landscapeAzanScreenEnabled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setSmartAzanWidgetEnabled(val);
                      updateExt((prev) => ({
                        ...prev,
                        landscapeAzanScreenEnabled: val,
                      }));
                    }}
                    className="w-5 h-5 accent-[#104B40] rounded cursor-pointer shrink-0"
                  />
                </label>
              </div>

              {/* 3. Request Display Over Other Apps Permission */}
              {renderPermissionActionBox({
                permKey: 'overlay',
                title: selectedLang === 'ar' ? 'طلب إذن الظهور فوق التطبيقات الأخرى' : 'Display Over Other Apps Permission',
                benefitExplanation: t.permOverlayBenefitText,
                grantButtonText: selectedLang === 'ar' ? 'منح إذن الظهور فوق التطبيقات' : 'Grant Overlay Permission',
              })}
            </div>
          )}

          {/* =========================================================
              PAGE 4: العمل في الخلفية
          ========================================================= */}
          {currentStep === 4 && (
            <div className="space-y-3.5">
              {/* 1. Persistent Notification toggle */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <h3 className="text-xs sm:text-sm font-black text-[#172A28] border-b border-gray-100 pb-2">
                  {selectedLang === 'ar' ? 'الإشعار الدائم واستمرارية العمل في الخلفية' : 'Persistent Notification & Background Operation'}
                </h3>

                <label className="p-3.5 rounded-xl bg-[#FAF9F5] border border-gray-200 flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#104B40] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black text-[#172A28] block">
                        {t.setupPersistentHeading}
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        {t.setupPersistentDesc}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={extSettings.persistentNotificationEnabled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateExt((prev) => ({
                        ...prev,
                        persistentNotificationEnabled: val,
                      }));
                    }}
                    className="w-5 h-5 accent-[#104B40] rounded cursor-pointer shrink-0"
                  />
                </label>
              </div>

              {/* 2. Request Battery Optimization Exemption */}
              {renderPermissionActionBox({
                permKey: 'battery',
                title: selectedLang === 'ar' ? 'طلب استثناء التطبيق من تحسينات البطارية' : 'Battery Optimization Exemption',
                benefitExplanation: t.permBatteryBenefitText,
                grantButtonText: selectedLang === 'ar' ? 'منح استثناء تحسينات البطارية' : 'Grant Battery Exemption',
              })}

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 leading-relaxed">
                <strong className="font-black block mb-0.5">
                  {selectedLang === 'ar' ? '✓ الخطوة التالية والأخيرة:' : '✓ Next & Final Step:'}
                </strong>
                {selectedLang === 'ar'
                  ? 'إعداد نافذة الأذان العائمة فوق التطبيقات والظهور على شاشة القفل وإضاءة الشاشة.'
                  : 'Configure floating prayer alerts, lock screen appearance, and exact alarms.'}
              </div>
            </div>
          )}

          {/* =========================================================
              PAGE 5: نافذة الأذان العائمة والظهور على شاشة القفل (Requirement 4)
          ========================================================= */}
          {currentStep === 5 && (
            <div className="space-y-3.5">
              {/* Feature Explanation & 4 Independent Control Switches */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-start gap-2.5 border-b border-gray-100 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#104B40] text-[#C5A059] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[#172A28]">
                      {t.setupFloatingAzanHeading}
                    </h3>
                    <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                      {t.setupFloatingAzanDesc}
                    </p>
                  </div>
                </div>

                {/* 4 Independent Switches (Requirement 6) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="p-3 rounded-xl bg-[#FAF9F5] border border-gray-200 flex items-center justify-between gap-2 cursor-pointer">
                    <div>
                      <span className="text-xs font-black text-[#172A28] block">
                        {t.setupFloatingAzanHeading}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {t.setupFloatingAzanDesc.slice(0, 40)}...
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={extSettings.floatingAzanWindowEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setSmartAzanWidgetEnabled(val);
                        updateExt((prev) => ({
                          ...prev,
                          floatingAzanWindowEnabled: val,
                        }));
                      }}
                      className="w-5 h-5 accent-[#104B40] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-[#FAF9F5] border border-gray-200 flex items-center justify-between gap-2 cursor-pointer">
                    <div>
                      <span className="text-xs font-black text-[#172A28] block">
                        {t.setupLockScreenHeading}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {t.setupLockScreenDesc}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={extSettings.lockScreenAzanEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        updateExt((prev) => ({
                          ...prev,
                          lockScreenAzanEnabled: val,
                        }));
                      }}
                      className="w-5 h-5 accent-[#104B40] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-[#FAF9F5] border border-gray-200 flex items-center justify-between gap-2 cursor-pointer">
                    <div>
                      <span className="text-xs font-black text-[#172A28] block">
                        {t.setupWakeScreenHeading}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {t.setupWakeScreenDesc}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={extSettings.wakeScreenOnAzanEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        updateExt((prev) => ({
                          ...prev,
                          wakeScreenOnAzanEnabled: val,
                        }));
                      }}
                      className="w-5 h-5 accent-[#104B40] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-[#FAF9F5] border border-gray-200 flex items-center justify-between gap-2 cursor-pointer">
                    <div>
                      <span className="text-xs font-black text-[#172A28] block">
                        {selectedLang === 'ar' ? 'تشغيل صوت الأذان' : 'Enable Azan Audio'}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {selectedLang === 'ar' ? 'تشغيل الأذان بالتزامن مع النافذة' : 'Play Azan synchronized with alerts'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={extSettings.azanSoundEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        onToggleAutoPlayAzan?.(val);
                        updateExt((prev) => ({
                          ...prev,
                          azanSoundEnabled: val,
                          azanNotificationsEnabled: val,
                        }));
                      }}
                      className="w-5 h-5 accent-[#104B40] rounded cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              </div>

              {/* 1. Display Over Other Apps (SYSTEM_ALERT_WINDOW) */}
              {renderPermissionActionBox({
                permKey: 'overlay',
                title: selectedLang === 'ar' ? '1. إذن الظهور فوق التطبيقات الأخرى (SYSTEM_ALERT_WINDOW)' : '1. Display Over Other Apps Permission (SYSTEM_ALERT_WINDOW)',
                benefitExplanation: t.permOverlayBenefitText,
                grantButtonText: selectedLang === 'ar' ? 'فتح إعدادات الظهور فوق التطبيقات ومنح الإذن' : 'Open Overlay Settings',
              })}

              {/* 2. Notifications Permission */}
              {renderPermissionActionBox({
                permKey: 'notifications',
                title: selectedLang === 'ar' ? '2. إذن الإشعارات الرسمية (POST_NOTIFICATIONS)' : '2. Notifications Permission (POST_NOTIFICATIONS)',
                benefitExplanation: t.permNotificationBenefitText,
                grantButtonText: selectedLang === 'ar' ? 'منح إذن الإشعارات من إعدادات الهاتف' : 'Grant Notification Permission',
              })}

              {/* 3. Exact Alarms Permission (SCHEDULE_EXACT_ALARM) */}
              {renderPermissionActionBox({
                permKey: 'exact_alarm',
                title: selectedLang === 'ar' ? '3. إذن المنبهات الدقيقة (SCHEDULE_EXACT_ALARM)' : '3. Exact Alarms Permission (SCHEDULE_EXACT_ALARM)',
                benefitExplanation: t.permExactAlarmBenefitText,
                grantButtonText: selectedLang === 'ar' ? 'فتح إعدادات المنبهات الدقيقة ومنح الإذن' : 'Open Exact Alarms Settings',
              })}

              {/* 4. Lock Screen Display Permission (USE_FULL_SCREEN_INTENT) */}
              {renderPermissionActionBox({
                permKey: 'lock_screen',
                title: selectedLang === 'ar' ? '4. إذن الظهور على شاشة القفل وإضاءة الشاشة (Full Screen Intent)' : '4. Lock Screen Display Permission (Full Screen Intent)',
                benefitExplanation: t.permLockScreenBenefitText,
                grantButtonText: selectedLang === 'ar' ? 'فتح إعدادات شاشة القفل ومنح الإذن' : 'Open Lock Screen Settings',
              })}

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 leading-relaxed">
                <strong className="font-black block mb-0.5">
                  {selectedLang === 'ar' ? '✓ ملاحظة مهمة:' : '✓ Important Note:'}
                </strong>
                {selectedLang === 'ar'
                  ? 'يمكنك تخطي هذه الصفحة الآن وتفعيل أو تعديل أي ميزة أو إذن لاحقًا من داخل صفحة الإعدادات، وستعمل بقية وظائف التطبيق بصورة طبيعية تمامًا.'
                  : 'You can skip this page now and configure any permission or setting later in Settings, while all other app features remain fully operational.'}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar: Previous | Skip | Next / Finish */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5)}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1 transition-all cursor-pointer"
              >
                {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{t.setupBack}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSkipStep}
              className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
            >
              {t.setupSkip}
            </button>
          </div>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="py-2.5 px-6 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>{t.setupNext}</span>
              {dir === 'rtl' ? <ChevronLeft className="w-4 h-4 text-[#C5A059]" /> : <ChevronRight className="w-4 h-4 text-[#C5A059]" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishSetup}
              className="py-2.5 px-7 rounded-xl bg-gradient-to-r from-[#104B40] to-[#0B3D35] hover:opacity-95 text-[#C5A059] text-xs sm:text-sm font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.setupFinish}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
