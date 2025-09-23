import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulate the frontend data flow
async function testFrontendFlow() {
  console.log('🔄 Testing complete frontend data flow...\n');

  try {
    // Step 1: Test API endpoint directly (similar to fetch('/api/v1/models'))
    console.log('1️⃣ Testing API endpoint with OpenAI filter...');

    const response = await fetch('http://localhost:3000/api/v1/models?provider=openai&limit=20');

    if (!response.ok) {
      console.log('❌ API endpoint failed, starting local server test...');
      await testLocalFlow();
      return;
    }

    const apiData = await response.json();
    console.log(`📊 API Response:`, {
      total: apiData.total,
      models: apiData.models?.length || 0,
      dataSource: apiData.dataSource,
      fallbackReason: apiData.fallbackReason
    });

    if (apiData.models && apiData.models.length > 0) {
      console.log('\n📝 OpenAI Models from API:');
      apiData.models.forEach(model => {
        console.log(`  - ${model.name} (${model.provider}) - Source: ${model.source}`);
      });
    } else {
      console.log('❌ No OpenAI models returned from API endpoint!');
    }

    // Step 2: Test filtering logic
    console.log('\n2️⃣ Testing frontend filtering logic...');

    // Simulate major providers filter
    const MAJOR_PROVIDERS = ['openai', 'anthropic', 'google', 'meta', 'microsoft', 'amazon', 'other', 'mistral', 'xai', 'deepseek', 'alibaba', 'nvidia', 'cohere', 'ai21'];

    const openaiModels = apiData.models?.filter(model => {
      const providerId = model.provider?.toLowerCase() || '';
      return MAJOR_PROVIDERS.includes(providerId) &&
             (providerId === 'openai' || model.name.toLowerCase().includes('gpt'));
    }) || [];

    console.log(`🎯 After major providers filter: ${openaiModels.length} OpenAI models`);

    // Step 3: Test model transformation
    console.log('\n3️⃣ Testing model transformation...');

    const transformedModels = openaiModels.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      intelligence: model.intelligence || model.aa?.intelligence,
      speed: model.speed || model.aa?.speed,
      status: model.status,
      isActive: model.isActive
    }));

    console.log(`📋 Transformed models: ${transformedModels.length}`);
    transformedModels.forEach(model => {
      console.log(`  - ${model.name}: Intelligence=${model.intelligence}, Speed=${model.speed}, Active=${model.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error in frontend flow test:', error);
    console.log('🔄 Falling back to local database test...');
    await testLocalFlow();
  } finally {
    await prisma.$disconnect();
  }
}

async function testLocalFlow() {
  console.log('\n🏠 Testing local database flow...\n');

  try {
    // Simulate UnifiedModelService query
    const dbModels = await prisma.model.findMany({
      include: {
        provider: true,
        pricing: {
          where: { region: 'global' },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
        status: {
          where: { region: 'global' },
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
      where: {
        isActive: true,
        OR: [
          { dataSource: 'artificial-analysis' },
          { dataSource: 'artificial-analysis-improved' },
          { intelligenceScore: { not: null } },
          { outputSpeed: { not: null } }
        ],
      },
      orderBy: {
        intelligenceScore: 'desc',
      },
    });

    console.log(`📊 Database returned ${dbModels.length} models`);

    // Convert to unified format (simplified)
    const unifiedModels = dbModels.map(dbModel => ({
      id: `${dbModel.provider.name.toLowerCase()}-${dbModel.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: dbModel.name,
      provider: dbModel.provider.name,
      intelligence: dbModel.intelligenceScore,
      speed: dbModel.outputSpeed,
      status: dbModel.status[0]?.status || 'unknown',
      isActive: dbModel.isActive,
      source: 'artificial-analysis'
    }));

    // Filter for OpenAI models
    const openaiModels = unifiedModels.filter(model =>
      model.provider.toLowerCase().includes('openai') ||
      model.name.toLowerCase().includes('gpt') ||
      model.name.toLowerCase().includes('o3')
    );

    console.log(`🎯 Found ${openaiModels.length} OpenAI models:`);
    openaiModels.forEach(model => {
      console.log(`  - ${model.name} (${model.provider})`);
      console.log(`    Intelligence: ${model.intelligence}, Speed: ${model.speed}, Active: ${model.isActive}`);
    });

    // Check for major providers filtering
    const MAJOR_PROVIDERS = ['openai', 'anthropic', 'google', 'meta', 'microsoft', 'amazon', 'other', 'mistral', 'xai', 'deepseek', 'alibaba', 'nvidia', 'cohere', 'ai21'];

    const majorOpenaiModels = openaiModels.filter(model => {
      const providerId = model.provider.toLowerCase();
      return MAJOR_PROVIDERS.includes(providerId);
    });

    console.log(`\n🏆 OpenAI models in major providers list: ${majorOpenaiModels.length}`);

    if (majorOpenaiModels.length !== openaiModels.length) {
      console.log('⚠️  Some OpenAI models are being filtered out by major providers filter!');
      const filtered = openaiModels.filter(model => {
        const providerId = model.provider.toLowerCase();
        return !MAJOR_PROVIDERS.includes(providerId);
      });
      console.log('🚫 Filtered out models:');
      filtered.forEach(model => {
        console.log(`  - ${model.name} (provider: ${model.provider})`);
      });
    }

  } catch (error) {
    console.error('❌ Error in local database test:', error);
  }
}

testFrontendFlow().catch(console.error);