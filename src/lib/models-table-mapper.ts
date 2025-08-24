import { Model } from '@/types/models'
import { TableModel } from '@/types/table'

export function transformModelsToTableModels(models: Model[]): TableModel[] {
  return models.map(model => {
    // ModelStatus 배열에서 첫 번째 상태의 status를 추출하거나 Unknown
    let statusValue = 'Unknown'
    if (model.status && Array.isArray(model.status) && model.status.length > 0) {
      statusValue = model.status[0].status || 'Unknown'
    }

    // pricing 배열에서 첫 번째 가격 정보 추출
    const pricing = model.pricing && model.pricing.length > 0 ? model.pricing[0] : null

    return {
      id: model.id,
      name: model.name,
      provider: model.provider?.name || model.providerId || 'Unknown',
      status: statusValue,
      modalities: model.modalities || [],
      contextLength: model.contextWindow,
      inputTokenPrice: pricing?.inputPerMillion ? pricing.inputPerMillion / 1000000 : undefined,
      outputTokenPrice: pricing?.outputPerMillion ? pricing.outputPerMillion / 1000000 : undefined,
      throughput: undefined, // Model 타입에 performance 필드 없음
      latency: undefined,    // Model 타입에 performance 필드 없음  
      quality: undefined,    // Model 타입에 performance 필드 없음
      description: model.description
    }
  })
}

export function formatPricing(price?: number): string {
  if (price === undefined || price === null) return '-'
  return `$${price.toFixed(4)}`
}

export function formatContextLength(length?: number): string {
  if (!length) return '-'
  if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`
  if (length >= 1000) return `${(length / 1000).toFixed(0)}K`
  return length.toString()
}

export function formatLatency(latency?: number): string {
  if (!latency) return '-'
  return `${latency.toFixed(0)}ms`
}

export function formatThroughput(throughput?: number): string {
  if (!throughput) return '-'
  return `${throughput.toFixed(0)} tok/s`
}

export function formatQuality(quality?: number): string {
  if (!quality) return '-'
  return `${(quality * 100).toFixed(0)}%`
}