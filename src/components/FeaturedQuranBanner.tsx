import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, Share2, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { AppLanguage, getTranslation } from '../utils/i18n';
import { shareIslamicText } from '../utils/shareContent';
import { triggerLightHaptic } from '../utils/haptics';
import { getDailyIslamicContent, getLocalCalendarDateKey } from '../data/dailyContent';

interface FeaturedQuranBannerProps {
  user: UserProfile;
  language?: AppLanguage;
  onOpenQuranReader: (surahNumber: number, ayahNumber: number, pageNumber?: number) => void;
  onOpenSheikhTutor?: () => void;
}

export const FeaturedQuranBanner: React.FC<FeaturedQuranBannerProps> = ({
  user,
  language,
  onOpenQuranReader,
  onOpenSheikhTutor,
}) => {
  const activeLang = language || user.language;
  const t = getTranslation(activeLang);
  const isRtl = activeLang === 'ar' || activeLang === 'ur';
  const [sharedQuran, setSharedQuran] = useState(false);
  const [dateKey, setDateKey] = useState(() => getLocalCalendarDateKey());

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

  const dailyAyah = getDailyIslamicContent().ayah;
  const currentPage = user.lastReadPage || 1;
  const dailySurahLabel = `سورة ${dailyAyah.surahName} • آية ${dailyAyah.ayahNumber}`;
  const dailyAyahText = dailyAyah.arabicText;

  const handleOpenReader = () => {
    triggerLightHaptic();
    onOpenQuranReader(user.lastReadSurah || 1, user.lastReadAyah || 1, currentPage);
  };

  const handleOpenSheikh = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerLightHaptic();
    onOpenSheikhTutor?.();
  };

  const handleShareFeaturedQuran = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerLightHaptic();
    const res = await shareIslamicText({
      title: `آية اليوم • ${t.quranTitle}`,
      category: dailySurahLabel,
      arabicText: dailyAyahText,
      source: `القرآن الكريم • ${dailySurahLabel} (صفحة ${dailyAyah.pageNumber})`,
    });
    if (res !== 'cancelled') {
      setSharedQuran(true);
      setTimeout(() => setSharedQuran(false), 2000);
    }
  };

  return (
    <div
      onClick={handleOpenReader}
      className="moazen-widget moazen-widget-featured relative mx-3 mt-0.5 rounded-2xl text-[#172A28] py-1 px-2.5 overflow-hidden border-[1.5px] border-[#C5A059] cursor-pointer group transition-all active:scale-[0.99] select-none shrink-0 min-h-[54px] sm:min-h-[58px] flex items-center"
    >
      {/* Integrated Background Mushaf Image with Smooth Ivory-Cream Gradient Blend */}
      <img
        src="/assets/images/open_mushaf_rehal_1792331334829.jpg"
        alt="المصحف الشريف المفتوح"
        decoding="async"
        className={`absolute inset-y-0 ${
          isRtl ? 'left-0' : 'right-0'
        } w-[66%] sm:w-[60%] h-full object-cover object-center opacity-82 group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none`}
      />
      <div
        className={`absolute inset-0 pointer-events-none ${
          isRtl
            ? 'bg-gradient-to-l from-[#F6EEDC] from-32% via-[#F6EEDC]/92 via-52% to-[#EDE2C8]/12'
            : 'bg-gradient-to-r from-[#F6EEDC] from-32% via-[#F6EEDC]/92 via-52% to-[#EDE2C8]/12'
        }`}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#F6EEDC]/55 via-transparent to-[#EDE2C8]/60" />

      {/* Main Content Foreground */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2">
        {/* Daily Ayah + Reading Progress + Action Pills */}
        <div className={`flex-1 min-w-0 py-0 space-y-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-1.5 text-[#104B40]">
            <BookOpen className="w-3 h-3 fill-[#104B40] shrink-0" />
            <h3 className="text-[10.5px] sm:text-[11px] font-black tracking-wide leading-tight">
              {t.quranTitle} • آية اليوم
            </h3>
            <span className="text-[8px] text-[#8a6214] font-extrabold truncate">
              {dailySurahLabel}
            </span>
          </div>

          {/* Displayed Daily Ayah Snippet (rotates once per calendar day) */}
          <p className="text-[9.5px] sm:text-[10px] font-bold text-[#104B40] font-quran my-0 leading-tight truncate max-w-[82%]">
            {dailyAyahText}
          </p>

          {/* Action Buttons Row */}
          <div className="flex items-center flex-wrap gap-1.5 pt-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReader();
              }}
              className="inline-flex items-center gap-1 bg-[#104B40] group-hover:bg-[#0B3D35] text-white font-bold text-[7.5px] px-2 py-[1px] rounded-full shadow-xs transition-colors cursor-pointer"
            >
              <span>{t.continueReading} ({t.pageOfTotal(currentPage)})</span>
              {isRtl ? <ChevronLeft className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
            </button>

            {onOpenSheikhTutor && (
              <button
                type="button"
                onClick={handleOpenSheikh}
                className="inline-flex items-center gap-1 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#104B40] font-black text-[7.5px] px-2 py-[1px] rounded-full shadow-xs hover:brightness-105 transition-all cursor-pointer"
              >
                <Sparkles className="w-2 h-2 text-[#104B40]" />
                <span>معلم القرآن AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Web Share Button + Navigation Arrow */}
        <div className="flex flex-col items-end justify-between gap-1.5 shrink-0 self-stretch">
          <div className="flex items-center gap-1">
            {sharedQuran && (
              <span className="text-[8px] font-black text-[#104B40] bg-[#F6EEDC]/95 px-1.5 py-0.5 rounded-full border border-[#D6C18D] shadow-2xs">
                {isRtl ? 'تمت المشاركة ✓' : 'Shared ✓'}
              </span>
            )}
            <button
              type="button"
              onClick={handleShareFeaturedQuran}
              className="p-1 rounded-full bg-[#F6EEDC]/92 hover:bg-[#EDE2C8] text-[#104B40] border border-[#D6C18D] shadow-xs transition-all cursor-pointer active:scale-90 backdrop-blur-[2px]"
              title={isRtl ? 'مشاركة آية اليوم' : 'Share Verse of the Day'}
              aria-label={isRtl ? 'مشاركة آية اليوم' : 'Share Verse of the Day'}
            >
              {sharedQuran ? (
                <Check className="w-3 h-3 text-emerald-700" />
              ) : (
                <Share2 className="w-3 h-3" />
              )}
            </button>
          </div>

          <div className="w-4.5 h-4.5 rounded-full bg-[#F6EEDC]/90 border border-[#D6C18D] flex items-center justify-center text-[#104B40] group-hover:bg-[#104B40] group-hover:text-white transition-colors shrink-0 shadow-2xs">
            {isRtl ? <ChevronLeft className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
          </div>
        </div>
      </div>
    </div>
  );
};
