/**
 * Offline Quran Tafseer Service (التفسير الميسر كاملاً بدون إنترنت)
 * Source: مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة
 * 100% Offline - All 114 Surahs and 6,236 Ayahs.
 */

export interface AyahTafseerItem {
  surahNumber: number;
  surahName?: string;
  numberInSurah: number;
  ayahNumber?: number;
  text: string;
}

export interface TafseerDataset {
  edition: string;
  source: string;
  totalAyahs: number;
  byKey: Record<string, string>;
  byPage: Record<string, AyahTafseerItem[]>;
}

let cachedTafseer: TafseerDataset | null = null;
let loadPromise: Promise<TafseerDataset | null> | null = null;

export async function loadFullTafseer(): Promise<TafseerDataset | null> {
  if (cachedTafseer) return cachedTafseer;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const response = await fetch('/data/quran_tafseer_muyassar.json');
      if (!response.ok) {
        throw new Error(`Failed to load tafseer data: ${response.status}`);
      }
      const data: TafseerDataset = await response.json();
      cachedTafseer = data;
      return data;
    } catch (err) {
      console.error('Error loading offline Tafseer:', err);
      return null;
    }
  })();

  return loadPromise;
}

/**
 * Get full unabridged Tafseer for a specific Ayah (Surah:Ayah)
 */
export async function getAyahTafseer(
  surahNumber: number,
  numberInSurah: number
): Promise<string> {
  const data = await loadFullTafseer();
  if (!data) return 'تعذر تحميل التفسير في الوقت الحالي.';
  const key = `${surahNumber}:${numberInSurah}`;
  return data.byKey[key] || 'لا يوجد تفسير متوفر لهذه الآية.';
}

/**
 * Get all Tafseers for all Ayahs on a specific Mushaf page (1 to 604)
 */
export async function getPageTafseers(pageNumber: number): Promise<AyahTafseerItem[]> {
  const data = await loadFullTafseer();
  if (!data) return [];
  return data.byPage[pageNumber] || [];
}

/**
 * Search inside Tafseer texts across all 6,236 Ayahs
 */
export async function searchTafseer(
  query: string,
  limit = 30
): Promise<Array<{ surahNumber: number; numberInSurah: number; text: string }>> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  const data = await loadFullTafseer();
  if (!data) return [];

  const results: Array<{ surahNumber: number; numberInSurah: number; text: string }> = [];
  const normalizedQuery = clean.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');

  for (const [key, text] of Object.entries(data.byKey)) {
    const normalizedText = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
    if (normalizedText.includes(normalizedQuery)) {
      const [surahStr, ayahStr] = key.split(':');
      results.push({
        surahNumber: Number(surahStr),
        numberInSurah: Number(ayahStr),
        text,
      });
      if (results.length >= limit) break;
    }
  }

  return results;
}
