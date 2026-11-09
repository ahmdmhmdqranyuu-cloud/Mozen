/**
 * Offline Quran Pages Cache Manager (604 Pages)
 * Utilizes standard Web CacheStorage API for robust persistent offline storage
 */

import { getPageImageUrl } from '../data/quranPagesData';

const CACHE_NAME = 'mushaf-madani-pages-v1';
const TOTAL_PAGES = 604;
const LOCAL_STORAGE_PROGRESS_KEY = 'mushaf_download_progress';

export interface DownloadProgress {
  downloadedCount: number;
  total: number;
  percentage: number;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'error';
  currentPage: number;
  errorMessage?: string;
}

type ProgressListener = (progress: DownloadProgress) => void;

class QuranOfflineManager {
  private isPaused = false;
  private isCancelled = false;
  private listeners: Set<ProgressListener> = new Set();
  private progress: DownloadProgress = {
    downloadedCount: 0,
    total: TOTAL_PAGES,
    percentage: 0,
    status: 'idle',
    currentPage: 1,
  };

  constructor() {
    this.refreshCachedCount();
  }

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.progress);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.progress }));
  }

  /**
   * Refreshes the count of already cached pages
   */
  public async refreshCachedCount(): Promise<number> {
    if (!('caches' in window)) return 0;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const count = keys.length;
      const pct = Math.round((count / TOTAL_PAGES) * 100);

      this.progress = {
        ...this.progress,
        downloadedCount: count,
        percentage: pct,
        status: count >= TOTAL_PAGES ? 'completed' : this.progress.status,
      };
      this.notify();
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Check if a specific page is cached locally
   */
  public async isPageCached(pageNumber: number): Promise<boolean> {
    if (!('caches' in window)) return false;
    try {
      const cache = await caches.open(CACHE_NAME);
      const url = getPageImageUrl(pageNumber);
      const match = await cache.match(url);
      return !!match;
    } catch {
      return false;
    }
  }

  /**
   * Get image source URL for a page: checks cache first, then network with auto-caching
   */
  public async getPageUrl(pageNumber: number): Promise<string> {
    const defaultUrl = getPageImageUrl(pageNumber);
    if (!('caches' in window)) return defaultUrl;

    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(defaultUrl);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return URL.createObjectURL(blob);
      }

      // If online, fetch and cache asynchronously for future offline visits
      if (navigator.onLine) {
        fetch(defaultUrl)
          .then((res) => {
            if (res.ok) {
              cache.put(defaultUrl, res.clone());
              this.refreshCachedCount();
            }
          })
          .catch(() => {
            // ignore background caching failure
          });
      }
      return defaultUrl;
    } catch {
      return defaultUrl;
    }
  }

  /**
   * Starts or resumes bulk downloading of all 604 pages
   */
  public async startBulkDownload(): Promise<void> {
    if (this.progress.status === 'downloading') return;
    this.isPaused = false;
    this.isCancelled = false;

    this.progress.status = 'downloading';
    this.notify();

    if (!('caches' in window)) {
      this.progress.status = 'error';
      this.progress.errorMessage = 'متصفحك لا يدعم خاصية التخزين المحلي';
      this.notify();
      return;
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      
      for (let page = 1; page <= TOTAL_PAGES; page++) {
        if (this.isCancelled) {
          this.progress.status = 'idle';
          this.notify();
          return;
        }

        if (this.isPaused) {
          this.progress.status = 'paused';
          this.notify();
          return;
        }

        const url = getPageImageUrl(page);
        const exists = await cache.match(url);

        if (!exists) {
          try {
            const res = await fetch(url, { mode: 'cors' });
            if (res.ok) {
              await cache.put(url, res);
            }
          } catch (err) {
            // If offline during fetch
            if (!navigator.onLine) {
              this.progress.status = 'paused';
              this.progress.errorMessage = 'انقطع الاتصال بالإنترنت. يمكنك استكمال التحميل عند عودة الاتصال.';
              this.notify();
              return;
            }
          }
        }

        // Update progress every 2 pages or at the end
        if (page % 2 === 0 || page === TOTAL_PAGES) {
          const keys = await cache.keys();
          const count = keys.length;
          this.progress.downloadedCount = count;
          this.progress.currentPage = page;
          this.progress.percentage = Math.round((count / TOTAL_PAGES) * 100);
          this.notify();
        }

        // Slight micro-pause to keep UI responsive and prevent browser throttling
        await new Promise((r) => setTimeout(r, 20));
      }

      this.progress.status = 'completed';
      this.progress.downloadedCount = TOTAL_PAGES;
      this.progress.percentage = 100;
      this.notify();
    } catch (e: unknown) {
      this.progress.status = 'error';
      this.progress.errorMessage = (e as Error)?.message || 'حدث خطأ أثناء تنزيل صفحات المصحف';
      this.notify();
    }
  }

  public pauseDownload(): void {
    this.isPaused = true;
    this.progress.status = 'paused';
    this.notify();
  }

  public cancelDownload(): void {
    this.isCancelled = true;
    this.isPaused = false;
    this.progress.status = 'idle';
    this.notify();
  }

  public async clearCache(): Promise<void> {
    if (!('caches' in window)) return;
    try {
      await caches.delete(CACHE_NAME);
      this.progress = {
        downloadedCount: 0,
        total: TOTAL_PAGES,
        percentage: 0,
        status: 'idle',
        currentPage: 1,
      };
      this.notify();
    } catch {
      // ignore
    }
  }

  public getProgress(): DownloadProgress {
    return { ...this.progress };
  }
}

export const quranOfflineManager = new QuranOfflineManager();
