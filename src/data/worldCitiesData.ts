import { ALL_EGYPT_WORLD_CITIES } from './egyptLocationsData';
import { ALL_WORLD_COUNTRIES_DATA } from './allWorldCountriesAndCities';

export interface WorldCity {
  id: string;
  name: string;        // Arabic city name
  nameEn: string;      // English city name
  country: string;     // Arabic country name
  countryEn: string;   // English country name
  countryCode?: string; // ISO 3166-1 alpha-2 country code (e.g., EG, SA, AE, US)
  latitude: number;
  longitude: number;
  timezone: string;
  recommendedMethod: string;
}

export interface WorldCountryInfo {
  country: string;
  countryEn: string;
  countryCode: string;
  cityCount: number;
}

export const WORLD_CITIES: WorldCity[] = [
  // ================= مصر (Egypt - 27 Governorates) =================
  { id: 'cairo', name: 'القاهرة', nameEn: 'Cairo', country: 'مصر', countryEn: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'alexandria', name: 'الإسكندرية', nameEn: 'Alexandria', country: 'مصر', countryEn: 'Egypt', latitude: 31.2001, longitude: 29.9187, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'giza', name: 'الجيزة', nameEn: 'Giza', country: 'مصر', countryEn: 'Egypt', latitude: 30.0131, longitude: 31.2089, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'mansoura', name: 'المنصورة (الدقهلية)', nameEn: 'Mansoura', country: 'مصر', countryEn: 'Egypt', latitude: 31.0409, longitude: 31.3785, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'tanta', name: 'طنطا (الغربية)', nameEn: 'Tanta', country: 'مصر', countryEn: 'Egypt', latitude: 30.7865, longitude: 31.0004, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'zagazig', name: 'الزقازيق (الشرقية)', nameEn: 'Zagazig', country: 'مصر', countryEn: 'Egypt', latitude: 30.5877, longitude: 31.5020, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'damanhur', name: 'دمنهور (البحيرة)', nameEn: 'Damanhur', country: 'مصر', countryEn: 'Egypt', latitude: 31.0341, longitude: 30.4682, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'shebin', name: 'شبين الكوم (المنوفية)', nameEn: 'Shibin El Kom', country: 'مصر', countryEn: 'Egypt', latitude: 30.5503, longitude: 31.0106, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'banha', name: 'بنها (القليوبية)', nameEn: 'Banha', country: 'مصر', countryEn: 'Egypt', latitude: 30.4660, longitude: 31.1848, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'kafr_elsheikh', name: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', country: 'مصر', countryEn: 'Egypt', latitude: 31.1107, longitude: 30.9388, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'damietta', name: 'دمياط', nameEn: 'Damietta', country: 'مصر', countryEn: 'Egypt', latitude: 31.4175, longitude: 31.8144, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'portsaid', name: 'بورسعيد', nameEn: 'Port Said', country: 'مصر', countryEn: 'Egypt', latitude: 31.2653, longitude: 32.3019, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'ismailia', name: 'الإسماعيلية', nameEn: 'Ismailia', country: 'مصر', countryEn: 'Egypt', latitude: 30.6043, longitude: 32.2723, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'suez', name: 'السويس', nameEn: 'Suez', country: 'مصر', countryEn: 'Egypt', latitude: 29.9668, longitude: 32.5498, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'arish', name: 'العريش (شمال سيناء)', nameEn: 'Arish', country: 'مصر', countryEn: 'Egypt', latitude: 31.1316, longitude: 33.7984, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'sharm', name: 'شرم الشيخ (جنوب سيناء)', nameEn: 'Sharm El Sheikh', country: 'مصر', countryEn: 'Egypt', latitude: 27.9158, longitude: 34.3299, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'fayoum', name: 'الفيوم', nameEn: 'Fayoum', country: 'مصر', countryEn: 'Egypt', latitude: 29.3084, longitude: 30.8428, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'beni_suef', name: 'بني سويف', nameEn: 'Beni Suef', country: 'مصر', countryEn: 'Egypt', latitude: 29.0661, longitude: 31.0994, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'minya', name: 'المنيا', nameEn: 'Minya', country: 'مصر', countryEn: 'Egypt', latitude: 28.1099, longitude: 30.7503, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'asyut', name: 'أسيوط', nameEn: 'Asyut', country: 'مصر', countryEn: 'Egypt', latitude: 27.1783, longitude: 31.1859, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'sohag', name: 'سوهاج', nameEn: 'Sohag', country: 'مصر', countryEn: 'Egypt', latitude: 26.5570, longitude: 31.6948, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'qena', name: 'قنا', nameEn: 'Qena', country: 'مصر', countryEn: 'Egypt', latitude: 26.1551, longitude: 32.7160, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'luxor', name: 'الأقصر', nameEn: 'Luxor', country: 'مصر', countryEn: 'Egypt', latitude: 25.6872, longitude: 32.6396, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'aswan', name: 'أسوان', nameEn: 'Aswan', country: 'مصر', countryEn: 'Egypt', latitude: 24.0889, longitude: 32.8998, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'hurghada', name: 'الغردقة (البحر الأحمر)', nameEn: 'Hurghada', country: 'مصر', countryEn: 'Egypt', latitude: 27.2579, longitude: 33.8116, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'marsa_matruh', name: 'مرسى مطروح', nameEn: 'Marsa Matruh', country: 'مصر', countryEn: 'Egypt', latitude: 31.3543, longitude: 27.2373, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },
  { id: 'kharga', name: 'الخارجة (الوادي الجديد)', nameEn: 'Kharga', country: 'مصر', countryEn: 'Egypt', latitude: 25.4390, longitude: 30.5586, timezone: 'Africa/Cairo', recommendedMethod: 'egypt' },

  // ================= المملكة العربية السعودية (Saudi Arabia) =================
  { id: 'makkah', name: 'مكة المكرمة', nameEn: 'Makkah', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'madinah', name: 'المدينة المنورة', nameEn: 'Madinah', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 24.5247, longitude: 39.5692, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'riyadh', name: 'الرياض', nameEn: 'Riyadh', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'jeddah', name: 'جدة', nameEn: 'Jeddah', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 21.4858, longitude: 39.1925, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'dammam', name: 'الدمام', nameEn: 'Dammam', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 26.4207, longitude: 50.0888, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'taif', name: 'الطائف', nameEn: 'Taif', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 21.2854, longitude: 40.4222, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'khobar', name: 'الخبر', nameEn: 'Khobar', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 26.2172, longitude: 50.1971, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'dhahran', name: 'الظهران', nameEn: 'Dhahran', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 26.2361, longitude: 50.0393, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'ahsa', name: 'الأحساء (الهفوف)', nameEn: 'Al-Ahsa', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 25.3800, longitude: 49.5888, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'tabuk', name: 'تبوك', nameEn: 'Tabuk', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 28.3835, longitude: 36.5662, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'buraidah', name: 'بريدة (القصيم)', nameEn: 'Buraidah', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 26.3260, longitude: 43.9750, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'unaizah', name: 'عنيزة', nameEn: 'Unaizah', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 26.0844, longitude: 43.9936, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'abha', name: 'أبها', nameEn: 'Abha', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 18.2164, longitude: 42.5053, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'khamis_mushait', name: 'خميس مشيط', nameEn: 'Khamis Mushait', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 18.3000, longitude: 42.7333, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'hail', name: 'حائل', nameEn: 'Hail', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 27.5114, longitude: 41.7208, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'jubail', name: 'الجبيل', nameEn: 'Jubail', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 27.0112, longitude: 49.6583, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'najran', name: 'نجران', nameEn: 'Najran', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 17.4924, longitude: 44.1277, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'jazan', name: 'جازان', nameEn: 'Jazan', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 16.8892, longitude: 42.5511, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'yanbu', name: 'ينبع', nameEn: 'Yanbu', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 24.0232, longitude: 38.1900, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'arar', name: 'عرعر', nameEn: 'Arar', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 30.9753, longitude: 41.0381, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'sakaka', name: 'سكاكا (الجوف)', nameEn: 'Sakaka', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 29.9697, longitude: 40.2064, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },
  { id: 'baha', name: 'الباحة', nameEn: 'Al Bahah', country: 'السعودية', countryEn: 'Saudi Arabia', latitude: 20.0129, longitude: 41.4677, timezone: 'Asia/Riyadh', recommendedMethod: 'makkah' },

  // ================= الإمارات العربية المتحدة (UAE) =================
  { id: 'dubai', name: 'دبي', nameEn: 'Dubai', country: 'الإمارات', countryEn: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai', recommendedMethod: 'makkah' },
  { id: 'abudhabi', name: 'أبوظبي', nameEn: 'Abu Dhabi', country: 'الإمارات', countryEn: 'United Arab Emirates', latitude: 24.4539, longitude: 54.3773, timezone: 'Asia/Dubai', recommendedMethod: 'makkah' },
  { id: 'sharjah', name: 'الشارقة', nameEn: 'Sharjah', country: 'الإمارات', countryEn: 'United Arab Emirates', latitude: 25.3463, longitude: 55.4209, timezone: 'Asia/Dubai', recommendedMethod: 'makkah' },
  { id: 'ajman', name: 'عجمان', nameEn: 'Ajman', country: 'الإمارات', countryEn: 'United Arab Emirates', latitude: 25.4052, longitude: 55.5136, timezone: 'Asia/Dubai', recommendedMethod: 'makkah' },
  { id: 'alain', name: 'العين', nameEn: 'Al Ain', country: 'الإمارات', countryEn: 'United Arab Emirates', latitude: 24.2075, longitude: 55.7447, timezone: 'Asia/Dubai', recommendedMethod: 'makkah' },
  { id: 'ras_alkhaimah', name: 'رأس الخيمة', nameEn: 'Ras Al Khaimah', country: 'الإمارات', countryEn: 'United Arab Emirates', latitude: 25.6741, longitude: 55.9804, timezone: 'Asia/Dubai', recommendedMethod: 'makkah' },
  { id: 'fujairah', name: 'الفجيرة', nameEn: 'Fujairah', country: 'الإمارات', countryEn: 'United Arab Emirates', latitude: 25.1288, longitude: 56.3265, timezone: 'Asia/Dubai', recommendedMethod: 'makkah' },
  { id: 'umm_alquwain', name: 'أم القيوين', nameEn: 'Umm Al Quwain', country: 'الإمارات', countryEn: 'United Arab Emirates', latitude: 25.5647, longitude: 55.5552, timezone: 'Asia/Dubai', recommendedMethod: 'makkah' },

  // ================= الكويت (Kuwait) =================
  { id: 'kuwait', name: 'الكويت العاصمة', nameEn: 'Kuwait City', country: 'الكويت', countryEn: 'Kuwait', latitude: 29.3759, longitude: 47.9774, timezone: 'Asia/Kuwait', recommendedMethod: 'kuwait' },
  { id: 'hawalli', name: 'حولي', nameEn: 'Hawalli', country: 'الكويت', countryEn: 'Kuwait', latitude: 29.3328, longitude: 48.0283, timezone: 'Asia/Kuwait', recommendedMethod: 'kuwait' },
  { id: 'farwaniya', name: 'الفروانية', nameEn: 'Al Farwaniyah', country: 'الكويت', countryEn: 'Kuwait', latitude: 29.2775, longitude: 47.9586, timezone: 'Asia/Kuwait', recommendedMethod: 'kuwait' },
  { id: 'ahmadi', name: 'الأحمدي', nameEn: 'Al Ahmadi', country: 'الكويت', countryEn: 'Kuwait', latitude: 29.0772, longitude: 48.0839, timezone: 'Asia/Kuwait', recommendedMethod: 'kuwait' },
  { id: 'jahra', name: 'الجهراء', nameEn: 'Al Jahra', country: 'الكويت', countryEn: 'Kuwait', latitude: 29.3375, longitude: 47.6581, timezone: 'Asia/Kuwait', recommendedMethod: 'kuwait' },
  { id: 'mubarak_alkabeer', name: 'مبارك الكبير', nameEn: 'Mubarak Al-Kabeer', country: 'الكويت', countryEn: 'Kuwait', latitude: 29.1925, longitude: 48.0778, timezone: 'Asia/Kuwait', recommendedMethod: 'kuwait' },

  // ================= قطر (Qatar) =================
  { id: 'doha', name: 'الدوحة', nameEn: 'Doha', country: 'قطر', countryEn: 'Qatar', latitude: 25.2854, longitude: 51.5310, timezone: 'Asia/Qatar', recommendedMethod: 'makkah' },
  { id: 'alrayyan', name: 'الريان', nameEn: 'Al Rayyan', country: 'قطر', countryEn: 'Qatar', latitude: 25.2919, longitude: 51.4244, timezone: 'Asia/Qatar', recommendedMethod: 'makkah' },
  { id: 'alwakra', name: 'الوكرة', nameEn: 'Al Wakrah', country: 'قطر', countryEn: 'Qatar', latitude: 25.1768, longitude: 51.6034, timezone: 'Asia/Qatar', recommendedMethod: 'makkah' },
  { id: 'alkhor', name: 'الخور', nameEn: 'Al Khor', country: 'قطر', countryEn: 'Qatar', latitude: 25.6804, longitude: 51.4969, timezone: 'Asia/Qatar', recommendedMethod: 'makkah' },
  { id: 'lusail', name: 'لوسيل', nameEn: 'Lusail', country: 'قطر', countryEn: 'Qatar', latitude: 25.4307, longitude: 51.5075, timezone: 'Asia/Qatar', recommendedMethod: 'makkah' },

  // ================= البحرين (Bahrain) =================
  { id: 'manama', name: 'المنامة', nameEn: 'Manama', country: 'البحرين', countryEn: 'Bahrain', latitude: 26.2285, longitude: 50.5860, timezone: 'Asia/Bahrain', recommendedMethod: 'makkah' },
  { id: 'muharraq', name: 'المحرق', nameEn: 'Muharraq', country: 'البحرين', countryEn: 'Bahrain', latitude: 26.2572, longitude: 50.6119, timezone: 'Asia/Bahrain', recommendedMethod: 'makkah' },
  { id: 'riffa', name: 'الرفاع', nameEn: 'Riffa', country: 'البحرين', countryEn: 'Bahrain', latitude: 26.1300, longitude: 50.5550, timezone: 'Asia/Bahrain', recommendedMethod: 'makkah' },
  { id: 'hamad_town', name: 'مدينة حمد', nameEn: 'Hamad Town', country: 'البحرين', countryEn: 'Bahrain', latitude: 26.1153, longitude: 50.5069, timezone: 'Asia/Bahrain', recommendedMethod: 'makkah' },

  // ================= سلطنة عُمان (Oman) =================
  { id: 'muscat', name: 'مسقط', nameEn: 'Muscat', country: 'عُمان', countryEn: 'Oman', latitude: 23.5859, longitude: 58.4059, timezone: 'Asia/Muscat', recommendedMethod: 'makkah' },
  { id: 'salalah', name: 'صلالة', nameEn: 'Salalah', country: 'عُمان', countryEn: 'Oman', latitude: 17.0151, longitude: 54.0924, timezone: 'Asia/Muscat', recommendedMethod: 'makkah' },
  { id: 'sohar', name: 'صحار', nameEn: 'Sohar', country: 'عُمان', countryEn: 'Oman', latitude: 24.3644, longitude: 56.7468, timezone: 'Asia/Muscat', recommendedMethod: 'makkah' },
  { id: 'nizwa', name: 'نزوى', nameEn: 'Nizwa', country: 'عُمان', countryEn: 'Oman', latitude: 22.9333, longitude: 57.5333, timezone: 'Asia/Muscat', recommendedMethod: 'makkah' },
  { id: 'sur', name: 'صور', nameEn: 'Sur', country: 'عُمان', countryEn: 'Oman', latitude: 22.5667, longitude: 59.5289, timezone: 'Asia/Muscat', recommendedMethod: 'makkah' },

  // ================= فلسطين (Palestine) =================
  { id: 'jerusalem', name: 'القدس الشريف', nameEn: 'Jerusalem', country: 'فلسطين', countryEn: 'Palestine', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Jerusalem', recommendedMethod: 'mwl' },
  { id: 'gaza', name: 'غزة', nameEn: 'Gaza', country: 'فلسطين', countryEn: 'Palestine', latitude: 31.5017, longitude: 34.4668, timezone: 'Asia/Gaza', recommendedMethod: 'mwl' },
  { id: 'ramallah', name: 'رام الله والبيرة', nameEn: 'Ramallah', country: 'فلسطين', countryEn: 'Palestine', latitude: 31.9038, longitude: 35.2034, timezone: 'Asia/Hebron', recommendedMethod: 'mwl' },
  { id: 'hebron', name: 'الخليل', nameEn: 'Hebron', country: 'فلسطين', countryEn: 'Palestine', latitude: 31.5326, longitude: 35.0998, timezone: 'Asia/Hebron', recommendedMethod: 'mwl' },
  { id: 'nablus', name: 'نابلس', nameEn: 'Nablus', country: 'فلسطين', countryEn: 'Palestine', latitude: 32.2211, longitude: 35.2544, timezone: 'Asia/Hebron', recommendedMethod: 'mwl' },
  { id: 'jenin', name: 'جنين', nameEn: 'Jenin', country: 'فلسطين', countryEn: 'Palestine', latitude: 32.4646, longitude: 35.2957, timezone: 'Asia/Hebron', recommendedMethod: 'mwl' },
  { id: 'tulkarm', name: 'طولكرم', nameEn: 'Tulkarm', country: 'فلسطين', countryEn: 'Palestine', latitude: 32.3104, longitude: 35.0286, timezone: 'Asia/Hebron', recommendedMethod: 'mwl' },
  { id: 'bethlehem', name: 'بيت لحم', nameEn: 'Bethlehem', country: 'فلسطين', countryEn: 'Palestine', latitude: 31.7054, longitude: 35.2024, timezone: 'Asia/Hebron', recommendedMethod: 'mwl' },
  { id: 'jericho', name: 'أريحا', nameEn: 'Jericho', country: 'فلسطين', countryEn: 'Palestine', latitude: 31.8611, longitude: 35.4608, timezone: 'Asia/Hebron', recommendedMethod: 'mwl' },
  { id: 'khan_yunis', name: 'خان يونس', nameEn: 'Khan Yunis', country: 'فلسطين', countryEn: 'Palestine', latitude: 31.3462, longitude: 34.3063, timezone: 'Asia/Gaza', recommendedMethod: 'mwl' },
  { id: 'rafah', name: 'رفح', nameEn: 'Rafah', country: 'فلسطين', countryEn: 'Palestine', latitude: 31.2969, longitude: 34.2436, timezone: 'Asia/Gaza', recommendedMethod: 'mwl' },

  // ================= الأردن (Jordan) =================
  { id: 'amman', name: 'عمّان', nameEn: 'Amman', country: 'الأردن', countryEn: 'Jordan', latitude: 31.9454, longitude: 35.9284, timezone: 'Asia/Amman', recommendedMethod: 'mwl' },
  { id: 'zarqa', name: 'الزرقاء', nameEn: 'Zarqa', country: 'الأردن', countryEn: 'Jordan', latitude: 32.0728, longitude: 36.0880, timezone: 'Asia/Amman', recommendedMethod: 'mwl' },
  { id: 'irbid', name: 'إربد', nameEn: 'Irbid', country: 'الأردن', countryEn: 'Jordan', latitude: 32.5568, longitude: 35.8469, timezone: 'Asia/Amman', recommendedMethod: 'mwl' },
  { id: 'aqaba', name: 'العقبة', nameEn: 'Aqaba', country: 'الأردن', countryEn: 'Jordan', latitude: 29.5320, longitude: 35.0063, timezone: 'Asia/Amman', recommendedMethod: 'mwl' },
  { id: 'salt', name: 'السلط', nameEn: 'As-Salt', country: 'الأردن', countryEn: 'Jordan', latitude: 32.0392, longitude: 35.7272, timezone: 'Asia/Amman', recommendedMethod: 'mwl' },
  { id: 'karak', name: 'الكرك', nameEn: 'Al-Karak', country: 'الأردن', countryEn: 'Jordan', latitude: 31.1853, longitude: 35.7048, timezone: 'Asia/Amman', recommendedMethod: 'mwl' },

  // ================= سوريا (Syria) =================
  { id: 'damascus', name: 'دمشق', nameEn: 'Damascus', country: 'سوريا', countryEn: 'Syria', latitude: 33.5138, longitude: 36.2765, timezone: 'Asia/Damascus', recommendedMethod: 'mwl' },
  { id: 'aleppo', name: 'حلب', nameEn: 'Aleppo', country: 'سوريا', countryEn: 'Syria', latitude: 36.2021, longitude: 37.1343, timezone: 'Asia/Damascus', recommendedMethod: 'mwl' },
  { id: 'homs', name: 'حمص', nameEn: 'Homs', country: 'سوريا', countryEn: 'Syria', latitude: 34.7324, longitude: 36.7137, timezone: 'Asia/Damascus', recommendedMethod: 'mwl' },
  { id: 'hama', name: 'حماة', nameEn: 'Hama', country: 'سوريا', countryEn: 'Syria', latitude: 35.1318, longitude: 36.7578, timezone: 'Asia/Damascus', recommendedMethod: 'mwl' },
  { id: 'latakia', name: 'اللاذقية', nameEn: 'Latakia', country: 'سوريا', countryEn: 'Syria', latitude: 35.5317, longitude: 35.7901, timezone: 'Asia/Damascus', recommendedMethod: 'mwl' },
  { id: 'tartus', name: 'طرطوس', nameEn: 'Tartus', country: 'سوريا', countryEn: 'Syria', latitude: 34.8890, longitude: 35.8866, timezone: 'Asia/Damascus', recommendedMethod: 'mwl' },
  { id: 'idlib', name: 'إدلب', nameEn: 'Idlib', country: 'سوريا', countryEn: 'Syria', latitude: 35.9306, longitude: 36.6339, timezone: 'Asia/Damascus', recommendedMethod: 'mwl' },
  { id: 'deir_ezzor', name: 'دير الزور', nameEn: 'Deir ez-Zor', country: 'سوريا', countryEn: 'Syria', latitude: 35.3359, longitude: 40.1408, timezone: 'Asia/Damascus', recommendedMethod: 'mwl' },

  // ================= لبنان (Lebanon) =================
  { id: 'beirut', name: 'بيروت', nameEn: 'Beirut', country: 'لبنان', countryEn: 'Lebanon', latitude: 33.8938, longitude: 35.5018, timezone: 'Asia/Beirut', recommendedMethod: 'mwl' },
  { id: 'tripoli_lb', name: 'طرابلس', nameEn: 'Tripoli', country: 'لبنان', countryEn: 'Lebanon', latitude: 34.4367, longitude: 35.8497, timezone: 'Asia/Beirut', recommendedMethod: 'mwl' },
  { id: 'sidon', name: 'صيدا', nameEn: 'Sidon', country: 'لبنان', countryEn: 'Lebanon', latitude: 33.5599, longitude: 35.3756, timezone: 'Asia/Beirut', recommendedMethod: 'mwl' },
  { id: 'tyre', name: 'صور', nameEn: 'Tyre', country: 'لبنان', countryEn: 'Lebanon', latitude: 33.2705, longitude: 35.2038, timezone: 'Asia/Beirut', recommendedMethod: 'mwl' },
  { id: 'baalbek', name: 'بعلبك', nameEn: 'Baalbek', country: 'لبنان', countryEn: 'Lebanon', latitude: 34.0047, longitude: 36.2110, timezone: 'Asia/Beirut', recommendedMethod: 'mwl' },

  // ================= العراق (Iraq) =================
  { id: 'baghdad', name: 'بغداد', nameEn: 'Baghdad', country: 'العراق', countryEn: 'Iraq', latitude: 33.3152, longitude: 44.3661, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },
  { id: 'basra', name: 'البصرة', nameEn: 'Basra', country: 'العراق', countryEn: 'Iraq', latitude: 30.5085, longitude: 47.7804, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },
  { id: 'mosul', name: 'الموصل (نينوى)', nameEn: 'Mosul', country: 'العراق', countryEn: 'Iraq', latitude: 36.3400, longitude: 43.1300, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },
  { id: 'erbil', name: 'أربيل', nameEn: 'Erbil', country: 'العراق', countryEn: 'Iraq', latitude: 36.1911, longitude: 44.0092, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },
  { id: 'sulaymaniyah', name: 'السليمانية', nameEn: 'Sulaymaniyah', country: 'العراق', countryEn: 'Iraq', latitude: 35.5612, longitude: 45.4300, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },
  { id: 'kirkuk', name: 'كركوك', nameEn: 'Kirkuk', country: 'العراق', countryEn: 'Iraq', latitude: 35.4681, longitude: 44.3922, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },
  { id: 'najaf', name: 'النجف الأشرف', nameEn: 'Najaf', country: 'العراق', countryEn: 'Iraq', latitude: 31.9922, longitude: 44.3515, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },
  { id: 'karbala', name: 'كربلاء المقدسة', nameEn: 'Karbala', country: 'العراق', countryEn: 'Iraq', latitude: 32.6160, longitude: 44.0249, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },
  { id: 'ramadi', name: 'الرمادي (الأنبار)', nameEn: 'Ramadi', country: 'العراق', countryEn: 'Iraq', latitude: 33.4258, longitude: 43.2992, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },
  { id: 'hilla', name: 'الحلة (بابل)', nameEn: 'Hillah', country: 'العراق', countryEn: 'Iraq', latitude: 32.4637, longitude: 44.4196, timezone: 'Asia/Baghdad', recommendedMethod: 'mwl' },

  // ================= اليمن (Yemen) =================
  { id: 'sanaa', name: 'صنعاء', nameEn: 'Sanaa', country: 'اليمن', countryEn: 'Yemen', latitude: 15.3694, longitude: 44.1910, timezone: 'Asia/Aden', recommendedMethod: 'makkah' },
  { id: 'aden', name: 'عدن', nameEn: 'Aden', country: 'اليمن', countryEn: 'Yemen', latitude: 12.7855, longitude: 45.0187, timezone: 'Asia/Aden', recommendedMethod: 'makkah' },
  { id: 'taiz', name: 'تعز', nameEn: 'Taiz', country: 'اليمن', countryEn: 'Yemen', latitude: 13.5795, longitude: 44.0209, timezone: 'Asia/Aden', recommendedMethod: 'makkah' },
  { id: 'hodeidah', name: 'الحديدة', nameEn: 'Al Hudaydah', country: 'اليمن', countryEn: 'Yemen', latitude: 14.7978, longitude: 42.9545, timezone: 'Asia/Aden', recommendedMethod: 'makkah' },
  { id: 'mukalla', name: 'المكلا (حضرموت)', nameEn: 'Mukalla', country: 'اليمن', countryEn: 'Yemen', latitude: 14.5425, longitude: 49.1242, timezone: 'Asia/Aden', recommendedMethod: 'makkah' },
  { id: 'ibb', name: 'إب', nameEn: 'Ibb', country: 'اليمن', countryEn: 'Yemen', latitude: 13.9667, longitude: 44.1833, timezone: 'Asia/Aden', recommendedMethod: 'makkah' },

  // ================= المغرب (Morocco) =================
  { id: 'rabat', name: 'الرباط', nameEn: 'Rabat', country: 'المغرب', countryEn: 'Morocco', latitude: 34.0209, longitude: -6.8416, timezone: 'Africa/Casablanca', recommendedMethod: 'mwl' },
  { id: 'casablanca', name: 'الدار البيضاء', nameEn: 'Casablanca', country: 'المغرب', countryEn: 'Morocco', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca', recommendedMethod: 'mwl' },
  { id: 'marrakech', name: 'مراكش', nameEn: 'Marrakech', country: 'المغرب', countryEn: 'Morocco', latitude: 31.6295, longitude: -7.9811, timezone: 'Africa/Casablanca', recommendedMethod: 'mwl' },
  { id: 'fes', name: 'فاس', nameEn: 'Fes', country: 'المغرب', countryEn: 'Morocco', latitude: 34.0331, longitude: -5.0003, timezone: 'Africa/Casablanca', recommendedMethod: 'mwl' },
  { id: 'tangier', name: 'طنجة', nameEn: 'Tangier', country: 'المغرب', countryEn: 'Morocco', latitude: 35.7595, longitude: -5.8340, timezone: 'Africa/Casablanca', recommendedMethod: 'mwl' },
  { id: 'agadir', name: 'أكادير', nameEn: 'Agadir', country: 'المغرب', countryEn: 'Morocco', latitude: 30.4278, longitude: -9.5981, timezone: 'Africa/Casablanca', recommendedMethod: 'mwl' },
  { id: 'meknes', name: 'مكناس', nameEn: 'Meknes', country: 'المغرب', countryEn: 'Morocco', latitude: 33.8935, longitude: -5.5473, timezone: 'Africa/Casablanca', recommendedMethod: 'mwl' },
  { id: 'oujda', name: 'وجدة', nameEn: 'Oujda', country: 'المغرب', countryEn: 'Morocco', latitude: 34.6867, longitude: -1.9114, timezone: 'Africa/Casablanca', recommendedMethod: 'mwl' },
  { id: 'tetouan', name: 'تطوان', nameEn: 'Tetouan', country: 'المغرب', countryEn: 'Morocco', latitude: 35.5785, longitude: -5.3684, timezone: 'Africa/Casablanca', recommendedMethod: 'mwl' },

  // ================= الجزائر (Algeria) =================
  { id: 'algiers', name: 'الجزائر العاصمة', nameEn: 'Algiers', country: 'الجزائر', countryEn: 'Algeria', latitude: 36.7538, longitude: 3.0588, timezone: 'Africa/Algiers', recommendedMethod: 'mwl' },
  { id: 'oran', name: 'وهران', nameEn: 'Oran', country: 'الجزائر', countryEn: 'Algeria', latitude: 35.6987, longitude: -0.6349, timezone: 'Africa/Algiers', recommendedMethod: 'mwl' },
  { id: 'constantine', name: 'قسنطينة', nameEn: 'Constantine', country: 'الجزائر', countryEn: 'Algeria', latitude: 36.3650, longitude: 6.6147, timezone: 'Africa/Algiers', recommendedMethod: 'mwl' },
  { id: 'annaba', name: 'عنابة', nameEn: 'Annaba', country: 'الجزائر', countryEn: 'Algeria', latitude: 36.9000, longitude: 7.7667, timezone: 'Africa/Algiers', recommendedMethod: 'mwl' },
  { id: 'setif', name: 'سطيف', nameEn: 'Setif', country: 'الجزائر', countryEn: 'Algeria', latitude: 36.1905, longitude: 5.4137, timezone: 'Africa/Algiers', recommendedMethod: 'mwl' },
  { id: 'blida', name: 'البليدة', nameEn: 'Blida', country: 'الجزائر', countryEn: 'Algeria', latitude: 36.4700, longitude: 2.8300, timezone: 'Africa/Algiers', recommendedMethod: 'mwl' },
  { id: 'tlemcen', name: 'تلمسان', nameEn: 'Tlemcen', country: 'الجزائر', countryEn: 'Algeria', latitude: 34.8783, longitude: -1.3150, timezone: 'Africa/Algiers', recommendedMethod: 'mwl' },

  // ================= تونس (Tunisia) =================
  { id: 'tunis', name: 'تونس العاصمة', nameEn: 'Tunis', country: 'تونس', countryEn: 'Tunisia', latitude: 36.8065, longitude: 10.1815, timezone: 'Africa/Tunis', recommendedMethod: 'mwl' },
  { id: 'sfax', name: 'صفاقس', nameEn: 'Sfax', country: 'تونس', countryEn: 'Tunisia', latitude: 34.7406, longitude: 10.7603, timezone: 'Africa/Tunis', recommendedMethod: 'mwl' },
  { id: 'sousse', name: 'سوسة', nameEn: 'Sousse', country: 'تونس', countryEn: 'Tunisia', latitude: 35.8256, longitude: 10.6084, timezone: 'Africa/Tunis', recommendedMethod: 'mwl' },
  { id: 'kairouan', name: 'القيروان', nameEn: 'Kairouan', country: 'تونس', countryEn: 'Tunisia', latitude: 35.6781, longitude: 10.0963, timezone: 'Africa/Tunis', recommendedMethod: 'mwl' },
  { id: 'bizerte', name: 'بنزرت', nameEn: 'Bizerte', country: 'تونس', countryEn: 'Tunisia', latitude: 37.2744, longitude: 9.8739, timezone: 'Africa/Tunis', recommendedMethod: 'mwl' },

  // ================= ليبيا (Libya) =================
  { id: 'tripoli', name: 'طرابلس', nameEn: 'Tripoli', country: 'ليبيا', countryEn: 'Libya', latitude: 32.8872, longitude: 13.1913, timezone: 'Africa/Tripoli', recommendedMethod: 'egypt' },
  { id: 'benghazi', name: 'بنغازي', nameEn: 'Benghazi', country: 'ليبيا', countryEn: 'Libya', latitude: 32.1167, longitude: 20.0667, timezone: 'Africa/Tripoli', recommendedMethod: 'egypt' },
  { id: 'misrata', name: 'مصراتة', nameEn: 'Misrata', country: 'ليبيا', countryEn: 'Libya', latitude: 32.3754, longitude: 15.0925, timezone: 'Africa/Tripoli', recommendedMethod: 'egypt' },
  { id: 'sebha', name: 'سبها', nameEn: 'Sabha', country: 'ليبيا', countryEn: 'Libya', latitude: 27.0377, longitude: 14.4283, timezone: 'Africa/Tripoli', recommendedMethod: 'egypt' },

  // ================= السودان (Sudan) =================
  { id: 'khartoum', name: 'الخرطوم', nameEn: 'Khartoum', country: 'السودان', countryEn: 'Sudan', latitude: 15.5007, longitude: 32.5599, timezone: 'Africa/Khartoum', recommendedMethod: 'egypt' },
  { id: 'omdurman', name: 'أم درمان', nameEn: 'Omdurman', country: 'السودان', countryEn: 'Sudan', latitude: 15.6500, longitude: 32.4833, timezone: 'Africa/Khartoum', recommendedMethod: 'egypt' },
  { id: 'portsudan', name: 'بورتسودان', nameEn: 'Port Sudan', country: 'السودان', countryEn: 'Sudan', latitude: 19.6175, longitude: 37.2164, timezone: 'Africa/Khartoum', recommendedMethod: 'egypt' },
  { id: 'kassala', name: 'كسلا', nameEn: 'Kassala', country: 'السودان', countryEn: 'Sudan', latitude: 15.4510, longitude: 36.4000, timezone: 'Africa/Khartoum', recommendedMethod: 'egypt' },

  // ================= موريتانيا والصومال وجيبوتي وجزر القمر =================
  { id: 'nouakchott', name: 'نواكشوط', nameEn: 'Nouakchott', country: 'موريتانيا', countryEn: 'Mauritania', latitude: 18.0735, longitude: -15.9582, timezone: 'Africa/Nouakchott', recommendedMethod: 'mwl' },
  { id: 'nouadhibou', name: 'نواذيبو', nameEn: 'Nouadhibou', country: 'موريتانيا', countryEn: 'Mauritania', latitude: 20.9310, longitude: -17.0347, timezone: 'Africa/Nouakchott', recommendedMethod: 'mwl' },
  { id: 'mogadishu', name: 'مقديشو', nameEn: 'Mogadishu', country: 'الصومال', countryEn: 'Somalia', latitude: 2.0469, longitude: 45.3182, timezone: 'Africa/Mogadishu', recommendedMethod: 'mwl' },
  { id: 'hargeisa', name: 'هرجيسا', nameEn: 'Hargeisa', country: 'الصومال', countryEn: 'Somalia', latitude: 9.5600, longitude: 44.0650, timezone: 'Africa/Mogadishu', recommendedMethod: 'mwl' },
  { id: 'djibouti', name: 'جيبوتي العاصمة', nameEn: 'Djibouti City', country: 'جيبوتي', countryEn: 'Djibouti', latitude: 11.8251, longitude: 42.5903, timezone: 'Africa/Djibouti', recommendedMethod: 'mwl' },
  { id: 'moroni', name: 'موروني', nameEn: 'Moroni', country: 'جزر القمر', countryEn: 'Comoros', latitude: -11.7022, longitude: 43.2551, timezone: 'Indian/Comoro', recommendedMethod: 'mwl' },

  // ================= تركيا (Turkey) =================
  { id: 'istanbul', name: 'إسطنبول', nameEn: 'Istanbul', country: 'تركيا', countryEn: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul', recommendedMethod: 'diyanet' },
  { id: 'ankara', name: 'أنقرة', nameEn: 'Ankara', country: 'تركيا', countryEn: 'Turkey', latitude: 39.9334, longitude: 32.8597, timezone: 'Europe/Istanbul', recommendedMethod: 'diyanet' },
  { id: 'izmir', name: 'إزمير', nameEn: 'Izmir', country: 'تركيا', countryEn: 'Turkey', latitude: 38.4237, longitude: 27.1428, timezone: 'Europe/Istanbul', recommendedMethod: 'diyanet' },
  { id: 'bursa', name: 'بورصة', nameEn: 'Bursa', country: 'تركيا', countryEn: 'Turkey', latitude: 40.1885, longitude: 29.0610, timezone: 'Europe/Istanbul', recommendedMethod: 'diyanet' },
  { id: 'antalya', name: 'أنطاليا', nameEn: 'Antalya', country: 'تركيا', countryEn: 'Turkey', latitude: 36.8969, longitude: 30.7133, timezone: 'Europe/Istanbul', recommendedMethod: 'diyanet' },
  { id: 'konya', name: 'قونية', nameEn: 'Konya', country: 'تركيا', countryEn: 'Turkey', latitude: 37.8746, longitude: 32.4932, timezone: 'Europe/Istanbul', recommendedMethod: 'diyanet' },
  { id: 'gaziantep', name: 'غازي عنتاب', nameEn: 'Gaziantep', country: 'تركيا', countryEn: 'Turkey', latitude: 37.0662, longitude: 37.3833, timezone: 'Europe/Istanbul', recommendedMethod: 'diyanet' },
  { id: 'trabzon', name: 'طرابزون', nameEn: 'Trabzon', country: 'تركيا', countryEn: 'Turkey', latitude: 41.0027, longitude: 39.7168, timezone: 'Europe/Istanbul', recommendedMethod: 'diyanet' },

  // ================= آسيا الوسطى والشرق الأوسط وجنوب آسيا =================
  { id: 'islamabad', name: 'إسلام آباد', nameEn: 'Islamabad', country: 'باكستان', countryEn: 'Pakistan', latitude: 33.6844, longitude: 73.0479, timezone: 'Asia/Karachi', recommendedMethod: 'karachi' },
  { id: 'karachi', name: 'كراتشي', nameEn: 'Karachi', country: 'باكستان', countryEn: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi', recommendedMethod: 'karachi' },
  { id: 'lahore', name: 'لاهور', nameEn: 'Lahore', country: 'باكستان', countryEn: 'Pakistan', latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi', recommendedMethod: 'karachi' },
  { id: 'peshawar', name: 'بيشاور', nameEn: 'Peshawar', country: 'باكستان', countryEn: 'Pakistan', latitude: 34.0151, longitude: 71.5249, timezone: 'Asia/Karachi', recommendedMethod: 'karachi' },
  { id: 'kabul', name: 'كابل', nameEn: 'Kabul', country: 'أفغانستان', countryEn: 'Afghanistan', latitude: 34.5553, longitude: 69.2075, timezone: 'Asia/Kabul', recommendedMethod: 'karachi' },
  { id: 'delhi', name: 'نيودلهي', nameEn: 'New Delhi', country: 'الهند', countryEn: 'India', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata', recommendedMethod: 'karachi' },
  { id: 'mumbai', name: 'مومباي', nameEn: 'Mumbai', country: 'الهند', countryEn: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata', recommendedMethod: 'karachi' },
  { id: 'hyderabad', name: 'حيدر آباد', nameEn: 'Hyderabad', country: 'الهند', countryEn: 'India', latitude: 17.3850, longitude: 78.4867, timezone: 'Asia/Kolkata', recommendedMethod: 'karachi' },
  { id: 'bangalore', name: 'بنغالور', nameEn: 'Bengaluru', country: 'الهند', countryEn: 'India', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata', recommendedMethod: 'karachi' },
  { id: 'dhaka', name: 'دكا', nameEn: 'Dhaka', country: 'بنغلاديش', countryEn: 'Bangladesh', latitude: 23.8103, longitude: 90.4125, timezone: 'Asia/Dhaka', recommendedMethod: 'karachi' },
  { id: 'chittagong', name: 'شيتاغونغ', nameEn: 'Chittagong', country: 'بنغلاديش', countryEn: 'Bangladesh', latitude: 22.3569, longitude: 91.7832, timezone: 'Asia/Dhaka', recommendedMethod: 'karachi' },
  { id: 'colombo', name: 'كولومبو', nameEn: 'Colombo', country: 'سريلانكا', countryEn: 'Sri Lanka', latitude: 6.9271, longitude: 79.8612, timezone: 'Asia/Colombo', recommendedMethod: 'karachi' },
  { id: 'male', name: 'ماليه', nameEn: 'Male', country: 'المالديف', countryEn: 'Maldives', latitude: 4.1755, longitude: 73.5093, timezone: 'Indian/Maldives', recommendedMethod: 'mwl' },
  { id: 'kathmandu', name: 'كاتماندو', nameEn: 'Kathmandu', country: 'نيبال', countryEn: 'Nepal', latitude: 27.7172, longitude: 85.3240, timezone: 'Asia/Kathmandu', recommendedMethod: 'karachi' },

  // ================= جنوب شرق وشرق آسيا =================
  { id: 'jakarta', name: 'جاكرتا', nameEn: 'Jakarta', country: 'إندونيسيا', countryEn: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta', recommendedMethod: 'mwl' },
  { id: 'surabaya', name: 'سورابايا', nameEn: 'Surabaya', country: 'إندونيسيا', countryEn: 'Indonesia', latitude: -7.2575, longitude: 112.7521, timezone: 'Asia/Jakarta', recommendedMethod: 'mwl' },
  { id: 'bandung', name: 'باندونغ', nameEn: 'Bandung', country: 'إندونيسيا', countryEn: 'Indonesia', latitude: -6.9175, longitude: 107.6191, timezone: 'Asia/Jakarta', recommendedMethod: 'mwl' },
  { id: 'medan', name: 'ميدان', nameEn: 'Medan', country: 'إندونيسيا', countryEn: 'Indonesia', latitude: 3.5952, longitude: 98.6722, timezone: 'Asia/Jakarta', recommendedMethod: 'mwl' },
  { id: 'kualalumpur', name: 'كوالالمبور', nameEn: 'Kuala Lumpur', country: 'ماليزيا', countryEn: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur', recommendedMethod: 'mwl' },
  { id: 'georgetown', name: 'جورج تاون (بينانغ)', nameEn: 'George Town', country: 'ماليزيا', countryEn: 'Malaysia', latitude: 5.4141, longitude: 100.3288, timezone: 'Asia/Kuala_Lumpur', recommendedMethod: 'mwl' },
  { id: 'johor_bahru', name: 'جوهور بهرو', nameEn: 'Johor Bahru', country: 'ماليزيا', countryEn: 'Malaysia', latitude: 1.4927, longitude: 103.7414, timezone: 'Asia/Kuala_Lumpur', recommendedMethod: 'mwl' },
  { id: 'singapore', name: 'سنغافورة', nameEn: 'Singapore', country: 'سنغافورة', countryEn: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore', recommendedMethod: 'mwl' },
  { id: 'bandarseribegawan', name: 'بندر سري بكاوان', nameEn: 'Bandar Seri Begawan', country: 'بروناي', countryEn: 'Brunei', latitude: 4.9031, longitude: 114.9398, timezone: 'Asia/Brunei', recommendedMethod: 'mwl' },
  { id: 'bangkok', name: 'بانكوك', nameEn: 'Bangkok', country: 'تايلاند', countryEn: 'Thailand', latitude: 13.7563, longitude: 100.5018, timezone: 'Asia/Bangkok', recommendedMethod: 'mwl' },
  { id: 'manila', name: 'مانيلا', nameEn: 'Manila', country: 'الفلبين', countryEn: 'Philippines', latitude: 14.5995, longitude: 120.9842, timezone: 'Asia/Manila', recommendedMethod: 'mwl' },
  { id: 'tokyo', name: 'طوكيو', nameEn: 'Tokyo', country: 'اليابان', countryEn: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo', recommendedMethod: 'mwl' },
  { id: 'osaka', name: 'أوساكا', nameEn: 'Osaka', country: 'اليابان', countryEn: 'Japan', latitude: 34.6937, longitude: 135.5023, timezone: 'Asia/Tokyo', recommendedMethod: 'mwl' },
  { id: 'seoul', name: 'سيول', nameEn: 'Seoul', country: 'كوريا الجنوبية', countryEn: 'South Korea', latitude: 37.5665, longitude: 126.9780, timezone: 'Asia/Seoul', recommendedMethod: 'mwl' },
  { id: 'beijing', name: 'بكين', nameEn: 'Beijing', country: 'الصين', countryEn: 'China', latitude: 39.9042, longitude: 116.4074, timezone: 'Asia/Shanghai', recommendedMethod: 'mwl' },
  { id: 'shanghai', name: 'شنغهاي', nameEn: 'Shanghai', country: 'الصين', countryEn: 'China', latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai', recommendedMethod: 'mwl' },
  { id: 'guangzhou', name: 'غوانغجو', nameEn: 'Guangzhou', country: 'الصين', countryEn: 'China', latitude: 23.1291, longitude: 113.2644, timezone: 'Asia/Shanghai', recommendedMethod: 'mwl' },
  { id: 'hongkong', name: 'هونغ كونغ', nameEn: 'Hong Kong', country: 'الصين', countryEn: 'China', latitude: 22.3193, longitude: 114.1694, timezone: 'Asia/Hong_Kong', recommendedMethod: 'mwl' },
  { id: 'tashkent', name: 'طشقند', nameEn: 'Tashkent', country: 'أوزبكستان', countryEn: 'Uzbekistan', latitude: 41.2995, longitude: 69.2401, timezone: 'Asia/Tashkent', recommendedMethod: 'mwl' },
  { id: 'samarkand', name: 'سمرقند', nameEn: 'Samarkand', country: 'أوزبكستان', countryEn: 'Uzbekistan', latitude: 39.6542, longitude: 66.9597, timezone: 'Asia/Samarkand', recommendedMethod: 'mwl' },
  { id: 'astana', name: 'أستانا', nameEn: 'Astana', country: 'كازاخستان', countryEn: 'Kazakhstan', latitude: 51.1694, longitude: 71.4491, timezone: 'Asia/Almaty', recommendedMethod: 'mwl' },
  { id: 'almaty', name: 'ألماتي', nameEn: 'Almaty', country: 'كازاخستان', countryEn: 'Kazakhstan', latitude: 43.2220, longitude: 76.8512, timezone: 'Asia/Almaty', recommendedMethod: 'mwl' },
  { id: 'baku', name: 'باكو', nameEn: 'Baku', country: 'أذربيجان', countryEn: 'Azerbaijan', latitude: 40.4093, longitude: 49.8671, timezone: 'Asia/Baku', recommendedMethod: 'mwl' },
  { id: 'bishkek', name: 'بيشكيك', nameEn: 'Bishkek', country: 'قيرغيزستان', countryEn: 'Kyrgyzstan', latitude: 42.8746, longitude: 74.5698, timezone: 'Asia/Bishkek', recommendedMethod: 'mwl' },
  { id: 'dushanbe', name: 'دوشنبه', nameEn: 'Dushanbe', country: 'طاجيكستان', countryEn: 'Tajikistan', latitude: 38.5598, longitude: 68.7870, timezone: 'Asia/Dushanbe', recommendedMethod: 'mwl' },
  { id: 'ashgabat', name: 'عشق آباد', nameEn: 'Ashgabat', country: 'تركمانستان', countryEn: 'Turkmenistan', latitude: 37.9601, longitude: 58.3261, timezone: 'Asia/Ashgabat', recommendedMethod: 'mwl' },
  { id: 'tehran', name: 'طهران', nameEn: 'Tehran', country: 'إيران', countryEn: 'Iran', latitude: 35.6892, longitude: 51.3890, timezone: 'Asia/Tehran', recommendedMethod: 'mwl' },

  // ================= أوروبا (Europe) =================
  { id: 'london', name: 'لندن', nameEn: 'London', country: 'المملكة المتحدة', countryEn: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London', recommendedMethod: 'mwl' },
  { id: 'birmingham', name: 'برمنغهام', nameEn: 'Birmingham', country: 'المملكة المتحدة', countryEn: 'United Kingdom', latitude: 52.4862, longitude: -1.8904, timezone: 'Europe/London', recommendedMethod: 'mwl' },
  { id: 'manchester', name: 'مانشستر', nameEn: 'Manchester', country: 'المملكة المتحدة', countryEn: 'United Kingdom', latitude: 53.4808, longitude: -2.2426, timezone: 'Europe/London', recommendedMethod: 'mwl' },
  { id: 'edinburgh', name: 'إدنبرة', nameEn: 'Edinburgh', country: 'المملكة المتحدة', countryEn: 'United Kingdom', latitude: 55.9533, longitude: -3.1883, timezone: 'Europe/London', recommendedMethod: 'mwl' },
  { id: 'dublin', name: 'دبلن', nameEn: 'Dublin', country: 'أيرلندا', countryEn: 'Ireland', latitude: 53.3498, longitude: -6.2603, timezone: 'Europe/Dublin', recommendedMethod: 'mwl' },
  { id: 'paris', name: 'باريس', nameEn: 'Paris', country: 'فرنسا', countryEn: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', recommendedMethod: 'mwl' },
  { id: 'marseille', name: 'مارسيليا', nameEn: 'Marseille', country: 'فرنسا', countryEn: 'France', latitude: 43.2965, longitude: 5.3698, timezone: 'Europe/Paris', recommendedMethod: 'mwl' },
  { id: 'lyon', name: 'ليون', nameEn: 'Lyon', country: 'فرنسا', countryEn: 'France', latitude: 45.7640, longitude: 4.8357, timezone: 'Europe/Paris', recommendedMethod: 'mwl' },
  { id: 'berlin', name: 'برلين', nameEn: 'Berlin', country: 'ألمانيا', countryEn: 'Germany', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin', recommendedMethod: 'mwl' },
  { id: 'frankfurt', name: 'فرانكفورت', nameEn: 'Frankfurt', country: 'ألمانيا', countryEn: 'Germany', latitude: 50.1109, longitude: 8.6821, timezone: 'Europe/Berlin', recommendedMethod: 'mwl' },
  { id: 'munich', name: 'ميونخ', nameEn: 'Munich', country: 'ألمانيا', countryEn: 'Germany', latitude: 48.1351, longitude: 11.5820, timezone: 'Europe/Berlin', recommendedMethod: 'mwl' },
  { id: 'cologne', name: 'كولونيا', nameEn: 'Cologne', country: 'ألمانيا', countryEn: 'Germany', latitude: 50.9375, longitude: 6.9603, timezone: 'Europe/Berlin', recommendedMethod: 'mwl' },
  { id: 'hamburg', name: 'هامبورغ', nameEn: 'Hamburg', country: 'ألمانيا', countryEn: 'Germany', latitude: 53.5511, longitude: 9.9937, timezone: 'Europe/Berlin', recommendedMethod: 'mwl' },
  { id: 'amsterdam', name: 'أمستردام', nameEn: 'Amsterdam', country: 'هولندا', countryEn: 'Netherlands', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam', recommendedMethod: 'mwl' },
  { id: 'rotterdam', name: 'روتردام', nameEn: 'Rotterdam', country: 'هولندا', countryEn: 'Netherlands', latitude: 51.9244, longitude: 4.4777, timezone: 'Europe/Amsterdam', recommendedMethod: 'mwl' },
  { id: 'brussels', name: 'بروكسل', nameEn: 'Brussels', country: 'بلجيكا', countryEn: 'Belgium', latitude: 50.8503, longitude: 4.3517, timezone: 'Europe/Brussels', recommendedMethod: 'mwl' },
  { id: 'antwerp', name: 'أنتويرب', nameEn: 'Antwerp', country: 'بلجيكا', countryEn: 'Belgium', latitude: 51.2194, longitude: 4.4025, timezone: 'Europe/Brussels', recommendedMethod: 'mwl' },
  { id: 'madrid', name: 'مدريد', nameEn: 'Madrid', country: 'إسبانيا', countryEn: 'Spain', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid', recommendedMethod: 'mwl' },
  { id: 'barcelona', name: 'برشلونة', nameEn: 'Barcelona', country: 'إسبانيا', countryEn: 'Spain', latitude: 41.3879, longitude: 2.1699, timezone: 'Europe/Madrid', recommendedMethod: 'mwl' },
  { id: 'granada', name: 'غرناطة', nameEn: 'Granada', country: 'إسبانيا', countryEn: 'Spain', latitude: 37.1773, longitude: -3.5986, timezone: 'Europe/Madrid', recommendedMethod: 'mwl' },
  { id: 'cordoba', name: 'قرطبة', nameEn: 'Cordoba', country: 'إسبانيا', countryEn: 'Spain', latitude: 37.8882, longitude: -4.7794, timezone: 'Europe/Madrid', recommendedMethod: 'mwl' },
  { id: 'lisbon', name: 'لشبونة', nameEn: 'Lisbon', country: 'البرتغال', countryEn: 'Portugal', latitude: 38.7223, longitude: -9.1393, timezone: 'Europe/Lisbon', recommendedMethod: 'mwl' },
  { id: 'rome', name: 'روما', nameEn: 'Rome', country: 'إيطاليا', countryEn: 'Italy', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome', recommendedMethod: 'mwl' },
  { id: 'milan', name: 'ميلانو', nameEn: 'Milan', country: 'إيطاليا', countryEn: 'Italy', latitude: 45.4642, longitude: 9.1900, timezone: 'Europe/Rome', recommendedMethod: 'mwl' },
  { id: 'vienna', name: 'فيينا', nameEn: 'Vienna', country: 'النمسا', countryEn: 'Austria', latitude: 48.2082, longitude: 16.3738, timezone: 'Europe/Vienna', recommendedMethod: 'mwl' },
  { id: 'zurich', name: 'زيورخ', nameEn: 'Zurich', country: 'سويسرا', countryEn: 'Switzerland', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich', recommendedMethod: 'mwl' },
  { id: 'geneva', name: 'جنيف', nameEn: 'Geneva', country: 'سويسرا', countryEn: 'Switzerland', latitude: 46.2044, longitude: 6.1432, timezone: 'Europe/Zurich', recommendedMethod: 'mwl' },
  { id: 'stockholm', name: 'ستوكهولم', nameEn: 'Stockholm', country: 'السويد', countryEn: 'Sweden', latitude: 59.3293, longitude: 18.0686, timezone: 'Europe/Stockholm', recommendedMethod: 'mwl' },
  { id: 'malmo', name: 'مالمو', nameEn: 'Malmo', country: 'السويد', countryEn: 'Sweden', latitude: 55.6050, longitude: 13.0038, timezone: 'Europe/Stockholm', recommendedMethod: 'mwl' },
  { id: 'oslo', name: 'أوسلو', nameEn: 'Oslo', country: 'النرويج', countryEn: 'Norway', latitude: 59.9139, longitude: 10.7522, timezone: 'Europe/Oslo', recommendedMethod: 'mwl' },
  { id: 'copenhagen', name: 'كوبنهاغن', nameEn: 'Copenhagen', country: 'الدنمارك', countryEn: 'Denmark', latitude: 55.6761, longitude: 12.5683, timezone: 'Europe/Copenhagen', recommendedMethod: 'mwl' },
  { id: 'helsinki', name: 'هلسنكي', nameEn: 'Helsinki', country: 'فنلندا', countryEn: 'Finland', latitude: 60.1699, longitude: 24.9384, timezone: 'Europe/Helsinki', recommendedMethod: 'mwl' },
  { id: 'warsaw', name: 'وارسو', nameEn: 'Warsaw', country: 'بولندا', countryEn: 'Poland', latitude: 52.2297, longitude: 21.0122, timezone: 'Europe/Warsaw', recommendedMethod: 'mwl' },
  { id: 'prague', name: 'براغ', nameEn: 'Prague', country: 'التشيك', countryEn: 'Czechia', latitude: 50.0755, longitude: 14.4378, timezone: 'Europe/Prague', recommendedMethod: 'mwl' },
  { id: 'budapest', name: 'بودابست', nameEn: 'Budapest', country: 'المجر', countryEn: 'Hungary', latitude: 47.4979, longitude: 19.0402, timezone: 'Europe/Budapest', recommendedMethod: 'mwl' },
  { id: 'athens', name: 'أثينا', nameEn: 'Athens', country: 'اليونان', countryEn: 'Greece', latitude: 37.9838, longitude: 23.7275, timezone: 'Europe/Athens', recommendedMethod: 'mwl' },
  { id: 'sarajevo', name: 'سراييفو', nameEn: 'Sarajevo', country: 'البوسنة والهرسك', countryEn: 'Bosnia and Herzegovina', latitude: 43.8563, longitude: 18.4131, timezone: 'Europe/Sarajevo', recommendedMethod: 'mwl' },
  { id: 'tirana', name: 'تيرانا', nameEn: 'Tirana', country: 'ألبانيا', countryEn: 'Albania', latitude: 41.3275, longitude: 19.8187, timezone: 'Europe/Tirane', recommendedMethod: 'mwl' },
  { id: 'prishtina', name: 'بريشتينا', nameEn: 'Pristina', country: 'كوسوفو', countryEn: 'Kosovo', latitude: 42.6629, longitude: 21.1655, timezone: 'Europe/Belgrade', recommendedMethod: 'mwl' },
  { id: 'bucharest', name: 'بوخارست', nameEn: 'Bucharest', country: 'رومانيا', countryEn: 'Romania', latitude: 44.4268, longitude: 26.1025, timezone: 'Europe/Bucharest', recommendedMethod: 'mwl' },
  { id: 'sofia', name: 'صوفيا', nameEn: 'Sofia', country: 'بلغاريا', countryEn: 'Bulgaria', latitude: 42.6977, longitude: 23.3219, timezone: 'Europe/Sofia', recommendedMethod: 'mwl' },
  { id: 'kyiv', name: 'كييف', nameEn: 'Kyiv', country: 'أوكرانيا', countryEn: 'Ukraine', latitude: 50.4501, longitude: 30.5234, timezone: 'Europe/Kyiv', recommendedMethod: 'mwl' },
  { id: 'moscow', name: 'موسكو', nameEn: 'Moscow', country: 'روسيا', countryEn: 'Russia', latitude: 55.7558, longitude: 37.6173, timezone: 'Europe/Moscow', recommendedMethod: 'mwl' },
  { id: 'kazan', name: 'قازان', nameEn: 'Kazan', country: 'روسيا', countryEn: 'Russia', latitude: 55.8304, longitude: 49.0661, timezone: 'Europe/Moscow', recommendedMethod: 'mwl' },

  // ================= أمريكا الشمالية والجنوبية =================
  { id: 'newyork', name: 'نيويورك', nameEn: 'New York', country: 'الولايات المتحدة', countryEn: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York', recommendedMethod: 'isna' },
  { id: 'washington', name: 'واشنطن العاصمة', nameEn: 'Washington, D.C.', country: 'الولايات المتحدة', countryEn: 'United States', latitude: 38.9072, longitude: -77.0369, timezone: 'America/New_York', recommendedMethod: 'isna' },
  { id: 'chicago', name: 'شيكاغو', nameEn: 'Chicago', country: 'الولايات المتحدة', countryEn: 'United States', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago', recommendedMethod: 'isna' },
  { id: 'dearborn', name: 'ديربورن (ميشيغان)', nameEn: 'Dearborn', country: 'الولايات المتحدة', countryEn: 'United States', latitude: 42.3223, longitude: -83.1763, timezone: 'America/Detroit', recommendedMethod: 'isna' },
  { id: 'losangeles', name: 'لوس أنجلوس', nameEn: 'Los Angeles', country: 'الولايات المتحدة', countryEn: 'United States', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles', recommendedMethod: 'isna' },
  { id: 'houston', name: 'هيوستن', nameEn: 'Houston', country: 'الولايات المتحدة', countryEn: 'United States', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago', recommendedMethod: 'isna' },
  { id: 'dallas', name: 'دالاس', nameEn: 'Dallas', country: 'الولايات المتحدة', countryEn: 'United States', latitude: 32.7767, longitude: -96.7970, timezone: 'America/Chicago', recommendedMethod: 'isna' },
  { id: 'miami', name: 'ميامي', nameEn: 'Miami', country: 'الولايات المتحدة', countryEn: 'United States', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York', recommendedMethod: 'isna' },
  { id: 'sanfrancisco', name: 'سان فرانسيسكو', nameEn: 'San Francisco', country: 'الولايات المتحدة', countryEn: 'United States', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles', recommendedMethod: 'isna' },
  { id: 'toronto', name: 'تورونتو', nameEn: 'Toronto', country: 'كندا', countryEn: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto', recommendedMethod: 'isna' },
  { id: 'montreal', name: 'مونتريال', nameEn: 'Montreal', country: 'كندا', countryEn: 'Canada', latitude: 45.5017, longitude: -73.5673, timezone: 'America/Toronto', recommendedMethod: 'isna' },
  { id: 'vancouver', name: 'فانكوفر', nameEn: 'Vancouver', country: 'كندا', countryEn: 'Canada', latitude: 49.2827, longitude: -123.1207, timezone: 'America/Vancouver', recommendedMethod: 'isna' },
  { id: 'ottawa', name: 'أوتاوا', nameEn: 'Ottawa', country: 'كندا', countryEn: 'Canada', latitude: 45.4215, longitude: -75.6972, timezone: 'America/Toronto', recommendedMethod: 'isna' },
  { id: 'mexico_city', name: 'مكسيكو سيتي', nameEn: 'Mexico City', country: 'المكسيك', countryEn: 'Mexico', latitude: 19.4326, longitude: -99.1332, timezone: 'America/Mexico_City', recommendedMethod: 'isna' },
  { id: 'sao_paulo', name: 'ساو باولو', nameEn: 'Sao Paulo', country: 'البرازيل', countryEn: 'Brazil', latitude: -23.5505, longitude: -46.6333, timezone: 'America/Sao_Paulo', recommendedMethod: 'mwl' },
  { id: 'rio', name: 'ريو دي جانيرو', nameEn: 'Rio de Janeiro', country: 'البرازيل', countryEn: 'Brazil', latitude: -22.9068, longitude: -43.1729, timezone: 'America/Sao_Paulo', recommendedMethod: 'mwl' },
  { id: 'buenos_aires', name: 'بوينس آيرس', nameEn: 'Buenos Aires', country: 'الأرجنتين', countryEn: 'Argentina', latitude: -34.6037, longitude: -58.3816, timezone: 'America/Argentina/Buenos_Aires', recommendedMethod: 'mwl' },
  { id: 'bogota', name: 'بوغوتا', nameEn: 'Bogota', country: 'كولومبيا', countryEn: 'Colombia', latitude: 4.7110, longitude: -74.0721, timezone: 'America/Bogota', recommendedMethod: 'mwl' },
  { id: 'santiago', name: 'سانتياغو', nameEn: 'Santiago', country: 'تشيلي', countryEn: 'Chile', latitude: -33.4489, longitude: -70.6693, timezone: 'America/Santiago', recommendedMethod: 'mwl' },

  // ================= أفريقيا وأوقيانوسيا =================
  { id: 'lagos', name: 'لاغوس', nameEn: 'Lagos', country: 'نيجيريا', countryEn: 'Nigeria', latitude: 6.5244, longitude: 3.3792, timezone: 'Africa/Lagos', recommendedMethod: 'egypt' },
  { id: 'abuja', name: 'أبوجا', nameEn: 'Abuja', country: 'نيجيريا', countryEn: 'Nigeria', latitude: 9.0765, longitude: 7.3986, timezone: 'Africa/Lagos', recommendedMethod: 'egypt' },
  { id: 'kano', name: 'كانو', nameEn: 'Kano', country: 'نيجيريا', countryEn: 'Nigeria', latitude: 12.0022, longitude: 8.5920, timezone: 'Africa/Lagos', recommendedMethod: 'egypt' },
  { id: 'dakar', name: 'داكار', nameEn: 'Dakar', country: 'السنغال', countryEn: 'Senegal', latitude: 14.7167, longitude: -17.4677, timezone: 'Africa/Dakar', recommendedMethod: 'mwl' },
  { id: 'bamako', name: 'باماكو', nameEn: 'Bamako', country: 'مالي', countryEn: 'Mali', latitude: 12.6392, longitude: -8.0029, timezone: 'Africa/Bamako', recommendedMethod: 'mwl' },
  { id: 'niamey', name: 'نيامي', nameEn: 'Niamey', country: 'النيجر', countryEn: 'Niger', latitude: 13.5116, longitude: 2.1254, timezone: 'Africa/Niamey', recommendedMethod: 'mwl' },
  { id: 'ndjamena', name: 'نجامينا', nameEn: 'NDjamena', country: 'تشاد', countryEn: 'Chad', latitude: 12.1348, longitude: 15.0557, timezone: 'Africa/Ndjamena', recommendedMethod: 'egypt' },
  { id: 'accra', name: 'أكرا', nameEn: 'Accra', country: 'غانا', countryEn: 'Ghana', latitude: 5.6037, longitude: -0.1870, timezone: 'Africa/Accra', recommendedMethod: 'mwl' },
  { id: 'abidjan', name: 'أبيدجان', nameEn: 'Abidjan', country: 'ساحل العاج', countryEn: 'Ivory Coast', latitude: 5.3600, longitude: -4.0083, timezone: 'Africa/Abidjan', recommendedMethod: 'mwl' },
  { id: 'addis_ababa', name: 'أديس أبابا', nameEn: 'Addis Ababa', country: 'إثيوبيا', countryEn: 'Ethiopia', latitude: 9.0320, longitude: 38.7469, timezone: 'Africa/Addis_Ababa', recommendedMethod: 'mwl' },
  { id: 'nairobi', name: 'نيروبي', nameEn: 'Nairobi', country: 'كينيا', countryEn: 'Kenya', latitude: -1.2921, longitude: 36.8219, timezone: 'Africa/Nairobi', recommendedMethod: 'mwl' },
  { id: 'dar_es_salaam', name: 'دار السلام', nameEn: 'Dar es Salaam', country: 'تنزانيا', countryEn: 'Tanzania', latitude: -6.7924, longitude: 39.2083, timezone: 'Africa/Dar_es_Salaam', recommendedMethod: 'mwl' },
  { id: 'kampala', name: 'كمبالا', nameEn: 'Kampala', country: 'أوغندا', countryEn: 'Uganda', latitude: 0.3476, longitude: 32.5825, timezone: 'Africa/Kampala', recommendedMethod: 'mwl' },
  { id: 'johannesburg', name: 'جوهانسبرغ', nameEn: 'Johannesburg', country: 'جنوب أفريقيا', countryEn: 'South Africa', latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg', recommendedMethod: 'mwl' },
  { id: 'capetown', name: 'كيب تاون', nameEn: 'Cape Town', country: 'جنوب أفريقيا', countryEn: 'South Africa', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg', recommendedMethod: 'mwl' },
  { id: 'sydney', name: 'سيدني', nameEn: 'Sydney', country: 'أستراليا', countryEn: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney', recommendedMethod: 'mwl' },
  { id: 'melbourne', name: 'ملبورن', nameEn: 'Melbourne', country: 'أستراليا', countryEn: 'Australia', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne', recommendedMethod: 'mwl' },
  { id: 'perth', name: 'بيرث', nameEn: 'Perth', country: 'أستراليا', countryEn: 'Australia', latitude: -31.9505, longitude: 115.8605, timezone: 'Australia/Perth', recommendedMethod: 'mwl' },
  { id: 'auckland', name: 'أوكلاند', nameEn: 'Auckland', country: 'نيوزيلندا', countryEn: 'New Zealand', latitude: -36.8485, longitude: 174.7633, timezone: 'Pacific/Auckland', recommendedMethod: 'mwl' },
];

const COUNTRY_CODE_BY_EN: Record<string, string> = {};
for (const c of ALL_WORLD_COUNTRIES_DATA) {
  COUNTRY_CODE_BY_EN[c.nameEn.toLowerCase()] = c.code;
  COUNTRY_CODE_BY_EN[c.nameAr] = c.code;
}

const EXPANDED_GLOBAL_CITIES: WorldCity[] = ALL_WORLD_COUNTRIES_DATA.flatMap((country) =>
  country.cities.map((city) => ({
    id: city.id,
    name: city.nameAr,
    nameEn: city.nameEn,
    country: country.nameAr,
    countryEn: country.nameEn,
    countryCode: country.code,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
    recommendedMethod: country.recommendedMethod,
  }))
);

/**
 * Combined offline database including all Egyptian Governorates, Cities, Centers, Villages, and All World Countries & Cities
 */
export const COMBINED_OFFLINE_CITIES: WorldCity[] = (() => {
  const seenKeys = new Set<string>();
  const result: WorldCity[] = [];

  const addCity = (city: WorldCity) => {
    const code =
      city.countryCode ||
      COUNTRY_CODE_BY_EN[city.countryEn.toLowerCase()] ||
      COUNTRY_CODE_BY_EN[city.country] ||
      (city.country === 'مصر' ? 'EG' : 'GL');
    const key = `${city.country}_${city.nameEn.toLowerCase()}_${city.name}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({ ...city, countryCode: code });
    }
  };

  for (const c of ALL_EGYPT_WORLD_CITIES) {
    addCity({ ...c, countryCode: 'EG' });
  }
  for (const c of WORLD_CITIES) {
    if (c.country !== 'مصر') addCity(c);
  }
  for (const c of EXPANDED_GLOBAL_CITIES) {
    if (c.country !== 'مصر') addCity(c);
  }

  return result;
})();

const SAVED_LOCATION_STORAGE_KEY = 'moazen_saved_location_v1';
const LOCATION_CONFIRMED_STORAGE_KEY = 'moazen_location_confirmed_v1';
const FIRST_GPS_PROMPTED_KEY = 'moazen_first_gps_prompted_v1';

export function hasUserConfirmedLocation(): boolean {
  try {
    return localStorage.getItem(LOCATION_CONFIRMED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markUserLocationConfirmed(): void {
  try {
    localStorage.setItem(LOCATION_CONFIRMED_STORAGE_KEY, 'true');
  } catch {
    // ignore
  }
}

export function hasPromptedFirstGps(): boolean {
  try {
    return localStorage.getItem(FIRST_GPS_PROMPTED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markFirstGpsPrompted(): void {
  try {
    localStorage.setItem(FIRST_GPS_PROMPTED_KEY, 'true');
  } catch {
    // ignore
  }
}

/**
 * Resets all onboarding, permissions, and first-time setup flags when user logs out
 */
export function resetAllFirstTimeOnboardingFlags(): void {
  try {
    localStorage.removeItem(LOCATION_CONFIRMED_STORAGE_KEY);
    localStorage.removeItem(FIRST_GPS_PROMPTED_KEY);
    localStorage.removeItem('moazen_first_run_permissions_seen_v1');
  } catch {
    // ignore
  }
}

export function savePersistentLocation(city: {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}): void {
  try {
    localStorage.setItem(SAVED_LOCATION_STORAGE_KEY, JSON.stringify(city));
    markUserLocationConfirmed();
    window.dispatchEvent(new CustomEvent('locationUpdated', { detail: city }));
  } catch {
    // ignore
  }
}

export function getPersistentSavedLocation(): {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
} | null {
  try {
    const raw = localStorage.getItem(SAVED_LOCATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.latitude === 'number' &&
        typeof parsed.longitude === 'number' &&
        parsed.name
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Returns all unique countries in COMBINED_OFFLINE_CITIES with their ISO codes and city counts
 */
export function getWorldCountries(searchQuery?: string): WorldCountryInfo[] {
  const map = new Map<string, WorldCountryInfo>();
  for (const city of COMBINED_OFFLINE_CITIES) {
    const existing = map.get(city.country);
    if (existing) {
      existing.cityCount += 1;
    } else {
      map.set(city.country, {
        country: city.country,
        countryEn: city.countryEn,
        countryCode: city.countryCode || 'GL',
        cityCount: 1,
      });
    }
  }
  const all = Array.from(map.values());
  if (!searchQuery || !searchQuery.trim()) return all;
  const q = searchQuery.trim().toLowerCase();
  return all.filter(
    (c) =>
      c.country.toLowerCase().includes(q) ||
      c.countryEn.toLowerCase().includes(q) ||
      c.countryCode.toLowerCase().includes(q)
  );
}

/**
 * Filter world & Egyptian cities/centers/villages by country and/or search term in Arabic, English, or Country Code
 */
export function searchWorldCities(query: string, countryFilter?: string): WorldCity[] {
  const q = query.trim().toLowerCase();
  const baseList =
    countryFilter && countryFilter !== 'all'
      ? COMBINED_OFFLINE_CITIES.filter(
          (c) => c.country === countryFilter || c.countryCode === countryFilter
        )
      : COMBINED_OFFLINE_CITIES;

  if (!q) return baseList;

  return baseList.filter((city) => {
    return (
      city.name.toLowerCase().includes(q) ||
      city.nameEn.toLowerCase().includes(q) ||
      city.country.toLowerCase().includes(q) ||
      city.countryEn.toLowerCase().includes(q) ||
      (city.countryCode && city.countryCode.toLowerCase().includes(q))
    );
  });
}

/**
 * Find closest city/center/village from coordinates (Haversine formula)
 * Uses the expanded Egyptian Governorates/Cities/Centers/Villages + World Cities database
 */
export function findClosestWorldCity(lat: number, lng: number): WorldCity {
  const toRad = (x: number) => (x * Math.PI) / 180;
  let minDistance = Infinity;
  let closest = COMBINED_OFFLINE_CITIES[0];

  for (const city of COMBINED_OFFLINE_CITIES) {
    const dLat = toRad(city.latitude - lat);
    const dLng = toRad(city.longitude - lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(city.latitude)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = 6371 * c; // Earth radius in km

    if (d < minDistance) {
      minDistance = d;
      closest = city;
    }
  }

  return closest;
}

/**
 * Smart GPS Location Detection (Supports Offline GPS + Online Fast Reverse Geocoding)
 * - Requests permission on first use
 * - Works offline when GPS signal is available using local Egyptian & World Haversine database
 * - Uses internet when available to refine location name and speed up detection
 * - Saves last detected location in localStorage
 * - NEVER changes or overwrites the saved location when detection fails
 */
export function detectSmartGpsLocation(
  onSuccess: (
    city: {
      id: string;
      name: string;
      country: string;
      latitude: number;
      longitude: number;
      timezone: string;
      recommendedMethod?: string;
    },
    message: string
  ) => void,
  onError: (errorMessage: string) => void
): void {
  markFirstGpsPrompted();

  try {
    const win = window as unknown as {
      AndroidBridge?: { requestLocationPermission?: () => void };
      AndroidAzan?: { requestLocationPermission?: () => void };
    };
    win.AndroidBridge?.requestLocationPermission?.();
    win.AndroidAzan?.requestLocationPermission?.();
  } catch {
    // ignore
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError(
      'خدمة تحديد الموقع GPS غير مدعومة على هذا الجهاز. تم الاحتفاظ بموقعك المحفوظ دون تغيير، ويمكنك اختيار محافظتك أو مدينتك يدويًا دون إنترنت.'
    );
    return;
  }

  const processCoordinates = async (lat: number, lng: number) => {
    const closestOffline = findClosestWorldCity(lat, lng);
    let resolvedName = closestOffline.name;
    let resolvedCountry = closestOffline.country;

    // If internet is available, enhance location name accuracy quickly via reverse geocoding
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const locality = data.locality || data.city || '';
          const principalSubdivision = data.principalSubdivision || '';
          if (locality) {
            resolvedName =
              principalSubdivision && !locality.includes(principalSubdivision)
                ? `${locality} (${principalSubdivision})`
                : locality;
          }
          if (data.countryName) {
            resolvedCountry = data.countryName.includes('مصر') || data.countryCode === 'EG' ? 'مصر' : data.countryName;
          }
        }
      } catch {
        // Offline or slow connection: seamlessly use local offline database match
      }
    }

    const detectedCity = {
      id: `gps-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: resolvedName,
      country: resolvedCountry,
      latitude: lat,
      longitude: lng,
      timezone:
        (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') ||
        closestOffline.timezone ||
        'Africa/Cairo',
      recommendedMethod: closestOffline.recommendedMethod || (resolvedCountry === 'مصر' ? 'egypt' : 'mwl'),
    };

    savePersistentLocation(detectedCity);
    onSuccess(
      detectedCity,
      `✓ تم تحديد موقعك بدقة عبر GPS وحفظه تلقائيًا: ${detectedCity.name} (${detectedCity.country}) [${lat.toFixed(3)}°, ${lng.toFixed(3)}°]`
    );
  };

  // Attempt 1: High-accuracy satellite GPS (works offline with GPS signal)
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      processCoordinates(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      // Attempt 2: Network/cached GPS position (faster indoor or cached GPS fix)
      navigator.geolocation.getCurrentPosition(
        (pos2) => {
          processCoordinates(pos2.coords.latitude, pos2.coords.longitude);
        },
        () => {
          // IMPORTANT: Do NOT overwrite or change the user's saved location when GPS fails!
          onError(
            'تعذر الحصول على إشارة GPS حاليًا. لم يتم تغيير موقعك المحفوظ، ويمكنك اختيار محافظتك أو مدينتك يدويًا دون إنترنت.'
          );
        },
        { enableHighAccuracy: false, timeout: 7000, maximumAge: 600000 }
      );
    },
    { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
  );
}

/**
 * Smart offline fallback: detects the user's city based on browser IANA TimeZone
 * Only used for suggestions, never silently overwrites a saved user location
 */
export function detectCityByBrowserTimezone(): WorldCity {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      const exactMatch = COMBINED_OFFLINE_CITIES.find(
        (c) => c.timezone.toLowerCase() === tz.toLowerCase()
      );
      if (exactMatch) return exactMatch;

      const parts = tz.split('/');
      const cityPart = parts[parts.length - 1]?.replace(/_/g, ' ').toLowerCase();
      if (cityPart) {
        const partial = COMBINED_OFFLINE_CITIES.find(
          (c) =>
            c.nameEn.toLowerCase().includes(cityPart) ||
            c.countryEn.toLowerCase().includes(cityPart)
        );
        if (partial) return partial;
      }
    }
  } catch {
    // ignore
  }
  return COMBINED_OFFLINE_CITIES[0]; // Default to Cairo
}

