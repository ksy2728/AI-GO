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
      // Get all models first to debug the issue
      models = await ModelService.getAll({ 
        limit: 500,
        aaOnly: false  // Get all models for debugging
      }) as any[]
      console.log(`DEBUG: Retrieved ${models.length} total models from database`)
      
      // Parse metadata for AA data with enhanced processing
      models = models.map(model => {
        // Handle both string and object metadata
        let parsedMetadata = model.metadata
        
        if (typeof model.metadata === 'string') {
          try {
            parsedMetadata = JSON.parse(model.metadata)
          } catch (e) {
            console.warn(`Failed to parse metadata for model ${model.id}:`, e)
            return model
          }
        }
        
        // Enhanced AA data mapping with type safety and fallbacks
        if (parsedMetadata && parsedMetadata.aa) {
          const aa = parsedMetadata.aa
          
          // Ensure numeric values with proper fallbacks
          const intelligenceScore = typeof aa.intelligenceScore === 'number' 
            ? aa.intelligenceScore 
            : parseFloat(aa.intelligenceScore) || 0
            
          const outputSpeed = typeof aa.outputSpeed === 'number'
            ? aa.outputSpeed
            : parseFloat(aa.outputSpeed) || 0
            
          // Handle price as object or number
          let aaPrice = 0
          if (typeof aa.price === 'number') {
            aaPrice = aa.price
          } else if (typeof aa.price === 'object' && aa.price) {
            const input = parseFloat(aa.price.input) || 0
            const output = parseFloat(aa.price.output) || 0
            aaPrice = (input + output) / 2
          } else if (aa.price) {
            aaPrice = parseFloat(aa.price) || 0
          }
          
          console.log(`Enhanced AA mapping for ${model.name}:`, {
            intelligenceScore,
            outputSpeed,
            aaPrice,
            originalAA: aa
          })
          
          return {
            ...model,
            metadata: parsedMetadata,
            // Explicit field assignments with type coercion
            intelligenceScore: intelligenceScore,
            outputSpeed: outputSpeed,
            aaPrice: aaPrice,
            aaRank: parseInt(aa.rank) || 0,
            aaCategory: aa.category || '',
            aaTrend: aa.trend || 'stable'
          }
        }
        
        return { ...model, metadata: parsedMetadata }
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

    // Debug: Check multiple sample models and preprocessing
    if (models.length > 0) {
      console.log(`Total models loaded: ${models.length}`)
      
      // Find models with AA data specifically
      const modelsWithAA = models.filter(m => {
        const metadata = m.metadata as any
        return metadata && metadata.aa
      })
      console.log(`Models with AA data: ${modelsWithAA.length} out of ${models.length}`)
      
      // Debug first AA model in detail
      if (modelsWithAA.length > 0) {
        const aaModel = modelsWithAA[0] as any
        console.log(`\n=== DETAILED AA MODEL DEBUG ===`)
        console.log(`Model: ${aaModel.name}`)
        console.log(`Raw metadata:`, JSON.stringify(aaModel.metadata, null, 2))
        if (aaModel.metadata?.aa) {
          console.log(`AA Intelligence:`, aaModel.metadata.aa.intelligenceScore)
          console.log(`AA Intelligence Type:`, typeof aaModel.metadata.aa.intelligenceScore)
          console.log(`AA Price:`, aaModel.metadata.aa.price)
          console.log(`AA Price Type:`, typeof aaModel.metadata.aa.price)
          console.log(`AA Speed:`, aaModel.metadata.aa.outputSpeed)
          console.log(`AA Speed Type:`, typeof aaModel.metadata.aa.outputSpeed)
        }
        console.log(`Top-level Intelligence:`, aaModel.intelligenceScore)
        console.log(`Top-level Price:`, aaModel.aaPrice)
        console.log(`Top-level Speed:`, aaModel.outputSpeed)
        console.log(`=== END DEBUG ===\n`)
      }
      
      // Count models with top-level fields after processing
      const modelsWithIntelligence = models.filter(m => (m as any).intelligenceScore > 0)
      const modelsWithPrice = models.filter(m => (m as any).aaPrice > 0)
      console.log(`Models with intelligenceScore > 0: ${modelsWithIntelligence.length}`)
      console.log(`Models with aaPrice > 0: ${modelsWithPrice.length}`)
    }
    
    // Calculate highlights data
    const highlights = getModelHighlights(models)
    
    console.log('Highlights result:', {
      intelligenceCount: highlights.intelligence.length,
      speedCount: highlights.speed.length,
      priceCount: highlights.price.length,
      totalModels: models.length
    })
    
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