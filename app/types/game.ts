// Catan Game Types

export type ResourceType = 'wood' | 'brick' | 'sheep' | 'wheat' | 'ore';
export type TerrainType = ResourceType | 'desert';

export interface Hex {
  id: string;
  terrain: TerrainType;
  number?: number; // dice number (2-12, excluding 7)
  hasRobber: boolean;
  x: number;
  y: number;
}

export interface Vertex {
  id: string;
  x: number;
  y: number;
  hexIds: string[]; // up to 3 adjacent hexes
  building?: Building;
  harbor?: HarborType;
}

export interface Edge {
  id: string;
  vertexIds: [string, string];
  road?: Road;
}

export interface Building {
  type: 'settlement' | 'city';
  playerId: string;
}

export interface Road {
  playerId: string;
}

export type HarborType = '3:1' | '2:1-wood' | '2:1-brick' | '2:1-sheep' | '2:1-wheat' | '2:1-ore';

export interface Player {
  id: string;
  name: string;
  color: string;
  resources: Record<ResourceType, number>;
  settlements: number; // remaining settlements
  cities: number; // remaining cities
  roads: number; // remaining roads
  victoryPoints: number;
  knightCards: number;
  developmentCards: DevelopmentCard[];
  longestRoad: boolean;
  largestArmy: boolean;
}

// Player configuration for game setup
export interface PlayerConfig {
  id?: string;
  name: string;
  color: string;
}

export type DevelopmentCard = 'knight' | 'victory-point' | 'road-building' | 'year-of-plenty' | 'monopoly';

export interface GameState {
  players: Player[];
  currentPlayerId: string;
  phase: GamePhase;
  turn: number;
  hexes: Hex[];
  vertices: Vertex[];
  edges: Edge[];
  robberHexId: string;
  diceRoll: [number, number] | null;
  tradeOffer: TradeOffer | null;
  winner: string | null;
  developmentCardDeck: DevelopmentCard[];
}

export type GamePhase = 
  | 'setup-settlement-1'
  | 'setup-road-1'
  | 'setup-settlement-2'
  | 'setup-road-2'
  | 'roll-dice'
  | 'main-turn'
  | 'discard-cards'
  | 'move-robber'
  | 'steal-card'
  | 'game-over';

export interface TradeOffer {
  fromPlayerId: string;
  toPlayerId?: string; // undefined for bank trade
  giving: Partial<Record<ResourceType, number>>;
  requesting: Partial<Record<ResourceType, number>>;
}

export interface GameAction {
  type: string;
  playerId: string;
  data?: any;
}
