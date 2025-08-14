import { GoogleGenerativeAI } from '@google/generative-ai';
import { Model, Pricing, Provider } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export interface GoogleModel {
  id: string;
  name: string;
  description?: string;
  version?: string;
  input_token_limit?: number;
  output_token_limit?: number;
  supported_generation_methods?: string[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  input_cost_per_1k?: number;
  output_cost_per_1k?: number;
  capabilities?: string[];
}

export class GoogleService {
  private client: GoogleGenerativeAI | null = null;
  private providerId = 'google';

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Get available Google AI models
   */
  async getModels(): Promise<GoogleModel[]> {
    // Google doesn't have a public models list API yet, so we define them manually
    // These are the current Gemini models as of 2024
    const models: GoogleModel[] = [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Most capable model for complex reasoning and long context',
        version: '001',
        input_token_limit: 2097152, // 2M tokens
        output_token_limit: 8192,
        supported_generation_methods: ['generateContent', 'streamGenerateContent'],
        temperature: 1.0,
        top_p: 0.95,
        top_k: 64,
        input_cost_per_1k: 0.0035,
        output_cost_per_1k: 0.0105,
        capabilities: ['text', 'code', 'vision', 'function-calling', 'json-mode'],
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient model for high-volume tasks',
        version: '001',
        input_token_limit: 1048576, // 1M tokens
        output_token_limit: 8192,
        supported_generation_methods: ['generateContent', 'streamGenerateContent'],
        temperature: 1.0,
        top_p: 0.95,
        top_k: 64,
        input_cost_per_1k: 0.00035,
        output_cost_per_1k: 0.00105,
        capabilities: ['text', 'code', 'vision', 'function-calling'],
      },
      {
        id: 'gemini-1.5-flash-8b',
        name: 'Gemini 1.5 Flash-8B',
        description: 'Smallest and fastest model for simple tasks',
        version: '001',
        input_token_limit: 1048576, // 1M tokens
        output_token_limit: 8192,
        supported_generation_methods: ['generateContent', 'streamGenerateContent'],
        temperature: 1.0,
        top_p: 0.95,
        top_k: 64,
        input_cost_per_1k: 0.00015,
        output_cost_per_1k: 0.0006,
        capabilities: ['text', 'code', 'vision'],
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Previous generation model for general tasks',
        version: '001',
        input_token_limit: 32768,
        output_token_limit: 8192,
        supported_generation_methods: ['generateContent', 'streamGenerateContent'],
        temperature: 0.9,
        top_p: 1.0,
        top_k: 32,
        input_cost_per_1k: 0.0005,
        output_cost_per_1k: 0.0015,
        capabilities: ['text', 'code'],
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        description: 'Multimodal model for text and image understanding',
        version: '001',
        input_token_limit: 16384,
        output_token_limit: 2048,
        supported_generation_methods: ['generateContent'],
        temperature: 0.4,
        top_p: 1.0,
        top_k: 32,
        input_cost_per_1k: 0.0005,
        output_cost_per_1k: 0.0015,
        capabilities: ['text', 'vision'],
      },
      {
        id: 'gemini-ultra',
        name: 'Gemini Ultra',
        description: 'Most powerful model for highly complex tasks (coming soon)',
        version: '001',
        input_token_limit: 1048576,
        output_token_limit: 8192,
        supported_generation_methods: ['generateContent', 'streamGenerateContent'],
        temperature: 1.0,
        top_p: 0.95,
        top_k: 64,
        input_cost_per_1k: 0.01, // Estimated
        output_cost_per_1k: 0.03, // Estimated
        capabilities: ['text', 'code', 'vision', 'audio', 'video', 'function-calling'],
      },
    ];

    return models;
  }

  /**
   * Check if a model is available by making a test request
   */
  async checkModelStatus(modelId: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('Google AI API key not configured');
      return false;
    }

    try {
      const model = this.client.getGenerativeModel({ model: modelId });
      const result = await model.generateContent('Hi');
      return result.response.text().length > 0;
    } catch (error) {
      logger.error(`Error checking Google model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Get pricing information for Google models
   */
  async getPricing(): Promise<any[]> {
    const models = await this.getModels();
    
    return models.map(model => ({
      model_id: model.id,
      provider_id: this.providerId,
      input_price: model.input_cost_per_1k || 0,
      output_price: model.output_cost_per_1k || 0,
      context_window: model.input_token_limit || 0,
      max_output_tokens: model.output_token_limit || 0,
      currency: 'USD',
      unit: '1K tokens',
      region: 'global',
    }));
  }

  /**
   * Sync Google models with database
   */
  async syncWithDatabase(): Promise<void> {
    try {
      logger.info('Starting Google AI sync...');
      
      // Ensure provider exists
      const provider = await prisma.provider.upsert({
        where: { slug: this.providerId },
        update: {},
        create: {
          slug: this.providerId,
          name: 'Google AI',
          websiteUrl: 'https://ai.google.dev',
          documentationUrl: 'https://ai.google.dev/docs',
          metadata: JSON.stringify({
            description: 'Google AI platform with Gemini models',
            apiBaseUrl: 'https://generativelanguage.googleapis.com',
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
      logger.info(`Found ${modelsWithStatus.length} Google AI models`);

      // Sync models
      for (const model of modelsWithStatus) {
        try {
          // Sync model
          await prisma.model.upsert({
            where: { slug: model.id },
            update: {
              name: model.name,
              description: model.description || '',
              contextWindow: model.input_token_limit || 0,
              maxOutputTokens: model.output_token_limit || 0,
              isActive: model.isActive,
              capabilities: JSON.stringify(model.capabilities || []),
              modalities: JSON.stringify(['text']),
              metadata: JSON.stringify({
                supportsVision: model.capabilities?.includes('vision') || false,
                modelType: 'language',
                status: model.isActive ? 'active' : model.name.includes('coming soon') ? 'upcoming' : 'deprecated'
              })
            },
            create: {
              slug: model.id,
              name: model.name,
              description: model.description || '',
              providerId: provider.id,
              contextWindow: model.input_token_limit || 0,
              maxOutputTokens: model.output_token_limit || 0,
              isActive: model.isActive,
              capabilities: JSON.stringify(model.capabilities || []),
              modalities: JSON.stringify(['text']),
              metadata: JSON.stringify({
                supportsVision: model.capabilities?.includes('vision') || false,
                modelType: 'language',
                status: model.isActive ? 'active' : model.name.includes('coming soon') ? 'upcoming' : 'deprecated'
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

          logger.info(`Synced Google AI model: ${model.name}`);
        } catch (error) {
          logger.error(`Error syncing model ${model.id}:`, error);
        }
      }

      logger.info('Google AI sync completed successfully');
    } catch (error) {
      logger.error('Error during Google AI sync:', error);
      throw error;
    }
  }

  /**
   * Test a message with a specific model
   */
  async testModel(modelId: string, message: string): Promise<any> {
    if (!this.client) {
      return {
        success: false,
        model: modelId,
        error: 'Google AI API key not configured',
      };
    }

    try {
      const model = this.client.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(message);
      const response = result.response;
      
      return {
        success: true,
        model: modelId,
        response: response.text(),
        usage: response.usageMetadata,
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