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

async function analyzePriceData() {
  try {
    console.log('=== 가격 데이터 분석 ===\n');

    // API 데이터 가져오기
    console.log('1. AA API에서 데이터 가져오는 중...');
    const apiModels = await fetchAAModels();
    console.log(`   ✅ ${apiModels.length}개 모델 로드됨\n`);

    // API 가격 데이터 분석
    const apiModelsWithPrices = apiModels.filter(m =>
      m.pricing &&
      (m.pricing.price_1m_input_tokens > 0 || m.pricing.price_1m_output_tokens > 0)
    );

    const apiModelsWithoutPrices = apiModels.filter(m =>
      !m.pricing ||
      ((!m.pricing.price_1m_input_tokens || m.pricing.price_1m_input_tokens === 0) &&
       (!m.pricing.price_1m_output_tokens || m.pricing.price_1m_output_tokens === 0))
    );

    console.log('2. API 가격 데이터 통계:');
    console.log(`   - 가격 정보 있음: ${apiModelsWithPrices.length}개 (${Math.round(apiModelsWithPrices.length/apiModels.length*100)}%)`);
    console.log(`   - 가격 정보 없음: ${apiModelsWithoutPrices.length}개 (${Math.round(apiModelsWithoutPrices.length/apiModels.length*100)}%)\n`);

    // 가격 있는 API 모델 샘플
    console.log('   API에서 가격이 있는 모델 예시:');
    apiModelsWithPrices.slice(0, 5).forEach(m => {
      console.log(`   - ${m.name}`);
      console.log(`     Input: $${m.pricing.price_1m_input_tokens}/M, Output: $${m.pricing.price_1m_output_tokens}/M`);
    });

    // DB 데이터 분석
    console.log('\n3. 데이터베이스 가격 데이터 통계:');

    const dbTotalActive = await prisma.model.count({
      where: { isActive: true }
    });

    const dbWithInputPrice = await prisma.model.count({
      where: {
        isActive: true,
        inputPrice: { not: null, gt: 0 }
      }
    });

    const dbWithOutputPrice = await prisma.model.count({
      where: {
        isActive: true,
        outputPrice: { not: null, gt: 0 }
      }
    });

    const dbWithBothPrices = await prisma.model.count({
      where: {
        isActive: true,
        inputPrice: { not: null, gt: 0 },
        outputPrice: { not: null, gt: 0 }
      }
    });

    console.log(`   - 활성 모델 총계: ${dbTotalActive}개`);
    console.log(`   - Input 가격 있음: ${dbWithInputPrice}개 (${Math.round(dbWithInputPrice/dbTotalActive*100)}%)`);
    console.log(`   - Output 가격 있음: ${dbWithOutputPrice}개 (${Math.round(dbWithOutputPrice/dbTotalActive*100)}%)`);
    console.log(`   - 둘 다 있음: ${dbWithBothPrices}개 (${Math.round(dbWithBothPrices/dbTotalActive*100)}%)`);
    console.log(`   - Input 가격 없음: ${dbTotalActive - dbWithInputPrice}개 (${Math.round((dbTotalActive-dbWithInputPrice)/dbTotalActive*100)}%)`);
    console.log(`   - Output 가격 없음: ${dbTotalActive - dbWithOutputPrice}개 (${Math.round((dbTotalActive-dbWithOutputPrice)/dbTotalActive*100)}%)\n`);

    // DB 가격 데이터 샘플
    const dbModelsWithPrices = await prisma.model.findMany({
      where: {
        isActive: true,
        inputPrice: { not: null, gt: 0 },
        outputPrice: { not: null, gt: 0 }
      },
      take: 5,
      orderBy: { inputPrice: 'asc' },
      select: {
        name: true,
        slug: true,
        inputPrice: true,
        outputPrice: true,
        dataSource: true
      }
    });

    console.log('   DB에서 가격이 있는 모델 예시:');
    dbModelsWithPrices.forEach(m => {
      console.log(`   - ${m.name}`);
      console.log(`     Input: $${m.inputPrice}, Output: $${m.outputPrice}, Source: ${m.dataSource}`);
    });

    // 불일치 분석
    console.log('\n4. API vs DB 불일치 분석:');

    // API에는 가격이 있는데 DB에는 없는 모델 찾기
    const missingPrices = [];

    for (const apiModel of apiModelsWithPrices) {
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
        const dbHasNoPrice = !dbModel.inputPrice || dbModel.inputPrice === 0 ||
                             !dbModel.outputPrice || dbModel.outputPrice === 0;

        if (dbHasNoPrice) {
          missingPrices.push({
            dbId: dbModel.id,
            name: apiModel.name,
            apiInputPrice: apiModel.pricing.price_1m_input_tokens,
            apiOutputPrice: apiModel.pricing.price_1m_output_tokens,
            dbInputPrice: dbModel.inputPrice,
            dbOutputPrice: dbModel.outputPrice
          });
        }
      }
    }

    console.log(`   - API에 가격이 있지만 DB에 없는 모델: ${missingPrices.length}개\n`);

    if (missingPrices.length > 0) {
      console.log('   누락된 가격 데이터가 있는 모델 (처음 10개):');
      missingPrices.slice(0, 10).forEach(m => {
        console.log(`   - ${m.name}`);
        console.log(`     API: Input $${m.apiInputPrice}, Output $${m.apiOutputPrice}`);
        console.log(`     DB: Input ${m.dbInputPrice || 'null'}, Output ${m.dbOutputPrice || 'null'}`);
      });
    }

    // 특별 체크: GPT-5 모델들
    console.log('\n5. GPT-5 모델 가격 체크:');
    const gpt5ApiModels = apiModels.filter(m => m.name.includes('GPT-5'));

    for (const apiModel of gpt5ApiModels) {
      const dbModel = await prisma.model.findFirst({
        where: { name: apiModel.name },
        select: {
          name: true,
          inputPrice: true,
          outputPrice: true
        }
      });

      console.log(`   ${apiModel.name}:`);
      console.log(`     API: Input $${apiModel.pricing?.price_1m_input_tokens || 'N/A'}, Output $${apiModel.pricing?.price_1m_output_tokens || 'N/A'}`);
      if (dbModel) {
        console.log(`     DB:  Input $${dbModel.inputPrice || 'null'}, Output $${dbModel.outputPrice || 'null'}`);
      } else {
        console.log(`     DB:  모델 없음`);
      }
    }

    // 요약
    console.log('\n📊 요약:');
    console.log(`   - API: ${apiModelsWithPrices.length}/${apiModels.length} 모델에 가격 정보 있음`);
    console.log(`   - DB: ${dbWithBothPrices}/${dbTotalActive} 모델에 가격 정보 있음`);
    console.log(`   - 업데이트 필요: ${missingPrices.length}개 모델`);

    if (missingPrices.length > 0) {
      console.log('\n💡 권장사항: scripts/fix-missing-prices.js를 실행하여 누락된 가격 데이터를 업데이트하세요.');
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
analyzePriceData();