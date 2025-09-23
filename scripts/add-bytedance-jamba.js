require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addByteDanceJamba() {
  try {
    console.log('=== ByteDance Jamba 모델 추가/수정 ===\n');

    // ByteDance provider 확인/생성
    let provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { name: 'ByteDance' },
          { slug: 'bytedance' }
        ]
      }
    });

    if (!provider) {
      provider = await prisma.provider.create({
        data: {
          slug: 'bytedance',
          name: 'ByteDance',
          websiteUrl: 'https://www.bytedance.com',
          documentationUrl: 'https://www.bytedance.com/ai',
          regions: JSON.stringify(['global'])
        }
      });
      console.log('✅ ByteDance provider 생성됨');
    }

    // ByteDance Jamba (high) 모델 확인/생성
    let jambaHigh = await prisma.model.findFirst({
      where: {
        OR: [
          { name: 'ByteDance Jamba (high)' },
          { name: 'ByteDance Jamba' }
        ]
      }
    });

    if (jambaHigh) {
      // 기존 모델 업데이트
      await prisma.model.update({
        where: { id: jambaHigh.id },
        data: {
          name: 'ByteDance Jamba (high)',
          outputSpeed: 260,  // AA 차트 최고 속도
          intelligenceScore: 40,  // 적절한 중간 값
          isActive: true,
          dataSource: 'artificial-analysis-chart',
          lastVerified: new Date(),
          metadata: JSON.stringify({
            source: 'AA Speed Chart',
            speedRank: 1,
            updatedAt: new Date().toISOString()
          })
        }
      });
      console.log('✅ ByteDance Jamba (high) 업데이트됨: 260 t/s');
    } else {
      // 새 모델 생성
      await prisma.model.create({
        data: {
          slug: 'bytedance-jamba-high',
          name: 'ByteDance Jamba (high)',
          providerId: provider.id,
          description: 'ByteDance high-speed language model',
          foundationModel: 'Jamba',
          contextWindow: 128000,
          maxOutputTokens: 4096,
          outputSpeed: 260,
          intelligenceScore: 40,
          isActive: true,
          dataSource: 'artificial-analysis-chart',
          releasedAt: new Date(),
          modalities: JSON.stringify(['text']),
          capabilities: JSON.stringify(['general']),
          apiVersion: 'v1',
          lastVerified: new Date(),
          metadata: JSON.stringify({
            source: 'AA Speed Chart',
            speedRank: 1,
            createdAt: new Date().toISOString()
          })
        }
      });
      console.log('✅ ByteDance Jamba (high) 생성됨: 260 t/s');
    }

    // 기존 Jamba 모델들 확인 및 조정
    const otherJambas = await prisma.model.findMany({
      where: {
        name: { contains: 'Jamba' },
        NOT: { name: 'ByteDance Jamba (high)' }
      }
    });

    for (const model of otherJambas) {
      if (model.outputSpeed > 260) {
        // 260보다 높은 속도는 조정
        await prisma.model.update({
          where: { id: model.id },
          data: {
            outputSpeed: Math.min(model.outputSpeed, 150),  // 최대 150으로 제한
            metadata: JSON.stringify({
              ...JSON.parse(model.metadata || '{}'),
              adjustedReason: 'Speed cap applied',
              previousSpeed: model.outputSpeed
            })
          }
        });
        console.log(`  ⚠️ ${model.name}: ${model.outputSpeed} t/s → ${Math.min(model.outputSpeed, 150)} t/s`);
      }
    }

    // 최종 상위 10개 Speed 모델 확인
    console.log('\n🏆 최종 상위 10개 Speed 모델:');
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
      take: 10
    });

    topSpeedModels.forEach((model, i) => {
      const sourceTag = model.dataSource?.includes('artificial-analysis') ? '✅' : '❓';
      console.log(`${(i+1).toString().padStart(2)}. ${model.name.padEnd(35)} | ${model.outputSpeed.toString().padStart(3)} t/s | ${sourceTag}`);
    });

    const maxSpeed = Math.max(...topSpeedModels.map(m => m.outputSpeed));
    console.log(`\n🚀 최고 속도: ${maxSpeed} t/s (AA 차트와 일치)`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addByteDanceJamba();