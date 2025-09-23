require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// AA 웹사이트 스크린샷에서 확인된 실제 모델들 (Intelligence 차트 기준)
const AA_VERIFIED_MODELS = [
  'GPT-5 (high)',
  'GPT-5 high',
  'GPT-5 (medium)',
  'GPT-5 medium',
  'GPT-5 mini',
  'Grok 4',
  'Grok 4 Fast',
  'o3-pro',
  'o3',
  'o3-mini',
  'Gemini 2.5 Flash',
  'Gemini 2.5 Flash-Lite',
  'Gemini 2.5 Pro',
  'Gemini 1.5 Pro',
  'Gemini 1.5 Flash',
  'Claude 3.5 Sonnet',
  'Claude 3.5 Haiku',
  'DeepSeek V3',
  'DeepSeek V3.1',
  'DeepSeek R1 Distill Llama 8B',
  'Llama 3.1 405B',
  'Llama 3.2 3B',
  'Ministral 3B',
  'Granite 3.3 8B',
  'Nova Micro',
  'Command-R',
  'Command A',
  'Aya Expanse 32B',
  'Aya Expanse 8B',
  'MiniMax-Text-01'
];

// 확실히 AA에 없는데 높은 점수를 가진 모델들
const NON_AA_HIGH_SCORE_MODELS = [
  'Llama 3.1 70B Instruct',  // 75점 - AA에 없음
  'Llama 3.1 70B',           // 69점 - AA에 없음
  'Qwen 2.5 72B',             // 72점 - AA에 없음
  'Mistral Large',            // 70점 - AA에 없음
  'Command R+',               // 69점 - AA에 없음
  'Claude Instant 1.2',       // 65점 - AA에 없음 (오래된 모델)
  'Claude 2.0',               // 65점 - AA에 없음 (오래된 모델)
  'Claude 2.1',               // 65점 - AA에 없음 (오래된 모델)
  'Athene-V2 Chat',          // AA에 없음
  'Yi Lightning',            // AA에 없음
  'Grok 2',                  // AA에 없음 (Grok 4만 있음)
];

async function deactivateNonAAModels() {
  try {
    console.log('=== AA에 없는 모델 비활성화 시작 ===\n');

    let deactivatedCount = 0;
    let checkedCount = 0;

    // 1. 높은 점수를 가진 비-AA 모델들 비활성화
    console.log('📊 높은 Intelligence 점수를 가진 비-AA 모델 처리...\n');

    for (const modelName of NON_AA_HIGH_SCORE_MODELS) {
      const models = await prisma.model.findMany({
        where: {
          OR: [
            { name: { contains: modelName } },
            { slug: { contains: modelName.toLowerCase().replace(/\s+/g, '-') } }
          ]
        }
      });

      for (const model of models) {
        checkedCount++;
        if (model.isActive && model.intelligenceScore) {
          await prisma.model.update({
            where: { id: model.id },
            data: {
              isActive: false,
              dataSource: 'non-aa-deactivated',
              metadata: JSON.stringify({
                ...JSON.parse(model.metadata || '{}'),
                deactivatedReason: 'Not found in Artificial Analysis',
                deactivatedAt: new Date().toISOString(),
                previousScore: model.intelligenceScore
              })
            }
          });
          console.log(`  ❌ 비활성화: ${model.name} (이전 점수: ${model.intelligenceScore})`);
          deactivatedCount++;
        }
      }
    }

    // 2. 전체 활성 모델 중 AA 목록에 없는 모델들 찾기
    console.log('\n🔍 전체 모델 검사 중...\n');

    const allActiveModels = await prisma.model.findMany({
      where: {
        isActive: true,
        intelligenceScore: { not: null }
      },
      orderBy: {
        intelligenceScore: 'desc'
      }
    });

    for (const model of allActiveModels) {
      checkedCount++;

      // AA 목록에 있는지 확인
      const isInAA = AA_VERIFIED_MODELS.some(aaModel =>
        model.name.includes(aaModel) ||
        aaModel.includes(model.name.split(' ')[0]) // 첫 단어로도 매칭
      );

      if (!isInAA && model.intelligenceScore > 50) {
        // AA에 없고 점수가 50점 이상인 모델은 의심스러움
        await prisma.model.update({
          where: { id: model.id },
          data: {
            isActive: false,
            dataSource: 'non-aa-deactivated',
            metadata: JSON.stringify({
              ...JSON.parse(model.metadata || '{}'),
              deactivatedReason: 'Not verified in Artificial Analysis',
              deactivatedAt: new Date().toISOString(),
              previousScore: model.intelligenceScore
            })
          }
        });
        console.log(`  ❌ 비활성화: ${model.name} (점수: ${model.intelligenceScore})`);
        deactivatedCount++;
      }
    }

    console.log('\n📈 처리 결과:');
    console.log(`  검사한 모델: ${checkedCount}개`);
    console.log(`  비활성화된 모델: ${deactivatedCount}개`);

    // 3. 활성 상태인 상위 10개 모델 확인
    console.log('\n✅ 현재 활성 상태인 상위 10개 모델:');
    const topActiveModels = await prisma.model.findMany({
      where: {
        isActive: true,
        intelligenceScore: { not: null }
      },
      select: {
        name: true,
        intelligenceScore: true,
        dataSource: true
      },
      orderBy: {
        intelligenceScore: 'desc'
      },
      take: 10
    });

    topActiveModels.forEach((model, i) => {
      const sourceTag = model.dataSource === 'artificial-analysis' ? '✅ AA' : '❓';
      console.log(`${i+1}. ${model.name.padEnd(30)} | Score: ${model.intelligenceScore} | ${sourceTag}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deactivateNonAAModels();