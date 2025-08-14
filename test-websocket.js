const io = require('socket.io-client');

const socket = io('http://localhost:3006');

console.log('🔌 Connecting to WebSocket...');

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  console.log('Socket ID:', socket.id);
  
  // Subscribe to model updates
  socket.emit('subscribe', { channel: 'models' });
  console.log('📡 Subscribed to model updates');
});

socket.on('model-update', (data) => {
  console.log('📊 Model update received:', data);
});

socket.on('status-update', (data) => {
  console.log('📈 Status update received:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket');
});

socket.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Keep the connection alive for 10 seconds
setTimeout(() => {
  console.log('🔚 Closing connection...');
  socket.close();
  process.exit(0);
}, 10000);