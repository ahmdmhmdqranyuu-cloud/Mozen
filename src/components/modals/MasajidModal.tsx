import React, { useState } from 'react';
import { X, MapPin, Navigation, Star, Search, Check, ChevronRight } from 'lucide-react';
import { NEARBY_MOSQUES } from '../../data/mosquesData';
import { MosqueItem } from '../../types';

interface MasajidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasajidModal: React.FC<MasajidModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'jumua' | 'women'>('all');
  const [navigatingMosque, setNavigatingMosque] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredMosques = NEARBY_MOSQUES.filter((m) => {
    const matchesSearch = m.name.includes(searchQuery) || m.address.includes(searchQuery);
    if (!matchesSearch) return false;
    if (activeFilter === 'jumua') return m.hasJumua;
    if (activeFilter === 'women') return m.hasWomenSection;
    return true;
  });

  const handleStartNavigation = (id: string, name: string) => {
    setNavigatingMosque(name);
    setTimeout(() => setNavigatingMosque(null), 3000);
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
              <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">المساجد الأقرب إليك</h2>
              <p className="text-[11px] text-gray-500">دليل المساجد ومصليات الجمعة</p>
            </div>
          </div>
          <MapPin className="w-5 h-5 text-[#C5A059]" />
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Search & Filters */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث عن اسم المسجد أو المنطقة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 text-xs bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-600 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#104b3a] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setActiveFilter('jumua')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  activeFilter === 'jumua'
                    ? 'bg-[#104b3a] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                تقام به صلاة الجمعة
              </button>
              <button
                onClick={() => setActiveFilter('women')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  activeFilter === 'women'
                    ? 'bg-[#104b3a] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                يوجد مصلى نساء
              </button>
            </div>
          </div>

          {/* Navigation notification banner */}
          {navigatingMosque && (
            <div className="mb-3 p-3 bg-emerald-600 text-white rounded-2xl text-xs flex items-center justify-between animate-fade-in shadow-md">
              <span className="font-bold">
                جاري توجيهك إلى {navigatingMosque} (أقصر طريق: 4 دقائق سيراً)...
              </span>
              <Check className="w-4 h-4" />
            </div>
          )}

          {/* Mosques List */}
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
        </div>
      </div>
    </div>
  );
};
