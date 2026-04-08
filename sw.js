'use strict';
const STATIC_CACHE = 'earthquake-static-v1';
const API_CACHE = 'earthquake-api-v1';
const STATIC_ASSETS = ['/','/index.html','/manifest.webapp'];
const CDN_ASSETS = ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => {
    cache.addAll(STATIC_ASSETS).catch(e => console.warn('[SW]', e));
    return Promise.all(CDN_ASSETS.map(url => fetch(url, {mode:'cors'}).then(r => r.ok && cache.put(url, r)).catch(() => {})));
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(n => n.startsWith('earthquake-') && n !== STATIC_CACHE && n !== API_CACHE).map(n => caches.delete(n))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.hostname.includes('earthquake.usgs.gov')) {
    event.respondWith(caches.open(API_CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request).then(r => { if(r.ok) cache.put(event.request, r.clone()); return r; }).catch(() => cached);
      return cached || fetchPromise;
    }));
    return;
  }
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(caches.open(STATIC_CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const r = await fetch(event.request);
      if (r.ok) cache.put(event.request, r.clone());
      return r;
    }));
  } else if (url.origin === location.origin) {
    event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
  }
});

self.addEventListener('push', (event) => {
  let data = { title: 'Earthquake Alert', body: 'New earthquake detected near Taiwan' };
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: 'img/icon-180.png', badge: 'img/icon-180.png',
    vibrate: [200, 100, 200], tag: data.data?.quakeId || 'earthquake-alert',
    renotify: true, data: { url: data.url || '/index.html' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/index.html';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
    for (const client of list) { if (client.url.includes('index') && 'focus' in client) return client.focus(); }
    return clients.openWindow(url);
  }));
});
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_CACHE') caches.keys().then(names => names.forEach(n => caches.delete(n)));
});
