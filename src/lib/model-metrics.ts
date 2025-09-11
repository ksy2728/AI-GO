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
    
    // Try multiple ways to get intelligenceScore
    let score = 0
    
    // Method 1: Direct field access from API preprocessing
    if ('intelligenceScore' in modelAny && typeof modelAny.intelligenceScore === 'number') {
      score = modelAny.intelligenceScore
      console.log(`Model ${model.name}: Method 1 - intelligenceScore = ${score}`)
    }
    // Method 2: From metadata.aa
    else if (modelAny.metadata?.aa?.intelligenceScore) {
      score = Number(modelAny.metadata.aa.intelligenceScore) || 0
      console.log(`Model ${model.name}: Method 2 - metadata.aa.intelligenceScore = ${score}`)
    }
    // Method 3: Parse string metadata
    else if (typeof modelAny.metadata === 'string') {
      try {
        const parsed = JSON.parse(modelAny.metadata)
        if (parsed.aa?.intelligenceScore) {
          score = Number(parsed.aa.intelligenceScore) || 0
          console.log(`Model ${model.name}: Method 3 - parsed metadata = ${score}`)
        }
      } catch (e) {
        console.warn(`Failed to parse metadata for ${model.name}:`, e)
      }
    }
    // Method 4: Standard calculation from benchmarks
    else {
      score = calculateIntelligenceScore(model.benchmarkScores || [], model.metadata || model)
      console.log(`Model ${model.name}: Method 4 - calculated score = ${score}`)
    }
    
    return Math.max(0, score) // Ensure non-negative
  }
  
  const result = rankModels(models, extractor, { limit, ascending: false })
  console.log(`getTopIntelligenceModels result: ${result.length} models with scores`)
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
  console.log(`getTopPriceModels called with ${models.length} models`)
  
  const extractor = (model: Model) => {
    // Cast to any to check for preprocessed fields
    const modelAny = model as any
    
    // Try multiple ways to get price data
    let price = 0
    
    // Method 1: Direct field access from API preprocessing
    if ('aaPrice' in modelAny && typeof modelAny.aaPrice === 'number') {
      price = modelAny.aaPrice
      console.log(`Model ${model.name}: Method 1 - aaPrice = ${price}`)
    }
    // Method 2: Handle aaPrice as object (input/output)
    else if (modelAny.aaPrice && typeof modelAny.aaPrice === 'object') {
      const input = Number(modelAny.aaPrice.input) || 0
      const output = Number(modelAny.aaPrice.output) || 0
      price = (input + output) / 2
      console.log(`Model ${model.name}: Method 2 - aaPrice object = ${price}`)
    }
    // Method 3: From metadata.aa.price
    else if (modelAny.metadata?.aa?.price) {
      const aaPrice = modelAny.metadata.aa.price
      if (typeof aaPrice === 'object' && (aaPrice.input || aaPrice.output)) {
        const input = Number(aaPrice.input) || 0
        const output = Number(aaPrice.output) || 0
        price = (input + output) / 2
        console.log(`Model ${model.name}: Method 3 - metadata.aa.price object = ${price}`)
      } else {
        price = Number(aaPrice) || 0
        console.log(`Model ${model.name}: Method 3 - metadata.aa.price number = ${price}`)
      }
    }
    // Method 4: Parse string metadata
    else if (typeof modelAny.metadata === 'string') {
      try {
        const parsed = JSON.parse(modelAny.metadata)
        if (parsed.aa?.price) {
          const aaPrice = parsed.aa.price
          if (typeof aaPrice === 'object' && (aaPrice.input || aaPrice.output)) {
            const input = Number(aaPrice.input) || 0
            const output = Number(aaPrice.output) || 0
            price = (input + output) / 2
          } else {
            price = Number(aaPrice) || 0
          }
          console.log(`Model ${model.name}: Method 4 - parsed metadata = ${price}`)
        }
      } catch (e) {
        console.warn(`Failed to parse metadata for ${model.name}:`, e)
      }
    }
    // Method 5: Standard extraction from pricing table
    else {
      price = extractPriceMetric(model.pricing || [], model.metadata || model)
      console.log(`Model ${model.name}: Method 5 - extracted price = ${price}`)
    }
    
    return Math.max(0, price) // Ensure non-negative
  }
  
  const result = rankModels(models, extractor, { limit, ascending: true })
  console.log(`getTopPriceModels result: ${result.length} models with prices`)
  return result
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