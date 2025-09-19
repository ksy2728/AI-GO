import { Model } from '@/types/models'
import { TableModel } from '@/types/table'

export function transformModelsToTableModels(models: any[]): TableModel[] {
  return models.map(model => {
    // Handle both old Model type and new UnifiedModel type

    // For UnifiedModel (from API)
    if (model.priceInput !== undefined || model.priceOutput !== undefined || model.intelligence !== undefined) {
      return {
        id: model.id,
        name: model.name,
        provider: model.provider || 'Unknown',
        status: model.status || 'Unknown',
        modalities: model.modalities || ['text'],
        contextLength: model.contextWindow,
        inputTokenPrice: model.priceInput,
        outputTokenPrice: model.priceOutput,
        throughput: model.speed, // Use speed as throughput
        latency: model.db?.latency?.p50, // Use p50 latency from db metrics
        quality: model.intelligence ? model.intelligence / 100 : undefined, // Convert intelligence to quality
        description: model.description
      }
    }

    // For old Model type (from database)
    let statusValue = 'Unknown'
    if (model.status && Array.isArray(model.status) && model.status.length > 0) {
      statusValue = model.status[0].status || 'Unknown'
    }

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
      throughput: undefined,
      latency: undefined,
      quality: undefined,
      description: model.description
    }
  })
}

export function formatPricing(price?: number): string {
  if (price === undefined || price === null) return '-'
  // Price is already in dollars per 1M tokens, display with 2 decimal places
  return `$${price.toFixed(2)}`
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