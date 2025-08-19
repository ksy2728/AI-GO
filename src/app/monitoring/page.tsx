'use client'

import { useEffect, useState } from 'react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { UnifiedChart } from '@/components/monitoring/UnifiedChart'
import { MetricDescriptions } from '@/components/monitoring/MetricDescriptions'
import { useRealtime } from '@/hooks/useRealtime'
import { api } from '@/lib/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  Server, 
  Activity, 
  TrendingUp, 
  Shield,
  AlertCircle
} from 'lucide-react'

export default function MonitoringPage() {
  const { t } = useLanguage()
  const { globalStats, connected, error: realtimeError } = useRealtime({
    subscribeToGlobal: true
  })
  const [apiStats, setApiStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [previousStats, setPreviousStats] = useState<any>(null)

  // Load data via REST API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.getModelStats()
        setApiStats(stats)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setLoading(false)
      }
    }

    if (!globalStats) {
      fetchStats()
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [globalStats])

  // Use real-time data if available, otherwise use API data
  const currentStats = globalStats || apiStats

  useEffect(() => {
    if (currentStats && !previousStats) {
      setPreviousStats(currentStats)
    }
    if (currentStats) {
      setLoading(false)
    }
  }, [currentStats, previousStats])

  // Calculate changes
  const calculateChange = (current?: number, previous?: number) => {
    if (!current || !previous || previous === 0) return 0
    return Number(((current - previous) / previous * 100).toFixed(1))
  }

  const totalModelsChange = calculateChange(currentStats?.totalModels, previousStats?.totalModels)
  const activeModelsChange = calculateChange(currentStats?.activeModels, previousStats?.activeModels)
  const availabilityChange = calculateChange(currentStats?.avgAvailability, previousStats?.avgAvailability)
  const operationalChange = calculateChange(currentStats?.operationalModels, previousStats?.operationalModels)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('monitoring.title')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('monitoring.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {connected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-700 font-medium">{t('dashboard.status.live')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-blue-700 font-medium">{t('dashboard.status.apiMode')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <StatsCard
            title={t('dashboard.stats.totalModels')}
            value={currentStats?.totalModels || 0}
            change={totalModelsChange}
            changeLabel={t('dashboard.stats.lastUpdate')}
            trend={totalModelsChange > 0 ? 'up' : totalModelsChange < 0 ? 'down' : 'neutral'}
            icon={<Server className="w-8 h-8" />}
            loading={loading}
          />
          <StatsCard
            title={t('dashboard.stats.activeModels')}
            value={currentStats?.activeModels || 0}
            change={activeModelsChange}
            changeLabel={t('dashboard.stats.lastUpdate')}
            trend={activeModelsChange > 0 ? 'up' : activeModelsChange < 0 ? 'down' : 'neutral'}
            icon={<Activity className="w-8 h-8" />}
            loading={loading}
          />
          <StatsCard
            title={t('dashboard.stats.avgAvailability')}
            value={`${currentStats?.avgAvailability?.toFixed(1) || 0}%`}
            change={availabilityChange}
            changeLabel={t('dashboard.stats.lastUpdate')}
            trend={availabilityChange > 0 ? 'up' : availabilityChange < 0 ? 'down' : 'neutral'}
            icon={<TrendingUp className="w-8 h-8" />}
            loading={loading}
          />
          <StatsCard
            title={t('dashboard.stats.operational')}
            value={currentStats?.operationalModels || 0}
            description={`${currentStats?.degradedModels || 0} ${t('dashboard.legend.degraded')?.toLowerCase() || 'degraded'}, ${currentStats?.outageModels || 0} ${t('dashboard.legend.outage')?.toLowerCase() || 'outage'}`}
            trend={operationalChange > 0 ? 'up' : operationalChange < 0 ? 'down' : 'neutral'}
            icon={<Shield className="w-8 h-8" />}
            loading={loading}
          />
        </div>

        {/* Unified Chart */}
        <div className="mb-4">
          <UnifiedChart />
        </div>

        {/* Metric Descriptions */}
        <div className="mb-4">
          <MetricDescriptions />
        </div>

        {/* Additional Info */}
        {realtimeError && !realtimeError.includes('disabled') && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                {t('dashboard.alerts.apiMode')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}