import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Model } from '@/types/models'

interface UseModelsParams {
  provider?: string
  modality?: string
  isActive?: boolean
  limit?: number
  enabled?: boolean
}

export function useModels(params: UseModelsParams = {}) {
  return useQuery({
    queryKey: ['models', params],
    queryFn: () => api.getModels(params),
    enabled: params.enabled !== false,
    select: (data) => ({
      ...data,
      models: data.models as Model[]
    })
  })
}

export function useModel(id: string) {
  return useQuery({
    queryKey: ['model', id],
    queryFn: () => api.getModel(id),
    enabled: !!id,
  })
}

export function useModelHistory(id: string, days = 30) {
  return useQuery({
    queryKey: ['model-history', id, days],
    queryFn: () => api.getModelHistory(id, days),
    enabled: !!id,
  })
}