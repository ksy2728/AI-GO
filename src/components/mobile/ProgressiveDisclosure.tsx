'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

interface DisclosureItem {
  id: string
  title: string
  content: React.ReactNode
  priority: 'high' | 'medium' | 'low'
  category?: string
  preview?: React.ReactNode
}

interface ProgressiveDisclosureProps {
  items: DisclosureItem[]
  maxVisibleItems?: number
  className?: string
  autoCollapseOnMobile?: boolean
  showToggleAll?: boolean
}

export function ProgressiveDisclosure({
  items,
  maxVisibleItems,
  className,
  autoCollapseOnMobile = true,
  showToggleAll = true
}: ProgressiveDisclosureProps) {
  const [showAll, setShowAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  })

  // Determine max items based on screen size and settings
  const getMaxItems = () => {
    if (!maxVisibleItems) return items.length

    if (isMobile && autoCollapseOnMobile) {
      return Math.min(3, maxVisibleItems)
    }

    return maxVisibleItems
  }

  // Sort items by priority and category
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]

      if (priorityDiff !== 0) return priorityDiff

      // If same priority, sort by category
      if (a.category && b.category) {
        return a.category.localeCompare(b.category)
      }

      return 0
    })
  }, [items])

  // Get priority items for smart disclosure
  const priorityItems = sortedItems
    .filter(item => item.priority === 'high')
    .map(item => item.id)

  const {
    expandedItems,
    toggleExpanded,
    collapseAll,
    smartExpand,
    isExpanded
  } = useProgressiveDisclosure({
    initiallyExpanded: priorityItems.slice(0, isMobile ? 1 : 3),
    maxExpandedItems: isMobile ? 2 : 5,
    autoCollapse: true
  })

  // Items to display
  const maxItems = getMaxItems()
  const visibleItems = showAll ? sortedItems : sortedItems.slice(0, maxItems)
  const hiddenCount = sortedItems.length - visibleItems.length

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, DisclosureItem[]> = {}

    visibleItems.forEach(item => {
      const category = item.category || 'General'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
    })

    return groups
  }, [visibleItems])

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'border-blue-200 bg-blue-50'
      case 'medium':
        return 'border-gray-200 bg-gray-50'
      case 'low':
        return 'border-gray-200 bg-gray-25'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      {showToggleAll && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-700">
              Information Sections
            </h3>
            <Badge variant="outline" className="text-xs">
              {expandedItems.length} expanded
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => smartExpand(isMobile ? 'mobile' : 'desktop')}
              className="text-xs"
            >
              Smart View
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="text-xs"
            >
              <EyeOff className="w-3 h-3 mr-1" />
              Collapse All
            </Button>
          </div>
        </div>
      )}

      {/* Grouped Content */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="space-y-2">
          {Object.keys(groupedItems).length > 1 && (
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {category}
            </h4>
          )}

          {categoryItems.map((item) => {
            const expanded = isExpanded(item.id)

            return (
              <div
                key={item.id}
                className={cn(
                  'border rounded-lg transition-all duration-200',
                  getPriorityColor(item.priority)
                )}
              >
                {/* Header */}
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-black/5 transition-colors touch-manipulation"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            item.priority === 'high' && 'border-blue-200 text-blue-700',
                            item.priority === 'medium' && 'border-gray-200 text-gray-700',
                            item.priority === 'low' && 'border-gray-200 text-gray-500'
                          )}
                        >
                          {item.priority}
                        </Badge>
                      </div>

                      {/* Preview content when collapsed */}
                      {!expanded && item.preview && (
                        <div className="text-xs text-gray-600">
                          {item.preview}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* Content */}
                {expanded && (
                  <div className="px-3 pb-3 border-t border-gray-200/50">
                    <div className="pt-3">
                      {item.content}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Show More/Less */}
      {hiddenCount > 0 && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-sm"
          >
            {showAll ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show {hiddenCount} More Items
              </>
            )}
          </Button>
        </div>
      )}

      {/* Mobile Optimization Notice */}
      {isMobile && autoCollapseOnMobile && (
        <div className="text-xs text-gray-500 text-center p-2 bg-blue-50 rounded border border-blue-200">
          Content optimized for mobile viewing
        </div>
      )}
    </div>
  )
}

// Specialized version for model details
interface ModelProgressiveDisclosureProps {
  model: {
    name: string
    description?: string
    capabilities?: string[]
    benchmarks?: Record<string, any>
    pricing?: Record<string, any>
    specifications?: Record<string, any>
  }
  className?: string
}

export function ModelProgressiveDisclosure({
  model,
  className
}: ModelProgressiveDisclosureProps) {
  const items = ([
    {
      id: 'overview',
      title: 'Model Overview',
      priority: 'high',
      category: 'Basic Info',
      preview: model.description && model.description.slice(0, 100) + '...',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">{model.description}</p>
        </div>
      )
    },
    {
      id: 'capabilities',
      title: 'Capabilities',
      priority: 'high',
      category: 'Features',
      preview: model.capabilities && `${model.capabilities.length} capabilities`,
      content: (
        <div className="space-y-2">
          {model.capabilities?.map((capability, index) => (
            <Badge key={index} variant="outline" className="mr-2 mb-2">
              {capability}
            </Badge>
          ))}
        </div>
      )
    },
    {
      id: 'benchmarks',
      title: 'Benchmark Results',
      priority: 'medium',
      category: 'Performance',
      preview: model.benchmarks && `${Object.keys(model.benchmarks).length} benchmarks`,
      content: (
        <div className="space-y-2">
          {model.benchmarks && Object.entries(model.benchmarks).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">{key}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'pricing',
      title: 'Pricing Details',
      priority: 'medium',
      category: 'Cost',
      preview: 'View pricing information',
      content: (
        <div className="space-y-2">
          {model.pricing && Object.entries(model.pricing).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">{key}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'specifications',
      title: 'Technical Specifications',
      priority: 'low',
      category: 'Technical',
      preview: 'View technical details',
      content: (
        <div className="space-y-2">
          {model.specifications && Object.entries(model.specifications).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">{key}</span>
              <span className="text-sm font-mono text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      )
    }
  ] as DisclosureItem[]).filter(item => {
    // Only include items that have content
    if (item.id === 'overview') return !!model.description
    if (item.id === 'capabilities') return !!model.capabilities?.length
    if (item.id === 'benchmarks') return !!model.benchmarks
    if (item.id === 'pricing') return !!model.pricing
    if (item.id === 'specifications') return !!model.specifications
    return true
  })

  return (
    <ProgressiveDisclosure
      items={items}
      maxVisibleItems={3}
      autoCollapseOnMobile={true}
      className={className}
    />
  )
}