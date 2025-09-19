'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useMobileNavigation } from '@/hooks/useMobileNavigation'

interface MobileNavigationContextType {
  isMobile: boolean
  isDrawerOpen: boolean
  activeBottomTab: string
  showFAB: boolean
  isExpanded: Record<string, boolean>
  toggleDrawer: () => void
  closeDrawer: () => void
  toggleFAB: (show?: boolean) => void
  toggleExpanded: (key: string) => void
  handleScroll: (scrollY: number, deltaY: number) => void
}

const MobileNavigationContext = createContext<MobileNavigationContextType | undefined>(undefined)

interface MobileNavigationProviderProps {
  children: React.ReactNode
}

export function MobileNavigationProvider({ children }: MobileNavigationProviderProps) {
  const mobileNav = useMobileNavigation()

  return (
    <MobileNavigationContext.Provider value={mobileNav}>
      {children}
    </MobileNavigationContext.Provider>
  )
}

export function useMobileNavigationContext() {
  const context = useContext(MobileNavigationContext)
  if (context === undefined) {
    throw new Error('useMobileNavigationContext must be used within a MobileNavigationProvider')
  }
  return context
}