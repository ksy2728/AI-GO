import { NextRequest, NextResponse } from 'next/server'
import { loadDashboardFeaturedModels, DASHBOARD_TARGET_PROVIDER_NAMES } from '@/services/dashboard-featured-models.service'
import { UnifiedModelService } from '@/services/unified-models.service'

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const STALE_WHILE_REVALIDATE = 10 * 60 * 1000 // 10 minutes

interface DashboardMetadata {
  source: string
  providers: readonly string[]
  updatedAt: string
  limit: number
  [key: string]: unknown
}

interface DashboardApiPayload {
  models: Awaited<ReturnType<typeof loadDashboardFeaturedModels>>
  totalModels: number
  metadata: DashboardMetadata
  dataSource: string
  cached: boolean
  cacheAge?: number
  timestamp: string
}

let cachedPayload: { timestamp: number; data: DashboardApiPayload } | null = null

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
}

async function loadDashboardData(limit: number, forceRefresh = false): Promise<DashboardApiPayload> {
  const now = Date.now()

  if (!forceRefresh && cachedPayload && now - cachedPayload.timestamp < CACHE_TTL) {
    const cacheAge = now - cachedPayload.timestamp
    return {
      ...cachedPayload.data,
      cached: true,
      cacheAge
    }
  }

  const models = await loadDashboardFeaturedModels({ limit })
  const timestamp = new Date().toISOString()

  const metadata: DashboardMetadata = {
    source: 'Artificial Analysis • Major Providers',
    providers: DASHBOARD_TARGET_PROVIDER_NAMES,
    updatedAt: timestamp,
    limit
  }

  const payload: DashboardApiPayload = {
    models,
    totalModels: models.length,
    metadata,
    dataSource: 'aa-major-providers',
    cached: false,
    timestamp
  }

  cachedPayload = {
    timestamp: now,
    data: payload
  }

  return payload
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  })
}

export async function GET(request: NextRequest) {
  const headers = new Headers({
    ...corsHeaders,
    'Cache-Control': `public, s-maxage=${CACHE_TTL / 1000}, stale-while-revalidate=${STALE_WHILE_REVALIDATE / 1000}`
  })

  try {
    const { searchParams } = request.nextUrl
    const limitParam = parseInt(searchParams.get('limit') || '9', 10)
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 9
    const modelId = searchParams.get('modelId')
    const simulateFailure = searchParams.get('simulate_failure') === 'true'
    const forceRefresh = searchParams.get('refresh') === 'true'

    if (simulateFailure || process.env.SIMULATE_API_FAILURE === 'true') {
      throw new Error('Simulated API failure for testing fallback behavior')
    }

    const data = await loadDashboardData(limit, forceRefresh)

    headers.set('X-Data-Source', data.dataSource)
    headers.set('X-Cache-Status', data.cached ? 'HIT' : 'MISS')
    if (typeof data.cacheAge === 'number') {
      headers.set('X-Cache-Age', data.cacheAge.toString())
    }

    if (modelId) {
      const model = data.models.find(item => item.id === modelId)
      if (!model) {
        return NextResponse.json({
          error: 'Model not found',
          modelId
        }, {
          status: 404,
          headers
        })
      }

      return NextResponse.json({
        model,
        metadata: data.metadata,
        cached: data.cached,
        timestamp: data.timestamp,
        dataSource: data.dataSource
      }, { headers })
    }

    return NextResponse.json({
      models: data.models,
      totalModels: data.totalModels,
      metadata: data.metadata,
      cached: data.cached,
      cacheAge: data.cacheAge,
      timestamp: data.timestamp,
      dataSource: data.dataSource
    }, { headers })
  } catch (error) {
    console.error('Dashboard intelligence API error:', error)

    headers.set('X-Cache-Status', 'MISS')

    return NextResponse.json({
      models: [],
      totalModels: 0,
      metadata: {
        source: 'aa-major-providers',
        providers: DASHBOARD_TARGET_PROVIDER_NAMES,
        updatedAt: new Date().toISOString(),
        limit: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      cached: false,
      dataSource: 'error'
    }, {
      status: 500,
      headers
    })
  }
}

export async function POST() {
  try {
    UnifiedModelService.clearCache()
    cachedPayload = null

    const data = await loadDashboardData(9, true)

    return NextResponse.json({
      success: true,
      modelsCount: data.totalModels,
      providers: data.metadata.providers,
      message: 'Dashboard models refreshed from AA API'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh dashboard models'
    }, { status: 500 })
  }
}
