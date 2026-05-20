/**
 * XekkoDND TypeScript Types & Interfaces
 * Defines the complete shape of character state, world lore, memory layers, and game snapshots.
 */

// ============================================================================
// D&D 5e Basic Types
// ============================================================================

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
export type AbilityScore = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
export type Skill = 'acrobatics' | 'animal-handling' | 'arcana' | 'athletics' | 'deception' | 'history' | 'insight' | 'intimidation' | 'investigation' | 'medicine' | 'nature' | 'perception' | 'performance' | 'persuasion' | 'religion' | 'sleight-of-hand' | 'stealth' | 'survival';

// ============================================================================
// Character State (0.2)
// ============================================================================

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface CharacterState {
  id: string; // unique character ID
  name: string;
  race: string; // "Human", "Elf", etc.
  class: string; // "Fighter", "Wizard", etc.
  background: string;
  alignment: string; // e.g., "Chaotic Good"
  
  // Core stats
  level: number;
  experience: number;
  hitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  speed: number; // feet per round
  proficiencyBonus: number;
  inspiration: number; // Inspiration points (0-1 typically)
  
  // Abilities
  abilityScores: AbilityScores;
  savingThrows: Partial<Record<AbilityScore, number>>; // Override from proficiency
  skillProficiencies: Partial<Record<Skill, boolean>>;
  skillExpertise: Partial<Record<Skill, boolean>>;
  
  // Resources
  spellSlots?: Record<number, { used: number; max: number }>; // 1-9
  ki?: number;
  sorceryPoints?: number;
  channelDivinity?: number;
  
  // Equipment & Inventory
  inventory: InventoryItem[];
  equipment: Equipment;
  
  // Status
  conditions: Condition[];
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number; // pounds
  rarity?: string;
  description?: string;
}

export interface Equipment {
  head?: string;
  body?: string;
  hands?: string;
  feet?: string;
  mainHand?: string;
  offHand?: string;
  ring1?: string;
  ring2?: string;
}

export type Condition = 'blinded' | 'charmed' | 'deafened' | 'exhaustion' | 'frightened' | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned' | 'prone' | 'restrained' | 'stunned' | 'unconscious';

// ============================================================================
// World Lore & Campaign State
// ============================================================================

export interface WorldLore {
  campaignName: string;
  setting: string; // e.g., "Forgotten Realms", "Greyhawk"
  currentDate: string; // in-game date
  currentTime: string; // time of day
  locations: LocationEntry[];
  npcs: NPCEntry[];
  factions: FactionEntry[];
  questLog: QuestEntry[];
  loreNotes: string; // free-text campaign notes
}

export interface LocationEntry {
  id: string;
  name: string;
  description: string;
  encounters?: string[]; // encounter IDs
  connectedLocations?: string[]; // location IDs
}

export interface NPCEntry {
  id: string;
  name: string;
  role: string; // e.g., "Tavern Keeper", "Villain"
  description: string;
  attitude: 'friendly' | 'neutral' | 'hostile';
  notes?: string;
}

export interface FactionEntry {
  id: string;
  name: string;
  alignment: string;
  description: string;
  goals: string[];
  reputation: number; // -100 to 100
}

export interface QuestEntry {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'complete' | 'failed' | 'abandoned';
  reward?: string;
  giver?: string; // NPC id
}

// ============================================================================
// Session History (Chat, Decisions, Rolls)
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO
  intent?: string; // "chat", "roll", "spell", "action", etc.
}

export interface DiceRoll {
  id: string;
  timestamp: string;
  expression: string; // "1d20+5"
  result: number;
  rolls: number[]; // individual die results
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface SessionHistory {
  sessionId: string;
  campaignId: string;
  startedAt: string;
  endedAt?: string;
  messages: ChatMessage[];
  diceRolls: DiceRoll[];
  characterActions: CharacterAction[];
}

export interface CharacterAction {
  id: string;
  timestamp: string;
  actionType: 'attack' | 'spell' | 'skill-check' | 'movement' | 'interaction' | 'other';
  description: string;
  result?: 'success' | 'failure' | 'partial';
  details?: Record<string, unknown>;
}

// ============================================================================
// Game Snapshot (Point-in-time state)
// ============================================================================

export interface GameSnapshot {
  snapshotId: string;
  campaignId: string;
  timestamp: string;
  character: CharacterState;
  worldLore: WorldLore;
  sessionHistory: SessionHistory;
  notes?: string;
}

// ============================================================================
// Layered Memory Structure (0.3)
// ============================================================================

export interface LayeredMemory {
  worldLoreLayer: WorldLore;
  characterStateLayer: CharacterState;
  sessionHistoryLayer: SessionHistory;
  gameSnapshotLayer: GameSnapshot[];
}

// ============================================================================
// Rule Engine Types (0.5)
// ============================================================================

export interface RuleCheckResult {
  passed: boolean;
  dc?: number; // Difficulty Class
  roll?: number; // The actual roll
  bonus?: number;
  advantage?: boolean;
  disadvantage?: boolean;
  message: string;
}

export interface SpellCheckInput {
  spellLevel: number;
  characterClass: string;
  abilityScore: AbilityScore;
}

export interface ACCalculationInput {
  baseAC: number;
  dexModifier?: number;
  shield?: boolean;
  spellEffects?: string[];
}

// ============================================================================
// Multi-Output Payload (0.7 Presenter)
// ============================================================================

export interface IntentParseResult {
  intent: 'chat' | 'roll' | 'spell-cast' | 'attack' | 'skill-check' | 'movement' | 'meta' | 'unknown';
  confidence: number; // 0-1
  rawText: string;
  parsed?: Record<string, unknown>;
}

export interface MultiOutputPayload {
  narrativeResponse: string;
  stateUpdates?: Partial<CharacterState>;
  diceRolls?: DiceRoll[];
  messages?: ChatMessage[];
  warnings?: string[];
  metadata?: {
    processingTimeMs: number;
    ruleChecksApplied: string[];
  };
}

// ============================================================================
// State Manager & Store Types (0.6)
// ============================================================================

export interface GameStoreState {
  character: CharacterState | null;
  worldLore: WorldLore | null;
  sessionHistory: SessionHistory | null;
  isLoading: boolean;
  error: string | null;
  lastSavedAt: string | null;
}

export interface GameStoreActions {
  loadGame(campaignId: string): Promise<void>;
  saveGame(): Promise<void>;
  createCharacter(character: CharacterState): void;
  updateCharacter(updates: Partial<CharacterState>): void;
  addChatMessage(message: ChatMessage): void;
  addDiceRoll(roll: DiceRoll): void;
  undo(): void;
  redo(): void;
  setError(error: string | null): void;
}

// ============================================================================
// Campaign Presenter Types (0.7)
// ============================================================================

export interface CampaignPresenterConfig {
  characterState: CharacterState;
  worldLore: WorldLore;
  ruleEnginePath?: string; // for lazy loading
  modelName?: string; // e.g., "llama3.1:8b"
}

export interface PresenterOutput {
  intent: IntentParseResult;
  ruleChecks: RuleCheckResult[];
  multiOutput: MultiOutputPayload;
}
