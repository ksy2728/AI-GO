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
            console.log(`✅ AA API에서 ${response.data.length}개 모델 가져옴`);
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

/**
 * 데이터베이스에 동기화
 */
async function syncToDatabase() {
  try {
    console.log('=== AA API 데이터 동기화 시작 ===\n');
    console.log(`API Key: ${API_KEY.substring(0, 10)}...`);

    const apiModels = await fetchAAModels();
    console.log(`\n📊 ${apiModels.length}개 모델 처리 중...\n`);

    let created = 0;
    let updated = 0;
    let reactivated = 0;
    let errors = 0;

    // Provider 캐시
    const providerCache = new Map();

    for (const apiModel of apiModels) {
      try {
        // Provider 처리
        let providerId = null;
        if (apiModel.model_creator) {
          const providerKey = apiModel.model_creator.slug;

          if (providerCache.has(providerKey)) {
            providerId = providerCache.get(providerKey);
          } else {
            let provider = await prisma.provider.findFirst({
              where: {
                OR: [
                  { slug: apiModel.model_creator.slug },
                  { name: apiModel.model_creator.name }
                ]
              }
            });

            if (!provider) {
              provider = await prisma.provider.create({
                data: {
                  slug: apiModel.model_creator.slug,
                  name: apiModel.model_creator.name,
                  websiteUrl: '',
                  regions: JSON.stringify(['global'])
                }
              });
              console.log(`  📦 Provider 생성: ${apiModel.model_creator.name}`);
            }

            providerId = provider.id;
            providerCache.set(providerKey, providerId);
          }
        }

        // 기존 모델 찾기
        let existingModel = await prisma.model.findFirst({
          where: {
            OR: [
              { slug: apiModel.slug },
              { name: apiModel.name }
            ]
          }
        });

        // Prisma 스키마에 맞게 수정
        const modelData = {
          name: apiModel.name,
          slug: apiModel.slug,
          providerId: providerId,
          description: `${apiModel.name} by ${apiModel.model_creator?.name || 'Unknown'}`,
          intelligenceScore: apiModel.evaluations?.artificial_analysis_intelligence_index
            ? Math.round(apiModel.evaluations.artificial_analysis_intelligence_index)
            : null,
          outputSpeed: apiModel.median_output_tokens_per_second
            ? Math.round(apiModel.median_output_tokens_per_second)
            : null,
          inputPrice: apiModel.pricing?.price_1m_input_tokens || null,
          outputPrice: apiModel.pricing?.price_1m_output_tokens || null,
          releasedAt: apiModel.release_date ? new Date(apiModel.release_date) : null,
          isActive: true, // 모든 API 모델 활성화
          dataSource: 'artificial-analysis-api',
          lastVerified: new Date(),
          metadata: JSON.stringify({
            apiId: apiModel.id,
            evaluations: apiModel.evaluations,
            codingIndex: apiModel.evaluations?.artificial_analysis_coding_index || null,
            mathIndex: apiModel.evaluations?.artificial_analysis_math_index || null,
            timeToFirstToken: apiModel.median_time_to_first_token_seconds || null,
            priceBlended: apiModel.pricing?.price_1m_blended_3_to_1 || null,
            lastSyncedAt: new Date().toISOString()
          }),
          contextWindow: 128000, // 기본값
          maxOutputTokens: 4096, // 기본값
          modalities: JSON.stringify(['text']),
          capabilities: JSON.stringify(['general']),
          apiVersion: 'v2'
        };

        if (existingModel) {
          // 업데이트
          const wasInactive = !existingModel.isActive;
          await prisma.model.update({
            where: { id: existingModel.id },
            data: modelData
          });

          if (wasInactive) {
            console.log(`  ✅ 재활성화: ${apiModel.name} (Speed: ${apiModel.median_output_tokens_per_second || 0} t/s)`);
            reactivated++;
          } else {
            const speedChange = existingModel.outputSpeed !== modelData.outputSpeed;
            if (speedChange) {
              console.log(`  📝 업데이트: ${apiModel.name} (Speed: ${existingModel.outputSpeed || 0} → ${modelData.outputSpeed || 0} t/s)`);
            }
            updated++;
          }
        } else {
          // 새로 생성
          await prisma.model.create({
            data: {
              ...modelData,
              foundationModel: apiModel.name.split(' ')[0], // 첫 단어를 foundation model로
              slug: modelData.slug // slug가 없으면 생성 시 에러 발생
            }
          });
          console.log(`  ✨ 생성: ${apiModel.name} (Speed: ${apiModel.median_output_tokens_per_second || 0} t/s)`);
          created++;
        }
      } catch (error) {
        console.error(`  ❌ 오류: ${apiModel.name} - ${error.message}`);
        errors++;
      }
    }

    // GPT-5 모델 확인
    console.log('\n🔍 GPT-5 모델 상태 확인:');
    const gpt5Models = await prisma.model.findMany({
      where: {
        name: { contains: 'GPT-5' }
      },
      select: {
        name: true,
        intelligenceScore: true,
        outputSpeed: true,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    gpt5Models.forEach(model => {
      const status = model.isActive ? '✅' : '❌';
      console.log(`  ${status} ${model.name.padEnd(25)} | Intelligence: ${model.intelligenceScore || 'N/A'} | Speed: ${model.outputSpeed || 0} t/s`);
    });

    // 상위 Speed 모델
    console.log('\n🏆 Speed 상위 10개 모델:');
    const topSpeedModels = await prisma.model.findMany({
      where: {
        isActive: true,
        outputSpeed: { not: null, gt: 0 }
      },
      orderBy: {
        outputSpeed: 'desc'
      },
      take: 10,
      select: {
        name: true,
        outputSpeed: true
      }
    });

    topSpeedModels.forEach((model, i) => {
      console.log(`  ${(i+1).toString().padStart(2)}. ${model.name.padEnd(40)} | ${model.outputSpeed} t/s`);
    });

    // 최종 통계
    const totalActive = await prisma.model.count({
      where: { isActive: true }
    });

    console.log('\n📊 동기화 완료 요약:');
    console.log(`  생성: ${created}개 모델`);
    console.log(`  업데이트: ${updated}개 모델`);
    console.log(`  재활성화: ${reactivated}개 모델`);
    console.log(`  오류: ${errors}개`);
    console.log(`  총 활성 모델: ${totalActive}개`);

  } catch (error) {
    console.error('❌ 동기화 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
syncToDatabase();