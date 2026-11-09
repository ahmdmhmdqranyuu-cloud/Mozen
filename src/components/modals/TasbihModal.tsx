import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Vibrate,
  Sparkles,
  ChevronRight,
  Plus,
  Check,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../../utils/audioPlayer';

interface TasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalTasbihCount: number;
  onIncrementTotalTasbih: (amount: number) => void;
}

interface ZikrPreset {
  id: string;
  text: string;
  target: number;
  fadl: string;
}

const DEFAULT_PRESETS: ZikrPreset[] = [
  {
    id: 'subhanallah',
    text: 'سُبْحَانَ اللَّهِ',
    target: 33,
    fadl: 'تُغرس بها نخلة في الجنة وتُحط الخطايا',
  },
  {
    id: 'alhamdulillah',
    text: 'الْحَمْدُ لِلَّهِ',
    target: 33,
    fadl: 'تملأ الميزان بالخير والبركة',
  },
  {
    id: 'allahuakbar',
    text: 'اللَّهُ أَكْبَرُ',
    target: 33,
    fadl: 'أحب الكلام إلى الله وأعظمه',
  },
  {
    id: 'tahlil',
    text: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    target: 100,
    fadl: 'أفضل الذكر، حرز من الشيطان طوال اليوم',
  },
  {
    id: 'istighfar',
    text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    target: 100,
    fadl: 'مفتاح الرزق وممحاة الذنوب وتفريج الهموم',
  },
  {
    id: 'salawat',
    text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ',
    target: 100,
    fadl: 'من صلى علي صلاة صلى الله عليه بها عشراً',
  },
  {
    id: 'hawqala',
    text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    target: 100,
    fadl: 'كنز من كنوز الجنة ودواء لتسعة وتسعين داء',
  },
  {
    id: 'subhan_bihamdih',
    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    target: 100,
    fadl: 'كلمتان خفيفتان على اللسان ثقيلتان في الميزان',
  },
];

export const TasbihModal: React.FC<TasbihModalProps> = ({
  isOpen,
  onClose,
  totalTasbihCount,
  onIncrementTotalTasbih,
}) => {
  const [presets, setPresets] = useState<ZikrPreset[]>(DEFAULT_PRESETS);
  const [selectedZikrId, setSelectedZikrId] = useState<string>('subhanallah');
  const [count, setCount] = useState<number>(0);
  const [selectedTarget, setSelectedTarget] = useState<number>(33);
  const [customZikrText, setCustomZikrText] = useState<string>('');
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);
  const [completedRounds, setCompletedRounds] = useState<number>(0);

  if (!isOpen) return null;

  const currentPreset = presets.find((p) => p.id === selectedZikrId) || presets[0];

  const handleTap = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    onIncrementTotalTasbih(1);

    if (soundEnabled) {
      soundService.playTasbihClick();
    }

    if (vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(25);
    }

    // Check target reached
    if (selectedTarget > 0 && nextCount % selectedTarget === 0) {
      setCompletedRounds((r) => r + 1);
      if (soundEnabled) {
        soundService.playSuccessCelebration();
      }
      if (vibrateEnabled && navigator.vibrate) {
        navigator.vibrate([60, 50, 60]);
      }
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleSelectPreset = (p: ZikrPreset) => {
    setSelectedZikrId(p.id);
    setSelectedTarget(p.target);
    setCount(0);
  };

  const handleAddCustomZikr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customZikrText.trim()) return;
    const newPreset: ZikrPreset = {
      id: `custom_${Date.now()}`,
      text: customZikrText.trim(),
      target: 33,
      fadl: 'ذكر مبارك كتبه الله في ميزان حسناتك',
    };
    setPresets([newPreset, ...presets]);
    setSelectedZikrId(newPreset.id);
    setSelectedTarget(33);
    setCount(0);
    setCustomZikrText('');
    setIsAddingCustom(false);
  };

  const progressPercent = selectedTarget > 0 ? Math.min(100, (count % selectedTarget) / selectedTarget * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-hidden select-none animate-fadeIn">
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#FAF9F5] relative">
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
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">المسبحة الإلكترونية</h2>
              <p className="text-[11px] text-gray-500">اذكر الله ذكراً كثيراً</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                soundEnabled ? 'bg-[#C5A059] text-white' : 'bg-[#F7F6F2] text-gray-600'
              }`}
              title={soundEnabled ? 'صوت التسبيح مفعّل' : 'صوت التسبيح مكتوم'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setVibrateEnabled(!vibrateEnabled)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                vibrateEnabled ? 'bg-[#C5A059] text-white' : 'bg-[#F7F6F2] text-gray-600'
              }`}
              title={vibrateEnabled ? 'الاهتزاز مفعّل' : 'الاهتزاز معطل'}
            >
              <Vibrate className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lifetime Tasbih Badge */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-900">إجمالي تسبيحاتك المسجلة:</span>
          </div>
          <span className="text-xs font-black text-emerald-800 font-sans bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
            {totalTasbihCount.toLocaleString('ar-EG')} تسبيحة
          </span>
        </div>

        {/* Scrollable Presets Horizontal Strip */}
        <div className="p-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-700">اختر الذكر المبارك:</span>
            <button
              onClick={() => setIsAddingCustom(!isAddingCustom)}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>ذكر مخصص</span>
            </button>
          </div>

          {isAddingCustom && (
            <form onSubmit={handleAddCustomZikr} className="flex gap-2 mb-2 animate-fadeIn">
              <input
                type="text"
                placeholder="اكتب الذكر أو الدعاء الخاص بك..."
                value={customZikrText}
                onChange={(e) => setCustomZikrText(e.target.value)}
                className="flex-1 text-xs border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer"
              >
                حفظ
              </button>
            </form>
          )}

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {presets.map((p) => {
              const isSelected = p.id === selectedZikrId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#104B40] text-white shadow-xs scale-102'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Tasbih Clicker Area */}
        <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto">
          {/* Active Zikr Title & Fadl */}
          <div className="w-full text-center space-y-1 mt-1">
            <h3 className="text-xl sm:text-2xl font-black font-quran text-[#104B40] leading-tight px-4">
              {currentPreset.text}
            </h3>
            <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
              {currentPreset.fadl}
            </p>
          </div>

          {/* Interactive Beaded Circle Counter Button */}
          <div className="my-auto relative flex items-center justify-center">
            {/* Outer Rotating / Glowing Ring */}
            <svg className="w-56 h-56 transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="4"
              />
              {/* Progress Stroke */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#104B40"
                strokeWidth="5"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
            </svg>

            {/* Clickable Center Button */}
            <button
              onClick={handleTap}
              className="absolute inset-4 rounded-full bg-gradient-to-b from-white to-[#f4f7f4] shadow-[0_10px_25px_rgba(16,75,64,0.2)] border-4 border-[#104B40]/15 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer select-none group"
            >
              <span className="text-4xl sm:text-5xl font-black text-[#104B40] font-sans tracking-tight">
                {count.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-bold text-gray-400 mt-1 group-hover:text-emerald-700 transition-colors">
                اضغط للتسبيح
              </span>
              {selectedTarget > 0 && (
                <span className="text-[10px] text-emerald-800/80 font-bold mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  الهدف: {selectedTarget}
                </span>
              )}
            </button>
          </div>

          {/* Target Selector & Controls */}
          <div className="w-full space-y-3">
            {/* Target Options */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-gray-600">الدورة:</span>
              {[33, 99, 100, 1000, 0].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTarget(t)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedTarget === t
                      ? 'bg-[#104B40] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t === 0 ? 'مفتوح' : t}
                </button>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200/80">
              <div className="text-xs text-gray-500 font-medium">
                دورات مكتملة: <strong className="text-emerald-800 font-sans">{completedRounds}</strong>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير العداد</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
