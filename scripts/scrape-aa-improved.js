const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * Improved Artificial Analysis scraper with multiple extraction strategies
 */
async function scrapeAAImproved() {
  console.log('🔍 Starting improved AA website scraping...\n');

  const browser = await chromium.launch({
    headless: false, // Set to true in production
    slowMo: 100
  });

  let extractedData = {};
  let apiResponses = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Set up API interception BEFORE navigation
    console.log('🌐 Setting up API interception...');

    page.on('response', async response => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      // Capture API responses that might contain model data
      if ((url.includes('api') || url.includes('data') || url.includes('models') ||
           url.includes('graphql') || url.includes('_next')) &&
          contentType.includes('json')) {
        try {
          const responseData = await response.json();
          apiResponses.push({
            url: url,
            status: response.status(),
            data: responseData
          });
          console.log(`  📡 Captured API response: ${url.substring(0, 100)}...`);
        } catch (e) {
          // Not JSON or failed to parse
        }
      }
    });

    console.log('📄 Navigating to AA models page...');
    await page.goto('https://artificialanalysis.ai/models', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for dynamic content to load
    console.log('⏳ Waiting for content to load...');
    await page.waitForTimeout(5000);

    // Try to wait for specific elements that indicate the charts are loaded
    try {
      await page.waitForSelector('svg, canvas, [class*="chart"], [class*="model"]', { timeout: 15000 });
      console.log('✅ Chart elements detected');
    } catch (e) {
      console.log('⚠️  Timeout waiting for chart elements, proceeding anyway...');
    }

    // Strategy 1: Extract from __NEXT_DATA__
    console.log('\n🔍 Strategy 1: Extracting from __NEXT_DATA__...');
    const nextData = await page.evaluate(() => {
      const nextDataScript = document.getElementById('__NEXT_DATA__');
      if (nextDataScript) {
        try {
          return JSON.parse(nextDataScript.textContent);
        } catch (e) {
          console.error('Failed to parse __NEXT_DATA__:', e);
          return null;
        }
      }
      return null;
    });

    if (nextData) {
      console.log('✅ Found __NEXT_DATA__');
      extractedData.nextData = nextData;
    }

    // Strategy 2: Extract from DOM elements with multiple selectors
    console.log('\n🔍 Strategy 2: Extracting from DOM elements...');
    const domData = await page.evaluate(() => {
      const results = {
        models: [],
        charts: [],
        tableData: [],
        allText: []
      };

      // Common selectors for model data
      const selectors = [
        // Chart-related selectors
        'svg text',
        '[class*="chart"] text',
        '[class*="model"]',
        '[data-testid*="model"]',
        '[class*="intelligence"]',
        '[class*="speed"]',
        '[class*="price"]',
        // Table selectors
        'table tr',
        'tbody tr',
        '[role="row"]',
        // Generic data containers
        '[class*="data"]',
        '[class*="metric"]',
        '[class*="score"]',
        '[class*="value"]'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
          const text = el.textContent?.trim();
          const className = el.className;
          const tagName = el.tagName;

          if (text && text.length > 0) {
            results.allText.push({
              selector,
              text,
              className,
              tagName,
              innerHTML: el.innerHTML?.substring(0, 200)
            });
          }
        });
      });

      // Look for specific patterns in SVG elements
      const svgs = document.querySelectorAll('svg');
      svgs.forEach((svg, svgIndex) => {
        const texts = svg.querySelectorAll('text');
        const chartData = [];

        texts.forEach(text => {
          const content = text.textContent?.trim();
          if (content) {
            chartData.push({
              text: content,
              x: text.getAttribute('x'),
              y: text.getAttribute('y'),
              transform: text.getAttribute('transform')
            });
          }
        });

        if (chartData.length > 0) {
          results.charts.push({
            svgIndex,
            data: chartData
          });
        }
      });

      // Look for table-like structures
      const rows = document.querySelectorAll('tr, [role="row"]');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th, [role="cell"], [role="columnheader"]');
        if (cells.length > 0) {
          const rowData = Array.from(cells).map(cell => cell.textContent?.trim());
          if (rowData.some(cell => cell && cell.length > 0)) {
            results.tableData.push(rowData);
          }
        }
      });

      return results;
    });

    console.log(`  - Found ${domData.allText.length} text elements`);
    console.log(`  - Found ${domData.charts.length} SVG charts`);
    console.log(`  - Found ${domData.tableData.length} table rows`);

    // Strategy 3: Extract React component data
    console.log('\n🔍 Strategy 3: Extracting React component data...');
    const reactData = await page.evaluate(() => {
      const results = {
        reactFiber: null,
        windowProps: {},
        reactElements: []
      };

      // Check for React Fiber data
      const rootElement = document.querySelector('#__next') || document.querySelector('[data-reactroot]') || document.body;
      if (rootElement && rootElement._reactInternalFiber) {
        results.reactFiber = 'Found React Fiber';
      }

      // Check window properties that might contain data
      Object.keys(window).forEach(key => {
        if (key.includes('data') || key.includes('model') || key.includes('chart') || key.includes('_')) {
          try {
            const value = window[key];
            if (typeof value === 'object' && value !== null) {
              results.windowProps[key] = JSON.stringify(value).substring(0, 500);
            }
          } catch (e) {
            // Ignore circular references
          }
        }
      });

      return results;
    });

    console.log(`  - Window properties found: ${Object.keys(reactData.windowProps).length}`);

    // Strategy 4: Targeted model name and score extraction
    console.log('\n🔍 Strategy 4: Targeted model extraction...');
    const modelData = await page.evaluate(() => {
      const results = [];

      // Known model patterns to look for
      const modelPatterns = [
        /GPT-?5?\s*(high|preview)?/i,
        /DeepSeek\s*V?3?/i,
        /Claude\s*3\.5?\s*Sonnet/i,
        /Gemini\s*(Pro|Ultra|Flash)?/i,
        /LLaMA?\s*\d+/i,
        /Mistral/i,
        /PaLM/i,
        /Anthropic/i
      ];

      // Search all text nodes for model names and nearby numbers
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();

        modelPatterns.forEach(pattern => {
          if (pattern.test(text)) {
            // Found a model name, look for nearby numbers
            let parent = node.parentElement;
            let searchLevel = 0;

            while (parent && searchLevel < 3) {
              const parentText = parent.textContent;
              const numbers = parentText.match(/\d+\.?\d*/g);

              if (numbers) {
                results.push({
                  modelName: text,
                  parentText: parentText.substring(0, 200),
                  numbers: numbers,
                  searchLevel: searchLevel,
                  parentTag: parent.tagName,
                  parentClass: parent.className
                });
              }

              parent = parent.parentElement;
              searchLevel++;
            }
          }
        });
      }

      return results;
    });

    console.log(`  - Found ${modelData.length} potential model matches`);

    // Strategy 5: Screenshot analysis helper
    console.log('\n📸 Taking reference screenshots...');
    const screenshotDir = path.join(__dirname, '..', 'screenshots');
    await fs.mkdir(screenshotDir, { recursive: true });

    // Full page screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'aa-improved-full.png'),
      fullPage: true
    });

    // Try to screenshot specific chart areas
    const chartSelectors = [
      'svg',
      '[class*="chart"]',
      '[class*="intelligence"]',
      '[class*="speed"]',
      '[class*="price"]'
    ];

    for (const selector of chartSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.screenshot({
            path: path.join(screenshotDir, `aa-improved-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`)
          });
          console.log(`  ✅ Screenshot: ${selector}`);
        }
      } catch (e) {
        // Element not found or not visible
      }
    }

    // Parse and structure the extracted data
    console.log('\n📊 Processing extracted data...');
    const processedData = processExtractedData({
      nextData,
      domData,
      reactData,
      modelData,
      apiResponses
    });

    // Save all data
    const outputDir = path.join(__dirname, '..', 'data', 'aa-scraping');
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `aa-improved-${timestamp}.json`);

    const finalData = {
      timestamp: new Date().toISOString(),
      source: 'https://artificialanalysis.ai/models',
      scraper: 'improved-multi-strategy',
      raw: {
        nextData,
        domData,
        reactData,
        modelData,
        apiResponses
      },
      processed: processedData,
      metadata: {
        browserVersion: await browser.version(),
        strategiesUsed: 5,
        apiCallsCaptured: apiResponses.length
      }
    };

    await fs.writeFile(outputFile, JSON.stringify(finalData, null, 2));
    console.log(`\n✅ Data saved to: ${outputFile}`);

    // Display results summary
    displayResults(processedData);

    return finalData;

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Process and structure the extracted data
 */
function processExtractedData(rawData) {
  const processed = {
    models: {},
    intelligence: [],
    speed: [],
    price: [],
    confidence: 'low'
  };

  // Process API responses first (highest confidence)
  if (rawData.apiResponses && rawData.apiResponses.length > 0) {
    rawData.apiResponses.forEach(response => {
      if (response.data) {
        // Look for arrays that might contain model data
        const searchForModels = (obj, path = '') => {
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              if (item && typeof item === 'object') {
                // Check if this looks like model data
                const keys = Object.keys(item);
                if (keys.some(key => key.toLowerCase().includes('model') ||
                                     key.toLowerCase().includes('name'))) {
                  processed.models[`api_${path}_${index}`] = item;
                }
              }
            });
          } else if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
              if (key.toLowerCase().includes('model') ||
                  key.toLowerCase().includes('data') ||
                  key.toLowerCase().includes('chart')) {
                searchForModels(obj[key], `${path}_${key}`);
              }
            });
          }
        };

        searchForModels(response.data, response.url.split('/').pop());
      }
    });
  }

  // Process __NEXT_DATA__ (high confidence)
  if (rawData.nextData) {
    const searchNextData = (obj, path = '') => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          if (Array.isArray(obj[key]) && obj[key].length > 0) {
            obj[key].forEach((item, index) => {
              if (item && typeof item === 'object') {
                const itemKeys = Object.keys(item);
                if (itemKeys.some(k => k.toLowerCase().includes('model') ||
                                      k.toLowerCase().includes('intelligence') ||
                                      k.toLowerCase().includes('speed') ||
                                      k.toLowerCase().includes('price'))) {
                  processed.models[`next_${path}_${key}_${index}`] = item;
                }
              }
            });
          } else if (obj[key] && typeof obj[key] === 'object') {
            searchNextData(obj[key], `${path}_${key}`);
          }
        });
      }
    };

    searchNextData(rawData.nextData, 'next');
  }

  // Process model matches (medium confidence)
  if (rawData.modelData && rawData.modelData.length > 0) {
    rawData.modelData.forEach((match, index) => {
      const modelName = match.modelName.trim();
      const numbers = match.numbers.map(n => parseFloat(n)).filter(n => !isNaN(n));

      if (numbers.length > 0) {
        // Try to categorize numbers by range
        numbers.forEach(num => {
          if (num >= 20 && num <= 100) {
            // Likely intelligence score
            processed.intelligence.push({
              model: modelName,
              score: num,
              source: 'dom_extraction',
              confidence: 'medium'
            });
          } else if (num >= 1 && num <= 1000) {
            // Could be speed (tokens/second)
            processed.speed.push({
              model: modelName,
              speed: num,
              source: 'dom_extraction',
              confidence: 'medium'
            });
          } else if (num >= 0.1 && num <= 100) {
            // Could be price (USD per 1M tokens)
            processed.price.push({
              model: modelName,
              price: num,
              source: 'dom_extraction',
              confidence: 'medium'
            });
          }
        });
      }
    });
  }

  // Set confidence level based on data sources
  if (Object.keys(processed.models).length > 0) {
    processed.confidence = 'high';
  } else if (processed.intelligence.length > 0 || processed.speed.length > 0 || processed.price.length > 0) {
    processed.confidence = 'medium';
  }

  return processed;
}

/**
 * Display extraction results
 */
function displayResults(processedData) {
  console.log('\n📊 EXTRACTION RESULTS SUMMARY');
  console.log('=====================================');
  console.log(`Confidence Level: ${processedData.confidence.toUpperCase()}`);
  console.log(`Models Found: ${Object.keys(processedData.models).length}`);
  console.log(`Intelligence Scores: ${processedData.intelligence.length}`);
  console.log(`Speed Metrics: ${processedData.speed.length}`);
  console.log(`Price Data: ${processedData.price.length}`);

  if (processedData.intelligence.length > 0) {
    console.log('\n🧠 INTELLIGENCE SCORES:');
    processedData.intelligence.forEach(item => {
      console.log(`  ${item.model}: ${item.score} (${item.confidence})`);
    });
  }

  if (processedData.speed.length > 0) {
    console.log('\n⚡ SPEED METRICS:');
    processedData.speed.forEach(item => {
      console.log(`  ${item.model}: ${item.speed} tokens/sec (${item.confidence})`);
    });
  }

  if (processedData.price.length > 0) {
    console.log('\n💰 PRICE DATA:');
    processedData.price.forEach(item => {
      console.log(`  ${item.model}: $${item.price} per 1M tokens (${item.confidence})`);
    });
  }

  if (Object.keys(processedData.models).length > 0) {
    console.log('\n🔍 RAW MODEL DATA FOUND:');
    Object.keys(processedData.models).forEach(key => {
      console.log(`  ${key}: ${JSON.stringify(processedData.models[key]).substring(0, 100)}...`);
    });
  }

  console.log('\n💡 NEXT STEPS:');
  console.log('1. Check screenshots in the screenshots/ folder');
  console.log('2. Review the raw data in the JSON output file');
  console.log('3. If confidence is low, manual verification is recommended');
  console.log('4. Consider running the scraper multiple times to catch dynamic content');
}

// Run the improved scraper
if (require.main === module) {
  scrapeAAImproved()
    .then(data => {
      console.log('\n✅ Improved scraping completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Improved scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeAAImproved, processExtractedData };