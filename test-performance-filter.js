#!/usr/bin/env node
/**
 * Test script to demonstrate performance filtering
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPerformanceFilter() {
  console.log('🔍 Testing Performance Filtering Logic\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Get all AA models from database
    const allModels = await prisma.model.findMany({
      where: {
        dataSource: 'artificial-analysis',
        intelligenceScore: { gt: 0 }
      },
      select: {
        name: true,
        intelligenceScore: true,
        outputSpeed: true
      },
      orderBy: { intelligenceScore: 'desc' }
    });

    if (allModels.length === 0) {
      console.log('❌ No AA models found in database');
      return;
    }

    // Calculate statistics
    const scores = allModels.map(m => m.intelligenceScore).filter(s => s > 0);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const median = scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)];

    console.log('📊 Current Model Statistics:');
    console.log(`  Total models: ${allModels.length}`);
    console.log(`  Average intelligence: ${average.toFixed(2)}`);
    console.log(`  Median intelligence: ${median}`);
    console.log(`  Min intelligence: ${min}`);
    console.log(`  Max intelligence: ${max}`);
    console.log('');

    // Show models by category
    const aboveAverage = allModels.filter(m => m.intelligenceScore >= average);
    const belowAverage = allModels.filter(m => m.intelligenceScore < average);

    console.log('📈 Models Above Average (' + aboveAverage.length + '):');
    console.log('  Top 5:');
    aboveAverage.slice(0, 5).forEach(m => {
      console.log(`    ✅ ${m.name}: ${m.intelligenceScore}`);
    });

    console.log('');
    console.log('📉 Models Below Average (' + belowAverage.length + '):');
    console.log('  Bottom 5 (would be filtered):');
    belowAverage.slice(-5).forEach(m => {
      console.log(`    ❌ ${m.name}: ${m.intelligenceScore}`);
    });

    console.log('');
    console.log('🎯 Filtering Impact:');
    console.log(`  Models to keep: ${aboveAverage.length} (${((aboveAverage.length/allModels.length)*100).toFixed(1)}%)`);
    console.log(`  Models to filter: ${belowAverage.length} (${((belowAverage.length/allModels.length)*100).toFixed(1)}%)`);

    // Show different threshold scenarios
    console.log('\n📊 Alternative Thresholds:');

    const thresholds = [30, 40, 50, 60, average, 70];
    thresholds.forEach(threshold => {
      const kept = allModels.filter(m => m.intelligenceScore >= threshold);
      const label = threshold === average ? `Average (${threshold.toFixed(2)})` : threshold;
      console.log(`  Threshold ${label}: Keep ${kept.length}/${allModels.length} models (${((kept.length/allModels.length)*100).toFixed(1)}%)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPerformanceFilter().then(() => {
  console.log('\n✨ Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});