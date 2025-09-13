const fs = require('fs').promises;
const path = require('path');

/**
 * Validates the scraped AA data to ensure quality and completeness
 */
async function validateData() {
  try {
    console.log('🔍 Starting AA data validation...');
    
    const dataPath = path.join(process.cwd(), 'public', 'data', 'aa-models.json');
    
    // Check if file exists
    try {
      await fs.access(dataPath);
    } catch (error) {
      console.error('❌ Data file not found at:', dataPath);
      process.exit(1);
    }
    
    // Read and parse JSON
    const content = await fs.readFile(dataPath, 'utf-8');
    let data;
    
    try {
      data = JSON.parse(content);
    } catch (error) {
      console.error('❌ Invalid JSON format:', error.message);
      process.exit(1);
    }
    
    // Validation checks
    const checks = [
      {
        name: 'Has models array',
        test: () => Array.isArray(data.models),
        critical: true
      },
      {
        name: 'Has at least 5 models',
        test: () => data.models && data.models.length >= 5,
        critical: true
      },
      {
        name: 'Has metadata object',
        test: () => data.metadata && typeof data.metadata === 'object',
        critical: true
      },
      {
        name: 'Metadata has lastUpdated',
        test: () => data.metadata && data.metadata.lastUpdated,
        critical: true
      },
      {
        name: 'Models have required fields',
        test: () => data.models.every(model => 
          model.name && 
          model.provider && 
          typeof model.intelligenceScore === 'number' &&
          typeof model.outputSpeed === 'number' &&
          model.slug
        ),
        critical: true
      },
      {
        name: 'Intelligence scores are valid (0-100)',
        test: () => data.models.every(model => 
          model.intelligenceScore >= 0 && model.intelligenceScore <= 100
        ),
        critical: false
      },
      {
        name: 'Prices are reasonable',
        test: () => data.models.every(model => 
          model.inputPrice >= 0 && model.inputPrice < 1000 &&
          model.outputPrice >= 0 && model.outputPrice < 1000
        ),
        critical: false
      },
      {
        name: 'Categories are valid',
        test: () => data.models.every(model => 
          ['flagship', 'performance', 'cost-effective', 'open-source', 'specialized']
            .includes(model.category)
        ),
        critical: false
      },
      {
        name: 'No duplicate slugs',
        test: () => {
          const slugs = data.models.map(m => m.slug);
          return slugs.length === new Set(slugs).size;
        },
        critical: true
      }
    ];
    
    // Run checks
    const results = checks.map(check => ({
      ...check,
      passed: check.test()
    }));
    
    const failed = results.filter(r => !r.passed);
    const criticalFailed = failed.filter(r => r.critical);
    
    // Display results
    console.log('\n📋 Validation Results:');
    console.log('─'.repeat(50));
    
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      const label = result.critical ? '[CRITICAL]' : '[WARNING]';
      console.log(`${icon} ${result.name} ${!result.passed ? label : ''}`);
    });
    
    console.log('─'.repeat(50));
    
    // Display statistics
    if (data.models && data.models.length > 0) {
      console.log('\n📊 Data Statistics:');
      console.log(`  • Total models: ${data.models.length}`);
      console.log(`  • Last updated: ${data.metadata.lastUpdated}`);
      console.log(`  • Source: ${data.metadata.source}`);
      console.log(`  • Method: ${data.metadata.scrapingMethod || 'unknown'}`);
      
      if (data.metadata.categories) {
        console.log('\n  Categories:');
        Object.entries(data.metadata.categories).forEach(([key, value]) => {
          console.log(`    - ${key}: ${value}`);
        });
      }
      
      // Top models by intelligence
      const topModels = [...data.models]
        .sort((a, b) => b.intelligenceScore - a.intelligenceScore)
        .slice(0, 5);
      
      console.log('\n  Top 5 models by intelligence:');
      topModels.forEach((model, i) => {
        console.log(`    ${i + 1}. ${model.name} (${model.provider}): ${model.intelligenceScore.toFixed(1)}`);
      });
    }
    
    // Exit based on results
    if (criticalFailed.length > 0) {
      console.error(`\n❌ Validation FAILED: ${criticalFailed.length} critical checks failed`);
      criticalFailed.forEach(check => {
        console.error(`  - ${check.name}`);
      });
      process.exit(1);
    } else if (failed.length > 0) {
      console.warn(`\n⚠️ Validation passed with ${failed.length} warnings`);
      console.log('✅ Data is valid and ready for use');
      process.exit(0);
    } else {
      console.log('\n✅ All validation checks passed!');
      console.log('🎉 Data is perfect and ready for use');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Unexpected validation error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  validateData();
}

module.exports = { validateData };