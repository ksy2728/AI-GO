import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProviderMismatch() {
  console.log('🔍 Testing Provider ID Format Mismatch Issue...\n');

  try {
    // Step 1: Get a sample OpenAI model from database
    const openaiModel = await prisma.model.findFirst({
      include: { provider: true },
      where: {
        provider: { slug: 'openai' },
        isActive: true
      }
    });

    if (!openaiModel) {
      console.log('❌ No OpenAI model found in database');
      return;
    }

    console.log('📝 Sample OpenAI model from database:');
    console.log(`  Name: ${openaiModel.name}`);
    console.log(`  Provider Object:`, {
      id: openaiModel.provider.id,
      name: openaiModel.provider.name,
      slug: openaiModel.provider.slug
    });

    // Step 2: Simulate UnifiedModelService convertAAModel transformation
    const aaModel = {
      rank: 1,
      name: openaiModel.name,
      provider: openaiModel.provider.name, // This is the key issue!
      slug: openaiModel.slug,
      intelligenceScore: openaiModel.intelligenceScore || 70,
      outputSpeed: openaiModel.outputSpeed || 50,
      inputPrice: Number(openaiModel.inputPrice) || 0,
      outputPrice: Number(openaiModel.outputPrice) || 0,
      contextWindow: openaiModel.contextWindow || 8192,
      lastUpdated: openaiModel.updatedAt.toISOString(),
      category: 'general',
      trend: 'stable'
    };

    console.log('\n🔄 After convertAAModel transformation:');
    console.log(`  Provider: "${aaModel.provider}" (${typeof aaModel.provider})`);

    // Step 3: Test frontend filtering logic
    const MAJOR_PROVIDERS = ['openai', 'anthropic', 'google', 'meta', 'microsoft', 'amazon', 'other', 'mistral', 'xai', 'deepseek', 'alibaba', 'nvidia', 'cohere', 'ai21'];

    // Simulate the problematic filtering logic
    const testModel = {
      name: aaModel.name,
      provider: aaModel.provider, // "OpenAI" (from DB name field)
      isActive: true
    };

    console.log('\n🧪 Testing filter logic:');
    console.log(`  model.provider: "${testModel.provider}"`);
    console.log(`  MAJOR_PROVIDERS includes check:`, MAJOR_PROVIDERS.includes(testModel.provider));
    console.log(`  MAJOR_PROVIDERS includes (lowercase):`, MAJOR_PROVIDERS.includes(testModel.provider.toLowerCase()));

    // Current problematic logic simulation
    const providerId = testModel.provider?.id || testModel.providerId || testModel.provider || '';
    console.log(`  providerId extracted: "${providerId}"`);
    console.log(`  Would be included in major providers:`, MAJOR_PROVIDERS.includes(providerId));

    // Test with different provider formats
    console.log('\n🔍 Testing different provider formats:');

    const testCases = [
      { provider: 'OpenAI', expected: false, description: 'Provider as name string' },
      { provider: 'openai', expected: true, description: 'Provider as slug string' },
      { provider: { id: 'openai', name: 'OpenAI' }, expected: true, description: 'Provider as object with id' },
      { provider: { slug: 'openai', name: 'OpenAI' }, expected: false, description: 'Provider as object with slug (no id)' },
    ];

    testCases.forEach(testCase => {
      const providerId = testCase.provider?.id || testCase.provider?.slug || testCase.provider || '';
      const included = MAJOR_PROVIDERS.includes(providerId);
      const status = included === testCase.expected ? '✅' : '❌';
      console.log(`  ${status} ${testCase.description}: ${included} (expected: ${testCase.expected})`);
    });

    // Step 4: Show the fix
    console.log('\n🔧 Proposed fix - normalize provider comparison:');

    function normalizeProviderId(provider) {
      if (!provider) return '';
      if (typeof provider === 'string') return provider.toLowerCase();
      return (provider.id || provider.slug || provider.name || '').toLowerCase();
    }

    testCases.forEach(testCase => {
      const normalizedId = normalizeProviderId(testCase.provider);
      const included = MAJOR_PROVIDERS.includes(normalizedId);
      console.log(`  ✅ ${testCase.description}: "${normalizedId}" → ${included}`);
    });

    // Step 5: Real-world test with actual database data
    console.log('\n🌍 Real-world test with all OpenAI models:');

    const allOpenaiModels = await prisma.model.findMany({
      include: { provider: true },
      where: {
        provider: { slug: 'openai' },
        isActive: true
      }
    });

    allOpenaiModels.forEach(model => {
      // Current problematic logic
      const providerId = model.provider.name; // This is "OpenAI"
      const currentIncluded = MAJOR_PROVIDERS.includes(providerId);

      // Fixed logic
      const normalizedId = model.provider.slug; // This is "openai"
      const fixedIncluded = MAJOR_PROVIDERS.includes(normalizedId);

      const status = currentIncluded === fixedIncluded ? '🟡' : (fixedIncluded ? '✅' : '❌');
      console.log(`  ${status} ${model.name}: Current(${currentIncluded}) → Fixed(${fixedIncluded})`);
    });

  } catch (error) {
    console.error('❌ Error testing provider mismatch:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProviderMismatch().catch(console.error);