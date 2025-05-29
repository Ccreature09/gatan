import { create } from 'zustand';
import { socketService } from '../services/socketService';
import { GameState, GameAction, Player, PlayerConfig } from '../types/game';
import { useGameStore } from './gameStore';

// Helper function to execute game actions
const executeGameAction = (action: any) => {
  const gameStore = useGameStore.getState();
  
  // Handle both payload (from socket) and data (from local) properties
  const actionData = action.payload || action.data || {};
  
  switch (action.type) {
    case 'ROLL_DICE':
      gameStore.rollDice();
      break;
    case 'BUILD_SETTLEMENT':
      if (actionData.vertexId) {
        gameStore.buildSettlement(actionData.vertexId);
      }
      break;
    case 'BUILD_CITY':
      if (actionData.vertexId) {
        gameStore.buildCity(actionData.vertexId);
      }
      break;
    case 'BUILD_ROAD':
      if (actionData.edgeId) {
        gameStore.buildRoad(actionData.edgeId);
      }
      break;
    case 'END_TURN':
      gameStore.endTurn();
      break;    case 'PLAY_DEVELOPMENT_CARD':
      if (actionData.card) {
        gameStore.playDevelopmentCard(actionData.card);
      }
      break;
    case 'BUY_DEVELOPMENT_CARD':
      gameStore.buyDevelopmentCard();
      break;
    case 'MOVE_ROBBER':
      if (actionData.hexId) {
        gameStore.moveRobber(actionData.hexId, actionData.targetPlayerId);
      }
      break;
    default:
      console.warn('Unknown game action:', action.type);
  }
};

interface MultiplayerGameInterfaceState {
  // Multiplayer-specific state
  isMultiplayer: boolean;
  roomId: string | null;
  localPlayerId: string | null;
  connectedPlayers: string[];
  
  // Game synchronization
  isHost: boolean;
  isPendingAction: boolean;
  lastSyncTimestamp: number;
  
  // Actions
  initializeMultiplayerGame: (playerConfigs: PlayerConfig[], roomId: string, localPlayerId: string) => void;
  sendGameAction: (action: GameAction) => void;
  handleRemoteAction: (action: GameAction, fromPlayerId: string) => void;
  syncGameState: () => void;
  leaveMultiplayerGame: () => void;
}

export const useMultiplayerGameInterface = create<MultiplayerGameInterfaceState>((set, get) => ({
  // Initial state
  isMultiplayer: false,
  roomId: null,
  localPlayerId: null,
  connectedPlayers: [],
  isHost: false,
  isPendingAction: false,
  lastSyncTimestamp: 0,

  // Initialize multiplayer game
  initializeMultiplayerGame: (playerConfigs: PlayerConfig[], roomId: string, localPlayerId: string) => {
    const gameStore = useGameStore.getState();
    
    // Initialize the local game with multiplayer players
    gameStore.initializeGame(playerConfigs);
    
    // Set multiplayer state
    set({
      isMultiplayer: true,
      roomId,
      localPlayerId,
      isHost: gameStore.players[0]?.id === localPlayerId, // First player is host
      connectedPlayers: playerConfigs.map(p => p.id || ''),
      lastSyncTimestamp: Date.now()
    });    // Set up socket listeners for game actions
    socketService.on('game_action', (data: any) => {
      if (data.playerId !== localPlayerId) {
        // Extract the action from the received data (server spreads the action directly)
        const { playerId, timestamp, ...action } = data;
        get().handleRemoteAction(action, playerId);
      }
    });
  },
  // Send a game action to other players
  sendGameAction: (action: GameAction) => {
    const state = get();
    if (!state.isMultiplayer || !state.roomId) return;

    set({ isPendingAction: true });

    // Send to other players via socket
    socketService.sendGameAction({
      type: action.type,
      payload: action.data || {},
      timestamp: Date.now()
    });

    // Execute locally immediately for responsive UI
    executeGameAction(action);
    
    set({ isPendingAction: false });
  },  // Handle actions received from other players
  handleRemoteAction: (action: any, fromPlayerId: string) => {
    const state = get();
    if (!state.isMultiplayer) return;

    console.log('Received remote action:', action.type, 'from player:', fromPlayerId);

    // Execute the action locally to stay in sync
    executeGameAction(action);
    
    set({ lastSyncTimestamp: Date.now() });
  },

  // Synchronize game state
  syncGameState: () => {
    const state = get();
    if (!state.isMultiplayer || !state.isHost) return;

    // Host broadcasts full game state periodically
    const gameStore = useGameStore.getState();
    
    socketService.sendGameAction({
      type: 'SYNC_GAME_STATE',
      payload: {
        players: gameStore.players,
        currentPlayerId: gameStore.currentPlayerId,
        phase: gameStore.phase,
        turn: gameStore.turn,
        diceRoll: gameStore.diceRoll
      },
      timestamp: Date.now()
    });
  },
  // Leave multiplayer game
  leaveMultiplayerGame: () => {
    // Clear active game session when leaving the game
    localStorage.removeItem('activeGameSession');
    
    socketService.off('game_action', () => {});
    
    set({
      isMultiplayer: false,
      roomId: null,
      localPlayerId: null,
      connectedPlayers: [],
      isHost: false,
      isPendingAction: false,
      lastSyncTimestamp: 0
    });
  }
}));
