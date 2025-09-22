#!/usr/bin/env node

/**
 * Test script for dashboard fallback behavior
 * Usage: node test-dashboard-fallback.mjs
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Dashboard Fallback Test Suite\n');

// Test 1: Normal API call
async function testNormalAPI() {
  console.log('Test 1: Normal API call');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/intelligence-index?limit=9`);
    const data = await response.json();

    console.log('✅ API Status:', response.status);
    console.log('✅ Models returned:', data.models?.length || 0);
    console.log('✅ Data source:', data.dataSource);
    console.log('✅ Timestamp:', data.timestamp);
    console.log('✅ Cached:', data.cached);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

// Test 2: Simulated API failure
async function testAPIFailure() {
  console.log('Test 2: Simulated API failure');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/intelligence-index?limit=9&simulate_failure=true`);
    const data = await response.json();

    console.log('⚠️ API Status:', response.status);
    console.log('⚠️ Should trigger fallback');
    console.log('⚠️ Models returned:', data.models?.length || 0);
    console.log('⚠️ Data source:', data.dataSource);
  } catch (error) {
    console.error('✅ Expected failure:', error.message);
  }
  console.log('');
}

// Test 3: Cache behavior
async function testCacheBehavior() {
  console.log('Test 3: Cache behavior');

  // First call - should cache
  console.log('  First call (should cache):');
  const response1 = await fetch(`${BASE_URL}/api/v1/intelligence-index?limit=9`);
  const data1 = await response1.json();
  console.log('  ✅ Cached:', data1.cached);

  // Second call - might use cache
  console.log('  Second call (might use cache):');
  const response2 = await fetch(`${BASE_URL}/api/v1/intelligence-index?limit=9`);
  const data2 = await response2.json();
  console.log('  ✅ Cached:', data2.cached);
  console.log('  ✅ Cache age:', data2.cacheAge);

  console.log('');
}

// Test 4: Dashboard page load
async function testDashboardPage() {
  console.log('Test 4: Dashboard page load');
  try {
    const response = await fetch(`${BASE_URL}/`);

    console.log('✅ Page Status:', response.status);
    console.log('✅ Content-Type:', response.headers.get('content-type'));

    // Check if page contains expected elements
    const html = await response.text();
    const hasModels = html.includes('AI Models');
    const hasIntelligence = html.includes('Intelligence');

    console.log('✅ Contains "AI Models":', hasModels);
    console.log('✅ Contains "Intelligence":', hasIntelligence);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('Starting tests...\n');

  await testNormalAPI();
  await testAPIFailure();
  await testCacheBehavior();
  await testDashboardPage();

  console.log('✨ All tests completed!');
  console.log('\n📝 Manual Testing Instructions:');
  console.log('1. Open browser DevTools > Application > Local Storage');
  console.log('2. Look for key: dashboard_models_cache_v1');
  console.log('3. Clear cache and refresh to test fallback');
  console.log('4. Add ?simulate_failure=true to API URL to test failure mode');
  console.log('\n🔄 To test cache expiration:');
  console.log('1. Change CACHE_TTL in useFeaturedModels.ts to 10000 (10 seconds)');
  console.log('2. Wait 10 seconds and refresh');
  console.log('3. Should fetch fresh data');
}

// Check if server is running
fetch(BASE_URL)
  .then(() => runAllTests())
  .catch(() => {
    console.error('❌ Server is not running!');
    console.log('Please start the development server first:');
    console.log('  npm run dev');
    process.exit(1);
  });