/* ========================================
   IMELEC - Service Worker
   Cache-first strategy for static assets
   ======================================== */

const CACHE_NAME = 'imelec-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/servicios.html',
    '/contacto.html',
    '/privacidad.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/contact.js',
    '/img/averias.webp',
    '/img/recarga.webp',
    '/favicon.svg',
    '/sitemap.xml',
    '/robots.txt'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: cache-first for static assets, network-first for others
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests (let browser handle them)
    if (!request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                // Cache successful responses for static assets
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // If offline and not cached, show fallback (optional)
                return cachedResponse;
            });
        })
    );
});
