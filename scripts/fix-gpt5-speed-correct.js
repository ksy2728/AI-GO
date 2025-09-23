require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGPT5Speed() {
  console.log('=== GPT-5 및 상위 모델 Speed 수정 ===\n');

  // AA 사이트 스크린샷에서 확인한 정확한 Speed 값
  const CORRECT_SPEEDS = {
    'GPT-5 (high)': 262,        // 1위 (DB: 116 → 262)
    'Gemini 2.5 Flash': 248,     // 2위 (DB: 251 → 248)
    'Grok 4 Fast': 227,          // 3위
    'GPT-5 (medium)': 190,       // 4위 (DB: 97 → 190)
    'Immersible Llama': 154,     // 5위
    'Gemini 1.5 Flash': 140,     // 6위
    'GPT-5 mini': 115,           // 7위 (DB: 54 → 115)
    'GPT-4o': 98,               // 8위
    'Claude 3.5 Haiku': 66,      // 9위
    'Grok 4': 56,               // 10위
    'Claude 3.5 Sonnet': 56,     // 11위
    'xAI Grok': 44,             // 12위
    'xAI Optimus': 42,          // 13위
    'DeepSeek V3': 0            // 표시된 값 없음
  };

  let updateCount = 0;

  for (const [modelName, correctSpeed] of Object.entries(CORRECT_SPEEDS)) {
    const models = await prisma.model.findMany({
      where: {
        OR: [
          { name: modelName },
          { name: { contains: modelName } }
        ]
      }
    });

    for (const model of models) {
      const currentSpeed = model.outputSpeed;

      // 같은 이름의 중복 모델들도 모두 수정
      if (model.name === modelName || model.name.includes(modelName)) {
        if (currentSpeed !== correctSpeed) {
          await prisma.model.update({
            where: { id: model.id },
            data: {
              outputSpeed: correctSpeed,
              dataSource: 'artificial-analysis-chart',
              lastVerified: new Date()
            }
          });
          console.log(`✅ ${model.name}: ${currentSpeed || 'NULL'} → ${correctSpeed} t/s`);
          updateCount++;
        }
      }
    }
  }

  // Gemini 2.5 Flash 계열 모두 수정
  const geminiFlashModels = await prisma.model.findMany({
    where: {
      name: { contains: 'Gemini 2.5 Flash' }
    }
  });

  for (const model of geminiFlashModels) {
    if (model.outputSpeed !== 248) {
      await prisma.model.update({
        where: { id: model.id },
        data: {
          outputSpeed: 248,
          dataSource: 'artificial-analysis-chart'
        }
      });
      console.log(`✅ ${model.name}: ${model.outputSpeed} → 248 t/s`);
      updateCount++;
    }
  }

  console.log(`\n📊 총 ${updateCount}개 모델 수정됨`);

  // 수정 후 상위 15개 확인
  console.log('\n🏆 수정 후 Speed 상위 15개:');
  const topSpeed = await prisma.model.findMany({
    where: {
      isActive: true,
      outputSpeed: { not: null, gt: 0 }
    },
    orderBy: { outputSpeed: 'desc' },
    take: 15,
    select: {
      name: true,
      outputSpeed: true
    }
  });

  topSpeed.forEach((m, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${m.name.padEnd(35)} | ${m.outputSpeed} t/s`);
  });

  await prisma.$disconnect();
}

fixGPT5Speed();