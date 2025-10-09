// API Quota Management API Endpoint
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { JWTManager } from '@/lib/auth/jwt';

interface QuotaConfig {
  provider: string;
  endpoint: string;
  quota: {
    requests: {
      daily: number;
      monthly: number;
      current: number;
    };
    tokens: {
      daily: number;
      monthly: number;
      current: number;
    };
    cost: {
      daily: number;
      monthly: number;
      current: number;
    };
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      warning: number; // percentage
      critical: number; // percentage
      emergency: number; // percentage
    };
    channels: string[]; // email, slack, webhook
  };
  status: 'active' | 'paused' | 'disabled';
  lastReset: string;
}

interface QuotaUsage {
  provider: string;
  usage: {
    requests: {
      today: number;
      thisMonth: number;
      percentDaily: number;
      percentMonthly: number;
    };
    tokens: {
      today: number;
      thisMonth: number;
      percentDaily: number;
      percentMonthly: number;
    };
    cost: {
      today: number;
      thisMonth: number;
      percentDaily: number;
      percentMonthly: number;
    };
  };
  trends: {
    requestsGrowth: number; // percentage change
    costGrowth: number; // percentage change
    averageRequestsPerDay: number;
    averageCostPerDay: number;
  };
  alerts: {
    id: string;
    level: 'warning' | 'critical' | 'emergency';
    message: string;
    timestamp: string;
    resolved: boolean;
  }[];
}

// Simulated quota configurations - in production, this would come from database
const defaultQuotaConfigs: QuotaConfig[] = [
  {
    provider: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/',
    quota: {
      requests: { daily: 1000, monthly: 30000, current: 0 },
      tokens: { daily: 100000, monthly: 3000000, current: 0 },
      cost: { daily: 50, monthly: 1500, current: 0 }
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      burstLimit: 100
    },
    alerts: {
      enabled: true,
      thresholds: { warning: 75, critical: 90, emergency: 95 },
      channels: ['email', 'slack']
    },
    status: 'active',
    lastReset: new Date().toISOString()
  },
  {
    provider: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1/',
    quota: {
      requests: { daily: 500, monthly: 15000, current: 0 },
      tokens: { daily: 50000, monthly: 1500000, current: 0 },
      cost: { daily: 30, monthly: 900, current: 0 }
    },
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerHour: 1800,
      burstLimit: 50
    },
    alerts: {
      enabled: true,
      thresholds: { warning: 80, critical: 90, emergency: 95 },
      channels: ['email']
    },
    status: 'active',
    lastReset: new Date().toISOString()
  },
  {
    provider: 'Google AI',
    endpoint: 'https://generativelanguage.googleapis.com/v1/',
    quota: {
      requests: { daily: 2000, monthly: 60000, current: 0 },
      tokens: { daily: 200000, monthly: 6000000, current: 0 },
      cost: { daily: 20, monthly: 600, current: 0 }
    },
    rateLimit: {
      requestsPerMinute: 120,
      requestsPerHour: 7200,
      burstLimit: 200
    },
    alerts: {
      enabled: true,
      thresholds: { warning: 70, critical: 85, emergency: 95 },
      channels: ['slack']
    },
    status: 'active',
    lastReset: new Date().toISOString()
  },
  {
    provider: 'Replicate',
    endpoint: 'https://api.replicate.com/v1/',
    quota: {
      requests: { daily: 100, monthly: 3000, current: 0 },
      tokens: { daily: 10000, monthly: 300000, current: 0 },
      cost: { daily: 25, monthly: 750, current: 0 }
    },
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerHour: 600,
      burstLimit: 20
    },
    alerts: {
      enabled: true,
      thresholds: { warning: 75, critical: 90, emergency: 95 },
      channels: ['email', 'slack']
    },
    status: 'active',
    lastReset: new Date().toISOString()
  }
];

// Generate simulated usage data
function generateUsageData(config: QuotaConfig): QuotaUsage {
  const requestsToday = Math.floor(Math.random() * config.quota.requests.daily * 0.8);
  const requestsThisMonth = Math.floor(Math.random() * config.quota.requests.monthly * 0.6);
  const tokensToday = Math.floor(Math.random() * config.quota.tokens.daily * 0.7);
  const tokensThisMonth = Math.floor(Math.random() * config.quota.tokens.monthly * 0.5);
  const costToday = Math.floor(Math.random() * config.quota.cost.daily * 0.6 * 100) / 100;
  const costThisMonth = Math.floor(Math.random() * config.quota.cost.monthly * 0.4 * 100) / 100;

  const alerts: QuotaUsage['alerts'] = [];

  // Generate alerts based on usage thresholds
  const requestPercent = (requestsToday / config.quota.requests.daily) * 100;
  const costPercent = (costToday / config.quota.cost.daily) * 100;

  if (requestPercent > config.alerts.thresholds.warning) {
    alerts.push({
      id: `alert-${config.provider.toLowerCase()}-requests-${Date.now()}`,
      level: requestPercent > config.alerts.thresholds.critical ? 'critical' : 'warning',
      message: `Daily request quota at ${requestPercent.toFixed(1)}% for ${config.provider}`,
      timestamp: new Date().toISOString(),
      resolved: false
    });
  }

  if (costPercent > config.alerts.thresholds.warning) {
    alerts.push({
      id: `alert-${config.provider.toLowerCase()}-cost-${Date.now()}`,
      level: costPercent > config.alerts.thresholds.critical ? 'critical' : 'warning',
      message: `Daily cost quota at ${costPercent.toFixed(1)}% for ${config.provider}`,
      timestamp: new Date().toISOString(),
      resolved: false
    });
  }

  return {
    provider: config.provider,
    usage: {
      requests: {
        today: requestsToday,
        thisMonth: requestsThisMonth,
        percentDaily: (requestsToday / config.quota.requests.daily) * 100,
        percentMonthly: (requestsThisMonth / config.quota.requests.monthly) * 100
      },
      tokens: {
        today: tokensToday,
        thisMonth: tokensThisMonth,
        percentDaily: (tokensToday / config.quota.tokens.daily) * 100,
        percentMonthly: (tokensThisMonth / config.quota.tokens.monthly) * 100
      },
      cost: {
        today: costToday,
        thisMonth: costThisMonth,
        percentDaily: (costToday / config.quota.cost.daily) * 100,
        percentMonthly: (costThisMonth / config.quota.cost.monthly) * 100
      }
    },
    trends: {
      requestsGrowth: Math.floor(Math.random() * 40) - 20, // -20% to +20%
      costGrowth: Math.floor(Math.random() * 30) - 15, // -15% to +15%
      averageRequestsPerDay: Math.floor(requestsThisMonth / 30),
      averageCostPerDay: Math.floor(costThisMonth / 30 * 100) / 100
    },
    alerts
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !JWTManager.verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'usage':
        // Get current usage data for all providers
        const usageData = defaultQuotaConfigs.map(config => generateUsageData(config));

        return NextResponse.json({
          success: true,
          data: {
            usage: usageData,
            summary: {
              totalProviders: usageData.length,
              activeProviders: usageData.filter(u => defaultQuotaConfigs.find(c => c.provider === u.provider)?.status === 'active').length,
              totalAlerts: usageData.reduce((sum, u) => sum + u.alerts.length, 0),
              totalCostToday: usageData.reduce((sum, u) => sum + u.usage.cost.today, 0),
              totalCostThisMonth: usageData.reduce((sum, u) => sum + u.usage.cost.thisMonth, 0)
            }
          }
        });

      case 'configs':
      default:
        // Get quota configurations
        return NextResponse.json({
          success: true,
          data: {
            configs: defaultQuotaConfigs,
            lastUpdated: new Date().toISOString()
          }
        });
    }

  } catch (error) {
    console.error('Quota API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quota data',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !JWTManager.verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, config } = body;

    if (!provider || !config) {
      return NextResponse.json(
        { success: false, error: 'Provider and config are required' },
        { status: 400 }
      );
    }

    // In production, this would update the database
    // For now, just validate the config structure
    const requiredFields = ['quota', 'rateLimit', 'alerts', 'status'];
    const hasAllFields = requiredFields.every(field => field in config);

    if (!hasAllFields) {
      return NextResponse.json(
        { success: false, error: 'Invalid config structure' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Quota configuration updated for ${provider}`,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Quota update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update quota configuration',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !JWTManager.verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, provider } = body;

    switch (action) {
      case 'reset-quota':
        if (!provider) {
          return NextResponse.json(
            { success: false, error: 'Provider is required for quota reset' },
            { status: 400 }
          );
        }

        // In production, this would reset the quota in the database
        return NextResponse.json({
          success: true,
          message: `Quota reset for ${provider}`,
          resetAt: new Date().toISOString()
        });

      case 'pause-provider':
        if (!provider) {
          return NextResponse.json(
            { success: false, error: 'Provider is required' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Provider ${provider} paused`,
          updatedAt: new Date().toISOString()
        });

      case 'resume-provider':
        if (!provider) {
          return NextResponse.json(
            { success: false, error: 'Provider is required' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Provider ${provider} resumed`,
          updatedAt: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Quota action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute quota action',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// Preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PUT, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}