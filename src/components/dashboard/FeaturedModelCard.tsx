'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RegionSelectCompact } from '@/components/ui/region-select'
import { RealTimeStatusBadge } from '@/components/monitoring/RealTimeStatusBadge'
import { ModelStatusPopup } from './ModelStatusPopup'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRegion, useModelMetrics, useRegionApi } from '@/contexts/RegionContext'
import { 
  ChevronRight,
  Trophy,
  Medal,
  Award,
  MapPin
} from 'lucide-react'

interface FeaturedModelCardProps {
  model: {
    id: string
    rank?: number
    name: string
    provider: string
    providerLogo?: string
    status: 'operational' | 'degraded' | 'outage'
    availability: number
    responseTime: number
    errorRate: number
    throughput: number
    description?: string
    capabilities?: string[]
    intelligenceIndex?: number
    inputPrice?: number
    outputPrice?: number
  }
}

export function FeaturedModelCard({ model }: FeaturedModelCardProps) {
  const { t } = useLanguage()
  const [showPopup, setShowPopup] = useState(false)
  
  // Region context integration - Fixed infinite loop
  const { selectedRegion, isLoading } = useRegion()
  const { fetchModelMetrics } = useRegionApi()
  const regionMetrics = useModelMetrics(model.id)
  
  // Local state for region selection to prevent infinite loop
  const [localRegion, setLocalRegion] = useState(selectedRegion)
  
  // State for region-specific metrics - ALWAYS start with operational status
  const [displayMetrics, setDisplayMetrics] = useState({
    availability: model.availability,
    responseTime: model.responseTime,
    errorRate: model.errorRate,
    throughput: model.throughput,
    status: 'operational' as const // ALWAYS operational by default
  })

  // Sync local region with global region
  useEffect(() => {
    setLocalRegion(selectedRegion)
  }, [selectedRegion])

  // Fetch region-specific metrics when local region changes
  useEffect(() => {
    const fetchRegionData = async () => {
      try {
        // Simulate region-specific metrics with slight variations
        const regionVariance = localRegion.code === 'us-east-1' ? 0 : 
                              localRegion.code === 'eu-west-1' ? 10 :
                              localRegion.code === 'ap-northeast-1' ? 20 : 5;
        
        setDisplayMetrics({
          availability: Math.max(95, model.availability - (regionVariance * 0.1)),
          responseTime: model.responseTime + regionVariance,
          errorRate: Math.min(0.1, model.errorRate + (regionVariance * 0.001)),
          throughput: Math.max(100, model.throughput - (regionVariance * 10)),
          status: 'operational'
        })
      } catch (error) {
        console.warn('Using default metrics:', error)
        setDisplayMetrics({
          availability: model.availability || 99.5,
          responseTime: model.responseTime || 250,
          errorRate: model.errorRate || 0.02,
          throughput: model.throughput || 800,
          status: 'operational'
        })
      }
    }

    fetchRegionData()
  }, [localRegion, model])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'outage':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      case 'degraded':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      case 'outage':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  // Removed formatResponseTime - no longer needed after metrics cleanup

  const getRankBadge = (rank?: number) => {
    if (!rank) return null;
    
    switch (rank) {
      case 1:
        return (
          <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg z-20">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-bold">#1</span>
          </div>
        );
      case 2:
        return (
          <div className="absolute -top-2 -left-2 bg-gradient-to-r from-gray-400 to-gray-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg z-20">
            <Medal className="w-4 h-4" />
            <span className="text-sm font-bold">#2</span>
          </div>
        );
      case 3:
        return (
          <div className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg z-20">
            <Award className="w-4 h-4" />
            <span className="text-sm font-bold">#3</span>
          </div>
        );
      default:
        return (
          <div className="absolute -top-2 -left-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white px-2 py-1 rounded-full shadow-lg z-20">
            <span className="text-sm font-bold">#{rank}</span>
          </div>
        );
    }
  }

  return (
    <>
      {/* Container with relative positioning to allow badge overflow */}
      <div className="relative">
        {/* Ranking Badge - positioned outside the card */}
        {getRankBadge(model.rank)}
        
        <Card
          className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 hover:border-blue-200"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50" />

          <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {model.providerLogo ? (
                <img 
                  src={model.providerLogo} 
                  alt={model.provider}
                  className="w-10 h-10 rounded-lg object-contain bg-white p-1 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {model.provider.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                <p className="text-sm text-gray-500">{model.provider}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {/* Real-time status badge */}
              <RealTimeStatusBadge 
                modelId={model.id}
                fallbackStatus={displayMetrics.status}
                showDetails={false}
                className="z-10"
              />
              
              {/* Region Selector - Fixed with local state */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <RegionSelectCompact
                  value={localRegion}
                  onValueChange={setLocalRegion}
                  disabled={isLoading}
                  className="min-w-[100px]"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          {model.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {model.description}
            </p>
          )}

          {/* Intelligence Index */}
          {model.intelligenceIndex && (
            <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Intelligence Index</span>
                <span className="text-sm font-bold text-purple-700">{model.intelligenceIndex.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Removed detailed metrics - available in detailed view */}

          {/* Region indicator */}
          {isLoading && (
            <div className="flex items-center justify-center py-2 mb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading {selectedRegion.name} metrics...</span>
              </div>
            </div>
          )}

          {/* Capabilities */}
          {model.capabilities && model.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {model.capabilities.slice(0, 3).map((capability, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {capability}
                </Badge>
              ))}
              {model.capabilities.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{model.capabilities.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* View Details Button */}
          <button
            onClick={() => setShowPopup(true)}
            className="w-full flex items-center justify-between pt-3 border-t border-gray-100 hover:bg-gray-50 -mx-6 px-6 -mb-6 pb-6 mt-3 transition-colors"
          >
            <span className="text-sm text-blue-600 font-medium">
              {t('dashboard.featuredModels.viewDetails') || 'View Details'}
            </span>
            <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </button>
          </div>
        </Card>
      </div>

      {/* Model Status Popup */}
      {showPopup && (
        <ModelStatusPopup
          model={model}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  )
}