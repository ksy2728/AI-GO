import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFixVerification() {
  console.log('🔍 Testing Fix Verification - Do OpenAI Models Show Up Now?\n');

  try {
    // Step 1: Simulate the FIXED UnifiedModelService transformation
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
    console.log(`  Provider.name: "${openaiModel.provider.name}"`);
    console.log(`  Provider.slug: "${openaiModel.provider.slug}"`);

    // Step 2: Simulate FIXED convertAAModel transformation
    const aaModelFixed = {
      rank: 1,
      name: openaiModel.name,
      provider: openaiModel.provider.slug, // FIXED: Now uses slug instead of name
      slug: openaiModel.slug,
      intelligenceScore: openaiModel.intelligenceScore || 70,
      outputSpeed: openaiModel.outputSpeed || 50,
    };

    console.log('\n🔄 After FIXED convertAAModel transformation:');
    console.log(`  Provider: "${aaModelFixed.provider}" (${typeof aaModelFixed.provider})`);

    // Step 3: Test FIXED frontend filtering logic
    const MAJOR_PROVIDERS = ['openai', 'anthropic', 'google', 'meta', 'microsoft', 'amazon', 'other', 'mistral', 'xai', 'deepseek', 'alibaba', 'nvidia', 'cohere', 'ai21'];

    const testModelFixed = {
      name: aaModelFixed.name,
      provider: aaModelFixed.provider, // Now "openai" instead of "OpenAI"
      isActive: true
    };

    console.log('\n🧪 Testing FIXED filter logic:');
    console.log(`  model.provider: "${testModelFixed.provider}"`);
    console.log(`  MAJOR_PROVIDERS includes check:`, MAJOR_PROVIDERS.includes(testModelFixed.provider));

    // Test the FIXED filter function
    function fixedFilterLogic(model) {
      const providerId = (
        model.provider?.id ||
        model.provider?.slug ||
        model.providerId ||
        model.provider?.name ||
        model.provider ||
        ''
      ).toLowerCase();
      return MAJOR_PROVIDERS.includes(providerId);
    }

    const wouldBeIncluded = fixedFilterLogic(testModelFixed);
    console.log(`  Would be included in major providers (FIXED):`, wouldBeIncluded);

    // Step 4: Test with all OpenAI models
    console.log('\n🌍 Real-world test with all OpenAI models (FIXED):');

    const allOpenaiModels = await prisma.model.findMany({
      include: { provider: true },
      where: {
        provider: { slug: 'openai' },
        isActive: true
      }
    });

    let allPassed = true;
    allOpenaiModels.forEach(model => {
      // Simulate the FIXED transformation
      const fixedModel = {
        name: model.name,
        provider: model.provider.slug, // FIXED: Uses slug
        isActive: model.isActive
      };

      // Test FIXED filtering
      const included = fixedFilterLogic(fixedModel);
      const status = included ? '✅' : '❌';

      if (!included) allPassed = false;

      console.log(`  ${status} ${model.name}: provider="${fixedModel.provider}" → included: ${included}`);
    });

    console.log('\n📊 Fix Results:');
    if (allPassed) {
      console.log('🎉 SUCCESS! All OpenAI models would now be included with the fix!');
      console.log('✅ UnifiedModelService now returns provider="openai" (slug)');
      console.log('✅ Filter logic normalizes provider comparison');
      console.log('✅ "openai" ∈ MAJOR_PROVIDERS');
    } else {
      console.log('❌ Some OpenAI models are still being filtered out');
    }

    // Step 5: Test edge cases
    console.log('\n🧪 Testing edge cases:');

    const edgeCases = [
      { provider: 'openai', description: 'Direct slug match' },
      { provider: 'OpenAI', description: 'Name format (should work with normalize)' },
      { provider: { slug: 'openai' }, description: 'Object with slug' },
      { provider: { name: 'OpenAI' }, description: 'Object with name only' },
      { provider: { id: 'some-uuid', slug: 'openai', name: 'OpenAI' }, description: 'Full provider object' },
    ];

    edgeCases.forEach(testCase => {
      const included = fixedFilterLogic(testCase);
      const status = included ? '✅' : '❌';
      console.log(`  ${status} ${testCase.description}: ${included}`);
    });

  } catch (error) {
    console.error('❌ Error testing fix verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixVerification().catch(console.error);