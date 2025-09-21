import { Model, ModelStats, Provider, BenchmarkScore, Incident, ModelStatus } from '@/types/models'

// Use relative URL by default to avoid CORS issues
// This ensures the API calls go to the same domain as the frontend
// IMPORTANT: Do not use localhost fallback in production
const API_BASE_URL = typeof window !== 'undefined'
  ? '' // Always use relative URL in browser
  : process.env.NEXT_PUBLIC_API_URL || ''

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>()

// Cache utilities
const CACHE_PREFIX = 'ai_models_cache_'
const CACHE_EXPIRY_MINUTES = 15 // Cache for 15 minutes
const STALE_WHILE_REVALIDATE_MINUTES = 30 // Consider data stale but usable for 30 minutes

interface CachedResponse<T> {
  data: T
  timestamp: number
  expires: number
  staleExpires: number
}

function getCacheKey(endpoint: string, options?: FetchOptions): string {
  return `${CACHE_PREFIX}${endpoint}_${JSON.stringify(options || {})}`
}

function getCachedData<T>(key: string): { data: T; isStale: boolean } | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    
    const parsed: CachedResponse<T> = JSON.parse(cached)
    const now = Date.now()
    
    // Check if cache is completely expired
    if (now > parsed.staleExpires) {
      localStorage.removeItem(key)
      return null
    }
    
    // Return data with staleness info
    const isStale = now > parsed.expires
    return { data: parsed.data, isStale }
  } catch (error) {
    console.warn('Failed to read from cache:', error)
    return null
  }
}

function setCachedData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  
  try {
    const now = Date.now()
    const cached: CachedResponse<T> = {
      data,
      timestamp: now,
      expires: now + (CACHE_EXPIRY_MINUTES * 60 * 1000),
      staleExpires: now + (STALE_WHILE_REVALIDATE_MINUTES * 60 * 1000)
    }
    
    localStorage.setItem(key, JSON.stringify(cached))
  } catch (error) {
    console.warn('Failed to write to cache:', error)
  }
}

class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'APIError'
  }
}

interface FetchOptions extends RequestInit {
  silent?: boolean  // If true, suppress console errors
}

async function fetchAPI<T>(endpoint: string, options?: FetchOptions, retries = 3): Promise<T> {
  // Create unique request key for deduplication
  const requestKey = `${endpoint}${JSON.stringify(options || {})}`
  const cacheKey = getCacheKey(endpoint, options)
  
  // Check cache first (only for GET requests without special options)
  if (!options?.method || options.method === 'GET') {
    const cachedResult = getCachedData<T>(cacheKey)
    if (cachedResult) {
      if (!options?.silent) {
        console.log(`Using ${cachedResult.isStale ? 'stale cached' : 'fresh cached'} data for: ${endpoint}`)
      }
      
      // If data is stale, trigger background revalidation
      if (cachedResult.isStale && !pendingRequests.has(requestKey)) {
        const revalidatePromise = executeRequest<T>(endpoint, { ...options, silent: true }, retries)
          .then(freshData => {
            setCachedData(cacheKey, freshData)
            return freshData
          })
          .catch(error => {
            console.warn(`Background revalidation failed for ${endpoint}:`, error)
          })
        
        pendingRequests.set(requestKey, revalidatePromise)
        
        // Clean up after revalidation
        revalidatePromise.finally(() => {
          pendingRequests.delete(requestKey)
        })
      }
      
      return cachedResult.data
    }
  }
  
  // Check if request is already pending
  if (pendingRequests.has(requestKey)) {
    if (!options?.silent) {
      console.log(`Reusing pending request for: ${endpoint}`)
    }
    return pendingRequests.get(requestKey) as Promise<T>
  }
  
  // Create the request promise
  const requestPromise = executeRequest<T>(endpoint, options, retries)
  
  // Store pending request
  pendingRequests.set(requestKey, requestPromise)
  
  try {
    const result = await requestPromise
    
    // Cache successful GET responses
    if ((!options?.method || options.method === 'GET') && result) {
      setCachedData(cacheKey, result)
    }
    
    return result
  } finally {
    // Clean up pending request
    pendingRequests.delete(requestKey)
  }
}

async function executeRequest<T>(endpoint: string, options?: FetchOptions, retries = 5): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout for heavy operations
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new APIError(`API Error: ${response.statusText}`, response.status)
        }
        // Retry on server errors (5xx)
        throw new APIError(`Server Error: ${response.statusText}`, response.status)
      }

      return await response.json()
    } catch (error) {
      lastError = error as Error
      
      // If it's an APIError with 4xx status, don't retry
      if (error instanceof APIError && error.status && error.status >= 400 && error.status < 500) {
        throw error
      }
      
      // If it's the last attempt, throw the error
      if (attempt === retries) {
        if (error instanceof APIError) {
          throw error
        }
        // Check if it's an abort error (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError('Request timeout - server took too long to respond')
        }
        throw new APIError('Network error occurred - please check your connection')
      }
      
      // Calculate delay with exponential backoff (1s, 2s, 4s)
      const delay = Math.min(1000 * Math.pow(2, attempt), 4000)
      if (!options?.silent) {
        console.log(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms`)
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new APIError('Unexpected error occurred')
}

export const api = {
  // Models
  async getModels(params?: {
    provider?: string
    modality?: string
    isActive?: boolean
    limit?: number
    offset?: number
    silent?: boolean
  }): Promise<{ models: Model[]; total: number; dataSource?: string }> {
    const searchParams = new URLSearchParams()
    if (params?.provider) searchParams.set('provider', params.provider)
    if (params?.modality) searchParams.set('modality', params.modality)
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())

    const query = searchParams.toString()
    return fetchAPI<{ models: Model[]; total: number; dataSource?: string }>(
      `/api/v1/models${query ? `?${query}` : ''}`,
      { silent: params?.silent }
    )
  },

  async getModel(id: string): Promise<Model> {
    return fetchAPI<Model>(`/api/v1/models/${id}`)
  },

  async getModelHistory(id: string, days = 30): Promise<ModelStatus[]> {
    return fetchAPI<ModelStatus[]>(`/api/v1/models/${id}/history?days=${days}`)
  },

  // Status
  async getModelStats(): Promise<ModelStats> {
    return fetchAPI<ModelStats>('/api/v1/status')
  },

  async getModelStatuses(limit?: number): Promise<{ models: ModelStatus[]; total: number }> {
    const query = limit ? `?limit=${limit}` : ''
    return fetchAPI<{ models: ModelStatus[]; total: number }>(`/api/v1/status/models${query}`)
  },

  // Benchmarks
  async getBenchmarks(params?: {
    suite?: string
    modelId?: string
    limit?: number
  }): Promise<{ benchmarks: BenchmarkScore[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.suite) searchParams.set('suite', params.suite)
    if (params?.modelId) searchParams.set('modelId', params.modelId)
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return fetchAPI<{ benchmarks: BenchmarkScore[]; total: number }>(`/api/v1/benchmarks${query ? `?${query}` : ''}`)
  },

  // Incidents
  async getIncidents(params?: {
    status?: string
    severity?: string
    limit?: number
  }): Promise<{ incidents: Incident[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.severity) searchParams.set('severity', params.severity)
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return fetchAPI<{ incidents: Incident[]; total: number }>(`/api/v1/incidents${query ? `?${query}` : ''}`)
  },

  // News
  async getNews(params?: {
    limit?: number
    offset?: number
  }): Promise<{ news: any[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())

    const query = searchParams.toString()
    return fetchAPI<{ news: any[]; total: number }>(`/api/v1/news${query ? `?${query}` : ''}`)
  },

  // Search
  async search(query: string, type?: string): Promise<{ results: any[]; total: number }> {
    const searchParams = new URLSearchParams()
    searchParams.set('q', query)
    if (type) searchParams.set('type', type)

    return fetchAPI<{ results: any[]; total: number }>(`/api/v1/search?${searchParams.toString()}`)
  },

  // Analytics
  async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    return fetchAPI<void>('/analytics', {
      method: 'POST',
      body: JSON.stringify({ event, properties, timestamp: new Date().toISOString() }),
    })
  },
}