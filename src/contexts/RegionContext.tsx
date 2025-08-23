'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Region, getDefaultRegion, getRegionByCode } from '@/types/regions'

interface ModelMetrics {
  availability: number
  responseTime: number
  errorRate: number
  throughput: number
  lastUpdated: Date
}

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
export function useModelMetrics(modelId: string) {
  const { regionMetrics, selectedRegion } = useRegion()
  return regionMetrics.get(modelId)
}

// Hook for region-aware API calls
export function useRegionApi() {
  const { selectedRegion, setRegionMetrics } = useRegion()
  
  const fetchModelMetrics = async (modelId: string) => {
    try {
      const response = await fetch(`/api/v1/status/${modelId}?region=${selectedRegion.code}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      const metrics: ModelMetrics = {
        availability: data.availability,
        responseTime: data.latencyP50,
        errorRate: data.errorRate,
        throughput: data.requestsPerMin,
        lastUpdated: new Date()
      }
      
      setRegionMetrics(modelId, metrics)
      return metrics
    } catch (error) {
      console.error('Failed to fetch model metrics:', error)
      throw error
    }
  }

  return {
    selectedRegion,
    fetchModelMetrics
  }
}