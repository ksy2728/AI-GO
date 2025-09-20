'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, Database, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface TransparencyData {
  lastUpdated: string;
  aggregation: {
    providers: Record<string, {
      lastUpdated: string | null;
      source: string;
      confidence: number;
      modelCount: number;
      changeCount: number;
    }>;
    recentChanges: any[];
  };
  dataSources: Record<string, {
    api: number;
    scraped: number;
    config: number;
    unknown: number;
    total: number;
    percentages: {
      api: string;
      scraped: string;
      config: string;
      unknown: string;
    };
  }>;
  confidence: {
    providers: Record<string, {
      confidence: number;
      source: string;
      lastUpdated: string | null;
      modelCount: number;
    }>;
    overall: {
      confidence: string;
      lowestConfidence: string;
      highestConfidence: string;
    };
  };
  scraperHealth: Record<string, {
    status: string;
    lastRun: string | null;
    nextRun: string | null;
    confidence?: number;
    source?: string;
  }>;
  recentChanges: any[];
  disclaimer: {
    message: string;
    sources: string[];
    limitations: string[];
  };
}

export function TransparencyDashboard() {
  const [data, setData] = useState<TransparencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransparencyData();
    const interval = setInterval(fetchTransparencyData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchTransparencyData = async () => {
    try {
      const response = await fetch('/api/transparency');
      if (!response.ok) throw new Error('Failed to fetch transparency data');
      const data = await response.json();
      setData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transparency data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Failed to load transparency data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'stale': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'api': return 'bg-green-100 text-green-800';
      case 'scraped': return 'bg-blue-100 text-blue-800';
      case 'config': return 'bg-yellow-100 text-yellow-800';
      case 'mixed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Transparency Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {data.lastUpdated ? format(new Date(data.lastUpdated), 'PPpp') : 'Unknown'}
          </p>
        </div>
        <button
          onClick={fetchTransparencyData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Overall Confidence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Overall Data Confidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Confidence</span>
                <span className="text-2xl font-bold">
                  {(parseFloat(data.confidence.overall.confidence) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={parseFloat(data.confidence.overall.confidence) * 100} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Lowest:</span>
                <span className="ml-2 font-semibold">
                  {(parseFloat(data.confidence.overall.lowestConfidence) * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Highest:</span>
                <span className="ml-2 font-semibold">
                  {(parseFloat(data.confidence.overall.highestConfidence) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Data Source Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.dataSources).map(([provider, sources]) => (
              <div key={provider} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{provider}</span>
                  <span className="text-sm text-muted-foreground">
                    {sources.total} models
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <Badge className={getSourceBadgeColor('api')}>
                      API: {sources.percentages.api}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge className={getSourceBadgeColor('scraped')}>
                      Scraped: {sources.percentages.scraped}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge className={getSourceBadgeColor('config')}>
                      Config: {sources.percentages.config}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge className={getSourceBadgeColor('unknown')}>
                      Unknown: {sources.percentages.unknown}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scraper Health */}
      <Card>
        <CardHeader>
          <CardTitle>Scraper Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.scraperHealth).map(([provider, health]) => (
              <div key={provider} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">{provider}</span>
                  <CheckCircle className={`h-4 w-4 ${getStatusColor(health.status)}`} />
                </div>
                <div className="text-xs space-y-1">
                  <div>Status: <span className={getStatusColor(health.status)}>{health.status}</span></div>
                  {health.lastRun && (
                    <div>Last: {format(new Date(health.lastRun), 'pp')}</div>
                  )}
                  {health.confidence !== undefined && (
                    <div>Confidence: {(health.confidence * 100).toFixed(0)}%</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Changes */}
      {data.recentChanges && data.recentChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Data Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentChanges.slice(0, 10).map((change, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {change.change_type === 'new' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {change.change_type === 'updated' && <RefreshCw className="h-4 w-4 text-blue-500" />}
                    {change.change_type === 'removed' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    <span className="text-sm">
                      {change.provider_name}/{change.model_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {change.change_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(change.created_at), 'pp')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Data Collection Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">{data.disclaimer.message}</p>

            <div>
              <h4 className="font-semibold text-sm mb-2">Data Sources:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {data.disclaimer.sources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Limitations:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {data.disclaimer.limitations.map((limitation, index) => (
                  <li key={index}>{limitation}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}