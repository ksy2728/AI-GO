'use client'

import { useState, useEffect } from 'react'
import { IntelligenceChart } from './charts/IntelligenceChart'
import { SpeedChart } from './charts/SpeedChart'
import { PriceChart } from './charts/PriceChart'
import { ModelHighlightsData } from '@/lib/model-metrics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, ChevronDown, ChevronUp, TrendingUp, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface ModelHighlightsSectionProps {
  className?: string
}

export function ModelHighlightsSection({ className = '' }: ModelHighlightsSectionProps) {
  const { t } = useLanguage()
  const [data, setData] = useState<ModelHighlightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchHighlights = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/v1/models/highlights')
      
      if (!response.ok) {
        throw new Error('Failed to fetch highlights')
      }
      
      const highlights = await response.json()
      setData(highlights)
      setError(null)
    } catch (err) {
      console.error('Error fetching highlights:', err)
      setError(err instanceof Error ? err.message : 'Failed to load highlights')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHighlights()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchHighlights, 300000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchHighlights()
  }

  if (loading && !data) {
    return (
      <div className={`mb-8 ${className}`}>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className={`mb-8 ${className}`}>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={`mb-8 ${className}`}>
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('models.highlights.title') || 'Model Comparison Highlights'}
                  </h2>
                  {(data?.metadata?.dataSource === 'aa-json-fallback' ||
                    data?.metadata?.dataSource === 'fallback-empty' ||
                    data?.metadata?.dataSource === 'error-fallback') && (
                    <Badge variant="outline" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Fallback Data
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {t('models.highlights.subtitle') || 'Intelligence, Performance & Price Analysis'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-gray-600"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-600"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Charts */}
        {!isCollapsed && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <IntelligenceChart
                data={data.intelligence}
                loading={isRefreshing}
                metadata={{
                  ...data.metadata,
                  dataSource: data.metadata.dataSource || 'Database'
                }}
              />
              <SpeedChart
                data={data.speed}
                loading={isRefreshing}
                metadata={{
                  ...data.metadata,
                  dataSource: data.metadata.dataSource || 'Database'
                }}
              />
              <PriceChart
                data={data.price}
                loading={isRefreshing}
                metadata={{
                  ...data.metadata,
                  dataSource: data.metadata.dataSource || 'Database'
                }}
              />
            </div>
            
            {/* Metadata */}
            <div className="mt-4 text-center text-xs text-gray-500">
              {t('models.highlights.dataInfo') || 'Data from'} {data.metadata.totalModels} {t('models.highlights.models') || 'models'} 
              {data.metadata.dataSource && ` • Source: ${data.metadata.dataSource}`}
              {data.metadata.lastUpdated && ` • Updated: ${new Date(data.metadata.lastUpdated).toLocaleTimeString()}`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default ModelHighlightsSection
