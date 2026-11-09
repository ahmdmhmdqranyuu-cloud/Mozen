/**
 * Unified Content & Image Card Sharing Utility for Al-Muadhin App
 * Supports sharing Hadiths, Duas, Azkar, Ruqyah, Stories, and Wallpapers
 * as formatted text or high-resolution 1080x1350 Islamic Share Cards
 * with 5 built-in 100% offline Islamic backgrounds.
 */

import { saveImageBlobToGallery } from './gallerySaver';

export interface SharePayload {
  title: string;
  category?: string;
  categoryBadge?: string;
  arabicText?: string;
  body?: string;
  mainText?: string;
  source?: string;
  footer?: string;
  referenceText?: string;
  extraNote?: string;
  extraFooter?: string;
  accentColor?: string;
}

export interface OfflineShareBackgroundTheme {
  id: 'emerald_gold' | 'kaaba_night' | 'madinah_cream' | 'aqsa_sapphire' | 'sunset_mosque';
  name: string;
  subtitle: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accentColor: string;
  textColor: string;
  subTextColor: string;
  badgeBg: string;
  motif: 'crescent' | 'kaaba' | 'dome' | 'star' | 'lantern';
  isLight?: boolean;
}

/**
 * 5 Built-in 100% Offline Islamic Backgrounds for sharing Hadiths, Duas, and Azkar without internet
 */
export const OFFLINE_SHARE_BACKGROUNDS: OfflineShareBackgroundTheme[] = [
  {
    id: 'emerald_gold',
    name: 'الزمرد النبوي المذهب',
    subtitle: 'خلفية القبة الخضراء والزخارف الذهبية',
    bgStart: '#06261E',
    bgMid: '#0F4438',
    bgEnd: '#041914',
    accentColor: '#F5C542',
    textColor: '#FFFBEB',
    subTextColor: '#FDE68A',
    badgeBg: 'rgba(245, 197, 66, 0.16)',
    motif: 'dome',
  },
  {
    id: 'kaaba_night',
    name: 'كسوة الكعبة المشرفة',
    subtitle: 'أسود ملكي فاخر بطراز الحزام الذهبي',
    bgStart: '#0B0C0E',
    bgMid: '#17191C',
    bgEnd: '#070809',
    accentColor: '#D4AF37',
    textColor: '#FFFFFF',
    subTextColor: '#FCD34D',
    badgeBg: 'rgba(212, 175, 55, 0.18)',
    motif: 'kaaba',
  },
  {
    id: 'madinah_cream',
    name: 'الرقاع الكريمي الفاخر',
    subtitle: 'خلفية ورق المصحف الكريمي الدافئ',
    bgStart: '#FAF6EE',
    bgMid: '#F3EBD9',
    bgEnd: '#EAE0C8',
    accentColor: '#104B40',
    textColor: '#172A28',
    subTextColor: '#8A6214',
    badgeBg: 'rgba(16, 75, 64, 0.10)',
    motif: 'star',
    isLight: true,
  },
  {
    id: 'aqsa_sapphire',
    name: 'ليالي القدس والياقوت',
    subtitle: 'أزرق ليلي ملكي مع هلال ونجوم ذهبية',
    bgStart: '#0B1528',
    bgMid: '#16294C',
    bgEnd: '#070E1B',
    accentColor: '#FBBF24',
    textColor: '#F8FAFC',
    subTextColor: '#FDE68A',
    badgeBg: 'rgba(251, 191, 36, 0.16)',
    motif: 'crescent',
  },
  {
    id: 'sunset_mosque',
    name: 'شفق المساجد والمشكاة',
    subtitle: 'عنابي دافئ بطراز المشكاة والفوانيس الإسلامية',
    bgStart: '#2A1015',
    bgMid: '#4A1C24',
    bgEnd: '#19080B',
    accentColor: '#F59E0B',
    textColor: '#FFFBEB',
    subTextColor: '#FDE68A',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
    motif: 'lantern',
  },
];

/**
 * Formats an Islamic text item for clean sharing across WhatsApp, Telegram, Social Media, etc.
 */
export function formatIslamicShareText(payload: SharePayload): string {
  const lines: string[] = [];
  const cat = payload.category || payload.categoryBadge;
  const content = payload.arabicText || payload.body || payload.mainText || '';
  const note = payload.extraNote || payload.extraFooter;
  const src = payload.source || payload.footer || payload.referenceText;
  if (cat) {
    lines.push(`✦ ${cat} • ${payload.title} ✦`);
  } else {
    lines.push(`✦ ${payload.title} ✦`);
  }
  lines.push('');
  lines.push(content.trim());
  lines.push('');
  if (note) {
    lines.push(`💡 ${note.trim()}`);
    lines.push('');
  }
  if (src) {
    lines.push(`📚 المصدر: ${src.trim()}`);
  }
  lines.push('🕌 عبر تطبيق المؤذن الإسلامي');
  return lines.join('\n');
}

/**
 * Shares text content via native Web Share API or falls back to clipboard copy.
 * Returns 'shared' | 'copied' | 'cancelled'
 */
export async function shareIslamicText(payload: SharePayload): Promise<'shared' | 'copied' | 'cancelled'> {
  const formattedText = formatIslamicShareText(payload);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: formattedText,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(formattedText);
      return 'copied';
    } catch {
      // Fallback textarea copy
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = formattedText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return 'copied';
  } catch {
    return 'cancelled';
  }
}

/**
 * Renders a Hadith, Dua, or Dhikr onto a 1080x1350 canvas using any of the 5 offline Islamic backgrounds.
 */
export function renderIslamicCardToCanvas(
  payload: SharePayload,
  themeId: OfflineShareBackgroundTheme['id'] = 'emerald_gold'
): HTMLCanvasElement | null {
  const theme =
    OFFLINE_SHARE_BACKGROUNDS.find((t) => t.id === themeId) || OFFLINE_SHARE_BACKGROUNDS[0];

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
  bgGrad.addColorStop(0, theme.bgStart);
  bgGrad.addColorStop(0.5, theme.bgMid);
  bgGrad.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. Subtle geometric Islamic pattern lines (100% offline canvas drawing)
  ctx.save();
  ctx.strokeStyle = theme.isLight ? 'rgba(16, 75, 64, 0.06)' : 'rgba(245, 197, 66, 0.06)';
  ctx.lineWidth = 2;
  for (let x = 90; x < 1080; x += 180) {
    for (let y = 90; y < 1350; y += 180) {
      ctx.beginPath();
      ctx.arc(x, y, 52, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 3. Radial glow
  const glow = ctx.createRadialGradient(540, 620, 40, 540, 620, 620);
  glow.addColorStop(0, theme.isLight ? 'rgba(197, 160, 89, 0.18)' : 'rgba(212, 175, 55, 0.16)');
  glow.addColorStop(1, 'rgba(212, 175, 55, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1350);

  // 4. Outer & inner ornate frames
  ctx.strokeStyle = theme.isLight ? 'rgba(16, 75, 64, 0.55)' : 'rgba(212, 175, 55, 0.65)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(48, 48, 984, 1254, 36);
  ctx.stroke();

  ctx.strokeStyle = theme.isLight ? 'rgba(197, 160, 89, 0.45)' : 'rgba(212, 175, 55, 0.30)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(66, 66, 948, 1218, 28);
  ctx.stroke();

  // 5. Top Islamic motif ornament (Crescent / Dome / Kaaba / Star / Lantern)
  ctx.save();
  ctx.fillStyle = theme.accentColor;
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 3;
  if (theme.motif === 'crescent') {
    ctx.beginPath();
    ctx.arc(540, 110, 22, 0.3, Math.PI * 1.7);
    ctx.stroke();
  } else if (theme.motif === 'kaaba') {
    ctx.fillRect(522, 92, 36, 36);
    ctx.strokeStyle = '#FFD700';
    ctx.strokeRect(522, 100, 36, 8);
  } else if (theme.motif === 'dome') {
    ctx.beginPath();
    ctx.arc(540, 120, 24, Math.PI, 0);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(540, 110, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 6. Top category badge
  ctx.fillStyle = theme.badgeBg;
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(300, 145, 480, 62, 31);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = theme.subTextColor;
  ctx.font = 'bold 28px "Cairo", "Amiri", sans-serif';
  const badgeText = payload.category || payload.categoryBadge || 'درر نبوية وأدعية';
  ctx.fillText(badgeText, 540, 186, 440);

  // 7. Title
  ctx.fillStyle = theme.textColor;
  ctx.font = 'bold 38px "Amiri", "Cairo", serif';
  ctx.fillText(payload.title, 540, 275, 860);

  // Divider
  ctx.strokeStyle = theme.accentColor;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(260, 315);
  ctx.lineTo(820, 315);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 8. Word-wrap Arabic text
  const mainText = payload.arabicText || payload.body || payload.mainText || '';
  const words = mainText.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const maxCharsPerLine = words.length > 45 ? 42 : 34;

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > maxCharsPerLine && currentLine.length > 0) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = (currentLine + ' ' + word).trim();
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  const displayLines = lines.slice(0, 11);
  if (lines.length > 11) {
    displayLines[10] = displayLines[10] + '...';
  }

  const fontSize = displayLines.length > 7 ? 38 : 45;
  const lineHeight = displayLines.length > 7 ? 65 : 78;
  const blockHeight = displayLines.length * lineHeight;
  let startY = Math.max(405, 690 - blockHeight / 2);

  ctx.fillStyle = theme.textColor;
  ctx.font = `bold ${fontSize}px "Amiri", "Cairo", serif`;
  for (const line of displayLines) {
    ctx.fillText(line, 540, startY, 860);
    startY += lineHeight;
  }

  // 9. Source box at bottom
  const srcText = payload.source || payload.footer || payload.referenceText || payload.extraFooter;
  if (srcText) {
    ctx.fillStyle = theme.subTextColor;
    ctx.font = 'bold 27px "Cairo", sans-serif';
    ctx.fillText(`المصدر: ${srcText}`, 540, 1140, 840);
  }

  // 10. Footer branding
  ctx.fillStyle = theme.isLight ? 'rgba(23, 42, 40, 0.70)' : 'rgba(255, 255, 255, 0.72)';
  ctx.font = 'bold 24px "Cairo", sans-serif';
  ctx.fillText('✦ تطبيق المؤذن الإسلامي • مواقيت الصلاة والأذكار والقرآن الكريم ✦', 540, 1230, 860);

  return canvas;
}

/**
 * Opens an interactive 5-Background Offline Islamic Card Picker Modal so the user can choose
 * any of the 5 built-in offline backgrounds, preview the card live, and Share or Save to Gallery.
 */
export async function shareOrDownloadAsImageCard(
  payload: SharePayload,
  mode: 'share' | 'download' | 'picker' = 'picker',
  themeId: OfflineShareBackgroundTheme['id'] = 'emerald_gold'
): Promise<boolean> {
  if (mode === 'picker' && typeof document !== 'undefined') {
    return openInteractiveOfflineShareModal(payload);
  }

  return exportCanvasCardWithTheme(payload, mode === 'download' ? 'download' : 'share', themeId);
}

async function exportCanvasCardWithTheme(
  payload: SharePayload,
  mode: 'share' | 'download',
  themeId: OfflineShareBackgroundTheme['id']
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const canvas = renderIslamicCardToCanvas(payload, themeId);
      if (!canvas) {
        resolve(false);
        return;
      }
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          const fileName = `moazen_card_${themeId}_${Date.now()}.png`;
          const file = new File([blob], fileName, { type: 'image/png' });

          if (
            mode === 'share' &&
            typeof navigator !== 'undefined' &&
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({ files: [file] })
          ) {
            try {
              await navigator.share({
                title: payload.title,
                text: formatIslamicShareText(payload),
                files: [file],
              });
              resolve(true);
              return;
            } catch {
              // Fallback to gallery save below
            }
          }

          const saveRes = await saveImageBlobToGallery(blob, fileName, payload.title, dataUrl);
          if (typeof window !== 'undefined') {
            const toast = document.createElement('div');
            toast.className =
              'fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-[#104B40] text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg border border-amber-300/40 animate-fadeIn';
            toast.textContent = saveRes.messageAr || '✓ تم حفظ البطاقة بنجاح!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3200);
          }
          resolve(true);
        },
        'image/png',
        0.95
      );
    } catch (err) {
      console.warn('exportCanvasCardWithTheme error:', err);
      // Fallback: share formatted text if image canvas export failed
      shareIslamicText(payload);
      resolve(false);
    }
  });
}

function openInteractiveOfflineShareModal(payload: SharePayload): Promise<boolean> {
  return new Promise((resolve) => {
    let selectedThemeId: OfflineShareBackgroundTheme['id'] = 'emerald_gold';

    const overlay = document.createElement('div');
    overlay.dir = 'rtl';
    overlay.className =
      'fixed inset-0 z-[120] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none';

    const renderModalHtml = () => {
      const canvas = renderIslamicCardToCanvas(payload, selectedThemeId);
      const previewUrl = canvas ? canvas.toDataURL('image/png', 0.85) : '';

      overlay.innerHTML = `
        <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92dvh]">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <div>
              <h3 class="text-sm font-black text-[#172A28] font-cairo">مشاركة كبطاقة إسلامية (5 خلفيات بدون إنترنت)</h3>
              <p class="text-[10.5px] text-gray-500">اختر إحدى الخلفيات الخمس الجاهزة ثم شاركها أو احفظها في المعرض</p>
            </div>
            <button id="moazen-share-close" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold cursor-pointer">✕</button>
          </div>

          <div class="p-3 bg-[#F7F6F2] flex-1 overflow-y-auto flex flex-col items-center justify-center">
            <img src="${previewUrl}" alt="معاينة البطاقة" class="max-h-[44dvh] w-auto rounded-2xl shadow-lg border border-gray-200 object-contain" />
          </div>

          <div class="p-3.5 bg-white border-t border-gray-100 space-y-3 shrink-0">
            <div>
              <span class="text-[11px] font-bold text-[#172A28] block mb-1.5">اختر الخلفية الإسلامية (تعمل 100% دون إنترنت):</span>
              <div class="grid grid-cols-5 gap-1.5">
                ${OFFLINE_SHARE_BACKGROUNDS.map(
                  (t, idx) => `
                  <button
                    data-theme-id="${t.id}"
                    class="theme-pick-btn p-1.5 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      t.id === selectedThemeId
                        ? 'border-[#C5A059] bg-amber-50/70 scale-[1.02]'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }"
                  >
                    <span class="w-6 h-6 rounded-full border border-black/15 block shadow-2xs" style="background: linear-gradient(135deg, ${t.bgStart}, ${t.bgMid});"></span>
                    <span class="text-[9px] font-bold text-[#172A28] leading-tight line-clamp-1">${idx + 1}. ${t.name.split(' ')[0]}</span>
                  </button>
                `
                ).join('')}
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-1">
              <button id="moazen-share-img-btn" class="py-2.5 px-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer">
                <span>📤 مشاركة البطاقة</span>
              </button>
              <button id="moazen-save-gallery-btn" class="py-2.5 px-2 rounded-xl bg-[#C5A059] hover:bg-[#B08D46] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer">
                <span>📥 حفظ بالمعرض</span>
              </button>
              <button id="moazen-share-txt-btn" class="py-2.5 px-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] font-bold text-xs flex items-center justify-center gap-1 border border-gray-200 cursor-pointer">
                <span>📝 مشاركة كنص</span>
              </button>
            </div>
          </div>
        </div>
      `;

      overlay.querySelector('#moazen-share-close')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(false);
      });

      overlay.querySelectorAll('.theme-pick-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-theme-id') as OfflineShareBackgroundTheme['id'];
          if (id) {
            selectedThemeId = id;
            renderModalHtml();
          }
        });
      });

      overlay.querySelector('#moazen-share-img-btn')?.addEventListener('click', async () => {
        await exportCanvasCardWithTheme(payload, 'share', selectedThemeId);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        resolve(true);
      });

      overlay.querySelector('#moazen-save-gallery-btn')?.addEventListener('click', async () => {
        await exportCanvasCardWithTheme(payload, 'download', selectedThemeId);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        resolve(true);
      });

      overlay.querySelector('#moazen-share-txt-btn')?.addEventListener('click', async () => {
        await shareIslamicText(payload);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        resolve(true);
      });
    };

    renderModalHtml();
    document.body.appendChild(overlay);
  });
}
