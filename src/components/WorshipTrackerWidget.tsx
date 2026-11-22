import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Sparkles,
  SlidersHorizontal,
  Bell,
  BellOff,
  CalendarDays,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLanguage } from '../utils/i18n';
import {
  WORSHIP_ITEMS,
  WorshipDefinition,
  WorshipItemKey,
  WorshipTrackerState,
  adjustWorshipItemCount,
  computeDailySummary,
  computeWeeklyAveragePercent,
  getDayProgress,
  getLocalDateKey,
  getWeeklyWorshipHistory,
  loadWorshipTrackerState,
  saveWorshipTrackerState,
  toggleWorshipItemComplete,
  updateWorshipTarget,
} from '../utils/worshipTrackerStorage';
import { MotionDialogPresence } from './common/MotionModalShell';

interface WorshipTrackerWidgetProps {
  language?: AppLanguage;
}

export const WorshipTrackerWidget: React.FC<WorshipTrackerWidgetProps> = React.memo(
  ({ language = 'ar' }) => {
    const isRtl = language === 'ar' || language === 'ur';
    const isEnglish = language !== 'ar' && language !== 'ur';

    const [trackerState, setTrackerState] = useState<WorshipTrackerState>(() =>
      loadWorshipTrackerState()
    );
    const [dateKey, setDateKey] = useState<string>(() => getLocalDateKey());
    const [showWeekly, setShowWeekly] = useState(false);
    const [showGoalsDialog, setShowGoalsDialog] = useState(false);
    const [draftTargets, setDraftTargets] = useState<Record<WorshipItemKey, number>>(
      () => trackerState.targets
    );
    const [reminderEnabledDraft, setReminderEnabledDraft] = useState<boolean>(
      trackerState.reminderEnabled
    );
    const [reminderTimeDraft, setReminderTimeDraft] = useState<string>(
      trackerState.reminderTime || '20:30'
    );

    // Sync midnight rollover & cross-tab/external updates cleanly
    useEffect(() => {
      const checkDay = () => {
        const current = getLocalDateKey();
        setDateKey((prev) => (prev !== current ? current : prev));
      };
      const timer = window.setInterval(checkDay, 30_000);
      const onStorage = () => setTrackerState(loadWorshipTrackerState());
      window.addEventListener('storage', onStorage);
      return () => {
        window.clearInterval(timer);
        window.removeEventListener('storage', onStorage);
      };
    }, []);

    useEffect(() => {
      if (!showGoalsDialog) return;
      const handleBack = (e: Event) => {
        e.preventDefault();
        setShowGoalsDialog(false);
      };
      window.addEventListener('moazenBackRequested', handleBack);
      return () => window.removeEventListener('moazenBackRequested', handleBack);
    }, [showGoalsDialog]);

    // Optional gentle in-app/notification reminder check when enabled & Notification granted
    useEffect(() => {
      if (!trackerState.reminderEnabled) return;
      const checkReminder = () => {
        const today = getLocalDateKey();
        if (trackerState.lastReminderDateSent === today) return;
        const [hh, mm] = (trackerState.reminderTime || '20:30').split(':').map(Number);
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
        const now = new Date();
        const targetMinutes = hh * 60 + mm;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (nowMinutes >= targetMinutes && nowMinutes <= targetMinutes + 5) {
          const summary = computeDailySummary(trackerState, today);
          if (summary.percent < 100) {
            const next = saveWorshipTrackerState({
              ...trackerState,
              lastReminderDateSent: today,
            });
            setTrackerState(next);
            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              try {
                new Notification(
                  isEnglish ? 'Daily Worship Check-In' : 'تذكير لطيف • متتبع العبادات',
                  {
                    body: isEnglish
                      ? `Today's completion: ${summary.percent}% (${summary.completedCount}/${summary.totalItems}). Keep going!`
                      : `نسبة إنجازك اليوم ${summary.percent}% (${summary.completedCount} من ${summary.totalItems}). أكمل وردك اليومي بيسر.`,
                    tag: `worship-tracker-gentle-${today}`,
                  }
                );
              } catch {
                // ignore browser notification failure
              }
            }
          }
        }
      };
      checkReminder();
      const iv = window.setInterval(checkReminder, 45_000);
      return () => window.clearInterval(iv);
    }, [trackerState, isEnglish]);

    const persistUpdate = useCallback((next: WorshipTrackerState) => {
      const saved = saveWorshipTrackerState(next);
      setTrackerState(saved);
    }, []);

    const handleToggleItem = useCallback(
      (key: WorshipItemKey) => {
        persistUpdate(toggleWorshipItemComplete(trackerState, key, dateKey));
      },
      [trackerState, dateKey, persistUpdate]
    );

    const handleStepItem = useCallback(
      (key: WorshipItemKey, delta: number, e: React.MouseEvent) => {
        e.stopPropagation();
        persistUpdate(adjustWorshipItemCount(trackerState, key, delta, dateKey));
      },
      [trackerState, dateKey, persistUpdate]
    );

    const openGoalsEditor = () => {
      setDraftTargets({ ...trackerState.targets });
      setReminderEnabledDraft(trackerState.reminderEnabled);
      setReminderTimeDraft(trackerState.reminderTime || '20:30');
      setShowGoalsDialog(true);
    };

    const handleSaveGoals = () => {
      let nextState = { ...trackerState };
      for (const item of WORSHIP_ITEMS) {
        nextState = updateWorshipTarget(nextState, item.key, draftTargets[item.key] || item.defaultTarget);
      }
      nextState.reminderEnabled = reminderEnabledDraft;
      nextState.reminderTime = reminderTimeDraft || '20:30';
      persistUpdate(nextState);
      setShowGoalsDialog(false);
    };

    const dayProgress = useMemo(
      () => getDayProgress(trackerState, dateKey),
      [trackerState, dateKey]
    );
    const summary = useMemo(
      () => computeDailySummary(trackerState, dateKey),
      [trackerState, dateKey]
    );
    const weeklyHistory = useMemo(
      () => getWeeklyWorshipHistory(trackerState),
      [trackerState, dateKey]
    );
    const weeklyAvg = useMemo(
      () => computeWeeklyAveragePercent(trackerState),
      [trackerState, dateKey]
    );

    const formatDayShort = (isoDate: string) => {
      try {
        const [y, m, d] = isoDate.split('-').map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1);
        return dt.toLocaleDateString(isEnglish ? 'en-US' : 'ar-EG', { weekday: 'short' });
      } catch {
        return isoDate.slice(-2);
      }
    };

    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="moazen-widget rounded-2xl border border-[#D6C18D] p-2.5 sm:p-3 shadow-xs transition-all"
      >
        {/* Top Row: Title + Percentage Pill + Action Buttons */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-[#104B40] text-[#F5D77F] flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[12px] sm:text-xs font-extrabold font-cairo text-[#104B40] truncate">
                  {isEnglish ? 'Daily Worship Tracker' : 'متتبع العبادات اليومي'}
                </h3>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#104B40]/10 text-[#104B40] border border-[#C5A059]/40">
                  {summary.completedCount}/{summary.totalItems} • {summary.percent}%
                </span>
              </div>
              <p className="text-[10px] text-[#4B5B58] font-medium truncate">
                {isEnglish
                  ? `Weekly Avg: ${weeklyAvg}% • Saved automatically`
                  : `المعدل الأسبوعي: ${weeklyAvg}% • حفظ يومي وأسبوعي تلقائي`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowWeekly((s) => !s)}
              className="moazen-widget-sub px-2 py-1 rounded-xl border border-[#D6C18D] text-[#104B40] text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:brightness-95 active:scale-95 transition-all"
              title={isEnglish ? 'Weekly History' : 'السجل الأسبوعي'}
            >
              <CalendarDays className="w-3 h-3 text-[#9A7732]" />
              <span className="hidden xs:inline">{isEnglish ? 'Week' : 'الأسبوع'}</span>
              {showWeekly ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={openGoalsEditor}
              className="moazen-widget-sub p-1.5 rounded-xl border border-[#D6C18D] text-[#104B40] cursor-pointer hover:brightness-95 active:scale-95 transition-all"
              title={isEnglish ? 'Edit Daily Goals & Reminder' : 'تعديل الأهداف اليومية والتذكير'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#9A7732]" />
            </button>
          </div>
        </div>

        {/* Live Animated Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#D6C18D]/35 overflow-hidden mb-2 border border-[#D6C18D]/40">
          <motion.div
            initial={false}
            animate={{ width: `${summary.percent}%` }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-l from-[#104B40] via-[#1C6B5B] to-[#C5A059]"
          />
        </div>

        {/* Optional Weekly 7-Day Strip */}
        {showWeekly && (
          <div className="moazen-widget-sub rounded-xl border border-[#D6C18D]/70 p-2 mb-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#104B40] mb-1.5">
              <span>{isEnglish ? 'Last 7 Days Summary' : 'ملخص آخر 7 أيام'}</span>
              <span className="text-[#9A7732]">{weeklyAvg}%</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weeklyHistory.map((day) => {
                const isToday = day.dateKey === dateKey;
                return (
                  <div
                    key={day.dateKey}
                    className={`flex flex-col items-center rounded-lg py-1 px-0.5 border ${
                      isToday
                        ? 'border-[#C5A059] bg-[#C5A059]/15'
                        : 'border-[#D6C18D]/40 bg-white/40'
                    }`}
                  >
                    <span className="text-[8.5px] font-bold text-[#4B5B58] truncate max-w-full">
                      {formatDayShort(day.dateKey)}
                    </span>
                    <div className="w-2 h-6 bg-[#D6C18D]/35 rounded-full overflow-hidden flex items-end my-0.5">
                      <div
                        className="w-full bg-[#104B40] rounded-full transition-all"
                        style={{ height: `${Math.max(8, day.percent)}%` }}
                      />
                    </div>
                    <span className="text-[8.5px] font-black text-[#104B40]">{day.percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 8 Worship Items Compact Responsive 2-Column Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {WORSHIP_ITEMS.map((item: WorshipDefinition) => {
            const target = trackerState.targets[item.key] || item.defaultTarget;
            const current = dayProgress.counts[item.key] || 0;
            const done = current >= target;

            return (
              <div
                key={item.key}
                role="button"
                tabIndex={0}
                onClick={() => handleToggleItem(item.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleItem(item.key);
                  }
                }}
                className={`rounded-xl border px-2 py-1.5 transition-all cursor-pointer select-none flex items-center justify-between gap-1.5 ${
                  done
                    ? 'bg-[#104B40] text-white border-[#C5A059] shadow-xs'
                    : 'moazen-widget-sub text-[#172A28] border-[#D6C18D] hover:border-[#C5A059]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      done
                        ? 'bg-[#C5A059] border-[#F5D77F] text-[#0E2B22]'
                        : 'bg-white/80 border-[#C5A059]/60 text-transparent'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[10.5px] font-bold leading-tight truncate ${
                        done ? 'text-white' : 'text-[#172A28]'
                      }`}
                    >
                      {isEnglish ? item.titleEn : item.titleAr}
                    </p>
                    <p
                      className={`text-[9px] font-semibold leading-tight mt-0.5 ${
                        done ? 'text-[#F5D77F]' : 'text-[#4B5B58]'
                      }`}
                    >
                      {current}/{target} {isEnglish ? item.unitEn : item.unitAr}
                    </p>
                  </div>
                </div>

                {/* Compact +/- Stepper for multi-count goals */}
                {target > 1 && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleStepItem(item.key, -item.step, e)}
                      aria-label={isEnglish ? 'Decrease' : 'إنقاص'}
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] cursor-pointer ${
                        done
                          ? 'bg-white/15 text-white hover:bg-white/25'
                          : 'bg-[#104B40]/10 text-[#104B40] hover:bg-[#104B40]/20'
                      }`}
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleStepItem(item.key, item.step, e)}
                      aria-label={isEnglish ? 'Increase' : 'زيادة'}
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] cursor-pointer ${
                        done
                          ? 'bg-[#C5A059] text-[#0E2B22]'
                          : 'bg-[#104B40] text-white hover:brightness-110'
                      }`}
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Goals & Gentle Reminder Editor Dialog */}
        <MotionDialogPresence
          isOpen={showGoalsDialog}
          dialogKey="worship-goals-dialog"
          onBackdropClick={() => setShowGoalsDialog(false)}
        >
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="moazen-widget rounded-2xl border border-[#C5A059] p-4 shadow-2xl max-h-[82vh] flex flex-col"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#D6C18D]/60">
              <div>
                <h4 className="text-sm font-black font-cairo text-[#104B40]">
                  {isEnglish ? 'Customize Daily Worship Goals' : 'تخصيص أهداف العبادات اليومية'}
                </h4>
                <p className="text-[11px] text-[#4B5B58]">
                  {isEnglish
                    ? 'Adjust your daily target for each act and optional check-in reminder.'
                    : 'عدّل الهدف اليومي لكل عبادة وحدد تذكيراً اختيارياً لطيفاً.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGoalsDialog(false)}
                className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#104B40] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {WORSHIP_ITEMS.map((item) => {
                const val = draftTargets[item.key] || item.defaultTarget;
                return (
                  <div
                    key={item.key}
                    className="moazen-widget-sub rounded-xl border border-[#D6C18D] px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#172A28] truncate">
                        {isEnglish ? item.titleEn : item.titleAr}
                      </p>
                      <p className="text-[10px] text-[#4B5B58]">
                        {isEnglish ? item.unitEn : item.unitAr}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftTargets((prev) => ({
                            ...prev,
                            [item.key]: Math.max(item.minTarget, val - item.step),
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-[#104B40]/10 text-[#104B40] font-bold flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-xs font-black text-[#104B40]">
                        {val}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftTargets((prev) => ({
                            ...prev,
                            [item.key]: Math.min(item.maxTarget, val + item.step),
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-[#104B40] text-white font-bold flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Optional Non-Intrusive Daily Check-In Reminder */}
              <div className="moazen-widget-sub rounded-xl border border-[#C5A059]/60 p-3 space-y-2 mt-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {reminderEnabledDraft ? (
                      <Bell className="w-4 h-4 text-[#104B40]" />
                    ) : (
                      <BellOff className="w-4 h-4 text-[#4B5B58]" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-[#104B40]">
                        {isEnglish ? 'Optional Daily Reminder' : 'تذكير يومي لطيف (اختياري)'}
                      </p>
                      <p className="text-[10px] text-[#4B5B58]">
                        {isEnglish
                          ? 'Gentle nudge if your daily tracker is incomplete'
                          : 'تنبيه غير مزعج لمتابعة أورادك اليومية'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderEnabledDraft}
                    onChange={(e) => setReminderEnabledDraft(e.target.checked)}
                    className="w-4 h-4 accent-[#104B40] cursor-pointer"
                  />
                </div>
                {reminderEnabledDraft && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-bold text-[#172A28]">
                      {isEnglish ? 'Reminder Time:' : 'وقت التذكير:'}
                    </span>
                    <input
                      type="time"
                      value={reminderTimeDraft}
                      onChange={(e) => setReminderTimeDraft(e.target.value)}
                      className="rounded-lg border border-[#D6C18D] bg-white px-2.5 py-1 text-xs font-bold text-[#104B40]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2.5 border-t border-[#D6C18D]/60">
              <button
                type="button"
                onClick={handleSaveGoals}
                className="flex-1 py-2 rounded-xl bg-[#104B40] text-white text-xs font-extrabold cursor-pointer hover:brightness-110"
              >
                {isEnglish ? 'Save Goals' : 'حفظ الأهداف'}
              </button>
              <button
                type="button"
                onClick={() => setShowGoalsDialog(false)}
                className="px-4 py-2 rounded-xl border border-[#D6C18D] bg-white/80 text-[#172A28] text-xs font-bold cursor-pointer"
              >
                {isEnglish ? 'Cancel' : 'إلغاء'}
              </button>
            </div>
          </div>
        </MotionDialogPresence>
      </div>
    );
  }
);
