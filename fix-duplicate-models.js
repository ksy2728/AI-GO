#!/usr/bin/env node
/**
 * Fix duplicate models and update all models to correct intelligence scores
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Correct intelligence scores from Artificial Analysis
const CORRECT_SCORES = {
  'Gemini 1.5 Flash-8B': { intelligence: 36, speed: 2230 },
  'Gemini 1.5 Pro': { intelligence: 72, speed: 188 },
  'Claude 3.5 Sonnet': { intelligence: 75, speed: 85 }
};

async function fixDuplicateModels() {
  console.log('============================================');
  console.log('   Fix Duplicate Models & Scores');
  console.log('============================================\n');

  try {
    // Fix all models with these names
    for (const [name, scores] of Object.entries(CORRECT_SCORES)) {
      console.log(`\nFixing all "${name}" models...`);

      const models = await prisma.model.findMany({
        where: {
          name: { contains: name }
        }
      });

      console.log(`  Found ${models.length} instances`);

      for (const model of models) {
        const updateData = {
          intelligenceScore: scores.intelligence,
          outputSpeed: scores.speed,
          dataSource: 'artificial-analysis',
          lastVerified: new Date()
        };

        // Update metadata too
        let metadata = {};
        try {
          metadata = JSON.parse(model.metadata || '{}');
        } catch (e) {
          metadata = {};
        }

        metadata.aa = {
          ...metadata.aa,
          intelligenceScore: scores.intelligence,
          outputSpeed: scores.speed,
          lastUpdated: new Date().toISOString(),
          source: 'official'
        };

        updateData.metadata = JSON.stringify(metadata);

        await prisma.model.update({
          where: { id: model.id },
          data: updateData
        });

        console.log(`  ✅ Updated ${model.id}: ${model.intelligenceScore} → ${scores.intelligence}`);
      }
    }

    // Find and report duplicates
    console.log('\n📋 Checking for duplicates...');
    const allModels = await prisma.model.findMany({
      select: { name: true, id: true, intelligenceScore: true }
    });

    const nameCount = {};
    allModels.forEach(m => {
      if (!nameCount[m.name]) {
        nameCount[m.name] = [];
      }
      nameCount[m.name].push({ id: m.id, score: m.intelligenceScore });
    });

    const duplicates = Object.entries(nameCount)
      .filter(([name, instances]) => instances.length > 1);

    if (duplicates.length > 0) {
      console.log('\n⚠️  Found duplicate models:');
      duplicates.forEach(([name, instances]) => {
        console.log(`  ${name}: ${instances.length} instances`);
        instances.forEach(inst => {
          console.log(`    - ${inst.id} (score: ${inst.score})`);
        });
      });
    } else {
      console.log('  ✅ No duplicates found');
    }

    // Final verification
    console.log('\n✅ Final check:');
    for (const name of Object.keys(CORRECT_SCORES)) {
      const models = await prisma.model.findMany({
        where: { name: { contains: name }},
        select: { name: true, intelligenceScore: true, outputSpeed: true }
      });

      models.forEach(m => {
        console.log(`  ${m.name}: Intelligence=${m.intelligenceScore}, Speed=${m.outputSpeed}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateModels().then(() => {
  console.log('\n✨ Fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});