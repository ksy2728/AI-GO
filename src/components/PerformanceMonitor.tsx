'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { initializePerformanceMonitor, getPerformanceMonitor, PERFORMANCE_THRESHOLDS, type PerformanceReport } from '@/lib/performance'

interface PerformanceMetrics {
  lcp: number | null
  inp: number | null
  cls: number | null
  fcp: number | null
  ttfb: number | null
}

interface PerformanceMonitorProps {
  showDevInfo?: boolean
  onReport?: (report: PerformanceReport) => void
}

export function PerformanceMonitor({ showDevInfo = false, onReport }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    inp: null,
    cls: null,
    fcp: null,
    ttfb: null
  })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [report, setReport] = useState<PerformanceReport | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let monitor: ReturnType<typeof initializePerformanceMonitor> | null = null

    try {
      monitor = initializePerformanceMonitor()
      setIsMonitoring(true)

      // Update metrics periodically
      const updateMetrics = () => {
        if (monitor) {
          const currentMetrics = monitor.getMetrics()
          setMetrics({
            lcp: currentMetrics.get('LCP') || null,
            inp: currentMetrics.get('INP') || null,
            cls: currentMetrics.get('CLS') || null,
            fcp: currentMetrics.get('FCP') || null,
            ttfb: currentMetrics.get('TTFB') || null
          })

          // Generate report if we have enough metrics
          if (currentMetrics.size >= 3) {
            const performanceReport = monitor.generateReport()
            setReport(performanceReport)
            onReport?.(performanceReport)
          }
        }
      }

      // Initial update
      updateMetrics()

      // Update every 5 seconds
      const interval = setInterval(updateMetrics, 5000)

      return () => {
        clearInterval(interval)
        if (monitor) {
          monitor.destroy()
        }
      }
    } catch (error) {
      console.error('[Performance] Failed to initialize monitor:', error)
      setIsMonitoring(false)
    }
  }, [onReport])

  const getMetricStatus = (value: number | null, threshold: number): 'good' | 'needs-improvement' | 'poor' | 'unknown' => {
    if (value === null) return 'unknown'
    if (value <= threshold) return 'good'
    if (value <= threshold * 1.5) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50'
      case 'poor': return 'text-red-600 bg-red-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  const formatMetric = (value: number | null, unit: string = 'ms'): string => {
    if (value === null) return '—'
    return `${Math.round(value)}${unit}`
  }

  if (!showDevInfo && process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-20 right-4 z-50 bg-white shadow-lg rounded-lg border p-4 text-sm max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
        <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>

      {/* Core Web Vitals */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">LCP:</span>
          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(getMetricStatus(metrics.lcp, PERFORMANCE_THRESHOLDS.LCP))}`}>
            {formatMetric(metrics.lcp)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">INP:</span>
          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(getMetricStatus(metrics.inp, PERFORMANCE_THRESHOLDS.INP))}`}>
            {formatMetric(metrics.inp)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">CLS:</span>
          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(getMetricStatus(metrics.cls, PERFORMANCE_THRESHOLDS.CLS))}`}>
            {formatMetric(metrics.cls, '')}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">FCP:</span>
          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(getMetricStatus(metrics.fcp, PERFORMANCE_THRESHOLDS.FCP))}`}>
            {formatMetric(metrics.fcp)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">TTFB:</span>
          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(getMetricStatus(metrics.ttfb, PERFORMANCE_THRESHOLDS.TTFB))}`}>
            {formatMetric(metrics.ttfb)}
          </span>
        </div>
      </div>

      {/* Performance Score */}
      {report && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Score:</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              report.score.performance >= 90 ? 'text-green-600 bg-green-50' :
              report.score.performance >= 50 ? 'text-yellow-600 bg-yellow-50' :
              'text-red-600 bg-red-50'
            }`}>
              {Math.round(report.score.performance)}
            </span>
          </div>
        </div>
      )}

      {/* Connection Info */}
      {report && (
        <div className="mt-2 text-xs text-gray-500">
          {report.connection}
        </div>
      )}

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-gray-600 mb-1">Recommendations:</div>
          <div className="text-xs text-gray-500 space-y-1">
            {report.recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="truncate" title={rec}>
                • {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Lightweight performance overlay for production
export function PerformanceOverlay() {
  const [score, setScore] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const monitor = getPerformanceMonitor()
    if (!monitor) return

    const checkPerformance = () => {
      const report = monitor.generateReport()
      setScore(report.score.performance)

      // Show overlay if performance is poor
      if (report.score.performance < 50) {
        setIsVisible(true)
        setTimeout(() => setIsVisible(false), 5000)
      }
    }

    // Check after page load
    if (document.readyState === 'complete') {
      setTimeout(checkPerformance, 2000)
    } else {
      window.addEventListener('load', () => {
        setTimeout(checkPerformance, 2000)
      })
    }
  }, [])

  if (!isVisible || score === null) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-500 text-white p-3 rounded-lg shadow-lg">
      <div className="text-sm font-medium">
        Performance: {Math.round(score)}/100
      </div>
      <div className="text-xs opacity-90">
        Page may be loading slowly
      </div>
    </div>
  )
}

// Hook for accessing performance data
export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    inp: null,
    cls: null,
    fcp: null,
    ttfb: null
  })
  const [report, setReport] = useState<PerformanceReport | null>(null)

  useEffect(() => {
    const monitor = getPerformanceMonitor()
    if (!monitor) return

    const updateData = () => {
      const currentMetrics = monitor.getMetrics()
      setMetrics({
        lcp: currentMetrics.get('LCP') || null,
        inp: currentMetrics.get('INP') || null,
        cls: currentMetrics.get('CLS') || null,
        fcp: currentMetrics.get('FCP') || null,
        ttfb: currentMetrics.get('TTFB') || null
      })

      if (currentMetrics.size >= 3) {
        setReport(monitor.generateReport())
      }
    }

    updateData()
    const interval = setInterval(updateData, 5000)

    return () => clearInterval(interval)
  }, [])

  return { metrics, report }
}