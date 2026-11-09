import React, { useState } from 'react';
import { X, Bell, Check, Volume2, ChevronRight } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [reminders, setReminders] = useState({
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    sabahAzkar: true,
    masaaAzkar: true,
    fridayKahf: true,
    qiyam: false,
  });

  if (!isOpen) return null;

  const toggle = (key: keyof typeof reminders) => {
    setReminders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fcfbf7] flex flex-col overflow-hidden select-none animate-fadeIn">
      <div className="w-full h-full max-w-md mx-auto flex flex-col overflow-hidden bg-[#fcfbf7] relative">
        {/* Clean White Header (No Green) */}
        <div className="bg-white text-[#172A28] px-4 pt-5 pb-3.5 flex items-center justify-between shadow-sm border-b border-gray-100 shrink-0" dir="rtl">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
              aria-label="رجوع"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">تنبيهات الأذان والأذكار</h2>
              <p className="text-[11px] text-gray-500">إدارة إشعارات الصلوات الخمس والأذكار</p>
            </div>
          </div>
          <Bell className="w-5 h-5 text-[#C5A059]" />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Prayer Adhan Alarms */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2.5">
            <h4 className="text-xs font-bold text-gray-800 text-right pb-1 border-b border-gray-100">
              تنبيهات صوت الأذان عند دخول الوقت:
            </h4>

            {[
              { id: 'fajr' as const, label: 'أذان صلاة الفجر' },
              { id: 'dhuhr' as const, label: 'أذان صلاة الظهر' },
              { id: 'asr' as const, label: 'أذان صلاة العصر' },
              { id: 'maghrib' as const, label: 'أذان صلاة المغرب' },
              { id: 'isha' as const, label: 'أذان صلاة العشاء' },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${
                    reminders[item.id] ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      reminders[item.id] ? '-translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Daily Worship Alarms */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2.5">
            <h4 className="text-xs font-bold text-gray-800 text-right pb-1 border-b border-gray-100">
              تنبيهات الطاعات والأذكار:
            </h4>

            {[
              { id: 'sabahAzkar' as const, label: 'تذكير أذكار الصباح (بعد الشروق)' },
              { id: 'masaaAzkar' as const, label: 'تذكير أذكار المساء (بعد العصر)' },
              { id: 'fridayKahf' as const, label: 'تذكير قراءة سورة الكهف كل جمعة' },
              { id: 'qiyam' as const, label: 'تنبيه قيام الليل (الثلث الأخير)' },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${
                    reminders[item.id] ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      reminders[item.id] ? '-translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
