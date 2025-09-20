'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useSwipeGestures } from '@/hooks/useSwipeGestures'
import { cn } from '@/lib/utils'

interface SwipeNavigationWrapperProps {
  children: React.ReactNode
  className?: string
  enableSwipeNavigation?: boolean
}

// Define the navigation order
const navigationOrder = [
  '/',           // Dashboard
  '/models',     // Models
  '/monitoring', // Monitoring
  '/benchmarks', // Benchmarks
  '/news',       // News
  '/pricing'     // Pricing
]

export function SwipeNavigationWrapper({
  children,
  className,
  enableSwipeNavigation = true
}: SwipeNavigationWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Find current page index
  const currentIndex = pathname ? navigationOrder.indexOf(pathname) : -1

  // Handle swipe navigation
  const handleSwipeLeft = () => {
    if (!enableSwipeNavigation || currentIndex === -1) return

    // Navigate to next page
    const nextIndex = currentIndex + 1
    if (nextIndex < navigationOrder.length) {
      router.push(navigationOrder[nextIndex])
    }
  }

  const handleSwipeRight = () => {
    if (!enableSwipeNavigation || currentIndex === -1) return

    // Navigate to previous page
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      router.push(navigationOrder[prevIndex])
    }
  }

  // Don't enable swipe navigation on desktop
  const shouldEnableSwipe = enableSwipeNavigation &&
    typeof window !== 'undefined' &&
    window.innerWidth < 768

  const swipeRef = useSwipeGestures({
    onSwipeLeft: shouldEnableSwipe ? handleSwipeLeft : undefined,
    onSwipeRight: shouldEnableSwipe ? handleSwipeRight : undefined,
    threshold: 100, // Require 100px swipe
    preventDefault: false // Don't prevent default to allow normal scrolling
  })

  return (
    <div
      ref={shouldEnableSwipe ? swipeRef as React.RefObject<HTMLDivElement> : null}
      className={cn(
        'min-h-screen w-full',
        shouldEnableSwipe && 'touch-pan-y', // Allow vertical panning for scrolling
        className
      )}
    >
      {/* Swipe Indicators (only on mobile) */}
      {shouldEnableSwipe && currentIndex !== -1 && (
        <div className="fixed top-1/2 left-0 right-0 z-10 pointer-events-none">
          {/* Previous page indicator */}
          {currentIndex > 0 && (
            <div className="absolute left-2 transform -translate-y-1/2 opacity-30">
              <div className="bg-black text-white px-2 py-1 rounded text-xs">
                ← {getPageName(navigationOrder[currentIndex - 1])}
              </div>
            </div>
          )}

          {/* Next page indicator */}
          {currentIndex < navigationOrder.length - 1 && (
            <div className="absolute right-2 transform -translate-y-1/2 opacity-30">
              <div className="bg-black text-white px-2 py-1 rounded text-xs">
                {getPageName(navigationOrder[currentIndex + 1])} →
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Dots (only on mobile) */}
      {shouldEnableSwipe && (
        <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex gap-2 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full">
            {navigationOrder.map((route, index) => (
              <div
                key={route}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === currentIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/40'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {children}
    </div>
  )
}

// Helper function to get readable page names
function getPageName(route: string): string {
  const pageNames: Record<string, string> = {
    '/': 'Dashboard',
    '/models': 'Models',
    '/monitoring': 'Monitor',
    '/benchmarks': 'Benchmarks',
    '/news': 'News',
    '/pricing': 'Pricing'
  }

  return pageNames[route] || route.replace('/', '').replace('-', ' ')
}