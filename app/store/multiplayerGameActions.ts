import { useGameStore } from './gameStore';
import { useMultiplayerGameInterface } from './multiplayerGameInterface';
import { DevelopmentCard } from '../types/game';

// Multiplayer-aware game actions that sync with other players
export const useMultiplayerGameActions = () => {
  const { isMultiplayer, sendGameAction, localPlayerId } = useMultiplayerGameInterface();
  const gameStore = useGameStore();

  const rollDice = () => {
    if (isMultiplayer && localPlayerId) {
      sendGameAction({ type: 'ROLL_DICE', playerId: localPlayerId, data: {} });
    } else {
      gameStore.rollDice();
    }
  };

  const buildSettlement = (vertexId: string) => {
    if (isMultiplayer && localPlayerId) {
      sendGameAction({ type: 'BUILD_SETTLEMENT', playerId: localPlayerId, data: { vertexId } });
    } else {
      gameStore.buildSettlement(vertexId);
    }
  };

  const buildCity = (vertexId: string) => {
    if (isMultiplayer && localPlayerId) {
      sendGameAction({ type: 'BUILD_CITY', playerId: localPlayerId, data: { vertexId } });
    } else {
      gameStore.buildCity(vertexId);
    }
  };

  const buildRoad = (edgeId: string) => {
    if (isMultiplayer && localPlayerId) {
      sendGameAction({ type: 'BUILD_ROAD', playerId: localPlayerId, data: { edgeId } });
    } else {
      gameStore.buildRoad(edgeId);
    }
  };

  const endTurn = () => {
    if (isMultiplayer && localPlayerId) {
      sendGameAction({ type: 'END_TURN', playerId: localPlayerId, data: {} });
    } else {
      gameStore.endTurn();
    }
  };

  const playDevelopmentCard = (card: DevelopmentCard) => {
    if (isMultiplayer && localPlayerId) {
      sendGameAction({ type: 'PLAY_DEVELOPMENT_CARD', playerId: localPlayerId, data: { card } });
    } else {
      gameStore.playDevelopmentCard(card);
    }
  };

  const moveRobber = (hexId: string, targetPlayerId?: string) => {
    if (isMultiplayer && localPlayerId) {
      sendGameAction({ type: 'MOVE_ROBBER', playerId: localPlayerId, data: { hexId, targetPlayerId } });
    } else {
      gameStore.moveRobber(hexId, targetPlayerId);
    }
  };

  const buyDevelopmentCard = () => {
    if (isMultiplayer && localPlayerId) {
      sendGameAction({ type: 'BUY_DEVELOPMENT_CARD', playerId: localPlayerId, data: {} });
    } else {
      gameStore.buyDevelopmentCard();
    }
  };

  // Return the enhanced actions along with the game store state
  return {
    // Enhanced multiplayer actions
    rollDice,
    buildSettlement,
    buildCity,
    buildRoad,
    endTurn,
    playDevelopmentCard,
    moveRobber,
    buyDevelopmentCard,
    
    // Game store state and other methods (non-overridden)
    players: gameStore.players,
    currentPlayerId: gameStore.currentPlayerId,
    phase: gameStore.phase,
    turn: gameStore.turn,
    hexes: gameStore.hexes,
    vertices: gameStore.vertices,
    edges: gameStore.edges,
    robberHexId: gameStore.robberHexId,
    diceRoll: gameStore.diceRoll,
    tradeOffer: gameStore.tradeOffer,
    winner: gameStore.winner,
    developmentCardDeck: gameStore.developmentCardDeck,
    
    // Other methods that don't need multiplayer sync
    initializeGame: gameStore.initializeGame,
    trade: gameStore.trade,
    getVictoryPoints: gameStore.getVictoryPoints,
  };
};
