/**
 * Item types — PLAN_V5 §4.3 (Trụ 3: Interactive Items)
 * Inventory items, equipment slots, floating items, tile items
 */

// ─── Item category & rarity ──────────────────────────────────────────────────

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'potion'
  | 'scroll'
  | 'wand'
  | 'ring'
  | 'amulet'
  | 'tool'
  | 'ammunition'
  | 'container'
  | 'currency'
  | 'quest'
  | 'misc';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact';

export const RARITY_COLOR: Record<ItemRarity, string> = {
  common: '#9ca3af',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  very_rare: '#c084fc',
  legendary: '#fb923c',
  artifact: '#fbbf24',
};

// ─── Equipment slots ──────────────────────────────────────────────────────────

export type EquipmentSlot =
  | 'main_hand'
  | 'off_hand'
  | 'ranged'
  | 'ammo'
  | 'armor'
  | 'head'
  | 'cloak'
  | 'boots'
  | 'gloves'
  | 'belt'
  | 'amulet'
  | 'ring1'
  | 'ring2'
  | 'clothing';

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  main_hand: 'Tay chính',
  off_hand: 'Tay phụ',
  ranged: 'Vũ khí tầm xa',
  ammo: 'Đạn',
  armor: 'Giáp',
  head: 'Đầu',
  cloak: 'Áo choàng',
  boots: 'Giày',
  gloves: 'Găng tay',
  belt: 'Thắt lưng',
  amulet: 'Vòng cổ',
  ring1: 'Nhẫn 1',
  ring2: 'Nhẫn 2',
  clothing: 'Trang phục',
};

// ─── Item stat effects ─────────────────────────────────────────────────────────

export interface ItemEffect {
  stat: string;
  modifier: number;
  description?: string;
}

// ─── Core item definition ─────────────────────────────────────────────────────

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  weight: number;
  description: string;
  flavor?: string;
  effects?: ItemEffect[];
  /** Cho weapon: damage dice */
  damage?: string;
  damageType?: string;
  /** Cho armor: base AC */
  baseAC?: number;
  /** Cần attunement? */
  requiresAttunement?: boolean;
  /** Chỉ dùng được X lần */
  charges?: { current: number; max: number };
}

// ─── Inventory item (instance trong túi đồ của entity) ───────────────────────

export interface InventoryItemV5 {
  id: string;
  adventureId: string;
  entityId: string;
  definitionId?: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  quantity: number;
  weight: number;
  description?: string;
  equippedSlot?: EquipmentSlot | null;
  isAttuned?: boolean;
  charges?: { current: number; max: number };
  acquiredAt: string;
  notes?: string;
}

// ─── Floating item (item đang nổi trong chat, chờ pickup) ────────────────────

export type FloatingItemState = 'pending' | 'picked_up' | 'dismissed' | 'expired';

export interface FloatingItem {
  id: string;
  adventureId: string;
  /** Narrative message ID nơi item xuất hiện */
  sourceMessageId: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  quantity: number;
  weight?: number;
  description?: string;
  state: FloatingItemState;
  /** Expire khi đổi location */
  locationId?: string;
  detectedAt: string;
  /** Confidence score từ Item Detector LLM (0-1) */
  confidence: number;
}

// ─── Tile item (item trên ô map) ──────────────────────────────────────────────

export interface TileItem {
  id: string;
  adventureId: string;
  mapId: string;
  tileX: number;
  tileY: number;
  itemDefinitionId: string;
  quantity: number;
  /** Visible chỉ khi player ở adjacent tile */
  isHidden: boolean;
  /** Perception DC để phát hiện (nếu isHidden) */
  perceptionDC?: number;
  placedAt: string;
}
