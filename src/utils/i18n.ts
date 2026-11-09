export type AppLanguage = 'ar' | 'en' | 'fr' | 'tr' | 'ur' | 'id' | 'es' | 'ru';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  dir: 'rtl' | 'ltr';
  flag: string;
  regionLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'ar',
    name: 'العربية',
    nativeName: 'العربية',
    dir: 'rtl',
    flag: '🇸🇦',
    regionLabel: 'اللغة الافتراضية • الشرق الأوسط وشمال أفريقيا',
  },
  {
    code: 'en',
    name: 'الإنجليزية',
    nativeName: 'English',
    dir: 'ltr',
    flag: '🇬🇧',
    regionLabel: 'International • Global',
  },
  {
    code: 'fr',
    name: 'الفرنسية',
    nativeName: 'Français',
    dir: 'ltr',
    flag: '🇫🇷',
    regionLabel: 'Europe & Afrique Francophone',
  },
  {
    code: 'tr',
    name: 'التركية',
    nativeName: 'Türkçe',
    dir: 'ltr',
    flag: '🇹🇷',
    regionLabel: 'Türkiye & Avrupa',
  },
  {
    code: 'ur',
    name: 'الأردية',
    nativeName: 'اردو',
    dir: 'rtl',
    flag: '🇵🇰',
    regionLabel: 'پاکستان اور جنوبی ایشیا',
  },
  {
    code: 'id',
    name: 'الإندونيسية',
    nativeName: 'Bahasa Indonesia',
    dir: 'ltr',
    flag: '🇮🇩',
    regionLabel: 'Indonesia & Asia Tenggara',
  },
  {
    code: 'es',
    name: 'الإسبانية',
    nativeName: 'Español',
    dir: 'ltr',
    flag: '🇪🇸',
    regionLabel: 'España y América Latina',
  },
  {
    code: 'ru',
    name: 'الروسية',
    nativeName: 'Русский',
    dir: 'ltr',
    flag: '🇷🇺',
    regionLabel: 'Россия и СНГ',
  },
];

const LANGUAGE_STORAGE_KEY = 'moazen_app_language_v1';
const LANGUAGE_INITIALIZED_KEY = 'moazen_app_language_initialized_v1';

/**
 * Automatically detects the phone/browser language on first launch
 */
export function detectDeviceLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') return 'ar';
  const rawLangs = navigator.languages ? [...navigator.languages] : [navigator.language || 'ar'];
  for (const raw of rawLangs) {
    const code = raw.toLowerCase().split('-')[0] as AppLanguage;
    if (SUPPORTED_LANGUAGES.some((l) => l.code === code)) {
      return code;
    }
  }
  return 'ar';
}

export function getSavedLanguage(): AppLanguage {
  try {
    const initialized = localStorage.getItem(LANGUAGE_INITIALIZED_KEY);
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null;
    if (initialized === 'true' && saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
    // First run: auto-detect phone language and save it
    const detected = detectDeviceLanguage();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, detected);
    localStorage.setItem(LANGUAGE_INITIALIZED_KEY, 'true');
    return detected;
  } catch {
    return 'ar';
  }
}

export function setSavedLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    localStorage.setItem(LANGUAGE_INITIALIZED_KEY, 'true');
    applyDocumentDirection(lang);
    window.dispatchEvent(new CustomEvent('appLanguageChanged', { detail: lang }));
  } catch {
    // ignore
  }
}

export function getLanguageDirection(lang: AppLanguage): 'rtl' | 'ltr' {
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  return found ? found.dir : 'rtl';
}

export function applyDocumentDirection(lang: AppLanguage): void {
  if (typeof document === 'undefined') return;
  const dir = getLanguageDirection(lang);
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export interface TranslationDictionary {
  appName: string;
  appTagline: string;
  ayahHeader: string;
  ayahSource: string;
  // Prayers
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  remainingForPrayer: string;
  iqamaLabel: string;
  remainingLabel: string;
  // Home Widgets
  quranTitle: string;
  pageOfTotal: (page: number) => string;
  continueReading: string;
  hadithOfTheDay: string;
  readMore: string;
  azkarAndDua: string;
  azkarSubtitle: string;
  viewAzkar: string;
  islamicEvents: string;
  viewEvents: string;
  // Feature Grid
  featQuran: string;
  featQuranSub: string;
  featPrayer: string;
  featPrayerSub: string;
  featQibla: string;
  featQiblaSub: string;
  featProphets: string;
  featProphetsSub: string;
  featSeerah: string;
  featSeerahSub: string;
  featAzkar: string;
  featAzkarSub: string;
  featHadith: string;
  featHadithSub: string;
  featTasbih: string;
  featTasbihSub: string;
  featNames: string;
  featNamesSub: string;
  featMasajid: string;
  featMasajidSub: string;
  featWallpapers: string;
  featWallpapersSub: string;
  featDua: string;
  featDuaSub: string;
  featRecitations: string;
  featRecitationsSub: string;
  featRuqyah: string;
  featRuqyahSub: string;
  featQuiz: string;
  featQuizSub: string;
  featRamadan: string;
  featRamadanSub: string;
  featHajj: string;
  featHajjSub: string;
  featMore: string;
  featMoreSub: string;
  collapseSections: string;
  expandSections: string;
  // Common Labels
  todayPrefix: string;
  gregorianPrefix: string;
  stopBtn: string;
  closeBtn: string;
  azanAlertTitle: (prayer: string) => string;
  azanAlertSub: string;
  iqamaAlertTitle: (prayer: string) => string;
  iqamaAlertSub: string;
  // Bottom Nav
  navHome: string;
  navPrayer: string;
  navQuran: string;
  navQibla: string;
  navSettings: string;
  // Settings Items (Ordered 1 to 10)
  settingsTitle: string;
  settingsProfile: string;
  settingsProfileSub: string;
  settingsPermissions: string;
  settingsPermissionsSub: string;
  settingsLocationTime: string;
  settingsLocationTimeSub: string;
  settingsLanguage: string;
  settingsLanguageSub: string;
  settingsAzan: string;
  settingsAzanSub: string;
  settingsAzkar: string;
  settingsAzkarSub: string;
  settingsRamadan: string;
  settingsRamadanSub: string;
  settingsPrivacy: string;
  settingsPrivacySub: string;
  settingsAbout: string;
  settingsAboutSub: string;
  settingsLogout: string;
  settingsLogoutSub: string;
  // Daylight Saving Time
  dstTitle: string;
  dstAuto: string;
  dstSummer: string;
  dstWinter: string;
  dstActiveNote: string;
  dstStandardNote: string;
  // Approaching Prayer & Persistent Notification
  approachingPrayerTitle: (prayer: string) => string;
  approachingPrayerBody: (prayer: string, minutes: number, city: string) => string;
  approachingPrayerBadge: string;
  openMuezzinBtn: string;
  persistentPrayerTitle: (prayer: string, time: string) => string;
  persistentPrayerBody: (remaining: string, city: string) => string;
  // First Time Setup Full Localization
  setupStep: string;
  setupSkip: string;
  setupNext: string;
  setupBack: string;
  setupFinish: string;
  setupRetry: string;
  setupRefresh: string;
  setupActivated: string;
  setupPending: string;
  setupSkipped: string;
  setupGrantedSuccess: string;
  setupBenefitWhy: string;
  setupStep1Title: string;
  setupStep1Sub: string;
  setupStep1Tab: string;
  setupStep2Title: string;
  setupStep2Sub: string;
  setupStep2Tab: string;
  setupStep3Title: string;
  setupStep3Sub: string;
  setupStep3Tab: string;
  setupStep4Title: string;
  setupStep4Sub: string;
  setupStep4Tab: string;
  setupStep5Title: string;
  setupStep5Sub: string;
  setupStep5Tab: string;
  setupAppLanguage: string;
  setupCurrentLang: string;
  setupChooseLangBtn: string;
  setupLocationTitle: string;
  setupCurrentLocationSelected: string;
  setupDetectGpsBtn: string;
  setupDetectingGps: string;
  setupManualLocationBtn: string;
  setupEgyptGovs: string;
  setupWorldCities: string;
  setupSearchPlaceholder: string;
  setupPrivacyTitle: string;
  setupPrivacyAgreementLabel: string;
  setupPrivacyMustAgreeError: string;
  setupPrivacyViewDetails: string;
  setupPrivacyHideDetails: string;
  setupPrayerAlertsHeading: string;
  setupQiyamNightHeading: string;
  setupVolDownHeading: string;
  setupVolDownDesc: string;
  setupLandscapeHeading: string;
  setupLandscapeDesc: string;
  setupPersistentHeading: string;
  setupPersistentDesc: string;
  setupFloatingAzanHeading: string;
  setupFloatingAzanDesc: string;
  setupLockScreenHeading: string;
  setupLockScreenDesc: string;
  setupWakeScreenHeading: string;
  setupWakeScreenDesc: string;
  setupExactAlarmHeading: string;
  setupExactAlarmDesc: string;
  permLocationBenefitText: string;
  permNotificationBenefitText: string;
  permOverlayBenefitText: string;
  permBatteryBenefitText: string;
  permExactAlarmBenefitText: string;
  // Zakat Calculator
  zakatTitle: string;
  zakatSubtitle: string;
  zakatCash: string;
  zakatGold24: string;
  zakatGold21: string;
  zakatGold18: string;
  zakatSilver: string;
  zakatTradeGoods: string;
  zakatDebts: string;
  zakatGoldGramPrice: string;
  zakatSilverGramPrice: string;
  zakatFitrTitle: string;
  zakatFitrMembers: string;
  zakatFitrPerPerson: string;
  zakatFitrTotal: string;
  zakatNisabStandard: string;
  zakatNisabGoldStandard: string;
  zakatNisabSilverStandard: string;
  zakatTotalWealth: string;
  zakatNisabThreshold: string;
  zakatDue: string;
  zakatNisabMet: string;
  zakatNisabNotMet: string;
  zakatCalculationBreakdown: string;
  // Smart Sheikh Quran Tutor
  sheikhTitle: string;
  sheikhSubtitle: string;
  sheikhTabLabel: string;
  sheikhVoiceDialect: string;
  sheikhVoiceEgyptian: string;
  sheikhVoiceFusha: string;
  sheikhReciter: string;
  sheikhReciterHussary: string;
  sheikhReciterAfasy: string;
  sheikhReciterAbdulBasit: string;
  sheikhRepeatLabel: string;
  sheikhRepeat1: string;
  sheikhRepeat3: string;
  sheikhRepeat5: string;
  sheikhRepeat7: string;
  sheikhRepeatInfinite: string;
  sheikhStartTalqeen: string;
  sheikhStopTalqeen: string;
  sheikhStartMic: string;
  sheikhStopMic: string;
  sheikhListening: string;
  sheikhEvaluating: string;
  sheikhQuizMode: string;
  sheikhQuizHideAyah: string;
  sheikhQuizCompleteAyah: string;
  sheikhQuizRandom: string;
  sheikhTajweedRules: string;
  sheikhTajweedMakharij: string;
  sheikhTajweedGhunnah: string;
  sheikhTajweedMadd: string;
  sheikhTajweedQalqalah: string;
  sheikhProgressScore: string;
  sheikhVersesMastered: string;
  sheikhEncouragementGood: string;
  sheikhEncouragementTryAgain: string;
  sheikhOpenFromQuran: string;
  // Common Settings Nav
  settingsBack: string;
  settingsSaveSuccess: string;
  settingsResetConfirm: string;
  settingsResetDesc: string;
  settingsResetDone: string;
  settingsResetCancel: string;
  settingsResetBtn: string;
  settingsDone: string;
  settingsCitySearch: string;
  settingsSelectGov: string;
  settingsSelectCity: string;
  settingsGpsActive: string;
  settingsManualActive: string;
  settingsEgyptActive: string;
  settingsWorldActive: string;
  settingsAzanAudition: string;
  settingsIqamaAudition: string;
  settingsAzkarSabahTime: string;
  settingsAzkarMassaTime: string;
  settingsSalawatInterval: string;
  settingsRamadanCannon: string;
  settingsRamadanMusaharati: string;
  settingsRamadanFasting: string;
  settingsBatterySavingTitle: string;
  settingsBatterySavingDesc: string;
  settingsOverlayTitle: string;
  settingsOverlayDesc: string;
  settingsAlarmTitle: string;
  settingsAlarmDesc: string;
  permLockScreenBenefitText: string;
}

const EXTRA_STRINGS_AR = {
  // Approaching Prayer & Persistent Notification
  approachingPrayerTitle: (p: string) => `اقتربت صلاة ${p}`,
  approachingPrayerBody: (p: string, mins: number, city: string) => `متبقي حوالي ${mins} دقائق على موعد أذان ${p} في ${city}`,
  approachingPrayerBadge: 'تنبيه اقتراب الصلاة',
  openMuezzinBtn: 'فتح تطبيق المؤذن',
  persistentPrayerTitle: (p: string, time: string) => `الصلاة القادمة: صلاة ${p} (${time})`,
  persistentPrayerBody: (rem: string, city: string) => `متبقي: ${rem} • ${city}`,

  // First Time Setup Full Localization
  setupStep: 'خطوة',
  setupSkip: 'تخطي الآن',
  setupNext: 'المتابعة للخطوة التالية',
  setupBack: 'رجوع',
  setupFinish: 'إنهاء وبدء استخدام المؤذن',
  setupRetry: 'إعادة المحاولة',
  setupRefresh: 'تحديث',
  setupActivated: 'مفعّلة وجاهزة',
  setupPending: 'بانتظار التفعيل',
  setupSkipped: 'تم التخطي',
  setupGrantedSuccess: 'تم منح الإذن بنجاح والتطبيق جاهز للعمل بدقة.',
  setupBenefitWhy: 'لماذا يحتاج المؤذن هذا الإذن؟',
  setupStep1Title: 'اللغة والموقع والخصوصية',
  setupStep1Sub: 'حدد لغتك ومدينتك لتطبيق مواقيت الصلاة الصحيحة',
  setupStep1Tab: 'اللغة والموقع',
  setupStep2Title: 'إشعار الأذان والشاشة الدائمة',
  setupStep2Sub: 'صلاحية إشعارات الهاتف وعرض الصلاة القادمة في الستارة',
  setupStep2Tab: 'الإشعارات الدائمة',
  setupStep3Title: 'الظهور فوق التطبيقات وشاشة القفل',
  setupStep3Sub: 'تنبيه اقتراب الصلاة العائم ونافذة الأذان عند الإغلاق',
  setupStep3Tab: 'النافذة العائمة',
  setupStep4Title: 'الاستثناء من توفير البطارية',
  setupStep4Sub: 'لضمان انطلاق الأذان في موعده بالثانية دون تأخير',
  setupStep4Tab: 'استقرار الخلفية',
  setupStep5Title: 'مراجعة الإعدادات ومميزات المؤذن',
  setupStep5Sub: 'جاهزية الأذان، الإقامة، والورد اليومي والتنبيهات',
  setupStep5Tab: 'المراجعة النهائية',
  setupAppLanguage: 'لغة التطبيق',
  setupCurrentLang: 'اللغة الحالية',
  setupChooseLangBtn: 'تغيير اللغة',
  setupLocationTitle: 'موقعك لحساب المواقيت',
  setupCurrentLocationSelected: 'الموقع المعتمد حالياً',
  setupDetectGpsBtn: 'تحديد الموقع تلقائياً (GPS)',
  setupDetectingGps: 'جاري تحديد الموقع...',
  setupManualLocationBtn: 'اختيار محافظة / مدينة يدوياً',
  setupEgyptGovs: 'محافظات جمهورية مصر العربية',
  setupWorldCities: 'عواصم ومدن العالم الإسلامي',
  setupSearchPlaceholder: 'ابحث عن مدينتك أو محافظتك...',
  setupPrivacyTitle: 'سياسة الخصوصية وأمان البيانات',
  setupPrivacyAgreementLabel: 'قرأت وأوافق على سياسة الخصوصية واستخدام التطبيق محلياً دون مشاركة بياناتي الشخصية',
  setupPrivacyMustAgreeError: 'يرجى الموافقة على سياسة الخصوصية للمتابعة',
  setupPrivacyViewDetails: 'عرض تفاصيل الخصوصية',
  setupPrivacyHideDetails: 'إخفاء التفاصيل',
  setupPrayerAlertsHeading: 'تنبيهات مواقيت الصلاة الخمس',
  setupQiyamNightHeading: 'قيام الليل والوتر وسنن اليوم',
  setupVolDownHeading: 'كتم الأذان عند خفض الصوت أو قلب الهاتف',
  setupVolDownDesc: 'إمكانية إيقاف صوت الأذان فوراً بزر خفض الصوت أو تحريك الهاتف',
  setupLandscapeHeading: 'وضع العرض الأفقي للمساجد والمنازل',
  setupLandscapeDesc: 'شاشة إلكترونية متكاملة لمواقيت الصلاة بتصميم احترافي',
  setupPersistentHeading: 'الإشعار الدائم في ستارة الهاتف',
  setupPersistentDesc: 'شريط دائم يعرض الصلاة القادمة والعد التنازلي بالثواني',
  setupFloatingAzanHeading: 'إشعار عائم قبل الصلاة بـ 10 دقائق',
  setupFloatingAzanDesc: 'نافذة تطفو فوق جميع التطبيقات تذكرك باقتراب وقت الصلاة',
  setupLockScreenHeading: 'إيقاظ شاشة القفل عند الأذان',
  setupLockScreenDesc: 'إضاءة الشاشة وعرض تنبيه الصلاة حتى لو كان الهاتف مقفلاً',
  setupWakeScreenHeading: 'التنبيه الصوتي الكامل حتى في وضع السكون',
  setupWakeScreenDesc: 'تشغيل صوت الأذان المختار بدقة دون تقطيع من نظام التشغيل',
  setupExactAlarmHeading: 'جدولة المنبهات الدقيقة (Exact Alarms)',
  setupExactAlarmDesc: 'حجز المواعيد بالثانية لرفع الأذان بموعده المعتمد فلكياً',
  permLocationBenefitText: 'تحديد إحداثيات موقعك الجغرافي لحساب مواقيت الصلاة وزاوية اتجاه القبلة بدقة متناهية حسب منطقتك.',
  permNotificationBenefitText: 'إرسال إشعارات الأذان في موعده، وتثبيت الإشعار الدائم في ستارة الإشعارات لبيان الصلاة القادمة والوقت المتبقي.',
  permOverlayBenefitText: 'إظهار نافذة التنبيه العائمة قبل موعد كل صلاة بـ 10 دقائق فوق الشاشة الرئيسية وكافة التطبيقات تلقائياً.',
  permBatteryBenefitText: 'استثناء تطبيق المؤذن من توفير الطاقة وتحسين البطارية حتى لا يوقفه نظام الأندرويد في الخلفية وقت الأذان.',
  permExactAlarmBenefitText: 'استخدام مؤقتات النظام عالية الدقة (Exact Alarms) لإطلاق الأذان في نفس ثانية دخول الوقت تماماً دون أي تأخير.',
  // Zakat Calculator
  zakatTitle: "حاسبة الزكاة الشرعية",
  zakatSubtitle: "احسب زكاة المال، الذهب، الفضة، عروض التجارة، وزكاة الفطر بدقة شرعية",
  zakatCash: "الأموال النقدية والودائع البنكية",
  zakatGold24: "ذهب عيار 24 (جرام)",
  zakatGold21: "ذهب عيار 21 (جرام)",
  zakatGold18: "ذهب عيار 18 (جرام)",
  zakatSilver: "الفضة الخالصة (جرام)",
  zakatTradeGoods: "قيمة البضائع وعروض التجارة",
  zakatDebts: "الديون المستحقة عليك (تُخصم من الوعاء)",
  zakatGoldGramPrice: "سعر جرام الذهب عيار 24",
  zakatSilverGramPrice: "سعر جرام الفضة",
  zakatFitrTitle: "زكاة الفطر المباركة",
  zakatFitrMembers: "عدد أفراد الأسرة المستحق عنهم",
  zakatFitrPerPerson: "قيمة الصاع / الفرد المقدرة نقدياً",
  zakatFitrTotal: "إجمالي زكاة الفطر المستحقة",
  zakatNisabStandard: "معيار النصاب الشرعي",
  zakatNisabGoldStandard: "نصاب الذهب (85 جرام عيار 24)",
  zakatNisabSilverStandard: "نصاب الفضة (595 جرام فضة)",
  zakatTotalWealth: "إجمالي الوعاء الزكوي الخاضع للزكاة",
  zakatNisabThreshold: "قيمة النصاب الشرعي المعتمد",
  zakatDue: "مقدار الزكاة الواجب إخراجها (2.5%)",
  zakatNisabMet: "بلغ النصاب الشرعي وتجب فيه الزكاة بعد حولان الحول",
  zakatNisabNotMet: "لم يبلغ النصاب الشرعي بعد - لا تجب الزكاة",
  zakatCalculationBreakdown: "تفاصيل المعادلة الشرعية",
  // Smart Sheikh Quran Tutor
  sheikhTitle: "معلم ومحفظ القرآن الذكي AI (شيخي)",
  sheikhSubtitle: "تلقين بصوت كبار القراء، استماع ذكي عبر الميكروفون، وتصحيح الأحكام والتجويد كلمة بكلمة",
  sheikhTabLabel: "معلم القرآن AI (شيخي)",
  sheikhVoiceDialect: "لهجة تفاعل الشيخ",
  sheikhVoiceEgyptian: "اللهجة المصرية الأصيلة",
  sheikhVoiceFusha: "اللغة العربية الفصحى",
  sheikhReciter: "القارئ المعلم للتلقين",
  sheikhReciterHussary: "الشيخ محمود خليل الحصري (معلم متقن)",
  sheikhReciterAfasy: "الشيخ مشاري راشد العفاسي",
  sheikhReciterAbdulBasit: "الشيخ عبد الباسط عبد الصمد (مرتل)",
  sheikhRepeatLabel: "تكرار الآية للتثبيت",
  sheikhRepeat1: "مرة واحدة",
  sheikhRepeat3: "3 مرات",
  sheikhRepeat5: "5 مرات",
  sheikhRepeat7: "7 مرات",
  sheikhRepeatInfinite: "تكرار مستمر",
  sheikhStartTalqeen: "بدء التلقين واستماع الشيخ",
  sheikhStopTalqeen: "إيقاف التلقين",
  sheikhStartMic: "تسميع عبر الميكروفون",
  sheikhStopMic: "إيقاف التسميع والتحليل",
  sheikhListening: "جاري الاستماع لقراءتك المباركة...",
  sheikhEvaluating: "جاري مقارنة قراءتك بالنص القرآني المعتمد...",
  sheikhQuizMode: "اختبارات الحفظ الذكية",
  sheikhQuizHideAyah: "إخفاء الآية كاملة والتسميع غيباً",
  sheikhQuizCompleteAyah: "إكمال أواخر الآيات الكريمة",
  sheikhQuizRandom: "اختبار عشوائي في السورة",
  sheikhTajweedRules: "أحكام التجويد ومخارج الحروف",
  sheikhTajweedMakharij: "مخارج الحروف وصفاتها",
  sheikhTajweedGhunnah: "أحكام النون الساكنة والتنوين والغنة",
  sheikhTajweedMadd: "أحكام المدود (الطبيعي والفرعي)",
  sheikhTajweedQalqalah: "حروف القلقلة (قطب جد)",
  sheikhProgressScore: "نسبة الإتقان وسجل التكرار",
  sheikhVersesMastered: "الآيات المتقنة",
  sheikhEncouragementGood: "ما شاء الله تبارك الله، قراءة ممتازة ومتقنة!",
  sheikhEncouragementTryAgain: "أحسنت المحاولة! انتبه للكلمات المحددة باللون وكررها لإتقانها.",
  sheikhOpenFromQuran: "تلقين وتسميع مع شيخي",
  // Settings Common Subviews
  settingsBack: "رجوع للإعدادات",
  settingsSaveSuccess: "تم حفظ التغييرات بنجاح ✓",
  settingsResetConfirm: "تأكيد إعادة تعيين التطبيق",
  settingsResetDesc: "هل أنت متأكد من رغبتك في إعادة ضبط جميع الإعدادات والعودة إلى شاشة الإعداد الأولية؟",
  settingsResetDone: "تمت استعادة الإعدادات الأولية بنجاح",
  settingsResetCancel: "إلغاء",
  settingsResetBtn: "إعادة الضبط الآن",
  settingsDone: "تم",
  settingsCitySearch: "ابحث عن المدينة أو العاصمة...",
  settingsSelectGov: "اختر المحافظة المصرية",
  settingsSelectCity: "اختر المركز أو المدينة",
  settingsGpsActive: "تحديد الموقع التلقائي عبر GPS",
  settingsManualActive: "التحديد اليدوي للمدينة",
  settingsEgyptActive: "محافظات ومدن جمهورية مصر العربية",
  settingsWorldActive: "عواصم ومدن العالم الإسلامي والدولي",
  settingsAzanAudition: "معاينة صوت الأذان",
  settingsIqamaAudition: "معاينة صوت الإقامة",
  settingsAzkarSabahTime: "موعد أذكار الصباح",
  settingsAzkarMassaTime: "موعد أذكار المساء",
  settingsSalawatInterval: "تكرار التنبيه بالصلاة على النبي ﷺ",
  settingsRamadanCannon: "مدفع الإفطار قبل المغرب (16 ثانية)",
  settingsRamadanMusaharati: "نداء المسحراتي قبل الفجر",
  settingsRamadanFasting: "حساب ساعات الصيام ومواقيت الإمساك",
  settingsBatterySavingTitle: "تجاهل تحسين استهلاك البطارية",
  settingsBatterySavingDesc: "لضمان استمرار تشغيل الأذان والأذكار في موعدها الدقيق بالخلفية",
  settingsOverlayTitle: "الظهور فوق التطبيقات",
  settingsOverlayDesc: "لعرض تنبيه اقتراب الصلاة العائم ونافذة الأذان عند استخدام تطبيقات أخرى",
  settingsAlarmTitle: "المنبهات الدقيقة وجدولة التنبيهات",
  settingsAlarmDesc: "لتشغيل صوت الأذان في نفس ثانية دخول الوقت بدقة بالغة",
  permLockScreenBenefitText: 'إضاءة الشاشة عند دخول وقت الصلاة وعرض واجهة الأذان مباشرة لتعطيل الصوت أو معرفة موعد الإقامة بسهولة.',
};

const EXTRA_STRINGS_EN = {
  // Approaching Prayer & Persistent Notification
  approachingPrayerTitle: (p: string) => `${p} Prayer is Approaching`,
  approachingPrayerBody: (p: string, mins: number, city: string) => `Approximately ${mins} minutes remaining until ${p} Azan in ${city}`,
  approachingPrayerBadge: 'Upcoming Prayer Alert',
  openMuezzinBtn: 'Open Islamic Muezzin',
  persistentPrayerTitle: (p: string, time: string) => `Next Prayer: ${p} (${time})`,
  persistentPrayerBody: (rem: string, city: string) => `Remaining: ${rem} • ${city}`,

  // First Time Setup Full Localization
  setupStep: 'Step',
  setupSkip: 'Skip for now',
  setupNext: 'Continue to Next Step',
  setupBack: 'Back',
  setupFinish: 'Finish & Start Using Muezzin',
  setupRetry: 'Retry',
  setupRefresh: 'Refresh',
  setupActivated: 'Active & Ready',
  setupPending: 'Pending Activation',
  setupSkipped: 'Skipped',
  setupGrantedSuccess: 'Permission granted successfully and the app is ready for accurate alerts.',
  setupBenefitWhy: 'Why does Muezzin need this permission?',
  setupStep1Title: 'Language, Location & Privacy',
  setupStep1Sub: 'Set your language and city for accurate prayer timings',
  setupStep1Tab: 'Language & Location',
  setupStep2Title: 'Azan Notifications & Persistent Shade',
  setupStep2Sub: 'System notification permission and next prayer display in phone shade',
  setupStep2Tab: 'Notifications',
  setupStep3Title: 'Display Over Apps & Lock Screen',
  setupStep3Sub: 'Floating 10-minute upcoming alert and full-screen Azan window',
  setupStep3Tab: 'Floating Window',
  setupStep4Title: 'Battery Optimization Exemption',
  setupStep4Sub: 'Ensure Azan triggers on the exact second without system sleep delay',
  setupStep4Tab: 'Background Stability',
  setupStep5Title: 'Review Settings & App Features',
  setupStep5Sub: 'Readiness of Azan, Iqama, daily Wird and smart reminders',
  setupStep5Tab: 'Final Review',
  setupAppLanguage: 'App Language',
  setupCurrentLang: 'Current Language',
  setupChooseLangBtn: 'Change Language',
  setupLocationTitle: 'Your Location for Prayer Calculation',
  setupCurrentLocationSelected: 'Currently Selected Location',
  setupDetectGpsBtn: 'Detect Location Automatically (GPS)',
  setupDetectingGps: 'Detecting Location...',
  setupManualLocationBtn: 'Choose Governorate / City Manually',
  setupEgyptGovs: 'Governorates of Egypt',
  setupWorldCities: 'Islamic World & International Capitals',
  setupSearchPlaceholder: 'Search for city or governorate...',
  setupPrivacyTitle: 'Privacy Policy & Data Security',
  setupPrivacyAgreementLabel: 'I have read and agree to the Privacy Policy and acknowledge local-only processing without personal data sharing',
  setupPrivacyMustAgreeError: 'Please agree to the privacy policy to proceed',
  setupPrivacyViewDetails: 'View Privacy Details',
  setupPrivacyHideDetails: 'Hide Details',
  setupPrayerAlertsHeading: 'Five Daily Prayer Alerts',
  setupQiyamNightHeading: 'Qiyam Al-Layl, Witr & Sunan Reminders',
  setupVolDownHeading: 'Mute Azan via Volume Down or Flip Phone',
  setupVolDownDesc: 'Instantly silence Azan audio by pressing volume down or turning phone face down',
  setupLandscapeHeading: 'Landscape Display Mode for Mosques & Homes',
  setupLandscapeDesc: 'Comprehensive digital display board for prayer times with clean visuals',
  setupPersistentHeading: 'Persistent Notification in Phone Shade',
  setupPersistentDesc: 'Live status bar notification showing next prayer with real-time countdown',
  setupFloatingAzanHeading: 'Floating Alert 10 Minutes Before Prayer',
  setupFloatingAzanDesc: 'Floating overlay window reminding you to prepare for prayer before Azan',
  setupLockScreenHeading: 'Wake Lock Screen on Azan Call',
  setupLockScreenDesc: 'Illuminates screen and presents Azan banner even when phone is locked',
  setupWakeScreenHeading: 'Full Audio Alert in Doze & Silent Modes',
  setupWakeScreenDesc: 'Plays selected Muezzin voice accurately without OS interruptions',
  setupExactAlarmHeading: 'Exact Alarms Scheduling',
  setupExactAlarmDesc: 'Schedules precise OS alarms down to the second for astronomical prayer times',
  permLocationBenefitText: 'Determines your geographic coordinates to calculate astronomical prayer times and accurate Qibla angle for your city.',
  permNotificationBenefitText: 'Delivers Azan audio alerts on time and maintains a persistent notification in the phone shade with a live countdown.',
  permOverlayBenefitText: 'Presents an automatic floating alert window 10 minutes before each prayer over the home screen and active apps.',
  permBatteryBenefitText: 'Exempts Islamic Muezzin from battery restrictions so Android does not kill or freeze background prayer timers.',
  permExactAlarmBenefitText: 'Schedules high-precision exact alarms to trigger Azan audio at the exact second prayer begins without delay.',
  // Zakat Calculator
  zakatTitle: "Islamic Zakat Calculator",
  zakatSubtitle: "Accurately calculate Zakat on wealth, gold, silver, trade goods, and Zakat al-Fitr",
  zakatCash: "Cash in hand & Bank deposits",
  zakatGold24: "Gold 24 Karat (Grams)",
  zakatGold21: "Gold 21 Karat (Grams)",
  zakatGold18: "Gold 18 Karat (Grams)",
  zakatSilver: "Pure Silver (Grams)",
  zakatTradeGoods: "Value of Trade Merchandise",
  zakatDebts: "Debts owed to others (Deducted)",
  zakatGoldGramPrice: "Gold 24k Price per Gram",
  zakatSilverGramPrice: "Silver Price per Gram",
  zakatFitrTitle: "Zakat al-Fitr",
  zakatFitrMembers: "Number of Family Members",
  zakatFitrPerPerson: "Estimated Cash Value per Person",
  zakatFitrTotal: "Total Zakat al-Fitr Due",
  zakatNisabStandard: "Nisab Standard",
  zakatNisabGoldStandard: "Gold Nisab (85g 24k Gold)",
  zakatNisabSilverStandard: "Silver Nisab (595g Pure Silver)",
  zakatTotalWealth: "Total Zakatable Wealth",
  zakatNisabThreshold: "Applicable Nisab Threshold",
  zakatDue: "Zakat Due to Pay (2.5%)",
  zakatNisabMet: "Nisab reached! Zakat is due after holding for one lunar year.",
  zakatNisabNotMet: "Below Nisab threshold. Zakat is not due.",
  zakatCalculationBreakdown: "Calculation Breakdown",
  // Smart Sheikh Quran Tutor
  sheikhTitle: "My Sheikh – Smart Quran Tutor",
  sheikhSubtitle: "Recitation coaching with master reciters, real-time microphone listening, and word-by-word Tajweed evaluation",
  sheikhTabLabel: "Sheikh Tutor",
  sheikhVoiceDialect: "Sheikh Voice Dialect",
  sheikhVoiceEgyptian: "Authentic Egyptian Arabic",
  sheikhVoiceFusha: "Modern Standard Arabic (Fusha)",
  sheikhReciter: "Master Reciter for Repetition",
  sheikhReciterHussary: "Sheikh Mahmoud Khalil Al-Hussary (Master Coach)",
  sheikhReciterAfasy: "Sheikh Mishary Rashid Al-Afasy",
  sheikhReciterAbdulBasit: "Sheikh Abdul Basit Abdul Samad (Murattal)",
  sheikhRepeatLabel: "Ayah Repetition Count",
  sheikhRepeat1: "1 Time",
  sheikhRepeat3: "3 Times",
  sheikhRepeat5: "5 Times",
  sheikhRepeat7: "7 Times",
  sheikhRepeatInfinite: "Continuous Loop",
  sheikhStartTalqeen: "Start Recitation Coaching",
  sheikhStopTalqeen: "Stop Coaching",
  sheikhStartMic: "Recite via Microphone",
  sheikhStopMic: "Stop & Evaluate Recitation",
  sheikhListening: "Listening to your blessed recitation...",
  sheikhEvaluating: "Evaluating recitation against verified Quranic text...",
  sheikhQuizMode: "Smart Memorization Tests",
  sheikhQuizHideAyah: "Hide full verse and recite from memory",
  sheikhQuizCompleteAyah: "Complete verse endings",
  sheikhQuizRandom: "Random verse recall test",
  sheikhTajweedRules: "Tajweed & Articulation Rules",
  sheikhTajweedMakharij: "Letter Articulation Points (Makharij)",
  sheikhTajweedGhunnah: "Noon Sakinah, Tanween & Ghunnah",
  sheikhTajweedMadd: "Madd (Elongation) Rules",
  sheikhTajweedQalqalah: "Qalqalah Letters (ق ط ب ج د)",
  sheikhProgressScore: "Mastery Level & Progress Log",
  sheikhVersesMastered: "Verses Mastered",
  sheikhEncouragementGood: "MashaAllah, excellent and accurate recitation!",
  sheikhEncouragementTryAgain: "Good effort! Note the highlighted words and practice them again.",
  sheikhOpenFromQuran: "Recite & Coach with Sheikh",
  // Settings Common Subviews
  settingsBack: "Back to Settings",
  settingsSaveSuccess: "Changes saved successfully ✓",
  settingsResetConfirm: "Confirm App Reset",
  settingsResetDesc: "Are you sure you want to reset all app settings and restart the initial setup flow?",
  settingsResetDone: "All settings have been reset to factory defaults",
  settingsResetCancel: "Cancel",
  settingsResetBtn: "Reset App Now",
  settingsDone: "Done",
  settingsCitySearch: "Search for a city or country...",
  settingsSelectGov: "Select Egyptian Governorate",
  settingsSelectCity: "Select City or District",
  settingsGpsActive: "Automatic GPS Location Detection",
  settingsManualActive: "Manual City Selection",
  settingsEgyptActive: "Egyptian Governorates & Cities",
  settingsWorldActive: "World & Islamic Capital Cities",
  settingsAzanAudition: "Audition Azan Audio",
  settingsIqamaAudition: "Audition Iqama Audio",
  settingsAzkarSabahTime: "Morning Azkar Reminder Time",
  settingsAzkarMassaTime: "Evening Azkar Reminder Time",
  settingsSalawatInterval: "Salawat on the Prophet Reminder Interval",
  settingsRamadanCannon: "Iftar Cannon Before Maghrib (16s)",
  settingsRamadanMusaharati: "Musaharati Wake-up Call Before Fajr",
  settingsRamadanFasting: "Fasting Hours & Imsak Calculations",
  settingsBatterySavingTitle: "Disable Battery Optimization",
  settingsBatterySavingDesc: "Ensures Azan and reminders play reliably in the background",
  settingsOverlayTitle: "Display Over Other Apps",
  settingsOverlayDesc: "Allows pre-prayer floating alert and Azan screen over other apps",
  settingsAlarmTitle: "Exact Alarms & Timers",
  settingsAlarmDesc: "Fires Azan audio exactly on time down to the second",
  permLockScreenBenefitText: 'Wakes the screen when prayer starts to show the Azan call and provide an easy one-tap mute or dismiss button.',
};

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  ar: {
    ...EXTRA_STRINGS_AR,
    appName: 'مؤذن الإسلامي',
    appTagline: 'مؤذن الإسلامي • رفيقك في طريق الإيمان',
    ayahHeader: '{وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ}',
    ayahSource: 'سورة هود : 88',
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
    remainingForPrayer: 'متبقي للصلاة',
    iqamaLabel: 'إقامة',
    remainingLabel: 'متبقي',
    quranTitle: 'القرآن الكريم',
    pageOfTotal: (p) => `• صفحة ${p} من 604`,
    continueReading: 'متابعة القراءة',
    hadithOfTheDay: 'حديث اليوم',
    readMore: 'قراءة المزيد',
    azkarAndDua: 'أذكار ودعاء',
    azkarSubtitle: 'حصّن نفسك بذكر الله ودعائه',
    viewAzkar: 'عرض الأذكار',
    islamicEvents: 'مناسبات إسلامية',
    viewEvents: 'عرض المناسبات',
    featQuran: 'القرآن الكريم',
    featQuranSub: 'قراءة وتفسير',
    featPrayer: 'مواقيت الصلاة',
    featPrayerSub: 'تنبيه وأذان',
    featQibla: 'القبلة',
    featQiblaSub: 'تحديد الاتجاه',
    featProphets: 'قصص الأنبياء والمرسلين',
    featProphetsSub: 'من آدم عليه السلام إلى محمد ﷺ',
    featSeerah: 'السيرة النبوية',
    featSeerahSub: 'حياة النبي ﷺ والصحابة وأمهات المؤمنين',
    featAzkar: 'الأذكار اليومية',
    featAzkarSub: 'الصباح والمساء والنوم والصلاة',
    featHadith: 'الأحاديث النبوية',
    featHadithSub: 'الأربعون النووية والبخاري ومسلم',
    featTasbih: 'السبحة الإلكترونية',
    featTasbihSub: 'سبّح بحمد ربك مع عداد ذكي',
    featNames: 'أسماء الله الحسنى',
    featNamesSub: 'معانيها وشرحها وفضائلها',
    featMasajid: 'المساجد القريبة',
    featMasajidSub: 'ابحث عن أقرب مسجد لموقعك',
    featWallpapers: 'خلفيات إسلامية',
    featWallpapersSub: 'خلفيات عالية الجودة للهاتف',
    featDua: 'موسوعة الأدعية',
    featDuaSub: 'أدعية قرآنية ونبوية وجامعة',
    featRecitations: 'تلاوات خاشعة',
    featRecitationsSub: 'استمع وحمّل لأشهر القراء',
    featRuqyah: 'الرقية الشرعية',
    featRuqyahSub: 'آيات وأدعية التحصين والشفاء',
    featQuiz: 'مسابقة إسلامية',
    featQuizSub: 'اختبر معلوماتك الدينية',
    featRamadan: 'رمضان مبارك',
    featRamadanSub: 'الإمساكية والمدفع والسحور والأحكام',
    featHajj: 'الحج والعمرة',
    featHajjSub: 'المناسك والأركان والأدعية',
    featMore: 'المزيد والموسوعة',
    featMoreSub: 'الزكاة، الختمة، البحث والمفضلة',
    collapseSections: 'طي الأقسام',
    expandSections: 'توسيع الأقسام',
    todayPrefix: 'اليوم',
    gregorianPrefix: 'الموافق',
    stopBtn: 'إيقاف',
    closeBtn: 'إغلاق',
    azanAlertTitle: (p) => `حان الآن موعد أذان صلاة ${p}`,
    azanAlertSub: 'الله أكبر • حي على الصلاة',
    iqamaAlertTitle: (p) => `حان الآن موعد إقامة صلاة ${p}`,
    iqamaAlertSub: 'الله أكبر قد قامت الصلاة • أقيموا صفوفكم وتراصّوا',
    navHome: 'الرئيسية',
    navPrayer: 'الأوقات',
    navQuran: 'القرآن',
    navQibla: 'القبلة',
    navSettings: 'الإعدادات',
    settingsTitle: 'الإعدادات',
    settingsProfile: 'الملف الشخصي',
    settingsProfileSub: 'إدارة معلوماتك وإحصائياتك',
    settingsPermissions: 'الأذونات والصلاحيات',
    settingsPermissionsSub: 'إدارة أذونات التطبيق والصلاحيات المطلوبة',
    settingsLocationTime: 'تحديد الموقع والوقت',
    settingsLocationTimeSub: 'اختر الدولة والمدينة والتوقيت الصيفي/الشتوي',
    settingsLanguage: 'اختيار اللغة',
    settingsLanguageSub: 'اختر اللغة المفضلة في التطبيق',
    settingsAzan: 'إعدادات الأذان والإقامة',
    settingsAzanSub: 'تخصيص صوت المؤذن والإقامة والتنبيهات',
    settingsAzkar: 'التحكم في الأذكار',
    settingsAzkarSub: 'إدارة أذكار الصباح والمساء والصلاة على النبي ﷺ',
    settingsRamadan: 'إعدادات رمضان والسحور',
    settingsRamadanSub: 'تنبيهات السحور ومدفع الإفطار والإمساكية',
    settingsPrivacy: 'سياسة الخصوصية',
    settingsPrivacySub: 'حماية بياناتك وأمان معلوماتك',
    settingsAbout: 'حول التطبيق',
    settingsAboutSub: 'معلومات الإصدار والمميزات والمصادر',
    settingsLogout: 'تسجيل الخروج / إعادة الضبط',
    settingsLogoutSub: 'إعادة ضبط الإعدادات الافتراضية',
    dstTitle: 'التوقيت الصيفي والشتوي',
    dstAuto: 'تلقائي (حسب الهاتف والمنطقة الزمنية)',
    dstSummer: 'التوقيت الصيفي (+1 ساعة)',
    dstWinter: 'التوقيت الشتوي القياسي',
    dstActiveNote: 'التوقيت الصيفي مفعّل حالياً (+60 دقيقة)',
    dstStandardNote: 'التوقيت الشتوي القياسي مفعّل حالياً',
  },
  en: {
    ...EXTRA_STRINGS_EN,
    appName: 'Islamic Muezzin',
    appTagline: 'Islamic Muezzin • Your Companion in Faith',
    ayahHeader: '{And my success is only by Allah}',
    ayahSource: 'Surah Hud : 88',
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    remainingForPrayer: 'Until Prayer',
    iqamaLabel: 'Iqama',
    remainingLabel: 'Remaining',
    quranTitle: 'The Noble Quran',
    pageOfTotal: (p) => `• Page ${p} of 604`,
    continueReading: 'Continue Reading',
    hadithOfTheDay: 'Hadith of the Day',
    readMore: 'Read More',
    azkarAndDua: 'Azkar & Duas',
    azkarSubtitle: 'Protect yourself with remembrance of Allah',
    viewAzkar: 'View Azkar',
    islamicEvents: 'Islamic Occasions',
    viewEvents: 'View Events',
    featQuran: 'Holy Quran',
    featQuranSub: 'Read & Tafseer',
    featPrayer: 'Prayer Times',
    featPrayerSub: 'Azan & Alerts',
    featQibla: 'Qibla Direction',
    featQiblaSub: 'Find Mecca',
    featProphets: 'Stories of the Prophets',
    featProphetsSub: 'From Adam to Muhammad ﷺ',
    featSeerah: 'Prophetic Seerah',
    featSeerahSub: 'Life of the Prophet ﷺ & Companions',
    featAzkar: 'Daily Azkar',
    featAzkarSub: 'Morning, Evening, Sleep & Prayer',
    featHadith: 'Prophetic Hadiths',
    featHadithSub: 'Nawawi 40, Bukhari & Muslim',
    featTasbih: 'Digital Tasbih',
    featTasbihSub: 'Glorify Allah with smart counter',
    featNames: '99 Names of Allah',
    featNamesSub: 'Meanings, explanations & virtues',
    featMasajid: 'Nearby Mosques',
    featMasajidSub: 'Find mosques close to your location',
    featWallpapers: 'Islamic Wallpapers',
    featWallpapersSub: 'HD wallpapers for your phone',
    featDua: 'Dua Encyclopedia',
    featDuaSub: 'Quranic, Prophetic & comprehensive Duas',
    featRecitations: 'Humble Recitations',
    featRecitationsSub: 'Listen to renowned Quran reciters',
    featRuqyah: 'Ruqyah Shariah',
    featRuqyahSub: 'Verses & Duas for healing & protection',
    featQuiz: 'Islamic Quiz',
    featQuizSub: 'Test your Islamic knowledge',
    featRamadan: 'Ramadan Mubarak',
    featRamadanSub: 'Imsakiya, Cannon, Suhoor & Fiqh',
    featHajj: 'Hajj & Umrah',
    featHajjSub: 'Rituals, pillars & supplications',
    featMore: 'More & Encyclopedia',
    featMoreSub: 'Zakat, Khatma, Search & Favorites',
    collapseSections: 'Collapse',
    expandSections: 'Expand',
    todayPrefix: 'Today',
    gregorianPrefix: 'Gregorian',
    stopBtn: 'Stop',
    closeBtn: 'Close',
    azanAlertTitle: (p) => `Time for ${p} Prayer`,
    azanAlertSub: 'Allahu Akbar • Come to prayer',
    iqamaAlertTitle: (p) => `Time for ${p} Iqama`,
    iqamaAlertSub: 'Allahu Akbar • The prayer has begun',
    navHome: 'Home',
    navPrayer: 'Times',
    navQuran: 'Quran',
    navQibla: 'Qibla',
    navSettings: 'Settings',
    settingsTitle: 'Settings',
    settingsProfile: 'Personal Profile',
    settingsProfileSub: 'Manage your profile & worship stats',
    settingsPermissions: 'Permissions & Access',
    settingsPermissionsSub: 'Manage app permissions & system access',
    settingsLocationTime: 'Location & Time',
    settingsLocationTimeSub: 'Country, city & Daylight Saving Time',
    settingsLanguage: 'Language Selection',
    settingsLanguageSub: 'Choose your preferred app language',
    settingsAzan: 'Azan & Iqama Settings',
    settingsAzanSub: 'Customize Muezzin voices & alerts',
    settingsAzkar: 'Azkar & Reminders',
    settingsAzkarSub: 'Morning, Evening & Salawat reminders',
    settingsRamadan: 'Ramadan & Suhoor',
    settingsRamadanSub: 'Suhoor alarm, Iftar cannon & Imsakiya',
    settingsPrivacy: 'Privacy Policy',
    settingsPrivacySub: 'Your data protection & offline privacy',
    settingsAbout: 'About App',
    settingsAboutSub: 'Version info, features & authentic sources',
    settingsLogout: 'Reset / Sign Out',
    settingsLogoutSub: 'Restore default application settings',
    dstTitle: 'Daylight Saving Time (Summer / Winter)',
    dstAuto: 'Automatic (Follow Phone Timezone)',
    dstSummer: 'Summer Time (+1 Hour)',
    dstWinter: 'Standard Winter Time',
    dstActiveNote: 'Summer Time (DST) is active (+60 min)',
    dstStandardNote: 'Standard Winter Time is active',
  },
  fr: {
    ...EXTRA_STRINGS_EN,
    appName: 'Muezzin Islamique',
    appTagline: 'Muezzin Islamique • Votre compagnon de foi',
    ayahHeader: '{Et ma réussite ne dépend que d’Allah}',
    ayahSource: 'Sourate Hud : 88',
    fajr: 'Fajr',
    sunrise: 'Chourouk',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    remainingForPrayer: 'Avant la prière',
    iqamaLabel: 'Iqama',
    remainingLabel: 'Restant',
    quranTitle: 'Le Saint Coran',
    pageOfTotal: (p) => `• Page ${p} sur 604`,
    continueReading: 'Continuer la lecture',
    hadithOfTheDay: 'Hadith du Jour',
    readMore: 'Lire la suite',
    azkarAndDua: 'Azkar et Invocations',
    azkarSubtitle: 'Protégez-vous par le rappel d’Allah',
    viewAzkar: 'Voir les Azkar',
    islamicEvents: 'Événements Islamiques',
    viewEvents: 'Voir le calendrier',
    featQuran: 'Le Saint Coran',
    featQuranSub: 'Lecture & Tafsir',
    featPrayer: 'Horaires de Prière',
    featPrayerSub: 'Adhan & Alertes',
    featQibla: 'Direction de la Qibla',
    featQiblaSub: 'Boussole vers La Mecque',
    featProphets: 'Histoires des Prophètes',
    featProphetsSub: 'D’Adam à Mohammed ﷺ',
    featSeerah: 'Sîra du Prophète ﷺ',
    featSeerahSub: 'Vie du Prophète ﷺ et des Compagnons',
    featAzkar: 'Azkar Quotidiens',
    featAzkarSub: 'Matin, Soir, Sommeil et Prière',
    featHadith: 'Hadiths Prophétiques',
    featHadithSub: '40 Nawawi, Boukhari et Mouslim',
    featTasbih: 'Tasbih Électronique',
    featTasbihSub: 'Compteur intelligent de Dhikr',
    featNames: 'Noms d’Allah',
    featNamesSub: 'Les 99 Noms, sens et mérites',
    featMasajid: 'Mosquées Proches',
    featMasajidSub: 'Trouver les mosquées à proximité',
    featWallpapers: 'Fonds d’écran',
    featWallpapersSub: 'Fonds d’écran islamiques HD',
    featDua: 'Encyclopédie des Douas',
    featDuaSub: 'Invocations coraniques et prophétiques',
    featRecitations: 'Récitations Coraniques',
    featRecitationsSub: 'Écouter les grands récitateurs',
    featRuqyah: 'Roqya Charia',
    featRuqyahSub: 'Versets et invocations de guérison',
    featQuiz: 'Quiz Islamique',
    featQuizSub: 'Testez vos connaissances religieuses',
    featRamadan: 'Ramadan Moubarak',
    featRamadanSub: 'Imsakiya, Canon, Suhoor et Fiqh',
    featHajj: 'Hajj et Omra',
    featHajjSub: 'Rites, piliers et invocations',
    featMore: 'Plus et Encyclopédie',
    featMoreSub: 'Zakat, Khatma, Recherche et Favoris',
    collapseSections: 'Réduire',
    expandSections: 'Développer',
    todayPrefix: 'Aujourd’hui',
    gregorianPrefix: 'Grégorien',
    stopBtn: 'Arrêter',
    closeBtn: 'Fermer',
    azanAlertTitle: (p) => `C'est l'heure de la prière de ${p}`,
    azanAlertSub: 'Allahu Akbar • Venez à la prière',
    iqamaAlertTitle: (p) => `C'est l'heure de l'Iqama de ${p}`,
    iqamaAlertSub: 'Allahu Akbar • La prière commence',
    navHome: 'Accueil',
    navPrayer: 'Horaires',
    navQuran: 'Coran',
    navQibla: 'Qibla',
    navSettings: 'Paramètres',
    settingsTitle: 'Paramètres',
    settingsProfile: 'Profil Personnel',
    settingsProfileSub: 'Gérer vos informations et statistiques',
    settingsPermissions: 'Autorisations',
    settingsPermissionsSub: 'Gérer les autorisations de l’application',
    settingsLocationTime: 'Lieu et Heure',
    settingsLocationTimeSub: 'Pays, ville et heure d’été/d’hiver',
    settingsLanguage: 'Choix de la Langue',
    settingsLanguageSub: 'Choisissez la langue de l’application',
    settingsAzan: 'Paramètres Adhan et Iqama',
    settingsAzanSub: 'Voix du Muezzin et alertes de prière',
    settingsAzkar: 'Contrôle des Azkar',
    settingsAzkarSub: 'Rappels du matin, du soir et Salawat',
    settingsRamadan: 'Ramadan et Suhoor',
    settingsRamadanSub: 'Alarme Suhoor et canon de l’Iftar',
    settingsPrivacy: 'Politique de Confidentialité',
    settingsPrivacySub: 'Protection des données hors ligne',
    settingsAbout: 'À Propos',
    settingsAboutSub: 'Version, fonctionnalités et sources',
    settingsLogout: 'Réinitialiser',
    settingsLogoutSub: 'Restaurer les paramètres par défaut',
    dstTitle: 'Heure d’été et d’hiver (DST)',
    dstAuto: 'Automatique (Selon le téléphone)',
    dstSummer: 'Heure d’été (+1 heure)',
    dstWinter: 'Heure d’hiver standard',
    dstActiveNote: 'Heure d’été activée (+60 min)',
    dstStandardNote: 'Heure d’hiver standard activée',
  },
  tr: {
    ...EXTRA_STRINGS_EN,
    appName: 'İslami Müezzin',
    appTagline: 'İslami Müezzin • İman Yolundaki Rehberiniz',
    ayahHeader: '{Başarım ancak Allah’ın yardımıyladır}',
    ayahSource: 'Hûd Suresi : 88',
    fajr: 'İmsak / Sabah',
    sunrise: 'Güneş',
    dhuhr: 'Öğle',
    asr: 'İkindi',
    maghrib: 'Akşam',
    isha: 'Yatsı',
    remainingForPrayer: 'Vakte Kalan',
    iqamaLabel: 'Kamet',
    remainingLabel: 'Kalan',
    quranTitle: 'Kur’ân-ı Kerîm',
    pageOfTotal: (p) => `• Sayfa ${p} / 604`,
    continueReading: 'Okumaya Devam Et',
    hadithOfTheDay: 'Günün Hadisi',
    readMore: 'Devamını Oku',
    azkarAndDua: 'Zikir ve Dua',
    azkarSubtitle: 'Allah’ı zikrederek huzur bulun',
    viewAzkar: 'Zikirleri Gör',
    islamicEvents: 'Dini Günler ve Geceler',
    viewEvents: 'Takvimi Gör',
    featQuran: 'Kur’ân-ı Kerîm',
    featQuranSub: 'Okuma ve Tefsir',
    featPrayer: 'Namaz Vakitleri',
    featPrayerSub: 'Ezan ve Hatırlatıcı',
    featQibla: 'Kıble Yönü',
    featQiblaSub: 'Kıbleyi Bul',
    featProphets: 'Peygamber Kıssaları',
    featProphetsSub: 'Hz. Âdem’den Hz. Muhammed’e ﷺ',
    featSeerah: 'Siyer-i Nebi',
    featSeerahSub: 'Peygamberimiz ﷺ ve Sahabe Hayatı',
    featAzkar: 'Günlük Zikirler',
    featAzkarSub: 'Sabah, Akşam, Uyku ve Namaz Tesbihatı',
    featHadith: 'Hadis-i Şerifler',
    featHadithSub: 'Kırk Hadis, Buhârî ve Müslim',
    featTasbih: 'Dijital Tesbih',
    featTasbihSub: 'Akıllı sayaç ile zikir çekin',
    featNames: 'Esmâü’l-Hüsnâ',
    featNamesSub: 'Allah’ın 99 İsmi ve Faziletleri',
    featMasajid: 'Yakındaki Camiler',
    featMasajidSub: 'Konumunuza en yakın camiler',
    featWallpapers: 'İslami Duvar Kağıtları',
    featWallpapersSub: 'Telefonunuz için HD tasarımlar',
    featDua: 'Dua Ansiklopedisi',
    featDuaSub: 'Kur’ân ve Sünnetten Dualar',
    featRecitations: 'Kur’an Tilavetleri',
    featRecitationsSub: 'Meşhur hafızlardan dinleyin',
    featRuqyah: 'Rukye ve Şifa',
    featRuqyahSub: 'Korunma ve şifa ayetleri',
    featQuiz: 'Dini Bilgi Yarışması',
    featQuizSub: 'İslami bilginizi test edin',
    featRamadan: 'Mübarek Ramazan',
    featRamadanSub: 'İmsakiye, İftar Topu ve Sahur',
    featHajj: 'Hac ve Umre Rehberi',
    featHajjSub: 'Menasik, rükünler ve dualar',
    featMore: 'Daha Fazla ve Ansiklopedi',
    featMoreSub: 'Zekat, Hatim, Arama ve Favoriler',
    collapseSections: 'Daralt',
    expandSections: 'Genişlet',
    todayPrefix: 'Bugün',
    gregorianPrefix: 'Miladi',
    stopBtn: 'Durdur',
    closeBtn: 'Kapat',
    azanAlertTitle: (p) => `${p} Vakti Girdi`,
    azanAlertSub: 'Allahu Ekber • Haydin Namaza',
    iqamaAlertTitle: (p) => `${p} Kamet Vakti`,
    iqamaAlertSub: 'Allahu Ekber • Namaz Başlıyor',
    navHome: 'Ana Sayfa',
    navPrayer: 'Vakitler',
    navQuran: 'Kur’an',
    navQibla: 'Kıble',
    navSettings: 'Ayarlar',
    settingsTitle: 'Ayarlar',
    settingsProfile: 'Kişisel Profil',
    settingsProfileSub: 'Profil ve ibadet istatistikleriniz',
    settingsPermissions: 'İzinler ve Yetkiler',
    settingsPermissionsSub: 'Uygulama izinlerini yönetin',
    settingsLocationTime: 'Konum ve Saat',
    settingsLocationTimeSub: 'Ülke, şehir ve yaz/kış saati ayarı',
    settingsLanguage: 'Dil Seçimi',
    settingsLanguageSub: 'Tercih ettiğiniz uygulama dilini seçin',
    settingsAzan: 'Ezan ve Kamet Ayarları',
    settingsAzanSub: 'Müezzin sesi ve bildirimler',
    settingsAzkar: 'Zikir ve Hatırlatıcılar',
    settingsAzkarSub: 'Sabah, akşam zikirleri ve Salavat',
    settingsRamadan: 'Ramazan ve Sahur',
    settingsRamadanSub: 'Sahur alarmı ve iftar topu',
    settingsPrivacy: 'Gizlilik Politikası',
    settingsPrivacySub: 'Veri güvenliği ve çevrimdışı koruma',
    settingsAbout: 'Uygulama Hakkında',
    settingsAboutSub: 'Sürüm bilgileri ve güvenilir kaynaklar',
    settingsLogout: 'Sıfırla / Çıkış',
    settingsLogoutSub: 'Varsayılan ayarlara geri dön',
    dstTitle: 'Yaz ve Kış Saati Uygulaması',
    dstAuto: 'Otomatik (Telefon Saat Dilimine Göre)',
    dstSummer: 'Yaz Saati (+1 Saat)',
    dstWinter: 'Standart Kış Saati',
    dstActiveNote: 'Yaz saati uygulaması aktif (+60 dk)',
    dstStandardNote: 'Standart kış saati aktif',
  },
  ur: {
    ...EXTRA_STRINGS_AR,
    appName: 'اسلامی مؤذن',
    appTagline: 'اسلامی مؤذن • ایمان کے سفر میں آپ کا ساتھی',
    ayahHeader: '{وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ}',
    ayahSource: 'سورۃ ہود : 88',
    fajr: 'فجر',
    sunrise: 'طلوع آفتاب',
    dhuhr: 'ظہر',
    asr: 'عصر',
    maghrib: 'مغرب',
    isha: 'عشاء',
    remainingForPrayer: 'نماز میں باقی وقت',
    iqamaLabel: 'اقامت',
    remainingLabel: 'باقی',
    quranTitle: 'قرآن مجید',
    pageOfTotal: (p) => `• صفحہ ${p} از 604`,
    continueReading: 'تلاوت جاری رکھیں',
    hadithOfTheDay: 'آج کی حدیث',
    readMore: 'مزید پڑھیں',
    azkarAndDua: 'اذکار و دعا',
    azkarSubtitle: 'اللہ کے ذکر اور دعا سے اپنے آپ کو محفوظ رکھیں',
    viewAzkar: 'اذکار دیکھیں',
    islamicEvents: 'اسلامی مواقع',
    viewEvents: 'مواقع دیکھیں',
    featQuran: 'قرآن مجید',
    featQuranSub: 'تلاوت و تفسیر',
    featPrayer: 'اوقات نماز',
    featPrayerSub: 'اذان اور الرٹ',
    featQibla: 'قبلہ رخ',
    featQiblaSub: 'سمت قبلہ',
    featProphets: 'قصص الانبیاء',
    featProphetsSub: 'حضرت آدمؑ سے حضرت محمد ﷺ تک',
    featSeerah: 'سیرت النبی ﷺ',
    featSeerahSub: 'نبی کریم ﷺ، امہات المؤمنین اور صحابہ کی زندگی',
    featAzkar: 'روزمرہ کے اذکار',
    featAzkarSub: 'صبح و شام، نیند اور نماز کے اذکار',
    featHadith: 'احادیث نبویہ',
    featHadithSub: 'اربعین نووی، صحیح بخاری و مسلم',
    featTasbih: 'ڈیجیٹل تسبیح',
    featTasbihSub: 'ذکر الٰہی کے لیے اسمارٹ کاؤنٹر',
    featNames: 'اسماء الحسنیٰ',
    featNamesSub: 'اللہ کے 99 نام، معانی اور فضائل',
    featMasajid: 'قریبی مساجد',
    featMasajidSub: 'اپنے مقام کے قریب مساجد تلاش کریں',
    featWallpapers: 'اسلامی وال پیپرز',
    featWallpapersSub: 'موبائل کے لیے اعلیٰ معیار کے وال پیپرز',
    featDua: 'دعاؤں کا انسائیکلوپیڈیا',
    featDuaSub: 'قرآنی اور مسنون دعائیں',
    featRecitations: 'خوبصورت تلاوتیں',
    featRecitationsSub: 'مشہور قراء کی آواز میں تلاوت سنیں',
    featRuqyah: 'رقیہ شرعیہ',
    featRuqyahSub: 'شفا اور حفاظت کی آیات و دعائیں',
    featQuiz: 'اسلامی کوئز',
    featQuizSub: 'اپنی دینی معلومات کا امتحان لیں',
    featRamadan: 'رمضان المبارک',
    featRamadanSub: 'امساکیہ، افطار توپ، سحری اور مسائل',
    featHajj: 'حج و عمرہ',
    featHajjSub: 'مناسک، ارکان اور مسنون دعائیں',
    featMore: 'مزید اور انسائیکلوپیڈیا',
    featMoreSub: 'زکوٰۃ، ختم قرآن، تلاش اور پسندیدہ',
    collapseSections: 'چھپائیں',
    expandSections: 'دیکھیں',
    todayPrefix: 'آج',
    gregorianPrefix: 'عیسوی',
    stopBtn: 'روکیں',
    closeBtn: 'بند کریں',
    azanAlertTitle: (p) => `${p} کا وقت ہو گیا ہے`,
    azanAlertSub: 'اللہ اکبر • نماز کی طرف آؤ',
    iqamaAlertTitle: (p) => `${p} کی اقامت کا وقت ہو گیا ہے`,
    iqamaAlertSub: 'اللہ اکبر • نماز کھڑی ہو چکی ہے',
    navHome: 'مرکزی صفحہ',
    navPrayer: 'اوقات نماز',
    navQuran: 'قرآن',
    navQibla: 'قبلہ',
    navSettings: 'ترتیبات',
    settingsTitle: 'ترتیبات',
    settingsProfile: 'ذاتی پروفائل',
    settingsProfileSub: 'اپنی معلومات اور عبادات کا ریکارڈ',
    settingsPermissions: 'اجازتیں (Permissions)',
    settingsPermissionsSub: 'ایپ کی اجازتوں اور ترتیبات کا انتظام',
    settingsLocationTime: 'مقام اور وقت',
    settingsLocationTimeSub: 'ملک، شہر اور گرمائی/سرمائی وقت کا انتخاب',
    settingsLanguage: 'زبان کا انتخاب',
    settingsLanguageSub: 'ایپ کے لیے اپنی پسندیدہ زبان منتخب کریں',
    settingsAzan: 'اذان اور اقامت کی ترتیبات',
    settingsAzanSub: 'مؤذن کی آواز اور اقامت کے اوقات',
    settingsAzkar: 'اذکار اور یاد دہانی',
    settingsAzkarSub: 'صبح و شام کے اذکار اور درود شریف',
    settingsRamadan: 'رمضان اور سحری',
    settingsRamadanSub: 'سحری الرٹ اور افطار توپ کی ترتیبات',
    settingsPrivacy: 'رازداری کی پالیسی',
    settingsPrivacySub: 'آپ کے ڈیٹا کی حفاظت اور آف لائن پرائیویسی',
    settingsAbout: 'ایپ کے بارے میں',
    settingsAboutSub: 'ورژن کی معلومات اور مستند اسلامی مصادر',
    settingsLogout: 'ری سیٹ / لاگ آؤٹ',
    settingsLogoutSub: 'افتراضی ترتیبات بحال کریں',
    dstTitle: 'گرمائی اور سرمائی وقت (DST)',
    dstAuto: 'خودکار (فون کے ٹائم زون کے مطابق)',
    dstSummer: 'گرمائی وقت (+1 گھنٹہ)',
    dstWinter: 'معیاری سرمائی وقت',
    dstActiveNote: 'گرمائی وقت فعال ہے (+60 منٹ)',
    dstStandardNote: 'معیاری سرمائی وقت فعال ہے',
  },
  id: {
    ...EXTRA_STRINGS_EN,
    appName: 'Muazin Islami',
    appTagline: 'Muazin Islami • Sahabat Anda dalam Iman',
    ayahHeader: '{Dan taufikku tidak lain hanyalah dengan pertolongan Allah}',
    ayahSource: 'QS. Hud : 88',
    fajr: 'Subuh',
    sunrise: 'Terbit',
    dhuhr: 'Dzuhur',
    asr: 'Ashar',
    maghrib: 'Maghrib',
    isha: 'Isya',
    remainingForPrayer: 'Menuju Shalat',
    iqamaLabel: 'Iqamah',
    remainingLabel: 'Tersisa',
    quranTitle: 'Al-Qur’an Al-Karim',
    pageOfTotal: (p) => `• Halaman ${p} dari 604`,
    continueReading: 'Lanjutkan Membaca',
    hadithOfTheDay: 'Hadits Hari Ini',
    readMore: 'Baca Selengkapnya',
    azkarAndDua: 'Dzikir & Doa',
    azkarSubtitle: 'Bentengi diri dengan dzikir dan doa',
    viewAzkar: 'Lihat Dzikir',
    islamicEvents: 'Hari Besar Islam',
    viewEvents: 'Lihat Kalender',
    featQuran: 'Al-Qur’an Al-Karim',
    featQuranSub: 'Baca & Tafsir',
    featPrayer: 'Jadwal Shalat',
    featPrayerSub: 'Adzan & Pengingat',
    featQibla: 'Arah Kiblat',
    featQiblaSub: 'Kompas Kiblat',
    featProphets: 'Kisah Para Nabi',
    featProphetsSub: 'Dari Nabi Adam hingga Muhammad ﷺ',
    featSeerah: 'Sirah Nabawiyah',
    featSeerahSub: 'Perjalanan Hidup Nabi ﷺ & Sahabat',
    featAzkar: 'Dzikir Harian',
    featAzkarSub: 'Pagi, Petang, Tidur & Setelah Shalat',
    featHadith: 'Hadits Nabawi',
    featHadithSub: 'Arbain Nawawi, Bukhari & Muslim',
    featTasbih: 'Tasbih Digital',
    featTasbihSub: 'Hitung dzikir dengan mudah',
    featNames: 'Asmaul Husna',
    featNamesSub: '99 Nama Allah, makna & keutamaannya',
    featMasajid: 'Masjid Terdekat',
    featMasajidSub: 'Temukan masjid di sekitar lokasi Anda',
    featWallpapers: 'Wallpaper Islami',
    featWallpapersSub: 'Koleksi latar belakang HD Islami',
    featDua: 'Ensiklopedia Doa',
    featDuaSub: 'Doa Al-Qur’an & Sunnah terlengkap',
    featRecitations: 'Tilawah Merdu',
    featRecitationsSub: 'Dengarkan qari internasional',
    featRuqyah: 'Ruqyah Syar’iyyah',
    featRuqyahSub: 'Ayat & doa pelindung serta kesembuhan',
    featQuiz: 'Kuis Islami',
    featQuizSub: 'Uji wawasan keislaman Anda',
    featRamadan: 'Ramadhan Mubarak',
    featRamadanSub: 'Imsakiyah, Meriam Iftar, Sahur & Fiqih',
    featHajj: 'Haji & Umrah',
    featHajjSub: 'Manasik, rukun & doa-doa lengkap',
    featMore: 'Lainnya & Ensiklopedia',
    featMoreSub: 'Zakat, Khatam, Pencarian & Favorit',
    collapseSections: 'Sembunyikan',
    expandSections: 'Tampilkan',
    todayPrefix: 'Hari Ini',
    gregorianPrefix: 'Masehi',
    stopBtn: 'Berhenti',
    closeBtn: 'Tutup',
    azanAlertTitle: (p) => `Waktu Shalat ${p} Telah Tiba`,
    azanAlertSub: 'Allahu Akbar • Mari Menunaikan Shalat',
    iqamaAlertTitle: (p) => `Waktu Iqamah ${p} Telah Tiba`,
    iqamaAlertSub: 'Allahu Akbar • Shalat Segera Dimulai',
    navHome: 'Beranda',
    navPrayer: 'Jadwal',
    navQuran: 'Al-Qur’an',
    navQibla: 'Kiblat',
    navSettings: 'Pengaturan',
    settingsTitle: 'Pengaturan',
    settingsProfile: 'Profil Pengguna',
    settingsProfileSub: 'Kelola profil & catatan ibadah Anda',
    settingsPermissions: 'Izin Aplikasi',
    settingsPermissionsSub: 'Kelola izin lokasi, latar belakang & baterai',
    settingsLocationTime: 'Lokasi & Waktu',
    settingsLocationTimeSub: 'Pilih negara, kota & waktu musim panas/dingin',
    settingsLanguage: 'Pilih Bahasa',
    settingsLanguageSub: 'Pilih bahasa aplikasi pilihan Anda',
    settingsAzan: 'Pengaturan Adzan & Iqamah',
    settingsAzanSub: 'Atur suara muadzin & pengingat shalat',
    settingsAzkar: 'Kontrol Dzikir',
    settingsAzkarSub: 'Pengingat dzikir pagi, petang & shalawat',
    settingsRamadan: 'Pengaturan Ramadhan',
    settingsRamadanSub: 'Alarm sahur & meriam buka puasa',
    settingsPrivacy: 'Kebijakan Privasi',
    settingsPrivacySub: 'Perlindungan data & privasi offline',
    settingsAbout: 'Tentang Aplikasi',
    settingsAboutSub: 'Info versi, fitur & referensi terpercaya',
    settingsLogout: 'Atur Ulang / Keluar',
    settingsLogoutSub: 'Kembalikan ke pengaturan awal',
    dstTitle: 'Waktu Musim Panas & Dingin (DST)',
    dstAuto: 'Otomatis (Sesuai Zona Waktu Telepon)',
    dstSummer: 'Waktu Musim Panas (+1 Jam)',
    dstWinter: 'Waktu Standar (Musim Dingin)',
    dstActiveNote: 'Waktu Musim Panas aktif (+60 menit)',
    dstStandardNote: 'Waktu Standar aktif',
  },
  es: {
    ...EXTRA_STRINGS_EN,
    appName: 'Muecín Islámico',
    appTagline: 'Muecín Islámico • Tu compañero en la fe',
    ayahHeader: '{Mi éxito solo proviene de Allah}',
    ayahSource: 'Sura Hud : 88',
    fajr: 'Fajr',
    sunrise: 'Amanecer',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    remainingForPrayer: 'Para la oración',
    iqamaLabel: 'Iqama',
    remainingLabel: 'Restante',
    quranTitle: 'El Sagrado Corán',
    pageOfTotal: (p) => `• Página ${p} de 604`,
    continueReading: 'Continuar leyendo',
    hadithOfTheDay: 'Hadiz del Día',
    readMore: 'Leer más',
    azkarAndDua: 'Azkar y Súplicas',
    azkarSubtitle: 'Protégete con el recuerdo de Allah',
    viewAzkar: 'Ver Azkar',
    islamicEvents: 'Eventos Islámicos',
    viewEvents: 'Ver eventos',
    featQuran: 'El Sagrado Corán',
    featQuranSub: 'Lectura y Tafsir',
    featPrayer: 'Horarios de Oración',
    featPrayerSub: 'Adhan y Alertas',
    featQibla: 'Dirección de la Qibla',
    featQiblaSub: 'Encuentra La Meca',
    featProphets: 'Historias de los Profetas',
    featProphetsSub: 'Desde Adán hasta Muhammad ﷺ',
    featSeerah: 'Biografía del Profeta ﷺ',
    featSeerahSub: 'Vida del Profeta ﷺ y los Compañeros',
    featAzkar: 'Azkar Diarios',
    featAzkarSub: 'Mañana, Tarde, Sueño y Oración',
    featHadith: 'Hadices Proféticos',
    featHadithSub: '40 Nawawi, Bujari y Muslim',
    featTasbih: 'Tasbih Digital',
    featTasbihSub: 'Contador inteligente de Dhikr',
    featNames: 'Nombres de Allah',
    featNamesSub: 'Los 99 Nombres y sus significados',
    featMasajid: 'Mezquitas Cercanas',
    featMasajidSub: 'Encuentra mezquitas cerca de ti',
    featWallpapers: 'Fondos Islámicos',
    featWallpapersSub: 'Fondos de pantalla HD',
    featDua: 'Enciclopedia de Duas',
    featDuaSub: 'Súplicas coránicas y proféticas',
    featRecitations: 'Recitaciones',
    featRecitationsSub: 'Escucha a famosos recitadores',
    featRuqyah: 'Ruqyah Shariah',
    featRuqyahSub: 'Versículos de protección y sanación',
    featQuiz: 'Cuestionario Islámico',
    featQuizSub: 'Pon a prueba tu conocimiento',
    featRamadan: 'Ramadán Mubarak',
    featRamadanSub: 'Calendario, Cañón, Suhoor y Fiqh',
    featHajj: 'Hajj y Umrah',
    featHajjSub: 'Rituales, pilares y súplicas',
    featMore: 'Más y Enciclopedia',
    featMoreSub: 'Zakat, Khatma, Búsqueda y Favoritos',
    collapseSections: 'Plegar',
    expandSections: 'Desplegar',
    todayPrefix: 'Hoy',
    gregorianPrefix: 'Gregoriano',
    stopBtn: 'Detener',
    closeBtn: 'Cerrar',
    azanAlertTitle: (p) => `Hora de la oración de ${p}`,
    azanAlertSub: 'Allahu Akbar • Ven a la oración',
    iqamaAlertTitle: (p) => `Hora del Iqama de ${p}`,
    iqamaAlertSub: 'Allahu Akbar • La oración comienza',
    navHome: 'Inicio',
    navPrayer: 'Horarios',
    navQuran: 'Corán',
    navQibla: 'Qibla',
    navSettings: 'Ajustes',
    settingsTitle: 'Ajustes',
    settingsProfile: 'Perfil Personal',
    settingsProfileSub: 'Administra tu información y progreso',
    settingsPermissions: 'Permisos',
    settingsPermissionsSub: 'Gestiona los permisos de la aplicación',
    settingsLocationTime: 'Ubicación y Hora',
    settingsLocationTimeSub: 'País, ciudad y horario de verano/invierno',
    settingsLanguage: 'Seleccionar Idioma',
    settingsLanguageSub: 'Elige tu idioma preferido en la app',
    settingsAzan: 'Ajustes de Adhan e Iqama',
    settingsAzanSub: 'Voces del muecín y alertas',
    settingsAzkar: 'Control de Azkar',
    settingsAzkarSub: 'Recordatorios de mañana, tarde y Salawat',
    settingsRamadan: 'Ramadán y Suhoor',
    settingsRamadanSub: 'Alarma de Suhoor y cañón de Iftar',
    settingsPrivacy: 'Política de Privacidad',
    settingsPrivacySub: 'Protección de datos sin conexión',
    settingsAbout: 'Acerca de la App',
    settingsAboutSub: 'Versión, funciones y fuentes auténticas',
    settingsLogout: 'Restablecer',
    settingsLogoutSub: 'Restaurar ajustes predeterminados',
    dstTitle: 'Horario de Verano e Invierno (DST)',
    dstAuto: 'Automático (Según zona horaria del teléfono)',
    dstSummer: 'Horario de Verano (+1 Hora)',
    dstWinter: 'Horario Estándar de Invierno',
    dstActiveNote: 'Horario de verano activo (+60 min)',
    dstStandardNote: 'Horario estándar de invierno activo',
  },
  ru: {
    ...EXTRA_STRINGS_EN,
    appName: 'Исламский Муэдзин',
    appTagline: 'Исламский Муэдзин • Ваш спутник в вере',
    ayahHeader: '{Помогает мне только Аллах}',
    ayahSource: 'Сура Худ : 88',
    fajr: 'Фаджр',
    sunrise: 'Восход',
    dhuhr: 'Зухр',
    asr: 'Аср',
    maghrib: 'Магриб',
    isha: 'Иша',
    remainingForPrayer: 'До намаза',
    iqamaLabel: 'Икамат',
    remainingLabel: 'Осталось',
    quranTitle: 'Священный Коран',
    pageOfTotal: (p) => `• Стр. ${p} из 604`,
    continueReading: 'Продолжить чтение',
    hadithOfTheDay: 'Хадис дня',
    readMore: 'Читать далее',
    azkarAndDua: 'Азкары и Дуа',
    azkarSubtitle: 'Укрепите себя поминанием Аллаха',
    viewAzkar: 'Открыть азкары',
    islamicEvents: 'Исламские даты',
    viewEvents: 'Все события',
    featQuran: 'Священный Коран',
    featQuranSub: 'Чтение и тафсир',
    featPrayer: 'Время намаза',
    featPrayerSub: 'Азан и оповещения',
    featQibla: 'Направление Киблы',
    featQiblaSub: 'Компас на Мекку',
    featProphets: 'Истории Пророков',
    featProphetsSub: 'От Адама до Мухаммада ﷺ',
    featSeerah: 'Сира Пророка ﷺ',
    featSeerahSub: 'Жизнь Пророка ﷺ и сподвижников',
    featAzkar: 'Ежедневные Азкары',
    featAzkarSub: 'Утренние, вечерние и после намаза',
    featHadith: 'Хадисы Пророка ﷺ',
    featHadithSub: '40 хадисов Навави, Бухари и Муслим',
    featTasbih: 'Электронный Тасбих',
    featTasbihSub: 'Умный счетчик зикра',
    featNames: '99 Имен Аллаха',
    featNamesSub: 'Прекрасные имена и их толкование',
    featMasajid: 'Мечети рядом',
    featMasajidSub: 'Поиск ближайших мечетей',
    featWallpapers: 'Исламские обои',
    featWallpapersSub: 'HD заставки для телефона',
    featDua: 'Энциклопедия Дуа',
    featDuaSub: 'Мольбы из Корана и Сунны',
    featRecitations: 'Чтение Корана',
    featRecitationsSub: 'Слушайте известных чтецов',
    featRuqyah: 'Рукья Шария',
    featRuqyahSub: 'Аяты и дуа для защиты и исцеления',
    featQuiz: 'Исламская викторина',
    featQuizSub: 'Проверьте свои знания об Исламе',
    featRamadan: 'Благословенный Рамадан',
    featRamadanSub: 'Расписание, пушка ифтара и сухур',
    featHajj: 'Хадж и Умра',
    featHajjSub: 'Обряды, столпы и дуа паломника',
    featMore: 'Еще и Энциклопедия',
    featMoreSub: 'Закят, Хатм, Поиск и Избранное',
    collapseSections: 'Свернуть',
    expandSections: 'Развернуть',
    todayPrefix: 'Сегодня',
    gregorianPrefix: 'Григорианский',
    stopBtn: 'Остановить',
    closeBtn: 'Закрыть',
    azanAlertTitle: (p) => `Время намаза ${p}`,
    azanAlertSub: 'Аллаху Акбар • Спешите на молитву',
    iqamaAlertTitle: (p) => `Время икамата ${p}`,
    iqamaAlertSub: 'Аллаху Акбар • Молитва начинается',
    navHome: 'Главная',
    navPrayer: 'Время',
    navQuran: 'Коран',
    navQibla: 'Кибла',
    navSettings: 'Настройки',
    settingsTitle: 'Настройки',
    settingsProfile: 'Личный профиль',
    settingsProfileSub: 'Управление профилем и статистикой',
    settingsPermissions: 'Разрешения',
    settingsPermissionsSub: 'Доступ к геопозиции и фоновой работе',
    settingsLocationTime: 'Местоположение и время',
    settingsLocationTimeSub: 'Страна, город и летнее/зимнее время',
    settingsLanguage: 'Выбор языка',
    settingsLanguageSub: 'Выберите язык интерфейса приложения',
    settingsAzan: 'Настройки Азана и Икамата',
    settingsAzanSub: 'Голос муэдзина и уведомления',
    settingsAzkar: 'Управление Азкарами',
    settingsAzkarSub: 'Утренние, вечерние азкары и Салават',
    settingsRamadan: 'Рамадан и Сухур',
    settingsRamadanSub: 'Будильник на сухур и пушка ифтара',
    settingsPrivacy: 'Политика конфиденциальности',
    settingsPrivacySub: 'Защита данных и работа офлайн',
    settingsAbout: 'О приложении',
    settingsAboutSub: 'Версия, возможности и источники',
    settingsLogout: 'Сброс настроек',
    settingsLogoutSub: 'Восстановить стандартные настройки',
    dstTitle: 'Летнее и зимнее время (DST)',
    dstAuto: 'Автоматически (По часовому поясу телефона)',
    dstSummer: 'Летнее время (+1 час)',
    dstWinter: 'Стандартное зимнее время',
    dstActiveNote: 'Летнее время активно (+60 мин)',
    dstStandardNote: 'Стандартное зимнее время активно',
  },
};

export function getTranslation(lang?: AppLanguage): TranslationDictionary {
  const code = lang || getSavedLanguage();
  const selected = TRANSLATIONS[code] || TRANSLATIONS.ar;
  if (code === "ar") {
    return { ...TRANSLATIONS.ar, ...selected };
  }
  return {
    ...TRANSLATIONS.ar,
    ...TRANSLATIONS.en,
    ...selected,
  };
}
