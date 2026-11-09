/**
 * Disk Audio Player Service
 * Handles long-form background audio playback with a floating turntable/disk player:
 * - Ruqyah Shariah (الرقية الشرعية المطولة)
 * - Asmaa Allah Al-Husna (أسماء الله الحسنى 99)
 * - Fully offline using local project audio files
 * - MediaSession API for Android/iOS lock screen controls
 * - Seamless playback across all modals and navigation
 */

export interface DiskAudioTrack {
  id: string;
  type: 'ruqyah' | 'asmaa_allah' | 'general';
  title: string;
  subtitle: string;
  audioUrl: string;
  artworkUrl?: string;
}

export interface DiskPlayerState {
  track: DiskAudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  isExpanded: boolean;
  playbackRate: number;
}

type Listener = (state: DiskPlayerState) => void;

export const RUQYAH_TRACK: DiskAudioTrack = {
  id: 'ruqyah_shariah_full',
  type: 'ruqyah',
  title: 'الرقية الشرعية الشاملة المطولة',
  subtitle: 'رقية الحسد والعين والمس وفك السحر • كاملة بدون إنترنت',
  audioUrl: '/audio/ruqyah_shariah.mp3',
  artworkUrl: '/assets/settings_icons/icon_azkar.jpg',
};

export const ASMAA_ALLAH_TRACK: DiskAudioTrack = {
  id: 'asmaa_allah_al_husna_full',
  type: 'asmaa_allah',
  title: 'أسماء الله الحسنى الـ 99',
  subtitle: 'نسألك يا من هو الله الذي لا إله إلا هو الرحمن الرحيم',
  audioUrl: '/audio/asmaa_allah_al_husna.mp3',
  artworkUrl: '/assets/settings_icons/icon_profile.jpg',
};

class DiskAudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<Listener> = new Set();

  private state: DiskPlayerState = {
    track: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    isExpanded: false,
    playbackRate: 1.0,
  };

  public getState(): DiskPlayerState {
    return { ...this.state };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snap = this.getState();
    this.listeners.forEach((l) => l(snap));
  }

  private updateState(partial: Partial<DiskPlayerState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public setExpanded(expanded: boolean) {
    this.updateState({ isExpanded: expanded });
  }

  public toggleExpanded() {
    this.updateState({ isExpanded: !this.state.isExpanded });
  }

  public playRuqyah(): void {
    if (this.state.track?.type === 'ruqyah' && this.audio) {
      this.togglePlayPause();
      return;
    }
    this.playTrack(RUQYAH_TRACK);
  }

  public playAsmaaAllah(): void {
    if (this.state.track?.type === 'asmaa_allah' && this.audio) {
      this.togglePlayPause();
      return;
    }
    this.playTrack(ASMAA_ALLAH_TRACK);
  }

  public playTrack(track: DiskAudioTrack): void {
    this.cleanup();

    this.updateState({
      track,
      isLoading: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isExpanded: false, // starts in compact disk mode as requested
    });

    try {
      const audio = new Audio(track.audioUrl);
      audio.preload = 'auto';
      audio.playbackRate = this.state.playbackRate;
      this.audio = audio;

      audio.onloadedmetadata = () => {
        if (this.audio === audio) {
          this.updateState({
            duration: audio.duration || 0,
            isLoading: false,
          });
        }
      };

      audio.ontimeupdate = () => {
        if (this.audio === audio) {
          this.updateState({
            currentTime: audio.currentTime || 0,
            duration: audio.duration || this.state.duration,
          });
        }
      };

      audio.onplay = () => {
        if (this.audio === audio) {
          this.updateState({ isPlaying: true, isLoading: false });
          this.setupMediaSession(track);
        }
      };

      audio.onpause = () => {
        if (this.audio === audio) {
          this.updateState({ isPlaying: false });
        }
      };

      audio.onended = () => {
        if (this.audio === audio) {
          this.updateState({ isPlaying: false, currentTime: 0 });
        }
      };

      audio.onerror = (e) => {
        console.warn('Disk player error:', e);
        if (this.audio === audio) {
          this.updateState({ isLoading: false, isPlaying: false });
        }
      };

      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.warn('Autoplay blocked or playback interrupted:', err);
          if (this.audio === audio) {
            this.updateState({ isLoading: false, isPlaying: false });
          }
        });
      }
    } catch (err) {
      console.warn('Failed to start audio element:', err);
      this.updateState({ isLoading: false, isPlaying: false });
    }
  }

  public togglePlayPause(): void {
    if (!this.audio) {
      if (this.state.track) {
        this.playTrack(this.state.track);
      }
      return;
    }

    if (this.audio.paused) {
      this.audio.play().catch(console.warn);
    } else {
      this.audio.pause();
    }
  }

  public seekTo(seconds: number): void {
    if (!this.audio) return;
    const clamped = Math.max(0, Math.min(seconds, this.audio.duration || seconds));
    this.audio.currentTime = clamped;
    this.updateState({ currentTime: clamped });
  }

  public seekBy(deltaSeconds: number): void {
    if (!this.audio) return;
    const target = (this.audio.currentTime || 0) + deltaSeconds;
    this.seekTo(target);
  }

  public setPlaybackRate(rate: number): void {
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
    this.updateState({ playbackRate: rate });
  }

  public stop(): void {
    this.cleanup();
    this.updateState({
      track: null,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      isExpanded: false,
    });
  }

  private cleanup(): void {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.onloadedmetadata = null;
        this.audio.ontimeupdate = null;
        this.audio.onplay = null;
        this.audio.onpause = null;
        this.audio.onended = null;
        this.audio.onerror = null;
      } catch {
        // ignore
      }
      this.audio = null;
    }
  }

  private setupMediaSession(track: DiskAudioTrack): void {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: 'تطبيق المؤذن',
        album: 'الأذكار والرقية الشرعية',
        artwork: [
          { src: track.artworkUrl || '/assets/settings_icons/icon_azkar.jpg', sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
      navigator.mediaSession.setActionHandler('seekbackward', () => this.seekBy(-15));
      navigator.mediaSession.setActionHandler('seekforward', () => this.seekBy(15));
      navigator.mediaSession.setActionHandler('stop', () => this.stop());
    } catch {
      // ignore
    }
  }
}

export const diskAudioPlayerService = new DiskAudioPlayerService();
