import { ModelService, ModelFilters } from './models.service'

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

interface StaticAAData {
  models: AAModel[]
  metadata: {
    totalModels: number
    lastScraped: string
    source: string
  }
}

export class HybridModelService {
  private static staticAAData: StaticAAData | null = null
  private static dataLoaded = false

  /**
   * Get static AA data using dynamic import (Vercel-compatible)
   */
  private static async getStaticAAData(): Promise<StaticAAData | null> {
    try {
      // Return cached data if already loaded
      if (this.dataLoaded) {
        return this.staticAAData
      }

      // Dynamic import for Vercel serverless compatibility
      const aaDataModule = await import('../../public/data/aa-models.json')
      const data = aaDataModule.default || aaDataModule

      console.log(`📊 Loaded ${data.models?.length || 0} models from static AA data`)

      this.staticAAData = {
        models: data.models || [],
        metadata: {
          totalModels: data.models?.length || 0,
          lastScraped: data.models?.[0]?.lastUpdated || new Date().toISOString(),
          source: 'static-json'
        }
      }
      this.dataLoaded = true

      return this.staticAAData
    } catch (error) {
      console.error('❌ Error importing static AA data:', error)
      return null
    }
  }

  /**
   * Convert static AA model to standardized format
   */
  private static convertAAModelToStandard(aaModel: AAModel) {
    return {
      id: `aa-${aaModel.slug}`,
      slug: aaModel.slug,
      name: aaModel.name,
      description: `${aaModel.name} - Intelligence: ${aaModel.intelligenceScore}, Speed: ${aaModel.outputSpeed}`,
      providerId: `aa-${aaModel.provider.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      provider: {
        id: `aa-${aaModel.provider.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: aaModel.provider,
        slug: aaModel.provider.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        websiteUrl: null,
      },
      foundationModel: aaModel.name,
      releasedAt: null,
      deprecatedAt: null,
      sunsetAt: null,
      modalities: ['text'],
      capabilities: ['chat', 'completion'],
      contextWindow: aaModel.contextWindow,
      maxOutputTokens: null,
      trainingCutoff: null,
      apiVersion: null,
      isActive: true,
      metadata: JSON.stringify({
        aa: {
          rank: aaModel.rank,
          intelligenceScore: aaModel.intelligenceScore,
          outputSpeed: aaModel.outputSpeed,
          inputPrice: aaModel.inputPrice,
          outputPrice: aaModel.outputPrice,
          category: aaModel.category,
          trend: aaModel.trend,
          lastUpdated: aaModel.lastUpdated
        },
        source: aaModel.metadata.source,
        scrapedAt: aaModel.metadata.scrapedAt,
        scrapingMethod: aaModel.metadata.scrapingMethod
      }),
      status: [{
        id: `status-${aaModel.slug}`,
        modelId: `aa-${aaModel.slug}`,
        status: 'unknown' as const,
        availability: 95, // Default assumption for AA models
        latencyP50: 0,
        latencyP95: 0,
        latencyP99: 0,
        errorRate: 0,
        requestsPerMin: 0,
        tokensPerMin: 0,
        usage: 0,
        region: 'global', // Default region for AA models
        checkedAt: new Date(aaModel.lastUpdated),
      }],
      benchmarkScores: [],
      pricing: aaModel.inputPrice && aaModel.outputPrice ? [{
        id: `pricing-${aaModel.slug}`,
        modelId: `aa-${aaModel.slug}`,
        tier: 'standard',
        region: 'global',
        currency: 'USD',
        inputPerMillion: aaModel.inputPrice * 1000, // Convert to per million
        outputPerMillion: aaModel.outputPrice * 1000,
        imagePerUnit: null,
        audioPerMinute: null,
        videoPerMinute: null,
        fineTuningPerMillion: null,
        effectiveFrom: new Date(aaModel.lastUpdated),
        effectiveTo: null,
      }] : [],
      endpoints: [],
      incidents: [],
      createdAt: new Date(aaModel.lastUpdated),
      updatedAt: new Date(aaModel.lastUpdated),
    }
  }

  /**
   * Get all models with hybrid approach (static AA data + database models)
   */
  static async getAll(filters?: ModelFilters) {
    console.log('🔄 Hybrid model service: getAll called', { filters })

    // For AA-only requests, prioritize static data
    if (filters?.aaOnly) {
      console.log('🎯 AA-only request detected, using static data first')

      const staticData = await this.getStaticAAData()
      if (staticData && staticData.models.length > 0) {
        console.log(`✅ Using static AA data: ${staticData.models.length} models`)

        let aaModels = staticData.models.map(model => this.convertAAModelToStandard(model))

        // Apply additional filters
        if (filters.provider) {
          aaModels = aaModels.filter(model =>
            model.provider.name.toLowerCase().includes(filters.provider!.toLowerCase()) ||
            model.provider.slug.includes(filters.provider!.toLowerCase())
          )
        }

        // Apply limit and offset
        const offset = filters.offset || 0
        const limit = filters.limit || 50
        aaModels = aaModels.slice(offset, offset + limit)

        console.log(`📊 Returning ${aaModels.length} AA models from static data`)
        return aaModels
      }

      console.log('⚠️ Static AA data not available, falling back to database')
    }

    // Try database first for non-AA or fallback scenarios
    try {
      console.log('🔄 Attempting database query...')
      const dbModels = await ModelService.getAll(filters)

      // If AA-only but no AA models found in DB, try static fallback
      if (filters?.aaOnly && (!dbModels || dbModels.length === 0)) {
        console.log('⚠️ No AA models in database, trying static fallback')
        const staticData = await this.getStaticAAData()
        if (staticData && staticData.models.length > 0) {
          const aaModels = staticData.models.map(model => this.convertAAModelToStandard(model))
          console.log(`✅ Fallback: Using static AA data: ${aaModels.length} models`)
          return aaModels
        }
      }

      console.log(`✅ Database query successful: ${dbModels?.length || 0} models`)
      return dbModels
    } catch (error) {
      console.error('❌ Database query failed:', error)

      // Fallback to static data for any request type
      console.log('🔄 Falling back to static data...')
      const staticData = await this.getStaticAAData()
      if (staticData && staticData.models.length > 0) {
        let aaModels = staticData.models.map(model => this.convertAAModelToStandard(model))

        // Apply filters for fallback
        if (filters?.provider) {
          aaModels = aaModels.filter(model =>
            model.provider.name.toLowerCase().includes(filters.provider!.toLowerCase())
          )
        }

        if (filters?.aaOnly !== false) {
          // For non-specific requests, still show AA models as fallback
          const offset = filters?.offset || 0
          const limit = filters?.limit || 50
          aaModels = aaModels.slice(offset, offset + limit)

          console.log(`✅ Fallback successful: ${aaModels.length} models from static data`)
          return aaModels
        }
      }

      console.error('❌ All data sources failed')
      throw error
    }
  }

  /**
   * Get model by slug with hybrid approach
   */
  static async getBySlug(slug: string) {
    console.log(`🔄 Hybrid model service: getBySlug called for ${slug}`)

    try {
      // Try database first
      const dbModel = await ModelService.getBySlug(slug)
      if (dbModel) {
        console.log(`✅ Found model in database: ${slug}`)
        return dbModel
      }
    } catch (error) {
      console.error('❌ Database query failed for getBySlug:', error)
    }

    // Fallback to static data
    console.log('🔄 Checking static AA data for model...')
    const staticData = await this.getStaticAAData()
    if (staticData) {
      const aaModel = staticData.models.find(model => model.slug === slug)
      if (aaModel) {
        console.log(`✅ Found model in static data: ${slug}`)
        return this.convertAAModelToStandard(aaModel)
      }
    }

    console.log(`❌ Model not found: ${slug}`)
    return null
  }

  /**
   * Get providers summary with hybrid approach
   */
  static async getProvidersSummary() {
    try {
      return await ModelService.getProvidersSummary()
    } catch (error) {
      console.error('❌ Database providers summary failed:', error)

      // Fallback to static data analysis
      const staticData = await this.getStaticAAData()
      if (staticData) {
        const providerCounts = staticData.models.reduce((acc, model) => {
          const provider = model.provider
          if (!acc[provider]) {
            acc[provider] = {
              name: provider,
              slug: provider.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              totalModels: 0,
              operationalModels: 0,
              avgAvailability: 95
            }
          }
          acc[provider].totalModels++
          acc[provider].operationalModels++
          return acc
        }, {} as Record<string, any>)

        return Object.values(providerCounts)
      }

      throw error
    }
  }

  /**
   * Search models with hybrid approach
   */
  static async search(query: string, filters?: ModelFilters) {
    try {
      return await ModelService.search(query, filters)
    } catch (error) {
      console.error('❌ Database search failed:', error)

      // Fallback to static data search
      const staticData = await this.getStaticAAData()
      if (staticData) {
        const queryLower = query.toLowerCase()
        const matchingModels = staticData.models.filter(model =>
          model.name.toLowerCase().includes(queryLower) ||
          model.provider.toLowerCase().includes(queryLower) ||
          model.slug.toLowerCase().includes(queryLower)
        )

        return matchingModels.map(model => ({
          id: `aa-${model.slug}`,
          slug: model.slug,
          name: model.name,
          description: `${model.name} - Intelligence: ${model.intelligenceScore}`,
          provider: {
            name: model.provider,
            slug: model.provider.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          },
          status: {
            status: 'unknown' as const,
            availability: 95,
          }
        }))
      }

      throw error
    }
  }
}