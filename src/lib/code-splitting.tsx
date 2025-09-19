import { lazy, Suspense, ComponentType } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Enhanced code splitting utilities with mobile-first optimization
 */

// Loading component factory
export function createLoadingComponent(height = 'h-32', count = 1) {
  return function LoadingComponent() {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`animate-pulse bg-gray-200 rounded-lg ${height}`}>
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }
}

// Mobile-specific loading component
export function MobileLoadingComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      <div className="px-4 py-6 space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Enhanced lazy component with retry logic and custom loading
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: ComponentType = () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
) {
  const LazyComponent = lazy(importFn)

  return function WrappedLazyComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Mobile-specific lazy component
export function createMobileLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return createLazyComponent(importFn, MobileLoadingComponent)
}

// Preload strategy for critical components
export function preloadComponent(importFn: () => Promise<any>) {
  // Preload after initial render
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFn())
    } else {
      setTimeout(() => importFn(), 100)
    }
  }
}

// Component registry for dynamic imports
export const ComponentRegistry = {
  // Dashboard components
  ModelStatusGrid: () => import('@/components/dashboard/ModelStatusGrid').then(mod => ({ default: mod.ModelStatusGrid })),
  ActivityFeed: () => import('@/components/dashboard/ActivityFeed').then(mod => ({ default: mod.ActivityFeed })),

  // Models page components
  UnifiedModelTable: () => import('@/components/models/UnifiedModelTable'),
  VirtualizedModelTable: () => import('@/components/models/VirtualizedModelTable'),
  MobileModelsPage: () => import('@/app/models/mobile-page'),
  ModelHighlightsSection: () => import('@/components/models/ModelHighlightsSection'),
  SmartSearchInput: () => import('@/components/models/SmartSearchInput'),
  FilterSettings: () => import('@/components/models/FilterSettings'),

  // Heavy third-party components
  RechartsComponents: () => import('recharts'),
  FramerMotionComponents: () => import('framer-motion'),

  // AI SDK components (loaded only when needed)
  AnthropicClient: () => import('@anthropic-ai/sdk'),
  OpenAIClient: () => import('openai'),
  GoogleAIClient: () => import('@google/generative-ai'),

  // Socket.io client (loaded only for real-time features)
  SocketIOClient: () => import('socket.io-client'),
}

// Lazy component factory with loading states
export const LazyComponents = {
  // Dashboard
  ModelStatusGrid: createLazyComponent(
    ComponentRegistry.ModelStatusGrid,
    createLoadingComponent('h-64', 2)
  ),

  ActivityFeed: createLazyComponent(
    ComponentRegistry.ActivityFeed,
    createLoadingComponent('h-96')
  ),

  // Models page
  UnifiedModelTable: createLazyComponent(
    ComponentRegistry.UnifiedModelTable,
    () => (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <div className="flex-1" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  ),

  VirtualizedModelTable: createLazyComponent(
    ComponentRegistry.VirtualizedModelTable,
    createLoadingComponent('h-96')
  ),

  MobileModelsPage: createMobileLazyComponent(ComponentRegistry.MobileModelsPage),

  ModelHighlightsSection: createLazyComponent(
    ComponentRegistry.ModelHighlightsSection,
    createLoadingComponent('h-48', 3)
  ),

  SmartSearchInput: createLazyComponent(ComponentRegistry.SmartSearchInput),
  FilterSettings: createLazyComponent(ComponentRegistry.FilterSettings),
}

// Preload critical components for better UX
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload components that are likely to be used
    preloadComponent(ComponentRegistry.ModelStatusGrid)
    preloadComponent(ComponentRegistry.ActivityFeed)
    preloadComponent(ComponentRegistry.UnifiedModelTable)

    // Preload mobile components on mobile devices
    if (window.innerWidth < 768) {
      preloadComponent(ComponentRegistry.MobileModelsPage)
    }
  }
}

// Dynamic imports for routes
export const RouteComponents = {
  ModelsPage: () => import('@/app/models/page'),
  MonitoringPage: () => import('@/app/monitoring/page'),
  NewsPage: () => import('@/app/news/page'),
  PricingPage: () => import('@/app/pricing/page'),
  BenchmarksPage: () => import('@/app/benchmarks/page'),
  StatusPage: () => import('@/app/status/page'),
}

// Bundle analysis helpers
export function logBundleSize(componentName: string, size?: number) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Bundle] ${componentName} loaded${size ? ` (~${size}KB)` : ''}`)
  }
}

// Performance observer for monitoring lazy loading
export function observeLazyLoading() {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('chunk')) {
          console.log(`[Performance] Chunk loaded: ${entry.name} (${Math.round(entry.duration)}ms)`)
        }
      }
    })

    observer.observe({ entryTypes: ['resource'] })
  }
}

export default {
  createLazyComponent,
  createMobileLazyComponent,
  LazyComponents,
  ComponentRegistry,
  preloadCriticalComponents,
  observeLazyLoading,
}