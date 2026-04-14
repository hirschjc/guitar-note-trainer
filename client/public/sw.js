const CACHE_NAME = 'guitar-note-trainer-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for app shell, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET and API requests
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Network failed and nothing in cache — return a basic offline response
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    }).catch(() => {
      // Cache lookup failed — try network directly
      return fetch(event.request);
    })
  );
});
