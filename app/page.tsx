'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { useMultiplayerGameStore } from './store/multiplayerGameStore';
import { GameBoard } from './components/GameBoard';
import { PlayerPanel } from './components/PlayerPanel';
import { GameControls } from './components/GameControls';
import { GameSetup } from './components/GameSetup';
import { MainMenu } from './components/MainMenu';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerGame } from './components/MultiplayerGame';
import { VictoryScreen } from './components/VictoryScreen';
import { RobberPlacement } from './components/RobberPlacement';
import { TradeInterface } from './components/TradeInterface';

export default function Home() {
  const [gameMode, setGameMode] = useState<'menu' | 'local' | 'online'>('menu');
  const [isRejoining, setIsRejoining] = useState(false);
  
  // Local game store
  const { 
    players: localPlayers, 
    winner: localWinner, 
    phase: localPhase, 
    initializeGame: initializeLocalGame 
  } = useGameStore();
  // Multiplayer game store
  const { 
    isGameStarted: multiplayerGameStarted,
    currentRoom,
    joinRoom,
    connect,
    disconnect
  } = useMultiplayerGameStore();

  const handleSelectMode = (mode: 'local' | 'online') => {
    setGameMode(mode);
  };

  const handleRejoinGame = async (sessionData: { roomId: string; playerName: string; playerId: string }) => {
    setIsRejoining(true);
    setGameMode('online');
    
    try {
      // Connect to the server
      await connect();
      
      // Attempt to rejoin the room
      const result = await joinRoom(sessionData.roomId, sessionData.playerName);
      
      if (!result.success) {
        // If rejoin failed, clear the session and go back to menu
        localStorage.removeItem('activeGameSession');
        setGameMode('menu');
        alert('Could not rejoin game: ' + (result.error || 'Game may no longer be active'));
      }
    } catch (error) {
      console.error('Error rejoining game:', error);
      localStorage.removeItem('activeGameSession');
      setGameMode('menu');
      alert('Could not rejoin game. The game may no longer be active.');
    } finally {
      setIsRejoining(false);
    }
  };  const handleBackToMenu = () => {
    // Clear active session when returning to menu
    localStorage.removeItem('activeGameSession');
    
    // Disconnect from multiplayer to clear room state
    if (gameMode === 'online') {
      disconnect();
    }
    
    setGameMode('menu');
    // Reset local game only if we were actually in a local game
    if (gameMode === 'local' && localPlayers.length > 0) {
      initializeLocalGame([]);
    }
  };
  // Main menu
  if (gameMode === 'menu') {
    return (
      <MainMenu 
        onSelectMode={handleSelectMode} 
        onRejoinGame={handleRejoinGame}
      />
    );
  }  // Online multiplayer
  if (gameMode === 'online') {
    if (isRejoining) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <h2 className="text-white text-xl font-semibold mb-2">Rejoining Game...</h2>
            <p className="text-gray-300">Attempting to reconnect to your game session</p>
          </div>
        </div>
      );
    }
    
    if (!multiplayerGameStarted) {
      return <MultiplayerLobby />;
    }
    
    // Render multiplayer game interface
    return <MultiplayerGame onBackToMenu={handleBackToMenu} />;
  }

  // Local multiplayer
  if (gameMode === 'local') {
    // Show setup screen if no players
    if (localPlayers.length === 0) {
      return (
        <div>
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={handleBackToMenu}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              ← Back to Menu
            </button>
          </div>
          <GameSetup />
        </div>
      );
    }

    const winnerPlayer = localWinner ? localPlayers.find(p => p.id === localWinner) : null;

    const handleNewGame = () => {
      initializeLocalGame();
    };    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        {/* Fullscreen Game Board */}
        <GameBoard />
          {/* Floating UI Panels */}
        <PlayerPanel />
        <GameControls />
        
        {/* Trade Interface Overlay */}
        {localPhase === 'main-turn' && <TradeInterface />}

        {/* Menu Button */}
        <button
          onClick={handleBackToMenu}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold transition-colors shadow-lg border border-gray-600"
        >
          ← Menu
        </button>

        {/* Overlays */}
        {localPhase === 'move-robber' && <RobberPlacement />}
        
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
  }

  return null;
}
