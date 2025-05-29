import { create } from 'zustand';
import { socketService, MultiplayerRoom, MultiplayerPlayer, GameAction } from '../services/socketService';
import { GameState, GameAction as LocalGameAction, PlayerConfig } from '../types/game';

interface MultiplayerGameState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Room state
  currentRoom: MultiplayerRoom | null;
  currentPlayerId: string | null;
  isHost: boolean;
  
  // Game state
  gameState: GameState | null;
  isGameStarted: boolean;
  
  // UI state
  showRoomCode: boolean;
  joinRoomInput: string;
  playerName: string;
    // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  createRoom: (playerName: string) => Promise<{ success: boolean; roomId?: string; error?: string }>;
  joinRoom: (roomId: string, playerName: string) => Promise<{ success: boolean; error?: string }>;
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  sendGameAction: (action: LocalGameAction) => void;
  _initialize: () => (() => void) | undefined;
  
  // Setters
  setJoinRoomInput: (input: string) => void;
  setPlayerName: (name: string) => void;
  setShowRoomCode: (show: boolean) => void;
}

const getRandomColor = (): string => {
  const colors = ['#ff4444', '#4444ff', '#44ff44', '#ffaa00', '#ff44aa', '#44ffaa'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useMultiplayerGameStore = create<MultiplayerGameState>((set, get) => ({
  // Initial state
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  currentRoom: null,
  currentPlayerId: null,
  isHost: false,
  gameState: null,
  isGameStarted: false,
  showRoomCode: false,
  joinRoomInput: '',
  playerName: '',
  // Connect to server
  connect: async () => {
    const state = get();
    
    // Prevent multiple connection attempts
    if (state.isConnected || state.isConnecting) {
      return;
    }

    set({ isConnecting: true, connectionError: null });
    
    try {
      await socketService.connect();
        // Set up event listeners
      socketService.on('room_updated', (data: any) => {
        const state = get();
        if (state.currentRoom) {
          set({
            currentRoom: {
              ...state.currentRoom,
              players: data.players,
              isStarted: data.isStarted
            }
          });
        }
      });      socketService.on('game_started', (data: any) => {
        console.log('Game started with data:', data);
        const state = get();
        
        // Save active game session to localStorage for rejoin functionality
        if (state.currentRoom && state.currentPlayerId && state.playerName) {
          const sessionData = {
            roomId: state.currentRoom.id,
            playerName: state.playerName,
            playerId: state.currentPlayerId,
            timestamp: Date.now()
          };
          localStorage.setItem('activeGameSession', JSON.stringify(sessionData));
        }
        
        set({ 
          isGameStarted: true,
          currentRoom: data.roomId ? { 
            ...get().currentRoom!, 
            id: data.roomId 
          } : get().currentRoom
        });
        // The actual game initialization will be handled by MultiplayerGameInterface
      });

      socketService.on('game_action', (action: GameAction) => {
        // Handle incoming game actions from other players
        const state = get();
        if (state.gameState) {
          // Apply the action to local game state
          // This would need integration with your game logic
        }
      });

      socketService.on('player_disconnected', (data: any) => {
        // Handle player disconnection
        console.log(`Player ${data.playerName} disconnected`);
      });

      socketService.on('host_changed', (data: any) => {
        const state = get();
        set({ isHost: state.currentPlayerId === data.newHostId });
      });

      socketService.on('disconnected', () => {
        set({
          isConnected: false,
          currentRoom: null,
          currentPlayerId: null,
          isHost: false,
          isGameStarted: false
        });
      });

      set({ isConnected: true, isConnecting: false });
    } catch (error) {
      set({
        isConnecting: false,
        connectionError: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  },
  // Disconnect from server
  disconnect: () => {
    // Clear active game session when disconnecting
    localStorage.removeItem('activeGameSession');
    
    socketService.disconnect();
    set({
      isConnected: false,
      currentRoom: null,
      currentPlayerId: null,
      isHost: false,
      isGameStarted: false,
      gameState: null
    });
  },
  // Create a new room
  createRoom: async (playerName: string) => {
    const playerData = {
      name: playerName,
      color: getRandomColor()
    };

    const response = await socketService.createRoom(playerData);
    
    if (response.success && response.room) {
      set({
        currentRoom: response.room,
        currentPlayerId: response.playerId,
        isHost: true,
        showRoomCode: true,
        playerName: playerName // Store player name for session saving
      });
    }

    return response;
  },
  // Join an existing room
  joinRoom: async (roomId: string, playerName: string) => {
    const playerData = {
      name: playerName,
      color: getRandomColor()
    };

    const response = await socketService.joinRoom(roomId, playerData);
    
    if (response.success && response.room) {
      set({
        currentRoom: response.room,
        currentPlayerId: response.playerId,
        isHost: false,
        playerName: playerName // Store player name for session saving
      });
    }

    return response;
  },

  // Toggle player ready state
  toggleReady: async () => {
    await socketService.toggleReady();
  },

  // Start the game (host only)
  startGame: async () => {
    const response = await socketService.startGame();
    if (!response.success && response.error) {
      console.error('Failed to start game:', response.error);
    }
  },
  // Send game action to other players
  sendGameAction: (action: LocalGameAction) => {
    const gameAction: GameAction = {
      type: action.type,
      payload: action.data || {},
      timestamp: Date.now()
    };
    socketService.sendGameAction(gameAction);
  },

  // Setters
  setJoinRoomInput: (input: string) => set({ joinRoomInput: input }),
  setPlayerName: (name: string) => set({ playerName: name }),
  setShowRoomCode: (show: boolean) => set({ showRoomCode: show }),
  // Add browser cleanup handlers
  _initialize: () => {
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      const cleanup = () => {
        const state = get();
        if (state.isConnected) {
          console.log('multiplayerGameStore: Disconnecting due to page unload');
          socketService.disconnect();
        }
      };

      const beforeUnloadHandler = () => {
        console.log('multiplayerGameStore: beforeunload event');
        cleanup();
      };

      const unloadHandler = () => {
        console.log('multiplayerGameStore: unload event');
        cleanup();
      };

      window.addEventListener('beforeunload', beforeUnloadHandler);
      window.addEventListener('unload', unloadHandler);
      
      // Return cleanup function that only removes listeners
      // Don't disconnect socket on component unmount in dev mode
      return () => {
        console.log('multiplayerGameStore: Cleanup function called');
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        window.removeEventListener('unload', unloadHandler);
        // Don't call cleanup() here to prevent disconnection on re-renders
      };
    }
  },
}));
