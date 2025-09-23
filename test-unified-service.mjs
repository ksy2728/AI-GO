import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUnifiedService() {
  console.log('🔄 Testing database query that UnifiedModelService uses...\n');

  try {
    // Replicate the exact query from UnifiedModelService.loadAAModels()
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
        // Include models synchronized from Artificial Analysis or with AA data
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

    console.log(`📊 Database query returned ${dbModels.length} models`);

    // Filter for OpenAI models
    const openaiModels = dbModels.filter(model =>
      model.provider.name.toLowerCase().includes('openai') ||
      model.name.toLowerCase().includes('gpt') ||
      model.name.toLowerCase().includes('o3')
    );

    console.log(`🎯 Found ${openaiModels.length} OpenAI models in the query result:`);

    openaiModels.forEach(model => {
      console.log(`  - ${model.name} (${model.provider.name})`);
      console.log(`    Intelligence: ${model.intelligenceScore}, Speed: ${model.outputSpeed}`);
      console.log(`    Active: ${model.isActive}, DataSource: ${model.dataSource}`);
      console.log('');
    });

    if (openaiModels.length === 0) {
      console.log('❌ No OpenAI models found in UnifiedModelService query result');
      console.log('🔍 Let\'s check what\'s wrong with the query conditions...\n');

      // Check models that fail the conditions
      const allOpenaiModels = await prisma.model.findMany({
        include: { provider: true },
        where: {
          OR: [
            { name: { contains: 'GPT', mode: 'insensitive' }},
            { name: { contains: 'OpenAI', mode: 'insensitive' }},
            { provider: { slug: 'openai' }}
          ]
        }
      });

      console.log(`📊 Total OpenAI models in DB: ${allOpenaiModels.length}`);

      allOpenaiModels.forEach(model => {
        const meetsCriteria = {
          isActive: model.isActive,
          hasDataSource: ['artificial-analysis', 'artificial-analysis-improved'].includes(model.dataSource),
          hasIntelligence: model.intelligenceScore !== null,
          hasSpeed: model.outputSpeed !== null
        };

        const passes = meetsCriteria.isActive && (
          meetsCriteria.hasDataSource ||
          meetsCriteria.hasIntelligence ||
          meetsCriteria.hasSpeed
        );

        console.log(`  - ${model.name}:`);
        console.log(`    Criteria: Active=${meetsCriteria.isActive}, DataSource=${meetsCriteria.hasDataSource}, Intelligence=${meetsCriteria.hasIntelligence}, Speed=${meetsCriteria.hasSpeed}`);
        console.log(`    PASSES: ${passes ? '✅' : '❌'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUnifiedService().catch(console.error);