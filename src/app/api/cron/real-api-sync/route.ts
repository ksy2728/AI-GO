import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { realAPISyncService } from '@/services/real-api-sync.service'

/**
 * Scheduled Real API Sync Cron Job
 * Runs automatically to keep data fresh
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'development-cron-secret'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 })
    }

    console.log('🕐 Starting scheduled real API sync...')

    // Check if APIs are configured
    const apiStatus = await realAPISyncService.checkAPIConfiguration()
    const configuredProviders = Object.entries(apiStatus)
      .filter(([_, configured]) => configured)
      .map(([provider]) => provider)

    if (configuredProviders.length === 0) {
      console.log('⚠️ No APIs configured, skipping sync')
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'No API keys configured',
        apiStatus
      })
    }

    // Run incremental sync (safe for scheduled execution)
    const results = await realAPISyncService.runIncrementalSync()

    // Log results
    const summary = {
      totalProviders: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalModels: results.reduce((sum, r) => sum + r.modelsUpdated, 0),
      totalMetrics: results.reduce((sum, r) => sum + r.metricsCollected, 0),
      duration: results.reduce((sum, r) => sum + r.duration, 0)
    }

    console.log('📊 Scheduled sync completed:', summary)

    // Check for errors
    const errors = results.filter(r => r.error)
    const hasErrors = errors.length > 0

    if (hasErrors) {
      console.error('❌ Some providers failed:', errors.map(e => `${e.provider}: ${e.error}`))
    }

    return NextResponse.json({
      success: true,
      scheduled: true,
      summary,
      results: results.map(r => ({
        provider: r.provider,
        success: r.success,
        modelsUpdated: r.modelsUpdated,
        metricsCollected: r.metricsCollected,
        duration: r.duration,
        error: r.error
      })),
      errors: errors.map(r => ({
        provider: r.provider,
        error: r.error
      })),
      timestamp: new Date().toISOString(),
      nextRun: new Date(Date.now() + 3600000).toISOString() // 1 hour
    })

  } catch (error) {
    console.error('❌ Scheduled real API sync failed:', error)

    return NextResponse.json({
      success: false,
      scheduled: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Manual trigger for debugging (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { force = false } = body

    console.log(`🔧 Manual cron trigger (force: ${force})`)

    // Run sync based on force parameter
    let results
    if (force) {
      results = await realAPISyncService.runFullSync()
    } else {
      results = await realAPISyncService.runIncrementalSync()
    }

    const summary = {
      totalProviders: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalModels: results.reduce((sum, r) => sum + r.modelsUpdated, 0),
      totalMetrics: results.reduce((sum, r) => sum + r.metricsCollected, 0),
      duration: results.reduce((sum, r) => sum + r.duration, 0)
    }

    return NextResponse.json({
      success: true,
      manual: true,
      force,
      summary,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Manual cron trigger failed:', error)

    return NextResponse.json({
      success: false,
      manual: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}