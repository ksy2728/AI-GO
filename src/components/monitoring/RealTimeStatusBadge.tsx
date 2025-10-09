'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { useModelMetrics, useRegion, useRegionApi, normalizeRegionStatus } from '@/contexts/RegionContext'
import { cn } from '@/lib/utils'

// Import model status types for consistency
import type { ModelStatus } from '@/hooks/useFeaturedModels'

interface RealTimeStatusBadgeProps {
  modelId: string
  fallbackStatus?: ModelStatus | 'outage'
  className?: string
  showDetails?: boolean
}

const STATUS_CONFIG = {
  operational: {
    label: 'Operational',
    color: 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
    icon: Wifi,
    pulse: false
  },
  degraded: {
    label: 'Degraded',
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400',
    icon: AlertTriangle,
    pulse: true
  },
  down: {
    label: 'Down',
    color: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400',
    icon: WifiOff,
    pulse: true
  },
  outage: {
    label: 'Outage',
    color: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400',
    icon: WifiOff,
    pulse: true
  }
}

export function RealTimeStatusBadge({ 
  modelId, 
  fallbackStatus = 'operational',
  className,
  showDetails = false
}: RealTimeStatusBadgeProps) {
  const { selectedRegion } = useRegion()
  const { fetchModelMetrics } = useRegionApi()
  const metrics = useModelMetrics(modelId)
  const [isLoading, setIsLoading] = useState(!metrics)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadMetrics = async () => {
      setIsLoading(true)
      try {
        await fetchModelMetrics(modelId, selectedRegion.code)
        if (!cancelled) {
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '메트릭 로드 실패')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadMetrics()
    const interval = setInterval(loadMetrics, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [modelId, selectedRegion.code, fetchModelMetrics])

  const fallbackModelStatus = useMemo<ModelStatus>(() => (
    fallbackStatus === 'outage' ? 'down' : fallbackStatus
  ), [fallbackStatus])

  const derivedStatus: ModelStatus = useMemo(() => (
    normalizeRegionStatus(metrics?.status, fallbackModelStatus)
  ), [metrics?.status, fallbackModelStatus])

  const config = STATUS_CONFIG[derivedStatus]
  const StatusIcon = config.icon

  const availability = metrics?.availability ?? null
  const responseTime = metrics?.responseTime ?? null
  const errorRate = metrics?.errorRate ?? null
  const lastUpdated = metrics?.lastUpdated instanceof Date
    ? metrics.lastUpdated
    : metrics?.lastUpdated
      ? new Date(metrics.lastUpdated)
      : null

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return '—'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatAvailability = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return '—'
    return `${value.toFixed(1)}%`
  }

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return '—'
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  const detailLabel = showDetails && !isLoading && !error

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant="outline"
        className={cn(
          config.color,
          'flex items-center gap-1.5 text-xs font-medium transition-all duration-200',
          config.pulse && 'animate-pulse'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <StatusIcon className="h-3 w-3" />
        )}
        <span>{config.label}</span>
        {detailLabel && (
          <span className="ml-1 opacity-75">
            {formatResponseTime(responseTime)}
          </span>
        )}
      </Badge>
      
      {showDetails && (
        <div className="flex items-center text-xs text-muted-foreground">
          {isLoading ? (
            <span>불러오는 중…</span>
          ) : error ? (
            <span className="text-red-500">⚠ {error}</span>
          ) : (
            <>
              <span>{formatAvailability(availability)}</span>
              <span className="mx-1">•</span>
              <span>{formatLastUpdate(lastUpdated)}</span>
              {errorRate !== null && !Number.isNaN(errorRate) && (
                <>
                  <span className="mx-1">•</span>
                  <span>ERR {errorRate.toFixed(2)}%</span>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
