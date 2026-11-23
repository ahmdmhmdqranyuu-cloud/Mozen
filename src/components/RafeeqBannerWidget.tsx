import React from 'react';
import { Bell, Settings } from 'lucide-react';
import { AppLanguage } from '../utils/i18n';
import { triggerLightHaptic } from '../utils/haptics';

interface RafeeqBannerWidgetProps {
  language?: AppLanguage;
  hasNotificationDot?: boolean;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

export const RafeeqBannerWidget: React.FC<RafeeqBannerWidgetProps> = React.memo(
  ({ language = 'ar', hasNotificationDot = true, onOpenSettings, onOpenNotifications }) => {
    const isRtl = language === 'ar' || language === 'ur';

    return (
      <div className="mx-3 mt-1.5 mb-1.5 select-none shrink-0" dir="ltr">
        {/* Outer 3D Beveled Gold Metallic Frame */}
        <div
          className="relative rounded-[22px] p-[3px] shadow-[0_12px_28px_-6px_rgba(98,70,18,0.34),0_3px_10px_rgba(16,75,64,0.12)]"
          style={{
            background:
              'linear-gradient(145deg, #FFF3BF 0%, #D9B14A 28%, #9B711C 62%, #F1D57B 88%, #B9892D 100%)',
          }}
        >
          <div className="relative w-full aspect-[720/300] rounded-[19px] overflow-hidden bg-[#FBF4DF] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(110,78,18,0.22)]">
            <img
              src="/assets/aistudio/________________5564ace6.jpg"
              alt={isRtl ? 'رفيق المسلم - مؤذنك الإسلامي' : 'Rafeeq Al-Muslim Banner'}
              decoding="async"
              className="w-full h-full object-cover object-center pointer-events-none select-none"
            />

            {/* Two Real Interactive Circular Buttons Top-Right matching the Banner Visual */}
            <div className="absolute top-[5%] right-[1.8%] z-20 flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerLightHaptic();
                  onOpenSettings();
                }}
                aria-label={isRtl ? 'الإعدادات' : 'Settings'}
                title={isRtl ? 'الإعدادات' : 'Settings'}
                className="relative min-w-[44px] min-h-[44px] w-[11vw] max-w-[48px] h-[11vw] max-h-[48px] rounded-full flex items-center justify-center bg-gradient-to-b from-[#FFFDF2] to-[#F3E1B2] border-2 border-[#C89F3F] shadow-[0_4px_10px_rgba(68,48,12,0.28),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:scale-105 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#104B40]"
              >
                <Settings className="w-5 h-5 text-[#104B40] stroke-[2.2]" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerLightHaptic();
                  onOpenNotifications();
                }}
                aria-label={isRtl ? 'التنبيهات والمواقيت' : 'Notifications & Prayer Times'}
                title={isRtl ? 'التنبيهات والمواقيت' : 'Notifications & Prayer Times'}
                className="relative min-w-[44px] min-h-[44px] w-[11vw] max-w-[48px] h-[11vw] max-h-[48px] rounded-full flex items-center justify-center bg-gradient-to-b from-[#FFFDF2] to-[#F3E1B2] border-2 border-[#C89F3F] shadow-[0_4px_10px_rgba(68,48,12,0.28),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:scale-105 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#104B40]"
              >
                <Bell className="w-5 h-5 text-[#104B40] stroke-[2.2] fill-[#104B40]" />
                {hasNotificationDot && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-[#FFFDF2]"
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
