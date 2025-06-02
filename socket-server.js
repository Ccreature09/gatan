const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// Set up port for standalone socket server
const port = process.env.PORT || 3001;

// Create HTTP server for Socket.IO
const httpServer = createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'gatan-socket-server',
      connections: connectionCount,
      totalConnections
    }));
    return;
  }

  // Simple homepage
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Gatan Socket.IO Server</title></head>
      <body>
        <h1>Gatan Socket.IO Server</h1>
        <p>This is a dedicated WebSocket server for the Gatan game.</p>
        <p>Server is running and ready to accept connections.</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["*"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  },
  pingTimeout: 60000, // Increase ping timeout for better stability
});

// Connection tracking
let connectionCount = 0;
let totalConnections = 0;

// Extract game logic from production-server.js
// This contains all the room and game state management

// Rooms collection
const rooms = new Map();

// Room management
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  connectionCount++;
  totalConnections++;

  // Create room
  socket.on('createRoom', (playerName, playerColor, callback) => {
    try {
      const roomId = uuidv4().substring(0, 6).toUpperCase();
      const playerId = uuidv4();
      
      const room = {
        id: roomId,
        players: [{
          id: playerId,
          socketId: socket.id,
          name: playerName,
          color: playerColor,
          isReady: false,
          isConnected: true
        }],
        isStarted: false,
        maxPlayers: 4,
        gameState: null,
        actions: []
      };
      
      rooms.set(roomId, room);
      socket.join(roomId);
      
      console.log(`Room created: ${roomId} by player ${playerName} (${playerId})`);
      callback({ success: true, room, playerId });
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Join room
  socket.on('joinRoom', (roomId, playerName, playerColor, callback) => {
    try {
      roomId = roomId.toUpperCase();
      if (!rooms.has(roomId)) {
        return callback({ success: false, error: 'Room not found' });
      }
      
      const room = rooms.get(roomId);
      
      if (room.isStarted) {
        return callback({ success: false, error: 'Game already started' });
      }
      
      if (room.players.length >= room.maxPlayers) {
        return callback({ success: false, error: 'Room is full' });
      }
      
      const playerId = uuidv4();
      room.players.push({
        id: playerId,
        socketId: socket.id,
        name: playerName,
        color: playerColor,
        isReady: false,
        isConnected: true
      });
      
      socket.join(roomId);
      io.to(roomId).emit('roomUpdated', room);
      
      console.log(`Player ${playerName} (${playerId}) joined room ${roomId}`);
      callback({ success: true, room, playerId });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Set player ready status
  socket.on('setReady', (roomId, playerId, isReady, callback) => {
    try {
      if (!rooms.has(roomId)) {
        return callback({ success: false, error: 'Room not found' });
      }
      
      const room = rooms.get(roomId);
      const player = room.players.find(p => p.id === playerId);
      
      if (!player) {
        return callback({ success: false, error: 'Player not found' });
      }
      
      player.isReady = isReady;
      io.to(roomId).emit('roomUpdated', room);
      
      callback({ success: true });
    } catch (error) {
      console.error('Error setting player ready:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Start game
  socket.on('startGame', (roomId, playerId, callback) => {
    try {
      if (!rooms.has(roomId)) {
        return callback({ success: false, error: 'Room not found' });
      }
      
      const room = rooms.get(roomId);
      
      // Check if all players are ready
      const allReady = room.players.every(p => p.isReady);
      if (!allReady) {
        return callback({ success: false, error: 'Not all players are ready' });
      }
      
      room.isStarted = true;
      io.to(roomId).emit('gameStarted', room);
      
      callback({ success: true });
    } catch (error) {
      console.error('Error starting game:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Game action
  socket.on('gameAction', (roomId, playerId, action) => {
    try {
      if (!rooms.has(roomId)) return;
      
      const room = rooms.get(roomId);
      
      // Add timestamp to action
      const timestampedAction = {
        ...action,
        timestamp: Date.now()
      };
      
      // Store action
      if (!room.actions) room.actions = [];
      room.actions.push(timestampedAction);
      
      // Broadcast to all players in the room
      io.to(roomId).emit('gameActionReceived', timestampedAction);
    } catch (error) {
      console.error('Error processing game action:', error);
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectionCount--;
    
    // Find rooms where this socket is a player
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        console.log(`Player ${player.name} (${player.id}) disconnected from room ${roomId}`);
        
        // Mark player as disconnected
        player.isConnected = false;
        
        // Notify other players
        io.to(roomId).emit('playerDisconnected', player.id);
        io.to(roomId).emit('roomUpdated', room);
        
        // If all players disconnected, remove the room after a delay
        const allDisconnected = room.players.every(p => !p.isConnected);
        if (allDisconnected) {
          setTimeout(() => {
            // Check again after timeout
            const currentRoom = rooms.get(roomId);
            if (currentRoom && currentRoom.players.every(p => !p.isConnected)) {
              console.log(`Removing inactive room: ${roomId}`);
              rooms.delete(roomId);
            }
          }, 1000 * 60 * 5); // 5 minutes
        }
      }
    });
  });

  // Reconnect player
  socket.on('reconnectPlayer', (roomId, playerId, callback) => {
    try {
      if (!rooms.has(roomId)) {
        return callback({ success: false, error: 'Room not found' });
      }
      
      const room = rooms.get(roomId);
      const player = room.players.find(p => p.id === playerId);
      
      if (!player) {
        return callback({ success: false, error: 'Player not found' });
      }
      
      // Update socket ID and connection status
      player.socketId = socket.id;
      player.isConnected = true;
      
      socket.join(roomId);
      io.to(roomId).emit('playerReconnected', playerId);
      io.to(roomId).emit('roomUpdated', room);
      
      // Send all actions to the reconnected player
      if (room.actions && room.actions.length > 0) {
        socket.emit('syncGameActions', room.actions);
      }
      
      callback({ success: true, room });
    } catch (error) {
      console.error('Error reconnecting player:', error);
      callback({ success: false, error: error.message });
    }
  });
});

// Start server
httpServer.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS allowed origins: ${process.env.ALLOWED_ORIGINS || '*'}`);
});
