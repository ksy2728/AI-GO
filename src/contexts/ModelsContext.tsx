'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { Model } from '@/types/models'
import { ModelsContextType, FilterOptions, GlobalStats } from '@/types/context'
import { api } from '@/lib/api-client'
import { applyUnifiedFilters, DEFAULT_FILTERS } from '@/lib/filter-utils'

const ModelsContext = createContext<ModelsContextType | undefined>(undefined)

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<Model[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'github' | 'database' | 'temp-data' | 'cache'>('database')
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS)

  // Fetch models from API
  const refreshModels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.getModels({
        provider: filters.provider,
        modality: filters.modality,
        limit: 200, // Get more models for better stats
      })
      
      setModels(response.models || [])
      setDataSource((response.dataSource || 'database') as 'github' | 'database' | 'temp-data' | 'cache')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models')
      console.error('Error fetching models:', err)
    } finally {
      setLoading(false)
    }
  }, [filters.provider, filters.modality])

  // Fetch global stats
  const refreshStats = useCallback(async () => {
    try {
      // Filter only AA models if they have AA metadata
      const aaModels = models.filter(m => {
        const metadata = m.metadata as any
        return metadata && metadata.aa
      })
      
      // Use AA models if available, otherwise use all models
      const modelsToUse = aaModels.length > 0 ? aaModels : models
      
      // Calculate comprehensive stats from loaded models
      const operationalModels = modelsToUse.filter(m => {
        const status = Array.isArray(m.status) ? m.status[0]?.status : m.status
        return status === 'operational'
      })
      
      const degradedModels = modelsToUse.filter(m => {
        const status = Array.isArray(m.status) ? m.status[0]?.status : m.status
        return status === 'degraded'
      })
      
      const outageModels = modelsToUse.filter(m => {
        const status = Array.isArray(m.status) ? m.status[0]?.status : m.status
        return status === 'outage'
      })
      
      // Calculate average availability based on actual model statuses
      const totalAvailability = modelsToUse.reduce((sum, model) => {
        const status = Array.isArray(model.status) ? model.status[0]?.status : model.status
        if (status === 'operational') return sum + 100
        if (status === 'degraded') return sum + 75
        if (status === 'outage') return sum + 0
        return sum + 95 // unknown status
      }, 0)
      
      const avgAvailability = modelsToUse.length > 0 ? totalAvailability / modelsToUse.length : 0
      
      const stats: GlobalStats = {
        totalModels: modelsToUse.length,
        activeModels: operationalModels.length,
        operationalModels: operationalModels.length,
        degradedModels: degradedModels.length,
        outageModels: outageModels.length,
        avgAvailability: Math.round(avgAvailability * 10) / 10,
        byProvider: {},
        byStatus: {
          operational: 0,
          degraded: 0,
          outage: 0,
          unknown: 0,
        },
        lastUpdated: new Date().toISOString(),
      }

      // Calculate by provider
      modelsToUse.forEach(model => {
        const provider = model.provider?.id || model.providerId || 'unknown'
        const status = Array.isArray(model.status) ? model.status[0]?.status : model.status
        
        if (!stats.byProvider[provider]) {
          stats.byProvider[provider] = {
            total: 0,
            operational: 0,
            degraded: 0,
            outage: 0,
          }
        }
        
        stats.byProvider[provider].total++
        
        if (status === 'operational') {
          stats.byProvider[provider].operational++
          stats.byStatus.operational++
        } else if (status === 'degraded') {
          stats.byProvider[provider].degraded++
          stats.byStatus.degraded++
        } else if (status === 'outage') {
          stats.byProvider[provider].outage++
          stats.byStatus.outage++
        } else {
          stats.byStatus.unknown++
        }
      })

      setGlobalStats(stats)
    } catch (err) {
      console.error('Error calculating stats:', err)
    }
  }, [models])

  // Filter models using unified filter utilities
  const filteredModels = useMemo(() => {
    return applyUnifiedFilters(models, filters)
  }, [models, filters])

  // Utility functions
  const getFilteredCount = useCallback(() => filteredModels.length, [filteredModels])
  const getTotalCount = useCallback(() => models.length, [models])
  const getProviders = useCallback(() => {
    const providers = new Set<string>()
    models.forEach(m => {
      const provider = m.provider?.name || m.providerId
      if (provider) providers.add(provider)
    })
    return Array.from(providers)
  }, [models])
  const getModalities = useCallback(() => {
    const modalities = new Set<string>()
    models.forEach(m => {
      m.modalities?.forEach(mod => modalities.add(mod))
    })
    return Array.from(modalities)
  }, [models])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // Load models on mount and when filters change
  useEffect(() => {
    refreshModels()
  }, [refreshModels])

  // Update stats when models change
  useEffect(() => {
    if (models.length > 0) {
      refreshStats()
    }
  }, [models, refreshStats])

  const value: ModelsContextType = {
    models,
    filteredModels,
    globalStats,
    loading,
    error,
    dataSource,
    filters,
    setFilters,
    resetFilters,
    refreshModels,
    refreshStats,
    getFilteredCount,
    getTotalCount,
    getProviders,
    getModalities,
  }

  return (
    <ModelsContext.Provider value={value}>
      {children}
    </ModelsContext.Provider>
  )
}

export function useModels() {
  const context = useContext(ModelsContext)
  if (context === undefined) {
    throw new Error('useModels must be used within a ModelsProvider')
  }
  return context
}

export function useGlobalStats() {
  const context = useContext(ModelsContext)
  if (context === undefined) {
    throw new Error('useGlobalStats must be used within a ModelsProvider')
  }
  return {
    globalStats: context.globalStats,
    refreshStats: context.refreshStats,
    loading: context.loading,
    error: context.error,
    totalModels: context.globalStats?.totalModels || 0,
    activeModels: context.globalStats?.activeModels || 0,
  }
}