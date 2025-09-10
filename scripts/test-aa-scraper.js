const { ArtificialAnalysisScraper } = require('../src/services/aa-scraper');

async function testAAScraper() {
  console.log('🧪 Testing Artificial Analysis Scraper...\n');
  
  const scraper = new ArtificialAnalysisScraper();
  
  try {
    console.log('1️⃣ Initializing scraper...');
    await scraper.initialize();
    console.log('✅ Scraper initialized\n');
    
    console.log('2️⃣ Scraping models from Artificial Analysis...');
    console.log('⏳ This may take 30-60 seconds...\n');
    
    const models = await scraper.scrapeModels();
    
    if (!models || models.length === 0) {
      console.error('❌ No models scraped');
      return;
    }
    
    console.log(`✅ Successfully scraped ${models.length} models\n`);
    
    console.log('3️⃣ Top 5 Models by Intelligence Score:');
    console.log('─'.repeat(60));
    
    models.slice(0, 5).forEach((model, index) => {
      console.log(`\n${index + 1}. ${model.name}`);
      console.log(`   Provider: ${model.provider}`);
      console.log(`   Intelligence Score: ${model.intelligenceScore}`);
      console.log(`   Output Speed: ${model.outputSpeed} tokens/s`);
      console.log(`   Price (Input): $${model.price.input}/M tokens`);
      console.log(`   Price (Output): $${model.price.output}/M tokens`);
      console.log(`   Category: ${model.category}`);
      console.log(`   Trend: ${model.trend}`);
    });
    
    console.log('\n' + '─'.repeat(60));
    
    console.log('\n4️⃣ Model Distribution by Provider:');
    const providerCounts = {};
    models.forEach(model => {
      providerCounts[model.provider] = (providerCounts[model.provider] || 0) + 1;
    });
    
    Object.entries(providerCounts).forEach(([provider, count]) => {
      console.log(`   ${provider}: ${count} models`);
    });
    
    console.log('\n5️⃣ Model Categories:');
    const categoryCounts = {};
    models.forEach(model => {
      categoryCounts[model.category] = (categoryCounts[model.category] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} models`);
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nError details:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the test
testAAScraper();