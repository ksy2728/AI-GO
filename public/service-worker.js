/**
 * Service Worker for AI Server Information
 * Version: 3.0.0
 *
 * Implements intelligent caching strategies with real-time data bypass
 */

const CACHE_VERSION = 'v3';
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  fonts: `fonts-${CACHE_VERSION}`
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  static: 24 * 60 * 60, // 24 hours
  dynamic: 30 * 60,     // 30 minutes
  images: 7 * 24 * 60 * 60, // 7 days
  api: 5 * 60,          // 5 minutes
  fonts: 30 * 24 * 60 * 60 // 30 days
};

// Resources to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints that should NEVER be cached (real-time data)
const NO_CACHE_API_PATTERNS = [
  /^\/api\/v1\/realtime-stats/,
  /^\/api\/v1\/realtime-status/,
  /^\/api\/v1\/models$/, // Main models endpoint should be fresh
  /^\/api\/v1\/models\/stats/,
  /^\/api\/v1\/models\/highlights/,
  /^\/api\/v1\/models\/metrics/,
  /^\/api\/v1\/aa-sync/,
  /^\/api\/v1\/sync/,
  /^\/api\/cron/,
  /^\/api\/monitoring/,
  /^\/api\/status-checker/
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/v1\/providers/,
  /^\/api\/v1\/intelligence-index/,
  /^\/api\/v1\/news/,
  /^\/api\/v1\/pricing/,
  /^\/api\/v1\/benchmarks/
];

// Image patterns to cache
const IMAGE_CACHE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/,
  /\/_next\/image/,
  /\/images\//
];

// Font patterns
const FONT_CACHE_PATTERNS = [
  /\.(woff|woff2|ttf|otf)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v3...');

  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch(err => {
        console.error('[SW] Failed to cache static resources:', err);
      })
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v3...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => !Object.values(CACHE_NAMES).includes(name))
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Check if this is a no-cache API endpoint
  const isNoCacheAPI = NO_CACHE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
  if (isNoCacheAPI) {
    event.respondWith(
      fetch(request).catch(err => {
        console.error('[SW] Network request failed for real-time data:', err);
        throw err;
      })
    );
    return;
  }

  // Check request type and apply appropriate strategy
  let responsePromise;

  if (isStaticResource(url)) {
    responsePromise = cacheFirst(request, CACHE_NAMES.static);
  } else if (isImageRequest(url)) {
    responsePromise = cacheFirst(request, CACHE_NAMES.images);
  } else if (isFontRequest(url)) {
    responsePromise = cacheFirst(request, CACHE_NAMES.fonts);
  } else if (isAPIRequest(url)) {
    // For models endpoints, always use network-first
    if (url.pathname.startsWith('/api/v1/models')) {
      responsePromise = networkFirst(request, CACHE_NAMES.api);
    } else {
      responsePromise = staleWhileRevalidate(request, CACHE_NAMES.api);
    }
  } else {
    // Default: Network first
    responsePromise = networkFirst(request, CACHE_NAMES.dynamic);
  }

  event.respondWith(responsePromise);
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    throw error;
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving from cache after network failure');
      return cachedResponse;
    }

    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Helper functions
function isStaticResource(url) {
  return STATIC_CACHE_URLS.includes(url.pathname) ||
    url.pathname.startsWith('/_next/static/');
}

function isImageRequest(url) {
  return IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isFontRequest(url) {
  return FONT_CACHE_PATTERNS.some(pattern =>
    pattern.test(url.pathname) || pattern.test(url.hostname)
  );
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

console.log('[SW] Service Worker v3 loaded');