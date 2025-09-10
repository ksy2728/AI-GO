#!/usr/bin/env node

/**
 * Neon Readiness Check
 * Verifies if the environment is ready for Neon PostgreSQL setup
 */

const fs = require('fs');
const path = require('path');

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
  section: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n${'='.repeat(50)}`)
};

function checkReadiness() {
  log.section('🔍 Neon PostgreSQL Readiness Check');
  
  let ready = true;
  const issues = [];
  
  // Check 1: Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  if (majorVersion >= 18) {
    log.success(`Node.js ${nodeVersion} - Compatible`);
  } else {
    log.error(`Node.js ${nodeVersion} - Requires v18 or higher`);
    ready = false;
    issues.push('Update Node.js to v18 or higher');
  }
  
  // Check 2: Required files exist
  const requiredFiles = [
    'prisma/schema.prisma',
    'package.json',
    '.env.local',
    'scripts/test-neon-connection.js',
    'scripts/migration-validation.js'
  ];
  
  log.section('📁 Required Files');
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log.success(`${file}`);
    } else {
      log.warning(`${file} - Missing (will be created)`);
    }
  });
  
  // Check 3: Prisma configuration
  log.section('🔧 Prisma Configuration');
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    if (schema.includes('provider  = "postgresql"') || schema.includes('provider = "postgresql"')) {
      log.success('Schema configured for PostgreSQL');
    } else {
      log.error('Schema not configured for PostgreSQL');
      ready = false;
      issues.push('Update schema.prisma to use PostgreSQL provider');
    }
  }
  
  // Check 4: Environment backup
  log.section('💾 Environment Backup');
  const envBackups = fs.readdirSync(process.cwd())
    .filter(file => file.startsWith('.env.local.backup'));
  
  if (envBackups.length > 0) {
    log.success(`Found ${envBackups.length} backup(s)`);
    log.info(`Latest: ${envBackups[envBackups.length - 1]}`);
  } else {
    log.warning('No backups found (will create one)');
  }
  
  // Check 5: Current database configuration
  log.section('🗄️ Current Configuration');
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    
    if (env.includes('DATABASE_URL=') && env.includes('localhost:5433')) {
      log.info('Currently using local PostgreSQL');
    } else if (env.includes('neon.tech')) {
      log.warning('Neon configuration already exists');
      log.info('You may want to verify or update it');
    } else {
      log.info('No PostgreSQL configuration found');
    }
  }
  
  // Check 6: Git status
  log.section('📦 Git Status');
  try {
    const { execSync } = require('child_process');
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const modifiedFiles = status.split('\n').filter(line => line.trim());
    
    if (modifiedFiles.length > 0) {
      log.warning(`${modifiedFiles.length} uncommitted changes`);
      log.info('Consider committing before major changes');
    } else {
      log.success('Working directory clean');
    }
  } catch (error) {
    log.warning('Git not available or not a repository');
  }
  
  // Summary
  log.section('📊 Readiness Summary');
  
  if (ready && issues.length === 0) {
    console.log(`
${colors.green}✅ Environment is ready for Neon setup!${colors.reset}

${colors.yellow}Next Steps:${colors.reset}
1. Go to ${colors.cyan}https://neon.tech${colors.reset} and create an account
2. Create a new project named: ${colors.green}ai-go-production${colors.reset}
3. Run: ${colors.cyan}node scripts/setup-neon.js${colors.reset}
4. Follow the interactive setup guide

${colors.blue}Quick Commands:${colors.reset}
• Automated setup: ${colors.cyan}node scripts/setup-neon.js${colors.reset}
• Manual guide: ${colors.cyan}Open NEON_SETUP_GUIDE.md${colors.reset}
• Test connection: ${colors.cyan}node scripts/test-neon-connection.js${colors.reset}
    `);
  } else {
    console.log(`
${colors.yellow}⚠ Some issues need attention:${colors.reset}
${issues.map(issue => `  • ${issue}`).join('\n')}

Please resolve these issues before proceeding with Neon setup.
    `);
  }
  
  return ready;
}

// Run the check
const isReady = checkReadiness();
process.exit(isReady ? 0 : 1);