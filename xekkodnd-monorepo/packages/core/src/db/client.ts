/**
 * Dexie DB Client — PLAN_V5 §6, §7
 * M1: IndexedDB qua Dexie.js (browser/web)
 * M1+: Migrate sang SQLite via Tauri SQL plugin khi desktop app ready
 *
 * Schema tương ứng với PLAN_V5 §6.1 (28 bảng)
 * M1 implement: adventure, entity, inventory_item, equipment_slot,
 *   condition_active, quest, quest_objective, memory, story_card,
 *   game_event, message, world_state
 */

import Dexie, { type Table } from 'dexie';
import type { FloatingItem, InventoryItemV5, TileItem } from '../types/item';
import type { Quest, QuestObjective, QuestBranch, QuestEvent } from '../types/quest';
import type { Memory, StoryCardV5, GameEventLog, MessageV5 } from '../types/memory';
import type { ComputedStats } from '../types/entity';

// ─── Table record types ──────────────────────────────────────────────────────

export interface AdventureRecord {
  id: string;
  title: string;
  campaignId?: string;
  playerEntityId: string;
  currentSceneId?: string;
  currentTurn: number;
  inGameDay: number;
  createdAt: string;
  lastPlayedAt: string;
}

export interface EntityRecord {
  id: string;
  adventureId: string;
  type: string;
  name: string;
  /** JSON blob của full entity (PlayerEntity | NpcEntity | MonsterEntity) */
  data: string;
  isAlive: boolean;
  currentLocationId?: string;
  updatedAt: string;
}

export interface WorldStateRecord {
  id: string;
  adventureId: string;
  currentLocationId: string;
  currentMapId?: string;
  currentTier?: number;
  weatherDescription?: string;
  inGameDate: string;
  inGameTime: string;
  activeEffects: string[];
  updatedAt: string;
}

export interface ConditionActiveRecord {
  id: string;
  entityId: string;
  adventureId: string;
  condition: string;
  appliedAt: string;
  duration?: number;
  source?: string;
}

// ─── Dexie database class ────────────────────────────────────────────────────

export class XekkoDB extends Dexie {
  adventures!: Table<AdventureRecord, string>;
  entities!: Table<EntityRecord, string>;
  world_state!: Table<WorldStateRecord, string>;

  inventory_items!: Table<InventoryItemV5, string>;
  floating_items!: Table<FloatingItem, string>;
  tile_items!: Table<TileItem, string>;

  conditions_active!: Table<ConditionActiveRecord, string>;

  quests!: Table<Quest, string>;
  quest_objectives!: Table<QuestObjective, string>;
  quest_branches!: Table<QuestBranch, string>;
  quest_events!: Table<QuestEvent, string>;

  memories!: Table<Memory, string>;
  story_cards!: Table<StoryCardV5, string>;
  game_events!: Table<GameEventLog, string>;
  messages!: Table<MessageV5, string>;

  computed_stats!: Table<ComputedStats, string>;

  constructor() {
    super('XekkoDND');

    this.version(1).stores({
      // ── Adventures & Entities ──────────────────────────
      adventures:        '&id, title, lastPlayedAt',
      entities:          '&id, adventureId, type, name, isAlive',
      world_state:       '&id, adventureId',

      // ── Items ─────────────────────────────────────────
      inventory_items:   '&id, adventureId, entityId, equippedSlot',
      floating_items:    '&id, adventureId, state',
      tile_items:        '&id, adventureId, mapId, [tileX+tileY]',

      // ── Conditions ────────────────────────────────────
      conditions_active: '&id, entityId, adventureId, condition',

      // ── Quests ────────────────────────────────────────
      quests:            '&id, adventureId, type, status',
      quest_objectives:  '&id, questId, status',
      quest_branches:    '&id, questId, isChosen',
      quest_events:      '&id, questId, adventureId, turnNumber',

      // ── Memory ────────────────────────────────────────
      memories:          '&id, adventureId, turnNumber, importance',
      story_cards:       '&id, adventureId, category, isAlwaysActive',
      game_events:       '&id, adventureId, type, turnNumber',
      messages:          '&id, adventureId, sessionId, turnNumber, role',

      // ── Computed cache ────────────────────────────────
      computed_stats:    '&entityId',
    });
  }
}

/** Singleton DB instance (lazy, chỉ tạo ở browser) */
let _db: XekkoDB | null = null;

export function getDb(): XekkoDB {
  if (typeof window === 'undefined') {
    throw new Error('[XekkoDB] Dexie chỉ chạy được ở browser (client-side).');
  }
  if (!_db) {
    _db = new XekkoDB();
  }
  return _db;
}

/** Xóa toàn bộ DB (dùng khi reset adventure) */
export async function clearDatabase(): Promise<void> {
  const db = getDb();
  await Promise.all([
    db.adventures.clear(),
    db.entities.clear(),
    db.world_state.clear(),
    db.inventory_items.clear(),
    db.floating_items.clear(),
    db.tile_items.clear(),
    db.conditions_active.clear(),
    db.quests.clear(),
    db.quest_objectives.clear(),
    db.quest_branches.clear(),
    db.quest_events.clear(),
    db.memories.clear(),
    db.story_cards.clear(),
    db.game_events.clear(),
    db.messages.clear(),
    db.computed_stats.clear(),
  ]);
}

/** Xóa data của một adventure cụ thể */
export async function deleteAdventureData(adventureId: string): Promise<void> {
  const db = getDb();
  await Promise.all([
    db.adventures.where('id').equals(adventureId).delete(),
    db.entities.where('adventureId').equals(adventureId).delete(),
    db.world_state.where('adventureId').equals(adventureId).delete(),
    db.inventory_items.where('adventureId').equals(adventureId).delete(),
    db.floating_items.where('adventureId').equals(adventureId).delete(),
    db.tile_items.where('adventureId').equals(adventureId).delete(),
    db.conditions_active.where('adventureId').equals(adventureId).delete(),
    db.quests.where('adventureId').equals(adventureId).delete(),
    db.quest_objectives.where('questId').equals(adventureId).delete(),
    db.memories.where('adventureId').equals(adventureId).delete(),
    db.story_cards.where('adventureId').equals(adventureId).delete(),
    db.game_events.where('adventureId').equals(adventureId).delete(),
    db.messages.where('adventureId').equals(adventureId).delete(),
  ]);
}
