import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function resolveServerPort(): number {
  const portFlagIdx = process.argv.findIndex((arg) => arg === '--port' || arg === '-p');
  if (portFlagIdx >= 0 && process.argv[portFlagIdx + 1]) {
    const parsed = parseInt(process.argv[portFlagIdx + 1], 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const inlinePortArg = process.argv.find((arg) => arg.startsWith('--port='));
  if (inlinePortArg) {
    const parsed = parseInt(inlinePortArg.slice('--port='.length), 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const isDev = process.env.NODE_ENV !== 'production';
  const envPort = process.env.PORT;
  const nginxPort = process.env.NGINX_PORT;
  if (isDev && envPort && nginxPort && envPort === nginxPort) {
    return parseInt(process.env.DEFAULT_APP_PORT || '3000', 10);
  }
  return parseInt(envPort || process.env.DEFAULT_APP_PORT || '3000', 10);
}

const PORT = resolveServerPort();

// Support both JSON base64 audio payloads and raw binary audio uploads
app.use(express.json({ limit: '25mb' }));
app.use('/api/sheikh/evaluate-raw', express.raw({ type: '*/*', limit: '25mb' }));

// Lazily initialize GoogleGenAI client with required header
let cachedAiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!cachedAiClient) {
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

const SUPPORTED_AUDIO_MIME_REGEX =
  /^audio\/(wav|x-wav|wave|vnd\.wave|webm|mp4|m4a|x-m4a|aac|x-aac|ogg|opus|mpeg|mpeg3|x-mpeg|mp3|3gpp|3gpp2|amr|flac|x-flac)(;.*)?$/i;
const MIN_AUDIO_BYTES = 800;

function detectAudioMimeFromBuffer(buf: Buffer): string | null {
  if (!buf || buf.length < 12) return null;
  const b0 = buf[0], b1 = buf[1], b2 = buf[2], b3 = buf[3];
  const head4 = buf.subarray(0, 4).toString('ascii');
  const head8 = buf.subarray(0, 8).toString('ascii');

  // RIFF....WAVE
  if (head4 === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WAVE') {
    return 'audio/wav';
  }
  // fLaC
  if (head4 === 'fLaC') {
    return 'audio/flac';
  }
  // OggS
  if (head4 === 'OggS') {
    return 'audio/ogg';
  }
  // EBML / WebM / Matroska
  if (b0 === 0x1a && b1 === 0x45 && b2 === 0xdf && b3 === 0xa3) {
    return 'audio/webm';
  }
  // ID3 tag or MPEG sync frame (MP3)
  if (head4.startsWith('ID3') || (b0 === 0xff && (b1 & 0xe0) === 0xe0)) {
    // Distinguish ADTS AAC (0xFFF1 / 0xFFF9 layer==0) vs MP3 (layer != 0)
    if (b0 === 0xff && (b1 & 0xf6) === 0xf0) {
      return 'audio/aac';
    }
    return 'audio/mp3';
  }
  // ADIF AAC
  if (head4 === 'ADIF') {
    return 'audio/aac';
  }
  // ISO BMFF / MP4 / M4A / 3GP (ftyp box at offset 4)
  if (buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('ascii').toLowerCase();
    if (brand.startsWith('3gp')) return 'audio/3gpp';
    return 'audio/mp4';
  }
  // AMR
  if (head8.startsWith('#!AMR')) {
    return 'audio/amr';
  }
  return null;
}

function canonicalizeAudioMime(rawMime: string | undefined, buf: Buffer): { mime: string | null; detectedByBytes: boolean } {
  const sniffed = detectAudioMimeFromBuffer(buf);
  const cleaned = String(rawMime || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  // Check for accidental HTML/text/JSON masquerading as audio
  const preview = buf.subarray(0, 64).toString('utf8').trimStart().toLowerCase();
  if (!sniffed && (preview.startsWith('<!doctype') || preview.startsWith('<html') || preview.startsWith('{'))) {
    return { mime: null, detectedByBytes: false };
  }

  // Prefer actual magic-byte container type whenever identifiable
  if (sniffed) {
    return { mime: sniffed, detectedByBytes: true };
  }

  if (!cleaned || cleaned === 'application/octet-stream' || cleaned === 'binary/octet-stream') {
    return { mime: null, detectedByBytes: false };
  }

  if (!SUPPORTED_AUDIO_MIME_REGEX.test(cleaned)) {
    return { mime: null, detectedByBytes: false };
  }

  if (cleaned === 'audio/x-wav' || cleaned === 'audio/wave' || cleaned === 'audio/vnd.wave') {
    return { mime: 'audio/wav', detectedByBytes: false };
  }
  if (cleaned === 'audio/m4a' || cleaned === 'audio/x-m4a') {
    return { mime: 'audio/mp4', detectedByBytes: false };
  }
  if (cleaned === 'audio/mpeg' || cleaned === 'audio/mpeg3' || cleaned === 'audio/x-mpeg') {
    return { mime: 'audio/mp3', detectedByBytes: false };
  }
  if (cleaned === 'audio/x-flac') {
    return { mime: 'audio/flac', detectedByBytes: false };
  }
  if (cleaned === 'audio/x-aac') {
    return { mime: 'audio/aac', detectedByBytes: false };
  }
  if (cleaned === 'audio/opus') {
    return { mime: 'audio/ogg', detectedByBytes: false };
  }
  return { mime: cleaned, detectedByBytes: false };
}

function bufferHasActualAudioContent(buf: Buffer): boolean {
  if (!buf || buf.length < MIN_AUDIO_BYTES) return false;
  // For PCM WAV, inspect sample payload past the 44-byte header to reject pure digital silence
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.length > 100) {
    let sumAbs = 0;
    const sampleStep = Math.max(2, Math.floor((buf.length - 44) / 2000) * 2);
    let count = 0;
    for (let i = 44; i + 1 < buf.length; i += sampleStep) {
      const sample = buf.readInt16LE(i);
      sumAbs += Math.abs(sample);
      count++;
    }
    if (count > 0 && sumAbs / count < 8) {
      return false; // Completely zero / dead mic PCM stream
    }
  }
  // Generic check that buffer is not uniform repeated byte
  const first = buf[Math.min(64, buf.length - 1)];
  for (let i = Math.min(65, buf.length - 1); i < Math.min(buf.length, 512); i++) {
    if (buf[i] !== first) return true;
  }
  return false;
}

app.get('/api/sheikh/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    configured: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-4-hydrogen',
    timestamp: Date.now(),
  });
});

// ============================================================================
// Zakat Precious Metals Pricing API (24k/21k/18k Gold & Silver per gram)
// ============================================================================
const BASELINE_USD_GOLD_GRAM = 86.5;
const BASELINE_USD_SILVER_GRAM = 1.05;
const CURRENCY_USD_RATES: Record<string, { rate: number; symbol: string; nameAr: string; defaultFitr: number }> = {
  EGP: { rate: 49.5, symbol: 'ج.م', nameAr: 'الجنيه المصري', defaultFitr: 35 },
  SAR: { rate: 3.75, symbol: 'ر.س', nameAr: 'الريال السعودي', defaultFitr: 25 },
  AED: { rate: 3.6725, symbol: 'د.إ', nameAr: 'الدرهم الإماراتي', defaultFitr: 25 },
  KWD: { rate: 0.307, symbol: 'د.ك', nameAr: 'الدينار الكويتي', defaultFitr: 1.5 },
  QAR: { rate: 3.64, symbol: 'ر.ق', nameAr: 'الريال القطري', defaultFitr: 15 },
  JOD: { rate: 0.709, symbol: 'د.أ', nameAr: 'الدينار الأردني', defaultFitr: 2.5 },
  MAD: { rate: 9.95, symbol: 'د.م', nameAr: 'الدرهم المغربي', defaultFitr: 20 },
  TRY: { rate: 35.2, symbol: 'ل.ت', nameAr: 'الليرة التركية', defaultFitr: 180 },
  USD: { rate: 1, symbol: '$', nameAr: 'الدولار الأمريكي', defaultFitr: 15 },
  EUR: { rate: 0.93, symbol: '€', nameAr: 'اليورو الأوروبي', defaultFitr: 14 },
};

async function withGeminiRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status || err?.code;
      const retryable = status === 429 || status === 503 || status === 502 || /timeout|ECONNRESET/i.test(String(err?.message || ''));
      if (!retryable || attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastErr;
}

app.get('/api/zakat/metals', async (req: Request, res: Response): Promise<void> => {
  const code = String(req.query.currency || 'EGP').trim().toUpperCase();
  const currInfo = CURRENCY_USD_RATES[code] || CURRENCY_USD_RATES.EGP;
  const resolvedCode = CURRENCY_USD_RATES[code] ? code : 'EGP';
  const cacheKey = `zakat_metals:${resolvedCode}`;
  const cached = getGeoCached<Record<string, unknown>>(cacheKey);
  if (cached) {
    res.json({ success: true, cached: true, ...cached });
    return;
  }

  let usdGoldGram = BASELINE_USD_GOLD_GRAM;
  let usdSilverGram = BASELINE_USD_SILVER_GRAM;
  let fxRate = currInfo.rate;
  let source: 'live' | 'reference' = 'reference';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
    clearTimeout(timer);
    if (fxRes.ok) {
      const fxJson = (await fxRes.json()) as { rates?: Record<string, number> };
      if (fxJson?.rates && typeof fxJson.rates[resolvedCode] === 'number' && fxJson.rates[resolvedCode] > 0) {
        fxRate = fxJson.rates[resolvedCode];
        source = 'live';
      }
    }
  } catch {
    // Use baseline rate silently when offline
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const goldRes = await fetch('https://api.gold-api.com/price/XAU', { signal: controller.signal });
    clearTimeout(timer);
    if (goldRes.ok) {
      const gJson = (await goldRes.json()) as { price?: number };
      if (typeof gJson?.price === 'number' && gJson.price > 500) {
        usdGoldGram = gJson.price / 31.1034768;
        source = 'live';
      }
    }
  } catch {
    // Use baseline USD/gram silently
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const silverRes = await fetch('https://api.gold-api.com/price/XAG', { signal: controller.signal });
    clearTimeout(timer);
    if (silverRes.ok) {
      const sJson = (await silverRes.json()) as { price?: number };
      if (typeof sJson?.price === 'number' && sJson.price > 5) {
        usdSilverGram = sJson.price / 31.1034768;
      }
    }
  } catch {
    // Use baseline USD/gram silently
  }

  const gold24PerGram = Number((usdGoldGram * fxRate).toFixed(resolvedCode === 'KWD' || resolvedCode === 'JOD' ? 2 : 0));
  const gold21PerGram = Number((gold24PerGram * (21 / 24)).toFixed(resolvedCode === 'KWD' || resolvedCode === 'JOD' ? 2 : 0));
  const gold18PerGram = Number((gold24PerGram * (18 / 24)).toFixed(resolvedCode === 'KWD' || resolvedCode === 'JOD' ? 2 : 0));
  const silverPerGram = Number((usdSilverGram * fxRate).toFixed(resolvedCode === 'KWD' || resolvedCode === 'JOD' || resolvedCode === 'USD' || resolvedCode === 'EUR' ? 2 : 0));

  const payload = {
    currency: resolvedCode,
    symbol: currInfo.symbol,
    nameAr: currInfo.nameAr,
    gold24PerGram,
    gold21PerGram,
    gold18PerGram,
    silverPerGram,
    suggestedFitrPerPerson: currInfo.defaultFitr,
    nisabGoldThreshold: Number((gold24PerGram * 85).toFixed(2)),
    nisabSilverThreshold: Number((silverPerGram * 595).toFixed(2)),
    source,
    updatedAt: new Date().toISOString(),
  };

  setGeoCached(cacheKey, payload);
  res.json({ success: true, cached: false, ...payload });
});

// ============================================================================
// Global Locations API (OpenStreetMap Nominatim Search & Reverse Geocoding)
// ============================================================================
const geoCache = new Map<string, { expiresAt: number; data: unknown }>();
const GEO_CACHE_TTL_MS = 15 * 60 * 1000;

function getGeoCached<T>(key: string): T | null {
  const entry = geoCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    geoCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setGeoCached(key: string, data: unknown): void {
  if (geoCache.size > 500) {
    const firstKey = geoCache.keys().next().value;
    if (firstKey) geoCache.delete(firstKey);
  }
  geoCache.set(key, { expiresAt: Date.now() + GEO_CACHE_TTL_MS, data });
}

function extractAddressParts(addr: Record<string, string | undefined> = {}) {
  const country = addr.country || '';
  const countryCode = (addr.country_code || '').toUpperCase();
  const state =
    addr.state ||
    addr.governorate ||
    addr.province ||
    addr.region ||
    addr.state_district ||
    '';
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    state ||
    '';
  const district =
    addr.city_district ||
    addr.district ||
    addr.suburb ||
    addr.borough ||
    addr.quarter ||
    '';
  const neighborhood =
    addr.neighbourhood ||
    addr.residential ||
    addr.hamlet ||
    addr.isolated_dwelling ||
    '';
  const street = addr.road || addr.pedestrian || addr.street || '';
  return { country, countryCode, state, city, district, neighborhood, street };
}

app.get('/api/locations/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = String(req.query.q || '').trim();
    const countryCode = String(req.query.countryCode || '').trim().toLowerCase();
    const limit = Math.min(25, Math.max(1, Number(req.query.limit) || 15));

    if (q.length < 2) {
      res.json({ success: true, results: [] });
      return;
    }

    const cacheKey = `search:${q.toLowerCase()}:${countryCode}:${limit}`;
    const cached = getGeoCached<unknown[]>(cacheKey);
    if (cached) {
      res.json({ success: true, cached: true, results: cached });
      return;
    }

    const params = new URLSearchParams({
      q,
      format: 'jsonv2',
      addressdetails: '1',
      limit: String(limit),
      'accept-language': 'ar,en',
    });
    if (/^[a-z]{2}$/.test(countryCode)) {
      params.set('countrycodes', countryCode);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const upstream = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'AlMoazenIslamicApp/2.0 (prayer-times-location-lookup)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!upstream.ok) {
      res.status(502).json({ success: false, results: [], error: `Upstream status ${upstream.status}` });
      return;
    }

    const raw = (await upstream.json()) as Array<{
      place_id: number;
      lat: string;
      lon: string;
      name?: string;
      display_name?: string;
      type?: string;
      addresstype?: string;
      address?: Record<string, string | undefined>;
    }>;

    const results = raw
      .map((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const parts = extractAddressParts(item.address);
        const primaryName =
          item.name ||
          parts.neighborhood ||
          parts.district ||
          parts.city ||
          parts.state ||
          parts.country ||
          q;
        return {
          id: `osm_${item.place_id}`,
          name: primaryName,
          nameEn: item.name || parts.city || primaryName,
          country: parts.country || 'العالم',
          countryEn: parts.country || 'World',
          countryCode: parts.countryCode || 'GL',
          state: parts.state || undefined,
          district: parts.district || undefined,
          neighborhood: parts.neighborhood || undefined,
          street: parts.street || undefined,
          displayName: item.display_name || primaryName,
          placeType: item.addresstype || item.type || 'place',
          latitude: lat,
          longitude: lng,
          source: 'osm',
        };
      })
      .filter(Boolean);

    setGeoCached(cacheKey, results);
    res.json({ success: true, cached: false, results });
  } catch (error: any) {
    res.status(502).json({
      success: false,
      results: [],
      error: error?.message || 'Online search unavailable',
    });
  }
});

app.get('/api/locations/reverse', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ success: false, error: 'Invalid coordinates' });
      return;
    }

    const cacheKey = `rev:${lat.toFixed(4)}:${lng.toFixed(4)}`;
    const cached = getGeoCached<Record<string, unknown>>(cacheKey);
    if (cached) {
      res.json({ success: true, cached: true, ...cached });
      return;
    }

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      addressdetails: '1',
      zoom: '18',
      'accept-language': 'ar,en',
    });

    let payload: Record<string, unknown> | null = null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: {
          'User-Agent': 'AlMoazenIslamicApp/2.0 (prayer-times-location-lookup)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (osmRes.ok) {
        const data = (await osmRes.json()) as {
          display_name?: string;
          address?: Record<string, string | undefined>;
        };
        if (data?.address) {
          const parts = extractAddressParts(data.address);
          payload = {
            ...parts,
            displayName: data.display_name || '',
            provider: 'nominatim',
          };
        }
      }
    } catch {
      // Fallback below
    }

    if (!payload) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const bdcRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`,
          { signal: controller.signal }
        );
        clearTimeout(timer);
        if (bdcRes.ok) {
          const bdc = (await bdcRes.json()) as {
            countryName?: string;
            countryCode?: string;
            principalSubdivision?: string;
            city?: string;
            locality?: string;
          };
          payload = {
            country: bdc.countryName || '',
            countryCode: (bdc.countryCode || '').toUpperCase(),
            state: bdc.principalSubdivision || '',
            city: bdc.city || bdc.locality || '',
            district: bdc.locality && bdc.locality !== bdc.city ? bdc.locality : '',
            neighborhood: '',
            street: '',
            displayName: [bdc.locality, bdc.city, bdc.principalSubdivision, bdc.countryName]
              .filter(Boolean)
              .join('، '),
            provider: 'bigdatacloud',
          };
        }
      } catch {
        // Offline / unreachable
      }
    }

    if (!payload) {
      res.status(502).json({ success: false, error: 'Reverse geocoding unavailable' });
      return;
    }

    setGeoCached(cacheKey, payload);
    res.json({ success: true, cached: false, ...payload });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Reverse geocode error' });
  }
});

interface SheikhEvalInput {
  audioBuffer: Buffer;
  base64Audio: string;
  rawMimeType?: string;
  expectedText: string;
  surahName?: string;
  surahNumber?: number | string;
  ayahNumber?: number | string;
  pageNumber?: number | string;
  unitType?: string;
  dialect?: string;
  mode?: string;
  trainingMode?: boolean;
  adjacentAyahsText?: string;
  durationMs?: number;
  analysisSpeed?: string;
}

async function runSheikhEvaluation(input: SheikhEvalInput, res: Response): Promise<void> {
  const {
    audioBuffer,
    base64Audio,
    rawMimeType = 'audio/wav',
    expectedText,
    surahName = '',
    surahNumber = '',
    ayahNumber = '',
    pageNumber,
    unitType = 'ayah',
    dialect = 'fusha',
    mode = 'recitation',
    trainingMode = false,
    adjacentAyahsText = '',
    durationMs = 0,
    analysisSpeed = 'balanced',
  } = input;

  if (!expectedText || typeof expectedText !== 'string' || !expectedText.trim()) {
    res.status(400).json({
      success: false,
      error: 'النص القرآني المعتمد مطلوب للمقارنة',
    });
    return;
  }

  if (!audioBuffer || audioBuffer.length < MIN_AUDIO_BYTES) {
    res.status(400).json({
      success: false,
      error: 'الملف الصوتي فارغ أو قصير جداً ولا يحتوي على تلاوة كافية للتحليل.',
    });
    return;
  }

  const { mime: resolvedMime, detectedByBytes } = canonicalizeAudioMime(rawMimeType, audioBuffer);
  if (!resolvedMime) {
    res.status(400).json({
      success: false,
      error: `تعذر التعرف على صيغة الملف الصوتي (${String(rawMimeType || 'غير معروف')}). يرجى رفع ملف WAV أو MP3 أو M4A أو WebM أو OGG.`,
    });
    return;
  }

  if (!bufferHasActualAudioContent(audioBuffer)) {
    res.status(400).json({
      success: false,
      error: 'لم يتم اكتشاف موجة صوتية حقيقية داخل التسجيل (صوت صامت أو فارغ). يرجى التلاوة بوضوح والمحاولة مرة أخرى.',
    });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({
      success: false,
      error: 'خدمة تحليل التلاوة غير مهيأة حالياً (مفتاح الذكاء الاصطناعي غير متوفر على الخادم).',
    });
    return;
  }

  const isFullPage = unitType === 'page' || Boolean(pageNumber);
  const targetLabel = isFullPage
    ? `صفحة مصحف كاملة رقم ${pageNumber || ayahNumber} (سورة ${surahName})`
    : `سورة ${surahName} رقم ${surahNumber}، الآية ${ayahNumber}`;

  const systemInstruction = `أنت «الشيخ المحفظ» - معلم قرآن متقن، حليم ومشجع، متخصص في التحفيظ وتصحيح التلاوة والتجويد وفق رواية حفص عن عاصم مع مراعاة تنوع القراءات المتواترة الصحيحة.
القواعد الصارمة:
1. استمع بدقة إلى التسجيل الصوتي المرفق وقارن ما نطق به القارئ كلمةً بكلمة بالنص القرآني المعتمد (${targetLabel}): "${expectedText}".
2. لا تفترض نجاح القراءة أبداً إذا كان التسجيل صمتاً أو همهمة أو كلاماً لا يمت للآية بصلة؛ في هذه الحالة اجعل status = "not_recited" وscore = 0.
3. اكشف بدقة الكلمات الصحيحة، الكلمات الناقصة (missing)، الكلمات المبدّلة أو المحرّفة (error)، الكلمات المكررة أو الزائدة، وتجاوز موضع الآية أو القفز إلى آية أخرى.
4. إذا كان الصوت غير واضح تماماً في كلمة معينة بسبب ضوضاء أو انخفاض الصوت دون جزم بالخطأ، ميّزها بالحالة "uncertain" بدلاً من إثبات خطأ قطعي، واذكر ذلك بلطف.
5. راعِ اختلاف سرعات التلاوة الطبيعية (التحقيق، التدوير، الحدر) والوقف على رؤوس الكلمات للتنفس؛ ولا تعد التوقف للتنفس خطأً ما لم يُفسِد المعنى أو يبتر الكلمة.
6. إذا نطق القارئ بوجه قراءة متواترة صحيح مقبول، اعتبره مقبولاً واضبط acceptedQiraatVariant = true.
7. وجّه القارئ بأسلوب شيخ معلم ${dialect === 'egyptian' ? 'باللهجة المصرية الطيبة الوقورة والمشجعة' : 'باللغة العربية الفصحى الواضحة المشجعة'}.
8. لا تحرّف القرآن ولا تخترع كلمات قرآنية؛ في حقل expectedWord التزم بالكلمة القرآنية الأصلية تماماً.`;

  const contextHint = adjacentAyahsText
    ? `\nنصوص مجاورة للمساعدة في كشف الانتقال أو الخلط بين الآيات:\n${adjacentAyahsText}`
    : '';

  const speedDirective =
    analysisSpeed === 'fast'
      ? '\nوضع السرعة الفورية (Fast): اجعل الحقول النصية موجزة ومباشرة جداً للرد الفوري دون إطالة في الشرح.'
      : analysisSpeed === 'accurate'
      ? '\nوضع الدقة المعمّقة (Accurate): افحص مخارج الحروف وأحكام التجويد والمدود والغنة بدقة تفصيلية في الملاحظات وtajweedTips.'
      : '\nوضع التوازن: وازن بين سرعة الاستجابة ودقة كشف الأخطاء وتقديم توجيه واضح.';

  const userPrompt = `حلّل التسجيل الصوتي المرفق (صيغة الصوت: ${resolvedMime}${detectedByBytes ? ' - مكتشفة من البايتات' : ''}، الحجم: ${audioBuffer.length} بايت، المدة التقريبية ${Math.round(Number(durationMs) || 0)} مللي ثانية) مقابل ${targetLabel} في وضع (${mode}${trainingMode ? ' - وضع تدريب بدون مقاطعة' : ''}):
النص القرآني المعتمد: "${expectedText}"${contextHint}${speedDirective}
أرجع JSON دقيقاً يغطي كل كلمة في النص المعتمد حسب الترتيب:
- transcribedText: ما سمعته فعلياً من فم القارئ كما نُطق.
- status: "perfect" | "minor_issue" | "error" | "not_recited".
- score: من 0 إلى 100.
- paceStyle: "tahqiq" | "tadwir" | "hadr" | "paused".
- acceptedQiraatVariant: هل ظهرت قراءة متواترة صحيحة مقبولة.
- jumpedToOtherAyah: هل قفز القارئ إلى آية أخرى أو خلط بين الآيات.
- jumpedAyahNote: وصف مختصر إن حدث خلط بين الآيات.
- extraOrRepeatedWords: قائمة أي كلمات زائدة أو مكررة نطقها القارئ.
- unclearAudioWarning: تنبيه إذا كان الصوت خافتاً أو به ضوضاء تقلل اليقين.
- wordResults: مصفوفة مرتبة لكل كلمة من النص المعتمد تحتوي على { expectedWord, spokenWord, status ("correct" | "error" | "missing" | "uncertain"), positionIndex, correctionNote }.
- mistakeSummary: ملخص واضح ومباشر لما تم ضبطه أو ما يحتاج تصحيحاً.
- correctionHint: توجيه عملي دقيق لإصلاح موضع الخطأ.
- sheikhScript: عبارة توجيهية موجزة ينطقها الشيخ المعلم بلهجة (${dialect === 'egyptian' ? 'مصرية محببة' : 'فصحى وقورة'}).
- tajweedTips: قائمة نصائح تجويدية عملية مناسبة للموضع.`;

  const response = await withGeminiRetry(() =>
    getAiClient().models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: resolvedMime,
                data: base64Audio,
              },
            },
            { text: userPrompt },
          ],
        },
      ],
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: analysisSpeed === 'accurate' ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcribedText: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['perfect', 'minor_issue', 'error', 'not_recited'] },
            score: { type: Type.INTEGER },
            paceStyle: { type: Type.STRING, enum: ['tahqiq', 'tadwir', 'hadr', 'paused'] },
            acceptedQiraatVariant: { type: Type.BOOLEAN },
            jumpedToOtherAyah: { type: Type.BOOLEAN },
            jumpedAyahNote: { type: Type.STRING },
            extraOrRepeatedWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            unclearAudioWarning: { type: Type.STRING },
            wordResults: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  expectedWord: { type: Type.STRING },
                  spokenWord: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ['correct', 'error', 'missing', 'uncertain'] },
                  positionIndex: { type: Type.INTEGER },
                  correctionNote: { type: Type.STRING },
                },
                required: ['expectedWord', 'status', 'positionIndex'],
              },
            },
            mistakeSummary: { type: Type.STRING },
            correctionHint: { type: Type.STRING },
            sheikhScript: { type: Type.STRING },
            tajweedTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['transcribedText', 'status', 'score', 'wordResults', 'sheikhScript', 'mistakeSummary'],
        },
      },
    })
  );

  let rawText = (response.text || '').trim();
  if (!rawText) {
    res.status(502).json({
      success: false,
      error: 'لم يُرجِع محرك تحليل التلاوة نتيجة، يرجى إعادة المحاولة.',
    });
    return;
  }

  rawText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let resultJson: any;
  try {
    resultJson = JSON.parse(rawText);
  } catch {
    const startIdx = rawText.indexOf('{');
    const endIdx = rawText.lastIndexOf('}');
    if (startIdx >= 0 && endIdx > startIdx) {
      resultJson = JSON.parse(rawText.slice(startIdx, endIdx + 1));
    } else {
      throw new Error('استجابة غير قابلة للقراءة من محرك تحليل التلاوة');
    }
  }

  res.json({
    success: true,
    audioBytesReceived: audioBuffer.length,
    mimeType: resolvedMime,
    detectedByBytes,
    evaluation: resultJson,
  });
}

/**
 * Sheikh API (JSON base64): Evaluate Quranic recitation or uploaded audio file via Gemini
 */
app.post('/api/sheikh/evaluate', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/wav',
      expectedText,
      surahName,
      surahNumber,
      ayahNumber,
      pageNumber,
      unitType,
      dialect = 'fusha',
      mode = 'recitation',
      trainingMode = false,
      adjacentAyahsText = '',
      durationMs = 0,
      analysisSpeed = 'balanced',
    } = req.body || {};

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({
        success: false,
        error: 'لم يتم استلام ملف صوتي للتلاوة. يرجى التسجيل عبر الميكروفون أو رفع ملف صوتي ثم المحاولة مجدداً.',
      });
      return;
    }

    const dataUriMimeMatch = audioBase64.match(/^data:([^;]+);base64,/);
    const effectiveMime = dataUriMimeMatch?.[1] || mimeType;
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '').trim();
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    await runSheikhEvaluation(
      {
        audioBuffer,
        base64Audio: cleanBase64,
        rawMimeType: effectiveMime,
        expectedText,
        surahName,
        surahNumber,
        ayahNumber,
        pageNumber,
        unitType,
        dialect,
        mode,
        trainingMode,
        adjacentAyahsText,
        durationMs,
        analysisSpeed,
      },
      res
    );
  } catch (error: any) {
    console.error('Sheikh evaluate error:', error);
    const statusCode = typeof error?.status === 'number' && error.status >= 400 ? error.status : 500;
    res.status(statusCode).json({
      success: false,
      error: 'تعذر تحليل التلاوة صوتياً عبر الخادم، تحقق من صيغة الصوت والاتصال وأعد المحاولة.',
      details: error?.message || String(error),
    });
  }
});

/**
 * Sheikh API (Binary raw audio fallback): Supports uploading large audio files directly
 */
app.post('/api/sheikh/evaluate-raw', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    const metaHeader = req.headers['x-sheikh-meta'];
    let meta: Record<string, any> = {};
    if (typeof metaHeader === 'string' && metaHeader.trim()) {
      try {
        meta = JSON.parse(Buffer.from(metaHeader, 'base64').toString('utf8'));
      } catch {
        // ignore bad header
      }
    }
    const contentTypeHeader = String(req.headers['content-type'] || req.query.mimeType || 'audio/wav');
    await runSheikhEvaluation(
      {
        audioBuffer: rawBuf,
        base64Audio: rawBuf.toString('base64'),
        rawMimeType: contentTypeHeader,
        expectedText: String(meta.expectedText || req.query.expectedText || ''),
        surahName: String(meta.surahName || req.query.surahName || ''),
        surahNumber: meta.surahNumber || String(req.query.surahNumber || ''),
        ayahNumber: meta.ayahNumber || String(req.query.ayahNumber || ''),
        pageNumber: meta.pageNumber || (req.query.pageNumber ? String(req.query.pageNumber) : undefined),
        unitType: String(meta.unitType || req.query.unitType || 'ayah'),
        dialect: String(meta.dialect || req.query.dialect || 'fusha'),
        mode: String(meta.mode || req.query.mode || 'recitation'),
        trainingMode: Boolean(meta.trainingMode),
        adjacentAyahsText: String(meta.adjacentAyahsText || ''),
        durationMs: Number(meta.durationMs || req.query.durationMs || 0),
        analysisSpeed: String(meta.analysisSpeed || req.query.analysisSpeed || 'balanced'),
      },
      res
    );
  } catch (error: any) {
    console.error('Sheikh evaluate-raw error:', error);
    const statusCode = typeof error?.status === 'number' && error.status >= 400 ? error.status : 500;
    res.status(statusCode).json({
      success: false,
      error: 'تعذر رفع وتحليل الملف الصوتي الخام، يرجى المحاولة مرة أخرى.',
      details: error?.message || String(error),
    });
  }
});

/**
 * Sheikh Voice API: Generate realistic natural male voice explanations
 * using gemini-3.8-flash-lite-tts
 */
app.post('/api/sheikh/speak', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      text,
      dialect = 'fusha', // 'egyptian' | 'fusha'
      voice = 'Charon', // 'Charon' | 'Fenrir' | 'Puck' (natural male voices)
    } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: 'Gemini API Key not configured' });
      return;
    }

    const stylePrompt =
      dialect === 'egyptian'
        ? 'شيخ معلم قرآن وقور ودافئ يتحدث بلهجة مصرية طيبة ومشجعة'
        : 'شيخ ومعلم قرآن وقور يتحدث بلغة عربية فصحى واضحة هادئة ودافئة';

    const ttsResponse = await withGeminiRetry(() =>
      getAiClient().models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: String(text).trim(),
                speechMetadata: {
                  style: stylePrompt,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      })
    );

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({ error: 'No audio returned from Gemini TTS' });
      return;
    }

    res.json({
      success: true,
      audioBase64: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (error: any) {
    console.error('Sheikh speak error:', error);
    res.status(500).json({
      error: 'تعذر توليد صوت الشيخ',
      details: error?.message || String(error),
    });
  }
});

/**
 * Sheikh Quiz API: Generates smart Quranic memorization challenges
 * (complete the verse, identify previous/next ayah, random testing)
 */
app.post('/api/sheikh/quiz-challenge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { surahNumber, surahName, mode = 'hide_and_complete', currentAyahText, ayahNumber } = req.body;

    if (!currentAyahText) {
      res.status(400).json({ error: 'Ayah text is required' });
      return;
    }

    // Split words to create an interactive gap or hide the end of the ayah
    const words = currentAyahText.trim().split(/\s+/);
    let promptVerse = '';
    let hiddenPart = '';

    if (words.length <= 4) {
      promptVerse = words.slice(0, 2).join(' ') + ' ...';
      hiddenPart = words.slice(2).join(' ');
    } else {
      const cutPoint = Math.max(2, Math.floor(words.length * 0.45));
      promptVerse = words.slice(0, cutPoint).join(' ') + ' ... [أكمل الآية]';
      hiddenPart = words.slice(cutPoint).join(' ');
    }

    res.json({
      success: true,
      challenge: {
        surahNumber,
        surahName,
        ayahNumber,
        fullAyah: currentAyahText,
        promptVerse,
        hiddenPart,
        mode,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create quiz challenge' });
  }
});

/**
 * Mount Vite in dev mode or serve static files in production
 */
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: !hmrDisabled,
        ...(hmrDisabled ? { ws: false as const } : {}),
        watch: hmrDisabled ? null : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Islamic Muezzin & Smart Sheikh] Server listening on http://0.0.0.0:${PORT}`);
  });
  httpServer.on('error', (err) => {
    console.error('HTTP server failed to listen:', err);
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
