// Data Source Monitoring API Endpoint
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { JWTManager } from '@/lib/auth/jwt';

interface DataSourceMetrics {
  name: string;
  type: 'api' | 'scraper' | 'config' | 'cache';
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  successRate: number;
  lastChecked: string;
  errorCount: number;
  details?: {
    endpoint?: string;
    lastError?: string;
    uptime?: number;
  };
}

interface MonitoringData {
  overview: {
    totalSources: number;
    healthySources: number;
    degradedSources: number;
    downSources: number;
    averageResponseTime: number;
    overallSuccessRate: number;
  };
  sources: DataSourceMetrics[];
  alerts: {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
    source: string;
  }[];
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    redisStatus: 'connected' | 'disconnected' | 'unavailable';
    databaseStatus: 'connected' | 'disconnected';
  };
}

async function checkAPIHealth(): Promise<DataSourceMetrics[]> {
  const apiSources: DataSourceMetrics[] = [];
  const startTime = Date.now();

  // Check OpenAI API
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY?.substring(0, 10)}...` || 'none',
      },
      signal: AbortSignal.timeout(5000)
    });

    apiSources.push({
      name: 'OpenAI API',
      type: 'api',
      status: response.ok ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      successRate: response.ok ? 100 : 0,
      lastChecked: new Date().toISOString(),
      errorCount: response.ok ? 0 : 1,
      details: {
        endpoint: 'https://api.openai.com/v1/models',
        lastError: response.ok ? undefined : `HTTP ${response.status}`
      }
    });
  } catch (error) {
    apiSources.push({
      name: 'OpenAI API',
      type: 'api',
      status: 'down',
      responseTime: Date.now() - startTime,
      successRate: 0,
      lastChecked: new Date().toISOString(),
      errorCount: 1,
      details: {
        endpoint: 'https://api.openai.com/v1/models',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }

  // Check Anthropic API
  try {
    const anthropicStart = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...' || 'none',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      }),
      signal: AbortSignal.timeout(5000)
    });

    apiSources.push({
      name: 'Anthropic API',
      type: 'api',
      status: response.status === 401 ? 'healthy' : response.ok ? 'healthy' : 'degraded',
      responseTime: Date.now() - anthropicStart,
      successRate: response.status === 401 || response.ok ? 100 : 0,
      lastChecked: new Date().toISOString(),
      errorCount: 0,
      details: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        lastError: response.ok ? undefined : `HTTP ${response.status}`
      }
    });
  } catch (error) {
    apiSources.push({
      name: 'Anthropic API',
      type: 'api',
      status: 'down',
      responseTime: 5000,
      successRate: 0,
      lastChecked: new Date().toISOString(),
      errorCount: 1,
      details: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }

  return apiSources;
}

async function checkRedisHealth(): Promise<DataSourceMetrics> {
  try {
    const { redisManager } = await import('@/lib/redis/redis-client');
    const isAvailable = redisManager.isRedisAvailable();

    return {
      name: 'Redis Cache',
      type: 'cache',
      status: isAvailable ? 'healthy' : 'down',
      responseTime: isAvailable ? 1 : 0,
      successRate: isAvailable ? 100 : 0,
      lastChecked: new Date().toISOString(),
      errorCount: isAvailable ? 0 : 1,
      details: {
        endpoint: process.env.REDIS_URL ? 'Redis Server' : 'In-Memory Fallback'
      }
    };
  } catch (error) {
    return {
      name: 'Redis Cache',
      type: 'cache',
      status: 'down',
      responseTime: 0,
      successRate: 0,
      lastChecked: new Date().toISOString(),
      errorCount: 1,
      details: {
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function checkDatabaseHealth(): Promise<DataSourceMetrics> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    await prisma.$disconnect();

    return {
      name: 'Database',
      type: 'config',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      successRate: 100,
      lastChecked: new Date().toISOString(),
      errorCount: 0
    };
  } catch (error) {
    return {
      name: 'Database',
      type: 'config',
      status: 'down',
      responseTime: 0,
      successRate: 0,
      lastChecked: new Date().toISOString(),
      errorCount: 1,
      details: {
        lastError: error instanceof Error ? error.message : 'Connection failed'
      }
    };
  }
}

function generateSystemHealth(): MonitoringData['systemHealth'] {
  return {
    cpuUsage: Math.floor(Math.random() * 50) + 10, // Simulated
    memoryUsage: Math.floor(Math.random() * 60) + 20, // Simulated
    diskUsage: Math.floor(Math.random() * 40) + 30, // Simulated
    redisStatus: (process.env.REDIS_URL ? 'connected' : 'unavailable') as 'connected' | 'disconnected' | 'unavailable',
    databaseStatus: 'connected' as 'connected' | 'disconnected'
  };
}

function generateAlerts(sources: DataSourceMetrics[]) {
  const alerts: MonitoringData['alerts'] = [];

  sources.forEach(source => {
    if (source.status === 'down') {
      alerts.push({
        id: `alert-${source.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        severity: 'critical',
        message: `${source.name} is currently down`,
        timestamp: new Date().toISOString(),
        source: source.name
      });
    } else if (source.status === 'degraded') {
      alerts.push({
        id: `alert-${source.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        severity: 'warning',
        message: `${source.name} is experiencing performance issues`,
        timestamp: new Date().toISOString(),
        source: source.name
      });
    }

    if (source.responseTime > 2000) {
      alerts.push({
        id: `alert-${source.name.toLowerCase().replace(/\s+/g, '-')}-latency-${Date.now()}`,
        severity: 'warning',
        message: `${source.name} response time is high (${source.responseTime}ms)`,
        timestamp: new Date().toISOString(),
        source: source.name
      });
    }
  });

  return alerts;
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

    // Collect all monitoring data
    const [apiSources, redisHealth, dbHealth] = await Promise.all([
      checkAPIHealth(),
      checkRedisHealth(),
      checkDatabaseHealth()
    ]);

    const allSources = [...apiSources, redisHealth, dbHealth];
    const systemHealth = generateSystemHealth();
    const alerts = generateAlerts(allSources);

    // Calculate overview metrics
    const healthySources = allSources.filter(s => s.status === 'healthy').length;
    const degradedSources = allSources.filter(s => s.status === 'degraded').length;
    const downSources = allSources.filter(s => s.status === 'down').length;

    const avgResponseTime = allSources.reduce((sum, s) => sum + s.responseTime, 0) / allSources.length;
    const avgSuccessRate = allSources.reduce((sum, s) => sum + s.successRate, 0) / allSources.length;

    const monitoringData: MonitoringData = {
      overview: {
        totalSources: allSources.length,
        healthySources,
        degradedSources,
        downSources,
        averageResponseTime: Math.round(avgResponseTime),
        overallSuccessRate: Math.round(avgSuccessRate)
      },
      sources: allSources,
      alerts,
      systemHealth
    };

    return NextResponse.json({
      success: true,
      data: monitoringData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Monitoring data fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch monitoring data',
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
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}