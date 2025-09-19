import { useState, useEffect, useCallback } from 'react'
import { UnifiedModel, UnifiedModelFilters } from '@/types/unified-models'

interface UseUnifiedModelsOptions {
  page?: number
  limit?: number
  filters?: UnifiedModelFilters
  enabled?: boolean
}

interface UseUnifiedModelsReturn {
  models: UnifiedModel[]
  loading: boolean
  error: string | null
  total: number
  totalPages: number
  currentPage: number
  dataSource: string
  cached?: boolean
  duration?: number
  fallbackReason?: string
  refreshModels: () => void
}

export function useUnifiedModels(options: UseUnifiedModelsOptions = {}): UseUnifiedModelsReturn {
  const { page = 1, limit = 50, filters = {}, enabled = true } = options

  const [state, setState] = useState<{
    models: UnifiedModel[]
    loading: boolean
    error: string | null
    total: number
    totalPages: number
    dataSource: string
    cached?: boolean
    duration?: number
    fallbackReason?: string
  }>({
    models: [],
    loading: true,
    error: null,
    total: 0,
    totalPages: 0,
    dataSource: 'loading'
  })

  const fetchModels = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Build query parameters
      const params = new URLSearchParams()

      // Pagination
      params.set('limit', limit.toString())
      params.set('offset', ((page - 1) * limit).toString())

      // Filters
      if (filters.query) params.set('q', filters.query)
      if (filters.provider) params.set('provider', filters.provider)
      if (filters.status) params.set('status', filters.status)
      if (filters.aaOnly) params.set('aaOnly', 'true')
      if (filters.dbOnly) params.set('dbOnly', 'true')

      // Range filters
      if (filters.minIntelligence !== undefined) {
        params.set('minIntelligence', filters.minIntelligence.toString())
      }
      if (filters.maxIntelligence !== undefined) {
        params.set('maxIntelligence', filters.maxIntelligence.toString())
      }
      if (filters.minSpeed !== undefined) {
        params.set('minSpeed', filters.minSpeed.toString())
      }
      if (filters.maxSpeed !== undefined) {
        params.set('maxSpeed', filters.maxSpeed.toString())
      }

      console.log('🔄 Fetching unified models with params:', params.toString())
      const startTime = Date.now()

      const response = await fetch(`/api/v1/models?${params.toString()}`)
      const duration = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      console.log('✅ Unified models fetched:', {
        total: data.total,
        fetched: data.models.length,
        dataSource: data.dataSource,
        duration: `${duration}ms`
      })

      setState({
        models: data.models || [],
        loading: false,
        error: null,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        dataSource: data.dataSource || 'unknown',
        cached: data.cached,
        duration: data.duration || duration,
        fallbackReason: data.fallbackReason
      })

    } catch (error) {
      console.error('❌ Failed to fetch unified models:', error)

      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        dataSource: 'error'
      }))
    }
  }, [page, limit, JSON.stringify(filters)])

  // Fetch models on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      fetchModels()
    }
  }, [fetchModels, enabled])

  return {
    ...state,
    currentPage: page,
    refreshModels: fetchModels
  }
}