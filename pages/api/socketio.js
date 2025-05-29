// pages/api/socketio.js
import { Server } from "socket.io";
import { v4 as uuidv4 } from 'uuid';

// Rooms collection - in a real app, you would use a database
const rooms = new Map();

export default function SocketHandler(req, res) {
  // Check if Socket.io server is already initialized
  if (res.socket.server.io) {
    console.log('Socket server already running');
    res.end();
    return;
  }

  // Set up Socket.io server
  const io = new Server(res.socket.server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ["GET", "POST"],
    },
  });

  // Store io instance on the server object
  res.socket.server.io = io;

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

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

  console.log('Socket.io server started');
  res.end();
}
