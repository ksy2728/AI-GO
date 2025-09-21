import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';
import { improvedAAScraper, ImprovedAAModelData } from './aa-scraper-improved';
import { Prisma } from '@prisma/client';

interface SyncResult {
  success: boolean;
  modelsCount: number;
  modelsUpdated: number;
  pricingUpdated: number;
  errors: string[];
  timestamp: Date;
  duration: number;
  dataQuality: {
    withIntelligence: number;
    withSpeed: number;
    withPricing: number;
    averageConfidence: number;
  };
}

export class ImprovedAASyncScheduler {
  private syncInterval: NodeJS.Timeout | null = null;
  private syncHistory: SyncResult[] = [];
  private isSyncing = false;
  private retryCount = 0;
  private maxRetries = 3;
  private baseInterval = 30 * 60 * 1000; // 30 minutes

  /**
   * Start the sync scheduler
   */
  start(): void {
    console.log('🚀 Improved AA Sync Scheduler started');

    // Initial sync
    this.performSync();

    // Set up periodic sync
    this.scheduledSync();
  }

  /**
   * Stop the sync scheduler
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Improved AA Sync Scheduler stopped');
    }
  }

  /**
   * Set up scheduled sync with adaptive intervals
   */
  private scheduledSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const interval = this.calculateInterval();

    this.syncInterval = setInterval(() => {
      this.performSync();
    }, interval);

    console.log(`⏰ Next sync scheduled in ${interval / 1000 / 60} minutes`);
  }

  /**
   * Calculate sync interval based on retry count and time of day
   */
  private calculateInterval(): number {
    // Increase interval after failures
    const failureMultiplier = Math.pow(2, Math.min(this.retryCount, 3));

    // Reduce frequency during night hours (1 AM - 6 AM)
    const hour = new Date().getHours();
    const nightMultiplier = (hour >= 1 && hour <= 6) ? 2 : 1;

    return this.baseInterval * failureMultiplier * nightMultiplier;
  }

  /**
   * Perform the actual sync operation
   */
  async performSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return {
        success: false,
        modelsCount: 0,
        modelsUpdated: 0,
        pricingUpdated: 0,
        errors: ['Sync already in progress'],
        timestamp: new Date(),
        duration: 0,
        dataQuality: {
          withIntelligence: 0,
          withSpeed: 0,
          withPricing: 0,
          averageConfidence: 0
        }
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let modelsUpdated = 0;
    let pricingUpdated = 0;

    try {
      console.log('🔄 Starting improved AA sync...');
      console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);

      // Scrape models with improved scraper
      const models = await improvedAAScraper.scrapeModels();

      if (!models || models.length === 0) {
        throw new Error('No models scraped from AA');
      }

      console.log(`✅ Scraped ${models.length} models from AA`);

      // Calculate data quality metrics
      const dataQuality = this.calculateDataQuality(models);
      console.log(`📊 Data Quality:
        - With Intelligence: ${dataQuality.withIntelligence}%
        - With Speed: ${dataQuality.withSpeed}%
        - With Pricing: ${dataQuality.withPricing}%
        - Average Confidence: ${dataQuality.averageConfidence}%`);

      // Process models and update database
      const updateResult = await this.updateModelsInDatabase(models);
      modelsUpdated = updateResult.modelsUpdated;
      pricingUpdated = updateResult.pricingUpdated;

      // Clear cache after successful sync
      await this.clearCache();

      // Save scraped data to file for backup
      await improvedAAScraper.saveToFile(models);

      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: true,
        modelsCount: models.length,
        modelsUpdated,
        pricingUpdated,
        errors,
        timestamp: new Date(),
        duration,
        dataQuality
      };

      this.syncHistory.push(result);
      this.retryCount = 0; // Reset retry count on success

      console.log(`✅ Sync completed successfully in ${duration / 1000}s`);
      console.log(`📊 Updated ${modelsUpdated} models, ${pricingUpdated} pricing records`);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      console.error('❌ Sync failed:', errorMessage);

      this.retryCount++;

      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: false,
        modelsCount: 0,
        modelsUpdated,
        pricingUpdated,
        errors,
        timestamp: new Date(),
        duration,
        dataQuality: {
          withIntelligence: 0,
          withSpeed: 0,
          withPricing: 0,
          averageConfidence: 0
        }
      };

      this.syncHistory.push(result);
      return result;

    } finally {
      this.isSyncing = false;

      // Reschedule with adaptive interval
      this.scheduledSync();
    }
  }

  /**
   * Calculate data quality metrics
   */
  private calculateDataQuality(models: ImprovedAAModelData[]) {
    const total = models.length;
    let withIntelligence = 0;
    let withSpeed = 0;
    let withPricing = 0;
    let totalConfidence = 0;

    models.forEach(model => {
      if (model.intelligenceScore !== null) withIntelligence++;
      if (model.outputSpeed !== null) withSpeed++;
      if (model.price.input !== null || model.price.output !== null) withPricing++;
      totalConfidence += model.confidence;
    });

    return {
      withIntelligence: Math.round(withIntelligence / total * 100),
      withSpeed: Math.round(withSpeed / total * 100),
      withPricing: Math.round(withPricing / total * 100),
      averageConfidence: Math.round(totalConfidence / total * 100)
    };
  }

  /**
   * Update models in database with improved data
   */
  private async updateModelsInDatabase(models: ImprovedAAModelData[]): Promise<{
    modelsUpdated: number;
    pricingUpdated: number;
  }> {
    console.log('💾 Updating database with improved data...');

    let modelsUpdated = 0;
    let pricingUpdated = 0;

    // First, ensure all providers exist
    await this.ensureProvidersExist(models);

    // Process models in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize);

      await Promise.all(batch.map(async (model) => {
        try {
          // Get or create provider
          const providerSlug = model.provider.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const provider = await prisma.provider.findUnique({
            where: { slug: providerSlug }
          });

          if (!provider) {
            console.warn(`⚠️ Provider not found: ${model.provider}`);
            return;
          }

          // Create model ID
          const modelId = `${providerSlug}-${model.slug}`;

          // Upsert model
          const dbModel = await prisma.model.upsert({
            where: { id: modelId },
            update: {
              name: model.name,
              providerId: provider.id,
              contextWindow: model.contextWindow,
              isActive: true,
              updatedAt: new Date(),
              // Update AA-specific columns
              intelligenceScore: model.intelligenceScore ? Math.round(model.intelligenceScore) : null,
              outputSpeed: model.outputSpeed ? Math.round(model.outputSpeed) : null,
              inputPrice: model.price.input,
              outputPrice: model.price.output,
              lastVerified: new Date(),
              dataSource: model.dataSource,
              // Store full data in metadata
              metadata: JSON.stringify({
                aa: {
                  intelligenceScore: model.intelligenceScore,
                  outputSpeed: model.outputSpeed,
                  latency: model.latency,
                  inputPrice: model.price.input,
                  outputPrice: model.price.output,
                  blendedPrice: model.price.blended,
                  rank: model.rank,
                  category: model.category,
                  trend: model.trend,
                  confidence: model.confidence,
                  lastUpdated: model.lastUpdated
                },
                source: 'artificial-analysis-improved',
                dataSource: model.dataSource,
                scrapedAt: new Date().toISOString()
              })
            },
            create: {
              id: modelId,
              slug: model.slug,
              name: model.name,
              providerId: provider.id,
              modalities: JSON.stringify(['text']),
              contextWindow: model.contextWindow,
              isActive: true,
              releasedAt: null,
              intelligenceScore: model.intelligenceScore ? Math.round(model.intelligenceScore) : null,
              outputSpeed: model.outputSpeed ? Math.round(model.outputSpeed) : null,
              inputPrice: model.price.input,
              outputPrice: model.price.output,
              lastVerified: new Date(),
              dataSource: model.dataSource,
              metadata: JSON.stringify({
                aa: {
                  intelligenceScore: model.intelligenceScore,
                  outputSpeed: model.outputSpeed,
                  latency: model.latency,
                  inputPrice: model.price.input,
                  outputPrice: model.price.output,
                  blendedPrice: model.price.blended,
                  rank: model.rank,
                  category: model.category,
                  trend: model.trend,
                  confidence: model.confidence,
                  lastUpdated: model.lastUpdated
                },
                source: 'artificial-analysis-improved',
                dataSource: model.dataSource,
                scrapedAt: new Date().toISOString()
              })
            }
          });

          modelsUpdated++;

          // Update Pricing table if we have pricing data
          if (model.price.input !== null || model.price.output !== null) {
            await this.updatePricing(dbModel.id, model);
            pricingUpdated++;
          }

        } catch (error) {
          console.error(`❌ Error updating model ${model.name}:`, error);
        }
      }));
    }

    console.log(`✅ Database update completed: ${modelsUpdated} models, ${pricingUpdated} pricing records`);
    return { modelsUpdated, pricingUpdated };
  }

  /**
   * Ensure all providers exist in database
   */
  private async ensureProvidersExist(models: ImprovedAAModelData[]): Promise<void> {
    const uniqueProviders = [...new Set(models.map(m => m.provider))];

    await Promise.all(uniqueProviders.map(async (providerName) => {
      const slug = providerName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      try {
        await prisma.provider.upsert({
          where: { slug },
          update: {
            name: providerName,
            updatedAt: new Date()
          },
          create: {
            slug,
            name: providerName,
            regions: JSON.stringify(['global']),
            metadata: JSON.stringify({
              source: 'artificial-analysis-improved',
              autoCreated: true
            })
          }
        });
      } catch (error) {
        console.warn(`⚠️ Could not create provider ${providerName}:`, error);
      }
    }));
  }

  /**
   * Update pricing information for a model
   */
  private async updatePricing(modelId: string, model: ImprovedAAModelData): Promise<void> {
    try {
      // Check if pricing record exists
      const existingPricing = await prisma.pricing.findFirst({
        where: {
          modelId,
          region: 'global'
        },
        orderBy: {
          effectiveFrom: 'desc'
        }
      });

      const inputPerMillion = model.price.input;
      const outputPerMillion = model.price.output;

      // Only update if prices have changed or no existing pricing
      if (!existingPricing ||
          (inputPerMillion !== null && inputPerMillion !== existingPricing.inputPerMillion) ||
          (outputPerMillion !== null && outputPerMillion !== existingPricing.outputPerMillion)) {

        await prisma.pricing.create({
          data: {
            modelId,
            tier: 'standard', // Required field
            region: 'global',
            inputPerMillion,
            outputPerMillion,
            effectiveFrom: new Date(),
            currency: 'USD',
            metadata: JSON.stringify({
              source: 'artificial-analysis-improved',
              confidence: model.confidence,
              dataSource: model.dataSource,
              blendedPrice: model.price.blended,
              lastUpdated: model.lastUpdated
            })
          }
        });

        console.log(`💰 Updated pricing for ${model.name}: input=$${model.price.input}, output=$${model.price.output}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not update pricing for ${model.name}:`, error);
    }
  }

  /**
   * Clear relevant caches after sync
   */
  private async clearCache(): Promise<void> {
    try {
      // Clear model-related caches
      await cache.delete('models:*');
      await cache.delete('aa:*');
      console.log('🧹 Cache cleared');
    } catch (error) {
      console.warn('⚠️ Could not clear cache:', error);
    }
  }

  /**
   * Get sync status and history
   */
  getSyncStatus(): {
    isSyncing: boolean;
    lastSync: SyncResult | null;
    history: SyncResult[];
    nextSyncIn: number | null;
  } {
    const lastSync = this.syncHistory[this.syncHistory.length - 1] || null;

    let nextSyncIn = null;
    if (this.syncInterval) {
      nextSyncIn = this.calculateInterval() - (Date.now() - (lastSync?.timestamp.getTime() || 0));
    }

    return {
      isSyncing: this.isSyncing,
      lastSync,
      history: this.syncHistory.slice(-10), // Last 10 syncs
      nextSyncIn
    };
  }

  /**
   * Manually trigger a sync
   */
  async triggerSync(): Promise<SyncResult> {
    console.log('⚡ Manual sync triggered');
    return this.performSync();
  }
}

// Export singleton instance
export const improvedAASyncScheduler = new ImprovedAASyncScheduler();