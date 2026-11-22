import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Bell,
  BellOff,
  RotateCcw,
  Info,
  ListChecks,
  BookOpen,
  CalendarClock,
} from 'lucide-react';
import { AppLanguage } from '../../utils/i18n';
import {
  HAJJ_RITUALS_CHECKLIST,
  HajjChecklistState,
  HajjRitualId,
  HajjRitualItem,
  computeHajjChecklistProgress,
  loadHajjChecklistState,
  resetHajjChecklistProgress,
  saveHajjChecklistState,
  setHajjRitualReminder,
  toggleHajjRitualCompleted,
} from '../../utils/hajjChecklistStorage';
import { MotionDialogPresence } from '../common/MotionModalShell';
import { getNativeAndroidBridge } from '../../utils/androidPermissionsManager';

interface HajjModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: AppLanguage;
}

interface HajjChapter {
  id: string;
  category: 'umrah' | 'hajj' | 'miqat_prohibitions' | 'duas_madinah';
  categoryLabel: string;
  title: string;
  subtitle: string;
  summary: string;
  steps: { title: string; detail: string; dua?: string }[];
  rulings: string[];
}

const HAJJ_EXPANDED_CHAPTERS: HajjChapter[] = [
  {
    id: 'hajj-1',
    category: 'umrah',
    categoryLabel: 'مناسك العمرة',
    title: 'أركان العمرة وواجباتها وصفتها التفصيلية خطوة بخطوة',
    subtitle: 'الدليل الكامل للمعتمر من الميقات حتى التحلل',
    summary: 'العمرة عبادة جليلة يُكفّر الله بها الخطايا وينفي بها الفقر، وقال النبي ﷺ: «العمرة إلى العمرة كفارة لما بينهما، وعمرة في رمضان تعدل حجة معي».',
    steps: [
      {
        title: '1. الإحرام من الميقات',
        detail: 'يغتسل المعتمر ويتطيب في بدنه ويلبس الرجل إزاراً ورداءً أبيضين نظيفين، وتلبس المرأة ما شاءت من الثياب الساترة غير المتبرجة بدون نقاب ولا قفازين، ثم ينوي الدخول في النسك قائلاً: «لبيك عمرة» ويكثر من التلبية.',
        dua: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ.'
      },
      {
        title: '2. دخول المسجد الحرام والطواف بالبيت (7 أشواط)',
        detail: 'يقطع المعتمر التلبية عند رؤية الكعبة المشرفة، ويبدأ من الحجر الأسود فيستلمه أو يشير إليه بيده اليمنى قائلاً «بسم الله والله أكبر»، ويطوف سبعة أشواط جاعلاً الكعبة عن يساره، ويسن للرجل في طواف القدوم والعمرة الاضطباع (كشف الكتف الأيمن) والرَّمَل (الإسراع مع مقاربة الخطى) في الأشواط الثلاثة الأولى.',
        dua: 'بين الركنين اليماني والحجر الأسود: «رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ».'
      },
      {
        title: '3. صلاة ركعتين خلف مقام إبراهيم والشرب من زمزم',
        detail: 'بعد إتمام الأشواط السبعة يغطي الرجل كتفيه ويصلي ركعتين خلف مقام إبراهيم إن تيسر أو في أي مكان من المسجد الحرام، يقرأ في الأولى سورة الكافرون وفي الثانية سورة الإخلاص، ثم يشرب من ماء زمزم ويتضلع منه ويدعو بما شاء.',
        dua: 'وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى • اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْماً نَافِعاً وَرِزْقاً وَاسِعاً وَشِفَاءً مِنْ كُلِّ دَاءٍ.'
      },
      {
        title: '4. السعي بين الصفا والمروة (7 أشواط)',
        detail: 'يتجه إلى الصفا فيقرأ قوله تعالى: ﴿إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ﴾ ويستقبل القبلة ويكبر ويهلل ويدعو ثلاثاً، ثم ينزل ماشياً إلى المروة ويسعى الرجل هرولةً بين العلمين الأخضرين، فإذا وصل المروة فهذا شوط، ويعود للصفا ثانٍ حتى يتم سبعة أشواط تنتهي بالمروة.',
        dua: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ.'
      },
      {
        title: '5. الحلق أو التقصير والتحلل',
        detail: 'يحلق الرجل شعر رأسه بالكامل (وهو أفضل لأن النبي ﷺ دعا للمحلقين ثلاثاً وللمقصرين مرة) أو يقصر من جميع الرأس، وتقصر المرأة من أطراف شعرها قدر أنملة إصبع، وبذلك تتم العمرة ويحل للمعتمر كل شيء حرم عليه بالإحرام.'
      }
    ],
    rulings: [
      'أركان العمرة ثلاثة: الإحرام (النية)، الطواف بالبيت، والسعي بين الصفا والمروة؛ لا تصح العمرة إلا بها.',
      'واجبات العمرة اثنان: الإحرام من الميقات المعتبر شرعاً، والحلق أو التقصير.',
      'الطهارة من الحدث الأصغر والأكبر شرط لصحة الطواف، وأما السعي فيصح لو انتقض الوضوء في أثنائه وإن كان الأفضل الطهارة.'
    ]
  },
  {
    id: 'hajj-2',
    category: 'miqat_prohibitions',
    categoryLabel: 'المواقيت ومحظورات الإحرام',
    title: 'المواقيت الزمانية والمكانية، أنساك الحج الثلاثة، ومحظورات الإحرام',
    subtitle: 'تفصيل مواقيت الإحرام وأحكام التمتع والقران والإفراد',
    summary: 'وقتَ النبي ﷺ لأهل الآفاق مواقيت مكانية لا يجوز لمن أراد الحج أو العمرة تجاوزها بدون إحرام، وبين أنواع الأنساك الثلاثة وما يحرم على المحرم.',
    steps: [
      {
        title: '1. المواقيت المكانية الخمسة',
        detail: '• ذو الحليفة (أبيار علي): ميقات أهل المدينة المنورة ومن مرّ بها (يبعد عن مكة نحو 450 كم).\n• الجحفة (رابغ): ميقات أهل الشام ومصر والمغرب ومن جاء من جهتهم.\n• قرن المنازل (السيل الكبير / وادي محرم): ميقات أهل نجد والطائف والخليج.\n• يلملم (السعدية): ميقات أهل اليمن ومن جاء من طريقهم.\n• ذات عرق: ميقات أهل العراق والمشرق.\n• ومن كان مسكنه دون المواقيت كأهل جدة ومكة فيحرم من مكانه (إلا العمرة لأهل مكة فمن الحل كالتنعيم).'
      },
      {
        title: '2. أنواع أنساك الحج الثلاثة',
        detail: '• التمتع (وهو الأفضل): أن يحرم بالعمرة في أشهر الحج ويفرغ منها ويتحلل، ثم يحرم بالحج في يوم التروية (8 ذي الحجة)، وعليه هدي.\n• القِران: أن يحرم بالعمرة والحج معاً، ويبقى على إحرامه حتى يتحلل يوم النحر، وعليه هدي.\n• الإفراد: أن يحرم بالحج وحده، ولا هدي عليه.'
      },
      {
        title: '3. محظورات الإحرام التسعة',
        detail: 'يحرم على المحرم (رجلاً وامرأة): 1- إزالة الشعر، 2- تقليم الأظافر، 3- التطيب بعد الإحرام، 4- عقد النكاح، 5- المباشرة بشهوة، 6- الجماع (ويفسد الحج إن كان قبل التحلل الأول)، 7- قتل صيد البر.\nويختص الرجال بـ: 8- لبس المخيط المفصل على البدن، 9- تغطية الرأس بملاصق.\nوتختص النساء بـ: عدم لبس النقاب والقفازين (وتستر وجهها عن الأجانب بغير النقاب).'
      }
    ],
    rulings: [
      'أشهر الحج هي: شوال، ذو القعدة، وعشر من ذي الحجة.',
      'من فعل محظوراً من محظورات الإحرام ناسياً أو جاهلاً فلا إثم عليه ولا فدية (في غير الصيد والجماع).',
      'فدية الأذى (كحلق الشعر أو لبس المخيط لعذر): صيام ثلاثة أيام، أو إطعام ستة مساكين لكل مسكين نصف صاع، أو ذبح شاة.'
    ]
  },
  {
    id: 'hajj-3',
    category: 'hajj',
    categoryLabel: 'مناسك الحج يوماً بيوم',
    title: 'أعمال الحج التفصيلية من يوم التروية (8 ذي الحجة) إلى يوم عرفة ومزدلفة',
    subtitle: 'اليوم الثامن (التروية) واليوم التاسع (الوقوف بعرفة والمبيت بمزدلفة)',
    summary: 'الوقوف بعرفة هو الركن الأعظم للحج كما قال النبي ﷺ: «الحج عرفة»، وفيه يدنو الله عز وجل ويباهي بأهل الموقف ملائكته.',
    steps: [
      {
        title: '1. يوم التروية (8 ذي الحجة)',
        detail: 'يحرم المتمتع بالحج ضحىً من مكانه، ويتوجه الحجاج جميعاً إلى مِنى، فيصلون بها الظهر والعصر والمغرب والعشاء والفجر قصراً للصلاة الرباعية (ركعتين) كل صلاة في وقتها بدون جمع، ويبيتون في منى ليلة التاسع اتباعاً للسنة.',
        dua: 'لَبَّيْكَ اللَّهُمَّ حَجّاً • اللَّهُمَّ هَذِهِ حَجَّةٌ لَا رِيَاءَ فِيهَا وَلَا سُمْعَةَ.'
      },
      {
        title: '2. يوم عرفة العظيم (9 ذي الحجة)',
        detail: 'يتوجه الحجاج بعد طلوع شمس يوم التاسع إلى عرفة، ويستمعون لخطبة عرفة ويصلون الظهر والعصر جمعاً وقصراً (ركعتين ركعتين) بأذان واحد وإقامتين، ثم يتفرغ الحاج للذكر والدعاء والتضرع مستقبل القبلة رافعاً يديه حتى تغرب الشمس، ولا ينصرف من عرفة قبل غروب الشمس.',
        dua: 'خير الدعاء دعاء يوم عرفة: «لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ».'
      },
      {
        title: '3. النفرة إلى مزدلفة والمبيت بها (ليلة 10 ذي الحجة)',
        detail: 'بعد غروب شمس يوم عرفة ينفر الحجاج بسكينة ووقار إلى مزدلفة، فيصلون بها المغرب والعشاء جمعاً وقصراً (المغرب 3 ركعات والعشاء ركعتين) بأذان واحد وإقامتين، ويبيتون بمزدلفة حتى يصلوا الفجر ويذكروا الله عند المشعر الحرام حتى يسفروا جداً، ويجوز للضعفة والنساء والمرضى الدفع من مزدلفة بعد منتصف الليل.'
      }
    ],
    rulings: [
      'أركان الحج أربعة: 1- الإحرام، 2- الوقوف بعرفة، 3- طواف الإفاضة، 4- السعي بين الصفا والمروة.',
      'عرفة كلها موقف إلا بطن وادي عرنة، ويمتد وقت الوقوف من زوال شمس يوم التاسع إلى طلوع فجر يوم النحر.',
      'يُلتقط حصى جمرة العقبة (7 حصيات بقدر حبة الحمص) من مزدلفة أو من منى.'
    ]
  },
  {
    id: 'hajj-4',
    category: 'hajj',
    categoryLabel: 'مناسك الحج يوماً بيوم',
    title: 'أعمال يوم النحر (10 ذي الحجة) وأيام التشريق (11، 12، 13) وطواف الوداع',
    subtitle: 'رمي الجمرات، ذبح الهدي، الحلق، طواف الإفاضة، والتعجل أو التأخر',
    summary: 'يوم النحر هو يوم الحج الأكبر؛ تجتمع فيه أربعة أعمال عظيمة: رمي جمرة العقبة، ونحر الهدي، والحلق أو التقصير، وطواف الإفاضة مع السعي.',
    steps: [
      {
        title: '1. أعمال يوم النحر الأربعة (10 ذي الحجة)',
        detail: '• أولاً (الرمي): رمي جمرة العقبة الكبرى بسبع حصيات متعاقبات يكبر مع كل حصاة.\n• ثانياً (النحر): ذبح الهدي للمتمتع والقارن.\n• ثالثاً (الحلق أو التقصير): يحلق الرجل رأسه أو يقصره، وتقصر المرأة قدر أنملة.\n• رابعاً (الطواف والسعي): النزول إلى مكة لطواف الإفاضة (طواف الركن) والسعي بين الصفا والمروة للمتمتع ولغيره ممن لم يسعَ مع طواف القدوم.',
        dua: 'مع كل حصاة: «اللَّهُ أَكْبَرُ، اللَّهُمَّ اجْعَلْهُ حَجّاً مَبْرُوراً وَذَنْباً مَغْفُوراً».'
      },
      {
        title: '2. التحلل الأول والتحلل الأكبر',
        detail: 'إذا فعل الحاج اثنين من ثلاثة (الرمي، الحلق، الطواف) حصل له التحلل الأصغر فحل له كل شيء إلا النساء، فإذا فعل الثلاثة جميعاً حصل له التحلل الأكبر وحل له كل شيء حتى النساء.'
      },
      {
        title: '3. المبيت بمنى ورمي الجمرات في أيام التشريق (11، 12، 13 ذي الحجة)',
        detail: 'يبيت الحاج في منى ليالي أيام التشريق، وفي كل يوم بعد زوال الشمس (دخول وقت الظهر) يرمي الجمرات الثلاث مرتبة:\n1- الجمرة الصغرى (7 حصيات ثم يدعو مستقبلاً القبلة).\n2- الجمرة الوسطى (7 حصيات ثم يدعو مستقبلاً القبلة).\n3- جمرة العقبة الكبرى (7 حصيات وينصرف ولا يقف للدعاء).\nويجوز التعجل في اليوم الثاني عشر بشرط الخروج من منى قبل غروب الشمس، ومن تأخر لليوم الثالث عشر فهو أفضل.'
      },
      {
        title: '4. طواف الوداع',
        detail: 'إذا أراد الحاج السفر ومغادرة مكة وجب عليه أن يطوف بالبيت سبعة أشواط (طواف الوداع) ليكون آخر عهد بالبيت، ويسقط عن المرأة الحائض والنفساء تخفيفاً ورحمة.'
      }
    ],
    rulings: [
      'الأفضل ترتيب أعمال يوم النحر الأربعة: (رمي، فنحر، فحلق، فطواف)، ولو قدم بعضها على بعض فلا حرج؛ فما سئل النبي ﷺ يومئذ عن شيء قدم ولا أخر إلا قال: «افعل ولا حرج».',
      'أيام التشريق أيام أكل وشرب وذكر لله عز وجل.'
    ]
  },
  {
    id: 'hajj-5',
    category: 'duas_madinah',
    categoryLabel: 'الأدعية وزيارة المدينة',
    title: 'أدعية الحج والعمرة الجامعة وآداب زيارة المسجد النبوي الشريف',
    subtitle: 'الصلاة في الروضة الشريفة والسلام على النبي ﷺ وصاحبيه',
    summary: 'تُستحب زيارة المسجد النبوي الشريف بالمدينة المنورة في أي وقت من السنة قبل الحج أو بعده، والصلاة فيه خير من ألف صلاة فيما سواه إلا المسجد الحرام.',
    steps: [
      {
        title: '1. آداب دخول المسجد النبوي والصلاة في الروضة الشريفة',
        detail: 'يدخل الزائر المسجد النبوي برجله اليمنى مصلياً على النبي ﷺ، ويصلي تحية المسجد، ويحرص على الصلاة والدعاء في الروضة الشريفة التي قال عنها ﷺ: «ما بين بيتي ومنبري روضة من رياض الجنة».',
        dua: 'بِسْمِ اللَّهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ.'
      },
      {
        title: '2. السلام على رسول الله ﷺ وصاحبيه أبي بكر وعمر رضي الله عنهما',
        detail: 'يقف الزائر أمام القبر الشريف بأدب وخشوع وخفض صوت، فيسلم على النبي ﷺ، ثم يخطو خطوة عن يمينه فيسلم على أبي بكر الصديق، ثم خطوة أخرى فيسلم على عمر بن الخطاب رضي الله عنهما، فإذا أراد الدعاء لنفسه استقبل القبلة ودعا الله عز وجل.',
        dua: 'السَّلَامُ عَلَيْكَ يَا رَسُولَ اللَّهِ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، أَشْهَدُ أَنَّكَ قَدْ بَلَّغْتَ الرِّسَالَةَ وَأَدَّيْتَ الْأَمَانَةَ وَنَصَحْتَ الْأُمَّةَ • السَّلَامُ عَلَيْكَ يَا أَبَا بَكْرٍ الصِّدِّيقَ • السَّلَامُ عَلَيْكَ يَا عُمَرَ الْفَارُوقَ.'
      },
      {
        title: '3. زيارة مسجد قباء وشهداء أحد والبقيع',
        detail: 'يسن للزائر أن يتطهر في بيته ويأتي مسجد قباء فيصلي فيه ركعتين (فإن من تطهر في بيته ثم أتى مسجد قباء فصلى فيه صلاة كان له كأجر عمرة)، ويزور مقبرة البقيع وشهداء أحد وسيد الشهداء حمزة بن عبد المطلب ويدعو لهم.'
      }
    ],
    rulings: [
      'زيارة المسجد النبوي سنة مستقلة عظيمة الأجر وليست من أركان أو واجبات الحج.',
      'يحذر الزائر من رفع الصوت عند الحجرة النبوية الشريفة أو التمسح بالشبابيك، بل يلتزم السنة والأدب.'
    ]
  }
];

function getDefaultDateTimeLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function HajjModal({ isOpen, onClose, language = 'ar' }: HajjModalProps) {
  const isRtl = language === 'ar' || language === 'ur';
  const isEnglish = !isRtl;

  const [activeTab, setActiveTab] = useState<'checklist' | 'guide'>('checklist');
  const [viewMode, setViewMode] = useState<'index' | 'detail'>('index');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(HAJJ_EXPANDED_CHAPTERS[0].id);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [checklistState, setChecklistState] = useState<HajjChecklistState>(() =>
    loadHajjChecklistState()
  );
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [reminderDialogItem, setReminderDialogItem] = useState<HajjRitualItem | null>(null);
  const [reminderInput, setReminderInput] = useState<string>(() => getDefaultDateTimeLocal());

  const progress = useMemo(
    () => computeHajjChecklistProgress(checklistState),
    [checklistState]
  );

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return HAJJ_EXPANDED_CHAPTERS;
    const q = searchQuery.trim();
    return HAJJ_EXPANDED_CHAPTERS.filter(
      (c) =>
        c.title.includes(q) ||
        c.subtitle.includes(q) ||
        c.summary.includes(q) ||
        c.steps.some((s) => s.title.includes(q) || s.detail.includes(q))
    );
  }, [searchQuery]);

  const currentChapter = useMemo(() => {
    return (
      HAJJ_EXPANDED_CHAPTERS.find((c) => c.id === selectedChapterId) ||
      filteredChapters[0] ||
      HAJJ_EXPANDED_CHAPTERS[0]
    );
  }, [selectedChapterId, filteredChapters]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleRitual = (id: HajjRitualId) => {
    const saved = saveHajjChecklistState(toggleHajjRitualCompleted(checklistState, id));
    setChecklistState(saved);
  };

  const handleConfirmReset = () => {
    const cleared = saveHajjChecklistState(resetHajjChecklistProgress(checklistState));
    setChecklistState(cleared);
    setShowResetDialog(false);
  };

  const openReminderDialog = (item: HajjRitualItem) => {
    const existing = checklistState.reminders[item.id];
    setReminderInput(existing?.isoLocalInput || getDefaultDateTimeLocal());
    setReminderDialogItem(item);
  };

  const handleSaveReminder = () => {
    if (!reminderDialogItem) return;
    const targetMs = new Date(reminderInput).getTime();
    if (!Number.isFinite(targetMs) || targetMs <= Date.now()) {
      return;
    }
    const saved = saveHajjChecklistState(
      setHajjRitualReminder(checklistState, reminderDialogItem.id, {
        scheduledAtMs: targetMs,
        isoLocalInput: reminderInput,
        enabled: true,
      })
    );
    setChecklistState(saved);

    // Schedule via native Android AlarmManager bridge when running inside APK
    const bridge = getNativeAndroidBridge();
    if (bridge?.scheduleAlarm) {
      try {
        bridge.scheduleAlarm(
          JSON.stringify([
            {
              section: 'custom_reminder',
              reminderId: `hajj_${reminderDialogItem.id}`,
              title: isEnglish
                ? `Hajj Ritual Reminder: ${reminderDialogItem.titleEn}`
                : `تذكير منسك الحج: ${reminderDialogItem.titleAr}`,
              body: isEnglish
                ? reminderDialogItem.descriptionEn
                : reminderDialogItem.descriptionAr,
              triggerEpochMs: targetMs,
            },
          ])
        );
      } catch {
        // fallback cleanly on web
      }
    }

    setReminderDialogItem(null);
  };

  const handleClearReminder = () => {
    if (!reminderDialogItem) return;
    const saved = saveHajjChecklistState(
      setHajjRitualReminder(checklistState, reminderDialogItem.id, null)
    );
    setChecklistState(saved);
    setReminderDialogItem(null);
  };

  const currentIndex = HAJJ_EXPANDED_CHAPTERS.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? HAJJ_EXPANDED_CHAPTERS[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < HAJJ_EXPANDED_CHAPTERS.length - 1
      ? HAJJ_EXPANDED_CHAPTERS[currentIndex + 1]
      : null;

  React.useEffect(() => {
    if (!isOpen) return;
    const handleBack = (e: Event) => {
      if (showResetDialog) {
        e.preventDefault();
        setShowResetDialog(false);
      } else if (reminderDialogItem) {
        e.preventDefault();
        setReminderDialogItem(null);
      } else if (activeTab === 'guide' && viewMode === 'detail') {
        e.preventDefault();
        setViewMode('index');
      }
    };
    window.addEventListener('moazenBackRequested', handleBack);
    return () => window.removeEventListener('moazenBackRequested', handleBack);
  }, [isOpen, showResetDialog, reminderDialogItem, activeTab, viewMode]);

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div
      className="fixed inset-0 z-50 muslim-plus-canvas flex flex-col overflow-x-hidden select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <div className="bg-[#F6EEDC]/95 backdrop-blur-xs text-[#172A28] px-4 pt-4 pb-3 shadow-xs border-b border-[#D6C18D] shrink-0">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'guide' && viewMode === 'detail') {
                  setViewMode('index');
                } else {
                  onClose();
                }
              }}
              className="w-9 h-9 rounded-full bg-white/90 border border-[#D6C18D] hover:brightness-95 flex items-center justify-center text-[#104B40] transition-colors shrink-0 cursor-pointer"
              aria-label={isEnglish ? 'Back' : 'رجوع'}
            >
              <BackIcon className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold font-cairo text-[#104B40] truncate">
                {activeTab === 'checklist'
                  ? isEnglish
                    ? 'Hajj Rituals Checklist (12)'
                    : 'قائمة مناسك الحج التفاعلية (12)'
                  : viewMode === 'index'
                  ? isEnglish
                    ? 'Hajj & Umrah Encyclopedia'
                    : `موسوعة الحج والعمرة (${HAJJ_EXPANDED_CHAPTERS.length} أبواب)`
                  : currentChapter.categoryLabel}
              </h2>
              <p className="text-[11px] text-[#4B5B58] truncate">
                {activeTab === 'checklist'
                  ? isEnglish
                    ? 'Track completed rituals step by step with optional reminders'
                    : 'تتبّع إتمام كل نسك خطوة بخطوة مع حفظ تلقائي وتنبيهات اختيارية'
                  : isEnglish
                  ? 'Comprehensive prophetic guide to Hajj, Umrah & Madinah visit'
                  : 'الدليل الكامل للأحكام والمناسك والأدعية المأثورة'}
              </p>
            </div>
          </div>

          {activeTab === 'guide' && (
            <div className="flex items-center gap-1.5 shrink-0">
              {viewMode === 'detail' && (
                <button
                  type="button"
                  onClick={() => setViewMode('index')}
                  className="px-3 py-1.5 rounded-xl bg-[#104B40] text-white text-xs font-bold cursor-pointer"
                >
                  {isEnglish ? 'Chapters' : 'الفهرس'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsIndexOpen(true)}
                className="moazen-widget flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[#172A28] border border-[#D6C18D] cursor-pointer"
              >
                <Menu className="w-4 h-4 text-[#C5A059]" />
                <span className="text-xs font-bold">{isEnglish ? 'Index' : 'الأبواب'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Section Segmented Tabs */}
        <div className="max-w-2xl mx-auto w-full mt-2.5 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#EDE2C8]/75 border border-[#D6C18D]">
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-[#104B40] text-white shadow-xs'
                : 'text-[#172A28] hover:bg-white/50'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>{isEnglish ? 'Rituals Checklist' : 'قائمة مناسك الحج'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-[#104B40] text-white shadow-xs'
                : 'text-[#172A28] hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isEnglish ? 'Full Hajj & Umrah Guide' : 'الدليل والأحكام التفصيلية'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Guide Index Drawer */}
      {isIndexOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-bold text-base text-[#172A28]">فهرس أبواب الحج والعمرة</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIndexOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-100 bg-[#F7F6F2]/50">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في المناسك، الأركان، المواقيت، أو الأدعية..."
                  className="moazen-widget w-full border border-gray-200 rounded-xl py-2 pr-9 pl-3 text-xs text-[#172A28]"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredChapters.map((chap, idx) => {
                const isSelected = chap.id === currentChapter.id && viewMode === 'detail';
                return (
                  <button
                    key={chap.id}
                    type="button"
                    onClick={() => {
                      setSelectedChapterId(chap.id);
                      setViewMode('detail');
                      setActiveTab('guide');
                      setIsIndexOpen(false);
                    }}
                    className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#C5A059]/10 border-[#C5A059] text-[#172A28]'
                        : 'bg-white border-gray-100 hover:bg-gray-50 text-[#172A28]'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#C5A059] text-white' : 'bg-[#F7F6F2] text-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[10px] font-bold text-[#C5A059] mb-0.5">
                        {chap.categoryLabel}
                      </span>
                      <h4 className="font-bold text-xs text-[#172A28] leading-snug">{chap.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{chap.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: INTERACTIVE 12-RITUAL HAJJ CHECKLIST */}
      {activeTab === 'checklist' ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 pb-20 max-w-2xl mx-auto w-full">
          {/* Progress Summary Card */}
          <div className="moazen-widget rounded-2xl p-4 border border-[#C5A059]/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black font-cairo text-[#104B40]">
                  {isEnglish ? 'Your Hajj Progress' : 'مؤشر إتمام مناسك الحج'}
                </h3>
                <p className="text-[11px] text-[#4B5B58]">
                  {isEnglish
                    ? 'Progress saves automatically across restarts'
                    : 'يتم حفظ تقدمك تلقائياً بعد إغلاق التطبيق'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-[#104B40] text-[#F5D77F]">
                  {progress.percent}%
                </span>
                <button
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  disabled={progress.completed === 0 && Object.keys(checklistState.reminders).length === 0}
                  className="moazen-widget-sub px-2.5 py-1.5 rounded-xl border border-[#D6C18D] text-[#104B40] disabled:opacity-40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title={isEnglish ? 'Reset Checklist' : 'إعادة تعيين القائمة'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#9A7732]" />
                  <span>{isEnglish ? 'Reset' : 'إعادة ضبط'}</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-[#D6C18D]/35 overflow-hidden border border-[#D6C18D]/40">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#104B40] via-[#1C6B5B] to-[#C5A059] transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            {/* 3 Counters */}
            <div className="grid grid-cols-3 gap-2">
              <div className="moazen-widget-sub rounded-xl border border-[#D6C18D] p-2 text-center">
                <p className="text-[10px] font-bold text-[#4B5B58]">
                  {isEnglish ? 'Completed' : 'مكتمل'}
                </p>
                <p className="text-base font-black text-[#104B40]">{progress.completed}</p>
              </div>
              <div className="moazen-widget-sub rounded-xl border border-[#D6C18D] p-2 text-center">
                <p className="text-[10px] font-bold text-[#4B5B58]">
                  {isEnglish ? 'Remaining' : 'متبقي'}
                </p>
                <p className="text-base font-black text-[#9A7732]">{progress.remaining}</p>
              </div>
              <div className="moazen-widget-sub rounded-xl border border-[#D6C18D] p-2 text-center">
                <p className="text-[10px] font-bold text-[#4B5B58]">
                  {isEnglish ? 'Total' : 'الإجمالي'}
                </p>
                <p className="text-base font-black text-[#172A28]">{progress.total}</p>
              </div>
            </div>
          </div>

          {/* Explicit Hajj-Type Timing & Order Disclaimer */}
          <div className="moazen-widget-sub rounded-2xl p-3 border border-[#C5A059]/60 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#9A7732] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#172A28] leading-relaxed font-medium">
              {isEnglish
                ? 'Important Note: The timing, sequence, or obligation of certain rituals (such as Tawaf al-Qudum, Hady sacrifice, and when Sa’i is performed) varies depending on your Hajj type (Tamattu’, Qiran, or Ifrad) and individual excused circumstances.'
                : 'تنبيه فقهي مهم: قد يختلف وقت أو ترتيب أو وجوب بعض المناسك (مثل طواف القدوم، والهدي، وتقديم السعي أو تأخيره، وطواف الوداع لأصحاب الأعذار) باختلاف نوع النسك (التمتع أو القِران أو الإفراد) وبحسب حال الحاج وظروفه الشرعية.'}
            </p>
          </div>

          {/* 12 Ritual Items */}
          <div className="space-y-2.5">
            {HAJJ_RITUALS_CHECKLIST.map((item) => {
              const isCompleted = checklistState.completedIds.includes(item.id);
              const reminder = checklistState.reminders[item.id];
              const hasActiveReminder = Boolean(reminder?.enabled && reminder.scheduledAtMs > Date.now());

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-3.5 transition-all ${
                    isCompleted
                      ? 'bg-[#104B40] text-white border-[#C5A059] shadow-xs'
                      : 'moazen-widget text-[#172A28] border-[#D6C18D]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleRitual(item.id)}
                      className="flex items-start gap-3 flex-1 text-start cursor-pointer"
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                          isCompleted
                            ? 'bg-[#C5A059] border-[#F5D77F] text-[#0E2B22]'
                            : 'bg-white/90 border-[#C5A059] text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? 'bg-white/15 text-[#F5D77F]'
                                : 'bg-[#104B40]/10 text-[#104B40]'
                            }`}
                          >
                            {item.order}
                          </span>
                          <h4
                            className={`text-sm font-extrabold font-cairo ${
                              isCompleted ? 'text-white line-through decoration-[#F5D77F]/70' : 'text-[#104B40]'
                            }`}
                          >
                            {isEnglish ? item.titleEn : item.titleAr}
                          </h4>
                          <span
                            className={`text-[10px] font-bold ${
                              isCompleted ? 'text-[#F5D77F]' : 'text-[#9A7732]'
                            }`}
                          >
                            • {isEnglish ? item.stageEn : item.stageAr}
                          </span>
                        </div>

                        <p
                          className={`text-xs mt-1 leading-relaxed ${
                            isCompleted ? 'text-white/90' : 'text-[#4B5B58]'
                          }`}
                        >
                          {isEnglish ? item.descriptionEn : item.descriptionAr}
                        </p>

                        {(item.variationNoteAr || item.variationNoteEn) && (
                          <p
                            className={`text-[10.5px] mt-1 font-semibold ${
                              isCompleted ? 'text-[#F5D77F]' : 'text-[#9A7732]'
                            }`}
                          >
                            {isEnglish ? item.variationNoteEn : item.variationNoteAr}
                          </p>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openReminderDialog(item)}
                      className={`p-2 rounded-xl border shrink-0 cursor-pointer transition-colors ${
                        hasActiveReminder
                          ? 'bg-[#C5A059] text-[#0E2B22] border-[#F5D77F]'
                          : isCompleted
                          ? 'bg-white/10 text-white border-white/25'
                          : 'bg-white/80 text-[#104B40] border-[#D6C18D]'
                      }`}
                      title={isEnglish ? 'Schedule custom reminder' : 'تحديد تنبيه مخصص'}
                    >
                      {hasActiveReminder ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <CalendarClock className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {hasActiveReminder && reminder && (
                    <div
                      className={`mt-2 pt-2 border-t text-[10px] font-bold flex items-center justify-between ${
                        isCompleted
                          ? 'border-white/15 text-[#F5D77F]'
                          : 'border-[#D6C18D]/50 text-[#104B40]'
                      }`}
                    >
                      <span>
                        {isEnglish ? 'Scheduled Reminder: ' : 'تنبيه مجدول: '}
                        {new Date(reminder.scheduledAtMs).toLocaleString(isEnglish ? 'en-US' : 'ar-EG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'index' ? (
        /* TAB 2 - VIEW 1: ORGANIZED VERTICAL INDEX OF HAJJ & UMRAH CHAPTERS */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2.5 pb-20 max-w-2xl mx-auto w-full">
          <div className="moazen-widget rounded-2xl p-3.5 border border-[#D6C18D] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#104B40] font-cairo">
                  الفهرس الرأسي لأبواب ومناسك الحج والعمرة
                </h3>
                <p className="text-[11px] text-[#4B5B58] mt-0.5">
                  اضغط على أي باب لفتح صفحته المستقلة بكامل الخطوات والأدعية والأحكام الفقهية
                </p>
              </div>
              <span className="text-xs font-bold text-[#9A7732] bg-[#C5A059]/15 px-3 py-1 rounded-full">
                {filteredChapters.length} أبواب
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في فهرس مناسك الحج والعمرة..."
                className="moazen-widget-sub w-full border border-[#D6C18D] rounded-xl py-2 pr-9 pl-3 text-xs text-[#172A28]"
              />
              <Search className="w-4 h-4 text-[#9A7732] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {filteredChapters.map((chap, idx) => (
            <button
              key={chap.id}
              type="button"
              onClick={() => {
                setSelectedChapterId(chap.id);
                setViewMode('detail');
              }}
              className="moazen-widget w-full text-right p-4 rounded-2xl border border-[#D6C18D] hover:border-[#C5A059] shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#104B40] text-[#F5D77F] font-bold text-sm flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C5A059]/15 text-[#9A7732]">
                      {chap.categoryLabel}
                    </span>
                    <span className="text-[10px] text-[#4B5B58] font-bold">
                      {chap.steps.length} خطوات
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#172A28] group-hover:text-[#104B40] transition-colors mt-1">
                    {chap.title}
                  </h4>
                  <p className="text-[11px] text-[#4B5B58] line-clamp-1 mt-0.5">{chap.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9A7732] rotate-180 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        /* TAB 2 - VIEW 2: INDEPENDENT DETAIL PAGE FOR SELECTED HAJJ CHAPTER */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-20 max-w-2xl mx-auto w-full">
          <div className="moazen-widget rounded-2xl p-3 border border-[#D6C18D] shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMode('index')}
              className="moazen-widget-sub flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D6C18D] text-[#104B40] text-xs font-bold cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى فهرس الحج والعمرة</span>
            </button>
            <span className="text-xs font-bold text-[#9A7732] bg-[#C5A059]/15 px-3 py-1 rounded-full">
              الباب {currentIndex + 1} من {HAJJ_EXPANDED_CHAPTERS.length}
            </span>
          </div>

          <div className="moazen-widget rounded-2xl p-5 shadow-xs border border-[#D6C18D]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#C5A059]/15 text-[#9A7732] text-xs font-bold">
                {currentChapter.categoryLabel}
              </span>
            </div>
            <h3 className="text-xl font-bold font-amiri text-[#104B40] mb-1 leading-relaxed">
              {currentChapter.title}
            </h3>
            <p className="text-xs font-bold text-[#9A7732] mb-3">{currentChapter.subtitle}</p>
            <p className="moazen-widget-sub text-sm text-[#172A28] leading-loose p-3.5 rounded-xl border border-[#D6C18D]">
              {currentChapter.summary}
            </p>
          </div>

          <div className="space-y-3">
            {currentChapter.steps.map((step, idx) => (
              <div key={idx} className="moazen-widget rounded-2xl p-5 shadow-xs border border-[#D6C18D]">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <h4 className="font-bold text-base text-[#104B40] font-cairo">{step.title}</h4>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(`${step.title}\n${step.detail}\n${step.dua || ''}`, `${currentChapter.id}-${idx}`)
                    }
                    className="moazen-widget-sub p-2 rounded-xl border border-[#D6C18D] text-[#104B40] cursor-pointer"
                    title="نسخ"
                  >
                    {copiedId === `${currentChapter.id}-${idx}` ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-[#172A28] leading-loose whitespace-pre-line">{step.detail}</p>
                {step.dua && (
                  <div className="moazen-widget-sub mt-3 p-3.5 rounded-xl border border-[#C5A059]/50">
                    <span className="block text-[11px] font-bold text-[#9A7732] mb-1">
                      الذكر والدعاء المأثور:
                    </span>
                    <p className="font-amiri text-base font-bold text-[#104B40] leading-loose">
                      {step.dua}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="moazen-widget rounded-2xl p-5 shadow-xs border border-[#D6C18D]">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#D6C18D]/50">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <h4 className="font-bold text-sm text-[#104B40]">أحكام وضوابط فقهية مهمة</h4>
            </div>
            <div className="space-y-2.5">
              {currentChapter.rulings.map((ruling, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-[#172A28] leading-relaxed">
                  <span className="text-[#C5A059] font-bold">✦</span>
                  <span>{ruling}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="moazen-widget rounded-2xl p-3.5 shadow-xs border border-[#D6C18D] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => prevChapter && setSelectedChapterId(prevChapter.id)}
              disabled={!prevChapter}
              className="moazen-widget-sub flex-1 py-2.5 px-3 rounded-xl border border-[#D6C18D] disabled:opacity-40 text-xs font-bold text-[#172A28] text-right truncate cursor-pointer"
            >
              السابق: {prevChapter ? prevChapter.categoryLabel : 'البداية'}
            </button>
            <button
              type="button"
              onClick={() => nextChapter && setSelectedChapterId(nextChapter.id)}
              disabled={!nextChapter}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#104B40] disabled:opacity-40 text-xs font-bold text-white text-left truncate cursor-pointer"
            >
              التالي: {nextChapter ? nextChapter.categoryLabel : 'النهاية'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog before Resetting Hajj Checklist */}
      <MotionDialogPresence
        isOpen={showResetDialog}
        dialogKey="hajj-reset-dialog"
        onBackdropClick={() => setShowResetDialog(false)}
      >
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="moazen-widget rounded-2xl border border-[#C5A059] p-5 shadow-2xl space-y-4"
        >
          <h4 className="text-base font-black text-[#104B40]">
            {isEnglish ? 'Reset Hajj Checklist?' : 'تأكيد إعادة ضبط قائمة المناسك'}
          </h4>
          <p className="text-xs text-[#4B5B58] leading-relaxed">
            {isEnglish
              ? 'This will clear all completed ritual checkmarks and any custom ritual reminders. Are you sure?'
              : 'سيتم مسح علامات إتمام جميع مناسك الحج والتنبيهات المجدولة لها. هل أنت متأكد من المتابعة؟'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmReset}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer"
            >
              {isEnglish ? 'Yes, Reset' : 'نعم، إعادة الضبط'}
            </button>
            <button
              type="button"
              onClick={() => setShowResetDialog(false)}
              className="flex-1 py-2.5 rounded-xl border border-[#D6C18D] bg-white text-[#104B40] text-xs font-bold cursor-pointer"
            >
              {isEnglish ? 'Cancel' : 'إلغاء'}
            </button>
          </div>
        </div>
      </MotionDialogPresence>

      {/* Custom Date/Time Reminder Dialog for a Specific Ritual */}
      <MotionDialogPresence
        isOpen={reminderDialogItem !== null}
        dialogKey="hajj-reminder-dialog"
        onBackdropClick={() => setReminderDialogItem(null)}
      >
        {reminderDialogItem && (
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="moazen-widget rounded-2xl border border-[#C5A059] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-[#104B40]">
                {isEnglish ? 'Ritual Reminder' : 'تنبيه مخصص للمنسك'}
              </h4>
              <button
                type="button"
                onClick={() => setReminderDialogItem(null)}
                className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#104B40] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="moazen-widget-sub rounded-xl border border-[#D6C18D] p-3">
              <p className="text-xs font-bold text-[#104B40]">
                {reminderDialogItem.order}.{' '}
                {isEnglish ? reminderDialogItem.titleEn : reminderDialogItem.titleAr}
              </p>
              <p className="text-[10.5px] text-[#4B5B58] mt-1">
                {isEnglish ? reminderDialogItem.stageEn : reminderDialogItem.stageAr}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172A28]">
                {isEnglish ? 'Choose reminder date & time:' : 'اختر تاريخ ووقت التنبيه:'}
              </label>
              <input
                type="datetime-local"
                value={reminderInput}
                onChange={(e) => setReminderInput(e.target.value)}
                className="w-full rounded-xl border border-[#D6C18D] bg-white px-3 py-2 text-xs font-bold text-[#104B40]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveReminder}
                className="flex-1 py-2.5 rounded-xl bg-[#104B40] text-white text-xs font-extrabold cursor-pointer"
              >
                {isEnglish ? 'Save Reminder' : 'حفظ التنبيه'}
              </button>
              {checklistState.reminders[reminderDialogItem.id]?.enabled && (
                <button
                  type="button"
                  onClick={handleClearReminder}
                  className="px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <BellOff className="w-3.5 h-3.5" />
                  <span>{isEnglish ? 'Clear' : 'إلغاء'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </MotionDialogPresence>
    </div>
  );
}
