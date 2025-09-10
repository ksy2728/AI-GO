import { Model } from '@/types/models'
import { MAJOR_PROVIDERS } from '@/constants/models'

export interface UnifiedFilterOptions {
  provider?: string
  modality?: string
  capability?: string
  showMajorOnly?: boolean
  includeUnknown?: boolean
  searchQuery?: string
  isActive?: boolean
}

export function applyUnifiedFilters(
  models: Model[],
  filters: UnifiedFilterOptions
): Model[] {
  let filtered = [...models]

  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    filtered = filtered.filter(model =>
      model.name.toLowerCase().includes(query) ||
      model.description?.toLowerCase().includes(query) ||
      model.provider?.name?.toLowerCase().includes(query) ||
      model.providerId?.toLowerCase().includes(query)
    )
  }

  // Major providers only filter
  if (filters.showMajorOnly) {
    filtered = filtered.filter(model => {
      const providerId = model.provider?.id || model.providerId || ''
      return MAJOR_PROVIDERS.includes(providerId)
    })
  }

  // Include/exclude unknown status filter
  if (!filters.includeUnknown) {
    filtered = filtered.filter(model => {
      const status = getModelStatus(model)
      return status && status !== 'unknown'
    })
  }

  // Provider filter
  if (filters.provider) {
    filtered = filtered.filter(model =>
      (model.provider?.id || model.providerId) === filters.provider ||
      model.provider?.name === filters.provider
    )
  }

  // Modality filter
  if (filters.modality) {
    filtered = filtered.filter(model =>
      model.modalities?.includes(filters.modality!)
    )
  }

  // Capability filter
  if (filters.capability) {
    filtered = filtered.filter(model =>
      model.capabilities?.includes(filters.capability!)
    )
  }

  // Active models filter
  if (filters.isActive !== undefined) {
    filtered = filtered.filter(model =>
      model.isActive === filters.isActive
    )
  }

  return filtered
}

export function getModelStatus(model: Model): string {
  if (!model.status) return 'unknown'
  
  if (Array.isArray(model.status) && model.status.length > 0) {
    return model.status[0].status || 'unknown'
  }
  
  if (typeof model.status === 'string') {
    return model.status
  }
  
  if (typeof model.status === 'object' && 'status' in model.status) {
    return (model.status as any).status
  }
  
  return 'unknown'
}

export function getFilterSummary(
  filters: UnifiedFilterOptions,
  totalCount: number,
  filteredCount: number
): string {
  const parts: string[] = []

  if (filters.showMajorOnly) {
    parts.push('Major providers only')
  }

  if (filters.provider) {
    parts.push(`Provider: ${filters.provider}`)
  }

  if (filters.modality) {
    parts.push(`Modality: ${filters.modality}`)
  }

  if (filters.capability) {
    parts.push(`Capability: ${filters.capability}`)
  }

  if (!filters.includeUnknown) {
    parts.push('Excluding unknown status')
  }

  if (filters.searchQuery) {
    parts.push(`Search: "${filters.searchQuery}"`)
  }

  if (parts.length === 0) {
    return `Showing all ${totalCount} models`
  }

  return `${filteredCount} of ${totalCount} models (${parts.join(', ')})`
}

export function getActiveFilterCount(filters: UnifiedFilterOptions): number {
  let count = 0
  
  if (filters.provider) count++
  if (filters.modality) count++
  if (filters.capability) count++
  if (filters.searchQuery) count++
  if (!filters.showMajorOnly) count++ // Count when NOT default
  if (filters.includeUnknown) count++ // Count when NOT default
  if (filters.isActive !== undefined) count++
  
  return count
}

export const DEFAULT_FILTERS: UnifiedFilterOptions = {
  showMajorOnly: false,  // Changed to show all providers including AA models
  includeUnknown: true,   // Changed to include models without status
  searchQuery: '',
  isActive: undefined,
  provider: undefined,
  modality: undefined,
  capability: undefined,
}