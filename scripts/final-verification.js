require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalVerification() {
  console.log('=== 최종 검증 ===\n');

  // 활성 모델 수
  const activeCount = await prisma.model.count({
    where: { isActive: true }
  });
  console.log(`✅ 총 활성 모델: ${activeCount}개\n`);

  // 상위 15개 모델
  const topModels = await prisma.model.findMany({
    where: {
      isActive: true,
      intelligenceScore: { not: null }
    },
    orderBy: { intelligenceScore: 'desc' },
    take: 15,
    select: {
      name: true,
      intelligenceScore: true,
      outputSpeed: true,
      dataSource: true
    }
  });

  console.log('📊 상위 15개 Intelligence 모델:');
  topModels.forEach((m, i) => {
    const source = (m.dataSource === 'artificial-analysis' || m.dataSource === 'artificial-analysis-chart') ? '✅' : '❓';
    console.log(`${(i+1).toString().padStart(2)}. ${m.name.padEnd(35)} | Score: ${m.intelligenceScore} | Speed: ${m.outputSpeed || 'N/A'} | ${source}`);
  });

  // AA 소스가 아닌 활성 모델들
  const nonAAActive = await prisma.model.findMany({
    where: {
      isActive: true,
      NOT: {
        OR: [
          { dataSource: 'artificial-analysis' },
          { dataSource: 'artificial-analysis-chart' }
        ]
      }
    },
    select: { name: true, dataSource: true }
  });

  if (nonAAActive.length > 0) {
    console.log('\n⚠️ AA 소스가 아닌 활성 모델:');
    nonAAActive.forEach(m => {
      console.log(`  - ${m.name} (source: ${m.dataSource})`);
    });
  } else {
    console.log('\n✅ 모든 활성 모델이 AA 소스를 사용합니다!');
  }

  await prisma.$disconnect();
}

finalVerification();