import React, { useState } from 'react';
import { useMultiplayerGameActions } from '../store/multiplayerGameActions';
import { useMultiplayerGameInterface } from '../store/multiplayerGameInterface';
import { ResourceType, DevelopmentCard } from '../types/game';

export const PlayerPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDevCards, setShowDevCards] = useState(false);
  const { 
    players, 
    currentPlayerId, 
    phase,
    buyDevelopmentCard,
    endTurn,
    getVictoryPoints
  } = useMultiplayerGameActions();
  const { isMultiplayer, localPlayerId } = useMultiplayerGameInterface();
  
  // Get the local player's info (in multiplayer) or current player (in local game)
  const displayPlayer = isMultiplayer 
    ? players.find(p => p.id === localPlayerId) 
    : players.find(p => p.id === currentPlayerId);
    // Check if it's the local player's turn in multiplayer
  const isMyTurn = !isMultiplayer || (localPlayerId === currentPlayerId);
  
  if (!displayPlayer) return null;
  const getResourceIcon = (resource: ResourceType): string => {
    switch (resource) {
      case 'wood': return '🌲';
      case 'brick': return '🧱';
      case 'sheep': return '🐑';
      case 'wheat': return '🌾';
      case 'ore': return '⛰️';
    }
  };

  const getDevelopmentCardInfo = (card: DevelopmentCard) => {
    switch (card) {
      case 'knight':
        return { icon: '⚔️', name: 'Knight', description: 'Move robber & steal' };
      case 'victory-point':
        return { icon: '🏆', name: 'Victory Point', description: '+1 Victory Point' };
      case 'road-building':
        return { icon: '🛤️', name: 'Road Building', description: 'Build 2 free roads' };
      case 'year-of-plenty':
        return { icon: '🎁', name: 'Year of Plenty', description: 'Take 2 resources' };
      case 'monopoly':
        return { icon: '💰', name: 'Monopoly', description: 'Take all of 1 resource' };
    }
  };

  const groupDevCards = (cards: DevelopmentCard[]) => {
    const grouped: Record<DevelopmentCard, number> = {
      'knight': 0,
      'victory-point': 0,
      'road-building': 0,
      'year-of-plenty': 0,
      'monopoly': 0
    };
    cards.forEach(card => grouped[card]++);
    return grouped;
  };

  const canBuyDevelopmentCard = displayPlayer.resources.sheep >= 1 && 
                               displayPlayer.resources.wheat >= 1 && 
                               displayPlayer.resources.ore >= 1;
  const totalResources = Object.values(displayPlayer.resources).reduce((sum, count) => sum + count, 0);
  const groupedDevCards = groupDevCards(displayPlayer.developmentCards);

  return (
    <>
      {/* Floating Player Panel - Minimized */}
      {!isExpanded && (
        <div className="fixed top-4 right-4 z-40 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border border-gray-600 p-3">
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: displayPlayer.color }}
            />
            <div className="text-white">
              <div className="font-bold text-sm">{displayPlayer.name}</div>
              <div className="text-xs text-gray-300">
                {getVictoryPoints ? getVictoryPoints(displayPlayer.id) : displayPlayer.victoryPoints} VP • {totalResources} cards
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-gray-400 hover:text-white transition-colors ml-2"
            >
              📊
            </button>
          </div>
        </div>
      )}

      {/* Expanded Player Panel */}
      {isExpanded && (
        <div className="fixed top-4 right-4 z-40 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border border-gray-600 p-4 w-80 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: displayPlayer.color }}
              />
              <div>
                <h2 className="text-lg font-bold text-yellow-300">{displayPlayer.name}</h2>
                <p className="text-xs text-gray-300">{isMyTurn ? 'Your Turn' : 'Waiting...'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-400">
                  🏆 {getVictoryPoints ? getVictoryPoints(displayPlayer.id) : displayPlayer.victoryPoints}
                </div>
                <p className="text-xs text-gray-400">VP</p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Resources */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-white flex items-center">
              📦 Resources ({totalResources})
            </h3>
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(displayPlayer.resources) as [ResourceType, number][]).map(([resource, count]) => (
                <div 
                  key={resource} 
                  className={`flex items-center justify-between p-2 rounded border text-xs ${
                    count > 0 
                      ? 'bg-gray-700 border-gray-500' 
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <span className="flex items-center text-white">
                    <span className="mr-1">{getResourceIcon(resource)}</span>
                    <span className="capitalize">{resource.slice(0, 3)}</span>
                  </span>
                  <span className={`font-bold ${count > 0 ? 'text-yellow-300' : 'text-gray-500'}`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Buildings */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-white flex items-center">
              🏗️ Buildings
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col items-center p-2 bg-gray-700 rounded border border-gray-600">
                <span className="text-sm">🏠</span>
                <span className="text-yellow-300 font-semibold">{displayPlayer.settlements}</span>
                <span className="text-gray-400 text-xs">/ 5</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-gray-700 rounded border border-gray-600">
                <span className="text-sm">🏛️</span>
                <span className="text-yellow-300 font-semibold">{displayPlayer.cities}</span>
                <span className="text-gray-400 text-xs">/ 4</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-gray-700 rounded border border-gray-600">
                <span className="text-sm">🛤️</span>
                <span className="text-yellow-300 font-semibold">{displayPlayer.roads}</span>
                <span className="text-gray-400 text-xs">/ 15</span>
              </div>
            </div>
          </div>

          {/* Development Cards */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white flex items-center">
                🃏 Development Cards ({displayPlayer.developmentCards.length})
              </h3>
              <button
                onClick={() => setShowDevCards(!showDevCards)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showDevCards ? 'Hide' : 'Details'}
              </button>
            </div>
            
            {!showDevCards ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-gray-700 rounded border border-gray-600">
                  <span className="text-xs text-gray-200">Total Cards</span>
                  <span className="text-yellow-300 font-semibold">{displayPlayer.developmentCards.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-700 rounded border border-gray-600">
                  <span className="text-xs text-gray-200">Knights Used</span>
                  <span className="text-yellow-300 font-semibold">{displayPlayer.knightCards}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(groupedDevCards).map(([card, count]) => {
                  if (count === 0) return null;
                  const cardInfo = getDevelopmentCardInfo(card as DevelopmentCard);
                  return (
                    <div key={card} className="p-2 bg-gray-700 rounded border border-gray-600">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span>{cardInfo.icon}</span>
                          <span className="text-sm font-medium text-white">{cardInfo.name}</span>
                        </div>
                        <span className="text-yellow-300 font-bold">×{count}</span>
                      </div>
                      <p className="text-xs text-gray-400">{cardInfo.description}</p>
                    </div>
                  );
                })}
                {displayPlayer.developmentCards.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-2">
                    No development cards
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {phase === 'main-turn' && (
            <div className="mb-4">
              <button
                onClick={buyDevelopmentCard}
                disabled={!canBuyDevelopmentCard || !isMyTurn}
                className={`w-full py-2 px-3 rounded transition-all duration-200 border text-sm ${
                  (canBuyDevelopmentCard && isMyTurn)
                    ? 'bg-purple-600 hover:bg-purple-700 border-purple-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Buy Dev Card</span>
                  <span>🃏</span>
                </div>
                <div className="text-xs flex items-center justify-center space-x-1">
                  <span>🐑🌾⛰️</span>
                </div>
              </button>
            </div>
          )}

          {/* End Turn Button */}
          <button
            onClick={endTurn}
            disabled={!isMyTurn}
            className={`w-full py-2 px-3 rounded transition-all duration-200 border font-semibold text-sm ${
              !isMyTurn 
                ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-500'
            }`}
          >
            <div className="flex items-center justify-center space-x-1">
              <span>{isMyTurn ? 'End Turn' : 'Wait'}</span>
              <span>{isMyTurn ? '➡️' : '⏳'}</span>
            </div>
          </button>

          {/* Scoreboard */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-sm font-semibold mb-2 text-white flex items-center">
              🏆 All Players
            </h3>
            <div className="space-y-1">
              {players.map(player => (
                <div 
                  key={player.id}
                  className={`flex justify-between items-center p-2 rounded border text-xs ${
                    player.id === currentPlayerId 
                      ? 'bg-blue-600 bg-opacity-60 border-blue-400' 
                      : 'bg-gray-700 bg-opacity-50 border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className={`${player.id === currentPlayerId ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>
                      {player.name.slice(0, 8)}
                    </span>
                    {player.id === currentPlayerId && (
                      <span className="ml-1 px-1 bg-blue-500 bg-opacity-70 text-xs rounded text-white">
                        ▶
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-yellow-300">{getVictoryPoints(player.id)}</span>
                    <div className="flex">
                      {player.longestRoad && <span title="Longest Road">🛣️</span>}
                      {player.largestArmy && <span title="Largest Army">⚔️</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
