/**
 * Service Worker for AI Server Information App
 * Optimized for mobile performance and offline functionality
 */

const CACHE_VERSION = 'v2.1'
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  fonts: `fonts-${CACHE_VERSION}`
}

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  static: 24 * 60 * 60 * 1000, // 24 hours
  dynamic: 30 * 60 * 1000,     // 30 minutes
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
  api: 5 * 60 * 1000,          // 5 minutes
  fonts: 30 * 24 * 60 * 60 * 1000 // 30 days
}

// Static resources to precache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
]

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker', CACHE_VERSION)

  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        console.log('[SW] Precaching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets precached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to precache static assets:', error)
      })
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker', CACHE_VERSION)

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const deletePromises = cacheNames
          .filter((name) => !Object.values(CACHE_NAMES).includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })

        return Promise.all(deletePromises)
      })
      .then(() => {
        console.log('[SW] Old caches cleaned')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }

  event.respondWith(handleFetchRequest(request))
})

async function handleFetchRequest(request) {
  const url = new URL(request.url)

  try {
    // Route to appropriate caching strategy
    if (isStaticResource(url)) {
      return await cacheFirstStrategy(request, CACHE_NAMES.static)
    }

    if (isImageRequest(url)) {
      return await cacheFirstStrategy(request, CACHE_NAMES.images)
    }

    if (isFontRequest(url)) {
      return await cacheFirstStrategy(request, CACHE_NAMES.fonts)
    }

    if (isAPIRequest(url)) {
      return await staleWhileRevalidateStrategy(request, CACHE_NAMES.api)
    }

    // Default: Network first with cache fallback
    return await networkFirstStrategy(request, CACHE_NAMES.dynamic)

  } catch (error) {
    console.error('[SW] Fetch error:', error)

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAMES.static)
      const offlineResponse = await cache.match('/offline.html')
      if (offlineResponse) {
        return offlineResponse
      }
    }

    throw error
  }
}

// Cache first strategy - good for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    // Check if cache is still valid
    const cacheTime = await getCacheTimestamp(request, cacheName)
    const maxAge = getCacheMaxAge(cacheName)

    if (Date.now() - cacheTime < maxAge) {
      return cachedResponse
    }
  }

  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
      await setCacheTimestamp(request, cacheName)
    }

    return networkResponse
  } catch (error) {
    // Return stale cache if available
    if (cachedResponse) {
      console.log('[SW] Returning stale cache due to network error')
      return cachedResponse
    }
    throw error
  }
}

// Network first strategy - good for dynamic content
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      await cache.put(request, networkResponse.clone())
      await setCacheTimestamp(request, cacheName)
    }

    return networkResponse
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      console.log('[SW] Network failed, returning cached response')
      return cachedResponse
    }

    throw error
  }
}

// Stale while revalidate strategy - good for API requests
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  // Update cache in background
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone())
        await setCacheTimestamp(request, cacheName)
      }
      return response
    })
    .catch(() => {
      // Ignore network errors in background update
    })

  // Return cached response immediately if available
  if (cachedResponse) {
    // Don't await the network promise - let it update in background
    networkPromise
    return cachedResponse
  }

  // No cached response, wait for network
  return await networkPromise
}

// Helper functions
function isStaticResource(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  )
}

function isImageRequest(url) {
  return (
    /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(url.pathname) ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/images/')
  )
}

function isFontRequest(url) {
  return (
    /\.(woff|woff2|ttf|otf)$/i.test(url.pathname) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  )
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/')
}

function getCacheMaxAge(cacheName) {
  return CACHE_DURATIONS[cacheName] || CACHE_DURATIONS.dynamic
}

async function setCacheTimestamp(request, cacheName) {
  try {
    const timestampCache = await caches.open('timestamps')
    const key = `${cacheName}-${request.url}`
    const response = new Response(Date.now().toString())
    await timestampCache.put(key, response)
  } catch (error) {
    console.warn('[SW] Failed to set timestamp:', error)
  }
}

async function getCacheTimestamp(request, cacheName) {
  try {
    const timestampCache = await caches.open('timestamps')
    const key = `${cacheName}-${request.url}`
    const response = await timestampCache.match(key)

    if (response) {
      const timestamp = await response.text()
      return parseInt(timestamp, 10)
    }
  } catch (error) {
    console.warn('[SW] Failed to get timestamp:', error)
  }
  return 0
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  try {
    // Preload critical API endpoints when back online
    const criticalEndpoints = [
      '/api/v1/models',
      '/api/v1/providers',
      '/api/v1/intelligence-index'
    ]

    const cache = await caches.open(CACHE_NAMES.api)

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint)
        if (response.ok) {
          await cache.put(endpoint, response.clone())
          await setCacheTimestamp(new Request(endpoint), CACHE_NAMES.api)
        }
      } catch (error) {
        console.warn('[SW] Failed to sync endpoint:', endpoint, error)
      }
    }

    console.log('[SW] Background sync completed')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  let notificationData = {
    title: 'AI Server Status',
    body: 'Model status update available',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'status-update',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Status'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (error) {
      console.warn('[SW] Failed to parse push data:', error)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.openWindow('/status')
        .then((client) => {
          if (client) {
            client.focus()
          }
        })
    )
  }
})

// Skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

console.log('[SW] Service worker script loaded', CACHE_VERSION)