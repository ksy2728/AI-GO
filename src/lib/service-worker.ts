/**
 * Service Worker for advanced caching and offline functionality
 * Implements comprehensive caching strategies with real-time data bypass
 */

declare const self: any;

const CACHE_VERSION = 'v3'
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
  /^\/api\/monitoring/
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/v1\/providers/,
  /^\/api\/v1\/intelligence-index/,
  /^\/api\/v1\/news/,
  /^\/api\/v1\/pricing/,
  /^\/api\/v1\/benchmarks/
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

export class ServiceWorkerManager {
  private cacheName: string

  constructor(cacheName: string = CACHE_NAMES.dynamic) {
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

    // IMPORTANT: Check if this is a real-time endpoint that should never be cached
    if (this.isNoCacheAPI(url)) {
      return this.networkOnlyStrategy(request)
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
      // For models and other important API endpoints, use network-first
      if (url.pathname.startsWith('/api/v1/models')) {
        return this.networkFirstStrategy(request, CACHE_NAMES.api)
      }
      return this.staleWhileRevalidateStrategy(request, CACHE_NAMES.api)
    }

    // Default: Network first with cache fallback
    return this.networkFirstStrategy(request, CACHE_NAMES.dynamic)
  }

  // Network only strategy - for real-time data
  private async networkOnlyStrategy(request: Request): Promise<Response> {
    try {
      return await fetch(request)
    } catch (error) {
      console.error('[SW] Network request failed for real-time data:', error)
      throw error
    }
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

    // Fetch fresh data in the background
    const fetchPromise = fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          await cache.put(request, networkResponse.clone())
          await this.setCacheTimestamp(request, cacheName)
        }
        return networkResponse
      })
      .catch(() => cachedResponse)

    // Return cached data immediately if available
    if (cachedResponse) {
      // Check cache validity
      const cacheTime = await this.getCacheTimestamp(request, cacheName)
      const duration = this.getCacheDuration(cacheName)

      if (Date.now() - cacheTime < duration * 1000) {
        // Return cached version and update in background
        fetchPromise.catch(() => {}) // Prevent unhandled rejection
        return cachedResponse
      }
    }

    // Wait for network if no cache or cache expired
    return fetchPromise as Promise<Response> || fetch(request)
  }

  // Check if URL is a no-cache API endpoint
  private isNoCacheAPI(url: URL): boolean {
    return NO_CACHE_API_PATTERNS.some(pattern => pattern.test(url.pathname))
  }

  // Check if request is for static resources
  private isStaticResource(url: URL): boolean {
    return STATIC_CACHE_URLS.includes(url.pathname) ||
      url.pathname.startsWith('/_next/static/')
  }

  // Check if request is for images
  private isImageRequest(url: URL): boolean {
    return IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
  }

  // Check if request is for fonts
  private isFontRequest(url: URL): boolean {
    return FONT_CACHE_PATTERNS.some(pattern =>
      pattern.test(url.pathname) || pattern.test(url.hostname)
    )
  }

  // Check if request is for API
  private isAPIRequest(url: URL): boolean {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
  }

  // Get cache duration for a cache type
  private getCacheDuration(cacheName: string): number {
    const type = Object.entries(CACHE_NAMES).find(([_, name]) => name === cacheName)?.[0]
    return CACHE_DURATIONS[type as keyof typeof CACHE_DURATIONS] || CACHE_DURATIONS.dynamic
  }

  // Store cache timestamp
  private async setCacheTimestamp(request: Request, cacheName: string): Promise<void> {
    const timestampCache = await caches.open(`${cacheName}-timestamps`)
    const timestamp = new Response(JSON.stringify({ timestamp: Date.now() }))
    await timestampCache.put(request, timestamp)
  }

  // Get cache timestamp
  private async getCacheTimestamp(request: Request, cacheName: string): Promise<number> {
    const timestampCache = await caches.open(`${cacheName}-timestamps`)
    const response = await timestampCache.match(request)

    if (response) {
      const data = await response.json()
      return data.timestamp
    }

    return 0
  }
}

// Export functions for compatibility
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js')
        console.log('[SW] Service Worker registered:', registration)
      } catch (error) {
        console.error('[SW] Service Worker registration failed:', error)
      }
    })
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister())
    })
  }
}

export const setupServiceWorker = registerServiceWorker