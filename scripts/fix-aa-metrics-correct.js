require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ACTUAL scores from AA website as seen in the screenshot
const CORRECT_AA_INTELLIGENCE_SCORES = {
  'GPT-5 (high)': 67,
  'GPT-5 high': 67,
  'GPT-5 (medium)': 66,
  'GPT-5 medium': 66,
  'GPT-5 mini': 65,
  'Grok 4': 63,
  'o3-pro': 60,
  'Gemini 2.5 Flash': 59,
  'Claude 3.5 Sonnet': 58,
  'Claude-3.5-Sonnet': 58,
  'Gemini 2.5 Pro': 57,
  'Claude 3.5 Haiku': 57,
  'Claude-3.5-Haiku': 57,
  'o3': 56,
  'DeepSeek V3': 54,
  'DeepSeek V3.1': 54,
  'DeepSeek-V3': 54,
  'Grok 4 Fast': 53,
  'o3-mini': 52,
  'Gemini 1.5 Pro': 43,
  'Llama 3.1 405B': 36,
  'Llama-3.1-405B': 36,
  'Llama 3.1 405B Instruct': 36,
};

// Speed data from AA (tokens per second) - from the middle chart
const CORRECT_AA_SPEED_DATA = {
  'Gemini 2.5 Flash-Lite': 658,
  'Gemini 2.5 Flash': 488,
  'GPT-4o mini': 190,
  'Gemini 1.5 Flash': 154,
  'Claude 3.5 Haiku': 140,
  'GPT-4o': 115,
  'Claude 3.5 Sonnet': 88,
  'GPT-5 (medium)': 60,
  'GPT-5 mini': 54,
  'Grok 4': 42,
  'o3': 0, // Shows 0 in chart
  'DeepSeek V3': 0, // Not visible in speed chart
};

// Price data from AA (USD per 1M tokens) - from the right chart
const CORRECT_AA_PRICE_DATA = {
  'Gemini 3n E4B': 0.03,
  'Ministral 3B': 0.04,
  'Gemini 2.5 Flash': 0.3,
  'GPT-4o mini': 0.3,
  'DeepSeek R1 Distill Llama 8B': 0.4,
  'GPT-5 mini': 0.5,
  'Llama 3.2 3B': 0.5,
  'Claude 3.5 Haiku': 2.6,
  'GPT-5 (medium)': 3.4,
  'GPT-5 (high)': 3.4,
  'Claude 3.5 Sonnet': 3.4,
  'Grok 4': 3.5,
  'o3': 6,
  'o3-pro': 6,
  'Gemini 2.5 Pro': 20,
};

async function fixAllMetrics() {
  try {
    console.log('=== Fixing AA Metrics with Correct Values ===\n');
    console.log('Source: Artificial Analysis website screenshot from 2025-09-23\n');

    let intelligenceUpdated = 0;
    let speedUpdated = 0;
    let priceUpdated = 0;

    // Fix Intelligence Scores
    console.log('📊 Updating Intelligence Scores...');
    for (const [modelName, correctScore] of Object.entries(CORRECT_AA_INTELLIGENCE_SCORES)) {
      const models = await prisma.model.findMany({
        where: {
          OR: [
            { name: { contains: modelName } },
            { slug: { contains: modelName.toLowerCase().replace(/\s+/g, '-') } }
          ]
        }
      });

      for (const model of models) {
        const currentScore = model.intelligenceScore;
        if (currentScore !== correctScore) {
          await prisma.model.update({
            where: { id: model.id },
            data: {
              intelligenceScore: correctScore,
              dataSource: 'artificial-analysis',
              lastVerified: new Date()
            }
          });
          console.log(`  ✅ ${model.name}: ${currentScore} → ${correctScore}`);
          intelligenceUpdated++;
        }
      }
    }

    // Fix Speed Metrics
    console.log('\n⚡ Updating Speed Metrics...');
    for (const [modelName, correctSpeed] of Object.entries(CORRECT_AA_SPEED_DATA)) {
      const models = await prisma.model.findMany({
        where: {
          OR: [
            { name: { contains: modelName } },
            { slug: { contains: modelName.toLowerCase().replace(/\s+/g, '-') } }
          ]
        }
      });

      for (const model of models) {
        const currentSpeed = model.outputSpeed;
        if (currentSpeed !== correctSpeed) {
          await prisma.model.update({
            where: { id: model.id },
            data: {
              outputSpeed: correctSpeed,
              dataSource: 'artificial-analysis',
              lastVerified: new Date()
            }
          });
          console.log(`  ✅ ${model.name}: ${currentSpeed} t/s → ${correctSpeed} t/s`);
          speedUpdated++;
        }
      }
    }

    // Fix Price Data
    console.log('\n💰 Updating Price Data...');
    for (const [modelName, correctPrice] of Object.entries(CORRECT_AA_PRICE_DATA)) {
      const models = await prisma.model.findMany({
        where: {
          OR: [
            { name: { contains: modelName } },
            { slug: { contains: modelName.toLowerCase().replace(/\s+/g, '-') } }
          ]
        }
      });

      for (const model of models) {
        // Update both input and output prices (assuming same for now)
        await prisma.model.update({
          where: { id: model.id },
          data: {
            inputPrice: correctPrice,
            outputPrice: correctPrice,
            dataSource: 'artificial-analysis',
            lastVerified: new Date()
          }
        });
        console.log(`  ✅ ${model.name}: $${correctPrice}/1M tokens`);
        priceUpdated++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`  Intelligence scores updated: ${intelligenceUpdated}`);
    console.log(`  Speed metrics updated: ${speedUpdated}`);
    console.log(`  Price data updated: ${priceUpdated}`);

    // Verify top models after fix
    console.log('\n🏆 Top 10 Models by Intelligence (After Fix):');
    const topModels = await prisma.model.findMany({
      where: {
        isActive: true,
        intelligenceScore: { not: null }
      },
      select: {
        name: true,
        intelligenceScore: true,
        outputSpeed: true,
        inputPrice: true
      },
      orderBy: {
        intelligenceScore: 'desc'
      },
      take: 10
    });

    topModels.forEach((model, i) => {
      console.log(`${i+1}. ${model.name.padEnd(30)} | Score: ${model.intelligenceScore} | Speed: ${model.outputSpeed || 'N/A'} t/s | Price: $${model.inputPrice || 'N/A'}`);
    });

    // Also update aa-models.json file
    const aaModelsPath = path.join(__dirname, '..', 'public', 'data', 'aa-models.json');
    if (fs.existsSync(aaModelsPath)) {
      const data = JSON.parse(fs.readFileSync(aaModelsPath, 'utf8'));

      if (data.models) {
        data.models.forEach(model => {
          // Fix intelligence scores
          Object.entries(CORRECT_AA_INTELLIGENCE_SCORES).forEach(([name, score]) => {
            if (model.name.includes(name) || name.includes(model.name)) {
              model.intelligenceScore = score;
            }
          });

          // Fix speed
          Object.entries(CORRECT_AA_SPEED_DATA).forEach(([name, speed]) => {
            if (model.name.includes(name) || name.includes(model.name)) {
              model.outputSpeed = speed;
            }
          });

          // Fix price
          Object.entries(CORRECT_AA_PRICE_DATA).forEach(([name, price]) => {
            if (model.name.includes(name) || name.includes(model.name)) {
              model.inputPrice = price;
              model.outputPrice = price;
            }
          });
        });

        // Sort by correct intelligence scores
        data.models.sort((a, b) => (b.intelligenceScore || 0) - (a.intelligenceScore || 0));

        // Update metadata
        data.lastUpdated = new Date().toISOString();
        data.source = 'artificial-analysis-website';

        fs.writeFileSync(aaModelsPath, JSON.stringify(data, null, 2));
        console.log('\n✅ Updated aa-models.json file');
      }
    }

  } catch (error) {
    console.error('Error fixing metrics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllMetrics();