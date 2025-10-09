import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

// Cache for static data
let cachedData: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 1000 // 1 minute cache

/**
 * Read static AA data from JSON file
 */
async function getStaticAAData() {
  try {
    // Check memory cache first
    const now = Date.now()
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedData
    }

    // Read from file system
    const dataPath = path.join(process.cwd(), 'public', 'data', 'aa-models.json')
    const content = await fs.readFile(dataPath, 'utf-8')
    const data = JSON.parse(content)
    
    // Update cache
    cachedData = data
    cacheTimestamp = now
    
    return data
  } catch (error) {
    console.error('Failed to read static AA data:', error)
    
    // Try to read from public directory as fallback
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/data/aa-models.json`)
      if (response.ok) {
        return await response.json()
      }
    } catch (fetchError) {
      console.error('Fallback fetch also failed:', fetchError)
    }
    
    return null
  }
}

/**
 * Get fallback models when no data is available
 */
function getFallbackModels() {
  return [
    { 
      rank: 1,
      name: 'GPT-4o', 
      provider: 'OpenAI', 
      slug: 'gpt-4o',
      intelligenceScore: 74.8, 
      outputSpeed: 105.8,
      inputPrice: 15,
      outputPrice: 60,
      contextWindow: 128000,
      category: 'flagship',
      trend: 'stable'
    },
    { 
      rank: 2,
      name: 'Claude 3.5 Sonnet', 
      provider: 'Anthropic', 
      slug: 'claude-3-5-sonnet',
      intelligenceScore: 75.2, 
      outputSpeed: 85.3,
      inputPrice: 3,
      outputPrice: 15,
      contextWindow: 200000,
      category: 'flagship',
      trend: 'stable'
    },
    { 
      rank: 3,
      name: 'Gemini 1.5 Pro', 
      provider: 'Google', 
      slug: 'gemini-1-5-pro',
      intelligenceScore: 71.9, 
      outputSpeed: 187.6,
      inputPrice: 3.5,
      outputPrice: 10.5,
      contextWindow: 2000000,
      category: 'flagship',
      trend: 'stable'
    },
    { 
      rank: 4,
      name: 'GPT-4o mini', 
      provider: 'OpenAI', 
      slug: 'gpt-4o-mini',
      intelligenceScore: 65.0, 
      outputSpeed: 153.2,
      inputPrice: 0.15,
      outputPrice: 0.6,
      contextWindow: 128000,
      category: 'cost-effective',
      trend: 'stable'
    },
    { 
      rank: 5,
      name: 'Claude 3 Haiku', 
      provider: 'Anthropic', 
      slug: 'claude-3-haiku',
      intelligenceScore: 64.0, 
      outputSpeed: 112.5,
      inputPrice: 0.25,
      outputPrice: 1.25,
      contextWindow: 200000,
      category: 'cost-effective',
      trend: 'stable'
    }
  ]
}

/**
 * GET /api/v1/aa-sync
 * Get AA models data from static JSON or fallback
 */
export async function GET(_request: NextRequest) {
  try {
    // Try to get static data
    const staticData = await getStaticAAData()
    
    if (staticData && staticData.models && staticData.models.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'static-json',
        models: staticData.models,
        metadata: staticData.metadata || {
          lastUpdated: new Date().toISOString(),
          source: 'static-file'
        }
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      })
    }
    
    // Use fallback data
    console.log('Using fallback AA data')
    return NextResponse.json({
      success: true,
      source: 'fallback',
      models: getFallbackModels(),
      metadata: {
        lastUpdated: new Date().toISOString(),
        source: 'fallback',
        totalModels: 5,
        warning: 'Using fallback data. Live data not available.'
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })
    
  } catch (error) {
    console.error('Error fetching AA data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch AA data',
        models: getFallbackModels(),
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'error-fallback'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/aa-sync
 * Handle GitHub webhook for data updates
 */
export async function POST(request: NextRequest) {
  try {
    // Verify GitHub webhook signature if configured
    const signature = request.headers.get('x-hub-signature-256')
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    
    if (webhookSecret && signature) {
      const body = await request.text()
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
      
      // Clear cache on webhook
      cachedData = null
      cacheTimestamp = 0
      
      console.log('📦 AA data updated via GitHub webhook')
      return NextResponse.json({ 
        message: 'Cache cleared, new data will be loaded',
        timestamp: new Date().toISOString()
      })
    }
    
    // Manual cache clear
    cachedData = null
    cacheTimestamp = 0
    
    return NextResponse.json({ 
      message: 'Cache cleared',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error handling POST request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}