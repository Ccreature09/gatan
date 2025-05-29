import { create } from 'zustand';
import { GameState, GameAction, Player, Hex, Vertex, Edge, ResourceType, TerrainType, DevelopmentCard, PlayerConfig } from '../types/game';

// Initial game setup
const createInitialHexes = (): Hex[] => {
  const terrains: TerrainType[] = [
    'ore', 'sheep', 'wood', 'wheat', 'brick', 'sheep', 'brick',
    'wheat', 'wood', 'desert', 'wood', 'ore', 'wood', 'ore',
    'wheat', 'sheep', 'brick', 'wheat', 'sheep'
  ];
  
  const numbers = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
  // Standard Catan board layout - hexagon with 19 hexes in 3-4-5-4-3 pattern
  // Using axial coordinates (q, r) for proper hexagonal layout
  const hexPositions = [
    // Top row (3 hexes)
    { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
    // Second row (4 hexes)  
    { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 },
    // Middle row (5 hexes)
    { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
    // Fourth row (4 hexes)
    { q: -2, r: 1 }, { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 },
    // Bottom row (3 hexes)
    { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 }
  ];  return hexPositions.map((pos, index) => {    // Convert hexagonal coordinates (q, r) to Cartesian (x, y)
    // Using pointy-top hexagon orientation for proper Catan board
    const hexSize = 40; // Original size for stable functionality
    const x = hexSize * (Math.sqrt(3) * pos.q + Math.sqrt(3)/2 * pos.r);
    const y = hexSize * (3/2 * pos.r);
    
    return {
      id: `hex-${index}`,
      terrain: terrains[index],
      number: terrains[index] === 'desert' ? undefined : numbers[index - (index > 9 ? 1 : 0)],
      hasRobber: terrains[index] === 'desert',
      x: x,
      y: y
    };
  });
};

const createInitialVertices = (): Vertex[] => {
  const vertices: Vertex[] = [];
  
  // For each hex, create its 6 vertices
  const hexes = createInitialHexes();
  const vertexMap = new Map<string, Vertex>();
  hexes.forEach(hex => {
    const hexSize = 40; // Reset to original size
    // Create 6 vertices for this hex using the same angles as hex rendering (pointy-top)
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top, flat top/bottom
      const vertexX = hex.x + hexSize * Math.cos(angle);
      const vertexY = hex.y + hexSize * Math.sin(angle);
      
      // Round to avoid floating point precision issues
      const roundedX = Math.round(vertexX * 10) / 10;
      const roundedY = Math.round(vertexY * 10) / 10;
      const vertexKey = `${roundedX},${roundedY}`;
      
      if (!vertexMap.has(vertexKey)) {
        const vertex: Vertex = {
          id: `vertex-${vertexMap.size}`,
          x: roundedX,
          y: roundedY,
          hexIds: [hex.id]
        };
        vertexMap.set(vertexKey, vertex);
      } else {
        // Add this hex to existing vertex
        const existingVertex = vertexMap.get(vertexKey)!;
        if (!existingVertex.hexIds.includes(hex.id)) {
          existingVertex.hexIds.push(hex.id);
        }
      }
    }
  });
  
  return Array.from(vertexMap.values());
};

const createInitialEdges = (vertices: Vertex[]): Edge[] => {
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();
  
  // Create edges between adjacent vertices
  vertices.forEach(vertex1 => {
    vertices.forEach(vertex2 => {
      if (vertex1.id === vertex2.id) return;
        // Calculate distance between vertices
      const dx = vertex1.x - vertex2.x;
      const dy = vertex1.y - vertex2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
        // If vertices are close enough to be connected (approximately one hex side length)
      if (distance > 35 && distance < 45) {
        // Create edge ID with consistent ordering
        const ids = [vertex1.id, vertex2.id].sort();
        const edgeId = `edge-${ids[0]}-${ids[1]}`;
        
        if (!edgeSet.has(edgeId)) {
          edges.push({
            id: edgeId,
            vertexIds: [ids[0], ids[1]] as [string, string]
          });
          edgeSet.add(edgeId);
        }
      }
    });
  });
    return edges;
};

const createInitialPlayers = (playerConfigs?: PlayerConfig[]): Player[] => {
  // Default configuration for 4 players if none provided
  const defaultConfigs: PlayerConfig[] = [
    { name: 'Player 1', color: '#ff4444' },
    { name: 'Player 2', color: '#4444ff' },
    { name: 'Player 3', color: '#44ff44' },
    { name: 'Player 4', color: '#ffaa00' }
  ];
  
  const configs = (playerConfigs && playerConfigs.length > 0) ? playerConfigs : defaultConfigs;
    return configs.map((config, index) => ({
    id: config.id || `player-${index + 1}`,
    name: config.name,
    color: config.color,
    resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
    settlements: 5,
    cities: 4,
    roads: 15,
    victoryPoints: 0,
    knightCards: 0,
    developmentCards: [],
    longestRoad: false,
    largestArmy: false
  }));
};

// Helper functions for game logic
const calculateVictoryPoints = (player: Player): number => {
  const settlementPoints = (5 - player.settlements) * 1; // Each settlement = 1 point
  const cityPoints = (4 - player.cities) * 2; // Each city = 2 points
  const longestRoadPoints = player.longestRoad ? 2 : 0;
  const largestArmyPoints = player.largestArmy ? 2 : 0;
  const victoryCardPoints = player.developmentCards.filter(card => card === 'victory-point').length;
  
  return settlementPoints + cityPoints + longestRoadPoints + largestArmyPoints + victoryCardPoints;
};

const checkVictory = (state: GameState): string | null => {
  const playerPoints = state.players.map(p => ({
    id: p.id,
    points: calculateVictoryPoints(p)
  }));
  
  const winner = playerPoints.find(p => p.points >= 10);
  return winner ? winner.id : null;
};

const calculateLongestRoad = (playerId: string, edges: Edge[]): number => {
  const playerRoads = edges.filter(e => e.road && e.road.playerId === playerId);
  if (playerRoads.length < 5) return 0; // Need at least 5 roads
  
  // Simple implementation - return road count (real implementation would calculate connected paths)
  return playerRoads.length;
};

const updateLongestRoad = (players: Player[], edges: Edge[]): Player[] => {
  const roadLengths = players.map(p => ({
    id: p.id,
    length: calculateLongestRoad(p.id, edges)
  }));
  
  const longestLength = Math.max(...roadLengths.map(r => r.length));
  if (longestLength < 5) return players.map(p => ({ ...p, longestRoad: false }));
  
  const longestRoadPlayers = roadLengths.filter(r => r.length === longestLength);
  if (longestRoadPlayers.length > 1) return players; // Tie, no change
  
  return players.map(p => ({
    ...p,
    longestRoad: p.id === longestRoadPlayers[0].id
  }));
};

const updateLargestArmy = (players: Player[]): Player[] => {
  const armySizes = players.map(p => ({
    id: p.id,
    size: p.knightCards
  }));
  
  const largestSize = Math.max(...armySizes.map(a => a.size));
  if (largestSize < 3) return players.map(p => ({ ...p, largestArmy: false }));
  
  const largestArmyPlayers = armySizes.filter(a => a.size === largestSize);
  if (largestArmyPlayers.length > 1) return players; // Tie, no change
  
  return players.map(p => ({
    ...p,
    largestArmy: p.id === largestArmyPlayers[0].id
  }));
};

const stealFromPlayer = (currentPlayerId: string, targetPlayerId: string, players: Player[]): Player[] => {
  const targetPlayer = players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) return players;
  
  const resources = Object.entries(targetPlayer.resources).filter(([_, amount]) => amount > 0);
  if (resources.length === 0) return players;
  
  // Randomly select a resource to steal
  const randomResource = resources[Math.floor(Math.random() * resources.length)][0] as ResourceType;
  
  return players.map(p => {
    if (p.id === currentPlayerId) {
      return {
        ...p,
        resources: {
          ...p.resources,
          [randomResource]: p.resources[randomResource] + 1
        }
      };
    } else if (p.id === targetPlayerId) {
      return {
        ...p,
        resources: {
          ...p.resources,
          [randomResource]: p.resources[randomResource] - 1
        }
      };
    }
    return p;
  });
};

const forceDiscardCards = (players: Player[]): Player[] => {
  return players.map(player => {
    const totalCards = Object.values(player.resources).reduce((sum, count) => sum + count, 0);
    if (totalCards > 7) {
      const cardsToDiscard = Math.floor(totalCards / 2);
      // For simplicity, randomly discard cards (in real game, player chooses)
      const discardedResources = { ...player.resources };
      let discarded = 0;
      
      while (discarded < cardsToDiscard) {
        const resources = Object.entries(discardedResources).filter(([_, amount]) => amount > 0);
        if (resources.length === 0) break;
        
        const randomResource = resources[Math.floor(Math.random() * resources.length)][0] as ResourceType;
        discardedResources[randomResource]--;
        discarded++;
      }
      
      return {
        ...player,
        resources: discardedResources
      };
    }
    return player;
  });
};

interface GameStore extends GameState {
  initializeGame: (playerConfigs?: PlayerConfig[]) => void;
  rollDice: () => void;
  buildSettlement: (vertexId: string) => void;
  buildCity: (vertexId: string) => void;
  buildRoad: (edgeId: string) => void;
  trade: (giving: Partial<Record<ResourceType, number>>, receiving: Partial<Record<ResourceType, number>>) => void;
  buyDevelopmentCard: () => void;
  playDevelopmentCard: (card: DevelopmentCard) => void;
  moveRobber: (hexId: string, targetPlayerId?: string) => void;
  endTurn: () => void;
  getVictoryPoints: (playerId: string) => number;
}

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  currentPlayerId: '',
  phase: 'setup-settlement-1',
  turn: 1,
  hexes: [],
  vertices: [],
  edges: [],
  robberHexId: '',
  diceRoll: null,
  tradeOffer: null,
  winner: null,
  developmentCardDeck: [],

  initializeGame: (playerConfigs?: PlayerConfig[]) => {
    const hexes = createInitialHexes();
    const vertices = createInitialVertices();
    const edges = createInitialEdges(vertices);
    const players = createInitialPlayers(playerConfigs);
    
    // Create development card deck
    const developmentCardDeck: DevelopmentCard[] = [
      ...Array(14).fill('knight'),
      ...Array(5).fill('victory-point'),
      ...Array(2).fill('road-building'),
      ...Array(2).fill('year-of-plenty'),
      ...Array(2).fill('monopoly')
    ].sort(() => Math.random() - 0.5);

    set({
      players,
      currentPlayerId: players[0].id,
      phase: 'setup-settlement-1',
      turn: 1,
      hexes,
      vertices,
      edges,
      robberHexId: hexes.find(h => h.terrain === 'desert')?.id || '',
      diceRoll: null,
      tradeOffer: null,
      winner: null,
      developmentCardDeck
    });
  },
  rollDice: () => {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    set({ diceRoll: [dice1, dice2] });
    
    if (total === 7) {
      // Force discard cards and move robber
      const state = get();
      const playersAfterDiscard = forceDiscardCards(state.players);
      set({ 
        players: playersAfterDiscard,
        phase: 'move-robber' 
      });
    } else {
      // Distribute resources
      const state = get();
      const updatedPlayers = state.players.map(player => {
        const newResources = { ...player.resources };
        
        // Find settlements and cities that should receive resources
        state.vertices.forEach(vertex => {
          if (vertex.building?.playerId === player.id) {
            vertex.hexIds.forEach(hexId => {
              const hex = state.hexes.find(h => h.id === hexId);
              if (hex && hex.number === total && !hex.hasRobber && hex.terrain !== 'desert') {
                const resourceType = hex.terrain as ResourceType;
                const amount = vertex.building!.type === 'city' ? 2 : 1;
                newResources[resourceType] += amount;
              }
            });
          }
        });
        
        return { ...player, resources: newResources };
      });
      
      // Update longest road and largest army
      const playersWithSpecialCards = updateLargestArmy(updateLongestRoad(updatedPlayers, state.edges));
      
      // Check for victory
      const winnerId = checkVictory({ ...state, players: playersWithSpecialCards });
      
      set({ players: playersWithSpecialCards, phase: 'main-turn', winner: winnerId });
    }
  },
  buildSettlement: (vertexId: string) => {
    const state = get();
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || currentPlayer.settlements === 0) return;

    const vertex = state.vertices.find(v => v.id === vertexId);
    if (!vertex || vertex.building) return;

    // Check if player has resources (except during setup)
    if (!state.phase.startsWith('setup') && 
        (currentPlayer.resources.wood < 1 || currentPlayer.resources.brick < 1 || 
         currentPlayer.resources.sheep < 1 || currentPlayer.resources.wheat < 1)) {
      return;
    }

    const updatedVertices = state.vertices.map(v =>
      v.id === vertexId ? { ...v, building: { type: 'settlement' as const, playerId: state.currentPlayerId } } : v
    );

    let updatedPlayers = state.players.map(p =>
      p.id === state.currentPlayerId
        ? {
            ...p,
            settlements: p.settlements - 1,
            victoryPoints: p.victoryPoints + 1,
            resources: state.phase.startsWith('setup') ? p.resources : {
              ...p.resources,
              wood: p.resources.wood - 1,
              brick: p.resources.brick - 1,
              sheep: p.resources.sheep - 1,
              wheat: p.resources.wheat - 1
            }
          }
        : p
    );

    // During second settlement placement, give starting resources
    if (state.phase === 'setup-settlement-2') {
      const newResources = { ...currentPlayer.resources };
      vertex.hexIds.forEach(hexId => {
        const hex = state.hexes.find(h => h.id === hexId);
        if (hex && hex.terrain !== 'desert' && hex.number) {
          const resourceType = hex.terrain as ResourceType;
          newResources[resourceType] += 1;
        }
      });
      
      updatedPlayers = updatedPlayers.map(p =>
        p.id === state.currentPlayerId
          ? { ...p, resources: newResources }
          : p
      );
    }    // Auto-advance to next phase during setup
    let nextPhase = state.phase;
    if (state.phase === 'setup-settlement-1') {
      nextPhase = 'setup-road-1';
    } else if (state.phase === 'setup-settlement-2') {
      nextPhase = 'setup-road-2';
    }

    // Check for victory during main game
    const winnerId = state.phase === 'main-turn' ? checkVictory({ ...state, players: updatedPlayers }) : null;

    set({ 
      vertices: updatedVertices, 
      players: updatedPlayers,
      phase: nextPhase,
      winner: winnerId
    });
  },

  buildCity: (vertexId: string) => {
    const state = get();
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || currentPlayer.cities === 0) return;

    const vertex = state.vertices.find(v => v.id === vertexId);
    if (!vertex || vertex.building?.type !== 'settlement' || vertex.building.playerId !== state.currentPlayerId) return;

    // Check resources
    if (currentPlayer.resources.wheat < 2 || currentPlayer.resources.ore < 3) return;

    const updatedVertices = state.vertices.map(v =>
      v.id === vertexId ? { ...v, building: { type: 'city' as const, playerId: state.currentPlayerId } } : v
    );    const updatedPlayers = state.players.map(p =>
      p.id === state.currentPlayerId
        ? {
            ...p,
            settlements: p.settlements + 1,
            cities: p.cities - 1,
            victoryPoints: p.victoryPoints + 1,
            resources: {
              ...p.resources,
              wheat: p.resources.wheat - 2,
              ore: p.resources.ore - 3
            }
          }
        : p
    );

    // Check for victory
    const winnerId = checkVictory({ ...state, players: updatedPlayers });

    set({ vertices: updatedVertices, players: updatedPlayers, winner: winnerId });
  },
  buildRoad: (edgeId: string) => {
    const state = get();
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || currentPlayer.roads === 0) return;

    const edge = state.edges.find(e => e.id === edgeId);
    if (!edge || edge.road) return;

    // Check resources (except during setup)
    if (!state.phase.startsWith('setup') && 
        (currentPlayer.resources.wood < 1 || currentPlayer.resources.brick < 1)) {
      return;
    }

    const updatedEdges = state.edges.map(e =>
      e.id === edgeId ? { ...e, road: { playerId: state.currentPlayerId } } : e
    );    const updatedPlayers = state.players.map(p =>
      p.id === state.currentPlayerId
        ? {
            ...p,
            roads: p.roads - 1,
            resources: state.phase.startsWith('setup') ? p.resources : {
              ...p.resources,
              wood: p.resources.wood - 1,
              brick: p.resources.brick - 1
            }
          }
        : p
    );

    // Update longest road during main game
    const playersWithLongestRoad = state.phase === 'main-turn' 
      ? updateLongestRoad(updatedPlayers, updatedEdges)
      : updatedPlayers;

    // Auto-advance phase and handle turn progression
    let nextPhase = state.phase;
    let nextPlayerId = state.currentPlayerId;
    
    if (state.phase === 'setup-road-1') {
      const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
      
      if (nextPlayerIndex === 0) {
        // All players have placed first settlement/road, start second round
        nextPhase = 'setup-settlement-2';
        nextPlayerId = state.players[state.players.length - 1].id; // Start with last player
      } else {
        nextPhase = 'setup-settlement-1';
        nextPlayerId = state.players[nextPlayerIndex].id;
      }    } else if (state.phase === 'setup-road-2') {
      const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
      
      if (currentPlayerIndex === 0) {
        // Setup complete, start main game with automatic dice roll
        nextPhase = 'main-turn';
        nextPlayerId = state.players[0].id;
        
        // Automatically roll dice to start the game
        setTimeout(() => {
          get().rollDice();
        }, 500); // Small delay for better UX
      } else {
        nextPhase = 'setup-settlement-2';
        nextPlayerId = state.players[currentPlayerIndex - 1].id;
      }
    }set({ 
      edges: updatedEdges, 
      players: playersWithLongestRoad,
      phase: nextPhase,
      currentPlayerId: nextPlayerId
    });
  },

  trade: (giving: Partial<Record<ResourceType, number>>, receiving: Partial<Record<ResourceType, number>>) => {
    // Bank trade implementation
    const state = get();
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer) return;

    // Check if player has enough resources
    const hasEnoughResources = Object.entries(giving).every(([resource, amount]) =>
      currentPlayer.resources[resource as ResourceType] >= amount!
    );

    if (!hasEnoughResources) return;

    const updatedPlayers = state.players.map(p =>
      p.id === state.currentPlayerId
        ? {
            ...p,
            resources: {
              ...p.resources,
              ...Object.fromEntries(
                Object.entries(giving).map(([resource, amount]) => [
                  resource,
                  p.resources[resource as ResourceType] - amount!
                ])
              ),
              ...Object.fromEntries(
                Object.entries(receiving).map(([resource, amount]) => [
                  resource,
                  p.resources[resource as ResourceType] + amount!
                ])
              )
            }
          }
        : p
    );

    set({ players: updatedPlayers });
  },

  buyDevelopmentCard: () => {
    const state = get();
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || state.developmentCardDeck.length === 0) return;

    // Check resources
    if (currentPlayer.resources.sheep < 1 || currentPlayer.resources.wheat < 1 || currentPlayer.resources.ore < 1) return;

    const card = state.developmentCardDeck[0];
    const remainingDeck = state.developmentCardDeck.slice(1);

    const updatedPlayers = state.players.map(p =>
      p.id === state.currentPlayerId
        ? {
            ...p,
            developmentCards: [...p.developmentCards, card],
            resources: {
              ...p.resources,
              sheep: p.resources.sheep - 1,
              wheat: p.resources.wheat - 1,
              ore: p.resources.ore - 1
            }
          }
        : p
    );

    set({ players: updatedPlayers, developmentCardDeck: remainingDeck });
  },
  playDevelopmentCard: (card: DevelopmentCard) => {
    const state = get();
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || !currentPlayer.developmentCards.includes(card)) return;

    const updatedPlayers = state.players.map(player => {
      if (player.id === state.currentPlayerId) {
        const cardIndex = player.developmentCards.indexOf(card);
        const newDevelopmentCards = [...player.developmentCards];
        newDevelopmentCards.splice(cardIndex, 1);
        
        let updatedPlayer = {
          ...player,
          developmentCards: newDevelopmentCards
        };
        
        // Handle different card types
        switch (card) {
          case 'knight':
            updatedPlayer.knightCards += 1;
            // Move robber after playing knight
            set({ phase: 'move-robber' });
            break;
          case 'road-building':
            // Allow building 2 roads for free
            // This would need special handling in the UI
            break;
          case 'year-of-plenty':
            // Allow taking 2 resources from bank
            // This would need special handling in the UI
            break;
          case 'monopoly':
            // Take all cards of chosen resource from other players
            // This would need special handling in the UI
            break;
          case 'victory-point':
            // Victory points are calculated automatically
            break;
        }
        
        return updatedPlayer;
      }
      return player;
    });

    // Update largest army after playing knight
    const playersWithUpdatedArmy = card === 'knight' ? updateLargestArmy(updatedPlayers) : updatedPlayers;
    
    // Check for victory
    const winnerId = checkVictory({ ...state, players: playersWithUpdatedArmy });

    set({ players: playersWithUpdatedArmy, winner: winnerId });
  },

  getVictoryPoints: (playerId: string) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    return player ? calculateVictoryPoints(player) : 0;
  },
  moveRobber: (hexId: string, targetPlayerId?: string) => {
    const state = get();
    const updatedHexes = state.hexes.map(h => ({
      ...h,
      hasRobber: h.id === hexId
    }));

    let updatedPlayers = state.players;
    
    // If a target player is specified, steal a random resource
    if (targetPlayerId && targetPlayerId !== state.currentPlayerId) {
      updatedPlayers = stealFromPlayer(state.currentPlayerId, targetPlayerId, state.players);
    }

    set({ hexes: updatedHexes, robberHexId: hexId, phase: 'main-turn', players: updatedPlayers });
  },
  endTurn: () => {
    const state = get();
    const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    let nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
    
    // Handle setup phase turn order
    if (state.phase.startsWith('setup')) {
      if (state.phase === 'setup-settlement-2' || state.phase === 'setup-road-2') {
        nextPlayerIndex = currentPlayerIndex - 1;
        if (nextPlayerIndex < 0) {
          // Move to main game with automatic dice roll
          set({ phase: 'main-turn', currentPlayerId: state.players[0].id });
          setTimeout(() => {
            get().rollDice();
          }, 500);
          return;
        }
      }
    }

    const nextPlayerId = state.players[nextPlayerIndex].id;
    const nextPhase = state.phase === 'main-turn' ? 'main-turn' : state.phase;

    set({ 
      currentPlayerId: nextPlayerId, 
      phase: nextPhase,
      diceRoll: null 
    });
    
    // Automatically roll dice for the next player in main game
    if (nextPhase === 'main-turn') {
      setTimeout(() => {
        get().rollDice();
      }, 500);
    }
  }
}));
