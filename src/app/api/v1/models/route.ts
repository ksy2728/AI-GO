import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { TempDataService } from '@/services/temp-data.service'
import { GitHubDataService } from '@/services/github-data.service'

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

    // Data source priority: GitHub > Database > TempData
    let models: any[] = []
    let dataSource = 'github'
    
    try {
      // Try GitHub data first (preferred for consistency)
      models = await GitHubDataService.getAllModels(filters)
      console.log('📦 Using GitHub data source')
    } catch (githubError) {
      console.warn('⚠️ GitHub data failed, trying database:', githubError instanceof Error ? githubError.message : 'Unknown error')
      
      try {
        // Fallback to database
        models = (await ModelService.getAll(filters)) as any[]
        dataSource = 'database'
        console.log('🗄️ Using database source')
      } catch (dbError) {
        console.warn('⚠️ Database failed, using temporary data:', dbError instanceof Error ? dbError.message : 'Unknown error')
        // Final fallback to temporary data
        models = (await TempDataService.getAllModels(filters)) as any[]
        dataSource = 'temp-data'
        console.log('📝 Using temporary data source')
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
    
    // Filter models by providers with API keys (only if not using GitHub data which is pre-filtered)
    if (dataSource !== 'github') {
      filteredModels = filteredModels.filter((model: any) => {
        const providerSlug = model.provider?.slug || model.providerId
        return providersWithApiKeys.has(providerSlug)
      })
    }

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