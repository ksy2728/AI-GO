// Advanced Rate Limiting with Redis Support
import { redisManager } from '../redis/redis-client';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDuration?: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  totalHits: number;
  isBlocked?: boolean;
  blockExpiresAt?: number;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  isBlocked?: boolean;
  blockExpiresAt?: number;
}

class RateLimiterService {
  private static instance: RateLimiterService;
  private inMemoryStore = new Map<string, AttemptRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Default configurations for different use cases
  private static readonly DEFAULT_CONFIGS = {
    LOGIN: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 30 * 60 * 1000, // 30 minutes block after max attempts
      keyPrefix: 'auth:login:',
    },
    API: {
      maxAttempts: 100,
      windowMs: 60 * 1000, // 1 minute
      keyPrefix: 'api:rate:',
    },
    PASSWORD_RESET: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDuration: 2 * 60 * 60 * 1000, // 2 hours block
      keyPrefix: 'auth:reset:',
    },
  } as const;

  private constructor() {
    this.initializeCleanup();
    this.initializeRedis();
  }

  static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  private async initializeRedis(): Promise<void> {
    try {
      await redisManager.connect();
      console.log('🔄 Rate limiter Redis integration ready');
    } catch (error) {
      console.warn('⚠️ Rate limiter falling back to in-memory storage:', (error as Error).message);
    }
  }

  private initializeCleanup(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, record] of this.inMemoryStore.entries()) {
      const isWindowExpired = now - record.firstAttempt > 24 * 60 * 60 * 1000; // 24 hours max retention
      const isBlockExpired = record.isBlocked && record.blockExpiresAt && now > record.blockExpiresAt;

      if (isWindowExpired || isBlockExpired) {
        this.inMemoryStore.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Rate limiter cleaned up ${cleanedCount} expired entries`);
    }
  }

  /**
   * Check if an identifier is within rate limits
   */
  async checkRateLimit(
    identifier: string,
    configType: keyof typeof RateLimiterService.DEFAULT_CONFIGS = 'LOGIN'
  ): Promise<RateLimitResult> {
    const config = RateLimiterService.DEFAULT_CONFIGS[configType];
    return this.checkCustomRateLimit(identifier, config);
  }

  /**
   * Check rate limit with custom configuration
   */
  async checkCustomRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${config.keyPrefix || 'rate:'}${identifier}`;
    const now = Date.now();

    try {
      // Try Redis first
      if (redisManager.isRedisAvailable()) {
        return await this.checkRedisRateLimit(key, config, now);
      }
    } catch (error) {
      console.warn('⚠️ Redis rate limit check failed, falling back to memory:', (error as Error).message);
    }

    // Fallback to in-memory
    return this.checkMemoryRateLimit(key, config, now);
  }

  private async checkRedisRateLimit(
    key: string,
    config: RateLimitConfig,
    now: number
  ): Promise<RateLimitResult> {
    const client = redisManager.getClient();
    if (!client) throw new Error('Redis client not available');

    const multi = client.multi();
    const dataKey = `${key}:data`;
    const blockKey = `${key}:block`;

    // Check if blocked
    const blockExpiry = await client.get(blockKey);
    if (blockExpiry && parseInt(blockExpiry) > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: parseInt(blockExpiry),
        totalHits: config.maxAttempts,
        isBlocked: true,
        blockExpiresAt: parseInt(blockExpiry),
      };
    }

    // Get current attempts data
    const record = await client.hgetall(dataKey);
    let attemptRecord: AttemptRecord;

    if (record && record.count) {
      attemptRecord = {
        count: parseInt(record.count),
        firstAttempt: parseInt(record.firstAttempt),
        lastAttempt: parseInt(record.lastAttempt),
      };
    } else {
      attemptRecord = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
      };
    }

    // Check if window has expired
    const windowExpired = now - attemptRecord.firstAttempt > config.windowMs;
    if (windowExpired) {
      attemptRecord = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      };
    } else {
      attemptRecord.count++;
      attemptRecord.lastAttempt = now;
    }

    const allowed = attemptRecord.count <= config.maxAttempts;
    const remainingAttempts = Math.max(0, config.maxAttempts - attemptRecord.count);

    // Update Redis
    const ttl = Math.ceil(config.windowMs / 1000);
    multi.hset(dataKey, {
      count: attemptRecord.count.toString(),
      firstAttempt: attemptRecord.firstAttempt.toString(),
      lastAttempt: attemptRecord.lastAttempt.toString(),
    });
    multi.expire(dataKey, ttl);

    // If exceeded and block duration is set, create block
    if (!allowed && config.blockDuration) {
      const blockExpiry = now + config.blockDuration;
      multi.setex(blockKey, Math.ceil(config.blockDuration / 1000), blockExpiry.toString());
    }

    await multi.exec();

    const resetTime = attemptRecord.firstAttempt + config.windowMs;

    return {
      allowed,
      remainingAttempts,
      resetTime,
      totalHits: attemptRecord.count,
    };
  }

  private checkMemoryRateLimit(
    key: string,
    config: RateLimitConfig,
    now: number
  ): RateLimitResult {
    let record = this.inMemoryStore.get(key);

    // Check if blocked
    if (record?.isBlocked && record.blockExpiresAt && now < record.blockExpiresAt) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: record.blockExpiresAt,
        totalHits: record.count,
        isBlocked: true,
        blockExpiresAt: record.blockExpiresAt,
      };
    }

    // Initialize or reset if window expired
    if (!record || now - record.firstAttempt > config.windowMs) {
      record = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      };
    } else {
      record.count++;
      record.lastAttempt = now;
    }

    const allowed = record.count <= config.maxAttempts;
    const remainingAttempts = Math.max(0, config.maxAttempts - record.count);

    // If exceeded and block duration is set, create block
    if (!allowed && config.blockDuration) {
      record.isBlocked = true;
      record.blockExpiresAt = now + config.blockDuration;
    }

    this.inMemoryStore.set(key, record);

    const resetTime = record.firstAttempt + config.windowMs;

    return {
      allowed,
      remainingAttempts,
      resetTime,
      totalHits: record.count,
    };
  }

  /**
   * Clear rate limit for an identifier
   */
  async clearRateLimit(
    identifier: string,
    configType: keyof typeof RateLimiterService.DEFAULT_CONFIGS = 'LOGIN'
  ): Promise<void> {
    const config = RateLimiterService.DEFAULT_CONFIGS[configType];
    const key = `${config.keyPrefix}${identifier}`;

    try {
      if (redisManager.isRedisAvailable()) {
        const client = redisManager.getClient();
        if (client) {
          await client.del(`${key}:data`, `${key}:block`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Redis clear rate limit failed:', (error as Error).message);
    }

    // Also clear from memory
    this.inMemoryStore.delete(key);
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(
    identifier: string,
    configType: keyof typeof RateLimiterService.DEFAULT_CONFIGS = 'LOGIN'
  ): Promise<Omit<RateLimitResult, 'allowed'>> {
    const config = RateLimiterService.DEFAULT_CONFIGS[configType];
    const key = `${config.keyPrefix}${identifier}`;
    const now = Date.now();

    try {
      if (redisManager.isRedisAvailable()) {
        const client = redisManager.getClient();
        if (client) {
          const [blockExpiry, record] = await Promise.all([
            client.get(`${key}:block`),
            client.hgetall(`${key}:data`),
          ]);

          if (blockExpiry && parseInt(blockExpiry) > now) {
            return {
              remainingAttempts: 0,
              resetTime: parseInt(blockExpiry),
              totalHits: config.maxAttempts,
              isBlocked: true,
              blockExpiresAt: parseInt(blockExpiry),
            };
          }

          if (record && record.count) {
            const count = parseInt(record.count);
            const firstAttempt = parseInt(record.firstAttempt);
            return {
              remainingAttempts: Math.max(0, config.maxAttempts - count),
              resetTime: firstAttempt + config.windowMs,
              totalHits: count,
            };
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Redis get rate limit status failed:', (error as Error).message);
    }

    // Fallback to memory
    const record = this.inMemoryStore.get(key);
    if (!record) {
      return {
        remainingAttempts: config.maxAttempts,
        resetTime: now + config.windowMs,
        totalHits: 0,
      };
    }

    if (record.isBlocked && record.blockExpiresAt && now < record.blockExpiresAt) {
      return {
        remainingAttempts: 0,
        resetTime: record.blockExpiresAt,
        totalHits: record.count,
        isBlocked: true,
        blockExpiresAt: record.blockExpiresAt,
      };
    }

    return {
      remainingAttempts: Math.max(0, config.maxAttempts - record.count),
      resetTime: record.firstAttempt + config.windowMs,
      totalHits: record.count,
    };
  }

  /**
   * Get system stats for monitoring
   */
  getSystemStats() {
    return {
      redisConnected: redisManager.isRedisAvailable(),
      inMemoryEntries: this.inMemoryStore.size,
      cleanupActive: this.cleanupInterval !== null,
    };
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.inMemoryStore.clear();
    await redisManager.disconnect();
  }
}

export const rateLimiter = RateLimiterService.getInstance();
export type { RateLimitResult, RateLimitConfig };
export default rateLimiter;