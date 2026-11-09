/**
 * Offline Manager for Quran Recitations
 * Uses CacheStorage and IndexedDB to cache audio files for complete offline playback
 */

const CACHE_NAME = 'azan-recitations-cache-v1';
const METADATA_KEY = 'azan_downloaded_recitations_meta';

export interface DownloadedItem {
  id: string; // reciterId_surahNumber
  reciterId: string;
  reciterName: string;
  surahNumber: number;
  surahName: string;
  url: string;
  sizeBytes: number;
  downloadedAt: number;
}

class RecitationOfflineManager {
  private metaList: DownloadedItem[] = [];

  constructor() {
    this.loadMeta();
  }

  private loadMeta() {
    try {
      const raw = localStorage.getItem(METADATA_KEY);
      if (raw) {
        this.metaList = JSON.parse(raw);
      }
    } catch {
      this.metaList = [];
    }
  }

  private saveMeta() {
    try {
      localStorage.setItem(METADATA_KEY, JSON.stringify(this.metaList));
    } catch {
      // storage quota or private browsing
    }
  }

  public getDownloadKey(reciterId: string, surahNumber: number): string {
    return `${reciterId}_${surahNumber}`;
  }

  public isDownloaded(reciterId: string, surahNumber: number): boolean {
    const key = this.getDownloadKey(reciterId, surahNumber);
    return this.metaList.some((item) => item.id === key);
  }

  public getDownloadedList(): DownloadedItem[] {
    return [...this.metaList];
  }

  public async getPlayableUrl(reciterId: string, surahNumber: number, fallbackUrl: string): Promise<string> {
    const key = this.getDownloadKey(reciterId, surahNumber);
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(fallbackUrl);
        if (match) {
          const blob = await match.blob();
          return URL.createObjectURL(blob);
        }
      } catch (err) {
        console.warn('Failed to retrieve audio from cache:', err);
      }
    }
    return fallbackUrl;
  }

  public async downloadSurah(
    reciterId: string,
    reciterName: string,
    surahNumber: number,
    surahName: string,
    audioUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      if (!('caches' in window)) {
        throw new Error('CacheStorage not supported');
      }

      onProgress?.(10);
      const response = await fetch(audioUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Download failed with status: ${response.status}`);
      }

      onProgress?.(50);
      const cache = await caches.open(CACHE_NAME);
      await cache.put(audioUrl, response.clone());

      const blob = await response.blob();
      const sizeBytes = blob.size;

      const key = this.getDownloadKey(reciterId, surahNumber);
      this.metaList = this.metaList.filter((m) => m.id !== key);
      this.metaList.push({
        id: key,
        reciterId,
        reciterName,
        surahNumber,
        surahName,
        url: audioUrl,
        sizeBytes,
        downloadedAt: Date.now(),
      });
      this.saveMeta();

      onProgress?.(100);
      return true;
    } catch (err) {
      console.error('Failed to download recitation:', err);
      return false;
    }
  }

  public async deleteDownloadedSurah(reciterId: string, surahNumber: number, audioUrl: string): Promise<boolean> {
    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(audioUrl);
      }
      const key = this.getDownloadKey(reciterId, surahNumber);
      this.metaList = this.metaList.filter((m) => m.id !== key);
      this.saveMeta();
      return true;
    } catch (err) {
      console.error('Failed to delete cached audio:', err);
      return false;
    }
  }

  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}

export const recitationOfflineManager = new RecitationOfflineManager();
