import React from 'react';
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

export const FeatureGrid: React.FC<FeatureGridProps> = ({ onSelectFeature, language }) => {
  const t = getTranslation(language);

  // All 16 Sections displayed directly in 4 columns (4 rows of 4 icons)
  // Preserves exact card styling, dimensions, and visual aesthetics without any distortion
  const allItems = [
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
  ];

  return (
    <div className="mx-3.5 mt-1.5 select-none shrink-0">
      {/* Grid of 4 columns with all 16 sections */}
      <div className="grid grid-cols-4 gap-1.5">
        {allItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectFeature(item.id)}
            className="flex flex-col items-center justify-between py-1.5 px-1 rounded-xl bg-white border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-emerald-200 transition-all active:scale-95 cursor-pointer text-center group min-h-[54px] sm:min-h-[58px]"
            title={item.title}
          >
            {/* Real Uploaded / SVG Islamic Icon */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
              <img
                src={item.imageSrc}
                alt={item.title}
                className="w-full h-full object-contain pointer-events-none"
                loading="eager"
              />
            </div>
            <div className="mt-0.5 w-full overflow-hidden">
              <h4 className="text-[9.5px] sm:text-[10px] font-extrabold text-[#172A28] tracking-tight leading-tight group-hover:text-[#104B40] transition-colors truncate">
                {item.title}
              </h4>
              <p className="text-[7.5px] sm:text-[8px] text-gray-400 font-medium truncate mt-0 leading-none">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
