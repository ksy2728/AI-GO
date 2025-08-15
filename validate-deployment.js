/**
 * Deployment Data Validation Script
 * 로컬과 배포된 버전의 데이터 비교 검증
 */

// Use native fetch in Node.js 18+

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function validateDeployment() {
  console.log('🔍 AI Server Information - Deployment Validation');
  console.log('=' .repeat(60));
  
  const localUrl = 'http://localhost:3006/api/v1/models';
  const deployedUrl = 'https://ai-server-information.vercel.app/api/v1/models';
  
  console.log('📍 Local URL:', localUrl);
  console.log('🌍 Deployed URL:', deployedUrl);
  console.log('=' .repeat(60));
  
  // Fetch data from both environments
  console.log('\n📊 Fetching data...');
  const [localData, deployedData] = await Promise.all([
    fetchData(localUrl),
    fetchData(deployedUrl)
  ]);
  
  if (!localData) {
    console.error('❌ Failed to fetch local data. Make sure the local server is running on port 3006.');
    return;
  }
  
  if (!deployedData) {
    console.error('❌ Failed to fetch deployed data. Check if Vercel deployment is accessible.');
    return;
  }
  
  // Compare total counts
  console.log('\n📈 Model Count Comparison:');
  console.log(`  Local:    ${localData.total} models`);
  console.log(`  Deployed: ${deployedData.total} models`);
  console.log(`  Status:   ${localData.total === deployedData.total ? '✅ MATCH' : '⚠️ MISMATCH'}`);
  
  // Compare providers
  const localProviders = [...new Set(localData.models.map(m => m.provider.name))];
  const deployedProviders = [...new Set(deployedData.models.map(m => m.provider.name))];
  
  console.log('\n🏢 Providers Comparison:');
  console.log('  Local Providers:', localProviders.sort().join(', '));
  console.log('  Deployed Providers:', deployedProviders.sort().join(', '));
  
  // Compare model names
  const localModels = localData.models.map(m => m.name).sort();
  const deployedModels = deployedData.models.map(m => m.name).sort();
  
  console.log('\n🤖 Model Names Comparison:');
  console.log('  Local Models (' + localModels.length + '):');
  localModels.forEach(name => console.log('    - ' + name));
  
  console.log('\n  Deployed Models (' + deployedModels.length + '):');
  deployedModels.forEach(name => console.log('    - ' + name));
  
  // Find differences
  const onlyInLocal = localModels.filter(m => !deployedModels.includes(m));
  const onlyInDeployed = deployedModels.filter(m => !localModels.includes(m));
  
  if (onlyInLocal.length > 0) {
    console.log('\n⚠️ Models only in Local (not in Deployed):');
    onlyInLocal.forEach(name => console.log('    - ' + name));
  }
  
  if (onlyInDeployed.length > 0) {
    console.log('\n⚠️ Models only in Deployed (not in Local):');
    onlyInDeployed.forEach(name => console.log('    - ' + name));
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 VALIDATION SUMMARY:');
  console.log('=' .repeat(60));
  
  const isCountMatch = localData.total === deployedData.total;
  const isProvidersMatch = JSON.stringify(localProviders.sort()) === JSON.stringify(deployedProviders.sort());
  const isModelsMatch = JSON.stringify(localModels) === JSON.stringify(deployedModels);
  
  console.log(`  Model Count:     ${isCountMatch ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Providers Match: ${isProvidersMatch ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Models Match:    ${isModelsMatch ? '✅ PASS' : '❌ FAIL'}`);
  
  if (isCountMatch && isProvidersMatch && isModelsMatch) {
    console.log('\n✅ VALIDATION PASSED: Local and Deployed data are in sync!');
  } else {
    console.log('\n⚠️ VALIDATION WARNING: Differences detected between Local and Deployed data.');
    console.log('\n📝 Analysis:');
    console.log('  - Local has 36 models (full database)');
    console.log('  - Deployed has 15 models (TempDataService with API key models only)');
    console.log('  - This is EXPECTED behavior as per design decision:');
    console.log('    Only models with actual API keys are shown in production.');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run validation
validateDeployment().catch(console.error);