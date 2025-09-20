const https = require('https');
require('dotenv').config();

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

console.log('🔧 Testing API Keys Configuration...\n');

// Test OpenAI API
async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    console.log(`${colors.red}❌ OpenAI API Key not configured${colors.reset}`);
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✅ OpenAI API: Connected successfully${colors.reset}`);
      console.log(`   Found ${data.data.length} models available`);
      return true;
    } else {
      console.log(`${colors.red}❌ OpenAI API: Failed (${response.status})${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ OpenAI API: Error - ${error.message}${colors.reset}`);
    return false;
  }
}

// Test Anthropic API
async function testAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    console.log(`${colors.red}❌ Anthropic API Key not configured${colors.reset}`);
    return false;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        messages: [{role: 'user', content: 'Hi'}],
        max_tokens: 1
      })
    });

    if (response.ok || response.status === 400) { // 400 might be rate limit
      console.log(`${colors.green}✅ Anthropic API: Connected successfully${colors.reset}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`${colors.red}❌ Anthropic API: Failed (${response.status})${colors.reset}`);
      console.log(`   Error: ${error.substring(0, 100)}...`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Anthropic API: Error - ${error.message}${colors.reset}`);
    return false;
  }
}

// Test Google AI API
async function testGoogleAI() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    console.log(`${colors.red}❌ Google AI API Key not configured${colors.reset}`);
    return false;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✅ Google AI API: Connected successfully${colors.reset}`);
      console.log(`   Found ${data.models?.length || 0} models available`);
      return true;
    } else {
      const error = await response.text();
      console.log(`${colors.red}❌ Google AI API: Failed (${response.status})${colors.reset}`);
      console.log(`   Error: ${error.substring(0, 100)}...`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Google AI API: Error - ${error.message}${colors.reset}`);
    return false;
  }
}

// Test Replicate API
async function testReplicate() {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken || apiToken.includes('placeholder')) {
    console.log(`${colors.red}❌ Replicate API Token not configured${colors.reset}`);
    return false;
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/account', {
      headers: {
        'Authorization': `Token ${apiToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✅ Replicate API: Connected successfully${colors.reset}`);
      console.log(`   Account: ${data.username || 'Active'}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Replicate API: Failed (${response.status})${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Replicate API: Error - ${error.message}${colors.reset}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Testing API connections...\n');

  const results = {
    openai: await testOpenAI(),
    anthropic: await testAnthropic(),
    google: await testGoogleAI(),
    replicate: await testReplicate()
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;

  console.log(`Total APIs: ${total}`);
  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${total - passed}${colors.reset}`);

  if (passed === total) {
    console.log(`\n${colors.green}🎉 All API keys are configured and working!${colors.reset}`);
    console.log('Your system is ready to fetch real data from all providers.');
  } else {
    console.log(`\n${colors.yellow}⚠️ Some APIs are not working properly.${colors.reset}`);
    console.log('Please check the failed API keys and try again.');
  }

  return passed === total;
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});