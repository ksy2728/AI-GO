#!/usr/bin/env node

/**
 * Initialize Model Status Data using direct SQL
 * Creates initial status records for all active models
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

async function initializeModelStatus() {
  let db;
  
  try {
    console.log('🚀 Initializing model status data...\n');
    
    // Open database connection
    db = new Database(dbPath);
    
    // Get all active models
    const activeModels = db.prepare(`
      SELECT id, name, provider_id 
      FROM models 
      WHERE is_active = 1
    `).all();
    
    console.log(`📊 Found ${activeModels.length} active models`);
    
    // Check existing status records from last 24 hours
    const existingStatuses = db.prepare(`
      SELECT DISTINCT model_id 
      FROM model_status 
      WHERE checked_at >= datetime('now', '-1 day')
    `).all();
    
    const existingModelIds = new Set(existingStatuses.map(s => s.model_id));
    const modelsNeedingStatus = activeModels.filter(model => !existingModelIds.has(model.id));
    
    console.log(`✅ ${existingModelIds.size} models already have recent status`);
    console.log(`🔄 ${modelsNeedingStatus.length} models need status initialization\n`);
    
    if (modelsNeedingStatus.length === 0) {
      console.log('🎉 All models already have recent status data!');
      return;
    }
    
    // Prepare insert statement
    const insertStatus = db.prepare(`
      INSERT OR REPLACE INTO model_status (
        model_id, status, availability, latency_p50, latency_p95, latency_p99,
        error_rate, requests_per_min, tokens_per_min, usage, region,
        checked_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    let insertedCount = 0;
    
    // Begin transaction for better performance
    const insertMany = db.transaction((models) => {
      for (const model of models) {
        // Add some realistic variation
        const availability = 99.9 - (Math.random() * 0.8); // 99.1% - 99.9%
        const latency_p50 = 150 + (Math.random() * 100 - 50); // 100-200ms
        const error_rate = Math.random() * 0.2; // 0% - 0.2%
        const requests_per_min = 1000 + Math.floor(Math.random() * 2000); // 1000-3000
        const tokens_per_min = 50000 + Math.floor(Math.random() * 30000); // 50K-80K
        
        const usage = JSON.stringify({
          daily_requests: Math.floor(Math.random() * 100000),
          daily_tokens: Math.floor(Math.random() * 5000000),
          peak_hour: Math.floor(Math.random() * 24)
        });
        
        insertStatus.run(
          model.id,
          'operational',
          Number(availability.toFixed(1)),
          Math.round(latency_p50),
          Math.round(latency_p50 * 2),
          Math.round(latency_p50 * 3.5),
          Number(error_rate.toFixed(3)),
          requests_per_min,
          tokens_per_min,
          usage,
          'us-east-1',
          now,
          now,
          now
        );
        
        insertedCount++;
        
        if (insertedCount % 10 === 0) {
          console.log(`  ✅ Created ${insertedCount}/${models.length} records`);
        }
      }
    });
    
    console.log('💾 Creating status records...');
    insertMany(modelsNeedingStatus);
    
    console.log(`\n🎯 Status initialization completed!`);
    console.log(`  📝 Created ${insertedCount} new status records`);
    
    // Verify the results
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'operational' THEN 1 END) as operational,
        AVG(availability) as avg_availability
      FROM model_status 
      WHERE checked_at >= datetime('now', '-1 day')
    `).get();
    
    console.log('\n📊 Summary:');
    console.log(`  Total models with status: ${stats.total}`);
    console.log(`  Operational models: ${stats.operational}`);
    console.log(`  Average availability: ${stats.avg_availability?.toFixed(1)}%`);
    console.log('\n✨ Models should now appear in the Status tab!');
    
  } catch (error) {
    console.error('❌ Error initializing model status:', error);
    throw error;
  } finally {
    if (db) {
      db.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  initializeModelStatus()
    .then(() => {
      console.log('🏁 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeModelStatus };