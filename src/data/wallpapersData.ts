export interface IslamicWallpaper {
  id: string;
  title: string;
  category: 'phrases' | 'mosques' | 'makkah' | 'quran' | 'nature' | 'calligraphy';
  categoryName: string;
  url: string;
  thumbUrl: string;
  fallbackUrl?: string;
  resolution: string;
  description: string;
  islamicPhrase?: string;
  phraseSubtext?: string;
  likesCount: number;
  isOnlineOnDemand?: boolean;
  isBuiltInOffline?: boolean;
  tags: string[];
}

const FAV_WALLPAPERS_KEY = 'moazen_favorite_wallpapers_v1';

export function getSavedFavoriteWallpapers(): string[] {
  try {
    const raw = localStorage.getItem(FAV_WALLPAPERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSavedFavoriteWallpaper(id: string): string[] {
  const current = getSavedFavoriteWallpapers();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  try {
    localStorage.setItem(FAV_WALLPAPERS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

/**
 * Generates an on-demand 1080x1920 SVG Data URI wallpaper with ornate Islamic geometry,
 * crescent/lantern/mosque motifs, and Arabic typography without adding binary image bloat.
 */
export function createIslamicPhraseWallpaperSvg(config: {
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accent: string;
  secondaryAccent: string;
  badgeText: string;
  mainPhrase: string;
  subPhrase: string;
  ornamentType?: 'crescent' | 'kaaba' | 'dome' | 'star' | 'lantern' | 'arch';
}): string {
  const {
    bgStart,
    bgMid,
    bgEnd,
    accent,
    secondaryAccent,
    badgeText,
    mainPhrase,
    subPhrase,
    ornamentType = 'star',
  } = config;

  const words = mainPhrase.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const w of words) {
    if ((currentLine + ' ' + w).trim().length > 26 && currentLine.length > 0) {
      lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine = (currentLine + ' ' + w).trim();
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  const startY = 920 - (lines.length - 1) * 58;
  const textTspans = lines
    .map((line, idx) => `<tspan x="540" y="${startY + idx * 118}">${line}</tspan>`)
    .join('');

  let centerMotif = '';
  if (ornamentType === 'crescent') {
    centerMotif = `
      <circle cx="540" cy="430" r="88" fill="none" stroke="${accent}" stroke-width="2" opacity="0.35"/>
      <path d="M565 365 A65 65 0 1 0 565 495 A52 52 0 1 1 565 365 Z" fill="${accent}" opacity="0.9"/>
      <polygon points="505,415 510,428 524,428 513,436 517,449 505,441 493,449 497,436 486,428 500,428" fill="${accent}"/>
    `;
  } else if (ornamentType === 'kaaba') {
    centerMotif = `
      <rect x="465" y="355" width="150" height="155" rx="10" fill="#111615" stroke="${accent}" stroke-width="4"/>
      <rect x="465" y="388" width="150" height="24" fill="${accent}" opacity="0.9"/>
      <rect x="480" y="393" width="120" height="14" fill="none" stroke="#111615" stroke-width="2" stroke-dasharray="10,6"/>
      <rect x="550" y="438" width="32" height="55" rx="4" fill="${accent}" opacity="0.85"/>
    `;
  } else if (ornamentType === 'dome') {
    centerMotif = `
      <path d="M450 495 Q540 345 630 495 Z" fill="${accent}" opacity="0.85"/>
      <rect x="435" y="495" width="210" height="18" rx="6" fill="${secondaryAccent}" opacity="0.75"/>
      <line x1="540" y1="325" x2="540" y2="375" stroke="${accent}" stroke-width="5"/>
      <circle cx="540" cy="320" r="10" fill="${accent}"/>
    `;
  } else if (ornamentType === 'lantern') {
    centerMotif = `
      <line x1="540" y1="220" x2="540" y2="340" stroke="${accent}" stroke-width="3" opacity="0.7"/>
      <path d="M500 340 L580 340 L600 410 L575 495 L505 495 L480 410 Z" fill="none" stroke="${accent}" stroke-width="4"/>
      <circle cx="540" cy="418" r="28" fill="${accent}" opacity="0.75"/>
      <rect x="512" y="325" width="56" height="15" rx="5" fill="${accent}"/>
      <rect x="515" y="495" width="50" height="14" rx="5" fill="${accent}"/>
    `;
  } else if (ornamentType === 'arch') {
    centerMotif = `
      <path d="M460 500 L460 410 Q540 320 620 410 L620 500 Z" fill="none" stroke="${accent}" stroke-width="4" opacity="0.85"/>
      <circle cx="540" cy="425" r="24" fill="${accent}" opacity="0.6"/>
    `;
  } else {
    centerMotif = `
      <g transform="translate(540,425)">
        <rect x="-58" y="-58" width="116" height="116" fill="none" stroke="${accent}" stroke-width="3" opacity="0.75"/>
        <rect x="-58" y="-58" width="116" height="116" fill="none" stroke="${accent}" stroke-width="3" transform="rotate(45)" opacity="0.75"/>
        <circle cx="0" cy="0" r="26" fill="${accent}" opacity="0.25"/>
        <circle cx="0" cy="0" r="10" fill="${accent}"/>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="52%" stop-color="${bgMid}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="48%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="islamicGrid" width="120" height="120" patternUnits="userSpaceOnUse">
        <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="none" stroke="${accent}" stroke-width="1" opacity="0.09"/>
        <circle cx="60" cy="60" r="28" fill="none" stroke="${accent}" stroke-width="1" opacity="0.07"/>
      </pattern>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    <rect width="1080" height="1920" fill="url(#islamicGrid)"/>
    <rect width="1080" height="1920" fill="url(#glow)"/>
    <rect x="54" y="64" width="972" height="1792" rx="44" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.45"/>
    <rect x="74" y="84" width="932" height="1752" rx="34" fill="none" stroke="${secondaryAccent}" stroke-width="1.2" opacity="0.3"/>
    <circle cx="94" cy="104" r="10" fill="${accent}" opacity="0.5"/>
    <circle cx="986" cy="104" r="10" fill="${accent}" opacity="0.5"/>
    <circle cx="94" cy="1816" r="10" fill="${accent}" opacity="0.5"/>
    <circle cx="986" cy="1816" r="10" fill="${accent}" opacity="0.5"/>
    <path d="M180 220 Q540 90 900 220" fill="none" stroke="${accent}" stroke-width="2" opacity="0.4"/>
    ${centerMotif}
    <rect x="310" y="565" width="460" height="58" rx="29" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-width="1.8" stroke-opacity="0.6"/>
    <text x="540" y="604" text-anchor="middle" fill="${accent}" font-family="'Amiri', 'Cairo', serif" font-size="30" font-weight="bold">${badgeText}</text>
    <line x1="250" y1="695" x2="830" y2="695" stroke="${accent}" stroke-width="1.5" opacity="0.35"/>
    <polygon points="540,683 552,695 540,707 528,695" fill="${accent}" opacity="0.8"/>
    <text text-anchor="middle" fill="#FFFFFF" font-family="'Amiri', 'Traditional Arabic', 'Cairo', serif" font-size="66" font-weight="bold">
      ${textTspans}
    </text>
    <line x1="250" y1="1265" x2="830" y2="1265" stroke="${accent}" stroke-width="1.5" opacity="0.35"/>
    <polygon points="540,1253 552,1265 540,1277 528,1265" fill="${accent}" opacity="0.8"/>
    <text x="540" y="1355" text-anchor="middle" fill="${secondaryAccent}" font-family="'Cairo', 'Amiri', sans-serif" font-size="34" font-weight="bold" opacity="0.92">
      ${subPhrase}
    </text>
    <path d="M120 1760 L960 1760" stroke="${accent}" stroke-width="2" opacity="0.35"/>
    <text x="540" y="1720" text-anchor="middle" fill="${accent}" font-family="'Amiri', serif" font-size="26" opacity="0.65">
      ✦ تطبيق المؤذن الإسلامي • خلفيات إيمانية ✦
    </text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Color palettes for generating rich, diverse wallpapers
const COLOR_THEMES: Array<{
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accent: string;
  secondaryAccent: string;
  ornament: 'crescent' | 'kaaba' | 'dome' | 'star' | 'lantern' | 'arch';
}> = [
  { bgStart: '#041f18', bgMid: '#0b3b2e', bgEnd: '#041712', accent: '#f5c542', secondaryAccent: '#fde68a', ornament: 'crescent' },
  { bgStart: '#08201a', bgMid: '#124e3f', bgEnd: '#071b16', accent: '#fbbf24', secondaryAccent: '#fef08a', ornament: 'dome' },
  { bgStart: '#0f172a', bgMid: '#1e293b', bgEnd: '#090d16', accent: '#38bdf8', secondaryAccent: '#bae6fd', ornament: 'star' },
  { bgStart: '#1c1917', bgMid: '#292524', bgEnd: '#0c0a09', accent: '#f59e0b', secondaryAccent: '#fde68a', ornament: 'kaaba' },
  { bgStart: '#062c24', bgMid: '#0d4a3e', bgEnd: '#031814', accent: '#34d399', secondaryAccent: '#a7f3d0', ornament: 'lantern' },
  { bgStart: '#1e1b4b', bgMid: '#312e81', bgEnd: '#0f0d26', accent: '#fbbf24', secondaryAccent: '#fde68a', ornament: 'arch' },
  { bgStart: '#27120b', bgMid: '#451a03', bgEnd: '#170904', accent: '#fbbf24', secondaryAccent: '#fed7aa', ornament: 'crescent' },
  { bgStart: '#042f2e', bgMid: '#115e59', bgEnd: '#021b1a', accent: '#fcd34d', secondaryAccent: '#99f6e4', ornament: 'lantern' },
  { bgStart: '#171528', bgMid: '#2a244d', bgEnd: '#0c0b16', accent: '#eab308', secondaryAccent: '#fef08a', ornament: 'dome' },
  { bgStart: '#070b0a', bgMid: '#131d1a', bgEnd: '#050707', accent: '#f5c542', secondaryAccent: '#fde68a', ornament: 'kaaba' },
];

// On-demand online mosque & holy site image URLs (loaded lazily only when viewed, with instant fallback)
const ONLINE_MOSQUE_WALLPAPER_SOURCES = [
  {
    id: 'mosque-online-1',
    title: 'المسجد الحرام والكعبة المشرفة في ليلة روحانية',
    category: 'makkah' as const,
    categoryName: 'الحرمين والأقصى',
    onlineUrl: 'https://images.pexels.com/photos/2291004/pexels-photo-2291004.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/aistudio/_________________________713b9a3f.jpg',
    phrase: '﴿ إِنَّ أَوَّلَ بَيْتٍ وُضِعَ لِلنَّاسِ لَلَّذِي بِبَكَّةَ مُبَارَكًا وَهُدًى لِلْعَالَمِينَ ﴾',
    sub: 'سورة آل عمران • الآية ٩٦',
    likes: 482,
  },
  {
    id: 'mosque-online-2',
    title: 'المسجد النبوي الشريف والقبة الخضراء المباركة',
    category: 'makkah' as const,
    categoryName: 'الحرمين والأقصى',
    onlineUrl: 'https://images.pexels.com/photos/18274181/pexels-photo-18274181.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/hadith_widget_mosque_1793589264940.jpg',
    phrase: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ',
    sub: 'طيبة الطيبة • المدينة المنورة',
    likes: 519,
  },
  {
    id: 'mosque-online-3',
    title: 'قبة الصخرة المشرفة والمسجد الأقصى المبارك',
    category: 'makkah' as const,
    categoryName: 'الحرمين والأقصى',
    onlineUrl: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى ﴾',
    sub: 'أولى القبلتين وثالث الحرمين الشريفين',
    likes: 610,
  },
  {
    id: 'mosque-online-4',
    title: 'جامع السلطان أحمد وقت الشفق الذهبي',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: '/assets/images/mosque_header_bg_1792330870635.jpg',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ فِي بُيُوتٍ أَذِنَ اللَّهُ أَنْ تُرْفَعَ وَيُذْكَرَ فِيهَا اسْمُهُ ﴾',
    sub: 'سورة النور • الآية ٣٦',
    likes: 342,
  },
  {
    id: 'mosque-online-5',
    title: 'الزخارف الذهبية في القبة الإسلامية العريقة',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: '/assets/aistudio/_________________________713b9a3f.jpg',
    fallbackImg: '/assets/aistudio/_________________________713b9a3f.jpg',
    phrase: '﴿ اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ﴾',
    sub: 'سورة النور • الآية ٣٥',
    likes: 398,
  },
  {
    id: 'mosque-online-6',
    title: 'مسجد الشيخ زايد الكبير وانعكاس القباب البيضاء',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/3727255/pexels-photo-3727255.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا ﴾',
    sub: 'سورة الجن • الآية ١٨',
    likes: 289,
  },
  {
    id: 'mosque-online-7',
    title: 'الأزهر الشريف ومآذن القاهرة الفاطمية',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/1537086/pexels-photo-1537086.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنْكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ ﴾',
    sub: 'سورة المجادلة • الآية ١١',
    likes: 315,
  },
  {
    id: 'mosque-online-8',
    title: 'مسجد الحسن الثاني على ضفاف المحيط الأطلسي',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/2404046/pexels-photo-2404046.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/hadith_widget_mosque_1793589264940.jpg',
    phrase: '﴿ وَهُوَ الَّذِي سَخَّرَ الْبَحْرَ لِتَأْكُلُوا مِنْهُ لَحْمًا طَرِيًّا ﴾',
    sub: 'سورة النحل • الآية ١٤',
    likes: 267,
  },
  {
    id: 'mosque-online-9',
    title: 'مسجد محمد علي باشا بقلعة صلاح الدين بالقاهرة',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/3214958/pexels-photo-3214958.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ ادْخُلُوا مِصْرَ إِنْ شَاءَ اللَّهُ آمِنِينَ ﴾',
    sub: 'سورة يوسف • الآية ٩٩',
    likes: 412,
  },
  {
    id: 'mosque-online-10',
    title: 'جامع القيروان الكبير (عقبة بن نافع)',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ رِجَالٌ لَا تُلْهِيهِمْ تِجَارَةٌ وَلَا بَيْعٌ عَنْ ذِكْرِ اللَّهِ ﴾',
    sub: 'سورة النور • الآية ٣٧',
    likes: 234,
  },
  {
    id: 'mosque-online-11',
    title: 'الجامع الأموي الكبير بدمشق الفيحاء',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/460680/pexels-photo-460680.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ ﴾',
    sub: 'سورة التوبة • الآية ١٨',
    likes: 376,
  },
  {
    id: 'mosque-online-12',
    title: 'مسجد قباء بالمدينة المنورة (أول مسجد أسس على التقوى)',
    category: 'makkah' as const,
    categoryName: 'الحرمين والأقصى',
    onlineUrl: 'https://images.pexels.com/photos/2087391/pexels-photo-2087391.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/hadith_widget_mosque_1793589264940.jpg',
    phrase: '﴿ لَمَسْجِدٌ أُسِّسَ عَلَى التَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ أَحَقُّ أَنْ تَقُومَ فِيهِ ﴾',
    sub: 'صلاة في مسجد قباء كعمرة',
    likes: 445,
  },
  {
    id: 'mosque-online-13',
    title: 'محراب المسجد الأندلسي بقرطبة',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/1619569/pexels-photo-1619569.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/aistudio/_________________________713b9a3f.jpg',
    phrase: '﴿ فَنَادَتْهُ الْمَلَائِكَةُ وَهُوَ قَائِمٌ يُصَلِّي فِي الْمِحْرَابِ ﴾',
    sub: 'سورة آل عمران • الآية ٣٩',
    likes: 295,
  },
  {
    id: 'mosque-online-14',
    title: 'مسجد السلطان قابوس الأكبر بمسقط',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/3689859/pexels-photo-3689859.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ وَاقْصِدْ فِي مَشْيِكَ وَاغْضُضْ مِنْ صَوْتِكَ ﴾',
    sub: 'سورة لقمان • الآية ١٩',
    likes: 260,
  },
  {
    id: 'mosque-online-15',
    title: 'مسجد الملك فيصل في إسلام آباد',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/2832077/pexels-photo-2832077.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ ﴾',
    sub: 'سورة البقرة • الآية ١٢٧',
    likes: 248,
  },
  {
    id: 'mosque-online-16',
    title: 'مسجد الكريستال المضيء على الماء',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ نُورٌ عَلَىٰ نُورٍ يَهْدِي اللَّهُ لِنُورِهِ مَنْ يَشَاءُ ﴾',
    sub: 'سورة النور • الآية ٣٥',
    likes: 318,
  },
  {
    id: 'mosque-online-17',
    title: 'مسجد بوترا الوردي على البحيرة',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/1549326/pexels-photo-1549326.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/hadith_widget_mosque_1793589264940.jpg',
    phrase: '﴿ وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ غُرُوبِهَا ﴾',
    sub: 'سورة طه • الآية ١٣٠',
    likes: 274,
  },
  {
    id: 'mosque-online-18',
    title: 'جامع السلطان حسن التاريخي بالقاهرة',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/3290068/pexels-photo-3290068.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/aistudio/_________________________713b9a3f.jpg',
    phrase: '﴿ حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ ﴾',
    sub: 'سورة البقرة • الآية ٢٣٨',
    likes: 355,
  },
  {
    id: 'mosque-online-19',
    title: 'مسجد السليمانية في إسطنبول وقت الغروب',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/2048865/pexels-photo-2048865.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِنَ اللَّيْلِ ﴾',
    sub: 'سورة هود • الآية ١١٤',
    likes: 331,
  },
  {
    id: 'mosque-online-20',
    title: 'مسجد الفتاح العليم والعمارة الإسلامية الحديثة',
    category: 'mosques' as const,
    categoryName: 'مساجد وعمارة',
    onlineUrl: 'https://images.pexels.com/photos/2104882/pexels-photo-2104882.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ رَبَّنَا افْتَحْ بَيْنَنَا وَبَيْنَ قَوْمِنَا بِالْحَقِّ وَأَنْتَ خَيْرُ الْفَاتِحِينَ ﴾',
    sub: 'سورة الأعراف • الآية ٨٩',
    likes: 290,
  },
  {
    id: 'mosque-online-21',
    title: 'الروضة الشريفة وأعمدة المسجد النبوي',
    category: 'makkah' as const,
    categoryName: 'الحرمين والأقصى',
    onlineUrl: 'https://images.pexels.com/photos/4346403/pexels-photo-4346403.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/hadith_widget_mosque_1793589264940.jpg',
    phrase: '«مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ»',
    sub: 'حديث شريف متفق عليه',
    likes: 580,
  },
  {
    id: 'mosque-online-22',
    title: 'مقام إبراهيم عليه السلام والصفا والمروة',
    category: 'makkah' as const,
    categoryName: 'الحرمين والأقصى',
    onlineUrl: 'https://images.pexels.com/photos/4346404/pexels-photo-4346404.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/aistudio/_________________________713b9a3f.jpg',
    phrase: '﴿ إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ ﴾',
    sub: 'سورة البقرة • الآية ١٥٨',
    likes: 465,
  },
  {
    id: 'mosque-online-23',
    title: 'المصحف الشريف المفتوح في رحاب الحرم',
    category: 'quran' as const,
    categoryName: 'القرآن والأذكار',
    onlineUrl: '/assets/images/open_mushaf_rehal_1792331334829.jpg',
    fallbackImg: '/assets/images/open_mushaf_rehal_1792331334829.jpg',
    phrase: '﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾',
    sub: 'سورة الإسراء • الآية ٩',
    likes: 512,
  },
  {
    id: 'mosque-online-24',
    title: 'المصحف العثماني على الرِّحل الخشبي المزخرف',
    category: 'quran' as const,
    categoryName: 'القرآن والأذكار',
    onlineUrl: '/assets/images/quran_rehal_wood_1792265354181.jpg',
    fallbackImg: '/assets/images/quran_rehal_wood_1792265354181.jpg',
    phrase: '﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾',
    sub: 'سورة المزمل • الآية ٤',
    likes: 478,
  },
  {
    id: 'mosque-online-25',
    title: 'مسبحة التسبيح والذكر في السحر',
    category: 'quran' as const,
    categoryName: 'القرآن والأذكار',
    onlineUrl: '/assets/images/tasbih_prayer_beads_1792265378950.jpg',
    fallbackImg: '/assets/images/tasbih_prayer_beads_1792265378950.jpg',
    phrase: 'سُبْحَانَ اللَّهِ • وَالْحَمْدُ لِلَّهِ • وَلَا إِلَٰهَ إِلَّا اللَّهُ • وَاللَّهُ أَكْبَرُ',
    sub: 'الباقيات الصالحات خيرٌ عند ربك ثواباً',
    likes: 439,
  },
  // 15 Nature & Contemplation Wallpapers with Islamic & Quranic Phrases (On-Demand + Offline Fallback)
  {
    id: 'nature-online-1',
    title: 'شروق الفجر الصادق وتنفس الصباح فوق الجبال',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ وَالصُّبْحِ إِذَا تَنَفَّسَ ﴾',
    sub: 'سورة التكوير • الآية ١٨',
    likes: 388,
  },
  {
    id: 'nature-online-2',
    title: 'تأمل السماء والنجوم في جوف الليل',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/aistudio/_________________________713b9a3f.jpg',
    phrase: '﴿ رَبَّنَا مَا خَلَقْتَ هَٰذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ ﴾',
    sub: 'سورة آل عمران • الآية ١٩١',
    likes: 425,
  },
  {
    id: 'nature-online-3',
    title: 'الجبال الرواسي وعظمة الخالق جل جلاله',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ وَإِلَى الْجِبَالِ كَيْفَ نُصِبَتْ ﴾',
    sub: 'سورة الغاشية • الآية ١٩',
    likes: 349,
  },
  {
    id: 'nature-online-4',
    title: 'أمواج البحر الهادئة عند الغروب الذهبي',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ قُلْ لَوْ كَانَ الْبَحْرُ مِدَادًا لِكَلِمَاتِ رَبِّي لَنَفِدَ الْبَحْرُ ﴾',
    sub: 'سورة الكهف • الآية ١٠٩',
    likes: 372,
  },
  {
    id: 'nature-online-5',
    title: 'نزول الغيث والمطر وإحياء الأرض بعد موتها',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/hadith_widget_mosque_1793589264940.jpg',
    phrase: '﴿ وَهُوَ الَّذِي يُنَزِّلُ الْغَيْثَ مِنْ بَعْدِ مَا قَنَطُوا وَيَنْشُرُ رَحْمَتَهُ ﴾',
    sub: 'سورة الشورى • الآية ٢٨',
    likes: 495,
  },
  {
    id: 'nature-online-6',
    title: 'واحة النخيل والعيون الجارية في الصحراء',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/273935/pexels-photo-273935.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ وَالنَّخْلَ بَاسِقَاتٍ لَهَا طَلْعٌ نَضِيدٌ • رِزْقًا لِلْعِبَادِ ﴾',
    sub: 'سورة ق • الآيتان ١٠-١١',
    likes: 312,
  },
  {
    id: 'nature-online-7',
    title: 'الهلال المنير في سماء الليل الصافية',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/813269/pexels-photo-813269.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/aistudio/_________________________713b9a3f.jpg',
    phrase: '﴿ يَسْأَلُونَكَ عَنِ الْأَهِلَّةِ قُلْ هِيَ مَوَاقِيتُ لِلنَّاسِ وَالْحَجِّ ﴾',
    sub: 'سورة البقرة • الآية ١٨٩',
    likes: 418,
  },
  {
    id: 'nature-online-8',
    title: 'الأنهار والجنات الخضراء وتسبيح الكائنات',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/hadith_widget_mosque_1793589264940.jpg',
    phrase: '﴿ وَإِنْ مِنْ شَيْءٍ إِلَّا يُسَبِّحُ بِحَمْدِهِ ﴾',
    sub: 'سورة الإسراء • الآية ٤٤',
    likes: 364,
  },
  {
    id: 'nature-online-9',
    title: 'كثبان الرمال الذهبية وقت الأصيل',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/1001435/pexels-photo-1001435.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ أَفَلَا يَنْظُرُونَ إِلَى الْإِبِلِ كَيْفَ خُلِقَتْ • وَإِلَى السَّمَاءِ كَيْفَ رُفِعَتْ ﴾',
    sub: 'سورة الغاشية • الآيتان ١٧-١٨',
    likes: 295,
  },
  {
    id: 'nature-online-10',
    title: 'شروق الشمس من بين الغيوم وتجدد الأمل بالله',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ وَالشَّمْسِ وَضُحَاهَا • وَالْقَمَرِ إِذَا تَلَاهَا ﴾',
    sub: 'سورة الشمس • الآيتان ١-٢',
    likes: 344,
  },
  {
    id: 'nature-online-11',
    title: 'شلالات المياه العذبة وآيات الإبداع الإلهي',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ أَفَلَا يُؤْمِنُونَ ﴾',
    sub: 'سورة الأنبياء • الآية ٣٠',
    likes: 407,
  },
  {
    id: 'nature-online-12',
    title: 'أشجار الزيتون المباركة ونور الله في الكون',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ يُوقَدُ مِنْ شَجَرَةٍ مُبَارَكَةٍ زَيْتُونَةٍ لَا شَرْقِيَّةٍ وَلَا غَرْبِيَّةٍ ﴾',
    sub: 'سورة النور • الآية ٣٥',
    likes: 390,
  },
  {
    id: 'nature-online-13',
    title: 'البحيرة الساكنة وانعكاس السماء الصافية',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/hadith_widget_mosque_1793589264940.jpg',
    phrase: '﴿ صُنْعَ اللَّهِ الَّذِي أَتْقَنَ كُلَّ شَيْءٍ ﴾',
    sub: 'سورة النمل • الآية ٨٨',
    likes: 332,
  },
  {
    id: 'nature-online-14',
    title: 'أزهار الربيع المتفتحة وبديع خلق الرحمن',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_sunset_header_1792265336563.jpg',
    phrase: '﴿ فَانْظُرْ إِلَىٰ آثَارِ رَحْمَتِ اللَّهِ كَيْفَ يُحْيِي الْأَرْضَ بَعْدَ مَوْتِهَا ﴾',
    sub: 'سورة الروم • الآية ٥٠',
    likes: 356,
  },
  {
    id: 'nature-online-15',
    title: 'الطريق بين الأشجار ودعاء الهداية الصراط المستقيم',
    category: 'nature' as const,
    categoryName: 'الطبيعة والتأمل',
    onlineUrl: 'https://images.pexels.com/photos/38136/pexels-photo-38136.jpeg?auto=compress&cs=tinysrgb&w=1080',
    fallbackImg: '/assets/images/mosque_header_bg_1792330870635.jpg',
    phrase: '﴿ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴾',
    sub: 'سورة الفاتحة • الآية ٦',
    likes: 461,
  },
];

// 80 Curated Islamic Phrases, Quranic Verses, Prophetic Supplications & Mosque Themes
const CURATED_PHRASE_ITEMS: Array<{
  title: string;
  category: 'phrases' | 'quran' | 'makkah' | 'mosques';
  categoryName: string;
  badge: string;
  phrase: string;
  sub: string;
}> = [
  { title: 'ألا بذكر الله تطمئن القلوب', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'آية وسكينة', phrase: '﴿ أَلَا بِذْكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾', sub: 'سورة الرعد • الآية ٢٨' },
  { title: 'اللهم صل وسلم على نبينا محمد ﷺ', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'الصلاة على النبي ﷺ', phrase: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ ﷺ', sub: 'من صلى عليّ صلاة صلى الله عليه بها عشراً' },
  { title: 'لا إله إلا أنت سبحانك إني كنت من الظالمين', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'دعاء ذي النون', phrase: '﴿ لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ ﴾', sub: 'ما دعا بها مكروب إلا فرّج الله كربه' },
  { title: 'حسبي الله لا إله إلا هو عليه توكلت', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'آية الكفاية والتوكل', phrase: '﴿ حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ ﴾', sub: 'من قالها سبع مرات كفاه الله ما أهمه' },
  { title: 'فإن مع العسر يسراً إن مع العسر يسراً', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'بشارة ربانية', phrase: '﴿ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾', sub: 'سورة الشرح • لن يغلب عسرٌ يسرين' },
  { title: 'سبحان الله وبحمده سبحان الله العظيم', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'حبيبتان إلى الرحمن', phrase: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ • سُبْحَانَ اللَّهِ الْعَظِيمِ', sub: 'خفيفتان على اللسان ثقيلتان في الميزان' },
  { title: 'وما توفيقي إلا بالله عليه توكلت', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'استعانة وتوفيق', phrase: '﴿ وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ ﴾', sub: 'سورة هود • الآية ٨٨' },
  { title: 'رب اشرح لي صدري ويسر لي أمري', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'دعاء موسى عليه السلام', phrase: '﴿ رَبِّ اشْرَحْ لِي صَدْرِي • وَيَسِّرْ لِي أَمْرِي ﴾', sub: 'سورة طه • انشراح الصدر وتيسير الأمور' },
  { title: 'فاذكروني أذكركم واشكروا لي', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'شرف الذكر والشكر', phrase: '﴿ فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ ﴾', sub: 'سورة البقرة • الآية ١٥٢' },
  { title: 'لا حول ولا قوة إلا بالله العلي العظيم', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'كنز من كنوز الجنة', phrase: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ', sub: 'حوقلةٌ تُفتح بها المغاليق وتُحمل بها الأثقال' },
  { title: 'وإذا سألك عبادي عني فإني قريب', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'قرب إلهي وإجابة', phrase: '﴿ وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ ﴾', sub: 'سورة البقرة • الآية ١٨٦' },
  { title: 'لا تقنطوا من رحمة الله', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'آية الرجاء العظمى', phrase: '﴿ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ﴾', sub: 'سورة الزمر • الآية ٥٣' },
  { title: 'ومن يتق الله يجعل له مخرجاً', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'مفتاح الفرج والرزق', phrase: '﴿ وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ﴾', sub: 'سورة الطلاق • الآيتان ٢-٣' },
  { title: 'ومن يتوكل على الله فهو حسبه', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'كفاية المتوكلين', phrase: '﴿ وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ ﴾', sub: 'سورة الطلاق • الآية ٣' },
  { title: 'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'أجمع دعاء في القرآن', phrase: '﴿ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ ﴾', sub: 'سورة البقرة • الآية ٢٠١' },
  { title: 'ربنا لا تزغ قلوبنا بعد إذ هديتنا', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'دعاء الثبات على الحق', phrase: '﴿ رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً ﴾', sub: 'سورة آل عمران • الآية ٨' },
  { title: 'يا مقلب القلوب ثبت قلبي على دينك', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'أكثر دعاء النبي ﷺ', phrase: '«يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ»', sub: 'رواه الترمذي وصححه الألباني' },
  { title: 'اللهم إنك عفو تحب العفو فاعف عني', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء العفو والمغفرة', phrase: '«اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي»', sub: 'وصية النبي ﷺ لأم المؤمنين عائشة رضي الله عنها' },
  { title: 'اللهم أعني على ذكرك وشكرك وحسن عبادتك', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'وصية المحبة النبوية', phrase: '«اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ»', sub: 'والله إني لأحبك يا معاذ فلا تدعنّ دبر كل صلاة أن تقولها' },
  { title: 'اللهم إني أسألك الهدى والتقى والعفاف والغنى', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'جامع خيري الدنيا والآخرة', phrase: '«اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى»', sub: 'رواه الإمام مسلم في صحيحه' },
  { title: 'سيد الاستغفار النبوي الشريف', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'سيد الاستغفار', phrase: '«اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ»', sub: 'من قالها موقناً بها فمات من يومه دخل الجنة' },
  { title: 'رضيت بالله رباً وبالإسلام ديناً وبمحمد ﷺ نبياً', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'سبب رضا الله يوم القيامة', phrase: '«رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا»', sub: 'من قالها ثلاثاً كان حقاً على الله أن يرضيه' },
  { title: 'بسم الله الذي لا يضر مع اسمه شيء', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'حصن الحفظ المتين', phrase: '«بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلَا فِي السَّمَاءِ»', sub: 'لم تصبه فجأة بلاء ولم يضره شيء' },
  { title: 'يا حي يا قيوم برحمتك أستغيث', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء الكرب والشدة', phrase: '«يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ»', sub: 'ولا تكلني إلى نفسي طرفة عين' },
  { title: 'اللهم إني أسألك علماً نافعاً ورزقاً طيباً', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء إشراقة الصباح', phrase: '«اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا»', sub: 'يُقال بعد السلام من صلاة الفجر' },
  { title: 'وافوض أمري إلى الله إن الله بصير بالعباد', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'تفويض الأمر لله', phrase: '﴿ وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ ﴾', sub: 'فوقاه الله سيئات ما مكروا • سورة غافر' },
  { title: 'لا تحزن إن الله معنا', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'معية الله وحفظه', phrase: '﴿ لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا ﴾', sub: 'سورة التوبة • الآية ٤٠' },
  { title: 'إن ربي لطيف لما يشاء', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'لطف الله الخفي', phrase: '﴿ إِنَّ رَبِّي لَطِيفٌ لِمَا يَشَاءُ إِنَّهُ هُوَ الْعَلِيمُ الْحَكِيمُ ﴾', sub: 'سورة يوسف • الآية ١٠٠' },
  { title: 'عسى الله أن يأتي بالفتح أو أمر من عنده', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'حسن الظن بالله', phrase: '﴿ فَعَسَى اللَّهُ أَنْ يَأْتِيَ بِالْفَتْحِ أَوْ أَمْرٍ مِنْ عِنْدِهِ ﴾', sub: 'سورة المائدة • الآية ٥٢' },
  { title: 'سيجعل الله بعد عسر يسراً', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'وعد الله الحق', phrase: '﴿ سَيَجْعَلُ اللَّهُ بَعْدَ عُسْرٍ يُسْرًا ﴾', sub: 'سورة الطلاق • الآية ٧' },
  { title: 'ولسوف يعطيك ربك فترضى', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'عطاء الله الواسع', phrase: '﴿ وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ ﴾', sub: 'سورة الضحى • الآية ٥' },
  { title: 'واصبر لحكم ربك فإنك بأعيننا', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'رعاية الله لعباده', phrase: '﴿ وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا وَسَبِّحْ بِحَمْدِ رَبِّكَ ﴾', sub: 'سورة الطور • الآية ٤٨' },
  { title: 'قل لن يصيبنا إلا ما كتب الله لنا', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'الرضا بالقضاء والقدر', phrase: '﴿ قُلْ لَنْ يُصِيبَنَا إِلَّا مَا كَتَبَ اللَّهُ لَنَا هُوَ مَوْلَانَا ﴾', sub: 'وعلى الله فليتوكل المؤمنون • سورة التوبة' },
  { title: 'رب إني لما أنزلت إلي من خير فقير', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'دعاء جلب الرزق والخير', phrase: '﴿ رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ ﴾', sub: 'دعاء موسى عليه السلام • سورة القصص: ٢٤' },
  { title: 'رب هب لي من الصالحين', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'دعاء الذرية الصالحة', phrase: '﴿ رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ ﴾', sub: 'دعاء إبراهيم الخليل عليه السلام • سورة الصافات' },
  { title: 'رب اجعلني مقيم الصلاة ومن ذريتي', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'الثبات على الصلاة', phrase: '﴿ رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ ﴾', sub: 'سورة إبراهيم • الآية ٤٠' },
  { title: 'ربنا هب لنا من أزواجنا وذرياتنا قرة أعين', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'دعاء عباد الرحمن', phrase: '﴿ رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا ﴾', sub: 'سورة الفرقان • الآية ٧٤' },
  { title: 'وقل رب ارحمهما كما ربياني صغيراً', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'بر الوالدين والدعاء لهما', phrase: '﴿ وَقُلْ رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا ﴾', sub: 'سورة الإسراء • الآية ٢٤' },
  { title: 'رب زدني علماً', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'شرف طلب العلم', phrase: '﴿ وَقُلْ رَبِّ زِدْنِي عِلْمًا ﴾', sub: 'سورة طه • الآية ١١٤' },
  { title: 'توفني مسلماً وألحقني بالصالحين', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'دعاء حسن الخاتمة', phrase: '﴿ تَوَفَّنِي مُسْلِمًا وَأَلْحِقْنِي بِالصَّالِحِينَ ﴾', sub: 'سورة يوسف • الآية ١٠١' },
  { title: 'أني مسني الضر وأنت أرحم الراحمين', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'دعاء الشفاء وكشف الضر', phrase: '﴿ أَنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ ﴾', sub: 'دعاء أيوب عليه السلام • سورة الأنبياء: ٨٣' },
  { title: 'فنادى في الظلمات أن لا إله إلا أنت سبحانك', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'الفرج في الشدائد', phrase: '﴿ فَاسْتَجَبْنَا لَهُ وَنَجَّيْنَاهُ مِنَ الْغَمِّ وَكَذَٰلِكَ نُنْجِي الْمُؤْمِنِينَ ﴾', sub: 'سورة الأنبياء • الآية ٨٨' },
  { title: 'إن الله وملائكته يصلون على النبي', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'آية الصلاة على النبي ﷺ', phrase: '﴿ إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا ﴾', sub: 'سورة الأحزاب • الآية ٥٦' },
  { title: 'اللهم بك أصبحنا وبك أمسينا وبك نحيا', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'أذكار الصباح والمساء', phrase: '«اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ»', sub: 'حصن المسلم اليومي' },
  { title: 'اللهم ما أصبح بي من نعمة فمنك وحدك', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'أداء شكر اليوم والليلة', phrase: '«اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الحَمْدُ وَلَكَ الشُّكْرُ»', sub: 'من قالها حين يصبح فقد أدى شكر يومه' },
  { title: 'اللهم عافني في بدني اللهم عافني في سمعي', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء العافية والستر', phrase: '«اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي»', sub: 'لا إله إلا أنت • سنن أبي داود' },
  { title: 'اللهم إني أسألك العفو والعافية في الدنيا والآخرة', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'أعظم سؤال بعد اليقين', phrase: '«اللَّهُمَّ إِنِّي أَسْأَلُكَ العَفْوَ وَالعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي»', sub: 'اللهم استر عوراتي وآمن روعاتي' },
  { title: 'أعوذ بكلمات الله التامات من شر ما خلق', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'تحصين المساء والمنزل', phrase: '«أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ»', sub: 'رواه الإمام مسلم في صحيحه' },
  { title: 'اللهم اكفني بحلالك عن حرامك وأغنني بفضلك', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء قضاء الدين والغنى', phrase: '«اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ»', sub: 'لو كان عليك مثل جبل صير ديناً لأداه الله عنك' },
  { title: 'اللهم إني أعوذ بك من الهم والحزن والعجز والكسل', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'تحصين النفس والقلب', phrase: '«اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الهَمِّ وَالحَزَنِ، وَالعَجْزِ وَالكَسَلِ، وَالبُخْلِ وَالجُبْنِ، وَضَلَعِ الدَّيْنِ»', sub: 'صحيح البخاري' },
  { title: 'اللهم أصلح لي ديني الذي هو عصمة أمري', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء صلاح الدارين', phrase: '«اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي»', sub: 'واجعل الحياة زيادة لي في كل خير • صحيح مسلم' },
  { title: 'اللهم إني أسألك الجنة وما قرب إليها من قول أو عمل', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'سؤال الفردوس الأعلى', phrase: '«اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ»', sub: 'وأعوذ بك من النار وما قرب إليها من قول أو عمل' },
  { title: 'اللهم إني أسألك حبك وحب من يحبك', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء محبة الله', phrase: '«اللَّهُمَّ إِنِّي أَسْأَلُكَ حُبَّكَ، وَحُبَّ مَنْ يُحِبُّكَ، وَالعَمَلَ الَّذِي يُبَلِّغُنِي حُبَّكَ»', sub: 'سنن الترمذي' },
  { title: 'اللهم مصرف القلوب صرف قلوبنا على طاعتك', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'الثبات على الطاعة', phrase: '«اللَّهُمَّ مُصَرِّفَ الْقُلُوبِ صَرِّفْ قُلُوبَنَا عَلَى طَاعَتِكَ»', sub: 'رواه الإمام مسلم' },
  { title: 'سبحان الله والحمد لله ولا إله إلا الله والله أكبر', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'أحب الكلام إلى الله', phrase: '«سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ»', sub: 'أحب إليّ مما طلعت عليه الشمس • صحيح مسلم' },
  { title: 'لا إله إلا الله وحده لا شريك له له الملك وله الحمد', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'عظم أجر التوحيد', phrase: '«لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ»', sub: 'من قالها مائة مرة في يوم كانت له حرزاً من الشيطان' },
  { title: 'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'مغفرة الذنوب العظام', phrase: '«أَسْتَغْفِرُ اللَّهَ العَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الحَيُّ القَيُّومُ وَأَتُوبُ إِلَيْهِ»', sub: 'غُفر له وإن كان فرّ من الزحف' },
  { title: 'اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'أذكار دبر الصلاة', phrase: '«اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ»', sub: 'صحيح مسلم' },
  { title: 'اللهم لا مانع لما أعطيت ولا معطي لما منعت', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'كمال التوحيد واليقين', phrase: '«اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الجَدِّ مِنْكَ الجَدُّ»', sub: 'متفق عليه' },
  { title: 'اللهم افتح لي أبواب رحمتك', category: 'mosques', categoryName: 'مساجد وعمارة', badge: 'دعاء دخول المسجد', phrase: '«بِسْمِ اللَّهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ»', sub: 'سنن المسجد وآدابه' },
  { title: 'اللهم إني أسألك من فضلك', category: 'mosques', categoryName: 'مساجد وعمارة', badge: 'دعاء الخروج من المسجد', phrase: '«بِسْمِ اللَّهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ»', sub: 'صحيح مسلم' },
  { title: 'اللهم رب هذه الدعوة التامة والصلاة القائمة', category: 'mosques', categoryName: 'مساجد وعمارة', badge: 'دعاء بعد الأذان', phrase: '«آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ»', sub: 'حلت له شفاعتي يوم القيامة • صحيح البخاري' },
  { title: 'سبحانك اللهم وبحمدك أشهد أن لا إله إلا أنت', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'كفارة المجلس', phrase: '«سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ»', sub: 'غُفر له ما كان في مجلسه ذلك' },
  { title: 'الحمد لله الذي أطعمنا وسقانا وجعلنا مسلمين', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'شكر النعمة', phrase: '«الْحَمْدُ لِلَّهِ الَّذِي كَفَانَا وَأَرْوَانَا، غَيْرَ مَكْفِيٍّ وَلَا مَكْفُورٍ»', sub: 'صحيح البخاري' },
  { title: 'باسمك ربي وضعت جنبي وبك أرفعه', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'أذكار النوم المباركة', phrase: '«بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا»', sub: 'وإن أرسلتها فاحفظها بما تحفظ به عبادك الصالحين' },
  { title: 'الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'ذكر الاستيقاظ من النوم', phrase: '«الحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ»', sub: 'صحيح البخاري' },
  { title: 'لبيك اللهم لبيك لبيك لا شريك لك لبيك', category: 'makkah', categoryName: 'الحرمين والأقصى', badge: 'نداء التلبية في الحرم', phrase: '«لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ»', sub: 'تلبية الحج والعمرة في رحاب مكة المكرمة' },
  { title: 'اللهم زد هذا البيت تشريفاً وتعظيماً وتكريماً ومهابة', category: 'makkah', categoryName: 'الحرمين والأقصى', badge: 'دعاء رؤية الكعبة المشرفة', phrase: '«اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً»', sub: 'مكة المكرمة • بيت الله الحرام' },
  { title: 'خير الدعاء دعاء يوم عرفة', category: 'makkah', categoryName: 'الحرمين والأقصى', badge: 'ذكر عرفات المبارك', phrase: '«لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ»', sub: 'خير ما قلت أنا والنبيون من قبلي' },
  { title: 'اللهم اجعل في قلبي نوراً وفي بصري نوراً', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء النور النبوي', phrase: '«اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا، وَفِي لِسَانِي نُورًا، وَفِي سَمْعِي نُورًا، وَفِي بَصَرِي نُورًا»', sub: 'اللهم أعطني نوراً • متفق عليه' },
  { title: 'اللهم إني أعوذ بك من زوال نعمتك وتحول عافيتك', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'حفظ النعم والعافية', phrase: '«اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ زَوَالِ نِعْمَتِكَ، وَتَحَوُّلِ عَافِيَتِكَ، وَفُجَاءَةِ نِقْمَتِكَ»', sub: 'وجميع سخطك • صحيح مسلم' },
  { title: 'اللهم بارك لنا في رجب وشعبان وبلغنا رمضان', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'أدعية المواسم المباركة', phrase: '«اللَّهُمَّ سَلِّمْنَا لِرَمَضَانَ، وَسَلِّمْ رَمَضَانَ لَنَا، وَتَسَلَّمْهُ مِنَّا مُتَقَبَّلًا»', sub: 'مناجاة استقبال شهر الخيرات' },
  { title: 'ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء إفطار الصائم', phrase: '«ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ»', sub: 'سنن أبي داود' },
  { title: 'اللهم إني أسألك رضاك والجنة', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'مناجاة الأبرار', phrase: '«اللَّهُمَّ إِنِّي أَسْأَلُكَ رِضَاكَ وَالْجَنَّةَ، وَأَعُوذُ بِكَ مِنْ سَخَطِكَ وَالنَّارِ»', sub: 'دعاء جامع للنجاة والفوز' },
  { title: 'اللهم استرنا فوق الأرض وتحت الأرض ويوم العرض عليك', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء الستر الجميل', phrase: '«اللَّهُمَّ اسْتُرْنَا فَوْقَ الأَرْضِ، وَتَحْتَ الأَرْضِ، وَيَوْمَ العَرْضِ عَلَيْكَ»', sub: 'أدعية السكينة والرجاء' },
  { title: 'اللهم ارزقنا القناعة وحب المساكين وحسن الخاتمة', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء الصالحين', phrase: '«اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ، وَخَيْرَ عَمَلِي خَوَاتِيمَهُ، وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ»', sub: 'مناجاة القلوب الخاشعة' },
  { title: 'اللهم اشف مرضانا ومرضى المسلمين شفاء لا يغادر سقماً', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'دعاء الشفاء التام', phrase: '«أَذْهِبِ البَاسَ رَبَّ النَّاسِ، اشْفِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ»', sub: 'شفاءً لا يغادر سقماً • متفق عليه' },
  { title: 'اللهم اغفر لموتانا وموتى المسلمين وارحمهم', category: 'phrases', categoryName: 'عبارات إسلامية', badge: 'الوفاء للراحلين', phrase: '«اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ»', sub: 'صحيح مسلم' },
  { title: 'إن الله لا يضيع أجر المحسنين', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'وعد الله للمحسنين', phrase: '﴿ إِنَّهُ مَنْ يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ ﴾', sub: 'سورة يوسف • الآية ٩٠' },
  { title: 'والله يعلم وأنتم لا تعلمون', category: 'quran', categoryName: 'القرآن والأذكار', badge: 'حكمة أقدار الله', phrase: '﴿ وَعَسَىٰ أَنْ تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَكُمْ وَاللَّهُ يَعْلَمُ وَأَنْتُمْ لَا تَعْلَمُونَ ﴾', sub: 'سورة البقرة • الآية ٢١٦' },
];

export const ISLAMIC_WALLPAPERS: IslamicWallpaper[] = [
  // First 40: Mosque, Holy Sites & Nature Photography (Online on-demand + Local HD with phrase overlays)
  ...ONLINE_MOSQUE_WALLPAPER_SOURCES.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    categoryName: item.categoryName,
    url: item.onlineUrl,
    thumbUrl: item.onlineUrl,
    fallbackUrl: item.fallbackImg,
    islamicPhrase: item.phrase,
    phraseSubtext: item.sub,
    resolution: '1080×1920 Full HD',
    description: `${item.title} — خلفية إسلامية عالية الدقة مع إمكانية المشاركة والتنزيل والتعيين المباشر لشاشة الهاتف.`,
    likesCount: item.likes,
    isOnlineOnDemand: item.onlineUrl.startsWith('http'),
    isBuiltInOffline: !item.onlineUrl.startsWith('http'),
    tags: [item.categoryName, 'مساجد', 'خلفيات إسلامية', item.title],
  })),

  // Next 80: Rich Islamic Calligraphy, Quranic Verses & Supplication Wallpapers (Total = 120 Wallpapers!)
  ...CURATED_PHRASE_ITEMS.map((item, idx) => {
    const theme = COLOR_THEMES[idx % COLOR_THEMES.length];
    const svgDataUrl = createIslamicPhraseWallpaperSvg({
      bgStart: theme.bgStart,
      bgMid: theme.bgMid,
      bgEnd: theme.bgEnd,
      accent: theme.accent,
      secondaryAccent: theme.secondaryAccent,
      badgeText: item.badge,
      mainPhrase: item.phrase,
      subPhrase: item.sub,
      ornamentType: theme.ornament,
    });

    return {
      id: `phrase-wall-${idx + 1}`,
      title: item.title,
      category: item.category,
      categoryName: item.categoryName,
      url: svgDataUrl,
      thumbUrl: svgDataUrl,
      islamicPhrase: item.phrase,
      phraseSubtext: item.sub,
      resolution: '1080×1920 Full HD',
      description: `خلفية «${item.title}» بتصميم إسلامي مزخرف بدقة عالية (1080×1920) جاهزة للمشاركة والتنزيل والتعيين كخلفية للهاتف.`,
      likesCount: 180 + ((idx * 23) % 340),
      isOnlineOnDemand: false,
      isBuiltInOffline: idx < 5,
      tags: [item.categoryName, item.badge, item.title],
    };
  }),
];
