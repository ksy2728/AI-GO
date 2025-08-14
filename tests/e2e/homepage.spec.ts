import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check if navigation is visible
    await expect(page.locator('nav')).toBeVisible()
    
    // Check if AI-GO logo/text is present
    await expect(page.locator('text=AI-GO')).toBeVisible()
    
    // Check if main sections are visible
    await expect(page.locator('h1')).toContainText(/AI Model/)
  })

  test('should navigate to status page', async ({ page }) => {
    await page.goto('/')
    
    // Click on Status link
    await page.click('text=Status')
    
    // Wait for navigation
    await page.waitForURL('**/status')
    
    // Check if status page loaded
    await expect(page.locator('h1')).toContainText(/Status/)
    
    // Check if model cards are visible
    await expect(page.locator('[data-testid="model-card"]').first()).toBeVisible()
  })

  test('should switch theme', async ({ page }) => {
    await page.goto('/')
    
    // Get initial theme
    const htmlElement = page.locator('html')
    const initialTheme = await htmlElement.getAttribute('class')
    
    // Click theme toggle
    await page.click('[data-testid="theme-toggle"]')
    
    // Check if theme changed
    const newTheme = await htmlElement.getAttribute('class')
    expect(newTheme).not.toBe(initialTheme)
  })

  test('should change language', async ({ page }) => {
    await page.goto('/')
    
    // Click language selector
    await page.click('[data-testid="language-selector"]')
    
    // Select Korean
    await page.click('text=한국어')
    
    // Wait for navigation
    await page.waitForURL('**/ko-KR')
    
    // Check if language changed (look for Korean text)
    await expect(page.locator('nav')).toContainText(/상태|모델|뉴스/)
  })
})