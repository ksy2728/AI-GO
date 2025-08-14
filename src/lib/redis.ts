import Redis from 'ioredis'

// Create Redis client only if REDIS_URL is provided
let redis: Redis | null = null

if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      lazyConnect: true, // Connect only when needed
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
    })

    redis.on('connect', () => {
      console.log('✅ Connected to Redis')
    })

    redis.on('error', (error) => {
      console.warn('⚠️ Redis connection error:', error.message)
      redis = null // Disable Redis on error
    })

    redis.on('ready', () => {
      console.log('🚀 Redis client ready')
    })
  } catch (error) {
    console.warn('⚠️ Redis initialization failed:', error)
    redis = null
  }
} else {
  console.log('📝 Redis not configured, caching disabled')
}

export const cache = {
  /**
   * Get cached data by key
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null
    
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  },

  /**
   * Set cache with TTL
   */
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    if (!redis) return
    
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Redis SET error:', error)
    }
  },

  /**
   * Delete cache by key
   */
  async del(key: string): Promise<void> {
    if (!redis) return
    
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Redis DEL error:', error)
    }
  },

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern: string): Promise<void> {
    if (!redis) return
    
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
        console.log(`🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`)
      }
    } catch (error) {
      console.error('Redis INVALIDATE error:', error)
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!redis) return false
    
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  },

  /**
   * Set cache that expires at specific time
   */
  async setExpire(key: string, value: any, expireAt: Date): Promise<void> {
    if (!redis) return
    
    try {
      const ttl = Math.floor((expireAt.getTime() - Date.now()) / 1000)
      if (ttl > 0) {
        await redis.set(key, JSON.stringify(value), 'EX', ttl)
      } else {
        await redis.set(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error('Redis SETEXPIRE error:', error)
    }
  },

  /**
   * Increment numeric value
   */
  async incr(key: string, by: number = 1): Promise<number> {
    if (!redis) return 0
    
    try {
      return await redis.incrby(key, by)
    } catch (error) {
      console.error('Redis INCR error:', error)
      return 0
    }
  },

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!redis) return keys.map(() => null)
    
    try {
      const values = await redis.mget(...keys)
      return values.map(value => value ? JSON.parse(value) : null)
    } catch (error) {
      console.error('Redis MGET error:', error)
      return keys.map(() => null)
    }
  },
}

export default redis