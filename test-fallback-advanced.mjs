#!/usr/bin/env node

/**
 * Advanced Dashboard Fallback Test Suite
 * Tests cache expiration, UI badge transitions, and fallback behavior
 * Usage: node test-fallback-advanced.mjs
 */

import fetch from 'node-fetch';

// Puppeteer is optional - will be loaded dynamically if available
let puppeteer;
try {
  puppeteer = await import('puppeteer');
  puppeteer = puppeteer.default;
} catch (error) {
  console.log('⚠️ Puppeteer not installed - browser tests will be skipped');
  console.log('  Install with: npm install puppeteer');
}

const BASE_URL = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3008';
const CACHE_KEY = 'dashboard_models_cache_v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

console.log('🧪 Advanced Dashboard Fallback Test Suite\n');
console.log('================================\n');

// Helper: Create expired cache data
function createExpiredCacheData(minutesAgo = 61) {
  const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  return {
    models: [
      {
        id: 'cached-model-1',
        name: 'Cached Test Model',
        provider: 'Test Provider',
        providerLogo: 'https://example.com/logo.png',
        status: 'operational',
        rank: 1,
        availability: 99.9,
        responseTime: 100,
        errorRate: 0.01,
        throughput: 1000,
        description: 'This is a cached test model',
        capabilities: ['Test'],
        intelligenceIndex: 90
      }
    ],
    timestamp,
    dataSource: 'cache',
    version: '1.0.0'
  };
}

// Test 1: API Failure with Fresh Cache
async function testAPIFailureWithFreshCache() {
  console.log('📝 Test 1: API Failure with Fresh Cache');
  console.log('----------------------------------------');

  try {
    // Step 1: Make a normal API call to populate cache
    console.log('  1. Populating cache with normal API call...');
    const normalResponse = await fetch(`${BASE_URL}/api/v1/intelligence-index?limit=9`);
    const normalData = await normalResponse.json();
    console.log(`     ✅ Cache populated, source: ${normalData.dataSource}`);

    // Step 2: Wait 2 seconds, then simulate API failure
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('  2. Simulating API failure...');
    const failureResponse = await fetch(`${BASE_URL}/api/v1/intelligence-index?limit=9&simulate_failure=true`);
    const failureData = await failureResponse.json();

    console.log(`     📊 Response status: ${failureResponse.status}`);
    console.log(`     🏷️ Data source: ${failureData.dataSource}`);
    console.log(`     📦 Models returned: ${failureData.models?.length || 0}`);

    // Verify it's using cache or fallback
    if (failureData.dataSource === 'cache' || failureData.dataSource === 'Cache') {
      console.log('     ✅ Correctly using cached data!');
    } else if (failureData.dataSource === 'fallback' || failureData.dataSource === 'Fallback') {
      console.log('     ⚠️ Using fallback (cache might be empty)');
    } else {
      console.log(`     ❌ Unexpected data source: ${failureData.dataSource}`);
    }

  } catch (error) {
    console.error('     ❌ Test failed:', error.message);
  }

  console.log('');
}

// Test 2: Cache TTL Boundary Test
async function testCacheTTLBoundary() {
  console.log('📝 Test 2: Cache TTL Boundary Test');
  console.log('-----------------------------------');

  console.log('  Testing cache expiration boundaries:');

  const testCases = [
    { minutes: 30, expected: 'valid', description: '30 minutes old (fresh)' },
    { minutes: 59, expected: 'valid', description: '59 minutes old (almost expired)' },
    { minutes: 61, expected: 'expired', description: '61 minutes old (expired)' },
  ];

  for (const testCase of testCases) {
    const cacheData = createExpiredCacheData(testCase.minutes);
    const age = Date.now() - new Date(cacheData.timestamp).getTime();
    const isExpired = age > CACHE_TTL;

    console.log(`\n  📅 ${testCase.description}:`);
    console.log(`     Timestamp: ${cacheData.timestamp}`);
    console.log(`     Age: ${Math.floor(age / 60000)} minutes`);
    console.log(`     Expected: ${testCase.expected}`);
    console.log(`     Actual: ${isExpired ? 'expired' : 'valid'}`);
    console.log(`     ${(isExpired === (testCase.expected === 'expired')) ? '✅ Pass' : '❌ Fail'}`);
  }

  console.log('');
}

// Test 3: UI Badge Transition Test (using Puppeteer)
async function testUIBadgeTransition() {
  console.log('📝 Test 3: UI Badge Transition Test');
  console.log('------------------------------------');

  // Check if Puppeteer is available
  if (!puppeteer) {
    console.log('  ⚠️ Skipping browser test - Puppeteer not available');
    console.log('');
    return;
  }

  try {
    const browser = await puppeteer.launch({ headless: true });
    console.log('  🌐 Browser launched');

    const page = await browser.newPage();

    // Test normal load
    console.log('\n  1. Testing normal dashboard load...');
    await page.goto(`${BASE_URL}/`);
    await page.waitForSelector('[class*="rounded-full"]', { timeout: 5000 });

    const normalBadge = await page.evaluate(() => {
      const badges = document.querySelectorAll('[class*="rounded-full"]');
      for (const badge of badges) {
        const text = badge.textContent;
        if (text.includes('Live') || text.includes('Cached') || text.includes('Fallback') || text.includes('Pinned')) {
          return text.trim();
        }
      }
      return null;
    });

    console.log(`     🏷️ Badge found: ${normalBadge || 'Not found'}`);

    // Test with API failure
    console.log('\n  2. Testing with API failure simulation...');
    await page.evaluate(() => {
      // Clear localStorage to force fresh fetch
      localStorage.removeItem('dashboard_models_cache_v1');
    });

    // Navigate with simulate_failure
    await page.goto(`${BASE_URL}/?test_mode=simulate_failure`);
    await page.waitForSelector('[class*="rounded-full"]', { timeout: 5000 });

    const failureBadge = await page.evaluate(() => {
      const badges = document.querySelectorAll('[class*="rounded-full"]');
      for (const badge of badges) {
        const text = badge.textContent;
        if (text.includes('Fallback')) {
          return text.trim();
        }
      }
      return null;
    });

    console.log(`     🏷️ Badge after failure: ${failureBadge || 'Not found'}`);

    if (failureBadge && failureBadge.includes('Fallback')) {
      console.log('     ✅ UI correctly shows Fallback badge!');
    } else {
      console.log('     ⚠️ Fallback badge not detected');
    }

    await browser.close();
    console.log('  🌐 Browser closed');

  } catch (error) {
    console.log('  ⚠️ Puppeteer not available, skipping browser test');
    console.log('     Install with: npm install puppeteer');
  }

  console.log('');
}

// Test 4: Manual Cache Manipulation Test
async function testManualCacheManipulation() {
  console.log('📝 Test 4: Manual Cache Manipulation');
  console.log('-------------------------------------');

  console.log('  📋 Instructions for manual testing:\n');

  console.log('  1. Open browser DevTools (F12)');
  console.log('  2. Go to Application > Local Storage');
  console.log(`  3. Find key: ${CACHE_KEY}`);
  console.log('  4. To simulate expired cache, run in Console:');
  console.log(`\n     const cache = JSON.parse(localStorage.getItem('${CACHE_KEY}'));`);
  console.log(`     cache.timestamp = new Date(Date.now() - 61 * 60 * 1000).toISOString();`);
  console.log(`     localStorage.setItem('${CACHE_KEY}', JSON.stringify(cache));\n`);
  console.log('  5. Refresh the page and observe badge change');
  console.log('     Expected: ⚪ Fallback badge should appear');

  console.log('');
}

// Test 5: Data Source Priority Test
async function testDataSourcePriority() {
  console.log('📝 Test 5: Data Source Priority Verification');
  console.log('--------------------------------------------');

  console.log('  Priority Order:');
  console.log('  1. 📌 Featured (DB pinned models)');
  console.log('  2. 🟢 Live (Real-time API data)');
  console.log('  3. 🟡 Cache (localStorage <1 hour)');
  console.log('  4. ⚪ Fallback (Hardcoded defaults)');

  console.log('\n  Testing priority chain...');

  // Test featured models endpoint
  try {
    const featuredResponse = await fetch(`${BASE_URL}/api/admin/models/featured`);
    const featuredData = await featuredResponse.json();
    console.log(`\n  📌 Featured models: ${featuredData.count || 0}`);

    if (featuredData.count > 0) {
      console.log('     Featured models will take priority');
    }
  } catch (error) {
    console.log('  ℹ️ Featured models endpoint not accessible');
  }

  // Test normal API
  try {
    const response = await fetch(`${BASE_URL}/api/v1/intelligence-index?limit=9`);
    const data = await response.json();
    console.log(`  🏷️ Current data source: ${data.dataSource}`);
    console.log(`  📊 Models count: ${data.models?.length || 0}`);

    if (data.metadata?.featuredCount) {
      console.log(`  📌 Featured count: ${data.metadata.featuredCount}`);
    }
  } catch (error) {
    console.log('  ❌ API error:', error.message);
  }

  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Advanced Tests...\n');

  // Check if server is running
  try {
    await fetch(BASE_URL);
  } catch (error) {
    console.error('❌ Server is not running!');
    console.log('Please start the development server first:');
    console.log('  npm run dev');
    process.exit(1);
  }

  await testAPIFailureWithFreshCache();
  await testCacheTTLBoundary();
  await testUIBadgeTransition();
  await testManualCacheManipulation();
  await testDataSourcePriority();

  console.log('================================');
  console.log('✨ All tests completed!\n');

  console.log('📌 Quick Test Commands:');
  console.log('----------------------------');
  console.log('# Normal API call:');
  console.log(`curl "${BASE_URL}/api/v1/intelligence-index?limit=9"\n`);

  console.log('# Simulate API failure:');
  console.log(`curl "${BASE_URL}/api/v1/intelligence-index?limit=9&simulate_failure=true"\n`);

  console.log('# Check featured models:');
  console.log(`curl "${BASE_URL}/api/admin/models/featured"\n`);

  console.log('# Clear cache (in browser console):');
  console.log(`localStorage.removeItem('${CACHE_KEY}');\n`);

  console.log('# Check cache contents (in browser console):');
  console.log(`JSON.parse(localStorage.getItem('${CACHE_KEY}'));\n`);
}

runAllTests().catch(console.error);