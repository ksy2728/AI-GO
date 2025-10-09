'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RegionSelectCompact } from '@/components/ui/region-select'
import { RealTimeStatusBadge } from '@/components/monitoring/RealTimeStatusBadge'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRegion, useModelMetrics, useRegionApi, type RegionModelMetrics, normalizeRegionStatus } from '@/contexts/RegionContext'
import { Region, getRegionByCode } from '@/types/regions'
import { 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trophy,
  Medal,
  Award,
  MapPin,
  Activity,
  Clock,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'

// Import Model type from the hook for consistency
import type { Model, ModelStatus } from '@/hooks/useFeaturedModels'

interface FeaturedModelCardProps {
  model: Model
}

export function FeaturedModelCard({ model }: FeaturedModelCardProps) {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Global region context (fallback)
  const { selectedRegion: globalRegion } = useRegion()
  const { fetchModelMetrics } = useRegionApi()

  // Per-card region state with localStorage persistence
  const [cardRegion, setCardRegion] = useState<Region>(() => {
    // Client-side only: Load from localStorage for this specific model
    if (typeof window !== 'undefined') {
      const savedRegionCode = localStorage.getItem(`ai-go-model-region-${model.id}`)
      if (savedRegionCode) {
        const savedRegion = getRegionByCode(savedRegionCode)
        if (savedRegion) return savedRegion
      }
    }
    // Fallback to global region
    return globalRegion
  })

  const [isLoadingRegion, setIsLoadingRegion] = useState(false)
  const regionMetrics = useModelMetrics(model.id)

  // State for region-specific metrics
  const [displayMetrics, setDisplayMetrics] = useState<{
    availability: number
    responseTime: number
    errorRate: number
    throughput: number
    status: ModelStatus
  }>({
    availability: model.availability,
    responseTime: model.responseTime,
    errorRate: model.errorRate,
    throughput: model.throughput,
    status: model.status
  })

  // Handler for region change with localStorage persistence
  const handleRegionChange = (region: Region) => {
    if (region.code === cardRegion.code) return // Prevent unnecessary updates

    setCardRegion(region)
    setIsLoadingRegion(true)

    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ai-go-model-region-${model.id}`, region.code)
    }

    // Fetch new region metrics immediately
    fetchModelMetrics(model.id, region.code)
      .then(() => {
        setIsLoadingRegion(false)
      })
      .catch(error => {
        console.warn('Failed to fetch metrics for region:', error)
        setIsLoadingRegion(false)
      })
  }

  // Fetch region-specific metrics when card region changes
  useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const applyMetrics = (metrics: RegionModelMetrics) => {
      const availability = typeof metrics.availability === 'number' ? metrics.availability : model.availability || 99.5
      const responseTime = typeof metrics.responseTime === 'number' ? metrics.responseTime : model.responseTime || 250
      const errorRate = typeof metrics.errorRate === 'number' ? metrics.errorRate : model.errorRate || 0.02
      const throughput = typeof metrics.throughput === 'number' ? metrics.throughput : model.throughput || 800
      const status = normalizeRegionStatus(metrics.status, model.status)

      setDisplayMetrics({
        availability,
        responseTime,
        errorRate,
        throughput,
        status
      })
    }

    if (regionMetrics) {
      applyMetrics(regionMetrics)
      return () => {
        cancelled = true
      }
    }

    // Debounce metrics fetching to prevent rapid successive calls
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        fetchModelMetrics(model.id, cardRegion.code)
          .then(metrics => {
            if (!cancelled) {
              applyMetrics(metrics)
            }
          })
          .catch(error => {
            console.warn('Using default metrics:', error)
            if (!cancelled) {
              setDisplayMetrics({
                availability: model.availability || 99.5,
                responseTime: model.responseTime || 250,
                errorRate: model.errorRate || 0.02,
                throughput: model.throughput || 800,
                status: model.status
              })
            }
          })
      }
    }, 100)

    return () => {
      cancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [regionMetrics, fetchModelMetrics, model.id, model.availability, model.responseTime, model.errorRate, model.throughput, model.status, cardRegion.code])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'down':
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
      case 'down':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const getGradientPosition = (value: number, max: number = 100) => {
    return (value / max) * 100
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
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
              {model.providerLogo && !imageError ? (
                <img 
                  src={model.providerLogo} 
                  alt={`${model.provider} logo`}
                  className="w-10 h-10 rounded-lg object-contain bg-white p-1 shadow-sm"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
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
                selectedRegion={cardRegion}
                fallbackStatus={displayMetrics.status}
                showDetails={false}
                className="z-10"
              />

              {/* Per-card Region Selector */}
              <RegionSelectCompact
                value={cardRegion}
                onValueChange={handleRegionChange}
                disabled={isLoadingRegion}
                className="w-[140px]"
              />
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

          {/* Region loading indicator */}
          {isLoadingRegion && (
            <div className="flex items-center justify-center py-2 mb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading {cardRegion.name} metrics...</span>
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

          {/* Expanded Content - Status Metrics */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-2 duration-300">
              {/* Status Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900">Current Status</h3>
                  <Badge className={getStatusColor(displayMetrics.status)}>
                    {displayMetrics.status === 'operational' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {displayMetrics.status === 'degraded' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {displayMetrics.status === 'down' && <X className="w-3 h-3 mr-1" />}
                    <span className="capitalize">{displayMetrics.status}</span>
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-gray-600">Availability</div>
                    <div className="text-lg font-bold">{displayMetrics.availability.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Response</div>
                    <div className="text-lg font-bold">{displayMetrics.responseTime}ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Error Rate</div>
                    <div className="text-lg font-bold">{displayMetrics.errorRate.toFixed(2)}%</div>
                  </div>
                </div>
              </div>

              {/* Availability Gradient Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Availability</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{displayMetrics.availability.toFixed(1)}%</span>
                </div>
                <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ 
                      left: `${getGradientPosition(displayMetrics.availability)}%`,
                      transition: 'left 0.5s ease-out'
                    }}
                  >
                    <div className="absolute -top-1 -left-2 w-5 h-10 bg-white rounded-full shadow-lg border-2 border-gray-200" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Response Time Gradient Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Response Time</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{displayMetrics.responseTime}ms</span>
                </div>
                <div className="relative h-8 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ 
                      left: `${Math.min(getGradientPosition(displayMetrics.responseTime, 1000), 100)}%`,
                      transition: 'left 0.5s ease-out'
                    }}
                  >
                    <div className="absolute -top-1 -left-2 w-5 h-10 bg-white rounded-full shadow-lg border-2 border-gray-200" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Fast (0ms)</span>
                  <span>500ms</span>
                  <span>Slow (1000ms+)</span>
                </div>
              </div>

              {/* Error Rate Gradient Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Error Rate</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{displayMetrics.errorRate.toFixed(2)}%</span>
                </div>
                <div className="relative h-8 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ 
                      left: `${Math.min(getGradientPosition(displayMetrics.errorRate, 5), 100)}%`,
                      transition: 'left 0.5s ease-out'
                    }}
                  >
                    <div className="absolute -top-1 -left-2 w-5 h-10 bg-white rounded-full shadow-lg border-2 border-gray-200" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low (0%)</span>
                  <span>2.5%</span>
                  <span>High (5%+)</span>
                </div>
              </div>

              {/* Throughput Bar Chart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Throughput</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{displayMetrics.throughput} req/s</span>
                </div>
                <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500"
                    style={{ 
                      height: `${Math.min((displayMetrics.throughput / 1000) * 100, 100)}%`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {displayMetrics.throughput} / 1000 req/s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expand/Collapse Button */}
          <Button
            onClick={toggleExpand}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 mt-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm font-medium">Collapse Details</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="text-sm font-medium">View Details</span>
              </>
            )}
          </Button>
          </div>
        </Card>
      </div>
    </>
  )
}