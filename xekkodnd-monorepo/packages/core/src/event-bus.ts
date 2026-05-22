/**
 * Event Bus — PLAN_V5 §5 (Pipeline [6])
 * Typed pub/sub kết nối pipeline output → quest engine, fog of war, memory summarizer
 */

// ─── Event payload types ────────────────────────────────────────────────────

export interface GameEvents {
  /** Một entity bị giết (trigger kill objectives) */
  entity_died: { entityId: string; entityName: string; adventureId: string };

  /** Player nhặt được item (trigger fetch objectives) */
  item_acquired: { itemId: string; itemName: string; adventureId: string };

  /** Player/entity di chuyển vào location (trigger reach objectives + fog of war) */
  location_entered: { locationId: string; locationName: string; entityId: string; adventureId: string };

  /** Hoàn thành dialogue với NPC (trigger talk objectives) */
  dialogue_completed: { npcId: string; npcName: string; adventureId: string };

  /** Condition được thêm vào entity (trigger stat recalc + effect engine) */
  condition_added: { entityId: string; condition: string };

  /** Condition bị xóa khỏi entity */
  condition_removed: { entityId: string; condition: string };

  /** Nhân vật level up */
  level_up: { entityId: string; newLevel: number };

  /** Một turn hoàn thành (trigger memory summarizer mỗi 5 turn) */
  turn_completed: { turnNumber: number; adventureId: string };

  /** Quest objective được đánh dấu hoàn thành */
  objective_completed: { questId: string; objectiveId: string; adventureId: string };

  /** Quest hoàn thành */
  quest_completed: { questId: string; questTitle: string; adventureId: string };

  /** Quest thất bại */
  quest_failed: { questId: string; questTitle: string; reason: string };

  /** Item được drop trên tile */
  item_dropped: { itemId: string; tileX: number; tileY: number; mapId: string };

  /** Auto-save trigger */
  save_requested: { adventureId: string };
}

export type GameEventName = keyof GameEvents;
export type GameEventPayload<T extends GameEventName> = GameEvents[T];

// ─── Listener type ──────────────────────────────────────────────────────────

type Listener<T extends GameEventName> = (payload: GameEventPayload<T>) => void | Promise<void>;

// ─── EventBus implementation ─────────────────────────────────────────────────

class EventBus {
  private listeners: Map<string, Set<Listener<GameEventName>>> = new Map();

  /** Đăng ký lắng nghe một event. Trả về hàm hủy đăng ký. */
  on<T extends GameEventName>(event: T, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<GameEventName>);

    return () => this.off(event, listener);
  }

  /** Hủy đăng ký listener */
  off<T extends GameEventName>(event: T, listener: Listener<T>): void {
    this.listeners.get(event)?.delete(listener as Listener<GameEventName>);
  }

  /** Phát một event đến tất cả listeners (async-safe, lỗi một listener không làm hỏng cái khác) */
  async emit<T extends GameEventName>(event: T, payload: GameEventPayload<T>): Promise<void> {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;

    const calls = [...set].map((listener) => {
      try {
        return Promise.resolve(listener(payload as GameEventPayload<GameEventName>));
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
        return Promise.resolve();
      }
    });

    await Promise.all(calls);
  }

  /** Xóa tất cả listeners (dùng khi reset adventure) */
  clear(): void {
    this.listeners.clear();
  }

  /** Xóa tất cả listeners của một event cụ thể */
  clearEvent(event: GameEventName): void {
    this.listeners.delete(event);
  }

  /** Số lượng listeners đang đăng ký */
  listenerCount(event: GameEventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

/** Singleton EventBus cho toàn app */
export const eventBus = new EventBus();
