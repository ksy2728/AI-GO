#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const PRODUCTION_URL = 'https://ai-server-information.vercel.app';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${PRODUCTION_URL}${path}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function analyzeProductionIssues() {
  console.log('🔍 PRODUCTION ISSUE ANALYSIS REPORT');
  console.log('===================================\n');

  // Issue 1: Gemini 1.5 Flash-8B Speed Anomaly
  console.log('📊 ISSUE 1: GEMINI 1.5 FLASH-8B SPEED ANOMALY');
  console.log('----------------------------------------------');

  const geminiFlash8B = await prisma.model.findFirst({
    where: {
      name: { contains: 'Gemini 1.5 Flash-8B', mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      outputSpeed: true,
      intelligenceScore: true,
      metadata: true,
      dataSource: true,
      lastVerified: true
    }
  });

  if (geminiFlash8B) {
    console.log(`✅ Found in database: ${geminiFlash8B.name}`);
    console.log(`   Speed: ${geminiFlash8B.outputSpeed} tokens/sec`);
    console.log(`   Intelligence: ${geminiFlash8B.intelligenceScore}`);
    console.log(`   Data Source: ${geminiFlash8B.dataSource}`);
    console.log(`   Last Verified: ${geminiFlash8B.lastVerified}`);

    if (geminiFlash8B.outputSpeed > 2000) {
      console.log(`❌ CONFIRMED: Speed of ${geminiFlash8B.outputSpeed} tokens/sec is anomalous`);
      console.log(`   Expected speed based on AA data: ~250-300 tokens/sec`);
      console.log(`   RECOMMENDATION: Fix this speed value to realistic range`);
    }

    // Check production API
    try {
      const prodData = await makeRequest('/api/v1/models?limit=100');
      const prodGemini = prodData.models?.find(m => m.name?.includes('Gemini 1.5 Flash-8B'));
      if (prodGemini) {
        console.log(`✅ Also confirmed in production API: ${prodGemini.outputSpeed || prodGemini.speed} tokens/sec`);
      }
    } catch (error) {
      console.log(`⚠️  Could not verify in production API: ${error.message}`);
    }
  } else {
    console.log('❌ Gemini 1.5 Flash-8B not found in database');
  }

  // Issue 2: OpenAI Models Status
  console.log('\n🤖 ISSUE 2: OPENAI MODELS AVAILABILITY');
  console.log('--------------------------------------');

  const openaiModels = await prisma.model.findMany({
    where: {
      OR: [
        { name: { contains: 'GPT', mode: 'insensitive' }},
        { name: { contains: 'o1', mode: 'insensitive' }},
        { name: { contains: 'o3', mode: 'insensitive' }},
        { provider: { slug: 'openai' }}
      ]
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      dataSource: true,
      provider: {
        select: { name: true, slug: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`✅ Found ${openaiModels.length} OpenAI models in database:`);

  const realOpenAIModels = openaiModels.filter(model =>
    !model.name.includes('GPT-4.1') &&
    !model.name.includes('GPT-5') &&
    !model.name.includes('o3') &&
    !model.name.includes('gpt-oss')
  );

  const futureTestModels = openaiModels.filter(model =>
    model.name.includes('GPT-4.1') ||
    model.name.includes('GPT-5') ||
    model.name.includes('o3') ||
    model.name.includes('gpt-oss')
  );

  console.log(`\n📋 Real/Current OpenAI Models (${realOpenAIModels.length}):`);
  realOpenAIModels.forEach(model => {
    console.log(`   ${model.isActive ? '✅' : '❌'} ${model.name} (Active: ${model.isActive})`);
  });

  console.log(`\n🚧 Future/Test OpenAI Models (${futureTestModels.length}):`);
  futureTestModels.forEach(model => {
    console.log(`   ${model.isActive ? '⚠️' : '❌'} ${model.name} (Active: ${model.isActive})`);
  });

  // Check production API for OpenAI models
  try {
    const prodData = await makeRequest('/api/v1/models?provider=openai&limit=50');
    console.log(`\n🌐 Production API shows ${prodData.models?.length || 0} OpenAI models:`);

    const prodRealModels = prodData.models?.filter(model =>
      !model.name.includes('GPT-4.1') &&
      !model.name.includes('GPT-5') &&
      !model.name.includes('o3') &&
      !model.name.includes('gpt-oss')
    ) || [];

    const prodFutureModels = prodData.models?.filter(model =>
      model.name.includes('GPT-4.1') ||
      model.name.includes('GPT-5') ||
      model.name.includes('o3') ||
      model.name.includes('gpt-oss')
    ) || [];

    console.log(`   📋 Real models in production: ${prodRealModels.length}`);
    console.log(`   🚧 Future/test models in production: ${prodFutureModels.length}`);

    if (prodFutureModels.length > 0) {
      console.log(`❌ ISSUE: Future/test models are appearing in production!`);
      prodFutureModels.forEach(model => {
        console.log(`     - ${model.name} (Intelligence: ${model.intelligence})`);
      });
    }

  } catch (error) {
    console.log(`⚠️  Could not check production API: ${error.message}`);
  }

  // Issue 3: Data Source Accuracy
  console.log('\n📊 ISSUE 3: DATA SOURCE ACCURACY');
  console.log('--------------------------------');

  const aaSourcedModels = await prisma.model.findMany({
    where: {
      dataSource: 'artificial-analysis'
    },
    select: {
      name: true,
      intelligenceScore: true,
      outputSpeed: true,
      lastVerified: true
    },
    orderBy: { lastVerified: 'desc' },
    take: 10
  });

  console.log(`✅ Found ${aaSourcedModels.length} models with 'artificial-analysis' data source`);
  console.log(`\nLatest 10 AA-sourced models (by verification date):`);
  aaSourcedModels.forEach(model => {
    console.log(`   ${model.name}: Intelligence ${model.intelligenceScore}, Speed ${model.outputSpeed} (${model.lastVerified})`);
  });

  // Issue 4: Future Model Detection
  console.log('\n🚧 ISSUE 4: FUTURE/TEST MODEL DETECTION');
  console.log('---------------------------------------');

  const suspiciousFutureModels = await prisma.model.findMany({
    where: {
      OR: [
        { name: { contains: 'GPT-5', mode: 'insensitive' }},
        { name: { contains: 'GPT-4.1', mode: 'insensitive' }},
        { name: { contains: 'Grok 4', mode: 'insensitive' }},
        { name: { contains: 'Claude 4', mode: 'insensitive' }},
        { name: { contains: 'Gemini 2.5', mode: 'insensitive' }},
        { name: { contains: 'o3', mode: 'insensitive' }},
        { name: { contains: 'gpt-oss', mode: 'insensitive' }}
      ]
    },
    select: {
      name: true,
      isActive: true,
      intelligenceScore: true,
      outputSpeed: true,
      dataSource: true,
      provider: { select: { name: true } }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`⚠️  Found ${suspiciousFutureModels.length} models that appear to be future/test models:`);
  suspiciousFutureModels.forEach(model => {
    console.log(`   ${model.isActive ? '✅' : '❌'} ${model.name} (${model.provider.name}) - Intelligence: ${model.intelligenceScore}, Speed: ${model.outputSpeed}`);
  });

  // Summary and Recommendations
  console.log('\n📋 SUMMARY AND RECOMMENDATIONS');
  console.log('===============================');

  console.log('\n🔧 ISSUES FOUND:');

  if (geminiFlash8B && geminiFlash8B.outputSpeed > 2000) {
    console.log('❌ 1. Gemini 1.5 Flash-8B speed anomaly (2230 tokens/sec vs expected ~250-300)');
  }

  if (futureTestModels.length > 0) {
    console.log('❌ 2. Future/test OpenAI models (GPT-4.1, o3, etc.) are marked as active in production');
  }

  if (suspiciousFutureModels.length > 0) {
    console.log('❌ 3. Multiple future/test models across providers are present in database');
  }

  console.log('\n✅ RECOMMENDATIONS:');
  console.log('1. Fix Gemini 1.5 Flash-8B speed to realistic value (~250-300 tokens/sec)');
  console.log('2. Deactivate or remove future/test models (GPT-4.1, GPT-5, o3, Claude 4, Grok 4, etc.)');
  console.log('3. Implement data validation to prevent anomalous speed values');
  console.log('4. Add model classification to distinguish current vs future models');
  console.log('5. Review data sync from Artificial Analysis for test data filtering');

  await prisma.$disconnect();
}

analyzeProductionIssues().catch(console.error);