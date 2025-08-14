#!/usr/bin/env node

/**
 * Sync all AI provider data
 */

const http = require('http');

const SYNC_ENDPOINTS = [
  { name: 'OpenAI', path: '/api/v1/sync/openai' },
  { name: 'Anthropic', path: '/api/v1/sync/anthropic' },
  { name: 'Google AI', path: '/api/v1/sync/google' },
  { name: 'Meta AI', path: '/api/v1/sync/meta' },
];

async function syncProvider(provider) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3006,
      path: provider.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    console.log(`🔄 Syncing ${provider.name}...`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log(`✅ ${provider.name} synced successfully`);
            resolve(result);
          } else {
            console.error(`❌ ${provider.name} sync failed:`, result.error);
            resolve(null); // Continue with other providers even if one fails
          }
        } catch (error) {
          console.error(`❌ ${provider.name} parse error:`, error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${provider.name} request error:`, error.message);
      resolve(null);
    });

    req.end();
  });
}

async function syncAll() {
  console.log('🚀 Starting sync for all providers...\n');
  const startTime = Date.now();

  const results = await Promise.all(
    SYNC_ENDPOINTS.map(provider => syncProvider(provider))
  );

  const successCount = results.filter(r => r !== null).length;
  const failCount = results.filter(r => r === null).length;
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n📊 Sync Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏱️ Duration: ${duration}s`);
  console.log(`🎯 Completion: ${new Date().toISOString()}`);

  // Exit with error code if any sync failed
  process.exit(failCount > 0 ? 1 : 0);
}

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3006,
      path: '/api/health',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  const isServerRunning = await checkServer();
  
  if (!isServerRunning) {
    console.error('❌ Server is not running on port 3006');
    console.log('💡 Please start the server with: npm run dev');
    process.exit(1);
  }

  await syncAll();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { syncAll };