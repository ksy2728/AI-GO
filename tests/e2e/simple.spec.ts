import { test, expect } from '@playwright/test'

test.describe('Simple Tests - No Server Required', () => {
  test('should open browser and navigate to example.com', async ({ page }) => {
    await page.goto('https://example.com')
    await expect(page).toHaveTitle(/Example Domain/)
  })

  test('should perform basic browser operations', async ({ page }) => {
    await page.goto('https://httpbin.org/html')
    
    // Check if page loaded
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for basic HTML elements
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})