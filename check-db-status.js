const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('Checking current database status...\n');

  // Check Gemini speed
  const gemini = await prisma.model.findFirst({
    where: { name: { contains: 'Gemini 1.5 Flash-8B' }},
    select: { name: true, outputSpeed: true, intelligenceScore: true, isActive: true }
  });

  console.log('Gemini 1.5 Flash-8B in DB:');
  console.log('  Speed:', gemini?.outputSpeed, 'tokens/sec');
  console.log('  Intelligence:', gemini?.intelligenceScore);
  console.log('  Active:', gemini?.isActive);

  // Check future models
  const futureModels = await prisma.model.findMany({
    where: {
      OR: [
        { name: { contains: 'o3' }},
        { name: { contains: 'GPT-4.1' }},
        { name: { contains: 'Claude 4' }},
        { name: { contains: 'Grok 4' }},
        { name: { contains: 'Gemini 2.5' }}
      ]
    },
    select: { name: true, isActive: true }
  });

  console.log('\nFuture models status:');
  futureModels.forEach(m => {
    console.log('  -', m.name, ':', m.isActive ? 'ACTIVE ❌' : 'INACTIVE ✅');
  });

  // Check real OpenAI models
  const realOpenAI = await prisma.model.findMany({
    where: {
      provider: { slug: 'openai' },
      isActive: true,
      NOT: [
        { name: { contains: 'o3' }},
        { name: { contains: 'GPT-4.1' }}
      ]
    },
    include: { provider: true }
  });

  console.log('\nActive real OpenAI models:');
  realOpenAI.forEach(m => {
    console.log('  -', m.name, '(Intelligence:', m.intelligenceScore + ')');
  });

  await prisma.$disconnect();
}

check().catch(console.error);