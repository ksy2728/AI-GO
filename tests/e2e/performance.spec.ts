import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load status page within performance budget', async ({ page }) => {
    // Start measuring
    const startTime = Date.now()
    
    // Navigate to status page
    const response = await page.goto('/status', { waitUntil: 'networkidle' })
    
    // Measure load time
    const loadTime = Date.now() - startTime
    
    // Check response status
    expect(response?.status()).toBe(200)
    
    // Check load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Check if content is visible within 2 seconds
    await expect(page.locator('h1')).toBeVisible({ timeout: 2000 })
  })

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto('/status')
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle')
    
    // Measure Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let lcp = 0
        let cls = 0
        let fid = 0
        
        // Observe LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          lcp = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Observe CLS
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value
            }
          }
        }).observe({ entryTypes: ['layout-shift'] })
        
        // Measure after 3 seconds
        setTimeout(() => {
          resolve({ lcp, cls })
        }, 3000)
      })
    })
    
    // Check if metrics are within acceptable range
    expect(metrics.lcp).toBeLessThan(2500) // Good LCP
    expect(metrics.cls).toBeLessThan(0.1)  // Good CLS
  })

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 500))
      await route.continue()
    })
    
    // Navigate to page
    await page.goto('/status')
    
    // Check if loading states are shown
    await expect(page.locator('[class*="animate-pulse"], [class*="animate-spin"]')).toBeVisible()
    
    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 10000 })
    
    // Check if content eventually loads
    await expect(page.locator('h1')).toContainText(/Status/)
  })
})