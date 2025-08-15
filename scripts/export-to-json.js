/**
 * Export database data to JSON files for GitHub storage
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('📦 Exporting data from database to JSON...');

    // 1. Export Models with all relations
    const models = await prisma.model.findMany({
      include: {
        provider: true,
        status: {
          orderBy: { checkedAt: 'desc' },
          take: 1
        },
        pricing: {
          where: { effectiveTo: null }
        },
        benchmarkScores: {
          include: {
            suite: true
          }
        }
      }
    });

    // 2. Export Providers
    const providers = await prisma.provider.findMany();

    // 3. Export Benchmark Suites
    const benchmarkSuites = await prisma.benchmarkSuite.findMany();

    // 4. Transform data for JSON storage
    const transformedModels = models.map(model => ({
      id: model.id,
      slug: model.slug,
      name: model.name,
      description: model.description,
      provider: {
        id: model.provider.id,
        name: model.provider.name,
        slug: model.provider.slug,
        websiteUrl: model.provider.websiteUrl,
        documentationUrl: model.provider.documentationUrl,
        regions: JSON.parse(model.provider.regions || '[]')
      },
      foundationModel: model.foundationModel,
      releasedAt: model.releasedAt,
      deprecatedAt: model.deprecatedAt,
      sunsetAt: model.sunsetAt,
      modalities: JSON.parse(model.modalities || '[]'),
      capabilities: JSON.parse(model.capabilities || '[]'),
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      trainingCutoff: model.trainingCutoff,
      apiVersion: model.apiVersion,
      isActive: model.isActive,
      status: model.status[0] ? {
        status: model.status[0].status,
        availability: model.status[0].availability,
        latencyP50: model.status[0].latencyP50,
        latencyP95: model.status[0].latencyP95,
        latencyP99: model.status[0].latencyP99,
        errorRate: model.status[0].errorRate,
        requestsPerMin: model.status[0].requestsPerMin,
        tokensPerMin: model.status[0].tokensPerMin,
        usage: model.status[0].usage,
        checkedAt: model.status[0].checkedAt
      } : null,
      pricing: model.pricing[0] ? {
        tier: model.pricing[0].tier,
        currency: model.pricing[0].currency,
        inputPerMillion: model.pricing[0].inputPerMillion,
        outputPerMillion: model.pricing[0].outputPerMillion,
        imagePerUnit: model.pricing[0].imagePerUnit,
        audioPerMinute: model.pricing[0].audioPerMinute,
        videoPerMinute: model.pricing[0].videoPerMinute,
        effectiveFrom: model.pricing[0].effectiveFrom
      } : null,
      benchmarks: model.benchmarkScores.map(score => ({
        suite: score.suite.name,
        suiteSlug: score.suite.slug,
        score: score.scoreRaw,
        normalizedScore: score.scoreNormalized,
        percentile: score.percentile,
        evaluationDate: score.evaluationDate,
        isOfficial: score.isOfficial
      })),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    }));

    // 5. Apply provider filtering (only show models with API keys)
    const providersWithApiKeys = new Set(['openai', 'anthropic', 'google', 'meta']);
    const filteredModels = transformedModels.filter(model => 
      providersWithApiKeys.has(model.provider.slug)
    );

    // 6. Create data structure
    const data = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      providers: providers.filter(p => providersWithApiKeys.has(p.slug)).map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        websiteUrl: p.websiteUrl,
        documentationUrl: p.documentationUrl,
        regions: JSON.parse(p.regions || '[]')
      })),
      models: filteredModels,
      benchmarkSuites: benchmarkSuites.map(suite => ({
        id: suite.id,
        slug: suite.slug,
        name: suite.name,
        description: suite.description,
        category: suite.category,
        version: suite.version,
        maxScore: suite.maxScore
      })),
      statistics: {
        totalModels: filteredModels.length,
        activeModels: filteredModels.filter(m => m.isActive).length,
        totalProviders: providersWithApiKeys.size,
        operationalModels: filteredModels.filter(m => m.status?.status === 'operational').length,
        avgAvailability: filteredModels.reduce((sum, m) => sum + (m.status?.availability || 0), 0) / filteredModels.length
      }
    };

    // 7. Write to files
    const dataDir = path.join(__dirname, '..', 'data');
    
    // Main data file
    await fs.writeFile(
      path.join(dataDir, 'models.json'),
      JSON.stringify(data, null, 2),
      'utf8'
    );

    // Separate status file for more frequent updates
    const statusData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      statuses: filteredModels.reduce((acc, model) => {
        if (model.status) {
          acc[model.slug] = model.status;
        }
        return acc;
      }, {})
    };

    await fs.writeFile(
      path.join(dataDir, 'model-status.json'),
      JSON.stringify(statusData, null, 2),
      'utf8'
    );

    console.log(`✅ Exported ${filteredModels.length} models to data/models.json`);
    console.log(`✅ Exported status data to data/model-status.json`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();