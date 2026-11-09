import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Parse JSON bodies with up to 25MB for audio recording base64 payload
app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI client with required header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Sheikh API: Evaluate Quranic recitation via Gemini
 * Listens to student audio and compares with expected Uthmani Quranic text.
 * Strictly adheres to not inventing or altering Quranic text.
 */
app.post('/api/sheikh/evaluate', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      expectedText,
      surahName,
      surahNumber,
      ayahNumber,
      dialect = 'fusha', // 'egyptian' | 'fusha'
    } = req.body;

    if (!expectedText) {
      res.status(400).json({ error: 'Expected Quranic text is required' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        error: 'مفتاح الذكاء الاصطناعي غير متوفر حالياً',
        message: 'يرجى التأكد من تهيئة خدمة الذكاء الاصطناعي في إعدادات التطبيق',
      });
      return;
    }

    const systemInstruction = `أنت «الشيخ المحفظ» - معلم قرآن جليل، حليم، مشجع وصبور، متخصص في تعليم وتحفيظ القرآن الكريم وأحكام التجويد.
مهمتك:
1. الاستماع بعناية إلى التسجيل الصوتي للمستخدم ومقارنة تلاوته بالنص القرآني المعتمد للآية: "${expectedText}" من سورة ${surahName || ''} آية ${ayahNumber || ''}.
2. كشف أي خطأ في الكلمات أو الحروف أو النقص أو الزيادة أو الإبدال، مع بيان موضع الخطأ بالتحديد.
3. التمييز الدقيق بين الأخطاء الجلية في الحفظ (كنقصان كلمة، تغيير حرف، أو تبديل لفظ) وبين أوجه الأداء القرآني الصحيح وتفاوت السرعة (التحقيق، التدوير، الحدر) فلا تعتبرها خطأ.
4. عدم التشدد في المسائل التجويدية الدقيقة التي لا يستطيع التسجيل الصوتي إثباتها بدقة.
5. تقديم تعليق وتوجيه صوتي بأسلوب شيخ معلم ${dialect === 'egyptian' ? 'باللهجة المصرية الطيبة الودودة المشجعة (مثل: أحسنت يا بني، بارك الله فيك، لكن انتبه لكلمة...)' : 'باللغة العربية الفصحى الوقورة والمشجعة'}.
6. الحفاظ التام والقدسي على ألفاظ القرآن الكريم دون أي تحريف أو توليد كلام ليس من الآية.`;

    const userPrompt = `قارن هذه التلاوة الصوتية مع الآية الكريمة:
النص المعتمد: "${expectedText}"
سورة: ${surahName} (رقم ${surahNumber})، الآية: ${ayahNumber}
اللهجة المطلوبة في التوجيه: ${dialect === 'egyptian' ? 'لهجة مصرية محببة' : 'لغة عربية فصحى'}

قم بتحليل التسجيل واملأ الحقول بدقة:
- transcribedText: ما نطق به القارئ نصاً.
- status: إحدى القيم ("perfect" للتلاوة التامة، "minor_issue" لهفوة بسيطة أو تشكيل، "error" لخطأ جلي في كلمة أو حرف، "not_recited" إذا كان صمتاً أو كلاماً خارج الآية).
- score: درجة من 100.
- recognizedWords: مصفوفة بكل كلمة من الآية مع تحديد isCorrect وما إذا كان بها خطأ.
- mistakeSummary: ملخص واضح ولطيف للأخطاء إن وجدت، أو ثناء إن كانت سليمة.
- correctionHint: النصيحة لإعادة النطق الصحيح.
- sheikhScript: جملة قصيرة لطيفة ينطقها الشيخ صوتياً للمستخدم بالأسلوب المحدد (${dialect === 'egyptian' ? 'مصري' : 'فصحى'}).
- tajweedTips: ملاحظة تجويدية تشجيعية (مخارج، غنة، مدود).`;

    const parts: any[] = [];
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType,
          data: audioBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }
    parts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcribedText: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['perfect', 'minor_issue', 'error', 'not_recited'] },
            score: { type: Type.INTEGER },
            recognizedWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  isCorrect: { type: Type.BOOLEAN },
                  note: { type: Type.STRING },
                },
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
          required: ['transcribedText', 'status', 'score', 'sheikhScript', 'mistakeSummary'],
        },
      },
    });

    const resultJson = JSON.parse(response.text || '{}');
    res.json({ success: true, evaluation: resultJson });
  } catch (error: any) {
    console.error('Sheikh evaluate error:', error);
    res.status(500).json({
      error: 'فشل في تحليل القراءة الصوتية',
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

    const ttsResponse = await ai.models.generateContent({
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
    });

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
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Islamic Muezzin & Smart Sheikh] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
});
