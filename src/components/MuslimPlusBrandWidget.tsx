import React, { useMemo } from 'react';
import { AppLanguage } from '../utils/i18n';

interface MuslimPlusBrandWidgetProps {
  language?: AppLanguage;
}

export const MuslimPlusBrandWidget: React.FC<MuslimPlusBrandWidgetProps> = React.memo(
  ({ language = 'ar' }) => {
    const isRtl = language === 'ar' || language === 'ur';
    const brandTitle = useMemo(() => {
      if (language === 'ar' || language === 'ur') return 'مسلم بلس';
      return 'Muslim Plus';
    }, [language]);

    const brandTag = useMemo(() => {
      if (language === 'ar') return 'المؤذن • القرآن • الأذكار';
      if (language === 'ur') return 'اذان • قرآن • اذکار';
      if (language === 'fr') return 'Azan • Coran • Azkar';
      if (language === 'tr') return 'Ezan • Kur’an • Zikir';
      if (language === 'id') return 'Adzan • Al-Qur’an • Dzikir';
      if (language === 'es') return 'Azan • Corán • Adhkar';
      if (language === 'ru') return 'Азан • Коран • Азкары';
      return 'Azan • Quran • Azkar';
    }, [language]);

    return (
      <div
        className="mx-3 mb-1 rounded-2xl border border-[#D6C18D] bg-gradient-to-l from-[#F6EEDC]/96 via-[#FBF6E9]/96 to-[#EDE2C8]/96 shadow-sm px-3 py-1.5 flex items-center justify-between gap-2 select-none"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Ornamental Crescent & Mosque Emblem without foreign background */}
          <div className="w-7 h-7 rounded-xl bg-gradient-to-b from-[#104B40] to-[#0D3D34] border border-[#C5A059]/80 shadow-xs flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-[#F5D77F] fill-current"
              aria-hidden="true"
            >
              <path d="M12 2.5a7.5 7.5 0 0 0 0 15 7.2 7.2 0 0 0 5.65-2.7 6.3 6.3 0 0 1-8.5-8.46A7.46 7.46 0 0 0 12 2.5zm4.85 3.1.55 1.35 1.45.12-1.1.95.33 1.42-1.23-.76-1.24.76.34-1.42-1.1-.95 1.45-.12.55-1.35z" />
              <path d="M5 19.5h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2z" />
            </svg>
          </div>

          <div className="min-w-0 flex items-center gap-1.5">
            <h1 className="text-[13px] sm:text-sm font-black font-cairo text-[#104B40] leading-none truncate">
              {brandTitle}
            </h1>
            <span className="text-[#C5A059] text-xs font-bold leading-none">✦</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-[1px] w-4 bg-gradient-to-l from-[#C5A059] to-transparent hidden sm:inline-block" />
          <span className="text-[9.5px] sm:text-[10px] font-bold text-[#9A7732] font-cairo whitespace-nowrap">
            {brandTag}
          </span>
        </div>
      </div>
    );
  }
);
