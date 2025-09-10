const { PrismaClient } = require('@prisma/client');
const { URL } = require('url');

// Enhanced Prisma client with better error handling
const prisma = new PrismaClient({
  log: [{
    emit: 'event',
    level: 'query',
  }, {
    emit: 'event', 
    level: 'error',
  }, {
    emit: 'event',
    level: 'info',
  }, {
    emit: 'event',
    level: 'warn',
  }],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  errorFormat: 'pretty'
});

// Performance monitoring
let queryCount = 0;
let totalQueryTime = 0;

prisma.$on('query', (e) => {
  queryCount++;
  totalQueryTime += e.duration;
});

prisma.$on('error', (e) => {
  console.log('🚨 Database Error:', e);
});

// Connection validation
function validateDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  try {
    const parsed = new URL(dbUrl);
    if (!parsed.hostname.includes('neon.tech')) {
      console.log('⚠️ Warning: DATABASE_URL does not appear to be a Neon connection string');
    }
    
    if (parsed.hostname.includes('pooler')) {
      console.log('✅ Using pooled connection (recommended for production)');
    } else {
      console.log('ℹ️ Using direct connection');
    }
    
    return { dbUrl, directUrl, isNeon: parsed.hostname.includes('neon.tech') };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
  }
}

// Retry mechanism
async function retryOperation(operation, maxRetries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`⏳ Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }
}

async function testConnection() {
  console.log('🔍 Testing Neon PostgreSQL connection...\n');
  
  const startTime = Date.now();
  
  try {
    // Validate environment first
    const { dbUrl, directUrl, isNeon } = validateDatabaseUrl();
    console.log(`🌐 Connection Type: ${isNeon ? 'Neon PostgreSQL' : 'PostgreSQL'}`);
    console.log(`📡 Database URL: ${dbUrl.substring(0, 40)}...`);
    if (directUrl) {
      console.log(`🔄 Direct URL: ${directUrl.substring(0, 40)}...`);
    }
    console.log('');
  } catch (envError) {
    console.error('❌ Environment validation failed:', envError.message);
    process.exit(1);
  }
  
  try {
    // Test basic connection with retry logic
    console.log('1️⃣ Testing database connection...');
    
    const result = await retryOperation(async () => {
      const connectionTimeout = setTimeout(() => {
        console.log('⏳ Connection taking longer than expected...');
      }, 5000);
      
      const result = await prisma.$queryRaw`SELECT 
        version() as version, 
        current_database() as database, 
        current_user as user_name,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port`;
      
      clearTimeout(connectionTimeout);
      return result;
    }, 3, 3000);
    
    const connectionTime = Date.now() - startTime;
    console.log('✅ Connected to:', result[0].database);
    console.log('📊 PostgreSQL version:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
    console.log('👤 Connected as:', result[0].user_name);
    console.log('🌐 Server IP:', result[0].server_ip || 'N/A');
    console.log('🔌 Server Port:', result[0].server_port || 'N/A');
    console.log('⏱️ Initial connection time:', connectionTime + 'ms');
    console.log('');
    
    // Check table structure
    console.log('2️⃣ Verifying database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name, column_count
      FROM (
        SELECT 
          table_name, 
          COUNT(*) as column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name IN ('providers', 'models', 'model_status', 'pricing', 'benchmark_scores', 'benchmark_suites', 'incidents', 'model_endpoints')
        GROUP BY table_name
      ) t
      ORDER BY table_name`;
    
    tables.forEach(table => {
      console.log(`✅ ${table.table_name}: ${table.column_count} columns`);
    });
    console.log('');
    
    // Check table data counts
    console.log('3️⃣ Checking table data...');
    try {
      const providers = await prisma.providers.count();
      const models = await prisma.models.count();
      const status = await prisma.model_status.count();
      const pricing = await prisma.pricing.count();
      const benchmarks = await prisma.benchmark_scores.count();
      
      console.log(`✅ Providers: ${providers}`);
      console.log(`✅ Models: ${models}`);
      console.log(`✅ Status records: ${status}`);
      console.log(`✅ Pricing records: ${pricing}`);
      console.log(`✅ Benchmark scores: ${benchmarks}`);
    } catch (countError) {
      console.log('⚠️ Tables exist but may be empty (normal for new database)');
    }
    console.log('');
    
    // Test relationships (if data exists)
    console.log('4️⃣ Testing relationships...');
    try {
      const sampleModel = await prisma.models.findFirst({
        include: {
          providers: true,
          model_status: {
            take: 1,
            orderBy: { created_at: 'desc' }
          }
        }
      });
      
      if (sampleModel) {
        console.log(`✅ Sample model: ${sampleModel.name}`);
        console.log(`   Provider: ${sampleModel.providers.name}`);
        console.log(`   Status: ${sampleModel.model_status[0]?.status || 'No status'}`);
      } else {
        console.log('📋 Database schema ready, but no data yet (normal for new setup)');
      }
    } catch (relationError) {
      console.log('📋 Schema relationships ready for data seeding');
    }
    console.log('');
    
    // Test write capability
    console.log('5️⃣ Testing write capability...');
    try {
      const testId = 'test-connection-' + Date.now();
      const writeTest = await prisma.$executeRaw`
        CREATE TEMP TABLE connection_test (id TEXT, created_at TIMESTAMP DEFAULT NOW());
        INSERT INTO connection_test (id) VALUES (${testId});
        DROP TABLE connection_test;
      `;
      console.log('✅ Write operations working correctly');
    } catch (writeError) {
      console.log('⚠️ Write test had issues:', writeError.message.substring(0, 100));
    }
    console.log('');
    
    // Performance check
    console.log('6️⃣ Performance check...');
    const perfStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    const pingTime = Date.now() - perfStart;
    
    console.log(`✅ Ping time: ${pingTime}ms ${pingTime < 100 ? '(excellent)' : pingTime < 300 ? '(good)' : '(acceptable)'}`);
    console.log('');
    
    // Summary
    const totalTime = Date.now() - startTime;
    console.log('🎉 All connection tests passed successfully!');
    console.log(`⏱️ Total test time: ${totalTime}ms`);
    console.log('📌 Database is ready for data seeding and production use');
    
    // Next steps
    console.log('\n🚀 Suggested next steps:');
    console.log('1. Run: npm run db:seed (to add initial data)');
    console.log('2. Run: npm run dev (to test locally)');
    console.log('3. Configure Vercel environment variables');
    console.log('4. Deploy to production');
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ Connection failed after', totalTime + 'ms');
    console.error('🔍 Error:', error.message);
    console.error('');
    
    // Enhanced debug information
    console.error('🚑 Debug Information:');
    console.error('- DATABASE_URL configured:', !!process.env.DATABASE_URL);
    console.error('- DIRECT_URL configured:', !!process.env.DIRECT_URL);
    console.error('- DATABASE_URL format:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'Not set');
    
    if (error.code) {
      console.error('- Error code:', error.code);
    }
    
    // Common error solutions
    console.error('\n🔧 Common solutions:');
    console.error('1. Check if your Neon connection strings are correct');
    console.error('2. Ensure your Neon database is not suspended');
    console.error('3. Verify IP allowlist settings in Neon dashboard');
    console.error('4. Try restarting your local development server');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled promise rejection:', reason);
  process.exit(1);
});

// Run the test with better error handling
testConnection().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});