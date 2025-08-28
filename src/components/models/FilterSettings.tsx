'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useModels } from '@/contexts/ModelsContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Filter, Settings, X } from 'lucide-react'

export function FilterSettings() {
  const { t } = useLanguage()
  const { 
    filters, 
    setFilters, 
    resetFilters,
    getProviders,
    getModalities,
    getFilteredCount,
    getTotalCount
  } = useModels()
  
  const [isOpen, setIsOpen] = useState(false)

  const providers = getProviders()
  const modalities = getModalities()
  const filteredCount = getFilteredCount()
  const totalCount = getTotalCount()

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const activeFilterCount = () => {
    let count = 0
    if (filters.provider) count++
    if (filters.modality) count++
    if (filters.searchQuery) count++
    if (!filters.showMajorOnly) count++
    if (filters.includeUnknown) count++
    return count
  }

  return (
    <>
      {/* Filter Button */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {t('models.filter') || 'Filters'}
          {activeFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {activeFilterCount()}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 z-50 w-96 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('models.filterSettings') || 'Filter Settings'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">{t('models.search') || 'Search'}</Label>
              <Input
                id="search"
                type="text"
                placeholder={t('models.searchPlaceholder') || 'Search models...'}
                value={filters.searchQuery || ''}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>

            {/* Provider Filter */}
            <div className="space-y-2">
              <Label htmlFor="provider">{t('models.provider') || 'Provider'}</Label>
              <Select
                value={filters.provider || 'all'}
                onValueChange={(value) => handleFilterChange('provider', value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('models.allProviders') || 'All Providers'}</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modality Filter */}
            <div className="space-y-2">
              <Label htmlFor="modality">{t('models.modality') || 'Modality'}</Label>
              <Select
                value={filters.modality || 'all'}
                onValueChange={(value) => handleFilterChange('modality', value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="modality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('models.allModalities') || 'All Modalities'}</SelectItem>
                  {modalities.map(modality => (
                    <SelectItem key={modality} value={modality}>
                      {modality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="major-only" className="text-sm">
                  {t('models.showMajorOnly') || 'Show Major Providers Only'}
                </Label>
                <Switch
                  id="major-only"
                  checked={filters.showMajorOnly}
                  onCheckedChange={(checked) => handleFilterChange('showMajorOnly', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-unknown" className="text-sm">
                  {t('models.includeUnknown') || 'Include Unknown Status'}
                </Label>
                <Switch
                  id="include-unknown"
                  checked={filters.includeUnknown}
                  onCheckedChange={(checked) => handleFilterChange('includeUnknown', checked)}
                />
              </div>
            </div>

            {/* Filter Summary */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Showing {filteredCount} of {totalCount} models
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  disabled={activeFilterCount() === 0}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}