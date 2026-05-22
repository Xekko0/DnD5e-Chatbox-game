/**
 * Dice Module Types
 * SRD 5.2 ref: "Using Ability Scores" > "Advantage and Disadvantage"
 */

export type DiceSides = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export type AdvantageState = 'normal' | 'advantage' | 'disadvantage';

export interface SingleRoll {
  /** Giá trị dice thực sự trước khi cộng modifier */
  value: number;
  sides: DiceSides;
}

export interface D20Result {
  /** Giá trị dice (1-20) */
  roll: number;
  /** roll + tất cả modifiers */
  total: number;
  /** Modifiers tổng cộng */
  modifier: number;
  advantage: AdvantageState;
  /** Natural 20 — auto hit / max effect */
  isCriticalHit: boolean;
  /** Natural 1 — auto miss */
  isCriticalMiss: boolean;
  /** Nếu advantage/disadvantage: cả 2 dice để hiển thị */
  rolls: [number, number] | [number];
}

export interface DamageRoll {
  /** Notation gốc, vd: "2d6+3" */
  notation: string;
  /** Từng dice roll */
  dice: number[];
  /** Modifier cộng vào */
  modifier: number;
  /** Tổng cuối = sum(dice) + modifier */
  total: number;
  /** Nếu critical hit: dice được nhân đôi */
  isCritical: boolean;
  /** Damage type (slashing/piercing/...) */
  damageType?: string;
}

export interface DiceNotation {
  count: number;
  sides: DiceSides;
  modifier: number;
  /** Notation đã parse, vd: { count: 2, sides: 6, modifier: 3 } cho "2d6+3" */
}
