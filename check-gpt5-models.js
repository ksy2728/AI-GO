const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGPT5() {
  // Check for GPT-5 models in database
  const gpt5Models = await prisma.model.findMany({
    where: {
      OR: [
        { name: { contains: 'GPT-5' }},
        { name: { contains: 'GPT 5' }},
        { name: { contains: 'gpt-5' }},
        { name: { contains: 'gpt5' }}
      ]
    },
    include: { provider: true },
    orderBy: { intelligenceScore: 'desc' }
  });

  console.log('=== GPT-5 시리즈 확인 ===\n');

  if (gpt5Models.length > 0) {
    console.log('데이터베이스에 있는 GPT-5 모델들:');
    gpt5Models.forEach(m => {
      console.log(`  - ${m.name}`);
      console.log(`    Provider: ${m.provider.name}`);
      console.log(`    Intelligence: ${m.intelligenceScore}`);
      console.log(`    Speed: ${m.outputSpeed}`);
      console.log(`    Active: ${m.isActive}`);
      console.log(`    Data Source: ${m.dataSource}`);
      console.log('');
    });
  } else {
    console.log('❌ GPT-5 모델이 데이터베이스에 없습니다.');
  }

  // Check all OpenAI models
  const allOpenAI = await prisma.model.findMany({
    where: {
      provider: { slug: 'openai' },
      isActive: true
    },
    select: { name: true, intelligenceScore: true },
    orderBy: { intelligenceScore: 'desc' }
  });

  console.log('\n현재 활성 OpenAI 모델 전체 목록:');
  allOpenAI.forEach(m => {
    console.log(`  - ${m.name} (Intelligence: ${m.intelligenceScore})`);
  });

  // Check in intelligence-index.json
  console.log('\n=== Intelligence Index 파일 확인 ===');
  const fs = require('fs');
  const indexPath = './data/intelligence-index.json';
  if (fs.existsSync(indexPath)) {
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const gpt5InIndex = indexData.models.filter(m =>
      m.name.includes('GPT-5') || m.name.includes('GPT 5')
    );

    if (gpt5InIndex.length > 0) {
      console.log('Intelligence Index에 있는 GPT-5 모델:');
      gpt5InIndex.forEach(m => {
        console.log(`  - ${m.name} (Intelligence: ${m.intelligenceIndex}, Provider: ${m.provider})`);
      });
    } else {
      console.log('Intelligence Index에 GPT-5 모델이 없습니다.');
    }
  }

  await prisma.$disconnect();
}

checkGPT5().catch(console.error);