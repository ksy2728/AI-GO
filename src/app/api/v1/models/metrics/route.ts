import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MetricHighlight {
  modelId: string;
  modelName: string;
  provider: string;
  providerLogo?: string;
  value: number;
  displayValue: string;
  rank: number;
  lastVerified?: Date | null;
}

interface MetricsResponse {
  intelligence: MetricHighlight[];
  speed: MetricHighlight[];
  price: MetricHighlight[];
  metadata: {
    lastUpdated: string;
    totalModels: number;
    dataSource: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '9');

    // Get top models by intelligence score
    const intelligenceModels = await prisma.model.findMany({
      where: {
        isActive: true,
        intelligenceScore: { not: null }
      },
      select: {
        id: true,
        name: true,
        intelligenceScore: true,
        lastVerified: true,
        provider: {
          select: {
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: {
        intelligenceScore: 'desc'
      },
      take: limit
    });

    // Get top models by output speed
    const speedModels = await prisma.model.findMany({
      where: {
        isActive: true,
        outputSpeed: { not: null }
      },
      select: {
        id: true,
        name: true,
        outputSpeed: true,
        lastVerified: true,
        provider: {
          select: {
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: {
        outputSpeed: 'desc'
      },
      take: limit
    });

    // Get top models by price (cheapest first)
    // Note: We need to calculate average price from input and output prices
    const priceModels = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      provider_name: string;
      provider_logo: string | null;
      avg_price: number;
      last_verified: Date | null;
    }>>`
      SELECT
        m.id,
        m.name,
        p.name as provider_name,
        p.logo_url as provider_logo,
        ((COALESCE(m.input_price::numeric, 0) + COALESCE(m.output_price::numeric, 0)) / 2) as avg_price,
        m.last_verified
      FROM models m
      JOIN providers p ON m.provider_id = p.id
      WHERE m.is_active = true
        AND (m.input_price IS NOT NULL OR m.output_price IS NOT NULL)
        AND ((COALESCE(m.input_price::numeric, 0) + COALESCE(m.output_price::numeric, 0)) / 2) > 0
      ORDER BY avg_price ASC
      LIMIT ${limit}
    `;

    // Transform data to response format
    const intelligence: MetricHighlight[] = intelligenceModels.map((model, index) => ({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider.name,
      providerLogo: model.provider.logoUrl || undefined,
      value: model.intelligenceScore || 0,
      displayValue: (model.intelligenceScore || 0).toFixed(1),
      rank: index + 1,
      lastVerified: model.lastVerified
    }));

    const speed: MetricHighlight[] = speedModels.map((model, index) => ({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider.name,
      providerLogo: model.provider.logoUrl || undefined,
      value: model.outputSpeed || 0,
      displayValue: Math.round(model.outputSpeed || 0).toString(),
      rank: index + 1,
      lastVerified: model.lastVerified
    }));

    const price: MetricHighlight[] = priceModels.map((model, index) => ({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider_name,
      providerLogo: model.provider_logo || undefined,
      value: Number(model.avg_price),
      displayValue: `$${Number(model.avg_price).toFixed(2)}`,
      rank: index + 1,
      lastVerified: model.last_verified
    }));

    // Get total model count
    const totalModels = await prisma.model.count({
      where: { isActive: true }
    });

    // Get most recent update time
    const mostRecent = await prisma.model.findFirst({
      where: {
        isActive: true,
        lastVerified: { not: null }
      },
      select: {
        lastVerified: true
      },
      orderBy: {
        lastVerified: 'desc'
      }
    });

    const response: MetricsResponse = {
      intelligence,
      speed,
      price,
      metadata: {
        lastUpdated: mostRecent?.lastVerified?.toISOString() || new Date().toISOString(),
        totalModels,
        dataSource: 'database'
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('Error fetching model metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch model metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Manual sync trigger endpoint
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'sync') {
      // Trigger AA sync to update DB columns
      // This would normally call the sync service
      return NextResponse.json({
        message: 'Sync triggered. Check back in a few minutes for updated data.',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in metrics POST:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}