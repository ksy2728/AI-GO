'use client'

import { useEffect, useState } from 'react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RealtimeChart } from '@/components/dashboard/RealtimeChart'
import { ModelStatusGrid } from '@/components/dashboard/ModelStatusGrid'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { useRealtime } from '@/hooks/useRealtime'
import { api } from '@/lib/api-client'
import { 
  Server, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  Cpu,
  Globe,
  Zap,
  Shield
} from 'lucide-react'

export default function DashboardPage() {
  const { globalStats, connected, error: realtimeError } = useRealtime({
    subscribeToGlobal: true
  })
  const [loading, setLoading] = useState(true)
  const [previousStats, setPreviousStats] = useState<any>(null)

  useEffect(() => {
    // Store previous stats for comparison
    if (globalStats && !previousStats) {
      setPreviousStats(globalStats)
    }
    if (globalStats) {
      setLoading(false)
    }
  }, [globalStats, previousStats])

  // Calculate changes
  const calculateChange = (current?: number, previous?: number) => {
    if (!current || !previous || previous === 0) return 0
    return Number(((current - previous) / previous * 100).toFixed(1))
  }

  const totalModelsChange = calculateChange(globalStats?.totalModels, previousStats?.totalModels)
  const activeModelsChange = calculateChange(globalStats?.activeModels, previousStats?.activeModels)
  const availabilityChange = calculateChange(globalStats?.avgAvailability, previousStats?.avgAvailability)
  const operationalChange = calculateChange(globalStats?.operationalModels, previousStats?.operationalModels)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Model Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time monitoring and analytics for AI model performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              {connected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-700 font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-red-700 font-medium">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Models"
            value={globalStats?.totalModels || 0}
            change={totalModelsChange}
            changeLabel="last update"
            trend={totalModelsChange > 0 ? 'up' : totalModelsChange < 0 ? 'down' : 'neutral'}
            icon={<Server className="w-8 h-8" />}
            loading={loading}
          />
          <StatsCard
            title="Active Models"
            value={globalStats?.activeModels || 0}
            change={activeModelsChange}
            changeLabel="last update"
            trend={activeModelsChange > 0 ? 'up' : activeModelsChange < 0 ? 'down' : 'neutral'}
            icon={<Activity className="w-8 h-8" />}
            loading={loading}
          />
          <StatsCard
            title="Avg Availability"
            value={`${globalStats?.avgAvailability?.toFixed(1) || 0}%`}
            change={availabilityChange}
            changeLabel="last update"
            trend={availabilityChange > 0 ? 'up' : availabilityChange < 0 ? 'down' : 'neutral'}
            icon={<TrendingUp className="w-8 h-8" />}
            loading={loading}
          />
          <StatsCard
            title="Operational"
            value={globalStats?.operationalModels || 0}
            description={`${globalStats?.degradedModels || 0} degraded, ${globalStats?.outageModels || 0} outage`}
            trend={operationalChange > 0 ? 'up' : operationalChange < 0 ? 'down' : 'neutral'}
            icon={<Shield className="w-8 h-8" />}
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RealtimeChart
            title="Active Models Trend"
            description="Real-time active model count"
            type="area"
            dataKey="activeModels"
            color="#3b82f6"
            height={250}
          />
          <RealtimeChart
            title="Average Availability"
            description="System-wide availability percentage"
            type="line"
            dataKey="avgAvailability"
            color="#10b981"
            height={250}
          />
        </div>

        {/* Model Status Grid */}
        <div className="mb-8">
          <ModelStatusGrid />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RealtimeChart
              title="Model Performance Overview"
              description="Operational vs Degraded vs Outage"
              type="bar"
              dataKey="operationalModels"
              color="#6366f1"
              height={350}
            />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>

        {/* Additional Info */}
        {realtimeError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">
                Real-time connection error: {realtimeError}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}