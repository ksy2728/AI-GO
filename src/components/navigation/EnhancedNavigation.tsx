'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { BottomNavigationBar } from './BottomNavigationBar'
import { DrawerNavigation } from './DrawerNavigation'
import { FloatingActionButton } from '../mobile/FloatingActionButton'
import { useMobileNavigationContext } from './MobileNavigationProvider'
import {
  Activity,
  BarChart3,
  Server,
  Globe,
  Newspaper,
  Menu,
  X,
  Home,
  TrendingUp,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'

const navigationKeys = [
  { key: 'dashboard', href: '/', icon: Home },
  { key: 'monitoring', href: '/monitoring', icon: Activity },
  { key: 'models', href: '/models', icon: Server },
  { key: 'benchmarks', href: '/benchmarks', icon: BarChart3 },
  { key: 'news', href: '/news', icon: Newspaper },
  { key: 'pricing', href: '/pricing', icon: TrendingUp },
]

interface EnhancedNavigationProps {
  onSearchOpen?: () => void
  onFilterOpen?: () => void
  onRefresh?: () => void
}

export function EnhancedNavigation({
  onSearchOpen,
  onFilterOpen,
  onRefresh
}: EnhancedNavigationProps) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const {
    isMobile,
    isDrawerOpen,
    toggleDrawer,
    closeDrawer,
    showFAB
  } = useMobileNavigationContext()

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      {/* Desktop/Tablet Navigation Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI-GO
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">Global AI Monitor</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navigationKeys.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{t(`navigation.${item.key}`)}</span>
                  </Link>
                )
              })}
            </div>

            {/* System Status and Controls */}
            <div className="flex items-center space-x-2 min-w-0">
              {/* System Status - Hidden on mobile */}
              <div className="hidden md:flex items-center space-x-1 text-xs min-w-0">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-gray-600 truncate whitespace-nowrap">
                  {t('navigation.systemStatus')}
                </span>
              </div>

              {/* Language Selector - Hidden on mobile */}
              <div className="hidden md:block">
                <LanguageSelector />
              </div>

              {/* Mobile menu button / Drawer toggle */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isMobile ? toggleDrawer : () => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {(isMobile ? isDrawerOpen : mobileMenuOpen) ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tablet Mobile Navigation (fallback for tablets) */}
          {mobileMenuOpen && !isMobile && (
            <div className="lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
                {navigationKeys.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{t(`navigation.${item.key}`)}</span>
                    </Link>
                  )
                })}
                <div className="pt-4 mt-4 border-t">
                  <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{t('navigation.systemStatus')}</span>
                  </div>
                  <div className="px-3 py-2">
                    <LanguageSelector />
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Mobile Navigation Components */}
      {isMobile && (
        <>
          {/* Drawer Navigation */}
          <DrawerNavigation
            isOpen={isDrawerOpen}
            onClose={closeDrawer}
          />

          {/* Bottom Navigation Bar */}
          <BottomNavigationBar
            onSearchOpen={onSearchOpen}
            onFilterOpen={onFilterOpen}
          />

          {/* Floating Action Button */}
          <FloatingActionButton
            onSearchAction={onSearchOpen}
            onFilterAction={onFilterOpen}
            onRefreshAction={onRefresh}
            isVisible={showFAB}
          />
        </>
      )}
    </>
  )
}