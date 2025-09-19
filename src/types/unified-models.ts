// Unified Models Type Definitions
// Implements the comprehensive model integration system

export type DataSource = 'artificial-analysis' | 'database' | 'hybrid';

export interface AaMetrics {
  intelligence?: number;     // 0~100 AA intelligence score
  speed?: number;            // tokens/s relative speed (higher = faster)
  rank?: number;             // AA ranking (1 is best)
  inputPrice?: number;       // Price per 1M input tokens
  outputPrice?: number;      // Price per 1M output tokens
  contextWindow?: number;    // Context window size
  category?: string;         // AA category classification
  trend?: string;           // Performance trend
  lastUpdated?: string;     // Last AA update timestamp
}

export interface DbMetrics {
  status?: 'operational' | 'degraded' | 'down' | 'unknown';
  availability?: number;     // Uptime percentage
  incidents?: number;        // Recent incidents count
  benchmarks?: Record<string, number>; // e.g., mmlu, arena scores
  price?: {
    input: number;
    output: number;
    currency?: string;
  };
  latency?: {
    p50?: number;
    p95?: number;
    p99?: number;
  };
  usage?: number;           // Usage metrics
  updatedAt?: string;       // Last DB update
  region?: string;          // Service region
}

export interface UnifiedModel {
  // Core identification
  id: string;                // Unique identifier (provider:name slug)
  slug: string;             // URL-safe identifier
  name: string;             // Display name
  provider: string;         // Provider name
  providerId?: string;      // Provider ID reference
  description?: string;     // Model description

  // Data source tracking
  source: DataSource;       // Primary data source indicator

  // Metrics containers
  aa?: AaMetrics;           // AA-specific metrics
  db?: DbMetrics;           // Database-specific metrics

  // Unified display fields (computed from aa/db)
  intelligence?: number;    // Primary intelligence score
  speed?: number;          // Primary speed metric
  priceInput?: number;     // Input price (per 1M tokens)
  priceOutput?: number;    // Output price (per 1M tokens)
  status?: DbMetrics['status']; // Operational status
  availability?: number;    // Availability percentage
  contextWindow?: number;   // Context window size

  // Additional model metadata
  modalities?: string[];    // Supported modalities (text, image, etc.)
  capabilities?: string[];  // Model capabilities
  foundationModel?: string; // Base model name
  releasedAt?: string;     // Release date
  isActive?: boolean;      // Active status

  // Computed fields for sorting/display
  rankScore?: number;      // Combined ranking score
  lastUpdated?: string;    // Most recent update timestamp
  relevance?: number;      // Search relevance score
}

export interface UnifiedModelFilters {
  provider?: string;
  status?: string;
  source?: DataSource;
  modality?: string;
  capability?: string;
  priceRange?: { min?: number; max?: number };
  intelligenceRange?: { min?: number; max?: number };
  speedRange?: { min?: number; max?: number };
  isActive?: boolean;
  query?: string;          // Search query
  // Additional filter options
  aaOnly?: boolean;        // Filter to only Artificial Analysis models
  dbOnly?: boolean;        // Filter to only database models
  minIntelligence?: number;    // Minimum intelligence score
  maxIntelligence?: number;    // Maximum intelligence score
  minSpeed?: number;          // Minimum speed score
  maxSpeed?: number;          // Maximum speed score
}

export interface UnifiedModelResponse {
  models: UnifiedModel[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  timestamp: string;
  dataSource: string;
  cached?: boolean;
  fallbackReason?: string; // If fallback was used
}

// Sorting configuration
export interface SortConfig {
  field: keyof UnifiedModel;
  direction: 'asc' | 'desc';
}

export const DEFAULT_SORT: SortConfig[] = [
  { field: 'rankScore', direction: 'asc' },
  { field: 'intelligence', direction: 'desc' },
  { field: 'availability', direction: 'desc' },
  { field: 'speed', direction: 'desc' }
];

// Status weights for sorting
export const STATUS_WEIGHTS: Record<string, number> = {
  operational: 4,
  degraded: 2,
  unknown: 1,
  down: 0
};

// Export utility functions for model processing
export const createModelId = (provider: string, name: string): string => {
  return `${provider}:${name}`.toLowerCase().replace(/[^a-z0-9:]/g, '-');
};

export const normalizeProviderName = (provider: string): string => {
  return provider.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
};