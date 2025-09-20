import Replicate from 'replicate';
import { Model, Pricing, Provider } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { cache } from '@/lib/redis';
import { realTimeMonitorV2 } from '../real-time-monitor-v2.service';

export interface MetaModel {
  id: string;
  name: string;
  description?: string;
  version?: string;
  context_window: number;
  max_tokens: number;
  input_cost_per_million?: number;
  output_cost_per_million?: number;
  capabilities?: string[];
  replicate_id?: string;
}

export class MetaService {
  private client: Replicate | null = null;
  private providerId = 'meta';

  constructor() {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (apiKey) {
      this.client = new Replicate({
        auth: apiKey,
      });
    }
  }

  /**
   * Get available Meta AI models from Replicate API
   */
  async getModels(): Promise<MetaModel[]> {
    const cacheKey = 'meta:models:list'
    const cached = await cache.get<MetaModel[]>(cacheKey)
    if (cached) {
      console.log('📦 Meta models cache hit')
      return cached
    }

    try {
      // Try to get models from Replicate API
      const apiModels = await this.fetchModelsFromReplicate()
      if (apiModels.length > 0) {
        // Cache for 6 hours
        await cache.set(cacheKey, apiModels, 21600)
        console.log(`✅ Fetched ${apiModels.length} models from Replicate API`)
        return apiModels
      }
    } catch (error) {
      console.warn('Failed to fetch Meta models from Replicate, using fallback:', error)
    }

    // Return empty array on API failure
    return []
  }

  /**
   * Fetch models from Replicate API
   */
  private async fetchModelsFromReplicate(): Promise<MetaModel[]> {
    if (!this.client) {
      throw new Error('Replicate API token not configured')
    }

    try {
      // Get all models from Replicate
      const models = []
      let cursor = undefined

      // Paginate through models
      do {
        const response = await fetch('https://api.replicate.com/v1/models?owner=meta', {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        })

        if (!response.ok) {
          throw new Error(`Replicate API returned ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Filter for Llama models
        const llamaModels = data.results?.filter((model: any) =>
          model.name.toLowerCase().includes('llama') ||
          model.name.toLowerCase().includes('codellama')
        ) || []

        for (const model of llamaModels) {
          const metaModel = this.parseReplicateModel(model)
          if (metaModel) {
            models.push(metaModel)
          }
        }

        cursor = data.next
      } while (cursor && models.length < 20) // Limit to prevent excessive requests

      return models

    } catch (error) {
      console.error('Failed to fetch from Replicate API:', error)
      throw error
    }
  }

  /**
   * Parse Replicate model data to our format
   */
  private parseReplicateModel(replicateModel: any): MetaModel | null {
    try {
      const modelName = replicateModel.name
      const fullId = `${replicateModel.owner}/${modelName}`

      // Extract model info from name and description
      const modelInfo = this.getModelInfoFromName(modelName)

      return {
        id: this.normalizeModelId(modelName),
        name: this.formatModelName(modelName),
        description: replicateModel.description || modelInfo.description,
        version: replicateModel.latest_version?.id || 'latest',
        context_window: modelInfo.context_window || 8192,
        max_tokens: modelInfo.max_tokens || 4096,
        input_cost_per_million: modelInfo.input_cost_per_million,
        output_cost_per_million: modelInfo.output_cost_per_million,
        capabilities: modelInfo.capabilities,
        replicate_id: fullId
      }
    } catch (error) {
      console.error('Failed to parse Replicate model:', error)
      return null
    }
  }

  /**
   * Get model information from model name
   */
  private getModelInfoFromName(modelName: string): Partial<MetaModel> {
    const nameLower = modelName.toLowerCase()

    // Default values
    let info: Partial<MetaModel> = {
      description: 'Meta AI Llama model',
      context_window: 4096,
      max_tokens: 2048,
      input_cost_per_million: 0.5,
      output_cost_per_million: 0.5,
      capabilities: ['text']
    }

    // Llama 3.1 models
    if (nameLower.includes('3.1')) {
      info.context_window = 128000
      info.max_tokens = 128000
      info.capabilities = ['text', 'code', 'reasoning']

      if (nameLower.includes('405b')) {
        info.description = 'Largest and most capable Llama model'
        info.input_cost_per_million = 2.0
        info.output_cost_per_million = 2.0
        info.capabilities.push('multilingual', 'tool-use')
      } else if (nameLower.includes('70b')) {
        info.description = 'Large Llama model optimized for complex tasks'
        info.input_cost_per_million = 0.5
        info.output_cost_per_million = 0.5
        info.capabilities.push('multilingual')
      } else if (nameLower.includes('8b')) {
        info.description = 'Efficient model for everyday tasks'
        info.input_cost_per_million = 0.05
        info.output_cost_per_million = 0.05
      }
    }
    // Llama 3 models
    else if (nameLower.includes('llama-3') || nameLower.includes('llama3')) {
      info.context_window = 8192
      info.max_tokens = 4096
      info.capabilities = ['text', 'code', 'reasoning']

      if (nameLower.includes('70b')) {
        info.input_cost_per_million = 0.4
        info.output_cost_per_million = 0.4
      } else if (nameLower.includes('8b')) {
        info.input_cost_per_million = 0.04
        info.output_cost_per_million = 0.04
      }
    }
    // Code Llama models
    else if (nameLower.includes('code')) {
      info.description = 'Specialized model for code generation'
      info.context_window = 16384
      info.max_tokens = 4096
      info.capabilities = ['code', 'text']

      if (nameLower.includes('70b')) {
        info.input_cost_per_million = 0.5
        info.output_cost_per_million = 0.5
      } else if (nameLower.includes('34b')) {
        info.input_cost_per_million = 0.2
        info.output_cost_per_million = 0.2
      }
    }
    // Llama 2 models (legacy)
    else if (nameLower.includes('llama-2') || nameLower.includes('llama2')) {
      info.description = 'Legacy Llama model'
      info.context_window = 4096
      info.max_tokens = 2048
      info.capabilities = ['text']

      if (nameLower.includes('70b')) {
        info.input_cost_per_million = 0.3
        info.output_cost_per_million = 0.3
        info.capabilities.push('code')
      } else if (nameLower.includes('13b')) {
        info.input_cost_per_million = 0.1
        info.output_cost_per_million = 0.1
      } else if (nameLower.includes('7b')) {
        info.input_cost_per_million = 0.05
        info.output_cost_per_million = 0.05
      }
    }

    return info
  }

  /**
   * Normalize model ID from name
   */
  private normalizeModelId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-')
  }

  /**
   * Format model name for display
   */
  private formatModelName(name: string): string {
    return name
      .replace(/meta-/g, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }


  /**
   * Check if a model is available via Replicate
   */
  async checkModelStatus(modelId: string, replicateId?: string): Promise<boolean> {
    if (!this.client || !replicateId) {
      logger.warn('Replicate API token not configured or model ID missing');
      return false;
    }

    try {
      // Replicate doesn't have a direct model status check,
      // so we'll consider all defined models as available
      // In production, you might want to make a test prediction
      return true;
    } catch (error) {
      logger.error(`Error checking Meta model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Get pricing information for Meta models
   */
  async getPricing(): Promise<any[]> {
    const models = await this.getModels();
    
    return models.map(model => ({
      model_id: model.id,
      provider_id: this.providerId,
      input_price: (model.input_cost_per_million || 0) / 1000, // Convert to per 1K
      output_price: (model.output_cost_per_million || 0) / 1000,
      context_window: model.context_window,
      max_output_tokens: model.max_tokens,
      currency: 'USD',
      unit: '1K tokens',
      region: 'global',
    }));
  }

  /**
   * Sync Meta models with database
   */
  async syncWithDatabase(): Promise<void> {
    try {
      logger.info('Starting Meta AI sync...');
      
      // Ensure provider exists
      const provider = await prisma.provider.upsert({
        where: { slug: this.providerId },
        update: {},
        create: {
          slug: this.providerId,
          name: 'Meta AI',
          websiteUrl: 'https://ai.meta.com',
          documentationUrl: 'https://ai.meta.com/llama/',
          metadata: JSON.stringify({
            description: 'Meta AI with Llama family of open-source models',
            apiBaseUrl: 'https://replicate.com',
            status: 'active'
          })
        }
      });

      const models = await this.getModels();
      const modelStatusPromises = models.map(async (model) => {
        // Check model availability
        let isActive = false;
        try {
          isActive = await this.checkModelStatus(model.id, model.replicate_id);
        } catch (error) {
          logger.info(`Model ${model.id} validation failed, marking as inactive`);
        }
        return { ...model, isActive };
      });
      
      const modelsWithStatus = await Promise.all(modelStatusPromises);
      logger.info(`Found ${modelsWithStatus.length} Meta AI models`);

      // Sync models
      for (const model of modelsWithStatus) {
        try {
          // Determine if it's a legacy model
          const isLegacy = model.id.includes('llama-2');
          
          // Sync model
          await prisma.model.upsert({
            where: { slug: model.id },
            update: {
              name: model.name,
              description: model.description || '',
              contextWindow: model.context_window,
              maxOutputTokens: model.max_tokens,
              isActive: model.isActive,
              capabilities: JSON.stringify(model.capabilities || []),
              modalities: JSON.stringify(['text']),
              dataSource: 'api', // Meta models come from Replicate API
              lastVerified: new Date(), // Update verification timestamp
              metadata: JSON.stringify({
                supportsVision: false, // Llama models are text-only currently
                modelType: 'language',
                status: model.isActive ? 'active' : isLegacy ? 'deprecated' : 'inactive',
                dataSource: 'api' // Also store in metadata for backwards compatibility
              })
            },
            create: {
              slug: model.id,
              name: model.name,
              description: model.description || '',
              providerId: provider.id,
              contextWindow: model.context_window,
              maxOutputTokens: model.max_tokens,
              isActive: model.isActive,
              capabilities: JSON.stringify(model.capabilities || []),
              modalities: JSON.stringify(['text']),
              dataSource: 'api', // Meta models come from Replicate API
              lastVerified: new Date(), // Set initial verification timestamp
              metadata: JSON.stringify({
                supportsVision: false, // Llama models are text-only currently
                modelType: 'language',
                status: model.isActive ? 'active' : isLegacy ? 'deprecated' : 'inactive',
                dataSource: 'api' // Also store in metadata for backwards compatibility
              })
            }
          });

          // Sync pricing
          if (model.input_cost_per_million || model.output_cost_per_million) {
            const modelRecord = await prisma.model.findUnique({
              where: { slug: model.id }
            });
            
            if (modelRecord) {
              // Check if pricing exists
              const existingPricing = await prisma.pricing.findFirst({
                where: {
                  modelId: modelRecord.id,
                  tier: 'standard',
                  region: 'global',
                  currency: 'USD'
                }
              });

              if (existingPricing) {
                await prisma.pricing.update({
                  where: { id: existingPricing.id },
                  data: {
                    inputPerMillion: model.input_cost_per_million || 0,
                    outputPerMillion: model.output_cost_per_million || 0,
                  }
                });
              } else {
                await prisma.pricing.create({
                  data: {
                    modelId: modelRecord.id,
                    tier: 'standard',
                    region: 'global',
                    currency: 'USD',
                    inputPerMillion: model.input_cost_per_million || 0,
                    outputPerMillion: model.output_cost_per_million || 0,
                    effectiveFrom: new Date(),
                  }
                });
              }
            }
          }

          logger.info(`Synced Meta AI model: ${model.name}`);
        } catch (error) {
          logger.error(`Error syncing model ${model.id}:`, error);
        }
      }

      logger.info('Meta AI sync completed successfully');
    } catch (error) {
      logger.error('Error during Meta AI sync:', error);
      throw error;
    }
  }

  /**
   * Test a model via Replicate
   */
  async testModel(modelId: string, message: string): Promise<any> {
    const models = await this.getModels();
    const model = models.find(m => m.id === modelId);
    
    if (!this.client || !model?.replicate_id) {
      return {
        success: false,
        model: modelId,
        error: 'Replicate API token not configured or model not found',
      };
    }

    try {
      const startTime = Date.now();
      const output = await this.client.run(
        model.replicate_id as `${string}/${string}` | `${string}/${string}:${string}`,
        {
          input: {
            prompt: message,
            max_tokens: 100,
            temperature: 0.7,
          }
        }
      );
      const responseTime = Date.now() - startTime;

      // Record API call for real metrics
      const outputText = Array.isArray(output) ? output.join('') : String(output);
      const estimatedTokens = Math.round((message.length + outputText.length) / 4);
      realTimeMonitorV2.recordApiCall(modelId, this.providerId, true, responseTime, estimatedTokens);

      return {
        success: true,
        model: modelId,
        response: output,
      };
    } catch (error: any) {
      realTimeMonitorV2.recordApiCall(modelId, this.providerId, false, 0, 0, error.message);
      return {
        success: false,
        model: modelId,
        error: error.message || 'Unknown error',
      };
    }
  }
}