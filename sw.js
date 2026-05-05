'use strict';

const CACHE_VERSION = 'v2'; // Bump this when deploying
const CACHE_NAME = 'earthquake-' + CACHE_VERSION;
const API_CACHE = 'earthquake-api-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webapp',
  '/js/uuid.js',
  '/js/health.js',
  '/js/ota.js',
  '/app-config.json',
  '/favicon.ico'
];

const CDN_ASSETS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      cache.addAll(ASSETS_TO_CACHE).catch(e => console.warn('[SW] Cache failed:', e));
      return Promise.all(
        CDN_ASSETS.map(url =>
          fetch(url, {mode:'cors'}).then(r => r.ok && cache.put(url, r)).catch(() => {})
        )
      );
    })
  );
  // Don't skipWaiting automatically - let postMessage trigger it
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key.startsWith('earthquake-') && key !== CACHE_NAME && key !== API_CACHE)
           .map(key => caches.delete(key)) // Delete old caches
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // version.json: always fetch fresh (no cache)
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // index.html: network-first (ensure updates land)
  if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // USGS API: stale-while-revalidate with API cache
  if (url.hostname.includes('earthquake.usgs.gov')) {
    event.respondWith(
      caches.open(API_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then(r => {
          if (r.ok) cache.put(event.request, r.clone());
          return r;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // OpenStreetMap tiles: cache-first (tiles don't change)
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const r = await fetch(event.request);
        if (r.ok) cache.put(event.request, r.clone());
        return r;
      })
    );
    return;
  }

  // Static assets (js/css/img): stale-while-revalidate (fast + fresh)
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        });
        return cached || fetchPromise;
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Earthquake Alert', body: 'New earthquake detected near Taiwan' };
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'img/icon-180.png',
    badge: 'img/icon-180.png',
    vibrate: [200, 100, 200],
    tag: data.data?.quakeId || 'earthquake-alert',
    renotify: true,
    data: { url: data.url || '/index.html' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/index.html';
  event.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(list => {
      for (const client of list) {
        if (client.url.includes('index') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// Handle SKIP_WAITING message from page
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => names.forEach(n => caches.delete(n)));
  }
});
