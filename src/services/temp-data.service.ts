/**
 * Temporary in-memory data service
 * This is a fallback when database connection fails
 */

// Temporary data to replace database calls
const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    slug: 'openai',
    websiteUrl: 'https://openai.com',
    documentationUrl: 'https://platform.openai.com/docs',
    regions: ['us-east', 'us-west', 'eu-west'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    slug: 'anthropic', 
    websiteUrl: 'https://anthropic.com',
    documentationUrl: 'https://docs.anthropic.com',
    regions: ['us-east', 'us-west'],
  },
  {
    id: 'google',
    name: 'Google AI',
    slug: 'google',
    websiteUrl: 'https://ai.google',
    documentationUrl: 'https://ai.google.dev/docs',
    regions: ['us-east', 'us-west', 'eu-west', 'asia-east'],
  },
  {
    id: 'meta',
    name: 'Meta AI',
    slug: 'meta',
    websiteUrl: 'https://ai.meta.com',
    documentationUrl: 'https://llama.meta.com/docs',
    regions: ['us-east', 'us-west'],
  },
]

const models = [
  {
    id: 'gpt-35-turbo',
    slug: 'gpt-35-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast, cost-effective model for simple tasks',
    provider: providers[0],
    foundationModel: 'GPT-3.5',
    releasedAt: new Date('2023-03-01'),
    modalities: ['text'],
    capabilities: ['chat', 'completion', 'coding'],
    contextWindow: 16385,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2021-09-01'),
    apiVersion: 'v1',
    isActive: true,
    status: {
      status: 'operational' as const,
      availability: 99.9,
      latencyP50: 200,
      latencyP95: 400,
      latencyP99: 800,
      errorRate: 0.1,
      requestsPerMin: 1500,
      tokensPerMin: 150000,
      usage: 85,
      checkedAt: new Date(),
    },
    benchmarks: [
      {
        suite: 'MMLU',
        suiteSlug: 'mmlu',
        score: 70.0,
        normalizedScore: 70.0,
        percentile: 75,
        evaluationDate: new Date('2023-03-01'),
        isOfficial: true,
      },
    ],
    pricing: {
      tier: 'standard',
      currency: 'USD',
      inputPerMillion: 0.5,
      outputPerMillion: 1.5,
      imagePerUnit: null,
      audioPerMinute: null,
      videoPerMinute: null,
      effectiveFrom: new Date('2023-03-01'),
    },
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date(),
  },
  {
    id: 'gpt-4-turbo',
    slug: 'gpt-4-turbo', 
    name: 'GPT-4 Turbo',
    description: 'Latest GPT-4 model with improved performance and lower costs',
    provider: providers[0],
    foundationModel: 'GPT-4',
    releasedAt: new Date('2024-04-09'),
    modalities: ['text', 'image'],
    capabilities: ['chat', 'completion', 'coding', 'analysis'],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2024-04-01'),
    apiVersion: 'v1',
    isActive: true,
    status: {
      status: 'operational' as const,
      availability: 99.8,
      latencyP50: 300,
      latencyP95: 600,
      latencyP99: 1200,
      errorRate: 0.05,
      requestsPerMin: 800,
      tokensPerMin: 80000,
      usage: 92,
      checkedAt: new Date(),
    },
    benchmarks: [
      {
        suite: 'MMLU',
        suiteSlug: 'mmlu', 
        score: 86.4,
        normalizedScore: 86.4,
        percentile: 95,
        evaluationDate: new Date('2024-04-09'),
        isOfficial: true,
      },
      {
        suite: 'HumanEval',
        suiteSlug: 'humaneval',
        score: 87.0,
        normalizedScore: 87.0, 
        percentile: 92,
        evaluationDate: new Date('2024-04-09'),
        isOfficial: true,
      },
    ],
    pricing: {
      tier: 'standard',
      currency: 'USD',
      inputPerMillion: 10.0,
      outputPerMillion: 30.0,
      imagePerUnit: 0.00085,
      audioPerMinute: null,
      videoPerMinute: null,
      effectiveFrom: new Date('2024-04-09'),
    },
    createdAt: new Date('2024-04-09'),
    updatedAt: new Date(),
  },
  {
    id: 'claude-3-opus',
    slug: 'claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Anthropics most capable AI model for complex tasks',
    provider: providers[1], 
    foundationModel: 'Claude 3',
    releasedAt: new Date('2024-03-04'),
    modalities: ['text', 'image'],
    capabilities: ['chat', 'analysis', 'writing', 'reasoning'],
    contextWindow: 200000,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2024-08-01'),
    apiVersion: 'v1',
    isActive: true,
    status: {
      status: 'operational' as const,
      availability: 99.7,
      latencyP50: 400,
      latencyP95: 800,
      latencyP99: 1600,
      errorRate: 0.08,
      requestsPerMin: 600,
      tokensPerMin: 60000,
      usage: 78,
      checkedAt: new Date(),
    },
    benchmarks: [
      {
        suite: 'MMLU',
        suiteSlug: 'mmlu',
        score: 86.8,
        normalizedScore: 86.8,
        percentile: 96,
        evaluationDate: new Date('2024-03-04'),
        isOfficial: true,
      },
    ],
    pricing: {
      tier: 'premium',
      currency: 'USD', 
      inputPerMillion: 15.0,
      outputPerMillion: 75.0,
      imagePerUnit: 0.0008,
      audioPerMinute: null,
      videoPerMinute: null,
      effectiveFrom: new Date('2024-03-04'),
    },
    createdAt: new Date('2024-03-04'),
    updatedAt: new Date(),
  },
  {
    id: 'gemini-pro',
    slug: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Googles most capable multimodal AI model',
    provider: providers[2],
    foundationModel: 'Gemini',
    releasedAt: new Date('2024-02-08'),
    modalities: ['text', 'image', 'audio', 'video'],
    capabilities: ['chat', 'multimodal', 'coding', 'reasoning'],
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    trainingCutoff: new Date('2024-01-01'),
    apiVersion: 'v1',
    isActive: true,
    status: {
      status: 'operational' as const,
      availability: 99.6,
      latencyP50: 350,
      latencyP95: 700,
      latencyP99: 1400,
      errorRate: 0.12,
      requestsPerMin: 1000,
      tokensPerMin: 100000,
      usage: 88,
      checkedAt: new Date(),
    },
    benchmarks: [
      {
        suite: 'MMLU',
        suiteSlug: 'mmlu',
        score: 83.7,
        normalizedScore: 83.7,
        percentile: 90,
        evaluationDate: new Date('2024-02-08'),
        isOfficial: true,
      },
    ],
    pricing: {
      tier: 'standard',
      currency: 'USD',
      inputPerMillion: 0.125,
      outputPerMillion: 0.375,
      imagePerUnit: 0.0025,
      audioPerMinute: 0.002,
      videoPerMinute: 0.002,
      effectiveFrom: new Date('2024-02-08'),
    },
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date(),
  },
  {
    id: 'llama-3-70b',
    slug: 'llama-3-70b',
    name: 'Llama 3 70B',
    description: 'Meta\'s powerful open-source language model',
    provider: providers[3],
    foundationModel: 'Llama 3',
    releasedAt: new Date('2024-04-18'),
    modalities: ['text'],
    capabilities: ['chat', 'completion', 'coding', 'reasoning'],
    contextWindow: 8192,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2024-03-01'),
    apiVersion: 'v1',
    isActive: true,
    status: {
      status: 'operational' as const,
      availability: 99.5,
      latencyP50: 450,
      latencyP95: 900,
      latencyP99: 1800,
      errorRate: 0.15,
      requestsPerMin: 400,
      tokensPerMin: 40000,
      usage: 65,
      checkedAt: new Date(),
    },
    benchmarks: [
      {
        suite: 'MMLU',
        suiteSlug: 'mmlu',
        score: 82.0,
        normalizedScore: 82.0,
        percentile: 88,
        evaluationDate: new Date('2024-04-18'),
        isOfficial: true,
      },
    ],
    pricing: {
      tier: 'standard',
      currency: 'USD',
      inputPerMillion: 0.9,
      outputPerMillion: 0.9,
      imagePerUnit: null,
      audioPerMinute: null,
      videoPerMinute: null,
      effectiveFrom: new Date('2024-04-18'),
    },
    createdAt: new Date('2024-04-18'),
    updatedAt: new Date(),
  },
]

export class TempDataService {
  static async getAllModels(filters: any = {}) {
    console.log('🔄 Using temporary in-memory data service')
    
    let filteredModels = [...models]

    // Apply filters
    if (filters.provider) {
      filteredModels = filteredModels.filter(model =>
        model.provider.slug === filters.provider
      )
    }

    if (filters.isActive !== undefined) {
      filteredModels = filteredModels.filter(model =>
        model.isActive === filters.isActive
      )
    }

    // Apply pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    filteredModels = filteredModels.slice(offset, offset + limit)

    return filteredModels
  }

  static async getModelBySlug(slug: string) {
    console.log(`🔄 Using temporary data for model: ${slug}`)
    
    const model = models.find(m => m.slug === slug)
    return model || null
  }

  static async getProvidersSummary() {
    console.log('🔄 Using temporary data for providers summary')
    
    return providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      websiteUrl: provider.websiteUrl,
      totalModels: models.filter(m => m.provider.slug === provider.slug).length,
      operationalModels: models.filter(m => 
        m.provider.slug === provider.slug && m.status.status === 'operational'
      ).length,
      avgAvailability: Math.round(
        models
          .filter(m => m.provider.slug === provider.slug)
          .reduce((sum, m) => sum + m.status.availability, 0) / 
        Math.max(models.filter(m => m.provider.slug === provider.slug).length, 1) * 10
      ) / 10,
    }))
  }

  static async searchModels(query: string, filters: any = {}) {
    console.log(`🔄 Using temporary data for search: ${query}`)
    
    let filteredModels = [...models]

    // Search in name, description, or provider name
    if (query && query.length >= 2) {
      const lowerQuery = query.toLowerCase()
      filteredModels = filteredModels.filter(model =>
        model.name.toLowerCase().includes(lowerQuery) ||
        model.description.toLowerCase().includes(lowerQuery) ||
        model.provider.name.toLowerCase().includes(lowerQuery)
      )
    }

    // Apply filters
    if (filters.provider) {
      filteredModels = filteredModels.filter(model =>
        model.provider.slug === filters.provider
      )
    }

    // Apply limit
    const limit = filters.limit || 20
    filteredModels = filteredModels.slice(0, limit)

    return filteredModels.map(model => ({
      id: model.id,
      slug: model.slug,
      name: model.name,
      description: model.description,
      provider: {
        name: model.provider.name,
        slug: model.provider.slug,
      },
      status: {
        status: model.status.status,
        availability: model.status.availability,
      },
    }))
  }

  static async getPricing(filters: any = {}) {
    console.log('🔄 Using temporary data for pricing')
    
    // Extract pricing from models
    const pricing = models.map(model => ({
      modelId: model.id,
      tier: model.pricing.tier,
      region: 'us-east',
      currency: model.pricing.currency,
      inputPerMillion: model.pricing.inputPerMillion,
      outputPerMillion: model.pricing.outputPerMillion,
      imagePerUnit: model.pricing.imagePerUnit,
      audioPerMinute: model.pricing.audioPerMinute,
      videoPerMinute: model.pricing.videoPerMinute,
      effectiveFrom: model.pricing.effectiveFrom,
    }))
    
    let filteredPricing = [...pricing]
    
    // Filter by provider if specified
    if (filters.provider) {
      const providerSlug = filters.provider.toLowerCase()
      const providerModel = models.filter(m => 
        m.provider.slug === providerSlug
      )
      const modelIds = providerModel.map(m => m.id)
      filteredPricing = filteredPricing.filter(p => 
        modelIds.includes(p.modelId)
      )
    }
    
    // Filter by model if specified
    if (filters.model) {
      const modelSlug = filters.model.toLowerCase()
      const model = models.find(m => m.slug === modelSlug)
      if (model) {
        filteredPricing = filteredPricing.filter(p => p.modelId === model.id)
      }
    }
    
    // Filter by tier if specified
    if (filters.tier) {
      filteredPricing = filteredPricing.filter(p => 
        p.tier === filters.tier
      )
    }
    
    // Filter by region if specified
    if (filters.region) {
      filteredPricing = filteredPricing.filter(p => 
        p.region === filters.region || !p.region
      )
    }
    
    // Filter by currency if specified
    if (filters.currency) {
      filteredPricing = filteredPricing.filter(p => 
        p.currency === filters.currency.toUpperCase()
      )
    }
    
    // Apply pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    const paginated = filteredPricing.slice(offset, offset + limit)
    
    // Enrich pricing with model information
    const enrichedPricing = paginated.map(p => {
      const model = models.find(m => m.id === p.modelId)
      return {
        ...p,
        model: model ? {
          id: model.id,
          slug: model.slug,
          name: model.name,
          provider: model.provider,
        } : null,
      }
    })
    
    return {
      data: enrichedPricing,
      total: filteredPricing.length,
      cached: false,
    }
  }

  static async getSystemStats() {
    console.log('🔄 Using temporary data for system stats')
    
    const totalModels = models.length
    const activeModels = models.filter(m => m.isActive).length
    const operationalModels = models.filter(m => m.status.status === 'operational').length
    const avgAvailability = models.reduce((sum, m) => sum + m.status.availability, 0) / models.length

    return {
      totalModels,
      activeModels,
      providers: providers.length,
      avgAvailability: Math.round(avgAvailability * 10) / 10,
      operationalModels,
      degradedModels: 0,
      outageModels: 0,
      totalBenchmarks: models.reduce((sum, m) => sum + m.benchmarks.length, 0),
      lastUpdated: new Date(),
    }
  }
}