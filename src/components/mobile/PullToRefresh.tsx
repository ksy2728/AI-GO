'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void> | void
  refreshingText?: string
  pullText?: string
  releaseText?: string
  threshold?: number
  className?: string
  disabled?: boolean
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  threshold = 80,
  className,
  disabled = false
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [shouldRefresh, setShouldRefresh] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number>(0)
  const lastTouchY = useRef<number>(0)
  const isAtTop = useRef<boolean>(true)

  // Check if scroll is at top
  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return

    const scrollTop = containerRef.current.scrollTop || window.pageYOffset || document.documentElement.scrollTop
    isAtTop.current = scrollTop <= 0
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return

    checkScrollPosition()

    if (isAtTop.current) {
      touchStartY.current = e.touches[0].clientY
      lastTouchY.current = e.touches[0].clientY
    }
  }, [disabled, isRefreshing, checkScrollPosition])

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop.current) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - touchStartY.current

    // Only allow pull down when at top of page
    if (deltaY > 0) {
      e.preventDefault() // Prevent page scroll

      const distance = Math.min(deltaY * 0.6, threshold * 1.5) // Elastic effect
      setPullDistance(distance)

      setShouldRefresh(distance >= threshold)
    }

    lastTouchY.current = currentY
  }, [disabled, isRefreshing, threshold])

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return

    if (shouldRefresh && pullDistance >= threshold) {
      setIsRefreshing(true)

      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    // Reset states
    setPullDistance(0)
    setShouldRefresh(false)
    touchStartY.current = 0
    lastTouchY.current = 0
  }, [disabled, isRefreshing, shouldRefresh, pullDistance, threshold, onRefresh])

  // Setup event listeners
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    // Check if device supports touch
    if (!('ontouchstart' in window)) return

    const options = { passive: false }

    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd)
    element.addEventListener('scroll', checkScrollPosition, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('scroll', checkScrollPosition)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, checkScrollPosition])

  // Calculate progress
  const progress = Math.min((pullDistance / threshold) * 100, 100)

  // Determine status text
  const getStatusText = () => {
    if (isRefreshing) return refreshingText
    if (shouldRefresh) return releaseText
    return pullText
  }

  // Determine indicator state
  const getIndicatorState = () => {
    if (isRefreshing) return 'refreshing'
    if (shouldRefresh) return 'ready'
    if (pullDistance > 0) return 'pulling'
    return 'idle'
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-auto touch-pan-x touch-pan-y',
        className
      )}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none'
      }}
    >
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-10 flex items-center justify-center transition-all duration-200',
          'bg-gradient-to-b from-blue-50 to-transparent border-b border-blue-100',
          pullDistance > 0 ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${Math.min(pullDistance, threshold + 20)}px`,
          transform: `translateY(-${Math.max(threshold + 20 - pullDistance, 0)}px)`
        }}
      >
        <div className="flex flex-col items-center gap-2 py-2">
          {/* Loading spinner/icon */}
          <div className="relative">
            <RefreshCw
              className={cn(
                'w-5 h-5 text-blue-600 transition-transform duration-200',
                getIndicatorState() === 'refreshing' && 'animate-spin',
                getIndicatorState() === 'ready' && 'scale-110',
                getIndicatorState() === 'pulling' && pullDistance > threshold / 2 && 'rotate-180'
              )}
            />

            {/* Progress ring */}
            <svg
              className="absolute -inset-1 w-7 h-7"
              viewBox="0 0 28 28"
            >
              <circle
                cx="14"
                cy="14"
                r="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-200"
              />
              <circle
                cx="14"
                cy="14"
                r="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-blue-600 transition-all duration-100"
                style={{
                  strokeDasharray: '75.36',
                  strokeDashoffset: 75.36 - (progress / 100) * 75.36,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '14px 14px'
                }}
              />
            </svg>
          </div>

          {/* Status text */}
          <span className="text-xs font-medium text-blue-600">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={cn(pullDistance > 0 && 'pointer-events-none')}>
        {children}
      </div>

      {/* Refreshing overlay */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-blue-50/80 backdrop-blur-sm py-3 flex items-center justify-center border-b border-blue-200">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-600">
              {refreshingText}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}