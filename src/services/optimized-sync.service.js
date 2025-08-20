const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Optimized Sync Service with caching and smart updates
 * Designed for global 24/7 operation without timezone-specific optimizations
 */
class OptimizedSyncService {
  constructor() {
    // In-memory cache with TTL
    this.cache = new Map();
    this.CACHE_TTL = 60000; // 1 minute cache
    
    // Track last sync times
    this.lastSync = {
      priority: 0,
      full: 0,
      github: 0
    };
    
    // Priority models for frequent updates
    this.priorityModels = [
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo',
      'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku',
      'gemini-pro', 'gemini-ultra',
      'llama-3', 'mistral-large'
    ];
    
    // Sync intervals (in milliseconds)
    this.intervals = {
      priority: 5 * 60 * 1000,    // 5 minutes for priority models
      active: 30 * 60 * 1000,      // 30 minutes for active models
      full: 6 * 60 * 60 * 1000,    // 6 hours for all models
      github: 60 * 60 * 1000       // 1 hour for GitHub backup check
    };
    
    // Performance metrics
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      lastError: null
    };
    
    // Rate limiting
    this.rateLimiter = {
      maxCallsPerMinute: 60,
      calls: [],
      isLimited: false
    };
  }

  /**
   * Initialize the sync service
   */
  async initialize() {
    console.log('🚀 Optimized Sync Service initializing...');
    
    // Load initial data from GitHub if available
    await this.loadGitHubBackup();
    
    // Start sync intervals
    this.startSyncIntervals();
    
    console.log('✅ Optimized Sync Service initialized');
    return true;
  }

  /**
   * Start all sync intervals
   */
  startSyncIntervals() {
    // Priority models sync (5 minutes)
    setInterval(() => this.syncPriorityModels(), this.intervals.priority);
    
    // Active models sync (30 minutes)
    setInterval(() => this.syncActiveModels(), this.intervals.active);
    
    // Full sync (6 hours)
    setInterval(() => this.syncAllModels(), this.intervals.full);
    
    // GitHub backup check (1 hour)
    setInterval(() => this.checkGitHubBackup(), this.intervals.github);
    
    // Initial sync
    this.syncPriorityModels();
  }

  /**
   * Get data with caching
   */
  async getCachedData(key, fetchFunction) {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.metrics.cacheHits++;
      return cached.data;
    }
    
    // Check rate limiting
    if (await this.isRateLimited()) {
      console.warn('⚠️ Rate limited, returning cached data or null');
      return cached ? cached.data : null;
    }
    
    // Fetch fresh data
    try {
      this.metrics.cacheMisses++;
      this.metrics.apiCalls++;
      
      const freshData = await fetchFunction();
      
      // Update cache
      this.cache.set(key, {
        data: freshData,
        timestamp: Date.now()
      });
      
      return freshData;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error.message;
      console.error(`❌ Error fetching ${key}:`, error.message);
      
      // Return cached data if available
      return cached ? cached.data : null;
    }
  }

  /**
   * Rate limiting check
   */
  async isRateLimited() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old calls
    this.rateLimiter.calls = this.rateLimiter.calls.filter(
      time => time > oneMinuteAgo
    );
    
    // Check if limited
    if (this.rateLimiter.calls.length >= this.rateLimiter.maxCallsPerMinute) {
      this.rateLimiter.isLimited = true;
      return true;
    }
    
    // Add current call
    this.rateLimiter.calls.push(now);
    this.rateLimiter.isLimited = false;
    return false;
  }

  /**
   * Sync priority models (5 minutes)
   */
  async syncPriorityModels() {
    console.log('🎯 Syncing priority models...');
    const startTime = Date.now();
    
    try {
      const models = await prisma.model.findMany({
        where: {
          slug: { in: this.priorityModels },
          isActive: true
        },
        include: { provider: true }
      });
      
      let updated = 0;
      for (const model of models) {
        const status = await this.getCachedData(
          `status:${model.slug}`,
          () => this.fetchModelStatus(model)
        );
        
        if (status) {
          await this.updateModelStatus(model.id, status);
          updated++;
        }
        
        // Small delay to prevent overwhelming
        await this.sleep(100);
      }
      
      this.lastSync.priority = Date.now();
      const duration = Date.now() - startTime;
      
      console.log(`✅ Priority sync completed: ${updated}/${models.length} models in ${duration}ms`);
      
      // Broadcast update if Socket.IO is available
      if (global.io) {
        global.io.emit('sync:priority', {
          modelsUpdated: updated,
          duration,
          timestamp: new Date().toISOString()
        });
      }
      
      return { success: true, updated, duration };
    } catch (error) {
      console.error('❌ Priority sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync active models (30 minutes)
   */
  async syncActiveModels() {
    console.log('🔄 Syncing active models...');
    const startTime = Date.now();
    
    try {
      // Skip if recently done in full sync
      if (Date.now() - this.lastSync.full < this.intervals.active) {
        console.log('ℹ️ Skipping active sync, recently done in full sync');
        return { success: true, skipped: true };
      }
      
      const models = await prisma.model.findMany({
        where: {
          isActive: true,
          slug: { notIn: this.priorityModels } // Exclude priority models
        },
        include: { provider: true },
        take: 50 // Limit to prevent overload
      });
      
      let updated = 0;
      const batchSize = 10;
      
      for (let i = 0; i < models.length; i += batchSize) {
        const batch = models.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (model) => {
          const status = await this.getCachedData(
            `status:${model.slug}`,
            () => this.fetchModelStatus(model)
          );
          
          if (status) {
            await this.updateModelStatus(model.id, status);
            updated++;
          }
        }));
        
        // Delay between batches
        await this.sleep(500);
      }
      
      this.lastSync.active = Date.now();
      const duration = Date.now() - startTime;
      
      console.log(`✅ Active sync completed: ${updated}/${models.length} models in ${duration}ms`);
      
      return { success: true, updated, duration };
    } catch (error) {
      console.error('❌ Active sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync all models (6 hours)
   */
  async syncAllModels() {
    console.log('🌍 Starting full sync of all models...');
    const startTime = Date.now();
    
    try {
      const models = await prisma.model.findMany({
        include: { provider: true }
      });
      
      let updated = 0;
      const batchSize = 20;
      
      for (let i = 0; i < models.length; i += batchSize) {
        const batch = models.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (model) => {
          const status = await this.getCachedData(
            `status:${model.slug}`,
            () => this.fetchModelStatus(model)
          );
          
          if (status) {
            await this.updateModelStatus(model.id, status);
            updated++;
          }
        }));
        
        // Progress log
        if (i % 100 === 0 && i > 0) {
          console.log(`  Progress: ${i}/${models.length} models processed`);
        }
        
        // Longer delay for full sync
        await this.sleep(1000);
      }
      
      this.lastSync.full = Date.now();
      const duration = Date.now() - startTime;
      
      console.log(`✅ Full sync completed: ${updated}/${models.length} models in ${duration}ms`);
      
      // Clear cache after full sync
      this.cache.clear();
      
      return { success: true, updated, duration };
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load backup data from GitHub
   */
  async loadGitHubBackup() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const dataPath = path.join(process.cwd(), 'data', 'models.json');
      const exists = await fs.access(dataPath).then(() => true).catch(() => false);
      
      if (exists) {
        const data = await fs.readFile(dataPath, 'utf-8');
        const parsed = JSON.parse(data);
        
        // Cache GitHub data
        if (parsed.models) {
          parsed.models.forEach(model => {
            this.cache.set(`github:${model.id}`, {
              data: model,
              timestamp: Date.now()
            });
          });
        }
        
        console.log(`📦 Loaded ${parsed.models?.length || 0} models from GitHub backup`);
        this.lastSync.github = Date.now();
        
        return parsed;
      }
    } catch (error) {
      console.warn('⚠️ Could not load GitHub backup:', error.message);
    }
    
    return null;
  }

  /**
   * Check and use GitHub backup if needed
   */
  async checkGitHubBackup() {
    // Only use GitHub backup if API calls are failing
    if (this.metrics.errors > 10 || this.rateLimiter.isLimited) {
      console.log('🔄 High error rate or rate limited, checking GitHub backup...');
      await this.loadGitHubBackup();
    }
  }

  /**
   * Fetch model status (mock implementation - replace with actual API calls)
   */
  async fetchModelStatus(model) {
    // This is where you would call the actual provider APIs
    // For now, returning simulated data
    
    // Check GitHub backup first if API is failing
    if (this.metrics.errors > 5) {
      const githubData = this.cache.get(`github:${model.id}`);
      if (githubData) {
        return githubData.data.status;
      }
    }
    
    // Simulate API call
    const isOperational = Math.random() > 0.05;
    const availability = isOperational ? 95 + Math.random() * 5 : 70 + Math.random() * 20;
    
    return {
      status: isOperational ? 'operational' : (Math.random() > 0.5 ? 'degraded' : 'outage'),
      availability,
      latencyP50: Math.floor(50 + Math.random() * 150),
      latencyP95: Math.floor(100 + Math.random() * 300),
      latencyP99: Math.floor(200 + Math.random() * 500),
      errorRate: isOperational ? Math.random() * 2 : Math.random() * 10,
      requestsPerMin: Math.floor(Math.random() * 1000),
      tokensPerMin: Math.floor(Math.random() * 100000)
    };
  }

  /**
   * Update model status in database
   */
  async updateModelStatus(modelId, status) {
    try {
      await prisma.modelStatus.upsert({
        where: {
          modelId_region: {
            modelId,
            region: 'global'
          }
        },
        update: {
          ...status,
          checkedAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          modelId,
          region: 'global',
          ...status,
          checkedAt: new Date()
        }
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to update status for model ${modelId}:`, error.message);
      return false;
    }
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    const cacheSize = this.cache.size;
    const hitRate = this.metrics.cacheHits / 
      (this.metrics.cacheHits + this.metrics.cacheMisses || 1);
    
    return {
      ...this.metrics,
      cacheSize,
      hitRate: (hitRate * 100).toFixed(2) + '%',
      rateLimited: this.rateLimiter.isLimited,
      lastSync: {
        priority: this.lastSync.priority ? new Date(this.lastSync.priority).toISOString() : 'Never',
        active: this.lastSync.active ? new Date(this.lastSync.active).toISOString() : 'Never',
        full: this.lastSync.full ? new Date(this.lastSync.full).toISOString() : 'Never',
        github: this.lastSync.github ? new Date(this.lastSync.github).toISOString() : 'Never'
      }
    };
  }

  /**
   * Force sync specific models
   */
  async forceSyncModels(modelIds) {
    console.log(`🔄 Force syncing ${modelIds.length} models...`);
    
    const models = await prisma.model.findMany({
      where: { id: { in: modelIds } },
      include: { provider: true }
    });
    
    let updated = 0;
    for (const model of models) {
      // Clear cache for forced sync
      this.cache.delete(`status:${model.slug}`);
      
      const status = await this.fetchModelStatus(model);
      if (status) {
        await this.updateModelStatus(model.id, status);
        updated++;
      }
    }
    
    return { success: true, updated };
  }

  /**
   * Clear cache
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 Cleared ${size} cached items`);
    return { cleared: size };
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup on shutdown
   */
  async cleanup() {
    console.log('🧹 Cleaning up Optimized Sync Service...');
    this.cache.clear();
    await prisma.$disconnect();
  }
}

// Export singleton instance
const optimizedSyncService = new OptimizedSyncService();

module.exports = { optimizedSyncService, OptimizedSyncService };