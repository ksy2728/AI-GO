require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalAAFix() {
  try {
    console.log('=== 최종 AA 데이터 수정 ===\n');

    // 1. GPT-5 nano는 AA에 없으므로 비활성화
    console.log('❌ GPT-5 nano 비활성화 (AA에 없음)...');
    await prisma.model.updateMany({
      where: {
        name: { contains: 'GPT-5 nano' }
      },
      data: {
        isActive: false,
        dataSource: 'non-aa-deactivated'
      }
    });

    // 2. Grok 4 점수 확인 및 수정
    console.log('🔧 Grok 4 점수 수정 (63점으로)...');
    const grok4Models = await prisma.model.findMany({
      where: {
        name: { contains: 'Grok 4' }
      }
    });

    for (const model of grok4Models) {
      if (!model.name.includes('Fast')) {
        // Grok 4 (not Fast)는 63점
        await prisma.model.update({
          where: { id: model.id },
          data: {
            intelligenceScore: 63,
            isActive: true,
            dataSource: 'artificial-analysis'
          }
        });
        console.log(`  ✅ ${model.name}: 63점으로 수정`);
      } else {
        // Grok 4 Fast는 53점
        await prisma.model.update({
          where: { id: model.id },
          data: {
            intelligenceScore: 53,
            isActive: true,
            dataSource: 'artificial-analysis'
          }
        });
        console.log(`  ✅ ${model.name}: 53점으로 수정`);
      }
    }

    // 3. 중복 모델 처리 (같은 이름의 여러 버전)
    console.log('\n🔍 중복 모델 처리...');
    const duplicateGroups = await prisma.$queryRaw`
      SELECT name, COUNT(*) as count
      FROM models
      WHERE is_active = true
      GROUP BY name
      HAVING COUNT(*) > 1
    `;

    for (const group of duplicateGroups) {
      console.log(`  중복: ${group.name} (${group.count}개)`);

      // 중복 중 하나만 남기고 나머지 비활성화
      const duplicates = await prisma.model.findMany({
        where: {
          name: group.name,
          isActive: true
        },
        orderBy: {
          lastVerified: 'desc'
        }
      });

      // 첫 번째(가장 최근)만 남기고 나머지 비활성화
      for (let i = 1; i < duplicates.length; i++) {
        await prisma.model.update({
          where: { id: duplicates[i].id },
          data: { isActive: false }
        });
      }
    }

    // 4. 최종 상위 15개 모델 확인
    console.log('\n🏆 최종 상위 15개 활성 모델:');
    const topModels = await prisma.model.findMany({
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
      take: 15
    });

    topModels.forEach((model, i) => {
      const sourceTag = model.dataSource === 'artificial-analysis' ? '✅' : '❓';
      console.log(`${(i+1).toString().padStart(2)}. ${model.name.padEnd(30)} | Score: ${model.intelligenceScore} | ${sourceTag}`);
    });

    // 5. 활성 모델 총 개수
    const activeCount = await prisma.model.count({
      where: { isActive: true }
    });
    console.log(`\n📊 총 활성 모델 수: ${activeCount}개`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalAAFix();