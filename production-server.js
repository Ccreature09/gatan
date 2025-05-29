const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Health check endpoint for Socket.IO server
      if (parsedUrl.pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          service: 'catan-game-server'
        }));
        return;
      }
      
      // Let Next.js handle all other requests
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create Socket.IO server with production CORS configuration
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || ["*"]
        : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  // Game state management (same as your existing server.js)
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
    name: playerData.name,
    color: playerData.color,
    isReady: false,
    isConnected: true,
    joinedAt: new Date()
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);    socket.on('create_room', (playerData, callback) => {
      try {
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

        console.log(`Room created: ${roomId} by player ${player.name}`);
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    socket.on('join_room', (data, callback) => {
      try {
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

        const roomData = {
          id: room.id,
          players: Array.from(room.players.values()),
          isStarted: room.isStarted,
          maxPlayers: room.maxPlayers
        };

        callback({
          success: true,
          playerId: player.id,
          room: roomData
        });

        socket.to(roomId).emit('room_updated', roomData);
        console.log(`Player ${player.name} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    socket.on('leave_room', () => {
      handlePlayerDisconnect(socket);
    });    socket.on('player_ready', (callback) => {
      try {
        const playerInfo = playerSockets.get(socket.id);
        if (!playerInfo) {
          callback({ success: false, error: 'Player not in room' });
          return;
        }

        const room = gameRooms.get(playerInfo.roomId);
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        const player = room.players.get(playerInfo.playerId);
        if (!player) {
          callback({ success: false, error: 'Player not found' });
          return;
        }

        player.isReady = !player.isReady;

        callback({ success: true, isReady: player.isReady });

        const roomData = {
          id: room.id,
          players: Array.from(room.players.values()),
          isStarted: room.isStarted,
          maxPlayers: room.maxPlayers
        };

        io.to(playerInfo.roomId).emit('room_updated', roomData);
      } catch (error) {
        console.error('Error updating player ready status:', error);
        callback({ success: false, error: 'Failed to update ready status' });
      }
    });

    socket.on('start_game', () => {
      try {
        const playerInfo = playerSockets.get(socket.id);
        if (!playerInfo) return;

        const room = gameRooms.get(playerInfo.roomId);
        if (!room) return;

        // Check if player is host
        if (room.hostId !== playerInfo.playerId) return;

        // Check if all players are ready
        const allReady = Array.from(room.players.values()).every(p => p.isReady);
        if (!allReady || room.players.size < 2) return;

        room.isStarted = true;
        io.to(playerInfo.roomId).emit('game_started', {
          players: Array.from(room.players.values())
        });

        console.log(`Game started in room ${playerInfo.roomId}`);
      } catch (error) {
        console.error('Error starting game:', error);
      }
    });

    socket.on('game_action', (action) => {
      try {
        const playerInfo = playerSockets.get(socket.id);
        if (!playerInfo) return;

        // Broadcast action to all players in the room except sender
        socket.to(playerInfo.roomId).emit('game_action', {
          ...action,
          playerId: playerInfo.playerId,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error handling game action:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      handlePlayerDisconnect(socket);
    });

    function handlePlayerDisconnect(socket) {
      try {
        const playerInfo = playerSockets.get(socket.id);
        if (!playerInfo) return;

        const room = gameRooms.get(playerInfo.roomId);
        if (!room) return;

        const player = room.players.get(playerInfo.playerId);
        if (player) {
          player.isConnected = false;
        }

        // If this was the host, assign new host
        if (room.hostId === playerInfo.playerId) {
          const remainingPlayers = Array.from(room.players.values()).filter(p => p.isConnected);
          if (remainingPlayers.length > 0) {
            room.hostId = remainingPlayers[0].id;
            socket.to(playerInfo.roomId).emit('host_changed', { newHostId: room.hostId });
          }
        }

        // Remove player after a delay to allow reconnection
        setTimeout(() => {
          if (room.players.has(playerInfo.playerId)) {
            const currentPlayer = room.players.get(playerInfo.playerId);
            if (!currentPlayer.isConnected) {
              room.players.delete(playerInfo.playerId);
              
              // If room is empty, delete it
              if (room.players.size === 0) {
                gameRooms.delete(playerInfo.roomId);
                console.log(`Room ${playerInfo.roomId} deleted - no players remaining`);
              } else {
                const roomData = {
                  id: room.id,
                  players: Array.from(room.players.values()),
                  isStarted: room.isStarted,
                  maxPlayers: room.maxPlayers
                };
                io.to(playerInfo.roomId).emit('room_updated', roomData);
              }
            }
          }
        }, 30000); // 30 second grace period for reconnection

        playerSockets.delete(socket.id);
        socket.leave(playerInfo.roomId);
      } catch (error) {
        console.error('Error handling player disconnect:', error);
      }
    }
  });

  // Start server
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server ready`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
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
});
