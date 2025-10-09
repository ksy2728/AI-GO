import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { realAPISyncService } from '@/services/real-api-sync.service'

/**
 * Real API Data Sync Endpoint
 * Triggers actual API calls to get live data from all providers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      type = 'incremental',
      providers,
      includeMetrics = true,
      includeAA = true,
      metricsDepth = 'shallow'
    } = body

    console.log(`🚀 Starting ${type} real API sync...`)

    // Check API configuration first
    const apiStatus = await realAPISyncService.checkAPIConfiguration()
    const configuredProviders = Object.entries(apiStatus)
      .filter(([_, configured]) => configured)
      .map(([provider]) => provider)

    console.log('📋 API Configuration Status:', apiStatus)
    console.log('✅ Configured providers:', configuredProviders)

    if (configuredProviders.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No API keys configured. Please set up API keys in environment variables.',
        apiStatus,
        message: 'Configure OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, and/or REPLICATE_API_TOKEN'
      }, { status: 400 })
    }

    // Run the appropriate sync type
    let results
    if (type === 'full') {
      results = await realAPISyncService.runFullSync()
    } else {
      results = await realAPISyncService.syncAllProviders({
        providers: providers || configuredProviders,
        includeMetrics,
        includeAA,
        forceRefresh: type === 'force',
        metricsDepth
      })
    }

    // Calculate summary statistics
    const summary = {
      totalProviders: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalModels: results.reduce((sum, r) => sum + r.modelsUpdated, 0),
      totalPricing: results.reduce((sum, r) => sum + r.pricingUpdated, 0),
      totalMetrics: results.reduce((sum, r) => sum + r.metricsCollected, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      averageDuration: Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)
    }

    const errors = results.filter(r => r.error)
    const hasErrors = errors.length > 0

    return NextResponse.json({
      success: !hasErrors || summary.successful > 0,
      type,
      summary,
      results,
      errors: errors.map(r => ({
        provider: r.provider,
        error: r.error
      })),
      apiStatus,
      timestamp: new Date().toISOString(),
      nextScheduledSync: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    })

  } catch (error) {
    console.error('❌ Real API sync failed:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Get sync status and configuration
 */
export async function GET() {
  try {
    // Check API configuration
    const apiStatus = await realAPISyncService.checkAPIConfiguration()

    // Get last sync info from cache/database if available
    // This would typically come from a sync history table
    const lastSyncInfo = {
      lastRun: null, // Would get from database
      nextScheduled: new Date(Date.now() + 3600000).toISOString(),
      status: 'ready'
    }

    return NextResponse.json({
      success: true,
      apiConfiguration: apiStatus,
      configuredProviders: Object.entries(apiStatus)
        .filter(([_, configured]) => configured)
        .map(([provider]) => provider),
      unconfiguredProviders: Object.entries(apiStatus)
        .filter(([_, configured]) => !configured)
        .map(([provider]) => provider),
      syncInfo: lastSyncInfo,
      availableSyncTypes: [
        {
          type: 'incremental',
          description: 'Update existing data with new information',
          duration: '~2-5 minutes',
          recommended: true
        },
        {
          type: 'full',
          description: 'Complete refresh of all data including metrics',
          duration: '~10-20 minutes',
          recommended: false
        },
        {
          type: 'force',
          description: 'Force refresh by clearing caches first',
          duration: '~5-10 minutes',
          recommended: false
        }
      ],
      instructions: {
        setup: [
          'Set OPENAI_API_KEY in environment variables',
          'Set ANTHROPIC_API_KEY in environment variables',
          'Set GOOGLE_AI_API_KEY in environment variables',
          'Set REPLICATE_API_TOKEN in environment variables'
        ],
        usage: [
          'POST /api/sync/real-data with { "type": "incremental" }',
          'Monitor response for success/failure status',
          'Check results for updated model counts'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Failed to get sync status:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}