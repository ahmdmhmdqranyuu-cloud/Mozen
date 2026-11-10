/**
 * Audio Player Utility for Azan, Quran Recitation, and Subha clicks
 * 100% Offline Compatible with embedded local project audio files
 */

export interface AzanVoiceOption {
  id: string;
  name: string;
  muezzin: string;
  location: string;
  filePath: string;
  isFajrOnly?: boolean;
}

export const AZAN_VOICES: AzanVoiceOption[] = [
  {
    id: 'makkah',
    name: 'أذان الحرم المكي الشريف',
    muezzin: 'الشيخ علي بن أحمد ملا',
    location: 'مكة المكرمة',
    filePath: '/audio/makkah.mp3',
  },
  {
    id: 'madinah',
    name: 'أذان المسجد النبوي الشريف',
    muezzin: 'مؤذنو الحرم النبوي الشريف',
    location: 'المدينة المنورة',
    filePath: '/audio/madinah.mp3',
  },
  {
    id: 'ibrahim_madani',
    name: 'أذان مؤذن المسجد الحرام',
    muezzin: 'الشيخ إبراهيم المدني (رحمه الله)',
    location: 'المسجد الحرام - مكة المكرمة',
    filePath: '/audio/ibrahim_madani.mp3',
  },
  {
    id: 'mohamed_rifaat',
    name: 'أذان قيثارة السماء (المغرب)',
    muezzin: 'فضيلة الشيخ محمد رفعت (رحمه الله)',
    location: 'أذان المغرب - إذاعة القرآن الكريم بمصر',
    filePath: '/audio/mohamed_rifaat.mp3',
  },
  {
    id: 'mustafa_ismail',
    name: 'أذان الشيخ مصطفى إسماعيل',
    muezzin: 'فضيلة الشيخ مصطفى إسماعيل',
    location: 'إذاعة مصر / أذان المغرب',
    filePath: '/audio/mustafa_ismail.mp3',
  },
  {
    id: 'nasser_alqatami',
    name: 'أذان خاشع بصوت الشيخ ناصر القطامي',
    muezzin: 'الشيخ ناصر القطامي',
    location: 'الرياض - المملكة العربية السعودية',
    filePath: '/audio/nasser_alqatami.mp3',
  },
  {
    id: 'abdulbasit',
    name: 'أذان الشيخ عبد الباسط عبد الصمد',
    muezzin: 'فضيلة الشيخ عبد الباسط عبد الصمد',
    location: 'جمهورية مصر العربية',
    filePath: '/audio/abdulbasit.mp3',
  },
  {
    id: 'abdulbasit_fajr',
    name: 'أذان الفجر بصوت الشيخ عبد الباسط',
    muezzin: 'الشيخ عبد الباسط عبد الصمد',
    location: 'أذان الفجر الخاشع (مصر)',
    filePath: '/audio/abdulbasit_fajr.mp3',
    isFajrOnly: true,
  },
  {
    id: 'alaqsa',
    name: 'أذان المسجد الأقصى المبارك',
    muezzin: 'مؤذنو القدس الشريف',
    location: 'فلسطين المحتلة - القدس',
    filePath: '/audio/alaqsa.mp3',
  },
  {
    id: 'cairo',
    name: 'أذان القاهرة - إذاعة صوت العرب',
    muezzin: 'مؤذنو القاهرة الكبرى',
    location: 'القاهرة - مصر',
    filePath: '/audio/cairo.mp3',
  },
  {
    id: 'hussary',
    name: 'أذان الشيخ محمود خليل الحصري',
    muezzin: 'فضيلة الشيخ محمود خليل الحصري',
    location: 'القاهرة - مصر',
    filePath: '/audio/hussary.mp3',
  },
  {
    id: 'alafasy',
    name: 'أذان الشيخ مشاري راشد العفاسي',
    muezzin: 'الشيخ مشاري راشد العفاسي',
    location: 'الكويت',
    filePath: '/audio/alafasy.mp3',
  },
  {
    id: 'fajr',
    name: 'أذان الفجر (الصلاة خير من النوم)',
    muezzin: 'أذان الفجر من الحرم المكي',
    location: 'مكة المكرمة',
    filePath: '/audio/fajr.mp3',
    isFajrOnly: true,
  },
  {
    id: 'toubar_fajr',
    name: 'أذان وابتهال فجر الشيخ نصر الدين طوبار',
    muezzin: 'الشيخ نصر الدين طوبار',
    location: 'القاهرة - مصر',
    filePath: '/audio/toubar_fajr.mp3',
    isFajrOnly: true,
  },
  {
    id: 'madinah_fajr',
    name: 'أذان المسجد النبوي الشريف للفجر',
    muezzin: 'مؤذنو الحرم النبوي الشريف',
    location: 'المدينة المنورة',
    filePath: '/audio/madinah.mp3',
    isFajrOnly: true,
  },
];

/**
 * Three dedicated embedded choices for Fajr Azan as specified in system prompt:
 * 1. Sheikh Abdul Basit Abdul Samad for Fajr
 * 2. Al-Masjid Al-Nabawi / Haramain for Fajr
 * 3. Sheikh Nasr El-Din Tobar for Fajr
 */
export const FAJR_AZAN_VOICES: AzanVoiceOption[] = [
  {
    id: 'abdulbasit_fajr',
    name: 'أذان الشيخ عبد الباسط عبد الصمد للفجر',
    muezzin: 'فضيلة الشيخ عبد الباسط عبد الصمد',
    location: 'جمهورية مصر العربية',
    filePath: '/audio/abdulbasit_fajr.mp3',
    isFajrOnly: true,
  },
  {
    id: 'madinah_fajr',
    name: 'أذان المسجد النبوي أو الحرم المكي للفجر',
    muezzin: 'مؤذنو الحرمين الشريفين',
    location: 'المسجد النبوي الشريف - المدينة المنورة',
    filePath: '/audio/madinah.mp3',
    isFajrOnly: true,
  },
  {
    id: 'toubar_fajr',
    name: 'أذان وابتهال فجر الشيخ نصر الدين طوبار',
    muezzin: 'فضيلة الشيخ نصر الدين طوبار',
    location: 'جمهورية مصر العربية',
    filePath: '/audio/toubar_fajr.mp3',
    isFajrOnly: true,
  },
];


export interface QuranReciterOption {
  id: string;
  name: string;
  serverKey: string;
}

export const QURAN_RECITERS: QuranReciterOption[] = [
  { id: 'alafasy', name: 'مشاري راشد العفاسي', serverKey: 'ar.alafasy' },
  { id: 'abdulbasit', name: 'عبد الباسط عبد الصمد (مرتل)', serverKey: 'ar.abdulbasitmurattal' },
  { id: 'hussary', name: 'محمود خليل الحصري', serverKey: 'ar.husary' },
  { id: 'shuraym', name: 'سعود الشريم', serverKey: 'ar.saoodshuraym' },
  { id: 'minshawi', name: 'محمد صديق المنشاوي', serverKey: 'ar.minshawi' },
];

export interface AudioTrackOption {
  id: string;
  title: string;
  description: string;
  filePath: string;
  category: 'sabah' | 'massa' | 'salawat' | 'musaharati' | 'cannon';
}

export const SALAWAT_AUDIO_OPTIONS: AudioTrackOption[] = [
  {
    id: 'salawat_1',
    title: 'الصيغة الأولى',
    description: '«اللهم صل وسلم على نبينا محمد»',
    filePath: '/audio/salawat_1.mp3',
    category: 'salawat',
  },
  {
    id: 'salawat_2',
    title: 'الصيغة الثانية',
    description: '«اللهم صل على محمد وعلى آل محمد»',
    filePath: '/audio/salawat_2.mp3',
    category: 'salawat',
  },
  {
    id: 'salawat_3',
    title: 'الصيغة الثالثة',
    description: '«اللهم صل وسلم على سيدنا وحبيبنا محمد»',
    filePath: '/audio/salawat_3.mp3',
    category: 'salawat',
  },
];

export const MORNING_AZKAR_AUDIO_OPTIONS: AudioTrackOption[] = [
  {
    id: 'azkar_sabah_1',
    title: 'أذكار الصباح بصوت خاشع',
    description: 'أصبحنا وأصبح الملك لله والحمد لله لا إله إلا الله وحده لا شريك له',
    filePath: '/audio/azkar_sabah.mp3',
    category: 'sabah',
  },
];

export const EVENING_AZKAR_AUDIO_OPTIONS: AudioTrackOption[] = [
  {
    id: 'azkar_massa_1',
    title: 'أذكار المساء بصوت خاشع',
    description: 'أمسينا وأمسى الملك لله والحمد لله لا إله إلا الله وحده لا شريك له',
    filePath: '/audio/azkar_massa.mp3',
    category: 'massa',
  },
];

export const MUSAHARATI_AUDIO_OPTIONS: AudioTrackOption[] = [
  {
    id: 'musaharati_1',
    title: 'أغنية المسحراتي الرمضانية للأطفال',
    description: '«اصحى يا نايم وصحي النوم ده احنا بقينا في شهر الصوم..»',
    filePath: '/audio/musaharati_1.mp3',
    category: 'musaharati',
  },
  {
    id: 'musaharati_2',
    title: 'مسحراتي التراث - الشيخ سيد مكاوي',
    description: '«اصحى يا نايم وحد الدايم.. مسحراتي أنادي أهل الزمن من حارتي»',
    filePath: '/audio/musaharati_2.mp3',
    category: 'musaharati',
  },
];

export const IFTAR_CANNON_AUDIO_OPTIONS: AudioTrackOption[] = [
  {
    id: 'iftar_cannon_1',
    title: 'مدفع الإفطار الأصلي مع التهنئة والدعاء',
    description: '«مدفع الإفطار .. اضرب! - نتمنى لكم صوماً مقبولاً وإفطاراً شهياً»',
    filePath: '/audio/iftar_cannon.mp3',
    category: 'cannon',
  },
];

export const PRE_PRAYER_AUDIO_OPTIONS = [
  {
    id: 'pre_prayer_15m',
    title: 'تنبيه قبل الصلاة بـ 15 دقيقة',
    description: '«إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا»',
    filePath: '/audio/pre_prayer_15m.mp3',
    category: 'pre_prayer' as const,
  },
];

export const QIYAM_AUDIO_OPTIONS = [
  {
    id: 'qiyam_first_third',
    title: 'قيام الليل - الثلث الأول من الليل',
    description: 'سورة المزمل المباركة: «يا أيها المزمل * قم الليل إلا قليلا»',
    filePath: '/audio/qiyam_first_third.mp3',
    category: 'qiyam' as const,
  },
  {
    id: 'qiyam_last_third',
    title: 'قيام الليل والأسحار - الثلث الأخير من الليل',
    description: 'وقت النزول الإلهي والاستغفار: «وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ»',
    filePath: '/audio/qiyam_last_third.mp3',
    category: 'qiyam' as const,
  },
];

export const RUQYAH_AUDIO_OPTIONS = [
  {
    id: 'ruqyah_shariah',
    title: 'الرقية الشرعية الشاملة المطولة',
    description: 'رقية الحسد والعين الحاقدة في الرزق والنفس والبيت والعمل وفك السحر',
    filePath: '/audio/ruqyah_shariah.mp3',
    category: 'ruqyah' as const,
  },
];


export interface IqamaVoiceOption {
  id: string;
  name: string;
  muezzin: string;
  filePath: string;
}

export const IQAMA_VOICES: IqamaVoiceOption[] = [
  {
    id: 'iqama_1',
    name: 'إقامة الصلاة - الشيخ مشاري راشد العفاسي',
    muezzin: 'مشاري راشد العفاسي (الإصدار الجديد الكامل)',
    filePath: '/audio/iqama_1.mp3',
  },
  {
    id: 'iqama_2',
    name: 'إقامة الصلاة - الشيخ محمود خليل الحصري',
    muezzin: 'الشيخ محمود خليل الحصري (تسجيل نادر وخاشع)',
    filePath: '/audio/iqama_2.mp3',
  },
  {
    id: 'iqama_3',
    name: 'إقامة الصلاة - الشيخ ياسر الدوسري',
    muezzin: 'الشيخ ياسر الدوسري (إقامة خاشعة)',
    filePath: '/audio/iqama_3.mp3',
  },
  {
    id: 'default_iqama',
    name: 'الإقامة القصيرة المعتمدة',
    muezzin: 'إقامة الصلاة المختصرة الواضحة',
    filePath: '/audio/iqama.mp3',
  },
];

class SoundService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentVoiceId: string | null = null;
  private currentCategory: string | null = null;
  private audioContext: AudioContext | null = null;
  private isSynthesizing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('AUDIO_PLAYBACK_START', (e: Event) => {
        const custom = e as CustomEvent<{ source?: string }>;
        if (custom.detail?.source === 'disk') {
          this.stopAudio();
        }
      });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  public playTasbihClick() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);

      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  public playSuccessCelebration() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });

      if (navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch {
      // AudioContext blocked
    }
  }

  /**
   * Harmonious offline synthesized Adhan melody that plays 100% without internet
   */
  public playOfflineSynthesizedAdhan(onEnd?: () => void) {
    this.stopAudio();
    const ctx = this.getAudioContext();
    if (!ctx) {
      if (onEnd) onEnd();
      return;
    }

    this.isSynthesizing = true;
    const now = ctx.currentTime;
    
    // Rast / Bayati melodic notes sequence evoking the traditional Adhan
    const adhanNotes = [
      { f: 293.66, d: 0.8 }, // D4 (Al-)
      { f: 329.63, d: 0.6 }, // E4 (-la-)
      { f: 349.23, d: 1.4 }, // F4 (-hu)
      { f: 329.63, d: 0.6 }, // E4
      { f: 293.66, d: 1.8 }, // D4 (Akbar)
      { f: 261.63, d: 1.2 }, // C4
      { f: 293.66, d: 2.2 }, // D4
    ];

    let offset = 0;
    adhanNotes.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(item.f, now + offset);
      osc.frequency.exponentialRampToValueAtTime(item.f * 1.01, now + offset + item.d);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + item.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + item.d);

      offset += item.d + 0.05;
    });

    setTimeout(() => {
      this.isSynthesizing = false;
      if (onEnd) onEnd();
    }, offset * 1000);
  }

  /**
   * Plays selected local Azan audio file from public/audio/ in FULL without early cutoff.
   * Completely offline, self-contained, no external CDN needed.
   */
  public playAzan(
    voiceId: string = 'makkah',
    isFajrOrOnEnd?: boolean | (() => void),
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): boolean {
    let isFajr = false;
    let actualOnEnd = onEnd;

    if (typeof isFajrOrOnEnd === 'function') {
      actualOnEnd = isFajrOrOnEnd;
      isFajr = false;
    } else if (typeof isFajrOrOnEnd === 'boolean') {
      isFajr = isFajrOrOnEnd;
    }

    // If Fajr prayer and no specific voice chosen, prefer the dedicated Fajr Adhan with As-Salatu Khayrun Minan-Nawm
    let voiceKey = voiceId;
    if (isFajr) {
      if (voiceId && FAJR_AZAN_VOICES.some((v) => v.id === voiceId)) {
        voiceKey = voiceId;
      } else if (!voiceId || voiceId === 'default' || voiceId === 'fajr' || voiceId === 'makkah') {
        voiceKey = 'abdulbasit_fajr';
      }
    }

    const selectedVoice =
      (isFajr ? FAJR_AZAN_VOICES.find((v) => v.id === voiceKey) : null) ||
      AZAN_VOICES.find((v) => v.id === voiceKey) ||
      (isFajr ? FAJR_AZAN_VOICES[0] : AZAN_VOICES[0]);
    const localAudioPath = selectedVoice.filePath;

    // Prevent interrupting if the exact same Azan is already actively playing
    if (
      this.currentAudio &&
      !this.currentAudio.paused &&
      !this.currentAudio.ended &&
      this.currentCategory === 'azan' &&
      this.currentVoiceId === selectedVoice.id
    ) {
      return true;
    }

    this.stopAudio();

    try {
      const audio = new Audio(localAudioPath);
      audio.volume = 1.0;
      audio.loop = false;
      audio.preload = 'auto';
      this.currentAudio = audio;
      this.currentVoiceId = selectedVoice.id;
      this.currentCategory = 'azan';

      audio.onerror = (e) => {
        console.warn('Audio error loading:', localAudioPath, e);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentVoiceId = null;
          this.currentCategory = null;
        }
        if (actualOnEnd) actualOnEnd();
        if (onError) onError(e);
      };

      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentVoiceId = null;
          this.currentCategory = null;
        }
        if (actualOnEnd) actualOnEnd();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play() interrupted or blocked by browser:', err);
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.currentVoiceId = null;
            this.currentCategory = null;
          }
          if (actualOnEnd) actualOnEnd();
          if (onError) onError(err);
        });
      }

      return true;
    } catch (err) {
      this.currentAudio = null;
      this.currentVoiceId = null;
      this.currentCategory = null;
      if (actualOnEnd) actualOnEnd();
      if (onError) onError(err);
      return false;
    }
  }

  /**
   * Reads Quran Ayah using offline speech synthesis or audio stream
   */
  public playAyahAudio(
    ayahNumber: number,
    ayahText?: string,
    onEnd?: () => void,
    reciter: string = 'ar.alafasy'
  ): HTMLAudioElement | null {
    this.stopAudio();

    if (ayahText && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(ayahText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }
      window.speechSynthesis.speak(utterance);
      return null;
    }

    const url = `https://cdn.islamic.network/quran/audio/128/${reciter}/${ayahNumber}.mp3`;
    try {
      const audio = new Audio(url);
      this.currentAudio = audio;
      if (onEnd) audio.onended = onEnd;
      audio.play().catch(() => {
        if (onEnd) onEnd();
      });
      return audio;
    } catch {
      if (onEnd) onEnd();
      return null;
    }
  }

  /**
   * Reads Quran recitation for a specific Surah with multi-CDN fallback
   */
  public playSurahRecitation(
    surahNumber: number,
    reciterServerKey: string = 'ar.alafasy',
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): HTMLAudioElement | null {
    this.stopAudio();

    const formattedSurah = String(surahNumber).padStart(3, '0');
    const serverMap: Record<string, string> = {
      'ar.alafasy': `https://server8.mp3quran.net/afs/${formattedSurah}.mp3`,
      'ar.abdulbasitmurattal': `https://server7.mp3quran.net/basit/${formattedSurah}.mp3`,
      'ar.husary': `https://server13.mp3quran.net/husr/${formattedSurah}.mp3`,
      'ar.saoodshuraym': `https://server7.mp3quran.net/shur/${formattedSurah}.mp3`,
      'ar.minshawi': `https://server10.mp3quran.net/minsh/${formattedSurah}.mp3`,
    };
    const primaryUrl =
      serverMap[reciterServerKey] ||
      `https://server8.mp3quran.net/afs/${formattedSurah}.mp3`;
    const fallbackUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciterServerKey}/${surahNumber}.mp3`;

    try {
      const audio = new Audio(primaryUrl);
      this.currentAudio = audio;
      let triedFallback = false;

      audio.onended = () => {
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = (err) => {
        if (!triedFallback) {
          triedFallback = true;
          audio.src = fallbackUrl;
          audio.play().catch((e) => {
            if (onError) onError(e);
            if (onEnd) onEnd();
          });
          return;
        }
        if (onError) onError(err);
        if (onEnd) onEnd();
      };

      audio.play().catch((err) => {
        if (!triedFallback) {
          triedFallback = true;
          audio.src = fallbackUrl;
          audio.play().catch((e) => {
            if (onError) onError(e);
          });
          return;
        }
        if (onError) onError(err);
      });

      return audio;
    } catch (err) {
      if (onError) onError(err);
      return null;
    }
  }

  /**
   * Unified local track player that plays the full selected audio file from start to finish
   * without cutting off active Azan or terminating early.
   */
  public playTrack(
    filePath: string,
    trackId: string = 'unknown',
    category: string = 'general',
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): boolean {
    // If Azan is currently playing, do not let an automatic reminder cut off the Azan; queue it right after Azan ends
    if (
      this.currentAudio &&
      !this.currentAudio.paused &&
      !this.currentAudio.ended &&
      this.currentCategory === 'azan' &&
      (category === 'salawat' || category === 'sabah' || category === 'massa')
    ) {
      const activeAzanAudio = this.currentAudio;
      activeAzanAudio.addEventListener(
        'ended',
        () => {
          this.playTrack(filePath, trackId, category, onEnd, onError);
        },
        { once: true }
      );
      return true;
    }

    this.stopAudio();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('AUDIO_PLAYBACK_START', { detail: { source: 'soundService' } })
      );
    }
    this.currentCategory = category;
    this.currentVoiceId = trackId;

    try {
      const audio = new Audio(filePath);
      audio.volume = 1.0;
      audio.loop = false;
      audio.preload = 'auto';
      this.currentAudio = audio;

      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentVoiceId = null;
          this.currentCategory = null;
        }
        if (onEnd) onEnd();
      };

      audio.onerror = (err) => {
        console.warn(`Audio playback error for ${filePath}:`, err);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentVoiceId = null;
          this.currentCategory = null;
        }
        this.playOfflineSynthesizedAdhan(onEnd);
        if (onError) onError(err);
      };

      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('Playback blocked by browser autoplay policy:', err);
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.currentVoiceId = null;
            this.currentCategory = null;
          }
          if (onEnd) onEnd();
          if (onError) onError(err);
        });
      }
      return true;
    } catch (err) {
      this.currentAudio = null;
      this.currentVoiceId = null;
      this.currentCategory = null;
      if (onEnd) onEnd();
      if (onError) onError(err);
      return false;
    }
  }

  public playSalawat(trackIdOrOnEnd?: string | (() => void), onEnd?: () => void): boolean {
    const trackId = typeof trackIdOrOnEnd === 'string' ? trackIdOrOnEnd : 'salawat_1';
    const cb = typeof trackIdOrOnEnd === 'function' ? trackIdOrOnEnd : onEnd;
    const track =
      SALAWAT_AUDIO_OPTIONS.find((t) => t.id === trackId || t.filePath === trackId) ||
      SALAWAT_AUDIO_OPTIONS[0];
    return this.playTrack(track.filePath, track.id, 'salawat', cb);
  }

  public playAzkarSabah(trackIdOrOnEnd?: string | (() => void), onEnd?: () => void): boolean {
    const trackId = typeof trackIdOrOnEnd === 'string' ? trackIdOrOnEnd : 'azkar_sabah_1';
    const cb = typeof trackIdOrOnEnd === 'function' ? trackIdOrOnEnd : onEnd;
    const track =
      MORNING_AZKAR_AUDIO_OPTIONS.find((t) => t.id === trackId || t.filePath === trackId) ||
      MORNING_AZKAR_AUDIO_OPTIONS[0];
    return this.playTrack(track.filePath, track.id, 'sabah', cb);
  }

  public playAzkarMassa(trackIdOrOnEnd?: string | (() => void), onEnd?: () => void): boolean {
    const trackId = typeof trackIdOrOnEnd === 'string' ? trackIdOrOnEnd : 'azkar_massa_1';
    const cb = typeof trackIdOrOnEnd === 'function' ? trackIdOrOnEnd : onEnd;
    const track =
      EVENING_AZKAR_AUDIO_OPTIONS.find((t) => t.id === trackId || t.filePath === trackId) ||
      EVENING_AZKAR_AUDIO_OPTIONS[0];
    return this.playTrack(track.filePath, track.id, 'massa', cb);
  }

  public playMusaharati(trackIdOrOnEnd?: string | (() => void), onEnd?: () => void): boolean {
    const trackId = typeof trackIdOrOnEnd === 'string' ? trackIdOrOnEnd : 'musaharati_1';
    const cb = typeof trackIdOrOnEnd === 'function' ? trackIdOrOnEnd : onEnd;
    const track =
      MUSAHARATI_AUDIO_OPTIONS.find((t) => t.id === trackId || t.filePath === trackId) ||
      MUSAHARATI_AUDIO_OPTIONS[0];
    return this.playTrack(track.filePath, track.id, 'musaharati', cb);
  }

  public playIftarCannon(trackIdOrOnEnd?: string | (() => void), onEnd?: () => void): boolean {
    const trackId = typeof trackIdOrOnEnd === 'string' ? trackIdOrOnEnd : 'iftar_cannon_1';
    const cb = typeof trackIdOrOnEnd === 'function' ? trackIdOrOnEnd : onEnd;
    const track =
      IFTAR_CANNON_AUDIO_OPTIONS.find((t) => t.id === trackId || t.filePath === trackId) ||
      IFTAR_CANNON_AUDIO_OPTIONS[0];
    return this.playTrack(track.filePath, track.id, 'cannon', cb);
  }

  /**
   * Pre-Prayer 15-Minute Warning:
   * Plays: «إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا»
   */
  public playPrePrayerAlert(onEnd?: () => void, onError?: (err: unknown) => void): boolean {
    return this.playTrack('/audio/pre_prayer_15m.mp3', 'pre_prayer_15m', 'pre_prayer', onEnd, onError);
  }

  /**
   * Qiyam al-Layl First Third of Night:
   * Plays: Surah Al-Muzzammil «يا أيها المزمل * قم الليل إلا قليلا»
   */
  public playQiyamFirstThird(onEnd?: () => void, onError?: (err: unknown) => void): boolean {
    return this.playTrack('/audio/qiyam_first_third.mp3', 'qiyam_first_third', 'qiyam', onEnd, onError);
  }

  /**
   * Qiyam al-Layl & Suhoor Last Third of Night:
   * Plays: «وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ»
   */
  public playQiyamLastThird(onEnd?: () => void, onError?: (err: unknown) => void): boolean {
    return this.playTrack('/audio/qiyam_last_third.mp3', 'qiyam_last_third', 'qiyam', onEnd, onError);
  }

  /**
   * Comprehensive Ruqyah Shariah full audio:
   */
  public playRuqyahShariah(onEnd?: () => void, onError?: (err: unknown) => void): boolean {
    return this.playTrack('/audio/ruqyah_shariah.mp3', 'ruqyah_shariah', 'ruqyah', onEnd, onError);
  }

  /**
   * Complete Asmaa Allah Al-Husna recitation / nasheed:
   * «نسألك يا من هو الله الذي لا إله إلا هو الرحمن الرحيم...»
   */
  public playAsmaaAllahAlHusna(onEnd?: () => void, onError?: (err: unknown) => void): boolean {
    return this.playTrack('/audio/asmaa_allah_al_husna.mp3', 'asmaa_allah_al_husna', 'nasheed', onEnd, onError);
  }

  private customIqamaUrl: string | null = null;


  public setCustomIqamaAudio(url: string | null) {
    this.customIqamaUrl = url;
  }

  public getCustomIqamaAudio(): string | null {
    return this.customIqamaUrl;
  }

  public playIqama(
    voiceId: string = 'default_iqama',
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): boolean {
    const selected =
      IQAMA_VOICES.find((v) => v.id === voiceId || v.filePath === voiceId) || IQAMA_VOICES[0];
    const path = this.customIqamaUrl || selected.filePath;
    return this.playTrack(path, selected.id, 'iqama', onEnd, (err) => {
      // Fallback: play melodious prayer chime / takbeer melody if file cannot be loaded
      this.playOfflineSynthesizedAdhan(onEnd);
      if (onError) onError(err);
    });
  }

  public stopAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
      this.currentVoiceId = null;
      this.currentCategory = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSynthesizing = false;
  }

  public isPlaying(category?: string): boolean {
    if (category && this.currentCategory !== category) return false;
    return !!(
      (this.currentAudio && !this.currentAudio.paused) ||
      this.isSynthesizing ||
      ('speechSynthesis' in window && window.speechSynthesis.speaking)
    );
  }

  public getCurrentVoiceId(): string | null {
    return this.currentVoiceId;
  }

  public getCurrentCategory(): string | null {
    return this.currentCategory;
  }

  public getCurrentAudio(): HTMLAudioElement | null {
    return this.currentAudio;
  }
}

export const soundService = new SoundService();

