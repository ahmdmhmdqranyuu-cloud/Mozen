function sheikhApiPlugin() {
  return {
    name: 'sheikh-api-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/sheikh/evaluate', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const { expectedText = '', recitedText = '', dialect = 'egyptian' } = data;
            
            const norm = (s: string) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[أإآء]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
            const expNorm = norm(expectedText).split(/\s+/);
            const recNorm = norm(recitedText).split(/\s+/);
            
            let matched = 0;
            expNorm.forEach((w) => {
              if (recNorm.some((rw) => rw === w || rw.includes(w) || w.includes(rw))) matched++;
            });
            const score = expNorm.length > 0 ? Math.round((matched / expNorm.length) * 100) : 0;
            const isGood = score >= 70;
            
            let feedback = isGood
              ? (dialect === 'egyptian' ? 'ما شاء الله تبارك الله، قراءتك متقنة يا بني! ربنا يفتح عليك.' : 'أحسنت القراءة يا بني، بارك الله فيك ونفع بك القرآن الكريم.')
              : (dialect === 'egyptian' ? 'محاولة طيبة يا بني! اسمع الآية تاني من الشيخ وركز في الكلمات المحددة وكررها معايا.' : 'جهد مبارك يا بني؛ استمع إلى القارئ مرة أخرى وانتبه إلى مواضع الحروف لتثبيتها جيداً.');

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ score, isGood, feedback }));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal error' }));
          }
        });
      });
    }
  };
}

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sheikhApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
