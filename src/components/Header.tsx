import React from 'react';
import { Bell, Settings } from 'lucide-react';
import { UserProfile } from '../types';
import { getTranslation } from '../utils/i18n';

interface HeaderProps {
  user: UserProfile;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenNotifications,
  onOpenSettings,
}) => {
  const t = getTranslation(user.language);

  return (
    <div className="relative w-full text-white pt-2 pb-2.5 px-3.5 overflow-hidden rounded-b-2xl shadow-md bg-[#0B3D35] shrink-0">
      {/* Attached Mosque Image displayed as-is inside the exact same Header dimensions */}
      <img
        src="/assets/aistudio/_________________________713b9a3f.jpg"
        alt="Grand Mosque Header"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Subtle balanced gradient overlay to preserve full beauty of the mosque photo while keeping text readable */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-black/15 to-black/55"
      />

      {/* Top Header Row: Settings & Notifications on left, Quran verse on right */}
      <div className="relative z-10 flex items-center justify-between">
        {/* Left side: Notifications & Settings buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/45 transition-all shadow-xs cursor-pointer active:scale-95"
            title="التنبيهات والإشعارات"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full border border-emerald-950 animate-pulse" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/45 transition-all shadow-xs cursor-pointer active:scale-95"
            title={t.settingsTitle}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right side: Quran Ayah with elegant typography */}
        <div className="text-right">
          <p className="text-[10.5px] font-semibold text-amber-200 tracking-wide font-quran drop-shadow-md leading-tight">
            {t.ayahHeader}
          </p>
          <span className="text-[9px] text-white/85 block mt-0 font-sans drop-shadow-xs leading-tight">
            {t.ayahSource}
          </span>
        </div>
      </div>

      {/* Brand Calligraphy Logo: «أذان» - مؤذن الإسلامي - compact and centered */}
      <div className="relative z-10 flex flex-col items-center mt-0.5 select-none">
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 160 80" className="w-15 h-6 drop-shadow-lg">
              {/* Central Minaret Alif with crescent top */}
              <path
                d="M 68 70 L 68 20 C 68 15, 74 15, 74 20 L 74 70 Z"
                fill="#ffffff"
              />
              <circle cx="71" cy="14" r="3" fill="#ffffff" />
              <path
                d="M 71 8 C 73 8, 75 10, 75 12 C 73 11, 69 11, 67 12 C 67 10, 69 8, 71 8 Z"
                fill="#ffffff"
              />

              {/* Calligraphy curves for "أذان" */}
              <path
                d="M 120 48 C 110 32, 90 32, 85 45 C 80 58, 92 68, 110 68 C 125 68, 135 62, 138 56 C 130 58, 115 58, 105 52 C 95 46, 102 38, 112 40 C 118 42, 120 46, 120 48 Z"
                fill="#ffffff"
              />
              <polygon points="106,24 112,18 118,24 112,30" fill="#ffffff" />

              <path
                d="M 60 45 C 55 58, 40 68, 22 65 C 10 63, 6 52, 10 44 C 14 54, 25 60, 36 58 C 48 55, 52 48, 54 42 Z"
                fill="#ffffff"
              />
              <polygon points="32,42 37,37 42,42 37,47" fill="#ffffff" />

              <path
                d="M 60 30 C 60 22, 82 22, 82 30 Z"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                opacity="0.7"
              />
            </svg>
          </div>

          <p className="text-[9px] text-white/95 font-semibold tracking-wide drop-shadow -mt-0.5 font-cairo leading-tight">
            {t.appTagline}
          </p>
        </div>
      </div>
    </div>
  );
};
