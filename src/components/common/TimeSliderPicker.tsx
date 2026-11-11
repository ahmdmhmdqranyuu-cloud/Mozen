import React from 'react';
import { Clock, Sun, Moon, Sparkles } from 'lucide-react';

interface TimeSliderPickerProps {
  label: string;
  sublabel?: string;
  value: string; // "HH:mm"
  onChange: (time: string) => void;
  format24h?: boolean;
}

export const TimeSliderPicker: React.FC<TimeSliderPickerProps> = ({
  label,
  sublabel,
  value = '08:00',
  onChange,
  format24h = false,
}) => {
  // Parse hours and minutes
  const parts = (value || '08:00').split(':');
  const rawH = parseInt(parts[0], 10);
  const rawM = parseInt(parts[1], 10);

  const hours = isNaN(rawH) ? 8 : Math.max(0, Math.min(23, rawH));
  const minutes = isNaN(rawM) ? 0 : Math.max(0, Math.min(59, rawM));

  // Compute 12-hour format display
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const isPm = hours >= 12;
  const periodText = isPm ? 'مساءً (م)' : 'صباحاً (ص)';
  const paddedH24 = hours.toString().padStart(2, '0');
  const paddedM = minutes.toString().padStart(2, '0');
  const formatted24 = `${paddedH24}:${paddedM}`;
  const formatted12 = `${hour12}:${paddedM} ${periodText}`;

  const isDaytime = hours >= 6 && hours < 18;

  const handleHourChange = (newH: number) => {
    const clampedH = Math.max(0, Math.min(23, newH));
    const hStr = clampedH.toString().padStart(2, '0');
    const mStr = minutes.toString().padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  const handleMinuteChange = (newM: number) => {
    const clampedM = Math.max(0, Math.min(59, newM));
    const hStr = hours.toString().padStart(2, '0');
    const mStr = clampedM.toString().padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  const adjustByMinutes = (delta: number) => {
    let totalMinutes = hours * 60 + minutes + delta;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    totalMinutes = totalMinutes % (24 * 60);
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    const hStr = newH.toString().padStart(2, '0');
    const mStr = newM.toString().padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs space-y-3" dir="rtl">
      {/* Header with Title and Current Selected Time Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
        <div>
          <span className="text-xs font-black text-gray-900 block">{label}</span>
          {sublabel && (
            <span className="text-[10px] text-gray-500 font-sans block">{sublabel}</span>
          )}
        </div>

        {/* Live formatted time badge (12h and 24h) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-emerald-950 shadow-2xs">
          {isDaytime ? (
            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          )}
          <span className="text-xs font-black font-sans tracking-wide">
            {format24h ? formatted24 : formatted12}
          </span>
          <span className="text-[10px] text-emerald-800 font-mono font-bold bg-white/80 px-1.5 py-0.5 rounded-md border border-emerald-200/50">
            {formatted24}
          </span>
        </div>
      </div>

      {/* Slider 1: Hours (00 - 23) resembling mobile volume slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-700 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#104B40]" />
            <span>الساعات:</span>
          </span>
          <span className="text-xs font-bold font-mono text-[#104B40] bg-emerald-50 px-2 py-0.5 rounded-md">
            {hours.toString().padStart(2, '0')} ({hour12} {isPm ? 'م' : 'ص'})
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={23}
            step={1}
            value={hours}
            onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
            className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#104B40] border border-gray-200/80"
            style={{
              background: `linear-gradient(to left, #104B40 0%, #104B40 ${(hours / 23) * 100}%, #e5e7eb ${(hours / 23) * 100}%, #e5e7eb 100%)`,
            }}
          />
        </div>

        <div className="flex justify-between text-[9px] text-gray-400 font-mono px-1">
          <span>00 (منتصف الليل)</span>
          <span>06 (فجراً)</span>
          <span>12 (ظهراً)</span>
          <span>18 (مساءً)</span>
          <span>23 (ليلاً)</span>
        </div>
      </div>

      {/* Slider 2: Minutes (00 - 59) */}
      <div className="space-y-1.5 pt-1 border-t border-gray-100/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-700 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>الدقائق:</span>
          </span>
          <span className="text-xs font-bold font-mono text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md">
            {minutes.toString().padStart(2, '0')} دقيقة
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={59}
            step={1}
            value={minutes}
            onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
            className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#C5A059] border border-gray-200/80"
            style={{
              background: `linear-gradient(to left, #C5A059 0%, #C5A059 ${(minutes / 59) * 100}%, #e5e7eb ${(minutes / 59) * 100}%, #e5e7eb 100%)`,
            }}
          />
        </div>

        <div className="flex justify-between text-[9px] text-gray-400 font-mono px-1">
          <span>:00</span>
          <span>:15</span>
          <span>:30</span>
          <span>:45</span>
          <span>:59</span>
        </div>
      </div>

      {/* Quick Adjustment Chips */}
      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
        <span className="text-[10px] text-gray-500 font-bold ml-1">تعديل سريع:</span>
        <button
          type="button"
          onClick={() => adjustByMinutes(-15)}
          className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold cursor-pointer transition-colors"
        >
          - 15 د
        </button>
        <button
          type="button"
          onClick={() => adjustByMinutes(+15)}
          className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold cursor-pointer transition-colors"
        >
          + 15 د
        </button>
        <button
          type="button"
          onClick={() => handleMinuteChange(0)}
          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold cursor-pointer transition-colors"
        >
          تمام الساعة (:00)
        </button>
        <button
          type="button"
          onClick={() => handleMinuteChange(30)}
          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold cursor-pointer transition-colors"
        >
          ونصف (:30)
        </button>
      </div>
    </div>
  );
};
