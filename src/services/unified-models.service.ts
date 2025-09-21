import { ModelService } from './models.service';
import { HybridModelService } from './hybrid-models.service';
import { prisma } from '@/lib/prisma';
import {
  UnifiedModel,
  UnifiedModelFilters,
  UnifiedModelResponse,
  DataSource,
  DetailedDataSource,
  AaMetrics,
  DbMetrics,
  STATUS_WEIGHTS,
  createModelId,
  normalizeProviderName
} from '@/types/unified-models';

// Legacy static import for AA models - fallback only
// import aaModelsStaticData from '../data/aa-models.json';

interface AAModel {
  rank: number;
  name: string;
  provider: string;
  slug: string;
  intelligenceScore: number;
  outputSpeed: number;
  inputPrice: number;
  outputPrice: number;
  contextWindow: number;
  lastUpdated: string;
  category: string;
  trend: string;
  latency?: number;
  metadata?: {
    source: string;
    scrapedAt: string;
    scrapingMethod: string;
  };
}

export class UnifiedModelService {
  private static cache = new Map<string, { data: UnifiedModelResponse; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes for database cache

  /**
   * Load AA models from database with fallback strategies
   */
  private static async loadAAModels(): Promise<AAModel[]> {
    try {
      console.log('🔄 Loading AA models from database...');

      // Query database for only AA-synchronized models
      const dbModels = await prisma.model.findMany({
        include: {
          provider: true,
          pricing: {
            where: { region: 'global' },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
          status: {
            where: { region: 'global' },
            orderBy: { checkedAt: 'desc' },
            take: 1,
          },
        },
        where: {
          isActive: true,
          // Include models synchronized from Artificial Analysis or with AA data
          OR: [
            { dataSource: 'artificial-analysis-improved' },
            { intelligenceScore: { not: null } },
            { outputSpeed: { not: null } }
          ],
        },
        orderBy: {
          intelligenceScore: 'desc',
        },
      });

      // Convert database models to AA model format
      const aaModels: AAModel[] = dbModels.map((dbModel, index) => ({
        rank: index + 1,
        name: dbModel.name,
        provider: dbModel.provider.name,
        slug: dbModel.slug,
        intelligenceScore: dbModel.intelligenceScore || 70,
        outputSpeed: dbModel.outputSpeed || 50,
        // FIXED: Use pricing data stored directly in Model table (from AA sync)
        inputPrice: dbModel.inputPrice || dbModel.pricing[0]?.inputPerMillion || 0,
        outputPrice: dbModel.outputPrice || dbModel.pricing[0]?.outputPerMillion || 0,
        contextWindow: dbModel.contextWindow || 8192,
        lastUpdated: dbModel.updatedAt.toISOString(),
        category: this.inferCategory(dbModel.name, dbModel.provider.name),
        trend: this.inferTrend(dbModel.intelligenceScore || 70),
        latency: dbModel.status[0]?.latencyP50 || 200,
        metadata: {
          source: 'database',
          scrapedAt: dbModel.updatedAt.toISOString(),
          scrapingMethod: 'api-sync',
        },
      }));

      console.log(`✅ Loaded ${aaModels.length} models from database`);
      return aaModels;
    } catch (error) {
      console.error('❌ Failed to load models from database:', error);

      // Fallback to GitHub sources if database fails
      return this.safeFetchAaModelsFromGitHub();
    }
  }

  /**
   * Fallback method to fetch AA models from GitHub (legacy)
   */
  private static async safeFetchAaModelsFromGitHub(): Promise<AAModel[]> {
    console.log('🔄 Falling back to GitHub sources...');

    const sources = [
      // Primary: GitHub raw content (public repo)
      'https://raw.githubusercontent.com/ksy2728/AI-GO/master/public/data/aa-models.json',
      // Fallback: jsDelivr CDN
      'https://cdn.jsdelivr.net/gh/ksy2728/AI-GO@master/public/data/aa-models.json',
    ];

    for (const url of sources) {
      try {
        console.log(`🔄 Attempting to fetch AA models from: ${url}`);
        const response = await fetch(url, {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(2500) // 2.5s timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Fetched ${data.models?.length || 0} AA models from ${url}`);
        return data.models || [];
      } catch (error) {
        console.warn(`❌ Failed to fetch from ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.error('❌ All sources failed, returning empty array');
    return [];
  }

  /**
   * Infer model category based on name and provider
   */
  private static inferCategory(name: string, provider: string): string {
    const nameL = name.toLowerCase();
    if (nameL.includes('4o') || nameL.includes('opus')) return 'flagship';
    if (nameL.includes('mini') || nameL.includes('haiku')) return 'efficient';
    if (nameL.includes('sonnet') || nameL.includes('pro')) return 'balanced';
    if (nameL.includes('vision') || nameL.includes('multimodal')) return 'multimodal';
    return 'general';
  }

  /**
   * Infer trend based on intelligence score
   */
  private static inferTrend(intelligence: number): string {
    if (intelligence >= 85) return 'rising';
    if (intelligence >= 70) return 'stable';
    return 'declining';
  }

  /**
   * Try to fetch fresh data from GitHub (non-blocking)
   */
  private static async tryFetchFreshData(): Promise<void> {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/ksy2728/AI-GO/master/public/data/aa-models.json',
        {
          cache: 'no-cache',
          signal: AbortSignal.timeout(1000) // Quick timeout
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`🔄 Fresh data available: ${data.models?.length || 0} models (for next request)`);
        // Could cache this for subsequent requests in the same instance
      }
    } catch {
      // Silently fail - we have static data as backup
    }
  }

  /**
   * Safely fetch database models
   */
  private static async safeFetchDbModels(filters?: UnifiedModelFilters): Promise<any[]> {
    try {
      console.log('🔄 Fetching database models...');
      const dbModels: any[] = (await ModelService.getAll({
        limit: 1000, // Get all DB models
        offset: 0,
        ...filters
      })) as any[];
      console.log(`✅ Fetched ${dbModels.length} database models`);
      return dbModels;
    } catch (error) {
      console.warn('❌ Failed to fetch database models:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Convert AA model to UnifiedModel format
   */
  private static convertAAModel(aaModel: AAModel): UnifiedModel {
    const id = createModelId(aaModel.provider, aaModel.name);

    // Determine detailed data source based on metadata
    let detailedSource: DetailedDataSource = 'unknown';
    if (aaModel.metadata) {
      if (aaModel.metadata.source === 'database') {
        detailedSource = 'api';
      } else if (aaModel.metadata.scrapingMethod === 'scraper') {
        detailedSource = 'scraped';
      } else if (aaModel.metadata.source === 'github') {
        detailedSource = 'config';
      }
    }

    return {
      id,
      slug: aaModel.slug,
      name: aaModel.name,
      provider: aaModel.provider,
      description: `${aaModel.name} - Intelligence: ${aaModel.intelligenceScore}, Speed: ${aaModel.outputSpeed}`,
      source: 'artificial-analysis',
      detailedSource,
      dataLastVerified: aaModel.metadata?.scrapedAt || aaModel.lastUpdated,
      dataConfidence: detailedSource === 'api' ? 1.0 : detailedSource === 'scraped' ? 0.8 : 0.6,

      // AA metrics container
      aa: {
        intelligence: aaModel.intelligenceScore,
        speed: aaModel.outputSpeed,
        rank: aaModel.rank,
        inputPrice: aaModel.inputPrice,
        outputPrice: aaModel.outputPrice,
        contextWindow: aaModel.contextWindow,
        category: aaModel.category,
        trend: aaModel.trend,
        lastUpdated: aaModel.lastUpdated,
        dataSource: detailedSource
      },

      // Unified display fields from AA
      intelligence: aaModel.intelligenceScore,
      speed: aaModel.outputSpeed,
      priceInput: aaModel.inputPrice,
      priceOutput: aaModel.outputPrice,
      contextWindow: aaModel.contextWindow,
      status: aaModel.intelligenceScore > 70 ? 'operational' : 'degraded',

      // Model metadata
      modalities: ['text'],
      capabilities: ['chat', 'completion'],
      isActive: true,
      rankScore: aaModel.rank,
      lastUpdated: aaModel.lastUpdated
    };
  }

  /**
   * Convert database model to UnifiedModel format
   */
  private static convertDbModel(dbModel: any): UnifiedModel {
    const id = createModelId(dbModel.provider?.name || 'unknown', dbModel.name);

    // Determine detailed data source - database models come from API sync
    const detailedSource: DetailedDataSource = dbModel.status?.[0] ? 'api' : 'cached';
    const dataLastVerified = dbModel.status?.[0]?.checkedAt || dbModel.updatedAt;

    return {
      id,
      slug: dbModel.slug,
      name: dbModel.name,
      provider: dbModel.provider?.name || 'Unknown',
      providerId: dbModel.providerId,
      description: dbModel.description,
      source: 'database',
      detailedSource,
      dataLastVerified,
      dataConfidence: detailedSource === 'api' ? 0.95 : 0.7,

      // DB metrics container
      db: {
        status: dbModel.status?.[0]?.status || 'unknown',
        availability: dbModel.status?.[0]?.availability,
        price: dbModel.pricing?.[0] ? {
          // FIXED: Use actual prices - already in per 1M format
          input: dbModel.pricing[0].inputPerMillion,
          output: dbModel.pricing[0].outputPerMillion,
          currency: dbModel.pricing[0].currency
        } : undefined,
        latency: dbModel.status?.[0] ? {
          p50: dbModel.status[0].latencyP50,
          p95: dbModel.status[0].latencyP95,
          p99: dbModel.status[0].latencyP99
        } : undefined,
        usage: dbModel.status?.[0]?.usage,
        region: dbModel.status?.[0]?.region,
        updatedAt: dbModel.updatedAt,
        dataSource: detailedSource
      },

      // Unified display fields from DB - FIXED: Use actual prices
      priceInput: dbModel.pricing?.[0]?.inputPerMillion || undefined,
      priceOutput: dbModel.pricing?.[0]?.outputPerMillion || undefined,
      status: dbModel.status?.[0]?.status || 'unknown',
      availability: dbModel.status?.[0]?.availability,
      contextWindow: dbModel.contextWindow,

      // Model metadata from DB
      modalities: dbModel.modalities || [],
      capabilities: dbModel.capabilities || [],
      foundationModel: dbModel.foundationModel,
      releasedAt: dbModel.releasedAt,
      isActive: dbModel.isActive,
      rankScore: Infinity, // DB models have lower priority in ranking
      lastUpdated: dbModel.updatedAt
    };
  }

  /**
   * Merge AA and DB models with AA priority
   */
  private static unifyModels(aaModels: UnifiedModel[], dbModels: UnifiedModel[]): UnifiedModel[] {
    const byId = new Map<string, UnifiedModel>();

    // 1) Add AA models first (primary data)
    for (const aaModel of aaModels) {
      byId.set(aaModel.id, { ...aaModel, source: 'artificial-analysis' });
    }

    // 2) Add or merge DB models
    for (const dbModel of dbModels) {
      const existing = byId.get(dbModel.id);

      if (!existing) {
        // No AA equivalent, add DB model
        byId.set(dbModel.id, { ...dbModel, source: 'database' });
      } else {
        // Merge DB data into existing AA model
        const merged: UnifiedModel = {
          ...existing,
          source: 'hybrid',

          // Use more reliable data source
          detailedSource: existing.detailedSource === 'api' ? 'api' :
                         (dbModel.detailedSource === 'api' ? 'api' :
                         (existing.detailedSource || dbModel.detailedSource || 'unknown')),
          dataLastVerified: (existing.dataLastVerified && dbModel.dataLastVerified)
            ? (new Date(existing.dataLastVerified) > new Date(dbModel.dataLastVerified)
              ? existing.dataLastVerified : dbModel.dataLastVerified)
            : (existing.dataLastVerified || dbModel.dataLastVerified),
          dataConfidence: Math.max(existing.dataConfidence || 0, dbModel.dataConfidence || 0),

          // Keep AA data but add DB supplementary info
          db: dbModel.db,

          // Enhance with DB data where AA lacks info
          status: existing.status === 'unknown' ? (dbModel.status || 'unknown') : existing.status,
          availability: existing.availability || dbModel.availability,

          // Use DB pricing if AA doesn't have it or DB is more detailed
          priceInput: existing.priceInput || dbModel.priceInput,
          priceOutput: existing.priceOutput || dbModel.priceOutput,

          // Merge capabilities and modalities
          modalities: [...new Set([...(existing.modalities || []), ...(dbModel.modalities || [])])],
          capabilities: [...new Set([...(existing.capabilities || []), ...(dbModel.capabilities || [])])],

          // Use more recent update time
          lastUpdated: (existing.lastUpdated && dbModel.lastUpdated)
            ? (existing.lastUpdated > dbModel.lastUpdated ? existing.lastUpdated : dbModel.lastUpdated)
            : (existing.lastUpdated || dbModel.lastUpdated || new Date().toISOString())
        };

        byId.set(dbModel.id, merged);
      }
    }

    return Array.from(byId.values());
  }

  /**
   * Sort unified models using the specified algorithm
   */
  private static sortUnifiedModels(models: UnifiedModel[]): UnifiedModel[] {
    return models.sort((a, b) => {
      // 1. AA Rank (lower is better)
      const rankA = a.aa?.rank ?? Infinity;
      const rankB = b.aa?.rank ?? Infinity;
      if (rankA !== rankB) return rankA - rankB;

      // 2. Intelligence Score (higher is better)
      const intA = a.intelligence ?? -1;
      const intB = b.intelligence ?? -1;
      if (intA !== intB) return intB - intA;

      // 3. Status weight (operational > degraded > unknown > down)
      const statusA = STATUS_WEIGHTS[a.status || 'unknown'];
      const statusB = STATUS_WEIGHTS[b.status || 'unknown'];
      if (statusA !== statusB) return statusB - statusA;

      // 4. Speed (higher is better)
      const speedA = a.speed ?? -1;
      const speedB = b.speed ?? -1;
      return speedB - speedA;
    });
  }

  /**
   * Apply filters to unified models
   */
  private static applyFilters(models: UnifiedModel[], filters: UnifiedModelFilters): UnifiedModel[] {
    return models.filter(model => {
      // Provider filter
      if (filters.provider && !model.provider.toLowerCase().includes(filters.provider.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status && model.status !== filters.status) {
        return false;
      }

      // Source filter
      if (filters.source && model.source !== filters.source) {
        return false;
      }

      // AA only filter
      if (filters.aaOnly && !model.aa) {
        return false;
      }

      // DB only filter
      if (filters.dbOnly && !model.db) {
        return false;
      }

      // Active status filter
      if (filters.isActive !== undefined && model.isActive !== filters.isActive) {
        return false;
      }

      // Price range filter
      if (filters.priceRange) {
        const inputPrice = model.priceInput;
        if (inputPrice !== undefined) {
          if (filters.priceRange.min && inputPrice < filters.priceRange.min) return false;
          if (filters.priceRange.max && inputPrice > filters.priceRange.max) return false;
        }
      }

      // Intelligence range filter
      if (filters.intelligenceRange && model.intelligence !== undefined) {
        if (filters.intelligenceRange.min && model.intelligence < filters.intelligenceRange.min) return false;
        if (filters.intelligenceRange.max && model.intelligence > filters.intelligenceRange.max) return false;
      }

      // Search query filter
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchableText = [
          model.name,
          model.provider,
          model.description,
          ...(model.capabilities || []),
          ...(model.modalities || [])
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Paginate results
   */
  private static paginateResults(
    models: UnifiedModel[],
    limit: number = 50,
    offset: number = 0
  ): { models: UnifiedModel[]; total: number; totalPages: number } {
    const total = models.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedModels = models.slice(offset, offset + limit);

    return { models: paginatedModels, total, totalPages };
  }

  /**
   * Get all unified models with optional filters and pagination
   */
  public static async getAll(
    filters: UnifiedModelFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<UnifiedModelResponse> {
    const cacheKey = JSON.stringify({ filters, limit, offset });
    const cached = this.cache.get(cacheKey);

    // Return cached result if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('📦 Returning cached unified models');
      return { ...cached.data, cached: true };
    }

    console.log('🔄 Fetching unified models from sources...');
    const startTime = Date.now();

    try {
      // Fetch AA models from database (primary) or fallback sources
      const aaModels = await this.loadAAModels();

      // Convert to unified format
      let unifiedModels = aaModels.map(model => this.convertAAModel(model));

      // Sort and filter AA models
      unifiedModels = this.sortUnifiedModels(unifiedModels);
      unifiedModels = this.applyFilters(unifiedModels, filters);

      // Paginate
      const { models: paginatedModels, total, totalPages } = this.paginateResults(
        unifiedModels,
        limit,
        offset
      );

      const response: UnifiedModelResponse = {
        models: paginatedModels,
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages,
        timestamp: new Date().toISOString(),
        dataSource: 'artificial-analysis',
        cached: false
      };

      // Cache the result
      this.cache.set(cacheKey, { data: response, timestamp: Date.now() });

      const duration = Date.now() - startTime;
      console.log(`✅ Unified models service completed in ${duration}ms`);
      console.log(`📊 Result: ${paginatedModels.length}/${total} AA models`);

      return response;

    } catch (error) {
      console.error('❌ Unified models service failed:', error);

      // Fallback response with error indication
      return {
        models: [],
        total: 0,
        limit,
        offset,
        page: 1,
        totalPages: 0,
        timestamp: new Date().toISOString(),
        dataSource: 'error',
        cached: false,
        fallbackReason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  public static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Unified models cache cleared');
  }

  /**
   * Get cache statistics
   */
  public static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}