/**
 * Service Worker for advanced caching and offline functionality
 * Implements comprehensive caching strategies for mobile optimization
 */

const CACHE_VERSION = 'v2'
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  fonts: `fonts-${CACHE_VERSION}`
}

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  static: 24 * 60 * 60, // 24 hours
  dynamic: 30 * 60,     // 30 minutes
  images: 7 * 24 * 60 * 60, // 7 days
  api: 5 * 60,          // 5 minutes
  fonts: 30 * 24 * 60 * 60 // 30 days
}

// Resources to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/v1\/models/,
  /^\/api\/v1\/providers/,
  /^\/api\/v1\/intelligence-index/,
  /^\/api\/v1\/status/
]

// Image patterns to cache
const IMAGE_CACHE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/,
  /\/_next\/image/,
  /\/images\//
]

// Font patterns
const FONT_CACHE_PATTERNS = [
  /\.(woff|woff2|ttf|otf)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
]

interface CacheResponse {
  response: Response
  timestamp: number
}

class ServiceWorkerManager {
  private cacheName: string

  constructor(cacheName: string) {
    this.cacheName = cacheName
  }

  // Install event - cache static resources
  async handleInstall(event: any): Promise<void> {
    const cache = await caches.open(CACHE_NAMES.static)

    try {
      await cache.addAll(STATIC_CACHE_URLS)
      console.log('[SW] Static resources cached successfully')
    } catch (error) {
      console.error('[SW] Failed to cache static resources:', error)
    }

    // Skip waiting to activate immediately
    self.skipWaiting()
  }

  // Activate event - clean old caches
  async handleActivate(event: any): Promise<void> {
    const cacheNames = await caches.keys()

    const deletePromises = cacheNames
      .filter(name => !Object.values(CACHE_NAMES).includes(name))
      .map(name => {
        console.log('[SW] Deleting old cache:', name)
        return caches.delete(name)
      })

    await Promise.all(deletePromises)

    // Take control of all pages
    return self.clients.claim()
  }

  // Fetch event - implement caching strategies
  async handleFetch(event: any): Promise<Response> {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== 'GET') {
      return fetch(request)
    }

    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') {
      return fetch(request)
    }

    // Route to appropriate strategy
    if (this.isStaticResource(url)) {
      return this.cacheFirstStrategy(request, CACHE_NAMES.static)
    }

    if (this.isImageRequest(url)) {
      return this.cacheFirstStrategy(request, CACHE_NAMES.images)
    }

    if (this.isFontRequest(url)) {
      return this.cacheFirstStrategy(request, CACHE_NAMES.fonts)
    }

    if (this.isAPIRequest(url)) {
      return this.staleWhileRevalidateStrategy(request, CACHE_NAMES.api)
    }

    // Default: Network first with cache fallback
    return this.networkFirstStrategy(request, CACHE_NAMES.dynamic)
  }

  // Cache first strategy - for static resources
  private async cacheFirstStrategy(request: Request, cacheName: string): Promise<Response> {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      // Check if cache is still valid
      const cacheTime = await this.getCacheTimestamp(request, cacheName)
      const duration = this.getCacheDuration(cacheName)

      if (Date.now() - cacheTime < duration * 1000) {
        return cachedResponse
      }
    }

    try {
      const networkResponse = await fetch(request)

      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone())
        await this.setCacheTimestamp(request, cacheName)
      }

      return networkResponse
    } catch (error) {
      if (cachedResponse) {
        return cachedResponse
      }
      throw error
    }
  }

  // Network first strategy - for dynamic content
  private async networkFirstStrategy(request: Request, cacheName: string): Promise<Response> {
    try {
      const networkResponse = await fetch(request)

      if (networkResponse.ok) {
        const cache = await caches.open(cacheName)
        await cache.put(request, networkResponse.clone())
        await this.setCacheTimestamp(request, cacheName)
      }

      return networkResponse
    } catch (error) {
      const cache = await caches.open(cacheName)
      const cachedResponse = await cache.match(request)

      if (cachedResponse) {
        return cachedResponse
      }

      // Return offline page for navigation requests
      if (request.mode === 'navigate') {
        const offlineResponse = await cache.match('/offline.html')
        if (offlineResponse) {
          return offlineResponse
        }
      }

      throw error
    }
  }

  // Stale while revalidate - for API requests
  private async staleWhileRevalidateStrategy(request: Request, cacheName: string): Promise<Response> {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)

    // Fetch from network in background
    const networkPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone())
        await this.setCacheTimestamp(request, cacheName)
      }
      return networkResponse
    }).catch(() => {
      // Network failed, ignore
    })

    // Return cached version immediately if available
    if (cachedResponse) {
      networkPromise // Don't await, let it update in background
      return cachedResponse
    }

    // No cached version, wait for network
    try {
      return await networkPromise
    } catch (error) {
      throw error
    }
  }

  // Helper methods
  private isStaticResource(url: URL): boolean {
    return (
      url.pathname.startsWith('/_next/static/') ||
      url.pathname === '/manifest.json' ||
      url.pathname === '/favicon.ico' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')
    )
  }

  private isImageRequest(url: URL): boolean {
    return IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
  }

  private isFontRequest(url: URL): boolean {
    return FONT_CACHE_PATTERNS.some(pattern => pattern.test(url.href))
  }

  private isAPIRequest(url: URL): boolean {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
  }

  private getCacheDuration(cacheName: string): number {
    switch (cacheName) {
      case CACHE_NAMES.static: return CACHE_DURATIONS.static
      case CACHE_NAMES.dynamic: return CACHE_DURATIONS.dynamic
      case CACHE_NAMES.images: return CACHE_DURATIONS.images
      case CACHE_NAMES.api: return CACHE_DURATIONS.api
      case CACHE_NAMES.fonts: return CACHE_DURATIONS.fonts
      default: return CACHE_DURATIONS.dynamic
    }
  }

  private async setCacheTimestamp(request: Request, cacheName: string): Promise<void> {
    const key = `${cacheName}-${request.url}-timestamp`
    try {
      const cache = await caches.open('timestamps')
      const response = new Response(Date.now().toString())
      await cache.put(key, response)
    } catch (error) {
      console.warn('[SW] Failed to set cache timestamp:', error)
    }
  }

  private async getCacheTimestamp(request: Request, cacheName: string): Promise<number> {
    const key = `${cacheName}-${request.url}-timestamp`
    try {
      const cache = await caches.open('timestamps')
      const response = await cache.match(key)
      if (response) {
        const timestamp = await response.text()
        return parseInt(timestamp, 10)
      }
    } catch (error) {
      console.warn('[SW] Failed to get cache timestamp:', error)
    }
    return 0
  }

  // Background sync for API requests
  async handleBackgroundSync(tag: string): Promise<void> {
    console.log('[SW] Background sync:', tag)

    if (tag === 'api-sync') {
      await this.syncAPIData()
    }
  }

  private async syncAPIData(): Promise<void> {
    try {
      // Sync critical API endpoints when back online
      const endpoints = [
        '/api/v1/models',
        '/api/v1/providers',
        '/api/v1/intelligence-index'
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint)
          if (response.ok) {
            const cache = await caches.open(CACHE_NAMES.api)
            await cache.put(endpoint, response.clone())
          }
        } catch (error) {
          console.warn('[SW] Failed to sync:', endpoint, error)
        }
      }
    } catch (error) {
      console.error('[SW] Background sync failed:', error)
    }
  }

  // Push notification handler
  async handlePush(event: PushEvent): Promise<void> {
    const options = {
      body: 'AI model status update available',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'status-update',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Status',
          icon: '/icon-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icon-dismiss.png'
        }
      ]
    }

    if (event.data) {
      try {
        const data = event.data.json()
        options.body = data.message || options.body
      } catch (error) {
        console.warn('[SW] Failed to parse push data:', error)
      }
    }

    await self.registration.showNotification('AI Server Status', options)
  }

  // Notification click handler
  async handleNotificationClick(event: NotificationEvent): Promise<void> {
    event.notification.close()

    if (event.action === 'view') {
      const client = await self.clients.openWindow('/')
      if (client) {
        client.focus()
      }
    }
  }
}

// Initialize service worker
const swManager = new ServiceWorkerManager(CACHE_VERSION)

// Event listeners
self.addEventListener('install', (event: any) => {
  event.waitUntil(swManager.handleInstall(event))
})

self.addEventListener('activate', (event: any) => {
  event.waitUntil(swManager.handleActivate(event))
})

self.addEventListener('fetch', (event: any) => {
  event.respondWith(swManager.handleFetch(event))
})

self.addEventListener('sync', (event: any) => {
  event.waitUntil(swManager.handleBackgroundSync(event.tag))
})

self.addEventListener('push', (event: PushEvent) => {
  event.waitUntil(swManager.handlePush(event))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.waitUntil(swManager.handleNotificationClick(event))
})

// Skip waiting when requested
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

export { swManager }