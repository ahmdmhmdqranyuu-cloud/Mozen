import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft } from 'lucide-react';
import { AppLanguage, getTranslation } from '../utils/i18n';
import { getLocalCalendarDateKey } from '../data/dailyContent';

interface IslamicEventsBarProps {
  onOpenEvents: () => void;
  language?: AppLanguage;
}

export const IslamicEventsBar: React.FC<IslamicEventsBarProps> = ({ onOpenEvents, language }) => {
  const t = getTranslation(language);
  const [dateKey, setDateKey] = useState(() => getLocalCalendarDateKey());

  useEffect(() => {
    const refreshDate = () => {
      const k = getLocalCalendarDateKey();
      if (k !== dateKey) setDateKey(k);
    };
    const id = setInterval(refreshDate, 60000);
    document.addEventListener('visibilitychange', refreshDate);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', refreshDate);
    };
  }, [dateKey]);

  const { hijriStr, gregorianStr } = useMemo(() => {
    void dateKey;
    const now = new Date();
    let h = '';
    try {
      h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
    } catch {
      try {
        h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-nu-latn', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(now);
      } catch {
        h = 'التقويم الهجري';
      }
    }

    let g = '';
    try {
      g = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
    } catch {
      g = now.toLocaleDateString();
    }
    return { hijriStr: h, gregorianStr: `${g} م` };
  }, [dateKey]);

  return (
    <div
      onClick={onOpenEvents}
      className="moazen-widget relative mx-3 mt-0.5 mb-0 rounded-2xl border border-[#D6C18D] text-[#104B40] py-1.5 sm:py-2 px-3 flex items-center justify-between text-[10.5px] sm:text-xs cursor-pointer hover:shadow-md transition-all select-none overflow-hidden shrink-0"
    >
      {/* Action / View Events */}
      <div className="relative z-10 flex items-center gap-0.5 text-[#104B40] font-extrabold hover:text-[#0B3D35] shrink-0">
        <ChevronLeft className="w-3.5 h-3.5 text-[#9A7732]" />
        <span>{t.viewEvents}</span>
      </div>

      {/* Center: Live Hijri and Gregorian dates */}
      <div className="relative z-10 text-center font-bold text-[10px] sm:text-[11px] truncate px-1.5">
        <span className="text-[#8a6214] font-black">
          {t.todayPrefix}: {hijriStr}
        </span>
        <span className="mx-1.5 text-[#104B40]/30">|</span>
        <span className="text-[#172A28] font-bold">
          {t.gregorianPrefix}: {gregorianStr}
        </span>
      </div>

      {/* Title + Calendar Icon */}
      <div className="relative z-10 flex items-center gap-1 font-extrabold text-[#104B40] shrink-0">
        <span>{t.islamicEvents}</span>
        <Calendar className="w-3.5 h-3.5 text-[#9A7732]" />
      </div>
    </div>
  );
};
