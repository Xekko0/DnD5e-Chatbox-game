import type { MapData, MapTile, TileTerrain, LightLevel } from '@xekko/core/client';

// ---------------------------------------------------------------------------
// Tile factory helpers
// ---------------------------------------------------------------------------

function wall(): MapTile {
  return { terrain: 'wall', fogState: 'unexplored', lightLevel: 'dark', terrainCost: Infinity };
}

function floor(label?: string): MapTile {
  return { terrain: 'floor', fogState: 'unexplored', lightLevel: 'dim', terrainCost: 1.0, label };
}

function corridor(): MapTile {
  return { terrain: 'corridor', fogState: 'unexplored', lightLevel: 'dark', terrainCost: 1.0 };
}

function door(open = false): MapTile {
  return {
    terrain: 'door',
    fogState: 'unexplored',
    lightLevel: 'dark',
    terrainCost: open ? 1.0 : 1.5,
    isDoor: true,
    isOpen: open,
    label: open ? 'Cửa (mở)' : 'Cửa (đóng)',
  };
}

function difficult(label?: string): MapTile {
  return { terrain: 'difficult', fogState: 'unexplored', lightLevel: 'dim', terrainCost: 2.0, label };
}

function water(): MapTile {
  return { terrain: 'water', fogState: 'unexplored', lightLevel: 'dim', terrainCost: 3.0, label: 'Vũng nước' };
}

// Shorthand
const W = wall;
const F = floor;
const C = corridor;
const D = door;

// ---------------------------------------------------------------------------
// "Goblin Cave Entry" — 20×20 battlemap
// Legend:
//   W = wall, F = floor, C = corridor, D = door
//   Layout (rows 0-19, cols 0-19):
//   - Entry corridor: col 9-10, rows 0-3
//   - Main cave room: cols 4-15, rows 4-14
//   - Side alcove north-west: cols 1-3, rows 5-8
//   - Goblin pen east: cols 16-18, rows 5-10
//   - Pool: cols 7-9, rows 11-13
//   - Exit south corridor: cols 9-10, rows 15-19
// ---------------------------------------------------------------------------

type Row = MapTile[];

function buildGoblinCaveEntry(): MapData {
  // Build a 20×20 grid, default all walls
  const grid: Row[] = Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => wall()));

  // Helper: fill rectangle with a tile factory
  function fill(r1: number, c1: number, r2: number, c2: number, fn: () => MapTile) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        grid[r][c] = fn();
      }
    }
  }

  // Entry corridor (top)
  fill(0, 9, 3, 10, C);

  // Main cave room
  fill(4, 4, 14, 15, F);

  // Room floor labels for some notable spots
  grid[6][7] = floor('Đống xương');
  grid[8][12] = floor('Bàn gỗ mục');
  grid[10][5] = floor('Rơm khô');

  // Side alcove north-west
  fill(5, 1, 8, 3, F);
  grid[5][3] = door(); // door between alcove and main room

  // Goblin pen east
  fill(5, 16, 10, 18, F);
  grid[7][15] = door(); // door to goblin pen (already in main room wall)

  // Pool area (difficult terrain — water)
  fill(11, 7, 13, 9, water);
  grid[11][6] = { ...floor('Bờ ao'), terrainCost: 1.0 };
  grid[11][10] = { ...floor('Bờ ao'), terrainCost: 1.0 };

  // Difficult terrain rubble near north wall
  fill(4, 4, 5, 6, difficult);
  grid[4][4] = { ...difficult(), label: 'Đá vỡ' };

  // Exit corridor (bottom)
  fill(15, 9, 19, 10, C);

  // Add exit marker tile
  grid[19][9] = { ...corridor(), label: 'Ra ngoài →' };
  grid[19][10] = { ...corridor(), label: 'Ra ngoài →' };

  // Torch sconces: bright light spots
  const torchSpots: [number, number][] = [
    [4, 8], [4, 13], [14, 8], [14, 13], [6, 2], [7, 17],
  ];
  for (const [r, c] of torchSpots) {
    if (grid[r][c].terrain !== 'wall') {
      grid[r][c] = { ...grid[r][c], lightLevel: 'bright', label: '🔦 Đuốc' };
    }
  }

  // Item tile
  grid[9][6] = { ...floor('Rương kho'), hasItem: true };

  return {
    id: 'goblin-cave-entry',
    name: 'Cổng Hang Goblin',
    tier: 2,
    width: 20,
    height: 20,
    tileSize: 5,
    tiles: grid,
    startPosition: { x: 9, y: 3 },
    ambientLight: 'dark',
    description: 'Lối vào hang goblin — tối tăm, ẩm ướt. Mùi hôi thối xông lên từ phía nam.',
    exits: [
      { x: 9, y: 0, targetMapId: 'overworld-forest', targetPosition: { x: 50, y: 60 }, label: 'Lối ra rừng' },
      { x: 9, y: 19, targetMapId: 'goblin-cave-deep', targetPosition: { x: 9, y: 0 }, label: 'Vào sâu hơn' },
    ],
  };
}

// Export singleton (created once)
export const GOBLIN_CAVE_ENTRY: MapData = buildGoblinCaveEntry();

/** All bundled sample maps */
export const SAMPLE_MAPS: Record<string, MapData> = {
  'goblin-cave-entry': GOBLIN_CAVE_ENTRY,
};
