const CACHE_NAME = 'grand-tour-v8';
const OFFLINE_URL = '/offline.html';

// Only cache truly static CDN resources (versioned/immutable)
const STATIC_CDN = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://grainy-gradients.vercel.app/noise.svg',
  'https://cdn-icons-png.flaticon.com/512/854/854878.png',
  OFFLINE_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CDN))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and API calls entirely
  if (request.method !== 'GET') return;
  if (request.url.includes('generativelanguage.googleapis.com')) return;
  if (request.url.includes('places.googleapis.com')) return;

  // Network-first for everything — fall back to cache only when offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for offline fallback
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        })
      )
  );
});
