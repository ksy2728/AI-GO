const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAAModels() {
  try {
    // Get all active models
    const allModels = await prisma.model.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        metadata: true,
        createdAt: true,
        provider: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\n📊 Total active models: ${allModels.length}`);
    console.log('\n🔍 Last 10 models created:');
    console.log('─'.repeat(80));
    
    allModels.forEach((model, index) => {
      const hasAAData = model.metadata && model.metadata.includes('artificial-analysis');
      console.log(`\n${index + 1}. ${model.name} (${model.slug})`);
      console.log(`   Provider: ${model.provider?.name || 'Unknown'}`);
      console.log(`   Created: ${model.createdAt}`);
      console.log(`   Has AA Data: ${hasAAData ? '✅ Yes' : '❌ No'}`);
      
      if (model.metadata) {
        try {
          const metadata = JSON.parse(model.metadata);
          if (metadata.aa) {
            console.log(`   Intelligence Score: ${metadata.aa.intelligenceScore}`);
            console.log(`   Rank: ${metadata.aa.rank}`);
            console.log(`   Category: ${metadata.aa.category}`);
          }
        } catch (e) {
          console.log(`   Metadata parse error: ${e.message}`);
        }
      }
    });
    
    console.log('\n' + '─'.repeat(80));
    
    // Count models by source
    const aaModels = await prisma.model.count({
      where: {
        isActive: true,
        metadata: {
          contains: 'artificial-analysis'
        }
      }
    });
    
    const totalModels = await prisma.model.count({
      where: { isActive: true }
    });
    
    console.log(`\n📈 Model Statistics:`);
    console.log(`   Total Models: ${totalModels}`);
    console.log(`   AA Models: ${aaModels}`);
    console.log(`   Other Models: ${totalModels - aaModels}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAAModels();