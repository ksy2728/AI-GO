'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  DollarSign,
  Activity,
  AlertTriangle,
  Settings,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react'

interface QuotaConfig {
  provider: string;
  endpoint: string;
  quota: {
    requests: { daily: number; monthly: number; current: number };
    tokens: { daily: number; monthly: number; current: number };
    cost: { daily: number; monthly: number; current: number };
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
  };
  alerts: {
    enabled: boolean;
    thresholds: { warning: number; critical: number; emergency: number };
    channels: string[];
  };
  status: 'active' | 'paused' | 'disabled';
  lastReset: string;
}

interface QuotaUsage {
  provider: string;
  usage: {
    requests: { today: number; thisMonth: number; percentDaily: number; percentMonthly: number };
    tokens: { today: number; thisMonth: number; percentDaily: number; percentMonthly: number };
    cost: { today: number; thisMonth: number; percentDaily: number; percentMonthly: number };
  };
  trends: {
    requestsGrowth: number;
    costGrowth: number;
    averageRequestsPerDay: number;
    averageCostPerDay: number;
  };
  alerts: {
    id: string;
    level: 'warning' | 'critical' | 'emergency';
    message: string;
    timestamp: string;
    resolved: boolean;
  }[];
}

interface QuotaData {
  configs: QuotaConfig[];
  usage: QuotaUsage[];
  summary: {
    totalProviders: number;
    activeProviders: number;
    totalAlerts: number;
    totalCostToday: number;
    totalCostThisMonth: number;
  };
}

export default function QuotaManagementPage() {
  const [data, setData] = useState<QuotaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const fetchData = async () => {
    try {
      const [configsResponse, usageResponse] = await Promise.all([
        fetch('/api/admin/quota?action=configs'),
        fetch('/api/admin/quota?action=usage')
      ])

      const configsResult = await configsResponse.json()
      const usageResult = await usageResponse.json()

      if (configsResult.success && usageResult.success) {
        setData({
          configs: configsResult.data.configs,
          usage: usageResult.data.usage,
          summary: usageResult.data.summary
        })
        setLastRefresh(new Date())
      } else {
        console.error('Failed to fetch quota data:', configsResult.error || usageResult.error)
      }
    } catch (error) {
      console.error('Error fetching quota data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    fetchData()
  }

  const handleProviderAction = async (provider: string, action: string) => {
    setActionLoading(prev => ({ ...prev, [provider]: true }))

    try {
      const response = await fetch('/api/admin/quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, provider })
      })

      const result = await response.json()

      if (result.success) {
        await fetchData()
      } else {
        console.error(`Failed to ${action}:`, result.error)
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error)
    } finally {
      setActionLoading(prev => ({ ...prev, [provider]: false }))
    }
  }

  const toggleDetails = (provider: string) => {
    setShowDetails(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-400'
    if (percent >= 75) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400'
      case 'paused':
        return 'text-yellow-400'
      case 'disabled':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-400" />
      case 'disabled':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading quota management...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Failed to Load Quota Data</h3>
        <p className="text-gray-400 mb-4">Unable to retrieve API quota information</p>
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
          <h1 className="text-3xl font-bold text-white">API Quota Management</h1>
          <p className="text-gray-400 mt-2">Monitor and manage API usage limits and costs</p>
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
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-700 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Providers</p>
              <p className="text-2xl font-bold text-white">{data.summary.totalProviders}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-400">{data.summary.activeProviders}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Alerts</p>
              <p className="text-2xl font-bold text-yellow-400">{data.summary.totalAlerts}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Cost Today</p>
              <p className="text-2xl font-bold text-white">${data.summary.totalCostToday.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Cost This Month</p>
              <p className="text-2xl font-bold text-white">${data.summary.totalCostThisMonth.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        {data.configs.map((config) => {
          const usage = data.usage.find(u => u.provider === config.provider)
          if (!usage) return null

          const isExpanded = showDetails[config.provider]

          return (
            <Card key={config.provider} className="bg-gray-800 border-gray-700 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(config.status)}
                    <h3 className="text-xl font-semibold text-white">{config.provider}</h3>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${
                      config.status === 'active'
                        ? 'bg-green-600/20 text-green-400'
                        : config.status === 'paused'
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-red-600/20 text-red-400'
                    }`}
                  >
                    {config.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDetails(config.provider)}
                    className="text-gray-400 hover:text-white"
                  >
                    {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isExpanded ? 'Hide' : 'Details'}
                  </Button>

                  {config.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProviderAction(config.provider, 'pause-provider')}
                      disabled={actionLoading[config.provider]}
                      className="border-gray-600 text-gray-300"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProviderAction(config.provider, 'resume-provider')}
                      disabled={actionLoading[config.provider]}
                      className="border-gray-600 text-gray-300"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProviderAction(config.provider, 'reset-quota')}
                    disabled={actionLoading[config.provider]}
                    className="border-gray-600 text-gray-300"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Usage Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Requests Today</span>
                    <span className={`text-sm font-medium ${getUsageColor(usage.usage.requests.percentDaily)}`}>
                      {usage.usage.requests.percentDaily.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(usage.usage.requests.percentDaily)}`}
                      style={{ width: `${Math.min(usage.usage.requests.percentDaily, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {usage.usage.requests.today.toLocaleString()} / {config.quota.requests.daily.toLocaleString()}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Tokens Today</span>
                    <span className={`text-sm font-medium ${getUsageColor(usage.usage.tokens.percentDaily)}`}>
                      {usage.usage.tokens.percentDaily.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(usage.usage.tokens.percentDaily)}`}
                      style={{ width: `${Math.min(usage.usage.tokens.percentDaily, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {usage.usage.tokens.today.toLocaleString()} / {config.quota.tokens.daily.toLocaleString()}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Cost Today</span>
                    <span className={`text-sm font-medium ${getUsageColor(usage.usage.cost.percentDaily)}`}>
                      {usage.usage.cost.percentDaily.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(usage.usage.cost.percentDaily)}`}
                      style={{ width: `${Math.min(usage.usage.cost.percentDaily, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    ${usage.usage.cost.today.toFixed(2)} / ${config.quota.cost.daily.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Alerts */}
              {usage.alerts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-yellow-400 mb-2">Active Alerts</h4>
                  <div className="space-y-2">
                    {usage.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded border-l-4 ${
                          alert.level === 'critical'
                            ? 'bg-red-900/20 border-red-500'
                            : alert.level === 'warning'
                            ? 'bg-yellow-900/20 border-yellow-500'
                            : 'bg-blue-900/20 border-blue-500'
                        }`}
                      >
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed View */}
              {isExpanded && (
                <div className="border-t border-gray-700 pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Monthly Usage</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Requests</span>
                          <span className="text-sm text-white">
                            {usage.usage.requests.thisMonth.toLocaleString()} / {config.quota.requests.monthly.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Tokens</span>
                          <span className="text-sm text-white">
                            {usage.usage.tokens.thisMonth.toLocaleString()} / {config.quota.tokens.monthly.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Cost</span>
                          <span className="text-sm text-white">
                            ${usage.usage.cost.thisMonth.toFixed(2)} / ${config.quota.cost.monthly.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Rate Limits</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Per Minute</span>
                          <span className="text-sm text-white">{config.rateLimit.requestsPerMinute}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Per Hour</span>
                          <span className="text-sm text-white">{config.rateLimit.requestsPerHour}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Burst Limit</span>
                          <span className="text-sm text-white">{config.rateLimit.burstLimit}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Trends</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Requests Growth</span>
                          <div className="flex items-center gap-1">
                            {usage.trends.requestsGrowth > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                            <span className={`text-sm ${usage.trends.requestsGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {usage.trends.requestsGrowth > 0 ? '+' : ''}{usage.trends.requestsGrowth}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Cost Growth</span>
                          <div className="flex items-center gap-1">
                            {usage.trends.costGrowth > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                            <span className={`text-sm ${usage.trends.costGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {usage.trends.costGrowth > 0 ? '+' : ''}{usage.trends.costGrowth}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Alert Configuration</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Alerts Enabled</span>
                          <span className={`text-sm ${config.alerts.enabled ? 'text-green-400' : 'text-red-400'}`}>
                            {config.alerts.enabled ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Warning Threshold</span>
                          <span className="text-sm text-white">{config.alerts.thresholds.warning}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Critical Threshold</span>
                          <span className="text-sm text-white">{config.alerts.thresholds.critical}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}