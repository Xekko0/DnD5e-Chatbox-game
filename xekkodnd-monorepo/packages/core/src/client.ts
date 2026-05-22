/**
 * Browser-safe exports (no Node fs/path)
 */
export * from './types';
export * from './types/entity';
export * from './types/item';
export * from './types/quest';
export * from './types/memory';
export * from './types/map';
export { RuleEngine, ruleEngine } from './RuleEngine';
export { CampaignPresenter, IntentParser, createCampaignPresenter } from './CampaignPresenter';
export { buildDmSystemPrompt, ollamaChat, testOllamaConnection } from './ollama';
export { eventBus } from './event-bus';
// ─── Rule Engine Modules ────────────────────────────────────────────────────
export * from './modules/dice';
export * from './modules/action-economy';
export * from './modules/combat';
export type { GameEvents, GameEventName, GameEventPayload } from './event-bus';
export { getDb, deleteAdventureData, clearDatabase } from './db/client';
export type { XekkoDB, AdventureRecord, EntityRecord, WorldStateRecord } from './db/client';
