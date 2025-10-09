import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { SmartSearchService } from '@/services/smart-search.service'
import { z } from 'zod'

const CreatePresetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  filters: z.object({}).passthrough(), // Allow any filter structure
  sort: z.object({
    field: z.enum(['intelligence', 'speed', 'priceInput', 'priceOutput', 'contextWindow', 'releasedAt', 'relevance']),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  isPublic: z.boolean().optional().default(false)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('public') === 'true'

    const presets = await SmartSearchService.getSearchPresets(
      isPublic !== undefined ? isPublic : undefined
    )

    return NextResponse.json({
      success: true,
      data: presets
    })

  } catch (error) {
    console.error('Get search presets API error:', error)

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
    const validatedData = CreatePresetSchema.parse(body)

    const preset = await SmartSearchService.saveSearchPreset(
      validatedData.name,
      validatedData.description || '',
      validatedData.filters,
      validatedData.sort,
      validatedData.isPublic
    )

    return NextResponse.json({
      success: true,
      data: preset
    }, { status: 201 })

  } catch (error) {
    console.error('Create search preset API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
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