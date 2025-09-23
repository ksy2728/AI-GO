import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { chromium } = require('playwright');

async function testBrowserExperience() {
  console.log('🌐 Testing browser experience to see what users actually see...\n');

  let browser, page;

  try {
    // Launch browser
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Navigate to the models page
    console.log('📱 Navigating to models page...');
    await page.goto('http://localhost:3000/models', { waitUntil: 'networkidle' });

    // Wait a bit for the page to load
    await page.waitForTimeout(3000);

    // Check if there are any API errors in console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Console Error:', msg.text());
      }
    });

    // Take screenshot
    await page.screenshot({ path: 'D:\\ksy_project\\ai server information\\debug-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-screenshot.png');

    // Check for OpenAI models in the table
    console.log('🔍 Looking for OpenAI models in the page...');

    // Try to find model rows
    const modelRows = await page.$$('tr[data-row-key], .model-row, [data-testid*="model"]');
    console.log(`📊 Found ${modelRows.length} model rows in the table`);

    // Look for OpenAI/GPT text in the page
    const pageText = await page.textContent('body');
    const openaiMatches = pageText.match(/openai|gpt-?4|o3/gi);
    console.log(`🎯 Found ${openaiMatches?.length || 0} OpenAI/GPT mentions on the page`);

    if (openaiMatches && openaiMatches.length > 0) {
      console.log('✅ OpenAI models are mentioned on the page:', openaiMatches.slice(0, 10));
    }

    // Check for specific table content
    const tables = await page.$$('table');
    if (tables.length > 0) {
      console.log(`📋 Found ${tables.length} table(s) on the page`);

      for (let i = 0; i < tables.length; i++) {
        const tableText = await tables[i].textContent();
        const openaiInTable = tableText.match(/openai|gpt-?4|o3/gi);
        if (openaiInTable && openaiInTable.length > 0) {
          console.log(`✅ Table ${i + 1} contains OpenAI references:`, openaiInTable.slice(0, 5));
        } else {
          console.log(`❌ Table ${i + 1} has no OpenAI references`);
        }
      }
    }

    // Check for error messages
    const errorElements = await page.$$('.error, [class*="error"], .alert-error');
    if (errorElements.length > 0) {
      console.log('⚠️  Found error elements on the page:');
      for (const error of errorElements) {
        const errorText = await error.textContent();
        console.log(`  - ${errorText}`);
      }
    }

    // Check for loading states
    const loadingElements = await page.$$('.loading, [class*="loading"], .spinner');
    if (loadingElements.length > 0) {
      console.log('⏳ Found loading elements on the page:');
      for (const loading of loadingElements) {
        const loadingText = await loading.textContent();
        console.log(`  - ${loadingText}`);
      }
    }

    // Check network requests
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/v1/models')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
      }
    });

    // Refresh the page to capture network requests
    console.log('🔄 Refreshing page to capture network requests...');
    await page.reload({ waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    if (responses.length > 0) {
      console.log('🌐 API Requests captured:');
      responses.forEach(response => {
        console.log(`  - ${response.url} (Status: ${response.status})`);
      });

      // Try to get response data
      try {
        const apiResponse = await page.evaluate(async () => {
          const response = await fetch('/api/v1/models?limit=10');
          return await response.json();
        });

        console.log('📊 API Response from browser:', {
          total: apiResponse.total,
          models: apiResponse.models?.length || 0,
          dataSource: apiResponse.dataSource,
          openaiModels: apiResponse.models?.filter(m =>
            m.provider?.toLowerCase()?.includes('openai') ||
            m.name?.toLowerCase()?.includes('gpt')
          )?.length || 0
        });

        if (apiResponse.models) {
          const openaiModels = apiResponse.models.filter(m =>
            m.provider?.toLowerCase()?.includes('openai') ||
            m.name?.toLowerCase()?.includes('gpt') ||
            m.name?.toLowerCase()?.includes('o3')
          );

          if (openaiModels.length > 0) {
            console.log('✅ OpenAI models found in API response:');
            openaiModels.forEach(model => {
              console.log(`  - ${model.name} (${model.provider})`);
            });
          } else {
            console.log('❌ No OpenAI models in API response!');
          }
        }

      } catch (apiError) {
        console.log('❌ Error fetching API data from browser:', apiError.message);
      }
    } else {
      console.log('❌ No API requests captured');
    }

  } catch (error) {
    console.error('❌ Browser test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testBrowserExperience().catch(console.error);