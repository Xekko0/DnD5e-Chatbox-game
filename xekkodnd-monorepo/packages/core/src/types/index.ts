/**
 * XekkoDND shared types (@xekko/core)
 */

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
export type AbilityScore = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
export type Skill =
  | 'acrobatics'
  | 'animal-handling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleight-of-hand'
  | 'stealth'
  | 'survival';

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface CharacterState {
  id: string;
  name: string;
  race: string;
  class: string;
  background: string;
  alignment: string;
  level: number;
  experience: number;
  hitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  speed: number;
  proficiencyBonus: number;
  inspiration: number;
  abilityScores: AbilityScores;
  savingThrows: Partial<Record<AbilityScore, number>>;
  skillProficiencies: Partial<Record<Skill, boolean>>;
  skillExpertise: Partial<Record<Skill, boolean>>;
  spellSlots?: Record<number, { used: number; max: number }>;
  ki?: number;
  sorceryPoints?: number;
  channelDivinity?: number;
  inventory: InventoryItem[];
  equipment: Equipment;
  conditions: Condition[];
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
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

export type Condition =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'exhaustion'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

export interface WorldLore {
  campaignName: string;
  setting: string;
  currentDate: string;
  currentTime: string;
  locations: LocationEntry[];
  npcs: NPCEntry[];
  factions: FactionEntry[];
  questLog: QuestEntry[];
  loreNotes: string;
}

export interface LocationEntry {
  id: string;
  name: string;
  description: string;
  encounters?: string[];
  connectedLocations?: string[];
}

export interface NPCEntry {
  id: string;
  name: string;
  role: string;
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
  reputation: number;
}

export interface QuestEntry {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'complete' | 'failed' | 'abandoned';
  reward?: string;
  giver?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: string;
}

export interface DiceRoll {
  id: string;
  timestamp: string;
  expression: string;
  result: number;
  rolls: number[];
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

export interface GameSnapshot {
  snapshotId: string;
  campaignId: string;
  timestamp: string;
  character: CharacterState;
  worldLore: WorldLore;
  sessionHistory: SessionHistory;
  notes?: string;
}

export interface LayeredMemory {
  worldLoreLayer: WorldLore;
  characterStateLayer: CharacterState;
  sessionHistoryLayer: SessionHistory;
  gameSnapshotLayer: GameSnapshot[];
}

export interface RuleCheckResult {
  passed: boolean;
  dc?: number;
  roll?: number;
  bonus?: number;
  advantage?: boolean;
  disadvantage?: boolean;
  message: string;
}

export interface IntentParseResult {
  intent: 'chat' | 'roll' | 'spell-cast' | 'attack' | 'skill-check' | 'movement' | 'meta' | 'unknown';
  confidence: number;
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

export interface StoryCard {
  id: string;
  name: string;
  keywords: string[];
  body: string;
}

export interface MemoryNote {
  id: string;
  summary: string;
  tags: string[];
  turnNumber?: number;
}

export interface GameStoreState {
  character: CharacterState | null;
  worldLore: WorldLore | null;
  sessionHistory: SessionHistory | null;
  storyCards: StoryCard[];
  memories: MemoryNote[];
  isLoading: boolean;
  error: string | null;
  lastSavedAt: string | null;
  campaignTitle: string;
}

export interface GameStoreActions {
  loadGame(campaignId: string): Promise<void>;
  saveGame(): Promise<void>;
  createCharacter(character: CharacterState): void;
  updateCharacter(updates: Partial<CharacterState>): void;
  updateWorldLore(updates: Partial<WorldLore>): void;
  addStoryCard(card: StoryCard): void;
  removeStoryCard(id: string): void;
  addMemoryNote(note: MemoryNote): void;
  addChatMessage(message: ChatMessage): void;
  addDiceRoll(roll: DiceRoll): void;
  setCampaignTitle(title: string): void;
  resetAdventure(): void;
  loadFromLocalStorage(): void;
  undo(): void;
  redo(): void;
  setError(error: string | null): void;
}

export interface CampaignPresenterConfig {
  characterState: CharacterState;
  worldLore: WorldLore;
  sessionHistory?: SessionHistory;
  modelName?: string;
  ollamaBaseUrl?: string;
}

export interface PresenterOutput {
  intent: IntentParseResult;
  ruleChecks: RuleCheckResult[];
  multiOutput: MultiOutputPayload;
}
