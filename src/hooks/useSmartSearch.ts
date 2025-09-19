import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SmartSearchResult, SearchFilters, SearchSort, SearchPreset } from '@/services/smart-search.service'

interface SmartSearchParams {
  query: string
  filters?: SearchFilters
  sort?: SearchSort
  page?: number
  limit?: number
}

interface UseSmartSearchOptions {
  defaultLimit?: number
  enableAutoSearch?: boolean
}

export function useSmartSearch(options: UseSmartSearchOptions = {}) {
  const { defaultLimit = 20, enableAutoSearch = false } = options
  const queryClient = useQueryClient()

  // Search state
  const [searchParams, setSearchParams] = useState<SmartSearchParams | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Search query
  const {
    data: searchResult,
    isLoading: isSearching,
    error: searchError,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ['smartSearch', searchParams],
    queryFn: async () => {
      if (!searchParams?.query) return null

      const params = new URLSearchParams({
        q: searchParams.query,
        page: (searchParams.page || 1).toString(),
        limit: (searchParams.limit || defaultLimit).toString()
      })

      // Add filters as query parameters
      if (searchParams.filters) {
        const { filters } = searchParams

        if (filters.providers?.length) {
          params.set('providers', filters.providers.join(','))
        }

        if (filters.modalities?.length) {
          params.set('modalities', filters.modalities.join(','))
        }

        if (filters.capabilities?.length) {
          params.set('capabilities', filters.capabilities.join(','))
        }

        if (filters.status?.length) {
          params.set('status', filters.status.join(','))
        }

        if (filters.priceRange) {
          if (filters.priceRange.min !== undefined) {
            params.set('minPrice', filters.priceRange.min.toString())
          }
          if (filters.priceRange.max !== undefined) {
            params.set('maxPrice', filters.priceRange.max.toString())
          }
          if (filters.priceRange.type) {
            params.set('priceType', filters.priceRange.type)
          }
        }

        if (filters.performanceRange?.intelligence) {
          if (filters.performanceRange.intelligence.min !== undefined) {
            params.set('minIntelligence', filters.performanceRange.intelligence.min.toString())
          }
          if (filters.performanceRange.intelligence.max !== undefined) {
            params.set('maxIntelligence', filters.performanceRange.intelligence.max.toString())
          }
        }

        if (filters.performanceRange?.speed) {
          if (filters.performanceRange.speed.min !== undefined) {
            params.set('minSpeed', filters.performanceRange.speed.min.toString())
          }
          if (filters.performanceRange.speed.max !== undefined) {
            params.set('maxSpeed', filters.performanceRange.speed.max.toString())
          }
        }

        if (filters.contextWindow) {
          if (filters.contextWindow.min !== undefined) {
            params.set('minContextWindow', filters.contextWindow.min.toString())
          }
          if (filters.contextWindow.max !== undefined) {
            params.set('maxContextWindow', filters.contextWindow.max.toString())
          }
        }

        if (filters.releasedAfter) {
          params.set('releasedAfter', filters.releasedAfter)
        }

        if (filters.isActive !== undefined) {
          params.set('isActive', filters.isActive.toString())
        }
      }

      const response = await fetch(`/api/v1/models/smart-search?${params}`)

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Search failed')
      }

      return {
        ...result.data,
        pagination: result.pagination
      }
    },
    enabled: !!searchParams?.query || enableAutoSearch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })

  // Presets query
  const { data: presets = [] } = useQuery({
    queryKey: ['searchPresets'],
    queryFn: async () => {
      const response = await fetch('/api/v1/models/search-presets')

      if (!response.ok) {
        throw new Error(`Failed to fetch presets: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch presets')
      }

      return result.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async (presetData: {
      name: string
      description?: string
      filters: SearchFilters
      sort?: SearchSort
      isPublic?: boolean
    }) => {
      const response = await fetch('/api/v1/models/search-presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(presetData)
      })

      if (!response.ok) {
        throw new Error(`Failed to save preset: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save preset')
      }

      return result.data
    },
    onSuccess: () => {
      // Refresh presets list
      queryClient.invalidateQueries({ queryKey: ['searchPresets'] })
    }
  })

  // Search function
  const search = useCallback((
    query: string,
    filters?: SearchFilters,
    sort?: SearchSort,
    page = 1
  ) => {
    setSearchParams({
      query: query.trim(),
      filters,
      sort,
      page,
      limit: defaultLimit
    })
    setCurrentPage(page)
  }, [defaultLimit])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchParams(null)
    setCurrentPage(1)
    queryClient.removeQueries({ queryKey: ['smartSearch'] })
  }, [queryClient])

  // Page navigation
  const goToPage = useCallback((page: number) => {
    if (searchParams) {
      setSearchParams(prev => prev ? { ...prev, page } : null)
      setCurrentPage(page)
    }
  }, [searchParams])

  // Save current search as preset
  const saveAsPreset = useCallback((name: string, description?: string, isPublic = false) => {
    if (searchParams?.query && searchParams.filters) {
      return savePresetMutation.mutateAsync({
        name,
        description,
        filters: searchParams.filters,
        sort: searchParams.sort,
        isPublic
      })
    }
    throw new Error('No active search to save')
  }, [searchParams, savePresetMutation])

  // Computed values
  const totalPages = useMemo(() => {
    if (!searchResult?.pagination) return 0
    return searchResult.pagination.totalPages
  }, [searchResult])

  const hasResults = useMemo(() => {
    return searchResult?.models && searchResult.models.length > 0
  }, [searchResult])

  const searchSummary = useMemo(() => {
    if (!searchResult) return null

    return {
      query: searchParams?.query || '',
      totalResults: searchResult.totalCount || 0,
      currentPage,
      totalPages,
      executionTime: searchResult.executionTime || 0,
      confidence: searchResult.intent?.confidence || 0
    }
  }, [searchResult, searchParams, currentPage, totalPages])

  return {
    // Data
    models: searchResult?.models || [],
    suggestions: searchResult?.suggestions || [],
    presets,
    searchSummary,

    // State
    isSearching,
    searchError,
    hasResults,
    currentPage,
    totalPages,

    // Actions
    search,
    clearSearch,
    goToPage,
    saveAsPreset,
    refetchSearch,

    // Mutations
    isSavingPreset: savePresetMutation.isPending,
    savePresetError: savePresetMutation.error
  }
}