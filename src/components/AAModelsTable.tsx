'use client';

import React from 'react';
import { useAAModels, type AAModel } from '@/hooks/useAAModels';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle,
  Zap,
  DollarSign,
  Brain,
  Package
} from 'lucide-react';

/**
 * Component to display AA models in a table format
 */
export function AAModelsTable() {
  const { data, isLoading, error, isError } = useAAModels();

  if (isLoading) {
    return <AAModelsTableSkeleton />;
  }

  if (isError) {
    return <AAModelsError error={error} />;
  }

  if (!data?.models || data.models.length === 0) {
    return <AAModelsEmpty />;
  }

  return (
    <div className="space-y-4">
      {/* Metadata Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Last updated: {new Date(data.metadata.lastUpdated).toLocaleString()}
          </span>
          <Badge variant={data.source === 'static-json' ? 'default' : 'secondary'}>
            {data.source === 'static-json' ? 'Live Data' : 'Fallback Data'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span>{data.models.length} models</span>
        </div>
      </div>

      {/* Warning if using fallback */}
      {data.metadata.warning && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{data.metadata.warning}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Model</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Provider</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                <div className="flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  Intelligence
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Speed
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Price ($/1M)
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.models
              .sort((a, b) => a.rank - b.rank) // Sort by rank ascending
              .map((model) => (
                <AAModelRow key={`${model.slug}-${model.rank}`} model={model} />
              ))}
          </tbody>
        </table>
      </div>

      {/* Categories Summary */}
      {data.metadata.categories && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(data.metadata.categories).map(([category, count]) => (
            <div key={category} className="p-3 rounded-lg border text-center">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {category.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual model row component
 */
function AAModelRow({ model }: { model: AAModel }) {
  const getCategoryColor = (category: AAModel['category']) => {
    switch (category) {
      case 'flagship':
        return 'default';
      case 'performance':
        return 'secondary';
      case 'cost-effective':
        return 'outline';
      case 'open-source':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTrendIcon = (trend: AAModel['trend']) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'falling':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getIntelligenceColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 65) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium">
        #{model.rank}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{model.name}</div>
        <div className="text-xs text-muted-foreground">
          {model.contextWindow.toLocaleString()} tokens
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {model.provider}
      </td>
      <td className="px-4 py-3">
        <span className={`font-semibold ${getIntelligenceColor(model.intelligenceScore)}`}>
          {model.intelligenceScore.toFixed(1)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        {model.outputSpeed.toFixed(0)} tok/s
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="space-y-1">
          <div>In: ${model.inputPrice.toFixed(2)}</div>
          <div>Out: ${model.outputPrice.toFixed(2)}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={getCategoryColor(model.category)}>
          {model.category}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {getTrendIcon(model.trend)}
          <span className="text-xs text-muted-foreground">
            {model.trend}
          </span>
        </div>
      </td>
    </tr>
  );
}

/**
 * Loading skeleton
 */
function AAModelsTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="rounded-lg border">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Error state
 */
function AAModelsError({ error }: { error: Error | null }) {
  return (
    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <div>
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            Failed to load AA models
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error?.message || 'An unexpected error occurred while loading the data.'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state
 */
function AAModelsEmpty() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-semibold text-lg mb-2">No models available</h3>
      <p className="text-sm text-muted-foreground">
        AA models data is not available at the moment. Please try again later.
      </p>
    </div>
  );
}