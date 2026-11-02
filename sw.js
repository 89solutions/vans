// Offline support: answer from the cache straight away, refresh the cache in the background.
const CACHE = 'van-stock-v2';
const FILES = [
  './',
  'index.html',
  'stylesheet.css',
  'store.js',
  'starters.js',
  'app.js',
  'manifest.webmanifest',
  'favicon.svg',
  'images/icon-180.png',
  'images/icon-192.png',
  'images/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
      const fresh = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      });
      if (cached) {
        fresh.catch(() => {});
        return cached;
      }
      return fresh.catch(async (err) => {
        const page = request.mode === 'navigate' ? await cache.match('index.html') : undefined;
        if (page) return page;
        throw err;
      });
    })
  );
});
