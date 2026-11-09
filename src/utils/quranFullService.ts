/**
 * Complete Quran Offline Data Service
 * Loads all 114 Surahs and 6,236 Ayahs from local project file public/data/quran_uthmani.json
 * 100% offline, zero external API dependency.
 */

export interface QuranAyah {
  number: number;
  numberInSurah: number;
  text: string;
  page: number;
  juz: number;
}

export interface QuranSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
  ayahs: QuranAyah[];
}

export interface QuranPageGroup {
  surahNumber: number;
  surahName: string;
  revelationType: string;
  ayahs: QuranAyah[];
}

let cachedQuran: QuranSurah[] | null = null;
let pageToAyahsMap: Map<number, QuranPageGroup[]> | null = null;
let isLoading = false;
let loadPromise: Promise<QuranSurah[]> | null = null;

export async function loadFullQuran(): Promise<QuranSurah[]> {
  if (cachedQuran) return cachedQuran;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    isLoading = true;
    try {
      const response = await fetch('/data/quran_uthmani.json');
      if (!response.ok) {
        throw new Error(`Failed to load quran data: ${response.status}`);
      }
      const data: QuranSurah[] = await response.json();
      cachedQuran = data;

      // Index ayahs by page for instant O(1) page lookups
      const pageMap = new Map<number, QuranPageGroup[]>();
      for (const surah of data) {
        for (const ayah of surah.ayahs) {
          const page = ayah.page;
          if (!pageMap.has(page)) {
            pageMap.set(page, []);
          }
          const groups = pageMap.get(page)!;
          let currentGroup = groups.find((g) => g.surahNumber === surah.number);
          if (!currentGroup) {
            currentGroup = {
              surahNumber: surah.number,
              surahName: surah.name,
              revelationType: surah.revelationType,
              ayahs: [],
            };
            groups.push(currentGroup);
          }
          currentGroup.ayahs.push(ayah);
        }
      }
      pageToAyahsMap = pageMap;
      return data;
    } catch (err) {
      console.error('Error loading offline Quran:', err);
      return [];
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Synchronous getter if already loaded
 */
export function getLoadedQuran(): QuranSurah[] | null {
  return cachedQuran;
}

/**
 * Get all ayahs displayed on a specific Madinah Mushaf page (1 to 604)
 */
export async function getPageAyahs(pageNumber: number): Promise<QuranPageGroup[]> {
  if (!pageToAyahsMap) {
    await loadFullQuran();
  }
  return pageToAyahsMap?.get(pageNumber) || [];
}

/**
 * Fast local search across all 6,236 Ayahs
 */
export async function searchLocalQuran(query: string, maxResults = 50): Promise<
  Array<{
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    ayahNumberInSurah: number;
    text: string;
    page: number;
  }>
> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  const quran = await loadFullQuran();
  const normalizedQuery = normalizeArabic(clean);
  const results: Array<{
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    ayahNumberInSurah: number;
    text: string;
    page: number;
  }> = [];

  for (const surah of quran) {
    for (const ayah of surah.ayahs) {
      const normalizedAyah = normalizeArabic(ayah.text);
      if (normalizedAyah.includes(normalizedQuery)) {
        results.push({
          surahNumber: surah.number,
          surahName: surah.name,
          ayahNumber: ayah.number,
          ayahNumberInSurah: ayah.numberInSurah,
          text: ayah.text,
          page: ayah.page,
        });
        if (results.length >= maxResults) return results;
      }
    }
  }

  return results;
}

/**
 * Removes diacritics and normalizes letters for flexible search
 */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Remove tashkeel/diacritics
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u200E\u200F\uFEFF]/g, '')
    .trim();
}
