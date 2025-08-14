import { OpenAIService } from '../openai.service'
import { cache } from '@/lib/redis'

// Mock dependencies
jest.mock('@/lib/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn(),
  }
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    provider: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    model: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    modelStatus: {
      create: jest.fn(),
    },
    pricing: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }
}))

describe('OpenAIService', () => {
  let service: OpenAIService
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Create a new instance for each test
    service = new OpenAIService()
  })

  describe('isConfigured', () => {
    it('should return false when API key is not set', () => {
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      
      const newService = new OpenAIService()
      expect(newService.isConfigured()).toBe(false)
      
      // Restore original key
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey
      }
    })

    it('should return true when API key is set', () => {
      process.env.OPENAI_API_KEY = 'test-key'
      const newService = new OpenAIService()
      expect(newService.isConfigured()).toBe(true)
    })
  })

  describe('getPricing', () => {
    it('should return pricing data from cache if available', async () => {
      const mockPricing = [
        {
          model: 'gpt-4',
          inputPricePerMillion: 30.0,
          outputPricePerMillion: 60.0,
          currency: 'USD',
          lastUpdated: new Date(),
        }
      ];

      (cache.get as jest.Mock).mockResolvedValue(mockPricing)

      const result = await service.getPricing()
      
      expect(cache.get).toHaveBeenCalledWith('openai:pricing')
      expect(result).toEqual(mockPricing)
    })

    it('should fetch and cache pricing data when not in cache', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null)

      const result = await service.getPricing()
      
      expect(cache.get).toHaveBeenCalledWith('openai:pricing')
      expect(cache.set).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('model')
      expect(result[0]).toHaveProperty('inputPricePerMillion')
      expect(result[0]).toHaveProperty('outputPricePerMillion')
    })
  })

  describe('checkModelStatus', () => {
    it('should return cached status if available', async () => {
      const mockStatus = {
        id: 'gpt-4',
        status: 'operational' as const,
        availability: 99.9,
        responseTime: 250,
        errorRate: 0,
        lastChecked: new Date(),
      };

      (cache.get as jest.Mock).mockResolvedValue(mockStatus)

      const result = await service.checkModelStatus('gpt-4')
      
      expect(cache.get).toHaveBeenCalledWith('openai:status:gpt-4')
      expect(result).toEqual(mockStatus)
    })

    it('should handle unconfigured service gracefully', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null)
      
      // Create service without API key
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      const unconfiguredService = new OpenAIService()
      
      const result = await unconfiguredService.checkModelStatus('gpt-4')
      
      expect(result).toHaveProperty('status', 'operational')
      expect(result).toHaveProperty('availability')
      expect(result).toHaveProperty('responseTime')
      
      // Restore original key
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey
      }
    })
  })

  describe('getAvailableModels', () => {
    it('should throw error when service is not configured', async () => {
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      const unconfiguredService = new OpenAIService()
      
      await expect(unconfiguredService.getAvailableModels()).rejects.toThrow('OpenAI service not configured')
      
      // Restore original key
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey
      }
    })

    it('should return cached models if available', async () => {
      process.env.OPENAI_API_KEY = 'test-key'
      const configuredService = new OpenAIService()
      
      const mockModels = [
        { id: 'gpt-4', created: new Date(), ownedBy: 'openai' }
      ];

      (cache.get as jest.Mock).mockResolvedValue(mockModels)

      const result = await configuredService.getAvailableModels()
      
      expect(cache.get).toHaveBeenCalledWith('openai:models:list')
      expect(result).toEqual(mockModels)
    })
  })
})