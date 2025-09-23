'use client'

import React, { useState, useMemo } from 'react'
import { UnifiedModel } from '@/types/unified-models'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DataSourceBadge } from '@/components/ui/DataSourceBadge'
import {
  Brain,
  Zap,
  DollarSign,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react'

interface UnifiedModelTableProps {
  models: UnifiedModel[]
  loading?: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onFilterChange?: (filters: any) => void
  filters?: any
  enableShowMore?: boolean  // New prop to enable show more feature
}

type SortField = 'name' | 'provider' | 'intelligence' | 'speed' | 'priceInput' | 'status' | 'rankScore'
type SortDirection = 'asc' | 'desc' | null

const INITIAL_DISPLAY_COUNT = 20
const INCREMENT_COUNT = 20

export function UnifiedModelTable({
  models,
  loading = false,
  currentPage,
  totalPages,
  onPageChange,
  onFilterChange,
  filters,
  enableShowMore = true  // Default to true
}: UnifiedModelTableProps) {
  const [sortField, setSortField] = useState<SortField>('rankScore')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT)

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null -> asc
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField('rankScore') // Reset to default
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sort models client-side
  const sortedModels = useMemo(() => {
    if (!sortDirection || !sortField) {
      return models
    }

    return [...models].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      // Handle undefined/null values
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      // Handle string comparisons
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      // Handle numeric comparisons
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      // Handle string comparisons
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [models, sortField, sortDirection])

  // Models to display based on displayCount
  const displayedModels = useMemo(() => {
    if (!enableShowMore) {
      return sortedModels
    }
    return sortedModels.slice(0, displayCount)
  }, [sortedModels, displayCount, enableShowMore])

  // Handlers for show more/less
  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + INCREMENT_COUNT, sortedModels.length))
  }

  const handleShowAll = () => {
    setDisplayCount(sortedModels.length)
  }

  const handleShowLess = () => {
    setDisplayCount(INITIAL_DISPLAY_COUNT)
  }

  const hasMore = enableShowMore && displayCount < sortedModels.length
  const isShowingAll = enableShowMore && displayCount >= sortedModels.length
  const canShowLess = enableShowMore && displayCount > INITIAL_DISPLAY_COUNT

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 text-blue-600" />
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4 text-blue-600" />
    }
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />
  }

  // Format status badge
  const formatStatusBadge = (status?: string) => {
    const statusConfig = {
      operational: { variant: 'default' as const, color: 'text-green-600' },
      degraded: { variant: 'secondary' as const, color: 'text-yellow-600' },
      down: { variant: 'destructive' as const, color: 'text-red-600' },
      unknown: { variant: 'outline' as const, color: 'text-gray-600' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown

    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        <Activity className="w-3 h-3 mr-1" />
        {status || 'Unknown'}
      </Badge>
    )
  }

  // Format price display with better handling of null/zero values
  const formatPrice = (input?: number, output?: number) => {
    // If both are undefined, null, or zero, show N/A
    if ((!input || input === 0) && (!output || output === 0)) {
      return <span className="text-gray-400">N/A</span>
    }

    return (
      <div className="text-xs space-y-1">
        {input && input > 0 ? (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">In:</span>
            <span className="font-medium">${input.toFixed(3)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">In:</span>
            <span className="text-gray-400">—</span>
          </div>
        )}
        {output && output > 0 ? (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Out:</span>
            <span className="font-medium">${output.toFixed(3)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Out:</span>
            <span className="text-gray-400">—</span>
          </div>
        )}
      </div>
    )
  }

  // Loading skeleton
  if (loading && models.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <div className="flex-1" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (models.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
        <p className="text-gray-600 mb-4">
          Try adjusting your filters or search terms
        </p>
        {onFilterChange && (
          <Button
            onClick={() => onFilterChange({})}
            variant="outline"
          >
            Clear filters
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0"
                    onClick={() => handleSort('rankScore')}
                  >
                    #
                    {renderSortIcon('rankScore')}
                  </Button>
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort('name')}
                  >
                    Model Name
                    {renderSortIcon('name')}
                  </Button>
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort('provider')}
                  >
                    Provider
                    {renderSortIcon('provider')}
                  </Button>
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort('intelligence')}
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    Intelligence
                    {renderSortIcon('intelligence')}
                  </Button>
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort('speed')}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Speed
                    {renderSortIcon('speed')}
                  </Button>
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort('priceInput')}
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Price
                    {renderSortIcon('priceInput')}
                  </Button>
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {renderSortIcon('status')}
                  </Button>
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {displayedModels.map((model, index) => (
                <tr key={model.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}>
                  {/* Rank */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-center">
                    {model.aa?.rank || '—'}
                  </td>

                  {/* Model Name */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {model.name}
                        </span>
                        {model.detailedSource && (
                          <DataSourceBadge
                            source={model.detailedSource}
                            lastVerified={model.dataLastVerified}
                            confidence={model.dataConfidence}
                          />
                        )}
                      </div>
                      {model.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {model.description}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Provider */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <Badge variant="outline" className="text-xs">
                      {model.provider}
                    </Badge>
                  </td>

                  {/* Intelligence */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {model.intelligence ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${model.intelligence}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium min-w-[30px]">
                          {model.intelligence}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Speed */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {model.speed ? (
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-600" />
                        <span className="text-sm">{model.speed}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatPrice(model.priceInput, model.priceOutput)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatStatusBadge(model.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title={`View ${model.name} details`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Show More / Pagination */}
      {enableShowMore ? (
        // Show More Controls
        <div className="flex items-center justify-center py-4 gap-4">
          <div className="text-sm text-gray-600">
            Showing {displayedModels.length} of {sortedModels.length} models
          </div>

          {hasMore && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowMore}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <ChevronDown className="w-4 h-4" />
                Show More ({Math.min(INCREMENT_COUNT, sortedModels.length - displayCount)})
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShowAll}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Show All
              </Button>
            </>
          )}

          {canShowLess && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowLess}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <EyeOff className="w-4 h-4" />
              Show Less
            </Button>
          )}
        </div>
      ) : (
        // Original Pagination
        totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )
      )}

      {/* Loading overlay */}
      {loading && models.length > 0 && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <span className="text-sm text-gray-600">Updating...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedModelTable