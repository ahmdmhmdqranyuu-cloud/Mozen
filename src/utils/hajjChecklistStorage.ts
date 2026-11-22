export type HajjRitualId =
  | 'ihram'
  | 'niyyah_talbiyah'
  | 'tawaf_qudum'
  | 'sai'
  | 'mina_stay'
  | 'arafat'
  | 'muzdalifah'
  | 'stoning_jamarat'
  | 'hady'
  | 'halq_taqsir'
  | 'tawaf_ifadah'
  | 'tawaf_wada';

export interface HajjRitualItem {
  id: HajjRitualId;
  order: number;
  titleAr: string;
  titleEn: string;
  stageAr: string;
  stageEn: string;
  descriptionAr: string;
  descriptionEn: string;
  variationNoteAr?: string;
  variationNoteEn?: string;
}

export const HAJJ_RITUALS_CHECKLIST: HajjRitualItem[] = [
  {
    id: 'ihram',
    order: 1,
    titleAr: 'الإحرام',
    titleEn: 'Ihram (Entering Sacred State)',
    stageAr: 'من الميقات',
    stageEn: 'At the Miqat',
    descriptionAr: 'الاغتسال والتطيب ولبس ثياب الإحرام عند الميقات أو محاذاته قبل الدخول لمكة.',
    descriptionEn: 'Perform ghusl, wear Ihram garments (unsewn white cloth for men; modest clothing for women) before crossing the Miqat.',
  },
  {
    id: 'niyyah_talbiyah',
    order: 2,
    titleAr: 'النية والتلبية',
    titleEn: 'Intention & Talbiyah',
    stageAr: 'عقد النسك',
    stageEn: 'Declaring the Nusk',
    descriptionAr: 'عقد نية النسك (تمتع / قران / إفراد) والإكثار من: «لبيك اللهم لبيك، لبيك لا شريك لك لبيك».',
    descriptionEn: 'Make intention for Tamattu, Qiran, or Ifrad and recite Talbiyah regularly until reaching the Kaaba or Jamarat.',
  },
  {
    id: 'tawaf_qudum',
    order: 3,
    titleAr: 'طواف القدوم',
    titleEn: 'Tawaf al-Qudum (Arrival Tawaf)',
    stageAr: 'عند دخول مكة',
    stageEn: 'Upon Entering Makkah',
    descriptionAr: 'سبعة أشواط حول الكعبة تحيةً للبيت الحرام للقارن والمفرد (ويطوف المتمتع للعمرة أولاً).',
    descriptionEn: 'Seven circuits around the Kaaba for Qarin and Mufrid upon arrival (Tamattu pilgrims perform Umrah Tawaf first).',
    variationNoteAr: 'يُجزئ طواف العمرة للمتمتع، وهو سنة للقارن والمفرد.',
    variationNoteEn: 'Umrah Tawaf suffices for Tamattu; Sunnah for Qarin and Mufrid.',
  },
  {
    id: 'sai',
    order: 4,
    titleAr: 'السعي بين الصفا والمروة',
    titleEn: "Sa'i (Safa & Marwah)",
    stageAr: 'ركن من أركان الحج',
    stageEn: 'Pillar of Hajj',
    descriptionAr: 'سبعة أشواط تبدأ بالصفا وتنتهي بالمروة مع الذكر والدعاء.',
    descriptionEn: 'Walk seven laps starting at Safa and ending at Marwah with supplication.',
    variationNoteAr: 'يؤديه القارن والمفرد بعد طواف القدوم أو يؤخرانه مع طواف الإفاضة؛ والمتمتع يسعى لعمرته ثم لحجه بعد الإفاضة.',
    variationNoteEn: 'Timing depends on Hajj type: Qarin/Mufrid may perform it after arrival or with Ifadah; Tamattu performs one for Umrah and one after Ifadah.',
  },
  {
    id: 'mina_stay',
    order: 5,
    titleAr: 'المبيت بمنى',
    titleEn: 'Stay at Mina',
    stageAr: 'يوم التروية وليالي التشريق',
    stageEn: 'Day of Tarwiyah & Tashreeq Nights',
    descriptionAr: 'التوجه إلى منى يوم 8 ذي الحجة وقصر الصلوات الرباعية، ثم المبيت بمنى ليالي أيام التشريق (11، 12، 13).',
    descriptionEn: 'Head to Mina on 8th Dhul Hijjah shortening 4-rakah prayers, and spend Tashreeq nights there.',
  },
  {
    id: 'arafat',
    order: 6,
    titleAr: 'الوقوف بعرفة',
    titleEn: 'Standing at Arafat',
    stageAr: '9 ذي الحجة • ركن الحج الأعظم',
    stageEn: '9th Dhul Hijjah • Greatest Pillar',
    descriptionAr: 'الوقوف بصعيد عرفة في اليوم التاسع مع جمع الظهر والعصر قصراً والتفرغ للدعاء حتى غروب الشمس.',
    descriptionEn: 'Remain within Arafat boundaries on 9th Dhul Hijjah, combine Dhuhr & Asr shortened, and engage in Dua until sunset.',
  },
  {
    id: 'muzdalifah',
    order: 7,
    titleAr: 'المبيت بمزدلفة',
    titleEn: 'Night at Muzdalifah',
    stageAr: 'ليلة 10 ذي الحجة',
    stageEn: 'Night of 10th Dhul Hijjah',
    descriptionAr: 'النفرة من عرفة بعد الغروب وصلاة المغرب والعشاء جمع تأخير وقصر، والمبيت بها حتى الفجر (أو منتصف الليل لذوي الأعذار).',
    descriptionEn: 'Proceed to Muzdalifah after sunset, combine Maghrib & Isha, and spend the night until Fajr (midnight allowed for excused pilgrims).',
  },
  {
    id: 'stoning_jamarat',
    order: 8,
    titleAr: 'رمي الجمرات',
    titleEn: 'Stoning the Jamarat',
    stageAr: '10 – 13 ذي الحجة',
    stageEn: '10th – 13th Dhul Hijjah',
    descriptionAr: 'رمي جمرة العقبة يوم العيد بسبع حصيات، ثم رمي الجمرات الثلاث في أيام التشريق بعد الزوال.',
    descriptionEn: 'Stone Jamarat al-Aqabah with 7 pebbles on Eid day, then all three Jamarat daily after Dhuhr on Tashreeq days.',
  },
  {
    id: 'hady',
    order: 9,
    titleAr: 'الهدي',
    titleEn: 'Sacrificial Animal (Hady)',
    stageAr: 'يوم النحر وأيام التشريق',
    stageEn: 'Eid Day & Tashreeq',
    descriptionAr: 'نحر الهدي شكراً لله للمتمتع والقارن (أو صيام 3 أيام في الحج و7 عند الرجوع لمن لم يجد).',
    descriptionEn: 'Offer Hady sacrifice for Tamattu and Qarin pilgrims (not obligatory for Ifrad).',
    variationNoteAr: 'واجب على المتمتع والقارن ولا يجب على المفرد.',
    variationNoteEn: 'Obligatory for Tamattu and Qarin; not required for Ifrad.',
  },
  {
    id: 'halq_taqsir',
    order: 10,
    titleAr: 'الحلق أو التقصير',
    titleEn: 'Shaving or Trimming (Halq / Taqsir)',
    stageAr: 'التحلل من الإحرام',
    stageEn: 'Exiting Ihram Restrictions',
    descriptionAr: 'حلق شعر الرأس أو تقصيره للرجل وتقصير أنملة للمرأة للتحلل الأول يوم النحر.',
    descriptionEn: 'Men shave or trim their hair evenly (shaving preferred); women trim a fingertip length for first partial release from Ihram.',
  },
  {
    id: 'tawaf_ifadah',
    order: 11,
    titleAr: 'طواف الإفاضة',
    titleEn: 'Tawaf al-Ifadah (Tawaf az-Ziyarah)',
    stageAr: '10 ذي الحجة أو بعده • ركن',
    stageEn: '10th Dhul Hijjah+ • Pillar',
    descriptionAr: 'طواف الركن سبعة أشواط حول الكعبة بعد الوقوف بعرفة ومزدلفة وبه يحصل التحلل الأكبر.',
    descriptionEn: 'Essential seven-circuit Tawaf after Arafat and Muzdalifah, completing full release from all Ihram restrictions.',
  },
  {
    id: 'tawaf_wada',
    order: 12,
    titleAr: 'طواف الوداع',
    titleEn: "Tawaf al-Wada' (Farewell Tawaf)",
    stageAr: 'عند مغادرة مكة',
    stageEn: 'Before Leaving Makkah',
    descriptionAr: 'آخر عهد الحاج بالبيت الحرام سبعة أشواط قبل السفر (ويسقط عن الحائض والنفساء رخصةً).',
    descriptionEn: 'Final seven-circuit Tawaf right before departing Makkah (waived for menstruating/postnatal women).',
  },
];

export interface HajjRitualReminder {
  scheduledAtMs: number;
  isoLocalInput: string;
  enabled: boolean;
}

export interface HajjChecklistState {
  completedIds: HajjRitualId[];
  reminders: Partial<Record<HajjRitualId, HajjRitualReminder>>;
  updatedAtMs: number;
}

export interface HajjChecklistProgressSummary {
  completed: number;
  remaining: number;
  total: number;
  percent: number;
}

const HAJJ_CHECKLIST_STORAGE_KEY = 'muslim_plus_hajj_checklist_v1';

const VALID_IDS = new Set<HajjRitualId>(HAJJ_RITUALS_CHECKLIST.map((r) => r.id));

export function loadHajjChecklistState(): HajjChecklistState {
  const empty: HajjChecklistState = {
    completedIds: [],
    reminders: {},
    updatedAtMs: Date.now(),
  };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(HAJJ_CHECKLIST_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<HajjChecklistState>;
    const completedIds = Array.isArray(parsed.completedIds)
      ? Array.from(new Set(parsed.completedIds.filter((id): id is HajjRitualId => VALID_IDS.has(id as HajjRitualId))))
      : [];
    const reminders: Partial<Record<HajjRitualId, HajjRitualReminder>> = {};
    if (parsed.reminders && typeof parsed.reminders === 'object') {
      for (const [k, v] of Object.entries(parsed.reminders)) {
        if (!VALID_IDS.has(k as HajjRitualId) || !v || typeof v !== 'object') continue;
        const r = v as HajjRitualReminder;
        if (Number.isFinite(r.scheduledAtMs) && r.scheduledAtMs > 0) {
          reminders[k as HajjRitualId] = {
            scheduledAtMs: r.scheduledAtMs,
            isoLocalInput: String(r.isoLocalInput || ''),
            enabled: Boolean(r.enabled),
          };
        }
      }
    }
    return {
      completedIds,
      reminders,
      updatedAtMs: Number(parsed.updatedAtMs) || Date.now(),
    };
  } catch {
    return empty;
  }
}

export function saveHajjChecklistState(state: HajjChecklistState): HajjChecklistState {
  const clean: HajjChecklistState = {
    completedIds: Array.from(new Set(state.completedIds.filter((id) => VALID_IDS.has(id)))),
    reminders: state.reminders || {},
    updatedAtMs: Date.now(),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HAJJ_CHECKLIST_STORAGE_KEY, JSON.stringify(clean));
      window.dispatchEvent(new CustomEvent('muslimPlusHajjChecklistUpdated', { detail: clean }));
    } catch {
      // ignore
    }
  }
  return clean;
}

export function toggleHajjRitualCompleted(
  state: HajjChecklistState,
  ritualId: HajjRitualId
): HajjChecklistState {
  const exists = state.completedIds.includes(ritualId);
  const completedIds = exists
    ? state.completedIds.filter((id) => id !== ritualId)
    : [...state.completedIds, ritualId];
  return {
    ...state,
    completedIds,
    updatedAtMs: Date.now(),
  };
}

export function resetHajjChecklistProgress(state: HajjChecklistState): HajjChecklistState {
  return {
    ...state,
    completedIds: [],
    reminders: {},
    updatedAtMs: Date.now(),
  };
}

export function setHajjRitualReminder(
  state: HajjChecklistState,
  ritualId: HajjRitualId,
  reminder: HajjRitualReminder | null
): HajjChecklistState {
  const nextReminders = { ...state.reminders };
  if (reminder && reminder.enabled && reminder.scheduledAtMs > 0) {
    nextReminders[ritualId] = reminder;
  } else {
    delete nextReminders[ritualId];
  }
  return {
    ...state,
    reminders: nextReminders,
    updatedAtMs: Date.now(),
  };
}

export function computeHajjChecklistProgress(state: HajjChecklistState): HajjChecklistProgressSummary {
  const total = HAJJ_RITUALS_CHECKLIST.length;
  const completed = state.completedIds.filter((id) => VALID_IDS.has(id)).length;
  const remaining = Math.max(0, total - completed);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return {
    completed,
    remaining,
    total,
    percent,
  };
}
