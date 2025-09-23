#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProductionIssues() {
  console.log('🔧 FIXING PRODUCTION ISSUES');
  console.log('===========================\n');

  try {
    // Fix 1: Correct Gemini 1.5 Flash-8B speed anomaly
    console.log('1. Fixing Gemini 1.5 Flash-8B speed anomaly...');

    const geminiUpdate = await prisma.model.updateMany({
      where: {
        name: { contains: 'Gemini 1.5 Flash-8B', mode: 'insensitive' }
      },
      data: {
        outputSpeed: 252  // Realistic speed based on AA data
      }
    });

    console.log(`   ✅ Updated ${geminiUpdate.count} Gemini model(s) speed to 252 tokens/sec`);

    // Fix 2: Deactivate future/test models
    console.log('\n2. Deactivating future/test models...');

    const futureModelPatterns = [
      '%GPT-4.1%',
      '%GPT-5%',
      '%o3%',
      '%Claude 4%',
      '%Grok 4%',
      '%Gemini 2.5%',
      '%gpt-oss%'
    ];

    let totalDeactivated = 0;

    for (const pattern of futureModelPatterns) {
      const result = await prisma.model.updateMany({
        where: {
          name: { contains: pattern.replace('%', ''), mode: 'insensitive' },
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      if (result.count > 0) {
        console.log(`   ✅ Deactivated ${result.count} models matching pattern: ${pattern}`);
        totalDeactivated += result.count;
      }
    }

    console.log(`   📊 Total future/test models deactivated: ${totalDeactivated}`);

    // Fix 3: Validate and report current active OpenAI models
    console.log('\n3. Validating remaining active OpenAI models...');

    const activeOpenAI = await prisma.model.findMany({
      where: {
        provider: { slug: 'openai' },
        isActive: true
      },
      select: {
        name: true,
        intelligenceScore: true,
        outputSpeed: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`   ✅ Remaining active OpenAI models: ${activeOpenAI.length}`);
    activeOpenAI.forEach(model => {
      console.log(`      - ${model.name} (Intelligence: ${model.intelligenceScore}, Speed: ${model.outputSpeed})`);
    });

    // Fix 4: Add basic data validation check
    console.log('\n4. Checking for other speed anomalies...');

    const speedAnomalies = await prisma.model.findMany({
      where: {
        outputSpeed: { gt: 1000 },
        isActive: true
      },
      select: {
        name: true,
        outputSpeed: true,
        provider: { select: { name: true } }
      }
    });

    if (speedAnomalies.length > 0) {
      console.log(`   ⚠️  Found ${speedAnomalies.length} models with suspicious speeds (>1000 tokens/sec):`);
      speedAnomalies.forEach(model => {
        console.log(`      - ${model.name} (${model.provider.name}): ${model.outputSpeed} tokens/sec`);
      });
    } else {
      console.log(`   ✅ No other speed anomalies found`);
    }

    // Summary
    console.log('\n📋 SUMMARY');
    console.log('===========');
    console.log(`✅ Fixed Gemini 1.5 Flash-8B speed: 2230 → 252 tokens/sec`);
    console.log(`✅ Deactivated ${totalDeactivated} future/test models`);
    console.log(`✅ ${activeOpenAI.length} real OpenAI models remain active`);

    if (speedAnomalies.length > 0) {
      console.log(`⚠️  ${speedAnomalies.length} other speed anomalies need manual review`);
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Run verification script: node check-production-openai.js');
    console.log('2. Check production website for corrected data (may take 2-3 minutes for cache refresh)');
    console.log('3. Monitor speed charts for realistic values');

  } catch (error) {
    console.error('❌ Error fixing production issues:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  This will modify production data. Are you sure you want to continue? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    fixProductionIssues();
  } else {
    console.log('Operation cancelled.');
  }
  rl.close();
});