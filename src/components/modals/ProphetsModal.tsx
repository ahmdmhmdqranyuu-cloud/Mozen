import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  X,
  Search,
  BookOpen,
  Share2,
  Copy,
  Check,
  Menu,
  Sparkles,
  Award,
  Type,
  CheckCircle2,
  MapPin,
  Clock,
  Heart,
  Users
} from 'lucide-react';
import { PROPHETS_STORIES, ProphetStory } from '../../data/prophetsData';
import {
  RIGHTEOUS_STORIES,
  RighteousStory,
  getSavedFavorites,
  toggleSavedFavorite
} from '../../data/islamicEncyclopediaData';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../../utils/shareContent';

interface ProphetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const READ_PROPHETS_KEY = 'moazen_read_prophets_v1';

const PROPHET_EXTRA_DETAILS: Record<string, { miracles: string[]; duaOrWisdom: string; expandedNarrative: string }> = {
  adam: {
    miracles: [
      'خلقه الله بيديه الكريمتين من قبضة من جميع تراب الأرض ونفخ فيه من روحه.',
      'تعليمه أسماء كل شيء في الكون وعلم اللغات والمسميات التي عجزت عنها الملائكة.',
      'سجود الملائكة كلهم أجمعين له سجود تكريم وتشريف بأمر الله تعالى.'
    ],
    duaOrWisdom: '﴿رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ﴾ [الأعراف: 23]',
    expandedNarrative: 'علّم آدم عليه السلام ذريته التوحيد الخالص وتقوى الله، وشهد قصة ابنيه هابيل وقابيل حيث قُدم القربان فتُقبل من التقي هابيل، فكان أول درس للبشرية في نبذ الحسد والبغي والاعتصام بتقوى الله، وعاش آدم عليه السلام ألف سنة يعمر الأرض بالعبادة والعلم حتى توفاه الله وغسلته الملائكة.'
  },
  idris: {
    miracles: [
      'أول من خط بالقلم وعلم الناس الكتابة والحساب والفلك.',
      'أول من خاط الثياب ولبس المخيط بعد أن كان الناس يلبسون الجلود.',
      'رفعه الله مكاناً علياً في السماء الرابعة كما ثبت في حديث الإسراء والمعراج.'
    ],
    duaOrWisdom: 'كان لا يغرز إبرة إلا قال: «سبحان الله والحمد لله ولا إله إلا الله والله أكبر».',
    expandedNarrative: 'جمع الله لإدريس عليه السلام بين النبوة والحكمة والعمل الصالح الدؤوب؛ فكان يصوم النهار ويقوم الليل، ويرتفع له كل يوم من العمل الصالح مثل ما يرتفع لأهل الأرض جميعاً في زمانه.'
  },
  nuh: {
    miracles: [
      'ثباته في الدعوة ألف سنة إلا خمسين عاماً (950 سنة) دون كلل ولا ملل.',
      'صناعة السفينة العملاقة على اليابسة بوحي الله ورعايته: ﴿وَاصْنَعِ الْفُلْكَ بِأَعْيُنِنَا وَوَحْيِنَا﴾.',
      'نجاته ومن معه من المؤمنين وزوجين من كل الكائنات من الطوفان العظيم الذي غمر رؤوس الجبال.'
    ],
    duaOrWisdom: '﴿رَّبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِمَن دَخَلَ بَيْتِيَ مُؤْمِنًا وَلِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ﴾ [نوح: 28]',
    expandedNarrative: 'سُمي نوح عليه السلام «الأب الثاني للبشرية» لأن الله جعل ذريته هم الباقين بعد الطوفان: ﴿وَجَعَلْنَا ذُرِّيَّتَهُ هُمُ الْبَاقِينَ﴾، وكان عبداً شكوراً يحمد الله على كل طعام وشراب ولباس.'
  },
  hud: {
    miracles: [
      'ثباته وحده أمام جبروت قوم عاد الذين قالوا: «من أشد منا قوة؟» وتحديه لهم بالتوكل على الله.',
      'نجاته والمؤمنين برحمة الله من الريح العقيم التي دمرت قصور عاد في سبع ليالٍ وثمانية أيام حسوماً.'
    ],
    duaOrWisdom: '﴿إِنِّي تَوَكَّلْتُ عَلَى اللَّهِ رَبِّي وَرَبِّكُم ۚ مَّا مِن دَابَّةٍ إِلَّا هُوَ آخِذٌ بِنَاصِيَتِهَا ۚ إِنَّ رَبِّي عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ﴾ [هود: 56]',
    expandedNarrative: 'بنى قوم عاد «إرم ذات العماد التي لم يخلق مثلها في البلاد» في الأحقاف، واغتروا بقوتهم البدنية ومصانعهم، فحبس الله عنهم المطر ثلاث سنين ثم ساق إليهم سحابة سوداء ظنوها عارضاً ممطراً فإذا هي ريح صرصر عاتية أهلكتهم، ونجى الله هوداً والذين آمنوا معه.'
  },
  salih: {
    miracles: [
      'خروج الناقة العجيبة العشراء من صخرة صماء بطلب من قوم ثمود آيةً من الله.',
      'كانت الناقة تشرب ماء البئر يوماً وتسقيهم لبناً يكفي القبيلة كلها، ويشربون هم من البئر في اليوم التالي.'
    ],
    duaOrWisdom: '﴿فَعَقَرُوهَا فَقَالَ تَمَتَّعُوا فِي دَارِكُمْ ثَلَاثَةَ أَيَّامٍ ۖ ذَٰلِكَ وَعْدٌ غَيْرُ مَكْذُوبٍ﴾ [هود: 65]',
    expandedNarrative: 'كان قوم ثمود ينحتون من الجبال بيوتاً فارهين في الحِجر (مدائن صالح)، فلما عقر أشقاهم الناقة أمهلهم الله ثلاثة أيام اصفرت فيها وجوههم ثم احمرت ثم اسودت، ثم أخذتهم الصيحة والرجفة فأصبحوا في ديارهم جاثمين.'
  },
  ibrahim: {
    miracles: [
      'جعل الله النار برداً وسلاماً عليه حين ألقاه قومه بالمنجنيق فلم تحرق منه إلا وثاقه.',
      'إحياء الطيور الأربعة المقطعة على الجبال الأربعة حين سأل ربه: ﴿رَبِّ أَرِنِي كَيْفَ تُحْيِي الْمَوْتَىٰ﴾.',
      'تفجر ماء زمزم لإسماعيل وأمه هاجر، ورفع القواعد من البيت الحرام بمكة المكرمة.'
    ],
    duaOrWisdom: '﴿رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ﴾ [إبراهيم: 40]',
    expandedNarrative: 'خليل الرحمن وأبو الأنبياء وإمام الموحدين، حاجّ النمرود الذي ادعى الربوبية فبهته بقوله: ﴿فَإِنَّ اللَّهَ يَأْتِي بِالشَّمْسِ مِنَ الْمَشْرِقِ فَأْتِ بِهَا مِنَ الْمَغْرِبِ﴾، وابتلاه الله بكلمات فأتمهن فجعله للناس إماماً، وأذن في الناس بالحج فأسمع الله نداءه كل من في الأصلاب والأرحام إلى يوم القيامة.'
  },
  lut: {
    miracles: [
      'طمس الله أعين المفسدين من قومه حين جاؤوا يراودونه عن ضيوفه من الملائكة.',
      'نجاته وأهله المؤمنين فجراً وقلب قرى سدوم (المؤتفكات) وأمطر الله عليها حجارة من سجيل منضود.'
    ],
    duaOrWisdom: '﴿قَالَ إِنِّي لِعَمَلِكُم مِّنَ الْقَالِينَ * رَبِّ نَجِّنِي وَأَهْلِي مِمَّا يَعْمَلُونَ﴾ [الشعراء: 168-169]',
    expandedNarrative: 'آمن لوط عليه السلام بعمه إبراهيم وهاجر معه إلى بلاد الشام، وأرسله الله إلى أهل سدوم الذين ابتدعوا الفاحشة التي لم يسبقهم بها أحد من العالمين، فأنذرهم وحذرهم فلم ينتهوا، فجعل الله ديارهم عاليها سافلها عبرةً للعالمين.'
  },
  ismail: {
    miracles: [
      'نبع ماء زمزم المبارك تحت قدميه وهو رضيع في وادي مكة غير ذي زرع.',
      'ثباته وصبره العظيم حين أخبره أبوه إبراهيم برؤيا الذبح وفداء الله له بذبح عظيم.',
      'مشاركته أباه إبراهيم عليهما السلام في رفع قواعد الكعبة المشرفة.'
    ],
    duaOrWisdom: '﴿يَا أَبَتِ افْعَلْ مَا تُؤْمَرُ ۖ سَتَجِدُنِي إِن شَاءَ اللَّهُ مِنَ الصَّابِرِينَ﴾ [الصافات: 102]',
    expandedNarrative: 'جد العرب المستعربة وجد نبينا محمد ﷺ، أثنى الله عليه بصدق الوعد (حيث انتظر رجلاً وعده في موضع ثلاثة أيام حتى جاء)، وكان يأمر أهله بالصلاة والزكاة وكان عند ربه مرضياً.'
  },
  ishaq: {
    miracles: [
      'ولادته المعجزة من أم عاقر عجوز (سارة بنت تسعين سنة) وأب شيخ كبير (إبراهيم ابن مائة سنة) ببشارة الملائكة.',
      'جعل الله النبوة والكتاب في ذريته (يعقوب والأسباط وأنبياء بني إسرائيل).'
    ],
    duaOrWisdom: '﴿وَوَهَبْنَا لَهُ إِسْحَاقَ وَيَعْقُوبَ نَافِلَةً ۖ وَكُلًّا جَعَلْنَا صَالِحِينَ﴾ [الأنبياء: 72]',
    expandedNarrative: 'بشرت الملائكة إبراهيم وسارة بإسحاق ومن وراء إسحاق يعقوب، فبارك الله فيه وجعله إماماً يهدي بأمر الله، وأقام في أرض كنعان بفلسطين يدعو إلى التوحيد.'
  },
  yaqub: {
    miracles: [
      'شمّه ريح قميص يوسف عليه السلام من مسيرة أيام حين خرجت العير من مصر.',
      'ارتداد بصره إليه كاملاً حين أُلقي قميص يوسف على وجهه بعد سنوات البكاء والصبر الجميل.'
    ],
    duaOrWisdom: '﴿فَصَبْرٌ جَمِيلٌ ۖ وَاللَّهُ الْمُسْتَعَانُ عَلَىٰ مَا تَصِفُونَ﴾ • ﴿إِنَّمَا أَشْكُو بَثِّي وَحُزْنِي إِلَى اللَّهِ﴾',
    expandedNarrative: 'يعقوب عليه السلام هو «إسرائيل» (أي عبد الله)، ربّى بنيه الأسباط الاثني عشر على التوحيد، وجمعهم عند موته يسألهم: ﴿مَا تَعْبُدُونَ مِن بَعْدِي قَالُوا نَعْبُدُ إِلَٰهَكَ وَإِلَٰهَ آبَائِكَ إِبْرَاهِيمَ وَإِسْمَاعِيلَ وَإِسْحَاقَ إِلَٰهًا وَاحِدًا وَنَحْنُ لَهُ مُسْلِمُونَ﴾.'
  },
  yusuf: {
    miracles: [
      'أُعطي شطر الحسن، وعلمه الله تأويل الأحاديث وتعبير الرؤى بدقة بالغة.',
      'إنقاذه مصر والبلاد المجاورة من مجاعة السبع السنين العجاف بحكمته وتخطيطه الاقتصادي الفريد.',
      'تحقق رؤياه بعد أربعين عاماً بسجود إخوته وأبويه له سجود تحية وتكريم على عرش مصر.'
    ],
    duaOrWisdom: '﴿رَبِّ قَدْ آتَيْتَنِي مِنَ الْمُلْكِ وَعَلَّمْتَنِي مِن تَأْوِيلِ الْأَحَادِيثِ ۚ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ أَنتَ وَلِيِّي فِي الدُّنْيَا وَالْآخِرَةِ ۖ تَوَفَّنِي مُسْلِمًا وَأَلْحِقْنِي بِالصَّالِحِينَ﴾',
    expandedNarrative: 'سمى الله قصته «أحسن القصص»؛ انتقل فيها من قعر الجب إلى الرق، ثم من فتنة قصر العزيز إلى السجن بضع سنين بعفته قائلًا ﴿مَعَاذَ اللَّهِ﴾، ثم خرج عزيزاً على خزائن الأرض وعفا عن إخوته قائلاً: ﴿لَا تَثْرِيبَ عَلَيْكُمُ الْيَوْمَ يَغْفِرُ اللَّهُ لَكُمْ وَهُوَ أَرْحَمُ الرَّاحِمِينَ﴾.'
  },
  ayyub: {
    miracles: [
      'صبره ثماني عشرة سنة على فقد المال والولد والمرض الشديد دون أن يشكو إلا إلى الله.',
      'نبع عين الماء الباردة بأمر الله حين ركض برجله، فغتسل منها وشرب فبرئ ظاهره وباطنه.',
      'آتاه الله أهله ومثلهم معهم وأمطر عليه جراداً من ذهب.'
    ],
    duaOrWisdom: '﴿أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ﴾ [الأنبياء: 83]',
    expandedNarrative: 'ضرب الله بأيوب عليه السلام المثل الأعلى في الصبر في العالمين فقال: ﴿إِنَّا وَجَدْنَاهُ صَابِرًا ۚ نِّعْمَ الْعَبْدُ ۖ إِنَّهُ أَوَّابٌ﴾، وظلت زوجته الصالحة تخدمه بوفاء نادر حتى كشف الله ضره.'
  },
  shuayb: {
    miracles: [
      'بلاغته وفصاحته الباهرة في الحجة والإقناع حتى لُقب بـ «خطيب الأنبياء».',
      'نجاته والمؤمنين وهلاك أصحاب مدين وأصحاب الأيكة بالرجفة والصيحة وعذاب يوم الظلة.'
    ],
    duaOrWisdom: '﴿إِنْ أُرِيدُ إِلَّا الْإِصْلَاحَ مَا اسْتَطَعْتُ ۚ وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ﴾ [هود: 88]',
    expandedNarrative: 'ربط شعيب عليه السلام بين التوحيد الخالص والأمانة الاقتصادية في المعاملات؛ فنهى قومه عن تطفيف المكيال والميزان وبخس الناس أشياءهم وإفساد الأسواق وقطع الطريق.'
  },
  musa: {
    miracles: [
      'تكليم الله تعالى له مباشرة بلا واسطة (كليم الله).',
      'الآيات التسع البينات: انقلاب العصا حية تسعى، واليد البيضاء من غير سوء، والطوفان والجراد والقمل والضفادع والدم.',
      'انفلاق البحر اثني عشر طريقاً يبساً كالطود العظيم، وانفجار اثنتي عشرة عيناً من الحجر، وتظليل الغمام وإنزال المن والسلوى.'
    ],
    duaOrWisdom: '﴿رَبِّ اشْرَحْ لِي صَدْرِي * وَيَسِّرْ لِي أَمْرِي * وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي * يَفْقَهُوا قَوْلِي﴾ • ﴿رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ﴾',
    expandedNarrative: 'أكثر الأنبياء ذكراً في القرآن الكريم (136 مرة)، حفظه الله رضيعاً في التابوت في اليم ورباه في قصر فرعون عدوه، ثم أرسله مع أخيه هارون لتحرير بني إسرائيل وإقامة التوحيد، وأنزل عليه التوراة فيها هدى ونور.'
  },
  harun: {
    miracles: [
      'فصاحة اللسان والبيان ومؤازرته الكاملة لأخيه موسى عليه السلام في مواجهة فرعون.',
      'مشاركته موسى في الآيات البينات وحفظه للتوحيد.'
    ],
    duaOrWisdom: '﴿رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِّلْقَوْمِ الظَّالِمِينَ * وَنَجِّنَا بِرَحْمَتِكَ مِنَ الْقَوْمِ الْكَافِرِينَ﴾',
    expandedNarrative: 'استجاب الله شفاعة موسى في أخيه هارون فجعله نبياً ووزيراً يشد به أزره ويشركه في أمره، ولما عبد بعض بني إسرائيل العجل في غياب موسى لميقات ربه نهاهم هارون وحذرهم وحرص على حفظ وحدة المؤمنين حتى عاد موسى.'
  },
  dhulkifl: {
    miracles: [
      'وفاؤه الكامل بعهده في القضاء بالعدل بين الناس والصيام بالنهار والقيام بالليل دون غضب.',
      'ثناء الله عليه مع إسماعيل وإدريس بالصبر والصلاح.'
    ],
    duaOrWisdom: '﴿وَإِسْمَاعِيلَ وَإِدْرِيسَ وَذَا الْكِفْلِ ۖ كُلٌّ مِّنَ الصَّابِرِينَ * وَأَدْخَلْنَاهُمْ فِي رَحْمَتِنَا ۖ إِنَّهُم مِّنَ الصَّالِحِينَ﴾ [الأنبياء: 85-86]',
    expandedNarrative: 'تكفل لقومه بأن يقضي بينهم بالحق ولا يغضب، وأن يصوم النهار ويقوم الليل، فحاول الشيطان مراراً إغضابه فلم يقدر لحلمه وصبره وثباته على طاعة الله.'
  },
  dawud: {
    miracles: [
      'إلانة الحديد بين يديه كالعجين بلا نار ولا مطرقة يصنع منه الدروع السابغات.',
      'تسخير الجبال والطير يسبحن معه بالعشي والإشراق لجمال صوته بتلاوة الزبور.',
      'قتله الطاغية جالوت وهو فتى شاب، وإيتاؤه الحكمة وفصل الخطاب.'
    ],
    duaOrWisdom: 'أحب الصيام إلى الله صيام داود؛ كان يصوم يوماً ويفطر يوماً، وأحب الصلاة إلى الله صلاة داود؛ كان ينام نصف الليل ويقوم ثلثه وينام سدسه.',
    expandedNarrative: 'جمع الله لداود عليه السلام بين الملك العظيم والنبوة، ومع سعة ملكه كان لا يأكل إلا من عمل يده، وكان كثير الأوبة والتسبيح والبكاء من خشية الله.'
  },
  sulayman: {
    miracles: [
      'تسخير الريح تجري بأمره غدوها شهر ورواحها شهر، وعين القطر (النحاس المذاب).',
      'تعليمه منطق الطير والنمل والحيوانات.',
      'تسخير الجن والشياطين يعملون بين يديه من محاريب وتماثيل وجفان كالجواب، وإحضار عرش ملكة سبأ في طرفة عين.'
    ],
    duaOrWisdom: '﴿رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ﴾ • ﴿رَبِّ اغْفِرْ لِي وَهَبْ لِي مُلْكًا لَّا يَنبَغِي لِأَحَدٍ مِّن بَعْدِي﴾',
    expandedNarrative: 'آتاه الله ملكاً لم يؤته أحداً من العالمين، ومع ذلك تواضع لنملة سمع كلامها فتبسم ضاحكاً وشكر الله، ودعا ملكة سبأ بالحكمة والبرهان حتى قالت: ﴿رَبِّ إِنِّي ظَلَمْتُ نَفْسِي وَأَسْلَمْتُ مَعَ سُلَيْمَانَ لِلَّهِ رَبِّ الْعَالَمِينَ﴾.'
  },
  ilyas: {
    miracles: [
      'ثباته في مواجهة الملك الظالم وقومه الذين عبدوا الصنم «بعلاً».',
      'حبس المطر عن القوم المتمردين ثم نزوله بدعائه عليه السلام.'
    ],
    duaOrWisdom: '﴿أَتَدْعُونَ بَعْلًا وَتَذَرُونَ أَحْسَنَ الْخَالِقِينَ * اللَّهَ رَبَّكُمْ وَرَبَّ آبَائِكُمُ الْأَوَّلِينَ﴾ • ﴿سَلَامٌ عَلَىٰ إِلْ يَاسِينَ﴾',
    expandedNarrative: 'بعثه الله في بعلبك بلبنان والشام لتجديد التوحيد بعد أن فتن الشيطان القوم بعبادة صنم من ذهب اسمه «بعل»، فصدع بالحق وصبر على الأذى فخلّد الله ثناءه في العالمين.'
  },
  alyasa: {
    miracles: [
      'تفضيل الله له على العالمين في زمانه وجمعه كلمة بني إسرائيل على التوحيد.',
      'تطهير عين ماء أريحا وإجراء البركة في طعام المؤمنين.'
    ],
    duaOrWisdom: '﴿وَإِسْمَاعِيلَ وَالْيَسَعَ وَيُونُسَ وَلُوطًا ۚ وَكُلًّا فَضَّلْنَا عَلَى الْعَالَمِينَ﴾ [الأنعام: 86]',
    expandedNarrative: 'تتلمذ على يد نبي الله إلياس عليه السلام وخلفه في دعوة بني إسرائيل، فحكم فيهم بالتوراة وأقام العدل وقاوم الوثنية.'
  },
  yunus: {
    miracles: [
      'بقاءه حياً في بطن الحوت في الظلمات الثلاث (ظلمة الليل وظلمة البحر وظلمة بطن الحوت) دون أن يتهشم عظمه.',
      'إنبات شجرة من يقطين تظلله وتغذيه بعد أن نبذه الحوت بالعراء وهو سقيم.',
      'إيمان قومه جميعاً (مائة ألف أو يزيدون) في نينوى ورفع العذاب عنهم بعد تضرعهم.'
    ],
    duaOrWisdom: '﴿لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ﴾ [الأنبياء: 87]',
    expandedNarrative: 'قال النبي ﷺ: «دعوة ذي النون إذ دعا وهو في بطن الحوت: لا إله إلا أنت سبحانك إني كنت من الظالمين؛ فإنه لم يدعُ بها رجل مسلم في شيء قط إلا استجاب الله له»، وقوم يونس هم القرية الوحيدة التي آمنت أجمعها لما رأت أمارات العذاب فكشفه الله عنهم.'
  },
  zakariya: {
    miracles: [
      'رزقه الله بالولد البار يحيى عليه السلام بعد أن بلغ من الكبر عتياً وامرأته عاقر.',
      'رؤيته الفاكهة في محراب مريم عليها السلام؛ فاكهة الصيف في الشتاء وفاكهة الشتاء في الصيف.',
      'آية الله له ألا يكلم الناس ثلاثة أيام إلا رمزاً مع سلامة لسانه وقدرته على التسبيح بكرة وعشياً.'
    ],
    duaOrWisdom: '﴿رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ﴾ • ﴿رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً ۖ إِنَّكَ سَمِيعُ الدُّعَاءِ﴾',
    expandedNarrative: 'كان زكريا عليه السلام نجاراً يأكل من كسب يده، وكفل مريم الصديقة في بيت المقدس، ونادى ربه نداءً خفياً فاستجاب الله له وأصلح له زوجه ووهب له يحيى.'
  },
  yahya: {
    miracles: [
      'سماه الله عز وجل باسمه «يحيى» قبل أن يولد ولم يُسمَّ به أحد قبله.',
      'آتاه الله الحكم والعلم والحكمة وهو صبي صغير، وكان سيداً وحصوراً ونبياً من الصالحين.'
    ],
    duaOrWisdom: '﴿يَا يَحْيَىٰ خُذِ الْكِتَابَ بِقُوَّةٍ ۖ وَآتَيْنَاهُ الْحُكْمَ صَبِيًّا * وَحَنَانًا مِّن لَّدُنَّا وَزَكَاةً ۖ وَكَانَ تَقِيًّا * وَبَرًّا بِوَالِدَيْهِ﴾ [مريم: 12-14]',
    expandedNarrative: 'كان يحيى عليه السلام كثير البكاء من خشية الله، زاهداً عفيفاً باراً بوالديه، وجهر بكلمة الحق في وجه الطغيان دفاعاً عن شريعة الله حتى قُتل شهيداً.'
  },
  isa: {
    miracles: [
      'ولادته المعجزة من مريم العذراء البتول بكلمة الله «كن» دون أب.',
      'كلامه في المهد صبياً دفاعاً عن طهارة أمه: ﴿إِنِّي عَبْدُ اللَّهِ آتَانِيَ الْكِتَابَ وَجَعَلَنِي نَبِيًّا﴾.',
      'خلق الطير من الطين بإذن الله، وإبراء الأكمه والأبرص، وإحياء الموتى بإذن الله، ونزول المائدة من السماء، ورفعه إلى السماء حياً.'
    ],
    duaOrWisdom: '﴿وَجَعَلَنِي مُبَارَكًا أَيْنَ مَا كُنتُ وَأَوْصَانِي بِالصَّلَاةِ وَالزَّكَاةِ مَا دُمْتُ حَيًّا * وَبَرًّا بِوَالِدَتِي﴾ [مريم: 31-32]',
    expandedNarrative: 'المسيح عيسى ابن مريم عليه السلام كلمة الله وروحه ورسوله إلى بني إسرائيل، أنزل الله عليه الإنجيل وبشّر بخاتم الأنبياء أحمد ﷺ، ولما مكر به اليهود لقتله ألقى الله شبهه على غيره ورفعه الله إليه حياً: ﴿وَمَا قَتَلُوهُ وَمَا صَلَبُوهُ وَلَٰكِن شُبِّهَ لَهُمْ﴾ وسينزل في آخر الزمان حكماً عدلاً.'
  },
  muhammad: {
    miracles: [
      'المعجزة الخالدة العظمى: القرآن الكريم المحفوظ بحفظ الله إلى يوم القيامة.',
      'الإسراء والمعراج، وانشقاق القمر، ونبع الماء من بين أصابعه الشريفة، وتكثير الطعام القليل للجيش، وحنين الجذع إليه.',
      'ختم النبوة والرسالة، وعموم بعثته للثقلين الإنس والجن، والشفاعة العظمى والمقام المحمود يوم القيامة.'
    ],
    duaOrWisdom: '﴿وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ﴾ • ﴿وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ﴾',
    expandedNarrative: 'سيد ولد آدم وخاتم الأنبياء والمرسلين وإمام المتقين محمد بن عبد الله ﷺ، أخرج الله به الناس من الظلمات إلى النور، وجمع به القلوب المتفرقة، وأكمل به الدين وأتم به النعمة، وجعل طاعته من طاعة الله ومحبته أصل الإيمان.'
  }
};

export const ProphetsModal: React.FC<ProphetsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [sectionTab, setSectionTab] = useState<'prophets' | 'righteous'>('prophets');
  const [viewMode, setViewMode] = useState<'index' | 'detail'>('index');
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'ulul_azm' | 'read'>('all');
  const [righteousFilter, setRighteousFilter] = useState<
    'all' | 'righteous_women' | 'quran_sunnah' | 'tabieen' | 'imams' | 'rulers' | 'favorites'
  >('all');
  const [selectedProphet, setSelectedProphet] = useState<ProphetStory>(PROPHETS_STORIES[0]);
  const [selectedRighteous, setSelectedRighteous] = useState<RighteousStory>(RIGHTEOUS_STORIES[0]);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => getSavedFavorites());
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(READ_PROPHETS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (selectedProphet && !readIds.includes(selectedProphet.id)) {
      const updated = [...readIds, selectedProphet.id];
      setReadIds(updated);
      try {
        localStorage.setItem(READ_PROPHETS_KEY, JSON.stringify(updated));
      } catch {}
    }
  }, [selectedProphet]);

  if (!isOpen) return null;

  const totalStoriesCount = PROPHETS_STORIES.length + RIGHTEOUS_STORIES.length;

  const filtered = PROPHETS_STORIES.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.includes(search.trim()) ||
      p.title.includes(search.trim()) ||
      p.summary.includes(search.trim()) ||
      p.location.includes(search.trim());
    if (!matchesSearch) return false;
    if (filterMode === 'ulul_azm') return Boolean(p.isUlulAzm);
    if (filterMode === 'read') return readIds.includes(p.id);
    return true;
  });

  const filteredRighteous = RIGHTEOUS_STORIES.filter((r) => {
    const matchesSearch =
      !search.trim() ||
      r.name.includes(search.trim()) ||
      r.title.includes(search.trim()) ||
      r.summary.includes(search.trim()) ||
      r.fullStory.includes(search.trim());
    if (!matchesSearch) return false;
    if (righteousFilter === 'all') return true;
    if (righteousFilter === 'favorites') return favorites.includes(`righteous:${r.id}`);
    if (righteousFilter === 'righteous_women') return r.subCategory === 'righteous_women';
    if (righteousFilter === 'quran_sunnah') return r.subCategory === 'quran_sunnah';
    if (righteousFilter === 'tabieen')
      return r.category === 'tabieen' || (r.category === 'ascetics' && !r.subCategory);
    if (righteousFilter === 'imams') return r.category === 'imams';
    if (righteousFilter === 'rulers') return r.category === 'rulers';
    return true;
  });

  const extra = PROPHET_EXTRA_DETAILS[selectedProphet.id];

  const handleToggleFavorite = (favId: string) => {
    setFavorites(toggleSavedFavorite(favId));
  };

  const handleCopyStory = (prophet: ProphetStory) => {
    const extraInfo = PROPHET_EXTRA_DETAILS[prophet.id];
    const fullText = `قصة ${prophet.name} (${prophet.title})\n\n${prophet.summary}\n\n${prophet.detailedStory}\n\n${extraInfo?.expandedNarrative || ''}\n\nالدروس والعبر:\n• ${prophet.lessons.join('\n• ')}\n\nالشاهد القرآني: ﴿${prophet.quranVerse}﴾ [${prophet.quranSurah}]\n\nمن تطبيق المؤذن الإسلامي`;
    navigator.clipboard?.writeText(fullText);
    setCopiedId(prophet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareStory = async (prophet: ProphetStory) => {
    await shareIslamicText({
      title: `قصة ${prophet.name} (${prophet.title})`,
      body: `${prophet.summary}\n\n${prophet.detailedStory}\n\n✨ الدروس والعبر المستفادة:\n• ${prophet.lessons.join('\n• ')}`,
      source: `الشاهد القرآني: ﴿${prophet.quranVerse}﴾ [${prophet.quranSurah}]`,
    });
  };

  const handleShareStoryCard = async (prophet: ProphetStory) => {
    await shareOrDownloadAsImageCard({
      categoryBadge: `قصص الأنبياء والمرسلين • ${prophet.title}`,
      title: prophet.name,
      mainText: `${prophet.summary}\n\n✨ من العبر المستفادة: ${prophet.lessons[0] || ''}`,
      referenceText: `﴿${prophet.quranVerse}﴾ [${prophet.quranSurah}]`,
      footer: 'موسوعة قصص الأنبياء والمرسلين — تطبيق المؤذن',
    });
  };

  const handleCopyRighteous = (person: RighteousStory) => {
    const fullText = `قصة ${person.name} (${person.title})\nالعصر: ${person.era}\n\n${person.summary}\n\n${person.fullStory}\n\nالدروس والعبر:\n• ${person.virtuesAndLessons.join('\n• ')}\n\nمن أقواله ومآثره: ${person.famousQuote}\nالمصدر: ${person.source}\n\nمن تطبيق المؤذن الإسلامي`;
    navigator.clipboard?.writeText(fullText);
    setCopiedId(person.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareRighteous = async (person: RighteousStory) => {
    await shareIslamicText({
      title: `قصة ${person.name} (${person.title})`,
      body: `${person.summary}\n\n${person.fullStory}\n\n✨ الدروس والعبر المستفادة:\n• ${person.virtuesAndLessons.join('\n• ')}`,
      source: person.source,
    });
  };

  const handleShareRighteousCard = async (person: RighteousStory) => {
    await shareOrDownloadAsImageCard({
      categoryBadge: `قصص الصالحين والصالحات • ${person.era}`,
      title: `${person.name} (${person.title})`,
      mainText: `${person.summary}\n\n✨ من العبر المستفادة: ${person.virtuesAndLessons[0] || ''}`,
      referenceText: person.source,
      footer: 'موسوعة قصص الأنبياء والصالحين — تطبيق المؤذن',
    });
  };

  const currentIndex = PROPHETS_STORIES.findIndex((p) => p.id === selectedProphet.id);
  const prevProphet = currentIndex > 0 ? PROPHETS_STORIES[currentIndex - 1] : null;
  const nextProphet =
    currentIndex >= 0 && currentIndex < PROPHETS_STORIES.length - 1
      ? PROPHETS_STORIES[currentIndex + 1]
      : null;

  const currentRighteousIdx = filteredRighteous.findIndex((r) => r.id === selectedRighteous.id);
  const prevRighteous =
    currentRighteousIdx > 0 ? filteredRighteous[currentRighteousIdx - 1] : null;
  const nextRighteous =
    currentRighteousIdx >= 0 && currentRighteousIdx < filteredRighteous.length - 1
      ? filteredRighteous[currentRighteousIdx + 1]
      : null;

  return (
    <div
      className="fixed inset-0 z-50 w-full h-full bg-[#F7F6F2] flex flex-col overflow-x-hidden select-none animate-fadeIn"
      dir="rtl"
    >
      {/* Clean White Top Header */}
      <div className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-sm border-b border-gray-100 shrink-0 w-full overflow-x-hidden">
        <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto w-full">
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
                {viewMode === 'detail'
                  ? sectionTab === 'prophets'
                    ? selectedProphet.name
                    : selectedRighteous.name
                  : `موسوعة قصص الأنبياء والصالحين (${totalStoriesCount} قصة)`}
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
                {viewMode === 'detail'
                  ? sectionTab === 'prophets'
                    ? `${selectedProphet.title} • صفحة القصة والعبر المستفادة`
                    : `${selectedRighteous.title} • ${selectedRighteous.era}`
                  : 'فهرس رأسي منظم لجميع قصص الأنبياء والمرسلين والصالحين والصالحات'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewMode === 'detail' && (
              <>
                <button
                  onClick={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')}
                  className="w-9 h-9 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] border border-gray-200 cursor-pointer"
                  title="تكبير/تصغير الخط"
                >
                  <Type className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('index')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white transition-colors cursor-pointer"
                  aria-label="الفهرس"
                >
                  <Menu className="w-4 h-4 text-[#C5A059]" />
                  <span className="text-xs font-bold">الفهرس</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Section Switcher & Search in Index Mode */}
        {viewMode === 'index' && (
          <div className="max-w-3xl mx-auto mt-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSectionTab('prophets')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sectionTab === 'prophets'
                    ? 'bg-[#104B40] text-white shadow-xs'
                    : 'bg-[#F7F6F2] text-gray-600 hover:bg-gray-200'
                }`}
              >
                قصص الأنبياء والمرسلين (25)
              </button>
              <button
                onClick={() => setSectionTab('righteous')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  sectionTab === 'righteous'
                    ? 'bg-[#104B40] text-white shadow-xs'
                    : 'bg-[#F7F6F2] text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>قصص الصالحين والصالحات ({RIGHTEOUS_STORIES.length})</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  sectionTab === 'prophets'
                    ? 'ابحث عن اسم نبي أو رسول أو معجزة...'
                    : 'ابحث في قصص الصالحين والصالحات والتابعين...'
                }
                className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl py-2 pr-9 pl-8 text-xs text-[#172A28] placeholder-gray-400 focus:outline-none focus:border-[#C5A059]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {sectionTab === 'prophets' ? (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { id: 'all', label: 'جميع الأنبياء (25)' },
                  { id: 'ulul_azm', label: 'أولو العزم من الرسل (5)' },
                  { id: 'read', label: `مقروءة (${readIds.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterMode(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      filterMode === tab.id
                        ? 'bg-[#C5A059] text-white shadow-xs'
                        : 'bg-[#F7F6F2] text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { id: 'all', label: `الكل (${RIGHTEOUS_STORIES.length})` },
                  { id: 'righteous_women', label: 'قصص الصالحات والعابدات' },
                  { id: 'quran_sunnah', label: 'قصص الصالحين في القرآن والسنة' },
                  { id: 'tabieen', label: 'التابعون والعباد' },
                  { id: 'imams', label: 'الأئمة والعلماء' },
                  { id: 'rulers', label: 'الخلفاء والقادة العادلون' },
                  { id: 'favorites', label: 'المفضلة ❤️' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setRighteousFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      righteousFilter === cat.id
                        ? 'bg-[#C5A059] text-white shadow-xs'
                        : 'bg-[#F7F6F2] text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEW 1: ORGANIZED VERTICAL INDEX (فهرس رأسي منظم — عنصر تحت الآخر) */}
      {viewMode === 'index' ? (
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 pb-24 space-y-2.5 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-[#172A28]">
              {sectionTab === 'prophets'
                ? `الفهرس الرأسي لقصص الأنبياء والمرسلين (${filtered.length} قصة)`
                : `الفهرس الرأسي لقصص الصالحين والصالحات (${filteredRighteous.length} قصة)`}
            </span>
            <span className="text-[11px] text-[#9A7732] font-bold">
              اضغط على أي اسم لفتح صفحته المستقلة
            </span>
          </div>

          {sectionTab === 'prophets' ? (
            filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-xs border border-gray-100">
                لا توجد قصص مطابقة لبحثك
              </div>
            ) : (
              filtered.map((prophet) => {
                const idx = PROPHETS_STORIES.findIndex((p) => p.id === prophet.id);
                const isFav = favorites.includes(`prophet:${prophet.id}`);
                const isRead = readIds.includes(prophet.id);
                return (
                  <button
                    key={prophet.id}
                    onClick={() => {
                      setSelectedProphet(prophet);
                      setViewMode('detail');
                    }}
                    className="w-full text-right bg-white hover:bg-amber-50/40 p-4 rounded-2xl border border-gray-100 hover:border-[#C5A059] shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="w-9 h-9 rounded-xl bg-[#104B40] text-[#C5A059] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold font-amiri text-[#172A28] group-hover:text-[#104B40]">
                            {prophet.name}
                          </h3>
                          <span className="text-[11px] font-bold text-[#9A7732] bg-[#C5A059]/15 px-2.5 py-0.5 rounded-full">
                            {prophet.title}
                          </span>
                          {prophet.isUlulAzm && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-[#104B40] border border-emerald-200 px-2 py-0.5 rounded-full">
                              من أولي العزم
                            </span>
                          )}
                          {isRead && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1 mt-1 leading-relaxed">
                          {prophet.summary}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 font-medium">
                          <span>📍 {prophet.location}</span>
                          <span>📖 ذُكر {prophet.mentionedInQuranCount} مرة</span>
                          <span className="text-[#104B40] font-bold">
                            ✨ {prophet.lessons.length} دروس وعبر مستفادة
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isFav && <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />}
                      <span className="px-3 py-1.5 rounded-xl bg-[#F7F6F2] group-hover:bg-[#104B40] group-hover:text-white text-[#172A28] text-[11px] font-bold transition-colors">
                        قراءة القصة
                      </span>
                    </div>
                  </button>
                );
              })
            )
          ) : filteredRighteous.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-xs border border-gray-100">
              لا توجد قصص مطابقة لبحثك
            </div>
          ) : (
            filteredRighteous.map((person, idx) => {
              const isFav = favorites.includes(`righteous:${person.id}`);
              return (
                <button
                  key={person.id}
                  onClick={() => {
                    setSelectedRighteous(person);
                    setViewMode('detail');
                  }}
                  className="w-full text-right bg-white hover:bg-amber-50/40 p-4 rounded-2xl border border-gray-100 hover:border-[#C5A059] shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="w-9 h-9 rounded-xl bg-[#104B40] text-[#C5A059] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold font-amiri text-[#172A28] group-hover:text-[#104B40]">
                          {person.name}
                        </h3>
                        <span className="text-[11px] font-bold text-[#9A7732] bg-[#C5A059]/15 px-2.5 py-0.5 rounded-full">
                          {person.title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1 mt-1 leading-relaxed">
                        {person.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 font-medium">
                        <span>🕰️ {person.era}</span>
                        <span className="text-[#104B40] font-bold">
                          ✨ {person.virtuesAndLessons.length} دروس وعبر مستفادة
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isFav && <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />}
                    <span className="px-3 py-1.5 rounded-xl bg-[#F7F6F2] group-hover:bg-[#104B40] group-hover:text-white text-[#172A28] text-[11px] font-bold transition-colors">
                      قراءة القصة
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : sectionTab === 'prophets' ? (
        /* VIEW 2A: INDEPENDENT DETAIL PAGE FOR PROPHET STORY */
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 pb-24 space-y-4 max-w-3xl mx-auto animate-fadeIn">
          {/* Top Back to Vertical Index Bar */}
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex items-center justify-between gap-2">
            <button
              onClick={() => setViewMode('index')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى فهرس قصص الأنبياء</span>
            </button>

            <span className="text-xs bg-[#C5A059]/15 text-[#9A7732] font-bold px-3 py-1 rounded-full">
              النبي {currentIndex + 1} من 25
            </span>
          </div>

          {/* White Hero Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedProphet.isUlulAzm && (
                  <span className="text-xs bg-[#F7F6F2] text-[#172A28] border border-gray-200 font-bold px-3 py-1 rounded-full">
                    من أولي العزم من الرسل
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleToggleFavorite(`prophet:${selectedProphet.id}`)}
                  className="p-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                  title="إضافة للمفضلة"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favorites.includes(`prophet:${selectedProphet.id}`)
                        ? 'text-rose-600 fill-rose-600'
                        : 'text-gray-500'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleShareStoryCard(selectedProphet)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#9A7732] border border-[#C5A059]/40 text-xs font-bold transition-colors cursor-pointer"
                  title="مشاركة بـ 5 خلفيات إسلامية أوفلاين"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>بطاقة مصورة (5 خلفيات)</span>
                </button>
                <button
                  onClick={() => handleCopyStory(selectedProphet)}
                  className="p-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                  title="نسخ القصة"
                >
                  {copiedId === selectedProphet.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleShareStory(selectedProphet)}
                  className="p-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white transition-colors cursor-pointer"
                  title="مشاركة"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h1 className="text-2xl font-bold font-amiri text-[#172A28] mb-1 break-words">
              {selectedProphet.name}
            </h1>
            <p className="text-sm font-bold text-[#C5A059] mb-3 break-words">
              {selectedProphet.title}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 text-xs">
              <div className="bg-[#F7F6F2] p-2.5 rounded-xl flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span className="truncate font-medium">المكان: {selectedProphet.location}</span>
              </div>
              <div className="bg-[#F7F6F2] p-2.5 rounded-xl flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span className="truncate font-medium">الحقبة: {selectedProphet.era}</span>
              </div>
              <div className="bg-[#F7F6F2] p-2.5 rounded-xl flex items-center gap-2 text-gray-700">
                <BookOpen className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span className="truncate font-medium">ذُكر في القرآن: {selectedProphet.mentionedInQuranCount} مرة</span>
              </div>
            </div>

            {/* Quranic Witness Box */}
            <div className="bg-[#F7F6F2] rounded-xl p-4 border border-[#C5A059]/30 text-center space-y-1.5">
              <p className="text-base sm:text-lg font-bold font-amiri text-[#172A28] leading-loose break-words">
                ﴿{selectedProphet.quranVerse}﴾
              </p>
              <span className="text-xs text-[#9A7732] font-bold block">
                [{selectedProphet.quranSurah}]
              </span>
            </div>
          </div>

          {/* Summary White Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
            <h3 className="text-sm font-bold text-[#172A28] flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-100">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>خلاصة الرسالة والنبوة</span>
            </h3>
            <p
              className={`text-gray-700 leading-loose break-words ${
                fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm'
              }`}
            >
              {selectedProphet.summary}
            </p>
          </div>

          {/* Full Expanded Story White Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
            <h3 className="text-sm font-bold text-[#172A28] flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <BookOpen className="w-4 h-4 text-[#C5A059]" />
              <span>القصة التفصيلية الكاملة</span>
            </h3>
            <div
              className={`text-gray-800 leading-loose space-y-3.5 font-amiri break-words ${
                fontSize === 'large' ? 'text-xl' : 'text-lg'
              }`}
            >
              {selectedProphet.detailedStory.split('\n').map((paragraph, index) => (
                <p key={index} className="leading-loose break-words">
                  {paragraph}
                </p>
              ))}
              {extra?.expandedNarrative && (
                <p className="leading-loose pt-2 border-t border-gray-100 text-[#172A28] break-words">
                  {extra.expandedNarrative}
                </p>
              )}
            </div>
          </div>

          {/* Miracles & Signs White Card */}
          {extra?.miracles && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
              <h3 className="text-sm font-bold text-[#172A28] flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <Award className="w-4 h-4 text-[#C5A059]" />
                <span>المعجزات والآيات البينات</span>
              </h3>
              <div className="space-y-2.5">
                {extra.miracles.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#F7F6F2] border border-gray-100 text-sm text-gray-800 leading-relaxed break-words"
                  >
                    ✦ {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prophetic Dua or Wisdom White Card */}
          {extra?.duaOrWisdom && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
              <h3 className="text-sm font-bold text-[#172A28] flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-100">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>من دعائه وحكمته عليه السلام</span>
              </h3>
              <p className="font-amiri text-lg font-bold text-[#172A28] leading-loose bg-[#F7F6F2] p-4 rounded-xl border border-[#C5A059]/30 break-words">
                {extra.duaOrWisdom}
              </p>
            </div>
          )}

          {/* Key Events Timeline White Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
            <h3 className="text-sm font-bold text-[#172A28] flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>أبرز المحطات والأحداث المفصلية</span>
            </h3>
            <div className="space-y-2.5">
              {selectedProphet.keyEvents.map((event, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-[#C5A059]/15 text-[#9A7732] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed break-words flex-1">{event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lessons Learned White Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
            <h3 className="text-sm font-bold text-[#172A28] flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>الدروس والعبر المستفادة</span>
            </h3>
            <div className="space-y-2">
              {selectedProphet.lessons.map((lesson, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#C5A059] font-bold shrink-0">•</span>
                  <span className="break-words flex-1">{lesson}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
              <strong className="text-[#104B40]">المصادر الموثقة:</strong> القرآن الكريم • قصص الأنبياء لابن كثير • البداية والنهاية • صحيحا البخاري ومسلم.
            </div>
          </div>

          {/* Navigation Between Prophets White Card */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex items-center justify-between gap-3 w-full">
            <button
              onClick={() => prevProphet && setSelectedProphet(prevProphet)}
              disabled={!prevProphet}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 disabled:opacity-40 text-xs font-bold text-[#172A28] transition-colors text-right truncate cursor-pointer"
            >
              السابق: {prevProphet ? prevProphet.name : 'الأول'}
            </button>
            <button
              onClick={() => nextProphet && setSelectedProphet(nextProphet)}
              disabled={!nextProphet}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#C5A059] hover:bg-[#B08D46] disabled:opacity-40 text-xs font-bold text-white transition-colors text-left truncate cursor-pointer"
            >
              التالي: {nextProphet ? nextProphet.name : 'الخاتم ﷺ'}
            </button>
          </div>
        </div>
      ) : (
        /* VIEW 2B: INDEPENDENT DETAIL PAGE FOR RIGHTEOUS STORY */
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 pb-24 space-y-4 max-w-3xl mx-auto animate-fadeIn">
          {/* Top Back to Vertical Index Bar */}
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex items-center justify-between gap-2">
            <button
              onClick={() => setViewMode('index')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى فهرس الصالحين والصالحات</span>
            </button>

            <span className="text-xs bg-[#104B40]/10 text-[#104B40] font-bold px-3 py-1 rounded-full">
              القصة {currentRighteousIdx >= 0 ? currentRighteousIdx + 1 : 1} من {filteredRighteous.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs bg-[#C5A059]/15 text-[#9A7732] font-bold px-3 py-1 rounded-full">
                  {selectedRighteous.era}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleToggleFavorite(`righteous:${selectedRighteous.id}`)}
                  className="p-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                  title="إضافة للمفضلة"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favorites.includes(`righteous:${selectedRighteous.id}`)
                        ? 'text-rose-600 fill-rose-600'
                        : 'text-gray-500'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleShareRighteousCard(selectedRighteous)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#9A7732] border border-[#C5A059]/40 text-xs font-bold transition-colors cursor-pointer"
                  title="مشاركة بـ 5 خلفيات إسلامية أوفلاين"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>بطاقة مصورة (5 خلفيات)</span>
                </button>
                <button
                  onClick={() => handleCopyRighteous(selectedRighteous)}
                  className="p-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                  title="نسخ القصة"
                >
                  {copiedId === selectedRighteous.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleShareRighteous(selectedRighteous)}
                  className="p-2 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white transition-colors cursor-pointer"
                  title="مشاركة القصة"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h1 className="text-2xl font-bold font-amiri text-[#172A28] mb-1 break-words">
              {selectedRighteous.name}
            </h1>
            <p className="text-sm font-bold text-[#C5A059] mb-3 break-words">
              {selectedRighteous.title}
            </p>
            <p className="text-sm text-gray-700 bg-[#F7F6F2] p-3.5 rounded-xl border border-gray-200 leading-relaxed">
              {selectedRighteous.summary}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
            <h3 className="text-sm font-bold text-[#172A28] flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <BookOpen className="w-4 h-4 text-[#C5A059]" />
              <span>القصة والسيرة التفصيلية</span>
            </h3>
            <div
              className={`text-gray-800 leading-loose font-amiri space-y-3 break-words ${
                fontSize === 'large' ? 'text-xl' : 'text-lg'
              }`}
            >
              {selectedRighteous.fullStory.split('\n').map((p, i) => (
                <p key={i} className="leading-loose break-words">
                  {p}
                </p>
              ))}
            </div>
          </div>

          {selectedRighteous.famousQuote && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
              <h3 className="text-sm font-bold text-[#172A28] flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-100">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>من درر أقواله ومآثره الخالدة</span>
              </h3>
              <p className="font-amiri text-lg font-bold text-[#172A28] leading-loose bg-[#F7F6F2] p-4 rounded-xl border border-[#C5A059]/30 break-words">
                {selectedRighteous.famousQuote}
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 w-full overflow-hidden">
            <h3 className="text-sm font-bold text-[#172A28] flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>الدروس والعبر المستفادة</span>
            </h3>
            <div className="space-y-2">
              {selectedRighteous.virtuesAndLessons.map((lesson, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#C5A059] font-bold shrink-0">•</span>
                  <span className="break-words flex-1">{lesson}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-500">موضوعات ذات صلة:</span>
              {selectedRighteous.relatedTopics.map((topic, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-[#F7F6F2] text-[#104B40] px-2.5 py-1 rounded-full font-bold border border-gray-200"
                >
                  #{topic}
                </span>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
              <strong className="text-[#104B40]">المصدر الموثق:</strong> {selectedRighteous.source}
            </div>
          </div>

          {/* Navigation Between Righteous Stories White Card */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex items-center justify-between gap-3 w-full">
            <button
              onClick={() => prevRighteous && setSelectedRighteous(prevRighteous)}
              disabled={!prevRighteous}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 disabled:opacity-40 text-xs font-bold text-[#172A28] transition-colors text-right truncate cursor-pointer"
            >
              السابق: {prevRighteous ? prevRighteous.name : 'الأول'}
            </button>
            <button
              onClick={() => nextRighteous && setSelectedRighteous(nextRighteous)}
              disabled={!nextRighteous}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#C5A059] hover:bg-[#B08D46] disabled:opacity-40 text-xs font-bold text-white transition-colors text-left truncate cursor-pointer"
            >
              التالي: {nextRighteous ? nextRighteous.name : 'الأخير'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
