import { io, Socket } from 'socket.io-client';

export interface MultiplayerRoom {
  id: string;
  players: MultiplayerPlayer[];
  isStarted: boolean;
  maxPlayers: number;
}

export interface MultiplayerPlayer {
  id: string;
  socketId: string;
  name: string;
  color: string;
  isReady: boolean;
  isConnected: boolean;
}

export interface GameAction {
  type: string;
  payload: any;
  timestamp: number;
}

class SocketService {
  private socket: Socket | null = null;
  private currentRoom: MultiplayerRoom | null = null;
  private currentPlayerId: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnecting: boolean = false;  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('SocketService.connect() called');
      console.log('Current state:', {
        connected: this.socket?.connected,
        isConnecting: this.isConnecting,
        socketExists: !!this.socket
      });

      // Prevent multiple connection attempts
      if (this.socket?.connected) {
        console.log('Already connected, resolving immediately');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('Already connecting, waiting for existing connection');
        // Wait for existing connection attempt
        const checkConnection = () => {
          if (this.socket?.connected) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }      this.isConnecting = true;
      console.log('Setting isConnecting to true');      // Cleanup any existing socket first
      if (this.socket) {
        console.log('Cleaning up existing socket');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }      // Connect to Socket.IO server
      // For Vercel deployments, we need to handle websockets differently
      let socketUrl = window.location.origin;
      let socketPath = undefined;
      
      // In production on Vercel, use their serverless functions through API routes
      if (process.env.NODE_ENV === 'production') {
        // On Vercel, we can use Socket.IO through a serverless function
        // or fall back to a separate WebSocket server if needed
        if (process.env.NEXT_PUBLIC_USE_EXTERNAL_SOCKET === 'true' && 
            process.env.NEXT_PUBLIC_SOCKET_SERVER_URL) {
          // Use external socket server if configured
          socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
        } else {
          // Otherwise try to use Vercel's serverless functions
          socketPath = '/api/socketio';
        }
      }
      
      console.log('Attempting to connect to:', socketUrl, 'with path:', socketPath || 'default');
      this.socket = io(socketUrl, {
        forceNew: true, // Force a new connection
        timeout: 10000, // 10 second timeout
        transports: ['polling', 'websocket'], // Try polling first on Vercel
        path: socketPath
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnecting = false;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.isConnecting = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        this.isConnecting = false;
        this.emit('disconnected');
      });

      // Room events
      this.socket.on('room_updated', (data) => {
        if (this.currentRoom) {
          this.currentRoom.players = data.players;
          this.currentRoom.isStarted = data.isStarted;
        }
        this.emit('room_updated', data);
      });

      this.socket.on('game_started', (data) => {
        this.emit('game_started', data);
      });

      this.socket.on('game_action', (action) => {
        this.emit('game_action', action);
      });

      this.socket.on('player_disconnected', (data) => {
        this.emit('player_disconnected', data);
      });

      this.socket.on('host_changed', (data) => {
        this.emit('host_changed', data);
      });

      // Set a timeout for connection attempt
      setTimeout(() => {
        if (this.isConnecting) {
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoom = null;
    this.currentPlayerId = null;
    this.eventListeners.clear();
    this.isConnecting = false;
  }

  createRoom(playerData: { name: string; color: string }): Promise<{
    success: boolean;
    roomId?: string;
    playerId?: string;
    room?: MultiplayerRoom;
    error?: string;
  }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('create_room', playerData, (response: any) => {
        if (response.success) {
          this.currentRoom = response.room;
          this.currentPlayerId = response.playerId;
        }
        resolve(response);
      });
    });
  }

  joinRoom(roomId: string, playerData: { name: string; color: string }): Promise<{
    success: boolean;
    playerId?: string;
    room?: MultiplayerRoom;
    error?: string;
  }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('join_room', { roomId, playerData }, (response: any) => {
        if (response.success) {
          this.currentRoom = response.room;
          this.currentPlayerId = response.playerId;
        }
        resolve(response);
      });
    });
  }

  toggleReady(): Promise<{ success: boolean; isReady?: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('player_ready', (response: any) => {
        resolve(response);
      });
    });
  }

  startGame(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('start_game', (response: any) => {
        resolve(response);
      });
    });
  }

  sendGameAction(action: GameAction): void {
    if (this.socket) {
      this.socket.emit('game_action', action);
    }
  }

  getCurrentRoom(): MultiplayerRoom | null {
    return this.currentRoom;
  }

  getCurrentPlayerId(): string | null {
    return this.currentPlayerId;
  }

  isHost(): boolean {
    if (!this.currentRoom || !this.currentPlayerId) return false;
    const hostPlayer = this.currentRoom.players.find(p => p.id === this.currentPlayerId);
    return hostPlayer !== undefined;
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

export const socketService = new SocketService();
