import { Model } from './models'

export interface FilterOptions {
  provider?: string
  modality?: string
  capability?: string
  showMajorOnly?: boolean
  includeUnknown?: boolean
  searchQuery?: string
  isActive?: boolean
}

export interface GlobalStats {
  totalModels: number
  activeModels: number
  operationalModels: number
  degradedModels: number
  outageModels: number
  avgAvailability: number
  byProvider: Record<string, {
    total: number
    operational: number
    degraded: number
    outage: number
  }>
  byStatus: {
    operational: number
    degraded: number
    outage: number
    unknown: number
  }
  lastUpdated: string
}

export interface ModelsContextType {
  // Data
  models: Model[]
  filteredModels: Model[]
  globalStats: GlobalStats | null
  
  // Loading states
  loading: boolean
  error: string | null
  dataSource: 'github' | 'database' | 'temp-data' | 'cache'
  
  // Filters
  filters: FilterOptions
  setFilters: (filters: FilterOptions) => void
  resetFilters: () => void
  
  // Actions
  refreshModels: () => Promise<void>
  refreshStats: () => Promise<void>
  
  // Utilities
  getFilteredCount: () => number
  getTotalCount: () => number
  getProviders: () => string[]
  getModalities: () => string[]
}