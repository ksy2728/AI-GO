/**
 * Mobile-First Code Splitting Optimization
 * Provides mobile-specific lazy loading and performance optimizations
 */

import React, { lazy, ComponentType } from 'react'

// Mobile detection utility
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.innerWidth <= 768 ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
}

// Network-aware loading
export function getConnectionType(): 'slow' | 'fast' | 'unknown' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown'
  }

  const connection = (navigator as any).connection

  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    return 'slow'
  }

  if (connection.effectiveType === '3g' && connection.downlink < 1.5) {
    return 'slow'
  }

  return 'fast'
}

// Adaptive import strategy based on device and network
export function createAdaptiveImport<T>(
  mobileImport: () => Promise<{ default: ComponentType<T> }>,
  desktopImport: () => Promise<{ default: ComponentType<T> }>,
  options: {
    preferMobile?: boolean
    networkAware?: boolean
  } = {}
) {
  return () => {
    const isMobile = isMobileDevice()
    const connection = options.networkAware ? getConnectionType() : 'unknown'

    // Use mobile version on mobile devices or slow connections
    if (isMobile || connection === 'slow' || options.preferMobile) {
      return mobileImport()
    }

    return desktopImport()
  }
}

// Intersection Observer for lazy loading
export function createIntersectionLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    rootMargin?: string
    threshold?: number
  } = {}
) {
  const LazyComponent = lazy(importFn)

  return function IntersectionLazyComponent(props: React.ComponentProps<T>) {
    const [shouldLoad, setShouldLoad] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (!ref.current) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        },
        {
          rootMargin: options.rootMargin || '100px',
          threshold: options.threshold || 0.1
        }
      )

      observer.observe(ref.current)

      return () => observer.disconnect()
    }, [])

    if (!shouldLoad) {
      return (
        <div
          ref={ref}
          className="min-h-32 flex items-center justify-center bg-gray-50 rounded-lg"
        >
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      )
    }

    return <LazyComponent {...props} />
  }
}

// Critical resource preloader
export class MobileResourceManager {
  private static instance: MobileResourceManager
  private preloadedComponents = new Set<string>()
  private criticalComponents = new Set<string>()

  static getInstance(): MobileResourceManager {
    if (!MobileResourceManager.instance) {
      MobileResourceManager.instance = new MobileResourceManager()
    }
    return MobileResourceManager.instance
  }

  // Mark components as critical for mobile
  markCritical(componentName: string): void {
    this.criticalComponents.add(componentName)
  }

  // Preload critical components
  async preloadCritical(): Promise<void> {
    if (typeof window === 'undefined') return

    const isMobile = isMobileDevice()
    const connection = getConnectionType()

    // Skip preloading on slow connections
    if (connection === 'slow') {
      console.log('[Mobile] Skipping preload on slow connection')
      return
    }

    // Preload critical components with delay on mobile
    const delay = isMobile ? 500 : 100

    setTimeout(() => {
      this.criticalComponents.forEach(async componentName => {
        if (!this.preloadedComponents.has(componentName)) {
          try {
            // Dynamic import based on component name
            await this.importComponent(componentName)
            this.preloadedComponents.add(componentName)
            console.log(`[Mobile] Preloaded: ${componentName}`)
          } catch (error) {
            console.warn(`[Mobile] Failed to preload: ${componentName}`, error)
          }
        }
      })
    }, delay)
  }

  private async importComponent(componentName: string): Promise<any> {
    // Component registry for preloading
    const componentMap: Record<string, () => Promise<any>> = {
      'ModelStatusGrid': () => import('@/components/dashboard/ModelStatusGrid'),
      'ActivityFeed': () => import('@/components/dashboard/ActivityFeed'),
      'UnifiedModelTable': () => import('@/components/models/UnifiedModelTable'),
      'MobileModelsPage': () => import('@/app/models/mobile-page'),
      'SmartSearchInput': () => import('@/components/models/SmartSearchInput'),
    }

    const importFn = componentMap[componentName]
    if (!importFn) {
      throw new Error(`Unknown component: ${componentName}`)
    }

    return importFn()
  }

  // Check if component is already preloaded
  isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName)
  }
}

// Mobile-optimized dynamic imports
export const MobileComponents = {
  // Dashboard components
  ModelStatusGrid: lazy(() =>
    isMobileDevice()
      ? import('@/components/dashboard/ModelStatusGrid').then(mod => ({
          default: (mod as any).MobileModelStatusGrid || (mod as any).ModelStatusGrid
        }))
      : import('@/components/dashboard/ModelStatusGrid').then(mod => ({
          default: (mod as any).ModelStatusGrid
        }))
  ),

  ActivityFeed: lazy(() =>
    isMobileDevice()
      ? import('@/components/dashboard/ActivityFeed').then(mod => ({
          default: (mod as any).MobileActivityFeed || (mod as any).ActivityFeed
        }))
      : import('@/components/dashboard/ActivityFeed').then(mod => ({
          default: (mod as any).ActivityFeed
        }))
  ),

  // Models page components with mobile variants
  UnifiedModelTable: lazy(createAdaptiveImport(
    () => import('@/components/models/UnifiedModelTable'), // Use same component for now
    () => import('@/components/models/UnifiedModelTable'),
    { networkAware: true }
  )),

  VirtualizedModelTable: lazy(createAdaptiveImport(
    () => import('@/components/models/VirtualizedModelTable'), // Use same component for now
    () => import('@/components/models/VirtualizedModelTable'),
    { networkAware: true }
  )),

  // Heavy components that should be loaded differently on mobile
  ModelHighlightsSection: lazy(() =>
    import('@/components/models/ModelHighlightsSection')
  ),

  SmartSearchInput: lazy(() =>
    import('@/components/models/SmartSearchInput')
  ),
}

// Mobile performance monitoring
export function trackMobilePerformance(componentName: string, loadTime: number): void {
  if (process.env.NODE_ENV === 'development') {
    const isMobile = isMobileDevice()
    const connection = getConnectionType()

    console.log(`[Performance] ${componentName}:`, {
      loadTime: `${loadTime}ms`,
      device: isMobile ? 'mobile' : 'desktop',
      connection,
      timestamp: new Date().toISOString()
    })

    // Warn about slow loading components on mobile
    if (isMobile && loadTime > 1000) {
      console.warn(`[Performance] Slow loading on mobile: ${componentName} (${loadTime}ms)`)
    }
  }
}

// Mobile-specific bundle splitting
export function shouldUseLightVersion(componentName: string): boolean {
  const isMobile = isMobileDevice()
  const connection = getConnectionType()

  // Use light versions on mobile or slow connections
  if (isMobile || connection === 'slow') {
    return true
  }

  // Use light version for heavy components regardless of device
  const heavyComponents = [
    'VirtualizedModelTable',
    'ModelHighlightsSection',
    'RechartsComponents'
  ]

  return heavyComponents.includes(componentName)
}

// Initialize mobile optimization
export function initializeMobileOptimization(): void {
  if (typeof window === 'undefined') return

  const resourceManager = MobileResourceManager.getInstance()

  // Mark critical components
  if (isMobileDevice()) {
    resourceManager.markCritical('ModelStatusGrid')
    resourceManager.markCritical('ActivityFeed')
  } else {
    resourceManager.markCritical('UnifiedModelTable')
    resourceManager.markCritical('ModelHighlightsSection')
  }

  // Start preloading after initial page load
  if (document.readyState === 'complete') {
    resourceManager.preloadCritical()
  } else {
    window.addEventListener('load', () => {
      resourceManager.preloadCritical()
    })
  }

  // Monitor performance
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('chunk') && entry.duration > 500) {
          trackMobilePerformance(
            entry.name.split('/').pop() || 'unknown',
            entry.duration
          )
        }
      }
    })

    observer.observe({ entryTypes: ['resource', 'navigation'] })
  }
}

export default {
  isMobileDevice,
  getConnectionType,
  createAdaptiveImport,
  createIntersectionLazyComponent,
  MobileResourceManager,
  MobileComponents,
  shouldUseLightVersion,
  initializeMobileOptimization,
}