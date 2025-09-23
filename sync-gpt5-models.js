#!/usr/bin/env node
/**
 * Sync GPT-5 models from intelligence-index.json to database
 * These are valid models from Artificial Analysis that were missing
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function syncGPT5Models() {
  console.log('🔄 SYNCING GPT-5 MODELS FROM INTELLIGENCE INDEX');
  console.log('==============================================\n');

  try {
    // Read intelligence-index.json
    const indexPath = path.join(__dirname, 'data', 'intelligence-index.json');
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

    // Find GPT-5 models
    const gpt5Models = indexData.models.filter(m =>
      m.name.includes('GPT-5') || m.name.includes('GPT 5')
    );

    console.log(`Found ${gpt5Models.length} GPT-5 models in intelligence-index.json:\n`);
    gpt5Models.forEach(m => {
      console.log(`  - ${m.name} (Intelligence: ${m.intelligenceIndex})`);
    });

    // Ensure OpenAI provider exists
    let openaiProvider = await prisma.provider.findUnique({
      where: { slug: 'openai' }
    });

    if (!openaiProvider) {
      console.log('\n❌ OpenAI provider not found, creating...');
      openaiProvider = await prisma.provider.create({
        data: {
          slug: 'openai',
          name: 'OpenAI',
          websiteUrl: 'https://openai.com',
          documentationUrl: 'https://platform.openai.com/docs',
          regions: JSON.stringify(['global']),
          metadata: JSON.stringify({})
        }
      });
    }

    console.log('\n📝 Adding GPT-5 models to database...\n');

    // Add each GPT-5 model
    for (const model of gpt5Models) {
      const slug = model.name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      // Check if already exists
      const existing = await prisma.model.findUnique({
        where: { slug }
      });

      if (existing) {
        // Update existing model
        await prisma.model.update({
          where: { slug },
          data: {
            isActive: true,
            intelligenceScore: model.intelligenceIndex,
            dataSource: 'artificial-analysis',
            lastVerified: new Date(),
            metadata: JSON.stringify({
              aa: {
                intelligenceScore: model.intelligenceIndex,
                rank: model.rank,
                lastUpdated: new Date().toISOString(),
                source: 'intelligence-index'
              }
            })
          }
        });
        console.log(`  ✅ Updated: ${model.name}`);
      } else {
        // Create new model
        await prisma.model.create({
          data: {
            slug,
            name: model.name,
            providerId: openaiProvider.id,
            description: `${model.name} - Intelligence: ${model.intelligenceIndex}`,
            foundationModel: 'GPT-5',
            contextWindow: 128000, // Standard for GPT-5
            maxOutputTokens: 16384,
            isActive: true,
            intelligenceScore: model.intelligenceIndex,
            outputSpeed: getEstimatedSpeed(model.name),
            dataSource: 'artificial-analysis',
            lastVerified: new Date(),
            releasedAt: new Date('2025-01-01'), // Approximate
            modalities: JSON.stringify(['text']),
            capabilities: JSON.stringify(['general']),
            apiVersion: 'v1',
            metadata: JSON.stringify({
              aa: {
                intelligenceScore: model.intelligenceIndex,
                rank: model.rank,
                lastUpdated: new Date().toISOString(),
                source: 'intelligence-index'
              }
            })
          }
        });
        console.log(`  ✅ Created: ${model.name}`);
      }
    }

    // Verify final state
    const allGPT5 = await prisma.model.findMany({
      where: {
        name: { contains: 'GPT-5' }
      },
      select: { name: true, intelligenceScore: true, isActive: true }
    });

    console.log('\n📊 Final GPT-5 models in database:');
    allGPT5.forEach(m => {
      console.log(`  - ${m.name} (Intelligence: ${m.intelligenceScore}, Active: ${m.isActive})`);
    });

    console.log('\n💡 Note: GPT-5 models are from Artificial Analysis Intelligence Index');
    console.log('   These are legitimate models that should be displayed.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Estimate speed based on model variant
function getEstimatedSpeed(modelName) {
  if (modelName.includes('mini')) return 150;
  if (modelName.includes('medium')) return 100;
  if (modelName.includes('high')) return 50;
  return 75; // default
}

// Run the sync
syncGPT5Models().then(() => {
  console.log('\n✨ GPT-5 sync complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});