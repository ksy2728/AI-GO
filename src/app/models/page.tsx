'use client'

import { useMemo, useEffect, useState } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { logger } from '@/lib/logger'
import { MODEL_LIMITS } from '@/constants/models'
import { ModelTable } from '@/components/models/ModelTable'
import { TableErrorBoundary } from '@/components/models/TableErrorBoundary'
import { ErrorFallback } from '@/components/models/ErrorFallback'
import { FilterSettings } from '@/components/models/FilterSettings'
import { ModelHighlightsSection } from '@/components/models/ModelHighlightsSection'
import { transformModelsToTableModels } from '@/lib/models-table-mapper'
import { useModels } from '@/contexts/ModelsContext'
import { AAModelsTable } from '@/components/AAModelsTable'
import {
  Search,
  Server,
  RefreshCw,
  Filter,
  Brain
} from 'lucide-react'

export default function ModelsPage() {
  const networkStatus = useNetworkStatus()
  const [showAAModels, setShowAAModels] = useState(true) // Default to showing AA models
  const {
    filteredModels,
    loading,
    error,
    dataSource,
    filters,
    setFilters,
    refreshModels,
    getTotalCount,
    getFilteredCount
  } = useModels()

  const totalCount = getTotalCount()
  const filteredCount = getFilteredCount()

  // Transform filtered models for table display
  const tableModels = useMemo(
    () => transformModelsToTableModels(filteredModels),
    [filteredModels]
  )

  // Auto-refresh on mount and network status changes
  useEffect(() => {
    if (networkStatus?.isOnline) {
      refreshModels()
    }
  }, [networkStatus?.isOnline, refreshModels])

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header Skeleton */}
        <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-9 w-32 mb-2" />
                <Skeleton className="h-5 w-64" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters Skeleton */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
          
          {/* Table Skeleton */}
          <div className="bg-white/80 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center space-x-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <div className="flex-1" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Loading indicator */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 animate-pulse">
              Loading model information...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Models</h1>
              <p className="text-gray-600 mt-2">
                Browse and compare AI models from leading providers
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Data Source Indicator */}
              <Badge variant="outline" className="text-xs">
                <Server className="w-3 h-3 mr-1" />
                {dataSource}
              </Badge>
              
              {/* Model Count */}
              <Badge variant="secondary" className="text-sm">
                {filteredCount} of {totalCount} models
              </Badge>
              
              {filters.showMajorOnly && (
                <Badge variant="outline" className="text-xs text-blue-600">
                  Major Providers
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Model Highlights Charts */}
        <ModelHighlightsSection className="mb-8" />
        
        {/* Filters Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search models..."
                value={filters.searchQuery || ''}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="pl-10 bg-white/80 backdrop-blur-sm"
              />
            </div>
            
            {/* Filter Actions */}
            <div className="flex gap-2">
              {/* AA Models Toggle */}
              <Button
                variant={showAAModels ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAAModels(!showAAModels)}
                className="flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                AA Rankings
              </Button>
              
              {/* Filter Settings Dropdown */}
              <div className="relative">
                <FilterSettings />
              </div>
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshModels}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(filters.provider || filters.modality) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.provider && (
                <Badge variant="secondary" className="text-sm">
                  Provider: {filters.provider}
                  <button
                    onClick={() => setFilters({ ...filters, provider: undefined })}
                    className="ml-2 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.modality && (
                <Badge variant="secondary" className="text-sm">
                  Modality: {filters.modality}
                  <button
                    onClick={() => setFilters({ ...filters, modality: undefined })}
                    className="ml-2 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Error state display */}
        {error && !loading && (
          <div className="mb-6">
            <ErrorFallback
              error={error}
              onRetry={refreshModels}
              retryCount={0}
              maxRetries={3}
            />
          </div>
        )}

        {/* Filter Summary */}
        {!error && filteredCount < totalCount && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  {filters.showMajorOnly ? '🏆 Major Provider Models' : '📊 Filtered Results'}
                </h3>
                <p className="text-blue-700 text-sm">
                  Showing {filteredCount} of {totalCount} total models.
                  {filters.showMajorOnly && ' Only displaying models from major providers.'}
                  {!filters.includeUnknown && ' Models with unknown status are hidden.'}
                </p>
              </div>
              {filters.showMajorOnly && (
                <Button
                  onClick={() => setFilters({ ...filters, showMajorOnly: false })}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-blue-50 border-blue-300"
                >
                  Show All Providers
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Toggle between AA Rankings and Regular Models */}
        {showAAModels ? (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-bold text-purple-900">
                    Artificial Analysis Intelligence Rankings
                  </h2>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  Independent benchmark data from artificialanalysis.ai
                </p>
              </CardHeader>
              <CardContent>
                <AAModelsTable />
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Regular Models Table */
          !error && (
            <TableErrorBoundary 
              onSwitchToCards={() => console.log('Table view only')}
              onError={() => console.error('Table rendering error occurred')}
            >
              <ModelTable 
                models={tableModels}
                className="w-full"
              />
            </TableErrorBoundary>
          )
        )}

        {/* No Results */}
        {!error && !loading && filteredCount === 0 && (
          <Card className="p-8 text-center bg-white/80">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No models found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search query
            </p>
            <Button
              onClick={() => setFilters({ 
                showMajorOnly: true, 
                includeUnknown: false,
                searchQuery: '',
                provider: undefined,
                modality: undefined
              })}
              variant="outline"
            >
              Reset Filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}