const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Check unique data sources
  const dataSources = await prisma.model.findMany({
    select: { dataSource: true },
    distinct: ['dataSource']
  });

  console.log('Unique data sources in DB:');
  const sources = new Set(dataSources.map(d => d.dataSource).filter(Boolean));
  sources.forEach(s => console.log('  -', s));

  // Count by data source
  const aaCount = await prisma.model.count({
    where: { dataSource: 'artificial-analysis' }
  });

  const improvedCount = await prisma.model.count({
    where: { dataSource: 'artificial-analysis-improved' }
  });

  console.log('\nCounts by source:');
  console.log('  artificial-analysis:', aaCount);
  console.log('  artificial-analysis-improved:', improvedCount);

  // Count OpenAI models by source
  const openaiAA = await prisma.model.count({
    where: {
      dataSource: 'artificial-analysis',
      provider: { slug: 'openai' }
    }
  });

  const openaiImproved = await prisma.model.count({
    where: {
      dataSource: 'artificial-analysis-improved',
      provider: { slug: 'openai' }
    }
  });

  console.log('\nOpenAI models by source:');
  console.log('  artificial-analysis:', openaiAA);
  console.log('  artificial-analysis-improved:', openaiImproved);

  await prisma.$disconnect();
}

check().catch(console.error);