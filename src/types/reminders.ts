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
  startTime: string; // "06:30"
  audioFile: string; // 'azkar_sabah_1'
  autoPlaySound: boolean;
  repeatType: RepeatType;
  repeatInterval: number; // e.g. 30
  repeatUnit: RepeatUnit; // 'minutes' | 'hours'
  endTime: string; // "10:30"
}

export interface EveningAzkarSettings {
  enabled: boolean;
  startTime: string; // "17:00"
  audioFile: string; // 'azkar_massa_1'
  autoPlaySound: boolean;
  repeatType: RepeatType;
  repeatInterval: number; // e.g. 30
  repeatUnit: RepeatUnit;
  endTime: string; // "21:00"
}

export interface SalawatSettings {
  enabled: boolean;
  startTime: string; // "08:00"
  audioFile: string; // 'salawat_1' | 'salawat_2' | 'salawat_3'
  autoPlaySound: boolean;
  repeatType: RepeatType;
  repeatInterval: number; // e.g. 60
  repeatUnit: RepeatUnit;
  endTime: string; // "22:00"
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
  hasCompletedFirstTimeSetup: boolean;
}

export const DEFAULT_REMINDERS_SETTINGS: ComprehensiveRemindersSettings = {
  morningAzkar: {
    enabled: true,
    startTime: '06:30',
    audioFile: 'azkar_sabah_1',
    autoPlaySound: true,
    repeatType: 'once',
    repeatInterval: 30,
    repeatUnit: 'minutes',
    endTime: '10:30',
  },
  eveningAzkar: {
    enabled: true,
    startTime: '17:00',
    audioFile: 'azkar_massa_1',
    autoPlaySound: true,
    repeatType: 'once',
    repeatInterval: 30,
    repeatUnit: 'minutes',
    endTime: '20:30',
  },
  salawat: {
    enabled: true,
    startTime: '08:00',
    audioFile: 'salawat_1',
    autoPlaySound: true,
    repeatType: 'repeat',
    repeatInterval: 1,
    repeatUnit: 'hours',
    endTime: '22:00',
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
  hasCompletedFirstTimeSetup: false,
};

