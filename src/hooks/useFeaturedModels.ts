'use client'

import { useState, useEffect, useCallback } from 'react'
import { getProviderLogo } from '@/constants/providerLogos'

// Types - Strict type definitions
export const MODEL_STATUS = {
  OPERATIONAL: 'operational',
  DEGRADED: 'degraded',
  DOWN: 'down'
} as const

export type ModelStatus = typeof MODEL_STATUS[keyof typeof MODEL_STATUS]

export const DATA_SOURCE = {
  FEATURED: 'featured',
  LIVE: 'live',
  CACHE: 'cache',
  FALLBACK: 'fallback'
} as const

export type DataSource = typeof DATA_SOURCE[keyof typeof DATA_SOURCE]

export interface Model {
  id: string
  rank: number
  name: string
  provider: string
  providerLogo: string
  status: ModelStatus // Now strictly typed
  availability: number
  responseTime: number
  errorRate: number
  throughput: number
  description: string
  capabilities: string[]
  intelligenceIndex: number
  isFeatured?: boolean
  featuredOrder?: number
  featuredBy?: string
  featuredAt?: string
}

export interface DataFreshness {
  timestamp: string
  age: number
  isStale: boolean
  display: string
}

export interface UseFeaturedModelsReturn {
  models: Model[]
  isLoading: boolean
  error: Error | null
  dataSource: DataSource
  freshness: DataFreshness
  refetch: () => Promise<void>
}

// Cache configuration
const CACHE_KEY = 'dashboard_models_cache_v1'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const STALE_THRESHOLD = 30 * 60 * 1000 // 30 minutes

// Hardcoded fallback models
const fallbackModels: Model[] = [
  {
    id: 'gpt-5-high',
    rank: 1,
    name: 'GPT-5 (High)',
    provider: 'OpenAI',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    status: MODEL_STATUS.OPERATIONAL,
    availability: 99.95,
    responseTime: 200,
    errorRate: 0.02,
    throughput: 1100,
    description: 'Most advanced GPT-5 variant with maximum intelligence',
    capabilities: ['Text Generation', 'Vision', 'Advanced Reasoning', 'Code', 'Real-time Thinking'],
    intelligenceIndex: 68.95
  },
  {
    id: 'gpt-5-medium',
    rank: 2,
    name: 'GPT-5 (Medium)',
    provider: 'OpenAI',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    status: MODEL_STATUS.OPERATIONAL,
    availability: 99.9,
    responseTime: 180,
    errorRate: 0.03,
    throughput: 1200,
    description: 'Balanced GPT-5 with excellent performance',
    capabilities: ['Text Generation', 'Vision', 'Advanced Reasoning', 'Code'],
    intelligenceIndex: 67.53
  },
  {
    id: 'o3',
    rank: 3,
    name: 'o3',
    provider: 'OpenAI',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    status: MODEL_STATUS.OPERATIONAL,
    availability: 99.8,
    responseTime: 220,
    errorRate: 0.04,
    throughput: 950,
    description: 'Advanced reasoning model with chain-of-thought',
    capabilities: ['Text Generation', 'Complex Reasoning', 'Mathematics', 'Code'],
    intelligenceIndex: 67.07
  },
  {
    id: 'claude-3-opus',
    rank: 4,
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
    status: MODEL_STATUS.OPERATIONAL,
    availability: 99.8,
    responseTime: 320,
    errorRate: 0.03,
    throughput: 720,
    description: 'Most powerful Claude model for complex tasks',
    capabilities: ['Text Generation', 'Vision', 'Long Context', 'Code', 'Constitutional AI'],
    intelligenceIndex: 66.8
  },
  {
    id: 'claude-3-7-sonnet',
    rank: 5,
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
    status: MODEL_STATUS.OPERATIONAL,
    availability: 99.7,
    responseTime: 200,
    errorRate: 0.04,
    throughput: 900,
    description: 'Latest hybrid reasoning model with advanced capabilities',
    capabilities: ['Text Generation', 'Hybrid Reasoning', 'Vision', 'Code'],
    intelligenceIndex: 66.5
  },
  {
    id: 'gemini-2-5-pro',
    rank: 6,
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    status: MODEL_STATUS.OPERATIONAL,
    availability: 99.5,
    responseTime: 280,
    errorRate: 0.06,
    throughput: 750,
    description: 'Google\'s most advanced multimodal model',
    capabilities: ['Text Generation', 'Vision', 'Audio', 'Video', '2M Token Context'],
    intelligenceIndex: 65.2
  },
  {
    id: 'gemini-2-0-flash',
    rank: 7,
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    status: MODEL_STATUS.OPERATIONAL,
    availability: 99.6,
    responseTime: 150,
    errorRate: 0.05,
    throughput: 1000,
    description: 'Fast and efficient model for real-time applications',
    capabilities: ['Text Generation', 'Vision', 'Fast Response', 'Multimodal'],
    intelligenceIndex: 63.4
  },
  {
    id: 'llama-3-1-405b',
    rank: 8,
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
    status: MODEL_STATUS.OPERATIONAL,
    availability: 98.9,
    responseTime: 300,
    errorRate: 0.08,
    throughput: 600,
    description: 'Most powerful open-source model available',
    capabilities: ['Text Generation', 'Code', 'Multilingual', 'Open Source', '128K Context'],
    intelligenceIndex: 62.8
  },
  {
    id: 'mistral-large',
    rank: 9,
    name: 'Mistral Large',
    provider: 'Mistral AI',
    providerLogo: 'https://mistral.ai/images/logo.png',
    status: MODEL_STATUS.OPERATIONAL,
    availability: 99.2,
    responseTime: 220,
    errorRate: 0.07,
    throughput: 780,
    description: 'Europe\'s leading AI model with strong multilingual support',
    capabilities: ['Text Generation', 'Code', 'Function Calling', '32K Context', 'Multilingual'],
    intelligenceIndex: 61.5
  }
]

// Cache data interface
interface CacheData {
  models: Model[]
  timestamp: string
  dataSource: DataSource
  version: string
}

// Cache manager class with improved type safety
class ModelsCacheManager {
  private readonly CACHE_KEY = CACHE_KEY
  private readonly MAX_AGE = CACHE_TTL

  save(models: Model[], dataSource: DataSource = DATA_SOURCE.LIVE): void {
    try {
      const cacheData: CacheData = {
        models,
        timestamp: new Date().toISOString(),
        dataSource,
        version: '1.0.0'
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
      }
    } catch (error) {
      console.warn('Failed to save models to cache:', error)
    }
  }

  load(): CacheData | null {
    try {
      if (typeof window === 'undefined') return null

      const cached = localStorage.getItem(this.CACHE_KEY)
      if (!cached) return null

      const data: CacheData = JSON.parse(cached)
      const age = Date.now() - new Date(data.timestamp).getTime()

      if (age > this.MAX_AGE) {
        this.clear()
        return null
      }

      // Ensure dataSource is valid
      if (!Object.values(DATA_SOURCE).includes(data.dataSource)) {
        data.dataSource = DATA_SOURCE.CACHE
      }

      return data
    } catch (error) {
      console.warn('Failed to load models from cache:', error)
      return null
    }
  }

  isValid(timestamp: string): boolean {
    const age = Date.now() - new Date(timestamp).getTime()
    return age <= this.MAX_AGE
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.CACHE_KEY)
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }
}

// Utility functions
function calculateFreshness(timestamp: string | null): DataFreshness {
  if (!timestamp) {
    return {
      timestamp: new Date().toISOString(),
      age: 0,
      isStale: false,
      display: 'Just now'
    }
  }

  const age = Date.now() - new Date(timestamp).getTime()
  const isStale = age > STALE_THRESHOLD

  let display = 'Just now'
  if (age < 60000) {
    display = 'Just now'
  } else if (age < 3600000) {
    const minutes = Math.floor(age / 60000)
    display = `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (age < 86400000) {
    const hours = Math.floor(age / 3600000)
    display = `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(age / 86400000)
    display = `${days} day${days > 1 ? 's' : ''} ago`
  }

  return {
    timestamp: timestamp || new Date().toISOString(),
    age,
    isStale,
    display
  }
}

// Main hook
export function useFeaturedModels(): UseFeaturedModelsReturn {
  const [models, setModels] = useState<Model[]>(fallbackModels)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [dataSource, setDataSource] = useState<DataSource>(DATA_SOURCE.FALLBACK)
  const [freshness, setFreshness] = useState<DataFreshness>(calculateFreshness(null))

  const cacheManager = new ModelsCacheManager()

  const fetchModels = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Try to fetch from API (includes featured models from DB)
      const response = await fetch('/api/v1/intelligence-index?limit=9')

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.models && data.models.length > 0) {
        const mappedModels: Model[] = data.models.map((model: any) => ({
          id: model.id || model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          rank: model.rank,
          name: model.name,
          provider: model.provider,
          providerLogo: getProviderLogo(model.provider) || model.providerLogo,
          status: MODEL_STATUS.OPERATIONAL,
          availability: 99.5,
          responseTime: 250,
          errorRate: 0.03,
          throughput: 800,
          description: `${model.provider}'s advanced AI model with Intelligence Index of ${model.intelligenceIndex}`,
          capabilities: ['Text Generation', 'Advanced Reasoning'],
          intelligenceIndex: model.intelligenceIndex,
          isFeatured: model.isFeatured,
          featuredOrder: model.featuredOrder,
          featuredBy: model.featuredBy,
          featuredAt: model.featuredAt
        }))

        // Determine the actual data source
        const actualDataSource: DataSource = data.models.some((m: any) => m.isFeatured)
          ? DATA_SOURCE.FEATURED
          : data.cached
            ? DATA_SOURCE.CACHE
            : DATA_SOURCE.LIVE

        // Save to cache with correct data source
        cacheManager.save(mappedModels, actualDataSource)

        setModels(mappedModels)
        setDataSource(actualDataSource)
        setFreshness(calculateFreshness(data.timestamp || new Date().toISOString()))
      }
    } catch (apiError) {
      console.warn('API fetch failed, trying cache:', apiError)

      // Step 2: Try to load from cache
      const cached = cacheManager.load()

      if (cached && cached.models.length > 0) {
        setModels(cached.models)
        setDataSource(DATA_SOURCE.CACHE)
        setFreshness(calculateFreshness(cached.timestamp))
      } else {
        // Step 3: Use fallback models
        console.warn('No cache available, using fallback models')
        setModels(fallbackModels)
        setDataSource(DATA_SOURCE.FALLBACK)
        setFreshness(calculateFreshness(new Date().toISOString()))
        setError(new Error('Using fallback data - API and cache unavailable'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  return {
    models,
    isLoading,
    error,
    dataSource,
    freshness,
    refetch: fetchModels
  }
}