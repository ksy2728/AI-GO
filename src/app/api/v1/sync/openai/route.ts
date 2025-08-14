import { NextResponse } from 'next/server'
import { openAIService } from '@/services/external/openai.service'

export async function POST() {
  try {
    // Check if service is configured
    if (!openAIService || !openAIService.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'OpenAI service not configured',
          message: 'Please set OPENAI_API_KEY environment variable',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    // Perform sync
    const result = await openAIService.syncWithDatabase()

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error syncing OpenAI data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync OpenAI data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get current pricing and status
    const pricing = openAIService ? await openAIService.getPricing() : []
    const isConfigured = openAIService ? openAIService.isConfigured() : false

    // Get status for main models
    const modelStatuses = []
    if (isConfigured && openAIService) {
      const models = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
      for (const model of models) {
        try {
          const status = await openAIService.checkModelStatus(model)
          modelStatuses.push(status)
        } catch (error) {
          console.warn(`Failed to check status for ${model}`)
        }
      }
    }

    return NextResponse.json({
      configured: isConfigured,
      pricing,
      modelStatuses,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error getting OpenAI info:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get OpenAI information',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}