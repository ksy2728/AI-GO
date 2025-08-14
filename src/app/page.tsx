'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api-client'
import { ModelStats } from '@/types/models'
import { RealtimeMonitor } from '@/components/RealtimeMonitor'
import { useGlobalStats } from '@/hooks/useRealtime'
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  Globe, 
  Server, 
  Users, 
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

export default function HomePage() {
  const [stats, setStats] = useState<ModelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string
    type: 'status' | 'benchmark' | 'release'
    message: string
    timestamp: string
    severity: 'info' | 'success' | 'warning' | 'error'
  }>>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real data from API
        const response = await fetch('/api/v1/models')
        const data = await response.json()
        
        // Calculate stats from real data
        const models = data.models || []
        const activeModels = models.filter((m: any) => m.isActive)
        const providers = new Set(models.map((m: any) => m.provider?.id)).size
        
        // Calculate average availability from model statuses
        const avgAvailability = models.reduce((acc: number, model: any) => {
          return acc + (model.status?.availability || 99.5)
        }, 0) / (models.length || 1)
        
        setStats({
          totalModels: models.length,
          activeModels: activeModels.length,
          providers: providers,
          avgAvailability: Math.round(avgAvailability * 10) / 10,
          operationalModels: activeModels.filter((m: any) => 
            m.status?.status === 'operational' || !m.status
          ).length
        })

        // Mock recent activity
        setRecentActivity([
          {
            id: '1',
            type: 'status',
            message: 'GPT-4 Turbo status updated: Operational',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            severity: 'success'
          },
          {
            id: '2',
            type: 'benchmark',
            message: 'Claude 3 Opus achieved 94.2% on MMLU benchmark',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            severity: 'info'
          },
          {
            id: '3',
            type: 'release',
            message: 'Gemini Ultra 1.5 released with 1M context window',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            severity: 'info'
          },
          {
            id: '4',
            type: 'status',
            message: 'Llama 3 experiencing elevated latency',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            severity: 'warning'
          }
        ])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI-GO Platform...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
              AI-GO
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Global AI Model Monitoring Platform
            </p>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              Real-time monitoring of AI model performance, availability, benchmarks, and industry news from around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Activity className="w-5 h-5 mr-2" />
                View Status Dashboard
              </Button>
              <Button size="lg" variant="outline">
                <BarChart3 className="w-5 h-5 mr-2" />
                Browse Models
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Models</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalModels || 0}</p>
                </div>
                <Server className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Models</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.activeModels || 0}</p>
                </div>
                <Zap className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Providers</p>
                  <p className="text-3xl font-bold text-purple-600">{stats?.providers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Uptime</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats?.avgAvailability || 0}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Real-time Monitor */}
          <div className="lg:col-span-1">
            <RealtimeMonitor />
          </div>
          
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Live updates from AI models and services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                      {getSeverityIcon(activity.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                      <Badge variant={activity.severity === 'success' ? 'success' : activity.severity === 'warning' ? 'warning' : 'default'}>
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Server className="w-4 h-4 mr-2" />
                  View Model Status
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Compare Models
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Benchmarks
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Globe className="w-4 h-4 mr-2" />
                  Global Status
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription className="text-blue-100">
                  All systems operational
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Real-time monitoring active</span>
                </div>
                <div className="text-2xl font-bold mb-1">99.8%</div>
                <div className="text-sm text-blue-100">Overall availability</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Monitoring</h3>
              <p className="text-sm text-gray-600">Live status updates for AI models and services</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Performance Benchmarks</h3>
              <p className="text-sm text-gray-600">Compare AI model performance across benchmarks</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Globe className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Global Coverage</h3>
              <p className="text-sm text-gray-600">Monitor AI services across all major regions</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Trend Analysis</h3>
              <p className="text-sm text-gray-600">Track performance trends and availability metrics</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}