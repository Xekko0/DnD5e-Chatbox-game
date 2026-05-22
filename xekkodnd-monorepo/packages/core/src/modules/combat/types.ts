/**
 * Combat Module Types
 * SRD 5.2 ref: "Combat"
 */

import type { D20Result, DamageRoll } from '../dice/types';

// ─── Weapon ──────────────────────────────────────────────────────────────────

export type DamageType =
  | 'slashing' | 'piercing' | 'bludgeoning'
  | 'fire' | 'cold' | 'lightning' | 'thunder' | 'acid'
  | 'radiant' | 'necrotic' | 'psychic' | 'force' | 'poison';

export type WeaponProperty =
  | 'finesse' | 'light' | 'heavy' | 'reach' | 'thrown'
  | 'two_handed' | 'versatile' | 'ammunition' | 'loading';

export interface Weapon {
  id: string;
  name: string;
  /** Dice notation, vd: "1d8" */
  damageDice: string;
  damageType: DamageType;
  properties: WeaponProperty[];
  /** Normal range (ft) — null cho melee */
  normalRange?: number;
  /** Long range (ft) — attack with disadvantage */
  longRange?: number;
  /** Melee reach (default 5ft, Reach property = 10ft) */
  reach?: number;
  /** Magical bonus (+1, +2, +3) */
  magicalBonus?: number;
  /** Versatile damage khi cầm 2 tay */
  versatileDice?: string;
}

// ─── Combat entities (minimal, không dùng full entity) ────────────────────────

export interface CombatantStats {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  speed: number;
  /** STR modifier (melee) */
  strMod: number;
  /** DEX modifier (ranged/finesse) */
  dexMod: number;
  proficiencyBonus: number;
  /** Proficient với vũ khí đang dùng? */
  isProficient?: boolean;
}

// ─── Combat State machine ─────────────────────────────────────────────────────

export type CombatPhase = 'not_started' | 'initiative' | 'active' | 'ended';

export interface InitiativeEntry {
  entityId: string;
  name: string;
  initiativeRoll: number;
  initiativeTotal: number;
  dexMod: number;
  isPlayer: boolean;
  isAlive: boolean;
}

export interface CombatState {
  adventureId: string;
  phase: CombatPhase;
  roundNumber: number;
  /** Danh sách entity theo thứ tự initiative (đã sort) */
  initiativeOrder: InitiativeEntry[];
  /** Index trong initiativeOrder của entity đang đến lượt */
  currentTurnIndex: number;
  /** entityId đang đến lượt */
  currentEntityId: string;
  startedAt: string;
}

// ─── Attack Result ────────────────────────────────────────────────────────────

export type AttackOutcome = 'hit' | 'miss' | 'critical_hit' | 'critical_miss';

export interface AttackResult {
  attackerId: string;
  targetId: string;
  weapon: Weapon;
  attackRoll: D20Result;
  outcome: AttackOutcome;
  /** Damage roll (chỉ có nếu hit) */
  damageRoll?: DamageRoll;
  /** HP thực sự mất sau resistance/immunity */
  actualDamage?: number;
  /** HP mới của target sau khi nhận damage */
  targetHpAfter?: number;
  targetKilled?: boolean;
}

// ─── Result Object (V6 §5.3) ─────────────────────────────────────────────────

export type StepActionType =
  | 'move' | 'attack' | 'cast_spell' | 'skill_check'
  | 'saving_throw' | 'use_item' | 'rest' | 'talk' | 'examine';

export interface ResultStep {
  stepNumber: number;
  actionType: StepActionType;
  actorId: string;
  result: Record<string, unknown>;
  /** Events emitted bởi step này */
  events: string[];
  /** State changes cụ thể */
  stateChanges: Array<{
    entityId: string;
    field: string;
    from: unknown;
    to: unknown;
  }>;
}

export type DramaticMomentum =
  | 'aggressive_offensive'
  | 'defensive'
  | 'desperate'
  | 'triumphant'
  | 'neutral'
  | 'tense';

export interface NarrativeHints {
  tone: string;
  length: 'short' | 'medium' | 'long';
  mustMention: string[];
  mustNotSay: string[];
}

export interface ResultObject {
  type: 'single' | 'sequence';
  sequenceId: string;
  actorId: string;
  adventureId: string;
  turnNumber: number;
  steps: ResultStep[];
  dramaticContext: {
    momentum: DramaticMomentum;
    isKill: boolean;
    isFirstHitOfCombat: boolean;
    isFinishingBlow: boolean;
    actorResourcesChanged: boolean;
    sceneChange?: string;
  };
  narrativeHints: NarrativeHints;
}
