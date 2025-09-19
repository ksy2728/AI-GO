import { NextResponse } from 'next/server'
import aaModelsData from '../../../../../public/data/aa-models.json'

// Disable caching to always serve fresh data
export const revalidate = 0
export const dynamic = 'force-dynamic'

/**
 * API endpoint to serve AA models data
 * This allows dynamic updates without rebuilding
 */
export async function GET() {
  try {
    // First, try to serve static data (always available)
    const staticModels = aaModelsData.models || []

    // Optionally, try to fetch fresh data from GitHub
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/ksy2728/AI-GO/master/public/data/aa-models.json',
        {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(2000) // 2s timeout
        }
      )

      if (response.ok) {
        const freshData = await response.json()
        console.log(`🔄 Serving fresh AA data: ${freshData.models?.length || 0} models`)

        return NextResponse.json({
          models: freshData.models || staticModels,
          source: 'github-fresh',
          timestamp: new Date().toISOString(),
          count: freshData.models?.length || staticModels.length
        })
      }
    } catch (error) {
      console.log('⚠️ Could not fetch fresh data, using static import')
    }

    // Fallback to static data
    return NextResponse.json({
      models: staticModels,
      source: 'static-import',
      timestamp: new Date().toISOString(),
      count: staticModels.length
    })

  } catch (error) {
    console.error('❌ AA data API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to load AA models data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to trigger data refresh
 * Can be called by GitHub Actions webhook after data update
 */
export async function POST(request: Request) {
  try {
    // Verify webhook secret if configured
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Trigger revalidation
    console.log('🔄 AA data refresh triggered via webhook')

    // Could implement cache invalidation or other refresh logic here

    return NextResponse.json({
      success: true,
      message: 'AA data refresh triggered',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AA data refresh error:', error)

    return NextResponse.json(
      {
        error: 'Failed to refresh AA data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}