'use client'

import { FeaturedModelCard } from '@/components/dashboard/FeaturedModelCard'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFeaturedModels, DATA_SOURCE, type Model } from '@/hooks/useFeaturedModels'
import { TrendingUp, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  const { t } = useLanguage()
  const { models, isLoading, error, dataSource, freshness, refetch } = useFeaturedModels()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-700 font-medium">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Models Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-900">
                Top {models.length} AI Models from Leading Providers
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Data Source Indicators */}
              <div className="flex items-center gap-2 text-xs">
                {dataSource === DATA_SOURCE.FEATURED && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    📌 Pinned
                  </span>
                )}
                {dataSource === DATA_SOURCE.LIVE && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    🟢 Live
                  </span>
                )}
                {dataSource === DATA_SOURCE.CACHE && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                    🟡 Cached
                  </span>
                )}
                {dataSource === DATA_SOURCE.FALLBACK && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                    ⚪ Fallback
                  </span>
                )}
                <span className="text-gray-500">
                  {freshness.isStale && '⚠️'} {freshness.display}
                </span>
              </div>
              {/* Refresh Button */}
              <button
                onClick={refetch}
                disabled={isLoading}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && dataSource === DATA_SOURCE.FALLBACK && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ Using fallback data. Live data temporarily unavailable.
              </p>
            </div>
          )}

          {/* Featured Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model: Model) => (
              <FeaturedModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}