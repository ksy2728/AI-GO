const https = require('https');

const API_KEY = 'aa_DabcfQIXPgAdmJWJThCPkoSlTzmXFSea';

function fetchAAModels() {
  const options = {
    hostname: 'artificialanalysis.ai',
    path: '/api/v2/data/llms/models',
    method: 'GET',
    headers: {
      'x-api-key': API_KEY
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function analyzeAPIData() {
  console.log('=== AA API 데이터 분석 ===\n');

  try {
    const response = await fetchAAModels();

    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid API response');
      return;
    }

    // GPT-5 모델들 찾기
    const gpt5Models = response.data.filter(m =>
      m.name && m.name.includes('GPT-5')
    );

    console.log('📊 GPT-5 모델들의 API 데이터:\n');
    gpt5Models.forEach(m => {
      console.log(`Model: ${m.name}`);
      console.log(`  ID: ${m.id}`);
      console.log(`  Intelligence Score: ${m.evaluations?.artificial_analysis_intelligence_index || 'N/A'}`);
      console.log(`  Speed (t/s): ${m.median_output_tokens_per_second || 0}`);
      console.log(`  Price ($/M): ${m.pricing?.price_1m_blended_3_to_1 || 'N/A'}`);
      console.log('');
    });

    // Speed 상위 모델들
    console.log('🏆 Speed 상위 15개 모델:\n');
    const sortedBySpeed = response.data
      .filter(m => m.median_output_tokens_per_second > 0)
      .sort((a, b) => b.median_output_tokens_per_second - a.median_output_tokens_per_second)
      .slice(0, 15);

    sortedBySpeed.forEach((m, i) => {
      const isGPT5 = m.name.includes('GPT-5') ? ' ⭐' : '';
      console.log(`${(i+1).toString().padStart(2)}. ${m.name.padEnd(35)} | ${m.median_output_tokens_per_second.toFixed(1)} t/s${isGPT5}`);
    });

    // 데이터 검증
    console.log('\n⚠️ 현재 DB와 비교:\n');
    console.log('DB의 잘못된 값:');
    console.log('  GPT-5 (high): 116 t/s (DB) vs ??? (API)');
    console.log('  GPT-5 (medium): 97 t/s (DB) vs ??? (API)');
    console.log('  GPT-5 mini: 54 t/s (DB) vs ??? (API)');

    // 총 모델 수
    console.log(`\n📈 총 모델 수: ${response.data.length}개`);

  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);
  }
}

analyzeAPIData();