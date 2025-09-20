const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Check for GPT-4 model
  const gpt4 = await prisma.model.findFirst({
    where: {
      name: { contains: 'gpt-4o' }
    }
  });

  console.log('GPT-4o model:', gpt4?.name, 'Intelligence:', gpt4?.intelligenceScore);

  // Check any models with data
  const withData = await prisma.model.findMany({
    where: {
      OR: [
        { intelligenceScore: { not: null } },
        { outputSpeed: { not: null } },
        { inputPrice: { not: null } },
        { outputPrice: { not: null } }
      ]
    },
    take: 5
  });

  console.log('\nModels with AA data:', withData.length);
  withData.forEach(m => {
    console.log(`- ${m.name}: Int=${m.intelligenceScore}, Speed=${m.outputSpeed}, Price=${m.inputPrice}/${m.outputPrice}`);
  });

  // Count total
  const totalCount = await prisma.model.count();
  const withIntelligence = await prisma.model.count({
    where: { intelligenceScore: { not: null } }
  });
  const withSpeed = await prisma.model.count({
    where: { outputSpeed: { not: null } }
  });
  const withPrice = await prisma.model.count({
    where: {
      OR: [
        { inputPrice: { not: null } },
        { outputPrice: { not: null } }
      ]
    }
  });

  console.log('\n=== Summary ===');
  console.log(`Total models: ${totalCount}`);
  console.log(`With intelligence score: ${withIntelligence}`);
  console.log(`With speed score: ${withSpeed}`);
  console.log(`With price data: ${withPrice}`);

  await prisma.$disconnect();
}

test().catch(console.error);