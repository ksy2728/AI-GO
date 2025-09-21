import { Model } from '@/types/models'
import { TableModel } from '@/types/table'

// Helper function to handle string arrays stored as JSON strings in database
function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
      return value ? [value] : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

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
        modalities: coerceStringArray(model.modalities),
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
    const statusValue = Array.isArray(model.status) && model.status.length > 0
      ? model.status[0].status || 'Unknown'
      : typeof model.status === 'string'
        ? model.status
        : 'Unknown';

    const pricing = model.pricing?.[0];

    return {
      id: model.id,
      name: model.name,
      provider: model.provider?.name || model.providerId || 'Unknown',
      status: statusValue,
      modalities: coerceStringArray(model.modalities),
      contextLength: model.contextWindow ?? undefined,
      inputTokenPrice: pricing?.inputPerMillion ? pricing.inputPerMillion / 1_000_000 : undefined,
      outputTokenPrice: pricing?.outputPerMillion ? pricing.outputPerMillion / 1_000_000 : undefined,
      throughput: undefined,
      latency: undefined,
      quality: undefined,
      description: model.description,
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