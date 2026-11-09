import React from 'react';
import { AppLanguage, getTranslation } from '../utils/i18n';

export type TabKey = 'home' | 'quran' | 'prayer' | 'qibla' | 'ramadan' | 'settings' | 'profile' | 'more';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  language?: AppLanguage;
  hidden?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
  hidden = false,
}) => {
  // Completely hide inside Settings page and all of its sub-pages
  if (hidden || activeTab === 'settings') {
    return null;
  }

  const t = getTranslation(language);
  const tabs: { id: TabKey; label: string; iconSrc: string }[] = [
    {
      id: 'home',
      label: t.navHome,
      iconSrc: '/assets/icons/nav_home.png?v=2',
    },
    {
      id: 'prayer',
      label: t.navPrayer,
      iconSrc: '/assets/icons/nav_prayer.png?v=2',
    },
    {
      id: 'quran',
      label: t.navQuran,
      iconSrc: '/assets/icons/nav_quran.png?v=2',
    },
    {
      id: 'qibla',
      label: t.navQibla,
      iconSrc: '/assets/icons/nav_qibla.png?v=2',
    },
    {
      id: 'settings',
      label: t.navSettings,
      iconSrc: '/assets/icons/nav_settings.png?v=2',
    },
  ];

  return (
    <nav
      aria-label="الشريط السفلي"
      className="fixed bottom-0 inset-x-0 w-full z-[60] bg-white/96 backdrop-blur-md border-t border-gray-200/85 shadow-[0_-4px_18px_rgba(16,75,64,0.10)] select-none transition-all duration-200 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="w-full max-w-2xl mx-auto px-2 py-1">
        <div className="flex items-center justify-between">
          {tabs.map((tab) => {
            const isActive =
              activeTab === tab.id ||
              (tab.id === 'home' &&
                activeTab !== 'prayer' &&
                activeTab !== 'quran' &&
                activeTab !== 'qibla');

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative py-0.5"
                title={tab.label}
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-150 ${
                    isActive
                      ? 'scale-105 ring-1 ring-[#104B40]/30 bg-emerald-50/40'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <img
                    src={tab.iconSrc}
                    alt={tab.label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span
                  className={`text-[9px] sm:text-[9.5px] leading-tight mt-0.5 tracking-tight transition-colors ${
                    isActive ? 'text-[#104B40] font-black' : 'text-gray-500 font-bold'
                  }`}
                >
                  {tab.label}
                </span>

                {isActive && (
                  <span className="w-4 h-0.5 bg-[#104B40] rounded-full mt-0.5 transition-all duration-200" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

