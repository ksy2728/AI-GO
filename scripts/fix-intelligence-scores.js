require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// AA's actual intelligence scores based on their website
const ACTUAL_AA_SCORES = {
  // These are the real scores from AA website (not future predictions)
  'DeepSeek V3': 77.4,
  'Claude 3.5 Sonnet': 75,
  'Llama 3.1 405B Instruct': 75,
  'Llama 3.1 70B Instruct': 75,
  'Gemini 1.5 Pro': 72,
  'Qwen 2.5 72B': 72,
  'Mistral Large': 70,
  'GPT-5 (high)': 66.69,  // From AA website
  'GPT-5 (medium)': 66,    // Estimated based on GPT-5 high
  'GPT-5 mini': 64,
  'Claude 3.5 Haiku': 64.7,
  'o1': 62,
  'o1-preview': 60,
  // Add other known models
  'GPT-4o': 57,
  'GPT-4': 54,
  'Claude 3 Opus': 51,
  'Gemini 1.5 Flash': 49,
  'GPT-4o mini': 48,
  'Llama 3.1 8B Instruct': 43,
  'Mistral 7B': 36,
  // Future models from intelligence-index should not be in production
};

async function fixIntelligenceScores() {
  try {
    console.log('=== Fixing Intelligence Scores ===\n');

    // Update models with correct scores
    let updated = 0;

    for (const [modelName, correctScore] of Object.entries(ACTUAL_AA_SCORES)) {
      const models = await prisma.model.findMany({
        where: {
          name: { contains: modelName }
        }
      });

      for (const model of models) {
        const currentScore = model.intelligenceScore;
        if (Math.abs(currentScore - correctScore) > 0.5) {
          await prisma.model.update({
            where: { id: model.id },
            data: { intelligenceScore: Math.round(correctScore) }
          });
          console.log(`✅ Updated ${model.name}: ${currentScore} → ${Math.round(correctScore)}`);
          updated++;
        }
      }
    }

    // Remove or deactivate future/test models that shouldn't be in production
    const futureModels = ['Grok 4', 'o3', 'o3-pro', 'o3-mini', 'o4-mini', 'Gemini 2.5 Pro', 'Claude 4 Sonnet Thinking'];

    for (const futureModel of futureModels) {
      const models = await prisma.model.findMany({
        where: {
          name: { contains: futureModel }
        }
      });

      for (const model of models) {
        await prisma.model.update({
          where: { id: model.id },
          data: { isActive: false }
        });
        console.log(`⚠️ Deactivated future model: ${model.name}`);
        updated++;
      }
    }

    console.log(`\n📊 Summary: Updated ${updated} models`);

    // Verify the top models after fix
    const topModels = await prisma.model.findMany({
      where: {
        isActive: true,
        intelligenceScore: { not: null }
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

    console.log('\n🏆 Top 10 Models After Fix:');
    topModels.forEach((model, i) => {
      console.log(`${i+1}. ${model.name.padEnd(30)} | Score: ${model.intelligenceScore}`);
    });

  } catch (error) {
    console.error('Error fixing scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Also fix the aa-models.json file
async function fixAAModelsFile() {
  const aaModelsPath = path.join(__dirname, '..', 'public', 'data', 'aa-models.json');

  if (fs.existsSync(aaModelsPath)) {
    const data = JSON.parse(fs.readFileSync(aaModelsPath, 'utf8'));

    if (data.models) {
      // Fix incorrect scores
      data.models.forEach(model => {
        if (ACTUAL_AA_SCORES[model.name]) {
          model.intelligenceScore = ACTUAL_AA_SCORES[model.name];
        }
        // Remove inflated scores
        if (model.intelligenceScore > 90) {
          model.intelligenceScore = 50; // Default to average
        }
      });

      // Sort by correct scores
      data.models.sort((a, b) => (b.intelligenceScore || 0) - (a.intelligenceScore || 0));

      // Save fixed file
      fs.writeFileSync(aaModelsPath, JSON.stringify(data, null, 2));
      console.log('\n✅ Fixed aa-models.json file');
    }
  }
}

async function main() {
  await fixIntelligenceScores();
  await fixAAModelsFile();
}

main();