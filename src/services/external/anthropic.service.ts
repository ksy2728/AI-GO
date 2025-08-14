import Anthropic from '@anthropic-ai/sdk';
import { Model, Pricing, Provider } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export interface AnthropicModel {
  id: string;
  name: string;
  description?: string;
  context_window: number;
  max_output_tokens?: number;
  input_cost_per_1k?: number;
  output_cost_per_1k?: number;
  created_at?: string;
  capabilities?: string[];
}

export class AnthropicService {
  private client: Anthropic;
  private providerId = 'anthropic';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    
    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Get available Claude models
   */
  async getModels(): Promise<AnthropicModel[]> {
    // Anthropic doesn't have a models list API, so we define them manually
    // These are the current Claude models as of 2024
    const models: AnthropicModel[] = [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most capable model for highly complex tasks',
        context_window: 200000,
        max_output_tokens: 4096,
        input_cost_per_1k: 0.015,
        output_cost_per_1k: 0.075,
        capabilities: ['chat', 'analysis', 'coding', 'creative-writing', 'vision'],
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed',
        context_window: 200000,
        max_output_tokens: 4096,
        input_cost_per_1k: 0.003,
        output_cost_per_1k: 0.015,
        capabilities: ['chat', 'analysis', 'coding', 'vision'],
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fastest and most compact model',
        context_window: 200000,
        max_output_tokens: 4096,
        input_cost_per_1k: 0.00025,
        output_cost_per_1k: 0.00125,
        capabilities: ['chat', 'analysis', 'coding', 'vision'],
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Latest and most capable Sonnet model',
        context_window: 200000,
        max_output_tokens: 8192,
        input_cost_per_1k: 0.003,
        output_cost_per_1k: 0.015,
        capabilities: ['chat', 'analysis', 'coding', 'vision', 'computer-use'],
      },
      {
        id: 'claude-2.1',
        name: 'Claude 2.1',
        description: 'Previous generation model',
        context_window: 200000,
        max_output_tokens: 4096,
        input_cost_per_1k: 0.008,
        output_cost_per_1k: 0.024,
        capabilities: ['chat', 'analysis', 'coding'],
      },
      {
        id: 'claude-2.0',
        name: 'Claude 2.0',
        description: 'Legacy model',
        context_window: 100000,
        max_output_tokens: 4096,
        input_cost_per_1k: 0.008,
        output_cost_per_1k: 0.024,
        capabilities: ['chat', 'analysis', 'coding'],
      },
      {
        id: 'claude-instant-1.2',
        name: 'Claude Instant 1.2',
        description: 'Legacy fast model',
        context_window: 100000,
        max_output_tokens: 4096,
        input_cost_per_1k: 0.0008,
        output_cost_per_1k: 0.0024,
        capabilities: ['chat', 'analysis'],
      },
    ];

    return models;
  }

  /**
   * Check if a model is available by making a test request
   */
  async checkModelStatus(modelId: string): Promise<boolean> {
    try {
      // Make a minimal test request to check if the model is accessible
      const response = await this.client.messages.create({
        model: modelId,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      
      return response.id !== undefined;
    } catch (error) {
      logger.error(`Error checking Anthropic model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Get pricing information for Anthropic models
   */
  async getPricing(): Promise<any[]> {
    const models = await this.getModels();
    
    return models.map(model => ({
      model_id: model.id,
      provider_id: this.providerId,
      input_price: model.input_cost_per_1k || 0,
      output_price: model.output_cost_per_1k || 0,
      context_window: model.context_window,
      max_output_tokens: model.max_output_tokens || 4096,
      currency: 'USD',
      unit: '1K tokens',
      region: 'global',
    }));
  }

  /**
   * Sync Anthropic models with database
   */
  async syncWithDatabase(): Promise<void> {
    try {
      logger.info('Starting Anthropic sync...');
      
      // Ensure provider exists
      const provider = await prisma.provider.upsert({
        where: { slug: this.providerId },
        update: {},
        create: {
          slug: this.providerId,
          name: 'Anthropic',
          websiteUrl: 'https://www.anthropic.com',
          documentationUrl: 'https://docs.anthropic.com',
          metadata: JSON.stringify({
            description: 'Creator of Claude AI models',
            apiBaseUrl: 'https://api.anthropic.com',
            status: 'active'
          })
        }
      });

      const models = await this.getModels();
      const modelStatusPromises = models.map(async (model) => {
        // API 검증을 시도하되, 실패해도 계속 진행
        let isActive = false;
        try {
          isActive = await this.checkModelStatus(model.id);
        } catch (error) {
          logger.info(`Model ${model.id} validation failed, marking as inactive`);
        }
        return { ...model, isActive };
      });
      
      const modelsWithStatus = await Promise.all(modelStatusPromises);
      logger.info(`Found ${modelsWithStatus.length} Anthropic models`);

      // Sync models
      for (const model of modelsWithStatus) {
        try {
          // API 검증 실패해도 모델 정보는 저장 (status만 다르게)
          await prisma.model.upsert({
            where: { slug: model.id },
            update: {
              name: model.name,
              description: model.description || '',
              contextWindow: model.context_window,
              maxOutputTokens: model.max_output_tokens || 4096,
              isActive: model.isActive,
              capabilities: JSON.stringify(model.capabilities || []),
              modalities: JSON.stringify(['text']),
              metadata: JSON.stringify({
                supportsVision: model.capabilities?.includes('vision') || false,
                modelType: 'language',
                status: model.isActive ? 'active' : 'deprecated'
              })
            },
            create: {
              slug: model.id,
              name: model.name,
              description: model.description || '',
              providerId: provider.id,
              contextWindow: model.context_window,
              maxOutputTokens: model.max_output_tokens || 4096,
              isActive: model.isActive,
              capabilities: JSON.stringify(model.capabilities || []),
              modalities: JSON.stringify(['text']),
              metadata: JSON.stringify({
                supportsVision: model.capabilities?.includes('vision') || false,
                modelType: 'language',
                status: model.isActive ? 'active' : 'deprecated'
              })
            }
          });

          // Sync pricing
          if (model.input_cost_per_1k || model.output_cost_per_1k) {
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
                    inputPerMillion: (model.input_cost_per_1k || 0) * 1000,
                    outputPerMillion: (model.output_cost_per_1k || 0) * 1000,
                  }
                });
              } else {
                await prisma.pricing.create({
                  data: {
                    modelId: modelRecord.id,
                    tier: 'standard',
                    region: 'global',
                    currency: 'USD',
                    inputPerMillion: (model.input_cost_per_1k || 0) * 1000,
                    outputPerMillion: (model.output_cost_per_1k || 0) * 1000,
                    effectiveFrom: new Date(),
                  }
                });
              }
            }
          }

          logger.info(`Synced Anthropic model: ${model.name}`);
        } catch (error) {
          logger.error(`Error syncing model ${model.id}:`, error);
        }
      }

      logger.info('Anthropic sync completed successfully');
    } catch (error) {
      logger.error('Error during Anthropic sync:', error);
      throw error;
    }
  }

  /**
   * Test a message with a specific model
   */
  async testModel(modelId: string, message: string): Promise<any> {
    try {
      const response = await this.client.messages.create({
        model: modelId,
        max_tokens: 1024,
        messages: [{ role: 'user', content: message }],
      });
      
      return {
        success: true,
        model: modelId,
        response: response.content[0],
        usage: response.usage,
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