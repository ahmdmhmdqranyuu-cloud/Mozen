import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  MapPin,
  Bell,
  Activity,
  Layers,
  BatteryCharging,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Settings,
  RefreshCw,
  Sparkles,
  Check,
} from 'lucide-react';
import { CityLocation } from '../../types';
import {
  ManagedPermissionKey,
  PERMISSIONS_STORAGE_KEY,
  EXTENDED_SETUP_SETTINGS_KEY,
  verifyAllPermissionsStatus,
  requestOrOpenSpecificPermission,
} from '../../utils/androidPermissionsManager';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstRunWelcome?: boolean;
  onCompleteFirstRun?: () => void;
  onUpdateCity?: (city: CityLocation) => void;
  focusedPermissionKey?: ManagedPermissionKey | null;
}

const FIRST_RUN_PERMS_DONE_KEY = 'moazen_first_run_permissions_seen_v1';

export function hasSeenFirstRunPermissions(): boolean {
  try {
    return localStorage.getItem(FIRST_RUN_PERMS_DONE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markFirstRunPermissionsSeen(): void {
  try {
    localStorage.setItem(FIRST_RUN_PERMS_DONE_KEY, 'true');
  } catch {
    // ignore
  }
}

export function resetFirstRunPermissionsState(): void {
  try {
    localStorage.removeItem(FIRST_RUN_PERMS_DONE_KEY);
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    localStorage.removeItem(EXTENDED_SETUP_SETTINGS_KEY);
  } catch {
    // ignore
  }
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  isFirstRunWelcome = false,
  onCompleteFirstRun,
  onUpdateCity,
  focusedPermissionKey = null,
}) => {
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(false);
  const [backgroundEnabled, setBackgroundEnabled] = useState<boolean>(false);
  const [batteryEnabled, setBatteryEnabled] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [exactAlarmEnabled, setExactAlarmEnabled] = useState<boolean>(false);
  const [lockScreenEnabled, setLockScreenEnabled] = useState<boolean>(false);

  const [detectedLocationText, setDetectedLocationText] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [activeExplanationId, setActiveExplanationId] = useState<string | null>(null);
  const [attemptedMap, setAttemptedMap] = useState<Record<string, boolean>>({});
  const [skippedMap, setSkippedMap] = useState<Record<string, boolean>>({});
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('');
  const [progressiveStepIdx, setProgressiveStepIdx] = useState<number>(0);

  /**
   * Re-checks all permissions automatically on open and whenever the user returns
   * from phone settings (visibilitychange, window focus, pageshow, androidPermissionsResume).
   */
  const checkAllPermissions = useCallback(async () => {
    const verified = await verifyAllPermissionsStatus();
    setLocationEnabled(verified.location);
    setOverlayEnabled(verified.overlay);
    setBackgroundEnabled(verified.background);
    setBatteryEnabled(verified.battery);
    setNotificationsEnabled(verified.notifications);
    setExactAlarmEnabled(verified.exact_alarm);
    setLockScreenEnabled(verified.lock_screen);

    setLastCheckedTime(
      new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    checkAllPermissions();

    if (focusedPermissionKey) {
      setActiveExplanationId(focusedPermissionKey);
    }

    const handleReturnFromSettings = () => {
      if (document.visibilityState === 'visible') {
        checkAllPermissions();
        setStatusBanner('تم التحقق تلقائياً من حالة الأذونات بعد العودة إلى التطبيق ✓');
        setTimeout(() => setStatusBanner(null), 3500);
      }
    };

    window.addEventListener('focus', handleReturnFromSettings);
    window.addEventListener('pageshow', handleReturnFromSettings);
    window.addEventListener('androidPermissionsResume', handleReturnFromSettings);
    document.addEventListener('visibilitychange', handleReturnFromSettings);

    return () => {
      window.removeEventListener('focus', handleReturnFromSettings);
      window.removeEventListener('pageshow', handleReturnFromSettings);
      window.removeEventListener('androidPermissionsResume', handleReturnFromSettings);
      document.removeEventListener('visibilitychange', handleReturnFromSettings);
    };
  }, [isOpen, checkAllPermissions, focusedPermissionKey]);

  if (!isOpen) return null;

  const executeDirectPermissionFlow = async (permKey: ManagedPermissionKey) => {
    if (permKey === 'location') {
      setLoadingLocation(true);
      setDetectedLocationText(null);
    }
    setAttemptedMap((prev) => ({ ...prev, [permKey]: true }));
    setSkippedMap((prev) => ({ ...prev, [permKey]: false }));

    const res = await requestOrOpenSpecificPermission(permKey, {
      onLocationDetected: (exactCity, msg) => {
        onUpdateCity?.(exactCity);
        setDetectedLocationText(msg);
      },
    });

    if (permKey === 'location') {
      setLoadingLocation(false);
    }

    await checkAllPermissions();
    setActiveExplanationId(null);
    if (res.message) {
      setStatusBanner(res.message);
      setTimeout(() => setStatusBanner(null), 3500);
    }
  };

  const handleFinishOrSkip = () => {
    markFirstRunPermissionsSeen();
    if (onCompleteFirstRun) {
      onCompleteFirstRun();
    }
    onClose();
  };

  const permissionsList: Array<{
    id: ManagedPermissionKey;
    title: string;
    subtitle: string;
    whyNeeded: string;
    isEssential: boolean;
    enabled: boolean;
    icon: React.ComponentType<{ className?: string }>;
    actionLabel: string;
    onExecute: () => void;
  }> = [
    {
      id: 'location',
      title: 'إذن الوصول إلى الموقع الجغرافي الدقيق',
      subtitle: 'حساب مواقيت الصلاة الفلكية الدقيقة واتجاه القبلة حسب موقعك الحالي',
      whyNeeded:
        'يحتاج التطبيق إلى معرفة إحداثيات موقعك الجغرافي (خط الطول وخط العرض) ليتمكن من حساب مواقيت الصلاة الخمس وموعد الشروق والإمساك واتجاه الكعبة المشرفة بدقة تامة لمدينتك دون الحاجة للاتصال بالإنترنت.',
      isEssential: true,
      enabled: locationEnabled,
      icon: MapPin,
      actionLabel: loadingLocation
        ? 'جاري تحديد الموقع الدقيق...'
        : locationEnabled
        ? 'تم التفعيل ✓ • تحديث الموقع الدقيق'
        : 'فتح صفحة إذن الموقع الدقيق وتفعيله',
      onExecute: () => executeDirectPermissionFlow('location'),
    },
    {
      id: 'notifications',
      title: 'إذن الإشعارات والتنبيهات الصوتية',
      subtitle: 'إرسال إشعارات الأذان والإقامة والضحى وقيام الليل ومدفع رمضان',
      whyNeeded:
        'يُستخدم لعرض تنبيهات الصلاة والأذكار على شاشة القفل وشريط الإشعارات العلوي مع تشغيل الملف الصوتي المختار كاملاً.',
      isEssential: true,
      enabled: notificationsEnabled,
      icon: Bell,
      actionLabel: notificationsEnabled
        ? 'تم التفعيل ✓ • إعادة فحص الإشعارات'
        : 'فتح صفحة إشعارات التطبيق وتفعيلها',
      onExecute: () => executeDirectPermissionFlow('notifications'),
    },
    {
      id: 'overlay',
      title: 'إذن الظهور فوق التطبيقات الأخرى (SYSTEM_ALERT_WINDOW)',
      subtitle: 'عرض نافذة الأذان العائمة وعداد الإقامة فوق أي تطبيق عند حلول الوقت',
      whyNeeded:
        'يتيح هذا الإذن للتطبيق إظهار نافذة الأذان العائمة وتنبيه الإقامة على الشاشة حتى أثناء استخدامك لتطبيقات أخرى على الهاتف مع إمكانية تحريكها وتصغيرها.',
      isEssential: false,
      enabled: overlayEnabled,
      icon: Layers,
      actionLabel: overlayEnabled
        ? 'تم التفعيل ✓ • فتح إعدادات الظهور فوق التطبيقات'
        : 'فتح صفحة «الظهور فوق التطبيقات» مباشرة',
      onExecute: () => executeDirectPermissionFlow('overlay'),
    },
    {
      id: 'exact_alarm',
      title: 'إذن المنبهات الدقيقة (SCHEDULE_EXACT_ALARM)',
      subtitle: 'جدولة الأذان والنافذة العائمة في الدقيقة والثانية الصحيحة لمواقيت الصلاة',
      whyNeeded:
        'مطلوب في أنظمة أندرويد 12 فما فوق لضمان انطلاق الأذان والنافذة العائمة في وقت الصلاة الدقيق دون تأخير حتى عند إغلاق التطبيق.',
      isEssential: true,
      enabled: exactAlarmEnabled,
      icon: Activity,
      actionLabel: exactAlarmEnabled
        ? 'تم التفعيل ✓ • فتح إعدادات المنبهات الدقيقة'
        : 'فتح صفحة «المنبهات الدقيقة» مباشرة',
      onExecute: () => executeDirectPermissionFlow('exact_alarm'),
    },
    {
      id: 'lock_screen',
      title: 'إذن الظهور على شاشة القفل وإضاءة الشاشة (Full Screen Intent)',
      subtitle: 'عرض واجهة الأذان وعداد الإقامة وإضاءة الشاشة عند قفل الهاتف',
      whyNeeded:
        'يسمح بعرض واجهة الأذان التفاعلية وأزرار أذكار الصلاة والقرآن والقبلة وإضاءة الشاشة تلقائيًا عند دخول وقت الصلاة حتى لو كانت الشاشة مغلقة.',
      isEssential: false,
      enabled: lockScreenEnabled,
      icon: Sparkles,
      actionLabel: lockScreenEnabled
        ? 'تم التفعيل ✓ • فتح إعدادات الظهور على شاشة القفل'
        : 'فتح إعدادات «الظهور على شاشة القفل» مباشرة',
      onExecute: () => executeDirectPermissionFlow('lock_screen'),
    },
    {
      id: 'battery',
      title: 'إذن استثناء التطبيق من قيود توفير الطاقة وتحسين البطارية',
      subtitle: 'منع نظام أندرويد من إيقاف مؤقتات الأذان أثناء وضع توفير البطارية',
      whyNeeded:
        'تقوم بعض الهواتف بإيقاف التطبيقات في الخلفية لتوفير الطاقة مما قد يؤخر صوت الأذان. استثناء تطبيق المؤذن من قيود البطارية يضمن انطلاق الأذان الكامل في ثوانيه الأولى دون أي تأخير.',
      isEssential: false,
      enabled: batteryEnabled,
      icon: BatteryCharging,
      actionLabel: batteryEnabled
        ? 'تم التفعيل ✓ • فتح صفحة استثناء البطارية'
        : 'فتح صفحة «استثناء تحسينات البطارية» مباشرة',
      onExecute: () => executeDirectPermissionFlow('battery'),
    },
    {
      id: 'background',
      title: 'إذن العمل والتشغيل في الخلفية',
      subtitle: 'استمرار عمل مؤقتات الأذان والإقامة والإشعار الدائم عند إغلاق التطبيق',
      whyNeeded:
        'يضمن هذا الإذن بقاء جدولة مواقيت الصلاة والأذان الكامل والإقامة والإشعار الدائم نشطة في خلفية الهاتف حتى بعد إغلاق واجهة التطبيق أو قفل الشاشة.',
      isEssential: true,
      enabled: backgroundEnabled,
      icon: Activity,
      actionLabel: backgroundEnabled
        ? 'تم التفعيل ✓ • تحديث العمل في الخلفية'
        : 'تفعيل العمل في الخلفية مباشرة',
      onExecute: () => executeDirectPermissionFlow('background'),
    },
  ];

  const enabledCount = permissionsList.filter((p) => p.enabled).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col select-none animate-fadeIn overflow-x-hidden">
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col bg-[#FAF9F5] overflow-x-hidden">
        {/* Clean White Header */}
        <div className="bg-white text-[#172A28] p-4 flex items-center justify-between border-b border-gray-100 shadow-xs shrink-0">
          <button
            onClick={handleFinishOrSkip}
            className="flex items-center gap-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-[#172A28] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>{isFirstRunWelcome ? 'تخطي واستكمال لاحقاً' : 'رجوع'}</span>
          </button>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#104B40]" />
            <h2 className="text-sm sm:text-base font-black font-quran text-[#172A28]">
              {isFirstRunWelcome
                ? 'مرحباً بك • إعداد أذونات التطبيق'
                : 'إدارة جميع الأذونات والصلاحيات'}
            </h2>
          </div>

          <button
            onClick={() => {
              checkAllPermissions();
              setStatusBanner('تم فحص وتحديث حالة جميع الأذونات تلقائياً بنجاح ✓');
              setTimeout(() => setStatusBanner(null), 2500);
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-[#104B40] transition-colors cursor-pointer"
            title="إعادة فحص حالة الأذونات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Update Banner */}
        {statusBanner && (
          <div className="bg-[#104B40] text-white text-xs font-bold py-2 px-4 text-center animate-fadeIn shrink-0">
            {statusBanner}
          </div>
        )}

        {/* Detected GPS Location Banner */}
        {detectedLocationText && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-950 text-xs font-bold py-2 px-4 text-center animate-fadeIn shrink-0">
            {detectedLocationText}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 space-y-3">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5 text-right">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-[#104B40]">
                المفعّل حالياً: {enabledCount} من {permissionsList.length}
              </span>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-[#172A28]">
                  إدارة الأذونات المباشرة (توافق كامل مع أندرويد)
                </h3>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              عند الضغط على منح أي إذن، ينقلك التطبيق <strong className="text-[#104B40]">مباشرة إلى صفحة الإذن المطلوبة</strong> دون توجيهك إلى الصفحة الرئيسية لإعدادات الهاتف، مع التحقق التلقائي من حالة الإذن فور عودتك للتطبيق.
            </p>

            {/* Progressive Step-by-Step Permission Guide Bar */}
            <div className="bg-[#FAF8F2] border border-[#C5A059]/35 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black text-[#104B40]">
                  الخطوة التدريجية {Math.min(progressiveStepIdx + 1, permissionsList.length)} من{' '}
                  {permissionsList.length}: {permissionsList[progressiveStepIdx]?.title}
                </span>
                <div className="flex items-center gap-1">
                  {permissionsList.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProgressiveStepIdx(i)}
                      className={`w-5 h-1.5 rounded-full transition-all cursor-pointer ${
                        p.enabled
                          ? 'bg-emerald-600'
                          : i === progressiveStepIdx
                          ? 'bg-[#C5A059]'
                          : 'bg-gray-200'
                      }`}
                      title={p.title}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {permissionsList[progressiveStepIdx]?.whyNeeded}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const currentPerm = permissionsList[progressiveStepIdx];
                    if (currentPerm) {
                      currentPerm.onExecute();
                    }
                    if (progressiveStepIdx < permissionsList.length - 1) {
                      setProgressiveStepIdx((s) => s + 1);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {permissionsList[progressiveStepIdx]?.enabled
                      ? 'تم التفعيل ✓ • الانتقال للصلاحية التالية'
                      : 'منح الإذن مباشرة ثم التالي'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentPerm = permissionsList[progressiveStepIdx];
                    if (currentPerm) {
                      setSkippedMap((prev) => ({ ...prev, [currentPerm.id]: true }));
                    }
                    if (progressiveStepIdx < permissionsList.length - 1) {
                      setProgressiveStepIdx((s) => s + 1);
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold cursor-pointer"
                >
                  تخطي
                </button>
              </div>
            </div>

            {lastCheckedTime && (
              <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1 pt-1">
                <span>آخر فحص تلقائي لحالة الأذونات: {lastCheckedTime}</span>
              </div>
            )}
          </div>

          {/* Permissions Cards List */}
          {permissionsList.map((perm, idx) => {
            const Icon = perm.icon;
            const isConfirmingExplanation = activeExplanationId === perm.id;
            const wasAttempted = attemptedMap[perm.id];
            const wasSkipped = skippedMap[perm.id];

            return (
              <div
                key={perm.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3 text-right transition-all"
              >
                {/* Header Row: Title, Icon & Current Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="shrink-0">
                    {perm.enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تم التفعيل ✓</span>
                      </span>
                    ) : wasSkipped ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                        <span>تم التخطي</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>غير مفعّل</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div>
                      <div className="flex items-center justify-end gap-1.5">
                        {!perm.isEssential && (
                          <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                            اختياري
                          </span>
                        )}
                        <h4 className="text-xs sm:text-sm font-black text-[#172A28]">
                          {idx + 1}. {perm.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{perm.subtitle}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-[#104B40] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Benefit Explanation Box before directing to phone settings */}
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 text-[11px] text-gray-700 leading-relaxed">
                  <span className="font-black text-[#104B40] block mb-0.5">
                    فائدة هذا الإذن ولماذا نحتاجه:
                  </span>
                  {perm.whyNeeded}
                </div>

                {/* Official Request / Retry / Skip Step */}
                {isConfirmingExplanation ? (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2.5 animate-fadeIn">
                    <p className="text-xs font-bold text-amber-950">
                      سيتم نقلك مباشرة إلى صفحة «{perm.title}» لتفعيلها، ثم التحقق تلقائياً فور عودتك للتطبيق:
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={perm.onExecute}
                        className="flex-1 bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs font-black py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-4 h-4 text-[#C5A059]" />
                        <span>منح الإذن (فتح الصفحة مباشرة)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSkippedMap((prev) => ({ ...prev, [perm.id]: true }));
                          setActiveExplanationId(null);
                        }}
                        className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold py-2.5 px-3.5 rounded-xl cursor-pointer"
                      >
                        تخطي
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!perm.enabled && !wasAttempted) {
                          setActiveExplanationId(perm.id);
                        } else {
                          perm.onExecute();
                        }
                      }}
                      className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
                        perm.enabled
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-[#104B40] hover:bg-[#0B3D35] text-white'
                      }`}
                    >
                      {perm.enabled ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Settings className="w-4 h-4 text-[#C5A059]" />
                      )}
                      <span>
                        {!perm.enabled && wasAttempted
                          ? 'إعادة المحاولة (فتح صفحة الإذن مباشرة)'
                          : perm.actionLabel}
                      </span>
                    </button>

                    {!perm.enabled && wasAttempted && (
                      <button
                        type="button"
                        onClick={() =>
                          setSkippedMap((prev) => ({ ...prev, [perm.id]: true }))
                        }
                        className="py-2.5 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer shrink-0"
                      >
                        تخطي
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom Save & Return Button */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
            <button
              type="button"
              onClick={handleFinishOrSkip}
              className="w-full py-3 rounded-xl bg-[#104B40] hover:bg-[#0B3D35] text-white text-xs sm:text-sm font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>حفظ والعودة إلى التطبيق</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
