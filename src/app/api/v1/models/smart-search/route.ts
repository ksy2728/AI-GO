import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { SmartSearchService } from '@/services/smart-search.service'
import type { SearchFilters } from '@/services/smart-search.service'
import { z } from 'zod'

const SearchParamsSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  providers: z.string().optional(),
  modalities: z.string().optional(),
  capabilities: z.string().optional(),
  status: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? Number(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? Number(val) : undefined),
  priceType: z.enum(['input', 'output']).optional(),
  minIntelligence: z.string().optional().transform(val => val ? Number(val) : undefined),
  maxIntelligence: z.string().optional().transform(val => val ? Number(val) : undefined),
  minSpeed: z.string().optional().transform(val => val ? Number(val) : undefined),
  maxSpeed: z.string().optional().transform(val => val ? Number(val) : undefined),
  minContextWindow: z.string().optional().transform(val => val ? Number(val) : undefined),
  maxContextWindow: z.string().optional().transform(val => val ? Number(val) : undefined),
  releasedAfter: z.string().optional(),
  isActive: z.string().optional().transform(val => val ? val === 'true' : undefined)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = SearchParamsSchema.parse(Object.fromEntries(searchParams))

    // Build filters from query parameters
    const filters: SearchFilters = {}

    if (params.providers) {
      filters.providers = params.providers.split(',').map(p => p.trim())
    }

    if (params.modalities) {
      filters.modalities = params.modalities.split(',').map(m => m.trim())
    }

    if (params.capabilities) {
      filters.capabilities = params.capabilities.split(',').map(c => c.trim())
    }

    if (params.status) {
      filters.status = params.status.split(',').map(s => s.trim())
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      filters.priceRange = {
        min: params.minPrice,
        max: params.maxPrice,
        type: params.priceType || 'input'
      }
    }

    if (params.minIntelligence !== undefined || params.maxIntelligence !== undefined) {
      filters.performanceRange = {
        ...filters.performanceRange,
        intelligence: {
          min: params.minIntelligence,
          max: params.maxIntelligence
        }
      }
    }

    if (params.minSpeed !== undefined || params.maxSpeed !== undefined) {
      filters.performanceRange = {
        ...filters.performanceRange,
        speed: {
          min: params.minSpeed,
          max: params.maxSpeed
        }
      }
    }

    if (params.minContextWindow !== undefined || params.maxContextWindow !== undefined) {
      filters.contextWindow = {
        min: params.minContextWindow,
        max: params.maxContextWindow
      }
    }

    if (params.releasedAfter) {
      filters.releasedAfter = params.releasedAfter
    }

    if (params.isActive !== undefined) {
      filters.isActive = params.isActive
    }

    // Perform smart search
    const result = await SmartSearchService.search(
      params.q,
      params.page,
      params.limit,
      filters
    )

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: result.totalCount,
        totalPages: Math.ceil(result.totalCount / params.limit)
      }
    })

  } catch (error) {
    console.error('Smart search API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { query, filters, page = 1, limit = 20 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a string'
        },
        { status: 400 }
      )
    }

    // Perform smart search with request body filters
    const result = await SmartSearchService.search(query, page, limit, filters)

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total: result.totalCount,
        totalPages: Math.ceil(result.totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Smart search POST API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}