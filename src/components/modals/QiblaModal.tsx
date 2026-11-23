import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  RotateCw,
  MapPin,
  CheckCircle,
  ChevronRight,
  Map,
  Wifi,
  WifiOff,
  Trash2,
  Navigation2,
  Info,
} from 'lucide-react';
import { CityLocation } from '../../types';
import {
  offlineMapManager,
  KAABA_COORDINATES,
  QiblaMathResult,
} from '../../utils/offlineMapManager';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: CityLocation;
}

export const QiblaModal: React.FC<QiblaModalProps> = ({
  isOpen,
  onClose,
  city,
}) => {
  const [activeTab, setActiveTab] = useState<'compass' | 'map'>('compass');
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState(false);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(() => offlineMapManager.isOnline());
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  // 100% Offline Qibla spherical mathematical calculation
  const qiblaInfo: QiblaMathResult = offlineMapManager.calculateQiblaOffline(
    city.latitude,
    city.longitude
  );
  const targetAngle = qiblaInfo.angle; // e.g., 136° for Cairo

  // Current effective heading
  const currentHeading = hasCompassSensor ? deviceHeading : manualHeading;
  // Kaaba needle relative angle to compass top
  const needleRotation = (targetAngle - currentHeading + 360) % 360;
  // Is aligned within 4 degrees?
  const isAligned = Math.abs(needleRotation) <= 4 || Math.abs(needleRotation - 360) <= 4;

  useEffect(() => {
    return offlineMapManager.subscribeNetwork(setIsOnline);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (heading === undefined && e.alpha !== null) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== undefined && heading !== null) {
        setDeviceHeading(Math.round(heading));
        setHasCompassSensor(true);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen]);

  const handleClearTileCache = async () => {
    setClearingCache(true);
    await offlineMapManager.clearMapTileCache();
    setClearingCache(false);
    setCacheMessage('✓ تم تنظيف ذاكرة الخرائط المؤقتة بنجاح');
    setTimeout(() => setCacheMessage(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 muslim-plus-canvas flex flex-col overflow-hidden select-none animate-fadeIn" dir="rtl">
      <div className="relative z-10 w-full h-full max-w-md mx-auto flex flex-col overflow-hidden">
        {/* Unified Muslim Plus Cream-Ivory Header */}
        <div className="moazen-widget text-[#172A28] px-4 pt-5 pb-3.5 flex items-center justify-between shadow-sm border-b border-[#D6C18D] shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#F6EEDC] hover:bg-[#EDE2C8] border border-[#D6C18D] flex items-center justify-center text-[#104B40] transition-colors cursor-pointer"
              aria-label="رجوع"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#104B40]">
                تحديد اتجاه القبلة
              </h2>
              <p className="text-[11px] text-[#4B5B58] font-sans">
                {city.name} ({city.country}) • حساب فلكي دقيق 100% دون إنترنت
              </p>
            </div>
          </div>

          {/* Network indicator pill */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isOnline
                ? 'bg-[#F6EEDC] text-[#104B40] border-[#D6C18D]'
                : 'bg-[#EDE2C8] text-[#9A7732] border-[#C5A059]/60'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-[#104B40]" />
                <span>متصل</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-[#9A7732]" />
                <span>أوفلاين</span>
              </>
            )}
          </div>
        </div>

        {/* View Mode Tabs: Compass vs Interactive Map */}
        <div className="px-4 pt-2.5 pb-1 shrink-0">
          <div className="moazen-widget grid grid-cols-2 gap-2 p-1 rounded-xl border border-[#D6C18D]">
            <button
              type="button"
              onClick={() => setActiveTab('compass')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'compass'
                  ? 'bg-[#104B40] text-white shadow-xs'
                  : 'text-[#4B5B58] hover:text-[#104B40]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>البوصلة الفلكية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'map'
                  ? 'bg-[#104B40] text-white shadow-xs'
                  : 'text-[#4B5B58] hover:text-[#104B40]'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>خريطة القبلة والمسار</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
          {activeTab === 'compass' ? (
            /* COMPASS VIEW */
            <div className="flex-1 flex flex-col items-center justify-between">
              {/* Top Location and Angle summary */}
              <div className="moazen-widget w-full rounded-2xl p-3 border border-[#D6C18D] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#172A28]">
                  <MapPin className="w-4 h-4 text-[#9A7732]" />
                  <span className="font-bold">{city.name} - {city.country}</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-[11px] text-[#4B5B58]">زاوية القبلة: </span>
                  <strong className="text-sm font-sans text-[#104B40]">{targetAngle}°</strong>
                  <span className="text-[10px] text-[#9A7732] mr-1">({qiblaInfo.compassDirection})</span>
                </div>
              </div>

              {/* Compass Dial */}
              <div className="relative my-4 flex flex-col items-center">
                {/* Status Indicator Pill */}
                <div
                  className={`mb-3 px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isAligned
                      ? 'bg-[#104B40] text-white border-[#C5A059] shadow-lg animate-bounce'
                      : 'moazen-widget text-[#104B40] border-[#D6C18D]'
                  }`}
                >
                  {isAligned ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>أنت الآن في اتجاه القبلة تماماً!</span>
                    </>
                  ) : (
                    <span>قم بتدوير الهاتف حتى يتطابق المؤشر مع الكعبة</span>
                  )}
                </div>

                {/* Compass Outer Ring — Warm Cream + 3D Beveled Metallic Gold */}
                <div className="relative w-64 h-64 rounded-full p-3 shadow-[0_14px_30px_rgba(122,92,31,0.22),inset_0_2px_4px_rgba(255,255,255,0.85)] flex items-center justify-center bg-gradient-to-br from-[#EFE2BD] via-[#FAF1D8] to-[#DFC486] border-[3px] border-[#C59B3F]">
                  {/* Compass Rose dial */}
                  <div
                    className="relative w-full h-full rounded-full bg-[radial-gradient(circle_at_center,#FFFDF7_0%,#FBF4E0_64%,#EDE0BE_100%)] border border-[#D4B36A] shadow-[inset_0_2px_10px_rgba(138,104,35,0.16)] flex items-center justify-center transition-transform duration-300 ease-out"
                    style={{ transform: `rotate(${-currentHeading}deg)` }}
                  >
                    {/* Degree ticks */}
                    <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0">
                      {Array.from({ length: 72 }).map((_, i) => {
                        const deg = i * 5;
                        const rad = (deg * Math.PI) / 180;
                        const isMajor = deg % 30 === 0;
                        const r1 = 92;
                        const r2 = isMajor ? 80 : 86;
                        return (
                          <line
                            key={i}
                            x1={100 + r1 * Math.sin(rad)}
                            y1={100 - r1 * Math.cos(rad)}
                            x2={100 + r2 * Math.sin(rad)}
                            y2={100 - r2 * Math.cos(rad)}
                            stroke={isMajor ? '#9A7324' : '#104B40'}
                            strokeWidth={isMajor ? '2.2' : '1'}
                            opacity={isMajor ? 0.95 : 0.45}
                          />
                        );
                      })}
                    </svg>

                    {/* Cardinal directions */}
                    <span className="absolute top-3 font-extrabold text-rose-700 text-xs">N (شمال)</span>
                    <span className="absolute bottom-3 font-bold text-[#104B40] text-xs">S (جنوب)</span>
                    <span className="absolute right-3 font-bold text-[#104B40] text-xs">E (شرق)</span>
                    <span className="absolute left-3 font-bold text-[#104B40] text-xs">W (غرب)</span>

                    {/* Kaaba Marker at exact targetAngle */}
                    <div
                      className="absolute inset-0 flex items-start justify-center pointer-events-none"
                      style={{ transform: `rotate(${targetAngle}deg)` }}
                    >
                      <div className="mt-1 flex flex-col items-center">
                        <div className="w-7 h-7 bg-[#172A28] border-2 border-[#C59B3F] rounded-sm shadow-md flex flex-col items-center justify-center">
                          <div className="w-full h-1 bg-[#E5C15C] my-0.5" />
                          <div className="w-2 h-2.5 bg-[#E5C15C] rounded-xs" />
                        </div>
                        <span className="text-[9px] font-extrabold text-[#104B40] bg-[#FFFDF7]/90 px-1 rounded mt-0.5 shadow-2xs">
                          الكعبة
                        </span>
                      </div>
                    </div>

                    {/* Center Pivot Point */}
                    <div className="w-12 h-12 rounded-full bg-[#C59B3F]/20 border border-[#C59B3F]/75 flex items-center justify-center shadow-inner">
                      <div className="w-4 h-4 rounded-full bg-[#104B40] border-2 border-[#E5C15C] shadow-md" />
                    </div>
                  </div>
                </div>

                {/* Current heading text */}
                <div className="mt-3 text-center">
                  <span className="text-xs text-[#4B5B58]">الاتجاه الحالي للهاتف: </span>
                  <strong className="text-sm font-sans text-[#104B40]">{currentHeading}°</strong>
                </div>

                {/* Manual test slider if no sensor available */}
                {!hasCompassSensor && (
                  <div className="mt-2.5 w-64 moazen-widget border border-[#D6C18D] p-2 rounded-xl text-center">
                    <span className="text-[10px] text-[#4B5B58] font-bold block mb-1">
                      تدوير تجريبي للبوصلة:
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="359"
                      value={manualHeading}
                      onChange={(e) => setManualHeading(Number(e.target.value))}
                      className="w-full accent-[#104B40]"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Distance & Tips */}
              <div className="moazen-widget w-full p-3.5 rounded-2xl border border-[#D6C18D] text-right space-y-1 mt-auto">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#4B5B58]">المسافة إلى المسجد الحرام:</span>
                  <strong className="text-[#104B40] font-sans">
                    {qiblaInfo.distanceKm.toLocaleString()} كم
                  </strong>
                </div>
                <p className="text-[10px] text-[#4B5B58] leading-relaxed mt-1">
                  ملاحظة: ضع الهاتف على سطح مستوٍ وأبعده عن المعادن أو الأجهزة المغناطيسية لأعلى دقة.
                </p>
              </div>
            </div>
          ) : (
            /* INTERACTIVE QIBLA MAP & GEODESIC TRAJECTORY VIEW */
            <div className="flex-1 flex flex-col space-y-3">
              {/* Honest Offline Notice Banner */}
              <div className="moazen-widget-sub p-2.5 rounded-xl border border-[#D6C18D] text-[#172A28] text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-[#9A7732] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <span className="font-bold text-[#104B40] block">
                    {isOnline
                      ? 'الخريطة متصلة: يتم تخزين المناطق التي تتصفحها تلقائياً للعمل أوفلاين'
                      : 'أنت في وضع عدم الاتصال: يتم عرض الخرائط والبيانات المخزنة مسبقاً'}
                  </span>
                  <span className="text-[#4B5B58] text-[10px] block">
                    * ملاحظة أمانة: المناطق المحفوظة مسبقاً تعمل دون إنترنت، أما تحميل مناطق جديدة حول العالم فيتطلب اتصالاً.
                  </span>
                </div>
              </div>

              {/* Interactive Vector / Tile Offline Map Canvas */}
              <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#D6C18D] bg-[#F6EEDC] shadow-inner flex items-center justify-center">
                {/* SVG Geodesic Map Overlay with User & Kaaba */}
                <svg viewBox="0 0 400 300" className="w-full h-full absolute inset-0">
                  {/* Unified creamy regional map background */}
                  <rect width="400" height="300" fill="#F2EAD4" />
                  <path
                    d="M 50,60 Q 120,40 180,80 T 260,110 T 350,90 L 370,220 Q 280,240 200,210 T 80,230 Z"
                    fill="#E7DEC4"
                    stroke="#D6C18D"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 170,110 Q 230,130 250,190 T 230,260 L 190,260 Q 180,200 160,150 Z"
                    fill="#DFD3B4"
                    stroke="#C5A059"
                    strokeWidth="1"
                  />

                  {/* Red Sea & Gulf Water bodies */}
                  <path
                    d="M 160,130 Q 175,170 190,220 Q 185,240 180,260"
                    stroke="#a5c4d4"
                    strokeWidth="7"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Geodesic Flight Trajectory to Kaaba (Golden Arc) */}
                  <path
                    d="M 110,120 Q 170,140 215,200"
                    fill="none"
                    stroke="#C5A059"
                    strokeWidth="3.5"
                    strokeDasharray="6,4"
                    className="animate-pulse"
                  />

                  {/* User Location Pin */}
                  <g transform="translate(110, 120)">
                    <circle r="14" fill="#104B40" fillOpacity="0.2" className="animate-ping" />
                    <circle r="8" fill="#104B40" stroke="#FAF8F5" strokeWidth="2" />
                    <text
                      x="0"
                      y="-14"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#104B40"
                    >
                      {city.name}
                    </text>
                  </g>

                  {/* Holy Kaaba Destination Pin */}
                  <g transform="translate(215, 200)">
                    <circle r="16" fill="#C5A059" fillOpacity="0.25" className="animate-pulse" />
                    <rect
                      x="-8"
                      y="-8"
                      width="16"
                      height="16"
                      fill="#172A28"
                      stroke="#C5A059"
                      strokeWidth="2"
                      rx="2"
                    />
                    <line x1="-8" y1="-3" x2="8" y2="-3" stroke="#C5A059" strokeWidth="1.5" />
                    <text
                      x="0"
                      y="18"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="black"
                      fill="#855B14"
                    >
                      الكعبة المشرفة
                    </text>
                  </g>
                </svg>

                {/* Floating trajectory info overlay card */}
                <div className="moazen-widget absolute bottom-2 left-2 right-2 backdrop-blur-xs p-2.5 rounded-xl border border-[#D6C18D] text-xs flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] text-[#4B5B58] block">خط المسار المكي المباشر:</span>
                    <strong className="text-[#104B40] font-black">
                      {city.name} ➔ المسجد الحرام
                    </strong>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-[#104B40] font-bold block">{qiblaInfo.distanceKm} كم</span>
                    <span className="text-[10px] text-[#9A7732] font-sans">زاوية {targetAngle}°</span>
                  </div>
                </div>
              </div>

              {/* Offline Map Cache Management Actions */}
              <div className="moazen-widget p-3 rounded-2xl border border-[#D6C18D] shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-[#104B40]">إدارة التخزين المؤقت للخرائط</h5>
                    <p className="text-[10px] text-[#4B5B58]">
                      يتم حفظ بلاطات الخرائط في ذاكرة الهاتف لتوفير البيانات والعمل أوفلاين
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearTileCache}
                    disabled={clearingCache}
                    className="px-2.5 py-1.5 rounded-xl bg-[#EDE2C8] hover:bg-[#D6C18D]/40 border border-[#D6C18D] text-[#104B40] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{clearingCache ? 'جاري التنظيف...' : 'تنظيف الذاكرة'}</span>
                  </button>
                </div>
                {cacheMessage && (
                  <p className="text-[10px] text-[#104B40] font-bold">{cacheMessage}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
