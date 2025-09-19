'use client'

import { useMemo, useState, useCallback } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { logger } from '@/lib/logger'
import { ModelHighlightsSection } from '@/components/models/ModelHighlightsSection'
import { SmartSearchInput } from '@/components/models/SmartSearchInput'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { MobileModelCard, CompactMobileModelCard } from '@/components/mobile/MobileModelCard'
import { ExpandableCard } from '@/components/mobile/ExpandableCard'
import { ProgressiveDisclosure } from '@/components/mobile/ProgressiveDisclosure'
import { SwipeNavigationWrapper } from '@/components/navigation/SwipeNavigationWrapper'
import { useUnifiedModels } from '@/hooks/useUnifiedModels'
import { useSmartSearch } from '@/hooks/useSmartSearch'
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure'
import { SearchFilters, SearchSort } from '@/services/smart-search.service'
import {
  Search,
  Server,
  RefreshCw,
  Filter,
  Brain,
  Zap,
  Sparkles,
  Grid3x3,
  List,
  Eye,
  EyeOff
} from 'lucide-react'

interface MobileModelsPageProps {
  initialModels?: any[]
  serverSideProps?: any
}

export default function MobileModelsPage({
  initialModels,
  serverSideProps
}: MobileModelsPageProps) {
  const networkStatus = useNetworkStatus()
  const [useSmartSearchMode, setUseSmartSearchMode] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'compact' | 'list'>('cards')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    query: '',
    provider: '',
    status: '',
    minIntelligence: undefined,
    maxIntelligence: undefined,
    minSpeed: undefined,
    maxSpeed: undefined
  })

  // Regular unified models hook
  const {
    models: unifiedModels,
    loading: unifiedLoading,
    error: unifiedError,
    total: unifiedTotal,
    totalPages: unifiedTotalPages,
    dataSource,
    cached,
    duration,
    refreshModels
  } = useUnifiedModels({
    page: currentPage,
    filters,
    limit: 20, // Smaller limit for mobile
    enabled: !useSmartSearchMode
  })

  // Smart search hook
  const {
    models: smartModels,
    suggestions,
    presets,
    searchSummary,
    isSearching,
    searchError,
    hasResults: hasSmartResults,
    currentPage: smartCurrentPage,
    totalPages: smartTotalPages,
    search: performSmartSearch,
    clearSearch,
    goToPage: goToSmartPage
  } = useSmartSearch({ defaultLimit: 20 })

  // Progressive disclosure for model cards
  const {
    expandedItems,
    toggleExpanded,
    collapseAll,
    smartExpand,
    isExpanded
  } = useProgressiveDisclosure({
    initiallyExpanded: [],
    maxExpandedItems: 2,
    autoCollapse: true
  })

  // Determine which data source to use
  const models = useSmartSearchMode ? smartModels : unifiedModels
  const loading = useSmartSearchMode ? isSearching : unifiedLoading
  const error = useSmartSearchMode ? searchError : unifiedError
  const total = useSmartSearchMode ? (searchSummary?.totalResults || 0) : unifiedTotal
  const totalPages = useSmartSearchMode ? smartTotalPages : unifiedTotalPages
  const activePage = useSmartSearchMode ? smartCurrentPage : currentPage

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshModels()
  }, [refreshModels])

  // Handle smart search
  const handleSmartSearch = useCallback((query: string, searchFilters?: SearchFilters, sort?: SearchSort) => {
    setUseSmartSearchMode(true)
    performSmartSearch(query, searchFilters, sort)
  }, [performSmartSearch])

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setUseSmartSearchMode(false)
    clearSearch()
    setCurrentPage(1)
  }, [clearSearch])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }, [])

  // Handle search input
  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query }))
    setCurrentPage(1)
  }, [])

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    if (useSmartSearchMode) {
      goToSmartPage(page)
    } else {
      setCurrentPage(page)
    }
  }, [useSmartSearchMode, goToSmartPage])

  // Handle model detail view
  const handleViewDetails = useCallback((model: any) => {
    // This would typically navigate to a detailed view
    // or open a modal with full model information
    console.log('View details for:', model.name)
  }, [])

  // Memoized model list based on view mode
  const modelList = useMemo(() => {
    return models.map((model: any, index: number) => {
      const key = `${model.id}-${index}`

      switch (viewMode) {
        case 'compact':
          return (
            <CompactMobileModelCard
              key={key}
              model={model}
              index={index}
              onViewDetails={handleViewDetails}
            />
          )

        case 'cards':
          return (
            <MobileModelCard
              key={key}
              model={model}
              index={index}
              isExpanded={isExpanded(key)}
              onExpansionChange={(expanded) => toggleExpanded(key)}
              onViewDetails={handleViewDetails}
            />
          )

        default:
          return (
            <div key={key} className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{model.name}</h3>
                  <p className="text-xs text-gray-500">{model.provider}</p>
                </div>
                <div className="flex items-center gap-2">
                  {model.intelligence && (
                    <Badge variant="outline" className="text-xs">
                      {model.intelligence}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(model)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          )
      }
    })
  }, [models, viewMode, isExpanded, toggleExpanded, handleViewDetails])

  // Loading state
  if (loading && models.length === 0) {
    return (
      <SwipeNavigationWrapper>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
          <div className="px-4 py-6 space-y-6">
            {/* Header Skeleton */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>

            {/* Search Skeleton */}
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>

            {/* Cards Skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SwipeNavigationWrapper>
    )
  }

  return (
    <SwipeNavigationWrapper>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI Models</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {models.length} of {total} models
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Server className="w-3 h-3 mr-1" />
                    {dataSource}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 space-y-6">
            {/* Model Highlights */}
            <ExpandableCard
              title="Model Insights"
              subtitle="Performance highlights and trends"
              priority="high"
              defaultExpanded={false}
            >
              <ModelHighlightsSection />
            </ExpandableCard>

            {/* Search Interface */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Search Models</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={useSmartSearchMode ? "outline" : "default"}
                      size="sm"
                      onClick={() => setUseSmartSearchMode(false)}
                    >
                      <Search className="w-4 h-4 mr-1" />
                      Basic
                    </Button>
                    <Button
                      variant={useSmartSearchMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseSmartSearchMode(true)}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Smart
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {useSmartSearchMode ? (
                  <SmartSearchInput
                    onSearch={handleSmartSearch}
                    onClear={handleClearSearch}
                    loading={isSearching}
                    suggestions={suggestions}
                    presets={presets}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search models..."
                        value={filters.query || ''}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Advanced Filters */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="w-full"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                    </Button>

                    {showAdvancedFilters && (
                      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Provider</label>
                          <Input
                            placeholder="Filter by provider"
                            value={filters.provider || ''}
                            onChange={(e) => handleFilterChange({ provider: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Status</label>
                          <select
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange({ status: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                          >
                            <option value="">All Status</option>
                            <option value="operational">Operational</option>
                            <option value="degraded">Degraded</option>
                            <option value="down">Down</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Search Summary */}
                {useSmartSearchMode && searchSummary && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        <strong>{searchSummary.totalResults}</strong> results in {searchSummary.executionTime}ms
                      </span>
                      {searchSummary.confidence > 0.5 && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(searchSummary.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="px-3"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('compact')}
                    className="px-3"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => smartExpand('mobile')}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Smart View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={collapseAll}
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Collapse
                </Button>
              </div>
            </div>

            {/* Error state */}
            {error && !loading && (
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-red-600 font-medium">Failed to load models</p>
                    <p className="text-sm text-red-500 mt-1">{typeof error === 'string' ? error : error.message}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      className="mt-3"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Models List */}
            <div className="space-y-4">
              {modelList}
            </div>

            {/* Load More / Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {activePage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(activePage - 1)}
                        disabled={activePage <= 1 || loading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(activePage + 1)}
                        disabled={activePage >= totalPages || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No results */}
            {models.length === 0 && !loading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <Button onClick={handleClearSearch} variant="outline">
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PullToRefresh>
    </SwipeNavigationWrapper>
  )
}