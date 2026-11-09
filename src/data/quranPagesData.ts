/**
 * Complete Quran Metadata for Madinah Mushaf (Hafs an Asim - 604 Pages)
 * Includes Surah start pages, Juz' start pages, and page information.
 */

export interface SurahPageInfo {
  number: number;
  name: string;
  englishName: string;
  startPage: number;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface JuzInfo {
  number: number;
  name: string;
  startPage: number;
}

// 114 Surahs with exact starting pages in the 604-page Madinah Mushaf
export const QURAN_SURAHS: SurahPageInfo[] = [
  { number: 1, name: "الفاتحة", englishName: "Al-Fatihah", startPage: 1, numberOfAyahs: 7, revelationType: "Meccan" },
  { number: 2, name: "البقرة", englishName: "Al-Baqarah", startPage: 2, numberOfAyahs: 286, revelationType: "Medinan" },
  { number: 3, name: "آل عمران", englishName: "Aal-Imran", startPage: 50, numberOfAyahs: 200, revelationType: "Medinan" },
  { number: 4, name: "النساء", englishName: "An-Nisa", startPage: 77, numberOfAyahs: 176, revelationType: "Medinan" },
  { number: 5, name: "المائدة", englishName: "Al-Ma'idah", startPage: 106, numberOfAyahs: 120, revelationType: "Medinan" },
  { number: 6, name: "الأنعام", englishName: "Al-An'am", startPage: 128, numberOfAyahs: 165, revelationType: "Meccan" },
  { number: 7, name: "الأعراف", englishName: "Al-A'raf", startPage: 151, numberOfAyahs: 206, revelationType: "Meccan" },
  { number: 8, name: "الأنفال", englishName: "Al-Anfal", startPage: 177, numberOfAyahs: 75, revelationType: "Medinan" },
  { number: 9, name: "التوبة", englishName: "At-Tawbah", startPage: 187, numberOfAyahs: 129, revelationType: "Medinan" },
  { number: 10, name: "يونس", englishName: "Yunus", startPage: 208, numberOfAyahs: 109, revelationType: "Meccan" },
  { number: 11, name: "هود", englishName: "Hud", startPage: 221, numberOfAyahs: 123, revelationType: "Meccan" },
  { number: 12, name: "يوسف", englishName: "Yusuf", startPage: 235, numberOfAyahs: 111, revelationType: "Meccan" },
  { number: 13, name: "الرعد", englishName: "Ar-Ra'd", startPage: 249, numberOfAyahs: 43, revelationType: "Medinan" },
  { number: 14, name: "إبراهيم", englishName: "Ibrahim", startPage: 255, numberOfAyahs: 52, revelationType: "Meccan" },
  { number: 15, name: "الحجر", englishName: "Al-Hijr", startPage: 262, numberOfAyahs: 99, revelationType: "Meccan" },
  { number: 16, name: "النحل", englishName: "An-Nahl", startPage: 267, numberOfAyahs: 128, revelationType: "Meccan" },
  { number: 17, name: "الإسراء", englishName: "Al-Isra", startPage: 282, numberOfAyahs: 111, revelationType: "Meccan" },
  { number: 18, name: "الكهف", englishName: "Al-Kahf", startPage: 293, numberOfAyahs: 110, revelationType: "Meccan" },
  { number: 19, name: "مريم", englishName: "Maryam", startPage: 305, numberOfAyahs: 98, revelationType: "Meccan" },
  { number: 20, name: "طه", englishName: "Ta-Ha", startPage: 312, numberOfAyahs: 135, revelationType: "Meccan" },
  { number: 21, name: "الأنبياء", englishName: "Al-Anbiya", startPage: 322, numberOfAyahs: 112, revelationType: "Meccan" },
  { number: 22, name: "الحج", englishName: "Al-Hajj", startPage: 332, numberOfAyahs: 78, revelationType: "Medinan" },
  { number: 23, name: "المؤمنون", englishName: "Al-Mu'minun", startPage: 342, numberOfAyahs: 118, revelationType: "Meccan" },
  { number: 24, name: "النور", englishName: "An-Nur", startPage: 350, numberOfAyahs: 64, revelationType: "Medinan" },
  { number: 25, name: "الفرقان", englishName: "Al-Furqan", startPage: 359, numberOfAyahs: 77, revelationType: "Meccan" },
  { number: 26, name: "الشعراء", englishName: "Ash-Shu'ara", startPage: 367, numberOfAyahs: 227, revelationType: "Meccan" },
  { number: 27, name: "النمل", englishName: "An-Naml", startPage: 377, numberOfAyahs: 93, revelationType: "Meccan" },
  { number: 28, name: "القصص", englishName: "Al-Qasas", startPage: 385, numberOfAyahs: 88, revelationType: "Meccan" },
  { number: 29, name: "العنكبوت", englishName: "Al-Ankabut", startPage: 396, numberOfAyahs: 69, revelationType: "Meccan" },
  { number: 30, name: "الروم", englishName: "Ar-Rum", startPage: 404, numberOfAyahs: 60, revelationType: "Meccan" },
  { number: 31, name: "لقمان", englishName: "Luqman", startPage: 411, numberOfAyahs: 34, revelationType: "Meccan" },
  { number: 32, name: "السجدة", englishName: "As-Sajdah", startPage: 415, numberOfAyahs: 30, revelationType: "Meccan" },
  { number: 33, name: "الأحزاب", englishName: "Al-Ahzab", startPage: 418, numberOfAyahs: 73, revelationType: "Medinan" },
  { number: 34, name: "سبأ", englishName: "Saba", startPage: 428, numberOfAyahs: 54, revelationType: "Meccan" },
  { number: 35, name: "فاطر", englishName: "Fatir", startPage: 434, numberOfAyahs: 45, revelationType: "Meccan" },
  { number: 36, name: "يس", englishName: "Ya-Sin", startPage: 440, numberOfAyahs: 83, revelationType: "Meccan" },
  { number: 37, name: "الصافات", englishName: "As-Saffat", startPage: 446, numberOfAyahs: 182, revelationType: "Meccan" },
  { number: 38, name: "ص", englishName: "Sad", startPage: 453, numberOfAyahs: 88, revelationType: "Meccan" },
  { number: 39, name: "الزمر", englishName: "Az-Zumar", startPage: 458, numberOfAyahs: 75, revelationType: "Meccan" },
  { number: 40, name: "غافر", englishName: "Ghafir", startPage: 467, numberOfAyahs: 85, revelationType: "Meccan" },
  { number: 41, name: "فصلت", englishName: "Fussilat", startPage: 477, numberOfAyahs: 54, revelationType: "Meccan" },
  { number: 42, name: "الشورى", englishName: "Ash-Shura", startPage: 483, numberOfAyahs: 53, revelationType: "Meccan" },
  { number: 43, name: "الزخرف", englishName: "Az-Zukhruf", startPage: 489, numberOfAyahs: 89, revelationType: "Meccan" },
  { number: 44, name: "الدخان", englishName: "Ad-Dukhan", startPage: 496, numberOfAyahs: 59, revelationType: "Meccan" },
  { number: 45, name: "الجاثية", englishName: "Al-Jathiyah", startPage: 499, numberOfAyahs: 37, revelationType: "Meccan" },
  { number: 46, name: "الأحقاف", englishName: "Al-Ahqaf", startPage: 502, numberOfAyahs: 35, revelationType: "Meccan" },
  { number: 47, name: "محمد", englishName: "Muhammad", startPage: 507, numberOfAyahs: 38, revelationType: "Medinan" },
  { number: 48, name: "الفتح", englishName: "Al-Fath", startPage: 511, numberOfAyahs: 29, revelationType: "Medinan" },
  { number: 49, name: "الحجرات", englishName: "Al-Hujurat", startPage: 515, numberOfAyahs: 18, revelationType: "Medinan" },
  { number: 50, name: "ق", englishName: "Qaf", startPage: 518, numberOfAyahs: 45, revelationType: "Meccan" },
  { number: 51, name: "الذاريات", englishName: "Adh-Dhariyat", startPage: 520, numberOfAyahs: 60, revelationType: "Meccan" },
  { number: 52, name: "الطور", englishName: "At-Tur", startPage: 523, numberOfAyahs: 49, revelationType: "Meccan" },
  { number: 53, name: "النجم", englishName: "An-Najm", startPage: 526, numberOfAyahs: 62, revelationType: "Meccan" },
  { number: 54, name: "القمر", englishName: "Al-Qamar", startPage: 528, numberOfAyahs: 55, revelationType: "Meccan" },
  { number: 55, name: "الرحمن", englishName: "Ar-Rahman", startPage: 531, numberOfAyahs: 78, revelationType: "Medinan" },
  { number: 56, name: "الواقعة", englishName: "Al-Waqi'ah", startPage: 534, numberOfAyahs: 96, revelationType: "Meccan" },
  { number: 57, name: "الحديد", englishName: "Al-Hadid", startPage: 537, numberOfAyahs: 29, revelationType: "Medinan" },
  { number: 58, name: "المجادلة", englishName: "Al-Mujadila", startPage: 542, numberOfAyahs: 22, revelationType: "Medinan" },
  { number: 59, name: "الحشر", englishName: "Al-Hashr", startPage: 545, numberOfAyahs: 24, revelationType: "Medinan" },
  { number: 60, name: "الممتحنة", englishName: "Al-Mumtahanah", startPage: 549, numberOfAyahs: 13, revelationType: "Medinan" },
  { number: 61, name: "الصف", englishName: "As-Saff", startPage: 551, numberOfAyahs: 14, revelationType: "Medinan" },
  { number: 62, name: "الجمعة", englishName: "Al-Jumu'ah", startPage: 553, numberOfAyahs: 11, revelationType: "Medinan" },
  { number: 63, name: "المنافقون", englishName: "Al-Munafiqun", startPage: 554, numberOfAyahs: 11, revelationType: "Medinan" },
  { number: 64, name: "التغابن", englishName: "At-Taghabun", startPage: 556, numberOfAyahs: 18, revelationType: "Medinan" },
  { number: 65, name: "الطلاق", englishName: "At-Talaq", startPage: 558, numberOfAyahs: 12, revelationType: "Medinan" },
  { number: 66, name: "التحريم", englishName: "At-Tahrim", startPage: 560, numberOfAyahs: 12, revelationType: "Medinan" },
  { number: 67, name: "الملك", englishName: "Al-Mulk", startPage: 562, numberOfAyahs: 30, revelationType: "Meccan" },
  { number: 68, name: "القلم", englishName: "Al-Qalam", startPage: 564, numberOfAyahs: 52, revelationType: "Meccan" },
  { number: 69, name: "الحاقة", englishName: "Al-Haqqah", startPage: 566, numberOfAyahs: 52, revelationType: "Meccan" },
  { number: 70, name: "المعارج", englishName: "Al-Ma'arij", startPage: 568, numberOfAyahs: 44, revelationType: "Meccan" },
  { number: 71, name: "نوح", englishName: "Nuh", startPage: 570, numberOfAyahs: 28, revelationType: "Meccan" },
  { number: 72, name: "الجن", englishName: "Al-Jinn", startPage: 572, numberOfAyahs: 28, revelationType: "Meccan" },
  { number: 73, name: "المزمل", englishName: "Al-Muzzammil", startPage: 574, numberOfAyahs: 20, revelationType: "Meccan" },
  { number: 74, name: "المدثر", englishName: "Al-Muddaththir", startPage: 575, numberOfAyahs: 56, revelationType: "Meccan" },
  { number: 75, name: "القيامة", englishName: "Al-Qiyamah", startPage: 577, numberOfAyahs: 40, revelationType: "Meccan" },
  { number: 76, name: "الإنسان", englishName: "Al-Insan", startPage: 578, numberOfAyahs: 31, revelationType: "Medinan" },
  { number: 77, name: "المرسلات", englishName: "Al-Mursalat", startPage: 580, numberOfAyahs: 50, revelationType: "Meccan" },
  { number: 78, name: "النبأ", englishName: "An-Naba", startPage: 582, numberOfAyahs: 40, revelationType: "Meccan" },
  { number: 79, name: "النازعات", englishName: "An-Nazi'at", startPage: 583, numberOfAyahs: 46, revelationType: "Meccan" },
  { number: 80, name: "عبس", englishName: "Abasa", startPage: 585, numberOfAyahs: 42, revelationType: "Meccan" },
  { number: 81, name: "التكوير", englishName: "At-Takwir", startPage: 586, numberOfAyahs: 29, revelationType: "Meccan" },
  { number: 82, name: "الانفطار", englishName: "Al-Infitar", startPage: 587, numberOfAyahs: 19, revelationType: "Meccan" },
  { number: 83, name: "المطففين", englishName: "Al-Mutaffifin", startPage: 587, numberOfAyahs: 36, revelationType: "Meccan" },
  { number: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", startPage: 589, numberOfAyahs: 25, revelationType: "Meccan" },
  { number: 85, name: "البروج", englishName: "Al-Buruj", startPage: 590, numberOfAyahs: 22, revelationType: "Meccan" },
  { number: 86, name: "الطارق", englishName: "At-Tariq", startPage: 591, numberOfAyahs: 17, revelationType: "Meccan" },
  { number: 87, name: "الأعلى", englishName: "Al-A'la", startPage: 591, numberOfAyahs: 19, revelationType: "Meccan" },
  { number: 88, name: "الغاشية", englishName: "Al-Ghashiyah", startPage: 592, numberOfAyahs: 26, revelationType: "Meccan" },
  { number: 89, name: "الفجر", englishName: "Al-Fajr", startPage: 593, numberOfAyahs: 30, revelationType: "Meccan" },
  { number: 90, name: "البلد", englishName: "Al-Balad", startPage: 594, numberOfAyahs: 20, revelationType: "Meccan" },
  { number: 91, name: "الشمس", englishName: "Ash-Shams", startPage: 595, numberOfAyahs: 15, revelationType: "Meccan" },
  { number: 92, name: "الليل", englishName: "Al-Layl", startPage: 595, numberOfAyahs: 21, revelationType: "Meccan" },
  { number: 93, name: "الضحى", englishName: "Ad-Duha", startPage: 596, numberOfAyahs: 11, revelationType: "Meccan" },
  { number: 94, name: "الشرح", englishName: "Ash-Sharh", startPage: 596, numberOfAyahs: 8, revelationType: "Meccan" },
  { number: 95, name: "التين", englishName: "At-Tin", startPage: 597, numberOfAyahs: 8, revelationType: "Meccan" },
  { number: 96, name: "العلق", englishName: "Al-Alaq", startPage: 597, numberOfAyahs: 19, revelationType: "Meccan" },
  { number: 97, name: "القدر", englishName: "Al-Qadr", startPage: 598, numberOfAyahs: 5, revelationType: "Meccan" },
  { number: 98, name: "البينة", englishName: "Al-Bayyinah", startPage: 598, numberOfAyahs: 8, revelationType: "Medinan" },
  { number: 99, name: "الزلزلة", englishName: "Az-Zalzalah", startPage: 599, numberOfAyahs: 8, revelationType: "Medinan" },
  { number: 100, name: "العاديات", englishName: "Al-Adiyat", startPage: 599, numberOfAyahs: 11, revelationType: "Meccan" },
  { number: 101, name: "القارعة", englishName: "Al-Qari'ah", startPage: 600, numberOfAyahs: 11, revelationType: "Meccan" },
  { number: 102, name: "التكاثر", englishName: "At-Takathur", startPage: 600, numberOfAyahs: 8, revelationType: "Meccan" },
  { number: 103, name: "العصر", englishName: "Al-Asr", startPage: 601, numberOfAyahs: 3, revelationType: "Meccan" },
  { number: 104, name: "الهمزة", englishName: "Al-Humazah", startPage: 601, numberOfAyahs: 9, revelationType: "Meccan" },
  { number: 105, name: "الفيل", englishName: "Al-Fil", startPage: 601, numberOfAyahs: 5, revelationType: "Meccan" },
  { number: 106, name: "قريش", englishName: "Quraysh", startPage: 602, numberOfAyahs: 4, revelationType: "Meccan" },
  { number: 107, name: "الماعون", englishName: "Al-Ma'un", startPage: 602, numberOfAyahs: 7, revelationType: "Meccan" },
  { number: 108, name: "الكوثر", englishName: "Al-Kawthar", startPage: 602, numberOfAyahs: 3, revelationType: "Meccan" },
  { number: 109, name: "الكافرون", englishName: "Al-Kafirun", startPage: 603, numberOfAyahs: 6, revelationType: "Meccan" },
  { number: 110, name: "النصر", englishName: "An-Nasr", startPage: 603, numberOfAyahs: 3, revelationType: "Medinan" },
  { number: 111, name: "المسد", englishName: "Al-Masad", startPage: 603, numberOfAyahs: 5, revelationType: "Meccan" },
  { number: 112, name: "الإخلاص", englishName: "Al-Ikhlas", startPage: 604, numberOfAyahs: 4, revelationType: "Meccan" },
  { number: 113, name: "الفلق", englishName: "Al-Falaq", startPage: 604, numberOfAyahs: 5, revelationType: "Meccan" },
  { number: 114, name: "الناس", englishName: "An-Nas", startPage: 604, numberOfAyahs: 6, revelationType: "Meccan" },
];

export const JUZ_LIST: JuzInfo[] = [
  { number: 1, name: "الجزء الأول (الم)", startPage: 1 },
  { number: 2, name: "الجزء الثاني (سيقول)", startPage: 22 },
  { number: 3, name: "الجزء الثالث (تلك الرسل)", startPage: 42 },
  { number: 4, name: "الجزء الرابع (لن تنالوا)", startPage: 62 },
  { number: 5, name: "الجزء الخامس (والمحصنات)", startPage: 82 },
  { number: 6, name: "الجزء السادس (لا يحب الله)", startPage: 102 },
  { number: 7, name: "الجزء السابع (وإذا سمعوا)", startPage: 121 },
  { number: 8, name: "الجزء الثامن (ولو أننا)", startPage: 142 },
  { number: 9, name: "الجزء التاسع (قال الملأ)", startPage: 162 },
  { number: 10, name: "الجزء العاشر (واعلموا)", startPage: 182 },
  { number: 11, name: "الجزء الحادي عشر (يعتذرون)", startPage: 201 },
  { number: 12, name: "الجزء الثاني عشر (وما من دابة)", startPage: 222 },
  { number: 13, name: "الجزء الثالث عشر (وما أبرئ)", startPage: 242 },
  { number: 14, name: "الجزء الرابع عشر (ربما)", startPage: 262 },
  { number: 15, name: "الجزء الخامس عشر (سبحان)", startPage: 282 },
  { number: 16, name: "الجزء السادس عشر (قال ألم)", startPage: 302 },
  { number: 17, name: "الجزء السابع عشر (اقترب)", startPage: 322 },
  { number: 18, name: "الجزء الثامن عشر (قد أفلح)", startPage: 342 },
  { number: 19, name: "الجزء التاسع عشر (وقال الذين)", startPage: 362 },
  { number: 20, name: "الجزء العشرون (فما كان)", startPage: 382 },
  { number: 21, name: "الجزء الحادي والعشرون (ولا تجادلوا)", startPage: 402 },
  { number: 22, name: "الجزء الثاني والعشرون (ومن يقنت)", startPage: 422 },
  { number: 23, name: "الجزء الثالث والعشرون (وما أنزلنا)", startPage: 442 },
  { number: 24, name: "الجزء الرابع والعشرون (فمن أظلم)", startPage: 462 },
  { number: 25, name: "الجزء الخامس والعشرون (إليه يرد)", startPage: 482 },
  { number: 26, name: "الجزء السادس والعشرون (حم)", startPage: 502 },
  { number: 27, name: "الجزء السابع والعشرون (قال فما خطبكم)", startPage: 522 },
  { number: 28, name: "الجزء الثامن والعشرون (قد سمع)", startPage: 542 },
  { number: 29, name: "الجزء التاسع والعشرون (تبارك)", startPage: 562 },
  { number: 30, name: "الجزء الثلاثون (عمّ)", startPage: 582 },
];

/**
 * Resolves metadata for a specific Mushaf page (1 - 604)
 */
export function getPageMetadata(pageNumber: number): {
  pageNumber: number;
  juzNumber: number;
  juzName: string;
  hizbNumber: number;
  surahName: string;
  surahNumber: number;
} {
  const safePage = Math.max(1, Math.min(604, pageNumber));

  // Find Juz
  let currentJuz = JUZ_LIST[0];
  for (let i = JUZ_LIST.length - 1; i >= 0; i--) {
    if (safePage >= JUZ_LIST[i].startPage) {
      currentJuz = JUZ_LIST[i];
      break;
    }
  }

  // Find Surah
  let currentSurah = QURAN_SURAHS[0];
  for (let i = QURAN_SURAHS.length - 1; i >= 0; i--) {
    if (safePage >= QURAN_SURAHS[i].startPage) {
      currentSurah = QURAN_SURAHS[i];
      break;
    }
  }

  // Approximate Hizb (2 Hizb per Juz)
  const hizbNumber = Math.min(60, Math.max(1, Math.ceil((safePage / 604) * 60)));

  return {
    pageNumber: safePage,
    juzNumber: currentJuz.number,
    juzName: currentJuz.name,
    hizbNumber,
    surahName: currentSurah.name,
    surahNumber: currentSurah.number,
  };
}

/**
 * Returns formatted 3-digit page URL for original Madinah Mushaf
 */
export function getPageImageUrl(pageNumber: number): string {
  const safePage = Math.max(1, Math.min(604, pageNumber));
  const padded = String(safePage).padStart(3, '0');
  return `https://files.quran.app/hafs/madani/width_1260/page${padded}.png`;
}
