import { improvedAAScraper } from '../src/services/aa-scraper-improved';
import * as fs from 'fs';
import * as path from 'path';

async function testImprovedScraper() {
  console.log('🧪 Testing Improved AA Scraper...\n');
  console.log('=' .repeat(70));

  try {
    // Test the scraper
    console.time('⏱️ Scraping time');
    const models = await improvedAAScraper.scrapeModels();
    console.timeEnd('⏱️ Scraping time');

    console.log(`\n✅ Successfully scraped ${models.length} models\n`);

    // Analyze data quality
    let withIntelligence = 0;
    let withSpeed = 0;
    let withLatency = 0;
    let withInputPrice = 0;
    let withOutputPrice = 0;
    let withContext = 0;

    models.forEach(model => {
      if (model.intelligenceScore !== null) withIntelligence++;
      if (model.outputSpeed !== null) withSpeed++;
      if (model.latency !== null) withLatency++;
      if (model.price.input !== null) withInputPrice++;
      if (model.price.output !== null) withOutputPrice++;
      if (model.contextWindow !== null) withContext++;
    });

    console.log('📊 Data Completeness:');
    console.log('-' .repeat(70));
    console.log(`Intelligence Score: ${withIntelligence}/${models.length} (${(withIntelligence/models.length*100).toFixed(1)}%)`);
    console.log(`Output Speed: ${withSpeed}/${models.length} (${(withSpeed/models.length*100).toFixed(1)}%)`);
    console.log(`Latency: ${withLatency}/${models.length} (${(withLatency/models.length*100).toFixed(1)}%)`);
    console.log(`Input Price: ${withInputPrice}/${models.length} (${(withInputPrice/models.length*100).toFixed(1)}%)`);
    console.log(`Output Price: ${withOutputPrice}/${models.length} (${(withOutputPrice/models.length*100).toFixed(1)}%)`);
    console.log(`Context Window: ${withContext}/${models.length} (${(withContext/models.length*100).toFixed(1)}%)`);

    // Show sample data for top models
    console.log('\n📋 Sample Data (Top 5 models):');
    console.log('-' .repeat(70));

    models.slice(0, 5).forEach(model => {
      console.log(`\n🤖 ${model.name} (${model.provider})`);
      console.log(`   Intelligence: ${model.intelligenceScore ?? 'N/A'}`);
      console.log(`   Speed: ${model.outputSpeed ?? 'N/A'} tokens/s`);
      console.log(`   Latency: ${model.latency ?? 'N/A'}s`);
      console.log(`   Input Price: $${model.price.input ?? 'N/A'}/1M`);
      console.log(`   Output Price: $${model.price.output ?? 'N/A'}/1M`);
      console.log(`   Context: ${model.contextWindow ?? 'N/A'} tokens`);
      console.log(`   Data Source: ${model.dataSource}`);
      console.log(`   Confidence: ${(model.confidence * 100).toFixed(0)}%`);
    });

    // Check data sources distribution
    const sourceCounts: Record<string, number> = {};
    models.forEach(model => {
      sourceCounts[model.dataSource] = (sourceCounts[model.dataSource] || 0) + 1;
    });

    console.log('\n📈 Data Sources:');
    console.log('-' .repeat(70));
    Object.entries(sourceCounts).forEach(([source, count]) => {
      console.log(`${source}: ${count} models (${(count/models.length*100).toFixed(1)}%)`);
    });

    // Average confidence score
    const avgConfidence = models.reduce((sum, m) => sum + m.confidence, 0) / models.length;
    console.log(`\n⭐ Average Confidence Score: ${(avgConfidence * 100).toFixed(1)}%`);

    // Save to file for inspection
    await improvedAAScraper.saveToFile(models);
    console.log('\n💾 Full results saved to src/data/aa-models-improved.json');

    // Compare with database data
    console.log('\n🔄 Comparison with Current Database:');
    console.log('-' .repeat(70));

    const improvementRate = (field: string, newRate: number, oldRate: number) => {
      const improvement = newRate - oldRate;
      const symbol = improvement > 0 ? '📈' : improvement < 0 ? '📉' : '➡️';
      return `${symbol} ${field}: ${oldRate.toFixed(1)}% → ${newRate.toFixed(1)}% (${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%)`;
    };

    // Compare with known database completion rates
    console.log(improvementRate('Intelligence', withIntelligence/models.length*100, 89.7));
    console.log(improvementRate('Speed', withSpeed/models.length*100, 16.1));
    console.log(improvementRate('Input Price', withInputPrice/models.length*100, 8.0));
    console.log(improvementRate('Output Price', withOutputPrice/models.length*100, 8.0));

    return models;

  } catch (error) {
    console.error('❌ Scraper test failed:', error);
    throw error;
  }
}

// Run the test
testImprovedScraper()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });