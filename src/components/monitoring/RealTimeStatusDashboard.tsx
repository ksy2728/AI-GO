'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RealTimeStatusBadge } from './RealTimeStatusBadge'
import { useRegion, useRegionApi, type RegionMetricStatus } from '@/contexts/RegionContext'
import { useGlobalStats } from '@/contexts/ModelsContext'
import {
  RefreshCw,
  Activity,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface ModelStatusRow {
  modelId: string
  modelName: string
  provider: string
  status: RegionMetricStatus
  availability: number | null
  responseTime: number | null
  errorRate: number | null
  region: string
  lastChecked: string
}

interface SystemSummary {
  totalModels: number
  operational: number
  degraded: number
  outage: number
  averageAvailability: number
  averageResponseTime: number
  lastSync: string
}

const MONITORED_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
]

export function RealTimeStatusDashboard() {
  const { selectedRegion } = useRegion()
  const { fetchModelMetrics } = useRegionApi()
  const { globalStats, refreshStats } = useGlobalStats()
  const [modelStatuses, setModelStatuses] = useState<ModelStatusRow[]>([])
  const [systemSummary, setSystemSummary] = useState<SystemSummary | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchAllStatuses = async () => {
    setIsRefreshing(true)
    try {
      const statusPromises = MONITORED_MODELS.map(async (model) => {
        const metrics = await fetchModelMetrics(model.id, selectedRegion.code)
        if (!metrics) return null

        // Map RegionMetricStatus to actual status value
        const statusStr = metrics.status as string
        const status: RegionMetricStatus = statusStr === 'outage' ? 'down' : metrics.status || 'unknown'

        const lastChecked = metrics.lastUpdated instanceof Date
          ? metrics.lastUpdated.toISOString()
          : metrics.lastUpdated
            ? new Date(metrics.lastUpdated).toISOString()
            : new Date().toISOString()

        return {
          modelId: model.id,
          modelName: model.name,
          provider: model.provider,
          status,
          availability: typeof metrics.availability === 'number' ? metrics.availability : null,
          responseTime: typeof metrics.responseTime === 'number' ? metrics.responseTime : null,
          errorRate: typeof metrics.errorRate === 'number' ? metrics.errorRate : null,
          region: metrics.region,
          lastChecked
        } satisfies ModelStatusRow | null
      })

      const results = await Promise.allSettled(statusPromises)
      const validStatuses = results
        .filter((result): result is PromiseFulfilledResult<ModelStatusRow | null> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter((value): value is ModelStatusRow => value !== null)

      setModelStatuses(validStatuses)

      const total = validStatuses.length
      const operational = validStatuses.filter(s => s.status === 'operational').length
      const degraded = validStatuses.filter(s => s.status === 'degraded').length
      const outage = validStatuses.filter(s => {
        const statusStr = s.status as string
        return statusStr === 'down' || statusStr === 'outage'
      }).length
      const avgAvailability = total > 0
        ? validStatuses.reduce((sum, s) => sum + (s.availability ?? 0), 0) / total
        : 0
      const avgResponseTime = total > 0
        ? validStatuses.reduce((sum, s) => sum + (s.responseTime ?? 0), 0) / total
        : 0

      if (globalStats) {
        setSystemSummary({
          totalModels: globalStats.totalModels,
          operational: globalStats.operationalModels,
          degraded: globalStats.degradedModels,
          outage: globalStats.outageModels,
          averageAvailability: globalStats.avgAvailability,
          averageResponseTime: avgResponseTime,
          lastSync: new Date().toISOString()
        })
      } else {
        setSystemSummary({
          totalModels: total,
          operational,
          degraded,
          outage,
          averageAvailability: avgAvailability,
          averageResponseTime: avgResponseTime,
          lastSync: new Date().toISOString()
        })
      }
      
      refreshStats()
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch statuses:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAllStatuses()
    const interval = setInterval(fetchAllStatuses, 30000)
    return () => clearInterval(interval)
  }, [selectedRegion.code])

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return '—'
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getSystemHealthColor = () => {
    if (!systemSummary || systemSummary.totalModels === 0) return 'text-gray-500'
    
    const healthScore = (systemSummary.operational / systemSummary.totalModels) * 100
    if (healthScore >= 90) return 'text-green-500'
    if (healthScore >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-6">
      {/* System Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className={`w-5 h-5 ${getSystemHealthColor()}`} />
            System Status
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Region: {selectedRegion.displayName}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAllStatuses}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {systemSummary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {systemSummary.operational}
                <span className="text-sm font-normal text-gray-500">/{systemSummary.totalModels}</span>
              </div>
              <div className="text-sm text-muted-foreground">Operational</div>
            </div>
            
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">
                {systemSummary.degraded}
              </div>
              <div className="text-sm text-muted-foreground">Degraded</div>
            </div>

            <div className="text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {systemSummary.outage}
              </div>
              <div className="text-sm text-muted-foreground">Outage / Down</div>
            </div>

            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {systemSummary.averageAvailability.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Availability</div>
            </div>

            <div className="text-center">
              <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {formatResponseTime(systemSummary.averageResponseTime)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
          </div>
        )}
      </Card>

      {/* Model Status Grid */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Real-time Model Health
          </h3>
          <span className="text-xs text-muted-foreground">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modelStatuses.map(status => (
            <Card key={`${status.modelId}-${status.region}`} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{status.modelName}</h4>
                  <p className="text-xs text-muted-foreground">{status.provider} • {status.region.toUpperCase()}</p>
                </div>
                <RealTimeStatusBadge 
                  modelId={status.modelId}
                  fallbackStatus={status.status === 'unknown' ? 'degraded' : status.status}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Availability</div>
                  <div className="font-semibold">{status.availability !== null ? `${status.availability.toFixed(1)}%` : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Response</div>
                  <div className="font-semibold">{formatResponseTime(status.responseTime)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Error Rate</div>
                  <div className="font-semibold">{status.errorRate !== null ? `${status.errorRate.toFixed(2)}%` : '—'}</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Last checked {new Date(status.lastChecked).toLocaleTimeString()}
              </div>
            </Card>
          ))}
        </div>

        {modelStatuses.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            모니터링할 모델의 실시간 데이터를 불러오지 못했습니다.
          </div>
        )}
      </Card>
    </div>
  )
}
