/**
 * Map types — PLAN_V5 §4.5 (Trụ 5: Map System 3-Tier)
 * Tier 0: WorldMap (continent overview, region polygons, POI nodes)
 * Tier 1: RegionalMap (HoMM-style grid 50×50–100×100, fog of war, A* path)
 * Tier 2: LocalMap (battlemap 20×20–40×40, tile inventory, entity positions)
 */

// ---------------------------------------------------------------------------
// Tile primitives
// ---------------------------------------------------------------------------

export type TileTerrain =
  | 'floor'
  | 'wall'
  | 'door'
  | 'corridor'
  | 'stairs_up'
  | 'stairs_down'
  | 'water'
  | 'difficult'
  | 'void';

/** Fog-of-war state for each tile */
export type FogState = 'unexplored' | 'explored' | 'visible';

/** Light level affecting visibility and combat */
export type LightLevel = 'bright' | 'dim' | 'dark';

export interface MapTile {
  terrain: TileTerrain;
  fogState: FogState;
  lightLevel: LightLevel;
  /** Movement cost multiplier: 1.0 = normal, 2.0 = difficult, Infinity = impassable */
  terrainCost: number;
  /** Whether a loot/item is present on this tile (visible when adjacent) */
  hasItem?: boolean;
  /** Interactive door tile */
  isDoor?: boolean;
  isOpen?: boolean;
  /** Descriptive label shown in info popup */
  label?: string;
}

// ---------------------------------------------------------------------------
// Entity positions
// ---------------------------------------------------------------------------

export type EntityOnMapType = 'player' | 'npc' | 'monster' | 'boss' | 'pet';

export interface EntityPosition {
  entityId: string;
  entityType: EntityOnMapType;
  /** Tile X coordinate (column, 0-based) */
  x: number;
  /** Tile Y coordinate (row, 0-based) */
  y: number;
  facing?: 'n' | 's' | 'e' | 'w';
  /** Display label (character name, NPC name…) */
  label?: string;
}

// ---------------------------------------------------------------------------
// Map data
// ---------------------------------------------------------------------------

export type MapTier = 0 | 1 | 2;

export interface MapExit {
  x: number;
  y: number;
  targetMapId: string;
  targetPosition: { x: number; y: number };
  label?: string;
}

export interface MapData {
  id: string;
  name: string;
  /** 0 = World, 1 = Regional, 2 = Local (battlemap) */
  tier: MapTier;
  width: number;
  height: number;
  /** Feet per tile, e.g. 5 = 5 ft (D&D standard) */
  tileSize: number;
  /** tiles[y][x] — row-major layout */
  tiles: MapTile[][];
  startPosition?: { x: number; y: number };
  exits?: MapExit[];
  /** Ambient light applied before light sources */
  ambientLight?: LightLevel;
  description?: string;
}

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

export type ViewMode = 'chat' | 'map' | 'split';
export type ActiveTier = 'world' | 'regional' | 'local';

export interface MapStoreState {
  activeTier: ActiveTier;
  activeMap: MapData | null;
  entityPositions: EntityPosition[];
  viewMode: ViewMode;
}

export interface MapStoreActions {
  loadMap: (map: MapData, playerEntityId: string, startX: number, startY: number) => void;
  moveEntity: (entityId: string, toX: number, toY: number) => void;
  addEntity: (entity: EntityPosition) => void;
  removeEntity: (entityId: string) => void;
  revealTilesAround: (x: number, y: number, radius: number) => void;
  setViewMode: (mode: ViewMode) => void;
  /** Cycle: chat → map → split → chat */
  toggleViewMode: () => void;
  clearMap: () => void;
}
