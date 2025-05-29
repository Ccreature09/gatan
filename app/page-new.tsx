'use client';

import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/GameBoard';
import { PlayerPanel } from './components/PlayerPanel';
import { GameControls } from './components/GameControls';

export default function Home() {
  const { initializeGame, players } = useGameStore();

  useEffect(() => {
    if (players.length === 0) {
      initializeGame();
    }
  }, [initializeGame, players.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏝️ Settlers of Catan
          </h1>
          <p className="text-gray-600">
            Build settlements, trade resources, and dominate the island!
          </p>
        </header>

        {/* Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Game Controls */}
          <div className="lg:col-span-1">
            <GameControls />
          </div>

          {/* Center - Game Board */}
          <div className="lg:col-span-2">
            <GameBoard />
          </div>

          {/* Right Panel - Player Info */}
          <div className="lg:col-span-1">
            <PlayerPanel />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>A digital recreation of the classic board game</p>
        </footer>
      </div>
    </div>
  );
}
