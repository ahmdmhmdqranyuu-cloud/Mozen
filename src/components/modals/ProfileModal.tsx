import React, { useState, useEffect } from 'react';
import {
  User,
  Edit3,
  Award,
  Sparkles,
  BookOpen,
  ChevronRight,
  BarChart3,
  Trophy,
  Headphones,
  Moon,
  ScrollText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  userStatsTracker,
  PersistedUserStats,
  formatListeningDuration,
} from '../../utils/userStatsTracker';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUserName: (name: string) => void;
  onOpenQuranReader: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUserName,
  onOpenQuranReader,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'monthly' | 'total'>('daily');
  const [realStats, setRealStats] = useState<PersistedUserStats>(() =>
    userStatsTracker.getStats()
  );

  useEffect(() => {
    if (!isOpen) return;
    setNameInput(user.name);
    const unsub = userStatsTracker.subscribe((updated) => {
      setRealStats(updated);
    });
    return unsub;
  }, [isOpen, user.name]);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateUserName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  // Period metrics (Daily, Monthly, Total) - 100% genuine tracked actions
  const dailyMetrics = userStatsTracker.getMetricsForPeriod('daily');
  const monthlyMetrics = userStatsTracker.getMetricsForPeriod('monthly');
  const totalMetrics = userStatsTracker.getMetricsForPeriod('total');
  const activeMetrics =
    statsPeriod === 'daily'
      ? dailyMetrics
      : statsPeriod === 'monthly'
      ? monthlyMetrics
      : totalMetrics;

  // Khatma completion percentage based on unique Mushaf pages read out of 604
  const uniquePagesReadCount = activeMetrics.quranPagesIds.length;
  const totalUniquePagesAllTime = totalMetrics.quranPagesIds.length;
  const khatmaPercent = Math.min(
    100,
    Number(((totalUniquePagesAllTime / 604) * 100).toFixed(1))
  );

  // Last Quran Read Position (from real tracker or user profile)
  const lastQuranPosition = realStats.lastReadQuran;
  const displayLastSurahName =
    lastQuranPosition?.surahName || user.lastReadSurahName || 'سورة الفاتحة';
  const displayLastAyah = lastQuranPosition?.ayahNumber || user.lastReadAyah || 1;
  const displayLastPage = lastQuranPosition?.pageNumber || user.lastReadPage || 1;

  // Ramadan actual recorded achievements
  const ramadanStats = userStatsTracker.computeRamadanStats(
    user.ramadanFastingTracker || {}
  );

  const completedPrayersCount = Object.values(user.prayersToday || {}).filter(Boolean).length;

  const periodLabel =
    statsPeriod === 'daily'
      ? 'إحصائيات اليوم'
      : statsPeriod === 'monthly'
      ? 'إحصائيات هذا الشهر'
      : 'الإحصائيات الإجمالية';

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F7F6F2] flex flex-col overflow-hidden select-none animate-fadeIn"
      dir="rtl"
    >
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#F7F6F2] relative">
        {/* Clean White Header */}
        <div className="bg-white text-[#172A28] px-4 pt-5 pb-3.5 flex items-center justify-between shadow-xs border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
              aria-label="رجوع"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black font-cairo text-[#172A28]">
                الملف الشخصي وقسم «إحصائياتي»
              </h2>
              <p className="text-[11px] text-gray-500">
                سجل إنجازاتك الفعلية اليومية والشهرية والإجمالية
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] border border-gray-200 flex items-center justify-center text-[#C5A059]">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
          {/* User Identity Card */}
          <div className="bg-white rounded-2xl p-4 text-[#172A28] shadow-xs border border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#F7F6F2] border-2 border-[#C5A059] flex items-center justify-center text-[#104B40] shrink-0">
                <User className="w-7 h-7" />
              </div>

              <div>
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="bg-[#F7F6F2] border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#172A28] focus:outline-none focus:border-[#104B40]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-[#104B40] text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      حفظ
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#172A28]">{user.name}</h3>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 rounded-lg bg-[#F7F6F2] hover:bg-gray-200 text-gray-600 cursor-pointer"
                      title="تعديل الاسم"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <p className="text-xs text-[#9A7732] mt-0.5 font-amiri font-bold">
                  {`﴿وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ﴾`} • مدينة {user.city.name}
                </p>
              </div>
            </div>

            <div className="bg-[#ebf5f1] border border-[#104B40]/20 px-3 py-2 rounded-xl text-center shrink-0">
              <span className="text-[10px] font-bold text-[#104B40] block">صلوات اليوم</span>
              <strong className="text-sm font-black font-mono text-[#104B40]">
                {completedPrayersCount} / 5
              </strong>
            </div>
          </div>

          {/* =========================================================
              MY STATISTICS SECTION («إحصائياتي»)
          ========================================================= */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#104B40] text-[#C5A059] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#172A28] font-cairo">
                    قسم «إحصائياتي» — الإنجازات الفعلية
                  </h3>
                  <span className="text-[10px] text-gray-500 block">
                    تُحتسب الإنجازات الفعلية فقط تلقائياً دون تكرار وتُحفظ دائماً على جهازك
                  </span>
                </div>
              </div>

              {/* Period Switcher: Daily | Monthly | Total */}
              <div className="grid grid-cols-3 gap-1 bg-[#F7F6F2] p-1 rounded-xl border border-gray-200">
                {[
                  { id: 'daily' as const, label: 'اليومية' },
                  { id: 'monthly' as const, label: 'الشهرية' },
                  { id: 'total' as const, label: 'الإجمالية' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatsPeriod(tab.id)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statsPeriod === tab.id
                        ? 'bg-[#104B40] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-[#172A28]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. التسبيح (Tasbih: Daily, Monthly & Total) */}
            <div className="bg-[#FAF9F5] rounded-2xl p-3.5 border border-gray-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                    1. التسبيح والذكر
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-[#104B40] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {periodLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">تسبيحات اليوم</span>
                  <strong className="text-base font-black font-mono text-[#104B40]">
                    {dailyMetrics.tasbihCount.toLocaleString('en-US')}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">تسبيحات الشهر</span>
                  <strong className="text-base font-black font-mono text-[#9A7732]">
                    {monthlyMetrics.tasbihCount.toLocaleString('en-US')}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">الإجمالي الكلي</span>
                  <strong className="text-base font-black font-mono text-[#172A28]">
                    {totalMetrics.tasbihCount.toLocaleString('en-US')}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. القرآن الكريم (Surahs, Ayahs, Khatma %, Last Read Position) */}
            <div className="bg-[#FAF9F5] rounded-2xl p-3.5 border border-gray-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#104B40]" />
                  <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                    2. القرآن الكريم والختمة
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={onOpenQuranReader}
                  className="text-[11px] bg-[#104B40] hover:bg-[#0B3D35] text-white px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  متابعة القراءة
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">السور المقروءة</span>
                  <strong className="text-base font-black font-mono text-[#104B40]">
                    {activeMetrics.quranSurahsIds.length}
                  </strong>
                  <span className="text-[9px] text-gray-400 block">من 114 سورة</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">الآيات المقروءة</span>
                  <strong className="text-base font-black font-mono text-[#104B40]">
                    {activeMetrics.quranAyahsCount.toLocaleString('en-US')}
                  </strong>
                  <span className="text-[9px] text-gray-400 block">
                    {uniquePagesReadCount} صفحة
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">نسبة إتمام الختمة</span>
                  <strong className="text-base font-black font-mono text-[#9A7732]">
                    {khatmaPercent}%
                  </strong>
                  <span className="text-[9px] text-gray-400 block">
                    {totalUniquePagesAllTime} / 604 ص
                  </span>
                </div>
              </div>

              {/* Khatma Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#104B40] to-[#C5A059] transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, khatmaPercent))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] bg-white px-3 py-2 rounded-xl border border-gray-100">
                  <span className="text-gray-600 font-bold">آخر موضع وصلت إليه:</span>
                  <span className="font-black text-[#104B40]">
                    {displayLastSurahName} • صفحة {displayLastPage} (الآية {displayLastAyah})
                  </span>
                </div>
              </div>
            </div>

            {/* 3. الأحاديث النبوية & 4. السنن والأذكار */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 3. الأحاديث */}
              <div className="bg-[#FAF9F5] rounded-2xl p-3.5 border border-gray-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-[#9A7732]" />
                    <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                      3. الأحاديث النبوية
                    </h4>
                  </div>
                  <span className="text-[10px] text-gray-500">{periodLabel}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-700 block">
                      عدد الأحاديث المقروءة
                    </span>
                    <span className="text-[10px] text-gray-400">
                      أحاديث نبوية أتممت قراءتها وتدبرها
                    </span>
                  </div>
                  <strong className="text-xl font-black font-mono text-[#104B40]">
                    {activeMetrics.hadithReadIds.length}
                  </strong>
                </div>
              </div>

              {/* 4. السنن والأذكار */}
              <div className="bg-[#FAF9F5] rounded-2xl p-3.5 border border-gray-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#104B40]" />
                    <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                      4. السنن والأذكار
                    </h4>
                  </div>
                  <span className="text-[10px] text-gray-500">{periodLabel}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-700 block">
                      الأذكار والسنن المنجزة
                    </span>
                    <span className="text-[10px] text-gray-400">
                      أذكار: {activeMetrics.azkarCompletedIds.length} • سنن ورقية:{' '}
                      {activeMetrics.sunanCompletedIds.length}
                    </span>
                  </div>
                  <strong className="text-xl font-black font-mono text-[#104B40]">
                    {activeMetrics.azkarCompletedIds.length +
                      activeMetrics.sunanCompletedIds.length}
                  </strong>
                </div>
              </div>
            </div>

            {/* 5. المسابقات (Participations, Correct Answers, Points) */}
            <div className="bg-[#FAF9F5] rounded-2xl p-3.5 border border-gray-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                    5. المسابقات الإسلامية
                  </h4>
                </div>
                <span className="text-[10px] text-gray-500">{periodLabel}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">عدد المشاركات</span>
                  <strong className="text-base font-black font-mono text-[#172A28]">
                    {activeMetrics.quizParticipations}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">الإجابات الصحيحة</span>
                  <strong className="text-base font-black font-mono text-[#104B40]">
                    {activeMetrics.quizCorrectQuestionIds.length}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">النقاط المكتسبة</span>
                  <strong className="text-base font-black font-mono text-[#9A7732]">
                    {activeMetrics.quizPoints}
                  </strong>
                </div>
              </div>
            </div>

            {/* 6. رمضان (Worship & Achievements recorded during the month) */}
            <div className="bg-[#FAF9F5] rounded-2xl p-3.5 border border-gray-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-[#9A7732]" />
                  <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                    6. رمضان — إحصائيات العبادات والإنجازات
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-[#9A7732] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  إجمالي العبادات المسجلة: {ramadanStats.totalDeedsCompleted}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 text-center">
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <span className="text-[9px] text-gray-500 block">الصيام</span>
                  <strong className="text-xs font-black font-mono text-[#104B40]">
                    {ramadanStats.fastedDays}/30
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <span className="text-[9px] text-gray-500 block">الجماعة</span>
                  <strong className="text-xs font-black font-mono text-[#104B40]">
                    {ramadanStats.congregationDays}/30
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <span className="text-[9px] text-gray-500 block">التراويح</span>
                  <strong className="text-xs font-black font-mono text-[#9A7732]">
                    {ramadanStats.taraweehDays}/30
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <span className="text-[9px] text-gray-500 block">الورد القرآني</span>
                  <strong className="text-xs font-black font-mono text-teal-800">
                    {ramadanStats.quranDays}/30
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <span className="text-[9px] text-gray-500 block">الصدقة</span>
                  <strong className="text-xs font-black font-mono text-rose-700">
                    {ramadanStats.charityDays}/30
                  </strong>
                </div>
              </div>
            </div>

            {/* 7. الاستماع للتلاوات (Listening time, Surahs count, Recitations count) */}
            <div className="bg-[#FAF9F5] rounded-2xl p-3.5 border border-gray-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#104B40]" />
                  <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                    7. الاستماع للتلاوات القرآنية
                  </h4>
                </div>
                <span className="text-[10px] text-gray-500">{periodLabel}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">وقت الاستماع</span>
                  <strong className="text-xs sm:text-sm font-black text-[#104B40] block mt-0.5">
                    {formatListeningDuration(activeMetrics.recitationListeningSeconds)}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">عدد السور المستمع إليها</span>
                  <strong className="text-base font-black font-mono text-[#104B40]">
                    {activeMetrics.recitationSurahsIds.length}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">عدد التلاوات المشغلة</span>
                  <strong className="text-base font-black font-mono text-[#9A7732]">
                    {activeMetrics.recitationTracksKeys.length}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>محفوظة تلقائياً على الهاتف</span>
              </span>
              <span>تُحدّث الأرقام تلقائياً فور استخدام أقسام التطبيق</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
