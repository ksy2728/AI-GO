const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * Network-focused scraper for Artificial Analysis website
 * Focuses on intercepting API calls and analyzing page structure
 */
async function scrapeAANetworkFocused() {
  console.log('🌐 Starting network-focused AA scraping...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const networkData = [];
  const pageStates = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Comprehensive network monitoring
    console.log('🔍 Setting up comprehensive network monitoring...');

    // Monitor all requests
    page.on('request', request => {
      networkData.push({
        type: 'request',
        timestamp: Date.now(),
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    });

    // Monitor all responses
    page.on('response', async response => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      try {
        let responseData = null;

        // Capture JSON responses
        if (contentType.includes('json')) {
          try {
            responseData = await response.json();
          } catch (e) {
            responseData = { error: 'Failed to parse JSON' };
          }
        }
        // Capture text responses that might be relevant
        else if (contentType.includes('text') || contentType.includes('javascript')) {
          try {
            const text = await response.text();
            if (text.includes('model') || text.includes('intelligence') ||
                text.includes('speed') || text.includes('price')) {
              responseData = { text: text.substring(0, 5000) };
            }
          } catch (e) {
            responseData = { error: 'Failed to get text' };
          }
        }

        networkData.push({
          type: 'response',
          timestamp: Date.now(),
          url: url,
          status: response.status(),
          headers: response.headers(),
          contentType: contentType,
          data: responseData
        });

        console.log(`📡 ${response.status()} ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);

      } catch (error) {
        networkData.push({
          type: 'response_error',
          timestamp: Date.now(),
          url: url,
          error: error.message
        });
      }
    });

    // Navigate and capture initial state
    console.log('📄 Navigating to AA models page...');
    await page.goto('https://artificialanalysis.ai/models', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Capture page state at different intervals
    for (let i = 0; i < 5; i++) {
      console.log(`⏳ Waiting and capturing state ${i + 1}/5...`);
      await page.waitForTimeout(2000);

      const pageState = await page.evaluate((iteration) => {
        return {
          iteration: iteration,
          timestamp: Date.now(),
          title: document.title,
          url: window.location.href,
          readyState: document.readyState,

          // Capture current DOM structure
          domStats: {
            totalElements: document.querySelectorAll('*').length,
            svgElements: document.querySelectorAll('svg').length,
            textNodes: document.createTreeWalker(document, NodeFilter.SHOW_TEXT).nextNode ? 'present' : 'none',
            scriptTags: document.querySelectorAll('script').length,
            dataTags: document.querySelectorAll('[data-*]').length
          },

          // Capture all text content that might contain model data
          textContent: Array.from(document.querySelectorAll('*'))
            .map(el => el.textContent?.trim())
            .filter(text => text && (
              text.includes('GPT') ||
              text.includes('Claude') ||
              text.includes('DeepSeek') ||
              text.includes('Gemini') ||
              text.includes('Intelligence') ||
              text.includes('Speed') ||
              text.includes('Price') ||
              /\d+\.?\d*/.test(text)
            ))
            .slice(0, 100), // Limit to prevent huge data

          // Capture window object properties
          windowProperties: Object.keys(window)
            .filter(key => key.includes('data') || key.includes('model') || key.includes('react') || key.includes('next'))
            .map(key => {
              try {
                const value = window[key];
                return {
                  key: key,
                  type: typeof value,
                  hasData: value !== null && value !== undefined,
                  preview: typeof value === 'object' ? JSON.stringify(value).substring(0, 200) : String(value).substring(0, 200)
                };
              } catch (e) {
                return { key: key, error: e.message };
              }
            }),

          // Check for specific data elements
          dataElements: {
            nextDataScript: !!document.getElementById('__NEXT_DATA__'),
            reactRoot: !!document.querySelector('[data-reactroot]'),
            nextRoot: !!document.querySelector('#__next'),
            chartElements: document.querySelectorAll('[class*="chart"], svg, canvas').length,
            modelElements: document.querySelectorAll('[class*="model"], [data-testid*="model"]').length,
            tableElements: document.querySelectorAll('table, [role="table"], [role="grid"]').length
          }
        };
      }, i + 1);

      pageStates.push(pageState);
    }

    // Try to trigger any lazy loading by scrolling
    console.log('📜 Scrolling to trigger lazy loading...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 4);
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);

    // Try to interact with potential chart elements
    console.log('🎯 Attempting to interact with chart elements...');
    try {
      const svgElements = await page.$$('svg');
      for (let i = 0; i < Math.min(svgElements.length, 3); i++) {
        await svgElements[i].hover();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('⚠️  Could not interact with SVG elements');
    }

    // Capture final page state with more detailed extraction
    console.log('🔍 Performing final detailed extraction...');
    const finalExtraction = await page.evaluate(() => {
      const result = {
        nextData: null,
        allModelData: [],
        structuredData: {
          intelligence: [],
          speed: [],
          price: []
        },
        chartAnalysis: []
      };

      // Extract __NEXT_DATA__ if present
      const nextDataScript = document.getElementById('__NEXT_DATA__');
      if (nextDataScript) {
        try {
          result.nextData = JSON.parse(nextDataScript.textContent);
        } catch (e) {
          result.nextData = { error: 'Failed to parse __NEXT_DATA__' };
        }
      }

      // Analyze all SVG charts in detail
      const svgs = document.querySelectorAll('svg');
      svgs.forEach((svg, index) => {
        const chartInfo = {
          index: index,
          bbox: svg.getBoundingClientRect(),
          texts: [],
          paths: svg.querySelectorAll('path').length,
          circles: svg.querySelectorAll('circle').length,
          rects: svg.querySelectorAll('rect').length
        };

        // Extract all text elements with positioning
        const texts = svg.querySelectorAll('text');
        texts.forEach(text => {
          const textContent = text.textContent?.trim();
          if (textContent) {
            chartInfo.texts.push({
              content: textContent,
              x: text.getAttribute('x'),
              y: text.getAttribute('y'),
              transform: text.getAttribute('transform'),
              fontSize: text.getAttribute('font-size') || getComputedStyle(text).fontSize,
              fill: text.getAttribute('fill') || getComputedStyle(text).fill
            });
          }
        });

        result.chartAnalysis.push(chartInfo);
      });

      // Look for model data in a more systematic way
      const modelKeywords = ['GPT-5', 'GPT-4', 'Claude', 'DeepSeek', 'Gemini', 'Llama', 'Mistral', 'PaLM'];
      const metricKeywords = ['Intelligence', 'Speed', 'Price', 'Score', 'Tokens', 'USD', '$'];

      // Search through all text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let textNode;
      while (textNode = walker.nextNode()) {
        const text = textNode.textContent.trim();

        // Check if this text contains model names
        modelKeywords.forEach(keyword => {
          if (text.toLowerCase().includes(keyword.toLowerCase())) {
            // Look for numbers in the same or nearby elements
            let element = textNode.parentElement;
            let searchDepth = 0;

            while (element && searchDepth < 3) {
              const elementText = element.textContent;
              const numbers = elementText.match(/\d+\.?\d*/g);

              if (numbers && numbers.length > 0) {
                result.allModelData.push({
                  modelKeyword: keyword,
                  context: text,
                  elementText: elementText.substring(0, 300),
                  numbers: numbers.map(n => parseFloat(n)).filter(n => !isNaN(n)),
                  elementTag: element.tagName,
                  elementClass: element.className,
                  searchDepth: searchDepth
                });
              }

              element = element.parentElement;
              searchDepth++;
            }
          }
        });
      }

      // Try to find structured data in tables or lists
      const tables = document.querySelectorAll('table, [role="table"], [role="grid"]');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr, [role="row"]');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, th, [role="cell"], [role="columnheader"]');
          if (cells.length >= 2) {
            const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim());

            // Check if this looks like model data
            const hasModelName = cellTexts.some(text =>
              modelKeywords.some(keyword => text?.toLowerCase().includes(keyword.toLowerCase()))
            );

            const hasNumbers = cellTexts.some(text => /\d+\.?\d*/.test(text || ''));

            if (hasModelName && hasNumbers) {
              result.allModelData.push({
                source: 'table',
                rowData: cellTexts,
                tableIndex: Array.from(tables).indexOf(table)
              });
            }
          }
        });
      });

      return result;
    });

    // Save comprehensive data
    const outputDir = path.join(__dirname, '..', 'data', 'aa-scraping');
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `aa-network-focused-${timestamp}.json`);

    const comprehensiveData = {
      timestamp: new Date().toISOString(),
      source: 'https://artificialanalysis.ai/models',
      scraper: 'network-focused',
      networkData: networkData,
      pageStates: pageStates,
      finalExtraction: finalExtraction,
      summary: {
        totalNetworkRequests: networkData.filter(item => item.type === 'request').length,
        totalNetworkResponses: networkData.filter(item => item.type === 'response').length,
        jsonResponses: networkData.filter(item =>
          item.type === 'response' &&
          item.contentType &&
          item.contentType.includes('json')
        ).length,
        modelsFound: finalExtraction.allModelData.length,
        chartsAnalyzed: finalExtraction.chartAnalysis.length
      }
    };

    await fs.writeFile(outputFile, JSON.stringify(comprehensiveData, null, 2));
    console.log(`\n✅ Comprehensive data saved to: ${outputFile}`);

    // Display analysis results
    displayNetworkResults(comprehensiveData);

    return comprehensiveData;

  } catch (error) {
    console.error('❌ Network-focused scraping failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Display network scraping results
 */
function displayNetworkResults(data) {
  console.log('\n🌐 NETWORK ANALYSIS RESULTS');
  console.log('=====================================');
  console.log(`Network Requests: ${data.summary.totalNetworkRequests}`);
  console.log(`Network Responses: ${data.summary.totalNetworkResponses}`);
  console.log(`JSON Responses: ${data.summary.jsonResponses}`);
  console.log(`Models Found: ${data.summary.modelsFound}`);
  console.log(`Charts Analyzed: ${data.summary.chartsAnalyzed}`);

  // Show API endpoints that returned JSON data
  const jsonResponses = data.networkData.filter(item =>
    item.type === 'response' &&
    item.contentType &&
    item.contentType.includes('json') &&
    item.data &&
    typeof item.data === 'object'
  );

  if (jsonResponses.length > 0) {
    console.log('\n📡 JSON API ENDPOINTS FOUND:');
    jsonResponses.forEach(response => {
      console.log(`  ${response.status} ${response.url}`);
      if (response.data && typeof response.data === 'object') {
        const dataStr = JSON.stringify(response.data);
        if (dataStr.includes('model') || dataStr.includes('intelligence') ||
            dataStr.includes('speed') || dataStr.includes('price')) {
          console.log(`    🎯 Contains relevant data: ${dataStr.substring(0, 100)}...`);
        }
      }
    });
  }

  // Show model data found
  if (data.finalExtraction.allModelData.length > 0) {
    console.log('\n🤖 MODEL DATA FOUND:');
    data.finalExtraction.allModelData.slice(0, 10).forEach(item => {
      if (item.modelKeyword) {
        console.log(`  ${item.modelKeyword}: ${item.numbers?.join(', ')} (${item.source || 'dom'})`);
      } else if (item.rowData) {
        console.log(`  Table row: ${item.rowData.join(' | ')}`);
      }
    });
  }

  // Show chart analysis
  if (data.finalExtraction.chartAnalysis.length > 0) {
    console.log('\n📊 CHART ANALYSIS:');
    data.finalExtraction.chartAnalysis.forEach((chart, index) => {
      console.log(`  Chart ${index + 1}: ${chart.texts.length} text elements, ${chart.paths} paths`);

      // Show some text content from charts
      chart.texts.slice(0, 5).forEach(text => {
        if (text.content.length > 0) {
          console.log(`    Text: "${text.content}"`);
        }
      });
    });
  }

  console.log('\n💡 RECOMMENDATIONS:');
  if (data.summary.jsonResponses > 0) {
    console.log('✅ JSON API endpoints detected - check networkData for structured data');
  }
  if (data.summary.modelsFound > 0) {
    console.log('✅ Model data found in DOM - check finalExtraction.allModelData');
  }
  if (data.summary.chartsAnalyzed > 0) {
    console.log('✅ Chart elements found - check finalExtraction.chartAnalysis');
  }
  if (data.finalExtraction.nextData) {
    console.log('✅ __NEXT_DATA__ found - check finalExtraction.nextData');
  }
}

// Run the network-focused scraper
if (require.main === module) {
  scrapeAANetworkFocused()
    .then(data => {
      console.log('\n✅ Network-focused scraping completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Network-focused scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeAANetworkFocused };