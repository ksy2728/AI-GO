import { PrismaClient, Model } from '@prisma/client'
import { UnifiedModel } from '@/types/unified-models'
import { UnifiedModelService } from './unified-models.service'

const prisma = new PrismaClient()

export interface SearchIntent {
  query: string
  filters: SearchFilters
  sort: SearchSort
  confidence: number
}

export interface SearchFilters {
  providers?: string[]
  modalities?: string[]
  capabilities?: string[]
  priceRange?: {
    min?: number
    max?: number
    type?: 'input' | 'output'
  }
  performanceRange?: {
    intelligence?: { min?: number; max?: number }
    speed?: { min?: number; max?: number }
  }
  status?: string[]
  contextWindow?: { min?: number; max?: number }
  releasedAfter?: string
  isActive?: boolean
}

export interface SearchSort {
  field: 'intelligence' | 'speed' | 'priceInput' | 'priceOutput' | 'contextWindow' | 'releasedAt' | 'relevance'
  direction: 'asc' | 'desc'
}

export interface SearchPreset {
  id: string
  name: string
  description?: string
  filters: SearchFilters
  sort?: SearchSort
  isPublic: boolean
  usageCount: number
}

export interface SmartSearchResult {
  models: UnifiedModel[]
  totalCount: number
  intent: SearchIntent
  suggestions: string[]
  executionTime: number
}

export class SmartSearchService {
  private static cache = new Map<string, { result: SmartSearchResult; timestamp: number }>()
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static async search(
    query: string,
    page = 1,
    limit = 20,
    overrideFilters?: SearchFilters
  ): Promise<SmartSearchResult> {
    const startTime = Date.now()

    // Create cache key
    const cacheKey = JSON.stringify({ query, page, limit, overrideFilters })

    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result
    }

    try {
      // 1. Analyze user intent
      const intent = this.analyzeSearchIntent(query, overrideFilters)

      // 2. Build database query
      const searchResults = await this.executeSearch(intent, page, limit)

      // 3. Generate suggestions
      const suggestions = this.generateSearchSuggestions(query, intent, searchResults.models)

      const result: SmartSearchResult = {
        models: searchResults.models,
        totalCount: searchResults.totalCount,
        intent,
        suggestions,
        executionTime: Date.now() - startTime
      }

      // Cache the result
      this.cache.set(cacheKey, { result, timestamp: Date.now() })

      return result
    } catch (error) {
      console.error('Smart search error:', error)

      // Fallback to basic unified model search
      const fallbackResults = await UnifiedModelService.getAll({}, limit, (page - 1) * limit)

      return {
        models: fallbackResults.models,
        totalCount: fallbackResults.models.length,
        intent: {
          query,
          filters: overrideFilters || {},
          sort: { field: 'intelligence', direction: 'desc' },
          confidence: 0
        },
        suggestions: [],
        executionTime: Date.now() - startTime
      }
    }
  }

  private static analyzeSearchIntent(query: string, overrideFilters?: SearchFilters): SearchIntent {
    const lowercaseQuery = query.toLowerCase()
    const filters: SearchFilters = { ...overrideFilters }
    let sort: SearchSort = { field: 'intelligence', direction: 'desc' }
    let confidence = 0.5

    // Provider detection
    const providerKeywords = {
      'openai': ['openai', 'gpt', 'chatgpt'],
      'anthropic': ['anthropic', 'claude'],
      'google': ['google', 'gemini', 'bard'],
      'meta': ['meta', 'llama'],
      'microsoft': ['microsoft', 'azure'],
      'cohere': ['cohere'],
      'mistral': ['mistral']
    }

    for (const [provider, keywords] of Object.entries(providerKeywords)) {
      if (keywords.some(keyword => lowercaseQuery.includes(keyword))) {
        filters.providers = filters.providers || []
        if (!filters.providers.includes(provider)) {
          filters.providers.push(provider)
          confidence += 0.2
        }
      }
    }

    // Modality detection
    const modalityKeywords = {
      'text': ['text', 'language', 'chat', 'writing'],
      'image': ['image', 'vision', 'visual', 'picture', 'photo'],
      'code': ['code', 'programming', 'coding', 'development'],
      'audio': ['audio', 'voice', 'speech', 'sound'],
      'multimodal': ['multimodal', 'multi-modal', 'vision']
    }

    for (const [modality, keywords] of Object.entries(modalityKeywords)) {
      if (keywords.some(keyword => lowercaseQuery.includes(keyword))) {
        filters.modalities = filters.modalities || []
        if (!filters.modalities.includes(modality)) {
          filters.modalities.push(modality)
          confidence += 0.15
        }
      }
    }

    // Performance intent detection
    const performanceKeywords = {
      intelligence: ['smart', 'intelligent', 'best', 'top', 'advanced', 'sophisticated'],
      speed: ['fast', 'quick', 'rapid', 'speedy', 'efficient', 'low latency'],
      price: ['cheap', 'affordable', 'budget', 'cost-effective', 'free', 'expensive', 'premium']
    }

    if (performanceKeywords.intelligence.some(keyword => lowercaseQuery.includes(keyword))) {
      sort = { field: 'intelligence', direction: 'desc' }
      confidence += 0.2
    } else if (performanceKeywords.speed.some(keyword => lowercaseQuery.includes(keyword))) {
      sort = { field: 'speed', direction: 'desc' }
      confidence += 0.2
    } else if (performanceKeywords.price.some(keyword => lowercaseQuery.includes(keyword))) {
      const isExpensive = lowercaseQuery.includes('expensive') || lowercaseQuery.includes('premium')
      sort = { field: 'priceInput', direction: isExpensive ? 'desc' : 'asc' }
      confidence += 0.2
    }

    // Size/context detection
    const contextWindowMatch = lowercaseQuery.match(/(\d+)k?\s*(context|tokens?|window)/i)
    if (contextWindowMatch) {
      const size = parseInt(contextWindowMatch[1]) * (contextWindowMatch[0].includes('k') ? 1000 : 1)
      filters.contextWindow = { min: size }
      confidence += 0.25
    }

    // Price range detection
    const priceMatch = lowercaseQuery.match(/\$?(\d+(?:\.\d+)?)\s*-\s*\$?(\d+(?:\.\d+)?)/i)
    if (priceMatch) {
      filters.priceRange = {
        min: parseFloat(priceMatch[1]),
        max: parseFloat(priceMatch[2]),
        type: 'input'
      }
      confidence += 0.25
    }

    return {
      query,
      filters,
      sort,
      confidence: Math.min(confidence, 1.0)
    }
  }

  private static async executeSearch(
    intent: SearchIntent,
    page: number,
    limit: number
  ): Promise<{ models: UnifiedModel[]; totalCount: number }> {
    const { filters, sort } = intent

    // Get all unified models first
    const allModelsResponse = await UnifiedModelService.getAll({}, 1000, 0)
    let filteredModels = allModelsResponse.models

    // Apply filters
    if (filters.providers?.length) {
      filteredModels = filteredModels.filter(model =>
        filters.providers!.some(provider =>
          model.provider.toLowerCase().includes(provider.toLowerCase())
        )
      )
    }

    if (filters.modalities?.length) {
      filteredModels = filteredModels.filter(model =>
        model.modalities && filters.modalities!.some(modality =>
          model.modalities!.includes(modality)
        )
      )
    }

    if (filters.capabilities?.length) {
      filteredModels = filteredModels.filter(model =>
        model.capabilities && filters.capabilities!.some(capability =>
          model.capabilities!.includes(capability)
        )
      )
    }

    if (filters.priceRange) {
      const { min, max, type = 'input' } = filters.priceRange
      const priceField = type === 'input' ? 'priceInput' : 'priceOutput'

      filteredModels = filteredModels.filter(model => {
        const price = model[priceField]
        if (typeof price !== 'number') return false
        if (min !== undefined && price < min) return false
        if (max !== undefined && price > max) return false
        return true
      })
    }

    if (filters.performanceRange?.intelligence) {
      const { min, max } = filters.performanceRange.intelligence
      filteredModels = filteredModels.filter(model => {
        const intelligence = model.intelligence
        if (typeof intelligence !== 'number') return false
        if (min !== undefined && intelligence < min) return false
        if (max !== undefined && intelligence > max) return false
        return true
      })
    }

    if (filters.performanceRange?.speed) {
      const { min, max } = filters.performanceRange.speed
      filteredModels = filteredModels.filter(model => {
        const speed = model.speed
        if (typeof speed !== 'number') return false
        if (min !== undefined && speed < min) return false
        if (max !== undefined && speed > max) return false
        return true
      })
    }

    if (filters.status?.length) {
      filteredModels = filteredModels.filter(model =>
        filters.status!.includes(model.status || 'unknown')
      )
    }

    if (filters.contextWindow) {
      const { min, max } = filters.contextWindow
      filteredModels = filteredModels.filter(model => {
        const contextWindow = model.contextWindow
        if (typeof contextWindow !== 'number') return false
        if (min !== undefined && contextWindow < min) return false
        if (max !== undefined && contextWindow > max) return false
        return true
      })
    }

    if (filters.releasedAfter) {
      const afterDate = new Date(filters.releasedAfter)
      filteredModels = filteredModels.filter(model => {
        const releasedAt = model.releasedAt
        return releasedAt && new Date(releasedAt) > afterDate
      })
    }

    if (filters.isActive !== undefined) {
      filteredModels = filteredModels.filter(model => model.isActive === filters.isActive)
    }

    // Apply sorting
    filteredModels.sort((a, b) => {
      const { field, direction } = sort
      let aValue: any = a[field]
      let bValue: any = b[field]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return direction === 'asc' ? -1 : 1
      if (bValue == null) return direction === 'asc' ? 1 : -1

      // Sort logic
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // String sorting
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (aStr < bStr) return direction === 'asc' ? -1 : 1
      if (aStr > bStr) return direction === 'asc' ? 1 : -1
      return 0
    })

    // Apply pagination
    const totalCount = filteredModels.length
    const startIndex = (page - 1) * limit
    const paginatedModels = filteredModels.slice(startIndex, startIndex + limit)

    return {
      models: paginatedModels,
      totalCount
    }
  }

  private static generateSearchSuggestions(
    originalQuery: string,
    intent: SearchIntent,
    results: UnifiedModel[]
  ): string[] {
    const suggestions: string[] = []

    // Provider suggestions based on results
    const providers = [...new Set(results.map(m => m.provider))].slice(0, 3)
    if (providers.length > 1) {
      suggestions.push(`Only ${providers[0]} models`)
      suggestions.push(`${providers[0]} vs ${providers[1]} comparison`)
    }

    // Performance suggestions
    if (intent.sort.field !== 'intelligence') {
      suggestions.push('Best performing models')
    }
    if (intent.sort.field !== 'speed') {
      suggestions.push('Fastest models')
    }
    if (intent.sort.field !== 'priceInput') {
      suggestions.push('Most affordable models')
    }

    // Context window suggestions
    if (!intent.filters.contextWindow) {
      suggestions.push('Long context models (>100k tokens)')
      suggestions.push('Models with 1M+ token context')
    }

    // Modality suggestions
    if (!intent.filters.modalities?.includes('multimodal')) {
      suggestions.push('Multimodal vision models')
    }

    // Recent models suggestion
    if (!intent.filters.releasedAfter) {
      suggestions.push('Recently released models (2024)')
    }

    return suggestions.slice(0, 5)
  }

  static async saveSearchPreset(
    name: string,
    description: string,
    filters: SearchFilters,
    sort?: SearchSort,
    isPublic = false
  ): Promise<SearchPreset> {
    const preset = await prisma.savedFilter.create({
      data: {
        name,
        description,
        filters: JSON.stringify(filters),
        isPublic,
        usageCount: 0
      }
    })

    return {
      id: preset.id,
      name: preset.name,
      description: preset.description || undefined,
      filters,
      sort,
      isPublic: preset.isPublic,
      usageCount: preset.usageCount
    }
  }

  static async getSearchPresets(isPublic?: boolean): Promise<SearchPreset[]> {
    const presets = await prisma.savedFilter.findMany({
      where: isPublic !== undefined ? { isPublic } : undefined,
      orderBy: { usageCount: 'desc' }
    })

    return presets.map(preset => ({
      id: preset.id,
      name: preset.name,
      description: preset.description || undefined,
      filters: JSON.parse(preset.filters as string),
      isPublic: preset.isPublic,
      usageCount: preset.usageCount
    }))
  }

  static async updatePresetUsage(presetId: string): Promise<void> {
    await prisma.savedFilter.update({
      where: { id: presetId },
      data: { usageCount: { increment: 1 } }
    })
  }

  static clearCache(): void {
    this.cache.clear()
  }
}