'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, Search, Filter, RefreshCw } from 'lucide-react'

interface FloatingActionButtonProps {
  onMainAction?: () => void
  onSearchAction?: () => void
  onFilterAction?: () => void
  onRefreshAction?: () => void
  isVisible?: boolean
  className?: string
}

export function FloatingActionButton({
  onMainAction,
  onSearchAction,
  onFilterAction,
  onRefreshAction,
  isVisible = true,
  className
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [shouldShow, setShouldShow] = useState(true)

  // Handle scroll to show/hide FAB
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShouldShow(false)
        setIsExpanded(false)
      } else if (currentScrollY < lastScrollY) {
        setShouldShow(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Don't render on desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null
  }

  const fabVisible = isVisible && shouldShow

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 transition-all duration-300',
        fabVisible ? 'translate-x-0 opacity-100' : 'translate-x-16 opacity-0',
        className
      )}
    >
      {/* Secondary Action Buttons */}
      <div
        className={cn(
          'flex flex-col gap-2 transition-all duration-300 transform origin-bottom',
          isExpanded ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'
        )}
      >
        {onRefreshAction && (
          <Button
            size="icon"
            variant="outline"
            className="w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation border-0"
            onClick={() => {
              onRefreshAction()
              setIsExpanded(false)
            }}
            aria-label="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        )}

        {onFilterAction && (
          <Button
            size="icon"
            variant="outline"
            className="w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation border-0"
            onClick={() => {
              onFilterAction()
              setIsExpanded(false)
            }}
            aria-label="Open filters"
          >
            <Filter className="w-5 h-5" />
          </Button>
        )}

        {onSearchAction && (
          <Button
            size="icon"
            variant="outline"
            className="w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation border-0"
            onClick={() => {
              onSearchAction()
              setIsExpanded(false)
            }}
            aria-label="Open search"
          >
            <Search className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          'w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation',
          'bg-blue-600 hover:bg-blue-700 text-white',
          isExpanded && 'rotate-45'
        )}
        onClick={() => {
          if (onMainAction && !isExpanded) {
            onMainAction()
          } else {
            setIsExpanded(!isExpanded)
          }
        }}
        aria-label={isExpanded ? "Close actions" : "Open actions"}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Backdrop for expanded state */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}