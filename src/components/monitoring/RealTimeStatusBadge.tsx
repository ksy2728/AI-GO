'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { useRegion } from '@/contexts/RegionContext'
import { cn } from '@/lib/utils'

interface ServerStatus {
  modelId: string
  status: 'operational' | 'degraded' | 'outage'
  availability: number
  responseTime: number
  errorRate: number
  region: string
  lastChecked: string
}

interface RealTimeStatusBadgeProps {
  modelId: string
  fallbackStatus?: 'operational' | 'degraded' | 'outage'
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
  const [status, setStatus] = useState<ServerStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchStatus = async () => {
    try {
      setError(null)
      const response = await fetch('/api/status-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          modelId, 
          region: selectedRegion.code 
        })
      })

      if (response.ok) {
        const statusData = await response.json()
        setStatus(statusData)
        setLastUpdate(new Date())
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
      // Use fallback status on error
      setStatus({
        modelId,
        status: fallbackStatus,
        availability: 99.9,
        responseTime: 0,
        errorRate: 0,
        region: selectedRegion.code,
        lastChecked: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchStatus, 30000)

    return () => clearInterval(interval)
  }, [modelId, selectedRegion.code])

  const currentStatus = status?.status || fallbackStatus
  const config = STATUS_CONFIG[currentStatus]
  const StatusIcon = config.icon

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatLastUpdate = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="outline"
        className={cn(
          config.color,
          "flex items-center gap-1.5 text-xs font-medium transition-all duration-200",
          config.pulse && "animate-pulse"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <StatusIcon className="h-3 w-3" />
        )}
        <span>{config.label}</span>
        {showDetails && status && !isLoading && (
          <span className="ml-1 opacity-75">
            {formatResponseTime(status.responseTime)}
          </span>
        )}
      </Badge>
      
      {showDetails && !isLoading && (
        <div className="flex items-center text-xs text-muted-foreground">
          {error ? (
            <span className="text-red-500">⚠ {error}</span>
          ) : (
            <>
              <span>{status?.availability.toFixed(1)}%</span>
              <span className="mx-1">•</span>
              <span>{formatLastUpdate(lastUpdate)}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}