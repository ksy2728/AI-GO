import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export interface ModelFilters {
  provider?: string
  isActive?: boolean
  limit?: number
  offset?: number
  modalities?: string[]
  capabilities?: string[]
}

export interface ModelStatusData {
  status: 'operational' | 'degraded' | 'outage'
  availability: number
  latencyP50: number
  latencyP95: number
  latencyP99: number
  errorRate: number
  requestsPerMin?: number
  tokensPerMin?: number
  usage?: number
  region?: string
}

export class ModelService {
  /**
   * Get all models with optional filters
   */
  static async getAll(filters?: ModelFilters) {
    const cacheKey = `models:${JSON.stringify(filters || {})}`
    
    // Check cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      console.log('📦 Models cache hit')
      return cached
    }

    try {
      // Query database
      const models = await prisma.model.findMany({
        where: {
          isActive: filters?.isActive !== undefined ? filters.isActive : true,
          provider: filters?.provider ? {
            OR: [
              { slug: filters.provider },
              { id: filters.provider },
              { name: filters.provider }
            ]
          } : undefined,
        },
        include: {
          provider: true,
          status: {
            take: 1,
            orderBy: { checkedAt: 'desc' }
          },
          benchmarkScores: {
            include: {
              suite: true
            },
            orderBy: { evaluationDate: 'desc' },
            take: 5
          },
          pricing: {
            where: {
              effectiveTo: null // Only current pricing
            },
            orderBy: { effectiveFrom: 'desc' },
            take: 1
          }
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: [
          { provider: { name: 'asc' } },
          { name: 'asc' }
        ]
      })

      // Process and format data
      const formattedModels = models.map(model => ({
        id: model.id,
        slug: model.slug,
        name: model.name,
        description: model.description,
        provider: {
          id: model.provider.id,
          name: model.provider.name,
          slug: model.provider.slug,
          websiteUrl: model.provider.websiteUrl,
        },
        foundationModel: model.foundationModel,
        releasedAt: model.releasedAt,
        modalities: JSON.parse(model.modalities) as string[],
        capabilities: JSON.parse(model.capabilities) as string[],
        contextWindow: model.contextWindow,
        maxOutputTokens: model.maxOutputTokens,
        trainingCutoff: model.trainingCutoff,
        apiVersion: model.apiVersion,
        isActive: model.isActive,
        status: model.status[0] ? {
          status: model.status[0].status,
          availability: model.status[0].availability,
          latencyP50: model.status[0].latencyP50,
          latencyP95: model.status[0].latencyP95,
          latencyP99: model.status[0].latencyP99,
          errorRate: model.status[0].errorRate,
          requestsPerMin: model.status[0].requestsPerMin,
          tokensPerMin: model.status[0].tokensPerMin,
          usage: model.status[0].usage,
          checkedAt: model.status[0].checkedAt,
        } : null,
        benchmarks: model.benchmarkScores.map(score => ({
          suite: score.suite.name,
          suiteSlug: score.suite.slug,
          score: score.scoreRaw,
          normalizedScore: score.scoreNormalized,
          percentile: score.percentile,
          evaluationDate: score.evaluationDate,
          isOfficial: score.isOfficial,
        })),
        pricing: model.pricing[0] ? {
          tier: model.pricing[0].tier,
          currency: model.pricing[0].currency,
          inputPerMillion: model.pricing[0].inputPerMillion,
          outputPerMillion: model.pricing[0].outputPerMillion,
          imagePerUnit: model.pricing[0].imagePerUnit,
          audioPerMinute: model.pricing[0].audioPerMinute,
          videoPerMinute: model.pricing[0].videoPerMinute,
          effectiveFrom: model.pricing[0].effectiveFrom,
        } : null,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      }))

      // Cache results for 5 minutes
      await cache.set(cacheKey, formattedModels, 300)
      console.log(`📊 Fetched ${formattedModels.length} models from database`)
      
      return formattedModels
    } catch (error) {
      console.error('❌ Error fetching models:', error)
      throw new Error('Failed to fetch models')
    }
  }

  /**
   * Get model by slug
   */
  static async getBySlug(slug: string) {
    const cacheKey = `model:${slug}`
    
    // Check cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      console.log('📦 Model cache hit')
      return cached
    }

    try {
      const model = await prisma.model.findUnique({
        where: { slug },
        include: {
          provider: true,
          status: {
            orderBy: { checkedAt: 'desc' },
            take: 24 // Last 24 status checks
          },
          benchmarkScores: {
            include: {
              suite: true
            },
            orderBy: { evaluationDate: 'desc' }
          },
          pricing: {
            orderBy: { effectiveFrom: 'desc' }
          },
          endpoints: {
            where: { isActive: true },
            orderBy: { priority: 'asc' }
          }
        }
      })

      if (!model) {
        return null
      }

      const formattedModel = {
        id: model.id,
        slug: model.slug,
        name: model.name,
        description: model.description,
        provider: {
          id: model.provider.id,
          name: model.provider.name,
          slug: model.provider.slug,
          websiteUrl: model.provider.websiteUrl,
          documentationUrl: model.provider.documentationUrl,
          regions: JSON.parse(model.provider.regions) as string[],
        },
        foundationModel: model.foundationModel,
        releasedAt: model.releasedAt,
        modalities: JSON.parse(model.modalities) as string[],
        capabilities: JSON.parse(model.capabilities) as string[],
        contextWindow: model.contextWindow,
        maxOutputTokens: model.maxOutputTokens,
        trainingCutoff: model.trainingCutoff,
        apiVersion: model.apiVersion,
        isActive: model.isActive,
        statusHistory: model.status.map(status => ({
          status: status.status,
          availability: status.availability,
          latencyP50: status.latencyP50,
          latencyP95: status.latencyP95,
          latencyP99: status.latencyP99,
          errorRate: status.errorRate,
          requestsPerMin: status.requestsPerMin,
          tokensPerMin: status.tokensPerMin,
          usage: status.usage,
          region: status.region,
          checkedAt: status.checkedAt,
        })),
        benchmarks: model.benchmarkScores.map(score => ({
          suite: {
            name: score.suite.name,
            slug: score.suite.slug,
            category: score.suite.category,
            maxScore: score.suite.maxScore,
            scoringMethod: score.suite.scoringMethod,
          },
          scoreRaw: score.scoreRaw,
          scoreNormalized: score.scoreNormalized,
          percentile: score.percentile,
          evaluationDate: score.evaluationDate,
          isOfficial: score.isOfficial,
          notes: score.notes,
        })),
        pricing: model.pricing.map(price => ({
          tier: price.tier,
          region: price.region,
          currency: price.currency,
          inputPerMillion: price.inputPerMillion,
          outputPerMillion: price.outputPerMillion,
          imagePerUnit: price.imagePerUnit,
          audioPerMinute: price.audioPerMinute,
          videoPerMinute: price.videoPerMinute,
          fineTuningPerMillion: price.fineTuningPerMillion,
          effectiveFrom: price.effectiveFrom,
          effectiveTo: price.effectiveTo,
        })),
        endpoints: model.endpoints.map(endpoint => ({
          region: endpoint.region,
          endpointUrl: endpoint.endpointUrl,
          priority: endpoint.priority,
        })),
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      }

      // Cache for 10 minutes
      await cache.set(cacheKey, formattedModel, 600)
      
      return formattedModel
    } catch (error) {
      console.error('❌ Error fetching model:', error)
      throw new Error('Failed to fetch model')
    }
  }

  /**
   * Update model status
   */
  static async updateStatus(modelId: string, statusData: ModelStatusData) {
    try {
      const result = await prisma.modelStatus.create({
        data: {
          modelId,
          status: statusData.status,
          availability: statusData.availability,
          latencyP50: statusData.latencyP50,
          latencyP95: statusData.latencyP95,
          latencyP99: statusData.latencyP99,
          errorRate: statusData.errorRate,
          requestsPerMin: statusData.requestsPerMin || 0,
          tokensPerMin: statusData.tokensPerMin || 0,
          usage: statusData.usage || 0,
          region: statusData.region,
          checkedAt: new Date(),
        },
      })

      // Invalidate related caches
      await cache.invalidate('models:*')
      await cache.invalidate(`model:*`)
      await cache.invalidate('status:*')

      console.log(`📊 Updated status for model ${modelId}`)
      return result
    } catch (error) {
      console.error('❌ Error updating model status:', error)
      throw new Error('Failed to update model status')
    }
  }

  /**
   * Get providers summary
   */
  static async getProvidersSummary() {
    const cacheKey = 'providers:summary'
    
    // Check cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      console.log('📦 Providers summary cache hit')
      return cached
    }

    try {
      const providers = await prisma.provider.findMany({
        include: {
          models: {
            where: { isActive: true },
            include: {
              status: {
                take: 1,
                orderBy: { checkedAt: 'desc' }
              }
            }
          }
        }
      })

      const summary = providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        websiteUrl: provider.websiteUrl,
        totalModels: provider.models.length,
        operationalModels: provider.models.filter(model => 
          model.status[0]?.status === 'operational'
        ).length,
        avgAvailability: provider.models.reduce((sum, model) => 
          sum + (model.status[0]?.availability || 0), 0
        ) / Math.max(provider.models.length, 1),
      }))

      // Cache for 5 minutes
      await cache.set(cacheKey, summary, 300)
      
      return summary
    } catch (error) {
      console.error('❌ Error fetching providers summary:', error)
      throw new Error('Failed to fetch providers summary')
    }
  }

  /**
   * Search models
   */
  static async search(query: string, filters?: ModelFilters) {
    if (!query || query.length < 2) {
      throw new Error('Query must be at least 2 characters')
    }

    const cacheKey = `search:${query}:${JSON.stringify(filters || {})}`
    
    // Check cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      console.log('📦 Search cache hit')
      return cached
    }

    try {
      const models = await prisma.model.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } },
                { foundationModel: { contains: query } },
                { provider: { name: { contains: query } } }
              ]
            },
            {
              isActive: filters?.isActive !== undefined ? filters.isActive : true,
            },
            filters?.provider ? {
              provider: { slug: filters.provider }
            } : {},
          ]
        },
        include: {
          provider: true,
          status: {
            take: 1,
            orderBy: { checkedAt: 'desc' }
          }
        },
        take: filters?.limit || 20,
        orderBy: [
          { name: 'asc' }
        ]
      })

      const results = models.map(model => ({
        id: model.id,
        slug: model.slug,
        name: model.name,
        description: model.description,
        provider: {
          name: model.provider.name,
          slug: model.provider.slug,
        },
        status: model.status[0] ? {
          status: model.status[0].status,
          availability: model.status[0].availability,
        } : null,
      }))

      // Cache for 5 minutes
      await cache.set(cacheKey, results, 300)
      
      return results
    } catch (error) {
      console.error('❌ Error searching models:', error)
      throw new Error('Failed to search models')
    }
  }
}