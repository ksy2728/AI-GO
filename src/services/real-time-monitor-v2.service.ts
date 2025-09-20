import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';
import { logger } from '@/utils/logger';

interface MetricsWindow {
  timestamp: Date;
  modelId: string;
  providerId: string;
  success: boolean;
  responseTime: number;
  tokens: number;
  errorType?: string;
}

interface ModelMetrics {
  modelId: string;
  providerId: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  availability: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  errorTypes: Record<string, number>;
  tokensProcessed: number;
  throughput: number;
  lastUpdated: Date;
}

interface ProviderMetrics {
  providerId: string;
  overallAvailability: number;
  modelCount: number;
  activeModels: number;
  totalRequests: number;
  totalTokens: number;
  errorBreakdown: Record<string, number>;
  performanceScore: number;
}

export class RealTimeMonitorV2 {
  private static instance: RealTimeMonitorV2;
  private metricsWindow: MetricsWindow[] = [];
  private readonly WINDOW_SIZE = 3600000; // 1 hour window
  private readonly METRICS_UPDATE_INTERVAL = 5000; // Update every 5 seconds
  private updateTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMetricsUpdate();
  }

  static getInstance(): RealTimeMonitorV2 {
    if (!RealTimeMonitorV2.instance) {
      RealTimeMonitorV2.instance = new RealTimeMonitorV2();
    }
    return RealTimeMonitorV2.instance;
  }

  /**
   * Record an API call with detailed metrics
   */
  recordApiCall(
    modelId: string,
    providerId: string,
    success: boolean,
    responseTime: number,
    tokens: number,
    errorType?: string
  ): void {
    const metric: MetricsWindow = {
      timestamp: new Date(),
      modelId,
      providerId,
      success,
      responseTime,
      tokens,
      errorType
    };

    this.metricsWindow.push(metric);

    // Clean old metrics outside window
    this.cleanOldMetrics();
  }

  /**
   * Calculate sophisticated model metrics
   */
  calculateModelMetrics(modelId: string): ModelMetrics {
    const now = Date.now();
    const modelMetrics = this.metricsWindow.filter(
      m => m.modelId === modelId &&
      now - m.timestamp.getTime() < this.WINDOW_SIZE
    );

    if (modelMetrics.length === 0) {
      return this.getDefaultModelMetrics(modelId);
    }

    const successfulCalls = modelMetrics.filter(m => m.success);
    const failedCalls = modelMetrics.filter(m => !m.success);

    // Calculate response time percentiles
    const responseTimes = successfulCalls
      .map(m => m.responseTime)
      .sort((a, b) => a - b);

    const p50 = this.calculatePercentile(responseTimes, 50);
    const p95 = this.calculatePercentile(responseTimes, 95);
    const p99 = this.calculatePercentile(responseTimes, 99);

    // Calculate error breakdown
    const errorTypes: Record<string, number> = {};
    failedCalls.forEach(m => {
      const error = m.errorType || 'unknown';
      errorTypes[error] = (errorTypes[error] || 0) + 1;
    });

    // Calculate availability (sophisticated)
    const availability = this.calculateAvailability(modelMetrics);

    // Calculate throughput (tokens per minute)
    const timeSpan = Math.min(now - modelMetrics[0].timestamp.getTime(), this.WINDOW_SIZE);
    const throughput = (modelMetrics.reduce((sum, m) => sum + m.tokens, 0) / timeSpan) * 60000;

    return {
      modelId,
      providerId: modelMetrics[0].providerId,
      totalCalls: modelMetrics.length,
      successfulCalls: successfulCalls.length,
      failedCalls: failedCalls.length,
      availability,
      averageResponseTime: responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0,
      p50ResponseTime: p50,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
      errorRate: (failedCalls.length / modelMetrics.length) * 100,
      errorTypes,
      tokensProcessed: modelMetrics.reduce((sum, m) => sum + m.tokens, 0),
      throughput,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate sophisticated availability using weighted factors
   */
  private calculateAvailability(metrics: MetricsWindow[]): number {
    if (metrics.length === 0) return 0;

    // Group metrics by time buckets (5-minute intervals)
    const bucketSize = 300000; // 5 minutes
    const now = Date.now();
    const buckets = new Map<number, MetricsWindow[]>();

    metrics.forEach(m => {
      const bucketIndex = Math.floor((now - m.timestamp.getTime()) / bucketSize);
      if (!buckets.has(bucketIndex)) {
        buckets.set(bucketIndex, []);
      }
      buckets.get(bucketIndex)!.push(m);
    });

    // Calculate availability for each bucket
    const bucketAvailabilities: number[] = [];
    const weights: number[] = [];

    buckets.forEach((bucketMetrics, bucketIndex) => {
      const successRate = bucketMetrics.filter(m => m.success).length / bucketMetrics.length;
      bucketAvailabilities.push(successRate * 100);

      // More recent buckets get higher weight
      const weight = 1 / (bucketIndex + 1);
      weights.push(weight);
    });

    // Calculate weighted average
    if (bucketAvailabilities.length === 0) return 0;

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedAvailability = bucketAvailabilities.reduce(
      (sum, availability, i) => sum + (availability * weights[i] / totalWeight),
      0
    );

    // Apply penalties for consecutive errors
    const consecutiveErrorPenalty = this.calculateConsecutiveErrorPenalty(metrics);

    return Math.max(0, weightedAvailability - consecutiveErrorPenalty);
  }

  /**
   * Calculate penalty for consecutive errors
   */
  private calculateConsecutiveErrorPenalty(metrics: MetricsWindow[]): number {
    let maxConsecutiveErrors = 0;
    let currentConsecutiveErrors = 0;

    for (const metric of metrics) {
      if (!metric.success) {
        currentConsecutiveErrors++;
        maxConsecutiveErrors = Math.max(maxConsecutiveErrors, currentConsecutiveErrors);
      } else {
        currentConsecutiveErrors = 0;
      }
    }

    // Each consecutive error adds 2% penalty, max 20%
    return Math.min(20, maxConsecutiveErrors * 2);
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedArray[lower];
    }

    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Get provider-level metrics
   */
  async getProviderMetrics(providerId: string): Promise<ProviderMetrics> {
    const models = await prisma.model.findMany({
      where: {
        provider: {
          slug: providerId
        }
      },
      select: {
        slug: true
      }
    });

    const modelIds = models.map(m => m.slug);
    const modelMetrics = modelIds.map(id => this.calculateModelMetrics(id));

    // Filter out models with no data
    const activeMetrics = modelMetrics.filter(m => m.totalCalls > 0);

    if (activeMetrics.length === 0) {
      return {
        providerId,
        overallAvailability: 0,
        modelCount: models.length,
        activeModels: 0,
        totalRequests: 0,
        totalTokens: 0,
        errorBreakdown: {},
        performanceScore: 0
      };
    }

    // Aggregate error types
    const errorBreakdown: Record<string, number> = {};
    activeMetrics.forEach(m => {
      Object.entries(m.errorTypes).forEach(([error, count]) => {
        errorBreakdown[error] = (errorBreakdown[error] || 0) + count;
      });
    });

    // Calculate performance score (0-100)
    const avgAvailability = activeMetrics.reduce((sum, m) => sum + m.availability, 0) / activeMetrics.length;
    const avgResponseTime = activeMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / activeMetrics.length;
    const responseScore = Math.max(0, 100 - (avgResponseTime / 50)); // 5000ms = 0 score
    const performanceScore = (avgAvailability * 0.7 + responseScore * 0.3);

    return {
      providerId,
      overallAvailability: avgAvailability,
      modelCount: models.length,
      activeModels: activeMetrics.length,
      totalRequests: activeMetrics.reduce((sum, m) => sum + m.totalCalls, 0),
      totalTokens: activeMetrics.reduce((sum, m) => sum + m.tokensProcessed, 0),
      errorBreakdown,
      performanceScore
    };
  }

  /**
   * Clean metrics outside the time window
   */
  private cleanOldMetrics(): void {
    const cutoff = Date.now() - this.WINDOW_SIZE;
    this.metricsWindow = this.metricsWindow.filter(
      m => m.timestamp.getTime() > cutoff
    );
  }

  /**
   * Get default metrics when no data available
   */
  private getDefaultModelMetrics(modelId: string): ModelMetrics {
    return {
      modelId,
      providerId: 'unknown',
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      availability: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      errorTypes: {},
      tokensProcessed: 0,
      throughput: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Start periodic metrics update
   */
  private startMetricsUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      try {
        await this.updateCachedMetrics();
      } catch (error) {
        logger.error('Failed to update cached metrics:', error);
      }
    }, this.METRICS_UPDATE_INTERVAL);
  }

  /**
   * Update cached metrics for all active models
   */
  private async updateCachedMetrics(): Promise<void> {
    // Get unique model IDs from recent metrics
    const modelIds = [...new Set(this.metricsWindow.map(m => m.modelId))];

    for (const modelId of modelIds) {
      const metrics = this.calculateModelMetrics(modelId);

      // Cache the metrics
      await cache.set(`metrics:${modelId}`, metrics, 60); // Cache for 1 minute

      // Update database if significant changes
      if (metrics.totalCalls > 10 && (metrics.errorRate > 10 || metrics.availability < 95)) {
        await this.updateDatabaseMetrics(modelId, metrics);
      }
    }
  }

  /**
   * Update database with current metrics
   */
  private async updateDatabaseMetrics(modelId: string, metrics: ModelMetrics): Promise<void> {
    try {
      const model = await prisma.model.findUnique({
        where: { slug: modelId }
      });

      if (!model) return;

      await prisma.modelStatus.upsert({
        where: {
          modelId_region: {
            modelId: model.id,
            region: 'global'
          }
        },
        create: {
          modelId: model.id,
          status: metrics.availability >= 99 ? 'operational' :
                  metrics.availability >= 95 ? 'degraded' : 'outage',
          availability: metrics.availability,
          latencyP50: metrics.p50ResponseTime,
          latencyP95: metrics.p95ResponseTime,
          latencyP99: metrics.p99ResponseTime,
          errorRate: metrics.errorRate,
          requestsPerMin: Math.round(metrics.totalCalls / 60),
          tokensPerMin: Math.round(metrics.throughput),
          usage: metrics.totalCalls,
          region: 'global',
          checkedAt: new Date()
        },
        update: {
          status: metrics.availability >= 99 ? 'operational' :
                  metrics.availability >= 95 ? 'degraded' : 'outage',
          availability: metrics.availability,
          latencyP50: metrics.p50ResponseTime,
          latencyP95: metrics.p95ResponseTime,
          latencyP99: metrics.p99ResponseTime,
          errorRate: metrics.errorRate,
          requestsPerMin: Math.round(metrics.totalCalls / 60),
          tokensPerMin: Math.round(metrics.throughput),
          usage: metrics.totalCalls,
          checkedAt: new Date()
        }
      });
    } catch (error) {
      logger.error(`Failed to update database metrics for ${modelId}:`, error);
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(): Promise<any> {
    const providers = ['openai', 'anthropic', 'google', 'meta'];
    const dashboard: any = {
      providers: {},
      summary: {
        totalRequests: 0,
        totalTokens: 0,
        overallAvailability: 0,
        activeModels: 0
      },
      timestamp: new Date()
    };

    for (const provider of providers) {
      const metrics = await this.getProviderMetrics(provider);
      dashboard.providers[provider] = metrics;

      dashboard.summary.totalRequests += metrics.totalRequests;
      dashboard.summary.totalTokens += metrics.totalTokens;
      dashboard.summary.activeModels += metrics.activeModels;
    }

    // Calculate overall availability
    const availabilities = Object.values(dashboard.providers)
      .map((p: any) => p.overallAvailability)
      .filter(a => a > 0);

    dashboard.summary.overallAvailability = availabilities.length > 0
      ? availabilities.reduce((a, b) => a + b, 0) / availabilities.length
      : 0;

    return dashboard;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

// Export singleton instance
export const realTimeMonitorV2 = RealTimeMonitorV2.getInstance();