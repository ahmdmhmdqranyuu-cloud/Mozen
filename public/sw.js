// Service Worker for المؤذن الإسلامي (Android & iOS Offline-First Application)
// Pre-caches all sections, audio files (including Iqama 1, 2, 3), icons, images, and Quran data for 100% offline operation

const CACHE_NAME = 'moazen-islamic-app-v9';
const MAP_CACHE_NAME = 'moazen-map-tiles-v1';
const MAX_CACHED_TILES = 500;
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data/quran_uthmani.json',
  // All Iqama audio files integrated in the project
  '/audio/iqama.mp3',
  '/audio/iqama_1.mp3',
  '/audio/iqama_2.mp3',
  '/audio/iqama_3.mp3',
  // All Azan & Islamic audio files
  '/audio/makkah.mp3',
  '/audio/madinah.mp3',
  '/audio/fajr.mp3',
  '/audio/alafasy.mp3',
  '/audio/abdulbasit.mp3',
  '/audio/abdulbasit_fajr.mp3',
  '/audio/alaqsa.mp3',
  '/audio/cairo.mp3',
  '/audio/hussary.mp3',
  '/audio/ibrahim_madani.mp3',
  '/audio/mohamed_rifaat.mp3',
  '/audio/mustafa_ismail.mp3',
  '/audio/nasser_alqatami.mp3',
  '/audio/toubar_fajr.mp3',
  '/audio/salawat_1.mp3',
  '/audio/salawat_2.mp3',
  '/audio/salawat_3.mp3',
  '/audio/azkar_sabah.mp3',
  '/audio/azkar_massa.mp3',
  '/audio/musaharati_1.mp3',
  '/audio/musaharati_2.mp3',
  '/audio/iftar_cannon.mp3',
  // All PNG Section & Navigation Icons
  '/assets/icons/azkar.png',
  '/assets/icons/dua.png',
  '/assets/icons/hadith.png',
  '/assets/icons/hajj.png',
  '/assets/icons/masajid.png',
  '/assets/icons/more.png',
  '/assets/icons/prayer.png',
  '/assets/icons/qibla.png',
  '/assets/icons/quran.png',
  '/assets/icons/seerah.png',
  '/assets/icons/settings.png',
  '/assets/icons/tasbih.png',
  '/assets/icons/names.png',
  '/assets/icons/recitations.png',
  '/assets/icons/wallpapers.png',
  '/assets/icons/quiz.png',
  '/assets/icons/ramadan.png',
  '/assets/icons/ruqyah.png',
  '/assets/icons/prophets.png',
  '/assets/icons/nav_home.png',
  '/assets/icons/nav_prayer.png',
  '/assets/icons/nav_quran.png',
  '/assets/icons/nav_qibla.png',
  '/assets/icons/nav_settings.png',
  // Settings Page Widgets & Banners
  '/assets/settings/settings_header.jpg',
  '/assets/settings/settings_footer_mosque.jpg',
  '/assets/settings/widget_location.jpg',
  '/assets/settings/widget_azan.jpg',
  '/assets/settings/widget_azkar.jpg',
  '/assets/settings/widget_ramadan.jpg',
  '/assets/settings/widget_profile.jpg',
  '/assets/settings/widget_privacy.jpg',
  '/assets/settings/widget_about.jpg',
  '/assets/settings/widget_logout.jpg',
  '/assets/settings/widget_language.png',
  '/assets/settings/widget_permissions.png',
  // App Images & Wallpapers
  '/assets/images/home_header_mosque.jpg',
  '/assets/images/mosque_header_bg_1792330870635.jpg',
  '/assets/images/mosque_sunset_header_1792265336563.jpg',
  '/assets/images/open_mushaf_rehal_1792331334829.jpg',
  '/assets/images/quran_rehal_wood_1792265354181.jpg',
  '/assets/images/tasbih_prayer_beads_1792265378950.jpg',
  '/assets/images/hadith_widget_mosque_1793589264940.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache each asset individually so one missing optional asset never aborts the entire batch
      await Promise.allSettled(
        OFFLINE_ASSETS.map((assetUrl) =>
          cache.add(assetUrl).catch((err) => {
            console.warn('[SW] Skipping asset during install:', assetUrl, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Offline-First Strategy for static assets, audio, images, and app shell
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Intercept and cache Map Tiles (OpenStreetMap, Carto, Stamen, etc.)
  const isMapTile =
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.hostname.includes('tile.stamen.com') ||
    url.hostname.includes('tile.openstreetmap.fr') ||
    (url.pathname.includes('/tile/') || /\/\d+\/\d+\/\d+\.png$/.test(url.pathname));

  if (isMapTile) {
    event.respondWith(
      caches.open(MAP_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          if (navigator.onLine) {
            fetch(event.request)
              .then((netResp) => {
                if (netResp && netResp.status === 200) {
                  cache.put(event.request, netResp.clone());
                }
              })
              .catch(() => {});
          }
          return cached;
        }

        try {
          const netResp = await fetch(event.request);
          if (netResp && netResp.status === 200) {
            cache.keys().then((keys) => {
              if (keys.length >= MAX_CACHED_TILES) {
                for (let i = 0; i < 50; i++) {
                  if (keys[i]) cache.delete(keys[i]);
                }
              }
            });
            cache.put(event.request, netResp.clone());
          }
          return netResp;
        } catch {
          return new Response('', { status: 408, statusText: 'Offline map tile not in cache' });
        }
      })
    );
    return;
  }

  // Only handle same-origin requests or font stylesheets
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) {
    return;
  }

  // Cache-First for local audio, data, icons, and images
  if (
    url.pathname.startsWith('/audio/') ||
    url.pathname.startsWith('/data/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/src/assets/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(() => new Response('Offline asset unavailable', { status: 404 }));
      })
    );
    return;
  }

  // Stale-While-Revalidate / Network-with-Cache-Fallback for app shell, JS, CSS, and fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Notification click handling (supports direct routing to specific permission page or restoring Smart Azan Widget)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'MOAZEN_NAVIGATE_HOME' });
          if (data.action === 'openPermissionPage' && data.permissionKey) {
            client.postMessage({
              type: 'MOAZEN_OPEN_PERMISSION_DIRECT',
              permissionKey: data.permissionKey,
            });
          } else if (data.action === 'restoreSmartAzanWidget') {
            client.postMessage({
              type: 'MOAZEN_RESTORE_SMART_AZAN_WIDGET',
            });
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
