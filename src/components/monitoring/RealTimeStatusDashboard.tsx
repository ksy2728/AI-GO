'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RealTimeStatusBadge } from './RealTimeStatusBadge'
import { useRegion } from '@/contexts/RegionContext'
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

interface ModelStatus {
  modelId: string
  modelName: string
  provider: string
  status: 'operational' | 'degraded' | 'outage'
  availability: number
  responseTime: number
  errorRate: number
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
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([])
  const [systemSummary, setSystemSummary] = useState<SystemSummary | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchAllStatuses = async () => {
    setIsRefreshing(true)
    try {
      const statusPromises = MONITORED_MODELS.map(async (model) => {
        const response = await fetch('/api/status-checker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            modelId: model.id, 
            region: selectedRegion.code 
          })
        })
        
        if (response.ok) {
          const status = await response.json()
          return {
            ...status,
            modelName: model.name,
            provider: model.provider
          }
        }
        return null
      })

      const results = await Promise.allSettled(statusPromises)
      const validStatuses = results
        .filter((result): result is PromiseFulfilledResult<ModelStatus> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)

      setModelStatuses(validStatuses)
      
      // Calculate system summary
      const total = validStatuses.length
      const operational = validStatuses.filter(s => s.status === 'operational').length
      const degraded = validStatuses.filter(s => s.status === 'degraded').length
      const outage = validStatuses.filter(s => s.status === 'outage').length
      const avgAvailability = total > 0 ? 
        validStatuses.reduce((sum, s) => sum + s.availability, 0) / total : 0
      const avgResponseTime = total > 0 ?
        validStatuses.reduce((sum, s) => sum + s.responseTime, 0) / total : 0

      setSystemSummary({
        totalModels: total,
        operational,
        degraded,
        outage,
        averageAvailability: avgAvailability,
        averageResponseTime: avgResponseTime,
        lastSync: new Date().toISOString()
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch statuses:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAllStatuses()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllStatuses, 30000)
    return () => clearInterval(interval)
  }, [selectedRegion])

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getSystemHealthColor = () => {
    if (!systemSummary) return 'text-gray-500'
    
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
              <div className="text-sm text-muted-foreground">Outage</div>
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

        <div className="mt-4 text-xs text-muted-foreground text-center">
          Last updated: {lastUpdate.toLocaleTimeString()} • 
          Auto-refresh every 30 seconds
        </div>
      </Card>

      {/* Model Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelStatuses.map((status) => (
          <Card key={`${status.modelId}-${status.region}`} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{status.modelName}</h3>
                <p className="text-sm text-muted-foreground">{status.provider}</p>
              </div>
              <RealTimeStatusBadge 
                modelId={status.modelId}
                fallbackStatus={status.status}
                showDetails={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="w-3 h-3 text-green-500" />
                  <span className="text-muted-foreground">Availability</span>
                </div>
                <div className="font-semibold">{status.availability.toFixed(1)}%</div>
              </div>
              
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span className="text-muted-foreground">Response</span>
                </div>
                <div className="font-semibold">{formatResponseTime(status.responseTime)}</div>
              </div>
              
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span className="text-muted-foreground">Error Rate</span>
                </div>
                <div className="font-semibold">{status.errorRate.toFixed(2)}%</div>
              </div>
              
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-purple-500" />
                  <span className="text-muted-foreground">Last Check</span>
                </div>
                <div className="font-semibold text-xs">
                  {new Date(status.lastChecked).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {modelStatuses.length === 0 && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Status Data</h3>
            <p className="text-muted-foreground">
              Fetching real-time status for all monitored models...
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}