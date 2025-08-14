import { NextResponse } from 'next/server'
import { StatusService } from '@/services/status.service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      )
    }

    // Get detailed status for specific model
    const modelStatus = await StatusService.getModelStatus(modelId)

    if (!modelStatus) {
      return NextResponse.json(
        { error: 'Model status not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      modelId,
      status: modelStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error fetching model status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch model status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}