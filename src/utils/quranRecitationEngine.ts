/**
 * Smart Quranic Recitation, Audio Recording & Alignment Engine («شيخي»)
 * - Real browser audio capture via MediaRecorder + WebAudio RMS voice-activity check + WAV fallback
 * - Word-by-word Quranic alignment with Uthmani/Imla'i tolerance
 * - Verse-jump & repetition detection
 * - Persistent Sheikh progress, range state, session reports, and recurring error log
 */

export type UploadLifecycleStatus =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'preparing'
  | 'uploading'
  | 'analyzing'
  | 'completed'
  | 'failed';

export type RecitationWordStatus = 'correct' | 'error' | 'missing' | 'uncertain' | 'pending';

export interface WordEvaluationItem {
  positionIndex: number;
  expectedWord: string;
  spokenWord?: string;
  status: RecitationWordStatus;
  correctionNote?: string;
}

export interface RecitationEvaluationResult {
  transcribedText: string;
  status: 'perfect' | 'minor_issue' | 'error' | 'not_recited';
  score: number;
  paceStyle?: 'tahqiq' | 'tadwir' | 'hadr' | 'paused';
  acceptedQiraatVariant?: boolean;
  jumpedToOtherAyah?: boolean;
  jumpedAyahNote?: string;
  extraOrRepeatedWords?: string[];
  unclearAudioWarning?: string;
  wordResults: WordEvaluationItem[];
  mistakeSummary: string;
  correctionHint: string;
  sheikhScript: string;
  tajweedTips: string[];
  audioBytesSent?: number;
}

export interface RecordedAudioClip {
  audioBase64: string;
  mimeType: string;
  byteLength: number;
  durationMs: number;
  peakRms: number;
  hasSpeechEnergy: boolean;
  playbackDataUrl?: string;
}

export interface DailyMemorizationStats {
  date: string; // YYYY-MM-DD
  masteredCount: number;
  attemptsCount: number;
  correctWords: number;
  avgScore: number;
}

export type NoiseGateLevel = 'low' | 'medium' | 'high';
export type AnalysisSpeedMode = 'fast' | 'balanced' | 'accurate';

export interface MasteredAyahRecord {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  masteredDate: string;
  nextReviewDate: string;
  reviewStage: number;
  bestScore?: number;
}

export interface WeakAyahErrorRecord {
  key: string; // "surah:ayah"
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  errorCount: number;
  lastErrorIso: string;
  weakWords: string[];
}

export interface SheikhSessionReport {
  id: string;
  dateIso: string;
  surahNumber: number;
  surahName: string;
  ayahsReviewed: number[];
  correctWordsCount: number;
  errorWordsCount: number;
  forgottenWords: string[];
  ayahsNeedingPractice: number[];
  masteryPercent: number;
  durationSeconds: number;
}

export interface PendingRetryItem {
  surahNumber: number;
  ayahNumber: number;
  pageNumber?: number;
  unitType?: 'ayah' | 'page';
  expectedText: string;
  mode: 'talqeen' | 'recitation' | 'memorization_test';
  createdAtIso: string;
  lastError: string;
}

export interface SheikhPersistentState {
  lastSurah: number;
  lastAyah: number;
  lastPage: number;
  unitType: 'ayah' | 'page';
  selectedReciter: string;
  dialect: 'egyptian' | 'fusha';
  targetRepeats: number;
  rangeStart: number;
  rangeEnd: number;
  playbackUnit: 'full' | 'chunked';
  correctionMode: 'instant' | 'training';
  autoAdvanceOnMastery: boolean;
  autoRepeatFailedAyah: boolean;
  micSensitivity: number; // 0.5 .. 2.5 (default 1.0)
  noiseGateLevel: NoiseGateLevel;
  analysisSpeed: AnalysisSpeedMode;
  hapticFeedbackEnabled: boolean;
  quickCorrectionPopupEnabled: boolean;
  dailyMemorizedHistory: Record<string, DailyMemorizationStats>;
  masteredAyahs: Record<string, MasteredAyahRecord>;
  weakAyahErrors: Record<string, WeakAyahErrorRecord>;
  sessionHistory: SheikhSessionReport[];
  pendingRetries: PendingRetryItem[];
  repetitionCount: number;
  testsPassed: number;
}

const SHEIKH_STATE_STORAGE_KEY = 'moazen_sheikh_state_v3';
const LEGACY_PROGRESS_KEY = 'moazen_sheikh_progress_v2';

export function createDefaultSheikhState(): SheikhPersistentState {
  let legacyMastered: Record<string, MasteredAyahRecord> = {};
  let legacyRepetition = 0;
  let legacyTests = 0;

  if (typeof localStorage !== 'undefined') {
    try {
      const legacyRaw = localStorage.getItem(LEGACY_PROGRESS_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        legacyMastered = parsed.masteredAyahs || {};
        legacyRepetition = Number(parsed.repetitionCount) || 0;
        legacyTests = Number(parsed.testsPassed) || 0;
      }
    } catch {
      // ignore legacy parse error
    }
  }

  return {
    lastSurah: 1,
    lastAyah: 1,
    lastPage: 1,
    unitType: 'ayah',
    selectedReciter: 'husary',
    dialect: 'egyptian',
    targetRepeats: 3,
    rangeStart: 1,
    rangeEnd: 7,
    playbackUnit: 'full',
    correctionMode: 'instant',
    autoAdvanceOnMastery: true,
    autoRepeatFailedAyah: true,
    micSensitivity: 1.0,
    noiseGateLevel: 'medium',
    analysisSpeed: 'balanced',
    hapticFeedbackEnabled: true,
    quickCorrectionPopupEnabled: true,
    dailyMemorizedHistory: {},
    masteredAyahs: legacyMastered,
    weakAyahErrors: {},
    sessionHistory: [],
    pendingRetries: [],
    repetitionCount: legacyRepetition,
    testsPassed: legacyTests,
  };
}

export function loadSheikhPersistentState(): SheikhPersistentState {
  const defaults = createDefaultSheikhState();
  if (typeof localStorage === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(SHEIKH_STATE_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      lastPage:
        typeof parsed.lastPage === 'number' && parsed.lastPage >= 1 && parsed.lastPage <= 604
          ? parsed.lastPage
          : 1,
      unitType: parsed.unitType === 'page' ? 'page' : 'ayah',
      micSensitivity:
        typeof parsed.micSensitivity === 'number'
          ? Math.max(0.5, Math.min(2.5, parsed.micSensitivity))
          : 1.0,
      noiseGateLevel:
        parsed.noiseGateLevel === 'low' ||
        parsed.noiseGateLevel === 'medium' ||
        parsed.noiseGateLevel === 'high'
          ? parsed.noiseGateLevel
          : 'medium',
      analysisSpeed:
        parsed.analysisSpeed === 'fast' ||
        parsed.analysisSpeed === 'balanced' ||
        parsed.analysisSpeed === 'accurate'
          ? parsed.analysisSpeed
          : 'balanced',
      hapticFeedbackEnabled:
        typeof parsed.hapticFeedbackEnabled === 'boolean' ? parsed.hapticFeedbackEnabled : true,
      quickCorrectionPopupEnabled:
        typeof parsed.quickCorrectionPopupEnabled === 'boolean'
          ? parsed.quickCorrectionPopupEnabled
          : true,
      dailyMemorizedHistory: parsed.dailyMemorizedHistory || {},
      masteredAyahs: { ...defaults.masteredAyahs, ...(parsed.masteredAyahs || {}) },
      weakAyahErrors: parsed.weakAyahErrors || {},
      sessionHistory: Array.isArray(parsed.sessionHistory) ? parsed.sessionHistory : [],
      pendingRetries: Array.isArray(parsed.pendingRetries) ? parsed.pendingRetries : [],
    };
  } catch {
    return defaults;
  }
}

export function saveSheikhPersistentState(state: SheikhPersistentState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SHEIKH_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Normalizes Arabic & Uthmani Quranic text into canonical skeleton form
 * so Uthmani script variations (like صلوة / رحمن / ٱ) match standard transcription fairly.
 */
export function normalizeQuranicArabic(input: string): string {
  if (!input) return '';
  const s = input
    // Replace Uthmani superscript Alef (\u0670) inside words
    .replace(/\u0670/g, 'ا')
    // Remove diacritics, madd marks, small high signs, Quranic pause marks
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640]/g, '')
    // Normalize alef forms & alef wasla
    .replace(/[أإآٱء]/g, 'ا')
    // Normalize hamza on waw / ya
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // Normalize alif maqsura and ta marbuta
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    // Normalize common Uthmani orthography to spoken standard Arabic (without ASCII \b)
    .replace(/(^|\s)(ال|بال|وال|كال|لال)?صلوا?ه(?=\s|$)/g, '$1$2صلاه')
    .replace(/(^|\s)(ال|بال|وال|كال|لال)?زكوا?ه(?=\s|$)/g, '$1$2زكاه')
    .replace(/(^|\s)(ال|بال|وال|كال|لال)?حيوا?ه(?=\s|$)/g, '$1$2حياه')
    .replace(/(^|\s)(ال|بال|وال)?ربوا(?=\s|$)/g, '$1$2ربا')
    .replace(/(^|\s)يايها(?=\s|$)/g, '$1يا ايها')
    // Remove non-Arabic chars/symbols
    .replace(/[^\u0621-\u064A\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) {
      prev[j] = curr[j];
    }
  }
  return prev[b.length];
}

export function wordSimilarity(expectedRaw: string, spokenRaw: string): number {
  const e = normalizeQuranicArabic(expectedRaw);
  const s = normalizeQuranicArabic(spokenRaw);
  if (!e || !s) return 0;
  if (e === s) return 1;
  // Ignore solitary long 'ا' inserted from superscript alef inside Uthmani stems (e.g. سموات vs سموت)
  const eNoAlif = e.replace(/ا/g, '');
  const sNoAlif = s.replace(/ا/g, '');
  if (eNoAlif && eNoAlif === sNoAlif) return 0.92;

  const maxLen = Math.max(e.length, s.length);
  const dist = levenshteinDistance(e, s);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Aligns spoken Arabic words against expected Uthmani Ayah words in sequence,
 * detecting correct matches, substitutions (error), omissions (missing), unclear matches,
 * and extra/repeated words.
 */
export function alignRecitationWords(
  expectedText: string,
  spokenText: string,
  serverWordResults?: Array<{
    expectedWord?: string;
    spokenWord?: string;
    status?: string;
    positionIndex?: number;
    correctionNote?: string;
  }>
): {
  wordResults: WordEvaluationItem[];
  extraOrRepeatedWords: string[];
  computedScore: number;
} {
  const expectedWords = expectedText.trim().split(/\s+/).filter(Boolean);
  const spokenWords = spokenText.trim().split(/\s+/).filter(Boolean);

  // If Gemini returned valid wordResults matching the ayah words count, normalize & merge safely
  if (Array.isArray(serverWordResults) && serverWordResults.length > 0 && expectedWords.length > 0) {
    const merged: WordEvaluationItem[] = expectedWords.map((expWord, idx) => {
      const match =
        serverWordResults.find((w) => w.positionIndex === idx) || serverWordResults[idx];
      if (!match) {
        return {
          positionIndex: idx,
          expectedWord: expWord,
          status: 'missing',
          correctionNote: 'كلمة ناقصة لم تُسمَع بوضوح',
        };
      }
      const rawStatus = match.status;
      const status: RecitationWordStatus =
        rawStatus === 'correct' ||
        rawStatus === 'error' ||
        rawStatus === 'missing' ||
        rawStatus === 'uncertain'
          ? rawStatus
          : 'error';
      return {
        positionIndex: idx,
        expectedWord: expWord, // Always preserve authentic Mushaf Uthmani spelling
        spokenWord: match.spokenWord,
        status,
        correctionNote: match.correctionNote,
      };
    });

    const correctCount = merged.filter((w) => w.status === 'correct').length;
    const uncertainCount = merged.filter((w) => w.status === 'uncertain').length;
    const computedScore = Math.round(
      ((correctCount + uncertainCount * 0.65) / Math.max(1, merged.length)) * 100
    );

    // Collect repeated/extra words heuristically if spoken has extra tokens
    const extraOrRepeatedWords: string[] = [];
    if (spokenWords.length > expectedWords.length) {
      for (let i = 1; i < spokenWords.length; i++) {
        if (
          normalizeQuranicArabic(spokenWords[i]) &&
          normalizeQuranicArabic(spokenWords[i]) === normalizeQuranicArabic(spokenWords[i - 1])
        ) {
          extraOrRepeatedWords.push(spokenWords[i]);
        }
      }
    }

    return { wordResults: merged, extraOrRepeatedWords, computedScore };
  }

  // Deterministic sequence alignment fallback when evaluating transcript locally
  const usedSpoken = new Set<number>();
  const results: WordEvaluationItem[] = [];
  let cursor = 0;

  for (let i = 0; i < expectedWords.length; i++) {
    const exp = expectedWords[i];
    if (spokenWords.length === 0) {
      results.push({
        positionIndex: i,
        expectedWord: exp,
        status: 'missing',
        correctionNote: 'لم يتم نطق هذه الكلمة',
      });
      continue;
    }

    let bestIdx = -1;
    let bestSim = -1;
    const windowEnd = Math.min(spokenWords.length, cursor + 4);
    for (let j = Math.max(0, cursor - 1); j < windowEnd; j++) {
      if (usedSpoken.has(j)) continue;
      const sim = wordSimilarity(exp, spokenWords[j]);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = j;
      }
    }

    if (bestIdx !== -1 && bestSim >= 0.78) {
      usedSpoken.add(bestIdx);
      cursor = bestIdx + 1;
      results.push({
        positionIndex: i,
        expectedWord: exp,
        spokenWord: spokenWords[bestIdx],
        status: 'correct',
      });
    } else if (bestIdx !== -1 && bestSim >= 0.52) {
      usedSpoken.add(bestIdx);
      cursor = bestIdx + 1;
      results.push({
        positionIndex: i,
        expectedWord: exp,
        spokenWord: spokenWords[bestIdx],
        status: 'uncertain',
        correctionNote: `قريبة من النطق الصحيح (${spokenWords[bestIdx]})`,
      });
    } else if (bestIdx !== -1 && bestSim >= 0.25) {
      usedSpoken.add(bestIdx);
      cursor = bestIdx + 1;
      results.push({
        positionIndex: i,
        expectedWord: exp,
        spokenWord: spokenWords[bestIdx],
        status: 'error',
        correctionNote: `نُطقت «${spokenWords[bestIdx]}» والصواب «${exp}»`,
      });
    } else if (
      cursor < spokenWords.length &&
      !usedSpoken.has(cursor) &&
      (i + 1 >= expectedWords.length || wordSimilarity(expectedWords[i + 1], spokenWords[cursor]) < 0.52)
    ) {
      // Direct positional substitution (e.g. "ملك" spoken instead of "رب")
      const subWord = spokenWords[cursor];
      usedSpoken.add(cursor);
      cursor += 1;
      results.push({
        positionIndex: i,
        expectedWord: exp,
        spokenWord: subWord,
        status: 'error',
        correctionNote: `نُطقت «${subWord}» والصواب «${exp}»`,
      });
    } else {
      results.push({
        positionIndex: i,
        expectedWord: exp,
        status: 'missing',
        correctionNote: `كلمة ناقصة: «${exp}»`,
      });
    }
  }

  const extraOrRepeatedWords = spokenWords.filter((_, idx) => !usedSpoken.has(idx));
  const correctCount = results.filter((w) => w.status === 'correct').length;
  const uncertainCount = results.filter((w) => w.status === 'uncertain').length;
  const computedScore =
    results.length > 0
      ? Math.round(((correctCount + uncertainCount * 0.65) / results.length) * 100)
      : 0;

  return { wordResults: results, extraOrRepeatedWords, computedScore };
}

/**
 * Checks whether a spoken transcript matches another Ayah in the same Surah better than the target Ayah
 * (detecting verse-jumping / confusion).
 */
export function detectVerseJump(
  spokenText: string,
  targetAyahNumber: number,
  surahAyahs: Array<{ numberInSurah: number; text: string }>
): { jumped: boolean; matchedAyahNumber?: number; note?: string } {
  const spokenNorm = normalizeQuranicArabic(spokenText);
  if (!spokenNorm || spokenNorm.split(/\s+/).length < 3) {
    return { jumped: false };
  }

  const targetAyah = surahAyahs.find((a) => a.numberInSurah === targetAyahNumber);
  if (!targetAyah) return { jumped: false };

  const targetScore = alignRecitationWords(targetAyah.text, spokenText).computedScore;
  let bestOtherAyah: number | undefined;
  let bestOtherScore = 0;

  for (const ayah of surahAyahs) {
    if (ayah.numberInSurah === targetAyahNumber) continue;
    const score = alignRecitationWords(ayah.text, spokenText).computedScore;
    if (score > bestOtherScore) {
      bestOtherScore = score;
      bestOtherAyah = ayah.numberInSurah;
    }
  }

  if (bestOtherAyah && bestOtherScore >= 60 && bestOtherScore > targetScore + 20) {
    return {
      jumped: true,
      matchedAyahNumber: bestOtherAyah,
      note: `يبدو أنك انتقلت إلى الآية (${bestOtherAyah}) بدلاً من الآية (${targetAyahNumber})`,
    };
  }

  return { jumped: false };
}

/**
 * Splits a long Ayah into memorable chunks (2-5 words per chunk cleanly along natural breaks)
 */
export function splitAyahIntoChunks(ayahText: string, maxWordsPerChunk = 5): string[] {
  const words = ayahText.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWordsPerChunk + 1) return [ayahText.trim()];

  const chunks: string[] = [];
  let current: string[] = [];
  for (const w of words) {
    current.push(w);
    const endsWithStop = /[\u06D6-\u06DC]$/.test(w);
    if ((endsWithStop && current.length >= 2) || current.length >= maxWordsPerChunk) {
      chunks.push(current.join(' '));
      current = [];
    }
  }
  if (current.length > 0) {
    if (current.length === 1 && chunks.length > 0) {
      chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} ${current[0]}`;
    } else {
      chunks.push(current.join(' '));
    }
  }
  return chunks;
}

/**
 * Encodes Float32 PCM mono audio into a valid RIFF WAV Uint8Array (16kHz / sampleRate, 16-bit PCM)
 */
export function encodeWavBytes(samples: Float32Array, sampleRate = 16000): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, '').trim();
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return uint8ToBase64(bytes);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  return uint8ToBase64(new Uint8Array(buf));
}

function pickSupportedRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return undefined;
}

function resampleTo16kMono(audioBuffer: AudioBuffer): Float32Array {
  const targetRate = 16000;
  const channels = audioBuffer.numberOfChannels;
  const srcRate = audioBuffer.sampleRate;
  const srcLen = audioBuffer.length;

  // Mix down to mono first
  const mono = new Float32Array(srcLen);
  for (let ch = 0; ch < channels; ch++) {
    const chData = audioBuffer.getChannelData(ch);
    const weight = 1 / channels;
    for (let i = 0; i < srcLen; i++) {
      mono[i] += chData[i] * weight;
    }
  }

  if (srcRate === targetRate) return mono;

  const targetLen = Math.max(1, Math.round((srcLen * targetRate) / srcRate));
  const out = new Float32Array(targetLen);
  const ratio = srcRate / targetRate;
  for (let i = 0; i < targetLen; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const s0 = mono[idx] ?? 0;
    const s1 = mono[Math.min(srcLen - 1, idx + 1)] ?? s0;
    out[i] = s0 + (s1 - s0) * frac;
  }
  return out;
}

function computeSamplesPeakRms(samples: Float32Array): number {
  let maxPeak = 0;
  const windowSize = 512;
  for (let start = 0; start < samples.length; start += windowSize) {
    const end = Math.min(samples.length, start + windowSize);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sum / Math.max(1, end - start));
    if (rms > maxPeak) maxPeak = rms;
  }
  return maxPeak;
}

export function inspectAudioMagicMime(
  bytes: Uint8Array,
  fallbackMime?: string,
  fileName?: string
): string | null {
  if (!bytes || bytes.length < 12) return null;
  const b0 = bytes[0], b1 = bytes[1], b2 = bytes[2], b3 = bytes[3];
  const ascii4 = String.fromCharCode(b0, b1, b2, b3);
  const ascii8 = bytes.length >= 8 ? String.fromCharCode(...Array.from(bytes.subarray(0, 8))) : '';

  if (ascii4 === 'RIFF' && String.fromCharCode(...Array.from(bytes.subarray(8, 12))) === 'WAVE') {
    return 'audio/wav';
  }
  if (ascii4 === 'fLaC') return 'audio/flac';
  if (ascii4 === 'OggS') return 'audio/ogg';
  if (b0 === 0x1a && b1 === 0x45 && b2 === 0xdf && b3 === 0xa3) return 'audio/webm';
  if (ascii4.startsWith('ID3') || (b0 === 0xff && (b1 & 0xe0) === 0xe0)) {
    if (b0 === 0xff && (b1 & 0xf6) === 0xf0) return 'audio/aac';
    return 'audio/mp3';
  }
  if (ascii4 === 'ADIF') return 'audio/aac';
  if (String.fromCharCode(...Array.from(bytes.subarray(4, 8))) === 'ftyp') {
    const brand = String.fromCharCode(...Array.from(bytes.subarray(8, 12))).toLowerCase();
    return brand.startsWith('3gp') ? 'audio/3gpp' : 'audio/mp4';
  }
  if (ascii8.startsWith('#!AMR')) return 'audio/amr';

  const cleanMime = String(fallbackMime || '').split(';')[0].trim().toLowerCase();
  if (cleanMime.startsWith('audio/')) {
    if (cleanMime === 'audio/mpeg' || cleanMime === 'audio/mpeg3') return 'audio/mp3';
    if (cleanMime === 'audio/m4a' || cleanMime === 'audio/x-m4a') return 'audio/mp4';
    if (cleanMime === 'audio/x-wav' || cleanMime === 'audio/wave') return 'audio/wav';
    return cleanMime;
  }

  const ext = String(fileName || '').split('.').pop()?.toLowerCase() || '';
  const extMap: Record<string, string> = {
    wav: 'audio/wav',
    mp3: 'audio/mp3',
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    webm: 'audio/webm',
    ogg: 'audio/ogg',
    opus: 'audio/ogg',
    aac: 'audio/aac',
    flac: 'audio/flac',
    '3gp': 'audio/3gpp',
    amr: 'audio/amr',
  };
  return extMap[ext] || null;
}

async function decodeBytesToWav16k(
  rawBytes: Uint8Array
): Promise<{ wavBytes: Uint8Array; durationMs: number; peakRms: number } | null> {
  const AudioCtx =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!AudioCtx) return null;

  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioCtx();
    const sliceCopy = rawBytes.slice().buffer;
    const decoded = await ctx.decodeAudioData(sliceCopy);
    const mono16k = resampleTo16kMono(decoded);
    const peakRms = computeSamplesPeakRms(mono16k);
    const durationMs = Math.round(decoded.duration * 1000);
    const wavBytes = encodeWavBytes(mono16k, 16000);
    return { wavBytes, durationMs, peakRms };
  } catch {
    return null;
  } finally {
    if (ctx) {
      ctx.close().catch(() => {});
    }
  }
}

/**
 * Validates, analyzes energy, and normalizes an uploaded audio file
 * (.mp3, .wav, .m4a, .webm, .ogg, .aac, .flac, .3gp, .amr) for Sheikh evaluation.
 */
export async function prepareUploadedAudioFile(
  file: File,
  options?: { noiseGateLevel?: NoiseGateLevel }
): Promise<RecordedAudioClip & { fileName: string }> {
  if (!file || file.size < 800) {
    throw new Error('الملف الصوتي المختار صغير جداً أو فارغ.');
  }
  if (file.size > 18 * 1024 * 1024) {
    throw new Error('حجم الملف الصوتي يتجاوز الحد الأقصى المسموح (18 ميجابايت).');
  }

  const rawBuf = new Uint8Array(await file.arrayBuffer());
  const detectedMime = inspectAudioMagicMime(rawBuf, file.type, file.name);
  if (!detectedMime) {
    throw new Error(
      `صيغة الملف «${file.name}» غير مدعومة. الصيغ المدعومة: MP3, WAV, M4A, OGG, AAC, WebM, FLAC.`
    );
  }

  const noiseGate = options?.noiseGateLevel || 'medium';
  const minPeak = noiseGate === 'high' ? 0.005 : noiseGate === 'low' ? 0.0018 : 0.0028;

  // Attempt browser decode -> 16kHz WAV (works for MP3, WAV, M4A, OGG, WebM, AAC, FLAC on modern Chromium/Android)
  // Keep raw file when WAV would exceed 14MB so long MP3 recordings upload compactly
  const decoded = await decodeBytesToWav16k(rawBuf);
  if (decoded && decoded.wavBytes.byteLength <= 14 * 1024 * 1024) {
    const hasSpeechEnergy = decoded.durationMs >= 300 && decoded.peakRms >= minPeak;
    const base64 = uint8ToBase64(decoded.wavBytes);
    return {
      audioBase64: base64,
      mimeType: 'audio/wav',
      byteLength: decoded.wavBytes.byteLength,
      durationMs: decoded.durationMs,
      peakRms: decoded.peakRms,
      hasSpeechEnergy,
      playbackDataUrl: `data:audio/wav;base64,${base64}`,
      fileName: file.name,
    };
  }

  // Fallback: raw validated bytes (e.g. long compressed MP3/M4A or AMR)
  const rawBase64 = uint8ToBase64(rawBuf);
  const fallbackRms = decoded ? decoded.peakRms : 0.05;
  const fallbackDuration = decoded ? decoded.durationMs : Math.max(1500, Math.round(rawBuf.byteLength / 8));
  return {
    audioBase64: rawBase64,
    mimeType: detectedMime,
    byteLength: rawBuf.byteLength,
    durationMs: fallbackDuration,
    peakRms: fallbackRms,
    hasSpeechEnergy: decoded ? decoded.peakRms >= minPeak : rawBuf.byteLength >= 800,
    playbackDataUrl: `data:${detectedMime};base64,${rawBase64}`,
    fileName: file.name,
  };
}

/**
 * Browser Microphone Recorder with real-time RMS level monitoring,
 * guaranteed AudioContext sink routing, track cleanup, and 16kHz WAV transcoding.
 */
export class QuranMicRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioCtx: AudioContext | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private silentGain: GainNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private mediaChunks: Blob[] = [];
  private rafId: number | null = null;
  private startTime = 0;
  private peakRms = 0;
  private audibleFrames = 0;
  private usingWavFallback = false;
  private mimeType = 'audio/webm';
  private onLevelChange?: (level: number) => void;
  private sensitivityMultiplier = 1.0;
  private noiseGateLevel: NoiseGateLevel = 'medium';

  public async start(
    onLevelChange?: (level: number) => void,
    options?: { sensitivity?: number; noiseGateLevel?: NoiseGateLevel }
  ): Promise<void> {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      throw new Error('المتصفح الحالي لا يدعم الوصول إلى الميكروفون (getUserMedia).');
    }

    this.onLevelChange = onLevelChange;
    this.sensitivityMultiplier = Math.max(0.5, Math.min(2.5, options?.sensitivity ?? 1.0));
    this.noiseGateLevel = options?.noiseGateLevel ?? 'medium';
    this.mediaChunks = [];
    this.pcmChunks = [];
    this.peakRms = 0;
    this.audibleFrames = 0;
    this.usingWavFallback = false;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.startTime = Date.now();

    const gateFloor =
      this.noiseGateLevel === 'low' ? 0.0035 : this.noiseGateLevel === 'high' ? 0.011 : 0.006;

    // Set up Web Audio metering WITH a zero-gain sink node so mobile browsers/WebViews actively process audio frames
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioCtx) {
      this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume().catch(() => {});
      }
      this.micSource = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.silentGain = this.audioCtx.createGain();
      this.silentGain.gain.value = 0;

      this.micSource.connect(this.analyser);
      this.analyser.connect(this.silentGain);
      this.silentGain.connect(this.audioCtx.destination);

      const dataArr = new Float32Array(this.analyser.fftSize);
      const pollLevel = () => {
        if (!this.analyser) return;
        this.analyser.getFloatTimeDomainData(dataArr);
        let sum = 0;
        for (let i = 0; i < dataArr.length; i++) {
          sum += dataArr[i] * dataArr[i];
        }
        const rawRms = Math.sqrt(sum / dataArr.length);
        const scaledRms = rawRms * this.sensitivityMultiplier;
        if (scaledRms > this.peakRms) this.peakRms = scaledRms;
        if (scaledRms > gateFloor) this.audibleFrames++;
        this.onLevelChange?.(Math.min(1, scaledRms * 5.5));
        this.rafId = requestAnimationFrame(pollLevel);
      };
      this.rafId = requestAnimationFrame(pollLevel);
    }

    const supportedMime = pickSupportedRecorderMime();
    if (typeof MediaRecorder !== 'undefined') {
      try {
        this.mediaRecorder = supportedMime
          ? new MediaRecorder(this.stream, { mimeType: supportedMime })
          : new MediaRecorder(this.stream);
        this.mimeType = (this.mediaRecorder.mimeType || supportedMime || 'audio/webm')
          .split(';')[0]
          .trim();

        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            this.mediaChunks.push(e.data);
          }
        };
        this.mediaRecorder.start(250);
        return;
      } catch {
        // Fallback to raw PCM WAV capture below
      }
    }

    // WAV PCM fallback using ScriptProcessorNode
    if (this.audioCtx && this.micSource) {
      this.usingWavFallback = true;
      this.mimeType = 'audio/wav';
      this.scriptProcessor = this.audioCtx.createScriptProcessor(4096, 1, 1);
      this.scriptProcessor.onaudioprocess = (e) => {
        const channel = e.inputBuffer.getChannelData(0);
        this.pcmChunks.push(new Float32Array(channel));
      };
      this.micSource.connect(this.scriptProcessor);
      if (this.silentGain) {
        this.scriptProcessor.connect(this.silentGain);
      } else {
        this.scriptProcessor.connect(this.audioCtx.destination);
      }
    } else {
      throw new Error('تعذر تهيئة مسجل الصوت على هذا الجهاز.');
    }
  }

  public async stopAndFinalize(): Promise<RecordedAudioClip> {
    let durationMs = Math.max(0, Date.now() - this.startTime);

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    let audioBase64 = '';
    let byteLength = 0;
    let finalMime = this.mimeType;
    let decodedPeakRms = this.peakRms;

    try {
      if (!this.usingWavFallback && this.mediaRecorder) {
        const mr = this.mediaRecorder;
        if (mr.state !== 'inactive') {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 2500);
            mr.onstop = () => {
              clearTimeout(timeout);
              resolve();
            };
            try {
              mr.requestData();
            } catch {
              // ignore requestData unsupported
            }
            mr.stop();
          });
        }

        const blob = new Blob(this.mediaChunks, { type: finalMime || 'audio/webm' });
        const rawBytes = new Uint8Array(await blob.arrayBuffer());
        byteLength = rawBytes.byteLength;

        if (byteLength > 0) {
          // Decode & normalize to 16kHz mono WAV when browser supports decoding (ensures universal server + Gemini compatibility & accurate RMS check)
          const normalized = await decodeBytesToWav16k(rawBytes);
          if (normalized && normalized.wavBytes.byteLength <= 14 * 1024 * 1024) {
            finalMime = 'audio/wav';
            byteLength = normalized.wavBytes.byteLength;
            audioBase64 = uint8ToBase64(normalized.wavBytes);
            decodedPeakRms = Math.max(decodedPeakRms, normalized.peakRms * this.sensitivityMultiplier);
            if (normalized.durationMs > 0) durationMs = normalized.durationMs;
          } else {
            finalMime =
              inspectAudioMagicMime(rawBytes, finalMime) || finalMime || 'audio/webm';
            audioBase64 = uint8ToBase64(rawBytes);
          }
        }
      } else {
        const sampleRate = this.audioCtx?.sampleRate || 16000;
        const totalLength = this.pcmChunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of this.pcmChunks) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        const wavRms = computeSamplesPeakRms(merged) * this.sensitivityMultiplier;
        decodedPeakRms = Math.max(decodedPeakRms, wavRms);
        const wavBytes = encodeWavBytes(merged, sampleRate);
        byteLength = wavBytes.byteLength;
        finalMime = 'audio/wav';
        audioBase64 = uint8ToBase64(wavBytes);
      }
    } finally {
      this.cleanup();
    }

    const minPeak = this.noiseGateLevel === 'high' ? 0.006 : this.noiseGateLevel === 'low' ? 0.002 : 0.0032;
    const hasSpeechEnergy =
      byteLength >= 800 &&
      durationMs >= 320 &&
      (decodedPeakRms >= minPeak || this.audibleFrames >= 2);

    const playbackDataUrl =
      audioBase64 && finalMime ? `data:${finalMime};base64,${audioBase64}` : undefined;

    return {
      audioBase64,
      mimeType: finalMime,
      byteLength,
      durationMs,
      peakRms: decodedPeakRms,
      hasSpeechEnergy,
      playbackDataUrl,
    };
  }

  public abort(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    } catch {
      // ignore
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.mediaRecorder = null;
    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {
        // ignore
      }
      this.scriptProcessor = null;
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch {
        // ignore
      }
      this.analyser = null;
    }
    if (this.silentGain) {
      try {
        this.silentGain.disconnect();
      } catch {
        // ignore
      }
      this.silentGain = null;
    }
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {
        // ignore
      }
      this.micSource = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.stream = null;
    }
  }
}

export interface EvaluateRequestPayload {
  clip: RecordedAudioClip;
  expectedText: string;
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  pageNumber?: number;
  unitType?: 'ayah' | 'page';
  dialect: 'egyptian' | 'fusha';
  mode: 'talqeen' | 'recitation' | 'memorization_test';
  trainingMode?: boolean;
  analysisSpeed?: AnalysisSpeedMode;
  adjacentAyahs?: Array<{ numberInSurah: number; text: string }>;
}

/**
 * Uploads validated recorded or uploaded audio to /api/sheikh/evaluate or /api/sheikh/evaluate-raw
 * with automatic transient retry and strict error reporting.
 */
export async function submitRecitationForAnalysis(
  payload: EvaluateRequestPayload
): Promise<RecitationEvaluationResult> {
  const {
    clip,
    expectedText,
    surahName,
    surahNumber,
    ayahNumber,
    pageNumber,
    unitType = 'ayah',
    dialect,
    mode,
    trainingMode,
    analysisSpeed = 'balanced',
    adjacentAyahs,
  } = payload;

  if (!clip.audioBase64 || clip.byteLength < 800) {
    throw new Error('التسجيل الصوتي قصير جداً أو فارغ. اضغط على الميكروفون أو اختر ملفاً صوتياً واضحاً.');
  }

  if (!clip.hasSpeechEnergy) {
    throw new Error('لم يُلتقَط صوت واضح في التسجيل. تأكد من عدم كتم الصوت واقترب من الميكروفون ثم أعد المحاولة.');
  }

  if (!expectedText || !expectedText.trim()) {
    throw new Error('النص القرآني المراد المقارنة به غير جاهز بعد.');
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('لا يوجد اتصال بالإنترنت حالياً لتحليل التلاوة. تم حفظ المحاولة لإعادة الإرسال عند توفر الشبكة.');
  }

  const adjacentText = (adjacentAyahs || [])
    .filter((a) => Math.abs(a.numberInSurah - ayahNumber) <= 2 && a.numberInSurah !== ayahNumber)
    .map((a) => `الآية ${a.numberInSurah}: ${a.text}`)
    .join('\n');

  const metaObj = {
    expectedText,
    surahName,
    surahNumber,
    ayahNumber,
    pageNumber: unitType === 'page' ? pageNumber : undefined,
    unitType,
    dialect,
    mode,
    trainingMode: Boolean(trainingMode),
    analysisSpeed,
    adjacentAyahsText: adjacentText,
    durationMs: clip.durationMs,
  };

  const performUpload = async (useRawEndpoint: boolean, signal: AbortSignal): Promise<Response> => {
    if (useRawEndpoint) {
      const rawBytes = base64ToUint8(clip.audioBase64);
      const rawBuffer = rawBytes.buffer.slice(rawBytes.byteOffset, rawBytes.byteOffset + rawBytes.byteLength) as ArrayBuffer;
      return fetch('/api/sheikh/evaluate-raw', {
        method: 'POST',
        headers: {
          'Content-Type': clip.mimeType || 'audio/wav',
          'x-sheikh-meta': utf8ToBase64(JSON.stringify(metaObj)),
        },
        signal,
        body: rawBuffer,
      });
    }

    return fetch('/api/sheikh/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        audioBase64: clip.audioBase64,
        mimeType: clip.mimeType,
        ...metaObj,
      }),
    });
  };

  const preferRawFirst = clip.byteLength > 2_400_000;
  const timeoutMs = analysisSpeed === 'fast' ? 28000 : analysisSpeed === 'accurate' ? 55000 : 42000;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const useRaw = attempt === 0 ? preferRawFirst : true;

    try {
      const res = await performUpload(useRaw, controller.signal);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        if (attempt === 0) continue;
        throw new Error(`استجاب الخادم بصيغة غير متوقعة (${res.status}). تحقق من الاتصال وأعد المحاولة.`);
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success || !data.evaluation) {
        const retryable = res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429;
        const serverMsg =
          data?.error ||
          (res.status === 503
            ? 'خدمة تحليل التلاوة غير مهيأة على الخادم حالياً'
            : `فشل تحليل التلاوة (رمز ${res.status})`);
        if (retryable && attempt === 0) {
          await new Promise((r) => setTimeout(r, 700));
          continue;
        }
        throw new Error(serverMsg);
      }

      const ev = data.evaluation;
      const rawTranscript = String(ev.transcribedText || '').trim();
      const aligned = alignRecitationWords(expectedText, rawTranscript, ev.wordResults);

      // Local verse-jump verification only when reciting a single ayah
      let jumpedToOtherAyah = Boolean(ev.jumpedToOtherAyah);
      let jumpedAyahNote = ev.jumpedAyahNote || '';
      if (unitType !== 'page' && !jumpedToOtherAyah && adjacentAyahs && adjacentAyahs.length > 0 && rawTranscript) {
        const localJump = detectVerseJump(rawTranscript, ayahNumber, adjacentAyahs);
        if (localJump.jumped) {
          jumpedToOtherAyah = true;
          jumpedAyahNote = localJump.note || '';
        }
      }

      const finalScore =
        typeof ev.score === 'number' && ev.score >= 0 && ev.score <= 100
          ? ev.score
          : aligned.computedScore;

      return {
        transcribedText: rawTranscript,
        status: ev.status || (finalScore >= 85 ? 'perfect' : finalScore >= 60 ? 'minor_issue' : 'error'),
        score: finalScore,
        paceStyle: ev.paceStyle,
        acceptedQiraatVariant: Boolean(ev.acceptedQiraatVariant),
        jumpedToOtherAyah,
        jumpedAyahNote,
        extraOrRepeatedWords:
          Array.isArray(ev.extraOrRepeatedWords) && ev.extraOrRepeatedWords.length > 0
            ? ev.extraOrRepeatedWords
            : aligned.extraOrRepeatedWords,
        unclearAudioWarning: ev.unclearAudioWarning || undefined,
        wordResults: aligned.wordResults,
        mistakeSummary: ev.mistakeSummary || '',
        correctionHint: ev.correctionHint || '',
        sheikhScript: ev.sheikhScript || '',
        tajweedTips: Array.isArray(ev.tajweedTips) ? ev.tajweedTips : [],
        audioBytesSent: data.audioBytesReceived || clip.byteLength,
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        lastError = new Error('انتهت مهلة الاتصال بالخادم أثناء تحليل التلاوة. اضغط «إعادة المحاولة».');
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
      // Retry network failures once
      if (attempt === 0 && /network|fetch|ECONN|مهلة/i.test(lastError.message)) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('تعذر إرسال التلاوة للتحليل.');
}

/**
 * Fetches natural male Sheikh voice TTS from /api/sheikh/speak, with graceful SpeechSynthesis fallback.
 */
export async function fetchSheikhVoiceAudio(
  text: string,
  dialect: 'egyptian' | 'fusha'
): Promise<string | null> {
  if (!text.trim()) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('/api/sheikh/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        text: text.trim(),
        dialect,
        voice: 'Charon',
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.success && data?.audioBase64 ? data.audioBase64 : null;
  } catch {
    return null;
  }
}

/**
 * Triggers device vibration immediately when an error is detected in recitation.
 */
export function triggerMistakeVibration(): boolean {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      return navigator.vibrate([120, 55, 120]);
    }
  } catch {
    // ignore unsupported environments
  }
  return false;
}

export interface DashboardDayPoint {
  date: string;
  shortLabel: string;
  fullLabel: string;
  masteredCount: number;
  attemptsCount: number;
  avgScore: number;
}

export interface DashboardWeekPoint {
  weekLabel: string;
  masteredCount: number;
  attemptsCount: number;
}

export interface SurahMasteryProgress {
  surahNumber: number;
  surahName: string;
  masteredCount: number;
  totalAyahs: number;
  percent: number;
  avgBestScore: number;
}

export interface SheikhDashboardMetrics {
  last7Days: DashboardDayPoint[];
  last4Weeks: DashboardWeekPoint[];
  surahProgress: SurahMasteryProgress[];
  totalMastered: number;
  activeDaysCount: number;
  overallAvgScore: number;
}

const ARABIC_SHORT_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function computeDashboardMetrics(
  persisted: SheikhPersistentState,
  surahCatalog: Array<{ number: number; name: string; numberOfAyahs: number }>,
  referenceNow: Date = new Date()
): SheikhDashboardMetrics {
  const masteredValues = Object.values(persisted.masteredAyahs || {});
  const historyMap: Record<string, DailyMemorizationStats> = {
    ...(persisted.dailyMemorizedHistory || {}),
  };

  // Backfill dates from masteredAyahs if missing from daily history
  const masteredByDate: Record<string, { count: number; scoreSum: number; scored: number }> = {};
  for (const m of masteredValues) {
    if (!m.masteredDate) continue;
    if (!masteredByDate[m.masteredDate]) {
      masteredByDate[m.masteredDate] = { count: 0, scoreSum: 0, scored: 0 };
    }
    masteredByDate[m.masteredDate].count += 1;
    if (typeof m.bestScore === 'number') {
      masteredByDate[m.masteredDate].scoreSum += m.bestScore;
      masteredByDate[m.masteredDate].scored += 1;
    }
  }

  for (const [dateKey, info] of Object.entries(masteredByDate)) {
    const existing = historyMap[dateKey];
    if (!existing) {
      historyMap[dateKey] = {
        date: dateKey,
        masteredCount: info.count,
        attemptsCount: info.count,
        correctWords: 0,
        avgScore: info.scored > 0 ? Math.round(info.scoreSum / info.scored) : 100,
      };
    } else if (existing.masteredCount < info.count) {
      historyMap[dateKey] = { ...existing, masteredCount: info.count };
    }
  }

  // Last 7 days
  const last7Days: DashboardDayPoint[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(referenceNow);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const rec = historyMap[iso];
    const dayName = ARABIC_SHORT_DAYS[d.getDay()];
    last7Days.push({
      date: iso,
      shortLabel: offset === 0 ? 'اليوم' : dayName,
      fullLabel: `${dayName} (${d.getDate()}/${d.getMonth() + 1})`,
      masteredCount: rec?.masteredCount || 0,
      attemptsCount: rec?.attemptsCount || 0,
      avgScore: rec?.avgScore || 0,
    });
  }

  // Last 4 weeks
  const last4Weeks: DashboardWeekPoint[] = [];
  const weekLabels = ['منذ ٣ أسابيع', 'منذ أسبوعين', 'الأسبوع الماضي', 'هذا الأسبوع'];
  for (let w = 3; w >= 0; w--) {
    let sumMastered = 0;
    let sumAttempts = 0;
    for (let dayInWeek = 0; dayInWeek < 7; dayInWeek++) {
      const daysAgo = w * 7 + dayInWeek;
      const d = new Date(referenceNow);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - daysAgo);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const rec = historyMap[iso];
      if (rec) {
        sumMastered += rec.masteredCount;
        sumAttempts += rec.attemptsCount;
      }
    }
    last4Weeks.push({
      weekLabel: weekLabels[3 - w],
      masteredCount: sumMastered,
      attemptsCount: sumAttempts,
    });
  }

  // Per-Surah Mastery Progress
  const bySurah: Record<number, { count: number; scoreSum: number; scored: number }> = {};
  for (const m of masteredValues) {
    if (!bySurah[m.surahNumber]) {
      bySurah[m.surahNumber] = { count: 0, scoreSum: 0, scored: 0 };
    }
    bySurah[m.surahNumber].count += 1;
    if (typeof m.bestScore === 'number') {
      bySurah[m.surahNumber].scoreSum += m.bestScore;
      bySurah[m.surahNumber].scored += 1;
    }
  }

  const surahNumbersToShow = new Set<number>(Object.keys(bySurah).map(Number));
  surahNumbersToShow.add(persisted.lastSurah || 1);

  const surahProgress: SurahMasteryProgress[] = Array.from(surahNumbersToShow)
    .map((surahNum) => {
      const meta = surahCatalog.find((s) => s.number === surahNum);
      const total = meta?.numberOfAyahs || 7;
      const stats = bySurah[surahNum] || { count: 0, scoreSum: 0, scored: 0 };
      const percent = Math.min(100, Math.round((stats.count / Math.max(1, total)) * 100));
      const avgBestScore = stats.scored > 0 ? Math.round(stats.scoreSum / stats.scored) : 0;
      return {
        surahNumber: surahNum,
        surahName: meta?.name || `سورة ${surahNum}`,
        masteredCount: stats.count,
        totalAyahs: total,
        percent,
        avgBestScore,
      };
    })
    .sort((a, b) => b.percent - a.percent || a.surahNumber - b.surahNumber);

  const activeDaysCount = Object.values(historyMap).filter(
    (h) => h.masteredCount > 0 || h.attemptsCount > 0
  ).length;

  const scores = masteredValues
    .map((m) => m.bestScore)
    .filter((s): s is number => typeof s === 'number' && s > 0);
  const overallAvgScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    last7Days,
    last4Weeks,
    surahProgress,
    totalMastered: masteredValues.length,
    activeDaysCount,
    overallAvgScore,
  };
}

