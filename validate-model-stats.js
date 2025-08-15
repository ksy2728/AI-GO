/**
 * Model Stats Validation Script
 * 15개 공통 모델의 상세 stats 비교 검증
 */

// 배포 버전에 있는 15개 모델 목록
const TARGET_MODELS = [
  'GPT-4o', 'GPT-4o mini', 'GPT-4 Turbo', 'GPT-3.5 Turbo',
  'o1-preview', 'o1-mini',
  'Claude 3 Opus', 'Claude 3.5 Sonnet', 'Claude 3 Haiku',
  'Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Gemini Pro',
  'Llama 3.1 405B', 'Llama 3.1 70B', 'Llama 3.1 8B'
];

async function fetchModelDetails(baseUrl, modelName) {
  try {
    const response = await fetch(`${baseUrl}/api/v1/models`);
    const data = await response.json();
    
    const model = data.models.find(m => m.name === modelName);
    if (!model) return null;
    
    return {
      name: model.name,
      provider: model.provider.name,
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      capabilities: model.capabilities,
      pricing: model.pricing?.[0] ? {
        inputPerMillion: model.pricing[0].inputPerMillion,
        outputPerMillion: model.pricing[0].outputPerMillion
      } : null,
      status: model.status?.[0] ? {
        status: model.status[0].status,
        availability: model.status[0].availability,
        latencyP50: model.status[0].latencyP50,
        errorRate: model.status[0].errorRate
      } : null,
      benchmarks: model.benchmarkScores?.map(b => ({
        suite: b.suite.name,
        score: b.scoreRaw
      })) || []
    };
  } catch (error) {
    console.error(`Error fetching ${modelName}:`, error.message);
    return null;
  }
}

function compareValues(val1, val2, tolerance = 0.01) {
  if (val1 === val2) return true;
  if (typeof val1 === 'number' && typeof val2 === 'number') {
    return Math.abs(val1 - val2) < tolerance;
  }
  return false;
}

function formatValue(value) {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    if (value > 1000) return value.toLocaleString();
    return value.toFixed(2);
  }
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

async function validateModelStats() {
  console.log('🔍 Model Stats Validation - 15 Core Models');
  console.log('=' .repeat(80));
  
  const localUrl = 'http://localhost:3006';
  const deployedUrl = 'https://ai-server-information.vercel.app';
  
  const results = [];
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  console.log('\n📊 Comparing model stats between Local and Deployed versions...\n');
  
  for (const modelName of TARGET_MODELS) {
    process.stdout.write(`Checking ${modelName}...`);
    
    const [localModel, deployedModel] = await Promise.all([
      fetchModelDetails(localUrl, modelName),
      fetchModelDetails(deployedUrl, modelName)
    ]);
    
    if (!localModel && !deployedModel) {
      console.log(' ⏭️ SKIPPED (not found in both)');
      skipCount++;
      continue;
    }
    
    if (!localModel || !deployedModel) {
      console.log(` ❌ MISSING (Local: ${!!localModel}, Deployed: ${!!deployedModel})`);
      failCount++;
      results.push({
        model: modelName,
        status: 'MISSING',
        local: !!localModel,
        deployed: !!deployedModel
      });
      continue;
    }
    
    // Compare stats
    const comparisons = {
      contextWindow: compareValues(localModel.contextWindow, deployedModel.contextWindow),
      maxOutputTokens: compareValues(localModel.maxOutputTokens, deployedModel.maxOutputTokens),
      inputPrice: localModel.pricing && deployedModel.pricing ? 
        compareValues(localModel.pricing.inputPerMillion, deployedModel.pricing.inputPerMillion, 0.1) : true,
      outputPrice: localModel.pricing && deployedModel.pricing ? 
        compareValues(localModel.pricing.outputPerMillion, deployedModel.pricing.outputPerMillion, 0.1) : true,
    };
    
    const allMatch = Object.values(comparisons).every(v => v);
    
    if (allMatch) {
      console.log(' ✅ PASS');
      passCount++;
    } else {
      console.log(' ⚠️ MISMATCH');
      failCount++;
    }
    
    results.push({
      model: modelName,
      status: allMatch ? 'PASS' : 'MISMATCH',
      comparisons,
      details: {
        local: localModel,
        deployed: deployedModel
      }
    });
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('📋 DETAILED COMPARISON RESULTS');
  console.log('=' .repeat(80));
  
  // Show detailed mismatches
  const mismatches = results.filter(r => r.status === 'MISMATCH');
  if (mismatches.length > 0) {
    console.log('\n⚠️ Models with Mismatched Stats:\n');
    
    for (const mismatch of mismatches) {
      console.log(`📌 ${mismatch.model}`);
      console.log('  Comparison Results:');
      
      for (const [key, matches] of Object.entries(mismatch.comparisons)) {
        if (!matches) {
          const localVal = key.includes('Price') ? 
            mismatch.details.local.pricing?.[key.replace('Price', 'PerMillion')] :
            mismatch.details.local[key];
          const deployedVal = key.includes('Price') ? 
            mismatch.details.deployed.pricing?.[key.replace('Price', 'PerMillion')] :
            mismatch.details.deployed[key];
          
          console.log(`    ❌ ${key}:`);
          console.log(`       Local:    ${formatValue(localVal)}`);
          console.log(`       Deployed: ${formatValue(deployedVal)}`);
        }
      }
      console.log();
    }
  }
  
  // Show sample of matching models
  const matches = results.filter(r => r.status === 'PASS').slice(0, 3);
  if (matches.length > 0) {
    console.log('✅ Sample of Models with Matching Stats:\n');
    
    for (const match of matches) {
      console.log(`📌 ${match.model}`);
      console.log(`  Context Window: ${formatValue(match.details.local.contextWindow)} tokens`);
      console.log(`  Max Output: ${formatValue(match.details.local.maxOutputTokens)} tokens`);
      if (match.details.local.pricing) {
        console.log(`  Input Price: $${formatValue(match.details.local.pricing.inputPerMillion)}/M tokens`);
        console.log(`  Output Price: $${formatValue(match.details.local.pricing.outputPerMillion)}/M tokens`);
      }
      console.log();
    }
  }
  
  // Summary
  console.log('=' .repeat(80));
  console.log('📊 VALIDATION SUMMARY');
  console.log('=' .repeat(80));
  console.log(`  Total Models Checked: ${TARGET_MODELS.length}`);
  console.log(`  ✅ Passed: ${passCount}`);
  console.log(`  ⚠️ Failed: ${failCount}`);
  console.log(`  ⏭️ Skipped: ${skipCount}`);
  console.log(`  Success Rate: ${((passCount / TARGET_MODELS.length) * 100).toFixed(1)}%`);
  
  if (passCount === TARGET_MODELS.length) {
    console.log('\n✅ PERFECT MATCH: All 15 models have identical stats!');
  } else if (passCount >= TARGET_MODELS.length * 0.8) {
    console.log('\n✅ GOOD MATCH: Most models have matching stats (>80% match rate)');
  } else {
    console.log('\n⚠️ ATTENTION NEEDED: Significant differences detected in model stats');
  }
  
  console.log('\n' + '=' .repeat(80));
}

// Run validation
validateModelStats().catch(console.error);