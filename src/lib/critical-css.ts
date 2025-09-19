/**
 * Critical CSS extraction and optimization utilities
 */

// Critical CSS for above-the-fold content
export const criticalCSS = `
/* Reset and base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: inherit;
  color: #374151;
  background-color: #ffffff;
}

/* Header and navigation critical styles */
.navigation-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.navigation-container {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
}

.navigation-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
}

/* Logo and brand critical styles */
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: #2563eb;
  text-decoration: none;
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  background: #2563eb;
  border-radius: 0.5rem;
}

/* Button critical styles */
button {
  font-family: inherit;
  font-size: 100%;
  font-weight: inherit;
  color: inherit;
  margin: 0;
  padding: 0;
  line-height: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  focus:outline-offset: 2px;
  min-height: 44px;
  min-width: 44px;
}

.btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

/* Main content critical styles */
main {
  min-height: 100vh;
}

/* Dashboard header critical styles */
.dashboard-header {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-bottom: 1px solid #d1d5db;
}

.dashboard-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.dashboard-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Status indicator critical styles */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #ecfdf5;
  border: 1px solid #d1fae5;
  border-radius: 9999px;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #10b981;
  border-radius: 50%;
}

.status-text {
  font-size: 0.875rem;
  color: #065f46;
  font-weight: 500;
}

/* Grid and card critical styles */
.model-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .model-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .model-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.model-card {
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.model-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* Typography critical styles */
h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-weight: 600;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

/* Utility classes critical styles */
.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.p-4 {
  padding: 1rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

/* Loading and skeleton critical styles */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton {
  background-color: #f3f4f6;
  border-radius: 0.25rem;
}

/* Responsive utilities critical styles */
.hidden {
  display: none;
}

@media (min-width: 768px) {
  .md\\:flex {
    display: flex;
  }

  .md\\:hidden {
    display: none;
  }
}

/* Focus and accessibility critical styles */
*:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

*:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* High contrast support */
@media (prefers-contrast: high) {
  .model-card {
    border-color: #000;
    border-width: 2px;
  }

  .btn {
    border: 2px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Print styles */
@media print {
  .navigation-header,
  .btn,
  [role="button"] {
    display: none;
  }
}
`

// Function to inject critical CSS
export function injectCriticalCSS(): void {
  if (typeof document === 'undefined') return

  const style = document.createElement('style')
  style.textContent = criticalCSS
  style.id = 'critical-css'

  const head = document.head || document.getElementsByTagName('head')[0]
  head.insertBefore(style, head.firstChild)
}

// Function to preload non-critical CSS
export function preloadNonCriticalCSS(): void {
  if (typeof document === 'undefined') return

  const nonCriticalCSS = [
    '/_next/static/css/components.css',
    '/_next/static/css/utilities.css'
  ]

  nonCriticalCSS.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = href
    link.onload = function() {
      this.rel = 'stylesheet'
    }
    document.head.appendChild(link)
  })
}

// Function to detect and optimize font loading
export function optimizeFontLoading(): void {
  if (typeof document === 'undefined') return

  // Preload Google Fonts
  const fontPreloads = [
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZs.woff2'
  ]

  fontPreloads.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = href
    document.head.appendChild(link)
  })

  // Font display optimization
  const fontFace = new FontFace('Inter', 'url(' + fontPreloads[0] + ')', {
    display: 'swap'
  })

  fontFace.load().then(loadedFont => {
    document.fonts.add(loadedFont)
  }).catch(error => {
    console.warn('Font loading failed:', error)
  })
}

// Function to remove unused CSS (simplified version)
export function removeUnusedCSS(): void {
  if (typeof document === 'undefined') return

  // This is a simplified version - in production you'd use tools like PurgeCSS
  const unusedSelectors = [
    '.unused-class',
    '.debug-only',
    '.development-only'
  ]

  const stylesheets = Array.from(document.styleSheets)

  stylesheets.forEach(stylesheet => {
    try {
      const rules = Array.from(stylesheet.cssRules || [])

      rules.forEach((rule, index) => {
        if (rule.type === CSSRule.STYLE_RULE) {
          const styleRule = rule as CSSStyleRule

          if (unusedSelectors.some(selector => styleRule.selectorText?.includes(selector))) {
            stylesheet.deleteRule(index)
          }
        }
      })
    } catch (error) {
      // Cross-origin stylesheets can't be modified
    }
  })
}

// CSS optimization configuration
export const cssOptimizationConfig = {
  // Critical CSS should be inlined
  inline: true,

  // Minify CSS
  minify: process.env.NODE_ENV === 'production',

  // Remove unused CSS
  purge: process.env.NODE_ENV === 'production',

  // Optimize for mobile first
  mobileFirst: true,

  // Support modern browsers
  autoprefixer: {
    browsers: [
      '> 1%',
      'last 2 versions',
      'not ie <= 11',
      'not dead'
    ]
  }
}

// Function to apply CSS optimizations
export function applyCSSOptimizations(): void {
  if (typeof window === 'undefined') return

  // Inject critical CSS immediately
  injectCriticalCSS()

  // Defer non-critical CSS loading
  setTimeout(() => {
    preloadNonCriticalCSS()
    optimizeFontLoading()

    // Clean up unused CSS after page load
    if (process.env.NODE_ENV === 'production') {
      setTimeout(removeUnusedCSS, 2000)
    }
  }, 100)
}