/**
 * Dice Module — SRD 5.2
 * Pure functions, deterministic khi seed được cung cấp (cho test)
 * SRD ref: "Using Ability Scores" §Advantage and Disadvantage
 */

import type { D20Result, DamageRoll, DiceNotation, DiceSides, AdvantageState } from './types';

// ─── Internal RNG (swappable cho test) ───────────────────────────────────────

let _rng: () => number = Math.random;

/** Override RNG cho unit test (deterministic seed) */
export function setRng(rng: () => number): void {
  _rng = rng;
}

/** Reset về Math.random */
export function resetRng(): void {
  _rng = Math.random;
}

// ─── Core roll functions ──────────────────────────────────────────────────────

/**
 * Roll một dice bất kỳ
 * @returns số nguyên từ 1 đến sides
 */
export function rollDie(sides: DiceSides): number {
  return Math.floor(_rng() * sides) + 1;
}

/**
 * Roll nhiều dice cùng loại
 * @returns mảng kết quả từng dice
 */
export function rollDice(count: number, sides: DiceSides): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(rollDie(sides));
  }
  return results;
}

// ─── D20 System (SRD core) ────────────────────────────────────────────────────

/**
 * Giải quyết advantage/disadvantage stacking theo SRD:
 * "If circumstances cause a roll to have both advantage and disadvantage,
 * you are considered to have neither of them, and you roll one d20."
 *
 * @param advantageSources số nguồn cho advantage
 * @param disadvantageSources số nguồn cho disadvantage
 */
export function resolveAdvantageState(
  advantageSources: number,
  disadvantageSources: number
): AdvantageState {
  const hasAdv = advantageSources > 0;
  const hasDis = disadvantageSources > 0;
  // Advantage + Disadvantage = cancel out (bất kể số lượng)
  if (hasAdv && hasDis) return 'normal';
  if (hasAdv) return 'advantage';
  if (hasDis) return 'disadvantage';
  return 'normal';
}

/**
 * Roll d20 với advantage/disadvantage + modifiers
 * SRD ref: "Using Ability Scores" > d20 Tests
 *
 * @param modifier tổng modifier (ability mod + prof + situational)
 * @param advantage state sau khi resolveAdvantageState()
 */
export function rollD20(modifier: number = 0, advantage: AdvantageState = 'normal'): D20Result {
  let roll1 = rollDie(20);
  let finalRoll: number;
  let rolls: [number, number] | [number];

  if (advantage === 'advantage') {
    const roll2 = rollDie(20);
    rolls = [roll1, roll2];
    finalRoll = Math.max(roll1, roll2);
  } else if (advantage === 'disadvantage') {
    const roll2 = rollDie(20);
    rolls = [roll1, roll2];
    finalRoll = Math.min(roll1, roll2);
  } else {
    rolls = [roll1];
    finalRoll = roll1;
  }

  return {
    roll: finalRoll,
    total: finalRoll + modifier,
    modifier,
    advantage,
    isCriticalHit: finalRoll === 20,
    isCriticalMiss: finalRoll === 1,
    rolls,
  };
}

// ─── Dice Notation Parser ─────────────────────────────────────────────────────

/**
 * Parse dice notation string thành structured object
 * Hỗ trợ: "d20", "1d8", "2d6+3", "1d4-1", "3d6"
 */
export function parseDiceNotation(notation: string): DiceNotation {
  const cleaned = notation.toLowerCase().trim().replace(/\s/g, '');

  // Match: optional_count d sides optional_modifier
  // Ví dụ: "2d6+3", "d20", "1d8-1"
  const match = cleaned.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`[Dice] Invalid notation: "${notation}"`);
  }

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10) as DiceSides;
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  const validSides: DiceSides[] = [4, 6, 8, 10, 12, 20, 100];
  if (!validSides.includes(sides)) {
    throw new Error(`[Dice] Unsupported die: d${sides}. Valid: ${validSides.join(', ')}`);
  }

  return { count, sides, modifier };
}

// ─── Damage Roll ──────────────────────────────────────────────────────────────

/**
 * Roll damage từ notation string
 * SRD ref: "Damage Rolls" > "Critical Hits"
 * Critical hit: double the dice (NOT modifier)
 *
 * @param notation vd: "1d8+3", "2d6", "1d4+2"
 * @param isCritical nếu true: double số dice trước khi roll
 * @param damageType vd: "slashing", "fire", "piercing"
 */
export function rollDamage(
  notation: string,
  isCritical: boolean = false,
  damageType?: string
): DamageRoll {
  const parsed = parseDiceNotation(notation);
  // SRD: Critical hit = roll damage dice twice (double count, NOT modifier)
  const diceCount = isCritical ? parsed.count * 2 : parsed.count;
  const dice = rollDice(diceCount, parsed.sides);
  const total = Math.max(0, dice.reduce((sum, d) => sum + d, 0) + parsed.modifier);

  return {
    notation,
    dice,
    modifier: parsed.modifier,
    total,
    isCritical,
    damageType,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Roll 4d6 drop lowest — phương pháp tạo ability score
 * SRD ref: "Character Creation" > "Generating Ability Scores"
 */
export function roll4d6DropLowest(): number {
  const rolls = rollDice(4, 6);
  const sorted = [...rolls].sort((a, b) => a - b);
  sorted.shift(); // bỏ thấp nhất
  return sorted.reduce((sum, n) => sum + n, 0);
}

/**
 * Roll ability scores cho cả 6 stats (Random method)
 */
export function rollAbilityScores(): number[] {
  return Array.from({ length: 6 }, () => roll4d6DropLowest());
}

/**
 * Standard Array theo SRD: [15, 14, 13, 12, 10, 8]
 */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

/**
 * Tóm tắt roll thành string đẹp cho UI
 * Ví dụ: "🎲 d20+5 = (17)+5 = 22 ✓ HIT" 
 */
export function formatD20Result(result: D20Result, hitOrDc?: string): string {
  const advLabel =
    result.advantage === 'advantage'
      ? ` [ADV: ${result.rolls.join(', ')}]`
      : result.advantage === 'disadvantage'
        ? ` [DIS: ${result.rolls.join(', ')}]`
        : '';
  const modStr = result.modifier >= 0 ? `+${result.modifier}` : `${result.modifier}`;
  const critStr = result.isCriticalHit ? ' 💥 CRIT!' : result.isCriticalMiss ? ' 💀 FUMBLE' : '';
  return `🎲 d20${modStr} = ${result.roll}${modStr} = **${result.total}**${advLabel}${critStr}${hitOrDc ? ` (${hitOrDc})` : ''}`;
}

export function formatDamageRoll(result: DamageRoll): string {
  const critLabel = result.isCritical ? ' [CRIT 2× dice]' : '';
  const typeLabel = result.damageType ? ` ${result.damageType}` : '';
  return `⚔ ${result.notation}${critLabel} = [${result.dice.join('+')}]${result.modifier !== 0 ? (result.modifier > 0 ? '+' + result.modifier : result.modifier) : ''} = **${result.total}**${typeLabel}`;
}
