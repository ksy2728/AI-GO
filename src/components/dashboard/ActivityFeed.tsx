'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRealtime } from '@/hooks/useRealtime'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  RefreshCw,
  Server,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'status' | 'sync' | 'performance' | 'alert' | 'info'
  title: string
  description?: string
  timestamp: Date
  severity?: 'info' | 'warning' | 'error' | 'success'
  metadata?: Record<string, any>
}

export function ActivityFeed() {
  const { t } = useLanguage()
  const { socket, connected } = useRealtime()
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    if (!socket) return

    const handleRealtimeUpdate = (update: any) => {
      const newActivity: ActivityItem = {
        id: `${update.type}-${Date.now()}`,
        type: getActivityType(update.type),
        title: getActivityTitle(update),
        description: getActivityDescription(update),
        timestamp: new Date(update.timestamp),
        severity: getActivitySeverity(update),
        metadata: update.data
      }

      setActivities(prev => [newActivity, ...prev].slice(0, 50)) // Keep last 50 activities
    }

    socket.on('realtime:update', handleRealtimeUpdate)

    return () => {
      socket.off('realtime:update', handleRealtimeUpdate)
    }
  }, [socket])

  const getActivityType = (type: string): ActivityItem['type'] => {
    if (type.includes('sync')) return 'sync'
    if (type.includes('status')) return 'status'
    if (type.includes('performance')) return 'performance'
    if (type.includes('alert')) return 'alert'
    return 'info'
  }

  const getActivityTitle = (update: any): string => {
    switch (update.type) {
      case 'global:stats':
        return 'Global Statistics Updated'
      case 'model:status':
        return `Model Status Changed: ${update.data.modelId || 'Unknown'}`
      case 'sync:started':
        return 'Synchronization Started'
      case 'sync:completed':
        return `Sync Completed: ${update.data.provider || 'All Providers'}`
      case 'performance:alert':
        return 'Performance Alert'
      default:
        return 'System Activity'
    }
  }

  const getActivityDescription = (update: any): string | undefined => {
    const data = update.data
    switch (update.type) {
      case 'global:stats':
        return `${data.totalModels} models, ${data.activeModels} active, ${data.avgAvailability?.toFixed(1)}% avg availability`
      case 'model:status':
        return `Status: ${data.status}, Availability: ${data.availability}%`
      case 'sync:completed':
        return `Updated ${data.modelsUpdated || 0} models in ${data.duration || 0}ms`
      case 'performance:alert':
        return data.message
      default:
        return undefined
    }
  }

  const getActivitySeverity = (update: any): ActivityItem['severity'] => {
    if (update.type.includes('error') || update.data?.status === 'outage') return 'error'
    if (update.type.includes('warning') || update.data?.status === 'degraded') return 'warning'
    if (update.type.includes('completed') || update.data?.status === 'operational') return 'success'
    return 'info'
  }

  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'sync':
        return <RefreshCw className="w-4 h-4" />
      case 'status':
        return <Server className="w-4 h-4" />
      case 'performance':
        return <Zap className="w-4 h-4" />
      case 'alert':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity?: ActivityItem['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'success':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('dashboard.activity.title')}</CardTitle>
          {connected && (
            <Badge variant="outline" className="text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Activity className="w-8 h-8 mb-2" />
              <p className="text-sm">{t('dashboard.activity.noActivity')}</p>
              <p className="text-xs mt-1">{t('dashboard.activity.description')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map(activity => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                    {getActivityIcon(activity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}