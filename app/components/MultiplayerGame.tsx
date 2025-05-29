import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useMultiplayerGameStore } from '../store/multiplayerGameStore';
import { useMultiplayerGameInterface } from '../store/multiplayerGameInterface';
import { GameBoard } from './GameBoard';
import { PlayerPanel } from './PlayerPanel';
import { GameControls } from './GameControls';
import { VictoryScreen } from './VictoryScreen';
import { RobberPlacement } from './RobberPlacement';
import { TradeInterface } from './TradeInterface';

interface MultiplayerGameProps {
  onBackToMenu: () => void;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ onBackToMenu }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Multiplayer stores
  const { currentRoom, currentPlayerId } = useMultiplayerGameStore();
  const { 
    initializeMultiplayerGame, 
    leaveMultiplayerGame,
    isMultiplayer 
  } = useMultiplayerGameInterface();
  
  // Local game store
  const { 
    players, 
    winner, 
    phase, 
    initializeGame 
  } = useGameStore();

  // Initialize the multiplayer game when component mounts
  useEffect(() => {
    if (currentRoom && currentPlayerId && !isInitialized) {
      const playerConfigs = currentRoom.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color
      }));

      initializeMultiplayerGame(playerConfigs, currentRoom.id, currentPlayerId);
      setIsInitialized(true);
    }
  }, [currentRoom, currentPlayerId, initializeMultiplayerGame, isInitialized]);

  const handleLeaveGame = () => {
    leaveMultiplayerGame();
    onBackToMenu();
  };

  const handleNewGame = () => {
    // In multiplayer, only host should be able to restart
    // For now, just go back to lobby
    handleLeaveGame();
  };

  if (!isInitialized || !currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold mb-2">Initializing Game...</h2>
          <div className="animate-pulse text-gray-300">Setting up the board</div>
        </div>
      </div>
    );
  }

  const winnerPlayer = winner ? players.find(p => p.id === winner) : null;
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 to-green-100">
      {/* Fullscreen Game Board */}
      <GameBoard />
      
      {/* Floating UI Panels */}
      <PlayerPanel />
      <GameControls />      {/* Multiplayer-specific Room Info Overlay */}
      <div className="fixed top-20 left-4 z-30 bg-gray-800 bg-opacity-95 rounded-lg p-3 shadow-lg border border-gray-600">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-green-600 px-2 py-1 rounded text-white text-xs">
            🌐 Online
          </div>
          <div className="text-gray-300 text-sm">
            Room: <span className="text-white font-mono">{currentRoom.id}</span>
          </div>
        </div>
        
        {/* Connected Players */}
        <div className="space-y-1">
          {currentRoom.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${
                player.id === currentPlayerId
                  ? 'bg-blue-600 bg-opacity-30'
                  : 'bg-gray-700 bg-opacity-50'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className="text-white">{player.name}</span>
              {!player.isConnected && (
                <span className="text-red-400">⚠️</span>
              )}
              {player.id === currentPlayerId && (
                <span className="text-blue-400">(You)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Game Button */}
      <button
        onClick={handleLeaveGame}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-lg border border-red-500"
      >
        🚪 Leave Game
      </button>      {/* Trade Interface Overlay */}
      {phase === 'main-turn' && <TradeInterface />}

      {/* Overlays */}
      {phase === 'move-robber' && <RobberPlacement />}
      
      {winnerPlayer && (
        <VictoryScreen
          winnerId={winnerPlayer.id}
          winnerName={winnerPlayer.name}
          winnerColor={winnerPlayer.color}
          onNewGame={handleNewGame}
        />
      )}
    </div>
  );
};
