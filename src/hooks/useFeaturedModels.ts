'use client'

import { useState, useEffect, useCallback } from 'react'
import { getProviderLogo } from '@/constants/providerLogos'

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
  providerLogo: string | null
  status: ModelStatus
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
  releasedAt?: string
  lastUpdated?: string
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

const CACHE_KEY = 'dashboard_models_cache_v2'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const STALE_THRESHOLD = 30 * 60 * 1000 // 30 minutes
const DEFAULT_LIMIT = 9

interface CacheData {
  models: Model[]
  timestamp: string
  dataSource: DataSource
  version: string
}

class ModelsCacheManager {
  private readonly CACHE_KEY = CACHE_KEY
  private readonly MAX_AGE = CACHE_TTL

  save(models: Model[], dataSource: DataSource = DATA_SOURCE.LIVE): void {
    try {
      const cacheData: CacheData = {
        models,
        timestamp: new Date().toISOString(),
        dataSource,
        version: '2.0.0'
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

      if (age > this.MAX_AGE || data.version !== '2.0.0') {
        this.clear()
        return null
      }

      if (!Object.values(DATA_SOURCE).includes(data.dataSource)) {
        data.dataSource = DATA_SOURCE.CACHE
      }

      return data
    } catch (error) {
      console.warn('Failed to load models from cache:', error)
      return null
    }
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

function calculateFreshness(timestamp: string | null): DataFreshness {
  if (!timestamp) {
    const now = new Date().toISOString()
    return {
      timestamp: now,
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
    timestamp,
    age,
    isStale,
    display
  }
}

function normalizeModel(rawModel: any, index: number, fallbackTimestamp?: string): Model {
  const id = typeof rawModel?.id === 'string' && rawModel.id.length > 0
    ? rawModel.id
    : `model-${index + 1}`

  const provider = typeof rawModel?.provider === 'string' && rawModel.provider.length > 0
    ? rawModel.provider
    : 'Unknown Provider'

  const providerLogo = typeof rawModel?.providerLogo === 'string'
    ? rawModel.providerLogo
    : getProviderLogo(provider)

  const statusFromApi = typeof rawModel?.status === 'string' ? rawModel.status.toLowerCase() : null
  const status: ModelStatus = Object.values(MODEL_STATUS).includes(statusFromApi as ModelStatus)
    ? (statusFromApi as ModelStatus)
    : MODEL_STATUS.OPERATIONAL

  const availability = typeof rawModel?.availability === 'number'
    ? Number(rawModel.availability)
    : 99.4

  const responseTime = typeof rawModel?.responseTime === 'number'
    ? Math.max(80, Math.round(rawModel.responseTime))
    : 250

  const errorRate = typeof rawModel?.errorRate === 'number'
    ? Math.max(0, Number(rawModel.errorRate))
    : 0.02

  const throughput = typeof rawModel?.throughput === 'number'
    ? Math.max(100, Math.round(rawModel.throughput))
    : 850

  const description = typeof rawModel?.description === 'string' && rawModel.description.length > 0
    ? rawModel.description
    : `${provider} 모델`

  const capabilities = Array.isArray(rawModel?.capabilities) && rawModel.capabilities.length > 0
    ? rawModel.capabilities.slice(0, 6)
    : ['Text Generation', 'Advanced Reasoning']

  const intelligenceIndex = typeof rawModel?.intelligenceIndex === 'number'
    ? Number(rawModel.intelligenceIndex)
    : 0

  const featuredAt = typeof rawModel?.featuredAt === 'string'
    ? rawModel.featuredAt
    : fallbackTimestamp

  return {
    id,
    rank: typeof rawModel?.rank === 'number' ? rawModel.rank : index + 1,
    name: typeof rawModel?.name === 'string' ? rawModel.name : `Model ${index + 1}`,
    provider,
    providerLogo: providerLogo || null,
    status,
    availability,
    responseTime,
    errorRate,
    throughput,
    description,
    capabilities,
    intelligenceIndex,
    isFeatured: rawModel?.isFeatured ?? true,
    featuredOrder: typeof rawModel?.featuredOrder === 'number' ? rawModel.featuredOrder : index + 1,
    featuredBy: typeof rawModel?.featuredBy === 'string' ? rawModel.featuredBy : undefined,
    featuredAt,
    releasedAt: typeof rawModel?.releasedAt === 'string' ? rawModel.releasedAt : undefined,
    lastUpdated: typeof rawModel?.lastUpdated === 'string' ? rawModel.lastUpdated : undefined
  }
}

export function useFeaturedModels(): UseFeaturedModelsReturn {
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [dataSource, setDataSource] = useState<DataSource>(DATA_SOURCE.LIVE)
  const [freshness, setFreshness] = useState<DataFreshness>(calculateFreshness(null))

  const cacheManager = new ModelsCacheManager()

  const fetchModels = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/intelligence-index?limit=${DEFAULT_LIMIT}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const timestamp = typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString()

      if (!Array.isArray(data.models) || data.models.length === 0) {
        throw new Error('API returned no models')
      }

      const normalizedModels: Model[] = data.models.map((model: any, index: number) =>
        normalizeModel(model, index, timestamp)
      )

      const source = data.cached ? DATA_SOURCE.CACHE : DATA_SOURCE.LIVE

      cacheManager.save(normalizedModels, source)

      setModels(normalizedModels)
      setDataSource(source)
      setFreshness(calculateFreshness(timestamp))
    } catch (apiError) {
      console.warn('API fetch failed, trying cache:', apiError)

      const cached = cacheManager.load()

      if (cached && cached.models.length > 0) {
        setModels(cached.models)
        setDataSource(cached.dataSource)
        setFreshness(calculateFreshness(cached.timestamp))
      } else {
        setModels([])
        setDataSource(DATA_SOURCE.FALLBACK)
        setFreshness(calculateFreshness(null))
        setError(new Error('모델 데이터를 불러오지 못했습니다. 다시 시도해주세요.'))
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
