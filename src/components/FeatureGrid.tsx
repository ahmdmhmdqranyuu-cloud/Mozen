import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AppLanguage, getTranslation } from '../utils/i18n';

export type FeatureKey =
  | 'quran'
  | 'prayer'
  | 'azkar'
  | 'qibla'
  | 'hadith'
  | 'dua'
  | 'seerah'
  | 'suggestions'
  | 'tasbih'
  | 'names'
  | 'recitations'
  | 'wallpapers'
  | 'quiz'
  | 'ramadan'
  | 'ruqyah'
  | 'prophets'
  | 'hajj'
  | 'masajid'
  | 'sunan';

interface FeatureGridProps {
  onSelectFeature: (key: FeatureKey) => void;
  language?: AppLanguage;
}

export const FeatureGrid: React.FC<FeatureGridProps> = React.memo(({ onSelectFeature, language }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useMemo(() => getTranslation(language), [language]);

  const allItems = useMemo(
    () => [
      {
        id: 'quran' as FeatureKey,
        title: t.featQuran,
        desc: t.featQuranSub,
        imageSrc: '/assets/icons/quran.png?v=3',
      },
      {
        id: 'prayer' as FeatureKey,
        title: t.featPrayer,
        desc: t.featPrayerSub,
        imageSrc: '/assets/icons/prayer.png?v=3',
      },
      {
        id: 'azkar' as FeatureKey,
        title: t.featAzkar,
        desc: t.featAzkarSub,
        imageSrc: '/assets/icons/azkar.png?v=3',
      },
      {
        id: 'qibla' as FeatureKey,
        title: t.featQibla,
        desc: t.featQiblaSub,
        imageSrc: '/assets/icons/qibla.png?v=3',
      },
      {
        id: 'hadith' as FeatureKey,
        title: t.featHadith,
        desc: t.featHadithSub,
        imageSrc: '/assets/icons/hadith.png?v=3',
      },
      {
        id: 'dua' as FeatureKey,
        title: t.featDua,
        desc: t.featDuaSub,
        imageSrc: '/assets/icons/dua.png?v=3',
      },
      {
        id: 'seerah' as FeatureKey,
        title: t.featSeerah,
        desc: t.featSeerahSub,
        imageSrc: '/assets/icons/seerah.png?v=3',
      },
      {
        id: 'hajj' as FeatureKey,
        title: t.featHajj,
        desc: t.featHajjSub,
        imageSrc: '/assets/icons/hajj.png?v=3',
      },
      {
        id: 'tasbih' as FeatureKey,
        title: t.featTasbih,
        desc: t.featTasbihSub,
        imageSrc: '/assets/icons/tasbih.png?v=3',
      },
      {
        id: 'names' as FeatureKey,
        title: t.featNames,
        desc: t.featNamesSub,
        imageSrc: '/assets/icons/names.png?v=3',
      },
      {
        id: 'recitations' as FeatureKey,
        title: t.featRecitations,
        desc: t.featRecitationsSub,
        imageSrc: '/assets/icons/recitations.png?v=3',
      },
      {
        id: 'wallpapers' as FeatureKey,
        title: t.featWallpapers,
        desc: t.featWallpapersSub,
        imageSrc: '/assets/icons/wallpapers.png?v=3',
      },
      {
        id: 'quiz' as FeatureKey,
        title: t.featQuiz,
        desc: t.featQuizSub,
        imageSrc: '/assets/icons/quiz.png?v=3',
      },
      {
        id: 'ramadan' as FeatureKey,
        title: t.featRamadan,
        desc: t.featRamadanSub,
        imageSrc: '/assets/icons/ramadan.png?v=3',
      },
      {
        id: 'ruqyah' as FeatureKey,
        title: t.featRuqyah,
        desc: t.featRuqyahSub,
        imageSrc: '/assets/icons/ruqyah.png?v=3',
      },
      {
        id: 'prophets' as FeatureKey,
        title: t.featProphets,
        desc: t.featProphetsSub,
        imageSrc: '/assets/icons/prophets.png?v=3',
      },
    ],
    [t]
  );

  const primaryItems = allItems.slice(0, 8);
  const extraItems = allItems.slice(8);

  const renderTile = (item: (typeof allItems)[number]) => (
    <button
      key={item.id}
      type="button"
      onClick={() => onSelectFeature(item.id)}
      className="moazen-widget flex flex-col items-center justify-between py-0.5 px-1 rounded-xl border border-[#D6C18D] hover:shadow-md hover:border-[#C5A059] transition-all active:scale-95 cursor-pointer text-center group min-h-[38px] sm:min-h-[42px]"
      title={item.title}
    >
      <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#EDE2C8] border border-[#D6C18D] overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 p-0.5 shadow-2xs">
        <img
          src={item.imageSrc}
          alt={item.title}
          decoding="async"
          className="w-full h-full object-contain pointer-events-none"
          loading="lazy"
        />
      </div>
      <div className="mt-0.5 w-full overflow-hidden">
        <h4 className="text-[8.5px] sm:text-[9px] font-black text-[#104B40] tracking-tight leading-tight group-hover:text-[#0B3D35] transition-colors truncate">
          {item.title}
        </h4>
        <p className="text-[6.5px] sm:text-[7px] text-[#4B5B58] font-medium truncate mt-0 leading-none">
          {item.desc}
        </p>
      </div>
    </button>
  );

  return (
    <div className="mx-3 mt-0.5 select-none shrink-0">
      {/* Default 8 primary sections (2 rows of 4) with tighter gaps */}
      <div className="grid grid-cols-4 gap-1">
        {primaryItems.map(renderTile)}
      </div>

      {/* Smooth animated accordion reveal for the remaining 8 sections */}
      <div
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-4 gap-1">
            {extraItems.map(renderTile)}
          </div>
        </div>
      </div>

      {/* Simple backgroundless black arrow-only toggle positioned at the far right edge */}
      <div className="flex justify-end mt-0 px-0.5" dir="ltr">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'إخفاء الأيقونات الإضافية' : 'عرض المزيد من الأيقونات'}
          className="p-0 bg-transparent border-0 shadow-none flex items-center justify-center text-black hover:text-black/80 active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_2px_rgba(255,255,255,0.55)]"
        >
          <ChevronDown
            className={`w-4 h-4 stroke-[2.6] transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>
      </div>
    </div>
  );
});
