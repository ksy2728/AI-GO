#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Rollback Script for Optimized Sync System
 * 
 * Usage:
 *   node scripts/rollback.js                    # Interactive rollback
 *   node scripts/rollback.js --auto            # Automatic rollback to latest backup
 *   node scripts/rollback.js --date 20250820   # Rollback to specific date
 *   node scripts/rollback.js --test            # Test mode (dry run)
 */

class RollbackManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.files = {
      workflow: {
        current: '.github/workflows/sync-data-optimized.yml',
        original: '.github/workflows/sync-data.yml',
        backup: null
      },
      syncModels: {
        current: 'scripts/sync-models.js',
        backup: null
      },
      exportJson: {
        current: 'scripts/export-to-json.js',
        backup: null
      },
      optimizedSync: {
        current: 'src/services/optimized-sync.service.js',
        backup: null
      },
      serverIntegration: {
        current: 'server.js',
        backup: null
      }
    };
    
    this.testMode = false;
  }

  /**
   * Find available backups
   */
  async findBackups() {
    try {
      const dirs = await fs.readdir(this.backupDir);
      const backupDirs = dirs.filter(dir => /^\d{8}_\d{6}$/.test(dir));
      
      if (backupDirs.length === 0) {
        console.log('❌ No backups found');
        return [];
      }
      
      // Sort by date (newest first)
      backupDirs.sort().reverse();
      
      console.log(`📦 Found ${backupDirs.length} backup(s):`);
      backupDirs.forEach((dir, index) => {
        console.log(`  ${index + 1}. ${dir}`);
      });
      
      return backupDirs;
    } catch (error) {
      console.error('❌ Error finding backups:', error.message);
      return [];
    }
  }

  /**
   * Perform rollback
   */
  async rollback(backupDir) {
    console.log(`\n🔄 Starting rollback from ${backupDir}...`);
    
    const backupPath = path.join(this.backupDir, backupDir);
    let rolledBack = [];
    let failed = [];
    
    // Check if backup directory exists
    try {
      await fs.access(backupPath);
    } catch {
      console.error(`❌ Backup directory not found: ${backupPath}`);
      return false;
    }
    
    // Rollback each file
    for (const [key, file] of Object.entries(this.files)) {
      if (!file.current) continue;
      
      try {
        // Find backup file
        const backupFiles = await fs.readdir(backupPath);
        const backupFile = backupFiles.find(f => 
          f.includes(path.basename(file.current).split('.')[0])
        );
        
        if (backupFile) {
          const source = path.join(backupPath, backupFile);
          const target = file.original || file.current;
          
          if (this.testMode) {
            console.log(`  [TEST] Would copy: ${source} → ${target}`);
            rolledBack.push(key);
          } else {
            // Create backup of current file
            const currentBackup = `${target}.before-rollback`;
            try {
              await fs.copyFile(target, currentBackup);
              console.log(`  📋 Backed up current: ${currentBackup}`);
            } catch (e) {
              console.log(`  ℹ️ Current file doesn't exist: ${target}`);
            }
            
            // Copy backup to target
            await fs.copyFile(source, target);
            console.log(`  ✅ Rolled back: ${target}`);
            rolledBack.push(key);
          }
        } else {
          console.log(`  ⚠️ No backup found for: ${key}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to rollback ${key}:`, error.message);
        failed.push(key);
      }
    }
    
    // Remove optimized files if they exist
    if (!this.testMode) {
      try {
        await fs.unlink('.github/workflows/sync-data-optimized.yml');
        console.log('  🗑️ Removed optimized workflow');
      } catch {
        // File might not exist
      }
      
      try {
        await fs.unlink('src/services/optimized-sync.service.js');
        console.log('  🗑️ Removed optimized sync service');
      } catch {
        // File might not exist
      }
    }
    
    console.log('\n📊 Rollback Summary:');
    console.log(`  ✅ Rolled back: ${rolledBack.length} file(s)`);
    if (failed.length > 0) {
      console.log(`  ❌ Failed: ${failed.length} file(s)`);
    }
    
    if (!this.testMode && rolledBack.length > 0) {
      console.log('\n⚠️ Important: You may need to:');
      console.log('  1. Restart the server: npm run dev');
      console.log('  2. Push changes to GitHub: git add . && git commit -m "rollback: revert to previous sync implementation"');
      console.log('  3. Manually trigger GitHub Actions to verify');
    }
    
    return rolledBack.length > 0;
  }

  /**
   * Create safety check
   */
  async safetyCheck() {
    console.log('\n🔍 Performing safety check...');
    
    const checks = {
      serverRunning: false,
      gitClean: false,
      backupsAvailable: false
    };
    
    // Check if server is running
    try {
      execSync('netstat -an | grep :3000', { stdio: 'pipe' });
      checks.serverRunning = true;
      console.log('  ⚠️ Server is running on port 3000');
    } catch {
      console.log('  ✅ Server is not running');
    }
    
    // Check git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (gitStatus.trim() === '') {
        checks.gitClean = true;
        console.log('  ✅ Git working directory is clean');
      } else {
        console.log('  ⚠️ Git has uncommitted changes');
      }
    } catch {
      console.log('  ⚠️ Could not check git status');
    }
    
    // Check backups
    const backups = await this.findBackups();
    checks.backupsAvailable = backups.length > 0;
    
    return checks;
  }

  /**
   * Interactive rollback
   */
  async interactive() {
    console.log('🔄 Rollback Manager - Interactive Mode\n');
    
    const checks = await this.safetyCheck();
    
    if (checks.serverRunning) {
      console.log('\n⚠️ Warning: Server is running. It\'s recommended to stop it first.');
      console.log('Press Ctrl+C to abort, or wait 5 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const backups = await this.findBackups();
    if (backups.length === 0) {
      console.log('❌ No backups available for rollback');
      return;
    }
    
    // Use readline for user input
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('\nSelect backup number (or 0 to cancel): ', async (answer) => {
        const choice = parseInt(answer);
        
        if (choice === 0) {
          console.log('❌ Rollback cancelled');
        } else if (choice > 0 && choice <= backups.length) {
          const selectedBackup = backups[choice - 1];
          
          rl.question(`\nConfirm rollback to ${selectedBackup}? (yes/no): `, async (confirm) => {
            if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
              await this.rollback(selectedBackup);
            } else {
              console.log('❌ Rollback cancelled');
            }
            rl.close();
            resolve();
          });
          return;
        } else {
          console.log('❌ Invalid selection');
        }
        
        rl.close();
        resolve();
      });
    });
  }

  /**
   * Automatic rollback to latest backup
   */
  async automatic() {
    console.log('🔄 Automatic Rollback to Latest Backup\n');
    
    const backups = await this.findBackups();
    if (backups.length === 0) {
      console.log('❌ No backups available for rollback');
      return false;
    }
    
    const latest = backups[0];
    console.log(`📦 Rolling back to: ${latest}`);
    
    return await this.rollback(latest);
  }

  /**
   * Create current state backup
   */
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(this.backupDir, timestamp.replace(/[-T]/g, '').replace(':', ''));
    
    console.log(`📦 Creating backup in: ${backupDir}`);
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      // Backup current files
      const filesToBackup = [
        '.github/workflows/sync-data.yml',
        '.github/workflows/sync-data-optimized.yml',
        'scripts/sync-models.js',
        'scripts/export-to-json.js',
        'src/services/optimized-sync.service.js',
        'server.js'
      ];
      
      for (const file of filesToBackup) {
        try {
          const source = path.join(process.cwd(), file);
          const dest = path.join(backupDir, path.basename(file) + '.backup');
          await fs.copyFile(source, dest);
          console.log(`  ✅ Backed up: ${file}`);
        } catch (error) {
          console.log(`  ⚠️ Skipped (not found): ${file}`);
        }
      }
      
      console.log('✅ Backup created successfully');
      return backupDir;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      return null;
    }
  }

  /**
   * Run the rollback manager
   */
  async run(args) {
    const flags = {
      auto: args.includes('--auto'),
      test: args.includes('--test'),
      backup: args.includes('--backup'),
      date: args.find(arg => arg.startsWith('--date='))?.split('=')[1]
    };
    
    if (flags.test) {
      this.testMode = true;
      console.log('🧪 TEST MODE - No changes will be made\n');
    }
    
    if (flags.backup) {
      await this.createBackup();
      return;
    }
    
    if (flags.auto) {
      await this.automatic();
    } else if (flags.date) {
      const backups = await this.findBackups();
      const targetBackup = backups.find(b => b.includes(flags.date));
      
      if (targetBackup) {
        await this.rollback(targetBackup);
      } else {
        console.log(`❌ No backup found for date: ${flags.date}`);
      }
    } else {
      await this.interactive();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new RollbackManager();
  manager.run(process.argv.slice(2))
    .then(() => {
      console.log('\n✅ Rollback process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Rollback failed:', error);
      process.exit(1);
    });
}

module.exports = { RollbackManager };