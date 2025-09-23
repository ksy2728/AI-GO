#!/usr/bin/env node
/**
 * Direct database cleanup using Prisma
 * Removes test data from production
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test patterns to remove
const TEST_PATTERNS = [
  'GPT-5',
  'gpt-oss',
  'Grok 3 mini',
  'test',
  'demo',
  'example',
  'simulation'
];

async function cleanTestData() {
  console.log('============================================');
  console.log('   Direct Database Cleanup');
  console.log('============================================\n');

  try {
    // Step 1: Find test models
    console.log('🔍 Finding test models...');
    const testModels = await prisma.model.findMany({
      where: {
        OR: [
          { name: { contains: 'GPT-5' } },
          { name: { contains: 'gpt-oss' } },
          { name: { contains: 'Grok 3 mini' } },
          { name: { contains: 'test' } },
          { name: { contains: 'demo' } },
          { name: { contains: 'example' } }
        ]
      },
      select: {
        id: true,
        name: true
      }
    });

    if (testModels.length === 0) {
      console.log('✅ No test data found!');
      return;
    }

    console.log(`Found ${testModels.length} test models to remove:`);
    testModels.forEach(m => console.log(`  - ${m.name}`));

    const modelIds = testModels.map(m => m.id);

    // Step 2: Delete related data
    console.log('\n🗑️  Deleting related data...');

    // Delete ModelStatus
    const statusResult = await prisma.modelStatus.deleteMany({
      where: { modelId: { in: modelIds } }
    });
    console.log(`  - Deleted ${statusResult.count} ModelStatus records`);

    // Delete BenchmarkScore
    const benchmarkResult = await prisma.benchmarkScore.deleteMany({
      where: { modelId: { in: modelIds } }
    });
    console.log(`  - Deleted ${benchmarkResult.count} BenchmarkScore records`);

    // Delete Pricing
    const pricingResult = await prisma.pricing.deleteMany({
      where: { modelId: { in: modelIds } }
    });
    console.log(`  - Deleted ${pricingResult.count} Pricing records`);

    // Delete ModelEndpoint
    const endpointResult = await prisma.modelEndpoint.deleteMany({
      where: { modelId: { in: modelIds } }
    });
    console.log(`  - Deleted ${endpointResult.count} ModelEndpoint records`);

    // Delete Incident
    const incidentResult = await prisma.incident.deleteMany({
      where: { modelId: { in: modelIds } }
    });
    console.log(`  - Deleted ${incidentResult.count} Incident records`);

    // Step 3: Delete test models
    console.log('\n🗑️  Deleting test models...');
    const modelResult = await prisma.model.deleteMany({
      where: { id: { in: modelIds } }
    });
    console.log(`  - Deleted ${modelResult.count} Model records`);

    // Step 4: Verify
    console.log('\n✅ Cleanup complete!');
    const remainingCount = await prisma.model.count();
    console.log(`  - ${remainingCount} models remaining in database`);

    // Show sample of remaining models
    const sampleModels = await prisma.model.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true }
    });

    if (sampleModels.length > 0) {
      console.log('\n📋 Sample of remaining models:');
      sampleModels.forEach(m => console.log(`  - ${m.name}`));
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n============================================');
  console.log('   Cleanup Successful!');
  console.log('============================================');
  console.log('\nNext steps:');
  console.log('1. Visit https://ai-server-information.vercel.app/models');
  console.log('2. Verify test data is removed');
  console.log('3. Cache may take 2-3 minutes to clear');
}

// Run cleanup
cleanTestData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});