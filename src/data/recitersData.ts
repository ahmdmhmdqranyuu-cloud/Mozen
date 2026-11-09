export interface Reciter {
  id: string;
  name: string;
  arabicBio: string;
  riwaya: string;
  serverUrl: string; // Primary mp3quran.net server
  fallbackServerUrls: string[]; // Backup CDN servers
  islamicNetworkEdition: string; // e.g. ar.alafasy
  photoUrl: string;
  recommendedSurahs: number[];
}

export const RECITERS_LIST: Reciter[] = [
  {
    id: 'alafasy',
    name: 'مشاري راشد العفاسي',
    arabicBio: 'قارئ الحرم المكي وإمام مسجد الدولة الكبير بالكويت، عُرف بعذوبة صوته وإتقانه.',
    riwaya: 'حفص عن عاصم',
    serverUrl: 'https://server8.mp3quran.net/afs/',
    fallbackServerUrls: [
      'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/',
      'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/',
    ],
    islamicNetworkEdition: 'ar.alafasy',
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
    recommendedSurahs: [1, 18, 36, 55, 67, 112, 113, 114],
  },
  {
    id: 'abdulbasit',
    name: 'عبد الباسط عبد الصمد (مرتل)',
    arabicBio: 'صوت مكة وقيثارة السماء، أحد أشهر قراء القرآن الكريم في العالم الإسلامي عبر التاريخ.',
    riwaya: 'حفص عن عاصم (مرتل)',
    serverUrl: 'https://server7.mp3quran.net/basit/',
    fallbackServerUrls: [
      'https://download.quranicaudio.com/quran/abdul_basit_murattal/',
      'https://cdn.islamic.network/quran/audio-surah/128/ar.abdulbasitmurattal/',
    ],
    islamicNetworkEdition: 'ar.abdulbasitmurattal',
    photoUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=200&q=80',
    recommendedSurahs: [1, 12, 19, 55, 56, 89],
  },
  {
    id: 'minshawi',
    name: 'محمد صديق المنشاوي',
    arabicBio: 'صاحب الصوت الباكي الخاشع، رائد مدرسة الترتيل والتأثير الروحي العميق.',
    riwaya: 'حفص عن عاصم',
    serverUrl: 'https://server10.mp3quran.net/minsh/',
    fallbackServerUrls: [
      'https://download.quranicaudio.com/quran/muhammad_siddeeq_al-minshaawee/',
      'https://cdn.islamic.network/quran/audio-surah/128/ar.minshawi/',
    ],
    islamicNetworkEdition: 'ar.minshawi',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    recommendedSurahs: [1, 20, 36, 50, 78],
  },
  {
    id: 'hussary',
    name: 'محمود خليل الحصري',
    arabicBio: 'شيخ عموم المقارئ المصرية، المرجع الأول في أحكام التجويد ومخارج الحروف بدقة متناهية.',
    riwaya: 'حفص عن عاصم',
    serverUrl: 'https://server13.mp3quran.net/husr/',
    fallbackServerUrls: [
      'https://download.quranicaudio.com/quran/mahmood_khaleel_al-husaree/',
      'https://cdn.islamic.network/quran/audio-surah/128/ar.husary/',
    ],
    islamicNetworkEdition: 'ar.husary',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    recommendedSurahs: [1, 2, 3, 18, 67],
  },
  {
    id: 'maher',
    name: 'ماهر المعيقلي',
    arabicBio: 'إمام وخطيب المسجد الحرام بمكة المكرمة، يتميز بترتيله الشجي المؤثر.',
    riwaya: 'حفص عن عاصم',
    serverUrl: 'https://server12.mp3quran.net/maher/',
    fallbackServerUrls: [
      'https://download.quranicaudio.com/quran/maher_256/',
      'https://cdn.islamic.network/quran/audio-surah/128/ar.mahermuaiqly/',
    ],
    islamicNetworkEdition: 'ar.mahermuaiqly',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    recommendedSurahs: [1, 18, 32, 67, 75],
  },
  {
    id: 'shuraym',
    name: 'سعود الشريم',
    arabicBio: 'إمام المسجد الحرام السابق، صاحب التلاوة السريعة العذبة والقراءة النجدية المتقنة.',
    riwaya: 'حفص عن عاصم',
    serverUrl: 'https://server7.mp3quran.net/shur/',
    fallbackServerUrls: [
      'https://download.quranicaudio.com/quran/sa3ood_al-shuraym/',
      'https://cdn.islamic.network/quran/audio-surah/128/ar.saoodshuraym/',
    ],
    islamicNetworkEdition: 'ar.saoodshuraym',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    recommendedSurahs: [1, 18, 55, 67],
  },
  {
    id: 'ghamdi',
    name: 'سعد الغامدي',
    arabicBio: 'قارئ متميز بصوت شجي هادئ، تخرج على يديه أجيال استمعت لتلاواته في أنحاء العالم.',
    riwaya: 'حفص عن عاصم',
    serverUrl: 'https://server7.mp3quran.net/s_gmd/',
    fallbackServerUrls: [
      'https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/complete/',
      'https://server8.mp3quran.net/afs/',
    ],
    islamicNetworkEdition: 'ar.alafasy',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    recommendedSurahs: [1, 36, 55, 67, 114],
  },
  {
    id: 'qatami',
    name: 'ناصر القطامي',
    arabicBio: 'إمام جامع عبد الله بن ناصر المهيني بالرياض، اشتهر بقراءاته التراويحية المبكية.',
    riwaya: 'حفص عن عاصم',
    serverUrl: 'https://server6.mp3quran.net/qtm/',
    fallbackServerUrls: [
      'https://download.quranicaudio.com/quran/nasser_bin_ali_alqatami/',
      'https://server8.mp3quran.net/afs/',
    ],
    islamicNetworkEdition: 'ar.alafasy',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    recommendedSurahs: [1, 19, 50, 79],
  },
  {
    id: 'dossari',
    name: 'ياسر الدوسري',
    arabicBio: 'إمام وخطيب المسجد الحرام بمكة المكرمة، له نبرة جبلية بديعة تأسر القلوب خشوعاً.',
    riwaya: 'حفص عن عاصم',
    serverUrl: 'https://server11.mp3quran.net/yasser/',
    fallbackServerUrls: [
      'https://download.quranicaudio.com/quran/yasser_ad-dussary/',
      'https://server8.mp3quran.net/afs/',
    ],
    islamicNetworkEdition: 'ar.alafasy',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    recommendedSurahs: [1, 12, 18, 55, 67],
  }
];

export interface SurahAudioItem {
  number: number;
  name: string;
  englishName: string;
  versesCount: number;
  revelationType: 'مكية' | 'مدنية';
  pageStart: number;
}

export const SURAH_LIST: SurahAudioItem[] = [
  { number: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', versesCount: 7, revelationType: 'مكية', pageStart: 1 },
  { number: 2, name: 'البقرة', englishName: 'Al-Baqarah', versesCount: 286, revelationType: 'مدنية', pageStart: 2 },
  { number: 3, name: 'آل عمران', englishName: 'Ali \'Imran', versesCount: 200, revelationType: 'مدنية', pageStart: 50 },
  { number: 4, name: 'النساء', englishName: 'An-Nisa', versesCount: 176, revelationType: 'مدنية', pageStart: 77 },
  { number: 5, name: 'المائدة', englishName: 'Al-Ma\'idah', versesCount: 120, revelationType: 'مدنية', pageStart: 106 },
  { number: 6, name: 'الأنعام', englishName: 'Al-An\'am', versesCount: 165, revelationType: 'مكية', pageStart: 128 },
  { number: 7, name: 'الأعراف', englishName: 'Al-A\'raf', versesCount: 206, revelationType: 'مكية', pageStart: 151 },
  { number: 8, name: 'الأنفال', englishName: 'Al-Anfal', versesCount: 75, revelationType: 'مدنية', pageStart: 177 },
  { number: 9, name: 'التوبة', englishName: 'At-Tawbah', versesCount: 129, revelationType: 'مدنية', pageStart: 187 },
  { number: 10, name: 'يونس', englishName: 'Yunus', versesCount: 109, revelationType: 'مكية', pageStart: 208 },
  { number: 11, name: 'هود', englishName: 'Hud', versesCount: 123, revelationType: 'مكية', pageStart: 221 },
  { number: 12, name: 'يوسف', englishName: 'Yusuf', versesCount: 111, revelationType: 'مكية', pageStart: 235 },
  { number: 13, name: 'الرعد', englishName: 'Ar-Ra\'d', versesCount: 43, revelationType: 'مدنية', pageStart: 249 },
  { number: 14, name: 'إبراهيم', englishName: 'Ibrahim', versesCount: 52, revelationType: 'مكية', pageStart: 255 },
  { number: 15, name: 'الحجر', englishName: 'Al-Hijr', versesCount: 99, revelationType: 'مكية', pageStart: 262 },
  { number: 16, name: 'النحل', englishName: 'An-Nahl', versesCount: 128, revelationType: 'مكية', pageStart: 267 },
  { number: 17, name: 'الإسراء', englishName: 'Al-Isra', versesCount: 111, revelationType: 'مكية', pageStart: 282 },
  { number: 18, name: 'الكهف', englishName: 'Al-Kahf', versesCount: 110, revelationType: 'مكية', pageStart: 293 },
  { number: 19, name: 'مريم', englishName: 'Maryam', versesCount: 98, revelationType: 'مكية', pageStart: 305 },
  { number: 20, name: 'طه', englishName: 'Ta-Ha', versesCount: 135, revelationType: 'مكية', pageStart: 312 },
  { number: 21, name: 'الأنبياء', englishName: 'Al-Anbiya', versesCount: 112, revelationType: 'مكية', pageStart: 322 },
  { number: 22, name: 'الحج', englishName: 'Al-Hajj', versesCount: 78, revelationType: 'مدنية', pageStart: 332 },
  { number: 23, name: 'المؤمنون', englishName: 'Al-Mu\'minun', versesCount: 118, revelationType: 'مكية', pageStart: 342 },
  { number: 24, name: 'النور', englishName: 'An-Nur', versesCount: 64, revelationType: 'مدنية', pageStart: 350 },
  { number: 25, name: 'الفرقان', englishName: 'Al-Furqan', versesCount: 77, revelationType: 'مكية', pageStart: 359 },
  { number: 26, name: 'الشعراء', englishName: 'Ash-Shu\'ara', versesCount: 227, revelationType: 'مكية', pageStart: 367 },
  { number: 27, name: 'النمل', englishName: 'An-Naml', versesCount: 93, revelationType: 'مكية', pageStart: 377 },
  { number: 28, name: 'القصص', englishName: 'Al-Qasas', versesCount: 88, revelationType: 'مكية', pageStart: 385 },
  { number: 29, name: 'العنكبوت', englishName: 'Al-\'Ankabut', versesCount: 69, revelationType: 'مكية', pageStart: 396 },
  { number: 30, name: 'الروم', englishName: 'Ar-Rum', versesCount: 60, revelationType: 'مكية', pageStart: 404 },
  { number: 31, name: 'لقمان', englishName: 'Luqman', versesCount: 34, revelationType: 'مكية', pageStart: 411 },
  { number: 32, name: 'السجدة', englishName: 'As-Sajdah', versesCount: 30, revelationType: 'مكية', pageStart: 415 },
  { number: 33, name: 'الأحزاب', englishName: 'Al-Ahzab', versesCount: 73, revelationType: 'مدنية', pageStart: 418 },
  { number: 34, name: 'سبأ', englishName: 'Saba', versesCount: 54, revelationType: 'مكية', pageStart: 428 },
  { number: 35, name: 'فاطر', englishName: 'Fatir', versesCount: 45, revelationType: 'مكية', pageStart: 434 },
  { number: 36, name: 'يس', englishName: 'Ya-Sin', versesCount: 83, revelationType: 'مكية', pageStart: 440 },
  { number: 37, name: 'الصافات', englishName: 'As-Saffat', versesCount: 182, revelationType: 'مكية', pageStart: 446 },
  { number: 38, name: 'ص', englishName: 'Sad', versesCount: 88, revelationType: 'مكية', pageStart: 453 },
  { number: 39, name: 'الزمر', englishName: 'Az-Zumar', versesCount: 75, revelationType: 'مكية', pageStart: 458 },
  { number: 40, name: 'غافر', englishName: 'Ghafir', versesCount: 85, revelationType: 'مكية', pageStart: 467 },
  { number: 41, name: 'فصلت', englishName: 'Fussilat', versesCount: 54, revelationType: 'مكية', pageStart: 477 },
  { number: 42, name: 'الشورى', englishName: 'Ash-Shura', versesCount: 53, revelationType: 'مكية', pageStart: 483 },
  { number: 43, name: 'الزخرف', englishName: 'Az-Zukhruf', versesCount: 89, revelationType: 'مكية', pageStart: 489 },
  { number: 44, name: 'الدخان', englishName: 'Ad-Dukhan', versesCount: 59, revelationType: 'مكية', pageStart: 496 },
  { number: 45, name: 'الجاثية', englishName: 'Al-Jathiyah', versesCount: 37, revelationType: 'مكية', pageStart: 499 },
  { number: 46, name: 'الأحقاف', englishName: 'Al-Ahqaf', versesCount: 35, revelationType: 'مكية', pageStart: 502 },
  { number: 47, name: 'محمد', englishName: 'Muhammad', versesCount: 38, revelationType: 'مدنية', pageStart: 507 },
  { number: 48, name: 'الفتح', englishName: 'Al-Fath', versesCount: 29, revelationType: 'مدنية', pageStart: 511 },
  { number: 49, name: 'الحجرات', englishName: 'Al-Hujurat', versesCount: 18, revelationType: 'مدنية', pageStart: 515 },
  { number: 50, name: 'ق', englishName: 'Qaf', versesCount: 45, revelationType: 'مكية', pageStart: 518 },
  { number: 51, name: 'الذاريات', englishName: 'Adh-Dhariyat', versesCount: 60, revelationType: 'مكية', pageStart: 520 },
  { number: 52, name: 'الطور', englishName: 'At-Tur', versesCount: 49, revelationType: 'مكية', pageStart: 523 },
  { number: 53, name: 'النجم', englishName: 'An-Najm', versesCount: 62, revelationType: 'مكية', pageStart: 526 },
  { number: 54, name: 'القمر', englishName: 'Al-Qamar', versesCount: 55, revelationType: 'مكية', pageStart: 528 },
  { number: 55, name: 'الرحمن', englishName: 'Ar-Rahman', versesCount: 78, revelationType: 'مدنية', pageStart: 531 },
  { number: 56, name: 'الواقعة', englishName: 'Al-Waqi\'ah', versesCount: 96, revelationType: 'مكية', pageStart: 534 },
  { number: 57, name: 'الحديد', englishName: 'Al-Hadid', versesCount: 29, revelationType: 'مدنية', pageStart: 537 },
  { number: 58, name: 'المجادلة', englishName: 'Al-Mujadila', versesCount: 22, revelationType: 'مدنية', pageStart: 542 },
  { number: 59, name: 'الحشر', englishName: 'Al-Hashr', versesCount: 24, revelationType: 'مدنية', pageStart: 545 },
  { number: 60, name: 'الممتحنة', englishName: 'Al-Mumtahanah', versesCount: 13, revelationType: 'مدنية', pageStart: 549 },
  { number: 61, name: 'الصف', englishName: 'As-Saff', versesCount: 14, revelationType: 'مدنية', pageStart: 551 },
  { number: 62, name: 'الجمعة', englishName: 'Al-Jumu\'ah', versesCount: 11, revelationType: 'مدنية', pageStart: 553 },
  { number: 63, name: 'المنافقون', englishName: 'Al-Munafiqun', versesCount: 11, revelationType: 'مدنية', pageStart: 554 },
  { number: 64, name: 'التغابن', englishName: 'At-Taghabun', versesCount: 18, revelationType: 'مدنية', pageStart: 556 },
  { number: 65, name: 'الطلاق', englishName: 'At-Talaq', versesCount: 12, revelationType: 'مدنية', pageStart: 558 },
  { number: 66, name: 'التحريم', englishName: 'At-Tahrim', versesCount: 12, revelationType: 'مدنية', pageStart: 560 },
  { number: 67, name: 'الملك', englishName: 'Al-Mulk', versesCount: 30, revelationType: 'مكية', pageStart: 562 },
  { number: 68, name: 'القلم', englishName: 'Al-Qalam', versesCount: 52, revelationType: 'مكية', pageStart: 564 },
  { number: 69, name: 'الحاقة', englishName: 'Al-Haqqah', versesCount: 52, revelationType: 'مكية', pageStart: 566 },
  { number: 70, name: 'المعارج', englishName: 'Al-Ma\'arij', versesCount: 44, revelationType: 'مكية', pageStart: 568 },
  { number: 71, name: 'نوح', englishName: 'Nuh', versesCount: 28, revelationType: 'مكية', pageStart: 570 },
  { number: 72, name: 'الجن', englishName: 'Al-Jinn', versesCount: 28, revelationType: 'مكية', pageStart: 572 },
  { number: 73, name: 'المزمل', englishName: 'Al-Muzzammil', versesCount: 20, revelationType: 'مكية', pageStart: 574 },
  { number: 74, name: 'المدثر', englishName: 'Al-Muddaththir', versesCount: 56, revelationType: 'مكية', pageStart: 575 },
  { number: 75, name: 'القيامة', englishName: 'Al-Qiyamah', versesCount: 40, revelationType: 'مكية', pageStart: 577 },
  { number: 76, name: 'الإنسان', englishName: 'Al-Insan', versesCount: 31, revelationType: 'مدنية', pageStart: 578 },
  { number: 77, name: 'المرسلات', englishName: 'Al-Mursalat', versesCount: 50, revelationType: 'مكية', pageStart: 580 },
  { number: 78, name: 'النبأ', englishName: 'An-Naba', versesCount: 40, revelationType: 'مكية', pageStart: 582 },
  { number: 79, name: 'النازعات', englishName: 'An-Nazi\'at', versesCount: 46, revelationType: 'مكية', pageStart: 583 },
  { number: 80, name: 'عبس', englishName: '\'Abasa', versesCount: 42, revelationType: 'مكية', pageStart: 585 },
  { number: 81, name: 'التكوير', englishName: 'At-Takwir', versesCount: 29, revelationType: 'مكية', pageStart: 586 },
  { number: 82, name: 'الانفطار', englishName: 'Al-Infitar', versesCount: 19, revelationType: 'مكية', pageStart: 587 },
  { number: 83, name: 'المطففين', englishName: 'Al-Mutaffifin', versesCount: 36, revelationType: 'مكية', pageStart: 587 },
  { number: 84, name: 'الانشقاق', englishName: 'Al-Inshiqaq', versesCount: 25, revelationType: 'مكية', pageStart: 589 },
  { number: 85, name: 'البروج', englishName: 'Al-Buruj', versesCount: 22, revelationType: 'مكية', pageStart: 590 },
  { number: 86, name: 'الطارق', englishName: 'At-Tariq', versesCount: 17, revelationType: 'مكية', pageStart: 591 },
  { number: 87, name: 'الأعلى', englishName: 'Al-A\'la', versesCount: 19, revelationType: 'مكية', pageStart: 591 },
  { number: 88, name: 'الغاشية', englishName: 'Al-Ghashiyah', versesCount: 26, revelationType: 'مكية', pageStart: 592 },
  { number: 89, name: 'الفجر', englishName: 'Al-Fajr', versesCount: 30, revelationType: 'مكية', pageStart: 593 },
  { number: 90, name: 'البلد', englishName: 'Al-Balad', versesCount: 20, revelationType: 'مكية', pageStart: 594 },
  { number: 91, name: 'الشمس', englishName: 'Ash-Shams', versesCount: 15, revelationType: 'مكية', pageStart: 595 },
  { number: 92, name: 'الليل', englishName: 'Al-Layl', versesCount: 21, revelationType: 'مكية', pageStart: 595 },
  { number: 93, name: 'الضحى', englishName: 'Ad-Duha', versesCount: 11, revelationType: 'مكية', pageStart: 596 },
  { number: 94, name: 'الشرح', englishName: 'Ash-Sharh', versesCount: 8, revelationType: 'مكية', pageStart: 596 },
  { number: 95, name: 'التين', englishName: 'At-Tin', versesCount: 8, revelationType: 'مكية', pageStart: 597 },
  { number: 96, name: 'العلق', englishName: 'Al-\'Alaq', versesCount: 19, revelationType: 'مكية', pageStart: 597 },
  { number: 97, name: 'القدر', englishName: 'Al-Qadr', versesCount: 5, revelationType: 'مكية', pageStart: 598 },
  { number: 98, name: 'البينة', englishName: 'Al-Bayyinah', versesCount: 8, revelationType: 'مدنية', pageStart: 598 },
  { number: 99, name: 'الزلزلة', englishName: 'Az-Zalzalah', versesCount: 8, revelationType: 'مدنية', pageStart: 599 },
  { number: 100, name: 'العاديات', englishName: 'Al-\'Adiyat', versesCount: 11, revelationType: 'مكية', pageStart: 599 },
  { number: 101, name: 'القارعة', englishName: 'Al-Qari\'ah', versesCount: 11, revelationType: 'مكية', pageStart: 600 },
  { number: 102, name: 'التكاثر', englishName: 'At-Takathur', versesCount: 8, revelationType: 'مكية', pageStart: 600 },
  { number: 103, name: 'العصر', englishName: 'Al-\'Asr', versesCount: 3, revelationType: 'مكية', pageStart: 601 },
  { number: 104, name: 'الهمزة', englishName: 'Al-Humazah', versesCount: 9, revelationType: 'مكية', pageStart: 601 },
  { number: 105, name: 'الفيل', englishName: 'Al-Fil', versesCount: 5, revelationType: 'مكية', pageStart: 601 },
  { number: 106, name: 'قريش', englishName: 'Quraysh', versesCount: 4, revelationType: 'مكية', pageStart: 602 },
  { number: 107, name: 'الماعون', englishName: 'Al-Ma\'un', versesCount: 7, revelationType: 'مكية', pageStart: 602 },
  { number: 108, name: 'الكوثر', englishName: 'Al-Kawthar', versesCount: 3, revelationType: 'مكية', pageStart: 602 },
  { number: 109, name: 'الكافرون', englishName: 'Al-Kafirun', versesCount: 6, revelationType: 'مكية', pageStart: 603 },
  { number: 110, name: 'النصر', englishName: 'An-Nasr', versesCount: 3, revelationType: 'مدنية', pageStart: 603 },
  { number: 111, name: 'المسد', englishName: 'Al-Masad', versesCount: 5, revelationType: 'مكية', pageStart: 603 },
  { number: 112, name: 'الإخلاص', englishName: 'Al-Ikhlas', versesCount: 4, revelationType: 'مكية', pageStart: 604 },
  { number: 113, name: 'الفلق', englishName: 'Al-Falaq', versesCount: 5, revelationType: 'مكية', pageStart: 604 },
  { number: 114, name: 'الناس', englishName: 'An-Nas', versesCount: 6, revelationType: 'مكية', pageStart: 604 },
];

export function getSurahAudioUrl(serverUrl: string, surahNumber: number): string {
  const padded = String(surahNumber).padStart(3, '0');
  const base = serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`;
  return `${base}${padded}.mp3`;
}

export function getSurahAudioCandidateUrls(reciter: Reciter, surahNumber: number): string[] {
  const padded = String(surahNumber).padStart(3, '0');
  const primaryBase = reciter.serverUrl.endsWith('/') ? reciter.serverUrl : `${reciter.serverUrl}/`;
  const candidates: string[] = [`${primaryBase}${padded}.mp3`];

  if (reciter.fallbackServerUrls) {
    reciter.fallbackServerUrls.forEach((baseRaw) => {
      const base = baseRaw.endsWith('/') ? baseRaw : `${baseRaw}/`;
      if (base.includes('cdn.islamic.network/quran/audio-surah/')) {
        candidates.push(`${base}${surahNumber}.mp3`);
      } else {
        candidates.push(`${base}${padded}.mp3`);
      }
    });
  }

  // Universal fallback on islamic.network & mp3quran
  candidates.push(
    `https://cdn.islamic.network/quran/audio-surah/128/${reciter.islamicNetworkEdition || 'ar.alafasy'}/${surahNumber}.mp3`,
    `https://server8.mp3quran.net/afs/${padded}.mp3`
  );

  return Array.from(new Set(candidates));
}

