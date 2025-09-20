import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';
import { logger } from '@/utils/logger';
import { OpenAIPricingScraper } from './scrapers/openai-pricing-scraper.service';
import { AnthropicDocsScraper } from './scrapers/anthropic-docs-scraper.service';
import { GoogleService } from './external/google.service';
import { MetaService } from './external/meta.service';
import { openAIService } from './external/openai.service';
import { anthropicService } from './external/anthropic.service';
import { RealTimeMonitor } from './real-time-monitor.service';

export interface DataChangeEvent {
  provider: string;
  modelId: string;
  changeType: 'new' | 'updated' | 'removed';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: Date;
  confidence: number;
}

export interface AggregatedData {
  provider: string;
  models: any[];
  pricing: any[];
  source: 'api' | 'scraped' | 'config' | 'mixed';
  confidence: number;
  lastUpdated: Date;
  changes: DataChangeEvent[];
}

export class DataAggregatorService {
  private openaiScraper: OpenAIPricingScraper;
  private anthropicScraper: AnthropicDocsScraper;
  private googleService: GoogleService;
  private metaService: MetaService;
  private changeHistory: DataChangeEvent[] = [];
  private readonly CHANGE_THRESHOLD = 0.1; // 10% price change threshold

  constructor() {
    this.openaiScraper = new OpenAIPricingScraper();
    this.anthropicScraper = new AnthropicDocsScraper();
    this.googleService = new GoogleService();
    this.metaService = new MetaService();
  }

  /**
   * Aggregate data from all sources
   */
  async aggregateAllData(): Promise<AggregatedData[]> {
    logger.info('Starting comprehensive data aggregation...');
    const results: AggregatedData[] = [];

    try {
      // 1. OpenAI Data
      const openaiData = await this.aggregateOpenAIData();
      if (openaiData) results.push(openaiData);

      // 2. Anthropic Data
      const anthropicData = await this.aggregateAnthropicData();
      if (anthropicData) results.push(anthropicData);

      // 3. Google Data
      const googleData = await this.aggregateGoogleData();
      if (googleData) results.push(googleData);

      // 4. Meta Data
      const metaData = await this.aggregateMetaData();
      if (metaData) results.push(metaData);

      // 5. Validate and merge changes
      await this.validateAndMergeChanges(results);

      // 6. Update database
      await this.updateDatabase(results);

      // 7. Notify changes
      await this.notifyChanges(this.changeHistory);

      logger.info(`Data aggregation completed. ${results.length} providers processed.`);
      return results;
    } catch (error) {
      logger.error('Data aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Aggregate OpenAI data from multiple sources
   */
  private async aggregateOpenAIData(): Promise<AggregatedData | null> {
    try {
      const cacheKey = 'aggregated:openai';
      const cached = await cache.get<AggregatedData>(cacheKey);

      // Use cache if less than 1 hour old
      if (cached && new Date(cached.lastUpdated).getTime() > Date.now() - 3600000) {
        logger.info('Using cached OpenAI aggregated data');
        return cached;
      }

      const aggregated: AggregatedData = {
        provider: 'openai',
        models: [],
        pricing: [],
        source: 'mixed',
        confidence: 0,
        lastUpdated: new Date(),
        changes: []
      };

      // Try API first
      let apiModels: any[] = [];
      if (openAIService?.isConfigured()) {
        try {
          apiModels = await openAIService.getModels();
          if (apiModels.length > 0) {
            aggregated.models = apiModels;
            aggregated.source = 'api';
            aggregated.confidence = 0.95;
          }
        } catch (error) {
          logger.warn('OpenAI API failed, falling back to scraper:', error);
        }
      }

      // Try scraper for pricing
      try {
        const scrapedPricing = await this.openaiScraper.scrapePricing();
        if (scrapedPricing.length > 0) {
          aggregated.pricing = scrapedPricing;
          if (aggregated.source === 'api') {
            aggregated.source = 'mixed';
            aggregated.confidence = 0.9;
          } else {
            aggregated.source = 'scraped';
            aggregated.confidence = 0.8;
          }
        }
      } catch (error) {
        logger.warn('OpenAI scraper failed:', error);
      }

      // Detect changes
      const previousData = await this.getPreviousData('openai');
      aggregated.changes = await this.detectChanges(previousData, aggregated);

      // Cache the result
      await cache.set(cacheKey, aggregated, 3600);

      return aggregated.models.length > 0 || aggregated.pricing.length > 0 ? aggregated : null;
    } catch (error) {
      logger.error('Failed to aggregate OpenAI data:', error);
      return null;
    }
  }

  /**
   * Aggregate Anthropic data from multiple sources
   */
  private async aggregateAnthropicData(): Promise<AggregatedData | null> {
    try {
      const cacheKey = 'aggregated:anthropic';
      const cached = await cache.get<AggregatedData>(cacheKey);

      if (cached && new Date(cached.lastUpdated).getTime() > Date.now() - 3600000) {
        logger.info('Using cached Anthropic aggregated data');
        return cached;
      }

      const aggregated: AggregatedData = {
        provider: 'anthropic',
        models: [],
        pricing: [],
        source: 'mixed',
        confidence: 0,
        lastUpdated: new Date(),
        changes: []
      };

      // Try API first
      if (anthropicService) {
        try {
          const apiModels = await anthropicService.getModels();
          if (apiModels.length > 0) {
            aggregated.models = apiModels;
            aggregated.source = 'api';
            aggregated.confidence = 0.95;
          }
        } catch (error) {
          logger.warn('Anthropic API failed:', error);
        }
      }

      // Try scraper
      try {
        const scrapedModels = await this.anthropicScraper.scrapeModels();
        if (scrapedModels.length > 0) {
          // Merge or use scraped data
          if (aggregated.models.length === 0) {
            aggregated.models = scrapedModels;
            aggregated.source = 'scraped';
            aggregated.confidence = 0.85;
          } else {
            // Merge pricing from scraped data
            aggregated.pricing = scrapedModels.map(m => ({
              modelId: m.modelId,
              inputPrice: m.inputPrice,
              outputPrice: m.outputPrice,
              confidence: m.confidence
            }));
            aggregated.source = 'mixed';
          }
        }
      } catch (error) {
        logger.warn('Anthropic scraper failed:', error);
      }

      // Detect changes
      const previousData = await this.getPreviousData('anthropic');
      aggregated.changes = await this.detectChanges(previousData, aggregated);

      await cache.set(cacheKey, aggregated, 3600);

      return aggregated.models.length > 0 ? aggregated : null;
    } catch (error) {
      logger.error('Failed to aggregate Anthropic data:', error);
      return null;
    }
  }

  /**
   * Aggregate Google data from API
   */
  private async aggregateGoogleData(): Promise<AggregatedData | null> {
    try {
      const cacheKey = 'aggregated:google';
      const cached = await cache.get<AggregatedData>(cacheKey);

      if (cached && new Date(cached.lastUpdated).getTime() > Date.now() - 3600000) {
        return cached;
      }

      const aggregated: AggregatedData = {
        provider: 'google',
        models: [],
        pricing: [],
        source: 'api',
        confidence: 0,
        lastUpdated: new Date(),
        changes: []
      };

      // Google only has API
      try {
        const models = await this.googleService.getModels();
        aggregated.models = models;
        aggregated.confidence = models.length > 0 ? 0.95 : 0;
      } catch (error) {
        logger.warn('Google API failed:', error);
      }

      // Detect changes
      const previousData = await this.getPreviousData('google');
      aggregated.changes = await this.detectChanges(previousData, aggregated);

      await cache.set(cacheKey, aggregated, 3600);

      return aggregated.models.length > 0 ? aggregated : null;
    } catch (error) {
      logger.error('Failed to aggregate Google data:', error);
      return null;
    }
  }

  /**
   * Aggregate Meta data from Replicate API
   */
  private async aggregateMetaData(): Promise<AggregatedData | null> {
    try {
      const cacheKey = 'aggregated:meta';
      const cached = await cache.get<AggregatedData>(cacheKey);

      if (cached && new Date(cached.lastUpdated).getTime() > Date.now() - 3600000) {
        return cached;
      }

      const aggregated: AggregatedData = {
        provider: 'meta',
        models: [],
        pricing: [],
        source: 'api',
        confidence: 0,
        lastUpdated: new Date(),
        changes: []
      };

      try {
        const models = await this.metaService.getModels();
        aggregated.models = models;
        aggregated.confidence = models.length > 0 ? 0.9 : 0;

        const pricing = await this.metaService.getPricing();
        aggregated.pricing = pricing;
      } catch (error) {
        logger.warn('Meta API failed:', error);
      }

      // Detect changes
      const previousData = await this.getPreviousData('meta');
      aggregated.changes = await this.detectChanges(previousData, aggregated);

      await cache.set(cacheKey, aggregated, 3600);

      return aggregated.models.length > 0 ? aggregated : null;
    } catch (error) {
      logger.error('Failed to aggregate Meta data:', error);
      return null;
    }
  }

  /**
   * Get previous data from database for comparison
   */
  private async getPreviousData(provider: string): Promise<any> {
    try {
      const providerRecord = await prisma.provider.findUnique({
        where: { slug: provider },
        include: {
          models: {
            include: {
              pricing: {
                where: { effectiveTo: null }
              }
            }
          }
        }
      });

      if (!providerRecord) return null;

      return {
        models: providerRecord.models.map(m => ({
          id: m.slug,
          name: m.name,
          contextWindow: m.contextWindow,
          maxOutputTokens: m.maxOutputTokens,
          pricing: m.pricing[0]
        }))
      };
    } catch (error) {
      logger.error(`Failed to get previous data for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Detect changes between old and new data
   */
  private async detectChanges(oldData: any, newData: AggregatedData): Promise<DataChangeEvent[]> {
    const changes: DataChangeEvent[] = [];

    if (!oldData || !newData.models) return changes;

    // Check for new models
    for (const newModel of newData.models) {
      const oldModel = oldData.models?.find((m: any) => m.id === newModel.id);

      if (!oldModel) {
        changes.push({
          provider: newData.provider,
          modelId: newModel.id,
          changeType: 'new',
          changes: [],
          timestamp: new Date(),
          confidence: newData.confidence
        });
        continue;
      }

      // Check for updates
      const modelChanges: any[] = [];

      // Check pricing changes
      if (newData.pricing) {
        const newPricing = newData.pricing.find((p: any) => p.modelId === newModel.id);
        const oldPricing = oldModel.pricing;

        if (newPricing && oldPricing) {
          if (Math.abs(newPricing.inputPrice - oldPricing.inputPerMillion) / oldPricing.inputPerMillion > this.CHANGE_THRESHOLD) {
            modelChanges.push({
              field: 'inputPrice',
              oldValue: oldPricing.inputPerMillion,
              newValue: newPricing.inputPrice
            });
          }

          if (Math.abs(newPricing.outputPrice - oldPricing.outputPerMillion) / oldPricing.outputPerMillion > this.CHANGE_THRESHOLD) {
            modelChanges.push({
              field: 'outputPrice',
              oldValue: oldPricing.outputPerMillion,
              newValue: newPricing.outputPrice
            });
          }
        }
      }

      // Check context window changes
      if (newModel.contextWindow && oldModel.contextWindow &&
          newModel.contextWindow !== oldModel.contextWindow) {
        modelChanges.push({
          field: 'contextWindow',
          oldValue: oldModel.contextWindow,
          newValue: newModel.contextWindow
        });
      }

      if (modelChanges.length > 0) {
        changes.push({
          provider: newData.provider,
          modelId: newModel.id,
          changeType: 'updated',
          changes: modelChanges,
          timestamp: new Date(),
          confidence: newData.confidence
        });
      }
    }

    // Check for removed models
    if (oldData.models) {
      for (const oldModel of oldData.models) {
        const stillExists = newData.models.find((m: any) => m.id === oldModel.id);
        if (!stillExists) {
          changes.push({
            provider: newData.provider,
            modelId: oldModel.id,
            changeType: 'removed',
            changes: [],
            timestamp: new Date(),
            confidence: newData.confidence
          });
        }
      }
    }

    return changes;
  }

  /**
   * Validate changes against thresholds
   */
  private async validateAndMergeChanges(results: AggregatedData[]): Promise<void> {
    for (const result of results) {
      // Validate confidence
      if (result.confidence < 0.5) {
        logger.warn(`Low confidence data for ${result.provider}: ${result.confidence}`);
      }

      // Validate pricing changes
      for (const change of result.changes) {
        if (change.changeType === 'updated') {
          for (const c of change.changes) {
            if (c.field.includes('Price')) {
              const percentChange = Math.abs(c.newValue - c.oldValue) / c.oldValue;
              if (percentChange > 0.5) { // 50% change
                logger.warn(`Large price change detected for ${change.provider}/${change.modelId}: ${percentChange * 100}%`);
                // Could implement approval workflow here
              }
            }
          }
        }
      }

      // Add to history
      this.changeHistory.push(...result.changes);
    }
  }

  /**
   * Update database with validated data
   */
  private async updateDatabase(results: AggregatedData[]): Promise<void> {
    for (const result of results) {
      if (result.confidence < 0.3) {
        logger.warn(`Skipping database update for ${result.provider} due to low confidence: ${result.confidence}`);
        continue;
      }

      try {
        // Update provider metadata
        await prisma.provider.update({
          where: { slug: result.provider },
          data: {
            metadata: JSON.stringify({
              lastAggregation: result.lastUpdated,
              dataSource: result.source,
              confidence: result.confidence,
              changeCount: result.changes.length
            })
          }
        });

        // Log changes to a new ChangeLog table (we'll create this)
        for (const change of result.changes) {
          await prisma.$executeRaw`
            INSERT INTO change_logs (provider_id, model_id, change_type, change_data, confidence, created_at)
            SELECT id, ${change.modelId}, ${change.changeType}, ${JSON.stringify(change.changes)}, ${change.confidence}, ${change.timestamp}
            FROM providers WHERE slug = ${result.provider}
            ON CONFLICT DO NOTHING
          `;
        }

        logger.info(`Updated database for ${result.provider}: ${result.changes.length} changes`);
      } catch (error) {
        logger.error(`Failed to update database for ${result.provider}:`, error);
      }
    }
  }

  /**
   * Notify about detected changes
   */
  private async notifyChanges(changes: DataChangeEvent[]): Promise<void> {
    if (changes.length === 0) return;

    // Store in cache for dashboard
    await cache.set('recent-changes', changes, 86400); // 24 hours

    // Log significant changes
    const significantChanges = changes.filter(c =>
      c.changeType === 'new' ||
      c.changes.some(ch => ch.field.includes('Price'))
    );

    if (significantChanges.length > 0) {
      logger.info('=== Significant Data Changes Detected ===');
      for (const change of significantChanges) {
        logger.info(`${change.provider}/${change.modelId}: ${change.changeType}`);
        if (change.changeType === 'updated') {
          for (const c of change.changes) {
            logger.info(`  - ${c.field}: ${c.oldValue} → ${c.newValue}`);
          }
        }
      }
      logger.info('=========================================');
    }

    // Could implement webhook notifications, email alerts, etc.
  }

  /**
   * Schedule regular aggregation
   */
  async scheduleAggregation(intervalMinutes: number = 60): Promise<void> {
    logger.info(`Scheduling data aggregation every ${intervalMinutes} minutes`);

    // Run immediately
    await this.aggregateAllData();

    // Schedule regular runs
    setInterval(async () => {
      try {
        await this.aggregateAllData();
      } catch (error) {
        logger.error('Scheduled aggregation failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Get aggregation status
   */
  async getAggregationStatus(): Promise<any> {
    const providers = ['openai', 'anthropic', 'google', 'meta'];
    const status: any = {
      providers: {},
      lastRun: null,
      nextRun: null,
      recentChanges: this.changeHistory.slice(-10)
    };

    for (const provider of providers) {
      const cacheKey = `aggregated:${provider}`;
      const cached = await cache.get<AggregatedData>(cacheKey);

      status.providers[provider] = {
        lastUpdated: cached?.lastUpdated || null,
        source: cached?.source || 'unknown',
        confidence: cached?.confidence || 0,
        modelCount: cached?.models?.length || 0,
        changeCount: cached?.changes?.length || 0
      };
    }

    return status;
  }
}

// Export singleton instance
export const dataAggregator = new DataAggregatorService();