import React, { useEffect, useState } from 'react';
import { BookOpen, Share2, Check, Image as ImageIcon } from 'lucide-react';
import { shareIslamicText, shareOrDownloadAsImageCard } from '../utils/shareContent';
import { AppLanguage, getTranslation } from '../utils/i18n';
import { triggerLightHaptic } from '../utils/haptics';
import { getDailyIslamicContent, getLocalCalendarDateKey } from '../data/dailyContent';

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
  const [dateKey, setDateKey] = useState(() => getLocalCalendarDateKey());
  const t = getTranslation(language);

  useEffect(() => {
    const checkRollover = () => {
      const k = getLocalCalendarDateKey();
      if (k !== dateKey) setDateKey(k);
    };
    const timer = setInterval(checkRollover, 60000);
    document.addEventListener('visibilitychange', checkRollover);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', checkRollover);
    };
  }, [dateKey]);

  const daily = getDailyIslamicContent();
  const dailyHadith = daily.hadith;
  const dailyDua = daily.dua;

  const handleOpenHadithCard = () => {
    triggerLightHaptic();
    onOpenHadith();
  };

  const handleOpenAzkarCard = () => {
    triggerLightHaptic();
    onOpenAzkar();
  };

  const handleShareHadithOfDay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerLightHaptic();
    const res = await shareIslamicText({
      title: t.hadithOfTheDay || 'حديث اليوم',
      category: 'الحديث النبوي الشريف',
      arabicText: dailyHadith.fullText,
      source: dailyHadith.source,
    });
    if (res !== 'cancelled') {
      setSharedCard('hadith');
      setTimeout(() => setSharedCard(null), 2000);
    }
  };

  const handleShareHadithCardImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerLightHaptic();
    await shareOrDownloadAsImageCard({
      title: t.hadithOfTheDay || 'حديث اليوم',
      category: 'الحديث النبوي الشريف',
      arabicText: dailyHadith.fullText,
      source: dailyHadith.source,
    });
  };

  const handleShareDuaOfDay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerLightHaptic();
    const res = await shareIslamicText({
      title: t.azkarAndDua || 'دعاء اليوم',
      category: dailyDua.category,
      arabicText: dailyDua.text,
      source: dailyDua.source,
    });
    if (res !== 'cancelled') {
      setSharedCard('dua');
      setTimeout(() => setSharedCard(null), 2000);
    }
  };

  const handleShareDuaCardImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerLightHaptic();
    await shareOrDownloadAsImageCard({
      title: t.azkarAndDua || 'دعاء اليوم',
      category: dailyDua.category,
      arabicText: dailyDua.text,
      source: dailyDua.source,
    });
  };

  return (
    <div className="mx-3 mt-0.5 grid grid-cols-2 gap-1.5 select-none shrink-0">
      {/* Right Card in RTL: حديث اليوم — Large Integrated Mosque Background with Smooth Cream Fade */}
      <div
        onClick={handleOpenHadithCard}
        className="moazen-widget moazen-widget-featured relative rounded-2xl border-[1.5px] border-[#C5A059] py-1 px-2 flex flex-col justify-between overflow-hidden transition-all cursor-pointer group min-h-[58px] sm:min-h-[62px]"
      >
        <img
          src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
          alt="المسجد النبوي الشريف"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-78 group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#F6EEDC]/96 from-24% via-[#F6EEDC]/68 via-58% to-[#EDE2C8]/45" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-l from-[#F6EEDC]/60 via-transparent to-[#EDE2C8]/35" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-1 text-[#104B40] mb-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShareHadithOfDay}
                className="p-1 rounded-full bg-[#F6EEDC]/92 hover:bg-[#EDE2C8] text-[#104B40] border border-[#D6C18D] shadow-2xs transition-all cursor-pointer active:scale-90"
                title="مشاركة نص الحديث"
              >
                {sharedCard === 'hadith' ? (
                  <Check className="w-2.5 h-2.5 text-emerald-700" />
                ) : (
                  <Share2 className="w-2.5 h-2.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleShareHadithCardImage}
                className="p-1 rounded-full bg-[#F6EEDC]/92 hover:bg-[#EDE2C8] text-[#9A7732] border border-[#D6C18D] shadow-2xs transition-all cursor-pointer active:scale-90"
                title="مشاركة بـ 5 خلفيات إسلامية بدون إنترنت"
              >
                <ImageIcon className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <h4 className="text-[10.5px] font-black leading-tight">{t.hadithOfTheDay}</h4>
              <BookOpen className="w-3 h-3 fill-[#104B40]" />
            </div>
          </div>

          <p className="text-[9px] font-bold text-[#172A28] leading-snug font-quran text-right mt-0.5 line-clamp-2 drop-shadow-[0_1px_1px_rgba(246,238,220,0.9)]">
            {dailyHadith.snippet}
          </p>
        </div>

        <div className="relative z-10 mt-1 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenHadithCard();
            }}
            className="bg-[#104B40] hover:bg-[#0B3D35] text-white text-[7.5px] font-bold px-2 py-0.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            {t.readMore}
          </button>
          <span className="text-[7px] text-[#104B40] font-black bg-[#F6EEDC]/88 px-1.5 py-0.5 rounded-full border border-[#D6C18D]/70 leading-none truncate">
            {sharedCard === 'hadith' ? 'تمت المشاركة ✓' : dailyHadith.shortSource}
          </span>
        </div>
      </div>

      {/* Left Card in RTL: دعاء وأذكار اليوم — Large Integrated Tasbih Beads Background */}
      <div
        onClick={handleOpenAzkarCard}
        className="moazen-widget moazen-widget-featured relative rounded-2xl border-[1.5px] border-[#C5A059] py-1 px-2 flex flex-col justify-between overflow-hidden transition-all cursor-pointer group min-h-[58px] sm:min-h-[62px]"
      >
        <img
          src="/assets/images/tasbih_prayer_beads_1792265378950.jpg"
          alt="سبحة وأذكار"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-78 group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#F6EEDC]/96 from-24% via-[#F6EEDC]/68 via-58% to-[#EDE2C8]/42" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#F6EEDC]/60 via-transparent to-[#EDE2C8]/35" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-1 text-[#104B40] mb-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShareDuaOfDay}
                className="p-1 rounded-full bg-[#F6EEDC]/92 hover:bg-[#EDE2C8] text-[#104B40] border border-[#D6C18D] shadow-2xs transition-all cursor-pointer active:scale-90"
                title="مشاركة دعاء اليوم"
              >
                {sharedCard === 'dua' ? (
                  <Check className="w-2.5 h-2.5 text-emerald-700" />
                ) : (
                  <Share2 className="w-2.5 h-2.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleShareDuaCardImage}
                className="p-1 rounded-full bg-[#F6EEDC]/92 hover:bg-[#EDE2C8] text-[#9A7732] border border-[#D6C18D] shadow-2xs transition-all cursor-pointer active:scale-90"
                title="مشاركة بـ 5 خلفيات إسلامية بدون إنترنت"
              >
                <ImageIcon className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <h4 className="text-[10.5px] font-black leading-tight">{t.azkarAndDua}</h4>
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

          <p className="text-[9px] text-[#172A28] font-bold text-right mt-0.5 leading-snug line-clamp-2 drop-shadow-[0_1px_1px_rgba(246,238,220,0.9)]">
            {dailyDua.text}
          </p>
        </div>

        <div className="relative z-10 mt-1 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAzkarCard();
            }}
            className="bg-[#104B40] hover:bg-[#0B3D35] text-white text-[7.5px] font-bold px-2 py-0.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            {t.viewAzkar}
          </button>
          <span className="text-[7px] text-[#104B40] font-black bg-[#F6EEDC]/88 px-1.5 py-0.5 rounded-full border border-[#D6C18D]/70 leading-none truncate">
            {sharedCard === 'dua' ? 'تمت المشاركة ✓' : dailyDua.source}
          </span>
        </div>
      </div>
    </div>
  );
};
