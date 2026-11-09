/**
 * Types definition for the Azan Islamic Application
 */

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTime {
  key: PrayerKey;
  name: string;
  time: string; // HH:mm format
  icon: string;
  isPassed: boolean;
  isActive: boolean;
  timestamp: Date;
}

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  translation?: string;
  audio?: string;
  tafseer?: string;
}

export interface SurahDetail extends SurahMeta {
  ayahs: Ayah[];
}

export type AzkarCategoryKey =
  | 'sabah'
  | 'masaa'
  | 'sleep'
  | 'wake'
  | 'salah'
  | 'mosque'
  | 'home'
  | 'food'
  | 'travel'
  | 'distress'
  | 'nature'
  | 'general';

export interface AzkarItem {
  id: string;
  category: AzkarCategoryKey;
  text: string;
  count: number;
  currentCount: number;
  fadl?: string;
  source?: string;
}

export interface HadithItem {
  id: number;
  title: string;
  hadith: string;
  narrator: string;
  source: string;
  sharh: string;
  category: string;
}

export interface DuaItem {
  id: string;
  title: string;
  arabic: string;
  source: string;
  category: string;
  isFavorite?: boolean;
}

export interface SeerahMilestone {
  id: string;
  period: string;
  yearHijri?: string;
  yearMiladi?: string;
  title: string;
  description: string;
  lessons: string[];
}

export interface HajjRitual {
  id: string;
  day: string;
  title: string;
  description: string;
  duas: string[];
  tips: string[];
}

export interface MosqueItem {
  id: string;
  name: string;
  distanceKm: number;
  address: string;
  features: string[];
  rating: number;
  hasJumua: boolean;
  hasWomenSection: boolean;
}

export interface IslamicEvent {
  id: string;
  title: string;
  hijriDate: string;
  gregorianDate: string;
  description: string;
  daysRemaining?: number;
}

export interface QuranBookmark {
  id: string;
  page: number;
  surahName: string;
  juzNumber: number;
  date: string;
  note?: string;
}

export interface RamadanDayImsakiya {
  dayNumber: number;
  hijriDate: string;
  gregorianDateStr: string;
  imsak: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  fastingDurationStr: string;
  isToday: boolean;
  date: Date;
}

export interface RamadanFastingDayRecord {
  fasted: boolean;
  prayedCongregation: boolean;
  taraweeh: boolean;
  charity: boolean;
  quranRead: boolean;
}

export type DstMode = 'auto' | 'summer' | 'winter';

export interface UserProfile {
  name: string;
  avatar?: string;
  language?: 'ar' | 'en' | 'fr' | 'tr' | 'ur' | 'id' | 'es' | 'ru';
  dstMode?: DstMode;
  city: CityLocation;
  calculationMethod: string;
  asrJuristicMethod?: 'standard' | 'hanafi';
  manualPrayerAdjustments?: Record<PrayerKey, number>;
  lastReadSurah: number;
  lastReadAyah: number;
  lastReadSurahName: string;
  lastReadAyahText: string;
  lastReadPage?: number;
  totalTasbihCount: number;
  prayersToday: Record<PrayerKey, boolean>;
  bookmarks: { surah: number; ayah: number; surahName: string }[];
  pageBookmarks?: QuranBookmark[];
  favoriteDuas: string[];
  favoriteItems?: string[];
  
  // Azan Settings
  azanVoice: string;
  fajrAzanVoice?: string;
  prayerAzanVoices?: Partial<Record<PrayerKey, string>>;
  prayerAzanEnabled?: Record<PrayerKey, boolean>;
  autoPlayAzan?: boolean;
  soundEnabled: boolean;
  prePrayerReminderEnabled?: boolean;
  prePrayerReminderMinutes?: number;

  // Iqama Settings
  iqamaEnabled?: boolean;
  iqamaIntervals?: Record<PrayerKey, number>;
  iqamaVoice?: string;
  iqamaSoundEnabled?: boolean;
  customIqamaAudioUrl?: string;

  // Notifications Settings
  prayerNotificationsEnabled?: boolean;
  morningAzkarReminderEnabled?: boolean;
  morningAzkarTime?: string;
  eveningAzkarReminderEnabled?: boolean;
  eveningAzkarTime?: string;
  quranReminderEnabled?: boolean;
  quranReminderTime?: string;
  ramadanSuhoorReminderEnabled?: boolean;
  ramadanSuhoorMinutesBeforeFajr?: number;
  ramadanIftarReminderEnabled?: boolean;

  // Quran Settings
  quranFontSize?: 'normal' | 'large' | 'xlarge';
  quranNightMode?: boolean;
  khatmaGoalDays?: number;
  khatmaCurrentDay?: number;
  khatmaCompletedPages?: number;

  // Appearance & Theme
  darkMode?: boolean;
  themeAccent?: string;

  // Ramadan Progress Tracking (Days 1 to 30)
  ramadanFastingTracker?: Record<number, RamadanFastingDayRecord>;

  // Comprehensive Audio Reminders & Scheduler Settings
  audioReminders?: IslamicAudioRemindersSettings;
  onboardingCompleted?: boolean;
}

export type RepeatUnit = 'minutes' | 'hours';

export interface SectionReminderConfig {
  enabled: boolean;
  startTime: string; // HH:mm (24h)
  audioFileId: string;
  autoPlayAudio: boolean;
  repeatType: 'none' | 'custom';
  repeatInterval: number;
  repeatUnit: RepeatUnit;
  endTime?: string; // HH:mm (24h)
}

export interface MesaharatyReminderConfig {
  enabled: boolean;
  time: string; // HH:mm chosen by user
  audioFileId: string;
  autoPlayAudio: boolean;
  ramadanOnly?: boolean;
}

export interface IftarCannonReminderConfig {
  enabled: boolean;
  ramadanOnly: boolean; // strictly in Ramadan
  audioFileId: string;
  autoPlayAudio: boolean;
}

export interface IslamicAudioRemindersSettings {
  morningAzkar: SectionReminderConfig;
  eveningAzkar: SectionReminderConfig;
  salawat: SectionReminderConfig;
  mesaharaty: MesaharatyReminderConfig;
  iftarCannon: IftarCannonReminderConfig;
}
