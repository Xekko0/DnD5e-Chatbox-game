'use client';

/**
 * Local Map (Tier 2) — PLAN_V5 §4.5
 * Battlemap grid 20×20–40×40, 1 ô = 5-30 ft
 * Tile inventory (items on map tile, visible when adjacent)
 * Entity positions (player, NPC, monster icons)
 * Fog of war: unexplored / explored / visible
 * Click tile → info popup; double-click → move player
 */

import { useState, useCallback, useRef } from 'react';
import { useMapStore } from '@/store/useMapStore';
import type { MapTile, EntityPosition, TileTerrain, FogState } from '@xekko/core/client';

// ---------------------------------------------------------------------------
// Visual config
// ---------------------------------------------------------------------------

const TILE_PX = 24; // px per tile in full view

const TERRAIN_BG: Record<TileTerrain, string> = {
  floor: 'bg-[#3d3529]',
  wall: 'bg-[#141414]',
  door: 'bg-[#7c5c2e]',
  corridor: 'bg-[#252525]',
  stairs_up: 'bg-[#2d4a2a]',
  stairs_down: 'bg-[#3a2a5f]',
  water: 'bg-[#1a3050]',
  difficult: 'bg-[#3d3020]',
  void: 'bg-black',
};

const TERRAIN_BORDER: Record<TileTerrain, string> = {
  floor: 'border-[#2a2420]',
  wall: 'border-[#0a0a0a]',
  door: 'border-[#5c3c1a]',
  corridor: 'border-[#1a1a1a]',
  stairs_up: 'border-[#1a3017]',
  stairs_down: 'border-[#26184a]',
  water: 'border-[#0d2040]',
  difficult: 'border-[#2a2010]',
  void: 'border-black',
};

const ENTITY_ICON: Record<string, string> = {
  player: '⚔',
  npc: '👤',
  monster: '💀',
  boss: '👹',
  pet: '🐾',
};

const ENTITY_COLOR: Record<string, string> = {
  player: 'text-amber-400',
  npc: 'text-green-400',
  monster: 'text-red-400',
  boss: 'text-purple-400',
  pet: 'text-cyan-400',
};

// ---------------------------------------------------------------------------
// Tile info popup
// ---------------------------------------------------------------------------

interface TileInfoPopup {
  tile: MapTile;
  x: number;
  y: number;
  screenX: number;
  screenY: number;
}

function TerrainLabel(terrain: TileTerrain): string {
  const MAP: Record<TileTerrain, string> = {
    floor: 'Sàn hang',
    wall: 'Tường đá',
    door: 'Cửa',
    corridor: 'Hành lang',
    stairs_up: 'Cầu thang lên',
    stairs_down: 'Cầu thang xuống',
    water: 'Vũng nước',
    difficult: 'Địa hình khó',
    void: 'Hư không',
  };
  return MAP[terrain] ?? terrain;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LocalMapProps {
  /** Whether component fills all available height (split view vs full map view) */
  compact?: boolean;
}

export default function LocalMap({ compact = false }: LocalMapProps) {
  const activeMap = useMapStore((s) => s.activeMap);
  const entityPositions = useMapStore((s) => s.entityPositions);
  const viewMode = useMapStore((s) => s.viewMode);
  const setViewMode = useMapStore((s) => s.setViewMode);
  const moveEntity = useMapStore((s) => s.moveEntity);

  const [popup, setPopup] = useState<TileInfoPopup | null>(null);
  const lastClickRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const playerEntity = entityPositions.find((e) => e.entityType === 'player');

  const entityAt = useCallback(
    (tx: number, ty: number): EntityPosition | undefined =>
      entityPositions.find((e) => e.x === tx && e.y === ty),
    [entityPositions]
  );

  const handleTileClick = useCallback(
    (tile: MapTile, tx: number, ty: number, ev: React.MouseEvent) => {
      if (tile.fogState === 'unexplored') return;

      const now = Date.now();
      const last = lastClickRef.current;

      // Double-click detection (within 400ms, same tile)
      if (last && last.x === tx && last.y === ty && now - last.time < 400) {
        lastClickRef.current = null;
        setPopup(null);
        // Move player to this tile
        if (playerEntity) {
          moveEntity(playerEntity.entityId, tx, ty);
        }
        return;
      }

      lastClickRef.current = { x: tx, y: ty, time: now };

      // Show info popup
      const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
      setPopup({
        tile,
        x: tx,
        y: ty,
        screenX: ev.clientX - rect.left + 8,
        screenY: ev.clientY - rect.top + 8,
      });
    },
    [playerEntity, moveEntity]
  );

  const fogClass = (fog: FogState): string => {
    switch (fog) {
      case 'unexplored': return 'opacity-0 pointer-events-none';
      case 'explored': return 'opacity-40';
      case 'visible': return 'opacity-100';
    }
  };

  const fogOverlay = (fog: FogState): string => {
    if (fog === 'explored') return 'after:absolute after:inset-0 after:bg-black/55 after:pointer-events-none';
    return '';
  };

  if (!activeMap) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0d0f12] text-zinc-600 text-sm">
        Chưa có bản đồ
      </div>
    );
  }

  const gridWidth = activeMap.width * TILE_PX;
  const gridHeight = activeMap.height * TILE_PX;

  return (
    <div className="relative flex flex-col bg-[#0a0a0a] select-none overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div className="flex h-9 flex-shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">{activeMap.name}</span>
          <span className="text-[10px] text-zinc-600">
            {activeMap.width}×{activeMap.height} ô · {activeMap.tileSize}ft/ô
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600">phím M để đóng</span>
          <button
            type="button"
            onClick={() => setViewMode('chat')}
            className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Map scroll container */}
      <div className="flex-1 overflow-auto p-2" onClick={() => setPopup(null)}>
        <div
          className="relative"
          style={{ width: gridWidth, height: gridHeight }}
        >
          {/* Render tiles */}
          {activeMap.tiles.map((row, ty) =>
            row.map((tile, tx) => {
              const entity = entityAt(tx, ty);
              const isWalkable = tile.terrain !== 'wall' && tile.terrain !== 'void';
              const fog = tile.fogState;

              return (
                <div
                  key={`${tx}-${ty}`}
                  className={[
                    'absolute border border-solid',
                    TERRAIN_BG[tile.terrain],
                    TERRAIN_BORDER[tile.terrain],
                    fogClass(fog),
                    fogOverlay(fog),
                    'relative overflow-hidden',
                    fog !== 'unexplored' && isWalkable ? 'cursor-pointer hover:brightness-125' : '',
                  ].join(' ')}
                  style={{
                    left: tx * TILE_PX,
                    top: ty * TILE_PX,
                    width: TILE_PX,
                    height: TILE_PX,
                  }}
                  onClick={(ev) => { ev.stopPropagation(); handleTileClick(tile, tx, ty, ev); }}
                  title={fog !== 'unexplored' ? (tile.label ?? TerrainLabel(tile.terrain)) : undefined}
                >
                  {/* Item indicator */}
                  {tile.hasItem && fog === 'visible' && (
                    <span className="absolute right-0.5 top-0.5 text-[7px] leading-none text-yellow-300">◆</span>
                  )}

                  {/* Door indicator */}
                  {tile.isDoor && fog !== 'unexplored' && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-600">
                      {tile.isOpen ? '▯' : '▮'}
                    </span>
                  )}

                  {/* Stairs */}
                  {(tile.terrain === 'stairs_up' || tile.terrain === 'stairs_down') && fog !== 'unexplored' && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-zinc-400">
                      {tile.terrain === 'stairs_up' ? '↑' : '↓'}
                    </span>
                  )}

                  {/* Water ripple */}
                  {tile.terrain === 'water' && fog === 'visible' && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-blue-400 opacity-60">
                      〜
                    </span>
                  )}

                  {/* Entity icon */}
                  {entity && fog !== 'unexplored' && (
                    <span
                      className={[
                        'absolute inset-0 flex items-center justify-center text-[11px] leading-none z-10',
                        ENTITY_COLOR[entity.entityType] ?? 'text-white',
                        entity.entityType === 'player' ? 'drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]' : '',
                      ].join(' ')}
                      title={entity.label ?? entity.entityType}
                    >
                      {ENTITY_ICON[entity.entityType] ?? '●'}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Tile info popup */}
      {popup && (
        <div
          className="pointer-events-none absolute z-20 max-w-[180px] rounded border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs shadow-xl"
          style={{ left: popup.screenX + 40, top: popup.screenY + 36 }}
        >
          <div className="font-semibold text-zinc-200">{popup.tile.label ?? TerrainLabel(popup.tile.terrain)}</div>
          <div className="mt-0.5 text-zinc-500">
            Vị trí: ({popup.x}, {popup.y})
          </div>
          {popup.tile.terrainCost !== 1.0 && popup.tile.terrainCost !== Infinity && (
            <div className="text-zinc-500">Chi phí di chuyển: ×{popup.tile.terrainCost}</div>
          )}
          {popup.tile.terrainCost === Infinity && (
            <div className="text-red-500">Không thể đi qua</div>
          )}
          {popup.tile.hasItem && (
            <div className="mt-1 text-yellow-400">◆ Có vật phẩm</div>
          )}
          {playerEntity && popup.tile.fogState === 'visible' && popup.tile.terrain !== 'wall' && (
            <div className="mt-1 text-zinc-600">Double-click để di chuyển tới đây</div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-shrink-0 items-center gap-3 border-t border-zinc-800 bg-zinc-900/60 px-3 py-1.5">
        {[
          { color: 'bg-amber-400', label: 'Bạn' },
          { color: 'bg-green-400', label: 'NPC' },
          { color: 'bg-red-400', label: 'Kẻ địch' },
          { color: 'bg-yellow-300', label: 'Vật phẩm' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-[10px] text-zinc-500">{label}</span>
          </div>
        ))}
        <div className="ml-auto text-[10px] text-zinc-600">
          Double-click để di chuyển
        </div>
      </div>
    </div>
  );
}
