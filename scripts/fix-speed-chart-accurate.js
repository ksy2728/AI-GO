require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// AA 웹사이트 Speed 차트의 실제 값 (차트 막대에서 직접 읽은 값)
const ACTUAL_AA_SPEED_CHART = {
  // 상위 모델들 (차트에서 확인된 정확한 값)
  'ByteDance Jamba (high)': 260,
  'ByteDance Jamba': 260,
  'Gemini 2.5 Flash-Lite': 251,
  'Grok 4 Fast': 232,
  'GPT-4o mini': 190,
  'Gemini 1.5 Flash': 154,
  'Llama 3.1 Nemotron': 140,
  'GPT-5 (high)': 116,
  'GPT-5 high': 116,
  'GPT-5 (medium)': 97,
  'GPT-5 medium': 97,
  'OpenChat 3.5': 85,
  'Claude 3.5 Sonnet': 56,
  'Grok 4': 45,
  'Grok 4 Mini': 41,
  'DeepSeek V3': 0,
  'DeepSeek V3.1': 0,

  // 추가로 확인된 모델들
  'Gemini 2.5 Flash': 251,  // Flash-Lite와 같은 값
  'Claude 3.5 Haiku': 140,  // AA 텍스트에 있었던 값
  'GPT-4o': 115,  // AA 텍스트에 있었던 값
  'GPT-5 mini': 54,  // 이전 스크립트의 값
  'o3': 0,
  'o3-pro': 0,
  'o3-mini': 0,
};

// AA 차트에 없어서 비활성화해야 할 고속 모델들
const NON_AA_HIGH_SPEED_MODELS = [
  'Granite 3.3 8B',
  'Ministral 3B',
  'Grok Code Fast 1',
  'Grok 3 mini Reasoning',
  'Magistral Small 1.2',
  'Magistral Small 1',
  'Gemini 2.0 Flash',
  'Ministral 8B',
  'Codestral',
  'Gemini 2.0 Flash Thinking',
];

async function fixSpeedChart() {
  try {
    console.log('=== Speed 차트 정확한 값으로 수정 ===\n');
    console.log('기준: AA 웹사이트 Speed 차트 막대 그래프의 실제 값\n');

    let updatedCount = 0;
    let deactivatedCount = 0;

    // 1. 정확한 Speed 값으로 업데이트
    console.log('📊 Speed 값 수정 중...\n');

    for (const [modelName, correctSpeed] of Object.entries(ACTUAL_AA_SPEED_CHART)) {
      const models = await prisma.model.findMany({
        where: {
          OR: [
            { name: { contains: modelName } },
            { slug: { contains: modelName.toLowerCase().replace(/\s+/g, '-') } }
          ]
        }
      });

      for (const model of models) {
        const currentSpeed = model.outputSpeed;
        if (currentSpeed !== correctSpeed) {
          await prisma.model.update({
            where: { id: model.id },
            data: {
              outputSpeed: correctSpeed,
              dataSource: 'artificial-analysis-chart',
              lastVerified: new Date(),
              metadata: JSON.stringify({
                ...JSON.parse(model.metadata || '{}'),
                speedSource: 'AA Chart Direct',
                previousSpeed: currentSpeed,
                updatedAt: new Date().toISOString()
              })
            }
          });
          console.log(`  ✅ ${model.name}: ${currentSpeed} t/s → ${correctSpeed} t/s`);
          updatedCount++;
        }
      }
    }

    // 2. AA에 없는 고속 모델들 비활성화 또는 낮은 값으로 조정
    console.log('\n🚫 AA 차트에 없는 고속 모델 처리...\n');

    for (const modelName of NON_AA_HIGH_SPEED_MODELS) {
      const models = await prisma.model.findMany({
        where: {
          name: { contains: modelName },
          outputSpeed: { gt: 100 }  // 100 t/s 이상인 경우
        }
      });

      for (const model of models) {
        // 비활성화 대신 낮은 값으로 조정 (또는 비활성화)
        await prisma.model.update({
          where: { id: model.id },
          data: {
            outputSpeed: 10,  // 낮은 기본값
            dataSource: 'non-aa-adjusted',
            metadata: JSON.stringify({
              ...JSON.parse(model.metadata || '{}'),
              adjustedReason: 'Not in AA Speed chart',
              previousSpeed: model.outputSpeed,
              adjustedAt: new Date().toISOString()
            })
          }
        });
        console.log(`  ⚠️ ${model.name}: ${model.outputSpeed} t/s → 10 t/s (AA에 없음)`);
        deactivatedCount++;
      }
    }

    // 3. 잘못된 높은 값들 수정
    console.log('\n🔧 비정상적으로 높은 Speed 값 수정...\n');

    const abnormallyFastModels = await prisma.model.findMany({
      where: {
        isActive: true,
        outputSpeed: { gt: 260 }  // AA 최고속도 260보다 높은 모델들
      }
    });

    for (const model of abnormallyFastModels) {
      // AA 목록에 있는지 확인
      const isInAA = Object.keys(ACTUAL_AA_SPEED_CHART).some(aaModel =>
        model.name.includes(aaModel) || aaModel.includes(model.name)
      );

      if (!isInAA) {
        await prisma.model.update({
          where: { id: model.id },
          data: {
            outputSpeed: 10,  // 기본 낮은 값
            dataSource: 'speed-corrected',
            metadata: JSON.stringify({
              ...JSON.parse(model.metadata || '{}'),
              correctionReason: 'Exceeded AA max speed',
              previousSpeed: model.outputSpeed,
              correctedAt: new Date().toISOString()
            })
          }
        });
        console.log(`  🔻 ${model.name}: ${model.outputSpeed} t/s → 10 t/s (최대값 초과)`);
        updatedCount++;
      }
    }

    // 4. 상위 15개 Speed 모델 확인
    console.log('\n🏆 수정 후 상위 15개 Speed 모델:');
    const topSpeedModels = await prisma.model.findMany({
      where: {
        isActive: true,
        outputSpeed: { not: null, gt: 0 }
      },
      select: {
        name: true,
        outputSpeed: true,
        dataSource: true
      },
      orderBy: {
        outputSpeed: 'desc'
      },
      take: 15
    });

    topSpeedModels.forEach((model, i) => {
      const sourceTag = model.dataSource === 'artificial-analysis-chart' ? '✅' : '❓';
      console.log(`${(i+1).toString().padStart(2)}. ${model.name.padEnd(35)} | ${model.outputSpeed.toString().padStart(3)} t/s | ${sourceTag}`);
    });

    console.log('\n📈 처리 결과:');
    console.log(`  Speed 값 수정: ${updatedCount}개`);
    console.log(`  조정된 모델: ${deactivatedCount}개`);

    // 5. 최고 속도 확인
    const maxSpeed = Math.max(...topSpeedModels.map(m => m.outputSpeed));
    console.log(`\n🚀 현재 최고 속도: ${maxSpeed} t/s`);
    console.log('   (AA 차트 최고 속도: 260 t/s)');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpeedChart();