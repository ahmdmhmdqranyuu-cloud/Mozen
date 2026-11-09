/**
 * Global Persistent Quran Recitation Player Service
 * - Keeps recitation playing seamlessly when navigating across all app sections and modals
 * - Multi-CDN failover (CacheStorage offline -> mp3quran -> quranicaudio -> islamic.network)
 * - MediaSession API integration for background & lock-screen controls
 */

import {
  RECITERS_LIST,
  SURAH_LIST,
  Reciter,
  SurahAudioItem,
  getSurahAudioCandidateUrls,
} from '../data/recitersData';
import { recitationOfflineManager } from './recitationOfflineManager';
import { userStatsTracker } from './userStatsTracker';

export interface RecitationPlayerState {
  currentSurah: SurahAudioItem | null;
  currentReciter: Reciter;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  isExpanded: boolean; // false = floating circular vinyl button; true = expanded control bar
  errorMessage: string | null;
}

type Listener = (state: RecitationPlayerState) => void;

class RecitationPlayerService {
  private audio: HTMLAudioElement | null = null;
  private candidateUrls: string[] = [];
  private candidateIndex: number = 0;
  private listeners: Set<Listener> = new Set();
  private lastTrackedPlaybackTime: number = 0;

  private state: RecitationPlayerState = {
    currentSurah: null,
    currentReciter: RECITERS_LIST[0],
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    playbackSpeed: 1.0,
    isExpanded: false,
    errorMessage: null,
  };

  public getState(): RecitationPlayerState {
    return { ...this.state };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<RecitationPlayerState>) {
    this.state = { ...this.state, ...partial };
    const snapshot = this.getState();
    this.listeners.forEach((l) => l(snapshot));
  }

  public setReciter(reciter: Reciter) {
    const wasPlaying = this.state.isPlaying;
    const activeSurah = this.state.currentSurah;
    this.updateState({ currentReciter: reciter });
    if (activeSurah && wasPlaying) {
      this.playSurah(activeSurah, reciter, true);
    }
  }

  public setExpanded(expanded: boolean) {
    this.updateState({ isExpanded: expanded });
  }

  public toggleExpanded() {
    this.updateState({ isExpanded: !this.state.isExpanded });
  }

  public async playBySurahNumber(surahNumber: number, reciterIdOrEdition?: string) {
    const surah = SURAH_LIST.find((s) => s.number === surahNumber) || SURAH_LIST[0];
    let reciter = this.state.currentReciter;
    if (reciterIdOrEdition) {
      const found = RECITERS_LIST.find(
        (r) => r.id === reciterIdOrEdition || r.islamicNetworkEdition === reciterIdOrEdition
      );
      if (found) reciter = found;
    }
    await this.playSurah(surah, reciter);
  }

  public async playSurah(
    surah: SurahAudioItem,
    reciter: Reciter = this.state.currentReciter,
    forceReload: boolean = false
  ) {
    // If clicking the exact same surah and reciter without forceReload, toggle play/pause
    if (
      !forceReload &&
      this.state.currentSurah?.number === surah.number &&
      this.state.currentReciter.id === reciter.id &&
      this.audio
    ) {
      this.togglePlayPause();
      return;
    }

    this.cleanupCurrentAudio();

    this.updateState({
      currentSurah: surah,
      currentReciter: reciter,
      isLoading: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      errorMessage: null,
    });

    const rawCandidates = getSurahAudioCandidateUrls(reciter, surah.number);
    const firstPlayable = await recitationOfflineManager.getPlayableUrl(
      reciter.id,
      surah.number,
      rawCandidates[0]
    );

    this.candidateUrls = [firstPlayable, ...rawCandidates.slice(1)];
    this.candidateIndex = 0;

    this.loadAndPlayCurrentCandidate();
  }

  private loadAndPlayCurrentCandidate() {
    const surah = this.state.currentSurah;
    const reciter = this.state.currentReciter;
    if (!surah || this.candidateIndex >= this.candidateUrls.length) {
      this.updateState({
        isLoading: false,
        isPlaying: false,
        errorMessage: 'تعذر تحميل التلاوة، يرجى التحقق من الاتصال بالإنترنت',
      });
      return;
    }

    const url = this.candidateUrls[this.candidateIndex];
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.playbackRate = this.state.playbackSpeed;
    this.audio = audio;

    audio.onloadedmetadata = () => {
      if (this.audio !== audio) return;
      this.updateState({
        duration: isFinite(audio.duration) ? audio.duration : 0,
        isLoading: false,
      });
    };

    audio.oncanplay = () => {
      if (this.audio !== audio) return;
      this.updateState({ isLoading: false });
    };

    audio.ontimeupdate = () => {
      if (this.audio !== audio) return;
      const nowTime = audio.currentTime;
      const delta = nowTime - this.lastTrackedPlaybackTime;
      if (delta >= 1 && delta <= 10) {
        this.lastTrackedPlaybackTime = nowTime;
        userStatsTracker.recordRecitationListeningSeconds(Math.floor(delta));
      } else if (delta < 0 || delta > 10) {
        this.lastTrackedPlaybackTime = nowTime;
      }
      this.updateState({
        currentTime: nowTime,
        duration: isFinite(audio.duration) ? audio.duration : this.state.duration,
      });
    };

    audio.onplay = () => {
      if (this.audio !== audio) return;
      this.lastTrackedPlaybackTime = audio.currentTime || 0;
      userStatsTracker.recordRecitationStarted(reciter.id, surah.number);
      this.updateState({ isPlaying: true, isLoading: false, errorMessage: null });
      this.setupMediaSession(surah, reciter);
    };

    audio.onpause = () => {
      if (this.audio !== audio) return;
      if (!audio.ended) {
        this.updateState({ isPlaying: false });
      }
    };

    audio.onended = () => {
      if (this.audio !== audio) return;
      this.updateState({ isPlaying: false, currentTime: 0 });
      this.playNextSurah();
    };

    audio.onerror = () => {
      if (this.audio !== audio) return;
      // Try next CDN candidate seamlessly
      this.candidateIndex += 1;
      if (this.candidateIndex < this.candidateUrls.length) {
        this.loadAndPlayCurrentCandidate();
      } else {
        this.updateState({
          isLoading: false,
          isPlaying: false,
          errorMessage: 'تعذر تشغيل الملف الصوتي من الخادم حالياً',
        });
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (this.audio === audio) {
            this.updateState({ isPlaying: true, isLoading: false, errorMessage: null });
          }
        })
        .catch(() => {
          if (this.audio !== audio) return;
          // Try next candidate if source failed
          if (audio.error) {
            this.candidateIndex += 1;
            if (this.candidateIndex < this.candidateUrls.length) {
              this.loadAndPlayCurrentCandidate();
              return;
            }
          }
          this.updateState({ isPlaying: false, isLoading: false });
        });
    }
  }

  public togglePlayPause() {
    if (!this.audio) {
      if (this.state.currentSurah) {
        this.playSurah(this.state.currentSurah, this.state.currentReciter, true);
      }
      return;
    }

    if (this.state.isPlaying && !this.audio.paused) {
      this.audio.pause();
      this.updateState({ isPlaying: false });
    } else {
      this.audio
        .play()
        .then(() => this.updateState({ isPlaying: true, errorMessage: null }))
        .catch(() => {
          // Reload if stream expired
          if (this.state.currentSurah) {
            this.playSurah(this.state.currentSurah, this.state.currentReciter, true);
          }
        });
    }
  }

  public playNextSurah() {
    const currentNumber = this.state.currentSurah?.number || 1;
    const nextNumber = currentNumber < 114 ? currentNumber + 1 : 1;
    const nextSurah = SURAH_LIST.find((s) => s.number === nextNumber) || SURAH_LIST[0];
    this.playSurah(nextSurah, this.state.currentReciter, true);
  }

  public playPreviousSurah() {
    const currentNumber = this.state.currentSurah?.number || 1;
    // If more than 5 seconds into the surah, restart current surah
    if (this.audio && this.audio.currentTime > 5) {
      this.seekTo(0);
      return;
    }
    const prevNumber = currentNumber > 1 ? currentNumber - 1 : 114;
    const prevSurah = SURAH_LIST.find((s) => s.number === prevNumber) || SURAH_LIST[0];
    this.playSurah(prevSurah, this.state.currentReciter, true);
  }

  public seekTo(seconds: number) {
    if (!this.audio) return;
    const validTime = Math.max(0, Math.min(seconds, this.state.duration || seconds));
    this.audio.currentTime = validTime;
    this.updateState({ currentTime: validTime });
  }

  public cycleSpeed() {
    const speeds = [1.0, 1.25, 1.5, 0.85];
    const nextIdx = (speeds.indexOf(this.state.playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    if (this.audio) {
      this.audio.playbackRate = nextSpeed;
    }
    this.updateState({ playbackSpeed: nextSpeed });
  }

  public stopAndClose() {
    this.cleanupCurrentAudio();
    this.updateState({
      currentSurah: null,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      isExpanded: false,
      errorMessage: null,
    });
  }

  private cleanupCurrentAudio() {
    if (this.audio) {
      try {
        this.audio.onended = null;
        this.audio.onerror = null;
        this.audio.ontimeupdate = null;
        this.audio.onplay = null;
        this.audio.onpause = null;
        this.audio.pause();
        this.audio.src = '';
      } catch {
        // ignore
      }
      this.audio = null;
    }
  }

  private setupMediaSession(surah: SurahAudioItem, reciter: Reciter) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `سورة ${surah.name}`,
        artist: reciter.name,
        album: 'تطبيق المؤذن - التلاوات القرآنية',
        artwork: [
          { src: reciter.photoUrl, sizes: '256x256', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.playNextSurah());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.playPreviousSurah());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          this.seekTo(details.seekTime);
        }
      });
    } catch {
      // ignore if browser restricts mediaSession
    }
  }
}

export const recitationPlayerService = new RecitationPlayerService();
