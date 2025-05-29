import React, { useState, useCallback, useRef } from 'react';
import { useMultiplayerGameActions } from '../store/multiplayerGameActions';
import { useMultiplayerGameInterface } from '../store/multiplayerGameInterface';
import { Hex } from './Hex';
import { Vertex } from './Vertex';
import { Edge } from './Edge';
import { soundService } from '../services/soundService';

export const GameBoard: React.FC = () => {
  const { 
    hexes, 
    vertices, 
    edges, 
    currentPlayerId, 
    players, 
    phase,
    moveRobber,
    buildSettlement,
    buildCity,
    buildRoad
  } = useMultiplayerGameActions();
  
  const { isMultiplayer, localPlayerId } = useMultiplayerGameInterface();

  // State for pan and zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const currentPlayer = players.find(p => p.id === currentPlayerId);    // Check if it's the local player's turn in multiplayer
  const isMyTurn = !isMultiplayer || (localPlayerId === currentPlayerId);  
    // Calculate board dimensions - adapt to screen size
  const hexSize = 40; // Original size for reliable functionality  
  const [screenSize, setScreenSize] = useState({ width: 1200, height: 800 });
  
  // Update screen size on window resize
  React.useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
      updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
    // Sound control state
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  
  const toggleSound = () => {
    const newMutedState = !isSoundMuted;
    setIsSoundMuted(newMutedState);
    if (soundService) {
      soundService.setMuted(newMutedState);
      if (!newMutedState) {
        soundService.playButtonClick(); // Play a sound when unmuting
      }
    }
  };

  // Start ocean ambient sound when component mounts
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (soundService) {
        soundService.playOceanAmbient();
      }
    }, 1000); // Delay to ensure user interaction has occurred
    
    return () => clearTimeout(timer);
  }, []);
  
  const boardWidth = screenSize.width;
  const boardHeight = screenSize.height;
  const centerX = boardWidth / 2;
  const centerY = boardHeight / 2;

  const handleHexClick = (hexId: string) => {
    if (!isMyTurn) return; // Don't allow actions if it's not your turn
    
    if (phase === 'move-robber') {
      moveRobber(hexId);
    }
  };
  const handleVertexClick = (vertexId: string) => {
    if (!isMyTurn) return; // Don't allow actions if it's not your turn
    
    const vertex = vertices.find(v => v.id === vertexId);
    if (!vertex) return;    if (phase.includes('setup-settlement') || phase === 'main-turn') {
      if (!vertex.building) {
        buildSettlement(vertexId);
        if (soundService) soundService.playResourceCollect();
      } else if (vertex.building.playerId === currentPlayerId && vertex.building.type === 'settlement') {
        buildCity(vertexId);
        if (soundService) soundService.playResourceCollect();
      }
    }
  };  const handleEdgeClick = (edgeId: string) => {
    if (!isMyTurn) return; // Don't allow actions if it's not your turn
    
    if (phase.includes('setup-road') || phase === 'main-turn') {
      buildRoad(edgeId);
      if (soundService) soundService.playResourceCollect();
    }
  };

  const canBuildSettlement = (vertex: any) => {
    if (vertex.building) return false;
    if (phase.includes('setup-settlement')) return true;
    if (phase === 'main-turn' && currentPlayer) {
      return currentPlayer.resources.wood >= 1 && 
             currentPlayer.resources.brick >= 1 && 
             currentPlayer.resources.sheep >= 1 && 
             currentPlayer.resources.wheat >= 1;
    }
    return false;
  };
  const canBuildRoad = (edge: any) => {
    if (edge.road) return false;
    
    // During setup phases, only show roads adjacent to player's settlements
    if (phase.includes('setup-road')) {
      // Find the player's settlements
      const playerSettlements = vertices.filter(v => 
        v.building?.playerId === currentPlayerId && v.building?.type === 'settlement'
      );
      
      // Check if this edge is connected to any of the player's settlements
      return playerSettlements.some(settlement => 
        edge.vertexIds.includes(settlement.id)
      );
    }
    
    // During main game, check resources and connectivity to existing road network
    if (phase === 'main-turn' && currentPlayer) {
      if (currentPlayer.resources.wood < 1 || currentPlayer.resources.brick < 1) {
        return false;
      }
      
      // Check if edge connects to player's existing road network or settlements
      const playerRoads = edges.filter(e => e.road?.playerId === currentPlayerId);
      const playerBuildings = vertices.filter(v => v.building?.playerId === currentPlayerId);
      
      // If player has no roads yet, edge must connect to a player building
      if (playerRoads.length === 0) {
        return playerBuildings.some(building => edge.vertexIds.includes(building.id));
      }
      
      // Otherwise, edge must connect to an existing road or building
      const connectedToRoad = playerRoads.some(road => 
        road.vertexIds.some(roadVertexId => edge.vertexIds.includes(roadVertexId))
      );
      const connectedToBuilding = playerBuildings.some(building => 
        edge.vertexIds.includes(building.id)
      );
      
      return connectedToRoad || connectedToBuilding;
    }
    
    return false;
  };
  // Reset zoom and pan
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Handle mouse wheel for zoom with comprehensive event blocking
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Stop all event propagation immediately
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta));
    setZoom(newZoom);
  }, [zoom]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint, zoom]);

  // Handle mouse up for panning
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      setIsPanning(false);
    }
  }, []);

  // Prevent context menu on middle click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      resetView();
    }
  }, [resetView]);
  // Add keyboard event listener
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Add direct wheel event listener with passive: false for better control
  React.useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(3, zoom * delta));
      setZoom(newZoom);
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });
    return () => container.removeEventListener('wheel', wheelHandler);
  }, [zoom]);  return (
    <div 
      className="fixed inset-0 flex justify-center items-center game-board-container ocean-background"
      onWheel={handleWheel}
      style={{ 
        touchAction: 'none',
        overflow: 'hidden',
        position: 'fixed',
        zIndex: 1,
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(72, 168, 255, 0.8) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(59, 130, 246, 0.6) 0%, transparent 50%),
          radial-gradient(ellipse at 40% 80%, rgba(96, 165, 250, 0.7) 0%, transparent 50%),
          linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #2563eb 50%, #3b82f6 75%, #60a5fa 100%)
        `,
        animation: 'oceanWaves 8s ease-in-out infinite alternate'
      }}
    >
      {/* Animated Ocean Waves */}
      <div className="absolute inset-0 opacity-30">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
      
      {/* Ocean Bubbles */}
      <div className="absolute inset-0 opacity-20">
        <div className="bubble bubble1"></div>
        <div className="bubble bubble2"></div>
        <div className="bubble bubble3"></div>
        <div className="bubble bubble4"></div>
        <div className="bubble bubble5"></div>
      </div>      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
        className="relative z-10"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{ 
          cursor: isPanning ? 'grabbing' : 'grab', 
          touchAction: 'none',
          userSelect: 'none',
          pointerEvents: 'auto',
          background: 'transparent'
        }}
      >        {/* Transform to center the board with zoom and pan */}
        <g transform={`translate(${centerX + pan.x}, ${centerY + pan.y}) scale(${zoom})`}>          {/* Game board background - centered */}
          <rect 
            x={-300} 
            y={-200} 
            width={600} 
            height={400} 
            fill="url(#oceanGradient)" 
            rx="10"
            opacity="0.3"
          />
          
          {/* Define gradients */}
          <defs>
            <radialGradient id="oceanGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#87ceeb" />
              <stop offset="100%" stopColor="#4682b4" />
            </radialGradient>
          </defs>{/* Render hexes */}
          {hexes.map(hex => (
            <Hex
              key={hex.id}
              hex={hex}
              size={hexSize}
              onClick={phase === 'move-robber' && isMyTurn ? () => handleHexClick(hex.id) : undefined}
            />
          ))}          {/* Render edges (roads) */}
          {edges.map(edge => (
            <Edge
              key={edge.id}
              edge={edge}
              vertices={vertices}
              playerColor={edge.road ? players.find(p => p.id === edge.road!.playerId)?.color : undefined}
              onClick={canBuildRoad(edge) && isMyTurn ? () => handleEdgeClick(edge.id) : undefined}
              canBuild={canBuildRoad(edge)}
            />
          ))}

          {/* Render vertices (settlements/cities) */}
          {vertices.map(vertex => (
            <Vertex
              key={vertex.id}
              vertex={vertex}
              playerColor={vertex.building ? players.find(p => p.id === vertex.building!.playerId)?.color : undefined}
              onClick={(canBuildSettlement(vertex) || (vertex.building && vertex.building.type === 'settlement')) && isMyTurn ? () => handleVertexClick(vertex.id) : undefined}
              canBuild={canBuildSettlement(vertex)}
            />
          ))}
        </g>
      </svg>      {/* Controls Hub - Bottom Right */}
      <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-95 rounded-lg p-3 shadow-lg border border-gray-600">
        {/* Zoom Controls */}        <div className="flex items-center gap-2 mb-3">          <button
            onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
            onMouseEnter={() => soundService && soundService.playButtonHover()}
            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            +
          </button>
          <div className="text-center text-xs text-white font-medium min-w-[3rem]">
            {Math.round(zoom * 100)}%
          </div>          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev / 1.2))}
            onMouseEnter={() => soundService && soundService.playButtonHover()}
            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            -
          </button>
          <button
            onClick={resetView}
            onMouseEnter={() => soundService && soundService.playButtonHover()}
            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
            title="Reset view (Ctrl+R)"
          >
            Reset
          </button>
        </div>        {/* Instructions */}
        <div className="text-gray-200 border-t border-gray-600 pt-3">
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span>🖱️</span>
            <span>Scroll: Zoom</span>
          </div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span>🖱️</span>
            <span>Middle+drag: Pan</span>
          </div>
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span>⌨️</span>
            <span>Ctrl+R: Reset</span>
          </div>
          
          {/* Sound Control */}
          <div className="border-t border-gray-600 pt-2">            <button
              onClick={toggleSound}
              onMouseEnter={() => soundService && soundService.playButtonHover()}
              className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
                isSoundMuted 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title={isSoundMuted ? "Enable Sound" : "Disable Sound"}
            >
              <span>{isSoundMuted ? '🔇' : '🔊'}</span>
              <span>{isSoundMuted ? 'Sound Off' : 'Sound On'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Action Indicator */}
      {isMyTurn && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-blue-700 bg-opacity-95 rounded-lg p-3 shadow-lg text-sm border border-blue-400">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👆</span>
              <span className="font-semibold">Your Turn - Click to:</span>
            </div>
            {phase.includes('setup-settlement') && (
              <div className="flex items-center gap-2 text-green-200">
                <span>🏠</span>
                <span>Place a settlement (green circles)</span>
              </div>
            )}
            {phase.includes('setup-road') && (
              <div className="flex items-center gap-2 text-green-200">
                <span>🛤️</span>
                <span>Place a road (green lines)</span>
              </div>
            )}
            {phase === 'main-turn' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-200">
                  <span>🏠</span>
                  <span>Build settlement (green circles)</span>
                </div>
                <div className="flex items-center gap-2 text-green-200">
                  <span>🛤️</span>
                  <span>Build road (green lines)</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-200">
                  <span>🏛️</span>
                  <span>Upgrade to city (click settlement)</span>
                </div>
              </div>
            )}
            {phase === 'move-robber' && (
              <div className="flex items-center gap-2 text-red-200">
                <span>🦹</span>
                <span>Click a hex to move the robber</span>
              </div>
            )}
          </div>
        </div>      )}
    </div>
  );
};
