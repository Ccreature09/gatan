const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const port = process.env.PORT || 3001;

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Default response for other requests
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Catan Game Server is running');
});

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3002"], // Allow Next.js dev server
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Game state management
const gameRooms = new Map();
const playerSockets = new Map();

// Game room structure
const createGameRoom = (roomId, hostPlayerId) => ({
  id: roomId,
  hostId: hostPlayerId,
  players: new Map(),
  gameState: null,
  isStarted: false,
  maxPlayers: 4,
  createdAt: new Date()
});

// Player structure
const createPlayer = (socketId, playerData) => ({
  id: uuidv4(),
  socketId,
  name: playerData.name || 'Unknown Player',
  color: playerData.color || '#ff4444',
  isReady: false,
  isConnected: true
});

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create or join room
  socket.on('create_room', (playerData, callback) => {
    const roomId = uuidv4().substring(0, 6).toUpperCase(); // Short room code
    const player = createPlayer(socket.id, playerData);
    const room = createGameRoom(roomId, player.id);
    
    room.players.set(player.id, player);
    gameRooms.set(roomId, room);
    playerSockets.set(socket.id, { playerId: player.id, roomId });
    
    socket.join(roomId);
    
    callback({
      success: true,
      roomId,
      playerId: player.id,
      room: {
        id: room.id,
        players: Array.from(room.players.values()),
        isStarted: room.isStarted,
        maxPlayers: room.maxPlayers
      }
    });

    // Broadcast room update
    socket.to(roomId).emit('room_updated', {
      players: Array.from(room.players.values()),
      isStarted: room.isStarted
    });
  });

  socket.on('join_room', (data, callback) => {
    const { roomId, playerData } = data;
    const room = gameRooms.get(roomId);

    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.players.size >= room.maxPlayers) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    if (room.isStarted) {
      callback({ success: false, error: 'Game already started' });
      return;
    }

    const player = createPlayer(socket.id, playerData);
    room.players.set(player.id, player);
    playerSockets.set(socket.id, { playerId: player.id, roomId });

    socket.join(roomId);

    callback({
      success: true,
      playerId: player.id,
      room: {
        id: room.id,
        players: Array.from(room.players.values()),
        isStarted: room.isStarted,
        maxPlayers: room.maxPlayers
      }
    });

    // Broadcast room update
    io.to(roomId).emit('room_updated', {
      players: Array.from(room.players.values()),
      isStarted: room.isStarted
    });
  });

  socket.on('player_ready', (callback) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) {
      callback({ success: false, error: 'Player not in room' });
      return;
    }

    const room = gameRooms.get(playerInfo.roomId);
    const player = room.players.get(playerInfo.playerId);
    
    player.isReady = !player.isReady;

    callback({ success: true, isReady: player.isReady });

    // Broadcast room update
    io.to(playerInfo.roomId).emit('room_updated', {
      players: Array.from(room.players.values()),
      isStarted: room.isStarted
    });
  });

  socket.on('start_game', (callback) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) {
      callback({ success: false, error: 'Player not in room' });
      return;
    }

    const room = gameRooms.get(playerInfo.roomId);
    
    // Check if player is host
    if (room.hostId !== playerInfo.playerId) {
      callback({ success: false, error: 'Only host can start game' });
      return;
    }

    // Check if all players are ready
    const allReady = Array.from(room.players.values()).every(p => p.isReady);
    if (!allReady || room.players.size < 2) {
      callback({ success: false, error: 'All players must be ready (minimum 2 players)' });
      return;
    }

    room.isStarted = true;
    
    // Initialize game state
    const playerConfigs = Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color
    }));

    callback({ success: true });

    // Broadcast game start
    io.to(playerInfo.roomId).emit('game_started', {
      playerConfigs,
      roomId: room.id
    });
  });

  // Game action handlers
  socket.on('game_action', (action) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const room = gameRooms.get(playerInfo.roomId);
    if (!room || !room.isStarted) return;

    // Broadcast action to all players in room
    socket.to(playerInfo.roomId).emit('game_action', {
      ...action,
      playerId: playerInfo.playerId
    });
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const room = gameRooms.get(playerInfo.roomId);
      if (room) {
        const player = room.players.get(playerInfo.playerId);
        if (player) {
          player.isConnected = false;
          
          // Broadcast player disconnection
          socket.to(playerInfo.roomId).emit('player_disconnected', {
            playerId: playerInfo.playerId,
            playerName: player.name
          });

          // If host disconnects, transfer host to another player
          if (room.hostId === playerInfo.playerId) {
            const connectedPlayers = Array.from(room.players.values()).filter(p => p.isConnected && p.id !== playerInfo.playerId);
            if (connectedPlayers.length > 0) {
              room.hostId = connectedPlayers[0].id;
              io.to(playerInfo.roomId).emit('host_changed', {
                newHostId: room.hostId
              });
            } else {
              // No players left, clean up room
              gameRooms.delete(playerInfo.roomId);
            }
          }
        }
      }
      playerSockets.delete(socket.id);
    }
  });
});

httpServer
  .once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`🎮 Catan Game Server running on port ${port}`);
    console.log(`📡 Socket.IO server ready for connections`);
    console.log(`🌐 CORS enabled for multiple ports`);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
