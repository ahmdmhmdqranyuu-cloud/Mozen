import { IslamicEvent, MosqueItem } from '../types';

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  {
    id: 'mawlid',
    title: 'المولد النبوي الشريف',
    hijriDate: '12 ربيع الأول',
    gregorianDate: '4 سبتمبر 2026 م',
    description: 'ذكرى مولد رسول الله وخاتم الأنبياء محمد ﷺ، يوم استبشار ورحمة للعالمين، يستحب فيه الصيام وكثرة الصلاة على النبي وسماع سيرته العطرة.'
  },
  {
    id: 'israa',
    title: 'ذكرى الإسراء والمعراج',
    hijriDate: '27 رجب',
    gregorianDate: '15 يناير 2027 م',
    description: 'ذكرى المعجزة الكبرى برحلة النبي ﷺ من المسجد الحرام إلى المسجد الأقصى وعروجه إلى السماوات العلى وفرض الصلوات الخمس.'
  },
  {
    id: 'nisf-shaban',
    title: 'ليلة النصف من شعبان',
    hijriDate: '15 شعبان',
    gregorianDate: '2 فبراير 2027 م',
    description: 'ليلة مباركة تُرفع فيها الأعمال إلى الله تعالى، ويستحب قيام ليلها وصيام نهارها وكثرة الاستغفار والتصالح.'
  },
  {
    id: 'ramadan',
    title: 'أول أيام شهر رمضان المبارك',
    hijriDate: '1 رمضان',
    gregorianDate: '18 فبراير 2027 م',
    description: 'شهر الصيام والقرآن والبركات، تفتح فيه أبواب الجنان وتغلق أبواب النيران وتصفد الشياطين.'
  },
  {
    id: 'laylat-al-qadr',
    title: 'ليلة القدر المباركة',
    hijriDate: '27 رمضان',
    gregorianDate: '16 مارس 2027 م',
    description: 'خير من ألف شهر، تنزل فيها الملائكة والروح بإذن ربهم من كل أمر، سلام هي حتى مطلع الفجر.'
  },
  {
    id: 'eid-fitr',
    title: 'عيد الفطر المبارك',
    hijriDate: '1 شوال',
    gregorianDate: '20 مارس 2027 م',
    description: 'يوم الجائزة والفرحة بإتمام صيام شهر رمضان المبارك، وإخراج زكاة الفطر وصلة الأرحام.'
  },
  {
    id: 'arafah',
    title: 'يوم عرفة المبارك',
    hijriDate: '9 ذو الحجة',
    gregorianDate: '27 مايو 2027 م',
    description: 'خير أيام الدنيا، وصيامه لغير الحاج يكفر ذنوب سنة ماضية وسنة باقية، وهو ركن الحج الأعظم.'
  },
  {
    id: 'eid-adha',
    title: 'عيد الأضحى المبارك',
    hijriDate: '10 ذو الحجة',
    gregorianDate: '28 مايو 2027 م',
    description: 'يوم النحر الأكبر، شعيرة ذبح الأضاحي وإطعام الفقراء والمساكين وتكبيرات العيد.'
  },
  {
    id: 'hijri-new-year',
    title: 'رأس السنة الهجرية 1448 هـ',
    hijriDate: '1 محرم',
    gregorianDate: '17 يونيو 2027 م',
    description: 'ذكرى الهجرة النبوية المباركة من مكة إلى المدينة المنورة وتأسيس الدولة الإسلامية.'
  },
  {
    id: 'ashura',
    title: 'يوم عاشوراء',
    hijriDate: '10 محرم',
    gregorianDate: '26 يونيو 2027 م',
    description: 'اليوم الذي نجى الله فيه موسى عليه السلام وقومه من فرعون، وصيامه يكفر سنة ماضية.'
  }
];

export const NEARBY_MOSQUES: MosqueItem[] = [
  {
    id: 'm-1',
    name: 'مسجد الإمام الحسين',
    distanceKm: 0.8,
    address: 'حي الحسين - القاهرة القديمة',
    features: ['خطبة الجمعة', 'مصلى نساء', 'مكتبة إسلامية', 'مواقف سيارات'],
    rating: 4.9,
    hasJumua: true,
    hasWomenSection: true
  },
  {
    id: 'm-2',
    name: 'الجامع الأزهر الشريف',
    distanceKm: 1.2,
    address: 'شارع الأزهر - الدرب الأحمر، القاهرة',
    features: ['دروس علم يومية', 'خطبة الجمعة', 'مصلى واسع', 'مأذنة تاريخية'],
    rating: 5.0,
    hasJumua: true,
    hasWomenSection: true
  },
  {
    id: 'm-3',
    name: 'مسجد السيدة زينب',
    distanceKm: 2.1,
    address: 'ميدان السيدة زينب - القاهرة',
    features: ['خطبة الجمعة', 'مأدبة إفطار', 'مصلى نساء', 'دار مناسبات'],
    rating: 4.8,
    hasJumua: true,
    hasWomenSection: true
  },
  {
    id: 'm-4',
    name: 'مسجد عمرو بن العاص',
    distanceKm: 3.4,
    address: 'مصر القديمة - الفسطاط',
    features: ['أول مسجد في إفريقيا', 'خطبة الجمعة', 'ساحات خارجية واسعة', 'مصلى نساء'],
    rating: 4.9,
    hasJumua: true,
    hasWomenSection: true
  },
  {
    id: 'm-5',
    name: 'مسجد الفتاح العليم',
    distanceKm: 5.8,
    address: 'الطريق الدائري الأوسطي',
    features: ['مساحة شاسعة', 'تكييف مركزي', 'مواقف خاصة', 'مصلى نساء متطور'],
    rating: 4.9,
    hasJumua: true,
    hasWomenSection: true
  },
  {
    id: 'm-6',
    name: 'مسجد الرفاعي والسلطان حسن',
    distanceKm: 2.9,
    address: 'ميدان القلعة - القاهرة',
    features: ['عمارة إسلامية تاريخية', 'خطبة الجمعة', 'مزار سياحي إسلامي'],
    rating: 4.9,
    hasJumua: true,
    hasWomenSection: true
  }
];
