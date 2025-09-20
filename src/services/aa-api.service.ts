import { cache } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

export interface AAModelData {
  id: string
  name: string
  provider: string
  intelligenceScore: number
  outputSpeed: number
  price: {
    input: number
    output: number
  }
  rank?: number
  category?: string
  lastUpdated: Date
}

/**
 * Artificial Analysis API Service
 * Provides real intelligence scores and model data from AA without simulation
 */
export class ArtificialAnalysisAPI {
  private static readonly CACHE_TTL = 3600 // 1 hour
  private static readonly AA_BASE_URL = 'https://artificialanalysis.ai'

  /**
   * Get intelligence score for a model from AA API or database
   * Returns null if no real data is available (never fake values)
   */
  static async getIntelligenceScore(modelId: string): Promise<number | null> {
    try {
      // First check database for recent AA data
      const model = await prisma.model.findUnique({
        where: { id: modelId },
        select: { metadata: true, updatedAt: true }
      })

      if (model?.metadata) {
        const metadata = model.metadata as any
        if (metadata.aa?.intelligenceScore && metadata.aa?.lastUpdated) {
          const lastUpdated = new Date(metadata.aa.lastUpdated)
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

          // Use database data if less than 24 hours old
          if (lastUpdated > oneDayAgo) {
            return metadata.aa.intelligenceScore
          }
        }
      }

      // Try to fetch fresh data from AA API
      const aaData = await this.fetchFromAA(modelId)
      if (aaData?.intelligenceScore) {
        // Update database with fresh data
        await this.updateModelWithAAData(modelId, aaData)
        return aaData.intelligenceScore
      }

      // No real data available
      return null

    } catch (error) {
      console.error(`Failed to get intelligence score for ${modelId}:`, error)
      return null
    }
  }

  /**
   * Fetch model data from Artificial Analysis by scraping their leaderboard
   */
  private static async fetchFromAA(modelId: string): Promise<AAModelData | null> {
    const cacheKey = `aa:model:${modelId}`

    // Check cache first
    const cached = await cache.get<AAModelData>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Since AA doesn't have a public API, we scrape their leaderboard
      const leaderboardData = await this.scrapeAALeaderboard()
      const modelData = leaderboardData.find(model =>
        model.id === modelId || model.name.toLowerCase().includes(modelId.toLowerCase())
      )

      if (modelData) {
        // Cache for 1 hour
        await cache.set(cacheKey, modelData, this.CACHE_TTL)
        return modelData
      }

      return null

    } catch (error) {
      console.error(`Failed to fetch AA data for ${modelId}:`, error)
      return null
    }
  }

  /**
   * Get model data from our AA proxy API
   */
  private static async scrapeAALeaderboard(): Promise<AAModelData[]> {
    try {
      // Use our server-side proxy for better reliability
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/aa-proxy`, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000) // Longer timeout for server-side scraping
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const models = await response.json()
      console.log(`✅ Retrieved ${models.length} models from AA proxy`)
      return models
    } catch (error) {
      console.error('Failed to fetch AA data from proxy:', error)
      return []
    }
  }

  /**
   * Parse the AA leaderboard HTML to extract model data
   * @deprecated Use scrapeAALeaderboard which calls the proxy API instead
   */
  private static parseAALeaderboard(html: string): AAModelData[] {
    // This method is deprecated - we now use the proxy API
    // which handles HTML parsing on the server side
    console.warn('parseAALeaderboard is deprecated, use proxy API')
    return []
  }

  /**
   * Parse JSON data from AA website
   */
  private static parseAAJSONData(data: any): AAModelData[] {
    const models: AAModelData[] = []

    try {
      const modelList = data.models || data.leaderboard?.models || []

      for (const model of modelList) {
        if (model.name && model.intelligence_score !== undefined) {
          models.push({
            id: this.normalizeModelId(model.name),
            name: model.name,
            provider: model.provider || this.inferProvider(model.name),
            intelligenceScore: parseFloat(model.intelligence_score),
            outputSpeed: parseFloat(model.output_speed || model.speed || 0),
            price: {
              input: parseFloat(model.input_price || model.price?.input || 0),
              output: parseFloat(model.output_price || model.price?.output || 0)
            },
            rank: parseInt(model.rank || 0),
            category: model.category || 'general',
            lastUpdated: new Date()
          })
        }
      }
    } catch (error) {
      console.error('Failed to parse AA JSON data:', error)
    }

    return models
  }

  /**
   * Parse table data from AA HTML as fallback
   */
  private static parseAATableData(html: string): AAModelData[] {
    const models: AAModelData[] = []

    try {
      // Look for table rows containing model data
      const rowMatches = html.matchAll(/<tr[^>]*>.*?<\/tr>/gs)

      for (const match of rowMatches) {
        const row = match[0]

        // Extract model name
        const nameMatch = row.match(/>([^<]*(?:gpt|claude|gemini|llama)[^<]*)</i)
        if (!nameMatch) continue

        const modelName = nameMatch[1].trim()

        // Extract intelligence score (usually a number between 0-100)
        const scoreMatch = row.match(/>(\d+(?:\.\d+)?)<.*?(?:score|intelligence)/i)
        if (!scoreMatch) continue

        const intelligenceScore = parseFloat(scoreMatch[1])

        // Extract speed if available
        const speedMatch = row.match(/>(\d+(?:\.\d+)?)<.*?(?:speed|tokens)/i)
        const outputSpeed = speedMatch ? parseFloat(speedMatch[1]) : 0

        models.push({
          id: this.normalizeModelId(modelName),
          name: modelName,
          provider: this.inferProvider(modelName),
          intelligenceScore,
          outputSpeed,
          price: { input: 0, output: 0 }, // Not available in table scraping
          lastUpdated: new Date()
        })
      }
    } catch (error) {
      console.error('Failed to parse AA table data:', error)
    }

    return models
  }

  /**
   * Normalize model name to consistent ID format
   */
  private static normalizeModelId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[\s-]+/g, '-')
      .replace(/[^a-z0-9.-]/g, '')
      .trim()
  }

  /**
   * Infer provider from model name
   */
  private static inferProvider(name: string): string {
    const nameLower = name.toLowerCase()

    if (nameLower.includes('gpt') || nameLower.includes('openai')) return 'openai'
    if (nameLower.includes('claude') || nameLower.includes('anthropic')) return 'anthropic'
    if (nameLower.includes('gemini') || nameLower.includes('google')) return 'google'
    if (nameLower.includes('llama') || nameLower.includes('meta')) return 'meta'
    if (nameLower.includes('mistral')) return 'mistral'
    if (nameLower.includes('cohere')) return 'cohere'

    return 'unknown'
  }

  /**
   * Get all models from AA leaderboard
   */
  static async getAllModels(): Promise<AAModelData[]> {
    const cacheKey = 'aa:all:models'

    // Check cache first
    const cached = await cache.get<AAModelData[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Scrape the leaderboard for all models
      const models = await this.scrapeAALeaderboard()

      if (models.length > 0) {
        // Cache for 1 hour
        await cache.set(cacheKey, models, this.CACHE_TTL)
        console.log(`✅ Scraped ${models.length} models from AA leaderboard`)
        return models
      }

      console.warn('No models found in AA leaderboard')
      return []

    } catch (error) {
      console.error('Failed to fetch all AA models:', error)
      return []
    }
  }

  /**
   * Update model in database with fresh AA data
   */
  private static async updateModelWithAAData(modelId: string, aaData: AAModelData): Promise<void> {
    try {
      // Get existing metadata
      const existingModel = await prisma.model.findUnique({
        where: { id: modelId },
        select: { metadata: true }
      })

      let existingMetadata = {}
      if (existingModel?.metadata) {
        try {
          existingMetadata = typeof existingModel.metadata === 'string'
            ? JSON.parse(existingModel.metadata)
            : existingModel.metadata
        } catch {
          existingMetadata = {}
        }
      }

      await prisma.model.update({
        where: { id: modelId },
        data: {
          metadata: JSON.stringify({
            ...existingMetadata,
            aa: {
              intelligenceScore: aaData.intelligenceScore,
              outputSpeed: aaData.outputSpeed,
              price: aaData.price,
              rank: aaData.rank,
              category: aaData.category,
              provider: aaData.provider,
              lastUpdated: aaData.lastUpdated.toISOString()
            }
          })
        }
      })
    } catch (error) {
      console.error(`Failed to update model ${modelId} with AA data:`, error)
    }
  }

  /**
   * Sync all models with latest AA data
   */
  static async syncAllModels(): Promise<number> {
    try {
      const aaModels = await this.getAllModels()
      let updatedCount = 0

      for (const aaModel of aaModels) {
        try {
          // Check if model exists in our database
          const existingModel = await prisma.model.findUnique({
            where: { id: aaModel.id }
          })

          if (existingModel) {
            await this.updateModelWithAAData(aaModel.id, aaModel)
            updatedCount++
          } else {
            console.log(`Model ${aaModel.id} from AA not found in our database`)
          }
        } catch (error) {
          console.error(`Failed to sync model ${aaModel.id}:`, error)
        }
      }

      console.log(`Successfully synced ${updatedCount} models with AA data`)
      return updatedCount

    } catch (error) {
      console.error('Failed to sync models with AA:', error)
      return 0
    }
  }

  /**
   * Validate that a model has real AA data (not simulated)
   */
  static async hasRealAAData(modelId: string): Promise<boolean> {
    try {
      const model = await prisma.model.findUnique({
        where: { id: modelId },
        select: { metadata: true }
      })

      if (!model?.metadata) {
        return false
      }

      const metadata = model.metadata as any
      return !!(
        metadata.aa?.intelligenceScore &&
        metadata.aa?.lastUpdated &&
        metadata.aa?.source !== 'simulation' // Ensure it's not marked as simulated
      )

    } catch (error) {
      console.error(`Failed to check AA data for ${modelId}:`, error)
      return false
    }
  }
}