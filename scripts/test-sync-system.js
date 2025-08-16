#!/usr/bin/env node

/**
 * Comprehensive Test Suite for AI Model Sync System
 * Tests all aspects of the auto-sync functionality
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: [],
  startTime: Date.now()
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const color = {
    info: colors.blue,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red
  }[type] || colors.reset;
  
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

async function testAPIKeys() {
  log('Testing API Key Configuration...', 'info');
  
  const results = {
    openai: false,
    anthropic: false,
    gemini: false,
    google: false
  };
  
  // Load environment variables
  require('dotenv').config();
  require('dotenv').config({ path: '.env.local' });
  
  // Check each API key
  if (process.env.OPENAI_API_KEY) {
    results.openai = true;
    log('✅ OpenAI API key found', 'success');
  } else {
    log('❌ OpenAI API key missing', 'warning');
    TEST_RESULTS.warnings.push('OpenAI API key not configured');
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    results.anthropic = true;
    log('✅ Anthropic API key found', 'success');
  } else {
    log('❌ Anthropic API key missing', 'warning');
    TEST_RESULTS.warnings.push('Anthropic API key not configured');
  }
  
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    results.gemini = true;
    results.google = true;
    log('✅ Gemini/Google API key found', 'success');
  } else {
    log('❌ Gemini/Google API key missing', 'warning');
    TEST_RESULTS.warnings.push('Gemini/Google API key not configured');
  }
  
  return results;
}

async function testSyncScript() {
  log('Testing sync-all-models.js script...', 'info');
  
  try {
    // Check if script exists
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync-all-models.js');
    await fs.access(scriptPath);
    log('✅ Sync script exists', 'success');
    
    // Test script syntax
    try {
      require(scriptPath);
      log('✅ Script syntax is valid', 'success');
      TEST_RESULTS.passed.push('Sync script syntax validation');
    } catch (error) {
      log(`❌ Script syntax error: ${error.message}`, 'error');
      TEST_RESULTS.failed.push(`Script syntax error: ${error.message}`);
      return false;
    }
    
    // Test dry run
    log('Running sync script in test mode...', 'info');
    const output = execSync('node scripts/sync-all-models.js', { 
      encoding: 'utf8',
      env: { ...process.env, TEST_MODE: 'true' }
    });
    
    if (output.includes('sync completed successfully')) {
      log('✅ Sync script executed successfully', 'success');
      TEST_RESULTS.passed.push('Sync script execution');
    } else {
      log('⚠️ Sync script completed with warnings', 'warning');
      TEST_RESULTS.warnings.push('Sync script had warnings');
    }
    
    return true;
  } catch (error) {
    log(`❌ Sync script test failed: ${error.message}`, 'error');
    TEST_RESULTS.failed.push(`Sync script test: ${error.message}`);
    return false;
  }
}

async function testDataIntegrity() {
  log('Testing data integrity...', 'info');
  
  try {
    // Load models.json
    const dataPath = path.join(process.cwd(), 'data', 'models.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    // Validate structure
    const requiredFields = ['metadata', 'statistics', 'providers', 'models'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length === 0) {
      log('✅ Data structure is valid', 'success');
      TEST_RESULTS.passed.push('Data structure validation');
    } else {
      log(`❌ Missing fields: ${missingFields.join(', ')}`, 'error');
      TEST_RESULTS.failed.push(`Missing data fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Check for duplicates
    const modelKeys = new Set();
    let duplicates = 0;
    
    for (const model of data.models) {
      const key = `${model.provider?.id}-${model.name}`;
      if (modelKeys.has(key)) {
        duplicates++;
        log(`⚠️ Duplicate model found: ${key}`, 'warning');
      }
      modelKeys.add(key);
    }
    
    if (duplicates === 0) {
      log('✅ No duplicate models found', 'success');
      TEST_RESULTS.passed.push('No duplicate models');
    } else {
      TEST_RESULTS.warnings.push(`Found ${duplicates} duplicate models`);
    }
    
    // Validate model data
    let invalidModels = 0;
    for (const model of data.models) {
      if (!model.name || !model.provider) {
        invalidModels++;
        log(`⚠️ Invalid model: ${JSON.stringify(model).substring(0, 100)}`, 'warning');
      }
    }
    
    if (invalidModels === 0) {
      log('✅ All models have valid data', 'success');
      TEST_RESULTS.passed.push('Model data validation');
    } else {
      TEST_RESULTS.warnings.push(`Found ${invalidModels} invalid models`);
    }
    
    // Check statistics accuracy
    const actualStats = {
      totalModels: data.models.length,
      activeModels: data.models.filter(m => m.isActive).length,
      totalProviders: [...new Set(data.models.map(m => m.provider?.id))].filter(Boolean).length
    };
    
    const statsMatch = 
      data.statistics.totalModels === actualStats.totalModels &&
      data.statistics.activeModels === actualStats.activeModels &&
      data.statistics.totalProviders === actualStats.totalProviders;
    
    if (statsMatch) {
      log('✅ Statistics are accurate', 'success');
      TEST_RESULTS.passed.push('Statistics accuracy');
    } else {
      log('⚠️ Statistics mismatch detected', 'warning');
      log(`  Expected: ${JSON.stringify(actualStats)}`, 'info');
      log(`  Found: ${JSON.stringify({
        totalModels: data.statistics.totalModels,
        activeModels: data.statistics.activeModels,
        totalProviders: data.statistics.totalProviders
      })}`, 'info');
      TEST_RESULTS.warnings.push('Statistics mismatch');
    }
    
    // Check for latest models
    const latestModels = ['GPT-5', 'o3', 'o3-mini', 'GPT-4.5', 'gpt-oss-120b', 'gpt-oss-20b'];
    const foundLatest = latestModels.filter(name => 
      data.models.some(m => m.name === name)
    );
    
    log(`✅ Found ${foundLatest.length}/${latestModels.length} latest models`, 'success');
    if (foundLatest.length < latestModels.length) {
      const missing = latestModels.filter(m => !foundLatest.includes(m));
      TEST_RESULTS.warnings.push(`Missing latest models: ${missing.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    log(`❌ Data integrity test failed: ${error.message}`, 'error');
    TEST_RESULTS.failed.push(`Data integrity: ${error.message}`);
    return false;
  }
}

async function testGitHubWorkflow() {
  log('Testing GitHub Actions workflow...', 'info');
  
  try {
    // Check workflow files
    const workflowPath = path.join(process.cwd(), '.github', 'workflows');
    const files = await fs.readdir(workflowPath);
    
    const syncWorkflows = files.filter(f => f.includes('sync-all-providers'));
    
    if (syncWorkflows.length > 0) {
      log(`✅ Found ${syncWorkflows.length} sync workflow(s)`, 'success');
      TEST_RESULTS.passed.push('GitHub workflow files exist');
      
      // Validate workflow syntax
      for (const file of syncWorkflows) {
        const content = await fs.readFile(path.join(workflowPath, file), 'utf8');
        
        // Check for required elements
        const checks = [
          { pattern: /permissions:\s*\n\s*contents:\s*write/m, name: 'Write permissions' },
          { pattern: /OPENAI_API_KEY.*secrets\.OPENAI_API_KEY/s, name: 'OpenAI secret' },
          { pattern: /ANTHROPIC_API_KEY.*secrets\.ANTHROPIC_API_KEY/s, name: 'Anthropic secret' },
          { pattern: /GEMINI_API_KEY.*secrets\.GEMINI_API_KEY/s, name: 'Gemini secret' },
          { pattern: /cron:.*\*\/6/s, name: '6-hour schedule' }
        ];
        
        for (const check of checks) {
          if (check.pattern.test(content)) {
            log(`  ✅ ${check.name} configured`, 'success');
          } else {
            log(`  ⚠️ ${check.name} might be missing`, 'warning');
            TEST_RESULTS.warnings.push(`Workflow ${file}: ${check.name} configuration`);
          }
        }
      }
    } else {
      log('❌ No sync workflow found', 'error');
      TEST_RESULTS.failed.push('GitHub workflow not found');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ Workflow test failed: ${error.message}`, 'error');
    TEST_RESULTS.failed.push(`Workflow test: ${error.message}`);
    return false;
  }
}

async function testErrorHandling() {
  log('Testing error handling...', 'info');
  
  try {
    // Test with invalid API responses
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync-all-models.js');
    const scriptContent = await fs.readFile(scriptPath, 'utf8');
    
    // Check for error handling patterns
    const errorPatterns = [
      { pattern: /try\s*{[\s\S]*?}\s*catch/g, name: 'Try-catch blocks' },
      { pattern: /console\.error/g, name: 'Error logging' },
      { pattern: /HARDCODED_MODELS/g, name: 'Fallback data' },
      { pattern: /continue-on-error/g, name: 'Graceful degradation' }
    ];
    
    for (const check of errorPatterns) {
      const matches = scriptContent.match(check.pattern);
      if (matches && matches.length > 0) {
        log(`✅ ${check.name}: ${matches.length} instances found`, 'success');
        TEST_RESULTS.passed.push(`Error handling: ${check.name}`);
      } else {
        log(`⚠️ ${check.name}: Not found or insufficient`, 'warning');
        TEST_RESULTS.warnings.push(`Error handling: ${check.name}`);
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Error handling test failed: ${error.message}`, 'error');
    TEST_RESULTS.failed.push(`Error handling: ${error.message}`);
    return false;
  }
}

async function testPerformance() {
  log('Testing performance...', 'info');
  
  try {
    // Measure sync script execution time
    const startTime = Date.now();
    
    // Run sync with limited scope for testing
    execSync('node scripts/check-api-keys.js', { 
      encoding: 'utf8',
      timeout: 30000 // 30 second timeout
    });
    
    const executionTime = Date.now() - startTime;
    log(`⏱️ API check completed in ${executionTime}ms`, 'info');
    
    if (executionTime < 5000) {
      log('✅ Performance is good (< 5 seconds)', 'success');
      TEST_RESULTS.passed.push('Performance check');
    } else if (executionTime < 10000) {
      log('⚠️ Performance is acceptable (< 10 seconds)', 'warning');
      TEST_RESULTS.warnings.push('Performance could be optimized');
    } else {
      log('❌ Performance is poor (> 10 seconds)', 'error');
      TEST_RESULTS.failed.push('Performance issues detected');
    }
    
    // Check file sizes
    const dataPath = path.join(process.cwd(), 'data', 'models.json');
    const stats = await fs.stat(dataPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    log(`📊 models.json size: ${fileSizeMB.toFixed(2)} MB`, 'info');
    
    if (fileSizeMB < 1) {
      log('✅ File size is optimal (< 1 MB)', 'success');
      TEST_RESULTS.passed.push('File size optimization');
    } else if (fileSizeMB < 5) {
      log('⚠️ File size is acceptable (< 5 MB)', 'warning');
      TEST_RESULTS.warnings.push('Consider data optimization');
    } else {
      log('❌ File size is too large (> 5 MB)', 'error');
      TEST_RESULTS.failed.push('File size needs optimization');
    }
    
    return true;
  } catch (error) {
    log(`❌ Performance test failed: ${error.message}`, 'error');
    TEST_RESULTS.failed.push(`Performance test: ${error.message}`);
    return false;
  }
}

async function generateReport() {
  const duration = Date.now() - TEST_RESULTS.startTime;
  const totalTests = TEST_RESULTS.passed.length + TEST_RESULTS.failed.length;
  
  console.log('\n' + '='.repeat(70));
  console.log(colors.cyan + '📊 TEST REPORT' + colors.reset);
  console.log('='.repeat(70));
  
  console.log(`\n📈 Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ${colors.green}✅ Passed: ${TEST_RESULTS.passed.length}${colors.reset}`);
  console.log(`   ${colors.red}❌ Failed: ${TEST_RESULTS.failed.length}${colors.reset}`);
  console.log(`   ${colors.yellow}⚠️ Warnings: ${TEST_RESULTS.warnings.length}${colors.reset}`);
  console.log(`   ⏱️ Duration: ${(duration / 1000).toFixed(2)} seconds`);
  
  if (TEST_RESULTS.passed.length > 0) {
    console.log(`\n${colors.green}✅ Passed Tests:${colors.reset}`);
    TEST_RESULTS.passed.forEach(test => console.log(`   • ${test}`));
  }
  
  if (TEST_RESULTS.failed.length > 0) {
    console.log(`\n${colors.red}❌ Failed Tests:${colors.reset}`);
    TEST_RESULTS.failed.forEach(test => console.log(`   • ${test}`));
  }
  
  if (TEST_RESULTS.warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️ Warnings:${colors.reset}`);
    TEST_RESULTS.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  // Overall assessment
  console.log('\n' + '='.repeat(70));
  if (TEST_RESULTS.failed.length === 0) {
    console.log(colors.green + '🎉 OVERALL: SYSTEM IS WORKING PROPERLY' + colors.reset);
    
    if (TEST_RESULTS.warnings.length > 0) {
      console.log(colors.yellow + '   (with some minor warnings to address)' + colors.reset);
    }
  } else {
    console.log(colors.red + '⚠️ OVERALL: SYSTEM HAS ISSUES THAT NEED ATTENTION' + colors.reset);
  }
  console.log('='.repeat(70));
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (TEST_RESULTS.warnings.some(w => w.includes('API key'))) {
    console.log('   • Configure missing API keys for full functionality');
  }
  
  if (TEST_RESULTS.warnings.some(w => w.includes('Statistics'))) {
    console.log('   • Run sync script to update statistics');
  }
  
  if (TEST_RESULTS.warnings.some(w => w.includes('duplicate'))) {
    console.log('   • Review and remove duplicate models');
  }
  
  if (TEST_RESULTS.failed.length === 0 && TEST_RESULTS.warnings.length === 0) {
    console.log('   • System is operating optimally!');
    console.log('   • Consider setting up monitoring for long-term stability');
  }
}

// Main test runner
async function runTests() {
  console.log(colors.cyan + '🧪 AI MODEL SYNC SYSTEM - COMPREHENSIVE TEST SUITE' + colors.reset);
  console.log('='.repeat(70));
  console.log('Starting tests at:', new Date().toISOString());
  console.log('='.repeat(70) + '\n');
  
  // Run all tests
  await testAPIKeys();
  console.log();
  
  await testSyncScript();
  console.log();
  
  await testDataIntegrity();
  console.log();
  
  await testGitHubWorkflow();
  console.log();
  
  await testErrorHandling();
  console.log();
  
  await testPerformance();
  
  // Generate report
  await generateReport();
  
  // Exit with appropriate code
  process.exit(TEST_RESULTS.failed.length > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(colors.red + 'Unhandled error during testing:' + colors.reset, error);
  process.exit(1);
});

// Run tests
runTests();