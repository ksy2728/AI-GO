require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// AA 웹사이트에서 확인된 실제 모델들 (3개 차트 모두 검토)
const VERIFIED_AA_MODELS = [
  // Intelligence 차트에서 확인된 모델
  'GPT-5 (high)', 'GPT-5 high',
  'GPT-5 (medium)', 'GPT-5 medium',
  'GPT-5 mini',
  'Grok 4', 'Grok 4 Fast',
  'o3-pro', 'o3', 'o3-mini',
  'Gemini 2.5 Flash', 'Gemini 2.5 Flash-Lite', 'Gemini 2.5 Pro',
  'Gemini 1.5 Pro', 'Gemini 1.5 Flash',
  'Claude 3.5 Sonnet', 'Claude 3.5 Haiku',
  'DeepSeek V3', 'DeepSeek V3.1',
  'DeepSeek R1 Distill Llama 8B', 'DeepSeek R1',
  'Llama 3.1 405B', 'Llama 3.2 3B', 'Llama 3.2 8B',

  // Speed 차트에 있는 추가 모델
  'GPT-4o mini', 'GPT-4o',
  'Llama 3.1 Nemotron',
  'OpenChat 3.5',
  'Grok 4 Mini',

  // Price 차트에 있는 추가 모델
  'Gemini 3n E4B',
  'Ministral 3B', 'Ministral 8B',
  'Granite 3.3 8B',
  'Nova Micro',

  // 텍스트 요약에 나온 모델
  'Command-R', 'Command A', 'Command',
  'Aya Expanse 32B', 'Aya Expanse 8B',
  'MiniMax-Text-01',
];

// 확실히 AA에 없는 모델들 (제거 대상)
const MODELS_TO_REMOVE = [
  'ByteDance Jamba',  // 잘못 추가됨
  'Jamba 1.7',  // AA에 없음
  'Magistral',  // AA에 없음
  'Athene',  // AA에 없음
  'Yi Lightning',  // AA에 없음
  'Grok 2',  // Grok 4만 있음
  'Grok Code',  // AA에 없음
  'Grok 3',  // AA에 없음
  'Claude Instant',  // 오래된 모델
  'Claude 2',  // 오래된 모델
  'Claude 3 Opus',  // 최신 버전만
  'Claude 3 Haiku',  // 3.5 버전만
  'GPT-4.1',  // 존재하지 않음
  'GPT-4 Turbo',  // AA에 없음
  'o1',  // o3 시리즈만 있음
  'Qwen',  // AA에 없음
  'Mistral Large',  // AA에 없음
  'Command R+',  // Command R만 있음
  'Codestral',  // AA에 없음
  'Devstral',  // AA에 없음
  'Llama 3.1 70B',  // 405B만 있음
  'Llama 4',  // 존재하지 않음
  'Gemini 2.0',  // 2.5만 있음
  'NVIDIA Nemotron',  // Llama Nemotron만 있음
];

async function cleanupNonAAModels() {
  try {
    console.log('=== AA에 없는 모델 전체 정리 시작 ===\n');

    let deactivatedCount = 0;
    let checkedCount = 0;
    let bytedanceRemoved = false;

    // 1. ByteDance 관련 모델 제거
    console.log('🗑️ ByteDance 모델 제거...\n');
    const bytedanceModels = await prisma.model.findMany({
      where: {
        OR: [
          { name: { contains: 'ByteDance' } },
          { name: { contains: 'bytedance' } }
        ]
      }
    });

    for (const model of bytedanceModels) {
      await prisma.model.update({
        where: { id: model.id },
        data: {
          isActive: false,
          dataSource: 'removed-not-in-aa',
          metadata: JSON.stringify({
            removedReason: 'ByteDance not found in AA',
            removedAt: new Date().toISOString()
          })
        }
      });
      console.log(`  ❌ 제거: ${model.name}`);
      bytedanceRemoved = true;
      deactivatedCount++;
    }

    // 2. 확실히 AA에 없는 모델들 비활성화
    console.log('\n🚫 AA에 없는 모델들 비활성화...\n');

    for (const modelPattern of MODELS_TO_REMOVE) {
      const models = await prisma.model.findMany({
        where: {
          name: { contains: modelPattern },
          isActive: true
        }
      });

      for (const model of models) {
        checkedCount++;

        // AA 목록에 있는지 재확인
        const isInAA = VERIFIED_AA_MODELS.some(aaModel =>
          model.name === aaModel ||
          model.name.includes(aaModel) ||
          aaModel.includes(model.name)
        );

        if (!isInAA) {
          await prisma.model.update({
            where: { id: model.id },
            data: {
              isActive: false,
              dataSource: 'removed-not-in-aa',
              metadata: JSON.stringify({
                ...JSON.parse(model.metadata || '{}'),
                deactivatedReason: 'Not found in Artificial Analysis',
                deactivatedAt: new Date().toISOString()
              })
            }
          });
          console.log(`  ❌ 비활성화: ${model.name}`);
          deactivatedCount++;
        }
      }
    }

    // 3. 전체 활성 모델 검토
    console.log('\n🔍 전체 활성 모델 최종 검토...\n');

    const allActiveModels = await prisma.model.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        intelligenceScore: 'desc'
      }
    });

    let suspiciousCount = 0;
    for (const model of allActiveModels) {
      checkedCount++;

      // AA 목록에 있는지 확인
      const isInAA = VERIFIED_AA_MODELS.some(aaModel =>
        model.name === aaModel ||
        model.name.includes(aaModel) ||
        aaModel.includes(model.name) ||
        // 첫 단어로 매칭 (예: "Gemini" in "Gemini 2.5 Flash")
        model.name.split(' ')[0] === aaModel.split(' ')[0]
      );

      if (!isInAA) {
        console.log(`  ⚠️ 의심스러운 모델: ${model.name} (Score: ${model.intelligenceScore}, Speed: ${model.outputSpeed})`);
        suspiciousCount++;

        // 의심스러운 모델은 비활성화
        await prisma.model.update({
          where: { id: model.id },
          data: {
            isActive: false,
            dataSource: 'suspicious-not-verified',
            metadata: JSON.stringify({
              ...JSON.parse(model.metadata || '{}'),
              suspiciousReason: 'Not verified in AA',
              deactivatedAt: new Date().toISOString()
            })
          }
        });
        deactivatedCount++;
      }
    }

    // 4. ByteDance provider 제거 (모든 ByteDance 모델이 제거되었으므로)
    if (bytedanceRemoved) {
      console.log('\n🗑️ ByteDance provider 제거...');
      const bytedanceProvider = await prisma.provider.findFirst({
        where: {
          OR: [
            { name: 'ByteDance' },
            { slug: 'bytedance' }
          ]
        }
      });

      if (bytedanceProvider) {
        // Provider에 연결된 다른 모델이 있는지 확인
        const otherModels = await prisma.model.count({
          where: {
            providerId: bytedanceProvider.id,
            isActive: true
          }
        });

        if (otherModels === 0) {
          // 다른 활성 모델이 없으면 provider 삭제
          await prisma.provider.delete({
            where: { id: bytedanceProvider.id }
          });
          console.log('  ✅ ByteDance provider 삭제됨');
        }
      }
    }

    console.log('\n📊 정리 결과:');
    console.log(`  검토한 모델: ${checkedCount}개`);
    console.log(`  비활성화된 모델: ${deactivatedCount}개`);
    console.log(`  의심스러운 모델: ${suspiciousCount}개`);

    // 5. 최종 상위 20개 활성 모델 확인
    console.log('\n✅ 정리 후 상위 20개 활성 모델:');
    const topModels = await prisma.model.findMany({
      where: {
        isActive: true,
        intelligenceScore: { not: null }
      },
      select: {
        name: true,
        intelligenceScore: true,
        outputSpeed: true,
        dataSource: true
      },
      orderBy: {
        intelligenceScore: 'desc'
      },
      take: 20
    });

    topModels.forEach((model, i) => {
      const sourceTag = model.dataSource?.includes('artificial-analysis') ? '✅' : '❓';
      console.log(`${(i+1).toString().padStart(2)}. ${model.name.padEnd(30)} | Score: ${model.intelligenceScore || 'N/A'} | Speed: ${model.outputSpeed || 'N/A'} | ${sourceTag}`);
    });

    // 6. 활성 모델 총 개수
    const activeCount = await prisma.model.count({
      where: { isActive: true }
    });
    console.log(`\n📈 총 활성 모델 수: ${activeCount}개`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupNonAAModels();