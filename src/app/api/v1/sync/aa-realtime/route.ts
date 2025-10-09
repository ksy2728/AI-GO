import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { syncAAData, fetchAAData } from '@/services/sync-aa-real-data'
import { cleanTestData } from '@/services/clean-production-data'
import { cache } from '@/lib/redis'

/**
 * GET /api/v1/sync/aa-realtime
 * Get current AA sync status
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if sync is in progress
    const syncStatus = await cache.get('aa:sync:status')

    if (syncStatus) {
      return NextResponse.json({
        status: 'syncing',
        ...syncStatus
      })
    }

    // Get last sync info
    const lastSync = await cache.get('aa:sync:last')

    return NextResponse.json({
      status: 'idle',
      lastSync: lastSync || null,
      message: 'No sync in progress'
    })

  } catch (error: any) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/sync/aa-realtime
 * Trigger AA data sync
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { cleanFirst = false, forceSync = false } = body

    // Check if sync is already in progress
    const syncInProgress = await cache.get('aa:sync:status')
    if (syncInProgress && !forceSync) {
      return NextResponse.json({
        error: 'Sync already in progress',
        status: syncInProgress
      }, { status: 409 })
    }

    // Set sync status
    await cache.set('aa:sync:status', {
      startedAt: new Date().toISOString(),
      status: 'starting'
    }, 300) // 5 minutes TTL

    let cleanupResult = null
    let syncResult = null

    try {
      // Step 1: Clean test data if requested
      if (cleanFirst) {
        await cache.set('aa:sync:status', {
          startedAt: new Date().toISOString(),
          status: 'cleaning'
        }, 300)

        cleanupResult = await cleanTestData()
        console.log('✅ Cleanup completed:', cleanupResult)
      }

      // Step 2: Fetch and sync real AA data
      await cache.set('aa:sync:status', {
        startedAt: new Date().toISOString(),
        status: 'fetching'
      }, 300)

      const aaModels = await fetchAAData()

      await cache.set('aa:sync:status', {
        startedAt: new Date().toISOString(),
        status: 'syncing',
        modelsFound: aaModels.length
      }, 300)

      syncResult = await syncAAData()

      // Clear caches
      await cache.del('aa:all:models')
      await cache.del('models:all')
      await cache.del('models:highlights')

      // Update last sync info
      const lastSyncInfo = {
        completedAt: new Date().toISOString(),
        modelsProcessed: aaModels.length,
        ...syncResult,
        cleanupResult
      }

      await cache.set('aa:sync:last', lastSyncInfo, 3600) // Keep for 1 hour

      // Clear sync status
      await cache.del('aa:sync:status')

      return NextResponse.json({
        success: true,
        message: 'AA sync completed successfully',
        result: lastSyncInfo
      })

    } catch (error: any) {
      // Clear sync status on error
      await cache.del('aa:sync:status')

      // Store error info
      await cache.set('aa:sync:last:error', {
        timestamp: new Date().toISOString(),
        error: error.message
      }, 3600)

      throw error
    }

  } catch (error: any) {
    console.error('AA sync error:', error)
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/sync/aa-realtime
 * Cancel ongoing sync
 */
export async function DELETE(_request: NextRequest) {
  try {
    await cache.del('aa:sync:status')

    return NextResponse.json({
      success: true,
      message: 'Sync cancelled'
    })

  } catch (error: any) {
    console.error('Error cancelling sync:', error)
    return NextResponse.json(
      { error: 'Failed to cancel sync', details: error.message },
      { status: 500 }
    )
  }
}