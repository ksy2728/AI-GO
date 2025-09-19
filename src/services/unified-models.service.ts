import { ModelService } from './models.service';
import { HybridModelService } from './hybrid-models.service';
import {
  UnifiedModel,
  UnifiedModelFilters,
  UnifiedModelResponse,
  DataSource,
  AaMetrics,
  DbMetrics,
  STATUS_WEIGHTS,
  createModelId,
  normalizeProviderName
} from '@/types/unified-models';

// Static import for AA models - works in Vercel serverless
// Use relative path from src/services to src/data
import aaModelsStaticData from '../data/aa-models.json';

interface AAModel {
  rank: number;
  name: string;
  provider: string;
  slug: string;
  intelligence: number;
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
  private static CACHE_TTL = 60 * 1000; // 60 seconds

  /**
   * Safely fetch AA models with multiple fallback strategies
   */
  private static async safeFetchAaModels(): Promise<AAModel[]> {
    // First priority: Use static import data (always works in Vercel)
    try {
      // Build-time verification log
      const aaData = aaModelsStaticData as any;
      console.log('📦 AA Models Static Data Check:', {
        hasData: !!aaData,
        hasModels: !!aaData?.models,
        modelCount: aaData?.models?.length || 0,
        firstModel: aaData?.models?.[0]?.name || 'No models found'
      });

      const models = aaData.models || [];
      console.log(`✅ Loaded ${models.length} models from static import (build-time data)`);

      // Optionally try to fetch fresh data from GitHub (for 6-hour updates)
      // This is non-blocking - if it fails, we still have static data
      if (typeof window === 'undefined') { // Server-side only
        this.tryFetchFreshData();
      }

      return models;
    } catch (error) {
      console.error('❌ Failed to load static AA models:', error);
    }

    // Fallback to remote sources if static import fails
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
      const dbModels = await ModelService.getAll({
        limit: 1000, // Get all DB models
        offset: 0,
        ...filters
      });
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

    return {
      id,
      slug: aaModel.slug,
      name: aaModel.name,
      provider: aaModel.provider,
      description: `${aaModel.name} - Intelligence: ${aaModel.intelligence}, Speed: ${aaModel.outputSpeed}`,
      source: 'artificial-analysis',

      // AA metrics container
      aa: {
        intelligence: aaModel.intelligence,
        speed: aaModel.outputSpeed,
        rank: aaModel.rank,
        inputPrice: aaModel.inputPrice,
        outputPrice: aaModel.outputPrice,
        contextWindow: aaModel.contextWindow,
        category: aaModel.category,
        trend: aaModel.trend,
        lastUpdated: aaModel.lastUpdated
      },

      // Unified display fields from AA
      intelligence: aaModel.intelligence,
      speed: aaModel.outputSpeed,
      priceInput: aaModel.inputPrice,
      priceOutput: aaModel.outputPrice,
      contextWindow: aaModel.contextWindow,
      status: 'unknown',

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

    return {
      id,
      slug: dbModel.slug,
      name: dbModel.name,
      provider: dbModel.provider?.name || 'Unknown',
      providerId: dbModel.providerId,
      description: dbModel.description,
      source: 'database',

      // DB metrics container
      db: {
        status: dbModel.status?.[0]?.status || 'unknown',
        availability: dbModel.status?.[0]?.availability,
        price: dbModel.pricing?.[0] ? {
          input: dbModel.pricing[0].inputPerMillion / 1000, // Convert to per 1K
          output: dbModel.pricing[0].outputPerMillion / 1000,
          currency: dbModel.pricing[0].currency
        } : undefined,
        latency: dbModel.status?.[0] ? {
          p50: dbModel.status[0].latencyP50,
          p95: dbModel.status[0].latencyP95,
          p99: dbModel.status[0].latencyP99
        } : undefined,
        usage: dbModel.status?.[0]?.usage,
        region: dbModel.status?.[0]?.region,
        updatedAt: dbModel.updatedAt
      },

      // Unified display fields from DB
      priceInput: dbModel.pricing?.[0]?.inputPerMillion ? dbModel.pricing[0].inputPerMillion / 1000 : undefined,
      priceOutput: dbModel.pricing?.[0]?.outputPerMillion ? dbModel.pricing[0].outputPerMillion / 1000 : undefined,
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
          lastUpdated: existing.lastUpdated > dbModel.lastUpdated ? existing.lastUpdated : dbModel.lastUpdated
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
      // Fetch only AA models (high-quality, real-time data)
      const aaModels = await this.safeFetchAaModels();

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