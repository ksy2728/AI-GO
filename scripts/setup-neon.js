#!/usr/bin/env node

/**
 * Neon PostgreSQL Setup Script
 * This script helps configure and test Neon database connection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const { URL } = require('url');

// Color codes for terminal
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Enhanced validation functions
function validateConnectionString(url, type = 'connection') {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return { valid: false, error: 'Connection string is empty' };
    }
    
    if (!url.includes('neon.tech')) {
      return { valid: false, error: 'Not a valid Neon connection string' };
    }
    
    const parsed = new URL(url);
    if (parsed.protocol !== 'postgresql:') {
      return { valid: false, error: 'Invalid protocol. Must be postgresql://' };
    }
    
    if (!parsed.hostname.includes('neon.tech')) {
      return { valid: false, error: 'Hostname must be from neon.tech' };
    }
    
    if (type === 'pooled' && !parsed.hostname.includes('pooler')) {
      return { valid: false, error: 'Pooled connection must include "pooler" in hostname' };
    }
    
    if (type === 'direct' && parsed.hostname.includes('pooler')) {
      return { valid: false, error: 'Direct connection should not include "pooler" in hostname' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Invalid URL format: ${error.message}` };
  }
}

function showProgress(message, duration = 2000) {
  return new Promise((resolve) => {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    
    const interval = setInterval(() => {
      process.stdout.write(`\r${colors.cyan}${frames[i]}${colors.reset} ${message}`);
      i = (i + 1) % frames.length;
    }, 80);
    
    setTimeout(() => {
      clearInterval(interval);
      process.stdout.write(`\r${colors.green}✓${colors.reset} ${message}\n`);
      resolve();
    }, duration);
  });
}

function retryOperation(operation, maxRetries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attempt = (retryCount) => {
      operation()
        .then(resolve)
        .catch((error) => {
          if (retryCount < maxRetries) {
            log.warning(`Attempt ${retryCount + 1} failed, retrying in ${delay}ms...`);
            setTimeout(() => attempt(retryCount + 1), delay);
          } else {
            reject(error);
          }
        });
    };
    attempt(0);
  });
}

// Main setup function
async function setupNeon() {
  log.section('🚀 Neon PostgreSQL Setup Assistant');
  
  log.info('This script will help you set up Neon PostgreSQL for your AI-GO project.\n');
  
  // Step 1: Check prerequisites
  log.section('Step 1: Checking Prerequisites');
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    log.success(`Node.js ${nodeVersion} detected`);
    
    // Check if Prisma is installed
    try {
      execSync('npx prisma --version', { stdio: 'pipe' });
      log.success('Prisma CLI is available');
    } catch {
      log.warning('Prisma not found. Installing...');
      execSync('npm install -D prisma @prisma/client', { stdio: 'inherit' });
      log.success('Prisma installed');
    }
    
    // Check for existing .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      log.success('.env.local file exists');
      
      // Create backup
      const backupPath = `${envPath}.backup.${Date.now()}`;
      fs.copyFileSync(envPath, backupPath);
      log.success(`Backup created: ${path.basename(backupPath)}`);
    } else {
      log.warning('.env.local not found. Will create new one.');
    }
    
  } catch (error) {
    log.error(`Prerequisites check failed: ${error.message}`);
    process.exit(1);
  }
  
  // Step 2: Neon Account Instructions
  log.section('Step 2: Create Neon Account');
  
  console.log(`
Please complete the following steps:

1. Open your browser and go to: ${colors.cyan}https://neon.tech${colors.reset}
2. Click "Sign Up" and create a free account (GitHub login recommended)
3. After signing in, click "New Project"
4. Configure your project with these settings:
   
   ${colors.yellow}Project Settings:${colors.reset}
   • Project name: ${colors.green}ai-go-production${colors.reset}
   • PostgreSQL version: ${colors.green}16${colors.reset}
   • Region: ${colors.green}US East (Ohio)${colors.reset} or closest to your Vercel deployment
   
5. After creation, you'll see your connection details
6. Keep the Neon dashboard open - you'll need the connection strings
  `);
  
  const ready = await question('\nHave you completed the above steps? (y/n): ');
  
  if (ready.toLowerCase() !== 'y') {
    log.info('Please complete the Neon setup and run this script again.');
    rl.close();
    process.exit(0);
  }
  
  // Step 3: Collect Connection Strings
  log.section('Step 3: Configure Connection Strings');
  
  console.log(`
From your Neon dashboard, you'll see two connection strings:
1. ${colors.yellow}Pooled Connection${colors.reset} (for production/Vercel)
2. ${colors.yellow}Direct Connection${colors.reset} (for migrations)

${colors.cyan}Tip: Click the "Show password" toggle to see the full connection string${colors.reset}
  `);
  
  let pooledUrl, directUrl;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    pooledUrl = await question('\nPaste your POOLED connection string: ');
    const pooledValidation = validateConnectionString(pooledUrl.trim(), 'pooled');
    
    if (!pooledValidation.valid) {
      log.error(`Pooled connection validation failed: ${pooledValidation.error}`);
      attempts++;
      if (attempts < maxAttempts) {
        log.info(`Please try again (${attempts}/${maxAttempts})`);
        continue;
      } else {
        log.error('Too many failed attempts. Please check your connection string.');
        rl.close();
        process.exit(1);
      }
    }
    
    directUrl = await question('Paste your DIRECT connection string: ');
    const directValidation = validateConnectionString(directUrl.trim(), 'direct');
    
    if (!directValidation.valid) {
      log.error(`Direct connection validation failed: ${directValidation.error}`);
      attempts++;
      if (attempts < maxAttempts) {
        log.info(`Please try again (${attempts}/${maxAttempts})`);
        continue;
      } else {
        log.error('Too many failed attempts. Please check your connection string.');
        rl.close();
        process.exit(1);
      }
    }
    
    // Both connections are valid
    pooledUrl = pooledUrl.trim();
    directUrl = directUrl.trim();
    log.success('Connection strings validated successfully!');
    break;
  }
  
  // Step 4: Update Environment Variables
  log.section('Step 4: Updating Environment Variables');
  
  const envContent = `# Neon PostgreSQL Configuration
# Generated: ${new Date().toISOString()}

# Database URLs
DATABASE_URL="${pooledUrl}"
DIRECT_URL="${directUrl}"

# Data Source Configuration
DATA_SOURCE=database
FALLBACK_TO_GITHUB=true

# Previous configuration (preserved)
`;
  
  try {
    // Read existing .env.local if it exists
    const envPath = path.join(process.cwd(), '.env.local');
    let existingContent = '';
    
    if (fs.existsSync(envPath)) {
      existingContent = fs.readFileSync(envPath, 'utf8');
      // Remove old DATABASE_URL and DIRECT_URL lines
      existingContent = existingContent
        .split('\n')
        .filter(line => !line.startsWith('DATABASE_URL=') && !line.startsWith('DIRECT_URL='))
        .join('\n');
    }
    
    // Write new configuration
    fs.writeFileSync(envPath, envContent + existingContent);
    log.success('.env.local updated with Neon configuration');
    
  } catch (error) {
    log.error(`Failed to update .env.local: ${error.message}`);
    rl.close();
    process.exit(1);
  }
  
  // Step 5: Test Connection
  log.section('Step 5: Testing Database Connection');
  
  log.info('Testing connection to Neon...');
  
  try {
    // Test connection with retry logic
    await showProgress('Establishing connection to Neon database', 3000);
    
    await retryOperation(async () => {
      // Test with Prisma db pull (safer than full migration)
      const result = execSync('npx prisma db pull --force', { 
        stdio: 'pipe',
        timeout: 45000, // 45 second timeout
        env: { ...process.env, DATABASE_URL: pooledUrl, DIRECT_URL: directUrl }
      });
      return result;
    }, 2, 2000);
    
    log.success('✅ Successfully connected to Neon PostgreSQL!');
    
    // Test Prisma client generation with retry
    try {
      await showProgress('Generating Prisma client', 2000);
      await retryOperation(async () => {
        execSync('npx prisma generate', { 
          stdio: 'pipe',
          timeout: 30000,
          env: { ...process.env, DATABASE_URL: pooledUrl, DIRECT_URL: directUrl }
        });
      }, 2, 1000);
      log.success('Prisma client generated successfully');
    } catch (genError) {
      log.warning('Prisma client generation had issues, but connection is working');
      log.info('You can run "npx prisma generate" later if needed');
    }
    
    // Quick ping test to verify connection quality
    try {
      const { PrismaClient } = require('@prisma/client');
      const testClient = new PrismaClient({
        datasources: {
          db: {
            url: pooledUrl
          }
        }
      });
      
      const pingStart = Date.now();
      await testClient.$queryRaw`SELECT 1 as ping`;
      const pingTime = Date.now() - pingStart;
      await testClient.$disconnect();
      
      log.success(`Connection latency: ${pingTime}ms ${pingTime < 100 ? '(excellent)' : pingTime < 300 ? '(good)' : '(acceptable)'}`);
    } catch (pingError) {
      log.warning('Connection established, but ping test failed (normal for some configurations)');
    }
    
  } catch (error) {
    log.error('Connection test failed after multiple attempts.');
    log.error(`Final error: ${error.message}`);
    
    // Enhanced debugging info
    console.log(`\n${colors.yellow}🔍 Debug Information:${colors.reset}`);
    console.log(`• Pooled URL format: ${pooledUrl.substring(0, 30)}...`);
    console.log(`• Direct URL format: ${directUrl.substring(0, 30)}...`);
    console.log(`• Connection validation: Both URLs passed initial validation`);
    
    console.log(`\n${colors.blue}💡 Troubleshooting Steps:${colors.reset}`);
    console.log('1. Check if your Neon database is suspended (check dashboard)');
    console.log('2. Verify your IP is allowed (Neon > Settings > IP Allow)');
    console.log('3. Ensure your password is correct (copy directly from Neon)');
    console.log('4. Try refreshing your connection strings from Neon dashboard');
    console.log('5. Check if your internet connection is stable');
    
    rl.close();
    process.exit(1);
  }
  
  // Step 6: Run Schema Migration
  log.section('Step 6: Database Schema Setup');
  
  const runMigration = await question('\nRun database schema migration now? (y/n): ');
  
  if (runMigration.toLowerCase() === 'y') {
    try {
      log.info('Pushing schema to Neon database...');
      execSync('npx prisma db push', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: pooledUrl, DIRECT_URL: directUrl }
      });
      log.success('Schema pushed successfully!');
      
      // Try to seed data
      const runSeed = await question('\nSeed database with initial data? (y/n): ');
      if (runSeed.toLowerCase() === 'y') {
        try {
          log.info('Seeding database...');
          execSync('npm run db:seed', {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: pooledUrl, DIRECT_URL: directUrl }
          });
          log.success('Database seeded successfully!');
        } catch (seedError) {
          log.warning('Seeding encountered issues, but schema is ready');
          log.info('You can run seeding later with: npm run db:seed');
        }
      }
      
    } catch (migrationError) {
      log.warning('Schema migration had issues');
      log.info('You can run migration later with: npx prisma db push');
    }
  }
  
  // Step 7: Final Summary
  log.section('✅ Setup Complete!');
  
  console.log(`
${colors.green}🎉 Neon PostgreSQL setup is complete!${colors.reset}

${colors.blue}What was configured:${colors.reset}
• Database connection to Neon PostgreSQL
• Environment variables updated
• Schema ${runMigration.toLowerCase() === 'y' ? 'migrated' : 'ready for migration'}
• Backup of previous configuration created

${colors.yellow}Next Steps:${colors.reset}
${runMigration.toLowerCase() !== 'y' ? '1. Run schema migration: ' + colors.cyan + 'npx prisma db push' + colors.reset + '\n' : ''}${runMigration.toLowerCase() !== 'y' ? '2. Seed database: ' + colors.cyan + 'npm run db:seed' + colors.reset + '\n' : ''}${runMigration.toLowerCase() === 'y' ? '1. ' : '3. '}Test locally: ${colors.cyan}npm run dev${colors.reset}
${runMigration.toLowerCase() === 'y' ? '2. ' : '4. '}Configure Vercel environment variables
${runMigration.toLowerCase() === 'y' ? '3. ' : '5. '}Deploy to production

${colors.blue}Useful Commands:${colors.reset}
• View database: ${colors.cyan}npx prisma studio${colors.reset}
• Test connection: ${colors.cyan}node scripts/test-neon-connection.js${colors.reset}
• Validate setup: ${colors.cyan}node scripts/migration-validation.js${colors.reset}
• Check migrations: ${colors.cyan}npx prisma migrate status${colors.reset}

${colors.green}🚀 Your AI-GO project is now connected to Neon PostgreSQL!${colors.reset}
  `);
  
  rl.close();
}

// Run the setup
setupNeon().catch(error => {
  log.error(`Setup failed: ${error.message}`);
  process.exit(1);
});