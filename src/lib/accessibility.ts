/**
 * Accessibility utilities and WCAG 2.1 AA compliance helpers
 */

// WCAG contrast ratios
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5
} as const

// Touch target minimum sizes (44px per Apple/Google guidelines)
export const TOUCH_TARGETS = {
  MINIMUM: 44,
  RECOMMENDED: 48
} as const

// Screen reader utilities
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return

  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Focus management
export class FocusManager {
  private focusableElements: string[] = [
    'button',
    'input',
    'select',
    'textarea',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ]

  getFocusableElements(container: Element = document.body): HTMLElement[] {
    const selector = this.focusableElements.join(', ')
    return Array.from(container.querySelectorAll(selector)).filter(
      (element): element is HTMLElement => {
        const el = element as HTMLElement
        return !el.hasAttribute('disabled') &&
               !el.hasAttribute('aria-hidden') &&
               el.offsetWidth > 0 &&
               el.offsetHeight > 0
      }
    )
  }

  trapFocus(container: Element, onEscape?: () => void): () => void {
    const focusableElements = this.getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      } else if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }

  moveFocusToNext(currentElement: Element): void {
    const focusableElements = this.getFocusableElements()
    const currentIndex = focusableElements.indexOf(currentElement as HTMLElement)

    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus()
    }
  }

  moveFocusToPrevious(currentElement: Element): void {
    const focusableElements = this.getFocusableElements()
    const currentIndex = focusableElements.indexOf(currentElement as HTMLElement)

    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus()
    }
  }
}

// Color contrast utilities
export function calculateContrastRatio(color1: string, color2: string): number {
  const luminance1 = getRelativeLuminance(color1)
  const luminance2 = getRelativeLuminance(color2)

  const lighter = Math.max(luminance1, luminance2)
  const darker = Math.min(luminance1, luminance2)

  return (lighter + 0.05) / (darker + 0.05)
}

function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color)
  if (!rgb) return 0

  const rsRGB = rgb.r / 255
  const gsRGB = rgb.g / 255
  const bsRGB = rgb.b / 255

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// ARIA utilities
export function generateAriaLabel(context: string, value?: string | number): string {
  if (value !== undefined) {
    return `${context}: ${value}`
  }
  return context
}

export function setAriaExpanded(element: Element, expanded: boolean): void {
  element.setAttribute('aria-expanded', expanded.toString())
}

export function setAriaSelected(element: Element, selected: boolean): void {
  element.setAttribute('aria-selected', selected.toString())
}

export function setAriaPressed(element: Element, pressed: boolean): void {
  element.setAttribute('aria-pressed', pressed.toString())
}

// Keyboard navigation utilities
export class KeyboardNavigationHandler {
  private handlers: Map<string, (event: KeyboardEvent) => void> = new Map()

  addHandler(key: string, handler: (event: KeyboardEvent) => void): void {
    this.handlers.set(key.toLowerCase(), handler)
  }

  removeHandler(key: string): void {
    this.handlers.delete(key.toLowerCase())
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase()
    const handler = this.handlers.get(key)

    if (handler) {
      handler(event)
    }
  }

  activate(): void {
    document.addEventListener('keydown', this.handleKeyDown)
  }

  deactivate(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
  }
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// High contrast mode detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false

  return window.matchMedia('(prefers-contrast: high)').matches ||
         window.matchMedia('(-ms-high-contrast: active)').matches
}

// Screen reader detection
export function isScreenReaderActive(): boolean {
  if (typeof window === 'undefined') return false

  // This is not 100% reliable, but covers most common cases
  return (
    navigator.userAgent.includes('NVDA') ||
    navigator.userAgent.includes('JAWS') ||
    navigator.userAgent.includes('VoiceOver') ||
    !!window.speechSynthesis?.getVoices().length
  )
}

// Touch device detection
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  )
}

// Skip link utilities
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLElement {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = text
  skipLink.className = 'skip-link'
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 9999;
    transform: translateY(-100%);
    transition: transform 0.3s;
  `

  skipLink.addEventListener('focus', () => {
    skipLink.style.transform = 'translateY(0)'
  })

  skipLink.addEventListener('blur', () => {
    skipLink.style.transform = 'translateY(-100%)'
  })

  return skipLink
}

// Form accessibility utilities
export class FormAccessibility {
  static addRequiredIndicator(element: Element, required: boolean = true): void {
    if (required) {
      element.setAttribute('required', '')
      element.setAttribute('aria-required', 'true')
    } else {
      element.removeAttribute('required')
      element.removeAttribute('aria-required')
    }
  }

  static addErrorState(element: Element, errorId: string, hasError: boolean = true): void {
    if (hasError) {
      element.setAttribute('aria-invalid', 'true')
      element.setAttribute('aria-describedby', errorId)
    } else {
      element.removeAttribute('aria-invalid')
      element.removeAttribute('aria-describedby')
    }
  }

  static addSuccessState(element: Element, successId?: string): void {
    element.setAttribute('aria-invalid', 'false')
    if (successId) {
      element.setAttribute('aria-describedby', successId)
    }
  }
}

// Modal accessibility utilities
export class ModalAccessibility {
  private originalFocus: HTMLElement | null = null
  private focusManager = new FocusManager()
  private cleanup?: () => void

  open(modalElement: Element): void {
    // Store current focus
    this.originalFocus = document.activeElement as HTMLElement

    // Add aria attributes
    modalElement.setAttribute('role', 'dialog')
    modalElement.setAttribute('aria-modal', 'true')

    // Hide other content from screen readers
    this.hideContentFromScreenReaders(modalElement)

    // Trap focus
    this.cleanup = this.focusManager.trapFocus(modalElement, () => this.close(modalElement))

    // Focus first element
    const firstFocusable = this.focusManager.getFocusableElements(modalElement)[0]
    if (firstFocusable) {
      firstFocusable.focus()
    }

    // Announce modal opening
    announceToScreenReader('Dialog opened', 'assertive')
  }

  close(modalElement: Element): void {
    // Remove aria attributes
    modalElement.removeAttribute('role')
    modalElement.removeAttribute('aria-modal')

    // Restore content visibility
    this.restoreContentVisibility()

    // Restore focus
    if (this.originalFocus) {
      this.originalFocus.focus()
    }

    // Clean up focus trap
    if (this.cleanup) {
      this.cleanup()
    }

    // Announce modal closing
    announceToScreenReader('Dialog closed', 'assertive')
  }

  private hideContentFromScreenReaders(modalElement: Element): void {
    const siblings = Array.from(document.body.children).filter(
      child => child !== modalElement && child.tagName !== 'SCRIPT'
    )

    siblings.forEach(sibling => {
      if (!sibling.hasAttribute('aria-hidden')) {
        sibling.setAttribute('aria-hidden', 'true')
        sibling.setAttribute('data-modal-hidden', 'true')
      }
    })
  }

  private restoreContentVisibility(): void {
    const hiddenElements = document.querySelectorAll('[data-modal-hidden="true"]')
    hiddenElements.forEach(element => {
      element.removeAttribute('aria-hidden')
      element.removeAttribute('data-modal-hidden')
    })
  }
}

// Singleton instances
export const focusManager = new FocusManager()
export const modalAccessibility = new ModalAccessibility()

// Accessibility validation
export function validateAccessibility(element: Element): {
  errors: string[]
  warnings: string[]
  score: number
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for alt text on images
  const images = element.querySelectorAll('img')
  images.forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      errors.push(`Image ${index + 1} missing alt attribute`)
    }
  })

  // Check for form labels
  const inputs = element.querySelectorAll('input, select, textarea')
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id')
    const hasLabel = id && document.querySelector(`label[for="${id}"]`)
    const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')

    if (!hasLabel && !hasAriaLabel) {
      errors.push(`Form input ${index + 1} missing label or aria-label`)
    }
  })

  // Check for heading hierarchy
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  let lastLevel = 0
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1))
    if (index === 0 && level !== 1) {
      warnings.push('First heading should be h1')
    }
    if (level > lastLevel + 1) {
      warnings.push(`Heading level ${level} skips levels (after h${lastLevel})`)
    }
    lastLevel = level
  })

  // Check for touch target size
  const touchTargets = element.querySelectorAll('button, a, input[type="button"], input[type="submit"]')
  touchTargets.forEach((target, index) => {
    const rect = target.getBoundingClientRect()
    if (rect.width < TOUCH_TARGETS.MINIMUM || rect.height < TOUCH_TARGETS.MINIMUM) {
      warnings.push(`Touch target ${index + 1} smaller than ${TOUCH_TARGETS.MINIMUM}px`)
    }
  })

  // Calculate score
  const totalIssues = errors.length + warnings.length
  const maxScore = 100
  const score = Math.max(0, maxScore - (errors.length * 20 + warnings.length * 5))

  return { errors, warnings, score }
}