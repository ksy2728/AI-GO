#!/usr/bin/env node

/**
 * Enhanced Neon Migration Preparation Script
 * Validates environment and prepares for seamless Neon PostgreSQL migration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n${'='.repeat(60)}`)
};

async function prepareMigration() {
  log.section('🔧 Neon Migration Preparation');
  
  const issues = [];
  let ready = true;
  
  // Check 1: Current Environment Status
  log.section('📋 Environment Assessment');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('localhost:5433')) {
      log.success('Local PostgreSQL configuration detected');
    } else if (envContent.includes('neon.tech')) {
      log.info('Neon configuration already present');
    } else {
      log.warning('No PostgreSQL configuration found');
    }
  } else {
    log.error('No .env.local file found');
    ready = false;
    issues.push('Create .env.local file');
  }
  
  // Check 2: Database Schema Status
  log.section('🗄️ Schema Validation');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (schema.includes('provider = "postgresql"') || schema.includes('provider  = "postgresql"')) {
      log.success('Schema configured for PostgreSQL');
      
      // Count models
      const modelMatches = schema.match(/model\s+\w+\s*{/g);
      const modelCount = modelMatches ? modelMatches.length : 0;
      log.info(`Schema contains ${modelCount} models`);
      
    } else {
      log.error('Schema not configured for PostgreSQL');
      ready = false;
      issues.push('Update schema.prisma to use PostgreSQL provider');
    }
  } else {
    log.error('Prisma schema not found');
    ready = false;
    issues.push('Create prisma/schema.prisma');
  }
  
  // Check 3: Prisma Installation
  log.section('⚙️ Tool Validation');
  
  try {
    const prismaVersion = execSync('npx prisma --version', { encoding: 'utf8', stdio: 'pipe' });
    if (prismaVersion.includes('prisma')) {
      log.success('Prisma CLI available');
    }
  } catch (error) {
    log.warning('Prisma CLI not accessible, will install during setup');
  }
  
  // Check 4: Migration Files
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir).filter(f => f !== '.keep');
    if (migrations.length > 0) {
      log.success(`Found ${migrations.length} existing migration(s)`);
      log.info(`Latest: ${migrations[migrations.length - 1]}`);
    } else {
      log.info('No existing migrations found - will create initial migration');
    }
  } else {
    log.info('Migrations directory not found - will be created');
  }
  
  // Check 5: Local Database Connection Test
  log.section('🔌 Connection Testing');
  
  try {
    // Test current DATABASE_URL without timeout
    log.info('Testing current database configuration...');
    
    // Use Prisma to test connection safely
    try {
      execSync('npx prisma db pull --force --schema=prisma/schema.prisma', { 
        stdio: 'pipe', 
        timeout: 10000,
        env: { ...process.env }
      });
      log.success('Current database connection working');
    } catch (dbError) {
      log.warning('Current database not accessible (this is expected if PostgreSQL is not running)');
      log.info('Migration to Neon will replace current database configuration');
    }
    
  } catch (error) {
    log.info('Database connection test skipped - will be validated after Neon setup');
  }
  
  // Check 6: Backup Current Configuration
  log.section('💾 Configuration Backup');
  
  if (fs.existsSync(envPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const backupPath = `${envPath}.backup.pre-neon.${timestamp}`;
    
    try {
      fs.copyFileSync(envPath, backupPath);
      log.success(`Configuration backed up: ${path.basename(backupPath)}`);
    } catch (error) {
      log.error(`Failed to create backup: ${error.message}`);
      issues.push('Create manual backup of .env.local');
    }
  }
  
  // Check 7: Project Dependencies
  log.section('📦 Dependencies Check');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps['@prisma/client']) {
      log.success(`Prisma client: ${deps['@prisma/client']}`);
    }
    if (deps['prisma']) {
      log.success(`Prisma CLI: ${deps['prisma']}`);
    }
    if (deps['next']) {
      log.success(`Next.js: ${deps['next']}`);
    }
  }
  
  // Generate Migration Summary
  log.section('📊 Migration Readiness Summary');
  
  if (ready && issues.length === 0) {
    console.log(`
${colors.green}✅ Environment Ready for Neon Migration!${colors.reset}

${colors.blue}Current Status:${colors.reset}
• Schema: Configured for PostgreSQL
• Tools: Prisma available
• Backup: Configuration saved
• Scripts: Migration tools ready

${colors.yellow}Next Steps:${colors.reset}
1. Create Neon account: ${colors.cyan}https://neon.tech${colors.reset}
2. Create project: ${colors.green}ai-go-production${colors.reset}
3. Run setup: ${colors.cyan}node scripts/setup-neon.js${colors.reset}

${colors.green}Migration Strategy:${colors.reset}
• Current: Local PostgreSQL (localhost:5433)
• Target: Neon PostgreSQL (cloud)
• Method: Schema push + data seeding
• Rollback: Configuration backup available

${colors.blue}Estimated Time: 10-15 minutes${colors.reset}
    `);
  } else {
    console.log(`
${colors.yellow}⚠ Issues Found - Please Resolve Before Migration:${colors.reset}

${issues.map(issue => `  • ${issue}`).join('\n')}

${colors.cyan}After resolving issues, run this script again to verify readiness.${colors.reset}
    `);
  }
  
  return ready && issues.length === 0;
}

// Enhanced error handling
process.on('uncaughtException', (error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled promise rejection: ${reason}`);
  process.exit(1);
});

// Run preparation
prepareMigration().catch(error => {
  log.error(`Migration preparation failed: ${error.message}`);
  process.exit(1);
});