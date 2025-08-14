'use client'

import { useGlobalStats, useRealtime } from '@/hooks/useRealtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'

export function RealtimeMonitor() {
  const { stats, connected, error } = useGlobalStats()
  const { recentUpdates } = useRealtime()
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    if (stats) {
      setLastUpdate(new Date().toLocaleTimeString())
    }
  }, [stats])

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Real-time Connection
            </CardTitle>
            <Badge variant={connected ? 'default' : 'destructive'}>
              {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        {error && (
          <CardContent>
            <p className="text-sm text-red-500">Error: {error}</p>
          </CardContent>
        )}
      </Card>

      {/* Global Stats */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Live System Status
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Updated: {lastUpdate}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Models</p>
                <p className="text-2xl font-bold">{stats.totalModels}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Models</p>
                <p className="text-2xl font-bold">{stats.activeModels}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Availability</p>
                <p className="text-2xl font-bold">
                  {stats.avgAvailability.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operational</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.operationalModels}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Degraded</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.degradedModels}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outage</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.outageModels}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Updates */}
      {recentUpdates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentUpdates.slice(0, 5).map((update, index) => (
                <div
                  key={`${update.timestamp}-${index}`}
                  className="flex items-center justify-between text-xs"
                >
                  <Badge variant="outline" className="text-xs">
                    {update.type}
                  </Badge>
                  <span className="text-muted-foreground">
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Example usage in a dashboard
export function LiveDashboard() {
  const { 
    globalStats, 
    modelStatuses, 
    recentUpdates, 
    connected, 
    subscribeToModels 
  } = useRealtime()

  useEffect(() => {
    // Subscribe to specific models you're interested in
    const topModels = [
      'gpt-4-turbo',
      'claude-3-opus',
      'gemini-pro',
      'llama-3-70b'
    ]
    subscribeToModels(topModels)
  }, [subscribeToModels])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        AI Model Live Dashboard {connected && '🔴'}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Real-time Monitor */}
        <div className="md:col-span-1">
          <RealtimeMonitor />
        </div>
        
        {/* Model Status Grid */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Live Model Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.values(modelStatuses).map((status: any) => (
                  <div
                    key={status.modelId}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {status.modelName}
                      </span>
                      <Badge
                        variant={
                          status.status === 'operational'
                            ? 'default'
                            : status.status === 'degraded'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {status.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Availability</span>
                        <p className="font-medium">{status.availability.toFixed(2)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Latency P50</span>
                        <p className="font-medium">{status.latencyP50}ms</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Error Rate</span>
                        <p className="font-medium">{status.errorRate.toFixed(2)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Req/min</span>
                        <p className="font-medium">{status.requestsPerMin}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Activity Feed */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentUpdates.slice(0, 10).map((update, index) => (
              <div
                key={`${update.timestamp}-${index}`}
                className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded"
              >
                <Badge variant="outline">{update.type}</Badge>
                <span className="flex-1 text-sm">
                  {JSON.stringify(update.data).substring(0, 100)}...
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(update.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}