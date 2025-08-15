#!/usr/bin/env node

/**
 * Script to update static data files (pricing, benchmarks, news)
 * Run this manually when you need to update the data:
 * node scripts/update-static-data.js
 */

const fs = require('fs').promises;
const path = require('path');

// Helper function to update timestamp
function updateTimestamp(data) {
  return {
    ...data,
    lastUpdated: new Date().toISOString(),
    version: data.version || '1.0'
  };
}

async function updatePricingData() {
  const filePath = path.join(__dirname, '..', 'data', 'pricing-data.json');
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Update timestamp
    const updatedData = updateTimestamp(data);
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
    console.log('✅ Updated pricing-data.json');
  } catch (error) {
    console.error('❌ Error updating pricing data:', error.message);
  }
}

async function updateBenchmarksData() {
  const filePath = path.join(__dirname, '..', 'data', 'benchmarks-data.json');
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Update timestamp
    const updatedData = updateTimestamp(data);
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
    console.log('✅ Updated benchmarks-data.json');
  } catch (error) {
    console.error('❌ Error updating benchmarks data:', error.message);
  }
}

async function updateNewsData() {
  const filePath = path.join(__dirname, '..', 'data', 'news-data.json');
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Update timestamp
    const updatedData = updateTimestamp(data);
    
    // Sort articles by publishedAt date (most recent first)
    if (updatedData.articles) {
      updatedData.articles.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
    console.log('✅ Updated news-data.json');
  } catch (error) {
    console.error('❌ Error updating news data:', error.message);
  }
}

async function main() {
  console.log('📝 Updating static data files...\n');
  
  await updatePricingData();
  await updateBenchmarksData();
  await updateNewsData();
  
  console.log('\n✨ All static data files updated successfully!');
  console.log('📌 Note: These files are served directly and don\'t require database sync.');
  console.log('🔄 The model data continues to sync automatically via GitHub Actions.');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});