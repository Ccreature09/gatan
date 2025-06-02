const { io } = require('socket.io-client');

// Test script to verify Socket.IO server connectivity
async function testSocketConnection() {
  console.log('🧪 Testing Socket.IO Server Connection...\n');
  
  // Get server URL from command line or use default
  const serverUrl = process.argv[2] || 'http://localhost:3001';
  
  console.log(`📡 Connecting to: ${serverUrl}`);
  
  const socket = io(serverUrl, {
    timeout: 10000,
    transports: ['polling', 'websocket']
  });
  
  socket.on('connect', () => {
    console.log('✅ Connected successfully!');
    console.log(`📊 Socket ID: ${socket.id}`);
    
    // Test creating a room
    console.log('\n🏠 Testing room creation...');
    socket.emit('createRoom', 'TestPlayer', '#ff4444', (response) => {
      if (response.success) {
        console.log('✅ Room created successfully!');
        console.log(`🏠 Room ID: ${response.room.id}`);
        console.log(`👤 Player ID: ${response.playerId}`);
        
        // Clean up and exit
        setTimeout(() => {
          socket.disconnect();
          console.log('\n🎉 All tests passed! Socket server is working correctly.');
          process.exit(0);
        }, 1000);
      } else {
        console.log('❌ Failed to create room:', response.error);
        process.exit(1);
      }
    });
  });
  
  socket.on('connect_error', (error) => {
    console.log('❌ Connection failed!');
    console.log(`💥 Error: ${error.message}`);
    
    if (error.message.includes('xhr poll error')) {
      console.log('\n💡 This looks like a Vercel serverless function limitation.');
      console.log('📖 Deploy the socket server to Railway or Render instead.');
    }
    
    process.exit(1);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`📴 Disconnected: ${reason}`);
  });
  
  // Timeout after 15 seconds
  setTimeout(() => {
    console.log('⏰ Connection timeout - check if server is running');
    process.exit(1);
  }, 15000);
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted');
  process.exit(0);
});

// Run the test
testSocketConnection().catch(console.error);
