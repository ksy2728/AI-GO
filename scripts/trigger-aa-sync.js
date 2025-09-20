#!/usr/bin/env node

/**
 * Manual trigger for AA (Artificial Analysis) data sync
 * This script fetches the latest data from AA and updates the database
 */

const { AASyncScheduler } = require('../src/services/aa-sync-scheduler');

async function triggerAASync() {
  console.log('🚀 Starting manual AA data sync...');
  console.log('📅 Timestamp:', new Date().toISOString());

  try {
    const scheduler = new AASyncScheduler();

    console.log('\n📊 Fetching data from Artificial Analysis...');
    const result = await scheduler.syncAAData();

    if (result.success) {
      console.log('\n✅ AA Sync completed successfully!');
      console.log(`📈 Models updated: ${result.modelsUpdated || 0}`);
      console.log(`⚡ Intelligence scores added: ${result.intelligenceScoresAdded || 0}`);
      console.log(`🚀 Speed metrics added: ${result.speedMetricsAdded || 0}`);
      console.log(`💰 Price data added: ${result.priceDataAdded || 0}`);
    } else {
      console.error('\n❌ AA Sync failed:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Error during AA sync:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }

  console.log('\n🎉 Manual AA sync trigger completed!');
  process.exit(0);
}

// Run the sync
triggerAASync();