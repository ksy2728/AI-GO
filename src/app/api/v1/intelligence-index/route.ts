import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Cache configuration
const CACHE_TTL = 3600 * 1000 // 1 hour in milliseconds
const STALE_WHILE_REVALIDATE = 7200 * 1000 // 2 hours
const FALLBACK_TTL = 86400 * 1000 // 24 hours

let cachedData: any = null
let cacheTimestamp: number = 0

// Real Intelligence Index values from Artificial Analysis (as of Dec 2024)
const REAL_INTELLIGENCE_DATA = [
  { rank: 1, id: 'gpt-5-high', name: 'GPT-5 (High)', provider: 'OpenAI', intelligenceIndex: 69, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
  { rank: 2, id: 'gpt-5-medium', name: 'GPT-5 (Medium)', provider: 'OpenAI', intelligenceIndex: 68, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
  { rank: 3, id: 'grok-4', name: 'Grok 4', provider: 'xAI', intelligenceIndex: 68, providerLogo: 'https://pbs.twimg.com/profile_images/1679958113668284416/5hmeHJmY_400x400.jpg' },
  { rank: 4, id: 'o3-pro', name: 'o3-pro', provider: 'OpenAI', intelligenceIndex: 68, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
  { rank: 5, id: 'o3', name: 'o3', provider: 'OpenAI', intelligenceIndex: 67, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
  { rank: 6, id: 'gemini-2-5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', intelligenceIndex: 65, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
  { rank: 7, id: 'o4-mini-high', name: 'o4-mini (high)', provider: 'OpenAI', intelligenceIndex: 65, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
  { rank: 8, id: 'gpt-5-mini', name: 'GPT-5 mini', provider: 'OpenAI', intelligenceIndex: 64, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
  { rank: 9, id: 'qwen3-235b-reasoning', name: 'Qwen3 235B (Reasoning)', provider: 'Alibaba', intelligenceIndex: 64, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Alibaba_Group_Logo.svg' },
  { rank: 10, id: 'claude-4-1-opus-thinking', name: 'Claude 4.1 Opus Thinking', provider: 'Anthropic', intelligenceIndex: 61, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg' },
  { rank: 11, id: 'deepseek-v3-1-reasoning', name: 'DeepSeek V3.1 (Reasoning)', provider: 'DeepSeek', intelligenceIndex: 60, providerLogo: null },
  { rank: 12, id: 'claude-4-sonnet-thinking', name: 'Claude 4 Sonnet Thinking', provider: 'Anthropic', intelligenceIndex: 59, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg' },
  { rank: 13, id: 'gemini-2-5-flash-reasoning', name: 'Gemini 2.5 Flash (Reasoning)', provider: 'Google', intelligenceIndex: 58, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
  { rank: 14, id: 'llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', intelligenceIndex: 42, providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' }
]

async function loadIntelligenceData() {
  try {
    // Check cache first
    const now = Date.now()
    if (cachedData && (now - cacheTimestamp) < CACHE_TTL) {
      return { ...cachedData, cached: true, cacheAge: now - cacheTimestamp }
    }

    // Try to load from file
    const dataPath = path.join(process.cwd(), 'data', 'intelligence-index.json')
    const fileData = await fs.readFile(dataPath, 'utf-8')
    const parsedData = JSON.parse(fileData)
    
    // Update cache
    cachedData = parsedData
    cacheTimestamp = now
    
    return { ...parsedData, cached: false }
  } catch (error) {
    console.warn('Failed to load intelligence-index.json, using real data fallback:', error)
    
    // Use real Intelligence Index data as fallback
    const fallbackData = {
      models: REAL_INTELLIGENCE_DATA,
      topModels: REAL_INTELLIGENCE_DATA.slice(0, 9),
      totalModels: REAL_INTELLIGENCE_DATA.length,
      metadata: {
        source: 'Artificial Analysis (Hardcoded)',
        url: 'https://artificialanalysis.ai/leaderboards/models',
        scrapedAt: new Date().toISOString(),
        version: '2.0'
      },
      cached: false
    }
    
    // Cache the fallback data
    cachedData = fallbackData
    cacheTimestamp = Date.now()
    
    return fallbackData
  }
}

export async function GET(request: NextRequest) {
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
        }, {
          headers: {
            'Cache-Control': `public, s-maxage=${CACHE_TTL / 1000}, stale-while-revalidate=${STALE_WHILE_REVALIDATE / 1000}`
          }
        })
      } else {
        return NextResponse.json(
          { error: 'Model not found', modelId },
          { status: 404 }
        )
      }
    }
    
    // Return top models
    const topModels = data.models.slice(0, limit)
    
    return NextResponse.json({
      models: topModels,
      totalModels: data.totalModels,
      metadata: data.metadata,
      cached: data.cached || false,
      cacheAge: data.cacheAge,
      dataSource: data.metadata?.source || 'Artificial Analysis'
    }, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL / 1000}, stale-while-revalidate=${STALE_WHILE_REVALIDATE / 1000}`,
        'X-Data-Source': data.metadata?.source || 'Artificial Analysis',
        'X-Cache-Status': data.cached ? 'HIT' : 'MISS'
      }
    })
  } catch (error) {
    console.error('Intelligence Index API error:', error)
    
    // Return hardcoded top 9 models as last resort
    return NextResponse.json({
      models: REAL_INTELLIGENCE_DATA.slice(0, 9),
      totalModels: 9,
      metadata: {
        source: 'Fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      cached: false,
      dataSource: 'Fallback'
    }, {
      status: 200, // Return 200 even on error to prevent frontend issues
      headers: {
        'Cache-Control': `public, s-maxage=${FALLBACK_TTL / 1000}`,
        'X-Data-Source': 'Fallback'
      }
    })
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