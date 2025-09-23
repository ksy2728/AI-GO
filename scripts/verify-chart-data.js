require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyChartData() {
  console.log('=== 차트 데이터 검증 ===\n');

  // Intelligence 상위 10개
  console.log('📊 Intelligence 상위 10개 모델:');
  const topIntelligence = await prisma.model.findMany({
    where: {
      isActive: true,
      intelligenceScore: { not: null, gt: 0 }
    },
    orderBy: { intelligenceScore: 'desc' },
    take: 10,
    select: {
      name: true,
      intelligenceScore: true,
      dataSource: true
    }
  });

  topIntelligence.forEach((m, i) => {
    const source = m.dataSource === 'artificial-analysis-api' ? '✅ AA API' : '❓ ' + (m.dataSource || 'unknown');
    console.log(`  ${(i+1).toString().padStart(2)}. ${m.name.padEnd(35)} | ${m.intelligenceScore} points | ${source}`);
  });

  // Speed 상위 10개
  console.log('\n⚡ Speed 상위 10개 모델:');
  const topSpeed = await prisma.model.findMany({
    where: {
      isActive: true,
      outputSpeed: { not: null, gt: 0 }
    },
    orderBy: { outputSpeed: 'desc' },
    take: 10,
    select: {
      name: true,
      outputSpeed: true,
      dataSource: true
    }
  });

  topSpeed.forEach((m, i) => {
    const source = m.dataSource === 'artificial-analysis-api' ? '✅ AA API' : '❓ ' + (m.dataSource || 'unknown');
    console.log(`  ${(i+1).toString().padStart(2)}. ${m.name.padEnd(35)} | ${m.outputSpeed} t/s | ${source}`);
  });

  // Price 상위 10개 (가장 저렴한)
  console.log('\n💰 가장 저렴한 10개 모델:');
  const cheapestModels = await prisma.model.findMany({
    where: {
      isActive: true,
      inputPrice: { not: null, gt: 0 }
    },
    orderBy: { inputPrice: 'asc' },
    take: 10,
    select: {
      name: true,
      inputPrice: true,
      outputPrice: true,
      dataSource: true
    }
  });

  cheapestModels.forEach((m, i) => {
    const source = m.dataSource === 'artificial-analysis-api' ? '✅ AA API' : '❓ ' + (m.dataSource || 'unknown');
    console.log(`  ${(i+1).toString().padStart(2)}. ${m.name.padEnd(35)} | Input: $${m.inputPrice} | Output: $${m.outputPrice} | ${source}`);
  });

  // 통계
  console.log('\n📈 데이터 소스 통계:');
  const aaApiCount = await prisma.model.count({
    where: {
      isActive: true,
      dataSource: 'artificial-analysis-api'
    }
  });

  const otherSourceCount = await prisma.model.count({
    where: {
      isActive: true,
      dataSource: { not: 'artificial-analysis-api' }
    }
  });

  const noSourceCount = await prisma.model.count({
    where: {
      isActive: true,
      dataSource: null
    }
  });

  const totalActive = await prisma.model.count({
    where: { isActive: true }
  });

  console.log(`  AA API 소스: ${aaApiCount}개 모델`);
  console.log(`  기타 소스: ${otherSourceCount}개 모델`);
  console.log(`  소스 없음: ${noSourceCount}개 모델`);
  console.log(`  총 활성 모델: ${totalActive}개`);

  // GPT-5 모델 확인
  console.log('\n🔍 GPT-5 모델 검증:');
  const gpt5Models = await prisma.model.findMany({
    where: {
      name: { contains: 'GPT-5' }
    },
    select: {
      name: true,
      intelligenceScore: true,
      outputSpeed: true,
      isActive: true,
      dataSource: true
    },
    orderBy: { intelligenceScore: 'desc' }
  });

  gpt5Models.forEach(model => {
    const status = model.isActive ? '✅' : '❌';
    const source = model.dataSource === 'artificial-analysis-api' ? 'AA API' : (model.dataSource || 'unknown');
    console.log(`  ${status} ${model.name.padEnd(25)} | Int: ${model.intelligenceScore || 'N/A'} | Speed: ${model.outputSpeed || 0} t/s | Source: ${source}`);
  });

  // 최고 Intelligence 점수 확인
  const highestIntelligence = await prisma.model.findFirst({
    where: {
      isActive: true,
      intelligenceScore: { not: null }
    },
    orderBy: { intelligenceScore: 'desc' },
    select: {
      name: true,
      intelligenceScore: true
    }
  });

  console.log(`\n🏆 최고 Intelligence 점수: ${highestIntelligence.name} - ${highestIntelligence.intelligenceScore}점`);

  if (highestIntelligence.intelligenceScore > 67) {
    console.log('  ⚠️ 경고: AA에서 GPT-5 (high)가 67점으로 최고인데 더 높은 점수 발견됨!');
  } else {
    console.log('  ✅ 정상: Intelligence 점수가 AA 데이터와 일치함');
  }

  await prisma.$disconnect();
}

verifyChartData();