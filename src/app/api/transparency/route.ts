import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';
import { dataAggregator } from '@/services/data-aggregator.service';

export async function GET(_request: NextRequest) {
  try {
    // Get aggregation status
    const aggregationStatus = await dataAggregator.getAggregationStatus();

    // Get data source breakdown
    const dataSourceBreakdown = await getDataSourceBreakdown();

    // Get recent changes
    const recentChanges = await getRecentChanges();

    // Get confidence metrics
    const confidenceMetrics = await getConfidenceMetrics();

    // Get scraper health
    const scraperHealth = await getScraperHealth();

    // Build transparency report
    const transparencyReport = {
      lastUpdated: new Date(),
      aggregation: aggregationStatus,
      dataSources: dataSourceBreakdown,
      recentChanges: recentChanges,
      confidence: confidenceMetrics,
      scraperHealth: scraperHealth,
      disclaimer: {
        message: "All data is collected automatically from public sources",
        sources: [
          "Provider APIs (when available)",
          "Official documentation pages",
          "Public pricing pages"
        ],
        limitations: [
          "Pricing may vary by region and tier",
          "Some features may require special access",
          "Data accuracy depends on source availability"
        ]
      }
    };

    return NextResponse.json(transparencyReport);
  } catch (error) {
    console.error('Failed to generate transparency report:', error);
    return NextResponse.json(
      { error: 'Failed to generate transparency report' },
      { status: 500 }
    );
  }
}

async function getDataSourceBreakdown() {
  try {
    const models = await prisma.model.findMany({
      select: {
        dataSource: true,
        provider: {
          select: {
            slug: true
          }
        }
      }
    });

    const breakdown: any = {};

    for (const model of models) {
      const provider = model.provider.slug;
      const source = model.dataSource || 'unknown';

      if (!breakdown[provider]) {
        breakdown[provider] = {
          api: 0,
          scraped: 0,
          config: 0,
          unknown: 0,
          total: 0
        };
      }

      breakdown[provider][source]++;
      breakdown[provider].total++;
    }

    // Calculate percentages
    for (const provider in breakdown) {
      const total = breakdown[provider].total;
      breakdown[provider].percentages = {
        api: ((breakdown[provider].api / total) * 100).toFixed(1),
        scraped: ((breakdown[provider].scraped / total) * 100).toFixed(1),
        config: ((breakdown[provider].config / total) * 100).toFixed(1),
        unknown: ((breakdown[provider].unknown / total) * 100).toFixed(1)
      };
    }

    return breakdown;
  } catch (error) {
    console.error('Failed to get data source breakdown:', error);
    return {};
  }
}

async function getRecentChanges() {
  try {
    // Get from cache first
    const cached = await cache.get<any[]>('recent-changes');
    if (cached) {
      return cached.slice(0, 20); // Return last 20 changes
    }

    // Fallback to database
    const changes = await prisma.$queryRaw`
      SELECT
        cl.created_at,
        cl.change_type,
        cl.model_id,
        cl.confidence,
        cl.change_data,
        p.name as provider_name
      FROM change_logs cl
      JOIN providers p ON cl.provider_id = p.id
      ORDER BY cl.created_at DESC
      LIMIT 20
    `;

    return changes;
  } catch (error) {
    console.error('Failed to get recent changes:', error);
    return [];
  }
}

async function getConfidenceMetrics() {
  try {
    const providers = ['openai', 'anthropic', 'google', 'meta'];
    const metrics: any = {};

    for (const provider of providers) {
      const cacheKey = `aggregated:${provider}`;
      const data = await cache.get<any>(cacheKey);

      if (data) {
        metrics[provider] = {
          confidence: data.confidence || 0,
          source: data.source || 'unknown',
          lastUpdated: data.lastUpdated || null,
          modelCount: data.models?.length || 0
        };
      } else {
        // Get from database
        const models = await prisma.model.findMany({
          where: {
            provider: {
              slug: provider
            }
          },
          select: {
            dataSource: true,
            lastVerified: true
          }
        });

        metrics[provider] = {
          confidence: models.length > 0 ? 0.7 : 0,
          source: models[0]?.dataSource || 'unknown',
          lastUpdated: models[0]?.lastVerified || null,
          modelCount: models.length
        };
      }
    }

    // Calculate overall confidence
    const confidenceValues = Object.values(metrics).map((m: any) => m.confidence);
    const overallConfidence = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;

    return {
      providers: metrics,
      overall: {
        confidence: overallConfidence.toFixed(2),
        lowestConfidence: Math.min(...confidenceValues).toFixed(2),
        highestConfidence: Math.max(...confidenceValues).toFixed(2)
      }
    };
  } catch (error) {
    console.error('Failed to get confidence metrics:', error);
    return {};
  }
}

async function getScraperHealth() {
  try {
    const health: any = {
      openai: { status: 'unknown', lastRun: null, nextRun: null },
      anthropic: { status: 'unknown', lastRun: null, nextRun: null },
      google: { status: 'api-only', lastRun: null, nextRun: null },
      meta: { status: 'api-only', lastRun: null, nextRun: null }
    };

    // Check cache for last run times
    const providers = ['openai', 'anthropic'];
    for (const provider of providers) {
      const cacheKey = `aggregated:${provider}`;
      const data = await cache.get<any>(cacheKey);

      if (data && data.lastUpdated) {
        const lastRun = new Date(data.lastUpdated);
        const timeSinceRun = Date.now() - lastRun.getTime();
        const hoursSinceRun = timeSinceRun / (1000 * 60 * 60);

        health[provider] = {
          status: hoursSinceRun < 2 ? 'healthy' : hoursSinceRun < 24 ? 'warning' : 'stale',
          lastRun: lastRun,
          nextRun: new Date(lastRun.getTime() + 3600000), // 1 hour from last run
          confidence: data.confidence || 0,
          source: data.source || 'unknown'
        };
      }
    }

    return health;
  } catch (error) {
    console.error('Failed to get scraper health:', error);
    return {};
  }
}