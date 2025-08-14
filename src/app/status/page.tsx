'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  Globe,
  Zap
} from 'lucide-react'

interface StatusData {
  overall: {
    status: 'operational' | 'degraded' | 'outage'
    availability: number
    lastUpdated: string
  }
  models: Array<{
    id: string
    name: string
    provider: string
    status: 'operational' | 'degraded' | 'outage'
    availability: number
    latency: number
    lastChecked: string
    region: string
  }>
  incidents: Array<{
    id: string
    title: string
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
    severity: 'minor' | 'major' | 'critical'
    startedAt: string
    description: string
  }>
}

export default function StatusPage() {
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        // Mock data for demonstration
        setStatusData({
          overall: {
            status: 'operational',
            availability: 99.8,
            lastUpdated: new Date().toISOString()
          },
          models: [
            {
              id: '1',
              name: 'GPT-4 Turbo',
              provider: 'OpenAI',
              status: 'operational',
              availability: 99.9,
              latency: 150,
              lastChecked: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
              region: 'US-East'
            },
            {
              id: '2',
              name: 'Claude 3 Opus',
              provider: 'Anthropic',
              status: 'operational',
              availability: 99.7,
              latency: 180,
              lastChecked: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
              region: 'US-West'
            },
            {
              id: '3',
              name: 'Gemini Ultra',
              provider: 'Google',
              status: 'degraded',
              availability: 97.8,
              latency: 350,
              lastChecked: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
              region: 'Europe'
            },
            {
              id: '4',
              name: 'Llama 3 70B',
              provider: 'Meta',
              status: 'operational',
              availability: 99.5,
              latency: 200,
              lastChecked: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
              region: 'Asia'
            }
          ],
          incidents: [
            {
              id: '1',
              title: 'Elevated API Response Times',
              status: 'monitoring',
              severity: 'minor',
              startedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
              description: 'Some users may experience slightly higher than normal API response times.'
            },
            {
              id: '2',
              title: 'Gemini Ultra Performance Degradation',
              status: 'identified',
              severity: 'major',
              startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              description: 'We are investigating reports of performance issues with Gemini Ultra in the Europe region.'
            }
          ]
        })
      } catch (error) {
        console.error('Failed to fetch status data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatusData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatusData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success'
      case 'monitoring':
        return 'warning'
      case 'investigating':
      case 'identified':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'major':
        return 'warning'
      case 'minor':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  const operationalCount = statusData?.models.filter(m => m.status === 'operational').length || 0
  const totalCount = statusData?.models.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
              <p className="text-gray-600 mt-2">
                Real-time monitoring of AI model availability and performance
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(statusData?.overall.status || 'operational')}
                <span className="text-lg font-semibold capitalize">
                  {statusData?.overall.status || 'operational'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Last updated {formatRelativeTime(statusData?.overall.lastUpdated || new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Overall System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {statusData?.overall.availability}%
                </div>
                <div className="text-sm text-green-700">Overall Availability</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {operationalCount}/{totalCount}
                </div>
                <div className="text-sm text-blue-700">Models Operational</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {statusData?.incidents.filter(i => i.status !== 'resolved').length || 0}
                </div>
                <div className="text-sm text-purple-700">Active Incidents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Status */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-6 h-6 text-blue-600" />
              Model Status
            </CardTitle>
            <CardDescription>
              Real-time status of AI models across all providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusData?.models.map((model) => (
                <div key={model.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(model.status)}
                    <div>
                      <div className="font-semibold text-gray-900">{model.name}</div>
                      <div className="text-sm text-gray-600">
                        {model.provider} • {model.region}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{model.availability}%</div>
                      <div className="text-gray-500">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{model.latency}ms</div>
                      <div className="text-gray-500">Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">
                        {formatRelativeTime(model.lastChecked)}
                      </div>
                      <div className="text-gray-500">Last checked</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incidents */}
        {statusData?.incidents && statusData.incidents.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                Recent Incidents
              </CardTitle>
              <CardDescription>
                Current and recent system incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusData.incidents.map((incident) => (
                  <div key={incident.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{incident.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge variant={getIncidentStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Started {formatRelativeTime(incident.startedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}