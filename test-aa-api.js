const fetch = require('node-fetch');

async function testAAAPI() {
  console.log('🔍 Testing Artificial Analysis API endpoints...\n');

  // Test endpoints
  const endpoints = [
    'https://artificialanalysis.ai/api/models',
    'https://artificialanalysis.ai/api/data/models',
    'https://artificialanalysis.ai/api/leaderboard'
  ];

  for (const endpoint of endpoints) {
    console.log(`📡 Testing: ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; AI-GO/1.0)'
        }
      });

      console.log(`   Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   Data Type: ${typeof data}`);
        console.log(`   Keys: ${Object.keys(data).join(', ')}`);

        if (data.models && Array.isArray(data.models)) {
          console.log(`   Models Count: ${data.models.length}`);
          if (data.models.length > 0) {
            const sample = data.models[0];
            console.log(`   Sample Model Keys: ${Object.keys(sample).join(', ')}`);
            console.log(`   Sample Model: ${sample.name || sample.model_name || 'Unknown'}`);
          }
        }
      } else {
        const text = await response.text();
        console.log(`   Error: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  // Test web scraping approach
  console.log('📄 Testing web scraping approach...');
  try {
    const response = await fetch('https://artificialanalysis.ai/models', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    console.log(`   Status: ${response.status}`);

    if (response.ok) {
      const html = await response.text();
      console.log(`   HTML Length: ${html.length} characters`);

      // Check for __NEXT_DATA__
      const nextDataMatch = html.match(/__NEXT_DATA__\s*=\s*({.*?})\s*;?\s*$/m);
      if (nextDataMatch) {
        console.log('   Found __NEXT_DATA__');
        try {
          const data = JSON.parse(nextDataMatch[1]);
          const props = data?.props?.pageProps;
          if (props?.models) {
            console.log(`   Models in pageProps: ${props.models.length}`);
          } else if (props?.initialData?.models) {
            console.log(`   Models in initialData: ${props.initialData.models.length}`);
          } else {
            console.log(`   PageProps keys: ${Object.keys(props || {}).join(', ')}`);
          }
        } catch (e) {
          console.log(`   Failed to parse __NEXT_DATA__: ${e.message}`);
        }
      } else {
        console.log('   No __NEXT_DATA__ found');
      }

      // Check for table data
      const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/);
      if (tableMatch) {
        console.log('   Found table data');
      } else {
        console.log('   No table data found');
      }
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

testAAAPI().catch(console.error);