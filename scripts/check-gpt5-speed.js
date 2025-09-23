require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGPT5Speed() {
  console.log('=== GPT-5 모델 Speed 확인 ===\n');

  // GPT-5 모델들 찾기
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
    orderBy: { name: 'asc' }
  });

  console.log('GPT-5 모델 현황:');
  gpt5Models.forEach(m => {
    const status = m.isActive ? '✅' : '❌';
    console.log(`${status} ${m.name.padEnd(20)} | Intelligence: ${m.intelligenceScore} | Speed: ${m.outputSpeed || 'NULL'} t/s | Source: ${m.dataSource}`);
  });

  // Speed 차트 상위 10개 확인
  console.log('\n📊 현재 Speed 차트 상위 10개:');
  const topSpeed = await prisma.model.findMany({
    where: {
      isActive: true,
      outputSpeed: { not: null, gt: 0 }
    },
    orderBy: { outputSpeed: 'desc' },
    take: 10,
    select: {
      name: true,
      outputSpeed: true
    }
  });

  topSpeed.forEach((m, i) => {
    console.log(`${i+1}. ${m.name.padEnd(30)} | ${m.outputSpeed} t/s`);
  });

  // AA에서 확인한 GPT-5 Speed 값
  console.log('\n📌 AA Speed 차트의 GPT-5 값:');
  console.log('GPT-5 (high): 116 t/s');
  console.log('GPT-5 (medium): 97 t/s');
  console.log('GPT-5 mini: 54 t/s');

  // Speed가 높은데 GPT-5가 없는 이유 확인
  console.log('\n🔍 분석:');
  gpt5Models.forEach(m => {
    if (m.outputSpeed && m.outputSpeed > 0) {
      if (m.outputSpeed < 251) {
        console.log(`${m.name}: Speed ${m.outputSpeed} t/s는 251보다 낮아서 상위 10위에 못 들어감`);
      }
    }
  });

  await prisma.$disconnect();
}

checkGPT5Speed();