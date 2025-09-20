'use client';

import React from 'react';
// import { Tooltip } from '@/components/ui/tooltip';

export type DataSource = 'api' | 'scraped' | 'config' | 'cached' | 'unknown';

interface DataSourceBadgeProps {
  source: DataSource;
  lastVerified?: Date | string;
  confidence?: number;
  className?: string;
}

const sourceConfig: Record<DataSource, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}> = {
  api: {
    label: 'API',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '🔌',
    description: 'Real-time data from official API',
  },
  scraped: {
    label: 'Scraped',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🕷️',
    description: 'Data collected via web scraping',
  },
  config: {
    label: 'Config',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: '📁',
    description: 'Fallback data from configuration',
  },
  cached: {
    label: 'Cached',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '💾',
    description: 'Previously fetched data from cache',
  },
  unknown: {
    label: 'Unknown',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: '❓',
    description: 'Data source not identified',
  },
};

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  lastVerified,
  confidence,
  className = '',
}) => {
  const config = sourceConfig[source];

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const tooltipContent = (
    <div className="p-2 space-y-1">
      <div className="font-semibold">{config.description}</div>
      {lastVerified && (
        <div className="text-xs text-gray-500">
          Last verified: {formatDate(lastVerified)}
        </div>
      )}
      {confidence !== undefined && (
        <div className="text-xs text-gray-500">
          Confidence: {(confidence * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
        ${config.bgColor} ${config.color} ${config.borderColor} border
        ${className}
      `}
      title={`${config.description}${lastVerified ? ` - Last verified: ${formatDate(lastVerified)}` : ''}${confidence !== undefined ? ` - Confidence: ${(confidence * 100).toFixed(0)}%` : ''}`}
    >
      <span className="text-sm">{config.icon}</span>
      <span>{config.label}</span>
      {confidence !== undefined && confidence < 0.8 && (
        <span className="text-xs opacity-75">⚠️</span>
      )}
    </span>
  );
};

// Composite badge for showing multiple sources
interface MultiSourceBadgeProps {
  primary: DataSource;
  fallback?: DataSource;
  className?: string;
}

export const MultiSourceBadge: React.FC<MultiSourceBadgeProps> = ({
  primary,
  fallback,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <DataSourceBadge source={primary} />
      {fallback && (
        <>
          <span className="text-xs text-gray-400">→</span>
          <DataSourceBadge source={fallback} className="opacity-60" />
        </>
      )}
    </div>
  );
};

// Status indicator for data freshness
interface DataFreshnessIndicatorProps {
  lastUpdated: Date | string;
  updateFrequency?: number; // in minutes
  className?: string;
}

export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  lastUpdated,
  updateFrequency = 60,
  className = '',
}) => {
  const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  const isStale = diffMinutes > updateFrequency * 2;
  const isWarning = diffMinutes > updateFrequency;

  const statusColor = isStale ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-green-500';
  const statusIcon = isStale ? '🔴' : isWarning ? '🟡' : '🟢';

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs ${statusColor} ${className}`}
      title={`Last updated: ${diffMinutes} minutes ago`}
    >
      <span>{statusIcon}</span>
      <span>
        {diffMinutes < 1 ? 'Live' : `${diffMinutes}m ago`}
      </span>
    </div>
  );
};