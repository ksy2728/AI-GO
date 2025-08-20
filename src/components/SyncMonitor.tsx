'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw,
  Zap,
  XCircle
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface SyncMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  lastError: string | null;
  cacheSize: number;
  hitRate: string;
  rateLimited: boolean;
  lastSync: {
    priority: string;
    active: string;
    full: string;
    github: string;
  };
}

export default function SyncMonitor() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInstance = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to sync monitor');
      setConnected(true);
      // Request initial metrics
      socketInstance.emit('sync:metrics');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from sync monitor');
      setConnected(false);
    });

    // Listen for metrics updates
    socketInstance.on('sync:metrics:response', (data: SyncMetrics) => {
      setMetrics(data);
      setLastUpdate(new Date());
    });

    socketInstance.on('sync:metrics:broadcast', (data: SyncMetrics) => {
      setMetrics(data);
      setLastUpdate(new Date());
    });

    // Listen for sync events
    socketInstance.on('sync:priority', () => {
      setSyncing(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleForceSync = () => {
    if (socket && connected) {
      setSyncing(true);
      socket.emit('sync:force', { models: [] }); // Empty array means sync all priority models
    }
  };

  const handleClearCache = () => {
    if (socket && connected) {
      socket.emit('sync:clear-cache');
      // Request updated metrics
      setTimeout(() => {
        socket.emit('sync:metrics');
      }, 500);
    }
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getOverallStatus = () => {
    if (!metrics) return 'unknown';
    if (metrics.rateLimited) return 'error';
    if (metrics.errors > 10) return 'error';
    if (metrics.errors > 5) return 'warning';
    if (parseFloat(metrics.hitRate) < 50) return 'warning';
    return 'good';
  };

  if (!metrics) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading sync metrics...</span>
        </div>
      </Card>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${overallStatus === 'good' ? 'bg-green-100' : overallStatus === 'warning' ? 'bg-yellow-100' : 'bg-red-100'}`}>
              {overallStatus === 'good' ? (
                <CheckCircle className={`h-6 w-6 ${getStatusColor('good')}`} />
              ) : overallStatus === 'warning' ? (
                <AlertCircle className={`h-6 w-6 ${getStatusColor('warning')}`} />
              ) : (
                <XCircle className={`h-6 w-6 ${getStatusColor('error')}`} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">Sync Monitor</h2>
              <p className="text-sm text-gray-500">
                {connected ? (
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Disconnected</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleForceSync}
              disabled={!connected || syncing}
              size="sm"
              variant="outline"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Force Sync
                </>
              )}
            </Button>
            <Button
              onClick={handleClearCache}
              disabled={!connected}
              size="sm"
              variant="outline"
            >
              <Database className="h-4 w-4 mr-1" />
              Clear Cache
            </Button>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Calls */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">API Calls</p>
              <p className="text-2xl font-semibold">{metrics.apiCalls.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        {/* Cache Hit Rate */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cache Hit Rate</p>
              <p className="text-2xl font-semibold">{metrics.hitRate}</p>
              <Progress 
                value={parseFloat(metrics.hitRate)} 
                className="mt-2 h-2"
              />
            </div>
            <Zap className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        {/* Errors */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Errors</p>
              <p className={`text-2xl font-semibold ${metrics.errors > 0 ? 'text-red-500' : ''}`}>
                {metrics.errors}
              </p>
              {metrics.lastError && (
                <p className="text-xs text-red-400 mt-1 truncate" title={metrics.lastError}>
                  {metrics.lastError}
                </p>
              )}
            </div>
            <AlertCircle className={`h-8 w-8 ${metrics.errors > 0 ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
        </Card>

        {/* Cache Size */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cache Size</p>
              <p className="text-2xl font-semibold">{metrics.cacheSize}</p>
              <div className="flex items-center mt-1">
                {metrics.rateLimited && (
                  <Badge variant="destructive" className="text-xs">
                    Rate Limited
                  </Badge>
                )}
              </div>
            </div>
            <Database className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Last Sync Times */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Last Sync Times
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Priority Models</p>
            <p className="font-medium">{getTimeSince(metrics.lastSync.priority)}</p>
            <p className="text-xs text-gray-400">Every 5 minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Models</p>
            <p className="font-medium">{getTimeSince(metrics.lastSync.active)}</p>
            <p className="text-xs text-gray-400">Every 30 minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Full Sync</p>
            <p className="font-medium">{getTimeSince(metrics.lastSync.full)}</p>
            <p className="text-xs text-gray-400">Every 6 hours</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">GitHub Backup</p>
            <p className="font-medium">{getTimeSince(metrics.lastSync.github)}</p>
            <p className="text-xs text-gray-400">Every 1 hour</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Cache Hits</span>
            <span className="font-medium">{metrics.cacheHits.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Cache Misses</span>
            <span className="font-medium">{metrics.cacheMisses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total Requests</span>
            <span className="font-medium">
              {(metrics.cacheHits + metrics.cacheMisses).toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Last Update */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}