/**
 * DB Adapter — bridge giữa Zustand store và Dexie (IndexedDB)
 * Zustand vẫn là in-memory state, Dexie là persistent storage
 * Thay thế localStorage cho game state
 */
'use client';

import type { CharacterState, WorldLore, SessionHistory, StoryCard, MemoryNote } from '@/types';

const ADVENTURE_ID_KEY = 'xekkodnd-active-adventure-id';

/** Lấy hoặc tạo adventureId hiện tại */
function getActiveAdventureId(): string {
  if (typeof window === 'undefined') return '';
  const existing = sessionStorage.getItem(ADVENTURE_ID_KEY);
  if (existing) return existing;
  const newId = `adv-${Date.now()}`;
  sessionStorage.setItem(ADVENTURE_ID_KEY, newId);
  return newId;
}

/** Định nghĩa payload lưu xuống DB */
interface GameStatePayload {
  character: CharacterState | null;
  worldLore: WorldLore | null;
  sessionHistory: SessionHistory | null;
  storyCards: StoryCard[];
  memories: MemoryNote[];
  campaignTitle: string;
}

// ─── Save ────────────────────────────────────────────────────────────────────

export async function saveStateToDB(state: GameStatePayload): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const { getDb } = await import('@xekko/core/client');
    const db = getDb();
    const adventureId = getActiveAdventureId();
    const now = new Date().toISOString();

    // Upsert adventure record
    await db.adventures.put({
      id: adventureId,
      title: state.campaignTitle,
      playerEntityId: state.character?.id ?? '',
      currentTurn: state.sessionHistory?.messages.length ?? 0,
      inGameDay: 1,
      createdAt: now,
      lastPlayedAt: now,
    });

    // Upsert player entity
    if (state.character) {
      await db.entities.put({
        id: state.character.id,
        adventureId,
        type: 'player',
        name: state.character.name,
        data: JSON.stringify(state.character),
        isAlive: state.character.hitPoints > 0,
        updatedAt: now,
      });
    }

    // Upsert world state
    if (state.worldLore) {
      await db.world_state.put({
        id: `ws-${adventureId}`,
        adventureId,
        currentLocationId: '',
        inGameDate: state.worldLore.currentDate,
        inGameTime: state.worldLore.currentTime,
        activeEffects: [],
        updatedAt: now,
      });
    }

    // Upsert messages (chỉ sync messages mới)
    if (state.sessionHistory?.messages) {
      const existingIds = new Set(
        (await db.messages.where('adventureId').equals(adventureId).toArray()).map((m) => m.id)
      );
      const newMessages = state.sessionHistory.messages.filter((m) => !existingIds.has(m.id));
      if (newMessages.length > 0) {
        await db.messages.bulkPut(
          newMessages.map((m, i) => ({
            id: m.id,
            adventureId,
            sessionId: state.sessionHistory!.sessionId,
            role: m.role as 'user' | 'assistant' | 'system' | 'dice',
            content: m.content,
            turnNumber: i,
            intent: m.intent,
            timestamp: m.timestamp,
          }))
        );
      }
    }

    // Upsert story cards
    if (state.storyCards.length > 0) {
      await db.story_cards.bulkPut(
        state.storyCards.map((sc) => ({
          id: sc.id,
          adventureId,
          name: sc.name,
          category: 'misc' as const,
          keywords: sc.keywords,
          body: sc.body,
          isAlwaysActive: true,
          injectOnKeyword: true,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    // Upsert memories
    if (state.memories.length > 0) {
      await db.memories.bulkPut(
        state.memories.map((mem) => ({
          id: mem.id,
          adventureId,
          summary: mem.summary,
          tags: mem.tags,
          importance: 3 as const,
          turnNumber: mem.turnNumber ?? 0,
          createdAt: now,
        }))
      );
    }
  } catch (error) {
    console.error('[DBAdapter] Lỗi lưu state:', error);
    // Fallback localStorage
    try {
      const { character, worldLore, sessionHistory, storyCards, memories, campaignTitle } = state;
      localStorage.setItem('xekkodnd-game-state', JSON.stringify({ character, worldLore, sessionHistory, storyCards, memories, campaignTitle }));
    } catch {
      // Silent fail
    }
  }
}

// ─── Load ────────────────────────────────────────────────────────────────────

export async function loadStateFromDB(): Promise<GameStatePayload | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { getDb } = await import('@xekko/core/client');
    const db = getDb();

    // Tìm adventure gần nhất
    const adventures = await db.adventures.orderBy('lastPlayedAt').reverse().limit(1).toArray();
    if (adventures.length === 0) return loadFromLocalStorageFallback();

    const adventure = adventures[0];
    sessionStorage.setItem(ADVENTURE_ID_KEY, adventure.id);

    // Load player entity
    const entityRecord = await db.entities
      .where('[adventureId+type]')
      .equals([adventure.id, 'player'])
      .first()
      .catch(() => db.entities.where('adventureId').equals(adventure.id).first());

    let character: CharacterState | null = null;
    if (entityRecord) {
      try { character = JSON.parse(entityRecord.data); } catch { /* ignore */ }
    }

    // Load messages
    const dbMessages = await db.messages
      .where('adventureId')
      .equals(adventure.id)
      .sortBy('turnNumber');

    // Load story cards
    const dbStoryCards = await db.story_cards
      .where('adventureId')
      .equals(adventure.id)
      .toArray();

    // Load memories
    const dbMemories = await db.memories
      .where('adventureId')
      .equals(adventure.id)
      .toArray();

    const chatMessages = dbMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        timestamp: m.timestamp,
        intent: m.intent,
      }));

    const sessionHistory: SessionHistory | null = chatMessages.length > 0
      ? {
          sessionId: dbMessages[0]?.sessionId ?? `session-${adventure.id}`,
          campaignId: adventure.campaignId ?? 'default',
          startedAt: adventure.createdAt,
          messages: chatMessages,
          diceRolls: [],
          characterActions: [],
        }
      : null;

    return {
      character,
      worldLore: null,
      sessionHistory,
      campaignTitle: adventure.title,
      storyCards: dbStoryCards.map((sc) => ({
        id: sc.id,
        name: sc.name,
        keywords: sc.keywords,
        body: sc.body,
      })),
      memories: dbMemories.map((m) => ({
        id: m.id,
        summary: m.summary,
        tags: m.tags,
        turnNumber: m.turnNumber,
      })),
    };
  } catch (error) {
    console.warn('[DBAdapter] Dexie không khả dụng, fallback localStorage:', error);
    return loadFromLocalStorageFallback();
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteActiveAdventure(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const adventureId = getActiveAdventureId();
    const { deleteAdventureData } = await import('@xekko/core/client');
    await deleteAdventureData(adventureId);
    sessionStorage.removeItem(ADVENTURE_ID_KEY);
    localStorage.removeItem('xekkodnd-game-state');
  } catch {
    localStorage.removeItem('xekkodnd-game-state');
  }
}

// ─── LocalStorage fallback ────────────────────────────────────────────────────

function loadFromLocalStorageFallback(): GameStatePayload | null {
  try {
    const stored = localStorage.getItem('xekkodnd-game-state');
    if (!stored) return null;
    return JSON.parse(stored) as GameStatePayload;
  } catch {
    return null;
  }
}
