/**
 * Event Bus — PLAN_V5 §5 (Pipeline [6])
 * Kết nối pipeline output → các engine subscriber
 * Events:
 *   entity_died(id)          → quest engine (kill objectives)
 *   item_acquired(id)        → quest engine (fetch objectives)
 *   location_entered(id)     → quest engine (reach objectives) + map fog
 *   dialogue_completed(npc)  → quest engine (talk objectives)
 *   condition_added(cond)    → stat calculator + effect engine
 *   level_up(entity)         → notification + stat recalc
 *   turn_completed(n)        → memory summarizer (mỗi 5 turn)
 * TODO: Implement typed event bus (EventEmitter hoặc simple pub/sub)
 */
export {};
