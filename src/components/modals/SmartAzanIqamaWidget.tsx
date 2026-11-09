import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  BellRing,
  Clock,
  CheckCircle2,
  RotateCw,
  BookOpen,
  Compass,
  Sparkles,
  Move,
  Layers,
  Sun,
} from 'lucide-react';
import { PrayerKey } from '../../types';
import { soundService } from '../../utils/audioPlayer';
import {
  getExtendedSetupSettings,
  saveExtendedSetupSettings,
  getNativeAndroidBridge,
} from '../../utils/androidPermissionsManager';

export interface SmartAzanIqamaSession {
  prayerKey: PrayerKey;
  prayerName: string;
  azanTimeStr: string;
  cityName: string;
  iqamaDurationMinutes: number;
  startedAtMs: number;
  iqamaTargetMs: number;
}

interface SmartAzanIqamaWidgetProps {
  session: SmartAzanIqamaSession | null;
  isMinimized: boolean;
  isAzanAudioPlaying: boolean;
  onStopAzanAudioOnly: () => void;
  onMinimizeToNotification: () => void;
  onRestoreFullScreen: () => void;
  onDismissSession: () => void;
  onOpenPrayerAzkar?: () => void;
  onOpenQuran?: () => void;
  onOpenQibla?: () => void;
}

interface AndroidBridgeOngoingNotification {
  showOngoingIqamaNotification?: (
    title: string,
    body: string,
    remainingSeconds: number
  ) => void;
  cancelOngoingIqamaNotification?: () => void;
  showFloatingAzanOverlay?: (
    prayerName: string,
    cityName: string,
    iqamaMinutes: number
  ) => void;
  hideFloatingAzanOverlay?: () => void;
}

export const SMART_WIDGET_ENABLED_KEY = 'moazen_smart_azan_iqama_widget_enabled_v1';

export function isSmartAzanWidgetEnabled(): boolean {
  try {
    const ext = getExtendedSetupSettings();
    if (ext.floatingAzanWindowEnabled === false && ext.lockScreenAzanEnabled === false) {
      return false;
    }
    const val = localStorage.getItem(SMART_WIDGET_ENABLED_KEY);
    if (val === null) return true; // Enabled by default
    return val === 'true';
  } catch {
    return true;
  }
}

export function setSmartAzanWidgetEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SMART_WIDGET_ENABLED_KEY, enabled ? 'true' : 'false');
    saveExtendedSetupSettings({
      floatingAzanWindowEnabled: enabled,
    });
  } catch {
    // ignore
  }
}

export const SmartAzanIqamaWidget: React.FC<SmartAzanIqamaWidgetProps> = ({
  session,
  isMinimized,
  isAzanAudioPlaying,
  onStopAzanAudioOnly,
  onMinimizeToNotification,
  onRestoreFullScreen,
  onDismissSession,
  onOpenPrayerAzkar,
  onOpenQuran,
  onOpenQibla,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [audioMutedByButton, setAudioMutedByButton] = useState<boolean>(false);
  const [isLandscapeLayout, setIsLandscapeLayout] = useState<boolean>(() => {
    return getExtendedSetupSettings().landscapeAzanScreenEnabled;
  });

  // Floating Window Mode vs Full-Screen/Lock-Screen Mode
  const [displayMode, setDisplayMode] = useState<'floating' | 'fullscreen'>(() => {
    const ext = getExtendedSetupSettings();
    return ext.floatingAzanWindowEnabled ? 'floating' : 'fullscreen';
  });

  // Draggable Floating Window Position
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  } | null>(null);

  // Screen wake glow effect when wakeScreenOnAzanEnabled is active
  const [screenWakeGlow, setScreenWakeGlow] = useState<boolean>(false);
  const lastNotificationMinuteRef = useRef<number>(-1);

  const getAndroidBridge = (): AndroidBridgeOngoingNotification | undefined => {
    if (typeof window === 'undefined') return undefined;
    return (window as unknown as { AndroidBridge?: AndroidBridgeOngoingNotification })
      .AndroidBridge;
  };

  // Reset mute state, wake screen if enabled, and sync with native Android overlay when a new prayer session starts
  useEffect(() => {
    let wakeLockSentinel: { release?: () => Promise<void> } | null = null;

    if (session) {
      const ext = getExtendedSetupSettings();
      setAudioMutedByButton(false);
      setIsLandscapeLayout(ext.landscapeAzanScreenEnabled);
      setDisplayMode(ext.floatingAzanWindowEnabled ? 'floating' : 'fullscreen');
      setDragPos({ x: 0, y: 0 });
      lastNotificationMinuteRef.current = -1;

      // Wake screen if wakeScreenOnAzanEnabled is enabled (Requirement 3)
      if (ext.wakeScreenOnAzanEnabled) {
        setScreenWakeGlow(true);
        const timer = setTimeout(() => setScreenWakeGlow(false), 3500);
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          try {
            (
              navigator as unknown as {
                wakeLock: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
              }
            ).wakeLock
              .request('screen')
              .then((sentinel) => {
                wakeLockSentinel = sentinel;
              })
              .catch(() => {});
          } catch {
            // ignore
          }
        }
        return () => clearTimeout(timer);
      }

      // Notify native Android SYSTEM_ALERT_WINDOW service if running inside APK
      const bridge = getNativeAndroidBridge();
      if (ext.floatingAzanWindowEnabled && bridge?.showFloatingAzanOverlay) {
        try {
          bridge.showFloatingAzanOverlay(
            session.prayerName,
            session.cityName,
            session.iqamaDurationMinutes
          );
        } catch {
          // ignore
        }
      }
    } else {
      const bridge = getAndroidBridge();
      bridge?.cancelOngoingIqamaNotification?.();
      bridge?.hideFloatingAzanOverlay?.();
    }

    return () => {
      if (wakeLockSentinel?.release) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [session?.startedAtMs, session?.prayerKey]);

  // Listen for Volume Down hardware/keyboard key to mute Azan audio if volumeDownStopsAzan is enabled
  useEffect(() => {
    if (!session) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const ext = getExtendedSetupSettings();
      if (!ext.volumeDownStopsAzan) return;
      if (
        e.key === 'AudioVolumeDown' ||
        e.key === 'VolumeDown' ||
        e.code === 'AudioVolumeDown' ||
        e.keyCode === 174 ||
        e.keyCode === 25
      ) {
        soundService.stopAudio();
        setAudioMutedByButton(true);
        onStopAzanAudioOnly();
      }
    };
    const handleCustomVolumeDown = () => {
      const ext = getExtendedSetupSettings();
      if (!ext.volumeDownStopsAzan) return;
      soundService.stopAudio();
      setAudioMutedByButton(true);
      onStopAzanAudioOnly();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('volumeDownPressed', handleCustomVolumeDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('volumeDownPressed', handleCustomVolumeDown);
    };
  }, [session, onStopAzanAudioOnly]);

  // Update persistent/ongoing notification in phone notification shade when minimized
  const updateOngoingShadeNotification = useCallback(
    (remSec: number) => {
      if (!session) return;
      const mins = Math.floor(remSec / 60);
      const secs = remSec % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      const title =
        remSec > 0
          ? `العد التنازلي لإقامة صلاة ${session.prayerName} (${formatted})`
          : `حان الآن موعد إقامة صلاة ${session.prayerName}`;
      const body =
        remSec > 0
          ? `الله أكبر • متبقي ${formatted} على إقامة صلاة ${session.prayerName} — اضغط لإعادة فتح نافذة الأذان`
          : `أقيموا صفوفكم وتراصّوا • حان وقت إقامة صلاة ${session.prayerName}`;

      // 1. Native Android ongoing notification bridge
      const bridge = getAndroidBridge();
      if (bridge?.showOngoingIqamaNotification) {
        try {
          bridge.showOngoingIqamaNotification(title, body, remSec);
        } catch {
          // ignore
        }
      }

      // 2. Web / ServiceWorker persistent notification with tag
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        if (lastNotificationMinuteRef.current !== mins || remSec === 0) {
          lastNotificationMinuteRef.current = mins;
          try {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready
                .then((reg) => {
                  reg.showNotification(title, {
                    body,
                    icon: '/assets/icons/prayer.png?v=2',
                    badge: '/assets/icons/prayer.png?v=2',
                    tag: 'smart-azan-iqama-ongoing',
                    renotify: remSec === 0,
                    requireInteraction: true,
                    data: { action: 'restoreSmartAzanWidget' },
                  } as NotificationOptions);
                })
                .catch(() => {
                  const n = new Notification(title, {
                    body,
                    icon: '/assets/icons/prayer.png?v=2',
                    tag: 'smart-azan-iqama-ongoing',
                    requireInteraction: true,
                  });
                  n.onclick = () => {
                    window.focus();
                    onRestoreFullScreen();
                  };
                });
            } else {
              const n = new Notification(title, {
                body,
                icon: '/assets/icons/prayer.png?v=2',
                tag: 'smart-azan-iqama-ongoing',
                requireInteraction: true,
              });
              n.onclick = () => {
                window.focus();
                onRestoreFullScreen();
              };
            }
          } catch {
            // ignore
          }
        }
      }
    },
    [session, onRestoreFullScreen]
  );

  // Accurate 1-second timer based on target timestamp
  useEffect(() => {
    if (!session) return;

    const tick = () => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.ceil((session.iqamaTargetMs - nowMs) / 1000));
      setRemainingSeconds(diffSec);

      if (isMinimized) {
        updateOngoingShadeNotification(diffSec);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session, isMinimized, updateOngoingShadeNotification]);

  // Listen for notification click events from ServiceWorker or Android Bridge to restore widget
  useEffect(() => {
    const handleRestoreEvent = () => {
      onRestoreFullScreen();
    };
    window.addEventListener('restoreSmartAzanWidget', handleRestoreEvent);
    return () => {
      window.removeEventListener('restoreSmartAzanWidget', handleRestoreEvent);
    };
  }, [onRestoreFullScreen]);

  // Pointer drag handlers for moving the Floating Azan Window anywhere on screen
  const handlePointerDownDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: dragPos.x,
      startY: dragPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    const maxOffsetX = Math.max(120, window.innerWidth * 0.42);
    const maxOffsetY = Math.max(180, window.innerHeight * 0.42);
    setDragPos({
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, dragStartRef.current.startX + dx)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, dragStartRef.current.startY + dy)),
    });
  };

  const handlePointerUpDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  if (!session) return null;

  const totalSeconds = Math.max(1, session.iqamaDurationMinutes * 60);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressRatio = Math.min(1, Math.max(0, remainingSeconds / totalSeconds));

  // Circular SVG geometry
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const handleClickStopSoundOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.stopAudio();
    setAudioMutedByButton(true);
    onStopAzanAudioOnly();
  };

  const handleClickMinimizeToNotification = (e: React.MouseEvent) => {
    e.stopPropagation();
    lastNotificationMinuteRef.current = -1;
    updateOngoingShadeNotification(remainingSeconds);
    onMinimizeToNotification();
  };

  const handleQuickAction = (callback?: () => void) => {
    if (!callback) return;
    // Minimize floating window into floating bar so user can interact with the opened section while Iqama countdown continues
    onMinimizeToNotification();
    callback();
  };

  // ============================================================================
  // 1. MINIMIZED STATE: Floating Pill / Bubble + Ongoing Notification in Shade
  // ============================================================================
  if (isMinimized) {
    return (
      <div
        onClick={onRestoreFullScreen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onRestoreFullScreen();
        }}
        className="fixed top-3 inset-x-3 max-w-md mx-auto z-[95] bg-gradient-to-r from-[#0B3D35] via-[#104B40] to-[#0B3D35] text-white p-3 rounded-2xl shadow-2xl border border-[#C5A059]/70 flex items-center justify-between gap-2.5 cursor-pointer select-none animate-fadeIn"
        dir="rtl"
        title="اضغط لإعادة فتح نافذة الأذان العائمة"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-full bg-amber-400/15 border border-amber-300/50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black font-quran text-amber-300">
                الله أكبر • صلاة {session.prayerName}
              </span>
              <span className="text-[9.5px] bg-white/15 px-2 py-0.5 rounded-full font-bold text-emerald-100">
                نافذة الأذان مصغّرة
              </span>
            </div>
            <p className="text-[11px] text-white/90 font-bold mt-0.5">
              {remainingSeconds > 0
                ? `متبقي على الإقامة: ${formattedCountdown} — اضغط لإعادة الفتح`
                : `حان الآن موعد إقامة صلاة ${session.prayerName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestoreFullScreen();
            }}
            className="p-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 cursor-pointer"
            title="إعادة فتح نافذة الأذان العائمة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundService.stopAudio();
              const bridge = getAndroidBridge();
              bridge?.cancelOngoingIqamaNotification?.();
              bridge?.hideFloatingAzanOverlay?.();
              onDismissSession();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
            title="إغلاق نافذة الأذان نهائياً"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. DRAGGABLE FLOATING AZAN WINDOW (نافذة الأذان العائمة فوق التطبيقات)
  // ============================================================================
  if (displayMode === 'floating') {
    return (
      <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-3 select-none">
        {/* Screen Wake-up Flash Overlay if wakeScreenOnAzanEnabled */}
        {screenWakeGlow && (
          <div className="fixed inset-0 bg-amber-200/15 pointer-events-none animate-pulse z-[-1]" />
        )}

        <div
          onPointerDown={handlePointerDownDrag}
          onPointerMove={handlePointerMoveDrag}
          onPointerUp={handlePointerUpDrag}
          style={{
            transform: `translate3d(${dragPos.x}px, ${dragPos.y}px, 0)`,
          }}
          className={`pointer-events-auto relative w-full max-w-[360px] rounded-[28px] overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.75)] border-2 border-[#C5A059]/75 bg-[#071F1B] text-white transition-shadow ${
            isDragging ? 'cursor-grabbing ring-4 ring-[#C5A059]/50' : 'cursor-grab'
          }`}
          dir="rtl"
        >
          {/* Mosque Background Image & Islamic Dark Emerald Gradient Overlay */}
          <img
            src="/assets/aistudio/_________________________713b9a3f.jpg"
            alt="خلفية المسجد"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-[#072620]/82 to-[#041814]/95 pointer-events-none" />

          {/* Top Draggable Header Bar */}
          <div className="relative z-10 px-3.5 pt-3 pb-2 flex items-center justify-between gap-1.5 border-b border-white/10 bg-black/25 backdrop-blur-xs">
            {/* Close & Stop Azan Button */}
            <button
              type="button"
              onClick={() => {
                soundService.stopAudio();
                const bridge = getAndroidBridge();
                bridge?.cancelOngoingIqamaNotification?.();
                bridge?.hideFloatingAzanOverlay?.();
                onDismissSession();
              }}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-rose-600/80 border border-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="إغلاق نافذة الأذان"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Drag Handle Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-amber-300/30 text-[10px] font-bold text-amber-200">
              <Move className="w-3 h-3 text-amber-300" />
              <span>نافذة الأذان العائمة • اسحب للتحريك</span>
            </div>

            {/* Minimize & Fullscreen Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDisplayMode('fullscreen')}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 flex items-center justify-center text-amber-200 transition-colors cursor-pointer"
                title="تكبير لشاشة القفل وملء الشاشة"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClickMinimizeToNotification}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-amber-300/40 flex items-center justify-center text-amber-300 transition-colors cursor-pointer"
                title="تصغير النافذة"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Floating Content: Mosque Header, Prayer Name, Circular Iqama Countdown */}
          <div className="relative z-10 px-4 pt-3 pb-4 flex flex-col items-center text-center">
            {/* Prayer Name & City Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#104B40]/85 border border-[#C5A059]/50 text-amber-200 text-[11px] font-bold mb-1.5 shadow-sm">
              <BellRing className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
              <span>
                حان الآن وقت صلاة {session.prayerName} • {session.cityName}
              </span>
            </div>

            {/* Calligraphic Allahu Akbar & Current Prayer Title */}
            <h2 className="text-3xl font-black font-quran text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-300 to-[#C5A059] drop-shadow-md leading-tight">
              اللهُ أَكْبَرُ • صلاة {session.prayerName}
            </h2>
            <span className="text-[11px] text-emerald-100/90 font-bold mt-0.5 mb-2.5">
              موعد الأذان: {session.azanTimeStr} • حَيَّ عَلَى الصَّلَاةِ
            </span>

            {/* Circular Countdown Timer to Iqama */}
            <div className="relative w-44 h-44 flex items-center justify-center my-1">
              <div className="absolute inset-2 rounded-full bg-[#06231E]/75 backdrop-blur-md border border-[#C5A059]/35 shadow-[0_0_35px_rgba(16,75,64,0.85)]" />

              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 210 210">
                <circle
                  cx="105"
                  cy="105"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.14)"
                  strokeWidth="9"
                  fill="transparent"
                />
                <circle
                  cx="105"
                  cy="105"
                  r={radius}
                  stroke="url(#floatingIqamaGrad)"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-linear"
                />
                <defs>
                  <linearGradient id="floatingIqamaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="50%" stopColor="#C5A059" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                {remainingSeconds > 0 ? (
                  <>
                    <span className="text-[10px] font-bold text-amber-200/95">
                      الوقت المتبقي للإقامة
                    </span>
                    <span
                      className="text-3xl font-black font-mono tracking-wider text-white tabular-nums my-0.5"
                      dir="ltr"
                    >
                      {formattedCountdown}
                    </span>
                    <span className="text-[9.5px] text-emerald-200 font-bold bg-white/10 px-2.5 py-0.5 rounded-full">
                      إقامة {session.prayerName} ({session.iqamaDurationMinutes} د)
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 mb-0.5 animate-bounce" />
                    <span className="text-sm font-black font-quran text-amber-300">
                      قَدْ قَامَتِ الصَّلَاةُ
                    </span>
                    <span className="text-[10px] text-white/90 font-bold">
                      حان وقت إقامة {session.prayerName}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Mute/Stop Azan Sound Only Pill */}
            <button
              type="button"
              onClick={handleClickStopSoundOnly}
              className={`mt-2 w-full py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                audioMutedByButton || !isAzanAudioPlaying
                  ? 'bg-white/10 border-white/20 text-white/80'
                  : 'bg-rose-600/90 hover:bg-rose-600 border-rose-300/50 text-white shadow-md'
              }`}
            >
              {audioMutedByButton || !isAzanAudioPlaying ? (
                <>
                  <VolumeX className="w-4 h-4 text-amber-300" />
                  <span>تم كتم صوت الأذان (العداد مستمر)</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-amber-200 animate-pulse" />
                  <span>إيقاف صوت الأذان فقط مع بقاء النافذة</span>
                </>
              )}
            </button>

            {/* Primary Button: زر أذكار الصلاة (Requirement 1) */}
            <button
              type="button"
              onClick={() => handleQuickAction(onOpenPrayerAzkar)}
              className="mt-2.5 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4B06A] to-[#B38E46] hover:opacity-95 text-[#071F1B] text-xs font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-[#071F1B]" />
              <span>أذكار الصلاة وما بعد السلام</span>
            </button>

            {/* Two Secondary Buttons: زرا القرآن والقبلة (Requirement 1) */}
            <div className="mt-2 grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => handleQuickAction(onOpenQuran)}
                className="py-2.5 px-3 rounded-xl bg-[#104B40]/90 hover:bg-[#104B40] border border-[#C5A059]/45 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>القرآن الكريم</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAction(onOpenQibla)}
                className="py-2.5 px-3 rounded-xl bg-[#104B40]/90 hover:bg-[#104B40] border border-[#C5A059]/45 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>اتجاه القبلة</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. FULL-SCREEN / LOCK-SCREEN AZAN & IQAMA VIEW (الظهور على شاشة القفل وملء الشاشة)
  // ============================================================================
  return (
    <div
      className="fixed inset-0 w-screen h-[100dvh] z-[100] flex flex-col justify-between overflow-hidden select-none animate-fadeIn bg-[#071F1B] text-white"
      dir="rtl"
    >
      {/* Screen Wake-up Light Glow when wakeScreenOnAzanEnabled is active */}
      {screenWakeGlow && (
        <div className="fixed inset-0 bg-amber-200/20 pointer-events-none animate-pulse z-30" />
      )}

      {/* Full-Screen Mosque Background Image with atmospheric overlay */}
      <img
        src="/assets/aistudio/_________________________713b9a3f.jpg"
        alt="خلفية المسجد"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-[#072620]/75 to-black/90 pointer-events-none" />

      {/* Top Action Bar */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-4 pt-4 sm:pt-6 flex items-center justify-between gap-2">
        {/* Button (×) — Stops ONLY the Azan audio while keeping the Smart Widget & Countdown active */}
        <button
          type="button"
          onClick={handleClickStopSoundOnly}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-md border transition-all cursor-pointer active:scale-95 ${
            audioMutedByButton || !isAzanAudioPlaying
              ? 'bg-white/15 border-white/25 text-white/90'
              : 'bg-rose-600/90 hover:bg-rose-600 border-rose-300/50 text-white shadow-lg'
          }`}
          title="إيقاف صوت الأذان فقط مع بقاء الويدجت والعداد التنازلي للإقامة يعمل"
        >
          <span className="w-6 h-6 rounded-full bg-black/25 flex items-center justify-center font-bold text-sm leading-none">
            ×
          </span>
          <div className="text-right">
            <span className="text-xs font-black block leading-tight">
              {audioMutedByButton || !isAzanAudioPlaying
                ? 'تم كتم صوت الأذان'
                : 'إيقاف صوت الأذان فقط'}
            </span>
            <span className="text-[9.5px] text-white/80 block">
              مع بقاء عداد الإقامة يعمل
            </span>
          </div>
          {audioMutedByButton || !isAzanAudioPlaying ? (
            <VolumeX className="w-4 h-4 text-amber-300" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-200 animate-pulse" />
          )}
        </button>

        <div className="flex items-center gap-1.5">
          {/* Switch to Draggable Floating Window Mode */}
          <button
            type="button"
            onClick={() => setDisplayMode('floating')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-amber-300/40 text-amber-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="تحويل إلى نافذة عائمة قابلة للتحريك"
          >
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span>نافذة عائمة</span>
          </button>

          {/* Interactive Landscape Mode Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const next = !isLandscapeLayout;
              setIsLandscapeLayout(next);
              saveExtendedSetupSettings({ landscapeAzanScreenEnabled: next });
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl backdrop-blur-md border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isLandscapeLayout
                ? 'bg-amber-400/25 border-amber-300 text-amber-200'
                : 'bg-white/15 hover:bg-white/25 border-white/25 text-white/90'
            }`}
            title="تبديل شاشة الأذان التفاعلية بين الوضع الأفقي والعمودي"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">
              {isLandscapeLayout ? 'الوضع الأفقي نشط' : 'الوضع الأفقي'}
            </span>
          </button>

          {/* Two Opposite Arrows Button — Minimizes widget to ongoing notification in shade */}
          <button
            type="button"
            onClick={handleClickMinimizeToNotification}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-amber-300/40 text-white transition-all cursor-pointer active:scale-95 shadow-lg"
            title="تصغير الويدجت وتحويله إلى إشعار مستمر داخل ستارة الإشعارات"
          >
            <Minimize2 className="w-4 h-4 text-amber-300" />
            <div className="text-right">
              <span className="text-xs font-black block leading-tight">تصغير</span>
              <span className="text-[9.5px] text-amber-200/90 block">
                استمرار بالخلفية
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Center Spiritual Header («الله أكبر») & Animated Circular Iqama Countdown */}
      <div
        className={`relative z-20 flex-1 flex ${
          isLandscapeLayout
            ? 'flex-row items-center justify-around gap-6 max-w-4xl mx-auto w-full px-6'
            : 'flex-col items-center justify-center px-4'
        } text-center my-auto`}
      >
        <div
          className={
            isLandscapeLayout ? 'flex-1 text-right space-y-2' : 'flex flex-col items-center'
          }
        >
          {/* Mosque Badge & City */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-amber-300/30 text-amber-200 text-xs font-bold mb-2">
            <BellRing className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            <span>
              حان الآن موعد أذان {session.prayerName} • {session.cityName} ({session.azanTimeStr})
            </span>
            {getExtendedSetupSettings().wakeScreenOnAzanEnabled && (
              <span title="إضاءة الشاشة مفعلة" className="inline-flex items-center">
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              </span>
            )}
          </div>

          {/* Prominent Calligraphic «الله أكبر» */}
          <h1 className="text-4xl sm:text-6xl font-black font-quran text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-300 to-[#C5A059] drop-shadow-[0_4px_24px_rgba(197,160,89,0.55)] tracking-wide leading-tight mb-1">
            اللهُ أَكْبَرُ • صلاة {session.prayerName}
          </h1>
          <p className="text-xs sm:text-base font-quran text-emerald-100/90 font-bold mb-3">
            حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ
          </p>

          {isLandscapeLayout && (
            <div className="bg-black/35 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-right">
              <span className="text-[10px] font-bold text-amber-300 block mb-1">
                دعاء ما بعد الأذان (مَن قاله حلَّت له شفاعة النبي ﷺ):
              </span>
              <p className="text-xs font-quran text-white/95 leading-relaxed">
                «اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ»
              </p>
            </div>
          )}
        </div>

        {/* Animated Circular Countdown Timer to Iqama */}
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center shrink-0">
          <div className="absolute inset-2 rounded-full bg-emerald-950/55 backdrop-blur-md border border-amber-400/20 shadow-[0_0_50px_rgba(16,75,64,0.8)]" />

          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 210 210">
            <circle
              cx="105"
              cy="105"
              r={radius}
              stroke="rgba(255, 255, 255, 0.14)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="105"
              cy="105"
              r={radius}
              stroke="url(#smartIqamaGradient)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-linear"
            />
            <defs>
              <linearGradient id="smartIqamaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Countdown Digits & Status */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            {remainingSeconds > 0 ? (
              <>
                <span className="text-[11px] sm:text-xs font-bold text-amber-200/90 mb-1">
                  المتبقي على إقامة صلاة {session.prayerName}
                </span>
                <span
                  className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white tabular-nums drop-shadow-md"
                  dir="ltr"
                >
                  {formattedCountdown}
                </span>
                <span className="text-[10px] text-emerald-200/85 font-bold mt-1.5 bg-white/10 px-3 py-0.5 rounded-full">
                  مدة الانتظار: {session.iqamaDurationMinutes} دقيقة
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-9 h-9 text-emerald-400 mb-1 animate-bounce" />
                <span className="text-base sm:text-lg font-black font-quran text-amber-300">
                  قَدْ قَامَتِ الصَّلَاةُ
                </span>
                <span className="text-xs text-white/90 font-bold mt-1">
                  حان الآن موعد إقامة صلاة {session.prayerName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Spiritual Action Buttons: زر أذكار الصلاة + زرا القرآن والقبلة (Requirement 1) */}
        <div className="w-full max-w-md mx-auto mt-3 space-y-2">
          <button
            type="button"
            onClick={() => handleQuickAction(onOpenPrayerAzkar)}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#C5A059] via-[#D4B06A] to-[#B38E46] hover:opacity-95 text-[#071F1B] text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#071F1B]" />
            <span>أذكار الصلاة وما بعد السلام</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAction(onOpenQuran)}
              className="py-2.5 px-3 rounded-2xl bg-[#104B40]/90 hover:bg-[#104B40] border border-[#C5A059]/45 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>القرآن الكريم</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAction(onOpenQibla)}
              className="py-2.5 px-3 rounded-2xl bg-[#104B40]/90 hover:bg-[#104B40] border border-[#C5A059]/45 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>اتجاه القبلة</span>
            </button>
          </div>
        </div>

        {/* Prophetic Dua after Azan (Portrait Mode) */}
        {!isLandscapeLayout && (
          <div className="max-w-md mx-auto mt-3 bg-black/35 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-amber-300 block mb-0.5">
              دعاء ما بعد الأذان (مَن قاله حلَّت له شفاعة النبي ﷺ):
            </span>
            <p className="text-xs font-quran text-white/95 leading-relaxed">
              «اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ»
            </p>
          </div>
        )}
      </div>

      {/* Bottom Controls Footer */}
      <div className="relative z-20 w-full max-w-xl mx-auto px-4 pb-5 pt-2 flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={handleClickMinimizeToNotification}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#104B40] hover:bg-[#0B3D35] border border-emerald-400/30 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
        >
          <Minimize2 className="w-4 h-4 text-amber-300" />
          <span>تصغير مع استمرار عداد الإقامة</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.stopAudio();
            const bridge = getAndroidBridge();
            bridge?.cancelOngoingIqamaNotification?.();
            bridge?.hideFloatingAzanOverlay?.();
            onDismissSession();
          }}
          className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/85 text-xs font-bold cursor-pointer transition-all"
        >
          إنهاء وإغلاق
        </button>
      </div>
    </div>
  );
};
