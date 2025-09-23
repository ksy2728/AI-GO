require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDBScores() {
  try {
    console.log('=== Database Intelligence Score Analysis ===\n');

    // Get top models by intelligence score
    const topModels = await prisma.model.findMany({
      where: {
        isActive: true,
        intelligenceScore: { not: null }
      },
      select: {
        name: true,
        intelligenceScore: true,
        outputSpeed: true,
        inputPrice: true,
        outputPrice: true,
        provider: {
          select: { name: true }
        }
      },
      orderBy: {
        intelligenceScore: 'desc'
      },
      take: 30
    });

    console.log('📊 Top 30 Models by Intelligence Score from Database:');
    console.log('=' .repeat(70));
    topModels.forEach((model, i) => {
      const providerName = model.provider?.name || 'Unknown';
      console.log(`${(i+1).toString().padStart(2)}. ${model.name.padEnd(30)} | Provider: ${providerName.padEnd(15)} | Score: ${model.intelligenceScore || 'N/A'}`);
    });

    // Find max score
    const maxScore = Math.max(...topModels.map(m => m.intelligenceScore || 0));
    console.log(`\n🎯 Maximum Intelligence Score in DB: ${maxScore}`);

    // Count models above 70
    const allModels = await prisma.model.findMany({
      where: {
        isActive: true,
        intelligenceScore: { gt: 70 }
      },
      select: {
        name: true,
        intelligenceScore: true,
        provider: {
          select: { name: true }
        }
      }
    });

    console.log(`\n📈 Models with score > 70 in DB: ${allModels.length}`);
    if (allModels.length > 0) {
      console.log('Models above 70:');
      allModels.forEach(m => {
        const providerName = m.provider?.name || 'Unknown';
        console.log(`  - ${m.name} (${providerName}): ${m.intelligenceScore}`);
      });
    }

    // Check specific models
    console.log('\n🔍 Checking specific models:');
    const specificModels = ['GPT-5 (high)', 'GPT-5 (medium)', 'DeepSeek V3', 'Claude 3.5 Haiku', 'Claude 3.5 Sonnet'];

    for (const modelName of specificModels) {
      const model = await prisma.model.findFirst({
        where: {
          name: { contains: modelName }
        },
        select: {
          name: true,
          intelligenceScore: true,
          metadata: true
        }
      });

      if (model) {
        console.log(`  ${model.name}: Intelligence Score = ${model.intelligenceScore}`);

        // Parse metadata to check AA score
        if (model.metadata) {
          try {
            const metadata = typeof model.metadata === 'string' ? JSON.parse(model.metadata) : model.metadata;
            if (metadata.aa?.intelligenceScore) {
              console.log(`    - AA metadata score: ${metadata.aa.intelligenceScore}`);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      } else {
        console.log(`  ${modelName}: NOT FOUND in database`);
      }
    }

  } catch (error) {
    console.error('Error checking DB scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDBScores();