#!/usr/bin/env tsx
/**
 * Setup AA Data Sync Cron Job
 * Configures automated syncing of AA data
 */

import cron from 'node-cron'
import { syncAAData } from '../src/services/sync-aa-real-data'
import { cache } from '@/lib/redis'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Configuration
const SYNC_SCHEDULE = process.env.AA_SYNC_SCHEDULE || '0 */6 * * *' // Every 6 hours by default
const ENABLE_AUTO_SYNC = process.env.AA_AUTO_SYNC !== 'false'

/**
 * Run sync with error handling and notifications
 */
async function runScheduledSync() {
  console.log(`⏰ [${new Date().toISOString()}] Starting scheduled AA sync...`)

  try {
    // Check if sync is already running
    const syncStatus = await cache.get('aa:sync:status')
    if (syncStatus) {
      console.log('⚠️ Sync already in progress, skipping...')
      return
    }

    // Set sync status
    await cache.set('aa:sync:status', {
      startedAt: new Date().toISOString(),
      status: 'scheduled',
      type: 'automatic'
    }, 600) // 10 minutes TTL

    // Run sync
    const result = await syncAAData()

    // Log success
    console.log(`✅ Scheduled sync completed:`, result)

    // Store sync history
    const syncHistory = await cache.get<any[]>('aa:sync:history') || []
    syncHistory.unshift({
      timestamp: new Date().toISOString(),
      type: 'scheduled',
      success: true,
      result
    })
    // Keep last 10 syncs
    await cache.set('aa:sync:history', syncHistory.slice(0, 10), 86400) // 24 hours

    // Clear status
    await cache.del('aa:sync:status')

  } catch (error: any) {
    console.error(`❌ Scheduled sync failed:`, error)

    // Store error in history
    const syncHistory = await cache.get<any[]>('aa:sync:history') || []
    syncHistory.unshift({
      timestamp: new Date().toISOString(),
      type: 'scheduled',
      success: false,
      error: error.message
    })
    await cache.set('aa:sync:history', syncHistory.slice(0, 10), 86400)

    // Clear status
    await cache.del('aa:sync:status')

    // In production, you might want to send an alert here
    if (process.env.NODE_ENV === 'production') {
      // sendAlert('AA Sync Failed', error.message)
    }
  }
}

/**
 * Setup cron job
 */
function setupCronJob() {
  if (!ENABLE_AUTO_SYNC) {
    console.log('🚫 Auto-sync is disabled')
    return
  }

  console.log(`📅 Setting up AA sync cron job: ${SYNC_SCHEDULE}`)

  // Validate cron expression
  if (!cron.validate(SYNC_SCHEDULE)) {
    console.error('❌ Invalid cron expression:', SYNC_SCHEDULE)
    process.exit(1)
  }

  // Schedule the task
  const task = cron.schedule(SYNC_SCHEDULE, runScheduledSync, {
    timezone: process.env.TZ || 'UTC'
  })

  console.log('✅ Cron job scheduled successfully')

  // Run initial sync on startup if requested
  if (process.env.AA_SYNC_ON_STARTUP === 'true') {
    console.log('🚀 Running initial sync...')
    runScheduledSync()
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Stopping cron job...')
    task.stop()
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('Stopping cron job...')
    task.stop()
    process.exit(0)
  })
}

// Export for use in other scripts
export { runScheduledSync, setupCronJob }

// Run if executed directly
if (require.main === module) {
  setupCronJob()
  console.log('🔄 AA sync cron job is running... Press Ctrl+C to stop.')
}