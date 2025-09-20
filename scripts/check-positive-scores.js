const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const withPositiveIntelligence = await prisma.model.count({
    where: {
      intelligenceScore: { gt: 0 },
      isActive: true
    }
  });

  console.log('Active models with intelligence score > 0:', withPositiveIntelligence);

  // Get some examples
  const examples = await prisma.model.findMany({
    where: {
      intelligenceScore: { gt: 0 },
      isActive: true
    },
    select: {
      name: true,
      intelligenceScore: true,
      isActive: true
    },
    take: 5
  });

  console.log('\nExamples:');
  examples.forEach(m => {
    console.log(`- ${m.name}: ${m.intelligenceScore}`);
  });

  await prisma.$disconnect();
}

test().catch(console.error);