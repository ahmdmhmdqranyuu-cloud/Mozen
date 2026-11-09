import React, { useState } from 'react';
import { BookOpen, Share2, Check, Image as ImageIcon } from 'lucide-react';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../utils/shareContent';
import { AppLanguage, getTranslation } from '../utils/i18n';

interface DailyCardsProps {
  onOpenAzkar: () => void;
  onOpenHadith: () => void;
  language?: AppLanguage;
}

export const DailyCards: React.FC<DailyCardsProps> = ({
  onOpenAzkar,
  onOpenHadith,
  language,
}) => {
  const [sharedCard, setSharedCard] = useState<'hadith' | 'dua' | null>(null);
  const t = getTranslation(language);

  const handleShareHadithOfDay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await shareIslamicText({
      title: 'حديث اليوم',
      category: 'الحديث النبوي الشريف',
      arabicText: 'قال رسول الله ﷺ: «إنَّما الأعمال بالنيات، وإنَّما لكل امرئ ما نوى»',
      source: 'متفق عليه (رواه البخاري ومسلم)',
    });
    if (res !== 'cancelled') {
      setSharedCard('hadith');
      setTimeout(() => setSharedCard(null), 2000);
    }
  };

  const handleShareHadithCardImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareOrDownloadAsImageCard({
      title: 'حديث اليوم',
      category: 'الحديث النبوي الشريف',
      arabicText: 'قال رسول الله ﷺ: «إنَّما الأعمال بالنيات، وإنَّما لكل امرئ ما نوى»',
      source: 'متفق عليه (رواه البخاري ومسلم)',
    });
  };

  const handleShareDuaOfDay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await shareIslamicText({
      title: 'دعاء وذكر اليوم',
      category: 'الأذكار والأدعية اليومية',
      arabicText: '«اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ» • ﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ﴾',
      source: 'حصن المسلم والقرآن الكريم',
    });
    if (res !== 'cancelled') {
      setSharedCard('dua');
      setTimeout(() => setSharedCard(null), 2000);
    }
  };

  const handleShareDuaCardImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareOrDownloadAsImageCard({
      title: 'دعاء وذكر اليوم',
      category: 'الأذكار والأدعية اليومية',
      arabicText: '«اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ» • ﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ﴾',
      source: 'حصن المسلم والقرآن الكريم',
    });
  };

  return (
    <div className="mx-3.5 mt-1.5 grid grid-cols-2 gap-2 select-none shrink-0">
      {/* Right Card in RTL: حديث اليوم (Hadith Banner with Attractive Mosque Image + Quick Share) */}
      <div
        onClick={onOpenHadith}
        className="relative rounded-2xl bg-gradient-to-br from-[#ebf5f1] to-[#f4f8f6] border border-emerald-950/10 py-1.5 px-2 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer group min-h-[86px] sm:min-h-[92px]"
      >
        {/* Subtle atmospheric mosque background watermark */}
        <img
          src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none"
        />

        <div className="relative z-10">
          {/* Header with Share Buttons */}
          <div className="flex items-center justify-between gap-1 text-[#104B40] mb-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShareHadithOfDay}
                className="p-1 rounded-full bg-white/80 hover:bg-white text-[#104B40] border border-emerald-900/10 shadow-2xs transition-all cursor-pointer active:scale-90"
                title="مشاركة نص الحديث"
              >
                {sharedCard === 'hadith' ? (
                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                ) : (
                  <Share2 className="w-2.5 h-2.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleShareHadithCardImage}
                className="p-1 rounded-full bg-amber-50/90 hover:bg-amber-100 text-[#9A7732] border border-amber-300/40 shadow-2xs transition-all cursor-pointer active:scale-90"
                title="مشاركة بـ 5 خلفيات إسلامية بدون إنترنت"
              >
                <ImageIcon className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <h4 className="text-[10px] sm:text-[10.5px] font-black leading-tight">{t.hadithOfTheDay}</h4>
              <BookOpen className="w-3 h-3 fill-[#104B40]" />
            </div>
          </div>

          {/* Hadith quote */}
          <p className="text-[9px] font-bold text-[#172A28] leading-snug font-quran text-right mt-0 line-clamp-1">
            {'.«إنَّما الأعمال بالنيات {وإنَّما لكل امرئ ما نوى}»'}
          </p>

          {/* Attractive Prophet's Mosque Banner Image */}
          <div className="my-0.5 flex items-center justify-center">
            <div className="w-full h-6.5 sm:h-7 rounded-lg overflow-hidden shadow-xs border border-emerald-900/15 relative">
              <img
                src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
                alt="المسجد النبوي الشريف"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-end px-1.5 pb-0.5">
                <span className="text-[7px] text-amber-200 font-bold drop-shadow leading-none">
                  رواه البخاري ومسلم
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 mt-0.5 flex items-center justify-between">
          <button
            type="button"
            className="bg-[#104B40] hover:bg-[#0B3D35] text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            {t.readMore}
          </button>
          {sharedCard === 'hadith' && (
            <span className="text-[7.5px] font-bold text-emerald-700">تمت المشاركة ✓</span>
          )}
        </div>
      </div>

      {/* Left Card in RTL: أذكار ودعاء (Unified background with Hadith widget + Quick Share) */}
      <div
        onClick={onOpenAzkar}
        className="relative rounded-2xl bg-gradient-to-br from-[#ebf5f1] to-[#f4f8f6] border border-emerald-950/10 py-1.5 px-2 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer group min-h-[86px] sm:min-h-[92px]"
      >
        {/* Subtle atmospheric mosque background watermark matching Hadith widget */}
        <img
          src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none"
        />

        <div className="relative z-10">
          {/* Header with Share Buttons */}
          <div className="flex items-center justify-between gap-1 text-[#104B40] mb-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShareDuaOfDay}
                className="p-1 rounded-full bg-white/80 hover:bg-white text-[#104B40] border border-emerald-900/10 shadow-2xs transition-all cursor-pointer active:scale-90"
                title="مشاركة نص الدعاء"
              >
                {sharedCard === 'dua' ? (
                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                ) : (
                  <Share2 className="w-2.5 h-2.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleShareDuaCardImage}
                className="p-1 rounded-full bg-amber-50/90 hover:bg-amber-100 text-[#9A7732] border border-amber-300/40 shadow-2xs transition-all cursor-pointer active:scale-90"
                title="مشاركة بـ 5 خلفيات إسلامية بدون إنترنت"
              >
                <ImageIcon className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <h4 className="text-[10px] sm:text-[10.5px] font-black leading-tight">{t.azkarAndDua}</h4>
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#104B40]">
                <circle cx="12" cy="5" r="2" />
                <circle cx="17" cy="8" r="2" />
                <circle cx="19" cy="13" r="2" />
                <circle cx="16" cy="18" r="2" />
                <circle cx="11" cy="20" r="2" />
                <circle cx="6" cy="17" r="2" />
                <circle cx="5" cy="11" r="2" />
                <circle cx="7" cy="6" r="2" />
              </svg>
            </div>
          </div>

          <p className="text-[9px] text-[#172A28] font-bold text-right mt-0 leading-snug line-clamp-1">
            {t.azkarSubtitle}
          </p>

          {/* Prayer Beads Image */}
          <div className="my-0.5 flex items-center justify-center">
            <div className="w-full h-6.5 sm:h-7 rounded-lg overflow-hidden shadow-xs border border-emerald-900/15">
              <img
                src="/assets/images/tasbih_prayer_beads_1792265378950.jpg"
                alt="سبحة وأذكار"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 mt-0.5 flex items-center justify-between">
          <button
            type="button"
            className="bg-[#104B40] hover:bg-[#0B3D35] text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            {t.viewAzkar}
          </button>
          {sharedCard === 'dua' && (
            <span className="text-[7.5px] font-bold text-emerald-700">تمت المشاركة ✓</span>
          )}
        </div>
      </div>
    </div>
  );
};
