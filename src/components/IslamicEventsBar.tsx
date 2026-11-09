import React from 'react';
import { Calendar, ChevronLeft } from 'lucide-react';
import { AppLanguage, getTranslation } from '../utils/i18n';

interface IslamicEventsBarProps {
  onOpenEvents: () => void;
  language?: AppLanguage;
}

export const IslamicEventsBar: React.FC<IslamicEventsBarProps> = ({ onOpenEvents, language }) => {
  const t = getTranslation(language);

  return (
    <div
      onClick={onOpenEvents}
      className="relative mx-3.5 mt-2 mb-0.5 rounded-2xl bg-gradient-to-br from-[#ebf5f1] to-[#f4f8f6] border border-emerald-950/10 text-[#104B40] py-2.5 px-3.5 flex items-center justify-between text-[11px] cursor-pointer shadow-xs hover:shadow-md transition-all select-none overflow-hidden shrink-0"
    >
      {/* Unified subtle mosque background watermark matching Quran, Hadith, and Dua widgets */}
      <img
        src="/assets/images/hadith_widget_mosque_1793589264940.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.14] mix-blend-multiply pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#ebf5f1]/85 via-[#ebf5f1]/50 to-[#f4f8f6]/75 pointer-events-none" />

      {/* Action / View Events */}
      <div className="relative z-10 flex items-center gap-1 text-[#104B40] font-extrabold hover:text-[#0B3D35]">
        <ChevronLeft className="w-3.5 h-3.5 text-[#b58932]" />
        <span>{t.viewEvents}</span>
      </div>

      {/* Center: Hijri and Gregorian dates */}
      <div className="relative z-10 text-center font-medium text-[10.5px]">
        <span className="text-[#8a6214] font-black">{t.todayPrefix}: 12 ربيع الأول 1447 هـ</span>
        <span className="mx-1 text-emerald-900/30">|</span>
        <span className="text-[#172A28] font-bold">{t.gregorianPrefix}: 4 سبتمبر 2026 م</span>
      </div>

      {/* Title + Calendar Icon */}
      <div className="relative z-10 flex items-center gap-1 font-extrabold text-[#104B40]">
        <span>{t.islamicEvents}</span>
        <Calendar className="w-3.5 h-3.5 text-[#b58932]" />
      </div>
    </div>
  );
};
