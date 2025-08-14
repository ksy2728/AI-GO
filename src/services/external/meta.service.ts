import Replicate from 'replicate';
import { Model, Pricing, Provider } from '@prisma/client';
import { DataService } from '../data.service';
import { logger } from '@/utils/logger';

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
  private dataService: DataService;
  private providerId = 'meta';

  constructor() {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (apiKey) {
      this.client = new Replicate({
        auth: apiKey,
      });
    }
    
    this.dataService = new DataService();
  }

  /**
   * Get available Meta AI models (Llama series)
   */
  async getModels(): Promise<MetaModel[]> {
    // Meta의 Llama 모델들 정의
    const models: MetaModel[] = [
      {
        id: 'llama-3.1-405b',
        name: 'Llama 3.1 405B Instruct',
        description: 'Largest and most capable Llama model with 128K context',
        version: 'latest',
        context_window: 128000,
        max_tokens: 128000,
        input_cost_per_million: 2.0, // Estimated pricing
        output_cost_per_million: 2.0,
        capabilities: ['text', 'code', 'reasoning', 'multilingual', 'tool-use'],
        replicate_id: 'meta/meta-llama-3.1-405b-instruct',
      },
      {
        id: 'llama-3.1-70b',
        name: 'Llama 3.1 70B Instruct',
        description: 'Large Llama model optimized for complex tasks',
        version: 'latest',
        context_window: 128000,
        max_tokens: 128000,
        input_cost_per_million: 0.5,
        output_cost_per_million: 0.5,
        capabilities: ['text', 'code', 'reasoning', 'multilingual'],
        replicate_id: 'meta/meta-llama-3-70b-instruct',
      },
      {
        id: 'llama-3.1-8b',
        name: 'Llama 3.1 8B Instruct',
        description: 'Efficient model for everyday tasks',
        version: 'latest',
        context_window: 128000,
        max_tokens: 128000,
        input_cost_per_million: 0.05,
        output_cost_per_million: 0.05,
        capabilities: ['text', 'code', 'reasoning'],
        replicate_id: 'meta/meta-llama-3-8b-instruct',
      },
      {
        id: 'llama-3-70b',
        name: 'Llama 3 70B',
        description: 'Previous generation large model',
        version: 'latest',
        context_window: 8192,
        max_tokens: 4096,
        input_cost_per_million: 0.4,
        output_cost_per_million: 0.4,
        capabilities: ['text', 'code', 'reasoning'],
        replicate_id: 'meta/meta-llama-3-70b-instruct',
      },
      {
        id: 'llama-3-8b',
        name: 'Llama 3 8B',
        description: 'Previous generation efficient model',
        version: 'latest',
        context_window: 8192,
        max_tokens: 4096,
        input_cost_per_million: 0.04,
        output_cost_per_million: 0.04,
        capabilities: ['text', 'code'],
        replicate_id: 'meta/meta-llama-3-8b-instruct',
      },
      {
        id: 'llama-2-70b',
        name: 'Llama 2 70B Chat',
        description: 'Legacy model for compatibility',
        version: 'latest',
        context_window: 4096,
        max_tokens: 2048,
        input_cost_per_million: 0.3,
        output_cost_per_million: 0.3,
        capabilities: ['text', 'code'],
        replicate_id: 'meta/llama-2-70b-chat',
      },
      {
        id: 'llama-2-13b',
        name: 'Llama 2 13B Chat',
        description: 'Legacy medium-sized model',
        version: 'latest',
        context_window: 4096,
        max_tokens: 2048,
        input_cost_per_million: 0.1,
        output_cost_per_million: 0.1,
        capabilities: ['text'],
        replicate_id: 'meta/llama-2-13b-chat',
      },
      {
        id: 'llama-2-7b',
        name: 'Llama 2 7B Chat',
        description: 'Legacy small model',
        version: 'latest',
        context_window: 4096,
        max_tokens: 2048,
        input_cost_per_million: 0.05,
        output_cost_per_million: 0.05,
        capabilities: ['text'],
        replicate_id: 'meta/llama-2-7b-chat',
      },
      {
        id: 'code-llama-70b',
        name: 'Code Llama 70B Instruct',
        description: 'Specialized model for code generation',
        version: 'latest',
        context_window: 16384,
        max_tokens: 4096,
        input_cost_per_million: 0.5,
        output_cost_per_million: 0.5,
        capabilities: ['code', 'text'],
        replicate_id: 'meta/codellama-70b-instruct',
      },
      {
        id: 'code-llama-34b',
        name: 'Code Llama 34B',
        description: 'Code generation model',
        version: 'latest',
        context_window: 16384,
        max_tokens: 4096,
        input_cost_per_million: 0.2,
        output_cost_per_million: 0.2,
        capabilities: ['code', 'text'],
        replicate_id: 'meta/codellama-34b-instruct',
      },
    ];

    return models;
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
      const provider = await this.dataService.ensureProvider({
        id: this.providerId,
        name: 'Meta AI',
        description: 'Meta AI with Llama family of open-source models',
        website: 'https://ai.meta.com',
        api_base_url: 'https://replicate.com',
        documentation_url: 'https://ai.meta.com/llama/',
        status: 'active',
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
          await this.dataService.upsertModel({
            model_id: model.id,
            provider_id: this.providerId,
            name: model.name,
            description: model.description || '',
            model_type: 'language',
            context_window: model.context_window,
            max_tokens: model.max_tokens,
            training_cutoff: isLegacy ? new Date('2023-09-01') : new Date('2024-07-01'),
            supports_functions: model.capabilities?.includes('tool-use') || false,
            supports_vision: false, // Llama models are text-only currently
            status: model.isActive ? 'active' : isLegacy ? 'deprecated' : 'inactive',
            api_endpoint: `/v1/predictions`,
            parameters: {
              temperature: { min: 0, max: 2, default: 0.7 },
              top_p: { min: 0, max: 1, default: 0.9 },
              top_k: { min: 1, max: 100, default: 50 },
              max_tokens: { min: 1, max: model.max_tokens, default: 1024 },
            },
            capabilities: model.capabilities || [],
            tags: ['llama', 'meta', 'open-source', 'multilingual'],
          });

          // Sync pricing
          if (model.input_cost_per_million || model.output_cost_per_million) {
            await this.dataService.upsertPricing({
              model_id: model.id,
              provider_id: this.providerId,
              input_price: (model.input_cost_per_million || 0) / 1000,
              output_price: (model.output_cost_per_million || 0) / 1000,
              context_window: model.context_window,
              max_output_tokens: model.max_tokens,
              currency: 'USD',
              unit: '1K tokens',
              region: 'global',
              effective_date: new Date(),
            });
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
      
      return {
        success: true,
        model: modelId,
        response: output,
      };
    } catch (error: any) {
      return {
        success: false,
        model: modelId,
        error: error.message || 'Unknown error',
      };
    }
  }
}