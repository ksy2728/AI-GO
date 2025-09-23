#!/usr/bin/env node
/**
 * Run sync with performance filtering enabled
 * This will filter out models below average intelligence score
 */

require('dotenv').config({ path: '.env.local' });

// Enable performance filtering
process.env.AA_ENABLE_PERFORMANCE_FILTER = 'true';

// Optionally set custom threshold (comment out to use average)
// process.env.AA_MIN_INTELLIGENCE = '40';

console.log('🚀 Running AA sync with performance filtering enabled');
console.log('Configuration:');
console.log(`  - Filtering: ${process.env.AA_ENABLE_PERFORMANCE_FILTER !== 'false' ? 'ENABLED' : 'DISABLED'}`);
if (process.env.AA_MIN_INTELLIGENCE) {
  console.log(`  - Threshold: ${process.env.AA_MIN_INTELLIGENCE} (custom)`);
} else {
  console.log(`  - Threshold: Average (dynamic)`);
}
console.log('');

// Import and run the sync function
const { syncAAData } = require('./dist/services/sync-aa-real-data');

syncAAData()
  .then(() => {
    console.log('\n✅ Sync completed successfully with performance filtering!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  });