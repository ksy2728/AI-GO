'use client'

import React, { useState, useCallback, useRef, useEffect, useRef as useGestureRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Sparkles,
  Clock,
  X,
  TrendingUp,
  Zap,
  DollarSign,
  Settings2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchFilters, SearchSort, SearchPreset } from '@/services/smart-search.service'

interface SmartSearchInputProps {
  onSearch: (query: string, filters?: SearchFilters, sort?: SearchSort) => void
  onClear?: () => void
  loading?: boolean
  suggestions?: string[]
  presets?: SearchPreset[]
  recentSearches?: string[]
}

export function SmartSearchInput({
  onSearch,
  onClear,
  loading = false,
  suggestions = [],
  presets = [],
  recentSearches = []
}: SmartSearchInputProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({})
  const [sortConfig, setSortConfig] = useState<SearchSort>({ field: 'intelligence', direction: 'desc' })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const sliderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Handle search
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim(), activeFilters, sortConfig)
      setShowSuggestions(false)
      // Save to recent searches would go here
    }
  }, [query, activeFilters, sortConfig, onSearch])

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }, [handleSearch])

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    onSearch(suggestion, activeFilters, sortConfig)
  }

  // Handle preset click
  const handlePresetClick = (preset: SearchPreset) => {
    setActiveFilters(preset.filters)
    if (preset.sort) {
      setSortConfig(preset.sort)
    }
    if (query) {
      onSearch(query, preset.filters, preset.sort)
    }
  }

  // Handle clear
  const handleClear = () => {
    setQuery('')
    setActiveFilters({})
    setSortConfig({ field: 'intelligence', direction: 'desc' })
    setShowSuggestions(false)
    onClear?.()
  }

  // Count active filters
  const activeFilterCount = Object.values(activeFilters).filter(value => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0
    return value !== undefined
  }).length

  // Quick filter presets
  const quickFilters = [
    {
      name: 'Best Performance',
      icon: <TrendingUp className="w-4 h-4" />,
      filters: {},
      sort: { field: 'intelligence' as const, direction: 'desc' as const }
    },
    {
      name: 'Fastest',
      icon: <Zap className="w-4 h-4" />,
      filters: {},
      sort: { field: 'speed' as const, direction: 'desc' as const }
    },
    {
      name: 'Most Affordable',
      icon: <DollarSign className="w-4 h-4" />,
      filters: {},
      sort: { field: 'priceInput' as const, direction: 'asc' as const }
    }
  ]

  // Touch gesture handlers
  const handleTouchSlider = useCallback((key: string, value: number[], onChange: (values: number[]) => void) => {
    const sliderElement = sliderRefs.current[key]
    if (!sliderElement) return

    let startX = 0
    let isDragging = false
    let currentIndex = 0

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      startX = e.touches[0].clientX
      isDragging = true

      const rect = sliderElement.getBoundingClientRect()
      const relativeX = startX - rect.left
      const percentage = Math.max(0, Math.min(1, relativeX / rect.width))

      if (value.length === 2) {
        const midPoint = rect.width / 2
        currentIndex = relativeX < midPoint ? 0 : 1
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const rect = sliderElement.getBoundingClientRect()
      const currentX = e.touches[0].clientX
      const relativeX = currentX - rect.left
      const percentage = Math.max(0, Math.min(1, relativeX / rect.width))

      if (key === 'intelligence') {
        const newValue = Math.round(percentage * 100)
        const newValues = [...value]
        newValues[currentIndex] = newValue
        if (newValues[0] <= newValues[1]) {
          onChange(newValues)
        }
      } else if (key === 'price') {
        const newValue = Math.round(percentage * 50 * 2) / 2 // 0.5 step
        const newValues = [...value]
        newValues[currentIndex] = newValue
        if (newValues[0] <= newValues[1]) {
          onChange(newValues)
        }
      }
    }

    const handleTouchEnd = () => {
      isDragging = false
    }

    sliderElement.addEventListener('touchstart', handleTouchStart, { passive: false })
    sliderElement.addEventListener('touchmove', handleTouchMove, { passive: false })
    sliderElement.addEventListener('touchend', handleTouchEnd)

    return () => {
      sliderElement.removeEventListener('touchstart', handleTouchStart)
      sliderElement.removeEventListener('touchmove', handleTouchMove)
      sliderElement.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Swipe gesture for filter expansion
  const handleFilterSwipe = useCallback(() => {
    let startY = 0
    let startTime = 0

    const handleTouchStart = (e: React.TouchEvent | TouchEvent) => {
      startY = e.touches[0].clientY
      startTime = Date.now()
    }

    const handleTouchEnd = (e: React.TouchEvent | TouchEvent) => {
      const endY = e.changedTouches[0].clientY
      const endTime = Date.now()
      const deltaY = startY - endY
      const deltaTime = endTime - startTime

      // Swipe up to expand, swipe down to collapse
      if (Math.abs(deltaY) > 50 && deltaTime < 300) {
        if (deltaY > 0 && !isFilterExpanded) {
          setIsFilterExpanded(true)
        } else if (deltaY < 0 && isFilterExpanded) {
          setIsFilterExpanded(false)
        }
      }
    }

    return { handleTouchStart, handleTouchEnd }
  }, [isFilterExpanded])

  const { handleTouchStart: filterTouchStart, handleTouchEnd: filterTouchEnd } = handleFilterSwipe()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="w-full space-y-3 md:space-y-4">
      {/* Search Input */}
      <div className="relative" ref={inputRef}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search models... (e.g., 'fast OpenAI models')"
              className="pl-10 pr-10 h-11 sm:h-12 text-base touch-manipulation"
              disabled={loading}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="flex gap-2 sm:gap-2">
            {/* Mobile: Collapsible Filter Button */}
            <div className="sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                onTouchStart={filterTouchStart}
                onTouchEnd={filterTouchEnd}
                className="h-11 px-3 min-w-0 touch-manipulation flex items-center"
              >
                <Filter className="w-4 h-4 mr-1" />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                {isFilterExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
            </div>

            {/* Desktop: Popover Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex h-12 px-4 min-w-0 touch-manipulation"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end" side="bottom">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between sticky top-0 bg-white pb-2">
                  <h4 className="font-medium">Advanced Filters</h4>
                  <button
                    onClick={() => setActiveFilters({})}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                </div>

                {/* Provider Filter */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Providers</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['openai', 'anthropic', 'google', 'meta', 'microsoft'].map(provider => (
                      <div key={provider} className="flex items-center space-x-2 touch-manipulation">
                        <Checkbox
                          id={provider}
                          checked={activeFilters.providers?.includes(provider) || false}
                          onCheckedChange={(checked) => {
                            const providers = activeFilters.providers || []
                            if (checked) {
                              setActiveFilters(prev => ({
                                ...prev,
                                providers: [...providers, provider]
                              }))
                            } else {
                              setActiveFilters(prev => ({
                                ...prev,
                                providers: providers.filter(p => p !== provider)
                              }))
                            }
                          }}
                        />
                        <label
                          htmlFor={provider}
                          className="text-sm capitalize cursor-pointer touch-manipulation py-1"
                        >
                          {provider}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Intelligence Range */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Intelligence Score</label>
                  <div className="px-2 touch-manipulation">
                    {/* Touch-optimized range controls */}
                    <div className="mb-3">
                      <div
                        ref={(el) => { sliderRefs.current['intelligence'] = el }}
                        className="relative h-6 bg-gray-200 rounded-full cursor-pointer touch-manipulation"
                        style={{ touchAction: 'none' }}
                      >
                        <div
                          className="absolute top-0 h-6 bg-blue-500 rounded-full transition-all"
                          style={{
                            left: `${((activeFilters.performanceRange?.intelligence?.min || 0) / 100) * 100}%`,
                            right: `${100 - ((activeFilters.performanceRange?.intelligence?.max || 100) / 100) * 100}%`
                          }}
                        />
                        <div
                          className="absolute top-1 left-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transform -translate-x-2"
                          style={{ left: `${((activeFilters.performanceRange?.intelligence?.min || 0) / 100) * 100}%` }}
                        />
                        <div
                          className="absolute top-1 right-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transform translate-x-2"
                          style={{ right: `${100 - ((activeFilters.performanceRange?.intelligence?.max || 100) / 100) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Touch-friendly increment/decrement buttons */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={() => {
                            const currentMin = activeFilters.performanceRange?.intelligence?.min || 0
                            if (currentMin > 0) {
                              setActiveFilters(prev => ({
                                ...prev,
                                performanceRange: {
                                  ...prev.performanceRange,
                                  intelligence: {
                                    min: currentMin - 5,
                                    max: activeFilters.performanceRange?.intelligence?.max || 100
                                  }
                                }
                              }))
                            }
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-mono w-8 text-center">
                          {activeFilters.performanceRange?.intelligence?.min || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={() => {
                            const currentMin = activeFilters.performanceRange?.intelligence?.min || 0
                            const currentMax = activeFilters.performanceRange?.intelligence?.max || 100
                            if (currentMin < currentMax - 5) {
                              setActiveFilters(prev => ({
                                ...prev,
                                performanceRange: {
                                  ...prev.performanceRange,
                                  intelligence: { min: currentMin + 5, max: currentMax }
                                }
                              }))
                            }
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={() => {
                            const currentMax = activeFilters.performanceRange?.intelligence?.max || 100
                            const currentMin = activeFilters.performanceRange?.intelligence?.min || 0
                            if (currentMax > currentMin + 5) {
                              setActiveFilters(prev => ({
                                ...prev,
                                performanceRange: {
                                  ...prev.performanceRange,
                                  intelligence: { min: currentMin, max: currentMax - 5 }
                                }
                              }))
                            }
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-mono w-8 text-center">
                          {activeFilters.performanceRange?.intelligence?.max || 100}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={() => {
                            const currentMax = activeFilters.performanceRange?.intelligence?.max || 100
                            if (currentMax < 100) {
                              setActiveFilters(prev => ({
                                ...prev,
                                performanceRange: {
                                  ...prev.performanceRange,
                                  intelligence: {
                                    min: activeFilters.performanceRange?.intelligence?.min || 0,
                                    max: currentMax + 5
                                  }
                                }
                              }))
                            }
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                      <span>Min: {activeFilters.performanceRange?.intelligence?.min || 0}</span>
                      <span>Max: {activeFilters.performanceRange?.intelligence?.max || 100}</span>
                    </div>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Price Range ($/1M tokens)</label>
                  <div className="px-2 touch-manipulation">
                    {/* Touch-optimized price range controls */}
                    <div className="mb-3">
                      <div
                        ref={(el) => { sliderRefs.current['price'] = el }}
                        className="relative h-6 bg-gray-200 rounded-full cursor-pointer touch-manipulation"
                        style={{ touchAction: 'none' }}
                      >
                        <div
                          className="absolute top-0 h-6 bg-green-500 rounded-full transition-all"
                          style={{
                            left: `${((activeFilters.priceRange?.min || 0) / 50) * 100}%`,
                            right: `${100 - ((activeFilters.priceRange?.max || 50) / 50) * 100}%`
                          }}
                        />
                        <div
                          className="absolute top-1 left-0 w-4 h-4 bg-white border-2 border-green-500 rounded-full shadow-md transform -translate-x-2"
                          style={{ left: `${((activeFilters.priceRange?.min || 0) / 50) * 100}%` }}
                        />
                        <div
                          className="absolute top-1 right-0 w-4 h-4 bg-white border-2 border-green-500 rounded-full shadow-md transform translate-x-2"
                          style={{ right: `${100 - ((activeFilters.priceRange?.max || 50) / 50) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Touch-friendly price increment/decrement buttons */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={() => {
                            const currentMin = activeFilters.priceRange?.min || 0
                            if (currentMin > 0) {
                              setActiveFilters(prev => ({
                                ...prev,
                                priceRange: {
                                  min: Math.max(0, currentMin - 1),
                                  max: activeFilters.priceRange?.max || 50,
                                  type: 'input'
                                }
                              }))
                            }
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-mono w-10 text-center">
                          ${activeFilters.priceRange?.min || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={() => {
                            const currentMin = activeFilters.priceRange?.min || 0
                            const currentMax = activeFilters.priceRange?.max || 50
                            if (currentMin < currentMax - 1) {
                              setActiveFilters(prev => ({
                                ...prev,
                                priceRange: {
                                  min: currentMin + 1,
                                  max: currentMax,
                                  type: 'input'
                                }
                              }))
                            }
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={() => {
                            const currentMax = activeFilters.priceRange?.max || 50
                            const currentMin = activeFilters.priceRange?.min || 0
                            if (currentMax > currentMin + 1) {
                              setActiveFilters(prev => ({
                                ...prev,
                                priceRange: {
                                  min: currentMin,
                                  max: currentMax - 1,
                                  type: 'input'
                                }
                              }))
                            }
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-mono w-10 text-center">
                          ${activeFilters.priceRange?.max || 50}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={() => {
                            const currentMax = activeFilters.priceRange?.max || 50
                            if (currentMax < 50) {
                              setActiveFilters(prev => ({
                                ...prev,
                                priceRange: {
                                  min: activeFilters.priceRange?.min || 0,
                                  max: currentMax + 1,
                                  type: 'input'
                                }
                              }))
                            }
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                      <span>Min: ${activeFilters.priceRange?.min || 0}</span>
                      <span>Max: ${activeFilters.priceRange?.max || 50}</span>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

            {/* Sort Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 sm:h-12 px-3 sm:px-4 min-w-0 touch-manipulation"
                >
                  <Settings2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sort</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-0 sm:ml-1" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { field: 'intelligence', label: 'Intelligence', icon: <TrendingUp className="w-4 h-4" /> },
                { field: 'speed', label: 'Speed', icon: <Zap className="w-4 h-4" /> },
                { field: 'priceInput', label: 'Price', icon: <DollarSign className="w-4 h-4" /> },
                { field: 'contextWindow', label: 'Context Window', icon: <Search className="w-4 h-4" /> }
              ].map(({ field, label, icon }) => (
                <DropdownMenuItem
                  key={field}
                  onClick={() => setSortConfig({
                    field: field as SearchSort['field'],
                    direction: 'desc'
                  })}
                  className="flex items-center"
                >
                  {icon}
                  <span className="ml-2">{label}</span>
                  {sortConfig.field === field && (
                    <Badge variant="secondary" className="ml-auto">
                      {sortConfig.direction === 'desc' ? '↓' : '↑'}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="h-11 sm:h-12 px-4 sm:px-6 min-w-0 touch-manipulation"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0 || presets.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-3 border-b">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Smart Suggestions
                </h4>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Search Presets */}
            {presets.length > 0 && (
              <div className="p-3 border-b">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Bookmark className="w-4 h-4 mr-1" />
                  Saved Searches
                </h4>
                {presets.slice(0, 3).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset)}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded"
                  >
                    <div className="font-medium">{preset.name}</div>
                    {preset.description && (
                      <div className="text-gray-500 text-xs">{preset.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Recent Searches
                </h4>
                {recentSearches.slice(0, 3).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded text-gray-600"
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Expanded Filters */}
      {isFilterExpanded && (
        <div className="sm:hidden border border-gray-200 rounded-lg p-4 bg-white shadow-lg animate-in slide-in-from-top-2">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b">
              <h4 className="font-medium text-base">Filters</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilters({})}
                  className="text-sm text-gray-500 hover:text-gray-700 touch-manipulation p-2"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterExpanded(false)}
                  className="text-gray-500 hover:text-gray-700 touch-manipulation p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Provider Filter - Mobile optimized */}
            <div>
              <label className="text-sm font-medium mb-3 block">Providers</label>
              <div className="grid grid-cols-1 gap-3">
                {['openai', 'anthropic', 'google', 'meta', 'microsoft'].map(provider => (
                  <label
                    key={provider}
                    className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer touch-manipulation active:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      checked={activeFilters.providers?.includes(provider) || false}
                      onCheckedChange={(checked) => {
                        const providers = activeFilters.providers || []
                        if (checked) {
                          setActiveFilters(prev => ({
                            ...prev,
                            providers: [...providers, provider]
                          }))
                        } else {
                          setActiveFilters(prev => ({
                            ...prev,
                            providers: providers.filter(p => p !== provider)
                          }))
                        }
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-base capitalize font-medium">
                      {provider}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Intelligence Range - Mobile optimized */}
            <div>
              <label className="text-sm font-medium mb-3 block">Intelligence Score</label>
              <div className="space-y-4">
                {/* Visual Range Display */}
                <div className="px-2">
                  <div
                    ref={(el) => { sliderRefs.current['mobile-intelligence'] = el }}
                    className="relative h-8 bg-gray-200 rounded-full cursor-pointer touch-manipulation"
                    style={{ touchAction: 'none' }}
                  >
                    <div
                      className="absolute top-0 h-8 bg-blue-500 rounded-full transition-all"
                      style={{
                        left: `${((activeFilters.performanceRange?.intelligence?.min || 0) / 100) * 100}%`,
                        right: `${100 - ((activeFilters.performanceRange?.intelligence?.max || 100) / 100) * 100}%`
                      }}
                    />
                    <div
                      className="absolute top-2 left-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transform -translate-x-2"
                      style={{ left: `${((activeFilters.performanceRange?.intelligence?.min || 0) / 100) * 100}%` }}
                    />
                    <div
                      className="absolute top-2 right-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transform translate-x-2"
                      style={{ right: `${100 - ((activeFilters.performanceRange?.intelligence?.max || 100) / 100) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Touch Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Min</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 touch-manipulation"
                        onClick={() => {
                          const currentMin = activeFilters.performanceRange?.intelligence?.min || 0
                          if (currentMin > 0) {
                            setActiveFilters(prev => ({
                              ...prev,
                              performanceRange: {
                                ...prev.performanceRange,
                                intelligence: {
                                  min: Math.max(0, currentMin - 5),
                                  max: activeFilters.performanceRange?.intelligence?.max || 100
                                }
                              }
                            }))
                          }
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-mono w-12 text-center border rounded px-2 py-1">
                        {activeFilters.performanceRange?.intelligence?.min || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 touch-manipulation"
                        onClick={() => {
                          const currentMin = activeFilters.performanceRange?.intelligence?.min || 0
                          const currentMax = activeFilters.performanceRange?.intelligence?.max || 100
                          if (currentMin < currentMax - 5) {
                            setActiveFilters(prev => ({
                              ...prev,
                              performanceRange: {
                                ...prev.performanceRange,
                                intelligence: { min: Math.min(95, currentMin + 5), max: currentMax }
                              }
                            }))
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Max</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 touch-manipulation"
                        onClick={() => {
                          const currentMax = activeFilters.performanceRange?.intelligence?.max || 100
                          const currentMin = activeFilters.performanceRange?.intelligence?.min || 0
                          if (currentMax > currentMin + 5) {
                            setActiveFilters(prev => ({
                              ...prev,
                              performanceRange: {
                                ...prev.performanceRange,
                                intelligence: { min: currentMin, max: Math.max(5, currentMax - 5) }
                              }
                            }))
                          }
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-mono w-12 text-center border rounded px-2 py-1">
                        {activeFilters.performanceRange?.intelligence?.max || 100}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 touch-manipulation"
                        onClick={() => {
                          const currentMax = activeFilters.performanceRange?.intelligence?.max || 100
                          if (currentMax < 100) {
                            setActiveFilters(prev => ({
                              ...prev,
                              performanceRange: {
                                ...prev.performanceRange,
                                intelligence: {
                                  min: activeFilters.performanceRange?.intelligence?.min || 0,
                                  max: Math.min(100, currentMax + 5)
                                }
                              }
                            }))
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Range - Mobile optimized */}
            <div>
              <label className="text-sm font-medium mb-3 block">Price Range ($/1M tokens)</label>
              <div className="space-y-4">
                {/* Visual Range Display */}
                <div className="px-2">
                  <div
                    ref={(el) => { sliderRefs.current['mobile-price'] = el }}
                    className="relative h-8 bg-gray-200 rounded-full cursor-pointer touch-manipulation"
                    style={{ touchAction: 'none' }}
                  >
                    <div
                      className="absolute top-0 h-8 bg-green-500 rounded-full transition-all"
                      style={{
                        left: `${((activeFilters.priceRange?.min || 0) / 50) * 100}%`,
                        right: `${100 - ((activeFilters.priceRange?.max || 50) / 50) * 100}%`
                      }}
                    />
                    <div
                      className="absolute top-2 left-0 w-4 h-4 bg-white border-2 border-green-500 rounded-full shadow-md transform -translate-x-2"
                      style={{ left: `${((activeFilters.priceRange?.min || 0) / 50) * 100}%` }}
                    />
                    <div
                      className="absolute top-2 right-0 w-4 h-4 bg-white border-2 border-green-500 rounded-full shadow-md transform translate-x-2"
                      style={{ right: `${100 - ((activeFilters.priceRange?.max || 50) / 50) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Touch Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Min</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 touch-manipulation"
                        onClick={() => {
                          const currentMin = activeFilters.priceRange?.min || 0
                          if (currentMin > 0) {
                            setActiveFilters(prev => ({
                              ...prev,
                              priceRange: {
                                min: Math.max(0, currentMin - 1),
                                max: activeFilters.priceRange?.max || 50,
                                type: 'input'
                              }
                            }))
                          }
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-mono w-14 text-center border rounded px-2 py-1">
                        ${activeFilters.priceRange?.min || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 touch-manipulation"
                        onClick={() => {
                          const currentMin = activeFilters.priceRange?.min || 0
                          const currentMax = activeFilters.priceRange?.max || 50
                          if (currentMin < currentMax - 1) {
                            setActiveFilters(prev => ({
                              ...prev,
                              priceRange: {
                                min: Math.min(49, currentMin + 1),
                                max: currentMax,
                                type: 'input'
                              }
                            }))
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Max</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 touch-manipulation"
                        onClick={() => {
                          const currentMax = activeFilters.priceRange?.max || 50
                          const currentMin = activeFilters.priceRange?.min || 0
                          if (currentMax > currentMin + 1) {
                            setActiveFilters(prev => ({
                              ...prev,
                              priceRange: {
                                min: currentMin,
                                max: Math.max(1, currentMax - 1),
                                type: 'input'
                              }
                            }))
                          }
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-mono w-14 text-center border rounded px-2 py-1">
                        ${activeFilters.priceRange?.max || 50}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 touch-manipulation"
                        onClick={() => {
                          const currentMax = activeFilters.priceRange?.max || 50
                          if (currentMax < 50) {
                            setActiveFilters(prev => ({
                              ...prev,
                              priceRange: {
                                min: activeFilters.priceRange?.min || 0,
                                max: Math.min(50, currentMax + 1),
                                type: 'input'
                              }
                            }))
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={() => {
                  if (query) {
                    onSearch(query, activeFilters, sortConfig)
                  }
                  setIsFilterExpanded(false)
                }}
                className="w-full h-12 text-base touch-manipulation"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <span className="text-sm text-gray-600 font-medium hidden sm:block">Quick filters:</span>
        <div className="flex items-center gap-2 flex-wrap">
          {quickFilters.map((filter) => (
            <Button
              key={filter.name}
              variant={sortConfig.field === filter.sort.field ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSortConfig(filter.sort)
                setActiveFilters(filter.filters)
                if (query) {
                  onSearch(query, filter.filters, filter.sort)
                }
              }}
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm touch-manipulation"
            >
              {filter.icon}
              <span className="ml-1 sm:ml-2">{filter.name}</span>
            </Button>
          ))}

          {(activeFilterCount > 0 || query) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm text-gray-500 hover:text-gray-700 touch-manipulation"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
export default SmartSearchInput
