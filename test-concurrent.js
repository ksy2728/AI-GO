const io = require('socket.io-client');

console.log('🚀 Starting concurrent connections test...');

const connections = [];
const numClients = 5;
let connectedCount = 0;
let receivedUpdates = 0;

// Create multiple concurrent connections
for (let i = 0; i < numClients; i++) {
  const socket = io('http://localhost:3006', {
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    connectedCount++;
    console.log(`✅ Client ${i + 1} connected (${connectedCount}/${numClients})`);
    socket.emit('subscribe:global');
  });
  
  socket.on('realtime:update', (update) => {
    if (update.type === 'global:stats') {
      receivedUpdates++;
      console.log(`📊 Client ${i + 1} received update #${receivedUpdates}`);
    }
  });
  
  connections.push(socket);
}

// Test summary after 3 seconds
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('📊 CONCURRENT CONNECTIONS TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Target Connections: ${numClients}`);
  console.log(`Successful Connections: ${connectedCount}`);
  console.log(`Updates Received: ${receivedUpdates}`);
  console.log('='.repeat(50));
  
  if (connectedCount === numClients) {
    console.log('\n🎉 SUCCESS! All clients connected successfully.');
    console.log('✅ Real-time monitoring supports multiple concurrent connections.');
  } else {
    console.log('\n⚠️ Some connections failed.');
  }
  
  // Cleanup
  connections.forEach(socket => socket.disconnect());
  process.exit(connectedCount === numClients ? 0 : 1);
}, 3000);