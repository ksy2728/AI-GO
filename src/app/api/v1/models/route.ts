import { NextResponse } from 'next/server'
import { UnifiedModelService } from '@/services/unified-models.service'
import type { UnifiedModelFilters } from '@/types/unified-models'

// Disable caching for this route to ensure fresh data
export const revalidate = 0
export const dynamic = 'force-dynamic'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  })
}

export async function GET(request: Request) {
  // Set CORS headers
  const headers = new Headers(corsHeaders)

  try {
    const { searchParams } = new URL(request.url)

    // Parse pagination parameters
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const page = Math.floor(offset / limit) + 1

    // Parse filter parameters
    const filters: UnifiedModelFilters = {}

    // Basic filters
    const provider = searchParams.get('provider')
    if (provider) filters.provider = provider

    const status = searchParams.get('status')
    if (status) filters.status = status

    const modality = searchParams.get('modality')
    if (modality) filters.modality = modality

    const capability = searchParams.get('capability')
    if (capability) filters.capability = capability

    const isActive = searchParams.get('isActive')
    if (isActive !== null) filters.isActive = isActive === 'true'

    const query = searchParams.get('q') || searchParams.get('search')
    if (query) filters.query = query

    // Note: Now using AA models exclusively for high-quality data

    // Range filters
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    if (minPrice || maxPrice) {
      filters.priceRange = {}
      if (minPrice) filters.priceRange.min = parseFloat(minPrice)
      if (maxPrice) filters.priceRange.max = parseFloat(maxPrice)
    }

    const minIntelligence = searchParams.get('minIntelligence')
    const maxIntelligence = searchParams.get('maxIntelligence')
    if (minIntelligence || maxIntelligence) {
      filters.intelligenceRange = {}
      if (minIntelligence) filters.intelligenceRange.min = parseInt(minIntelligence)
      if (maxIntelligence) filters.intelligenceRange.max = parseInt(maxIntelligence)
    }

    const minSpeed = searchParams.get('minSpeed')
    const maxSpeed = searchParams.get('maxSpeed')
    if (minSpeed || maxSpeed) {
      filters.speedRange = {}
      if (minSpeed) filters.speedRange.min = parseFloat(minSpeed)
      if (maxSpeed) filters.speedRange.max = parseFloat(maxSpeed)
    }

    console.log(`📊 API Request: page ${page}, limit ${limit}, filters:`, filters)

    // Get unified models using the new service
    const startTime = Date.now()
    const response = await UnifiedModelService.getAll(filters, limit, offset)
    const duration = Date.now() - startTime

    console.log(`✅ API Response: ${response.models.length}/${response.total} models in ${duration}ms`)

    // Return response with CORS headers
    return NextResponse.json({
      models: response.models,
      data: response.models, // Compatibility alias
      total: response.total,
      limit: response.limit,
      offset: response.offset,
      page: response.page,
      totalPages: response.totalPages,
      timestamp: response.timestamp,
      dataSource: response.dataSource,
      cached: response.cached || false,
      fallbackReason: response.fallbackReason,
      // Performance metrics
      duration: duration,
      cacheStats: UnifiedModelService.getCacheStats()
    }, { headers })

  } catch (error) {
    console.error('❌ Models API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch models',
        message: error instanceof Error ? error.message : 'Unknown error',
        models: [],
        data: [], // Compatibility alias
        total: 0,
        limit: parseInt(new URL(request.url).searchParams.get('limit') || '50'),
        offset: parseInt(new URL(request.url).searchParams.get('offset') || '0'),
        page: 1,
        totalPages: 0,
        timestamp: new Date().toISOString(),
        dataSource: 'error',
        cached: false
      },
      { status: 500, headers }
    )
  }
}

// Add a cache clearing endpoint for development/testing
export async function DELETE() {
  try {
    UnifiedModelService.clearCache()
    return NextResponse.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Cache clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}