import { slackNotifier } from '../notifications/slack.service';
import { cache } from '@/lib/redis';

export interface ApiQuota {
  provider: string;
  limit: number;
  used: number;
  resetAt: Date;
  warningThreshold: number; // percentage
  criticalThreshold: number; // percentage
}

export interface QuotaStatus {
  provider: string;
  usage: number;
  limit: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
  resetIn: number; // minutes
}

export class QuotaMonitorService {
  private quotas: Map<string, ApiQuota> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private notificationCache: Map<string, number> = new Map(); // Track last notification time

  constructor() {
    this.initializeQuotas();
  }

  /**
   * Initialize quota limits from environment or defaults
   */
  private initializeQuotas() {
    // OpenAI quotas
    this.quotas.set('openai', {
      provider: 'openai',
      limit: parseInt(process.env.OPENAI_QUOTA_LIMIT || '100000'),
      used: 0,
      resetAt: this.getNextResetTime(),
      warningThreshold: 75,
      criticalThreshold: 90,
    });

    // Anthropic quotas
    this.quotas.set('anthropic', {
      provider: 'anthropic',
      limit: parseInt(process.env.ANTHROPIC_QUOTA_LIMIT || '50000'),
      used: 0,
      resetAt: this.getNextResetTime(),
      warningThreshold: 75,
      criticalThreshold: 90,
    });

    // Google AI quotas
    this.quotas.set('google', {
      provider: 'google',
      limit: parseInt(process.env.GOOGLE_QUOTA_LIMIT || '60'), // requests per minute
      used: 0,
      resetAt: this.getNextResetTime(1), // 1 minute reset
      warningThreshold: 80,
      criticalThreshold: 95,
    });

    // Replicate quotas
    this.quotas.set('replicate', {
      provider: 'replicate',
      limit: parseInt(process.env.REPLICATE_QUOTA_LIMIT || '10000'),
      used: 0,
      resetAt: this.getNextResetTime(),
      warningThreshold: 75,
      criticalThreshold: 90,
    });
  }

  /**
   * Get next reset time
   */
  private getNextResetTime(minutes: number = 1440): Date {
    const now = new Date();
    const reset = new Date(now);
    reset.setMinutes(reset.getMinutes() + minutes);
    return reset;
  }

  /**
   * Start monitoring quotas
   */
  startMonitoring(intervalMinutes: number = 5) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.checkAllQuotas();

    // Set up recurring checks
    this.checkInterval = setInterval(() => {
      this.checkAllQuotas();
    }, intervalMinutes * 60 * 1000);

    console.log(`📊 Quota monitoring started (checking every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('📊 Quota monitoring stopped');
  }

  /**
   * Record API usage
   */
  async recordUsage(provider: string, tokens: number = 1): Promise<void> {
    const quota = this.quotas.get(provider);
    if (!quota) return;

    // Check if quota should reset
    if (new Date() > quota.resetAt) {
      quota.used = 0;
      quota.resetAt = this.getNextResetTime(provider === 'google' ? 1 : 1440);
    }

    quota.used += tokens;

    // Store in cache
    await cache.set(`quota:${provider}`, quota, 3600);

    // Check if warning/critical threshold reached
    const percentage = (quota.used / quota.limit) * 100;

    if (percentage >= quota.criticalThreshold) {
      await this.sendQuotaAlert(provider, 'critical', percentage);
    } else if (percentage >= quota.warningThreshold) {
      await this.sendQuotaAlert(provider, 'warning', percentage);
    }
  }

  /**
   * Get quota status for a provider
   */
  async getQuotaStatus(provider: string): Promise<QuotaStatus | null> {
    // Try cache first
    const cached = await cache.get<ApiQuota>(`quota:${provider}`);
    const quota = cached || this.quotas.get(provider);

    if (!quota) return null;

    const percentage = (quota.used / quota.limit) * 100;
    const resetIn = Math.max(0, Math.round((quota.resetAt.getTime() - Date.now()) / 60000));

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (percentage >= quota.criticalThreshold) {
      status = 'critical';
    } else if (percentage >= quota.warningThreshold) {
      status = 'warning';
    }

    return {
      provider: quota.provider,
      usage: quota.used,
      limit: quota.limit,
      percentage,
      status,
      resetIn,
    };
  }

  /**
   * Get all quota statuses
   */
  async getAllQuotaStatuses(): Promise<QuotaStatus[]> {
    const statuses: QuotaStatus[] = [];

    for (const [provider] of this.quotas) {
      const status = await this.getQuotaStatus(provider);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  /**
   * Check all quotas and send alerts if needed
   */
  private async checkAllQuotas() {
    const statuses = await this.getAllQuotaStatuses();

    for (const status of statuses) {
      if (status.status === 'critical') {
        await this.sendQuotaAlert(status.provider, 'critical', status.percentage);
      } else if (status.status === 'warning') {
        await this.sendQuotaAlert(status.provider, 'warning', status.percentage);
      }
    }

    // Log current status
    console.log('📊 Quota Status Check:');
    statuses.forEach(status => {
      const icon = status.status === 'healthy' ? '✅' : status.status === 'warning' ? '⚠️' : '🚨';
      console.log(
        `  ${icon} ${status.provider}: ${status.usage}/${status.limit} (${status.percentage.toFixed(1)}%) - Resets in ${status.resetIn}m`
      );
    });
  }

  /**
   * Send quota alert
   */
  private async sendQuotaAlert(provider: string, level: 'warning' | 'critical', percentage: number) {
    const lastNotification = this.notificationCache.get(`${provider}-${level}`);
    const now = Date.now();

    // Rate limit notifications (once per hour for same alert)
    if (lastNotification && now - lastNotification < 3600000) {
      return;
    }

    const quota = this.quotas.get(provider);
    if (!quota) return;

    await slackNotifier.sendQuotaWarning(provider, quota.used, quota.limit);
    this.notificationCache.set(`${provider}-${level}`, now);

    console.log(`📨 Sent ${level} quota alert for ${provider} (${percentage.toFixed(1)}%)`);
  }

  /**
   * Reset quota for a provider (for testing)
   */
  resetQuota(provider: string) {
    const quota = this.quotas.get(provider);
    if (quota) {
      quota.used = 0;
      quota.resetAt = this.getNextResetTime(provider === 'google' ? 1 : 1440);
      console.log(`🔄 Reset quota for ${provider}`);
    }
  }

  /**
   * Get quota metrics for monitoring dashboard
   */
  async getQuotaMetrics() {
    const statuses = await this.getAllQuotaStatuses();

    return {
      providers: statuses.map(s => ({
        name: s.provider,
        usage: s.usage,
        limit: s.limit,
        percentage: s.percentage,
        status: s.status,
        resetIn: s.resetIn,
      })),
      summary: {
        healthy: statuses.filter(s => s.status === 'healthy').length,
        warning: statuses.filter(s => s.status === 'warning').length,
        critical: statuses.filter(s => s.status === 'critical').length,
        avgUsage: statuses.reduce((sum, s) => sum + s.percentage, 0) / statuses.length,
      },
    };
  }
}

// Export singleton instance
export const quotaMonitor = new QuotaMonitorService();