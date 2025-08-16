/**
 * GitHub JSON Data Service
 * Fetches model data from GitHub repository instead of database
 */

interface GitHubData {
  version: string;
  lastUpdated: string;
  providers: any[];
  models: any[];
  benchmarkSuites: any[];
  statistics: {
    totalModels: number;
    activeModels: number;
    totalProviders: number;
    operationalModels: number;
    avgAvailability: number;
  };
}

interface StatusData {
  version: string;
  lastUpdated: string;
  statuses: Record<string, any>;
}

interface PricingData {
  pricing: any[];
}

interface BenchmarksData {
  benchmarks: any[];
  benchmarkSuites?: any[];
}

export class GitHubDataService {
  private static dataCache: GitHubData | null = null;
  private static statusCache: StatusData | null = null;
  private static pricingCache: PricingData | null = null;
  private static benchmarksCache: BenchmarksData | null = null;
  private static cacheTimestamp: number = 0;
  private static statusCacheTimestamp: number = 0;
  private static pricingCacheTimestamp: number = 0;
  private static benchmarksCacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly STATUS_CACHE_DURATION = 1 * 60 * 1000; // 1 minute

  /**
   * Get GitHub raw content URL based on environment
   */
  private static getDataUrl(filename: string): string {
    // Check if we're in production environment (Vercel)
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' || 
                        process.env.VERCEL_ENV !== undefined;
    
    // In production, use GitHub raw URL
    if (isProduction) {
      // Use the current repository for data storage
      const repo = process.env.GITHUB_REPO || 'kim-soo-young/ai-server-information';
      const branch = process.env.GITHUB_BRANCH || 'master';
      return `https://raw.githubusercontent.com/${repo}/${branch}/data/${filename}`;
    }
    
    // In development, use local files
    return `/data/${filename}`;
  }

  /**
   * Fetch data from GitHub or local file
   */
  private static async fetchData<T>(filename: string): Promise<T> {
    const url = this.getDataUrl(filename);
    
    try {
      // Check if we're in production environment (Vercel)
      const isProduction = process.env.NODE_ENV === 'production' || 
                          process.env.VERCEL === '1' || 
                          process.env.VERCEL_ENV !== undefined;
      
      // In development, read local file
      if (!isProduction) {
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join(process.cwd(), 'data', filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
      }
      
      // In production, fetch from GitHub
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache' // Force fresh data
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filename}: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Get all model data
   */
  static async getAllData(): Promise<GitHubData> {
    const now = Date.now();
    
    // Check cache
    if (this.dataCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('📦 Using cached GitHub data');
      return this.dataCache;
    }
    
    console.log('🔄 Fetching fresh data from GitHub');
    this.dataCache = await this.fetchData<GitHubData>('models.json');
    this.cacheTimestamp = now;
    
    return this.dataCache;
  }

  /**
   * Get status data (more frequently updated)
   */
  static async getStatusData(): Promise<StatusData> {
    const now = Date.now();
    
    // Check cache
    if (this.statusCache && (now - this.statusCacheTimestamp) < this.STATUS_CACHE_DURATION) {
      console.log('📦 Using cached status data');
      return this.statusCache;
    }
    
    console.log('🔄 Fetching fresh status from GitHub');
    this.statusCache = await this.fetchData<StatusData>('model-status.json');
    this.statusCacheTimestamp = now;
    
    // Merge status with main data
    if (this.dataCache) {
      const statuses = this.statusCache.statuses;
      this.dataCache.models = this.dataCache.models.map(model => ({
        ...model,
        status: statuses[model.slug] || model.status
      }));
    }
    
    return this.statusCache;
  }

  /**
   * Get pricing data
   */
  static async getPricingData(): Promise<PricingData> {
    const now = Date.now();
    
    // Check cache
    if (this.pricingCache && (now - this.pricingCacheTimestamp) < this.CACHE_DURATION) {
      console.log('📦 Using cached pricing data');
      return this.pricingCache;
    }
    
    console.log('🔄 Fetching fresh pricing from GitHub');
    try {
      this.pricingCache = await this.fetchData<PricingData>('pricing-data.json');
      this.pricingCacheTimestamp = now;
    } catch (error) {
      console.warn('⚠️ Failed to fetch pricing data:', error);
      this.pricingCache = { pricing: [] };
    }
    
    return this.pricingCache;
  }

  /**
   * Get benchmarks data
   */
  static async getBenchmarksData(): Promise<BenchmarksData> {
    const now = Date.now();
    
    // Check cache
    if (this.benchmarksCache && (now - this.benchmarksCacheTimestamp) < this.CACHE_DURATION) {
      console.log('📦 Using cached benchmarks data');
      return this.benchmarksCache;
    }
    
    console.log('🔄 Fetching fresh benchmarks from GitHub');
    try {
      this.benchmarksCache = await this.fetchData<BenchmarksData>('benchmarks-data.json');
      this.benchmarksCacheTimestamp = now;
    } catch (error) {
      console.warn('⚠️ Failed to fetch benchmarks data:', error);
      this.benchmarksCache = { benchmarks: [] };
    }
    
    return this.benchmarksCache;
  }

  /**
   * Get all models with optional filters
   */
  static async getAllModels(filters: any = {}) {
    const data = await this.getAllData();
    const statusData = await this.getStatusData();
    const pricingData = await this.getPricingData();
    const benchmarksData = await this.getBenchmarksData();
    
    let models = data.models;
    
    // Fix data structure compatibility and merge related data
    models = models.map(model => {
      // Handle modalities field - might be array, string, or missing
      let modalities = model.modalities;
      
      // If modalities doesn't exist but type does (old format)
      if (!modalities && model.type) {
        // If type is a JSON string, parse it
        if (typeof model.type === 'string' && model.type.startsWith('[')) {
          try {
            modalities = JSON.parse(model.type);
          } catch {
            modalities = ['text']; // Default fallback
          }
        } else if (typeof model.type === 'string') {
          modalities = [model.type];
        } else {
          modalities = model.type;
        }
      }
      
      // Ensure modalities is always an array
      if (!Array.isArray(modalities)) {
        modalities = ['text'];
      }
      
      // Find and attach pricing data
      const modelPricing = pricingData.pricing.filter(p => 
        p.modelName === model.name || 
        p.id === model.slug ||
        p.id === model.name.toLowerCase().replace(/\s+/g, '-')
      );
      
      // Find and attach benchmark data
      const modelBenchmarks = benchmarksData.benchmarks.filter(b =>
        b.modelName === model.name ||
        b.modelId === model.slug ||
        b.modelName.toLowerCase() === model.name.toLowerCase()
      );
      
      // Transform benchmark data to match expected structure
      const benchmarkScores = modelBenchmarks.map(b => ({
        id: b.id,
        modelId: model.id,
        suiteId: b.benchmarkName,
        suite: {
          name: b.benchmarkName,
          description: b.description || '',
          maxScore: b.maxScore || 100,
          category: b.category
        },
        scoreRaw: b.score,
        scoreNormalized: b.maxScore ? (b.score / b.maxScore) : (b.score / 100),
        percentile: b.percentile,
        evaluationDate: b.date,
        isOfficial: true,
        metadata: {
          category: b.category
        }
      }));
      
      // Transform pricing data to match expected structure
      const pricing = modelPricing.map(p => ({
        id: p.id,
        modelId: model.id,
        tier: p.tier,
        currency: p.currency,
        inputPerMillion: p.inputPrice,
        outputPerMillion: p.outputPrice,
        imagePerUnit: p.imagePrice,
        audioPerMinute: p.audioPrice,
        videoPerMinute: p.videoPrice,
        contextWindow: p.contextWindow,
        rateLimit: p.rateLimit,
        features: p.features,
        limitations: p.limitations,
        effectiveFrom: p.lastUpdated || new Date().toISOString(),
        region: p.region || 'global'
      }));
      
      return {
        ...model,
        modalities,
        status: statusData.statuses[model.slug] || model.status || [],
        pricing: pricing.length > 0 ? pricing : undefined,
        benchmarkScores: benchmarkScores.length > 0 ? benchmarkScores : undefined
      };
    });
    
    // Apply filters
    if (filters.provider) {
      models = models.filter(model =>
        model.provider?.id === filters.provider || 
        model.provider?.slug === filters.provider ||
        model.providerId === filters.provider
      );
    }
    
    if (filters.isActive !== undefined) {
      models = models.filter(model =>
        model.isActive === filters.isActive
      );
    }
    
    if (filters.modalities?.length > 0) {
      models = models.filter(model =>
        filters.modalities.some((m: string) =>
          model.modalities.includes(m)
        )
      );
    }
    
    if (filters.capabilities?.length > 0) {
      models = models.filter(model =>
        filters.capabilities.some((c: string) =>
          model.capabilities.includes(c)
        )
      );
    }
    
    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginated = models.slice(offset, offset + limit);
    
    return paginated;
  }

  /**
   * Get model by slug
   */
  static async getModelBySlug(slug: string) {
    const data = await this.getAllData();
    const statusData = await this.getStatusData();
    const pricingData = await this.getPricingData();
    const benchmarksData = await this.getBenchmarksData();
    
    const model = data.models.find(m => m.slug === slug);
    
    if (!model) return null;
    
    // Add status data
    if (statusData.statuses[slug]) {
      model.status = [statusData.statuses[slug]];
    }
    
    // Find and attach pricing data
    const modelPricing = pricingData.pricing.filter(p => 
      p.modelName === model.name || 
      p.id === model.slug ||
      p.id === model.name.toLowerCase().replace(/\s+/g, '-')
    );
    
    // Find and attach benchmark data
    const modelBenchmarks = benchmarksData.benchmarks.filter(b =>
      b.modelName === model.name ||
      b.modelId === model.slug ||
      b.modelName.toLowerCase() === model.name.toLowerCase()
    );
    
    // Transform benchmark data to match expected structure
    const benchmarkScores = modelBenchmarks.map(b => ({
      id: b.id,
      modelId: model.id,
      suiteId: b.benchmarkName,
      suite: {
        name: b.benchmarkName,
        description: b.description || '',
        maxScore: b.maxScore || 100,
        category: b.category
      },
      scoreRaw: b.score,
      scoreNormalized: b.maxScore ? (b.score / b.maxScore) : (b.score / 100),
      percentile: b.percentile,
      evaluationDate: b.date,
      isOfficial: true,
      metadata: {
        category: b.category
      }
    }));
    
    // Transform pricing data to match expected structure
    const pricing = modelPricing.map(p => ({
      id: p.id,
      modelId: model.id,
      tier: p.tier,
      currency: p.currency,
      inputPerMillion: p.inputPrice,
      outputPerMillion: p.outputPrice,
      imagePerUnit: p.imagePrice,
      audioPerMinute: p.audioPrice,
      videoPerMinute: p.videoPrice,
      contextWindow: p.contextWindow,
      rateLimit: p.rateLimit,
      features: p.features,
      limitations: p.limitations,
      effectiveFrom: p.lastUpdated || new Date().toISOString(),
      region: p.region || 'global'
    }));
    
    return {
      ...model,
      status: model.status || [],
      pricing: pricing.length > 0 ? pricing : [],
      benchmarkScores: benchmarkScores.length > 0 ? benchmarkScores : []
    };
  }

  /**
   * Get system statistics
   */
  static async getSystemStats() {
    const data = await this.getAllData();
    const statusData = await this.getStatusData();
    
    // Update statistics with latest status
    const models = data.models.map(model => ({
      ...model,
      status: statusData.statuses[model.slug] || model.status
    }));
    
    const operationalModels = models.filter(m => m.status?.status === 'operational').length;
    const degradedModels = models.filter(m => m.status?.status === 'degraded').length;
    const outageModels = models.filter(m => m.status?.status === 'outage').length;
    const avgAvailability = models.reduce((sum, m) => sum + (m.status?.availability || 0), 0) / models.length;
    
    return {
      totalModels: data.statistics.totalModels,
      activeModels: data.statistics.activeModels,
      providers: data.statistics.totalProviders,
      avgAvailability: Math.round(avgAvailability * 10) / 10,
      operationalModels,
      degradedModels,
      outageModels,
      totalBenchmarks: models.reduce((sum, m) => sum + (m.benchmarks?.length || 0), 0),
      lastUpdated: statusData.lastUpdated,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear cache (useful for forcing refresh)
   */
  static clearCache() {
    this.dataCache = null;
    this.statusCache = null;
    this.pricingCache = null;
    this.benchmarksCache = null;
    this.cacheTimestamp = 0;
    this.statusCacheTimestamp = 0;
    this.pricingCacheTimestamp = 0;
    this.benchmarksCacheTimestamp = 0;
    console.log('🗑️ Cache cleared');
  }
}