// Service Worker for FitForge PWA
const CACHE_NAME = 'fitforge-v2';
const API_CACHE_NAME = 'fitforge-api-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/styles.css',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('[SW] Cache install failed:', err);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all pages
});

// Stale-while-revalidate strategy for API GET requests
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh data
  const fetchPromise = fetch(request)
    .then((response) => {
      // Only cache successful GET responses
      if (response.ok && request.method === 'GET') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      // Network failed, return cached if available
      if (cachedResponse) {
        return cachedResponse;
      }
      throw new Error('Network failed and no cache available');
    });
  
  // Return cached immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Network-first strategy for API POST/PUT/DELETE
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Network failed - for mutations, we can't use cache
    throw error;
  }
}

// Fetch event - handle different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API requests
  if (url.pathname.startsWith('/api/')) {
    // GET requests: stale-while-revalidate
    if (request.method === 'GET') {
      event.respondWith(staleWhileRevalidate(request));
    } else {
      // POST/PUT/DELETE: network-first (don't cache)
      event.respondWith(networkFirst(request));
    }
    return;
  }
  
  // App shell: cache-first
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(request).then((response) => {
          // Only cache successful GET responses for app shell
          if (response.ok && request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page if available
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});
