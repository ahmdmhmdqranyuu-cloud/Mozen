import React from 'react';
import { BookOpen, ChevronLeft, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { AppLanguage, getTranslation } from '../utils/i18n';

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
  const t = getTranslation(language || user.language);

  return (
    <div 
      onClick={() => onOpenQuranReader(user.lastReadSurah || 2, user.lastReadAyah || 286, user.lastReadPage || 1)}
      className="relative mx-3.5 mt-1.5 rounded-2xl bg-gradient-to-br from-[#ebf5f1] to-[#f4f8f6] text-[#172A28] py-1.5 px-2.5 overflow-hidden shadow-xs hover:shadow-md border border-emerald-950/10 cursor-pointer group transition-all active:scale-[0.99] select-none shrink-0"
    >
      {/* Subtle atmospheric mosque background watermark matching Hadith widget */}
      <img
        src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none"
      />

      {/* Main Container: Explicitly arranged so in RTL, Text is on the RIGHT and Open Mushaf image is on the LEFT */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Reading Progress, Ayah, and CTA */}
        <div className="flex-1 text-right min-w-0 py-0 space-y-0">
          <div className="flex items-center gap-1 text-[#104B40]">
            <BookOpen className="w-3 h-3 fill-[#104B40]" />
            <h3 className="text-[11px] font-black tracking-wide leading-tight">{t.quranTitle}</h3>
            <span className="text-[9px] text-emerald-800/80 font-bold mr-1">{t.pageOfTotal(user.lastReadPage || 1)}</span>
          </div>

          <h4 className="text-[10.5px] font-black text-[#172A28] leading-tight">
            {user.lastReadSurahName || 'سورة البقرة'}
          </h4>

          {/* Ayah Snippet in Islamic brackets */}
          <p className="text-[10px] font-bold text-[#104B40] font-quran my-0 leading-snug truncate">
            {user.lastReadAyahText || '{لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا}'}
          </p>

          {/* Emerald Capsule CTA Button matching Hadith & Dua widgets */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="inline-flex items-center gap-1 bg-[#104B40] group-hover:bg-[#0B3D35] text-white font-bold text-[8px] px-2 py-0.5 rounded-full shadow-xs transition-colors">
              <span>{t.continueReading}</span>
              <ChevronLeft className="w-2.5 h-2.5" />
            </div>
            {onOpenSheikhTutor && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSheikhTutor();
                }}
                className="inline-flex items-center gap-1 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#104B40] font-black text-[8px] px-2 py-0.5 rounded-full shadow-xs hover:brightness-105 transition-all cursor-pointer"
              >
                <Sparkles className="w-2 h-2 text-[#104B40]" />
                <span>معلم القرآن AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Left Side in RTL: High-Fidelity Open Holy Quran Image on Wooden Stand + Subtle Arrow */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Photographic image of Open Mushaf on carved wooden Rehal stand */}
          <div className="relative w-18 sm:w-20 h-12 sm:h-13 rounded-xl overflow-hidden shadow-xs shrink-0 border border-emerald-900/15 bg-black/10">
            <img
              src="/assets/images/open_mushaf_rehal_1792331334829.jpg"
              alt="المصحف الشريف المفتوح"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Left Arrow Icon */}
          <div className="w-4.5 h-4.5 rounded-full bg-[#104B40]/10 flex items-center justify-center text-[#104B40] group-hover:bg-[#104B40]/20 transition-colors shrink-0">
            <ChevronLeft className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
