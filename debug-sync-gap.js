const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function debugSyncGap() {
  console.log('🔍 DEBUGGING SYNC GAP BETWEEN AA DATA AND DATABASE\n');

  // Load AA models data
  const aaModelsPath = './src/data/aa-models.json';
  if (!fs.existsSync(aaModelsPath)) {
    console.log('❌ AA models file not found');
    return;
  }

  const aaData = JSON.parse(fs.readFileSync(aaModelsPath, 'utf8'));
  const aaModels = aaData.models || [];

  // Get all database models
  const dbModels = await prisma.model.findMany({
    include: { provider: true }
  });

  console.log(`📊 DATA COMPARISON:`);
  console.log(`  - AA Models: ${aaModels.length}`);
  console.log(`  - DB Models: ${dbModels.length}`);
  console.log(`  - Gap: ${aaModels.length - dbModels.length}\n`);

  // Create lookup sets
  const dbModelNames = new Set(dbModels.map(m => m.name.toLowerCase().trim()));
  const dbModelSlugs = new Set(dbModels.map(m => m.slug.toLowerCase().trim()));

  // Test slug generation function (from sync service)
  function toSlug(name) {
    return name
      .toLowerCase()
      .replace(/[\s]+/g, '-')
      .replace(/[^a-z0-9.-]/g, '');
  }

  // Analyze missing models
  console.log('🔍 ANALYZING MISSING MODELS:\n');

  let nameMatches = 0;
  let slugConflicts = 0;
  let providerIssues = 0;
  let actuallyMissing = 0;

  const missingModels = [];
  const conflicts = [];

  aaModels.forEach(aaModel => {
    const nameLower = aaModel.name.toLowerCase().trim();
    const slug = toSlug(aaModel.name);

    // Check exact name match
    if (dbModelNames.has(nameLower)) {
      nameMatches++;
      return;
    }

    // Check if slug exists but with different name
    if (dbModelSlugs.has(slug)) {
      const conflictingModel = dbModels.find(m => m.slug.toLowerCase() === slug);
      slugConflicts++;
      conflicts.push({
        aaModel: aaModel.name,
        dbModel: conflictingModel.name,
        slug: slug
      });
      return;
    }

    // Actually missing
    actuallyMissing++;
    missingModels.push(aaModel);
  });

  console.log(`📈 ANALYSIS RESULTS:`);
  console.log(`  ✅ Name matches: ${nameMatches}`);
  console.log(`  ⚠️ Slug conflicts: ${slugConflicts}`);
  console.log(`  ❌ Actually missing: ${actuallyMissing}\n`);

  // Show slug conflicts
  if (conflicts.length > 0) {
    console.log('⚠️ SLUG CONFLICTS (first 10):\n');
    conflicts.slice(0, 10).forEach(conflict => {
      console.log(`  Slug: "${conflict.slug}"`);
      console.log(`    AA: "${conflict.aaModel}"`);
      console.log(`    DB: "${conflict.dbModel}"`);
      console.log('');
    });
  }

  // Show top missing models
  console.log('❌ TOP MISSING MODELS (first 20):\n');
  missingModels
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
    .slice(0, 20)
    .forEach(model => {
      console.log(`  Rank ${model.rank || 'N/A'}: ${model.name} (${model.provider})`);
      console.log(`    Slug would be: "${toSlug(model.name)}"`);
      console.log(`    Intelligence: ${model.intelligenceScore}`);
      console.log('');
    });

  // Check for sync issues
  console.log('🔍 SYNC ISSUES ANALYSIS:\n');

  // Check data source in database
  const dbBySource = {};
  dbModels.forEach(model => {
    const source = model.dataSource || 'unknown';
    dbBySource[source] = (dbBySource[source] || 0) + 1;
  });

  console.log('Database models by data source:');
  Object.entries(dbBySource).forEach(([source, count]) => {
    console.log(`  - ${source}: ${count} models`);
  });

  // Check last sync times
  const aaSourceModels = dbModels.filter(m => m.dataSource === 'artificial-analysis');
  if (aaSourceModels.length > 0) {
    const lastVerified = aaSourceModels
      .map(m => m.lastVerified)
      .filter(d => d)
      .sort()
      .pop();

    console.log(`\nLast AA sync: ${lastVerified || 'Unknown'}`);
    console.log(`AA models in DB: ${aaSourceModels.length}`);
  } else {
    console.log('\n❌ No models with dataSource = "artificial-analysis" found!');
  }

  // Check provider matching
  console.log('\n🏢 PROVIDER ANALYSIS:\n');

  const aaProviders = [...new Set(aaModels.map(m => m.provider))].sort();
  const dbProviders = [...new Set(dbModels.map(m => m.provider.name))].sort();

  console.log('AA Providers:', aaProviders.join(', '));
  console.log('DB Providers:', dbProviders.join(', '));

  const missingProviders = aaProviders.filter(p => !dbProviders.includes(p));
  if (missingProviders.length > 0) {
    console.log('Missing Providers:', missingProviders.join(', '));
  }

  await prisma.$disconnect();
}

debugSyncGap().catch(console.error);