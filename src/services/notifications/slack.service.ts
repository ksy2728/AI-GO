import axios from 'axios';

export interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  attachments?: SlackAttachment[];
}

export interface SlackAttachment {
  color?: 'good' | 'warning' | 'danger' | string;
  title?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  ts?: number;
}

export class SlackNotificationService {
  private webhookUrl: string | undefined;
  private defaultChannel: string;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.defaultChannel = process.env.SLACK_CHANNEL || '#ai-monitoring';
    this.enabled = !!this.webhookUrl;

    if (!this.enabled) {
      console.warn('⚠️ Slack notifications disabled - SLACK_WEBHOOK_URL not configured');
    }
  }

  /**
   * Send a notification to Slack
   */
  async send(message: SlackMessage): Promise<boolean> {
    if (!this.enabled || !this.webhookUrl) {
      console.log('Slack notification (disabled):', message.text);
      return false;
    }

    try {
      const payload = {
        ...message,
        channel: message.channel || this.defaultChannel,
        username: message.username || 'AI Monitor Bot',
        icon_emoji: message.icon_emoji || ':robot_face:',
      };

      const response = await axios.post(this.webhookUrl, payload);
      return response.status === 200;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }

  /**
   * Send an API failure alert
   */
  async sendApiFailureAlert(provider: string, error: string, retryCount: number = 0): Promise<boolean> {
    const attachment: SlackAttachment = {
      color: retryCount > 2 ? 'danger' : 'warning',
      title: `🚨 API Failure: ${provider}`,
      fields: [
        {
          title: 'Provider',
          value: provider,
          short: true,
        },
        {
          title: 'Retry Count',
          value: retryCount.toString(),
          short: true,
        },
        {
          title: 'Error',
          value: error,
          short: false,
        },
      ],
      footer: 'AI Monitor System',
      ts: Date.now() / 1000,
    };

    return this.send({
      text: `API failure detected for ${provider}`,
      attachments: [attachment],
    });
  }

  /**
   * Send a quota warning alert
   */
  async sendQuotaWarning(provider: string, usage: number, limit: number): Promise<boolean> {
    const percentage = (usage / limit) * 100;
    const color = percentage > 90 ? 'danger' : percentage > 75 ? 'warning' : 'good';

    const attachment: SlackAttachment = {
      color,
      title: `📊 Quota Warning: ${provider}`,
      fields: [
        {
          title: 'Usage',
          value: `${usage.toLocaleString()} / ${limit.toLocaleString()}`,
          short: true,
        },
        {
          title: 'Percentage',
          value: `${percentage.toFixed(1)}%`,
          short: true,
        },
      ],
      footer: 'AI Monitor System',
      ts: Date.now() / 1000,
    };

    return this.send({
      text: `${provider} API quota at ${percentage.toFixed(1)}%`,
      attachments: [attachment],
    });
  }

  /**
   * Send a scraper failure alert
   */
  async sendScraperFailure(scraper: string, error: string): Promise<boolean> {
    const attachment: SlackAttachment = {
      color: 'danger',
      title: `🕷️ Scraper Failure: ${scraper}`,
      fields: [
        {
          title: 'Scraper',
          value: scraper,
          short: true,
        },
        {
          title: 'Status',
          value: 'Failed',
          short: true,
        },
        {
          title: 'Error',
          value: error,
          short: false,
        },
      ],
      footer: 'AI Monitor System',
      ts: Date.now() / 1000,
    };

    return this.send({
      text: `Scraper failure: ${scraper}`,
      attachments: [attachment],
    });
  }

  /**
   * Send a system recovery notification
   */
  async sendRecoveryNotification(component: string, downtime: number): Promise<boolean> {
    const attachment: SlackAttachment = {
      color: 'good',
      title: `✅ System Recovery: ${component}`,
      fields: [
        {
          title: 'Component',
          value: component,
          short: true,
        },
        {
          title: 'Downtime',
          value: `${Math.round(downtime / 1000)}s`,
          short: true,
        },
        {
          title: 'Status',
          value: 'Recovered',
          short: true,
        },
      ],
      footer: 'AI Monitor System',
      ts: Date.now() / 1000,
    };

    return this.send({
      text: `${component} has recovered`,
      attachments: [attachment],
    });
  }

  /**
   * Send a daily summary
   */
  async sendDailySummary(stats: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    activeModels: number;
    errors: number;
  }): Promise<boolean> {
    const attachment: SlackAttachment = {
      color: stats.successRate > 95 ? 'good' : stats.successRate > 90 ? 'warning' : 'danger',
      title: '📈 Daily Summary',
      fields: [
        {
          title: 'Total Requests',
          value: stats.totalRequests.toLocaleString(),
          short: true,
        },
        {
          title: 'Success Rate',
          value: `${stats.successRate.toFixed(2)}%`,
          short: true,
        },
        {
          title: 'Avg Response Time',
          value: `${stats.avgResponseTime.toFixed(0)}ms`,
          short: true,
        },
        {
          title: 'Active Models',
          value: stats.activeModels.toString(),
          short: true,
        },
        {
          title: 'Errors',
          value: stats.errors.toString(),
          short: true,
        },
      ],
      footer: 'AI Monitor System',
      ts: Date.now() / 1000,
    };

    return this.send({
      text: 'Daily system summary',
      attachments: [attachment],
    });
  }
}

// Export singleton instance
export const slackNotifier = new SlackNotificationService();