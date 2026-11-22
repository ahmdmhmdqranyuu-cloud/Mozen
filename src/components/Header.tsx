import React, { useMemo } from 'react';
import { Bell, Settings } from 'lucide-react';
import { UserProfile } from '../types';
import { getTranslation } from '../utils/i18n';

interface HeaderProps {
  user: UserProfile;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
  hideBackground?: boolean;
  leaveDomeClear?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  user,
  onOpenNotifications,
  onOpenSettings,
  hideBackground = false,
  leaveDomeClear = false,
}) => {
  const t = useMemo(() => getTranslation(user.language), [user.language]);

  return (
    <div
      className={`relative w-full text-white pt-1.5 pb-0.5 px-3 overflow-hidden shrink-0 ${
        hideBackground ? 'bg-transparent' : 'rounded-b-2xl shadow-md bg-[#EFE8D1]'
      }`}
    >
      {/* Fullscreen-matched Mosque & Mihrab Arch Background when rendered standalone */}
      {!hideBackground && (
        <>
          <img
            src="/assets/aistudio/________________ae325fdd.jpg"
            alt="خلفية مسلم بلس"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/15 via-transparent to-[#F2EAD4]/30" />
        </>
      )}

      {/* Top Corner Controls: Notifications & Settings + Unboxed Gold Quran Ayah — keeps central painted Mihrab logo, lantern, minaret & mosque dome unobstructed */}
      <div className="relative z-10 flex items-start justify-between">
        {/* Notifications & Settings icon pills (Unified Cream-Ivory Widget Surface) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="moazen-widget relative p-1 rounded-full border border-[#D6C18D] text-[#104B40] hover:brightness-98 transition-all shadow-sm cursor-pointer active:scale-95"
            title="التنبيهات والإشعارات"
          >
            <Bell className="w-3 h-3" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[#F6EEDC] animate-pulse" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="moazen-widget p-1 rounded-full border border-[#D6C18D] text-[#104B40] hover:brightness-98 transition-all shadow-sm cursor-pointer active:scale-95"
            title={t.settingsTitle}
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>

        {/* Unboxed Quran Ayah directly over sky/arch in Warm Gold */}
        <div className="text-right px-1 py-0 bg-transparent border-0 shadow-none">
          <p className="text-[10px] font-bold text-[#F5D77F] tracking-wide font-quran leading-tight [text-shadow:0_1px_6px_rgba(12,35,29,0.78)]">
            {t.ayahHeader}
          </p>
          <span className="text-[8.5px] font-semibold text-[#F5D77F]/95 block mt-0 font-sans leading-tight [text-shadow:0_1px_5px_rgba(12,35,29,0.78)]">
            {t.ayahSource}
          </span>
        </div>
      </div>

      {/* Reduced ~38% upper dome/logo height while keeping Mihrab arch, logo & green mosque horizon cleanly framed above PrayerCard */}
      {leaveDomeClear ? (
        <div className="h-[clamp(72px,11.5dvh,112px)] w-full pointer-events-none" />
      ) : (
        <div className="relative z-10 flex flex-col items-center mt-1 mb-1 select-none">
          <h1 className="text-base sm:text-lg font-black tracking-wide font-cairo leading-tight text-[#104B40] drop-shadow-xs">
            {t.appName || 'مسلم بلس'}
          </h1>

          <div className="flex items-center justify-center gap-2 w-full max-w-xs mt-0">
            <span className="h-[1px] flex-1 bg-gradient-to-l from-[#C5A059] to-transparent" />
            <p className="text-[9px] font-bold tracking-wide font-cairo leading-tight whitespace-nowrap text-[#172A28]">
              {t.appTagline}
            </p>
            <span className="h-[1px] flex-1 bg-gradient-to-r from-[#C5A059] to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
});
