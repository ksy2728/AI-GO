'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { UnifiedModel } from '@/types/unified-models'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  ExternalLink
} from 'lucide-react'

interface VirtualizedModelTableProps {
  models: UnifiedModel[]
  loading?: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onFilterChange?: (filters: any) => void
  filters?: any
  height?: number // Container height in pixels
  itemHeight?: number // Row height in pixels
}

type SortField = 'name' | 'provider' | 'intelligence' | 'speed' | 'priceInput' | 'status' | 'rankScore'
type SortDirection = 'asc' | 'desc' | null

interface VirtualizedRowProps {
  model: UnifiedModel
  index: number
  style: React.CSSProperties
  isVisible: boolean
}

const ITEM_HEIGHT = 76 // Height of each row in pixels
const OVERSCAN_COUNT = 5 // Number of items to render outside visible area
const HEADER_HEIGHT = 48 // Height of table header

export function VirtualizedModelTable({
  models,
  loading = false,
  currentPage,
  totalPages,
  onPageChange,
  onFilterChange,
  filters,
  height = 600,
  itemHeight = ITEM_HEIGHT
}: VirtualizedModelTableProps) {
  const [sortField, setSortField] = useState<SortField>('rankScore')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(height)

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField('rankScore')
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sort models
  const sortedModels = useMemo(() => {
    if (!sortDirection || !sortField) {
      return models
    }

    return [...models].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [models, sortField, sortDirection])

  // Calculate virtual scrolling parameters
  const totalHeight = sortedModels.length * itemHeight
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    sortedModels.length
  )

  // Add overscan for smoother scrolling
  const startIndex = Math.max(0, visibleStart - OVERSCAN_COUNT)
  const endIndex = Math.min(sortedModels.length, visibleEnd + OVERSCAN_COUNT)

  const visibleItems = sortedModels.slice(startIndex, endIndex)

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

  // Format price display
  const formatPrice = (input?: number, output?: number) => {
    if (input === undefined && output === undefined) {
      return <span className="text-gray-400">—</span>
    }

    return (
      <div className="text-xs space-y-1">
        {input !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">In:</span>
            <span>${(input / 1000).toFixed(3)}</span>
          </div>
        )}
        {output !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Out:</span>
            <span>${(output / 1000).toFixed(3)}</span>
          </div>
        )}
      </div>
    )
  }

  // Virtualized row component
  const VirtualizedRow: React.FC<VirtualizedRowProps> = ({ model, index, style, isVisible }) => (
    <div
      style={style}
      className={`flex items-center border-b border-gray-200 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      } hover:bg-blue-50 transition-colors duration-150`}
    >
      {/* Rank */}
      <div className="w-16 px-4 text-center text-sm font-medium">
        {model.aa?.rank || '—'}
      </div>

      {/* Model Name */}
      <div className="flex-1 min-w-0 px-4 py-3">
        <div className="font-medium text-gray-900 truncate">
          {model.name}
        </div>
        {model.description && (
          <div className="text-xs text-gray-500 truncate mt-1">
            {model.description}
          </div>
        )}
      </div>

      {/* Provider */}
      <div className="w-24 px-4">
        <Badge variant="outline" className="text-xs">
          {model.provider}
        </Badge>
      </div>

      {/* Intelligence */}
      <div className="w-32 px-4">
        {model.intelligence ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
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
      </div>

      {/* Speed */}
      <div className="w-20 px-4">
        {model.speed ? (
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-600" />
            <span className="text-sm">{model.speed}</span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </div>

      {/* Price */}
      <div className="w-24 px-4">
        {formatPrice(model.priceInput, model.priceOutput)}
      </div>

      {/* Status */}
      <div className="w-28 px-4">
        {formatStatusBadge(model.status)}
      </div>

      {/* Actions */}
      <div className="w-16 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 touch-manipulation"
          title={`View ${model.name} details`}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

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
      {/* Virtual Table Container */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 sticky top-0 z-10" style={{ height: HEADER_HEIGHT }}>
          <div className="flex items-center h-12 border-b border-gray-200">
            {/* Header cells matching the data columns */}
            <div className="w-16 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 touch-manipulation"
                onClick={() => handleSort('rankScore')}
              >
                #
                {renderSortIcon('rankScore')}
              </Button>
            </div>

            <div className="flex-1 min-w-0 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 font-medium touch-manipulation"
                onClick={() => handleSort('name')}
              >
                Model Name
                {renderSortIcon('name')}
              </Button>
            </div>

            <div className="w-24 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 font-medium touch-manipulation"
                onClick={() => handleSort('provider')}
              >
                Provider
                {renderSortIcon('provider')}
              </Button>
            </div>

            <div className="w-32 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 font-medium touch-manipulation"
                onClick={() => handleSort('intelligence')}
              >
                <Brain className="w-4 h-4 mr-1" />
                Intelligence
                {renderSortIcon('intelligence')}
              </Button>
            </div>

            <div className="w-20 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 font-medium touch-manipulation"
                onClick={() => handleSort('speed')}
              >
                <Zap className="w-4 h-4 mr-1" />
                Speed
                {renderSortIcon('speed')}
              </Button>
            </div>

            <div className="w-24 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 font-medium touch-manipulation"
                onClick={() => handleSort('priceInput')}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Price
                {renderSortIcon('priceInput')}
              </Button>
            </div>

            <div className="w-28 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 font-medium touch-manipulation"
                onClick={() => handleSort('status')}
              >
                Status
                {renderSortIcon('status')}
              </Button>
            </div>

            <div className="w-16 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </div>
          </div>
        </div>

        {/* Virtual Scroll Container */}
        <div
          ref={containerRef}
          className="relative overflow-auto touch-manipulation"
          style={{
            height: containerHeight - HEADER_HEIGHT,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
          onScroll={handleScroll}
        >
          {/* Virtual content container */}
          <div style={{ height: totalHeight, position: 'relative' }}>
            {/* Render visible items */}
            {visibleItems.map((model, i) => {
              const itemIndex = startIndex + i
              const isVisible = itemIndex >= visibleStart && itemIndex < visibleEnd

              return (
                <VirtualizedRow
                  key={model.id}
                  model={model}
                  index={itemIndex}
                  isVisible={isVisible}
                  style={{
                    position: 'absolute',
                    top: itemIndex * itemHeight,
                    left: 0,
                    right: 0,
                    height: itemHeight
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} • Showing {models.length} models
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="flex items-center gap-1 touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Page numbers for mobile */}
            <div className="flex items-center gap-1 sm:hidden">
              <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                {currentPage}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="flex items-center gap-1 touch-manipulation"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Performance indicator */}
      <div className="text-xs text-gray-500 text-center">
        Virtual scrolling: Rendering {visibleItems.length} of {sortedModels.length} items
      </div>

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
export default VirtualizedModelTable
