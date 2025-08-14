import { test, expect } from '@playwright/test'

test.describe('Status Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/status')
  })

  test('should display model status cards', async ({ page }) => {
    // Wait for models to load
    await page.waitForSelector('.grid')
    
    // Check if at least 3 model cards are visible (top models)
    const modelCards = page.locator('[class*="Card"]').filter({ hasText: /GPT|Claude|Gemini/ })
    await expect(modelCards).toHaveCount(3)
    
    // Check if availability percentage is shown
    await expect(page.locator('text=%').first()).toBeVisible()
  })

  test('should filter models by category', async ({ page }) => {
    // Click category filter
    await page.click('text=All Categories')
    
    // Select Foundation models
    await page.click('text=Foundation')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Check if filtered results are shown
    const foundationBadges = page.locator('text=foundation')
    const count = await foundationBadges.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should search for models', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'GPT')
    
    // Wait for search results
    await page.waitForTimeout(500)
    
    // Check if GPT models are shown
    await expect(page.locator('text=GPT-4o')).toBeVisible()
  })

  test('should open model detail panel', async ({ page }) => {
    // Click on a model card
    await page.click('text=GPT-4o')
    
    // Wait for panel to open
    await page.waitForSelector('[class*="fixed right-0"]')
    
    // Check if model details are shown
    await expect(page.locator('h2:has-text("GPT-4o")')).toBeVisible()
    
    // Check if tabs are present
    await expect(page.locator('text=Overview')).toBeVisible()
    await expect(page.locator('text=Performance')).toBeVisible()
    await expect(page.locator('text=Benchmarks')).toBeVisible()
    await expect(page.locator('text=Pricing')).toBeVisible()
    
    // Close panel
    await page.click('button[aria-label*="Close"]')
    await expect(page.locator('[class*="fixed right-0"]')).not.toBeVisible()
  })

  test('should toggle company grouping', async ({ page }) => {
    // Click group by company button
    await page.click('text=Group by Company')
    
    // Wait for regrouping
    await page.waitForTimeout(500)
    
    // Check if company headers are shown
    await expect(page.locator('text=OpenAI')).toBeVisible()
    await expect(page.locator('text=Anthropic')).toBeVisible()
    await expect(page.locator('text=Google')).toBeVisible()
  })

  test('should auto-refresh status', async ({ page }) => {
    // Check if auto-refresh is enabled by default
    const autoRefreshButton = page.locator('text=Auto-refresh')
    await expect(autoRefreshButton).toHaveClass(/default/)
    
    // Disable auto-refresh
    await autoRefreshButton.click()
    
    // Check if button style changed
    await expect(autoRefreshButton).toHaveClass(/outline/)
  })
})