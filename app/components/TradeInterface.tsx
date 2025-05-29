import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ResourceType } from '../types/game';
import { soundService } from '../services/soundService';

export const TradeInterface: React.FC = () => {
  const { players, currentPlayerId, trade } = useGameStore();
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const [isVisible, setIsVisible] = useState(false);
  
  const [giving, setGiving] = useState<Partial<Record<ResourceType, number>>>({});
  const [receiving, setReceiving] = useState<Partial<Record<ResourceType, number>>>({});

  if (!currentPlayer) return null;

  const getResourceIcon = (resource: ResourceType): string => {
    switch (resource) {
      case 'wood': return '🌲';
      case 'brick': return '🧱';
      case 'sheep': return '🐑';
      case 'wheat': return '🌾';
      case 'ore': return '⛰️';
    }
  };

  const handleGivingChange = (resource: ResourceType, amount: number) => {
    setGiving(prev => ({ ...prev, [resource]: Math.max(0, amount) }));
  };

  const handleReceivingChange = (resource: ResourceType, amount: number) => {
    setReceiving(prev => ({ ...prev, [resource]: Math.max(0, amount) }));
  };

  const canMakeTrade = () => {
    const givingResources = Object.entries(giving);
    const receivingResources = Object.entries(receiving);
    
    if (givingResources.length === 0 || receivingResources.length === 0) return false;
    
    // Check if player has enough resources
    return givingResources.every(([resource, amount]) => 
      currentPlayer.resources[resource as ResourceType] >= (amount || 0)
    );
  };
  const handleTrade = () => {    if (canMakeTrade()) {
      trade(giving, receiving);
      setGiving({});
      setReceiving({});
      if (soundService) soundService.playTradeSuccess();
    }
  };  const handleTogglePanel = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    if (soundService) {
      if (newVisibility) {
        soundService.playTradeOpen();
      } else {
        soundService.playTradeClose();
      }
    }
  };
  const handleClosePanel = () => {
    setIsVisible(false);
    if (soundService) soundService.playTradeClose();
  };

  // Handle escape key to close panel
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClosePanel();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isVisible]);
  const resources: ResourceType[] = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
  return (
    <>      {/* Trade Button - Positioned to avoid Controls Hub */}      <button
        onClick={handleTogglePanel}
        onMouseEnter={() => soundService && soundService.playButtonHover()}
        className={`fixed bottom-48 right-4 z-40 ${
          isVisible 
            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
            : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
        } text-white rounded-full p-4 shadow-2xl border ${
          isVisible ? 'border-red-500' : 'border-green-500'
        } transition-all duration-200 transform hover:scale-105`}
        title={isVisible ? "Close Trading Interface" : "Open Trading Interface"}
      >
        <span className="text-xl">{isVisible ? '✕' : '💰'}</span>
      </button>      {/* Subtle overlay for click-outside-to-close functionality */}
      {isVisible && (
        <div 
          className="fixed inset-0 bg-transparent z-40"
          onClick={handleClosePanel}
        />
      )}

      {/* Trade Interface Side Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl border-l border-gray-600 z-50 transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col p-4 overflow-y-auto">          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏪</span>
              <h3 className="text-xl font-bold text-white">Bank Trading</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-300 bg-gray-700 px-3 py-1 rounded-full">
                4:1 Ratio
              </div>              <button
                onClick={handleClosePanel}
                onMouseEnter={() => soundService && soundService.playButtonHover()}
                className="text-gray-400 hover:text-white transition-colors text-xl p-1 hover:bg-gray-700 rounded-full"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Player Resources Display */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <span>💰</span>
              Your Resources
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {resources.map(resource => (
                <div key={resource} className="text-center bg-gray-700 rounded-lg p-2">
                  <div className="text-lg mb-1">{getResourceIcon(resource)}</div>
                  <div className="text-xs text-white font-medium">
                    {currentPlayer.resources[resource]}
                  </div>
                </div>
              ))}
            </div>
          </div>          <div className="space-y-6 flex-1">
            {/* Custom Trade Section */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
              <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
                <span>⚖️</span>
                Custom Trade
              </h4>
              
              {/* What you're giving */}
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-3 text-green-400 flex items-center gap-2">
                  <span>📤</span>
                  Giving Away
                </h5>
                <div className="grid grid-cols-5 gap-2">
                  {resources.map(resource => (
                    <div key={resource} className="text-center">
                      <div className="text-lg mb-1">{getResourceIcon(resource)}</div>
                      <input
                        type="number"
                        min="0"
                        max={currentPlayer.resources[resource]}
                        value={giving[resource] || 0}
                        onChange={(e) => handleGivingChange(resource, parseInt(e.target.value) || 0)}
                        className="w-full text-xs p-2 border border-gray-500 rounded-lg text-center bg-gray-700 text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition-all"
                        placeholder="0"
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        Max: {currentPlayer.resources[resource]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade Arrow */}
              <div className="flex justify-center mb-4">
                <div className="bg-blue-600 rounded-full p-2">
                  <span className="text-white text-lg">⬇️</span>
                </div>
              </div>

              {/* What you're receiving */}
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-3 text-blue-400 flex items-center gap-2">
                  <span>📥</span>
                  Receiving
                </h5>
                <div className="grid grid-cols-5 gap-2">
                  {resources.map(resource => (
                    <div key={resource} className="text-center">
                      <div className="text-lg mb-1">{getResourceIcon(resource)}</div>
                      <input
                        type="number"
                        min="0"
                        value={receiving[resource] || 0}
                        onChange={(e) => handleReceivingChange(resource, parseInt(e.target.value) || 0)}
                        className="w-full text-xs p-2 border border-gray-500 rounded-lg text-center bg-gray-700 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>              {/* Trade button */}              <button
                onClick={handleTrade}
                onMouseEnter={() => soundService && soundService.playButtonHover()}
                disabled={!canMakeTrade()}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed hover:from-green-700 hover:to-green-800 transition-all duration-200 border border-green-500 disabled:border-gray-500 font-semibold flex items-center justify-center gap-2"
              >
                <span>🤝</span>
                {canMakeTrade() ? 'Make Trade' : 'Invalid Trade'}
              </button>
            </div>            {/* Quick 4:1 trades */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
              <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
                <span>⚡</span>
                Quick Trades (4:1)
              </h4>
              
              {/* Check if player has any resources for quick trades */}
              {resources.some(resource => currentPlayer.resources[resource] >= 4) ? (
                <div className="space-y-3">
                  {resources.map(giveResource => (
                    currentPlayer.resources[giveResource] >= 4 && (
                      <div key={giveResource} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getResourceIcon(giveResource)}</span>
                          <span className="text-sm font-medium text-gray-300 capitalize">
                            Trade {giveResource}
                          </span>
                          <span className="text-xs text-gray-400">
                            (Have {currentPlayer.resources[giveResource]})
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">                          {resources.filter(r => r !== giveResource).map(receiveResource => (
                            <button
                              key={`${giveResource}-${receiveResource}`}
                              onClick={() => {
                                trade({ [giveResource]: 4 }, { [receiveResource]: 1 });
                                if (soundService) soundService.playTradeSuccess();                              // Don't close the panel, let user make multiple trades
                              }}
                              onMouseEnter={() => soundService && soundService.playButtonHover()}
                              className="flex flex-col items-center p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white border border-blue-500 transition-all duration-200 hover:scale-105"
                              title={`Trade 4 ${giveResource} for 1 ${receiveResource}`}
                            >
                              <div className="text-xs font-medium mb-1">4→1</div>
                              <div className="text-lg">{getResourceIcon(receiveResource)}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <span className="text-2xl mb-2 block">📦</span>
                  <p className="text-sm">You need at least 4 of any resource to make quick trades</p>
                </div>
              )}            </div>
          </div>
          
          {/* Footer with helpful tips */}
          <div className="mt-6 pt-4 border-t border-gray-600">
            <div className="text-xs text-gray-400 text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span>💡</span>
                <span>Press Esc, click outside, or use ✕ to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
