import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerConfig } from '../types/game';

export const GameSetup: React.FC = () => {
  const { initializeGame } = useGameStore();  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [playerCount, setPlayerCount] = useState(2);
  const handleStartGame = () => {
    const selectedPlayers = playerNames.slice(0, playerCount).map((name, index) => ({
      name: name || `Player ${index + 1}`,
      color: playerColors[index]
    }));
    initializeGame(selectedPlayers);
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const playerColors = ['#ff4444', '#4444ff', '#44ff44', '#ffaa00'];
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 max-w-lg w-full border border-gray-700">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏝️</div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Settlers of Catan
          </h1>
          <p className="text-gray-300 text-lg">
            Configure your game and start building!
          </p>
        </div>

        <div className="space-y-6">
          {/* Player Count Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <span className="flex items-center">
                👥 Number of Players
                <span className="ml-2 text-xs text-gray-400">(Choose 2-4 players)</span>
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    playerCount === count
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs">Players</div>
                </button>
              ))}
            </div>
          </div>          {/* Player Names */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <span className="flex items-center">
                ✏️ Player Names
                <span className="ml-2 text-xs text-gray-400">(Customize your players)</span>
              </span>
            </label>
            <div className="space-y-3">
              {Array.from({ length: playerCount }).map((_, index) => (
                <div key={index} className="group">
                  <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-400 shadow-sm"
                        style={{ backgroundColor: playerColors[index] }}
                      />
                      <span className="text-sm font-medium text-gray-300">
                        Player {index + 1}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={playerNames[index]}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={`Enter name for Player ${index + 1}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>          {/* Start Game Button */}
          <div className="pt-6">
            <button
              onClick={handleStartGame}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 border border-green-500 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🚀 Start Game
            </button>
          </div>
        </div>

        {/* Game Info Panel */}
        <div className="mt-8 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <h3 className="font-medium mb-3 text-white flex items-center">
            📋 Quick Game Guide
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-yellow-400">🏆</span>
                <span className="ml-1">First to 10 VP wins</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-400">🏠</span>
                <span className="ml-1">Settlements = 1 VP</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-400">🏛️</span>
                <span className="ml-1">Cities = 2 VP</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-red-400">🎲</span>
                <span className="ml-1">Roll 7 = Move robber</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-400">🔄</span>
                <span className="ml-1">Trade resources</span>
              </div>
              <div className="flex items-center">
                <span className="text-orange-400">🃏</span>
                <span className="ml-1">Buy development cards</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
