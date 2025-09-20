import Anthropic from '@anthropic-ai/sdk';
import { Model, Pricing, Provider } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { cache } from '@/lib/redis';
import { RealTimeMonitor } from '../real-time-monitor.service';
import * as fs from 'fs';
import * as path from 'path';

export interface AnthropicModel {
  id: string;
  name: string;
  description?: string;
  context_window?: number;
  max_output_tokens?: number;
  input_cost_per_1k?: number;
  output_cost_per_1k?: number;
  created_at?: string;
  capabilities?: string[];
  dataSource?: string; // Track where the data came from: 'api' | 'config' | 'scraped'
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
   * Get available Claude models (scraped from docs + current models)
   */
  async getModels(): Promise<AnthropicModel[]> {
    const cacheKey = 'anthropic:models:list'
    const cached = await cache.get<AnthropicModel[]>(cacheKey)
    if (cached) {
      console.log('📦 Anthropic models cache hit')
      return cached
    }

    try {
      // Try to scrape latest model info from Anthropic docs
      const scrapedModels = await this.scrapeModelsFromDocs()
      if (scrapedModels.length > 0) {
        // Cache for 24 hours
        await cache.set(cacheKey, scrapedModels, 86400)
        console.log(`✅ Scraped ${scrapedModels.length} models from Anthropic docs`)
        return scrapedModels
      }
    } catch (error) {
      console.error('Failed to scrape Anthropic models:', error)
      // Return empty array instead of fallback
      return []
    }

    // No fallback - only real scraped data
    return []
  }

  /**
   * Scrape model information from Anthropic documentation
   */
  private async scrapeModelsFromDocs(): Promise<AnthropicModel[]> {
    try {
      const response = await fetch('https://docs.anthropic.com/claude/docs/models-overview', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-Server-Info/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      return this.parseModelsFromHTML(html)
    } catch (error) {
      console.error('Failed to scrape Anthropic docs:', error)
      return []
    }
  }

  /**
   * Parse model information from HTML
   */
  private parseModelsFromHTML(html: string): AnthropicModel[] {
    const models: AnthropicModel[] = []

    try {
      // Extract model information using regex patterns
      // In production, you'd use a proper HTML parser like cheerio

      // Look for model table or sections
      const modelMatches = html.matchAll(/claude-[\w\.-]+/gi)
      const uniqueModelIds = [...new Set(Array.from(modelMatches, m => m[0]))]

      for (const modelId of uniqueModelIds) {
        // Try to get basic model info from scraped data
        const modelInfo = this.getBasicModelInfo(modelId)
        if (modelInfo) {
          models.push({
            ...modelInfo,
            id: modelId, // Ensure id is set
            name: modelInfo.name || modelId, // Ensure name is set
            dataSource: 'scraped'
          })
        }
      }

      // If we found models, return them
      if (models.length > 0) {
        return models
      }
    } catch (error) {
      console.error('Failed to parse Anthropic HTML:', error)
    }

    return []
  }

  /**
   * Get basic model information - prioritize scraped data, fallback to config
   */
  private getBasicModelInfo(modelId: string): Partial<AnthropicModel> | null {
    // Try to load from config file if scraping doesn't provide full info
    try {
      const configPath = path.join(process.cwd(), 'config', 'model-defaults.json')
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        const modelConfig = config.anthropic?.models?.[modelId]

        if (modelConfig) {
          return {
            id: modelId,
            name: modelConfig.name || this.formatModelName(modelId),
            description: modelConfig.description || '',
            context_window: modelConfig.contextWindow || 200000,
            max_output_tokens: modelConfig.maxOutputTokens || 4096,
            input_cost_per_1k: modelConfig.inputPrice || 0,
            output_cost_per_1k: modelConfig.outputPrice || 0,
            capabilities: modelConfig.capabilities || [],
            created_at: new Date().toISOString(),
            dataSource: 'config'
          }
        }
      }
    } catch (err) {
      console.warn('Could not load model defaults:', err)
    }

    // If no config, return minimal info
    return {
      id: modelId,
      name: this.formatModelName(modelId),
      context_window: 200000, // Default assumption
      created_at: new Date().toISOString(),
      dataSource: 'unknown'
    }
  }

  /**
   * Format model name from ID
   */
  private formatModelName(modelId: string): string {
    return modelId
      .replace(/claude-/g, 'Claude ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
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

      // Record this check as a minimal API call
      RealTimeMonitor.recordApiCall(modelId, this.providerId, 2); // Minimal tokens for status check

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
              dataSource: model.dataSource || 'unknown', // Track data origin
              lastVerified: new Date(), // Update verification timestamp
              metadata: JSON.stringify({
                supportsVision: model.capabilities?.includes('vision') || false,
                modelType: 'language',
                status: model.isActive ? 'active' : 'deprecated',
                dataSource: model.dataSource // Also store in metadata for backwards compatibility
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
              dataSource: model.dataSource || 'unknown', // Track data origin
              lastVerified: new Date(), // Set initial verification timestamp
              metadata: JSON.stringify({
                supportsVision: model.capabilities?.includes('vision') || false,
                modelType: 'language',
                status: model.isActive ? 'active' : 'deprecated',
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

      // Record API call for real metrics
      const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
      RealTimeMonitor.recordApiCall(modelId, this.providerId, tokensUsed);

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

// Export singleton instance
export const anthropicService = new AnthropicService();