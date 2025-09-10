import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { TempDataService } from '@/services/temp-data.service'
import { GitHubDataService } from '@/services/github-data.service'
import { getModelHighlights } from '@/lib/model-metrics'

export const revalidate = 300 // Cache for 5 minutes
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Try to get models from various sources
    let models: any[] = []
    let dataSource = 'database'
    
    // Try database first
    try {
      models = await ModelService.getAll({ 
        limit: 500
      }) as any[]
      
      // Parse metadata for AA data
      models = models.map(model => {
        if (model.metadata && typeof model.metadata === 'string') {
          try {
            const parsed = JSON.parse(model.metadata)
            
            // Map AA data to top-level fields for chart functions
            if (parsed.aa) {
              return {
                ...model,
                metadata: parsed,
                intelligenceScore: parsed.aa.intelligenceScore,
                outputSpeed: parsed.aa.outputSpeed,
                aaPrice: parsed.aa.price,
                aaRank: parsed.aa.rank,
                aaCategory: parsed.aa.category,
                aaTrend: parsed.aa.trend
              }
            }
            
            return { ...model, metadata: parsed }
          } catch (e) {
            return model
          }
        }
        return model
      })
      
      dataSource = 'database'
    } catch (dbError) {
      console.warn('Database failed for highlights, trying GitHub:', dbError)
      
      try {
        // Fallback to GitHub
        models = await GitHubDataService.getAllModels({ limit: 500 })
        dataSource = 'github'
      } catch (githubError) {
        console.warn('GitHub failed for highlights, using temp data:', githubError)
        // Final fallback to temporary data
        models = await TempDataService.getAllModels({ limit: 500 }) as any[]
        dataSource = 'temp-data'
      }
    }

    // Calculate highlights data
    const highlights = getModelHighlights(models)
    
    // Add data source to metadata
    highlights.metadata.dataSource = dataSource

    // Cache the response
    return NextResponse.json(highlights, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error in highlights API:', error)
    
    // Return mock data for development
    const mockHighlights = {
      intelligence: [
        { modelId: 'gpt-4', modelName: 'GPT-4', provider: 'OpenAI', color: '#000000', value: 95, displayValue: '95.0', rank: 1 },
        { modelId: 'claude-3-opus', modelName: 'Claude 3 Opus', provider: 'Anthropic', color: '#D2691E', value: 93, displayValue: '93.0', rank: 2 },
        { modelId: 'gemini-ultra', modelName: 'Gemini Ultra', provider: 'Google', color: '#4285F4', value: 92, displayValue: '92.0', rank: 3 },
      ],
      speed: [
        { modelId: 'gpt-3.5-turbo', modelName: 'GPT-3.5 Turbo', provider: 'OpenAI', color: '#000000', value: 250, displayValue: '250', rank: 1 },
        { modelId: 'claude-instant', modelName: 'Claude Instant', provider: 'Anthropic', color: '#D2691E', value: 200, displayValue: '200', rank: 2 },
        { modelId: 'gemini-flash', modelName: 'Gemini Flash', provider: 'Google', color: '#4285F4', value: 180, displayValue: '180', rank: 3 },
      ],
      price: [
        { modelId: 'llama-3', modelName: 'Llama 3', provider: 'Meta', color: '#0084FF', value: 0.5, displayValue: '$0.50', rank: 1 },
        { modelId: 'mistral-7b', modelName: 'Mistral 7B', provider: 'Mistral', color: '#FF6B6B', value: 0.8, displayValue: '$0.80', rank: 2 },
        { modelId: 'gpt-3.5-turbo', modelName: 'GPT-3.5 Turbo', provider: 'OpenAI', color: '#000000', value: 2.0, displayValue: '$2.00', rank: 3 },
      ],
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalModels: 50,
        dataSource: 'mock'
      }
    }
    
    return NextResponse.json(mockHighlights)
  }
}