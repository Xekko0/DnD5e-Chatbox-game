'use client';

import { create } from 'zustand';
import type {
  MapData,
  MapTile,
  EntityPosition,
  ViewMode,
  ActiveTier,
  MapStoreState,
  MapStoreActions,
} from '@xekko/core/client';

type MapStore = MapStoreState & MapStoreActions;

const VIEW_MODE_CYCLE: ViewMode[] = ['chat', 'map', 'split'];

/**
 * Update fog-of-war on a tile grid.
 * Previously-visible tiles become 'explored'; tiles within radius become 'visible'.
 */
function computeRevealedTiles(tiles: MapTile[][], cx: number, cy: number, radius: number): MapTile[][] {
  const height = tiles.length;
  const width = tiles[0]?.length ?? 0;
  if (width === 0 || height === 0) return tiles;

  // Clone the 2D array shallowly (rows are cloned on mutation below)
  const next = tiles.map((row) => [...row]);

  // Downgrade previously visible tiles to explored
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (next[y][x].fogState === 'visible') {
        next[y][x] = { ...next[y][x], fogState: 'explored' };
      }
    }
  }

  // Reveal tiles within radius (simple circle, ignores walls for now)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= radius) {
        next[y][x] = { ...next[y][x], fogState: 'visible' };
      }
    }
  }

  return next;
}

export const useMapStore = create<MapStore>((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  activeTier: 'local',
  activeMap: null,
  entityPositions: [],
  viewMode: 'chat',

  // ── Actions ──────────────────────────────────────────────────────────────

  loadMap(map, playerEntityId, startX, startY) {
    const revealedTiles = computeRevealedTiles(map.tiles, startX, startY, 3);
    const loadedMap: MapData = { ...map, tiles: revealedTiles };

    const playerEntity: EntityPosition = {
      entityId: playerEntityId,
      entityType: 'player',
      x: startX,
      y: startY,
      label: 'Player',
    };

    set({
      activeMap: loadedMap,
      entityPositions: [playerEntity],
      activeTier: map.tier === 0 ? 'world' : map.tier === 1 ? 'regional' : 'local',
    });
  },

  moveEntity(entityId, toX, toY) {
    const { activeMap, entityPositions } = get();
    if (!activeMap) return;

    const tile = activeMap.tiles[toY]?.[toX];
    // Block movement into walls or void
    if (!tile || tile.terrain === 'wall' || tile.terrain === 'void') return;

    const updatedPositions = entityPositions.map((ep) =>
      ep.entityId === entityId ? { ...ep, x: toX, y: toY } : ep
    );

    // Reveal tiles around the moved entity (player only reveals fog)
    const movedEntity = updatedPositions.find((ep) => ep.entityId === entityId);
    let updatedTiles = activeMap.tiles;
    if (movedEntity?.entityType === 'player') {
      updatedTiles = computeRevealedTiles(activeMap.tiles, toX, toY, 3);
    }

    set({
      entityPositions: updatedPositions,
      activeMap: { ...activeMap, tiles: updatedTiles },
    });
  },

  addEntity(entity) {
    set((state) => ({
      entityPositions: [
        ...state.entityPositions.filter((ep) => ep.entityId !== entity.entityId),
        entity,
      ],
    }));
  },

  removeEntity(entityId) {
    set((state) => ({
      entityPositions: state.entityPositions.filter((ep) => ep.entityId !== entityId),
    }));
  },

  revealTilesAround(x, y, radius) {
    const { activeMap } = get();
    if (!activeMap) return;
    const updatedTiles = computeRevealedTiles(activeMap.tiles, x, y, radius);
    set({ activeMap: { ...activeMap, tiles: updatedTiles } });
  },

  setViewMode(mode) {
    set({ viewMode: mode });
  },

  toggleViewMode() {
    const { viewMode } = get();
    const idx = VIEW_MODE_CYCLE.indexOf(viewMode);
    const next = VIEW_MODE_CYCLE[(idx + 1) % VIEW_MODE_CYCLE.length];
    set({ viewMode: next });
  },

  clearMap() {
    set({ activeMap: null, entityPositions: [], activeTier: 'local' });
  },
}));
