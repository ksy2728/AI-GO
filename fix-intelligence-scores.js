#!/usr/bin/env node
/**
 * Fix intelligence scores from metadata to actual columns
 * This corrects the sync script issue where data was only stored in metadata
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixIntelligenceScores() {
  console.log('============================================');
  console.log('   Intelligence Score Fix Script');
  console.log('============================================\n');

  try {
    // Get all models with metadata
    const models = await prisma.model.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        metadata: true,
        intelligenceScore: true,
        outputSpeed: true,
        inputPrice: true,
        outputPrice: true
      }
    });

    console.log(`Found ${models.length} models to check\n`);

    let updated = 0;
    let skipped = 0;

    for (const model of models) {
      try {
        // Parse metadata
        let metadata;
        try {
          metadata = typeof model.metadata === 'string'
            ? JSON.parse(model.metadata)
            : model.metadata;
        } catch (e) {
          metadata = {};
        }

        const aa = metadata?.aa || {};

        // Check if we have AA data in metadata
        if (aa.intelligenceScore !== undefined || aa.outputSpeed !== undefined) {
          const updates = {};
          let needsUpdate = false;

          // Check intelligence score
          if (aa.intelligenceScore !== undefined &&
              model.intelligenceScore !== Math.round(aa.intelligenceScore)) {
            updates.intelligenceScore = Math.round(aa.intelligenceScore);
            needsUpdate = true;
            console.log(`📊 ${model.name}:`);
            console.log(`   Intelligence: ${model.intelligenceScore} → ${updates.intelligenceScore}`);
          }

          // Check output speed
          if (aa.outputSpeed !== undefined &&
              model.outputSpeed !== Math.round(aa.outputSpeed)) {
            updates.outputSpeed = Math.round(aa.outputSpeed);
            needsUpdate = true;
            if (!updates.intelligenceScore) {
              console.log(`📊 ${model.name}:`);
            }
            console.log(`   Speed: ${model.outputSpeed} → ${updates.outputSpeed}`);
          }

          // Check prices
          if (aa.inputPrice !== undefined && aa.inputPrice > 0) {
            updates.inputPrice = aa.inputPrice;
            needsUpdate = true;
          }

          if (aa.outputPrice !== undefined && aa.outputPrice > 0) {
            updates.outputPrice = aa.outputPrice;
            needsUpdate = true;
          }

          // Add data source and verification
          if (needsUpdate) {
            updates.dataSource = 'artificial-analysis';
            updates.lastVerified = new Date();
          }

          // Update if needed
          if (needsUpdate) {
            await prisma.model.update({
              where: { id: model.id },
              data: updates
            });
            updated++;
            console.log(`   ✅ Updated\n`);
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }

      } catch (error) {
        console.error(`❌ Error updating ${model.name}:`, error.message);
      }
    }

    console.log('\n============================================');
    console.log('   Fix Summary');
    console.log('============================================');
    console.log(`✅ Updated: ${updated} models`);
    console.log(`⏭️  Skipped: ${skipped} models`);

    // Show sample of updated models
    if (updated > 0) {
      console.log('\n📋 Sample of updated models:');
      const samples = await prisma.model.findMany({
        where: {
          dataSource: 'artificial-analysis'
        },
        take: 5,
        orderBy: { intelligenceScore: 'desc' },
        select: {
          name: true,
          intelligenceScore: true,
          outputSpeed: true
        }
      });

      samples.forEach(m => {
        console.log(`  - ${m.name}: Intelligence=${m.intelligenceScore}, Speed=${m.outputSpeed}`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixIntelligenceScores().then(() => {
  console.log('\n✨ Fix completed successfully!');
  console.log('Run sync-aa-real-data.ts to get latest data with proper columns.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});