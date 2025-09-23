#!/usr/bin/env node
/**
 * Force cache refresh on Vercel deployment
 */

const https = require('https');

const ENDPOINTS = [
  '/api/v1/models',
  '/api/v1/models?limit=5',
  '/api/v1/models?limit=20',
  '/api/v1/models?limit=50',
  '/api/v1/models/highlights',
  '/models'
];

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const url = `https://ai-server-information.vercel.app${path}${path.includes('?') ? '&' : '?'}_t=${timestamp}`;

    console.log(`  Refreshing: ${path}`);

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`    ✅ Status ${res.statusCode}`);
          resolve(true);
        } else {
          console.log(`    ⚠️  Status ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`    ❌ Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function forceRefresh() {
  console.log('============================================');
  console.log('   Forcing Cache Refresh');
  console.log('============================================\n');
  console.log('Adding cache-busting parameters to force CDN refresh...\n');

  for (const endpoint of ENDPOINTS) {
    await makeRequest(endpoint);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ Cache refresh requests sent!');
  console.log('\nNote: CDN cache may still take 2-5 minutes to fully clear.');
  console.log('Check again in a few minutes:\n');
  console.log('  node check-production-data.js\n');
  console.log('Or visit directly:');
  console.log('  https://ai-server-information.vercel.app/models\n');
}

// Run
forceRefresh().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});