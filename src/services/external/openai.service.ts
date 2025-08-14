import { OpenAI } from 'openai'
import axios from 'axios'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export interface OpenAIModelStatus {
  id: string
  status: 'operational' | 'degraded' | 'outage'
  availability: number
  responseTime: number
  errorRate: number
  lastChecked: Date
}

export interface OpenAIPricing {
  model: string
  inputPricePerMillion: number
  outputPricePerMillion: number
  imagePricePerUnit?: number
  currency: string
  lastUpdated: Date
}

export class OpenAIService {
  private client: OpenAI | null = null
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.openai.com/v1'
  private readonly statusUrl = 'https://status.openai.com/api/v2'
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
    if (this.apiKey) {
      const config: any = {
        apiKey: this.apiKey,
      }
      
      // Allow browser environment in tests
      if (process.env.NODE_ENV === 'test') {
        config.dangerouslyAllowBrowser = true
      }
      
      this.client = new OpenAI(config)
      console.log('✅ OpenAI client initialized')
    } else {
      console.warn('⚠️ OpenAI API key not configured')
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.client
  }

  /**
   * Get list of available models
   */
  async getAvailableModels() {
    if (!this.isConfigured()) {
      throw new Error('OpenAI service not configured')
    }

    const cacheKey = 'openai:models:list'
    const cached = await cache.get(cacheKey)
    if (cached) {
      console.log('📦 OpenAI models cache hit')
      return cached
    }

    try {
      const models = await this.client!.models.list()
      const modelList = models.data.map(model => ({
        id: model.id,
        created: new Date(model.created * 1000),
        ownedBy: model.owned_by,
      }))

      // Cache for 1 hour
      await cache.set(cacheKey, modelList, 3600)
      return modelList
    } catch (error) {
      console.error('❌ Error fetching OpenAI models:', error)
      throw new Error('Failed to fetch OpenAI models')
    }
  }

  /**
   * Check model status and availability
   */
  async checkModelStatus(modelId: string): Promise<OpenAIModelStatus> {
    const cacheKey = `openai:status:${modelId}`
    const cached = await cache.get<OpenAIModelStatus>(cacheKey)
    if (cached) {
      console.log(`📦 OpenAI status cache hit for ${modelId}`)
      return cached
    }

    try {
      // Test the model with a simple completion request
      const startTime = Date.now()
      let status: 'operational' | 'degraded' | 'outage' = 'operational'
      let errorRate = 0
      let responseTime = 0

      if (this.isConfigured()) {
        try {
          // Test with a minimal completion
          await this.client!.completions.create({
            model: modelId,
            prompt: 'Test',
            max_tokens: 1,
            temperature: 0,
          })
          responseTime = Date.now() - startTime
          
          // Determine status based on response time
          if (responseTime > 5000) {
            status = 'degraded'
          }
        } catch (error: any) {
          if (error.status === 404) {
            // Model not found - might be a chat model
            try {
              await this.client!.chat.completions.create({
                model: modelId,
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 1,
                temperature: 0,
              })
              responseTime = Date.now() - startTime
              
              if (responseTime > 5000) {
                status = 'degraded'
              }
            } catch (chatError: any) {
              status = 'outage'
              errorRate = 100
              console.error(`Model ${modelId} test failed:`, chatError.message)
            }
          } else {
            status = 'outage'
            errorRate = 100
            console.error(`Model ${modelId} test failed:`, error.message)
          }
        }
      } else {
        // If not configured, return mock status
        status = 'operational'
        responseTime = Math.random() * 500 + 200
      }

      const modelStatus: OpenAIModelStatus = {
        id: modelId,
        status,
        availability: status === 'operational' ? 99.9 : status === 'degraded' ? 95.0 : 0,
        responseTime: responseTime || 0,
        errorRate,
        lastChecked: new Date(),
      }

      // Cache for 5 minutes
      await cache.set(cacheKey, modelStatus, 300)
      return modelStatus
    } catch (error) {
      console.error(`❌ Error checking status for ${modelId}:`, error)
      throw new Error(`Failed to check status for model ${modelId}`)
    }
  }

  /**
   * Get current pricing information
   */
  async getPricing(): Promise<OpenAIPricing[]> {
    const cacheKey = 'openai:pricing'
    const cached = await cache.get<OpenAIPricing[]>(cacheKey)
    if (cached) {
      console.log('📦 OpenAI pricing cache hit')
      return cached
    }

    // OpenAI pricing as of 2024 (these would ideally come from an API)
    const pricing: OpenAIPricing[] = [
      {
        model: 'gpt-4-turbo',
        inputPricePerMillion: 10.0,
        outputPricePerMillion: 30.0,
        imagePricePerUnit: 0.00085,
        currency: 'USD',
        lastUpdated: new Date(),
      },
      {
        model: 'gpt-4',
        inputPricePerMillion: 30.0,
        outputPricePerMillion: 60.0,
        currency: 'USD',
        lastUpdated: new Date(),
      },
      {
        model: 'gpt-3.5-turbo',
        inputPricePerMillion: 0.5,
        outputPricePerMillion: 1.5,
        currency: 'USD',
        lastUpdated: new Date(),
      },
      {
        model: 'gpt-3.5-turbo-16k',
        inputPricePerMillion: 3.0,
        outputPricePerMillion: 4.0,
        currency: 'USD',
        lastUpdated: new Date(),
      },
      {
        model: 'text-embedding-3-large',
        inputPricePerMillion: 0.13,
        outputPricePerMillion: 0,
        currency: 'USD',
        lastUpdated: new Date(),
      },
      {
        model: 'text-embedding-3-small',
        inputPricePerMillion: 0.02,
        outputPricePerMillion: 0,
        currency: 'USD',
        lastUpdated: new Date(),
      },
      {
        model: 'dall-e-3',
        inputPricePerMillion: 0,
        outputPricePerMillion: 0,
        imagePricePerUnit: 0.04, // Standard quality 1024x1024
        currency: 'USD',
        lastUpdated: new Date(),
      },
      {
        model: 'dall-e-2',
        inputPricePerMillion: 0,
        outputPricePerMillion: 0,
        imagePricePerUnit: 0.02, // 1024x1024
        currency: 'USD',
        lastUpdated: new Date(),
      },
    ]

    // Cache for 24 hours
    await cache.set(cacheKey, pricing, 86400)
    return pricing
  }

  /**
   * Get models formatted for API sync
   */
  async getModels() {
    if (!this.isConfigured()) {
      console.warn('⚠️ OpenAI service not configured, returning hardcoded models');
      return this.getHardcodedModels();
    }

    try {
      const models = await this.getAvailableModels();
      
      // Filter to include only chat completion models
      const chatModels = models.filter(model => 
        model.id.includes('gpt-') && 
        !model.id.includes('instruct') && 
        !model.id.includes('embedding')
      );

      return chatModels.map(model => ({
        id: model.id,
        name: this.formatModelName(model.id),
        ownedBy: model.ownedBy,
        created: model.created,
      }));
    } catch (error) {
      console.warn('⚠️ Failed to fetch OpenAI models, using hardcoded list');
      return this.getHardcodedModels();
    }
  }

  /**
   * Get hardcoded OpenAI models when API is not available
   */
  private getHardcodedModels() {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', ownedBy: 'system', created: new Date('2024-05-13') },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', ownedBy: 'system', created: new Date('2024-07-18') },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', ownedBy: 'system', created: new Date('2024-04-09') },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', ownedBy: 'system', created: new Date('2023-03-01') },
      { id: 'o1-preview', name: 'o1-preview', ownedBy: 'system', created: new Date('2024-09-12') },
      { id: 'o1-mini', name: 'o1-mini', ownedBy: 'system', created: new Date('2024-09-12') },
    ];
  }

  /**
   * Format model name from ID
   */
  private formatModelName(id: string): string {
    return id
      .replace(/gpt-/g, 'GPT-')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Sync model data with database
   */
  async syncWithDatabase() {
    try {
      console.log('🔄 Starting OpenAI data sync...')
      
      // Get provider
      let provider = await prisma.provider.findUnique({
        where: { slug: 'openai' }
      })

      if (!provider) {
        provider = await prisma.provider.create({
          data: {
            slug: 'openai',
            name: 'OpenAI',
            websiteUrl: 'https://openai.com',
            documentationUrl: 'https://platform.openai.com/docs',
            regions: JSON.stringify(['us-east', 'us-west', 'eu-west']),
            metadata: JSON.stringify({
              founded: '2015',
              headquarters: 'San Francisco, CA',
            }),
          }
        })
        console.log('✅ Created OpenAI provider')
      }

      // Get pricing data
      const pricingData = await this.getPricing()

      // Update models and pricing
      const modelSlugs = ['gpt-4-turbo', 'gpt-4', 'gpt-35-turbo', 'gpt-35-turbo-16k']
      
      for (const slug of modelSlugs) {
        // Check model status
        const modelId = slug.replace('35', '3.5').replace('-16k', '-16k')
        const status = await this.checkModelStatus(modelId).catch(() => null)
        
        // Find or create model
        let model = await prisma.model.findUnique({
          where: { slug }
        })

        if (!model) {
          const modelData = this.getModelMetadata(slug)
          model = await prisma.model.create({
            data: {
              slug,
              providerId: provider.id,
              name: modelData.name,
              description: modelData.description,
              foundationModel: modelData.foundationModel,
              releasedAt: modelData.releasedAt,
              modalities: JSON.stringify(modelData.modalities),
              capabilities: JSON.stringify(modelData.capabilities),
              contextWindow: modelData.contextWindow,
              maxOutputTokens: modelData.maxOutputTokens,
              trainingCutoff: modelData.trainingCutoff,
              apiVersion: 'v1',
              isActive: true,
              metadata: JSON.stringify({}),
            }
          })
          console.log(`✅ Created model: ${slug}`)
        }

        // Update model status
        if (status) {
          await prisma.modelStatus.create({
            data: {
              modelId: model.id,
              status: status.status,
              availability: status.availability,
              latencyP50: status.responseTime,
              latencyP95: status.responseTime * 1.5,
              latencyP99: status.responseTime * 2,
              errorRate: status.errorRate,
              requestsPerMin: 0,
              tokensPerMin: 0,
              usage: 0,
              region: 'us-east',
              checkedAt: new Date(),
            }
          })
          console.log(`📊 Updated status for ${slug}: ${status.status}`)
        }

        // Update pricing
        const pricing = pricingData.find(p => p.model === modelId)
        if (pricing) {
          // Check if pricing exists
          const existingPricing = await prisma.pricing.findFirst({
            where: {
              modelId: model.id,
              effectiveTo: null,
            }
          })

          if (existingPricing) {
            // Update existing pricing
            await prisma.pricing.update({
              where: { id: existingPricing.id },
              data: {
                inputPerMillion: pricing.inputPricePerMillion,
                outputPerMillion: pricing.outputPricePerMillion,
                imagePerUnit: pricing.imagePricePerUnit,
              }
            })
          } else {
            // Create new pricing
            await prisma.pricing.create({
              data: {
                modelId: model.id,
                tier: 'standard',
                currency: pricing.currency,
                inputPerMillion: pricing.inputPricePerMillion,
                outputPerMillion: pricing.outputPricePerMillion,
                imagePerUnit: pricing.imagePricePerUnit,
                effectiveFrom: new Date(),
              }
            })
          }
          console.log(`💰 Updated pricing for ${slug}`)
        }
      }

      // Invalidate relevant caches
      await cache.invalidate('models:*')
      await cache.invalidate('providers:*')
      await cache.invalidate('status:*')

      console.log('✅ OpenAI data sync completed')
      return { success: true, modelsUpdated: modelSlugs.length }
    } catch (error) {
      console.error('❌ Error syncing OpenAI data:', error)
      throw new Error('Failed to sync OpenAI data')
    }
  }

  /**
   * Get model metadata
   */
  private getModelMetadata(slug: string) {
    const metadata: Record<string, any> = {
      'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        description: 'Latest GPT-4 model with improved performance and lower costs',
        foundationModel: 'GPT-4',
        releasedAt: new Date('2024-04-09'),
        modalities: ['text', 'image'],
        capabilities: ['chat', 'completion', 'coding', 'analysis', 'reasoning'],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2024-04-01'),
      },
      'gpt-4': {
        name: 'GPT-4',
        description: 'Advanced language model with strong reasoning capabilities',
        foundationModel: 'GPT-4',
        releasedAt: new Date('2023-03-14'),
        modalities: ['text'],
        capabilities: ['chat', 'completion', 'coding', 'analysis', 'reasoning'],
        contextWindow: 8192,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2021-09-01'),
      },
      'gpt-35-turbo': {
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective model for simple tasks',
        foundationModel: 'GPT-3.5',
        releasedAt: new Date('2022-11-30'),
        modalities: ['text'],
        capabilities: ['chat', 'completion', 'coding'],
        contextWindow: 16385,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2021-09-01'),
      },
      'gpt-35-turbo-16k': {
        name: 'GPT-3.5 Turbo 16K',
        description: 'Extended context version of GPT-3.5 Turbo',
        foundationModel: 'GPT-3.5',
        releasedAt: new Date('2023-06-13'),
        modalities: ['text'],
        capabilities: ['chat', 'completion', 'coding'],
        contextWindow: 16384,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2021-09-01'),
      },
    }

    return metadata[slug] || metadata['gpt-35-turbo']
  }
}

// Export singleton instance only if not in test environment
export const openAIService = process.env.NODE_ENV === 'test' ? null : new OpenAIService()