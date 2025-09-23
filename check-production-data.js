#!/usr/bin/env node
/**
 * Script to check current production data status
 * Helps identify test data before cleanup
 */

const https = require('https');

const PRODUCTION_URL = 'https://ai-server-information.vercel.app';

// Test data patterns to check
const TEST_PATTERNS = [
  'GPT-5',
  'gpt-oss',
  'Grok 3 mini',
  'test',
  'demo',
  'example',
  'simulation'
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${PRODUCTION_URL}${path}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function isTestData(modelName) {
  if (!modelName) return false;
  const lowerName = modelName.toLowerCase();
  return TEST_PATTERNS.some(pattern =>
    lowerName.includes(pattern.toLowerCase())
  );
}

async function checkModelsEndpoint() {
  console.log(`\n${colors.blue}📊 Checking /api/v1/models endpoint...${colors.reset}`);

  try {
    const data = await makeRequest('/api/v1/models?limit=20');

    if (!data.models || !Array.isArray(data.models)) {
      console.log(`${colors.yellow}⚠️  No models found in response${colors.reset}`);
      return { testModels: [], realModels: [], total: 0 };
    }

    const testModels = [];
    const realModels = [];

    data.models.forEach(model => {
      if (isTestData(model.name)) {
        testModels.push(model);
      } else {
        realModels.push(model);
      }
    });

    console.log(`\n  Total models found: ${colors.bold}${data.models.length}${colors.reset}`);

    if (testModels.length > 0) {
      console.log(`\n  ${colors.red}❌ Test data found (${testModels.length} models):${colors.reset}`);
      testModels.slice(0, 5).forEach(model => {
        const intel = model.intelligence || model.aa?.intelligence || 'N/A';
        console.log(`     - ${model.name} (Intelligence: ${intel})`);
      });
      if (testModels.length > 5) {
        console.log(`     ... and ${testModels.length - 5} more`);
      }
    } else {
      console.log(`  ${colors.green}✅ No test data found${colors.reset}`);
    }

    if (realModels.length > 0) {
      console.log(`\n  ${colors.green}✅ Real models found (${realModels.length} models):${colors.reset}`);
      realModels.slice(0, 5).forEach(model => {
        const intel = model.intelligence || model.aa?.intelligence || 'N/A';
        console.log(`     - ${model.name} (Intelligence: ${intel})`);
      });
      if (realModels.length > 5) {
        console.log(`     ... and ${realModels.length - 5} more`);
      }
    }

    return { testModels, realModels, total: data.models.length };
  } catch (error) {
    console.log(`  ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { testModels: [], realModels: [], total: 0 };
  }
}

async function checkHighlightsEndpoint() {
  console.log(`\n${colors.blue}🌟 Checking /api/v1/models/highlights endpoint...${colors.reset}`);

  try {
    const data = await makeRequest('/api/v1/models/highlights');

    if (!data || typeof data !== 'object') {
      console.log(`${colors.yellow}⚠️  Invalid response from highlights endpoint${colors.reset}`);
      return;
    }

    // Check metadata
    if (data.metadata) {
      console.log(`\n  Metadata:`);
      console.log(`    - Source: ${data.metadata.source || 'unknown'}`);
      console.log(`    - Model count: ${data.metadata.modelCount || 'unknown'}`);
      console.log(`    - Last updated: ${data.metadata.lastUpdated || 'unknown'}`);
    }

    // Check highlights
    const highlights = ['fastest', 'cheapest', 'smartest', 'balanced'];
    let testDataFound = false;

    highlights.forEach(category => {
      if (data[category]) {
        const model = data[category];
        if (isTestData(model.name)) {
          console.log(`  ${colors.red}❌ Test data in '${category}': ${model.name}${colors.reset}`);
          testDataFound = true;
        } else {
          console.log(`  ${colors.green}✅ Real data in '${category}': ${model.name}${colors.reset}`);
        }
      }
    });

    if (!testDataFound && data.metadata?.source !== 'database') {
      console.log(`\n  ${colors.yellow}⚠️  Note: Data source is '${data.metadata?.source}', not 'database'${colors.reset}`);
    }

  } catch (error) {
    console.log(`  ${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function checkNewsEndpoint() {
  console.log(`\n${colors.blue}📰 Checking /api/news endpoint...${colors.reset}`);

  try {
    const data = await makeRequest('/api/news?limit=5');

    if (data.error) {
      console.log(`  ${colors.yellow}⚠️  News endpoint error: ${data.error}${colors.reset}`);
      return;
    }

    if (data.news && Array.isArray(data.news)) {
      console.log(`  Found ${data.news.length} news items`);

      // Check if any news mentions test models
      let testMentions = 0;
      data.news.forEach(item => {
        const content = (item.title + ' ' + item.description).toLowerCase();
        if (TEST_PATTERNS.some(pattern => content.includes(pattern.toLowerCase()))) {
          testMentions++;
        }
      });

      if (testMentions > 0) {
        console.log(`  ${colors.yellow}⚠️  ${testMentions} news items mention test data${colors.reset}`);
      } else {
        console.log(`  ${colors.green}✅ No test data mentions in news${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`  ${colors.yellow}⚠️  Could not check news: ${error.message}${colors.reset}`);
  }
}

async function main() {
  console.log(`${colors.bold}============================================`);
  console.log(`   Production Data Status Check`);
  console.log(`============================================${colors.reset}`);
  console.log(`\nChecking: ${colors.blue}${PRODUCTION_URL}${colors.reset}`);
  console.log(`Time: ${new Date().toISOString()}`);

  // Check all endpoints
  const modelsResult = await checkModelsEndpoint();
  await checkHighlightsEndpoint();
  await checkNewsEndpoint();

  // Summary
  console.log(`\n${colors.bold}============================================`);
  console.log(`   Summary`);
  console.log(`============================================${colors.reset}`);

  const hasTestData = modelsResult.testModels.length > 0;
  const hasRealData = modelsResult.realModels.length > 0;

  if (hasTestData) {
    console.log(`\n${colors.red}⚠️  ACTION REQUIRED:${colors.reset}`);
    console.log(`   Test data detected in production (${modelsResult.testModels.length} test models)`);
    console.log(`   Run cleanup script to remove test data:`);
    console.log(`   ${colors.blue}node direct-cleanup.js${colors.reset}`);
    console.log(`   or`);
    console.log(`   ${colors.blue}cleanup-production-database.bat${colors.reset}`);
    console.log(`   or`);
    console.log(`   ${colors.blue}powershell -ExecutionPolicy Bypass -File cleanup-production-database.ps1${colors.reset}`);
  } else {
    console.log(`\n${colors.green}✅ Production data looks clean!${colors.reset}`);
    console.log(`   No test data detected`);
  }

  if (!hasRealData) {
    console.log(`\n${colors.yellow}⚠️  WARNING:${colors.reset}`);
    console.log(`   No real AI model data found`);
    console.log(`   You may need to sync data from Artificial Analysis`);
  } else {
    console.log(`\n${colors.green}✅ Real data present:${colors.reset}`);
    console.log(`   ${modelsResult.realModels.length} real AI models found`);
  }

  console.log(`\n${colors.blue}Next steps:${colors.reset}`);
  if (hasTestData) {
    console.log(`  1. Run the cleanup script`);
    console.log(`  2. Wait 2-3 minutes for caches to clear`);
    console.log(`  3. Run this check again to verify`);
  } else if (!hasRealData) {
    console.log(`  1. Sync data from Artificial Analysis`);
    console.log(`  2. Verify environment variables are set`);
    console.log(`  3. Check deployment logs for errors`);
  } else {
    console.log(`  ✅ Everything looks good!`);
    console.log(`  Visit: ${colors.blue}${PRODUCTION_URL}/models${colors.reset}`);
  }

  console.log('');
}

// Run the check
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});