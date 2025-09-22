#!/usr/bin/env node

/**
 * Admin Features Test Script
 * Usage: node test-admin-features.mjs
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_PASSWORD || 'admin-secret-2024';

console.log('🔧 Admin Features Test Suite\n');

// Helper function to make admin API calls
async function adminFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'x-admin-token': ADMIN_TOKEN,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

// Test 1: Get current featured models
async function testGetFeaturedModels() {
  console.log('Test 1: Get featured models');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/models/featured`);
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Featured models count:', data.count || 0);
    console.log('✅ Success:', data.success);

    if (data.models && data.models.length > 0) {
      console.log('✅ Featured models:', data.models.map(m => m.name).join(', '));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

// Test 2: Pin a model (you'll need to replace with actual model ID)
async function testPinModel() {
  console.log('Test 2: Pin a model');

  // First, get available models
  const modelsResponse = await fetch(`${BASE_URL}/api/v1/models?limit=20`);
  const modelsData = await modelsResponse.json();

  if (!modelsData.models || modelsData.models.length === 0) {
    console.log('❌ No models available to pin');
    return;
  }

  const modelToPin = modelsData.models[0]; // Pin the first model

  try {
    const response = await adminFetch(`${BASE_URL}/api/admin/models/featured`, {
      method: 'POST',
      body: JSON.stringify({
        modelId: modelToPin.id,
        action: 'pin',
        order: 1,
        reason: 'Testing admin features'
      })
    });

    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('✅ Message:', data.message);

    if (data.model) {
      console.log('✅ Pinned model:', data.model.name);
      console.log('✅ Featured order:', data.model.featuredOrder);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

// Test 3: Reorder featured models
async function testReorderModels() {
  console.log('Test 3: Reorder featured models');

  // Get current featured models
  const featuredResponse = await fetch(`${BASE_URL}/api/admin/models/featured`);
  const featuredData = await featuredResponse.json();

  if (!featuredData.models || featuredData.models.length < 2) {
    console.log('⚠️ Need at least 2 featured models to test reordering');
    return;
  }

  // Swap the first two models
  const modelOrders = [
    { modelId: featuredData.models[0].id, order: 2 },
    { modelId: featuredData.models[1].id, order: 1 }
  ];

  try {
    const response = await adminFetch(`${BASE_URL}/api/admin/models/featured`, {
      method: 'PUT',
      body: JSON.stringify({ modelOrders })
    });

    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('✅ Message:', data.message);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

// Test 4: Unpin a model
async function testUnpinModel() {
  console.log('Test 4: Unpin a model');

  // Get current featured models
  const featuredResponse = await fetch(`${BASE_URL}/api/admin/models/featured`);
  const featuredData = await featuredResponse.json();

  if (!featuredData.models || featuredData.models.length === 0) {
    console.log('⚠️ No featured models to unpin');
    return;
  }

  const modelToUnpin = featuredData.models[0];

  try {
    const response = await adminFetch(`${BASE_URL}/api/admin/models/featured`, {
      method: 'POST',
      body: JSON.stringify({
        modelId: modelToUnpin.id,
        action: 'unpin'
      })
    });

    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('✅ Message:', data.message);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

// Test 5: Clear all featured models
async function testClearAllFeatured() {
  console.log('Test 5: Clear all featured models');

  try {
    const response = await adminFetch(`${BASE_URL}/api/admin/models/featured`, {
      method: 'DELETE'
    });

    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('✅ Message:', data.message);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

// Test 6: Check dashboard with featured models
async function testDashboardWithFeatured() {
  console.log('Test 6: Check dashboard API with featured models');

  try {
    const response = await fetch(`${BASE_URL}/api/v1/intelligence-index?limit=9`);
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Models count:', data.models?.length || 0);
    console.log('✅ Data source:', data.dataSource);

    if (data.metadata) {
      console.log('✅ Metadata source:', data.metadata.source);
      console.log('✅ Featured count:', data.metadata.featuredCount || 0);
    }

    if (data.models && data.models.length > 0) {
      const featured = data.models.filter(m => m.isFeatured);
      console.log('✅ Featured models in response:', featured.length);
      if (featured.length > 0) {
        console.log('✅ Featured models:', featured.map(m => m.name).join(', '));
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('Starting admin feature tests...\n');
  console.log('Using admin token:', ADMIN_TOKEN.substring(0, 5) + '...\n');

  await testGetFeaturedModels();
  // await testPinModel(); // Uncomment to test pinning
  // await testReorderModels(); // Uncomment to test reordering
  // await testUnpinModel(); // Uncomment to test unpinning
  // await testClearAllFeatured(); // Uncomment to clear all
  await testDashboardWithFeatured();

  console.log('✨ All tests completed!');
  console.log('\n📝 Manual Testing Instructions:');
  console.log('1. Uncomment the test functions you want to run');
  console.log('2. Set ADMIN_PASSWORD environment variable if different');
  console.log('3. Use curl to test directly:');
  console.log('\nPin a model:');
  console.log(`curl -X POST ${BASE_URL}/api/admin/models/featured \\
  -H "x-admin-token: ${ADMIN_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"modelId": "MODEL_ID", "action": "pin", "order": 1}'`);
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