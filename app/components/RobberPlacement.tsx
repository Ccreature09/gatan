'use client';

import { useGameStore } from '../store/gameStore';

export const RobberPlacement = () => {
  const { hexes, players, currentPlayerId, moveRobber, vertices } = useGameStore();
  
  const getPlayersOnHex = (hexId: string) => {
    // Find vertices adjacent to this hex that have buildings
    const adjacentVertices = vertices.filter(v => 
      v.hexIds.includes(hexId) && v.building
    );
    
    // Get unique player IDs from those buildings (excluding current player)
    const playerIds = Array.from(new Set(
      adjacentVertices
        .map(v => v.building!.playerId)
        .filter(playerId => playerId !== currentPlayerId)
    ));
    
    return playerIds.map(playerId => 
      players.find(p => p.id === playerId)!
    );
  };

  const handleHexClick = (hexId: string) => {
    const playersOnHex = getPlayersOnHex(hexId);
    
    if (playersOnHex.length === 0) {
      // No players to steal from, just move robber
      moveRobber(hexId);
    } else if (playersOnHex.length === 1) {
      // Only one player, steal from them
      moveRobber(hexId, playersOnHex[0].id);
    } else {
      // Multiple players, show selection (for now, randomly pick one)
      const randomPlayer = playersOnHex[Math.floor(Math.random() * playersOnHex.length)];
      moveRobber(hexId, randomPlayer.id);
    }
  };
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4 shadow-xl border-2 border-yellow-400 pointer-events-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
          <span className="text-2xl mr-2">🦹</span>
          Move the Robber
        </h2>
        <p className="text-gray-600 mb-4 text-sm">
          Click on a hex to move the robber there. If other players have buildings 
          adjacent to the hex, you will steal a random resource from one of them.
        </p>
        
        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-black rounded-full mr-2"></div>
            <span className="text-sm text-gray-700 font-medium">
              Click any hex on the board to place the robber
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
