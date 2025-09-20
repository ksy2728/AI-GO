'use client';

import React, { useState, useEffect } from 'react';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';

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
      start: string;
      end: string;
    };
    weekdaysOnly: boolean;
  };
  isEnabled: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  purpose: string;
  isActive: boolean;
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

export default function NotificationsPage() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'channels' | 'history'>('rules');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{[key: string]: any}>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, channelsRes, historyRes] = await Promise.all([
        fetch('/api/admin/notifications?action=rules'),
        fetch('/api/admin/notifications?action=channels'),
        fetch('/api/admin/notifications?action=history&limit=20')
      ]);

      const [rulesData, channelsData, historyData] = await Promise.all([
        rulesRes.json(),
        channelsRes.json(),
        historyRes.json()
      ]);

      if (rulesData.success) setRules(rulesData.data.rules);
      if (channelsData.success) setChannels(channelsData.data.channels);
      if (historyData.success) setHistory(historyData.data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId,
          rule: { ...rules.find(r => r.id === ruleId), isEnabled: enabled }
        })
      });

      if (response.ok) {
        setRules(prev => prev.map(rule =>
          rule.id === ruleId ? { ...rule, isEnabled: enabled } : rule
        ));
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const testRule = async (ruleId: string) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-rule', ruleId })
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, [ruleId]: result.data }));
    } catch (err) {
      console.error('Failed to test rule:', err);
    }
  };

  const testChannel = async (channelId: string) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-channel', channelId })
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, [`channel-${channelId}`]: result.data }));
    } catch (err) {
      console.error('Failed to test channel:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Slack Notifications</h1>
          <p className="text-gray-600">Manage notification rules, channels, and history</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'rules', label: 'Notification Rules', count: rules.length },
              { key: 'channels', label: 'Slack Channels', count: channels.length },
              { key: 'history', label: 'History', count: history.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {rules.map(rule => (
              <div key={rule.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(rule.triggers.severity)}`}>
                        {rule.triggers.severity.toUpperCase()}
                      </span>
                      <DataSourceBadge
                        source={rule.isEnabled ? 'api' : 'cached'}
                        lastVerified={rule.lastTriggered || rule.updatedAt}
                      />
                    </div>
                    <p className="text-gray-600 mb-3">{rule.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Events:</span>
                        <div className="mt-1">
                          {rule.triggers.events.map(event => (
                            <span key={event} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Channels:</span>
                        <div className="mt-1">
                          {rule.channels.map(channelId => {
                            const channel = channels.find(c => c.id === channelId);
                            return (
                              <span key={channelId} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                                #{channel?.name || channelId}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Schedule:</span>
                        <div className="mt-1 text-gray-600">
                          {rule.schedule.enabled ? (
                            <>
                              <div>Quiet: {rule.schedule.quietHours.start} - {rule.schedule.quietHours.end}</div>
                              <div>{rule.schedule.weekdaysOnly ? 'Weekdays only' : 'All days'}</div>
                            </>
                          ) : (
                            'Disabled'
                          )}
                        </div>
                      </div>
                    </div>

                    {rule.lastTriggered && (
                      <div className="mt-3 text-sm text-gray-500">
                        Last triggered: {formatTimestamp(rule.lastTriggered)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={() => testRule(rule.id)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Test
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.isEnabled}
                        onChange={(e) => toggleRule(rule.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {testResults[rule.id] && (
                  <div className={`mt-4 p-3 rounded ${testResults[rule.id].sent ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-sm font-medium ${testResults[rule.id].sent ? 'text-green-800' : 'text-red-800'}`}>
                      {testResults[rule.id].message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {testResults[rule.id].timestamp}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map(channel => (
              <div key={channel.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">#{channel.name}</h3>
                      {channel.isPrivate && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                          Private
                        </span>
                      )}
                      <DataSourceBadge
                        source={channel.isActive ? 'api' : 'cached'}
                      />
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{channel.purpose}</p>
                    <div className="text-sm text-gray-500">
                      {channel.memberCount} members
                    </div>
                  </div>

                  <button
                    onClick={() => testChannel(channel.id)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Test
                  </button>
                </div>

                {testResults[`channel-${channel.id}`] && (
                  <div className={`mt-4 p-3 rounded ${testResults[`channel-${channel.id}`].reachable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-sm font-medium ${testResults[`channel-${channel.id}`].reachable ? 'text-green-800' : 'text-red-800'}`}>
                      {testResults[`channel-${channel.id}`].message}
                    </div>
                    {testResults[`channel-${channel.id}`].responseTime && (
                      <div className="text-xs text-gray-500 mt-1">
                        Response time: {testResults[`channel-${channel.id}`].responseTime}ms
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.ruleName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">#{item.channel}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(item.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={item.message}>
                          {item.message}
                        </div>
                        {item.error && (
                          <div className="text-xs text-red-600 mt-1">{item.error}</div>
                        )}
                        {item.metadata?.responseTime && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.metadata.responseTime}ms
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}