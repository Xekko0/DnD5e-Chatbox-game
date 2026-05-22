/**
 * Combat Module
 * SRD 5.2 ref: "Combat" — Initiative, Making an Attack, Damage
 * Pure functions, no DB/side effects. Caller emits events & updates DB.
 */

import { rollD20, rollDamage, resolveAdvantageState } from '../dice/dice';
import type { AdvantageState } from '../dice/types';
import type {
  CombatantStats,
  CombatState,
  InitiativeEntry,
  AttackResult,
  AttackOutcome,
  Weapon,
  ResultObject,
  ResultStep,
  DramaticMomentum,
} from './types';

// ─── Initiative ───────────────────────────────────────────────────────────────

/**
 * Roll initiative cho tất cả combatants
 * SRD: "initiative = d20 + Dexterity modifier"
 * Sort descending. Ties: random (code không prompt UI vì solo game)
 */
export function rollInitiative(
  combatants: CombatantStats[],
  adventureId: string
): CombatState {
  const entries: InitiativeEntry[] = combatants.map((c) => {
    const roll = rollD20(c.dexMod);
    return {
      entityId: c.id,
      name: c.name,
      initiativeRoll: roll.roll,
      initiativeTotal: roll.total,
      dexMod: c.dexMod,
      isPlayer: c.id.startsWith('player'),
      isAlive: c.hp > 0,
    };
  });

  // Sort by total desc, tiebreak bằng dexMod, rồi random
  entries.sort((a, b) => {
    if (b.initiativeTotal !== a.initiativeTotal) return b.initiativeTotal - a.initiativeTotal;
    if (b.dexMod !== a.dexMod) return b.dexMod - a.dexMod;
    return Math.random() - 0.5;
  });

  return {
    adventureId,
    phase: 'active',
    roundNumber: 1,
    initiativeOrder: entries,
    currentTurnIndex: 0,
    currentEntityId: entries[0]?.entityId ?? '',
    startedAt: new Date().toISOString(),
  };
}

/**
 * Chuyển sang lượt tiếp theo
 * Skip entities đã chết. Khi hết vòng: roundNumber++
 */
export function advanceTurn(state: CombatState): CombatState {
  const alive = state.initiativeOrder.filter((e) => e.isAlive);
  if (alive.length === 0) {
    return { ...state, phase: 'ended' };
  }

  let nextIndex = (state.currentTurnIndex + 1) % state.initiativeOrder.length;
  let loopGuard = 0;

  // Skip dead entities
  while (!state.initiativeOrder[nextIndex].isAlive && loopGuard < state.initiativeOrder.length) {
    nextIndex = (nextIndex + 1) % state.initiativeOrder.length;
    loopGuard++;
  }

  const isNewRound = nextIndex <= state.currentTurnIndex;

  return {
    ...state,
    currentTurnIndex: nextIndex,
    currentEntityId: state.initiativeOrder[nextIndex].entityId,
    roundNumber: isNewRound ? state.roundNumber + 1 : state.roundNumber,
  };
}

// ─── AC Computation ──────────────────────────────────────────────────────────

/**
 * Tính AC cuối cùng của target (bao gồm cover, dodge effect)
 * SRD ref: "Armor Class"
 */
export function computeEffectiveAC(
  target: CombatantStats,
  coverBonus: 0 | 2 | 5 = 0,
  targetIsDodging: boolean = false
): number {
  return target.ac + coverBonus;
  // Dodge không thay đổi AC mà cho attackers disadvantage — handled ở makeAttack
  void targetIsDodging;
}

// ─── Making an Attack ────────────────────────────────────────────────────────

/**
 * Thực hiện attack roll đầy đủ
 * SRD: "Attack Roll = d20 + ability_modifier + proficiency_bonus + magical_bonus"
 * Natural 20 = Critical Hit, Natural 1 = Critical Miss (auto miss)
 */
export function makeAttack(
  attacker: CombatantStats,
  target: CombatantStats,
  weapon: Weapon,
  options: {
    advantageSources?: number;
    disadvantageSources?: number;
    coverBonus?: 0 | 2 | 5;
    targetIsDodging?: boolean;
    isTwoHanded?: boolean;
  } = {}
): AttackResult {
  const {
    advantageSources = 0,
    disadvantageSources = 0,
    coverBonus = 0,
    targetIsDodging = false,
  } = options;

  // Dodge: adds 1 disadvantage source
  const totalDisadvantage = disadvantageSources + (targetIsDodging ? 1 : 0);
  const advantage: AdvantageState = resolveAdvantageState(advantageSources, totalDisadvantage);

  // Attack modifier
  const isMelee = !weapon.normalRange;
  let abilityMod: number;

  if (weapon.properties.includes('finesse')) {
    // Finesse: chọn STR hoặc DEX cao hơn
    abilityMod = Math.max(attacker.strMod, attacker.dexMod);
  } else if (isMelee) {
    abilityMod = attacker.strMod;
  } else {
    abilityMod = attacker.dexMod;
  }

  const profBonus = attacker.isProficient !== false ? attacker.proficiencyBonus : 0;
  const magicBonus = weapon.magicalBonus ?? 0;
  const totalAttackMod = abilityMod + profBonus + magicBonus;

  const attackRoll = rollD20(totalAttackMod, advantage);
  const effectiveAC = computeEffectiveAC(target, coverBonus);

  // Determine outcome
  let outcome: AttackOutcome;
  if (attackRoll.isCriticalHit) {
    outcome = 'critical_hit';
  } else if (attackRoll.isCriticalMiss) {
    outcome = 'critical_miss';
  } else if (attackRoll.total >= effectiveAC) {
    outcome = 'hit';
  } else {
    outcome = 'miss';
  }

  // Roll damage if hit
  if (outcome === 'hit' || outcome === 'critical_hit') {
    const isCrit = outcome === 'critical_hit';
    const damageDice =
      options.isTwoHanded && weapon.versatileDice
        ? weapon.versatileDice
        : weapon.damageDice;

    // Damage notation: dice + ability_mod + magic_bonus
    // parseDiceNotation handles modifier separately
    const damageNotation = damageDice; // modifier applied separately
    const damageRoll = rollDamage(damageNotation, isCrit, weapon.damageType);

    // Add modifiers manually (ability + magic)
    const finalDamage = Math.max(0, damageRoll.total + abilityMod + magicBonus);

    const newHp = Math.max(0, target.hp - finalDamage);

    return {
      attackerId: attacker.id,
      targetId: target.id,
      weapon,
      attackRoll,
      outcome,
      damageRoll: { ...damageRoll, total: finalDamage },
      actualDamage: finalDamage,
      targetHpAfter: newHp,
      targetKilled: newHp <= 0,
    };
  }

  return {
    attackerId: attacker.id,
    targetId: target.id,
    weapon,
    attackRoll,
    outcome,
  };
}

// ─── Result Object Builder ────────────────────────────────────────────────────

let _seqCounter = 0;

/**
 * Build Result Object từ AttackResult
 * Result Object là input cho Narrator LLM
 */
export function buildAttackResultObject(
  attackResult: AttackResult,
  adventureId: string,
  turnNumber: number,
  isFirstHitOfCombat: boolean = false
): ResultObject {
  const isKill = attackResult.targetKilled ?? false;
  const isHit = attackResult.outcome === 'hit' || attackResult.outcome === 'critical_hit';
  const isCrit = attackResult.outcome === 'critical_hit';

  const stateChanges = [];
  if (isHit && attackResult.actualDamage !== undefined) {
    stateChanges.push({
      entityId: attackResult.targetId,
      field: 'hp',
      from: (attackResult.targetHpAfter ?? 0) + (attackResult.actualDamage ?? 0),
      to: attackResult.targetHpAfter ?? 0,
    });
    if (isKill) {
      stateChanges.push({
        entityId: attackResult.targetId,
        field: 'isAlive',
        from: true,
        to: false,
      });
    }
  }

  const events: string[] = [];
  if (isHit) events.push('entity_damaged');
  if (isKill) events.push('entity_died');
  if (isCrit) events.push('critical_hit');

  const step: ResultStep = {
    stepNumber: 1,
    actionType: 'attack',
    actorId: attackResult.attackerId,
    result: {
      weapon: attackResult.weapon.name,
      target: attackResult.targetId,
      attackRoll: attackResult.attackRoll.total,
      vsAC: attackResult.weapon.normalRange
        ? undefined
        : (attackResult.targetHpAfter !== undefined
            ? (attackResult.targetHpAfter + (attackResult.actualDamage ?? 0))
            : undefined),
      hit: isHit,
      critical: isCrit,
      damage: attackResult.actualDamage,
      targetHpAfter: attackResult.targetHpAfter,
      outcome: attackResult.outcome,
    },
    events,
    stateChanges,
  };

  let momentum: DramaticMomentum = 'neutral';
  if (isKill) momentum = 'triumphant';
  else if (isCrit) momentum = 'aggressive_offensive';
  else if (!isHit) momentum = 'tense';

  return {
    type: 'single',
    sequenceId: `seq_${++_seqCounter}`,
    actorId: attackResult.attackerId,
    adventureId,
    turnNumber,
    steps: [step],
    dramaticContext: {
      momentum,
      isKill,
      isFirstHitOfCombat,
      isFinishingBlow: isKill,
      actorResourcesChanged: true,
      sceneChange: isKill ? `1 enemy eliminated` : undefined,
    },
    narrativeHints: {
      tone: isKill ? 'triumphant_kill' : isCrit ? 'dramatic_crit' : isHit ? 'tense_combat' : 'miss',
      length: isCrit || isKill ? 'long' : 'medium',
      mustMention: isHit
        ? [`${attackResult.weapon.name} connected`, ...(isKill ? [`${attackResult.targetId} died`] : [])]
        : [`attack missed`],
      mustNotSay: isKill
        ? []
        : [`all enemies dead`, `won the fight`],
    },
  };
}

// ─── Combat End Detection ────────────────────────────────────────────────────

/**
 * Kiểm tra combat đã kết thúc chưa
 * SRD: combat ends khi 1 bên không còn ai sống
 */
export function checkCombatEnd(state: CombatState): 'ongoing' | 'players_win' | 'players_lose' {
  const alive = state.initiativeOrder.filter((e) => e.isAlive);
  const playersAlive = alive.some((e) => e.isPlayer);
  const enemiesAlive = alive.some((e) => !e.isPlayer);

  if (!playersAlive) return 'players_lose';
  if (!enemiesAlive) return 'players_win';
  return 'ongoing';
}
