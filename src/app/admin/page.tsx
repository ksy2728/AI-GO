'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Database,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react'

interface DashboardStats {
  totalModels: number
  activeAPIs: number
  dataSourceHealth: {
    api: 'operational' | 'degraded' | 'down'
    scraped: 'operational' | 'degraded' | 'down'
    config: 'operational' | 'degraded' | 'down'
  }
  recentAlerts: Array<{
    id: string
    type: 'error' | 'warning' | 'info'
    message: string
    timestamp: string
  }>
  apiUsage: {
    openai: number
    anthropic: number
    google: number
    replicate: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalModels: 0,
    activeAPIs: 0,
    dataSourceHealth: {
      api: 'operational',
      scraped: 'operational',
      config: 'operational',
    },
    recentAlerts: [],
    apiUsage: {
      openai: 0,
      anthropic: 0,
      google: 0,
      replicate: 0,
    },
  })

  useEffect(() => {
    // Fetch dashboard stats
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // For now, use mock data
      // In production, fetch from actual API endpoints
      setStats({
        totalModels: 156,
        activeAPIs: 4,
        dataSourceHealth: {
          api: 'operational',
          scraped: 'degraded',
          config: 'operational',
        },
        recentAlerts: [
          {
            id: '1',
            type: 'warning',
            message: 'Artificial Analysis scraper rate limited',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '2',
            type: 'info',
            message: 'OpenAI API quota at 75% usage',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
          },
        ],
        apiUsage: {
          openai: 75,
          anthropic: 45,
          google: 30,
          replicate: 20,
        },
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'down':
        return <Activity className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">System overview and monitoring</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Models</p>
              <p className="text-2xl font-bold text-white mt-2">
                {stats.totalModels}
              </p>
            </div>
            <div className="bg-blue-600/20 p-3 rounded-lg">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">+12% from last week</span>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active APIs</p>
              <p className="text-2xl font-bold text-white mt-2">
                {stats.activeAPIs}/4
              </p>
            </div>
            <div className="bg-green-600/20 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">All systems operational</span>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Data Sources</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  {getHealthIcon(stats.dataSourceHealth.api)}
                  <span className="text-sm text-white">API</span>
                </div>
                <div className="flex items-center gap-2">
                  {getHealthIcon(stats.dataSourceHealth.scraped)}
                  <span className="text-sm text-white">Scraped</span>
                </div>
              </div>
            </div>
            <div className="bg-purple-600/20 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Recent Alerts</p>
              <p className="text-2xl font-bold text-white mt-2">
                {stats.recentAlerts.length}
              </p>
            </div>
            <div className="bg-yellow-600/20 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-400">
              {stats.recentAlerts.filter(a => a.type === 'error').length} errors,{' '}
              {stats.recentAlerts.filter(a => a.type === 'warning').length} warnings
            </span>
          </div>
        </Card>
      </div>

      {/* API Usage */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">API Usage</h2>
        <div className="space-y-4">
          {Object.entries(stats.apiUsage).map(([api, usage]) => (
            <div key={api}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 capitalize">{api}</span>
                <span className="text-sm text-gray-400">{usage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    usage > 75
                      ? 'bg-red-500'
                      : usage > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${usage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Alerts */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Alerts</h2>
        <div className="space-y-3">
          {stats.recentAlerts.length > 0 ? (
            stats.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg"
              >
                {alert.type === 'error' ? (
                  <Activity className="w-5 h-5 text-red-400 mt-0.5" />
                ) : alert.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-gray-200">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No recent alerts</p>
          )}
        </div>
      </Card>
    </div>
  )
}