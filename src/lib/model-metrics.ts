import { Model, BenchmarkScore, Pricing } from '@/types/models'

// Provider color mapping for charts
export const PROVIDER_COLORS: Record<string, string> = {
  'openai': '#000000',
  'anthropic': '#D2691E',
  'google': '#4285F4',
  'meta': '#0084FF',
  'mistral': '#FF6B6B',
  'cohere': '#39E5B1',
  'ai21': '#6366F1',
  'aleph-alpha': '#8B5CF6',
  'default': '#6B7280'
}

export interface ModelHighlight {
  modelId: string
  modelName: string
  provider: string
  providerLogo?: string
  color: string
  value: number
  displayValue: string
  rank: number
}

/**
 * Calculate intelligence score from benchmark data or AA metadata
 * Normalizes different benchmark scores to 0-100 scale
 */
export function calculateIntelligenceScore(benchmarkScores: BenchmarkScore[], metadata?: any): number {
  // Check for AA intelligence score first
  if (metadata?.aa?.intelligenceScore) {
    return Number(metadata.aa.intelligenceScore)
  }
  if (metadata?.intelligenceScore) {
    return Number(metadata.intelligenceScore)
  }
  
  // Check if metadata is actually the model object itself with intelligenceScore at top level
  if (metadata && typeof metadata === 'object' && 'intelligenceScore' in metadata && metadata.intelligenceScore) {
    return Number(metadata.intelligenceScore)
  }
  
  if (!benchmarkScores || benchmarkScores.length === 0) return 0

  // Weight different benchmarks
  const weights: Record<string, number> = {
    'mmlu': 0.3,
    'humaneval': 0.2,
    'gsm8k': 0.15,
    'hellaswag': 0.15,
    'arc': 0.1,
    'truthfulqa': 0.1
  }

  let totalScore = 0
  let totalWeight = 0

  benchmarkScores.forEach(score => {
    const benchmarkName = score.suite?.slug?.toLowerCase() || ''
    const weight = weights[benchmarkName] || 0.05
    
    // Use normalized score if available, otherwise normalize raw score
    const normalizedScore = score.scoreNormalized || 
      (score.scoreRaw / (score.suite?.maxScore || 100)) * 100

    totalScore += normalizedScore * weight
    totalWeight += weight
  })

  // Return weighted average, ensuring it's between 0-100
  return totalWeight > 0 ? Math.min(100, Math.max(0, totalScore / totalWeight)) : 0
}

/**
 * Calculate speed metric (tokens per second)
 * Uses AA output speed, throughput data or derives from latency
 */
export function calculateSpeedMetric(model: Model): number {
  // Check for AA output speed first
  const metadata = model.metadata
  if (metadata?.aa?.outputSpeed) {
    return Number(metadata.aa.outputSpeed)
  }
  if (metadata?.outputSpeed) {
    return Number(metadata.outputSpeed)
  }
  
  // Check for direct throughput data
  if (metadata?.throughput) {
    return Number(metadata.throughput)
  }

  // Check status for latency and derive speed
  if (model.status && Array.isArray(model.status) && model.status.length > 0) {
    const status = model.status[0] as any
    const latency = status.latency || status.latencyP50 || status.latency_p50
    if (latency && latency > 0) {
      // Rough estimate: assume 100 tokens average request
      // Speed = tokens / (latency in seconds)
      return Math.round(100 / (latency / 1000))
    }
  }

  // Check metadata for performance metrics
  if (model.metadata?.performance?.tokensPerSecond) {
    return Number(model.metadata.performance.tokensPerSecond)
  }

  // Default based on model tier (rough estimates)
  if (model.name.toLowerCase().includes('turbo') || model.name.toLowerCase().includes('flash')) {
    return 250 // Fast models
  } else if (model.name.toLowerCase().includes('mini') || model.name.toLowerCase().includes('small')) {
    return 150 // Small models
  }

  return 50 // Default for standard models
}

/**
 * Extract price metric (USD per million tokens)
 * Averages input and output prices or uses AA price data
 */
export function extractPriceMetric(pricing: Pricing[], metadata?: any): number {
  // Check for AA price data first
  if (metadata?.aa?.price) {
    const aaPrice = metadata.aa.price
    if (typeof aaPrice === 'object' && (aaPrice.input || aaPrice.output)) {
      const input = Number(aaPrice.input) || 0
      const output = Number(aaPrice.output) || 0
      return (input + output) / 2
    }
    return Number(aaPrice)
  }
  if (metadata?.aaPrice) {
    if (typeof metadata.aaPrice === 'object' && (metadata.aaPrice.input || metadata.aaPrice.output)) {
      const input = Number(metadata.aaPrice.input) || 0
      const output = Number(metadata.aaPrice.output) || 0
      return (input + output) / 2
    }
    return Number(metadata.aaPrice)
  }
  
  if (!pricing || pricing.length === 0) return 0

  // Get the most recent pricing
  const currentPricing = pricing
    .filter(p => !p.effectiveTo || new Date(p.effectiveTo) > new Date())
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0]

  if (!currentPricing) return 0

  const inputPrice = currentPricing.inputPerMillion || 0
  const outputPrice = currentPricing.outputPerMillion || 0

  // Return average of input and output prices
  return (inputPrice + outputPrice) / 2
}

/**
 * Rank models by a specific metric
 * Returns top N models sorted by value
 */
export function rankModels(
  models: Model[],
  metricExtractor: (model: Model) => number,
  options: {
    limit?: number
    ascending?: boolean
    filterZero?: boolean
  } = {}
): ModelHighlight[] {
  const { limit = 12, ascending = false, filterZero = true } = options

  // Calculate metrics for all models
  const modelsWithMetrics = models.map(model => ({
    model,
    value: metricExtractor(model)
  }))

  // Filter out zero values if requested
  const filtered = filterZero 
    ? modelsWithMetrics.filter(m => m.value > 0)
    : modelsWithMetrics

  // Sort by value
  const sorted = filtered.sort((a, b) => 
    ascending ? a.value - b.value : b.value - a.value
  )

  // Take top N and create highlights
  return sorted.slice(0, limit).map((item, index) => ({
    modelId: item.model.id,
    modelName: item.model.name,
    provider: item.model.provider?.name || item.model.providerId || 'Unknown',
    providerLogo: item.model.provider?.logoUrl,
    color: PROVIDER_COLORS[item.model.providerId?.toLowerCase() || ''] || PROVIDER_COLORS.default,
    value: item.value,
    displayValue: formatMetricValue(item.value, metricExtractor.name),
    rank: index + 1
  }))
}

/**
 * Format metric value for display
 */
function formatMetricValue(value: number, metricType?: string): string {
  if (metricType?.includes('Price')) {
    return `$${value.toFixed(2)}`
  } else if (metricType?.includes('Speed')) {
    return `${Math.round(value)}`
  } else {
    return value.toFixed(1)
  }
}

/**
 * Get top models for intelligence metric
 */
export function getTopIntelligenceModels(models: Model[], limit = 12): ModelHighlight[] {
  console.log(`getTopIntelligenceModels called with ${models.length} models`)
  
  const extractor = (model: Model) => {
    // Cast to any to check for preprocessed fields
    const modelAny = model as any
    
    // First check if intelligenceScore exists at model level (from API preprocessing)
    if (modelAny.intelligenceScore !== undefined && modelAny.intelligenceScore !== null) {
      const score = Number(modelAny.intelligenceScore)
      console.log(`Model ${model.name}: using top-level intelligenceScore = ${score}`)
      return score
    }
    
    // Otherwise use the standard calculation
    const score = calculateIntelligenceScore(model.benchmarkScores || [], model.metadata || model)
    console.log(`Model ${model.name}: using calculated score = ${score}`)
    return score
  }
  
  const result = rankModels(models, extractor, { limit, ascending: false })
  console.log(`getTopIntelligenceModels result: ${result.length} models`)
  return result
}

/**
 * Get top models for speed metric
 */
export function getTopSpeedModels(models: Model[], limit = 12): ModelHighlight[] {
  const extractor = (model: Model) => {
    // Cast to any to check for preprocessed fields
    const modelAny = model as any
    
    // First check if outputSpeed exists at model level (from API preprocessing)
    if (modelAny.outputSpeed !== undefined && modelAny.outputSpeed !== null) {
      return Number(modelAny.outputSpeed)
    }
    
    // Otherwise use the standard calculation
    return calculateSpeedMetric(model)
  }
  
  return rankModels(models, extractor, { limit, ascending: false })
}

/**
 * Get top models for price metric (cheapest first)
 */
export function getTopPriceModels(models: Model[], limit = 12): ModelHighlight[] {
  const extractor = (model: Model) => {
    // Cast to any to check for preprocessed fields
    const modelAny = model as any
    
    // First check if aaPrice exists at model level (from API preprocessing)
    if (modelAny.aaPrice !== undefined && modelAny.aaPrice !== null) {
      const aaPrice = modelAny.aaPrice
      if (typeof aaPrice === 'object' && (aaPrice.input || aaPrice.output)) {
        const input = Number(aaPrice.input) || 0
        const output = Number(aaPrice.output) || 0
        return (input + output) / 2
      }
      return Number(aaPrice)
    }
    
    // Otherwise use the standard extraction
    return extractPriceMetric(model.pricing || [], model.metadata || model)
  }
  
  return rankModels(models, extractor, { limit, ascending: true })
}

/**
 * Get all highlights data for charts
 */
export interface ModelHighlightsData {
  intelligence: ModelHighlight[]
  speed: ModelHighlight[]
  price: ModelHighlight[]
  metadata: {
    lastUpdated: string
    totalModels: number
    dataSource?: string
  }
}

export function getModelHighlights(models: Model[]): ModelHighlightsData {
  return {
    intelligence: getTopIntelligenceModels(models),
    speed: getTopSpeedModels(models),
    price: getTopPriceModels(models),
    metadata: {
      lastUpdated: new Date().toISOString(),
      totalModels: models.length,
      dataSource: 'database'
    }
  }
}