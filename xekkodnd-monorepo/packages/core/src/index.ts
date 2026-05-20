/**
 * XekkoDND Core Package - Main Export
 * Re-exports all modules: types, LayeredMemory, RuleEngine, SRD, CampaignPresenter
 */

// Types (from apps/web, but re-exported for convenience)
export type {
  CharacterState,
  WorldLore,
  SessionHistory,
  GameSnapshot,
  LayeredMemory,
  RuleCheckResult,
  IntentParseResult,
  MultiOutputPayload,
  PresenterOutput,
} from '../../apps/web/src/types';

// LayeredMemory (0.3)
export { LayeredMemoryManager, createDefaultLayeredMemory } from './LayeredMemory';

// SRD Data (0.4)
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

// Rule Engine (0.5)
export { RuleEngine, ruleEngine } from './RuleEngine';

// Campaign Presenter (0.7)
export { CampaignPresenter, IntentParser, createCampaignPresenter } from './CampaignPresenter';

// Version
export const VERSION = '0.7.0-MVP';
export const PACKAGE_NAME = '@xekko/core';
