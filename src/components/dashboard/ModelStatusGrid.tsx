'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/useRealtime'
import { api } from '@/lib/api-client'
import { Model } from '@/types/models'
import { Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export function ModelStatusGrid() {
  const { modelStatuses, connected } = useRealtime()
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await api.getModels({ limit: 30 })
        setModels(response.models)
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchModels()
  }, [])

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'outage':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 hover:bg-green-200 border-green-300'
      case 'degraded':
        return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300'
      case 'outage':
        return 'bg-red-100 hover:bg-red-200 border-red-300'
      default:
        return 'bg-gray-100 hover:bg-gray-200 border-gray-300'
    }
  }

  const getAvailabilityColor = (availability?: number) => {
    if (!availability) return 'text-gray-500'
    if (availability >= 99) return 'text-green-600'
    if (availability >= 95) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Group models by provider
  const groupedModels = models.reduce((acc, model) => {
    const provider = model.provider?.name || model.providerId
    if (!acc[provider]) {
      acc[provider] = []
    }
    acc[provider].push(model)
    return acc
  }, {} as Record<string, Model[]>)

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Model Status Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Model Status Grid</CardTitle>
          {connected && (
            <Badge variant="outline" className="animate-pulse">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Live Monitoring
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider} className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">{provider}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {providerModels.map(model => {
                  const status = modelStatuses[model.id] || model.status?.[0]
                  return (
                    <div
                      key={model.id}
                      className={`relative p-3 rounded-lg border transition-all duration-200 cursor-pointer ${getStatusColor(status?.status)}`}
                      title={`${model.name} - ${status?.status || 'Unknown'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {model.name}
                          </p>
                          {status?.availability !== undefined && (
                            <p className={`text-xs mt-1 ${getAvailabilityColor(status.availability)}`}>
                              {status.availability}%
                            </p>
                          )}
                        </div>
                        <div className="ml-2">
                          {getStatusIcon(status?.status)}
                        </div>
                      </div>
                      {status?.errorRate !== undefined && status.errorRate > 0 && (
                        <div className="absolute top-1 right-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Degraded</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Outage</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span>Unknown</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}