const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * Scrape actual data from Artificial Analysis website
 */
async function scrapeAAData() {
  console.log('🔍 Starting AA website scraping...\n');

  const browser = await chromium.launch({
    headless: false, // Set to true in production
    slowMo: 100 // Slow down for debugging
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Browser console:', msg.text());
      }
    });

    console.log('📄 Navigating to AA models page...');
    await page.goto('https://artificialanalysis.ai/models', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for the page to fully load
    await page.waitForTimeout(3000);

    console.log('🔎 Extracting data from page...\n');

    // Try to extract data from multiple sources
    const extractedData = await page.evaluate(() => {
      const results = {
        intelligence: [],
        speed: [],
        price: [],
        rawData: null,
        chartData: null
      };

      // Method 1: Check for __NEXT_DATA__
      const nextDataScript = document.getElementById('__NEXT_DATA__');
      if (nextDataScript) {
        try {
          const nextData = JSON.parse(nextDataScript.textContent);
          results.rawData = nextData;
          console.log('Found __NEXT_DATA__');
        } catch (e) {
          console.error('Failed to parse __NEXT_DATA__:', e);
        }
      }

      // Method 2: Look for React props in window
      if (window.__INITIAL_PROPS__) {
        results.rawData = window.__INITIAL_PROPS__;
        console.log('Found __INITIAL_PROPS__');
      }

      // Method 3: Extract from visible chart elements
      // Intelligence chart
      const intelligenceElements = document.querySelectorAll('[data-testid*="intelligence"], .intelligence-bar, [class*="intelligence"]');
      intelligenceElements.forEach(el => {
        const text = el.textContent || '';
        const modelName = el.getAttribute('data-model') || el.querySelector('[class*="model-name"]')?.textContent;
        const score = parseFloat(text.match(/\d+\.?\d*/)?.[0]);

        if (modelName && !isNaN(score)) {
          results.intelligence.push({ model: modelName, score });
        }
      });

      // Speed chart
      const speedElements = document.querySelectorAll('[data-testid*="speed"], .speed-bar, [class*="speed"]');
      speedElements.forEach(el => {
        const text = el.textContent || '';
        const modelName = el.getAttribute('data-model') || el.querySelector('[class*="model-name"]')?.textContent;
        const speed = parseFloat(text.match(/\d+\.?\d*/)?.[0]);

        if (modelName && !isNaN(speed)) {
          results.speed.push({ model: modelName, speed });
        }
      });

      // Price chart
      const priceElements = document.querySelectorAll('[data-testid*="price"], .price-bar, [class*="price"]');
      priceElements.forEach(el => {
        const text = el.textContent || '';
        const modelName = el.getAttribute('data-model') || el.querySelector('[class*="model-name"]')?.textContent;
        const price = parseFloat(text.match(/\d+\.?\d*/)?.[0]);

        if (modelName && !isNaN(price)) {
          results.price.push({ model: modelName, price });
        }
      });

      // Method 4: Extract from SVG charts if they exist
      const svgCharts = document.querySelectorAll('svg');
      svgCharts.forEach(svg => {
        // Look for text elements that might contain model names and scores
        const textElements = svg.querySelectorAll('text');
        textElements.forEach(text => {
          const content = text.textContent?.trim();
          if (content && /\d+/.test(content)) {
            // Try to find associated model name
            const siblingTexts = Array.from(text.parentElement?.querySelectorAll('text') || []);
            siblingTexts.forEach(sibling => {
              const siblingContent = sibling.textContent?.trim();
              if (siblingContent && !(/^\d+$/.test(siblingContent))) {
                // This might be a model name
                console.log(`Found potential data: ${siblingContent} - ${content}`);
              }
            });
          }
        });
      });

      return results;
    });

    console.log('📊 Extracted data summary:');
    console.log(`  - Intelligence scores: ${extractedData.intelligence.length} models`);
    console.log(`  - Speed metrics: ${extractedData.speed.length} models`);
    console.log(`  - Price data: ${extractedData.price.length} models`);

    // Take screenshots for manual verification
    console.log('\n📸 Taking screenshots for verification...');

    await page.screenshot({
      path: path.join(__dirname, '..', 'screenshots', 'aa-full-page.png'),
      fullPage: true
    });

    // Try to capture specific chart sections
    const sections = ['intelligence', 'speed', 'price'];
    for (const section of sections) {
      const element = await page.$(`[class*="${section}"], [data-testid*="${section}"], #${section}-chart`);
      if (element) {
        await element.screenshot({
          path: path.join(__dirname, '..', 'screenshots', `aa-${section}-chart.png`)
        });
        console.log(`  ✅ Captured ${section} chart`);
      }
    }

    // Method 5: Try to intercept API calls
    console.log('\n🌐 Checking for API data...');

    // Set up request interception
    const apiData = [];
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('api') || url.includes('graphql') || url.includes('models')) {
        try {
          const json = await response.json();
          apiData.push({
            url: url,
            data: json
          });
          console.log(`  📡 Captured API response from: ${url}`);
        } catch (e) {
          // Not JSON response
        }
      }
    });

    // Refresh the page to capture API calls
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Save all extracted data
    const outputDir = path.join(__dirname, '..', 'data', 'aa-scraping');
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `aa-data-${timestamp}.json`);

    const finalData = {
      timestamp: new Date().toISOString(),
      source: 'https://artificialanalysis.ai/models',
      extracted: extractedData,
      apiCalls: apiData,
      metadata: {
        browserVersion: await browser.version(),
        viewportSize: { width: 1920, height: 1080 }
      }
    };

    await fs.writeFile(outputFile, JSON.stringify(finalData, null, 2));
    console.log(`\n✅ Data saved to: ${outputFile}`);

    // Manual inspection helper
    console.log('\n🔍 Manual Verification Required:');
    console.log('Please check the screenshots in the screenshots folder');
    console.log('and verify the following from the AA website:');
    console.log('  1. GPT-5 (high) Intelligence Score: ?');
    console.log('  2. DeepSeek V3 Intelligence Score: ?');
    console.log('  3. Claude 3.5 Sonnet Intelligence Score: ?');
    console.log('\nAlso check Speed and Price for these models.');

    return finalData;

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeAAData()
  .then(data => {
    console.log('\n✅ Scraping completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Scraping failed:', error);
    process.exit(1);
  });