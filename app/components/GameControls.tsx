import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useMultiplayerGameInterface } from '../store/multiplayerGameInterface';
import { DiceRoller } from './DiceRoller';

export const GameControls: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    phase, 
    diceRoll, 
    currentPlayerId,
    players 
  } = useGameStore();
  const { isMultiplayer, localPlayerId } = useMultiplayerGameInterface();
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isMyTurn = !isMultiplayer || (localPlayerId === currentPlayerId);

  const getPhaseDescription = () => {
    switch (phase) {
      case 'setup-settlement-1':
        return { text: 'Place first settlement', icon: '🏠', color: 'text-blue-400' };
      case 'setup-road-1':
        return { text: 'Place first road', icon: '🛤️', color: 'text-gray-400' };
      case 'setup-settlement-2':
        return { text: 'Place second settlement', icon: '🏠', color: 'text-blue-400' };
      case 'setup-road-2':
        return { text: 'Place second road', icon: '🛤️', color: 'text-gray-400' };
      case 'roll-dice':
        return { text: 'Dice rolling...', icon: '🎲', color: 'text-yellow-400' };
      case 'main-turn':
        return { text: 'Build, trade, or buy', icon: '⚡', color: 'text-green-400' };
      case 'move-robber':
        return { text: 'Move the robber', icon: '🦹', color: 'text-red-400' };
      case 'discard-cards':
        return { text: 'Discard cards (7+)', icon: '🗑️', color: 'text-orange-400' };
      case 'steal-card':
        return { text: 'Steal a card', icon: '🎯', color: 'text-purple-400' };
      case 'game-over':
        return { text: 'Game Over!', icon: '🏆', color: 'text-yellow-400' };
      default:
        return { text: phase, icon: '❓', color: 'text-gray-400' };
    }
  };
  return (
    <>
      {/* Floating Game Status - Minimized */}
      {!isExpanded && (
        <div className="fixed bottom-4 left-4 z-40 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border border-gray-600 p-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getPhaseDescription().icon}</span>
            <div className="text-white">
              <div className="font-bold text-sm">{getPhaseDescription().text}</div>
              {currentPlayer && (
                <div className="text-xs text-gray-300 flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-400"
                    style={{ backgroundColor: currentPlayer.color }}
                  />
                  <span>{currentPlayer.name}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-gray-400 hover:text-white transition-colors ml-2"
            >
              ⚙️
            </button>
          </div>
        </div>
      )}

      {/* Expanded Game Controls */}
      {isExpanded && (
        <div className="fixed bottom-4 left-4 z-40 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border border-gray-600 p-4 w-80 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Game Status</h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Current Player & Phase */}
          {currentPlayer && (
            <div className="mb-4 p-3 bg-gradient-to-r from-gray-700 to-gray-600 border-l-4 border-blue-500 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-400"
                    style={{ backgroundColor: currentPlayer.color }}
                  />
                  <span className="font-bold text-yellow-300 text-sm">{currentPlayer.name}</span>
                </div>
                <span className="text-gray-300 text-xs">
                  {isMyTurn ? '(Your turn)' : 'playing'}
                </span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-800 rounded text-xs">
                <span className="text-lg">{getPhaseDescription().icon}</span>
                <div>
                  <p className={`font-medium ${getPhaseDescription().color}`}>
                    {getPhaseDescription().text}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {phase.startsWith('setup') ? 'Setup Phase' : 'Main Game'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dice Section */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-white flex items-center">
              🎲 Dice Roll
            </h3>
            <div className="bg-gray-700 border border-gray-600 rounded p-3">
              <DiceRoller />
            </div>
          </div>

          {/* All Players Quick View */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-white">All Players</h3>
            <div className="space-y-1">
              {players.map(player => (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between p-2 rounded border text-xs ${
                    player.id === currentPlayerId 
                      ? 'bg-yellow-800 border-yellow-600' 
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2 border border-gray-400"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className={`font-medium ${
                      player.id === currentPlayerId ? 'text-yellow-200' : 'text-white'
                    }`}>{player.name.slice(0, 8)}</span>
                  </div>
                  <div className={`text-xs ${
                    player.id === currentPlayerId ? 'text-yellow-300' : 'text-gray-300'
                  }`}>
                    VP: {player.victoryPoints} | 
                    Cards: {Object.values(player.resources).reduce((sum, count) => sum + count, 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Building Costs Reference */}
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
            <h3 className="text-sm font-semibold mb-3 text-white flex items-center">
              🏗️ Building Costs
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <div className="flex items-center space-x-1">
                  <span>🏠</span>
                  <span className="text-gray-200">Settlement</span>
                </div>
                <div className="flex space-x-1">
                  <span title="Wood">🌲</span>
                  <span title="Brick">🧱</span>
                  <span title="Sheep">🐑</span>
                  <span title="Wheat">🌾</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <div className="flex items-center space-x-1">
                  <span>🏛️</span>
                  <span className="text-gray-200">City</span>
                </div>
                <div className="flex space-x-1">
                  <span title="Wheat">🌾</span>
                  <span title="Wheat">🌾</span>
                  <span title="Ore">⛰️</span>
                  <span title="Ore">⛰️</span>
                  <span title="Ore">⛰️</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <div className="flex items-center space-x-1">
                  <span>🛤️</span>
                  <span className="text-gray-200">Road</span>
                </div>
                <div className="flex space-x-1">
                  <span title="Wood">🌲</span>
                  <span title="Brick">🧱</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <div className="flex items-center space-x-1">
                  <span>🃏</span>
                  <span className="text-gray-200">Dev Card</span>
                </div>
                <div className="flex space-x-1">
                  <span title="Sheep">🐑</span>
                  <span title="Wheat">🌾</span>
                  <span title="Ore">⛰️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
