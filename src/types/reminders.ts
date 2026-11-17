export type RepeatUnit = 'minutes' | 'hours';
export type RepeatType = 'once' | 'repeat';

export interface AudioTrackOption {
  id: string;
  title: string;
  description: string;
  filePath: string;
  category: 'sabah' | 'massa' | 'salawat' | 'musaharati' | 'cannon';
  durationSeconds?: number;
}

export interface MorningAzkarSettings {
  enabled: boolean;
  startTime: string; // "08:00"
  audioFile: string; // 'azkar_sabah_1'
  autoPlaySound: boolean;
  repeatType: RepeatType;
  repeatInterval: number; // e.g. 30
  repeatUnit: RepeatUnit; // 'minutes' | 'hours'
  endTime: string; // "10:30"
  volumePercent?: number; // 0..100 independent Azkar volume
}

export interface EveningAzkarSettings {
  enabled: boolean;
  startTime: string; // "21:00"
  audioFile: string; // 'azkar_massa_1'
  autoPlaySound: boolean;
  repeatType: RepeatType;
  repeatInterval: number; // e.g. 30
  repeatUnit: RepeatUnit;
  endTime: string; // "23:00"
  volumePercent?: number; // 0..100 independent Azkar volume
}

export interface SalawatSettings {
  enabled: boolean;
  autoAfterFajrIqama?: boolean; // Automatically starts right after Fajr Iqama until 00:00 midnight
  startTime: string; // Manual fallback start time e.g. "06:00"
  audioFile: string; // 'salawat_1' | 'salawat_2' | 'salawat_3'
  autoPlaySound: boolean;
  repeatType: RepeatType;
  repeatInterval: number; // e.g. 15
  repeatUnit: RepeatUnit;
  endTime: string; // "23:59" (00:00 midnight boundary)
  volumePercent?: number; // 0..100 independent Salawat volume
}

export interface MusaharatiSettings {
  enabled: boolean;
  time: string; // "03:30"
  audioFile: string; // 'musaharati_1' | 'musaharati_2'
  onlyInRamadan: boolean;
}

export interface IftarCannonSettings {
  enabled: boolean; // toggle only
  audioFile: string; // 'iftar_cannon_1'
  leadTimeSeconds: number; // 16 seconds before Maghrib
}

export interface ImsakReminderSettings {
  enabled: boolean;
  minutesBeforeFajr: number; // default 10 minutes before Fajr
}

export interface IftarReminderSettings {
  enabled: boolean;
}

export interface PrePrayerAlertSettings {
  enabled: boolean;
  minutesBeforePrayer: number; // default 15 minutes
  audioFile: string; // 'pre_prayer_15m'
  autoPlaySound: boolean;
}

export interface QiyamSettings {
  firstThirdEnabled: boolean;
  lastThirdEnabled: boolean;
  firstThirdAudio: string; // 'qiyam_first_third'
  lastThirdAudio: string; // 'qiyam_last_third'
  autoPlaySound: boolean;
}

export interface RuqyahSettings {
  enabled: boolean;
  audioFile: string; // 'ruqyah_shariah'
}

export interface ComprehensiveRemindersSettings {
  morningAzkar: MorningAzkarSettings;
  eveningAzkar: EveningAzkarSettings;
  salawat: SalawatSettings;
  musaharati: MusaharatiSettings;
  iftarCannon: IftarCannonSettings;
  imsakReminder: ImsakReminderSettings;
  iftarReminder: IftarReminderSettings;
  prePrayerAlert: PrePrayerAlertSettings;
  qiyam: QiyamSettings;
  ruqyah: RuqyahSettings;
  azkarVolumePercent?: number; // Shared independent volume (0..100) for Morning & Evening Azkar
  hasCompletedFirstTimeSetup: boolean;
}

export const DEFAULT_REMINDERS_SETTINGS: ComprehensiveRemindersSettings = {
  morningAzkar: {
    enabled: true,
    startTime: '08:00',
    audioFile: 'azkar_sabah_1',
    autoPlaySound: true,
    repeatType: 'once',
    repeatInterval: 30,
    repeatUnit: 'minutes',
    endTime: '10:30',
    volumePercent: 100,
  },
  eveningAzkar: {
    enabled: true,
    startTime: '21:00',
    audioFile: 'azkar_massa_1',
    autoPlaySound: true,
    repeatType: 'once',
    repeatInterval: 30,
    repeatUnit: 'minutes',
    endTime: '23:00',
    volumePercent: 100,
  },
  salawat: {
    enabled: true,
    autoAfterFajrIqama: true,
    startTime: '06:00',
    audioFile: 'salawat_1',
    autoPlaySound: true,
    repeatType: 'repeat',
    repeatInterval: 15,
    repeatUnit: 'minutes',
    endTime: '23:59',
    volumePercent: 85,
  },
  musaharati: {
    enabled: true,
    time: '03:30',
    audioFile: 'musaharati_1',
    onlyInRamadan: true,
  },
  iftarCannon: {
    enabled: true,
    audioFile: 'iftar_cannon_1',
    leadTimeSeconds: 16,
  },
  imsakReminder: {
    enabled: true,
    minutesBeforeFajr: 10,
  },
  iftarReminder: {
    enabled: true,
  },
  prePrayerAlert: {
    enabled: true,
    minutesBeforePrayer: 15,
    audioFile: 'pre_prayer_15m',
    autoPlaySound: true,
  },
  qiyam: {
    firstThirdEnabled: true,
    lastThirdEnabled: true,
    firstThirdAudio: 'qiyam_first_third',
    lastThirdAudio: 'qiyam_last_third',
    autoPlaySound: true,
  },
  ruqyah: {
    enabled: true,
    audioFile: 'ruqyah_shariah',
  },
  azkarVolumePercent: 100,
  hasCompletedFirstTimeSetup: false,
};


