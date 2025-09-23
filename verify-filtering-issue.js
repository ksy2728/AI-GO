const fs = require('fs');

function verifyFilteringIssue() {
  console.log('🔍 VERIFYING INTELLIGENCE SCORE FILTERING ISSUE\n');

  // Load AA models data
  const aaModelsPath = './src/data/aa-models.json';

  if (!fs.existsSync(aaModelsPath)) {
    console.log('❌ AA models file not found');
    return;
  }

  const aaData = JSON.parse(fs.readFileSync(aaModelsPath, 'utf8'));
  const aaModels = aaData.models || [];

  console.log(`📊 Total AA models: ${aaModels.length}`);

  // Analyze intelligence scores
  const withScore = aaModels.filter(m => m.intelligenceScore && m.intelligenceScore > 0);
  const withoutScore = aaModels.filter(m => !m.intelligenceScore || m.intelligenceScore <= 0);

  console.log(`✅ Models with intelligence score > 0: ${withScore.length}`);
  console.log(`❌ Models with intelligence score <= 0 or missing: ${withoutScore.length}\n`);

  // Check important models without scores
  console.log('🚨 IMPORTANT MODELS WITHOUT INTELLIGENCE SCORES:\n');

  const importantKeywords = ['GPT-5', 'o3', 'Claude 4', 'Grok 4', 'Gemini 2.5', 'DeepSeek V3'];

  withoutScore.forEach(model => {
    const isImportant = importantKeywords.some(keyword =>
      model.name.includes(keyword)
    );

    if (isImportant) {
      console.log(`  - ${model.name} (${model.provider})`);
      console.log(`    Intelligence Score: ${model.intelligenceScore || 'undefined'}`);
      console.log(`    Rank: ${model.rank || 'N/A'}`);
      console.log('');
    }
  });

  // Analyze score distribution
  console.log('📈 INTELLIGENCE SCORE DISTRIBUTION:\n');

  const scoreGroups = {
    'undefined/null': 0,
    '0': 0,
    '1-10': 0,
    '11-30': 0,
    '31-50': 0,
    '51-70': 0,
    '71+': 0
  };

  aaModels.forEach(model => {
    const score = model.intelligenceScore;

    if (!score || score === undefined || score === null) {
      scoreGroups['undefined/null']++;
    } else if (score === 0) {
      scoreGroups['0']++;
    } else if (score <= 10) {
      scoreGroups['1-10']++;
    } else if (score <= 30) {
      scoreGroups['11-30']++;
    } else if (score <= 50) {
      scoreGroups['31-50']++;
    } else if (score <= 70) {
      scoreGroups['51-70']++;
    } else {
      scoreGroups['71+']++;
    }
  });

  Object.entries(scoreGroups).forEach(([range, count]) => {
    const percentage = ((count / aaModels.length) * 100).toFixed(1);
    console.log(`  ${range}: ${count} models (${percentage}%)`);
  });

  // Check current filter impact
  console.log('\n⚠️ CURRENT FILTER IMPACT:\n');
  console.log(`If we filter intelligenceScore > 0:`);
  console.log(`  ✅ Would sync: ${withScore.length} models`);
  console.log(`  ❌ Would skip: ${withoutScore.length} models`);
  console.log(`  📊 Skip percentage: ${((withoutScore.length / aaModels.length) * 100).toFixed(1)}%`);

  // Show examples of what would be skipped
  console.log('\n🎯 TOP RANKED MODELS THAT WOULD BE SKIPPED:\n');

  const skippedTopModels = withoutScore
    .filter(m => m.rank && m.rank <= 100)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
    .slice(0, 10);

  skippedTopModels.forEach(model => {
    console.log(`  Rank ${model.rank}: ${model.name} (${model.provider})`);
  });

  // Recommendation
  console.log('\n💡 RECOMMENDATION:\n');
  console.log('The current filter `intelligenceScore > 0` is too restrictive and excludes');
  console.log(`${withoutScore.length} valid models (${((withoutScore.length / aaModels.length) * 100).toFixed(1)}% of total dataset).`);
  console.log('\nSuggested filter: `m.name && m.name.trim().length > 0`');
}

verifyFilteringIssue();