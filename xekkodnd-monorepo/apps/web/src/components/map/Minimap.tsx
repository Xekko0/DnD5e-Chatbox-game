'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '@/store/useMapStore';
import type { MapTile, EntityPosition, TileTerrain, FogState } from '@xekko/core/client';

// ---------------------------------------------------------------------------
// Canvas drawing config
// ---------------------------------------------------------------------------

const CANVAS_SIZE = 200; // px — fixed square canvas

/** Terrain base colours (fully visible) */
const TERRAIN_COLOR: Record<TileTerrain, string> = {
  floor: '#3d3529',
  wall: '#1a1a1a',
  door: '#7c5c2e',
  corridor: '#2e2e2e',
  stairs_up: '#4a6741',
  stairs_down: '#6741a0',
  water: '#1e3a5f',
  difficult: '#4a3a2e',
  void: '#000000',
};

/** Entity dot colours */
const ENTITY_COLOR: Record<string, string> = {
  player: '#f59e0b',    // amber
  npc: '#86efac',       // green-300
  monster: '#f87171',   // red-400
  boss: '#c084fc',      // purple-400
  pet: '#67e8f9',       // cyan-300
};

function fogAlpha(fog: FogState): number {
  switch (fog) {
    case 'unexplored': return 1.0;  // fully black
    case 'explored': return 0.65;   // dark overlay
    case 'visible': return 0;       // clear
  }
}

function drawMap(
  ctx: CanvasRenderingContext2D,
  tiles: MapTile[][],
  entities: EntityPosition[],
  tileW: number,
  tileH: number,
) {
  const height = tiles.length;
  const width = tiles[0]?.length ?? 0;

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = tiles[y][x];
      const px = x * tileW;
      const py = y * tileH;

      // Base terrain colour
      ctx.fillStyle = TERRAIN_COLOR[tile.terrain] ?? '#111';
      ctx.fillRect(px, py, tileW, tileH);

      // Item indicator (small dot top-right) — only if tile visible
      if (tile.hasItem && tile.fogState === 'visible') {
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(px + tileW - 1.5, py + 1.5, Math.min(1.5, tileW * 0.15), 0, Math.PI * 2);
        ctx.fill();
      }

      // Fog overlay
      const alpha = fogAlpha(tile.fogState);
      if (alpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(px, py, tileW, tileH);
      }
    }
  }

  // Draw entities on top
  for (const entity of entities) {
    const tile = tiles[entity.y]?.[entity.x];
    if (!tile || tile.fogState === 'unexplored') continue;

    const cx = entity.x * tileW + tileW / 2;
    const cy = entity.y * tileH + tileH / 2;
    const r = Math.max(1.5, Math.min(tileW, tileH) * 0.38);

    // Outer glow ring for player
    if (entity.entityType === 'player') {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245,158,11,0.3)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = ENTITY_COLOR[entity.entityType] ?? '#ffffff';
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MinimapProps {
  className?: string;
}

export default function Minimap({ className = '' }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeMap = useMapStore((s) => s.activeMap);
  const entityPositions = useMapStore((s) => s.entityPositions);
  const viewMode = useMapStore((s) => s.viewMode);
  const setViewMode = useMapStore((s) => s.setViewMode);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeMap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tileW = CANVAS_SIZE / activeMap.width;
    const tileH = CANVAS_SIZE / activeMap.height;
    drawMap(ctx, activeMap.tiles, entityPositions, tileW, tileH);
  }, [activeMap, entityPositions]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  if (!activeMap) return null;
  if (viewMode !== 'chat') return null;

  const playerPos = entityPositions.find((e) => e.entityType === 'player');

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded border border-zinc-700/60 bg-black shadow-lg shadow-black/60 ${className}`}
      style={{ width: CANVAS_SIZE, height: CANVAS_SIZE + 24 }}
    >
      {/* Title bar */}
      <div className="flex h-6 flex-shrink-0 items-center justify-between bg-zinc-900/90 px-2">
        <span className="truncate text-[10px] font-medium text-zinc-400">{activeMap.name}</span>
        {playerPos && (
          <span className="text-[9px] text-zinc-600">
            {playerPos.x},{playerPos.y}
          </span>
        )}
      </div>

      {/* Canvas */}
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="block cursor-pointer"
          onClick={() => setViewMode('map')}
          title="Bấm để xem bản đồ đầy đủ (hoặc nhấn M)"
        />

        {/* Expand hint overlay on hover */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] text-zinc-300">
            Bấm để mở rộng
          </span>
        </div>
      </div>
    </div>
  );
}
