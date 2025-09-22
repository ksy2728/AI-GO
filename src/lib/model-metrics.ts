import { Model, BenchmarkScore, Pricing } from '@/types/models'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// AA Models interface to match the JSON data structure
interface AAModel {
  rank: number
  name: string
  provider: string
  slug: string
  intelligenceScore: number
  outputSpeed: number
  inputPrice: number
  outputPrice: number
  contextWindow: number
  lastUpdated: string
  category: string
  trend: string
  metadata: {
    source: string
    scrapedAt: string
    scrapingMethod: string
  }
}

interface AAModelsData {
  models: AAModel[]
  metadata?: {
    lastUpdated: string
    source: string
    totalModels?: number
  }
}

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
  const { limit = 9, ascending = false, filterZero = true } = options

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
export function getTopIntelligenceModels(models: Model[], limit = 9): ModelHighlight[] {
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
export function getTopSpeedModels(models: Model[], limit = 9): ModelHighlight[] {
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
export function getTopPriceModels(models: Model[], limit = 9): ModelHighlight[] {
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

/**
 * Fetch AA models data from GitHub repository
 */
async function fetchAAModels(): Promise<AAModelsData | null> {
  try {
    const sources = [
      'https://raw.githubusercontent.com/ksy2728/AI-GO/master/public/data/aa-models.json',
      'https://cdn.jsdelivr.net/gh/ksy2728/AI-GO@master/public/data/aa-models.json'
    ]

    for (const source of sources) {
      try {
        const response = await fetch(source, {
          headers: { 'Cache-Control': 'no-cache' },
          next: { revalidate: 300 } // 5 minute revalidation
        })

        if (response.ok) {
          const data: AAModelsData = await response.json()
          console.log(`📊 Fetched ${data.models?.length || 0} AA models from ${source}`)
          return data
        }
      } catch (error) {
        console.warn(`❌ Failed to fetch from ${source}:`, error)
        continue
      }
    }

    return null
  } catch (error) {
    console.error('❌ Failed to fetch AA models:', error)
    return null
  }
}

/**
 * Convert AA model to ModelHighlight format
 */
function aaModelToHighlight(aaModel: AAModel, rank: number, value: number, displayValue: string): ModelHighlight {
  return {
    modelId: aaModel.slug,
    modelName: aaModel.name,
    provider: aaModel.provider,
    providerLogo: undefined, // Not available in AA data
    color: PROVIDER_COLORS[aaModel.provider.toLowerCase()] || PROVIDER_COLORS.default,
    value: value,
    displayValue: displayValue,
    rank: rank
  }
}

/**
 * Fetch model highlights directly from database (server-side only)
 */
async function fetchModelHighlightsFromDBDirect(limit = 9): Promise<ModelHighlightsData | null> {
  try {
    console.log('🔍 Fetching model highlights directly from DB...')

    // Get top models by intelligence score
    const intelligenceModels = await prisma.model.findMany({
      where: {
        isActive: true,
        intelligenceScore: { not: null }
      },
      select: {
        id: true,
        name: true,
        intelligenceScore: true,
        lastVerified: true,
        provider: {
          select: {
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: {
        intelligenceScore: 'desc'
      },
      take: limit
    })

    // Get top models by output speed
    const speedModels = await prisma.model.findMany({
      where: {
        isActive: true,
        outputSpeed: { not: null }
      },
      select: {
        id: true,
        name: true,
        outputSpeed: true,
        lastVerified: true,
        provider: {
          select: {
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: {
        outputSpeed: 'desc'
      },
      take: limit
    })

    // Get top models by price (cheapest first)
    const priceModels = await prisma.$queryRaw<Array<{
      id: string
      name: string
      provider_name: string
      provider_logo: string | null
      avg_price: number
      last_verified: Date | null
    }>>`
      SELECT
        m.id,
        m.name,
        p.name as provider_name,
        p.logo_url as provider_logo,
        ((COALESCE(m.input_price::numeric, 0) + COALESCE(m.output_price::numeric, 0)) / 2) as avg_price,
        m.last_verified
      FROM models m
      JOIN providers p ON m.provider_id = p.id
      WHERE m.is_active = true
        AND (m.input_price IS NOT NULL OR m.output_price IS NOT NULL)
        AND ((COALESCE(m.input_price::numeric, 0) + COALESCE(m.output_price::numeric, 0)) / 2) > 0
      ORDER BY avg_price ASC
      LIMIT ${limit}
    `

    // Transform data to response format
    const intelligence: ModelHighlight[] = intelligenceModels.map((model, index) => ({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider.name,
      value: model.intelligenceScore || 0,
      displayValue: (model.intelligenceScore || 0).toFixed(1),
      rank: index + 1,
      color: PROVIDER_COLORS[model.provider.name.toLowerCase()] || PROVIDER_COLORS.default
    }))

    const speed: ModelHighlight[] = speedModels.map((model, index) => ({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider.name,
      value: model.outputSpeed || 0,
      displayValue: Math.round(model.outputSpeed || 0).toString() + ' tokens/s',
      rank: index + 1,
      color: PROVIDER_COLORS[model.provider.name.toLowerCase()] || PROVIDER_COLORS.default
    }))

    const price: ModelHighlight[] = priceModels.map((model, index) => ({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider_name,
      value: Number(model.avg_price),
      displayValue: '$' + Number(model.avg_price).toFixed(2),
      rank: index + 1,
      color: PROVIDER_COLORS[model.provider_name.toLowerCase()] || PROVIDER_COLORS.default
    }))

    // Get total model count
    const totalModels = await prisma.model.count({
      where: { isActive: true }
    })

    // Get most recent update time
    const mostRecent = await prisma.model.findFirst({
      where: {
        isActive: true,
        lastVerified: { not: null }
      },
      select: {
        lastVerified: true
      },
      orderBy: {
        lastVerified: 'desc'
      }
    })

    console.log('✅ Successfully fetched model highlights directly from DB')

    return {
      intelligence,
      speed,
      price,
      metadata: {
        lastUpdated: mostRecent?.lastVerified?.toISOString() || new Date().toISOString(),
        totalModels,
        dataSource: 'database'
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch directly from DB:', error)
    return null
  }
}

/**
 * Fetch model highlights from DB API
 */
async function fetchModelHighlightsFromDB(limit = 9): Promise<ModelHighlightsData | null> {
  try {
    console.log('🔍 Fetching model highlights from DB API...')

    // Determine the base URL based on environment
    const baseUrl = typeof window === 'undefined'
      ? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`
      : ''

    // Try to fetch from DB API first
    const response = await fetch(`${baseUrl}/api/v1/models/metrics?limit=${limit}`, {
      headers: { 'Cache-Control': 'no-cache' },
      next: { revalidate: 300 } // 5 minute revalidation
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Successfully fetched model highlights from DB')
      return data
    } else {
      console.warn(`⚠️ DB API returned status ${response.status}`)
      return null
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch from DB API:', error)
    return null
  }
}

/**
 * Get model highlights using DB-first strategy with curated fallback
 */
export async function getModelHighlights(models: Model[] = [], limit = 9): Promise<ModelHighlightsData> {
  console.log('🎯 Getting model highlights (DB-first strategy with curation)')

  try {
    // If server-side, try direct DB access first
    if (typeof window === 'undefined') {
      try {
        const directDbData = await fetchModelHighlightsFromDBDirect(limit)
        if (directDbData) {
          console.log('✅ Using direct DB data for highlights (server-side)')
          return directDbData
        }
      } catch (error) {
        console.warn('⚠️ Direct DB access failed, falling back to API:', error)
      }
    }

    // Try DB API (for client-side or if direct DB fails)
    const dbData = await fetchModelHighlightsFromDB(limit)

    if (dbData) {
      console.log('✅ Using DB API data for highlights')
      return dbData
    }

    // Fallback to curated AA-style highlights
    console.log('⚠️ DB API failed, falling back to curated AA highlights...')

    // Try to load featured models configuration
    let featuredConfig: any = null
    try {
      // Import featured models configuration
      const featured = await import('@/data/featured-models.json')
      featuredConfig = featured.default || featured
      console.log('📌 Loaded featured models configuration')
    } catch (error) {
      console.warn('⚠️ Could not load featured models config:', error)
    }

    const aaData = await fetchAAModels()

    if (!aaData || !aaData.models || aaData.models.length === 0) {
      console.warn('⚠️ No AA data available, using fallback empty data')
      return {
        intelligence: [],
        speed: [],
        price: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          totalModels: 0,
          dataSource: 'fallback-empty'
        }
      }
    }

    // Get models for each metric - use featured config if available, otherwise top 9

    let intelligenceRankings: ModelHighlight[] = []
    let speedRankings: ModelHighlight[] = []
    let priceRankings: ModelHighlight[] = []

    if (featuredConfig?.highlightedModels) {
      console.log('🌟 Using curated featured models for highlights')

      // 1. Intelligence - use featured list
      const featuredIntelligence = featuredConfig.highlightedModels.intelligence || []
      intelligenceRankings = featuredIntelligence
        .map((slug: string) => {
          const model = aaData.models.find((m: any) => m.slug === slug)
          if (!model) return null
          const rank = featuredIntelligence.indexOf(slug) + 1
          return aaModelToHighlight(model, rank, model.intelligenceScore, model.intelligenceScore.toFixed(1))
        })
        .filter((m: any) => m !== null)
        .slice(0, limit)

      // 2. Speed - use featured list
      const featuredSpeed = featuredConfig.highlightedModels.speed || []
      speedRankings = featuredSpeed
        .map((slug: string) => {
          const model = aaData.models.find((m: any) => m.slug === slug)
          if (!model) return null
          const rank = featuredSpeed.indexOf(slug) + 1
          return aaModelToHighlight(model, rank, model.outputSpeed, Math.round(model.outputSpeed).toString())
        })
        .filter((m: any) => m !== null)
        .slice(0, limit)

      // 3. Price - use featured list
      const featuredPrice = featuredConfig.highlightedModels.price || []
      priceRankings = featuredPrice
        .map((slug: string) => {
          const model = aaData.models.find((m: any) => m.slug === slug)
          if (!model) return null
          const rank = featuredPrice.indexOf(slug) + 1
          const avgPrice = (model.inputPrice + model.outputPrice) / 2
          return aaModelToHighlight(model, rank, avgPrice, `$${avgPrice.toFixed(2)}`)
        })
        .filter((m: any) => m !== null)
        .slice(0, limit)
    }

    // Fallback to top 9 if featured config not available or incomplete
    if (intelligenceRankings.length === 0) {
      console.log('📊 Using top 9 models for intelligence (no featured config)')
      intelligenceRankings = [...aaData.models]
        .sort((a, b) => b.intelligenceScore - a.intelligenceScore)
        .slice(0, limit)
        .map((aaModel, index) =>
          aaModelToHighlight(aaModel, index + 1, aaModel.intelligenceScore, aaModel.intelligenceScore.toFixed(1))
        )
    }

    if (speedRankings.length === 0) {
      console.log('📊 Using top 9 models for speed (no featured config)')
      speedRankings = [...aaData.models]
        .sort((a, b) => b.outputSpeed - a.outputSpeed)
        .slice(0, limit)
        .map((aaModel, index) =>
          aaModelToHighlight(aaModel, index + 1, aaModel.outputSpeed, Math.round(aaModel.outputSpeed).toString())
        )
    }

    if (priceRankings.length === 0) {
      console.log('📊 Using top 9 models for price (no featured config)')
      const priceModels = [...aaData.models]
        .map(aaModel => ({
          ...aaModel,
          avgPrice: (aaModel.inputPrice + aaModel.outputPrice) / 2
        }))
        .sort((a, b) => a.avgPrice - b.avgPrice)
        .slice(0, limit)

      priceRankings = priceModels.map((aaModel, index) =>
        aaModelToHighlight(aaModel, index + 1, aaModel.avgPrice, `$${aaModel.avgPrice.toFixed(2)}`)
      )
    }

    console.log(`✅ Created AA JSON-based highlights:`)
    console.log(`   Intelligence: ${intelligenceRankings.length} models`)
    console.log(`   Speed: ${speedRankings.length} models`)
    console.log(`   Price: ${priceRankings.length} models`)

    return {
      intelligence: intelligenceRankings,
      speed: speedRankings,
      price: priceRankings,
      metadata: {
        lastUpdated: aaData.metadata?.lastUpdated || new Date().toISOString(),
        totalModels: aaData.models.length,
        dataSource: 'aa-json-fallback'
      }
    }

  } catch (error) {
    console.error('❌ Error in getModelHighlights:', error)

    // Final fallback to empty data
    return {
      intelligence: [],
      speed: [],
      price: [],
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalModels: 0,
        dataSource: 'error-fallback'
      }
    }
  }
}