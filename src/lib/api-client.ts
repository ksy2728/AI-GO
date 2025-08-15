import { Model, ModelStats, Provider, BenchmarkScore, Incident, ModelStatus } from '@/types/models'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'

class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'APIError'
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new APIError(`API Error: ${response.statusText}`, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('Network error occurred')
  }
}

export const api = {
  // Models
  async getModels(params?: {
    provider?: string
    modality?: string
    isActive?: boolean
    limit?: number
    offset?: number
  }): Promise<{ models: Model[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.provider) searchParams.set('provider', params.provider)
    if (params?.modality) searchParams.set('modality', params.modality)
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())

    const query = searchParams.toString()
    return fetchAPI<{ models: Model[]; total: number }>(`/v1/models${query ? `?${query}` : ''}`)
  },

  async getModel(id: string): Promise<Model> {
    return fetchAPI<Model>(`/v1/models/${id}`)
  },

  async getModelHistory(id: string, days = 30): Promise<ModelStatus[]> {
    return fetchAPI<ModelStatus[]>(`/v1/models/${id}/history?days=${days}`)
  },

  // Status
  async getModelStats(): Promise<ModelStats> {
    return fetchAPI<ModelStats>('/v1/status')
  },

  async getModelStatuses(limit?: number): Promise<{ models: ModelStatus[]; total: number }> {
    const query = limit ? `?limit=${limit}` : ''
    return fetchAPI<{ models: ModelStatus[]; total: number }>(`/v1/status/models${query}`)
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
    return fetchAPI<{ benchmarks: BenchmarkScore[]; total: number }>(`/v1/benchmarks${query ? `?${query}` : ''}`)
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
    return fetchAPI<{ incidents: Incident[]; total: number }>(`/v1/incidents${query ? `?${query}` : ''}`)
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
    return fetchAPI<{ news: any[]; total: number }>(`/v1/news${query ? `?${query}` : ''}`)
  },

  // Search
  async search(query: string, type?: string): Promise<{ results: any[]; total: number }> {
    const searchParams = new URLSearchParams()
    searchParams.set('q', query)
    if (type) searchParams.set('type', type)

    return fetchAPI<{ results: any[]; total: number }>(`/v1/search?${searchParams.toString()}`)
  },

  // Analytics
  async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    return fetchAPI<void>('/analytics', {
      method: 'POST',
      body: JSON.stringify({ event, properties, timestamp: new Date().toISOString() }),
    })
  },
}