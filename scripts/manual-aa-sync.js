#!/usr/bin/env node

/**
 * Manual trigger for AA data sync via API endpoint
 */

async function triggerAASync() {
  console.log('🚀 Triggering AA data sync via API...');
  console.log('📅 Timestamp:', new Date().toISOString());

  try {
    // Call the sync endpoint
    const response = await fetch('http://localhost:3009/api/v1/models/metrics?action=sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('\n✅ AA Sync trigger sent successfully!');
      console.log('📬 Response:', result.message);
      console.log('🕒 Timestamp:', result.timestamp);
    } else {
      console.error('\n❌ Failed to trigger sync:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Error triggering AA sync:', error.message);
  }

  console.log('\n📊 Now checking database for data...');

  try {
    // Check if data exists in DB
    const checkResponse = await fetch('http://localhost:3009/api/v1/models/metrics?limit=3');
    const data = await checkResponse.json();

    if (checkResponse.ok && data.intelligence && data.intelligence.length > 0) {
      console.log('\n✅ Database contains intelligence data!');
      console.log(`📊 Top 3 models by intelligence:`);
      data.intelligence.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.modelName}: ${model.displayValue}`);
      });
    } else {
      console.log('\n⚠️ No intelligence data found in database yet.');
      console.log('   Data may still be syncing. Please wait a moment and refresh the page.');
    }
  } catch (error) {
    console.error('Error checking database:', error.message);
  }

  process.exit(0);
}

// Run the sync
triggerAASync();