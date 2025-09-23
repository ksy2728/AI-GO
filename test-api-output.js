#!/usr/bin/env node

const { UnifiedModelService } = require('./src/services/unified-models.service.ts');

async function testAPI() {
  console.log('🔄 Testing UnifiedModelService directly...\n');

  try {
    // Test with OpenAI filter
    const openaiResponse = await UnifiedModelService.getAll({ provider: 'openai' }, 20, 0);
    console.log(`📊 OpenAI Response:`, {
      total: openaiResponse.total,
      models: openaiResponse.models.length,
      dataSource: openaiResponse.dataSource,
      fallbackReason: openaiResponse.fallbackReason
    });

    if (openaiResponse.models.length > 0) {
      console.log('\n📝 OpenAI Models found:');
      openaiResponse.models.forEach(model => {
        console.log(`  - ${model.name} (${model.provider}) - Active: ${model.isActive}, Source: ${model.source}`);
      });
    } else {
      console.log('❌ No OpenAI models returned by UnifiedModelService');
    }

    // Test all models
    console.log('\n🔄 Testing all models...');
    const allResponse = await UnifiedModelService.getAll({}, 10, 0);
    console.log(`📊 All Models Response:`, {
      total: allResponse.total,
      models: allResponse.models.length,
      dataSource: allResponse.dataSource,
      fallbackReason: allResponse.fallbackReason
    });

    if (allResponse.models.length > 0) {
      console.log('\n📝 First 10 models:');
      allResponse.models.forEach(model => {
        const isOpenAI = model.provider.toLowerCase().includes('openai') || model.name.toLowerCase().includes('gpt');
        console.log(`  - ${model.name} (${model.provider}) - OpenAI: ${isOpenAI ? '✅' : '❌'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testAPI().catch(console.error);