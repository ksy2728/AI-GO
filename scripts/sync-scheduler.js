#!/usr/bin/env node

/**
 * Automatic sync scheduler for AI providers
 * Runs every 10 minutes to keep data fresh
 */

const { syncAll } = require('./sync-all-providers');

const SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutes
const RETRY_INTERVAL = 60 * 1000; // 1 minute for retries

let syncCount = 0;
let lastSyncTime = null;
let isRunning = false;

async function performSync() {
  if (isRunning) {
    console.log('⏭️ Sync already in progress, skipping...');
    return;
  }

  isRunning = true;
  syncCount++;
  
  const syncNumber = syncCount;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔄 Sync #${syncNumber} starting at ${new Date().toISOString()}`);
  console.log(`${'='.repeat(50)}\n`);

  try {
    await syncAll();
    lastSyncTime = new Date();
    console.log(`\n✅ Sync #${syncNumber} completed successfully`);
  } catch (error) {
    console.error(`\n❌ Sync #${syncNumber} failed:`, error.message);
    console.log(`🔄 Will retry in ${RETRY_INTERVAL / 1000} seconds...`);
    
    // Schedule a retry
    setTimeout(() => {
      isRunning = false;
      performSync();
    }, RETRY_INTERVAL);
    return;
  } finally {
    isRunning = false;
  }

  // Schedule next sync
  const nextSyncTime = new Date(Date.now() + SYNC_INTERVAL);
  console.log(`⏰ Next sync scheduled for: ${nextSyncTime.toLocaleTimeString()}`);
}

function displayStatus() {
  console.log('\n📊 Scheduler Status:');
  console.log(`- Total syncs: ${syncCount}`);
  console.log(`- Last sync: ${lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}`);
  console.log(`- Sync interval: ${SYNC_INTERVAL / 1000 / 60} minutes`);
  console.log(`- Status: ${isRunning ? '🔄 Syncing...' : '✅ Idle'}`);
}

function startScheduler() {
  console.log('🚀 AI Provider Sync Scheduler Started');
  console.log(`📅 Sync interval: Every ${SYNC_INTERVAL / 1000 / 60} minutes`);
  console.log(`🕐 Current time: ${new Date().toLocaleString()}`);
  console.log('\nPress Ctrl+C to stop the scheduler\n');

  // Perform initial sync
  performSync();

  // Set up interval for regular syncs
  const intervalId = setInterval(performSync, SYNC_INTERVAL);

  // Set up status display every minute
  const statusIntervalId = setInterval(displayStatus, 60 * 1000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down scheduler...');
    clearInterval(intervalId);
    clearInterval(statusIntervalId);
    displayStatus();
    console.log('\n👋 Scheduler stopped gracefully');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    clearInterval(intervalId);
    clearInterval(statusIntervalId);
    process.exit(0);
  });
}

// Environment variable to control scheduler
const AUTO_START = process.env.AUTO_SYNC === 'true';

if (AUTO_START || require.main === module) {
  startScheduler();
}

module.exports = { startScheduler, performSync };