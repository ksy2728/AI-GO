import { OpenAIService } from './external/openai.service'
import { GoogleService } from './external/google.service'
import { AnthropicService } from './external/anthropic.service'
import { MetaService } from './external/meta.service'
import { ArtificialAnalysisAPI } from './aa-api.service'
import { metricsCollector } from './metrics-collector.service'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export interface SyncResult {
  provider: string
  success: boolean
  modelsUpdated: number
  pricingUpdated: number
  metricsCollected: number
  error?: string
  duration: number
}

export interface SyncOptions {
  providers?: string[]
  includeMetrics?: boolean
  includeAA?: boolean
  forceRefresh?: boolean
  metricsDepth?: 'shallow' | 'full'
}

/**
 * Real API Integration Orchestrator
 * Coordinates all provider APIs, web scraping, and metrics collection
 */
export class RealAPISyncService {
  private readonly services = {
    openai: new OpenAIService(),
    google: new GoogleService(),
    anthropic: new AnthropicService(),
    meta: new MetaService()
  }

  /**
   * Sync all providers with real API data
   */
  async syncAllProviders(options: SyncOptions = {}): Promise<SyncResult[]> {
    const results: SyncResult[] = []
    const providersToSync = options.providers || Object.keys(this.services)

    console.log('🚀 Starting comprehensive real API sync...')
    console.log(`📋 Providers: ${providersToSync.join(', ')}`)
    console.log(`🔧 Options:`, {
      includeMetrics: options.includeMetrics ?? true,
      includeAA: options.includeAA ?? true,
      forceRefresh: options.forceRefresh ?? false,
      metricsDepth: options.metricsDepth ?? 'shallow'
    })

    // Clear caches if force refresh is requested
    if (options.forceRefresh) {
      await this.clearCaches()
    }

    // Sync each provider
    for (const provider of providersToSync) {
      if (provider in this.services) {
        const result = await this.syncProvider(provider, options)
        results.push(result)

        // Rate limiting between providers
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Sync AA data if requested
    if (options.includeAA) {
      const aaResult = await this.syncArtificialAnalysis()
      results.push(aaResult)
    }

    // Collect metrics if requested
    if (options.includeMetrics) {
      const metricsResult = await this.collectMetrics(options.metricsDepth)
      results.push(metricsResult)
    }

    // Generate summary
    const summary = this.generateSyncSummary(results)
    console.log('📊 Sync Summary:', summary)

    return results
  }

  /**
   * Sync a single provider
   */
  async syncProvider(provider: string, options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      provider,
      success: false,
      modelsUpdated: 0,
      pricingUpdated: 0,
      metricsCollected: 0,
      duration: 0
    }

    try {
      console.log(`🔄 Syncing ${provider}...`)

      const service = this.services[provider as keyof typeof this.services]
      if (!service) {
        throw new Error(`Unknown provider: ${provider}`)
      }

      // Check if service is configured
      if ('isConfigured' in service && !service.isConfigured()) {
        console.warn(`⚠️ ${provider} service not configured, using fallback data`)
      }

      // Sync models and pricing
      if ('syncWithDatabase' in service) {
        await service.syncWithDatabase()
        console.log(`✅ ${provider} sync completed`)
      }

      // Count updated models and pricing
      const counts = await this.getUpdateCounts(provider)
      result.modelsUpdated = counts.models
      result.pricingUpdated = counts.pricing

      result.success = true
      console.log(`✅ ${provider} sync successful:`, {
        models: result.modelsUpdated,
        pricing: result.pricingUpdated
      })

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
      console.error(`❌ ${provider} sync failed:`, result.error)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Sync Artificial Analysis data
   */
  async syncArtificialAnalysis(): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      provider: 'artificial-analysis',
      success: false,
      modelsUpdated: 0,
      pricingUpdated: 0,
      metricsCollected: 0,
      duration: 0
    }

    try {
      console.log('🔄 Syncing Artificial Analysis data...')

      const updatedCount = await ArtificialAnalysisAPI.syncAllModels()
      result.modelsUpdated = updatedCount
      result.success = true

      console.log(`✅ AA sync successful: ${updatedCount} models updated`)

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
      console.error('❌ AA sync failed:', result.error)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Collect real performance metrics
   */
  async collectMetrics(depth: 'shallow' | 'full' = 'shallow'): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      provider: 'metrics-collector',
      success: false,
      modelsUpdated: 0,
      pricingUpdated: 0,
      metricsCollected: 0,
      duration: 0
    }

    try {
      console.log(`🔄 Collecting ${depth} metrics...`)

      if (depth === 'full') {
        // Collect comprehensive metrics for all models
        result.metricsCollected = await metricsCollector.collectAllModelMetrics()
      } else {
        // Collect shallow metrics for top models only
        result.metricsCollected = await this.collectShallowMetrics()
      }

      result.success = true
      console.log(`✅ Metrics collection successful: ${result.metricsCollected} models measured`)

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
      console.error('❌ Metrics collection failed:', result.error)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Collect metrics for top models only (faster)
   */
  private async collectShallowMetrics(): Promise<number> {
    try {
      // Get top 5 models from each provider
      const topModels = await prisma.model.findMany({
        where: {
          isActive: true,
          provider: {
            slug: { in: ['openai', 'google', 'anthropic', 'meta'] }
          }
        },
        include: { provider: true },
        orderBy: { createdAt: 'desc' },
        take: 20 // Limit to 20 total models
      })

      let collectedCount = 0

      for (const model of topModels) {
        try {
          const metrics = await metricsCollector.collectModelMetrics(
            model.slug,
            model.provider.slug,
            { includeThroughput: false, sampleSize: 3 } // Minimal samples for speed
          )

          if (metrics) {
            collectedCount++
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.warn(`Failed to collect metrics for ${model.slug}:`, error)
        }
      }

      return collectedCount

    } catch (error) {
      console.error('Failed to collect shallow metrics:', error)
      return 0
    }
  }

  /**
   * Get count of updated models and pricing for a provider
   */
  private async getUpdateCounts(provider: string): Promise<{ models: number; pricing: number }> {
    try {
      const providerRecord = await prisma.provider.findUnique({
        where: { slug: provider },
        include: {
          models: {
            include: { pricing: true }
          }
        }
      })

      if (!providerRecord) {
        return { models: 0, pricing: 0 }
      }

      const models = providerRecord.models.length
      const pricing = providerRecord.models.reduce(
        (sum, model) => sum + model.pricing.length,
        0
      )

      return { models, pricing }

    } catch (error) {
      console.error(`Failed to get update counts for ${provider}:`, error)
      return { models: 0, pricing: 0 }
    }
  }

  /**
   * Clear all caches
   */
  private async clearCaches(): Promise<void> {
    try {
      console.log('🧹 Clearing caches...')

      await Promise.all([
        cache.invalidate('openai:*'),
        cache.invalidate('google:*'),
        cache.invalidate('anthropic:*'),
        cache.invalidate('meta:*'),
        cache.invalidate('aa:*'),
        cache.invalidate('metrics:*'),
        cache.invalidate('models:*'),
        cache.invalidate('providers:*')
      ])

      console.log('✅ Caches cleared')

    } catch (error) {
      console.error('❌ Failed to clear caches:', error)
    }
  }

  /**
   * Generate sync summary
   */
  private generateSyncSummary(results: SyncResult[]): any {
    const summary = {
      totalProviders: results.length,
      successfulProviders: results.filter(r => r.success).length,
      failedProviders: results.filter(r => !r.success).length,
      totalModels: results.reduce((sum, r) => sum + r.modelsUpdated, 0),
      totalPricing: results.reduce((sum, r) => sum + r.pricingUpdated, 0),
      totalMetrics: results.reduce((sum, r) => sum + r.metricsCollected, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      errors: results.filter(r => r.error).map(r => ({
        provider: r.provider,
        error: r.error
      }))
    }

    return summary
  }

  /**
   * Check API configuration status
   */
  async checkAPIConfiguration(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {}

    // Check OpenAI
    status.openai = !!(process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'sk-proj-placeholder-replace-with-real-key')

    // Check Anthropic
    status.anthropic = !!(process.env.ANTHROPIC_API_KEY &&
      process.env.ANTHROPIC_API_KEY !== 'sk-ant-placeholder-replace-with-real-key')

    // Check Google
    status.google = !!(process.env.GOOGLE_AI_API_KEY &&
      process.env.GOOGLE_AI_API_KEY !== 'AIza-placeholder-replace-with-real-key')

    // Check Replicate (Meta)
    status.replicate = !!(process.env.REPLICATE_API_TOKEN &&
      process.env.REPLICATE_API_TOKEN !== 'r8_placeholder-replace-with-real-token')

    return status
  }

  /**
   * Run incremental sync (updates only)
   */
  async runIncrementalSync(): Promise<SyncResult[]> {
    console.log('🔄 Running incremental sync...')

    return this.syncAllProviders({
      includeMetrics: true,
      includeAA: true,
      forceRefresh: false,
      metricsDepth: 'shallow'
    })
  }

  /**
   * Run full sync (complete refresh)
   */
  async runFullSync(): Promise<SyncResult[]> {
    console.log('🔄 Running full sync...')

    return this.syncAllProviders({
      includeMetrics: true,
      includeAA: true,
      forceRefresh: true,
      metricsDepth: 'full'
    })
  }
}

// Export singleton instance
export const realAPISyncService = new RealAPISyncService()