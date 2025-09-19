'use client'

import { useEffect, useState } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isUpdateAvailable: boolean
  registration: ServiceWorkerRegistration | null
  error: string | null
}

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
    error: null
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setSwState(prev => ({ ...prev, isSupported: true }))
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      })

      setSwState(prev => ({
        ...prev,
        isRegistered: true,
        registration
      }))

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              setSwState(prev => ({
                ...prev,
                isUpdateAvailable: true
              }))

              // Notify user about update
              showUpdateNotification()
            }
          })
        }
      })

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message received:', event.data)
      })

      // Check for existing update
      if (registration.waiting) {
        setSwState(prev => ({
          ...prev,
          isUpdateAvailable: true
        }))
        showUpdateNotification()
      }

      // Check for updates periodically
      setInterval(() => {
        registration.update()
      }, 60000) // Check every minute

      console.log('[SW] Service worker registered successfully')
    } catch (error) {
      console.error('[SW] Service worker registration failed:', error)
      setSwState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed'
      }))
    }
  }

  const showUpdateNotification = () => {
    // Show a subtle notification about the update
    if (Notification.permission === 'granted') {
      new Notification('App Update Available', {
        body: 'A new version of the app is available. Refresh to update.',
        icon: '/icon-192.png',
        tag: 'app-update'
      })
    }

    // You could also show an in-app banner here
    console.log('[SW] Update available - refresh to apply')
  }

  const applyUpdate = async () => {
    if (swState.registration && swState.registration.waiting) {
      // Send message to skip waiting
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      // Listen for controlling change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('[SW] Notification permission:', permission)
      })
    }
  }, [])

  return (
    <>
      {children}

      {/* Update notification banner */}
      {swState.isUpdateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">App Update Available</p>
              <p className="text-sm opacity-90">A new version is ready to install</p>
            </div>
            <button
              onClick={applyUpdate}
              className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* Development info */}
      {process.env.NODE_ENV === 'development' && swState.isSupported && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          SW: {swState.isRegistered ? '✅' : '❌'} |
          Update: {swState.isUpdateAvailable ? '🆕' : '✅'}
        </div>
      )}
    </>
  )
}

// Hook to use service worker state
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
    error: null
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setState(prev => ({ ...prev, isSupported: true }))

      navigator.serviceWorker.ready.then((registration) => {
        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration
        }))
      })
    }
  }, [])

  const syncInBackground = async (tag: string = 'background-sync') => {
    if (state.registration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await (state.registration as any).sync.register(tag)
        console.log('[SW] Background sync registered:', tag)
      } catch (error) {
        console.error('[SW] Background sync failed:', error)
      }
    }
  }

  return {
    ...state,
    syncInBackground
  }
}

// Service worker utilities
export const serviceWorkerUtils = {
  // Check if app is running in standalone mode (PWA)
  isStandalone: () => {
    return typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    )
  },

  // Check if app can be installed
  canInstall: () => {
    return typeof window !== 'undefined' && 'beforeinstallprompt' in window
  },

  // Get cache usage
  getCacheUsage: async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.quota ? Math.round((estimate.usage || 0) / estimate.quota * 100) : 0
        }
      } catch (error) {
        console.error('[SW] Failed to get storage estimate:', error)
      }
    }
    return null
  },

  // Clear all caches
  clearCaches: async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        console.log('[SW] All caches cleared')
        return true
      } catch (error) {
        console.error('[SW] Failed to clear caches:', error)
        return false
      }
    }
    return false
  }
}