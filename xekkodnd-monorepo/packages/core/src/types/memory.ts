/**
 * Memory types — PLAN_V5 §4.4 (Trụ 4: Memory & State)
 * Retrieval M1: keyword match
 * Retrieval M2: BM25 ranking
 * Retrieval M3: semantic search (local embeddings)
 */

// ─── Memory (auto-summary mỗi 5 turn) ────────────────────────────────────────

export type MemoryImportance = 1 | 2 | 3 | 4 | 5;

export interface Memory {
  id: string;
  adventureId: string;
  summary: string;
  /** Tags để keyword match: tên NPC, location, items... */
  tags: string[];
  importance: MemoryImportance;
  /** Turn số mà memory này được tạo */
  turnNumber: number;
  /** Các turn được tóm tắt (vd: turns 1-5) */
  coversTurns?: { from: number; to: number };
  createdAt: string;
}

// ─── Story Card (user-created memory pin) ────────────────────────────────────

export type StoryCardCategory =
  | 'character'
  | 'npc'
  | 'location'
  | 'lore'
  | 'secret'
  | 'prophecy'
  | 'relationship'
  | 'misc';

export interface StoryCardV5 {
  id: string;
  adventureId: string;
  name: string;
  category: StoryCardCategory;
  keywords: string[];
  body: string;
  /** Story cards luôn active (không bị score out như memories) */
  isAlwaysActive: boolean;
  /** Tự động inject khi keyword match trong player input */
  injectOnKeyword: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Event (raw event log per turn) ──────────────────────────────────────────

export type GameEventType =
  | 'entity_died'
  | 'item_acquired'
  | 'item_dropped'
  | 'location_entered'
  | 'dialogue_completed'
  | 'condition_added'
  | 'condition_removed'
  | 'level_up'
  | 'turn_completed'
  | 'quest_updated'
  | 'combat_started'
  | 'combat_ended'
  | 'rest_taken'
  | 'custom';

export interface GameEventLog {
  id: string;
  adventureId: string;
  type: GameEventType;
  description: string;
  turnNumber: number;
  entityId?: string;
  relatedIds?: string[];
  payload?: Record<string, unknown>;
  timestamp: string;
}

// ─── Message (chat history, đầy đủ hơn ChatMessage hiện tại) ─────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'dice';

export interface MessageV5 {
  id: string;
  adventureId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  turnNumber: number;
  /** Intent đã parse (chat, roll, attack...) */
  intent?: string;
  /** Dice rolls liên quan đến message này */
  diceRollIds?: string[];
  timestamp: string;
}

// ─── Working context (assembled bởi Context Builder) ─────────────────────────

export interface WorkingContext {
  adventureId: string;
  turnNumber: number;
  /** Top 3 relevant memories */
  memories: Memory[];
  /** Active story cards */
  storyCards: StoryCardV5[];
  /** Last 10 messages */
  recentMessages: MessageV5[];
  /** Character state snapshot */
  characterSummary: string;
  /** Active quests summary */
  questSummary: string;
  /** Current location + map context */
  locationSummary: string;
  /** Approximate token count */
  estimatedTokens: number;
}
