'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  prefersReducedMotion,
  prefersHighContrast,
  isTouchDevice,
  isScreenReaderActive,
  announceToScreenReader,
  focusManager,
  FocusManager
} from '@/lib/accessibility'

interface AccessibilityState {
  reducedMotion: boolean
  highContrast: boolean
  touchDevice: boolean
  screenReader: boolean
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  announcements: boolean
}

interface AccessibilityContextType {
  state: AccessibilityState
  updateSettings: (settings: Partial<AccessibilityState>) => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  focusManager: FocusManager
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [state, setState] = useState<AccessibilityState>({
    reducedMotion: false,
    highContrast: false,
    touchDevice: false,
    screenReader: false,
    fontSize: 'medium',
    announcements: true
  })

  useEffect(() => {
    // Initialize accessibility state
    const initializeAccessibility = () => {
      setState(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion(),
        highContrast: prefersHighContrast(),
        touchDevice: isTouchDevice(),
        screenReader: isScreenReaderActive()
      }))
    }

    initializeAccessibility()

    // Listen for media query changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, reducedMotion: e.matches }))
    }

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, highContrast: e.matches }))
    }

    reducedMotionQuery.addListener(handleReducedMotionChange)
    highContrastQuery.addListener(handleHighContrastChange)

    return () => {
      reducedMotionQuery.removeListener(handleReducedMotionChange)
      highContrastQuery.removeListener(handleHighContrastChange)
    }
  }, [])

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement

    // Font size
    root.style.setProperty('--accessibility-font-size', {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      'extra-large': '1.25rem'
    }[state.fontSize])

    // Reduced motion
    if (state.reducedMotion) {
      root.style.setProperty('--transition-duration', '0.01ms')
      root.style.setProperty('--animation-duration', '0.01ms')
    } else {
      root.style.removeProperty('--transition-duration')
      root.style.removeProperty('--animation-duration')
    }

    // High contrast
    if (state.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Touch device
    if (state.touchDevice) {
      root.classList.add('touch-device')
    } else {
      root.classList.remove('touch-device')
    }

    // Screen reader
    if (state.screenReader) {
      root.classList.add('screen-reader')
    } else {
      root.classList.remove('screen-reader')
    }
  }, [state])

  const updateSettings = (settings: Partial<AccessibilityState>) => {
    setState(prev => ({ ...prev, ...settings }))

    // Announce changes
    if (settings.fontSize) {
      announceToScreenReader(`Font size changed to ${settings.fontSize}`)
    }
    if (settings.reducedMotion !== undefined) {
      announceToScreenReader(`Motion ${settings.reducedMotion ? 'reduced' : 'restored'}`)
    }
    if (settings.highContrast !== undefined) {
      announceToScreenReader(`High contrast ${settings.highContrast ? 'enabled' : 'disabled'}`)
    }
  }

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (state.announcements) {
      announceToScreenReader(message, priority)
    }
  }

  const value: AccessibilityContextType = {
    state,
    updateSettings,
    announce,
    focusManager
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

// Skip link component
export function SkipLink({ targetId, children }: { targetId: string; children: ReactNode }) {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link absolute -top-10 left-6 bg-black text-white px-3 py-2 rounded focus:top-6 transition-all duration-200 z-50"
      onFocus={() => {
        announceToScreenReader('Skip link focused')
      }}
    >
      {children}
    </a>
  )
}

// Accessible button component
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaPressed,
  ariaExpanded,
  className = '',
  ...props
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  ariaPressed?: boolean
  ariaExpanded?: boolean
  className?: string
  [key: string]: any
}) {
  const { state, announce } = useAccessibility()

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()

      // Announce button activation for screen readers
      if (state.screenReader && ariaLabel) {
        announce(`${ariaLabel} activated`)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <button
      className={`
        min-h-[44px] min-w-[44px]
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${state.touchDevice ? 'touch-target' : ''}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      {...props}
    >
      {children}
    </button>
  )
}

// Accessible form input
export function AccessibleInput({
  label,
  error,
  required = false,
  type = 'text',
  id,
  className = '',
  ...props
}: {
  label: string
  error?: string
  required?: boolean
  type?: string
  id: string
  className?: string
  [key: string]: any
}) {
  const { announce } = useAccessibility()
  const errorId = error ? `${id}-error` : undefined

  const handleInvalid = () => {
    if (error) {
      announce(`Error: ${error}`, 'assertive')
    }
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>

      <input
        id={id}
        type={type}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        onInvalid={handleInvalid}
        className={`
          min-h-[44px] w-full px-3 py-2 border border-gray-300 rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />

      {error && (
        <div
          id={errorId}
          className="text-sm text-red-600"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
    </div>
  )
}

// Accessible modal
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}) {
  const { focusManager, announce } = useAccessibility()

  useEffect(() => {
    if (!isOpen) return

    const modalElement = document.getElementById('modal-content')
    if (!modalElement) return

    // Announce modal opening
    announce(`Modal opened: ${title}`, 'assertive')

    // Trap focus within modal
    const cleanup = focusManager.trapFocus(modalElement, onClose)

    // Focus first focusable element
    const focusableElements = focusManager.getFocusableElements(modalElement)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    return () => {
      cleanup()
      announce('Modal closed', 'assertive')
    }
  }, [isOpen, title, focusManager, announce, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        id="modal-content"
        className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${className}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <AccessibleButton
              onClick={onClose}
              ariaLabel="Close modal"
              className="text-gray-400 hover:text-gray-600"
            >
              <span aria-hidden="true">×</span>
            </AccessibleButton>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// Accessibility settings panel
export function AccessibilitySettings() {
  const { state, updateSettings } = useAccessibility()

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold">Accessibility Settings</h3>

      {/* Font Size */}
      <div>
        <label htmlFor="font-size" className="block text-sm font-medium mb-2">
          Font Size
        </label>
        <select
          id="font-size"
          value={state.fontSize}
          onChange={(e) => updateSettings({ fontSize: e.target.value as AccessibilityState['fontSize'] })}
          className="min-h-[44px] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="extra-large">Extra Large</option>
        </select>
      </div>

      {/* Reduced Motion */}
      <div className="flex items-center">
        <input
          id="reduced-motion"
          type="checkbox"
          checked={state.reducedMotion}
          onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="reduced-motion" className="ml-2 text-sm">
          Reduce motion and animations
        </label>
      </div>

      {/* High Contrast */}
      <div className="flex items-center">
        <input
          id="high-contrast"
          type="checkbox"
          checked={state.highContrast}
          onChange={(e) => updateSettings({ highContrast: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="high-contrast" className="ml-2 text-sm">
          Enable high contrast mode
        </label>
      </div>

      {/* Announcements */}
      <div className="flex items-center">
        <input
          id="announcements"
          type="checkbox"
          checked={state.announcements}
          onChange={(e) => updateSettings({ announcements: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="announcements" className="ml-2 text-sm">
          Enable screen reader announcements
        </label>
      </div>

      {/* Device Information */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium mb-2">Device Information</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Touch Device: {state.touchDevice ? 'Yes' : 'No'}</div>
          <div>Screen Reader: {state.screenReader ? 'Detected' : 'Not Detected'}</div>
        </div>
      </div>
    </div>
  )
}