// Slack Notification Management API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { JWTManager } from '@/lib/auth/jwt';

interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  purpose: string;
  isActive: boolean;
}

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  channels: string[];
  triggers: {
    events: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    conditions: {
      field: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
      value: string | number;
    }[];
  };
  template: {
    title: string;
    message: string;
    color: string;
    includeMetrics: boolean;
    mentionUsers: string[];
  };
  schedule: {
    enabled: boolean;
    timezone: string;
    quietHours: {
      start: string; // HH:MM
      end: string; // HH:MM
    };
    weekdaysOnly: boolean;
  };
  isEnabled: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  channel: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  error?: string;
  metadata?: {
    responseTime?: number;
    slackMessageId?: string;
    retryCount?: number;
  };
}

// Mock data - in production, this would come from database
const mockChannels: SlackChannel[] = [
  {
    id: 'C1234567',
    name: 'general',
    isPrivate: false,
    memberCount: 25,
    purpose: 'General team communication',
    isActive: true
  },
  {
    id: 'C2345678',
    name: 'alerts',
    isPrivate: false,
    memberCount: 8,
    purpose: 'System alerts and monitoring',
    isActive: true
  },
  {
    id: 'C3456789',
    name: 'ai-monitoring',
    isPrivate: false,
    memberCount: 5,
    purpose: 'AI API monitoring and quota alerts',
    isActive: true
  },
  {
    id: 'C4567890',
    name: 'dev-ops',
    isPrivate: true,
    memberCount: 3,
    purpose: 'DevOps and infrastructure alerts',
    isActive: true
  }
];

const mockRules: NotificationRule[] = [
  {
    id: 'rule-1',
    name: 'High API Usage Alert',
    description: 'Alert when API usage exceeds 80% of daily quota',
    channels: ['C2345678', 'C3456789'],
    triggers: {
      events: ['quota_warning', 'api_usage_high'],
      severity: 'high',
      conditions: [
        { field: 'usage_percent', operator: 'greater_than', value: 80 },
        { field: 'provider', operator: 'equals', value: 'OpenAI' }
      ]
    },
    template: {
      title: '🚨 High API Usage Alert',
      message: 'API usage has exceeded 80% of daily quota for {provider}. Current usage: {usage_percent}%',
      color: '#ff6b35',
      includeMetrics: true,
      mentionUsers: ['@ai-team']
    },
    schedule: {
      enabled: true,
      timezone: 'UTC',
      quietHours: { start: '22:00', end: '08:00' },
      weekdaysOnly: false
    },
    isEnabled: true,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rule-2',
    name: 'System Down Alert',
    description: 'Critical alert when any data source goes down',
    channels: ['C2345678', 'C4567890'],
    triggers: {
      events: ['system_down', 'api_unreachable'],
      severity: 'critical',
      conditions: [
        { field: 'status', operator: 'equals', value: 'down' }
      ]
    },
    template: {
      title: '🔥 CRITICAL: System Down',
      message: '{service} is currently unreachable. Immediate attention required!',
      color: '#dc3545',
      includeMetrics: false,
      mentionUsers: ['@channel', '@on-call']
    },
    schedule: {
      enabled: true,
      timezone: 'UTC',
      quietHours: { start: '00:00', end: '00:00' }, // No quiet hours for critical alerts
      weekdaysOnly: false
    },
    isEnabled: true,
    lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rule-3',
    name: 'Daily Summary Report',
    description: 'Daily summary of API usage and costs',
    channels: ['C3456789'],
    triggers: {
      events: ['daily_summary'],
      severity: 'low',
      conditions: []
    },
    template: {
      title: '📊 Daily API Summary',
      message: 'Daily API usage summary: {total_requests} requests, ${total_cost} spent. Top provider: {top_provider}',
      color: '#28a745',
      includeMetrics: true,
      mentionUsers: []
    },
    schedule: {
      enabled: true,
      timezone: 'UTC',
      quietHours: { start: '22:00', end: '08:00' },
      weekdaysOnly: true
    },
    isEnabled: true,
    lastTriggered: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

function generateNotificationHistory(): NotificationHistory[] {
  const history: NotificationHistory[] = [];
  const statuses: ('sent' | 'failed' | 'pending')[] = ['sent', 'sent', 'sent', 'sent', 'failed', 'sent'];

  mockRules.forEach(rule => {
    for (let i = 0; i < 3; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      history.push({
        id: `hist-${rule.id}-${i}`,
        ruleId: rule.id,
        ruleName: rule.name,
        channel: rule.channels[0],
        message: rule.template.message.replace(/\{[^}]+\}/g, '[data]'),
        severity: rule.triggers.severity,
        status,
        timestamp: timestamp.toISOString(),
        error: status === 'failed' ? 'Channel not found' : undefined,
        metadata: {
          responseTime: status === 'sent' ? Math.floor(Math.random() * 500) + 100 : undefined,
          slackMessageId: status === 'sent' ? `msg-${Date.now()}-${i}` : undefined,
          retryCount: status === 'failed' ? Math.floor(Math.random() * 3) + 1 : 0
        }
      });
    }
  });

  return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
      case 'channels':
        return NextResponse.json({
          success: true,
          data: {
            channels: mockChannels,
            total: mockChannels.length,
            active: mockChannels.filter(c => c.isActive).length
          }
        });

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '50');
        const history = generateNotificationHistory().slice(0, limit);

        return NextResponse.json({
          success: true,
          data: {
            history,
            total: history.length,
            stats: {
              sent: history.filter(h => h.status === 'sent').length,
              failed: history.filter(h => h.status === 'failed').length,
              pending: history.filter(h => h.status === 'pending').length
            }
          }
        });

      case 'rules':
      default:
        return NextResponse.json({
          success: true,
          data: {
            rules: mockRules,
            total: mockRules.length,
            enabled: mockRules.filter(r => r.isEnabled).length,
            lastUpdated: new Date().toISOString()
          }
        });
    }

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notification data',
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
    const { action } = body;

    switch (action) {
      case 'test-rule':
        const { ruleId } = body;
        if (!ruleId) {
          return NextResponse.json(
            { success: false, error: 'Rule ID is required' },
            { status: 400 }
          );
        }

        // Simulate sending a test notification
        const testResult = Math.random() > 0.1; // 90% success rate

        return NextResponse.json({
          success: true,
          data: {
            sent: testResult,
            message: testResult
              ? 'Test notification sent successfully'
              : 'Failed to send test notification: Channel not reachable',
            timestamp: new Date().toISOString()
          }
        });

      case 'test-channel':
        const { channelId } = body;
        if (!channelId) {
          return NextResponse.json(
            { success: false, error: 'Channel ID is required' },
            { status: 400 }
          );
        }

        // Simulate testing channel connectivity
        const channel = mockChannels.find(c => c.id === channelId);
        if (!channel) {
          return NextResponse.json(
            { success: false, error: 'Channel not found' },
            { status: 404 }
          );
        }

        const channelTestResult = Math.random() > 0.05; // 95% success rate

        return NextResponse.json({
          success: true,
          data: {
            reachable: channelTestResult,
            channel: channel.name,
            message: channelTestResult
              ? `Channel #${channel.name} is reachable`
              : `Channel #${channel.name} is not reachable`,
            responseTime: channelTestResult ? Math.floor(Math.random() * 300) + 50 : null
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Notifications action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute notification action',
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
    const { ruleId, rule } = body;

    if (!ruleId || !rule) {
      return NextResponse.json(
        { success: false, error: 'Rule ID and rule data are required' },
        { status: 400 }
      );
    }

    // Validate rule structure
    const requiredFields = ['name', 'channels', 'triggers', 'template', 'schedule'];
    const hasAllFields = requiredFields.every(field => field in rule);

    if (!hasAllFields) {
      return NextResponse.json(
        { success: false, error: 'Invalid rule structure' },
        { status: 400 }
      );
    }

    // In production, this would update the database
    return NextResponse.json({
      success: true,
      message: `Notification rule "${rule.name}" updated successfully`,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification rule update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notification rule',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // In production, this would delete from database
    return NextResponse.json({
      success: true,
      message: 'Notification rule deleted successfully',
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification rule delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete notification rule',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}