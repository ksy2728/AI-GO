const io = require('socket.io-client');

console.log('🚀 Starting WebSocket client test...');

const socket = io('http://localhost:3006', {
  transports: ['websocket', 'polling']
});

let testResults = {
  connection: false,
  globalStats: false,
  heartbeat: false,
  totalTests: 3,
  passed: 0
};

// Test 1: Connection
socket.on('connect', () => {
  console.log('✅ Test 1 PASSED: Connected to WebSocket server');
  console.log('   Socket ID:', socket.id);
  testResults.connection = true;
  testResults.passed++;
  
  // Subscribe to global stats
  socket.emit('subscribe:global');
  console.log('📊 Subscribed to global stats');
  
  // Send heartbeat
  setTimeout(() => {
    socket.emit('ping');
  }, 1000);
});

// Test 2: Receive global stats
socket.on('realtime:update', (update) => {
  if (update.type === 'global:stats' && !testResults.globalStats) {
    console.log('✅ Test 2 PASSED: Received global stats');
    console.log('   Stats:', {
      totalModels: update.data.totalModels,
      activeModels: update.data.activeModels,
      avgAvailability: update.data.avgAvailability?.toFixed(2) + '%'
    });
    testResults.globalStats = true;
    testResults.passed++;
  }
});

// Test 3: Heartbeat response
socket.on('pong', (data) => {
  if (!testResults.heartbeat) {
    console.log('✅ Test 3 PASSED: Heartbeat received');
    console.log('   Timestamp:', data.timestamp);
    testResults.heartbeat = true;
    testResults.passed++;
  }
});

// Error handling
socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', () => {
  console.log('📡 Disconnected from server');
});

// Test summary after 5 seconds
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.totalTests - testResults.passed}`);
  console.log('');
  console.log('Test Results:');
  console.log(`  Connection Test: ${testResults.connection ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Global Stats Test: ${testResults.globalStats ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Heartbeat Test: ${testResults.heartbeat ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(50));
  
  if (testResults.passed === testResults.totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Real-time monitoring is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the WebSocket server.');
  }
  
  // Cleanup
  socket.disconnect();
  process.exit(testResults.passed === testResults.totalTests ? 0 : 1);
}, 5000);