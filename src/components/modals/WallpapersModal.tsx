import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Check,
  ChevronRight,
  Maximize2,
  Image as ImageIcon,
  Share2,
  Heart,
  ShieldCheck,
  WifiOff,
  RefreshCw,
  Loader2,
  BookmarkCheck,
  Trash2,
} from 'lucide-react';
import {
  ISLAMIC_WALLPAPERS,
  IslamicWallpaper,
  SavedWallpaperRecord,
  getSavedFavoriteWallpapers,
  toggleSavedFavoriteWallpaper,
  getSavedWallpaperRecords,
  addSavedWallpaperRecord,
  removeSavedWallpaperRecord,
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

type ImageLoadStatus = 'loading' | 'loaded' | 'error';

export const WallpapersModal: React.FC<WallpapersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [previewWallpaper, setPreviewWallpaper] = useState<IslamicWallpaper | null>(null);
  const [pendingGallerySaveWallpaper, setPendingGallerySaveWallpaper] =
    useState<IslamicWallpaper | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    getSavedFavoriteWallpapers()
  );
  const [savedRecords, setSavedRecords] = useState<SavedWallpaperRecord[]>(() =>
    getSavedWallpaperRecords()
  );
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [imageStatusMap, setImageStatusMap] = useState<Record<string, ImageLoadStatus>>({});
  const [retryMap, setRetryMap] = useState<Record<string, number>>({});
  const [previewStatus, setPreviewStatus] = useState<ImageLoadStatus>('loading');
  const [previewRetryTick, setPreviewRetryTick] = useState<number>(0);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (previewWallpaper) {
      setPreviewStatus('loading');
      setPreviewRetryTick(0);
    }
  }, [previewWallpaper?.id]);

  const savedIdSet = useMemo(
    () => new Set(savedRecords.map((r) => r.id)),
    [savedRecords]
  );

  const filteredWallpapers = useMemo<IslamicWallpaper[]>(() => {
    if (showSavedOnly) {
      return savedRecords.map((rec): IslamicWallpaper => {
        const match = ISLAMIC_WALLPAPERS.find((w) => w.id === rec.id);
        if (match) return match;
        return {
          id: rec.id,
          title: rec.islamicPhrase || rec.title,
          category: 'mosques',
          categoryName: rec.categoryName,
          url: rec.url,
          thumbUrl: rec.thumbUrl,
          resolution: '1080×1920 Full HD',
          description: rec.islamicPhrase || rec.title,
          islamicPhrase: rec.islamicPhrase,
          phraseSubtext: rec.phraseSubtext,
          likesCount: 1,
          tags: [rec.islamicPhrase || rec.title],
        };
      });
    }
    return ISLAMIC_WALLPAPERS;
  }, [showSavedOnly, savedRecords]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3200);
  };

  const retryWallpaper = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    setImageStatusMap((prev) => ({ ...prev, [id]: 'loading' }));
    setRetryMap((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const retryAllFailed = () => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const nextStatus = { ...imageStatusMap };
    const nextRetry = { ...retryMap };
    ISLAMIC_WALLPAPERS.forEach((w) => {
      if (nextStatus[w.id] === 'error' || !nextStatus[w.id]) {
        nextStatus[w.id] = 'loading';
        nextRetry[w.id] = (nextRetry[w.id] || 0) + 1;
      }
    });
    setImageStatusMap(nextStatus);
    setRetryMap(nextRetry);
  };

  const handleToggleFavorite = (w: IslamicWallpaper, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = toggleSavedFavoriteWallpaper(w.id);
    setFavoriteIds(updated);
    const isNowFav = updated.includes(w.id);
    showToast(
      isNowFav
        ? `❤️ تمت إضافة «${w.title}» إلى المفضلة`
        : `تمت إزالة «${w.title}» من المفضلة`
    );
  };

  const fetchOnlineImageBlob = async (url: string): Promise<Blob> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('لا يوجد اتصال بالإنترنت لتحميل الصورة');
    }
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`تعذر تحميل الخلفية (HTTP ${response.status})`);
    }
    const blob = await response.blob();
    if (!blob || blob.size < 512) {
      throw new Error('بيانات الصورة غير مكتملة');
    }
    return blob;
  };

  const executeGallerySave = async (w: IslamicWallpaper) => {
    try {
      setProcessingAction(w.id);
      const blob = await fetchOnlineImageBlob(w.url);
      const res = await saveImageBlobToGallery(
        blob,
        `moazen_${w.id}.jpg`
      );
      const updated = addSavedWallpaperRecord(w);
      setSavedRecords(updated);
      showToast(res.messageAr || `✓ تم حفظ «${w.title}» وإضافتها لقسم المحفوظة`);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'تعذر حفظ الخلفية — تحقق من اتصالك بالإنترنت'
      );
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSaveWallpaper = async (w: IslamicWallpaper, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!hasAcceptedGalleryPermissionRationale()) {
      setPendingGallerySaveWallpaper(w);
      return;
    }
    await executeGallerySave(w);
  };

  const handleShareWallpaper = async (w: IslamicWallpaper, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setProcessingAction(w.id);
      try {
        const blob = await fetchOnlineImageBlob(w.url);
        const file = new File([blob], `moazen_${w.id}.jpg`, {
          type: blob.type || 'image/jpeg',
        });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: w.title,
            text: `${w.title}\n${w.islamicPhrase || ''}\n🕌 عبر تطبيق مسلم بلس`,
            files: [file],
          });
          showToast(`✓ تمت مشاركة الخلفية «${w.title}» بنجاح`);
          return;
        }
      } catch {
        // Fallback to URL/text share if image fetch blocked by CORS or offline
      }

      if (navigator.share) {
        await navigator.share({
          title: w.title,
          text: `${w.title}\n${w.islamicPhrase || ''}`,
          url: w.url,
        });
        showToast(`✓ تمت مشاركة رابط الخلفية «${w.title}»`);
        return;
      }

      const res = await shareIslamicText({
        title: w.title,
        category: w.categoryName,
        arabicText: `${w.islamicPhrase || w.description}\n${w.url}`,
        source: w.phraseSubtext || 'خلفيات تطبيق مسلم بلس',
      });
      if (res === 'copied') {
        showToast(`✓ تم نسخ رابط ووصف الخلفية للمشاركة`);
      } else if (res === 'shared') {
        showToast(`✓ تمت مشاركة الخلفية بنجاح`);
      }
    } catch {
      // cancelled
    } finally {
      setProcessingAction(null);
    }
  };

  const buildImgSrc = (url: string, tick: number) =>
    tick > 0 ? `${url}${url.includes('?') ? '&' : '?'}retry=${tick}` : url;

  // ==================== FULL PREVIEW VIEW ====================
  if (previewWallpaper) {
    const isFav = favoriteIds.includes(previewWallpaper.id);
    const isSaved = savedIdSet.has(previewWallpaper.id);
    const fullSrc = buildImgSrc(previewWallpaper.url, previewRetryTick);

    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-hidden select-none animate-fadeIn">
        <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#FAF9F5]">
          {/* Header */}
          <div
            className="bg-white text-[#172A28] px-4 pt-5 pb-3 shadow-xs border-b border-gray-100 shrink-0"
            dir="rtl"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setPreviewWallpaper(null)}
                  className="moazen-widget flex items-center gap-1 px-3 py-2 rounded-xl text-[#104B40] font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>رجوع</span>
                </button>
                <div className="text-right min-w-0">
                  {previewWallpaper.phraseSubtext && (
                    <span className="text-[10px] font-bold text-[#9E7B34] bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-0.5 border border-amber-200/70">
                      {previewWallpaper.phraseSubtext}
                    </span>
                  )}
                  <h2 className="text-xs sm:text-sm font-bold font-quran text-[#172A28] truncate">
                    {previewWallpaper.islamicPhrase || '﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾'}
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

          {statusToast && (
            <div
              className="bg-[#172A28] text-white text-xs font-bold py-2 px-4 text-center shadow-md shrink-0"
              dir="rtl"
            >
              {statusToast}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" dir="rtl">
            {/* Image Container with Real Loading & Error Retry States */}
            <div className="flex items-center justify-center">
              <div className="relative w-64 sm:w-72 aspect-[9/16] rounded-[28px] overflow-hidden shadow-xl border-4 border-[#C5A059]/30 bg-[#172A28] flex items-center justify-center">
                {previewStatus !== 'error' && (
                  <img
                    src={fullSrc}
                    alt={previewWallpaper.islamicPhrase || 'خلفية إسلامية'}
                    referrerPolicy="no-referrer"
                    onLoad={() => setPreviewStatus('loaded')}
                    onError={() => setPreviewStatus('error')}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      previewStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                )}

                {previewStatus === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#172A28]/90 text-white p-4">
                    <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
                    <span className="text-xs font-bold text-amber-200">
                      جاري تحميل الخلفية عبر الإنترنت...
                    </span>
                  </div>
                )}

                {previewStatus === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#172A28] text-white p-5 text-center">
                    <WifiOff className="w-9 h-9 text-rose-400" />
                    <p className="text-xs font-bold text-rose-200 leading-relaxed">
                      تعذر تحميل الخلفية بدقة عالية — تأكد من اتصالك بالإنترنت
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewStatus('loading');
                        setPreviewRetryTick((n) => n + 1);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F59E0B] text-[#172A28] text-xs font-black cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة المحاولة</span>
                    </button>
                  </div>
                )}

                {previewWallpaper.islamicPhrase && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-4 text-center pointer-events-none">
                    <p className="text-sm font-bold font-quran text-amber-100 leading-relaxed drop-shadow">
                      {previewWallpaper.islamicPhrase}
                    </p>
                    {previewWallpaper.phraseSubtext && (
                      <p className="text-[10px] font-bold text-amber-300/90 mt-1">
                        {previewWallpaper.phraseSubtext}
                      </p>
                    )}
                  </div>
                )}

                {isSaved && (
                  <span className="absolute top-3 right-3 bg-[#C5A059] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    محفوظة
                  </span>
                )}
              </div>
            </div>

            {/* Quranic / Islamic Phrase Card */}
            <div className="moazen-widget rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 text-right">
              <p className="moazen-widget text-sm font-bold font-quran text-[#172A28] p-3 rounded-xl border border-[#C5A059]/30 leading-relaxed text-center">
                {previewWallpaper.islamicPhrase || '﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾'}
              </p>
              {previewWallpaper.phraseSubtext && (
                <p className="text-xs font-bold text-[#9E7B34] text-center">
                  {previewWallpaper.phraseSubtext}
                </p>
              )}
            </div>

            {/* Action Buttons: حفظ الخلفية + مشاركة */}
            <div className="grid grid-cols-2 gap-3 pb-6">
              <button
                type="button"
                disabled={processingAction === previewWallpaper.id}
                onClick={() => handleSaveWallpaper(previewWallpaper)}
                className="flex items-center justify-center gap-2 bg-[#104B40] hover:bg-[#0B3D35] disabled:opacity-60 text-white font-bold text-xs sm:text-sm py-3 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {processingAction === previewWallpaper.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 shrink-0" />
                )}
                <span>حفظ الخلفية</span>
              </button>

              <button
                type="button"
                disabled={processingAction === previewWallpaper.id}
                onClick={() => handleShareWallpaper(previewWallpaper)}
                className="moazen-widget flex items-center justify-center gap-2 text-[#104B40] border border-[#104B40]/25 font-bold text-xs sm:text-sm py-3 px-3 rounded-xl transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>مشاركة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scoped Storage Confirmation Modal */}
        {pendingGallerySaveWallpaper && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            dir="rtl"
          >
            <div className="moazen-widget rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-4 text-right">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#ebf5f1] text-[#104B40] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black font-cairo text-[#172A28]">
                    حفظ الخلفية على هاتفك
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    لا يتم حفظ الخلفيات تلقائيًا إلا عند اختيارك
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                سيتم تحميل الصورة عبر الإنترنت وحفظها في ألبوم الصور الخاص بك وإضافتها لقسم «المحفوظة».
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={async () => {
                    const target = pendingGallerySaveWallpaper;
                    markGalleryPermissionRationaleAccepted();
                    setPendingGallerySaveWallpaper(null);
                    await executeGallerySave(target);
                  }}
                  className="flex-1 bg-[#104B40] hover:bg-[#0B3D35] text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  موافق وحفظ
                </button>
                <button
                  onClick={() => setPendingGallerySaveWallpaper(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
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

  // ==================== MAIN GALLERY ====================
  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F5] flex flex-col overflow-hidden select-none animate-fadeIn">
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col overflow-hidden bg-[#FAF9F5] relative">
        {/* Clean Header (No search bar, no list/grid toggle, no categories index) */}
        <div
          className="bg-white text-[#172A28] px-4 pt-4 pb-3 shadow-xs border-b border-gray-100 shrink-0"
          dir="rtl"
        >
          <div className="flex items-center justify-between">
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
                  الخلفيات الإسلامية ({ISLAMIC_WALLPAPERS.length})
                </h2>
                <span className="text-[11px] text-gray-500 block">
                  خلفيات إيمانية وآيات قرآنية • تحميل مباشر عبر الإنترنت
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSavedOnly((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showSavedOnly
                  ? 'bg-[#C5A059] text-white border-[#C5A059]'
                  : 'bg-[#F7F6F2] text-[#172A28] border-gray-200 hover:bg-amber-50'
              }`}
              title="الخلفيات المحفوظة"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>المحفوظة ({savedRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {statusToast && (
          <div
            className="bg-[#172A28] text-white text-xs font-bold py-2 px-4 text-center shadow-md shrink-0"
            dir="rtl"
          >
            {statusToast}
          </div>
        )}

        {/* Offline Network Warning Banner */}
        {!isOnline && (
          <div
            className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0"
            dir="rtl"
          >
            <div className="flex items-center gap-2 text-rose-800">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold">
                لا يوجد اتصال بالإنترنت — يتطلب عرض وتحميل الخلفيات اتصالاً بالشبكة
              </span>
            </div>
            <button
              type="button"
              onClick={retryAllFailed}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3" dir="rtl">
          {filteredWallpapers.length === 0 ? (
            <div className="moazen-widget rounded-2xl p-10 text-center border border-gray-100 space-y-2 my-4">
              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-500">
                {showSavedOnly
                  ? 'لم تقم بحفظ أي خلفية بعد. افتح أي خلفية واضغط «حفظ الخلفية» لتظهر هنا.'
                  : 'لا توجد خلفيات متاحة حالياً.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-16">
              {filteredWallpapers.map((wallpaper) => {
                const status = imageStatusMap[wallpaper.id] || 'loading';
                const retryTick = retryMap[wallpaper.id] || 0;
                const thumbSrc = buildImgSrc(wallpaper.thumbUrl, retryTick);
                const isFavorite = favoriteIds.includes(wallpaper.id);
                const isSaved = savedIdSet.has(wallpaper.id);

                return (
                  <div
                    key={wallpaper.id}
                    className="group relative rounded-2xl overflow-hidden bg-[#172A28] aspect-[9/16] shadow-xs hover:shadow-lg transition-all cursor-pointer border border-gray-200/70"
                    onClick={() => setPreviewWallpaper(wallpaper)}
                  >
                    {status !== 'error' && (
                      <img
                        src={thumbSrc}
                        alt={wallpaper.islamicPhrase || 'خلفية إسلامية'}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onLoad={() =>
                          setImageStatusMap((prev) => ({ ...prev, [wallpaper.id]: 'loaded' }))
                        }
                        onError={() =>
                          setImageStatusMap((prev) => ({ ...prev, [wallpaper.id]: 'error' }))
                        }
                        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
                          status === 'loaded' ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    )}

                    {status === 'loading' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#172A28] text-white">
                        <Loader2 className="w-7 h-7 text-[#F59E0B] animate-spin" />
                        <span className="text-[10px] text-amber-200 font-bold">
                          جاري التحميل...
                        </span>
                      </div>
                    )}

                    {status === 'error' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#172A28] text-white p-3 text-center">
                        <WifiOff className="w-7 h-7 text-rose-400" />
                        <span className="text-[10px] font-bold text-rose-200">
                          تعذر تحميل الصورة
                        </span>
                        <button
                          type="button"
                          onClick={(e) => retryWallpaper(wallpaper.id, e)}
                          className="px-2.5 py-1 rounded-lg bg-[#F59E0B] text-[#172A28] text-[10px] font-black flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>إعادة المحاولة</span>
                        </button>
                      </div>
                    )}

                    {/* Top & Bottom Overlays (Islamic & Quranic Texts ON images instead of descriptions) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/30 flex flex-col justify-between p-2.5 text-white pointer-events-none">
                      <div className="flex items-center justify-between gap-1 pointer-events-auto">
                        {isSaved ? (
                          <span className="text-[8.5px] font-black bg-[#C5A059] text-white px-2 py-0.5 rounded-full shadow-xs truncate">
                            ✓ محفوظة
                          </span>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(wallpaper, e)}
                            className={`px-1.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-0.5 text-[9px] font-bold cursor-pointer ${
                              isFavorite
                                ? 'bg-rose-500/90 text-white'
                                : 'bg-black/45 text-white border border-white/20'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${isFavorite ? 'fill-white text-white' : ''}`} />
                          </button>

                          {showSavedOnly && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSavedRecords(removeSavedWallpaperRecord(wallpaper.id));
                                showToast('تمت الإزالة من قائمة المحفوظة');
                              }}
                              className="p-1 rounded-full bg-rose-600/85 text-white cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pointer-events-auto space-y-1.5">
                        <div className="text-right">
                          <p className="text-[11px] font-bold font-quran text-amber-100 drop-shadow line-clamp-2 leading-snug">
                            {wallpaper.islamicPhrase || '﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾'}
                          </p>
                          {wallpaper.phraseSubtext && (
                            <span className="text-[9px] font-bold text-amber-300/90 block mt-0.5 truncate">
                              {wallpaper.phraseSubtext}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleSaveWallpaper(wallpaper, e)}
                            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-black py-1.5 px-2 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#172A28] cursor-pointer shadow-xs"
                          >
                            {processingAction === wallpaper.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3 shrink-0" />
                            )}
                            <span>حفظ</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleShareWallpaper(wallpaper, e)}
                            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/35 text-white backdrop-blur-xs cursor-pointer"
                            title="مشاركة"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewWallpaper(wallpaper);
                            }}
                            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/35 text-white backdrop-blur-xs cursor-pointer"
                            title="معاينة"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
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

        {/* Scoped Storage Rationale Modal */}
        {pendingGallerySaveWallpaper && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            dir="rtl"
          >
            <div className="moazen-widget rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-4 text-right">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#ebf5f1] text-[#104B40] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black font-cairo text-[#172A28]">
                    حفظ الخلفية على هاتفك
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    لا يتم حفظ الخلفيات تلقائيًا إلا عند اختيارك
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                سيتم تحميل الخلفية عبر الإنترنت وحفظها في ألبوم الصور وإضافتها لقسم «المحفوظة».
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={async () => {
                    const target = pendingGallerySaveWallpaper;
                    markGalleryPermissionRationaleAccepted();
                    setPendingGallerySaveWallpaper(null);
                    await executeGallerySave(target);
                  }}
                  className="flex-1 bg-[#104B40] hover:bg-[#0B3D35] text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  موافق وحفظ
                </button>
                <button
                  onClick={() => setPendingGallerySaveWallpaper(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
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
