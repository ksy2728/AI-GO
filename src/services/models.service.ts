import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export interface ModelFilters {
  provider?: string
  isActive?: boolean
  limit?: number
  offset?: number
  modalities?: string[]
  capabilities?: string[]
  aaOnly?: boolean  // Filter for only AA (Artificial Analysis) models
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
   * Create or update a model and initialize its status
   */
  static async upsertModel(data: any) {
    try {
      // Create or update the model
      const model = await prisma.model.upsert({
        where: { slug: data.slug },
        update: data,
        create: data,
      })

      // Check if model has a status record
      const existingStatus = await prisma.modelStatus.findFirst({
        where: { modelId: model.id }
      })

      // If no status exists, create one
      if (!existingStatus) {
        await prisma.modelStatus.create({
          data: {
            modelId: model.id,
            status: 'unknown',
            availability: 0,
            latencyP50: 0,
            latencyP95: 0,
            latencyP99: 0,
            errorRate: 0,
            requestsPerMin: 0,
            tokensPerMin: 0,
            usage: 0,
            region: 'global', // Use default region instead of null
            checkedAt: new Date()
          }
        })
        console.log(`✅ Created status record for model: ${model.slug}`)
      }

      return model
    } catch (error) {
      console.error('Error upserting model:', error)
      throw error
    }
  }

  /**
   * Initialize status for all models without status records
   */
  static async initializeAllModelStatus() {
    try {
      // Get all models
      const allModels = await prisma.model.findMany({
        select: { id: true, slug: true }
      })
      
      // Get models with existing status
      const modelsWithStatusGroups = await prisma.modelStatus.groupBy({
        by: ['modelId'],
        _count: true
      })
      const modelsWithStatus = modelsWithStatusGroups.map(g => ({ modelId: g.modelId }))
      
      const modelIdsWithStatus = new Set(modelsWithStatus.map(m => m.modelId))
      const modelsWithoutStatus = allModels.filter(m => !modelIdsWithStatus.has(m.id))
      
      if (modelsWithoutStatus.length === 0) {
        console.log('✅ All models already have status records')
        return { created: 0, total: allModels.length }
      }
      
      // Create status records for models without status
      const statusRecords = modelsWithoutStatus.map(model => ({
        modelId: model.id,
        status: 'unknown' as const,
        availability: 0,
        latencyP50: 0,
        latencyP95: 0,
        latencyP99: 0,
        errorRate: 0,
        requestsPerMin: 0,
        tokensPerMin: 0,
        usage: 0,
        region: 'global', // Use default region instead of null
        checkedAt: new Date()
      }))
      
      const result = await prisma.modelStatus.createMany({
        data: statusRecords,
        skipDuplicates: true
      })
      
      console.log(`✅ Created ${result.count} new status records`)
      return { created: result.count, total: allModels.length }
      
    } catch (error) {
      console.error('Error initializing model status:', error)
      throw error
    }
  }

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
          },
          endpoints: {
            where: { isActive: true },
            orderBy: { priority: 'desc' }
          },
          incidents: {
            orderBy: { startedAt: 'desc' },
            take: 10
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
        providerId: model.provider.id,
        provider: {
          id: model.provider.id,
          name: model.provider.name,
          slug: model.provider.slug,
          websiteUrl: model.provider.websiteUrl,
        },
        foundationModel: model.foundationModel,
        releasedAt: model.releasedAt,
        deprecatedAt: model.deprecatedAt,
        sunsetAt: model.sunsetAt,
        modalities: JSON.parse(model.modalities) as string[],
        capabilities: JSON.parse(model.capabilities) as string[],
        contextWindow: model.contextWindow,
        maxOutputTokens: model.maxOutputTokens,
        trainingCutoff: model.trainingCutoff,
        apiVersion: model.apiVersion,
        isActive: model.isActive,
        metadata: model.metadata,
        status: model.status.map(s => ({
          id: s.id,
          modelId: s.modelId,
          status: s.status,
          availability: s.availability,
          latencyP50: s.latencyP50,
          latencyP95: s.latencyP95,
          latencyP99: s.latencyP99,
          errorRate: s.errorRate,
          requestsPerMin: s.requestsPerMin,
          tokensPerMin: s.tokensPerMin,
          usage: s.usage,
          region: s.region,
          checkedAt: s.checkedAt,
        })),
        benchmarkScores: model.benchmarkScores.map(score => ({
          id: score.id,
          modelId: score.modelId,
          suiteId: score.suiteId,
          scoreRaw: score.scoreRaw,
          scoreNormalized: score.scoreNormalized,
          percentile: score.percentile,
          evaluationDate: score.evaluationDate,
          isOfficial: score.isOfficial,
          suite: {
            id: score.suite.id,
            name: score.suite.name,
            slug: score.suite.slug,
            description: score.suite.description,
            category: score.suite.category,
            maxScore: score.suite.maxScore,
          }
        })),
        pricing: model.pricing.map(p => ({
          id: p.id,
          modelId: p.modelId,
          tier: p.tier,
          region: p.region,
          currency: p.currency,
          inputPerMillion: p.inputPerMillion,
          outputPerMillion: p.outputPerMillion,
          imagePerUnit: p.imagePerUnit,
          audioPerMinute: p.audioPerMinute,
          videoPerMinute: p.videoPerMinute,
          fineTuningPerMillion: p.fineTuningPerMillion,
          effectiveFrom: p.effectiveFrom,
          effectiveTo: p.effectiveTo,
        })),
        endpoints: model.endpoints?.map(e => ({
          id: e.id,
          modelId: e.modelId,
          region: e.region,
          endpointUrl: e.endpointUrl,
          isActive: e.isActive,
          priority: e.priority,
        })) || [],
        incidents: model.incidents?.map(i => ({
          id: i.id,
          modelId: i.modelId,
          providerId: i.providerId,
          regions: JSON.parse(i.regions) as string[],
          severity: i.severity,
          status: i.status,
          title: i.title,
          description: i.description,
          impactDescription: i.impactDescription,
          startedAt: i.startedAt,
          identifiedAt: i.identifiedAt,
          resolvedAt: i.resolvedAt,
          postmortemUrl: i.postmortemUrl,
        })) || [],
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      }))

      // Apply AA filtering if requested
      let finalModels = formattedModels
      if (filters?.aaOnly) {
        finalModels = formattedModels.filter(model => {
          // metadata is always string in Prisma schema, so parse it
          if (typeof model.metadata === 'string') {
            try {
              const parsed = JSON.parse(model.metadata)
              return parsed && parsed.aa
            } catch (e) {
              return false
            }
          }
          return false
        })
        console.log(`📊 AA filtering: ${finalModels.length} AA models from ${formattedModels.length} total models`)
      }

      // Cache results for 5 minutes
      await cache.set(cacheKey, finalModels, 300)
      console.log(`📊 Fetched ${finalModels.length} models from database (AA filter: ${filters?.aaOnly || false})`)
      
      return finalModels
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
          region: statusData.region || 'global', // Default to 'global' if no region
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