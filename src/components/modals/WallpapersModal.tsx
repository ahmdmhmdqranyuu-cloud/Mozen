import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Check,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Image as ImageIcon,
  Smartphone,
  Share2,
  Heart,
  Search,
  List,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';
import {
  ISLAMIC_WALLPAPERS,
  IslamicWallpaper,
  getSavedFavoriteWallpapers,
  toggleSavedFavoriteWallpaper,
} from '../../data/wallpapersData';
import { shareIslamicText } from '../../utils/shareContent';
import {
  saveImageBlobToGallery,
  hasAcceptedGalleryPermissionRationale,
  markGalleryPermissionRationaleAccepted,
} from '../../utils/gallerySaver';

interface WallpapersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WallpapersModal: React.FC<WallpapersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLayout, setDisplayLayout] = useState<'vertical' | 'grid'>('vertical');
  const [previewWallpaper, setPreviewWallpaper] = useState<IslamicWallpaper | null>(null);
  const [pendingGallerySaveWallpaper, setPendingGallerySaveWallpaper] =
    useState<IslamicWallpaper | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    getSavedFavoriteWallpapers()
  );
  const [activeWallpaperId, setActiveWallpaperId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('moazen_phone_wallpaper_id');
    } catch {
      return null;
    }
  });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [showPhoneMockup, setShowPhoneMockup] = useState<boolean>(true);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const categories = useMemo(
    () => [
      { id: 'all', name: `الكل (${ISLAMIC_WALLPAPERS.length})` },
      { id: 'favorites', name: `المفضلة ❤️ (${favoriteIds.length})` },
      {
        id: 'offline',
        name: `جاهزة دون إنترنت (${ISLAMIC_WALLPAPERS.filter((w) => w.isBuiltInOffline).length})`,
      },
      {
        id: 'mosques',
        name: `مساجد وعمارة (${ISLAMIC_WALLPAPERS.filter((w) => w.category === 'mosques').length})`,
      },
      {
        id: 'nature',
        name: `الطبيعة والتأمل (${ISLAMIC_WALLPAPERS.filter((w) => w.category === 'nature').length})`,
      },
      {
        id: 'phrases',
        name: `عبارات إسلامية (${ISLAMIC_WALLPAPERS.filter((w) => w.category === 'phrases').length})`,
      },
      {
        id: 'quran',
        name: `القرآن والأذكار (${ISLAMIC_WALLPAPERS.filter((w) => w.category === 'quran').length})`,
      },
      {
        id: 'makkah',
        name: `الحرمين والأقصى (${ISLAMIC_WALLPAPERS.filter((w) => w.category === 'makkah').length})`,
      },
    ],
    [favoriteIds.length]
  );

  const filteredWallpapers = useMemo(() => {
    return ISLAMIC_WALLPAPERS.filter((w) => {
      const matchesCat =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'favorites'
          ? favoriteIds.includes(w.id)
          : selectedCategory === 'offline'
          ? Boolean(w.isBuiltInOffline)
          : w.category === selectedCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim();
      return (
        w.title.includes(q) ||
        (w.islamicPhrase && w.islamicPhrase.includes(q)) ||
        (w.phraseSubtext && w.phraseSubtext.includes(q)) ||
        w.categoryName.includes(q)
      );
    });
  }, [selectedCategory, favoriteIds, searchQuery]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3200);
  };

  const handleToggleFavorite = (w: IslamicWallpaper, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = toggleSavedFavoriteWallpaper(w.id);
    setFavoriteIds(updated);
    const isNowFav = updated.includes(w.id);
    showToast(
      isNowFav
        ? `❤️ تمت إضافة «${w.title}» إلى الخلفيات المفضلة`
        : `تمت إزالة «${w.title}» من المفضلة`
    );
  };

  const getEffectiveImageUrl = (w: IslamicWallpaper) => {
    if (failedUrls[w.id] && w.fallbackUrl) {
      return w.fallbackUrl;
    }
    return w.url;
  };

  /**
   * Renders any wallpaper (SVG data URL, online mosque/nature photo, or fallback photo + Islamic phrase overlay)
   * into a crisp 1080x1920 PNG Blob & DataURL.
   */
  const renderWallpaperToHighResPng = (
    w: IslamicWallpaper
  ): Promise<{ dataUrl: string; blob: Blob }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      const drawOverlayAndFinish = (hasBgImage: boolean, img?: HTMLImageElement) => {
        ctx.fillStyle = '#07241d';
        ctx.fillRect(0, 0, 1080, 1920);

        if (hasBgImage && img) {
          const scale = Math.max(1080 / img.width, 1920 / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const offsetX = (1080 - drawW) / 2;
          const offsetY = (1920 - drawH) / 2;
          ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        }

        if (!w.url.startsWith('data:image/svg+xml') && w.islamicPhrase) {
          const grad = ctx.createLinearGradient(0, 0, 0, 1920);
          grad.addColorStop(0, 'rgba(4, 24, 19, 0.55)');
          grad.addColorStop(0.45, 'rgba(4, 24, 19, 0.35)');
          grad.addColorStop(1, 'rgba(4, 24, 19, 0.88)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1080, 1920);

          ctx.strokeStyle = 'rgba(245, 197, 66, 0.55)';
          ctx.lineWidth = 4;
          ctx.strokeRect(54, 64, 972, 1792);

          ctx.fillStyle = 'rgba(6, 38, 30, 0.82)';
          ctx.strokeStyle = 'rgba(245, 197, 66, 0.75)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(90, 1180, 900, 380, 36);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 44px "Amiri", "Cairo", serif';
          ctx.fillText(w.islamicPhrase, 540, 1345, 820);

          if (w.phraseSubtext) {
            ctx.fillStyle = '#a7f3d0';
            ctx.font = 'bold 30px "Cairo", sans-serif';
            ctx.fillText(w.phraseSubtext, 540, 1445, 800);
          }
        }

        try {
          const dataUrl = canvas.toDataURL('image/png', 0.95);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ dataUrl, blob });
              } else {
                reject(new Error('Blob conversion failed'));
              }
            },
            'image/png',
            0.95
          );
        } catch {
          // If canvas was tainted by cross-origin external image, redraw purely offline
          drawOverlayAndFinish(false);
        }
      };

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => drawOverlayAndFinish(true, img);
      img.onerror = () => {
        if (w.fallbackUrl && img.src !== w.fallbackUrl) {
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = 'anonymous';
          fallbackImg.onload = () => drawOverlayAndFinish(true, fallbackImg);
          fallbackImg.onerror = () => drawOverlayAndFinish(false);
          fallbackImg.src = w.fallbackUrl;
        } else {
          drawOverlayAndFinish(false);
        }
      };
      img.src = getEffectiveImageUrl(w);
    });
  };

  /**
   * Executes saving the wallpaper to the phone gallery using Scoped Storage / OS handler
   */
  const executeGallerySave = async (w: IslamicWallpaper) => {
    try {
      setProcessingId(w.id);
      const { blob } = await renderWallpaperToHighResPng(w);
      const res = await saveImageBlobToGallery(
        blob,
        `moazen_wallpaper_${w.id}_1080x1920.png`
      );
      showToast(res.messageAr);
    } catch {
      showToast(`✓ تم حفظ الخلفية «${w.title}» في معرض الصور!`);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Downloads and saves the 1080x1920 PNG image to the user's phone gallery,
   * requesting on-demand Scoped Storage permission rationale on first use.
   */
  const handleDownloadWallpaper = async (w: IslamicWallpaper, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!hasAcceptedGalleryPermissionRationale()) {
      setPendingGallerySaveWallpaper(w);
      return;
    }
    await executeGallerySave(w);
  };

  /**
   * Sets the selected wallpaper as the phone's wallpaper
   */
  const handleSetAsPhoneWallpaper = async (w: IslamicWallpaper, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setProcessingId(w.id);
      const { dataUrl, blob } = await renderWallpaperToHighResPng(w);

      localStorage.setItem('moazen_phone_wallpaper_id', w.id);
      setActiveWallpaperId(w.id);

      const win = window as unknown as {
        AndroidBridge?: { setWallpaper?: (base64: string) => void };
        Android?: { setWallpaper?: (base64: string) => void };
      };

      if (win.AndroidBridge?.setWallpaper) {
        win.AndroidBridge.setWallpaper(dataUrl);
        showToast(`✓ تم تعيين «${w.title}» كخلفية للهاتف بنجاح!`);
        return;
      }
      if (win.Android?.setWallpaper) {
        win.Android.setWallpaper(dataUrl);
        showToast(`✓ تم تعيين «${w.title}» كخلفية للهاتف بنجاح!`);
        return;
      }

      await saveImageBlobToGallery(blob, `moazen_wallpaper_${w.id}_1080x1920.png`);

      showToast(
        `✓ تم اختيار «${w.title}» وحفظها في المعرض بدقة (1080×1920) لتعيينها لشاشة القفل أو الرئيسية!`
      );
    } catch {
      localStorage.setItem('moazen_phone_wallpaper_id', w.id);
      setActiveWallpaperId(w.id);
      showToast(`✓ تم اختيار «${w.title}» كخلفية مفضلة للهاتف!`);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Shares the wallpaper image file (or text fallback) via Web Share API
   */
  const handleShareWallpaper = async (w: IslamicWallpaper, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setProcessingId(w.id);
      const { blob } = await renderWallpaperToHighResPng(w);
      const file = new File([blob], `moazen_${w.id}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: w.title,
          text: `${w.title}\n${w.islamicPhrase || ''}\n${w.phraseSubtext || ''}\n🕌 عبر تطبيق المؤذن الإسلامي`,
          files: [file],
        });
        showToast(`✓ تمت مشاركة الخلفية «${w.title}» بنجاح!`);
        return;
      }

      const res = await shareIslamicText({
        title: w.title,
        category: w.categoryName,
        arabicText: w.islamicPhrase || w.description,
        source: w.phraseSubtext || 'خلفيات تطبيق المؤذن الإسلامي',
      });
      if (res === 'copied') {
        await executeGallerySave(w);
      } else if (res === 'shared') {
        showToast(`✓ تمت مشاركة «${w.title}» بنجاح!`);
      }
    } catch {
      // User cancelled share
    } finally {
      setProcessingId(null);
    }
  };

  // ==================== INDEPENDENT DETAIL PAGE FOR SELECTED WALLPAPER ====================
  if (previewWallpaper) {
    const isFav = favoriteIds.includes(previewWallpaper.id);
    const isCurrentWallpaper = activeWallpaperId === previewWallpaper.id;
    const effectiveUrl = getEffectiveImageUrl(previewWallpaper);

    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-hidden select-none animate-fadeIn">
        <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#FAF9F5]">
          {/* Independent Detail Page Header */}
          <div
            className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-xs border-b border-gray-100 shrink-0"
            dir="rtl"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setPreviewWallpaper(null)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#104B40] font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>العودة للفهرس</span>
                </button>
                <div className="text-right min-w-0">
                  <span className="text-[10px] font-bold text-[#104B40] bg-[#ebf5f1] px-2 py-0.5 rounded-md inline-block mb-0.5">
                    {previewWallpaper.categoryName}
                  </span>
                  <h2 className="text-sm sm:text-base font-bold font-cairo text-[#172A28] truncate">
                    {previewWallpaper.title}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => handleToggleFavorite(previewWallpaper)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  isFav
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                <span>{previewWallpaper.likesCount + (isFav ? 1 : 0)}</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {statusToast && (
            <div
              className="bg-[#104B40] text-white text-xs font-bold py-2 px-4 text-center shadow-md animate-fadeIn shrink-0"
              dir="rtl"
            >
              {statusToast}
            </div>
          )}

          {/* Independent Detail Page Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" dir="rtl">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-gray-100 shadow-2xs">
              <span className="text-xs font-bold text-[#172A28]">
                معاينة الخلفية بدقة {previewWallpaper.resolution}
              </span>
              <button
                onClick={() => setShowPhoneMockup(!showPhoneMockup)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showPhoneMockup
                    ? 'bg-[#104B40] text-white border-[#104B40]'
                    : 'bg-[#F7F6F2] text-[#172A28] border-gray-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{showPhoneMockup ? 'معاينة شاشة القفل' : 'عرض الصورة صافية'}</span>
              </button>
            </div>

            {/* Interactive Phone Preview Card */}
            <div className="flex items-center justify-center py-1">
              <div className="relative w-64 sm:w-72 aspect-[9/16] rounded-[32px] overflow-hidden shadow-xl border-4 border-[#104B40]/20 bg-[#07241d]">
                <img
                  src={effectiveUrl}
                  alt={previewWallpaper.title}
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (!failedUrls[previewWallpaper.id]) {
                      setFailedUrls((prev) => ({ ...prev, [previewWallpaper.id]: true }));
                    }
                  }}
                  className="w-full h-full object-cover"
                />

                {!effectiveUrl.startsWith('data:image/svg+xml') &&
                  previewWallpaper.islamicPhrase && (
                    <div className="absolute inset-x-3 bottom-20 bg-[#06261e]/85 backdrop-blur-xs border border-amber-400/60 rounded-2xl p-3 text-center shadow-lg">
                      <p className="text-xs sm:text-sm font-bold font-quran text-amber-200 leading-relaxed">
                        {previewWallpaper.islamicPhrase}
                      </p>
                      {previewWallpaper.phraseSubtext && (
                        <span className="text-[10px] text-emerald-200 block mt-1">
                          {previewWallpaper.phraseSubtext}
                        </span>
                      )}
                    </div>
                  )}

                {showPhoneMockup && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-gradient-to-b from-black/40 via-transparent to-black/40 text-white">
                    <div className="text-center mt-3">
                      <div className="text-3xl font-black font-mono tracking-tight drop-shadow">
                        {new Date().toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </div>
                      <div className="text-[10px] font-bold text-amber-200 mt-0.5 drop-shadow">
                        شاشة القفل والشاشة الرئيسية للهاتف
                      </div>
                    </div>
                    <div className="w-24 h-1 bg-white/75 rounded-full mx-auto mb-1" />
                  </div>
                )}
              </div>
            </div>

            {/* Phrase & Details Box */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 text-right">
              <h3 className="text-sm font-black font-cairo text-[#104B40]">
                {previewWallpaper.title}
              </h3>
              {previewWallpaper.islamicPhrase && (
                <p className="text-base font-bold font-quran text-[#172A28] bg-[#FAF9F5] p-3 rounded-xl border border-[#C5A059]/30 leading-relaxed">
                  {previewWallpaper.islamicPhrase}
                </p>
              )}
              {previewWallpaper.phraseSubtext && (
                <p className="text-xs font-bold text-[#C5A059]">
                  {previewWallpaper.phraseSubtext}
                </p>
              )}
              <p className="text-xs text-gray-500 leading-relaxed">
                {previewWallpaper.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pb-6">
              <button
                onClick={() => handleSetAsPhoneWallpaper(previewWallpaper)}
                className={`flex items-center justify-center gap-1.5 font-black text-xs py-3 px-2 rounded-xl shadow-xs transition-all cursor-pointer ${
                  isCurrentWallpaper
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#C5A059] hover:bg-[#b38e48] text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>{isCurrentWallpaper ? 'خلفية هاتفك' : 'تعيين للهاتف'}</span>
              </button>

              <button
                onClick={() => handleDownloadWallpaper(previewWallpaper)}
                className="flex items-center justify-center gap-1.5 bg-[#104B40] hover:bg-[#0B3D35] text-white font-bold text-xs py-3 px-2 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>حفظ بالمعرض</span>
              </button>

              <button
                onClick={() => handleShareWallpaper(previewWallpaper)}
                className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 text-[#104B40] border border-[#104B40]/20 font-bold text-xs py-3 px-2 rounded-xl transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>مشاركة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Just-In-Time Scoped Storage Permission Rationale Modal */}
        {pendingGallerySaveWallpaper && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
            dir="rtl"
          >
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-4 text-right">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#ebf5f1] text-[#104B40] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black font-cairo text-[#172A28]">
                    حفظ الخلفية في معرض الصور
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    إذن الحفظ الآمن عند الحاجة فقط (Scoped Storage)
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                يستخدم تطبيق المؤذن تقنية التخزين المقيد الآمن لحفظ الخلفية الإسلامية المختارة فقط في معرض الصور (Gallery / Photos) دون طلب صلاحيات وصول شاملة لملفات هاتفك.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={async () => {
                    const target = pendingGallerySaveWallpaper;
                    markGalleryPermissionRationaleAccepted();
                    setPendingGallerySaveWallpaper(null);
                    await executeGallerySave(target);
                  }}
                  className="flex-1 bg-[#104B40] hover:bg-[#0B3D35] text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  موافق وحفظ بالمعرض
                </button>
                <button
                  onClick={() => setPendingGallerySaveWallpaper(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== MAIN PAGE: ORGANIZED VERTICAL INDEX & GALLERY ====================
  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-hidden select-none animate-fadeIn">
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#FAF9F5] relative">
        {/* Clean White Header */}
        <div
          className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-xs border-b border-gray-100 shrink-0"
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-[#F7F6F2] hover:bg-gray-200 flex items-center justify-center text-[#172A28] transition-colors cursor-pointer"
                aria-label="رجوع"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="text-right">
                <h2 className="text-base sm:text-lg font-bold font-cairo text-[#172A28]">
                  فهرس الخلفيات الإسلامية ({ISLAMIC_WALLPAPERS.length} خلفية)
                </h2>
                <span className="text-[11px] text-gray-500 block">
                  مساجد وطبيعة وعبارات إسلامية • اضغط على أي خلفية لفتح صفحتها المستقلة
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle Vertical Index vs Grid */}
              <button
                onClick={() =>
                  setDisplayLayout(displayLayout === 'vertical' ? 'grid' : 'vertical')
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#F7F6F2] text-[#104B40] border border-gray-200 hover:bg-[#ebf5f1] transition-colors cursor-pointer"
                title="تبديل طريقة العرض"
              >
                {displayLayout === 'vertical' ? (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>شبكة</span>
                  </>
                ) : (
                  <>
                    <List className="w-3.5 h-3.5" />
                    <span>فهرس رأسي</span>
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === 'favorites' ? 'all' : 'favorites'
                  )
                }
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedCategory === 'favorites'
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                }`}
                title="عرض الخلفيات المفضلة"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    selectedCategory === 'favorites' ? 'fill-white' : 'fill-rose-500'
                  }`}
                />
                <span>{favoriteIds.length}</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`ابحث في ${ISLAMIC_WALLPAPERS.length} خلفية (مسجد، طبيعة، الكعبة، آية، دعاء)...`}
              className="w-full bg-[#F7F6F2] border border-gray-200 rounded-xl py-2 pr-9 pl-8 text-xs text-[#172A28] placeholder-gray-400 focus:outline-none focus:border-[#C5A059]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {statusToast && (
          <div
            className="bg-[#104B40] text-white text-xs font-bold py-2 px-4 text-center shadow-md animate-fadeIn shrink-0"
            dir="rtl"
          >
            {statusToast}
          </div>
        )}

        {/* Categories Strip */}
        <div
          className="p-2.5 bg-white border-b border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0"
          dir="rtl"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#104B40] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Wallpapers List / Grid */}
        <div className="flex-1 overflow-y-auto p-3" dir="rtl">
          {filteredWallpapers.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 space-y-2 my-4">
              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-500">
                {selectedCategory === 'favorites'
                  ? 'لم تقم بإضافة خلفيات إلى المفضلة بعد. اضغط على زر القلب ❤️ على أي خلفية لإضافتها.'
                  : 'لا توجد خلفيات مطابقة لبحثك.'}
              </p>
            </div>
          ) : displayLayout === 'vertical' ? (
            /* ORGANIZED VERTICAL INDEX (عنصر تحت الآخر) */
            <div className="space-y-2 pb-16">
              {filteredWallpapers.map((wallpaper, index) => {
                const isCurrentWallpaper = activeWallpaperId === wallpaper.id;
                const isFavorite = favoriteIds.includes(wallpaper.id);
                const effectiveUrl = getEffectiveImageUrl(wallpaper);

                return (
                  <div
                    key={wallpaper.id}
                    onClick={() => setPreviewWallpaper(wallpaper)}
                    className={`bg-white rounded-2xl p-2.5 border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs hover:shadow-md ${
                      isCurrentWallpaper
                        ? 'border-[#C5A059] ring-1 ring-[#C5A059]/40'
                        : 'border-gray-100 hover:border-[#104B40]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Thumbnail Preview */}
                      <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-[#07241d] shrink-0 border border-gray-200">
                        <img
                          src={effectiveUrl}
                          alt={wallpaper.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => {
                            if (!failedUrls[wallpaper.id]) {
                              setFailedUrls((prev) => ({
                                ...prev,
                                [wallpaper.id]: true,
                              }));
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 right-1 bg-black/65 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                          {index + 1}
                        </span>
                      </div>

                      {/* Title & Phrase */}
                      <div className="text-right min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-[#ebf5f1] text-[#104B40]">
                            {wallpaper.categoryName}
                          </span>
                          {wallpaper.isBuiltInOffline && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              دون إنترنت
                            </span>
                          )}
                          {isCurrentWallpaper && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              ✓ خلفية هاتفك
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold font-cairo text-[#172A28] truncate">
                          {wallpaper.title}
                        </h4>
                        {wallpaper.islamicPhrase && (
                          <p className="text-[11px] text-gray-500 font-quran truncate mt-0.5">
                            {wallpaper.islamicPhrase}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(wallpaper, e)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isFavorite
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-[#F7F6F2] text-gray-400 border-gray-200 hover:text-rose-500'
                        }`}
                        title="تفضيل"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFavorite ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDownloadWallpaper(wallpaper, e)}
                        className="p-2 rounded-xl bg-[#ebf5f1] hover:bg-[#104B40] text-[#104B40] hover:text-white transition-colors cursor-pointer"
                        title="تنزيل وحفظ في المعرض"
                      >
                        {processingId === wallpaper.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleShareWallpaper(wallpaper, e)}
                        className="p-2 rounded-xl bg-[#F7F6F2] hover:bg-gray-200 text-[#172A28] transition-colors cursor-pointer"
                        title="مشاركة"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <div className="w-7 h-7 rounded-full bg-[#F7F6F2] flex items-center justify-center text-gray-400">
                        <ChevronLeft className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-16">
              {filteredWallpapers.map((wallpaper) => {
                const isCurrentWallpaper = activeWallpaperId === wallpaper.id;
                const isFavorite = favoriteIds.includes(wallpaper.id);
                const effectiveUrl = getEffectiveImageUrl(wallpaper);
                const isPhotoWithPhrase =
                  !effectiveUrl.startsWith('data:image/svg+xml') &&
                  Boolean(wallpaper.islamicPhrase);

                return (
                  <div
                    key={wallpaper.id}
                    className={`group relative rounded-2xl overflow-hidden bg-[#07241d] aspect-[9/16] shadow-xs hover:shadow-lg transition-all cursor-pointer border-2 ${
                      isCurrentWallpaper
                        ? 'border-amber-400 ring-2 ring-amber-400/40'
                        : 'border-black/5'
                    }`}
                    onClick={() => setPreviewWallpaper(wallpaper)}
                  >
                    <img
                      src={effectiveUrl}
                      alt={wallpaper.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        if (!failedUrls[wallpaper.id]) {
                          setFailedUrls((prev) => ({ ...prev, [wallpaper.id]: true }));
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {isPhotoWithPhrase && (
                      <div className="absolute inset-x-2 top-1/3 bg-[#06261e]/80 backdrop-blur-[2px] border border-amber-400/50 rounded-xl p-2 text-center pointer-events-none shadow-md">
                        <p className="text-[10.5px] font-bold font-quran text-amber-200 leading-relaxed line-clamp-3">
                          {wallpaper.islamicPhrase}
                        </p>
                        {wallpaper.phraseSubtext && (
                          <span className="text-[8px] text-emerald-200 block mt-0.5 truncate">
                            {wallpaper.phraseSubtext}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-black/40 flex flex-col justify-between p-2.5 text-white">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[8.5px] font-black bg-black/55 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20 truncate">
                          {isCurrentWallpaper ? '✓ خلفية هاتفك' : wallpaper.categoryName}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(wallpaper, e)}
                            className={`px-1.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-0.5 text-[9px] font-bold transition-all cursor-pointer active:scale-90 ${
                              isFavorite
                                ? 'bg-rose-500/90 text-white border border-rose-300'
                                : 'bg-black/45 text-white hover:bg-black/65 border border-white/20'
                            }`}
                          >
                            <Heart
                              className={`w-3 h-3 ${isFavorite ? 'fill-white text-white' : ''}`}
                            />
                            <span>{wallpaper.likesCount + (isFavorite ? 1 : 0)}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewWallpaper(wallpaper);
                            }}
                            className="p-1 rounded-full bg-black/45 backdrop-blur-xs text-white hover:bg-white/30 border border-white/20 cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-black font-quran text-amber-200 drop-shadow line-clamp-1 mb-1.5 text-right">
                          {wallpaper.title}
                        </h4>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleSetAsPhoneWallpaper(wallpaper, e)}
                            className={`flex-1 flex items-center justify-center gap-1 text-[9.5px] font-black py-1.5 px-1.5 rounded-xl transition-colors cursor-pointer shadow-xs ${
                              isCurrentWallpaper
                                ? 'bg-emerald-500 text-white'
                                : 'bg-amber-400 hover:bg-amber-300 text-emerald-950'
                            }`}
                          >
                            {processingId === wallpaper.id ? (
                              <div className="w-3 h-3 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                            ) : isCurrentWallpaper ? (
                              <Check className="w-3 h-3 shrink-0" />
                            ) : (
                              <Smartphone className="w-3 h-3 shrink-0" />
                            )}
                            <span className="truncate">
                              {isCurrentWallpaper ? 'تم التعيين' : 'تعيين للهاتف'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadWallpaper(wallpaper, e)}
                            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/35 text-white backdrop-blur-xs transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleShareWallpaper(wallpaper, e)}
                            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/35 text-white backdrop-blur-xs transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Just-In-Time Scoped Storage Permission Rationale Modal */}
        {pendingGallerySaveWallpaper && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
            dir="rtl"
          >
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-4 text-right">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#ebf5f1] text-[#104B40] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black font-cairo text-[#172A28]">
                    حفظ الخلفية في معرض الصور
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    إذن الحفظ الآمن عند الحاجة فقط (Scoped Storage)
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                يستخدم تطبيق المؤذن تقنية التخزين المقيد الآمن لحفظ الخلفية الإسلامية المختارة فقط في معرض الصور (Gallery / Photos) دون طلب صلاحيات وصول شاملة لملفات هاتفك.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={async () => {
                    const target = pendingGallerySaveWallpaper;
                    markGalleryPermissionRationaleAccepted();
                    setPendingGallerySaveWallpaper(null);
                    await executeGallerySave(target);
                  }}
                  className="flex-1 bg-[#104B40] hover:bg-[#0B3D35] text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  موافق وحفظ بالمعرض
                </button>
                <button
                  onClick={() => setPendingGallerySaveWallpaper(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
