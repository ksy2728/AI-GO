import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { TempDataService } from '@/services/temp-data.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const provider = searchParams.get('provider')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query parameter "q" must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Build search filters
    const filters = {
      provider: provider || undefined,
      limit,
      isActive: true, // Only search active models
    }

    // Try database first, fallback to temporary data
    let models: any[] = []
    try {
      models = (await ModelService.search(query, filters)) as any[]
    } catch (error) {
      console.warn('⚠️ Database service failed, using temporary data:', error instanceof Error ? error.message : 'Unknown error')
      models = (await TempDataService.searchModels(query, filters)) as any[]
    }

    return NextResponse.json({
      results: {
        models,
        total: models.length,
      },
      query,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error in search API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}