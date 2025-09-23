const { scrapeAAImproved } = require('./scrape-aa-improved');
const { scrapeAANetworkFocused } = require('./scrape-aa-network-focused');
const fs = require('fs').promises;
const path = require('path');

/**
 * Run both scraping strategies and combine results
 */
async function runCompleteScraping() {
  console.log('🚀 Starting complete AA scraping with multiple strategies...\n');

  const results = {
    timestamp: new Date().toISOString(),
    strategies: {},
    combined: {
      models: {},
      intelligence: [],
      speed: [],
      price: [],
      confidence: 'unknown'
    },
    metadata: {
      strategiesRun: [],
      totalModelsFound: 0,
      bestStrategy: null
    }
  };

  try {
    // Strategy 1: Improved Multi-Strategy Scraper
    console.log('📊 Running Strategy 1: Improved Multi-Strategy Scraper...');
    try {
      const improvedResults = await scrapeAAImproved();
      results.strategies.improved = improvedResults;
      results.metadata.strategiesRun.push('improved');
      console.log('✅ Strategy 1 completed successfully');
    } catch (error) {
      console.error('❌ Strategy 1 failed:', error.message);
      results.strategies.improved = { error: error.message };
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Strategy 2: Network-Focused Scraper
    console.log('🌐 Running Strategy 2: Network-Focused Scraper...');
    try {
      const networkResults = await scrapeAANetworkFocused();
      results.strategies.networkFocused = networkResults;
      results.metadata.strategiesRun.push('networkFocused');
      console.log('✅ Strategy 2 completed successfully');
    } catch (error) {
      console.error('❌ Strategy 2 failed:', error.message);
      results.strategies.networkFocused = { error: error.message };
    }

    // Combine results from both strategies
    console.log('\n🔄 Combining results from all strategies...');
    const combinedResults = combineScrapingResults(results.strategies);
    results.combined = combinedResults;

    // Determine best strategy
    results.metadata.bestStrategy = determineBestStrategy(results.strategies);
    results.metadata.totalModelsFound = results.combined.intelligence.length;

    // Save combined results
    const outputDir = path.join(__dirname, '..', 'data', 'aa-scraping');
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const combinedOutputFile = path.join(outputDir, `aa-combined-results-${timestamp}.json`);

    await fs.writeFile(combinedOutputFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Combined results saved to: ${combinedOutputFile}`);

    // Display final summary
    displayFinalSummary(results);

    return results;

  } catch (error) {
    console.error('❌ Complete scraping failed:', error);
    throw error;
  }
}

/**
 * Combine results from multiple scraping strategies
 */
function combineScrapingResults(strategies) {
  const combined = {
    models: {},
    intelligence: [],
    speed: [],
    price: [],
    confidence: 'low',
    sources: []
  };

  // Process improved strategy results
  if (strategies.improved && strategies.improved.processed) {
    const improved = strategies.improved.processed;

    // Add intelligence data
    if (improved.intelligence && improved.intelligence.length > 0) {
      improved.intelligence.forEach(item => {
        combined.intelligence.push({
          ...item,
          strategy: 'improved',
          source: item.source || 'improved_strategy'
        });
      });
    }

    // Add speed data
    if (improved.speed && improved.speed.length > 0) {
      improved.speed.forEach(item => {
        combined.speed.push({
          ...item,
          strategy: 'improved',
          source: item.source || 'improved_strategy'
        });
      });
    }

    // Add price data
    if (improved.price && improved.price.length > 0) {
      improved.price.forEach(item => {
        combined.price.push({
          ...item,
          strategy: 'improved',
          source: item.source || 'improved_strategy'
        });
      });
    }

    // Add model data
    if (improved.models) {
      Object.keys(improved.models).forEach(key => {
        combined.models[`improved_${key}`] = improved.models[key];
      });
    }

    combined.sources.push('improved');
  }

  // Process network-focused strategy results
  if (strategies.networkFocused && strategies.networkFocused.finalExtraction) {
    const networkData = strategies.networkFocused.finalExtraction;

    // Process model data from network strategy
    if (networkData.allModelData && networkData.allModelData.length > 0) {
      networkData.allModelData.forEach((item, index) => {
        if (item.modelKeyword && item.numbers && item.numbers.length > 0) {
          // Try to categorize the numbers
          item.numbers.forEach(num => {
            if (num >= 20 && num <= 100) {
              // Likely intelligence score
              combined.intelligence.push({
                model: item.modelKeyword,
                score: num,
                strategy: 'networkFocused',
                source: item.source || 'dom_extraction',
                confidence: 'medium',
                context: item.context
              });
            } else if (num >= 1 && num <= 1000) {
              // Could be speed
              combined.speed.push({
                model: item.modelKeyword,
                speed: num,
                strategy: 'networkFocused',
                source: item.source || 'dom_extraction',
                confidence: 'medium',
                context: item.context
              });
            } else if (num >= 0.01 && num <= 100) {
              // Could be price
              combined.price.push({
                model: item.modelKeyword,
                price: num,
                strategy: 'networkFocused',
                source: item.source || 'dom_extraction',
                confidence: 'medium',
                context: item.context
              });
            }
          });
        }
      });
    }

    // Add __NEXT_DATA__ if found
    if (networkData.nextData) {
      combined.models.nextData = networkData.nextData;
    }

    combined.sources.push('networkFocused');
  }

  // Remove duplicates and rank by confidence
  combined.intelligence = deduplicateAndRank(combined.intelligence, 'model', 'score');
  combined.speed = deduplicateAndRank(combined.speed, 'model', 'speed');
  combined.price = deduplicateAndRank(combined.price, 'model', 'price');

  // Determine overall confidence
  const hasHighConfidenceData = [
    ...combined.intelligence,
    ...combined.speed,
    ...combined.price
  ].some(item => item.confidence === 'high');

  const hasMediumConfidenceData = [
    ...combined.intelligence,
    ...combined.speed,
    ...combined.price
  ].some(item => item.confidence === 'medium');

  if (hasHighConfidenceData) {
    combined.confidence = 'high';
  } else if (hasMediumConfidenceData) {
    combined.confidence = 'medium';
  }

  return combined;
}

/**
 * Remove duplicates and rank by confidence
 */
function deduplicateAndRank(items, modelKey, valueKey) {
  const grouped = {};

  // Group by model name
  items.forEach(item => {
    const modelName = item[modelKey];
    if (!grouped[modelName]) {
      grouped[modelName] = [];
    }
    grouped[modelName].push(item);
  });

  // For each model, pick the best item
  const result = [];
  Object.keys(grouped).forEach(modelName => {
    const modelItems = grouped[modelName];

    // Sort by confidence and source quality
    modelItems.sort((a, b) => {
      const confidenceScore = (item) => {
        if (item.confidence === 'high') return 3;
        if (item.confidence === 'medium') return 2;
        return 1;
      };

      const confidenceDiff = confidenceScore(b) - confidenceScore(a);
      if (confidenceDiff !== 0) return confidenceDiff;

      // If confidence is the same, prefer API sources
      const sourceScore = (item) => {
        if (item.source && item.source.includes('api')) return 3;
        if (item.source && item.source.includes('next')) return 2;
        return 1;
      };

      return sourceScore(b) - sourceScore(a);
    });

    result.push(modelItems[0]); // Take the best one
  });

  return result;
}

/**
 * Determine which strategy performed best
 */
function determineBestStrategy(strategies) {
  let bestStrategy = null;
  let bestScore = 0;

  Object.keys(strategies).forEach(strategyName => {
    const strategy = strategies[strategyName];
    let score = 0;

    if (strategy.error) {
      return; // Skip failed strategies
    }

    // Score based on data found
    if (strategyName === 'improved' && strategy.processed) {
      score += strategy.processed.intelligence?.length || 0;
      score += strategy.processed.speed?.length || 0;
      score += strategy.processed.price?.length || 0;
      score += Object.keys(strategy.processed.models || {}).length;
    }

    if (strategyName === 'networkFocused' && strategy.finalExtraction) {
      score += strategy.finalExtraction.allModelData?.length || 0;
      score += strategy.finalExtraction.chartAnalysis?.length || 0;
      score += strategy.summary?.jsonResponses || 0;
    }

    if (score > bestScore) {
      bestScore = score;
      bestStrategy = strategyName;
    }
  });

  return bestStrategy;
}

/**
 * Display final summary of all scraping results
 */
function displayFinalSummary(results) {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 FINAL SCRAPING SUMMARY');
  console.log('='.repeat(80));

  console.log(`\n📊 OVERALL RESULTS:`);
  console.log(`  Strategies Run: ${results.metadata.strategiesRun.join(', ')}`);
  console.log(`  Best Strategy: ${results.metadata.bestStrategy || 'Unknown'}`);
  console.log(`  Overall Confidence: ${results.combined.confidence.toUpperCase()}`);
  console.log(`  Total Models Found: ${results.metadata.totalModelsFound}`);

  if (results.combined.intelligence.length > 0) {
    console.log(`\n🧠 INTELLIGENCE SCORES (${results.combined.intelligence.length} models):`);
    results.combined.intelligence.forEach(item => {
      console.log(`  ${item.model}: ${item.score} (${item.confidence}, ${item.strategy})`);
    });
  }

  if (results.combined.speed.length > 0) {
    console.log(`\n⚡ SPEED METRICS (${results.combined.speed.length} models):`);
    results.combined.speed.forEach(item => {
      console.log(`  ${item.model}: ${item.speed} tokens/sec (${item.confidence}, ${item.strategy})`);
    });
  }

  if (results.combined.price.length > 0) {
    console.log(`\n💰 PRICE DATA (${results.combined.price.length} models):`);
    results.combined.price.forEach(item => {
      console.log(`  ${item.model}: $${item.price} per 1M tokens (${item.confidence}, ${item.strategy})`);
    });
  }

  console.log(`\n📁 FILES GENERATED:`);
  console.log(`  - Combined results: data/aa-scraping/aa-combined-results-[timestamp].json`);
  console.log(`  - Screenshots: screenshots/aa-*.png`);
  console.log(`  - Individual strategy results in data/aa-scraping/`);

  console.log(`\n🔧 NEXT STEPS:`);
  if (results.combined.confidence === 'low') {
    console.log(`  ⚠️  Low confidence - manual verification strongly recommended`);
    console.log(`  📸 Check screenshots for visual verification`);
    console.log(`  🌐 Review network data for missed API endpoints`);
  } else if (results.combined.confidence === 'medium') {
    console.log(`  ✅ Medium confidence - spot check recommended`);
    console.log(`  📊 Verify a few key models manually`);
  } else {
    console.log(`  🎉 High confidence - data should be reliable`);
    console.log(`  📋 Ready for integration into your system`);
  }

  console.log(`\n🔍 DEBUGGING:`);
  console.log(`  - Check individual strategy results for detailed debugging info`);
  console.log(`  - Look for API endpoints in network-focused results`);
  console.log(`  - Examine DOM extraction patterns in improved results`);
}

// Run complete scraping if this file is executed directly
if (require.main === module) {
  runCompleteScraping()
    .then(results => {
      console.log('\n🎉 Complete AA scraping finished successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Complete AA scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteScraping, combineScrapingResults };