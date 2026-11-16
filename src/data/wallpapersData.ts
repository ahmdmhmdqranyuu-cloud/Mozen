export interface IslamicWallpaper {
  id: string;
  title: string;
  category: 'mosques' | 'makkah' | 'nature';
  categoryName: string;
  url: string;
  thumbUrl: string;
  resolution: string;
  description: string;
  islamicPhrase?: string;
  phraseSubtext?: string;
  likesCount: number;
  tags: string[];
}

export interface SavedWallpaperRecord {
  id: string;
  title: string;
  categoryName: string;
  url: string;
  thumbUrl: string;
  islamicPhrase?: string;
  phraseSubtext?: string;
  savedAtMs: number;
}

const FAV_WALLPAPERS_KEY = 'moazen_favorite_wallpapers_v1';
const SAVED_WALLPAPERS_KEY = 'moazen_saved_wallpapers_v1';

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

export function getSavedWallpaperRecords(): SavedWallpaperRecord[] {
  try {
    const raw = localStorage.getItem(SAVED_WALLPAPERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSavedWallpaperRecord(w: IslamicWallpaper): SavedWallpaperRecord[] {
  const existing = getSavedWallpaperRecords().filter((item) => item.id !== w.id);
  const record: SavedWallpaperRecord = {
    id: w.id,
    title: w.title,
    categoryName: w.categoryName,
    url: w.url,
    thumbUrl: w.thumbUrl,
    islamicPhrase: w.islamicPhrase,
    phraseSubtext: w.phraseSubtext,
    savedAtMs: Date.now(),
  };
  const next = [record, ...existing];
  try {
    localStorage.setItem(SAVED_WALLPAPERS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function removeSavedWallpaperRecord(id: string): SavedWallpaperRecord[] {
  const next = getSavedWallpaperRecords().filter((item) => item.id !== id);
  try {
    localStorage.setItem(SAVED_WALLPAPERS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

function pexelsWallpaper(params: {
  id: string;
  pexelsId: string;
  title: string;
  category: 'mosques' | 'makkah' | 'nature';
  categoryName: string;
  phrase: string;
  sub: string;
  likes: number;
}): IslamicWallpaper {
  return {
    id: params.id,
    title: params.title,
    category: params.category,
    categoryName: params.categoryName,
    url: `https://images.pexels.com/photos/${params.pexelsId}/pexels-photo-${params.pexelsId}.jpeg?auto=compress&cs=tinysrgb&w=1080`,
    thumbUrl: `https://images.pexels.com/photos/${params.pexelsId}/pexels-photo-${params.pexelsId}.jpeg?auto=compress&cs=tinysrgb&w=600`,
    resolution: '1080×1920 Full HD',
    description: `${params.title} — خلفية إسلامية عالية الدقة تُعرض وتُحمَّل عبر الإنترنت عند الطلب دون زيادة حجم التطبيق.`,
    islamicPhrase: params.phrase,
    phraseSubtext: params.sub,
    likesCount: params.likes,
    tags: [params.categoryName, params.title, params.phrase],
  };
}

function wikimediaWallpaper(params: {
  id: string;
  imageUrl: string;
  title: string;
  category: 'mosques' | 'makkah' | 'nature';
  categoryName: string;
  phrase: string;
  sub: string;
  likes: number;
}): IslamicWallpaper {
  return {
    id: params.id,
    title: params.title,
    category: params.category,
    categoryName: params.categoryName,
    url: params.imageUrl,
    thumbUrl: params.imageUrl,
    resolution: 'HD Online',
    description: params.phrase,
    islamicPhrase: params.phrase,
    phraseSubtext: params.sub,
    likesCount: params.likes,
    tags: [params.categoryName, params.phrase, params.sub],
  };
}

/**
 * 100% Online On-Demand Islamic Wallpapers (HTTPS URLs only; zero bundled image bloat in app package)
 */
export const ISLAMIC_WALLPAPERS: IslamicWallpaper[] = [
  // الحرمين والأقصى
  pexelsWallpaper({
    id: 'wp_makkah_1',
    pexelsId: '2291004',
    title: 'المسجد الحرام والكعبة المشرفة في ليلة روحانية',
    category: 'makkah',
    categoryName: 'الحرمين والأقصى',
    phrase: '﴿ إِنَّ أَوَّلَ بَيْتٍ وُضِعَ لِلنَّاسِ لَلَّذِي بِبَكَّةَ مُبَارَكًا وَهُدًى لِلْعَالَمِينَ ﴾',
    sub: 'سورة آل عمران • الآية ٩٦',
    likes: 482,
  }),
  pexelsWallpaper({
    id: 'wp_madinah_1',
    pexelsId: '18274181',
    title: 'المسجد النبوي الشريف والقبة الخضراء المباركة',
    category: 'makkah',
    categoryName: 'الحرمين والأقصى',
    phrase: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ ﷺ',
    sub: 'طيبة الطيبة • المدينة المنورة',
    likes: 519,
  }),
  pexelsWallpaper({
    id: 'wp_quba_1',
    pexelsId: '2087391',
    title: 'مسجد قباء بالمدينة المنورة (أول مسجد أسس على التقوى)',
    category: 'makkah',
    categoryName: 'الحرمين والأقصى',
    phrase: '﴿ لَمَسْجِدٌ أُسِّسَ عَلَى التَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ أَحَقُّ أَنْ تَقُومَ فِيهِ ﴾',
    sub: 'سورة التوبة • الآية ١٠٨',
    likes: 445,
  }),
  pexelsWallpaper({
    id: 'wp_madinah_2',
    pexelsId: '4346403',
    title: 'الروضة الشريفة وأعمدة المسجد النبوي',
    category: 'makkah',
    categoryName: 'الحرمين والأقصى',
    phrase: '«مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ»',
    sub: 'حديث شريف متفق عليه',
    likes: 580,
  }),
  pexelsWallpaper({
    id: 'wp_makkah_2',
    pexelsId: '4346404',
    title: 'مقام إبراهيم عليه السلام والصفا والمروة',
    category: 'makkah',
    categoryName: 'الحرمين والأقصى',
    phrase: '﴿ إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ ﴾',
    sub: 'سورة البقرة • الآية ١٥٨',
    likes: 465,
  }),

  // مساجد وعمارة إسلامية
  pexelsWallpaper({
    id: 'wp_mosque_1',
    pexelsId: '3727255',
    title: 'مسجد الشيخ زايد الكبير وانعكاس القباب البيضاء',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا ﴾',
    sub: 'سورة الجن • الآية ١٨',
    likes: 289,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_2',
    pexelsId: '1537086',
    title: 'الأزهر الشريف ومآذن القاهرة الفاطمية',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنْكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ ﴾',
    sub: 'سورة المجادلة • الآية ١١',
    likes: 315,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_3',
    pexelsId: '2404046',
    title: 'مسجد الحسن الثاني على ضفاف المحيط الأطلسي',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَهُوَ الَّذِي سَخَّرَ الْبَحْرَ لِتَأْكُلُوا مِنْهُ لَحْمًا طَرِيًّا ﴾',
    sub: 'سورة النحل • الآية ١٤',
    likes: 267,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_4',
    pexelsId: '3214958',
    title: 'مسجد محمد علي باشا بقلعة صلاح الدين بالقاهرة',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ ادْخُلُوا مِصْرَ إِنْ شَاءَ اللَّهُ آمِنِينَ ﴾',
    sub: 'سورة يوسف • الآية ٩٩',
    likes: 412,
  }),
  wikimediaWallpaper({
    id: 'wp_mosque_5',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Jerusalem-2013-Temple_Mount-Dome_of_the_Rock-Detail_01.jpg/960px-Jerusalem-2013-Temple_Mount-Dome_of_the_Rock-Detail_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'قبة الصخرة المشرفة والمسجد الأقصى المبارك',
    category: 'makkah',
    categoryName: 'الحرمين والأقصى',
    phrase: '﴿ سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى ﴾',
    sub: 'سورة الإسراء • الآية ١',
    likes: 512,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_6',
    pexelsId: '460680',
    title: 'الجامع الأموي الكبير بدمشق الفيحاء',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ ﴾',
    sub: 'سورة التوبة • الآية ١٨',
    likes: 376,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_7',
    pexelsId: '1619569',
    title: 'محراب المسجد الأندلسي بقرطبة',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ فَنَادَتْهُ الْمَلَائِكَةُ وَهُوَ قَائِمٌ يُصَلِّي فِي الْمِحْرَابِ ﴾',
    sub: 'سورة آل عمران • الآية ٣٩',
    likes: 295,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_8',
    pexelsId: '3689859',
    title: 'مسجد السلطان قابوس الأكبر بمسقط',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَاقْصِدْ فِي مَشْيِكَ وَاغْضُضْ مِنْ صَوْتِكَ ﴾',
    sub: 'سورة لقمان • الآية ١٩',
    likes: 260,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_9',
    pexelsId: '2832077',
    title: 'مسجد الملك فيصل في إسلام آباد',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ ﴾',
    sub: 'سورة البقرة • الآية ١٢٧',
    likes: 248,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_10',
    pexelsId: '2233416',
    title: 'مسجد الكريستال المضيء على الماء',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ نُورٌ عَلَىٰ نُورٍ يَهْدِي اللَّهُ لِنُورِهِ مَنْ يَشَاءُ ﴾',
    sub: 'سورة النور • الآية ٣٥',
    likes: 318,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_11',
    pexelsId: '1549326',
    title: 'الجامع الوردي على البحيرة وقت الغروب',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ غُرُوبِهَا ﴾',
    sub: 'سورة طه • الآية ١٣٠',
    likes: 274,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_12',
    pexelsId: '3290068',
    title: 'جامع السلطان حسن التاريخي بالقاهرة',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ ﴾',
    sub: 'سورة البقرة • الآية ٢٣٨',
    likes: 355,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_13',
    pexelsId: '2048865',
    title: 'مسجد السليمانية في إسطنبول وقت الغروب',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِنَ اللَّيْلِ ﴾',
    sub: 'سورة هود • الآية ١١٤',
    likes: 331,
  }),
  pexelsWallpaper({
    id: 'wp_mosque_14',
    pexelsId: '2104882',
    title: 'مسجد الفتاح العليم والعمارة الإسلامية الحديثة',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ رَبَّنَا افْتَحْ بَيْنَنَا وَبَيْنَ قَوْمِنَا بِالْحَقِّ وَأَنْتَ خَيْرُ الْفَاتِحِينَ ﴾',
    sub: 'سورة الأعراف • الآية ٨٩',
    likes: 290,
  }),

  // الطبيعة والتأمل
  pexelsWallpaper({
    id: 'wp_nature_1',
    pexelsId: '1287145',
    title: 'شروق الفجر الصادق فوق الجبال',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ وَالصُّبْحِ إِذَا تَنَفَّسَ ﴾',
    sub: 'سورة التكوير • الآية ١٨',
    likes: 388,
  }),
  pexelsWallpaper({
    id: 'wp_nature_2',
    pexelsId: '1252890',
    title: 'تأمل السماء والنجوم في جوف الليل',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ رَبَّنَا مَا خَلَقْتَ هَٰذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ ﴾',
    sub: 'سورة آل عمران • الآية ١٩١',
    likes: 425,
  }),
  pexelsWallpaper({
    id: 'wp_nature_3',
    pexelsId: '417074',
    title: 'الجبال الرواسي وعظمة الخالق جل جلاله',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ وَإِلَى الْجِبَالِ كَيْفَ نُصِبَتْ ﴾',
    sub: 'سورة الغاشية • الآية ١٩',
    likes: 349,
  }),
  pexelsWallpaper({
    id: 'wp_nature_4',
    pexelsId: '1032650',
    title: 'أمواج البحر الهادئة عند الغروب الذهبي',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ قُلْ لَوْ كَانَ الْبَحْرُ مِدَادًا لِكَلِمَاتِ رَبِّي لَنَفِدَ الْبَحْرُ ﴾',
    sub: 'سورة الكهف • الآية ١٠٩',
    likes: 372,
  }),
  pexelsWallpaper({
    id: 'wp_nature_5',
    pexelsId: '15286',
    title: 'نزول الغيث والمطر وإحياء الأرض بعد موتها',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ وَهُوَ الَّذِي يُنَزِّلُ الْغَيْثَ مِنْ بَعْدِ مَا قَنَطُوا وَيَنْشُرُ رَحْمَتَهُ ﴾',
    sub: 'سورة الشورى • الآية ٢٨',
    likes: 495,
  }),
  pexelsWallpaper({
    id: 'wp_nature_6',
    pexelsId: '273935',
    title: 'واحة النخيل والعيون الجارية في الصحراء',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ وَالنَّخْلَ بَاسِقَاتٍ لَهَا طَلْعٌ نَضِيدٌ • رِزْقًا لِلْعِبَادِ ﴾',
    sub: 'سورة ق • الآيتان ١٠-١١',
    likes: 312,
  }),
  pexelsWallpaper({
    id: 'wp_nature_7',
    pexelsId: '813269',
    title: 'الهلال المنير في سماء الليل الصافية',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ يَسْأَلُونَكَ عَنِ الْأَهِلَّةِ قُلْ هِيَ مَوَاقِيتُ لِلنَّاسِ وَالْحَجِّ ﴾',
    sub: 'سورة البقرة • الآية ١٨٩',
    likes: 418,
  }),
  pexelsWallpaper({
    id: 'wp_nature_8',
    pexelsId: '3225517',
    title: 'الأنهار والجنات الخضراء وتسبيح الكائنات',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ وَإِنْ مِنْ شَيْءٍ إِلَّا يُسَبِّحُ بِحَمْدِهِ ﴾',
    sub: 'سورة الإسراء • الآية ٤٤',
    likes: 364,
  }),
  pexelsWallpaper({
    id: 'wp_nature_9',
    pexelsId: '1001435',
    title: 'كثبان الرمال الذهبية وقت الأصيل',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ أَفَلَا يَنْظُرُونَ إِلَى الْإِبِلِ كَيْفَ خُلِقَتْ ﴾',
    sub: 'سورة الغاشية • الآية ١٧',
    likes: 295,
  }),
  pexelsWallpaper({
    id: 'wp_nature_10',
    pexelsId: '189349',
    title: 'شروق الشمس وتجدد الأمل بالله',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ وَالشَّمْسِ وَضُحَاهَا • وَالْقَمَرِ إِذَا تَلَاهَا ﴾',
    sub: 'سورة الشمس • الآيتان ١-٢',
    likes: 344,
  }),
  pexelsWallpaper({
    id: 'wp_nature_11',
    pexelsId: '210186',
    title: 'شلالات المياه العذبة وآيات الإبداع الإلهي',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ أَفَلَا يُؤْمِنُونَ ﴾',
    sub: 'سورة الأنبياء • الآية ٣٠',
    likes: 407,
  }),
  pexelsWallpaper({
    id: 'wp_nature_12',
    pexelsId: '1072179',
    title: 'الأشجار المباركة ونور الله في الكون',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ صُنْعَ اللَّهِ الَّذِي أَتْقَنَ كُلَّ شَيْءٍ ﴾',
    sub: 'سورة النمل • الآية ٨٨',
    likes: 390,
  }),
  pexelsWallpaper({
    id: 'wp_nature_13',
    pexelsId: '147411',
    title: 'البحيرة الساكنة وانعكاس السماء وقت السحر',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ ﴾',
    sub: 'سورة الذاريات • الآية ١٨',
    likes: 332,
  }),
  pexelsWallpaper({
    id: 'wp_nature_14',
    pexelsId: '462118',
    title: 'أزهار الربيع المتفتحة وبديع خلق الرحمن',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ فَانْظُرْ إِلَىٰ آثَارِ رَحْمَتِ اللَّهِ كَيْفَ يُحْيِي الْأَرْضَ بَعْدَ مَوْتِهَا ﴾',
    sub: 'سورة الروم • الآية ٥٠',
    likes: 356,
  }),
  pexelsWallpaper({
    id: 'wp_nature_15',
    pexelsId: '38136',
    title: 'الطريق بين الأشجار ودعاء الهداية الصراط المستقيم',
    category: 'nature',
    categoryName: 'الطبيعة والتأمل',
    phrase: '﴿ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴾',
    sub: 'سورة الفاتحة • الآية ٦',
    likes: 461,
  }),

  // خلفيات إسلامية إضافية موثقة عبر الإنترنت
  wikimediaWallpaper({
    id: 'wp_wm_1',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Supplicating_Pilgrim_at_Masjid_Al_Haram._Mecca%2C_Saudi_Arabia.jpg/960px-Supplicating_Pilgrim_at_Masjid_Al_Haram._Mecca%2C_Saudi_Arabia.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'الدعاء والخشوع في المسجد الحرام',
    category: 'makkah',
    categoryName: 'الحرمين والأقصى',
    phrase: '﴿ وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ ﴾',
    sub: 'سورة البقرة • الآية ١٨٦',
    likes: 615,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_2',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Al-Aqsa_Mosque_Summer_Pulpit_%28Minbar_al-Sayf%29_on_the_Temple_Mount_%28Jerusalem%2C_2008%29.jpg/960px-Al-Aqsa_Mosque_Summer_Pulpit_%28Minbar_al-Sayf%29_on_the_Temple_Mount_%28Jerusalem%2C_2008%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'منبر الصيف في رحاب المسجد الأقصى',
    category: 'makkah',
    categoryName: 'الحرمين والأقصى',
    phrase: '﴿ رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا ﴾',
    sub: 'سورة البقرة • الآية ٢٥٠',
    likes: 540,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_3',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Sheikh_Zayed_Grand_Mosque_in_Abu_Dhabi_-_panoramio.jpg/960px-Sheikh_Zayed_Grand_Mosque_in_Abu_Dhabi_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'رحاب المسجد الكبير في ضياء النهار',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ فِي بُيُوتٍ أَذِنَ اللَّهُ أَنْ تُرْفَعَ وَيُذْكَرَ فِيهَا اسْمُهُ ﴾',
    sub: 'سورة النور • الآية ٣٦',
    likes: 438,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_4',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Sultan_Qaboos_Grand_Mosque_Muscat_06.JPG/960px-Sultan_Qaboos_Grand_Mosque_Muscat_06.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'عمارة إسلامية وهدوء الساحات',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾',
    sub: 'سورة الرعد • الآية ٢٨',
    likes: 392,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_5',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Sunshine_on_mosque_Hassan_II_in_Casablanca%2C_Morocco_-_Flickr_-_Milamber%27s_portfolio.jpg/960px-Sunshine_on_mosque_Hassan_II_in_Casablanca%2C_Morocco_-_Flickr_-_Milamber%27s_portfolio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'إشراقة الشمس على المئذنة الساحلية',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ﴾',
    sub: 'سورة النور • الآية ٣٥',
    likes: 414,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_6',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Abdullah_fr%C3%A8res_-_Sultan_Ahmet_camii%2C_Istanbul.jpg/960px-Abdullah_fr%C3%A8res_-_Sultan_Ahmet_camii%2C_Istanbul.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'مآذن مسجد السلطان أحمد التاريخية',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ وَسَبِّحْ بِحَمْدِهِ ﴾',
    sub: 'سورة الفرقان • الآية ٥٨',
    likes: 377,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_7',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Badshahi_Mosque_%28Lahore%29.jpg/960px-Badshahi_Mosque_%28Lahore%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'المسجد الشاهي وقباب الحضارة الإسلامية',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ قَدْ أَفْلَحَ الْمُؤْمِنُونَ • الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ ﴾',
    sub: 'سورة المؤمنون • الآيتان ١-٢',
    likes: 365,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_8',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Putrajaya_Malaysia_Putra-Mosque-06.jpg/960px-Putrajaya_Malaysia_Putra-Mosque-06.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'قبة المسجد المضيئة على الضفاف',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ ﴾',
    sub: 'سورة البقرة • الآية ١٥٢',
    likes: 389,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_9',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Cairo_-_Islamic_district_-_Al_Azhar_Mosque_and_University.JPG/960px-Cairo_-_Islamic_district_-_Al_Azhar_Mosque_and_University.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'صحن ومآذن الجامع الأزهر الشريف',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَقُلْ رَبِّ زِدْنِي عِلْمًا ﴾',
    sub: 'سورة طه • الآية ١١٤',
    likes: 472,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_10',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Fols_362b-363a_of_the_Single-Volume_Qur%27an_attributed_to_Ahmed_Karahisari._The_Nasser_D._Khalili_Collection_of_Islamic_Art%2C_QUR_420.jpg/960px-Fols_362b-363a_of_the_Single-Volume_Qur%27an_attributed_to_Ahmed_Karahisari._The_Nasser_D._Khalili_Collection_of_Islamic_Art%2C_QUR_420.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'مصحف شريف مخطوط بالذهب',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾',
    sub: 'سورة الإسراء • الآية ٩',
    likes: 528,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_11',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Ali_Mujtaba_WLM2015_FAISAL_MOSQUE_m_10.jpg/960px-Ali_Mujtaba_WLM2015_FAISAL_MOSQUE_m_10.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'المآذن المضيئة عند الغسق',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَسَبِّحْ بِحَمْدِ رَبِّكَ حِينَ تَقُومُ • وَمِنَ اللَّيْلِ فَسَبِّحْهُ ﴾',
    sub: 'سورة الطور • الآيتان ٤٨-٤٩',
    likes: 342,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_12',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Umayyad_Mosque%2C_Damascus.jpg/960px-Umayyad_Mosque%2C_Damascus.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'بلاط ومآذن الجامع الأموي',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَلَذِكْرُ اللَّهِ أَكْبَرُ وَاللَّهُ يَعْلَمُ مَا تَصْنَعُونَ ﴾',
    sub: 'سورة العنكبوت • الآية ٤٥',
    likes: 430,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_13',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Cordoba_Cathedral_2024_-_Arches.jpg/960px-Cordoba_Cathedral_2024_-_Arches.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'أقواس وعقود مسجد قرطبة الأندلسي',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ ﴾',
    sub: 'سورة يس • الآية ٥٨',
    likes: 398,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_14',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Kazan_Kremlin_Qolsharif_Mosque_08-2016_img2.jpg/960px-Kazan_Kremlin_Qolsharif_Mosque_08-2016_img2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'قباب بيضاء ومآذن شامخة',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ﴾',
    sub: 'سورة الأحزاب • الآية ٥٦',
    likes: 356,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_15',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Meuseujid_Raya_Bayturrahman.JPG/960px-Meuseujid_Raya_Bayturrahman.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'مسجد بيت الرحمن المبارك',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَارْكَعُوا مَعَ الرَّاكِعِينَ ﴾',
    sub: 'سورة البقرة • الآية ٤٣',
    likes: 325,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_16',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7e/Decorated_walls_of_Registan_Square_in_Samarkand%2C_Uzbekistan_-_07.jpg/960px-Decorated_walls_of_Registan_Square_in_Samarkand%2C_Uzbekistan_-_07.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'الخط العربي والزخرفة الإسلامية',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ تَبَارَكَ اسْمُ رَبِّكَ ذِي الْجَلَالِ وَالْإِكْرَامِ ﴾',
    sub: 'سورة الرحمن • الآية ٧٨',
    likes: 384,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_17',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Mosque-Madrassa_of_Sultan_Hassan.jpg/960px-Mosque-Madrassa_of_Sultan_Hassan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'مدرسة ومسجد السلطان حسن',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَأَطِيعُوا الرَّسُولَ لَعَلَّكُمْ تُرْحَمُونَ ﴾',
    sub: 'سورة النور • الآية ٥٦',
    likes: 409,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_18',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Karoleen_Eckerbert_-_Al-Hakim_Mosque_Cairo_Egypt_2012_04.JPG/960px-Karoleen_Eckerbert_-_Al-Hakim_Mosque_Cairo_Egypt_2012_04.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'أروقة وصحن المسجد العتيق',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي ﴾',
    sub: 'سورة إبراهيم • الآية ٤٠',
    likes: 371,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_19',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Kutubiyya_Mosque%2C_Marrakesh%2C_Morocco%2C_20250124_1834_7027.jpg/960px-Kutubiyya_Mosque%2C_Marrakesh%2C_Morocco%2C_20250124_1834_7027.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'صومعة الكتبية وأضواء المغرب',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ ﴾',
    sub: 'سورة الأنعام • الآية ١٦٢',
    likes: 446,
  }),
  wikimediaWallpaper({
    id: 'wp_wm_20',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Illuminated_Quran_manuscript_Cifte_Minareli_Medrese_Erzurum_2025.jpeg/960px-Illuminated_Quran_manuscript_Cifte_Minareli_Medrese_Erzurum_2025.jpeg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    title: 'مصحف مزخرف بالخط الإسلامي البديع',
    category: 'mosques',
    categoryName: 'مساجد وعمارة',
    phrase: '﴿ وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِلْمُؤْمِنِينَ ﴾',
    sub: 'سورة الإسراء • الآية ٨٢',
    likes: 503,
  }),
];
