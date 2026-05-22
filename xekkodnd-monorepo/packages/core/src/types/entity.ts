/**
 * Entity types — PLAN_V5 §4.2 (Trụ 2: Character Sheet 2-Tier)
 * Schema dùng chung cho mọi entity: player, major_npc, minor_npc,
 * monster, boss, pet, hireling, familiar, mount, object
 */

import type { AbilityScore, Condition, Skill } from './index';

// ─── Entity type ────────────────────────────────────────────────────────────

export type EntityType =
  | 'player'
  | 'major_npc'
  | 'minor_npc'
  | 'monster'
  | 'boss'
  | 'pet'
  | 'hireling'
  | 'familiar'
  | 'mount'
  | 'object';

// ─── Base entity (mọi entity đều có) ────────────────────────────────────────

export interface BaseEntity {
  id: string;
  adventureId: string;
  type: EntityType;
  name: string;
  race?: string;
  class?: string;
  level: number;

  /** Sức sống */
  hitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;

  /** Combat */
  armorClass: number;
  speed: number;
  proficiencyBonus: number;
  inspiration: number;

  abilityScores: {
    STR: number; DEX: number; CON: number;
    INT: number; WIS: number; CHA: number;
  };

  conditions: Condition[];
  deathSaveSuccesses: number;
  deathSaveFailures: number;

  createdAt: string;
  updatedAt: string;
}

// ─── Player entity ───────────────────────────────────────────────────────────

export interface PlayerEntity extends BaseEntity {
  type: 'player';
  background: string;
  alignment: string;
  experience: number;
  savingThrows: Partial<Record<AbilityScore, number>>;
  skillProficiencies: Partial<Record<Skill, boolean>>;
  skillExpertise: Partial<Record<Skill, boolean>>;
  spellSlots?: Record<number, { used: number; max: number }>;
  ki?: number;
  sorceryPoints?: number;
  channelDivinity?: number;
}

// ─── NPC entity ──────────────────────────────────────────────────────────────

export type NpcRelationship = 'friendly' | 'neutral' | 'hostile' | 'unknown';

export interface NpcPersonality {
  traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
  voice?: string;
  mannerisms?: string;
}

export interface NpcEntity extends BaseEntity {
  type: 'major_npc' | 'minor_npc';
  role: string;
  description: string;
  relationship: NpcRelationship;
  personality?: NpcPersonality;
  locationId?: string;
  isAlive: boolean;
  /** M2: Knowledge với privacy levels */
  publicKnowledge?: string;
  privateKnowledge?: string;
  secretKnowledge?: string;
}

// ─── Monster entity ───────────────────────────────────────────────────────────

export interface MonsterAttack {
  name: string;
  toHit: number;
  damage: string;
  damageType: string;
  range?: string;
}

export interface MonsterEntity extends BaseEntity {
  type: 'monster' | 'boss';
  challengeRating: number;
  xpReward: number;
  attacks: MonsterAttack[];
  legendaryActions?: number;
  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
  specialAbilities?: string[];
  lootTableId?: string;
}

// ─── Computed stats (cache sau khi Stat Calculator chạy) ──────────────────────

export interface ComputedStats {
  entityId: string;
  finalAC: number;
  finalSpeed: number;
  attackBonus: number;
  spellSaveDC?: number;
  passivePerception: number;
  computedAt: string;
}
