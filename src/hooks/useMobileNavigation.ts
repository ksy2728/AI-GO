'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface MobileNavigationState {
  isDrawerOpen: boolean
  activeBottomTab: string
  showFAB: boolean
  isExpanded: Record<string, boolean>
}

export function useMobileNavigation() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [state, setState] = useState<MobileNavigationState>({
    isDrawerOpen: false,
    activeBottomTab: '/',
    showFAB: true,
    isExpanded: {}
  })

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update active tab based on pathname
  useEffect(() => {
    setState(prev => ({
      ...prev,
      activeBottomTab: pathname
    }))
  }, [pathname])

  // Handle drawer toggle
  const toggleDrawer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDrawerOpen: !prev.isDrawerOpen
    }))
  }, [])

  // Handle drawer close
  const closeDrawer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDrawerOpen: false
    }))
  }, [])

  // Handle FAB visibility
  const toggleFAB = useCallback((show?: boolean) => {
    setState(prev => ({
      ...prev,
      showFAB: show ?? !prev.showFAB
    }))
  }, [])

  // Handle expandable sections
  const toggleExpanded = useCallback((key: string) => {
    setState(prev => ({
      ...prev,
      isExpanded: {
        ...prev.isExpanded,
        [key]: !prev.isExpanded[key]
      }
    }))
  }, [])

  // Handle scroll events to hide/show navigation
  const handleScroll = useCallback((scrollY: number, deltaY: number) => {
    // Hide FAB when scrolling down, show when scrolling up
    if (deltaY > 10) {
      toggleFAB(false)
    } else if (deltaY < -10) {
      toggleFAB(true)
    }
  }, [toggleFAB])

  return {
    isMobile,
    isDrawerOpen: state.isDrawerOpen,
    activeBottomTab: state.activeBottomTab,
    showFAB: state.showFAB,
    isExpanded: state.isExpanded,
    toggleDrawer,
    closeDrawer,
    toggleFAB,
    toggleExpanded,
    handleScroll
  }
}