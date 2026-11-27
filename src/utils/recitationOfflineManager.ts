/**
 * Offline Manager for Quran Recitations
 * Uses IndexedDB as the primary binary audio storage (with CacheStorage fallback)
 * for reliable offline playback across sessions.
 */

import { Reciter } from '../data/recitersData';

const IDB_NAME = 'azan_recitations_offline_db';
const IDB_VERSION = 1;
const IDB_STORE = 'audio_files';
const CACHE_NAME = 'azan-recitations-cache-v1';
const METADATA_KEY = 'azan_downloaded_recitations_meta';
const PRIORITIZE_OFFLINE_KEY = 'azan_prioritize_offline_audio';

export const MAJOR_SURAH_NUMBERS: number[] = [
  1,   // الفاتحة
  2,   // البقرة
  12,  // يوسف
  18,  // الكهف
  19,  // مريم
  20,  // طه
  36,  // يس
  55,  // الرحمن
  56,  // الواقعة
  67,  // الملك
  78,  // النبأ
  112, // الإخلاص
  113, // الفلق
  114, // الناس
];

export interface DownloadedItem {
  id: string; // reciterId_surahNumber
  reciterId: string;
  reciterName: string;
  surahNumber: number;
  surahName: string;
  url: string;
  mimeType?: string;
  sizeBytes: number;
  downloadedAt: number;
}

interface StoredOfflineRecitation extends DownloadedItem {
  blob: Blob;
}

type OfflineManagerListener = () => void;

class RecitationOfflineManager {
  private metaList: DownloadedItem[] = [];
  private activeDownloads: Map<string, number> = new Map();
  private listeners: Set<OfflineManagerListener> = new Set();
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private isHydrated = false;

  constructor() {
    this.loadMeta();
    void this.hydrateFromIndexedDB();
  }

  public subscribe(listener: OfflineManagerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // ignore subscriber errors
      }
    });
  }

  private loadMeta() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(METADATA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.metaList = parsed;
        }
      }
    } catch {
      this.metaList = [];
    }
  }

  private saveMeta() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(METADATA_KEY, JSON.stringify(this.metaList));
    } catch {
      // storage quota or private browsing
    }
  }

  private openDatabase(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.resolve(null);
    }
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
            store.createIndex('reciterId', 'reciterId', { unique: false });
            store.createIndex('surahNumber', 'surahNumber', { unique: false });
          }
        };
        request.onsuccess = () => {
          resolve(request.result);
        };
        request.onerror = () => {
          console.warn('IndexedDB open failed:', request.error);
          this.dbPromise = null;
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB unavailable:', err);
        this.dbPromise = null;
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private async hydrateFromIndexedDB(): Promise<void> {
    if (this.isHydrated) return;
    const db = await this.openDatabase();
    if (!db) return;

    try {
      const records = await new Promise<StoredOfflineRecitation[]>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as StoredOfflineRecitation[]) || []);
        req.onerror = () => reject(req.error);
      });

      if (records.length > 0) {
        const map = new Map<string, DownloadedItem>();
        // Preserve any legacy CacheStorage metadata entries while prioritizing authoritative IDB records
        for (const item of this.metaList) {
          map.set(item.id, item);
        }
        for (const rec of records) {
          map.set(rec.id, {
            id: rec.id,
            reciterId: rec.reciterId,
            reciterName: rec.reciterName,
            surahNumber: rec.surahNumber,
            surahName: rec.surahName,
            url: rec.url,
            mimeType: rec.mimeType || rec.blob?.type || 'audio/mpeg',
            sizeBytes: rec.sizeBytes || rec.blob?.size || 0,
            downloadedAt: rec.downloadedAt || Date.now(),
          });
        }
        this.metaList = Array.from(map.values()).sort((a, b) => b.downloadedAt - a.downloadedAt);
        this.saveMeta();
        this.notifyListeners();
      }
      this.isHydrated = true;
    } catch (err) {
      console.warn('Failed to hydrate offline recitations from IndexedDB:', err);
    }
  }

  private async putInIndexedDB(record: StoredOfflineRecitation): Promise<boolean> {
    const db = await this.openDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.error('IndexedDB put error:', req.error);
          resolve(false);
        };
      } catch (err) {
        console.error('IndexedDB put exception:', err);
        resolve(false);
      }
    });
  }

  private async getFromIndexedDB(key: string): Promise<StoredOfflineRecitation | null> {
    const db = await this.openDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result as StoredOfflineRecitation) || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<boolean> {
    const db = await this.openDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  public getDownloadKey(reciterId: string, surahNumber: number): string {
    return `${reciterId}_${surahNumber}`;
  }

  public isDownloaded(reciterId: string, surahNumber: number): boolean {
    const key = this.getDownloadKey(reciterId, surahNumber);
    return this.metaList.some((item) => item.id === key);
  }

  public isDownloading(reciterId: string, surahNumber: number): boolean {
    const key = this.getDownloadKey(reciterId, surahNumber);
    return this.activeDownloads.has(key);
  }

  public getDownloadProgress(reciterId: string, surahNumber: number): number | null {
    const key = this.getDownloadKey(reciterId, surahNumber);
    const val = this.activeDownloads.get(key);
    return typeof val === 'number' ? val : null;
  }

  public getDownloadedList(): DownloadedItem[] {
    return [...this.metaList];
  }

  public getTotalOfflineBytes(): number {
    return this.metaList.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
  }

  public isMajorSurah(surahNumber: number, reciter?: Reciter): boolean {
    if (MAJOR_SURAH_NUMBERS.includes(surahNumber)) return true;
    if (reciter?.recommendedSurahs?.includes(surahNumber)) return true;
    return false;
  }

  public getMajorSurahNumbersForReciter(reciter?: Reciter): number[] {
    const combined = new Set<number>([
      ...MAJOR_SURAH_NUMBERS,
      ...(reciter?.recommendedSurahs || []),
    ]);
    return Array.from(combined).sort((a, b) => a - b);
  }

  public getPrioritizeOfflinePlayback(): boolean {
    try {
      if (typeof localStorage === 'undefined') return true;
      const direct = localStorage.getItem(PRIORITIZE_OFFLINE_KEY);
      if (direct === 'true') return true;
      if (direct === 'false') return false;

      const profileRaw = localStorage.getItem('azan_user_profile');
      if (profileRaw) {
        const parsed = JSON.parse(profileRaw) as { prioritizeOfflineAudio?: boolean };
        if (typeof parsed.prioritizeOfflineAudio === 'boolean') {
          return parsed.prioritizeOfflineAudio;
        }
      }
    } catch {
      // ignore parse error
    }
    return true;
  }

  public setPrioritizeOfflinePlayback(enabled: boolean): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PRIORITIZE_OFFLINE_KEY, enabled ? 'true' : 'false');
        const profileRaw = localStorage.getItem('azan_user_profile');
        if (profileRaw) {
          const parsed = JSON.parse(profileRaw) as Record<string, unknown>;
          parsed.prioritizeOfflineAudio = enabled;
          localStorage.setItem('azan_user_profile', JSON.stringify(parsed));
        }
      }
    } catch {
      // ignore storage errors
    }
    this.notifyListeners();
  }

  /**
   * Returns a playable blob: URL from IndexedDB (or legacy CacheStorage) if stored offline.
   */
  public async getOfflineBlobUrl(reciterId: string, surahNumber: number): Promise<string | null> {
    const key = this.getDownloadKey(reciterId, surahNumber);

    // 1. Check IndexedDB first (primary offline store)
    const idbRecord = await this.getFromIndexedDB(key);
    if (idbRecord?.blob && idbRecord.blob.size > 0) {
      return URL.createObjectURL(idbRecord.blob);
    }

    // 2. Fallback to legacy CacheStorage if previously cached there
    if (typeof window !== 'undefined' && 'caches' in window) {
      const meta = this.metaList.find((m) => m.id === key);
      if (meta?.url) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const match = await cache.match(meta.url);
          if (match) {
            const blob = await match.blob();
            if (blob.size > 0) {
              return URL.createObjectURL(blob);
            }
          }
        } catch (err) {
          console.warn('Failed to retrieve audio from CacheStorage fallback:', err);
        }
      }
    }

    return null;
  }

  public async getPlayableUrl(
    reciterId: string,
    surahNumber: number,
    fallbackUrl: string
  ): Promise<string> {
    const offlineUrl = await this.getOfflineBlobUrl(reciterId, surahNumber);
    if (offlineUrl) return offlineUrl;

    if (typeof window !== 'undefined' && 'caches' in window) {
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

  private async fetchAudioBlobWithProgress(
    url: string,
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const contentLengthHeader = response.headers.get('content-length');
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

    if (response.body && typeof response.body.getReader === 'function') {
      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.byteLength;
          if (totalBytes > 0) {
            const pct = Math.min(95, Math.max(10, Math.round((receivedBytes / totalBytes) * 90) + 5));
            onProgress(pct);
          } else {
            // Indeterminate streaming progress capped at 88%
            const approxPct = Math.min(88, 15 + Math.floor(receivedBytes / 150000) * 5);
            onProgress(approxPct);
          }
        }
      }

      const blob = new Blob(chunks, { type: contentType });
      if (blob.size === 0) {
        throw new Error('Downloaded audio blob is empty');
      }
      return blob;
    }

    onProgress(55);
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Downloaded audio blob is empty');
    }
    return blob;
  }

  public async downloadSurah(
    reciterId: string,
    reciterName: string,
    surahNumber: number,
    surahName: string,
    audioUrlOrCandidates: string | string[],
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    const key = this.getDownloadKey(reciterId, surahNumber);
    if (this.activeDownloads.has(key)) {
      return false;
    }

    const candidates = Array.isArray(audioUrlOrCandidates)
      ? audioUrlOrCandidates
      : [audioUrlOrCandidates];

    const reportProgress = (pct: number) => {
      const clamped = Math.max(0, Math.min(100, pct));
      this.activeDownloads.set(key, clamped);
      onProgress?.(clamped);
      this.notifyListeners();
    };

    reportProgress(5);

    try {
      let downloadedBlob: Blob | null = null;
      let resolvedUrl = candidates[0] || '';

      for (const candidateUrl of candidates) {
        if (!candidateUrl) continue;
        try {
          downloadedBlob = await this.fetchAudioBlobWithProgress(candidateUrl, reportProgress);
          resolvedUrl = candidateUrl;
          break;
        } catch (err) {
          console.warn(`Candidate download failed (${candidateUrl}):`, err);
        }
      }

      if (!downloadedBlob) {
        throw new Error('All CDN candidates failed to download');
      }

      reportProgress(96);

      const record: StoredOfflineRecitation = {
        id: key,
        reciterId,
        reciterName,
        surahNumber,
        surahName,
        url: resolvedUrl,
        mimeType: downloadedBlob.type || 'audio/mpeg',
        sizeBytes: downloadedBlob.size,
        downloadedAt: Date.now(),
        blob: downloadedBlob,
      };

      const savedToIdb = await this.putInIndexedDB(record);

      // If IndexedDB is unavailable in restricted contexts, fall back to CacheStorage
      if (!savedToIdb) {
        if (typeof window !== 'undefined' && 'caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(
            resolvedUrl,
            new Response(downloadedBlob, {
              headers: { 'Content-Type': record.mimeType || 'audio/mpeg' },
            })
          );
        } else {
          throw new Error('Neither IndexedDB nor CacheStorage is available');
        }
      }

      const metaItem: DownloadedItem = {
        id: record.id,
        reciterId: record.reciterId,
        reciterName: record.reciterName,
        surahNumber: record.surahNumber,
        surahName: record.surahName,
        url: record.url,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        downloadedAt: record.downloadedAt,
      };

      this.metaList = [metaItem, ...this.metaList.filter((m) => m.id !== key)];
      this.saveMeta();

      reportProgress(100);
      this.activeDownloads.delete(key);
      this.notifyListeners();
      return true;
    } catch (err) {
      console.error('Failed to download recitation:', err);
      this.activeDownloads.delete(key);
      this.notifyListeners();
      return false;
    }
  }

  public async deleteDownloadedSurah(
    reciterId: string,
    surahNumber: number,
    audioUrl?: string
  ): Promise<boolean> {
    const key = this.getDownloadKey(reciterId, surahNumber);
    const existingMeta = this.metaList.find((m) => m.id === key);
    const urlToDelete = audioUrl || existingMeta?.url;

    try {
      await this.deleteFromIndexedDB(key);

      if (urlToDelete && typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.delete(urlToDelete);
        } catch {
          // ignore CacheStorage cleanup failure
        }
      }

      this.metaList = this.metaList.filter((m) => m.id !== key);
      this.saveMeta();
      this.notifyListeners();
      return true;
    } catch (err) {
      console.error('Failed to delete offline audio:', err);
      return false;
    }
  }

  public async clearAllDownloads(): Promise<boolean> {
    try {
      const db = await this.openDatabase();
      if (db) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(IDB_STORE, 'readwrite');
          const store = tx.objectStore(IDB_STORE);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }

      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          await caches.delete(CACHE_NAME);
        } catch {
          // ignore
        }
      }

      this.metaList = [];
      this.saveMeta();
      this.notifyListeners();
      return true;
    } catch (err) {
      console.error('Failed to clear all offline recitations:', err);
      return false;
    }
  }

  public formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}

export const recitationOfflineManager = new RecitationOfflineManager();
