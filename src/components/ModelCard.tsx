'use client'

import { useState, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Model } from '@/types/models'
import { formatNumber } from '@/lib/utils'
import { FEATURED_MODELS, LATEST_MODELS, MODEL_BADGES } from '@/constants/models'
import { useRealtime } from '@/hooks/useRealtime'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Activity,
  Clock,
  Zap,
  TrendingUp,
  DollarSign,
  Cpu,
  Database,
  Calendar,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react'

interface ModelCardProps {
  model: Model
  isSelectedForComparison: boolean
  onCompareToggle: () => void
  disabled?: boolean
}

export const ModelCard = memo(function ModelCard({
  model,
  isSelectedForComparison,
  onCompareToggle,
  disabled = false
}: ModelCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { modelStatuses, connected } = useRealtime({
    subscribeToModels: isExpanded ? [model.id] : []
  })

  const isFeatured = FEATURED_MODELS.includes(model.name)
  const isLatest = LATEST_MODELS.includes(model.name)
  const currentStatus = modelStatuses[model.id] || model.status?.[0]
  const pricing = model.pricing?.[0]

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    const statusColors = {
      operational: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      outage: 'bg-red-100 text-red-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const getGradientPosition = (value: number, max: number = 100) => {
    return Math.min((value / max) * 100, 100)
  }

  return (
    <Card 
      className={`
        bg-white/80 backdrop-blur-sm border-0 shadow-lg 
        transition-all duration-300 group relative
        ${isExpanded ? 'hover:shadow-2xl' : 'hover:shadow-xl'}
        ${isSelectedForComparison ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}
      `}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {model.name}
              </CardTitle>
              {isLatest && (
                <Badge className={MODEL_BADGES.NEW.className}>
                  {MODEL_BADGES.NEW.label}
                </Badge>
              )}
              {isFeatured && !isLatest && (
                <Badge className={MODEL_BADGES.FEATURED.className}>
                  {MODEL_BADGES.FEATURED.label}
                </Badge>
              )}
              {connected && isExpanded && (
                <Badge variant="outline" className="animate-pulse h-5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                  Live
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              by {model.provider?.name || model.providerId}
            </CardDescription>
          </div>
          <Badge variant={model.isActive ? 'success' : 'secondary'}>
            {model.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {isSelectedForComparison && (
          <Badge variant="default" className="mt-2 bg-blue-600">
            Selected for comparison
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className={`text-sm text-gray-600 ${!isExpanded ? 'line-clamp-2' : ''}`}>
          {model.description || 'No description available'}
        </p>

        {/* Modalities */}
        <div className="flex flex-wrap gap-2">
          {model.modalities && model.modalities.length > 0 ? (
            <>
              {model.modalities.slice(0, isExpanded ? undefined : 2).map(modality => (
                <Badge key={modality} variant="outline" className="text-xs">
                  {modality}
                </Badge>
              ))}
              {!isExpanded && model.modalities.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{model.modalities.length - 2} more
                </Badge>
              )}
            </>
          ) : (
            <Badge variant="outline" className="text-xs">
              No modalities
            </Badge>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t animate-in slide-in-from-top-2 duration-300">
            {/* Status Overview */}
            {currentStatus && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900">Current Status</h3>
                  <Badge className={getStatusBadge(currentStatus.status)}>
                    {currentStatus.status === 'operational' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {currentStatus.status === 'degraded' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {currentStatus.status === 'outage' && <X className="w-3 h-3 mr-1" />}
                    {currentStatus.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-gray-600">Availability</div>
                    <div className="text-lg font-bold">{currentStatus.availability || 99.9}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Response</div>
                    <div className="text-lg font-bold">{currentStatus.latencyP50 || 0}ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Error Rate</div>
                    <div className="text-lg font-bold">{currentStatus.errorRate?.toFixed(2) || 0}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics with Gradient Bars */}
            {currentStatus && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-900">Performance Metrics</h3>
                
                {/* Availability Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-medium">Availability</span>
                    </div>
                    <span className="text-xs font-bold">{currentStatus.availability}%</span>
                  </div>
                  <div className="relative h-6 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                      style={{ left: `${getGradientPosition(currentStatus.availability)}%` }}
                    >
                      <div className="absolute -top-0.5 -left-1.5 w-3.5 h-7 bg-white rounded-full shadow border border-gray-200" />
                    </div>
                  </div>
                </div>

                {/* Response Time Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-medium">Response Time</span>
                    </div>
                    <span className="text-xs font-bold">{currentStatus.latencyP50}ms</span>
                  </div>
                  <div className="relative h-6 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                      style={{ left: `${getGradientPosition(currentStatus.latencyP50, 1000)}%` }}
                    >
                      <div className="absolute -top-0.5 -left-1.5 w-3.5 h-7 bg-white rounded-full shadow border border-gray-200" />
                    </div>
                  </div>
                </div>

                {/* Throughput Bar */}
                {currentStatus.requestsPerMin && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-purple-500" />
                        <span className="text-xs font-medium">Throughput</span>
                      </div>
                      <span className="text-xs font-bold">{currentStatus.requestsPerMin} req/min</span>
                    </div>
                    <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all duration-500"
                        style={{ height: `${Math.min((currentStatus.requestsPerMin / 1000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pricing */}
            {pricing && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Pricing
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {pricing.inputPerMillion && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-green-700">Input</div>
                      <div className="text-sm font-bold text-green-900">
                        ${pricing.inputPerMillion}
                        <span className="text-xs font-normal"> /1M</span>
                      </div>
                    </div>
                  )}
                  {pricing.outputPerMillion && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-blue-700">Output</div>
                      <div className="text-sm font-bold text-blue-900">
                        ${pricing.outputPerMillion}
                        <span className="text-xs font-normal"> /1M</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Specifications */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Specifications</h3>
              <div className="space-y-2">
                {model.contextWindow && (
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">Context:</span>
                    <span className="text-xs font-medium">{formatNumber(model.contextWindow)} tokens</span>
                  </div>
                )}
                {model.maxOutputTokens && (
                  <div className="flex items-center gap-2">
                    <Database className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">Max Output:</span>
                    <span className="text-xs font-medium">{formatNumber(model.maxOutputTokens)} tokens</span>
                  </div>
                )}
                {model.trainingCutoff && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">Training:</span>
                    <span className="text-xs font-medium">
                      {new Date(model.trainingCutoff).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {model.capabilities && model.capabilities.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Shield className="w-3 h-3 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-600">Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.capabilities.map(capability => (
                          <Badge key={capability} variant="secondary" className="text-xs h-5">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Deprecation Warning */}
            {(model.deprecatedAt || model.sunsetAt) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-medium text-yellow-900">Deprecation Notice</h4>
                    {model.sunsetAt && (
                      <p className="text-xs text-yellow-800 mt-1">
                        Sunset: {new Date(model.sunsetAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 group-hover:bg-blue-50 group-hover:border-blue-300 h-9"
            onClick={toggleExpand}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Expand Details
              </>
            )}
          </Button>
          <Button
            variant={isSelectedForComparison ? 'default' : 'outline'}
            size="sm"
            className={`w-9 h-9 p-0 shrink-0 ${
              isSelectedForComparison ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'hover:bg-blue-50'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onCompareToggle()
            }}
            disabled={disabled}
          >
            {isSelectedForComparison ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})