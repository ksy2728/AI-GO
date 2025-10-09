'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Region, getDefaultRegion, getRegionByCode } from '@/types/regions'
import type { ModelStatus } from '@/hooks/useFeaturedModels'

// RegionMetricStatus includes realtime outage state and unknown status in addition to ModelStatus
export type RegionMetricStatus = ModelStatus | 'outage' | 'unknown'

/**
 * Type guard to check if a string value is a valid RegionMetricStatus
 */
export function isRegionMetricStatus(value: unknown): value is RegionMetricStatus {
  if (typeof value !== 'string') return false

  const validStatuses: readonly string[] = ['operational', 'degraded', 'down', 'outage', 'unknown']
  return validStatuses.includes(value)
}

/**
 * Safely normalize RegionMetricStatus to ModelStatus
 * Maps 'outage' → 'down', 'unknown' → fallback, validates input
 */
export function normalizeRegionStatus(status: RegionMetricStatus | undefined, fallback: ModelStatus): ModelStatus {
  // Handle undefined or invalid status
  if (!status) {
    return fallback
  }

  // Map special RegionMetricStatus values to ModelStatus
  switch (status) {
    case 'unknown':
      return fallback
    case 'outage':
      return 'down'
    case 'operational':
    case 'degraded':
    case 'down':
      return status
    default:
      // This should never happen with proper typing, but provides runtime safety
      console.warn(`Unexpected status value: ${status}, falling back to ${fallback}`)
      return fallback
  }
}

interface ModelMetrics {
  status: RegionMetricStatus
  availability: number | null
  responseTime: number | null
  errorRate: number | null
  throughput: number | null
  lastUpdated: Date
  region: string
}

export type RegionModelMetrics = ModelMetrics

interface RegionContextType {
  selectedRegion: Region
  setSelectedRegion: (region: Region) => void
  isLoading: boolean
  regionMetrics: Map<string, ModelMetrics>
  setRegionMetrics: (modelId: string, metrics: ModelMetrics) => void
  preferences: {
    autoDetect: boolean
    showTimezone: boolean
  }
  setPreferences: (preferences: Partial<RegionContextType['preferences']>) => void
}

const RegionContext = createContext<RegionContextType | undefined>(undefined)

interface RegionProviderProps {
  children: ReactNode
  defaultRegion?: Region
}

export function RegionProvider({ children, defaultRegion }: RegionProviderProps) {
  const [selectedRegion, setSelectedRegionState] = useState<Region>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-go-selected-region')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const region = getRegionByCode(parsed.code)
          if (region) return region
        } catch (error) {
          console.warn('Failed to parse saved region:', error)
        }
      }
    }
    return defaultRegion || getDefaultRegion()
  })

  const [isLoading, setIsLoading] = useState(false)
  const [regionMetrics, setRegionMetricsState] = useState<Map<string, ModelMetrics>>(new Map())
  const [preferences, setPreferencesState] = useState({
    autoDetect: true,
    showTimezone: false
  })

  // Save selected region to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-go-selected-region', JSON.stringify({
        code: selectedRegion.code,
        timestamp: Date.now()
      }))
    }
  }, [selectedRegion])

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPrefs = localStorage.getItem('ai-go-region-preferences')
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs)
          setPreferencesState(prev => ({ ...prev, ...parsed }))
        } catch (error) {
          console.warn('Failed to parse saved preferences:', error)
        }
      }
    }
  }, [])

  const setSelectedRegion = (region: Region) => {
    setIsLoading(true)
    setSelectedRegionState(region)
    
    // Clear metrics when region changes (will be refetched)
    setRegionMetricsState(new Map())
    
    // Simulate loading state
    setTimeout(() => setIsLoading(false), 500)
  }

  const setRegionMetrics = (modelId: string, metrics: ModelMetrics) => {
    setRegionMetricsState(prev => new Map(prev.set(modelId, metrics)))
  }

  const setPreferences = (newPreferences: Partial<RegionContextType['preferences']>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferencesState(updated)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-go-region-preferences', JSON.stringify(updated))
    }
  }

  const value: RegionContextType = {
    selectedRegion,
    setSelectedRegion,
    isLoading,
    regionMetrics,
    setRegionMetrics,
    preferences,
    setPreferences
  }

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  )
}

export function useRegion() {
  const context = useContext(RegionContext)
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider')
  }
  return context
}

// Hook for getting metrics for a specific model
export function useModelMetrics(modelId: string): RegionModelMetrics | undefined {
  const { regionMetrics } = useRegion()
  return regionMetrics.get(modelId)
}

// Hook for region-aware API calls
export function useRegionApi() {
  const { selectedRegion, setRegionMetrics } = useRegion()
  
  const fetchModelMetrics = async (modelId: string, regionCode?: string): Promise<RegionModelMetrics> => {
    const targetRegion = regionCode || selectedRegion.code

    try {
      const response = await fetch(`/api/v1/realtime-status/${modelId}?region=${encodeURIComponent(targetRegion)}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')

      const data = await response.json()

      const availability = typeof data.availability === 'number' ? data.availability : null
      const responseTime = typeof data.responseTime === 'number' ? data.responseTime : null
      const errorRate = typeof data.errorRate === 'number' ? data.errorRate : null
      const throughput = typeof data.throughput === 'number' ? data.throughput : null
      const lastUpdatedSource = data.timestamp || data.lastChecked

      // Use type guard to safely validate and convert status
      const statusValue = isRegionMetricStatus(data.status) ? data.status : 'unknown'

      const metrics: ModelMetrics = {
        status: statusValue,
        availability: availability !== null ? Number(availability) : null,
        responseTime: responseTime !== null ? Math.round(responseTime) : null,
        errorRate: errorRate !== null ? Number(errorRate) : null,
        throughput: throughput !== null ? Number(throughput) : null,
        lastUpdated: lastUpdatedSource ? new Date(lastUpdatedSource) : new Date(),
        region: data.region || targetRegion
      }

      setRegionMetrics(modelId, metrics)
      return metrics
    } catch (error) {
      console.error('Failed to fetch model metrics:', error)
      const fallbackMetrics: ModelMetrics = {
        status: 'unknown',
        availability: 99.5,
        responseTime: 250,
        errorRate: 0.02,
        throughput: 800,
        lastUpdated: new Date(),
        region: targetRegion
      }
      setRegionMetrics(modelId, fallbackMetrics)
      return fallbackMetrics
    }
  }

  return {
    selectedRegion,
    fetchModelMetrics
  }
}