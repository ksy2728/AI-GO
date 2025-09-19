'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  X,
  Home,
  Activity,
  Server,
  BarChart3,
  Newspaper,
  TrendingUp,
  Settings,
  HelpCircle,
  Globe,
  User,
  Bell,
  ChevronRight
} from 'lucide-react'

interface DrawerNavigationProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const primaryNavItems = [
  { key: 'dashboard', href: '/', icon: Home, label: 'Dashboard' },
  { key: 'models', href: '/models', icon: Server, label: 'AI Models', badge: 'New' },
  { key: 'monitoring', href: '/monitoring', icon: Activity, label: 'Monitoring' },
  { key: 'benchmarks', href: '/benchmarks', icon: BarChart3, label: 'Benchmarks' },
  { key: 'news', href: '/news', icon: Newspaper, label: 'News' },
  { key: 'pricing', href: '/pricing', icon: TrendingUp, label: 'Pricing' },
]

const secondaryNavItems = [
  { key: 'settings', href: '/settings', icon: Settings, label: 'Settings' },
  { key: 'help', href: '/help', icon: HelpCircle, label: 'Help & Support' },
  { key: 'profile', href: '/profile', icon: User, label: 'Profile' },
  { key: 'notifications', href: '/notifications', icon: Bell, label: 'Notifications', badge: 3 },
]

export function DrawerNavigation({
  isOpen,
  onClose,
  className
}: DrawerNavigationProps) {
  const { t } = useLanguage()
  const pathname = usePathname()

  // Close drawer when route changes
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-GO
              </h2>
              <p className="text-xs text-gray-500 -mt-1">Global AI Monitor</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 touch-manipulation"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto">
          {/* System Status */}
          <div className="p-4 bg-green-50 border-b border-green-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-700 font-medium">System Operational</span>
            </div>
            <p className="text-xs text-green-600 mt-1">All services running normally</p>
          </div>

          {/* Primary Navigation */}
          <nav className="p-4">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Main Navigation
              </h3>
              <div className="space-y-1">
                {primaryNavItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between w-full p-3 rounded-xl transition-all duration-200 touch-manipulation group',
                        isActive
                          ? 'bg-blue-100 text-blue-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={cn(
                          'w-5 h-5',
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        )} />
                        <span className="font-medium">{t(`navigation.${item.key}`) || item.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge
                            variant={isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className={cn(
                          'w-4 h-4 transition-transform',
                          'group-hover:translate-x-0.5',
                          isActive ? 'text-blue-600' : 'text-gray-400'
                        )} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Secondary Navigation */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Account & Settings
              </h3>
              <div className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between w-full p-3 rounded-xl transition-all duration-200 touch-manipulation group',
                        isActive
                          ? 'bg-blue-100 text-blue-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={cn(
                          'w-5 h-5',
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        )} />
                        <span className="font-medium">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {typeof item.badge === 'number' && item.badge > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className={cn(
                          'w-4 h-4 transition-transform',
                          'group-hover:translate-x-0.5',
                          isActive ? 'text-blue-600' : 'text-gray-400'
                        )} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-2">Language</div>
            <LanguageSelector />
          </div>

          <div className="text-xs text-gray-500">
            <div className="flex items-center justify-between mb-1">
              <span>Version 1.0.1</span>
              <span>© 2024 AI-GO</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}