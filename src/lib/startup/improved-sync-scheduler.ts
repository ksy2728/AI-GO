import { improvedAASyncScheduler } from '@/services/aa-sync-improved';

/**
 * Initialize the improved AA sync scheduler on server startup
 */
export function initializeImprovedSyncScheduler() {
  // Check if we're in a browser environment (should not run there)
  if (typeof window !== 'undefined') {
    return;
  }

  // Check environment variables
  const isEnabled = process.env.ENABLE_AA_SYNC !== 'false';
  const syncInterval = parseInt(process.env.AA_SYNC_INTERVAL || '1800000'); // 30 minutes default

  if (!isEnabled) {
    console.log('🚫 AA Improved Sync is disabled via environment variable');
    return;
  }

  console.log(`🚀 Initializing Improved AA Sync Scheduler (interval: ${syncInterval / 1000 / 60} minutes)`);

  // Start the scheduler
  try {
    improvedAASyncScheduler.start();
    console.log('✅ Improved AA Sync Scheduler started successfully');
  } catch (error) {
    console.error('❌ Failed to start Improved AA Sync Scheduler:', error);
  }

  // Graceful shutdown
  if (process.env.NODE_ENV !== 'development') {
    process.on('SIGTERM', () => {
      console.log('📤 SIGTERM received, stopping Improved AA Sync Scheduler...');
      improvedAASyncScheduler.stop();
    });

    process.on('SIGINT', () => {
      console.log('📤 SIGINT received, stopping Improved AA Sync Scheduler...');
      improvedAASyncScheduler.stop();
    });
  }
}