import { GoogleGenerativeAI } from '@google/generative-ai';
import { Model, Pricing, Provider } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { cache } from '@/lib/redis';
import { RealTimeMonitor } from '../real-time-monitor.service';
import * as fs from 'fs';
import * as path from 'path';

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
  dataSource?: string; // Track where the data came from: 'api' | 'config' | 'scraped'
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
   * Get available Google AI models from live API
   */
  async getModels(): Promise<GoogleModel[]> {
    const cacheKey = 'google:models:list'
    const cached = await cache.get<GoogleModel[]>(cacheKey)
    if (cached) {
      console.log('📦 Google models cache hit')
      return cached
    }

    try {
      // Try to get models from Google AI API
      const apiModels = await this.fetchModelsFromAPI()
      if (apiModels.length > 0) {
        // Cache for 6 hours
        await cache.set(cacheKey, apiModels, 21600)
        console.log(`✅ Fetched ${apiModels.length} models from Google AI API`)
        return apiModels
      }
    } catch (error) {
      console.error('Failed to fetch Google AI models from API:', error)
      // Return empty array instead of fallback
      return []
    }

    // No fallback - only real API data
    return []
  }

  /**
   * Fetch models from Google AI API
   */
  private async fetchModelsFromAPI(): Promise<GoogleModel[]> {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('Google AI API key not configured')
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AI-Server-Info/1.0'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Google AI API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const models: GoogleModel[] = []

    for (const model of data.models || []) {
      // Only include generative models
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        const modelInfo = this.parseModelInfo(model)
        if (modelInfo) {
          models.push(modelInfo)
        }
      }
    }

    return models
  }

  /**
   * Parse model information from API response
   */
  private parseModelInfo(apiModel: any): GoogleModel | null {
    try {
      const modelId = apiModel.name.replace('models/', '')

      // Try to load defaults from config file if API doesn't provide pricing
      let pricing = { input: 0, output: 0 }
      let dataSource = 'api'

      try {
        const configPath = path.join(process.cwd(), 'config', 'model-defaults.json')
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
          if (config.google?.models?.[modelId]) {
            pricing = {
              input: config.google.models[modelId].inputPrice || 0,
              output: config.google.models[modelId].outputPrice || 0
            }
            dataSource = 'config'
          }
        }
      } catch (err) {
        console.warn('Could not load model defaults:', err)
      }

      return {
        id: modelId,
        name: apiModel.displayName || this.formatModelName(modelId),
        description: apiModel.description || '',
        version: apiModel.version || '001',
        input_token_limit: apiModel.inputTokenLimit || 32768,
        output_token_limit: apiModel.outputTokenLimit || 8192,
        supported_generation_methods: apiModel.supportedGenerationMethods || [],
        temperature: apiModel.temperature || 1.0,
        top_p: apiModel.topP || 0.95,
        top_k: apiModel.topK || 64,
        input_cost_per_1k: pricing.input,
        output_cost_per_1k: pricing.output,
        capabilities: this.inferCapabilities(modelId, apiModel),
        dataSource // Track where the data came from
      }
    } catch (error) {
      console.error('Failed to parse model info:', error)
      return null
    }
  }


  /**
   * Format model name from ID
   */
  private formatModelName(modelId: string): string {
    return modelId
      .replace(/gemini-/g, 'Gemini ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  /**
   * Infer model capabilities from ID and API data
   */
  private inferCapabilities(modelId: string, apiModel: any): string[] {
    const capabilities = ['text', 'code']

    if (modelId.includes('vision') || apiModel.description?.includes('vision')) {
      capabilities.push('vision')
    }

    if (modelId.includes('1.5')) {
      capabilities.push('function-calling')
      if (modelId.includes('pro')) {
        capabilities.push('json-mode')
      }
    }

    return capabilities
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

      // Record this check as a minimal API call
      RealTimeMonitor.recordApiCall(modelId, this.providerId, 2); // Minimal tokens for status check

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
              dataSource: model.dataSource || 'unknown', // Track data origin
              lastVerified: new Date(), // Update verification timestamp
              metadata: JSON.stringify({
                supportsVision: model.capabilities?.includes('vision') || false,
                modelType: 'language',
                status: model.isActive ? 'active' : model.name.includes('coming soon') ? 'upcoming' : 'deprecated',
                dataSource: model.dataSource // Also store in metadata for backwards compatibility
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
              dataSource: model.dataSource || 'unknown', // Track data origin
              lastVerified: new Date(), // Set initial verification timestamp
              metadata: JSON.stringify({
                supportsVision: model.capabilities?.includes('vision') || false,
                modelType: 'language',
                status: model.isActive ? 'active' : model.name.includes('coming soon') ? 'upcoming' : 'deprecated',
                dataSource: model.dataSource // Also store in metadata for backwards compatibility
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

      // Record API call for real metrics
      const metadata = response.usageMetadata;
      const tokensUsed = (metadata?.promptTokenCount || 0) + (metadata?.candidatesTokenCount || 0);
      RealTimeMonitor.recordApiCall(modelId, this.providerId, tokensUsed);

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