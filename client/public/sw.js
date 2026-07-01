const CACHE_NAME = 'guitar-note-trainer-v4';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: pre-cache the app shell
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

// Is this a navigation / app-shell request? These must be network-first so a
// new deploy's index.html (and the new hashed bundle it references) is picked
// up immediately. Hashed assets are safe to serve cache-first — the hash
// changes whenever their contents change.
function isAppShell(request, url) {
  return request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html';
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API requests
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api')) {
    return;
  }

  // Network-first for the app shell: always try to get the freshest index.html,
  // fall back to cache only when offline.
  if (isAppShell(event.request, url)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() =>
        caches.match(event.request).then((cached) =>
          cached || caches.match('/index.html') ||
          new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
        )
      )
    );
    return;
  }

  // Cache-first for everything else (hashed assets, etc.)
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
