/**
 * XekkoDND Core Package - Main Export
 */

export * from './types';

export { LayeredMemoryManager, createDefaultLayeredMemory } from './LayeredMemory';

export {
  loadSRDData,
  getRace,
  getClass,
  getSpell,
  getMonster,
  getItem,
  listRaces,
  listClasses,
  listSpells,
} from './data/srd/loader';

export { RuleEngine, ruleEngine } from './RuleEngine';

export { CampaignPresenter, IntentParser, createCampaignPresenter } from './CampaignPresenter';

export { buildDmSystemPrompt, ollamaChat, testOllamaConnection } from './ollama';

export const VERSION = '0.7.0-MVP';
export const PACKAGE_NAME = '@xekko/core';
