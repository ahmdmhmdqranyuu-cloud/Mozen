import React, { useState, useMemo } from 'react';
import { ArrowRight, Menu, X, Search, Compass, BookOpen, CheckCircle2, Sparkles, Copy, Check, Share2 } from 'lucide-react';

interface HajjModalProps {
  isOpen: boolean;
  onClose: () => void;
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
        detail: 'إذا أراد الحاج السفر ومغادرة مكة وجب عليه أن يطوف بالبيت سبعة أشواط (طواف الوداع) ليكون آخر عهده بالبيت، ويسقط عن المرأة الحائض والنفساء تخفيفاً ورحمة.'
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

export function HajjModal({ isOpen, onClose }: HajjModalProps) {
  const [viewMode, setViewMode] = useState<'index' | 'detail'>('index');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(HAJJ_EXPANDED_CHAPTERS[0].id);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const currentIndex = HAJJ_EXPANDED_CHAPTERS.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? HAJJ_EXPANDED_CHAPTERS[currentIndex - 1] : null;
  const nextChapter = currentIndex < HAJJ_EXPANDED_CHAPTERS.length - 1 ? HAJJ_EXPANDED_CHAPTERS[currentIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F6F2] flex flex-col overflow-x-hidden animate-fadeIn" dir="rtl">
      {/* Clean White Top Header */}
      <div className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-sm border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (viewMode === 'detail') {
                  setViewMode('index');
                } else {
                  onClose();
                }
              }}
              className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors shrink-0 cursor-pointer"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28] truncate">
                {viewMode === 'index'
                  ? `فهرس موسوعة الحج والعمرة (${HAJJ_EXPANDED_CHAPTERS.length} أبواب)`
                  : currentChapter.categoryLabel}
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
                {viewMode === 'index'
                  ? 'فهرس رأسي منظم • اضغط على أي باب لفتح صفحته المستقلة'
                  : 'صفحة مستقلة للتفاصيل • اضغط للعودة إلى فهرس الحج والعمرة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {viewMode === 'detail' && (
              <button
                onClick={() => setViewMode('index')}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#104B40] text-white text-xs font-bold cursor-pointer"
              >
                <span>الفهرس</span>
              </button>
            )}
            <button
              onClick={() => setIsIndexOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] border border-gray-200 transition-colors cursor-pointer"
              aria-label="فهرس الحج والعمرة"
            >
              <Menu className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold">الأبواب</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible ☰ Index Drawer */}
      {isIndexOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-bold text-base text-[#172A28]">فهرس أبواب الحج والعمرة</h3>
              </div>
              <button
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
                  className="w-full bg-white border border-gray-200 rounded-xl py-2 pr-9 pl-3 text-xs text-[#172A28] placeholder-gray-400 focus:outline-none focus:border-[#C5A059]"
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
                    onClick={() => {
                      setSelectedChapterId(chap.id);
                      setViewMode('detail');
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

      {/* VIEW 1: ORGANIZED VERTICAL INDEX OF HAJJ & UMRAH CHAPTERS */}
      {viewMode === 'index' ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2.5 pb-20 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#172A28] font-cairo">
                  الفهرس الرأسي لأبواب ومناسك الحج والعمرة
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  اضغط على أي باب لفتح صفحته المستقلة بكامل الخطوات والأدعية والأحكام الفقهية
                </p>
              </div>
              <span className="text-xs font-bold text-[#C5A059] bg-[#F7F6F2] px-3 py-1 rounded-full">
                {filteredChapters.length} أبواب
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في فهرس مناسك الحج والعمرة..."
                className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl py-2 pr-9 pl-3 text-xs text-[#172A28] placeholder-gray-400 focus:outline-none focus:border-[#C5A059]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {filteredChapters.map((chap, idx) => (
            <button
              key={chap.id}
              onClick={() => {
                setSelectedChapterId(chap.id);
                setViewMode('detail');
              }}
              className="w-full text-right bg-white hover:bg-[#FAF9F5] p-4 rounded-2xl border border-gray-100 hover:border-[#C5A059]/60 shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#104B40] text-[#C5A059] font-bold text-sm flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C5A059]/15 text-[#9A7732]">
                      {chap.categoryLabel}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {chap.steps.length} خطوات
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#172A28] group-hover:text-[#104B40] transition-colors mt-1">
                    {chap.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{chap.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 rotate-180 group-hover:text-[#104B40] shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        /* VIEW 2: INDEPENDENT DETAIL PAGE FOR SELECTED HAJJ CHAPTER */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-20 max-w-2xl mx-auto w-full animate-fadeIn">
          {/* Top Back Bar */}
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center justify-between">
            <button
              onClick={() => setViewMode('index')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] text-xs font-bold cursor-pointer transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى فهرس الحج والعمرة</span>
            </button>
            <span className="text-xs font-bold text-[#9A7732] bg-[#C5A059]/15 px-3 py-1 rounded-full">
              الباب {currentIndex + 1} من {HAJJ_EXPANDED_CHAPTERS.length}
            </span>
          </div>

          {/* Chapter Summary White Widget */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#C5A059]/15 text-[#9A7732] text-xs font-bold">
                {currentChapter.categoryLabel}
              </span>
            </div>
            <h3 className="text-xl font-bold font-amiri text-[#172A28] mb-1 leading-relaxed">
              {currentChapter.title}
            </h3>
            <p className="text-xs font-bold text-[#C5A059] mb-3">{currentChapter.subtitle}</p>
            <p className="text-sm text-gray-700 leading-loose bg-[#F7F6F2] p-3.5 rounded-xl border border-gray-100">
              {currentChapter.summary}
            </p>
          </div>

          {/* Detailed Steps White Widgets */}
          <div className="space-y-3">
            {currentChapter.steps.map((step, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <h4 className="font-bold text-base text-[#172A28] font-cairo">{step.title}</h4>
                  <button
                    onClick={() => handleCopy(`${step.title}\n${step.detail}\n${step.dua || ''}`, `${currentChapter.id}-${idx}`)}
                    className="p-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                    title="نسخ"
                  >
                    {copiedId === `${currentChapter.id}-${idx}` ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-loose whitespace-pre-line">{step.detail}</p>
                {step.dua && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#F7F6F2] border border-[#C5A059]/30">
                    <span className="block text-[11px] font-bold text-[#9A7732] mb-1">الذكر والدعاء المأثور:</span>
                    <p className="font-amiri text-base font-bold text-[#172A28] leading-loose">{step.dua}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Important Fiqh Rulings White Widget */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <h4 className="font-bold text-sm text-[#172A28]">أحكام وضوابط فقهية مهمة</h4>
            </div>
            <div className="space-y-2.5">
              {currentChapter.rulings.map((ruling, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#C5A059] font-bold">✦</span>
                  <span>{ruling}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter Navigation */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex items-center justify-between gap-3">
            <button
              onClick={() => prevChapter && setSelectedChapterId(prevChapter.id)}
              disabled={!prevChapter}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 disabled:opacity-40 text-xs font-bold text-[#172A28] transition-colors text-right truncate cursor-pointer"
            >
              السابق: {prevChapter ? prevChapter.categoryLabel : 'البداية'}
            </button>
            <button
              onClick={() => nextChapter && setSelectedChapterId(nextChapter.id)}
              disabled={!nextChapter}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#C5A059] hover:bg-[#B08D46] disabled:opacity-40 text-xs font-bold text-white transition-colors text-left truncate cursor-pointer"
            >
              التالي: {nextChapter ? nextChapter.categoryLabel : 'النهاية'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

