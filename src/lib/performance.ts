/**
 * Performance optimization utilities for mobile Lighthouse score 90+
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals'

// Core Web Vitals thresholds
export const PERFORMANCE_THRESHOLDS = {
  // Performance (90+ target)
  LCP: 2500, // ms - Largest Contentful Paint
  FID: 100,  // ms - First Input Delay
  CLS: 0.1,  // Cumulative Layout Shift
  FCP: 1800, // ms - First Contentful Paint
  TTFB: 600, // ms - Time to First Byte

  // Custom metrics
  TTI: 3500, // ms - Time to Interactive
  SI: 3400,  // ms - Speed Index
  TBT: 200,  // ms - Total Blocking Time
} as const

export interface PerformanceReport {
  timestamp: number
  url: string
  userAgent: string
  connection: string
  metrics: {
    lcp: number
    fid: number
    cls: number
    fcp: number
    ttfb: number
  }
  score: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
  recommendations: string[]
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  private observers: PerformanceObserver[] = []
  private isMonitoring = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring()
    }
  }

  private initializeMonitoring() {
    if (this.isMonitoring) return
    this.isMonitoring = true

    // Core Web Vitals monitoring
    getCLS(this.handleMetric.bind(this))
    getFID(this.handleMetric.bind(this))
    getFCP(this.handleMetric.bind(this))
    getLCP(this.handleMetric.bind(this))
    getTTFB(this.handleMetric.bind(this))

    // Custom performance monitoring
    this.monitorResourceLoading()
    this.monitorLayoutShifts()
    this.monitorMemoryUsage()
  }

  private handleMetric(metric: Metric) {
    this.metrics.set(metric.name, metric.value)

    const threshold = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS]
    const status = metric.value <= threshold ? 'good' : 'needs-improvement'

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}: ${Math.round(metric.value)}ms (${status})`)
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendAnalytics(metric)
    }
  }

  private monitorResourceLoading() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('chunk') || entry.name.includes('static')) {
          const loadTime = Math.round(entry.duration)

          if (process.env.NODE_ENV === 'development') {
            console.log(`[Bundle] ${entry.name}: ${loadTime}ms`)
          }

          // Warn about slow loading resources
          if (loadTime > 1000) {
            console.warn(`[Performance] Slow resource: ${entry.name} (${loadTime}ms)`)
          }
        }
      }
    })

    observer.observe({ entryTypes: ['resource'] })
    this.observers.push(observer)
  }

  private monitorLayoutShifts() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ((entry as any).hadRecentInput) continue

        const cls = (entry as any).value
        if (cls > 0.1) {
          console.warn(`[Performance] Layout shift detected: ${cls}`)
        }
      }
    })

    observer.observe({ entryTypes: ['layout-shift'] })
    this.observers.push(observer)
  }

  private monitorMemoryUsage() {
    if (!('performance' in window) || !('memory' in (performance as any))) return

    setInterval(() => {
      const memory = (performance as any).memory
      const used = Math.round(memory.usedJSHeapSize / 1048576) // MB
      const total = Math.round(memory.totalJSHeapSize / 1048576) // MB

      if (used / total > 0.8) {
        console.warn(`[Performance] High memory usage: ${used}MB/${total}MB`)
      }
    }, 30000) // Check every 30 seconds
  }

  private sendAnalytics(metric: Metric) {
    // Send to your analytics service
    // Implementation depends on your analytics provider
    try {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          url: window.location.href,
          timestamp: Date.now()
        })
      }).catch(() => {
        // Silent fail for analytics
      })
    } catch (error) {
      // Silent fail
    }
  }

  public getMetrics(): Map<string, number> {
    return new Map(this.metrics)
  }

  public generateReport(): PerformanceReport {
    const now = Date.now()
    const metrics = {
      lcp: this.metrics.get('LCP') || 0,
      fid: this.metrics.get('FID') || 0,
      cls: this.metrics.get('CLS') || 0,
      fcp: this.metrics.get('FCP') || 0,
      ttfb: this.metrics.get('TTFB') || 0,
    }

    const score = this.calculateScore(metrics)
    const recommendations = this.generateRecommendations(metrics)

    return {
      timestamp: now,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      connection: this.getConnectionInfo(),
      metrics,
      score,
      recommendations
    }
  }

  private calculateScore(metrics: any): PerformanceReport['score'] {
    // Simplified scoring algorithm
    const performanceScore = Math.max(0, 100 - (
      (metrics.lcp > PERFORMANCE_THRESHOLDS.LCP ? 20 : 0) +
      (metrics.fid > PERFORMANCE_THRESHOLDS.FID ? 15 : 0) +
      (metrics.cls > PERFORMANCE_THRESHOLDS.CLS ? 15 : 0) +
      (metrics.fcp > PERFORMANCE_THRESHOLDS.FCP ? 10 : 0) +
      (metrics.ttfb > PERFORMANCE_THRESHOLDS.TTFB ? 10 : 0)
    ))

    return {
      performance: performanceScore,
      accessibility: 95, // Placeholder - would need actual audit
      bestPractices: 90, // Placeholder - would need actual audit
      seo: 90 // Placeholder - would need actual audit
    }
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = []

    if (metrics.lcp > PERFORMANCE_THRESHOLDS.LCP) {
      recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and improving server response time')
    }

    if (metrics.fid > PERFORMANCE_THRESHOLDS.FID) {
      recommendations.push('Reduce First Input Delay by optimizing JavaScript execution')
    }

    if (metrics.cls > PERFORMANCE_THRESHOLDS.CLS) {
      recommendations.push('Fix Cumulative Layout Shift by adding size attributes to images and media')
    }

    if (metrics.fcp > PERFORMANCE_THRESHOLDS.FCP) {
      recommendations.push('Improve First Contentful Paint by optimizing critical CSS and fonts')
    }

    if (metrics.ttfb > PERFORMANCE_THRESHOLDS.TTFB) {
      recommendations.push('Reduce Time to First Byte by optimizing server-side performance')
    }

    return recommendations
  }

  private getConnectionInfo(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection
      return conn ? `${conn.effectiveType || 'unknown'} (${conn.downlink || '?'}Mbps)` : 'unknown'
    }
    return 'unknown'
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics.clear()
    this.isMonitoring = false
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null

export function initializePerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor!
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor
}

// Utility functions for performance optimization
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

export function preloadFont(fontUrl: string): void {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'font'
  link.type = 'font/woff2'
  link.crossOrigin = 'anonymous'
  link.href = fontUrl
  document.head.appendChild(link)
}

export function deferNonCriticalCSS(cssUrl: string): void {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'style'
  link.href = cssUrl
  link.onload = function() {
    this.rel = 'stylesheet'
  }
  document.head.appendChild(link)
}

// Network-aware loading
export function isSlowConnection(): boolean {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const conn = (navigator as any).connection
    return conn && (
      conn.effectiveType === 'slow-2g' ||
      conn.effectiveType === '2g' ||
      conn.saveData
    )
  }
  return false
}

// Device detection
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Battery API
export function isLowPowerMode(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        resolve(battery.level < 0.2 || battery.charging === false)
      }).catch(() => resolve(false))
    } else {
      resolve(false)
    }
  })
}

// Performance-aware component loading
export function shouldDeferComponent(): boolean {
  return isSlowConnection() || isMobileDevice()
}