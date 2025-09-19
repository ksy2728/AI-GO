/**
 * Minimal service worker stub to avoid build errors
 * The actual service worker implementation is temporarily disabled
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    console.log('[SW] Service worker registration disabled temporarily')
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    console.log('[SW] Service worker unregistration disabled temporarily')
  }
}

// Export empty functions to maintain compatibility
export const setupServiceWorker = () => {}
export const ServiceWorkerManager = class {
  constructor() {}
  async handleInstall(event: any) {}
  async handleActivate(event: any) {}
  async handleFetch(event: any) { return new Response('OK') }
}