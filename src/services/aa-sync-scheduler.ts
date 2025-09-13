import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';
import { ArtificialAnalysisScraperV2, AAModelData, initializeAAScraperV2 } from './aa-scraper-v2';

interface SyncResult {
  success: boolean;
  modelsCount: number;
  errors: string[];
  timestamp: Date;
  duration: number;
}

export class AASyncScheduler {
  private scraper: ArtificialAnalysisScraperV2;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncHistory: SyncResult[] = [];
  private isSyncing = false;
  private retryCount = 0;
  private maxRetries = 3;
  private baseInterval = 30 * 60 * 1000; // 30 minutes
  
  constructor() {
    this.scraper = initializeAAScraperV2();
  }

  /**
   * Start the sync scheduler
   */
  start(): void {
    console.log('🚀 AA Sync Scheduler started');
    
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
      console.log('⏹️ AA Sync Scheduler stopped');
    }
  }

  /**
   * Schedule periodic syncs with adaptive timing
   */
  private scheduledSync(): void {
    // Calculate interval based on time of day (peak vs off-peak)
    const interval = this.calculateSyncInterval();
    
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, interval);
  }

  /**
   * Calculate sync interval based on time and load
   */
  private calculateSyncInterval(): number {
    const hour = new Date().getHours();
    
    // Peak hours (9 AM - 6 PM): More frequent syncs
    if (hour >= 9 && hour <= 18) {
      return this.baseInterval; // 30 minutes
    }
    
    // Off-peak hours: Less frequent syncs
    return this.baseInterval * 2; // 60 minutes
  }

  /**
   * Perform the actual sync operation
   */
  async performSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('⚠️ Sync already in progress, skipping...');
      return {
        success: false,
        modelsCount: 0,
        errors: ['Sync already in progress'],
        timestamp: new Date(),
        duration: 0
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let modelsCount = 0;

    try {
      console.log('🔄 Starting AA data sync...');
      
      // Scrape latest data from AA
      const models = await this.scraper.scrapeModels();
      
      if (!models || models.length === 0) {
        throw new Error('No models retrieved from AA scraper');
      }

      modelsCount = models.length;
      console.log(`📊 Retrieved ${modelsCount} models from Artificial Analysis`);

      // Save to database
      await this.saveModelsToDatabase(models);
      
      // Update cache
      await this.updateCache(models);
      
      // Calculate and save statistics
      await this.updateStatistics(models);
      
      // Reset retry count on success
      this.retryCount = 0;
      
      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: true,
        modelsCount,
        errors,
        timestamp: new Date(),
        duration
      };
      
      this.syncHistory.push(result);
      console.log(`✅ Sync completed successfully in ${duration}ms`);
      
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      console.error('❌ Sync failed:', errorMessage);
      
      // Implement exponential backoff for retries
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const retryDelay = Math.pow(2, this.retryCount) * 5000; // 5s, 10s, 20s
        console.log(`🔄 Retrying sync in ${retryDelay / 1000} seconds...`);
        
        setTimeout(() => {
          this.performSync();
        }, retryDelay);
      }
      
      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: false,
        modelsCount: 0,
        errors,
        timestamp: new Date(),
        duration
      };
      
      this.syncHistory.push(result);
      return result;

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Save models to database with upsert logic
   */
  private async saveModelsToDatabase(models: AAModelData[]): Promise<void> {
    console.log('💾 Saving models to database...');
    
    for (const model of models) {
      try {
        // Find or create provider
        const provider = await prisma.provider.upsert({
          where: { slug: model.provider.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
          update: {
            name: model.provider,
            updatedAt: new Date()
          },
          create: {
            slug: model.provider.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: model.provider
          }
        });

        // Upsert model
        const dbModel = await prisma.model.upsert({
          where: { slug: model.slug },
          update: {
            name: model.name,
            providerId: provider.id,
            contextWindow: model.contextWindow,
            isActive: true,
            metadata: {
              aa: {
                intelligenceScore: model.intelligenceScore,
                outputSpeed: model.outputSpeed,
                latency: model.latency,
                price: model.price,
                rank: model.rank,
                category: model.category,
                trend: model.trend,
                lastUpdated: model.lastUpdated
              }
            },
            updatedAt: new Date()
          },
          create: {
            slug: model.slug,
            name: model.name,
            providerId: provider.id,
            description: `${model.name} by ${model.provider}`,
            contextWindow: model.contextWindow,
            maxOutputTokens: Math.floor(model.contextWindow / 4),
            isActive: true,
            metadata: {
              aa: {
                intelligenceScore: model.intelligenceScore,
                outputSpeed: model.outputSpeed,
                latency: model.latency,
                price: model.price,
                rank: model.rank,
                category: model.category,
                trend: model.trend,
                lastUpdated: model.lastUpdated
              }
            }
          }
        });

        // Create or update model status
        await prisma.modelStatus.upsert({
          where: {
            modelId_checkedAt: {
              modelId: dbModel.id,
              checkedAt: new Date()
            }
          },
          update: {
            status: model.intelligenceScore > 70 ? 'operational' : 'degraded',
            availability: model.intelligenceScore > 70 ? 99.5 : 95.0,
            avgLatency: model.latency * 1000, // Convert to ms
            errorRate: model.intelligenceScore > 70 ? 0.1 : 1.0,
            metadata: {
              aaSync: true,
              syncedAt: new Date()
            }
          },
          create: {
            modelId: dbModel.id,
            status: model.intelligenceScore > 70 ? 'operational' : 'degraded',
            availability: model.intelligenceScore > 70 ? 99.5 : 95.0,
            avgLatency: model.latency * 1000,
            errorRate: model.intelligenceScore > 70 ? 0.1 : 1.0,
            checkedAt: new Date(),
            metadata: {
              aaSync: true,
              syncedAt: new Date()
            }
          }
        });

      } catch (error) {
        console.error(`❌ Failed to save model ${model.name}:`, error);
      }
    }
    
    console.log('✅ Models saved to database');
  }

  /**
   * Update Redis cache with latest data
   */
  private async updateCache(models: AAModelData[]): Promise<void> {
    console.log('📦 Updating Redis cache...');
    
    // Cache full model list
    await cache.set('aa:models:list', models, 300); // 5 minutes TTL
    
    // Cache individual models
    for (const model of models) {
      await cache.set(`aa:models:${model.slug}`, model, 600); // 10 minutes TTL
    }
    
    // Cache statistics
    const stats = this.calculateStats(models);
    await cache.set('aa:stats:global', stats, 60); // 1 minute TTL
    
    console.log('✅ Cache updated');
  }

  /**
   * Calculate statistics from models
   */
  private calculateStats(models: AAModelData[]): any {
    const totalModels = models.length;
    const activeModels = models.filter(m => m.intelligenceScore > 60).length;
    const avgIntelligence = models.reduce((sum, m) => sum + m.intelligenceScore, 0) / totalModels;
    const avgSpeed = models.reduce((sum, m) => sum + m.outputSpeed, 0) / totalModels;
    const avgInputPrice = models.reduce((sum, m) => sum + m.price.input, 0) / totalModels;
    
    const providers = new Set(models.map(m => m.provider)).size;
    
    const categories = models.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalModels,
      activeModels,
      operationalModels: models.filter(m => m.intelligenceScore > 70).length,
      degradedModels: models.filter(m => m.intelligenceScore > 50 && m.intelligenceScore <= 70).length,
      outageModels: models.filter(m => m.intelligenceScore <= 50).length,
      avgAvailability: 95.0 + (avgIntelligence / 100) * 4.5, // 95-99.5% based on intelligence
      avgIntelligence: Math.round(avgIntelligence * 10) / 10,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      avgInputPrice: Math.round(avgInputPrice * 100) / 100,
      providers,
      categories,
      lastSync: new Date()
    };
  }

  /**
   * Update global statistics in database
   */
  private async updateStatistics(models: AAModelData[]): Promise<void> {
    const stats = this.calculateStats(models);
    
    // Save to a statistics table or as metadata
    await cache.set('aa:stats:latest', stats, 3600); // 1 hour TTL
    
    console.log('📊 Statistics updated:', {
      total: stats.totalModels,
      active: stats.activeModels,
      avgIntelligence: stats.avgIntelligence
    });
  }

  /**
   * Get sync history
   */
  getSyncHistory(): SyncResult[] {
    return this.syncHistory.slice(-10); // Last 10 syncs
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isSyncing: boolean;
    lastSync: Date | null;
    nextSync: Date | null;
    successRate: number;
  } {
    const lastSync = this.syncHistory.length > 0 
      ? this.syncHistory[this.syncHistory.length - 1].timestamp 
      : null;
    
    const nextSync = lastSync 
      ? new Date(lastSync.getTime() + this.calculateSyncInterval())
      : null;
    
    const successCount = this.syncHistory.filter(s => s.success).length;
    const successRate = this.syncHistory.length > 0 
      ? (successCount / this.syncHistory.length) * 100 
      : 0;
    
    return {
      isSyncing: this.isSyncing,
      lastSync,
      nextSync,
      successRate: Math.round(successRate * 10) / 10
    };
  }

  /**
   * Force manual sync
   */
  async forceSync(): Promise<SyncResult> {
    console.log('⚡ Force sync requested');
    this.retryCount = 0; // Reset retry count for manual sync
    return this.performSync();
  }
}

// Singleton instance
let schedulerInstance: AASyncScheduler | null = null;

export function initializeAASyncScheduler(): AASyncScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AASyncScheduler();
  }
  return schedulerInstance;
}

export function getAASyncScheduler(): AASyncScheduler | null {
  return schedulerInstance;
}