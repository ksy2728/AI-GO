import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Cache configuration
const CACHE_TTL = 3600 * 1000 // 1 hour in milliseconds
const STALE_WHILE_REVALIDATE = 7200 * 1000 // 2 hours
const FALLBACK_TTL = 86400 * 1000 // 24 hours

let cachedData: any = null
let cacheTimestamp: number = 0

// Provider logo mapping for dynamic data
const PROVIDER_LOGOS: Record<string, string> = {
  'OpenAI': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
  'Anthropic': 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
  'Google': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  'Meta': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
  'xAI': 'https://pbs.twimg.com/profile_images/1679958113668284416/5hmeHJmY_400x400.jpg',
  'Alibaba': 'https://upload.wikimedia.org/wikipedia/commons/0/09/Alibaba_Group_Logo.svg'
}

// Function to get intelligence data from AA models
async function getIntelligenceData() {
  try {
    const { UnifiedModelService } = await import('@/services/unified-models.service')
    const response = await UnifiedModelService.getAll({}, 1000, 0)

    // Convert AA models to intelligence index format
    const intelligenceData = response.models
      .filter(model => model.intelligence && model.intelligence > 0)
      .sort((a, b) => (b.intelligence || 0) - (a.intelligence || 0))
      .map((model, index) => ({
        rank: index + 1,
        id: model.slug || model.id,
        name: model.name,
        provider: model.provider,
        intelligenceIndex: model.intelligence,
        providerLogo: PROVIDER_LOGOS[model.provider] || null
      }))

    return {
      models: intelligenceData,
      topModels: intelligenceData.slice(0, 9),
      totalModels: intelligenceData.length,
      metadata: {
        source: 'Artificial Analysis (Live Data)',
        url: 'https://artificialanalysis.ai/leaderboards/models',
        scrapedAt: new Date().toISOString(),
        version: '3.0'
      }
    }
  } catch (error) {
    console.error('Failed to get intelligence data from UnifiedModelService:', error)
    throw error
  }
}

async function loadIntelligenceData() {
  try {
    // Check cache first
    const now = Date.now()
    if (cachedData && (now - cacheTimestamp) < CACHE_TTL) {
      return { ...cachedData, cached: true, cacheAge: now - cacheTimestamp }
    }

    // Try to load from file first, then dynamic data
    let data
    try {
      const dataPath = path.join(process.cwd(), 'data', 'intelligence-index.json')
      const fileData = await fs.readFile(dataPath, 'utf-8')
      data = JSON.parse(fileData)
      console.log('📄 Using static intelligence data file')
    } catch (fileError) {
      console.log('📄 No static file, generating from AA data...')
      data = await getIntelligenceData()
    }

    // Update cache
    cachedData = data
    cacheTimestamp = now

    return { ...data, cached: false }
  } catch (error) {
    console.warn('Failed to load intelligence data, using AA fallback:', error)

    // Use dynamic AA data as fallback
    try {
      const fallbackData = await getIntelligenceData()
      const enrichedFallbackData = { ...fallbackData, cached: false }

      // Cache the fallback data
      cachedData = enrichedFallbackData
      cacheTimestamp = Date.now()

      return enrichedFallbackData
    } catch (fallbackError) {
      console.error('All intelligence data sources failed:', fallbackError)
      // Return empty data if everything fails
      return {
        models: [],
        topModels: [],
        totalModels: 0,
        metadata: {
          source: 'Empty Fallback',
          error: 'All data sources failed',
          timestamp: new Date().toISOString()
        },
        cached: false
      }
    }
  }
}

export async function GET(request: NextRequest) {
  // CORS headers for Vercel deployments
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': `public, s-maxage=${CACHE_TTL / 1000}, stale-while-revalidate=${STALE_WHILE_REVALIDATE / 1000}`
  })

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers })
  }

  try {
    const { searchParams } = request.nextUrl
    const limit = parseInt(searchParams.get('limit') || '9')
    const modelId = searchParams.get('modelId')

    const data = await loadIntelligenceData()

    // If specific model requested
    if (modelId) {
      const model = data.models.find((m: any) => m.id === modelId)
      if (model) {
        return NextResponse.json({
          model,
          metadata: data.metadata,
          cached: data.cached
        }, { headers })
      } else {
        return NextResponse.json(
          { error: 'Model not found', modelId },
          { status: 404, headers }
        )
      }
    }

    // Return top models
    const topModels = data.models.slice(0, limit)
    
    // Add additional headers for metadata
    headers.set('X-Data-Source', data.metadata?.source || 'Artificial Analysis')
    headers.set('X-Cache-Status', data.cached ? 'HIT' : 'MISS')

    return NextResponse.json({
      models: topModels,
      totalModels: data.totalModels,
      metadata: data.metadata,
      cached: data.cached || false,
      cacheAge: data.cacheAge,
      dataSource: data.metadata?.source || 'Artificial Analysis'
    }, { headers })
  } catch (error) {
    console.error('Intelligence Index API error:', error)

    // Try to return dynamic data as last resort
    try {
      const emergencyData = await getIntelligenceData()
      headers.set('X-Data-Source', 'Emergency')
      headers.set('Cache-Control', `public, s-maxage=${FALLBACK_TTL / 1000}`)

      return NextResponse.json({
        models: emergencyData.topModels,
        totalModels: emergencyData.totalModels,
        metadata: {
          ...emergencyData.metadata,
          source: 'Emergency Fallback',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        cached: false,
        dataSource: 'Emergency'
      }, {
        status: 200,
        headers
      })
    } catch (emergencyError) {
      // Absolute final fallback - empty response
      headers.set('X-Data-Source', 'Critical Fallback')

      return NextResponse.json({
        models: [],
        totalModels: 0,
        metadata: {
          source: 'Critical Fallback',
          error: 'All intelligence data sources failed',
          timestamp: new Date().toISOString()
        },
        cached: false,
        dataSource: 'Critical'
      }, {
        status: 200,
        headers
      })
    }
  }
}

// POST endpoint to manually refresh data
export async function POST(request: NextRequest) {
  try {
    const { scrapeIntelligenceIndex } = require('../../../../../scripts/scrape-intelligence-index')
    const data = await scrapeIntelligenceIndex()
    
    // Clear cache
    cachedData = null
    cacheTimestamp = 0
    
    return NextResponse.json({
      success: true,
      modelsCount: data.models.length,
      topModels: data.topModels,
      message: 'Intelligence Index data refreshed successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh data'
    }, { status: 500 })
  }
}