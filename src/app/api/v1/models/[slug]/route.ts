import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { TempDataService } from '@/services/temp-data.service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Model slug is required' },
        { status: 400 }
      )
    }

    // Try database first, fallback to temporary data
    let model
    try {
      model = await ModelService.getBySlug(slug)
    } catch (error) {
      console.warn('⚠️ Database service failed, using temporary data:', error instanceof Error ? error.message : 'Unknown error')
      model = await TempDataService.getModelBySlug(slug)
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      model,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error fetching model details:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch model details',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}