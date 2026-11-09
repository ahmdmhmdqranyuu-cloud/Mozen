import React, { useState, useEffect } from 'react';
import { X, Compass, RotateCw, MapPin, CheckCircle, ChevronRight } from 'lucide-react';
import { CityLocation } from '../../types';
import { calculateQiblaDirection } from '../../utils/prayerTimes';

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
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState(false);
  const [manualHeading, setManualHeading] = useState<number>(0);

  const qiblaInfo = calculateQiblaDirection(city.latitude, city.longitude);
  const targetAngle = qiblaInfo.angle; // e.g., 136° for Cairo

  // Current effective heading
  const currentHeading = hasCompassSensor ? deviceHeading : manualHeading;
  // Kaaba needle relative angle to compass top
  const needleRotation = (targetAngle - currentHeading + 360) % 360;
  // Is aligned within 4 degrees?
  const isAligned = Math.abs(needleRotation) <= 4 || Math.abs(needleRotation - 360) <= 4;

  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading for iOS, or alpha for Android
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

  if (!isOpen) return null;

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
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">تحديد اتجاه القبلة</h2>
              <p className="text-[11px] text-gray-500">{city.name} - {city.country}</p>
            </div>
          </div>
          <Compass className="w-5 h-5 text-[#C5A059]" />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-between">
          {/* Top Location and Angle summary */}
          <div className="w-full bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span className="font-bold">{city.name} - {city.country}</span>
            </div>
            <div className="text-left">
              <span className="text-[11px] text-gray-500">زاوية القبلة: </span>
              <strong className="text-sm font-sans text-emerald-800">{targetAngle}°</strong>
            </div>
          </div>

          {/* Compass Dial */}
          <div className="relative my-6 flex flex-col items-center">
            {/* Status Indicator Pill */}
            <div
              className={`mb-4 px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAligned
                  ? 'bg-emerald-600 text-white shadow-lg animate-bounce'
                  : 'bg-amber-100 text-amber-900'
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

            {/* Compass Outer Ring */}
            <div className="relative w-64 h-64 rounded-full bg-gradient-to-b from-[#1b4332] to-[#0d2818] p-3 shadow-2xl flex items-center justify-center border-4 border-amber-300/40">
              {/* Compass Rose dial */}
              <div 
                className="relative w-full h-full rounded-full bg-[#132e22] flex items-center justify-center transition-transform duration-300 ease-out"
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
                        stroke={isMajor ? '#f59e0b' : '#34d399'}
                        strokeWidth={isMajor ? '2' : '1'}
                        opacity={isMajor ? 0.9 : 0.4}
                      />
                    );
                  })}
                </svg>

                {/* Cardinal directions */}
                <span className="absolute top-3 font-bold text-rose-500 text-sm">N (شمال)</span>
                <span className="absolute bottom-3 font-bold text-white text-xs">S (جنوب)</span>
                <span className="absolute right-3 font-bold text-white text-xs">E (شرق)</span>
                <span className="absolute left-3 font-bold text-white text-xs">W (غرب)</span>

                {/* Kaaba Marker at exact targetAngle */}
                <div
                  className="absolute inset-0 flex items-start justify-center pointer-events-none"
                  style={{ transform: `rotate(${targetAngle}deg)` }}
                >
                  <div className="mt-1 flex flex-col items-center">
                    {/* Golden Kaaba Cube Graphic */}
                    <div className="w-7 h-7 bg-black border-2 border-amber-400 rounded-sm shadow-md flex flex-col items-center justify-center">
                      <div className="w-full h-1 bg-amber-400 my-0.5" />
                      <div className="w-2 h-2.5 bg-amber-300 rounded-xs" />
                    </div>
                    <span className="text-[9px] font-extrabold text-amber-300 mt-0.5 drop-shadow">
                      الكعبة
                    </span>
                  </div>
                </div>

                {/* Center Pivot Point */}
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-amber-400 shadow-md" />
                </div>
              </div>
            </div>

            {/* Current heading text */}
            <div className="mt-4 text-center">
              <span className="text-xs text-gray-500">الاتجاه الحالي للهاتف: </span>
              <strong className="text-sm font-sans text-gray-800">{currentHeading}°</strong>
            </div>

            {/* Manual test slider if no sensor available (e.g. desktop) */}
            {!hasCompassSensor && (
              <div className="mt-3 w-64 bg-gray-100 p-2 rounded-xl text-center">
                <span className="text-[10px] text-gray-500 block mb-1">
                  تدوير تجريبي للبوصلة (حاسوب):
                </span>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={manualHeading}
                  onChange={(e) => setManualHeading(Number(e.target.value))}
                  className="w-full accent-emerald-700"
                />
              </div>
            )}
          </div>

          {/* Bottom Distance & Tips */}
          <div className="w-full bg-[#faeee1]/70 p-3.5 rounded-2xl border border-amber-900/10 text-right space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">المسافة إلى المسجد الحرام:</span>
              <strong className="text-emerald-900 font-sans">{qiblaInfo.distanceKm.toLocaleString()} كم</strong>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
              ملاحظة: ضع الهاتف على سطح مستوٍ وأبعده عن المعادن أو الأجهزة المغناطيسية للحصول على أدق قراءة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
