import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Star,
  Search,
  Check,
  ChevronRight,
  Wifi,
  WifiOff,
  Map,
  List,
  RefreshCw,
  Info,
} from 'lucide-react';
import { MosqueItem } from '../../types';
import { offlineMapManager } from '../../utils/offlineMapManager';

interface MasajidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasajidModal: React.FC<MasajidModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'jumua' | 'women'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [navigatingMosque, setNavigatingMosque] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => offlineMapManager.isOnline());
  const [mosques, setMosques] = useState<MosqueItem[]>(() =>
    offlineMapManager.getCachedMosques()
  );

  useEffect(() => {
    const unsubNet = offlineMapManager.subscribeNetwork(setIsOnline);
    const unsubMosques = offlineMapManager.subscribeMosques(setMosques);
    return () => {
      unsubNet();
      unsubMosques();
    };
  }, []);

  if (!isOpen) return null;

  const filteredMosques = mosques.filter((m) => {
    const matchesSearch =
      m.name.includes(searchQuery.trim()) || m.address.includes(searchQuery.trim());
    if (!matchesSearch) return false;
    if (activeFilter === 'jumua') return m.hasJumua;
    if (activeFilter === 'women') return m.hasWomenSection;
    return true;
  });

  const handleStartNavigation = (id: string, name: string) => {
    setNavigatingMosque(name);
    setTimeout(() => setNavigatingMosque(null), 3500);
  };

  const handleManualRefresh = () => {
    offlineMapManager.autoSyncWhenOnline();
    setMosques(offlineMapManager.getCachedMosques());
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fcfbf7] flex flex-col overflow-hidden select-none animate-fadeIn" dir="rtl">
      <div className="w-full h-full max-w-md mx-auto flex flex-col overflow-hidden bg-[#fcfbf7] relative">
        {/* Clean White Header */}
        <div className="bg-white text-[#172A28] px-4 pt-5 pb-3.5 flex items-center justify-between shadow-sm border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
              aria-label="رجوع"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">
                المساجد ومصليات الجمعة
              </h2>
              <p className="text-[11px] text-gray-500 font-sans">
                دليل المساجد القريبة • حفظ تلقائي للعمل دون إنترنت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Network Badge */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span>متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-700" />
                  <span>أوفلاين</span>
                </>
              )}
            </div>

            {/* View Mode Toggle: List vs Map */}
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'list' ? 'map' : 'list'))}
              className="p-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 border border-gray-200 text-gray-700 cursor-pointer"
              title={viewMode === 'list' ? 'عرض الخريطة' : 'عرض القائمة'}
            >
              {viewMode === 'list' ? (
                <Map className="w-4 h-4 text-[#104B40]" />
              ) : (
                <List className="w-4 h-4 text-[#104B40]" />
              )}
            </button>
          </div>
        </div>

        {/* Offline Disclaimer Banner */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2 shrink-0">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <span>
            {isOnline
              ? 'يتم تخزين بيانات المساجد والخرائط تلقائياً لتكون متاحة عند انقطاع الإنترنت.'
              : 'الوضع دون إنترنت: يتم عرض المساجد المحفوظة محلياً؛ والبحث عن مساجد جديدة يتطلب اتصالاً.'}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Search & Filters */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث في المساجد المحفوظة محلياً..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 text-xs bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-600 shadow-xs"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'all'
                      ? 'bg-[#104b3a] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  الكل ({mosques.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('jumua')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'jumua'
                      ? 'bg-[#104b3a] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  صلاة الجمعة
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('women')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'women'
                      ? 'bg-[#104b3a] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  مصلى نساء
                </button>
              </div>

              {isOnline && (
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="p-1 rounded-lg text-gray-500 hover:text-emerald-800"
                  title="تحديث البيانات"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation notification banner */}
          {navigatingMosque && (
            <div className="mb-3 p-3 bg-emerald-600 text-white rounded-2xl text-xs flex items-center justify-between animate-fadeIn shadow-md">
              <span className="font-bold">
                جاري توجيهك إلى {navigatingMosque} (أقصر طريق سيراً)...
              </span>
              <Check className="w-4 h-4" />
            </div>
          )}

          {viewMode === 'map' ? (
            /* INTERACTIVE MOSQUES OFFLINE MAP VIEW */
            <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
              <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-gray-200 bg-[#ede8df] shadow-inner flex items-center justify-center">
                {/* SVG Offline Map with Mosque Markers */}
                <svg viewBox="0 0 400 320" className="w-full h-full absolute inset-0">
                  <rect width="400" height="320" fill="#ede8df" />
                  {/* Roads grid representation */}
                  <line x1="0" y1="80" x2="400" y2="80" stroke="#dcd4c3" strokeWidth="4" />
                  <line x1="0" y1="160" x2="400" y2="160" stroke="#dcd4c3" strokeWidth="6" />
                  <line x1="0" y1="240" x2="400" y2="240" stroke="#dcd4c3" strokeWidth="4" />
                  <line x1="100" y1="0" x2="100" y2="320" stroke="#dcd4c3" strokeWidth="4" />
                  <line x1="200" y1="0" x2="200" y2="320" stroke="#dcd4c3" strokeWidth="7" />
                  <line x1="300" y1="0" x2="300" y2="320" stroke="#dcd4c3" strokeWidth="4" />

                  {/* User Pin at Center */}
                  <g transform="translate(200, 160)">
                    <circle r="16" fill="#104B40" fillOpacity="0.2" className="animate-ping" />
                    <circle r="7" fill="#104B40" stroke="#FAF8F5" strokeWidth="2" />
                    <text x="0" y="-12" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#104B40">
                      موقعك الحالي
                    </text>
                  </g>

                  {/* Dynamic Mosque Pins */}
                  {filteredMosques.slice(0, 6).map((m, idx) => {
                    const positions = [
                      { x: 130, y: 110 },
                      { x: 260, y: 100 },
                      { x: 140, y: 220 },
                      { x: 270, y: 230 },
                      { x: 90, y: 170 },
                      { x: 310, y: 170 },
                    ];
                    const pos = positions[idx] || { x: 100 + idx * 30, y: 80 + idx * 30 };
                    return (
                      <g
                        key={m.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer"
                        onClick={() => handleStartNavigation(m.id, m.name)}
                      >
                        <circle r="10" fill="#C5A059" fillOpacity="0.3" />
                        <circle r="5" fill="#855B14" stroke="#FAF8F5" strokeWidth="1.5" />
                        <text
                          x="0"
                          y="14"
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight="bold"
                          fill="#172A28"
                        >
                          {m.name.length > 14 ? m.name.substring(0, 12) + '..' : m.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Mosque Card preview */}
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-gray-200 text-xs shadow-xs flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-500 block truncate">
                      اضغط على أي مسجد للملاحة
                    </span>
                    <strong className="text-emerald-950 font-bold block truncate">
                      {filteredMosques[0]?.name || 'المساجد القريبة'}
                    </strong>
                  </div>
                  <span className="text-emerald-800 font-bold font-mono shrink-0">
                    {filteredMosques[0]?.distanceKm || 0.8} كم
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* MOSQUES LIST VIEW (Always Works Offline with Cached Mosques) */
            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredMosques.map((mosque) => (
                <div
                  key={mosque.id}
                  className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all text-right"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200/50">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{mosque.rating}</span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm font-quran">
                        {mosque.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 flex items-center justify-end gap-1">
                        <span>{mosque.address}</span>
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      </p>
                    </div>
                  </div>

                  {/* Features badges */}
                  <div className="flex flex-wrap gap-1 mt-2.5 justify-end">
                    {mosque.features.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-100"
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Distance & Action Bar */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold font-sans text-emerald-800">
                      يبعد {mosque.distanceKm} كم
                    </span>

                    <button
                      type="button"
                      onClick={() => handleStartNavigation(mosque.id, mosque.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#104b3a] hover:bg-[#0c392c] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>الاتجاهات والمسار</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
