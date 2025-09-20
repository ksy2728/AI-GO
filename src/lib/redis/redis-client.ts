// Redis Client Configuration
import Redis from 'ioredis';

interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

class RedisManager {
  private static instance: RedisManager;
  private client: Redis | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;

  private constructor() {}

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const config: RedisConfig = this.getConfig();
      this.client = new Redis(config);

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis connection error:', error.message);
        this.isConnected = false;
        this.connectionAttempts++;

        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          console.warn('⚠️ Max Redis connection attempts reached, falling back to in-memory storage');
          this.client = null;
        }
      });

      this.client.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();

    } catch (error) {
      console.error('❌ Failed to initialize Redis:', (error as Error).message);
      this.client = null;
      this.isConnected = false;
    }
  }

  private getConfig(): RedisConfig {
    // Priority: REDIS_URL > individual env vars > localhost defaults
    if (process.env.REDIS_URL) {
      return {
        url: process.env.REDIS_URL,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };
    }

    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };
  }

  getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }

  isRedisAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  // Health check method
  async ping(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

export const redisManager = RedisManager.getInstance();
export default redisManager;