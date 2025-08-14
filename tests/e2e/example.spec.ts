import { test, expect } from '@playwright/test'

test.describe('AI-GO Platform', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check if the page loads successfully
    await expect(page).toHaveTitle(/AI-GO/)
    
    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should navigate to status page', async ({ page }) => {
    await page.goto('/status')
    
    // Check if status page loads
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should load models API', async ({ page }) => {
    const response = await page.request.get('/api/v1/status/models')
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('models')
    expect(data).toHaveProperty('pagination')
  })
})