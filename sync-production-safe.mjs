#!/usr/bin/env node
/**
 * Safe production sync script
 * Uses Vercel API to trigger sync without exposing database credentials
 */

import fetch from 'node-fetch';

const PRODUCTION_URL = 'https://ai-server-information.vercel.app';

async function checkCurrentData() {
  console.log('📊 Checking current production data...\n');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/v1/models?limit=5`);
    const data = await response.json();

    const testModels = data.models?.filter(m =>
      m.name?.includes('GPT-5') ||
      m.name?.includes('gpt-oss') ||
      m.name?.includes('Grok 3 mini Reasoning')
    );

    if (testModels && testModels.length > 0) {
      console.log('⚠️  Test data found in production:');
      testModels.forEach(m => console.log(`   - ${m.name}`));
      return true;
    } else {
      console.log('✅ No obvious test data found');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to check current data:', error.message);
    return null;
  }
}

async function triggerAASync(cleanFirst = false) {
  console.log('\n🔄 Triggering AA sync via API...\n');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/v1/sync/aa-realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cleanFirst,
        forceSync: true
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Sync request failed:', response.status, text.substring(0, 200));
      return false;
    }

    const result = await response.json();
    console.log('✅ Sync triggered successfully:', result);
    return true;

  } catch (error) {
    console.error('❌ Failed to trigger sync:', error.message);
    return false;
  }
}

async function checkSyncStatus() {
  console.log('\n📊 Checking sync status...\n');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/v1/sync/aa-realtime`);

    if (!response.ok) {
      console.log('⚠️  Sync endpoint not available (404)');
      console.log('   This might mean the endpoint is not deployed yet');
      return null;
    }

    const data = await response.json();
    console.log('Status:', data);
    return data;

  } catch (error) {
    console.error('❌ Failed to check status:', error.message);
    return null;
  }
}

async function validateResults() {
  console.log('\n🔍 Validating results...\n');

  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

  try {
    // Check models endpoint
    const modelsResponse = await fetch(`${PRODUCTION_URL}/api/v1/models?limit=5`);
    const modelsData = await modelsResponse.json();

    console.log('Sample models:');
    modelsData.models?.slice(0, 3).forEach(m => {
      console.log(`  - ${m.name}: Intelligence=${m.intelligence || m.aa?.intelligence || 'N/A'}`);
    });

    // Check highlights endpoint
    const highlightsResponse = await fetch(`${PRODUCTION_URL}/api/v1/models/highlights`);
    const highlightsData = await highlightsResponse.json();

    console.log('\nHighlights metadata:', highlightsData.metadata);

  } catch (error) {
    console.error('❌ Failed to validate:', error.message);
  }
}

async function main() {
  console.log('============================================');
  console.log('   Production AA Data Sync Manager');
  console.log('============================================\n');

  // Step 1: Check current data
  const hasTestData = await checkCurrentData();

  // Step 2: Check sync status
  const status = await checkSyncStatus();

  if (status === null) {
    console.log('\n⚠️  Sync endpoint is not available.');
    console.log('This usually means:');
    console.log('1. The deployment is still in progress');
    console.log('2. The route file is not properly configured');
    console.log('3. There might be a build error\n');

    console.log('💡 Suggested actions:');
    console.log('1. Check Vercel deployment logs');
    console.log('2. Verify src/app/api/v1/sync/aa-realtime/route.ts exists');
    console.log('3. Try redeploying: vercel --prod');
    return;
  }

  // Step 3: Decide action
  if (hasTestData) {
    console.log('\n⚠️  Test data detected. Sync with cleanup recommended.');
    console.log('Press Ctrl+C to cancel, or wait to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    const success = await triggerAASync(true);

    if (success) {
      await validateResults();
    }
  } else {
    console.log('\n✅ Production data looks clean.');
    console.log('You can still trigger a sync to get latest AA data.\n');
  }

  console.log('\n============================================');
  console.log('   Process Complete');
  console.log('============================================');
}

// Run the script
main().catch(console.error);