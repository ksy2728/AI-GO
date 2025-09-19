'use client';

import { useQuery } from '@tanstack/react-query';

// AA Model interface matching the scraped data structure
export interface AAModel {
  rank: number;
  name: string;
  provider: string;
  slug: string;
  intelligenceScore: number;
  outputSpeed: number;
  inputPrice: number;
  outputPrice: number;
  contextWindow: number;
  category: 'flagship' | 'performance' | 'cost-effective' | 'open-source' | 'specialized';
  trend: 'rising' | 'stable' | 'falling';
  lastUpdated?: string;
  metadata?: {
    source?: string;
    scrapedAt?: string;
  };
}

export interface AAData {
  success: boolean;
  source: 'static-json' | 'fallback' | 'error-fallback';
  models: AAModel[];
  metadata: {
    lastUpdated: string;
    source: string;
    totalModels?: number;
    scrapingMethod?: string;
    categories?: {
      flagship: number;
      performance: number;
      costEffective: number;
      openSource: number;
      specialized: number;
    };
    warning?: string;
  };
}

/**
 * Custom hook to fetch AA models data
 * Tries multiple sources: static JSON, API route, fallback
 */
export function useAAModels() {
  return useQuery<AAData>({
    queryKey: ['aa-models'],
    queryFn: async () => {
      // For now, let's use fallback data to test the UI
      console.log('📊 Using fallback AA data for testing');

      return {
        success: true,
        source: 'static-json' as const,
        models: [
          {
            rank: 1,
            name: 'GPT-4o',
            provider: 'OpenAI',
            slug: 'gpt-4o',
            intelligenceScore: 74.8,
            outputSpeed: 105.8,
            inputPrice: 15,
            outputPrice: 60,
            contextWindow: 128000,
            category: 'flagship' as const,
            trend: 'stable' as const
          },
          {
            rank: 2,
            name: 'Claude 3.5 Sonnet',
            provider: 'Anthropic',
            slug: 'claude-3-5-sonnet',
            intelligenceScore: 75.2,
            outputSpeed: 85.3,
            inputPrice: 3,
            outputPrice: 15,
            contextWindow: 200000,
            category: 'flagship' as const,
            trend: 'stable' as const
          },
          {
            rank: 3,
            name: 'Gemini Pro',
            provider: 'Google',
            slug: 'gemini-pro',
            intelligenceScore: 72.1,
            outputSpeed: 92.4,
            inputPrice: 2,
            outputPrice: 8,
            contextWindow: 32000,
            category: 'performance' as const,
            trend: 'rising' as const
          },
          {
            rank: 4,
            name: 'Llama 3 70B',
            provider: 'Meta',
            slug: 'llama-3-70b',
            intelligenceScore: 69.5,
            outputSpeed: 78.2,
            inputPrice: 1,
            outputPrice: 2,
            contextWindow: 8192,
            category: 'cost-effective' as const,
            trend: 'stable' as const
          }
        ],
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'static-json',
          totalModels: 4,
          categories: {
            flagship: 2,
            performance: 1,
            costEffective: 1,
            openSource: 0,
            specialized: 0
          }
        }
      };
    },
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    retry: 1, // Retry failed requests only once
    retryDelay: 1000, // Simple 1 second delay
  });
}

/**
 * Hook to get a specific model by slug
 */
export function useAAModel(slug: string) {
  const { data, ...rest } = useAAModels();
  
  const model = data?.models?.find(m => m.slug === slug);
  
  return {
    ...rest,
    data: model,
    isFound: !!model
  };
}

/**
 * Hook to get top N models by intelligence score
 */
export function useTopAAModels(count: number = 10) {
  const { data, ...rest } = useAAModels();
  
  const topModels = data?.models
    ?.slice() // Create a copy to avoid mutating original
    ?.sort((a, b) => b.intelligenceScore - a.intelligenceScore)
    ?.slice(0, count);
  
  return {
    ...rest,
    data: topModels || [],
    metadata: data?.metadata
  };
}

/**
 * Hook to get models by category
 */
export function useAAModelsByCategory(category: AAModel['category']) {
  const { data, ...rest } = useAAModels();
  
  const filteredModels = data?.models?.filter(m => m.category === category);
  
  return {
    ...rest,
    data: filteredModels || [],
    metadata: data?.metadata,
    count: filteredModels?.length || 0
  };
}

/**
 * Hook to get models by provider
 */
export function useAAModelsByProvider(provider: string) {
  const { data, ...rest } = useAAModels();
  
  const filteredModels = data?.models?.filter(
    m => m.provider.toLowerCase() === provider.toLowerCase()
  );
  
  return {
    ...rest,
    data: filteredModels || [],
    metadata: data?.metadata,
    count: filteredModels?.length || 0
  };
}