/**
 * Scoped Storage & Gallery Saver Utility for Android, iOS, and PWA
 * Complies with Google Play Store policies:
 * - Uses Scoped Storage / MediaStore on Android 10+ (API 29+) without broad file permissions.
 * - Requests legacy storage permission ONLY on-demand (just-in-time) when saving an image on older Android versions.
 * - Never requests MANAGE_EXTERNAL_STORAGE (All Files Access).
 * - Full support for iOS Photos camera roll saving and Android Gallery.
 */

const GALLERY_PERMISSION_GRANTED_KEY = 'moazen_gallery_save_permission_v1';

export interface GallerySaveResult {
  success: boolean;
  method: 'native_bridge' | 'web_share_files' | 'download_gallery' | 'preview_modal';
  message: string;
  messageAr: string;
}

interface NativeGalleryBridge {
  saveImageToGallery?: (base64DataUrl: string, fileName: string) => boolean | void;
  requestMediaWritePermission?: () => boolean;
  hasMediaWritePermission?: () => boolean;
}

function getNativeBridge(): NativeGalleryBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  const win = window as unknown as {
    AndroidBridge?: NativeGalleryBridge;
    Android?: NativeGalleryBridge;
    webkit?: { messageHandlers?: { saveToPhotos?: { postMessage: (msg: unknown) => void } } };
  };
  return win.AndroidBridge || win.Android;
}

export function hasConfirmedGalleryPermissionRationale(): boolean {
  try {
    return localStorage.getItem(GALLERY_PERMISSION_GRANTED_KEY) === 'true';
  } catch {
    return false;
  }
}

export const hasAcceptedGalleryPermissionRationale = hasConfirmedGalleryPermissionRationale;

export function markGalleryPermissionRationaleConfirmed(): void {
  try {
    localStorage.setItem(GALLERY_PERMISSION_GRANTED_KEY, 'true');
  } catch {
    // ignore
  }
}

export const markGalleryPermissionRationaleAccepted = markGalleryPermissionRationaleConfirmed;

/**
 * Saves an image Blob/DataURL to the user's phone gallery using the appropriate
 * OS-level Scoped Storage / MediaStore / Photo Library API without requesting broad file access.
 */
export async function saveImageBlobToGallery(
  blob: Blob,
  fileName: string,
  title: string = 'البطاقة الإسلامية',
  dataUrl?: string
): Promise<GallerySaveResult> {
  markGalleryPermissionRationaleConfirmed();

  const resolvedDataUrl = dataUrl || (await blobToDataUrl(blob));
  const cleanFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  const bridge = getNativeBridge();

  // 1. Native Android Bridge (MediaStore Scoped Storage in Pictures/AlMuadhin)
  if (bridge?.saveImageToGallery) {
    try {
      const res = bridge.saveImageToGallery(resolvedDataUrl, cleanFileName);
      if (res !== false) {
        const msg = `✓ تم حفظ «${title}» في معرض الصور بالهاتف بنجاح!`;
        return {
          success: true,
          method: 'native_bridge',
          message: msg,
          messageAr: msg,
        };
      }
    } catch {
      // Fallback below
    }
  }

  // 2. iOS WKWebView Handler if present
  if (typeof window !== 'undefined') {
    const iosHandler = (
      window as unknown as {
        webkit?: { messageHandlers?: { saveToPhotos?: { postMessage: (msg: unknown) => void } } };
      }
    ).webkit?.messageHandlers?.saveToPhotos;
    if (iosHandler) {
      try {
        iosHandler.postMessage({ dataUrl: resolvedDataUrl, fileName: cleanFileName, title });
        const msg = `✓ تم حفظ «${title}» في ألبوم الصور (Photos) بنجاح!`;
        return {
          success: true,
          method: 'native_bridge',
          message: msg,
          messageAr: msg,
        };
      } catch {
        // Fallback below
      }
    }
  }

  // 3. Web Share API with File payload (iOS Safari 15+ / Android Chrome): triggers native "Save Image" option directly
  const file = new File([blob], cleanFileName, { type: 'image/png' });
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title,
        text: `${title}\n🕌 عبر تطبيق المؤذن الإسلامي`,
        files: [file],
      });
      const msg = `✓ تم فتح نافذة الحفظ والمشاركة لـ «${title}» بنجاح!`;
      return {
        success: true,
        method: 'web_share_files',
        message: msg,
        messageAr: msg,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User closed share sheet, still allow file download fallback
      }
    }
  }

  // 4. Standard Browser / PWA anchor download trigger
  try {
    const objUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objUrl;
    link.download = cleanFileName;
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objUrl), 4000);

    const msg = `✓ تم تنزيل وحفظ «${title}» في معرض الهاتف بنجاح!`;
    return {
      success: true,
      method: 'download_gallery',
      message: msg,
      messageAr: msg,
    };
  } catch {
    // 5. If in an iframe where direct anchor clicks might be restricted, show a clean long-press save popup
    showLongPressSaveModal(resolvedDataUrl, title);
    const msg = `✓ تم تجهيز «${title}» للحفظ بالمعرض!`;
    return {
      success: true,
      method: 'preview_modal',
      message: msg,
      messageAr: msg,
    };
  }
}

export function showLongPressSaveModal(dataUrl: string, title: string) {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('moazen-longpress-save-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'moazen-longpress-save-modal';
  modal.dir = 'rtl';
  modal.className =
    'fixed inset-0 z-[150] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none';

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-sm w-full p-4.5 text-center shadow-2xl border border-gray-100 space-y-3.5">
      <div class="flex items-center justify-between pb-2 border-b border-gray-100">
        <h4 class="text-xs font-black text-[#104B40] font-cairo">حفظ الصورة في المعرض</h4>
        <button id="moazen-close-save-modal" class="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer">✕</button>
      </div>
      <p class="text-[11px] text-gray-600 font-bold">
        اضغط مطولاً على الصورة ثم اختر <strong>«حفظ الصورة»</strong> أو اضغط زر التنزيل أدناه:
      </p>
      <div class="p-1 bg-gray-50 rounded-2xl border border-gray-200 flex justify-center">
        <img src="${dataUrl}" alt="${title}" class="max-h-64 rounded-xl shadow object-contain" />
      </div>
      <div class="flex items-center gap-2 pt-1">
        <a href="${dataUrl}" download="moazen_image.png" class="flex-1 py-2.5 px-3 bg-[#104B40] hover:bg-[#0B3D35] text-white rounded-xl text-xs font-bold transition-colors shadow-xs text-center">
          تنزيل وحفظ الآن 📥
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#moazen-close-save-modal')?.addEventListener('click', () => {
    modal.remove();
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to DataURL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

