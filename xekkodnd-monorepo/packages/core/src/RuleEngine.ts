/**
 * D&D 5e Rule Engine (0.5)
 * Pure TypeScript module implementing 20+ core D&D 5e rules
 * No dependencies, returns standardized RuleCheckResult
 */

import type { CharacterState, RuleCheckResult, AbilityScore, Condition } from './types';

/**
 * Roll a d20 with optional advantage/disadvantage
 */
function rollD20(advantage: boolean = false, disadvantage: boolean = false): number {
  const roll1 = Math.floor(Math.random() * 20) + 1;
  if (advantage) {
    const roll2 = Math.floor(Math.random() * 20) + 1;
    return Math.max(roll1, roll2);
  }
  if (disadvantage) {
    const roll2 = Math.floor(Math.random() * 20) + 1;
    return Math.min(roll1, roll2);
  }
  return roll1;
}

/**
 * Calculate ability modifier from ability score
 */
function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Core Rule Engine class
 */
export class RuleEngine {
  /**
   * Rule 1: Spell Slot Check
   * Verifies if a character has available spell slots of a given level
   */
  spellSlotCheck(character: CharacterState, spellLevel: number): RuleCheckResult {
    if (!character.spellSlots || character.spellSlots[spellLevel] === undefined) {
      return {
        passed: false,
        message: `Character has no spell slots of level ${spellLevel}.`,
      };
    }

    const slot = character.spellSlots[spellLevel];
    if (slot.used >= slot.max) {
      return {
        passed: false,
        message: `Spell slot level ${spellLevel} exhausted (${slot.used}/${slot.max}).`,
      };
    }

    return {
      passed: true,
      message: `Spell slot available (${slot.used + 1}/${slot.max}).`,
    };
  }

  /**
   * Rule 2: Armor Class (AC) Calculation
   * Computes final AC based on armor, DEX, and effects
   */
  acCalculation(
    character: CharacterState,
    baseAC: number,
    addDexModifier: boolean = true,
    hasShield: boolean = false,
    spellEffects: string[] = []
  ): RuleCheckResult {
    let finalAC = baseAC;

    if (addDexModifier) {
      finalAC += getModifier(character.abilityScores.DEX);
    }

    if (hasShield) {
      finalAC += 2;
    }

    // Simulate some spell effects (e.g., shield spell adds 5)
    if (spellEffects.includes('shield')) {
      finalAC += 5;
    }
    if (spellEffects.includes('barkskin')) {
      finalAC = Math.max(finalAC, 16);
    }

    return {
      passed: true,
      dc: finalAC,
      message: `AC calculated: ${finalAC} (base: ${baseAC}, DEX mod: ${
        addDexModifier ? getModifier(character.abilityScores.DEX) : 0
      }, shield: ${hasShield ? 2 : 0}).`,
    };
  }

  /**
   * Rule 3: Advantage/Disadvantage Check
   * Generic ability check with advantage or disadvantage
   */
  abilityCheck(
    character: CharacterState,
    ability: AbilityScore,
    dc: number,
    advantage: boolean = false,
    disadvantage: boolean = false,
    proficiencyBonus: number = 0
  ): RuleCheckResult {
    const modifier = getModifier(character.abilityScores[ability]);
    const totalModifier = modifier + proficiencyBonus;
    const roll = rollD20(advantage, disadvantage);
    const total = roll + totalModifier;
    const passed = total >= dc;

    return {
      passed,
      dc,
      roll,
      bonus: totalModifier,
      advantage,
      disadvantage,
      message: `${ability} Check: d20+${totalModifier} (${roll}+${totalModifier}=${total}) vs DC${dc} [${passed ? 'SUCCESS' : 'FAIL'}]`,
    };
  }

  /**
   * Rule 4: Attack Roll
   * Determines if an attack hits
   */
  attackRoll(
    character: CharacterState,
    targetAC: number,
    ability: AbilityScore = 'STR',
    weaponBonus: number = 0,
    advantage: boolean = false,
    disadvantage: boolean = false
  ): RuleCheckResult {
    const abilityMod = getModifier(character.abilityScores[ability]);
    const totalBonus = abilityMod + character.proficiencyBonus + weaponBonus;
    const roll = rollD20(advantage, disadvantage);
    const total = roll + totalBonus;
    const isHit = total >= targetAC;

    return {
      passed: isHit,
      dc: targetAC,
      roll,
      bonus: totalBonus,
      advantage,
      disadvantage,
      message: `Attack: d20+${totalBonus} (${roll}+${totalBonus}=${total}) vs AC${targetAC} [${isHit ? 'HIT' : 'MISS'}]`,
    };
  }

  /**
   * Rule 5: Saving Throw
   * Character makes a saving throw against an effect
   */
  savingThrow(
    character: CharacterState,
    ability: AbilityScore,
    dc: number,
    advantage: boolean = false,
    disadvantage: boolean = false
  ): RuleCheckResult {
    let modifier = getModifier(character.abilityScores[ability]);

    // Apply proficiency if character has it
    const savingThrowProf = character.savingThrows[ability];
    if (savingThrowProf) {
      modifier += character.proficiencyBonus;
    }

    const roll = rollD20(advantage, disadvantage);
    const total = roll + modifier;
    const passed = total >= dc;

    return {
      passed,
      dc,
      roll,
      bonus: modifier,
      message: `${ability} Save: d20+${modifier} (${roll}+${modifier}=${total}) vs DC${dc} [${passed ? 'SUCCESS' : 'FAIL'}]`,
    };
  }

  /**
   * Rule 6: Death Saving Throw
   * Returns a delta — caller must apply it to character state (no mutation).
   */
  deathSavingThrow(character: CharacterState): RuleCheckResult {
    const roll = rollD20(false, false);
    const success = roll >= 10;

    const successDelta = success ? 1 : 0;
    // Natural 1 counts as 2 failures
    const failureDelta = !success ? (roll === 1 ? 2 : 1) : 0;

    const newSuccesses = character.deathSaveSuccesses + successDelta;
    const newFailures = character.deathSaveFailures + failureDelta;
    const dead = newFailures >= 3;
    const stable = newSuccesses >= 3;

    return {
      passed: stable,
      roll,
      delta: {
        deathSaveSuccesses: newSuccesses,
        deathSaveFailures: newFailures,
      },
      message: `Death Save: ${roll} [${success ? 'SUCCESS' : 'FAILURE'}] (${newSuccesses}S / ${newFailures}F) ${dead ? '[DEAD]' : stable ? '[STABLE]' : ''}`,
    };
  }

  /**
   * Rule 7: Carrying Capacity
   * Checks if character can carry total weight
   */
  carryingCapacity(character: CharacterState, totalWeight: number): RuleCheckResult {
    const capacity = 15 * character.abilityScores.STR;
    const push_drag = 30 * character.abilityScores.STR;
    const passed = totalWeight <= capacity;

    return {
      passed,
      message: `Carrying: ${totalWeight}/${capacity} lbs. Push/Drag limit: ${push_drag} lbs. [${passed ? 'OK' : 'ENCUMBERED'}]`,
    };
  }

  /**
   * Rule 8: Skill Check
   * Generic skill check with proficiency and/or expertise
   */
  skillCheck(
    character: CharacterState,
    ability: AbilityScore,
    dc: number,
    hasProf: boolean = false,
    hasExpertise: boolean = false,
    advantage: boolean = false,
    disadvantage: boolean = false
  ): RuleCheckResult {
    const abilityMod = getModifier(character.abilityScores[ability]);
    let bonus = abilityMod;

    if (hasExpertise) {
      bonus += character.proficiencyBonus * 2;
    } else if (hasProf) {
      bonus += character.proficiencyBonus;
    }

    const roll = rollD20(advantage, disadvantage);
    const total = roll + bonus;
    const passed = total >= dc;

    return {
      passed,
      dc,
      roll,
      bonus,
      advantage,
      disadvantage,
      message: `Skill (${ability}): d20+${bonus} (${roll}+${bonus}=${total}) vs DC${dc} [${passed ? 'SUCCESS' : 'FAIL'}] ${hasExpertise ? '[EXPERTISE]' : hasProf ? '[PROFICIENT]' : ''}`,
    };
  }

  /**
   * Rule 9: Damage Reduction
   * Apply resistance/vulnerability/immunity to damage
   */
  damageReduction(
    damage: number,
    type: string,
    resistances: string[] = [],
    immunities: string[] = [],
    vulnerabilities: string[] = []
  ): RuleCheckResult {
    let finalDamage = damage;

    if (immunities.includes(type)) {
      finalDamage = 0;
      return {
        passed: true,
        message: `${type.toUpperCase()} damage immune: 0 damage taken.`,
      };
    }

    if (vulnerabilities.includes(type)) {
      finalDamage = damage * 2;
      return {
        passed: true,
        message: `${type.toUpperCase()} damage vulnerable: ${finalDamage} damage (doubled).`,
      };
    }

    if (resistances.includes(type)) {
      finalDamage = Math.ceil(damage / 2);
      return {
        passed: true,
        message: `${type.toUpperCase()} damage resistant: ${finalDamage} damage (halved).`,
      };
    }

    return {
      passed: true,
      message: `${type.toUpperCase()} damage: ${finalDamage} damage.`,
    };
  }

  /**
   * Rule 10: Hit Point Validation
   * Ensure HP is within valid range
   */
  hitPointValidation(character: CharacterState): RuleCheckResult {
    const issues: string[] = [];

    if (character.hitPoints > character.maxHitPoints + (character.temporaryHitPoints || 0)) {
      issues.push(`HP (${character.hitPoints}) exceeds max + temp.`);
    }

    if (character.hitPoints < 0) {
      issues.push(`HP cannot be negative.`);
    }

    if (character.maxHitPoints < 1) {
      issues.push(`Max HP must be at least 1.`);
    }

    const passed = issues.length === 0;
    return {
      passed,
      message: passed
        ? `HP valid: ${character.hitPoints}/${character.maxHitPoints} (+${character.temporaryHitPoints} temp).`
        : `HP issues: ${issues.join(' ')}`,
    };
  }

  /**
   * Rule 11: Level Range Validation
   */
  levelValidation(character: CharacterState): RuleCheckResult {
    const valid = character.level >= 1 && character.level <= 20;
    return {
      passed: valid,
      message: valid ? `Level valid: ${character.level}.` : `Level ${character.level} out of range (1-20).`,
    };
  }

  /**
   * Rule 12: Inspiration Validation
   */
  inspirationValidation(character: CharacterState): RuleCheckResult {
    const valid = character.inspiration >= 0;
    return {
      passed: valid,
      message: valid ? `Inspiration valid: ${character.inspiration}.` : `Inspiration cannot be negative.`,
    };
  }

  /**
   * Rule 13: Condition Application
   * Returns a delta — caller applies new conditions array (no mutation).
   */
  applyCondition(character: CharacterState, condition: Condition): RuleCheckResult {
    if (!character.conditions.includes(condition)) {
      return {
        passed: true,
        delta: { conditions: [...character.conditions, condition] },
        message: `Condition applied: ${condition}.`,
      };
    }
    return {
      passed: false,
      message: `Condition already present: ${condition}.`,
    };
  }

  /**
   * Rule 14: Concentration Check
   * Character makes concentration save (e.g., when taking damage)
   */
  concentrationCheck(character: CharacterState, damageAmount: number): RuleCheckResult {
    const dc = Math.max(10, Math.ceil(damageAmount / 2));
    return this.savingThrow(character, 'CON', dc);
  }

  /**
   * Rule 15: Advantage Eligibility
   * Determine if character qualifies for advantage
   */
  checkAdvantageEligibility(
    character: CharacterState,
    reason: string = 'unknown'
  ): RuleCheckResult {
    const hasInspiration = character.inspiration > 0;
    return {
      passed: hasInspiration,
      message: hasInspiration
        ? `Advantage eligible (${reason}): Can use Inspiration.`
        : `No Inspiration available for advantage.`,
    };
  }

  /**
   * Rule 16: Range Check (ranged attack)
   */
  rangeCheck(currentDistance: number, normalRange: number, maxRange: number): RuleCheckResult {
    const inNormalRange = currentDistance <= normalRange;
    const inMaxRange = currentDistance <= maxRange;

    if (inNormalRange) {
      return {
        passed: true,
        message: `Target in normal range (${currentDistance}/${normalRange} ft).`,
      };
    } else if (inMaxRange) {
      return {
        passed: true,
        dc: 5, // disadvantage at long range
        message: `Target in long range (${currentDistance}/${maxRange} ft) [DISADVANTAGE].`,
      };
    }

    return {
      passed: false,
      message: `Target out of range (${currentDistance}/${maxRange} ft).`,
    };
  }

  /**
   * Rule 17: Action Economy
   * Tracks actions, bonus actions, reaction per turn
   */
  actionEconomyCheck(
    actionsUsed: number = 0,
    bonusActionsUsed: number = 0,
    reactionUsed: boolean = false
  ): RuleCheckResult {
    const issues: string[] = [];

    if (actionsUsed > 1) issues.push(`Used ${actionsUsed} actions (max 1).`);
    if (bonusActionsUsed > 1) issues.push(`Used ${bonusActionsUsed} bonus actions (max 1).`);
    if (reactionUsed) issues.push(`Reaction already used.`);

    return {
      passed: issues.length === 0,
      message: issues.length === 0 ? `Action economy valid.` : `Economy issues: ${issues.join(' ')}`,
    };
  }

  /**
   * Rule 18: Experience Required for Level
   */
  experienceForLevel(level: number): number {
    const xpTable = [
      0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000,
      140000, 165000, 195000, 225000, 265000, 305000, 355000,
    ];
    return xpTable[Math.min(level, 20)];
  }

  /**
   * Rule 19: Level Up Eligibility
   */
  levelUpCheck(character: CharacterState): RuleCheckResult {
    if (character.level >= 20) {
      return {
        passed: false,
        message: `Character already at max level (20).`,
      };
    }

    const xpNeeded = this.experienceForLevel(character.level + 1);
    const eligible = character.experience >= xpNeeded;

    return {
      passed: eligible,
      message: eligible
        ? `Ready to level up (${character.experience}/${xpNeeded} XP).`
        : `XP needed for level ${character.level + 1}: ${xpNeeded - character.experience} more.`,
    };
  }

  /**
   * Rule 20: Proficiency Bonus by Level
   */
  getProficiencyBonus(level: number): number {
    if (level < 5) return 2;
    if (level < 9) return 3;
    if (level < 13) return 4;
    if (level < 17) return 5;
    return 6;
  }

  /**
   * Rule 21: Encumbrance State
   */
  encumbranceState(totalWeight: number, strScore: number): RuleCheckResult {
    const capacity = 15 * strScore;
    const heavilyEncumbered = totalWeight > capacity;
    const encumbered = totalWeight > capacity / 2;

    if (heavilyEncumbered) {
      return {
        passed: false,
        message: `HEAVILY ENCUMBERED: ${totalWeight}/${capacity} lbs. Speed halved, disadvantage on STR/DEX checks.`,
      };
    }

    if (encumbered) {
      return {
        passed: true,
        message: `Encumbered: ${totalWeight}/${capacity} lbs. Speed reduced by 10 ft.`,
      };
    }

    return {
      passed: true,
      message: `Normal carrying capacity: ${totalWeight}/${capacity} lbs.`,
    };
  }

  /**
   * Rule 22: Prone/Standing Mechanics
   * Returns a delta — caller applies new conditions array (no mutation).
   */
  toggleProne(character: CharacterState): RuleCheckResult {
    const isProne = character.conditions.includes('prone');

    if (isProne) {
      return {
        passed: true,
        delta: { conditions: character.conditions.filter((c) => c !== 'prone') },
        message: `Character stood up.`,
      };
    }

    return {
      passed: true,
      delta: { conditions: [...character.conditions, 'prone'] },
      message: `Character knocked prone.`,
    };
  }
}

/**
 * Export singleton instance
 */
export const ruleEngine = new RuleEngine();
