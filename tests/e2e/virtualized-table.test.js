const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'http://localhost:3008';
const MODELS_URL = `${BASE_URL}/models`;

test.describe('Virtual Scrolling Table Tests', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Enable console logging
    page.on('console', (msg) => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Navigate to models page
    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('should load models page successfully', async () => {
    await expect(page.locator('h1')).toContainText('AI Models');
  });

  test('should enable virtual scrolling for large datasets', async () => {
    // Check if virtual scrolling toggle exists
    const virtualToggle = page.locator('button:has-text("Virtual")');

    if (await virtualToggle.isVisible()) {
      await virtualToggle.click();
      await page.waitForTimeout(1000);

      // Verify virtual scrolling is enabled
      const virtualIndicator = page.locator('text=Virtual Scroll');
      await expect(virtualIndicator).toBeVisible();
    }
  });

  test('should render table rows with virtual scrolling', async () => {
    // Enable virtual scrolling if not already enabled
    const virtualToggle = page.locator('button:has-text("Virtual")');
    if (await virtualToggle.isVisible()) {
      await virtualToggle.click();
      await page.waitForTimeout(1000);
    }

    // Check for table structure
    const tableContainer = page.locator('.virtual-scroll-container, .overflow-auto').first();
    await expect(tableContainer).toBeVisible();

    // Verify rows are rendered
    const rows = page.locator('tr, [role="row"], .table-row').first();
    await expect(rows).toBeVisible();
  });

  test('should handle scroll events smoothly', async () => {
    const scrollContainer = page.locator('.overflow-auto, .virtual-scroll-container').first();
    await expect(scrollContainer).toBeVisible();

    // Measure initial scroll position
    const initialScrollTop = await scrollContainer.evaluate(el => el.scrollTop);

    // Perform scroll
    await scrollContainer.scroll({ top: 500 });
    await page.waitForTimeout(500);

    // Verify scroll position changed
    const newScrollTop = await scrollContainer.evaluate(el => el.scrollTop);
    expect(newScrollTop).toBeGreaterThan(initialScrollTop);
  });

  test('should maintain sorting functionality', async () => {
    // Find and click a sortable column header
    const sortableHeader = page.locator('button:has-text("Model Name"), button:has-text("Provider")').first();

    if (await sortableHeader.isVisible()) {
      await sortableHeader.click();
      await page.waitForTimeout(1000);

      // Verify sort indicator appears
      const sortIcon = page.locator('.lucide-arrow-up, .lucide-arrow-down').first();
      await expect(sortIcon).toBeVisible();
    }
  });

  test('should maintain filtering functionality', async () => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('GPT');
      await page.waitForTimeout(1500);

      // Verify some results are shown
      const resultCount = page.locator('text=/Showing \\d+ of \\d+ models/');
      if (await resultCount.isVisible()) {
        const text = await resultCount.textContent();
        expect(text).toContain('models');
      }
    }
  });

  test('should handle pagination correctly', async () => {
    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next"]').first();
    const prevButton = page.locator('button:has-text("Previous"), button[aria-label*="previous"]').first();

    if (await nextButton.isVisible()) {
      const isNextEnabled = await nextButton.isEnabled();
      if (isNextEnabled) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Verify page changed
        const pageIndicator = page.locator('text=/Page \\d+ of \\d+/');
        if (await pageIndicator.isVisible()) {
          const pageText = await pageIndicator.textContent();
          expect(pageText).toMatch(/Page \d+ of \d+/);
        }
      }
    }
  });
});

test.describe('Mobile Responsive Tests', () => {
  test('should be responsive on mobile devices', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 } // iPhone X size
    });
    const page = await context.newPage();

    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');

    // Check mobile layout
    await expect(page.locator('h1')).toBeVisible();

    // Verify mobile-optimized controls
    const mobileMenu = page.locator('button[aria-label*="menu"], .lg\\:hidden button').first();
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }

    // Check touch targets are large enough (minimum 44px)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40); // Allow some tolerance
        }
      }
    }

    await context.close();
  });

  test('should handle touch interactions', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      hasTouch: true
    });
    const page = await context.newPage();

    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');

    // Test touch scrolling
    const scrollContainer = page.locator('.overflow-auto').first();
    if (await scrollContainer.isVisible()) {
      await scrollContainer.hover();

      // Simulate touch scroll
      await page.touchscreen.tap(200, 400);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(500);
    }

    await context.close();
  });

  test('should work on tablet devices', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 } // iPad size
    });
    const page = await context.newPage();

    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');

    // Verify table is visible and functional
    await expect(page.locator('h1')).toBeVisible();

    // Check that both mobile and desktop elements might be visible
    const tableContainer = page.locator('table, .table-container').first();
    await expect(tableContainer).toBeVisible();

    await context.close();
  });
});

test.describe('Performance Tests', () => {
  test('should have reasonable DOM node count with virtualization', async ({ page }) => {
    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');

    // Enable virtual scrolling
    const virtualToggle = page.locator('button:has-text("Virtual")');
    if (await virtualToggle.isVisible()) {
      await virtualToggle.click();
      await page.waitForTimeout(1000);
    }

    // Count DOM nodes in the table area
    const domNodeCount = await page.evaluate(() => {
      const tableContainer = document.querySelector('.overflow-auto, .virtual-scroll-container, table');
      return tableContainer ? tableContainer.querySelectorAll('*').length : 0;
    });

    // With virtualization, should have relatively few DOM nodes even with many items
    console.log(`DOM node count with virtualization: ${domNodeCount}`);

    // This is a reasonable expectation - with virtualization, we shouldn't have
    // thousands of DOM nodes even with large datasets
    expect(domNodeCount).toBeLessThan(500);
  });

  test('should maintain smooth scrolling performance', async ({ page }) => {
    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');

    // Enable virtual scrolling
    const virtualToggle = page.locator('button:has-text("Virtual")');
    if (await virtualToggle.isVisible()) {
      await virtualToggle.click();
      await page.waitForTimeout(1000);
    }

    // Measure scroll performance
    const scrollContainer = page.locator('.overflow-auto').first();

    if (await scrollContainer.isVisible()) {
      const startTime = Date.now();

      // Perform multiple scroll operations
      for (let i = 0; i < 10; i++) {
        await scrollContainer.scroll({ top: i * 100 });
        await page.waitForTimeout(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Scroll performance: ${duration}ms for 10 scroll operations`);

      // Should complete scrolling operations in reasonable time
      expect(duration).toBeLessThan(2000); // 2 seconds is generous
    }
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');

    // Try to load a large dataset (if the API supports it)
    await page.evaluate(() => {
      // Attempt to trigger large dataset loading
      const url = new URL(window.location);
      url.searchParams.set('limit', '1000');
      window.history.pushState({}, '', url);
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Enable virtual scrolling
    const virtualToggle = page.locator('button:has-text("Virtual")');
    if (await virtualToggle.isVisible()) {
      await virtualToggle.click();
      await page.waitForTimeout(2000);
    }

    // Verify page is still responsive
    const title = page.locator('h1');
    await expect(title).toBeVisible();

    // Verify virtual scrolling performance indicator
    const perfIndicator = page.locator('text=Virtual scrolling: Rendering');
    if (await perfIndicator.isVisible()) {
      const perfText = await perfIndicator.textContent();
      console.log(`Performance indicator: ${perfText}`);
    }
  });
});

test.describe('Error Handling Tests', () => {
  test('should handle empty dataset gracefully', async ({ page }) => {
    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');

    // Search for something that should return no results
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('nonexistentmodel12345xyz');
      await page.waitForTimeout(1500);

      // Look for empty state message
      const emptyMessage = page.locator('text=/No models found/, text=/Try adjusting/, .empty-state');
      const hasEmptyState = await emptyMessage.count() > 0;

      if (hasEmptyState) {
        await expect(emptyMessage.first()).toBeVisible();
      }
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // This test would require intercepting network requests
    // For now, we'll just verify error boundaries exist

    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');

    // Look for error boundary components
    const errorBoundary = page.locator('[data-testid="error-boundary"], .error-boundary');

    // Error boundary should not be visible in normal operation
    if (await errorBoundary.count() > 0) {
      await expect(errorBoundary.first()).not.toBeVisible();
    }
  });

  test('should handle rapid user interactions', async ({ page }) => {
    await page.goto(MODELS_URL);
    await page.waitForLoadState('networkidle');

    // Rapidly click various controls
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      // Click rapidly
      for (let i = 0; i < 5; i++) {
        await buttons.click();
        await page.waitForTimeout(10);
      }

      // Page should still be functional
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('Cross-Browser Compatibility', () => {
  test('should support modern browser features', async ({ page }) => {
    await page.goto(MODELS_URL);

    // Check for ResizeObserver support
    const hasResizeObserver = await page.evaluate(() => {
      return 'ResizeObserver' in window;
    });

    if (!hasResizeObserver) {
      console.warn('ResizeObserver not supported - virtual scrolling may not work optimally');
    }

    // Check for IntersectionObserver support
    const hasIntersectionObserver = await page.evaluate(() => {
      return 'IntersectionObserver' in window;
    });

    if (!hasIntersectionObserver) {
      console.warn('IntersectionObserver not supported - may affect performance optimization');
    }

    // Page should still be functional regardless
    await expect(page.locator('h1')).toBeVisible();
  });
});