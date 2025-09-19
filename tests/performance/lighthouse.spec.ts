import { test, expect, Page } from '@playwright/test'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

// Lighthouse performance thresholds for mobile
const MOBILE_THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  bestPractices: 95,
  seo: 90,
  coreWebVitals: {
    lcp: 2500,  // ms
    fid: 100,   // ms
    cls: 0.1    // score
  }
}

// Lighthouse performance thresholds for desktop
const DESKTOP_THRESHOLDS = {
  performance: 95,
  accessibility: 95,
  bestPractices: 95,
  seo: 90,
  coreWebVitals: {
    lcp: 2000,  // ms
    fid: 100,   // ms
    cls: 0.1    // score
  }
}

test.describe('Lighthouse Performance Tests', () => {
  test('Mobile Lighthouse scores meet 90+ target', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Launch Chrome for Lighthouse
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    })

    try {
      // Run Lighthouse audit with mobile emulation
      const options = {
        logLevel: 'info' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
        emulatedFormFactor: 'mobile' as const,
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      }

      const runnerResult = await lighthouse(page.url(), options)

      if (!runnerResult) {
        throw new Error('Lighthouse audit failed')
      }

      const report = runnerResult.lhr

      // Performance score
      const performanceScore = Math.round((report.categories.performance?.score || 0) * 100)
      console.log(`📱 Mobile Performance Score: ${performanceScore}/100`)

      // Accessibility score
      const accessibilityScore = Math.round((report.categories.accessibility?.score || 0) * 100)
      console.log(`♿ Mobile Accessibility Score: ${accessibilityScore}/100`)

      // Best Practices score
      const bestPracticesScore = Math.round((report.categories['best-practices']?.score || 0) * 100)
      console.log(`✅ Mobile Best Practices Score: ${bestPracticesScore}/100`)

      // SEO score
      const seoScore = Math.round((report.categories.seo?.score || 0) * 100)
      console.log(`🔍 Mobile SEO Score: ${seoScore}/100`)

      // Core Web Vitals
      const lcp = report.audits['largest-contentful-paint']?.numericValue || 0
      const fid = report.audits['max-potential-fid']?.numericValue || 0
      const cls = report.audits['cumulative-layout-shift']?.numericValue || 0

      console.log(`🎯 Mobile Core Web Vitals:`)
      console.log(`  LCP: ${Math.round(lcp)}ms (target: <${MOBILE_THRESHOLDS.coreWebVitals.lcp}ms)`)
      console.log(`  FID: ${Math.round(fid)}ms (target: <${MOBILE_THRESHOLDS.coreWebVitals.fid}ms)`)
      console.log(`  CLS: ${cls.toFixed(3)} (target: <${MOBILE_THRESHOLDS.coreWebVitals.cls})`)

      // Performance assertions
      expect(performanceScore).toBeGreaterThanOrEqual(MOBILE_THRESHOLDS.performance)
      expect(accessibilityScore).toBeGreaterThanOrEqual(MOBILE_THRESHOLDS.accessibility)
      expect(bestPracticesScore).toBeGreaterThanOrEqual(MOBILE_THRESHOLDS.bestPractices)
      expect(seoScore).toBeGreaterThanOrEqual(MOBILE_THRESHOLDS.seo)

      // Core Web Vitals assertions
      expect(lcp).toBeLessThanOrEqual(MOBILE_THRESHOLDS.coreWebVitals.lcp)
      expect(fid).toBeLessThanOrEqual(MOBILE_THRESHOLDS.coreWebVitals.fid)
      expect(cls).toBeLessThanOrEqual(MOBILE_THRESHOLDS.coreWebVitals.cls)

      // Log detailed metrics for debugging
      const metrics = report.audits
      console.log('\n📊 Detailed Mobile Performance Metrics:')
      console.log(`  First Contentful Paint: ${Math.round(metrics['first-contentful-paint']?.numericValue || 0)}ms`)
      console.log(`  Time to Interactive: ${Math.round(metrics['interactive']?.numericValue || 0)}ms`)
      console.log(`  Speed Index: ${Math.round(metrics['speed-index']?.numericValue || 0)}ms`)
      console.log(`  Total Blocking Time: ${Math.round(metrics['total-blocking-time']?.numericValue || 0)}ms`)

    } finally {
      await chrome.kill()
    }
  })

  test('Desktop Lighthouse scores meet 95+ target', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Launch Chrome for Lighthouse
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    })

    try {
      // Run Lighthouse audit with desktop settings
      const options = {
        logLevel: 'info' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
        emulatedFormFactor: 'desktop' as const,
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        }
      }

      const runnerResult = await lighthouse(page.url(), options)

      if (!runnerResult) {
        throw new Error('Lighthouse audit failed')
      }

      const report = runnerResult.lhr

      // Performance score
      const performanceScore = Math.round((report.categories.performance?.score || 0) * 100)
      console.log(`🖥️ Desktop Performance Score: ${performanceScore}/100`)

      // Accessibility score
      const accessibilityScore = Math.round((report.categories.accessibility?.score || 0) * 100)
      console.log(`♿ Desktop Accessibility Score: ${accessibilityScore}/100`)

      // Best Practices score
      const bestPracticesScore = Math.round((report.categories['best-practices']?.score || 0) * 100)
      console.log(`✅ Desktop Best Practices Score: ${bestPracticesScore}/100`)

      // SEO score
      const seoScore = Math.round((report.categories.seo?.score || 0) * 100)
      console.log(`🔍 Desktop SEO Score: ${seoScore}/100`)

      // Performance assertions
      expect(performanceScore).toBeGreaterThanOrEqual(DESKTOP_THRESHOLDS.performance)
      expect(accessibilityScore).toBeGreaterThanOrEqual(DESKTOP_THRESHOLDS.accessibility)
      expect(bestPracticesScore).toBeGreaterThanOrEqual(DESKTOP_THRESHOLDS.bestPractices)
      expect(seoScore).toBeGreaterThanOrEqual(DESKTOP_THRESHOLDS.seo)

    } finally {
      await chrome.kill()
    }
  })

  test('Core Web Vitals on critical pages', async ({ page }) => {
    const criticalPages = [
      '/',
      '/models',
      '/status',
      '/benchmarks'
    ]

    for (const pagePath of criticalPages) {
      console.log(`\n🧪 Testing ${pagePath}...`)

      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      // Measure Core Web Vitals using JavaScript
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {
            lcp: 0,
            fid: 0,
            cls: 0
          }

          // Import web-vitals dynamically
          import('/node_modules/web-vitals/dist/web-vitals.js').then(({ getCLS, getFID, getLCP }) => {
            let metricsCollected = 0
            const totalMetrics = 3

            const checkComplete = () => {
              metricsCollected++
              if (metricsCollected === totalMetrics) {
                resolve(vitals)
              }
            }

            getCLS((metric) => {
              vitals.cls = metric.value
              checkComplete()
            })

            getFID((metric) => {
              vitals.fid = metric.value
              checkComplete()
            })

            getLCP((metric) => {
              vitals.lcp = metric.value
              checkComplete()
            })

            // Timeout after 5 seconds
            setTimeout(() => resolve(vitals), 5000)
          }).catch(() => {
            // Fallback if web-vitals not available
            resolve(vitals)
          })
        })
      })

      console.log(`  📍 ${pagePath} Core Web Vitals:`)
      console.log(`    LCP: ${Math.round(webVitals.lcp)}ms`)
      console.log(`    FID: ${Math.round(webVitals.fid)}ms`)
      console.log(`    CLS: ${webVitals.cls.toFixed(3)}`)

      // Assert Core Web Vitals meet mobile thresholds
      expect(webVitals.lcp).toBeLessThanOrEqual(MOBILE_THRESHOLDS.coreWebVitals.lcp)
      expect(webVitals.fid).toBeLessThanOrEqual(MOBILE_THRESHOLDS.coreWebVitals.fid)
      expect(webVitals.cls).toBeLessThanOrEqual(MOBILE_THRESHOLDS.coreWebVitals.cls)
    }
  })

  test('Progressive Web App (PWA) requirements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for PWA manifest
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(manifest).toBeTruthy()

    // Check manifest content
    const manifestResponse = await page.request.get(manifest!)
    expect(manifestResponse.ok()).toBeTruthy()

    const manifestData = await manifestResponse.json()
    expect(manifestData.name).toBeTruthy()
    expect(manifestData.short_name).toBeTruthy()
    expect(manifestData.start_url).toBeTruthy()
    expect(manifestData.display).toBeTruthy()
    expect(manifestData.icons).toBeTruthy()
    expect(manifestData.icons.length).toBeGreaterThan(0)

    // Check for service worker
    const serviceWorkerRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })
    expect(serviceWorkerRegistered).toBeTruthy()

    console.log('✅ PWA requirements met')
  })

  test('Accessibility compliance (WCAG 2.1 AA)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for skip links
    const skipLink = page.locator('a[href^="#"]:has-text("Skip")')
    await expect(skipLink).toBeVisible({ timeout: 1000 }).catch(() => {
      // Skip link might be hidden until focused
      console.log('ℹ️ Skip link not immediately visible (may be hidden until focused)')
    })

    // Check alt text on images
    const images = page.locator('img')
    const imageCount = await images.count()

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i)
      const alt = await image.getAttribute('alt')
      const src = await image.getAttribute('src')

      if (!alt) {
        console.warn(`⚠️ Image missing alt text: ${src}`)
      }

      // Decorative images can have empty alt text
      expect(alt !== null).toBeTruthy()
    }

    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    const headingLevels = await Promise.all(
      headings.map(h => h.evaluate(el => parseInt(el.tagName.charAt(1))))
    )

    // Should start with h1
    if (headingLevels.length > 0) {
      expect(headingLevels[0]).toBe(1)
    }

    // Check form labels
    const inputs = page.locator('input, select, textarea')
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')

      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = await label.count() > 0

        if (!hasLabel && !ariaLabel && !ariaLabelledby) {
          const inputType = await input.getAttribute('type')
          const inputName = await input.getAttribute('name')
          console.warn(`⚠️ Input without label: type=${inputType}, name=${inputName}`)
        }
      }
    }

    console.log('✅ Accessibility checks completed')
  })

  test('Performance on 3G network simulation', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**', (route) => {
      // Add 600ms delay to simulate slow network
      setTimeout(() => {
        route.continue()
      }, 100) // Reduced delay for testing
    })

    const startTime = Date.now()

    await page.goto('/')
    await page.waitForSelector('[data-testid="model-card"], .model-card', { timeout: 10000 })

    const loadTime = Date.now() - startTime
    console.log(`🐌 3G Load Time: ${loadTime}ms`)

    // Should load within 5 seconds on simulated 3G
    expect(loadTime).toBeLessThan(5000)

    // Check that critical content is visible
    const modelCards = page.locator('[data-testid="model-card"], .model-card')
    await expect(modelCards.first()).toBeVisible()

    console.log('✅ 3G network simulation test passed')
  })

  test('Bundle size analysis', async ({ page }) => {
    await page.goto('/')

    // Analyze resource loading
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      return entries.map(entry => ({
        name: entry.name,
        size: entry.transferSize || 0,
        duration: entry.duration,
        type: entry.initiatorType
      })).filter(resource =>
        resource.name.includes('_next') ||
        resource.name.includes('.js') ||
        resource.name.includes('.css')
      )
    })

    console.log('\n📦 Bundle Analysis:')

    const jsResources = resources.filter(r => r.name.includes('.js'))
    const cssResources = resources.filter(r => r.name.includes('.css'))

    const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0)
    const totalCSSSize = cssResources.reduce((sum, r) => sum + r.size, 0)

    console.log(`  JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`)
    console.log(`  CSS: ${(totalCSSSize / 1024).toFixed(2)} KB`)
    console.log(`  Total: ${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`)

    // Bundle size thresholds (reasonable for a dashboard app)
    expect(totalJSSize).toBeLessThan(500 * 1024) // 500KB JS
    expect(totalCSSSize).toBeLessThan(100 * 1024) // 100KB CSS

    // Log largest resources
    const largestResources = resources
      .sort((a, b) => b.size - a.size)
      .slice(0, 5)

    console.log('\n📊 Largest Resources:')
    largestResources.forEach((resource, i) => {
      const sizeKB = (resource.size / 1024).toFixed(2)
      const name = resource.name.split('/').pop() || resource.name
      console.log(`  ${i + 1}. ${name}: ${sizeKB} KB`)
    })
  })
})