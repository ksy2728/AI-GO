import { NextResponse } from 'next/server'
import { getModelHighlights } from '@/lib/model-metrics'

export const revalidate = 300 // Cache for 5 minutes
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Use the getModelHighlights function which implements DB-first strategy
    const highlights = await getModelHighlights()

    return NextResponse.json(highlights, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error in /api/v1/models/highlights:', error)

    // Return empty data structure on error
    return NextResponse.json({
      intelligence: [],
      speed: [],
      price: [],
      metadata: {
        totalModels: 0,
        lastUpdated: new Date().toISOString(),
        dataSource: 'error-fallback'
      }
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
  }
}