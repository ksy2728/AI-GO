'use client'

import { useState, useCallback, useMemo } from 'react'

interface ProgressiveDisclosureOptions {
  initiallyExpanded?: string[]
  maxExpandedItems?: number
  autoCollapse?: boolean
}

export function useProgressiveDisclosure(options: ProgressiveDisclosureOptions = {}) {
  const {
    initiallyExpanded = [],
    maxExpandedItems = Infinity,
    autoCollapse = false
  } = options

  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(initiallyExpanded)
  )
  const [priorityItems, setPriorityItems] = useState<string[]>([])

  // Toggle expansion state of an item
  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)

      if (newSet.has(itemId)) {
        // Collapse item
        newSet.delete(itemId)
      } else {
        // Expand item
        if (newSet.size >= maxExpandedItems) {
          if (autoCollapse && newSet.size > 0) {
            // Auto-collapse oldest expanded item
            const firstItem = Array.from(newSet)[0]
            newSet.delete(firstItem)
          } else {
            // Don't expand if at max limit
            return prev
          }
        }
        newSet.add(itemId)
      }

      return newSet
    })
  }, [maxExpandedItems, autoCollapse])

  // Expand specific item
  const expandItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      if (prev.has(itemId)) return prev

      const newSet = new Set(prev)

      if (newSet.size >= maxExpandedItems) {
        if (autoCollapse && newSet.size > 0) {
          const firstItem = Array.from(newSet)[0]
          newSet.delete(firstItem)
        } else {
          return prev
        }
      }

      newSet.add(itemId)
      return newSet
    })
  }, [maxExpandedItems, autoCollapse])

  // Collapse specific item
  const collapseItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(itemId)
      return newSet
    })
  }, [])

  // Collapse all items
  const collapseAll = useCallback(() => {
    setExpandedItems(new Set())
  }, [])

  // Expand priority items only
  const expandPriorityItems = useCallback(() => {
    setExpandedItems(new Set(priorityItems.slice(0, maxExpandedItems)))
  }, [priorityItems, maxExpandedItems])

  // Set priority items for smart disclosure
  const setPriority = useCallback((items: string[]) => {
    setPriorityItems(items)
  }, [])

  // Check if item is expanded
  const isExpanded = useCallback((itemId: string) => {
    return expandedItems.has(itemId)
  }, [expandedItems])

  // Get count of expanded items
  const expandedCount = useMemo(() => expandedItems.size, [expandedItems])

  // Check if can expand more items
  const canExpandMore = useMemo(() =>
    expandedCount < maxExpandedItems,
    [expandedCount, maxExpandedItems]
  )

  // Get expanded items as array
  const expandedList = useMemo(() => Array.from(expandedItems), [expandedItems])

  // Smart expand based on priority and context
  const smartExpand = useCallback((context?: 'mobile' | 'desktop' | 'tablet') => {
    let itemsToExpand: string[]

    if (context === 'mobile') {
      // On mobile, expand only top priority items
      itemsToExpand = priorityItems.slice(0, Math.min(2, maxExpandedItems))
    } else if (context === 'tablet') {
      // On tablet, expand more items
      itemsToExpand = priorityItems.slice(0, Math.min(4, maxExpandedItems))
    } else {
      // Desktop - expand based on max limit
      itemsToExpand = priorityItems.slice(0, maxExpandedItems)
    }

    setExpandedItems(new Set(itemsToExpand))
  }, [priorityItems, maxExpandedItems])

  return {
    // State
    expandedItems: expandedList,
    expandedCount,
    canExpandMore,
    priorityItems,

    // Actions
    toggleExpanded,
    expandItem,
    collapseItem,
    collapseAll,
    expandPriorityItems,
    smartExpand,
    setPriority,
    isExpanded
  }
}