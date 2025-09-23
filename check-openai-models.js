#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOpenAIModels() {
  console.log('Checking for OpenAI/GPT models...\n');

  // Check for models with OpenAI or GPT in name
  const openaiModels = await prisma.model.findMany({
    where: {
      OR: [
        { name: { contains: 'GPT', mode: 'insensitive' }},
        { name: { contains: 'OpenAI', mode: 'insensitive' }},
        { provider: { slug: 'openai' }}
      ]
    },
    select: {
      id: true,
      name: true,
      intelligenceScore: true,
      outputSpeed: true,
      isActive: true,
      dataSource: true,
      lastVerified: true,
      provider: {
        select: {
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log(`Found ${openaiModels.length} OpenAI/GPT models:`);

  if (openaiModels.length === 0) {
    console.log('❌ No OpenAI/GPT models found in database!');

    // Check if OpenAI provider exists
    const openaiProvider = await prisma.provider.findUnique({
      where: { slug: 'openai' }
    });

    if (openaiProvider) {
      console.log('✅ OpenAI provider exists in database');
      console.log(`   Provider ID: ${openaiProvider.id}`);
    } else {
      console.log('❌ OpenAI provider not found in database');
    }
  } else {
    openaiModels.forEach(model => {
      console.log(`\n${model.name}:`);
      console.log(`  ID: ${model.id}`);
      console.log(`  Provider: ${model.provider.name} (${model.provider.slug})`);
      console.log(`  Intelligence: ${model.intelligenceScore}`);
      console.log(`  Speed: ${model.outputSpeed}`);
      console.log(`  Active: ${model.isActive}`);
      console.log(`  Data Source: ${model.dataSource}`);
      console.log(`  Last Verified: ${model.lastVerified}`);
    });
  }

  // Also check all providers to see what we have
  console.log('\n\nAll providers in database:');
  const allProviders = await prisma.provider.findMany({
    select: {
      slug: true,
      name: true,
      _count: {
        select: {
          models: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  allProviders.forEach(provider => {
    console.log(`  ${provider.name} (${provider.slug}): ${provider._count.models} models`);
  });

  await prisma.$disconnect();
}

checkOpenAIModels().catch(console.error);