/**
 * Quest types — PLAN_V5 §4.6 (Trụ 6: Quest Journal & Branching)
 */

// ─── Enums / unions ───────────────────────────────────────────────────────────

export type QuestType = 'main' | 'side' | 'personal' | 'faction' | 'hidden';

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'abandoned' | 'hidden';

export type ObjectiveType =
  | 'kill'
  | 'fetch'
  | 'talk'
  | 'reach'
  | 'survive'
  | 'protect'
  | 'discover'
  | 'use';

export type ObjectiveStatus = 'incomplete' | 'completed' | 'failed' | 'optional_missed';

export type BranchType = 'outcome' | 'choice' | 'hidden';

export type DiscoverySource =
  | 'npc_offer'
  | 'letter'
  | 'rumor'
  | 'bulletin_board'
  | 'ai_procedural'
  | 'campaign_script'
  | 'consequence';

// ─── Quest objective ──────────────────────────────────────────────────────────

export interface QuestObjective {
  id: string;
  questId: string;
  type: ObjectiveType;
  description: string;
  status: ObjectiveStatus;
  isOptional: boolean;
  order: number;

  /** Dữ liệu auto-detect qua Event Bus */
  targetEntityId?: string;
  targetItemId?: string;
  targetLocationId?: string;
  targetNpcId?: string;
  requiredQuantity?: number;
  currentQuantity?: number;

  completedAt?: string;
}

// ─── Quest branch ─────────────────────────────────────────────────────────────

export interface QuestBranch {
  id: string;
  questId: string;
  type: BranchType;
  description: string;
  triggerCondition?: string;
  /** Reward nếu chọn branch này */
  reward?: QuestReward;
  /** Quest unlock sau khi chọn branch */
  unlocksQuestId?: string;
  /** Objectives của branch */
  objectiveIds?: string[];
  isChosen: boolean;
  chosenAt?: string;
}

// ─── Quest reward ─────────────────────────────────────────────────────────────

export interface QuestReward {
  xp?: number;
  gold?: number;
  items?: string[];
  reputation?: { factionId: string; delta: number }[];
  description?: string;
}

// ─── Main quest ───────────────────────────────────────────────────────────────

export interface Quest {
  id: string;
  adventureId: string;
  type: QuestType;
  status: QuestStatus;
  title: string;
  description: string;
  flavor?: string;

  /** Quest chain / arc */
  arcId?: string;
  prerequisiteQuestIds?: string[];
  unlocksQuestIds?: string[];

  discoverySource?: DiscoverySource;
  giverEntityId?: string;
  giverName?: string;

  reward?: QuestReward;
  failureReward?: QuestReward;

  /** Deadline tính theo in-game days */
  deadlineDay?: number;
  failureConditions?: string[];

  discoveredAt?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
}

// ─── Quest event log ──────────────────────────────────────────────────────────

export interface QuestEvent {
  id: string;
  questId: string;
  adventureId: string;
  type: 'discovered' | 'started' | 'objective_completed' | 'branch_chosen' | 'completed' | 'failed' | 'note';
  description: string;
  turnNumber?: number;
  timestamp: string;
}
