const CACHE_NAME = 'mradhul-fashion-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/logo.png',
  '/favicon.png',
  '/banner_ethnic.png',
  '/banner_western.png',
  '/manifest.json'
];

// Never cache these — Firebase auth redirect routes, API calls, and
// cross-origin requests must always reach the network directly.
const NEVER_CACHE_PATTERNS = [
  /\/__\/auth\//,          // Firebase auth handler
  /\/api\//,               // Backend API
  /firebaseapp\.com/,      // Firebase domains
  /googleapis\.com/,       // Google APIs
  /accounts\.google\.com/, // Google accounts
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache same-origin GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Skip Firebase auth, API calls, and cross-origin requests — always network
  const shouldSkip = NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url));
  if (shouldSkip) return;

  // Skip cross-origin requests
  if (!url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        // Cache new assets dynamically
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Return offline fallback if offline
        return caches.match('/');
      });
    })
  );
});

