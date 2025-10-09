'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  Server,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  Wifi,
  WifiOff,
  BarChart3,
  AlertCircle,
  Eye
} from 'lucide-react'

interface DataSourceMetrics {
  name: string;
  type: 'api' | 'scraper' | 'config' | 'cache';
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  successRate: number;
  lastChecked: string;
  errorCount: number;
  details?: {
    endpoint?: string;
    lastError?: string;
    uptime?: number;
  };
}

interface MonitoringData {
  overview: {
    totalSources: number;
    healthySources: number;
    degradedSources: number;
    downSources: number;
    averageResponseTime: number;
    overallSuccessRate: number;
  };
  sources: DataSourceMetrics[];
  alerts: {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
    source: string;
  }[];
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    redisStatus: 'connected' | 'disconnected' | 'unavailable';
    databaseStatus: 'connected' | 'disconnected';
  };
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="w-5 h-5 text-green-400" />
    case 'degraded':
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />
    case 'down':
      return <XCircle className="w-5 h-5 text-red-400" />
    default:
      return <AlertCircle className="w-5 h-5 text-gray-400" />
  }
}

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'api':
      return <Wifi className="w-4 h-4" />
    case 'cache':
      return <Zap className="w-4 h-4" />
    case 'config':
      return <Database className="w-4 h-4" />
    case 'scraper':
      return <BarChart3 className="w-4 h-4" />
    default:
      return <Server className="w-4 h-4" />
  }
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/monitoring')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setLastRefresh(new Date())
      } else {
        console.error('Failed to fetch monitoring data:', result.error)
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [autoRefresh])

  const handleRefresh = () => {
    setIsLoading(true)
    fetchData()
  }

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading monitoring data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Failed to Load Monitoring Data</h3>
        <p className="text-gray-400 mb-4">Unable to retrieve system monitoring information</p>
        <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Monitoring</h1>
          <p className="text-gray-400 mt-2">Real-time health and performance metrics</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              Last updated: {lastRefresh?.toLocaleTimeString() || 'Never'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-gray-700 ${autoRefresh ? 'text-green-400' : 'text-gray-300'}`}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-700 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Sources</p>
              <p className="text-2xl font-bold text-white">{data.overview.totalSources}</p>
            </div>
            <Server className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Healthy</p>
              <p className="text-2xl font-bold text-green-400">{data.overview.healthySources}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Average Response</p>
              <p className="text-2xl font-bold text-white">{data.overview.averageResponseTime}ms</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-white">{data.overview.overallSuccessRate}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Active Alerts */}
      {data.alerts.length > 0 && (
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
            Active Alerts ({data.alerts.length})
          </h3>
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-red-900/20 border-red-500'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-900/20 border-yellow-500'
                    : 'bg-blue-900/20 border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-400">
                      Source: {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      alert.severity === 'critical'
                        ? 'bg-red-600/20 text-red-400'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-blue-600/20 text-blue-400'
                    }
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Data Sources Status */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Eye className="w-5 h-5 text-blue-400 mr-2" />
          Data Sources Status
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.sources.map((source, index) => (
            <div
              key={index}
              className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TypeIcon type={source.type} />
                    <h4 className="font-medium text-white">{source.name}</h4>
                  </div>
                  <StatusIcon status={source.status} />
                </div>
                <Badge
                  variant="secondary"
                  className={
                    source.status === 'healthy'
                      ? 'bg-green-600/20 text-green-400'
                      : source.status === 'degraded'
                      ? 'bg-yellow-600/20 text-yellow-400'
                      : 'bg-red-600/20 text-red-400'
                  }
                >
                  {source.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Response Time</p>
                  <p className="text-white font-medium">{source.responseTime}ms</p>
                </div>
                <div>
                  <p className="text-gray-400">Success Rate</p>
                  <p className="text-white font-medium">{source.successRate}%</p>
                </div>
                <div>
                  <p className="text-gray-400">Last Checked</p>
                  <p className="text-white font-medium">
                    {new Date(source.lastChecked).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Error Count</p>
                  <p className={`font-medium ${source.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {source.errorCount}
                  </p>
                </div>
              </div>

              {source.details?.lastError && (
                <div className="mt-3 p-2 bg-red-900/20 rounded border border-red-500/20">
                  <p className="text-sm text-red-400">
                    <strong>Last Error:</strong> {source.details.lastError}
                  </p>
                </div>
              )}

              {source.details?.endpoint && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500">
                    Endpoint: {source.details.endpoint}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* System Health */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Activity className="w-5 h-5 text-green-400 mr-2" />
          System Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">CPU Usage</p>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  data.systemHealth.cpuUsage > 80
                    ? 'bg-red-500'
                    : data.systemHealth.cpuUsage > 60
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${data.systemHealth.cpuUsage}%` }}
              ></div>
            </div>
            <p className="text-white text-sm mt-1">{data.systemHealth.cpuUsage}%</p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Memory Usage</p>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  data.systemHealth.memoryUsage > 80
                    ? 'bg-red-500'
                    : data.systemHealth.memoryUsage > 60
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${data.systemHealth.memoryUsage}%` }}
              ></div>
            </div>
            <p className="text-white text-sm mt-1">{data.systemHealth.memoryUsage}%</p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Disk Usage</p>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  data.systemHealth.diskUsage > 80
                    ? 'bg-red-500'
                    : data.systemHealth.diskUsage > 60
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${data.systemHealth.diskUsage}%` }}
              ></div>
            </div>
            <p className="text-white text-sm mt-1">{data.systemHealth.diskUsage}%</p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Redis Status</p>
            <div className="flex items-center gap-2">
              {data.systemHealth.redisStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-sm ${
                  data.systemHealth.redisStatus === 'connected'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {data.systemHealth.redisStatus}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Database</p>
            <div className="flex items-center gap-2">
              {data.systemHealth.databaseStatus === 'connected' ? (
                <Database className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-sm ${
                  data.systemHealth.databaseStatus === 'connected'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {data.systemHealth.databaseStatus}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}