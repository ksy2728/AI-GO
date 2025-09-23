const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  console.log('Analyzing OpenAI models issue...\n');

  // OpenAI 모델 전체 확인
  const openaiModels = await prisma.model.findMany({
    where: {
      provider: { slug: 'openai' }
    },
    include: { provider: true },
    orderBy: { intelligenceScore: 'desc' }
  });

  console.log('All OpenAI models in DB:');
  console.log('========================');
  openaiModels.forEach(m => {
    console.log(m.name);
    console.log('  Active:', m.isActive);
    console.log('  Intelligence:', m.intelligenceScore);
    console.log('  Speed:', m.outputSpeed);
    console.log('  Data Source:', m.dataSource);
    console.log('  Last Verified:', m.lastVerified);
    console.log('');
  });

  // Active 모델 총 개수
  const activeCount = await prisma.model.count({
    where: { isActive: true }
  });

  const openaiActiveCount = await prisma.model.count({
    where: {
      isActive: true,
      provider: { slug: 'openai' }
    }
  });

  console.log('Summary:');
  console.log('  Total active models:', activeCount);
  console.log('  Active OpenAI models:', openaiActiveCount);

  // Check if the API query issue
  const apiStyleQuery = await prisma.model.findMany({
    where: {
      isActive: true,
      provider: { slug: 'openai' }
    },
    take: 50,
    orderBy: { intelligenceScore: 'desc' },
    select: {
      name: true,
      intelligenceScore: true,
      outputSpeed: true
    }
  });

  console.log('\nActive OpenAI models (API style query):');
  apiStyleQuery.forEach(m => {
    console.log('  -', m.name, '| Intelligence:', m.intelligenceScore, '| Speed:', m.outputSpeed);
  });

  await prisma.$disconnect();
}

analyze().catch(console.error);