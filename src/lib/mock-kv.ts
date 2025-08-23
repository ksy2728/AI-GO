// Mock implementation of Vercel KV for development/testing
interface CacheItem {
  value: any
  expires?: number
}

class MockKV {
  private cache = new Map<string, CacheItem>()

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Check expiration
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value as T
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    const item: CacheItem = { value }
    
    if (options?.ex) {
      item.expires = Date.now() + (options.ex * 1000)
    }
    
    this.cache.set(key, item)
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys())
    
    if (!pattern) return allKeys
    
    // Simple pattern matching (just prefix for now)
    const prefix = pattern.replace('*', '')
    return allKeys.filter(key => key.startsWith(prefix))
  }

  // Utility method to clear cache
  clear(): void {
    this.cache.clear()
  }

  // Get cache stats
  getStats() {
    const now = Date.now()
    const items = Array.from(this.cache.entries())
    
    return {
      totalItems: items.length,
      validItems: items.filter(([_, item]) => !item.expires || now <= item.expires).length,
      expiredItems: items.filter(([_, item]) => item.expires && now > item.expires).length
    }
  }
}

// Export singleton instance
export const kv = new MockKV()

// For backwards compatibility with @vercel/kv
export default kv