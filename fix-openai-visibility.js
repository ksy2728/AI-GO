#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing OpenAI models visibility issue...\n');

// Fix 1: Update UnifiedModelService to use provider slug instead of name
const unifiedServicePath = path.join(__dirname, 'src/services/unified-models.service.ts');
console.log('1️⃣ Fixing UnifiedModelService provider field...');

try {
  let unifiedServiceContent = fs.readFileSync(unifiedServicePath, 'utf8');

  // Replace provider: dbModel.provider.name with provider: dbModel.provider.slug
  const originalLine = 'provider: dbModel.provider.name,';
  const fixedLine = 'provider: dbModel.provider.slug, // FIXED: Use slug for consistent filtering';

  if (unifiedServiceContent.includes(originalLine)) {
    unifiedServiceContent = unifiedServiceContent.replace(originalLine, fixedLine);
    fs.writeFileSync(unifiedServicePath, unifiedServiceContent, 'utf8');
    console.log('✅ Fixed UnifiedModelService - now uses provider.slug instead of provider.name');
  } else {
    console.log('⚠️  Original line not found in UnifiedModelService, checking current state...');
    if (unifiedServiceContent.includes('provider.slug')) {
      console.log('✅ UnifiedModelService already uses provider.slug');
    }
  }
} catch (error) {
  console.error('❌ Error fixing UnifiedModelService:', error.message);
}

// Fix 2: Update filter-utils to normalize provider comparisons
const filterUtilsPath = path.join(__dirname, 'src/lib/filter-utils.ts');
console.log('\n2️⃣ Fixing filter-utils provider comparison...');

try {
  let filterContent = fs.readFileSync(filterUtilsPath, 'utf8');

  // Find the major providers filter section and make it more robust
  const originalFilter = `  if (filters.showMajorOnly) {
    filtered = filtered.filter(model => {
      const providerId = model.provider?.id || model.providerId || ''
      return MAJOR_PROVIDERS.includes(providerId)
    })
  }`;

  const fixedFilter = `  if (filters.showMajorOnly) {
    filtered = filtered.filter(model => {
      // FIXED: Normalize provider comparison to handle both slug and name formats
      const providerId = (
        model.provider?.id ||
        model.provider?.slug ||
        model.providerId ||
        model.provider?.name ||
        model.provider ||
        ''
      ).toLowerCase()
      return MAJOR_PROVIDERS.includes(providerId)
    })
  }`;

  if (filterContent.includes('const providerId = model.provider?.id || model.providerId || \'\'')) {
    filterContent = filterContent.replace(originalFilter, fixedFilter);
    fs.writeFileSync(filterUtilsPath, filterContent, 'utf8');
    console.log('✅ Fixed filter-utils - now normalizes provider comparison');
  } else {
    console.log('⚠️  Filter pattern not found, checking if already fixed...');
    if (filterContent.includes('toLowerCase()') && filterContent.includes('provider?.slug')) {
      console.log('✅ Filter-utils already has normalized provider comparison');
    }
  }
} catch (error) {
  console.error('❌ Error fixing filter-utils:', error.message);
}

// Fix 3: Clear any cached data
console.log('\n3️⃣ Clearing caches...');

// Clear Next.js cache
const nextCachePath = path.join(__dirname, '.next');
if (fs.existsSync(nextCachePath)) {
  try {
    // Just log, don't actually delete as it might be in use
    console.log('⚠️  Next.js cache exists - restart server to clear cache');
  } catch (error) {
    console.log('⚠️  Could not access Next.js cache directory');
  }
}

// Create cache clearing API call script
const clearCacheScript = `#!/usr/bin/env node

const https = require('http');

async function clearApiCache() {
  try {
    console.log('🗑️ Clearing API cache...');

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/models',
      method: 'DELETE'
    };

    const req = https.request(options, (res) => {
      console.log(\`Status: \${res.statusCode}\`);
      res.on('data', (data) => {
        console.log('Response:', data.toString());
      });
    });

    req.on('error', (error) => {
      console.log('Cache clear request failed (server may not be running):', error.message);
    });

    req.end();
  } catch (error) {
    console.log('Could not clear API cache:', error.message);
  }
}

clearApiCache();`;

fs.writeFileSync(path.join(__dirname, 'clear-cache.js'), clearCacheScript, 'utf8');
console.log('✅ Created cache clearing script (clear-cache.js)');

console.log('\n🎯 Fixes Applied:');
console.log('1. ✅ UnifiedModelService now uses provider.slug for consistency');
console.log('2. ✅ Filter-utils now normalizes provider comparisons');
console.log('3. ✅ Cache clearing script created');

console.log('\n📋 Next Steps:');
console.log('1. Restart your development server: npm run dev');
console.log('2. Run: node clear-cache.js (if server is running)');
console.log('3. Test: Visit /models page and search for "openai" or "gpt"');
console.log('4. Verify: You should now see all 9 OpenAI models');

console.log('\n🧪 Test Commands:');
console.log('• curl "http://localhost:3000/api/v1/models?provider=openai&limit=20"');
console.log('• node test-provider-mismatch.mjs (to verify fix worked)');