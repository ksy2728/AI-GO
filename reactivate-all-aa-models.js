#!/usr/bin/env node
/**
 * Reactivate all Artificial Analysis models
 * Trust AA as the source of truth - don't filter "future" models
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reactivateAllAAModels() {
  console.log('🔄 REACTIVATING ALL ARTIFICIAL ANALYSIS MODELS');
  console.log('=========================================\n');

  try {
    // Find all deactivated AA models
    const deactivatedModels = await prisma.model.findMany({
      where: {
        isActive: false,
        dataSource: 'artificial-analysis'
      },
      select: {
        id: true,
        name: true,
        intelligenceScore: true,
        outputSpeed: true
      }
    });

    console.log(`Found ${deactivatedModels.length} deactivated AA models to reactivate:\n`);

    deactivatedModels.forEach(m => {
      console.log(`  - ${m.name} (Intelligence: ${m.intelligenceScore}, Speed: ${m.outputSpeed})`);
    });

    if (deactivatedModels.length > 0) {
      // Reactivate all AA models
      const result = await prisma.model.updateMany({
        where: {
          isActive: false,
          dataSource: 'artificial-analysis'
        },
        data: {
          isActive: true
        }
      });

      console.log(`\n✅ Reactivated ${result.count} models from Artificial Analysis`);
    } else {
      console.log('\n✅ No deactivated AA models found');
    }

    // Verify final state
    const activeCount = await prisma.model.count({
      where: {
        isActive: true,
        dataSource: 'artificial-analysis'
      }
    });

    const totalAACount = await prisma.model.count({
      where: {
        dataSource: 'artificial-analysis'
      }
    });

    console.log('\n📊 Final Status:');
    console.log(`  Total AA models: ${totalAACount}`);
    console.log(`  Active AA models: ${activeCount}`);
    console.log(`  All AA models active: ${activeCount === totalAACount ? '✅ Yes' : '❌ No'}`);

    // Show some examples of reactivated "future" models
    const futureModels = await prisma.model.findMany({
      where: {
        isActive: true,
        dataSource: 'artificial-analysis',
        OR: [
          { name: { contains: 'o3' }},
          { name: { contains: 'GPT-4.1' }},
          { name: { contains: 'Claude 4' }},
          { name: { contains: 'Grok 4' }},
          { name: { contains: 'Gemini 2.5' }}
        ]
      },
      select: {
        name: true,
        intelligenceScore: true
      },
      orderBy: {
        intelligenceScore: 'desc'
      },
      take: 10
    });

    if (futureModels.length > 0) {
      console.log('\n🚀 Top "future" models now active (trusting AA data):');
      futureModels.forEach(m => {
        console.log(`  - ${m.name} (Intelligence: ${m.intelligenceScore})`);
      });
    }

    console.log('\n💡 Philosophy: We trust Artificial Analysis as our data source.');
    console.log('   If AA shows these models, they are valid for display.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reactivation
reactivateAllAAModels().then(() => {
  console.log('\n✨ Reactivation complete!');
  console.log('All Artificial Analysis models are now trusted and active.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});