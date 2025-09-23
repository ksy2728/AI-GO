const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function analyzeMissingModels() {
  console.log('🔍 COMPREHENSIVE AA MISSING MODELS ANALYSIS\n');

  // Load AA models data
  const aaModelsPath = './src/data/aa-models.json';
  const intelligenceIndexPath = './data/intelligence-index.json';

  let aaModels = [];
  let intelligenceIndex = [];

  if (fs.existsSync(aaModelsPath)) {
    const aaData = JSON.parse(fs.readFileSync(aaModelsPath, 'utf8'));
    aaModels = aaData.models || [];
  }

  if (fs.existsSync(intelligenceIndexPath)) {
    const indexData = JSON.parse(fs.readFileSync(intelligenceIndexPath, 'utf8'));
    intelligenceIndex = indexData.models || [];
  }

  // Get all current database models
  const dbModels = await prisma.model.findMany({
    include: { provider: true },
    orderBy: { intelligenceScore: 'desc' }
  });

  console.log(`📊 DATA SOURCES:`);
  console.log(`  - AA Models File: ${aaModels.length} models`);
  console.log(`  - Intelligence Index: ${intelligenceIndex.length} models`);
  console.log(`  - Database: ${dbModels.length} models\n`);

  // Create sets for comparison
  const dbModelNames = new Set(dbModels.map(m => m.name.toLowerCase().trim()));

  // Analyze missing models from AA data
  console.log('❌ MISSING FROM DATABASE (found in AA data):\n');

  // High-priority missing models
  const highPriorityModels = [];
  const mediumPriorityModels = [];
  const lowPriorityModels = [];

  aaModels.forEach(model => {
    const name = model.name.toLowerCase().trim();
    if (!dbModelNames.has(name)) {
      const priority = determinePriority(model);
      const modelInfo = {
        name: model.name,
        provider: model.provider,
        rank: model.rank,
        intelligenceScore: model.intelligenceScore,
        speedScore: model.speedScore,
        priceScore: model.priceScore,
        priority
      };

      if (priority === 'HIGH') {
        highPriorityModels.push(modelInfo);
      } else if (priority === 'MEDIUM') {
        mediumPriorityModels.push(modelInfo);
      } else {
        lowPriorityModels.push(modelInfo);
      }
    }
  });

  // Display missing models by priority
  console.log('🚨 HIGH PRIORITY MISSING MODELS:');
  highPriorityModels.forEach(model => {
    console.log(`  ${model.rank}. ${model.name} (${model.provider})`);
    console.log(`     Intelligence: ${model.intelligenceScore || 'N/A'}, Speed: ${model.speedScore || 'N/A'}, Price: ${model.priceScore || 'N/A'}`);
  });

  console.log('\n⚠️  MEDIUM PRIORITY MISSING MODELS:');
  mediumPriorityModels.slice(0, 10).forEach(model => {
    console.log(`  ${model.rank}. ${model.name} (${model.provider})`);
  });

  console.log('\nℹ️  LOW PRIORITY MISSING MODELS (first 10):');
  lowPriorityModels.slice(0, 10).forEach(model => {
    console.log(`  ${model.rank}. ${model.name} (${model.provider})`);
  });

  // Analyze by provider
  console.log('\n📈 MISSING MODELS BY PROVIDER:\n');
  const missingByProvider = {};
  [...highPriorityModels, ...mediumPriorityModels, ...lowPriorityModels].forEach(model => {
    if (!missingByProvider[model.provider]) {
      missingByProvider[model.provider] = { high: 0, medium: 0, low: 0, total: 0 };
    }
    missingByProvider[model.provider][model.priority.toLowerCase()]++;
    missingByProvider[model.provider].total++;
  });

  Object.entries(missingByProvider)
    .sort(([,a], [,b]) => b.total - a.total)
    .forEach(([provider, counts]) => {
      console.log(`${provider}:`);
      console.log(`  High: ${counts.high}, Medium: ${counts.medium}, Low: ${counts.low} | Total: ${counts.total}`);
    });

  // Pattern analysis
  console.log('\n🔍 PATTERN ANALYSIS:\n');

  const patterns = analyzePatterns([...highPriorityModels, ...mediumPriorityModels]);
  patterns.forEach(pattern => {
    console.log(`${pattern.description}: ${pattern.count} models`);
    pattern.examples.slice(0, 3).forEach(ex => console.log(`  - ${ex}`));
  });

  // Specific model checks
  console.log('\n🎯 SPECIFIC IMPORTANT MISSING MODELS:\n');

  const importantMissing = [
    'GPT-5 nano',
    'Grok 4 Fast (Reasoning)',
    'Claude 4.1 Opus (Extended Thinking)',
    'Claude 4 Sonnet (Extended Thinking)',
    'Gemini 2.5 Flash-Lite (Reasoning)',
    'Gemini 2.5 Flash (Reasoning)',
    'DeepSeek V3.1',
    'Qwen3 235B',
    'GLM-4.5'
  ];

  importantMissing.forEach(modelName => {
    const found = aaModels.find(m => m.name.includes(modelName.split(' ')[0]) && m.name.includes(modelName.split(' ')[1] || ''));
    if (found && !dbModelNames.has(found.name.toLowerCase().trim())) {
      console.log(`❌ ${found.name} (${found.provider}) - Rank: ${found.rank}`);
    }
  });

  console.log('\n📋 SUMMARY:');
  console.log(`  Total Missing: ${highPriorityModels.length + mediumPriorityModels.length + lowPriorityModels.length}`);
  console.log(`  High Priority: ${highPriorityModels.length}`);
  console.log(`  Medium Priority: ${mediumPriorityModels.length}`);
  console.log(`  Low Priority: ${lowPriorityModels.length}`);

  await prisma.$disconnect();
}

function determinePriority(model) {
  const name = model.name;
  const rank = model.rank || 999;
  const provider = model.provider;

  // High priority: Top 50 rank, major providers, latest models
  if (rank <= 50 ||
      name.includes('GPT-5') ||
      name.includes('o3') ||
      name.includes('Claude 4') ||
      name.includes('Grok 4') ||
      name.includes('Gemini 2.5') ||
      name.includes('DeepSeek V3') ||
      name.includes('Qwen3')) {
    return 'HIGH';
  }

  // Medium priority: Top 100 rank, established providers
  if (rank <= 100 ||
      ['OpenAI', 'Anthropic', 'Google', 'xAI', 'Meta', 'DeepSeek'].includes(provider)) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function analyzePatterns(models) {
  const patterns = [
    {
      description: 'Reasoning variants',
      matcher: name => name.includes('Reasoning'),
      examples: []
    },
    {
      description: 'Extended Thinking variants',
      matcher: name => name.includes('Extended Thinking'),
      examples: []
    },
    {
      description: 'High/Medium/Low variants',
      matcher: name => name.includes('(high)') || name.includes('(medium)') || name.includes('(low)'),
      examples: []
    },
    {
      description: 'Preview/Beta models',
      matcher: name => name.includes('Preview') || name.includes('Beta'),
      examples: []
    },
    {
      description: 'Fast variants',
      matcher: name => name.includes('Fast'),
      examples: []
    },
    {
      description: 'Mini/Lite variants',
      matcher: name => name.includes('mini') || name.includes('Lite'),
      examples: []
    }
  ];

  models.forEach(model => {
    patterns.forEach(pattern => {
      if (pattern.matcher(model.name)) {
        pattern.examples.push(model.name);
      }
    });
  });

  return patterns.map(pattern => ({
    description: pattern.description,
    count: pattern.examples.length,
    examples: pattern.examples
  })).filter(p => p.count > 0);
}

analyzeMissingModels().catch(console.error);