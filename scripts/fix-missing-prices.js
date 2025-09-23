require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const API_KEY = process.env.artificialanalysis_API_TOKEN || 'aa_DabcfQIXPgAdmJWJThCPkoSlTzmXFSea';

/**
 * AA API에서 모델 데이터 가져오기
 */
function fetchAAModels() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'artificialanalysis.ai',
      path: '/api/v2/data/llms/models',
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status === 200 && response.data) {
            resolve(response.data);
          } else {
            reject(new Error('Invalid API response'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function fixMissingPrices() {
  try {
    console.log('=== 누락된 가격 데이터 수정 ===\n');

    // API 데이터 가져오기
    console.log('1. AA API에서 데이터 가져오는 중...');
    const apiModels = await fetchAAModels();
    console.log(`   ✅ ${apiModels.length}개 모델 로드됨\n`);

    // API에서 가격이 있는 모델만 필터
    const apiModelsWithPrices = apiModels.filter(m =>
      m.pricing &&
      (m.pricing.price_1m_input_tokens > 0 || m.pricing.price_1m_output_tokens > 0)
    );

    console.log(`2. 가격 정보가 있는 API 모델: ${apiModelsWithPrices.length}개\n`);

    // 누락된 가격 찾기 및 수정
    console.log('3. 누락된 가격 데이터 찾기 및 수정:\n');

    let updateCount = 0;
    let errorCount = 0;
    const updateResults = [];

    for (const apiModel of apiModelsWithPrices) {
      // DB에서 해당 모델 찾기
      const dbModel = await prisma.model.findFirst({
        where: {
          OR: [
            { slug: apiModel.slug },
            { name: apiModel.name }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          inputPrice: true,
          outputPrice: true
        }
      });

      if (dbModel) {
        // 가격이 누락된 경우만 업데이트
        const needsUpdate = (!dbModel.inputPrice || dbModel.inputPrice === 0) ||
                           (!dbModel.outputPrice || dbModel.outputPrice === 0);

        if (needsUpdate) {
          try {
            const updatedModel = await prisma.model.update({
              where: { id: dbModel.id },
              data: {
                inputPrice: apiModel.pricing.price_1m_input_tokens,
                outputPrice: apiModel.pricing.price_1m_output_tokens,
                dataSource: 'artificial-analysis-api',
                lastVerified: new Date()
              }
            });

            console.log(`   ✅ ${dbModel.name} 업데이트 완료`);
            console.log(`      Input: ${dbModel.inputPrice || 'null'} → $${apiModel.pricing.price_1m_input_tokens}`);
            console.log(`      Output: ${dbModel.outputPrice || 'null'} → $${apiModel.pricing.price_1m_output_tokens}`);

            updateResults.push({
              name: dbModel.name,
              oldInput: dbModel.inputPrice,
              oldOutput: dbModel.outputPrice,
              newInput: apiModel.pricing.price_1m_input_tokens,
              newOutput: apiModel.pricing.price_1m_output_tokens
            });

            updateCount++;
          } catch (error) {
            console.error(`   ❌ ${dbModel.name} 업데이트 실패: ${error.message}`);
            errorCount++;
          }
        }
      }
    }

    // 결과 요약
    console.log('\n📊 수정 결과 요약:');
    console.log(`   - 업데이트 성공: ${updateCount}개 모델`);
    console.log(`   - 업데이트 실패: ${errorCount}개 모델`);

    // 업데이트된 모델 목록
    if (updateResults.length > 0) {
      console.log('\n📝 업데이트된 모델 목록:');
      updateResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name}`);
        console.log(`      Input: ${result.oldInput || 'null'} → $${result.newInput}`);
        console.log(`      Output: ${result.oldOutput || 'null'} → $${result.newOutput}`);
      });
    }

    // 최종 확인
    const finalCheck = await prisma.model.count({
      where: {
        isActive: true,
        inputPrice: { not: null, gt: 0 },
        outputPrice: { not: null, gt: 0 }
      }
    });

    const totalActive = await prisma.model.count({
      where: { isActive: true }
    });

    console.log('\n✅ 최종 데이터베이스 상태:');
    console.log(`   - 활성 모델 총: ${totalActive}개`);
    console.log(`   - 가격 정보 있음: ${finalCheck}개 (${Math.round(finalCheck/totalActive*100)}%)`);
    console.log(`   - 가격 정보 없음: ${totalActive - finalCheck}개 (${Math.round((totalActive - finalCheck)/totalActive*100)}%)`);

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
fixMissingPrices();