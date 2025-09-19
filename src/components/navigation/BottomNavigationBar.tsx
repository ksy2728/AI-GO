'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Activity,
  Server,
  BarChart3,
  Newspaper,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react'

interface NavigationItem {
  key: string
  href: string
  icon: typeof Home
  label: string
  badge?: number
}

const primaryNavItems: NavigationItem[] = [
  { key: 'dashboard', href: '/', icon: Home, label: 'Home' },
  { key: 'models', href: '/models', icon: Server, label: 'Models' },
  { key: 'monitoring', href: '/monitoring', icon: Activity, label: 'Monitor' },
  { key: 'news', href: '/news', icon: Newspaper, label: 'News' }
]

const secondaryNavItems: NavigationItem[] = [
  { key: 'benchmarks', href: '/benchmarks', icon: BarChart3, label: 'Benchmarks' },
  { key: 'pricing', href: '/pricing', icon: TrendingUp, label: 'Pricing' }
]

interface BottomNavigationBarProps {
  onSearchOpen?: () => void
  onFilterOpen?: () => void
  className?: string
}

export function BottomNavigationBar({
  onSearchOpen,
  onFilterOpen,
  className
}: BottomNavigationBarProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Handle scroll to show/hide navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
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

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 transition-transform duration-300 md:hidden',
        isVisible ? 'translate-y-0' : 'translate-y-full',
        className
      )}
    >
      <div className="grid grid-cols-5 h-16">
        {/* Primary Navigation Items */}
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center h-full touch-manipulation relative transition-colors',
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          )
        })}

        {/* More/Actions Button */}
        <button
          onClick={onFilterOpen}
          className={cn(
            'flex flex-col items-center justify-center h-full touch-manipulation transition-colors',
            'text-gray-600 hover:text-gray-900 active:bg-gray-100'
          )}
        >
          <Filter className="w-5 h-5" />
          <span className="text-xs mt-1 font-medium">More</span>
        </button>
      </div>

      {/* Quick Actions Overlay */}
      <div className="absolute bottom-full left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-2 transform transition-transform duration-300 translate-y-full">
        <div className="flex gap-2">
          <button
            onClick={onSearchOpen}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg touch-manipulation font-medium"
          >
            <Search className="w-4 h-4" />
            Quick Search
          </button>

          <div className="grid grid-cols-2 gap-2 flex-1">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center gap-1 px-3 py-3 rounded-lg touch-manipulation transition-colors text-sm font-medium',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}