import { improvedAASyncScheduler } from '../src/services/aa-sync-improved';
import { prisma } from '../src/lib/prisma';

async function testImprovedSync() {
  console.log('🧪 Testing Improved AA Sync...\n');
  console.log('=' .repeat(70));

  try {
    // Run the sync
    console.time('⏱️ Sync duration');
    const result = await improvedAASyncScheduler.triggerSync();
    console.timeEnd('⏱️ Sync duration');

    console.log('\n📊 Sync Result:');
    console.log('-' .repeat(70));
    console.log(`✅ Success: ${result.success}`);
    console.log(`📦 Models Count: ${result.modelsCount}`);
    console.log(`🔄 Models Updated: ${result.modelsUpdated}`);
    console.log(`💰 Pricing Updated: ${result.pricingUpdated}`);
    console.log(`⏱️ Duration: ${result.duration / 1000}s`);

    console.log('\n📈 Data Quality:');
    console.log(`Intelligence: ${result.dataQuality.withIntelligence}%`);
    console.log(`Speed: ${result.dataQuality.withSpeed}%`);
    console.log(`Pricing: ${result.dataQuality.withPricing}%`);
    console.log(`Confidence: ${result.dataQuality.averageConfidence}%`);

    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    // Check database for updated data
    console.log('\n🔍 Verifying Database Updates:');
    console.log('-' .repeat(70));

    // Count models with real data
    const modelsWithData = await prisma.model.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { intelligenceScore: { not: null } },
              { outputSpeed: { not: null } },
              { inputPrice: { not: null } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        intelligenceScore: true,
        outputSpeed: true,
        inputPrice: true,
        outputPrice: true
      }
    });

    const withIntelligence = modelsWithData.filter(m => m.intelligenceScore !== null).length;
    const withSpeed = modelsWithData.filter(m => m.outputSpeed !== null).length;
    const withPricing = modelsWithData.filter(m => m.inputPrice !== null || m.outputPrice !== null).length;

    console.log(`Models with Intelligence: ${withIntelligence}/${modelsWithData.length}`);
    console.log(`Models with Speed: ${withSpeed}/${modelsWithData.length}`);
    console.log(`Models with Pricing: ${withPricing}/${modelsWithData.length}`);

    // Check Pricing table
    const pricingRecords = await prisma.pricing.count({
      where: {
        region: 'global',
        effectiveFrom: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    console.log(`\n💰 Recent Pricing Records: ${pricingRecords}`);

    // Show sample updated models
    console.log('\n📋 Sample Updated Models:');
    console.log('-' .repeat(70));

    const sampleModels = await prisma.model.findMany({
      where: {
        AND: [
          { isActive: true },
          { intelligenceScore: { not: null } },
          { outputSpeed: { not: null } },
          { inputPrice: { not: null } }
        ]
      },
      take: 5,
      include: {
        pricing: {
          where: { region: 'global' },
          orderBy: { effectiveFrom: 'desc' },
          take: 1
        }
      }
    });

    sampleModels.forEach(model => {
      console.log(`\n🤖 ${model.name}`);
      console.log(`   Intelligence: ${model.intelligenceScore}`);
      console.log(`   Speed: ${model.outputSpeed} tokens/s`);
      console.log(`   Input Price: $${model.inputPrice}/1M`);
      console.log(`   Output Price: $${model.outputPrice}/1M`);
      if (model.pricing[0]) {
        console.log(`   Pricing Table: $${model.pricing[0].inputPerMillion}/$${model.pricing[0].outputPerMillion}`);
      }
    });

    return result;

  } catch (error) {
    console.error('❌ Sync test failed:', error);
    throw error;
  }
}

// Run the test
testImprovedSync()
  .then(() => {
    console.log('\n✅ Sync test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Sync test failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });