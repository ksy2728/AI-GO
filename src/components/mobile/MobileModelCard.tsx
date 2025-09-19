'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExpandableCard, ExpandableModelCard } from './ExpandableCard'
import { UnifiedModel } from '@/types/unified-models'
import { cn } from '@/lib/utils'
import {
  Brain,
  Zap,
  DollarSign,
  Activity,
  ExternalLink,
  Star,
  TrendingUp,
  Clock,
  Globe
} from 'lucide-react'

interface MobileModelCardProps {
  model: UnifiedModel
  index: number
  isExpanded?: boolean
  onExpansionChange?: (expanded: boolean) => void
  onViewDetails?: (model: UnifiedModel) => void
  className?: string
}

export function MobileModelCard({
  model,
  index,
  isExpanded = false,
  onExpansionChange,
  onViewDetails,
  className
}: MobileModelCardProps) {
  // Format price display
  const formatPrice = (input?: number, output?: number) => {
    if (input === undefined && output === undefined) {
      return <span className="text-gray-400">—</span>
    }

    return (
      <div className="text-xs">
        {input !== undefined && (
          <div>In: ${(input / 1000).toFixed(3)}</div>
        )}
        {output !== undefined && (
          <div>Out: ${(output / 1000).toFixed(3)}</div>
        )}
      </div>
    )
  }

  // Get status styling
  const getStatusStyling = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'operational':
        return { color: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500' }
      case 'degraded':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', dot: 'bg-yellow-500' }
      case 'down':
        return { color: 'text-red-600', bg: 'bg-red-100', dot: 'bg-red-500' }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-500' }
    }
  }

  const statusStyling = getStatusStyling(model.status)

  return (
    <ExpandableModelCard
      model={{
        name: model.name,
        provider: model.provider,
        status: model.status,
        intelligence: model.intelligence,
        speed: model.speed,
        description: model.description
      }}
      defaultExpanded={isExpanded}
      onExpansionChange={onExpansionChange}
      className={className}
    >
      {/* Detailed Information */}
      <div className="space-y-4">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Intelligence Score */}
          {model.intelligence && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-600 mb-1">Intelligence</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${model.intelligence}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {model.intelligence}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Speed Score */}
          {model.speed && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-600 mb-1">Speed</div>
                <div className="text-sm font-bold text-yellow-600">
                  {model.speed}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pricing */}
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs text-gray-600 mb-1">Pricing</div>
              <div className="text-sm font-medium text-green-600">
                {formatPrice(model.priceInput, model.priceOutput)}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: statusStyling.bg.replace('bg-', '') + '20' }}>
            <Activity className={cn('w-5 h-5 flex-shrink-0', statusStyling.color)} />
            <div className="min-w-0">
              <div className="text-xs text-gray-600 mb-1">Status</div>
              <div className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', statusStyling.dot)} />
                <span className={cn('text-sm font-medium capitalize', statusStyling.color)}>
                  {model.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ranking Information */}
        {model.aa?.rank && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">Artificial Analysis Ranking</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-600" />
                <span className="text-lg font-bold text-purple-600">#{model.aa.rank}</span>
              </div>
              {model.rankScore && (
                <div className="text-right">
                  <div className="text-xs text-gray-600">Score</div>
                  <div className="text-sm font-medium text-purple-600">
                    {model.rankScore.toFixed(1)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Model Description */}
        {model.description && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Description</div>
            <p className="text-sm text-gray-800 leading-relaxed">
              {model.description}
            </p>
          </div>
        )}

        {/* Additional Details */}
        <div className="space-y-3">
          {/* Provider Info */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Provider</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {model.provider}
            </Badge>
          </div>

          {/* Last Updated */}
          {model.lastUpdated && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Last Updated</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(model.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 touch-manipulation"
            onClick={() => onViewDetails?.(model)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </Button>

        </div>
      </div>
    </ExpandableModelCard>
  )
}

// Compact version for list views
export function CompactMobileModelCard({
  model,
  index,
  onViewDetails,
  className
}: Omit<MobileModelCardProps, 'isExpanded' | 'onExpansionChange'>) {
  const statusStyling = getStatusStyling(model.status)

  return (
    <Card className={cn('touch-manipulation hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank Badge */}
          {model.aa?.rank && (
            <div className="flex-shrink-0">
              <Badge variant="outline" className="text-xs font-mono">
                #{model.aa.rank}
              </Badge>
            </div>
          )}

          {/* Model Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {model.name}
                </h3>
                <p className="text-xs text-gray-600 truncate">
                  {model.provider}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 touch-manipulation"
                onClick={() => onViewDetails?.(model)}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 mt-2">
              {model.intelligence && (
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium">{model.intelligence}</span>
                </div>
              )}

              {model.speed && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-medium">{model.speed}</span>
                </div>
              )}

              {model.status && (
                <div className="flex items-center gap-1">
                  <div className={cn('w-2 h-2 rounded-full', statusStyling.dot)} />
                  <span className={cn('text-xs capitalize', statusStyling.color)}>
                    {model.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusStyling(status?: string) {
  switch (status?.toLowerCase()) {
    case 'operational':
      return { color: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500' }
    case 'degraded':
      return { color: 'text-yellow-600', bg: 'bg-yellow-100', dot: 'bg-yellow-500' }
    case 'down':
      return { color: 'text-red-600', bg: 'bg-red-100', dot: 'bg-red-500' }
    default:
      return { color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-500' }
  }
}