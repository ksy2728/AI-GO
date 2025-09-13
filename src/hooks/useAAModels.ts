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
      // Strategy 1: Try to fetch from CDN/static JSON (fastest)
      try {
        const staticResponse = await fetch('/data/aa-models.json', {
          cache: 'force-cache',
          next: { revalidate: 3600 } // Next.js cache for 1 hour
        } as RequestInit);
        
        if (staticResponse.ok) {
          const data = await staticResponse.json();
          console.log('📊 AA data loaded from static JSON');
          return {
            success: true,
            source: 'static-json' as const,
            models: data.models || [],
            metadata: data.metadata || {
              lastUpdated: new Date().toISOString(),
              source: 'static-json'
            }
          };
        }
      } catch (error) {
        console.warn('Static JSON not available, trying API route:', error);
      }
      
      // Strategy 2: Fetch from API route (includes fallback)
      try {
        const apiResponse = await fetch('/api/v1/aa-sync', {
          cache: 'no-store' // Always fetch fresh from API
        });
        
        if (!apiResponse.ok) {
          throw new Error(`API returned ${apiResponse.status}`);
        }
        
        const data = await apiResponse.json();
        console.log(`📊 AA data loaded from API (source: ${data.source})`);
        return data;
        
      } catch (error) {
        console.error('Failed to fetch AA models:', error);
        
        // Strategy 3: Return minimal fallback data
        return {
          success: false,
          source: 'error-fallback' as const,
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
            }
          ],
          metadata: {
            lastUpdated: new Date().toISOString(),
            source: 'error-fallback',
            totalModels: 2,
            warning: 'Failed to load live data. Showing minimal fallback.'
          }
        };
      }
    },
    staleTime: 1000 * 60 * 60, // Consider data stale after 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: 'always', // Refetch when reconnecting
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
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