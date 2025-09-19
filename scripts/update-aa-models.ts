#!/usr/bin/env tsx

/**
 * Script to fetch real ArtificialAnalysis data and update aa-models.json
 */

import { ArtificialAnalysisScraperV2 } from '../src/services/aa-scraper-v2';
import fs from 'fs/promises';
import path from 'path';

interface AAModel {
  id: string;
  slug: string;
  name: string;
  provider: string;
  intelligence?: number;
  outputSpeed?: number;
  latency?: number;
  inputPrice?: number;
  outputPrice?: number;
  contextWindow?: number;
  rank?: number;
  category?: string;
  trend?: string;
  lastUpdated?: string;
}

async function updateAAModels() {
  console.log('🚀 Starting AA models update...');

  try {
    // Initialize scraper
    const scraper = new ArtificialAnalysisScraperV2();
    await scraper.initialize();

    // Scrape latest data
    console.log('🔄 Fetching latest data from ArtificialAnalysis...');
    const scrapedData = await scraper.scrapeModels();

    if (!scrapedData || scrapedData.length === 0) {
      console.error('❌ No data retrieved from scraper');
      return;
    }

    console.log(`✅ Retrieved ${scrapedData.length} models`);

    // Transform scraped data to match the expected format
    const transformedModels: AAModel[] = scrapedData.map((model, index) => ({
      id: `aa-${model.slug}`,
      slug: model.slug,
      name: model.name,
      provider: model.provider,
      intelligence: model.intelligenceScore,
      outputSpeed: model.outputSpeed,
      latency: model.latency,
      inputPrice: model.price.input,
      outputPrice: model.price.output,
      contextWindow: model.contextWindow,
      rank: model.rank || index + 1,
      category: model.category,
      trend: model.trend,
      lastUpdated: model.lastUpdated.toISOString()
    }));

    // Read existing file to preserve structure
    const filePath = path.join(process.cwd(), 'public', 'data', 'aa-models.json');
    const existingData = await fs.readFile(filePath, 'utf-8');
    const existingJson = JSON.parse(existingData);

    // Update with new data
    const updatedJson = {
      ...existingJson,
      models: transformedModels,
      lastUpdated: new Date().toISOString(),
      totalCount: transformedModels.length,
      metadata: {
        ...existingJson.metadata,
        source: 'ArtificialAnalysis',
        scrapedAt: new Date().toISOString(),
        version: '2.0'
      }
    };

    // Write back to file
    await fs.writeFile(
      filePath,
      JSON.stringify(updatedJson, null, 2),
      'utf-8'
    );

    console.log(`📁 Updated aa-models.json with ${transformedModels.length} models`);

    // Show sample of updated data
    console.log('\n📊 Sample of updated models:');
    transformedModels.slice(0, 5).forEach(model => {
      console.log(`  - ${model.name} (${model.provider}): $${model.inputPrice}/$${model.outputPrice} per 1M tokens`);
    });

  } catch (error) {
    console.error('❌ Error updating AA models:', error);
    process.exit(1);
  }
}

// Run the update
updateAAModels().then(() => {
  console.log('✨ AA models update completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});