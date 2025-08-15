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

export class GitHubDataService {
  private static dataCache: GitHubData | null = null;
  private static statusCache: StatusData | null = null;
  private static cacheTimestamp: number = 0;
  private static statusCacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly STATUS_CACHE_DURATION = 1 * 60 * 1000; // 1 minute

  /**
   * Get GitHub raw content URL based on environment
   */
  private static getDataUrl(filename: string): string {
    // In production, use GitHub raw URL
    if (process.env.NODE_ENV === 'production') {
      const repo = process.env.GITHUB_REPO || 'ksy2728/AI-GO';
      const branch = process.env.GITHUB_BRANCH || 'main';
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
      // In development, read local file
      if (process.env.NODE_ENV !== 'production') {
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
   * Get all models with optional filters
   */
  static async getAllModels(filters: any = {}) {
    const data = await this.getAllData();
    const statusData = await this.getStatusData();
    
    let models = data.models;
    
    // Merge latest status
    models = models.map(model => ({
      ...model,
      status: statusData.statuses[model.slug] || model.status
    }));
    
    // Apply filters
    if (filters.provider) {
      models = models.filter(model =>
        model.provider.slug === filters.provider
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
    
    const model = data.models.find(m => m.slug === slug);
    
    if (model && statusData.statuses[slug]) {
      model.status = statusData.statuses[slug];
    }
    
    return model || null;
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
    this.cacheTimestamp = 0;
    this.statusCacheTimestamp = 0;
    console.log('🗑️ Cache cleared');
  }
}