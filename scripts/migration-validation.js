/**
 * PostgreSQL Migration Validation Script
 * Comprehensive validation for Neon PostgreSQL migration
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test categories
const tests = {
  connection: [],
  schema: [],
  data: [],
  performance: [],
  api: []
};

// Helper functions
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.blue}▶ ${msg}${colors.reset}`)
};

// Test runner
async function runTest(category, name, testFn) {
  try {
    const start = Date.now();
    await testFn();
    const duration = Date.now() - start;
    tests[category].push({ name, status: 'pass', duration });
    log.success(`${name} (${duration}ms)`);
    return true;
  } catch (error) {
    tests[category].push({ name, status: 'fail', error: error.message });
    log.error(`${name}: ${error.message}`);
    return false;
  }
}

// CONNECTION TESTS
async function testConnections() {
  log.section('CONNECTION TESTS');
  
  await runTest('connection', 'Database connection', async () => {
    await prisma.$connect();
  });
  
  await runTest('connection', 'Query execution', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    if (result[0].test !== 1) throw new Error('Query failed');
  });
  
  await runTest('connection', 'Database version check', async () => {
    const result = await prisma.$queryRaw`SELECT version()`;
    const version = result[0].version;
    if (!version.includes('PostgreSQL')) throw new Error('Not PostgreSQL');
    log.info(`  Database: ${version.split(',')[0]}`);
  });
  
  await runTest('connection', 'Connection pool test', async () => {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(prisma.$queryRaw`SELECT pg_sleep(0.1)`);
    }
    await Promise.all(promises);
  });
}

// SCHEMA TESTS
async function testSchema() {
  log.section('SCHEMA VALIDATION');
  
  await runTest('schema', 'Tables exist', async () => {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const expectedTables = [
      'providers', 'models', 'model_status', 'model_endpoints',
      'pricing', 'benchmark_suites', 'benchmark_scores', 'incidents'
    ];
    
    const tableNames = tables.map(t => t.table_name);
    for (const expected of expectedTables) {
      if (!tableNames.includes(expected)) {
        throw new Error(`Missing table: ${expected}`);
      }
    }
    log.info(`  Found ${tableNames.length} tables`);
  });
  
  await runTest('schema', 'Indexes created', async () => {
    const indexes = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    
    if (indexes[0].count < 10) {
      throw new Error('Missing indexes');
    }
    log.info(`  Found ${indexes[0].count} indexes`);
  });
  
  await runTest('schema', 'Foreign keys configured', async () => {
    const fks = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
    `;
    
    if (fks[0].count < 5) {
      throw new Error('Missing foreign keys');
    }
    log.info(`  Found ${fks[0].count} foreign keys`);
  });
}

// DATA TESTS
async function testData() {
  log.section('DATA VALIDATION');
  
  await runTest('data', 'Providers populated', async () => {
    const count = await prisma.provider.count();
    if (count < 5) throw new Error(`Only ${count} providers found`);
    log.info(`  ${count} providers`);
  });
  
  await runTest('data', 'Models populated', async () => {
    const count = await prisma.model.count();
    if (count < 30) throw new Error(`Only ${count} models found`);
    log.info(`  ${count} models`);
  });
  
  await runTest('data', 'Model status initialized', async () => {
    const count = await prisma.modelStatus.count();
    if (count < 30) throw new Error(`Only ${count} status records found`);
    log.info(`  ${count} status records`);
  });
  
  await runTest('data', 'Relationships working', async () => {
    const model = await prisma.model.findFirst({
      include: {
        provider: true,
        status: { take: 1 }
      }
    });
    
    if (!model) throw new Error('No models found');
    if (!model.provider) throw new Error('Provider relationship broken');
    log.info(`  Sample: ${model.name} by ${model.provider.name}`);
  });
  
  await runTest('data', 'Data integrity check', async () => {
    // Check for orphaned records
    const orphanedStatus = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM model_status ms
      LEFT JOIN models m ON ms.model_id = m.id
      WHERE m.id IS NULL
    `;
    
    if (orphanedStatus[0].count > 0) {
      throw new Error(`Found ${orphanedStatus[0].count} orphaned status records`);
    }
  });
}

// PERFORMANCE TESTS
async function testPerformance() {
  log.section('PERFORMANCE TESTS');
  
  await runTest('performance', 'Simple query performance', async () => {
    const iterations = 10;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await prisma.model.findMany({ take: 10 });
      times.push(Date.now() - start);
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    if (avg > 100) throw new Error(`Slow query: ${avg.toFixed(2)}ms average`);
    log.info(`  Average: ${avg.toFixed(2)}ms`);
  });
  
  await runTest('performance', 'Complex query performance', async () => {
    const start = Date.now();
    await prisma.model.findMany({
      include: {
        provider: true,
        status: { take: 1 },
        pricing: { take: 1 }
      },
      take: 20
    });
    const duration = Date.now() - start;
    
    if (duration > 500) throw new Error(`Slow complex query: ${duration}ms`);
    log.info(`  Duration: ${duration}ms`);
  });
  
  await runTest('performance', 'Concurrent query handling', async () => {
    const start = Date.now();
    const promises = [];
    
    for (let i = 0; i < 20; i++) {
      promises.push(prisma.model.count());
    }
    
    await Promise.all(promises);
    const duration = Date.now() - start;
    
    if (duration > 1000) throw new Error(`Slow concurrent queries: ${duration}ms`);
    log.info(`  20 concurrent queries: ${duration}ms`);
  });
}

// API TESTS (if production URL provided)
async function testAPIs() {
  const API_URL = process.env.API_URL || 'https://ai-server-information.vercel.app';
  
  log.section('API ENDPOINT TESTS');
  
  await runTest('api', 'Status endpoint', async () => {
    const response = await fetch(`${API_URL}/api/v1/status`);
    const data = await response.json();
    
    if (data.dataSource !== 'database') {
      throw new Error(`Wrong data source: ${data.dataSource}`);
    }
    log.info(`  Data source: ${data.dataSource}`);
  });
  
  await runTest('api', 'Models endpoint', async () => {
    const response = await fetch(`${API_URL}/api/v1/models`);
    const data = await response.json();
    
    if (!data.models || data.models.length < 30) {
      throw new Error(`Only ${data.models?.length || 0} models returned`);
    }
    log.info(`  ${data.models.length} models returned`);
  });
  
  await runTest('api', 'Response time check', async () => {
    const endpoints = ['/api/v1/status', '/api/v1/models', '/api/v1/providers'];
    const times = [];
    
    for (const endpoint of endpoints) {
      const start = Date.now();
      await fetch(`${API_URL}${endpoint}`);
      const duration = Date.now() - start;
      times.push(duration);
      
      if (duration > 1000) {
        throw new Error(`${endpoint} took ${duration}ms`);
      }
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    log.info(`  Average API response: ${avg.toFixed(0)}ms`);
  });
}

// Generate report
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}VALIDATION REPORT${colors.reset}`);
  console.log('='.repeat(60));
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const [category, results] of Object.entries(tests)) {
    if (results.length === 0) continue;
    
    console.log(`\n${colors.bright}${category.toUpperCase()}${colors.reset}`);
    console.log('-'.repeat(30));
    
    for (const test of results) {
      totalTests++;
      if (test.status === 'pass') {
        passedTests++;
        console.log(`  ${colors.green}✓${colors.reset} ${test.name} (${test.duration}ms)`);
      } else {
        failedTests++;
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
        console.log(`    ${colors.yellow}→ ${test.error}${colors.reset}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}SUMMARY${colors.reset}`);
  console.log('-'.repeat(30));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  // Exit code based on results
  if (failedTests > 0) {
    console.log(`\n${colors.red}${colors.bright}⚠ VALIDATION FAILED${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bright}✅ ALL VALIDATIONS PASSED${colors.reset}`);
    process.exit(0);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.blue}PostgreSQL Migration Validation${colors.reset}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  try {
    // Run all test suites
    await testConnections();
    await testSchema();
    await testData();
    await testPerformance();
    
    // Run API tests if in production
    if (process.env.API_URL || process.env.NODE_ENV === 'production') {
      await testAPIs();
    }
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
    generateReport();
  }
}

// Run validation
main().catch(console.error);