#!/usr/bin/env node

const https = require('https');

const PRODUCTION_URL = 'https://ai-server-information.vercel.app';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${PRODUCTION_URL}${path}`;
    console.log(`Making request to: ${url}`);
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

async function checkOpenAIInProduction() {
  console.log('Checking for OpenAI models in production API...\n');

  try {
    // First check the default models endpoint
    console.log('1. Checking /api/v1/models...');
    const modelsData = await makeRequest('/api/v1/models?limit=100');

    const openaiModels = modelsData.models?.filter(model =>
      model.name?.toLowerCase().includes('gpt') ||
      model.name?.toLowerCase().includes('openai') ||
      model.provider?.toLowerCase().includes('openai') ||
      model.name?.toLowerCase().includes('o3')
    ) || [];

    console.log(`Found ${openaiModels.length} OpenAI models in production API:`);

    if (openaiModels.length === 0) {
      console.log('❌ No OpenAI models found in production API!');

      // Show what models are available
      console.log('\nModels that ARE available:');
      modelsData.models?.slice(0, 10).forEach(model => {
        console.log(`  - ${model.name} (Provider: ${model.provider || 'unknown'})`);
      });

    } else {
      openaiModels.forEach(model => {
        console.log(`  ✅ ${model.name} (Intelligence: ${model.intelligence || model.intelligenceScore || 'N/A'})`);
      });
    }

    // Check if there's a specific filter or provider parameter
    console.log('\n2. Checking providers endpoint...');
    try {
      const providersData = await makeRequest('/api/v1/providers');
      const openaiProvider = providersData.providers?.find(p =>
        p.slug === 'openai' || p.name?.toLowerCase().includes('openai')
      );

      if (openaiProvider) {
        console.log(`✅ OpenAI provider found in API: ${openaiProvider.name} (${openaiProvider.slug})`);
      } else {
        console.log('❌ OpenAI provider not found in providers API');
      }
    } catch (error) {
      console.log(`⚠️  Providers endpoint error: ${error.message}`);
    }

    // Check for specific OpenAI provider filter
    console.log('\n3. Checking models with provider filter...');
    try {
      const openaiProviderData = await makeRequest('/api/v1/models?provider=openai&limit=50');
      console.log(`Models with OpenAI provider filter: ${openaiProviderData.models?.length || 0}`);

      if (openaiProviderData.models?.length > 0) {
        openaiProviderData.models.forEach(model => {
          console.log(`  ✅ ${model.name} (Intelligence: ${model.intelligence || model.intelligenceScore || 'N/A'})`);
        });
      }
    } catch (error) {
      console.log(`⚠️  Provider filter error: ${error.message}`);
    }

    // Check specific model by checking if Gemini 1.5 Flash-8B appears with the high speed
    console.log('\n4. Checking for Gemini 1.5 Flash-8B speed issue...');
    const geminiModel = modelsData.models?.find(model =>
      model.name?.includes('Gemini 1.5 Flash-8B')
    );

    if (geminiModel) {
      console.log(`✅ Found Gemini 1.5 Flash-8B:`);
      console.log(`   Speed: ${geminiModel.outputSpeed || geminiModel.speed || 'N/A'} tokens/sec`);
      console.log(`   Intelligence: ${geminiModel.intelligence || geminiModel.intelligenceScore || 'N/A'}`);

      if ((geminiModel.outputSpeed || geminiModel.speed) > 2000) {
        console.log(`❌ CONFIRMED: Speed anomaly detected! ${geminiModel.outputSpeed || geminiModel.speed} tokens/sec is excessive`);
      }
    } else {
      console.log('❌ Gemini 1.5 Flash-8B not found in production API');
    }

  } catch (error) {
    console.error(`Error checking production: ${error.message}`);
  }
}

checkOpenAIInProduction().catch(console.error);