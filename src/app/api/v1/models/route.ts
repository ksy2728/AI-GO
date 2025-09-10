import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { TempDataService } from '@/services/temp-data.service'
import { GitHubDataService } from '@/services/github-data.service'

// Disable caching for this route
export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const modality = searchParams.get('modality')
    const capability = searchParams.get('capability')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Define providers with API keys
    const providersWithApiKeys = new Set<string>()
    
    // Check which providers have API keys configured
    if (process.env.OPENAI_API_KEY) {
      providersWithApiKeys.add('openai')
    }
    if (process.env.ANTHROPIC_API_KEY) {
      providersWithApiKeys.add('anthropic')
    }
    // Add Google and Meta as they might have API keys or be publicly available
    if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
      providersWithApiKeys.add('google')
    }
    if (process.env.META_API_KEY) {
      providersWithApiKeys.add('meta')
    }
    
    // Always include these providers as they have public/free tiers or are commonly available
    providersWithApiKeys.add('openai') // Many users have OpenAI API keys
    providersWithApiKeys.add('anthropic') // Common provider
    providersWithApiKeys.add('google') // Has free tier
    providersWithApiKeys.add('meta') // Open source models

    // Build filters
    const filters: any = {
      limit,
      offset,
    }

    if (provider) {
      filters.provider = provider
    }

    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }

    if (modality) {
      filters.modalities = [modality]
    }

    if (capability) {
      filters.capabilities = [capability]
    }

    // Data source priority: Check DATA_SOURCE env var first, then fallback chain
    let models: any[] = []
    let dataSource = 'database'
    
    // Check preferred data source from environment
    const preferredDataSource = process.env.DATA_SOURCE || 'database'
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' || 
                        process.env.VERCEL_ENV !== undefined
    
    // Try preferred data source first
    if (preferredDataSource === 'database') {
      try {
        models = (await ModelService.getAll(filters)) as any[]
        dataSource = 'database'
        console.log('🐘 Using database source (preferred)')
      } catch (dbError) {
        console.warn('⚠️ Database failed, trying GitHub:', dbError instanceof Error ? dbError.message : 'Unknown error')
        // Fallback to GitHub
        try {
          models = await GitHubDataService.getAllModels(filters)
          dataSource = 'github'
          console.log('📦 Using GitHub data source (database fallback)')
        } catch (githubError) {
          console.warn('⚠️ GitHub failed, using temp data:', githubError instanceof Error ? githubError.message : 'Unknown error')
          // Final fallback to temp data
          models = (await TempDataService.getAllModels(filters)) as any[]
          dataSource = 'temp-data'
          console.log('📝 Using temporary data source (final fallback)')
        }
      }
    } else if (preferredDataSource === 'github') {
      try {
        models = await GitHubDataService.getAllModels(filters)
        dataSource = 'github'
        console.log('📦 Using GitHub data source (preferred)')
      } catch (githubError) {
        console.warn('⚠️ GitHub failed, trying database:', githubError instanceof Error ? githubError.message : 'Unknown error')
        try {
          models = (await ModelService.getAll(filters)) as any[]
          dataSource = 'database'
          console.log('🐘 Using database source (github fallback)')
        } catch (dbError) {
          console.warn('⚠️ Database failed, using temp data:', dbError instanceof Error ? dbError.message : 'Unknown error')
          models = (await TempDataService.getAllModels(filters)) as any[]
          dataSource = 'temp-data'
          console.log('📝 Using temporary data source (final fallback)')
        }
      }
    } else {
      // Default: temp-data (original production behavior for stability)
      try {
        models = (await TempDataService.getAllModels(filters)) as any[]
        dataSource = 'temp-data'
        console.log('📝 Using temporary data source (preferred)')
      } catch (tempDataError) {
        console.warn('⚠️ TempData failed, trying GitHub:', tempDataError instanceof Error ? tempDataError.message : 'Unknown error')
        try {
          models = await GitHubDataService.getAllModels(filters)
          dataSource = 'github'
          console.log('📦 Using GitHub data source (temp-data fallback)')
        } catch (githubError) {
          console.warn('⚠️ GitHub failed, trying database:', githubError instanceof Error ? githubError.message : 'Unknown error')
          try {
            models = (await ModelService.getAll(filters)) as any[]
            dataSource = 'database'
            console.log('🐘 Using database source (final fallback)')
          } catch (dbError) {
            console.error('💥 All data sources failed:', dbError instanceof Error ? dbError.message : 'Unknown error')
            throw new Error('All data sources are unavailable')
          }
        }
      }
    }

    // Filter by modality and capability if needed (client-side filtering for complex JSON fields)
    let filteredModels = models || []

    if (modality && !filters.modalities) {
      filteredModels = filteredModels.filter((model: any) =>
        model.modalities.some((m: string) => 
          m.toLowerCase().includes(modality.toLowerCase())
        )
      )
    }

    if (capability && !filters.capabilities) {
      filteredModels = filteredModels.filter((model: any) =>
        model.capabilities.some((c: string) => 
          c.toLowerCase().includes(capability.toLowerCase())
        )
      )
    }
    
    // Parse and include AA metadata if available
    filteredModels = filteredModels.map((model: any) => {
      if (model.metadata) {
        try {
          const metadata = typeof model.metadata === 'string' 
            ? JSON.parse(model.metadata) 
            : model.metadata
          
          // Include AA data if available
          if (metadata.aa) {
            return {
              ...model,
              intelligenceScore: metadata.aa.intelligenceScore,
              outputSpeed: metadata.aa.outputSpeed,
              aaPrice: metadata.aa.price,
              aaRank: metadata.aa.rank,
              aaCategory: metadata.aa.category,
              aaTrend: metadata.aa.trend,
              aaLastUpdated: metadata.aa.lastUpdated
            }
          }
        } catch (e) {
          console.warn('Failed to parse metadata for model:', model.slug)
        }
      }
      return model
    })
    
    // Don't filter by API keys when using database - show all models
    // Only filter when using temp-data fallback
    if (dataSource === 'temp-data') {
      filteredModels = filteredModels.filter((model: any) => {
        const providerSlug = model.provider?.slug || model.providerId
        return providersWithApiKeys.has(providerSlug)
      })
    }
    
    // Sort by AA rank if available, otherwise by name
    filteredModels.sort((a: any, b: any) => {
      if (a.aaRank && b.aaRank) {
        return a.aaRank - b.aaRank
      }
      if (a.aaRank) return -1
      if (b.aaRank) return 1
      return (a.name || '').localeCompare(b.name || '')
    })

    return NextResponse.json({
      models: filteredModels,
      total: filteredModels.length,
      limit,
      offset,
      timestamp: new Date().toISOString(),
      dataSource, // Include data source in response
      cached: dataSource === 'github', // GitHub data is cached
    })
  } catch (error) {
    console.error('❌ Error in models API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch models',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}