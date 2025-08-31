// Test script for API endpoints
// Node.js 18+ has built-in fetch

const BASE_URL = 'http://localhost:3005';

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`\n📋 Testing ${name}...`);
  console.log(`   URL: ${url}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
      
      if (response.ok) {
        console.log(`   ✅ SUCCESS`);
        return { success: true, data };
      } else {
        console.log(`   ❌ FAILED - Status ${response.status}`);
        return { success: false, error: data };
      }
    } else {
      const text = await response.text();
      console.log(`   Response (text):`, text.substring(0, 200) + '...');
      console.log(`   ⚠️ WARNING - Expected JSON response`);
      return { success: false, error: 'Non-JSON response' };
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Starting API Tests...');
  console.log('========================');
  
  const results = [];
  
  // Test 1: Status API
  results.push(await testEndpoint(
    'Status API',
    `${BASE_URL}/api/v1/status`
  ));
  
  // Test 2: Realtime Stats API
  results.push(await testEndpoint(
    'Realtime Stats API',
    `${BASE_URL}/api/v1/realtime-stats`
  ));
  
  // Test 3: Realtime Stats without history
  results.push(await testEndpoint(
    'Realtime Stats (no history)',
    `${BASE_URL}/api/v1/realtime-stats?includeHistory=false`
  ));
  
  // Test 4: Model Status Init Check
  results.push(await testEndpoint(
    'Model Status Init Check',
    `${BASE_URL}/api/v1/models/init-status`
  ));
  
  // Test 5: Models API
  results.push(await testEndpoint(
    'Models API',
    `${BASE_URL}/api/v1/models`
  ));
  
  // Summary
  console.log('\n\n📊 Test Summary');
  console.log('================');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️ Some tests failed. Check the PostgreSQL connection and ensure the database is properly configured.');
  }
}

// Run the tests
runTests().catch(console.error);